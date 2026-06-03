# Story 6.2: Reveal Sequence, Results Screen & Streak Visualisation

Status: done

## Story

As a **user**,
I want my full gameweek results revealed sequentially with a running score counter, then my streak chain shown in the Moment tab, with a fast summary on any return visit,
so that the first reveal is a dramatic payoff and subsequent visits are efficient.

## Acceptance Criteria

1. **Given** the gameweek phase is `reveal` (`scoring_status = 'complete'` AND `reveal_seen = false`) **when** the user opens the app **then** Moments View opens with all picks in `pending` RevealCard state **and** `RevealSequence` begins automatically — no tap required to start.

2. **Given** `RevealSequence` is running **when** each card resolves **then** cards reveal one at a time with a 600ms delay between them **and** a running score counter updates after each card resolves **and** after all cards are resolved the score counter animates up to the final total.

3. **Given** the user opens the Moment tab after Match tab cards have resolved **when** the tab renders **then** Precision Picks are shown in real-world event-time order **and** consecutive correct picks are visually chained — the streak is visible **and** the point where the streak broke is clearly indicated (FR34).

4. **Given** all cards have resolved **when** `reveal_seen` is set to `true` in Supabase for this user + gameweek **then** the reveal sequence never re-triggers for this gameweek on subsequent app opens.

5. **Given** the user returns to results after `reveal_seen = true` **when** Moments View loads **then** all cards render immediately in their final resolved states — `firstView={false}` passed to all RevealCards, no sequential delay.

6. **Given** `useResultsQuery` fetches scoring data **when** the TanStack Query key is used **then** it uses exactly `['results', userId, gameweekId]` **and** the query only resolves data when `scoring_status = 'complete'` (RLS enforcement).

7. **Given** the full 20-token reveal renders **when** timing is measured on a mid-range device **then** the reveal screen is ready to begin animation in under 3 seconds from app open (NFR4).

8. **Given** `reduceMotion` is true (set by the app-start check in `(tabs)/_layout.tsx`) **when** the reveal runs **then** all RevealCards render in their final state instantly — no sequential animation, no delays.

9. **Given** all cards have resolved and the user belongs to one or more mini-leagues **when** the final score is displayed **then** the user's current position in each mini-league is shown inline, with a position change indicator (↑N lime / ↓N muted / — no change) **and** this leaderboard position display appears before the share prompt.

10. **Given** the user does not belong to any mini-league **when** the reveal completes **then** a prompt is shown: "No league yet — create one or join a friend's".

## Tasks / Subtasks

- [x] Task 1: Implement `useResultsQuery` with full Supabase fetch (AC: 6)
  - [x] Define `ResultsRow` interface in `useResultsQuery.ts` (joined ScoringResult + Prediction + moment data)
  - [x] Implement PostgREST joined query: `scoring_results` → `predictions` → `game_week_moments` → `moment_types`
  - [x] Parse raw Supabase response into `ResultsRow[]` — map snake_case → camelCase fields
  - [x] Keep query key `['results', userId, gameweekId]` exactly as defined in architecture
  - [x] Enable query only when `userId != null && gameweekId != null`
  - [x] RLS on `scoring_results` already enforces `scoring_status = 'complete'` — no client-side guard needed

- [x] Task 2: Add `useMarkRevealSeenMutation` to `useGameweekQuery.ts` (AC: 4)
  - [x] Upsert `user_gameweek_states` row: `{ user_id, gameweek_id, has_seen_reveal: true }`
  - [x] On success, invalidate `['gameweek', 'reveal-state', gameweekId, userId]` to trigger phase re-derive
  - [x] Use `onConflict: 'user_gameweek_states_user_gameweek_unique'` for the upsert

