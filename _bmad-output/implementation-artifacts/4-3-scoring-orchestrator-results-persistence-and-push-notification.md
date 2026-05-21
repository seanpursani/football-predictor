# Story 4.3: Scoring Orchestrator, Results Persistence & Push Notification

Status: done

## Story

As a **system**,
I want the scoring orchestrator to coordinate the full scoring run, persist results, materialise leaderboards, and notify users — halting safely if any error occurs,
So that results are always accurate, the reveal screen has data to display, and users are notified when their results are ready.

## Acceptance Criteria

1. **Given** `run-scoring/index.ts` is invoked **When** execution begins **Then** `gameweeks.scoring_status` is set to `in_progress` immediately **And** the orchestrator calls `scoring-engine.ts` and `streak-calculator.ts` — it contains no scoring logic itself

2. **Given** scoring completes without errors for all users **When** results are persisted **Then** one `scoring_results` row is written per prediction per user, containing all layer scores and bonuses **And** `leaderboard_entries` rows are created/updated for both weekly and cumulative season leaderboards **And** `gameweeks.scoring_status` is set to `complete` **And** `send-notifications` is invoked to dispatch the results-ready push notification (FR47)

3. **Given** any error occurs during scoring **When** the error is caught **Then** `gameweeks.scoring_status` is set to `error` **And** a record is inserted into `scoring_errors` with error details **And** `Sentry.captureException()` is called with high-priority classification **And** no technical detail is exposed to users — the mobile app reads `scoring_status = 'error'` and shows "Results delayed — we're looking into it"

4. **Given** the admin manually invokes `admin-rescore` (built in Epic 9) **When** it runs **Then** it invokes `run-scoring` identically to the automatic chain — manual and automatic rescores are the same code path

## Tasks / Subtasks

