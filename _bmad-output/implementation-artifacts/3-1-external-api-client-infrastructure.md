# Story 3.1: External API Client Infrastructure

Status: review

## Story

As a **system**,
I want provider-agnostic API clients for the odds and match events APIs with built-in retry logic,
So that all external API calls are isolated to a single entry point per provider and can tolerate transient failures.

## Acceptance Criteria

1. **Given** `functions/_shared/api-clients/odds-api.ts` is created **When** any Edge Function needs odds data **Then** it calls only this file — no other file in the codebase calls the Odds API directly **And** the API key is read from Edge Function environment secrets, never hardcoded or in the client bundle.

2. **Given** `functions/_shared/api-clients/events-api.ts` is created **When** any Edge Function needs match event data **Then** it calls only this file — no other file calls the Events API directly.

3. **Given** either API client makes a request and receives a transient error (5xx or timeout) **When** the retry logic runs **Then** it retries up to 3 times with exponential backoff (2× delay per retry) **And** after 3 failures it returns a structured `{ error: { code, message } }` — it does not throw.

4. **Given** both clients return data **When** the response is typed **Then** it maps to shared interfaces from `@lecolpo/types`.

## Developer Context

### What This Story Is

This story creates the two provider-agnostic API client modules used by all Gameweek Data Pipeline Edge Functions:

1. `apps/supabase/supabase/functions/_shared/api-clients/odds-api.ts` — fetches betting odds for fixtures
2. `apps/supabase/supabase/functions/_shared/api-clients/events-api.ts` — fetches match events post-match (goals, cards, subs, corners)

These modules are **shared utilities** only — no Edge Function entry points (`index.ts` files) are created in this story. The actual ingestion logic lives in Stories 3.2 (`ingest-odds`) and 3.3 (`ingest-events`).

**This story also creates a shared `http-client.ts` utility** for the underlying fetch + retry logic, which both API clients use. This avoids duplicating retry code.

### Architecture Requirements (AR references)

- **AR6** — Odds API and match events API keys stored as Supabase Edge Function secrets (`supabase secrets set`). Keys read from `Deno.env.get('ODDS_API_KEY')` and `Deno.env.get('EVENTS_API_KEY')` — never hardcoded.
- **AR7** — All Edge Functions shared utilities live in `functions/_shared/`. This story adds `api-clients/` subdirectory.
- **NFR8** — Raw odds are NEVER stored or exposed to clients. The API client returns raw odds data to callers — it is the **caller's** responsibility (Story 3.2 `odds-converter.ts`) to convert before persisting. The client itself must not persist or log raw odds values.
- **NFR15** — Odds API: tolerate up to 4 hours downtime → exponential backoff, max 3 retries, 2× delay per retry.
- **NFR16** — Match Events API: tolerate up to 2 hours post-match delay; retry logic handles transient failures.
- **NFR14** — API rate limits: clients should include a delay mechanism; the retry backoff inherently helps but explicit rate-limit detection (HTTP 429) should return `{ error: { code: 'RATE_LIMITED', message } }` without further retries.
- **AR17** — File naming: `kebab-case` directories and filenames. All TypeScript types: `PascalCase`. Constants: `SCREAMING_SNAKE_CASE`.

### File Locations (CRITICAL — must be exact)

```
apps/supabase/supabase/functions/_shared/
  api-clients/
    odds-api.ts          ← NEW: Odds API client
    events-api.ts        ← NEW: Match Events API client
    http-client.ts       ← NEW: Shared fetch + retry utility
  constants.ts           ← EXISTS (from Story 3.0 — do NOT modify)
  sentry.ts              ← EXISTS (from Story 1.5 — do NOT modify)
```

Tests at:
```
apps/supabase/supabase/tests/
  api-clients.test.ts    ← NEW: Jest tests for both clients + http-client
```

### Deno-Specific Requirements