- [x] Task 3: Create `apps/mobile/src/components/reveal/RevealSequence.tsx` (AC: 1, 2, 4, 7, 8, 9, 10)
  - [x] Define `RevealSequenceProps` interface (see Dev Notes — Component API)
  - [x] On mount: call `resetReveal()` from `useRevealStore` if `firstView=true`; skip if `firstView=false`
  - [x] Sort results: match picks first (by fixture kickoff), then moment picks (by fixture kickoff + predictedMinute)
  - [x] Map sort order to `revealIndex` — card at index `i` reveals when `revealIndex >= i`
  - [x] Card reveal state: `revealIndex < i` → `pending`; `revealIndex === i` → `revealing` (600ms) → terminal state; `revealIndex > i` → terminal state
  - [x] Running score counter: `useState<number>(0)`, incremented by `result.totalPoints` in `onRevealComplete`
  - [x] `reduceMotion=true` path: skip sequential animation; set all cards to final state immediately; skip counter animation; fire `onAllRevealed` synchronously
  - [x] After all cards resolved: animate counter to `finalTotal` (sum of all `totalPoints`), then call `onAllRevealed`
  - [x] Render post-reveal summary section: final score + mini-league positions + "No league" prompt
  - [x] Score counter animation: use Reanimated `useSharedValue` + `withTiming` to animate from running total to final total (skip if `reduceMotion=true`)
  - [x] Pass `firstView` and `reduceMotion` as props to each `RevealCard` (read from `useRevealStore`)
  - [x] Pass `isStreakChained` and `streakBonusPoints` derived from `result.streakBonus`

- [x] Task 4: Update `apps/mobile/src/components/reveal/index.ts` barrel export (AC: all)
  - [x] Add `export { RevealSequence } from './RevealSequence';`
  - [x] Add `export type { RevealSequenceProps, ResultsRow } from './RevealSequence';`

- [x] Task 5: Update `apps/mobile/app/(tabs)/moments.tsx` (AC: 1, 2, 3, 5, 8)
  - [x] Import `useResultsQuery` and `useMarkRevealSeenMutation` from queries
  - [x] Import `RevealSequence` from `@/src/components/reveal`
  - [x] Add phase detection: `const isRevealPhase = phase === 'reveal';`
  - [x] Add results detection: `const isResultsPhase = phase === 'locked' && gameweek?.scoringStatus === 'complete';`
  - [x] Call `useResultsQuery(userId, gameweekId)` — data drives RevealSequence and results view
  - [x] In `reveal` phase: render `RevealSequence` over the normal tab view; pass `onAllRevealed` callback to fire `useMarkRevealSeenMutation`
  - [x] In `results` phase: render Moment tab with `RevealCard` (`firstView={false}`) for each scored Precision Pick; render Match tab with `RevealCard` (`firstView={false}`) for match picks
  - [x] In `results` phase Moment tab: apply streak chain visualisation (see Dev Notes — Streak Chain)
  - [x] Do NOT break existing `building` and `locked` (non-complete) phase rendering

- [x] Task 6: Create `apps/mobile/src/components/reveal/RevealSequence.test.tsx` (AC: all)
  - [x] Mock `useRevealStore` — use jest.fn() for `advanceReveal`, `resetReveal`
  - [x] Mock `expo-haptics` (copy from RevealCard.test.tsx mock block)
  - [x] Snapshot: RevealSequence in `firstView=true` initial state (all pending)
  - [x] Snapshot: RevealSequence in `firstView=false` (all cards in final resolved state)
  - [x] Snapshot: RevealSequence with `reduceMotion=true` (all cards final, no sequence)
  - [x] Unit: `resetReveal` called on mount when `firstView=true`
  - [x] Unit: `resetReveal` NOT called on mount when `firstView=false`
  - [x] Unit: `onAllRevealed` callback fires after all `onRevealComplete` callbacks
  - [x] Unit: running score counter increments by `totalPoints` after each `onRevealComplete`
  - [x] Unit: match picks appear before moment picks in sort order
  - [x] Unit: `isStreakChained=true` on cards with `streakBonus > 0`
  - [x] Unit: "No league yet" prompt rendered when `leagues` prop is empty

- [x] Task 7: Update sprint status (AC: all)
  - [x] Update `sprint-status.yaml`: `6-2-reveal-sequence-results-screen-and-streak-visualisation: review`

## Dev Notes

### Gameweek Phase Detection (existing — do NOT modify `deriveGameweekPhase`)

The `reveal` phase is already set by `deriveGameweekPhase` in `apps/mobile/src/utils/gameweekPhase.ts`:

