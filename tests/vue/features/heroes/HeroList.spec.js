import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { shallowRef } from 'vue'
import HeroList from '../../../../ux/features/heroes/components/HeroList.vue'

function mountWithProviders(component, props = {}) {
  return mount(component, {
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

describe('HeroList', () => {
  const heroes = [
    { id: 'h1', name: 'Elena', level: 3, activity: 'idle' },
    { id: 'h2', name: 'Bran', level: 2, activity: 'idle' }
  ]

  it('renders correct number of items', () => {
    const wrapper = mountWithProviders(HeroList, { heroes, selectedId: null })
    expect(wrapper.findAll('.hero-list-item').length).toBe(2)
  })

  it('emits select event when item clicked', async () => {
    const wrapper = mountWithProviders(HeroList, { heroes, selectedId: null })
    await wrapper.findAll('.hero-list-item')[1].trigger('click')
    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('select')[0]).toEqual(['h2'])
  })
})
