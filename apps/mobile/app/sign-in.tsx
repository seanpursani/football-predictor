import * as AppleAuthentication from 'expo-apple-authentication';
import {Redirect} from 'expo-router';
import {useState} from 'react';
import {ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View} from 'react-native';

import {useAuthState} from '@/src/hooks/useAuthState';
import {signInWithApple, signInWithGoogle} from '@/src/lib/auth';

export default function SignInScreen() {
    const {session, isLoading} = useAuthState();
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Already authenticated — let _layout handle routing
    if (!isLoading && session) {
        return <Redirect href="/(tabs)"/>;
    }

    async function handleAppleSignIn() {
        setError(null);
        try {
            await signInWithApple();
        } catch (err: unknown) {
            // User cancelled is not an error we display
            if (err && typeof err === 'object' && 'code' in err && (err as {
                code: string
            }).code === 'ERR_REQUEST_CANCELED') {
                // no-op
            } else {
                setError('Sign in failed — please try again.');
            }
        }
    }

    async function handleGoogleSignIn() {
        setError(null);
        setGoogleLoading(true);
        try {
            await signInWithGoogle();
        } catch {
            setError('Sign in failed — please try again.');
        } finally {
            setGoogleLoading(false);
        }
    }

    return (
        <View style={styles.container}>
            <Text style={styles.appName}>LeColpo</Text>

            <View style={styles.buttonContainer}>
                {Platform.OS === 'ios' && (
                    <AppleAuthentication.AppleAuthenticationButton
                        buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                        cornerRadius={6}
                        style={styles.appleButton}
                        onPress={handleAppleSignIn}
                    />
                )}

                <TouchableOpacity
                    style={styles.googleButton}
                    onPress={handleGoogleSignIn}
                    disabled={googleLoading}
                    accessibilityRole="button"
                    accessibilityLabel="Sign in with Google"
                >
                    {googleLoading ? (
                        <ActivityIndicator color="#000000"/>
                    ) : (
                        <Text style={styles.googleButtonText}>Sign in with Google</Text>
                    )}
                </TouchableOpacity>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#080808',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    appName: {
        fontFamily: 'Inter_700Bold',
        fontSize: 32,
        color: '#FFFFFF',
        marginBottom: 48,
    },
    buttonContainer: {
        width: '100%',
        gap: 12,
    },
    appleButton: {
        width: '100%',
        height: 50,
        minHeight: 44,
    },
    googleButton: {
        width: '100%',
        height: 50,
        minHeight: 44,
        backgroundColor: '#B4FF32',
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    googleButtonText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: '#000000',
    },
    errorText: {
        color: '#FF4444',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
    },
});

