import { describe, it, expect, beforeEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import SubstitutionModal from '../../../components/matches/SubstitutionModal.vue';

const teamA = { id: 1, name: 'Brancos', color: '#fff' };
const teamB = { id: 2, name: 'Pretos', color: '#000' };
const teamC = { id: 3, name: 'Azuis', color: '#00f' };

const activeMatch = {
  id: 100,
  teamAId: teamA.id,
  teamBId: teamB.id,
  teamA: {
    id: teamA.id,
    name: teamA.name,
    players: [
      { id: 11, name: 'Alice' },
      { id: 12, name: 'Bob' },
    ],
  },
  teamB: {
    id: teamB.id,
    name: teamB.name,
    players: [
      { id: 21, name: 'Carol' },
      { id: 22, name: 'Dan' },
    ],
  },
};

const poolWithReserveAndWaiting = {
  reserves: [{ id: 99, name: 'Reserva1' }],
  waitingTeams: [
    {
      team: teamC,
      players: [{ id: 31, name: 'Eve' }],
    },
  ],
};

async function advanceToStep4(wrapper: VueWrapper, playerInIndex = 0) {
  await wrapper.findAll('[data-testid="sub-team-option"]')[0].trigger('click');
  await wrapper.findAll('[data-testid="sub-player-out"]')[0].trigger('click');
  await wrapper.findAll('[data-testid="sub-player-in"]')[playerInIndex].trigger('click');
}

function mountModal(overrides: Record<string, unknown> = {}): VueWrapper {
  return mount(SubstitutionModal, {
    props: {
      show: true,
      teams: [teamA, teamB, teamC],
      activeMatch,
      availablePool: poolWithReserveAndWaiting,
      loading: false,
      ...overrides,
    },
  });
}

describe('MatchesSubstitutionModal - step 4 (reason, type, confirm)', () => {
  describe('reason -> type suggestion', () => {
    it('LESAO pre-selects PERMANENTE', async () => {
      const wrapper = mountModal();
      await advanceToStep4(wrapper);
      await wrapper.find('[data-testid="sub-reason-LESAO"]').trigger('click');
      const selected = wrapper.find('[data-testid="sub-type-PERMANENTE"]');
      expect(selected.attributes('aria-pressed')).toBe('true');
    });

    it('CANSACO pre-selects TEMPORARIA', async () => {
      const wrapper = mountModal();
      await advanceToStep4(wrapper);
      await wrapper.find('[data-testid="sub-reason-CANSACO"]').trigger('click');
      const selected = wrapper.find('[data-testid="sub-type-TEMPORARIA"]');
      expect(selected.attributes('aria-pressed')).toBe('true');
    });

    it('SEM_MOTIVO does not pre-select any type', async () => {
      const wrapper = mountModal();
      await advanceToStep4(wrapper);
      await wrapper.find('[data-testid="sub-reason-SEM_MOTIVO"]').trigger('click');
      const temp = wrapper.find('[data-testid="sub-type-TEMPORARIA"]');
      const perm = wrapper.find('[data-testid="sub-type-PERMANENTE"]');
      expect(temp.attributes('aria-pressed')).toBe('false');
      expect(perm.attributes('aria-pressed')).toBe('false');
    });

    it('allows overriding suggested type', async () => {
      const wrapper = mountModal();
      await advanceToStep4(wrapper);
      await wrapper.find('[data-testid="sub-reason-LESAO"]').trigger('click');
      await wrapper.find('[data-testid="sub-type-TEMPORARIA"]').trigger('click');
      const temp = wrapper.find('[data-testid="sub-type-TEMPORARIA"]');
      expect(temp.attributes('aria-pressed')).toBe('true');
    });
  });

  describe('inter-team warning', () => {
    it('shows "Time X ficara desfalcado" when PERMANENTE and playerIn comes from other team', async () => {
      const wrapper = mountModal();
      await advanceToStep4(wrapper, 1);
      await wrapper.find('[data-testid="sub-reason-LESAO"]').trigger('click');
      expect(wrapper.text()).toContain('desfalcado');
      expect(wrapper.text()).toContain('Azuis');
    });

    it('does not show warning when playerIn comes from reserves', async () => {
      const wrapper = mountModal();
      await advanceToStep4(wrapper, 0);
      await wrapper.find('[data-testid="sub-reason-LESAO"]').trigger('click');
      expect(wrapper.text()).not.toContain('desfalcado');
    });
  });

  describe('between-matches context', () => {
    it('disables TEMPORARIA when activeMatch is null', async () => {
      const wrapper = mountModal({ activeMatch: null });
      expect(wrapper.find('[data-testid="sub-between-matches-notice"]').exists()).toBe(true);
    });
  });

  describe('confirm', () => {
    it('emits confirm with full payload', async () => {
      const wrapper = mountModal();
      await advanceToStep4(wrapper);
      await wrapper.find('[data-testid="sub-reason-CANSACO"]').trigger('click');
      await wrapper.find('[data-testid="sub-confirm"]').trigger('click');
      const events = wrapper.emitted('confirm');
      expect(events).toBeTruthy();
      expect(events?.[0]?.[0]).toMatchObject({
        teamId: 1,
        playerOutId: 11,
        playerInId: 99,
        type: 'TEMPORARIA',
        reason: 'CANSACO',
      });
    });

    it('confirm is disabled until reason + type chosen', async () => {
      const wrapper = mountModal();
      await advanceToStep4(wrapper);
      const confirm = wrapper.find('[data-testid="sub-confirm"]');
      expect(confirm.attributes('disabled')).toBeDefined();
    });

    it('shows visual summary in step 4', async () => {
      const wrapper = mountModal();
      await advanceToStep4(wrapper);
      const summary = wrapper.find('[data-testid="sub-summary"]');
      expect(summary.exists()).toBe(true);
      expect(summary.text()).toContain('Alice');
      expect(summary.text()).toContain('Reserva1');
    });
  });
});
