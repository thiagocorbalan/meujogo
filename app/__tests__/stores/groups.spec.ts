import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

import { useGroupsStore } from '../../stores/groups';

// Mock Nuxt auto-imports
vi.stubGlobal('useRuntimeConfig', () => ({
  apiBaseUrl: 'http://localhost:3000',
  public: { apiBaseUrl: 'http://localhost:3000' },
}));

vi.stubGlobal('$fetch', vi.fn());

const mockApiFetch = vi.fn().mockResolvedValue(undefined);
vi.stubGlobal('useApi', () => ({
  baseURL: 'http://localhost:3000',
  fetch: mockApiFetch,
}));

// Mock useGroups composable (will be used by the store internally)
const mockGetGroups = vi.fn();
const mockCreateGroup = vi.fn();
vi.stubGlobal('useGroups', () => ({
  getGroups: mockGetGroups,
  createGroup: mockCreateGroup,
}));

describe('Groups Store', () => {
  let mockLocalStorage: Record<string, string>;

  beforeEach(() => {
    setActivePinia(createPinia());
    mockLocalStorage = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => mockLocalStorage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        mockLocalStorage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockLocalStorage[key];
      }),
    });
    mockApiFetch.mockReset().mockResolvedValue(undefined);
    mockGetGroups.mockReset().mockResolvedValue([]);
    mockCreateGroup.mockReset().mockResolvedValue(undefined);
  });

  describe('initial state', () => {
    it('should have groups as empty array', () => {
      const store = useGroupsStore();
      expect(store.groups).toEqual([]);
    });

    it('should have activeGroupId as null', () => {
      const store = useGroupsStore();
      expect(store.activeGroupId).toBeNull();
    });

    it('should have loading as false', () => {
      const store = useGroupsStore();
      expect(store.loading).toBe(false);
    });
  });

  describe('fetchGroups()', () => {
    it('should call API and populate groups ref', async () => {
      const groups = [
        { id: 'g1', name: 'Pelada Domingo', role: 'ADMIN' },
        { id: 'g2', name: 'Futebol Quarta', role: 'MEMBER' },
      ];
      mockGetGroups.mockResolvedValue(groups);

      const store = useGroupsStore();
      await store.fetchGroups();

      expect(mockGetGroups).toHaveBeenCalled();
      expect(store.groups).toEqual(groups);
    });

    it('should set loading to true while fetching and false after', async () => {
      let resolvePromise: (value: any) => void;
      mockGetGroups.mockReturnValue(
        new Promise((resolve) => {
          resolvePromise = resolve;
        }),
      );

      const store = useGroupsStore();
      const fetchPromise = store.fetchGroups();

      expect(store.loading).toBe(true);

      resolvePromise!([]);
      await fetchPromise;

      expect(store.loading).toBe(false);
    });

    it('should set loading to false even when fetch fails', async () => {
      mockGetGroups.mockRejectedValue(new Error('Network error'));

      const store = useGroupsStore();
      try {
        await store.fetchGroups();
      } catch {
        // expected
      }

      expect(store.loading).toBe(false);
    });
  });

  describe('createGroup()', () => {
    it('should call API with group data and add to groups list', async () => {
      const newGroup = { id: 'g3', name: 'Nova Pelada', role: 'ADMIN' };
      mockCreateGroup.mockResolvedValue(newGroup);

      const store = useGroupsStore();
      const result = await store.createGroup({ name: 'Nova Pelada' });

      expect(mockCreateGroup).toHaveBeenCalledWith({ name: 'Nova Pelada' });
      expect(store.groups).toContainEqual(newGroup);
      expect(result).toEqual(newGroup);
    });

    it('should return the created group', async () => {
      const newGroup = { id: 'g3', name: 'Nova Pelada', role: 'ADMIN' };
      mockCreateGroup.mockResolvedValue(newGroup);

      const store = useGroupsStore();
      const result = await store.createGroup({ name: 'Nova Pelada' });

      expect(result).toEqual(newGroup);
    });
  });

  describe('switchGroup()', () => {
    it('should set activeGroupId', () => {
      const store = useGroupsStore();
      store.switchGroup('g1');

      expect(store.activeGroupId).toBe('g1');
    });

    it('should persist activeGroupId to localStorage', () => {
      const store = useGroupsStore();
      store.switchGroup('g1');

      expect(localStorage.setItem).toHaveBeenCalledWith('activeGroupId', 'g1');
    });

    it('should handle null id gracefully (deselect group)', () => {
      const store = useGroupsStore();
      store.switchGroup('g1');
      store.switchGroup(null);

      expect(store.activeGroupId).toBeNull();
    });

    it('should handle invalid/non-existent group id gracefully', () => {
      const store = useGroupsStore();
      store.switchGroup('non-existent-id');

      // Should still set the id (it may be validated elsewhere)
      expect(store.activeGroupId).toBe('non-existent-id');
    });
  });

  describe('activeGroup computed', () => {
    it('should return the group matching activeGroupId', async () => {
      const groups = [
        { id: 'g1', name: 'Pelada Domingo', role: 'ADMIN' },
        { id: 'g2', name: 'Futebol Quarta', role: 'MEMBER' },
      ];
      mockGetGroups.mockResolvedValue(groups);

      const store = useGroupsStore();
      await store.fetchGroups();
      store.switchGroup('g2');

      expect(store.activeGroup).toEqual({ id: 'g2', name: 'Futebol Quarta', role: 'MEMBER' });
    });

    it('should return null/undefined when no activeGroupId is set', () => {
      const store = useGroupsStore();
      expect(store.activeGroup).toBeFalsy();
    });

    it('should return null/undefined when activeGroupId does not match any group', async () => {
      const groups = [{ id: 'g1', name: 'Pelada Domingo', role: 'ADMIN' }];
      mockGetGroups.mockResolvedValue(groups);

      const store = useGroupsStore();
      await store.fetchGroups();
      store.switchGroup('non-existent');

      expect(store.activeGroup).toBeFalsy();
    });
  });

  describe('groupRole computed', () => {
    it("should return the user's role in the active group", async () => {
      const groups = [
        { id: 'g1', name: 'Pelada Domingo', role: 'ADMIN' },
        { id: 'g2', name: 'Futebol Quarta', role: 'MEMBER' },
      ];
      mockGetGroups.mockResolvedValue(groups);

      const store = useGroupsStore();
      await store.fetchGroups();
      store.switchGroup('g1');

      expect(store.groupRole).toBe('ADMIN');
    });

    it('should return null/undefined when no group is active', () => {
      const store = useGroupsStore();
      expect(store.groupRole).toBeFalsy();
    });

    it('should update when switching to a different group', async () => {
      const groups = [
        { id: 'g1', name: 'Pelada Domingo', role: 'ADMIN' },
        { id: 'g2', name: 'Futebol Quarta', role: 'MEMBER' },
      ];
      mockGetGroups.mockResolvedValue(groups);

      const store = useGroupsStore();
      await store.fetchGroups();

      store.switchGroup('g1');
      expect(store.groupRole).toBe('ADMIN');

      store.switchGroup('g2');
      expect(store.groupRole).toBe('MEMBER');
    });
  });
});
