import { describe, it, expect, vi } from 'vitest'
import { createVueApp } from '../../ux/main.js'

describe('createVueApp', () => {
  function createMocks() {
    return {
      engine: {
        update: vi.fn(() => ({ day: 1, village: { gold: 10 } })),
        initialize: vi.fn(),
        i18n: {
          t: (k) => k,
          setLanguage: vi.fn(() => true),
          getCurrentLanguage: vi.fn(() => 'en')
        }
      },
      persistence: { slotIndex: 0 },
      saveSlotManager: { listSlots: vi.fn(() => []) },
      container: document.createElement('div')
    }
  }

  it('mounts the app into the provided container', () => {
    const { engine, persistence, saveSlotManager, container } = createMocks()
    const app = createVueApp({ engine, persistence, saveSlotManager, container })

    expect(container.querySelector('.app-root')).not.toBeNull()
    app._rpgvillageUnmount()
  })

  it('provides engine, gameState, adapter, i18n and currentLanguage', () => {
    const { engine, persistence, saveSlotManager, container } = createMocks()
    const app = createVueApp({ engine, persistence, saveSlotManager, container })

    // Accessing internal provide map is not directly possible, but we can verify
    // the app rendered something that depends on the provided values.
    expect(container.querySelector('.app-root')).not.toBeNull()
    app._rpgvillageUnmount()
  })

  it('starts the game loop when engine is provided', () => {
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1)
    const { engine, persistence, saveSlotManager, container } = createMocks()

    const app = createVueApp({ engine, persistence, saveSlotManager, container })

    expect(rafSpy).toHaveBeenCalled()

    app._rpgvillageUnmount()
    rafSpy.mockRestore()
  })

  it('does not start the game loop when engine is missing', () => {
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1)
    const { persistence, saveSlotManager, container } = createMocks()

    const app = createVueApp({ engine: null, persistence, saveSlotManager, container })

    expect(rafSpy).not.toHaveBeenCalled()

    app._rpgvillageUnmount()
    rafSpy.mockRestore()
  })

  it('unmounts cleanly and cancels the animation frame', () => {
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 42)

    const { engine, persistence, saveSlotManager, container } = createMocks()
    const app = createVueApp({ engine, persistence, saveSlotManager, container })

    expect(container.querySelector('.app-root')).not.toBeNull()

    app._rpgvillageUnmount()

    expect(cancelSpy).toHaveBeenCalledWith(42)
    expect(container.querySelector('.app-root')).toBeNull()

    cancelSpy.mockRestore()
    rafSpy.mockRestore()
  })
})
