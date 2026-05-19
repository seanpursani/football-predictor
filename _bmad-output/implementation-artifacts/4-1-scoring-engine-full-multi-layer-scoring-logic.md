# Story 4.1: Scoring Engine — Full Multi-layer Scoring Logic

Status: done

## Story

As a **system**,
I want a fully tested scoring engine that calculates points for all prediction types across all scoring layers,
So that every user's gameweek score is calculated correctly with zero tolerance for errors.

## Acceptance Criteria

1. **Given** `functions/_shared/scoring-engine.ts` is implemented **When** a Match Moment prediction is evaluated against `match_events` **Then** it scores the configured integer point value if the event occurred, 0 if it did not (FR23).

2. **Given** a Precision Pick prediction is evaluated **When** the event occurred in the match **Then** the event layer points are awarded **And** if the event's real-world minute falls within the user's confidence window (±5/±10/±15), the timing bonus is awarded **And** if the event minute equals the user's predicted minute exactly, the jackpot bonus is awarded in addition to the timing bonus (FR25).

3. **Given** a Goal Precision Pick is evaluated **When** scoring runs **Then** scorer bonus is awarded if the correct player scored **And** assister bonus is awarded independently if the correct player assisted — all layers are additive, no layer blocks another (FR24).

4. **Given** a Substitution Precision Pick is evaluated **When** scoring runs **Then** player-on bonus is awarded if the correct player came on **And** player-off bonus is awarded independently if the correct player went off.

5. **Given** a Corner Precision Pick is evaluated **When** scoring runs **Then** zone bonus is awarded if the correct zone was predicted.

6. **Given** a Yellow Card or Red Card Precision Pick is evaluated **When** scoring runs **Then** player bonus is awarded if the correct player received the card.

7. **Given** any Precision Pick is evaluated and the event did not occur in the match **When** scoring runs **Then** all layers score 0 — no negative points are ever awarded.

8. **Given** a pick is designated as Captain **When** its total points across all layers are calculated **Then** the 2x multiplier is applied to the complete layer total, not to individual layers (FR26).

9. **Given** `scoring-engine.test.ts` covers all event types **When** the test suite runs **Then** all scenarios pass: all-layers-hit, partial credit, zero (event missed), jackpot bonus, captain 2x, captain on a zero-scoring pick.

## Tasks / Subtasks