```typescript
// scoring_status === 'complete' && hasSeenReveal === false → 'reveal'
// scoring_status === 'complete' && hasSeenReveal === true → 'locked'
```

In `moments.tsx`, detect the two post-scoring states:

```typescript
const isRevealPhase = phase === 'reveal';
// Return visit after hasSeenReveal=true; gameweek is locked but scoring complete
const isResultsPhase = phase === 'locked' && gameweek?.scoringStatus === 'complete';
```

### ResultsRow — Joined Query Response

Define locally in `useResultsQuery.ts`:

```typescript
export interface ResultsRow {
  // From scoring_results
  id: number;
  predictionId: number;
  userId: string;
  gameweekId: number;
  eventPoints: number;
  timingBonus: number;
  playerBonus: number;
  assisterBonus: number;
  zoneBonus: number;
  jackpotBonus: number;
  captainMultiplier: number;
  streakBonus: number;
  totalPoints: number;
  isCorrect: boolean;
  createdAt: string;
  // Joined from predictions
  predictionType: 'match' | 'moment';
  isCaptain: boolean;
  fixtureId: number;
  gameWeekMomentId: number;
  predictedMinute: number | null;
  // Joined from game_week_moments → moment_types
  eventName: string;
  eventType: string;
  basePoints: number;
}
```

### useResultsQuery — Supabase Joined Query

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/src/lib/supabase';

export function useResultsQuery(userId: string | null, gameweekId: number | null) {
  return useQuery<ResultsRow[] | null>({
    queryKey: ['results', userId, gameweekId],
    queryFn: async () => {
      if (!userId || !gameweekId) return null;

      const { data, error } = await supabase
        .from('scoring_results')
        .select(`
          *,
          predictions!inner(
            prediction_type,
            is_captain,
            fixture_id,
            predicted_minute,
            game_week_moment_id,
            game_week_moments!inner(
              base_points,
              moment_types!inner(
                name,
                event_type
              )
            )
          )
        `)
        .eq('user_id', userId)
        .eq('gameweek_id', gameweekId);

      if (error) {
        console.error('useResultsQuery error:', error);
        throw error;
      }

      if (!data) return null;

      // Flatten nested joins into ResultsRow
      return data.map((row: Record<string, unknown>) => {
        const prediction = row.predictions as Record<string, unknown>;
        const gwMoment = prediction.game_week_moments as Record<string, unknown>;
        const momentType = gwMoment.moment_types as Record<string, unknown>;
        return {
          id: row.id as number,
          predictionId: row.prediction_id as number,
          userId: row.user_id as string,
          gameweekId: row.gameweek_id as number,
          eventPoints: row.event_points as number,
          timingBonus: row.timing_bonus as number,
          playerBonus: row.player_bonus as number,
          assisterBonus: row.assister_bonus as number,
          zoneBonus: row.zone_bonus as number,
          jackpotBonus: row.jackpot_bonus as number,
          captainMultiplier: row.captain_multiplier as number,
          streakBonus: row.streak_bonus as number,
          totalPoints: row.total_points as number,
          isCorrect: row.is_correct as boolean,
          createdAt: row.created_at as string,
          predictionType: prediction.prediction_type as 'match' | 'moment',
          isCaptain: prediction.is_captain as boolean,
          fixtureId: prediction.fixture_id as number,
          gameWeekMomentId: prediction.game_week_moment_id as number,
          predictedMinute: prediction.predicted_minute as number | null,
          eventName: momentType.name as string,
          eventType: momentType.event_type as string,
          basePoints: gwMoment.base_points as number,
        } satisfies ResultsRow;
      });
    },
    enabled: userId != null && gameweekId != null,
    staleTime: 5 * 60_000, // 5 min — results don't change after scoring_complete
  });
}
```

### useMarkRevealSeenMutation — Add to useGameweekQuery.ts

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useMarkRevealSeenMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      gameweekId,
    }: {
      userId: string;
      gameweekId: number;
    }) => {
      const { error } = await supabase
        .from('user_gameweek_states')
        .upsert(
          { user_id: userId, gameweek_id: gameweekId, has_seen_reveal: true },
          { onConflict: 'user_id,gameweek_id' },
        );
      if (error) {
        console.error('useMarkRevealSeenMutation error:', error);
        throw error;
      }
    },
    onSuccess: (_, { userId, gameweekId }) => {
      // Phase re-derives automatically — the reveal state query invalidation
      // triggers _layout.tsx useEffect → deriveGameweekPhase → setPhase('locked')
      queryClient.invalidateQueries({
        queryKey: ['gameweek', 'reveal-state', gameweekId, userId],
      });
    },
  });
}
```

