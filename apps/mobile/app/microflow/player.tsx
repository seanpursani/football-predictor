import React, { useState } from 'react';
import {
  SafeAreaView,
  FlatList,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMicroFlowPlayersQuery, type MicroFlowPlayer } from '@/src/queries/useMicroFlowQuery';
import { MicroFlowPlayerRow } from '@/src/components/build/MicroFlowPlayerRow';
import { SkeletonList } from '@/src/components/shared/SkeletonRow';
import { Typography } from '@/src/lib/typography';

export default function PlayerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ fixtureId: string; momentCardId: string }>();

  const fixtureIdRaw = parseInt(params.fixtureId ?? '', 10);
  const momentCardIdRaw = parseInt(params.momentCardId ?? '', 10);
  const fixtureId = Number.isNaN(fixtureIdRaw) ? null : fixtureIdRaw;
  const momentCardId = Number.isNaN(momentCardIdRaw) ? null : momentCardIdRaw;

  const { data: players, isLoading, isError } = useMicroFlowPlayersQuery(fixtureId, momentCardId);
  const [selectedPlayer, setSelectedPlayer] = useState<MicroFlowPlayer | null>(null);

  function handleNext() {
    if (!selectedPlayer || fixtureId == null || momentCardId == null) return;
    router.push(
      `/microflow/timing?fixtureId=${fixtureId}&momentCardId=${momentCardId}&playerId=${encodeURIComponent(selectedPlayer.id)}&playerName=${encodeURIComponent(selectedPlayer.name)}&playerBonus=${selectedPlayer.bonusPoints}` as any,
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Select Player' }} />

      {isLoading && (
        <View style={styles.listArea}>
          <SkeletonList count={3} rowHeight={56} />
        </View>
      )}

      {isError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Player list unavailable — try refreshing</Text>
        </View>
      )}

      {!isLoading && !isError && (
        <FlatList
          data={players ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MicroFlowPlayerRow
              player={item}
              isSelected={selectedPlayer?.id === item.id}
              onSelect={setSelectedPlayer}
            />
          )}
          ListEmptyComponent={
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>No players available — go back and try again</Text>
            </View>
          }
          style={styles.list}
        />
      )}

      <TouchableOpacity
        style={[styles.nextButton, selectedPlayer === null && styles.nextButtonDisabled]}
        onPress={handleNext}
        disabled={selectedPlayer === null}
        accessibilityRole="button"
        accessibilityLabel="Continue to timing"
      >
        <Text style={styles.nextButtonText}>Next</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080808',
  },
  listArea: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    ...Typography.body,
    color: '#7A7A7A',
    textAlign: 'center',
  },
  nextButton: {
    margin: 16,
    backgroundColor: '#B4FF32',
    borderRadius: 6,
    paddingVertical: 14,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    opacity: 0.4,
  },
  nextButtonText: {
    ...Typography.label,
    color: '#000000',
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
  },
});
