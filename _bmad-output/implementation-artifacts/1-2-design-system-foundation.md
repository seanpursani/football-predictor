# Story 1.2: Design System Foundation

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer**,
I want the OLED Sharp colour palette, Inter typography scale, and 8px spacing system defined as Tailwind tokens,
So that all components reference a single source of truth for colours, type, and spacing — never hardcoded values.

## Acceptance Criteria

1. **Given** `tailwind.config.js` is configured with NativeWind's React Native preset **When** a component uses colour token classes **Then** `bg-primary` → `#080808`, `bg-surface` → `#141414`, `bg-elevated` → `#1C1C1C` **And** `accent` / `success` → `#B4FF32`, `jackpot` / `captain` → `#FFD700`, `deadline` → `#FF6B35`, `streak` → `#A78BFA`, `miss` → `#303030` **And** all semantic colour tokens from UX-DR1 are defined and named exactly as specified.

2. **Given** Inter is loaded via `@expo-google-fonts/inter` **When** the app renders **Then** all seven type scale variants are available: display (32px/700), heading-1 (24px/700), heading-2 (18px/600), body (15px/400), label (13px/500), caption (11px/400), mono-number (20px/700) **And** `fontVariant: ['tabular-nums']` is applied to the mono-number variant **And** a system font fallback (SF Pro / Roboto) renders during Inter load.

3. **Given** spacing and radius tokens are defined per UX-DR3 **When** a component applies them **Then** space-1 (4px) through space-8 (48px) resolve correctly **And** radius-sm (4px), radius-md (6px), radius-lg (8px), radius-full (9999px) are available.

## Tasks / Subtasks

