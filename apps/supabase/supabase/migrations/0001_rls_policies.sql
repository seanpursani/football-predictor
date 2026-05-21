-- RLS skeleton policies for predictions table
-- Full deadline-aware policies enforced in Epic 2 Story 2.4
-- Note: user_id references users.id (app user), not auth.users.id directly.
-- We join through the users table to match auth.uid() → users.auth_id → users.id.

ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

CREATE
POLICY select_own_predictions ON predictions
  FOR
SELECT USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    );

CREATE
POLICY insert_own_predictions ON predictions
  FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

