describe('Supabase client', () => {
    beforeEach(() => {
        jest.resetModules();
        process.env.EXPO_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    });

    afterEach(() => {
        delete process.env.EXPO_PUBLIC_SUPABASE_URL;
        delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    });

    it('exports a single supabase instance', () => {
        jest.mock('expo-secure-store', () => ({
            getItemAsync: jest.fn(),
            setItemAsync: jest.fn(),
            deleteItemAsync: jest.fn(),
        }));

        const {supabase} = require('./supabase');
        expect(supabase).toBeDefined();
        expect(typeof supabase.from).toBe('function');
        expect(typeof supabase.auth).toBe('object');
    });

    it('returns the same instance on multiple imports', () => {
        jest.mock('expo-secure-store', () => ({
            getItemAsync: jest.fn(),
            setItemAsync: jest.fn(),
            deleteItemAsync: jest.fn(),
        }));

        const {supabase: instance1} = require('./supabase');
        const {supabase: instance2} = require('./supabase');
        expect(instance1).toBe(instance2);
    });
});
