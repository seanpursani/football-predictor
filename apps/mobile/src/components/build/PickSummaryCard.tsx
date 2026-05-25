import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Typography } from '@/src/lib/typography';

interface PickSummaryCardProps {
  basePoints: number;
  playerBonus: number;
  zoneBonus: number;
}

export function PickSummaryCard({ basePoints, playerBonus, zoneBonus }: PickSummaryCardProps) {
  const total = basePoints + playerBonus + zoneBonus;

  return (
    <View style={styles.card}>
      <View style={styles.labelRow}>
        <Text style={styles.labelText}>{`Base: ${basePoints}`}</Text>
        <Text style={styles.labelText}>{`Player: +${playerBonus}`}</Text>
        <Text style={styles.labelText}>{`Zone: +${zoneBonus}`}</Text>
      </View>
      <Text style={styles.caption}>Potential points</Text>
      <Text style={styles.total}>{`${total} pts`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#141414',
    borderRadius: 8,
    padding: 16,
    marginVertical: 12,
    alignItems: 'center',
  },
  labelRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  labelText: {
    ...Typography.label,
    color: '#7A7A7A',
  },
  caption: {
    ...Typography.caption,
    color: '#7A7A7A',
    marginBottom: 4,
  },
  total: {
    ...Typography.monoNumber,
    color: '#B4FF32',
    fontSize: 32,
  },
});

