import {act, renderHook, waitFor} from '@testing-library/react-native';
import React from 'react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {
    useUpdateDisplayNameMutation,
    useUpdatePushTokenMutation,
    useUpsertUserMutation,
    useUserQuery
} from './useUserQuery';

const mockFrom = jest.fn();
const mockUpsert = jest.fn().mockResolvedValue({error: null});
const mockUpdate = jest.fn();
const mockEqUpdate = jest.fn().mockResolvedValue({error: null});
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();

jest.mock('../lib/supabase', () => ({
    supabase: {
        from: (...args: unknown[]) => {
            mockFrom(...args);
            return {
                select: (...a: unknown[]) => {
                    mockSelect(...a);
                    return {
                        eq: (...b: unknown[]) => {
                            mockEq(...b);
                            return {single: mockSingle};
                        }
                    };
                },
                upsert: mockUpsert,
                update: (...a: unknown[]) => {
                    mockUpdate(...a);
                    return {eq: mockEqUpdate};
                },
            };
        },
    },
}));

jest.mock('../lib/queryClient', () => {
    const {QueryClient} = require('@tanstack/react-query');
    const qc = new QueryClient();
    qc.invalidateQueries = jest.fn().mockResolvedValue(undefined);
    return {queryClient: qc};
});

function wrapper({children}: { children: React.ReactNode }) {
    const client = new QueryClient({defaultOptions: {queries: {retry: false}}});
    return React.createElement(QueryClientProvider, {client}, children);
}

describe('useUpsertUserMutation', () => {
    it('calls supabase.from(users).upsert with auth_id', async () => {
        const {result} = renderHook(() => useUpsertUserMutation(), {wrapper});
        await act(async () => {
            result.current.mutate('user-abc');
        });
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(mockUpsert).toHaveBeenCalledWith(
            {auth_id: 'user-abc'},
            expect.objectContaining({onConflict: 'auth_id'}),
        );
    });
});

describe('useUserQuery', () => {
    it('does not run when authId is null', () => {
        const {result} = renderHook(() => useUserQuery(null), {wrapper});
        expect(result.current.fetchStatus).toBe('idle');
    });
});

describe('useUpdateDisplayNameMutation', () => {
    beforeEach(() => {
        mockFrom.mockClear();
        mockUpdate.mockClear();
        mockEqUpdate.mockClear();
    });

    it('calls supabase.from(users).update().eq() with correct args', async () => {
        const {result} = renderHook(() => useUpdateDisplayNameMutation(), {wrapper});
        await act(async () => {
            result.current.mutate({authId: 'test-auth-id', displayName: 'TestUser'});
        });
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(mockFrom).toHaveBeenCalledWith('users');
        expect(mockUpdate).toHaveBeenCalledWith({display_name: 'TestUser'});
        expect(mockEqUpdate).toHaveBeenCalledWith('auth_id', 'test-auth-id');
    });

    it('calls invalidateQueries with correct key on success', async () => {
        const {queryClient} = require('../lib/queryClient');
        const {result} = renderHook(() => useUpdateDisplayNameMutation(), {wrapper});
        await act(async () => {
            result.current.mutate({authId: 'test-auth-id', displayName: 'TestUser'});
        });
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(queryClient.invalidateQueries).toHaveBeenCalledWith({queryKey: ['user', 'test-auth-id']});
    });

    it('propagates error when supabase returns error', async () => {
        mockEqUpdate.mockResolvedValueOnce({error: {message: 'DB error'}});
        const {result} = renderHook(() => useUpdateDisplayNameMutation(), {wrapper});
        await act(async () => {
            result.current.mutate({authId: 'test-auth-id', displayName: 'SomeName'});
        });
        await waitFor(() => expect(result.current.isError).toBe(true));
    });
});

describe('useUpdatePushTokenMutation', () => {
    beforeEach(() => {
        mockFrom.mockClear();
        mockUpdate.mockClear();
        mockEqUpdate.mockClear();
        mockEqUpdate.mockResolvedValue({error: null});
    });

    it('calls supabase.from(users).update().eq() with push_token string', async () => {
        const {result} = renderHook(() => useUpdatePushTokenMutation(), {wrapper});
        await act(async () => {
            result.current.mutate({authId: 'test-auth-id', pushToken: 'ExponentPushToken[test]'});
        });
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(mockFrom).toHaveBeenCalledWith('users');
        expect(mockUpdate).toHaveBeenCalledWith({push_token: 'ExponentPushToken[test]'});
        expect(mockEqUpdate).toHaveBeenCalledWith('auth_id', 'test-auth-id');
    });

    it('calls update with null to clear push token', async () => {
        const {result} = renderHook(() => useUpdatePushTokenMutation(), {wrapper});
        await act(async () => {
            result.current.mutate({authId: 'test-auth-id', pushToken: null});
        });
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(mockUpdate).toHaveBeenCalledWith({push_token: null});
    });

    it('calls invalidateQueries with correct key on success', async () => {
        const {queryClient} = require('../lib/queryClient');
        const {result} = renderHook(() => useUpdatePushTokenMutation(), {wrapper});
        await act(async () => {
            result.current.mutate({authId: 'test-auth-id', pushToken: 'ExponentPushToken[test]'});
        });
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(queryClient.invalidateQueries).toHaveBeenCalledWith({queryKey: ['user', 'test-auth-id']});
    });
});

