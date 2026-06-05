import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { shallowRef } from 'vue'
import SaveSlotPage from '../../../ux/features/saveSlots/SaveSlotPage.vue'

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

describe('SaveSlotPage', () => {
  it('renders 10 empty slots by default', () => {
    const wrapper = mountWithProviders(SaveSlotPage)
    expect(wrapper.findAll('.slot-card').length).toBe(10)
  })

  it('emits selectSlot when a slot is clicked', async () => {
    const wrapper = mountWithProviders(SaveSlotPage)
    await wrapper.find('.slot-card').trigger('click')
    expect(wrapper.emitted('selectSlot')).toBeTruthy()
    expect(wrapper.emitted('selectSlot')[0]).toEqual([0])
  })

  it('shows delete button for existing slots', () => {
    const slots = [{ index: 0, exists: true, day: 5, lastPlayedAt: '2024-01-01' }]
    const wrapper = mountWithProviders(SaveSlotPage, { slots })
    expect(wrapper.find('.btn-delete').exists()).toBe(true)
    expect(wrapper.text()).toContain('shared_uxelm_day')
    expect(wrapper.text()).toContain('5')
  })

  it('emits deleteSlot when delete button is clicked', async () => {
    const slots = [{ index: 0, exists: true, day: 5, lastPlayedAt: '2024-01-01' }]
    const wrapper = mountWithProviders(SaveSlotPage, { slots })
    await wrapper.find('.btn-delete').trigger('click')
    expect(wrapper.emitted('deleteSlot')).toBeTruthy()
    expect(wrapper.emitted('deleteSlot')[0]).toEqual([0])
  })
})