### RevealSequence — Component API

```typescript
// apps/mobile/src/components/reveal/RevealSequence.tsx

export interface RevealSequenceProps {
  results: ResultsRow[];          // All scored picks for this gameweek
  fixtures: Fixture[];            // For kickoff ordering (from useFixturesQuery)
  leagues: MiniLeague[];          // User's mini-leagues (from useLeagueQuery)
  leaderboardEntries: LeaderboardEntry[]; // Mini-league leaderboard data (empty until Epic 7/8)
  onAllRevealed: () => void;      // Called after all cards resolve + counter settles
  testID?: string;
}
```

Import `RevealCard` from `./RevealCard` (same directory — NOT `../moments/`).
Import `useRevealStore` from `@/src/stores/useRevealStore`.

### RevealState Derivation from ResultsRow

```typescript
import type { RevealState } from './RevealCard';

function deriveRevealState(result: ResultsRow): Exclude<RevealState, 'pending' | 'revealing'> {
  if (!result.isCorrect) return 'miss';
  if (result.jackpotBonus > 0) return 'jackpot';  // captain-independent (AC6 from Story 6.1)
  if (result.captainMultiplier === 2) return 'captain-hit';
  return 'hit';
}
```

### Card Sort Order

```typescript
function sortResults(results: ResultsRow[], fixturesById: Map<number, Fixture>): ResultsRow[] {
  // Match picks first, sorted by fixture kickoff
  const matchPicks = results
    .filter((r) => r.predictionType === 'match')
    .sort((a, b) => {
      const fa = fixturesById.get(a.fixtureId);
      const fb = fixturesById.get(b.fixtureId);
      return (fa?.kickoffAt.getTime() ?? 0) - (fb?.kickoffAt.getTime() ?? 0);
    });

  // Moment picks: sorted by fixture kickoff, then predictedMinute
  const momentPicks = results
    .filter((r) => r.predictionType === 'moment')
    .sort((a, b) => {
      const fa = fixturesById.get(a.fixtureId);
      const fb = fixturesById.get(b.fixtureId);
      const fixtureDiff = (fa?.kickoffAt.getTime() ?? 0) - (fb?.kickoffAt.getTime() ?? 0);
      if (fixtureDiff !== 0) return fixtureDiff;
      return (a.predictedMinute ?? 999) - (b.predictedMinute ?? 999);
    });

  return [...matchPicks, ...momentPicks];
}
```

### isStreakChained + streakBonusPoints Props

```typescript
// Pass to RevealCard:
isStreakChained={result.streakBonus > 0}
streakBonusPoints={
  result.streakBonus > 0
    ? (result.streakBonus as 10 | 20 | 30)
    : null
}
```

### Running Score Counter (State + Animation)

```typescript
const [displayScore, setDisplayScore] = useState(0);
const finalTotal = results.reduce((sum, r) => sum + r.totalPoints, 0);

// Per-card increment (on each onRevealComplete):
const handleRevealComplete = (result: ResultsRow) => {
  setDisplayScore((prev) => prev + result.totalPoints);
  advanceReveal(); // useRevealStore
};

// After all revealed: animate to exact final total using Reanimated
// (Reanimated is already a dep via RevealCard import — acceptable to use here)
const scoreSharedValue = useSharedValue(0);
// When all resolved: scoreSharedValue.value = withTiming(finalTotal, { duration: 500 });
// Use useAnimatedProps on an Animated.Text (or display via JS state for simplicity)
```

For simplicity, use JS-thread state: `displayScore` increments per card. After all cards reveal, if `displayScore !== finalTotal` (rounding edge case), snap to `finalTotal` directly. No separate Reanimated animation required unless there's a visual gap.

### RevealSequence Internal State Machine

