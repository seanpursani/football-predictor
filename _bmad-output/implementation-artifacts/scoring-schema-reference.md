# Scoring Schema Reference

**Generated:** 2026-06-02  
**Sources:** `migrations/0000_worthless_naoko.sql`, `migrations/0005_leaderboard_upsert_and_rank_rpc.sql`, `4-1-scoring-engine-full-multi-layer-scoring-logic.md`, `4-3-scoring-orchestrator-results-persistence-and-push-notification.md`, `6-1-reveal-card-component-and-animation-states.md`, `seeds/dev_moment_types.sql`

---

## 1. `scoring_results`

One row per prediction per scoring run. Written by `run-scoring/index.ts` via upsert on `prediction_id`.

| Column | Type | Default | Reveal UI Semantic |
|---|---|---|---|
| `id` | serial PK | — | Internal; not consumed by reveal UI |
| `prediction_id` | integer FK → `predictions.id` | — | Upsert key; links result to the user's prediction |
| `user_id` | uuid FK → `users.id` | — | Used to build per-user result sets passed to the reveal sequence |
| `gameweek_id` | integer FK → `gameweeks.id` | — | Scopes results to the active gameweek; used to query all cards in `RevealSequence` (6.2) |
| `event_points` | integer | 0 | **Event layer indicator.** Non-zero = the predicted event occurred. Combined with other bonus columns to calculate displayed layer breakdown. Drives the `hit` vs `miss` branch before captain/jackpot checks. |
| `timing_bonus` | integer | 0 | **Timing window bonus indicator.** Values: 50 (±5 window hit), 25 (±10 window hit), 0 (±15 or miss). Shown as a timing layer line in the reveal score breakdown. |
| `player_bonus` | integer | 0 | **Player/scorer/player-on bonus indicator.** Non-zero = correct player predicted (goal scorer, sub player coming on, yellow/red card recipient). Shown as a player layer line in the score breakdown. |
| `assister_bonus` | integer | 0 | **Assister/player-off bonus indicator.** Non-zero = correct assister (goal) or player going off (substitution) predicted. Shown as an assister layer line. |
| `zone_bonus` | integer | 0 | **Corner zone bonus indicator.** Non-zero = correct zone predicted for a corner event. Shown as a zone layer line. |
| `jackpot_bonus` | integer | 0 | **🎯 Jackpot animation trigger.** Non-zero (value = `JACKPOT_BONUS` = 100) means the user predicted the exact real-world event minute. Triggers `revealState = 'jackpot'` on `RevealCard`: gold burst background (`#FFD700` at 0.25 opacity, `withTiming` 200ms), card scale-up `1.0 → 1.05` (`withSpring`), ⚡ icon, and `Haptics.notificationAsync(NotificationFeedbackType.Success)`. |
| `captain_multiplier` | integer | 1 | **👑 Captain 2× badge trigger.** Value is `2` when the user designated this pick as their captain, `1` otherwise. A value of `2` triggers `revealState = 'captain-hit'` (when `is_correct = true`) on `RevealCard`: gold flash ×2 (`#FFD700` 0.2 opacity), crown icon scale `1.0 → 1.3 → 1.0`, `Haptics.impactAsync(ImpactFeedbackStyle.Medium)`. **Important:** `captain_multiplier = 2` is stored even if `is_correct = false` (captain on a miss) so the reveal UI can display the crown badge on a missed captain pick too. |
| `streak_bonus` | integer | 0 | **🔗 Streak-chain animation trigger.** Populated by `run-scoring` from `StreakResultEntry.streakBonus` (story 4.2). Non-zero values: 10 (2-pick streak), 20 (3-pick streak), 30 (4+ pick streak). Drives `isStreakChained = true` and `streakBonusPoints` prop on `RevealCard` (AC9): synchronised lime pulse across chained cards, `"+N"` badge fades in with scale `0.8 → 1.0` (`withSpring`). |
| `total_points` | integer | 0 | **Running score counter.** The streak-adjusted final score: `(eventPoints + timingBonus + playerBonus + assisterBonus + zoneBonus + jackpotBonus) × captainMultiplier + streakBonus`. This is `StreakResultEntry.totalPointsWithStreak` — NOT `ScoringOutput.totalPoints`. Drives the animated running points counter in `RevealSequence` (6.2) and the weekly leaderboard score aggregation. |
| `is_correct` | boolean | false | **Hit/miss state router.** `true` if `eventPoints > 0` (the predicted event occurred). Drives the primary `RevealCard` branch: `true` → resolves to `hit` (lime `#B4FF32` fade, ✓ icon, light haptic), `false` → `miss` (dark grey `#303030` fade, ✗ icon, no haptic). Further refined to `captain-hit` or `jackpot` when `captain_multiplier = 2` or `jackpot_bonus > 0` respectively. |
| `created_at` | timestamptz | `now()` | Audit/debug only; not consumed by reveal UI |

