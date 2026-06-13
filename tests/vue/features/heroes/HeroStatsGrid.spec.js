import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { shallowRef } from 'vue'
import HeroStatsGrid from '../../../../ux/features/heroes/components/HeroStatsGrid.vue'

function mountWithProviders(props) {
  return mount(HeroStatsGrid, {
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

describe('HeroStatsGrid', () => {
  const baseHero = {
    hp: 40, maxHp: 40,
    mp: 17, maxMp: 17,
    stamina: 10, maxStamina: 10,
    strength: 10, speed: 6, defense: 6, magicPower: 4
  }

  it('renders 7 stat rows', () => {
    const wrapper = mountWithProviders({ hero: { ...baseHero } })
    expect(wrapper.findAll('.stat-row').length).toBe(7)
  })

  it('shows allocate buttons when idle and has stat points', () => {
    const wrapper = mountWithProviders({ hero: { ...baseHero, statPoints: 3, activity: 'idle' } })
    expect(wrapper.findAll('.btn-assign-stat').length).toBe(6)
  })

  it('hides allocate buttons when on expedition', () => {
    const wrapper = mountWithProviders({ hero: { ...baseHero, statPoints: 3, activity: 'expedition' } })
    expect(wrapper.find('.btn-assign-stat').exists()).toBe(false)
  })

  it('hides allocate buttons when no stat points', () => {
    const wrapper = mountWithProviders({ hero: { ...baseHero, statPoints: 0, activity: 'idle' } })
    expect(wrapper.find('.btn-assign-stat').exists()).toBe(false)
  })

  it('emits allocate with stat id', async () => {
    const wrapper = mountWithProviders({ hero: { ...baseHero, statPoints: 3, activity: 'idle' } })
    const buttons = wrapper.findAll('.btn-assign-stat')
    await buttons[2].trigger('click')
    expect(wrapper.emitted('allocate')).toBeTruthy()
    expect(wrapper.emitted('allocate')[0]).toEqual(['baseStrength'])
  })
})
