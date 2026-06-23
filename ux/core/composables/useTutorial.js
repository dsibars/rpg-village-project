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

export function useTutorial() {
  const adapter = inject('adapter', null)
  const gameState = inject('gameState', null)

  const isActive = ref(false)
  const currentStep = ref(null)
  const engine = ref(null)
  const lockedTabs = ref([])
  const allowedActions = ref([])
  const modalLocked = ref(false)

  const stepData = computed(() => {
    if (!currentStep.value) return null
    return {
      messages: currentStep.value.messages || [],
      spotlightTarget: currentStep.value.what?.target || null,
      flashSpotlight: currentStep.value.what?.flash || false,
      page: currentStep.value.where?.page || null,
      tab: currentStep.value.where?.tab || null,
      heroId: currentStep.value.where?.heroId || null,
      regionId: currentStep.value.where?.regionId || null,
      expeditionId: currentStep.value.where?.expeditionId || null,
      modal: currentStep.value.where?.modal || null,
      modalLock: currentStep.value.modalLock || false,
      allowActions: currentStep.value.allowActions || []
    }
  })

  function syncFromState(tutorialState) {
    if (tutorialState) {
      isActive.value = true
      currentStep.value = tutorialState.currentStep
      lockedTabs.value = tutorialState.lockedTabs || []
      allowedActions.value = tutorialState.allowedActions || []
      modalLocked.value = tutorialState.modalLocked || false
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
    adapter.dispatch('tutorial', 'reportEvent', { event: evt })
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
    if (!isActive.value || !lockedTabs.value.length) return true
    return !lockedTabs.value.includes(tab)
  }

  function canDispatch(actionType) {
    if (!isActive.value || !allowedActions.value.length) return true
    return allowedActions.value.includes(actionType)
  }

  return {
    isActive,
    currentStep,
    stepData,
    engine,
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
