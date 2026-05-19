-- dev_users.sql
-- Seed: 3 test users with auth records for local development
-- Story 3.4: Gameweek Lifecycle Scheduling & Development Seed Data
--
-- WARNING: auth.users inserts are for LOCAL DEV ONLY — never run against production.
-- Idempotent: ON CONFLICT (id) / ON CONFLICT (auth_id) DO NOTHING

-- ============================================================
-- auth.users (GoTrue — local stack only)
-- ============================================================
INSERT INTO auth.users (
  id,
  email,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role
)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'dev-user-1@test.com',
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    'authenticated',
    'authenticated'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'dev-user-2@test.com',
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    'authenticated',
    'authenticated'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'dev-user-3@test.com',
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    'authenticated',
    'authenticated'
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- public.users
-- ============================================================
INSERT INTO public.users (id, auth_id, display_name, has_seen_onboarding, created_at, updated_at)
VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Dev User 1', true,  NOW(), NOW()),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000002', 'Dev User 2', false, NOW(), NOW()),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000003', 'Dev User 3', false, NOW(), NOW())
ON CONFLICT (auth_id) DO NOTHING;

