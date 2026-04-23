---
stepsCompleted: [step-01-init, step-02-discovery, step-03-core-experience, step-04-emotional-response]
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

<!-- UX design content will be appended sequentially through collaborative workflow steps -->
