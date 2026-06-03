# Story 6.1: RevealCard Component & Animation States

Status: done

## Story

As a **user**,
I want each prediction to reveal its outcome with distinct visual and haptic feedback,
so that hits, misses, jackpots, and captain moments each feel meaningfully different and the reveal is emotionally engaging.

## Acceptance Criteria

1. **Given** `RevealCard` renders in `pending` state **when** it is waiting its turn in the sequence **then** it appears dimmed and neutral — no colour, no animation; content opacity `0.4`; background `#141414`; fully static.

2. **Given** `RevealCard` transitions to `revealing` state **then** a subtle pulse plays for ~300ms: scale `1.0 → 1.02 → 1.0` (`withSpring`) + opacity `0.4 → 0.7` (`withTiming`); this state is transient — auto-advances or parent drives to terminal state.

3. **Given** `RevealCard` transitions to `hit` state **when** the animation runs **then** lime (`#B4FF32`) background fades in at `opacity 0.15` (`withTiming` 300ms) + ✓ icon (lime) appears right + content opacity returns to `1.0` + `Haptics.impactAsync(ImpactFeedbackStyle.Light)` fires.

4. **Given** `RevealCard` transitions to `miss` state **when** the animation runs **then** dark grey (`#303030`) background fades in (`withTiming` 300ms) + ✗ icon (muted grey `#7A7A7A`) appears right + content text colour `#7A7A7A` (dimmed) + **no haptic**.

5. **Given** `RevealCard` transitions to `captain-hit` state **when** the animation runs **then** gold (`#FFD700`) background flashes ×2 via `withSequence`+`withTiming` (150ms/flash) and settles at `opacity 0.15` + crown icon pulses `scale 1.0 → 1.3 → 1.0` (`withSpring`) + ✓ icon also shown + `Haptics.impactAsync(ImpactFeedbackStyle.Medium)` fires.

6. **Given** `RevealCard` transitions to `jackpot` state **when** the animation runs **then** card scales `1.0 → 1.05 → 1.0` (`withSpring`) + gold background bursts in at `opacity 0.25` (`withTiming` 200ms) + ⚡ icon (gold) appears + `Haptics.notificationAsync(NotificationFeedbackType.Success)` fires. **Jackpot is captain-independent** — a non-captain Precision Pick can jackpot.

7. **Given** `RevealCard` receives `firstView={false}` **when** it renders **then** it renders immediately in its final resolved state with no animation and no haptic for any terminal state (`hit`, `miss`, `captain-hit`, `jackpot`, `pending`). No `useEffect` animation triggers.

8. **Given** `RevealCard` receives `reduceMotion={true}` **when** it transitions state **then** it jumps instantly to the final state — no spring/timing animations. **Haptics still fire** when `reduceMotion={true}` (motion reduction ≠ haptic reduction).

9. **Given** `isStreakChained={true}` and `streakBonusPoints` is set **when** the streak-chain animation runs **then** a lime background pulses `0% → 15% opacity → 0%` over 400ms (`withTiming`) — synchronised with sibling cards, not independent + a streak bonus badge shows `"+{n}"` (`10`, `20`, or `30`) with scale-up `0.8 → 1.0` (`withSpring`) then remains visible. When `reduceMotion={true}`: badge appears instantly, no flash.

10. **Given** all animations are implemented **when** running on mid-range Android **then** all animations use Reanimated UI-thread worklets — no JS-thread animation warnings in Metro, 60fps target.

11. **Given** the component is complete **when** tests run **then**: snapshot tests for all 6 states + `firstView={false}` + `reduceMotion={true}` variants; unit tests verify haptic fires for `hit`, `captain-hit`, `jackpot`; does NOT fire for `miss` or `pending`; haptic fires even when `reduceMotion={true}`; no animation/haptic side-effect when `firstView={false}`; streak badge renders correct `+N` for each `streakBonusPoints` value; badge absent when `isStreakChained={false}` or `streakBonusPoints={null}`.

## Tasks / Subtasks

