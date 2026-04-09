import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockFetch = vi.fn();

vi.stubGlobal('useApi', () => ({
  fetch: mockFetch,
}));

import { useGroups } from '../../composables/useGroups';

describe('useGroups composable', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('getGroups()', () => {
    it('should call GET /groups', async () => {
      const groups = [
        { id: 'g1', name: 'Pelada Domingo' },
        { id: 'g2', name: 'Futebol Quarta' },
      ];
      mockFetch.mockResolvedValue(groups);

      const { getGroups } = useGroups();
      const result = await getGroups();

      expect(mockFetch).toHaveBeenCalledWith('/groups');
      expect(result).toEqual(groups);
    });
  });

  describe('createGroup()', () => {
    it('should call POST /groups with body', async () => {
      const groupData = { name: 'Nova Pelada', description: 'Pelada de domingo' };
      const created = { id: 'g3', ...groupData };
      mockFetch.mockResolvedValue(created);

      const { createGroup } = useGroups();
      const result = await createGroup(groupData);

      expect(mockFetch).toHaveBeenCalledWith('/groups', {
        method: 'POST',
        body: groupData,
      });
      expect(result).toEqual(created);
    });

    it('should pass all provided fields in the body', async () => {
      const groupData = { name: 'Pelada Completa', description: 'Descrição', maxPlayers: 20 };
      mockFetch.mockResolvedValue({ id: 'g4', ...groupData });

      const { createGroup } = useGroups();
      await createGroup(groupData);

      expect(mockFetch).toHaveBeenCalledWith('/groups', {
        method: 'POST',
        body: groupData,
      });
    });
  });

  describe('getInviteInfo()', () => {
    it('should call GET /groups/invite/:code', async () => {
      const inviteInfo = { groupName: 'Pelada Domingo', invitedBy: 'Thiago', expiresAt: '2026-04-10' };
      mockFetch.mockResolvedValue(inviteInfo);

      const { getInviteInfo } = useGroups();
      const result = await getInviteInfo('abc123');

      expect(mockFetch).toHaveBeenCalledWith('/groups/invite/abc123');
      expect(result).toEqual(inviteInfo);
    });

    it('should handle special characters in invite code', async () => {
      mockFetch.mockResolvedValue({});

      const { getInviteInfo } = useGroups();
      await getInviteInfo('code-with-dashes_and_underscores');

      expect(mockFetch).toHaveBeenCalledWith('/groups/invite/code-with-dashes_and_underscores');
    });
  });

  describe('joinGroup()', () => {
    it('should call POST /groups/invite/:code/join', async () => {
      const joinResult = { groupId: 'g1', role: 'MEMBER' };
      mockFetch.mockResolvedValue(joinResult);

      const { joinGroup } = useGroups();
      const result = await joinGroup('abc123');

      expect(mockFetch).toHaveBeenCalledWith('/groups/invite/abc123/join', {
        method: 'POST',
      });
      expect(result).toEqual(joinResult);
    });
  });

  describe('getMembers()', () => {
    it('should call GET /groups/:id/members', async () => {
      const members = [
        { id: 'u1', name: 'Thiago', role: 'ADMIN' },
        { id: 'u2', name: 'Lucas', role: 'MEMBER' },
      ];
      mockFetch.mockResolvedValue(members);

      const { getMembers } = useGroups();
      const result = await getMembers('g1');

      expect(mockFetch).toHaveBeenCalledWith('/groups/g1/members');
      expect(result).toEqual(members);
    });

    it('should work with numeric group ids', async () => {
      mockFetch.mockResolvedValue([]);

      const { getMembers } = useGroups();
      await getMembers('123');

      expect(mockFetch).toHaveBeenCalledWith('/groups/123/members');
    });
  });

  describe('addGuestPlayer()', () => {
    it('should call POST /groups/:id/guest-player with body', async () => {
      const guestData = { name: 'Carlos', position: 'LINHA' };
      const created = { id: 'p1', ...guestData, isGuest: true };
      mockFetch.mockResolvedValue(created);

      const { addGuestPlayer } = useGroups();
      const result = await addGuestPlayer('g1', guestData);

      expect(mockFetch).toHaveBeenCalledWith('/groups/g1/guest-player', {
        method: 'POST',
        body: guestData,
      });
      expect(result).toEqual(created);
    });

    it('should pass all guest player fields in the body', async () => {
      const guestData = { name: 'Carlos', position: 'GOLEIRO', nickname: 'Carlão' };
      mockFetch.mockResolvedValue({ id: 'p2', ...guestData });

      const { addGuestPlayer } = useGroups();
      await addGuestPlayer('g2', guestData);

      expect(mockFetch).toHaveBeenCalledWith('/groups/g2/guest-player', {
        method: 'POST',
        body: guestData,
      });
    });
  });
});
