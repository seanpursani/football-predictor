---
stepsCompleted: [step-01-init, step-02-discovery, step-02b-vision, step-02c-executive-summary, step-03-success, step-04-user-journeys, step-05-domain-skipped, step-06-innovation, step-07-project-type, step-08-scoping, step-09-functional, step-10-nonfunctional, step-11-polish]
inputDocuments:
  - '_bmad-output/brainstorming/brainstorming-session-2026-04-20.md'
workflowType: 'prd'
classification:
  projectType: mobile_app
  domain: gaming_entertainment
  complexity: medium
  projectContext: greenfield
---

# Product Requirements Document - LeColpo

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
  - **Precision Picks** — team event + event-type-specific precision fields + minute + window (±5/10/15 min). Scoring layers vary by event type but are always independent and additive (partial credit always possible): event points + timing bonus + event-specific precision bonus(es). All precision fields are required — since layers are additive and independent, there is no penalty for being wrong on any individual layer.
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
- Basic push notifications (Match Builder open + results ready)

### Growth Features (Post-MVP)

- Match Story shareable cards (post-gameweek visual for social sharing)
- Live scoring during matches
- Mini-league enhancements / Moment Duels
- Advanced push notifications (deadline reminders, personalised alerts)
- Sponsored weekly prizes from partner brands
- Event type caps if user behaviour warrants it

### Vision (Future)

- Brand/betting partnership — e.g., betting company sponsor translates top picks into a real accumulator; sponsored prizes
- Broadcaster white-label partnership (B2B)

## User Journeys

### Journey 1: Jake — The Casual Fan (First Gameweek)

**Who:** Jake, 22, watches Match of the Day most weekends, follows Arsenal on socials, has never done FPL because it feels like too much effort. His mate Dan texts the group chat: "just signed up to this match prediction thing, join our league."

**Opening Scene:** Jake clicks the invite link, downloads the app, creates an account. He lands on an onboarding tutorial that walks him through the two prediction types in under 60 seconds: Match Moments are yes/no calls, Precision Picks are "who does what, and when." Five rules on one screen. He gets it.

**Rising Action:** The Match Builder window is open. Jake sees this gameweek's matches laid out as cards. He taps Arsenal vs Chelsea — a catalog of moments appears, each showing its point value. He drags "BTTS — Yes" (12 pts) into his squad as a Match Moment. Then he builds a Precision Pick using the goal micro-flow: Arsenal score → Saka (scorer) → Odegaard (assister) → minute 28 → ±10 min. The card shows his potential points breakdown — event base, timing bonus range, Saka's scorer bonus, and Odegaard's assister bonus. He doesn't overthink it — more fields just means more chances to score points. He fills 15 tokens manually across 4 matches he cares about and leaves the remaining 5 slots empty — no penalty, no pressure to fill them all. He picks his Captain: the Saka Precision Pick. He saves his squad.

**Climax:** Sunday evening. The gameweek is over. Jake gets a notification: "Your results are in." He opens the app. His score builds moment by moment — greyed out misses, green hits, a gold flash for an exact minute hit on a corner pick. Saka scored at minute 31 — inside his ±10 window. Event points ✓, timing bonus ✓, player bonus ✓, Captain 2x ✓. He's buzzing. He checks the mini-league — he's 2nd behind Dan. He screenshots and drops it in the group chat.

**Resolution:** Jake's already thinking about next gameweek. He didn't need to know xG stats or track 15 players across a season. He just needed opinions about matches he was already going to watch. He's hooked.

### Journey 2: Priya — The Strategist (Gameweek 5)

**Who:** Priya, 29, data analyst, loves FPL but wants something more match-focused. She's been playing since gameweek 1 and has figured out the scoring system deeply.

**Opening Scene:** Match Builder opens on Wednesday. Priya has already checked which fixtures have the most interesting odds-to-points conversions this week. She notices Bournemouth vs Ipswich has inflated points on "Over 2.5 Goals" because the odds API reflects both teams' leaky defences — 18 points for a Match Moment that she thinks is near-certain. Easy value.

**Rising Action:** She builds her squad methodically. She loads 8 Match Moments across safe, high-probability outcomes for consistent base points. Then she constructs 12 Precision Picks — deliberately sequencing events she thinks will happen early in matches to build a cross-match streak. She picks "first goal" Precision Picks in the early kickoff games with tight ±5 windows, knowing the streak multiplier will compound if she lands 3-4 in a row ordered by real-world event time. Her Captain goes on a high-value Precision Pick — Salah to score in Liverpool vs Spurs, minute 55, ±5 min. Massive points if it lands.

