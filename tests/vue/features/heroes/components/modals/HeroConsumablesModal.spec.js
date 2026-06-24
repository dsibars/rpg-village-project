import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { shallowRef } from 'vue'
import HeroConsumablesModal from '../../../../../../ux/features/heroes/components/modals/HeroConsumablesModal.vue'

function mountWithProviders(props) {
  return mount(HeroConsumablesModal, {
    props,
    attachTo: document.body,
    global: {
      provide: {
        gameState: shallowRef({}),
        i18n: { t: (k) => k },
        currentLanguage: { value: 'en' }
      }
    }
  })
}

describe('HeroConsumablesModal', () => {
  const baseHero = {
    id: 'h1',
    name: 'Elena',
    hp: 40, maxHp: 55,
    mp: 10, maxMp: 21
  }

  it('renders consumable list', () => {
    const wrapper = mountWithProviders({
      hero: baseHero,
      consumables: { tiny_hp_potion: 3, tiny_mp_potion: 2 },
      open: true
    })
    expect(wrapper.findAll('.consumable-row').length).toBe(2)
  })

  it('computes HP heal preview', () => {
    const wrapper = mountWithProviders({
      hero: baseHero,
      consumables: { tiny_hp_potion: 3 },
      open: true
    })
    expect(wrapper.text()).toContain('+15 HP')
  })

  it('computes MP heal preview', () => {
    const wrapper = mountWithProviders({
      hero: baseHero,
      consumables: { tiny_mp_potion: 2 },
      open: true
    })
    expect(wrapper.text()).toContain('+6 MP')
  })

  it('disables Use when HP is full', () => {
    const wrapper = mountWithProviders({
      hero: { ...baseHero, hp: 55 },
      consumables: { tiny_hp_potion: 3 },
      open: true
    })
    const btn = wrapper.find('.consumable-row .btn')
    expect(btn.attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('heroes_uxelm_consumable_full_hp')
  })

  it('disables Use when MP is full', () => {
    const wrapper = mountWithProviders({
      hero: { ...baseHero, mp: 21 },
      consumables: { tiny_mp_potion: 2 },
      open: true
    })
    const btn = wrapper.find('.consumable-row .btn')
    expect(btn.attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('heroes_uxelm_consumable_full_mp')
  })

  it('shows empty state when no usable consumables', () => {
    const wrapper = mountWithProviders({
      hero: baseHero,
      consumables: {},
      open: true
    })
    expect(wrapper.find('.empty-state').exists()).toBe(true)
    expect(wrapper.text()).toContain('heroes_uxelm_consumable_empty')
  })

  it('filters out escape consumables', () => {
    const wrapper = mountWithProviders({
      hero: baseHero,
      consumables: { tiny_hp_potion: 1, teleport_scroll: 5 },
      open: true
    })
    expect(wrapper.findAll('.consumable-row').length).toBe(1)
  })

  it('emits use with consumable id', async () => {
    const wrapper = mountWithProviders({
      hero: baseHero,
      consumables: { tiny_hp_potion: 3 },
      open: true
    })
    await wrapper.find('.consumable-row .btn').trigger('click')
    expect(wrapper.emitted('use')).toBeTruthy()
    expect(wrapper.emitted('use')[0]).toEqual(['tiny_hp_potion'])
  })
})
