# Deferred Work

## Deferred from: code review of 6-1-revealcard-component-and-animation-states (2026-06-03)

- `useEffect` deps array suppresses exhaustive-deps lint warning (eslint-disable comment); `reduceMotion`, `firstView`, `isStreakChained`, `streakBonusPoints`, and `onRevealComplete` are used inside the effect but excluded from deps. Low practical risk since these props are effectively static after mount, but could cause stale closures if the component is ever lifted to a context where props change mid-session. [`RevealCard.tsx:240`]

## Deferred from: code review of 5-5-moments-view-squad-review-and-locked-state (2026-05-21)

- `totalPicks={20}` hardcoded in `GameweekHeader` call in `moments.tsx` — correct value should come from gameweek config; consistent with current stub pattern but would show wrong data if picks-per-gameweek changes. [`moments.tsx`]
- Empty Moment tab state (when picks exist but zero are Precision Picks) — no empty state message shown; spec AC#3 only covers the zero-picks case, Precision Pick-specific empty state not defined until future spec review. [`moments.tsx`]

## Deferred from: code review of 5-4-precision-pick-micro-flow (2026-05-21)

- `MINUTES.indexOf(value)` in MinutePicker has no guard for out-of-range value — if value drifts outside 1–91, `scrollToValue` silently no-ops and `handleScrollEnd` derives an unexpected index on next scroll. Safe in current flow but fragile. [`MinutePicker.tsx`]
- `router.push(... as any)` in `player.tsx` suppresses Expo Router typed route checking for microflow navigation. Pre-existing project pattern (same as other dynamic-query routes); revisit when Expo Router supports typed dynamic query params natively. [`player.tsx` line 31]

## Deferred from: code review of 5-3-squad-management-captain-remove-and-save (2026-05-21)

- `momentType` always `null` in `CaptainPopup` — context label shows `Pick #N` instead of event name; TypeBadge in fallback state. Full MomentType wiring deferred to Story 5.5 where catalog data is needed for Moments View anyway. [`build.tsx` — CaptainPopup call site]
- No loading/disabled state on Save button — user can tap multiple times during in-flight mutation; acceptable for MVP, revisit if double-save becomes an issue [`build.tsx` — saveButton]
- Empty squad (`squad.length === 0`) not guarded in `handleSave` — save fires an empty array upsert; server handles gracefully for now [`build.tsx` — handleSave]
- No slide-out animation on popup close — `pick` null guard returns `null` before Modal can animate; cosmetic/UX polish for a future sprint [`CaptainPopup.tsx` — null guard]
- AC#3 catalog ✓ indicator clearing on remove — may be pre-existing in `useRemovePickMutation` from 5.2; verify when catalog integration is end-to-end tested [`useSquadQuery.ts`]

## Deferred from: code review of 5-2-build-view-fixture-cards-and-match-moment-selection (2026-05-21)

- `SkeletonRow` Reanimated animation not explicitly cancelled on unmount — pre-existing pattern in the codebase; low risk but could cause strict-mode warnings [`SkeletonRow.tsx`]
- `build.tsx` `totalPicks={20}` hardcoded — deliberate constant; revisit when gameweek config surface is introduced [`build.tsx`]
- Concurrent `useAddPickMutation` calls share same `previousSquad` snapshot — rapid-fire taps could roll back the wrong state; acceptable for v1 UX; address if concurrent picks become a real scenario [`useSquadQuery.ts`]
- Historical dots always `correct: true` — `useHistoricalDotsQuery` has no concept of missed/voided events; ✗ dots require a `voided` or `result` field on `match_events`. Wire in ✗ logic when miss tracking is added to the schema [`useCatalogQuery.ts`]

## Deferred from: code review of 5-1-app-state-machine-and-gameweek-phase-detection (2026-05-21)

- Unauthenticated user derives `'reveal'` phase — when no session, userId is null, revealState is disabled, hasSeenReveal defaults false; a completed gameweek would give `'reveal'` phase to unauthenticated users. Pre-existing auth gating concern; address when authentication guard/splash screen is implemented.
- Multiple completed gameweeks across seasons — query returns `status IN ('building', 'locked', 'completed') ORDER BY first_kickoff DESC LIMIT 1`; at start of new season with no active gameweek, could return last season's completed gameweek. Pre-existing data model concern; address when season management is implemented.

## Deferred from: code review of 4-3-scoring-orchestrator-results-persistence-and-push-notification (2026-05-21)

