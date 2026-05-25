import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Typography } from '@/src/lib/typography';

const ZONE_VALUES = [5, 10, 15] as const;
type Zone = 5 | 10 | 15;

const DEFAULT_BONUS: Record<Zone, number> = {
  5: 50,
  10: 25,
  15: 0,
};

interface ZoneChipProps {
  value: Zone;
  bonusPoints?: Record<Zone, number>;
  onChange: (zone: Zone) => void;
}

export function ZoneChip({ value, bonusPoints, onChange }: ZoneChipProps) {
  const bonus = bonusPoints ?? DEFAULT_BONUS;

  return (
    <View style={styles.row}>
      {ZONE_VALUES.map((zone) => {
        const isActive = value === zone;
        return (
          <TouchableOpacity
            key={zone}
            style={[styles.chip, isActive ? styles.chipActive : styles.chipInactive]}
            onPress={() => onChange(zone)}
            accessibilityRole="radio"
            accessibilityState={{ checked: isActive }}
            accessibilityLabel={`Plus or minus ${zone} minutes, ${bonus[zone]} bonus points`}
          >
            <Text style={[styles.chipLabel, isActive ? styles.chipLabelActive : styles.chipLabelInactive]}>
              {`\u00B1${zone}`}
            </Text>
            <Text style={[styles.bonusLabel, isActive ? styles.bonusLabelActive : styles.bonusLabelInactive]}>
              {`+${bonus[zone]} pts`}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    minHeight: 44,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: 'rgba(180,255,50,0.12)',
    borderColor: '#B4FF32',
  },
  chipInactive: {
    backgroundColor: '#141414',
    borderColor: '#1E1E1E',
  },
  chipLabel: {
    ...Typography.label,
  },
  chipLabelActive: {
    color: '#B4FF32',
  },
  chipLabelInactive: {
    color: '#7A7A7A',
  },
  bonusLabel: {
    ...Typography.caption,
  },
  bonusLabelActive: {
    color: '#B4FF32',
  },
  bonusLabelInactive: {
    color: '#7A7A7A',
  },
});

