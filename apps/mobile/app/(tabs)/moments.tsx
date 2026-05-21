import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  AccessibilityInfo,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import type { Prediction, Fixture } from '@lecolpo/types';

import { useAuthState } from '@/src/hooks/useAuthState';
import { useGameweekStore } from '@/src/stores/useGameweekStore';
import { useRevealStore } from '@/src/stores/useRevealStore';
import { useSquadQuery } from '@/src/queries/useSquadQuery';
import { useFixturesQuery } from '@/src/queries/useFixturesQuery';
import { useGameweekQuery } from '@/src/queries/useGameweekQuery';
import { useCatalogQuery } from '@/src/queries/useCatalogQuery';
import { GameweekHeader } from '@/src/components/shared/GameweekHeader';
import { SkeletonRow } from '@/src/components/shared/SkeletonRow';
import { FixtureGroupSection } from '@/src/components/moments/FixtureGroupSection';
import { MomentsPickRow } from '@/src/components/moments/MomentsPickRow';
import { BoldnessHeroCard } from '@/src/components/moments/BoldnessHeroCard';
import { Typography } from '@/src/lib/typography';
import { deriveBoldnessTier, TIER_NAMES } from '@/src/utils/boldness';

// Per-fixture component for Moment tab — avoids hooks-in-loops
interface MomentTabFixtureGroupProps {
  fixture: Fixture;
  picks: Prediction[];
}

function MomentTabFixtureGroup({ fixture, picks }: MomentTabFixtureGroupProps) {
  const { data: catalogItems = [] } = useCatalogQuery(fixture.id);

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


  return (
    <>
      {picks.map((pick) => {
        const item = catalogMap.get(pick.gameWeekMomentId);
        return (
          <MomentsPickRow
            key={pick.id}
            eventName={item?.eventName ?? '—'}
            eventType={item?.eventType ?? 'goal'}
            predictionType="moment"
            isCaptain={pick.isCaptain}
            basePoints={item?.basePoints ?? 0}
            predictedMinute={pick.predictedMinute}
          />
        );
      })}
    </>
  );
}

