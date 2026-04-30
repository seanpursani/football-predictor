---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-04-27'
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/ux-design-specification.md'
  - '_bmad-output/brainstorming/brainstorming-session-2026-04-20.md'
workflowType: 'architecture'
project_name: 'LeColpo'
user_name: 'sean'
date: '2026-04-27'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**

53 FRs across 10 capability domains:

| Domain | FRs | Architectural implication |
|---|---|---|
| Account & Identity | FR1–3 | OAuth 2.0 social login (Apple, Google); push notification permission state |
| Gameweek Lifecycle | FR4–10 | Automated jobs: odds fetch + lock, catalog generation, event ingestion, scoring trigger |
| Match Builder | FR11–22 | Two prediction types with distinct input schemas; 20-token quota enforcement; captain logic |
| Scoring Engine | FR23–30 | Multi-layer additive scoring; cross-match streak ordering by real-world event time; captain 2x; zero-error tolerance |
| Score Reveal | FR31–34 | Reveal state gated on scoring completion; per-moment breakdown storage required |
| Leaderboards | FR35–37 | Weekly + cumulative season aggregation; mini-league scoped queries; rank + score display |
| Mini-Leagues | FR38–43 | Create/join via invite link; deep link survival through App Store install; multi-league membership |
| Onboarding | FR44–45 | Single-screen 5-rule tutorial; <60 second completion |
| Push Notifications | FR46–47 | Two system-triggered events (Match Builder open, results ready); APNs/FCM via Expo Notifications |
| Admin & Operations | FR48–53 | Gameweek status dashboard; manual rescore; match void; user score investigation; error monitoring |

**Non-Functional Requirements:**

| NFR Area | Key Constraints |
|---|---|
| **Performance** | <2s Match Builder load; <200ms catalog filtering (client-side); <1s squad submit; <3s reveal render with full 20-token breakdown; leaderboard <2s for up to 1000 global + 100 mini-league |
| **Security** | TLS 1.2+; OAuth 2.0 short-lived tokens; raw odds never exposed (point values only); user predictions private before deadline; admin elevated auth |
| **Scalability** | 10,000 concurrent users during Match Builder window; scoring of all users within 5 minutes of final whistle; full 38-gameweek season of data at scale |
| **Integration** | Odds API: 4hr downtime tolerance, retry with exponential backoff; Match Events API: 2hr delay tolerance before manual flag; APNs/FCM: best-effort delivery |
| **Reliability** | Zero scoring errors (halt + alert on detection); predictions persisted immediately on submission (no data loss); 99% automated gameweek lifecycle; postponed match handling without corrupting other data |

**Scale & Complexity:**

- Primary domain: Full-stack — cross-platform mobile client + serverless backend API + scheduled/event-driven jobs + external API integrations
- Complexity level: Medium (scoring engine and lifecycle automation are the high-complexity cores; mobile client is well-scoped)
- Estimated architectural components: ~8

### Technical Constraints & Dependencies

**Pre-decided (from UX Specification):**
- **Mobile framework:** React Native + Expo (managed workflow) + NativeWind v4 (Tailwind CSS)
- **Navigation:** Expo Router (file-based, Universal Links / App Links deep link support)
- **Animation:** react-native-reanimated (RevealCard only)
- **Share graphic:** react-native-view-shot + expo-sharing
- **Push notifications:** Expo Notifications (unified APNs/FCM)
- **Haptics:** expo-haptics
- **Build & deployment:** Expo EAS

**Resource model:**
- Solo developer — serverless backend to minimise ops overhead
- No offline mode — fully online, thin client
- Target app size <50MB
- Dark mode only, portrait only, phones only (iOS 15+ / Android 10+)

**External dependencies:**
- Betting odds API (provider TBD — The Odds API, API-Football, BetFair options noted in PRD)
- Match events API (goals, cards, subs, corners — player + minute — provider TBD)
- Apple Sign-In
- Google Sign-In
- APNs (Apple Push Notification service)
- FCM (Firebase Cloud Messaging)

### Cross-Cutting Concerns Identified

1. **Gameweek state machine** — the app's entire behaviour (what screens show, what API actions are permitted, when the reveal triggers) derives from a single lifecycle signal: Building / Locked+Live / Reveal. Must be a first-class architectural concept propagated from the backend.

2. **External API resilience** — both the Odds API and Match Events API are on the critical path with explicit failure-tolerance requirements. Retry logic, caching, and manual override tooling are mandatory, not optional.

3. **Scoring engine accuracy** — zero-tolerance for errors. Complex multi-layer scoring (event + timing + player bonuses + streak + captain 2x), cross-match streak ordering by real-world event time. Must be tested exhaustively with historical data before launch.

4. **Authentication & prediction privacy** — API must enforce that predictions are not readable by other users before the gameweek deadline, regardless of client behaviour.

5. **Async job scheduling** — three automated jobs: (a) odds fetch + lock at Match Builder window open, (b) match event ingestion post-match, (c) scoring engine trigger after final whistle. These must be reliable and observable.

6. **Historical data accumulation** — match event data ingested for scoring is simultaneously the data source for historical ✓/✗ context hints on moment cards. The event storage schema must support both purposes from the start.

7. **Deep link integrity** — mini-league invite links must survive App Store installation flow. Requires Universal Links (iOS) and App Links (Android) configuration on both the mobile and backend layers.

8. **Push notification delivery** — two system-triggered notification types, coupled to the gameweek lifecycle state transitions.

## Starter Template Evaluation

### Primary Technology Domain

Full-stack: cross-platform mobile client (iOS/Android) + serverless backend API + scheduled jobs.
Mobile stack pre-decided by UX Specification. Backend stack decided in this step.

### Starter Options Considered

