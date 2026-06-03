import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import type { Prediction, Fixture } from '@lecolpo/types';

import { useAuthState } from '@/src/hooks/useAuthState';
import { useGameweekStore } from '@/src/stores/useGameweekStore';
import { useSquadQuery } from '@/src/queries/useSquadQuery';
import { useFixturesQuery } from '@/src/queries/useFixturesQuery';
import { useGameweekQuery, useMarkRevealSeenMutation } from '@/src/queries/useGameweekQuery';
import { useCatalogQuery } from '@/src/queries/useCatalogQuery';
import { useResultsQuery } from '@/src/queries/useResultsQuery';
import { useLeagueQuery } from '@/src/queries/useLeagueQuery';
import { GameweekHeader } from '@/src/components/shared/GameweekHeader';
import { SkeletonRow } from '@/src/components/shared/SkeletonRow';
import { FixtureGroupSection } from '@/src/components/moments/FixtureGroupSection';
import { MomentsPickRow } from '@/src/components/moments/MomentsPickRow';
import { BoldnessHeroCard } from '@/src/components/moments/BoldnessHeroCard';
import { RevealCard } from '@/src/components/reveal/RevealCard';
import { RevealSequence } from '@/src/components/reveal/RevealSequence';
import { Typography } from '@/src/lib/typography';
import { deriveBoldnessTier, TIER_NAMES } from '@/src/utils/boldness';
import type { ResultsRow } from '@/src/queries/useResultsQuery';

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

// Helper: derive RevealState for a result in the results phase (firstView=false)
function deriveResultRevealState(
  result: ResultsRow,
): 'hit' | 'miss' | 'captain-hit' | 'jackpot' {
  if (!result.isCorrect) return 'miss';
  if (result.jackpotBonus > 0) return 'jackpot';
  if (result.captainMultiplier === 2) return 'captain-hit';
  return 'hit';
}

// Helper: chain connector between consecutive correct moment picks
function showChainConnector(results: ResultsRow[], index: number): boolean {
  if (index === 0) return false;
  const prev = results[index - 1];
  const curr = results[index];
  return (
    prev.predictionType === 'moment' &&
    curr.predictionType === 'moment' &&
    prev.isCorrect &&
    curr.isCorrect
  );
}

// Helper: faint divider where the streak breaks (correct → incorrect or vice versa)
function showStreakBreak(results: ResultsRow[], index: number): boolean {
  if (index === 0) return false;
  const prev = results[index - 1];
  const curr = results[index];
  return (
    prev.predictionType === 'moment' &&
    curr.predictionType === 'moment' &&
    prev.isCorrect !== curr.isCorrect
  );
}

