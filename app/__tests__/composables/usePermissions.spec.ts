import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ref, computed } from 'vue';

function createMockAuthStore(overrides: Record<string, any> = {}) {
  const defaults = {
    user: null,
    isLoading: false,
    isAuthenticated: false,
    userRole: null,
    isAdmin: false,
    isModerador: false,
    isUsuario: false,
  };
  return { ...defaults, ...overrides };
}

vi.stubGlobal('useApi', () => ({
  fetch: vi.fn(),
}));

let mockAuthStoreValue = createMockAuthStore();

vi.mock('../../stores/auth', () => ({
  useAuthStore: () => mockAuthStoreValue,
}));

import { usePermissions } from '../../composables/usePermissions';

describe('usePermissions composable', () => {
  beforeEach(() => {
    mockAuthStoreValue = createMockAuthStore();
  });

  describe('unauthenticated user', () => {
    it('canView should return false', () => {
      const { canView } = usePermissions();
      expect(canView('players')).toBe(false);
      expect(canView('matches')).toBe(false);
    });

    it('canCreate should return false', () => {
      const { canCreate } = usePermissions();
      expect(canCreate('players')).toBe(false);
    });

    it('canEdit should return false', () => {
      const { canEdit } = usePermissions();
      expect(canEdit('players')).toBe(false);
    });

    it('canDelete should return false', () => {
      const { canDelete } = usePermissions();
      expect(canDelete('players')).toBe(false);
    });

    it('canManageMatch should return false', () => {
      const { canManageMatch } = usePermissions();
      expect(canManageMatch()).toBe(false);
    });
  });

  describe('USUARIO role', () => {
    beforeEach(() => {
      mockAuthStoreValue = createMockAuthStore({
        isAuthenticated: true,
        userRole: 'USUARIO',
        isUsuario: true,
      });
    });

    it('canView should return true for all resources', () => {
      const { canView } = usePermissions();
      expect(canView('players')).toBe(true);
      expect(canView('matches')).toBe(true);
      expect(canView('seasons')).toBe(true);
      expect(canView('teams')).toBe(true);
      expect(canView('attendance')).toBe(true);
      expect(canView('sessions')).toBe(true);
      expect(canView('champions')).toBe(true);
      expect(canView('users')).toBe(true);
      expect(canView('settings')).toBe(true);
    });

    it('canCreate should return false for all resources', () => {
      const { canCreate } = usePermissions();
      expect(canCreate('players')).toBe(false);
      expect(canCreate('users')).toBe(false);
      expect(canCreate('seasons')).toBe(false);
      expect(canCreate('settings')).toBe(false);
      expect(canCreate('attendance')).toBe(false);
      expect(canCreate('teams')).toBe(false);
      expect(canCreate('matches')).toBe(false);
      expect(canCreate('sessions')).toBe(false);
      expect(canCreate('champions')).toBe(false);
    });

    it('canEdit should return false for all resources', () => {
      const { canEdit } = usePermissions();
      expect(canEdit('players')).toBe(false);
      expect(canEdit('matches')).toBe(false);
    });

    it('canDelete should return false for all resources', () => {
      const { canDelete } = usePermissions();
      expect(canDelete('players')).toBe(false);
      expect(canDelete('matches')).toBe(false);
    });

    it('canManageMatch should return false', () => {
      const { canManageMatch } = usePermissions();
      expect(canManageMatch()).toBe(false);
    });
  });

  describe('MODERADOR role', () => {
    beforeEach(() => {
      mockAuthStoreValue = createMockAuthStore({
        isAuthenticated: true,
        userRole: 'MODERADOR',
        isModerador: true,
      });
    });

    it('canView should return true for all resources', () => {
      const { canView } = usePermissions();
      expect(canView('players')).toBe(true);
      expect(canView('matches')).toBe(true);
      expect(canView('users')).toBe(true);
    });

    it('canManageMatch should return true', () => {
      const { canManageMatch } = usePermissions();
      expect(canManageMatch()).toBe(true);
    });

    it('canCreate should return true for moderator-managed resources', () => {
      const { canCreate } = usePermissions();
      expect(canCreate('attendance')).toBe(true);
      expect(canCreate('teams')).toBe(true);
      expect(canCreate('matches')).toBe(true);
      expect(canCreate('sessions')).toBe(true);
      expect(canCreate('champions')).toBe(true);
    });

    it('canCreate should return false for admin-only resources', () => {
      const { canCreate } = usePermissions();
      expect(canCreate('players')).toBe(false);
      expect(canCreate('users')).toBe(false);
      expect(canCreate('seasons')).toBe(false);
      expect(canCreate('settings')).toBe(false);
    });

    it('canEdit should return true for moderator-managed resources', () => {
      const { canEdit } = usePermissions();
      expect(canEdit('attendance')).toBe(true);
      expect(canEdit('teams')).toBe(true);
      expect(canEdit('matches')).toBe(true);
      expect(canEdit('sessions')).toBe(true);
      expect(canEdit('champions')).toBe(true);
    });

    it('canEdit should return false for admin-only resources', () => {
      const { canEdit } = usePermissions();
      expect(canEdit('players')).toBe(false);
      expect(canEdit('users')).toBe(false);
      expect(canEdit('seasons')).toBe(false);
      expect(canEdit('settings')).toBe(false);
    });

    it('canDelete should return false for all resources', () => {
      const { canDelete } = usePermissions();
      expect(canDelete('players')).toBe(false);
      expect(canDelete('users')).toBe(false);
      expect(canDelete('attendance')).toBe(false);
      expect(canDelete('teams')).toBe(false);
      expect(canDelete('matches')).toBe(false);
      expect(canDelete('sessions')).toBe(false);
      expect(canDelete('champions')).toBe(false);
      expect(canDelete('seasons')).toBe(false);
      expect(canDelete('settings')).toBe(false);
    });
  });

  describe('ADMIN role', () => {
    beforeEach(() => {
      mockAuthStoreValue = createMockAuthStore({
        isAuthenticated: true,
        userRole: 'ADMIN',
        isAdmin: true,
      });
    });

    it('canView should return true for all resources', () => {
      const { canView } = usePermissions();
      expect(canView('players')).toBe(true);
      expect(canView('matches')).toBe(true);
      expect(canView('users')).toBe(true);
      expect(canView('settings')).toBe(true);
      expect(canView('seasons')).toBe(true);
    });

    it('canCreate should return true for all resources', () => {
      const { canCreate } = usePermissions();
      expect(canCreate('players')).toBe(true);
      expect(canCreate('users')).toBe(true);
      expect(canCreate('seasons')).toBe(true);
      expect(canCreate('settings')).toBe(true);
      expect(canCreate('attendance')).toBe(true);
      expect(canCreate('teams')).toBe(true);
      expect(canCreate('matches')).toBe(true);
      expect(canCreate('sessions')).toBe(true);
      expect(canCreate('champions')).toBe(true);
    });

    it('canEdit should return true for all resources', () => {
      const { canEdit } = usePermissions();
      expect(canEdit('players')).toBe(true);
      expect(canEdit('users')).toBe(true);
      expect(canEdit('seasons')).toBe(true);
      expect(canEdit('settings')).toBe(true);
      expect(canEdit('attendance')).toBe(true);
      expect(canEdit('teams')).toBe(true);
      expect(canEdit('matches')).toBe(true);
      expect(canEdit('sessions')).toBe(true);
      expect(canEdit('champions')).toBe(true);
    });

    it('canDelete should return true for all resources', () => {
      const { canDelete } = usePermissions();
      expect(canDelete('players')).toBe(true);
      expect(canDelete('users')).toBe(true);
      expect(canDelete('seasons')).toBe(true);
      expect(canDelete('settings')).toBe(true);
      expect(canDelete('attendance')).toBe(true);
      expect(canDelete('teams')).toBe(true);
      expect(canDelete('matches')).toBe(true);
      expect(canDelete('sessions')).toBe(true);
      expect(canDelete('champions')).toBe(true);
    });

    it('canManageMatch should return true', () => {
      const { canManageMatch } = usePermissions();
      expect(canManageMatch()).toBe(true);
    });
  });
});
