import React from 'react';
import { View, Text } from 'react-native';
import type { Prediction, Fixture } from '@lecolpo/types';
import { useCatalogQuery } from '@/src/queries/useCatalogQuery';
import { MomentsPickRow } from './MomentsPickRow';
import { Typography } from '@/src/lib/typography';

interface FixtureGroupSectionProps {
  fixture: Fixture;
  picks: Prediction[];
  onCatalogLoaded?: (fixtureId: number, points: number) => void;
}

export function FixtureGroupSection({ fixture, picks, onCatalogLoaded }: FixtureGroupSectionProps) {
  const { data: catalogItems = [] } = useCatalogQuery(fixture.id);

  // Build a lookup map from gameWeekMomentId → catalogItem
  const catalogMap = React.useMemo(() => {
    const map = new Map<number, { eventName: string; eventType: string; basePoints: number }>();
    for (const item of catalogItems) {
      map.set(item.id, {
        eventName: item.momentType.name,
        eventType: item.momentType.eventType,
        basePoints: item.basePoints,
      });
    }
    return map;
  }, [catalogItems]);

  // Report possible points upward once catalog is available
  React.useEffect(() => {
    if (catalogItems.length > 0 && onCatalogLoaded) {
      const total = picks.reduce((sum, p) => {
        const item = catalogMap.get(p.gameWeekMomentId);
        return sum + (item?.basePoints ?? 0);
      }, 0);
      onCatalogLoaded(fixture.id, total);
    }
  }, [catalogItems, picks, catalogMap, fixture.id, onCatalogLoaded]);

  const fixtureLabel = `${fixture.homeTeam} vs ${fixture.awayTeam}`;

  // Format kickoff time
  const kickoffFormatted = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(fixture.kickoffAt);

  return (
    <View>
      {/* Fixture Group Header */}
      <Text
        style={{
          ...Typography.label,
          color: '#7A7A7A',
          paddingHorizontal: 16,
          paddingVertical: 8,
          backgroundColor: '#080808',
        }}
      >
        {fixtureLabel} · {kickoffFormatted}
      </Text>
      {picks.map((pick) => {
        const item = catalogMap.get(pick.gameWeekMomentId);
        const predictionType = pick.predictionType === 'moment' ? 'moment' : 'match';
        return (
          <MomentsPickRow
            key={pick.id}
            eventName={item?.eventName ?? '—'}
            eventType={item?.eventType ?? 'match_result'}
            predictionType={predictionType}
            isCaptain={pick.isCaptain}
            basePoints={item?.basePoints ?? 0}
          />
        );
      })}
    </View>
  );
}

