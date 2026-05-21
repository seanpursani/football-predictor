/**
 * streak-calculator.test.ts
 *
 * Tests for the cross-match streak calculator (Story 4.2).
 * Runs in Jest/Node — NOT Deno.
 */

// Deno guard — this test file must run in Node/Jest only
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Deno: unknown;
if (typeof Deno !== 'undefined') {
    throw new Error('This test file must run in Node/Jest, not Deno');
}

import type {StreakInput, StreakScoringEntry} from '../functions/_shared/streak-calculator';
import {calculateStreaks} from '../functions/_shared/streak-calculator';
import {STREAK_2_BONUS, STREAK_3_BONUS, STREAK_4_PLUS_BONUS,} from '../functions/_shared/constants';

// ─── Helper ────────────────────────────────────────────────────────────────────

function buildEntry(overrides: Partial<StreakScoringEntry> & { predictionId: string }): StreakScoringEntry {
    return {
        predictionId: overrides.predictionId,
        fixtureId: overrides.fixtureId ?? 1,
        isCorrect: overrides.isCorrect ?? true,
        realEventMinute: overrides.realEventMinute !== undefined ? overrides.realEventMinute : 30,
        fixtureKickoffAt: overrides.fixtureKickoffAt ?? new Date('2025-08-16T15:00:00Z'),
        scoringOutput: overrides.scoringOutput ?? {
            eventPoints: 40,
            timingBonus: 0,
            playerBonus: 0,
            assisterBonus: 0,
            zoneBonus: 0,
            jackpotBonus: 0,
            captainMultiplier: 1,
            streakBonus: 0,
            totalPoints: 40,
            isCorrect: true,
        },
    };
}

