import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '../../stores/auth';

vi.stubGlobal('useRuntimeConfig', () => ({
  apiBaseUrl: 'http://localhost:3000',
  public: { apiBaseUrl: 'http://localhost:3000' },
}));

vi.stubGlobal('$fetch', vi.fn());

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
    vi.mocked($fetch).mockReset();
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

    it('should have isLoading as false', () => {
      const store = useAuthStore();
      expect(store.isLoading).toBe(false);
    });
  });

  describe('login()', () => {
    it('should store user and set isAuthenticated to true', () => {
      const store = useAuthStore();
      const loginData = {
        user: { id: 1, name: 'Thiago', email: 'thiago@test.com', role: 'ADMIN' },
      };

      store.login(loginData);

      expect(store.user).toEqual(loginData.user);
      expect(store.isAuthenticated).toBe(true);
    });

    it('should persist user to localStorage (not tokens)', () => {
      const store = useAuthStore();
      const loginData = {
        user: { id: 1, name: 'Thiago', email: 'thiago@test.com', role: 'ADMIN' },
      };

      store.login(loginData);

      expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(loginData.user));
      expect(localStorage.setItem).not.toHaveBeenCalledWith('accessToken', expect.anything());
      expect(localStorage.setItem).not.toHaveBeenCalledWith('refreshToken', expect.anything());
    });
  });

  describe('logout()', () => {
    it('should clear user and isAuthenticated', () => {
      const store = useAuthStore();
      store.login({
        user: { id: 1, name: 'Thiago', email: 'thiago@test.com', role: 'ADMIN' },
      });

      store.logout();

      expect(store.user).toBeNull();
      expect(store.isAuthenticated).toBe(false);
    });

    it('should remove user from localStorage and clean up legacy tokens', () => {
      const store = useAuthStore();
      store.login({
        user: { id: 1, name: 'Thiago', email: 'thiago@test.com', role: 'ADMIN' },
      });

      store.logout();

      expect(localStorage.removeItem).toHaveBeenCalledWith('user');
      expect(localStorage.removeItem).toHaveBeenCalledWith('accessToken');
      expect(localStorage.removeItem).toHaveBeenCalledWith('refreshToken');
    });
  });

  describe('setUser()', () => {
    it('should update the user', () => {
      const store = useAuthStore();
      const user = { id: 2, name: 'Lucas', email: 'lucas@test.com', role: 'MODERADOR' };

      store.setUser(user);

      expect(store.user).toEqual(user);
    });

    it('should persist user to localStorage', () => {
      const store = useAuthStore();
      const user = { id: 2, name: 'Lucas', email: 'lucas@test.com', role: 'MODERADOR' };

      store.setUser(user);

      expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(user));
    });
  });

  describe('clearAuth()', () => {
    it('should clear all auth state', () => {
      const store = useAuthStore();
      store.login({
        user: { id: 1, name: 'Thiago', email: 'thiago@test.com', role: 'ADMIN' },
      });

      store.clearAuth();

      expect(store.user).toBeNull();
      expect(store.isAuthenticated).toBe(false);
    });
  });

  describe('getter: userRole', () => {
    it('should return the user role', () => {
      const store = useAuthStore();
      store.login({
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
        user: { id: 1, name: 'Admin', email: 'admin@test.com', role: 'ADMIN' },
      });

      expect(store.isAdmin).toBe(true);
    });

    it('should return false for non-ADMIN role', () => {
      const store = useAuthStore();
      store.login({
        user: { id: 1, name: 'User', email: 'user@test.com', role: 'USUARIO' },
      });

      expect(store.isAdmin).toBe(false);
    });
  });

  describe('getter: isModerador', () => {
    it('should return true for MODERADOR role', () => {
      const store = useAuthStore();
      store.login({
        user: { id: 1, name: 'Mod', email: 'mod@test.com', role: 'MODERADOR' },
      });

      expect(store.isModerador).toBe(true);
    });

    it('should return false for non-MODERADOR role', () => {
      const store = useAuthStore();
      store.login({
        user: { id: 1, name: 'User', email: 'user@test.com', role: 'USUARIO' },
      });

      expect(store.isModerador).toBe(false);
    });
  });

  describe('getter: isUsuario', () => {
    it('should return true for USUARIO role', () => {
      const store = useAuthStore();
      store.login({
        user: { id: 1, name: 'User', email: 'user@test.com', role: 'USUARIO' },
      });

      expect(store.isUsuario).toBe(true);
    });

    it('should return false for non-USUARIO role', () => {
      const store = useAuthStore();
      store.login({
        user: { id: 1, name: 'Admin', email: 'admin@test.com', role: 'ADMIN' },
      });

      expect(store.isUsuario).toBe(false);
    });
  });

  describe('hydrateFromStorage()', () => {
    it('should quick-hydrate user from localStorage then verify with /auth/me', async () => {
      const user = { id: 1, name: 'Thiago', email: 'thiago@test.com', role: 'ADMIN' };
      const updatedUser = { id: 1, name: 'Thiago C', email: 'thiago@test.com', role: 'ADMIN' };

      vi.stubGlobal('localStorage', {
        getItem: vi.fn((key: string) => {
          if (key === 'user') return JSON.stringify(user);
          return null;
        }),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      });

      // @ts-expect-error Nuxt route type recursion causes excessive stack depth
      vi.mocked($fetch).mockResolvedValue(updatedUser as any);

      setActivePinia(createPinia());
      const store = useAuthStore();
      await store.hydrateFromStorage();

      expect(store.user).toEqual(updatedUser);
      expect(store.isAuthenticated).toBe(true);
    });

    it('should clear user when /auth/me fails', async () => {
      vi.stubGlobal('localStorage', {
        getItem: vi.fn((key: string) => {
          if (key === 'user') return JSON.stringify({ id: 1, name: 'Old', email: 'old@test.com', role: 'ADMIN' });
          return null;
        }),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      });

      vi.mocked($fetch).mockRejectedValue(new Error('Unauthorized'));

      setActivePinia(createPinia());
      const store = useAuthStore();
      await store.hydrateFromStorage();

      expect(store.user).toBeNull();
      expect(store.isAuthenticated).toBe(false);
    });

    it('should clean up legacy token entries from localStorage', async () => {
      vi.stubGlobal('localStorage', {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      });

      vi.mocked($fetch).mockRejectedValue(new Error('Unauthorized'));

      setActivePinia(createPinia());
      const store = useAuthStore();
      await store.hydrateFromStorage();

      expect(localStorage.removeItem).toHaveBeenCalledWith('accessToken');
      expect(localStorage.removeItem).toHaveBeenCalledWith('refreshToken');
    });

    it('should not crash when localStorage is empty', async () => {
      vi.mocked($fetch).mockRejectedValue(new Error('Unauthorized'));

      const store = useAuthStore();
      await expect(store.hydrateFromStorage()).resolves.not.toThrow();
      expect(store.isAuthenticated).toBe(false);
    });
  });
});
