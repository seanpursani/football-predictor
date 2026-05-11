-- Fix: users table INSERT policy
-- Story 2.4 enabled RLS on `users` but omitted an INSERT policy.
-- Story 2.1 mobile client calls supabase.upsert() on `users` on first sign-in.
-- Without an INSERT policy, new user creation is silently blocked by RLS.
-- Identified in: Epic 2 Retrospective (2026-05-11)

-- Add INSERT policy: authenticated users may only insert a row with their own auth_id
DROP POLICY IF EXISTS insert_own_user ON users;
CREATE POLICY insert_own_user ON users
  FOR INSERT WITH CHECK (
    auth_id = auth.uid()
  );

