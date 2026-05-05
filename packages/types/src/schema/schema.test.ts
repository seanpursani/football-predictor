import {
  users,
  gameweeks,
  fixtures,
  momentTypes,
  gameWeekMoments,
  predictions,
  matchEvents,
  scoringResults,
  leaderboardEntries,
  miniLeagues,
  leagueMemberships,
  scoringErrors,
  userGameweekStates,
} from './index';

import type {
  User,
  NewUser,
  Gameweek,
  NewGameweek,
  GameweekPhase,
  Fixture,
  NewFixture,
  MomentType,
  GameweekMoment,
  MomentCard,
  Prediction,
  NewPrediction,
  PrecisionPick,
  MatchEvent,
  NewMatchEvent,
  ScoringResult,
  NewScoringResult,
  LayerScore,
  LeaderboardEntry,
  NewLeaderboardEntry,
  MiniLeague,
  LeagueMembership,
  ScoringError,
  UserGameweekState,
  GameweekState,
  ConfidenceWindow,
  EventType,
  PredictionType,
} from '../index';

// Helper to assert types at compile time
type AssertEqual<T, U> = T extends U ? (U extends T ? true : false) : false;

describe('Schema table exports', () => {
  it('exports all 13 schema tables', () => {
    expect(users).toBeDefined();
    expect(gameweeks).toBeDefined();
    expect(fixtures).toBeDefined();
    expect(momentTypes).toBeDefined();
    expect(gameWeekMoments).toBeDefined();
    expect(predictions).toBeDefined();
    expect(matchEvents).toBeDefined();
    expect(scoringResults).toBeDefined();
    expect(leaderboardEntries).toBeDefined();
    expect(miniLeagues).toBeDefined();
    expect(leagueMemberships).toBeDefined();
    expect(scoringErrors).toBeDefined();
    expect(userGameweekStates).toBeDefined();
  });
});

describe('Type exports resolve correctly', () => {
  it('all AC #4 types are importable', () => {
    // These are compile-time checks — if the file compiles, the types resolve
    const _prediction: Prediction | null = null;
    const _gameweekState: GameweekState | null = null;
    const _scoringResult: ScoringResult | null = null;
    const _momentCard: MomentCard | null = null;
    const _miniLeague: MiniLeague | null = null;
    const _leaderboardEntry: LeaderboardEntry | null = null;

    expect(true).toBe(true);
  });

  it('GameweekState is an alias for UserGameweekState', () => {
    const check: AssertEqual<GameweekState, UserGameweekState> = true;
    expect(check).toBe(true);
  });

  it('MomentCard is an alias for GameweekMoment', () => {
    const check: AssertEqual<MomentCard, GameweekMoment> = true;
    expect(check).toBe(true);
  });

  it('ConfidenceWindow is 5 | 10 | 15', () => {
    const valid: ConfidenceWindow[] = [5, 10, 15];
    expect(valid).toHaveLength(3);
  });

  it('EventType includes expected values', () => {
    const types: EventType[] = ['goal', 'substitution', 'corner', 'yellow_card', 'red_card', 'match_result'];
    expect(types).toHaveLength(6);
  });

  it('PredictionType includes match and moment', () => {
    const types: PredictionType[] = ['match', 'moment'];
    expect(types).toHaveLength(2);
  });

  it('GameweekPhase includes building, locked, completed', () => {
    const phases: GameweekPhase[] = ['building', 'locked', 'completed'];
    expect(phases).toHaveLength(3);
  });
});

describe('Schema column naming conventions', () => {
  it('users columns are camelCase in TypeScript', () => {
    // Drizzle auto-maps snake_case DB columns to camelCase TS keys
    const columnKeys = Object.keys(users);
    // Check that key schema identifiers use camelCase
    expect(columnKeys).toContain('displayName');
    expect(columnKeys).toContain('hasSeenOnboarding');
    expect(columnKeys).toContain('createdAt');
    expect(columnKeys).toContain('updatedAt');
    expect(columnKeys).toContain('authId');
    expect(columnKeys).toContain('pushToken');
  });

  it('gameweeks columns include scoringStatus', () => {
    const columnKeys = Object.keys(gameweeks);
    expect(columnKeys).toContain('scoringStatus');
    expect(columnKeys).toContain('gameweekNumber');
    expect(columnKeys).toContain('firstKickoff');
    expect(columnKeys).toContain('lastMatchEnd');
  });

  it('predictions columns are camelCase', () => {
    const columnKeys = Object.keys(predictions);
    expect(columnKeys).toContain('userId');
    expect(columnKeys).toContain('gameweekId');
    expect(columnKeys).toContain('fixtureId');
    expect(columnKeys).toContain('isCaptain');
    expect(columnKeys).toContain('predictedMinute');
    expect(columnKeys).toContain('confidenceWindow');
    expect(columnKeys).toContain('predictedPlayerId');
  });
});

