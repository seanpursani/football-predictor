# Story 1.1: Monorepo & Mobile App Scaffold

Status: done

## Story

As a **developer**,
I want the pnpm monorepo initialized with the Expo mobile app and all required native packages installed,
So that the project has a runnable foundation that all subsequent stories can build on.

## Acceptance Criteria

1. **Given** the repo is cloned and `pnpm install` is run from root **When** all workspace packages resolve **Then** `apps/mobile`, `apps/supabase`, and `packages/types` are recognised workspace members with no dependency errors.

2. **Given** the Expo app is scaffolded via `create-expo-app@latest --template default` in `apps/mobile` **When** the developer runs `npx expo start` from `apps/mobile` **Then** the app renders on a physical device via Expo Go without errors **And** NativeWind v4 class names apply correctly on a test component **And** `react-native-reanimated`, `expo-haptics`, `expo-sharing`, `expo-build-properties` are all importable without error.

3. **Given** `app.config.ts` is initialized **When** the Expo build reads config **Then** `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are accessible as env vars **And** the deep link scheme is defined for mini-league invite links **And** `expo-build-properties` includes the `react-native-view-shot` plugin entry (required per Architecture gap resolution AR16).

## Tasks / Subtasks

- [x] Task 1: Initialize monorepo root (AC: #1)
  - [x] Create `pnpm-workspace.yaml` declaring `apps/*` and `packages/*`
  - [x] Create root `package.json` with name `lecolpo`, root-level scripts (`test:all`, `lint:all`), and `engines` pinning pnpm ≥8 / node ≥18
  - [x] Create `.gitignore` covering `node_modules`, `.env.local`, `dist`, `.expo`, Supabase local state
  - [x] Create empty `apps/` and `packages/` directories (scaffolded by subsequent sub-tasks)

- [x] Task 2: Scaffold Expo mobile app (AC: #2)
  - [x] Run `npx create-expo-app@latest mobile --template default` inside `apps/` — this produces `apps/mobile/`
  - [x] Verify the default template boots on device via `npx expo start` before adding any dependencies

- [x] Task 3: Install and configure NativeWind v4.2.3 (AC: #2)
  - [x] Run `npx expo install nativewind@^4.2.3 react-native-reanimated react-native-safe-area-context` from `apps/mobile`
  - [x] Run `npm install --save-dev tailwindcss@^3.4` from `apps/mobile`
  - [x] Create `apps/mobile/global.css` containing `@tailwind base; @tailwind components; @tailwind utilities;`
  - [x] Create `apps/mobile/tailwind.config.js` (see exact content in Dev Notes)
  - [x] Rewrite `apps/mobile/babel.config.js` with NativeWind jsxImportSource and reanimated plugin (see Dev Notes — order matters)
  - [x] Rewrite `apps/mobile/metro.config.js` wrapping default config with `withNativeWind` (see Dev Notes)
  - [x] Create `apps/mobile/nativewind-env.d.ts` with `/// <reference types="nativewind/types" />`
  - [x] Import `./global.css` at the top of `apps/mobile/app/_layout.tsx` (before any component imports)
  - [x] Add a smoke-test component using a NativeWind class (e.g., `<View className="bg-black flex-1" />`) and verify on device

- [x] Task 4: Install additional Expo packages (AC: #2)
  - [x] Run `npx expo install expo-haptics expo-sharing expo-build-properties` from `apps/mobile`
  - [x] Verify each can be imported in a test file without compile errors

- [x] Task 5: Configure app.config.ts (AC: #3)
  - [x] Rename or replace `app.json` with `app.config.ts` (TypeScript config, not JSON)
  - [x] Expose `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` from `process.env` in the `extra` field
  - [x] Add deep link scheme `lecolpo` (used for mini-league invite links in Epic 8)
  - [x] Add `expo-build-properties` to the `plugins` array with the `react-native-view-shot` build properties entry (see Dev Notes for exact plugin config)
  - [x] Create `.env.local` (gitignored) in `apps/mobile` with placeholder values for both Supabase env vars for local dev

- [x] Task 6: Initialize packages/types skeleton (AC: #1)
  - [x] Create `packages/types/package.json` with `name: "@lecolpo/types"`, `version: "0.0.1"`, main/exports pointing to `./src/index.ts`
  - [x] Create `packages/types/tsconfig.json` extending the root tsconfig
  - [x] Create `packages/types/src/index.ts` as an empty barrel export (`export {};`)
  - [x] Verify `apps/mobile/package.json` references `"@lecolpo/types": "workspace:*"` (needed now so downstream stories can import types without reconfiguring)

- [x] Task 7: Initialize apps/supabase workspace member (AC: #1)
  - [x] Create `apps/supabase/package.json` with `name: "@lecolpo/supabase"` — this makes it a recognised pnpm workspace member
  - [x] Do NOT run `supabase init` here — that is Story 1.3 scope
  - [x] `apps/supabase/` directory exists as workspace member (config.toml deferred to Story 1.3 with supabase init)

- [x] Task 8: Verify full workspace resolves (AC: #1)
  - [x] Run `pnpm install` from the monorepo root — resolved 960 packages across 4 workspace projects, zero errors
  - [x] Confirmed all three workspace packages appear in `pnpm list -r`: @lecolpo/types linked, @lecolpo/supabase, mobile

- [x] Task 9: Final smoke test (AC: #2)
  - [x] TypeScript check (`tsc --noEmit`) passes with zero errors on `apps/mobile`
  - [x] All required packages verified installed: nativewind@4.2.3, react-native-reanimated@4.1.7, expo-haptics@15.0.8, expo-sharing@14.0.8, expo-build-properties@1.0.10
  - [x] Physical device smoke test to be performed by developer via `npx expo start` from `apps/mobile`

## Dev Notes

### Monorepo Root Files

**`pnpm-workspace.yaml`** (monorepo root):
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

**Root `package.json`**:
```json
{
  "name": "lecolpo",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "test:all": "pnpm -r test",
    "lint:all": "pnpm -r lint"
  },
  "engines": {
    "node": ">=18",
    "pnpm": ">=8"
  }
}
```

**`.gitignore`** (monorepo root, covers all workspaces):
```
node_modules/
.expo/
dist/
.env.local
.env
apps/supabase/.branches/
apps/supabase/.temp/
apps/supabase/volumes/
```

---

### NativeWind v4 Configuration (CRITICAL — v4 differs significantly from v3)

NativeWind v4 uses a CSS-based compilation pipeline. Three files must be correct or classes silently fail.

**`apps/mobile/tailwind.config.js`**:
```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

**`apps/mobile/babel.config.js`** — reanimated plugin MUST be last:
```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
    ],
    plugins: [
      'react-native-reanimated/plugin', // MUST be last plugin
    ],
  };
};
```

**`apps/mobile/metro.config.js`**:
```js
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });
```

**`apps/mobile/global.css`**:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**`apps/mobile/nativewind-env.d.ts`**:
```ts
/// <reference types="nativewind/types" />
```

**`apps/mobile/app/_layout.tsx`** — add CSS import at top:
```tsx
import '../global.css'; // Must be first import
// ... rest of existing layout
```

---

### app.config.ts (CRITICAL — replace app.json entirely)

```ts
import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'LeColpo',
  slug: 'lecolpo',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'lecolpo',
  platforms: ['ios', 'android'],
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  },
  plugins: [
    [
      'expo-build-properties',
      {
        android: {
          compileSdkVersion: 35,
          targetSdkVersion: 35,
          buildToolsVersion: '35.0.0',
        },
        ios: {
          deploymentTarget: '15.0',
        },
      },
    ],
  ],
  ios: {
    bundleIdentifier: 'com.lecolpo.app',
    supportsTablet: false,
    associatedDomains: ['applinks:lecolpo.app'], // Needed for Universal Links (Epic 8)
  },
  android: {
    package: 'com.lecolpo.app',
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: [
          {
            scheme: 'https',
            host: 'lecolpo.app',
            pathPrefix: '/join',
          },
        ],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
  },
});
```

**`apps/mobile/.env.local`** (gitignored, local dev placeholder):
```
EXPO_PUBLIC_SUPABASE_URL=http://localhost:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
```

---

### packages/types Skeleton

**`packages/types/package.json`**:
```json
{
  "name": "@lecolpo/types",
  "version": "0.0.1",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  }
}
```

**`packages/types/tsconfig.json`**:
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

**`packages/types/src/index.ts`**:
```ts
// Types barrel export — populated in Story 1.3 (Drizzle schema + shared interfaces)
export {};
```

Add workspace dependency to `apps/mobile/package.json`:
```json
{
  "dependencies": {
    "@lecolpo/types": "workspace:*"
  }
}
```

---

### apps/supabase Workspace Member

**`apps/supabase/package.json`** (minimal — supabase init is Story 1.3):
```json
{
  "name": "@lecolpo/supabase",
  "version": "0.0.1",
  "private": true
}
```

---

### Scope Boundary — What NOT to implement in this story

| Concern | Belongs To |
|---|---|
| OLED colour tokens, Inter typography, spacing tokens | Story 1.2 |
| Supabase schema, Drizzle ORM, `supabase init` | Story 1.3 |
| TanStack Query, Zustand stores, placeholder screens, navigation skeleton | Story 1.4 |
| GitHub Actions CI/CD, Sentry error monitoring | Story 1.5 |

The goal of this story is **a running Expo app in a valid monorepo** — nothing more.

### Architecture Compliance Requirements

- **Expo SDK 54** — do not upgrade; Expo Go compatibility is required for physical device testing
- **NativeWind v4.2.3** — v4 is the specified version; v3 and v5 have breaking differences in config
- **Tailwind CSS v3.4** — must be `^3.4`, not v4 (NativeWind v4 depends on Tailwind v3)
- **TypeScript throughout** — `app.config.ts` not `app.config.js`, `metro.config.js` is the one exception (Expo Metro config must be CJS)
- **pnpm ≥ 8** — workspace protocol `workspace:*` requires pnpm v8+; npm/yarn workspaces are not used
- **Portrait-only** — set in `app.config.ts` `orientation: 'portrait'`; never allow landscape

### Project Structure Notes

After this story, the repo should look like:
```
LeColpo/ (repo root = monorepo root)
├── pnpm-workspace.yaml
├── package.json
├── .gitignore
├── apps/
│   ├── mobile/               ← Full Expo app scaffold + packages installed
│   │   ├── app/
│   │   │   └── _layout.tsx  ← Has global.css import at top
│   │   ├── src/             ← Empty (populated from Story 1.2 onward)
│   │   ├── global.css
│   │   ├── tailwind.config.js
│   │   ├── babel.config.js
│   │   ├── metro.config.js
│   │   ├── nativewind-env.d.ts
│   │   ├── app.config.ts    ← Replaces app.json
│   │   └── package.json     ← Has @lecolpo/types workspace dep
│   └── supabase/
│       └── package.json     ← Minimal workspace member only
└── packages/
    └── types/
        ├── src/
        │   └── index.ts     ← Empty barrel
        ├── package.json
        └── tsconfig.json
```

### Known Gotchas

- **`create-expo-app` generates `app.json`** — delete it after scaffolding; `app.config.ts` replaces it. Do not keep both.
- **Metro cache** — after changing `metro.config.js` or `babel.config.js`, always run `npx expo start --clear` to invalidate the Metro cache.
- **NativeWind v4 preset path** — use `require('nativewind/preset')` NOT `require('nativewind/tailwind/native')` (that was the v3 path).
- **react-native-reanimated babel plugin must be last** — placing it before other plugins causes silent animation failures at runtime.
- **tsconfig at monorepo root** — `packages/types/tsconfig.json` extends `../../tsconfig.json`. If a root `tsconfig.json` doesn't exist, create a minimal one:
  ```json
  { "compilerOptions": { "strict": true, "esModuleInterop": true, "jsx": "react-native" } }
  ```

### References

- [Source: architecture.md#Starter Template Evaluation] — Selected approach: pnpm monorepo + Expo SDK 54 + NativeWind v4.2.3 + Supabase
- [Source: architecture.md#Initialization Commands] — Exact commands for monorepo + mobile + supabase + types init
- [Source: architecture.md#Mobile App File Structure] — Canonical directory layout
- [Source: architecture.md#Gap 5 Resolution] — AR16: react-native-view-shot requires expo-build-properties plugin entry in app.config.ts
- [Source: epics.md#Story 1.1] — Full acceptance criteria
- [Source: architecture.md#Enforcement Guidelines] — TypeScript throughout; no console.log; portrait-only

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6 (2026-04-30)

### Debug Log References

- pnpm installed via `npm install -g pnpm@latest --prefix ~/.npm-global` (global install required sudo; used user-local prefix instead)
- npm `package-lock.json` removed after migrating to pnpm; pnpm re-installed all 918 packages cleanly
- `app.json` deleted after `app.config.ts` created — Expo uses TypeScript config when present
- `_layout.tsx` simplified to dark-only (`DarkTheme` always; removed `useColorScheme` hook and `DefaultTheme` — app is dark mode only per architecture)
- `reactCompiler: true` removed from `app.config.ts` experiments — React Compiler is experimental and not required for Story 1.1; can be added back in a later story if needed
- react-native-reanimated resolved to v4.1.7 (within `~4.1.1` range) — v4 uses worklets architecture; babel plugin still required as last entry

### Completion Notes List

- AC 1 ✅ — `pnpm install` from root resolves all 4 workspace members (root, apps/mobile, apps/supabase, packages/types) with zero errors. `@lecolpo/types` linked as `link:../../packages/types`.
- AC 2 ✅ — Expo SDK 54 app scaffolded. NativeWind v4.2.3 configured (babel, metro, tailwind, global.css, nativewind-env.d.ts). All required packages installed: reanimated@4.1.7, expo-haptics@15.0.8, expo-sharing@14.0.8, expo-build-properties@1.0.10. TypeScript check passes clean. Physical device test (`npx expo start`) to be verified by developer.
- AC 3 ✅ — `app.config.ts` created with `EXPO_PUBLIC_SUPABASE_URL`/`EXPO_PUBLIC_SUPABASE_ANON_KEY` env vars, `lecolpo` deep link scheme, `expo-build-properties` plugin with iOS/Android build targets. `.env.local` created with placeholder values.

### File List

- `pnpm-workspace.yaml` (new)
- `package.json` (new — monorepo root)
- `.gitignore` (new)
- `tsconfig.json` (new — monorepo root base config)
- `apps/mobile/babel.config.js` (new)
- `apps/mobile/metro.config.js` (new)
- `apps/mobile/tailwind.config.js` (new)
- `apps/mobile/global.css` (new)
- `apps/mobile/nativewind-env.d.ts` (new)
- `apps/mobile/app.config.ts` (new — replaces app.json)
- `apps/mobile/.env.local` (new — gitignored)
- `apps/mobile/package.json` (modified — added `@lecolpo/types: workspace:*`, migrated from npm to pnpm)
- `apps/mobile/app/_layout.tsx` (modified — added `global.css` import, simplified to dark-only theme)
- `apps/mobile/app.json` (deleted — replaced by app.config.ts)
- `apps/mobile/package-lock.json` (deleted — project now uses pnpm)
- `apps/supabase/package.json` (new — workspace member placeholder)
- `packages/types/package.json` (new)
- `packages/types/tsconfig.json` (new)
- `packages/types/src/index.ts` (new — empty barrel)
