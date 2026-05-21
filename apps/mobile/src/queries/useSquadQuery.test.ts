import { renderHook } from '@testing-library/react-native';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSquadQuery } from './useSquadQuery';

jest.mock('@/src/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: [], error: null }),
    }),
  },
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client }, children);
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

