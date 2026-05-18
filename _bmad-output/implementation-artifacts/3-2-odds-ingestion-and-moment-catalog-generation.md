# Story 3.2: Odds Ingestion & Moment Catalog Generation

Status: done

## Story

As a **system**,
I want to fetch odds from the external API, convert them to integer point values, and populate the gameweek moment catalog,
So that the Match Builder has accurate, locked point values for every fixture event when the build window opens.

## Acceptance Criteria

1. **Given** the `ingest-odds` Edge Function is invoked **When** it runs successfully **Then** it calls the odds API client (Story 3.1) for all fixtures in the current gameweek **And** `functions/_shared/odds-converter.ts` converts each raw odds value to an integer point value using the configurable formula — no floats; a float result is a formula design error **And** `game_week_moments` rows are created/updated with locked point values per fixture per event type **And** `gameweeks.status` is set to `Building`.

2. **Given** the odds API is unavailable during ingestion **When** all 3 retries are exhausted **Then** the function returns `{ error: { code: 'ODDS_FETCH_FAILED', message: ... } }` **And** `gameweeks.status` remains unchanged (not set to Building) **And** the failure is logged via `console.error` (surfaced in Supabase function logs).

3. **Given** `ingest-odds` completes successfully **When** the catalog is live **Then** the `send-notifications` Edge Function is invoked to dispatch the Match Builder open push notification (FR46) to all users with a registered push token.

4. **Given** raw odds values exist in the API response **When** they are stored **Then** only derived integer point values are persisted in `game_week_moments` — raw odds are never stored or exposed (NFR8).

5. **Given** `functions/send-notifications/index.ts` and `functions/_shared/push-sender.ts` are implemented as part of this story **When** `send-notifications` is invoked with a notification type and payload **Then** it looks up all users with a registered push token **And** dispatches the notification via the Expo Push API → APNs/FCM **And** users with no registered push token are skipped gracefully **And** the function returns `{ data, error }` — delivery is best-effort, no guaranteed SLA for MVP.

## Tasks / Subtasks

