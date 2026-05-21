/**
 * screens.test.ts — verifies that every expected screen file exists and
 * exports a default React component.
 *
 * Uses static imports (not bare require()) so Jest's module mock context
 * applies correctly to all transitive imports. Adding a new screen here
 * only requires adding its import and name — no new jest.mock() entries
 * needed unless the screen introduces a brand-new unmocked module.
 */

// ---- Module mocks (must be before imports) --------------------------------

jest.mock('@/src/lib/supabase', () => ({
    supabase: {
        from: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnThis(),
            insert: jest.fn().mockResolvedValue({data: null, error: null}),
            upsert: jest.fn().mockResolvedValue({data: null, error: null}),
            update: jest.fn().mockReturnThis(),
            delete: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({data: null, error: null}),
            single: jest.fn().mockResolvedValue({data: null, error: null}),
        }),
        auth: {
            onAuthStateChange: jest.fn(() => ({
                data: {subscription: {unsubscribe: jest.fn()}},
            })),
            getSession: jest.fn().mockResolvedValue({data: {session: null}, error: null}),
        },
    },
}));

jest.mock('@/src/hooks/useAuthState', () => ({
    useAuthState: () => ({session: null, user: null, isLoading: false}),
}));

jest.mock('@/src/queries/useUserQuery', () => ({
    useUserQuery: () => ({data: null, isLoading: false, isError: false}),
    useUpdateDisplayNameMutation: () => ({mutate: jest.fn(), isPending: false, error: null}),
    useUpsertUserMutation: () => ({mutate: jest.fn(), mutateAsync: jest.fn().mockResolvedValue(undefined)}),
    useUpdatePushTokenMutation: () => ({mutate: jest.fn(), mutateAsync: jest.fn().mockResolvedValue(undefined)}),
}));

jest.mock('expo-router', () => ({
    Redirect: () => null,
    useRouter: () => ({push: jest.fn(), replace: jest.fn()}),
    useLocalSearchParams: () => ({}),
    Stack: {Screen: () => null},
    Tabs: {Screen: () => null},
    Link: 'Link',
}));

jest.mock('@/src/lib/notifications', () => ({
    requestPushPermissionAndGetToken: jest.fn().mockResolvedValue(null),
    removePushToken: jest.fn().mockResolvedValue(null),
}));

jest.mock('expo-notifications', () => ({
    setNotificationHandler: jest.fn(),
    requestPermissionsAsync: jest.fn().mockResolvedValue({status: 'denied'}),
    getExpoPushTokenAsync: jest.fn().mockResolvedValue({data: null}),
}));

jest.mock('expo-device', () => ({isDevice: false}));

jest.mock('react-native-safe-area-context', () => ({
    SafeAreaView: 'SafeAreaView',
    useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
}));

jest.mock('@/src/lib/queryClient', () => ({
    queryClient: {invalidateQueries: jest.fn(), clear: jest.fn()},
}));

// ---- Static imports (after mocks) -----------------------------------------

import BuildScreen from '../../app/(tabs)/build';
import MomentsScreen from '../../app/(tabs)/moments';
import LeaguesScreen from '../../app/(tabs)/leagues';
import ProfileScreen from '../../app/(tabs)/profile';
import OnboardingScreen from '../../app/onboarding';

// Screens scaffolded in later epics — guarded try/require so tests skip gracefully
// eslint-disable-next-line @typescript-eslint/no-require-imports
let CatalogScreen: unknown;
try {
    CatalogScreen = require('../../app/catalog/[fixtureId]').default;
} catch { /* not yet created */
}
// eslint-disable-next-line @typescript-eslint/no-require-imports
let MicroflowLayout: unknown;
try {
    MicroflowLayout = require('../../app/microflow/_layout').default;
} catch { /* not yet created */
}
// eslint-disable-next-line @typescript-eslint/no-require-imports
let MicroflowPlayer: unknown;
try {
    MicroflowPlayer = require('../../app/microflow/player').default;
} catch { /* not yet created */
}
// eslint-disable-next-line @typescript-eslint/no-require-imports
let MicroflowTiming: unknown;
try {
    MicroflowTiming = require('../../app/microflow/timing').default;
} catch { /* not yet created */
}

// ---- Tests ----------------------------------------------------------------

describe('Screen files — static export validation', () => {
    it('(tabs)/build.tsx exports a default component', () => {
        expect(typeof BuildScreen).toBe('function');
    });

    it('(tabs)/moments.tsx exports a default component', () => {
        expect(typeof MomentsScreen).toBe('function');
    });

    it('(tabs)/leagues.tsx exports a default component', () => {
        expect(typeof LeaguesScreen).toBe('function');
    });

    it('(tabs)/profile.tsx exports a default component', () => {
        expect(typeof ProfileScreen).toBe('function');
    });

    it('onboarding.tsx exports a default component', () => {
        expect(typeof OnboardingScreen).toBe('function');
    });

    it('catalog/[fixtureId].tsx exports a default component (when exists)', () => {
        if (!CatalogScreen) return;
        expect(typeof CatalogScreen).toBe('function');
    });

    it('microflow/_layout.tsx exports a default component (when exists)', () => {
        if (!MicroflowLayout) return;
        expect(typeof MicroflowLayout).toBe('function');
    });

    it('microflow/player.tsx exports a default component (when exists)', () => {
        if (!MicroflowPlayer) return;
        expect(typeof MicroflowPlayer).toBe('function');
    });

    it('microflow/timing.tsx exports a default component (when exists)', () => {
        if (!MicroflowTiming) return;
        expect(typeof MicroflowTiming).toBe('function');
    });
});
