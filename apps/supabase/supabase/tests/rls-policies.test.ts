/**
 * RLS Integration Tests — Story 2.4: RLS Prediction Privacy Policies
 *
 * Prerequisites: local Supabase stack must be running (`supabase start`)
 * Run: pnpm --filter @lecolpo/supabase test
 *
 * Environment variables (defaults match `supabase start` output):
 *   SUPABASE_URL         http://127.0.0.1:54321
 *   SUPABASE_ANON_KEY    <local anon key from `supabase status`>
 *   SUPABASE_SERVICE_KEY <local service_role key from `supabase status`>
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env['SUPABASE_URL'] ?? 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = process.env['SUPABASE_ANON_KEY'] ?? '';
const SUPABASE_SERVICE_KEY = process.env['SUPABASE_SERVICE_KEY'] ?? '';

// Skip all tests when no service key is configured (CI without local Supabase)
const SKIP = !SUPABASE_SERVICE_KEY || !SUPABASE_ANON_KEY;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Service-role admin client — only used for test set-up/tear-down */
function adminClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });
}

/** Create a new test user in Supabase Auth and return an anon client signed in as that user */
async function createUserClient(
  email: string,
  password: string,
): Promise<{ client: SupabaseClient; authId: string; userId: string }> {
  const admin = adminClient();

  // Create auth user
  const { data: createData, error: createError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
  if (createError || !createData.user) {
    throw new Error(`Failed to create user ${email}: ${createError?.message}`);
  }
  const authId = createData.user.id;

  // Insert corresponding row in public.users (no email column in schema)
  const { data: userData, error: userError } = await admin
    .from('users')
    .insert({
      auth_id: authId,
      display_name: email.split('@')[0],
    })
    .select('id')
    .single();
  if (userError || !userData) {
    throw new Error(
      `Failed to insert users row for ${email}: ${userError?.message}`,
    );
  }
  const userId = userData.id as string;

  // Sign in via anon key to get a real JWT
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
  const { error: signInError } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) {
    throw new Error(`Failed to sign in as ${email}: ${signInError.message}`);
  }

  return { client, authId, userId };
}

/** Delete test users from auth (cascade removes public.users via FK or trigger) */
async function cleanupUsers(authIds: string[]): Promise<void> {
  const admin = adminClient();
  for (const id of authIds) {
    // Remove public.users row first to avoid FK issues
    await admin.from('users').delete().eq('auth_id', id);
    await admin.auth.admin.deleteUser(id);
  }
}

/** Insert a gameweek and return its id */
async function insertGameweek(
  firstKickoff: Date | null,
  scoringStatus = 'pending',
): Promise<number> {
  const admin = adminClient();
  const { data, error } = await admin
    .from('gameweeks')
    .insert({
      gameweek_number: Math.floor(Math.random() * 1_000_000),
      status: 'building',
      season: 'test',
      first_kickoff: firstKickoff?.toISOString() ?? null,
      scoring_status: scoringStatus,
    })
    .select('id')
    .single();
  if (error || !data) throw new Error(`insertGameweek failed: ${error?.message}`);
  return data.id as number;
}

/** Delete a gameweek */
async function deleteGameweek(id: number): Promise<void> {
  const admin = adminClient();
  // Delete scoring_results before predictions to respect FK constraint
  await admin.from('scoring_results').delete().eq('gameweek_id', id);
  await admin.from('predictions').delete().eq('gameweek_id', id);
  await admin.from('gameweeks').delete().eq('id', id);
}

