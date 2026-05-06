import { renderHook, act } from '@testing-library/react-native';
import { useAuthState } from './useAuthState';

jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      }),
    },
  },
}));

import { supabase } from '../lib/supabase';

const mockGetSession = supabase.auth.getSession as jest.Mock;
const mockOnAuthStateChange = supabase.auth.onAuthStateChange as jest.Mock;

describe('useAuthState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });
    mockGetSession.mockResolvedValue({ data: { session: null } });
  });

  it('returns isLoading=true initially, then false after session resolves', async () => {
    const { result } = renderHook(() => useAuthState());
    expect(result.current.isLoading).toBe(true);

    await act(async () => {});
    expect(result.current.isLoading).toBe(false);
    expect(result.current.session).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it('returns session and user when authenticated', async () => {
    const mockSession = { user: { id: 'user-1', email: 'test@example.com' } };
    mockGetSession.mockResolvedValue({ data: { session: mockSession } });

    const { result } = renderHook(() => useAuthState());
    await act(async () => {});
    expect(result.current.session).toEqual(mockSession);
    expect(result.current.user).toEqual(mockSession.user);
  });

  it('updates session when onAuthStateChange fires', async () => {
    const { result } = renderHook(() => useAuthState());
    await act(async () => {});

    const newSession = { user: { id: 'user-2', email: 'other@example.com' } };
    const changeCallback = mockOnAuthStateChange.mock.calls[0][0];

    act(() => {
      changeCallback('SIGNED_IN', newSession);
    });

    expect(result.current.session).toEqual(newSession);
    expect(result.current.user).toEqual(newSession.user);
  });

  it('unsubscribes on unmount', async () => {
    const mockUnsubscribe = jest.fn();
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    });

    const { unmount } = renderHook(() => useAuthState());
    await act(async () => {});
    unmount();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});