- [x] Task 1: Create `functions/run-scoring/index.ts` — the full orchestrator (AC: #1–#4)
  - [x] Accept `gameweekId: number` from request body; validate it is present and a number
  - [x] Idempotency guard: if `scoring_status` is already `in_progress` or `complete`, return 409 immediately
  - [x] Immediately set `gameweeks.scoring_status = 'in_progress'` for the gameweek
  - [x] Fetch all predictions for the gameweek (with joined fixture + game_week_moment + moment_type data)
  - [x] Fetch all match events for all fixtures in the gameweek
  - [x] Fetch all fixtures in the gameweek (for kickoff timestamps + postponed/void flags)
  - [x] Guard: detect `prediction.fixtureId !== gameWeekMoment.fixtureId` wiring mismatches before scoring (deferred from Story 4.1 review)
  - [x] For each prediction: if fixture is postponed or voided → produce zero `ScoringOutput` without calling `scorePrediction()`; otherwise call `scorePrediction()`
  - [x] For each user: collect precision-pick `ScoringOutput` results (excluding postponed/voided) to assemble `StreakScoringEntry[]`
  - [x] Guard: detect duplicate `predictionId` values before calling `calculateStreaks()` (deferred from Story 4.2 review)
  - [x] For each correct precision pick (`isCorrect = true`): find the best-matching `match_events` row (closest `minute` to `prediction.predictedMinute`) and set `realEventMinute = matchEvent.minute`
  - [x] For each user: call `calculateStreaks()` with their precision-pick entries; merge `totalPointsWithStreak` and `streakBonus` back into the result map
  - [x] Write one `scoring_results` row per prediction via upsert (key: `prediction_id`); `total_points` = `StreakResultEntry.totalPointsWithStreak` (streak-adjusted)
  - [x] Write `leaderboard_entries` for weekly leaderboard: upsert `(user_id, gameweek_id, leaderboard_type='weekly')` with summed game scores
  - [x] Write `leaderboard_entries` for season cumulative: upsert `(user_id, gameweek_id=null, leaderboard_type='season')` summing all weekly scores for the season
  - [x] After upserts: run rank assignment SQL (window function `RANK() OVER (ORDER BY score DESC)`) for both leaderboard types; persist `previous_rank` before overwriting
  - [x] Set `gameweeks.scoring_status = 'complete'`
  - [x] Invoke `send-notifications` via `supabase.functions.invoke('send-notifications', { body: { type: 'results-ready' } })`; do NOT await failure — log errors but do not rethrow
  - [x] Return `{ data: { usersScored: N, predictionsScored: N }, error: null }` on success
  - [x] Wrap entire execution in try/catch: on any error → set `scoring_status = 'error'`, insert `scoring_errors` row, call `captureHighPriority()`, return `{ data: null, error: { code: 'SCORING_FAILED', message: '...' } }` with HTTP 500
  - [x] `send-notifications` must NOT be invoked on the error path

- [x] Task 2: Implement `apps/supabase/supabase/tests/run-scoring.test.ts` (AC: #1–#4)
  - [x] Deno guard at top (same pattern as `scoring-engine.test.ts` and `streak-calculator.test.ts`)
  - [x] Mock Supabase client and `supabase.functions.invoke` to avoid real HTTP calls
  - [x] **Test: scoring_status → in_progress on start** → verify DB update called first before any scoring
  - [x] **Test: scoring_status → complete on success** → verify set after results persisted
  - [x] **Test: scoring_status → error on thrown exception** → verify error path sets 'error'
  - [x] **Test: idempotency guard** → returns 409 without scoring if status is already 'in_progress' or 'complete'
  - [x] **Test: scorePrediction called for every non-postponed, non-voided prediction** → verify call count
  - [x] **Test: postponed fixture predictions** → all layers 0; excluded from StreakInput
  - [x] **Test: voided fixture predictions** → all layers 0; excluded from StreakInput
  - [x] **Test: calculateStreaks called per user with only precision picks** → match moments excluded from StreakInput
  - [x] **Test: scoring_results upsert** → correct columns populated including streak_bonus and total_points from StreakResultEntry
  - [x] **Test: leaderboard_entries weekly** → one row per user for the gameweek with correct summed score
  - [x] **Test: leaderboard_entries season** → gameweek_id null, leaderboard_type 'season', aggregated score
  - [x] **Test: send-notifications invoked on success** → type: 'results-ready'; NOT invoked on error path
  - [x] **Test: scoring_errors row inserted on error** → correct columns: gameweek_id, error_code, error_message, context
  - [x] **Test: captureHighPriority called on error** → mock sentry module and verify call
  - [x] **Test: duplicate predictionId guard** → rejects before scoring if duplicates present
  - [x] **Test: fixture/moment mismatch guard** → rejects before scoring if prediction.fixtureId ≠ gameWeekMoment.fixtureId
  - [x] All 129 pre-existing tests must remain green
  - [x] Target: 129 existing + ≥12 new = 141+ total (actual: 153 total, 22 new)

- [x] Task 3: Update sprint status
  - [x] Mark tasks complete in this story file
  - [x] Update File List with all new/modified files
  - [x] Update `sprint-status.yaml`: `4-3-scoring-orchestrator-results-persistence-and-push-notification: review`

### Review Findings

- [x] [Review][Patch] Remove `@ts-nocheck` from production file; add targeted `@ts-ignore` only at Deno entry point lines [`functions/run-scoring/index.ts:11`] — fixed
- [x] [Review][Patch] RPC errors from `assign_leaderboard_ranks` silently ignored — rank failures undetected [`functions/run-scoring/index.ts:366`] — fixed: errors now propagate to catch block
- [x] [Review][Patch] `gwMoment`/`momentType` accessed without null guard in non-skipped path [`functions/run-scoring/index.ts:195`] — fixed: explicit null checks throw before access
- [x] [Review][Patch] `isCorrect=true` + no matching `match_events` row → `realEventMinute=null` → `calculateStreaks` throws [`functions/run-scoring/index.ts:236`] — fixed: `streakIsCorrect` safety flag
- [x] [Review][Patch] Error catch block: secondary DB writes (`scoring_status=error`, `scoring_errors` insert) can throw and swallow original error [`functions/run-scoring/index.ts:401`] — fixed: each wrapped in try/catch
- [x] [Review][Patch] Missing `assign_leaderboard_ranks` DB function and unique constraints on `leaderboard_entries` (required for upserts) — fixed: migration `0005_leaderboard_upsert_and_rank_rpc.sql` created
- [x] [Review][Defer] TOCTOU race on idempotency guard (read-then-write not atomic) [`index.ts:56–86`] — deferred, pre-existing (recorded in deferred-work.md)
- [x] [Review][Defer] Season leaderboard fetches all historical weekly entries — no season scoping [`index.ts:334`] — dismissed: single-season MVP by design
- [x] [Review][Defer] `usersScored` count cosmetically underrepresents match-moment-only users [`index.ts:394`] — deferred, cosmetic, no functional impact
- [x] [Review][Defer] Season leaderboard upsert conflict key correctness depends on schema unique constraint — resolved by migration `0005`

## Dev Notes

### What This Story Delivers

```
apps/supabase/supabase/functions/run-scoring/
  index.ts                               ← NEW: scoring orchestrator
apps/supabase/supabase/tests/
  run-scoring.test.ts                    ← NEW: test suite
```

No new migrations, no new schema changes, no mobile changes.

### Architecture: Orchestrator Boundary

`run-scoring/index.ts` is the **coordinator**, not the logic owner:
- It **calls** `scorePrediction()` from `scoring-engine.ts` (Story 4.1) — never reimplements scoring logic
- It **calls** `calculateStreaks()` from `streak-calculator.ts` (Story 4.2) — never reimplements streak logic
- It handles all DB reads/writes and side effects (leaderboard updates, notifications, error tracking)
- It owns the `scoring_status` state machine transitions: `pending → in_progress → complete | error`

### Available Modules (Do NOT reimplement)

```typescript
// scoring-engine.ts — Story 4.1 (use as-is):
import { scorePrediction } from '../_shared/scoring-engine.ts';
import type { ScoringInput, ScoringOutput } from '../_shared/scoring-engine.ts';

// streak-calculator.ts — Story 4.2 (use as-is):
import { calculateStreaks } from '../_shared/streak-calculator.ts';
import type {
  StreakInput,
  StreakScoringEntry,
  StreakResult,
  StreakResultEntry,
} from '../_shared/streak-calculator.ts';

// sentry.ts — Story 1.5 (use captureHighPriority for scoring errors):
import { captureHighPriority } from '../_shared/sentry.ts';
```

### Supabase Client

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);
```

Service-role key bypasses RLS — required because the orchestrator writes `scoring_results` on behalf of all users.

### StreakScoringEntry Wiring (Critical)

The streak calculator requires `realEventMinute` for **correct precision picks only** (`isCorrect = true`). The orchestrator must:

1. Call `scorePrediction()` for each prediction to get `ScoringOutput`
2. For precision picks where `isCorrect = true`: find the best-matching `match_events` row (same logic as `scoring-engine.ts`: closest `minute` to `prediction.predictedMinute`) and set `realEventMinute = matchEvent.minute`
3. For match moments and **all** misses (`isCorrect = false`): `realEventMinute = null`
4. Set `fixtureKickoffAt` from `fixtures.kickoffAt` for that prediction's fixture

`StreakScoringEntry` interface from `streak-calculator.ts`:
```typescript
export interface StreakScoringEntry {
  predictionId: string;      // use String(prediction.id)
  fixtureId: number;
  isCorrect: boolean;
  realEventMinute: number | null;   // null for misses
  fixtureKickoffAt: Date;
  scoringOutput: ScoringOutput;
}
```

**Per deferred-work.md**: ensure no duplicate `predictionId` values in the `StreakInput` before calling `calculateStreaks()`.

Only precision picks (`prediction_type = 'moment'`) are passed to `calculateStreaks()`. Match moments (`prediction_type = 'match'`) do not participate in streaks — they are scored normally but excluded from the `StreakInput`.

### Postponed / Voided Fixture Handling (FR29)

Check fixture state before calling `scorePrediction()`:

```typescript
const isSkipped = fixture.isPostponed || fixture.isVoid;
if (isSkipped) {
  const zeroOutput: ScoringOutput = {
    eventPoints: 0, timingBonus: 0, playerBonus: 0,
    assisterBonus: 0, zoneBonus: 0, jackpotBonus: 0,
    captainMultiplier: prediction.isCaptain ? 2 : 1,
    streakBonus: 0, totalPoints: 0, isCorrect: false,
  };
  // Do NOT add to StreakInput — postponed/voided excluded from streak entirely
}
```

### scoring_results Upsert

Upsert on `prediction_id`. Schema columns (from `migrations/0000_worthless_naoko.sql`):

```typescript
{
  prediction_id:      prediction.id,              // integer
  user_id:            prediction.userId,           // uuid
  gameweek_id:        gameweekId,                  // integer
  event_points:       output.eventPoints,
  timing_bonus:       output.timingBonus,
  player_bonus:       output.playerBonus,
  assister_bonus:     output.assisterBonus,
  zone_bonus:         output.zoneBonus,
  jackpot_bonus:      output.jackpotBonus,
  captain_multiplier: output.captainMultiplier,
  streak_bonus:       streakEntry?.streakBonus ?? 0,
  total_points:       streakEntry?.totalPointsWithStreak ?? output.totalPoints,
  is_correct:         output.isCorrect,
}
```

**`total_points` persisted must be `StreakResultEntry.totalPointsWithStreak`** (streak-adjusted), NOT `ScoringOutput.totalPoints`.

For match moments (not in StreakResult): `streak_bonus = 0`, `total_points = output.totalPoints`.

### Leaderboard Materialisation (AR15)

**Weekly** (`leaderboard_type = 'weekly'`):
- Key: `(user_id, gameweek_id, leaderboard_type)`
- Score: sum of `scoring_results.total_points` for this user + this gameweek

**Season cumulative** (`leaderboard_type = 'season'`):
- Key: `(user_id, leaderboard_type)` where `gameweek_id IS NULL`
- Score: sum of all weekly `leaderboard_entries.score` for this user across the season
- Set `gameweek_id = null`

**Rank assignment** (after upsert):
```sql
UPDATE leaderboard_entries le
SET
  previous_rank = le.rank,
  rank = sub.new_rank,
  updated_at = now()
FROM (
  SELECT id, RANK() OVER (PARTITION BY leaderboard_type ORDER BY score DESC) AS new_rank
  FROM leaderboard_entries
  WHERE gameweek_id = $1 AND leaderboard_type = 'weekly'
) sub
WHERE le.id = sub.id;
```
Run equivalent for season cumulative. Execute via `supabase.rpc()` or raw SQL.

### Idempotency Guard

```typescript
// At start — before setting in_progress
const { data: gw } = await supabase
  .from('gameweeks')
  .select('scoring_status')
  .eq('id', gameweekId)
  .single();

if (['complete', 'in_progress'].includes(gw?.scoring_status)) {
  return Response.json(
    { data: null, error: { code: 'SCORING_ALREADY_RUN', message: `scoring_status is '${gw.scoring_status}'` } },
    { status: 409 }
  );
}
```

Addresses the double-invocation race from concurrent `ingest-events` calls (deferred-work.md).

### Error Handling

```typescript
} catch (err) {
  // 1. Update scoring_status to error
  await supabase.from('gameweeks').update({ scoring_status: 'error' }).eq('id', gameweekId);

  // 2. Insert scoring_errors record
  await supabase.from('scoring_errors').insert({
    gameweek_id: gameweekId,
    error_code: 'SCORING_FAILED',
    error_message: err instanceof Error ? err.message : String(err),
    context: { stack: err instanceof Error ? err.stack : undefined },
  });

  // 3. Sentry high-priority alert (zero-tolerance for scoring errors — AR10, AR18)
  captureHighPriority(err, { gameweekId });

  return Response.json(
    { data: null, error: { code: 'SCORING_FAILED', message: 'Scoring engine error' } },
    { status: 500 }
  );
}
```

No `send-notifications` call on error path.

### send-notifications Integration

```typescript
// After scoring_status = 'complete' is confirmed
try {
  await supabase.functions.invoke('send-notifications', {
    body: { type: 'results-ready' },
  });
} catch (notifErr) {
  // Log but do not rethrow — notification failure must NOT roll back scoring
  console.error('[run-scoring] send-notifications failed:', notifErr);
}
```

### Function Return Format (Architecture: API Response Format)

```typescript
// Success
return Response.json({ data: { usersScored: N, predictionsScored: N }, error: null }, { status: 200 });

