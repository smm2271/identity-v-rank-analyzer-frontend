import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get, post } from './api';
import { useUserAuthStore } from './user_auth.service';

// Mock global fetch
const globalFetch = vi.fn();
window.fetch = globalFetch;

describe('API Fetcher Token Refresh Logic', () => {
    beforeEach(() => {
        // Reset state
        useUserAuthStore.getState().clearAuth();
        vi.clearAllMocks();
    });

    it('should retry original request with new token when 401 is encountered and refresh succeeds', async () => {
        // Initial token state
        useUserAuthStore.getState().setAccessToken('old-token', 'testuser');

        // Mock responses:
        // 1. Initial request -> 401 Unauthorized
        // 2. Refresh request -> 200 OK with new token
        // 3. Retry request -> 200 OK with success data
        
        globalFetch
            .mockResolvedValueOnce({
                ok: false,
                status: 401,
                json: async () => ({ detail: 'Token expired' }),
            } as Response)
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ access_token: 'new-token', user: { username: 'testuser' } }),
            } as Response)
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ data: 'success' }),
            } as Response);

        const result = await get<{ data: string }>('/test-endpoint');

        // Assertions
        expect(result.data).toBe('success');
        
        expect(globalFetch).toHaveBeenCalledTimes(3);

        // 1. Initial Call
        expect(globalFetch).toHaveBeenNthCalledWith(1, expect.stringContaining('/test-endpoint'), expect.objectContaining({
            method: 'GET'
        }));

        // 2. Refresh Call
        expect(globalFetch).toHaveBeenNthCalledWith(2, expect.stringContaining('/auth/refresh'), expect.objectContaining({
            method: 'POST'
        }));

        // 3. Retry Call
        expect(globalFetch).toHaveBeenNthCalledWith(3, expect.stringContaining('/test-endpoint'), expect.objectContaining({
            method: 'GET',
            headers: expect.any(Headers)
        }));

        // Verify the headers of the 3rd call to contain the new token
        const retryCallArgs = globalFetch.mock.calls[2];
        const retryHeaders = retryCallArgs[1].headers as Headers;
        expect(retryHeaders.get('Authorization')).toBe('Bearer new-token');

        // Verify store is updated
        expect(useUserAuthStore.getState().accessToken).toBe('new-token');
    });

    it('should clear auth state and throw error if refresh fails', async () => {
        useUserAuthStore.getState().setAccessToken('old-token', 'testuser');

        // Mock responses:
        // 1. Initial request -> 401 Unauthorized
        // 2. Refresh request -> 401 Unauthorized (refresh token expired)
        
        globalFetch
            .mockResolvedValueOnce({
                ok: false,
                status: 401,
                json: async () => ({ detail: 'Token expired' }),
            } as Response)
            .mockResolvedValueOnce({
                ok: false,
                status: 401,
                json: async () => ({ detail: 'Refresh token expired' }),
            } as Response);

        // Expect the original request to eventually throw ApiError (401 from the first request retry? Wait, if refresh fails, it returns the 401 response of the *first* request, and `handleResponse` throws ApiError).
        await expect(get('/test-endpoint')).rejects.toThrow('Token expired');

        expect(globalFetch).toHaveBeenCalledTimes(2); // No retry
        expect(useUserAuthStore.getState().accessToken).toBeNull();
        expect(useUserAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('should handle concurrent 401s without multiple refresh requests', async () => {
        useUserAuthStore.getState().setAccessToken('old-token', 'testuser');

        // Setup mock:
        // Both requests hit 401
        // Refresh request hits 200
        // Both retry requests hit 200
        
        let resolveRefresh: (res: any) => void;
        const refreshPromise = new Promise((resolve) => {
            resolveRefresh = resolve;
        });

        // Use custom mock implementation
        globalFetch.mockImplementation(async (url: string, init: any) => {
            if (url.includes('/auth/refresh')) {
                return {
                    ok: true,
                    status: 200,
                    json: async () => ({ access_token: 'new-token', user: { username: 'testuser' } }),
                };
            }
            if (init?.headers?.get?.('Authorization') === 'Bearer new-token') {
                return {
                    ok: true,
                    status: 200,
                    json: async () => ({ data: 'success' }),
                };
            }
            // initial requests
            return {
                ok: false,
                status: 401,
                json: async () => ({ detail: 'Token expired' }),
            };
        });

        // Trigger two parallel requests
        const req1 = get('/endpoint1');
        const req2 = get('/endpoint2');

        const [res1, res2] = await Promise.all([req1, req2]);

        // Assertions
        expect(res1).toEqual({ data: 'success' });
        expect(res2).toEqual({ data: 'success' });

        // We should have 5 fetch calls total:
        // 2x initial requests (401)
        // 1x refresh request (200) - Only one because it's parallel
        // 2x retry requests (200)
        expect(globalFetch).toHaveBeenCalledTimes(5);
        
        const refreshCalls = globalFetch.mock.calls.filter(call => call[0].includes('/auth/refresh'));
        expect(refreshCalls.length).toBe(1);
    });
});