- [x] Task 1: Create `odds-converter.ts` shared utility (AC: #1, #4)
  - [x] Create `apps/supabase/supabase/functions/_shared/odds-converter.ts`
  - [x] Export `convertOddsToPoints(decimalOdds: number): number`
  - [x] Use ONLY `ODDS_SCALE_FACTOR`, `MIN_BASE_POINTS`, `MAX_BASE_POINTS` from `../constants.ts` — zero magic numbers
  - [x] The implementation must exactly match the reference `oddsToBasePoints` already in `constants.ts`
  - [x] Return value must be an integer (Math.round guaranteed) — never a float
  - [x] Validate input: `decimalOdds <= 1.0` should be handled gracefully (clamp to MIN_BASE_POINTS)
  - [x] Export input/output types

- [x] Task 2: Create `ingest-odds` Edge Function (AC: #1, #2, #3, #4)
  - [x] Create `apps/supabase/supabase/functions/ingest-odds/index.ts`
  - [x] Read `gameweekId` from request body
  - [x] Call `fetchOddsForGameweek(gameweekId)` from `../_shared/api-clients/odds-api.ts`
  - [x] On API error: log via `console.error`, return `{ error: { code: 'ODDS_FETCH_FAILED', message } }`, leave `gameweeks.status` unchanged
  - [x] Convert each raw odds value using `convertOddsToPoints` from `odds-converter.ts` — NEVER persist raw odds
  - [x] Upsert `game_week_moments` rows (one per fixture per event type) with locked integer point values
  - [x] Set `gameweeks.status = 'building'` only after successful upsert
  - [x] Invoke `send-notifications` with notification type `'match-builder-open'` after successful catalog generation
  - [x] All DB operations use the Supabase client initialized with service role key (available in Edge Function runtime via `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')`)
  - [x] Return `{ data: { gameweekId, momentsCreated: number }, error: null }` on success

- [x] Task 3: Create `push-sender.ts` shared utility (AC: #5)
  - [x] Create `apps/supabase/supabase/functions/_shared/push-sender.ts`
  - [x] Export `sendPushNotification(title: string, body: string, tokens: string[]): Promise<PushSendResult>`
  - [x] Use the Expo Push API endpoint (`https://exp.host/--/api/v2/push/send`)
  - [x] Handle tokens in batches of 100 (Expo Push API limit)
  - [x] Log delivery results but do NOT throw on delivery failure — best-effort semantics
  - [x] Return `{ sent: number, failed: number, errors: PushError[] }`

- [x] Task 4: Create `send-notifications` Edge Function (AC: #5)
  - [x] Create `apps/supabase/supabase/functions/send-notifications/index.ts`
  - [x] Accept `{ type: 'match-builder-open' | 'results-ready', payload?: Record<string, unknown> }` in request body
  - [x] Query `users` table for all rows with a non-null `push_token`
  - [x] For `match-builder-open`: title "Match Builder is Open 🏟️", body "Build your squad now — deadline approaching"
  - [x] For `results-ready`: title "Results Are In! 🎯", body "See how your picks scored this gameweek"
  - [x] Call `sendPushNotification` from `push-sender.ts` with all collected tokens
  - [x] Skip users with null/undefined push token gracefully
  - [x] Return `{ data: { sent, failed }, error: null }`

- [x] Task 5: Write tests (AC: #1–#5)
  - [x] Create `apps/supabase/supabase/tests/odds-converter.test.ts`
    - [x] Test: `convertOddsToPoints(1.2)` → 10 (clamped to MIN_BASE_POINTS)
    - [x] Test: `convertOddsToPoints(2.0)` → 40 (evens)
    - [x] Test: `convertOddsToPoints(3.0)` → 80
    - [x] Test: `convertOddsToPoints(10.0)` → 120 (clamped to MAX_BASE_POINTS)
    - [x] Test: result is always an integer (Number.isInteger)
    - [x] Test: `decimalOdds <= 1.0` returns MIN_BASE_POINTS (no negative points)
  - [x] Create `apps/supabase/supabase/tests/ingest-odds.test.ts`
    - [x] Mock `fetchOddsForGameweek` and Supabase client
    - [x] Test: success path → `game_week_moments` upserted, `gameweeks.status = 'Building'`, `send-notifications` invoked
    - [x] Test: API error → returns `ODDS_FETCH_FAILED`, status NOT updated, `console.error` called
    - [x] Test: raw odds are NEVER written to DB — only integer point values (NFR8 guard)
    - [x] Test: float conversion → result is integer (Math.round applied)
  - [x] Create `apps/supabase/supabase/tests/push-sender.test.ts`
    - [x] Mock `global.fetch` for Expo Push API
    - [x] Test: tokens batched in groups of ≤100
    - [x] Test: delivery failure does NOT throw — returns error in result object
    - [x] Test: empty token list → returns `{ sent: 0, failed: 0, errors: [] }`
  - [x] All new tests pass: `pnpm --filter @lecolpo/supabase test`
  - [x] No regressions in existing 53 tests

## Dev Notes

### What This Story Delivers

Three new Edge Functions and two new shared utilities:

```
apps/supabase/supabase/functions/
  ingest-odds/
    index.ts              ← NEW: Edge Function entry point
  send-notifications/
    index.ts              ← NEW: Edge Function entry point
  _shared/
    odds-converter.ts     ← NEW: converts decimal odds → integer points
    push-sender.ts        ← NEW: Expo Push API batching utility
    constants.ts          ← EXISTS — use ODDS_SCALE_FACTOR, MIN_BASE_POINTS, MAX_BASE_POINTS
    api-clients/
      odds-api.ts         ← EXISTS (Story 3.1) — call fetchOddsForGameweek()
      events-api.ts       ← EXISTS (Story 3.1) — do NOT touch
      http-client.ts      ← EXISTS (Story 3.1) — do NOT touch
    sentry.ts             ← EXISTS — do NOT modify

apps/supabase/supabase/tests/
  odds-converter.test.ts  ← NEW
  ingest-odds.test.ts     ← NEW
  push-sender.test.ts     ← NEW
  api-clients.test.ts     ← EXISTS — must NOT regress (53 passing tests)
```

### Critical: Use The Existing Formula — Do NOT Re-derive

`constants.ts` (Story 3.0) already exports `oddsToBasePoints(decimalOdds)` as the canonical reference implementation. `odds-converter.ts` (this story) should:

```typescript
import { ODDS_SCALE_FACTOR, MIN_BASE_POINTS, MAX_BASE_POINTS } from '../constants.ts';

export function convertOddsToPoints(decimalOdds: number): number {
  return Math.round(
    Math.min(Math.max((decimalOdds - 1) * ODDS_SCALE_FACTOR, MIN_BASE_POINTS), MAX_BASE_POINTS)
  );
}
```

This is the **same formula** as `oddsToBasePoints` in constants.ts — no deviation. Do NOT create a different calculation.

### Database: Tables Being Written

**`game_week_moments`** (upsert per fixture per event type):
- `gameweek_id` — FK to `gameweeks`
- `fixture_id` — FK to `fixtures`
- `moment_type_id` — FK to `moment_types` (event type: goal, corner, etc.)
- `points` — integer (the locked point value, derived from convertOddsToPoints)
- `is_locked` — boolean, set to `true` upon ingestion
- Check the actual Drizzle schema in `packages/types/src/` for exact column names

**`gameweeks`** (update status):
- `status` column: set to `'Building'` on successful ingest

> **IMPORTANT:** Check `packages/types/src/` for the actual Drizzle schema definitions before writing any DB code. Column names are snake_case in the DB but camelCase in TypeScript via Drizzle.

### Supabase Client in Edge Functions

Use this pattern for the Supabase admin client in Deno Edge Functions:

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);
```

- **Service role key** is required to bypass RLS for catalog writes — the service role key is available as `SUPABASE_SERVICE_ROLE_KEY` in the Edge Function runtime automatically (set by Supabase infrastructure).
- **Never** hardcode keys or use the anon key for admin writes.

### Expo Push API

The Expo Push API endpoint: `https://exp.host/--/api/v2/push/send`

Batch format (max 100 per request):
```typescript
const messages = tokens.map(token => ({
  to: token,
  title: 'Match Builder is Open 🏟️',
  body: 'Build your squad now — deadline approaching',
  sound: 'default',
}));

const response = await fetch('https://exp.host/--/api/v2/push/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
  body: JSON.stringify(messages),
});
```

Push tokens are stored in the `users` table `push_token` column (set by Story 2.3). Skip null/undefined tokens silently.

### Architecture Compliance Checklist

- [ ] `odds-converter.ts` uses ONLY constants from `constants.ts` — no magic numbers
- [ ] Raw decimal odds are NEVER written to any DB table (NFR8)
- [ ] `ingest-odds` is the ONLY Edge Function that calls `fetchOddsForGameweek` — no direct API calls elsewhere
- [ ] `send-notifications` is invoked via `supabase.functions.invoke()` — not via HTTP from the mobile client
- [ ] All functions return `{ data, error }` envelope — never throw to callers
- [ ] Error responses use `null` for data field (not `undefined`)
- [ ] `gameweeks.status` only set to `'Building'` AFTER successful catalog upsert — not before
- [ ] Point values stored in DB are integers — guard with `Number.isInteger()` assertion in tests

### Previous Story Learnings (from Story 3.1)

From the Story 3.1 dev record:
- The `api-clients/` subdirectory is within `functions/_shared/` at full path: `apps/supabase/supabase/functions/_shared/api-clients/`
- `"allowImportingTsExtensions": true` and `"noEmit": true` are already in `apps/supabase/tsconfig.json` — no tsconfig changes needed
- Use `.ts` extension on all relative imports in Deno files (e.g. `import { X } from '../constants.ts'`)
- Use `getEnv` helper pattern for dual Deno/Node compatibility in any file that reads env vars and will be tested with Jest
- Tests go in `apps/supabase/supabase/tests/` and run with Jest + ts-jest
- In test `afterEach`, restore mocks: `jest.restoreAllMocks()` + clean up `global.fetch` to avoid cross-test pollution
- All response objects use `null` (not `undefined`) for absent values

### Testing Strategy

Tests run in Jest/Node.js (not Deno). Mock strategy:

```typescript
// Mock Supabase client in ingest-odds tests
jest.mock('https://esm.sh/@supabase/supabase-js@2', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({ upsert: jest.fn().mockResolvedValue({ error: null }) })),
    functions: { invoke: jest.fn().mockResolvedValue({ error: null }) },
  })),
}));
```

For `push-sender.test.ts`:
```typescript
global.fetch = jest.fn();
// Mock 200 response from Expo API
(global.fetch as jest.Mock).mockResolvedValue({
  ok: true,
  json: async () => ({ data: [{ status: 'ok' }] }),
});
```

Run tests: `pnpm --filter @lecolpo/supabase test`

### Project Structure Notes

- Edge Functions live at: `apps/supabase/supabase/functions/{function-name}/index.ts`
- Shared utilities live at: `apps/supabase/supabase/functions/_shared/`
- Tests live at: `apps/supabase/supabase/tests/`
- Drizzle schema (TypeScript source of truth): `packages/types/src/`
- DB migrations: `apps/supabase/migrations/` (no new migration required for this story — `game_week_moments` table was created in Story 1.3)

### References

- [Source: epics.md#Story 3.2] — Full acceptance criteria
- [Source: architecture.md#AR6] — API keys from Edge Function secrets only
- [Source: architecture.md#AR7] — Six Edge Functions; shared utilities in `functions/_shared/`
- [Source: architecture.md#NFR8] — Raw odds never stored or exposed
- [Source: architecture.md#NFR15] — Odds API retry tolerance (handled by Story 3.1 http-client.ts)
- [Source: implementation-artifacts/3-0-odds-to-points-formula-design-and-calibration.md] — constants.ts formula reference
- [Source: implementation-artifacts/3-1-external-api-client-infrastructure.md] — api-clients/ interfaces and patterns

## Dev Agent Record

### Agent Model Used

GitHub Copilot (GPT-4.1)

### Debug Log References

- Fixed `moduleNameMapper` in package.json to redirect `https://esm.sh/@supabase/supabase-js@2` → installed package for Jest resolution
- Added `paths` to tsconfig.json for TypeScript type resolution of the same ESM URL
- Guarded `Deno.serve(...)` with `typeof Deno !== 'undefined'` check so edge function files can be imported in Node/Jest
- Expanded tsconfig `include` to cover `supabase/functions/**/*.ts`
- Fixed push-sender test: replaced `expect().not.toThrow()` async pattern (which loses return value) with direct `await`
- `gameweeks.status` value is `'building'` (lowercase) per DB constraint in schema — story text says `'Building'` but DB enforces lowercase

### Completion Notes List

- ✅ `odds-converter.ts`: Implements exact formula from `constants.ts` — uses `ODDS_SCALE_FACTOR`, `MIN_BASE_POINTS`, `MAX_BASE_POINTS`, no magic numbers. Input ≤1.0 clamped to MIN_BASE_POINTS. Always returns integer.
- ✅ `ingest-odds/index.ts`: Core logic extracted to `handleIngestOdds()` (exported for testability). Deno entry point guarded. Fetches odds → converts to integer points → upserts `game_week_moments` → sets `gameweeks.status = 'building'` → invokes `send-notifications`. Raw odds never persisted (NFR8). Error path returns `ODDS_FETCH_FAILED` without touching DB.
- ✅ `push-sender.ts`: Batches tokens ≤100. Best-effort: delivery failures returned in result, never thrown. Returns `{ sent, failed, errors }`.
- ✅ `send-notifications/index.ts`: Queries users with non-null push_token, dispatches via `sendPushNotification`. Supports `match-builder-open` and `results-ready` notification types.
- ✅ All 71 tests pass (53 existing + 18 new). Zero regressions.

### File List

- `apps/supabase/supabase/functions/_shared/odds-converter.ts` — NEW
- `apps/supabase/supabase/functions/_shared/push-sender.ts` — NEW
- `apps/supabase/supabase/functions/ingest-odds/index.ts` — NEW
- `apps/supabase/supabase/functions/send-notifications/index.ts` — NEW
- `apps/supabase/supabase/tests/odds-converter.test.ts` — NEW
- `apps/supabase/supabase/tests/ingest-odds.test.ts` — NEW
- `apps/supabase/supabase/tests/push-sender.test.ts` — NEW
- `apps/supabase/tsconfig.json` — MODIFIED (added paths, expanded include)
- `apps/supabase/package.json` — MODIFIED (added moduleNameMapper)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — MODIFIED (status: review)

### Review Findings

- [x] [Review][Patch] `push-sender.ts:94-96` — Orphaned tickets (fewer tickets than tokens) silently counted as `sent`; fixed to count as `failed` with error entry — **applied**
- [x] [Review][Patch] `push-sender.ts:83-91` — Tickets longer than batch could over-count `sent`; clamped with `.slice(0, batchTokens.length)` — **applied**
- [x] [Review][Patch] `push-sender.test.ts` — `global.fetch` direct assignment not reliably cleaned up by `jest.restoreAllMocks()`; replaced with `jest.spyOn` — **applied**
- [x] [Review][Patch] `push-sender.test.ts` — Batch test used static 100-ticket mock for all batches including 50-token last batch; replaced with dynamic mock + added `sent`/`failed` assertions + new orphan test case — **applied**
- [x] [Review][Defer] `body` parameter name shadowed by fetch options `body` property — naming only, no runtime bug — deferred
- [x] [Review][Defer] `response.json()` may throw on non-JSON 2xx responses — caught gracefully, extremely rare — deferred
- [x] [Review][Defer] No retry/backoff on HTTP 429 — feature gap, not in scope for MVP — deferred

