import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';

import { useAuthState } from '@/src/hooks/useAuthState';
import { useGameweekStore } from '@/src/stores/useGameweekStore';
import { useSquadQuery, useAddPickMutation } from '@/src/queries/useSquadQuery';
import { useCatalogQuery, useHistoricalDotsQuery, type CatalogItem } from '@/src/queries/useCatalogQuery';
import { SkeletonList } from '@/src/components/shared/SkeletonRow';
import { MomentCatalogRow } from '@/src/components/build/MomentCatalogRow';
import { Typography } from '@/src/lib/typography';
import type { NewPrediction } from '@lecolpo/types';

type FilterType = 'All' | 'Match' | 'Moment';

function CatalogRowWithDots({
  item,
  isAdded,
  onTap,
}: {
  item: CatalogItem;
  isAdded: boolean;
  onTap: () => void;
}) {
  const { data: dots } = useHistoricalDotsQuery(
    item.fixtureId,
    item.momentType.eventType,
    item.teamId,
  );

  return (
    <MomentCatalogRow
      item={item}
      momentType={item.momentType}
      isAdded={isAdded}
      historicalDots={dots && dots.length > 0 ? dots : undefined}
      onTap={onTap}
    />
  );
}

export default function FixtureCatalogScreen() {
  const { fixtureId: fixtureIdParam } = useLocalSearchParams<{ fixtureId: string }>();
  // Guard against undefined/NaN — parseInt('abc') returns NaN which passes != null checks
  const parsedId = parseInt(fixtureIdParam ?? '', 10);
  const fixtureId = Number.isNaN(parsedId) ? null : parsedId;
  const router = useRouter();

  const { session } = useAuthState();
  const userId = session?.user?.id ?? null;
  const gameweekId = useGameweekStore((s) => s.currentGameweekId);

  const { data: squad } = useSquadQuery(userId, gameweekId);
  const { data: catalog, isLoading, isFetching, refetch } = useCatalogQuery(fixtureId);
  const addPickMutation = useAddPickMutation(userId, gameweekId);

  const [filter, setFilter] = useState<FilterType>('All');
  const [showRetry, setShowRetry] = useState(false);

  useEffect(() => {
    setFilter('All');
  }, [fixtureId]);

  useEffect(() => {
    if (isFetching && !isLoading && catalog == null) {
      const t = setTimeout(() => setShowRetry(true), 3000);
      return () => clearTimeout(t);
    }
    setShowRetry(false);
  }, [isFetching, isLoading, catalog]);

  const filteredCatalog = (catalog ?? []).filter((item) => {
    if (filter === 'All') return true;
    if (filter === 'Match') return item.momentType.predictionType === 'match';
    return item.momentType.predictionType === 'moment';
  });

  const handleMatchTap = (item: CatalogItem) => {
    if (!userId || !gameweekId) return;
    const newPick: NewPrediction = {
      userId,
      gameweekId,
      fixtureId: item.fixtureId,
      gameWeekMomentId: item.id,
      predictionType: 'match',
      isCaptain: false,
    };
    addPickMutation.mutate(newPick, {
      onSuccess: () => router.back(),
      onError: () => {
        console.error('Failed to add pick');
      },
    });
  };

  const handleMomentTap = (item: CatalogItem) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.push(`/(microflow)/player?fixtureId=${item.fixtureId}&momentCardId=${item.id}` as any);
  };

  // Derive fixture header from first catalog item
  const firstItem = catalog?.[0];
  const fixtureTitle = firstItem
    ? `Fixture ${fixtureId}`
    : fixtureId != null ? `Fixture ${fixtureId}` : 'Fixture';

  return (
    <>
      <Stack.Screen options={{ title: fixtureTitle }} />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.filterRow}>
          {(['All', 'Match', 'Moment'] as FilterType[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
              accessibilityRole="button"
              accessibilityState={{ selected: filter === f }}
            >
              <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {isLoading ? (
          <SkeletonList count={3} rowHeight={56} />
        ) : showRetry ? (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setShowRetry(false);
              refetch().catch(() => {});
            }}
            accessibilityRole="button"
          >
            <Text style={styles.retryText}>Having trouble loading — tap to retry</Text>
          </TouchableOpacity>
        ) : (
          <ScrollView contentContainerStyle={styles.list}>
            {filteredCatalog.map((item) => {
              const isAdded = squad?.some((p) => p.gameWeekMomentId === item.id) ?? false;
              const isMatch = item.momentType.predictionType === 'match';

              return (
                <CatalogRowWithDots
                  key={item.id}
                  item={item}
                  isAdded={isAdded}
                  onTap={() => (isMatch ? handleMatchTap(item) : handleMomentTap(item))}
                />
              );
            })}
          </ScrollView>
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080808',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#1E1E1E',
  },
  filterChipActive: {
    backgroundColor: 'rgba(180,255,50,0.12)',
    borderColor: '#B4FF32',
  },
  filterChipText: {
    ...Typography.label,
    color: '#7A7A7A',
  },
  filterChipTextActive: {
    color: '#B4FF32',
  },
  list: {
    paddingBottom: 24,
  },
  retryButton: {
    margin: 16,
    padding: 16,
    backgroundColor: '#141414',
    borderRadius: 8,
    alignItems: 'center',
  },
  retryText: {
    ...Typography.body,
    color: '#FF6B35',
  },
});
