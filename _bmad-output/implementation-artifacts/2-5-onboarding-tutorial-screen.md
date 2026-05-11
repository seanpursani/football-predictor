# Story 2.5: Onboarding Tutorial Screen

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **new user**,
I want a single-screen tutorial that explains Match picks, Moment picks, captain, streaks, and the 20-token limit,
So that I understand how the game works in under 60 seconds and feel confident starting my first squad.

## Acceptance Criteria

1. **Given** a user signs in for the first time and `has_seen_onboarding` is false **When** the app loads after authentication **Then** they are routed to `onboarding.tsx` before reaching the Build View.

2. **Given** the onboarding screen renders **When** the user reads it **Then** it presents exactly 5 core rules on a single screen — no carousel, no scroll required **And** Match and Moment prediction types are visually distinguished using TypeBadge (lime MATCH, violet MOMENT) **And** the 20-token limit, captain mechanic, and streak concept are each explained in one line **And** the screen is completable by reading in under 60 seconds.

3. **Given** the user taps the primary CTA **When** onboarding completes **Then** `has_seen_onboarding` is set to `true` in the `users` table **And** the OS push notification permission prompt is shown (Story 2.3 integration) **And** the user is routed to the Build View.

4. **Given** a returning user opens the app and `has_seen_onboarding` is true **When** the app loads **Then** `onboarding.tsx` is bypassed entirely — they land directly in the Build View.

## Tasks / Subtasks

