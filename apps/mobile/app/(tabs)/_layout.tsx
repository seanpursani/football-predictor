import {Ionicons} from '@expo/vector-icons';
import {Tabs} from 'expo-router';
import React, {useEffect} from 'react';
import {AccessibilityInfo, AppState} from 'react-native';

import {HapticTab} from '@/components/haptic-tab';
import {Colors} from '@/constants/theme';
import {queryClient} from '@/src/lib/queryClient';
import {useGameweekQuery, useUserGameweekStateQuery} from '@/src/queries/useGameweekQuery';
import {useGameweekStore} from '@/src/stores/useGameweekStore';
import {useRevealStore} from '@/src/stores/useRevealStore';
import {deriveGameweekPhase} from '@/src/utils/gameweekPhase';
import {useAuthState} from '@/src/hooks/useAuthState';

export default function TabLayout() {
    const {session} = useAuthState();
    const userId = session?.user?.id ?? null;

    const {data: gameweek} = useGameweekQuery();
    const {data: revealState, isLoading: revealStateLoading} = useUserGameweekStateQuery(gameweek?.id, userId);

    const setPhase = useGameweekStore((s) => s.setPhase);
    const setCurrentGameweekId = useGameweekStore((s) => s.setCurrentGameweekId);
    const setReduceMotion = useRevealStore((s) => s.setReduceMotion);

    // Derive and sync phase whenever query data changes.
    // Guard on !revealStateLoading to avoid a transient 'reveal' flash while
    // the reveal-state query is in-flight (hasSeenReveal would default false).
    useEffect(() => {
        if (revealStateLoading) return;
        const hasSeenReveal = revealState?.hasSeenReveal ?? false;
        const phase = deriveGameweekPhase(gameweek, hasSeenReveal, new Date());
        setPhase(phase);
        setCurrentGameweekId(gameweek?.id ?? null);
    }, [gameweek, revealState, revealStateLoading, setPhase, setCurrentGameweekId]);

    // Invalidate gameweek query on app foreground
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextState) => {
            if (nextState === 'active') {
                queryClient.invalidateQueries({queryKey: ['gameweek', 'current']});
            }
        });
        return () => subscription.remove();
    }, []);

    // Check reduceMotion once on mount
    useEffect(() => {
        AccessibilityInfo.isReduceMotionEnabled()
            .then((enabled) => {
                setReduceMotion(enabled);
            })
            .catch((e) => {
                console.error('AccessibilityInfo.isReduceMotionEnabled failed:', e);
            });
    }, [setReduceMotion]);

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: Colors.accent,
                tabBarInactiveTintColor: Colors.text.muted,
                tabBarStyle: {backgroundColor: Colors.bg.primary},
                headerShown: false,
                tabBarButton: HapticTab,
            }}>
            <Tabs.Screen
                name="build"
                options={{
                    title: 'Build',
                    tabBarIcon: ({color, size}) => <Ionicons name="construct-outline" size={size} color={color}/>,
                }}
            />
            <Tabs.Screen
                name="moments"
                options={{
                    title: 'Moments',
                    tabBarIcon: ({color, size}) => <Ionicons name="flash-outline" size={size} color={color}/>,
                }}
            />
            <Tabs.Screen
                name="leagues"
                options={{
                    title: 'Leagues',
                    tabBarIcon: ({color, size}) => <Ionicons name="trophy-outline" size={size} color={color}/>,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({color, size}) => <Ionicons name="person-outline" size={size} color={color}/>,
                }}
            />
        </Tabs>
    );
}
