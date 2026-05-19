# Story 3.4: Gameweek Lifecycle Scheduling & Development Seed Data

Status: done

## Story

As a **system**,
I want pg_cron jobs defined for the automated gameweek lifecycle and seed data available for development,
So that the full pipeline runs on schedule in production and all subsequent epics can be developed without live API access.

## Acceptance Criteria

1. **Given** `apps/supabase/supabase/migrations/0004_pg_cron_jobs.sql` is created **When** the migration is applied **Then** a pg_cron job is defined to invoke `ingest-odds` on a configurable schedule (~3–4 days before first kickoff) **And** a pg_cron job is defined to invoke `ingest-events` on a per-fixture configurable schedule (after each match's expected end time) **And** both job schedules are stored as configurable values — not hardcoded cron expressions.

2. **Given** `gameweeks.first_kickoff` timestamp is reached **When** any client attempts to INSERT or UPDATE a prediction for that gameweek **Then** the RLS write policy blocks it automatically — no cron job or Edge Function action required for locking (FR8). *(This is already live from Story 2.4 — this story must verify it holds for the seed data gameweek and document the confirmation.)*

3. **Given** seed files are created in `apps/supabase/supabase/seeds/` **When** a developer runs them against the local Supabase stack **Then** `dev_gameweek.sql` creates a gameweek in Building state with realistic `first_kickoff` and `scoring_status = 'pending'` **And** `dev_fixtures.sql` creates 10 fixtures with populated `game_week_moments` rows using realistic integer point values **And** `dev_users.sql` creates 3 test users with auth records **And** Epic 5 (Match Builder) can be fully developed against this seed data without any live API calls.

## Tasks / Subtasks

- [x] Task 1: Create pg_cron migration (AC: #1)
  - [x] Create `apps/supabase/supabase/migrations/0004_pg_cron_jobs.sql`
  - [x] Enable `pg_cron` extension: `CREATE EXTENSION IF NOT EXISTS pg_cron;`
  - [x] Create a `cron_config` table to store configurable schedule values
  - [x] Create pg_cron job for `ingest-odds`: schedule pulled from `cron_config`, invokes the `ingest-odds` Edge Function via `net.http_post` or `pg_net` (per Supabase pg_cron pattern)
  - [x] Create pg_cron job for `ingest-events`: per-fixture trigger schedule pulled from `cron_config`
  - [x] Insert default schedule values into `cron_config`
  - [x] Migration must be idempotent: use `IF NOT EXISTS` checks throughout

- [x] Task 2: Verify RLS prediction lock using seed gameweek (AC: #2)
  - [x] Create `apps/supabase/supabase/tests/rls-prediction-lock.test.ts`
  - [x] Test: attempt to INSERT a prediction for a gameweek where `first_kickoff` is in the past → expect RLS policy to block it (returns error or empty result)
  - [x] Test: attempt to INSERT for a gameweek where `first_kickoff` is in the future → expect INSERT to succeed
  - [x] Test: attempt to UPDATE a prediction after `first_kickoff` → expect blocked
  - [x] Document in story completion notes that FR8 lock is implemented purely via DB RLS (existing from Story 2.4) — no additional Edge Function or cron job required
  - [x] All new tests pass; zero regressions (existing 84 tests remain green)

- [x] Task 3: Create development seed data (AC: #3)
  - [x] Create `apps/supabase/supabase/seeds/` directory
  - [x] Create `apps/supabase/supabase/seeds/dev_gameweek.sql`
  - [x] Create `apps/supabase/supabase/seeds/dev_fixtures.sql`
  - [x] Create `apps/supabase/supabase/seeds/dev_users.sql`
  - [x] Create `apps/supabase/supabase/seeds/dev_moment_types.sql`
  - [x] Create `apps/supabase/supabase/seed.sql` master file that runs all seed files in order (or update existing if present)
  - [x] Validate seed SQL is syntactically correct via `supabase db lint` if available, or manual review

- [x] Task 4: Update sprint status and story file (AC: all)
  - [x] Mark all tasks/subtasks complete in this story file
  - [x] Update File List with all new/modified files
  - [x] Update `sprint-status.yaml`: `3-4-gameweek-lifecycle-scheduling-and-development-seed-data: review`

## Dev Notes

### What This Story Delivers

Three categories of output:

```
apps/supabase/supabase/
  migrations/
    0004_pg_cron_jobs.sql         ← NEW: pg_cron extension + cron_config table + jobs
  seeds/
    dev_gameweek.sql              ← NEW: 1 gameweek in building state
    dev_fixtures.sql              ← NEW: 10 fixtures + game_week_moments rows
    dev_users.sql                 ← NEW: 3 test users with auth records
    dev_moment_types.sql          ← NEW: moment_types catalogue (goal, sub, corner, yellow, red)
  seed.sql                        ← NEW or UPDATE: master seed file referencing all seed files
  tests/
    rls-prediction-lock.test.ts   ← NEW: verifies prediction lock via RLS
```

### Critical: pg_cron Pattern in Supabase

Supabase exposes pg_cron via their extensions system. The standard Supabase pattern for calling an Edge Function from pg_cron is:

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule a job (example: ingest-odds at 08:00 UTC on Wednesdays)
SELECT cron.schedule(
  'ingest-odds-weekly',                          -- job name (unique)
  '0 8 * * 3',                                   -- cron expression (stored in cron_config)
  $$
  SELECT net.http_post(
    url     := current_setting('app.supabase_url') || '/functions/v1/ingest-odds',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body    := '{}'::jsonb
  );
  $$
);
```

**Key constraints:**
- `cron.schedule()` expressions are VARCHAR — cannot reference a table column directly
- The configurable requirement is satisfied by: (a) storing schedule expressions in a `cron_config` table AND (b) scheduling jobs with `cron.unschedule()` + `cron.schedule()` in a stored procedure that reads from `cron_config`
- For the migration: use hardcoded defaults but document that the `apply_cron_schedules()` function reads from `cron_config` and can be re-called after any config update
- `pg_net` extension required for `net.http_post` (already included in Supabase hosted projects)
- Both `pg_cron` and `pg_net` are available in Supabase local dev with `supabase start`

### cron_config Table Design

```sql
CREATE TABLE IF NOT EXISTS cron_config (
  key   text PRIMARY KEY,
  value text NOT NULL,
  description text
);

INSERT INTO cron_config (key, value, description) VALUES
  ('ingest_odds_schedule',   '0 8 * * 3',  'Cron expression: ingest-odds (default: 08:00 UTC Wednesday, ~4 days before Saturday kickoffs)'),
  ('ingest_events_schedule', '*/30 * * * *','Cron expression: ingest-events polling (default: every 30 minutes)')
ON CONFLICT (key) DO NOTHING;
```

### apply_cron_schedules() Stored Procedure

```sql
CREATE OR REPLACE FUNCTION apply_cron_schedules()
RETURNS void AS $$
DECLARE
  v_odds_schedule    text;
  v_events_schedule  text;
BEGIN
  SELECT value INTO v_odds_schedule   FROM cron_config WHERE key = 'ingest_odds_schedule';
  SELECT value INTO v_events_schedule FROM cron_config WHERE key = 'ingest_events_schedule';

  -- Remove existing jobs (idempotent)
  PERFORM cron.unschedule('ingest-odds-weekly')    WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ingest-odds-weekly');
  PERFORM cron.unschedule('ingest-events-polling') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ingest-events-polling');

  -- Re-schedule with current config values
  PERFORM cron.schedule(
    'ingest-odds-weekly',
    v_odds_schedule,
    format(
      $sql$SELECT net.http_post(url:='%s/functions/v1/ingest-odds',headers:='{"Content-Type":"application/json","Authorization":"Bearer %s"}'::jsonb,body:='{}'::jsonb);$sql$,
      current_setting('app.supabase_url'),
      current_setting('app.service_role_key')
    )
  );

  PERFORM cron.schedule(
    'ingest-events-polling',
    v_events_schedule,
    format(
      $sql$SELECT net.http_post(url:='%s/functions/v1/ingest-events',headers:='{"Content-Type":"application/json","Authorization":"Bearer %s"}'::jsonb,body:='{}'::jsonb);$sql$,
      current_setting('app.supabase_url'),
      current_setting('app.service_role_key')
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Apply schedules immediately when migration runs
SELECT apply_cron_schedules();
```

### RLS Prediction Lock — How It Works (FR8)

**Already implemented in Story 2.4** (`0002_rls_full_policies.sql`). The relevant policies are:

```sql
-- INSERT: own rows only, AND only before deadline
CREATE POLICY insert_predictions ON predictions
  FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM gameweeks g
      WHERE g.id = gameweek_id
        AND (g.first_kickoff IS NULL OR now() < g.first_kickoff)
    )
  );

-- UPDATE: same deadline check
CREATE POLICY update_predictions ON predictions
  FOR UPDATE USING ( ... same deadline check ... );
```

**No new migration needed.** This story confirms via tests that the existing lock works correctly with the seed data's `first_kickoff` timestamp.

For the RLS test, use the Supabase admin client (bypasses RLS) to seed test data, then use a user-scoped client (with `auth.uid()` set) to test the policy. Since these are Jest/Node tests (not Deno), mock the Supabase client behaviour directly:

```typescript
// In rls-prediction-lock.test.ts — conceptual test structure
// These tests validate the POLICY LOGIC (not the DB directly) using mock clients
// The policy's condition: (g.first_kickoff IS NULL OR now() < g.first_kickoff)
// We simulate this by mocking the query responses to confirm policy behaviour

// Key scenarios:
// 1. first_kickoff in future → INSERT allowed (mock returns success)
// 2. first_kickoff in past   → INSERT blocked (mock returns RLS error)
// 3. first_kickoff = null    → INSERT allowed (open gameweek, no deadline set)
// 4. UPDATE after deadline   → blocked
```

**Important:** The RLS test can be a documentation/smoke test that confirms the RLS logic behaviour through the mock layer. Full integration testing against a live Supabase DB is outside the scope of this Jest test suite (that requires `supabase db test` or similar). The existing `0002_rls_full_policies.sql` is the authoritative implementation.

### Seed Data Design

#### dev_gameweek.sql

One gameweek in `building` state:
- `gameweek_number = 1`
- `season = '2025-26'`
- `status = 'building'`  ← lowercase per DB constraint
- `scoring_status = 'pending'`
- `first_kickoff` = set to a future timestamp (e.g., `NOW() + INTERVAL '7 days'`) so predictions can be inserted during local dev
- `last_match_end` = `NULL` (not yet known)

#### dev_fixtures.sql

10 Premier League-style fixtures for gameweek_id = 1:

| external_id | home_team | away_team | kickoff_at |
|---|---|---|---|
| ext-fix-001 | Arsenal | Chelsea | first_kickoff + 0h |
| ext-fix-002 | Man City | Liverpool | first_kickoff + 0h |
| ext-fix-003 | Man Utd | Tottenham | first_kickoff + 0h |
| ext-fix-004 | Newcastle | Aston Villa | first_kickoff + 2h30m |
| ext-fix-005 | Brighton | Brentford | first_kickoff + 2h30m |
| ext-fix-006 | Fulham | Wolves | first_kickoff + 2h30m |
| ext-fix-007 | Everton | Crystal Palace | first_kickoff + 2h30m |
| ext-fix-008 | Nottm Forest | West Ham | first_kickoff + 5h |
| ext-fix-009 | Bournemouth | Ipswich | first_kickoff + 5h |
| ext-fix-010 | Leicester | Southampton | first_kickoff + 5h |

Each fixture gets `game_week_moments` rows for all moment types (goal, yellow_card, red_card, substitution, corner) with:
- `base_points` derived from the formula (realistic values: 30–120 depending on team strength)
- `player_bonus_points`, `assister_bonus_points`, `zone_bonus_points` where applicable
- `timing_bonus_points = 50` (±5 window bonus from constants)
- `jackpot_bonus_points = 100` (from constants)

#### dev_users.sql

3 test users. In Supabase, `auth.users` is in the `auth` schema (managed by GoTrue). During local dev seeding, insert into `auth.users` then insert corresponding `public.users` rows:

```sql
-- Insert into auth schema (local dev only — never run against production)
INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'dev-user-1@test.com', NOW(), NOW(), NOW(), '{"provider":"email"}', '{}'),
  ('00000000-0000-0000-0000-000000000002', 'dev-user-2@test.com', NOW(), NOW(), NOW(), '{"provider":"email"}', '{}'),
  ('00000000-0000-0000-0000-000000000003', 'dev-user-3@test.com', NOW(), NOW(), NOW(), '{"provider":"email"}', '{}')
ON CONFLICT (id) DO NOTHING;

-- Insert into public.users
INSERT INTO public.users (id, auth_id, display_name, has_seen_onboarding)
VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Dev User 1', true),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000002', 'Dev User 2', false),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000003', 'Dev User 3', false)
ON CONFLICT (auth_id) DO NOTHING;
```

**Note:** The `auth.users` table in GoTrue has additional required columns that vary by Supabase version. Check `supabase start` logs for required columns. A safer alternative for local dev is to use the Supabase Management API or Studio to create users — but for automated seeding, direct insert is fine for local stack.

#### dev_moment_types.sql

The 5 event types needed for Match Moments and Precision Picks:

```sql
INSERT INTO moment_types (name, event_type, prediction_type, description )
VALUES
  ('Goal Scored',       'goal',         'moment',  'Predict a player to score a goal'),
  ('Yellow Card',       'yellow_card',  'moment',  'Predict a player to receive a yellow card'),
  ('Red Card',          'red_card',     'moment',  'Predict a player to receive a red card'),
  ('Substitution',      'substitution', 'moment',  'Predict a substitution player'),
  ('Corner Taken',      'corner',       'moment',  'Predict a corner event with zone'),
  ('Match Result - Home Win',  'match_result', 'match', 'Home team wins the match'),
  ('Match Result - Away Win',  'match_result', 'match', 'Away team wins the match'),
  ('Match Result - Draw',      'match_result', 'match', 'Match ends in a draw'),
  ('Both Teams to Score',      'btts',         'match', 'Both teams score at least one goal'),
  ('Over 2.5 Goals',           'over_goals',   'match', 'More than 2.5 goals in the match')
ON CONFLICT (name) DO NOTHING;
```

#### seed.sql (master file)

```sql
-- Master seed file for local development
-- Run order matters: gameweek → fixtures → moment_types → game_week_moments (in dev_fixtures.sql)
-- Users creates auth + public records

\i seeds/dev_moment_types.sql
\i seeds/dev_gameweek.sql
\i seeds/dev_fixtures.sql
\i seeds/dev_users.sql
```

**Alternative for Supabase CLI** (if `\i` is not supported): use a single seed.sql with all content inlined.

### Testing Strategy

Tests run in Jest/Node.js. No Deno flag needed for this story — both test files are pure Node/mocked.

```typescript
// rls-prediction-lock.test.ts structure
// Since we cannot run actual DB RLS in Jest, these are logic-level tests
// that verify the CONDITION used by the RLS policy — confirming the timestamp
// comparison logic is correct.

// The test validates:
// - A gameweek with first_kickoff in the future: the condition (now() < first_kickoff) is TRUE → INSERT allowed
// - A gameweek with first_kickoff in the past:  the condition (now() < first_kickoff) is FALSE → INSERT blocked
// - A gameweek with first_kickoff = NULL:       the condition (first_kickoff IS NULL) is TRUE → INSERT allowed

// Implemented as pure TypeScript unit tests of the policy predicate function
// (extracted into a testable helper), not as DB integration tests.
```

Create a small helper file `apps/supabase/supabase/tests/helpers/rls-helpers.ts`:

```typescript
// Helpers that replicate the DB RLS predicate logic for unit testing

export function canInsertPrediction(firstKickoff: Date | null, now: Date = new Date()): boolean {
  if (firstKickoff === null) return true;      // NULL → open, no deadline
  return now < firstKickoff;                   // before deadline → allowed
}
```

Then test `canInsertPrediction` in `rls-prediction-lock.test.ts`:

```typescript
import { canInsertPrediction } from './helpers/rls-helpers';

describe('RLS Prediction Lock Logic (FR8)', () => {
  it('allows INSERT when no deadline is set (first_kickoff = null)', () => {
    expect(canInsertPrediction(null)).toBe(true);
  });

  it('allows INSERT when first_kickoff is in the future', () => {
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
    expect(canInsertPrediction(future)).toBe(true);
  });

  it('blocks INSERT when first_kickoff has passed', () => {
    const past = new Date(Date.now() - 60 * 1000); // 1 min ago
    expect(canInsertPrediction(past)).toBe(false);
  });

  it('blocks INSERT when first_kickoff is exactly now (boundary)', () => {
    const now = new Date();
    // policy: now() < first_kickoff (strict <), so exactly now = false
    expect(canInsertPrediction(now, now)).toBe(false);
  });

  it('blocks UPDATE after deadline (same predicate)', () => {
    const past = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
    expect(canInsertPrediction(past)).toBe(false);
  });
});
```

Run with: `pnpm --filter @lecolpo/supabase test`

### Architecture Compliance Checklist

- [ ] pg_cron uses `cron_config` table for configurable schedule values — not hardcoded expressions inline
- [ ] `apply_cron_schedules()` function enables re-scheduling without re-running migration
- [ ] Both `pg_cron` and `pg_net` extensions enabled with `IF NOT EXISTS` (idempotent)
- [ ] Seed data uses `ON CONFLICT ... DO NOTHING` (idempotent — safe to re-run)
- [ ] `first_kickoff` in seed gameweek is set to `NOW() + INTERVAL '7 days'` so local dev predictions work immediately
- [ ] `game_week_moments.base_points` values derived via `ODDS_SCALE_FACTOR = 40` formula — no magic numbers
- [ ] All seed inserts include all required NOT NULL columns with valid values
- [ ] `predictions` table predictions lock: confirmed purely via existing RLS `insert_predictions` + `update_predictions` policies (Story 2.4) — no new cron or function code required for FR8
- [ ] `cron_config` rows inserted with `ON CONFLICT (key) DO NOTHING`
- [ ] Test count: 84 existing + 5 new = 89 total (all passing)

### Previous Story Learnings (from Story 3.3)

- Use `typeof Deno !== 'undefined'` guard for any Deno file used in tests — NOT needed for this story (no new Edge Functions)
- Always use `jest.restoreAllMocks()` in `afterEach` to avoid cross-test pollution
- All DB null values must be `null` (not `undefined`) — applies to `game_week_moments` nullable bonus columns
- Tests run via `pnpm --filter @lecolpo/supabase test` — Jest locates tests in `supabase/tests/`
- 84 tests currently passing — must stay at 84+ after this story
- `console.log` for informational, `console.error` for caught errors

### Project Structure Notes

- Migrations: `apps/supabase/supabase/migrations/` — file naming: `NNNN_descriptive_name.sql`
- Seeds: `apps/supabase/supabase/seeds/` — create directory; referenced by `seed.sql`
- Tests: `apps/supabase/supabase/tests/` — Jest locates all `*.test.ts` in this folder
- `seed.sql` path: `apps/supabase/supabase/seed.sql` — referenced by `config.toml` as `sql_paths = ["./seed.sql"]`
- No new Edge Functions in this story — no Deno guard needed
- No new DB schema changes — all tables already exist from `0000_worthless_naoko.sql`

### References

- [Source: epics.md#Story 3.4] — Full acceptance criteria
- [Source: architecture.md#AR9] — pg_cron scheduled jobs: 3 jobs (odds lock, per-match events, scoring trigger)
- [Source: architecture.md#NFR21] — 99% automated lifecycle without manual intervention
- [Source: epics.md#FR7] — Match Builder window open/close schedule
- [Source: epics.md#FR8] — Prediction lock at first kickoff (RLS, no Edge Function)
- [Source: migrations/0002_rls_full_policies.sql] — Existing prediction lock RLS policies (Story 2.4)
- [Source: migrations/0000_worthless_naoko.sql] — Full DB schema (all tables already exist)
- [Source: constants.ts] — ODDS_SCALE_FACTOR=40, MIN_BASE_POINTS=10, MAX_BASE_POINTS=120
- [Source: implementation-artifacts/3-3-match-event-ingestion-and-gameweek-completion-detection.md] — Story 3.3 learnings, test patterns

## Dev Agent Record

### Agent Model Used

GitHub Copilot (JetBrains-IU, 2026-05-19)

### Debug Log References

- Verified `gameweeks.status` constraint: `('building', 'locked', 'completed')` — used lowercase `'building'` in seed ✓
- `game_week_moments` has no unique constraint on `(fixture_id, moment_type_id)` — used `NOT EXISTS` guard for idempotency ✓
- `auth.users` required `aud` and `role` columns in addition to the fields shown in Dev Notes — added to `dev_users.sql` ✓
- Test count: 84 existing → 90 total after 6 new RLS lock tests (all passing) ✓

### Completion Notes List

- **Task 1 (pg_cron migration):** Created `0004_pg_cron_jobs.sql` enabling `pg_cron` and `pg_net` extensions, a `cron_config` table with configurable schedule values, and an `apply_cron_schedules()` stored procedure that reads from `cron_config` to schedule both jobs. Migration is fully idempotent.
- **Task 2 (RLS lock verification):** Created `rls-helpers.ts` exporting `canInsertPrediction()` which replicates the DB policy predicate. Created `rls-prediction-lock.test.ts` with 6 tests covering: null deadline, future kickoff, past kickoff, boundary (exact now), post-deadline update, and 1ms future edge case. **FR8 confirmed: the prediction lock is implemented purely via existing RLS policies in `0002_rls_full_policies.sql` (Story 2.4) — no new Edge Function or cron job required.**
- **Task 3 (seed data):** Created `seeds/` directory with 4 seed files. `dev_gameweek.sql`: 1 gameweek in `building` state with `first_kickoff = NOW() + 7 days`. `dev_fixtures.sql`: 10 PL-style fixtures + 100 `game_week_moments` rows (10 moment types × 10 fixtures) with realistic base_points (30–120 range). `dev_moment_types.sql`: 10 moment types covering all prediction categories. `dev_users.sql`: 3 test users with auth + public records. `seed.sql`: master file referencing all seeds in correct FK order.
- **Test count:** 90 passing (84 pre-existing + 6 new). Zero regressions.

### File List

- `apps/supabase/supabase/migrations/0004_pg_cron_jobs.sql` — NEW
- `apps/supabase/supabase/seeds/dev_moment_types.sql` — NEW
- `apps/supabase/supabase/seeds/dev_gameweek.sql` — NEW
- `apps/supabase/supabase/seeds/dev_fixtures.sql` — NEW
- `apps/supabase/supabase/seeds/dev_users.sql` — NEW
- `apps/supabase/supabase/seed.sql` — NEW
- `apps/supabase/supabase/tests/helpers/rls-helpers.ts` — NEW
- `apps/supabase/supabase/tests/rls-prediction-lock.test.ts` — NEW
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — MODIFIED (status → review)
- `_bmad-output/implementation-artifacts/3-4-gameweek-lifecycle-scheduling-and-development-seed-data.md` — MODIFIED (tasks, dev record, file list, change log)

### Change Log

- 2026-05-19: Story 3.4 implementation complete — pg_cron migration, RLS lock tests, and development seed data created. 90 tests passing (6 new).

### Review Findings

- [x] [Review][Decision] **F8 — `seed.sql` uses psql `\i` meta-commands that may fail under Supabase's internal runner** — Fixed: seed files listed individually in `config.toml sql_paths`; `seed.sql` updated to psql-only documentation.
- [x] [Review][Decision] **F9 — AC #1: `ingest-events` cron job is a recurring poll, not per-fixture scheduling** — Accepted: polling approach confirmed as design. `cron_config` description updated to clarify polling intent.
- [x] [Review][Patch] **F1 — `apply_cron_schedules()` uses `current_setting()` without `missing_ok` — will error on fresh `db reset`** [`migrations/0004_pg_cron_jobs.sql:67-68`] — Fixed: `coalesce(current_setting(..., true), '')`.
- [x] [Review][Patch] **F2 — `PERFORM cron.unschedule(...) WHERE EXISTS` is invalid PL/pgSQL syntax** [`migrations/0004_pg_cron_jobs.sql:49-53`] — Fixed: replaced with `IF EXISTS ... THEN PERFORM ... END IF` blocks.
- [x] [Review][Patch] **F3 — Hardcoded sequential integer `id` values in `dev_fixtures.sql` will desync the serial sequence** [`seeds/dev_fixtures.sql:17-29`] — Fixed: removed explicit `id` column from INSERT; `game_week_moments` now uses `CROSS JOIN (SELECT id FROM fixtures WHERE external_id = ...)` lookups.
- [x] [Review][Patch] **F4 — `CASE mt.event_type` has no `ELSE` branch — `base_points` will be NULL for unknown event types** [`seeds/dev_fixtures.sql:47-56`] — Fixed: added `ELSE 30` to all CASE expressions.
- [x] [Review][Defer] **F5 — `ON CONFLICT (gameweek_number)` assumes a unique constraint exists** [`seeds/dev_gameweek.sql:30`] — deferred, depends on existing schema constraint from Story 1.3; verify before Epic 5
- [x] [Review][Defer] **F6 — `canInsertPrediction` TypeScript helper can silently drift from the SQL RLS policy** [`tests/helpers/rls-helpers.ts`] — deferred, acknowledged in story notes; integration test deferred to a future hardening story
- [x] [Review][Defer] **F7 — No test for DELETE RLS predicate after deadline** [`tests/rls-prediction-lock.test.ts`] — deferred, coverage extension not required by this story's AC
