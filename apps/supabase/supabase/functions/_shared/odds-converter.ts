import {MAX_BASE_POINTS, MIN_BASE_POINTS, ODDS_SCALE_FACTOR} from './constants.ts';

/** Input type for odds conversion */
export type DecimalOdds = number;

/** Output type — always an integer in [MIN_BASE_POINTS, MAX_BASE_POINTS] */
export type BasePoints = number;

/**
 * Converts decimal odds from the external API to an integer base points value.
 * Uses the canonical formula from constants.ts — zero magic numbers.
 *
 * @param decimalOdds - Decimal odds (must be > 1.0; values ≤ 1.0 are clamped to MIN_BASE_POINTS)
 * @returns Integer base points in [MIN_BASE_POINTS, MAX_BASE_POINTS]
 */
export function convertOddsToPoints(decimalOdds: DecimalOdds): BasePoints {
    return Math.round(
        Math.min(Math.max((decimalOdds - 1) * ODDS_SCALE_FACTOR, MIN_BASE_POINTS), MAX_BASE_POINTS),
    );
}

