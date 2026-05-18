/**
 * odds-converter.test.ts
 * Tests for the convertOddsToPoints utility
 */

import { convertOddsToPoints } from '../functions/_shared/odds-converter';
import { MIN_BASE_POINTS, MAX_BASE_POINTS } from '../functions/_shared/constants';

describe('convertOddsToPoints', () => {
  it('returns MIN_BASE_POINTS (10) for odds 1.2 (clamped to floor)', () => {
    expect(convertOddsToPoints(1.2)).toBe(10);
  });

  it('returns 40 for odds 2.0 (evens)', () => {
    expect(convertOddsToPoints(2.0)).toBe(40);
  });

  it('returns 80 for odds 3.0', () => {
    expect(convertOddsToPoints(3.0)).toBe(80);
  });

  it('returns MAX_BASE_POINTS (120) for odds 10.0 (clamped to ceiling)', () => {
    expect(convertOddsToPoints(10.0)).toBe(120);
  });

  it('always returns an integer', () => {
    const testOdds = [1.5, 1.75, 2.25, 2.5, 3.5, 4.0, 6.0];
    testOdds.forEach((odds) => {
      const result = convertOddsToPoints(odds);
      expect(Number.isInteger(result)).toBe(true);
    });
  });

  it('returns MIN_BASE_POINTS for decimalOdds <= 1.0 (no negative points)', () => {
    expect(convertOddsToPoints(1.0)).toBe(MIN_BASE_POINTS);
    expect(convertOddsToPoints(0.5)).toBe(MIN_BASE_POINTS);
    expect(convertOddsToPoints(0)).toBe(MIN_BASE_POINTS);
  });

  it('never returns value below MIN_BASE_POINTS', () => {
    const lowOdds = [0, 0.1, 0.5, 1.0, 1.1];
    lowOdds.forEach((odds) => {
      expect(convertOddsToPoints(odds)).toBeGreaterThanOrEqual(MIN_BASE_POINTS);
    });
  });

  it('never returns value above MAX_BASE_POINTS', () => {
    const highOdds = [5.0, 10.0, 100.0, 1000.0];
    highOdds.forEach((odds) => {
      expect(convertOddsToPoints(odds)).toBeLessThanOrEqual(MAX_BASE_POINTS);
    });
  });
});

