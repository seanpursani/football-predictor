import {fetchWithRetry, getEnv} from './http-client.ts';

// ---------------------------------------------------------------------------
// Error codes (events-specific)
// ---------------------------------------------------------------------------
export const EVENTS_ERROR_CODES = {
    EVENTS_FETCH_FAILED: 'EVENTS_FETCH_FAILED',
    RATE_LIMITED: 'RATE_LIMITED',
    INVALID_RESPONSE: 'INVALID_RESPONSE',
    MISSING_API_KEY: 'MISSING_API_KEY',
} as const;

// ---------------------------------------------------------------------------
// Response interfaces (provider-agnostic)
// ---------------------------------------------------------------------------
export interface MatchEventData {
    eventType: string;      // 'goal' | 'substitution' | 'corner' | 'yellow_card' | 'red_card'
    playerId: string;
    teamId: string;
    minute: number;
    extraData?: Record<string, unknown>; // assister, player_on, player_off, zone etc.
}

export interface EventsApiMatch {
    externalId: string;     // matches fixtures.external_id
    events: MatchEventData[];
}

export interface EventsApiResponse {
    data: EventsApiMatch | null;
    error: null;
}

export interface EventsApiError {
    data: null;
    error: { code: string; message: string };
}

// ---------------------------------------------------------------------------
// Module-level constants
// ---------------------------------------------------------------------------
const DEFAULT_EVENTS_API_BASE_URL = 'https://api.example-events-provider.com/v1';

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Fetch match events for a single fixture by its external ID.
 * Returns provider-agnostic EventsApiMatch with MatchEventData[].
 */
export async function fetchMatchEvents(
    fixtureExternalId: string,
): Promise<EventsApiResponse | EventsApiError> {
    if (!fixtureExternalId) {
        return {
            data: null,
            error: {code: EVENTS_ERROR_CODES.EVENTS_FETCH_FAILED, message: 'fixtureExternalId must be non-empty'},
        };
    }
    const apiKey = getEnv('EVENTS_API_KEY');
    if (!apiKey) {
        return {
            data: null,
            error: {
                code: EVENTS_ERROR_CODES.MISSING_API_KEY,
                message: 'EVENTS_API_KEY environment variable is not set'
            },
        };
    }

    const baseUrl = getEnv('EVENTS_API_BASE_URL') ?? DEFAULT_EVENTS_API_BASE_URL;
    const url = `${baseUrl}/events/${encodeURIComponent(fixtureExternalId)}`;

    const result = await fetchWithRetry(url, {
        headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
        },
    });

    if (result.error) {
        const code =
            result.error.code === 'RATE_LIMITED'
                ? EVENTS_ERROR_CODES.RATE_LIMITED
                : EVENTS_ERROR_CODES.EVENTS_FETCH_FAILED;
        return {data: null, error: {code, message: result.error.message}};
    }

    let raw: unknown;
    try {
        raw = await result.data.json();
    } catch {
        return {
            data: null,
            error: {code: EVENTS_ERROR_CODES.INVALID_RESPONSE, message: 'Failed to parse events API response as JSON'},
        };
    }

    try {
        const match = mapToEventsApiMatch(fixtureExternalId, raw);
        return {data: match, error: null};
    } catch {
        return {
            data: null,
            error: {
                code: EVENTS_ERROR_CODES.INVALID_RESPONSE,
                message: 'Events API response did not match expected shape'
            },
        };
    }
}

// ---------------------------------------------------------------------------
// Provider response mapping (internal)
// ---------------------------------------------------------------------------

function mapToEventsApiMatch(externalId: string, raw: unknown): EventsApiMatch {
    if (typeof raw !== 'object' || raw === null) {
        throw new Error('Expected object at top level');
    }
    const r = raw as Record<string, unknown>;

    const eventsRaw = r['events'] ?? r['incidents'] ?? [];
    if (!Array.isArray(eventsRaw)) throw new Error('Expected events array');

    return {
        externalId: String(r['externalId'] ?? r['fixture_id'] ?? externalId),
        events: eventsRaw.map((e: unknown): MatchEventData => {
            if (typeof e !== 'object' || e === null) throw new Error('Invalid event item');
            const ev = e as Record<string, unknown>;

            // Build extraData: assister, player_on, player_off, zone
            const extraData: Record<string, unknown> = {};
            if (ev['assisterId'] != null || ev['assister'] != null) {
                extraData['assister'] = ev['assisterId'] ?? ev['assister'];
            }
            if (ev['player_on'] != null) extraData['player_on'] = ev['player_on'];
            if (ev['player_off'] != null) extraData['player_off'] = ev['player_off'];
            if (ev['zone'] != null) extraData['zone'] = ev['zone'];

            return {
                eventType: String(ev['eventType'] ?? ev['type'] ?? 'unknown'),
                playerId: String(ev['playerId'] ?? ev['player_id'] ?? ''),
                teamId: String(ev['teamId'] ?? ev['team_id'] ?? ''),
                minute: Number(ev['minute'] ?? ev['time'] ?? 0),
                extraData: Object.keys(extraData).length > 0 ? extraData : undefined,
            };
        }),
    };
}