Edge Functions run in Deno (not Node.js). Key Deno differences:
- Import from URLs or relative paths (no `node_modules`): use `import type` for pure TypeScript type imports from `@lecolpo/types` — but since this is a Deno runtime, types from `@lecolpo/types` must be imported using the workspace path or declared inline.
- `Deno.env.get('KEY')` for env vars (not `process.env.KEY`)
- Use `fetch()` built-in (available in Deno natively)
- Use `// @ts-nocheck` at file top if Deno type conflicts arise (pattern established in `sentry.ts`)
- **No Node.js APIs**: no `require()`, no `Buffer`, no `process`

**Important:** Tests in `apps/supabase/supabase/tests/` run with **Jest + ts-jest** (Node.js), not Deno. The test file will mock `fetch` using Jest's `jest.fn()` / `global.fetch`. The source files use Deno APIs, so tests must mock Deno globals (`Deno.env.get`) via `jest.spyOn` or by setting `process.env` as a fallback — see implementation note below.

### Env Var Fallback Pattern for Tests

Since Deno's `Deno.env.get()` is not available in Jest/Node, the API clients should use this pattern:

```typescript
// Works in both Deno (prod) and Node (test)
const getEnv = (key: string): string | undefined => {
  // @ts-ignore - Deno global available in Edge Function runtime
  if (typeof Deno !== 'undefined') return Deno.env.get(key);
  return process.env[key]; // Node.js fallback for tests
};
```

This avoids needing to mock `Deno` itself in tests.

### Response Type Contracts

**Odds API Response Shape** (provider-agnostic interface — maps to `@lecolpo/types`):

```typescript
// What odds-api.ts returns to callers
interface OddsApiFixture {
  externalId: string;       // external fixture identifier
  homeTeam: string;
  awayTeam: string;
  kickoffAt: string;        // ISO 8601 UTC
  markets: OddsMarket[];
}

interface OddsMarket {
  eventType: string;        // maps to EventType in @lecolpo/types
  decimalOdds: number;      // raw decimal odds — caller must convert to points
  teamId?: string;
}

// Success response
interface OddsApiResponse {
  data: OddsApiFixture[];
  error: null;
}

// Error response
interface OddsApiError {
  data: null;
  error: { code: string; message: string };
}
```

**Events API Response Shape**:

```typescript
// What events-api.ts returns to callers (maps MatchEvent from @lecolpo/types)
interface EventsApiMatch {
  externalId: string;       // matches fixtures.external_id
  events: MatchEventData[];
}

interface MatchEventData {
  eventType: string;        // 'goal' | 'substitution' | 'corner' | 'yellow_card' | 'red_card'
  playerId: string;
  teamId: string;
  minute: number;
  extraData?: Record<string, unknown>; // assister, player_on, player_off, zone etc.
}

interface EventsApiResponse {
  data: EventsApiMatch | null;
  error: null;
}

interface EventsApiError {
  data: null;
  error: { code: string; message: string };
}
```

### Retry Logic Specification

```
Attempt 1: immediate
Attempt 2: wait 1000ms (1s base delay)
Attempt 3: wait 2000ms (2× the previous delay)
After 3 failures: return { error: { code: 'FETCH_ERROR', message: ... } }

Retryable conditions: HTTP 5xx, network timeout
Non-retryable: HTTP 4xx (client error — don't retry), HTTP 429 (return { code: 'RATE_LIMITED' } immediately)
```

### Error Codes

Use these exact error code strings so Story 3.2 and 3.3 can switch on them:

| Code | Trigger |
|---|---|
| `'ODDS_FETCH_FAILED'` | Odds API: all retries exhausted |
| `'EVENTS_FETCH_FAILED'` | Events API: all retries exhausted |
| `'RATE_LIMITED'` | HTTP 429 on either API |
| `'INVALID_RESPONSE'` | Response body fails to parse as expected JSON |
| `'MISSING_API_KEY'` | Env var for API key is not set |

### Previous Story Learnings (from Story 3.0)

