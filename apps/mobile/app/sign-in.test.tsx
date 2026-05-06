import React from 'react';
import { render, screen } from '@testing-library/react-native';
jest.mock('@/src/hooks/useAuthState', () => ({
  useAuthState: jest.fn().mockReturnValue({ session: null, user: null, isLoading: false }),
}));

// Mock auth functions
jest.mock('@/src/lib/auth', () => ({
  signInWithApple: jest.fn(),
  signInWithGoogle: jest.fn(),
}));

// Mock expo-apple-authentication
jest.mock('expo-apple-authentication', () => ({
  AppleAuthenticationButton: 'AppleAuthenticationButton',
  AppleAuthenticationButtonType: { SIGN_IN: 0 },
  AppleAuthenticationButtonStyle: { WHITE: 0 },
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  Redirect: () => null,
}));

import SignInScreen from './sign-in';

describe('SignInScreen', () => {
  it('renders without crashing', () => {
    render(<SignInScreen />);
  });

  it('renders the app name', () => {
    render(<SignInScreen />);
    expect(screen.getByText('LeColpo')).toBeTruthy();
  });

  it('renders the Google sign-in button', () => {
    render(<SignInScreen />);
    expect(screen.getByText('Sign in with Google')).toBeTruthy();
  });

  it('does not render error text initially', () => {
    render(<SignInScreen />);
    expect(screen.queryByText(/Sign in failed/)).toBeNull();
  });
});

