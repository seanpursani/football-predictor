/**
 * streak-calculator.ts
 *
 * Pure cross-match streak calculation for Precision Pick results.
 * NO Supabase calls, NO HTTP, NO side effects — fully unit-testable.
 *
 * Story 4.2
 */

import {STREAK_2_BONUS, STREAK_3_BONUS, STREAK_4_PLUS_BONUS,} from './constants.ts';
import type {ScoringOutput} from './scoring-engine.ts';

// ─── Interfaces ────────────────────────────────────────────────────────────────

export interface StreakScoringEntry {
    predictionId: string;
    fixtureId: number;
    isCorrect: boolean;
    /** null for misses — no real event to order by */
    realEventMinute: number | null;
    fixtureKickoffAt: Date;
    scoringOutput: ScoringOutput;
}

export interface StreakInput {
    scoringOutputs: StreakScoringEntry[];
}

export interface StreakResultEntry {
    predictionId: string;
    streakBonus: number;
    /** 1-based position in streak; null for misses */
    streakPosition: number | null;
    totalPointsWithStreak: number;
}

export interface StreakResult {
  /**
   * Entries in sorted (temporal) order — earliest real-world event first.
   * NOT in input order. Callers must look up by `predictionId`, not by index.
   */
  entries: StreakResultEntry[];
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Returns a [primary, secondary] sort tuple for an entry.
 *
 * Primary key:   fixture kickoff timestamp (ms) — groups entries by fixture, earliest first.
 * Secondary key: real event minute for hits, Infinity for misses.
 *
 * This guarantees:
 *   1. All entries in the same fixture are grouped together (same primary key).
 *   2. Within a fixture, correct hits are ordered by real event time; misses follow all hits.
 *   3. Across fixtures ordered by kickoff time, all entries in an earlier fixture
 *      (hits AND misses) come before all entries in a later fixture.
 *
 * Why not a single absolute sort key (kickoff + realEventMinute)?
 *   That approach requires a "miss sentinel minute" (e.g. 95) that breaks when two
 *   fixtures are scheduled ≤95 min apart — the miss in fixture N sorts after an early
 *   hit in fixture N+1, failing to break the streak.
 *
 * Why not kickoff-only for misses?
 *   Misses would sort before hits in the same fixture, so a miss in fixture A could
 *   wrongly break a streak that started in an earlier fixture.
 */
function sortKeys(entry: StreakScoringEntry): [number, number] {
  const primary = entry.fixtureKickoffAt.getTime();
  const secondary = (entry.isCorrect && entry.realEventMinute !== null)
    ? entry.realEventMinute
    : Infinity; // misses sort after all real events in their fixture
  return [primary, secondary];
}

/**
 * Returns the streak bonus for a given 1-based position within a consecutive-hit run.
 * Position 1 = first hit in streak → 0 bonus (no bonus for starting a streak).
 */
function getStreakBonus(position: number): number {
    if (position === 1) return 0;
    if (position === 2) return STREAK_2_BONUS;
    if (position === 3) return STREAK_3_BONUS;
    return STREAK_4_PLUS_BONUS; // 4+
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Calculate per-pick streak bonuses across all matches in a gameweek.
 *
 * Entries are sorted by real-world event time (fixture kickoff + actual event minute).
 * Consecutive correct picks form a streak; a miss resets the streak counter.
 * Streak bonuses are additive on top of `scoringOutput.totalPoints`.
 */
export function calculateStreaks(input: StreakInput): StreakResult {
  if (input.scoringOutputs.length === 0) {
    return { entries: [] };
  }

  // Guard: isCorrect=true with realEventMinute=null is an invariant violation —
  // the orchestrator must supply a real event minute for every correct pick.
  for (const e of input.scoringOutputs) {
    if (e.isCorrect && e.realEventMinute === null) {
      throw new Error(
        `calculateStreaks: entry "${e.predictionId}" has isCorrect=true but realEventMinute=null. ` +
        `The orchestrator must supply a real event minute for every correct pick.`
      );
    }
  }

  // Stable two-key sort: primary = fixture kickoff time, secondary = event minute (Infinity for misses).
  const sorted = [...input.scoringOutputs].sort((a, b) => {
    const [ap, as_] = sortKeys(a);
    const [bp, bs] = sortKeys(b);
    return ap !== bp ? ap - bp : as_ - bs;
  });

    const entries: StreakResultEntry[] = [];
    let currentStreakLength = 0;

    for (const entry of sorted) {
        if (entry.isCorrect) {
            currentStreakLength += 1;
            const bonus = getStreakBonus(currentStreakLength);
            entries.push({
                predictionId: entry.predictionId,
                streakBonus: bonus,
                streakPosition: currentStreakLength,
                totalPointsWithStreak: entry.scoringOutput.totalPoints + bonus,
            });
        } else {
            currentStreakLength = 0;
            entries.push({
                predictionId: entry.predictionId,
                streakBonus: 0,
                streakPosition: null,
                totalPointsWithStreak: entry.scoringOutput.totalPoints,
            });
        }
    }

    return {entries};
}

