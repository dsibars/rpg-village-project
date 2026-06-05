import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { shallowRef } from 'vue'
import AdventurePage from '../../../ux/features/adventure/AdventurePage.vue'

function mountWithProviders(component) {
  return mount(component, {
    global: {
      provide: {
        gameState: shallowRef({}),
        i18n: { t: (k) => k },
        currentLanguage: { value: 'en' },
        adapter: { dispatch: () => ({ success: true }) }
      }
    }
  })
}

describe('AdventurePage', () => {
  it('renders heading and tab navigation', () => {
    const wrapper = mountWithProviders(AdventurePage)
    expect(wrapper.text()).toContain('shared_uxelm_nav_explore')
    expect(wrapper.find('.tab-nav').exists()).toBe(true)
  })

  it('switches tab content when a tab is clicked', async () => {
    const wrapper = mountWithProviders(AdventurePage)
    const tabs = wrapper.findAll('.tab-nav .tab-btn')
    expect(tabs.length).toBe(4)

    await tabs[1].trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('shared_uxelm_nav_bestiary')
  })
})
