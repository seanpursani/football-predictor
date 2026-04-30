---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories, step-04-final-validation]
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/architecture.md'
  - '_bmad-output/planning-artifacts/ux-design-specification.md'
---

# LeColpo - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for LeColpo, decomposing the requirements from the PRD, UX Design Specification, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

**Account & Identity**
- FR1: User can create an account via social login (Apple, Google)
- FR2: User can view and edit their profile (display name)
- FR3: User can grant or revoke push notification permissions

**Gameweek Lifecycle**
- FR4: System can fetch and lock odds from external API when Match Builder window opens
- FR5: System can convert odds to point values using a configurable scoring formula
- FR6: System can populate each gameweek with the current fixture list, apply locked odds to generate match-specific point values for each card type, and make the configured catalog available when the Match Builder window opens
- FR7: System can open and close the Match Builder window on a configurable schedule
- FR8: System can lock all user predictions at the Match Builder deadline (first kickoff)
- FR9: System can fetch match event data (goals, cards, subs, corners — with player + minute) from external API after matches complete
- FR10: System can determine when all matches in a gameweek are complete and trigger scoring

**Match Builder (Squad Building)**
- FR11: User can view all fixtures in the current gameweek
- FR12: User can browse the moment catalog filtered by match, event type, or team
- FR13: User can add a Match Moment to their squad (match-level outcome, binary yes/no)
- FR14: User can add a Precision Pick to their squad using an event-type-specific micro-flow (team → event type → minute → window → event-specific precision fields). Each event type presents only its relevant fields in sequence — no unused fields are shown.
- FR14a: The Precision Pick micro-flow supports: Goal (Scorer, Assister → Event + Timing + Scorer bonus + Assister bonus), Substitution (Player On, Player Off → Event + Timing + Player On bonus + Player Off bonus), Corner (Zone → Event + Timing + Zone bonus), Yellow Card (Player → Event + Timing + Player bonus), Red Card (Player → Event + Timing + Player bonus)
- FR15: User can select a confidence window (±5, ±10, or ±15 minutes) for each Precision Pick
- FR16: User can see the point value breakdown for any moment before selecting it
- FR17: User can designate one moment as Captain (2x points)
- FR18: User can remove or replace any moment in their squad before deadline
- FR19: REMOVED FROM MVP — Quick Pick auto-fill removed per UX Specification design decision
- FR20: User can view their complete squad summary (Moments View) before deadline
- FR21: User can save their squad picks (picks persisted to DB; RLS write-lock at first_kickoff is the deadline mechanism — no separate submit action)
- FR22: System enforces the 20-token limit per gameweek (server-side count check + PostgreSQL check constraint)

**Scoring Engine**
- FR23: System can score Match Moments (correct = flat odds-derived points, incorrect = 0)
- FR24: System can score Precision Picks across event-type-specific independent additive layers (partial credit always possible): event points + timing bonus + event-specific precision bonuses (scorer/assister/player/zone per event type)
- FR25: System can award exact minute jackpot bonus when a Precision Pick hits the precise minute
- FR26: System can apply Captain Moment multiplier (2x) to the designated moment's total points
- FR27: System can calculate cross-match streaks by ordering correct Precision Picks by real-world event time
- FR28: System can apply streak bonus (additive flat points) to consecutive correct Precision Picks — 2nd consecutive hit: +10 pts, 3rd: +20 pts, 4th+: +30 pts; bonus is added to that pick's score total, never subtracted
- FR29: System can handle postponed matches (tokens lost, no points awarded)
- FR30: System can calculate a user's total gameweek score from all 20 tokens

**Score Reveal & Results**
- FR31: User can view their gameweek results after scoring is complete
- FR32: User can see per-moment scoring breakdown (which layers scored, what bonus applied)
- FR33: User can see visual feedback distinguishing hits, misses, timing bonuses, and exact minute jackpots
- FR34: User can view their streak sequence and where it broke

**Leaderboards**
- FR35: User can view a weekly gameweek leaderboard (all users, ranked by gameweek score)
- FR36: User can view a season cumulative leaderboard (all users, ranked by total season score)
- FR37: User can see their own rank and score on both leaderboards

**Mini-Leagues**
- FR38: User can create a mini-league with a custom name
- FR39: User can generate a shareable invite link for their mini-league
- FR40: User can join a mini-league via invite link (including deep link from outside the app)
- FR41: User can view the mini-league leaderboard (weekly + season cumulative)
- FR42: User can belong to multiple mini-leagues simultaneously
- FR43: User can leave a mini-league

**Onboarding**
- FR44: New user is presented with a guided tutorial explaining the two prediction types, scoring, and 5 core rules
- FR45: User can complete onboarding in under 60 seconds

**Push Notifications**
- FR46: System can send a push notification when the Match Builder window opens
- FR47: System can send a push notification when gameweek results are ready

**Admin & Operations**
- FR48: Admin can view gameweek status (catalog loaded, odds locked, matches complete, scoring done)
- FR49: Admin can manually trigger a rescore for a gameweek
- FR50: Admin can flag a match as void (tokens lost per rules)
- FR51: Admin can investigate a specific user's score breakdown
- FR52: System logs API fetch results and scoring operations for error monitoring
- FR53: Admin can add, remove, or modify card types in the moment catalog (MVP: via direct Supabase Studio table edits)

### NonFunctional Requirements

**Performance**
- NFR1: Match Builder screen loads in <2 seconds on 4G connection
- NFR2: Moment catalog filtering (by match, team, event type) responds in <200ms (client-side)
- NFR3: Squad submission completes in <1 second
- NFR4: Score reveal screen renders in <3 seconds with full gameweek data (20 tokens × scoring breakdown)
- NFR5: Leaderboard loads in <2 seconds for mini-leagues up to 100 members and global top 1000

**Security**
- NFR6: All data in transit encrypted via TLS 1.2+
- NFR7: User authentication tokens follow OAuth 2.0 best practices (short-lived access tokens, secure refresh)
- NFR8: No betting odds data exposed to users — only derived point values
- NFR9: User prediction data not visible to other users before gameweek deadline
- NFR10: Admin operations require elevated authentication (Supabase custom JWT claims `role: 'admin'`)

**Scalability**
- NFR11: System supports up to 10,000 concurrent users during Match Builder window without degradation
- NFR12: Scoring engine processes all users within 5 minutes of final match completion
- NFR13: Database scales to support a full Premier League season (38 gameweeks × all users × 20 tokens per gameweek)
- NFR14: API rate limits managed to stay within provider quotas during odds fetch and event ingestion

**Integration**
- NFR15: Odds API: System tolerates API downtime of up to 4 hours (retry with exponential backoff, max 3 retries, 2× delay)
- NFR16: Match Events API: System tolerates delayed event data by up to 2 hours post-match before flagging for manual intervention
- NFR17: Push notification delivery via APNs/FCM with best-effort delivery (no guaranteed SLA for MVP)
- NFR18: Deep link handling works across iOS Universal Links and Android App Links for mini-league invites

**Reliability**
- NFR19: Zero tolerance for scoring calculation errors — system halts reveal and alerts admin if detected; `scoring_status` column tracks state
- NFR20: User predictions persisted immediately on submission — no data loss on app crash or network interruption
- NFR21: Gameweek lifecycle (odds lock → match events → scoring → reveal) runs without manual intervention for 99% of gameweeks
- NFR22: System handles postponed/rescheduled matches gracefully without corrupting other match data

### Additional Requirements

_Technical requirements from Architecture that affect implementation:_

- AR1: **Starter template & project scaffold** — pnpm monorepo with `create-expo-app` (Expo SDK 54, NativeWind v4.2.3) + Supabase (PostgreSQL + Edge Functions + pg_cron + Auth + RLS) + `packages/types` shared types package. Initialization commands documented in Architecture. Project scaffold is the first implementation story (Epic 1, Story 1).
- AR2: **Drizzle ORM** — TypeScript schema is the single source of truth; `snake_case` DB columns map automatically to `camelCase` TypeScript via Drizzle; `drizzle-kit` manages migrations; migration files committed to `apps/supabase/migrations/`
- AR3: **Supabase Auth** — handles Apple Sign-In and Google Sign-In OAuth; `@supabase/supabase-js` + `expo-secure-store` for token persistence; short-lived access tokens with automatic refresh
- AR4: **RLS prediction privacy** — `predictions` table RLS: users SELECT own rows only before deadline (`first_kickoff` timestamp on `gameweeks`); all rows readable post-deadline; `scoring_results` table gated to `scoring_status = 'complete'`
- AR5: **Admin auth** — Supabase custom JWT claims: `role: 'admin'` in JWT; Edge Functions check claim before executing admin operations; no service-role key in any client
- AR6: **External API key management** — Odds API and Match Events API keys stored as Supabase Edge Function secrets (`supabase secrets set`); never in client bundle or repository
- AR7: **Edge Functions** — six functions required: `ingest-odds`, `ingest-events`, `run-scoring`, `send-notifications`, `admin-rescore`, `admin-void-match`; all return `{ data, error }` envelope; shared utilities in `functions/_shared/`
- AR8: **State management** — TanStack Query for all server state (with exact key conventions from Architecture); Zustand for client UI state only (one store per domain: `useGameweekStore`, `useBuildStore`, `useRevealStore`); `useState` for server data is an anti-pattern
- AR9: **pg_cron scheduled jobs** — three jobs: odds lock trigger → `ingest-odds`; per-match event ingestion → `ingest-events`; scoring trigger → `run-scoring` → `send-notifications`; event-driven chain (all events ingested → auto-invoke scoring)
- AR10: **Sentry monitoring** — `@sentry/react-native` on mobile + Sentry Deno SDK on Edge Functions; scoring engine errors configured as high-priority alerts
- AR11: **CI/CD** — GitHub Actions on push to `main`: run Jest tests → `supabase db push` → deploy Edge Functions → trigger Expo EAS build (production); PR builds use Expo EAS Preview channel
- AR12: **`gameweeks.scoring_status` column** — values: `pending | in_progress | complete | error`; `run-scoring` updates throughout execution; load-bearing for reveal gating — must exist before scoring engine or reveal screen are implemented
- AR13: **Token limit enforcement** — server-side count check in save squad Edge Function + PostgreSQL check constraint on `predictions` rows per user per gameweek
- AR14: **`match_events` table** — single table `(match_id, event_type, player_id, minute, team_id, created_at)` serves both scoring engine joins and historical ✓/✗ dot queries; must be designed before either consumer is built
- AR15: **Materialised leaderboards** — `leaderboard_entries` table populated by scoring engine post-gameweek; never computed on-demand; stale-while-revalidate on mobile
- AR16: **react-native-view-shot** — requires `expo-build-properties` plugin entry in `app.config.ts`; must be included in project initialisation
- AR17: **Naming conventions** — DB: `plural snake_case` tables, `snake_case` columns; Edge Functions: `kebab-case` directories; TypeScript: `PascalCase` components, `camelCase` utilities, `use{Domain}Store` Zustand, `use{Entity}Query` TanStack; Constants: `SCREAMING_SNAKE_CASE`
- AR18: **Error handling tiers** — Transient: bottom toast (auto-dismiss 4s); Validation: inline field error; Critical: `scoring_errors` table insert + Sentry alert; no blocking modals for transient failures

