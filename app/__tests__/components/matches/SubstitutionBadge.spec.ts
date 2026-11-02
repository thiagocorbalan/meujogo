import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import SubstitutionBadge from '../../../components/matches/SubstitutionBadge.vue';

describe('MatchesSubstitutionBadge', () => {
  it('renders when isSubstitute is true', () => {
    const wrapper = mount(SubstitutionBadge, {
      props: { isSubstitute: true },
    });
    expect(wrapper.find('[data-testid="substitution-badge"]').exists()).toBe(true);
  });

  it('does not render when isSubstitute is false', () => {
    const wrapper = mount(SubstitutionBadge, {
      props: { isSubstitute: false },
    });
    expect(wrapper.find('[data-testid="substitution-badge"]').exists()).toBe(false);
  });

  it('shows sourceTeamName when provided', () => {
    const wrapper = mount(SubstitutionBadge, {
      props: { isSubstitute: true, sourceTeamName: 'Azuis' },
    });
    expect(wrapper.text()).toContain('Azuis');
  });

  it('has aria-label describing substitute status', () => {
    const wrapper = mount(SubstitutionBadge, {
      props: { isSubstitute: true, sourceTeamName: 'Azuis' },
    });
    const badge = wrapper.find('[data-testid="substitution-badge"]');
    expect(badge.attributes('aria-label')).toBeTruthy();
    expect(badge.attributes('aria-label')).toContain('Azuis');
  });
});