export default function MomentsScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuthState();
  const userId = session?.user?.id ?? null;

  const gameweekId = useGameweekStore((s) => s.currentGameweekId);
  const phase = useGameweekStore((s) => s.phase);

  const { data: gameweek } = useGameweekQuery();
  const { data: picks = [], isLoading } = useSquadQuery(userId, gameweekId);
  const { data: fixtures = [] } = useFixturesQuery(gameweekId);

  // Results and reveal hooks — called unconditionally (hooks order)
  const { data: results = [], isLoading: resultsLoading } = useResultsQuery(userId, gameweekId);
  const markRevealSeen = useMarkRevealSeenMutation();
  const { data: leagues = [] } = useLeagueQuery(userId);

  const [activeTab, setActiveTab] = useState<'match' | 'moment'>('match');

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
  const [fixtureTotals, setFixtureTotals] = useState<Map<number, number>>(new Map());

  const handleCatalogLoaded = useCallback((fixtureId: number, points: number) => {
    setFixtureTotals((prev) => {
      const next = new Map(prev);
      next.set(fixtureId, points);
      return next;
    });
  }, []);

  // Reset accumulated fixture totals when the active gameweek changes
  useEffect(() => {
    setFixtureTotals(new Map());
  }, [gameweekId]);

  const possiblePoints = React.useMemo(() => {
    let total = 0;
    for (const pts of fixtureTotals.values()) total += pts;
    return total;
  }, [fixtureTotals]);

  const boldnessTier = deriveBoldnessTier(possiblePoints);

  // Sort results for results phase display
  const sortedResults = React.useMemo(() => {
    const safeResults = results ?? [];
    const matchPicks = safeResults
      .filter((r) => r.predictionType === 'match')
      .sort((a, b) => {
        const fa = fixturesById.get(a.fixtureId);
        const fb = fixturesById.get(b.fixtureId);
        return (fa?.kickoffAt.getTime() ?? 0) - (fb?.kickoffAt.getTime() ?? 0);
      });
    const momentPicks = safeResults
      .filter((r) => r.predictionType === 'moment')
      .sort((a, b) => {
        const fa = fixturesById.get(a.fixtureId);
        const fb = fixturesById.get(b.fixtureId);
        const fixtureDiff = (fa?.kickoffAt.getTime() ?? 0) - (fb?.kickoffAt.getTime() ?? 0);
        if (fixtureDiff !== 0) return fixtureDiff;
        return (a.predictedMinute ?? 999) - (b.predictedMinute ?? 999);
      });
    return [...matchPicks, ...momentPicks];
  }, [results, fixturesById]);

  // Phase detection
  const isRevealPhase = phase === 'reveal';
  const isResultsPhase = phase === 'locked' && gameweek?.scoringStatus === 'complete';

  // Phase null guard — after all hooks
  if (phase === null) {
    return <SafeAreaView style={{ flex: 1, backgroundColor: '#080808' }} />;
  }

  // ── Reveal phase: full-screen RevealSequence ──────────────────────────────
  if (isRevealPhase) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#080808' }} edges={['top']}>
        <GameweekHeader
          gameweekNumber={gameweek?.gameweekNumber ?? 0}
          usedPicks={picks.length}
          totalPicks={20}
          phase={phase ?? 'building'}
        />
        {resultsLoading ? (
          <View>
            <SkeletonRow height={56} />
            <SkeletonRow height={56} />
            <SkeletonRow height={56} />
          </View>
        ) : (
          <RevealSequence
            results={results ?? []}
            fixtures={fixtures}
            leagues={leagues ?? []}
            leaderboardEntries={[]}
            onAllRevealed={() => {
              if (userId && gameweekId) {
                markRevealSeen.mutate({ userId, gameweekId });
              }
            }}
          />
        )}
      </SafeAreaView>
    );
  }

  // ── Results phase: static cards (return visit after reveal_seen=true) ────
  if (isResultsPhase) {
    const matchResults = sortedResults.filter((r) => r.predictionType === 'match');
    const momentResults = sortedResults.filter((r) => r.predictionType === 'moment');

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#080808' }} edges={['top']}>
        <GameweekHeader
          gameweekNumber={gameweek?.gameweekNumber ?? 0}
          usedPicks={picks.length}
          totalPicks={20}
          phase={phase ?? 'locked'}
        />

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
            matchResults.map((result) => (
              <RevealCard
                key={result.id}
                revealState={deriveResultRevealState(result)}
                eventName={result.eventName}
                eventType={result.eventType}
                predictionType={result.predictionType}
                pointsValue={result.totalPoints}
                isCaptain={result.isCaptain}
                firstView={false}
                reduceMotion={false}
                isStreakChained={result.streakBonus > 0}
                streakBonusPoints={
                  result.streakBonus > 0 ? (result.streakBonus as 10 | 20 | 30) : null
                }
              />
            ))}

          {activeTab === 'moment' &&
            momentResults.map((result, idx) => (
              <React.Fragment key={result.id}>
                {/* Chain connector between consecutive correct moment picks */}
                {showChainConnector(momentResults, idx) && (
                  <View
                    style={{
                      width: 2,
                      height: 12,
                      backgroundColor: '#B4FF32',
                      alignSelf: 'center',
                      marginVertical: -2,
                    }}
                  />
                )}
                {/* Streak break divider where correct/incorrect transitions (AC3/FR34) */}
                {showStreakBreak(momentResults, idx) && (
                  <View
                    style={{
                      height: 1,
                      backgroundColor: '#303030',
                      marginHorizontal: 16,
                    }}
                  />
                )}
                <RevealCard
                  revealState={deriveResultRevealState(result)}
                  eventName={result.eventName}
                  eventType={result.eventType}
                  predictionType={result.predictionType}
                  pointsValue={result.totalPoints}
                  isCaptain={result.isCaptain}
                  firstView={false}
                  reduceMotion={false}
                  isStreakChained={result.streakBonus > 0}
                  streakBonusPoints={
                    result.streakBonus > 0 ? (result.streakBonus as 10 | 20 | 30) : null
                  }
                />
              </React.Fragment>
            ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Building / Locked phase ───────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#080808' }} edges={['top']}>
      <GameweekHeader
        gameweekNumber={gameweek?.gameweekNumber ?? 0}
        usedPicks={picks.length}
        totalPicks={20}
        phase={phase ?? 'building'}
      />

      {/* BoldnessHeroCard: only shown in locked phase AND once gameweek data has loaded with a valid end timestamp */}
      {phase === 'locked' && gameweek?.lastMatchEnd && (
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
