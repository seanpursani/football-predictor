import React, { useState, useCallback } from 'react';
import { FlatList, StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';

import { useAuthState } from '@/src/hooks/useAuthState';
import { useGameweekStore } from '@/src/stores/useGameweekStore';
import { useBuildStore } from '@/src/stores/useBuildStore';
import { useGameweekQuery } from '@/src/queries/useGameweekQuery';
import { useFixturesQuery } from '@/src/queries/useFixturesQuery';
import {
  useSquadQuery,
  useRemovePickMutation,
  useCaptainMutation,
  useSaveSquadMutation,
} from '@/src/queries/useSquadQuery';
import { GameweekHeader } from '@/src/components/shared/GameweekHeader';
import { DeadlineStrip } from '@/src/components/shared/DeadlineStrip';
import { FixtureCard } from '@/src/components/build/FixtureCard';
import { CaptainPopup } from '@/src/components/build/CaptainPopup';
import { Toast } from '@/src/components/shared/Toast';
import { Typography } from '@/src/lib/typography';
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

  const [captainPickTarget, setCaptainPickTarget] = useState<Prediction | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const removePick = useRemovePickMutation(userId, currentGameweekId);
  const captainMutation = useCaptainMutation(userId, currentGameweekId);
  const saveSquad = useSaveSquadMutation(userId, currentGameweekId);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  }, []);

  const handleHideToast = useCallback(() => {
    setToastVisible(false);
  }, []);

  const handleSave = useCallback(() => {
    if (!userId || !currentGameweekId || !squad) return;
    saveSquad.mutate(
      squad.map((p) => ({
        userId: p.userId,
        gameweekId: p.gameweekId,
        fixtureId: p.fixtureId,
        gameWeekMomentId: p.gameWeekMomentId,
        predictionType: p.predictionType,
        isCaptain: p.isCaptain,
        predictedMinute: p.predictedMinute ?? undefined,
        confidenceWindow: p.confidenceWindow ?? undefined,
        predictedPlayerId: p.predictedPlayerId ?? undefined,
        predictedAssisterId: p.predictedAssisterId ?? undefined,
        predictedZone: p.predictedZone ?? undefined,
      })),
      {
        onSuccess: () => {
          router.replace('/(tabs)/moments');
        },
        onError: (err: unknown) => {
          const error = err as { code?: string; message?: string };
          if (
            error?.code === '23514' ||
            error?.message?.includes('predictions_per_gameweek_limit')
          ) {
            showToast('Too many picks — remove some and try again');
          } else {
            showToast("Couldn't save — tap to retry");
          }
        },
      },
    );
  }, [userId, currentGameweekId, squad, saveSquad, router, showToast]);

  if (phase === null) {
    return <SafeAreaView style={styles.container} />;
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
        onPickTap={(pick) => setCaptainPickTarget(pick)}
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
      <View style={styles.flex}>
        <FlatList
          data={fixtures ?? []}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderFixture}
          contentContainerStyle={styles.listContent}
        />
        {phase === 'building' && (
          <View style={styles.saveBar}>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              accessibilityRole="button"
              accessibilityLabel="Save squad"
            >
              <Text style={styles.saveButtonText}>Save squad</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <CaptainPopup
        visible={captainPickTarget !== null}
        pick={captainPickTarget}
        momentType={null}
        onSelectCaptain={(pick) => {
          if (userId && currentGameweekId) {
            captainMutation.mutate(
              { pickId: pick.id, userId, gameweekId: currentGameweekId },
              {
                onError: () => showToast("Couldn't save — tap to retry"),
              },
            );
          } else {
            showToast("Couldn't save — tap to retry");
          }
          setCaptainPickTarget(null);
        }}
        onRemove={(pick) => {
          removePick.mutate(pick.id, {
            onError: () => showToast("Couldn't save — tap to retry"),
          });
          setCaptainPickTarget(null);
        }}
        onDismiss={() => setCaptainPickTarget(null)}
      />

      <Toast
        message={toastMessage}
        visible={toastVisible}
        onHide={handleHideToast}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080808',
  },
  flex: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 24,
  },
  saveBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#080808',
  },
  saveButton: {
    backgroundColor: '#B4FF32',
    borderRadius: 6,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    ...Typography.label,
    color: '#000000',
  },
});