| Option | Assessment |
|---|---|
| `create-expo-app` + Supabase | **Selected** — PostgreSQL suits complex scoring queries; pg_cron handles lifecycle jobs; RLS enforces prediction privacy; Supabase Auth covers Apple/Google OAuth; single-platform solo dev ops |
| create-t3-turbo (Expo + Next.js + tRPC) | Too heavy — brings Next.js web app (out of MVP scope); NativeWind v5 preview only |
| `create-expo-app` + Hono/Cloudflare Workers + D1 | SQLite (D1) less suited to cross-match streak queries and leaderboard aggregation than PostgreSQL |
| `create-expo-app` + standalone Node.js API | Higher ops overhead for solo developer; no managed infra |

### Selected Approach

**Mobile:** `create-expo-app` with Expo SDK 54/55 + NativeWind v4
**Backend:** Supabase (PostgreSQL + Edge Functions + pg_cron + Auth + RLS)
**Structure:** Lightweight pnpm monorepo — no framework overhead, just shared types

### Initialization Commands

```bash
# Monorepo root
mkdir LeColpo && cd LeColpo
pnpm init
# Configure pnpm-workspace.yaml

# Mobile app
cd apps
npx create-expo-app@latest mobile --template default
cd mobile
npx expo install nativewind react-native-reanimated react-native-safe-area-context
npx expo install expo-haptics expo-sharing
npm install --save-dev tailwindcss@^3.4

# Supabase project
# brew install supabase/tap/supabase
cd ../supabase
supabase init

# Shared types package
mkdir -p ../packages/types && cd ../packages/types
pnpm init
```

### Architectural Decisions Provided by This Approach

**Language & Runtime:**
- TypeScript throughout — mobile app, Edge Functions (Deno), shared types package
- Expo SDK 54 (stable, Expo Go compatible for physical device testing during development)

**Styling Solution:**
- NativeWind v4.2.3 (production-stable) with Tailwind CSS v3.4
- Configured in `tailwind.config.js` with NativeWind's React Native preset

**Build Tooling:**
- Expo EAS for mobile builds and App Store / Play Store submissions
- Supabase CLI for Edge Function deployment and database migrations
- Metro bundler (Expo default) for mobile development

**Testing Framework:**
- Mobile: Jest + React Native Testing Library (Expo default)
- Backend: Supabase local development stack (`supabase start`) for integration testing against local PostgreSQL

**Code Organisation:**
- Monorepo: `apps/mobile`, `apps/supabase`, `packages/types`
- Shared types in `packages/types` — Prediction, GameweekState, ScoringResult, MomentCard interfaces
- Expo Router file-based navigation in `apps/mobile/app/`
- Supabase Edge Functions in `apps/supabase/functions/`
- Database migrations in `apps/supabase/migrations/`

**Development Experience:**
- Expo Go for rapid mobile iteration on physical devices
- `supabase start` for full local backend (PostgreSQL + Auth + Edge Functions)
- Hot reload in both mobile and Edge Functions
- Shared TypeScript types eliminate runtime type mismatches between client and API

**Note:** Project initialization using these commands should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Data layer: Drizzle ORM on Supabase PostgreSQL
- API communication: Supabase JS client as primary layer + Edge Functions for complex ops
- Prediction privacy: RLS policies at database layer
- Mobile state: TanStack Query (server state) + Zustand (client state)
- Gameweek state machine: fetch-on-foreground for MVP

**Important Decisions (Shape Architecture):**
- Admin auth: Supabase custom JWT claims (admin role)
- Error monitoring: Sentry on mobile + Edge Functions
- Leaderboard strategy: materialised results post-scoring (not live aggregation)
- Historical data: single `match_events` table serves scoring + historical stat dots
- CI/CD: GitHub Actions + Expo EAS + Supabase CLI

**Deferred Decisions (Post-MVP):**
- Admin web dashboard (could be Next.js or extended Supabase Studio)
- Supabase Realtime subscriptions for live scoring
- Supabase Vault for secret management (replacing env vars)
- CDN/edge caching for high-scale leaderboard reads

### Data Architecture

**ORM: Drizzle ORM**
- TypeScript schema definitions are the single source of truth for database structure
- Schema types flow directly into `packages/types` — shared between mobile and Edge Functions
- `drizzle-kit` handles migrations; migration files committed to `apps/supabase/migrations/`
- Runs cleanly in Deno (Edge Functions) — no Node.js dependency issues
- Rationale over Prisma: Prisma is Node.js-optimised and heavy for Deno Edge Functions
- Rationale over raw SQL: typed query results eliminate a class of runtime errors in the scoring engine

**Caching Strategy:**
- Moment catalog: cached in Supabase DB after odds lock; TanStack Query session cache on mobile (no re-fetch mid-session)
- Leaderboards: stored as materialised rows updated by the scoring engine post-gameweek — never computed on-demand from raw predictions
- No external cache (Redis etc.) needed for MVP at projected scale

**Historical Match Event Storage:**
- Single `match_events` table: `(match_id, event_type, player_id, minute, team_id, created_at)`
- Serves double duty: scoring engine joins against it; historical ✓/✗ dots query it by match + event_type + team
- Progressive richness: early season has sparse data, accumulates meaningfully by mid-season — no filler needed

**Migration Approach:**
- `drizzle-kit generate` produces SQL migration files
- Applied via `supabase db push` in local dev; GitHub Actions runs migrations before Edge Function deploy in CI

### Authentication & Security

**Social Login via Supabase Auth:**
- `@supabase/supabase-js` + `expo-secure-store` for token persistence on device
- Supabase Auth handles Apple Sign-In and Google Sign-In OAuth flows natively
- Short-lived access tokens with automatic refresh — client SDK handles transparently

**Prediction Privacy — Row Level Security:**
- RLS policy on `predictions` table: users can only SELECT their own rows; other users' rows invisible before deadline
- Policy switches post-deadline (first kickoff timestamp stored on `gameweeks` table): all rows become readable after deadline passes
- Database-layer enforcement — cannot be bypassed by any client code or API route

