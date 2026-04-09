import { describe, it, expect, beforeEach, vi } from 'vitest';

import { useAuth } from '../../composables/useAuth';

const mockFetch = vi.fn();

vi.stubGlobal('useApi', () => ({
  fetch: mockFetch,
}));

describe('useAuth composable', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('login()', () => {
    it('should call POST /auth/login with correct params', async () => {
      const credentials = { email: 'user@test.com', password: 'secret123' };
      mockFetch.mockResolvedValue({ user: { id: 1 } });

      const { login } = useAuth();
      await login(credentials);

      expect(mockFetch).toHaveBeenCalledWith('/auth/login', {
        method: 'POST',
        body: credentials,
      });
    });

    it('should pass rememberMe option when provided', async () => {
      const credentials = { email: 'user@test.com', password: 'secret123', rememberMe: true };
      mockFetch.mockResolvedValue({ user: { id: 1 } });

      const { login } = useAuth();
      await login(credentials);

      expect(mockFetch).toHaveBeenCalledWith('/auth/login', {
        method: 'POST',
        body: credentials,
      });
    });
  });

  describe('refresh()', () => {
    it('should call POST /auth/refresh without body (cookies handle tokens)', async () => {
      mockFetch.mockResolvedValue({ user: { id: 1 } });

      const { refresh } = useAuth();
      await refresh();

      expect(mockFetch).toHaveBeenCalledWith('/auth/refresh', {
        method: 'POST',
      });
    });
  });

  describe('logout()', () => {
    it('should call POST /auth/logout', async () => {
      mockFetch.mockResolvedValue(undefined);

      const { logout } = useAuth();
      await logout();

      expect(mockFetch).toHaveBeenCalledWith('/auth/logout', {
        method: 'POST',
      });
    });
  });

  describe('forgotPassword()', () => {
    it('should call POST /auth/forgot-password with email', async () => {
      mockFetch.mockResolvedValue(undefined);

      const { forgotPassword } = useAuth();
      await forgotPassword('user@test.com');

      expect(mockFetch).toHaveBeenCalledWith('/auth/forgot-password', {
        method: 'POST',
        body: { email: 'user@test.com' },
      });
    });
  });

  describe('resetPassword()', () => {
    it('should call POST /auth/reset-password with token and password', async () => {
      const data = { token: 'reset-token-123', password: 'newpassword' };
      mockFetch.mockResolvedValue(undefined);

      const { resetPassword } = useAuth();
      await resetPassword(data);

      expect(mockFetch).toHaveBeenCalledWith('/auth/reset-password', {
        method: 'POST',
        body: data,
      });
    });
  });

  describe('getMe()', () => {
    it('should call GET /auth/me', async () => {
      const user = { id: 1, name: 'Thiago', role: 'ADMIN' };
      mockFetch.mockResolvedValue(user);

      const { getMe } = useAuth();
      const result = await getMe();

      expect(mockFetch).toHaveBeenCalledWith('/auth/me');
      expect(result).toEqual(user);
    });
  });
});