- [x] Task 1: Create `apps/mobile/src/components/reveal/` directory and `RevealCard.tsx` (AC: 1–10)
  - [x] Define `RevealState` union type and `RevealCardProps` interface (exact API below)
  - [x] Copy `EVENT_ICON_MAP` locally — do NOT import from `build/` or `moments/`
  - [x] Implement `pending` static rendering (opacity `0.4`, no animation)
  - [x] Implement `revealing` transient animation: `withSpring` scale + `withTiming` opacity
  - [x] Implement `hit` terminal: lime bg fade + ✓ icon + haptic Light
  - [x] Implement `miss` terminal: grey bg fade + ✗ icon + no haptic + dimmed text
  - [x] Implement `captain-hit` terminal: gold double-flash + crown pulse + ✓ icon + haptic Medium
  - [x] Implement `jackpot` terminal: card scale burst + gold bg + ⚡ icon + haptic Success
  - [x] Implement `firstView={false}` fast path: skip all animations, render final state, skip haptics
  - [x] Implement `reduceMotion={true}` path: instant final state, haptics still fire
  - [x] Implement streak badge: `isStreakChained` + `streakBonusPoints` props → pulse + badge
  - [x] Wire `onRevealComplete` callback after terminal animation settles
  - [x] Ensure all animated style computations in `useAnimatedStyle` worklets (UI thread)

- [x] Task 2: Create `apps/mobile/src/components/reveal/index.ts` barrel export (AC: all)
  - [x] `export { RevealCard } from './RevealCard';`
  - [x] `export type { RevealCardProps, RevealState } from './RevealCard';`

- [x] Task 3: Write `apps/mobile/src/components/reveal/RevealCard.test.tsx` (AC: 11)
  - [x] Add `expo-haptics` mock at top of test file (see mock block in Dev Notes)
  - [x] Snapshot: `pending`, `revealing`, `hit`, `miss`, `captain-hit`, `jackpot` (6 tests)
  - [x] Snapshot: `firstView={false}` for each terminal state (5 tests)
  - [x] Snapshot: `reduceMotion={true}` for `hit`, `captain-hit`, `jackpot` (3 tests)
  - [x] Unit: haptic fires for `hit` (Light), `captain-hit` (Medium), `jackpot` (Success)
  - [x] Unit: NO haptic for `miss` or `pending`
  - [x] Unit: haptic fires when `reduceMotion={true}` + `hit`
  - [x] Unit: NO animation triggered + NO haptic when `firstView={false}`
  - [x] Unit: streak badge shows `"+10"`, `"+20"`, `"+30"` for respective `streakBonusPoints`
  - [x] Unit: streak badge absent when `isStreakChained={false}` or `streakBonusPoints={null}`

- [x] Task 4: Update sprint status (AC: all)
  - [x] Mark all tasks complete in this story file
  - [x] Update `sprint-status.yaml`: `6-1-revealcard-component-and-animation-states: review`
  - [x] Update `epic-6: in-progress`

## Dev Notes

### ⚠️ CRITICAL: Reanimated Version Is v4, Not v3

The installed version is **`react-native-reanimated ~4.1.1`** (see `apps/mobile/package.json`). The spec doc references "Reanimated v3" — **ignore that label**. The animation primitives are identical (`useSharedValue`, `useAnimatedStyle`, `withTiming`, `withSpring`, `withSequence`), but you must:
- Use the Reanimated v4 import path: `import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, withSequence, runOnJS } from 'react-native-reanimated';`
- **DO NOT** use `useAnimatedReaction` or `runOnUI` unnecessarily — prefer direct worklets in `useAnimatedStyle`
- `react-native-worklets` (`0.5.1`) is a separate dep, already installed — do not re-install

### Component API (exact)

