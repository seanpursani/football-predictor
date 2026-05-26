import * as AppleAuthentication from 'expo-apple-authentication';
import {makeRedirectUri} from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants, {ExecutionEnvironment} from 'expo-constants';
import {Platform} from 'react-native';

import {supabase} from './supabase';

// NOTE: maybeCompleteAuthSession() has been moved to _layout.tsx so it runs on
// every page load — including the /auth/callback popup page — before any routing.

/**
 * Sign in with Apple (iOS only).
 * Uses Supabase signInWithIdToken with the Apple identity token.
 */
export async function signInWithApple() {
    const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
    });

    const {data, error} = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken!,
    });

    if (error) throw error;
    return data;
}

/**
 * Sign in with Google via PKCE OAuth flow using expo-web-browser.
 *
 * Three execution contexts, three different redirect URI strategies:
 *
 * Web (expo start -w / browser):
 *   makeRedirectUri always resolves to the app's custom scheme on web because
 *   Linking.createURL → resolveScheme always picks 'lecolpo' from app.config.
 *   Custom-scheme URIs (lecolpo://) are invalid in browser OAuth — use the
 *   HTTP origin instead so the popup can actually navigate there.
 *
 * Expo Go (StoreClient):
 *   Redirect goes through Supabase's auth callback page then deep-links back
 *   via the exp:// scheme Expo Go registers for the current dev server.
 *
 * Standalone / production build:
 *   Use the custom lecolpo:// scheme registered by the native app.
 */
export async function signInWithGoogle() {
    const isWeb = Platform.OS === 'web';
    const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

    const redirectUri = isWeb
        ? `${window.location.origin}/auth/callback`   // http://localhost:8082/auth/callback
        : isExpoGo
        ? makeRedirectUri({preferLocalhost: false})   // exp://<current-host>:8082
        : makeRedirectUri({scheme: 'lecolpo', path: 'auth/callback'});

    if (isWeb) {
        // Full-page redirect avoids COOP issues (Google sets COOP: same-origin which
        // nullifies window.opener in popups, breaking the postMessage handshake).
        // detectSessionInUrl: true in supabase.ts handles the code exchange on /auth/callback.
        const {error} = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {redirectTo: redirectUri},
        });
        if (error) throw error;
        return;
    }

    // Native: in-app browser popup
    const {data, error} = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: redirectUri,
            skipBrowserRedirect: true,
        },
    });

    if (error) throw error;

    if (data.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

        // Expo Go: deep-link returns the code; exchange it manually.
        // Standalone: onAuthStateChange fires automatically via the deep-link handler.
        if (result.type === 'success' && result.url) {
            const url = new URL(result.url);
            const code = url.searchParams.get('code');
            if (code) {
                await supabase.auth.exchangeCodeForSession(code);
            }
        }
    }
}

/**
 * Sign out the current user.
 */
export async function signOut() {
    const {error} = await supabase.auth.signOut();
    if (error) throw error;
}

/**
 * Get the current session (or null if not authenticated).
 */
export async function getSession() {
    const {data, error} = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
}

