import { describe, it, expect, beforeEach, vi } from 'vitest';

import { useSubstitution } from '../../composables/useSubstitution';

const mockFetch = vi.fn();

vi.stubGlobal('useApi', () => ({
  fetch: mockFetch,
}));

describe('useSubstitution composable', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('createSubstitution()', () => {
    it('POSTs to /sessions/:id/substitutions with full payload', async () => {
      mockFetch.mockResolvedValue({ id: 1 });
      const { createSubstitution } = useSubstitution();
      await createSubstitution(10, {
        teamId: 1,
        playerOutId: 11,
        playerInId: 99,
        type: 'TEMPORARIA',
        reason: 'CANSACO',
        minute: 5,
      });
      expect(mockFetch).toHaveBeenCalledWith('/sessions/10/substitutions', {
        method: 'POST',
        body: {
          teamId: 1,
          playerOutId: 11,
          playerInId: 99,
          type: 'TEMPORARIA',
          reason: 'CANSACO',
          minute: 5,
        },
      });
    });

    it('propagates errors from fetch', async () => {
      mockFetch.mockRejectedValue(new Error('Network failure'));
      const { createSubstitution } = useSubstitution();
      await expect(
        createSubstitution(10, {
          teamId: 1,
          playerOutId: 11,
          playerInId: 99,
          type: 'PERMANENTE',
          reason: 'LESAO',
        }),
      ).rejects.toThrow('Network failure');
    });
  });

  describe('getSubstitutions()', () => {
    it('GETs /sessions/:id/substitutions', async () => {
      mockFetch.mockResolvedValue([]);
      const { getSubstitutions } = useSubstitution();
      await getSubstitutions(10);
      expect(mockFetch).toHaveBeenCalledWith('/sessions/10/substitutions');
    });
  });

  describe('getAvailablePool()', () => {
    it('GETs /sessions/:id/substitutions/pool', async () => {
      mockFetch.mockResolvedValue({ reserves: [], waitingTeams: [] });
      const { getAvailablePool } = useSubstitution();
      await getAvailablePool(10);
      expect(mockFetch).toHaveBeenCalledWith('/sessions/10/substitutions/pool');
    });
  });

  describe('undoSubstitution()', () => {
    it('DELETEs /sessions/:id/substitutions/:subId', async () => {
      mockFetch.mockResolvedValue({ id: 1, isReverted: true });
      const { undoSubstitution } = useSubstitution();
      await undoSubstitution(10, 1);
      expect(mockFetch).toHaveBeenCalledWith('/sessions/10/substitutions/1', {
        method: 'DELETE',
      });
    });
  });
});
