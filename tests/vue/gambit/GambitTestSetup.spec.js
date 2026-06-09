import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import GambitTestSetup from '../../../ux/features/gambit/components/GambitTestSetup.vue'

describe('GambitTestSetup.vue', () => {
  const templates = [
    { id: 'slime', name: 'Green Slime' },
    { id: 'goblin', name: 'Goblin' }
  ]

  it('renders enemy catalog', () => {
    const wrapper = mount(GambitTestSetup, {
      props: { bestiary: ['slime'], enemyTemplates: templates },
      global: { provide: { i18n: { t: (k) => k }, currentLanguage: { value: 'en' } } }
    })
    expect(wrapper.text()).toContain('Green Slime')
  })

  it('selects enemy on click', async () => {
    const wrapper = mount(GambitTestSetup, {
      props: { bestiary: ['slime'], enemyTemplates: templates },
      global: { provide: { i18n: { t: (k) => k }, currentLanguage: { value: 'en' } } }
    })
    await wrapper.find('.enemy-card').trigger('click')
    expect(wrapper.find('.enemy-card.selected').exists()).toBe(true)
  })

  it('emits start with selected enemies', async () => {
    const wrapper = mount(GambitTestSetup, {
      props: { bestiary: ['slime'], enemyTemplates: templates },
      global: { provide: { i18n: { t: (k) => k }, currentLanguage: { value: 'en' } } }
    })
    await wrapper.find('.enemy-card').trigger('click')
    await wrapper.find('.btn-start').trigger('click')
    expect(wrapper.emitted('start')).toBeTruthy()
    expect(wrapper.emitted('start')[0][0].length).toBe(1)
  })
})
