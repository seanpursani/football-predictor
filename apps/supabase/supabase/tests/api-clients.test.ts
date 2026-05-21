/**
 * api-clients.test.ts
 * Tests for http-client.ts, odds-api.ts, and events-api.ts
 * Runs with Jest + ts-jest in Node.js (not Deno)
 */

// ─── Deno shim ───────────────────────────────────────────────────────────────
// The source files use getEnv() which falls back to process.env in Node.
// We set env vars via process.env before each test.

// ─── Imports ─────────────────────────────────────────────────────────────────
// Use .ts extensions because ts-jest handles them
import {ERROR_CODES, fetchWithRetry} from '../functions/_shared/api-clients/http-client';
import {fetchOddsForGameweek, ODDS_ERROR_CODES} from '../functions/_shared/api-clients/odds-api';
import {EVENTS_ERROR_CODES, fetchMatchEvents} from '../functions/_shared/api-clients/events-api';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeMockResponse(status: number, body: unknown): Response {
    return {
        status,
        ok: status >= 200 && status < 300,
        json: () => Promise.resolve(body),
        text: () => Promise.resolve(JSON.stringify(body)),
    } as unknown as Response;
}

// ─────────────────────────────────────────────────────────────────────────────
// http-client tests
// ─────────────────────────────────────────────────────────────────────────────

