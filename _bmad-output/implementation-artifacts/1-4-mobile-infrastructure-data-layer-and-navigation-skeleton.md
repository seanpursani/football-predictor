# Story 1.4: Mobile Infrastructure — Data Layer & Navigation Skeleton

Status: ready-for-dev

## Story

As a **developer**,
I want the Supabase client, TanStack Query, Zustand stores, and Expo Router screen structure initialized,
So that all mobile screens have a working data layer and navigation skeleton ready to build on.

## Acceptance Criteria

1. **Given** `lib/supabase.ts` is the sole Supabase client initialization point **When** any hook or screen imports the client **Then** it imports only from `lib/supabase.ts` — no other Supabase client initializations exist in the codebase.

2. **Given** `QueryClientProvider` wraps the root layout in `app/_layout.tsx` **When** a screen uses a TanStack Query hook **Then** it resolves against the shared `QueryClient` with no parallel local `isLoading` state created.

3. **Given** three Zustand stores are created: `useGameweekStore`, `useBuildStore`, `useRevealStore` **When** a component imports from any store **Then** each store holds only client UI state — no server data is duplicated from the TanStack Query cache **And** each store lives in its own file under `src/stores/`.

4. **Given** the Expo Router file structure is initialized per the Architecture directory spec **When** the app navigates **Then** `(tabs)/build.tsx`, `(tabs)/moments.tsx`, `(tabs)/leagues.tsx`, `(tabs)/profile.tsx` exist as working placeholder screens **And** `catalog/[fixtureId].tsx`, `microflow/player.tsx`, `microflow/timing.tsx`, `onboarding.tsx` exist as placeholder screens **And** all screens render without crashing and the tab bar navigates correctly between tabs.

## Tasks / Subtasks

