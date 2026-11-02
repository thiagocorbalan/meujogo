import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import SessionReviewPanel from '../../../components/matches/SessionReviewPanel.vue';

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

function makeMatch(id: number, order: number, goals: GoalRow[] = []): ReviewMatch {
  return {
    id,
    matchOrder: order,
    teamAName: `Time A${id}`,
    teamBName: `Time B${id}`,
    scoreA: 2,
    scoreB: 1,
    goals,
  };
}

describe('MatchesSessionReviewPanel', () => {
  it('renders one item per match', () => {
    const wrapper = mount(SessionReviewPanel, {
      props: {
        matches: [makeMatch(1, 1), makeMatch(2, 2), makeMatch(3, 3)],
        disabled: false,
      },
      global: {
        stubs: {
          MatchesSessionReviewItem: {
            props: ['match', 'disabled'],
            template: '<div data-testid="review-item">{{ match.id }}</div>',
          },
        },
      },
    });

    const items = wrapper.findAll('[data-testid="review-item"]');
    expect(items).toHaveLength(3);
  });

  it('propagates add-late-goal from items', async () => {
    const wrapper = mount(SessionReviewPanel, {
      props: {
        matches: [makeMatch(1, 1)],
        disabled: false,
      },
      global: {
        stubs: {
          MatchesSessionReviewItem: {
            props: ['match', 'disabled'],
            emits: ['add-late-goal'],
            template:
              '<button data-testid="review-item" @click="$emit(\'add-late-goal\', match.id)">x</button>',
          },
        },
      },
    });

    await wrapper.get('[data-testid="review-item"]').trigger('click');

    const events = wrapper.emitted('add-late-goal');
    expect(events).toBeTruthy();
    expect(events?.[0]).toEqual([1]);
  });

  it('renders empty state when matches is empty', () => {
    const wrapper = mount(SessionReviewPanel, {
      props: { matches: [], disabled: false },
    });

    expect(wrapper.text()).toContain('Nenhuma partida');
  });

  it('emits close when the close button is clicked', async () => {
    const wrapper = mount(SessionReviewPanel, {
      props: { matches: [makeMatch(1, 1)], disabled: false },
    });

    await wrapper.get('button[data-testid="review-close"]').trigger('click');

    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('uses role=dialog with aria-modal=true', () => {
    const wrapper = mount(SessionReviewPanel, {
      props: { matches: [makeMatch(1, 1)], disabled: false },
    });

    const dialog = wrapper.find('[role="dialog"]');
    expect(dialog.exists()).toBe(true);
    expect(dialog.attributes('aria-modal')).toBe('true');
  });
});
