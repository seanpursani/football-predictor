# Story 1.5: CI/CD Pipeline & Error Monitoring

Status: ready-for-dev

## Story

As a **developer**,
I want GitHub Actions CI/CD and Sentry error monitoring configured,
So that every push to main automatically validates, deploys, and builds — and errors are surfaced with appropriate priority.

## Acceptance Criteria

1. **Given** `.github/workflows/ci.yml` is created **When** a commit is pushed to `main` **Then** the workflow runs in sequence: Jest tests → `supabase db push` → `supabase functions deploy --all` → Expo EAS production build **And** each step only runs if the previous step passes.

2. **Given** a PR is opened against `main` **When** CI runs on the PR **Then** an Expo EAS Preview channel build is triggered (not production).

3. **Given** Sentry is initialized in `lib/sentry.ts` with an error boundary in `app/_layout.tsx` **When** the mobile app encounters an uncaught JS error or render failure **Then** Sentry captures it and the error boundary prevents a blank crash screen.

4. **Given** the Sentry Deno SDK is initialized in `functions/_shared/` **When** an Edge Function throws an uncaught exception **Then** it is captured in the `edge-functions` Sentry environment **And** any error originating from the `run-scoring` function is configured as a high-priority Sentry alert.

## Tasks / Subtasks

- [ ] Task 1: Install Sentry mobile SDK (AC: #3)
  - [ ] `npx expo install @sentry/react-native` in `apps/mobile`
  - [ ] Add Sentry Expo plugin to `app.config.ts`: `['@sentry/react-native/expo', { organization: '<org>', project: 'lecolpo-mobile' }]`
  - [ ] Verify no peer dependency errors

- [ ] Task 2: Create `lib/sentry.ts` — mobile Sentry init (AC: #3)
  - [ ] Create `apps/mobile/src/lib/sentry.ts`
  - [ ] Initialize Sentry with DSN from `EXPO_PUBLIC_SENTRY_DSN` env var
  - [ ] Set `environment` based on `__DEV__` flag: `'development'` vs `'production'`
  - [ ] Set `debug: __DEV__` to suppress noise in production
  - [ ] Export `Sentry` for use in catch blocks (error capture)
  - [ ] Do NOT call `Sentry.init()` more than once — singleton init pattern

- [ ] Task 3: Add Sentry error boundary to `app/_layout.tsx` (AC: #3)
  - [ ] Import `Sentry` from `src/lib/sentry.ts` — ensure init runs before any render
  - [ ] Wrap root `<Stack>` content with `Sentry.ErrorBoundary` (or equivalent `<ErrorBoundary fallback={...}>`)
  - [ ] Fallback renders a safe, non-blank screen (e.g. "Something went wrong — please restart the app")
  - [ ] The `QueryClientProvider` and `ThemeProvider` wrappers must remain — add error boundary as outer wrapper

- [ ] Task 4: Create `functions/_shared/sentry.ts` — Edge Function Sentry init (AC: #4)
  - [ ] Create `apps/supabase/functions/_shared/sentry.ts`
  - [ ] Import and init `@sentry/deno` SDK with DSN from Supabase secret env var `SENTRY_DSN`
  - [ ] Set environment: `'edge-functions'`
  - [ ] Export a `captureException(err: unknown, context?: Record<string, unknown>)` helper
  - [ ] Export a `captureHighPriority(err: unknown, context?: Record<string, unknown>)` helper that sets `level: 'fatal'` — used by `run-scoring`

- [ ] Task 5: Create GitHub Actions CI workflow for main branch (AC: #1)
  - [ ] Create `.github/workflows/ci.yml`
  - [ ] Trigger: `push` to `main` branch only
  - [ ] Jobs must run sequentially (each `needs` the previous):
    - `test`: Run `pnpm --filter mobile test -- --ci --passWithNoTests`
    - `migrate`: Run `supabase db push` using `SUPABASE_ACCESS_TOKEN` + `SUPABASE_PROJECT_ID` secrets
    - `deploy-functions`: Run `supabase functions deploy --all` using project secrets
    - `eas-build`: Trigger Expo EAS production channel build via `expo-github-action`
  - [ ] Each job only runs if the previous passes (`needs:` dependency chain)
  - [ ] Use pinned action versions for security (e.g. `actions/checkout@v4`)

- [ ] Task 6: Create GitHub Actions CI workflow for PRs (AC: #2)
  - [ ] Add a separate job (or workflow) triggered on `pull_request` targeting `main`
  - [ ] PR workflow runs: Jest tests only + EAS Preview channel build (no `supabase db push`, no functions deploy)
  - [ ] EAS Preview build uses `--profile preview` channel
  - [ ] Can be in the same `ci.yml` using job conditionals or a separate `pr.yml`

- [ ] Task 7: Write tests (AC: #3, #4)
  - [ ] Test `lib/sentry.ts` exports a Sentry instance (or mock init) without throwing
  - [ ] Test error boundary renders fallback when a child throws (use `@testing-library/react-native` render with a throw)
  - [ ] Test `functions/_shared/sentry.ts` exports `captureException` and `captureHighPriority` as functions
  - [ ] Run full test suite and confirm no regressions (39 existing tests pass)

- [ ] Task 8: Update sprint status and story (AC: all)
  - [ ] Mark all tasks complete in this file
  - [ ] Update `sprint-status.yaml`: `1-5-cicd-pipeline-and-error-monitoring` → `review`

## Dev Notes

### Package Installation

```bash
# Mobile Sentry SDK (use expo install for SDK 54 compatibility)
cd apps/mobile
npx expo install @sentry/react-native
```

The `@sentry/react-native` package for Expo SDK 54 is `@sentry/react-native` v6.x. It automatically integrates with Expo via its plugin entry in `app.config.ts`.

**Edge Functions use the Deno SDK — no npm install needed.** Import directly via URL in the Edge Function:
```typescript
import * as Sentry from 'https://deno.land/x/sentry/index.mjs';
// Or use the npm import if Supabase functions support it:
import * as Sentry from 'npm:@sentry/deno';
```
Prefer `npm:@sentry/deno` if Supabase Edge Functions Deno runtime supports it (check Supabase docs for current Deno version). Fall back to `https://deno.land/x/sentry/index.mjs`.

### Sentry Mobile Init Pattern

```typescript
// apps/mobile/src/lib/sentry.ts
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN ?? '',
  environment: __DEV__ ? 'development' : 'production',
  debug: __DEV__,
  // tracesSampleRate: 0 for MVP — no performance monitoring overhead
  tracesSampleRate: 0,
  // Only capture errors in production (reduce noise during dev)
  enabled: !__DEV__,
});

export { Sentry };
```

**Critical:** `Sentry.init()` must be called before any React render. Import `src/lib/sentry.ts` at the top of `app/_layout.tsx` before any component is used. Side effect import is fine:

```tsx
// app/_layout.tsx — first import
import '../src/lib/sentry'; // ensure init runs before render
import * as Sentry from '@sentry/react-native';
```

### Error Boundary in Root Layout

```tsx
// app/_layout.tsx
import '../src/lib/sentry';
import * as Sentry from '@sentry/react-native';
// ... existing imports ...

function ErrorFallback() {
  return (
    <View style={{ flex: 1, backgroundColor: '#080808', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#FFFFFF', fontSize: 15 }}>
        Something went wrong — please restart the app.
      </Text>
    </View>
  );
}

export default function RootLayout() {
  // ... existing font loading logic ...

  return (
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={NavigationTheme}>
          <Stack>
            {/* existing screen registrations */}
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </QueryClientProvider>
    </Sentry.ErrorBoundary>
  );
}
```

**Note:** `Sentry.ErrorBoundary` is the class component error boundary provided by `@sentry/react-native`. It automatically captures `componentDidCatch` errors and reports them to Sentry before rendering the fallback.

### Edge Function Sentry Shared Helper

```typescript
// apps/supabase/functions/_shared/sentry.ts
import * as Sentry from 'npm:@sentry/deno';

let initialized = false;

function ensureInit() {
  if (initialized) return;
  Sentry.init({
    dsn: Deno.env.get('SENTRY_DSN') ?? '',
    environment: 'edge-functions',
    tracesSampleRate: 0,
  });
  initialized = true;
}

export function captureException(err: unknown, context?: Record<string, unknown>) {
  ensureInit();
  Sentry.withScope((scope) => {
    if (context) scope.setContext('additional', context);
    Sentry.captureException(err);
  });
}

export function captureHighPriority(err: unknown, context?: Record<string, unknown>) {
  ensureInit();
  Sentry.withScope((scope) => {
    scope.setLevel('fatal'); // high-priority alert
    if (context) scope.setContext('additional', context);
    Sentry.captureException(err);
  });
}
```

**Usage in `run-scoring/index.ts`** (when that story is implemented, Epic 4):
```typescript
import { captureHighPriority } from '../_shared/sentry.ts';
// ...
catch (err) {
  captureHighPriority(err, { gameweekId, scoringPhase });
  // set scoring_status = 'error'
}
```

### GitHub Actions CI Workflow

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  PNPM_VERSION: '9'

jobs:
  test:
    name: Run Jest Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter mobile test -- --ci --passWithNoTests --forceExit

  migrate:
    name: Apply DB Migrations
    needs: test
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
        with:
          version: latest
      - run: supabase db push --project-ref ${{ secrets.SUPABASE_PROJECT_ID }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

  deploy-functions:
    name: Deploy Edge Functions
    needs: migrate
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
        with:
          version: latest
      - run: supabase functions deploy --all --project-ref ${{ secrets.SUPABASE_PROJECT_ID }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

  eas-build-production:
    name: EAS Production Build
    needs: deploy-functions
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}
      - run: pnpm install --frozen-lockfile
      - uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: eas build --platform all --profile production --non-interactive
        working-directory: apps/mobile

  eas-build-preview:
    name: EAS Preview Build (PR only)
    needs: test
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}
      - run: pnpm install --frozen-lockfile
      - uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: eas build --platform all --profile preview --non-interactive
        working-directory: apps/mobile
```

**Required GitHub Secrets (must be set in repo settings before CI runs):**
| Secret | Description |
|--------|-------------|
| `SUPABASE_ACCESS_TOKEN` | Supabase CLI personal access token (`supabase login` → copy) |
| `SUPABASE_PROJECT_ID` | Supabase project ref (from Supabase dashboard URL) |
| `EXPO_TOKEN` | Expo EAS personal access token (`expo login` → `eas credentials`) |

**Note:** The `migrate` and `deploy-functions` jobs are gated to `main` branch pushes only (`if: github.ref == 'refs/heads/main' && github.event_name == 'push'`). PRs only run `test` + `eas-build-preview`.

### EAS Build Profiles

The `eas.json` file must exist in `apps/mobile/` with at least `preview` and `production` profiles. Check if it already exists. If not, create a minimal version:

```json
// apps/mobile/eas.json
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "preview": {
      "distribution": "internal",
      "ios": { "simulator": false },
      "android": { "buildType": "apk" }
    },
    "production": {
      "ios": { "resourceClass": "m-medium" },
      "android": { "buildType": "app-bundle" }
    }
  }
}
```

### app.config.ts Update for Sentry Plugin

Add the Sentry plugin to `app.config.ts` plugins array:

```typescript
// In app.config.ts plugins array, add:
[
  '@sentry/react-native/expo',
  {
    organization: process.env.SENTRY_ORG ?? 'lecolpo',
    project: 'lecolpo-mobile',
  },
],
```

**Environment variable needed in `.env.local`:**
```
EXPO_PUBLIC_SENTRY_DSN=https://<key>@oXXXXXX.ingest.sentry.io/<projectid>
SENTRY_ORG=<your-sentry-org-slug>
```

### Sentry Project Setup (Manual Pre-step)

Before this story can be fully validated, these Sentry projects need to exist:
1. Create Sentry project `lecolpo-mobile` (React Native type) → get DSN
2. Create Sentry project `lecolpo-edge-functions` (or add to same project with `environment: 'edge-functions'`)
3. Configure alert rule in Sentry: "When an error in project `lecolpo-mobile` or `lecolpo-edge-functions` has `level: fatal`, notify: immediately" — this is the high-priority alert for scoring engine errors (AR10)

If Sentry account is not yet set up, the implementation should use a placeholder DSN (`''`) so the app does not crash, and `enabled: false` in non-production. The CI/CD pipeline works independently of Sentry.

### Testing Approach

Since `@sentry/react-native` does real network calls, mock it in tests:

```typescript
// In jest.config.js moduleNameMapper or jest.setup.js:
jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => children,
  captureException: jest.fn(),
  withScope: jest.fn((cb) => cb({ setContext: jest.fn(), setLevel: jest.fn() })),
}));
```

Test the error boundary behaviour:
```typescript
// apps/mobile/src/lib/sentry.test.ts
import { Sentry } from './sentry';

describe('Sentry init', () => {
  it('exports a Sentry object', () => {
    expect(Sentry).toBeDefined();
  });
  it('has init called', () => {
    // Init is called as side effect of module import
    const { init } = require('@sentry/react-native');
    expect(init).toHaveBeenCalled();
  });
});
```

For the Edge Function sentry helper, test in isolation (no Deno runtime needed — mock the import):
```typescript
// apps/supabase/functions/_shared/sentry.test.ts (if running via deno test)
// OR test conceptually via type check + manual verification
```

**Note:** The CI workflow file itself cannot be unit-tested — validation is done by observing GitHub Actions run results. Include a comment in the story completion notes confirming the workflow structure is syntactically valid (use `actionlint` locally if available: `brew install actionlint && actionlint .github/workflows/ci.yml`).

### Architecture Compliance Requirements

Per AR10 and AR11:
- **Sentry mobile:** `@sentry/react-native` on mobile — DO NOT use `@sentry/browser` or plain `@sentry/core`
- **Sentry Edge Functions:** Sentry Deno SDK — NOT `@sentry/node`
- **Two Sentry environments:** `'production'` (and `'development'`) for mobile; `'edge-functions'` for Edge Functions — per AR10
- **Scoring engine errors = high-priority:** `captureHighPriority` with `level: 'fatal'` — per AR10 spec
- **CI sequence:** tests → migrations → functions → EAS — exact sequence from AR11; NO step may be reordered
- **PR builds:** Preview channel specifically (not production) — per AR11

### Known Infrastructure Constraints

- **Docker required for `supabase start`** (learned from Story 1.3): `supabase db push` in CI uses the hosted Supabase project, not local Docker — this is correct for production CI
- **`pnpm --frozen-lockfile`** — use in CI to prevent unexpected upgrades
- **Node 20 LTS** — use for GitHub Actions environment (compatible with Expo EAS)
- **Expo EAS requires `eas.json`** — the file must exist in `apps/mobile/` before EAS builds can run
- **`--passWithNoTests` flag** — Jest will exit with code 1 if no test files found; needed if test discovery is limited in CI environments
- **`--forceExit`** — prevents Jest from hanging on open handles (Supabase client may hold open connections in test env)

### Previous Story Intelligence (Story 1.4)

**Key learnings:**
- Jest 29.7.0 required — do NOT upgrade to Jest 30 (`jest-expo` incompatibility)
- `transformIgnorePatterns` configured for pnpm `.pnpm` symlink structure in `jest.config.js`
- Path alias `@/` maps to `apps/mobile/` root (configured in `tsconfig.json`)
- 39 tests currently passing across stores, Supabase singleton, and screen existence tests
- `expo-secure-store` plugin already in `app.config.ts`
- `app.json` deleted — `app.config.ts` is the sole Expo config
- `@lecolpo/types` workspace dependency already in `apps/mobile/package.json`
- Dark mode only — never reference light theme

**Existing `lib/` files (do NOT overwrite):**
- `src/lib/supabase.ts` — Supabase client singleton (Story 1.4)
- `src/lib/queryClient.ts` — QueryClient config (Story 1.4)
- `src/lib/fonts.ts` — font loading (Story 1.2)
- `src/lib/typography.ts` — typography scale (Story 1.2)

**`app/_layout.tsx` current structure (Story 1.4 version):**
- Wraps content in `QueryClientProvider`
- Registers Stack screens: `(tabs)`, `onboarding`, `catalog/[fixtureId]`, `microflow`
- Loads fonts via `useFonts` hook
- Uses `DarkTheme` via `constants/theme.ts`'s `NavigationTheme`
- Sentry error boundary wraps the outermost content — add it outside `QueryClientProvider`

### Scope Boundary

| Concern | Belongs To |
|---------|------------|
| Actual Sentry dashboard alert rules | Manual setup (pre-step, not code) |
| EAS credentials / signing certificates | Manual setup (Expo EAS project) |
| `run-scoring` calling `captureHighPriority` | Story 4.3 (Epic 4) |
| `ingest-events` / `ingest-odds` calling `captureException` | Stories 3.2, 3.3 (Epic 3) |
| Supabase Edge Function code beyond `_shared/sentry.ts` | Epic 3+ |

### Files to Create

```
.github/
  workflows/
    ci.yml                            ← NEW: CI/CD pipeline
apps/mobile/
  eas.json                            ← NEW: EAS build profiles (if not exists)
  src/
    lib/
      sentry.ts                       ← NEW: Sentry mobile init + export
      sentry.test.ts                  ← NEW: Sentry init test
apps/supabase/
  functions/
    _shared/
      sentry.ts                       ← NEW: Edge Function Sentry helper
```

### Files to Modify

```
apps/mobile/
  app.config.ts                       ← Add @sentry/react-native/expo plugin
  app/_layout.tsx                     ← Add Sentry.ErrorBoundary wrapper + import sentry.ts
  .env.local                          ← Add EXPO_PUBLIC_SENTRY_DSN placeholder
```

### Files NOT to Touch

- `packages/types/` — no changes
- `apps/supabase/migrations/` — no new migrations in this story
- `apps/mobile/tailwind.config.js` — no changes
- `apps/mobile/src/stores/` — no changes
- `apps/mobile/src/queries/` — no changes
- Any file created in Stories 1.1–1.4

### References

- [Source: epics.md#Story 1.5] — Full acceptance criteria
- [Source: architecture.md#Infrastructure & Deployment] — CI/CD sequence + Sentry setup
- [Source: architecture.md#AR10] — Sentry on mobile + Deno Edge Functions; high-priority scoring errors
- [Source: architecture.md#AR11] — GitHub Actions exact sequence; PR builds use Preview channel
- [Source: architecture.md#Process Patterns] — Logging rule: no console.log; console.error for caught errors; Sentry.captureException for alerting

## Dev Agent Record

### Agent Model Used

_To be filled by dev agent_

### Debug Log References

_None yet_

### Completion Notes List

_To be filled by dev agent_

## File List

_To be filled by dev agent_

## Change Log

| Date | Change |
|------|--------|
| 2026-05-06 | Story created — ready-for-dev |

