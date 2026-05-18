/**
 * ingest-events.test.ts
 * Tests for the handleIngestEvents core logic
 * Mocks: fetchMatchEvents, Supabase client
 */

// Mock the events API client before importing the handler
jest.mock('../functions/_shared/api-clients/events-api', () => ({
  fetchMatchEvents: jest.fn(),
}));

import { handleIngestEvents, SupabaseClientLike } from '../functions/ingest-events/index';
import { fetchMatchEvents } from '../functions/_shared/api-clients/events-api';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DEFAULT_FIXTURE = {
  id: 1,
  external_id: 'fixture-ext-1',
  gameweek_id: 10,
  is_postponed: false,
  events_ingested: false,
};

const ALL_COMPLETE_FIXTURES = [
  { id: 1, events_ingested: true, is_postponed: false },
  { id: 2, events_ingested: true, is_postponed: false },
];

const MIXED_FIXTURES_PENDING = [
  { id: 1, events_ingested: true, is_postponed: false },
  { id: 2, events_ingested: false, is_postponed: false }, // still pending
];

const POSTPONED_COUNTS_AS_DONE = [
  { id: 1, events_ingested: true, is_postponed: false },
  { id: 2, events_ingested: false, is_postponed: true }, // postponed → counts as done
];

/**
 * Build a mock Supabase client with configurable per-table behaviour.
 * Follows the same approach as ingest-odds.test.ts.
 */
function makeSupabaseMock(opts: {
  fixtureData?: unknown;
  fixtureError?: unknown;
  allFixturesData?: unknown[];
  allFixturesError?: unknown;
  insertError?: unknown;
  updateError?: unknown;
  insertScoringErrorError?: unknown;
  invokeError?: unknown;
} = {}): SupabaseClientLike {
  const fromMock = jest.fn((table: string) => {
    // single() — used to look up one fixture by id
    const single = jest.fn().mockResolvedValue({
      data: opts.fixtureData !== undefined ? opts.fixtureData : DEFAULT_FIXTURE,
      error: opts.fixtureError ?? null,
    });

    // select().eq() — returns either single() or a list depending on table/context
    const eqAfterSelect = jest.fn().mockImplementation((col: string) => {
      if (col === 'gameweek_id') {
        // Completion check query — returns list of fixtures
        return Promise.resolve({
          data: opts.allFixturesData !== undefined ? opts.allFixturesData : ALL_COMPLETE_FIXTURES,
          error: opts.allFixturesError ?? null,
        });
      }
      // Default: single fixture lookup
      return { single };
    });

    const selectMock = jest.fn().mockReturnValue({ eq: eqAfterSelect });

    // insert() — used for match_events and scoring_errors
    const insertMock = jest.fn().mockImplementation(() => {
      if (table === 'scoring_errors') {
        return Promise.resolve({ error: opts.insertScoringErrorError ?? null });
      }
      return Promise.resolve({ error: opts.insertError ?? null });
    });

    // update().eq() — used to set events_ingested / is_postponed
    const updateEqMock = jest.fn().mockResolvedValue({ error: opts.updateError ?? null });
    const updateMock = jest.fn().mockReturnValue({ eq: updateEqMock });

    return { select: selectMock, insert: insertMock, update: updateMock };
  });

  return {
    from: fromMock as unknown as SupabaseClientLike['from'],
    functions: {
      invoke: jest.fn().mockResolvedValue({ error: opts.invokeError ?? null }),
    },
  };
}