- [ ] Task 1: Install TanStack Query and Zustand (AC: #2, #3)
  - [ ] `pnpm add @tanstack/react-query` in `apps/mobile`
  - [ ] `pnpm add zustand` in `apps/mobile`
  - [ ] `pnpm add @supabase/supabase-js expo-secure-store` in `apps/mobile`
  - [ ] Verify all packages resolve without peer dependency errors

- [ ] Task 2: Create Supabase client singleton (AC: #1)
  - [ ] Create `apps/mobile/src/lib/supabase.ts`
  - [ ] Initialize `createClient()` with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` from `expo-constants` or `process.env`
  - [ ] Configure `expo-secure-store` as the storage adapter for auth token persistence
  - [ ] Export a single `supabase` instance — this is the **only** Supabase client initialization in the entire codebase
  - [ ] Add `.env.local` with placeholder values for local dev (gitignored)

- [ ] Task 3: Set up QueryClientProvider in root layout (AC: #2)
  - [ ] Create `apps/mobile/src/lib/queryClient.ts` — export a configured `QueryClient` instance
  - [ ] Default options: `staleTime: 5 * 60 * 1000` (5 min), `retry: 2`
  - [ ] Wrap root layout in `<QueryClientProvider client={queryClient}>` in `app/_layout.tsx`
  - [ ] Import `QueryClientProvider` from `@tanstack/react-query`

- [ ] Task 4: Create three Zustand stores (AC: #3)
  - [ ] Create `apps/mobile/src/stores/useGameweekStore.ts`
    - State: `phase: 'building' | 'locked' | 'reveal' | null`, `currentGameweekId: number | null`
    - Actions: `setPhase()`, `setCurrentGameweekId()`
  - [ ] Create `apps/mobile/src/stores/useBuildStore.ts`
    - State: `expandedFixtureId: number | null`, `unsavedPicks: []` (local pick staging)
    - Actions: `setExpandedFixtureId()`, `resetBuildState()`
  - [ ] Create `apps/mobile/src/stores/useRevealStore.ts`
    - State: `firstView: boolean`, `reduceMotion: boolean`, `revealIndex: number`
    - Actions: `setFirstView()`, `setReduceMotion()`, `advanceReveal()`, `resetReveal()`
  - [ ] **Anti-pattern guard:** No store imports server data — stores hold UI state only

- [ ] Task 5: Create tab navigation layout with 4 tabs (AC: #4)
  - [ ] Replace existing `app/(tabs)/_layout.tsx` with 4-tab layout: Build, Moments, Leagues, Profile
  - [ ] Tab icons: use `@expo/vector-icons` (Ionicons or MaterialCommunityIcons)
  - [ ] Tab bar styling: `bg-primary` (#080808) background, `accent` (#B4FF32) active tint, `text-muted` (#404040) inactive tint
  - [ ] Remove existing `index.tsx` and `explore.tsx` from `(tabs)/`

- [ ] Task 6: Create tab screen placeholders (AC: #4)
  - [ ] Create `app/(tabs)/build.tsx` — placeholder: "Build View" text, `bg-primary` background
  - [ ] Create `app/(tabs)/moments.tsx` — placeholder: "Moments View" text
  - [ ] Create `app/(tabs)/leagues.tsx` — placeholder: "Leagues" text
  - [ ] Create `app/(tabs)/profile.tsx` — placeholder: "Profile" text
  - [ ] Each screen uses `SafeAreaView` and renders the screen name in `text-primary` (#FFFFFF) on `bg-primary` (#080808)

- [ ] Task 7: Create stack screen placeholders (AC: #4)
  - [ ] Create `app/catalog/[fixtureId].tsx` — placeholder showing fixture ID from route params
  - [ ] Create `app/microflow/_layout.tsx` — stack layout for the micro-flow screens
  - [ ] Create `app/microflow/player.tsx` — placeholder: "Player Selection"
  - [ ] Create `app/microflow/timing.tsx` — placeholder: "Timing & Zone"
  - [ ] Create `app/onboarding.tsx` — placeholder: "Onboarding"
  - [ ] Register all stack screens in `app/_layout.tsx` Stack navigator

- [ ] Task 8: Create empty TanStack Query hook stubs (AC: #2)
  - [ ] Create `apps/mobile/src/queries/useGameweekQuery.ts` — stub returning placeholder, key: `['gameweek', 'current']`
  - [ ] Create `apps/mobile/src/queries/useCatalogQuery.ts` — stub, key: `['catalog', fixtureId]`
  - [ ] Create `apps/mobile/src/queries/useSquadQuery.ts` — stub, key: `['squad', userId, gameweekId]`
  - [ ] Create `apps/mobile/src/queries/useResultsQuery.ts` — stub, key: `['results', userId, gameweekId]`
  - [ ] Create `apps/mobile/src/queries/useLeaderboardQuery.ts` — stub, key: `['leaderboard', 'global', gameweekId]`
  - [ ] Create `apps/mobile/src/queries/useLeagueQuery.ts` — stub, key: `['mini-leagues', userId]`
  - [ ] Each stub uses `useQuery` with `enabled: false` and returns typed placeholder data matching `@lecolpo/types`

- [ ] Task 9: Write tests (AC: #1, #2, #3, #4)
  - [ ] Test Supabase client exports a single instance
  - [ ] Test each Zustand store initializes with correct default state
  - [ ] Test store actions update state correctly
  - [ ] Test that no store contains server data properties
  - [ ] Smoke test: all screen files exist and export a default component
  - [ ] Verify existing tests still pass (15 tests from Stories 1.1–1.3)

## Dev Notes

### Package Installation

```bash
cd apps/mobile
pnpm add @tanstack/react-query zustand @supabase/supabase-js expo-secure-store
```

**Versions to use:** Latest stable of each. At time of writing:
- `@tanstack/react-query` v5.x (React Query v5)
- `zustand` v5.x
- `@supabase/supabase-js` v2.x
- `expo-secure-store` — use Expo SDK 54 compatible version (install via `npx expo install expo-secure-store`)

Use `npx expo install` for `expo-secure-store` to ensure SDK 54 compatibility.

### Supabase Client Setup

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS !== 'web' ? ExpoSecureStoreAdapter : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

**Critical:** This is the ONLY place `createClient` is called. Every other file imports `supabase` from here.

### QueryClient Configuration

```typescript
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
    },
  },
});
```

### Root Layout Modification

The existing `app/_layout.tsx` must be updated to wrap content in `QueryClientProvider`. Keep the existing `ThemeProvider` and font loading logic — add the query provider as an outer wrapper.

```tsx
// Add to existing _layout.tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/src/lib/queryClient';

// In the return:
<QueryClientProvider client={queryClient}>
  <ThemeProvider value={NavigationTheme}>
    {/* existing Stack + StatusBar */}
  </ThemeProvider>
</QueryClientProvider>
```

### Zustand Store Pattern

Each store follows this exact pattern — one store per domain, UI state only:

```typescript
// src/stores/useGameweekStore.ts
import { create } from 'zustand';

type GameweekPhase = 'building' | 'locked' | 'reveal' | null;

