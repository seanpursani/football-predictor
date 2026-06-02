import * as AppleAuthentication from 'expo-apple-authentication';
import {makeRedirectUri} from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants, {ExecutionEnvironment} from 'expo-constants';
import {Platform} from 'react-native';

import * as Sentry from '@sentry/react-native';

import {supabase} from './supabase';
import {debugLog} from './debugLog';

const log = debugLog('auth');

/**
 * Sign in with Apple (iOS only).
 * Uses Supabase signInWithIdToken with the Apple identity token.
 */
export async function signInWithApple() {
    log.info('signInWithApple: starting');
    const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
    });

    log.info('signInWithApple: credential received, exchanging with Supabase');
    const {data, error} = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken!,
    });

    if (error) {
        log.error('signInWithApple: failed', {message: error.message});
        Sentry.captureException(error, {tags: {flow: 'sign-in', provider: 'apple'}});
        throw error;
    }
    log.info('signInWithApple: success', {userId: data.user?.id});
    return data;
}

/**
 * Sign in with Google via PKCE OAuth flow using expo-web-browser.
 *
 * Three execution contexts, three different redirect URI strategies:
 *
 * Web (expo start -w / browser):
 *   Full-page redirect to avoid COOP issues — Google sets COOP: same-origin
 *   which nullifies window.opener in popups. auth/callback.tsx then exchanges
 *   the code explicitly (detectSessionInUrl alone won't work in a SPA).
 *
 * Expo Go (StoreClient):
 *   Redirect goes through Supabase's auth callback page then deep-links back
 *   via the exp:// scheme Expo Go registers for the current dev server.
 *   ⚠️ EXPO_PUBLIC_SUPABASE_URL must use your LAN IP (not localhost) when
 *   testing on a physical device — see .env.example and README.
 *
 * Standalone / production build:
 *   Uses the custom lecolpo:// scheme registered by the native app.
 */
export async function signInWithGoogle() {
    const isWeb = Platform.OS === 'web';
    const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

    const redirectUri = isWeb
        ? `${window.location.origin}/auth/callback`
        : isExpoGo
        ? makeRedirectUri({preferLocalhost: false})   // exp://<LAN-IP>:<port>
        : makeRedirectUri({scheme: 'lecolpo', path: 'auth/callback'});

    log.info('signInWithGoogle: starting', {
        platform: Platform.OS,
        executionEnv: Constants.executionEnvironment,
        isWeb,
        isExpoGo,
        redirectUri,
        supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    });

    if (isWeb) {
        log.info('signInWithGoogle: web flow — full-page redirect');
        const {error} = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {redirectTo: redirectUri},
        });
        if (error) {
            log.error('signInWithGoogle: web signInWithOAuth error', {message: error.message});
            Sentry.captureException(error, {tags: {flow: 'sign-in', provider: 'google', context: 'web-oauth'}});
            throw error;
        }
        return;
    }

    // Native: in-app browser popup
    log.info('signInWithGoogle: native flow — requesting OAuth URL');
    const {data, error} = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: redirectUri,
            skipBrowserRedirect: true,
        },
    });

    if (error) {
        log.error('signInWithGoogle: signInWithOAuth error', {message: error.message});
        Sentry.captureException(error, {tags: {flow: 'sign-in', provider: 'google', context: 'native-oauth'}});
        throw error;
    }

    if (!data.url) {
        const err = new Error('No OAuth URL returned from Supabase');
        log.error('signInWithGoogle: no OAuth URL returned from Supabase');
        Sentry.captureException(err, {tags: {flow: 'sign-in', provider: 'google'}});
        throw err;
    }

    log.info('signInWithGoogle: opening browser', {oauthUrl: data.url.slice(0, 80) + '…'});
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);
    log.info('signInWithGoogle: browser session result', {type: result.type});

    if (result.type === 'success' && result.url) {
        const url = new URL(result.url);
        const code = url.searchParams.get('code');
        log.info('signInWithGoogle: redirect received', {hasCode: !!code, redirectUrl: result.url});

            if (code) {
                log.info('signInWithGoogle: exchanging code for session…');
                const {data: sessionData, error: exchangeError} = await supabase.auth.exchangeCodeForSession(code);
                if (exchangeError) {
                    log.error('signInWithGoogle: code exchange failed', {message: exchangeError.message});
                    Sentry.captureException(exchangeError, {tags: {flow: 'sign-in', provider: 'google', context: 'code-exchange'}});
                    throw exchangeError;
                }
                log.info('signInWithGoogle: session established', {userId: sessionData.session?.user?.id});
            } else {
                log.warn('signInWithGoogle: redirect URL had no ?code param', {redirectUrl: result.url});
            }
    } else if (result.type === 'cancel') {
        log.info('signInWithGoogle: user cancelled');
    } else if (result.type === 'dismiss') {
        log.info('signInWithGoogle: browser dismissed');
    } else {
        log.warn('signInWithGoogle: unexpected result type', {result});
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

