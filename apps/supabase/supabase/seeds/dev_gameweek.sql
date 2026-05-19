-- dev_gameweek.sql
-- Seed: 1 gameweek in 'building' state for local development
-- Story 3.4: Gameweek Lifecycle Scheduling & Development Seed Data
--
-- first_kickoff is set 7 days from now so predictions can be inserted immediately.
-- Idempotent: ON CONFLICT (gameweek_number) DO NOTHING

INSERT INTO gameweeks (
  id,
  gameweek_number,
  season,
  status,
  scoring_status,
  first_kickoff,
  last_match_end,
  created_at,
  updated_at
)
VALUES (
  1,                                              -- fixed id for FK references
  1,
  '2025-26',
  'building',
  'pending',
  NOW() + INTERVAL '7 days',                     -- future timestamp: predictions allowed
  NULL,                                           -- not yet known
  NOW(),
  NOW()
)
ON CONFLICT (gameweek_number) DO NOTHING;

