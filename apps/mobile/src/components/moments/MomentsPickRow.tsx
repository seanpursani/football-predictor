import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Prediction } from '@lecolpo/types';
import { TypeBadge } from '@/src/components/shared/TypeBadge';
import { Typography } from '@/src/lib/typography';

// Intentionally copied from build/PickRow — do NOT import from build/ (different feature boundary)
const EVENT_ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  goal: 'football',
  yellow_card: 'card',
  red_card: 'card',
  corner: 'flag',
  substitution: 'swap-horizontal',
  match_result: 'trophy',
};

interface MomentsPickRowProps {
  eventName: string;
  eventType: string;
  predictionType: 'match' | 'moment';
  isCaptain: boolean;
  basePoints: number;
  predictedMinute?: number | null;
}

export function MomentsPickRow({
  eventName,
  eventType,
  predictionType,
  isCaptain,
  basePoints,
  predictedMinute,
}: MomentsPickRowProps) {
  const iconName = EVENT_ICON_MAP[eventType] ?? 'star';
  const displayName =
    predictionType === 'moment' && predictedMinute != null
      ? `${eventName} · min ${predictedMinute}`
      : eventName;

  return (
    <View
      style={styles.container}
      accessibilityRole="text"
      accessibilityLabel={`${eventName} pick, ${predictionType}${isCaptain ? ', captain' : ''}, pending`}
    >
      <View style={styles.left}>
        <Ionicons name={iconName} size={20} color="#7A7A7A" />
        <Text style={styles.name}>{displayName}</Text>
        <TypeBadge variant={predictionType} />
      </View>
      <View style={styles.right}>
        <Text style={styles.points}>{basePoints}</Text>
        {isCaptain && <Text style={styles.captain}>👑</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44,
    backgroundColor: '#141414',
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  name: {
    ...Typography.body,
    color: '#7A7A7A',
    flexShrink: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  points: {
    ...Typography.body,
    color: '#7A7A7A',
    fontVariant: ['tabular-nums'],
  },
  captain: {
    fontSize: 16,
  },
});
