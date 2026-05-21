import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { NewPrediction, Prediction } from '@lecolpo/types';
import { supabase } from '@/src/lib/supabase';

function parsePrediction(raw: Record<string, unknown>): Prediction {
  return {
    id: raw.id as number,
    userId: raw.user_id as string,
    gameweekId: raw.gameweek_id as number,
    fixtureId: raw.fixture_id as number,
    gameWeekMomentId: raw.game_week_moment_id as number,
    predictionType: raw.prediction_type as string,
    isCaptain: raw.is_captain as boolean,
    predictedMinute: raw.predicted_minute as number | null,
    confidenceWindow: raw.confidence_window as number | null,
    predictedPlayerId: raw.predicted_player_id as string | null,
    predictedAssisterId: raw.predicted_assister_id as string | null,
    predictedZone: raw.predicted_zone as string | null,
    createdAt: new Date(raw.created_at as string),
    updatedAt: new Date(raw.updated_at as string),
  };
}

export function useSquadQuery(userId: string | null | undefined, gameweekId: number | null | undefined) {
  return useQuery<Prediction[]>({
    queryKey: ['squad', userId, gameweekId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .eq('user_id', userId!)
        .eq('gameweek_id', gameweekId!);

      if (error) {
        console.error('useSquadQuery error:', error);
        throw error;
      }

      return (data as Record<string, unknown>[]).map(parsePrediction);
    },
    staleTime: 0,
    enabled: userId != null && gameweekId != null,
  });
}

export function useAddPickMutation(userId: string | null | undefined, gameweekId: number | null | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ['squad', userId, gameweekId];

  return useMutation({
    mutationFn: async (newPick: NewPrediction) => {
      const { data, error } = await supabase
        .from('predictions')
        .upsert(newPick, { onConflict: 'user_id,gameweek_id,game_week_moment_id' })
        .select()
        .single();
      if (error) {
        console.error('useAddPickMutation error:', error);
        throw error;
      }
      return parsePrediction(data as Record<string, unknown>);
    },
    onMutate: async (newPick) => {
      await queryClient.cancelQueries({ queryKey });
      const previousSquad = queryClient.getQueryData<Prediction[]>(queryKey);
      // Use a unique negative id to avoid collisions when multiple picks are in-flight simultaneously
      const optimisticId = -(Date.now() + Math.random());
      queryClient.setQueryData<Prediction[]>(queryKey, (old) => [
        ...(old ?? []),
        {
          ...newPick,
          id: optimisticId,
          isCaptain: newPick.isCaptain ?? false,
          predictedMinute: newPick.predictedMinute ?? null,
          confidenceWindow: newPick.confidenceWindow ?? null,
          predictedPlayerId: newPick.predictedPlayerId ?? null,
          predictedAssisterId: newPick.predictedAssisterId ?? null,
          predictedZone: newPick.predictedZone ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Prediction,
      ]);
      return { previousSquad };
    },
    onError: (_err, _newPick, context) => {
      if (context?.previousSquad !== undefined) {
        queryClient.setQueryData(queryKey, context.previousSquad);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey }).catch(() => {});
    },
  });
}

export function useRemovePickMutation(userId: string | null | undefined, gameweekId: number | null | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ['squad', userId, gameweekId];

  return useMutation({
    mutationFn: async (pickId: number) => {
      const { error } = await supabase
        .from('predictions')
        .delete()
        .eq('id', pickId);
      if (error) {
        console.error('useRemovePickMutation error:', error);
        throw error;
      }
    },
    onMutate: async (pickId) => {
      await queryClient.cancelQueries({ queryKey });
      const previousSquad = queryClient.getQueryData<Prediction[]>(queryKey);
      queryClient.setQueryData<Prediction[]>(queryKey, (old) =>
        (old ?? []).filter((p) => p.id !== pickId),
      );
      return { previousSquad };
    },
    onError: (_err, _pickId, context) => {
      if (context?.previousSquad !== undefined) {
        queryClient.setQueryData(queryKey, context.previousSquad);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey }).catch(() => {});
    },
  });
}

export function useCaptainMutation(userId: string | null | undefined, gameweekId: number | null | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ['squad', userId, gameweekId];

  return useMutation({
    mutationFn: async ({ pickId }: { pickId: number; userId: string; gameweekId: number }) => {
      // Set the new captain first — if this fails, the old captain is still set (consistent DB state)
      const { error: setError } = await supabase
        .from('predictions')
        .update({ is_captain: true })
        .eq('id', pickId);
      if (setError) {
        console.error('useCaptainMutation set error:', setError);
        throw setError;
      }
      // Clear all other captains for this user/gameweek — if this fails, briefly two captains exist
      // but onSettled invalidation will re-sync from server
      const { error: clearError } = await supabase
        .from('predictions')
        .update({ is_captain: false })
        .eq('user_id', userId!)
        .eq('gameweek_id', gameweekId!)
        .neq('id', pickId);
      if (clearError) {
        console.error('useCaptainMutation clear error:', clearError);
        throw clearError;
      }
    },
    onMutate: async ({ pickId }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousSquad = queryClient.getQueryData<Prediction[]>(queryKey);
      queryClient.setQueryData<Prediction[]>(queryKey, (old) =>
        (old ?? []).map((p) => ({ ...p, isCaptain: p.id === pickId })),
      );
      return { previousSquad };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousSquad !== undefined) {
        queryClient.setQueryData(queryKey, context.previousSquad);
      }
    },
    onSettled: (_data, _err, vars) => {
      queryClient.invalidateQueries({ queryKey: ['squad', vars.userId, vars.gameweekId] }).catch(() => {});
    },
  });
}

export function useSaveSquadMutation(userId: string | null | undefined, gameweekId: number | null | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ['squad', userId, gameweekId];

  return useMutation({
    mutationFn: async (picks: NewPrediction[]) => {
      const { error } = await supabase
        .from('predictions')
        .upsert(picks, { onConflict: 'user_id,gameweek_id,game_week_moment_id' });
      if (error) {
        console.error('useSaveSquadMutation error:', error);
        throw error;
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey }).catch(() => {});
    },
  });
}
