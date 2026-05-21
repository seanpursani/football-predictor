/**
 * scoring-engine.ts
 *
 * Pure multi-layer scoring logic for all prediction types.
 * NO Supabase calls, NO HTTP, NO side effects — fully unit-testable.
 *
 * Story 4.1
 */

import type {Fixture, GameweekMoment, MatchEvent, MomentType, Prediction} from '@lecolpo/types';
import {
    CAPTAIN_MULTIPLIER,
    JACKPOT_BONUS,
    TIMING_WINDOW_10_BONUS,
    TIMING_WINDOW_15_BONUS,
    TIMING_WINDOW_5_BONUS,
} from './constants.ts';

// ─── Interfaces ────────────────────────────────────────────────────────────────

export interface ScoringInput {
    prediction: Prediction;
    gameWeekMoment: GameweekMoment;
    momentType: MomentType;
    matchEvents: MatchEvent[];
    /** Fixture context — passed through for Story 4.3 orchestrator wiring validation. */
    fixture: Fixture;
}

export interface ScoringOutput {
    /** Base points awarded when the event occurred in the match. */
    eventPoints: number;
    /** Timing window bonus (0 if not applicable). */
    timingBonus: number;
    /** Player/scorer/player-on bonus. */
    playerBonus: number;
    /** Assister/player-off bonus. */
    assisterBonus: number;
    /** Corner zone bonus. */
    zoneBonus: number;
    /** Exact-minute jackpot bonus (additive on top of timing). */
    jackpotBonus: number;
    /** 1 or 2 — always stored so reveal screen can show 2× badge even on a miss. */
    captainMultiplier: number;
    /** Always 0 from this engine — streak-calculator.ts (Story 4.2) patches this later. */
    streakBonus: number;
    /** (eventPoints + timingBonus + playerBonus + assisterBonus + zoneBonus + jackpotBonus) × captainMultiplier + streakBonus */
    totalPoints: number;
    /** true when eventPoints > 0 */
    isCorrect: boolean;
}

// ─── extraData helpers ─────────────────────────────────────────────────────────

function getAssisterId(event: MatchEvent): string | undefined {
    const data = event.extraData as Record<string, unknown> | null;
    return typeof data?.assisterId === 'string' ? data.assisterId : undefined;
}

function getPlayerOffId(event: MatchEvent): string | undefined {
    const data = event.extraData as Record<string, unknown> | null;
    return typeof data?.playerOffId === 'string' ? data.playerOffId : undefined;
}

function getZone(event: MatchEvent): string | undefined {
    const data = event.extraData as Record<string, unknown> | null;
    return typeof data?.zone === 'string' ? data.zone : undefined;
}

// ─── Timing Bonus ──────────────────────────────────────────────────────────────

/**
 * Determine the timing window bonus using the nearest-qualifying-window rule.
 * The user's confidenceWindow is the OUTER LIMIT.
 * If diff > confidenceWindow → no bonus (outside their chosen window).
 * Among qualifying windows, we always award the most generous (smallest diff first).
 *
 * Note: diff === 0 (exact minute) also returns TIMING_WINDOW_5_BONUS (diff 0 ≤ 5),
 * and JACKPOT_BONUS is added separately by the caller — so the exact-minute payout is
 * eventPoints + TIMING_WINDOW_5_BONUS + JACKPOT_BONUS + player/zone bonuses.
 */
function getTimingBonus(
    predictedMinute: number,
    realMinute: number,
    confidenceWindow: 5 | 10 | 15,
): number {
    const diff = Math.abs(realMinute - predictedMinute);
    if (diff > confidenceWindow) return 0;
    if (diff <= 5) return TIMING_WINDOW_5_BONUS;
    if (diff <= 10) return TIMING_WINDOW_10_BONUS;
    return TIMING_WINDOW_15_BONUS; // diff ≤ 15 and window = 15 → intentionally 0
}

// ─── Captain Multiplier ────────────────────────────────────────────────────────

function applyCaptainMultiplier(prediction: Prediction, preCaptainTotal: number): number {
    return prediction.isCaptain ? preCaptainTotal * CAPTAIN_MULTIPLIER : preCaptainTotal;
}

// ─── Match Moment Scoring (binary hit/miss) ────────────────────────────────────

function scoreMatchMoment(
    prediction: Prediction,
    gameWeekMoment: GameweekMoment,
    momentType: MomentType,
    matchEvents: MatchEvent[],
): ScoringOutput {
    const eventOccurred = matchEvents.some(
        (e) => e.matchId === prediction.fixtureId && e.eventType === momentType.eventType,
    );
    const eventPoints = eventOccurred ? gameWeekMoment.basePoints : 0;
    const captainMultiplier = prediction.isCaptain ? CAPTAIN_MULTIPLIER : 1;
    const totalPoints = applyCaptainMultiplier(prediction, eventPoints);

    return {
        eventPoints,
        timingBonus: 0,
        playerBonus: 0,
        assisterBonus: 0,
        zoneBonus: 0,
        jackpotBonus: 0,
        captainMultiplier,
        streakBonus: 0,
        totalPoints,
        isCorrect: eventOccurred,
    };
}

// ─── Precision Pick Scoring (multi-layer additive) ────────────────────────────

