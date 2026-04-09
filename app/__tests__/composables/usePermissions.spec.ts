import { describe, it, expect, beforeEach, vi } from 'vitest';

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

function createMockGroupsStore(overrides: Record<string, any> = {}) {
  const defaults = {
    groups: [],
    activeGroupId: null,
    activeGroup: null,
    groupRole: null,
    loading: false,
    fetchGroups: vi.fn(),
    switchGroup: vi.fn(),
  };
  return { ...defaults, ...overrides };
}

vi.stubGlobal('useApi', () => ({
  fetch: vi.fn(),
}));

let mockAuthStoreValue = createMockAuthStore();
let mockGroupsStoreValue: ReturnType<typeof createMockGroupsStore> | null =
  createMockGroupsStore();

vi.mock('../../stores/auth', () => ({
  useAuthStore: () => mockAuthStoreValue,
}));

// Mock useGroupsStore as a global (Nuxt auto-imports it from stores/groups.ts)
vi.stubGlobal('useGroupsStore', () => {
  if (mockGroupsStoreValue === null) {
    throw new ReferenceError('useGroupsStore is not defined');
  }
  return mockGroupsStoreValue;
});

import { usePermissions } from '../../composables/usePermissions';

describe('usePermissions composable', () => {
  beforeEach(() => {
    mockAuthStoreValue = createMockAuthStore();
    mockGroupsStoreValue = createMockGroupsStore();
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

    it('canManageMembers should return false', () => {
      const { canManageMembers } = usePermissions();
      expect(canManageMembers()).toBe(false);
    });

    it('canConfirmOthers should return false', () => {
      const { canConfirmOthers } = usePermissions();
      expect(canConfirmOthers()).toBe(false);
    });
  });

  describe('system superadmin (user.role === ADMIN)', () => {
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

    it('canManageMembers should return true', () => {
      const { canManageMembers } = usePermissions();
      expect(canManageMembers()).toBe(true);
    });

    it('canConfirmOthers should return true', () => {
      const { canConfirmOthers } = usePermissions();
      expect(canConfirmOthers()).toBe(true);
    });

    it('should bypass group role checks (superadmin always has full access)', () => {
      // Even with no group role, superadmin has full access
      mockGroupsStoreValue = createMockGroupsStore({ groupRole: null });
      const { canCreate, canDelete, canManageMembers } = usePermissions();
      expect(canCreate('players')).toBe(true);
      expect(canDelete('players')).toBe(true);
      expect(canManageMembers()).toBe(true);
    });
  });

  describe('group role: DONO (group owner)', () => {
    beforeEach(() => {
      mockAuthStoreValue = createMockAuthStore({
        isAuthenticated: true,
        userRole: 'USUARIO',
        isUsuario: true,
      });
      mockGroupsStoreValue = createMockGroupsStore({ groupRole: 'DONO' });
    });

    it('canView should return true for all resources', () => {
      const { canView } = usePermissions();
      expect(canView('players')).toBe(true);
      expect(canView('matches')).toBe(true);
      expect(canView('users')).toBe(true);
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
    });

    it('canDelete should return true for all resources', () => {
      const { canDelete } = usePermissions();
      expect(canDelete('players')).toBe(true);
      expect(canDelete('users')).toBe(true);
      expect(canDelete('seasons')).toBe(true);
      expect(canDelete('settings')).toBe(true);
    });

    it('canManageMatch should return true', () => {
      const { canManageMatch } = usePermissions();
      expect(canManageMatch()).toBe(true);
    });

    it('canManageMembers should return true', () => {
      const { canManageMembers } = usePermissions();
      expect(canManageMembers()).toBe(true);
    });

    it('canConfirmOthers should return true', () => {
      const { canConfirmOthers } = usePermissions();
      expect(canConfirmOthers()).toBe(true);
    });
  });

  describe('group role: ADMIN', () => {
    beforeEach(() => {
      mockAuthStoreValue = createMockAuthStore({
        isAuthenticated: true,
        userRole: 'USUARIO',
        isUsuario: true,
      });
      mockGroupsStoreValue = createMockGroupsStore({ groupRole: 'ADMIN' });
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

    it('canCreate should return true for admin-managed resources', () => {
      const { canCreate } = usePermissions();
      expect(canCreate('attendance')).toBe(true);
      expect(canCreate('teams')).toBe(true);
      expect(canCreate('matches')).toBe(true);
      expect(canCreate('sessions')).toBe(true);
      expect(canCreate('champions')).toBe(true);
      expect(canCreate('players')).toBe(true);
      expect(canCreate('settings')).toBe(true);
    });

    it('canCreate should return false for owner-only resources', () => {
      const { canCreate } = usePermissions();
      expect(canCreate('users')).toBe(false);
      expect(canCreate('seasons')).toBe(false);
    });

    it('canEdit should return true for admin-managed resources', () => {
      const { canEdit } = usePermissions();
      expect(canEdit('attendance')).toBe(true);
      expect(canEdit('teams')).toBe(true);
      expect(canEdit('matches')).toBe(true);
      expect(canEdit('sessions')).toBe(true);
      expect(canEdit('champions')).toBe(true);
      expect(canEdit('players')).toBe(true);
      expect(canEdit('settings')).toBe(true);
    });

    it('canEdit should return false for owner-only resources', () => {
      const { canEdit } = usePermissions();
      expect(canEdit('users')).toBe(false);
      expect(canEdit('seasons')).toBe(false);
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

    it('canManageMembers should return false (DONO only)', () => {
      const { canManageMembers } = usePermissions();
      expect(canManageMembers()).toBe(false);
    });

    it('canConfirmOthers should return true', () => {
      const { canConfirmOthers } = usePermissions();
      expect(canConfirmOthers()).toBe(true);
    });
  });

  describe('group role: JOGADOR', () => {
    beforeEach(() => {
      mockAuthStoreValue = createMockAuthStore({
        isAuthenticated: true,
        userRole: 'USUARIO',
        isUsuario: true,
      });
      mockGroupsStoreValue = createMockGroupsStore({ groupRole: 'JOGADOR' });
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

    it('canManageMembers should return false', () => {
      const { canManageMembers } = usePermissions();
      expect(canManageMembers()).toBe(false);
    });

    it('canConfirmOthers should return false', () => {
      const { canConfirmOthers } = usePermissions();
      expect(canConfirmOthers()).toBe(false);
    });
  });

  describe('fallback: groups store not available', () => {
    beforeEach(() => {
      mockAuthStoreValue = createMockAuthStore({
        isAuthenticated: true,
        userRole: 'USUARIO',
        isUsuario: true,
      });
      // Simulate store not existing yet
      mockGroupsStoreValue = null;
    });

    it('canView should return true (authenticated)', () => {
      const { canView } = usePermissions();
      expect(canView('players')).toBe(true);
    });

    it('canCreate should return false (no group role available)', () => {
      const { canCreate } = usePermissions();
      expect(canCreate('players')).toBe(false);
      expect(canCreate('matches')).toBe(false);
    });

    it('canEdit should return false (no group role available)', () => {
      const { canEdit } = usePermissions();
      expect(canEdit('players')).toBe(false);
    });

    it('canDelete should return false (no group role available)', () => {
      const { canDelete } = usePermissions();
      expect(canDelete('players')).toBe(false);
    });

    it('canManageMatch should return false', () => {
      const { canManageMatch } = usePermissions();
      expect(canManageMatch()).toBe(false);
    });

    it('canManageMembers should return false', () => {
      const { canManageMembers } = usePermissions();
      expect(canManageMembers()).toBe(false);
    });

    it('canConfirmOthers should return false', () => {
      const { canConfirmOthers } = usePermissions();
      expect(canConfirmOthers()).toBe(false);
    });

    it('superadmin should still have full access even without groups store', () => {
      mockAuthStoreValue = createMockAuthStore({
        isAuthenticated: true,
        userRole: 'ADMIN',
        isAdmin: true,
      });
      const { canCreate, canDelete, canManageMembers, canConfirmOthers } =
        usePermissions();
      expect(canCreate('players')).toBe(true);
      expect(canDelete('players')).toBe(true);
      expect(canManageMembers()).toBe(true);
      expect(canConfirmOthers()).toBe(true);
    });
  });
});
