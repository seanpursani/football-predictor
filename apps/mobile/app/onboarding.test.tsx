import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

const mockReplace = jest.fn();
const mockUpdatePushToken = jest.fn();

jest.mock('@/src/hooks/useAuthState', () => ({
  useAuthState: () => ({ session: { user: { id: 'test-auth-id' } }, isLoading: false }),
}));

jest.mock('@/src/queries/useUserQuery', () => ({
  useUserQuery: () => ({ data: { displayName: null, hasSeenOnboarding: false, pushToken: null } }),
  useUpsertUserMutation: () => ({ mutate: jest.fn() }),
  useUpdatePushTokenMutation: () => ({ mutate: mockUpdatePushToken }),
}));

jest.mock('@/src/lib/notifications', () => ({
  requestPushPermissionAndGetToken: jest.fn().mockResolvedValue('ExponentPushToken[test-token]'),
}));

jest.mock('@/src/lib/queryClient', () => ({
  queryClient: { invalidateQueries: jest.fn().mockResolvedValue(undefined) },
}));

const mockSupabaseUpdate = jest.fn().mockReturnValue({
  eq: jest.fn().mockResolvedValue({ error: null }),
});
jest.mock('@/src/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnValue({
      update: (...args: unknown[]) => mockSupabaseUpdate(...args),
    }),
  },
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

import OnboardingScreen from './onboarding';
import { requestPushPermissionAndGetToken } from '@/src/lib/notifications';

beforeEach(() => {
  jest.clearAllMocks();
  mockSupabaseUpdate.mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) });
  (requestPushPermissionAndGetToken as jest.Mock).mockResolvedValue('ExponentPushToken[test-token]');
});

describe('OnboardingScreen', () => {
  it('renders 5 rules', () => {
    render(<OnboardingScreen />);
    expect(screen.getByText('MATCH picks')).toBeTruthy();
    expect(screen.getByText('MOMENT picks')).toBeTruthy();
    expect(screen.getByText('Captain')).toBeTruthy();
    expect(screen.getByText('Streaks')).toBeTruthy();
    expect(screen.getByText('20 tokens')).toBeTruthy();
  });

  it("renders the CTA button with Let's go text", () => {
    render(<OnboardingScreen />);
    expect(screen.getByText("Let's go")).toBeTruthy();
  });

  it('CTA press triggers has_seen_onboarding update', async () => {
    const { supabase } = require('@/src/lib/supabase');
    render(<OnboardingScreen />);
    fireEvent.press(screen.getByText("Let's go"));
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('users');
      expect(mockSupabaseUpdate).toHaveBeenCalledWith({ has_seen_onboarding: true });
    });
  });

  it('CTA press calls requestPushPermissionAndGetToken', async () => {
    render(<OnboardingScreen />);
    fireEvent.press(screen.getByText("Let's go"));
    await waitFor(() => {
      expect(requestPushPermissionAndGetToken).toHaveBeenCalled();
    });
  });

  it('stores token when returned', async () => {
    render(<OnboardingScreen />);
    fireEvent.press(screen.getByText("Let's go"));
    await waitFor(() => {
      expect(mockSupabaseUpdate).toHaveBeenCalledWith({ push_token: 'ExponentPushToken[test-token]' });
    });
  });

  it('navigates to /(tabs) after completion', async () => {
    render(<OnboardingScreen />);
    fireEvent.press(screen.getByText("Let's go"));
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
    });
  });

  it('still navigates when push token is null (permission denied)', async () => {
    (requestPushPermissionAndGetToken as jest.Mock).mockResolvedValue(null);
    render(<OnboardingScreen />);
    fireEvent.press(screen.getByText("Let's go"));
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
    });
  });

  it('does not navigate when has_seen_onboarding update fails', async () => {
    mockSupabaseUpdate.mockReturnValueOnce({ eq: jest.fn().mockResolvedValue({ error: { message: 'DB error' } }) });
    render(<OnboardingScreen />);
    fireEvent.press(screen.getByText("Let's go"));
    await waitFor(() => {
      expect(mockSupabaseUpdate).toHaveBeenCalledWith({ has_seen_onboarding: true });
    });
    // Navigation should NOT have been called
    expect(mockReplace).not.toHaveBeenCalled();
  });
});