**Climax:** Results reveal. She hit 6 of her 8 Match Moments. Her streak ran to 4 consecutive Precision Picks before breaking — the multiplier stacked beautifully on picks 2, 3, and 4. The Salah Captain pick missed on player (Diaz scored instead at minute 52) but she still banked the event + timing points at 2x. She finishes top of her mini-league and 340th globally for the week.

**Resolution:** She shares her Match Story card on Twitter — it shows her streak highlight and captain near-miss. She's already planning next week's streak sequence. The depth is there for her without the app ever explaining "expected value" — the points just reward smart thinking naturally.

### Journey 3: Dan — The Social Organiser

**Who:** Dan, 25, the one in every friend group who makes the WhatsApp group, organises the five-a-side, and ran the office World Cup sweepstake. He heard about the app from an ad and immediately saw the mini-league potential.

**Opening Scene:** Dan signs up, creates a mini-league called "Sunday League Legends", copies the invite link and drops it in three group chats — uni mates, work colleagues, five-a-side crew. Within 24 hours, 14 people have joined.

**Rising Action:** The Match Builder window opens. Dan fills his squad quickly — he's not the most strategic player, but he doesn't care. He's in it for the banter. He messages the group: "who's captaining a Haaland pick? Cowards." During the build window, the group chat lights up — people sharing their picks, debating whether BTTS is worth it in the Everton game, arguing about whether anyone is brave enough to pick a ±5 window on a red card.

**Climax:** Gameweek ends. Dan opens the mini-league leaderboard. His mate Chris — who knows nothing about football — is somehow 3rd because he Quick Picked and got lucky. Dan is 8th. The group chat explodes. The content writes itself.

**Resolution:** Dan doesn't need prizes. The league table IS the prize. Next week, two people from his five-a-side group invite their own mates — the league grows to 19. Dan didn't market the app. The mini-league did.

### Journey 4: System Admin / Ops (Automated + Manual)

**Who:** Sean (you) or a future ops role — managing the gameweek lifecycle and ensuring the system runs correctly.

**Opening Scene:** It's Tuesday. The Premier League fixture schedule for the upcoming gameweek is confirmed. The system needs to prepare the Match Builder.

**Rising Action:** An automated job fetches odds from the API for all fixtures, converts them to point values using the scoring formula, and populates the moment catalog. The Match Builder window opens automatically. The admin dashboard shows: 10 matches loaded, 47 Match Moment markets, 62 Precision Pick event types, all point values locked. A quick sanity check — no fixtures missing, no zero-point moments, no API errors flagged.

**Climax:** Gameweek plays out. After the final match, another automated job fetches match event data — goals (player + minute), cards (player + minute), subs (player + minute), corners. The scoring engine processes every user's 20 tokens against actual events. Points calculated, streaks resolved, captain multipliers applied, leaderboards updated. The admin dashboard shows: 2,340 users scored, 0 calculation errors, results ready for reveal.

**Resolution:** If something goes wrong — an API returns incomplete data, a match is postponed, a scoring edge case appears — the admin has tools to: manually trigger a rescore, flag a match as void (tokens lost per existing rules), or investigate a specific user's score breakdown. The goal is that 99% of gameweeks require zero manual intervention.

### Journey Requirements Summary

| Journey | Key Capabilities Revealed |
|---|---|
| **Jake (Casual Fan)** | Onboarding tutorial, Match Builder UI, Quick Pick, moment catalog with point values, score reveal with visual feedback, mini-league invite via link |
| **Priya (Strategist)** | Odds-to-points transparency, streak sequencing visibility, Captain selection, detailed score breakdown, global leaderboard, Match Story sharing |
| **Dan (Social Organiser)** | Mini-league creation + invite link sharing, leaderboard display, social engagement during build window |
| **System Ops** | Automated odds fetch + lock, moment catalog generation, match event ingestion, scoring engine, rescore tools, admin dashboard, error monitoring |

## Innovation & Novel Patterns

### Detected Innovation Areas

1. **Minute + confidence window mechanic** — No prediction app lets users pick an exact minute AND set their own precision buffer (±5/10/15 min). This creates a user-controlled risk/reward slider on every Precision Pick — a mechanic with no direct competitor equivalent.

