# Story 5.2: Build View — Fixture Cards & Match Moment Selection

Status: done

## Story

As a **user**,
I want to browse gameweek fixtures, tap into a moment catalog, and add Match picks with a single tap,
So that I can quickly build the straightforward part of my squad without friction.

## Acceptance Criteria

1. **Given** the Build View renders in `Building` phase **When** the screen loads **Then** `GameweekHeader` shows "GW {n}" left and "{used}/20" events counter right in lime with tabular-nums **And** all fixtures are listed as `FixtureCard` components sorted by kickoff time **And** the events counter reflects picks already saved to the DB (TanStack Query cache-first).

2. **Given** a fixture card has no picks **When** the user taps it **Then** they navigate to `catalog/[fixtureId].tsx` for that fixture.

3. **Given** the Moment Catalog screen loads **When** data is fetching **Then** three skeleton rows animate at row height — no centred spinner **And** filter chips (All / Match / Moment) appear at top, defaulting to "All", resetting to "All" on each open.

4. **Given** the catalog renders **When** the user views a Match-type row **Then** `MomentCatalogRow` shows: event icon + event name + `TypeBadge` (lime MATCH) + flat integer point value (e.g. "350") **And** no → arrow is shown.

5. **Given** the user taps a Match-type catalog row **When** the pick is added **Then** they are returned to Build View immediately — no confirmation dialog **And** the pick appears on the fixture card and the events counter increments (optimistic update) **And** a ✓ indicator appears on that row in the catalog on next visit.

6. **Given** the user taps a row already marked ✓ **When** the tap registers **Then** nothing happens — the tap is a no-op (prevents double-picks).

7. **Given** historical `match_events` data exists for that event type + team from prior gameweeks **When** the user views a catalog row detail **Then** a ✓/✗ dot history is shown (UX-DR30) — only real accumulated data, no filler if insufficient history exists.

8. **Given** `DeadlineStrip` is rendered **When** more than 3 hours remain **Then** it is not rendered at all **And** under 1 hour it shows orange text with tinted background **And** under 15 minutes it shows a full orange strip with pulse animation and `accessibilityLiveRegion="polite"`.

9. **Given** the Moment Catalog shows a Moment-type row (Precision Pick) **When** the user views it **Then** a → arrow is shown signalling a multi-step flow **And** the points display shows "420+" — tapping navigates to `microflow/player.tsx` (implemented in Story 5.4, just navigate from here).

## Tasks / Subtasks