- [x] Task 1: Verify `onboarding.tsx` implementation (AC: #1, #2, #3)
  - [x] Confirm `app/onboarding.tsx` exists and renders 5 rules: MATCH picks, MOMENT picks, Captain, Streaks, 20 tokens
  - [x] Confirm MATCH and MOMENT rules use TypeBadge-equivalent styling (lime `#B4FF32` and violet `#A78BFA` with matching semi-transparent backgrounds)
  - [x] Confirm CTA button ("Let's go") is lime `#B4FF32` bg with black text — Primary button hierarchy (UX-DR22)
  - [x] Confirm no ScrollView is required to see all 5 rules on a standard device (iPhone 14 / Pixel 7 viewport) — AC #2 "no scroll required". Note: A `ScrollView` wrapper is acceptable as a safe container, but all 5 rules must be visible without scrolling on standard viewports.
  - [x] Confirm the CTA calls `supabase.from('users').update({ has_seen_onboarding: true }).eq('auth_id', authId)` before navigating
  - [x] Confirm push token request (`requestPushPermissionAndGetToken`) is called after marking onboarding seen (Story 2.3 integration)
  - [x] Confirm failure to update `has_seen_onboarding` halts navigation (prevents re-triggering the loop)
  - [x] Confirm navigation uses `router.replace('/(tabs)')` — not `router.push` (no back-stack entry)

- [x] Task 2: Verify onboarding gate in `_layout.tsx` (AC: #1, #4)
  - [x] Confirm `AuthGate` in `app/_layout.tsx` reads `userRecord.hasSeenOnboarding` and redirects to `/onboarding` when false
  - [x] Confirm `useUserQuery` returns a record with `hasSeenOnboarding` field (Drizzle camelCase mapping from `users.has_seen_onboarding`)
  - [x] Confirm `has_seen_onboarding` column exists in the `users` table schema (`packages/types/src/`) — added in Story 1.3 / 2.1
  - [x] Confirm returning users (`hasSeenOnboarding: true`) bypass `onboarding.tsx` and land on `(tabs)`

- [x] Task 3: Run and verify tests (AC: all)
  - [x] Run `pnpm test` from `apps/mobile` — confirm `onboarding.test.tsx` tests pass (7 test cases)
  - [x] Verify test coverage for: renders 5 rules, CTA marks onboarding seen, push token stored, navigation fires, navigation blocked on DB error, null push token handled
  - [x] If any test is failing, fix the root cause (never skip or comment out)

- [x] Task 4: Accessibility audit (AC: #2)
  - [x] CTA `TouchableOpacity` has `accessibilityLabel` (already "Let's go" in implementation)
  - [x] All touch targets ≥ 44×44px (CTA button is 52px tall — confirmed)
  - [x] Rule rows do not need `accessibilityRole` — they are non-interactive static content

- [x] Task 5: Update sprint status (AC: all)
  - [x] Mark all tasks complete in this file
  - [x] Update `sprint-status.yaml`: `2-5-onboarding-tutorial-screen` → `review`

## Dev Notes

### Context: Implementation Status

> **IMPORTANT**: `app/onboarding.tsx` and `app/onboarding.test.tsx` are **already partially implemented** on the `2-5-onboarding-tutorial-screen` branch (committed at `88c9afe`). The dev agent's primary job is to **verify correctness**, fix any gaps, and run tests — not rewrite from scratch.

Current implementation summary (from code review of `app/onboarding.tsx`):
- ✅ 5 rules defined in `RULES` constant array
- ✅ MATCH and MOMENT rules use lime/violet TypeBadge styling (inline `StyleSheet` — no shared `TypeBadge` component yet; that component is scheduled for Epic 5, Story 5.2)
- ✅ CTA button: lime `#B4FF32` bg, black text, 52px height, `border-radius: 6`
- ✅ `handleComplete`: updates `has_seen_onboarding`, requests push token, stores token if returned, navigates to `/(tabs)`
- ✅ Uses `router.replace` (correct — no back entry)
- ✅ Uses `supabase.from('users').update(...).eq('auth_id', authId)` pattern (consistent with Story 2.2/2.3)
- ✅ Navigation is halted if `has_seen_onboarding` update fails
- ✅ Push token failure is non-blocking (navigation proceeds regardless)
- ⚠️ Uses `ScrollView` as container — verify all 5 rules render without needing to scroll on standard viewport
- ⚠️ Inline `StyleSheet` styles (not NativeWind) — acceptable for this story; do NOT refactor to NativeWind in this story

**Onboarding gate in `_layout.tsx`** (from code review):
- ✅ `AuthGate` reads `userRecord.hasSeenOnboarding`
- ✅ Redirects to `/onboarding` when `false`
- ✅ Returns `null` (normal tab render) when `true`

### Architecture Constraints (MUST follow)

- **No separate "submit" action**: `has_seen_onboarding` is set via `supabase.from('users').update(...)` — same pattern as display name in Story 2.2 (AR8: no `useState` for server data; use direct Supabase mutation for simple one-off writes)
- **Auth pattern**: Always use `session?.user?.id` (this is `auth.uid()`) and match against `users.auth_id` column — NEVER use `users.id` directly from session (see Story 2.4 dev notes)
- **QueryClient invalidation**: After writing `has_seen_onboarding`, call `queryClient.invalidateQueries({ queryKey: ['user', authId] })` to ensure `AuthGate` re-evaluates on next mount
- **Push notification integration**: `requestPushPermissionAndGetToken()` from `src/lib/notifications.ts` — must be called AFTER marking onboarding seen. Order matters: if push request crashes, user must not loop back to onboarding (AR3)
- **Navigation**: `router.replace('/(tabs)')` — replaces the current stack entry so the user cannot navigate back to onboarding
- **Error handling tier**: Failure to mark `has_seen_onboarding` — halt navigation with `console.error` (no toast, no modal — this is a critical auth flow error, not a transient UI error). All other failures (push token) are non-blocking. (AR18)

### File Locations

| File | Purpose |
|------|---------|
| `apps/mobile/app/onboarding.tsx` | Onboarding screen — ALREADY EXISTS |
| `apps/mobile/app/onboarding.test.tsx` | Unit tests — ALREADY EXISTS (7 tests) |
| `apps/mobile/app/_layout.tsx` | Auth gate with onboarding redirect — ALREADY EXISTS |
| `apps/mobile/src/queries/useUserQuery.ts` | `useUserQuery` hook — `hasSeenOnboarding` field consumed here |
| `apps/mobile/src/lib/notifications.ts` | `requestPushPermissionAndGetToken` — Story 2.3 utility |

### Key Types

`users` table (from `packages/types/src/` Drizzle schema):
```typescript
// DB column: has_seen_onboarding (boolean, default false)
// Drizzle camelCase mapping: hasSeenOnboarding
```

`useUserQuery` return type should include:
```typescript
{
  id: string;           // users.id (uuid)
  authId: string;       // users.auth_id
  displayName: string | null;
  hasSeenOnboarding: boolean;
  pushToken: string | null;
}
```

### UX Design Requirements (from UX-DR spec)

- **TypeBadge inline implementation** (Epic 5 will extract to shared component — do NOT create a shared component now):
  - MATCH: `rgba(180,255,50,0.12)` bg on row, `rgba(180,255,50,0.2)` badge bg, `#B4FF32` text
  - MOMENT: `rgba(167,139,250,0.15)` bg on row, `rgba(167,139,250,0.2)` badge bg, `#A78BFA` text
  - Label: 11px (caption scale), uppercase text
- **Primary CTA** (UX-DR22): lime bg `#B4FF32`, black text, `radius-md` (6px), full-width, one per screen
- **Screen padding**: 16px horizontal (UX-DR3)
- **Background**: `#080808` (bg-primary) (UX-DR1)
- **Text**: heading-1 for "How it works" (24px/700), body for rule descriptions (15px/400), label for rule titles (13px/500)

### Testing Standards

Test framework: Jest + `@testing-library/react-native` (configured in `apps/mobile`)

All mocks required for `onboarding.test.tsx`:
- `expo-router` → mock `useRouter` returning `{ replace: jest.fn() }`
- `@/src/hooks/useAuthState` → mock returning `{ session: { user: { id: 'test-auth-id' } }, isLoading: false }`
- `@/src/queries/useUserQuery` → mock `useUserQuery`, `useUpsertUserMutation`, `useUpdatePushTokenMutation`
- `@/src/lib/notifications` → mock `requestPushPermissionAndGetToken`
- `@/src/lib/queryClient` → mock `queryClient.invalidateQueries`
- `@/src/lib/supabase` → mock `supabase.from().update().eq()` chain

Run tests with: `cd apps/mobile && pnpm test onboarding`

### Previous Story Learnings (from Stories 2.1–2.4)

- `supabase.from().update().eq()` is a chained API — mock the full chain in tests or tests will fail with `.eq is not a function` (confirmed in 2.4 dev notes)
- `useUserQuery` data uses camelCase (`hasSeenOnboarding`) not snake_case — Drizzle does this automatically
- `.maybeSingle()` not `.single()` for queries that may return null (Story 2.2)
- `queryClient.invalidateQueries` should be called after writes to keep TanStack Query cache fresh
- Integration tests (Supabase RLS) are separate from Jest mobile tests — mobile tests use mocks only, no local DB required
- `auth_id` on `users` table === `auth.uid()` (Supabase auth session `user.id`) — never confuse with `users.id` (uuid PK)

### Story Note (from Epics file)

> This screen uses static content only. Tutorial copy and visual examples should be finalized after Epic 5 (Match Builder) is complete so the rules described accurately match the real UI the user will encounter. The screen can be scaffolded now with placeholder content.

The current implementation content is **production-ready placeholder copy**. Do not spend time perfecting the copy — it will be updated post-Epic 5.

### Review Findings

- [x] [Review][Patch] No loading/disabled state on CTA during async `handleComplete` [onboarding.tsx:122] — Fixed: added `isSubmitting` state; CTA is disabled and visually dimmed while in-flight.
- [x] [Review][Patch] Silent no-op when `authId` is null at CTA tap [onboarding.tsx:52] — Fixed: added `console.error` log for the null-session case.
- [x] [Review][Patch] Missing test: push token store DB failure is non-blocking [onboarding.test.tsx] — Fixed: added test `'still navigates when push token store fails (non-blocking)'`. All 9 tests passing.
- [x] [Review][Defer] `_layout.tsx`: upsertUser failure leaves userRecord null, bypassing onboarding gate [_layout.tsx:56-63] — deferred, pre-existing (Story 2.1)
- [x] [Review][Defer] `_layout.tsx`: useEffect missing `upsertUser` in deps array [_layout.tsx:43] — deferred, pre-existing lint issue from Story 2.1

## Dev Agent Record

### Agent Model Used

GitHub Copilot (GPT-4.1)

### Debug Log References

_none — no issues encountered_

### Completion Notes List

- ✅ Verified `app/onboarding.tsx`: renders 5 rules (MATCH, MOMENT, Captain, Streaks, 20 tokens) with correct TypeBadge-equivalent inline styling
- ✅ Verified CTA: lime `#B4FF32` bg, black text, 52px height, `accessibilityLabel="Let's go"`, `router.replace('/(tabs)')`
- ✅ Verified `handleComplete`: marks `has_seen_onboarding` via Supabase, invalidates query cache, requests push token (non-blocking), then navigates
- ✅ Verified `_layout.tsx` `AuthGate`: reads `userRecord.hasSeenOnboarding`, redirects to `/onboarding` when false
- ✅ All 8 tests in `onboarding.test.tsx` pass (8 passed, 0 failed)

### File List

No new files created. Existing implementation verified as correct:
- `apps/mobile/app/onboarding.tsx`
- `apps/mobile/app/onboarding.test.tsx`
- `apps/mobile/app/_layout.tsx`


