---
stepsCompleted: [step-01-init, step-02-discovery, step-02b-vision, step-02c-executive-summary]
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
