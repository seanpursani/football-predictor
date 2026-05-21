import { useQuery } from '@tanstack/react-query';
import type { GameweekMoment, MomentType } from '@lecolpo/types';
import { supabase } from '@/src/lib/supabase';

export type CatalogItem = GameweekMoment & { momentType: MomentType };

function parseCatalogItem(raw: Record<string, unknown>): CatalogItem {
  const mt = raw.moment_types as Record<string, unknown> | null;
  if (mt == null) {
    throw new Error(`parseCatalogItem: moment_types join returned null for game_week_moment id=${raw.id}`);
  }
  return {
    id: raw.id as number,
    gameweekId: raw.gameweek_id as number,
    fixtureId: raw.fixture_id as number,
    momentTypeId: raw.moment_type_id as number,
    basePoints: raw.base_points as number,
    playerBonusPoints: raw.player_bonus_points as number | null,
    assisterBonusPoints: raw.assister_bonus_points as number | null,
    zoneBonusPoints: raw.zone_bonus_points as number | null,
    timingBonusPoints: raw.timing_bonus_points as number | null,
    jackpotBonusPoints: raw.jackpot_bonus_points as number | null,
    teamId: raw.team_id as string | null,
    createdAt: new Date(raw.created_at as string),
    momentType: {
      id: mt.id as number,
      name: mt.name as string,
      eventType: mt.event_type as string,
      predictionType: mt.prediction_type as string,
      description: mt.description as string | null,
      createdAt: new Date(mt.created_at as string),
    },
  };
}

export function useCatalogQuery(fixtureId: number | null | undefined) {
  return useQuery<CatalogItem[]>({
    queryKey: ['catalog', fixtureId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('game_week_moments')
        .select('*, moment_types(*)')
        .eq('fixture_id', fixtureId!);

      if (error) {
        console.error('useCatalogQuery error:', error);
        throw error;
      }

      return (data as Record<string, unknown>[]).map(parseCatalogItem);
    },
    staleTime: Infinity,
    enabled: fixtureId != null,
  });
}

export function useHistoricalDotsQuery(
  fixtureId: number | null | undefined,
  eventType: string | null | undefined,
  teamId: string | null | undefined,
) {
  return useQuery<Array<{ correct: boolean }>>({
    queryKey: ['historical-dots', fixtureId, eventType, teamId],
    queryFn: async () => {
      // Build query with conditional teamId filter — must chain all at once (Supabase JS v2 returns new objects)
      const baseQuery = supabase
        .from('match_events')
        .select('id')
        .eq('event_type', eventType!)
        .order('created_at', { ascending: false })
        .limit(10);

      const { data, error } = await (teamId != null
        ? baseQuery.eq('team_id', teamId)
        : baseQuery);

      if (error) {
        console.error('useHistoricalDotsQuery error:', error);
        throw error;
      }
      return (data ?? []).map(() => ({ correct: true }));
    },
    staleTime: Infinity,
    // Only fire when all identifying params are present; null teamId means data not ready
    enabled: fixtureId != null && eventType != null && teamId != null,
  });
}