### UX Design Requirements

- UX-DR1: **OLED Sharp colour system** — implement exact tokens: `bg-primary #080808`, `bg-surface #141414`, `bg-elevated #1C1C1C`, `text-primary #FFFFFF`, `text-secondary #7A7A7A`, `text-muted #404040`, `border-subtle #1E1E1E`, `border-active #B4FF32`; semantic: `accent/success #B4FF32` (lime), `jackpot/captain #FFD700` (gold), `deadline #FF6B35` (orange), `streak #A78BFA` (violet), `miss #303030`; dark mode only — no light mode in MVP
- UX-DR2: **Inter typeface system** — load via `@expo-google-fonts/inter`; exact scale: display (32px/700/38px lh), heading-1 (24px/700/30px), heading-2 (18px/600/24px), body (15px/400/22px), label (13px/500/18px), caption (11px/400/16px), mono-number (20px/700/24px); `fontVariant: ['tabular-nums']` on all numeric displays (events counter, point totals, scores, countdown)
- UX-DR3: **8px spacing system** — tokens: space-1 (4px), space-2 (8px), space-3 (12px), space-4 (16px), space-5 (24px), space-6 (32px), space-8 (48px); corner radius: radius-sm (4px), radius-md (6px), radius-lg (8px), radius-full (9999px); horizontal screen padding: 16px on all screens
- UX-DR4: **TypeBadge component** — match variant: `rgba(180,255,50,0.12)` bg, `#B4FF32` text, "MATCH" label; moment variant: `rgba(167,139,250,0.15)` bg, `#A78BFA` text, "MOMENT" label; used in MomentCatalogRow, PickRow, MomentsPickRow, ShareCard
- UX-DR5: **GameweekHeader component** — Build View: left "GW {n}" (heading-2), right "{used}/{total}" in lime with tabular-nums; Locked: right shows violet "Locked" badge (lock icon, `#A78BFA`); Reveal: "GW {n} · Results" left, empty right
- UX-DR6: **DeadlineStrip component** — four states: hidden (>3 hours, not rendered), approaching (1-3 hours, muted text), urgent (<1 hour, `#FF6B35` text + tinted bg), critical (<15 min, full orange strip + subtle pulse animation); derives state from `deadlineTimestamp` prop; 60-second interval refresh; `accessibilityLiveRegion="polite"`
- UX-DR7: **FixtureCard component** — three states: empty (chevron ▸, tap → Moment Catalog), collapsed (pick count badge "N picks", chevron ▸, tap → expand accordion inline), expanded (PickRows + "+ Tap to add a pick" placeholder, chevron ▾, tap header → collapse); only one card expanded at a time; `accessibilityRole="button"` with expanded state announced
- UX-DR8: **MomentCatalogRow component** — three states: match-default (no arrow, tap → immediate Build View return), moment-default (→ arrow signals multi-step flow), added (✓ indicator, tap is no-op); Match shows flat "350" points, Moment shows "420+" to signal variable ceiling; `accessibilityRole="button"`; added state: `accessibilityState={disabled: true}`
- UX-DR9: **CaptainPopup component** — bottom sheet modal; anatomy: pick name context label + "👑 Select as Captain" action + "✕ Remove pick" (destructive text, `#FF4444`); selecting captain silently deselects previous; tap backdrop dismisses; `border-radius: 10px 10px 0 0`; semi-transparent `rgba(0,0,0,0.7)` backdrop
- UX-DR10: **PickRow component** — inside expanded FixtureCard; shows: event icon + event name + TypeBadge + points; captain crown 👑 icon on designated pick; tap → opens CaptainPopup
- UX-DR11: **Precision Pick micro-flow** — two-screen stack progression (player.tsx → timing.tsx); Screen 1: scrollable player list with player bonus points, sorted by scoring likelihood (odds-derived), selection mandatory (confirm inactive until player selected); Screen 2: MinutePicker + ZoneChip + PickSummaryCard real-time point total; back from Screen 1 cancels pick entirely (no partial state); confirm on Screen 2 → auto-returns to Build View
- UX-DR12: **MinutePicker component** — custom scroll-wheel style; range 1–90+; snaps to nearest value; selected minute large and centred; ▲/▼ tap targets with minimum 44px touch area; FlatList with snapToInterval; falls back to numeric TextInput if scroll performance is unsatisfactory on low-end Android
- UX-DR13: **ZoneChip component** — segmented control: ±5 (+50 pts) / ±10 (+25 pts) / ±15 (+0 pts); one always active; default ±10; switching immediately updates PickSummaryCard running total; `accessibilityRole="radio"` with `accessibilityLabel="Plus or minus {n} minutes, {bonus} bonus points"` and `accessibilityState={selected: true/false}`
- UX-DR14: **Moments View** — post-save view with Match | Moment tab navigation (tap only, no swipe between tabs); Match tab: picks grouped by fixture, sorted by kickoff time; Moment tab: picks in chronological event-time order across all fixtures (predicted minute within match, matches by kickoff) — the streak sequence view; Share ↗ always visible top-right; Edit always visible bottom
- UX-DR15: **BoldnessShield component** — four tiers: Bronze (0–999pts, `#CD7F32`), Silver (1000–2499pts, `#9CA3AF`), Gold (2500–4999pts, `#FFD700`), Platinum (5000+pts, `#00D4FF`); SVG shield path with tier-coloured stroke and low-opacity fill; tier label in matching colour; `accessibilityRole="text"` with `accessibilityLabel="Boldness tier: {tier}. Possible points: {n}"`
- UX-DR16: **BoldnessHeroCard component** — shown in Moments View during Locked/Live state; displays: BoldnessShield + tier name + possible points (calculated at save time, not recalculated) + status line "Results incoming · ends {day} {time}"; card border adopts tier colour at 25–30% opacity
- UX-DR17: **RevealCard component** — six animation states using react-native-reanimated: pending (dimmed, neutral), revealing (subtle pulse/scale, ~300ms before resolve), hit (lime bg fade in), miss (dark grey fade in), captain-hit (gold 2× flash + crown pulse), jackpot (gold burst + scale up); haptics: light (hit), medium (captain-hit), heavy (jackpot); `firstView` boolean prop — when false, render immediately in final resolved state with no animation
- UX-DR18: **RevealSequence orchestrator** — sequential card reveal with 600ms default delay between cards; running score counter animates up after all cards resolve; checks `AccessibilityInfo.isReduceMotionEnabled()` at app start (not inline in each card); passes `firstView` and `reduceMotion` booleans to all RevealCards; when reduceMotion true, all cards render in final state instantly
- UX-DR19: **MomentsPickRow component** — pre-reveal (pending, dimmed) and post-reveal (resolved: hit/miss/jackpot/captain states) variants; shared visual DNA with RevealCard but static (no animation)
- UX-DR20: **LeaderboardRow component** — Rank + Name + Score + movement indicator; movement-up: lime ↑ with count; movement-down: muted ↓ with count; no-movement: dash (—); self (current user): 2px left lime border accent (`2px solid #B4FF32`)
- UX-DR21: **ShareCard component** — off-screen rendered View at 1080×1350px (4:5, Instagram-optimised); three variants: match-picks (lime branding, flat points, grouped by fixture), moment-picks (violet branding, "420+" notation, event + player + minute), results (hit/miss indicators + final score + league position); max 8 picks, surplus summarised as "+ N more picks"; captured via react-native-view-shot as PNG; exported via expo-sharing
- UX-DR22: **Button hierarchy** — four levels: Primary (lime bg `#B4FF32`, black text, radius-md, full-width, one per screen, always bottom persistent action bar), Secondary (dark bg, white text, `border-subtle` border), Text action (lime text, no bg, with icon), Destructive (red `#FF4444` text, CaptainPopup only); no disabled states in the build flow; never two primary buttons competing
- UX-DR23: **Empty states** — three defined: League tab (no leagues): "You're not in a league yet" + "Create league" primary + "Join with a link" secondary; League tab (in league, awaiting results): members listed, scores "—", "Results available after the gameweek"; Moments View (no picks): "Nothing saved for this gameweek" + "Build your squad" primary
- UX-DR24: **Skeleton loading states** — animated grey bars at row height for Moment Catalog and player list; "Having trouble loading — tap to retry" if >3 seconds; never a centred spinner inside a list; score reveal uses pending RevealCard state as the loading experience (no spinner)
- UX-DR25: **Moment Catalog filter chips** — All / Match / Moment; single-select; lime active (lime bg, black text), inactive (dark elevated, secondary text); instant row show/hide — no transition animation; resets to "All" each time the screen opens
- UX-DR26: **App state machine** — three states: Building (Build View, full editing), Locked/Live (Moments View + BoldnessHeroCard, read-only), Reveal (auto-reveal sequence, one-time on first open after last match); transitions detected on app foreground via AppState listener; `reveal_seen` flag per-user in Supabase prevents re-triggering reveal animation
- UX-DR27: **Deep link handling** — mini-league invite links use Universal Links (iOS) / App Links (Android); deep link survives App Store install flow; Expo Router auto-extracts leagueId param in `leagues.tsx`; configured in `app.config.ts`
- UX-DR28: **Accessibility requirements** — applied at component build time (not retrofitted): `accessibilityRole`, `accessibilityLabel`, `accessibilityState` on all interactive elements; all touch targets minimum 44×44px; colour-blind safe: every hit/miss/jackpot state uses colour AND icon (✓/✗/👑/⚡), never colour alone; Inter respects iOS Dynamic Type and Android font size preferences; flex layout prevents overflow at larger text sizes
- UX-DR29: **Reduced motion** — `AccessibilityInfo.isReduceMotionEnabled()` checked on app mount once; result passed through RevealSequence as prop; when enabled, RevealCards transition to final resolved state instantly — no sequential animation
- UX-DR30: **Historical stat dots** — MomentCatalogRow drill-down shows ✓/✗ dot history from `match_events` table for same event type + team from prior gameweeks; only real accumulated data shown — no filler or placeholders if insufficient history; meaningful from gameweek 5–6 onward; same data source as scoring engine (no extra API cost)

