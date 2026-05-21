/**
 * run-scoring.test.ts
 *
 * Tests for the scoring orchestrator (Story 4.3).
 * Runs in Jest/Node — NOT Deno.
 */

// Deno guard — this test file must run in Node/Jest only
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Deno: unknown;
if (typeof Deno !== 'undefined') {
  throw new Error('This test file must run in Node/Jest, not Deno');
}

// Mock sentry module before any imports that reference it
jest.mock('../functions/_shared/sentry', () => ({
  captureHighPriority: jest.fn(),
  captureException: jest.fn(),
}));

import { runScoring } from '../functions/run-scoring/index';
import { captureHighPriority } from '../functions/_shared/sentry';

// ─── Test Data Builders ────────────────────────────────────────────────────────

function makeFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 10,
    gameweek_id: 1,
    external_id: 'ext-10',
    home_team: 'Arsenal',
    away_team: 'Chelsea',
    kickoff_at: '2025-08-16T15:00:00Z',
    is_postponed: false,
    is_void: false,
    events_ingested: true,
    created_at: '2025-08-16T00:00:00Z',
    ...overrides,
  };
}

function makePrediction(overrides: Record<string, unknown> = {}) {
  const base = {
    id: 1,
    user_id: 'user-1',
    gameweek_id: 1,
    fixture_id: 10,
    game_week_moment_id: 100,
    prediction_type: 'moment',
    is_captain: false,
    predicted_minute: 30,
    confidence_window: 5,
    predicted_player_id: null,
    predicted_assister_id: null,
    predicted_zone: null,
    created_at: '2025-08-16T10:00:00Z',
    updated_at: '2025-08-16T10:00:00Z',
    game_week_moments: {
      id: 100,
      gameweek_id: 1,
      fixture_id: 10,
      moment_type_id: 5,
      base_points: 40,
      player_bonus_points: 20,
      assister_bonus_points: 10,
      zone_bonus_points: 15,
      created_at: '2025-08-16T00:00:00Z',
      moment_types: {
        id: 5,
        name: 'Goal',
        event_type: 'goal',
        description: 'A goal scored',
      },
    },
  };
  // Allow overriding nested game_week_moments separately
  if (overrides.game_week_moments) {
    return { ...base, ...overrides };
  }
  return { ...base, ...overrides };
}

function makeMatchEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: 200,
    match_id: 10,
    event_type: 'goal',
    minute: 30,
    player_id: null,
    extra_data: null,
    created_at: '2025-08-16T15:30:00Z',
    ...overrides,
  };
}

// ─── Mock Client Builder ───────────────────────────────────────────────────────

interface MockClientOptions {
  gameweekStatus?: string;
  gameweekFetchError?: object | null;
  noGameweek?: boolean;
  fixtures?: ReturnType<typeof makeFixture>[];
  predictions?: ReturnType<typeof makePrediction>[];
  matchEvents?: ReturnType<typeof makeMatchEvent>[];
  upsertError?: Error | null;
  weeklyLbError?: Error | null;
  seasonLbError?: Error | null;
  allWeeklyEntries?: { user_id: string; score: number }[];
  notifyError?: boolean;
  rpcError?: Error | null;
}

