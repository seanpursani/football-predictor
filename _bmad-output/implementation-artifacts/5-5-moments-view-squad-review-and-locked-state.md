# Story 5.5: Moments View — Squad Review & Locked State

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want to review my full saved squad in fixture order or chronological event-time order, and see my Boldness tier while matches are live,
So that I can verify my strategy, visualise my streak sequence, and understand how bold my predictions are while I wait for results.

## Acceptance Criteria

1. **Given** the user saves their squad and is routed to Moments View **When** the screen loads in `Building` phase **Then** the Match tab shows all picks grouped by fixture, sorted by kickoff time **And** the Moment tab shows all Precision Picks in chronological predicted event-time order across all fixtures — the streak sequence preview **And** each pick renders as a `MomentsPickRow` in pending state (dimmed, neutral) **And** an Edit button at the bottom returns the user to Build View — no back gesture between views.

2. **Given** the gameweek phase transitions to `Locked` **When** the user opens the app **Then** `BoldnessHeroCard` appears at the top of Moments View showing: `BoldnessShield` tier icon + tier name + possible points total (calculated at save time) + "Results incoming · ends {day} {time}" **And** `BoldnessShield` displays the correct tier: Bronze (0–999), Silver (1000–2499), Gold (2500–4999), Platinum (5000+) with matching tier colours **And** `GameweekHeader` shows the violet "Locked" badge replacing the events counter **And** the Edit button is not shown — the squad is read-only.

3. **Given** the Moments View has no picks for the current gameweek **When** the screen renders **Then** an empty state shows "Nothing saved for this gameweek" with a primary "Build your squad" button.

4. **Given** the app starts **When** `AccessibilityInfo.isReduceMotionEnabled()` is checked on mount **Then** the result is stored via `useRevealStore.setReduceMotion()` and available for the reveal infrastructure (consumed by Epic 6).

## Tasks / Subtasks