- The `// @ts-nocheck` header is used in `sentry.ts` but is **not needed** for pure TypeScript Deno files — use it only if Deno-specific globals cause type conflicts in the file.
- `functions/_shared/` directory exists at `apps/supabase/supabase/functions/_shared/`.
- Tests use `jest` + `ts-jest` with `testEnvironment: 'node'`. Test files go in `apps/supabase/supabase/tests/`.
- The `apps/supabase/tsconfig.json` was extended to include `_shared/` — the new `api-clients/` subdirectory should be included automatically since `_shared/` is already in scope.
- All values in response objects must use `null` (not `undefined`) for absent values — Supabase `{ data, error }` convention.
- Jest `globals.ts-jest.tsconfig` points to `./tsconfig.json` — no additional tsconfig changes needed.

### What Stories 3.2 and 3.3 Will Consume

**Story 3.2 (`ingest-odds`) will call:**
```typescript
import { fetchOddsForGameweek } from '../_shared/api-clients/odds-api.ts';

const result = await fetchOddsForGameweek(gameweekId);
if (result.error) { /* handle error */ }
// result.data: OddsApiFixture[] — convert with odds-converter.ts before persisting
```

**Story 3.3 (`ingest-events`) will call:**
```typescript
import { fetchMatchEvents } from '../_shared/api-clients/events-api.ts';

const result = await fetchMatchEvents(fixtureExternalId);
if (result.error) { /* handle error */ }
// result.data: EventsApiMatch — store in match_events table
```

### Provider Agnosticism

The actual API provider is TBD (The Odds API, API-Football, BetFair). The clients must be **provider-agnostic** at the interface level — the base URL and any provider-specific request structures should be configurable via env vars or module-level constants, NOT hardcoded paths that leak provider details into callers.

Recommended approach:
- `ODDS_API_BASE_URL` env var (default a reasonable placeholder)
- `EVENTS_API_BASE_URL` env var (default a reasonable placeholder)
- Clients internally handle any provider-specific request params

### Testing Strategy

Tests run with Jest + ts-jest in Node.js. They must mock `fetch` globally:

```typescript
// In beforeEach
global.fetch = jest.fn();

// Restore after
afterEach(() => {
  jest.restoreAllMocks();
});
```

Test coverage requirements:
- Successful response → returns `{ data, error: null }`
- HTTP 5xx → triggers retry logic
- 3 consecutive 5xx → returns `{ data: null, error: { code: 'ODDS_FETCH_FAILED' } }` without throwing
- HTTP 429 → returns `{ data: null, error: { code: 'RATE_LIMITED' } }` immediately (no retries)
- Invalid JSON response → returns `{ data: null, error: { code: 'INVALID_RESPONSE' } }`
- Missing API key → returns `{ data: null, error: { code: 'MISSING_API_KEY' } }`
- Retry count: verify fetch is called exactly 3 times on 3× 5xx (not 4, not 2)

### Architecture Compliance Checklist

- [ ] `odds-api.ts` and `events-api.ts` are the **only** files that call their respective external APIs
- [ ] API keys read from env vars only — no hardcoding
- [ ] All functions return `{ data, error }` — never throw to callers
- [ ] Error responses use `null` for data field (not `undefined`)
- [ ] Point values are NOT derived in these files — raw odds returned as-is (Story 3.2 handles conversion)
- [ ] Retries use 2× exponential backoff with 3 max attempts
- [ ] `SCREAMING_SNAKE_CASE` for all module-level constants

## Tasks / Subtasks

