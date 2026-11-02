import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import GoalListItem from '../../../components/matches/GoalListItem.vue';

interface GoalDisplay {
  id: number;
  playerName: string | null;
  teamName: string;
  teamColor: string;
  minute: number | null;
  source: 'LIVE' | 'LATE';
}

function makeGoal(overrides: Partial<GoalDisplay> = {}): GoalDisplay {
  return {
    id: 1,
    playerName: 'Thiago',
    teamName: 'Time A',
    teamColor: '#3b82f6',
    minute: 5,
    source: 'LIVE',
    ...overrides,
  };
}

describe('MatchesGoalListItem', () => {
  it('renders player name, team name, and minute', () => {
    const wrapper = mount(GoalListItem, {
      props: { goal: makeGoal(), disabled: false },
    });

    expect(wrapper.text()).toContain('Thiago');
    expect(wrapper.text()).toContain('Time A');
    expect(wrapper.text()).toContain("5'");
  });

  it('renders "Gol tardio" label when source is LATE and playerName is null', () => {
    const wrapper = mount(GoalListItem, {
      props: {
        goal: makeGoal({ playerName: null, source: 'LATE', minute: null }),
        disabled: false,
      },
    });

    expect(wrapper.text()).toContain('Gol tardio');
  });

  it('exposes aria-label with player, team and minute on the undo button', () => {
    const wrapper = mount(GoalListItem, {
      props: { goal: makeGoal(), disabled: false },
    });

    const button = wrapper.get('button');
    const ariaLabel = button.attributes('aria-label') ?? '';
    expect(ariaLabel).toContain('Thiago');
    expect(ariaLabel).toContain('Time A');
    expect(ariaLabel).toContain('5');
  });

  it('undo button meets minimum 48x48 touch target', () => {
    const wrapper = mount(GoalListItem, {
      props: { goal: makeGoal(), disabled: false },
    });

    const button = wrapper.get('button');
    const classes = button.classes().join(' ');
    expect(classes).toMatch(/min-h-\[48px\]|h-12|min-h-12/);
    expect(classes).toMatch(/min-w-\[48px\]|w-12|min-w-12/);
  });

  it('emits "undo" with the goal when the button is clicked', async () => {
    const goal = makeGoal();
    const wrapper = mount(GoalListItem, {
      props: { goal, disabled: false },
    });

    await wrapper.get('button').trigger('click');

    expect(wrapper.emitted('undo')).toBeTruthy();
    expect(wrapper.emitted('undo')?.[0]).toEqual([goal]);
  });

  it('does not emit when disabled', async () => {
    const wrapper = mount(GoalListItem, {
      props: { goal: makeGoal(), disabled: true },
    });

    await wrapper.get('button').trigger('click');

    expect(wrapper.emitted('undo')).toBeFalsy();
  });

  it('applies the disabled attribute to the button when disabled', () => {
    const wrapper = mount(GoalListItem, {
      props: { goal: makeGoal(), disabled: true },
    });

    expect(wrapper.get('button').attributes('disabled')).toBeDefined();
  });
});
