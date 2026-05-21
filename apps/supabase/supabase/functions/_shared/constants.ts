/**
 * Odds-to-Points Formula Constants
 *
 * Formula: points = Math.round(clamp((decimalOdds - 1) * ODDS_SCALE_FACTOR, MIN_BASE_POINTS, MAX_BASE_POINTS))
 *
 * Why `decimalOdds - 1`?
 * Decimal odds include the stake return. Subtracting 1 gives the pure profit multiplier
 * (e.g. odds 2.0 → 1.0; odds 1.2 → 0.2). This "implied difficulty" value scales points correctly.
 *
 * Calibration (ODDS_SCALE_FACTOR = 40):
 * Run against representative Premier League odds values:
 *
 * | Odds | odds-1 | ×40   | clamped | pts |
 * |------|--------|-------|---------|-----|
 * | 1.2  | 0.2    | 8     | 10      |  10 |
 * | 1.5  | 0.5    | 20    | 20      |  20 |
 * | 2.0  | 1.0    | 40    | 40      |  40 |
 * | 3.0  | 2.0    | 80    | 80      |  80 |
 * | 5.0  | 4.0    | 160   | 120     | 120 |
 * | 10.0 | 9.0    | 360   | 120     | 120 |
 *
 * Result: strong favourite (~1.2) → 10 pts; evens (~2.0) → 40 pts; longshots capped at 120.
 * No base Match event score exceeds MAX_BASE_POINTS (120). Precision Pick bonus layers are additive on top.
 *
 * SCALE_FACTOR = 40 chosen because evens (odds 2.0) correctly maps to 40 pts — a meaningful mid-range reward.
 * Odds ≥ ~4.0 hit the MAX_BASE_POINTS cap (intentional: any longshot call deserves the maximum base reward).
 * Adjust to 35–45 range only if future calibration against live gameweek data shows distribution skew.
 *
 * Valid input range: decimalOdds > 1.0 (decimal odds of exactly 1.0 or below are not valid betting odds;
 * they will be silently clamped to MIN_BASE_POINTS — Story 3.2 (odds-converter.ts) must validate inputs upstream).
 */

// ─── Base Points Formula Constants ───────────────────────────────────────────

/**
 * Multiplier applied to (decimalOdds - 1) to convert implied difficulty into base points.
 * Calibrated so that evens (odds 2.0) → 40 pts. Expected range: 35–45.
 */
export const ODDS_SCALE_FACTOR = 40;

/** Minimum base points awarded for any match event prediction (strong-favourite floor). */
export const MIN_BASE_POINTS = 10;

/** Maximum base points for a single match event prediction before Precision Pick bonuses. */
export const MAX_BASE_POINTS = 120;

/**
 * Reference implementation of the odds-to-points formula using the constants above.
 * Story 3.2 (odds-converter.ts) MUST implement this exact formula — zero magic numbers.
 * Exported here as the canonical source of truth so any future deviation is visible.
 *
 * @param decimalOdds - Decimal odds from the external API (must be > 1.0)
 * @returns Integer base points in the range [MIN_BASE_POINTS, MAX_BASE_POINTS]
 */
export function oddsToBasePoints(decimalOdds: number): number {
    return Math.round(
        Math.min(Math.max((decimalOdds - 1) * ODDS_SCALE_FACTOR, MIN_BASE_POINTS), MAX_BASE_POINTS),
    );
}

// ─── Precision Pick Timing Window Bonuses ────────────────────────────────────

/** Bonus points for predicting within ±5 minutes of the actual event minute. */
export const TIMING_WINDOW_5_BONUS = 50;

/** Bonus points for predicting within ±10 minutes of the actual event minute. */
export const TIMING_WINDOW_10_BONUS = 25;

/**
 * Bonus points for predicting within ±15 minutes (outermost window).
 * Intentionally 0: the outermost window grants no timing bonus — the player still scores base
 * event points for a correct match moment call, but the timing element of the Precision Pick
 * is considered too imprecise to warrant an additional reward. This constant is exported (rather
 * than using a bare 0) so Story 4.1 (scoring engine) can reference it by name and the intent
 * is explicit — it is NOT an omission.
 */
export const TIMING_WINDOW_15_BONUS = 0;

// ─── Jackpot Bonus ────────────────────────────────────────────────────────────

/**
 * Bonus points awarded for predicting the exact event minute.
 * Additive on top of the timing window bonus (e.g. exact minute = base + TIMING_WINDOW_5_BONUS + JACKPOT_BONUS).
 */
export const JACKPOT_BONUS = 100;

// ─── Streak Bonuses ───────────────────────────────────────────────────────────

/** Flat bonus points added to the 2nd consecutive correct Precision Pick in a gameweek. */
export const STREAK_2_BONUS = 10;

/** Flat bonus points added to the 3rd consecutive correct Precision Pick in a gameweek. */
export const STREAK_3_BONUS = 20;

/**
 * Flat bonus points added to the 4th and ALL subsequent consecutive correct Precision Picks in a gameweek.
 * The streak bonus is intentionally capped here — there is no STREAK_5_BONUS, STREAK_6_BONUS, etc.
 * Story 4.1 (scoring engine) must NOT invent higher streak constants; 4th+ is the maximum tier.
 */
export const STREAK_4_PLUS_BONUS = 30;

// ─── Captain Multiplier ───────────────────────────────────────────────────────

/**
 * Multiplier applied to a captain's total pick score (all layers combined).
 * Captain picks produce 2× the combined points of base + timing + bonus + streak layers.
 */
export const CAPTAIN_MULTIPLIER = 2;

