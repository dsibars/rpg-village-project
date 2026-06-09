import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { shallowRef } from 'vue'
import HeroListItem from '../../../../ux/features/heroes/components/HeroListItem.vue'

function mountWithProviders(props) {
  return mount(HeroListItem, {
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

describe('HeroListItem', () => {
  const hero = {
    id: 'h1',
    name: 'Elena',
    level: 3,
    activity: 'idle',
    statPoints: 2,
    mealBuffs: [{ stat: 'strength', value: 2, battlesRemaining: 3 }]
  }

  it('renders hero name and level', () => {
    const wrapper = mountWithProviders({ hero })
    expect(wrapper.text()).toContain('Elena')
    expect(wrapper.text()).toContain('3')
  })

  it('shows activity badge', () => {
    const wrapper = mountWithProviders({ hero })
    expect(wrapper.text()).toContain('heroes_status_activity_idle')
  })

  it('shows meal buff badge when hero has meal buffs', () => {
    const wrapper = mountWithProviders({ hero })
    expect(wrapper.find('.meal-badge').exists()).toBe(true)
  })

  it('shows points badge when hero has unassigned points', () => {
    const wrapper = mountWithProviders({ hero })
    expect(wrapper.find('.points-badge').exists()).toBe(true)
    expect(wrapper.text()).toContain('+2')
  })

  it('applies selected class when selected', () => {
    const wrapper = mountWithProviders({ hero, selected: true })
    expect(wrapper.find('.hero-list-item').classes()).toContain('active')
  })

  it('emits select with hero id on click', async () => {
    const wrapper = mountWithProviders({ hero })
    await wrapper.find('.hero-list-item').trigger('click')
    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('select')[0]).toEqual(['h1'])
  })
})