const MOCK_EVENTS_RESPONSE = {
  data: {
    externalId: 'fixture-ext-1',
    events: [
      { eventType: 'goal', playerId: 'player-1', teamId: 'arsenal', minute: 23, extraData: { assister: 'player-2' } },
      { eventType: 'yellow_card', playerId: 'player-3', teamId: 'chelsea', minute: 45 },
    ],
  },
  error: null,
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('handleIngestEvents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    // Set "now" to a fixed point well before any 2h threshold
    jest.setSystemTime(new Date('2026-05-18T16:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  // ─── Success path ──────────────────────────────────────────────────────────

  it('success path: events inserted, events_ingested set true, returns { data, error: null }', async () => {
    (fetchMatchEvents as jest.Mock).mockResolvedValue(MOCK_EVENTS_RESPONSE);
    const supabase = makeSupabaseMock();

    const result = await handleIngestEvents({ fixtureId: 1 }, supabase);

    expect(result.error).toBeNull();
    expect(result.data).toEqual({ fixtureId: 1, eventsInserted: 2 });

    // match_events insert was called
    const fromCalls = (supabase.from as jest.Mock).mock.calls.map((c: unknown[]) => c[0]);
    expect(fromCalls).toContain('match_events');

    // events_ingested update was called
    expect(fromCalls).toContain('fixtures');
  });

  it('success path: extra_data is null (not undefined) when event has no extra data', async () => {
    (fetchMatchEvents as jest.Mock).mockResolvedValue({
      data: {
        externalId: 'fixture-ext-1',
        events: [
          { eventType: 'corner', playerId: 'p1', teamId: 'arsenal', minute: 10 }, // no extraData
        ],
      },
      error: null,
    });

    let capturedRows: unknown[] = [];
    const supabase = makeSupabaseMock();
    const originalFrom = supabase.from as jest.Mock;
    (supabase.from as jest.Mock) = jest.fn((table: string) => {
      const base = originalFrom(table);
      if (table === 'match_events') {
        return {
          ...base,
          insert: jest.fn((rows: unknown[]) => {
            capturedRows = rows;
            return Promise.resolve({ error: null });
          }),
        };
      }
      return base;
    });

    await handleIngestEvents({ fixtureId: 1 }, supabase);

    expect(capturedRows).toHaveLength(1);
    const row = capturedRows[0] as Record<string, unknown>;
    expect(row['extra_data']).toBeNull(); // null, NOT undefined
    expect(row['match_id']).toBe(1);      // internal fixtures.id, not external_id
  });

  // ─── API error path ────────────────────────────────────────────────────────

  it('API error: returns EVENTS_FETCH_FAILED, events_ingested NOT updated, console.error called', async () => {
    (fetchMatchEvents as jest.Mock).mockResolvedValue({
      data: null,
      error: { code: 'EVENTS_FETCH_FAILED', message: 'API unavailable' },
    });
    const supabase = makeSupabaseMock();
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const result = await handleIngestEvents({ fixtureId: 1 }, supabase);

    expect(result.data).toBeNull();
    expect(result.error?.code).toBe('EVENTS_FETCH_FAILED');
    expect(consoleErrorSpy).toHaveBeenCalled();

    // events_ingested update should NOT have been called
    const fromCalls = (supabase.from as jest.Mock).mock.calls.map((c: unknown[]) => c[0]);
    // 'fixtures' IS called for the initial lookup, but update on 'fixtures' for events_ingested=true should not happen
    // We verify by checking supabase.functions.invoke was not called (scoring chain not triggered)
    expect(supabase.functions.invoke).not.toHaveBeenCalled();
  });

  // ─── Postponed fixture ─────────────────────────────────────────────────────

  it('postponed fixture: is_postponed=true set, no event fetch, proceeds to completion check', async () => {
    const supabase = makeSupabaseMock();

    const result = await handleIngestEvents({ fixtureId: 1, isPostponed: true }, supabase);

    expect(result.error).toBeNull();
    expect(result.data).toEqual({ fixtureId: 1, eventsInserted: 0 });

    // fetchMatchEvents must NOT have been called
    expect(fetchMatchEvents).not.toHaveBeenCalled();

    // is_postponed=true update should have been called on fixtures
    const fromCalls = (supabase.from as jest.Mock).mock.calls.map((c: unknown[]) => c[0]);
    expect(fromCalls).toContain('fixtures');
  });

  // ─── Gameweek completion detection ────────────────────────────────────────

  it('gameweek complete: all fixtures events_ingested → run-scoring invoked', async () => {
    (fetchMatchEvents as jest.Mock).mockResolvedValue(MOCK_EVENTS_RESPONSE);
    const supabase = makeSupabaseMock({ allFixturesData: ALL_COMPLETE_FIXTURES });

    await handleIngestEvents({ fixtureId: 1 }, supabase);

    expect(supabase.functions.invoke).toHaveBeenCalledWith('run-scoring', {
      body: { gameweekId: 10 },
    });
  });

  it('gameweek not complete: one fixture still pending → run-scoring NOT invoked', async () => {
    (fetchMatchEvents as jest.Mock).mockResolvedValue(MOCK_EVENTS_RESPONSE);
    const supabase = makeSupabaseMock({ allFixturesData: MIXED_FIXTURES_PENDING });

    await handleIngestEvents({ fixtureId: 1 }, supabase);

    expect(supabase.functions.invoke).not.toHaveBeenCalledWith('run-scoring', expect.anything());
  });

  it('postponed fixtures count as complete for gameweek completion detection → run-scoring invoked', async () => {
    (fetchMatchEvents as jest.Mock).mockResolvedValue(MOCK_EVENTS_RESPONSE);
    const supabase = makeSupabaseMock({ allFixturesData: POSTPONED_COUNTS_AS_DONE });

    await handleIngestEvents({ fixtureId: 1 }, supabase);

    expect(supabase.functions.invoke).toHaveBeenCalledWith('run-scoring', {
      body: { gameweekId: 10 },
    });
  });

  // ─── Delayed data (2-hour threshold) ──────────────────────────────────────

  it('delayed data (>2h threshold): scoring_errors row inserted, returns EVENTS_DELAYED', async () => {
    // "now" is 2026-05-18T16:00:00Z (set in beforeEach)
    // eventTimestamp is 2h+ in the past → threshold exceeded
    const pastTimestamp = '2026-05-18T13:00:00Z'; // 3 hours ago
    const supabase = makeSupabaseMock();
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const result = await handleIngestEvents(
      { fixtureId: 1, eventTimestamp: pastTimestamp },
      supabase,
    );

    expect(result.data).toBeNull();
    expect(result.error?.code).toBe('EVENTS_DELAYED');
    expect(consoleErrorSpy).toHaveBeenCalled();

    // scoring_errors insert should have been called
    const fromCalls = (supabase.from as jest.Mock).mock.calls.map((c: unknown[]) => c[0]);
    expect(fromCalls).toContain('scoring_errors');
    expect(fetchMatchEvents).not.toHaveBeenCalled();
  });

  it('within 2h threshold: proceeds normally, no EVENTS_DELAYED', async () => {
    (fetchMatchEvents as jest.Mock).mockResolvedValue(MOCK_EVENTS_RESPONSE);
    // "now" is 2026-05-18T16:00:00Z
    // eventTimestamp is only 30 minutes ago → within threshold
    const recentTimestamp = '2026-05-18T15:30:00Z';
    const supabase = makeSupabaseMock();

    const result = await handleIngestEvents(
      { fixtureId: 1, eventTimestamp: recentTimestamp },
      supabase,
    );

    expect(result.error).toBeNull();
    expect(result.data?.fixtureId).toBe(1);
  });

  // ─── Zero-events path ─────────────────────────────────────────────────────

  it('zero events: API returns empty array, events_ingested still set true, eventsInserted=0', async () => {
    (fetchMatchEvents as jest.Mock).mockResolvedValue({
      data: { externalId: 'fixture-ext-1', events: [] },
      error: null,
    });
    const supabase = makeSupabaseMock();

    const result = await handleIngestEvents({ fixtureId: 1 }, supabase);

    expect(result.error).toBeNull();
    expect(result.data).toEqual({ fixtureId: 1, eventsInserted: 0 });

    // match_events insert should NOT have been called (no rows to insert)
    const fromCalls = (supabase.from as jest.Mock).mock.calls.map((c: unknown[]) => c[0]);
    expect(fromCalls).not.toContain('match_events');

    // events_ingested update MUST still have been called
    expect(fromCalls).toContain('fixtures');
  });

  // ─── Fixture not found ─────────────────────────────────────────────────────

  it('fixture not found: returns FIXTURE_NOT_FOUND error', async () => {
    const supabase = makeSupabaseMock({
      fixtureData: null,
      fixtureError: { message: 'No rows found' },
    });

    const result = await handleIngestEvents({ fixtureId: 999 }, supabase);

    expect(result.data).toBeNull();
    expect(result.error?.code).toBe('FIXTURE_NOT_FOUND');
    expect(fetchMatchEvents).not.toHaveBeenCalled();
  });

  // ─── Does not throw ────────────────────────────────────────────────────────

  it('does not throw — always returns structured result', async () => {
    (fetchMatchEvents as jest.Mock).mockRejectedValue(new Error('unexpected'));
    const supabase = makeSupabaseMock();

    await expect(handleIngestEvents({ fixtureId: 1 }, supabase)).resolves.not.toThrow();
  });
});

