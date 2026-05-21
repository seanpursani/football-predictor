import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
import {fetchOddsForGameweek} from '../_shared/api-clients/odds-api.ts';
import {convertOddsToPoints} from '../_shared/odds-converter.ts';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface IngestOddsResult {
    data: { gameweekId: number; momentsCreated: number } | null;
    error: { code: string; message: string } | null;
}

export interface SupabaseClientLike {
    from: (table: string) => any;
    functions: {
        invoke: (name: string, opts?: { body?: unknown }) => Promise<{ error: unknown }>;
    };
}

// ─── Core handler (exported for testing) ─────────────────────────────────────

export async function handleIngestOdds(
    gameweekId: number,
    supabase: SupabaseClientLike,
): Promise<IngestOddsResult> {
    const oddsResult = await fetchOddsForGameweek(gameweekId);

    if (oddsResult.error) {
        console.error('[ingest-odds] Odds fetch failed:', oddsResult.error);
        return {data: null, error: {code: 'ODDS_FETCH_FAILED', message: oddsResult.error.message}};
    }

    const fixtures = oddsResult.data;

    const momentRows: Array<{
        gameweek_id: number;
        fixture_id: number;
        moment_type_id: number;
        base_points: number;
        team_id: string | null;
    }> = [];

    for (const fixture of fixtures) {
        const {data: fixtureRow, error: fixtureErr} = await supabase
            .from('fixtures')
            .select('id')
            .eq('external_id', fixture.externalId)
            .single();

        if (fixtureErr || !fixtureRow) {
            console.error(`[ingest-odds] Fixture not found for externalId=${fixture.externalId}`, fixtureErr);
            continue;
        }

        for (const market of fixture.markets) {
            const {data: momentTypeRow, error: momentTypeErr} = await supabase
                .from('moment_types')
                .select('id')
                .eq('event_type', market.eventType)
                .single();

            if (momentTypeErr || !momentTypeRow) {
                console.error(`[ingest-odds] MomentType not found for eventType=${market.eventType}`, momentTypeErr);
                continue;
            }

            // Convert odds → integer points — raw odds are NEVER persisted (NFR8)
            const basePoints = convertOddsToPoints(market.decimalOdds);

            momentRows.push({
                gameweek_id: gameweekId,
                fixture_id: (fixtureRow as { id: number }).id,
                moment_type_id: (momentTypeRow as { id: number }).id,
                base_points: basePoints,
                team_id: market.teamId ?? null,
            });
        }
    }

    if (momentRows.length > 0) {
        const {error: upsertError} = await supabase
            .from('game_week_moments')
            .upsert(momentRows, {
                onConflict: 'gameweek_id,fixture_id,moment_type_id',
                ignoreDuplicates: false,
            });

        if (upsertError) {
            console.error('[ingest-odds] Upsert failed:', upsertError);
            return {data: null, error: {code: 'DB_UPSERT_FAILED', message: String(upsertError)}};
        }
    }

    // Set gameweek status to 'building' ONLY after successful upsert
    const {error: statusError} = await supabase
        .from('gameweeks')
        .update({status: 'building'})
        .eq('id', gameweekId);

    if (statusError) {
        console.error('[ingest-odds] Failed to update gameweek status:', statusError);
    }

    // Invoke send-notifications — best-effort
    const {error: notifError} = await supabase.functions.invoke('send-notifications', {
        body: {type: 'match-builder-open', payload: {gameweekId}},
    });

    if (notifError) {
        console.error('[ingest-odds] send-notifications invocation failed:', notifError);
    }

    return {data: {gameweekId, momentsCreated: momentRows.length}, error: null};
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
            const body = await req.json() as { gameweekId?: number };
            const gameweekId: number = body?.gameweekId ?? 0;

            if (!gameweekId) {
                return Response.json(
                    {data: null, error: {code: 'INVALID_INPUT', message: 'gameweekId is required'}},
                    {status: 400},
                );
            }

            const result = await handleIngestOdds(gameweekId, supabase as unknown as SupabaseClientLike);

            if (result.error) {
                const status = result.error.code === 'ODDS_FETCH_FAILED' ? 502 : 500;
                return Response.json(result, {status});
            }

            return Response.json(result, {status: 200});
        } catch (err) {
            console.error('[ingest-odds] Unexpected error:', err);
            return Response.json(
                {data: null, error: {code: 'INTERNAL_ERROR', message: String(err)}},
                {status: 500},
            );
        }
    });
}

