-- Full RLS policies for predictions, scoring_results, users, user_gameweek_states
-- Story 2.4: RLS Prediction Privacy Policies
-- Migration order: 0000 (schema) → 0001 (skeleton) → 0002 (full policies)
-- Idempotent: DROP POLICY IF EXISTS before each CREATE POLICY

-- ============================================================
-- Helper function: admin check
-- ============================================================
CREATE
OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin';
$$
LANGUAGE sql;

-- ============================================================
-- predictions table — replace skeleton policies with full set
-- ============================================================

-- Drop skeleton policies from 0001
DROP
POLICY IF EXISTS select_own_predictions ON predictions;
DROP
POLICY IF EXISTS insert_own_predictions ON predictions;

-- SELECT: before deadline → own rows only; after deadline → all rows for gameweek; admin sees all
DROP
POLICY IF EXISTS select_predictions ON predictions;
CREATE
POLICY select_predictions ON predictions
  FOR
SELECT USING (
    is_admin()
    OR (
    -- After deadline: all rows for this gameweek are readable
    EXISTS (
    SELECT 1 FROM gameweeks g
    WHERE g.id = gameweek_id
    AND g.first_kickoff IS NOT NULL
    AND now() >= g.first_kickoff
    )
    )
    OR (
    -- Before deadline: own rows only
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    )
    );

-- INSERT: own rows only, AND only before deadline
DROP
POLICY IF EXISTS insert_predictions ON predictions;
CREATE
POLICY insert_predictions ON predictions
  FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM gameweeks g
      WHERE g.id = gameweek_id
        AND (g.first_kickoff IS NULL OR now() < g.first_kickoff)
    )
  );

-- UPDATE: own rows only, AND only before deadline; admin bypass
DROP
POLICY IF EXISTS update_predictions ON predictions;
CREATE
POLICY update_predictions ON predictions
  FOR
UPDATE USING (
    is_admin()
    OR (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    AND EXISTS (
    SELECT 1 FROM gameweeks g
    WHERE g.id = gameweek_id
    AND (g.first_kickoff IS NULL OR now() < g.first_kickoff)
    )
    )
    )
WITH CHECK (
    is_admin()
    OR (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    AND EXISTS (
    SELECT 1 FROM gameweeks g
    WHERE g.id = gameweek_id
    AND (g.first_kickoff IS NULL OR now() < g.first_kickoff)
    )
    )
    );

-- DELETE: own rows only, AND only before deadline; admin bypass
DROP
POLICY IF EXISTS delete_predictions ON predictions;
CREATE
POLICY delete_predictions ON predictions
  FOR DELETE
USING (
    is_admin()
    OR (
      user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
      AND EXISTS (
        SELECT 1 FROM gameweeks g
        WHERE g.id = gameweek_id
          AND (g.first_kickoff IS NULL OR now() < g.first_kickoff)
      )
    )
  );

-- ============================================================
-- scoring_results table
-- ============================================================

ALTER TABLE scoring_results ENABLE ROW LEVEL SECURITY;

-- SELECT: own rows only when scoring_status = 'complete'; admin sees all
DROP
POLICY IF EXISTS select_scoring_results ON scoring_results;
CREATE
POLICY select_scoring_results ON scoring_results
  FOR
SELECT USING (
    is_admin()
    OR (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    AND EXISTS (
    SELECT 1 FROM gameweeks g
    WHERE g.id = gameweek_id
    AND g.scoring_status = 'complete'
    )
    )
    );
-- No INSERT/UPDATE/DELETE policies needed — only service-role Edge Functions write here

-- ============================================================
-- users table
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP
POLICY IF EXISTS select_own_user ON users;
CREATE
POLICY select_own_user ON users
  FOR
SELECT USING (
    is_admin() OR auth_id = auth.uid()
    );

DROP
POLICY IF EXISTS update_own_user ON users;
CREATE
POLICY update_own_user ON users
  FOR
UPDATE USING (
    auth_id = auth.uid()
    )
WITH CHECK (
    auth_id = auth.uid()
    );
-- No INSERT policy needed on mobile (users inserted via trigger/Edge Function on sign-up)
-- No DELETE policy — user deletion not in MVP scope

-- ============================================================
-- user_gameweek_states table
-- ============================================================

ALTER TABLE user_gameweek_states ENABLE ROW LEVEL SECURITY;

DROP
POLICY IF EXISTS select_own_user_gameweek_states ON user_gameweek_states;
CREATE
POLICY select_own_user_gameweek_states ON user_gameweek_states
  FOR
SELECT USING (
    is_admin()
    OR user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    );

DROP
POLICY IF EXISTS insert_own_user_gameweek_states ON user_gameweek_states;
CREATE
POLICY insert_own_user_gameweek_states ON user_gameweek_states
  FOR INSERT WITH CHECK (
    is_admin()
    OR user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

DROP
POLICY IF EXISTS update_own_user_gameweek_states ON user_gameweek_states;
CREATE
POLICY update_own_user_gameweek_states ON user_gameweek_states
  FOR
UPDATE USING (
    is_admin()
    OR user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    )
WITH CHECK (
    is_admin()
    OR user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    );
