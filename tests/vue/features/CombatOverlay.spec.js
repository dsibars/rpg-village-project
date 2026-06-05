import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { shallowRef } from 'vue'
import CombatOverlay from '../../../ux/features/combat/CombatOverlay.vue'

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

describe('CombatOverlay', () => {
  it('renders overlay title and placeholder', () => {
    const wrapper = mountWithProviders(CombatOverlay)
    expect(wrapper.text()).toContain('combat_uxelm_battle_title')
  })

  it('emits close when overlay close is triggered', async () => {
    const wrapper = mountWithProviders(CombatOverlay)
    await wrapper.find('.btn-close').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })
})
