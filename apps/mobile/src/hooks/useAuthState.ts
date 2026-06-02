import {Session, User} from '@supabase/supabase-js';
import {useEffect, useState} from 'react';

import {supabase} from '../lib/supabase';
import {queryClient} from "@/src/lib/queryClient";
import {debugLog} from "@/src/lib/debugLog";

const log = debugLog('useAuthState');

export interface AuthState {
    session: Session | null;
    user: User | null;
    isLoading: boolean;
}

/**
 * Subscribes to Supabase auth state changes and returns the current session/user.
 * isLoading is true only during the initial session check.
 */
export function useAuthState(): AuthState {
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Initial session check
        supabase.auth.getSession().then(({data}) => {
            log.info('Initial session check', {
                hasSession: !!data.session,
                userId: data.session?.user?.id ?? null,
            });
            setSession(data.session);
            setIsLoading(false);
        });

        // Subscribe to auth changes
        const {data: {subscription}} = supabase.auth.onAuthStateChange((_event, newSession) => {
            log.info('Auth state changed', {
                event: _event,
                userId: newSession?.user?.id ?? null,
            });
            if (_event === 'SIGNED_OUT') {
                queryClient.clear();
            }
            setSession(newSession);
            setIsLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    return {
        session,
        user: session?.user ?? null,
        isLoading,
    };
}

