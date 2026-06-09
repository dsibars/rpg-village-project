import { describe, it, expect } from 'vitest'
import { shallowRef, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import {
  useGameState,
  useHeroes,
  useVillage,
  useInventory,
  useActiveBattle
} from '../../../ux/core/composables/useGameState.js'

const TestComponent = {
  template: '<div />',
  setup() {
    return {
      state: useGameState(),
      heroes: useHeroes(),
      village: useVillage(),
      inventory: useInventory(),
      battle: useActiveBattle()
    }
  }
}

describe('useGameState', () => {
  it('returns safe defaults for missing state slices', () => {
    const gameState = shallowRef({})
    const wrapper = mount(TestComponent, {
      global: {
        provide: { gameState }
      }
    })

    const vm = wrapper.vm
    expect(vm.state.heroes.value).toEqual([])
    expect(vm.state.village.value).toEqual({})
    expect(vm.state.inventory.value).toEqual({})
    expect(vm.state.expeditions.value).toEqual([])
    expect(vm.state.activeBattle.value).toBeNull()
    expect(vm.state.day.value).toBe(1)
    expect(vm.state.gold.value).toBe(0)
  })

  it('reflects updates to the provided gameState', async () => {
    const gameState = shallowRef({
      village: { day: 3, gold: 50 },
      heroes: [{ id: 'h1' }],
      activeBattle: { id: 'b1' }
    })

    const wrapper = mount(TestComponent, {
      global: {
        provide: { gameState }
      }
    })

    const vm = wrapper.vm
    expect(vm.state.day.value).toBe(3)
    expect(vm.state.gold.value).toBe(50)
    expect(vm.state.heroes.value).toHaveLength(1)

    gameState.value = {
      village: { day: 4, gold: 75 },
      heroes: [{ id: 'h1' }, { id: 'h2' }],
      activeBattle: null
    }
    await nextTick()

    expect(vm.state.day.value).toBe(4)
    expect(vm.state.gold.value).toBe(75)
    expect(vm.state.heroes.value).toHaveLength(2)
    expect(vm.state.activeBattle.value).toBeNull()
  })

  it('throws when called without a provider', () => {
    const BadComponent = {
      template: '<div />',
      setup() {
        useGameState()
      }
    }

    expect(() => mount(BadComponent)).toThrow(/gameState provider/)
  })
})
