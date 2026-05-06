import { renderHook, act, waitFor } from '@testing-library/react-native';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUpsertUserMutation, useUserQuery } from './useUserQuery';

const mockFrom = jest.fn();
const mockUpsert = jest.fn().mockResolvedValue({ error: null });
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();

jest.mock('../lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => {
      mockFrom(...args);
      return {
        select: (...a: unknown[]) => { mockSelect(...a); return { eq: (...b: unknown[]) => { mockEq(...b); return { single: mockSingle }; } }; },
        upsert: mockUpsert,
      };
    },
  },
}));

jest.mock('../lib/queryClient', () => {
  const { QueryClient } = require('@tanstack/react-query');
  return { queryClient: new QueryClient() };
});

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client }, children);
}

describe('useUpsertUserMutation', () => {
  it('calls supabase.from(users).upsert with auth_id', async () => {
    const { result } = renderHook(() => useUpsertUserMutation(), { wrapper });
    await act(async () => {
      result.current.mutate('user-abc');
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockUpsert).toHaveBeenCalledWith(
      { auth_id: 'user-abc' },
      expect.objectContaining({ onConflict: 'auth_id' }),
    );
  });
});

describe('useUserQuery', () => {
  it('does not run when authId is null', () => {
    const { result } = renderHook(() => useUserQuery(null), { wrapper });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

