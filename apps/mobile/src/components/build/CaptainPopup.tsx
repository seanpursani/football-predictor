import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Prediction } from '@lecolpo/types';
import type { MomentType } from '@lecolpo/types';
import { TypeBadge } from '@/src/components/shared/TypeBadge';
import { Typography } from '@/src/lib/typography';

interface CaptainPopupProps {
  pick: Prediction | null;
  momentType: MomentType | null;
  visible: boolean;
  onSelectCaptain: (pick: Prediction) => void;
  onRemove: (pick: Prediction) => void;
  onDismiss: () => void;
}

export function CaptainPopup({
  pick,
  momentType,
  visible,
  onSelectCaptain,
  onRemove,
  onDismiss,
}: CaptainPopupProps) {
  const insets = useSafeAreaInsets();

  if (!pick) return null;

  const badgeVariant: 'match' | 'moment' =
    momentType?.predictionType === 'match' ? 'match' : 'moment';
  const contextLabel = momentType?.name ?? `Pick #${pick.gameWeekMomentId}`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
    >
      {/* Backdrop */}
      <TouchableOpacity
        style={styles.backdrop}
        onPress={onDismiss}
        activeOpacity={1}
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
        testID="captain-popup-backdrop"
      />

      {/* Sheet */}
      <View
        style={[styles.sheet, { paddingBottom: 32 + insets.bottom }]}
        accessibilityViewIsModal
      >
        {/* Context label */}
        <View style={styles.contextRow}>
          <Text style={styles.contextText} numberOfLines={1}>
            {contextLabel}
          </Text>
          <TypeBadge variant={badgeVariant} />
        </View>

        {/* Select as Captain */}
        <TouchableOpacity
          style={styles.captainButton}
          onPress={() => onSelectCaptain(pick)}
          accessibilityRole="button"
          accessibilityLabel="Select as captain"
        >
          <Text style={styles.captainButtonText}>👑 Select as Captain</Text>
        </TouchableOpacity>

        {/* Remove pick */}
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => onRemove(pick)}
          accessibilityRole="button"
          accessibilityLabel="Remove this pick"
        >
          <Text style={styles.removeButtonText}>✕ Remove pick</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#141414',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  contextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 16,
  },
  contextText: {
    ...Typography.body,
    color: '#7A7A7A',
    flex: 1,
  },
  captainButton: {
    backgroundColor: '#1C1C1C',
    borderRadius: 6,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 44,
    marginBottom: 4,
  },
  captainButtonText: {
    ...Typography.label,
    color: '#B4FF32',
  },
  removeButton: {
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 44,
  },
  removeButtonText: {
    ...Typography.body,
    color: '#FF4444',
  },
});