### FR Coverage Map

| FR | Epic | Description |
|---|---|---|
| FR1 | Epic 2 | Social login (Apple, Google) |
| FR2 | Epic 2 | Profile display name |
| FR3 | Epic 2 | Push notification permissions |
| FR4 | Epic 3 | Odds fetch and lock from external API |
| FR5 | Epic 3 | Odds → integer point values conversion |
| FR6 | Epic 3 | Gameweek catalog population |
| FR7 | Epic 3 | Match Builder window open/close schedule |
| FR8 | Epic 3 | Prediction lock at first kickoff |
| FR9 | Epic 3 | Match event data ingestion (goals, cards, subs, corners) |
| FR10 | Epic 3 | Gameweek completion detection + scoring trigger |
| FR11 | Epic 5 | View all fixtures in current gameweek |
| FR12 | Epic 5 | Moment catalog browsing with filters |
| FR13 | Epic 5 | Add Match Moment (one-tap) |
| FR14 | Epic 5 | Add Precision Pick via guided micro-flow |
| FR14a | Epic 5 | All Precision Pick event type schemas (Goal, Sub, Corner, Yellow, Red) |
| FR15 | Epic 5 | Confidence window selection (±5/±10/±15) |
| FR16 | Epic 5 | Point value breakdown visible before selecting |
| FR17 | Epic 5 | Captain designation (2x points) |
| FR18 | Epic 5 | Remove or replace any moment before deadline |
| FR19 | N/A | Removed from MVP (Quick Pick) |
| FR20 | Epic 5 | Squad summary / Moments View |
| FR21 | Epic 5 | Save squad picks (persist to DB) |
| FR22 | Epic 5 | 20-token limit enforcement (server-side + DB constraint) |
| FR23 | Epic 4 | Score Match Moments (correct = flat points, incorrect = 0) |
| FR24 | Epic 4 | Score Precision Picks — multi-layer additive (partial credit always possible) |
| FR25 | Epic 4 | Exact minute jackpot bonus |
| FR26 | Epic 4 | Captain multiplier (2x) |
| FR27 | Epic 4 | Cross-match streak ordering by real-world event time |
| FR28 | Epic 4 | Streak multiplier on consecutive correct Precision Picks |
| FR29 | Epic 4 | Postponed match handling (tokens lost, no points) |
| FR30 | Epic 4 | Total gameweek score calculation |
| FR31 | Epic 6 | View gameweek results after scoring complete |
| FR32 | Epic 6 | Per-moment scoring breakdown (layers scored, bonuses applied) |
| FR33 | Epic 6 | Visual feedback: hits, misses, timing bonuses, jackpots |
| FR34 | Epic 6 | Streak sequence view and break point |
| FR35 | Epic 7 | Weekly gameweek leaderboard (global) |
| FR36 | Epic 7 | Season cumulative leaderboard (global) |
| FR37 | Epic 7 | User's own rank and score on both leaderboards |
| FR38 | Epic 8 | Create mini-league with custom name |
| FR39 | Epic 8 | Generate shareable invite link |
| FR40 | Epic 8 | Join mini-league via invite link / deep link |
| FR41 | Epic 7 | Mini-league leaderboard (weekly + cumulative) |
| FR42 | Epic 8 | Multiple mini-league membership |
| FR43 | Epic 8 | Leave mini-league |
| FR44 | Epic 2 | Guided tutorial (two prediction types, 5 core rules) |
| FR45 | Epic 2 | Onboarding completable in <60 seconds |
| FR46 | Epic 3 | Push notification: Match Builder window open |
| FR47 | Epic 4 | Push notification: Results ready |
| FR48 | Epic 9 | Admin: gameweek status view |
| FR49 | Epic 9 | Admin: manual rescore trigger |
| FR50 | Epic 9 | Admin: flag match as void |
| FR51 | Epic 9 | Admin: user score breakdown investigation |
| FR52 | Epic 9 | System error logging (API fetches + scoring operations) |
| FR53 | Epic 9 | Admin: catalog management (MVP: Supabase Studio direct edits) |

## Epic List

### Epic 1: Foundation — Project Scaffold & Infrastructure
All subsequent epics depend on this foundation. Delivers the complete technical platform: monorepo, mobile app skeleton, Supabase project, shared type system, design token system, and CI/CD pipeline.
**FRs covered:** None directly — prerequisite for FR1–FR53
**ARs covered:** AR1, AR2, AR8, AR10, AR11, AR14, AR17
**UX-DRs covered:** UX-DR1, UX-DR2, UX-DR3

### Epic 2: Account, Authentication & Onboarding
Users can register with Apple or Google, manage their display name, grant push notification permissions, and understand the game in under 60 seconds via a 5-rule single-screen tutorial.
**FRs covered:** FR1, FR2, FR3, FR44, FR45
**ARs covered:** AR3, AR4, AR5

### Epic 3: Gameweek Data Pipeline
The system automatically fetches and locks odds from the external API, generates the gameweek moment catalog with point values, ingests match event data (goals, cards, subs, corners with player + minute) after each match, detects gameweek completion, and sends the Match Builder open push notification. The automated data backbone that feeds both the scoring engine and the mobile catalog.
**FRs covered:** FR4, FR5, FR6, FR7, FR8, FR9, FR10, FR46
**ARs covered:** AR6, AR7 (ingest-odds, ingest-events Edge Functions), AR9 (pg_cron jobs)
**NFRs addressed:** NFR15, NFR16, NFR21, NFR22

### Epic 4: Scoring Engine & Results Processing
The system scores every user's 20 tokens using multi-layer additive scoring (event + timing + precision bonuses per event type), awards exact-minute jackpot bonuses, applies captain 2x, calculates cross-match streaks ordered by real-world event time, awards streak bonus points (additive: 2nd hit +10 pts, 3rd +20 pts, 4th+ +30 pts), handles postponed matches, materialises leaderboard entries, and sends the results-ready push notification. Zero-tolerance for errors: halt + Sentry alert on detection.
**FRs covered:** FR23, FR24, FR25, FR26, FR27, FR28, FR29, FR30, FR47
**ARs covered:** AR7 (run-scoring, send-notifications Edge Functions), AR12, AR13, AR15, AR16, AR18
**NFRs addressed:** NFR12, NFR19, NFR20

### Epic 5: Match Builder — Full Squad Building
Users can browse all gameweek fixtures, explore the moment catalog (filterable by type and event), add Match Moments with one tap, build Precision Picks via the guided micro-flow (player → minute → zone) for all five event types, designate a captain, remove or replace picks, save their squad, and view it in the Moments View in both fixture-grouped and chronological streak-sequence order.
**FRs covered:** FR11, FR12, FR13, FR14, FR14a, FR15, FR16, FR17, FR18, FR20, FR21, FR22
**UX-DRs covered:** UX-DR4–14, UX-DR22–26, UX-DR28–30
**NFRs addressed:** NFR1, NFR2, NFR3, NFR8, NFR9, NFR11

### Epic 6: Score Reveal & Results
Users experience the full emotional reveal sequence — sequential card-by-card animation (lime hits, grey misses, gold captain flash, gold jackpot burst with heavy haptic), per-pick scoring breakdowns across all layers, and their streak chain visualised in real-world event order. Supports first-view dramatic animation and fast summary on return visits. The Locked/Live state shows the BoldnessHeroCard with Boldness tier and possible points.
**FRs covered:** FR31, FR32, FR33, FR34
**UX-DRs covered:** UX-DR15, UX-DR16, UX-DR17, UX-DR18, UX-DR19
**NFRs addressed:** NFR4

### Epic 7: Leaderboards
Users can view the weekly gameweek leaderboard and the season cumulative leaderboard (global), see their own rank and score on both, and view their mini-league leaderboard with position movement indicators (↑/↓). Leaderboard data is materialised post-scoring — never computed on-demand.
**FRs covered:** FR35, FR36, FR37, FR41
**UX-DRs covered:** UX-DR20
**NFRs addressed:** NFR5

### Epic 8: Mini-Leagues & Social Sharing
Users can create a named mini-league, generate and share an invite link via the native share sheet, join a league via deep link (surviving App Store install), belong to multiple leagues simultaneously, and leave a league. Squad and results are shareable as purpose-built 1080×1350px graphics (match-picks, moment-picks, and results variants).
**FRs covered:** FR38, FR39, FR40, FR42, FR43
**UX-DRs covered:** UX-DR21, UX-DR23, UX-DR27
**NFRs addressed:** NFR18

### Epic 9: Admin & Operations
The ops role can view full gameweek lifecycle status, manually trigger a rescore, flag a match as void, investigate any user's score breakdown, and manage the moment catalog. Full observability via Sentry high-priority alerts for scoring errors and Supabase function logs for ingestion operations.
**FRs covered:** FR48, FR49, FR50, FR51, FR52, FR53
**ARs covered:** AR10 (Sentry full config), AR11 (CI/CD full)

