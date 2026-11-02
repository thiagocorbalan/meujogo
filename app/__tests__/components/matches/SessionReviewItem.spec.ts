import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import SessionReviewItem from '../../../components/matches/SessionReviewItem.vue';

interface GoalRow {
  id: number;
  playerName: string | null;
  teamName: string;
  source: 'LIVE' | 'LATE';
  minute: number | null;
}

interface ReviewMatch {
  id: number;
  matchOrder: number;
  teamAName: string;
  teamBName: string;
  scoreA: number;
  scoreB: number;
  goals: GoalRow[];
}

function makeMatch(overrides: Partial<ReviewMatch> = {}): ReviewMatch {
  return {
    id: 10,
    matchOrder: 1,
    teamAName: 'Azul',
    teamBName: 'Vermelho',
    scoreA: 2,
    scoreB: 1,
    goals: [
      { id: 1, playerName: 'Thiago', teamName: 'Azul', source: 'LIVE', minute: 5 },
      { id: 2, playerName: 'Bruno', teamName: 'Azul', source: 'LIVE', minute: 8 },
      { id: 3, playerName: 'Caio', teamName: 'Vermelho', source: 'LIVE', minute: 6 },
    ],
    ...overrides,
  };
}

describe('MatchesSessionReviewItem', () => {
  it('renders the scoreboard with both team names and scores', () => {
    const wrapper = mount(SessionReviewItem, {
      props: { match: makeMatch(), disabled: false },
    });

    expect(wrapper.text()).toContain('Azul');
    expect(wrapper.text()).toContain('Vermelho');
    expect(wrapper.text()).toContain('2');
    expect(wrapper.text()).toContain('1');
  });

  it('renders each goal from the goals list', () => {
    const wrapper = mount(SessionReviewItem, {
      props: { match: makeMatch(), disabled: false },
    });

    expect(wrapper.text()).toContain('Thiago');
    expect(wrapper.text()).toContain('Bruno');
    expect(wrapper.text()).toContain('Caio');
  });

  it('marks late goals visually with a "Gol tardio" indicator', () => {
    const wrapper = mount(SessionReviewItem, {
      props: {
        match: makeMatch({
          goals: [
            { id: 1, playerName: null, teamName: 'Azul', source: 'LATE', minute: null },
          ],
        }),
        disabled: false,
      },
    });

    expect(wrapper.text()).toContain('Gol tardio');
  });

  it('emits "add-late-goal" with the match id when the add button is clicked', async () => {
    const wrapper = mount(SessionReviewItem, {
      props: { match: makeMatch({ id: 99 }), disabled: false },
    });

    await wrapper.get('button[data-testid="add-late-goal"]').trigger('click');

    const events = wrapper.emitted('add-late-goal');
    expect(events).toBeTruthy();
    expect(events?.[0]).toEqual([99]);
  });

  it('disables the add button when disabled is true', () => {
    const wrapper = mount(SessionReviewItem, {
      props: { match: makeMatch(), disabled: true },
    });

    const button = wrapper.get('button[data-testid="add-late-goal"]');
    expect(button.attributes('disabled')).toBeDefined();
  });

  it('renders an empty state when goals list is empty', () => {
    const wrapper = mount(SessionReviewItem, {
      props: { match: makeMatch({ goals: [] }), disabled: false },
    });

    expect(wrapper.text()).toContain('Nenhum gol');
  });
});
