---
stepsCompleted: ["step-01-document-discovery", "step-02-prd-analysis", "step-03-epic-coverage-validation", "step-04-ux-alignment", "step-05-epic-quality-review", "step-06-final-assessment"]
documentsInventoried:
  prd: "_bmad-output/planning-artifacts/prd.md"
  architecture: "_bmad-output/planning-artifacts/architecture.md"
  epics: "_bmad-output/planning-artifacts/epics.md"
  ux: "_bmad-output/planning-artifacts/ux-design-specification.md"
---

# Implementation Readiness Assessment Report

**Date:** 2026-04-30
**Project:** football-prediction-app

---

## Document Inventory

| Type | File | Size | Last Modified |
|------|------|------|---------------|
| PRD | `_bmad-output/planning-artifacts/prd.md` | 30 KB | Apr 27 |
| Architecture | `_bmad-output/planning-artifacts/architecture.md` | 49 KB | Apr 27 |
| Epics & Stories | `_bmad-output/planning-artifacts/epics.md` | 84 KB | Apr 30 |
| UX Design | `_bmad-output/planning-artifacts/ux-design-specification.md` | 82 KB | Apr 27 |

---

## PRD Analysis

### Functional Requirements

FR1: User can create an account via social login (Apple, Google)
FR2: User can view and edit their profile (display name)
FR3: User can grant or revoke push notification permissions
FR4: System can fetch and lock odds from external API when Match Builder window opens
FR5: System can convert odds to point values using a configurable scoring formula
FR6: System can populate each gameweek with the current fixture list, apply locked odds to generate match-specific point values for each card type, and make the configured catalog available when the Match Builder window opens
FR7: System can open and close the Match Builder window on a configurable schedule
FR8: System can lock all user predictions at the Match Builder deadline (first kickoff)
FR9: System can fetch match event data (goals, cards, subs, corners — with player + minute) from external API after matches complete
FR10: System can determine when all matches in a gameweek are complete and trigger scoring
FR11: User can view all fixtures in the current gameweek
FR12: User can browse the moment catalog filtered by match, event type, or team
FR13: User can add a Match Moment to their squad (match-level outcome, binary yes/no)
FR14: User can add a Precision Pick to their squad using an event-type-specific micro-flow (team → event type → minute → window → event-specific precision fields). Each event type presents only its relevant fields in sequence — no unused fields are shown.
FR14a: The Precision Pick micro-flow supports 5 event-type schemas: Goal (Scorer, Assister), Substitution (Player On, Player Off), Corner (Zone), Yellow Card (Player), Red Card (Player). Each schema has independent additive scoring layers.
FR15: User can select a confidence window (±5, ±10, or ±15 minutes) for each Precision Pick
FR16: User can see the point value breakdown for any moment before selecting it
FR17: User can designate one moment as Captain (2x points)
FR18: User can remove or replace any moment in their squad before deadline
FR19: User can use Quick Pick to auto-fill remaining empty token slots
FR20: User can view their complete squad summary before submitting
FR21: User can submit their squad (locks their 20 tokens for the gameweek)
FR22: System enforces the 20-token limit per gameweek
FR23: System can score Match Moments (correct = flat odds-derived points, incorrect = 0)
FR24: System can score Precision Picks across event-type-specific independent layers, all additive (partial credit always possible): event points + timing bonus + event-specific precision bonuses (Goal: scorer + assister; Sub: player-on + player-off; Corner: zone; Yellow/Red Card: player)
FR25: System can award exact minute jackpot bonus when a Precision Pick hits the precise minute
FR26: System can apply Captain Moment multiplier (2x) to the designated moment's total points
FR27: System can calculate cross-match streaks by ordering correct Precision Picks by real-world event time
FR28: System can apply streak multiplier to consecutive correct Precision Picks
FR29: System can handle postponed matches (tokens lost, no points awarded)
FR30: System can calculate a user's total gameweek score from all 20 tokens
FR31: User can view their gameweek results after scoring is complete
FR32: User can see per-moment scoring breakdown (which layers scored, what bonus applied)
FR33: User can see visual feedback distinguishing hits, misses, timing bonuses, and exact minute jackpots
FR34: User can view their streak sequence and where it broke
FR35: User can view a weekly gameweek leaderboard (all users, ranked by gameweek score)
FR36: User can view a season cumulative leaderboard (all users, ranked by total season score)
FR37: User can see their own rank and score on both leaderboards
FR38: User can create a mini-league with a custom name
FR39: User can generate a shareable invite link for their mini-league
FR40: User can join a mini-league via invite link (including deep link from outside the app)
FR41: User can view the mini-league leaderboard (weekly + season cumulative)
FR42: User can belong to multiple mini-leagues simultaneously
FR43: User can leave a mini-league
FR44: New user is presented with a guided tutorial explaining the two prediction types, scoring, and 5 core rules
FR45: User can complete onboarding in under 60 seconds
FR46: System can send a push notification when the Match Builder window opens
FR47: System can send a push notification when gameweek results are ready
FR48: Admin can view gameweek status (catalog loaded, odds locked, matches complete, scoring done)
FR49: Admin can manually trigger a rescore for a gameweek
FR50: Admin can flag a match as void (tokens lost per rules)
FR51: Admin can investigate a specific user's score breakdown
FR52: System logs API fetch results and scoring operations for error monitoring
FR53: Admin can add, remove, or modify card types in the moment catalog

**Total FRs: 54** (FR1–FR53 + FR14a)

---

### Non-Functional Requirements