---

## Epic 1: Foundation — Project Scaffold & Infrastructure

All subsequent epics depend on this foundation. Delivers the complete technical platform: pnpm monorepo, Expo mobile app skeleton, Supabase project with full Drizzle schema, shared type system, OLED Sharp design token system, mobile state layer, and CI/CD pipeline with error monitoring.

### Story 1.1: Monorepo & Mobile App Scaffold

As a **developer**,
I want the pnpm monorepo initialized with the Expo mobile app and all required native packages installed,
So that the project has a runnable foundation that all subsequent stories can build on.

**Acceptance Criteria:**

**Given** the repo is cloned and `pnpm install` is run from root
**When** all workspace packages resolve
**Then** `apps/mobile`, `apps/supabase`, and `packages/types` are recognized workspace members with no dependency errors

**Given** the Expo app is scaffolded via `create-expo-app@latest --template default` in `apps/mobile`
**When** the developer runs `npx expo start` from `apps/mobile`
**Then** the app renders on a physical device via Expo Go without errors
**And** NativeWind v4 class names apply correctly on a test component
**And** `react-native-reanimated`, `expo-haptics`, `expo-sharing`, `expo-build-properties` are all importable without error

**Given** `app.config.ts` is initialized
**When** the Expo build reads config
**Then** `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are accessible as env vars
**And** the deep link scheme is defined for mini-league invite links
**And** `expo-build-properties` includes the `react-native-view-shot` plugin entry (required per Architecture gap resolution AR16)

### Story 1.2: Design System Foundation

As a **developer**,
I want the OLED Sharp colour palette, Inter typography scale, and 8px spacing system defined as Tailwind tokens,
So that all components reference a single source of truth for colours, type, and spacing — never hardcoded values.

**Acceptance Criteria:**

**Given** `tailwind.config.js` is configured with NativeWind's React Native preset
**When** a component uses colour token classes
**Then** `bg-primary` → `#080808`, `bg-surface` → `#141414`, `bg-elevated` → `#1C1C1C`
**And** `accent` / `success` → `#B4FF32`, `jackpot` / `captain` → `#FFD700`, `deadline` → `#FF6B35`, `streak` → `#A78BFA`, `miss` → `#303030`
**And** all semantic colour tokens from UX-DR1 are defined and named exactly as specified

**Given** Inter is loaded via `@expo-google-fonts/inter`
**When** the app renders
**Then** all seven type scale variants are available: display (32px/700), heading-1 (24px/700), heading-2 (18px/600), body (15px/400), label (13px/500), caption (11px/400), mono-number (20px/700)
**And** `fontVariant: ['tabular-nums']` is applied to the mono-number variant
**And** a system font fallback (SF Pro / Roboto) renders during Inter load

**Given** spacing and radius tokens are defined per UX-DR3
**When** a component applies them
**Then** space-1 (4px) through space-8 (48px) resolve correctly
**And** radius-sm (4px), radius-md (6px), radius-lg (8px), radius-full (9999px) are available

### Story 1.3: Supabase Project & Database Schema

As a **developer**,
I want the Supabase project initialized with the complete Drizzle schema and local dev stack running,
So that all subsequent epics can build against a type-safe, locally-testable database.

**Acceptance Criteria:**

**Given** `supabase init` has been run in `apps/supabase`
**When** the developer runs `supabase start`
**Then** the local Supabase stack starts (PostgreSQL, Auth, Edge Functions runtime, Studio) without errors

**Given** the Drizzle schema is defined across `packages/types/src/` files
**When** `drizzle-kit generate` is run
**Then** `apps/supabase/migrations/0001_initial_schema.sql` is produced containing all core tables: `users`, `gameweeks`, `fixtures`, `game_week_moments`, `moment_types`, `predictions`, `match_events`, `scoring_results`, `leaderboard_entries`, `mini_leagues`, `league_memberships`, `scoring_errors`
**And** all table names are `plural snake_case`; column names are `snake_case`; booleans use `is_` or `has_` prefix; timestamps use `_at` suffix
**And** `gameweeks` includes a `scoring_status` column with check constraint: `pending | in_progress | complete | error`
**And** `predictions` includes a check constraint enforcing max 20 rows per `(user_id, gameweek_id)`
**And** the schema includes a mechanism to track per-user per-gameweek reveal state — either a `has_seen_reveal` boolean column on a `user_gameweek_states` table or equivalent — so the one-time reveal animation is never re-triggered (consumed by Epic 6 Story 6.2)

**Given** `apps/supabase/migrations/0002_rls_policies.sql` is created
**When** the migration is applied
**Then** RLS is enabled on the `predictions` table with a skeleton own-rows policy (to be enforced in Epic 2)

**Given** TypeScript interfaces are exported from `packages/types/src/index.ts`
**When** any workspace package imports `@lecolpo/types`
**Then** `Prediction`, `GameweekState`, `ScoringResult`, `MomentCard`, `MiniLeague`, `LeaderboardEntry`, and all other shared interfaces defined in the Architecture's `packages/types/src/` structure resolve with no type errors

### Story 1.4: Mobile Infrastructure — Data Layer & Navigation Skeleton

As a **developer**,
I want the Supabase client, TanStack Query, Zustand stores, and Expo Router screen structure initialized,
So that all mobile screens have a working data layer and navigation skeleton ready to build on.

**Acceptance Criteria:**

**Given** `lib/supabase.ts` is the sole Supabase client initialization point
**When** any hook or screen imports the client
**Then** it imports only from `lib/supabase.ts` — no other Supabase client initializations exist in the codebase

**Given** `QueryClientProvider` wraps the root layout in `app/_layout.tsx`
**When** a screen uses a TanStack Query hook
**Then** it resolves against the shared `QueryClient` with no parallel local `isLoading` state created

**Given** three Zustand stores are created: `useGameweekStore`, `useBuildStore`, `useRevealStore`
**When** a component imports from any store
**Then** each store holds only client UI state — no server data is duplicated from the TanStack Query cache
**And** each store lives in its own file under `src/stores/`

**Given** the Expo Router file structure is initialized per the Architecture directory spec
**When** the app navigates
**Then** `(tabs)/build.tsx`, `(tabs)/moments.tsx`, `(tabs)/leagues.tsx`, `(tabs)/profile.tsx` exist as working placeholder screens
**And** `catalog/[fixtureId].tsx`, `microflow/player.tsx`, `microflow/timing.tsx`, `onboarding.tsx` exist as placeholder screens
**And** all screens render without crashing and the tab bar navigates correctly between tabs

### Story 1.5: CI/CD Pipeline & Error Monitoring

As a **developer**,
I want GitHub Actions CI/CD and Sentry error monitoring configured,
So that every push to main automatically validates, deploys, and builds — and errors are surfaced with appropriate priority.

**Acceptance Criteria:**

**Given** `.github/workflows/ci.yml` is created
**When** a commit is pushed to `main`
**Then** the workflow runs in sequence: Jest tests → `supabase db push` → `supabase functions deploy --all` → Expo EAS production build
**And** each step only runs if the previous step passes

**Given** a PR is opened against `main`
**When** CI runs on the PR
**Then** an Expo EAS Preview channel build is triggered (not production)

**Given** Sentry is initialized in `lib/sentry.ts` with an error boundary in `app/_layout.tsx`
**When** the mobile app encounters an uncaught JS error or render failure
**Then** Sentry captures it and the error boundary prevents a blank crash screen

**Given** the Sentry Deno SDK is initialized in `functions/_shared/`
**When** an Edge Function throws an uncaught exception
**Then** it is captured in the `edge-functions` Sentry environment
**And** any error originating from the `run-scoring` function is configured as a high-priority Sentry alert

---

## Epic 2: Account, Authentication & Onboarding

Users can register with Apple or Google, manage their display name, control push notification permissions, and understand the game in under 60 seconds via a 5-rule single-screen tutorial.

### Story 2.1: Social Login (Apple & Google)

As a **new user**,
I want to sign in with my Apple or Google account,
So that I can access the app without creating a password.

**Acceptance Criteria:**

**Given** the user opens the app for the first time
**When** they tap "Sign in with Apple" or "Sign in with Google"
**Then** the OS-native OAuth flow launches and completes
**And** a Supabase session is created with a short-lived access token stored in `expo-secure-store`
**And** the user record is created in the `users` table on first sign-in

**Given** a returning user opens the app
**When** their stored token is still valid
**Then** they are authenticated silently — no sign-in screen shown
**And** the token refreshes automatically via the Supabase JS client

**Given** a user's session has expired
**When** they open the app
**Then** they are returned to the sign-in screen
**And** no other users' data is accessible before authentication

### Story 2.2: User Profile — Display Name

As a **signed-in user**,
I want to view and edit my display name,
So that I appear correctly on leaderboards and in mini-leagues.

**Acceptance Criteria:**

**Given** the user navigates to `(tabs)/profile.tsx`
**When** the screen loads
**Then** their current display name is shown and an edit action is available

**Given** the user edits their display name and saves
**When** the save request completes
**Then** the `users` table is updated with the new display name
**And** the updated name is reflected immediately in the UI

**Given** the user submits an empty or whitespace-only display name
**When** the save is attempted
**Then** an inline validation error is shown — no modal, no toast
**And** the save request is not submitted

### Story 2.3: Push Notification Permission & Token Registration

As a **signed-in user**,
I want to be prompted to allow push notifications during onboarding,
So that I receive Match Builder open and results-ready alerts at the right times.

**Acceptance Criteria:**

**Given** the user completes the onboarding flow
**When** the OS push notification permission prompt is shown
**Then** it is requested via `Expo Notifications` using `lib/notifications.ts`

**Given** the user grants push notification permission
**When** the Expo push token is retrieved
**Then** it is stored server-side associated with their `user_id`
**And** no notification is sent at this stage — the token is stored for use by the `send-notifications` Edge Function in Epic 4

