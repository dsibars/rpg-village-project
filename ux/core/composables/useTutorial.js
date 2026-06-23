import { inject, computed } from 'vue'

/**
 * Tutorial composable — reactive guards for navigation and actions.
 *
 * Reads the tutorial state from the injected gameState and exposes:
 * - Navigation guards (which tabs are locked)
 * - Action guards (which engine actions are permitted)
 * - Modal lock state
 *
 * Components should destructure only the selectors they need.
 */
export function useTutorial() {
  const gameState = inject('gameState')
  if (!gameState) {
    throw new Error('useTutorial() called outside of app with gameState provider')
  }

  const tutorial = computed(() => gameState.value?.tutorial || null)
  const isActive = computed(() => !!tutorial.value)

  /** Tabs that should be visually disabled and non-interactive. */
  const lockedTabs = computed(() => {
    if (!isActive.value) return []
    const where = tutorial.value?.where
    const allTabs = ['village', 'heroes', 'adventure', 'town', 'book']
    const allowed = [where?.page].filter(Boolean)
    return allTabs.filter(t => !allowed.includes(t))
  })

  /** Actions permitted during the current step (domain.action format). */
  const allowedActions = computed(() => tutorial.value?.allowActions || [])

  /** Whether the current step locks the active modal. */
  const modalLocked = computed(() => tutorial.value?.modalLock || false)

  /**
   * Check if navigation to a tab is allowed.
   * @param {string} tabId
   * @returns {boolean}
   */
  function canNavigate(tabId) {
    if (!isActive.value) return true
    return !lockedTabs.value.includes(tabId)
  }

  /**
   * Check if an adapter action is allowed.
   * @param {string} actionKey — domain.action format, e.g. 'hero.learnFamily'
   * @returns {boolean}
   */
  function canDispatch(actionKey) {
    if (!isActive.value) return true
    if (allowedActions.value.length === 0) return true
    return allowedActions.value.includes(actionKey)
  }

  return {
    isActive,
    lockedTabs,
    allowedActions,
    modalLocked,
    canNavigate,
    canDispatch
  }
}
