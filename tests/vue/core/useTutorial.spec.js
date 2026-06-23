import { describe, it, expect, vi } from 'vitest'
import { shallowRef, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { useTutorial } from '../../../ux/core/composables/useTutorial.js'

const TestComponent = {
  template: '<div />',
  setup() {
    return { tutorial: useTutorial() }
  }
}

function createAdapter() {
  return {
    dispatch: vi.fn(() => ({ success: true }))
  }
}

function makeTutorialState(overrides = {}) {
  return {
    tutorialId: 'tutorial_hero_skills',
    stepIndex: 0,
    totalSteps: 3,
    stepId: 'navigate_heroes',
    where: { page: 'heroes' },
    what: { target: 'footer_nav_heroes', flash: true },
    messages: ['tutorial_hero_skills_msg_navigate_heroes'],
    advanceOn: { event: 'tab_changed', page: 'heroes' },
    allowActions: ['hero.learnFamily'],
    modalLock: false,
    stepData: {},
    ...overrides
  }
}

describe('useTutorial', () => {
  it('reflects inactive state when no tutorial is provided', () => {
    const gameState = shallowRef({})
    const adapter = createAdapter()
    const wrapper = mount(TestComponent, {
      global: { provide: { gameState, adapter } }
    })

    const t = wrapper.vm.tutorial
    expect(t.isActive.value).toBe(false)
    expect(t.lockedTabs.value).toEqual([])
    expect(t.allowedActions.value).toEqual([])
    expect(t.modalLocked.value).toBe(false)
    expect(t.canNavigate('heroes')).toBe(true)
    expect(t.canDispatch('hero.learnFamily')).toBe(true)
  })

  it('computes guards from engine tutorial state', async () => {
    const gameState = shallowRef({ tutorial: makeTutorialState() })
    const adapter = createAdapter()
    const wrapper = mount(TestComponent, {
      global: { provide: { gameState, adapter } }
    })

    const t = wrapper.vm.tutorial
    expect(t.isActive.value).toBe(true)
    expect(t.lockedTabs.value).toEqual(['village', 'adventure', 'town', 'book'])
    expect(t.allowedActions.value).toEqual(['hero.learnFamily'])
    expect(t.modalLocked.value).toBe(false)

    expect(t.canNavigate('heroes')).toBe(true)
    expect(t.canNavigate('village')).toBe(false)
    expect(t.canDispatch('hero.learnFamily')).toBe(true)
    expect(t.canDispatch('village.nextDay')).toBe(false)
  })

  it('updates guards when tutorial state changes', async () => {
    const gameState = shallowRef({ tutorial: makeTutorialState() })
    const adapter = createAdapter()
    const wrapper = mount(TestComponent, {
      global: { provide: { gameState, adapter } }
    })

    gameState.value = {
      tutorial: makeTutorialState({
        stepId: 'construct_farm',
        where: { page: 'village' },
        allowActions: ['buildings.startProject']
      })
    }
    await nextTick()

    const t = wrapper.vm.tutorial
    expect(t.lockedTabs.value).toEqual(['heroes', 'adventure', 'town', 'book'])
    expect(t.allowedActions.value).toEqual(['buildings.startProject'])
    expect(t.canNavigate('village')).toBe(true)
    expect(t.canNavigate('heroes')).toBe(false)
  })

  it('reports events directly without wrapping payload', () => {
    const gameState = shallowRef({ tutorial: makeTutorialState() })
    const adapter = createAdapter()
    const wrapper = mount(TestComponent, {
      global: { provide: { gameState, adapter } }
    })

    const t = wrapper.vm.tutorial
    t.reportEvent({ event: 'hero_selected', heroId: 'arthur' })

    expect(adapter.dispatch).toHaveBeenCalledWith('tutorial', 'reportEvent', { event: 'hero_selected', heroId: 'arthur' })
  })

  it('delegates skip to adapter', () => {
    const gameState = shallowRef({ tutorial: makeTutorialState() })
    const adapter = createAdapter()
    const wrapper = mount(TestComponent, {
      global: { provide: { gameState, adapter } }
    })

    const t = wrapper.vm.tutorial
    t.skip()

    expect(adapter.dispatch).toHaveBeenCalledWith('tutorial', 'skip')
  })
})
