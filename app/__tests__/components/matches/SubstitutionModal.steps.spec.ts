import { describe, it, expect, beforeEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import SubstitutionModal from '../../../components/matches/SubstitutionModal.vue';

interface TeamFixture {
  id: number;
  name: string;
  color: string;
}

interface PoolFixture {
  reserves: { id: number; name: string }[];
  waitingTeams: { team: TeamFixture; players: { id: number; name: string }[] }[];
}

const teamA: TeamFixture = { id: 1, name: 'Brancos', color: '#fff' };
const teamB: TeamFixture = { id: 2, name: 'Pretos', color: '#000' };
const teamC: TeamFixture = { id: 3, name: 'Azuis', color: '#00f' };

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

const pool: PoolFixture = {
  reserves: [{ id: 99, name: 'Reserva1' }],
  waitingTeams: [
    {
      team: teamC,
      players: [
        { id: 31, name: 'Eve' },
        { id: 32, name: 'Frank' },
      ],
    },
  ],
};

function mountModal(overrides: Record<string, unknown> = {}): VueWrapper {
  return mount(SubstitutionModal, {
    props: {
      show: true,
      teams: [teamA, teamB, teamC],
      activeMatch,
      availablePool: pool,
      loading: false,
      ...overrides,
    },
  });
}

describe('MatchesSubstitutionModal - wizard steps 1-3', () => {
  let wrapper: VueWrapper;

  beforeEach(() => {
    wrapper = mountModal();
  });

  describe('Step 1: select receiving team', () => {
    it('shows both active-match teams as options', () => {
      const options = wrapper.findAll('[data-testid="sub-team-option"]');
      expect(options).toHaveLength(2);
      const texts = options.map((o) => o.text());
      expect(texts.join(' ')).toContain('Brancos');
      expect(texts.join(' ')).toContain('Pretos');
    });

    it('advances to step 2 after selecting a team', async () => {
      await wrapper.findAll('[data-testid="sub-team-option"]')[0].trigger('click');
      expect(wrapper.find('[data-testid="sub-step-2"]').exists()).toBe(true);
    });
  });

  describe('Step 2: select player out (only from selected team)', () => {
    beforeEach(async () => {
      await wrapper.findAll('[data-testid="sub-team-option"]')[0].trigger('click');
    });

    it('shows only players of the selected team', () => {
      const options = wrapper.findAll('[data-testid="sub-player-out"]');
      const texts = options.map((o) => o.text());
      expect(texts.join(' ')).toContain('Alice');
      expect(texts.join(' ')).toContain('Bob');
      expect(texts.join(' ')).not.toContain('Carol');
      expect(texts.join(' ')).not.toContain('Dan');
    });

    it('advances to step 3 after selecting player out', async () => {
      await wrapper.findAll('[data-testid="sub-player-out"]')[0].trigger('click');
      expect(wrapper.find('[data-testid="sub-step-3"]').exists()).toBe(true);
    });

    it('has back button going to step 1', async () => {
      await wrapper.find('[data-testid="sub-back"]').trigger('click');
      expect(wrapper.find('[data-testid="sub-step-1"]').exists()).toBe(true);
    });
  });

  describe('Step 3: select player in (grouped pool)', () => {
    beforeEach(async () => {
      await wrapper.findAll('[data-testid="sub-team-option"]')[0].trigger('click');
      await wrapper.findAll('[data-testid="sub-player-out"]')[0].trigger('click');
    });

    it('renders reserves group', () => {
      expect(wrapper.find('[data-testid="sub-pool-group-reserves"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="sub-pool-group-reserves"]').text()).toContain('Reserva1');
    });

    it('renders waiting team group with team tag', () => {
      const waiting = wrapper.find('[data-testid="sub-pool-group-team-3"]');
      expect(waiting.exists()).toBe(true);
      expect(waiting.text()).toContain('Azuis');
      expect(waiting.text()).toContain('Eve');
      expect(waiting.text()).toContain('Frank');
    });

    it('advances to step 4 after selecting player in', async () => {
      await wrapper.findAll('[data-testid="sub-player-in"]')[0].trigger('click');
      expect(wrapper.find('[data-testid="sub-step-4"]').exists()).toBe(true);
    });

    it('has back button going to step 2', async () => {
      await wrapper.find('[data-testid="sub-back"]').trigger('click');
      expect(wrapper.find('[data-testid="sub-step-2"]').exists()).toBe(true);
    });
  });
});
