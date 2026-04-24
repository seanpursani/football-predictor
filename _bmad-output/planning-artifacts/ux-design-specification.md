---
stepsCompleted: [step-01-init, step-02-discovery, step-03-core-experience, step-04-emotional-response, step-05-inspiration, step-06-design-system, step-07-defining-experience]
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/brainstorming/brainstorming-session-2026-04-20.md'
---

# UX Design Specification — football-prediction-app

**Author:** Sean
**Date:** 2026-04-23

---

## Executive Summary

### Project Vision

A free-to-play mobile prediction game that captures the thrill of betting accumulators — stacking predictions, watching them land or miss — without real money, age restrictions, or gambling stigma. Users predict match moments across all Premier League fixtures in a gameweek using a squad of 20 tokens. Two prediction types create layered depth: Match Moments (binary accumulator-style outcomes) and Precision Picks (event + player + exact minute + confidence window). Points are derived from betting odds APIs, inheriting market-calibrated difficulty. The core loop is: Build → Lock → Watch → Reveal → Compete.

### Target Users

| Persona | Archetype | Core Need | Tech Comfort | Key UX Requirement |
|---|---|---|---|---|
| **Jake** (22) | Casual Fan | Fun with mates, low effort | Moderate — uses apps daily, not a power user | Fast onboarding, Quick Pick safety net, clear point values |
| **Priya** (29) | Strategist | Depth, skill expression, optimisation | High — data analyst, FPL veteran | Transparent scoring, streak visibility, detailed breakdowns |
| **Dan** (25) | Social Organiser | Banter, group competition | Moderate — social-first, shares everything | Easy league creation, shareable invite links, leaderboard prominence |

### Key Design Challenges

1. **Complexity management** — Two prediction types with different input requirements must feel unified and simple. A casual user building 20 picks across 10 matches cannot feel overwhelmed.
2. **Information density** — Moment cards must communicate event type, team, point value, and prediction type without clutter. Precision Picks add player, minute, and window inputs.
3. **Score reveal as emotional payoff** — The end-of-gameweek reveal is the product's climactic moment. It must distinguish hits, misses, timing bonuses, exact minute jackpots, streak multipliers, and captain doubling with clear visual hierarchy — not a data dump.
4. **Onboarding two mechanics in <60 seconds** — Users must grasp both Match Moments and Precision Picks, plus captain, streaks, and the 20-token squad, without a wall of text.

### Design Opportunities

1. **Match Builder as ritual** — Squad building can feel like assembling a betting slip or packing a matchday squad. Satisfying interaction patterns make the build process feel like gameplay, not admin.
2. **Streak visualisation** — A timeline or chain showing how Precision Pick streaks built and broke across the gameweek — a signature UI element unique to this product.
3. **Confidence window as physical gesture** — The ±5/10/15 min window represented as a slider, ring, or pinch gesture — making the risk/reward tradeoff tactile and intuitive.
4. **Accumulator-style stacking** — Visual stacking of predictions (like a betting slip growing) creates anticipation and mirrors the dopamine loop the product is designed around.

## Core User Experience

### Defining Experience

The core interaction is **building a 20-token squad in the Match Builder**. Every gameweek, users curate a set of predictions across all Premier League fixtures — mixing Match Moments (binary outcomes) with Precision Picks (event + player + minute + window). This is the primary act of skill expression and the moment where users invest their attention. Everything else — reveal, leaderboards, mini-leagues — exists to pay off the choices made here.

The Match Builder must feel like assembling a betting accumulator: each card added raises the stakes, builds anticipation, and creates a personal narrative for the gameweek. The squad is not a form to fill — it's a story the user is writing about the weekend's football.

### Platform Strategy

- **Cross-platform mobile app** — iOS 15+ and Android 10+
- **Portrait-only**, touch-first interaction design
- **Online-only** — all state server-side, thin client over API
- **No exotic permissions** — network + push notifications only
- **Target <50MB** download — no heavy assets
- **Deep link support** — Universal Links (iOS) / App Links (Android) for mini-league invites

### Effortless Interactions

