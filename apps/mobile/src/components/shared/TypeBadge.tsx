import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Typography } from '@/src/lib/typography';

interface TypeBadgeProps {
  variant: 'match' | 'moment';
}

export function TypeBadge({ variant }: TypeBadgeProps) {
  return (
    <View style={variant === 'match' ? styles.matchContainer : styles.momentContainer}>
      <Text style={variant === 'match' ? styles.matchText : styles.momentText}>
        {variant === 'match' ? 'MATCH' : 'MOMENT'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  matchContainer: {
    backgroundColor: 'rgba(180,255,50,0.12)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  momentContainer: {
    backgroundColor: 'rgba(167,139,250,0.15)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  matchText: {
    ...Typography.label,
    color: '#B4FF32',
  },
  momentText: {
    ...Typography.label,
    color: '#A78BFA',
  },
});