describe('fetchWithRetry', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
        // @ts-ignore
        delete global.fetch;
    });

    it('returns data on success (2xx)', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce(makeMockResponse(200, {ok: true}));

        const promise = fetchWithRetry('https://example.com/api');
        await jest.runAllTimersAsync();
        const result = await promise;

        expect(result.error).toBeNull();
        expect(result.data).not.toBeNull();
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('retries on 5xx and succeeds on second attempt', async () => {
        global.fetch = jest.fn()
            .mockResolvedValueOnce(makeMockResponse(503, {}))
            .mockResolvedValueOnce(makeMockResponse(200, {ok: true}));

        const promise = fetchWithRetry('https://example.com/api');
        await jest.runAllTimersAsync();
        const result = await promise;

        expect(result.error).toBeNull();
        expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('returns FETCH_ERROR after 3 consecutive 5xx failures (exactly 3 calls)', async () => {
        global.fetch = jest.fn()
            .mockResolvedValueOnce(makeMockResponse(500, {}))
            .mockResolvedValueOnce(makeMockResponse(502, {}))
            .mockResolvedValueOnce(makeMockResponse(503, {}));

        const promise = fetchWithRetry('https://example.com/api');
        await jest.runAllTimersAsync();
        const result = await promise;

        expect(result.data).toBeNull();
        expect(result.error?.code).toBe(ERROR_CODES.FETCH_ERROR);
        expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('returns RATE_LIMITED immediately on 429 (no retries)', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce(makeMockResponse(429, {}));

        const promise = fetchWithRetry('https://example.com/api');
        await jest.runAllTimersAsync();
        const result = await promise;

        expect(result.data).toBeNull();
        expect(result.error?.code).toBe(ERROR_CODES.RATE_LIMITED);
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('returns FETCH_ERROR immediately on 4xx (not retryable)', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce(makeMockResponse(400, {}));

        const promise = fetchWithRetry('https://example.com/api');
        await jest.runAllTimersAsync();
        const result = await promise;

        expect(result.data).toBeNull();
        expect(result.error?.code).toBe(ERROR_CODES.FETCH_ERROR);
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('retries on network error and returns error after exhaustion', async () => {
        global.fetch = jest.fn()
            .mockRejectedValue(new Error('network failure'));

        const promise = fetchWithRetry('https://example.com/api');
        await jest.runAllTimersAsync();
        const result = await promise;

        expect(result.data).toBeNull();
        expect(result.error?.code).toBe(ERROR_CODES.FETCH_ERROR);
        expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('does not throw — always returns structured result', async () => {
        global.fetch = jest.fn().mockRejectedValue(new Error('boom'));

        const promise = fetchWithRetry('https://example.com/api');
        await jest.runAllTimersAsync();
        await expect(promise).resolves.not.toThrow();
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// odds-api tests
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_ODDS_FIXTURES = [
    {
        id: 'fixture-123',
        homeTeam: 'Arsenal',
        awayTeam: 'Chelsea',
        kickoffAt: '2026-05-15T15:00:00Z',
        markets: [{eventType: 'match_winner', decimalOdds: 2.5, teamId: 'arsenal'}],
    },
];

describe('fetchOddsForGameweek', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        process.env['ODDS_API_KEY'] = 'test-odds-key';
        process.env['ODDS_API_BASE_URL'] = 'https://test-odds.example.com/v1';
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
        // @ts-ignore
        delete global.fetch;
        delete process.env['ODDS_API_KEY'];
        delete process.env['ODDS_API_BASE_URL'];
    });

    it('returns OddsApiFixture[] on success', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce(makeMockResponse(200, MOCK_ODDS_FIXTURES));

        const promise = fetchOddsForGameweek(1);
        await jest.runAllTimersAsync();
        const result = await promise;

        expect(result.error).toBeNull();
        expect(result.data).toHaveLength(1);
        expect(result.data![0].externalId).toBe('fixture-123');
        expect(result.data![0].homeTeam).toBe('Arsenal');
        expect(result.data![0].markets[0].decimalOdds).toBe(2.5);
    });

    it('returns ODDS_FETCH_FAILED after 3 consecutive 5xx', async () => {
        global.fetch = jest.fn()
            .mockResolvedValueOnce(makeMockResponse(500, {}))
            .mockResolvedValueOnce(makeMockResponse(500, {}))
            .mockResolvedValueOnce(makeMockResponse(500, {}));

        const promise = fetchOddsForGameweek(1);
        await jest.runAllTimersAsync();
        const result = await promise;

        expect(result.data).toBeNull();
        expect(result.error?.code).toBe(ODDS_ERROR_CODES.ODDS_FETCH_FAILED);
        expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('returns RATE_LIMITED on 429', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce(makeMockResponse(429, {}));

        const promise = fetchOddsForGameweek(1);
        await jest.runAllTimersAsync();
        const result = await promise;

        expect(result.data).toBeNull();
        expect(result.error?.code).toBe(ODDS_ERROR_CODES.RATE_LIMITED);
    });

    it('returns INVALID_RESPONSE on invalid JSON', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            status: 200,
            ok: true,
            json: () => Promise.reject(new SyntaxError('bad json')),
        } as unknown as Response);

        const promise = fetchOddsForGameweek(1);
        await jest.runAllTimersAsync();
        const result = await promise;

        expect(result.data).toBeNull();
        expect(result.error?.code).toBe(ODDS_ERROR_CODES.INVALID_RESPONSE);
    });

    it('returns MISSING_API_KEY when ODDS_API_KEY not set', async () => {
        delete process.env['ODDS_API_KEY'];
        global.fetch = jest.fn();

        const result = await fetchOddsForGameweek(1);
        expect(result.data).toBeNull();
        expect(result.error?.code).toBe(ODDS_ERROR_CODES.MISSING_API_KEY);
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('does not throw — always returns structured result', async () => {
        global.fetch = jest.fn().mockRejectedValue(new Error('network error'));
        const promise = fetchOddsForGameweek(1);
        await jest.runAllTimersAsync();
        await expect(promise).resolves.not.toThrow();
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// events-api tests
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_EVENTS_MATCH = {
    externalId: 'fixture-456',
    events: [
        {
            eventType: 'goal',
            playerId: 'player-1',
            teamId: 'arsenal',
            minute: 23,
            assister: 'player-2',
        },
        {
            eventType: 'yellow_card',
            playerId: 'player-3',
            teamId: 'chelsea',
            minute: 45,
        },
    ],
};

describe('fetchMatchEvents', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        process.env['EVENTS_API_KEY'] = 'test-events-key';
        process.env['EVENTS_API_BASE_URL'] = 'https://test-events.example.com/v1';
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
        // @ts-ignore
        delete global.fetch;
        delete process.env['EVENTS_API_KEY'];
        delete process.env['EVENTS_API_BASE_URL'];
    });

    it('returns EventsApiMatch on success', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce(makeMockResponse(200, MOCK_EVENTS_MATCH));

        const promise = fetchMatchEvents('fixture-456');
        await jest.runAllTimersAsync();
        const result = await promise;

        expect(result.error).toBeNull();
        expect(result.data).not.toBeNull();
        expect(result.data!.externalId).toBe('fixture-456');
        expect(result.data!.events).toHaveLength(2);
        expect(result.data!.events[0].eventType).toBe('goal');
        expect(result.data!.events[0].minute).toBe(23);
        expect(result.data!.events[0].extraData?.assister).toBe('player-2');
    });

    it('returns EVENTS_FETCH_FAILED after 3 consecutive 5xx', async () => {
        global.fetch = jest.fn()
            .mockResolvedValueOnce(makeMockResponse(500, {}))
            .mockResolvedValueOnce(makeMockResponse(500, {}))
            .mockResolvedValueOnce(makeMockResponse(503, {}));

        const promise = fetchMatchEvents('fixture-456');
        await jest.runAllTimersAsync();
        const result = await promise;

        expect(result.data).toBeNull();
        expect(result.error?.code).toBe(EVENTS_ERROR_CODES.EVENTS_FETCH_FAILED);
        expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('returns RATE_LIMITED on 429', async () => {
        global.fetch = jest.fn().mockResolvedValueOnce(makeMockResponse(429, {}));

        const promise = fetchMatchEvents('fixture-456');
        await jest.runAllTimersAsync();
        const result = await promise;

        expect(result.data).toBeNull();
        expect(result.error?.code).toBe(EVENTS_ERROR_CODES.RATE_LIMITED);
    });

    it('returns MISSING_API_KEY when EVENTS_API_KEY not set', async () => {
        delete process.env['EVENTS_API_KEY'];
        global.fetch = jest.fn();

        const result = await fetchMatchEvents('fixture-456');
        expect(result.data).toBeNull();
        expect(result.error?.code).toBe(EVENTS_ERROR_CODES.MISSING_API_KEY);
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('does not throw — always returns structured result', async () => {
        global.fetch = jest.fn().mockRejectedValue(new Error('network error'));
        const promise = fetchMatchEvents('fixture-456');
        await jest.runAllTimersAsync();
        await expect(promise).resolves.not.toThrow();
    });
});

