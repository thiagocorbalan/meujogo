import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import LateGoalModal from '../../../components/matches/LateGoalModal.vue';

interface MatchOption {
  id: number;
  teamAId: number;
  teamAName: string;
  teamBId: number;
  teamBName: string;
  scoreA: number;
  scoreB: number;
}

function makeMatch(overrides: Partial<MatchOption> = {}): MatchOption {
  return {
    id: 42,
    teamAId: 1,
    teamAName: 'Azul',
    teamBId: 2,
    teamBName: 'Vermelho',
    scoreA: 2,
    scoreB: 1,
    ...overrides,
  };
}

const ALERT_TEXT =
  'O gol sera adicionado apenas ao placar do time. Nenhum jogador sera creditado. O resultado oficial da partida (vencedor/empate) nao sera alterado.';

describe('MatchesLateGoalModal', () => {
  it('renders the prominent alert with exact REQ-2 AC-9 text', () => {
    const wrapper = mount(LateGoalModal, {
      props: {
        matches: [makeMatch()],
        initialMatchId: 42,
        loading: false,
      },
    });

    const alert = wrapper.find('[role="alert"]');
    expect(alert.exists()).toBe(true);
    expect(alert.text()).toContain(ALERT_TEXT);
  });

  it('disables the confirm button until a team is selected', async () => {
    const wrapper = mount(LateGoalModal, {
      props: {
        matches: [makeMatch()],
        initialMatchId: null,
        loading: false,
      },
    });

    const confirmButton = wrapper.get('button[data-testid="late-goal-confirm"]');
    expect(confirmButton.attributes('disabled')).toBeDefined();
  });

  it('emits confirm with { matchId, teamId } and NEVER playerId', async () => {
    const wrapper = mount(LateGoalModal, {
      props: {
        matches: [makeMatch({ id: 42 })],
        initialMatchId: 42,
        loading: false,
      },
    });

    const matchSelect = wrapper.get('select[data-testid="late-goal-match"]');
    await matchSelect.setValue('42');

    const teamSelect = wrapper.get('select[data-testid="late-goal-team"]');
    await teamSelect.setValue('1');

    await wrapper.get('button[data-testid="late-goal-confirm"]').trigger('click');

    const events = wrapper.emitted('confirm');
    expect(events).toBeTruthy();
    const payload = events?.[0]?.[0] as Record<string, unknown>;
    expect(payload.matchId).toBe(42);
    expect(payload.teamId).toBe(1);
    expect(payload).not.toHaveProperty('playerId');
  });

  it('emits close event when close button is clicked', async () => {
    const wrapper = mount(LateGoalModal, {
      props: {
        matches: [makeMatch()],
        initialMatchId: 42,
        loading: false,
      },
    });

    await wrapper.get('button[data-testid="late-goal-close"]').trigger('click');

    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('includes optional reason field in confirm payload when filled', async () => {
    const wrapper = mount(LateGoalModal, {
      props: {
        matches: [makeMatch({ id: 42 })],
        initialMatchId: 42,
        loading: false,
      },
    });

    await wrapper.get('select[data-testid="late-goal-match"]').setValue('42');
    await wrapper.get('select[data-testid="late-goal-team"]').setValue('2');
    await wrapper.get('textarea[data-testid="late-goal-reason"]').setValue('torcida esqueceu');

    await wrapper.get('button[data-testid="late-goal-confirm"]').trigger('click');

    const payload = wrapper.emitted('confirm')?.[0]?.[0] as Record<string, unknown>;
    expect(payload.reason).toBe('torcida esqueceu');
    expect(payload).not.toHaveProperty('playerId');
  });

  it('disables confirm button when loading is true', () => {
    const wrapper = mount(LateGoalModal, {
      props: {
        matches: [makeMatch({ id: 42 })],
        initialMatchId: 42,
        loading: true,
      },
    });

    const confirmButton = wrapper.get('button[data-testid="late-goal-confirm"]');
    expect(confirmButton.attributes('disabled')).toBeDefined();
  });

  it('uses role="dialog" with aria-modal', () => {
    const wrapper = mount(LateGoalModal, {
      props: {
        matches: [makeMatch()],
        initialMatchId: 42,
        loading: false,
      },
    });

    const dialog = wrapper.find('[role="dialog"]');
    expect(dialog.exists()).toBe(true);
    expect(dialog.attributes('aria-modal')).toBe('true');
  });

  it('labels form controls (label[for] bound to ids)', () => {
    const wrapper = mount(LateGoalModal, {
      props: {
        matches: [makeMatch()],
        initialMatchId: 42,
        loading: false,
      },
    });

    const labels = wrapper.findAll('label');
    expect(labels.length).toBeGreaterThanOrEqual(2);
    for (const label of labels) {
      const forAttr = label.attributes('for');
      if (forAttr) {
        expect(wrapper.find(`#${forAttr}`).exists()).toBe(true);
      }
    }
  });
});
