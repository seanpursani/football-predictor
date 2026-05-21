-- Migration: leaderboard upsert constraints and rank assignment RPC
-- Story 4.3 — enables upsert conflict resolution and rank materialisation

-- ── Unique constraints required for upsert conflict targets ───────────────────

-- Weekly: one row per (user, gameweek, type)
ALTER TABLE "leaderboard_entries"
    ADD CONSTRAINT "leaderboard_entries_weekly_unique"
        UNIQUE ("user_id", "gameweek_id", "leaderboard_type");
--> statement-breakpoint

-- Season: one row per (user, type) where gameweek_id IS NULL
-- PostgreSQL unique constraints treat NULLs as distinct, so we use a partial unique index instead.
CREATE UNIQUE INDEX "leaderboard_entries_season_unique"
    ON "leaderboard_entries" ("user_id", "leaderboard_type")
    WHERE "gameweek_id" IS NULL;
--> statement-breakpoint

-- NOTE: The weekly unique constraint above also covers season rows where gameweek_id IS NOT NULL.
-- The partial index above covers the season aggregate row (gameweek_id IS NULL).
-- Together they satisfy both upsert conflict targets used by run-scoring/index.ts.

-- ── assign_leaderboard_ranks RPC ──────────────────────────────────────────────
-- Called by run-scoring after upserts to materialise rank and preserve previous_rank.
-- p_gameweek_id: the gameweek being scored (NULL for season cumulative)
-- p_leaderboard_type: 'weekly' or 'season'

CREATE OR REPLACE FUNCTION assign_leaderboard_ranks(
    p_gameweek_id integer,
    p_leaderboard_type text
)
    RETURNS void
    LANGUAGE plpgsql
AS
$$
BEGIN
    UPDATE leaderboard_entries le
    SET previous_rank = le.rank,
        rank          = sub.new_rank,
        updated_at    = now()
    FROM (SELECT id,
                 RANK() OVER (ORDER BY score DESC) AS new_rank
          FROM leaderboard_entries
          WHERE leaderboard_type = p_leaderboard_type
            AND (
              (p_gameweek_id IS NULL AND gameweek_id IS NULL)
                  OR
              (p_gameweek_id IS NOT NULL AND gameweek_id = p_gameweek_id)
              )) sub
    WHERE le.id = sub.id;
END;
$$;