function scorePrecisionPick(
    prediction: Prediction,
    gameWeekMoment: GameweekMoment,
    momentType: MomentType,
    matchEvents: MatchEvent[],
): ScoringOutput {
    const eventType = momentType.eventType;

    // Find all match events of the correct type for this fixture
    const relevantEvents = matchEvents.filter(
        (e) => e.matchId === prediction.fixtureId && e.eventType === eventType,
    );

    const eventOccurred = relevantEvents.length > 0;

    if (!eventOccurred) {
        const captainMultiplier = prediction.isCaptain ? CAPTAIN_MULTIPLIER : 1;
        return {
            eventPoints: 0,
            timingBonus: 0,
            playerBonus: 0,
            assisterBonus: 0,
            zoneBonus: 0,
            jackpotBonus: 0,
            captainMultiplier,
            streakBonus: 0,
            totalPoints: 0,
            isCorrect: false,
        };
    }

    // Event occurred → award base points
    const eventPoints = gameWeekMoment.basePoints;

    // ── Timing bonus ──
    // Use the event closest to the predicted minute (best-match rule) so that, when
    // multiple events of the same type occur in a match (e.g. two goals), the user is
    // rewarded for whichever event their prediction was nearest to.
    let timingBonus = 0;
    let jackpotBonus = 0;
    if (prediction.predictedMinute != null && prediction.confidenceWindow != null) {
        const confidenceWindow = prediction.confidenceWindow as 5 | 10 | 15;
        const timingEvent = relevantEvents.reduce((best, e) =>
            Math.abs(e.minute - prediction.predictedMinute!) <
            Math.abs(best.minute - prediction.predictedMinute!)
                ? e
                : best,
        );
        timingBonus = getTimingBonus(
            prediction.predictedMinute,
            timingEvent.minute,
            confidenceWindow,
        );
        if (timingEvent.minute === prediction.predictedMinute) {
            jackpotBonus = JACKPOT_BONUS;
        }
    }

    // ── Player / assister / zone bonuses (event-type specific) ──
    let playerBonus = 0;
    let assisterBonus = 0;
    let zoneBonus = 0;

    if (eventType === 'goal') {
        // Scorer bonus: check any event where playerId matches predicted scorer
        if (
            prediction.predictedPlayerId != null &&
            relevantEvents.some((e) => e.playerId === prediction.predictedPlayerId)
        ) {
            playerBonus = gameWeekMoment.playerBonusPoints ?? 0;
        }
        // Assister bonus: independent check across all goal events
        if (prediction.predictedAssisterId != null) {
            const hasAssist = relevantEvents.some(
                (e) => getAssisterId(e) === prediction.predictedAssisterId,
            );
            if (hasAssist) {
                assisterBonus = gameWeekMoment.assisterBonusPoints ?? 0;
            }
        }
    } else if (eventType === 'substitution') {
        // Player-on bonus
        if (
            prediction.predictedPlayerId != null &&
            relevantEvents.some((e) => e.playerId === prediction.predictedPlayerId)
        ) {
            playerBonus = gameWeekMoment.playerBonusPoints ?? 0;
        }
        // Player-off bonus (repurposed assisterBonusPoints field)
        if (prediction.predictedAssisterId != null) {
            const hasPlayerOff = relevantEvents.some(
                (e) => getPlayerOffId(e) === prediction.predictedAssisterId,
            );
            if (hasPlayerOff) {
                assisterBonus = gameWeekMoment.assisterBonusPoints ?? 0;
            }
        }
    } else if (eventType === 'corner') {
        if (
            prediction.predictedZone != null &&
            relevantEvents.some((e) => getZone(e) === prediction.predictedZone)
        ) {
            zoneBonus = gameWeekMoment.zoneBonusPoints ?? 0;
        }
    } else if (eventType === 'yellow_card' || eventType === 'red_card') {
        if (
            prediction.predictedPlayerId != null &&
            relevantEvents.some((e) => e.playerId === prediction.predictedPlayerId)
        ) {
            playerBonus = gameWeekMoment.playerBonusPoints ?? 0;
        }
    }

    const preCaptainTotal = eventPoints + timingBonus + playerBonus + assisterBonus + zoneBonus + jackpotBonus;
    const captainMultiplier = prediction.isCaptain ? CAPTAIN_MULTIPLIER : 1;
    const totalPoints = preCaptainTotal * captainMultiplier;

    return {
        eventPoints,
        timingBonus,
        playerBonus,
        assisterBonus,
        zoneBonus,
        jackpotBonus,
        captainMultiplier,
        streakBonus: 0,
        totalPoints,
        isCorrect: eventPoints > 0,
    };
}

// ─── Top-level export ─────────────────────────────────────────────────────────

/**
 * Score a single prediction against the match events.
 * Pure function — no side effects.
 */
export function scorePrediction(input: ScoringInput): ScoringOutput {
    const {prediction, gameWeekMoment, momentType, matchEvents} = input;

    if (prediction.predictionType === 'match') {
        return scoreMatchMoment(prediction, gameWeekMoment, momentType, matchEvents);
    }
    // 'moment' → Precision Pick
    return scorePrecisionPick(prediction, gameWeekMoment, momentType, matchEvents);
}
