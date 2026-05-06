import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

const mockMutate = jest.fn();
let mockIsPending = false;
let mockMutationError: Error | null = null;

jest.mock('@/src/hooks/useAuthState', () => ({
  useAuthState: () => ({ session: { user: { id: 'test-auth-id' } }, isLoading: false }),
}));

jest.mock('@/src/queries/useUserQuery', () => ({
  useUserQuery: () => ({ data: { displayName: 'TestUser', hasSeenOnboarding: true }, isLoading: false }),
  useUpdateDisplayNameMutation: () => ({
    mutate: mockMutate,
    isPending: mockIsPending,
    error: mockMutationError,
  }),
}));

jest.mock('expo-router', () => ({
  Redirect: () => null,
}));

import ProfileScreen from './profile';

beforeEach(() => {
  mockMutate.mockClear();
  mockIsPending = false;
  mockMutationError = null;
});

describe('ProfileScreen', () => {
  it('renders display name from useUserQuery', () => {
    render(<ProfileScreen />);
    expect(screen.getByDisplayValue('TestUser')).toBeTruthy();
  });

  it('renders the Profile heading', () => {
    render(<ProfileScreen />);
    expect(screen.getByText('Profile')).toBeTruthy();
  });

  it('shows inline error when save attempted with whitespace-only input — no mutation call', () => {
    render(<ProfileScreen />);
    fireEvent.changeText(screen.getByDisplayValue('TestUser'), '   ');
    fireEvent.press(screen.getByText('Save'));
    expect(screen.getByText('Display name cannot be empty')).toBeTruthy();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('calls updateDisplayName with trimmed name on valid save', () => {
    render(<ProfileScreen />);
    fireEvent.changeText(screen.getByDisplayValue('TestUser'), '  NewName  ');
    fireEvent.press(screen.getByText('Save'));
    expect(mockMutate).toHaveBeenCalledWith({ authId: 'test-auth-id', displayName: 'NewName' });
  });

  it('shows ActivityIndicator and hides Save text when isPending is true', () => {
    mockIsPending = true;
    render(<ProfileScreen />);
    expect(screen.queryByText('Save')).toBeNull();
  });

  it('does not show server error text when mutationError is null', () => {
    render(<ProfileScreen />);
    expect(screen.queryByText("Couldn't save — please try again")).toBeNull();
  });

  it('shows server error text when mutationError is set', () => {
    mockMutationError = new Error('Server error');
    render(<ProfileScreen />);
    expect(screen.getByText("Couldn't save — please try again")).toBeTruthy();
  });
});
