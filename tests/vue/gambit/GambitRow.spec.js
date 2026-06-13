import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import GambitRow from '../../../ux/features/gambit/components/GambitRow.vue'

const mockGambit = {
  id: 'g1',
  conditions: [{ op: 'SINGLE', left: { type: 'self_hp', operator: '<', value: 0.5 } }],
  action: { type: 'skill', payload: 'power_strike', tier: 2 },
  target: 'lowest_hp_enemy',
  enabled: true
}

describe('GambitRow.vue', () => {
  it('renders gambit index', () => {
    const wrapper = mount(GambitRow, {
      props: { gambit: mockGambit, index: 0, isFirst: true, isLast: false },
      global: { provide: { i18n: { t: (k) => k }, currentLanguage: { value: 'en' } } }
    })
    expect(wrapper.find('.gambit-index').text()).toBe('1')
  })

  it('disables move-up when isFirst', () => {
    const wrapper = mount(GambitRow, {
      props: { gambit: mockGambit, index: 0, isFirst: true, isLast: false },
      global: { provide: { i18n: { t: (k) => k }, currentLanguage: { value: 'en' } } }
    })
    expect(wrapper.find('[aria-label="shared_aria_move_up"]').attributes('disabled')).toBeDefined()
  })

  it('emits remove on click', async () => {
    const wrapper = mount(GambitRow, {
      props: { gambit: mockGambit, index: 0, isFirst: false, isLast: false },
      global: { provide: { i18n: { t: (k) => k }, currentLanguage: { value: 'en' } } }
    })
    await wrapper.find('[aria-label="shared_aria_remove"]').trigger('click')
    expect(wrapper.emitted('remove')).toBeTruthy()
    expect(wrapper.emitted('remove')[0]).toEqual(['g1'])
  })

  it('shows disabled styling when gambit.enabled is false', () => {
    const disabledGambit = { ...mockGambit, enabled: false }
    const wrapper = mount(GambitRow, {
      props: { gambit: disabledGambit, index: 0, isFirst: false, isLast: false },
      global: { provide: { i18n: { t: (k) => k }, currentLanguage: { value: 'en' } } }
    })
    expect(wrapper.find('.gambit-row--disabled').exists()).toBe(true)
  })
})
