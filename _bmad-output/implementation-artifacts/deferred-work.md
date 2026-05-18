# Deferred Work

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

## Deferred from: code review of push-sender (_shared/push-sender.ts) (2026-05-18)

- `body` parameter name shadowed by fetch options `body` property — naming-only collision, no runtime bug. Rename fetch option to `fetchBody` or similar in a future refactor pass.
- `response.json()` may throw on non-JSON 2xx responses (e.g., 204 No Content) — gracefully caught by existing try/catch and batch counted as failed. Extremely rare in practice with Expo Push API; revisit if API version changes.
- No retry/backoff on HTTP 429 rate-limiting — entire batch silently counted as failed. Address when implementing high-volume notification flows (e.g., Story 4-3 scoring push).