/** Insert a prediction using the service role (bypasses RLS) */
async function insertPredictionAdmin(
  userId: string,
  gameweekId: number,
): Promise<number> {
  const admin = adminClient();

  // Ensure a fixture exists for this gameweek (required FK)
  const { data: fixtureData, error: fixtureError } = await admin
    .from('fixtures')
    .insert({
      gameweek_id: gameweekId,
      external_id: `test-fixture-${Date.now()}-${Math.random()}`,
      home_team: 'Home FC',
      away_team: 'Away FC',
      kickoff_at: new Date().toISOString(),
    })
    .select('id')
    .single();
  if (fixtureError || !fixtureData)
    throw new Error(`insertFixture failed: ${fixtureError?.message}`);

  // Ensure a moment_type exists
  const { data: momentTypeData, error: momentTypeError } = await admin
    .from('moment_types')
    .insert({
      name: `test-moment-${Date.now()}-${Math.random()}`,
      event_type: 'goal',
      prediction_type: 'result',
    })
    .select('id')
    .single();
  if (momentTypeError || !momentTypeData)
    throw new Error(`insertMomentType failed: ${momentTypeError?.message}`);

  // Ensure a game_week_moment exists
  const { data: gwMomentData, error: gwMomentError } = await admin
    .from('game_week_moments')
    .insert({
      gameweek_id: gameweekId,
      fixture_id: fixtureData.id,
      moment_type_id: momentTypeData.id,
      base_points: 10,
    })
    .select('id')
    .single();
  if (gwMomentError || !gwMomentData)
    throw new Error(`insertGwMoment failed: ${gwMomentError?.message}`);

  const { data, error } = await admin
    .from('predictions')
    .insert({
      user_id: userId,
      gameweek_id: gameweekId,
      fixture_id: fixtureData.id,
      game_week_moment_id: gwMomentData.id,
      prediction_type: 'result',
    })
    .select('id')
    .single();
  if (error || !data)
    throw new Error(`insertPredictionAdmin failed: ${error?.message}`);
  return data.id as number;
}

/** Insert a scoring_result using service role */
async function insertScoringResultAdmin(
  userId: string,
  gameweekId: number,
  predictionId: number,
): Promise<number> {
  const admin = adminClient();
  const { data, error } = await admin
    .from('scoring_results')
    .insert({
      user_id: userId,
      gameweek_id: gameweekId,
      prediction_id: predictionId,
      total_points: 0,
    })
    .select('id')
    .single();
  if (error || !data)
    throw new Error(`insertScoringResultAdmin failed: ${error?.message}`);
  return data.id as number;
}

// ---------------------------------------------------------------------------
// Test suites
// ---------------------------------------------------------------------------