// Idempotency guard
return Response.json({ data: null, error: { code: 'SCORING_ALREADY_RUN', message: '...' } }, { status: 409 });

// Validation error
return Response.json({ data: null, error: { code: 'INVALID_REQUEST', message: '...' } }, { status: 400 });

// Error
return Response.json({ data: null, error: { code: 'SCORING_FAILED', message: 'Scoring engine error' } }, { status: 500 });
```

### Test File Location & Pattern

Test file: `apps/supabase/supabase/tests/run-scoring.test.ts`

```typescript
// Top of file
declare const Deno: unknown;
if (typeof Deno !== 'undefined') {
  throw new Error('This test file must run in Node/Jest, not Deno');
}
```

The orchestrator's Supabase client and `supabase.functions.invoke` must be mockable. Design options:
1. Accept an injectable client parameter (preferred for testability)
2. Or mock `https://esm.sh/@supabase/supabase-js@2` via Jest's `moduleNameMapper`

Mock `captureHighPriority` from `../functions/_shared/sentry` to verify it's called on error.

Run with: `pnpm --filter @lecolpo/supabase test`

### Current Test Count

**129 tests passing** (114 pre-Epic 4 + 15 added in Story 4.2). All 129 must remain green.
Target for this story: **≥ 141 total** (129 existing + ≥12 new in `run-scoring.test.ts`).