- TOCTOU race on idempotency guard — read-then-write of `scoring_status` is not atomic; a second concurrent call can pass the guard before the first `in_progress` write commits. The idempotency check is a mitigation (better than nothing) but not a full fix. A DB-level advisory lock or `scoring_triggered` boolean is the authoritative solution. Addressed when the double-invocation race is revisited. [`run-scoring/index.ts:56–86`]
- `usersScored` in the success response only counts users with ≥1 prediction contributing to `weeklyScoreByUser` — cosmetic undercount for match-moment-only users. No functional impact. Revisit if this metric is surfaced in monitoring dashboards. [`run-scoring/index.ts:394`]

## Deferred from: code review of 4-2-cross-match-streak-calculator (2026-05-21)

- `MISS_SORT_MINUTE_SENTINEL = 95` is a hardcoded assumption not sourced from `constants.ts`. Works for 2.5h+ kickoff gaps but becomes incorrect if matches are scheduled ≤95 min apart. Revisit in Story 4.3 context when real fixture scheduling constraints are confirmed. [`streak-calculator.ts:52`]
- `fixtureId` declared in `StreakScoringEntry` but never read by the streak algorithm. Consumed by Story 4.3 orchestrator for DB writes. No action needed in streak-calc itself. [`streak-calculator.ts:22`]
- No guard against duplicate `predictionId` in input — silent ambiguous result. Orchestrator (Story 4.3) must ensure deduplication before calling `calculateStreaks()`. [`streak-calculator.ts:88`]

## Deferred from: code review of 4-1-scoring-engine-full-multi-layer-scoring-logic (2026-05-19)

- JSDoc comment in `getTimingBonus` references the earlier (incorrect) spec draft for diff=0 return value — logic is correct but comment is misleading. Consider clarifying in a future cleanup pass. [`scoring-engine.ts:71–78`]
- `match_result` event type silently falls through with no scoring logic. Not in scoring scope for Story 4.1 but could become a bug if `match_result` events appear in the `match_events` table and a prediction references them. Address in Story 4.3 or when `match_result` Precision Pick type is introduced. [`scoring-engine.ts:183–231`]
- `moduleNameMapper` regex `^(\\.{1,2}/.*)\\.ts$` strips `.ts` extensions globally in Jest config — works for current test suite (114 passing) but is fragile if future test files mix `.ts`-extended and non-extended imports. [`apps/supabase/package.json`]
- No guard for `prediction.fixtureId !== gameWeekMoment.fixtureId` wiring mismatch — scoring engine silently returns 0 if caller passes mismatched inputs. Add defensive assertion in Story 4.3's orchestrator. [`scoring-engine.ts:257–265`]

## Deferred from: code review of 3-0-odds-to-points-formula-design-and-calibration (2026-05-11)

- No constants for player/assister/zone bonus values in `constants.ts` — Story 4.1 will need these. Values are expected to come from the DB per-moment (`game_week_moments` columns), not formula constants, so no action needed here. Verify in Story 4.1 that magic numbers are not introduced.
- AC#2 formula traceability: the `oddsToPoints` formula shape exists only in a JSDoc comment in `constants.ts`, not as an exported reference implementation. Acceptable for this constants-only story; Story 3.2 will codify it as `odds-converter.ts`.

## Deferred from: code review of 1-4-mobile-infrastructure-data-layer-and-navigation-skeleton (2026-05-06)

- Placeholder screens hard-code magic colour strings (`'#080808'`, `'#FFFFFF'`) instead of `Colors.*` tokens. Low priority since these are stubs; update when screens get real UI.
- No `gcTime` set on `queryClient`. All queries are currently disabled (`enabled: false`); revisit when real query implementations land in Epic 5.
- `catalog/[fixtureId].tsx` path with square brackets may cause issues on Windows CI agents. Not a concern on current macOS/Linux stack.

## Deferred from: code review of 1-5-cicd-pipeline-and-error-monitoring (2026-05-06)

- `_layout.tsx` imports `@sentry/react-native` twice (side-effect import + namespace import). The namespace import is redundant since `sentry.ts` already exports `Sentry`. Pre-existing style choice, no functional impact; clean up when touching `_layout.tsx` next.

## Deferred from: code review of 2-1-social-login-apple-and-google (2026-05-06)

- Blank screen if `useUserQuery` enters error state post-auth — `_layout.tsx` returns `null` with no error UI. Address with a proper error boundary or error state render in a future story.
- `upsertUser` missing from `useEffect` dependency array in `_layout.tsx` — `eslint-react-hooks` violation. Mutation refs are stable in practice; clean up in a future pass.

## Deferred from: code review of 2-2-user-profile-display-name (2026-05-06)

