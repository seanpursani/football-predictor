# Deferred Work

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