```typescript
export type RevealState =
  | 'pending'
  | 'revealing'
  | 'hit'
  | 'miss'
  | 'captain-hit'
  | 'jackpot';

export interface RevealCardProps {
  revealState: RevealState;
  // Card content (mirrors MomentsPickRow anatomy)
  eventName: string;
  eventType: string;          // key into EVENT_ICON_MAP
  predictionType: 'match' | 'moment';
  pointsValue: number;
  isCaptain: boolean;
  // Reveal control (both come from useRevealStore in parent — passed as props here)
  firstView: boolean;         // false = render final state instantly, no animation, no haptic
  reduceMotion: boolean;      // true = instant transition, haptics still fire
  // Streak chain
  isStreakChained?: boolean;
  streakBonusPoints?: 10 | 20 | 30 | null;
  // Callbacks
  onRevealComplete?: () => void;
  testID?: string;
}
```

### ⚠️ DO NOT import MomentsPickRow

Re-implement card layout inline. Architecture rule: `components/reveal/` must not import from `components/moments/` or `components/build/`. Both import from `components/shared/` only if shared.

### MomentsPickRow Layout Reference (mirror this, don't import it)

`apps/mobile/src/components/moments/MomentsPickRow.tsx` (97 lines — read it):
```
- container: flexDirection:'row', alignItems:'center', justifyContent:'space-between'
- paddingVertical:12, paddingHorizontal:16, minHeight:44, backgroundColor:'#141414'
- borderBottomWidth:1, borderBottomColor:'#1E1E1E'
- left: flexDirection:'row', alignItems:'center', gap:8, flex:1
  - Ionicons icon (eventType → EVENT_ICON_MAP, default:'star', size:20)
  - Text: eventName (Typography.body)
  - TypeBadge (predictionType)
- right: flexDirection:'row', alignItems:'center', gap:6
  - Text: pointsValue (Typography.body, tabular-nums)
  - '👑' emoji if isCaptain
```

Copy `EVENT_ICON_MAP` verbatim into `RevealCard.tsx`:
```typescript
const EVENT_ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  goal: 'football',
  yellow_card: 'card',
  red_card: 'card',
  corner: 'flag',
  substitution: 'swap-horizontal',
  match_result: 'trophy',
};
```

### Colour Constants (define at top of file)

```typescript
const COLOURS = {
  lime: '#B4FF32',
  limeAlpha15: 'rgba(180,255,50,0.15)',
  gold: '#FFD700',
  goldAlpha15: 'rgba(255,215,0,0.15)',
  goldAlpha20: 'rgba(255,215,0,0.20)',
  goldAlpha25: 'rgba(255,215,0,0.25)',
  missBg: '#303030',
  textPrimary: '#FFFFFF',
  textMuted: '#7A7A7A',
  surface: '#141414',
  borderSubtle: '#1E1E1E',
} as const;
```

No imports from `packages/ui` or Tailwind tokens — inline constants only (same pattern as `DeadlineStrip.tsx` and `MomentsPickRow.tsx`).

### Animation Spec Table

| State | Property | From → To | Duration | Method |
|---|---|---|---|---|
| `revealing` | `scale` | `1.0 → 1.02 → 1.0` | ~150ms each | `withSpring` |
| `revealing` | `opacity` | `0.4 → 0.7` | 150ms | `withTiming` |
| `hit` | `bgOpacity` | `0 → 0.15` | 300ms | `withTiming` |
| `hit` | `contentOpacity` | `0.4 → 1.0` | 300ms | `withTiming` |
| `miss` | `bgOpacity` | `0 → 1.0` | 300ms | `withTiming` |
| `miss` | `contentOpacity` | `0.4 → 1.0` | 300ms | `withTiming` |
| `captain-hit` | `bgOpacity` | `0→0.2→0→0.15` (flash×2 settle) | 150ms/flash | `withSequence`+`withTiming` |
| `captain-hit` | `crownScale` | `1.0→1.3→1.0` | ~200ms | `withSpring` |
| `jackpot` | `cardScale` | `1.0→1.05→1.0` | ~250ms | `withSpring` |
| `jackpot` | `bgOpacity` | `0 → 0.25` | 200ms | `withTiming` |
| streak flash | `streakBgOpacity` | `0→0.15→0` | 400ms total | `withTiming` chain |
| streak badge | `badgeScale` | `0.8 → 1.0` | ~200ms | `withSpring` |