- `useEffect` in `profile.tsx` calls `setNameInput` on every background refetch, silently clobbering in-progress user edits. Address with a "dirty" guard or by switching to a controlled uncontrolled pattern in a future UX pass.
- Supabase `.update()` does not error on 0-row match — silent no-op if auth_id row is missing. Currently safe given Story 2.1 guarantees row existence, but worth adding a count check when hardening the data layer.
- No success feedback after display name save — spec is silent; address in a future UX iteration.
- `screens.test.ts` uses bare `require(screenPath)` which triggers transitive supabase module init before jest mocks are in scope. Currently works but fragile; revisit with a module-factory or factory-level mock approach.

## Deferred from: code review of 2-3-push-notification-permission-and-token-registration (2026-05-11)

- `onboarding.test.tsx` mock doesn't distinguish first vs second `update()` call — both `has_seen_onboarding` and `push_token` writes share the same mock instance; assertion ordering is not enforced. Improve test isolation when revisiting onboarding.
- Double-tap on notification toggle in `profile.tsx` can fire `updatePushToken` mutation twice before the first settles — needs debounce or in-flight guard; defer to a UX hardening pass.
- `jest.mock` inside `describe` block in `notifications.test.ts` is brittle due to Jest hoisting — tests pass currently but the isolation strategy relies on `resetModules()` execution order. Revisit with a cleaner per-describe module isolation approach.

## Deferred from: code review of 2-5-onboarding-tutorial-screen (2026-05-11)

- `_layout.tsx`: `upsertUser` failure leaves `userRecord` null, silently bypassing the onboarding gate — a brand-new user whose upsert fails enters the tabs unboarded. Pre-existing (Story 2.1); address with retry logic or an error state render in a future hardening pass.
- `_layout.tsx`: `useEffect` missing `upsertUser` in deps array — `eslint-react-hooks` violation; mutation refs are stable in practice. Pre-existing from Story 2.1; clean up in a future lint pass.

## Deferred from: code review of 2-4-rls-prediction-privacy-policies (2026-05-11)

- `first_kickoff IS NULL` keeps predictions permanently writable — if `first_kickoff` is never set on a gameweek, INSERT/UPDATE are never blocked. Pre-existing schema design; `first_kickoff` is expected to always be set before a gameweek goes live (Story 3.4). Revisit with a NOT NULL constraint or a separate `is_locked` flag when Story 3.4 lands.

## Deferred from: code review of 3-4-gameweek-lifecycle-scheduling-and-development-seed-data (2026-05-19)

- **F5** — `ON CONFLICT (gameweek_number) DO NOTHING` in `dev_gameweek.sql` assumes a unique constraint on `gameweek_number`; depends on existing schema from Story 1.3. Verify this constraint exists before Epic 5 development.
- **F6** — `canInsertPrediction` TypeScript helper in `rls-helpers.ts` mirrors the SQL RLS policy predicate but can silently drift if the policy is updated. A proper DB integration test (using `supabase db test` or a live client) is the authoritative verification path; deferred to a future hardening story.
- **F7** — No test for DELETE RLS predicate after deadline. The prediction policies may also gate DELETE; coverage extension not required by this story's AC. Add when hardening the RLS test suite.

## Deferred from: code review of 3-3-match-event-ingestion-and-gameweek-completion-detection (2026-05-18)

- `SupabaseClientLike.from` typed as `any` (`index.ts:18`) — pre-existing pattern inherited from `ingest-odds`; defeats TypeScript safety for all DB calls. Address when the shared client interface is refactored (candidate for a types package utility type).
- Double-invocation race condition — two concurrent `ingest-events` calls for different fixtures in the same gameweek can both pass the `every()` completion check before either writes `events_ingested=true`, invoking `run-scoring` twice. Requires a DB-level idempotency guard (advisory lock, or a `scoring_triggered` boolean flag on the `gameweeks` table). Scope this into Story 4.1 or a dedicated hardening story.

## Deferred from: code review of push-sender (_shared/push-sender.ts) (2026-05-18)

- `body` parameter name shadowed by fetch options `body` property — naming-only collision, no runtime bug. Rename fetch option to `fetchBody` or similar in a future refactor pass.
- `response.json()` may throw on non-JSON 2xx responses (e.g., 204 No Content) — gracefully caught by existing try/catch and batch counted as failed. Extremely rare in practice with Expo Push API; revisit if API version changes.
- No retry/backoff on HTTP 429 rate-limiting — entire batch silently counted as failed. Address when implementing high-volume notification flows (e.g., Story 4-3 scoring push).
