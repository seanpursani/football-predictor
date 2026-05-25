import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { MomentType } from '@lecolpo/types';
import type { CatalogItem } from '@/src/queries/useCatalogQuery';
import { TypeBadge } from '@/src/components/shared/TypeBadge';
import { Typography } from '@/src/lib/typography';

interface MomentCatalogRowProps {
  item: CatalogItem;
  momentType: MomentType;
  isAdded: boolean;
  historicalDots?: Array<{ correct: boolean }>;
  onTap: () => void;
}

export function MomentCatalogRow({ item, momentType, isAdded, historicalDots, onTap }: MomentCatalogRowProps) {
  const isMatch = momentType.predictionType === 'match';
  const pointsLabel = isMatch ? String(item.basePoints) : `${item.basePoints}+`;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={isAdded ? undefined : onTap}
      activeOpacity={isAdded ? 1 : 0.7}
      accessibilityRole="button"
      accessibilityState={{ disabled: isAdded }}
      accessibilityLabel={`${momentType.name}, ${pointsLabel} points${isAdded ? ', already added' : ''}`}
    >
      <View style={styles.left}>
        <Text style={styles.name}>{momentType.name}</Text>
        {historicalDots && historicalDots.length > 0 && (
          <View style={styles.dotsRow}>
            {historicalDots.map((dot, i) => (
              <View
                key={i}
                style={[styles.dot, { backgroundColor: dot.correct ? '#B4FF32' : '#404040' }]}
              />
            ))}
          </View>
        )}
      </View>
      <View style={styles.right}>
        <TypeBadge variant={isMatch ? 'match' : 'moment'} />
        <Text style={styles.points}>{pointsLabel}</Text>
        {isAdded ? (
          <Text style={styles.checkmark}>✓</Text>
        ) : !isMatch ? (
          <Text style={styles.arrow}>→</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E',
  },
  left: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    ...Typography.body,
    color: '#FFFFFF',
  },
  dotsRow: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  points: {
    ...Typography.body,
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  checkmark: {
    ...Typography.body,
    color: '#B4FF32',
    fontWeight: '700',
  },
  arrow: {
    ...Typography.body,
    color: '#7A7A7A',
  },
});