### `scoring_results` RevealState Decision Tree

```
is_correct = false  →  'miss'       (grey bg, ✗, no haptic)
is_correct = true
  jackpot_bonus > 0                 →  'jackpot'      (gold burst, ⚡, heavy haptic)
  captain_multiplier = 2            →  'captain-hit'  (gold flash ×2, 👑, medium haptic)
  otherwise                         →  'hit'          (lime fade, ✓, light haptic)

streak_bonus > 0 (any is_correct)  →  overlay streak-chain animation on top
```

> **Note:** Jackpot and captain-hit are mutually exclusive in the `RevealState` enum (`6-1`). Story 6.1 (AC6) states "jackpot is **independent of captain** — a non-captain pick can also jackpot" but does **not** define priority when both conditions hold (exact-minute captain pick). The parent `RevealSequence` (6.2) must resolve this. A reasonable convention is jackpot takes precedence (more dramatic), with the captain crown still surfaced via the `isCaptain` prop — but this requires explicit confirmation in Story 6.2.

---

## 2. `leaderboard_entries`

Materialised by `run-scoring/index.ts` after all `scoring_results` are written. Upserted twice per run: once for `leaderboard_type = 'weekly'`, once for `leaderboard_type = 'season'`. Ranks assigned via the `assign_leaderboard_ranks` RPC (migration `0005`).

| Column | Type | Default | Reveal / Leaderboard UI Semantic |
|---|---|---|---|
| `id` | serial PK | — | Internal; not consumed by UI |
| `user_id` | uuid FK → `users.id` | — | User whose leaderboard position this row represents |
| `gameweek_id` | integer FK → `gameweeks.id`, **nullable** | — | `NOT NULL` for `leaderboard_type = 'weekly'` (scoped to one gameweek). **NULL** for `leaderboard_type = 'season'` (cumulative across all gameweeks). The partial unique index `leaderboard_entries_season_unique` enforces the NULL keying for season rows. |
| `leaderboard_type` | text | — | `'weekly'` — single gameweek board; `'season'` — cumulative. Check constraint enforces these two values. Drives which leaderboard tab/view the row appears in. |
| `score` | integer | 0 | **Leaderboard score display.** For weekly: sum of `scoring_results.total_points` for this user + gameweek. For season: sum of all weekly `leaderboard_entries.score` for this user. This is the primary numeric value shown on the leaderboard cards in Epic 7. |
| `rank` | integer, nullable | — | **Current rank position.** Assigned by `RANK() OVER (ORDER BY score DESC)` inside `assign_leaderboard_ranks`. Drives the rank number badge on the leaderboard screen. `NULL` before first scoring run. |
| `previous_rank` | integer, nullable | — | **Rank-change delta indicator.** Stores the rank value from the previous scoring run (preserved before `rank` is overwritten). Drives the rank movement arrow/chevron in the leaderboard UI (Epic 7): `previous_rank > rank` → moved up (green), `previous_rank < rank` → moved down (red), equal → no change, `NULL` → first appearance (new entry badge). |
| `created_at` | timestamptz | `now()` | Audit only |
| `updated_at` | timestamptz | `now()` | Updated by `assign_leaderboard_ranks` RPC on every rank recalculation; can be used to show "last updated" freshness indicator |

### Unique Constraints (from migration `0005`)