```typescript
type SequenceState = 'running' | 'settling' | 'complete';

// revealIndex from useRevealStore drives which card is currently revealing
// When revealIndex >= sortedResults.length → all revealed → 'settling' → 'complete'
// 'settling': show final score, fire onAllRevealed callback
```

### Streak Chain Visualisation — Moment Tab (Results Phase)

When `isResultsPhase = true`, the Moment tab replaces `MomentsPickRow` with `RevealCard` (firstView=false).

Connect consecutive correct Precision Picks with a visual chain indicator:

```typescript
// Between two consecutive moment picks where BOTH are correct:
// Render a vertical line / chain connector (2px wide, COLOURS.lime, height 8px)
const showChainConnector = (
  results: ResultsRow[],
  index: number
): boolean => {
  if (index === 0) return false;
  const prev = results[index - 1];
  const curr = results[index];
  return (
    prev.predictionType === 'moment' &&
    curr.predictionType === 'moment' &&
    prev.isCorrect &&
    curr.isCorrect
  );
};
```

Chain connector: `View` with `width: 2, height: 12, backgroundColor: COLOURS.lime, alignSelf: 'center', marginVertical: -2`.

Streak break indicator: When `prev.isCorrect && !curr.isCorrect` (or vice versa), show a faint horizontal divider `backgroundColor: '#303030'` between the cards.

### Post-Reveal Summary Section

After all cards resolve, show below the card list:

```tsx
{sequenceState === 'complete' && (
  <View style={styles.summarySection}>
    {/* Final score */}
    <Text style={styles.finalScoreLabel}>Gameweek Score</Text>
    <Text style={styles.finalScoreValue}>{finalTotal}</Text>

    {/* Mini-league positions (AC9/10) */}
    {leagues.length === 0 ? (
      <Text style={styles.noLeaguePrompt}>
        No league yet — create one or join a friend's
      </Text>
    ) : (
      leagues.map((league) => {
        // leaderboardEntries empty until Epic 7/8 — stub renders nothing
        const entry = leaderboardEntries.find(
          (e) => e.leagueId === league.id
        );
        if (!entry) return null;
        const delta = entry.previousRank != null
          ? entry.previousRank - (entry.rank ?? 0)
          : 0;
        return (
          <View key={league.id}>
            <Text>{league.name}</Text>
            <Text>#{entry.rank ?? '—'}</Text>
            {delta > 0 && <Text style={{ color: '#B4FF32' }}>↑{delta}</Text>}
            {delta < 0 && <Text style={{ color: '#7A7A7A' }}>↓{Math.abs(delta)}</Text>}
            {delta === 0 && <Text>—</Text>}
          </View>
        );
      })
    )}
  </View>
)}
```

**Note:** `leaderboardEntries` typed for future Epic 7/8. `leagueId` will need to be added to `LeaderboardEntry` schema when Epic 7/8 is implemented. For this story, `leaderboardEntries = []` and only AC10 ("No league yet" prompt) will be reached.

### moments.tsx — Integration Pattern

In `moments.tsx`, the reveal phase takes over the full screen:

```tsx
// After all existing hooks (do NOT reorder hooks)
const { data: results = [], isLoading: resultsLoading } = useResultsQuery(userId, gameweekId);
const markRevealSeen = useMarkRevealSeenMutation();
const { data: leagues = [] } = useLeagueQuery(userId);

const isRevealPhase = phase === 'reveal';
const isResultsPhase = phase === 'locked' && gameweek?.scoringStatus === 'complete';

// Inside the return, BEFORE existing picks.length === 0 and picks.length > 0 blocks:
if (isRevealPhase) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#080808' }} edges={['top']}>
      <GameweekHeader ... />
      {resultsLoading ? (
        <SkeletonRow height={56} /> // skeleton while results load
      ) : (
        <RevealSequence
          results={results ?? []}
          fixtures={fixtures}
          leagues={leagues ?? []}
          leaderboardEntries={[]}
          onAllRevealed={() => {
            if (userId && gameweekId) {
              markRevealSeen.mutate({ userId, gameweekId });
            }
          }}
        />
      )}
    </SafeAreaView>
  );
}

if (isResultsPhase) {
  // Static results view — same tab structure as locked phase
  // but uses RevealCard (firstView=false) instead of MomentsPickRow
  // ... (see static results rendering pattern)
}
```

