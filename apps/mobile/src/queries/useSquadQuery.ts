import { useQuery } from '@tanstack/react-query';
import type { Prediction } from '@lecolpo/types';

export function useSquadQuery(userId: string, gameweekId: number) {
  return useQuery<Prediction[] | null>({
    queryKey: ['squad', userId, gameweekId],
    queryFn: async () => {
      // TODO: Implement Supabase fetch in Epic 5
      return null;
    },
    enabled: false,
  });
}

