import {Ionicons} from '@expo/vector-icons';
import {Tabs} from 'expo-router';
import React from 'react';

import {HapticTab} from '@/components/haptic-tab';
import {Colors} from '@/constants/theme';

export default function TabLayout() {
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
