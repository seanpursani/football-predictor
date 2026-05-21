import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Typography } from '@/src/lib/typography';

interface GameweekHeaderProps {
  gameweekNumber: number;
  usedPicks: number;
  totalPicks: number;
  phase: 'building' | 'locked' | 'reveal';
}

export function GameweekHeader({ gameweekNumber, usedPicks, totalPicks, phase }: GameweekHeaderProps) {
  const leftLabel =
    phase === 'reveal' ? `GW ${gameweekNumber} · Results` : `GW ${gameweekNumber}`;

  let accessibilityLabel: string;
  if (phase === 'building') {
    accessibilityLabel = `Gameweek ${gameweekNumber}, ${usedPicks} of ${totalPicks} picks used`;
  } else if (phase === 'locked') {
    accessibilityLabel = `Gameweek ${gameweekNumber}, locked`;
  } else {
    accessibilityLabel = `Gameweek ${gameweekNumber} results`;
  }

  return (
    <View style={styles.container} accessibilityLabel={accessibilityLabel}>
      <Text style={styles.leftText}>{leftLabel}</Text>
      {phase === 'building' && (
        <Text style={styles.counter}>
          {usedPicks}/{totalPicks}
        </Text>
      )}
      {phase === 'locked' && (
        <View style={styles.lockedBadge}>
          <Text style={styles.lockedText}>🔒 Locked</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leftText: {
    ...Typography.heading2,
    color: '#FFFFFF',
  },
  counter: {
    ...Typography.heading2,
    color: '#B4FF32',
    fontVariant: ['tabular-nums'],
  },
  lockedBadge: {
    backgroundColor: 'rgba(167,139,250,0.15)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  lockedText: {
    ...Typography.label,
    color: '#A78BFA',
  },
});

