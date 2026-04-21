---
stepsCompleted: [1, 2, 3, 4]
inputDocuments: []
session_topic: 'Football prediction app — zone-based match moment prediction game'
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

**Topic:** Designing a free-to-play football prediction mobile app inspired by Fantasy Premier League, Sky Super 6, and event betting — where users predict match moments and place them on a zonal timeline for points.

**Goals:** Stress-test the idea, fill gaps, resolve open design questions, and sharpen the concept before moving to a product brief.

**Techniques Used:**
1. **SCAMPER Method** — Systematically explored every dimension of the core mechanic
2. **Reverse Brainstorming** — Identified failure modes and turned them into design requirements
3. **Morphological Analysis** — Mapped all variables and confirmed final MVP configuration

---

## Technique 1: SCAMPER Method

### S — Substitute
- Substituted linear 90-minute timeline with **zone-based placement** (better UX, simpler)
- Substituted "events" with **"moments"** branding (narrative feel, same verifiable data)
- Explored budget-based token system vs fixed count → landed on **fixed token count**
- Substituted betting API-driven difficulty with **self-defined difficulty tiers** (simpler MVP, no API dependency)

### C — Combine
- Combined moments + social = **Mini-leagues** for friend group competition (reinstated for MVP)
- Combined difficulty tiers + streak mechanic = **Streak multiplier scales with moment difficulty**
- Combined captain concept + match selection = **Star Match** (1.5x multiplier on one chosen match per gameweek)

### A — Adapt
- Adapted Wordle's one-shot mechanic → **Gameweek locks at kickoff, no edits**
- Adapted Strava's shareable cards → **Post-gameweek "Match Story" visual card** for social sharing
- Rejected Duolingo streak rewards — doesn't fit the product

### M — Modify
- Modified zone structure to include **stoppage time zones** (Zone 7: 45+', Zone 8: 90+') with elevated bonus
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
| 1 | Everyone picks the same moments | **Minimum difficulty requirements** — must include 5 Rare, 5 Uncommon, 10 free choice |
| 2 | Boring gameweeks kill engagement | Non-problem — active weekly rebuilding IS engagement + push notifications |
| 3 | Moment catalog too small/repetitive | **12+ moment types × 2 teams × 10 matches = ~240 options** per gameweek |
| 4 | No prize = no motivation | **Mini-leagues for friend competition from day 1**, prizes introduced with traction |
| 5 | 20 decisions across 10 matches = friction | **Auto-fill / Quick Pick** — one tap randomize, then edit what you care about |
| 6 | Users don't understand difficulty ratings | **Trusted labels** — users accept tiers like FPL point values. Calibrated in spec phase |
| 7 | Match postponed mid-gameweek | **Tokens lost** — you took the risk placing moments on that match |
| 8 | Stoppage time breaks zone structure | **Zone 7 (45+') and Zone 8 (90+')** — separate small zones with elevated bonus |
| 9 | Moment catalog UI unclear | **Filterable cards** — filter by team, difficulty, type. Select → assign zone |
| 10 | New user is lost / no onboarding | **Guided tutorial on first gameweek** — flagged for UX design phase |
| 11 | App name / brand doesn't stick | **Flagged for product brief** — something with "moments" or iconic commentary flavor |
| 12 | Data source reliability risk | **Flagged for technical research** — API selection task |

---

## Technique 3: Morphological Analysis — MVP Configuration

### Complete Parameter Matrix

| Parameter | **MVP Decision** |
|---|---|
| Core Mechanic | Zone-based moment placement |
| Tokens per Gameweek | 20 (matchday squad) |
| Match Scope | All PL matches in gameweek |
| Token Distribution | Free spread across all matches |
| Zones per Match | 8 (6 × 15min + 2 stoppage) |
| Stoppage Zones | Separate zones, elevated bonus |
| Zone Scoring | Exact zone hit only (no partial) |
| Moment Type | Occurrences only (verifiable events) |
| Moment Specificity | Team-level only |
| Difficulty Source | Self-defined difficulty tiers |
| Difficulty Constraint | Min 5 Rare + 5 Uncommon required |
| Scoring Model | Equal tokens, difficulty-scaled points |
| Star Match | 1.5x on one chosen match per GW |
| Streaks | Cross-match by real-world time |
| Streak Reward | Multiplier on moments in streak (not flat bonus) |
| Streak Break | Wrong prediction breaks streak |
| Gameweek Lock | Rolling per match kickoff |
| Missed Gameweek | Not in draw, no score |
| Postponed Match | Tokens lost |
| Score Reveal | End of gameweek (surprise reveal) |
| Leaderboard | Both weekly (primary) + season cumulative |
| Mini-leagues | MVP — friend groups |
| Prizes | Introduced with traction |
| Quick Pick | Yes — auto-fill then edit |
| Moment Catalog UI | Filterable cards → zone assignment |
| Betting Integration | Never — free-to-play identity |
| Shareable Card | Yes — Match Story post-gameweek |
| Competition Scope | Premier League only |
| Onboarding | Guided tutorial (UX phase) |