- [x] Task 1: Create `http-client.ts` shared retry utility (AC: #3)
  - [x] Create `apps/supabase/supabase/functions/_shared/api-clients/http-client.ts`
  - [x] Export `fetchWithRetry(url, options, retries=3)` function
  - [x] Implement exponential backoff: attempt 1 immediate, attempt 2 waits 1000ms, attempt 3 waits 2000ms
  - [x] Return `{ data: Response, error: null }` on success
  - [x] Return `{ data: null, error: { code, message } }` after all retries exhausted
  - [x] Do NOT retry on 4xx responses — return error immediately
  - [x] Return `{ error: { code: 'RATE_LIMITED' } }` immediately on HTTP 429 without retries
  - [x] Use `getEnv` helper pattern for env var access (Deno + Node fallback)

- [x] Task 2: Create `odds-api.ts` (AC: #1, #3, #4)
  - [x] Create `apps/supabase/supabase/functions/_shared/api-clients/odds-api.ts`
  - [x] Export `fetchOddsForGameweek(gameweekId: number): Promise<OddsApiResponse | OddsApiError>`
  - [x] Read `ODDS_API_KEY` from env vars using `getEnv` helper — return `{ error: { code: 'MISSING_API_KEY' } }` if not set
  - [x] Read `ODDS_API_BASE_URL` from env vars with a sensible placeholder default
  - [x] Use `fetchWithRetry` from `http-client.ts` for all requests
  - [x] Return `{ error: { code: 'ODDS_FETCH_FAILED', message } }` when all retries exhausted
  - [x] Parse response body as JSON; return `{ error: { code: 'INVALID_RESPONSE' } }` on parse failure
  - [x] Map response to `OddsApiFixture[]` interface (provider-agnostic)
  - [x] Define and export all TypeScript interfaces: `OddsApiFixture`, `OddsMarket`, `OddsApiResponse`, `OddsApiError`
  - [x] No logging of raw odds values (NFR8)

- [x] Task 3: Create `events-api.ts` (AC: #2, #3, #4)
  - [x] Create `apps/supabase/supabase/functions/_shared/api-clients/events-api.ts`
  - [x] Export `fetchMatchEvents(fixtureExternalId: string): Promise<EventsApiResponse | EventsApiError>`
  - [x] Read `EVENTS_API_KEY` from env vars — return `{ error: { code: 'MISSING_API_KEY' } }` if not set
  - [x] Read `EVENTS_API_BASE_URL` from env vars with a sensible placeholder default
  - [x] Use `fetchWithRetry` from `http-client.ts` for all requests
  - [x] Return `{ error: { code: 'EVENTS_FETCH_FAILED', message } }` when all retries exhausted
  - [x] Parse response body as JSON; return `{ error: { code: 'INVALID_RESPONSE' } }` on parse failure
  - [x] Map response to `EventsApiMatch` / `MatchEventData[]` interface
  - [x] Define and export all TypeScript interfaces: `EventsApiMatch`, `MatchEventData`, `EventsApiResponse`, `EventsApiError`
  - [x] Include `extraData` for assister, player_on/off, zone fields mapped from provider response

- [x] Task 4: Write tests (AC: #1, #2, #3)
  - [x] Create `apps/supabase/supabase/tests/api-clients.test.ts`
  - [x] Mock `global.fetch` in `beforeEach` using `jest.fn()`
  - [x] Test `http-client.ts`: success path, 2× retry on 5xx, 3× retry exhausted returns error, immediate error on 429, immediate error on 4xx, backoff timing (use jest fake timers)
  - [x] Test `odds-api.ts` (using mocked `fetch`):
    - [x] Success: returns `{ data: OddsApiFixture[], error: null }`
    - [x] HTTP 5xx × 3 → returns `{ data: null, error: { code: 'ODDS_FETCH_FAILED' } }` without throwing
    - [x] HTTP 429 → returns `{ data: null, error: { code: 'RATE_LIMITED' } }`
    - [x] Invalid JSON → returns `{ data: null, error: { code: 'INVALID_RESPONSE' } }`
    - [x] Missing `ODDS_API_KEY` env var → returns `{ data: null, error: { code: 'MISSING_API_KEY' } }`
    - [x] fetch called exactly 3 times on 3 consecutive 5xx failures
  - [x] Test `events-api.ts` (mirrors odds tests):
    - [x] Success: returns `{ data: EventsApiMatch, error: null }`
    - [x] HTTP 5xx × 3 → returns `{ data: null, error: { code: 'EVENTS_FETCH_FAILED' } }` without throwing
    - [x] HTTP 429 → returns `{ data: null, error: { code: 'RATE_LIMITED' } }`
    - [x] Missing `EVENTS_API_KEY` → returns `{ data: null, error: { code: 'MISSING_API_KEY' } }`
  - [x] All tests pass with `pnpm --filter @lecolpo/supabase test`
  - [x] No regressions in existing tests (`odds-calibration.test.ts`, `rls-policies.test.ts`)

## Dev Notes

This is a clean utility story — no DB migrations, no mobile changes, no Edge Function entry points. The deliverables are 3 pure TypeScript files and 1 test file.

**Do not** begin implementing `odds-converter.ts` (Story 3.2) or `ingest-odds/index.ts` — those are separate stories.

**Provider placeholder:** Since the actual API provider is TBD, use placeholder base URLs and a realistic but fictional response shape in tests. The key invariant is the **interface contract** (`OddsApiFixture`, `MatchEventData`) — callers in Stories 3.2 and 3.3 will depend on these types.

**Retry timing in tests:** Use Jest's `jest.useFakeTimers()` and `jest.runAllTimers()` to avoid actual `setTimeout` delays in the retry logic. Alternatively, accept the tests may be slightly slow — the backoff delays are 1s and 2s, totalling 3s for a full 3-retry test.

**TypeScript strict mode:** The existing `apps/supabase/tsconfig.json` has `"strict": true`. All new files must compile clean with no `@ts-ignore` unless strictly necessary for Deno globals.

Run tests: `pnpm --filter @lecolpo/supabase test`
Run all workspace tests: `pnpm test` from repo root (if root script exists) or per-package.

## Dev Agent Record

### Implementation Plan

Created three TypeScript files under `apps/supabase/supabase/functions/_shared/api-clients/`:

1. **`http-client.ts`** — Core retry utility with `fetchWithRetry()`. Uses `getEnv()` helper (Deno/Node compatible). Implements 3-attempt exponential backoff (immediate → 1s → 2s). Returns structured `{ data, error }` — never throws. Handles 429 (RATE_LIMITED, no retry), 4xx (immediate error), 5xx (retryable), network failures (retryable).

2. **`odds-api.ts`** — Wraps `fetchWithRetry` for odds data. Exports `fetchOddsForGameweek(gameweekId)`. Maps provider response to provider-agnostic `OddsApiFixture[]`. Guard for missing `ODDS_API_KEY`. Base URL configurable via `ODDS_API_BASE_URL` env var.

3. **`events-api.ts`** — Wraps `fetchWithRetry` for match events. Exports `fetchMatchEvents(fixtureExternalId)`. Maps to `EventsApiMatch` / `MatchEventData[]`. Includes `extraData` for assister, player_on/off, zone fields. Guard for missing `EVENTS_API_KEY`.

**tsconfig change**: Added `"allowImportingTsExtensions": true` and `"noEmit": true` to `apps/supabase/tsconfig.json` to support Deno-style `.ts` extension imports in Jest/ts-jest.

### Debug Log

- Initial test failure: `.ts` extension on imports not allowed without `allowImportingTsExtensions` — fixed in tsconfig.
- `MISSING_API_KEY` test failures: `global.fetch` was not cleaned up between tests; fixed by adding `delete global.fetch` in `afterEach` and explicitly setting `global.fetch = jest.fn()` in the missing-key tests.

### Completion Notes

✅ All 4 tasks completed. 53 total tests pass (18 new in api-clients.test.ts + 35 pre-existing). No regressions. All ACs satisfied:
- AC1: `odds-api.ts` is the single entry point for odds API calls; key from env only.
- AC2: `events-api.ts` is the single entry point for events API calls.
- AC3: Retry logic retries up to 3× with 2× exponential backoff; returns structured error after exhaustion — never throws.
- AC4: Responses typed to `OddsApiFixture[]` / `EventsApiMatch` provider-agnostic interfaces.

## File List

- `apps/supabase/supabase/functions/_shared/api-clients/http-client.ts` — NEW
- `apps/supabase/supabase/functions/_shared/api-clients/odds-api.ts` — NEW
- `apps/supabase/supabase/functions/_shared/api-clients/events-api.ts` — NEW
- `apps/supabase/supabase/tests/api-clients.test.ts` — NEW
- `apps/supabase/tsconfig.json` — MODIFIED (added `allowImportingTsExtensions`, `noEmit`)

## Change Log

- 2026-05-11: Story 3.1 created — External API Client Infrastructure
- 2026-05-11: Story 3.1 implemented — http-client.ts, odds-api.ts, events-api.ts created; 18 new tests; all ACs satisfied

