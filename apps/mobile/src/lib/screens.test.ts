import * as fs from 'fs';
import * as path from 'path';

// Mock supabase so screens that import it don't fail in Node
jest.mock('@/src/lib/supabase', () => ({
  supabase: { from: jest.fn(), auth: { onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })) } },
}));

jest.mock('@/src/hooks/useAuthState', () => ({
  useAuthState: () => ({ session: null, user: null, isLoading: false }),
}));

jest.mock('@/src/queries/useUserQuery', () => ({
  useUserQuery: () => ({ data: null, isLoading: false }),
  useUpdateDisplayNameMutation: () => ({ mutate: jest.fn(), isPending: false, error: null }),
  useUpsertUserMutation: () => ({ mutate: jest.fn() }),
}));

jest.mock('expo-router', () => ({
  Redirect: () => null,
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useLocalSearchParams: () => ({}),
  Stack: { Screen: () => null },
  Tabs: { Screen: () => null },
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const appDir = path.resolve(__dirname, '../../app');

const expectedScreens = [
  '(tabs)/build.tsx',
  '(tabs)/moments.tsx',
  '(tabs)/leagues.tsx',
  '(tabs)/profile.tsx',
  'catalog/[fixtureId].tsx',
  'microflow/_layout.tsx',
  'microflow/player.tsx',
  'microflow/timing.tsx',
  'onboarding.tsx',
];

describe('Screen files', () => {
  it.each(expectedScreens)('%s exists and exports a default component', (screenPath) => {
    const fullPath = path.join(appDir, screenPath);
    expect(fs.existsSync(fullPath)).toBe(true);

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require(path.join(appDir, screenPath));
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe('function');
  });
});

