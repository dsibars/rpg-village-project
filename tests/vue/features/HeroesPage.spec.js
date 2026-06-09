import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { shallowRef } from 'vue'
import HeroesPage from '../../../ux/features/heroes/HeroesPage.vue'
import HeroSkillsModal from '../../../ux/features/heroes/components/modals/HeroSkillsModal.vue'
import HeroConsumablesModal from '../../../ux/features/heroes/components/modals/HeroConsumablesModal.vue'
import HeroEquipmentModal from '../../../ux/features/heroes/components/modals/HeroEquipmentModal.vue'
import HeroInscriptionModal from '../../../ux/features/heroes/components/modals/HeroInscriptionModal.vue'

function createMockProviders(overrides = {}) {
  const gameState = shallowRef({
    heroes: overrides.heroes || [
      { id: 'h1', name: 'Elena', level: 5, origin: 'origin_warrior', activity: 'idle', exp: 45, statPoints: 2, skillPoints: 2, hp: 30, maxHp: 40, mp: 10, maxMp: 17, stamina: 10, maxStamina: 10, strength: 10, speed: 6, defense: 6, magicPower: 4, knownFamilies: ['single_strike'], techniqueTiers: { single_strike: 1 }, techniqueUses: { single_strike: 0 }, skillPointMilestones: [1, 5, 10, 15, 20, 25], knownGlyphs: ['glyph_fire', 'glyph_water', 'glyph_potentiate', 'glyph_focus', 'glyph_multi', 'glyph_pierce', 'glyph_venom'], glyphMastery: { glyph_fire: { tier: 1 }, glyph_water: { tier: 1 }, glyph_potentiate: { tier: 1 }, glyph_focus: { tier: 1 }, glyph_multi: { tier: 1 }, glyph_pierce: { tier: 1 }, glyph_venom: { tier: 1 } }, isInscriptionEligible: true, equipment: { head: { id: 'eq1', type: 'armor', material: 'wooden', level: 0, archetype: 'leather', slot: 'head' } } },
      { id: 'h2', name: 'Bran', level: 2, origin: 'origin_thief', activity: 'expedition', exp: 20, statPoints: 0, skillPoints: 1, hp: 35, maxHp: 35, mp: 15, maxMp: 15, stamina: 10, maxStamina: 10, strength: 8, speed: 8, defense: 4, magicPower: 4 }
    ],
    village: overrides.village || { gold: 200, infrastructure: { tavern: 1 } },
    inventory: overrides.inventory || { consumables: { tiny_hp_potion: 3 }, equipment: [{ id: 'eq2', type: 'weapon', material: 'iron', level: 1, family: 'broadsword', slot: 'leftHand' }] }
  })
  return {
    attachTo: document.body,
    global: {
      provide: {
        gameState,
        adapter: {
          dispatch: overrides.dispatch || vi.fn(() => ({ success: true }))
        },
        i18n: {
          t: (k, params = {}) => {
            if (typeof params === 'object' && Object.keys(params).length > 0) {
              return Object.entries(params).reduce((s, [key, val]) => s.replace(`{${key}}`, val), k)
            }
            return k
          }
        },
        currentLanguage: { value: 'en' }
      }
    }
  }
}

