import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { useAuthState } from '@/src/hooks/useAuthState';
import { queryClient } from '@/src/lib/queryClient';
import { supabase } from '@/src/lib/supabase';
import { requestPushPermissionAndGetToken } from '@/src/lib/notifications';
import { Typography } from '@/src/lib/typography';

const RULES = [
  {
    type: 'MATCH' as const,
    title: 'MATCH picks',
    body: 'Will a specific event happen in the match? Yes = flat points. Simple.',
  },
  {
    type: 'MOMENT' as const,
    title: 'MOMENT picks',
    body: 'Predict the player, minute, and confidence window. More precision = more points.',
  },
  {
    type: null,
    title: 'Captain',
    body: 'Designate one pick as Captain for 2× points. Choose wisely.',
  },
  {
    type: null,
    title: 'Streaks',
    body: 'Consecutive correct Moment picks across all matches earn streak bonuses (+10 / +20 / +30 pts).',
  },
  {
    type: null,
    title: '20 tokens',
    body: 'You have 20 tokens per gameweek across all fixtures. Spend them carefully.',
  },
];

export default function OnboardingScreen() {
  const { session } = useAuthState();
  const router = useRouter();

  const handleComplete = async () => {
    const authId = session?.user?.id;
    if (!authId) return;

    // 1. Mark onboarding seen first — must succeed before navigating
    const { error: onboardingError } = await supabase
      .from('users')
      .update({ has_seen_onboarding: true })
      .eq('auth_id', authId);
    if (onboardingError) {
      // Cannot proceed — user would be stuck in onboarding loop on next launch
      console.error('[Onboarding] Failed to mark has_seen_onboarding:', onboardingError.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['user', authId] });

    // 2. Request push permission (may return null — never blocking)
    const token = await requestPushPermissionAndGetToken();
    if (token) {
      const { error: tokenError } = await supabase
        .from('users')
        .update({ push_token: token })
        .eq('auth_id', authId);
      if (tokenError) {
        console.error('[Onboarding] Failed to store push token:', tokenError.message);
        // Non-blocking — navigation proceeds, push notifications simply won't work
      } else {
        queryClient.invalidateQueries({ queryKey: ['user', authId] });
      }
    }

    // 3. Navigate regardless of push outcome
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>How it works</Text>
        <Text style={styles.subheading}>5 rules. Under 60 seconds.</Text>

        {RULES.map((rule, idx) => (
          <View
            key={idx}
            style={[
              styles.ruleRow,
              rule.type === 'MATCH' && styles.ruleRowMatch,
              rule.type === 'MOMENT' && styles.ruleRowMoment,
            ]}
          >
            {rule.type && (
              <View
                style={[
                  styles.typeBadge,
                  rule.type === 'MATCH' ? styles.typeBadgeMatch : styles.typeBadgeMoment,
                ]}
              >
                <Text
                  style={[
                    styles.typeBadgeText,
                    rule.type === 'MATCH' ? styles.typeBadgeTextMatch : styles.typeBadgeTextMoment,
                  ]}
                >
                  {rule.type}
                </Text>
              </View>
            )}
            <Text style={styles.ruleTitle}>{rule.title}</Text>
            <Text style={styles.ruleBody}>{rule.body}</Text>
          </View>
        ))}

        <TouchableOpacity
          style={styles.ctaButton}
          onPress={handleComplete}
          accessibilityLabel="Let's go"
        >
          <Text style={styles.ctaButtonText}>{"Let's go"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080808',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 32,
  },
  heading: {
    ...Typography.heading1,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subheading: {
    ...Typography.body,
    color: '#7A7A7A',
    marginBottom: 32,
  },
  ruleRow: {
    paddingVertical: 12,
    marginBottom: 12,
    borderRadius: 6,
    paddingHorizontal: 12,
  },
  ruleRowMatch: {
    backgroundColor: 'rgba(180,255,50,0.12)',
  },
  ruleRowMoment: {
    backgroundColor: 'rgba(167,139,250,0.15)',
  },
  typeBadge: {
    alignSelf: 'flex-start',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 6,
  },
  typeBadgeMatch: {
    backgroundColor: 'rgba(180,255,50,0.2)',
  },
  typeBadgeMoment: {
    backgroundColor: 'rgba(167,139,250,0.2)',
  },
  typeBadgeText: {
    ...Typography.label,
    fontSize: 11,
  },
  typeBadgeTextMatch: {
    color: '#B4FF32',
  },
  typeBadgeTextMoment: {
    color: '#A78BFA',
  },
  ruleTitle: {
    ...Typography.label,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  ruleBody: {
    ...Typography.body,
    color: '#CCCCCC',
  },
  ctaButton: {
    backgroundColor: '#B4FF32',
    borderRadius: 6,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  ctaButtonText: {
    ...Typography.label,
    color: '#000000',
  },
});
