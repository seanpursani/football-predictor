/**
 * RLS predicate helpers — unit-testable replication of DB policy logic.
 *
 * These functions mirror the SQL conditions used in the prediction RLS policies
 * defined in 0002_rls_full_policies.sql so they can be tested in Jest without
 * requiring a live Supabase connection.
 */

/**
 * Replicates the INSERT / UPDATE deadline check in the prediction RLS policies:
 *
 *   (g.first_kickoff IS NULL OR now() < g.first_kickoff)
 *
 * @param firstKickoff  The gameweek's first_kickoff timestamp, or null if not set.
 * @param now           The current time (defaults to actual now; injectable for testing).
 * @returns true if a prediction INSERT/UPDATE is allowed under the RLS policy.
 */
export function canInsertPrediction(firstKickoff: Date | null, now: Date = new Date()): boolean {
  if (firstKickoff === null) return true; // NULL → open, no deadline
  return now < firstKickoff; // strict: must be BEFORE deadline
}