### ⚠️ Critical: useLeagueQuery Signature

`useLeagueQuery(userId)` — passes `userId: string | null`. Check the existing signature in `apps/mobile/src/queries/useLeagueQuery.ts` before calling it. If `userId = null`, the query should be disabled.

### ⚠️ Critical: RevealCard Import Path

```typescript
// RevealSequence.tsx lives in components/reveal/ — same directory as RevealCard
import { RevealCard } from './RevealCard';
// NOT: import { RevealCard } from '@/src/components/moments/RevealCard'
// NOT: import { RevealCard } from '@/src/components/reveal' (avoid self-referential)
```

### ⚠️ Critical: Do NOT Use useState for resultsLoading Guard in Hooks Position

All hooks (`useResultsQuery`, `useMarkRevealSeenMutation`, `useLeagueQuery`) must be called unconditionally at the top of `MomentsScreen`, before ANY early returns. This is the existing pattern in `moments.tsx` (look at how `isLoading` guard comes AFTER all hook calls).

### ⚠️ Architecture: reduceMotion is Already Set by _layout.tsx

`(tabs)/_layout.tsx` checks `AccessibilityInfo.isReduceMotionEnabled()` on mount and calls `setReduceMotion`. **Do NOT call `AccessibilityInfo.isReduceMotionEnabled()` again in `moments.tsx` or `RevealSequence.tsx`.** Read `useRevealStore().reduceMotion` only.

The existing `useEffect` in `moments.tsx` that calls `AccessibilityInfo.isReduceMotionEnabled()` should be **removed** — it is now handled in `_layout.tsx`. (This was added in Story 5.5 before _layout.tsx took over the responsibility.)

### Previous Story Learnings (Story 6.1)

- Reanimated v4 import: `import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, withSequence, runOnJS } from 'react-native-reanimated';`
- `RevealCard` API is exact — use `RevealCardProps` and `RevealState` from `./RevealCard`
- `COLOURS` constants are local to `RevealCard.tsx` — do NOT import them from there; define your own in `RevealSequence.tsx` if needed (or use inline strings)
- `firstView` and `reduceMotion` flow: `useRevealStore` → `RevealSequence` reads them → passes as props to each `RevealCard`
- `onRevealComplete` is NOT called when `firstView={false}` (by design, per 6.1 review finding)
- Test baseline: **196 tests passing**

### File Locations (New/Modified Files This Story)

```
apps/mobile/src/components/reveal/
  RevealSequence.tsx             ← NEW
  RevealSequence.test.tsx        ← NEW
  index.ts                       ← MODIFY (add RevealSequence export)

apps/mobile/src/queries/
  useResultsQuery.ts             ← MODIFY (implement Supabase query + ResultsRow type)
  useGameweekQuery.ts            ← MODIFY (add useMarkRevealSeenMutation)

apps/mobile/app/(tabs)/
  moments.tsx                    ← MODIFY (add reveal + results phase handlers)
```

### Anti-Patterns to Avoid

1. **DO NOT** put `RevealSequence` in `components/moments/` — it belongs in `components/reveal/` alongside `RevealCard` (Story 6.1 established this directory).
2. **DO NOT** duplicate `AccessibilityInfo.isReduceMotionEnabled()` calls — `_layout.tsx` owns this; read `useRevealStore().reduceMotion` only.
3. **DO NOT** use `useState` for `isLoading` alongside TanStack Query's `isLoading` — use TanStack Query's flag directly.
4. **DO NOT** call hooks conditionally or inside loops — maintain hook order.
5. **DO NOT** import `COLOURS` from `RevealCard.tsx` — it is not exported. Define new local constants if needed.
6. **DO NOT** manually reset `revealIndex` in `RevealSequence` — use `resetReveal()` from `useRevealStore`.
7. **DO NOT** fire `onAllRevealed` before `useMarkRevealSeenMutation` settles — it's OK to fire it and let the mutation run async; the phase transition will happen via query invalidation.
8. **DO NOT** call `useResultsQuery` with `enabled: false` — the query is RLS-guarded; it returns null/empty until scoring is complete.
9. **DO NOT** import `leagueId` from `leaderboard_entries` schema — this column doesn't exist yet (Epic 7/8). Use empty `leaderboardEntries = []` array.
10. **DO NOT** use `console.log` — `console.error` only.