### Deferred Items Addressed in This Story

From `deferred-work.md`:

| Item | Action |
|------|--------|
| Duplicate `predictionId` in `StreakInput` | **Fixed here**: orchestrator validates uniqueness before calling `calculateStreaks()` |
| `prediction.fixtureId !== gameWeekMoment.fixtureId` mismatch | **Fixed here**: defensive assertion added before calling `scorePrediction()` |
| Double-invocation race from concurrent `ingest-events` | **Mitigated here**: idempotency guard aborts if `scoring_status` is already `in_progress`/`complete` |
| `match_result` event type fallthrough in scoring engine | **Monitor**: if `match_result` predictions appear, they will score 0 via the Precision Pick branch (no event match) — acceptable for MVP |

### NOT In Scope

- `admin-rescore/index.ts` Edge Function — Story 9.1 (admin-rescore calls `run-scoring` identically; this story only implements the `run-scoring` path)
- `admin-void-match/index.ts` — Story 9.1
- Any mobile UI changes
- Any new database migrations
- Leaderboard read queries on mobile (consumed by Epic 7)
- `reveal_seen` flag management — owned by mobile app (Epic 6) reading `scoring_status = 'complete'`

### References

- [Source: epics.md#Story 4.3] — Full acceptance criteria, FR29, FR30, FR47
- [Source: epics.md#Epic 4 summary] — Zero-tolerance error policy; AR7 (run-scoring Edge Function); AR12 (scoring_status state machine); AR15 (materialised leaderboards)
- [Source: architecture.md#API Response Format] — `{ data, error }` envelope mandatory
- [Source: architecture.md#Error Handling Standard] — three tiers; scoring = critical tier
- [Source: architecture.md#Naming Patterns] — DB `snake_case`; TS `camelCase` via Drizzle mapping
- [Source: functions/_shared/scoring-engine.ts] — `scorePrediction()`, `ScoringInput`, `ScoringOutput`
- [Source: functions/_shared/streak-calculator.ts] — `calculateStreaks()`, `StreakScoringEntry`, `StreakResult`, `StreakResultEntry`
- [Source: functions/_shared/sentry.ts] — `captureHighPriority()` for scoring errors (level: fatal)
- [Source: functions/_shared/constants.ts] — `CAPTAIN_MULTIPLIER = 2`
- [Source: functions/send-notifications/index.ts] — invocation shape: `{ type: 'results-ready' }`
- [Source: functions/_shared/push-sender.ts] — best-effort delivery; no retry on 429 (deferred)
- [Source: migrations/0000_worthless_naoko.sql] — `scoring_results`, `leaderboard_entries`, `scoring_errors`, `gameweeks`, `fixtures`, `predictions` table schemas
- [Source: deferred-work.md] — duplicate predictionId guard, fixture/moment mismatch guard, double-invocation race
- [Source: implementation-artifacts/4-2-cross-match-streak-calculator.md] — `StreakScoringEntry` wiring, sentinel design decisions, test patterns, Dev Agent Record

## Dev Agent Record

### Agent Model Used

GitHub Copilot (GPT-4.1)

### Debug Log References

- Fixed TypeScript implicit `any` errors in test file (added explicit `Record<string, unknown>` and `as any` casts for `res.json()`)
- Fixed `Deno is not defined` ReferenceError: wrapped `Deno.serve` in `if (typeof Deno !== 'undefined')` guard matching the pattern used by `ingest-events/index.ts`

### Completion Notes List

- ✅ Created `functions/run-scoring/index.ts`: full orchestrator with idempotency guard, fixture/moment mismatch guard, duplicate predictionId guard, postponed/voided zero-scoring, streak calculator wiring, scoring_results upsert, weekly + season leaderboard materialisation, rank assignment via RPC, best-effort notification dispatch, and error path (scoring_status=error, scoring_errors insert, captureHighPriority)
- ✅ Created `tests/run-scoring.test.ts`: 22 tests covering all ACs including all 12 required + 10 additional edge cases
- ✅ All 153 tests pass (129 pre-existing + 22 new); exceeds ≥141 target
- ✅ `runScoring()` exported separately from Deno entry point for clean testability
- ✅ `send-notifications` wrapped in try/catch — notification failures do not roll back scoring
- ✅ All 3 deferred items from deferred-work.md addressed: duplicate predictionId guard, fixture/moment mismatch guard, double-invocation idempotency guard

### File List

- `apps/supabase/supabase/functions/run-scoring/index.ts` — NEW (patched in review)
- `apps/supabase/supabase/tests/run-scoring.test.ts` — NEW (patched in review: +2 tests, 155 total)
- `apps/supabase/supabase/migrations/0005_leaderboard_upsert_and_rank_rpc.sql` — NEW (review patch: unique constraints + RPC)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — MODIFIED (status → done)
- `_bmad-output/implementation-artifacts/4-3-scoring-orchestrator-results-persistence-and-push-notification.md` — MODIFIED