**Performance:**
NFR1: Match Builder screen loads in <2 seconds on 4G connection
NFR2: Moment catalog filtering (by match, team, event type) responds in <200ms (client-side)
NFR3: Squad submission completes in <1 second
NFR4: Score reveal screen renders in <3 seconds with full gameweek data (20 tokens × scoring breakdown)
NFR5: Leaderboard loads in <2 seconds for mini-leagues up to 100 members and global top 1000

**Security:**
NFR6: All data in transit encrypted via TLS 1.2+
NFR7: User authentication tokens follow OAuth 2.0 best practices (short-lived access tokens, secure refresh)
NFR8: No betting odds data exposed to users — only derived point values
NFR9: User prediction data not visible to other users before gameweek deadline
NFR10: Admin operations require elevated authentication

**Scalability:**
NFR11: System supports up to 10,000 concurrent users during Match Builder window without degradation
NFR12: Scoring engine processes all users within 5 minutes of final match completion
NFR13: Database scales to support a full Premier League season (38 gameweeks × all users × 20 tokens per gameweek)
NFR14: API rate limits managed to stay within provider quotas during odds fetch and event ingestion

**Integration:**
NFR15: Odds API — system tolerates downtime of up to 4 hours during Match Builder preparation window (retry with exponential backoff)
NFR16: Match Events API — system tolerates delayed event data by up to 2 hours post-match before flagging for manual intervention
NFR17: Push notification delivery via platform-native services (APNs/FCM) with best-effort delivery — no guaranteed delivery SLA for MVP
NFR18: Deep link handling works across iOS Universal Links and Android App Links for mini-league invites

**Reliability:**
NFR19: Zero tolerance for scoring calculation errors — if detected, system halts reveal and alerts admin
NFR20: User predictions persisted immediately on submission — no data loss on app crash or network interruption
NFR21: Gameweek lifecycle (odds lock → match events → scoring → reveal) runs without manual intervention for 99% of gameweeks
NFR22: System handles postponed/rescheduled matches gracefully without corrupting other match data

**Total NFRs: 22**

---

### Additional Requirements / Constraints

- **Platform:** iOS 15+ and Android 10+, portrait-only, no offline mode for MVP
- **App size:** Target <50MB download
- **Authentication:** Social login only (Apple, Google) — no email/password
- **Store compliance:** Must be clearly positioned as free-to-play; no gambling language; age rating 4+/Everyone; privacy policy required
- **Monetisation:** Explicitly out of MVP scope — deferred to post-engagement validation
- **Resource model:** Solo developer, serverless backend, cross-platform framework
- **Deep links:** Universal Links (iOS) / App Links (Android) required for mini-league invite flow
- **Quick Pick:** Must auto-fill remaining empty token slots (not full squad replacement)
- **Gameweek spanning multiple days:** Single odds lock at window open; all predictions lock at first kickoff

---

### PRD Completeness Assessment

The PRD is well-structured and thorough. Requirements are clearly numbered and categorised. Key strengths:
- The scoring model is precisely specified (FR14a table, FR24 layers, FR25–FR28)
- Admin/ops requirements are explicit (FR48–FR53)
- NFRs are quantified with concrete thresholds
- Constraints, assumptions, and deferred items are clearly called out

One area of ambiguity: the streak multiplier values are not specified in the PRD (FR28 references a multiplier but no formula or values are given — these appear to be design-time decisions deferred to architecture/story).

---

## Epic Coverage Validation

### Coverage Matrix

