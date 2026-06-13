import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { shallowRef } from 'vue'
import TownPage from '../../../ux/features/town/TownPage.vue'

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

describe('TownPage', () => {
  it('renders heading and tab navigation', () => {
    const wrapper = mountWithProviders(TownPage)
    expect(wrapper.text()).toContain('shared_uxelm_nav_buildings')
    expect(wrapper.find('.tab-nav').exists()).toBe(true)
  })

  it('renders five town tabs', () => {
    const wrapper = mountWithProviders(TownPage)
    const tabs = wrapper.findAll('.tab-nav .tab-btn')
    expect(tabs.length).toBe(5)
  })
})
