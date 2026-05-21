import { useQuery } from '@tanstack/react-query';
import type { Fixture } from '@lecolpo/types';
import { supabase } from '@/src/lib/supabase';

function parseFixture(raw: Record<string, unknown>): Fixture {
  return {
    id: raw.id as number,
    gameweekId: raw.gameweek_id as number,
    externalId: raw.external_id as string,
    homeTeam: raw.home_team as string,
    awayTeam: raw.away_team as string,
    kickoffAt: new Date(raw.kickoff_at as string),
    isPostponed: raw.is_postponed as boolean,
    isVoid: raw.is_void as boolean,
    eventsIngested: raw.events_ingested as boolean,
    createdAt: new Date(raw.created_at as string),
  };
}

export function useFixturesQuery(gameweekId: number | null | undefined) {
  return useQuery<Fixture[]>({
    queryKey: ['fixtures', gameweekId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fixtures')
        .select('*')
        .eq('gameweek_id', gameweekId!)
        .order('kickoff_at', { ascending: true });

      if (error) {
        console.error('useFixturesQuery error:', error);
        throw error;
      }

      return (data as Record<string, unknown>[]).map(parseFixture);
    },
    enabled: gameweekId != null,
    staleTime: 5 * 60 * 1000,
  });
}

