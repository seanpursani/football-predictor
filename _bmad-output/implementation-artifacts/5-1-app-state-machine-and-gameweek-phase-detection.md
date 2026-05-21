# Story 5.1: App State Machine & Gameweek Phase Detection

Status: done

## Story

As a **user**,
I want the app to automatically show the right view based on the current gameweek phase,
So that I always land in the correct context — building my squad, waiting for results, or seeing the reveal.

## Acceptance Criteria

1. **Given** the app comes to the foreground **When** `AppState` fires a `change` event to `'active'` **Then** the current gameweek record is fetched from Supabase **And** the phase is derived: `now < first_kickoff` → `Building`; `first_kickoff ≤ now < scoring_complete` → `Locked`; `scoring_status = 'complete' AND !reveal_seen` → `Reveal` **And** the derived phase is stored in `useGameweekStore` for synchronous reads across all components.

2. **Given** the gameweek phase is `Building` **When** the user opens the app **Then** `(tabs)/build.tsx` (Build View) is the active home screen.

3. **Given** the gameweek phase is `Locked` **When** the user opens the app **Then** `(tabs)/moments.tsx` (Moments View) is the active home screen with locked state UI.

4. **Given** the gameweek phase is `Reveal` **When** the user opens the app for the first time after scoring completes **Then** the reveal sequence is triggered (Epic 6 implements the animation — this story gates the condition correctly).

5. **Given** `useGameweekQuery` fetches the current gameweek **When** the TanStack Query key is used **Then** it uses exactly `['gameweek', 'current']` — no invented key structures.

## Tasks / Subtasks