| FR | PRD Requirement (short form) | Epic Coverage | Status | Notes |
|---|---|---|---|---|
| FR1 | Social login (Apple, Google) | Epic 2 → Story 2.1 | ✓ Covered | |
| FR2 | View/edit profile display name | Epic 2 → Story 2.2 | ✓ Covered | |
| FR3 | Grant/revoke push notification permissions | Epic 2 → Story 2.3 | ✓ Covered | |
| FR4 | Fetch and lock odds from external API | Epic 3 → Story 3.2 | ✓ Covered | |
| FR5 | Convert odds to point values | Epic 3 → Story 3.2 | ✓ Covered | |
| FR6 | Populate gameweek moment catalog | Epic 3 → Story 3.2 | ✓ Covered | |
| FR7 | Open/close Match Builder window on schedule | Epic 3 → Story 3.4 | ✓ Covered | |
| FR8 | Lock all predictions at first kickoff | Epic 3 → Story 3.4 | ✓ Covered | |
| FR9 | Fetch match event data post-match | Epic 3 → Story 3.3 | ✓ Covered | |
| FR10 | Detect gameweek complete + trigger scoring | Epic 3 → Story 3.3 | ✓ Covered | |
| FR11 | View all fixtures in current gameweek | Epic 5 → Story 5.2 | ✓ Covered | |
| FR12 | Browse moment catalog with filters | Epic 5 → Story 5.2 | ✓ Covered | |
| FR13 | Add Match Moment (one-tap) | Epic 5 → Story 5.2 | ✓ Covered | |
| FR14 | Add Precision Pick via guided micro-flow | Epic 5 → Story 5.4 | ✓ Covered | |
| FR14a | All 5 Precision Pick event-type schemas | Epic 5 → Story 5.4 | ✓ Covered | |
| FR15 | Confidence window selection (±5/±10/±15) | Epic 5 → Story 5.4 | ✓ Covered | |
| FR16 | Point value breakdown visible before selecting | Epic 5 → Story 5.2/5.4 | ✓ Covered | |
| FR17 | Captain designation (2x) | Epic 5 → Story 5.3 | ✓ Covered | |
| FR18 | Remove or replace any moment before deadline | Epic 5 → Story 5.3 | ✓ Covered | |
| FR19 | Quick Pick auto-fill | **N/A — REMOVED FROM MVP** | ⚠️ PRD DEVIATION | Removed per UX Specification decision; PRD lists as MVP feature |
| FR20 | View squad summary (Moments View) | Epic 5 → Story 5.5 | ✓ Covered | |
| FR21 | Submit squad | Epic 5 → Story 5.3 | ⚠️ REDESIGNED | PRD: explicit submit action. Epics: auto-save to DB; RLS write-lock at first_kickoff is the deadline mechanism — no separate submit button |
| FR22 | 20-token limit enforcement | Epic 5 → Story 5.3 | ✓ Covered | |
| FR23 | Score Match Moments | Epic 4 → Story 4.1 | ✓ Covered | |
| FR24 | Score Precision Picks multi-layer additive | Epic 4 → Story 4.1 | ✓ Covered | |
| FR25 | Exact minute jackpot bonus | Epic 4 → Story 4.1 | ✓ Covered | |
| FR26 | Captain multiplier (2x) | Epic 4 → Story 4.1 | ✓ Covered | |
| FR27 | Cross-match streak by real-world event time | Epic 4 → Story 4.2 | ✓ Covered | |
| FR28 | Streak multiplier on consecutive correct picks | Epic 4 → Story 4.2 | ✓ Covered | Multiplier formula/values not specified anywhere — gap |
| FR29 | Postponed match handling | Epic 4 → Story 4.1 | ✓ Covered | |
| FR30 | Total gameweek score calculation | Epic 4 → Story 4.3 | ✓ Covered | |
| FR31 | View gameweek results | Epic 6 → Story 6.2 | ✓ Covered | |
| FR32 | Per-moment scoring breakdown | Epic 6 → Story 6.2 | ✓ Covered | |
| FR33 | Visual feedback: hits/misses/bonuses/jackpots | Epic 6 → Story 6.1 | ✓ Covered | |
| FR34 | Streak sequence and break point visible | Epic 6 → Story 6.2 | ✓ Covered | |
| FR35 | Weekly gameweek leaderboard (global) | Epic 7 → Story 7.1 | ✓ Covered | |
| FR36 | Season cumulative leaderboard (global) | Epic 7 → Story 7.1 | ✓ Covered | |
| FR37 | Own rank and score on both leaderboards | Epic 7 → Story 7.1 | ✓ Covered | |
| FR38 | Create mini-league | Epic 8 → Story 8.1 | ✓ Covered | |
| FR39 | Generate shareable invite link | Epic 8 → Story 8.1 | ✓ Covered | |
| FR40 | Join mini-league via invite/deep link | Epic 8 → Story 8.2 | ✓ Covered | |
| FR41 | Mini-league leaderboard | Epic 7 → Story 7.2 | ✓ Covered | |
| FR42 | Multiple mini-league membership | Epic 8 → Story 8.1 | ✓ Covered | |
| FR43 | Leave mini-league | Epic 8 → Story 8.1 | ✓ Covered | |
| FR44 | Guided tutorial (5 rules) | Epic 2 → Story 2.5 | ✓ Covered | |
| FR45 | Onboarding completable in <60 seconds | Epic 2 → Story 2.5 | ✓ Covered | |
| FR46 | Push notification: Match Builder open | Epic 3 → Story 3.2 | ✓ Covered | |
| FR47 | Push notification: Results ready | Epic 4 → Story 4.3 | ✓ Covered | |
| FR48 | Admin: gameweek status view | Epic 9 → Story 9.3 | ✓ Covered | |
| FR49 | Admin: manual rescore | Epic 9 → Story 9.1 | ✓ Covered | |
| FR50 | Admin: flag match as void | Epic 9 → Story 9.1 | ✓ Covered | |
| FR51 | Admin: user score breakdown | Epic 9 → Story 9.2 | ✓ Covered | |
| FR52 | Error logging (API + scoring) | Epic 9 → Story 9.2 | ✓ Covered | |
| FR53 | Admin: catalog management | Epic 9 → Story 9.3 | ✓ Covered | |

### NFR Coverage

| NFR | Category | Addressed In | Status |
|---|---|---|---|
| NFR1 | Performance: MB screen <2s | Epic 5 epic description | ✓ Referenced |
| NFR2 | Performance: catalog filter <200ms | Epic 5 epic description | ✓ Referenced |
| NFR3 | Performance: squad save <1s | Epic 5 epic description | ✓ Referenced |
| NFR4 | Performance: reveal <3s | Epic 6 → Story 6.2 AC | ✓ Explicit AC |
| NFR5 | Performance: leaderboard <2s | Epic 7 → Stories 7.1/7.2 AC | ✓ Explicit AC |
| NFR6 | Security: TLS 1.2+ | Not explicit in any story AC | ⚠️ Infrastructure assumption |
| NFR7 | Security: OAuth 2.0 tokens | Epic 2 → Story 2.1 AC | ✓ Covered |
| NFR8 | Security: no raw odds exposed | Epic 5 + Epic 3 Story 3.2 AC | ✓ Covered |
| NFR9 | Security: predictions private pre-deadline | Epic 5 + Epic 2 Story 2.4 | ✓ Covered |
| NFR10 | Security: admin elevated auth | Epic 2 Story 2.4 + Epic 9 Story 9.1 | ✓ Covered |
| NFR11 | Scalability: 10k concurrent users | Epic 5 epic description | ✓ Referenced |
| NFR12 | Scalability: scoring in <5 mins | Epic 4 epic description | ✓ Referenced |
| NFR13 | Scalability: DB full season | Not explicit in any story AC | ⚠️ Schema design assumption |
| NFR14 | Scalability: API rate limits | Story 3.1 (retry logic only) | ⚠️ Partial — rate limit strategy not explicit |
| NFR15 | Integration: Odds API 4h tolerance | Epic 3 epic description + Story 3.2 | ✓ Covered |
| NFR16 | Integration: Events API 2h tolerance | Epic 3 → Story 3.3 AC | ✓ Explicit AC |
| NFR17 | Integration: APNs/FCM best-effort | Epic 3 → Story 3.2 AC | ✓ Covered |
| NFR18 | Integration: deep link iOS+Android | Epic 8 → Story 8.2 AC | ✓ Explicit AC |
| NFR19 | Reliability: zero scoring errors | Epic 4 epic description + Story 4.3 | ✓ Covered |
| NFR20 | Reliability: predictions persisted immediately | Epic 4 epic description | ✓ Referenced |
| NFR21 | Reliability: 99% automated lifecycle | Epic 3 epic description | ✓ Referenced |
| NFR22 | Reliability: postponed match handling | Epic 3 + Story 3.3 | ✓ Covered |

