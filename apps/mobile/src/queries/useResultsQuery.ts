import { useQuery } from '@tanstack/react-query';
import type { ScoringResult } from '@lecolpo/types';

export function useResultsQuery(userId: string, gameweekId: number) {
  return useQuery<ScoringResult[] | null>({
    queryKey: ['results', userId, gameweekId],
    queryFn: async () => {
      // TODO: Implement Supabase fetch in Epic 5
      return null;
    },
    enabled: false,
  });
}