2. **Cross-match streaks by real-world event time** — Streaks are ordered by when events actually happened across all matches in a gameweek, not by match or by user's predicted minute. This creates an emergent narrative arc that unfolds across the entire gameweek — genuinely novel in the prediction game space.

3. **Layered scoring on Precision Picks** — Scoring layers are event-type-specific but always independent and additive, meaning partial credit is always possible. Goals score across four layers (event + timing + scorer + assister); substitutions score on player on/off identity; corners score on zone rather than player. All precision fields are always required — since no layer can subtract points, requiring every field costs the user nothing and maximises scoring opportunity and reveal richness.

4. **Odds-as-difficulty without gambling** — Using betting odds APIs as the difficulty/points calibration engine while keeping the product entirely free-to-play. The app inherits the betting market's intelligence (match-specific, crowd-calibrated difficulty) without being a betting product. This separation of concerns is architecturally novel.

5. **Accumulator gamification for non-gamblers** — Extracting the core engagement loop of betting accumulators (stacking predictions, cascading outcomes) and packaging it as an accessible, age-appropriate game. The mechanic is proven in gambling; applying it to a free-to-play social game is the innovation.

### Market Context & Competitive Landscape

- **FPL:** Season-long player ownership, no match-level prediction, no timing mechanic, no accumulator feel
- **Sky Super 6:** 6 correct scores only, no timing, no moment diversity, no social features, weekly prizes only
- **Betting apps:** Real money, age-gated, regulated, no gamification beyond odds. Accumulators are popular but carry financial risk
- **Superbru / Predictor apps:** Match result prediction only, no event-level or timing mechanics

No competitor combines timing precision, layered scoring, odds-derived difficulty, and social mini-leagues in a free-to-play package.

### Validation Approach

- **Timing mechanic validation:** Does the minute + window mechanic feel fun or frustrating? Validate with early user testing — if users engage with window sizing (not all picking ±15), the mechanic works
- **Scoring balance validation:** Does the odds-to-points formula produce satisfying score distributions? Simulate with historical match data before launch
- **Streak engagement validation:** Do users notice and strategise around streaks, or is it invisible? Track whether users sequence Precision Picks deliberately across early-kickoff matches

### Risk Mitigation

| Risk | Mitigation |
|---|---|
| Timing mechanic feels too complex | Onboarding tutorial; Quick Pick as safety net; Match Moments exist as simple alternative |
| Odds API changes pricing or terms | Abstract the odds layer — app only needs point values, not raw odds. Multiple API providers can be swapped |
| Streaks too random to feel strategic | Tune streak multiplier values; if streaks feel arbitrary, reduce multiplier impact without removing the feature |
| Scoring too opaque for casual users | Show points, not odds. Every card displays its value upfront. Detailed breakdown on results screen for those who want it |

## Mobile App Specific Requirements

### Project-Type Overview

Cross-platform mobile app (iOS & Android) delivering a gameweek-based prediction game. The app is primarily an online experience — all core interactions (building squads, viewing results, checking leaderboards) require network connectivity. No offline mode needed for MVP.

### Platform Requirements

- **Platforms:** iOS 15+ and Android 10+ (covers ~95% of active devices)
- **Cross-platform framework:** Technology-agnostic — to be decided in architecture phase
- **Screen sizes:** Responsive design for phones; tablet support deferred post-MVP
- **Orientation:** Portrait-only for MVP

### Device Permissions & Features

- **Network:** Required — online-only app
- **Push notifications:** Permission requested at onboarding for gameweek alerts
- **Share sheet:** Native share for mini-league invite links
- **No exotic permissions:** No camera, GPS, Bluetooth, AR, or biometric auth required for MVP

### Push Notifications (MVP — Minimal)

Two system-triggered notification types:

| Trigger | Notification | Timing |
|---|---|---|
| Match Builder window opens | "GW{n} is open! Build your squad before {first kickoff}" | When odds are locked and catalog is live |
| Results ready | "Your results are in! Check your score" | After scoring engine completes post-gameweek |

Standard opt-in via OS permission prompt during onboarding. No complex scheduling, segmentation, or personalisation for MVP.

### Store Compliance Considerations

- **Gambling classification risk:** App uses betting odds data and accumulator-style language. Must be clearly positioned as a free-to-play game with no real-money transactions. App store descriptions and screenshots must avoid gambling framing.
- **Age rating:** Target 4+ (iOS) / Everyone (Android) — no real money, no user-generated content concerns, no violence
- **Privacy policy:** Required for both stores — covers account data, prediction history, leaderboard data
- **Deep links:** Mini-league invite links need Universal Links (iOS) / App Links (Android) support for seamless onboarding from shared URLs

