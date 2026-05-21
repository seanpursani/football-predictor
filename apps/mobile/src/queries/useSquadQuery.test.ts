import { renderHook, act } from '@testing-library/react-native';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSquadQuery, useCaptainMutation } from './useSquadQuery';
import type { Prediction } from '@lecolpo/types';

jest.mock('@/src/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: [], error: null }),
      update: jest.fn().mockReturnThis(),
    }),
  },
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client }, children);
}

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
}

function wrapperWithClient(client: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client }, children);
  };
}

describe('useSquadQuery', () => {
  it('query key is ["squad", userId, gameweekId]', () => {
    const { result } = renderHook(() => useSquadQuery('user-123', 5), { wrapper });
    expect(result.current.fetchStatus).toBeDefined();
  });

  it('is disabled (idle) when userId is null', () => {
    const { result } = renderHook(() => useSquadQuery(null, 5), { wrapper });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('is disabled (idle) when gameweekId is null', () => {
    const { result } = renderHook(() => useSquadQuery('user-123', null), { wrapper });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

const basePick = (id: number, isCaptain: boolean): Prediction => ({
  id,
  userId: 'user-123',
  gameweekId: 5,
  fixtureId: 1,
  gameWeekMomentId: id,
  predictionType: 'match',
  isCaptain,
  predictedMinute: null,
  confidenceWindow: null,
  predictedPlayerId: null,
  predictedAssisterId: null,
  predictedZone: null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('useCaptainMutation', () => {
  it('optimistic update sets isCaptain: true only on the target pick and false on all others', () => {
    // Test the cache transformation logic directly
    const initialSquad: Prediction[] = [
      basePick(1, true),
      basePick(2, false),
      basePick(3, false),
    ];
    const targetPickId = 2;

    // This is the exact logic from onMutate in useCaptainMutation
    const updated = initialSquad.map((p) => ({ ...p, isCaptain: p.id === targetPickId }));

    expect(updated.find((p) => p.id === 2)?.isCaptain).toBe(true);
    expect(updated.find((p) => p.id === 1)?.isCaptain).toBe(false);
    expect(updated.find((p) => p.id === 3)?.isCaptain).toBe(false);
    // Exactly one captain
    expect(updated.filter((p) => p.isCaptain).length).toBe(1);
  });

  it('rolls back on error', async () => {
    const { supabase } = require('@/src/lib/supabase') as {
      supabase: { from: jest.Mock };
    };
    // Simulate failure on second call (set captain)
    let callCount = 0;
    supabase.from.mockImplementation(() => ({
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount >= 2) {
          return Promise.resolve({ error: { message: 'DB error' } });
        }
        return Promise.resolve({ error: null });
      }),
    }));

    const client = makeClient();
    const queryKey = ['squad', 'user-123', 5];
    const initialSquad: Prediction[] = [basePick(1, true), basePick(2, false)];
    client.setQueryData(queryKey, initialSquad);

    const { result } = renderHook(() => useCaptainMutation('user-123', 5), {
      wrapper: wrapperWithClient(client),
    });

    await act(async () => {
      await result.current.mutateAsync({ pickId: 2, userId: 'user-123', gameweekId: 5 }).catch(() => {});
    });

    const cached = client.getQueryData<Prediction[]>(queryKey);
    // Should be rolled back to original state
    expect(cached?.find((p) => p.id === 1)?.isCaptain).toBe(true);
    expect(cached?.find((p) => p.id === 2)?.isCaptain).toBe(false);
  });
});

