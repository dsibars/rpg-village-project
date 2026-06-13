import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import GambitTestResults from '../../../ux/features/gambit/components/GambitTestResults.vue'

const mockResult = {
  runs: 10,
  victories: 7,
  avgHpRemaining: 45,
  avgMpRemaining: 30,
  log: ['Turn 1: Attack', 'Turn 2: Defend']
}

describe('GambitTestResults.vue', () => {
  it('renders health score', () => {
    const wrapper = mount(GambitTestResults, {
      props: { result: mockResult, healthScore: 85, rating: 'ironclad' },
      global: { provide: { i18n: { t: (k) => k }, currentLanguage: { value: 'en' } } }
    })
    expect(wrapper.text()).toContain('85')
    expect(wrapper.find('.rating-ironclad').exists()).toBe(true)
  })

  it('calculates win rate correctly', () => {
    const wrapper = mount(GambitTestResults, {
      props: { result: mockResult, healthScore: 50, rating: 'functional' },
      global: { provide: { i18n: { t: (k) => k }, currentLanguage: { value: 'en' } } }
    })
    expect(wrapper.text()).toContain('70%')
    expect(wrapper.text()).toContain('7/10')
  })
})
