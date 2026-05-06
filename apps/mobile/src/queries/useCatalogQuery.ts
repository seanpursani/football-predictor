import { useQuery } from '@tanstack/react-query';
import type { MomentCard } from '@lecolpo/types';

export function useCatalogQuery(fixtureId: number) {
  return useQuery<MomentCard[] | null>({
    queryKey: ['catalog', fixtureId],
    queryFn: async () => {
      // TODO: Implement Supabase fetch in Epic 5
      return null;
    },
    enabled: false,
  });
}