### Implementation Considerations

- **Authentication:** Social login (Apple, Google) for frictionless signup + mini-league identity
- **Data sync:** All state server-side — no local-first architecture needed. App is a thin client over API.
- **App size:** Target <50MB download — no heavy assets, no embedded media

## Project Scoping & Phased Development

### MVP Strategy

**Approach:** Experience MVP — prove the core game loop is fun and sticky. Monetisation deferred. The minimum viable experience is: Match Builder → scoring → reveal → mini-league competition. Every MVP feature passed a must-have filter: without it, the product either fails or loses its identity.

**Resource Model:** Solo developer with serverless backend and cross-platform framework. Designed for one person to build, deploy, and operate with minimal ongoing ops via automated gameweek lifecycle.

### Risk Assessment

| Risk | Severity | Mitigation |
|---|---|---|
| Odds API reliability/cost | High | Abstract odds layer; evaluate multiple providers (The Odds API, API-Football, BetFair); cache aggressively |
| Match events API accuracy | High | Cross-validate with multiple sources; manual rescore override |
| Scoring edge cases | Medium | Simulate with historical match data pre-launch; rescore tooling |
| App store gambling rejection | Medium | Clear free-to-play positioning; no odds shown; no real money language |
| Solo developer bandwidth | Medium | Lean MVP; serverless backend; cross-platform to avoid double work |
| Gameweek spanning 10+ days | Low | Single odds lock at window open; all predictions lock at first kickoff — already designed for this |

## Functional Requirements

### Account & Identity

- **FR1:** User can create an account via social login (Apple, Google)
- **FR2:** User can view and edit their profile (display name)
- **FR3:** User can grant or revoke push notification permissions

### Gameweek Lifecycle

- **FR4:** System can fetch and lock odds from external API when Match Builder window opens
- **FR5:** System can convert odds to point values using a configurable scoring formula
- **FR6:** System can populate each gameweek with the current fixture list, apply locked odds to generate match-specific point values for each card type, and make the configured catalog available when the Match Builder window opens
- **FR7:** System can open and close the Match Builder window on a configurable schedule
- **FR8:** System can lock all user predictions at the Match Builder deadline (first kickoff)
- **FR9:** System can fetch match event data (goals, cards, subs, corners — with player + minute) from external API after matches complete
- **FR10:** System can determine when all matches in a gameweek are complete and trigger scoring

### Match Builder (Squad Building)

- **FR11:** User can view all fixtures in the current gameweek
- **FR12:** User can browse the moment catalog filtered by match, event type, or team
- **FR13:** User can add a Match Moment to their squad (match-level outcome, binary yes/no)
- **FR14:** User can add a Precision Pick to their squad using an event-type-specific micro-flow (team → event type → minute → window → event-specific precision fields). Each event type presents only its relevant fields in sequence — no unused fields are shown.
- **FR14a:** The Precision Pick micro-flow supports the following event-type schemas:

  | Event Type | Required Fields | Optional Fields | Scoring Layers |
  |---|---|---|---|
  | Goal | Scorer, Assister | — | Event + Timing + Scorer bonus + Assister bonus |
  | Substitution | Player On, Player Off | — | Event + Timing + Player On bonus + Player Off bonus |
  | Corner | Zone | — | Event + Timing + Zone bonus |
  | Yellow Card | Player | — | Event + Timing + Player bonus |
  | Red Card | Player | — | Event + Timing + Player bonus |

- **FR15:** User can select a confidence window (±5, ±10, or ±15 minutes) for each Precision Pick
- **FR16:** User can see the point value breakdown for any moment before selecting it
- **FR17:** User can designate one moment as Captain (2x points)
- **FR18:** User can remove or replace any moment in their squad before deadline
- **FR19:** User can use Quick Pick to auto-fill remaining empty token slots
- **FR20:** User can view their complete squad summary before submitting
- **FR21:** User can submit their squad (locks their 20 tokens for the gameweek)
- **FR22:** System enforces the 20-token limit per gameweek

### Scoring Engine