**Given** the user denies push notification permission
**When** onboarding completes
**Then** the app continues without error — push notifications are optional, not blocking
**And** the absence of a push token is handled gracefully (skip that user) by `send-notifications`

**Given** the user navigates to their profile and toggles notifications off
**When** the change is saved
**Then** the push token is removed from the server

### Story 2.4: RLS Prediction Privacy Policies

As a **system**,
I want row-level security enforced at the database layer for prediction privacy,
So that users can never read each other's picks before the deadline, regardless of client behaviour.

**Acceptance Criteria:**

**Given** RLS is enabled on the `predictions` table
**When** a user queries predictions before `gameweeks.first_kickoff`
**Then** they can only SELECT and INSERT their own rows — other users' rows are invisible
**And** this enforcement is at the database layer — no client-side code can bypass it

**Given** `gameweeks.first_kickoff` has passed
**When** any authenticated user queries predictions for that gameweek
**Then** all rows become readable (post-deadline public visibility)

**Given** `scoring_results` rows exist for a gameweek
**When** a user queries them
**Then** rows are only readable when `gameweeks.scoring_status = 'complete'`
**And** rows are never readable before scoring completes, regardless of `first_kickoff`

**Given** an admin user (JWT claim `role: 'admin'`) queries any table
**When** the request is made
**Then** the admin role bypasses user-scoped RLS policies
**And** no service-role key is exposed to any client application — admin auth uses custom JWT claims only

### Story 2.5: Onboarding Tutorial Screen

As a **new user**,
I want a single-screen tutorial that explains Match picks, Moment picks, captain, streaks, and the 20-token limit,
So that I understand how the game works in under 60 seconds and feel confident starting my first squad.

**Note:** This screen uses static content only. Tutorial copy and visual examples should be finalized after Epic 5 (Match Builder) is complete so the rules described accurately match the real UI the user will encounter. The screen can be scaffolded now with placeholder content.

**Acceptance Criteria:**

**Given** a user signs in for the first time and `has_seen_onboarding` is false
**When** the app loads after authentication
**Then** they are routed to `onboarding.tsx` before reaching the Build View

**Given** the onboarding screen renders
**When** the user reads it
**Then** it presents exactly 5 core rules on a single screen — no carousel, no scroll required
**And** Match and Moment prediction types are visually distinguished using TypeBadge (lime MATCH, violet MOMENT)
**And** the 20-token limit, captain mechanic, and streak concept are each explained in one line
**And** the screen is completable by reading in under 60 seconds

**Given** the user taps the primary CTA
**When** onboarding completes
**Then** `has_seen_onboarding` is set to `true` in the `users` table
**And** the OS push notification permission prompt is shown (Story 2.3 integration)
**And** the user is routed to the Build View

**Given** a returning user opens the app and `has_seen_onboarding` is true
**When** the app loads
**Then** `onboarding.tsx` is bypassed entirely — they land directly in the Build View

---

## Epic 3: Gameweek Data Pipeline

The system automatically fetches and locks odds, generates the moment catalog, ingests match events after each match, detects gameweek completion, and chains into the scoring engine. The automated data backbone that feeds everything downstream.

### Story 3.0: Odds-to-Points Formula Design & Calibration

As a **developer / product owner**,
I want the odds-to-points conversion formula defined, calibrated against real Premier League odds, and documented as named constants before any odds converter code is written,
So that Match and Moment picks score simple, human-readable integer points (e.g. 10–80 pts) that feel proportional — never raw probability-scaled numbers like 456.

**Acceptance Criteria:**

**Given** a set of representative Premier League odds values is sampled (e.g. odds 1.2, 1.5, 2.0, 3.0, 5.0, 10.0)
**When** the formula is applied
**Then** a strong-favourite outcome (odds ~1.2) produces ~10–20 base points
**And** an evens outcome (odds ~2.0) produces ~30–50 base points
**And** a longshot outcome (odds ~5.0) produces ~60–90 base points
**And** no base Match event score exceeds 120 points — Precision Pick bonus layers (player, zone) are always additive on top

**Given** the formula is agreed
**When** it is committed to the codebase
**Then** the formula and target range are documented as named constants in `functions/_shared/constants.ts` (e.g. `ODDS_SCALE_FACTOR`, `MAX_BASE_POINTS`)
**And** `functions/_shared/odds-converter.ts` (Story 3.2) must use only these constants — no magic numbers in the conversion logic

**Given** Story 3.2 implements `odds-converter.ts`
**When** Story 3.0 is not yet complete
**Then** Story 3.2 is blocked — the converter cannot be implemented without the agreed formula

**Note:** The simplest viable formula is `points = round(clamp((decimal_odds - 1) * SCALE_FACTOR, MIN_PTS, MAX_PTS))`. Calibrate `SCALE_FACTOR` by running the formula against 2–3 gameweeks of historical odds data before committing the constant.

---

### Story 3.1: External API Client Infrastructure

As a **system**,
I want provider-agnostic API clients for the odds and match events APIs with built-in retry logic,
So that all external API calls are isolated to a single entry point per provider and can tolerate transient failures.

**Acceptance Criteria:**

**Given** `functions/_shared/api-clients/odds-api.ts` is created
**When** any Edge Function needs odds data
**Then** it calls only this file — no other file in the codebase calls the Odds API directly
**And** the API key is read from Edge Function environment secrets, never hardcoded or in the client bundle

**Given** `functions/_shared/api-clients/events-api.ts` is created
**When** any Edge Function needs match event data
**Then** it calls only this file — no other file calls the Events API directly

**Given** either API client makes a request and receives a transient error (5xx or timeout)
**When** the retry logic runs
**Then** it retries up to 3 times with exponential backoff (2× delay per retry)
**And** after 3 failures it returns a structured `{ error: { code, message } }` — it does not throw

**Given** both clients return data
**When** the response is typed
**Then** it maps to shared interfaces from `@lecolpo/types`

### Story 3.2: Odds Ingestion & Moment Catalog Generation

As a **system**,
I want to fetch odds from the external API, convert them to integer point values, and populate the gameweek moment catalog,
So that the Match Builder has accurate, locked point values for every fixture event when the build window opens.

**Acceptance Criteria:**

**Given** the `ingest-odds` Edge Function is invoked
**When** it runs successfully
**Then** it calls the odds API client (Story 3.1) for all fixtures in the current gameweek
**And** `functions/_shared/odds-converter.ts` converts each raw odds value to an integer point value using the configurable formula — no floats; a float result is a formula design error
**And** `game_week_moments` rows are created/updated with locked point values per fixture per event type
**And** `gameweeks.status` is set to `Building`

**Given** the odds API is unavailable during ingestion
**When** all 3 retries are exhausted
**Then** the function returns `{ error: { code: 'ODDS_FETCH_FAILED', message: ... } }`
**And** `gameweeks.status` remains unchanged (not set to Building)
**And** the failure is logged via `console.error` (surfaced in Supabase function logs)

**Given** `ingest-odds` completes successfully
**When** the catalog is live
**Then** the `send-notifications` Edge Function is invoked to dispatch the Match Builder open push notification (FR46) to all users with a registered push token

**Given** raw odds values exist in the API response
**When** they are stored
**Then** only derived integer point values are persisted in `game_week_moments` — raw odds are never stored or exposed (NFR8)

**Given** `functions/send-notifications/index.ts` and `functions/_shared/push-sender.ts` are implemented as part of this story
**When** `send-notifications` is invoked with a notification type and payload
**Then** it looks up all users with a registered push token
**And** dispatches the notification via the Expo Push API → APNs/FCM
**And** users with no registered push token are skipped gracefully
**And** the function returns `{ data, error }` — delivery is best-effort, no guaranteed SLA for MVP

### Story 3.3: Match Event Ingestion & Gameweek Completion Detection

As a **system**,
I want to fetch match events after each match completes and detect when the full gameweek is done,
So that the scoring engine is triggered automatically once all data is available.

**Acceptance Criteria:**

**Given** the `ingest-events` Edge Function is invoked for a specific fixture
**When** it runs successfully
**Then** it fetches goals, cards, substitutions, and corners — each with player identity and minute
**And** all events are stored in `match_events` as `(match_id, event_type, player_id, minute, team_id, created_at)` rows
**And** the fixture is marked `events_ingested = true` in the `fixtures` table

**Given** a match event is stored in `match_events`
**When** it is later queried by two different consumers
**Then** the scoring engine (Epic 4) and the historical stat dots feature (Epic 5) both read from this same table — no separate storage needed

**Given** `ingest-events` completes for a fixture
**When** it checks the gameweek
**Then** if all fixtures have `events_ingested = true`, it invokes `run-scoring` via `supabase.functions.invoke()` — not via HTTP from mobile
**And** if any fixture is still pending, it exits without invoking scoring

**Given** event data is missing or delayed beyond 2 hours post-match
**When** the threshold is exceeded
**Then** a record is inserted into `scoring_errors` flagging the fixture for manual intervention

**Given** a match is postponed
**When** `ingest-events` processes that fixture
**Then** the fixture is marked postponed in `fixtures`
**And** associated prediction tokens for that fixture score 0 points (FR29)

### Story 3.4: Gameweek Lifecycle Scheduling & Development Seed Data

As a **system**,
I want pg_cron jobs defined for the automated gameweek lifecycle and seed data available for development,
So that the full pipeline runs on schedule in production and all subsequent epics can be developed without live API access.

**Acceptance Criteria:**