**Admin Authentication:**
- Supabase custom JWT claims: admin users carry `role: 'admin'` in their JWT
- Edge Functions performing admin operations (rescore, void match, score breakdown) check claim before executing
- No service-role key exposed to any client application
- Admin users created manually via Supabase dashboard (low frequency — solo dev context)

**External API Key Management:**
- Odds API and Match Events API keys stored as Supabase Edge Function secrets (`supabase secrets set`)
- Never exposed in client bundle or repository
- Mobile app never receives or handles external API keys directly

### API & Communication Patterns

**Primary Communication: Supabase JS Client**
- Mobile app uses `@supabase/supabase-js` for all CRUD operations (read gameweek, submit squad, fetch leaderboard)
- RLS policies apply automatically — client inherits user's permissions via JWT
- `supabase.functions.invoke()` for complex operations: scoring engine trigger, odds ingestion, manual rescore, Quick Pick generation

**Edge Functions (Complex Operations Only):**
- `functions/ingest-odds` — fetch + lock odds from external API, populate moment catalog
- `functions/ingest-events` — fetch match events post-match, store in `match_events`
- `functions/run-scoring` — execute scoring engine across all user predictions for a gameweek
- `functions/send-notifications` — trigger APNs/FCM push via Expo Push API
- `functions/admin-rescore` — admin-only manual rescore trigger
- Each function returns `{ data, error }` consistent with Supabase client convention

**Error Handling Standard:**
- Edge Functions return `{ error: { code: string, message: string, details?: unknown } }` on failure
- Mobile surfaces transient errors as non-blocking bottom toast ("Couldn't save — tap to retry", auto-dismiss 4s)
- Scoring engine errors halt reveal and insert a record into `scoring_errors` table; Sentry alert fires immediately
- No blocking error modals for transient failures

**Rate Limiting:**
- Supabase Auth endpoints: built-in rate limiting (no config needed)
- External API calls (odds, match events): exponential backoff in Edge Functions (max 3 retries, 2× delay)
- No API gateway needed for MVP — Supabase handles connection limits at scale

### Mobile Architecture

**Server State: TanStack Query (React Query for React Native)**
- Manages all async data: moment catalog, user squad, leaderboards, results, mini-league membership
- Cache-first reads during Match Builder session — moment catalog never re-fetches mid-build
- Optimistic updates on squad submission — pick appears on fixture card instantly, syncs in background
- Stale-while-revalidate for leaderboards — shows last known rank immediately, refreshes in background

**Client State: Zustand**
- Manages local UI state: current gameweek phase (Building/Locked/Reveal), modal visibility, micro-flow step state
- Single store, no boilerplate — fits the solo dev model
- Gameweek phase derived from server data on app foreground, stored in Zustand for synchronous reads across components

**Gameweek State Machine:**
- Authoritative state lives in `gameweeks` table (Supabase)
- Mobile fetches current gameweek record on every app foreground (`AppState` change listener)
- Phase derived: `now < first_kickoff` → Building; `first_kickoff ≤ now < last_final_whistle` → Locked; `scoring_complete = true AND !reveal_seen` → Reveal
- `reveal_seen` flag stored per-user in Supabase — prevents re-triggering reveal animation on subsequent opens
- No realtime subscription for MVP — foreground fetch is sufficient for the UX (transitions are once-per-gameweek events)

**Navigation (confirmed from UX spec):**
- Expo Router file-based routing
- Stack navigation: Build View → Moment Catalog → Micro-flow Step 1 → Step 2
- Tab navigation: Moments View (Match | Moment tabs) — no swipe between tabs
- Save/Edit toggle between Build View and Moments View (not a navigation stack — no back gesture)

### Infrastructure & Deployment

**CI/CD Pipeline:**
- GitHub Actions on push to `main`:
  1. Run mobile tests (`jest`)
  2. Run `supabase db push` (apply pending migrations to production)
  3. Deploy Edge Functions (`supabase functions deploy --all`)
  4. Trigger Expo EAS build (production channel)
- PR builds: Expo EAS Preview channel for mobile testing

**Error Monitoring: Sentry**
- `@sentry/react-native` on mobile — catches JS errors, native crashes, slow renders
- Sentry Deno SDK on Edge Functions — catches scoring engine errors, ingestion failures
- Single Sentry project, two environments (mobile, edge-functions)
- Scoring engine errors configured as high-priority alerts (zero-tolerance requirement)

**Environment Configuration:**

