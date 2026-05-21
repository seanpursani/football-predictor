import React from 'react';
import { View, Text } from 'react-native';
import { Typography } from '@/src/lib/typography';
import type { BoldnessTierKey } from '@/src/utils/boldness';
import { TIER_COLOURS } from '@/src/utils/boldness';

// Re-export as BoldnessTier for consumers of this component
export type BoldnessTier = BoldnessTierKey;

const TIER_LETTERS: Record<BoldnessTier, string> = {
  bronze: 'B',
  silver: 'S',
  gold: 'G',
  platinum: 'P',
};

interface BoldnessShieldProps {
  tier: BoldnessTier;
  size?: number;
}

export function BoldnessShield({ tier, size = 48 }: BoldnessShieldProps) {
  const colour = TIER_COLOURS[tier];
  const letter = TIER_LETTERS[tier];

  return (
    <View
      style={{
        width: size,
        height: size * 1.2,
        borderRadius: size * 0.1,
        borderWidth: 2,
        borderColor: colour,
        backgroundColor: `rgba(0,0,0,0)`, // transparent base; overlay tint via alpha below
        // RN doesn't support rgba with variable — use low-opacity background approach:
        // backgroundColor is set via a combination approach
        alignItems: 'center',
        justifyContent: 'center',
      }}
      accessibilityRole="image"
      accessibilityLabel={`${tier} tier shield`}
    >
      {/* Inner tint layer */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: size * 0.1 - 1,
          opacity: 0.12,
          backgroundColor: colour,
        }}
      />
      <Text style={{ ...Typography.heading2, color: colour }}>{letter}</Text>
    </View>
  );
}

