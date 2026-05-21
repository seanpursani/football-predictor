/**
 * RLS Prediction Lock Tests — Story 3.4 (AC #2)
 *
 * Validates the prediction lock logic (FR8) implemented in Story 2.4 via RLS
 * policies in 0002_rls_full_policies.sql.
 *
 * These are pure unit tests of the policy predicate — no live DB required.
 * The authoritative implementation is the SQL policy; these tests confirm the
 * predicate logic is correct and remains unchanged.
 *
 * FR8: Predictions are locked at first_kickoff — enforced purely via DB RLS.
 * No Edge Function or cron job is required for the lock.
 *
 * Run: pnpm --filter @lecolpo/supabase test
 */

import {canInsertPrediction} from './helpers/rls-helpers';

describe('RLS Prediction Lock Logic (FR8)', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('allows INSERT when no deadline is set (first_kickoff = null)', () => {
        // Gameweek exists but first_kickoff has not been set yet (building state)
        expect(canInsertPrediction(null)).toBe(true);
    });

    it('allows INSERT when first_kickoff is in the future', () => {
        const future = new Date(Date.now() + 24 * 60 * 60 * 1000); // +1 day
        expect(canInsertPrediction(future)).toBe(true);
    });

    it('blocks INSERT when first_kickoff has passed (1 minute ago)', () => {
        const past = new Date(Date.now() - 60 * 1000);
        expect(canInsertPrediction(past)).toBe(false);
    });

    it('blocks INSERT when first_kickoff is exactly equal to now (strict < boundary)', () => {
        // Policy uses strict less-than: now() < first_kickoff
        // So first_kickoff == now is NOT allowed
        const now = new Date();
        expect(canInsertPrediction(now, now)).toBe(false);
    });

    it('blocks UPDATE after deadline (same predicate as INSERT)', () => {
        // The UPDATE policy uses the same (first_kickoff IS NULL OR now() < first_kickoff) check
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        expect(canInsertPrediction(oneHourAgo)).toBe(false);
    });

    it('allows INSERT when first_kickoff is 1 millisecond in the future', () => {
        // Edge: just barely before deadline
        const justFuture = new Date(Date.now() + 1);
        expect(canInsertPrediction(justFuture)).toBe(true);
    });
});

