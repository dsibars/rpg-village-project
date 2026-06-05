import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { shallowRef } from 'vue'
import HeroProfile from '../../../../ux/features/heroes/components/HeroProfile.vue'

function mountWithProviders(props) {
  return mount(HeroProfile, {
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

describe('HeroProfile', () => {
  const hero = {
    id: 'h1',
    name: 'Elena',
    level: 3,
    origin: 'origin_warrior',
    activity: 'idle',
    exp: 45,
    statPoints: 2,
    skillPoints: 1,
    hp: 40, maxHp: 40,
    mp: 17, maxMp: 17,
    stamina: 10, maxStamina: 10,
    strength: 10,
    speed: 6,
    defense: 6,
    magicPower: 4
  }

  it('renders hero name and level', () => {
    const wrapper = mountWithProviders({ hero })
    expect(wrapper.text()).toContain('Elena')
    expect(wrapper.text()).toContain('shared_uxelm_level')
    expect(wrapper.text()).toContain('3')
  })

  it('renders origin badge and description', () => {
    const wrapper = mountWithProviders({ hero })
    expect(wrapper.text()).toContain('heroes_info_origin_warrior')
    expect(wrapper.text()).toContain('heroes_info_origin_warrior_desc')
  })

  it('renders stats grid with 7 stats', () => {
    const wrapper = mountWithProviders({ hero })
    expect(wrapper.findAll('.stat-row').length).toBe(7)
  })

  it('emits allocateStat when stat + button clicked', async () => {
    const wrapper = mountWithProviders({ hero })
    await wrapper.find('.stat-add-btn').trigger('click')
    expect(wrapper.emitted('allocateStat')).toBeTruthy()
    expect(wrapper.emitted('allocateStat')[0]).toEqual(['hp'])
  })

  it('emits openAction when action bar button clicked', async () => {
    const wrapper = mountWithProviders({ hero })
    await wrapper.find('.hero-action-bar .action-btn').trigger('click')
    expect(wrapper.emitted('openAction')).toBeTruthy()
    expect(wrapper.emitted('openAction')[0]).toEqual(['skills'])
  })
})
