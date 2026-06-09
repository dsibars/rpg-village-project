import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { shallowRef, nextTick } from 'vue'
import HeroSkillsModal from '../../../../../../ux/features/heroes/components/modals/HeroSkillsModal.vue'

function mountWithProviders(props) {
  return mount(HeroSkillsModal, {
    props,
    attachTo: document.body,
    global: {
      provide: {
        gameState: shallowRef({}),
        i18n: {
          t: (key, params = {}) => {
            if (key.includes('{')) {
              return Object.entries(params).reduce((s, [k, v]) => s.replace(`{${k}}`, v), key)
            }
            return key
          }
        },
        currentLanguage: { value: 'en' }
      }
    }
  })
}

describe('HeroSkillsModal', () => {
  const baseHero = {
    id: 'h1',
    name: 'Elena',
    level: 5,
    activity: 'idle',
    skillPoints: 2,
    knownFamilies: ['single_strike', 'power_strike'],
    techniqueTiers: { single_strike: 2, power_strike: 1 },
    techniqueUses: { single_strike: 150, power_strike: 45 },
    skillPointMilestones: [1, 5, 10, 15, 20, 25]
  }

  it('renders known families', () => {
    const wrapper = mountWithProviders({ hero: baseHero, open: true })
    expect(wrapper.findAll('.skill-item.known').length).toBe(2)
  })

  it('renders locked families section', () => {
    const wrapper = mountWithProviders({ hero: baseHero, open: true })
    expect(wrapper.find('.locked-divider').exists()).toBe(true)
    expect(wrapper.findAll('.skill-item.locked').length).toBeGreaterThan(0)
  })

  it('shows learn buttons when skill points available and idle', () => {
    const wrapper = mountWithProviders({ hero: baseHero, open: true })
    expect(wrapper.findAll('.skill-item.locked .btn').length).toBeGreaterThan(0)
  })

  it('hides learn buttons when hero is busy', () => {
    const wrapper = mountWithProviders({ hero: { ...baseHero, activity: 'expedition' }, open: true })
    expect(wrapper.find('.skill-item.locked .btn').exists()).toBe(false)
    expect(wrapper.text()).toContain('heroes_uxelm_skill_busy')
  })

  it('emits learn event with family id', async () => {
    const wrapper = mountWithProviders({ hero: baseHero, open: true })
    const learnBtn = wrapper.find('.skill-item.locked .btn')
    await learnBtn.trigger('click')
    expect(wrapper.emitted('learn')).toBeTruthy()
  })

  it('shows skill points alert when points available', () => {
    const wrapper = mountWithProviders({ hero: baseHero, open: true })
    expect(wrapper.text()).toContain('heroes_uxelm_skill_point')
    expect(wrapper.text()).toContain('heroes_uxelm_skill_spend_hint')
  })

  it('shows milestone alert when no skill points', () => {
    const wrapper = mountWithProviders({ hero: { ...baseHero, skillPoints: 0 }, open: true })
    expect(wrapper.text()).toContain('heroes_uxelm_skill_next_milestone')
  })

  it('emits close when overlay clicked', async () => {
    const wrapper = mountWithProviders({ hero: baseHero, open: true })
    await wrapper.find('.modal-overlay').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })
})