- [x] Task 1: Implement `useGameweekQuery` in `apps/mobile/src/queries/useGameweekQuery.ts` (AC: #1, #5)
  - [x] Replace the existing stub (currently `enabled: false`, returns null) with a real Supabase fetch
  - [x] Query `gameweeks` table for the current active gameweek: `status = 'building'` OR (`scoring_status != 'complete'` and there is a recent gameweek within the season)
  - [x] Implement as: fetch the `gameweeks` row where `status IN ('building', 'locked')` ORDER BY `first_kickoff DESC` LIMIT 1; fall back to most recent `completed` gameweek if none active (to support reveal state)
  - [x] Return `Gameweek | null` — the full typed row from `@lecolpo/types`
  - [x] Use query key `['gameweek', 'current']` exactly — no deviation
  - [x] Enable the query (remove `enabled: false` — it was disabled pending Epic 5)
  - [x] Set `staleTime: 60_000` (1 minute) — foreground refetch is the primary mechanism, not constant polling

- [x] Task 2: Implement `useUserGameweekStateQuery` in `apps/mobile/src/queries/useGameweekQuery.ts` (AC: #1, #4)
  - [x] Query `user_gameweek_states` for `(userId, gameweekId)` to check `has_seen_reveal`
  - [x] Use query key `['gameweek', 'reveal-state', gameweekId, userId]`
  - [x] Return `UserGameweekState | null`
  - [x] Only execute when both `gameweekId` and `userId` are non-null (use `enabled` option)

- [x] Task 3: Implement phase derivation logic in `apps/mobile/src/utils/gameweekPhase.ts` (AC: #1)
  - [x] Export `deriveGameweekPhase(gameweek: Gameweek | null | undefined, hasSeenReveal: boolean, now?: Date): GameweekPhase | null`
  - [x] Return `null` if `gameweek` is null/undefined (no active gameweek)
  - [x] `'building'` if `now < gameweek.firstKickoff` (or `firstKickoff` is null)
  - [x] `'reveal'` if `gameweek.scoringStatus === 'complete'` AND `!hasSeenReveal`
  - [x] `'locked'` for all other cases (between kickoff and reveal — including `scoringStatus = 'error'`, show locked state)
  - [x] Use `now` parameter (defaults to `new Date()`) to allow deterministic unit testing — **no `new Date()` inside the function body**
  - [x] Export the function type: `export type DeriveGameweekPhase = typeof deriveGameweekPhase`
  - [x] Co-locate tests: `apps/mobile/src/utils/gameweekPhase.test.ts`

- [x] Task 4: Add `AppState` foreground listener + phase sync in `apps/mobile/app/(tabs)/_layout.tsx` (AC: #1, #2, #3, #4)
  - [x] Import `AppState` from `react-native`
  - [x] Add `useEffect` that registers `AppState.addEventListener('change', handler)` and cleans up on unmount
  - [x] On state change to `'active'`: call `queryClient.invalidateQueries({ queryKey: ['gameweek', 'current'] })` to trigger a fresh fetch
  - [x] Import `useGameweekQuery`, `useUserGameweekStateQuery`, and `useGameweekStore`
  - [x] Import `deriveGameweekPhase` from `@/src/utils/gameweekPhase`
  - [x] After query data resolves, call `deriveGameweekPhase()` and call `setPhase()` + `setCurrentGameweekId()` on `useGameweekStore`
  - [x] Use `useEffect` with `[gameweek, revealState]` as dependencies so phase updates reactively — not just on foreground
  - [x] Also store `reduceMotion` result here: call `AccessibilityInfo.isReduceMotionEnabled()` once on mount and store result in `useRevealStore` (consumed by Epic 6); import `AccessibilityInfo` from `react-native`

- [x] Task 5: Implement redirect logic in `apps/mobile/app/(tabs)/build.tsx` and `apps/mobile/app/(tabs)/moments.tsx` (AC: #2, #3, #4)
  - [x] In `build.tsx`: read `phase` from `useGameweekStore`; if phase is `'locked'` or `'reveal'`, render `<Redirect href="/(tabs)/moments" />` — Build View is only valid in `'building'` phase
  - [x] In `moments.tsx`: read `phase` from `useGameweekStore`; if phase is `'building'`, render `<Redirect href="/(tabs)/build" />` — Moments View is only valid in `'locked'` or `'reveal'` phases
  - [x] **Gate the redirect on `phase !== null`** — while phase is still null (loading), render neither redirect nor a crash; render a safe loading state (e.g., `null` or a subtle full-screen bg) until phase is established
  - [x] This story does NOT implement the reveal animation (Epic 6) — the `'reveal'` phase condition in moments.tsx should render a placeholder or the existing moments view without animation; this is the gating condition, not the animation

- [x] Task 6: Update `useGameweekStore` if needed (AC: #1)
  - [x] Verify `GameweekPhase` type in `useGameweekStore.ts` matches `'building' | 'locked' | 'reveal' | null` — the existing store uses lowercase which is correct
  - [x] Ensure the store exposes `setPhase` and `setCurrentGameweekId` — these exist already, no change required
  - [x] **Do NOT add server data to the store** — only phase and ID are stored; the full Gameweek object stays in TanStack Query cache

- [x] Task 7: Update `useRevealStore` to hold `reduceMotion` flag (consumed by Tasks 4 and Epic 6)
  - [x] Add `reduceMotion: boolean` to `useRevealStore` state (default `false`)
  - [x] Add `setReduceMotion: (v: boolean) => void` action
  - [x] This flag is set once on app mount (Task 4) and read by Epic 6's RevealSequence

- [x] Task 8: Write unit tests — `apps/mobile/src/utils/gameweekPhase.test.ts` (AC: #1–#4)
  - [x] Test: no gameweek → returns `null`
  - [x] Test: now < firstKickoff → `'building'`
  - [x] Test: now >= firstKickoff, scoring not complete, reveal not seen → `'locked'`
  - [x] Test: scoringStatus = 'complete', hasSeenReveal = false → `'reveal'`
  - [x] Test: scoringStatus = 'complete', hasSeenReveal = true → `'locked'`
  - [x] Test: scoringStatus = 'error' → `'locked'` (not `'reveal'`, not crash)
  - [x] Test: firstKickoff is null → `'building'` (treated as not yet kicked off)
  - [x] Use Jest + React Native Testing Library (project testing standard)
  - [x] All pre-existing tests must remain green (do not break stores.test.ts or useUserQuery.test.ts)

- [x] Task 9: Update sprint status
  - [x] Mark tasks complete in this story file
  - [x] Update `sprint-status.yaml`: `5-1-app-state-machine-and-gameweek-phase-detection: review`
  - [x] Move epic-5 status from `backlog` to `in-progress`

## Dev Notes

### What This Story Delivers

```
apps/mobile/src/queries/useGameweekQuery.ts        ← MODIFIED: real query + new useUserGameweekStateQuery
apps/mobile/src/utils/gameweekPhase.ts             ← NEW: pure phase derivation logic
apps/mobile/src/utils/gameweekPhase.test.ts        ← NEW: unit tests
apps/mobile/app/(tabs)/_layout.tsx                 ← MODIFIED: AppState listener + phase sync
apps/mobile/app/(tabs)/build.tsx                   ← MODIFIED: phase-gated redirect
apps/mobile/app/(tabs)/moments.tsx                 ← MODIFIED: phase-gated redirect
apps/mobile/src/stores/useRevealStore.ts           ← MODIFIED: add reduceMotion flag
```

No new migrations, no Supabase Edge Functions, no schema changes.

### Existing Code to Build On

**`useGameweekStore`** already exists at `src/stores/useGameweekStore.ts` with `phase`, `currentGameweekId`, `setPhase`, `setCurrentGameweekId`. The `GameweekPhase` type is already `'building' | 'locked' | 'reveal' | null`. No changes needed to the store state shape.

**`useGameweekQuery`** exists as a stub at `src/queries/useGameweekQuery.ts` — currently disabled (`enabled: false`) with a TODO comment. This story activates it with a real implementation.

**`Gameweek` type** is defined in `packages/types/src/schema/gameweeks.ts` via Drizzle:
```typescript
export type Gameweek = {
  id: number;
  gameweekNumber: number;
  firstKickoff: Date | null;
  lastMatchEnd: Date | null;
  scoringStatus: string;   // 'pending' | 'in_progress' | 'complete' | 'error'
  status: string;          // 'building' | 'locked' | 'completed'
  season: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**`UserGameweekState`** type is defined in `packages/types/src/schema/admin.ts`:
```typescript
export type UserGameweekState = {
  id: number;
  userId: string;
  gameweekId: number;
  hasSeenReveal: boolean;
  boldnessScore: number | null;
  createdAt: Date;
}
```

**Supabase client** is a singleton at `src/lib/supabase.ts` — import from there only, never reinitialise.

**`queryClient`** is exported from `src/lib/queryClient.ts` — use `queryClient.invalidateQueries()` for the foreground refetch trigger.

### Architecture: Phase Derivation Rules

The phase derivation must exactly follow the architecture spec (Architecture section: "Gameweek State Machine"):

```
now < first_kickoff           → Building
first_kickoff ≤ now           → Locked  (base case)
scoring_status = 'complete'
  AND reveal_seen = false     → Reveal  (overrides Locked)
```

The `Reveal` phase check must come **before** returning `Locked` — check scoring complete + reveal flag first, then fall through to Locked.

**Critical:** `scoring_status = 'error'` must map to `'locked'`, not to reveal. The mobile app shows "Results delayed — we're looking into it" in the locked state UI when status is error (this display is Epic 5.5/6's responsibility).

### Architecture: AppState Integration Pattern

Following the architecture decision (AR8, mobile state machine section):
- Phase is derived on **every app foreground** — not by realtime subscription
- Realtime subscriptions are deferred post-MVP
- TanStack Query's `invalidateQueries` is the correct mechanism to trigger the fresh fetch when foregrounding

```typescript
// Pattern to use in (tabs)/_layout.tsx
useEffect(() => {
  const subscription = AppState.addEventListener('change', (nextState) => {
    if (nextState === 'active') {
      queryClient.invalidateQueries({ queryKey: ['gameweek', 'current'] });
    }
  });
  return () => subscription.remove();
}, []);
```

### Architecture: Navigation Pattern

The architecture specifies (Navigation section):
> "Save/Edit toggle between Build View and Moments View (not a navigation stack — no back gesture)"

This means the redirect approach (using Expo Router `<Redirect />`) is correct — both build.tsx and moments.tsx redirect to each other based on phase. There is no stack push here; it's a phase-driven landing screen swap.

### Architecture: TanStack Query Key Must Match Exactly

From architecture section "TanStack Query Key Conventions":
```typescript
['gameweek', 'current']   // useGameweekQuery — exactly this, no variation
```

The `invalidateQueries` call in the AppState handler must use the same key so the foreground refetch invalidates the correct query.

### Supabase Query Pattern

Fetch the active gameweek using the Supabase JS client:

```typescript
import {supabase} from '@/src/lib/supabase';
import type {Gameweek} from '@lecolpo/types';

// Active gameweek = one that is 'building' or 'locked'
// Fall back to most recent 'completed' if none active (supports reveal detection)
const {data, error} = await supabase
  .from('gameweeks')
  .select('*')
  .in('status', ['building', 'locked', 'completed'])
  .order('first_kickoff', {ascending: false})
  .limit(1)
  .single();
```

Use `.maybeSingle()` instead of `.single()` if no row should return null rather than throw.

For `user_gameweek_states`:
```typescript
const {data, error} = await supabase
  .from('user_gameweek_states')
  .select('*')
  .eq('user_id', userId)
  .eq('gameweek_id', gameweekId)
  .maybeSingle();
```

### Key Constraints / Anti-Patterns to Avoid

1. **Do NOT use `useState` for server data** — the gameweek record lives in TanStack Query cache only; `useGameweekStore` only stores the derived `phase` and `currentGameweekId`
2. **Do NOT put the full `Gameweek` object in Zustand** — only the scalar values
3. **Do NOT call `new Date()` inside `deriveGameweekPhase()`** — accept `now` as a parameter so tests can pass a deterministic date
4. **Do NOT add `console.log`** — use `console.error` only for actual errors; no debug logging in production code
5. **Do NOT reinitialise Supabase client** — import only from `src/lib/supabase.ts`
6. **Do NOT gate the redirect on `phase === 'building'` alone** — must also handle `phase === null` during initial load or the app will flicker to the wrong screen

### Previous Story Intelligence (from 4-3)

Story 4-3 established the scoring pipeline that populates `gameweeks.scoring_status`. Relevant patterns:
- `scoring_status` transitions: `pending → in_progress → complete | error`
- The `user_gameweek_states` table exists with `has_seen_reveal` boolean and unique constraint on `(user_id, gameweek_id)`
- The reveal state must be upserted (not just inserted) due to the unique constraint

From review findings in 4-3:
- Secondary DB writes should each be wrapped in try/catch (pattern applies here too — if setting reveal_seen fails, don't crash)
- Guard against null/undefined before accessing nested object properties

### UX Design Requirements for This Story

From UX-DR26 (App state machine):
> Three states: Building (Build View, full editing), Locked/Live (Moments View + BoldnessHeroCard, read-only), Reveal (auto-reveal sequence, one-time on first open after last match); transitions detected on app foreground via AppState listener; `reveal_seen` flag per-user in Supabase prevents re-triggering reveal animation

From UX-DR29 (Reduced motion):
> `AccessibilityInfo.isReduceMotionEnabled()` checked on app mount once; result passed through RevealSequence as prop

This story is responsible for:
- ✅ Checking `AccessibilityInfo.isReduceMotionEnabled()` on mount and storing in `useRevealStore`
- ✅ AppState listener + phase derivation + store update
- ✅ Phase-based redirect (which screen renders as home)
- ❌ NOT: reveal animation (Epic 6), locked state UI with BoldnessHeroCard (Epic 5.5), Build View content (Epic 5.2)

### File Locations and Imports

All imports use the `@/` alias configured in the project (`@` → `apps/mobile`):

```typescript
import {supabase} from '@/src/lib/supabase';
import {useGameweekStore} from '@/src/stores/useGameweekStore';
import {useRevealStore} from '@/src/stores/useRevealStore';
import {deriveGameweekPhase} from '@/src/utils/gameweekPhase';
import {queryClient} from '@/src/lib/queryClient';
import type {Gameweek, UserGameweekState} from '@lecolpo/types';
```

### Test File Pattern

From stores.test.ts and useUserQuery.test.ts patterns already in the project — Jest is configured, tests are co-located with source files (not in a `__tests__` directory per architecture rule). No special setup needed beyond what's already there.

### Review Findings

- [x] [Review][Decision] `setReduceMotion` in `useRevealStore` — DISMISSED: store already has `reduceMotion: boolean` and `setReduceMotion`; dev notes confirmed correct
- [x] [Review][Patch] Supabase returns ISO strings not `Date` objects — FIXED: added `parseGameweekDates()` transformer in queryFn [`useGameweekQuery.ts`]
- [x] [Review][Patch] `deriveGameweekPhase` default param `now: Date = new Date()` violates spec anti-pattern — FIXED: all call sites now pass `new Date()` explicitly [`_layout.tsx`]
- [x] [Review][Patch] `AccessibilityInfo.isReduceMotionEnabled()` — unhandled promise rejection — FIXED: added `.catch()` [`_layout.tsx`]
- [x] [Review][Patch] Unsafe type casts `userId as string` and `gameweekId as number` — FIXED: runtime null guards added inside queryFn [`useGameweekQuery.ts`]
- [x] [Review][Patch] Transient `'reveal'` phase flash — FIXED: phase derivation gated on `!revealStateLoading` [`_layout.tsx`]
- [x] [Review][Patch] Missing boundary test `now === firstKickoff` — FIXED: test added (9 tests pass) [`gameweekPhase.test.ts`]
- [x] [Review][Defer] Unauthenticated user derives `'reveal'` phase — when no session, userId is null, revealState is disabled, hasSeenReveal defaults false; completed gameweek would give 'reveal' — deferred, pre-existing auth gating concern
- [x] [Review][Defer] Multiple completed gameweeks across seasons — query could return last season's gameweek when new season has no active gameweek yet — deferred, pre-existing data model concern

## Story Progress Notes

_Dev agent: Update this section as you implement tasks._

### Dev Agent Record

**Implementation Date:** 2026-05-21

**Implementation Plan:**
- Activated `useGameweekQuery` with real Supabase fetch (status IN building/locked/completed, order by first_kickoff DESC, limit 1, maybeSingle)
- Added `useUserGameweekStateQuery` for reveal-state check per user/gameweek
- Created `deriveGameweekPhase()` pure function in `src/utils/gameweekPhase.ts` — accepts `now` param for deterministic testing
- Updated `(tabs)/_layout.tsx` with AppState listener, phase derivation effect, and AccessibilityInfo.isReduceMotionEnabled() on mount
- Updated `build.tsx` and `moments.tsx` with phase-gated redirects; null-safe loading state renders empty SafeAreaView
- `useRevealStore` and `useGameweekStore` already had all required shape — no changes needed to store files

**Completion Notes:**
- All 9 tasks complete — 8 unit tests covering all AC scenarios pass (29 total tests pass)
- Pre-existing stores.test.ts and useUserQuery.test.ts remain green
- 3 pre-existing test suite failures (onboarding, sign-in, profile) are unrelated module resolution issues predating this story

**Files Changed:**
- `apps/mobile/src/queries/useGameweekQuery.ts` — activated real query + added useUserGameweekStateQuery
- `apps/mobile/src/utils/gameweekPhase.ts` — NEW: pure phase derivation utility
- `apps/mobile/src/utils/gameweekPhase.test.ts` — NEW: 8 unit tests
- `apps/mobile/app/(tabs)/_layout.tsx` — AppState listener, phase sync, reduceMotion check
- `apps/mobile/app/(tabs)/build.tsx` — phase-gated redirect
- `apps/mobile/app/(tabs)/moments.tsx` — phase-gated redirect
