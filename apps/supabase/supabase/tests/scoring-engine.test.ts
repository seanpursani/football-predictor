/**
 * scoring-engine.test.ts
 *
 * Tests for the multi-layer scoring engine (Story 4.1).
 * Runs in Jest/Node — NOT Deno.
 */

// Deno guard — this test file must run in Node/Jest only
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Deno: unknown;
if (typeof Deno !== 'undefined') {
  throw new Error('This test file must run in Node/Jest, not Deno');
}

import { scorePrediction, ScoringInput } from '../functions/_shared/scoring-engine';
import {
  TIMING_WINDOW_5_BONUS,
  TIMING_WINDOW_10_BONUS,
  TIMING_WINDOW_15_BONUS,
  JACKPOT_BONUS,
  CAPTAIN_MULTIPLIER,
} from '../functions/_shared/constants';

// ─── Test Fixture Builders ─────────────────────────────────────────────────────

function makePrediction(overrides: Partial<{
  predictionType: string;
  isCaptain: boolean;
  fixtureId: number;
  predictedMinute: number | null;
  confidenceWindow: number | null;
  predictedPlayerId: string | null;
  predictedAssisterId: string | null;
  predictedZone: string | null;
}> = {}) {
  return {
    id: 1,
    userId: 'user-1',
    gameweekId: 1,
    fixtureId: overrides.fixtureId ?? 10,
    gameWeekMomentId: 1,
    predictionType: overrides.predictionType ?? 'moment',
    isCaptain: overrides.isCaptain ?? false,
    predictedMinute: overrides.predictedMinute ?? null,
    confidenceWindow: overrides.confidenceWindow ?? null,
    predictedPlayerId: overrides.predictedPlayerId ?? null,
    predictedAssisterId: overrides.predictedAssisterId ?? null,
    predictedZone: overrides.predictedZone ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function makeMoment(overrides: Partial<{
  basePoints: number;
  playerBonusPoints: number | null;
  assisterBonusPoints: number | null;
  zoneBonusPoints: number | null;
  timingBonusPoints: number | null;
  jackpotBonusPoints: number | null;
}> = {}) {
  return {
    id: 1,
    gameweekId: 1,
    fixtureId: 10,
    momentTypeId: 1,
    basePoints: overrides.basePoints ?? 40,
    playerBonusPoints: overrides.playerBonusPoints ?? 20,
    assisterBonusPoints: overrides.assisterBonusPoints ?? 15,
    zoneBonusPoints: overrides.zoneBonusPoints ?? 10,
    timingBonusPoints: overrides.timingBonusPoints ?? null,
    jackpotBonusPoints: overrides.jackpotBonusPoints ?? null,
    teamId: 'team-a',
    createdAt: new Date(),
  };
}

function makeMomentType(eventType: string, predictionType = 'moment') {
  return {
    id: 1,
    name: `${eventType}-moment`,
    eventType,
    predictionType,
    description: null,
    createdAt: new Date(),
  };
}

function makeMatchEvent(overrides: Partial<{
  matchId: number;
  eventType: string;
  playerId: string;
  minute: number;
  teamId: string;
  extraData: unknown;
}> = {}) {
  return {
    id: 1,
    matchId: overrides.matchId ?? 10,
    eventType: overrides.eventType ?? 'goal',
    playerId: overrides.playerId ?? 'player-1',
    minute: overrides.minute ?? 30,
    teamId: overrides.teamId ?? 'team-a',
    extraData: overrides.extraData ?? null,
    createdAt: new Date(),
  };
}

function makeFixture(overrides: Partial<{ id: number }> = {}) {
  return {
    id: overrides.id ?? 10,
    gameweekId: 1,
    externalId: 'ext-10',
    homeTeam: 'Home FC',
    awayTeam: 'Away FC',
    kickoffAt: new Date(),
    isPostponed: false,
    isVoid: false,
    eventsIngested: true,
    createdAt: new Date(),
  };
}

// ─── Match Moment Tests ────────────────────────────────────────────────────────

describe('Match Moment scoring (predictionType=match)', () => {
  it('awards basePoints and isCorrect:true when the event occurred', () => {
    const input: ScoringInput = {
      prediction: makePrediction({ predictionType: 'match' }),
      gameWeekMoment: makeMoment({ basePoints: 40 }),
      momentType: makeMomentType('goal', 'match'),
      matchEvents: [makeMatchEvent({ matchId: 10, eventType: 'goal' })],
      fixture: makeFixture(),
    };
    const result = scorePrediction(input);
    expect(result.eventPoints).toBe(40);
    expect(result.isCorrect).toBe(true);
    expect(result.timingBonus).toBe(0);
    expect(result.playerBonus).toBe(0);
    expect(result.assisterBonus).toBe(0);
    expect(result.zoneBonus).toBe(0);
    expect(result.jackpotBonus).toBe(0);
    expect(result.streakBonus).toBe(0);
    expect(result.captainMultiplier).toBe(1);
    expect(result.totalPoints).toBe(40);
  });

  it('awards 0 and isCorrect:false when the event did NOT occur', () => {
    const input: ScoringInput = {
      prediction: makePrediction({ predictionType: 'match' }),
      gameWeekMoment: makeMoment({ basePoints: 40 }),
      momentType: makeMomentType('goal', 'match'),
      matchEvents: [], // no events
      fixture: makeFixture(),
    };
    const result = scorePrediction(input);
    expect(result.eventPoints).toBe(0);
    expect(result.isCorrect).toBe(false);
    expect(result.totalPoints).toBe(0);
  });

  it('doubles totalPoints when captain and event occurred', () => {
    const input: ScoringInput = {
      prediction: makePrediction({ predictionType: 'match', isCaptain: true }),
      gameWeekMoment: makeMoment({ basePoints: 40 }),
      momentType: makeMomentType('goal', 'match'),
      matchEvents: [makeMatchEvent({ matchId: 10, eventType: 'goal' })],
      fixture: makeFixture(),
    };
    const result = scorePrediction(input);
    expect(result.captainMultiplier).toBe(CAPTAIN_MULTIPLIER);
    expect(result.totalPoints).toBe(80);
  });
});

// ─── Precision Pick — Event NOT occurred ──────────────────────────────────────

describe('Precision Pick — event NOT occurred', () => {
  it('returns all zeros when no matching events exist', () => {
    const input: ScoringInput = {
      prediction: makePrediction({ predictionType: 'moment', predictedMinute: 30, confidenceWindow: 5 }),
      gameWeekMoment: makeMoment(),
      momentType: makeMomentType('goal'),
      matchEvents: [],
      fixture: makeFixture(),
    };
    const result = scorePrediction(input);
    expect(result.eventPoints).toBe(0);
    expect(result.timingBonus).toBe(0);
    expect(result.playerBonus).toBe(0);
    expect(result.assisterBonus).toBe(0);
    expect(result.zoneBonus).toBe(0);
    expect(result.jackpotBonus).toBe(0);
    expect(result.isCorrect).toBe(false);
    expect(result.totalPoints).toBe(0);
  });
});

// ─── Goal Precision Pick ───────────────────────────────────────────────────────

describe('Goal Precision Pick', () => {
  it('awards all layers when scorer correct, assister correct, and exact minute', () => {
    const input: ScoringInput = {
      prediction: makePrediction({
        predictedMinute: 30,
        confidenceWindow: 10,
        predictedPlayerId: 'scorer-1',
        predictedAssisterId: 'assister-1',
      }),
      gameWeekMoment: makeMoment({ basePoints: 40, playerBonusPoints: 20, assisterBonusPoints: 15 }),
      momentType: makeMomentType('goal'),
      matchEvents: [makeMatchEvent({
        matchId: 10,
        eventType: 'goal',
        playerId: 'scorer-1',
        minute: 30,
        extraData: { assisterId: 'assister-1' },
      })],
      fixture: makeFixture(),
    };
    const result = scorePrediction(input);
    expect(result.eventPoints).toBe(40);
    expect(result.timingBonus).toBe(TIMING_WINDOW_5_BONUS); // diff=0 ≤ 5
    expect(result.jackpotBonus).toBe(JACKPOT_BONUS); // exact minute
    expect(result.playerBonus).toBe(20);
    expect(result.assisterBonus).toBe(15);
    expect(result.isCorrect).toBe(true);
    expect(result.totalPoints).toBe(40 + TIMING_WINDOW_5_BONUS + JACKPOT_BONUS + 20 + 15);
  });

  it('awards event points only when timing missed and players missed', () => {
    const input: ScoringInput = {
      prediction: makePrediction({
        predictedMinute: 30,
        confidenceWindow: 5,
        predictedPlayerId: 'wrong-scorer',
        predictedAssisterId: 'wrong-assister',
      }),
      gameWeekMoment: makeMoment({ basePoints: 40, playerBonusPoints: 20, assisterBonusPoints: 15 }),
      momentType: makeMomentType('goal'),
      matchEvents: [makeMatchEvent({
        matchId: 10,
        eventType: 'goal',
        playerId: 'scorer-1',
        minute: 50, // diff 20 > window 5 → no timing bonus
        extraData: { assisterId: 'assister-1' },
      })],
      fixture: makeFixture(),
    };
    const result = scorePrediction(input);
    expect(result.eventPoints).toBe(40);
    expect(result.timingBonus).toBe(0);
    expect(result.jackpotBonus).toBe(0);
    expect(result.playerBonus).toBe(0);
    expect(result.assisterBonus).toBe(0);
    expect(result.totalPoints).toBe(40);
  });

  it('awards scorer bonus independently of assister', () => {
    const input: ScoringInput = {
      prediction: makePrediction({
        predictedPlayerId: 'scorer-1',
        predictedAssisterId: 'wrong-assister',
      }),
      gameWeekMoment: makeMoment({ basePoints: 40, playerBonusPoints: 20, assisterBonusPoints: 15 }),
      momentType: makeMomentType('goal'),
      matchEvents: [makeMatchEvent({
        matchId: 10,
        eventType: 'goal',
        playerId: 'scorer-1',
        extraData: { assisterId: 'assister-1' },
      })],
      fixture: makeFixture(),
    };
    const result = scorePrediction(input);
    expect(result.playerBonus).toBe(20);
    expect(result.assisterBonus).toBe(0);
  });

  it('awards assister bonus independently of scorer', () => {
    const input: ScoringInput = {
      prediction: makePrediction({
        predictedPlayerId: 'wrong-scorer',
        predictedAssisterId: 'assister-1',
      }),
      gameWeekMoment: makeMoment({ basePoints: 40, playerBonusPoints: 20, assisterBonusPoints: 15 }),
      momentType: makeMomentType('goal'),
      matchEvents: [makeMatchEvent({
        matchId: 10,
        eventType: 'goal',
        playerId: 'scorer-1',
        extraData: { assisterId: 'assister-1' },
      })],
      fixture: makeFixture(),
    };
    const result = scorePrediction(input);
    expect(result.playerBonus).toBe(0);
    expect(result.assisterBonus).toBe(15);
  });

  it('jackpot — exact minute awards timingBonus + JACKPOT_BONUS', () => {
    const input: ScoringInput = {
      prediction: makePrediction({ predictedMinute: 45, confidenceWindow: 10 }),
      gameWeekMoment: makeMoment({ basePoints: 40 }),
      momentType: makeMomentType('goal'),
      matchEvents: [makeMatchEvent({ matchId: 10, eventType: 'goal', minute: 45 })],
      fixture: makeFixture(),
    };
    const result = scorePrediction(input);
    expect(result.timingBonus).toBe(TIMING_WINDOW_5_BONUS); // diff=0 ≤ 5
    expect(result.jackpotBonus).toBe(JACKPOT_BONUS);
    expect(result.totalPoints).toBe(40 + TIMING_WINDOW_5_BONUS + JACKPOT_BONUS);
  });

  it('multi-event match: uses closest-event rule for timing (best-match)', () => {
    // Two goals: minute 22 and 67. User predicted minute 70 (±10).
    // diff to 22 = 48 (outside window), diff to 67 = 3 (within ±5).
    // Closest event is 67 → should award TIMING_WINDOW_5_BONUS.
    const input: ScoringInput = {
      prediction: makePrediction({ predictedMinute: 70, confidenceWindow: 10 }),
      gameWeekMoment: makeMoment({ basePoints: 40 }),
      momentType: makeMomentType('goal'),
      matchEvents: [
        makeMatchEvent({ matchId: 10, eventType: 'goal', minute: 22 }),
        makeMatchEvent({ matchId: 10, eventType: 'goal', minute: 67 }),
      ],
      fixture: makeFixture(),
    };
    const result = scorePrediction(input);
    expect(result.timingBonus).toBe(TIMING_WINDOW_5_BONUS); // diff=3 from minute 67
    expect(result.isCorrect).toBe(true);
  });
});

// ─── Substitution Precision Pick ──────────────────────────────────────────────

describe('Substitution Precision Pick', () => {
  it('awards player-on bonus when correct player came on, zero player-off', () => {
    const input: ScoringInput = {
      prediction: makePrediction({
        predictedPlayerId: 'player-on',
        predictedAssisterId: 'wrong-player-off',
      }),
      gameWeekMoment: makeMoment({ basePoints: 30, playerBonusPoints: 10, assisterBonusPoints: 10 }),
      momentType: makeMomentType('substitution'),
      matchEvents: [makeMatchEvent({
        matchId: 10,
        eventType: 'substitution',
        playerId: 'player-on',
        extraData: { playerOffId: 'player-off' },
      })],
      fixture: makeFixture(),
    };
    const result = scorePrediction(input);
    expect(result.playerBonus).toBe(10);
    expect(result.assisterBonus).toBe(0);
    expect(result.isCorrect).toBe(true);
  });

  it('awards player-off bonus independently when correct player went off', () => {
    const input: ScoringInput = {
      prediction: makePrediction({
        predictedPlayerId: 'wrong-player-on',
        predictedAssisterId: 'player-off',
      }),
      gameWeekMoment: makeMoment({ basePoints: 30, playerBonusPoints: 10, assisterBonusPoints: 10 }),
      momentType: makeMomentType('substitution'),
      matchEvents: [makeMatchEvent({
        matchId: 10,
        eventType: 'substitution',
        playerId: 'player-on',
        extraData: { playerOffId: 'player-off' },
      })],
      fixture: makeFixture(),
    };
    const result = scorePrediction(input);
    expect(result.playerBonus).toBe(0);
    expect(result.assisterBonus).toBe(10);
  });
});

// ─── Corner Precision Pick ────────────────────────────────────────────────────

describe('Corner Precision Pick', () => {
  it('awards zone bonus when correct zone predicted', () => {
    const input: ScoringInput = {
      prediction: makePrediction({ predictedZone: 'near-post' }),
      gameWeekMoment: makeMoment({ basePoints: 20, zoneBonusPoints: 10 }),
      momentType: makeMomentType('corner'),
      matchEvents: [makeMatchEvent({
        matchId: 10,
        eventType: 'corner',
        extraData: { zone: 'near-post' },
      })],
      fixture: makeFixture(),
    };
    const result = scorePrediction(input);
    expect(result.zoneBonus).toBe(10);
    expect(result.isCorrect).toBe(true);
  });

  it('awards zero zone bonus when wrong zone predicted', () => {
    const input: ScoringInput = {
      prediction: makePrediction({ predictedZone: 'far-post' }),
      gameWeekMoment: makeMoment({ basePoints: 20, zoneBonusPoints: 10 }),
      momentType: makeMomentType('corner'),
      matchEvents: [makeMatchEvent({
        matchId: 10,
        eventType: 'corner',
        extraData: { zone: 'near-post' },
      })],
      fixture: makeFixture(),
    };
    const result = scorePrediction(input);
    expect(result.zoneBonus).toBe(0);
  });
});

// ─── Yellow Card Precision Pick ───────────────────────────────────────────────

describe('Yellow Card Precision Pick', () => {
  it('awards player bonus when correct player carded', () => {
    const input: ScoringInput = {
      prediction: makePrediction({ predictedPlayerId: 'naughty-player' }),
      gameWeekMoment: makeMoment({ basePoints: 60, playerBonusPoints: 25 }),
      momentType: makeMomentType('yellow_card'),
      matchEvents: [makeMatchEvent({
        matchId: 10,
        eventType: 'yellow_card',
        playerId: 'naughty-player',
      })],
      fixture: makeFixture(),
    };
    const result = scorePrediction(input);
    expect(result.playerBonus).toBe(25);
    expect(result.isCorrect).toBe(true);
  });

  it('awards zero player bonus when wrong player', () => {
    const input: ScoringInput = {
      prediction: makePrediction({ predictedPlayerId: 'wrong-player' }),
      gameWeekMoment: makeMoment({ basePoints: 60, playerBonusPoints: 25 }),
      momentType: makeMomentType('yellow_card'),
      matchEvents: [makeMatchEvent({
        matchId: 10,
        eventType: 'yellow_card',
        playerId: 'naughty-player',
      })],
      fixture: makeFixture(),
    };
    const result = scorePrediction(input);
    expect(result.playerBonus).toBe(0);
  });
});

// ─── Red Card Precision Pick ──────────────────────────────────────────────────

describe('Red Card Precision Pick', () => {
  it('awards player bonus when correct player received red card', () => {
    const input: ScoringInput = {
      prediction: makePrediction({ predictedPlayerId: 'bad-player' }),
      gameWeekMoment: makeMoment({ basePoints: 80, playerBonusPoints: 30 }),
      momentType: makeMomentType('red_card'),
      matchEvents: [makeMatchEvent({
        matchId: 10,
        eventType: 'red_card',
        playerId: 'bad-player',
      })],
      fixture: makeFixture(),
    };
    const result = scorePrediction(input);
    expect(result.playerBonus).toBe(30);
    expect(result.isCorrect).toBe(true);
  });
});

// ─── Captain Multiplier ───────────────────────────────────────────────────────

describe('Captain multiplier', () => {
  it('doubles pre-streak sub-total when captain on a HIT', () => {
    const input: ScoringInput = {
      prediction: makePrediction({ isCaptain: true, predictedPlayerId: 'scorer-1' }),
      gameWeekMoment: makeMoment({ basePoints: 40, playerBonusPoints: 20 }),
      momentType: makeMomentType('goal'),
      matchEvents: [makeMatchEvent({ matchId: 10, eventType: 'goal', playerId: 'scorer-1' })],
      fixture: makeFixture(),
    };
    const result = scorePrediction(input);
    expect(result.captainMultiplier).toBe(CAPTAIN_MULTIPLIER);
    // 40 (event) + 20 (player) = 60 × 2 = 120
    expect(result.totalPoints).toBe(120);
  });

  it('captain on a MISS produces 0 totalPoints (never negative)', () => {
    const input: ScoringInput = {
      prediction: makePrediction({ isCaptain: true }),
      gameWeekMoment: makeMoment({ basePoints: 40 }),
      momentType: makeMomentType('goal'),
      matchEvents: [], // no events
      fixture: makeFixture(),
    };
    const result = scorePrediction(input);
    expect(result.captainMultiplier).toBe(CAPTAIN_MULTIPLIER);
    expect(result.totalPoints).toBe(0);
  });

  it('streakBonus is always 0 from the scoring engine', () => {
    const input: ScoringInput = {
      prediction: makePrediction(),
      gameWeekMoment: makeMoment(),
      momentType: makeMomentType('goal'),
      matchEvents: [makeMatchEvent({ matchId: 10, eventType: 'goal' })],
      fixture: makeFixture(),
    };
    const result = scorePrediction(input);
    expect(result.streakBonus).toBe(0);
  });
});

// ─── Timing Window Boundaries ─────────────────────────────────────────────────

describe('Timing window boundaries', () => {
  it('±5 window: minute within 5 awards TIMING_WINDOW_5_BONUS', () => {
    const input: ScoringInput = {
      prediction: makePrediction({ predictedMinute: 30, confidenceWindow: 5 }),
      gameWeekMoment: makeMoment({ basePoints: 40 }),
      momentType: makeMomentType('goal'),
      matchEvents: [makeMatchEvent({ matchId: 10, eventType: 'goal', minute: 34 })], // diff=4
      fixture: makeFixture(),
    };
    const result = scorePrediction(input);
    expect(result.timingBonus).toBe(TIMING_WINDOW_5_BONUS);
  });

  it('±5 window: minute at 6 outside window → no bonus', () => {
    const input: ScoringInput = {
      prediction: makePrediction({ predictedMinute: 30, confidenceWindow: 5 }),
      gameWeekMoment: makeMoment({ basePoints: 40 }),
      momentType: makeMomentType('goal'),
      matchEvents: [makeMatchEvent({ matchId: 10, eventType: 'goal', minute: 36 })], // diff=6 > 5
      fixture: makeFixture(),
    };
    const result = scorePrediction(input);
    expect(result.timingBonus).toBe(0);
  });

  it('±10 window: minute within 5 awards TIMING_WINDOW_5_BONUS (nearest qualifying)', () => {
    const input: ScoringInput = {
      prediction: makePrediction({ predictedMinute: 30, confidenceWindow: 10 }),
      gameWeekMoment: makeMoment({ basePoints: 40 }),
      momentType: makeMomentType('goal'),
      matchEvents: [makeMatchEvent({ matchId: 10, eventType: 'goal', minute: 33 })], // diff=3 ≤ 5
      fixture: makeFixture(),
    };
    const result = scorePrediction(input);
    expect(result.timingBonus).toBe(TIMING_WINDOW_5_BONUS);
  });

  it('±10 window: minute between 6 and 10 awards TIMING_WINDOW_10_BONUS', () => {
    const input: ScoringInput = {
      prediction: makePrediction({ predictedMinute: 30, confidenceWindow: 10 }),
      gameWeekMoment: makeMoment({ basePoints: 40 }),
      momentType: makeMomentType('goal'),
      matchEvents: [makeMatchEvent({ matchId: 10, eventType: 'goal', minute: 38 })], // diff=8 → 5<8≤10
      fixture: makeFixture(),
    };
    const result = scorePrediction(input);
    expect(result.timingBonus).toBe(TIMING_WINDOW_10_BONUS);
  });

  it('±10 window: minute at 11 outside window → no bonus', () => {
    const input: ScoringInput = {
      prediction: makePrediction({ predictedMinute: 30, confidenceWindow: 10 }),
      gameWeekMoment: makeMoment({ basePoints: 40 }),
      momentType: makeMomentType('goal'),
      matchEvents: [makeMatchEvent({ matchId: 10, eventType: 'goal', minute: 41 })], // diff=11 > 10
      fixture: makeFixture(),
    };
    const result = scorePrediction(input);
    expect(result.timingBonus).toBe(0);
  });

  it('±15 window: minute between 11 and 15 awards TIMING_WINDOW_15_BONUS (intentionally 0)', () => {
    const input: ScoringInput = {
      prediction: makePrediction({ predictedMinute: 30, confidenceWindow: 15 }),
      gameWeekMoment: makeMoment({ basePoints: 40 }),
      momentType: makeMomentType('goal'),
      matchEvents: [makeMatchEvent({ matchId: 10, eventType: 'goal', minute: 43 })], // diff=13 → 10<13≤15
      fixture: makeFixture(),
    };
    const result = scorePrediction(input);
    expect(result.timingBonus).toBe(TIMING_WINDOW_15_BONUS); // 0 — intentional
    expect(result.eventPoints).toBe(40); // still gets base points
    expect(result.isCorrect).toBe(true);
  });

  it('±15 window: minute at 16 outside window → no bonus and event points only', () => {
    const input: ScoringInput = {
      prediction: makePrediction({ predictedMinute: 30, confidenceWindow: 15 }),
      gameWeekMoment: makeMoment({ basePoints: 40 }),
      momentType: makeMomentType('goal'),
      matchEvents: [makeMatchEvent({ matchId: 10, eventType: 'goal', minute: 46 })], // diff=16 > 15
      fixture: makeFixture(),
    };
    const result = scorePrediction(input);
    expect(result.timingBonus).toBe(0);
    expect(result.eventPoints).toBe(40);
  });
});
