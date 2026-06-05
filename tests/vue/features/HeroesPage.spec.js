import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { shallowRef } from 'vue'
import HeroesPage from '../../../ux/features/heroes/HeroesPage.vue'

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

describe('HeroesPage', () => {
  it('renders heading and placeholder', () => {
    const wrapper = mountWithProviders(HeroesPage)
    expect(wrapper.text()).toContain('shared_uxelm_nav_heroes')
    expect(wrapper.text()).toContain('Hero roster')
  })
})
