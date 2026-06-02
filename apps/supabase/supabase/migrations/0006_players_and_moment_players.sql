-- Migration: 0006_players_and_moment_players
-- Adds the players table and game_week_moment_players join table.
-- Required by: Story 5.4 (Precision Pick micro-flow player selection)
-- Required for: Epic 6 (reveal cards showing player names)

-- Players table: stores footballers from the Football API
CREATE TABLE "players" (
  "id" text PRIMARY KEY,                         -- external player ID from Football API
  "name" text NOT NULL,
  "team_id" text,                                -- team_id references external team identifier
  "position" text,                               -- GK, DEF, MID, FWD or null
  "external_id" text UNIQUE,                     -- Football API canonical ID
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- game_week_moment_players: per-moment player roster with bonus points
-- Populated by the odds ingestion pipeline (Epic 3) when creating game_week_moments
CREATE TABLE "game_week_moment_players" (
  "id" serial PRIMARY KEY,
  "game_week_moment_id" integer NOT NULL REFERENCES "game_week_moments"("id") ON DELETE CASCADE,
  "player_id" text NOT NULL REFERENCES "players"("id") ON DELETE CASCADE,
  "bonus_points" integer NOT NULL DEFAULT 0,
  "sort_order" integer NOT NULL DEFAULT 0,       -- lower = shown first (typically sorted by scoring likelihood)
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE ("game_week_moment_id", "player_id")
);

-- Indexes for common query patterns
CREATE INDEX "idx_gwmp_moment_id" ON "game_week_moment_players" ("game_week_moment_id");
CREATE INDEX "idx_players_team_id" ON "players" ("team_id");

-- RLS: Enable row level security (read-only for authenticated users — data is non-sensitive)
ALTER TABLE "players" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "game_week_moment_players" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players are readable by authenticated users"
  ON "players" FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "game_week_moment_players are readable by authenticated users"
  ON "game_week_moment_players" FOR SELECT
  TO authenticated
  USING (true);

