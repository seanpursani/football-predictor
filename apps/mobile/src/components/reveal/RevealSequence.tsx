import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Fixture, LeaderboardEntry, MiniLeague } from '@lecolpo/types';
import { useRevealStore } from '@/src/stores/useRevealStore';
import { RevealCard } from './RevealCard';
import type { ResultsRow } from '@/src/queries/useResultsQuery';
import type { RevealState } from './RevealCard';

// Re-export ResultsRow so consumers can import it from this feature boundary
export type { ResultsRow } from '@/src/queries/useResultsQuery';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RevealSequenceProps {
  results: ResultsRow[];
  fixtures: Fixture[];
  leagues: MiniLeague[];
  leaderboardEntries: LeaderboardEntry[];
  onAllRevealed: () => void;
  testID?: string;
}

type SequenceState = 'running' | 'complete';

// ─── Constants ────────────────────────────────────────────────────────────────

const COLOURS = {
  lime: '#B4FF32',
  bg: '#080808',
  surface: '#141414',
  textPrimary: '#FFFFFF',
  textMuted: '#7A7A7A',
  divider: '#303030',
  borderSubtle: '#1E1E1E',
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deriveRevealState(result: ResultsRow): Exclude<RevealState, 'pending' | 'revealing'> {
  if (!result.isCorrect) return 'miss';
  if (result.jackpotBonus > 0) return 'jackpot';
  if (result.captainMultiplier === 2) return 'captain-hit';
  return 'hit';
}

function sortResults(results: ResultsRow[], fixturesById: Map<number, Fixture>): ResultsRow[] {
  const matchPicks = results
    .filter((r) => r.predictionType === 'match')
    .sort((a, b) => {
      const fa = fixturesById.get(a.fixtureId);
      const fb = fixturesById.get(b.fixtureId);
      return (fa?.kickoffAt.getTime() ?? 0) - (fb?.kickoffAt.getTime() ?? 0);
    });

  const momentPicks = results
    .filter((r) => r.predictionType === 'moment')
    .sort((a, b) => {
      const fa = fixturesById.get(a.fixtureId);
      const fb = fixturesById.get(b.fixtureId);
      const fixtureDiff = (fa?.kickoffAt.getTime() ?? 0) - (fb?.kickoffAt.getTime() ?? 0);
      if (fixtureDiff !== 0) return fixtureDiff;
      return (a.predictedMinute ?? 999) - (b.predictedMinute ?? 999);
    });

  return [...matchPicks, ...momentPicks];
}

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

// ─── Component ────────────────────────────────────────────────────────────────

export function RevealSequence({
  results,
  fixtures,
  leagues,
  leaderboardEntries,
  onAllRevealed,
  testID,
}: RevealSequenceProps) {
  const { firstView, reduceMotion, revealIndex, advanceReveal, resetReveal } = useRevealStore();

  const [terminalIndices, setTerminalIndices] = useState<Set<number>>(new Set());
  const [displayScore, setDisplayScore] = useState(0);
  const [sequenceState, setSequenceState] = useState<SequenceState>('running');

  // Build fixture lookup
  const fixturesById = useMemo(() => {
    const map = new Map<number, Fixture>();
    for (const f of fixtures) map.set(f.id, f);
    return map;
  }, [fixtures]);

  // Sort results: match picks first (by kickoff), then moment picks (by kickoff + predictedMinute)
  const sortedResults = useMemo(
    () => sortResults(results, fixturesById),
    [results, fixturesById],
  );

  const finalTotal = useMemo(
    () => results.reduce((sum, r) => sum + r.totalPoints, 0),
    [results],
  );

  // On mount: reset reveal if firstView=true
  useEffect(() => {
    if (firstView) {
      resetReveal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // reduceMotion path: immediately show all final states, fire onAllRevealed
  useEffect(() => {
    if (firstView && reduceMotion && sortedResults.length > 0) {
      setTerminalIndices(new Set(sortedResults.map((_, i) => i)));
      setDisplayScore(finalTotal);
      setSequenceState('complete');
      onAllRevealed();
    }
    // Only run when reduceMotion / firstView becomes true (or on mount)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);

  // Empty results edge case: immediately complete (handles both reduceMotion paths)
  useEffect(() => {
    if (firstView && sortedResults.length === 0 && sequenceState === 'running') {
      setSequenceState('complete');
      onAllRevealed();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedResults.length]);

  // Timer: when revealIndex changes, wait ~400ms then transition card to terminal state
  useEffect(() => {
    if (!firstView || reduceMotion) return;
    if (revealIndex >= sortedResults.length) return;

    const timer = setTimeout(() => {
      setTerminalIndices((prev) => new Set([...prev, revealIndex]));
    }, 400);

    return () => clearTimeout(timer);
  }, [revealIndex, firstView, reduceMotion, sortedResults.length]);

  // onRevealComplete: called by RevealCard when terminal animation finishes
  const handleRevealComplete = useCallback(
    (result: ResultsRow, idx: number) => {
      setDisplayScore((prev) => prev + result.totalPoints);

      if (idx + 1 >= sortedResults.length) {
        // Snap score to exact final total (edge case guard)
        setDisplayScore(finalTotal);
        setSequenceState('complete');
        onAllRevealed();
      } else {
        // 600ms delay before next card starts revealing
        setTimeout(() => advanceReveal(), 600);
      }
    },
    [sortedResults.length, finalTotal, advanceReveal, onAllRevealed],
  );

  // Derive revealState for a given card index
  const getCardRevealState = (idx: number, result: ResultsRow): RevealState => {
    if (!firstView) return deriveRevealState(result);
    if (terminalIndices.has(idx) || revealIndex > idx) return deriveRevealState(result);
    if (revealIndex === idx) return 'revealing';
    return 'pending';
  };

  return (
<<<<<<< Updated upstream
    <View style={styles.wrapper} testID={testID}>
      {/* Running score counter — visible throughout the reveal, hidden on return visits */}
      {firstView && (
        <View style={styles.scoreHeader} testID="running-score-header">
          <Text style={styles.scoreHeaderLabel}>Score</Text>
          <Text style={styles.scoreHeaderValue} testID="running-score">{displayScore}</Text>
        </View>
      )}

      <ScrollView style={styles.container}>
=======
    <ScrollView style={styles.container} testID={testID}>
      {/* Running score counter — visible during first-view animated reveal (AC2) */}
      {firstView && !reduceMotion && sequenceState === 'running' && (
        <View style={styles.runningScoreBar}>
          <Text style={styles.runningScoreLabel}>Score</Text>
          <Text style={styles.runningScoreValue}>{displayScore}</Text>
        </View>
      )}
>>>>>>> Stashed changes
      {sortedResults.map((result, idx) => (
        <React.Fragment key={result.id}>
          {/* Chain connector between consecutive correct moment picks */}
          {showChainConnector(sortedResults, idx) && (
            <View style={styles.chainConnector} />
          )}

          {/* Streak break divider */}
          {showStreakBreak(sortedResults, idx) && (
            <View style={styles.streakBreakDivider} />
          )}

          <RevealCard
            revealState={getCardRevealState(idx, result)}
            eventName={result.eventName}
            eventType={result.eventType}
            predictionType={result.predictionType}
            pointsValue={result.totalPoints}
            isCaptain={result.isCaptain}
            firstView={firstView}
            reduceMotion={reduceMotion}
            isStreakChained={result.streakBonus > 0}
            streakBonusPoints={
              result.streakBonus > 0 ? (result.streakBonus as 10 | 20 | 30) : null
            }
            onRevealComplete={
              firstView && !reduceMotion ? () => handleRevealComplete(result, idx) : undefined
            }
            testID={`reveal-card-${idx}`}
          />
        </React.Fragment>
      ))}

      {/* Post-reveal summary */}
      {sequenceState === 'complete' && (
        <View style={styles.summarySection}>
          <Text style={styles.finalScoreLabel}>Gameweek Score</Text>
          <Text style={styles.finalScoreValue}>{displayScore}</Text>

          {/* Mini-league positions (AC9/10) */}
          {leagues.length === 0 ? (
            <Text style={styles.noLeaguePrompt} testID="no-league-prompt">
              No league yet — create one or join a friend&apos;s
            </Text>
          ) : (
            leagues.map((league) => {
              const entry = leaderboardEntries.find(
                (e) => (e as LeaderboardEntry & { leagueId?: number }).leagueId === league.id,
              );
              if (!entry) return null;
              const delta =
                entry.previousRank != null ? entry.previousRank - (entry.rank ?? 0) : 0;
              return (
                <View key={league.id} style={styles.leagueRow}>
                  <Text style={styles.leagueName}>{league.name}</Text>
                  <Text style={styles.leagueRank}>#{entry.rank ?? '—'}</Text>
                  {delta > 0 && (
                    <Text style={styles.rankUp}>↑{delta}</Text>
                  )}
                  {delta < 0 && (
                    <Text style={styles.rankDown}>↓{Math.abs(delta)}</Text>
                  )}
                  {delta === 0 && <Text style={styles.rankSame}>—</Text>}
                </View>
              );
            })
          )}
        </View>
      )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: COLOURS.bg,
  },
  scoreHeader: {
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLOURS.borderSubtle,
  },
  scoreHeaderLabel: {
    fontSize: 12,
    color: COLOURS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  scoreHeaderValue: {
    fontSize: 36,
    fontWeight: '700',
    color: COLOURS.lime,
    fontVariant: ['tabular-nums'],
  },
  container: {
    flex: 1,
    backgroundColor: COLOURS.bg,
  },
  chainConnector: {
    width: 2,
    height: 12,
    backgroundColor: COLOURS.lime,
    alignSelf: 'center',
    marginVertical: -2,
  },
  streakBreakDivider: {
    height: 1,
    backgroundColor: COLOURS.divider,
    marginHorizontal: 16,
  },
  runningScoreBar: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  runningScoreLabel: {
    fontSize: 12,
    color: COLOURS.textMuted,
    marginBottom: 2,
  },
  runningScoreValue: {
    fontSize: 32,
    fontWeight: '700',
    color: COLOURS.lime,
    fontVariant: ['tabular-nums'],
  },
  summarySection: {
    padding: 24,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLOURS.borderSubtle,
  },
  finalScoreLabel: {
    fontSize: 14,
    color: COLOURS.textMuted,
    marginBottom: 4,
  },
  finalScoreValue: {
    fontSize: 48,
    fontWeight: '700',
    color: COLOURS.lime,
    marginBottom: 24,
    fontVariant: ['tabular-nums'],
  },
  noLeaguePrompt: {
    fontSize: 14,
    color: COLOURS.textMuted,
    textAlign: 'center',
  },
  leagueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  leagueName: {
    fontSize: 14,
    color: COLOURS.textPrimary,
    flex: 1,
  },
  leagueRank: {
    fontSize: 14,
    color: COLOURS.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  rankUp: {
    fontSize: 14,
    color: '#B4FF32',
  },
  rankDown: {
    fontSize: 14,
    color: COLOURS.textMuted,
  },
  rankSame: {
    fontSize: 14,
    color: COLOURS.textMuted,
  },
});

