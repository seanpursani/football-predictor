import React from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  withRepeat,
  withTiming,
  useAnimatedStyle,
} from 'react-native-reanimated';

interface SkeletonRowProps {
  height?: number;
}

export function SkeletonRow({ height = 56 }: SkeletonRowProps) {
  const opacity = useSharedValue(1);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.4, { duration: 700 }),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          height,
          backgroundColor: '#1C1C1C',
          borderRadius: 6,
          marginHorizontal: 16,
          marginVertical: 4,
        },
        animatedStyle,
      ]}
    />
  );
}

interface SkeletonListProps {
  count?: number;
  rowHeight?: number;
}

export function SkeletonList({ count = 3, rowHeight }: SkeletonListProps) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonRow key={i} height={rowHeight} />
      ))}
    </View>
  );
}

