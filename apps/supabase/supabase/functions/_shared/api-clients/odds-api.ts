import { fetchWithRetry, getEnv } from './http-client.ts';

// ---------------------------------------------------------------------------
// Error codes (odds-specific)
// ---------------------------------------------------------------------------
export const ODDS_ERROR_CODES = {
  ODDS_FETCH_FAILED: 'ODDS_FETCH_FAILED',
  RATE_LIMITED: 'RATE_LIMITED',
  INVALID_RESPONSE: 'INVALID_RESPONSE',
  MISSING_API_KEY: 'MISSING_API_KEY',
} as const;

// ---------------------------------------------------------------------------
// Response interfaces (provider-agnostic)
// ---------------------------------------------------------------------------
export interface OddsMarket {
  eventType: string;      // maps to EventType in @lecolpo/types
  decimalOdds: number;    // raw decimal odds — caller must convert to points
  teamId?: string;
}

export interface OddsApiFixture {
  externalId: string;
  homeTeam: string;
  awayTeam: string;
  kickoffAt: string;      // ISO 8601 UTC
  markets: OddsMarket[];
}

export interface OddsApiResponse {
  data: OddsApiFixture[];
  error: null;
}

export interface OddsApiError {
  data: null;
  error: { code: string; message: string };
}

// ---------------------------------------------------------------------------
// Module-level constants
// ---------------------------------------------------------------------------
const DEFAULT_ODDS_API_BASE_URL = 'https://api.example-odds-provider.com/v1';

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Fetch odds for all fixtures in a gameweek.
 * Returns provider-agnostic OddsApiFixture[].
 * Raw odds are returned as-is — the caller (odds-converter.ts) handles conversion to points.
 */
export async function fetchOddsForGameweek(
  gameweekId: number,
): Promise<OddsApiResponse | OddsApiError> {
  const apiKey = getEnv('ODDS_API_KEY');
  if (!apiKey) {
    return {
      data: null,
      error: { code: ODDS_ERROR_CODES.MISSING_API_KEY, message: 'ODDS_API_KEY environment variable is not set' },
    };
  }

  const baseUrl = getEnv('ODDS_API_BASE_URL') ?? DEFAULT_ODDS_API_BASE_URL;
  const url = `${baseUrl}/odds?gameweek=${gameweekId}`;

  const result = await fetchWithRetry(url, {
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
  });

  if (result.error) {
    const code =
      result.error.code === 'RATE_LIMITED'
        ? ODDS_ERROR_CODES.RATE_LIMITED
        : ODDS_ERROR_CODES.ODDS_FETCH_FAILED;
    return { data: null, error: { code, message: result.error.message } };
  }

  let raw: unknown;
  try {
    raw = await result.data.json();
  } catch {
    return {
      data: null,
      error: { code: ODDS_ERROR_CODES.INVALID_RESPONSE, message: 'Failed to parse odds API response as JSON' },
    };
  }

  // Map provider response to provider-agnostic interface
  // NOTE: raw odds are NOT logged here (NFR8)
  try {
    const fixtures = mapToOddsApiFixtures(raw);
    return { data: fixtures, error: null };
  } catch {
    return {
      data: null,
      error: { code: ODDS_ERROR_CODES.INVALID_RESPONSE, message: 'Odds API response did not match expected shape' },
    };
  }
}

// ---------------------------------------------------------------------------
// Provider response mapping (internal)
// ---------------------------------------------------------------------------

function mapToOddsApiFixtures(raw: unknown): OddsApiFixture[] {
  if (!Array.isArray(raw)) {
    throw new Error('Expected array at top level');
  }

  return raw.map((item: unknown): OddsApiFixture => {
    if (typeof item !== 'object' || item === null) throw new Error('Invalid fixture item');
    const f = item as Record<string, unknown>;

    return {
      externalId: String(f['id'] ?? f['externalId'] ?? ''),
      homeTeam: String(f['homeTeam'] ?? f['home_team'] ?? ''),
      awayTeam: String(f['awayTeam'] ?? f['away_team'] ?? ''),
      kickoffAt: String(f['kickoffAt'] ?? f['commence_time'] ?? ''),
      markets: mapMarkets(f['markets'] ?? f['bookmakers'] ?? []),
    };
  });
}

function mapMarkets(raw: unknown): OddsMarket[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((m: unknown): OddsMarket => {
    if (typeof m !== 'object' || m === null) throw new Error('Invalid market item');
    const market = m as Record<string, unknown>;
    return {
      eventType: String(market['eventType'] ?? market['key'] ?? 'unknown'),
      decimalOdds: Number(market['decimalOdds'] ?? market['price'] ?? 0),
      teamId: market['teamId'] != null ? String(market['teamId']) : undefined,
    };
  });
}

