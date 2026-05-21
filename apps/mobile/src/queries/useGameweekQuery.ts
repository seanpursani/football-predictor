import {useQuery} from '@tanstack/react-query';
import type {Gameweek, UserGameweekState} from '@lecolpo/types';
import {supabase} from '@/src/lib/supabase';

function parseGameweekDates(raw: Record<string, unknown>): Gameweek {
    return {
        ...raw,
        firstKickoff: raw.first_kickoff ? new Date(raw.first_kickoff as string) : null,
        lastMatchEnd: raw.last_match_end ? new Date(raw.last_match_end as string) : null,
        createdAt: new Date(raw.created_at as string),
        updatedAt: new Date(raw.updated_at as string),
        id: raw.id as number,
        gameweekNumber: raw.gameweek_number as number,
        scoringStatus: raw.scoring_status as string,
        status: raw.status as string,
        season: raw.season as string,
    } as Gameweek;
}

export function useGameweekQuery() {
    return useQuery<Gameweek | null>({
        queryKey: ['gameweek', 'current'],
        queryFn: async () => {
            const {data, error} = await supabase
                .from('gameweeks')
                .select('*')
                .in('status', ['building', 'locked', 'completed'])
                .order('first_kickoff', {ascending: false})
                .limit(1)
                .maybeSingle();

            if (error) {
                console.error('useGameweekQuery error:', error);
                throw error;
            }

            if (!data) return null;
            return parseGameweekDates(data as Record<string, unknown>);
        },
        staleTime: 60_000,
    });
}

export function useUserGameweekStateQuery(gameweekId: number | null | undefined, userId: string | null | undefined) {
    return useQuery<UserGameweekState | null>({
        queryKey: ['gameweek', 'reveal-state', gameweekId, userId],
        queryFn: async () => {
            if (gameweekId == null || userId == null) return null;

            const {data, error} = await supabase
                .from('user_gameweek_states')
                .select('*')
                .eq('user_id', userId)
                .eq('gameweek_id', gameweekId)
                .maybeSingle();

            if (error) {
                console.error('useUserGameweekStateQuery error:', error);
                throw error;
            }

            return data as UserGameweekState | null;
        },
        enabled: gameweekId != null && userId != null,
        staleTime: 60_000,
    });
}
