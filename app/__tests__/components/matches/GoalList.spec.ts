import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import GoalList from '../../../components/matches/GoalList.vue';
import GoalListItem from '../../../components/matches/GoalListItem.vue';

interface GoalDisplay {
  id: number;
  playerName: string | null;
  teamName: string;
  teamColor: string;
  minute: number | null;
  source: 'LIVE' | 'LATE';
}

function makeGoal(id: number, overrides: Partial<GoalDisplay> = {}): GoalDisplay {
  return {
    id,
    playerName: `Jogador ${id}`,
    teamName: 'Time A',
    teamColor: '#3b82f6',
    minute: id,
    source: 'LIVE',
    ...overrides,
  };
}

describe('MatchesGoalList', () => {
  it('renders a GoalListItem per goal', () => {
    const goals = [makeGoal(1), makeGoal(2), makeGoal(3)];
    const wrapper = mount(GoalList, {
      props: { goals, disabled: false },
    });

    expect(wrapper.findAllComponents(GoalListItem)).toHaveLength(3);
  });

  it('renders empty state when goals is empty', () => {
    const wrapper = mount(GoalList, {
      props: { goals: [], disabled: false },
    });

    expect(wrapper.findAllComponents(GoalListItem)).toHaveLength(0);
    expect(wrapper.text()).toContain('Nenhum gol registrado');
  });

  it('has role="dialog" and aria-modal="true"', () => {
    const wrapper = mount(GoalList, {
      props: { goals: [makeGoal(1)], disabled: false },
    });

    const dialog = wrapper.get('[role="dialog"]');
    expect(dialog.attributes('aria-modal')).toBe('true');
  });

  it('has aria-labelledby pointing to the title element', () => {
    const wrapper = mount(GoalList, {
      props: { goals: [makeGoal(1)], disabled: false },
    });

    const dialog = wrapper.get('[role="dialog"]');
    const labelledBy = dialog.attributes('aria-labelledby');
    expect(labelledBy).toBeTruthy();
    const title = wrapper.get(`#${labelledBy}`);
    expect(title.text()).toContain('Gols');
  });

  it('emits "close" when the close button is clicked', async () => {
    const wrapper = mount(GoalList, {
      props: { goals: [makeGoal(1)], disabled: false },
    });

    const closeButton = wrapper.get('button[aria-label="Fechar lista de gols"]');
    await closeButton.trigger('click');

    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('emits "undo-goal" when a child GoalListItem emits undo', async () => {
    const goals = [makeGoal(1), makeGoal(2)];
    const wrapper = mount(GoalList, {
      props: { goals, disabled: false },
    });

    const firstItem = wrapper.findAllComponents(GoalListItem)[0];
    firstItem.vm.$emit('undo', goals[0]);
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('undo-goal')).toBeTruthy();
    expect(wrapper.emitted('undo-goal')?.[0]).toEqual([goals[0]]);
  });

  it('propagates disabled prop to GoalListItem children', () => {
    const goals = [makeGoal(1)];
    const wrapper = mount(GoalList, {
      props: { goals, disabled: true },
    });

    const item = wrapper.findComponent(GoalListItem);
    expect(item.props('disabled')).toBe(true);
  });
});
