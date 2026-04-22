---
stepsCompleted: [1, 2, 3, 4]
inputDocuments: []
session_topic: 'Football prediction app — minute + window match moment prediction game'
session_goals: 'Refine core concept, resolve open design questions, prepare for product brief'
selected_approach: 'ai-recommended'
techniques_used: ['SCAMPER Method', 'Reverse Brainstorming', 'Morphological Analysis']
ideas_generated: 34
session_active: false
workflow_completed: true
---

# Brainstorming Session: Match Moments App

**Date:** 2026-04-20
**Facilitator:** AI-Recommended Technique Flow
**Participant:** Sean

## Session Overview

**Topic:** Designing a free-to-play football prediction mobile app inspired by Fantasy Premier League, Sky Super 6, and event betting — where users predict match moments, pick an exact minute, and set a confidence window for timing bonus points.

**Goals:** Stress-test the idea, fill gaps, resolve open design questions, and sharpen the concept before moving to a product brief.

**Techniques Used:**
1. **SCAMPER Method** — Systematically explored every dimension of the core mechanic
2. **Reverse Brainstorming** — Identified failure modes and turned them into design requirements
3. **Morphological Analysis** — Mapped all variables and confirmed final MVP configuration

**Post-Session Revision (2026-04-21):** Replaced fixed zone system with **minute + custom window** mechanic to resolve streak sequencing and restore timing precision rewards.

