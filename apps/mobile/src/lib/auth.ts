import * as AppleAuthentication from 'expo-apple-authentication';
import {makeRedirectUri} from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants, {ExecutionEnvironment} from 'expo-constants';

import {supabase} from './supabase';

WebBrowser.maybeCompleteAuthSession();

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
 * In Expo Go the redirect must go through Supabase's own auth callback page
 * (which then deep-links back into the app via the exp:// scheme that Expo Go
 * registers dynamically for the *current* dev server).  Using a hard-coded
 * scheme:// URI here would embed the dev-machine's LAN IP, causing
 * ERR_CONNECTION_REFUSED on any other machine.
 *
 * In a standalone / production build we use the custom `lecolpo://` scheme.
 */
export async function signInWithGoogle() {
    const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

    const redirectUri = isExpoGo
        ? makeRedirectUri({preferLocalhost: false})   // resolves to exp://<current-host>:8081
        : makeRedirectUri({scheme: 'lecolpo', path: 'auth/callback'});

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

        // In Expo Go the deep-link comes back as a universal link; we need to
        // manually tell Supabase to exchange the code from the URL.
        if (result.type === 'success' && result.url) {
            const url = new URL(result.url);
            const code = url.searchParams.get('code');
            if (code) {
                await supabase.auth.exchangeCodeForSession(code);
            }
        }
        // For standalone builds onAuthStateChange fires automatically via the
        // deep-link handler registered in the app.
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

