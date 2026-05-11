/**
 * Shared Supabase mock factory for Jest tests.
 *
 * Usage in any test file:
 *   jest.mock('@/src/lib/supabase');
 *   // The mock is automatically resolved from this file via Jest's module resolution.
 *
 * For tests that need to control return values, use jest.mocked() or
 * import the mock controls exported from this module:
 *   import { mockSupabaseFrom } from '@/src/lib/__mocks__/supabase';
 *
 * Covers:
 *   - supabase.from().select().eq().maybeSingle()
 *   - supabase.from().insert()
 *   - supabase.from().upsert()
 *   - supabase.from().update().eq()
 *   - supabase.auth.onAuthStateChange()
 *   - supabase.auth.getSession()
 *   - supabase.auth.signOut()
 *   - supabase.auth.signInWithIdToken()
 *   - supabase.auth.signInWithOAuth()
 */

// ---- Chainable query builder mock ----
// Each method returns `this` so chains like .from().update().eq() work.
// Final terminal methods (maybeSingle, single, execute) return a resolved promise.

const makeQueryBuilder = () => {
  const builder: Record<string, jest.Mock> = {};

  const terminal = jest.fn().mockResolvedValue({ data: null, error: null });
  const terminalSingle = jest.fn().mockResolvedValue({ data: null, error: null });

  builder['select'] = jest.fn().mockReturnValue(builder);
  builder['insert'] = jest.fn().mockResolvedValue({ data: null, error: null });
  builder['upsert'] = jest.fn().mockResolvedValue({ data: null, error: null });
  builder['update'] = jest.fn().mockReturnValue(builder);
  builder['delete'] = jest.fn().mockReturnValue(builder);
  builder['eq'] = jest.fn().mockReturnValue(builder);
  builder['neq'] = jest.fn().mockReturnValue(builder);
  builder['in'] = jest.fn().mockReturnValue(builder);
  builder['order'] = jest.fn().mockReturnValue(builder);
  builder['limit'] = jest.fn().mockReturnValue(builder);
  builder['maybeSingle'] = terminal;
  builder['single'] = terminalSingle;

  return builder;
};

const queryBuilder = makeQueryBuilder();

export const supabase = {
  from: jest.fn().mockReturnValue(queryBuilder),
  auth: {
    onAuthStateChange: jest.fn().mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    }),
    getSession: jest
      .fn()
      .mockResolvedValue({ data: { session: null }, error: null }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    signInWithIdToken: jest.fn().mockResolvedValue({ data: {}, error: null }),
    signInWithOAuth: jest
      .fn()
      .mockResolvedValue({ data: { url: null }, error: null }),
  },
};

/**
 * Resets all mock implementations and call counts.
 * Call in beforeEach when you need a clean slate between tests.
 */
export function resetSupabaseMocks() {
  jest.clearAllMocks();
  // Re-wire from() to return the same builder after clearAllMocks
  (supabase.from as jest.Mock).mockReturnValue(queryBuilder);
  (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
    data: { subscription: { unsubscribe: jest.fn() } },
  });
  (supabase.auth.getSession as jest.Mock).mockResolvedValue({
    data: { session: null },
    error: null,
  });
  (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });
  (supabase.auth.signInWithIdToken as jest.Mock).mockResolvedValue({
    data: {},
    error: null,
  });
  (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValue({
    data: { url: null },
    error: null,
  });
}

/**
 * Convenience: make the next .maybeSingle() call return a specific value.
 *
 * Example:
 *   mockMaybeSingle({ id: '1', auth_id: 'abc' });
 */
export function mockMaybeSingle(data: unknown, error: unknown = null) {
  (queryBuilder['maybeSingle'] as jest.Mock).mockResolvedValueOnce({
    data,
    error,
  });
}

/**
 * Convenience: make the next .single() call return a specific value.
 */
export function mockSingle(data: unknown, error: unknown = null) {
  (queryBuilder['single'] as jest.Mock).mockResolvedValueOnce({ data, error });
}

/**
 * Convenience: make the next .update().eq() terminal resolve with an error.
 *
 * Example:
 *   mockUpdateError({ message: 'DB error' });
 *   // then: await supabase.from('users').update(...).eq(...) → { error }
 */
export function mockUpdateError(error: unknown) {
  // update() returns builder; eq() returns builder; the chain resolves when awaited
  // Override eq to return a rejected-style resolved value
  (queryBuilder['eq'] as jest.Mock).mockResolvedValueOnce({ data: null, error });
}