| Interaction | Design Intent |
|---|---|
| **Adding a Match Moment** | One-tap selection from moment catalog. Card shows point value upfront. No secondary inputs. |
| **Building a Precision Pick** | Guided micro-flow: select event → select player → pick minute → set window. Each step is one interaction, not a form. |
| **Squad auto-ordering** | Predictions self-sort by chronological minute within each match, and matches sort by kickoff time. The squad reads like a timeline — a 17th-minute Precision Pick appears before a 30th-minute goal prediction. The user sees their gameweek narrative building in order. |
| **Quick Pick** | One tap fills remaining empty slots. Feels like a safety net, not a lesser choice. Users can then edit individual picks. |
| **Captain selection** | Long-press or dedicated icon on any card to designate as Captain. Visual crown/star indicator. One captain at a time — selecting a new one deselects the old. |
| **Removing/replacing a pick** | Swipe-to-remove or tap-to-replace. No confirmation dialogs for pre-deadline changes. |
| **Streak sequence visibility** | Squad summary shows Precision Picks in real-world event time order across matches, so strategists can visualise and optimise their potential streak sequence before submitting. |

### Critical Success Moments

1. **First Match Builder completion (Jake's moment)** — A new user fills 20 tokens and submits without confusion. If they bounce here, nothing else matters. Quick Pick exists as the escape hatch: "don't know enough? one tap, you're in."

2. **Score reveal (the centrepiece)** — The notification lands: "Your results are in." The reveal screen is the emotional payoff of the entire gameweek. It must be captivating and visual — not a table of numbers. Moments reveal sequentially or with animation: greyed misses, green hits, gold flashes for exact-minute jackpots, streak chain building visually, captain 2x highlighted. This is the screen users screenshot and share. Supports two modes: dramatic first-view animation AND a fast summary for returning users.

3. **Mini-league leaderboard (Dan's moment)** — After the reveal, the mini-league leaderboard is embedded in the results flow — not a separate tab. Position changes (up/down arrows), relative movement, and the ability to see who you beat are front and centre.

4. **Streak realisation (Priya's moment)** — A strategist sees their Precision Picks chain together across matches in real-world event order, multipliers stacking. The streak visualisation must make this feel earned and visible — not buried in a tooltip.

### Experience Principles

1. **Sharp, not cute** — Sophisticated visual language that respects intelligence without being sterile. Clean typography, confident colour palette, premium sports-app aesthetic. Not a kids' game, not a spreadsheet — think betting app confidence without the gambling.

2. **Intuitive by structure** — The UI teaches through interaction, not instruction. Cards self-order by minute. Prediction types are visually distinct (different colour, shape, or icon for Match Moments vs Precision Picks). Streak sequences are visible during build. Users learn by doing.

3. **Build is gameplay** — The Match Builder is not a setup step before the game — it IS the game. Supports both speed (Quick Pick, one-tap adds) and strategy (streak sequencing, deliberate captain placement). Squad preview is screenshot-friendly for pre-deadline sharing.

4. **Reveal is reward** — The score reveal screen is the product's visual centrepiece. Dramatic first-view animation with fast summary mode for returning users. Mini-league leaderboard embedded in the results flow. Deserves the most design attention, the richest animation, and the clearest information hierarchy.

5. **Depth on demand** — Surface simple, drill for detail. A moment card shows its point value; tap for the scoring breakdown (base odds points + timing bonus tier + player bonus + captain 2x + streak multiplier position). Casual users see enough; strategists always find more. Detailed views are screenshot-friendly and shareable.

6. **Shareable by default** — Every key screen (squad preview, score reveal, leaderboard position) is screenshot-friendly or has native share. The app generates its own social content. The product is its own acquisition channel.

## Desired Emotional Response

### Primary Emotional Goals

| Emotion | When | Description |
|---|---|---|
| **Cleverness** | During build | "I see something others don't." Picking minute 23 for a Saka goal because you've watched Arsenal's patterns. The feeling of football knowledge being rewarded. |
| **Committed anticipation** | At deadline lock | The build window closes at first kickoff — your picks are frozen whether you're ready or not. The butterflies of a transfer deadline slamming shut. No button press; the clock takes your agency. |
| **Ambient tension** | During matches | The app isn't open, but it's in your head. "That corner at minute 34 — was that in my window?" Football becomes more engaging because your predictions are riding on it. |
| **Cascading excitement** | At reveal | Hits land one by one. Greyed misses, green hits, gold jackpots. The streak building. The captain 2x. Like watching an accumulator come in — except you earned it through knowledge. |
| **Social validation** | At leaderboard | You beat your mates, or you're already planning next week. Either way, it's fuel for the group chat. |

### Emotional Journey Mapping

| Stage | User State | Target Emotion | Design Implication |
|---|---|---|---|
| **Onboarding** | Curious but sceptical | Confidence + intrigue | Tutorial must feel fast and empowering, not patronising. "I get this, and it sounds fun." |
| **First build** | Tentative, exploring | Growing confidence | Quick Pick as safety net. Card point values visible. No dead ends. |
| **Experienced build** | Strategic, deliberate | Cleverness + agency | Streak sequencing, captain placement, odds-value hunting. The build becomes a craft. |
| **Pre-deadline** | Reviewing, second-guessing | Playful tension | Squad summary shows the full picture. Last-minute swaps feel easy. The countdown creates urgency. |
| **Deadline lock** | Passive — clock runs out | Committed anticipation | No submit button drama. The deadline passes and your picks are frozen. A subtle visual/notification: "Your squad is locked. Good luck." |
| **During matches** | Watching football, mentally tracking | Ambient tension | No live scoring in MVP — the tension lives in the user's head, not the app. |
| **Reveal notification** | Anticipation spike | Eager excitement | Push notification: "Your results are in." The user opens the app knowing something is waiting. |
| **Score reveal** | Engaged, reactive | Cascading excitement → satisfaction or "next time" | Sequential reveal with visual drama. Hits feel earned. Misses feel like "nearly." Never punishing. |
| **Leaderboard check** | Competitive | Social validation or competitive fire | Position relative to friends. Movement arrows. "I beat Chris" matters more than absolute score. |
| **Post-gameweek** | Reflective | Anticipation for next week | "I'll do better next time" or "wait till the group sees this." Either way, they're coming back. |

### Micro-Emotions

| Desired | Avoided | Design Response |
|---|---|---|
| **Confidence** | Confusion | Point values always visible. Two prediction types visually distinct. No hidden rules. |
| **Cleverness** | Randomness | Scoring rewards knowledge (timing precision, player selection). Skill expression is real. |
| **Excitement** | Indifference | Reveal uses animation, colour, and pacing. Never a flat list of numbers. |
| **Belonging** | Isolation | Mini-leagues from day 1. Leaderboard embedded in results. Share is one tap away. |
| **Pride** | Embarrassment | Premium aesthetic. Sharp, not cute. Using this app feels like being in the know, not playing a kids' game. |
| **Anticipation** | Anxiety | No real money. 0 points for wrong picks, never negative. The worst outcome is "better luck next week." |

### Design Implications

| Emotional Goal | UX Design Response |
|---|---|
| **Cleverness during build** | Show point values upfront. Let users see value asymmetries across fixtures. Make the moment catalog browsable and filterable so informed choices feel natural. |
| **Committed anticipation at deadline** | Countdown timer visible during build window. Subtle lock animation or notification when deadline passes. No dramatic "are you sure?" — the clock just runs out. |
| **Ambient tension during matches** | No live scoring in MVP. The absence of information IS the design — users watch football with their picks in mind. Post-MVP, live scoring could amplify this. |
| **Cascading excitement at reveal** | Sequential card-by-card reveal with distinct visual states: grey (miss), green (hit), gold (exact minute), chain link (streak), crown (captain 2x). Pacing matters — don't dump all 20 at once. |
| **Social validation at leaderboard** | Mini-league leaderboard shows position change, not just position. "↑3" or "↓1" next to your name. Friends' scores visible for comparison. |
| **Pride in the product** | Premium visual language throughout. No cheap gamification tropes (spinning wheels, confetti explosions). Celebration is restrained and confident — a gold flash, not a firework show. |

### Emotional Design Principles

1. **Earned, not lucky** — Every positive emotion should connect to a user decision. The exact-minute jackpot feels amazing because YOU picked that minute. Scoring rewards knowledge, not randomness.

2. **Tension without stakes** — The app creates the emotional arc of gambling (anticipation → commitment → outcome) without financial risk. The worst feeling is "I'll do better next week," never "I lost money."

3. **Celebration with restraint** — Victories are acknowledged with confident, premium visual feedback — a gold flash, a streak chain lighting up — not cartoon confetti or bouncing icons. The aesthetic respects the user's intelligence.

4. **Social fuel, not social pressure** — Mini-leagues and shareability create banter and competition, not obligation. Missing a gameweek means missing out, not letting people down.

5. **The clock decides** — The deadline lock is an emotional design feature, not just a rule. The moment your picks freeze creates committed anticipation that lasts until the reveal. The app doesn't ask "are you sure?" — the whistle blows and you're in.

## UX Pattern Analysis & Inspiration

### Inspiring Products Analysis

#### Betting Apps (Bet365, Sky Bet, Paddy Power)

**What they nail:**
- **Bet slip as accumulator builder** — adding selections is one tap. The slip grows at the bottom of the screen. Running total always visible. This is the closest UX analogue to our Match Builder.
- **Information density done right** — odds, markets, and match info packed into scannable rows without feeling cluttered. Users process a lot of data quickly because the hierarchy is consistent and learnable.
- **Speed of interaction** — experienced users can build a 10-leg accumulator in under a minute. No unnecessary confirmation steps, no animations blocking the flow.
- **No gamification** — betting apps don't need bouncing icons or achievement badges. The content IS the engagement. The odds, the potential payout, the risk. Clean and functional.

**What to adopt:** Bet slip interaction model for the Match Builder. Persistent squad summary (like a bet slip) anchored at the bottom or accessible via a tab. One-tap adds for Match Moments. Running token count always visible.

**What to avoid:** Betting apps are visually dense and assume expertise. Our onboarding needs to be gentler without patronising.

#### Fantasy Premier League (FPL)

**What they nail:**
- **Ritual engagement** — weekly deadline, squad management, transfer decisions. Users come back on a rhythm because the gameweek cycle creates natural return triggers.
- **Leaderboard obsession** — mini-leagues are FPL's stickiest feature. The product is social competition disguised as fantasy football.
- **Depth without forced complexity** — a casual user can pick 11 players and play. A hardcore user can track xG, fixture difficulty, and differential ownership. Same app, different depths.
- **Clean, functional UI** — not beautiful, not ugly. It works. Information is where you expect it. No surprises.
- **Data-rich player cards** — tap a player and see form, fixtures, ownership %, points history. Data guides selection without being forced on the user.

**What to adopt:** Mini-league structure, gameweek rhythm, depth-on-demand philosophy. The "same app, different depths" approach maps exactly to Jake vs Priya. Data-informed selection via drill-down cards.

**What to avoid:** FPL's onboarding is poor — new users face a squad builder with no guidance, budget constraints, and 600+ players. Our onboarding must be dramatically better. Also, FPL's results screen is flat — just numbers in a table. Our reveal must be more engaging.

#### Sports News Apps (BBC Sport, Sky Sports, The Athletic)

**What they nail:**
- **Card-based content layout** — scannable, tappable, consistent. Match cards with scores, team badges, and key stats. This is the visual language football fans already read fluently.
- **Match-centric navigation** — fixtures grouped by date/competition. Tap a match to drill into detail. This maps to our "browse by fixture" catalog navigation.
- **Live/post-match distinction** — clear visual states for upcoming, live, and completed matches. We need similar states for open, locked, and scored gameweeks.

**What to adopt:** Card-based layout for moment catalog and fixtures. Match-centric navigation for the build phase. Familiar football visual language (team badges, fixture formatting).

### Transferable UX Patterns

| Pattern | Source | Application in Our App |
|---|---|---|
| **Bet slip accumulator builder** | Betting apps | Match Builder — persistent squad summary, one-tap adds, running token count |
| **Card-based match layout** | Sports apps | Moment catalog — filterable cards grouped by fixture, scannable point values |
| **Mini-league leaderboards** | FPL | Direct adoption — create/join via link, weekly + cumulative tables |
| **Depth-on-demand information** | FPL | Surface: point value on card. Drill: full scoring breakdown on tap |
| **Data-informed selection cards** | FPL player cards | Moment card drill-down shows contextual historical data to guide picks (see below) |
| **Consistent row/card hierarchy** | Betting apps | Moment cards follow a fixed layout: icon, event name, team, points. Always the same structure, always scannable. |
| **Deadline countdown** | FPL + betting | Visible countdown to first kickoff. No surprises. |

### Contextual Data Hints (Moment Card Drill-Down)

**Concept:** When a user taps into a moment card detail view, show a one-line historical stat summary and a minimal visual (sparkline or dot history) to inform their decision. The surface stays clean; the depth is one tap away.

**Examples:**
- **BTTS — Chelsea vs Arsenal:** "BTTS hit in 7 of Chelsea's last 10 home matches" + dot chart (✓✓✗✓✓✓✗✓✓✓)
- **Over 2.5 Goals — Liverpool vs Spurs:** "3+ goals in 5 of last 6 meetings" + sparkline of goals per meeting
- **Yellow Cards — Arsenal match:** "Arsenal avg 2.1 yellows/match this season" + mini bar chart of recent matches
- **First Goal — Man City:** "City scored first in 8 of last 10 home games" + dot history

**Data Source:** The app already ingests match event data (goals, cards, corners, subs with player + minute) every gameweek for scoring. By storing this data, the app builds its own historical dataset over time — zero additional API cost. No external historical data API required. By gameweek 5-6, trends become meaningful. By mid-season, the data is genuinely useful for informed picks.

**Visualisation:** Simple ✓/✗ dot sequence only. Did BTTS happen in Chelsea's last tracked matches? ✓✗✓✓✗. No percentages, no averages, no sparklines, no bar charts. Just dots — instant to read, no interpretation needed.

**Design Rules:**
- **Surface level (moment card):** Event name, team, point value only. Clean and scannable.
- **One tap deep (card detail):** ✓/✗ dot history + full points breakdown. This is where Priya lives.
- **Accumulate as you go:** Only show data the app has collected itself through its own scoring pipeline. No external history.
- **Progressive richness:** Early in the season, data is sparse — show what's available without forcing it. As the season progresses, the cards get richer. The app improves with age.
- **No data, no filler:** If insufficient history exists for a stat, don't show a placeholder. Just show the points breakdown.

### Anti-Patterns to Avoid

| Anti-Pattern | Why It Fails | Our Response |
|---|---|---|
| **Gamification for its own sake** | Spinning wheels, achievement badges, confetti — feels cheap and juvenile for this audience. Betting app users will reject it immediately. | Restrained celebration. Gold flash for jackpots, not fireworks. No badges, no streaks-of-using-the-app. |
| **Gesture novelty without utility** | A pinch-to-scale window gesture sounds cool but may confuse users or feel fiddly on small screens. If it's not instantly intuitive, it's a liability. | Window selection (±5/10/15) uses a simple segmented control or toggle — the most boring, most reliable pattern. Only upgrade to gesture if user testing proves it's faster. |
| **Complex onboarding flows** | FPL drops you into a 600-player squad builder with no guidance. Tutorial carousels that users skip. | Show-by-doing: first build includes inline hints. Quick Pick as immediate safety net. Five rules on one screen. |
| **Hiding key information** | Some prediction apps hide scoring formulas, making results feel arbitrary. | Points visible on every card before selection. Scoring breakdown one tap away on results. |
| **Over-animated transitions** | Slow transitions between screens kill the speed of squad building. Betting app users expect instant response. | Transitions are fast or instant. Animation budget is spent on the reveal screen, not navigation. |

### Design Inspiration Strategy

**What to Adopt (proven patterns, use directly):**
- Bet slip interaction model for Match Builder
- Card-based fixture layout from sports apps
- Mini-league structure from FPL
- Consistent information hierarchy from betting apps
- Deadline countdown visibility
- Data-informed selection via drill-down cards (FPL player card model)

**What to Adapt (modify for our context):**
- Betting app density → slightly more spacious for accessibility, since our audience includes non-bettors
- FPL's depth-on-demand → apply to scoring breakdowns, streak visualisation, and historical data hints
- Sports app match cards → extend to moment cards with point values and prediction type indicators
- FPL player data cards → moment card drill-down with self-accumulated historical stats

**What to Avoid (conflicts with our principles):**
- Gamification tropes (badges, streaks-of-app-usage, spinning wheels)
- Gesture novelty without proven utility (pinch, swipe, shake)
- Heavy animation outside the reveal screen
- Assuming user expertise — betting apps can; we can't for first-time users
- Showing data that isn't there — no filler stats, no fake confidence

**Design Philosophy Summary:**
This app serves an audience fluent in betting apps and FPL. They expect **clean, fast, functional** interfaces. Every UX decision must be deliberate and justified by usability, not novelty. The interaction model borrows from betting (accumulator building) and FPL (gameweek rhythm, mini-leagues, data-informed selection) while solving the unique challenge of making two prediction types feel simple. The only screen that gets animation budget is the score reveal — because that's the emotional centrepiece. Everything else is fast, clean, and invisible. Historical match data — accumulated organically through the scoring pipeline — enriches moment cards over time, rewarding returning users with progressively better decision-support data.

## Design System Foundation

### Design System Choice

**Themeable system with full visual control** — React Native + Expo + NativeWind (Tailwind CSS for React Native).

This is a utility-first approach: no pre-built component library dictating visual style. Components are built from primitives and styled with Tailwind classes, giving complete control over the premium sports-app aesthetic while maintaining development speed.

### Rationale for Selection

| Factor | Decision Driver |
|---|---|
| **Solo developer** | Expo eliminates build toolchain complexity. One command to build, test, deploy. No Xcode/Android Studio required for most workflows. |
| **Cross-platform** | Single TypeScript codebase for iOS + Android. No double work. |
| **Visual control** | NativeWind (Tailwind) provides utility-first styling with zero opinions on visual design. No fighting against Material Design defaults to achieve the "sharp, not cute" aesthetic. |
| **Speed** | Tailwind classes are fast to write and iterate on. Expo's hot reload means instant visual feedback. |
| **Ecosystem** | TypeScript/React skills are broadly transferable. Largest community and package ecosystem in cross-platform mobile. |
| **Push notifications** | Expo Notifications handles APNs (iOS) + FCM (Android) with a unified API. |
| **Deep links** | Expo Router supports Universal Links and App Links natively — critical for mini-league invite flow. |
| **App store deployment** | Expo EAS (Expo Application Services) handles builds and submissions for both stores. |

### Implementation Approach

**Core Stack:**
- **Expo SDK** (latest) — managed workflow for build, deploy, and native API access
- **Expo Router** — file-based navigation, deep link support
- **NativeWind v4** — Tailwind CSS compiled to React Native StyleSheet
- **TypeScript** — type safety across the codebase

**UI Primitives (build, don't buy):**
- Cards, buttons, toggles, segmented controls built from React Native `View`, `Text`, `Pressable`
- Styled with Tailwind classes via NativeWind
- No third-party component library — full visual ownership

**Why no component library:**
The "sharp, not cute" principle requires visual control that pre-built libraries (Paper, Gluestack) fight against. Building from primitives is more work upfront but means every component looks exactly right from day one. For a small app (limited screen count), this is manageable.

### Customization Strategy

**Design Tokens (defined in Tailwind config):**
- Colour palette, typography scale, spacing, border radius, shadows — all defined once in `tailwind.config.js`
- Dark mode support via Tailwind's `dark:` prefix (if pursued)
- Team badge colours can be mapped as dynamic tokens

**Component Patterns:**
- **Moment Card** — the core reusable component. Fixed layout: icon + event name + team + points. Variant for Match Moment vs Precision Pick (visual distinction via colour/icon).
- **Squad Summary** — persistent bottom sheet or tab showing current 20-token squad with running count.
- **Segmented Control** — for window selection (±5/10/15 min). Simple, reliable, boring-on-purpose.
- **Leaderboard Row** — consistent row with rank, name, score, position change indicator.
- **Reveal Card** — animated variant of the moment card for the score reveal screen. This is the one component that gets animation budget.

**Animation Strategy:**
- Navigation transitions: instant or minimal (default Expo Router behaviour)
- Score reveal: sequential card animation using `react-native-reanimated` — the only screen that justifies animation investment
- Micro-interactions: subtle haptic feedback on card add/remove (Expo Haptics)
- Everything else: static, fast, no decoration

## Defining Experience

### The One-Line Experience

**"Pick your moments. Build your squad. Find out if you were right."**

The defining interaction is the Match Builder — assembling a 20-token squad of predictions across all Premier League fixtures in a gameweek. Users describe it as: "It's like building a bet, but you're predicting when things happen, and it's free."

### User Mental Model

Users arrive with a **betting accumulator mental model**: browse markets, add selections to a slip, review, commit. This is the foundation we build on.

| Mental Model Element | User Expectation | Our Mapping |
|---|---|---|
| Markets | Odds for different outcomes | Moment catalog with point values |
| Bet slip | Selections stack up | Squad summary (20 tokens) |
| Odds | Higher odds = higher payout | Higher points = harder prediction |
| Accumulator | Multiple selections, all must hit | Squad of 20, each scored independently |
| Cash out / edit | Change before kickoff | Edit freely until deadline lock |

**Where the mental model breaks:** The Precision Pick flow (event → player → minute → window) has no direct analogue in betting. Users understand "Saka to score anytime" from betting, but "Saka to score at minute 23 ±5 min" is new. The minute + window mechanic must be introduced gently — the segmented control (±5/10/15) and minute picker need to feel as obvious as tapping an odds button.

### Success Criteria

| Criteria | Measurement |
|---|---|
| **Speed** | A returning user can build a full 20-token squad in under 5 minutes |
| **First-time completion** | A new user completes their first squad (with Quick Pick help) without abandoning |
| **Type distinction** | Users correctly understand the difference between Match Moments and Precision Picks by their second gameweek — without re-reading rules |
| **No dead ends** | At no point during the build can the user get stuck or confused about what to do next |
| **Token awareness** | User always knows how many tokens they've used (e.g., "14/20") and how many remain |
| **Confidence** | User feels informed, not overwhelmed, when browsing the moment catalog |

### Experience Mechanics — Match Builder Flow

**1. Initiation — "GW{n} is open"**
- Push notification: "Gameweek {n} is open! Build your squad before {deadline}."
- User opens app → lands on Match Builder screen (or home screen with prominent "Build Squad" CTA)
- Gameweek header shows: deadline countdown, token count (0/20)

**2. Browse — Fixture-first navigation**
- Fixtures listed as cards, sorted by kickoff time
- Each fixture card shows: team badges, kickoff time, number of available moments
- Tap a fixture → expands or navigates to that fixture's moment catalog
- Moment catalog is filterable: by type (Match Moment / Precision Pick), by event category (goals, cards, corners)

**3. Select — Two distinct flows**

**Match Moment (one tap):**
- User sees card: icon + event name + team(s) + point value
- Tap → added to squad immediately. Card shows "Added ✓"
- Token count updates: "1/20"

**Precision Pick (guided micro-flow):**
- User taps a Precision Pick event (e.g., "⚽ Arsenal score")
- Step 1: Select player (scrollable list or search) — or "Any player" for team-level
- Step 2: Pick minute (number input or scroll wheel, 1–90+)
- Step 3: Set window (segmented control: ±5 | ±10 | ±15)
- Points breakdown shown in real-time as user makes choices (base + timing bonus range)
- Confirm → added to squad. Token count updates.

**4. Review — Squad summary**
- Accessible at any time (persistent bottom bar or tab)
- Shows all selected moments, ordered by match kickoff then minute
- Each card shows: event, team, type indicator, points, window (if Precision Pick)
- Captain indicator (crown icon) on designated moment
- Streak sequence preview for Precision Picks (ordered by predicted event time)
- "Quick Pick" button fills remaining empty slots
- Long-press any card → set as Captain or remove

**5. Feedback — Continuous confidence signals**
- Token counter always visible: "{n}/20 — {remaining} to go"
- Added moments show "✓" in the catalog so users don't double-pick
- Point total preview: "Potential points: {sum}" (max possible if everything hits)
- Deadline countdown always visible

**6. Completion — Deadline lock**
- No submit button. User builds their squad. The deadline locks it.
- If user has <20 tokens at deadline: empty slots are forfeited (0 points, not auto-filled)
- If user has 0 tokens at deadline: they don't participate in that gameweek
- Lock notification: "Your squad is locked. Good luck." (subtle, not dramatic)
- Post-lock: squad is read-only. User can view but not edit.

### Novel UX Patterns

| Pattern | Status | Approach |
|---|---|---|
| **Precision Pick micro-flow** | Novel — no competitor has this | Guided 3-step flow (player → minute → window). Each step is one interaction. Real-time points preview keeps user informed. Feels like building a bet, not filling a form. |
| **Two prediction types in one squad** | Novel — unique combination | Visually distinct cards (colour/icon). Moment catalog clearly separates types. Both add to the same 20-token squad with the same tap-to-add model. |
| **Confidence window as segmented control** | Adapted — simple pattern applied to novel mechanic | ±5 / ±10 / ±15 as a 3-option segmented toggle. Points update live when user switches. No gesture novelty — just a clean, reliable control. |
| **Squad auto-ordering by minute** | Novel — narrative timeline | Predictions sort by minute within match, matches sort by kickoff. Squad reads as a chronological gameweek narrative. |
| **Streak sequence preview** | Novel — no competitor shows this | Squad summary view can toggle to show Precision Picks in real-world event time order, revealing the potential streak sequence. |

<!-- UX design content will be appended sequentially through collaborative workflow steps -->
