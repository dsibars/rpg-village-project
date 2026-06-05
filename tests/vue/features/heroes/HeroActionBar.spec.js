import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { shallowRef } from 'vue'
import HeroActionBar from '../../../../ux/features/heroes/components/HeroActionBar.vue'

function mountWithProviders(props) {
  return mount(HeroActionBar, {
    props,
    global: {
      provide: {
        gameState: shallowRef({}),
        i18n: { t: (k) => k },
        currentLanguage: { value: 'en' }
      }
    }
  })
}

describe('HeroActionBar', () => {
  it('renders four action buttons', () => {
    const wrapper = mountWithProviders({ hero: { id: 'h1' } })
    expect(wrapper.findAll('.action-btn').length).toBe(4)
  })

  it('emits action id when clicked', async () => {
    const wrapper = mountWithProviders({ hero: { id: 'h1' } })
    const buttons = wrapper.findAll('.action-btn')
    await buttons[1].trigger('click')
    expect(wrapper.emitted('action')).toBeTruthy()
    expect(wrapper.emitted('action')[0]).toEqual(['equipment'])
  })
})