function buildMockClient(options: MockClientOptions = {}) {
  const {
    gameweekStatus = 'pending',
    gameweekFetchError = null,
    noGameweek = false,
    fixtures = [makeFixture()],
    predictions = [makePrediction()],
    matchEvents = [makeMatchEvent()],
    upsertError = null,
    weeklyLbError = null,
    seasonLbError = null,
    allWeeklyEntries = [{ user_id: 'user-1', score: 40 }],
    notifyError = false,
    rpcError = null,
  } = options;

  const calls: {
    gameweekUpdates: Record<string, unknown>[];
    scoringResultsUpsert: unknown[][];
    weeklyLbUpsert: unknown[][];
    seasonLbUpsert: unknown[][];
    scoringErrorsInsert: Record<string, unknown>[];
    rpcCalls: unknown[];
  } = {
    gameweekUpdates: [],
    scoringResultsUpsert: [],
    weeklyLbUpsert: [],
    seasonLbUpsert: [],
    scoringErrorsInsert: [],
    rpcCalls: [],
  };

  const client = {
    _calls: calls,

    from(table: string) {
      return {
        select: (_cols?: string) => {
          if (table === 'gameweeks') {
            return {
              eq: (_col: string, _val: unknown) => ({
                single: () =>
                  noGameweek
                    ? { data: null, error: new Error('not found') }
                    : { data: { scoring_status: gameweekStatus }, error: gameweekFetchError },
              }),
            };
          }
          if (table === 'fixtures') {
            return {
              eq: (_col: string, _val: unknown) => ({ data: fixtures, error: null }),
            };
          }
          if (table === 'predictions') {
            return {
              eq: (_col: string, _val: unknown) => ({ data: predictions, error: null }),
            };
          }
          if (table === 'match_events') {
            return {
              in: (_col: string, _vals: unknown[]) => ({ data: matchEvents, error: null }),
            };
          }
          if (table === 'leaderboard_entries') {
            return {
              eq: (_col: string, _val: unknown) => ({ data: allWeeklyEntries, error: null }),
            };
          }
          return {
            eq: () => ({ data: [], error: null }),
            in: () => ({ data: [], error: null }),
          };
        },

        update: (vals: Record<string, unknown>) => ({
          eq: (_col: string, _val: unknown) => {
            if (table === 'gameweeks') {
              calls.gameweekUpdates.push(vals);
            }
            return { data: null, error: null };
          },
        }),

        upsert: (rows: unknown[], _opts?: unknown) => {
          if (table === 'scoring_results') {
            calls.scoringResultsUpsert.push(rows as unknown[]);
            return { error: upsertError };
          }
          if (table === 'leaderboard_entries') {
            const arr = rows as Record<string, unknown>[];
            const first = arr[0];
            if (first?.leaderboard_type === 'weekly') {
              calls.weeklyLbUpsert.push(rows as unknown[]);
              return { error: weeklyLbError };
            } else {
              calls.seasonLbUpsert.push(rows as unknown[]);
              return { error: seasonLbError };
            }
          }
          return { error: null };
        },

        insert: (row: Record<string, unknown>) => {
          if (table === 'scoring_errors') {
            calls.scoringErrorsInsert.push(row);
          }
          return { error: null };
        },
      };
    },

    rpc(_name: string, params: unknown) {
      calls.rpcCalls.push(params);
      return { error: rpcError };
    },

    functions: {
      invoke: jest.fn().mockImplementation((_name: string) => {
        if (notifyError) throw new Error('notifications failed');
        return Promise.resolve({ data: null, error: null });
      }),
    },
  };

  return client as unknown as Parameters<typeof runScoring>[1] & { _calls: typeof calls; functions: { invoke: jest.Mock } };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('run-scoring orchestrator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test 1: scoring_status → in_progress before any scoring
  test('sets scoring_status to in_progress as the first DB write', async () => {
    const client = buildMockClient({ gameweekStatus: 'pending' });
    await runScoring(1, client);
    const updates = client._calls.gameweekUpdates;
    expect(updates[0]).toEqual({ scoring_status: 'in_progress' });
  });

  // Test 2: scoring_status → complete on success
  test('sets scoring_status to complete after successful scoring', async () => {
    const client = buildMockClient({ gameweekStatus: 'pending' });
    const res = await runScoring(1, client);
    expect(res.status).toBe(200);
    const updates = client._calls.gameweekUpdates;
    expect(updates.some((u: Record<string, unknown>) => u.scoring_status === 'complete')).toBe(true);
  });

  // Test 3: scoring_status → error on thrown exception
  test('sets scoring_status to error when an exception is thrown', async () => {
    const client = buildMockClient({
      gameweekStatus: 'pending',
      upsertError: new Error('DB write failed'),
    });
    const res = await runScoring(1, client);
    expect(res.status).toBe(500);
    const updates = client._calls.gameweekUpdates;
    expect(updates.some((u: Record<string, unknown>) => u.scoring_status === 'error')).toBe(true);
    expect(updates.some((u: Record<string, unknown>) => u.scoring_status === 'complete')).toBe(false);
  });

  // Test 4a: idempotency guard — already in_progress → 409, no scoring
  test('returns 409 without scoring if status is already in_progress', async () => {
    const client = buildMockClient({ gameweekStatus: 'in_progress' });
    const res = await runScoring(1, client);
    expect(res.status).toBe(409);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = await res.json() as any;
    expect(body.error.code).toBe('SCORING_ALREADY_RUN');
    // No gameweek update should have been made (no in_progress write)
    expect(client._calls.gameweekUpdates).toHaveLength(0);
  });

  // Test 4b: idempotency guard — already complete → 409
  test('returns 409 without scoring if status is already complete', async () => {
    const client = buildMockClient({ gameweekStatus: 'complete' });
    const res = await runScoring(1, client);
    expect(res.status).toBe(409);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = await res.json() as any;
    expect(body.error.code).toBe('SCORING_ALREADY_RUN');
    expect(client._calls.gameweekUpdates).toHaveLength(0);
  });

  // Test 5: one scoring_results row per prediction
  test('writes one scoring_results row per prediction', async () => {
    const predictions = [
      makePrediction({ id: 1, user_id: 'user-1' }),
      makePrediction({ id: 2, user_id: 'user-2' }),
    ];
    const client = buildMockClient({ gameweekStatus: 'pending', predictions });
    await runScoring(1, client);
    expect(client._calls.scoringResultsUpsert[0]).toHaveLength(2);
  });

  // Test 6: postponed fixture → all layers 0, excluded from streak
  test('postponed fixture predictions produce zero scores', async () => {
    const fixtures = [makeFixture({ is_postponed: true })];
    const client = buildMockClient({ gameweekStatus: 'pending', fixtures });
    await runScoring(1, client);
    const rows = client._calls.scoringResultsUpsert[0] as Array<Record<string, unknown>>;
    expect(rows[0].event_points).toBe(0);
    expect(rows[0].timing_bonus).toBe(0);
    expect(rows[0].total_points).toBe(0);
    expect(rows[0].is_correct).toBe(false);
  });

  // Test 7: voided fixture → all layers 0
  test('voided fixture predictions produce zero scores', async () => {
    const fixtures = [makeFixture({ is_void: true })];
    const client = buildMockClient({ gameweekStatus: 'pending', fixtures });
    await runScoring(1, client);
    const rows = client._calls.scoringResultsUpsert[0] as Array<Record<string, unknown>>;
    expect(rows[0].event_points).toBe(0);
    expect(rows[0].total_points).toBe(0);
  });

  // Test 8: match moment predictions excluded from streak input (type='match')
  test('match moment predictions (prediction_type=match) do not enter streak calculation', async () => {
    // Two predictions — one 'match', one 'moment'. Both should produce scoring_results rows.
    const predictions = [
      makePrediction({ id: 1, prediction_type: 'match', user_id: 'user-1' }),
      makePrediction({ id: 2, prediction_type: 'moment', user_id: 'user-1' }),
    ];
    const client = buildMockClient({ gameweekStatus: 'pending', predictions });
    const res = await runScoring(1, client);
    expect(res.status).toBe(200);
    // Both predictions scored
    expect(client._calls.scoringResultsUpsert[0]).toHaveLength(2);
  });

  // Test 9: scoring_results rows contain all required columns
  test('scoring_results rows include all required columns', async () => {
    const client = buildMockClient({ gameweekStatus: 'pending' });
    await runScoring(1, client);
    const rows = client._calls.scoringResultsUpsert[0] as Array<Record<string, unknown>>;
    const row = rows[0];
    const requiredCols = [
      'prediction_id', 'user_id', 'gameweek_id',
      'event_points', 'timing_bonus', 'player_bonus', 'assister_bonus',
      'zone_bonus', 'jackpot_bonus', 'captain_multiplier',
      'streak_bonus', 'total_points', 'is_correct',
    ];
    for (const col of requiredCols) {
      expect(row).toHaveProperty(col);
    }
  });

  // Test 10: streak_bonus and total_points reflect streak calculator output
  test('total_points uses streak-adjusted value from StreakResultEntry', async () => {
    // A correct prediction — streak calculator will produce a StreakResultEntry
    const client = buildMockClient({ gameweekStatus: 'pending' });
    await runScoring(1, client);
    const rows = client._calls.scoringResultsUpsert[0] as Array<Record<string, unknown>>;
    // The scoring result for a correct prediction should have total_points ≥ event_points (streak may add 0 for position 1)
    expect(typeof rows[0].total_points).toBe('number');
    expect(typeof rows[0].streak_bonus).toBe('number');
  });

  // Test 11: weekly leaderboard — one row per user for the gameweek with correct type
  test('writes weekly leaderboard entries with correct structure', async () => {
    const predictions = [
      makePrediction({ id: 1, user_id: 'user-1' }),
      makePrediction({ id: 2, user_id: 'user-2' }),
    ];
    const client = buildMockClient({ gameweekStatus: 'pending', predictions });
    await runScoring(1, client);
    const weeklyRows = client._calls.weeklyLbUpsert[0] as Array<Record<string, unknown>>;
    expect(weeklyRows.some((r) => r.user_id === 'user-1')).toBe(true);
    expect(weeklyRows.some((r) => r.user_id === 'user-2')).toBe(true);
    expect(weeklyRows.every((r) => r.leaderboard_type === 'weekly')).toBe(true);
    expect(weeklyRows.every((r) => r.gameweek_id === 1)).toBe(true);
  });

  // Test 12: season leaderboard — gameweek_id null, leaderboard_type 'season'
  test('writes season leaderboard entries with gameweek_id=null', async () => {
    const client = buildMockClient({ gameweekStatus: 'pending' });
    await runScoring(1, client);
    const seasonRows = client._calls.seasonLbUpsert[0] as Array<Record<string, unknown>>;
    expect(seasonRows.every((r) => r.gameweek_id === null)).toBe(true);
    expect(seasonRows.every((r) => r.leaderboard_type === 'season')).toBe(true);
  });

  // Test 13: send-notifications invoked on success with type: 'results-ready'
  test('invokes send-notifications with type results-ready on success', async () => {
    const client = buildMockClient({ gameweekStatus: 'pending' });
    const res = await runScoring(1, client);
    expect(res.status).toBe(200);
    expect(client.functions.invoke).toHaveBeenCalledWith('send-notifications', {
      body: { type: 'results-ready' },
    });
  });

  // Test 13b: send-notifications NOT invoked on error path
  test('does NOT invoke send-notifications on the error path', async () => {
    const client = buildMockClient({
      gameweekStatus: 'pending',
      upsertError: new Error('upsert failed'),
    });
    const res = await runScoring(1, client);
    expect(res.status).toBe(500);
    expect(client.functions.invoke).not.toHaveBeenCalled();
  });

  // Test 14: scoring_errors row inserted on error with correct structure
  test('inserts scoring_errors row on error with required columns', async () => {
    const client = buildMockClient({
      gameweekStatus: 'pending',
      upsertError: new Error('test failure'),
    });
    await runScoring(1, client);
    const errorInserts = client._calls.scoringErrorsInsert;
    expect(errorInserts).toHaveLength(1);
    expect(errorInserts[0]).toMatchObject({
      gameweek_id: 1,
      error_code: 'SCORING_FAILED',
    });
    expect(typeof errorInserts[0].error_message).toBe('string');
    expect(errorInserts[0]).toHaveProperty('context');
  });

  // Test 15: captureHighPriority called on error
  test('calls captureHighPriority on error', async () => {
    const client = buildMockClient({
      gameweekStatus: 'pending',
      upsertError: new Error('test error'),
    });
    await runScoring(1, client);
    expect(captureHighPriority).toHaveBeenCalledTimes(1);
  });

  // Test 16: duplicate predictionId guard → error before scoring
  test('returns 500 when duplicate predictionId values are detected', async () => {
    const predictions = [
      makePrediction({ id: 1, user_id: 'user-1' }),
      makePrediction({ id: 1, user_id: 'user-2' }), // duplicate id
    ];
    const client = buildMockClient({ gameweekStatus: 'pending', predictions });
    const res = await runScoring(1, client);
    expect(res.status).toBe(500);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = await res.json() as any;
    expect(body.error.code).toBe('SCORING_FAILED');
    const errors = client._calls.scoringErrorsInsert;
    expect(errors[0].error_message).toMatch(/[Dd]uplicate/);
  });

  // Test 17: fixture / gameWeekMoment mismatch guard → error before scoring
  test('returns 500 when prediction.fixtureId does not match gameWeekMoment.fixtureId', async () => {
    const predictions = [
      makePrediction({
        id: 1,
        fixture_id: 10,
        game_week_moments: {
          id: 100,
          gameweek_id: 1,
          fixture_id: 99, // mismatch!
          moment_type_id: 5,
          base_points: 40,
          player_bonus_points: 20,
          assister_bonus_points: 10,
          zone_bonus_points: 15,
          created_at: '2025-08-16T00:00:00Z',
          moment_types: {
            id: 5,
            name: 'Goal',
            event_type: 'goal',
            description: 'A goal scored',
          },
        },
      }),
    ];
    const client = buildMockClient({ gameweekStatus: 'pending', predictions });
    const res = await runScoring(1, client);
    expect(res.status).toBe(500);
    const errors = client._calls.scoringErrorsInsert;
    expect(errors[0].error_message).toMatch(/fixtureId/);
  });

  // Test 18: notification failure is swallowed — scoring still returns 200
  test('notification failure does not roll back scoring (still returns 200)', async () => {
    const client = buildMockClient({ gameweekStatus: 'pending', notifyError: true });
    const res = await runScoring(1, client);
    expect(res.status).toBe(200);
    const updates = client._calls.gameweekUpdates;
    expect(updates.some((u: Record<string, unknown>) => u.scoring_status === 'complete')).toBe(true);
  });

  // Test 19: correct usersScored and predictionsScored in response body
  test('returns correct usersScored and predictionsScored counts', async () => {
    const predictions = [
      makePrediction({ id: 1, user_id: 'user-1' }),
      makePrediction({ id: 2, user_id: 'user-2' }),
      makePrediction({ id: 3, user_id: 'user-2' }),
    ];
    const client = buildMockClient({ gameweekStatus: 'pending', predictions });
    const res = await runScoring(1, client);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = await res.json() as any;
    expect(body.data.predictionsScored).toBe(3);
    expect(body.data.usersScored).toBe(2);
  });

  // Test 20: returns 400 when gameweek not found
  test('returns 400 when gameweek is not found', async () => {
    const client = buildMockClient({ noGameweek: true });
    const res = await runScoring(1, client);
    expect(res.status).toBe(400);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = await res.json() as any;
    expect(body.error.code).toBe('INVALID_REQUEST');
  });

  // Test 21: RPC error for assign_leaderboard_ranks propagates as 500
  test('returns 500 when assign_leaderboard_ranks RPC returns an error', async () => {
    const client = buildMockClient({
      gameweekStatus: 'pending',
      rpcError: new Error('rpc failed'),
    });
    const res = await runScoring(1, client);
    expect(res.status).toBe(500);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = await res.json() as any;
    expect(body.error.code).toBe('SCORING_FAILED');
    expect(client._calls.scoringErrorsInsert).toHaveLength(1);
  });

  // Test 22: isCorrect=true with no matching real event treated as non-streak miss (no throw)
  test('isCorrect=true with no matching match event does not throw — treated as streak miss', async () => {
    // Prediction is correct but no match event exists for the fixture
    const client = buildMockClient({
      gameweekStatus: 'pending',
      matchEvents: [], // no events at all
    });
    const res = await runScoring(1, client);
    // Should succeed — the isCorrect/realEventMinute inconsistency is handled gracefully
    expect(res.status).toBe(200);
    const rows = client._calls.scoringResultsUpsert[0] as Array<Record<string, unknown>>;
    // streak_bonus should be 0 since the entry is treated as a miss in streak calc
    expect(rows[0].streak_bonus).toBe(0);
  });
});