export default function MomentsScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuthState();
  const userId = session?.user?.id ?? null;

  const gameweekId = useGameweekStore((s) => s.currentGameweekId);
  const phase = useGameweekStore((s) => s.phase);
  const setReduceMotion = useRevealStore((s) => s.setReduceMotion);

  const { data: gameweek } = useGameweekQuery();
  const { data: picks = [], isLoading } = useSquadQuery(userId, gameweekId);
  const { data: fixtures = [] } = useFixturesQuery(gameweekId);

  const [activeTab, setActiveTab] = useState<'match' | 'moment'>('match');

  // AC#4: one-time reduce motion read on mount
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => setReduceMotion(value))
      .catch(() => {});
  }, [setReduceMotion]);

  // Build fixture lookup map — must be before early return (hooks order)
  const fixturesById = React.useMemo(() => {
    const map = new Map<number, Fixture>();
    for (const f of fixtures) map.set(f.id, f);
    return map;
  }, [fixtures]);

  // Group picks by fixtureId
  const picksByFixture = React.useMemo(() => {
    const map = new Map<number, Prediction[]>();
    for (const pick of picks) {
      const existing = map.get(pick.fixtureId) ?? [];
      map.set(pick.fixtureId, [...existing, pick]);
    }
    return map;
  }, [picks]);

  // Match tab: distinct fixtures sorted by kickoff
  const matchTabFixtures = React.useMemo(() => {
    const fixtureIds = [...picksByFixture.keys()];
    return fixtureIds
      .map((id) => fixturesById.get(id))
      .filter((f): f is Fixture => f != null)
      .sort((a, b) => a.kickoffAt.getTime() - b.kickoffAt.getTime());
  }, [picksByFixture, fixturesById]);

  // Moment tab: moment picks sorted by kickoff then predictedMinute
  const sortedMomentPicks = React.useMemo(() => {
    return picks
      .filter((p) => p.predictionType === 'moment')
      .sort((a, b) => {
        const fa = fixturesById.get(a.fixtureId);
        const fb = fixturesById.get(b.fixtureId);
        const diff = (fa?.kickoffAt.getTime() ?? 0) - (fb?.kickoffAt.getTime() ?? 0);
        if (diff !== 0) return diff;
        return (a.predictedMinute ?? 999) - (b.predictedMinute ?? 999);
      });
  }, [picks, fixturesById]);

  const momentFixtures = React.useMemo(() => {
    const seen = new Set<number>();
    const ordered: Fixture[] = [];
    for (const pick of sortedMomentPicks) {
      if (!seen.has(pick.fixtureId)) {
        seen.add(pick.fixtureId);
        const f = fixturesById.get(pick.fixtureId);
        if (f) ordered.push(f);
      }
    }
    return ordered;
  }, [sortedMomentPicks, fixturesById]);

  const momentPicksByFixture = React.useMemo(() => {
    const map = new Map<number, Prediction[]>();
    for (const pick of sortedMomentPicks) {
      const existing = map.get(pick.fixtureId) ?? [];
      map.set(pick.fixtureId, [...existing, pick]);
    }
    return map;
  }, [sortedMomentPicks]);

  // Accumulate possible points from FixtureGroupSection catalog callbacks
  // Reset when gameweekId changes to avoid stale data from previous gameweek
  const [fixtureTotals, setFixtureTotals] = useState<Map<number, number>>(new Map());
  useEffect(() => {
    setFixtureTotals(new Map());
  }, [gameweekId]);

  const handleCatalogLoaded = useCallback((fixtureId: number, points: number) => {
    setFixtureTotals((prev) => {
      const next = new Map(prev);
      next.set(fixtureId, points);
      return next;
    });
  }, []);

  const possiblePoints = React.useMemo(() => {
    let total = 0;
    for (const pts of fixtureTotals.values()) total += pts;
    return total;
  }, [fixtureTotals]);

  const boldnessTier = deriveBoldnessTier(possiblePoints);

  // Phase null guard — after all hooks
  if (phase === null) {
    return <SafeAreaView style={{ flex: 1, backgroundColor: '#080808' }} />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#080808' }} edges={['top']}>
      <GameweekHeader
        gameweekNumber={gameweek?.gameweekNumber ?? 0}
        usedPicks={picks.length}
        totalPicks={20}
        phase={phase ?? 'building'}
      />

      {/* BoldnessHeroCard: only shown in locked phase AND once gameweek data has loaded */}
      {phase === 'locked' && gameweek && (
        <BoldnessHeroCard
          tier={boldnessTier}
          tierName={TIER_NAMES[boldnessTier]}
          possiblePoints={possiblePoints}
          resultsEndTimestamp={gameweek.lastMatchEnd}
        />
      )}

      {isLoading && (
        <View>
          <SkeletonRow height={56} />
          <SkeletonRow height={56} />
          <SkeletonRow height={56} />
        </View>
      )}

      {!isLoading && picks.length === 0 && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
          <Text style={{ ...Typography.body, color: '#7A7A7A', marginBottom: 16, textAlign: 'center' }}>
            Nothing saved for this gameweek
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: '#B4FF32',
              borderRadius: 8,
              paddingVertical: 12,
              paddingHorizontal: 24,
            }}
            onPress={() => router.replace('/(tabs)/build')}
            accessibilityRole="button"
          >
            <Text style={{ ...Typography.label, color: '#080808' }}>Build your squad</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isLoading && picks.length > 0 && (
        <>
          {/* Tab strip */}
          <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#1E1E1E' }}>
            {(['match', 'moment'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  minHeight: 44,
                  borderBottomWidth: activeTab === tab ? 2 : 0,
                  borderBottomColor: activeTab === tab ? '#B4FF32' : 'transparent',
                  backgroundColor: activeTab === tab ? '#141414' : 'transparent',
                }}
                onPress={() => setActiveTab(tab)}
                accessibilityRole="tab"
                accessibilityState={{ selected: activeTab === tab }}
              >
                <Text style={{ ...Typography.label, color: activeTab === tab ? '#FFFFFF' : '#7A7A7A' }}>
                  {tab === 'match' ? 'Match' : 'Moment'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView style={{ flex: 1 }}>
            {activeTab === 'match' &&
              matchTabFixtures.map((fixture) => (
                <FixtureGroupSection
                  key={fixture.id}
                  fixture={fixture}
                  picks={picksByFixture.get(fixture.id) ?? []}
                  onCatalogLoaded={handleCatalogLoaded}
                />
              ))}

            {activeTab === 'moment' &&
              momentFixtures.map((fixture) => (
                <MomentTabFixtureGroup
                  key={fixture.id}
                  fixture={fixture}
                  picks={momentPicksByFixture.get(fixture.id) ?? []}
                />
              ))}
          </ScrollView>
        </>
      )}

      {/* Edit button — Building phase only, when picks exist */}
      {phase === 'building' && !isLoading && picks.length > 0 && (
        <View style={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 16, paddingTop: 8 }}>
          <TouchableOpacity
            style={{ backgroundColor: '#B4FF32', borderRadius: 8, paddingVertical: 14, alignItems: 'center' }}
            onPress={() => router.replace('/(tabs)/build')}
            accessibilityRole="button"
          >
            <Text style={{ ...Typography.label, color: '#080808' }}>Edit squad</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
