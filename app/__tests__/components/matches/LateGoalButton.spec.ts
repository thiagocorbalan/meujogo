import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import LateGoalButton from '../../../components/matches/LateGoalButton.vue';

interface LastMatchInfo {
  id: number;
  teamAName: string;
  teamBName: string;
  scoreA: number;
  scoreB: number;
}

function makeMatch(overrides: Partial<LastMatchInfo> = {}): LastMatchInfo {
  return {
    id: 42,
    teamAName: 'Azul',
    teamBName: 'Vermelho',
    scoreA: 2,
    scoreB: 1,
    ...overrides,
  };
}

describe('MatchesLateGoalButton', () => {
  it('renders the label "Adicionar gol esquecido"', () => {
    const wrapper = mount(LateGoalButton, {
      props: { lastFinishedMatch: makeMatch(), disabled: false },
    });
    expect(wrapper.text()).toContain('Adicionar gol esquecido');
  });

  it('emits "open-late-goal" with the match id when clicked', async () => {
    const wrapper = mount(LateGoalButton, {
      props: { lastFinishedMatch: makeMatch({ id: 99 }), disabled: false },
    });

    await wrapper.get('button').trigger('click');

    const events = wrapper.emitted('open-late-goal');
    expect(events).toBeTruthy();
    expect(events?.[0]).toEqual([99]);
  });

  it('does not emit when disabled', async () => {
    const wrapper = mount(LateGoalButton, {
      props: { lastFinishedMatch: makeMatch(), disabled: true },
    });

    await wrapper.get('button').trigger('click');

    expect(wrapper.emitted('open-late-goal')).toBeFalsy();
  });

  it('applies disabled attribute on the button when disabled', () => {
    const wrapper = mount(LateGoalButton, {
      props: { lastFinishedMatch: makeMatch(), disabled: true },
    });

    expect(wrapper.get('button').attributes('disabled')).toBeDefined();
  });

  it('button meets minimum 48x48 touch target', () => {
    const wrapper = mount(LateGoalButton, {
      props: { lastFinishedMatch: makeMatch(), disabled: false },
    });

    const classes = wrapper.get('button').classes().join(' ');
    expect(classes).toMatch(/min-h-\[48px\]|h-12|min-h-12/);
  });

  it('shows icon AND text (not icon-only)', () => {
    const wrapper = mount(LateGoalButton, {
      props: { lastFinishedMatch: makeMatch(), disabled: false },
    });

    const button = wrapper.get('button');
    expect(button.find('svg').exists()).toBe(true);
    expect(button.text().length).toBeGreaterThan(0);
  });

  it('does not render when lastFinishedMatch is null', () => {
    const wrapper = mount(LateGoalButton, {
      props: { lastFinishedMatch: null, disabled: false },
    });

    expect(wrapper.find('button').exists()).toBe(false);
  });
});
