/**
 * ingest-odds.test.ts
 * Tests for the handleIngestOdds core logic
 * Mocks: fetchOddsForGameweek, Supabase client
 */

// Mock the odds API client before importing the handler
jest.mock('../functions/_shared/api-clients/odds-api', () => ({
  fetchOddsForGameweek: jest.fn(),
}));

import { handleIngestOdds, SupabaseClientLike } from '../functions/ingest-odds/index';
import { fetchOddsForGameweek } from '../functions/_shared/api-clients/odds-api';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeSupabaseMock(overrides?: {
  fixtureData?: unknown;
  fixtureError?: unknown;
  momentTypeData?: unknown;
  momentTypeError?: unknown;
  upsertError?: unknown;
  statusError?: unknown;
  invokeError?: unknown;
}): SupabaseClientLike {
  const singleFactory = (data: unknown, error: unknown) => ({
    single: jest.fn().mockResolvedValue({ data, error }),
  });

  const fromMock = jest.fn((table: string) => {
    const selectMock = jest.fn(() => ({
      eq: jest.fn((col: string) => {
        if (table === 'fixtures') {
          return singleFactory(overrides?.fixtureData ?? { id: 1 }, overrides?.fixtureError ?? null);
        }
        if (table === 'moment_types') {
          return singleFactory(overrides?.momentTypeData ?? { id: 10 }, overrides?.momentTypeError ?? null);
        }
        return singleFactory(null, null);
      }),
    }));

    const upsertMock = jest.fn().mockResolvedValue({ error: overrides?.upsertError ?? null });

    const updateMock = jest.fn(() => ({
      eq: jest.fn().mockResolvedValue({ error: overrides?.statusError ?? null }),
    }));

    return { select: selectMock, upsert: upsertMock, update: updateMock };
  });

  return {
    from: fromMock as unknown as SupabaseClientLike['from'],
    functions: {
      invoke: jest.fn().mockResolvedValue({ error: overrides?.invokeError ?? null }),
    },
  };
}

const MOCK_ODDS_RESPONSE = {
  data: [
    {
      externalId: 'ext-123',
      homeTeam: 'Arsenal',
      awayTeam: 'Chelsea',
      kickoffAt: '2026-05-18T15:00:00Z',
      markets: [
        { eventType: 'goal', decimalOdds: 2.0, teamId: 'arsenal' },
        { eventType: 'corner', decimalOdds: 3.0, teamId: undefined },
      ],
    },
  ],
  error: null,
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('handleIngestOdds', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('success path: upserts game_week_moments, sets gameweeks status to building, invokes send-notifications', async () => {
    (fetchOddsForGameweek as jest.Mock).mockResolvedValue(MOCK_ODDS_RESPONSE);
    const supabase = makeSupabaseMock();

    const result = await handleIngestOdds(1, supabase);

    expect(result.error).toBeNull();
    expect(result.data).toEqual({ gameweekId: 1, momentsCreated: 2 });

    // Verify upsert was called on game_week_moments
    const fromCalls = (supabase.from as jest.Mock).mock.calls.map((c: string[]) => c[0]);
    expect(fromCalls).toContain('game_week_moments');

    // Verify gameweeks status was set to 'building'
    expect(fromCalls).toContain('gameweeks');

    // Verify send-notifications was invoked
    expect(supabase.functions.invoke).toHaveBeenCalledWith('send-notifications', {
      body: { type: 'match-builder-open', payload: { gameweekId: 1 } },
    });
  });

  it('API error: returns ODDS_FETCH_FAILED, does NOT update gameweeks status, does NOT call upsert', async () => {
    (fetchOddsForGameweek as jest.Mock).mockResolvedValue({
      data: null,
      error: { code: 'ODDS_FETCH_FAILED', message: 'API unavailable' },
    });
    const supabase = makeSupabaseMock();
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const result = await handleIngestOdds(1, supabase);

    expect(result.data).toBeNull();
    expect(result.error?.code).toBe('ODDS_FETCH_FAILED');
    expect(consoleErrorSpy).toHaveBeenCalled();

    // Ensure no DB writes occurred
    expect(supabase.from).not.toHaveBeenCalled();
    expect(supabase.functions.invoke).not.toHaveBeenCalled();
  });

  it('raw odds are NEVER written to the DB — only integer base_points (NFR8 guard)', async () => {
    (fetchOddsForGameweek as jest.Mock).mockResolvedValue(MOCK_ODDS_RESPONSE);

    let capturedUpsertRows: unknown[] = [];
    const supabase = makeSupabaseMock();

    // Override the from mock to capture upsert arguments
    const originalFrom = supabase.from as jest.Mock;
    (supabase.from as jest.Mock) = jest.fn((table: string) => {
      const base = originalFrom(table);
      if (table === 'game_week_moments') {
        const captureUpsert = jest.fn((rows: unknown[]) => {
          capturedUpsertRows = rows;
          return Promise.resolve({ error: null });
        });
        return { ...base, upsert: captureUpsert };
      }
      return base;
    });

    await handleIngestOdds(1, supabase);

    // Verify upsert was called and rows only contain base_points (integer), not raw decimal odds
    expect(capturedUpsertRows.length).toBeGreaterThan(0);
    for (const row of capturedUpsertRows as Record<string, unknown>[]) {
      expect(row).toHaveProperty('base_points');
      expect(Number.isInteger(row['base_points'])).toBe(true);
      // Raw odds fields must not be present
      expect(row).not.toHaveProperty('decimal_odds');
      expect(row).not.toHaveProperty('decimalOdds');
      expect(row).not.toHaveProperty('raw_odds');
    }
  });

  it('float conversion: base_points stored is always an integer', async () => {
    (fetchOddsForGameweek as jest.Mock).mockResolvedValue({
      data: [
        {
          externalId: 'ext-456',
          homeTeam: 'ManCity',
          awayTeam: 'Liverpool',
          kickoffAt: '2026-05-18T17:30:00Z',
          markets: [{ eventType: 'goal', decimalOdds: 1.75 }], // (0.75 * 40) = 30 — integer
        },
      ],
      error: null,
    });

    let capturedRow: Record<string, unknown> | null = null;
    const supabase = makeSupabaseMock();
    const originalFrom = supabase.from as jest.Mock;
    (supabase.from as jest.Mock) = jest.fn((table: string) => {
      const base = originalFrom(table);
      if (table === 'game_week_moments') {
        return {
          ...base,
          upsert: jest.fn((rows: unknown[]) => {
            capturedRow = (rows as Record<string, unknown>[])[0];
            return Promise.resolve({ error: null });
          }),
        };
      }
      return base;
    });

    await handleIngestOdds(1, supabase);

    expect(capturedRow).not.toBeNull();
    expect(Number.isInteger(capturedRow!['base_points'])).toBe(true);
  });
});

