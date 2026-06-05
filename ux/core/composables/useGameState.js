import { inject, computed } from 'vue'

/**
 * Primary game-state composable.
 *
 * Returns the reactive gameState shallowRef plus common computed selectors.
 * Components should destructure only the selectors they need so Vue's
 * reactivity system can track granular dependencies.
 */
export function useGameState() {
  const gameState = inject('gameState')
  if (!gameState) {
    throw new Error('useGameState() called outside of app with gameState provider')
  }
  return {
    gameState,
    heroes: computed(() => gameState.value.heroes || []),
    village: computed(() => gameState.value.village || {}),
    inventory: computed(() => gameState.value.inventory || {}),
    expeditions: computed(() => gameState.value.expeditions || []),
    activeBattle: computed(() => gameState.value.activeBattle || null),
    day: computed(() => gameState.value.village?.day || 1),
    gold: computed(() => gameState.value.village?.gold || 0)
  }
}

// Domain-specific selector composables for components that only need one slice.

export function useHeroes() {
  const { gameState } = useGameState()
  return computed(() => gameState.value.heroes || [])
}

export function useVillage() {
  const { gameState } = useGameState()
  return computed(() => gameState.value.village || {})
}

export function useInventory() {
  const { gameState } = useGameState()
  return computed(() => gameState.value.inventory || {})
}

export function useCalendar() {
  const { gameState } = useGameState()
  return computed(() => gameState.value.calendar || {})
}

export function useExpeditions() {
  const { gameState } = useGameState()
  return computed(() => ({
    expeditions: gameState.value.expeditions || [],
    activeExpeditions: gameState.value.activeExpeditions || [],
    completedExpeditions: gameState.value.completedExpeditions || [],
    regions: gameState.value.expeditionRegions || []
  }))
}

export function useBestiary() {
  const { gameState } = useGameState()
  return computed(() => ({
    bestiary: gameState.value.bestiary || [],
    enemyTemplates: gameState.value.enemyTemplates || []
  }))
}

export function useActiveBattle() {
  const { gameState } = useGameState()
  return computed(() => gameState.value.activeBattle || null)
}

export function useDailyObjectives() {
  const { gameState } = useGameState()
  return computed(() => gameState.value.dailyObjectives || {})
}
