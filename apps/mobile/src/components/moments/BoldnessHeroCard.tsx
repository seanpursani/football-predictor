import React from 'react';
import { View, Text } from 'react-native';
import { Typography } from '@/src/lib/typography';
import { BoldnessShield, BoldnessTier } from './BoldnessShield';
import { TIER_COLOURS } from '@/src/utils/boldness';

interface BoldnessHeroCardProps {
  tier: BoldnessTier;
  tierName: string;
  possiblePoints: number;
  resultsEndTimestamp: Date;
}

export function BoldnessHeroCard({
  tier,
  tierName,
  possiblePoints,
  resultsEndTimestamp,
}: BoldnessHeroCardProps) {
  const tierColour = TIER_COLOURS[tier];

  const formatted = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(resultsEndTimestamp);

  return (
    <View
      style={{
        backgroundColor: '#141414',
        borderRadius: 8,
        padding: 16,
        marginHorizontal: 16,
        marginVertical: 12,
      }}
      accessibilityRole="text"
      accessibilityLabel={`${tierName} tier, ${possiblePoints} possible points, results ending ${formatted}`}
    >
      {/* Row 1: Shield + tier name + points */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <BoldnessShield tier={tier} size={48} />
        <View style={{ flex: 1 }}>
          <Text style={{ ...Typography.heading2, color: '#FFFFFF' }}>{tierName}</Text>
          <Text style={{ ...Typography.monoNumber, color: tierColour }}>{possiblePoints}</Text>
        </View>
      </View>
      {/* Row 2: Subtitle */}
      <Text style={{ ...Typography.caption, color: '#7A7A7A', marginTop: 8 }}>
        {`Results incoming · ends ${formatted}`}
      </Text>
    </View>
  );
}

