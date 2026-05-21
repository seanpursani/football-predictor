/**
 * run-scoring/index.ts
 *
 * Scoring orchestrator — coordinates the full scoring run for a gameweek.
 * Calls scoring-engine and streak-calculator; owns all DB writes, leaderboard
 * materialisation, and push notification dispatch.
 *
 * Story 4.3
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { scorePrediction } from '../_shared/scoring-engine.ts';
import type { ScoringInput, ScoringOutput } from '../_shared/scoring-engine.ts';
import { calculateStreaks } from '../_shared/streak-calculator.ts';
import type {
  StreakInput,
  StreakResultEntry,
  StreakScoringEntry,
} from '../_shared/streak-calculator.ts';
import { captureHighPriority } from '../_shared/sentry.ts';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScoringRow {
  prediction_id: number;
  user_id: string;
  gameweek_id: number;
  event_points: number;
  timing_bonus: number;
  player_bonus: number;
  assister_bonus: number;
  zone_bonus: number;
  jackpot_bonus: number;
  captain_multiplier: number;
  streak_bonus: number;
  total_points: number;
  is_correct: boolean;
}

interface LeaderboardRow {
  user_id: string;
  gameweek_id: number | null;
  leaderboard_type: 'weekly' | 'season';
  score: number;
}

// ─── Core orchestrator (exported for testability) ─────────────────────────────

export async function runScoring(
  gameweekId: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
): Promise<Response> {
  // ── Idempotency guard ──
  const { data: gw, error: gwErr } = await client
    .from('gameweeks')
    .select('scoring_status')
    .eq('id', gameweekId)
    .single();

  if (gwErr || !gw) {
    return Response.json(
      { data: null, error: { code: 'INVALID_REQUEST', message: 'Gameweek not found' } },
      { status: 400 },
    );
  }

  if (['complete', 'in_progress'].includes(gw.scoring_status)) {
    return Response.json(
      {
        data: null,
        error: {
          code: 'SCORING_ALREADY_RUN',
          message: `scoring_status is '${gw.scoring_status}'`,
        },
      },
      { status: 409 },
    );
  }

  // ── Set in_progress immediately (first DB write before any scoring) ──
  await client
    .from('gameweeks')
    .update({ scoring_status: 'in_progress' })
    .eq('id', gameweekId);

  try {
    // ── Fetch all fixtures for this gameweek ──
    const { data: fixtures, error: fixtureErr } = await client
      .from('fixtures')
      .select('*')
      .eq('gameweek_id', gameweekId);

    if (fixtureErr || !fixtures) throw fixtureErr ?? new Error('Failed to fetch fixtures');

    const fixtureIds: number[] = fixtures.map((f: { id: number }) => f.id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fixtureMap = new Map<number, any>(fixtures.map((f: any) => [f.id, f]));

    // ── Fetch all predictions (with joined moment + type) for this gameweek ──
    const { data: predictions, error: predErr } = await client
      .from('predictions')
      .select('*, game_week_moments(*, moment_types(*))')
      .eq('gameweek_id', gameweekId);

    if (predErr || !predictions) throw predErr ?? new Error('Failed to fetch predictions');

    // ── Fetch all match events for fixtures in this gameweek ──
    const { data: matchEvents, error: evtErr } = await client
      .from('match_events')
      .select('*')
      .in('match_id', fixtureIds);

    if (evtErr || !matchEvents) throw evtErr ?? new Error('Failed to fetch match events');

    // ── Guard: fixture / gameWeekMoment mismatch ──
    for (const prediction of predictions) {
      const gwMoment = prediction.game_week_moments;
      if (gwMoment && gwMoment.fixture_id !== prediction.fixture_id) {
        throw new Error(
          `prediction.fixtureId (${prediction.fixture_id}) !== gameWeekMoment.fixtureId (${gwMoment.fixture_id}) ` +
            `for prediction ${prediction.id}`,
        );
      }
    }

    // ── Guard: duplicate predictionId ──
    const rawIds: string[] = predictions.map((p: { id: number }) => String(p.id));
    if (new Set(rawIds).size !== rawIds.length) {
      throw new Error('Duplicate predictionId values detected before scoring');
    }

    // ── Score each prediction ──
    const scoreMap = new Map<string, ScoringOutput>();
    // Only precision picks ('moment') enter the streak calculator
    const streakEntriesByUser = new Map<string, StreakScoringEntry[]>();

    for (const prediction of predictions) {
      const fixture = fixtureMap.get(prediction.fixture_id);
      if (!fixture) throw new Error(`Fixture ${prediction.fixture_id} not found`);

      const gwMoment = prediction.game_week_moments;
      const momentType = gwMoment?.moment_types;
      const isSkipped: boolean = fixture.is_postponed || fixture.is_void;

      let output: ScoringOutput;

      if (isSkipped) {
        // Postponed / voided — zero score, excluded from streak
        output = {
          eventPoints: 0,
          timingBonus: 0,
          playerBonus: 0,
          assisterBonus: 0,
          zoneBonus: 0,
          jackpotBonus: 0,
          captainMultiplier: prediction.is_captain ? 2 : 1,
          streakBonus: 0,
          totalPoints: 0,
          isCorrect: false,
        };
      } else {
        if (!gwMoment) {
          throw new Error(`prediction ${prediction.id} has no game_week_moments join`);
        }
        if (!momentType) {
          throw new Error(`prediction ${prediction.id} has no moment_types join`);
        }

        const fixtureEventsForPrediction = matchEvents
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((e: any) => e.match_id === prediction.fixture_id)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((e: any) => ({
            id: e.id,
            matchId: e.match_id,
            eventType: e.event_type,
            minute: e.minute,
            playerId: e.player_id,
            extraData: e.extra_data,
            createdAt: new Date(e.created_at),
          }));

        const scoringInput: ScoringInput = {
          prediction: {
            id: prediction.id,
            userId: prediction.user_id,
            gameweekId: prediction.gameweek_id,
            fixtureId: prediction.fixture_id,
            gameWeekMomentId: prediction.game_week_moment_id,
            predictionType: prediction.prediction_type,
            isCaptain: prediction.is_captain,
            predictedMinute: prediction.predicted_minute,
            confidenceWindow: prediction.confidence_window,
            predictedPlayerId: prediction.predicted_player_id,
            predictedAssisterId: prediction.predicted_assister_id,
            predictedZone: prediction.predicted_zone,
            createdAt: new Date(prediction.created_at),
            updatedAt: new Date(prediction.updated_at),
          },
          gameWeekMoment: {
            id: gwMoment.id,
            gameweekId: gwMoment.gameweek_id,
            fixtureId: gwMoment.fixture_id,
            momentTypeId: gwMoment.moment_type_id,
            basePoints: gwMoment.base_points,
            playerBonusPoints: gwMoment.player_bonus_points,
            assisterBonusPoints: gwMoment.assister_bonus_points,
            zoneBonusPoints: gwMoment.zone_bonus_points,
            timingBonusPoints: gwMoment.timing_bonus_points ?? null,
            jackpotBonusPoints: gwMoment.jackpot_bonus_points ?? null,
            teamId: gwMoment.team_id ?? null,
            createdAt: new Date(gwMoment.created_at),
          },
          momentType: {
            id: momentType.id,
            name: momentType.name,
            eventType: momentType.event_type,
            predictionType: momentType.prediction_type,
            description: momentType.description,
            createdAt: new Date(momentType.created_at ?? Date.now()),
          },
          matchEvents: fixtureEventsForPrediction,
          fixture: {
            id: fixture.id,
            gameweekId: fixture.gameweek_id,
            externalId: fixture.external_id,
            homeTeam: fixture.home_team,
            awayTeam: fixture.away_team,
            kickoffAt: new Date(fixture.kickoff_at),
            isPostponed: fixture.is_postponed,
            isVoid: fixture.is_void,
            eventsIngested: fixture.events_ingested,
            createdAt: new Date(fixture.created_at),
          },
        };

        output = scorePrediction(scoringInput);
      }

      scoreMap.set(String(prediction.id), output);

      // Only precision picks ('moment') and non-skipped fixtures enter the streak input
      if (prediction.prediction_type === 'moment' && !isSkipped) {
        // For correct picks: resolve realEventMinute (closest event matching the predicted type)
        let realEventMinute: number | null = null;
        if (output.isCorrect && prediction.predicted_minute != null) {
          const relevantEvents = matchEvents.filter(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (e: any) =>
              e.match_id === prediction.fixture_id &&
              e.event_type === gwMoment?.moment_types?.event_type,
          );
          if (relevantEvents.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const bestEvent = relevantEvents.reduce((best: any, e: any) =>
              Math.abs(e.minute - prediction.predicted_minute) <
              Math.abs(best.minute - prediction.predicted_minute)
                ? e
                : best,
            );
            realEventMinute = bestEvent.minute;
          }
        }

        // Safety: calculateStreaks throws if isCorrect=true but realEventMinute=null.
        // If no matching event was found despite isCorrect=true (data inconsistency),
        // exclude this entry from streak calculation by treating it as a non-streak miss.
        const streakIsCorrect = output.isCorrect && realEventMinute !== null;

        const streakEntry: StreakScoringEntry = {
          predictionId: String(prediction.id),
          fixtureId: prediction.fixture_id,
          isCorrect: streakIsCorrect,
          realEventMinute,
          fixtureKickoffAt: new Date(fixture.kickoff_at),
          scoringOutput: output,
        };

        const userId: string = prediction.user_id;
        if (!streakEntriesByUser.has(userId)) streakEntriesByUser.set(userId, []);
        streakEntriesByUser.get(userId)!.push(streakEntry);
      }
    }

    // ── Calculate streaks per user and build result map ──
    const streakResultMap = new Map<string, StreakResultEntry>();
    for (const [, entries] of streakEntriesByUser.entries()) {
      const streakInput: StreakInput = { scoringOutputs: entries };
      const result = calculateStreaks(streakInput);
      for (const entry of result.entries) {
        streakResultMap.set(entry.predictionId, entry);
      }
    }

    // ── Build scoring_results rows ──
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scoringRows: ScoringRow[] = predictions.map((prediction: any) => {
      const output = scoreMap.get(String(prediction.id))!;
      const streakEntry = streakResultMap.get(String(prediction.id));
      return {
        prediction_id: prediction.id,
        user_id: prediction.user_id,
        gameweek_id: gameweekId,
        event_points: output.eventPoints,
        timing_bonus: output.timingBonus,
        player_bonus: output.playerBonus,
        assister_bonus: output.assisterBonus,
        zone_bonus: output.zoneBonus,
        jackpot_bonus: output.jackpotBonus,
        captain_multiplier: output.captainMultiplier,
        streak_bonus: streakEntry?.streakBonus ?? 0,
        // total_points must be the streak-adjusted value
        total_points: streakEntry?.totalPointsWithStreak ?? output.totalPoints,
        is_correct: output.isCorrect,
      };
    });

    const { error: upsertErr } = await client
      .from('scoring_results')
      .upsert(scoringRows, { onConflict: 'prediction_id' });

    if (upsertErr) throw upsertErr;

    // ── Compute weekly score per user ──
    const weeklyScoreByUser = new Map<string, number>();
    for (const row of scoringRows) {
      weeklyScoreByUser.set(row.user_id, (weeklyScoreByUser.get(row.user_id) ?? 0) + row.total_points);
    }

    // ── Write weekly leaderboard entries ──
    if (weeklyScoreByUser.size > 0) {
      const weeklyRows: LeaderboardRow[] = Array.from(weeklyScoreByUser.entries()).map(
        ([userId, score]) => ({
          user_id: userId,
          gameweek_id: gameweekId,
          leaderboard_type: 'weekly' as const,
          score,
        }),
      );

      const { error: wlErr } = await client
        .from('leaderboard_entries')
        .upsert(weeklyRows, { onConflict: 'user_id,gameweek_id,leaderboard_type' });

      if (wlErr) throw wlErr;
    }

    // ── Compute season cumulative from all weekly entries ──
    const { data: allWeeklyEntries, error: allWeeklyErr } = await client
      .from('leaderboard_entries')
      .select('user_id, score')
      .eq('leaderboard_type', 'weekly');

    if (allWeeklyErr) throw allWeeklyErr;

    const seasonScoreByUser = new Map<string, number>();
    for (const entry of allWeeklyEntries ?? []) {
      seasonScoreByUser.set(
        entry.user_id,
        (seasonScoreByUser.get(entry.user_id) ?? 0) + entry.score,
      );
    }

    // ── Write season leaderboard entries ──
    if (seasonScoreByUser.size > 0) {
      const seasonRows = Array.from(seasonScoreByUser.entries()).map(([userId, score]) => ({
        user_id: userId,
        gameweek_id: null as null,
        leaderboard_type: 'season' as const,
        score,
      }));

      const { error: slErr } = await client
        .from('leaderboard_entries')
        .upsert(seasonRows, { onConflict: 'user_id,leaderboard_type' });

      if (slErr) throw slErr;
    }

    // ── Rank assignment via RPC ──
    const { error: rankWeeklyErr } = await client.rpc('assign_leaderboard_ranks', {
      p_gameweek_id: gameweekId,
      p_leaderboard_type: 'weekly',
    });
    if (rankWeeklyErr) throw rankWeeklyErr;

    const { error: rankSeasonErr } = await client.rpc('assign_leaderboard_ranks', {
      p_gameweek_id: null,
      p_leaderboard_type: 'season',
    });
    if (rankSeasonErr) throw rankSeasonErr;

    // ── Set scoring_status = complete ──
    await client
      .from('gameweeks')
      .update({ scoring_status: 'complete' })
      .eq('id', gameweekId);

    // ── Dispatch push notification (best-effort — failure must NOT roll back scoring) ──
    try {
      await client.functions.invoke('send-notifications', {
        body: { type: 'results-ready' },
      });
    } catch (notifErr) {
      console.error('[run-scoring] send-notifications failed:', notifErr);
    }

    return Response.json(
      {
        data: {
          usersScored: weeklyScoreByUser.size,
          predictionsScored: predictions.length,
        },
        error: null,
      },
      { status: 200 },
    );
  } catch (err) {
    // ── Error path: update status, record error, alert Sentry ──
    // Wrap secondary writes in try/catch so they never swallow the original error.
    try {
      await client
        .from('gameweeks')
        .update({ scoring_status: 'error' })
        .eq('id', gameweekId);
    } catch (secondaryErr) {
      console.error('[run-scoring] failed to set scoring_status=error:', secondaryErr);
    }

    try {
      await client.from('scoring_errors').insert({
        gameweek_id: gameweekId,
        error_code: 'SCORING_FAILED',
        error_message: err instanceof Error ? err.message : String(err),
        context: { stack: err instanceof Error ? err.stack : undefined },
      });
    } catch (secondaryErr) {
      console.error('[run-scoring] failed to insert scoring_errors row:', secondaryErr);
    }

    captureHighPriority(err, { gameweekId });

    // NOTE: send-notifications is NOT invoked on the error path
    return Response.json(
      { data: null, error: { code: 'SCORING_FAILED', message: 'Scoring engine error' } },
      { status: 500 },
    );
  }
}

// ─── Deno Edge Function Entry Point ──────────────────────────────────────────

// Guard for Deno runtime — not executed in Node.js/Jest
// @ts-ignore
if (typeof Deno !== 'undefined') {
// @ts-ignore
Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return Response.json(
      { data: null, error: { code: 'METHOD_NOT_ALLOWED', message: 'POST required' } },
      { status: 405 },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: { gameweekId?: any } = {};
  try {
    body = await req.json() as { gameweekId?: unknown };
  } catch {
    return Response.json(
      { data: null, error: { code: 'INVALID_REQUEST', message: 'Invalid JSON body' } },
      { status: 400 },
    );
  }

  const { gameweekId } = body;
  if (typeof gameweekId !== 'number') {
    return Response.json(
      { data: null, error: { code: 'INVALID_REQUEST', message: 'gameweekId must be a number' } },
      { status: 400 },
    );
  }

  // @ts-ignore
  const supabase = createClient(
    // @ts-ignore
    Deno.env.get('SUPABASE_URL') ?? '',
    // @ts-ignore
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  return runScoring(gameweekId, supabase);
});
} // end Deno guard