interface GameweekStoreState {
  phase: GameweekPhase;
  currentGameweekId: number | null;
  setPhase: (phase: GameweekPhase) => void;
  setCurrentGameweekId: (id: number | null) => void;
}

export const useGameweekStore = create<GameweekStoreState>((set) => ({
  phase: null,
  currentGameweekId: null,
  setPhase: (phase) => set({ phase }),
  setCurrentGameweekId: (id) => set({ currentGameweekId: id }),
}));
```

**Anti-patterns to reject:**
- No `gameweek` object in the store (that's server data → TanStack Query)
- No `isLoading` in Zustand (use TanStack Query's `isPending`)
- No `useEffect` + `fetch` patterns — use TanStack Query hooks

### TanStack Query Key Conventions

Use **exactly** these key structures from the architecture — do not invent new keys:

```typescript
['gameweek', 'current']
['catalog', fixtureId]
['squad', userId, gameweekId]
['leaderboard', 'global', gameweekId]
['leaderboard', 'mini-league', leagueId, gameweekId]
['leaderboard', 'global', 'season']
['results', userId, gameweekId]
['mini-leagues', userId]
```

### Query Hook Stub Pattern

```typescript
// src/queries/useGameweekQuery.ts
import { useQuery } from '@tanstack/react-query';
import type { Gameweek } from '@lecolpo/types';

export function useGameweekQuery() {
  return useQuery<Gameweek | null>({
    queryKey: ['gameweek', 'current'],
    queryFn: async () => {
      // TODO: Implement Supabase fetch in Epic 5
      return null;
    },
    enabled: false, // Disabled until implementation
  });
}
```

### Tab Navigation Layout

Replace existing `(tabs)/_layout.tsx` with 4 tabs. Remove `index.tsx` and `explore.tsx` (Expo starter files).

Tab configuration:
| Tab | File | Icon | Label |
|-----|------|------|-------|
| Build | `build.tsx` | `construct-outline` | Build |
| Moments | `moments.tsx` | `flash-outline` | Moments |
| Leagues | `leagues.tsx` | `trophy-outline` | Leagues |
| Profile | `profile.tsx` | `person-outline` | Profile |

Tab bar styles: dark background matching `bg-primary` (#080808), active tint `#B4FF32` (lime), inactive tint `#404040` (muted).

### Screen Registration

The root `app/_layout.tsx` Stack needs to register:
- `(tabs)` — tab group (already registered)
- `onboarding` — standalone screen
- `catalog/[fixtureId]` — dynamic route for moment catalog
- `microflow` — stack group for player/timing screens
- `modal` — can be removed or kept

### Expo Router File Structure (Target State)

```
app/
  _layout.tsx              ← Root Stack (modified)
  onboarding.tsx           ← NEW: placeholder
  modal.tsx                ← existing (can keep or remove)
  (tabs)/
    _layout.tsx            ← MODIFIED: 4-tab layout
    build.tsx              ← NEW: Build View placeholder
    moments.tsx            ← NEW: Moments View placeholder
    leagues.tsx            ← NEW: Leagues placeholder
    profile.tsx            ← NEW: Profile placeholder
  catalog/
    [fixtureId].tsx        ← NEW: Moment Catalog placeholder
  microflow/
    _layout.tsx            ← NEW: Stack layout for micro-flow
    player.tsx             ← NEW: Player selection placeholder
    timing.tsx             ← NEW: Timing & Zone placeholder
```

### Environment Variables

Create `apps/mobile/.env.local` (gitignored):
```
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=<local-anon-key-from-supabase-start>
```

The Supabase client must not crash if these are undefined during tests — guard with a null check or provide test defaults.

### Project Structure Notes

**Files to create:**
```
apps/mobile/
  .env.local                           ← NEW: env vars (gitignored)
  src/
    lib/
      supabase.ts                      ← NEW: Supabase client singleton
      queryClient.ts                   ← NEW: QueryClient config
    stores/
      useGameweekStore.ts              ← NEW: gameweek phase state
      useBuildStore.ts                 ← NEW: build session state
      useRevealStore.ts                ← NEW: reveal sequence state
    queries/
      useGameweekQuery.ts              ← NEW: stub
      useCatalogQuery.ts               ← NEW: stub
      useSquadQuery.ts                 ← NEW: stub
      useResultsQuery.ts               ← NEW: stub
      useLeaderboardQuery.ts           ← NEW: stub
      useLeagueQuery.ts                ← NEW: stub
  app/
    _layout.tsx                        ← MODIFIED: add QueryClientProvider + new screens
    onboarding.tsx                     ← NEW: placeholder
    (tabs)/
      _layout.tsx                      ← MODIFIED: 4-tab layout
      build.tsx                        ← NEW: placeholder
      moments.tsx                      ← NEW: placeholder
      leagues.tsx                      ← NEW: placeholder
      profile.tsx                      ← NEW: placeholder
    catalog/
      [fixtureId].tsx                  ← NEW: placeholder
    microflow/
      _layout.tsx                      ← NEW: stack layout
      player.tsx                       ← NEW: placeholder
      timing.tsx                       ← NEW: placeholder
```

