import { useMutation, useQuery } from '@tanstack/react-query';

import { supabase } from '../lib/supabase';
import { queryClient } from '../lib/queryClient';

export interface UserRecord {
  id: string;
  authId: string;
  displayName: string | null;
  hasSeenOnboarding: boolean;
  pushToken: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Fetches the user record from the `users` table for a given authId.
 */
export function useUserQuery(authId: string | null | undefined) {
  return useQuery<UserRecord | null>({
    queryKey: ['user', authId],
    queryFn: async () => {
      if (!authId) return null;
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authId)
        .maybeSingle();
      if (error) throw error;
      return data
        ? {
            id: data.id,
            authId: data.auth_id,
            displayName: data.display_name,
            hasSeenOnboarding: data.has_seen_onboarding,
            pushToken: data.push_token,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          }
        : null;
    },
    enabled: !!authId,
  });
}

/**
 * Upserts a user row in the `users` table on first sign-in.
 * Uses conflict-do-nothing on auth_id so repeated calls are safe.
 */
export function useUpsertUserMutation() {
  return useMutation({
    mutationFn: async (authId: string) => {
      const { error } = await supabase
        .from('users')
        .upsert({ auth_id: authId }, { onConflict: 'auth_id', ignoreDuplicates: true });
      if (error) throw error;
    },
    onSuccess: (_data, authId) => {
      queryClient.invalidateQueries({ queryKey: ['user', authId] });
    },
  });
}

