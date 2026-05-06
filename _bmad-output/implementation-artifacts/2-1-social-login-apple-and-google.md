# Story 2.1: Social Login (Apple & Google)

Status: ready-for-dev

## Story

As a **new user**,
I want to sign in with my Apple or Google account,
So that I can access the app without creating a password.

## Acceptance Criteria

1. **Given** the user opens the app for the first time **When** they tap "Sign in with Apple" or "Sign in with Google" **Then** the OS-native OAuth flow launches and completes **And** a Supabase session is created with a short-lived access token stored in `expo-secure-store` **And** the user record is created in the `users` table on first sign-in.

2. **Given** a returning user opens the app **When** their stored token is still valid **Then** they are authenticated silently — no sign-in screen shown **And** the token refreshes automatically via the Supabase JS client.

3. **Given** a user's session has expired **When** they open the app **Then** they are returned to the sign-in screen **And** no other users' data is accessible before authentication.

## Tasks / Subtasks

- [ ] Task 1: Install required OAuth packages (AC: #1)
  - [ ] Run `npx expo install expo-auth-session expo-crypto` in `apps/mobile` — needed for Google OAuth PKCE flow on mobile
  - [ ] Run `npx expo install @invertase/react-native-apple-authentication` for Apple sign-in on iOS (Expo managed workflow compatible)
  - [ ] Verify peer dependency compatibility with Expo SDK 54 and no conflicts with existing packages

- [ ] Task 2: Configure Supabase Auth providers (AC: #1)
  - [ ] Document in dev notes: Apple Sign-In must be enabled in Supabase Auth dashboard (Settings → Auth → Providers → Apple)
  - [ ] Document in dev notes: Google Sign-In must be enabled (Settings → Auth → Providers → Google); requires OAuth client ID from Google Cloud Console
  - [ ] Add `EXPO_PUBLIC_GOOGLE_CLIENT_ID` env var to `.env.local` and document in story for local dev
  - [ ] Update `app.config.ts` to include `scheme` for OAuth redirect (e.g. `lecolpo://`) — verify it's already set or add it

- [ ] Task 3: Create `src/lib/auth.ts` — auth utility module (AC: #1, #2, #3)
  - [ ] Create `apps/mobile/src/lib/auth.ts`
  - [ ] Export `signInWithApple()` — uses Supabase `supabase.auth.signInWithIdToken()` with Apple credential provider
  - [ ] Export `signInWithGoogle()` — uses Supabase `supabase.auth.signInWithOAuth()` with `provider: 'google'` and redirect back to app
  - [ ] Export `signOut()` — calls `supabase.auth.signOut()`
  - [ ] Export `getSession()` — calls `supabase.auth.getSession()` and returns the session or null
  - [ ] No direct Supabase client init in this file — import singleton from `src/lib/supabase.ts`

- [ ] Task 4: Create `src/hooks/useAuthState.ts` — session listener hook (AC: #2, #3)
  - [ ] Create `apps/mobile/src/hooks/useAuthState.ts`
  - [ ] Subscribe to `supabase.auth.onAuthStateChange()` — fires on sign in, sign out, token refresh
  - [ ] Return `{ session, user, isLoading }` — `isLoading` is true only during the initial session check
  - [ ] On `SIGNED_OUT` event: clear any cached query data relevant to the user
  - [ ] On `SIGNED_IN` / `TOKEN_REFRESHED` event: trigger user record upsert (see Task 5)

- [ ] Task 5: Create `src/queries/useUserQuery.ts` — user record upsert (AC: #1)
  - [ ] Create `apps/mobile/src/queries/useUserQuery.ts`
  - [ ] Export `useUpsertUserMutation` — on first sign-in, upserts a row in `users` with `auth_id = session.user.id`
  - [ ] Upsert logic: `INSERT INTO users (auth_id) VALUES ($1) ON CONFLICT (auth_id) DO NOTHING` — use Supabase JS client `.upsert()` or `.insert()` with `onConflict: 'auth_id'`
  - [ ] Display name is left NULL on creation (set in Story 2.2)
  - [ ] `has_seen_onboarding` defaults to `false` (DB default — no explicit value needed in upsert)
  - [ ] TanStack Query key: `['user', userId]`

- [ ] Task 6: Create `app/sign-in.tsx` — Sign-In screen (AC: #1, #2, #3)
  - [ ] Create `apps/mobile/app/sign-in.tsx`
  - [ ] Design matches OLED Sharp colour system: `bg-primary #080808` background, `#FFFFFF` text
  - [ ] Show app name "LeColpo" in display font (32px/700) — use `FONT_MAP` from `src/lib/fonts.ts`
  - [ ] "Sign in with Apple" button — use `AppleAuthentication.AppleAuthenticationButton` (only shown on iOS; hide on Android)
  - [ ] "Sign in with Google" button — custom button using design system (Primary button style: `bg-accent` (#B4FF32), black text, `radius-md`, full-width)
  - [ ] Loading state: replace button text with an `ActivityIndicator` during OAuth flow — no separate spinner on screen
  - [ ] Error state: show inline text below buttons ("Sign in failed — please try again") — no modal, no toast (this is a critical auth error, present it clearly)
  - [ ] Register screen in `app/_layout.tsx` Stack with `headerShown: false`

- [ ] Task 7: Update `app/_layout.tsx` — auth-gated routing (AC: #2, #3)
  - [ ] Import `useAuthState` hook
  - [ ] During initial `isLoading=true` (session check): show nothing or keep splash screen visible (call `SplashScreen.preventAutoHideAsync()` until loading resolves)
  - [ ] If session exists: render the tab navigator (existing content)
  - [ ] If no session: redirect to `sign-in` using `<Redirect href="/sign-in" />` from `expo-router`
  - [ ] Add `sign-in` screen to the Stack navigator (already done in Task 6 subtask)
  - [ ] Ensure `Sentry.ErrorBoundary` remains the outermost wrapper — do not change existing structure, only add auth gate inside it

- [ ] Task 8: Handle onboarding routing post-auth (AC: #1)
  - [ ] After successful sign-in and user upsert: check `user.has_seen_onboarding` value
  - [ ] If `has_seen_onboarding === false`: redirect to `onboarding.tsx` before Build View
  - [ ] If `has_seen_onboarding === true`: redirect directly to `(tabs)` (Build View)
  - [ ] This routing logic lives in the root layout or a dedicated auth redirect component — not in `sign-in.tsx`

- [ ] Task 9: Write tests (AC: #1, #2, #3)
  - [ ] Test `src/lib/auth.ts`: mock `supabase.auth` and verify `signInWithApple()`, `signInWithGoogle()`, `signOut()`, `getSession()` call the correct Supabase methods
  - [ ] Test `src/hooks/useAuthState.ts`: mock `onAuthStateChange` and verify correct return of `{ session, user, isLoading }`
  - [ ] Test `sign-in.tsx`: render and verify buttons render without crash; verify error state renders inline error text (use React Native Testing Library)
  - [ ] Run full test suite and confirm no regressions

- [ ] Task 10: Update sprint status and story (AC: all)
  - [ ] Mark all tasks complete in this file
  - [ ] Update `sprint-status.yaml`: `2-1-social-login-apple-and-google` → `review` and `epic-2` → `in-progress`

## Dev Notes

### Architecture Constraints (MUST follow)

- **Supabase client singleton**: All Supabase calls MUST import from `src/lib/supabase.ts` — never initialise a new client
- **`expo-secure-store` for token persistence**: Already configured in `src/lib/supabase.ts` via `ExpoSecureStoreAdapter` — the Supabase JS client handles token persistence automatically; no manual token storage needed
- **No service-role key**: Only `EXPO_PUBLIC_SUPABASE_ANON_KEY` in the mobile app — never the service role key
- **TanStack Query key convention**: User queries use `['user', userId]` — do not invent new key structures
- **State management rule**: `useAuthState` returns session data for routing decisions; the actual user DB record is fetched via TanStack Query `useUserQuery` — do NOT store server user data in Zustand

### Users Table Schema (already migrated)

```sql
CREATE TABLE "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "auth_id" uuid NOT NULL UNIQUE,        -- maps to auth.users.id (Supabase Auth)
  "display_name" text,                   -- nullable, set in Story 2.2
  "has_seen_onboarding" boolean DEFAULT false NOT NULL,
  "push_token" text,                     -- set in Story 2.3
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
```

The `users` table exists in the DB from Story 1.3. On first sign-in, insert a row with `auth_id = auth.uid()`. Subsequent sign-ins hit the UNIQUE constraint on `auth_id` — use `upsert` with conflict-do-nothing.

**Drizzle type** (from `packages/types/src/schema/users.ts`):
```typescript
export type User = {
  id: string;          // UUID
  authId: string;      // UUID — Supabase Auth user ID
  displayName: string | null;
  hasSeenOnboarding: boolean;
  pushToken: string | null;
  createdAt: Date;
  updatedAt: Date;
};
```

### Supabase Auth — How It Works in This Stack

Supabase Auth is the sole authentication system. When a user signs in with Apple/Google:
1. The Supabase JS client (already configured in `src/lib/supabase.ts`) handles the OAuth flow
2. It creates an `auth.users` record automatically (managed by Supabase)
3. The session (access token + refresh token) is persisted in `expo-secure-store` via the `ExpoSecureStoreAdapter` already configured in `src/lib/supabase.ts`
4. Token auto-refresh is handled by the Supabase JS client (`autoRefreshToken: true` already set)
5. **Our app's `users` table** is a separate profile table linked via `auth_id = auth.users.id`

The onAuthStateChange listener is the canonical way to react to session changes — use it over manually polling `getSession()`.

### Apple Sign-In (iOS only)

Apple Sign-In on Expo managed workflow requires `@invertase/react-native-apple-authentication`. Key implementation pattern:

```typescript
import * as AppleAuthentication from 'expo-apple-authentication';
// Note: check if expo-apple-authentication is already provided by Expo SDK 54
// If so, use that instead of the invertase package

const credential = await AppleAuthentication.signInAsync({
  requestedScopes: [
    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
    AppleAuthentication.AppleAuthenticationScope.EMAIL,
  ],
});

const { data, error } = await supabase.auth.signInWithIdToken({
  provider: 'apple',
  token: credential.identityToken!,
});
```

**IMPORTANT**: `expo-apple-authentication` is part of Expo SDK 54 — check if it's already installed before adding `@invertase/react-native-apple-authentication`. Use `expo-apple-authentication` if available (it's the official Expo package).

Apple Sign-In button must use the native `AppleAuthentication.AppleAuthenticationButton` component (App Store requirement). Only render it on iOS: `Platform.OS === 'ios'`.

### Google Sign-In

Use Supabase's built-in OAuth flow with `expo-auth-session` for the PKCE flow:

```typescript
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const redirectUri = makeRedirectUri({ scheme: 'lecolpo' }); // must match app.config.ts scheme

const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: redirectUri,
    skipBrowserRedirect: true,
  },
});

if (data.url) {
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);
  // Supabase onAuthStateChange will fire after the redirect resolves
}
```

**Note**: `expo-web-browser` is already in `package.json` — no additional install needed.

### Routing Architecture (Expo Router)

The app uses Expo Router file-based routing. Auth gating pattern:

```
app/
  _layout.tsx      ← root layout — check session, redirect if needed
  sign-in.tsx      ← new screen for this story
  (tabs)/          ← authenticated area
  onboarding.tsx   ← already exists as placeholder
```

Use `<Redirect>` from `expo-router` for declarative routing in the layout. Do NOT use `router.push()` for auth redirects — `Redirect` is the idiomatic approach with Expo Router.

**Routing flow after auth**:
1. `_layout.tsx` detects `session !== null`
2. Check `user.hasSeenOnboarding` from the user DB record
3. If `false`: `<Redirect href="/onboarding" />`
4. If `true`: `<Redirect href="/(tabs)" />`

The `sign-in` screen should be at the same nesting level as `(tabs)` — directly under `app/`.

### Error Handling Tiers (Architecture Rule)

Per project architecture (AR18):
- **Auth failure** (wrong credentials, network blip): inline error below buttons — NOT a toast, NOT a modal
- **Network error during upsert**: bottom toast "Couldn't complete sign in — tap to retry" (4s auto-dismiss) — use TanStack Query's `onError` callback
- **Critical session corruption**: `Sentry.captureException()` and redirect to sign-in

### Existing Infrastructure to Leverage

Already built from Epic 1:
- `src/lib/supabase.ts` — Supabase singleton with `expo-secure-store` adapter ✅
- `src/lib/sentry.ts` — Sentry init (import side-effect in `_layout.tsx`) ✅
- `src/lib/queryClient.ts` — TanStack Query client ✅
- `src/lib/fonts.ts` — `FONT_MAP` with Inter typeface ✅
- `app/_layout.tsx` — root layout with `Sentry.ErrorBoundary`, `QueryClientProvider`, `ThemeProvider`, `Stack` navigator ✅
- `constants/theme.ts` — `NavigationTheme` (OLED Sharp colours) ✅
- `app/onboarding.tsx` — placeholder (will be completed in Story 2.5) ✅

**Do NOT re-initialise Supabase, Sentry, or QueryClient** — they are singletons, already set up.

### Environment Variables Needed

For local dev (`.env.local`):
```bash
EXPO_PUBLIC_SUPABASE_URL=<already set from Story 1.3>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<already set from Story 1.3>
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<from Google Cloud Console — needed for Google OAuth>
```

For Supabase Auth configuration (done in Supabase dashboard, not code):
- Enable Apple provider: Settings → Auth → Providers → Apple → add bundle ID + key
- Enable Google provider: Settings → Auth → Providers → Google → add Web Client ID
- Both are needed for local Supabase dev stack too (`supabase/config.toml` auth section)

### Testing Approach

Tests are co-located as `*.test.ts` / `*.test.tsx` — no `__tests__` directory.

Mock pattern for Supabase auth in tests:
```typescript
jest.mock('@/src/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithIdToken: jest.fn(),
      signInWithOAuth: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
    },
    from: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockResolvedValue({ data: [], error: null }),
  },
}));
```

The existing test infrastructure uses `jest-expo` preset — no additional test setup needed.

### UX Design Requirements for Sign-In Screen

Per UX-DR1, UX-DR2, UX-DR22:
- Background: `#080808` (bg-primary)
- App name: Inter 32px/700 (display variant), `#FFFFFF`
- "Sign in with Apple": use `AppleAuthentication.AppleAuthenticationButton` in white style — iOS only
- "Sign in with Google": Primary button style — lime bg `#B4FF32`, black text, `radius-md` (6px), full-width — iOS and Android
- Touch targets minimum 44×44px (UX-DR28)
- No light mode — dark only

### Key Dependencies Already in package.json

```json
"expo-secure-store": "~15.0.8",   ✅ token storage
"expo-web-browser": "~15.0.10",   ✅ Google OAuth browser flow
"@supabase/supabase-js": "^2.105.3", ✅ auth client
"@tanstack/react-query": "^5.100.9", ✅ mutations
"zustand": "^5.0.13",             ✅ stores (not needed for auth state)
"react-native-reanimated": "~4.1.1", ✅ (not used in this story)
```

New installations needed:
- `expo-apple-authentication` (check if bundled with Expo SDK 54 first — likely yes)
- `expo-auth-session` (for Google OAuth PKCE)

### File List (expected outputs)

New files:
- `apps/mobile/app/sign-in.tsx`
- `apps/mobile/src/lib/auth.ts`
- `apps/mobile/src/lib/auth.test.ts`
- `apps/mobile/src/hooks/useAuthState.ts`
- `apps/mobile/src/hooks/useAuthState.test.ts`
- `apps/mobile/src/queries/useUserQuery.ts`
- `apps/mobile/src/queries/useUserQuery.test.ts`

Modified files:
- `apps/mobile/app/_layout.tsx` — add auth gate and sign-in screen registration
- `apps/mobile/app.config.ts` — verify/add OAuth redirect scheme

### Deferred / Out of Scope for This Story

- Display name editing → Story 2.2
- Push notification token registration → Story 2.3
- RLS policies on predictions → Story 2.4
- Onboarding tutorial content → Story 2.5 (the `onboarding.tsx` placeholder just needs to be reachable)
- The onboarding completion flow (setting `has_seen_onboarding = true`) → Story 2.5

## Dev Agent Record

### Implementation Plan
_To be filled in by dev agent_

### Debug Log
_To be filled in if issues arise_

### Completion Notes
_To be filled in on task completion_

## File List

_To be updated by dev agent during implementation_

## Change Log

| Date | Change |
|------|--------|
| 2026-05-06 | Story created — ready for dev |

