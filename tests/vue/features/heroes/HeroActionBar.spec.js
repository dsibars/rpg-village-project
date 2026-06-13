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
  it('renders default action buttons', () => {
    const wrapper = mountWithProviders({ hero: { id: 'h1' } })
    expect(wrapper.findAll('.btn-secondary').length).toBe(5)
  })

  it('emits action id when clicked', async () => {
    const wrapper = mountWithProviders({ hero: { id: 'h1' } })
    const buttons = wrapper.findAll('.btn-secondary')
    // Index 2 is 'equipment' action (trainer is 0, hallOfFame is 1, equipment is 2)
    await buttons[2].trigger('click')
    expect(wrapper.emitted('action')).toBeTruthy()
    expect(wrapper.emitted('action')[0]).toEqual(['equipment'])
  })
})