const KICKOFF_A = new Date('2025-08-16T12:30:00Z');
const KICKOFF_B = new Date('2025-08-16T15:00:00Z');
const KICKOFF_C = new Date('2025-08-16T17:30:00Z');

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('calculateStreaks', () => {
    // Test: zero entries (empty input)
    it('returns empty entries for empty input without throwing', () => {
        const input: StreakInput = {scoringOutputs: []};
        const result = calculateStreaks(input);
        expect(result.entries).toEqual([]);
    });

    // Test: single correct pick only
    it('single correct pick gets position 1 with zero bonus', () => {
        const input: StreakInput = {
            scoringOutputs: [buildEntry({predictionId: 'p1'})],
        };
        const result = calculateStreaks(input);
        expect(result.entries).toHaveLength(1);
        expect(result.entries[0].streakBonus).toBe(0);
        expect(result.entries[0].streakPosition).toBe(1);
        expect(result.entries[0].totalPointsWithStreak).toBe(40);
    });

    // Test: all miss
    it('all misses result in zero streak bonuses and null positions', () => {
        const missScoringOutput = {
            eventPoints: 0, timingBonus: 0, playerBonus: 0, assisterBonus: 0,
            zoneBonus: 0, jackpotBonus: 0, captainMultiplier: 1, streakBonus: 0,
            totalPoints: 0, isCorrect: false,
        };
        const input: StreakInput = {
            scoringOutputs: [
                buildEntry({
                    predictionId: 'p1',
                    isCorrect: false,
                    realEventMinute: null,
                    scoringOutput: missScoringOutput
                }),
                buildEntry({
                    predictionId: 'p2',
                    isCorrect: false,
                    realEventMinute: null,
                    scoringOutput: missScoringOutput
                }),
                buildEntry({
                    predictionId: 'p3',
                    isCorrect: false,
                    realEventMinute: null,
                    scoringOutput: missScoringOutput
                }),
            ],
        };
        const result = calculateStreaks(input);
        for (const entry of result.entries) {
            expect(entry.streakBonus).toBe(0);
            expect(entry.streakPosition).toBeNull();
            expect(entry.totalPointsWithStreak).toBe(0);
        }
    });

    // Test: single streak across 3 consecutive hits in different matches
    it('single streak across 3 consecutive hits across different matches: bonuses 0/10/20', () => {
        const input: StreakInput = {
            scoringOutputs: [
                buildEntry({predictionId: 'p1', fixtureKickoffAt: KICKOFF_A, realEventMinute: 30}),
                buildEntry({predictionId: 'p2', fixtureKickoffAt: KICKOFF_B, realEventMinute: 15}),
                buildEntry({predictionId: 'p3', fixtureKickoffAt: KICKOFF_C, realEventMinute: 10}),
            ],
        };
        const result = calculateStreaks(input);
        // Sorted by absolute time: A@30 < B@15 < C@10 (different kickoffs)
        const byId = Object.fromEntries(result.entries.map(e => [e.predictionId, e]));
        expect(byId['p1'].streakBonus).toBe(0);
        expect(byId['p1'].streakPosition).toBe(1);
        expect(byId['p2'].streakBonus).toBe(STREAK_2_BONUS);
        expect(byId['p2'].streakPosition).toBe(2);
        expect(byId['p3'].streakBonus).toBe(STREAK_3_BONUS);
        expect(byId['p3'].streakPosition).toBe(3);
    });

    // Test: streak broken mid-gameweek → [hit, hit, miss, hit]
    it('streak broken mid-gameweek: [hit, hit, miss, hit] → bonuses [0, 10, 0, 0]', () => {
        const missOutput = {
            eventPoints: 0, timingBonus: 0, playerBonus: 0, assisterBonus: 0,
            zoneBonus: 0, jackpotBonus: 0, captainMultiplier: 1, streakBonus: 0,
            totalPoints: 0, isCorrect: false,
        };
        const input: StreakInput = {
            scoringOutputs: [
                buildEntry({predictionId: 'p1', fixtureKickoffAt: KICKOFF_A, realEventMinute: 10}),
                buildEntry({predictionId: 'p2', fixtureKickoffAt: KICKOFF_A, realEventMinute: 30}),
                buildEntry({
                    predictionId: 'p3',
                    fixtureKickoffAt: KICKOFF_B,
                    realEventMinute: null,
                    isCorrect: false,
                    scoringOutput: missOutput
                }),
                buildEntry({predictionId: 'p4', fixtureKickoffAt: KICKOFF_C, realEventMinute: 20}),
            ],
        };
        const result = calculateStreaks(input);
        const bonuses = result.entries.map(e => e.streakBonus);
        expect(bonuses).toEqual([0, STREAK_2_BONUS, 0, 0]);
        expect(result.entries[2].streakPosition).toBeNull();
        expect(result.entries[3].streakPosition).toBe(1);
    });

    // Test: multiple separate streaks → [hit, miss, hit, hit, hit]
    it('multiple separate streaks: [hit, miss, hit, hit, hit] → bonuses [0, 0, 0, 10, 20]', () => {
        const missOutput = {
            eventPoints: 0, timingBonus: 0, playerBonus: 0, assisterBonus: 0,
            zoneBonus: 0, jackpotBonus: 0, captainMultiplier: 1, streakBonus: 0,
            totalPoints: 0, isCorrect: false,
        };
        const input: StreakInput = {
            scoringOutputs: [
                buildEntry({predictionId: 'p1', fixtureKickoffAt: KICKOFF_A, realEventMinute: 10}),
                buildEntry({
                    predictionId: 'p2',
                    fixtureKickoffAt: KICKOFF_A,
                    realEventMinute: null,
                    isCorrect: false,
                    scoringOutput: missOutput
                }),
                buildEntry({predictionId: 'p3', fixtureKickoffAt: KICKOFF_B, realEventMinute: 10}),
                buildEntry({predictionId: 'p4', fixtureKickoffAt: KICKOFF_B, realEventMinute: 30}),
                buildEntry({predictionId: 'p5', fixtureKickoffAt: KICKOFF_C, realEventMinute: 10}),
            ],
        };
        const result = calculateStreaks(input);
        const bonuses = result.entries.map(e => e.streakBonus);
        expect(bonuses).toEqual([0, 0, 0, STREAK_2_BONUS, STREAK_3_BONUS]);
    });

    // Test: 4th+ consecutive bonus capped at 30
    it('4th+ consecutive bonus capped at STREAK_4_PLUS_BONUS: [hit×5] → bonuses [0,10,20,30,30]', () => {
        const input: StreakInput = {
            scoringOutputs: [
                buildEntry({predictionId: 'p1', fixtureKickoffAt: KICKOFF_A, realEventMinute: 10}),
                buildEntry({predictionId: 'p2', fixtureKickoffAt: KICKOFF_A, realEventMinute: 20}),
                buildEntry({predictionId: 'p3', fixtureKickoffAt: KICKOFF_A, realEventMinute: 30}),
                buildEntry({predictionId: 'p4', fixtureKickoffAt: KICKOFF_A, realEventMinute: 40}),
                buildEntry({predictionId: 'p5', fixtureKickoffAt: KICKOFF_A, realEventMinute: 55}),
            ],
        };
        const result = calculateStreaks(input);
        const bonuses = result.entries.map(e => e.streakBonus);
        expect(bonuses).toEqual([0, STREAK_2_BONUS, STREAK_3_BONUS, STREAK_4_PLUS_BONUS, STREAK_4_PLUS_BONUS]);
    });

    // Test: totalPointsWithStreak correctness
    it('totalPointsWithStreak = scoringOutput.totalPoints + streakBonus', () => {
        const mkOutput = (pts: number) => ({
            eventPoints: pts, timingBonus: 0, playerBonus: 0, assisterBonus: 0,
            zoneBonus: 0, jackpotBonus: 0, captainMultiplier: 1, streakBonus: 0,
            totalPoints: pts, isCorrect: true,
        });
        const input: StreakInput = {
            scoringOutputs: [
                buildEntry({
                    predictionId: 'p1',
                    fixtureKickoffAt: KICKOFF_A,
                    realEventMinute: 10,
                    scoringOutput: mkOutput(40)
                }),
                buildEntry({
                    predictionId: 'p2',
                    fixtureKickoffAt: KICKOFF_A,
                    realEventMinute: 30,
                    scoringOutput: mkOutput(80)
                }),
                buildEntry({
                    predictionId: 'p3',
                    fixtureKickoffAt: KICKOFF_B,
                    realEventMinute: 15,
                    scoringOutput: mkOutput(20)
                }),
            ],
        };
        const result = calculateStreaks(input);
        const byId = Object.fromEntries(result.entries.map(e => [e.predictionId, e]));
        expect(byId['p1'].totalPointsWithStreak).toBe(40 + 0);
        expect(byId['p2'].totalPointsWithStreak).toBe(80 + STREAK_2_BONUS);
        expect(byId['p3'].totalPointsWithStreak).toBe(20 + STREAK_3_BONUS);
    });

    // Test: miss resets streak immediately
    it('miss resets streak immediately: [hit, hit, miss, hit, hit] → bonuses [0, 10, 0, 0, 10]', () => {
        const missOutput = {
            eventPoints: 0, timingBonus: 0, playerBonus: 0, assisterBonus: 0,
            zoneBonus: 0, jackpotBonus: 0, captainMultiplier: 1, streakBonus: 0,
            totalPoints: 0, isCorrect: false,
        };
        const input: StreakInput = {
            scoringOutputs: [
                buildEntry({predictionId: 'p1', fixtureKickoffAt: KICKOFF_A, realEventMinute: 10}),
                buildEntry({predictionId: 'p2', fixtureKickoffAt: KICKOFF_A, realEventMinute: 30}),
                buildEntry({
                    predictionId: 'p3',
                    fixtureKickoffAt: KICKOFF_B,
                    realEventMinute: null,
                    isCorrect: false,
                    scoringOutput: missOutput
                }),
                buildEntry({predictionId: 'p4', fixtureKickoffAt: KICKOFF_C, realEventMinute: 10}),
                buildEntry({predictionId: 'p5', fixtureKickoffAt: KICKOFF_C, realEventMinute: 25}),
            ],
        };
        const result = calculateStreaks(input);
        const bonuses = result.entries.map(e => e.streakBonus);
        expect(bonuses).toEqual([0, STREAK_2_BONUS, 0, 0, STREAK_2_BONUS]);
    });

    // Test: parallel-kickoff matches ordered by realEventMinute
    it('parallel-kickoff matches: ordered by realEventMinute within same kickoff', () => {
        // Both matches start at KICKOFF_A; minute 15 should rank before minute 30
        const input: StreakInput = {
            scoringOutputs: [
                buildEntry({predictionId: 'p-late', fixtureId: 2, fixtureKickoffAt: KICKOFF_A, realEventMinute: 30}),
                buildEntry({predictionId: 'p-early', fixtureId: 1, fixtureKickoffAt: KICKOFF_A, realEventMinute: 15}),
            ],
        };
        const result = calculateStreaks(input);
        // p-early (min 15) should be position 1, p-late (min 30) position 2
        const byId = Object.fromEntries(result.entries.map(e => [e.predictionId, e]));
        expect(byId['p-early'].streakPosition).toBe(1);
        expect(byId['p-early'].streakBonus).toBe(0);
        expect(byId['p-late'].streakPosition).toBe(2);
        expect(byId['p-late'].streakBonus).toBe(STREAK_2_BONUS);
    });

    // Test: ordering is by real-world event time, NOT predicted minute
    it('ordering uses realEventMinute (actual), not predictedMinute', () => {
        // p1: actual event at minute 60 (late), p2: actual event at minute 20 (early)
        // If ordered by predicted minute (say p1=10, p2=50) we'd get wrong order
        // We pass them in "wrong" order to confirm the sort corrects it
        const input: StreakInput = {
            scoringOutputs: [
                buildEntry({predictionId: 'p1', fixtureKickoffAt: KICKOFF_A, realEventMinute: 60}),
                buildEntry({predictionId: 'p2', fixtureKickoffAt: KICKOFF_A, realEventMinute: 20}),
            ],
        };
        // After sorting by realEventMinute: p2 (20) then p1 (60)
        const result = calculateStreaks(input);
        const byId = Object.fromEntries(result.entries.map(e => [e.predictionId, e]));
        expect(byId['p2'].streakPosition).toBe(1);
        expect(byId['p1'].streakPosition).toBe(2);
        expect(byId['p1'].streakBonus).toBe(STREAK_2_BONUS);
    });

  // Test: streak continues correctly across more than 2 different fixtures
  it('streak continues correctly across more than 2 different fixtures', () => {
    // 5 hits each in a different fixture / different absolute time
    const kickoffs = [
      new Date('2025-08-16T12:30:00Z'),
      new Date('2025-08-16T15:00:00Z'),
      new Date('2025-08-16T17:30:00Z'),
      new Date('2025-08-17T12:30:00Z'),
      new Date('2025-08-17T15:00:00Z'),
    ];
    const input: StreakInput = {
      scoringOutputs: kickoffs.map((k, i) =>
        buildEntry({ predictionId: `p${i + 1}`, fixtureKickoffAt: k, realEventMinute: 45 })
      ),
    };
    const result = calculateStreaks(input);
    const bonuses = result.entries.map(e => e.streakBonus);
    expect(bonuses).toEqual([0, STREAK_2_BONUS, STREAK_3_BONUS, STREAK_4_PLUS_BONUS, STREAK_4_PLUS_BONUS]);
  });

  // Test: miss does NOT break streak when fixtures are tightly scheduled (≤95 min apart)
  // Regression test for the sentinel collision bug: a miss in Fixture B (kickoff 15:00)
  // must break the streak between hits from Fixture A and Fixture C (kickoff 15:20).
  it('miss in tightly-spaced fixture correctly breaks streak', () => {
    const TIGHT_KICKOFF_A = new Date('2025-08-16T15:00:00Z');
    const TIGHT_KICKOFF_B = new Date('2025-08-16T15:20:00Z'); // only 20 min after A
    const TIGHT_KICKOFF_C = new Date('2025-08-16T15:40:00Z'); // only 40 min after A
    const missOutput = {
      eventPoints: 0, timingBonus: 0, playerBonus: 0, assisterBonus: 0,
      zoneBonus: 0, jackpotBonus: 0, captainMultiplier: 1, streakBonus: 0,
      totalPoints: 0, isCorrect: false,
    };
    const input: StreakInput = {
      scoringOutputs: [
        buildEntry({ predictionId: 'p1', fixtureKickoffAt: TIGHT_KICKOFF_A, realEventMinute: 10 }),
        buildEntry({ predictionId: 'p2', fixtureKickoffAt: TIGHT_KICKOFF_B, isCorrect: false, realEventMinute: null, scoringOutput: missOutput }),
        buildEntry({ predictionId: 'p3', fixtureKickoffAt: TIGHT_KICKOFF_C, realEventMinute: 5 }),
      ],
    };
    const result = calculateStreaks(input);
    const byId = Object.fromEntries(result.entries.map(e => [e.predictionId, e]));
    // p1 is a hit (position 1, bonus 0)
    expect(byId['p1'].streakPosition).toBe(1);
    expect(byId['p1'].streakBonus).toBe(0);
    // p2 is a miss — must break the streak
    expect(byId['p2'].streakPosition).toBeNull();
    expect(byId['p2'].streakBonus).toBe(0);
    // p3 is a new hit — starts a fresh streak at position 1 (NOT position 2)
    expect(byId['p3'].streakPosition).toBe(1);
    expect(byId['p3'].streakBonus).toBe(0);
  });

  // Test: isCorrect=true with realEventMinute=null throws an invariant violation error
  it('throws if isCorrect=true but realEventMinute=null', () => {
    const input: StreakInput = {
      scoringOutputs: [
        buildEntry({ predictionId: 'p1', isCorrect: true, realEventMinute: null }),
      ],
    };
    expect(() => calculateStreaks(input)).toThrow(/realEventMinute=null/);
  });
});

