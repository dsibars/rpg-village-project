import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createEngineAdapter } from '../../../ux/adapters/EngineAdapter.js'
import { toastState } from '../../../ux/core/toast.js'

describe('EngineAdapter', () => {
  let mockEngine
  let gameStateRef
  let adapter

  beforeEach(() => {
    toastState.toasts = []
    gameStateRef = { value: null }
    mockEngine = {
      recruitHero: vi.fn(() => ({ success: true, data: { hero: { id: 'h1' } } })),
      increaseHeroStat: vi.fn(() => ({ success: true })),
      addHeroGambit: vi.fn(() => ({ success: true })),
      update: vi.fn(() => ({ day: 1 })),
      i18n: { t: (k) => `translated:${k}` }
    }
    adapter = createEngineAdapter(mockEngine, gameStateRef)
  })

  it('dispatches known action to engine method', () => {
    const result = adapter.dispatch('hero', 'recruit')
    expect(mockEngine.recruitHero).toHaveBeenCalled()
    expect(result.success).toBe(true)
  })

  it('passes payload to engine method', () => {
    adapter.dispatch('hero', 'increaseStat', { heroId: 'h1', statId: 'baseStrength' })
    expect(mockEngine.increaseHeroStat).toHaveBeenCalledWith('h1', 'baseStrength')
  })

  it('returns error for unknown action', () => {
    const result = adapter.dispatch('hero', 'nonexistent')
    expect(result.success).toBe(false)
    expect(result.error).toBe('action_unknown')
  })

  it('shows toast on failure', () => {
    mockEngine.recruitHero = vi.fn(() => ({ success: false, error: 'not_enough_gold' }))
    adapter.dispatch('hero', 'recruit')
    expect(toastState.toasts.length).toBeGreaterThan(0)
  })

  it('updates gameStateRef after dispatch', () => {
    adapter.dispatch('hero', 'recruit')
    expect(mockEngine.update).toHaveBeenCalled()
    expect(gameStateRef.value).toEqual({ day: 1 })
  })
})
