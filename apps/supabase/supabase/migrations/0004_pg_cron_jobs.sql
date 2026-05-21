-- pg_cron Scheduled Jobs for Gameweek Lifecycle
-- Story 3.4: Gameweek Lifecycle Scheduling & Development Seed Data
-- Migration order: 0003 → 0004 (pg_cron + cron_config)
-- Idempotent: uses IF NOT EXISTS and ON CONFLICT throughout

-- ============================================================
-- Extensions
-- ============================================================
CREATE
EXTENSION IF NOT EXISTS pg_cron;
CREATE
EXTENSION IF NOT EXISTS pg_net;

-- ============================================================
-- cron_config table — configurable schedule values
-- ============================================================
CREATE TABLE IF NOT EXISTS cron_config
(
    key
    text
    PRIMARY
    KEY,
    value
    text
    NOT
    NULL,
    description
    text
);

INSERT INTO cron_config (key, value, description)
VALUES ('ingest_odds_schedule',
        '0 8 * * 3',
        'Cron expression: ingest-odds (default: 08:00 UTC Wednesday, ~4 days before Saturday kickoffs)'),
       ('ingest_events_schedule',
        '*/30 * * * *',
        'Cron expression: ingest-events polling (default: every 30 minutes — polls for match events continuously during gameweek)') ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- apply_cron_schedules() — reads from cron_config to schedule jobs
-- Re-call this function after updating cron_config values to
-- apply new schedules without re-running the migration.
-- ============================================================
CREATE
OR REPLACE FUNCTION apply_cron_schedules()
RETURNS void AS $$
DECLARE
v_odds_schedule    text;
  v_events_schedule
text;
BEGIN
SELECT value
INTO v_odds_schedule
FROM cron_config
WHERE key = 'ingest_odds_schedule';
SELECT value
INTO v_events_schedule
FROM cron_config
WHERE key = 'ingest_events_schedule';

-- Remove existing jobs (idempotent — safe if jobs don't exist yet)
-- F2 fix: PERFORM does not accept WHERE; use IF EXISTS block instead
IF
EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ingest-odds-weekly') THEN
    PERFORM cron.unschedule('ingest-odds-weekly');
END IF;

  IF
EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'ingest-events-polling') THEN
    PERFORM cron.unschedule('ingest-events-polling');
END IF;

  -- F1 fix: use missing_ok := true so migration does not error when GUC vars are not set
  -- (e.g. on fresh supabase db reset before app.supabase_url / app.service_role_key are configured)
  -- Schedule ingest-odds job
  PERFORM
cron.schedule(
    'ingest-odds-weekly',
    v_odds_schedule,
    format(
      $sql$
      SELECT net.http_post(
        url     := '%s/functions/v1/ingest-odds',
        headers := '{"Content-Type":"application/json","Authorization":"Bearer %s"}'::jsonb,
        body    := '{}'::jsonb
      );
      $sql$,
      coalesce(current_setting('app.supabase_url',  true), ''),
      coalesce(current_setting('app.service_role_key', true), '')
    )
  );

  -- Schedule ingest-events job
  PERFORM
cron.schedule(
    'ingest-events-polling',
    v_events_schedule,
    format(
      $sql$
      SELECT net.http_post(
        url     := '%s/functions/v1/ingest-events',
        headers := '{"Content-Type":"application/json","Authorization":"Bearer %s"}'::jsonb,
        body    := '{}'::jsonb
      );
      $sql$,
      coalesce(current_setting('app.supabase_url',  true), ''),
      coalesce(current_setting('app.service_role_key', true), '')
    )
  );
END;
$$
LANGUAGE plpgsql;

-- Apply schedules immediately when migration runs
SELECT apply_cron_schedules();

