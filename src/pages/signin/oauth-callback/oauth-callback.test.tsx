import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import OAuthCallback from './oauth-callback';
import * as authService from '../../../service/auth.service';
import { useUserAuthStore } from '../../../service/user_auth.service';
import { ApiError } from '../../../service/api';

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate
    };
});

// Spy on auth service
vi.spyOn(authService, 'handleOAuthCallback');

describe('OAuthCallback Page', () => {
    beforeEach(() => {
        sessionStorage.clear();
        vi.clearAllMocks();
        useUserAuthStore.getState().clearAuth();
    });

    it('shows error if missing URL parameters', () => {
        render(
            <MemoryRouter initialEntries={['/auth/callback']}>
                <OAuthCallback />
            </MemoryRouter>
        );

        expect(screen.getByText('缺少必要的授權參數 (code / state)')).toBeInTheDocument();
    });

    it('shows error if missing session storage data', () => {
        render(
            <MemoryRouter initialEntries={['/auth/callback?code=123&state=xyz']}>
                <OAuthCallback />
            </MemoryRouter>
        );

        expect(screen.getByText('找不到先前的授權資訊，請重新登入')).toBeInTheDocument();
    });

    it('shows error if state mismatch (CSRF)', () => {
        sessionStorage.setItem('oauth_state', 'abc');
        sessionStorage.setItem('oauth_provider', 'google');
        sessionStorage.setItem('oauth_redirect_uri', 'http://localhost/auth/callback');

        render(
            <MemoryRouter initialEntries={['/auth/callback?code=123&state=xyz']}>
                <OAuthCallback />
            </MemoryRouter>
        );

        expect(screen.getByText('授權狀態驗證失敗 (CSRF 檢查不通過)，請重新登入')).toBeInTheDocument();
    });

    it('navigates to dashboard on successful login', async () => {
        sessionStorage.setItem('oauth_state', 'xyz');
        sessionStorage.setItem('oauth_provider', 'google');
        sessionStorage.setItem('oauth_redirect_uri', 'http://localhost/auth/callback');

        vi.mocked(authService.handleOAuthCallback).mockResolvedValueOnce({
            access_token: 'new-token',
            user: { username: 'testuser', id: '1', email: 'test@example.com' },
            token_type: 'Bearer'
        });

        render(
            <MemoryRouter initialEntries={['/auth/callback?code=123&state=xyz']}>
                <OAuthCallback />
            </MemoryRouter>
        );

        expect(screen.getByText('正在處理登入，請稍候…')).toBeInTheDocument();

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/app/dashboard', { replace: true });
        });

        expect(useUserAuthStore.getState().accessToken).toBe('new-token');
        expect(useUserAuthStore.getState().username).toBe('testuser');
        
        // Assert storage cleanup
        expect(sessionStorage.getItem('oauth_state')).toBeNull();
    });

    it('navigates to complete-profile when REGISTRATION_REQUIRED', async () => {
        sessionStorage.setItem('oauth_state', 'xyz');
        sessionStorage.setItem('oauth_provider', 'google');
        sessionStorage.setItem('oauth_redirect_uri', 'http://localhost/auth/callback');

        vi.mocked(authService.handleOAuthCallback).mockRejectedValueOnce(
            new ApiError(403, 'Forbidden', {
                code: 'REGISTRATION_REQUIRED',
                registration_token: 'reg-token',
                email: 'test@example.com',
                provider: 'google'
            })
        );

        render(
            <MemoryRouter initialEntries={['/auth/callback?code=123&state=xyz']}>
                <OAuthCallback />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/signin/complete-profile', { replace: true });
        });

        expect(sessionStorage.getItem('oauth_registration_token')).toBe('reg-token');
    });

    it('navigates to link-identity when LINK_REQUIRED', async () => {
        sessionStorage.setItem('oauth_state', 'xyz');
        sessionStorage.setItem('oauth_provider', 'discord');
        sessionStorage.setItem('oauth_redirect_uri', 'http://localhost/auth/callback');

        vi.mocked(authService.handleOAuthCallback).mockRejectedValueOnce(
            new ApiError(403, 'Forbidden', {
                code: 'LINK_REQUIRED',
                link_token: 'link-token',
                email: 'test@example.com',
                provider: 'discord',
                verification_oauth_providers: ['google']
            })
        );

        render(
            <MemoryRouter initialEntries={['/auth/callback?code=123&state=xyz']}>
                <OAuthCallback />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/signin/link-identity', { replace: true });
        });

        expect(sessionStorage.getItem('oauth_link_token')).toBe('link-token');
        expect(sessionStorage.getItem('oauth_link_verification_providers')).toBe('["google"]');
    });
});