**Given** `apps/supabase/migrations/0003_pg_cron_jobs.sql` is created
**When** the migration is applied
**Then** a pg_cron job is defined to invoke `ingest-odds` on a configurable schedule (~3–4 days before first kickoff)
**And** a pg_cron job is defined to invoke `ingest-events` on a per-fixture configurable schedule (after each match's expected end time)
**And** both job schedules are stored as configurable values — not hardcoded cron expressions

**Given** `gameweeks.first_kickoff` timestamp is reached
**When** any client attempts to INSERT or UPDATE a prediction for that gameweek
**Then** the RLS write policy blocks it automatically — no cron job or Edge Function action required for locking (FR8)

**Given** seed files are created in `apps/supabase/seeds/`
**When** a developer runs them against the local Supabase stack
**Then** `dev_gameweek.sql` creates a gameweek in Building state with realistic `first_kickoff` and `scoring_status = 'pending'`
**And** `dev_fixtures.sql` creates 10 fixtures with populated `game_week_moments` rows using realistic integer point values
**And** `dev_users.sql` creates 3 test users with auth records
**And** Epic 5 (Match Builder) can be fully developed against this seed data without any live API calls

---

## Epic 4: Scoring Engine & Results Processing

The system scores every user's 20 tokens with full multi-layer additive scoring, calculates cross-match streaks, materialises leaderboard entries, and dispatches the results-ready push notification. Zero tolerance for errors.

### Story 4.1: Scoring Engine — Full Multi-layer Scoring Logic

As a **system**,
I want a fully tested scoring engine that calculates points for all prediction types across all scoring layers,
So that every user's gameweek score is calculated correctly with zero tolerance for errors.

**Acceptance Criteria:**

**Given** `functions/_shared/scoring-engine.ts` is implemented
**When** a Match Moment prediction is evaluated against `match_events`
**Then** it scores the configured integer point value if the event occurred, 0 if it did not (FR23)

**Given** a Precision Pick prediction is evaluated
**When** the event occurred in the match
**Then** the event layer points are awarded
**And** if the event's real-world minute falls within the user's confidence window (±5/±10/±15), the timing bonus is awarded
**And** if the event minute equals the user's predicted minute exactly, the jackpot bonus is awarded in addition to the timing bonus (FR25)

**Given** a Goal Precision Pick is evaluated
**When** scoring runs
**Then** scorer bonus is awarded if the correct player scored
**And** assister bonus is awarded independently if the correct player assisted — all layers are additive, no layer blocks another (FR24)

**Given** a Substitution Precision Pick is evaluated
**When** scoring runs
**Then** player-on bonus is awarded if the correct player came on
**And** player-off bonus is awarded independently if the correct player went off

**Given** a Corner Precision Pick is evaluated
**When** scoring runs
**Then** zone bonus is awarded if the correct zone was predicted

**Given** a Yellow Card or Red Card Precision Pick is evaluated
**When** scoring runs
**Then** player bonus is awarded if the correct player received the card

**Given** any Precision Pick is evaluated and the event did not occur in the match
**When** scoring runs
**Then** all layers score 0 — no negative points are ever awarded

**Given** a pick is designated as Captain
**When** its total points across all layers are calculated
**Then** the 2x multiplier is applied to the complete layer total, not to individual layers (FR26)

**Given** `scoring-engine.test.ts` covers all event types
**When** the test suite runs
**Then** all scenarios pass: all-layers-hit, partial credit, zero (event missed), jackpot bonus, captain 2x, captain on a zero-scoring pick

### Story 4.2: Cross-match Streak Calculator

As a **system**,
I want a streak calculator that orders correct Precision Picks by real-world event time across all matches and awards streak bonus points to consecutive correct picks,
So that the streak mechanic rewards users who correctly predicted the sequence of events across the full gameweek.

**Acceptance Criteria:**

**Given** `functions/_shared/streak-calculator.ts` is implemented
**When** it receives a user's Precision Pick results for a gameweek
**Then** it orders them by real-world event time (actual `match_events.minute` + match kickoff timestamp) — not by predicted minute, not by fixture order (FR27)

**Given** the picks are ordered by real-world event time
**When** the streak calculation runs
**Then** consecutive correct Precision Picks form a streak
**And** a flat streak bonus is awarded to picks 2, 3, 4... in the streak — the first correct pick in a streak receives no bonus: 2nd consecutive hit = +10 pts, 3rd consecutive = +20 pts, 4th+ consecutive = +30 pts; these values are defined as `STREAK_BONUSES` constant in `functions/_shared/constants.ts`
**And** a miss breaks the streak — the next correct pick starts a new streak at baseline (FR28)

**Given** correct Precision Picks span separate matches with non-consecutive event times
**When** the calculator runs
**Then** streak breaks are determined by real-world event ordering, not match grouping

**Given** a user has zero correct Precision Picks
**When** the calculator runs
**Then** it returns an empty streak sequence with no multipliers — no error thrown

**Given** `streak-calculator.test.ts` covers complex multi-match scenarios
**When** the test suite runs
**Then** all scenarios pass: single streak across 3+ matches, streak broken mid-gameweek, multiple separate streaks, picks from parallel-kickoff matches ordered by minute within match

### Story 4.3: Scoring Orchestrator, Results Persistence & Push Notification

As a **system**,
I want the scoring orchestrator to coordinate the full scoring run, persist results, materialise leaderboards, and notify users — halting safely if any error occurs,
So that results are always accurate, the reveal screen has data to display, and users are notified when their results are ready.

**Acceptance Criteria:**

**Given** `run-scoring/index.ts` is invoked
**When** execution begins
**Then** `gameweeks.scoring_status` is set to `in_progress` immediately
**And** the orchestrator calls `scoring-engine.ts` and `streak-calculator.ts` — it contains no scoring logic itself

**Given** scoring completes without errors for all users
**When** results are persisted
**Then** one `scoring_results` row is written per prediction per user, containing all layer scores and bonuses
**And** `leaderboard_entries` rows are created/updated for both weekly and cumulative season leaderboards
**And** `gameweeks.scoring_status` is set to `complete`
**And** `send-notifications` is invoked to dispatch the results-ready push notification (FR47)

**Given** any error occurs during scoring
**When** the error is caught
**Then** `gameweeks.scoring_status` is set to `error`
**And** a record is inserted into `scoring_errors` with error details
**And** `Sentry.captureException()` is called with high-priority classification
**And** no technical detail is exposed to users — the mobile app reads `scoring_status = 'error'` and shows "Results delayed — we're looking into it"

**Given** the admin manually invokes `admin-rescore` (built in Epic 9)
**When** it runs
**Then** it invokes `run-scoring` identically to the automatic chain — manual and automatic rescores are the same code path

---

## Epic 5: Match Builder — Full Squad Building

Users can browse all gameweek fixtures, explore the moment catalog, add both Match Moments and Precision Picks, designate a captain, manage their squad, save it, and review it in the Moments View. The core game loop on mobile.

### Story 5.1: App State Machine & Gameweek Phase Detection

As a **user**,
I want the app to automatically show the right view based on the current gameweek phase,
So that I always land in the correct context — building my squad, waiting for results, or seeing the reveal.

**Acceptance Criteria:**

**Given** the app comes to the foreground
**When** `AppState` fires a `change` event to `'active'`
**Then** the current gameweek record is fetched from Supabase
**And** the phase is derived: `now < first_kickoff` → `Building`; `first_kickoff ≤ now < scoring_complete` → `Locked`; `scoring_status = 'complete' AND !reveal_seen` → `Reveal`
**And** the derived phase is stored in `useGameweekStore` for synchronous reads across all components

**Given** the gameweek phase is `Building`
**When** the user opens the app
**Then** `(tabs)/build.tsx` (Build View) is the active home screen

**Given** the gameweek phase is `Locked`
**When** the user opens the app
**Then** `(tabs)/moments.tsx` (Moments View) is the active home screen with locked state UI

**Given** the gameweek phase is `Reveal`
**When** the user opens the app for the first time after scoring completes
**Then** the reveal sequence is triggered (Epic 6 implements the animation — this story gates the condition correctly)

**Given** `useGameweekQuery` fetches the current gameweek
**When** the TanStack Query key is used
**Then** it uses exactly `['gameweek', 'current']` — no invented key structures

### Story 5.2: Build View — Fixture Cards & Match Moment Selection

As a **user**,
I want to browse gameweek fixtures, tap into a moment catalog, and add Match picks with a single tap,
So that I can quickly build the straightforward part of my squad without friction.

**Acceptance Criteria:**

**Given** the Build View renders in `Building` phase
**When** the screen loads
**Then** `GameweekHeader` shows "GW {n}" left and "{used}/20" events counter right in lime with tabular-nums
**And** all fixtures are listed as `FixtureCard` components sorted by kickoff time
**And** the events counter reflects picks already saved to the DB (TanStack Query cache-first)

**Given** a fixture card has no picks
**When** the user taps it
**Then** they navigate to `catalog/[fixtureId].tsx` for that fixture

**Given** the Moment Catalog screen loads
**When** data is fetching
**Then** three skeleton rows animate at row height — no centred spinner
**And** filter chips (All / Match / Moment) appear at top, defaulting to "All", resetting to "All" on each open

**Given** the catalog renders
**When** the user views a Match-type row
**Then** `MomentCatalogRow` shows: event icon + event name + `TypeBadge` (lime MATCH) + flat integer point value (e.g. "350")
**And** no → arrow is shown

**Given** the user taps a Match-type catalog row
**When** the pick is added
**Then** they are returned to Build View immediately — no confirmation dialog
**And** the pick appears on the fixture card and the events counter increments (optimistic update)
**And** a ✓ indicator appears on that row in the catalog on next visit

**Given** the user taps a row already marked ✓
**When** the tap registers
**Then** nothing happens — the tap is a no-op (prevents double-picks)

**Given** historical `match_events` data exists for that event type + team from prior gameweeks
**When** the user views a catalog row detail
**Then** a ✓/✗ dot history is shown (UX-DR30) — only real accumulated data, no filler if insufficient history exists

**Given** `DeadlineStrip` is rendered
**When** more than 3 hours remain
**Then** it is not rendered at all
**And** under 1 hour it shows orange text with tinted background
**And** under 15 minutes it shows a full orange strip with pulse animation and `accessibilityLiveRegion="polite"`

### Story 5.3: Squad Management — Captain, Remove & Save

As a **user**,
I want to designate a captain, remove picks I've changed my mind about, and save my squad to the server,
So that my predictions are locked in and reflect my actual strategy before the deadline.

**Acceptance Criteria:**

**Given** a fixture card is expanded and has picks
**When** the user taps an existing `PickRow`
**Then** `CaptainPopup` appears — a bottom sheet with "👑 Select as Captain" and "✕ Remove pick" actions
**And** tapping the backdrop dismisses without action

**Given** the user selects "👑 Select as Captain"
**When** the action completes
**Then** the 👑 icon appears on that `PickRow`
**And** the previous captain's 👑 is silently removed — no popup, no toast
**And** only one captain exists across the entire squad at any time (FR17)

**Given** the user selects "✕ Remove pick"
**When** the action completes
**Then** the pick disappears from the fixture card and the events counter decrements (optimistic update)
**And** the ✓ indicator is cleared from that row in the catalog

**Given** the user taps Save at the bottom of Build View
**When** the mutation fires
**Then** all current picks are persisted to `predictions` via TanStack Query mutation using `onMutate` + `onError` rollback pattern
**And** the server enforces the 20-token limit — if exceeded, the mutation returns an error and a bottom toast shows "Too many picks — remove some and try again"
**And** on success the user is routed to Moments View (FR21)

**Given** a save or remove request fails due to a network error
**When** the error is caught
**Then** a non-blocking bottom toast shows "Couldn't save — tap to retry" and auto-dismisses after 4 seconds
**And** TanStack Query's `onError` rollback restores the previous optimistic state

### Story 5.4: Precision Pick Micro-flow

As a **user**,
I want to build a Precision Pick by selecting a player, a predicted minute, and a confidence window through a guided two-screen flow,
So that I can make a detailed prediction with full visibility of how my choices affect my potential points.

**Acceptance Criteria:**

**Given** the user views a Moment-type row in the Moment Catalog
**When** it renders
**Then** a → arrow is shown signalling a multi-step flow opens on tap
**And** the points display shows "420+" to signal a variable ceiling

**Given** the user taps the Moment-type row
**When** `microflow/player.tsx` (Step 1) loads
**Then** a scrollable player list renders with each player's name and their scoring bonus
**And** players are sorted by scoring likelihood (odds-derived)
**And** no "Any player" option exists — selection is mandatory
**And** the confirm button on Step 2 remains inactive until a player is selected

**Given** the user selects a player and advances to `microflow/timing.tsx` (Step 2)
**When** the screen renders
**Then** `MinutePicker` shows a scroll-wheel spanning 1–90+ with snap-to-nearest and ▲/▼ tap targets (minimum 44px touch area)
**And** `ZoneChip` shows ±5 / ±10 / ±15, defaulting to ±10
**And** `PickSummaryCard` shows a running total: base event points + player bonus + zone bonus, updating immediately when ZoneChip changes

**Given** the user confirms on Step 2
**When** the pick is created
**Then** the correct event-type schema is stored: Goal (scorer + assister), Substitution (player-on + player-off), Corner (zone), Yellow Card (player), Red Card (player) — FR14a
**And** the user is returned to Build View automatically with the Precision Pick on the fixture card showing violet MOMENT TypeBadge

**Given** the user presses back from Step 1
**When** they return to the Moment Catalog
**Then** no partial pick state is saved — the flow cancels cleanly

**Given** all interactive elements in the micro-flow render
**When** accessibility is checked
**Then** `ZoneChip` has `accessibilityRole="radio"` with descriptive labels including bonus point amounts
**And** all touch targets are minimum 44×44px including MinutePicker ▲/▼ arrows

### Story 5.5: Moments View — Squad Review & Locked State

As a **user**,
I want to review my full saved squad in fixture order or chronological event-time order, and see my Boldness tier while matches are live,
So that I can verify my strategy, visualise my streak sequence, and understand how bold my predictions are while I wait for results.

**Acceptance Criteria:**

**Given** the user saves their squad and is routed to Moments View
**When** the screen loads in `Building` phase
**Then** the Match tab shows all picks grouped by fixture, sorted by kickoff time
**And** the Moment tab shows all Precision Picks in chronological predicted event-time order across all fixtures — the streak sequence preview
**And** each pick renders as a `MomentsPickRow` in pending state (dimmed, neutral)
**And** an Edit button at the bottom returns the user to Build View — no back gesture between views

**Given** the gameweek phase transitions to `Locked`
**When** the user opens the app
**Then** `BoldnessHeroCard` appears at the top of Moments View showing: `BoldnessShield` tier icon + tier name + possible points total (calculated at save time) + "Results incoming · ends {day} {time}"
**And** `BoldnessShield` displays the correct tier: Bronze (0–999), Silver (1000–2499), Gold (2500–4999), Platinum (5000+) with matching tier colours
**And** `GameweekHeader` shows the violet "Locked" badge replacing the events counter
**And** the Edit button is not shown — the squad is read-only

**Given** the Moments View has no picks for the current gameweek
**When** the screen renders
**Then** an empty state shows "Nothing saved for this gameweek" with a primary "Build your squad" button

**Given** the app starts
**When** `AccessibilityInfo.isReduceMotionEnabled()` is checked on mount
**Then** the result is stored and available to be passed into the reveal infrastructure (consumed by Epic 6)

---

## Epic 6: Score Reveal & Results

The emotional centrepiece — sequential card-by-card animation with distinct visual and haptic states, per-pick scoring breakdowns, streak chain visualisation, and a fast summary mode for return visits.

### Story 6.1: RevealCard Component & Animation States

As a **user**,
I want each prediction to reveal its outcome with distinct visual and haptic feedback,
So that hits, misses, jackpots, and captain moments each feel meaningfully different and the reveal is emotionally engaging.

**Acceptance Criteria:**

**Given** `RevealCard` renders in `pending` state
**When** it is waiting its turn in the sequence
**Then** it appears dimmed and neutral — no colour, no animation

**Given** `RevealCard` transitions to `hit` state
**When** the animation runs
**Then** a lime background fades in with a ✓ indicator
**And** a light haptic fires via `expo-haptics`

**Given** `RevealCard` transitions to `miss` state
**When** the animation runs
**Then** a dark grey (`#303030`) background fades in with a ✗ indicator
**And** no haptic fires

**Given** `RevealCard` transitions to `captain-hit` state
**When** the animation runs
**Then** a gold 2× flash plays and the crown icon pulses
**And** a medium haptic fires

**Given** `RevealCard` transitions to `jackpot` state
**When** the animation runs
**Then** a gold burst plays and the card scales up
**And** a heavy haptic fires
**And** this state is independent of captain — a non-captain pick can also jackpot

**Given** `RevealCard` receives `firstView={false}`
**When** it renders
**Then** it renders immediately in its final resolved state — no animation, no delay, no haptic

**Given** `RevealCard` receives `reduceMotion={true}`
**When** it renders
**Then** it transitions instantly to its final state — no spring, no timing animation
**And** haptics still fire (motion reduction does not imply haptic reduction)

**Given** two or more consecutive Precision Picks in the reveal sequence are both hits
**When** the streak-chain animation runs
**Then** both cards flash simultaneously (brief lime pulse synchronised across both cards) — they visually react together, not independently
**And** a streak bonus badge appears between/below the cards showing "+10", "+20", or "+30" depending on streak depth (2nd hit = +10, 3rd = +20, 4th+ = +30)
**And** the running score counter increments by the streak bonus amount immediately after the flash
**And** if `reduceMotion` is true, the bonus badge appears instantly with no flash animation

**Given** all animation states are implemented using `react-native-reanimated`
**When** the reveal runs on a mid-range Android device
**Then** animations run at 60fps — no dropped frames across the full card sequence

### Story 6.2: Reveal Sequence, Results Screen & Streak Visualisation

As a **user**,
I want my full gameweek results revealed sequentially with a running score counter, then my streak chain shown in the Moment tab, with a fast summary on any return visit,
So that the first reveal is a dramatic payoff and subsequent visits are efficient.

**Acceptance Criteria:**

**Given** the gameweek phase is `Reveal` (`scoring_status = 'complete'` AND `reveal_seen = false`)
**When** the user opens the app
**Then** Moments View opens with all picks in `pending` RevealCard state
**And** `RevealSequence` begins automatically — no tap required to start

**Given** `RevealSequence` is running
**When** each card resolves
**Then** cards reveal one at a time with a 600ms delay between them
**And** a running score counter updates after each card resolves
**And** after all cards are resolved the score counter animates up to the final total

**Given** the user opens the Moment tab after Match tab cards have resolved
**When** the tab renders
**Then** Precision Picks are shown in real-world event-time order
**And** consecutive correct picks are visually chained — the streak is visible
**And** the point where the streak broke is clearly indicated (FR34)

**Given** all cards have resolved
**When** `reveal_seen` is set to `true` in Supabase for this user + gameweek
**Then** the reveal sequence never re-triggers for this gameweek on subsequent app opens

**Given** the user returns to results after `reveal_seen = true`
**When** Moments View loads
**Then** all cards render immediately in their final resolved states — `firstView={false}` passed to all RevealCards, no sequential delay

**Given** `useResultsQuery` fetches scoring data
**When** the TanStack Query key is used
**Then** it uses exactly `['results', userId, gameweekId]`
**And** the query only resolves data when `scoring_status = 'complete'` (RLS enforcement)

**Given** the full 20-token reveal renders
**When** timing is measured on a mid-range device
**Then** the reveal screen is ready to begin animation in under 3 seconds from app open (NFR4)

**Given** `reduceMotion` is true (passed from Story 5.5 app-start check)
**When** the reveal runs
**Then** all RevealCards render in their final state instantly — no sequential animation, no delays

**Given** all cards have resolved and the user belongs to one or more mini-leagues
**When** the final score is displayed
**Then** the user's current position in each mini-league is shown inline, with a position change indicator (↑N lime / ↓N muted / — no change)
**And** this leaderboard position display appears before the share prompt — the emotional arc is: score → where did I finish? → share

**Given** the user does not belong to any mini-league
**When** the reveal completes
**Then** a prompt is shown: "No league yet — create one or join a friend's"

---

## Epic 7: Leaderboards

Users can see their competitive standing globally (weekly + cumulative) and within their mini-leagues, with position movement indicators. Leaderboard data is materialised post-scoring — never computed on-demand.

### Story 7.1: Global Leaderboards — Weekly & Season Cumulative

As a **user**,
I want to view the weekly gameweek leaderboard and the season cumulative leaderboard with my own rank and score highlighted,
So that I can see how I compare against all players and track my improvement over the season.

**Acceptance Criteria:**

**Given** the user navigates to the leaderboard section
**When** the screen loads
**Then** the weekly gameweek leaderboard shows global rankings by gameweek score
**And** the season cumulative leaderboard is available (tab or toggle) showing rankings by total season score

**Given** the leaderboard data is fetching
**When** `isLoading` is true
**Then** skeleton rows animate at `LeaderboardRow` height — no centred spinner

**Given** the leaderboard resolves
**When** it renders
**Then** each `LeaderboardRow` shows: rank + display name + score + movement indicator (↑N lime / ↓N muted / — dash)
**And** the current user's row has a 2px left lime border accent and is always visible regardless of scroll position
**And** global top 1000 loads in under 2 seconds (NFR5)

**Given** `useLeaderboardQuery` fetches global data
**When** the TanStack Query keys are used
**Then** they use exactly `['leaderboard', 'global', gameweekId]` for weekly and `['leaderboard', 'global', 'season']` for cumulative
**And** stale-while-revalidate shows the last known rank immediately while refreshing in background

### Story 7.2: Mini-League Leaderboard

As a **user**,
I want to view the weekly and cumulative leaderboard for each mini-league I belong to,
So that I can see my standing against my friends and feel the competitive social dynamic.

**Acceptance Criteria:**

**Given** the user belongs to one or more mini-leagues
**When** they view a mini-league's leaderboard
**Then** it uses the same `LeaderboardRow` component: rank + display name + score + movement indicator
**And** the current user's row has the 2px left lime border accent

**Given** the mini-league leaderboard is fetching
**When** `isLoading` is true
**Then** skeleton rows animate at row height — consistent with global leaderboard loading pattern

**Given** `useLeaderboardQuery` fetches mini-league data
**When** the TanStack Query key is used
**Then** it uses exactly `['leaderboard', 'mini-league', leagueId, gameweekId]`
**And** loads in under 2 seconds for leagues up to 100 members (NFR5)

**Given** a league member has not submitted picks for the gameweek
**When** the leaderboard renders
**Then** their score shows "—" — distinguishing no picks from zero points

---

## Epic 8: Mini-Leagues & Social Sharing

Users create leagues, invite friends, join via deep link, and share squad/results as purpose-built graphics. The primary long-term retention and social acquisition mechanic.

### Story 8.1: Mini-League Creation & Management

As a **user**,
I want to create a named mini-league, generate an invite link, view my leagues, and leave leagues I no longer want,
So that I can set up group competition with friends and manage my league memberships.

**Acceptance Criteria:**

**Given** the user navigates to `(tabs)/leagues.tsx` and is not in any league
**When** the screen renders
**Then** an empty state shows "You're not in a league yet" with a primary "Create league" button and a secondary "Join with a link" button

**Given** the user taps "Create league"
**When** the creation form renders
**Then** a `TextInput` with placeholder "Name your league" accepts input up to 30 characters
**And** a character count appears at 20+ characters ("24/30")
**And** `returnKeyType="done"` dismisses the keyboard
**And** the "Create" primary button is inactive on empty/whitespace input

**Given** the user submits a valid league name
**When** the mutation completes
**Then** a `mini_leagues` row is created and the user is added as a member in `league_memberships`
**And** a unique invite link is generated and displayed
**And** the native share sheet opens automatically so the user can share immediately

**Given** the user belongs to multiple leagues
**When** the league tab renders
**Then** all leagues are listed with member count
**And** `useLeagueQuery` uses exactly `['mini-leagues', userId]`

**Given** the user taps "Leave" on a league
**When** the action completes
**Then** their `league_memberships` row is deleted and the league disappears from their list
**And** if they were the only member, the `mini_leagues` row is also deleted

### Story 8.2: Mini-League Join via Deep Link

As a **user**,
I want to join a mini-league by tapping an invite link — even if I don't have the app installed yet,
So that I can accept a friend's invitation with no friction regardless of my starting point.

**Acceptance Criteria:**

**Given** Universal Links (iOS) and App Links (Android) are configured in `app.config.ts`
**When** an invite link is tapped on a device with the app installed
**Then** the app opens directly to the league join screen in `leagues.tsx` with `leagueId` auto-extracted by Expo Router
**And** no intermediate browser or redirect page is shown

**Given** an invite link is tapped on a device without the app installed
**When** the OS redirects to the App Store / Play Store
**Then** the deep link intent is preserved through the install flow
**And** after install and first launch, the app opens to the league join screen with the correct `leagueId`

**Given** the league join screen renders
**When** the user sees it
**Then** the league name and current member count are displayed
**And** a primary "Join" button is shown

**Given** the user taps "Join"
**When** the mutation completes
**Then** a `league_memberships` row is created for this user + league
**And** the league appears in their league tab
**And** if the user is not yet authenticated, they are routed to sign-in first and the join intent is preserved after auth

**Given** the user attempts to join a league they already belong to
**When** the mutation runs
**Then** a graceful no-op occurs — no duplicate membership, no error shown

### Story 8.3: ShareCard — Squad & Results Sharing

As a **user**,
I want to share my squad picks and results as a designed graphic via the native share sheet,
So that I can show my predictions to friends in group chats and on social media in a way that looks polished.

**Acceptance Criteria:**

**Given** the user taps Share ↗ in Moments View
**When** the active tab determines the card variant
**Then** the Match tab generates a match-picks card (lime branding, flat point values, grouped by fixture)
**And** the Moment tab generates a moment-picks card (violet branding, "420+" notation, event + player + minute)
**And** a results card (hit/miss indicators + final score + league position) is available after scoring completes

**Given** any ShareCard variant is generated
**When** it renders off-screen
**Then** it is exactly 1080×1350px (4:5 ratio) at device pixel ratio
**And** it includes: app name, GW number, user display name, picks list, max potential points
**And** more than 8 picks are summarised as "+ N more picks"
**And** the card is captured as PNG via `react-native-view-shot`

**Given** the PNG is captured
**When** `expo-sharing` opens the native share sheet
**Then** the user can send to WhatsApp, iMessage, Instagram Stories, or copy to clipboard
**And** the path from tapping Share ↗ to the share sheet appearing is no more than two taps

**Given** the off-screen ShareCard renders
**When** timing is measured
**Then** the render and capture complete in under 1 second

---

## Epic 9: Admin & Operations

The ops role can monitor gameweek lifecycle status, intervene when needed, and the system is fully observable in production via Sentry and Supabase function logs.

### Story 9.1: Admin Rescore & Void Match Edge Functions

As an **admin**,
I want to manually trigger a rescore for a gameweek and flag a match as void,
So that I can correct scoring errors and handle edge cases without touching the database directly.

**Acceptance Criteria:**

**Given** `functions/admin-rescore/index.ts` is implemented
**When** it is invoked by a user with `role: 'admin'` JWT claim
**Then** it invokes `run-scoring` identically to the automatic chain — same code path, same output
**And** `gameweeks.scoring_status` is reset to `pending` before the rescore begins
**And** existing `scoring_results` and `leaderboard_entries` rows for the gameweek are cleared before re-writing

**Given** a non-admin user attempts to invoke `admin-rescore`
**When** the JWT claim is checked
**Then** the function returns `{ error: { code: 'UNAUTHORIZED', message: 'Admin role required' } }` with HTTP 403
**And** no scoring operation runs

**Given** `functions/admin-void-match/index.ts` is implemented
**When** an admin voids a match
**Then** the fixture is marked as void in the `fixtures` table
**And** all prediction tokens for that fixture score 0 — no points awarded, tokens not returned (FR50)
**And** if scoring has already completed, `admin-rescore` must be run afterwards to recalculate affected totals

### Story 9.2: Admin Score Investigation & Error Monitoring

As an **admin**,
I want to investigate any user's full score breakdown and see system-wide error logs,
So that I can diagnose scoring issues and verify individual results without guessing.

**Acceptance Criteria:**

**Given** an admin queries a user's scoring breakdown via Supabase Studio (FR51)
**When** they access `scoring_results` rows for a specific `user_id` + `gameweek_id`
**Then** each row shows all layer scores and bonuses for that prediction
**And** the data is sufficient to reconstruct exactly how the user's total was calculated

**Given** the `scoring_errors` table is queried
**When** an admin reviews it in Supabase Studio
**Then** each row contains: gameweek_id, error code, error message, timestamp, and affected context
**And** Sentry high-priority alerts have already fired before the admin checks this table

**Given** Supabase function logs are available
**When** an admin reviews `ingest-odds` or `ingest-events` logs
**Then** each invocation's result — success, API failure, retry count — is logged via `console.error` and visible in the Supabase dashboard (FR52)

### Story 9.3: Gameweek Status View & Catalog Management

As an **admin**,
I want to see the current gameweek lifecycle status at a glance and manage the moment catalog,
So that I can confirm the pipeline is running correctly and adjust available event types when needed.

**Acceptance Criteria:**

**Given** an admin views the `gameweeks` table in Supabase Studio (FR48)
**When** they check the current gameweek record
**Then** `scoring_status`, `first_kickoff`, and fixture-level `events_ingested` flags give a complete picture of pipeline progress

**Given** an admin needs to add, remove, or modify a card type in the moment catalog (FR53)
**When** they edit `moment_types` or `game_week_moments` rows directly in Supabase Studio
**Then** the change is reflected in the mobile moment catalog on next fetch
**And** no Edge Function or code deployment is required for catalog changes in MVP

**Given** the CI/CD pipeline is fully configured (from Story 1.5)
**When** a deployment runs
**Then** the full pipeline (tests → migrations → functions → EAS build) completes without manual steps
**And** deployment status is visible via GitHub Actions run history