**Post-Session Revision (2026-04-22):** Introduced two moment types (Match Moments + Timed Moments), killed forced difficulty ratios, replaced Star Match with Captain Moment, focused catalog on achievable accumulator-style predictions. Streaks apply to timed moments only, ordered by real-world event time (not user's predicted minute). Reinstated betting odds API as difficulty/points source — moment catalog driven by API markets, points derived from odds. App's unique value = gamification layer on top (timing, streaks, captain, leaderboards).

---

## Technique 1: SCAMPER Method

### S — Substitute
- Initially substituted linear timeline with zone-based placement, then **evolved to minute + custom window** mechanic (best of both — exact timing precision with user-controlled safety net)
- Substituted "events" with **"moments"** branding (narrative feel, same verifiable data)
- Explored budget-based token system vs fixed count → landed on **fixed token count**
- Substituted betting API-driven difficulty with **inherent point values per moment type** → then **reinstated odds API** as the points source (odds = difficulty, match-specific, updated per fixture). App cannot self-rate difficulty for match-specific moments like BTTS.

### C — Combine
- Combined moments + social = **Mini-leagues** for friend group competition (reinstated for MVP)
- Combined difficulty tiers + streak mechanic = **Streak multiplier on timed moments only**, scales with moment value
- ~~Combined captain concept + match selection = Star Match~~ → **Captain Moment** (2x on one chosen moment, any type)

### A — Adapt
- Adapted Wordle's one-shot mechanic → **Gameweek locks at kickoff, no edits**
- Adapted Strava's shareable cards → **Post-gameweek "Match Story" visual card** for social sharing
- Rejected Duolingo streak rewards — doesn't fit the product

### M — Modify
- ~~Modified zone structure to include stoppage time zones~~ → Replaced by minute + window mechanic (stoppage time minutes are simply harder to predict exactly, naturally elevated reward)
- Modified match scope from 1 featured match → **all PL matches in gameweek**
- Modified token count from 11 (starting XI) → **20 (matchday squad)** to support full gameweek spread

### P — Put to Other Uses
- Banked **Quick Play pub mode** for future (same mechanic, single match, QR code, friends)
- Banked **broadcaster white-label partnership** as B2B monetization angle
- Banked **multi-sport adaptation** (cricket overs, NBA quarters, F1 laps) for future

### E — Eliminate
- Eliminated **betting redirect** entirely — free-to-play skill game, clean brand, no regulatory risk
- Eliminated **player-specific moments** for MVP — team-level only ("Arsenal score" not "Saka scores")
- Eliminated **live scoring** — end-of-gameweek surprise reveal instead

### R — Reverse
- Rejected anti-moments (predicting what won't happen) — overcomplicates
- Rejected challenge cards (app-assigned moments) — user agency is core identity
- Rejected negative points for wrong predictions — 0 floor keeps it fun

---

## Technique 2: Reverse Brainstorming — Failure Modes

| # | Failure Mode | Resolution |
|---|---|---|
| 1 | Everyone picks the same moments | ~~Forced difficulty ratio~~ → **No longer a concern** — scoring structure self-balances; safe picks score low, risky picks score high. No ratio needed. |
| 2 | Boring gameweeks kill engagement | Non-problem — active weekly rebuilding IS engagement + push notifications |
| 3 | Moment catalog too small/repetitive | **12+ moment types × 2 teams × 10 matches = ~240 options** per gameweek |
| 4 | No prize = no motivation | **Mini-leagues for friend competition from day 1**, prizes introduced with traction |
| 5 | 20 decisions across 10 matches = friction | **Auto-fill / Quick Pick** — one tap randomize, then edit what you care about |
| 6 | Users don't understand difficulty ratings | **Users see points, not odds.** Each moment card shows its point value. Higher points = harder. Intuitive without explanation. |
| 7 | Match postponed mid-gameweek | **Tokens lost** — you took the risk placing moments on that match |
| 8 | Stoppage time breaks zone structure | ~~Zone 7/8~~ → **No longer relevant** — minute + window mechanic handles stoppage time naturally (users can pick minute 90+X) |
| 9 | Moment catalog UI unclear | **Filterable cards** — filter by team, difficulty, type. Select → assign minute + window |
| 10 | New user is lost / no onboarding | **Guided tutorial on first gameweek** — flagged for UX design phase |
| 11 | App name / brand doesn't stick | **Flagged for product brief** — something with "moments" or iconic commentary flavor |
| 12 | Data source reliability risk | **Critical dependency** — need reliable odds API (pre-match odds) + match event API (results/timing). Technical research required: The Odds API, API-Football, BetFair Exchange API. |

---

## Technique 3: Morphological Analysis — MVP Configuration

### Complete Parameter Matrix

| Parameter | **MVP Decision** |
|---|---|
| Core Mechanic | Two moment types: Match Moments (accumulator-style) + Timed Moments (minute + window) |
| Match Moments | Full-match predictions (e.g., Over 2.5 goals, Both teams score, [Team] wins) — flat points if correct, no timing |
| Timed Moments | What (moment) + When (exact minute) + Window (±5/10/15 min confidence buffer) |
| Tokens per Gameweek | 20 (matchday squad) |
| Token Mix | User's choice — any ratio of match moments to timed moments, no forced requirements |
| Match Scope | All PL matches in gameweek |
| Token Distribution | Free spread across all matches |
| Timing System | User picks exact minute + chooses ±5, ±10, or ±15 min window (timed moments only) |
| Timing Scoring — Exact Minute | Max timing bonus (same for all, regardless of window chosen) — the jackpot |
| Timing Scoring — In Window | Window-tier bonus (smaller window = bigger bonus) |
| Timing Scoring — Outside Window | Base moment points only (moment correct, timing wrong) |
| Moment Catalog Source | **Betting odds API** — catalog = API markets, points = derived from odds per fixture |
| Difficulty/Points | **Odds-driven, match-specific** — higher odds = more points. Formula: `odds × base_multiplier` (tuned in game mechanics). User sees points, not odds. |
| Odds Lock Timing | Pre-match odds locked at gameweek deadline — no in-play odds changes |
| Moment Specificity | Team-level only (player-specific = v2) |
| Catalog Expansion | Add moments by exposing more API markets — catalog grows with API, no manual curation |
| Captain Moment | 2x points on one chosen moment per gameweek (any type) |
| Streaks | Timed moments only — ordered by real-world event time across all matches |
| Streak Reward | Multiplier on moments in the streak |
| Streak Break | Wrong prediction breaks streak |
| Match Moments & Streaks | Match moments do NOT participate in streaks — flat points only |
| Gameweek Lock | Rolling per match kickoff |
| Missed Gameweek | Not in draw, no score |
| Postponed Match | Tokens lost |
| Score Reveal | End of gameweek (surprise reveal) |
| Leaderboard | Both weekly (primary) + season cumulative |
| Mini-leagues | MVP — friend groups |
| Prizes | Introduced with traction |
| Quick Pick | Yes — auto-fill then edit |
| Moment Catalog UI | Filterable cards → assign type-specific inputs (match moment = select; timed = minute + window) |
| Betting Integration | **Odds API for difficulty/points only** — no betting redirect, no real money. Free-to-play identity preserved. |
| Shareable Card | Yes — Match Story post-gameweek |
| Competition Scope | Premier League only |
| Onboarding | Guided tutorial (UX phase) |

### Moment Catalog & Difficulty Architecture

**Source:** Moment catalog is driven by **betting odds API markets**. Whatever markets the API provides for a fixture, the app can expose as moments. Points are derived from odds — higher odds = more points if correct. This is match-specific (BTTS in Man City vs Arsenal has different points than BTTS in Bournemouth vs Ipswich).

**Ownership Split:**

| Layer | Source | Owner |
|---|---|---|
| Moment catalog (what can be predicted) | Betting odds API markets | API |
| Difficulty / point values | Betting odds → converted to points via formula | API provides odds, app converts |
| Timing mechanic (minute + window) | App-exclusive | Your IP |
| Captain, streaks, multipliers | App-exclusive | Your IP |
| Leaderboard, mini-leagues, reveal | App-exclusive | Your IP |

**Odds → Points Conversion (indicative, tuned in game mechanics session):**

| Decimal Odds | Probability | Example Market | Approx Points |
|---|---|---|---|
| 1.30 | ~77% | Man City to score | Low (e.g., 5 pts) |
| 1.80 | ~56% | Over 2.5 goals | Medium (e.g., 10 pts) |
| 2.50 | ~40% | BTTS | Medium-high (e.g., 15 pts) |
| 4.00 | ~25% | Draw | High (e.g., 25 pts) |
| 8.00+ | ~12% | Correct Score 0-0 | Very high (e.g., 50 pts) |

**User sees points, never odds.** Keeps it non-gambling.

**Odds lock at gameweek deadline** — pre-match odds captured and frozen. Even if in-play odds shift, points remain as set. Rewards pre-match prediction skill.

**MVP Timed Moments** (user picks minute + window, base points from odds):

| Moment | Notes |
|---|---|
| ⚽ [Team] scores | Core moment — most matches |
| ⚽ First goal of the match | Who scores first AND when? |
| 🟨 Yellow card [Team] | Multiple per match usually |
| 🔄 Substitution [Team] | Always happens, timing is the skill |
| 📐 Corner kick [Team] | Frequent, needs API confirmation |
| 🥅 Penalty awarded | Less frequent but achievable |

**MVP Match Moments** (full-match prediction, points from odds):

| Moment | Notes |
|---|---|
| 🏆 Match Result ([Team] wins / Draw) | The most basic market |
| ⚽ Over/Under 1.5 goals | Very safe, low points |
| ⚽ Over/Under 2.5 goals | Classic accumulator leg |
| ⚽ Over/Under 3.5 goals | Riskier, higher points |
| ⚽ Both Teams to Score (Yes/No) | Classic accumulator leg |
| 🧤 [Team] clean sheet | Defensive prediction |
| ⚽ [Team] to score | Almost always for big teams |
| 🔢 Correct Score (e.g., 2-1) | Very hard, very high points |
| ⚽ [Team] to win to nil | Win + clean sheet combo |

**Catalog scales naturally:** To add more moments, simply expose more API markets. No manual curation needed.

**v2 additions:** Player-specific markets (e.g., "Saka to score" — anytime goalscorer odds), in-play timed moments (penalty, red card), half-time result.

### Scoring Structure (To Be Refined)

| Component | Description |
|---|---|
| **Match Moment Points** | Odds-derived flat points if correct. Match-specific — same market has different points per fixture. Safe, consistent, no bonus potential. |
| **Timed Moment Points** | Odds-derived base points if moment happens (regardless of timing) |
| **Exact Minute Bonus** | Maximum timing bonus — awarded to ANY user who nails the exact minute, regardless of window chosen. The jackpot. |
| **Window Bonus** | When moment lands inside window but not on exact minute: ±5 min = large, ±10 min = medium, ±15 min = small |
| **Outside Window** | Moment happened but outside user's window — base moment points only, no timing bonus |
| **Captain Moment** | 2x points on one chosen moment per gameweek (any type) |
| **Streak Multiplier** | Consecutive correct **timed moments** (ordered by real-world event time across all matches) multiply those moments' scores. Match moments excluded from streaks. |
| **Wrong Moment** | 0 points (no negative scoring) |

**Scoring Logic — Timed Moments:**

| Outcome | Points Awarded |
|---|---|
| Moment doesn't happen | 0 |
| Moment happens, outside window | Base moment points only |
| Moment happens, inside ±15 min window | Base points + small timing bonus |
| Moment happens, inside ±10 min window | Base points + medium timing bonus |
| Moment happens, inside ±5 min window | Base points + large timing bonus |
| Moment happens, exact minute hit | Base points + **max timing bonus** (regardless of window) |

**Scoring Logic — Match Moments:**

| Outcome | Points Awarded |
|---|---|
| Prediction wrong | 0 |
| Prediction correct | Flat match moment points |

**Streak Logic:**
- After gameweek ends, collect all correct **timed moments** across all matches
- Order by **real-world event time** (actual minute the event occurred, not user's predicted minute)
- Consecutive correct moments in that order = streak → multiplier applied
- Wrong timed moment in sequence breaks the streak
- Match moments are invisible to streak calculation

**Core Rules (5 rules a user needs to know):**
1. Pick 20 moments across all PL matches
2. Two types: Match moments (will it happen?) and Timed moments (when will it happen?)
3. Timed moments: pick a minute + a window (±5/10/15) — smaller window = more points, exact minute = jackpot
4. Captain: pick one moment for double points
5. Streaks: get consecutive timed moments right = multiplier

---

## Idea Organization and Prioritization

### Theme 1: Core Game Mechanic
Two moment types (match + timed), 20 tokens free mix, minute + window timing, Captain Moment, streaks on timed only. **Fully resolved for MVP.**

### Theme 2: Strategic Depth & Differentiation
Captain Moment, cross-match streaks, user-controlled timing windows, free mix of safe/risky moments. The scoring structure self-balances without needing forced ratios. **Key differentiators.**

### Theme 3: Engagement & Retention
Mini-leagues, Match Story shareables, end-of-gameweek reveal, push notifications, season leaderboard. **Critical for user retention.**

### Theme 4: Simplification & Scope Control
Eliminating betting redirect, player-specific moments, live scoring, cups, state moments. **Smart MVP scoping.**

### Theme 5: Future Roadmap
| Priority | Feature |
|---|---|
| v2 | Captain / Confidence Boost (double points on one moment) | **Promoted to MVP as Captain Moment** |
| v2 | Player-specific moments ("Saka scores") |
| v2 | Live scoring during matches |
| v2 | Mini-league enhancements / Moment Duels |
| Future | Quick Play pub mode (QR code, single match) |
| Future | Broadcaster white-label partnership |
| Future | Multi-sport adaptation |

### Breakthrough Concepts
1. **Cross-match streaks by real-world event time** — genuinely novel mechanic not seen in competitor apps
2. **Two moment types** — Match Moments (accumulator DNA) + Timed Moments (timing skill) in a single game
3. **Minute + custom window mechanic** — user controls their own timing precision/risk tradeoff per moment
4. **Matchday squad of 20 spread freely across all matches** — strategic depth with symbolic branding
5. **Exact minute jackpot uncapped by window** — rewards precision equally regardless of safety net chosen
6. **Self-balancing scoring via odds** — no manual difficulty calibration needed; the betting market does it per fixture per week
7. **Accumulator gamification** — captures the fun of betting accumulators for a non-gambling audience
8. **Clean separation of concerns** — API provides catalog + difficulty, app provides gamification. Catalog scales by exposing more API markets.

---

## Action Planning: Next Steps

| Step | Action | Skill/Phase |
|---|---|---|
| 1 | **Create Product Brief** | `bmad-product-brief` — formalize this concept into a structured brief |
| 2 | **Research moment catalog** | ~~Cross-reference betting sites~~ → **Now API-driven** — catalog = API markets. Research which odds API provides the best market coverage for MVP moments |
| 3 | **Game mechanics session** | Define odds → points formula, timing bonus values, streak multipliers, captain mechanics |
| 4 | **Technical research** | Identify **two APIs**: (1) Odds API for pre-match odds/markets, (2) Match events API for results/timing verification. Candidates: The Odds API, API-Football, BetFair, football-data.org |
| 5 | **App naming / brand** | Brainstorm name — "moments" themed or iconic commentary inspired |
| 6 | **Create PRD** | `bmad-create-prd` — full product requirements document |
| 7 | **UX Design** | `bmad-create-ux-design` — filterable card UI, minute picker, window selector, onboarding flow |

---

## Session Summary

**Key Achievements:**
- Evolved from a vague "fantasy football meets betting" concept to a **fully specified MVP game mechanic**
- Resolved 15+ open design questions through structured exploration
- Identified and neutralized 12 potential failure modes
- Created a clean separation between MVP scope and future roadmap
- Discovered genuinely novel mechanics (cross-match streaks, minute + window precision)
- Post-session revision replaced fixed zones with superior **minute + custom window** mechanic

**Creative Journey:**
Sean demonstrated strong product instincts throughout — consistently choosing simplicity over complexity, user agency over system control, and clean branding over feature bloat. The concept evolved significantly from the original linear timeline approach through zone-based placement to the final **minute + custom window** mechanic, and from self-defined difficulty to **odds-driven points** — recognising that the betting market already solves difficulty calibration per fixture. The app's unique value is the gamification layer on top: timing precision, streaks, captain, mini-leagues, and the free-to-play accumulator experience.

**Recommended Next Step:** Create a Product Brief using `bmad-product-brief` to formalize this concept, then proceed to PRD creation. Technical research on odds APIs should happen in parallel.