- [x] Task 1: Extend `tailwind.config.js` with OLED Sharp colour tokens (AC: #1)
  - [x] Add `colors.bg.primary` (`#080808`), `colors.bg.surface` (`#141414`), `colors.bg.elevated` (`#1C1C1C`)
  - [x] Add `colors.text.primary` (`#FFFFFF`), `colors.text.secondary` (`#7A7A7A`), `colors.text.muted` (`#404040`)
  - [x] Add `colors.border.subtle` (`#1E1E1E`), `colors.border.active` (`#B4FF32`)
  - [x] Add semantic colours: `colors.accent` (`#B4FF32`), `colors.success` (`#B4FF32`), `colors.jackpot` (`#FFD700`), `colors.captain` (`#FFD700`), `colors.deadline` (`#FF6B35`), `colors.streak` (`#A78BFA`), `colors.miss` (`#303030`)
  - [x] Verify: `className="bg-primary"` renders `#080808`, `className="text-accent"` renders `#B4FF32`

- [x] Task 2: Define spacing tokens in `tailwind.config.js` (AC: #3)
  - [x] Add spacing: `space-1` (4px), `space-2` (8px), `space-3` (12px), `space-4` (16px), `space-5` (24px), `space-6` (32px), `space-8` (48px)
  - [x] Add border radius: `radius-sm` (4), `radius-md` (6), `radius-lg` (8), `radius-full` (9999)
  - [x] Note: Tailwind values are unitless (interpreted as px by NativeWind); use numeric values not strings

- [x] Task 3: Install and load Inter font via `@expo-google-fonts/inter` (AC: #2)
  - [x] Run `npx expo install @expo-google-fonts/inter expo-font` from `apps/mobile`
  - [x] Create `src/lib/fonts.ts` — export font map object with all 7 required weights/styles
  - [x] Load fonts in `app/_layout.tsx` using `useFonts` hook from `expo-font`
  - [x] Show splash screen while fonts load (`expo-splash-screen` — already installed)
  - [x] Provide system font fallback: fonts render as SF Pro (iOS) / Roboto (Android) until Inter loads

- [x] Task 4: Create typography scale utility (AC: #2)
  - [x] Create `src/lib/typography.ts` with named style objects for all 7 variants
  - [x] Display: `{ fontFamily: 'Inter_700Bold', fontSize: 32, lineHeight: 38 }`
  - [x] Heading1: `{ fontFamily: 'Inter_700Bold', fontSize: 24, lineHeight: 30 }`
  - [x] Heading2: `{ fontFamily: 'Inter_600SemiBold', fontSize: 18, lineHeight: 24 }`
  - [x] Body: `{ fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 22 }`
  - [x] Label: `{ fontFamily: 'Inter_500Medium', fontSize: 13, lineHeight: 18 }`
  - [x] Caption: `{ fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16 }`
  - [x] MonoNumber: `{ fontFamily: 'Inter_700Bold', fontSize: 20, lineHeight: 24, fontVariant: ['tabular-nums'] }`
  - [x] Also define corresponding Tailwind `fontFamily` entries in `tailwind.config.js` so `className="font-inter-bold"` works

- [x] Task 5: Update `constants/theme.ts` to OLED Sharp palette (AC: #1)
  - [x] Replace existing `Colors` export with OLED Sharp tokens for programmatic access (e.g. React Navigation theme)
  - [x] Remove light theme — dark mode only per architecture
  - [x] Export colour constants matching Tailwind tokens for use in non-className contexts (e.g. `react-native-reanimated` colour values, `StatusBar` style)

- [x] Task 6: Create smoke-test screen verifying tokens render correctly (AC: #1, #2, #3)
  - [x] Add a temporary dev-only section in `app/(tabs)/index.tsx` (or existing explore tab)
  - [x] Render: bg-primary, bg-surface, bg-elevated backgrounds; text-primary, text-accent, text-deadline text colours
  - [x] Render: all 7 typography variants with their names
  - [x] Render: spacing boxes at space-2, space-4, space-6 with visible borders
  - [x] This is a dev verification screen — can be removed after visual confirmation

## Dev Notes

### Tailwind Config — Exact Token Structure

The `theme.extend` in `tailwind.config.js` must use this structure so NativeWind generates the correct utility classes:

```js
theme: {
  extend: {
    colors: {
      bg: {
        primary: '#080808',
        surface: '#141414',
        elevated: '#1C1C1C',
      },
      text: {
        primary: '#FFFFFF',
        secondary: '#7A7A7A',
        muted: '#404040',
      },
      border: {
        subtle: '#1E1E1E',
        active: '#B4FF32',
      },
      accent: '#B4FF32',
      success: '#B4FF32',
      jackpot: '#FFD700',
      captain: '#FFD700',
      deadline: '#FF6B35',
      streak: '#A78BFA',
      miss: '#303030',
    },
    spacing: {
      'space-1': '4px',
      'space-2': '8px',
      'space-3': '12px',
      'space-4': '16px',
      'space-5': '24px',
      'space-6': '32px',
      'space-8': '48px',
    },
    borderRadius: {
      'radius-sm': '4px',
      'radius-md': '6px',
      'radius-lg': '8px',
      'radius-full': '9999px',
    },
    fontFamily: {
      'inter-regular': ['Inter_400Regular'],
      'inter-medium': ['Inter_500Medium'],
      'inter-semibold': ['Inter_600SemiBold'],
      'inter-bold': ['Inter_700Bold'],
    },
  },
},
```

**CRITICAL NativeWind note:** NativeWind v4 processes Tailwind config through its CSS compiler. Custom colour keys under `bg`, `text`, `border` become usable as `bg-bg-primary`, `text-text-primary`, `border-border-subtle`. To avoid double-prefix (`bg-bg-primary`), consider flattening — BUT the UX spec uses these as named tokens. Recommended approach: use flat colour names and apply them with the appropriate utility prefix. E.g.:

```js
colors: {
  primary: '#080808',      // bg-primary, text-primary (context determines meaning)
  surface: '#141414',      // bg-surface
  elevated: '#1C1C1C',     // bg-elevated
  'text-secondary': '#7A7A7A',  // text-text-secondary
  'text-muted': '#404040',      // text-text-muted
  'border-subtle': '#1E1E1E',   // border-border-subtle
  'border-active': '#B4FF32',   // border-border-active
  accent: '#B4FF32',
  success: '#B4FF32',
  jackpot: '#FFD700',
  captain: '#FFD700',
  deadline: '#FF6B35',
  streak: '#A78BFA',
  miss: '#303030',
}
```

**The dev agent must test that the chosen structure produces the correct utility classes.** Run the app and verify `bg-primary` renders `#080808` — not a Tailwind default. If `bg-primary` collides with Tailwind's built-in `primary` colour, use a different key name or disable Tailwind defaults for that key. NativeWind v4 does NOT include Tailwind's default colour palette when using the `nativewind/preset`, so collisions are unlikely.

### Inter Font Loading

`@expo-google-fonts/inter` exports named font variants. Required imports:

```ts
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
```

Load in `_layout.tsx`:
```tsx
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;
  // ... rest of layout
}
```

**Fallback behaviour:** Before fonts load, React Native renders the platform default (SF Pro on iOS, Roboto on Android). The splash screen covers this gap. No explicit fallback font configuration is needed — the system font is the automatic fallback.

### Typography File Pattern

`src/lib/typography.ts` exports style objects consumed via `style={Typography.display}`:

```ts
import { TextStyle } from 'react-native';

export const Typography = {
  display: { fontFamily: 'Inter_700Bold', fontSize: 32, lineHeight: 38 } as TextStyle,
  heading1: { fontFamily: 'Inter_700Bold', fontSize: 24, lineHeight: 30 } as TextStyle,
  heading2: { fontFamily: 'Inter_600SemiBold', fontSize: 18, lineHeight: 24 } as TextStyle,
  body: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 22 } as TextStyle,
  label: { fontFamily: 'Inter_500Medium', fontSize: 13, lineHeight: 18 } as TextStyle,
  caption: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16 } as TextStyle,
  monoNumber: { fontFamily: 'Inter_700Bold', fontSize: 20, lineHeight: 24, fontVariant: ['tabular-nums'] } as TextStyle,
} as const;
```

Components can use either Tailwind classes (`className="font-inter-bold text-[32px] leading-[38px]"`) or style objects (`style={Typography.display}`) depending on context. Style objects are necessary when `fontVariant` is needed (Tailwind CSS has no `fontVariant` utility).

### Project Structure Notes

Files created/modified in this story:

```
apps/mobile/
├── tailwind.config.js          ← Modified: colour, spacing, radius, fontFamily tokens
├── app/
│   └── _layout.tsx             ← Modified: add useFonts + SplashScreen font loading
├── src/
│   └── lib/
│       ├── fonts.ts            ← New: font map export (optional — can inline in _layout)
│       └── typography.ts       ← New: 7 named TextStyle objects
├── constants/
│   └── theme.ts                ← Modified: replace with OLED Sharp palette, remove light theme
```

**Do NOT touch:**
- `babel.config.js` — already correct from Story 1.1
- `metro.config.js` — already correct from Story 1.1
- `global.css` — no changes needed
- `nativewind-env.d.ts` — no changes needed

### Scope Boundary

| Concern | Belongs To |
|---|---|
| Supabase schema, Drizzle ORM | Story 1.3 |
| TanStack Query, Zustand, navigation skeleton | Story 1.4 |
| TypeBadge, GameweekHeader, FixtureCard components | Epic 5 |
| CI/CD, Sentry | Story 1.5 |

This story delivers **tokens and type scale only** — no UI components beyond the smoke test.

### Architecture Compliance Requirements

- **Dark mode only** — remove all light theme references from `constants/theme.ts`; no `useColorScheme` switching
- **NativeWind v4.2.3** — ensure Tailwind config works with v4 CSS compilation pipeline
- **Tailwind CSS v3.4** — already installed; config must be compatible with v3 (not v4)
- **No `console.log`** — per architecture enforcement guidelines
- **Co-located tests** — if adding any test, place as `*.test.ts` next to source
- **File naming** — utility files use `camelCase.ts`; component files use `PascalCase.tsx`
- **`src/` directory** — all new non-screen files go under `apps/mobile/src/`
- **Constants** — use `SCREAMING_SNAKE_CASE` for constant values if extracted to standalone constants

### Previous Story Intelligence (Story 1.1)

**Key learnings from Story 1.1:**
- `app.json` was deleted and replaced by `app.config.ts` — TypeScript config only
- `_layout.tsx` was simplified to dark-only (`DarkTheme` always, removed `useColorScheme`)
- NativeWind v4 uses `nativewind/preset` (NOT v3's `nativewind/tailwind/native`)
- Metro cache must be cleared after config changes: `npx expo start --clear`
- `react-native-reanimated` babel plugin must remain last in `babel.config.js`
- pnpm workspace resolution uses `workspace:*` protocol
- `@lecolpo/types` is already a workspace dependency of `apps/mobile`

**Files established in 1.1 that this story modifies:**
- `tailwind.config.js` — currently has empty `theme.extend: {}`; this story populates it
- `app/_layout.tsx` — currently imports `global.css` and uses `DarkTheme`; this story adds font loading
- `constants/theme.ts` — currently has light/dark theme boilerplate; must be replaced

### References

- [Source: epics.md#Story 1.2] — Full acceptance criteria
- [Source: architecture.md#Naming Patterns] — `camelCase` utility files, `PascalCase` components
- [Source: architecture.md#Mobile Architecture] — src/ directory structure
- [Source: architecture.md#Enforcement Guidelines] — No console.log, co-located tests
- [Source: ux-design-specification (via epics.md)] — UX-DR1 (colours), UX-DR2 (typography), UX-DR3 (spacing)

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4 (2026-05-05)

### Debug Log References

- Jest 30 incompatible with jest-expo/react-native ESM setup — downgraded to jest@29.7.0
- pnpm `.pnpm` symlink structure required custom `transformIgnorePatterns` regex

### Completion Notes List

- ✅ Task 1–2: Tailwind config extended with flat colour tokens (avoiding double-prefix), spacing, radius, fontFamily
- ✅ Task 3: Inter font installed via `@expo-google-fonts/inter`, loaded in `_layout.tsx` with SplashScreen gate
- ✅ Task 4: Typography scale utility created with all 7 variants including `monoNumber` with `tabular-nums`
- ✅ Task 5: `constants/theme.ts` replaced with OLED Sharp dark-only palette + `NavigationTheme` export
- ✅ Task 6: Smoke-test screen placed in `explore.tsx` tab with colour, typography, and spacing verification
- ✅ Fixed downstream consumers of old `Colors` shape: `collapsible.tsx`, `(tabs)/_layout.tsx`, `use-theme-color.ts`
- ✅ Jest test infrastructure set up (jest-expo preset, pnpm-compatible transform patterns)
- ✅ 15 tests passing (8 theme tests, 7 typography tests)

### File List

- `apps/mobile/tailwind.config.js` — Modified: colours, spacing, radius, fontFamily tokens
- `apps/mobile/app/_layout.tsx` — Modified: Inter font loading with useFonts + SplashScreen
- `apps/mobile/app/(tabs)/explore.tsx` — Modified: replaced with design system smoke-test screen
- `apps/mobile/app/(tabs)/_layout.tsx` — Modified: removed useColorScheme, use Colors.accent
- `apps/mobile/src/lib/fonts.ts` — New: font map export
- `apps/mobile/src/lib/typography.ts` — New: 7 named TextStyle objects
- `apps/mobile/src/lib/typography.test.ts` — New: 7 typography unit tests
- `apps/mobile/constants/theme.ts` — Modified: OLED Sharp dark-only palette + NavigationTheme
- `apps/mobile/constants/theme.test.ts` — New: 8 theme/colour unit tests
- `apps/mobile/hooks/use-theme-color.ts` — Modified: dark-only, removed light theme logic
- `apps/mobile/components/ui/collapsible.tsx` — Modified: removed useColorScheme, use Colors.text.secondary
- `apps/mobile/package.json` — Modified: added jest, jest-expo, test script, jest config