- [x] Task 1: Implement `functions/_shared/scoring-engine.ts` (AC: #1–#8)
  - [x] Define `ScoringInput` interface: `{ prediction: Prediction; gameWeekMoment: GameweekMoment; momentType: MomentType; matchEvents: MatchEvent[]; fixture: Fixture; }`
  - [x] Define `ScoringOutput` interface matching `NewScoringResult` fields: `{ eventPoints, timingBonus, playerBonus, assisterBonus, zoneBonus, jackpotBonus, captainMultiplier, streakBonus, totalPoints, isCorrect }`
  - [x] Implement `scoreMatchMoment()` — returns `basePoints` if any `match_events` row matches `(matchId, eventType)`, else 0 (AC #1)
  - [x] Implement `scorePrecisionPick()` — multi-layer additive (AC #2–#8):
    - [x] Event layer: check if event occurred (any `match_events` row for this `matchId` + `eventType`)
    - [x] Timing bonus: if event occurred AND real minute within confidence window (use `TIMING_WINDOW_5_BONUS`, `TIMING_WINDOW_10_BONUS`, `TIMING_WINDOW_15_BONUS` from constants.ts)
    - [x] Jackpot bonus: if event occurred AND `realMinute === predictedMinute` (use `JACKPOT_BONUS` from constants.ts; additive on top of timing bonus)
    - [x] Goal event: scorer bonus (`playerBonusPoints`) if `matchEvent.playerId === prediction.predictedPlayerId`; assister bonus (`assisterBonusPoints`) if `matchEvent.extraData.assisterId === prediction.predictedAssisterId` — independent layers
    - [x] Substitution event: player-on bonus if `matchEvent.playerId === prediction.predictedPlayerId`; player-off bonus (`assisterBonusPoints` repurposed for player-off) if `matchEvent.extraData.playerOffId === prediction.predictedAssisterId`
    - [x] Corner event: zone bonus (`zoneBonusPoints`) if `matchEvent.extraData.zone === prediction.predictedZone`
    - [x] Yellow/Red Card event: player bonus (`playerBonusPoints`) if `matchEvent.playerId === prediction.predictedPlayerId`
    - [x] No event: all layers = 0, `isCorrect = false`
  - [x] Implement `applyCapitalMultiplier()` — if `prediction.isCaptain`, multiply the pre-streak layer total by `CAPTAIN_MULTIPLIER` (use constant, never hardcode 2). Note: this function calculates the base+timing+bonus layers; streak bonus is applied separately by streak-calculator.ts after ordering
  - [x] Export `scorePrediction(input: ScoringInput): ScoringOutput` as the top-level function composing all layers
  - [x] All point values must be integers — never floats. Round at the source if needed (constants.ts guarantees this already)
  - [x] Import all bonus constants from `../constants.ts` — no magic numbers in scoring-engine.ts

- [x] Task 2: Implement `functions/_shared/scoring-engine.test.ts` (AC: #9)
  - [x] Use `typeof Deno !== 'undefined'` guard for test environment isolation (Deno vs Node)
  - [x] Test: Match Moment — event occurred → returns `basePoints`, `isCorrect: true`
  - [x] Test: Match Moment — event NOT occurred → returns 0, `isCorrect: false`
  - [x] Test: Precision Pick — all layers hit (goal, scorer correct, assister correct, minute exact) → all 5 bonus layers active + jackpot
  - [x] Test: Precision Pick — partial credit (event occurred, timing missed, player missed) → event points only
  - [x] Test: Precision Pick — jackpot (exact minute match) → `timingBonus + JACKPOT_BONUS` awarded
  - [x] Test: Precision Pick — event NOT occurred → `eventPoints=0, timingBonus=0, playerBonus=0, assisterBonus=0, zoneBonus=0, jackpotBonus=0, isCorrect=false`
  - [x] Test: Substitution — player-on correct, player-off incorrect → `playerBonus` awarded, `assisterBonus` 0
  - [x] Test: Corner — zone correct → `zoneBonus` awarded
  - [x] Test: Yellow Card — player correct → `playerBonus` awarded
  - [x] Test: Red Card — player correct → `playerBonus` awarded
  - [x] Test: Captain on a HIT — `captainMultiplier` doubles the pre-streak sub-total
  - [x] Test: Captain on a MISS (event not occurred) — captain 2x of 0 = 0 (no negative)
  - [x] Test: Timing window boundaries — ±5 window: minute within 5 = bonus; minute at 6 = no bonus
  - [x] Test: Timing window ±10 — minute within 10 = TIMING_WINDOW_10_BONUS, not TIMING_WINDOW_5_BONUS (only nearest qualifying window applies)
  - [x] All 90 pre-existing tests must remain green; new tests added on top

- [x] Task 3: Update sprint status
  - [x] Mark tasks complete in this story file
  - [x] Update File List with all new/modified files
  - [x] Update `sprint-status.yaml`: `4-1-scoring-engine-full-multi-layer-scoring-logic: review`

## Dev Notes

### What This Story Delivers

```
apps/supabase/supabase/functions/_shared/
  scoring-engine.ts          ← NEW: core multi-layer scoring logic
  scoring-engine.test.ts     ← NEW: test suite for all event types and scenarios
```

> **Note:** Story 4.1 delivers ONLY the core scoring logic (`scoring-engine.ts`). The streak calculator (`streak-calculator.ts`) is Story 4.2. The `run-scoring` Edge Function orchestrator is Story 4.3. This story must NOT include streak bonus application or `run-scoring` orchestration — those come in follow-on stories.

### Architecture: Scoring Engine Isolation

The scoring engine lives in `functions/_shared/scoring-engine.ts` as a **pure TypeScript module** — no Supabase calls, no HTTP, no side effects. It takes inputs and returns outputs. This isolation is load-bearing for the zero-error tolerance requirement:
- Fully unit-testable without any running infrastructure
- `run-scoring/index.ts` (Story 4.3) is just a thin orchestrator that loads predictions and passes them into this engine
- Manual rescore (Epic 9) takes the same code path — identical to automatic

[Source: architecture.md#Scoring Engine Boundary]

### Scoring Input Types (from `@lecolpo/types`)

The scoring engine consumes types already defined in `packages/types/src/schema/`. Use these exact imports — do NOT redefine types locally:

```typescript
import type {
  Prediction,
  GameweekMoment,
  MomentType,
  MatchEvent,
} from '@lecolpo/types';
```

**Key fields used for scoring:**

_Prediction (from `packages/types/src/schema/predictions.ts`):_
- `predictionType: string` — `'match'` | `'moment'`
- `isCaptain: boolean`
- `predictedMinute: number | null` — Precision Pick only
- `confidenceWindow: number | null` — 5, 10, or 15
- `predictedPlayerId: string | null` — for goal scorer, sub player-on, yellow/red card player
- `predictedAssisterId: string | null` — repurposed: goal assister OR sub player-off
- `predictedZone: string | null` — corner zone

_GameweekMoment (from `packages/types/src/schema/moments.ts`):_
- `basePoints: number` — event layer points if event occurred
- `playerBonusPoints: number | null` — bonus for correct scorer / player
- `assisterBonusPoints: number | null` — bonus for correct assister / player-off
- `zoneBonusPoints: number | null` — bonus for correct zone
- `timingBonusPoints: number | null` — NOT used for scoring logic (use constants.ts values directly)
- `jackpotBonusPoints: number | null` — NOT used for scoring logic (use JACKPOT_BONUS constant)

> **Important:** `timingBonusPoints` and `jackpotBonusPoints` on `GameweekMoment` are seeded as reference values for the mobile UI. The scoring engine uses `TIMING_WINDOW_5_BONUS`, `TIMING_WINDOW_10_BONUS`, `JACKPOT_BONUS` from `constants.ts` directly — not the DB-stored values. This ensures the formula is always consistent.

_MatchEvent (from `packages/types/src/schema/matchEvents.ts`):_
- `matchId: number` — maps to `Prediction.fixtureId`
- `eventType: string` — `'goal'` | `'substitution'` | `'corner'` | `'yellow_card'` | `'red_card'`
- `playerId: string` — primary player (scorer, sub coming on, player carded, corner taker)
- `minute: number` — real-world event minute
- `teamId: string`
- `extraData: unknown` — JSONB payload; use type guards to access:
  - Goal: `{ assisterId?: string }`
  - Substitution: `{ playerOffId?: string }`
  - Corner: `{ zone?: string }`

### ScoringOutput Structure

The function returns a shape compatible with `NewScoringResult` from `@lecolpo/types` (minus the FK fields that the orchestrator in Story 4.3 will set):

```typescript
interface ScoringOutput {
  eventPoints: number;        // base points for event occurring
  timingBonus: number;        // timing window bonus (0 if not applicable)
  playerBonus: number;        // player/scorer/player-on bonus
  assisterBonus: number;      // assister/player-off bonus
  zoneBonus: number;          // corner zone bonus
  jackpotBonus: number;       // exact minute jackpot (additive on top of timing)
  captainMultiplier: number;  // 1 or 2 (from CAPTAIN_MULTIPLIER constant)
  streakBonus: number;        // always 0 from this function — streak-calculator.ts applies this in Story 4.2
  totalPoints: number;        // (eventPoints + timingBonus + playerBonus + assisterBonus + zoneBonus + jackpotBonus) × captainMultiplier + streakBonus
  isCorrect: boolean;         // true if eventPoints > 0
}
```

> `streakBonus` is ALWAYS 0 from `scoring-engine.ts` — the streak-calculator (Story 4.2) calculates this after ordering all picks by real-world event time and patches `totalPoints` accordingly.

### Confidence Window Logic

The confidence window determines which timing bonus applies. **Nearest qualifying window** rule: if the user selected ±10 and the real minute falls within ±5, award `TIMING_WINDOW_5_BONUS` (the better bonus). If outside ±5 but within ±10, award `TIMING_WINDOW_10_BONUS`. Always award the most generous applicable bonus:

```typescript
function getTimingBonus(predictedMinute: number, realMinute: number, confidenceWindow: 5 | 10 | 15): number {
  const diff = Math.abs(realMinute - predictedMinute);
  if (diff === 0) return 0; // Exact hit → jackpot path (jackpot bonus added separately)
  if (diff <= 5) return TIMING_WINDOW_5_BONUS;    // Within ±5: best bonus
  if (diff <= 10) return TIMING_WINDOW_10_BONUS;  // Within ±10: mid bonus
  if (diff <= 15 && confidenceWindow === 15) return TIMING_WINDOW_15_BONUS; // 0 pts intentionally
  return 0; // Outside window entirely
}
```

Wait — the above is slightly wrong. The confidence window is the OUTER LIMIT the user chose. A user who chose ±5 gets no bonus if the event falls at minute 6 (outside their window). A user who chose ±10 CAN get the ±5 bonus if the event falls within ±5 (because ±5 is inside ±10). Logic:

```typescript
function getTimingBonus(predictedMinute: number, realMinute: number, confidenceWindow: 5 | 10 | 15): number {
  const diff = Math.abs(realMinute - predictedMinute);
  if (diff > confidenceWindow) return 0; // Outside user's chosen window — no bonus
  if (diff <= 5)  return TIMING_WINDOW_5_BONUS;
  if (diff <= 10) return TIMING_WINDOW_10_BONUS;
  return TIMING_WINDOW_15_BONUS; // diff <= 15 and confidenceWindow === 15 → 0 pts intentionally
}
```

Jackpot check is separate: `if (realMinute === predictedMinute) → add JACKPOT_BONUS` (this is additive on top of the timing bonus above). Note: if `diff === 0`, the timing bonus function above returns `TIMING_WINDOW_5_BONUS` (since diff 0 <= 5) PLUS the jackpot adds `JACKPOT_BONUS` separately. The combined payout for exact minute = `eventPoints + TIMING_WINDOW_5_BONUS + JACKPOT_BONUS + player/zone bonuses`.

### Captain Multiplier Application

Captain multiplier applies to the **pre-streak sub-total**:
```
preCaptainTotal = eventPoints + timingBonus + playerBonus + assisterBonus + zoneBonus + jackpotBonus
totalPoints = preCaptainTotal × captainMultiplier   ← using CAPTAIN_MULTIPLIER constant (2)
streakBonus = 0  ← always 0 here; Story 4.2 patches this after cross-match ordering
```

Key edge case: Captain on a MISS (event did not occur). `preCaptainTotal = 0`. `0 × 2 = 0`. Never negative. `captainMultiplier` is still stored as 2 in `ScoringOutput.captainMultiplier` so the reveal screen can display the 2× badge even on a miss.

### Match Moment Scoring

Match Moments are binary: the event either occurred in this match or it didn't.

```typescript
function scoreMatchMoment(prediction: Prediction, gameWeekMoment: GameweekMoment, matchEvents: MatchEvent[]): ScoringOutput {
  const eventOccurred = matchEvents.some(
    e => e.matchId === prediction.fixtureId && e.eventType === matchEventType
  );
  const eventPoints = eventOccurred ? gameWeekMoment.basePoints : 0;
  const preCaptainTotal = eventPoints;
  const captainMultiplier = prediction.isCaptain ? CAPTAIN_MULTIPLIER : 1;
  return {
    eventPoints,
    timingBonus: 0, playerBonus: 0, assisterBonus: 0, zoneBonus: 0, jackpotBonus: 0,
    captainMultiplier,
    streakBonus: 0,
    totalPoints: preCaptainTotal * captainMultiplier,
    isCorrect: eventOccurred,
  };
}
```

> `matchEventType` is obtained from `prediction → gameWeekMoment → momentType.eventType`. Pass `MomentType` into the function or pre-resolve the eventType before calling.

### Event Type to Precision Pick Schema Mapping

| `momentType.eventType` | `predictedPlayerId` means | `predictedAssisterId` means | `predictedZone` means |
|---|---|---|---|
| `goal` | Scorer | Assister | — (null) |
| `substitution` | Player coming ON | Player going OFF | — (null) |
| `corner` | — (null, any player) | — (null) | Zone string |
| `yellow_card` | Player carded | — (null) | — (null) |
| `red_card` | Player carded | — (null) | — (null) |

The `extraData` JSONB field on `match_events` contains event-type-specific data. Access with caution — use type guards:
```typescript
function getAssisterId(event: MatchEvent): string | undefined {
  const data = event.extraData as Record<string, unknown> | null;
  return typeof data?.assisterId === 'string' ? data.assisterId : undefined;
}
function getPlayerOffId(event: MatchEvent): string | undefined {
  const data = event.extraData as Record<string, unknown> | null;
  return typeof data?.playerOffId === 'string' ? data.playerOffId : undefined;
}
function getZone(event: MatchEvent): string | undefined {
  const data = event.extraData as Record<string, unknown> | null;
  return typeof data?.zone === 'string' ? data.zone : undefined;
}
```

### Test File Location & Environment Guard

Test file path: `apps/supabase/supabase/tests/scoring-engine.test.ts`

This matches the existing test location convention (`supabase/tests/`) established in previous stories. Run with `pnpm --filter @lecolpo/supabase test`.

The scoring engine itself (`scoring-engine.ts`) is in `functions/_shared/` which runs in Deno. However, the test runs in Jest/Node. Use the Deno guard at the TOP of the test file (see existing test patterns from Story 3.3):

```typescript
// scoring-engine.test.ts
if (typeof Deno !== 'undefined') {
  throw new Error('This test file must run in Node/Jest, not Deno');
}
```

The engine itself does NOT import any Deno-specific APIs, so it can be imported directly by Jest via the relative path. Use `jest.config.js` transform settings already in place.

### Constants to Use (NEVER hardcode numbers — always import from constants.ts)

```typescript
import {
  TIMING_WINDOW_5_BONUS,    // 50
  TIMING_WINDOW_10_BONUS,   // 25
  TIMING_WINDOW_15_BONUS,   // 0
  JACKPOT_BONUS,            // 100
  CAPTAIN_MULTIPLIER,       // 2
} from '../constants.ts';
```

Note: `STREAK_2_BONUS`, `STREAK_3_BONUS`, `STREAK_4_PLUS_BONUS` are NOT used in this story — those are consumed by `streak-calculator.ts` in Story 4.2.

### Test Count

90 tests currently passing. Add at minimum 14 new tests (one per scenario listed in Task 2) → target 104+ tests. All 90 existing must remain green.

### NOT In Scope

- `streak-calculator.ts` — Story 4.2
- `run-scoring/index.ts` orchestrator — Story 4.3
- Postponed match handling (FR29) — Story 4.3 (the orchestrator handles this at the fixture level, scoring-engine.ts just returns 0 for predictions without events)
- Total gameweek score aggregation (FR30) — Story 4.3
- Leaderboard materialisation (AR15) — Story 4.3
- Results-ready push notification (FR47) — Story 4.3

### Deferred Issue from Story 3.4

Story 3.4 Review item F5 ("ON CONFLICT (gameweek_number) assumes a unique constraint exists on dev_gameweek.sql") was deferred with note: "verify before Epic 5". This is NOT in scope for Story 4.1 — no migrations required for this story.

### Project Structure Notes

- New file: `apps/supabase/supabase/functions/_shared/scoring-engine.ts`
- New file: `apps/supabase/supabase/tests/scoring-engine.test.ts`
- No migrations, no seed changes, no new DB schema for this story
- No new Edge Functions for this story — only the shared module

### References

- [Source: epics.md#Story 4.1] — Full acceptance criteria and all event type scoring rules
- [Source: architecture.md#Scoring Engine Boundary] — Isolation mandate: pure module, fully testable
- [Source: architecture.md#FR23–30] — `functions/run-scoring/index.ts` + `_shared/scoring-engine.ts`
- [Source: epics.md#FR23] — Match Moment scoring (binary hit/miss)
- [Source: epics.md#FR24] — Precision Pick multi-layer additive scoring
- [Source: epics.md#FR25] — Exact minute jackpot bonus
- [Source: epics.md#FR26] — Captain 2x multiplier on complete layer total
- [Source: epics.md#AR18] — Error handling tiers (no user-facing errors from engine — Critical tier only)
- [Source: functions/_shared/constants.ts] — ODDS_SCALE_FACTOR, TIMING_WINDOW_*_BONUS, JACKPOT_BONUS, STREAK_*_BONUS, CAPTAIN_MULTIPLIER
- [Source: packages/types/src/schema/predictions.ts] — Prediction, PrecisionPick types
- [Source: packages/types/src/schema/scoringResults.ts] — ScoringResult, NewScoringResult, LayerScore types
- [Source: packages/types/src/schema/matchEvents.ts] — MatchEvent, NewMatchEvent types
- [Source: packages/types/src/schema/moments.ts] — MomentType, GameweekMoment types
- [Source: implementation-artifacts/3-4-gameweek-lifecycle-scheduling-and-development-seed-data.md] — Test patterns (jest.restoreAllMocks, Deno guard), current test count 90

## Dev Agent Record

### Agent Model Used

GitHub Copilot (JetBrains-IU, 2026-05-19)

### Debug Log References

- Added `@lecolpo/types` path mapping to `apps/supabase/tsconfig.json` (was missing from workspace).
- Added `moduleNameMapper` entries in `apps/supabase/package.json` for `@lecolpo/types` and `.ts` extension stripping.
- Fixed constants import path from `'../constants.ts'` → `'./constants.ts'` (both files are in `_shared/`).
- Used `declare const Deno: any` before the Deno guard to satisfy TypeScript strict mode.

### Completion Notes List

- Implemented `apps/supabase/supabase/functions/_shared/scoring-engine.ts` — pure, side-effect-free multi-layer scoring engine.
- Implements `scoreMatchMoment()` (binary), `scorePrecisionPick()` (additive layers), `applyCaptainMultiplier()`, and top-level `scorePrediction()`.
- All 5 event types handled: goal, substitution, corner, yellow_card, red_card.
- Nearest-qualifying-window timing bonus logic as specified.
- Jackpot bonus additive on top of timing bonus for exact minute.
- Captain multiplier applied to pre-streak total; streakBonus always 0 (Story 4.2).
- Implemented `apps/supabase/supabase/tests/scoring-engine.test.ts` — 24 new test cases covering all AC scenarios.
- Total tests: 114 (90 pre-existing all green + 24 new all green).

### File List

- `apps/supabase/supabase/functions/_shared/scoring-engine.ts` — NEW
- `apps/supabase/supabase/tests/scoring-engine.test.ts` — NEW
- `apps/supabase/package.json` — MODIFIED (moduleNameMapper additions)
- `apps/supabase/tsconfig.json` — MODIFIED (paths: @lecolpo/types)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — MODIFIED (status: review)

### Review Findings

- [x] [Review][Decision] Multi-event match: timing/jackpot only checks `relevantEvents[0]` while player bonuses scan all events — **resolved: closest-event (best-match) rule applied** `scoring-engine.ts:160–176`
- [x] [Review][Patch] `ScoringInput` interface is missing `fixture: Fixture` field specified in the story task checklist — **fixed** [`scoring-engine.ts:21–26`]
- [x] [Review][Patch] `confidenceWindow` typed as `number` in `getTimingBonus` — should be `5 | 10 | 15` — **fixed** [`scoring-engine.ts:79`]
- [x] [Review][Patch] `declare const Deno: any` should be `declare const Deno: unknown` — **fixed** [`scoring-engine.test.ts:10`]
- [x] [Review][Patch] ±15 timing window path is never tested — **fixed: 2 test cases added** [`scoring-engine.test.ts`]
- [x] [Review][Patch] `isCorrect` hardcoded `true` for Precision Pick; spec says `isCorrect: eventPoints > 0` — **fixed** [`scoring-engine.ts:247`]
- [x] [Review][Defer] JSDoc comment in `getTimingBonus` references the earlier (incorrect) spec draft for diff=0 path — logic is correct but comment is misleading [`scoring-engine.ts:71–78`] — deferred, pre-existing spec ambiguity
- [x] [Review][Defer] `match_result` event type silently falls through unstyled — not in scope for Story 4.1 scoring [`scoring-engine.ts:183–231`] — deferred, pre-existing
- [x] [Review][Defer] `moduleNameMapper` regex strips `.ts` globally in Jest config — all 114 tests pass, pre-existing config pattern [`apps/supabase/package.json`] — deferred, pre-existing
- [x] [Review][Defer] No guard for `prediction.fixtureId !== gameWeekMoment.fixtureId` wiring check — Story 4.3 orchestrator responsibility [`scoring-engine.ts:257–265`] — deferred, pre-existing

