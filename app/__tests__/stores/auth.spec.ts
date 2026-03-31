import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '../../stores/auth';

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
    vi.stubGlobal('sessionStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });

  describe('initial state', () => {
    it('should have user as null', () => {
      const store = useAuthStore();
      expect(store.user).toBeNull();
    });

    it('should have isAuthenticated as false', () => {
      const store = useAuthStore();
      expect(store.isAuthenticated).toBe(false);
    });

    it('should have accessToken as empty string', () => {
      const store = useAuthStore();
      expect(store.accessToken).toBe('');
    });

    it('should have refreshToken as empty string', () => {
      const store = useAuthStore();
      expect(store.refreshToken).toBe('');
    });

    it('should have isLoading as false', () => {
      const store = useAuthStore();
      expect(store.isLoading).toBe(false);
    });
  });

  describe('login()', () => {
    it('should store tokens and user and set isAuthenticated to true', () => {
      const store = useAuthStore();
      const loginData = {
        accessToken: 'access-123',
        refreshToken: 'refresh-456',
        user: { id: 1, name: 'Thiago', email: 'thiago@test.com', role: 'ADMIN' },
      };

      store.login(loginData);

      expect(store.accessToken).toBe('access-123');
      expect(store.refreshToken).toBe('refresh-456');
      expect(store.user).toEqual(loginData.user);
      expect(store.isAuthenticated).toBe(true);
    });

    it('should persist tokens to localStorage', () => {
      const store = useAuthStore();
      const loginData = {
        accessToken: 'access-123',
        refreshToken: 'refresh-456',
        user: { id: 1, name: 'Thiago', email: 'thiago@test.com', role: 'ADMIN' },
      };

      store.login(loginData);

      expect(localStorage.setItem).toHaveBeenCalledWith('accessToken', 'access-123');
      expect(localStorage.setItem).toHaveBeenCalledWith('refreshToken', 'refresh-456');
      expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(loginData.user));
    });
  });

  describe('logout()', () => {
    it('should clear user, tokens, and isAuthenticated', () => {
      const store = useAuthStore();
      store.login({
        accessToken: 'access-123',
        refreshToken: 'refresh-456',
        user: { id: 1, name: 'Thiago', email: 'thiago@test.com', role: 'ADMIN' },
      });

      store.logout();

      expect(store.user).toBeNull();
      expect(store.accessToken).toBe('');
      expect(store.refreshToken).toBe('');
      expect(store.isAuthenticated).toBe(false);
    });

    it('should remove tokens from localStorage', () => {
      const store = useAuthStore();
      store.login({
        accessToken: 'access-123',
        refreshToken: 'refresh-456',
        user: { id: 1, name: 'Thiago', email: 'thiago@test.com', role: 'ADMIN' },
      });

      store.logout();

      expect(localStorage.removeItem).toHaveBeenCalledWith('accessToken');
      expect(localStorage.removeItem).toHaveBeenCalledWith('refreshToken');
      expect(localStorage.removeItem).toHaveBeenCalledWith('user');
    });
  });

  describe('setTokens()', () => {
    it('should update accessToken and refreshToken', () => {
      const store = useAuthStore();

      store.setTokens('new-access', 'new-refresh');

      expect(store.accessToken).toBe('new-access');
      expect(store.refreshToken).toBe('new-refresh');
    });
  });

  describe('setUser()', () => {
    it('should update the user', () => {
      const store = useAuthStore();
      const user = { id: 2, name: 'Lucas', email: 'lucas@test.com', role: 'MODERADOR' };

      store.setUser(user);

      expect(store.user).toEqual(user);
    });
  });

  describe('clearAuth()', () => {
    it('should clear all auth state', () => {
      const store = useAuthStore();
      store.login({
        accessToken: 'access-123',
        refreshToken: 'refresh-456',
        user: { id: 1, name: 'Thiago', email: 'thiago@test.com', role: 'ADMIN' },
      });

      store.clearAuth();

      expect(store.user).toBeNull();
      expect(store.accessToken).toBe('');
      expect(store.refreshToken).toBe('');
      expect(store.isAuthenticated).toBe(false);
    });
  });

  describe('getter: userRole', () => {
    it('should return the user role', () => {
      const store = useAuthStore();
      store.login({
        accessToken: 'access-123',
        refreshToken: 'refresh-456',
        user: { id: 1, name: 'Thiago', email: 'thiago@test.com', role: 'ADMIN' },
      });

      expect(store.userRole).toBe('ADMIN');
    });

    it('should return null when no user is set', () => {
      const store = useAuthStore();
      expect(store.userRole).toBeNull();
    });
  });

  describe('getter: isAdmin', () => {
    it('should return true for ADMIN role', () => {
      const store = useAuthStore();
      store.login({
        accessToken: 'token',
        refreshToken: 'refresh',
        user: { id: 1, name: 'Admin', email: 'admin@test.com', role: 'ADMIN' },
      });

      expect(store.isAdmin).toBe(true);
    });

    it('should return false for non-ADMIN role', () => {
      const store = useAuthStore();
      store.login({
        accessToken: 'token',
        refreshToken: 'refresh',
        user: { id: 1, name: 'User', email: 'user@test.com', role: 'USUARIO' },
      });

      expect(store.isAdmin).toBe(false);
    });
  });

  describe('getter: isModerador', () => {
    it('should return true for MODERADOR role', () => {
      const store = useAuthStore();
      store.login({
        accessToken: 'token',
        refreshToken: 'refresh',
        user: { id: 1, name: 'Mod', email: 'mod@test.com', role: 'MODERADOR' },
      });

      expect(store.isModerador).toBe(true);
    });

    it('should return false for non-MODERADOR role', () => {
      const store = useAuthStore();
      store.login({
        accessToken: 'token',
        refreshToken: 'refresh',
        user: { id: 1, name: 'User', email: 'user@test.com', role: 'USUARIO' },
      });

      expect(store.isModerador).toBe(false);
    });
  });

  describe('getter: isUsuario', () => {
    it('should return true for USUARIO role', () => {
      const store = useAuthStore();
      store.login({
        accessToken: 'token',
        refreshToken: 'refresh',
        user: { id: 1, name: 'User', email: 'user@test.com', role: 'USUARIO' },
      });

      expect(store.isUsuario).toBe(true);
    });

    it('should return false for non-USUARIO role', () => {
      const store = useAuthStore();
      store.login({
        accessToken: 'token',
        refreshToken: 'refresh',
        user: { id: 1, name: 'Admin', email: 'admin@test.com', role: 'ADMIN' },
      });

      expect(store.isUsuario).toBe(false);
    });
  });

  describe('hydrateFromStorage()', () => {
    it('should restore state from localStorage', () => {
      const user = { id: 1, name: 'Thiago', email: 'thiago@test.com', role: 'ADMIN' };
      vi.stubGlobal('localStorage', {
        getItem: vi.fn((key: string) => {
          const data: Record<string, string> = {
            accessToken: 'stored-access',
            refreshToken: 'stored-refresh',
            user: JSON.stringify(user),
          };
          return data[key] ?? null;
        }),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      });

      // Re-create pinia so the store re-initializes
      setActivePinia(createPinia());
      const store = useAuthStore();
      store.hydrateFromStorage();

      expect(store.accessToken).toBe('stored-access');
      expect(store.refreshToken).toBe('stored-refresh');
      expect(store.user).toEqual(user);
      expect(store.isAuthenticated).toBe(true);
    });

    it('should not crash when localStorage is empty', () => {
      const store = useAuthStore();
      expect(() => store.hydrateFromStorage()).not.toThrow();
      expect(store.isAuthenticated).toBe(false);
    });
  });
});