| Constraint | Scope | Purpose |
|---|---|---|
| `leaderboard_entries_weekly_unique` | `(user_id, gameweek_id, leaderboard_type)` | Enables upsert conflict resolution for weekly rows |
| `leaderboard_entries_season_unique` | `(user_id, leaderboard_type) WHERE gameweek_id IS NULL` | Partial unique index for season aggregate rows (PostgreSQL treats NULLs as distinct in regular unique constraints; this partial index works around that) |

---

## 3. `match_result` in Catalog Seed Data

**Verified:** `match_result` **is present** as a `moment_types.event_type` in `apps/supabase/supabase/seeds/dev_moment_types.sql`.

| `name` | `event_type` | `prediction_type` |
|---|---|---|
| Match Result - Home Win | `match_result` | `match` |
| Match Result - Away Win | `match_result` | `match` |
| Match Result - Draw | `match_result` | `match` |

All three share `event_type = 'match_result'` and `prediction_type = 'match'` (Match Moment — binary hit/miss).

### Scoring Engine Handling of `match_result`

`match_result` predictions are routed to `scoreMatchMoment()` in `scoring-engine.ts` (via `prediction_type = 'match'`). Match Moments score `gameWeekMoment.basePoints` if any `match_events` row exists for `(matchId, 'match_result')`, and 0 otherwise.

**⚠️ Gap identified:** The `match_events` table stores event types from the external API (`goal`, `substitution`, `corner`, `yellow_card`, `red_card`). A `match_result` event type is **not emitted by the ingest pipeline** (`ingest-events/index.ts`, Story 3.3) as a per-event row — match results are derived from match fixture state, not from individual `match_events` rows. This means:

- If no `match_events` row with `event_type = 'match_result'` is ever inserted, all `match_result` predictions will score 0 regardless of the actual result.
- Story 4.1 review deferred this: `"match_result event type silently falls through unstyled — not in scope for Story 4.1 scoring"`.
- Story 4.3 also deferred: `"if match_result predictions appear, they will score 0 via the Precision Pick branch (no event match) — acceptable for MVP"`.

**Action required (outstanding — not addressed in Epics 1–5):** Verify whether `ingest-events` inserts a synthetic `match_result` event row after fixture completion, or whether the scoring engine needs a dedicated match-result scoring path that reads from `fixtures` (home/away score) rather than `match_events`. Tracked in `deferred-work.md` under "4-1-scoring-engine-full-multi-layer-scoring-logic": *"Address in Story 4.3 or when `match_result` Precision Pick type is introduced."* Story 4.3 did not resolve it. Must be addressed before match-result predictions can score correctly in production.

---

## 4. Full Column → Reveal Semantic Quick Reference

| Column | Table | Drives |
|---|---|---|
| `is_correct` | `scoring_results` | `hit` vs `miss` RevealState |
| `jackpot_bonus` | `scoring_results` | `jackpot` RevealState (⚡ gold burst + heavy haptic) |
| `captain_multiplier` | `scoring_results` | `captain-hit` RevealState (👑 gold flash + medium haptic); crown badge even on miss |
| `streak_bonus` | `scoring_results` | Streak-chain overlay animation + `"+N"` bonus badge |
| `total_points` | `scoring_results` | Running score counter animation in RevealSequence |
| `event_points` | `scoring_results` | Base hit/miss indicator; event layer in score breakdown |
| `timing_bonus` | `scoring_results` | Timing layer in score breakdown (50 / 25 / 0) |
| `player_bonus` | `scoring_results` | Player layer in score breakdown |
| `assister_bonus` | `scoring_results` | Assister/player-off layer in score breakdown |
| `zone_bonus` | `scoring_results` | Zone layer in score breakdown (corners) |
| `score` | `leaderboard_entries` | Leaderboard card numeric value |
| `rank` | `leaderboard_entries` | Rank number badge |
| `previous_rank` | `leaderboard_entries` | Rank movement arrow (up/down/new) |
| `leaderboard_type` | `leaderboard_entries` | Tab selector: Weekly vs Season board |
| `gameweek_id` (NULL) | `leaderboard_entries` | Season cumulative aggregate row sentinel |

