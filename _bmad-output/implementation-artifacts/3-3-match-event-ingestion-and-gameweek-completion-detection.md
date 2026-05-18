# Story 3.3: Match Event Ingestion & Gameweek Completion Detection

Status: done

## Story

As a **system**,
I want to fetch match events after each match completes and detect when the full gameweek is done,
So that the scoring engine is triggered automatically once all data is available.

## Acceptance Criteria

1. **Given** the `ingest-events` Edge Function is invoked for a specific fixture **When** it runs successfully **Then** it fetches goals, cards, substitutions, and corners — each with player identity and minute **And** all events are stored in `match_events` as `(match_id, event_type, player_id, minute, team_id, created_at)` rows **And** the fixture is marked `events_ingested = true` in the `fixtures` table.

2. **Given** a match event is stored in `match_events` **When** it is later queried by two different consumers **Then** the scoring engine (Epic 4) and the historical stat dots feature (Epic 5) both read from this same table — no separate storage needed.

3. **Given** `ingest-events` completes for a fixture **When** it checks the gameweek **Then** if all fixtures have `events_ingested = true`, it invokes `run-scoring` via `supabase.functions.invoke()` — not via HTTP from mobile **And** if any fixture is still pending, it exits without invoking scoring.

4. **Given** event data is missing or delayed beyond 2 hours post-match **When** the threshold is exceeded **Then** a record is inserted into `scoring_errors` flagging the fixture for manual intervention.

5. **Given** a match is postponed **When** `ingest-events` processes that fixture **Then** the fixture is marked postponed in `fixtures` (`is_postponed = true`) **And** associated prediction tokens for that fixture score 0 points (FR29).

## Tasks / Subtasks

