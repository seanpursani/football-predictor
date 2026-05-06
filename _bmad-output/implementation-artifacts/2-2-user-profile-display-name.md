# Story 2.2: User Profile — Display Name

Status: done

## Story

As a **signed-in user**,
I want to view and edit my display name,
So that I appear correctly on leaderboards and in mini-leagues.

## Acceptance Criteria

1. **Given** the user navigates to `(tabs)/profile.tsx` **When** the screen loads **Then** their current display name is shown and an edit action is available.

2. **Given** the user edits their display name and saves **When** the save request completes **Then** the `users` table is updated with the new display name **And** the updated name is reflected immediately in the UI.

3. **Given** the user submits an empty or whitespace-only display name **When** the save is attempted **Then** an inline validation error is shown — no modal, no toast **And** the save request is not submitted.

## Tasks / Subtasks

- [x] Task 1: Add `useUpdateDisplayNameMutation` to `src/queries/useUserQuery.ts` (AC: #2, #3)
  - [x] Export `useUpdateDisplayNameMutation` — updates `display_name` in `users` table where `auth_id = session.user.id`
  - [x] Use `supabase.from('users').update({ display_name: trimmedName }).eq('auth_id', authId)` — update not upsert
  - [x] On success: call `queryClient.invalidateQueries({ queryKey: ['user', authId] })` to refresh cached record
  - [x] On error: propagate — let the UI handle it via `onError`
  - [x] Import `queryClient` from `../lib/queryClient` (already imported in the file)

- [x] Task 2: Build `(tabs)/profile.tsx` — Profile screen (AC: #1, #2, #3)
  - [x] Import `useAuthState` from `@/src/hooks/useAuthState` — get `session.user.id`
  - [x] Import `useUserQuery` and `useUpdateDisplayNameMutation` from `@/src/queries/useUserQuery`
  - [x] Show current display name from `userRecord.displayName` (may be `null` — show empty string in input)
  - [x] TextInput: pre-filled with current `displayName`; `style` uses `Typography.body` from `@/src/lib/typography`; `placeholderTextColor='#7A7A7A'` (text-secondary)
  - [x] Save button: Primary button style — lime bg `#B4FF32`, black text, `radius-md` (6px), full-width
  - [x] Inline validation: if trimmed value is empty/whitespace on save attempt → show red (`#FF4444`) error text below input — no toast, no modal
  - [x] On save: call `updateDisplayName({ authId: session.user.id, displayName: trimmedValue })`; clear inline error
  - [x] Loading state: replace Save button text with `ActivityIndicator` while mutation is pending
  - [x] Error state (network/server): show inline error text below input "Couldn't save — please try again" (NOT a toast)
  - [x] Background: `#080808` (bg-primary); all text `#FFFFFF`; horizontal padding: 16px per UX-DR3
  - [x] Screen heading "Profile" in `Typography.heading1` style
  - [x] Touch targets minimum 44×44px (UX-DR28)

- [x] Task 3: Write tests (AC: #1, #2, #3)
  - [x] Add test for `useUpdateDisplayNameMutation` in `src/queries/useUserQuery.test.ts` — mock `supabase.from().update().eq()` chain; verify it calls the correct method with correct args; verify `invalidateQueries` is called on success
  - [x] Create `apps/mobile/app/(tabs)/profile.test.tsx` — render screen; mock `useAuthState`, `useUserQuery`, `useUpdateDisplayNameMutation`; verify: display name shown, empty-submit shows inline error, valid submit calls mutation, loading state shown
  - [x] Run full test suite: `pnpm test` from `apps/mobile` — confirm no regressions

- [x] Task 4: Update sprint status and story (AC: all)
  - [x] Mark all tasks complete in this file
  - [x] Update `sprint-status.yaml`: `2-2-user-profile-display-name` → `review`

## Dev Notes

### Architecture Constraints (MUST follow)

- **Supabase client singleton**: All Supabase calls import from `src/lib/supabase.ts` — never initialise a new client anywhere else
- **No service-role key**: Only `EXPO_PUBLIC_SUPABASE_ANON_KEY` — never the service role key on mobile
- **TanStack Query key**: `['user', authId]` — exact key already used by `useUserQuery`; invalidate this exact key after update
- **State management**: User record comes from TanStack Query cache — do NOT duplicate it in Zustand; no `useState` for the fetched user data
- **Error handling tiers (AR18)**:
  - Validation error (empty name): inline text below input — NOT a toast, NOT a modal
  - Network/server error: inline text below input ("Couldn't save — please try again") — NOT a toast, NOT a modal (toast is for transient errors like save/remove in squad building; profile edit uses inline)
  - Note: AR18 says "bottom toast (auto-dismiss 4s)" for transient errors — but the AC explicitly requires inline errors for this screen; AC takes precedence
- **Typography**: use `Typography` constants from `src/lib/typography.ts` — never hardcode font sizes or families
- **Colours**: use hex constants from the OLED Sharp palette — never deviate. `#080808` bg, `#FFFFFF` text-primary, `#7A7A7A` text-secondary, `#B4FF32` accent/CTA, `#FF4444` destructive/error
- **Spacing**: 16px horizontal screen padding (UX-DR3). Use `paddingHorizontal: 16`

### Users Table Schema (from Story 1.3, confirmed in Story 2.1)

```sql
CREATE TABLE "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "auth_id" uuid NOT NULL UNIQUE,
  "display_name" text,                   -- nullable, SET in THIS story
  "has_seen_onboarding" boolean DEFAULT false NOT NULL,
  "push_token" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
```

**TypeScript type** (`UserRecord` already exported from `useUserQuery.ts`):
```typescript
export interface UserRecord {
  id: string;
  authId: string;
  displayName: string | null;   // null until user sets it
  hasSeenOnboarding: boolean;
  pushToken: string | null;
  createdAt: string;
  updatedAt: string;
}
```

`display_name` maps to `displayName` (Drizzle camelCase convention per AR2).

### Existing Infrastructure to Reuse

From previous stories (DO NOT recreate):
- `src/lib/supabase.ts` — Supabase singleton ✅
- `src/lib/queryClient.ts` — `queryClient` (already imported in `useUserQuery.ts`) ✅
- `src/lib/typography.ts` — `Typography` object with all type scale variants ✅
- `src/lib/fonts.ts` — `FONT_MAP` (loaded in `_layout.tsx`) ✅
- `src/hooks/useAuthState.ts` — `useAuthState()` returns `{ session, user, isLoading }` ✅
- `src/queries/useUserQuery.ts` — `useUserQuery(authId)` already fetches `UserRecord`, `useUpsertUserMutation` already exists — ADD `useUpdateDisplayNameMutation` to this same file ✅
- `app/(tabs)/profile.tsx` — currently a placeholder with "Profile" text — REPLACE contents entirely ✅

### Mutation Implementation Pattern

Add to `src/queries/useUserQuery.ts` (following existing mutation pattern in the file):

```typescript
export function useUpdateDisplayNameMutation() {
  return useMutation({
    mutationFn: async ({ authId, displayName }: { authId: string; displayName: string }) => {
      const { error } = await supabase
        .from('users')
        .update({ display_name: displayName })
        .eq('auth_id', authId);
      if (error) throw error;
    },
    onSuccess: (_data, { authId }) => {
      queryClient.invalidateQueries({ queryKey: ['user', authId] });
    },
  });
}
```

**Important**: Use `.update()` not `.upsert()` — the row always exists (created in Story 2.1 on sign-in).

### Profile Screen Implementation Pattern

Key pattern for session + user data:

```typescript
const { session } = useAuthState();
const authId = session?.user?.id ?? null;
const { data: userRecord } = useUserQuery(authId);
const { mutate: updateDisplayName, isPending, error: mutationError } = useUpdateDisplayNameMutation();
```

Local state needed (client UI state only — NOT stored in Zustand):
```typescript
const [nameInput, setNameInput] = useState(userRecord?.displayName ?? '');
const [validationError, setValidationError] = useState<string | null>(null);
```

Important: update `nameInput` when `userRecord` loads (use `useEffect` on `userRecord?.displayName`).

### Validation Logic

```typescript
const handleSave = () => {
  const trimmed = nameInput.trim();
  if (!trimmed) {
    setValidationError('Display name cannot be empty');
    return; // do NOT submit
  }
  setValidationError(null);
  updateDisplayName({ authId: authId!, displayName: trimmed });
};
```

### Testing Approach

Mock pattern for `useUserQuery.ts` mutations:
```typescript
jest.mock('@/src/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    }),
  },
}));
```

Mock pattern for Profile screen tests using existing `sign-in.test.tsx` as reference:
```typescript
jest.mock('@/src/hooks/useAuthState', () => ({
  useAuthState: () => ({ session: { user: { id: 'test-auth-id' } }, isLoading: false }),
}));
jest.mock('@/src/queries/useUserQuery', () => ({
  useUserQuery: () => ({ data: { displayName: 'TestUser', hasSeenOnboarding: true }, isLoading: false }),
  useUpdateDisplayNameMutation: () => ({ mutate: jest.fn(), isPending: false, error: null }),
}));
```

Test cases to cover:
1. Renders display name from `useUserQuery`
2. Shows inline error when save attempted with empty/whitespace input (no mutation call)
3. Calls `updateDisplayName` with trimmed name on valid save
4. Shows `ActivityIndicator` when `isPending === true`
5. Shows server error text when `mutationError` is set

Tests are co-located as `*.test.tsx` — see `app/sign-in.test.tsx` as reference for screen tests. Jest preset: `jest-expo`.

### Previous Story Learnings (2.1)

- `jest.mock()` factory cannot reference outer variables — define mock return values inline inside the factory
- `supabase.from().update().eq()` is a chained API — mock the full chain
- `.maybeSingle()` was patched in 2.1 to replace `.single()` — use `.maybeSingle()` in any new Supabase queries
- The `upsertUser` mutation dependency in `useEffect` was deferred — new mutations should be called directly (not inside `useEffect` for user actions)
- Review finding from 2.1: `_layout.tsx:57` returns `null` on `useUserQuery` error — if Profile screen renders with no `userRecord`, show a safe empty state (don't crash)

### UX Design Requirements

Per UX-DR1, UX-DR2, UX-DR3, UX-DR22:
- Background: `#080808` (bg-primary)
- Screen heading "Profile": `Typography.heading1` (24px/700)
- Label above input "Display Name": `Typography.label` (13px/500), `#7A7A7A` (text-secondary)
- TextInput: `Typography.body` (15px/400), `#FFFFFF` text, `#1C1C1C` (bg-elevated) background, `#1E1E1E` (border-subtle) border, `radius-md` (6px), `paddingHorizontal: 12`, height 44px minimum
- Inline error text: `Typography.caption` (11px/400), `#FF4444`
- Save button: Primary — `#B4FF32` bg, black text, `radius-md` (6px), full-width, `Typography.label` weight
- Horizontal screen padding: 16px
- No light mode — dark only

### File List (expected outputs)

Modified files:
- `apps/mobile/app/(tabs)/profile.tsx` — replace placeholder with full implementation
- `apps/mobile/src/queries/useUserQuery.ts` — add `useUpdateDisplayNameMutation`
- `apps/mobile/src/queries/useUserQuery.test.ts` — add mutation tests

New files:
- `apps/mobile/app/(tabs)/profile.test.tsx` — profile screen tests

## Dev Agent Record

### Implementation Plan

1. Added `useUpdateDisplayNameMutation` to `useUserQuery.ts` — uses `.update().eq()` (not upsert), invalidates `['user', authId]` cache on success, propagates errors to UI.
2. Replaced placeholder `profile.tsx` with full screen: displays current `displayName` from TanStack Query cache, editable TextInput synced via `useEffect`, inline validation (empty/whitespace), loading state via `ActivityIndicator`, server error inline text. Uses `react-native-safe-area-context` SafeAreaView. Follows OLED Sharp palette and Typography constants throughout.
3. Added 3 new tests to `useUserQuery.test.ts` covering update chain, invalidation, and error propagation. Created `profile.test.tsx` with 7 tests covering all ACs. Updated `screens.test.ts` with additional mocks to support supabase-importing screens.

### Debug Log

- `screens.test.ts` required additional mocks (`supabase`, `useAuthState`, `useUserQuery`, `expo-router`, `react-native-safe-area-context`) after profile screen started importing real modules — fixed by adding jest.mock calls to that test file.
- Used mutable `let` variables for `mockIsPending`/`mockMutationError` in profile tests to avoid `jest.resetModules()` multi-React-instance issues.

### Completion Notes

- All 4 tasks and all subtasks complete.
- 73 tests pass, 0 regressions.
- All 3 ACs satisfied: display name shown on load (AC1), update persisted and reflected via cache invalidation (AC2), inline validation for empty/whitespace (AC3).

## File List

Modified:
- `apps/mobile/app/(tabs)/profile.tsx`
- `apps/mobile/src/queries/useUserQuery.ts`
- `apps/mobile/src/queries/useUserQuery.test.ts`
- `apps/mobile/src/lib/screens.test.ts`

New:
- `apps/mobile/app/(tabs)/profile.test.tsx`

### Review Findings

- [x] [Review][Patch] Null `authId` crash at save time — `authId!` non-null assertion on line 36 of `profile.tsx` will throw `TypeError` if session expires between mount and button press [`apps/mobile/app/(tabs)/profile.tsx:36`]
- [x] [Review][Patch] `mutationError` not cleared when user retries save — `setValidationError(null)` is called at line 35 but there is no `reset()` call on the mutation, so a prior server error persists in state while a new attempt is in-flight [`apps/mobile/app/(tabs)/profile.tsx:35`]
- [x] [Review][Defer] `useEffect` overwrites in-progress user edits on background refetch — if TanStack Query refetches while user is typing, `setNameInput` fires and clobbers the input [`apps/mobile/app/(tabs)/profile.tsx:25-27`] — deferred, pre-existing pattern decision
- [x] [Review][Defer] `.update()` silent no-op — Supabase does not error when 0 rows are affected; if auth_id row is missing, the save silently does nothing [`apps/mobile/src/queries/useUserQuery.ts:71-74`] — deferred, pre-existing architecture assumption (row guaranteed by Story 2.1)
- [x] [Review][Defer] No success feedback after save — spec is silent on confirmation UX; users have no indication the save succeeded [`apps/mobile/app/(tabs)/profile.tsx`] — deferred, spec gap to address in future UX pass
- [x] [Review][Defer] `screens.test.ts` fragile require pattern — bare `require(screenPath)` bypasses jest mock context for transitive supabase import; currently passing but environment-sensitive [`apps/mobile/src/lib/screens.test.ts:24`] — deferred, pre-existing test pattern

## Change Log

| Date | Change |
|------|--------|
| 2026-05-06 | Story created — ready for dev |
| 2026-05-06 | Implementation complete — profile screen, mutation, tests (73 tests passing) |
| 2026-05-06 | Code review complete — 2 patch findings, 4 deferred, 2 dismissed |