**reduceMotion shortcut:** Replace all `withTiming`/`withSpring` calls with the final target value directly (no duration) when `reduceMotion` is `true`. Use a helper:
```typescript
const animate = (toValue: number, config?: object) =>
  reduceMotion ? toValue : withTiming(toValue, config);
```

### Haptic Mapping

```typescript
// Fires in useEffect watching revealState changes (JS thread is fine for haptics)
// Only fire when firstView === true (AC7: no haptic on firstView=false)
switch (revealState) {
  case 'hit':        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); break;
  case 'captain-hit': Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); break;
  case 'jackpot':    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); break;
  // miss, pending, revealing: no haptic
}
```

Import: `import * as Haptics from 'expo-haptics';` (already at `expo-haptics ~15.0.8`).

**DO NOT** call `AccessibilityInfo.isReduceMotionEnabled()` inside this component. The parent `RevealSequence` (Story 6.2) checks it once on mount via `useRevealStore` (see `setReduceMotion` in `useRevealStore.ts`). `reduceMotion` is passed as a prop.

### useRevealStore (existing — read-only for this story)

`apps/mobile/src/stores/useRevealStore.ts` already has:
```typescript
{
  firstView: boolean,      // set by RevealSequence in 6.2
  reduceMotion: boolean,   // set by moments.tsx AC#4 (Story 5.5 ✅)
  revealIndex: number,     // advanced by RevealSequence in 6.2
  setFirstView, setReduceMotion, advanceReveal, resetReveal
}
```
`RevealCard` **does not read from this store directly** — `firstView` and `reduceMotion` are passed as props from parent. This keeps RevealCard pure and testable. The parent (`RevealSequence`, Story 6.2) reads the store and passes down.

### Result Icon Rendering

Right-side result indicator based on `revealState`:
```typescript
const RESULT_ICONS: Partial<Record<RevealState, { icon: keyof typeof Ionicons.glyphMap; color: string }>> = {
  hit:          { icon: 'checkmark-circle', color: COLOURS.lime },
  miss:         { icon: 'close-circle',     color: COLOURS.textMuted },
  'captain-hit': { icon: 'checkmark-circle', color: COLOURS.lime },   // also shows crown
  jackpot:      { icon: 'flash',            color: COLOURS.gold },
};
```
Accessibility: every hit/miss/jackpot state uses colour AND icon (never colour alone — UX-DR28).

### Streak Badge

```typescript
// Rendered conditionally below (or between) cards:
{isStreakChained && streakBonusPoints != null && (
  <Animated.View style={[styles.streakBadge, animatedBadgeStyle]}>
    <Text style={styles.streakBadgeText}>{`+${streakBonusPoints}`}</Text>
  </Animated.View>
)}
```
Badge style: `backgroundColor: COLOURS.limeAlpha15`, `borderRadius: 9999`, `paddingHorizontal: 8`, `paddingVertical: 2`.
Badge text: `Typography.label`, `color: COLOURS.lime`, `fontVariant: ['tabular-nums']`.

### Accessibility Requirements (UX-DR28)

- `accessibilityRole="text"` on container
- `accessibilityLabel` changes per state: e.g. `"{eventName}, hit, {pointsValue} points, captain"` — build dynamically
- Icon + colour always paired — never colour alone for state communication
- All touch targets (if any) ≥ 44×44px

### Jest / Testing

**`react-native-reanimated/mock`** is already in `setupFiles` (`apps/mobile/package.json`). No changes needed to jest config.

**expo-haptics mock** — add at the top of `RevealCard.test.tsx`:
```typescript
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success' },
}));
```

**Snapshot testing pattern** (consistent with prior stories):
```typescript
import { render } from '@testing-library/react-native';
import { RevealCard } from './RevealCard';

it('renders hit state', () => {
  const { toJSON } = render(
    <RevealCard
      revealState="hit"
      eventName="Goal"
      eventType="goal"
      predictionType="moment"
      pointsValue={420}
      isCaptain={false}
      firstView={true}
      reduceMotion={false}
    />
  );
  expect(toJSON()).toMatchSnapshot();
});
```

