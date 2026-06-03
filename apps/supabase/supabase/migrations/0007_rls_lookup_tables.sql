-- RLS for remaining tables missing row-level security
-- Addresses lint: "RLS disabled" on gameweeks, fixtures, game_week_moments,
--                 leaderboard_entries, and scoring_errors.
--
-- Access model:
--   gameweeks          – public reference data; authenticated SELECT only, service_role writes
--   fixtures           – public reference data; authenticated SELECT only, service_role writes
--   game_week_moments  – public reference data; authenticated SELECT only, service_role writes
--   leaderboard_entries– public leaderboard; authenticated SELECT, service_role writes
--   scoring_errors     – internal/admin only; no direct client access
--
-- Idempotent: DROP POLICY IF EXISTS before each CREATE POLICY

-- ============================================================
-- gameweeks  (public reference data – no user ownership)
-- ============================================================

ALTER TABLE gameweeks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_gameweeks ON gameweeks;
CREATE POLICY select_gameweeks ON gameweeks
  FOR SELECT
  USING (true);
-- No INSERT / UPDATE / DELETE policies for authenticated/anon;
-- all writes are performed by Edge Functions running as service_role,
-- which bypasses RLS by default.

-- ============================================================
-- fixtures  (public reference data – no user ownership)
-- ============================================================

ALTER TABLE fixtures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_fixtures ON fixtures;
CREATE POLICY select_fixtures ON fixtures
  FOR SELECT
  USING (true);

-- ============================================================
-- game_week_moments  (public reference data – no user ownership)
-- ============================================================

ALTER TABLE game_week_moments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_game_week_moments ON game_week_moments;
CREATE POLICY select_game_week_moments ON game_week_moments
  FOR SELECT
  USING (true);

-- ============================================================
-- leaderboard_entries  (public leaderboard – written by service_role)
-- ============================================================

ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_leaderboard_entries ON leaderboard_entries;
CREATE POLICY select_leaderboard_entries ON leaderboard_entries
  FOR SELECT
  USING (true);
-- Writes (INSERT / UPDATE / DELETE) are handled exclusively by the
-- scoring-orchestrator Edge Function (service_role bypasses RLS).

-- ============================================================
-- scoring_errors  (internal / admin only – no direct client access)
-- ============================================================

ALTER TABLE scoring_errors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_scoring_errors ON scoring_errors;
CREATE POLICY select_scoring_errors ON scoring_errors
  FOR SELECT
  USING (is_admin());
-- No INSERT / UPDATE / DELETE policies; only service_role (Edge Functions) writes here.

-- ============================================================
-- moment_types  (static lookup – readable by all authenticated users)
-- ============================================================

ALTER TABLE moment_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_moment_types ON moment_types;
CREATE POLICY select_moment_types ON moment_types
  FOR SELECT
  USING (true);

-- ============================================================
-- match_events  (public reference data – written by service_role)
-- ============================================================

ALTER TABLE match_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_match_events ON match_events;
CREATE POLICY select_match_events ON match_events
  FOR SELECT
  USING (true);

-- ============================================================
-- mini_leagues  (readable by authenticated users; writes via service_role or owner)
-- ============================================================

ALTER TABLE mini_leagues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_mini_leagues ON mini_leagues;
CREATE POLICY select_mini_leagues ON mini_leagues
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS insert_mini_leagues ON mini_leagues;
CREATE POLICY insert_mini_leagues ON mini_leagues
  FOR INSERT
  WITH CHECK (
    created_by IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

DROP POLICY IF EXISTS update_mini_leagues ON mini_leagues;
CREATE POLICY update_mini_leagues ON mini_leagues
  FOR UPDATE
  USING (
    is_admin()
    OR created_by IN (SELECT id FROM users WHERE auth_id = auth.uid())
  )
  WITH CHECK (
    is_admin()
    OR created_by IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- ============================================================
-- league_memberships  (own rows – users join/leave leagues)
-- ============================================================

ALTER TABLE league_memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS select_league_memberships ON league_memberships;
CREATE POLICY select_league_memberships ON league_memberships
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS insert_league_memberships ON league_memberships;
CREATE POLICY insert_league_memberships ON league_memberships
  FOR INSERT
  WITH CHECK (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

DROP POLICY IF EXISTS delete_league_memberships ON league_memberships;
CREATE POLICY delete_league_memberships ON league_memberships
  FOR DELETE
  USING (
    is_admin()
    OR user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

