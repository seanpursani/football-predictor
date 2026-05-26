import '../src/lib/sentry';
import '../global.css';

import {QueryClientProvider} from '@tanstack/react-query';
import {ThemeProvider} from '@react-navigation/native';
import {useFonts} from 'expo-font';
import {Redirect, Stack} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import {StatusBar} from 'expo-status-bar';
import {useCallback, useEffect, useState} from 'react';
import {Text, View} from 'react-native';
import 'react-native-reanimated';
import * as Sentry from '@sentry/react-native';

import {NavigationTheme} from '@/constants/theme';
import {FONT_MAP} from '@/src/lib/fonts';
import {queryClient} from '@/src/lib/queryClient';
import {useAuthState} from '@/src/hooks/useAuthState';
import {useUpsertUserMutation, useUserQuery} from '@/src/queries/useUserQuery';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
    anchor: '(tabs)',
};

function ErrorFallback() {
    return (
        <View style={{flex: 1, backgroundColor: '#080808', alignItems: 'center', justifyContent: 'center'}}>
            <Text style={{color: '#FFFFFF', fontSize: 15}}>
                Something went wrong — please restart the app.
            </Text>
        </View>
    );
}

function AuthGate() {
    const {session, isLoading: authLoading} = useAuthState();
    const {mutateAsync: upsertUser} = useUpsertUserMutation();
    const {data: userRecord, isLoading: userLoading, isError: userError} = useUserQuery(session?.user?.id ?? null);
    const [upsertFailed, setUpsertFailed] = useState(false);

    // Stable callback so it can be safely listed in useEffect deps
    const handleUpsert = useCallback(
        async (authId: string) => {
            try {
                await upsertUser(authId);
            } catch (err) {
                Sentry.captureException(err);
                setUpsertFailed(true);
            }
        },
        [upsertUser],
    );

    // Upsert user on sign-in
    useEffect(() => {
        if (session?.user?.id) {
            void handleUpsert(session.user.id);
        }
    }, [session?.user?.id, handleUpsert]);

    // Wait until auth is resolved
    if (authLoading) return null;

    // Not authenticated — go to sign-in
    if (!session) return <Redirect href="/sign-in"/>;

    // Upsert failed — cannot safely determine routing; show error UI
    if (upsertFailed) {
        return (
            <View style={{
                flex: 1,
                backgroundColor: '#080808',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 24
            }}>
                <Text style={{color: '#FFFFFF', fontSize: 15, textAlign: 'center'}}>
                    {"Couldn't complete sign in. Please restart the app."}
                </Text>
            </View>
        );
    }

    // Wait for user record to load
    if (userLoading) return null;

    // User record failed to load — show error UI instead of silently returning null
    if (userError) {
        return (
            <View style={{
                flex: 1,
                backgroundColor: '#080808',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 24
            }}>
                <Text style={{color: '#FFFFFF', fontSize: 15, textAlign: 'center'}}>
                    {"Couldn't load your profile. Please restart the app."}
                </Text>
            </View>
        );
    }

    // Determine routing based on onboarding status
    if (userRecord && !userRecord.hasSeenOnboarding) {
        return <Redirect href="/onboarding"/>;
    }

    return null; // Let the Stack render normally (tabs is the default)
}

export default function RootLayout() {
    const [fontsLoaded] = useFonts(FONT_MAP);

    useEffect(() => {
        if (fontsLoaded) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded]);

    return (
        <Sentry.ErrorBoundary fallback={<ErrorFallback/>}>
            {!fontsLoaded ? null : (
                <QueryClientProvider client={queryClient}>
                    <ThemeProvider value={NavigationTheme}>
                        <AuthGate/>
                        <Stack>
                            <Stack.Screen name="index" options={{headerShown: false}}/>
                            <Stack.Screen name="(tabs)" options={{headerShown: false}}/>
                            <Stack.Screen name="sign-in" options={{headerShown: false}}/>
                            <Stack.Screen name="onboarding" options={{headerShown: false}}/>
                            <Stack.Screen name="catalog/[fixtureId]" options={{title: 'Moment Catalog'}}/>
                            <Stack.Screen name="microflow" options={{headerShown: false}}/>
                            <Stack.Screen name="auth/callback" options={{headerShown: false}}/>
                            <Stack.Screen name="modal" options={{presentation: 'modal', title: 'Modal'}}/>
                        </Stack>
                        <StatusBar style="light"/>
                    </ThemeProvider>
                </QueryClientProvider>
            )}
        </Sentry.ErrorBoundary>
    );
}
