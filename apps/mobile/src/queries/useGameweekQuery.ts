import {useQuery} from '@tanstack/react-query';
import type {Gameweek} from '@lecolpo/types';

export function useGameweekQuery() {
    return useQuery<Gameweek | null>({
        queryKey: ['gameweek', 'current'],
        queryFn: async () => {
            // TODO: Implement Supabase fetch in Epic 5
            return null;
        },
        enabled: false,
    });
}

