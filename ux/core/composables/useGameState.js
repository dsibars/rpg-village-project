import { inject } from 'vue'

export function useGameState() {
  const gameState = inject('gameState')
  if (!gameState) {
    // During Phase 0–1 testing, no engine is provided.
    // Return a no-op ref for isolated component tests.
    return { gameState: { value: {} } }
  }
  return { gameState }
}

// Future evolution: common selectors to prevent repetition in components
// export function useHeroes() {
//   const { gameState } = useGameState()
//   return computed(() => gameState.value.heroes || [])
// }
// export function useVillage() {
//   const { gameState } = useGameState()
//   return computed(() => gameState.value.village || {})
// }