**Haptic verification pattern:**
```typescript
const Haptics = require('expo-haptics');
// render with revealState="hit", firstView=true
expect(Haptics.impactAsync).toHaveBeenCalledWith('light');
```

**Tests baseline:** 161 passing (from Story 5.5). Do NOT break any. New tests target: ~20+ new tests (14 snapshots + 7+ unit tests).

### File Locations (New Files This Story)

```
apps/mobile/src/components/reveal/        ← NEW directory
  RevealCard.tsx                           ← NEW (main component)
  RevealCard.test.tsx                      ← NEW (tests)
  index.ts                                 ← NEW (barrel export)
```

No changes to: `MomentsPickRow.tsx`, `useRevealStore.ts`, `moments.tsx`, `build.tsx`, or any existing component.

### Anti-Patterns to Avoid

1. **DO NOT** import from `components/moments/MomentsPickRow.tsx` — re-implement layout inline.
2. **DO NOT** import from `components/build/PickRow.tsx` — copy `EVENT_ICON_MAP` locally.
3. **DO NOT** use the legacy `Animated` API — Reanimated only (`react-native-reanimated`).
4. **DO NOT** call `AccessibilityInfo.isReduceMotionEnabled()` inside `RevealCard` — parent passes `reduceMotion` as prop.
5. **DO NOT** import Tailwind tokens or `packages/ui` — inline `COLOURS` constant block only.
6. **DO NOT** put `firstView`/`reduceMotion` reads in the component via `useRevealStore` — accept as props.
7. **DO NOT** fire haptics when `firstView={false}` — guard in `useEffect`.
8. **DO NOT** compute animated styles on JS thread — all style logic must be inside `useAnimatedStyle` worklets.
9. **DO NOT** use `console.log` — `console.error` only.
10. **DO NOT** add swipe or tap handlers to `RevealCard` — it is a display-only component.

### Definition of Done

- [ ] `RevealCard.tsx`, `RevealCard.test.tsx`, `index.ts` created in `apps/mobile/src/components/reveal/`
- [ ] All 11 ACs met
- [ ] All Reanimated animations on UI thread (no JS-thread warnings in Metro/dev console)
- [ ] `pnpm test --filter mobile` passes (161 + new tests)
- [ ] `pnpm typecheck --filter mobile` passes
- [ ] `pnpm lint --filter mobile` passes
- [ ] All 6 animation states visually reviewed on device/simulator — screenshot or screen recording attached to PR
- [ ] PR references `Story 6.1`

### Project Structure Notes

- New `reveal/` component directory follows architecture rule: organised by feature/screen (not by type).
- `src/components/reveal/` is parallel to `build/`, `moments/`, `shared/` — feature boundary enforced.
- Tests co-located as `RevealCard.test.tsx` — no `__tests__` directory.
- `import { TypeBadge } from '@/src/components/shared/TypeBadge'` — shared atoms are allowed from `shared/`.
- `import { Typography } from '@/src/lib/typography'` — lib utilities are allowed.
- `import { Ionicons } from '@expo/vector-icons'` — available, already used across the project.

### References