describe('HeroesPage', () => {
  it('renders hero list and empty state by default', () => {
    const wrapper = mount(HeroesPage, createMockProviders())
    expect(wrapper.findAll('.hero-list-item').length).toBe(2)
    expect(wrapper.find('.hero-empty-state').exists()).toBe(true)
  })

  it('selects a hero and shows profile', async () => {
    const wrapper = mount(HeroesPage, createMockProviders())
    await wrapper.findAll('.hero-list-item')[0].trigger('click')
    await flushPromises()
    expect(wrapper.find('.hero-profile').exists()).toBe(true)
    expect(wrapper.text()).toContain('Elena')
  })

  it('shows recruit button when tavern is built', () => {
    const wrapper = mount(HeroesPage, createMockProviders())
    expect(wrapper.text()).toContain('heroes_uxelm_recruit')
  })

  it('hides recruit button when tavern is not built', () => {
    const wrapper = mount(HeroesPage, createMockProviders({
      village: { gold: 200, infrastructure: {} }
    }))
    expect(wrapper.text()).not.toContain('heroes_uxelm_recruit')
  })

  it('disables recruit button when player cannot afford', () => {
    const wrapper = mount(HeroesPage, createMockProviders({
      village: { gold: 0, infrastructure: { tavern: 1 } },
      heroes: Array.from({ length: 10 }, (_, i) => ({ id: `h${i}`, level: 1, activity: 'idle' }))
    }))
    const btn = wrapper.find('.list-header .btn')
    expect(btn.attributes('disabled')).toBeDefined()
  })

  it('dispatches recruit action when recruit button clicked', async () => {
    const dispatch = vi.fn(() => ({ success: true }))
    const wrapper = mount(HeroesPage, createMockProviders({ dispatch }))
    await wrapper.find('.list-header .btn').trigger('click')
    expect(dispatch).toHaveBeenCalledWith('hero', 'recruit')
  })

  it('dispatches increaseStat when stat + button clicked', async () => {
    const dispatch = vi.fn(() => ({ success: true }))
    const wrapper = mount(HeroesPage, createMockProviders({ dispatch }))
    await wrapper.findAll('.hero-list-item')[0].trigger('click')
    await flushPromises()
    await wrapper.find('.stat-add-btn').trigger('click')
    expect(dispatch).toHaveBeenCalledWith('hero', 'increaseStat', { heroId: 'h1', statId: 'baseMaxHp' })
  })

  it('opens skills modal when action bar skills button clicked', async () => {
    const wrapper = mount(HeroesPage, createMockProviders())
    await wrapper.findAll('.hero-list-item')[0].trigger('click')
    await flushPromises()
    await wrapper.findAll('.hero-action-bar .action-btn')[0].trigger('click')
    await flushPromises()
    expect(wrapper.findComponent(HeroSkillsModal).exists()).toBe(true)
  })

  it('opens consumables modal when action bar consumables button clicked', async () => {
    const wrapper = mount(HeroesPage, createMockProviders())
    await wrapper.findAll('.hero-list-item')[0].trigger('click')
    await flushPromises()
    await wrapper.findAll('.hero-action-bar .action-btn')[3].trigger('click')
    await flushPromises()
    expect(wrapper.findComponent(HeroConsumablesModal).exists()).toBe(true)
  })

  it('opens equipment modal when action bar equipment button clicked', async () => {
    const wrapper = mount(HeroesPage, createMockProviders())
    await wrapper.findAll('.hero-list-item')[0].trigger('click')
    await flushPromises()
    await wrapper.findAll('.hero-action-bar .action-btn')[1].trigger('click')
    await flushPromises()
    expect(wrapper.findComponent(HeroEquipmentModal).exists()).toBe(true)
  })

  it('opens inscription modal when action bar inscription button clicked', async () => {
    const wrapper = mount(HeroesPage, createMockProviders())
    await wrapper.findAll('.hero-list-item')[0].trigger('click')
    await flushPromises()
    await wrapper.findAll('.hero-action-bar .action-btn')[2].trigger('click')
    await flushPromises()
    expect(wrapper.findComponent(HeroInscriptionModal).exists()).toBe(true)
  })

  it('dispatches learnFamily from skills modal', async () => {
    const dispatch = vi.fn(() => ({ success: true }))
    const wrapper = mount(HeroesPage, createMockProviders({ dispatch }))
    await wrapper.findAll('.hero-list-item')[0].trigger('click')
    await flushPromises()
    await wrapper.findAll('.hero-action-bar .action-btn')[0].trigger('click')
    await flushPromises()
    const modal = wrapper.findComponent(HeroSkillsModal)
    await modal.find('.skill-item.locked .btn').trigger('click')
    expect(dispatch).toHaveBeenCalledWith('hero', 'learnFamily', { heroId: 'h1', familyId: expect.any(String) })
  })

  it('dispatches useConsumable from consumables modal', async () => {
    const dispatch = vi.fn(() => ({ success: true }))
    const wrapper = mount(HeroesPage, createMockProviders({ dispatch }))
    await wrapper.findAll('.hero-list-item')[0].trigger('click')
    await flushPromises()
    await wrapper.findAll('.hero-action-bar .action-btn')[3].trigger('click')
    await flushPromises()
    const modal = wrapper.findComponent(HeroConsumablesModal)
    await modal.find('.consumable-row .btn').trigger('click')
    expect(dispatch).toHaveBeenCalledWith('hero', 'useConsumable', { heroId: 'h1', consumableId: 'tiny_hp_potion' })
  })

  it('dispatches equipItem from equipment modal', async () => {
    const dispatch = vi.fn(() => ({ success: true }))
    const wrapper = mount(HeroesPage, createMockProviders({ dispatch }))
    await wrapper.findAll('.hero-list-item')[0].trigger('click')
    await flushPromises()
    await wrapper.findAll('.hero-action-bar .action-btn')[1].trigger('click')
    await flushPromises()
    const modal = wrapper.findComponent(HeroEquipmentModal)
    await modal.findAll('.slot-row')[3].trigger('click')
    await modal.find('.gear-row .btn').trigger('click')
    expect(dispatch).toHaveBeenCalledWith('hero', 'equipItem', { heroId: 'h1', slot: 'leftHand', equipmentId: 'eq2' })
  })

  it('dispatches inscribeBodyCircle from inscription modal', async () => {
    const dispatch = vi.fn(() => ({ success: true }))
    const wrapper = mount(HeroesPage, createMockProviders({ dispatch }))
    await wrapper.findAll('.hero-list-item')[0].trigger('click')
    await flushPromises()
    await wrapper.findAll('.hero-action-bar .action-btn')[2].trigger('click')
    await flushPromises()
    const modal = wrapper.findComponent(HeroInscriptionModal)
    const options = modal.findAll('.glyph-option')
    for (let i = 0; i < 7; i++) {
      await options[i].trigger('click')
    }
    await modal.find('.inscription-actions .btn').trigger('click')
    expect(dispatch).toHaveBeenCalledWith('hero', 'inscribeBodyCircle', { heroId: 'h1', glyphIds: expect.any(Array), glyphTiers: expect.any(Object) })
  })
})
