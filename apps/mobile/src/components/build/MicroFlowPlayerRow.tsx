import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Typography } from '@/src/lib/typography';
import type { MicroFlowPlayer } from '@/src/queries/useMicroFlowQuery';

interface MicroFlowPlayerRowProps {
  player: MicroFlowPlayer;
  isSelected: boolean;
  onSelect: (player: MicroFlowPlayer) => void;
}

export function MicroFlowPlayerRow({ player, isSelected, onSelect }: MicroFlowPlayerRowProps) {
  return (
    <TouchableOpacity
      style={[styles.container, isSelected && styles.containerSelected]}
      onPress={() => onSelect(player)}
      accessibilityRole="radio"
      accessibilityState={{ checked: isSelected }}
      accessibilityLabel={`${player.name}, ${player.bonusPoints} bonus points`}
    >
      <Text style={[styles.name, isSelected && styles.nameSelected]}>{player.name}</Text>
      <Text style={styles.bonus}>{`+${player.bonusPoints} pts`}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 44,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E',
  },
  containerSelected: {
    backgroundColor: '#1C1C1C',
  },
  name: {
    ...Typography.body,
    color: '#FFFFFF',
  },
  nameSelected: {
    color: '#B4FF32',
  },
  bonus: {
    ...Typography.label,
    color: '#7A7A7A',
  },
});

