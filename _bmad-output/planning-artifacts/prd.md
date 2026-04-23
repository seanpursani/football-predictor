---
stepsCompleted: [step-01-init, step-02-discovery, step-02b-vision, step-02c-executive-summary, step-03-success]
inputDocuments:
  - '_bmad-output/brainstorming/brainstorming-session-2026-04-20.md'
workflowType: 'prd'
classification:
  projectType: mobile_app
  domain: gaming_entertainment
  complexity: medium
  projectContext: greenfield
---

# Product Requirements Document - football-prediction-app

**Author:** Sean
**Date:** 2026-04-22

## Executive Summary

A free-to-play mobile prediction game for Premier League football. Users predict match moments — what will happen and when — across all fixtures in a gameweek, using a squad of 20 tokens. The app captures the engagement loop of betting accumulators (stacking predictions, watching them land or miss) without real money, age restrictions, or gambling stigma. It targets football fans who want competitive, social prediction gameplay: casual fans priced out of betting, younger fans locked out by age gates, and FPL players looking for a match-day-focused alternative.

Two prediction types create layered depth: **Match Moments** (will it happen? e.g., Both Teams to Score, Over 2.5 Goals) deliver accumulator-style flat points, while **Precision Picks** (when will it happen? e.g., first goal at minute 23 ±5 min) introduce a timing precision mechanic unique to this product. Points are derived from betting odds APIs — the market sets difficulty per fixture, per moment — so the app inherits calibrated risk/reward without manual curation. Gameweek predictions lock at kickoff, scores reveal after the final whistle, and mini-leagues drive social competition.

### What Makes This Special

1. **Accumulator thrill without gambling** — the dopamine of stacking predictions, accessible to all ages, no real money, no regulatory burden
2. **Timing as a skill dimension** — the minute + confidence window mechanic (±5/10/15 min) lets users control their own precision/risk tradeoff per Precision Pick, a mechanic no competitor offers
3. **Cross-match streaks** — consecutive correct Precision Picks, ordered by real-world event time across all matches, create a novel narrative arc through a gameweek
4. **Match narrative focus** — where FPL tracks player ownership across a season, this app tracks what actually happens on the pitch, moment by moment
5. **Self-balancing difficulty** — odds-derived points mean the market calibrates every prediction's value per fixture per week, scaling the catalog automatically

## Project Classification

- **Project Type:** Cross-platform mobile app (iOS & Android)
- **Domain:** Gaming / Entertainment (sports prediction)
- **Complexity:** Medium — no real-money transactions or gambling regulation, but requires external API integration (odds + match events), scoring engine, and social features
- **Project Context:** Greenfield — new product, no existing codebase

## Success Criteria

### User Success

- **First gameweek completion:** New user understands the rules, fills their 20-token squad during the Match Builder window, and submits predictions without confusion or abandonment
- **The reveal moment:** User checks end-of-gameweek results — sees points calculated per moment, exact minute hits highlighted, streak multipliers applied — and feels the payoff of their strategic choices
- **Social hook:** User creates or joins a mini-league within their first 2 gameweeks; shares and discusses picks during the Match Builder window
- **Return behaviour:** User comes back for gameweek 2 — simple rules, strategic agency, and social competition make it worth repeating
- **Skill progression:** By gameweek 3-4, users make deliberate strategic choices (balancing Match Moments vs Precision Picks, sizing windows, picking captain, choosing players) — they feel clever, not lucky

### Business Success

- **3-month target:** Consistent weekly active users returning gameweek-over-gameweek; mini-leagues with 3+ members showing organic social growth
- **Season target:** Organic word-of-mouth growth via mini-leagues and Match Story shareables; retained user base that returns next season
- **Growth signal:** Users inviting friends to mini-leagues unprompted — the product is its own acquisition channel
- **Monetization (deferred):** Revenue model explicitly out of MVP scope — ads, sponsorship, or premium features explored once engagement is validated

### Technical Success

- **Scoring accuracy:** 100% correct calculation — odds-derived values, timing bonuses, player bonuses, streak multipliers, captain doubling all reliable
- **API reliability:** Odds fetched and locked when Match Builder window opens; match event data (including player-level events) processed accurately post-match
- **Performance:** Predictions submit without friction; results reveal loads quickly with full gameweek data
- **Data integrity:** No lost predictions, no scoring errors, no leaderboard inconsistencies

### Measurable Outcomes

| Metric | Target | Timeframe |
|---|---|---|
| Gameweek completion rate | >80% of registered users submit predictions | Per gameweek |
| Retention (GW1 → GW2) | >60% of first-time users return | First month |
| Mini-league creation | >50% of users in at least one league | First month |
| Scoring accuracy | 100% — zero calculation errors | Ongoing |
| Onboarding completion | >90% complete tutorial and submit first squad | Ongoing |

## Product Scope

### MVP - Minimum Viable Product

- **Two prediction types:**
  - **Match Moments** — match-level outcomes (BTTS, Over/Under, Match Result, Clean Sheet, etc.). Binary, flat odds-derived points.
  - **Precision Picks** — team event + player + minute + window (±5/10/15 min). Three scoring layers: event points + timing bonus + player bonus. Player bonus is additive (wrong player still earns event + timing points).
- 20 tokens per gameweek, free spread across all PL matches, any mix of types
- **Match Builder window:** opens ~3-4 days before first kickoff; odds fetched from API and locked as points at window open; deadline = first kickoff
- Captain Moment (2x on one chosen moment, any type)
- Cross-match streaks on Precision Picks (ordered by real-world event time)
- End-of-gameweek score reveal
- Weekly + season cumulative leaderboards
- Mini-leagues (create/join with friends)
- Quick Pick auto-fill
- Guided onboarding tutorial
- Moment catalog UI with filterable cards
- No caps on event type usage — scoring self-balances via odds

### Growth Features (Post-MVP)

- Match Story shareable cards (post-gameweek visual for social sharing)
- Live scoring during matches
- Mini-league enhancements / Moment Duels
- Push notification system (gameweek reminders, reveal alerts)
- Sponsored weekly prizes from partner brands
- Event type caps if user behaviour warrants it

### Vision (Future)

- Brand/betting partnership — e.g., betting company sponsor translates top picks into a real accumulator; sponsored prizes
- Broadcaster white-label partnership (B2B)
