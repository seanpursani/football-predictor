import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/src/lib/supabase';

// ─── ResultsRow — flattened joined response ───────────────────────────────────

export interface ResultsRow {
  // From scoring_results
  id: number;
  predictionId: number;
  userId: string;
  gameweekId: number;
  eventPoints: number;
  timingBonus: number;
  playerBonus: number;
  assisterBonus: number;
  zoneBonus: number;
  jackpotBonus: number;
  captainMultiplier: number;
  streakBonus: number;
  totalPoints: number;
  isCorrect: boolean;
  createdAt: string;
  // Joined from predictions
  predictionType: 'match' | 'moment';
  isCaptain: boolean;
  fixtureId: number;
  gameWeekMomentId: number;
  predictedMinute: number | null;
  // Joined from game_week_moments → moment_types
  eventName: string;
  eventType: string;
  basePoints: number;
}

// ─── Query ────────────────────────────────────────────────────────────────────

export function useResultsQuery(userId: string | null, gameweekId: number | null) {
  return useQuery<ResultsRow[] | null>({
    queryKey: ['results', userId, gameweekId],
    queryFn: async () => {
      if (!userId || !gameweekId) return null;

      const { data, error } = await supabase
        .from('scoring_results')
        .select(`
          *,
          predictions!inner(
            prediction_type,
            is_captain,
            fixture_id,
            predicted_minute,
            game_week_moment_id,
            game_week_moments!inner(
              base_points,
              moment_types!inner(
                name,
                event_type
              )
            )
          )
        `)
        .eq('user_id', userId)
        .eq('gameweek_id', gameweekId);

      if (error) {
        console.error('useResultsQuery error:', error);
        throw error;
      }

      if (!data) return null;

      // Flatten nested joins into ResultsRow
      return data.map((row: Record<string, unknown>) => {
        const prediction = row.predictions as Record<string, unknown>;
        const gwMoment = prediction.game_week_moments as Record<string, unknown>;
        const momentType = gwMoment.moment_types as Record<string, unknown>;
        return {
          id: row.id as number,
          predictionId: row.prediction_id as number,
          userId: row.user_id as string,
          gameweekId: row.gameweek_id as number,
          eventPoints: row.event_points as number,
          timingBonus: row.timing_bonus as number,
          playerBonus: row.player_bonus as number,
          assisterBonus: row.assister_bonus as number,
          zoneBonus: row.zone_bonus as number,
          jackpotBonus: row.jackpot_bonus as number,
          captainMultiplier: row.captain_multiplier as number,
          streakBonus: row.streak_bonus as number,
          totalPoints: row.total_points as number,
          isCorrect: row.is_correct as boolean,
          createdAt: row.created_at as string,
          predictionType: prediction.prediction_type as 'match' | 'moment',
          isCaptain: prediction.is_captain as boolean,
          fixtureId: prediction.fixture_id as number,
          gameWeekMomentId: prediction.game_week_moment_id as number,
          predictedMinute: prediction.predicted_minute as number | null,
          eventName: momentType.name as string,
          eventType: momentType.event_type as string,
          basePoints: gwMoment.base_points as number,
        } satisfies ResultsRow;
      });
    },
    enabled: userId != null && gameweekId != null,
    staleTime: 5 * 60_000, // 5 min — results don't change after scoring_complete
  });
}
