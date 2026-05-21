import {getSession, signInWithApple, signInWithGoogle, signOut} from './auth';
import {supabase} from './supabase';

// Mock expo-apple-authentication
jest.mock('expo-apple-authentication', () => ({
    signInAsync: jest.fn().mockResolvedValue({identityToken: 'mock-apple-token'}),
    AppleAuthenticationScope: {FULL_NAME: 0, EMAIL: 1},
    AppleAuthenticationButtonType: {SIGN_IN: 0},
    AppleAuthenticationButtonStyle: {WHITE: 0},
    AppleAuthenticationButton: 'AppleAuthenticationButton',
}));

// Mock expo-auth-session
jest.mock('expo-auth-session', () => ({
    makeRedirectUri: jest.fn().mockReturnValue('lecolpo://'),
}));

// Mock expo-web-browser
jest.mock('expo-web-browser', () => ({
    maybeCompleteAuthSession: jest.fn(),
    openAuthSessionAsync: jest.fn().mockResolvedValue({type: 'success'}),
}));

// Mock supabase singleton
jest.mock('./supabase', () => ({
    supabase: {
        auth: {
            signInWithIdToken: jest.fn().mockResolvedValue({data: {session: {}}, error: null}),
            signInWithOAuth: jest.fn().mockResolvedValue({data: {url: 'https://auth.example.com'}, error: null}),
            signOut: jest.fn().mockResolvedValue({error: null}),
            getSession: jest.fn().mockResolvedValue({data: {session: {user: {id: 'user-1'}}}, error: null}),
            onAuthStateChange: jest.fn().mockReturnValue({data: {subscription: {unsubscribe: jest.fn()}}}),
        },
    },
}));

describe('auth utilities', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('signInWithApple calls signInWithIdToken with apple provider and identity token', async () => {
        await signInWithApple();
        expect(supabase.auth.signInWithIdToken).toHaveBeenCalledWith({
            provider: 'apple',
            token: 'mock-apple-token',
        });
    });

    it('signInWithGoogle calls signInWithOAuth with google provider', async () => {
        await signInWithGoogle();
        expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith(
            expect.objectContaining({provider: 'google'}),
        );
    });

    it('signOut calls supabase.auth.signOut', async () => {
        await signOut();
        expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    it('getSession returns the session from supabase', async () => {
        const session = await getSession();
        expect(supabase.auth.getSession).toHaveBeenCalled();
        expect(session).toEqual({user: {id: 'user-1'}});
    });

    it('signInWithApple throws when supabase returns an error', async () => {
        (supabase.auth.signInWithIdToken as jest.Mock).mockResolvedValueOnce({
            data: null,
            error: new Error('auth error'),
        });
        await expect(signInWithApple()).rejects.toThrow('auth error');
    });
});