| Layer | Config mechanism |
|---|---|
| Mobile (client-safe) | `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `app.config.ts` |
| Mobile (build-time secrets) | Expo EAS Secrets (not in repo) |
| Edge Functions | `supabase secrets set KEY=VALUE` (Supabase managed) |
| Local dev | `.env.local` (gitignored) + `supabase/.env` for local Supabase stack |

**Scheduled Jobs (Supabase pg_cron):**

| Job | Trigger | Function invoked |
|---|---|---|
| Odds lock | Configurable schedule (~3-4 days before first kickoff) | `ingest-odds` |
| Match event ingestion | After each match final whistle (configurable per fixture) | `ingest-events` |
| Scoring engine | After last match of gameweek complete | `run-scoring` → `send-notifications` |

All three jobs observable via Supabase dashboard logs + Sentry Edge Function monitoring.

### Decision Impact Analysis

**Implementation Sequence (dependencies):**
1. Monorepo scaffold + Drizzle schema in `packages/types` — everything else depends on shared types
2. Supabase project setup: Auth, RLS policies, pg_cron jobs
3. Edge Functions: `ingest-odds` → `ingest-events` → `run-scoring` (in dependency order)
4. Mobile: Supabase JS client + TanStack Query + Zustand setup → Build View → Moment Catalog → Micro-flow
5. Mobile: Moments View + RevealCard sequence
6. Mobile: Mini-leagues + Leaderboards
7. CI/CD pipeline + Sentry

**Cross-Component Dependencies:**
- Drizzle schema → shared types → Edge Functions + mobile app (all consume same TypeScript interfaces)
- `gameweeks.first_kickoff` timestamp → RLS deadline policy + mobile state machine + DeadlineStrip component
- Scoring engine correctness → leaderboard materialisation → reveal screen data (sequential dependency)
- `match_events` table → scoring engine → historical stat dots (same data, two consumers)
- Supabase Auth JWT → RLS policies + admin role check + mobile session (single auth system, multiple consumers)

## Implementation Patterns & Consistency Rules

### Conflict Points Identified

13 areas where AI agents could make different choices without explicit rules — all addressed below.

### Naming Patterns

**Database Naming Conventions:**

| Item | Convention | Example |
|---|---|---|
| Table names | plural `snake_case` | `game_weeks`, `match_events`, `predictions`, `mini_leagues` |
| Column names | `snake_case` | `user_id`, `created_at`, `is_correct`, `gameweek_id` |
| Foreign keys | `{singular_table}_id` | `user_id`, `fixture_id`, `gameweek_id` |
| Boolean columns | affirmative `is_` or `has_` prefix | `is_captain`, `is_correct`, `has_seen_reveal` |
| Timestamp columns | `_at` suffix | `created_at`, `locked_at`, `scored_at` |
| Indexes | `idx_{table}_{columns}` | `idx_predictions_user_gameweek` |

**Drizzle ↔ TypeScript mapping rule:** Drizzle schema defines columns in `snake_case`; generated TypeScript interfaces use `camelCase`. Agents must not manually rename — Drizzle's column mapping handles this automatically.

**Edge Function Naming Conventions:**

| Item | Convention | Example |
|---|---|---|
| Function directory names | `kebab-case` | `ingest-odds/`, `run-scoring/` |
| Entry file | always `index.ts` | `functions/run-scoring/index.ts` |
| Shared utilities | `functions/_shared/` | `functions/_shared/scoring-engine.ts` |
| PostgreSQL RPC functions | `snake_case` | `calculate_streak_multiplier()` |

**TypeScript / Mobile Code Naming Conventions:**

| Item | Convention | Example |
|---|---|---|
| React components | `PascalCase` | `FixtureCard`, `TypeBadge`, `RevealCard` |
| Component files | `PascalCase.tsx` | `FixtureCard.tsx` |
| Screen files (Expo Router) | `kebab-case.tsx` | `app/(tabs)/build.tsx` |
| Utility / hook files | `camelCase.ts` | `useGameweekState.ts`, `scoreCalculator.ts` |
| Interfaces / Types | `PascalCase` | `Prediction`, `GameweekState`, `ScoringResult` |
| Zustand stores | `use{Domain}Store` | `useGameweekStore`, `useBuildStore` |
| TanStack Query hooks | `use{Entity}Query` / `use{Action}Mutation` | `useSquadQuery`, `useSubmitSquadMutation` |
| Constants | `SCREAMING_SNAKE_CASE` | `MAX_TOKENS`, `STREAK_MULTIPLIER_BASE` |
| Functions / variables | `camelCase` | `calculateScore`, `fixtureId`, `gameweekState` |

### Structure Patterns

**Mobile App File Structure:**

```
apps/mobile/
  app/
    (tabs)/
      build.tsx          ← Build View
      moments.tsx        ← Moments View
      leagues.tsx        ← League tab
    catalog/
      [fixtureId].tsx    ← Moment Catalog screen
    microflow/
      player.tsx         ← Step 1: Player selection
      timing.tsx         ← Step 2: Minute + zone
    onboarding.tsx
    _layout.tsx
  src/
    components/
      build/             ← Components used in Build View
      moments/           ← Components used in Moments View
      shared/            ← TypeBadge, GameweekHeader, etc.
    stores/              ← Zustand stores (one file per domain)
    queries/             ← TanStack Query hooks (one file per entity)
    lib/
      supabase.ts        ← Supabase client init (singleton)
    utils/               ← Pure functions (no hooks, no state)
```

**Supabase Project Structure:**

```
apps/supabase/
  functions/
    _shared/             ← Shared utilities across Edge Functions
    ingest-odds/
    ingest-events/
    run-scoring/
    send-notifications/
    admin-rescore/
  migrations/            ← Drizzle-generated SQL files, numbered sequentially
  seeds/                 ← Development seed data
  tests/                 ← Integration tests against local Supabase stack
```

**Test Location Rule:** Tests are co-located with source files as `*.test.ts` / `*.test.tsx`. No separate `__tests__` directory. Exception: Supabase integration tests live in `apps/supabase/tests/`.

**Component Organisation Rule:** Components are organised by feature/screen, not by type.
- `src/components/build/FixtureCard.tsx` — not `src/components/cards/FixtureCard.tsx`
- `src/components/shared/TypeBadge.tsx` — shared atoms only in `shared/`

### Format Patterns

**API Response Format — the only acceptable structure:**

All Edge Functions return the Supabase `{ data, error }` convention:

```typescript
// Success
return new Response(JSON.stringify({ data: result }), { status: 200 })