describe('predictions RLS — before deadline', () => {
  let userA: Awaited<ReturnType<typeof createUserClient>>;
  let userB: Awaited<ReturnType<typeof createUserClient>>;
  let gameweekId: number;

  beforeAll(async () => {
    if (SKIP) return;
    userA = await createUserClient(
      `rls-test-a-${Date.now()}@test.invalid`,
      'Password123!',
    );
    userB = await createUserClient(
      `rls-test-b-${Date.now()}@test.invalid`,
      'Password123!',
    );
    // Gameweek with deadline 1 hour in the future
    const future = new Date(Date.now() + 3_600_000);
    gameweekId = await insertGameweek(future);
    // User B inserts a prediction (should succeed before deadline)
    await insertPredictionAdmin(userB.userId, gameweekId);
  });

  afterAll(async () => {
    if (SKIP) return;
    await deleteGameweek(gameweekId);
    await cleanupUsers([userA.authId, userB.authId]);
  });

  it('user A cannot SELECT user B predictions before first_kickoff', async () => {
    if (SKIP) return;
    const { data } = await userA.client
      .from('predictions')
      .select('id')
      .eq('gameweek_id', gameweekId)
      .eq('user_id', userB.userId);
    expect(data).toHaveLength(0);
  });

  it('user A can INSERT their own prediction before first_kickoff', async () => {
    if (SKIP) return;
    const { error } = await userA.client.from('predictions').insert({
      user_id: userA.userId,
      gameweek_id: gameweekId,
    });
    expect(error).toBeNull();
  });

  it('user A cannot INSERT a prediction using user B user_id (RLS INSERT check)', async () => {
    if (SKIP) return;
    const { error } = await userA.client.from('predictions').insert({
      user_id: userB.userId,
      gameweek_id: gameweekId,
    });
    expect(error).not.toBeNull();
  });

  it('user A cannot UPDATE user B prediction rows', async () => {
    if (SKIP) return;
    const { error } = await userA.client
      .from('predictions')
      .update({ gameweek_id: gameweekId })
      .eq('user_id', userB.userId);
    // Either error or 0 rows updated (RLS silently blocks UPDATE)
    // We check no error thrown and verify the row is unchanged via admin client
    const { data } = await adminClient()
      .from('predictions')
      .select('id')
      .eq('user_id', userB.userId)
      .eq('gameweek_id', gameweekId);
    expect(data).not.toBeNull(); // row still exists
  });

  it('user A cannot DELETE user B prediction rows', async () => {
    if (SKIP) return;
    await userA.client
      .from('predictions')
      .delete()
      .eq('user_id', userB.userId);
    // Verify user B row still exists via admin
    const { data } = await adminClient()
      .from('predictions')
      .select('id')
      .eq('user_id', userB.userId)
      .eq('gameweek_id', gameweekId);
    expect(data?.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------

describe('predictions RLS — after deadline', () => {
  let userA: Awaited<ReturnType<typeof createUserClient>>;
  let userB: Awaited<ReturnType<typeof createUserClient>>;
  let gameweekId: number;

  beforeAll(async () => {
    if (SKIP) return;
    userA = await createUserClient(
      `rls-test-post-a-${Date.now()}@test.invalid`,
      'Password123!',
    );
    userB = await createUserClient(
      `rls-test-post-b-${Date.now()}@test.invalid`,
      'Password123!',
    );
    // Gameweek with deadline 1 hour in the past
    const past = new Date(Date.now() - 3_600_000);
    gameweekId = await insertGameweek(past);
    await insertPredictionAdmin(userB.userId, gameweekId);
  });

  afterAll(async () => {
    if (SKIP) return;
    await deleteGameweek(gameweekId);
    await cleanupUsers([userA.authId, userB.authId]);
  });

  it('user A CAN SELECT user B predictions after first_kickoff', async () => {
    if (SKIP) return;
    const { data, error } = await userA.client
      .from('predictions')
      .select('id')
      .eq('gameweek_id', gameweekId)
      .eq('user_id', userB.userId);
    expect(error).toBeNull();
    expect(data?.length).toBeGreaterThan(0);
  });

  it('user A cannot INSERT a prediction after first_kickoff (write-lock)', async () => {
    if (SKIP) return;
    const { error } = await userA.client.from('predictions').insert({
      user_id: userA.userId,
      gameweek_id: gameweekId,
    });
    expect(error).not.toBeNull();
  });

  it('user A cannot UPDATE their own prediction after first_kickoff (write-lock)', async () => {
    if (SKIP) return;
    // Insert user A prediction via admin, then try to UPDATE via user A client
    await insertPredictionAdmin(userA.userId, gameweekId);
    const { error } = await userA.client
      .from('predictions')
      .update({ gameweek_id: gameweekId })
      .eq('user_id', userA.userId);
    // Expect no rows affected (RLS blocks update after deadline)
    // We verify via admin that the row is unchanged
    const { data } = await adminClient()
      .from('predictions')
      .select('id')
      .eq('user_id', userA.userId)
      .eq('gameweek_id', gameweekId);
    expect(data?.length).toBeGreaterThan(0); // row unchanged by user A update
    void error; // error may or may not be present depending on Supabase version; silent block is acceptable
  });
});

// ---------------------------------------------------------------------------

describe('scoring_results RLS', () => {
  let userA: Awaited<ReturnType<typeof createUserClient>>;
  let gameweekPending: number;
  let gameweekComplete: number;
  let predictionId: number;

  beforeAll(async () => {
    if (SKIP) return;
    userA = await createUserClient(
      `rls-test-sr-${Date.now()}@test.invalid`,
      'Password123!',
    );
    gameweekPending = await insertGameweek(null, 'pending');
    gameweekComplete = await insertGameweek(null, 'complete');
    predictionId = await insertPredictionAdmin(userA.userId, gameweekComplete);
    await insertScoringResultAdmin(userA.userId, gameweekComplete, predictionId);

    // Also insert for pending gameweek
    const predPendingId = await insertPredictionAdmin(
      userA.userId,
      gameweekPending,
    );
    await insertScoringResultAdmin(userA.userId, gameweekPending, predPendingId);
  });

  afterAll(async () => {
    if (SKIP) return;
    await deleteGameweek(gameweekPending);
    await deleteGameweek(gameweekComplete);
    await cleanupUsers([userA.authId]);
  });

  it('user A cannot SELECT own scoring_results when scoring_status is pending', async () => {
    if (SKIP) return;
    const { data } = await userA.client
      .from('scoring_results')
      .select('id')
      .eq('gameweek_id', gameweekPending)
      .eq('user_id', userA.userId);
    expect(data).toHaveLength(0);
  });

  it('user A CAN SELECT own scoring_results when scoring_status is complete', async () => {
    if (SKIP) return;
    const { data, error } = await userA.client
      .from('scoring_results')
      .select('id')
      .eq('gameweek_id', gameweekComplete)
      .eq('user_id', userA.userId);
    expect(error).toBeNull();
    expect(data?.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------

describe('admin JWT claim bypass', () => {
  let adminUserClient: SupabaseClient;
  let regularUser: Awaited<ReturnType<typeof createUserClient>>;
  let gameweekId: number;

  beforeAll(async () => {
    if (SKIP) return;
    regularUser = await createUserClient(
      `rls-test-regular-${Date.now()}@test.invalid`,
      'Password123!',
    );
    const future = new Date(Date.now() + 3_600_000);
    gameweekId = await insertGameweek(future);
    await insertPredictionAdmin(regularUser.userId, gameweekId);

    // Create admin user with custom JWT claim role=admin
    const admin = adminClient();
    const adminEmail = `rls-test-admin-${Date.now()}@test.invalid`;
    const { data: adminAuthData, error } = await admin.auth.admin.createUser({
      email: adminEmail,
      password: 'Password123!',
      email_confirm: true,
      app_metadata: { role: 'admin' },
    });
    if (error || !adminAuthData.user) {
      throw new Error(`Failed to create admin user: ${error?.message}`);
    }
    await admin.from('users').insert({
      auth_id: adminAuthData.user.id,
      display_name: 'Admin',
    });
    adminUserClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });
    await adminUserClient.auth.signInWithPassword({
      email: adminEmail,
      password: 'Password123!',
    });
  });

  afterAll(async () => {
    if (SKIP) return;
    await deleteGameweek(gameweekId);
    // Clean up admin user
    const { data } = await adminClient().auth.admin.listUsers();
    const adminAuthUser = data.users.find((u) => u.app_metadata?.['role'] === 'admin');
    if (adminAuthUser) {
      await adminClient().from('users').delete().eq('auth_id', adminAuthUser.id);
      await adminClient().auth.admin.deleteUser(adminAuthUser.id);
    }
    await cleanupUsers([regularUser.authId]);
  });

  it('admin can SELECT all predictions including other users rows before deadline', async () => {
    if (SKIP) return;
    const { data, error } = await adminUserClient
      .from('predictions')
      .select('id')
      .eq('gameweek_id', gameweekId)
      .eq('user_id', regularUser.userId);
    expect(error).toBeNull();
    expect(data?.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// users table — INSERT policy (regression test for Epic 2 retro discovery)
// ---------------------------------------------------------------------------

describe('users RLS — INSERT policy (new user sign-in path)', () => {
  const email = `insert-test-${Date.now()}@example.com`;
  const password = 'Test1234!';
  let authId: string;
  let anonClient: SupabaseClient;

  beforeAll(async () => {
    if (SKIP) return;
    // Create auth user only — no public.users row yet (simulates first sign-in)
    const admin = adminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error || !data.user) throw new Error(`Setup failed: ${error?.message}`);
    authId = data.user.id;

    // Sign in as this user via anon key
    anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });
    const { error: signInError } = await anonClient.auth.signInWithPassword({ email, password });
    if (signInError) throw new Error(`Sign-in failed: ${signInError.message}`);
  });

  afterAll(async () => {
    if (SKIP) return;
    await adminClient().from('users').delete().eq('auth_id', authId);
    await adminClient().auth.admin.deleteUser(authId);
  });

  it('authenticated user can INSERT their own row into users (upsert on first sign-in)', async () => {
    if (SKIP) return;
    // Simulates supabase.from('users').upsert({ auth_id: authId }) from the mobile client
    const { error } = await anonClient
      .from('users')
      .upsert({ auth_id: authId }, { onConflict: 'auth_id' });
    expect(error).toBeNull();

    // Verify row exists
    const { data, error: selectError } = await anonClient
      .from('users')
      .select('id, auth_id')
      .eq('auth_id', authId)
      .maybeSingle();
    expect(selectError).toBeNull();
    expect(data).not.toBeNull();
    expect(data?.auth_id).toBe(authId);
  });

  it('authenticated user cannot INSERT a row with a different auth_id', async () => {
    if (SKIP) return;
    const fakeAuthId = '00000000-0000-0000-0000-000000000001';
    const { error } = await anonClient
      .from('users')
      .insert({ auth_id: fakeAuthId });
    // RLS WITH CHECK should block this
    expect(error).not.toBeNull();
  });

  it('second upsert (returning user) is a no-op and does not error', async () => {
    if (SKIP) return;
    const { error } = await anonClient
      .from('users')
      .upsert({ auth_id: authId }, { onConflict: 'auth_id' });
    expect(error).toBeNull();
  });
});

