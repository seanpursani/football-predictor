---
title: 'Scoring Schema Reference Document'
type: 'chore'
created: '2026-06-02'
status: 'done'
route: 'one-shot'
---

# Scoring Schema Reference Document

## Intent

**Problem:** No single document maps the Epic 4 scoring output columns in `scoring_results` and `leaderboard_entries` to their reveal UI semantics, making it hard for Epic 6 implementers to know which column drives which animation state.

**Approach:** Cross-reference `migrations/0000_worthless_naoko.sql`, `migrations/0005_leaderboard_upsert_and_rank_rpc.sql`, Epic 4 story files, and the `6-1-reveal-card-component-and-animation-states.md` spec to produce a definitive column-to-UI-semantic mapping, and verify `match_result` presence in the catalog seed data.

## Suggested Review Order

1. [`scoring-schema-reference.md` — Section 1: scoring_results table](./scoring-schema-reference.md#1-scoring_results) — core column definitions + reveal state routing
2. [`scoring-schema-reference.md` — Section 4: Quick Reference](./scoring-schema-reference.md#4-full-column--reveal-semantic-quick-reference) — at-a-glance lookup table
3. [`scoring-schema-reference.md` — Section 2: leaderboard_entries](./scoring-schema-reference.md#2-leaderboard_entries) — rank delta semantics
4. [`scoring-schema-reference.md` — Section 3: match_result gap](./scoring-schema-reference.md#3-match_result-in-catalog-seed-data) — ⚠️ verified gap requiring action before Epic 5