// Error
return new Response(JSON.stringify({
  error: { code: 'SCORING_FAILED', message: 'Scoring engine error' }
}), { status: 500 })
```

Mobile app always destructures `{ data, error }` — never assumes success without checking `error`.

**Date / Time Format:**
- DB storage: `timestamptz` (always UTC)
- API transmission: ISO 8601 string (`"2026-08-16T14:30:00Z"`)
- UI display: formatted via `Intl.DateTimeFormat` or `date-fns` — never raw ISO strings in UI text

**Point Values Rule:** Always integers. Never floats. Stored as `integer` in PostgreSQL, typed as `number` in TypeScript. If the scoring formula would produce a float, it is a formula design error, not a rounding problem.

**Null vs Undefined Rule:**
- `null` = intentionally absent value — used in DB columns and API payloads
- `undefined` = optional TypeScript prop not provided — used in component interfaces only
- Never use `undefined` in Drizzle schema definitions or API response payloads

### Communication Patterns

**TanStack Query Key Conventions — use exactly these structures:**

```typescript
['gameweek', 'current']
['gameweek', gameweekId]
['catalog', fixtureId]
['squad', userId, gameweekId]
['leaderboard', 'global', gameweekId]
['leaderboard', 'mini-league', leagueId, gameweekId]
['results', userId, gameweekId]
['mini-leagues', userId]
```

**Zustand Store Rule — one store per domain, never one global store:**

```typescript
// stores/useGameweekStore.ts  — phase, current gameweek data
// stores/useBuildStore.ts     — active build session state
// stores/useRevealStore.ts    — reveal sequence state
```

Stores hold **client UI state only**. Server data lives in TanStack Query cache — never duplicated in Zustand.

**Optimistic Update Rule:** All squad mutations (add pick, remove pick, set captain) use TanStack Query's `onMutate` + `onError` rollback pattern. Never manually update Zustand state to reflect server changes.

### Process Patterns

**Error Handling — three tiers:**

| Tier | Trigger | Response |
|---|---|---|
| **Transient** | Network blip, submission timeout | Non-blocking bottom toast: "Couldn't save — tap to retry" (auto-dismiss 4s). TanStack Query retry handles the underlying request. |
| **Validation** | Client-side input error | Inline error on the relevant field. Never a modal. |
| **Critical** | Scoring engine failure, data integrity error | Insert into `scoring_errors` table → Sentry high-priority alert. Mobile shows "Results delayed — we're looking into it." Never expose technical detail to the user. |

**Loading State Rule:** Always use TanStack Query's built-in `isLoading` / `isFetching` / `isPending`. Never create a parallel `isLoading` boolean in Zustand or local component state for the same data.

**Skeleton Pattern Rule:** Loading states show skeleton rows at the height of actual content — never a centred spinner inside a list. Exception: full-screen initial app load (Expo splash screen handles this).

**Logging Rule:**
- No `console.log` anywhere in production code
- `console.error` for caught errors that should appear in Supabase dashboard logs or Sentry
- `Sentry.captureException()` for caught exceptions requiring alerting
- Edge Functions: `console.error` output appears in Supabase function logs automatically

### Enforcement Guidelines

**All AI agents MUST:**
- Use `snake_case` for all database identifiers; let Drizzle map to `camelCase` in TypeScript
- Return `{ data, error }` from every Edge Function — no other response envelope shape
- Use TanStack Query keys from the defined list — never invent new key structures
- Keep server data in TanStack Query cache, not Zustand
- Use co-located `*.test.ts` files, never a separate `__tests__` directory
- Use `null` in API payloads and DB values; `undefined` only for optional TypeScript props
- Format all dates as ISO 8601 in APIs; `Intl`-formatted strings in UI
- Represent point values as integers always

**Anti-Patterns to Reject:**
- `useState` for data that comes from the server — use TanStack Query
- Zustand for async server data — Zustand is for UI state only
- `console.log` in any file that runs in production
- Float point values — design error if the scoring formula produces one
- Nested `{ data: { data: ... } }` response wrapping
- `useEffect` + `fetch` for data fetching — use TanStack Query
- Separate `__tests__` directories — co-locate tests with source files

## Project Structure & Boundaries

### Requirements to Structure Mapping

| FR Domain | Primary Location |
|---|---|
| FR1–3 Account & Identity | `app/(tabs)/profile.tsx` + Supabase Auth (built-in) |
| FR4–6 Odds fetch + catalog generation | `functions/ingest-odds/index.ts` + `_shared/odds-converter.ts` |
| FR7–8 Match Builder window open/close | `functions/ingest-odds/index.ts` + `migrations/0003_pg_cron_jobs.sql` |
| FR9–10 Match event ingestion | `functions/ingest-events/index.ts` |
| FR11–22 Match Builder (squad building) | `app/(tabs)/build.tsx` + `components/build/` + `app/catalog/[fixtureId].tsx` + `app/microflow/` |
| FR23–30 Scoring engine | `functions/run-scoring/index.ts` + `_shared/scoring-engine.ts` + `_shared/streak-calculator.ts` |
| FR31–34 Score reveal | `app/(tabs)/moments.tsx` + `components/moments/RevealCard.tsx` + `RevealSequence.tsx` |
| FR35–37 Leaderboards | `queries/useLeaderboardQuery.ts` + `components/moments/LeaderboardRow.tsx` |
| FR38–43 Mini-leagues | `app/(tabs)/leagues.tsx` + `queries/useLeagueQuery.ts` |
| FR44–45 Onboarding | `app/onboarding.tsx` |
| FR46–47 Push notifications | `functions/send-notifications/index.ts` + `_shared/push-sender.ts` + `lib/notifications.ts` |
| FR48–53 Admin & Ops | `functions/admin-rescore/`, `functions/admin-void-match/` + Supabase dashboard |

### Complete Project Directory Structure

```
LeColpo/
├── .github/
│   └── workflows/
│       └── ci.yml                      ← Tests → migrations → functions deploy → EAS build
├── apps/
│   ├── mobile/                         ← Expo app
│   │   ├── app/
│   │   │   ├── _layout.tsx             ← Root layout: SafeAreaProvider, QueryClient, Sentry
│   │   │   ├── onboarding.tsx          ← FR44, FR45
│   │   │   ├── (tabs)/
│   │   │   │   ├── _layout.tsx         ← Tab bar layout
│   │   │   │   ├── build.tsx           ← FR11–22 Build View
│   │   │   │   ├── moments.tsx         ← FR31–34 Moments View + Reveal
│   │   │   │   ├── leagues.tsx         ← FR38–43 Mini-leagues
│   │   │   │   └── profile.tsx         ← FR1–3 Account
│   │   │   ├── catalog/
│   │   │   │   └── [fixtureId].tsx     ← FR12 Moment Catalog per fixture
│   │   │   └── microflow/
│   │   │       ├── _layout.tsx
│   │   │       ├── player.tsx          ← FR14 Step 1: Player selection
│   │   │       └── timing.tsx          ← FR14 Step 2: Minute + zone
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── build/
│   │   │   │   │   ├── FixtureCard.tsx         ← FR11 fixture card (collapsed/expanded)
│   │   │   │   │   ├── FixtureCard.test.tsx
│   │   │   │   │   ├── PickRow.tsx             ← FR13–14 pick row in expanded card
│   │   │   │   │   ├── CaptainPopup.tsx        ← FR17 captain selection modal
│   │   │   │   │   └── DeadlineStrip.tsx       ← FR7–8 deadline countdown banner
│   │   │   │   ├── catalog/
│   │   │   │   │   ├── MomentCatalogRow.tsx    ← FR12–14 catalog table row
│   │   │   │   │   └── MomentCatalogRow.test.tsx
│   │   │   │   ├── microflow/
│   │   │   │   │   ├── MicroFlowPlayerRow.tsx  ← FR14 player selection row
│   │   │   │   │   ├── MinutePicker.tsx        ← FR14 minute scroll wheel
│   │   │   │   │   ├── ZoneChip.tsx            ← FR15 ±5/10/15 window selector
│   │   │   │   │   └── PickSummaryCard.tsx     ← FR16 running points total
│   │   │   │   ├── moments/
│   │   │   │   │   ├── MomentsPickRow.tsx      ← FR31–33 pick row (pre/post reveal)
│   │   │   │   │   ├── RevealCard.tsx          ← FR31–33 animated reveal card
│   │   │   │   │   ├── RevealCard.test.tsx
│   │   │   │   │   ├── RevealSequence.tsx      ← FR31–34 reveal orchestrator
│   │   │   │   │   ├── BoldnessHeroCard.tsx    ← locked state hero card
│   │   │   │   │   ├── BoldnessShield.tsx      ← tier icon (Bronze/Silver/Gold/Platinum)
│   │   │   │   │   ├── LeaderboardRow.tsx      ← FR35–37 leaderboard row
│   │   │   │   │   └── ShareCard.tsx           ← social sharing graphic (off-screen render)
│   │   │   │   └── shared/
│   │   │   │       ├── TypeBadge.tsx           ← Match/Moment type pill
│   │   │   │       ├── TypeBadge.test.tsx
│   │   │   │       └── GameweekHeader.tsx      ← GW number + events counter / lock status
│   │   │   ├── stores/
│   │   │   │   ├── useGameweekStore.ts         ← gameweek phase, current GW record
│   │   │   │   ├── useBuildStore.ts            ← active build session (unsaved state)
│   │   │   │   └── useRevealStore.ts           ← reveal sequence (firstView flag)
│   │   │   ├── queries/
│   │   │   │   ├── useGameweekQuery.ts         ← FR4–10 gameweek lifecycle
│   │   │   │   ├── useCatalogQuery.ts          ← FR6, FR12 moment catalog per fixture
│   │   │   │   ├── useSquadQuery.ts            ← FR20–21 squad read + submit mutation
│   │   │   │   ├── useResultsQuery.ts          ← FR31–34 scoring results + breakdown
│   │   │   │   ├── useLeaderboardQuery.ts      ← FR35–37 global + mini-league leaderboards
│   │   │   │   └── useLeagueQuery.ts           ← FR38–43 mini-league CRUD
│   │   │   ├── lib/
│   │   │   │   ├── supabase.ts                 ← Supabase client singleton (only init here)
│   │   │   │   ├── sentry.ts                   ← Sentry init + error boundary setup
│   │   │   │   └── notifications.ts            ← FR3, FR46–47 Expo Notifications + token reg
│   │   │   └── utils/
│   │   │       ├── dateFormatter.ts            ← ISO → display string helpers
│   │   │       └── pointsFormatter.ts          ← integer points display helpers
│   │   ├── app.config.ts                       ← Expo config (env vars, deep link scheme)
│   │   ├── tailwind.config.js
│   │   ├── babel.config.js
│   │   ├── metro.config.js
│   │   ├── nativewind-env.d.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── supabase/                       ← Supabase project
│       ├── functions/
│       │   ├── _shared/
│       │   │   ├── scoring-engine.ts           ← FR23–30 core multi-layer scoring logic
│       │   │   ├── scoring-engine.test.ts
│       │   │   ├── streak-calculator.ts        ← FR27–28 streak ordering by real-world event time
│       │   │   ├── streak-calculator.test.ts
│       │   │   ├── odds-converter.ts           ← FR5 odds → integer point values formula
│       │   │   ├── push-sender.ts              ← FR46–47 Expo Push API wrapper
│       │   │   └── api-clients/
│       │   │       ├── odds-api.ts             ← FR4 odds API client (provider-agnostic)
│       │   │       └── events-api.ts           ← FR9 match events API client
│       │   ├── ingest-odds/
│       │   │   └── index.ts                    ← FR4–6 fetch odds, lock points, populate catalog
│       │   ├── ingest-events/
│       │   │   └── index.ts                    ← FR9–10 fetch match events, store in match_events
│       │   ├── run-scoring/
│       │   │   └── index.ts                    ← FR23–30 orchestrate scoring + invoke send-notifications
│       │   ├── send-notifications/
│       │   │   └── index.ts                    ← FR46–47 dispatch via Expo Push API → APNs/FCM
│       │   ├── admin-rescore/
│       │   │   └── index.ts                    ← FR49 admin-only manual rescore
│       │   └── admin-void-match/
│       │       └── index.ts                    ← FR50 admin-only match void
│       ├── migrations/
│       │   ├── 0001_initial_schema.sql         ← all tables (Drizzle-generated)
│       │   ├── 0002_rls_policies.sql           ← prediction privacy + admin role policies
│       │   └── 0003_pg_cron_jobs.sql           ← FR7–10 scheduled job definitions
│       ├── seeds/
│       │   ├── dev_gameweek.sql
│       │   ├── dev_fixtures.sql
│       │   └── dev_users.sql
│       ├── tests/
│       │   ├── scoring-engine.test.ts          ← FR23–30 integration tests vs local PostgreSQL
│       │   ├── streak-calculator.test.ts       ← FR27–28
│       │   └── rls-policies.test.ts            ← prediction privacy enforcement tests
│       └── config.toml
│
├── packages/
│   └── types/                          ← Shared TypeScript interfaces
│       ├── src/
│       │   ├── gameweek.ts             ← Gameweek, GameweekPhase, Fixture, GameweekMoment
│       │   ├── prediction.ts           ← Prediction, PrecisionPick, MatchMoment, PredictionType
│       │   ├── scoring.ts              ← ScoringResult, LayerScore, StreakResult, StreakEntry
│       │   ├── user.ts                 ← User, UserProfile, UserPushToken
│       │   ├── league.ts               ← MiniLeague, LeagueMembership, LeaderboardEntry
│       │   ├── catalog.ts              ← MomentCard, EventType, OddsData, ConfidenceWindow
│       │   ├── admin.ts                ← ScoringError, AdminAction, GameweekStatus
│       │   └── index.ts                ← barrel export
│       ├── package.json
│       └── tsconfig.json
│
├── pnpm-workspace.yaml
├── package.json                        ← root scripts (test:all, lint:all)
├── .gitignore
└── README.md
```

### Architectural Boundaries

**External API Boundaries — single entry point each:**

| External service | Entry point | Rule |
|---|---|---|
| Odds API | `functions/_shared/api-clients/odds-api.ts` | Only this file ever calls the Odds API. Key in Edge Function env vars only. |
| Match Events API | `functions/_shared/api-clients/events-api.ts` | Only this file calls the Events API. |
| Expo Push API | `functions/_shared/push-sender.ts` | Only Edge Functions send pushes — mobile app never calls Expo Push API directly. |
| Apple / Google Auth | Supabase Auth (zero custom code) | Mobile app uses Supabase JS client OAuth flow only. |

**Mobile ↔ Backend Boundary:**
- `lib/supabase.ts` is the **only place** the Supabase client is initialised — imported everywhere, never re-created
- CRUD reads/writes: Supabase JS client PostgREST (`supabase.from('table')`)
- Complex operations: `supabase.functions.invoke()` — called only from TanStack Query hooks in `queries/`
- Mobile app never imports from `apps/supabase/functions/` — boundary is the HTTP interface only

**Scoring Engine Boundary — critical isolation:**
All scoring logic lives in `_shared/scoring-engine.ts` and `_shared/streak-calculator.ts`. `run-scoring/index.ts` is a thin orchestrator only. This isolation means the scoring engine is fully unit-testable without Supabase infrastructure, and a manual rescore is identical to an automatic one.

### Data Flow

```
Odds API → ingest-odds → game_week_moments (DB) → PostgREST → mobile catalog

