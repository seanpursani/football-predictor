-- seed.sql — psql convenience entrypoint (LOCAL DEV, manual use only)
-- Story 3.4: Gameweek Lifecycle Scheduling & Development Seed Data
--
-- ⚠️  NOT used by `supabase db reset` — Supabase's internal runner does not support \i.
--     For `supabase db reset`, seed files are listed individually in config.toml sql_paths.
--
-- Use this file only when seeding manually via psql:
--   psql <connection> -f seed.sql
--
-- Run order matters:
--   1. moment_types  (no FK deps)
--   2. gameweek      (no FK deps)
--   3. fixtures      (FK → gameweeks; game_week_moments FK → fixtures + moment_types)
--   4. users         (inserts auth.users + public.users; no FK deps on above)
--
-- WARNING: dev_users.sql inserts into auth.users — LOCAL DEV ONLY, never production.

\i
seeds/dev_moment_types.sql
\i seeds/dev_gameweek.sql
\i seeds/dev_fixtures.sql
\i seeds/dev_users.sql