- [x] Task 1: Activate `useSquadQuery` and add `useAddPickMutation` + `useRemovePickMutation` in `apps/mobile/src/queries/useSquadQuery.ts` (AC: #1, #5)
  - [x] Replace the stub `useSquadQuery` with a real Supabase fetch: query `predictions` table filtering `user_id = userId AND gameweek_id = gameweekId`; use `.select('*')`; return `Prediction[]`
  - [x] Map `snake_case` columns → `camelCase` via Drizzle mapping (Supabase JS returns camelCase automatically for typed queries — use `as Prediction[]`)
  - [x] Set `staleTime: 0` (picks change frequently during a build session) and `enabled: userId != null && gameweekId != null`
  - [x] Export `useAddPickMutation` using `useMutation` from TanStack Query; it should INSERT a row into `predictions` via `supabase.from('predictions').insert(...)` and call `queryClient.invalidateQueries({ queryKey: ['squad', userId, gameweekId] })` on success
  - [x] Implement optimistic update in `useAddPickMutation`: `onMutate` prepends the new pick to the cache, `onError` rolls back, `onSettled` invalidates
  - [x] Export `useRemovePickMutation` similarly using `supabase.from('predictions').delete().eq('id', pickId)`, with optimistic removal + rollback on error
  - [x] Add `useSaveSquadMutation` that upserts ALL current picks for the session (bulk insert/upsert) — this is the final "Save" action that navigates to Moments View on success

- [x] Task 2: Implement `GameweekHeader` component at `apps/mobile/src/components/shared/GameweekHeader.tsx` (AC: #1)
  - [x] Props: `gameweekNumber: number`, `usedPicks: number`, `totalPicks: number` (always 20), `phase: 'building' | 'locked' | 'reveal'`
  - [x] Build phase: left shows "GW {n}" in heading-2 style (18px/600); right shows "{used}/20" in lime (`#B4FF32`) with `fontVariant: ['tabular-nums']`
  - [x] Locked phase: right shows violet "Locked" badge with lock icon (`#A78BFA`) per UX-DR5
  - [x] Reveal phase: left shows "GW {n} · Results", right empty
  - [x] Use Inter semibold (`Inter_600SemiBold`) for heading-2 per UX-DR2
  - [x] Add `accessibilityLabel` describing current state

- [x] Task 3: Implement `DeadlineStrip` component at `apps/mobile/src/components/shared/DeadlineStrip.tsx` (AC: #8)
  - [x] Props: `deadlineTimestamp: Date | null`
  - [x] Four states: `hidden` (>3 hours or null — render nothing), `approaching` (1–3 hours, `text-secondary` #7A7A7A), `urgent` (<1 hour, `#FF6B35` text + tinted bg), `critical` (<15 min, full orange strip + pulse animation + `accessibilityLiveRegion="polite"`)
  - [x] Use 60-second interval `setInterval` to re-derive state (clear on unmount)
  - [x] Pulse animation for critical state: use `react-native-reanimated` `useSharedValue` + `withRepeat(withSequence(...))` for subtle opacity pulse (0.7 → 1.0 → 0.7, 1 second cycle)
  - [x] `accessibilityLiveRegion="polite"` on the View wrapping critical state
  - [x] All time comparisons use the passed `deadlineTimestamp` prop — never `new Date()` inside component body (pass `now` as a prop or compare against `Date.now()` in the interval callback)

- [x] Task 4: Implement `TypeBadge` component at `apps/mobile/src/components/shared/TypeBadge.tsx` (AC: #4, #5)
  - [x] Props: `variant: 'match' | 'moment'`
  - [x] Match variant: `rgba(180,255,50,0.12)` bg, `#B4FF32` text, "MATCH" label, label style (13px/500)
  - [x] Moment variant: `rgba(167,139,250,0.15)` bg, `#A78BFA` text, "MOMENT" label, label style (13px/500)
  - [x] Use `borderRadius: 4` (radius-sm) and `paddingHorizontal: 8, paddingVertical: 2`

- [x] Task 5: Implement `FixtureCard` component at `apps/mobile/src/components/build/FixtureCard.tsx` (AC: #1, #2)
  - [x] Props: `fixture: Fixture`, `picks: Prediction[]`, `isExpanded: boolean`, `onToggle: () => void`, `onNavigateToCatalog: (fixtureId: number) => void`, `onPickTap: (pick: Prediction) => void`
  - [x] Empty state (no picks): show fixture header (homeTeam vs awayTeam + kickoff time), chevron ▸, tap anywhere → call `onNavigateToCatalog(fixture.id)` per UX-DR7
  - [x] Collapsed state (has picks, not expanded): show badge "N picks" + chevron ▸, tap header → call `onToggle()`
  - [x] Expanded state: show `PickRow` for each pick + "＋ Tap to add a pick" placeholder at bottom + chevron ▾, tap header → call `onToggle()`; tap placeholder → call `onNavigateToCatalog(fixture.id)`; only one card expanded at a time (managed by parent via `expandedFixtureId` in `useBuildStore`)
  - [x] `accessibilityRole="button"` on the tappable header
  - [x] Announce expanded state: `accessibilityState={{ expanded: isExpanded }}`
  - [x] Kickoff time displayed using `Intl.DateTimeFormat` — never raw ISO string
  - [x] Border/background: `bg-surface` (#141414) card, `border-subtle` (#1E1E1E) 1px border, `radius-lg` (8px)

- [x] Task 6: Implement `PickRow` component at `apps/mobile/src/components/build/PickRow.tsx` (AC: #5)
  - [x] Props: `pick: Prediction`, `momentCard: MomentCard`, `momentType: MomentType`, `isCaptain: boolean`, `onTap: (pick: Prediction) => void`
  - [x] Shows: event icon (use `@expo/vector-icons` Ionicons mapped by eventType) + event name + `TypeBadge` (match/moment based on `pick.predictionType`) + points value
  - [x] Captain 👑 icon shown on right if `isCaptain === true`
  - [x] Tap → calls `onTap(pick)` (opens `CaptainPopup` — implemented in Story 5.3)
  - [x] `accessibilityRole="button"` + `accessibilityLabel` describing the pick
  - [x] Minimum touch area 44×44px

- [x] Task 7: Implement `MomentCatalogRow` component at `apps/mobile/src/components/build/MomentCatalogRow.tsx` (AC: #4, #5, #6, #7, #9)
  - [x] Props: `momentCard: MomentCard`, `momentType: MomentType`, `isAdded: boolean`, `historicalDots?: Array<{ correct: boolean }>`, `onTap: () => void`
  - [x] Match-type row (`momentType.predictionType === 'match'`): no arrow, flat integer points "350", lime MATCH TypeBadge, tap → `onTap()` for immediate add
  - [x] Moment-type row (`momentType.predictionType === 'moment'`): → arrow, "420+" points, violet MOMENT TypeBadge, tap → `onTap()` for navigation to microflow
  - [x] Added state: show ✓ indicator (lime checkmark), tap is a no-op (`accessibilityState={{ disabled: true }}` when added)
  - [x] Historical dots: render up to 10 ✓/✗ dots in a horizontal row if `historicalDots` array is non-empty (only real data — component must not render dots if array is undefined or empty)
  - [x] `accessibilityRole="button"`

- [x] Task 8: Activate `useCatalogQuery` in `apps/mobile/src/queries/useCatalogQuery.ts` (AC: #3, #4)
  - [x] Replace the stub with a real Supabase fetch joining `game_week_moments` + `moment_types` for the given `fixtureId`
  - [x] Query: `supabase.from('game_week_moments').select('*, moment_types(*)').eq('fixture_id', fixtureId)`
  - [x] Return type: `Array<{ momentCard: GameweekMoment, momentType: MomentType }>` — or flatten to a single enriched type `CatalogItem = GameweekMoment & { momentType: MomentType }`
  - [x] Enable the query (remove `enabled: false`), `staleTime: Infinity` (catalog is lock-time immutable per architecture caching strategy — no re-fetch mid-session)
  - [x] Add a new `useHistoricalDotsQuery(fixtureId: number, eventType: string, teamId: string | null)` in the same file that queries `match_events` for prior gameweeks: `supabase.from('match_events').select('id').eq('event_type', eventType).eq('team_id', teamId).limit(10).order('created_at', { ascending: false })` — shapes result to `Array<{ correct: boolean }>` (all results are `correct: true` since presence in `match_events` = event occurred)

- [x] Task 9: Implement `SkeletonRow` component at `apps/mobile/src/components/shared/SkeletonRow.tsx` (AC: #3)
  - [x] Props: `height?: number` (default 56)
  - [x] Render an animated grey bar at the given height using `react-native-reanimated` `useSharedValue` + `withRepeat(withTiming(...))` for a shimmer-like opacity pulse between `#1C1C1C` and `#2A2A2A`
  - [x] `borderRadius: 6` (radius-md), `marginHorizontal: 16`, `marginVertical: 4`
  - [x] Export `SkeletonList` convenience component: renders `count` SkeletonRows (default 3)

- [x] Task 10: Build the full `catalog/[fixtureId].tsx` screen (AC: #3, #4, #5, #6, #7, #9)
  - [x] Replace the existing placeholder with a real screen
  - [x] Read `fixtureId` from `useLocalSearchParams<{ fixtureId: string }>()`; parse to `parseInt(fixtureId, 10)`
  - [x] Fetch squad for current user/gameweek via `useSquadQuery` (need `userId` from `useAuthState` and `gameweekId` from `useGameweekStore`)
  - [x] Fetch catalog via `useCatalogQuery(fixtureId)`
  - [x] Show `SkeletonList` (3 rows) while `isLoading`; show "Having trouble loading — tap to retry" text button if `isFetching && !isLoading && data == null` after 3 seconds (use `setTimeout` effect)
  - [x] Filter chips: `All | Match | Moment` — single-select, lime active / dark inactive, default "All", reset on each screen open (use `useState` — this is UI-only state, not server state)
  - [x] Filtered rows: if "All" show all; if "Match" show `predictionType === 'match'`; if "Moment" show `predictionType === 'moment'` — instant show/hide per UX-DR25
  - [x] For each catalog item: render `MomentCatalogRow`, set `isAdded = squad?.some(p => p.gameWeekMomentId === item.id) ?? false`
  - [x] Match-type tap: call `useAddPickMutation` with the new prediction payload; after success navigate back to Build View via `router.back()`
  - [x] Moment-type tap: navigate to `/(microflow)/player?fixtureId={fixtureId}&momentCardId={item.id}` (Story 5.4 will implement the full flow)
  - [x] Pass fixture info into header title: show "Fixture — Home vs Away" in the screen header
  - [x] Horizontal screen padding: 16px on all content

- [x] Task 11: Build the full `(tabs)/build.tsx` screen (AC: #1, #2)
  - [x] Enhance the existing placeholder (keep phase-gated redirect logic)
  - [x] Fetch current gameweek from `useGameweekStore`: `currentGameweekId`
  - [x] Fetch `useGameweekQuery()` for gameweek number and `first_kickoff` (deadline timestamp)
  - [x] Fetch fixtures: Add `useFixturesQuery(gameweekId: number)` to `apps/mobile/src/queries/useFixturesQuery.ts` — query `supabase.from('fixtures').select('*').eq('gameweek_id', gameweekId).order('kickoff_at', { ascending: true })`; use query key `['fixtures', gameweekId]`; `enabled: gameweekId != null`
  - [x] Fetch squad: `useSquadQuery(userId, gameweekId)` — need `userId` from `useAuthState`
  - [x] Render `GameweekHeader` at top with `gameweekNumber`, `usedPicks = squad?.length ?? 0`, `totalPicks = 20`, `phase = 'building'`
  - [x] Render `DeadlineStrip` with `deadlineTimestamp = gameweek?.firstKickoff ?? null`
  - [x] Render `FlatList` of `FixtureCard` components sorted by kickoff time
  - [x] `expandedFixtureId` managed in `useBuildStore` — only one card expanded at a time; `onToggle` calls `setExpandedFixtureId(id === expandedFixtureId ? null : id)`
  - [x] Navigate to catalog: `router.push(\`/catalog/${fixtureId}\`)`
  - [x] Horizontal screen padding: 16px

- [x] Task 12: Write unit tests (AC: all)
  - [x] `apps/mobile/src/components/shared/GameweekHeader.test.tsx`: test build phase shows "{used}/20" in lime; locked phase shows "Locked" badge; reveal phase shows "· Results"
  - [x] `apps/mobile/src/components/shared/DeadlineStrip.test.tsx`: test hidden state (>3 hours), approaching (2 hours), urgent (<1 hour), critical (<15 min); ensure `accessibilityLiveRegion` is "polite" in critical state
  - [x] `apps/mobile/src/components/shared/TypeBadge.test.tsx`: match variant renders "MATCH" with lime color; moment variant renders "MOMENT" with violet color
  - [x] `apps/mobile/src/components/build/MomentCatalogRow.test.tsx`: match-type shows no arrow; moment-type shows "→"; added state renders ✓ and tap is no-op; unadded match-type tap fires `onTap`
  - [x] `apps/mobile/src/queries/useSquadQuery.test.ts`: squad query key is `['squad', userId, gameweekId]`; disabled when userId is null
  - [x] All pre-existing tests must remain green

- [x] Task 13: Update sprint status
  - [x] Mark all tasks complete in this story file
  - [x] Update `sprint-status.yaml`: `5-2-build-view-fixture-cards-and-match-moment-selection: review`

### Review Findings

- [x] [Review][Decision] `useHistoricalDotsQuery` maps all results to `correct: true` — Deferred: ✗ dots require a `voided`/`result` field on `match_events`; wire in when miss tracking is added to schema.
- [x] [Review][Decision] AC #6 — no server-side duplicate-pick guard — Fixed: changed `insert` to `upsert` with `onConflict: 'user_id,gameweek_id,game_week_moment_id'` in `useAddPickMutation`.
- [x] [Review][Patch] `parseCatalogItem` — no null guard on joined `moment_types` [useCatalogQuery.ts]
- [x] [Review][Patch] `useHistoricalDotsQuery` — Supabase chaining bug: `teamId` filter is silently dropped [useCatalogQuery.ts]
- [x] [Review][Patch] Retry button in catalog screen doesn't call `refetch()` [catalog/[fixtureId].tsx]
- [x] [Review][Patch] `GameweekHeader` reveal phase — test corrected to assert `·` separator [GameweekHeader.test.tsx]
- [x] [Review][Patch] `useAddPickMutation` optimistic update assigns `id: -1` — fixed to use unique `-(Date.now() + Math.random())` [useSquadQuery.ts]
- [x] [Review][Patch] `fixtureId` parse — NaN guard added via `Number.isNaN` [catalog/[fixtureId].tsx]
- [x] [Review][Patch] `useHistoricalDotsQuery` fires even when `teamId` is null — query now disabled when teamId is null [useCatalogQuery.ts]
- [x] [Review][Patch] `MomentCatalogRow.test.tsx` missing from changeset — file confirmed present and passing
- [x] [Review][Patch] `accessibilityLiveRegion` suppressed with `@ts-ignore` — replaced with spread cast [DeadlineStrip.tsx]
- [x] [Review][Patch] Fixture title in catalog header — both ternary branches were identical, now distinct [catalog/[fixtureId].tsx]
- [x] [Review][Defer] `SkeletonRow` — Reanimated animation not explicitly cancelled on unmount [SkeletonRow.tsx] — deferred, pre-existing pattern in codebase
- [x] [Review][Defer] `build.tsx` `totalPicks={20}` hardcoded — low risk, no config source exists yet [build.tsx] — deferred, deliberate constant pending future config
- [x] [Review][Defer] Concurrent `useAddPickMutation` calls share same `previousSquad` snapshot — incorrect rollback possible under rapid-fire taps [useSquadQuery.ts] — deferred, acceptable for v1 UX

## Dev Notes

### What This Story Delivers

```
apps/mobile/app/(tabs)/build.tsx                          ← MODIFIED: real Build View implementation
apps/mobile/app/catalog/[fixtureId].tsx                   ← MODIFIED: real Moment Catalog screen
apps/mobile/src/queries/useSquadQuery.ts                  ← MODIFIED: activated real fetch + mutations
apps/mobile/src/queries/useCatalogQuery.ts                ← MODIFIED: activated real fetch + historical dots
apps/mobile/src/queries/useFixturesQuery.ts               ← NEW: fixtures query
apps/mobile/src/components/shared/GameweekHeader.tsx      ← NEW
apps/mobile/src/components/shared/DeadlineStrip.tsx       ← NEW
apps/mobile/src/components/shared/TypeBadge.tsx           ← NEW
apps/mobile/src/components/shared/SkeletonRow.tsx         ← NEW
apps/mobile/src/components/build/FixtureCard.tsx          ← NEW
apps/mobile/src/components/build/PickRow.tsx              ← NEW
apps/mobile/src/components/build/MomentCatalogRow.tsx     ← NEW
apps/mobile/src/components/shared/GameweekHeader.test.tsx ← NEW
apps/mobile/src/components/shared/DeadlineStrip.test.tsx  ← NEW
apps/mobile/src/components/shared/TypeBadge.test.tsx      ← NEW
apps/mobile/src/components/build/MomentCatalogRow.test.tsx← NEW
apps/mobile/src/queries/useSquadQuery.test.ts             ← NEW
```

No new migrations, no Supabase Edge Functions needed for this story.

### Exact Database Schema Being Consumed

**`fixtures` table** (Drizzle type `Fixture`):
```typescript
export type Fixture = {
  id: number;
  gameweekId: number;
  externalId: string;
  homeTeam: string;
  awayTeam: string;
  kickoffAt: Date;         // ← use this for deadline + sort order
  isPostponed: boolean;
  isVoid: boolean;
  eventsIngested: boolean;
  createdAt: Date;
}
```

**`game_week_moments` table** (Drizzle type `GameweekMoment` / `MomentCard`):
```typescript
export type GameweekMoment = {
  id: number;
  gameweekId: number;
  fixtureId: number;
  momentTypeId: number;
  basePoints: number;
  playerBonusPoints: number | null;
  assisterBonusPoints: number | null;
  zoneBonusPoints: number | null;
  timingBonusPoints: number | null;
  jackpotBonusPoints: number | null;
  teamId: string | null;
  createdAt: Date;
}
```

**`moment_types` table** (Drizzle type `MomentType`):
```typescript
export type MomentType = {
  id: number;
  name: string;              // e.g. "First Goalscorer", "Yellow Card", "Corner Kick"
  eventType: string;         // 'goal' | 'yellow_card' | 'corner' | 'substitution' | 'red_card' | 'match_result'
  predictionType: string;    // 'match' | 'moment' — this determines the card variant
  description: string | null;
  createdAt: Date;
}
```

**`predictions` table** (Drizzle type `Prediction`):
```typescript
export type Prediction = {
  id: number;
  userId: string;            // UUID
  gameweekId: number;
  fixtureId: number;
  gameWeekMomentId: number;  // FK to game_week_moments.id
  predictionType: string;    // 'match' | 'moment'
  isCaptain: boolean;
  predictedMinute: number | null;
  confidenceWindow: number | null;
  predictedPlayerId: string | null;
  predictedAssisterId: string | null;
  predictedZone: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

**Note on Supabase JS and column casing:** Supabase JS v2 returns columns in `snake_case` by default — you must map them to camelCase or use a type assertion. The existing `parseGameweekDates` pattern in `useGameweekQuery.ts` shows the approach. For simple queries where dates don't need parsing, a direct `as Prediction[]` cast is acceptable since Drizzle's TypeScript types use camelCase but the runtime values will have snake_case keys. **Risk:** This mismatch can cause runtime `undefined` bugs. Prefer explicit mapping or use `.select(...)` with aliased column names, or accept the snake_case runtime keys and adjust the types accordingly.

**Recommended approach:** Since the existing codebase pattern (5-1) uses explicit mapping for Gameweek, use the same approach here — write a `parsePrediction(raw: Record<string, unknown>): Prediction` helper in `useSquadQuery.ts` that maps snake_case to camelCase.

### Architecture: TanStack Query Key for Squad

From architecture "TanStack Query Key Conventions" (must use exactly):
```typescript
['squad', userId, gameweekId]
['catalog', fixtureId]
['fixtures', gameweekId]   // new key for fixtures list — follows the pattern
```

### Architecture: Optimistic Update Pattern (from AR8 + architecture patterns section)

From architecture doc:
> "Optimistic Update Rule: All squad mutations (add pick, remove pick, set captain) use TanStack Query's `onMutate` + `onError` rollback pattern. Never manually update Zustand state to reflect server changes."

```typescript
// Pattern to follow in useAddPickMutation
const mutation = useMutation({
  mutationFn: async (newPick: NewPrediction) => {
    const { data, error } = await supabase.from('predictions').insert(newPick).select().single();
    if (error) throw error;
    return data;
  },
  onMutate: async (newPick) => {
    await queryClient.cancelQueries({ queryKey: ['squad', userId, gameweekId] });
    const previousSquad = queryClient.getQueryData<Prediction[]>(['squad', userId, gameweekId]);
    queryClient.setQueryData(['squad', userId, gameweekId], (old: Prediction[] | null) => [
      ...(old ?? []),
      { ...newPick, id: -1, createdAt: new Date(), updatedAt: new Date() } as Prediction
    ]);
    return { previousSquad };
  },
  onError: (_err, _newPick, context) => {
    if (context?.previousSquad !== undefined) {
      queryClient.setQueryData(['squad', userId, gameweekId], context.previousSquad);
    }
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['squad', userId, gameweekId] });
  },
});
```

### Architecture: Error Handling for Mutations

From architecture error handling tiers:
- **Transient** (network error on save): Non-blocking bottom toast "Couldn't save — tap to retry" (auto-dismiss 4s). No blocking modal. TanStack Query `onError` rollback restores optimistic state.
- No `console.log` anywhere — `console.error` only for actual errors.

Bottom toast implementation: use `Alert.alert` is NOT correct — use a simple `useState`-driven fixed-position View at bottom of screen. Or check if there is a toast utility already in the project.

### Architecture: Loading State Rules

From architecture patterns:
> "Always use TanStack Query's built-in `isLoading` / `isFetching` / `isPending`. Never create a parallel `isLoading` boolean in Zustand or local component state for the same data."
> "Loading states show skeleton rows at the height of actual content — never a centred spinner inside a list."

### Component Organisation Rules

From architecture patterns:
- `src/components/build/FixtureCard.tsx` — feature-scoped components in `build/`
- `src/components/shared/TypeBadge.tsx` — shared atoms in `shared/`
- `src/components/build/MomentCatalogRow.tsx` — catalog rows are build-feature components

The `src/components/` directory doesn't exist yet — this story creates it. Follow the directory structure exactly as specified in architecture.

### UX Design Requirements Critical Details

**FixtureCard (UX-DR7):**
- Only one card expanded at a time → parent (Build View) controls `expandedFixtureId` via `useBuildStore`
- Empty card (no picks) → single tap opens Catalog (no accordion)
- Collapsed/expanded (has picks) → tap header toggles accordion

**MomentCatalogRow (UX-DR8):**
- Match shows **flat** integer (e.g. "350") — no "+" suffix
- Moment shows "420+" — "+" signals variable ceiling
- Added row: tap is a no-op (`accessibilityState={{ disabled: true }}`)

**DeadlineStrip time thresholds (UX-DR6):**
```
now < (deadline - 3h)          → hidden (render null)
(deadline - 3h) ≤ now < (deadline - 1h)   → approaching (muted text only)
(deadline - 1h) ≤ now < (deadline - 15min) → urgent (orange text + tinted bg)
now ≥ (deadline - 15min)       → critical (full orange strip + pulse)
```

**GameweekHeader events counter (UX-DR5):**
- Shows `{used}/{total}` — the `used` count = `squad.length` (number of predictions currently saved)
- Font: Inter SemiBold 18px, tabular numerals
- Lime colour: `#B4FF32`

**TypeBadge (UX-DR4):**
- Match: `rgba(180,255,50,0.12)` background, `#B4FF32` text
- Moment: `rgba(167,139,250,0.15)` background, `#A78BFA` text

**Historical dots (UX-DR30):**
- Only show if `historicalDots.length > 0` — no filler/placeholder
- ✓ = lime dot `#B4FF32`, ✗ = muted dot `#404040` (text-muted)
- Data source: `match_events` filtered by `event_type + team_id` from prior gameweeks
- This feature is "progressive" — meaningful from ~GW5-6 onward; sparse early in season is expected

### Inter Font Usage

From UX-DR2 and the typography system (`src/lib/typography.ts`):
- heading-2: 18px / 600 weight → `fontFamily: 'Inter_600SemiBold'`
- label: 13px / 500 weight → `fontFamily: 'Inter_500Medium'`
- body: 15px / 400 weight → `fontFamily: 'Inter_400Regular'`
- mono-number: 20px / 700 weight → `fontFamily: 'Inter_700Bold'` + `fontVariant: ['tabular-nums']`

Check `src/lib/typography.ts` for the actual exported constants and use those rather than inline values.

### Colours (use exact hex values)

```
bg-primary:      #080808
bg-surface:      #141414
bg-elevated:     #1C1C1C
text-primary:    #FFFFFF
text-secondary:  #7A7A7A
text-muted:      #404040
border-subtle:   #1E1E1E
border-active:   #B4FF32
accent/lime:     #B4FF32
streak/violet:   #A78BFA
deadline/orange: #FF6B35
```

### Spacing (8px system)

```
space-1: 4px   (padding-xs)
space-2: 8px   (inner padding)
space-3: 12px  (item gap)
space-4: 16px  (screen horizontal padding)
space-5: 24px  (section gap)
```

### Previous Story Intelligence (from 5-1)

- `useAuthState` hook is at `src/hooks/useAuthState.ts` — use `const { session } = useAuthState()` to get `userId = session?.user?.id ?? null`
- `useGameweekStore` gives `phase` and `currentGameweekId` — use `currentGameweekId` as `gameweekId` for squad queries
- `deriveGameweekPhase` is at `src/utils/gameweekPhase.ts` — no need to call it again here, the store already has the derived phase
- Import path alias `@/` maps to `apps/mobile/` root
- Tests co-located with source files as `*.test.ts` / `*.test.tsx` — no `__tests__` directory
- `queryClient` is exported from `src/lib/queryClient.ts`
- Supabase returns ISO strings for dates, **not** Date objects — always parse them before use

### Existing Stub Files to Activate (not re-create)

- `src/queries/useSquadQuery.ts` — exists, has stub; **replace** the `queryFn` and `enabled` field
- `src/queries/useCatalogQuery.ts` — exists, has stub; **replace** the `queryFn` and `enabled` field
- `app/catalog/[fixtureId].tsx` — exists as placeholder; **replace** with full implementation
- `app/(tabs)/build.tsx` — exists with phase-gated redirect; **add** the full Build View content (keep the redirect logic)

### New File to Create

- `src/queries/useFixturesQuery.ts` — does NOT exist yet, create fresh

### Key Anti-Patterns to Avoid

1. **Do NOT** use `useState` for squad or catalog data — use TanStack Query
2. **Do NOT** put `Prediction[]` in Zustand — server data stays in TanStack Query cache only
3. **Do NOT** render a spinner inside a list — use `SkeletonList` 
4. **Do NOT** hardcode colour values inline — use the constants from the tailwind config or inline `#B4FF32` etc. from the design spec
5. **Do NOT** reinitialise Supabase client — import only from `@/src/lib/supabase`
6. **Do NOT** add `console.log` — use `console.error` only for errors
7. **Do NOT** assume snake_case from Supabase is camelCase — always map explicitly
8. **Do NOT** use `new Date()` inside component render — derive time deltas in effects/intervals

### Micro-flow Navigation (Story 5.4 Boundary)

Story 5.2 is responsible for:
- ✅ Rendering Moment-type rows with "420+" and → arrow
- ✅ Tapping a Moment-type row navigates to `/(microflow)/player?fixtureId={fixtureId}&momentCardId={item.id}`
- ❌ NOT: implementing `microflow/player.tsx` or `microflow/timing.tsx` — that is Story 5.4

The microflow screens already exist as stubs (`app/microflow/player.tsx`, `app/microflow/timing.tsx`). Navigation must work even if they just render a placeholder.

### Save Action (Story 5.3 Boundary)

Story 5.2 is responsible for:
- ✅ Adding individual picks via `useAddPickMutation` (one-tap Match Moment add)
- ✅ Displaying existing picks inside expanded `FixtureCard` via `PickRow`
- ❌ NOT: the full Save Squad button, CaptainPopup, Remove pick — that is Story 5.3

The Build View in this story should scroll down to show the fixture list but does NOT need a Save button (added in 5.3).

### Review Findings from Story 5-1 (Apply Here)

- Supabase returns ISO strings not Date objects — always parse with `new Date(raw.some_column_at)` in mapper functions
- Wrap secondary DB writes in try/catch (applies to `useAddPickMutation` — if insert fails after navigation, don't crash)
- Guard against null/undefined before accessing nested object properties (e.g., `squad?.length ?? 0`)
- Unsafe type casts to avoid — prefer runtime null guards + explicit mapping
- Unhandled promise rejections are a code smell — add `.catch()` to any promise not awaited in an `async` context

## Story Progress Notes

_Dev agent: Update this section as you implement tasks._

### Dev Agent Record

**Implementation Date:** 2026-05-21

**Implementation Plan:**
Implemented all 13 tasks following the red-green-refactor TDD cycle. Created real Supabase-backed queries for squad, catalog, fixtures and historical dots. Built 7 new components (GameweekHeader, DeadlineStrip, TypeBadge, SkeletonRow, FixtureCard, PickRow, MomentCatalogRow). Activated the Build View and Moment Catalog screens. Wrote 5 new test files covering all specified acceptance criteria.

**Completion Notes:**
- All 13 tasks completed with all subtasks marked
- 20 new tests added across 5 test files; all 118 total tests pass (zero regressions)
- Added `moduleNameMapper` for `nativewind/jsx-runtime` in jest config to fix test environment resolution issue
- snake_case → camelCase mapping implemented with explicit parser functions in all query files
- Optimistic updates implemented in useAddPickMutation and useRemovePickMutation with onMutate/onError rollback pattern
- DeadlineStrip uses 60-second setInterval; animation in critical state uses react-native-reanimated withRepeat/withSequence
- FixtureCard accordion: parent controls expandedFixtureId via useBuildStore (one expanded at a time)
- Moment-type catalog rows navigate to microflow stub (Story 5.4 boundary respected)
- CaptainPopup tap handler deferred to Story 5.3 (onPickTap is a no-op placeholder)

**Files Changed:** see File List below

## File List

### Modified
- `apps/mobile/app/(tabs)/build.tsx` — full Build View with GameweekHeader, DeadlineStrip, FlatList of FixtureCards
- `apps/mobile/app/catalog/[fixtureId].tsx` — full Moment Catalog screen with filter chips, SkeletonList, MomentCatalogRow
- `apps/mobile/src/queries/useSquadQuery.ts` — real Supabase fetch + useAddPickMutation + useRemovePickMutation + useSaveSquadMutation with optimistic updates
- `apps/mobile/src/queries/useCatalogQuery.ts` — real Supabase fetch joining game_week_moments + moment_types + useHistoricalDotsQuery
- `apps/mobile/package.json` — added moduleNameMapper for nativewind/jsx-runtime in jest config

### New
- `apps/mobile/src/queries/useFixturesQuery.ts` — fixtures query with snake→camelCase mapping
- `apps/mobile/src/components/shared/GameweekHeader.tsx`
- `apps/mobile/src/components/shared/DeadlineStrip.tsx`
- `apps/mobile/src/components/shared/TypeBadge.tsx`
- `apps/mobile/src/components/shared/SkeletonRow.tsx` (exports SkeletonRow + SkeletonList)
- `apps/mobile/src/components/build/FixtureCard.tsx`
- `apps/mobile/src/components/build/PickRow.tsx`
- `apps/mobile/src/components/build/MomentCatalogRow.tsx`
- `apps/mobile/src/components/shared/GameweekHeader.test.tsx`
- `apps/mobile/src/components/shared/DeadlineStrip.test.tsx`
- `apps/mobile/src/components/shared/TypeBadge.test.tsx`
- `apps/mobile/src/components/build/MomentCatalogRow.test.tsx`
- `apps/mobile/src/queries/useSquadQuery.test.ts`
- `apps/mobile/src/__mocks__/nativewindJsxRuntime.js`

## Change Log

- 2026-05-21: Story implemented by dev agent. All 13 tasks complete. 7 new components created, 4 queries/screens activated, 5 test files added (20 new tests). Full test suite: 118 tests passing, 0 regressions. Story status set to review.