- **FR23:** System can score Match Moments (correct = flat odds-derived points, incorrect = 0)
- **FR24:** System can score Precision Picks across event-type-specific independent layers, all additive (partial credit always possible):
  - All types: event points (event happened) + timing bonus (event fell within user's window)
  - Goal: scorer bonus (correct scorer) + assister bonus (correct assister)
  - Substitution: player-on bonus (correct player coming on) + player-off bonus (correct player going off)
  - Corner: zone bonus (correct zone)
  - Yellow/Red Card: player bonus (correct player)
- **FR25:** System can award exact minute jackpot bonus when a Precision Pick hits the precise minute
- **FR26:** System can apply Captain Moment multiplier (2x) to the designated moment's total points
- **FR27:** System can calculate cross-match streaks by ordering correct Precision Picks by real-world event time
- **FR28:** System can apply streak bonus (additive flat points) to consecutive correct Precision Picks
- **FR29:** System can handle postponed matches (tokens lost, no points awarded)
- **FR30:** System can calculate a user's total gameweek score from all 20 tokens

### Score Reveal & Results

- **FR31:** User can view their gameweek results after scoring is complete
- **FR32:** User can see per-moment scoring breakdown (which layers scored, what bonus applied)
- **FR33:** User can see visual feedback distinguishing hits, misses, timing bonuses, and exact minute jackpots
- **FR34:** User can view their streak sequence and where it broke

### Leaderboards

- **FR35:** User can view a weekly gameweek leaderboard (all users, ranked by gameweek score)
- **FR36:** User can view a season cumulative leaderboard (all users, ranked by total season score)
- **FR37:** User can see their own rank and score on both leaderboards

### Mini-Leagues

- **FR38:** User can create a mini-league with a custom name
- **FR39:** User can generate a shareable invite link for their mini-league
- **FR40:** User can join a mini-league via invite link (including deep link from outside the app)
- **FR41:** User can view the mini-league leaderboard (weekly + season cumulative)
- **FR42:** User can belong to multiple mini-leagues simultaneously
- **FR43:** User can leave a mini-league

### Onboarding

- **FR44:** New user is presented with a guided tutorial explaining the two prediction types, scoring, and 5 core rules
- **FR45:** User can complete onboarding in under 60 seconds

### Push Notifications

- **FR46:** System can send a push notification when the Match Builder window opens
- **FR47:** System can send a push notification when gameweek results are ready

### Admin & Operations

- **FR48:** Admin can view gameweek status (catalog loaded, odds locked, matches complete, scoring done)
- **FR49:** Admin can manually trigger a rescore for a gameweek
- **FR50:** Admin can flag a match as void (tokens lost per rules)
- **FR51:** Admin can investigate a specific user's score breakdown
- **FR52:** System logs API fetch results and scoring operations for error monitoring
- **FR53:** Admin can add, remove, or modify card types in the moment catalog

## Non-Functional Requirements

### Performance

- Match Builder screen loads in <2 seconds on 4G connection
- Moment catalog filtering (by match, team, event type) responds in <200ms (client-side)
- Squad submission completes in <1 second
- Score reveal screen renders in <3 seconds with full gameweek data (20 tokens × scoring breakdown)
- Leaderboard loads in <2 seconds for mini-leagues up to 100 members and global top 1000

### Security

- All data in transit encrypted via TLS 1.2+
- User authentication tokens follow OAuth 2.0 best practices (short-lived access tokens, secure refresh)
- No betting odds data exposed to users — only derived point values
- User prediction data not visible to other users before gameweek deadline
- Admin operations require elevated authentication

### Scalability

- System supports up to 10,000 concurrent users during Match Builder window without degradation
- Scoring engine processes all users within 5 minutes of final match completion
- Database scales to support a full Premier League season (38 gameweeks × all users × 20 tokens per gameweek)
- API rate limits managed to stay within provider quotas during odds fetch and event ingestion

### Integration

- Odds API: System tolerates API downtime of up to 4 hours during the Match Builder preparation window (retry with exponential backoff)
- Match Events API: System tolerates delayed event data by up to 2 hours post-match before flagging for manual intervention
- Push notification delivery via platform-native services (APNs/FCM) with best-effort delivery — no guaranteed delivery SLA for MVP
- Deep link handling works across iOS Universal Links and Android App Links for mini-league invites

### Reliability

- Zero tolerance for scoring calculation errors — if detected, system halts reveal and alerts admin
- User predictions persisted immediately on submission — no data loss on app crash or network interruption
- Gameweek lifecycle (odds lock → match events → scoring → reveal) runs without manual intervention for 99% of gameweeks
- System handles postponed/rescheduled matches gracefully without corrupting other match data
