import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { TypeBadge } from '@/src/components/shared/TypeBadge';
import { Typography } from '@/src/lib/typography';

// ─── Types ────────────────────────────────────────────────────────────────────

export type RevealState =
  | 'pending'
  | 'revealing'
  | 'hit'
  | 'miss'
  | 'captain-hit'
  | 'jackpot';

export interface RevealCardProps {
  revealState: RevealState;
  // Card content (mirrors MomentsPickRow anatomy)
  eventName: string;
  eventType: string; // key into EVENT_ICON_MAP
  predictionType: 'match' | 'moment';
  pointsValue: number;
  isCaptain: boolean;
  // Reveal control
  firstView: boolean; // false = render final state instantly, no animation, no haptic
  reduceMotion: boolean; // true = instant transition, haptics still fire
  // Streak chain
  isStreakChained?: boolean;
  streakBonusPoints?: 10 | 20 | 30 | null;
  // Callbacks
  onRevealComplete?: () => void;
  testID?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COLOURS = {
  lime: '#B4FF32',
  limeAlpha15: 'rgba(180,255,50,0.15)',
  gold: '#FFD700',
  goldAlpha15: 'rgba(255,215,0,0.15)',
  goldAlpha20: 'rgba(255,215,0,0.20)',
  goldAlpha25: 'rgba(255,215,0,0.25)',
  missBg: '#303030',
  textPrimary: '#FFFFFF',
  textMuted: '#7A7A7A',
  surface: '#141414',
  borderSubtle: '#1E1E1E',
} as const;

// Intentionally copied — do NOT import from build/ or moments/ (feature boundary)
const EVENT_ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  goal: 'football',
  yellow_card: 'card',
  red_card: 'card',
  corner: 'flag',
  substitution: 'swap-horizontal',
  match_result: 'trophy',
};

const RESULT_ICONS: Partial<
  Record<RevealState, { icon: keyof typeof Ionicons.glyphMap; color: string }>
