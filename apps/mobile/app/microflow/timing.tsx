import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthState } from '@/src/hooks/useAuthState';
import { useGameweekStore } from '@/src/stores/useGameweekStore';
import { useCatalogQuery } from '@/src/queries/useCatalogQuery';
import { useAddPickMutation } from '@/src/queries/useSquadQuery';
import { MinutePicker } from '@/src/components/build/MinutePicker';
import { ZoneChip } from '@/src/components/build/ZoneChip';
import { PickSummaryCard } from '@/src/components/build/PickSummaryCard';
import { Toast } from '@/src/components/shared/Toast';
import { buildPrecisionPick } from '@/src/utils/buildPrecisionPick';
import { Typography } from '@/src/lib/typography';

export default function TimingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    fixtureId: string;
    momentCardId: string;
    playerId: string;
    playerName: string;
    playerBonus: string;
  }>();

  const fixtureIdRaw = parseInt(params.fixtureId ?? '', 10);
  const momentCardIdRaw = parseInt(params.momentCardId ?? '', 10);
  const playerBonusRaw = parseInt(params.playerBonus ?? '', 10);

  const fixtureId = Number.isNaN(fixtureIdRaw) ? null : fixtureIdRaw;
  const momentCardId = Number.isNaN(momentCardIdRaw) ? null : momentCardIdRaw;
  const playerId = params.playerId ?? null;
  const playerName = params.playerName ? decodeURIComponent(params.playerName) : null;
  const playerBonus = Number.isNaN(playerBonusRaw) ? 0 : playerBonusRaw;

  const [minute, setMinute] = useState<number>(45);
  const [zone, setZone] = useState<5 | 10 | 15>(10);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const { session } = useAuthState();
  const userId = session?.user?.id ?? null;
  const gameweekId = useGameweekStore((s) => s.currentGameweekId);

  const { data: catalog } = useCatalogQuery(fixtureId);
  const catalogItem = catalog?.find((item) => item.id === momentCardId) ?? null;

  const zoneBonusPoints = catalogItem?.zoneBonusPoints ?? 50;
  const bonusMap: Record<5 | 10 | 15, number> = {
    5: zoneBonusPoints,
    10: Math.floor(zoneBonusPoints / 2),
    15: 0,
  };
  const zoneBonus = bonusMap[zone];

  const addPickMutation = useAddPickMutation(userId, gameweekId);

  function showToast(msg: string) {
    setToastMessage(msg);
    setToastVisible(true);
  }

  function handleConfirm() {
    if (!userId || !gameweekId) {
      showToast('Sign in required');
      return;
    }
    if (fixtureId == null || momentCardId == null) {
      showToast('Invalid pick — please go back and try again');
      return;
    }
    if (catalogItem == null) {
      showToast('Still loading — please wait a moment');
      return;
    }

    const eventType = catalogItem.momentType?.eventType ?? 'unknown';
    const pick = buildPrecisionPick({
      userId,
      gameweekId,
      fixtureId,
      momentCardId,
      eventType,
      playerId,
      minute,
      zone,
    });

    addPickMutation.mutate(pick, {
      onSuccess: () => {
        router.replace('/(tabs)/build');
      },
      onError: () => {
        showToast("Couldn't save — tap to retry");
      },
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: playerName ?? 'Timing & Zone' }} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <MinutePicker value={minute} onChange={setMinute} />

        <View style={styles.zoneSection}>
          <ZoneChip value={zone} bonusPoints={bonusMap} onChange={setZone} />
        </View>

        <PickSummaryCard
          basePoints={catalogItem?.basePoints ?? 0}
          playerBonus={playerBonus}
          zoneBonus={zoneBonus}
        />
      </ScrollView>

      <TouchableOpacity
        style={[styles.confirmButton, addPickMutation.isPending && styles.confirmButtonPending]}
        onPress={handleConfirm}
        disabled={addPickMutation.isPending}
        accessibilityRole="button"
        accessibilityLabel="Confirm pick"
      >
        <Text style={styles.confirmButtonText}>
          {addPickMutation.isPending ? 'Saving...' : 'Confirm'}
        </Text>
      </TouchableOpacity>

      <Toast
        message={toastMessage}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080808',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  zoneSection: {
    marginVertical: 16,
  },
  confirmButton: {
    margin: 16,
    backgroundColor: '#B4FF32',
    borderRadius: 6,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmButtonPending: {
    opacity: 0.6,
  },
  confirmButtonText: {
    ...Typography.label,
    color: '#000000',
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
  },
});
