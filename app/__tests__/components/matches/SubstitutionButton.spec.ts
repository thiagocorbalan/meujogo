import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import SubstitutionButton from '../../../components/matches/SubstitutionButton.vue';

describe('MatchesSubstitutionButton', () => {
  it('renders with available pool count badge', () => {
    const wrapper = mount(SubstitutionButton, {
      props: { availableCount: 3, disabled: false },
    });
    expect(wrapper.text()).toContain('Substituir jogador');
    expect(wrapper.find('[data-testid="sub-available-count"]').text()).toContain('3');
  });

  it('is disabled when availableCount is 0', () => {
    const wrapper = mount(SubstitutionButton, {
      props: { availableCount: 0, disabled: false },
    });
    expect(wrapper.get('button').attributes('disabled')).toBeDefined();
  });

  it('is disabled when disabled prop is true', () => {
    const wrapper = mount(SubstitutionButton, {
      props: { availableCount: 5, disabled: true },
    });
    expect(wrapper.get('button').attributes('disabled')).toBeDefined();
  });

  it('has accessible tooltip/title explaining purpose', () => {
    const wrapper = mount(SubstitutionButton, {
      props: { availableCount: 2, disabled: false },
    });
    const btn = wrapper.get('button');
    expect(btn.attributes('title') || btn.attributes('aria-label')).toBeTruthy();
  });

  it('emits "open" event on click when enabled', async () => {
    const wrapper = mount(SubstitutionButton, {
      props: { availableCount: 2, disabled: false },
    });
    await wrapper.get('button').trigger('click');
    expect(wrapper.emitted('open')).toBeTruthy();
  });

  it('does not emit "open" when disabled', async () => {
    const wrapper = mount(SubstitutionButton, {
      props: { availableCount: 0, disabled: false },
    });
    await wrapper.get('button').trigger('click');
    expect(wrapper.emitted('open')).toBeFalsy();
  });

  it('meets minimum 44x44 touch target', () => {
    const wrapper = mount(SubstitutionButton, {
      props: { availableCount: 3, disabled: false },
    });
    const classes = wrapper.get('button').classes().join(' ');
    expect(classes).toMatch(/min-h-\[44px\]|min-h-\[48px\]|h-12|min-h-12/);
  });
});
