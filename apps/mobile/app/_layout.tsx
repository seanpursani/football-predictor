import '../src/lib/sentry';
import '../global.css';

import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import 'react-native-reanimated';
import * as Sentry from '@sentry/react-native';

import { NavigationTheme } from '@/constants/theme';
import { FONT_MAP } from '@/src/lib/fonts';
import { queryClient } from '@/src/lib/queryClient';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

function ErrorFallback() {
  return (
    <View style={{ flex: 1, backgroundColor: '#080808', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#FFFFFF', fontSize: 15 }}>
        Something went wrong — please restart the app.
      </Text>
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts(FONT_MAP);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  return (
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      {!fontsLoaded ? null : (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={NavigationTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="catalog/[fixtureId]" options={{ title: 'Moment Catalog' }} />
            <Stack.Screen name="microflow" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="light" />
        </ThemeProvider>
      </QueryClientProvider>
      )}
    </Sentry.ErrorBoundary>
  );
}


