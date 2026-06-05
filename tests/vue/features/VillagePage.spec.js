import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { shallowRef } from 'vue'
import VillagePage from '../../../ux/features/village/VillagePage.vue'

function mountWithProviders(component) {
  return mount(component, {
    global: {
      provide: {
        gameState: shallowRef({}),
        i18n: { t: (k) => k },
        currentLanguage: { value: 'en' }
      }
    }
  })
}

describe('VillagePage', () => {
  it('renders heading and placeholder', () => {
    const wrapper = mountWithProviders(VillagePage)
    expect(wrapper.text()).toContain('shared_uxelm_nav_village')
    expect(wrapper.text()).toContain('Village overview')
  })
})
