import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { shallowRef } from 'vue'
import HeroEquipmentModal from '../../../../../../ux/features/heroes/components/modals/HeroEquipmentModal.vue'

function mountWithProviders(props) {
  return mount(HeroEquipmentModal, {
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

describe('HeroEquipmentModal', () => {
  const hero = {
    id: 'h1',
    name: 'Elena',
    activity: 'idle',
    equipment: {
      head: { id: 'eq1', type: 'armor', material: 'wooden', level: 0, archetype: 'leather', slot: 'head' },
      body: null,
      legs: null,
      leftHand: { id: 'eq2', type: 'weapon', material: 'iron', level: 1, family: 'broadsword' },
      rightHand: null,
      accessory: null
    }
  }

  const inventoryEquipment = [
    { id: 'eq1', type: 'armor', material: 'wooden', level: 0, archetype: 'leather', slot: 'head' },
    { id: 'eq3', type: 'armor', material: 'iron', level: 0, archetype: 'plate', slot: 'head' },
    { id: 'eq4', type: 'weapon', material: 'wooden', level: 0, family: 'dagger', slot: 'leftHand' }
  ]

  it('renders 6 equipment slots', () => {
    const wrapper = mountWithProviders({ hero, inventoryEquipment, open: true })
    expect(wrapper.findAll('.slot-row').length).toBe(6)
  })

  it('shows equipped item keys', () => {
    const wrapper = mountWithProviders({ hero, inventoryEquipment, open: true })
    expect(wrapper.text()).toContain('inventory_info_tier_wooden')
    expect(wrapper.text()).toContain('inventory_info_archetype_leather')
    expect(wrapper.text()).toContain('inventory_info_tier_iron')
    expect(wrapper.text()).toContain('inventory_info_family_broadsword')
  })

  it('shows empty slot label for unequipped slots', () => {
    const wrapper = mountWithProviders({ hero, inventoryEquipment, open: true })
    expect(wrapper.text()).toContain('inventory_uxelm_empty_slot')
  })

  it('emits unequip when unequip button clicked', async () => {
    const wrapper = mountWithProviders({ hero, inventoryEquipment, open: true })
    const unequipBtns = wrapper.findAll('.slot-row .btn')
    await unequipBtns[0].trigger('click')
    expect(wrapper.emitted('unequip')).toBeTruthy()
    expect(wrapper.emitted('unequip')[0]).toEqual(['head'])
  })

  it('filters gear by selected slot', async () => {
    const wrapper = mountWithProviders({ hero, inventoryEquipment, open: true })
    await wrapper.findAll('.slot-row')[0].trigger('click')
    expect(wrapper.findAll('.gear-row').length).toBe(2)
  })

  it('emits equip with slot and equipment id', async () => {
    const wrapper = mountWithProviders({ hero, inventoryEquipment, open: true })
    await wrapper.findAll('.slot-row')[0].trigger('click')
    await wrapper.find('.gear-row .btn').trigger('click')
    expect(wrapper.emitted('equip')).toBeTruthy()
    expect(wrapper.emitted('equip')[0]).toEqual([{ slot: 'head', equipmentId: 'eq1' }])
  })
})
