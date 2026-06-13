import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import GambitEditor from '../../../ux/features/gambit/GambitEditor.vue'

const mockHero = {
  id: 'h1',
  name: 'Arthur',
  level: 8,
  knownFamilies: ['basic_attack', 'power_strike'],
  techniqueTiers: { basic_attack: 3, power_strike: 2 },
  spellCodex: ['fireball'],
  gambits: [
    { id: 'g1', conditions: [], action: { type: 'skill', payload: 'power_strike' }, target: 'lowest_hp_enemy', enabled: true }
  ],
  fallbackAction: 'single_strike'
}

describe('GambitEditor.vue', () => {
  it('renders with title', () => {
    const wrapper = mount(GambitEditor, {
      props: { hero: mockHero, bestiary: [], enemyTemplates: [] },
      global: { provide: { i18n: { t: (k) => k }, currentLanguage: { value: 'en' } } }
    })
    expect(wrapper.find('h2').text()).toContain('gambit_uxelm_title')
  })

  it('renders GambitList and GambitForm', () => {
    const wrapper = mount(GambitEditor, {
      props: { hero: mockHero, bestiary: [], enemyTemplates: [] },
      global: { provide: { i18n: { t: (k) => k }, currentLanguage: { value: 'en' } } }
    })
    expect(wrapper.findComponent({ name: 'GambitList' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'GambitForm' }).exists()).toBe(true)
  })

  it('emits close on overlay close', async () => {
    const wrapper = mount(GambitEditor, {
      props: { hero: mockHero, bestiary: [], enemyTemplates: [] },
      global: { provide: { i18n: { t: (k) => k }, currentLanguage: { value: 'en' } } }
    })
    await wrapper.findComponent({ name: 'FullViewOverlay' }).vm.$emit('close')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('emits action on remove', async () => {
    const wrapper = mount(GambitEditor, {
      props: { hero: mockHero, bestiary: [], enemyTemplates: [] },
      global: { provide: { i18n: { t: (k) => k }, currentLanguage: { value: 'en' } } }
    })
    await wrapper.findComponent({ name: 'GambitList' }).vm.$emit('remove', 'g1')
    expect(wrapper.emitted('action')).toBeTruthy()
    expect(wrapper.emitted('action')[0]).toEqual(['removeGambit', { heroId: 'h1', gambitId: 'g1' }])
  })
})
