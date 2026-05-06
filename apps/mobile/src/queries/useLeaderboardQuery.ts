import { useQuery } from '@tanstack/react-query';
import type { LeaderboardEntry } from '@lecolpo/types';

export function useLeaderboardQuery(gameweekId: number) {
  return useQuery<LeaderboardEntry[] | null>({
    queryKey: ['leaderboard', 'global', gameweekId],
    queryFn: async () => {
      // TODO: Implement Supabase fetch in Epic 5
      return null;
    },
    enabled: false,
  });
}

