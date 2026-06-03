import {useQuery} from '@tanstack/react-query';
import type {MiniLeague} from '@lecolpo/types';

export function useLeagueQuery(userId: string | null) {
    return useQuery<MiniLeague[] | null>({
        queryKey: ['mini-leagues', userId],
        queryFn: async () => {
            // TODO: Implement Supabase fetch in Epic 8
            return null;
        },
        enabled: userId != null,
    });
}
