import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Signin from './signin';
import * as authService from '../../service/auth.service';
import { ApiError } from '../../service/api';

// Mock the child components to simplify testing
vi.mock('./login/login', () => ({
    default: () => <div data-testid="login-component">Login Component</div>
}));

vi.mock('./register/register', () => ({
    default: () => <div data-testid="register-component">Register Component</div>
}));

vi.mock('../../share/signin-nav/signin-nav', () => ({
    default: () => <div data-testid="signin-nav">Nav</div>
}));

// Mock window.location.href
const originalLocation = window.location;
beforeEach(() => {
    delete (window as any).location;
    window.location = { ...originalLocation, href: '' } as any;
    sessionStorage.clear();
    vi.clearAllMocks();
});

// Spy on the auth service
vi.spyOn(authService, 'getOAuthAuthorizeUrl');

describe('Signin Page', () => {
    it('renders the Signin page and shows Login component by default or when type=login', () => {
        // Need to wrap in BrowserRouter because of useSearchParams and Link
        render(
            <BrowserRouter>
                <Signin />
            </BrowserRouter>
        );

        expect(screen.getByTestId('signin-nav')).toBeInTheDocument();
        expect(screen.getByText('第五人格戰積記錄分析小工具')).toBeInTheDocument();
        
        // Since useSearchParams default is null, we can check if the links are there
        expect(screen.getByText('登入')).toBeInTheDocument();
        expect(screen.getByText('註冊')).toBeInTheDocument();
        expect(screen.getByText('Discord')).toBeInTheDocument();
        expect(screen.getByText('Google')).toBeInTheDocument();
    });

    it('navigates to OAuth provider when Google button is clicked', async () => {
        const mockUrl = 'https://accounts.google.com/o/oauth2/v2/auth?client_id=xxx';
        const mockState = 'nonce:1234:sig';
        
        vi.mocked(authService.getOAuthAuthorizeUrl).mockResolvedValueOnce({
            authorization_url: mockUrl,
            state: mockState
        });

        render(
            <BrowserRouter>
                <Signin />
            </BrowserRouter>
        );

        const googleBtn = screen.getByText('Google');
        fireEvent.click(googleBtn);

        expect(screen.getByText('連線中…')).toBeInTheDocument();

        await waitFor(() => {
            expect(window.location.href).toBe(mockUrl);
        });

        expect(sessionStorage.getItem('oauth_state')).toBe(mockState);
        expect(sessionStorage.getItem('oauth_provider')).toBe('google');
        expect(sessionStorage.getItem('oauth_redirect_uri')).toBe(`${window.location.origin}/auth/callback`);
    });

    it('displays error if OAuth URL is unsafe', async () => {
        vi.mocked(authService.getOAuthAuthorizeUrl).mockResolvedValueOnce({
            authorization_url: 'http://malicious.com/auth', // Unsafe domain and protocol
            state: 'valid-state'
        });

        render(
            <BrowserRouter>
                <Signin />
            </BrowserRouter>
        );

        const discordBtn = screen.getByText('Discord');
        fireEvent.click(discordBtn);

        await waitFor(() => {
            expect(screen.getByText('無法取得授權連結，請稍後再試')).toBeInTheDocument();
        });
    });

    it('displays error if getOAuthAuthorizeUrl fails with ApiError', async () => {
        vi.mocked(authService.getOAuthAuthorizeUrl).mockRejectedValueOnce(
            new ApiError(500, '伺服器錯誤', null)
        );

        render(
            <BrowserRouter>
                <Signin />
            </BrowserRouter>
        );

        const googleBtn = screen.getByText('Google');
        fireEvent.click(googleBtn);

        await waitFor(() => {
            expect(screen.getByText('伺服器錯誤')).toBeInTheDocument();
        });
    });
});
