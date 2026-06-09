import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { shallowRef } from 'vue'
import HeroEmptyState from '../../../../ux/features/heroes/components/HeroEmptyState.vue'

function mountWithProviders() {
  return mount(HeroEmptyState, {
    global: {
      provide: {
        gameState: shallowRef({}),
        i18n: { t: (k) => k },
        currentLanguage: { value: 'en' }
      }
    }
  })
}

describe('HeroEmptyState', () => {
  it('renders select prompt', () => {
    const wrapper = mountWithProviders()
    expect(wrapper.text()).toContain('heroes_uxelm_select_prompt')
  })
})