- Story 6.1 requirements: [Source: _bmad-output/planning-artifacts/epics.md#Story-6.1]
- Pre-written implementation spec (full detail): [Source: _bmad-output/implementation-artifacts/6-1-reveal-card-component-and-animation-states.md]
- RevealCard UX spec (UX-DR17): [Source: _bmad-output/planning-artifacts/epics.md#UX-Design-Requirements]
- RevealSequence UX spec (UX-DR18, UX-DR29): [Source: _bmad-output/planning-artifacts/epics.md#UX-Design-Requirements]
- Accessibility (UX-DR28): [Source: _bmad-output/planning-artifacts/epics.md#UX-Design-Requirements]
- MomentsPickRow layout reference: [Source: apps/mobile/src/components/moments/MomentsPickRow.tsx]
- useRevealStore (firstView/reduceMotion): [Source: apps/mobile/src/stores/useRevealStore.ts]
- Architecture component structure rules: [Source: _bmad-output/planning-artifacts/architecture.md#Structure-Patterns]
- Animation library version: react-native-reanimated `~4.1.1` [Source: apps/mobile/package.json]
- Previous story 5.5 learnings: [Source: _bmad-output/implementation-artifacts/5-5-moments-view-squad-review-and-locked-state.md#Dev-Agent-Record]

### Review Findings

- [x] [Review][Decision] captain-hit flash count: resolved → Option B (true ×2 flash: `0→0.2→0→0.2→0→0.15`); matches AC5 literal text; more emotionally distinct for captain moments.
- [x] [Review][Decision] `onRevealComplete` not fired when `firstView=false` — resolved → Option A (keep as-is); `firstView=false` is a static re-view, no sequence to advance; Story 6.2 should not pass `onRevealComplete` in that mode.
- [x] [Review][Patch] Event icon color ternary always returns `textMuted` — fixed: non-miss states now use `COLOURS.textPrimary` [RevealCard.tsx:338-340]
- [x] [Review][Patch] `captain-hit` case missing `onRevealComplete` callback — fixed: fires via `withTiming` callback at end of flash sequence (reduceMotion=false) or directly (reduceMotion=true) [RevealCard.tsx]
- [x] [Review][Patch] Double-write of `bgOpacity` in `hit` case — fixed: restructured to single conditional assignment [RevealCard.tsx]
- [x] [Review][Patch] Double-write of `bgOpacity` in `miss` case — fixed: restructured to single conditional assignment [RevealCard.tsx]
- [x] [Review][Defer] `reduceMotion` and other props excluded from `useEffect` deps (suppressed) [RevealCard.tsx:240] — deferred, pre-existing pattern

## Dev Agent Record

### Agent Model Used

GitHub Copilot (GPT-4.1)

### Debug Log References

- Haptic firing moved from `runOnJS` in animation callbacks to direct JS-thread call at top of `useEffect`. The `react-native-reanimated/mock` doesn't execute animation callbacks, so haptics must fire synchronously on the JS thread — guarded by `firstView` check.

### Completion Notes List

- ✅ Created `apps/mobile/src/components/reveal/RevealCard.tsx` — full component with all 6 states (`pending`, `revealing`, `hit`, `miss`, `captain-hit`, `jackpot`), `firstView={false}` fast path, `reduceMotion={true}` instant path, streak badge, and `onRevealComplete` callback.
- ✅ All Reanimated v4 animations in `useAnimatedStyle` worklets (UI thread). No legacy `Animated` API used.
- ✅ `EVENT_ICON_MAP` and `COLOURS` constants defined inline — no imports from `build/` or `moments/`.
- ✅ `AccessibilityInfo.isReduceMotionEnabled()` NOT called inside component — `reduceMotion` accepted as prop.
- ✅ Haptics fire directly in `useEffect` (JS thread), gated by `firstView === true`.
- ✅ Created `apps/mobile/src/components/reveal/index.ts` barrel export.
- ✅ Created `apps/mobile/src/components/reveal/RevealCard.test.tsx` — 30 tests: 14 snapshots + 16 unit tests.
- ✅ Full test suite: **191 tests pass** (161 baseline + 30 new). Zero regressions.
- ✅ TypeScript: no new errors in `reveal/` files (pre-existing errors in unrelated files only).

### File List

- `apps/mobile/src/components/reveal/RevealCard.tsx` (NEW)
- `apps/mobile/src/components/reveal/index.ts` (NEW)
- `apps/mobile/src/components/reveal/RevealCard.test.tsx` (NEW)
- `_bmad-output/implementation-artifacts/6-1-revealcard-component-and-animation-states.md` (MODIFIED — tasks, status, dev record)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (MODIFIED — story → review)

### Change Log

- 2026-06-03: Implemented Story 6.1 — RevealCard component with all 6 animation states, firstView/reduceMotion paths, streak badge, haptic feedback, and full test suite (30 new tests). Story status → review.