### Draft Moment Catalog (MVP)

| Moment | Difficulty Tier | Notes |
|---|---|---|
| ⚽ [Team] scores | 🟢 Common | Core moment |
| 🟨 [Team] yellow card | 🟢 Common | Multiple per match usually |
| 🔄 [Team] substitution | 🟢 Common | Always happens |
| 📐 Corner kick [Team] | 🟢 Common | Frequent, needs API confirmation |
| 🥅 Penalty awarded | 🟡 Uncommon | Not every match |
| ⚽⚽ [Team] scores 2nd goal | 🟡 Uncommon | Derived from goal data |
| 🎯 Penalty scored | 🟡 Uncommon | Subset of penalty awarded |
| 🔀 Own goal | 🔴 Rare | Uncommon occurrence |
| 🟥 Red card | 🔴 Rare | Rare, high drama |
| ❌ Penalty missed/saved | 🔴 Rare | Very rare |
| ⚽⚽⚽ [Team] scores 3rd goal | 🔴 Rare | Uncommon |
| 🟨🟨 2+ yellow cards same zone | 🔴 Rare | Derived |

**Note:** Catalog to be refined against betting site event types during product spec phase.

### Scoring Structure (To Be Refined)

| Component | Description |
|---|---|
| **Moment Points** | Difficulty-scaled (Common < Uncommon < Rare). Exact values TBD in game mechanics session |
| **Zone Bonus** | Standard zones: base bonus. Stoppage zones (7 & 8): elevated bonus |
| **Zone Hit Rule** | Exact zone only — no adjacent partial credit |
| **Star Match** | All moments on chosen match score 1.5x |
| **Streak Multiplier** | Consecutive correct moments (by real-world time) multiply those moments' scores |
| **Wrong Moment** | 0 points (no negative scoring) |

---

## Idea Organization and Prioritization

### Theme 1: Core Game Mechanic
Decisions defining how the game fundamentally works — 20 tokens, zones, moments, difficulty tiers, scoring. **Fully resolved for MVP.**

### Theme 2: Strategic Depth & Differentiation
Star Match, streaks across matches, difficulty ratio constraints, Quick Pick. These are the features that make this MORE than a simple prediction app. **Key differentiators.**

### Theme 3: Engagement & Retention
Mini-leagues, Match Story shareables, end-of-gameweek reveal, push notifications, season leaderboard. **Critical for user retention.**

### Theme 4: Simplification & Scope Control
Eliminating betting redirect, player-specific moments, live scoring, cups, state moments. **Smart MVP scoping.**

### Theme 5: Future Roadmap
| Priority | Feature |
|---|---|
| v2 | Captain / Confidence Boost (double points on one moment) |
| v2 | Player-specific moments ("Saka scores") |
| v2 | Live scoring during matches |
| v2 | Mini-league enhancements / Moment Duels |
| Future | Quick Play pub mode (QR code, single match) |
| Future | Broadcaster white-label partnership |
| Future | Multi-sport adaptation |

### Breakthrough Concepts
1. **Cross-match streaks by real-world time** — genuinely novel mechanic not seen in competitor apps
2. **Stoppage time zones with elevated bonus** — mirrors real football drama
3. **Matchday squad of 20 spread freely across all matches** — strategic depth with symbolic branding
4. **Streak multiplier scaled by difficulty** — elegant integration of risk and reward

---

## Action Planning: Next Steps

| Step | Action | Skill/Phase |
|---|---|---|
| 1 | **Create Product Brief** | `bmad-product-brief` — formalize this concept into a structured brief |
| 2 | **Research moment catalog** | Cross-reference betting sites for verifiable event types |
| 3 | **Game mechanics session** | Define exact point values, zone bonuses, streak multipliers, difficulty calibration |
| 4 | **Technical research** | Identify football data API (football-data.org, API-Football, etc.) |
| 5 | **App naming / brand** | Brainstorm name — "moments" themed or iconic commentary inspired |
| 6 | **Create PRD** | `bmad-create-prd` — full product requirements document |
| 7 | **UX Design** | `bmad-create-ux-design` — filterable card UI, zone picker, onboarding flow |

---

## Session Summary

**Key Achievements:**
- Evolved from a vague "fantasy football meets betting" concept to a **fully specified MVP game mechanic**
- Resolved 15+ open design questions through structured exploration
- Identified and neutralized 12 potential failure modes
- Created a clean separation between MVP scope and future roadmap
- Discovered genuinely novel mechanics (cross-match streaks, stoppage zones)

**Creative Journey:**
Sean demonstrated strong product instincts throughout — consistently choosing simplicity over complexity, user agency over system control, and clean branding over feature bloat. The concept evolved significantly from the original linear timeline / betting API approach to a much stronger self-contained zone-based game with football-native branding (matchday squad of 20, Star Match as captain).

**Recommended Next Step:** Create a Product Brief using `bmad-product-brief` to formalize this concept, then proceed to PRD creation.