Mobile → PostgREST (RLS: own rows, before deadline) → predictions (DB)

Events API → ingest-events → match_events (DB)

match_events + predictions → run-scoring → scoring_results + leaderboard_entries (DB)
                                         → send-notifications → Expo Push → APNs/FCM

scoring_results (DB, RLS: readable after scoring_complete=true) → PostgREST → mobile reveal

match_events (DB, accumulated over season) → PostgREST → mobile historical stat dots
```

### Integration Points

**Internal Communication:**
- Mobile screens → `queries/` hooks (TanStack Query) → `lib/supabase.ts` → Supabase
- Zustand stores receive derived state from TanStack Query via `onSuccess` callbacks — no direct Supabase calls in stores
- `run-scoring` invokes `send-notifications` via `supabase.functions.invoke()` internally — not via HTTP from mobile

**Deep Link Flow (FR40 — mini-league join):**
```
Invite link tapped → iOS Universal Link / Android App Link → App Store (if not installed)
→ Deep link preserved → App opens to leagues.tsx with leagueId param → join flow
```
Deep link scheme configured in `app.config.ts`. Expo Router handles param extraction automatically.

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**

| Pairing | Status | Notes |
|---|---|---|
| Expo SDK 54 + NativeWind v4 + Expo Router | ✅ | Documented compatible combination |
| Supabase + Drizzle ORM | ✅ | Drizzle generates standard SQL; `supabase db push` applies cleanly |
| TanStack Query + Zustand | ✅ | No state overlap as defined — server state vs UI state split is clean |
| react-native-reanimated + Expo managed | ✅ | Expo SDK 54 bundles reanimated v3; no bare workflow needed |
| react-native-view-shot + Expo managed | ✅ | Works with managed workflow; requires `expo-build-properties` plugin in `app.config.ts` |
| Sentry + Expo + Deno Edge Functions | ✅ | Official SDK support on both layers |
| TypeScript across all layers | ✅ | Mobile (TSX), Edge Functions (Deno TS), shared types package — consistent |

**Pattern Consistency:** All naming conventions, `{ data, error }` response envelopes, TanStack Query as server state, and co-located test rules are non-contradictory and consistently applied across all layers.

**Structure Alignment:** All 53 FRs mapped to specific files. Scoring engine isolated in `_shared/`. External API clients isolated. Boundaries clearly defined and non-overlapping.

### Requirements Coverage Validation ✅

**Functional Requirements:**

All 53 FRs covered. Two resolved items:
- **FR19 Quick Pick** — intentionally removed from MVP per UX Specification design decision. Not a gap.
- **FR21 Squad submission** — clarified: Save = persist picks to DB (multiple times allowed); deadline lock = RLS write-lock at `first_kickoff`. No separate submit action exists.

**Non-Functional Requirements:**

| NFR | Coverage |
|---|---|
| Performance (<2s loads, <200ms filtering) | ✅ TanStack Query cache + client-side catalog filtering + materialised leaderboards |
| Security (TLS, OAuth 2.0, prediction privacy) | ✅ Supabase TLS + Auth + RLS policies |
| Scalability (10K concurrent, 5-min scoring) | ✅ Edge Functions scale horizontally; materialised scoring avoids real-time aggregation |
| Integration tolerances | ✅ Exponential backoff in `_shared/api-clients/` |
| Reliability (zero scoring errors, halt mechanism) | ✅ Resolved — see Gap 2 below |

### Gap Analysis & Resolutions

**Gap 1 (Critical — resolved): FR22 token enforcement mechanism**

20-token limit enforced server-side in the save squad Edge Function as a count check before persisting picks, plus a PostgreSQL check constraint on `predictions` rows per user per gameweek. Not client-side only.

**Gap 2 (Critical — resolved): Scoring halt mechanism**

`gameweeks` table requires a `scoring_status` column: `pending | in_progress | complete | error`. The `run-scoring` function sets this field throughout execution. Mobile app reads `scoring_status` before triggering the reveal animation — if `error`, shows "Results delayed — we're looking into it." RLS policy on `scoring_results` gates reads to `scoring_status = 'complete'` only.

**Gap 3 (Important — resolved): FR10 gameweek completion detection**

`ingest-events` function checks after processing each match whether all fixtures in the gameweek have `events_ingested = true`. When all are complete, it invokes `run-scoring` directly via `supabase.functions.invoke()`. Event-driven chain: `pg_cron` → `ingest-events` (per match) → all complete → `run-scoring` → `send-notifications`. No polling.

**Gap 4 (Important — resolved): FR53 Admin catalog management**

For MVP: direct Supabase Studio table edits to `moment_types` and `game_week_moments` tables — acceptable for solo dev ops where catalog changes are infrequent. Post-MVP: dedicated admin Edge Function with authenticated PATCH endpoint.

**Gap 5 (Minor — resolved): react-native-view-shot Expo config**

`app.config.ts` requires `expo-build-properties` plugin entry for `react-native-view-shot`. Must be included in project initialisation.

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analysed (53 FRs, 5 NFR categories)
- [x] Scale and complexity assessed (medium, full-stack, solo dev)
- [x] Technical constraints identified (online-only, portrait, <50MB, no real money)
- [x] Cross-cutting concerns mapped (8 identified and addressed)

**✅ Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Full technology stack specified (mobile + backend + infra)
- [x] Integration patterns defined (Supabase JS client + Edge Functions)
- [x] Performance and reliability considerations addressed

**✅ Implementation Patterns**
- [x] Naming conventions established (DB, Edge Functions, TypeScript)
- [x] Structure patterns defined (feature-organised, co-located tests)
- [x] Communication patterns specified (TanStack Query keys, Zustand domains)
- [x] Process patterns documented (3-tier error handling, loading states, logging)

**✅ Project Structure**
- [x] Complete directory structure defined with real filenames
- [x] Component boundaries established
- [x] Integration points and data flow mapped
- [x] All 53 FRs mapped to specific files and directories

### Architecture Readiness Assessment

**Overall Status: READY FOR IMPLEMENTATION**

**Confidence Level: High**

**Key Strengths:**
- Scoring engine fully isolated — zero-tolerance reliability requirement is architecturally enforced
- Supabase platform consolidates auth, DB, jobs, functions, and RLS into one observable system — ideal for solo dev
- Shared types package eliminates an entire category of mobile/backend type mismatch bugs
- Gameweek state machine is first-class — drives all UX behaviour from a single authoritative source
- All external API dependencies behind single-entry-point abstractions — provider can be swapped without mobile code changes

**Areas for Future Enhancement (Post-MVP):**
- Supabase Realtime subscriptions for live scoring (post-MVP feature, architecture already supports it)
- Admin web dashboard (simple Next.js or Supabase Studio extension)
- Supabase Vault for secret management (drop-in replacement for env vars)
- Match Story share card generation (post-MVP, ShareCard component already architected)

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently — refer to Section 5 for all naming and structure decisions
- Respect project boundaries — mobile never imports from supabase functions; scoring logic never in route handlers
- `packages/types` Drizzle schema is the source of truth — define it before writing any other code
- `gameweeks.scoring_status` column is load-bearing — must exist before scoring engine or reveal screen are implemented

**First Implementation Story:**
```bash
# 1. Scaffold monorepo
mkdir LeColpo && cd LeColpo
pnpm init
# configure pnpm-workspace.yaml

# 2. Initialise Expo app
cd apps && npx create-expo-app@latest mobile --template default
cd mobile
npx expo install nativewind react-native-reanimated react-native-safe-area-context
npx expo install expo-haptics expo-sharing expo-build-properties
npm install --save-dev tailwindcss@^3.4

# 3. Initialise Supabase project
cd ../supabase && supabase init

# 4. Create shared types package
mkdir -p ../../packages/types && cd ../../packages/types && pnpm init
```

**Implementation sequence after scaffold:**
1. `packages/types` — Drizzle schema + shared interfaces (all subsequent code depends on this)
2. Supabase project — Auth config, RLS policies, `scoring_status` column, pg_cron job definitions
3. Edge Functions — `ingest-odds` → `ingest-events` → `run-scoring` (in dependency order)
4. Mobile — Supabase client + TanStack Query + Zustand setup → Build View → Catalog → Micro-flow
5. Mobile — Moments View + RevealSequence + RevealCard
6. Mobile — Mini-leagues + Leaderboards + ShareCard
7. CI/CD pipeline + Sentry configuration
