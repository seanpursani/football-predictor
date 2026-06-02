/**
 * Converts a single snake_case key to camelCase.
 * e.g. "game_week_moment_id" → "gameWeekMomentId"
 */
export function toCamel(key: string): string {
  return key.replace(/_([a-z])/g, (_: string, c: string) => c.toUpperCase());
}

/**
 * Converts all top-level keys in a Supabase row from snake_case to camelCase,
 * and parses any string values that look like ISO 8601 datetimes into `Date` objects.
 *
 * Nested objects (e.g. joined relations) are left as-is; parse them separately
 * with their own typed parser to keep the output type-safe.
 *
 * @example
 * const prediction = parseSupabaseRow<Prediction>(raw);
 */
export function parseSupabaseRow<T = Record<string, unknown>>(
  raw: Record<string, unknown>,
): T {
  const out: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(raw)) {
    const camelKey = toCamel(key);

    if (
      typeof value === 'string' &&
      // ISO 8601: "2026-01-15T12:34:56..." — only convert datetime strings, not plain dates or arbitrary strings
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)
    ) {
      out[camelKey] = new Date(value);
    } else {
      out[camelKey] = value;
    }
  }

  return out as T;
}

