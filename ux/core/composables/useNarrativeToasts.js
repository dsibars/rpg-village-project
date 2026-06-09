import { watch, inject } from 'vue'
import { UNLOCK_NARRATIVES } from '../data/index.js'
import { queueNarrative, clearNarrativeQueue } from '../toast.js'

/**
 * Watches the game state for new unlock narratives and queues them as toasts.
 *
 * Usage in App.vue:
 *   useNarrativeToasts()
 *
 * This will automatically detect newNarratives in the daily report
 * and show them one at a time via the toast system.
 */
export function useNarrativeToasts() {
  const gameState = inject('gameState')
  if (!gameState) return { clear: clearNarrativeQueue }

  let lastSeenDay = null

  watch(
    () => gameState.value?.village?.lastDailyReport,
    (report) => {
      if (!report) return
      // Avoid re-showing narratives when the same report is re-rendered
      if (report.day === lastSeenDay) return
      lastSeenDay = report.day

      const narratives = report.newNarratives || []
      for (const narrativeId of narratives) {
        const narrative = UNLOCK_NARRATIVES.find(n => n.id === narrativeId)
        if (narrative) {
          queueNarrative(narrative)
        }
      }
    },
    { immediate: false }
  )

  return { clear: clearNarrativeQueue }
}
