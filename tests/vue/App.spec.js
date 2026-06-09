import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref, shallowRef } from 'vue'
import App from '../../ux/App.vue'

function createMockProviders(overrides = {}) {
  const gameState = shallowRef(overrides.gameState || {
    village: {
      day: 5,
      gold: 100,
      population: { total: 4, builders: 4, roles: { builder: 4, farmer: 0, miner: 0, scout: 0 } },
      wood: 20
    },
    heroes: []
  })
  const currentLanguage = ref('en')
  return {
    global: {
      provide: {
        gameState,
        currentLanguage,
        i18n: {
          t: (key) => key,
          setLanguage: vi.fn(() => true),
          getCurrentLanguage: vi.fn(() => 'en')
        },
        adapter: {
          dispatch: vi.fn(() => ({ success: true }))
        },
        engine: overrides.engine || {}
      }
    }
  }
}

describe('App.vue', () => {
  it('renders SaveSlotPage when no slot is selected', () => {
    const persistence = { slotIndex: null }
    const saveSlotManager = {
      listSlots: vi.fn(() => Array.from({ length: 10 }, (_, i) => ({ index: i, exists: false })))
    }

    const wrapper = mount(App, {
      props: { engine: {}, persistence, saveSlotManager },
      ...createMockProviders()
    })

    expect(wrapper.find('.save-slot-page').exists()).toBe(true)
    expect(wrapper.find('.top-bar').exists()).toBe(false)
  })

  it('renders game shell when a slot is selected', () => {
    const persistence = { slotIndex: 0 }
    const saveSlotManager = { listSlots: vi.fn() }

    const wrapper = mount(App, {
      props: { engine: {}, persistence, saveSlotManager },
      ...createMockProviders()
    })

    expect(wrapper.find('.top-bar').exists()).toBe(true)
    expect(wrapper.find('.footer-nav').exists()).toBe(true)
    expect(wrapper.find('.village-page').exists()).toBe(true)
  })

  it('switches page when footer nav is clicked', async () => {
    const persistence = { slotIndex: 0 }
    const wrapper = mount(App, {
      props: { engine: {}, persistence, saveSlotManager: { listSlots: vi.fn() } },
      ...createMockProviders()
    })

    expect(wrapper.find('.village-page').exists()).toBe(true)

    const navButtons = wrapper.findAll('.footer-nav .nav-btn')
    const heroesButton = navButtons.find((btn) => btn.text().includes('shared_uxelm_nav_heroes'))
    expect(heroesButton).toBeDefined()

    await heroesButton.trigger('click')
    await flushPromises()

    expect(wrapper.find('.heroes-page').exists()).toBe(true)
  })

  it('emits nextDay when top bar button is clicked', async () => {
    const persistence = { slotIndex: 0 }
    const nextDay = vi.fn(() => ({}))
    const engine = { nextDay, presentationService: { state: { pendingPresentations: [] } } }

    const wrapper = mount(App, {
      props: { engine, persistence, saveSlotManager: { listSlots: vi.fn() } },
      ...createMockProviders({ engine })
    })

    await wrapper.find('.btn-next-day').trigger('click')
    expect(nextDay).toHaveBeenCalled()
  })

  it('selects a save slot and initialises the engine', async () => {
    const persistence = { slotIndex: null, setSlot: vi.fn() }
    const createSlot = vi.fn()
    const initialize = vi.fn()
    const saveSlotManager = {
      listSlots: vi.fn(() => [{ index: 0, exists: false }]),
      createSlot
    }
    const engine = { initialize }

    const wrapper = mount(App, {
      props: { engine, persistence, saveSlotManager },
      ...createMockProviders({ engine })
    })

    await wrapper.find('.slot-card').trigger('click')

    expect(createSlot).toHaveBeenCalledWith(0)
    expect(persistence.setSlot).toHaveBeenCalledWith(0)
    expect(initialize).toHaveBeenCalled()
  })
})
