import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/src/lib/supabase';

export interface MicroFlowPlayer {
  id: string;
  name: string;
  bonusPoints: number;
  sortOrder: number;
}

export function useMicroFlowPlayersQuery(
  fixtureId: number | null | undefined,
  momentCardId: number | null | undefined,
) {
  return useQuery<MicroFlowPlayer[]>({
    queryKey: ['microflow-players', fixtureId, momentCardId],
    queryFn: async () => {
      // Try dedicated players join table first
      const { data: momentPlayerData, error: momentPlayerError } = await supabase
        .from('game_week_moment_players')
        .select('player_id, bonus_points, sort_order, players(id, name)')
        .eq('game_week_moment_id', momentCardId!);

      if (!momentPlayerError && momentPlayerData && momentPlayerData.length > 0) {
        return (momentPlayerData as Record<string, unknown>[])
          .map((row) => {
            const player = row.players as Record<string, unknown> | null;
            return {
              id: (player?.id ?? row.player_id) as string,
              name: (player?.name ?? 'Unknown') as string,
              bonusPoints: (row.bonus_points as number) ?? 0,
              sortOrder: (row.sort_order as number) ?? 0,
            };
          })
          .sort((a, b) => a.sortOrder - b.sortOrder);
      }

      // Fallback: fetch from players table using team_id from game_week_moments
      const { data: momentData, error: momentError } = await supabase
        .from('game_week_moments')
        .select('player_bonus_points, team_id')
        .eq('id', momentCardId!)
        .single();

      if (momentError) {
        console.error('useMicroFlowPlayersQuery moment fetch error:', momentError);
        throw momentError;
      }

      const teamId = (momentData as Record<string, unknown> | null)?.team_id as string | null;
      const bonusPoints = ((momentData as Record<string, unknown> | null)?.player_bonus_points as number) ?? 0;

      if (!teamId) {
        console.error('useMicroFlowPlayersQuery: no team_id on game_week_moment', momentCardId);
        throw new Error('Player list unavailable');
      }

      // Log when falling through to fallback so production issues are visible
      if (momentPlayerError) {
        console.error('useMicroFlowPlayersQuery: game_week_moment_players error, using fallback', momentPlayerError);
      }

      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('id, name, position')
        .eq('team_id', teamId)
        .order('name');

      if (playersError) {
        console.error('useMicroFlowPlayersQuery players fetch error:', playersError);
        throw playersError;
      }

      return ((playersData ?? []) as Record<string, unknown>[]).map((p, i) => ({
        id: p.id as string,
        name: p.name as string,
        bonusPoints,
        sortOrder: i,
      }));
    },
    staleTime: Infinity,
    enabled: fixtureId != null && momentCardId != null,
  });
}

