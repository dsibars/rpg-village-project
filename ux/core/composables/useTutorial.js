import { ref, computed, watch, inject } from 'vue'

/**
 * Tutorial state composable — bridges the engine's tutorial system to Vue reactivity.
 *
 * Watches `gameState.tutorial` for engine-driven updates and dispatches events
 * back to the engine via the adapter. Components use this for:
 * - Navigation guards (`canNavigate`, `canDispatch`)
 * - Modal locking (`modalLocked`)
 * - Tutorial overlay rendering (`isActive`, `stepData`)
 */

const ALL_MAIN_TABS = ['village', 'heroes', 'adventure', 'town', 'book']

export function useTutorial() {
  const adapter = inject('adapter', null)
  const gameState = inject('gameState', null)

  const isActive = ref(false)
  const currentStep = ref(null)
  const lockedTabs = ref([])
  const allowedActions = ref([])
  const modalLocked = ref(false)

  const stepData = computed(() => {
    if (!currentStep.value) return null
    const where = currentStep.value.where || {}
    const what = currentStep.value.what || {}
    return {
      messages: currentStep.value.messages || [],
      spotlightTarget: what.target || null,
      flashSpotlight: what.flash || false,
      page: where.page || null,
      tab: where.tab || null,
      heroId: where.heroId || null,
      regionId: where.regionId || null,
      expeditionId: where.expeditionId || null,
      modal: where.modal || null,
      modalLock: currentStep.value.modalLock || false,
      allowActions: currentStep.value.allowActions || []
    }
  })

  function syncFromState(tutorialState) {
    if (tutorialState) {
      isActive.value = true
      currentStep.value = tutorialState

      // Compute locked main tabs from the step's required page
      const requiredPage = tutorialState.where?.page
      if (requiredPage) {
        lockedTabs.value = ALL_MAIN_TABS.filter(t => t !== requiredPage)
      } else {
        lockedTabs.value = []
      }

      allowedActions.value = tutorialState.allowActions || []
      modalLocked.value = tutorialState.modalLock || false
    } else {
      isActive.value = false
      currentStep.value = null
      lockedTabs.value = []
      allowedActions.value = []
      modalLocked.value = false
    }
  }

  // Watch engine state for tutorial changes — auto-syncs whenever the engine updates
  if (gameState) {
    watch(
      () => gameState.value?.tutorial,
      (tutorialState) => {
        syncFromState(tutorialState)
      },
      { immediate: true }
    )
  }

  function reportEvent(evt) {
    if (!adapter) return
    // evt is already the full payload object (e.g. { event: 'skill_learned', heroId: 'arthur' })
    adapter.dispatch('tutorial', 'reportEvent', evt)
    // State will auto-sync via the watch on gameState.value.tutorial
  }

  function skip() {
    if (!adapter) return
    adapter.dispatch('tutorial', 'skip')
    // State will auto-sync via the watch
  }

  function complete() {
    skip()
  }

  function canNavigate(tab) {
    if (!isActive.value || lockedTabs.value.length === 0) return true
    return !lockedTabs.value.includes(tab)
  }

  function canDispatch(actionType) {
    if (!isActive.value || allowedActions.value.length === 0) return true
    return allowedActions.value.includes(actionType)
  }

  return {
    isActive,
    currentStep,
    stepData,
    lockedTabs,
    allowedActions,
    modalLocked,
    reportEvent,
    skip,
    complete,
    canNavigate,
    canDispatch
  }
}