### Missing Requirements

#### PRD Deviations (Items changed from PRD intent)

**FR19 — Quick Pick auto-fill REMOVED FROM MVP**
- PRD position: Listed as an explicit MVP feature ("Quick Pick auto-fill")
- Epic position: Removed per UX Specification design decision
- Impact: Medium — this was a core casual-user safety net (Jake's journey references it explicitly). Without Quick Pick, users with <20 tokens at deadline cannot auto-fill. This decision should be confirmed as intentional and the Jake user journey in the PRD should be updated.
- Recommendation: Verify with Product that removal is intentional; update PRD journey narrative (Jake explicitly uses Quick Pick to fill 5 remaining tokens)

**FR21 — Squad submission redesigned**
- PRD position: Explicit "submit" action that locks predictions
- Epic position: Auto-save to DB on every pick; RLS write-lock at first_kickoff is the deadline mechanism; no separate submit button
- Impact: Low functional risk (data integrity is preserved); medium UX risk — users may not know their picks are "in" without a confirmatory submit action
- Recommendation: Confirm this is intentional in Epic 5 Story 5.3; ensure the save-to-DB flow provides clear user feedback (the AC mentions routing to Moments View on save — this serves as confirmation)

**FR28 — Streak multiplier values undefined**
- PRD position: References a streak multiplier but gives no formula or values
- Epic position: Story 4.2 implements the mechanic but does not specify multiplier values in any AC
- Impact: Medium — scoring results will differ based on value chosen; balance testing needs real values
- Recommendation: Define streak multiplier values (e.g. 1.1x, 1.2x, 1.5x per consecutive hit) in a story AC or architecture note before Epic 4 is implemented

#### NFR Gaps (No explicit story AC verification)

**NFR6 — TLS 1.2+ encryption in transit**
- No story AC explicitly verifies TLS enforcement
- Impact: Low (Supabase enforces TLS by default; risk is minimal)
- Recommendation: Add an infrastructure checklist note to Story 1.3 or 1.5 confirming TLS is enforced at the Supabase project and CDN layer

**NFR13 — Database scalability for full season**
- No story AC explicitly validates schema capacity for 38 gameweeks × N users × 20 tokens
- Impact: Low for MVP (user base will be small); medium for growth
- Recommendation: Add a note to Story 1.3 confirming schema design accounts for expected row volumes

**NFR14 — API rate limit management**
- Story 3.1 implements retry logic but does not explicitly address rate limit budgeting
- Impact: Medium — if the Odds API or Events API has strict rate limits, ingestion jobs could fail silently or get blocked
- Recommendation: Add an AC to Story 3.1 or 3.2 specifying rate limit awareness (e.g. request throttling, quota tracking)

### Coverage Statistics

- Total PRD FRs: 54 (FR1–FR53 + FR14a)
- FRs covered in epics: 52
- FRs removed from MVP: 1 (FR19 — deliberate)
- FRs with design deviations: 2 (FR19, FR21)
- FRs with undefined implementation values: 1 (FR28 — streak multiplier)
- **FR coverage: 100%** (all FRs accounted for; FR19 removal documented)
- Total NFRs: 22
- NFRs with explicit story ACs: 12
- NFRs addressed via epic description/architecture: 7
- NFRs with no explicit coverage: 3 (NFR6, NFR13, NFR14)
- **NFR coverage: 86%** explicit; 100% implicitly assumed

---

## UX Alignment Assessment

### UX Document Status

**Found** — `_bmad-output/planning-artifacts/ux-design-specification.md` (82 KB, Apr 27). Comprehensive 14-step collaborative workflow output covering: executive summary, core experience, emotional design, inspiration analysis, design system, design direction decision, all 5 player journey flows, 17 custom component specifications, UX consistency patterns, responsive/accessibility strategy, and app state machine.

The epics document imports the UX spec as a source document and distils it into 30 UX Design Requirements (UX-DR1–UX-DR30), which are explicitly mapped to epics and stories. UX-architecture alignment is well-established via AR1–AR18 (16 includes UX-specific AR16 for react-native-view-shot, AR8 for state management, AR17 for naming conventions).

---

### Alignment Issues

#### 1. Prediction Type Renaming — PRD Terminology vs UX Spec (Medium Risk)

- **UX spec decision:** Renames "Match Moment" → **Match** and "Precision Pick" → **Moment** for simplicity in the UI (UX spec line ~578)
- **Epics:** Adopt the new names throughout stories and UX-DRs (TypeBadge "MATCH"/"MOMENT", etc.)
- **PRD:** Still uses original names ("Match Moments", "Precision Picks") throughout
- **Risk:** Developer implementing from both PRD and epics simultaneously may encounter naming confusion; the user-facing strings differ from the PRD vocabulary
- **Recommendation:** Either update the PRD terminology to match UX spec, or add a terminology mapping note to the PRD. The epics are correct — the PRD is the stale document here.

#### 2. Post-Reveal Mini-League Leaderboard — Embedded in Reveal Flow (Low-Medium Risk)

- **UX spec Journey 3** explicitly shows the reveal sequence ending with: "Mini-league position revealed → Position change shown ↑3 or ↓1 → Share results card"
- **UX spec line 77:** "the mini-league leaderboard is embedded in the results flow — not a separate tab"
- **Epics Story 6.2:** Covers the reveal animation and `reveal_seen` flag but does NOT include an explicit AC for the post-reveal leaderboard position being displayed inline within the reveal sequence
- **Risk:** Implementation of Epic 6 may omit the mini-league position display within the reveal, breaking the intended emotional arc of "score → where did I finish?"
- **Recommendation:** Add an AC to Story 6.2 covering: "After all cards resolve, if the user belongs to any mini-leagues, their mini-league position change (↑/↓) is shown before the share prompt"

#### 3. Deadline Lock Notification / UX Moment — No Story Coverage (Low Risk)

- **UX spec:** "Lock notification: 'Your squad is locked. Good luck.'" and "a subtle visual/notification when deadline passes" are described as explicit product moments
- **Epics:** No story AC explicitly covers the in-app confirmation or notification that the squad has been locked at first kickoff
- **Risk:** The "committed anticipation" emotional beat at deadline — the moment that transitions Building → Locked — has no implementation owner
- **Recommendation:** Add a brief AC to Story 5.1 (App State Machine): "When the app detects transition from Building to Locked phase, display a transient notification or badge change confirming 'Your squad is locked'"

#### 4. BoldnessShield Tier Thresholds — Flagged as Estimates (Low Risk)

- **UX spec line 1352:** "Thresholds are calibrated against the actual points system. Values above are initial estimates — adjust when the points model is finalised"
- **Epics UX-DR15 and Story 5.5:** Use the values from the UX spec (Bronze 0–999, Silver 1000–2499, Gold 2500–4999, Platinum 5000+) without flagging them as provisional
- **Risk:** If the scoring system produces different point distributions than estimated, tier thresholds may put most users in Bronze and few in higher tiers, weakening the motivational mechanic
- **Recommendation:** Before implementing Story 5.5, validate tier thresholds against the scoring engine output from Story 4.1 simulations. Add a note to Story 5.5 AC: "Boldness tier thresholds to be validated against scoring engine simulation prior to implementation"

#### 5. Reveal → Building Transition — Not Covered in Stories (Low Risk)

- **UX spec:** "After reveal is viewed and/or shared. Back gesture or share completion returns to fresh Build View for the next GW"
- **Epics:** Story 6.2 covers `reveal_seen` being set to true but does not cover what happens next — the transition back into the Building state for the next gameweek
- **Risk:** Users who complete the reveal may be stuck on the results screen with no clear path forward if the next gameweek's Build View isn't triggered
- **Recommendation:** Add an AC to Story 6.2: "After reveal completes and all cards are resolved, a CTA ('Build next week's squad') is shown, or the app auto-transitions to Building state for the next gameweek on the next app foreground"

---

### Warnings

#### W1 — Component Count Inconsistency in UX Spec (Informational)

The UX spec states "All 15 components are custom" but the component table lists 17 components (the two additional being `BoldnessShield` and `BoldnessHeroCard`). The epics correctly include all 17 in UX-DR15/16. This is a minor spec doc error, not an implementation concern.

#### W2 — Haptic on Match Pick Added (Informational)

UX spec defines a light haptic on Match pick added (line 1094). No story AC explicitly requires implementing this haptic. It's covered implicitly by the UX-DRs but could be missed during implementation if the developer focuses only on story ACs.

#### W3 — Architecture Supports All UX Requirements (Positive Finding)

All UX-DRs are architecturally supported:
- Animation: `react-native-reanimated` (AR8 + Story 1.1)
- ShareCard: `react-native-view-shot` (AR16 + Story 1.1)
- Haptics: `expo-haptics` (Story 1.1)
- Deep links: Expo Router Universal/App Links (AR18, Story 8.2)
- Design tokens: NativeWind + Tailwind config (Story 1.2)
- State management: TanStack Query + Zustand pattern aligns with "no shared state in components" UX principle

No UX requirement lacks an architecture mechanism to support it.

---

## Epic Quality Review

### Best Practices Validation Summary

Validating each epic against: user value, independence, story sizing, AC quality, dependency hygiene, and DB creation timing.

---

### Epic-Level Assessment

#### Epic 1: Foundation — Project Scaffold & Infrastructure

| Check | Result |
|---|---|
| User-centric title? | ❌ "Foundation" is technical, not a user outcome |
| Delivers user value in isolation? | ❌ No — purely developer infrastructure |
| Can function from Epic 0 (nothing)? | ✅ Yes — it is the starting point |
| Starter template requirement met? | ✅ Story 1.1 IS the starter template setup (AR1) |
| Greenfield project setup pattern? | ✅ CI/CD (1.5), dev env (1.3), scaffold (1.1) all present |

**Assessment:** 🟠 **Technical epic — flagged, but architecture-justified exception applies.** The best practice rule "Infrastructure Setup = no user value" applies here. However, the Architecture (AR1) explicitly mandates a starter template and project scaffold as the first story. This is a greenfield project and Epic 1 satisfies the "Starter Template Requirement" check in the quality standards. The violation is real but accepted given the context.

**Recommendation:** Consider renaming to "Epic 1: Developer Foundation — Runnable App Shell" to make explicit that this is the minimum prerequisite for all subsequent user value. The technical nature of this epic is a known acceptable pattern for greenfield solo-developer projects.

---

#### Epic 2: Account, Authentication & Onboarding

| Check | Result |
|---|---|
| User-centric title? | ✅ "Users can register with Apple or Google..." |
| Delivers user value in isolation? | ✅ Yes — users can create accounts and learn the game |
| Independent from future epics? | ✅ Yes — only depends on Epic 1 |
| All FRs covered? | ✅ FR1–FR3, FR44–FR45 |

**Assessment:** ✅ **Good epic.** Clean user value, well-scoped, independent.

---

#### Epic 3: Gameweek Data Pipeline

| Check | Result |
|---|---|
| User-centric title? | ❌ "The system automatically fetches..." — system-centric |
| Delivers user value in isolation? | ❌ No — populates data but no user-facing UI |
| Independent from future epics? | ✅ Only depends on Epics 1–2 |
| All FRs covered? | ✅ FR4–FR10, FR46 |

**Assessment:** 🟠 **System-facing epic — no independent user value.** Epic 3 is a backend automation epic. A user gaining access to Epic 3 alone cannot do anything meaningful — there's no UI to interact with. This is a technical milestone disguised as an epic. However, it is a genuine delivery unit (the data pipeline is tested, deployed, and running), and the PRD Journey 4 (System Ops) validates this as a real use case. The FR coverage (FR4–FR10) is all system-level, which is consistent with the PRD's own categorisation.

**Recommendation:** Acceptable given the product architecture (all data flows through this pipeline before any user features work). However, consider whether Epics 3 and 4 could be better framed as: "Epic 3: Gameweek Lifecycle — Automated Match Data for All Users" (emphasising the user benefit: "users get accurate, auto-populated data without manual admin work"). This is a framing recommendation, not a structural change.

---

#### Epic 4: Scoring Engine & Results Processing

| Check | Result |
|---|---|
| User-centric title? | ❌ "The system scores every user's 20 tokens..." — system-centric |
| Delivers user value in isolation? | ❌ No — scores calculated but Epic 6 (Reveal) needed to see them |
| Independent from future epics? | ✅ Only depends on Epics 1–3 |
| All FRs covered? | ✅ FR23–FR30, FR47 |

**Assessment:** 🟠 **System-facing epic — same concern as Epic 3.** Scoring results exist but cannot be viewed without Epic 6. This epic and Epic 3 form the "invisible engine" layer of the product. The same framing recommendation applies.

**Recommendation:** Acceptable structurally. The scoring engine is a discrete, independently testable delivery unit even without the reveal UI. The key test harness (scoring-engine.test.ts in Story 4.1) ensures correctness can be validated independently.

---

#### Epic 5: Match Builder — Full Squad Building

| Check | Result |
|---|---|
| User-centric title? | ✅ "Users can browse fixtures, build squads..." |
| Delivers user value in isolation? | ✅ Yes — users can build and save squads |
| Independent (uses Epics 1–4)? | ✅ Yes — needs catalog from Epic 3 |
| All FRs covered? | ✅ FR11–FR22 (minus FR19 removed) |

**Assessment:** ✅ **Good epic.** Core user value. Well-scoped.

---

#### Epic 6: Score Reveal & Results

| Check | Result |
|---|---|
| User-centric title? | ✅ "The emotional centrepiece..." |
| Delivers user value in isolation? | ✅ Yes — users see their results |
| Independent (uses Epics 1–5)? | ✅ Yes — needs scoring from Epic 4 |
| All FRs covered? | ✅ FR31–FR34 |

**Assessment:** ✅ **Good epic.** High-value delivery.

---

#### Epic 7: Leaderboards

| Check | Result |
|---|---|
| User-centric title? | ✅ "Users can see their competitive standing..." |
| Delivers user value in isolation? | ✅ Yes — global competition visible |
| Independent (uses Epics 1–6)? | ✅ Yes — needs materialised entries from Epic 4 |
| All FRs covered? | ✅ FR35–FR37, FR41 |

**Assessment:** ✅ **Good epic.**

---

#### Epic 8: Mini-Leagues & Social Sharing

| Check | Result |
|---|---|
| User-centric title? | ✅ "Users create leagues, invite friends..." |
| Delivers user value in isolation? | ✅ Yes — social layer functional |
| Independent (uses Epics 1–7)? | ✅ Yes |
| All FRs covered? | ✅ FR38–FR40, FR42–FR43 |

**Assessment:** ✅ **Good epic.**

---

#### Epic 9: Admin & Operations

| Check | Result |
|---|---|
| User-centric title? | ➖ Role-centric (Admin role), not end-user. Acceptable for ops epics. |
| Delivers user value? | ✅ Admin/Ops role gets the tools they need |
| Independent (uses Epics 1–8)? | ✅ Yes — fully operational system to manage |
| All FRs covered? | ✅ FR48–FR53 |

**Assessment:** ✅ **Acceptable.** Admin-facing epics are a legitimate exception to the "user value" rule when the user IS the admin role.

---

### Story-Level Findings

#### 🔴 Critical Violations

None. No story has a hard blocking forward dependency or is genuinely impossible to implement.

---

#### 🟠 Major Issues

**Issue 1 — Story 1.3: All DB tables created upfront**

Story 1.3 creates the complete schema in a single migration: `users`, `gameweeks`, `fixtures`, `game_week_moments`, `moment_types`, `predictions`, `match_events`, `scoring_results`, `leaderboard_entries`, `mini_leagues`, `league_memberships`, `scoring_errors`.

Best practice says: "Each story creates tables it needs." Creating all tables in Epic 1 violates this.

**Counterargument:** The architecture (AR2) specifies "TypeScript schema is the single source of truth; Drizzle schema is the single source." Drizzle + Supabase projects conventionally define the full schema upfront and run it as the initial migration. Splitting the schema across epics would create partial Drizzle schema states, which is architecturally inconsistent.

**Verdict:** 🟠 Flagged but architecture-justified. The Drizzle pattern makes upfront schema definition the correct approach. The violation of the best practice is real but the architectural rationale is sound. This is acceptable with the understanding that any schema changes in later epics must be additive migrations (not destructive).

---

**Issue 2 — Story 5.4: Potential Oversizing (Precision Pick Micro-flow)**

Story 5.4 encompasses:
- Navigation to two new screens (player.tsx, timing.tsx)
- Player list component with bonus points and sorting
- MinutePicker custom scroll-wheel component
- ZoneChip segmented control
- PickSummaryCard real-time running total
- Full FR14a coverage: all 5 event type schemas (Goal, Substitution, Corner, Yellow Card, Red Card)
- Accessibility ACs for both screens

This is one of the largest stories in the document. A developer could realistically spend 2–3× longer on this than on a typical story.

**Risk:** If this story is estimated and then discovered to be larger than expected, it creates a plan/estimate miss. The 5 event type schemas (FR14a) alone have differentiated field requirements and scoring layers.

**Recommendation:** Consider splitting Story 5.4 into:
- 5.4a: Precision Pick micro-flow — Goal event type (establishes the two-screen pattern, player/minute/zone)
- 5.4b: Precision Pick micro-flow — remaining event types (Sub, Corner, Yellow, Red) (extend the established pattern)

This preserves independence (5.4a is deployable and testable alone) while reducing per-story risk.

---

**Issue 3 — Story 2.5 has a soft forward dependency note**

Story 2.5 (Onboarding Tutorial Screen) explicitly states:
> "Tutorial copy and visual examples should be finalized after Epic 5 (Match Builder) is complete so the rules described accurately match the real UI the user will encounter. The screen can be scaffolded now with placeholder content."

This is a soft forward dependency — the story can be started (scaffolded) in Epic 2, but its content cannot be finalised without Epic 5. This creates a story that is technically completable in Epic 2 but practically incomplete until later.

**Risk:** If the team marks Story 2.5 as "done" when scaffolded but the placeholder content never gets updated after Epic 5, the onboarding tutorial will launch with incorrect/placeholder content.

**Recommendation:** Add an explicit "content finalisation" sub-task to Story 2.5 with a dependency note: "AC for final content sign-off must be verified AFTER Epic 5 Story 5.2/5.4 are complete." Alternatively, split into 2.5a (scaffold) and 2.5b (content finalisation, placed after Epic 5).

---

#### 🟡 Minor Concerns

**Concern 1 — Story 4.3 forward reference to Epic 9**

Story 4.3 AC: "Given the admin manually invokes `admin-rescore` (built in Epic 9) / When it runs / Then it invokes `run-scoring` identically to the automatic chain"

This AC references `admin-rescore` which is built in Epic 9. The AC is validating the interface contract (admin-rescore calls run-scoring), but `admin-rescore` doesn't exist when Story 4.3 is implemented.

**Impact:** The AC cannot be fully verified until Epic 9 is delivered. The story is completable (run-scoring works) but one AC is untestable until Epic 9.

**Recommendation:** Move this specific AC to Story 9.1 where it can actually be tested ("Given `admin-rescore` is implemented / When it invokes `run-scoring` / Then identical results are produced"). Story 4.3 doesn't need to pre-validate Epic 9 behaviour.

---

**Concern 2 — Streak multiplier values absent across all stories**

FR28 (streak multiplier) is covered in Story 4.2 but no specific multiplier values (e.g. 1.1×, 1.25×, 1.5× per consecutive hit) appear in any AC. This means the developer implementing Story 4.2 will have to make a design decision.

This is consistent with the PRD gap already flagged (FR28 gap). Documenting here as a story-level concern because the implementation story (4.2) has no AC specifying the multiplier values that the scoring engine should use.

**Recommendation:** Before implementing Story 4.2, define streak multiplier values in a brief design note (a sentence in the story's notes section or as a configurable constant defined in AR18-level architecture guidance).

---

**Concern 3 — No explicit mobile performance testing AC**

NFR1 (<2s Match Builder load) and NFR3 (<1s squad save) are referenced in Epic 5's epic description but no individual story has an AC that verifies these with a timing assertion. NFR4 (<3s reveal) IS explicitly tested in Story 6.2 ("reveal screen is ready to begin animation in under 3 seconds").

**Recommendation:** Add timing ACs for NFR1 and NFR3 to Stories 5.2 and 5.3 respectively, matching the pattern used in Story 6.2.

---

### Compliance Checklist

| Epic | User Value | Independent | Stories Sized | No Fwd Deps | DB Timing | Clear ACs | FR Traceability |
|---|---|---|---|---|---|---|---|
| Epic 1 | ❌ (infra) | ✅ | ✅ | ✅ | ⚠️ all upfront | ✅ | N/A |
| Epic 2 | ✅ | ✅ | ✅ | ⚠️ 2.5 soft dep | ✅ | ✅ | ✅ |
| Epic 3 | ❌ (system) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Epic 4 | ❌ (system) | ✅ | ✅ | ⚠️ 4.3 → Ep9 | ✅ | ✅ | ✅ |
| Epic 5 | ✅ | ✅ | ⚠️ 5.4 large | ✅ | ✅ | ✅ | ✅ |
| Epic 6 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Epic 7 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Epic 8 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Epic 9 | ✅ (admin) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Summary and Recommendations

### Overall Readiness Status

# ✅ READY WITH CONDITIONS

The planning suite is fundamentally sound and implementation can begin. All 54 FRs are accounted for, the architecture is comprehensive and internally consistent, the UX specification is detailed and component-complete, and story acceptance criteria are well-structured. No critical blocking issues were found. The conditions below are refinements that reduce implementation risk — none of them prevent work starting on Epic 1.

---

### Issues Summary

| Category | Critical 🔴 | Major 🟠 | Minor 🟡 | Total |
|---|---|---|---|---|
| FR Coverage | 0 | 2 (FR19 removal, FR21 redesign) | 1 (FR28 undefined values) | 3 |
| NFR Coverage | 0 | 1 (NFR14 partial) | 2 (NFR6, NFR13 implicit) | 3 |
| UX Alignment | 0 | 2 (post-reveal leaderboard, deadline lock UX) | 3 (naming, BoldnessShield thresholds, reveal→building) | 5 |
| Epic Quality | 0 | 3 (Epics 1/3/4 technical; Story 5.4 oversized; Story 2.5 soft dep) | 3 (Story 4.3 fwd ref; streak values; perf ACs) | 6 |
| **TOTAL** | **0** | **8** | **9** | **17** |

---

### Critical Issues Requiring Immediate Action

None are blocking, but the following should be resolved **before the relevant epic begins implementation**, not after:

#### Before Epic 4 (Scoring Engine):

**1. Define streak multiplier values** — FR28 / Story 4.2 has no AC specifying what the streak multiplier is. A developer implementing the streak calculator must invent this value. Define it explicitly (e.g. "1.1× on pick 2, 1.2× on pick 3, 1.5× on picks 4+") as a named constant in the architecture or story notes before implementation begins.

#### Before Epic 5 (Match Builder):

**2. Confirm FR19 Quick Pick removal and update PRD** — The PRD Jake journey explicitly has Jake using Quick Pick ("he fills 15 tokens manually... hits Quick Pick to auto-fill the remaining 5"). The UX spec removed Quick Pick. If the removal is final, the PRD journey narrative should be updated so new contributors reading the PRD aren't confused. If removal is not final, Quick Pick needs to be re-scoped.

#### Before Epic 6 (Score Reveal):

**3. Add post-reveal mini-league leaderboard AC to Story 6.2** — The UX spec's Journey 3 (Score Reveal) explicitly shows the reveal sequence ending with "Mini-league position revealed → ↑3 or ↓1 shown." Story 6.2 has no AC for this. Without it, the emotional payoff of the reveal is incomplete and the developer has no specification for this behaviour.

---

### Recommended Next Steps

1. **Immediately before starting Epic 4:** Define streak multiplier values as a configurable constant. Add one line to Story 4.2: "Streak multiplier: pick 2 = 1.1×, pick 3 = 1.25×, pick 4+ = 1.5× (configurable constant `STREAK_MULTIPLIERS` in `functions/_shared/constants.ts`)". Adjust values to suit your scoring balance goals.

2. **Before Epic 5 wrap-up:** Update PRD Jake journey (Journey 1) to remove the Quick Pick reference, replacing with: "He fills 15 tokens manually across 4 matches he cares about. He leaves 5 slots empty — that's fine, no penalty for not using all 20." This keeps the PRD accurate for future reference.

3. **Before Epic 6 starts:** Add one AC to Story 6.2: "Given all cards have resolved and the user belongs to one or more mini-leagues, when the reveal sequence completes, then their current mini-league rank and position change (↑/↓) is displayed before the share prompt."

4. **Before Epic 5 estimation:** Consider splitting Story 5.4 (Precision Pick Micro-flow) into 5.4a (Goal event type — establishes the two-screen pattern) and 5.4b (remaining event types: Sub, Corner, Yellow Card, Red Card). Story 5.4 as written is the largest in the document and spans 5 distinct schemas, 4 components, and full accessibility coverage. Splitting reduces per-sprint risk without changing scope.

5. **After Epic 5 completion:** Return to Story 2.5 (Onboarding Tutorial) and finalise the content. The scaffold built in Epic 2 will have placeholder copy — update it to accurately describe the real Match/Moment UI the user will encounter.

6. **Move one AC:** Move the "admin-rescore calls run-scoring identically" AC from Story 4.3 to Story 9.1, where it can actually be tested.

---

### Positive Findings

These are strengths that should be preserved as implementation proceeds:

- **Architecture-to-story traceability is excellent** — AR1–AR18 are mapped to specific stories. Developers know exactly which architectural decision governs each story.
- **Acceptance criteria quality is high** — BDD Given/When/Then format used consistently. Error conditions are covered. NFR thresholds appear as testable ACs (Story 6.2, Stories 7.1/7.2).
- **Drizzle schema-first approach is correctly applied** — Creating the complete schema in Story 1.3 is the right pattern for this stack, even though it technically violates the "create tables when needed" best practice.
- **UX-DR integration into stories is thorough** — 30 UX Design Requirements are precisely mapped to stories, ensuring no UX detail falls through implementation gaps.
- **Admin story coverage is strong** — Epic 9 covers all FR48–FR53 with clear, verifiable ACs. Operational tooling is not an afterthought.
- **Dependency chain is clean** — Epics 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 form a sensible implementation sequence with no circular dependencies.

---

### Final Note

This assessment reviewed 4 planning documents totalling ~247KB of content across PRD, Architecture, Epics, and UX Specification. It identified **17 issues** across 4 categories — **0 critical, 8 major, 9 minor**. All major issues are refinements with clear remediation actions. The planning suite represents thorough, well-integrated work. Addressing the 3 "before epic X" items above will close the meaningful gaps before they become implementation surprises.

**Assessed by:** claude-sonnet-4-6 (automated review)
**Assessment date:** 2026-04-30
**Report file:** `_bmad-output/planning-artifacts/implementation-readiness-report-2026-04-30.md`
