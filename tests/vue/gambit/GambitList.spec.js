import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import GambitList from '../../../ux/features/gambit/components/GambitList.vue'

const mockGambits = [
  { id: 'g1', conditions: [], action: {}, target: '', enabled: true },
  { id: 'g2', conditions: [], action: {}, target: '', enabled: true }
]

describe('GambitList.vue', () => {
  it('renders gambit rows', () => {
    const wrapper = mount(GambitList, {
      props: { gambits: mockGambits, fallbackAction: 'defend', learnedFamilies: [] },
      global: { provide: { i18n: { t: (k) => k }, currentLanguage: { value: 'en' } } }
    })
    expect(wrapper.findAllComponents({ name: 'GambitRow' }).length).toBe(2)
  })

  it('renders correct number of empty slots', () => {
    const wrapper = mount(GambitList, {
      props: { gambits: mockGambits, fallbackAction: 'defend', learnedFamilies: [] },
      global: { provide: { i18n: { t: (k) => k }, currentLanguage: { value: 'en' } } }
    })
    expect(wrapper.findAll('.gambit-slot-empty').length).toBe(10)
  })

  it('shows count indicator', () => {
    const wrapper = mount(GambitList, {
      props: { gambits: mockGambits, fallbackAction: 'defend', learnedFamilies: [] },
      global: { provide: { i18n: { t: (k) => k }, currentLanguage: { value: 'en' } } }
    })
    expect(wrapper.find('.gambit-count').text()).toContain('2')
    expect(wrapper.find('.gambit-count').text()).toContain('12')
  })
})
