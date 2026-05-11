/**
 * Odds Calibration Tests — Story 3.0: Odds-to-Points Formula Design & Calibration
 *
 * Validates that the formula `Math.round(clamp((decimalOdds - 1) * ODDS_SCALE_FACTOR, MIN_BASE_POINTS, MAX_BASE_POINTS))`
 * produces the expected base points for representative Premier League odds values.
 *
 * Uses Jest (ts-jest). Run: pnpm --filter @lecolpo/supabase test
 */

import {
  ODDS_SCALE_FACTOR,
  MIN_BASE_POINTS,
  MAX_BASE_POINTS,
  TIMING_WINDOW_5_BONUS,
  TIMING_WINDOW_10_BONUS,
  TIMING_WINDOW_15_BONUS,
  JACKPOT_BONUS,
  STREAK_2_BONUS,
  STREAK_3_BONUS,
  STREAK_4_PLUS_BONUS,
  CAPTAIN_MULTIPLIER,
  oddsToBasePoints,
} from '../functions/_shared/constants';

/** Alias for test readability — delegates to the canonical exported formula. */
const oddsToPoints = oddsToBasePoints;

describe('Odds-to-Points Formula Calibration (Story 3.0)', () => {
  describe('AC#1 — Base points at representative odds values', () => {
    it('heavy favourite (odds 1.2) → 10 pts (minimum floor, AC range 10–20)', () => {
      expect(oddsToPoints(1.2)).toBe(10);
      expect(oddsToPoints(1.2)).toBeGreaterThanOrEqual(10);
      expect(oddsToPoints(1.2)).toBeLessThanOrEqual(20);
    });

    it('favourite (odds 1.5) → 20 pts', () => {
      expect(oddsToPoints(1.5)).toBe(20);
    });

    it('evens (odds 2.0) → 40 pts (AC range 30–50)', () => {
      expect(oddsToPoints(2.0)).toBe(40);
      expect(oddsToPoints(2.0)).toBeGreaterThanOrEqual(30);
      expect(oddsToPoints(2.0)).toBeLessThanOrEqual(50);
    });

    it('mild outsider (odds 3.0) → 80 pts', () => {
      expect(oddsToPoints(3.0)).toBe(80);
    });

    it('outsider (odds 5.0) → capped at MAX_BASE_POINTS (120) — AC updated 2026-05-11 from 60–90 to ≤120', () => {
      // With SCALE_FACTOR=40: (5-1)*40=160 → clamped to 120 (cap is the reward for longshots)
      expect(oddsToPoints(5.0)).toBe(MAX_BASE_POINTS);
      expect(oddsToPoints(5.0)).toBeLessThanOrEqual(MAX_BASE_POINTS);
    });

    it('longshot (odds 10.0) → capped at MAX_BASE_POINTS (120)', () => {
      // With SCALE_FACTOR=40: (10-1)*40=360 → clamped to 120
      expect(oddsToPoints(10.0)).toBe(MAX_BASE_POINTS);
      expect(oddsToPoints(10.0)).toBeLessThanOrEqual(MAX_BASE_POINTS);
    });

    it('no base score ever exceeds MAX_BASE_POINTS (120)', () => {
      const extremeOdds = [1.01, 1.1, 1.5, 2.0, 5.0, 10.0, 50.0, 1000.0];
      extremeOdds.forEach((odds) => {
        expect(oddsToPoints(odds)).toBeLessThanOrEqual(MAX_BASE_POINTS);
      });
    });

    it('no base score ever falls below MIN_BASE_POINTS (10)', () => {
      const extremelyShortOdds = [1.01, 1.05, 1.1, 1.15, 1.2];
      extremelyShortOdds.forEach((odds) => {
        expect(oddsToPoints(odds)).toBeGreaterThanOrEqual(MIN_BASE_POINTS);
      });
    });

    it('invalid input: odds = 1.0 (break-even) clamps to MIN_BASE_POINTS — Story 3.2 must validate upstream', () => {
      // (1.0 - 1) * 40 = 0 → clamped to MIN_BASE_POINTS. Formula is safe but Story 3.2 should reject odds ≤ 1.0.
      expect(oddsToPoints(1.0)).toBe(MIN_BASE_POINTS);
    });

    it('invalid input: odds < 1.0 (sub-unity) clamps to MIN_BASE_POINTS', () => {
      // (0.5 - 1) * 40 = -20 → clamped to MIN_BASE_POINTS. Story 3.2 must throw or skip such values.
      expect(oddsToPoints(0.5)).toBe(MIN_BASE_POINTS);
      expect(oddsToPoints(0)).toBe(MIN_BASE_POINTS);
    });
  });

  describe('AC#2 — Constants are correctly defined (no magic numbers)', () => {
    it('ODDS_SCALE_FACTOR is a positive integer in the calibrated range 35–45', () => {
      expect(Number.isInteger(ODDS_SCALE_FACTOR)).toBe(true);
      expect(ODDS_SCALE_FACTOR).toBeGreaterThanOrEqual(35);
      expect(ODDS_SCALE_FACTOR).toBeLessThanOrEqual(45);
    });

    it('MIN_BASE_POINTS = 10', () => {
      expect(MIN_BASE_POINTS).toBe(10);
      expect(Number.isInteger(MIN_BASE_POINTS)).toBe(true);
    });

    it('MAX_BASE_POINTS = 120', () => {
      expect(MAX_BASE_POINTS).toBe(120);
      expect(Number.isInteger(MAX_BASE_POINTS)).toBe(true);
    });

    it('timing window bonuses are integers and in descending order', () => {
      expect(Number.isInteger(TIMING_WINDOW_5_BONUS)).toBe(true);
      expect(Number.isInteger(TIMING_WINDOW_10_BONUS)).toBe(true);
      expect(Number.isInteger(TIMING_WINDOW_15_BONUS)).toBe(true);
      expect(TIMING_WINDOW_5_BONUS).toBeGreaterThan(TIMING_WINDOW_10_BONUS);
      expect(TIMING_WINDOW_10_BONUS).toBeGreaterThanOrEqual(TIMING_WINDOW_15_BONUS);
    });

    it('TIMING_WINDOW_5_BONUS = 50, TIMING_WINDOW_10_BONUS = 25, TIMING_WINDOW_15_BONUS = 0', () => {
      expect(TIMING_WINDOW_5_BONUS).toBe(50);
      expect(TIMING_WINDOW_10_BONUS).toBe(25);
      expect(TIMING_WINDOW_15_BONUS).toBe(0);
    });

    it('JACKPOT_BONUS = 100 (integer)', () => {
      expect(JACKPOT_BONUS).toBe(100);
      expect(Number.isInteger(JACKPOT_BONUS)).toBe(true);
    });

    it('streak bonuses are integers in ascending order', () => {
      expect(Number.isInteger(STREAK_2_BONUS)).toBe(true);
      expect(Number.isInteger(STREAK_3_BONUS)).toBe(true);
      expect(Number.isInteger(STREAK_4_PLUS_BONUS)).toBe(true);
      expect(STREAK_2_BONUS).toBe(10);
      expect(STREAK_3_BONUS).toBe(20);
      expect(STREAK_4_PLUS_BONUS).toBe(30);
      expect(STREAK_3_BONUS).toBeGreaterThan(STREAK_2_BONUS);
      expect(STREAK_4_PLUS_BONUS).toBeGreaterThan(STREAK_3_BONUS);
    });

    it('CAPTAIN_MULTIPLIER = 2 (integer)', () => {
      expect(CAPTAIN_MULTIPLIER).toBe(2);
      expect(Number.isInteger(CAPTAIN_MULTIPLIER)).toBe(true);
    });
  });

  describe('Game-feel guardrails', () => {
    it('Precision Pick with exact minute (jackpot) scores base + window5 + jackpot', () => {
      const basePoints = oddsToPoints(2.0); // 40 pts
      const total = basePoints + TIMING_WINDOW_5_BONUS + JACKPOT_BONUS;
      expect(total).toBe(190); // 40 + 50 + 100
      expect(total).toBeGreaterThan(MAX_BASE_POINTS); // intentionally exceeds base cap ✓
    });

    it('Captain multiplier doubles full total', () => {
      const basePoints = oddsToPoints(2.0); // 40 pts
      const withCaptain = basePoints * CAPTAIN_MULTIPLIER;
      expect(withCaptain).toBe(80);
    });

    it('Streak bonus is additive flat points', () => {
      const basePoints = oddsToPoints(2.0); // 40 pts
      const withStreak3 = basePoints + STREAK_3_BONUS;
      expect(withStreak3).toBe(60);
    });
  });
});

