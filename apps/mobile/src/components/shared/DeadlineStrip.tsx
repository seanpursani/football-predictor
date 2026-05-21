import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { Typography } from '@/src/lib/typography';

type DeadlineState = 'hidden' | 'approaching' | 'urgent' | 'critical';

function deriveState(deadline: Date, now: number): DeadlineState {
  const diff = deadline.getTime() - now;
  const threeHours = 3 * 60 * 60 * 1000;
  const oneHour = 60 * 60 * 1000;
  const fifteenMin = 15 * 60 * 1000;

  if (diff > threeHours) return 'hidden';
  if (diff > oneHour) return 'approaching';
  if (diff > fifteenMin) return 'urgent';
  return 'critical';
}

interface DeadlineStripProps {
  deadlineTimestamp: Date | null;
}

export function DeadlineStrip({ deadlineTimestamp }: DeadlineStripProps) {
  const [state, setState] = useState<DeadlineState>('hidden');
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (!deadlineTimestamp) {
      setState('hidden');
      return;
    }

    const update = () => setState(deriveState(deadlineTimestamp, Date.now()));
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [deadlineTimestamp]);

  useEffect(() => {
    if (state === 'critical') {
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.7, { duration: 500 }),
          withTiming(1.0, { duration: 500 }),
        ),
        -1,
        false,
      );
    } else {
      opacity.value = 1;
    }
  }, [state, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  if (state === 'hidden') return null;

  if (state === 'approaching') {
    return (
      <View style={styles.approachingContainer}>
        <Text style={styles.approachingText}>Deadline approaching</Text>
      </View>
    );
  }

  if (state === 'urgent') {
    return (
      <View style={styles.urgentContainer}>
        <Text style={styles.urgentText}>⚠️ Deadline under 1 hour</Text>
      </View>
    );
  }

  // critical
  return (
    <Animated.View
      style={[styles.criticalContainer, animatedStyle]}
      {...({ accessibilityLiveRegion: 'polite' } as object)}
    >
      <Text style={styles.criticalText}>🔴 Under 15 minutes to deadline!</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  approachingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  approachingText: {
    ...Typography.label,
    color: '#7A7A7A',
  },
  urgentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,107,53,0.12)',
  },
  urgentText: {
    ...Typography.label,
    color: '#FF6B35',
  },
  criticalContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FF6B35',
  },
  criticalText: {
    ...Typography.label,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

