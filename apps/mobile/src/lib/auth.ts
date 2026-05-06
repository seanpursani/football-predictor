import * as AppleAuthentication from 'expo-apple-authentication';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

import { supabase } from './supabase';

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

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken!,
  });

  if (error) throw error;
  return data;
}

/**
 * Sign in with Google via PKCE OAuth flow using expo-web-browser.
 */
export async function signInWithGoogle() {
  const redirectUri = makeRedirectUri({ scheme: 'lecolpo' });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUri,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;

  if (data.url) {
    await WebBrowser.openAuthSessionAsync(data.url, redirectUri);
    // onAuthStateChange fires after redirect resolves — no session return needed here
  }
}

/**
 * Sign out the current user.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Get the current session (or null if not authenticated).
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

