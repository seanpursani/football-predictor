import {useRouter} from 'expo-router';
import {useEffect, useState} from 'react';
import {ActivityIndicator, Platform, Text, TouchableOpacity, View} from 'react-native';

import {debugLog} from '@/src/lib/debugLog';
import {supabase} from '@/src/lib/supabase';

const log = debugLog('auth/callback');

/**
 * Landing page for web OAuth redirect.
 *
 * WHY this component must do the exchange itself:
 * Supabase's `detectSessionInUrl: true` fires once at client initialisation.
 * In a SPA (Expo Router) the client is already live when the user navigates to
 * /auth/callback, so the URL's `?code=` is never picked up automatically.
 * We must call `exchangeCodeForSession` explicitly here.
 *
 * Native flows never land on this page — WebBrowser.openAuthSessionAsync
 * intercepts the redirect URI and auth.ts calls exchangeCodeForSession directly.
 */
export default function AuthCallback() {
    const router = useRouter();
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        if (Platform.OS !== 'web') {
            // Should never happen on native — log a warning and bail
            log.warn('AuthCallback rendered on native — this is unexpected');
            router.replace('/');
            return;
        }

        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const oauthError = params.get('error');
        const oauthErrorDescription = params.get('error_description');

        log.info('Auth callback page loaded', {
            hasCode: !!code,
            oauthError,
            oauthErrorDescription,
            url: window.location.href,
        });

        if (oauthError) {
            log.error('OAuth provider returned an error', {oauthError, oauthErrorDescription});
            setErrorMsg(oauthErrorDescription ?? oauthError);
            return;
        }

        if (!code) {
            // No ?code= — might be a fragment-based implicit flow or a stale redirect.
            // Let AuthGate in _layout.tsx handle routing from the current session.
            log.warn('Auth callback: no ?code in URL — redirecting to root', {url: window.location.href});
            router.replace('/');
            return;
        }

        log.info('Exchanging auth code for session…');
        supabase.auth.exchangeCodeForSession(code)
            .then(({data, error: exchangeError}) => {
                if (exchangeError) {
                    log.error('exchangeCodeForSession failed', {message: exchangeError.message});
                    setErrorMsg(exchangeError.message);
                } else {
                    log.info('Session established', {userId: data.session?.user?.id});
                    router.replace('/');
                }
            });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (errorMsg) {
        return (
            <View style={{flex: 1, backgroundColor: '#080808', alignItems: 'center', justifyContent: 'center', padding: 24}}>
                <Text style={{color: '#FF4444', fontSize: 15, textAlign: 'center', marginBottom: 16}}>
                    {errorMsg}
                </Text>
                <TouchableOpacity onPress={() => router.replace('/sign-in')}>
                    <Text style={{color: '#B4FF32', fontSize: 14}}>Back to sign in</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={{flex: 1, backgroundColor: '#080808', alignItems: 'center', justifyContent: 'center'}}>
            <ActivityIndicator color="#B4FF32" size="large"/>
        </View>
    );
}