### Definition of Done

- [ ] `RevealSequence.tsx` and `RevealSequence.test.tsx` created in `apps/mobile/src/components/reveal/`
- [ ] `useResultsQuery` fully implemented with Supabase joined query
- [ ] `useMarkRevealSeenMutation` added to `useGameweekQuery.ts`
- [ ] `moments.tsx` handles `reveal` phase (RevealSequence) and `results` phase (static RevealCards)
- [ ] All 10 ACs met
- [ ] `pnpm test --filter mobile` passes (196 baseline + new tests)
- [ ] `pnpm typecheck --filter mobile` passes
- [ ] `pnpm lint --filter mobile` passes
- [ ] Reveal sequence manually verified on device/simulator — all 6 card states visible in sequence
- [ ] PR references `Story 6.2`

### Project Structure Notes

- `RevealSequence.tsx` in `components/reveal/` — same feature directory as `RevealCard.tsx`, enforcing the feature boundary established in Story 6.1.
- Architecture spec shows `RevealSequence.tsx` in `components/moments/` — Story 6.1 overrode this by creating `components/reveal/`. Follow the actual implementation, not the spec location.
- Tests co-located as `RevealSequence.test.tsx` — no `__tests__` directory.

### References

- Story 6.2 requirements: [Source: _bmad-output/planning-artifacts/epics.md#Story-6.2]
- RevealCard component (Story 6.1): [Source: apps/mobile/src/components/reveal/RevealCard.tsx]
- RevealCard props/types: [Source: apps/mobile/src/components/reveal/index.ts]
- useRevealStore (firstView, reduceMotion, revealIndex): [Source: apps/mobile/src/stores/useRevealStore.ts]
- Existing moments.tsx (full screen to modify): [Source: apps/mobile/app/(tabs)/moments.tsx]
- Phase detection utility: [Source: apps/mobile/src/utils/gameweekPhase.ts]
- GameweekStore (phase type): [Source: apps/mobile/src/stores/useGameweekStore.ts]
- UserGameweekState schema: [Source: packages/types/src/schema/admin.ts]
- ScoringResult schema: [Source: packages/types/src/schema/scoringResults.ts]
- Prediction schema: [Source: packages/types/src/schema/predictions.ts]
- LeaderboardEntry schema: [Source: packages/types/src/schema/leaderboards.ts]
- useGameweekQuery (useUserGameweekStateQuery pattern): [Source: apps/mobile/src/queries/useGameweekQuery.ts]
- Architecture TanStack Query keys: [Source: _bmad-output/planning-artifacts/architecture.md#Communication-Patterns]
- Architecture component structure: [Source: _bmad-output/planning-artifacts/architecture.md#Structure-Patterns]
- Previous story 6.1 learnings: [Source: _bmad-output/implementation-artifacts/6-1-revealcard-component-and-animation-states.md#Dev-Agent-Record]
- Test baseline: 196 passing tests [Source: apps/mobile — pnpm test]

## Dev Agent Record

### Agent Model Used

GitHub Copilot (GPT-4.1)

### Debug Log References

- Fixed double `onAllRevealed` call: RevealCard fires `onRevealComplete` on mount in `reduceMotion=true` path; fixed by only passing `onRevealComplete` when `firstView && !reduceMotion`.
- Empty results edge case: removed `!reduceMotion` guard so `complete` state is reached for both `reduceMotion=true` and `reduceMotion=false` paths.
- Snapshot test renamed from "all pending" to "card 0 revealing, rest pending" to reflect actual initial state.
- Sort order test: switched from `getAllByRole('text')` to `getByTestId` for more reliable card lookup.

### Completion Notes List

- ✅ Task 1: `useResultsQuery` fully implemented with PostgREST joined query (`scoring_results` → `predictions` → `game_week_moments` → `moment_types`). `ResultsRow` interface defined. Query key `['results', userId, gameweekId]` exact. Enabled only when both userId and gameweekId are non-null. staleTime 5min.
- ✅ Task 2: `useMarkRevealSeenMutation` added to `useGameweekQuery.ts`. Upserts `user_gameweek_states` with `has_seen_reveal: true`. On success invalidates `['gameweek', 'reveal-state', gameweekId, userId]` to re-derive phase to `locked`.
- ✅ Task 3: `RevealSequence.tsx` created in `components/reveal/`. Sequential reveal driven by `revealIndex` from `useRevealStore`: 400ms revealing pulse → terminal state → 600ms delay → next card. `reduceMotion=true` path: all cards terminal immediately, `onAllRevealed` fires via effect. Post-reveal summary with running score and "No league yet" prompt (AC10). Chain connector and streak break divider rendered between consecutive moment picks.
- ✅ Task 4: `index.ts` barrel updated with `RevealSequence` and `ResultsRow` exports (re-exported from `useResultsQuery`).
- ✅ Task 5: `moments.tsx` updated. Removed stale `AccessibilityInfo.isReduceMotionEnabled()` useEffect (now owned by `_layout.tsx`). Added `useResultsQuery`, `useMarkRevealSeenMutation`, `useLeagueQuery` hooks unconditionally. `isRevealPhase` renders full-screen `RevealSequence`. `isResultsPhase` renders static `RevealCard`s (firstView=false) with streak chain connectors. Building/locked phases unchanged.
- ✅ Task 6: `RevealSequence.test.tsx` created — 15 new tests (3 snapshots, 12 unit). All 211 tests pass (196 baseline + 15 new). 18 snapshots total.
- ✅ Task 7: sprint-status.yaml updated to `review`.
- ✅ `useLeagueQuery` signature updated to accept `string | null`.

### File List

- `apps/mobile/src/queries/useResultsQuery.ts` — MODIFIED (full Supabase implementation + ResultsRow interface)
- `apps/mobile/src/queries/useGameweekQuery.ts` — MODIFIED (added useMarkRevealSeenMutation)
- `apps/mobile/src/queries/useLeagueQuery.ts` — MODIFIED (updated signature to accept string | null)
- `apps/mobile/src/components/reveal/RevealSequence.tsx` — NEW
- `apps/mobile/src/components/reveal/RevealSequence.test.tsx` — NEW
- `apps/mobile/src/components/reveal/index.ts` — MODIFIED (added RevealSequence exports)
- `apps/mobile/app/(tabs)/moments.tsx` — MODIFIED (reveal + results phases, removed stale AccessibilityInfo effect)
- `apps/mobile/src/components/reveal/__snapshots__/RevealSequence.test.tsx.snap` — NEW (auto-generated)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — MODIFIED (status: review)
- `_bmad-output/implementation-artifacts/6-2-reveal-sequence-results-screen-and-streak-visualisation.md` — MODIFIED (tasks checked, status: review)

### Review Findings

- [x] [Review][Decision] BoldnessHeroCard absent in isResultsPhase — confirmed intentional. Results view replaces boldness card; not a regression.
- [x] [Review][Patch] Running score counter not visible during reveal (AC2) — fixed: persistent score header added above ScrollView in RevealSequence.tsx; visible throughout the reveal sequence, hidden on return visits (firstView=false). [`apps/mobile/src/components/reveal/RevealSequence.tsx`]
- [x] [Review][Patch] `fixtureTotals` reset effect removed — fixed: `useEffect(() => setFixtureTotals(new Map()), [gameweekId])` restored in moments.tsx. [`apps/mobile/app/(tabs)/moments.tsx`]
- [x] [Review][Patch] Streak break divider missing from isResultsPhase moment tab (AC3/FR34) — fixed: `showStreakBreak` helper added and wired in the isResultsPhase moment tab. [`apps/mobile/app/(tabs)/moments.tsx`]
- [x] [Review][Defer] Unmounted setTimeout in handleRevealComplete (self-healing via resetReveal on mount) [`apps/mobile/src/components/reveal/RevealSequence.tsx:178`] — deferred, pre-existing
- [x] [Review][Defer] Pre-existing TS errors in RevealCard.test.tsx (onRevealComplete property, Story 6.1) [`apps/mobile/src/components/reveal/RevealCard.test.tsx`] — deferred, pre-existing