- [x] Task 1: Create `ingest-events` Edge Function core handler (AC: #1, #3, #5)
  - [x] Create `apps/supabase/supabase/functions/ingest-events/index.ts`
  - [x] Export `handleIngestEvents(fixtureId: number, supabase: SupabaseClientLike): Promise<IngestEventsResult>` for testability
  - [x] Accept `{ fixtureId: number, isPostponed?: boolean, eventTimestamp?: string }` in Deno entry request body
  - [x] Lookup fixture in DB by `id`; return `FIXTURE_NOT_FOUND` error if missing
  - [x] If `isPostponed = true`: set `fixtures.is_postponed = true`, skip event fetch, proceed to gameweek completion check
  - [x] Call `fetchMatchEvents(fixture.external_id)` from `../_shared/api-clients/events-api.ts`
  - [x] On API error: log via `console.error`, return `{ error: { code: 'EVENTS_FETCH_FAILED', message } }`, do NOT mark `events_ingested`
  - [x] Map each `MatchEventData` → `match_events` insert row using DB column names (`match_id`, `event_type`, `player_id`, `minute`, `team_id`, `extra_data`)
  - [x] Insert all events into `match_events` (bulk insert in one operation)
  - [x] Set `fixtures.events_ingested = true` ONLY after successful insert
  - [x] Return `{ data: { fixtureId, eventsInserted: number }, error: null }` on success

- [x] Task 2: Gameweek completion detection and scoring chain (AC: #3)
  - [x] After marking fixture `events_ingested = true`, query `fixtures` table for all fixtures in the same `gameweek_id`
  - [x] Check if ALL fixtures in the gameweek have `events_ingested = true` OR `is_postponed = true` (postponed fixtures don't block scoring)
  - [x] If gameweek is NOT complete: log and return — do NOT invoke `run-scoring`
  - [x] If gameweek IS complete: invoke `run-scoring` via `supabase.functions.invoke('run-scoring', { body: { gameweekId } })`
  - [x] Note: `run-scoring` is a stub/placeholder at this point (built in Epic 4) — invocation must still be implemented and tested via mock
  - [x] Log outcome via `console.log`: `[ingest-events] Gameweek ${gameweekId} complete — run-scoring invoked` or `[ingest-events] Gameweek ${gameweekId} not yet complete — ${pendingCount} fixtures pending`

- [x] Task 3: Delayed data / manual intervention flag (AC: #4)
  - [x] Accept optional `eventTimestamp` in request body (ISO 8601 string — the expected match end time)
  - [x] If `eventTimestamp` is provided AND current time > eventTimestamp + 2 hours AND `events_ingested` is still false: insert a `scoring_errors` row
  - [x] `scoring_errors` insert: `{ gameweek_id, error_code: 'EVENTS_DELAYED', error_message: 'Event data missing 2h post-match', context: { fixture_id, external_id, expected_at: eventTimestamp } }`
  - [x] Log `console.error` for the same condition
  - [x] Return `{ error: { code: 'EVENTS_DELAYED', message: ... } }` — do NOT attempt to proceed with ingestion

- [x] Task 4: Write tests (AC: #1–#5)
  - [x] Create `apps/supabase/supabase/tests/ingest-events.test.ts`
  - [x] Mock `fetchMatchEvents` from `events-api.ts` and the Supabase client
  - [x] Test: success path — events inserted into `match_events`, `fixtures.events_ingested = true`, returns `{ data: { fixtureId, eventsInserted }, error: null }`
  - [x] Test: API error → returns `EVENTS_FETCH_FAILED`, `events_ingested` NOT updated, `console.error` called
  - [x] Test: postponed fixture → `is_postponed = true` set, no event fetch, proceeds to completion check
  - [x] Test: gameweek completion check — all fixtures `events_ingested` → `run-scoring` invoked
  - [x] Test: gameweek completion check — one fixture still pending → `run-scoring` NOT invoked
  - [x] Test: postponed fixtures count as "complete" for gameweek completion detection
  - [x] Test: delayed data (2h threshold exceeded) → `scoring_errors` row inserted, returns `EVENTS_DELAYED`
  - [x] Test: fixture not found → returns `FIXTURE_NOT_FOUND` error
  - [x] All new tests pass: `pnpm --filter @lecolpo/supabase test`
  - [x] No regressions in existing 71 tests

## Dev Notes

### What This Story Delivers

One new Edge Function:

```
apps/supabase/supabase/functions/
  ingest-events/
    index.ts              ← NEW: Edge Function entry point
  _shared/
    api-clients/
      events-api.ts       ← EXISTS (Story 3.1) — call fetchMatchEvents(fixtureExternalId)
      http-client.ts      ← EXISTS — do NOT touch
      odds-api.ts         ← EXISTS — do NOT touch
    constants.ts          ← EXISTS — do NOT modify
    odds-converter.ts     ← EXISTS — do NOT touch
    push-sender.ts        ← EXISTS — do NOT touch
    sentry.ts             ← EXISTS — do NOT touch
  ingest-odds/
    index.ts              ← EXISTS — reference for handler pattern only
  send-notifications/
    index.ts              ← EXISTS — do NOT touch

apps/supabase/supabase/tests/
  ingest-events.test.ts   ← NEW
  (all others)            ← EXISTS — must NOT regress (71 passing tests)
```

### Critical: Follow the Established Handler Pattern

Model `handleIngestEvents` exactly after `handleIngestOdds` in `ingest-odds/index.ts`:
- Export a pure `handle*` function taking `(input, supabaseClient)` — this is what tests call
- Guard `Deno.serve(...)` with `if (typeof Deno !== 'undefined')` — required for Jest/Node compatibility
- Use `.ts` extensions on all relative imports in Deno files (e.g. `import { X } from '../_shared/events-api.ts'`)
- ESM URL import for Supabase: `import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'`
- All DB operations use Supabase admin client (service role key) — same pattern as ingest-odds

### SupabaseClientLike Interface

Extend the same `SupabaseClientLike` interface from `ingest-odds/index.ts` or define a compatible one. It needs:

```typescript
export interface SupabaseClientLike {
  from: (table: string) => any;
  functions: {
    invoke: (name: string, opts?: { body?: unknown }) => Promise<{ error: unknown }>;
  };
}
```

### Database Tables Being Read and Written

**Reading `fixtures`:**
```typescript
// Lookup by id
supabase.from('fixtures').select('id, external_id, gameweek_id, is_postponed, events_ingested').eq('id', fixtureId).single()

// Completion check — all fixtures in gameweek
supabase.from('fixtures').select('id, events_ingested, is_postponed').eq('gameweek_id', gameweekId)
```

**Writing `fixtures`:**
```typescript
// Mark ingested
supabase.from('fixtures').update({ events_ingested: true }).eq('id', fixtureId)

// Mark postponed
supabase.from('fixtures').update({ is_postponed: true }).eq('id', fixtureId)
```

Drizzle schema reference (`packages/types/src/schema/fixtures.ts`):
- `id: serial` (PK)
- `gameweek_id: integer` (FK to gameweeks)
- `external_id: text` (unique — used by `fetchMatchEvents`)
- `kickoff_at: timestamptz`
- `is_postponed: boolean` (default false)
- `is_void: boolean` (default false)
- `events_ingested: boolean` (default false)

**Writing `match_events`:**
```typescript
// Bulk insert — one operation
supabase.from('match_events').insert(eventRows)
```

`match_events` DB columns (`packages/types/src/schema/matchEvents.ts`):
- `id: serial` (PK, auto)
- `match_id: integer` — this is `fixtures.id` (the internal DB id, NOT `external_id`)
- `event_type: text` — 'goal' | 'substitution' | 'corner' | 'yellow_card' | 'red_card'
- `player_id: text`
- `minute: integer`
- `team_id: text`
- `extra_data: jsonb` (nullable — assister, player_on, player_off, zone)
- `created_at: timestamptz` (auto)

**MatchEventData → match_events row mapping:**
```typescript
// events-api.ts returns MatchEventData[]
// Map to DB rows:
const eventRows = events.map(e => ({
  match_id: fixtureDbId,         // internal DB fixtures.id (not external_id)
  event_type: e.eventType,
  player_id: e.playerId,
  minute: e.minute,
  team_id: e.teamId,
  extra_data: e.extraData ?? null,  // null, not undefined (null rule)
}));
```

**Writing `scoring_errors`:**
```typescript
supabase.from('scoring_errors').insert({
  gameweek_id: gameweekId,
  error_code: 'EVENTS_DELAYED',
  error_message: 'Event data missing 2h post-match for fixture',
  context: { fixture_id: fixtureId, external_id: fixture.externalId, expected_at: eventTimestamp },
})
```

Drizzle schema (`packages/types/src/schema/admin.ts`):
- `id: serial` (PK)
- `gameweek_id: integer` (FK)
- `error_code: text`
- `error_message: text`
- `context: jsonb` (nullable)

### Gameweek Completion Logic

```typescript
// After marking events_ingested = true for the current fixture:
const { data: allFixtures, error } = await supabase
  .from('fixtures')
  .select('id, events_ingested, is_postponed')
  .eq('gameweek_id', gameweekId);

// A fixture "counts" as done if events_ingested OR is_postponed
const gameweekComplete = allFixtures.every(f => f.events_ingested || f.is_postponed);

if (gameweekComplete) {
  const { error: scoringError } = await supabase.functions.invoke('run-scoring', {
    body: { gameweekId },
  });
  if (scoringError) {
    console.error('[ingest-events] run-scoring invocation failed:', scoringError);
  }
}
```

### Delayed Data Detection (2-hour window)

This check happens at the START of `handleIngestEvents`, before any fetch:

```typescript
if (eventTimestamp) {
  const expectedEnd = new Date(eventTimestamp).getTime();
  const now = Date.now();
  const twoHoursMs = 2 * 60 * 60 * 1000;

  if (now > expectedEnd + twoHoursMs) {
    // Insert scoring_errors row + console.error + return EVENTS_DELAYED
  }
}
```

### Testing Strategy

Tests run in Jest/Node.js (not Deno). Follow the exact same mock pattern as `ingest-odds.test.ts`.

```typescript
// Mock the events-api module
jest.mock('../functions/_shared/api-clients/events-api', () => ({
  fetchMatchEvents: jest.fn(),
}));

// Mock Supabase client
function makeMockSupabase(overrides?: Partial<SupabaseClientLike>): SupabaseClientLike {
  return {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockResolvedValue({ error: null }),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { id: 1, external_id: 'fixture-ext-1', gameweek_id: 10, is_postponed: false, events_ingested: false }, error: null }),
    })),
    functions: {
      invoke: jest.fn().mockResolvedValue({ error: null }),
    },
    ...overrides,
  };
}
```

**Key test scenario for completion detection (all fixtures done):**
```typescript
// Mock: fixture query returns ALL with events_ingested=true
supabase.from('fixtures').select(...).eq('gameweek_id', 10)
// → [{ id: 1, events_ingested: true, is_postponed: false }, { id: 2, events_ingested: true, is_postponed: false }]
// Expect: supabase.functions.invoke called with 'run-scoring'
```

**Key test for postponed fixture counting as done:**
```typescript
// Mock: gameweek has 2 fixtures; fixture-1 events_ingested=true, fixture-2 is_postponed=true
// Expect: run-scoring IS invoked (gameweek considered complete)
```

Run with: `pnpm --filter @lecolpo/supabase test`

### Architecture Compliance Checklist

- [ ] `fetchMatchEvents` is the ONLY way events data enters the system — no direct API calls
- [ ] `match_events.match_id` = internal `fixtures.id` (NOT external_id) — must lookup fixture first
- [ ] `extra_data` stored as `null` when no extra data (not `undefined`)
- [ ] `run-scoring` invoked ONLY via `supabase.functions.invoke()` — never HTTP from mobile
- [ ] `events_ingested = true` set ONLY after successful DB insert — not before
- [ ] All functions return `{ data, error }` envelope — never throw to callers
- [ ] No `console.log` — only `console.error` for caught errors

### Previous Story Learnings (from Story 3.2)

- Use `typeof Deno !== 'undefined'` guard around `Deno.serve(...)` for Jest compatibility
- `"allowImportingTsExtensions": true` already in `apps/supabase/tsconfig.json` — no tsconfig changes needed
- Use `.ts` extension on relative imports in Deno files: `import { X } from '../constants.ts'`
- Use `getEnv` helper (from `http-client.ts`) for dual Deno/Node env var access in files that will be tested
- In test `afterEach`, always `jest.restoreAllMocks()` to avoid cross-test pollution
- All response objects use `null` (not `undefined`) for absent values
- `gameweeks.status` DB value is lowercase (e.g. `'building'`), not PascalCase — always match DB constraints

### Project Structure Notes

- Edge Functions live at: `apps/supabase/supabase/functions/{function-name}/index.ts`
- Shared utilities live at: `apps/supabase/supabase/functions/_shared/`
- Tests live at: `apps/supabase/supabase/tests/`
- Drizzle schema (TypeScript source of truth): `packages/types/src/schema/`
- No new DB migration required — `match_events` and `fixtures.events_ingested` column exist from Story 1.3
- The `scoring_errors` table also exists from Story 1.3

### References

- [Source: epics.md#Story 3.3] — Full acceptance criteria
- [Source: architecture.md#AR7] — Edge Functions; `run-scoring` invoked via `supabase.functions.invoke()` not HTTP
- [Source: architecture.md#AR9] — Event-driven chain: all events ingested → auto-invoke scoring
- [Source: architecture.md#NFR16] — 2hr delay threshold before flagging for manual intervention
- [Source: architecture.md#NFR22] — Postponed match handling without corrupting other data
- [Source: packages/types/src/schema/fixtures.ts] — `events_ingested`, `is_postponed` columns
- [Source: packages/types/src/schema/matchEvents.ts] — `match_events` table schema
- [Source: packages/types/src/schema/admin.ts] — `scoring_errors` table schema
- [Source: implementation-artifacts/3-2-odds-ingestion-and-moment-catalog-generation.md] — Handler pattern, mock patterns, Deno guard
- [Source: implementation-artifacts/3-1-external-api-client-infrastructure.md] — `fetchMatchEvents` interface

## Dev Agent Record

### Agent Model Used

GitHub Copilot (GPT-4.1)

### Debug Log References

- Initial "does not throw" test failed because `fetchMatchEvents` mock rejection propagated uncaught. Fixed by wrapping `_handleIngestEventsInner` in a top-level try/catch in the public `handleIngestEvents` export — consistent with architecture's "never throw to callers" rule.

### Completion Notes List

- ✅ `ingest-events/index.ts`: Implements `handleIngestEvents` with public try/catch wrapper + private `_handleIngestEventsInner`. Steps: (0) 2h delay check → EVENTS_DELAYED + scoring_errors insert, (1) fixture lookup → FIXTURE_NOT_FOUND, (2) postponed path → sets is_postponed, triggers completion check, (3) fetchMatchEvents → EVENTS_FETCH_FAILED on error, (4) bulk insert into match_events with extra_data=null (not undefined), (5) sets events_ingested=true ONLY after successful insert, (6) gameweek completion check → invokes run-scoring if ALL fixtures events_ingested OR is_postponed.
- ✅ Deno entry point guarded with `typeof Deno !== 'undefined'` — Jest/Node compatible.
- ✅ `checkAndTriggerScoring` is a standalone private function — postponed fixtures count as done; pending count logged.
- ✅ All 83 tests pass (71 existing + 12 new). Zero regressions.

### File List

- `apps/supabase/supabase/functions/ingest-events/index.ts` — NEW
- `apps/supabase/supabase/tests/ingest-events.test.ts` — NEW
- `_bmad-output/implementation-artifacts/3-3-match-event-ingestion-and-gameweek-completion-detection.md` — MODIFIED (story tracking)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — MODIFIED (status: review)

### Change Log

- 2026-05-18: Implemented `ingest-events` Edge Function — event ingestion, gameweek completion detection, scoring chain trigger, 2h delay flag, postponed handling. 12 new tests, zero regressions.

## Tasks / Subtasks — Review Findings

- [x] [Review][Decision] `console.error` used for informational log lines — **Resolved: changed to `console.log`, spec updated.**
- [x] [Review][Patch] `run-scoring` invoke failure silently returns success — **Fixed: `checkAndTriggerScoring` now returns error; callers surface it.**
- [x] [Review][Patch] `eventTimestamp` NaN bypass — **Fixed: NaN guard added; invalid ISO logs error and skips delay check.**
- [x] [Review][Patch] `events_ingested` guard missing in EVENTS_DELAYED path — **Fixed: delay flag skipped if fixture already ingested.**
- [x] [Review][Patch] `scoring_errors` insert failure silently swallowed — **Fixed: error checked and logged.**
- [x] [Review][Patch] Zero-events path not tested — **Fixed: test added.**
- [x] [Review][Defer] `SupabaseClientLike.from` typed as `any` [`index.ts:18`] — deferred, pre-existing (inherited from ingest-odds pattern)
- [x] [Review][Defer] Double-invocation race — two concurrent completions can both pass `every()` before either writes `events_ingested=true`, triggering double-scoring; no idempotency guard [`index.ts:184, 196`] — deferred, pre-existing architectural concern; requires DB-level fix (advisory lock or `scoring_triggered` flag on gameweeks) outside this story's scope