**Files to MODIFY:**
- `app/_layout.tsx` — add `QueryClientProvider`, register new Stack screens
- `app/(tabs)/_layout.tsx` — replace with 4-tab layout

**Files to DELETE:**
- `app/(tabs)/index.tsx` — Expo starter file, replaced by `build.tsx`
- `app/(tabs)/explore.tsx` — Expo starter file, replaced by real tabs

**Do NOT touch:**
- `packages/types/` — no changes (Story 1.3 artifact)
- `tailwind.config.js` — no changes (Story 1.2 artifact)
- `apps/supabase/` — no changes (Story 1.3 artifact)
- `src/lib/fonts.ts` — keep as-is (Story 1.2 artifact)
- `src/lib/typography.ts` — keep as-is (Story 1.2 artifact)
- `constants/theme.ts` — keep as-is (Story 1.2 artifact)

### Previous Story Intelligence (Story 1.3)

**Key learnings:**
- Jest 29.7.0 required (not Jest 30) — jest-expo incompatibility
- `transformIgnorePatterns` already configured for pnpm `.pnpm` symlink structure
- `@lecolpo/types` workspace dependency already in `apps/mobile/package.json`
- `app.json` deleted — `app.config.ts` is the Expo config
- Dark mode only — `DarkTheme` always, `NavigationTheme` lives in `constants/theme.ts`
- Fonts loaded via `FONT_MAP` in `src/lib/fonts.ts`
- 15 existing tests passing (theme + typography tests)
- Docker required for `supabase start` — may not be running during dev
- Migration files: `0000_worthless_naoko.sql` (schema), `0001_rls_policies.sql` (RLS skeleton)

**Existing path aliases:** `@/` maps to `apps/mobile/` root (configured in `tsconfig.json`)

### Architecture Compliance Requirements

- **State management:** TanStack Query for ALL server state; Zustand for client UI state ONLY — per AR8
- **Supabase client:** Single initialization in `lib/supabase.ts` — per architecture boundary rules
- **Query keys:** Use exactly the defined key structures — per architecture communication patterns
- **Store naming:** `use{Domain}Store` — per AR17 naming conventions
- **Query hook naming:** `use{Entity}Query` / `use{Action}Mutation` — per AR17
- **File naming:** Component files `PascalCase.tsx`, utility/hook files `camelCase.ts`, screen files `kebab-case.tsx` — per AR17
- **No `console.log`** in production code — per architecture enforcement guidelines
- **No `useState` for server data** — anti-pattern per architecture
- **No `useEffect` + `fetch`** — use TanStack Query
- **Co-located tests** — `*.test.ts` next to source files

### Scope Boundary

| Concern | Belongs To |
|---|---|
| Auth flow (Apple/Google login) | Story 2.1 |
| RLS deadline-aware policies | Story 2.4 |
| App state machine (phase detection on foreground) | Story 5.1 |
| Actual query implementations (real data fetching) | Epic 5+ |
| Sentry error monitoring | Story 1.5 |
| CI/CD pipeline | Story 1.5 |

### References

- [Source: epics.md#Story 1.4] — Full acceptance criteria
- [Source: architecture.md#Mobile Architecture] — TanStack Query + Zustand split
- [Source: architecture.md#Communication Patterns] — TanStack Query key conventions
- [Source: architecture.md#Naming Patterns] — TypeScript naming conventions
- [Source: architecture.md#Complete Project Directory Structure] — Screen and store file locations
- [Source: architecture.md#Enforcement Guidelines] — Anti-patterns to reject
- [Source: architecture.md#Architectural Boundaries] — Supabase client singleton rule
- [Source: ux-design-specification.md#Design Direction Decision] — Build View / Moments View split, 4 tabs

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

