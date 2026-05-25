import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Prediction, MomentType } from '@lecolpo/types';
import type { CatalogItem } from '@/src/queries/useCatalogQuery';
import { TypeBadge } from '@/src/components/shared/TypeBadge';
import { Typography } from '@/src/lib/typography';

const EVENT_ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  goal: 'football',
  yellow_card: 'card',
  red_card: 'card',
  corner: 'flag',
  substitution: 'swap-horizontal',
  match_result: 'trophy',
};

interface PickRowProps {
  pick: Prediction;
  momentCard: CatalogItem;
  momentType: MomentType;
  isCaptain: boolean;
  onTap: (pick: Prediction) => void;
}

export function PickRow({ pick, momentCard, momentType, isCaptain, onTap }: PickRowProps) {
  const iconName = EVENT_ICON_MAP[momentType.eventType] ?? 'star';
  const isMatch = pick.predictionType === 'match';

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onTap(pick)}
      accessibilityRole="button"
      accessibilityLabel={`${momentType.name} pick${isCaptain ? ', captain' : ''}`}
      hitSlop={{ top: 4, bottom: 4, left: 0, right: 0 }}
    >
      <View style={styles.left}>
        <Ionicons name={iconName} size={20} color="#7A7A7A" />
        <Text style={styles.name}>{momentType.name}</Text>
        <TypeBadge variant={isMatch ? 'match' : 'moment'} />
      </View>
      <View style={styles.right}>
        <Text style={styles.points}>{momentCard.basePoints}</Text>
        {isCaptain && <Text style={styles.captain}>👑</Text>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  name: {
    ...Typography.body,
    color: '#FFFFFF',
    flexShrink: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  points: {
    ...Typography.body,
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  captain: {
    fontSize: 16,
  },
});

