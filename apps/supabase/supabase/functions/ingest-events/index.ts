import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { fetchMatchEvents } from '../_shared/api-clients/events-api.ts';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface IngestEventsInput {
  fixtureId: number;
  isPostponed?: boolean;
  eventTimestamp?: string; // ISO 8601 — expected match end time for delay detection
}

export interface IngestEventsResult {
  data: { fixtureId: number; eventsInserted: number } | null;
  error: { code: string; message: string } | null;
}

export interface SupabaseClientLike {
  from: (table: string) => any;
  functions: {
    invoke: (name: string, opts?: { body?: unknown }) => Promise<{ error: unknown }>;
  };
}

// ─── Core handler (exported for testing) ─────────────────────────────────────

export async function handleIngestEvents(
  input: IngestEventsInput,
  supabase: SupabaseClientLike,
): Promise<IngestEventsResult> {
  try {
    return await _handleIngestEventsInner(input, supabase);
  } catch (err) {
    console.error('[ingest-events] Unexpected error:', err);
    return { data: null, error: { code: 'INTERNAL_ERROR', message: String(err) } };
  }
}

async function _handleIngestEventsInner(
  input: IngestEventsInput,
  supabase: SupabaseClientLike,
): Promise<IngestEventsResult> {
  const { fixtureId, isPostponed = false, eventTimestamp } = input;

  // ── Step 0: Delayed data detection (before anything else) ─────────────────
  if (eventTimestamp) {
    const expectedEnd = new Date(eventTimestamp).getTime();

    // Patch: guard against malformed ISO strings producing NaN
    if (isNaN(expectedEnd)) {
      console.error(`[ingest-events] Invalid eventTimestamp provided: "${eventTimestamp}" — skipping delay check`);
    } else {
      const now = Date.now();
      const twoHoursMs = 2 * 60 * 60 * 1000;

      if (now > expectedEnd + twoHoursMs) {
        // Lookup fixture to get gameweek_id, external_id, and events_ingested for context
        const { data: fixtureRow } = await supabase
          .from('fixtures')
          .select('id, external_id, gameweek_id, events_ingested')
          .eq('id', fixtureId)
          .single();

        // Patch: only flag delay if events have NOT already been ingested (e.g. on a retry)
        const alreadyIngested = (fixtureRow as any)?.events_ingested === true;
        if (alreadyIngested) {
          // Fixture was already successfully processed — skip delay flag entirely
        } else {
          const gameweekId = (fixtureRow as any)?.gameweek_id ?? null;
          const externalId = (fixtureRow as any)?.external_id ?? null;

          const msg = `Event data missing 2h post-match for fixture ${fixtureId}`;
          console.error(`[ingest-events] ${msg}`);

          if (gameweekId !== null) {
            // Patch: check and log scoring_errors insert failure
            const { error: scoringErrInsertErr } = await supabase.from('scoring_errors').insert({
              gameweek_id: gameweekId,
              error_code: 'EVENTS_DELAYED',
              error_message: msg,
              context: {
                fixture_id: fixtureId,
                external_id: externalId,
                expected_at: eventTimestamp,
              },
            });
            if (scoringErrInsertErr) {
              console.error(`[ingest-events] Failed to insert scoring_errors for fixture ${fixtureId}:`, scoringErrInsertErr);
            }
          }

          return { data: null, error: { code: 'EVENTS_DELAYED', message: msg } };
        }
      }
    }
  }

  // ── Step 1: Look up fixture ────────────────────────────────────────────────
  const { data: fixtureRow, error: fixtureErr } = await supabase
    .from('fixtures')
    .select('id, external_id, gameweek_id, is_postponed, events_ingested')
    .eq('id', fixtureId)
    .single();

  if (fixtureErr || !fixtureRow) {
    console.error(`[ingest-events] Fixture not found: fixtureId=${fixtureId}`, fixtureErr);
    return { data: null, error: { code: 'FIXTURE_NOT_FOUND', message: `Fixture ${fixtureId} not found` } };
  }

  const fixture = fixtureRow as {
    id: number;
    external_id: string;
    gameweek_id: number;
    is_postponed: boolean;
    events_ingested: boolean;
  };

  // ── Step 2: Handle postponed fixture ──────────────────────────────────────
  if (isPostponed) {
    const { error: postponeErr } = await supabase
      .from('fixtures')
      .update({ is_postponed: true })
      .eq('id', fixtureId);

    if (postponeErr) {
      console.error(`[ingest-events] Failed to mark fixture postponed: fixtureId=${fixtureId}`, postponeErr);
      return { data: null, error: { code: 'DB_UPDATE_FAILED', message: String(postponeErr) } };
    }

    // Proceed to gameweek completion check — postponed counts as "done"
    const scoringErr = await checkAndTriggerScoring(fixture.gameweek_id, supabase);
    if (scoringErr) {
      return { data: null, error: scoringErr };
    }

    return { data: { fixtureId, eventsInserted: 0 }, error: null };
  }

  // ── Step 3: Fetch match events from external API ───────────────────────────
  const eventsResult = await fetchMatchEvents(fixture.external_id);

  if (eventsResult.error) {
    console.error(`[ingest-events] Events fetch failed for fixture ${fixtureId}:`, eventsResult.error);
    return { data: null, error: { code: 'EVENTS_FETCH_FAILED', message: eventsResult.error.message } };
  }

  const events = eventsResult.data?.events ?? [];

  // ── Step 4: Insert events into match_events ────────────────────────────────
  if (events.length > 0) {
    const eventRows = events.map((e) => ({
      match_id: fixture.id, // internal fixtures.id — NOT external_id
      event_type: e.eventType,
      player_id: e.playerId,
      minute: e.minute,
      team_id: e.teamId,
      extra_data: e.extraData ?? null, // null, not undefined
    }));

    const { error: insertErr } = await supabase.from('match_events').insert(eventRows);

    if (insertErr) {
      console.error(`[ingest-events] Failed to insert match_events for fixture ${fixtureId}:`, insertErr);
      return { data: null, error: { code: 'DB_INSERT_FAILED', message: String(insertErr) } };
    }
  }

  // ── Step 5: Mark fixture events_ingested = true (ONLY after successful insert) ──
  const { error: ingestedErr } = await supabase
    .from('fixtures')
    .update({ events_ingested: true })
    .eq('id', fixtureId);

  if (ingestedErr) {
    console.error(`[ingest-events] Failed to mark events_ingested for fixture ${fixtureId}:`, ingestedErr);
    return { data: null, error: { code: 'DB_UPDATE_FAILED', message: String(ingestedErr) } };
  }

  // ── Step 6: Gameweek completion detection ─────────────────────────────────
  const scoringErr = await checkAndTriggerScoring(fixture.gameweek_id, supabase);
  if (scoringErr) {
    return { data: null, error: scoringErr };
  }

  return { data: { fixtureId, eventsInserted: events.length }, error: null };
}