- [x] Task 1: Create `MomentsPickRow` component at `apps/mobile/src/components/moments/MomentsPickRow.tsx` (AC: #1)
  - [x] Props: `pick: Prediction`, `fixtureLabel: string`, `eventName: string`, `predictionType: 'match' | 'moment'`, `isCaptain: boolean`
  - [x] Layout: full-width row, `paddingVertical: 12`, `paddingHorizontal: 16`, `minHeight: 44`, `backgroundColor: '#141414'`
  - [x] Left: event icon (use `EVENT_ICON_MAP` from PickRow — same map) + event name (`Typography.body`, `color: '#7A7A7A'` — dimmed pending state) + `TypeBadge`
  - [x] Right: points display (base points + captain crown emoji) — `Typography.body`, `color: '#7A7A7A'`
  - [x] Captain indicator: `👑` emoji when `isCaptain`
  - [x] Border separator: `borderBottomWidth: 1`, `borderBottomColor: '#1E1E1E'`
  - [x] `accessibilityRole="text"`, `accessibilityLabel="{eventName} pick, {predictionType}{isCaptain ? ', captain' : ''}, pending"`
  - [x] For Moment tab usage: also accepts `predictedMinute?: number | null` to show "min {n}" suffix on event name label

- [x] Task 2: Create `BoldnessShield` component at `apps/mobile/src/components/moments/BoldnessShield.tsx` (AC: #2)
  - [x] Props: `tier: 'bronze' | 'silver' | 'gold' | 'platinum'`, `size?: number` (default 48)
  - [x] Pure display component — renders a shield shape with the tier initial (B/S/G/P) centred
  - [x] Tier colours:
    - Bronze: `#CD7F32` (text + border)
    - Silver: `#C0C0C0`
    - Gold: `#FFD700`
    - Platinum: `#E5E4E2`
  - [x] Implementation: `View` with `width: size, height: size * 1.2` (shield aspect), `borderRadius: size * 0.1`, `borderWidth: 2`, `borderColor: tierColour`, `backgroundColor: rgba(tierColour, 0.12)` (use inline opacity hack for RN)
  - [x] Tier letter centred in `Typography.heading2` style
  - [x] `accessibilityRole="image"`, `accessibilityLabel="{tier} tier shield"`

- [x] Task 3: Create `BoldnessHeroCard` component at `apps/mobile/src/components/moments/BoldnessHeroCard.tsx` (AC: #2)
  - [x] Props: `tier: 'bronze' | 'silver' | 'gold' | 'platinum'`, `tierName: string`, `possiblePoints: number`, `resultsEndTimestamp: Date`
  - [x] Layout: full-width card, `backgroundColor: '#141414'`, `borderRadius: 8`, `padding: 16`, `marginHorizontal: 16`, `marginVertical: 12`
  - [x] Row 1: `BoldnessShield` (size=48) + right column with tier name (`Typography.heading2`, `color: '#FFFFFF'`) + possible points (`Typography.monoNumber`, `color: tierColour`)
  - [x] Row 2: subtitle text "Results incoming · ends {formatted day} {formatted time}" in `Typography.caption`, `color: '#7A7A7A'`
  - [x] Format `resultsEndTimestamp` using `Intl.DateTimeFormat('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit' })`
  - [x] `accessibilityRole="text"`, `accessibilityLabel="{tierName} tier, {possiblePoints} possible points, results ending {formattedTimestamp}"`

- [x] Task 4: Implement `deriveBoldnessTier` utility at `apps/mobile/src/utils/boldness.ts` (AC: #2)
  - [x] `export function deriveBoldnessTier(totalPoints: number): 'bronze' | 'silver' | 'gold' | 'platinum'`
  - [x] Thresholds: 0–999 → `'bronze'`; 1000–2499 → `'silver'`; 2500–4999 → `'gold'`; 5000+ → `'platinum'`
  - [x] `export const TIER_NAMES: Record<'bronze' | 'silver' | 'gold' | 'platinum', string>`
  - [x] `export const TIER_COLOURS: Record<'bronze' | 'silver' | 'gold' | 'platinum', string>`
  - [x] Pure functions — no imports of React or hooks
  
- [x] Task 5: Implement the full `moments.tsx` screen at `apps/mobile/app/(tabs)/moments.tsx` (AC: #1, #2, #3, #4)
  - [x] Remove the existing stub (redirect to build + placeholder text)
  - [x] Auth: `const { session } = useAuthState()`
  - [x] Gameweek: `useGameweekStore` for `currentGameweekId` and `phase`
  - [x] Gameweek data: `useGameweekQuery()` for gameweek number and `lastMatchEnd`
  - [x] Squad: `useSquadQuery(userId, gameweekId)`
  - [x] Fixtures: `useFixturesQuery(gameweekId)`
  - [x] Catalog: per-fixture child component (`FixtureGroupSection` / `MomentTabFixtureGroup`) — avoids N+1 hook violation
  - [x] Tab state: `useState<'match' | 'moment'>('match')`
  - [x] Phase null guard
  - [x] Reduce motion check on mount (AC#4)
  - [x] Empty state (AC#3)
  - [x] Match tab: grouped by fixture, sorted by kickoff, with `FixtureGroupSection`
  - [x] Moment tab: filter + sort by kickoff then predictedMinute, using `MomentTabFixtureGroup`
  - [x] `GameweekHeader` always rendered
  - [x] `BoldnessHeroCard` in locked phase with possible points accumulated from catalog callbacks
  - [x] Edit button in building phase only
  - [x] Locked state hides edit button
  - [x] Skeleton during loading

- [x] Task 6: Write unit tests (AC: all)
  - [x] `apps/mobile/src/utils/boldness.test.ts` — 8 threshold tests
  - [x] `apps/mobile/src/components/moments/MomentsPickRow.test.tsx` — 5 tests
  - [x] `apps/mobile/src/components/moments/BoldnessShield.test.tsx` — 5 tests (4 letter + 1 accessibilityRole)
  - [x] All pre-existing tests remain green (161 total, up from 143 baseline)

- [x] Task 7: Update sprint status
  - [x] Mark all tasks complete in this story file
  - [x] Update `sprint-status.yaml`: `5-5-moments-view-squad-review-and-locked-state: review`

## Dev Notes

### Key Architecture Decisions

**Navigation between Build and Moments View:**
Use `router.replace('/(tabs)/build')` NOT `router.push` — the UX spec mandates "no back gesture between Build View and Moments View". Save/Edit are the ONLY switching mechanism. `router.replace` is the correct primitive for this.

From Story 5.3's `build.tsx`, after `useSaveSquadMutation` succeeds: `router.replace('/(tabs)/moments')` is already implemented as the Save flow. This is the entry point to this story.

**Phase-based redirect logic in existing `moments.tsx` stub:**
The current stub redirects to build when `phase === 'building'`. **REMOVE this redirect** — in `Building` phase, the user should fully see Moments View (they've just saved their squad and been routed here by Story 5.3). Only block if `phase === null` (loading state).

**Getting event names for picks in Moments View:**
Picks contain `gameWeekMomentId` but NOT event names directly. To display event names, you need to join with catalog data. The approach:

```typescript
// Collect all unique fixtureIds from picks
const fixtureIds = [...new Set(picks.map(p => p.fixtureId))];

// For each fixtureId, use useCatalogQuery — but calling N hooks conditionally violates React rules.
// INSTEAD: Use a single hook that loads all catalog items for the current gameweek.
// The existing useCatalogQuery works per-fixture. Use a lookup map pattern:

// Option 1 (recommended for MVP): Use a combined catalog query
// Load fixture-level catalogs for all fixtures that have picks.
// Since hooks can't be called in loops, use a component-per-fixture pattern OR
// store catalogItems in a Map keyed by gameWeekMomentId and populate lazily.

// Simplest correct implementation for MVP:
// Pass the catalog context from a parent-level hook or use a pre-built lookup.
// In moments.tsx, render a child component per fixture group that calls useCatalogQuery(fixtureId),
// then passes the catalog data to its MomentsPickRow children.
```

**Recommended pattern — FixtureGroupSection component:**
```typescript
// apps/mobile/src/components/moments/FixtureGroupSection.tsx (NEW — small component)
// Props: fixtureId, picks: Prediction[], fixture: Fixture
// Internally calls useCatalogQuery(fixtureId) to get event names
// Renders fixture header + MomentsPickRow list for that fixture
// This avoids N+1 at the screen level and is idiomatic per-fixture TanStack Query use
```

This is the same pattern used in Story 5.2's Build View where the catalog is loaded per-fixture when navigating to `catalog/[fixtureId].tsx`. Hooks per component = valid.

**Possible points calculation for BoldnessHeroCard:**

The `Prediction` type does NOT have a `basePoints` field. To calculate possible points for the `BoldnessHeroCard`, join picks against catalog data using `gameWeekMomentId`:

```typescript
// In moment.tsx or FixtureGroupSection:
// For each pick, look up catalogItem by pick.gameWeekMomentId
// Sum basePoints across all picks

// For BoldnessHeroCard (only shown in Locked phase, so catalog should be cached):
// Within FixtureGroupSection you have catalogItems — expose them upward via a callback
// OR calculate possiblePoints within the per-fixture section and sum them

// Simplest: in moments.tsx, pass a callback to collect catalog items,
// then sum after all sections render. BUT this creates render complexity.

// BETTER approach: Calculate possiblePoints inside the component once catalog data is available.
// Use a separate useMemo that reduces over all loaded catalog data vs picks.
// Since catalog queries are per-fixture and already cached (staleTime: Infinity),
// they resolve immediately from cache in Locked phase.
```

**Practical implementation:**
```typescript
// In FixtureGroupSection, pass catalogItems up or calculate per-group total.
// In moments.tsx, sum the per-fixture totals via a state accumulator or context.
// MVP shortcut: show possiblePoints = 0 (or skeleton) until all fixtures resolve,
// then update once all catalogs are cached.
// DO NOT block the screen render for this calculation.
```

### AccessibilityInfo — Reduce Motion on Mount

This is AC#4 — a one-line async check stored in Zustand for Epic 6:

```typescript
import { AccessibilityInfo } from 'react-native';
import { useRevealStore } from '@/src/stores/useRevealStore';

// In moments.tsx component:
const setReduceMotion = useRevealStore((s) => s.setReduceMotion);

useEffect(() => {
  AccessibilityInfo.isReduceMotionEnabled()
    .then((value) => setReduceMotion(value))
    .catch(() => {}); // silent failure — default false is acceptable
}, [setReduceMotion]);
```

Do NOT add `AccessibilityInfo.addEventListener` — a one-time read on mount is sufficient per the epic spec. The value is consumed by Epic 6 RevealCard.

### Sorting Logic for Moment Tab

Precision Picks (predictionType === 'moment') sorted by real-world event time:

```typescript
// Sort by: (1) fixture kickoff time ASC, (2) predictedMinute ASC (nulls last)
const sortedMomentPicks = picks
  .filter(p => p.predictionType === 'moment')
  .sort((a, b) => {
    const fixtureA = fixtures.find(f => f.id === a.fixtureId);
    const fixtureB = fixtures.find(f => f.id === b.fixtureId);
    const kickoffDiff = (fixtureA?.kickoffAt.getTime() ?? 0) - (fixtureB?.kickoffAt.getTime() ?? 0);
    if (kickoffDiff !== 0) return kickoffDiff;
    // Within same fixture, sort by predicted minute
    const minA = a.predictedMinute ?? 999;
    const minB = b.predictedMinute ?? 999;
    return minA - minB;
  });
```

### Fixture Label for MomentsPickRow

```typescript
// Build a fixture label for display (e.g. "Arsenal vs Chelsea")
const fixtureLabel = (fixture: Fixture) => `${fixture.homeTeam} vs ${fixture.awayTeam}`;
```

### Tab Implementation

Two tabs at top of Moments View — Match | Moment. Use `TouchableOpacity` chips (not a library):

```typescript
// Tab chip active: backgroundColor: '#141414', borderBottomWidth: 2, borderBottomColor: '#B4FF32', text color: '#FFFFFF'
// Tab chip inactive: backgroundColor: 'transparent', text color: '#7A7A7A'
// Tab chip: paddingHorizontal: 16, paddingVertical: 10, minHeight: 44
// Container: flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#1E1E1E'
// accessibilityRole="tab", accessibilityState={{ selected: activeTab === 'match' }}
```

No swipe between tabs — per UX spec. Swipe is reserved for back gesture.

### Fixture Group Header in Match Tab

```typescript
// Between fixture groups, render a divider/header:
// Small text: fixtureLabel + kickoff time
// Style: Typography.label, color: '#7A7A7A', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#080808'
```

### State Management — No New Zustand

No new Zustand stores needed. `activeTab` is transient UI state → `useState`. All server data via TanStack Query.

### Existing Imports/Patterns to Reuse

```typescript
// Auth:
import { useAuthState } from '@/src/hooks/useAuthState';

// Gameweek Store:
import { useGameweekStore } from '@/src/stores/useGameweekStore';

// Reveal Store (for setReduceMotion):
import { useRevealStore } from '@/src/stores/useRevealStore';

// Squad query:
import { useSquadQuery } from '@/src/queries/useSquadQuery';

// Fixtures query:
import { useFixturesQuery } from '@/src/queries/useFixturesQuery';

// Catalog query (in per-fixture child component):
import { useCatalogQuery } from '@/src/queries/useCatalogQuery';

// Gameweek query (for gameweek number and lastMatchEnd):
import { useGameweekQuery } from '@/src/queries/useGameweekQuery';

// Shared components:
import { GameweekHeader } from '@/src/components/shared/GameweekHeader';
import { SkeletonRow } from '@/src/components/shared/SkeletonRow';
import { TypeBadge } from '@/src/components/shared/TypeBadge';

// Navigation:
import { router } from 'expo-router';

// Safe area:
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
```

### Colours Reference

```
bg-primary:      #080808
bg-surface:      #141414
bg-elevated:     #1C1C1C
text-primary:    #FFFFFF
text-secondary:  #7A7A7A
border-subtle:   #1E1E1E
accent/lime:     #B4FF32
violet/moment:   #A78BFA
Tier Bronze:     #CD7F32
Tier Silver:     #C0C0C0
Tier Gold:       #FFD700
Tier Platinum:   #E5E4E2
```

### EVENT_ICON_MAP (copy from PickRow — do NOT import from build/)

```typescript
// In MomentsPickRow.tsx — define locally, do NOT import from build/ (different feature boundary)
const EVENT_ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  goal: 'football',
  yellow_card: 'card',
  red_card: 'card',
  corner: 'flag',
  substitution: 'swap-horizontal',
  match_result: 'trophy',
};
```

Architecture rule: `components/moments/` components must not import from `components/build/`. Both import from `components/shared/` only if shared.

### Anti-Patterns to Avoid

1. **DO NOT** redirect to Build View when `phase === 'building'` — User arrives here via Save action. Show their saved squad.
2. **DO NOT** call `useCatalogQuery` in a loop inside the screen component — React hooks rules. Use a per-fixture child component.
3. **DO NOT** block BoldnessHeroCard render waiting for all catalogs — show 0/skeleton unblocked.
4. **DO NOT** put tab state in Zustand — local `useState` is correct for this transient UI state.
5. **DO NOT** add swipe gestures between tabs — UX spec explicitly disallows it.
6. **DO NOT** import Zustand actions from `useBuildStore` — Moments View is read-only of server data.
7. **DO NOT** use `router.push` to return to Build — always `router.replace('/(tabs)/build')`.
8. **DO NOT** show Edit button when phase is `'locked'` or `'reveal'`.
9. **DO NOT** duplicate the Supabase client — import only from `@/src/lib/supabase`.
10. **DO NOT** use `console.log` — `console.error` only.

### Key File Locations (New Files This Story)

```
apps/mobile/src/components/moments/MomentsPickRow.tsx         ← NEW
apps/mobile/src/components/moments/MomentsPickRow.test.tsx    ← NEW
apps/mobile/src/components/moments/FixtureGroupSection.tsx    ← NEW (helper component for catalog N+1 solution)
apps/mobile/src/components/moments/BoldnessShield.tsx         ← NEW
apps/mobile/src/components/moments/BoldnessShield.test.tsx    ← NEW
apps/mobile/src/components/moments/BoldnessHeroCard.tsx       ← NEW
apps/mobile/src/utils/boldness.ts                             ← NEW
apps/mobile/src/utils/boldness.test.ts                        ← NEW
apps/mobile/app/(tabs)/moments.tsx                            ← MODIFIED (full implementation replaces stub)
```

No changes to `build.tsx`, `useSquadQuery.ts`, `useGameweekStore.ts`, `useRevealStore.ts` (only read from these).

### Previous Story Intelligence (from Story 5.4)

- Tests baseline is **143 tests** (127 from 5.3 + 16 from 5.4). Do not break any.
- Import alias `@/` maps to `apps/mobile/` root — confirmed working.
- `Toast` component at `apps/mobile/src/components/shared/Toast.tsx` — available if needed.
- `SkeletonRow` at `apps/mobile/src/components/shared/SkeletonRow.tsx` — use for loading states.
- Use `router.replace('/(tabs)/build')` not `router.push` for view-switching (learned from timing.tsx).
- NaN-guard all parsed params — not applicable here but keep in mind for future.
- `Ionicons` from `@expo/vector-icons` — available and used in `PickRow`.

### Project Structure Notes

- New `moments/` component directory follows architecture rule: organised by feature/screen.
- `src/components/moments/` is defined in architecture file as the canonical location.
- New utility `boldness.ts` under `src/utils/` — pure functions, no hooks.
- Tests co-located as `*.test.tsx` / `*.test.ts` — no `__tests__` directory.

### References

- Epic 5 Story 5.5 requirements: [Source: _bmad-output/planning-artifacts/epics.md#Story-5.5]
- Moments View UX spec: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Moments-View]
- Component strategy for MomentsPickRow, BoldnessShield, BoldnessHeroCard: [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Custom-Components]
- Architecture navigation rules (Save/Edit toggle pattern): [Source: _bmad-output/planning-artifacts/architecture.md#Navigation]
- GameweekHeader existing implementation: [Source: apps/mobile/src/components/shared/GameweekHeader.tsx]
- Squad query pattern: [Source: apps/mobile/src/queries/useSquadQuery.ts]
- Fixtures query: [Source: apps/mobile/src/queries/useFixturesQuery.ts]
- useRevealStore (setReduceMotion target): [Source: apps/mobile/src/stores/useRevealStore.ts]
- Previous story 5.4 learnings: [Source: _bmad-output/implementation-artifacts/5-4-precision-pick-micro-flow.md#Dev-Agent-Record]

### Review Findings

- [x] [Review][Decision] `gameweek?.lastMatchEnd ?? new Date()` fallback in moments.tsx — **Fixed**: added `&& gameweek` guard so BoldnessHeroCard only renders once gameweek data is loaded; removed `?? new Date()` fallback [apps/mobile/app/(tabs)/moments.tsx]

- [x] [Review][Patch] `pick` and `fixtureLabel` props declared in `MomentsPickRowProps` but never destructured or used in the function body — **Fixed**: removed from interface and all call sites [apps/mobile/src/components/moments/MomentsPickRow.tsx]
- [x] [Review][Patch] Subtitle text missing middle-dot separator — **Fixed**: `"Results incoming · ends ${formatted}"` [apps/mobile/src/components/moments/BoldnessHeroCard.tsx]
- [x] [Review][Patch] `TIER_COLOURS` duplicated in three files — **Fixed**: `BoldnessShield.tsx` and `BoldnessHeroCard.tsx` now import from `@/src/utils/boldness` [apps/mobile/src/components/moments/BoldnessHeroCard.tsx, BoldnessShield.tsx]
- [x] [Review][Patch] Duplicate type aliases `BoldnessTierKey` / `BoldnessTier` — **Fixed**: `BoldnessShield.tsx` now re-exports `BoldnessTier = BoldnessTierKey` from `boldness.ts` [apps/mobile/src/components/moments/BoldnessShield.tsx]
- [x] [Review][Patch] **CRITICAL — React Hooks Rules Violation**: all `useMemo`/`useState`/`useCallback` hooks were after the early `if (phase === null)` return — **Fixed**: moved all hooks before the early return [apps/mobile/app/(tabs)/moments.tsx]
- [x] [Review][Patch] `fixtureTotals` not reset when `gameweekId` changes — **Fixed**: added `useEffect(() => setFixtureTotals(new Map()), [gameweekId])` [apps/mobile/app/(tabs)/moments.tsx]
- [x] [Review][Patch] `pick.predictionType as 'match' | 'moment'` unsafe cast in `FixtureGroupSection` — **Fixed**: explicit ternary `pick.predictionType === 'moment' ? 'moment' : 'match'` [apps/mobile/src/components/moments/FixtureGroupSection.tsx]

- [x] [Review][Defer] `totalPicks={20}` hardcoded in `GameweekHeader` — correct value should be sourced from gameweek config [apps/mobile/app/(tabs)/moments.tsx] — deferred, outside this story's scope and consistent with stub pattern
- [x] [Review][Defer] Empty Moment tab when user has picks but zero Precision Picks — no empty state message shown [apps/mobile/app/(tabs)/moments.tsx] — deferred, spec AC#3 only covers zero-picks case; Precision Pick empty state not specified until Epic 5 review

## Dev Agent Record

### Agent Model Used

GitHub Copilot (GPT-4.1)

### Debug Log References

None.

### Completion Notes List

- Implemented `MomentsPickRow` with EVENT_ICON_MAP copied locally per architecture rule (no import from `build/`)
- `BoldnessShield` uses inline opacity-layer trick for RN rgba background
- `BoldnessHeroCard` uses `Intl.DateTimeFormat('en-GB')` for formatted end timestamp
- `deriveBoldnessTier` is pure — no React dependencies
- `FixtureGroupSection` and `MomentTabFixtureGroup` are per-fixture child components to satisfy React hooks rules (no hook in loop)
- Possible points for `BoldnessHeroCard` accumulated via `onCatalogLoaded` callbacks from `FixtureGroupSection`; starts at 0 and updates unblocked as caches resolve
- AC#4: `AccessibilityInfo.isReduceMotionEnabled()` read once on mount, stored in `useRevealStore.setReduceMotion`
- Building-phase redirect removed from stub — user arrives via Save flow and sees their squad
- Edit button shown only in `building` phase; not shown in `locked` or `reveal`
- 161 tests passing (18 new: 8 boldness, 5 MomentsPickRow, 5 BoldnessShield + boldness extra + shield extra; 0 regressions)

### File List

- `apps/mobile/src/components/moments/MomentsPickRow.tsx` — NEW
- `apps/mobile/src/components/moments/MomentsPickRow.test.tsx` — NEW
- `apps/mobile/src/components/moments/FixtureGroupSection.tsx` — NEW
- `apps/mobile/src/components/moments/BoldnessShield.tsx` — NEW
- `apps/mobile/src/components/moments/BoldnessShield.test.tsx` — NEW
- `apps/mobile/src/components/moments/BoldnessHeroCard.tsx` — NEW
- `apps/mobile/src/utils/boldness.ts` — NEW
- `apps/mobile/src/utils/boldness.test.ts` — NEW
- `apps/mobile/app/(tabs)/moments.tsx` — MODIFIED (full implementation replaces stub)

### Change Log

- 2026-05-21: Story 5.5 created from Epic 5 context, Story 5.4 learnings, architecture, and UX spec
- 2026-05-21: Story 5.5 implemented — all tasks complete, 161/161 tests passing, status → review

