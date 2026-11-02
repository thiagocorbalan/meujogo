import { describe, it, expect, beforeEach, vi } from 'vitest';

import { useMatches } from '../../composables/useMatches';

const mockFetch = vi.fn();

vi.stubGlobal('useApi', () => ({
  fetch: mockFetch,
}));

describe('useMatches composable', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('registerLateGoal()', () => {
    it('calls POST /matches/:id/late-goal with teamId body', async () => {
      mockFetch.mockResolvedValue({ id: 10, scoreA: 3, scoreB: 1 });

      const { registerLateGoal } = useMatches();
      await registerLateGoal(10, { teamId: 1 });

      expect(mockFetch).toHaveBeenCalledWith('/matches/10/late-goal', {
        method: 'POST',
        body: { teamId: 1 },
      });
    });

    it('includes optional reason when provided', async () => {
      mockFetch.mockResolvedValue({ id: 10 });

      const { registerLateGoal } = useMatches();
      await registerLateGoal(10, { teamId: 2, reason: 'gol esquecido' });

      expect(mockFetch).toHaveBeenCalledWith('/matches/10/late-goal', {
        method: 'POST',
        body: { teamId: 2, reason: 'gol esquecido' },
      });
    });

    it('propagates errors from $fetch', async () => {
      mockFetch.mockRejectedValue(new Error('Network failure'));

      const { registerLateGoal } = useMatches();
      await expect(registerLateGoal(10, { teamId: 1 })).rejects.toThrow('Network failure');
    });
  });

  describe('undoLateGoal()', () => {
    it('calls DELETE /matches/:id/late-goal/:goalId', async () => {
      mockFetch.mockResolvedValue({ id: 10, scoreA: 2, scoreB: 1 });

      const { undoLateGoal } = useMatches();
      await undoLateGoal(10, 500);

      expect(mockFetch).toHaveBeenCalledWith('/matches/10/late-goal/500', {
        method: 'DELETE',
      });
    });

    it('propagates errors from $fetch', async () => {
      mockFetch.mockRejectedValue(new Error('Not found'));

      const { undoLateGoal } = useMatches();
      await expect(undoLateGoal(10, 500)).rejects.toThrow('Not found');
    });
  });
});