// ─── Gameweek completion check ───────────────────────────────────────────────

/**
 * Returns a structured error if scoring chain invocation fails, null otherwise.
 * Callers should surface this error so it is not silently swallowed.
 */
async function checkAndTriggerScoring(
  gameweekId: number,
  supabase: SupabaseClientLike,
): Promise<{ code: string; message: string } | null> {
  const { data: allFixtures, error: fixturesErr } = await supabase
    .from('fixtures')
    .select('id, events_ingested, is_postponed')
    .eq('gameweek_id', gameweekId);

  if (fixturesErr || !allFixtures) {
    console.error(`[ingest-events] Failed to query fixtures for gameweek ${gameweekId}:`, fixturesErr);
    return null;
  }

  const fixtures = allFixtures as { id: number; events_ingested: boolean; is_postponed: boolean }[];

  // A fixture "counts" as done if events_ingested OR is_postponed
  const gameweekComplete = fixtures.every((f) => f.events_ingested || f.is_postponed);

  if (!gameweekComplete) {
    const pendingCount = fixtures.filter((f) => !f.events_ingested && !f.is_postponed).length;
    console.log(
      `[ingest-events] Gameweek ${gameweekId} not yet complete — ${pendingCount} fixtures pending`,
    );
    return null;
  }

  console.log(`[ingest-events] Gameweek ${gameweekId} complete — run-scoring invoked`);

  const { error: scoringError } = await supabase.functions.invoke('run-scoring', {
    body: { gameweekId },
  });

  if (scoringError) {
    const msg = `run-scoring invocation failed for gameweek ${gameweekId}`;
    console.error(`[ingest-events] ${msg}:`, scoringError);
    return { code: 'SCORING_INVOKE_FAILED', message: msg };
  }

  return null;
}

// ─── Edge Function entry point ────────────────────────────────────────────────

// Guard for Deno runtime — not executed in Node.js/Jest
// @ts-ignore
if (typeof Deno !== 'undefined') {
  // @ts-ignore
  const supabase = createClient(
    // @ts-ignore
    Deno.env.get('SUPABASE_URL') ?? '',
    // @ts-ignore
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  // @ts-ignore
  Deno.serve(async (req: Request): Promise<Response> => {
    try {
      const body = await req.json() as {
        fixtureId?: number;
        isPostponed?: boolean;
        eventTimestamp?: string;
      };

      const fixtureId: number = body?.fixtureId ?? 0;

      if (!fixtureId) {
        return Response.json(
          { data: null, error: { code: 'INVALID_INPUT', message: 'fixtureId is required' } },
          { status: 400 },
        );
      }

      const result = await handleIngestEvents(
        {
          fixtureId,
          isPostponed: body?.isPostponed,
          eventTimestamp: body?.eventTimestamp,
        },
        supabase as unknown as SupabaseClientLike,
      );

      if (result.error) {
        const statusCode =
          result.error.code === 'EVENTS_FETCH_FAILED' ? 502
          : result.error.code === 'FIXTURE_NOT_FOUND' ? 404
          : result.error.code === 'EVENTS_DELAYED' ? 422
          : 500;
        return Response.json(result, { status: statusCode });
      }

      return Response.json(result, { status: 200 });
    } catch (err) {
      console.error('[ingest-events] Unexpected error:', err);
      return Response.json(
        { data: null, error: { code: 'INTERNAL_ERROR', message: String(err) } },
        { status: 500 },
      );
    }
  });
}