> = {
  hit: { icon: 'checkmark-circle', color: COLOURS.lime },
  miss: { icon: 'close-circle', color: COLOURS.textMuted },
  'captain-hit': { icon: 'checkmark-circle', color: COLOURS.lime },
  jackpot: { icon: 'flash', color: COLOURS.gold },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function RevealCard({
  revealState,
  eventName,
  eventType,
  predictionType,
  pointsValue,
  isCaptain,
  firstView,
  reduceMotion,
  isStreakChained,
  streakBonusPoints,
  onRevealComplete,
  testID,
}: RevealCardProps) {
  // ── Animated shared values ──────────────────────────────────────────────────
  const contentOpacity = useSharedValue(
    firstView ? (revealState === 'pending' ? 0.4 : 1.0) : 1.0,
  );
  const cardScale = useSharedValue(1.0);
  const bgOpacity = useSharedValue(0);
  const crownScale = useSharedValue(1.0);
  const streakBgOpacity = useSharedValue(0);
  const badgeScale = useSharedValue(firstView ? 0.8 : 1.0);

  // ── Helper: animate or instant ──────────────────────────────────────────────
  const animate = (toValue: number, config?: Parameters<typeof withTiming>[1]) =>
    reduceMotion ? toValue : withTiming(toValue, config);

  // ── Effect: trigger animations on state changes ─────────────────────────────
  useEffect(() => {
    // firstView=false: render final state immediately — NO animations, NO haptics
    if (!firstView) {
      // Snap to final values synchronously
      switch (revealState) {
        case 'pending':
          contentOpacity.value = 0.4;
          bgOpacity.value = 0;
          break;
        case 'hit':
          contentOpacity.value = 1.0;
          bgOpacity.value = 0.15;
          break;
        case 'miss':
          contentOpacity.value = 1.0;
          bgOpacity.value = 1.0;
          break;
        case 'captain-hit':
          contentOpacity.value = 1.0;
          bgOpacity.value = 0.15;
          crownScale.value = 1.0;
          break;
        case 'jackpot':
          contentOpacity.value = 1.0;
          bgOpacity.value = 0.25;
          cardScale.value = 1.0;
          break;
        case 'revealing':
          contentOpacity.value = 0.7;
          break;
      }
      return; // NO haptics when firstView=false
    }

    // firstView=true: fire haptics directly on JS thread (before animations)
    fireHaptic(revealState);

    // firstView=true: run animations
    switch (revealState) {
      case 'pending':
        contentOpacity.value = animate(0.4, { duration: 150 });
        bgOpacity.value = 0;
        break;

      case 'revealing':
        // Subtle pulse: scale 1.0→1.02→1.0, opacity 0.4→0.7
        if (!reduceMotion) {
          cardScale.value = withSequence(
            withSpring(1.02, { damping: 12, stiffness: 200 }),
            withSpring(1.0, { damping: 12, stiffness: 200 }),
          );
        }
        contentOpacity.value = animate(0.7, { duration: 150 });
        break;

      case 'hit':
        contentOpacity.value = animate(1.0, { duration: 300 });
        if (reduceMotion) {
          bgOpacity.value = 0.15;
          if (onRevealComplete) onRevealComplete();
        } else {
          bgOpacity.value = withTiming(0.15, { duration: 300 }, (finished) => {
            if (finished && onRevealComplete) runOnJS(onRevealComplete)();
          });
        }
        break;

      case 'miss':
        contentOpacity.value = animate(1.0, { duration: 300 });
        // No haptic for miss — fireHaptic() is a no-op for 'miss'
        if (reduceMotion) {
          bgOpacity.value = 1.0;
          if (onRevealComplete) onRevealComplete();
        } else {
          bgOpacity.value = withTiming(1.0, { duration: 300 }, (finished) => {
            if (finished && onRevealComplete) runOnJS(onRevealComplete)();
          });
        }
        break;

      case 'captain-hit':
        // Gold double-flash (×2) then settle at 0.15
        if (!reduceMotion) {
          bgOpacity.value = withSequence(
            withTiming(0.2, { duration: 150 }),
            withTiming(0, { duration: 150 }),
            withTiming(0.2, { duration: 150 }),
            withTiming(0, { duration: 150 }),
            withTiming(0.15, { duration: 150 }, (finished) => {
              if (finished && onRevealComplete) runOnJS(onRevealComplete)();
            }),
          );
          crownScale.value = withSpring(1.3, { damping: 8, stiffness: 150 }, () => {
            crownScale.value = withSpring(1.0, { damping: 10, stiffness: 200 });
          });
        } else {
          bgOpacity.value = 0.15;
          crownScale.value = 1.0;
          if (onRevealComplete) onRevealComplete();
        }
        contentOpacity.value = animate(1.0, { duration: 300 });
        break;

      case 'jackpot':
        if (!reduceMotion) {
          cardScale.value = withSpring(1.05, { damping: 8, stiffness: 150 }, () => {
            cardScale.value = withSpring(1.0, { damping: 10, stiffness: 200 }, (finished) => {
              if (finished && onRevealComplete) runOnJS(onRevealComplete)();
            });
          });
        } else {
          cardScale.value = 1.0;
          if (onRevealComplete) onRevealComplete();
        }
        bgOpacity.value = animate(0.25, { duration: 200 });
        contentOpacity.value = animate(1.0, { duration: 200 });
        break;
    }

    // Streak animations
    if (isStreakChained && streakBonusPoints != null) {
      if (!reduceMotion) {
        streakBgOpacity.value = withSequence(
          withTiming(0.15, { duration: 200 }),
          withTiming(0, { duration: 200 }),
        );
        badgeScale.value = withSpring(1.0, { damping: 10, stiffness: 200 });
      } else {
        streakBgOpacity.value = 0;
        badgeScale.value = 1.0;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealState]);

  // ── Animated styles ──────────────────────────────────────────────────────────

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const animatedContentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));


  const animatedBgStyle = useAnimatedStyle(() => {
    if (revealState === 'miss') {
      // Miss bg is full missBg at bgOpacity
      return {
        backgroundColor: COLOURS.missBg,
        opacity: bgOpacity.value,
        ...StyleSheet.absoluteFillObject,
      };
    }
    if (revealState === 'hit') {
      return {
        backgroundColor: COLOURS.lime,
        opacity: bgOpacity.value,
        ...StyleSheet.absoluteFillObject,
      };
    }
    if (revealState === 'captain-hit') {
      return {
        backgroundColor: COLOURS.gold,
        opacity: bgOpacity.value,
        ...StyleSheet.absoluteFillObject,
      };
    }
    if (revealState === 'jackpot') {
      return {
        backgroundColor: COLOURS.gold,
        opacity: bgOpacity.value,
        ...StyleSheet.absoluteFillObject,
      };
    }
    return {
      backgroundColor: 'transparent',
      opacity: 0,
      ...StyleSheet.absoluteFillObject,
    };
  });

  const animatedStreakBgStyle = useAnimatedStyle(() => ({
    backgroundColor: COLOURS.lime,
    opacity: streakBgOpacity.value,
    ...StyleSheet.absoluteFillObject,
  }));

  const animatedCrownStyle = useAnimatedStyle(() => ({
    transform: [{ scale: crownScale.value }],
  }));

  const animatedBadgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }));

  // ── Derived display values ───────────────────────────────────────────────────
  const iconName = EVENT_ICON_MAP[eventType] ?? 'star';
  const resultIcon = RESULT_ICONS[revealState] ?? null;

  const buildAccessibilityLabel = () => {
    const stateLabel =
      revealState === 'captain-hit'
        ? 'captain hit'
        : revealState === 'jackpot'
          ? 'jackpot'
          : revealState;
    const captainPart = isCaptain ? ', captain' : '';
    return `${eventName}, ${stateLabel}, ${pointsValue} points${captainPart}`;
  };

  return (
    <Animated.View
      style={[styles.container, animatedCardStyle]}
      accessibilityRole="text"
      accessibilityLabel={buildAccessibilityLabel()}
      testID={testID}
    >
      {/* Background overlay */}
      <Animated.View style={animatedBgStyle} pointerEvents="none" />
      {/* Streak background flash */}
      {isStreakChained && <Animated.View style={animatedStreakBgStyle} pointerEvents="none" />}

      {/* Card content */}
      <Animated.View style={[styles.row, animatedContentStyle]}>
        {/* Left: icon + name + type badge */}
        <View style={styles.left}>
          <Ionicons
            name={iconName}
            size={20}
            color={revealState === 'miss' ? COLOURS.textMuted : COLOURS.textPrimary}
          />
          <Text
            style={[
              styles.name,
              { color: revealState === 'miss' ? COLOURS.textMuted : COLOURS.textPrimary },
            ]}
          >
            {eventName}
          </Text>
          <TypeBadge variant={predictionType} />
        </View>

        {/* Right: points + captain crown + result icon */}
        <View style={styles.right}>
          <Text style={[styles.points, { color: revealState === 'miss' ? COLOURS.textMuted : COLOURS.textPrimary }]}>
            {pointsValue}
          </Text>
          {isCaptain && (
            <Animated.Text style={[styles.captain, animatedCrownStyle]}>👑</Animated.Text>
          )}
          {resultIcon && (
            <Ionicons name={resultIcon.icon} size={20} color={resultIcon.color} />
          )}
        </View>
      </Animated.View>

      {/* Streak bonus badge */}
      {isStreakChained && streakBonusPoints != null && (
        <Animated.View style={[styles.streakBadge, animatedBadgeStyle]}>
          <Text style={styles.streakBadgeText}>{`+${streakBonusPoints}`}</Text>
        </Animated.View>
      )}
    </Animated.View>
  );
}

// ─── Haptic helper (JS thread) ────────────────────────────────────────────────

function fireHaptic(state: RevealState) {
  switch (state) {
    case 'hit':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      break;
    case 'captain-hit':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      break;
    case 'jackpot':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      break;
    // miss, pending, revealing: no haptic
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    backgroundColor: COLOURS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLOURS.borderSubtle,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
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
    flexShrink: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  points: {
    ...Typography.body,
    fontVariant: ['tabular-nums'],
  },
  captain: {
    fontSize: 16,
  },
  streakBadge: {
    alignSelf: 'flex-end',
    marginRight: 16,
    marginBottom: 8,
    backgroundColor: COLOURS.limeAlpha15,
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  streakBadgeText: {
    ...Typography.label,
    color: COLOURS.lime,
    fontVariant: ['tabular-nums'],
  },
});

