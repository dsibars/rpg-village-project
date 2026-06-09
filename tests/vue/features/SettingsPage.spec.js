import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { shallowRef } from 'vue'
import SettingsPage from '../../../ux/features/settings/SettingsPage.vue'

function mountWithProviders(component) {
  return mount(component, {
    global: {
      provide: {
        gameState: shallowRef({}),
        i18n: { t: (k) => k },
        currentLanguage: { value: 'en' },
        adapter: { dispatch: () => ({ success: true }) },
        engine: { getCurrentSlotIndex: () => 0 }
      }
    }
  })
}

describe('SettingsPage', () => {
  it('renders heading and placeholder', () => {
    const wrapper = mountWithProviders(SettingsPage)
    expect(wrapper.text()).toContain('settings_uxelm_title')
  })
})
