import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';

import { useAuthState } from '@/src/hooks/useAuthState';
import { useGameweekStore } from '@/src/stores/useGameweekStore';
import { useBuildStore } from '@/src/stores/useBuildStore';
import { useGameweekQuery } from '@/src/queries/useGameweekQuery';
import { useFixturesQuery } from '@/src/queries/useFixturesQuery';
import { useSquadQuery } from '@/src/queries/useSquadQuery';
import { GameweekHeader } from '@/src/components/shared/GameweekHeader';
import { DeadlineStrip } from '@/src/components/shared/DeadlineStrip';
import { FixtureCard } from '@/src/components/build/FixtureCard';
import type { Fixture, Prediction } from '@lecolpo/types';

export default function BuildScreen() {
  const phase = useGameweekStore((s) => s.phase);
  const currentGameweekId = useGameweekStore((s) => s.currentGameweekId);

  const { session } = useAuthState();
  const userId = session?.user?.id ?? null;

  const { data: gameweek } = useGameweekQuery();
  const { data: fixtures } = useFixturesQuery(currentGameweekId);
  const { data: squad } = useSquadQuery(userId, currentGameweekId);

  const expandedFixtureId = useBuildStore((s) => s.expandedFixtureId);
  const setExpandedFixtureId = useBuildStore((s) => s.setExpandedFixtureId);

  const router = useRouter();

  if (phase === null) {
    return (
      <SafeAreaView style={styles.container} />
    );
  }

  if (phase === 'locked' || phase === 'reveal') {
    return <Redirect href="/(tabs)/moments" />;
  }

  const gameweekNumber = gameweek?.gameweekNumber ?? 0;
  const usedPicks = squad?.length ?? 0;
  const deadlineTimestamp = gameweek?.firstKickoff ?? null;

  const renderFixture = ({ item }: { item: Fixture }) => {
    const fixturepicks: Prediction[] = (squad ?? []).filter((p) => p.fixtureId === item.id);
    return (
      <FixtureCard
        fixture={item}
        picks={fixturepicks}
        isExpanded={expandedFixtureId === item.id}
        onToggle={() =>
          setExpandedFixtureId(expandedFixtureId === item.id ? null : item.id)
        }
        onNavigateToCatalog={(fixtureId) => router.push(`/catalog/${fixtureId}`)}
        onPickTap={() => {
          // CaptainPopup handled in Story 5.3
        }}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <GameweekHeader
        gameweekNumber={gameweekNumber}
        usedPicks={usedPicks}
        totalPicks={20}
        phase="building"
      />
      <DeadlineStrip deadlineTimestamp={deadlineTimestamp} />
      <FlatList
        data={fixtures ?? []}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderFixture}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080808',
  },
  listContent: {
    paddingBottom: 24,
  },
});
