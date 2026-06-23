<template>
  <Teleport to="body">
    <div
      v-if="active"
      class="tutorial-overlay"
      :class="{ 'darkening-dismissed': darkeningDismissed }"
      role="dialog"
      aria-modal="true"
      aria-live="polite"
    >
      <!-- Spotlight hole — pointer-events: none so clicks pass through to the target -->
      <TutorialSpotlight
        :config="spotlightConfig"
        :visible="!!spotlightConfig && !darkeningDismissed"
      />

      <!-- Message bubble -->
      <TutorialMessage
        :messages="resolvedMessages"
        :current-index="messageIndex"
        :position="messagePosition"
        :visible="active"
        :current-text="currentMessageText"
        @advance="advanceMessage"
      />

      <!-- Click capture layer: outside the spotlight -->
      <div
        v-if="!darkeningDismissed"
        class="click-capture"
        @click="handleOverlayClick"
      />
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useGameState } from '../composables/useGameState.js'
import { useI18n } from '../composables/useI18n.js'
import TutorialSpotlight from './TutorialSpotlight.vue'
import TutorialMessage from './TutorialMessage.vue'

const { gameState } = useGameState()
const { t } = useI18n()

const emit = defineEmits(['navigate'])

const tutorial = computed(() => gameState.value?.tutorial || null)
const active = computed(() => !!tutorial.value)

const darkeningDismissed = ref(false)
const messageIndex = ref(0)

// Reset state when the tutorial step changes
watch(
  () => tutorial.value?.stepId,
  (stepId) => {
    if (stepId) {
      messageIndex.value = 0
      darkeningDismissed.value = false
      // Attempt to enforce navigation context
      nextTick(() => {
        enforceWhere(tutorial.value?.where)
      })
    }
  },
  { immediate: true }
)

// Also reset when tutorial becomes active/inactive
watch(active, (isActive) => {
  if (isActive) {
    messageIndex.value = 0
    darkeningDismissed.value = false
  }
})

// Resolve i18n keys to actual text
const resolvedMessages = computed(() => {
  const msgs = tutorial.value?.messages || []
  return msgs.map(key => t(key))
})

const currentMessageText = computed(() => {
  const msgs = resolvedMessages.value
  if (msgs.length === 0) return ''
  return msgs[messageIndex.value] || ''
})

// Compute spotlight configuration from DOM
const spotlightConfig = computed(() => {
  const what = tutorial.value?.what
  if (!what?.target) return null

  const el = document.querySelector(`[data-tutorial-target="${what.target}"]`)
  if (!el) {
    // Target not found — return a centered fallback so the message is still visible
    return {
      x: window.innerWidth / 2 - 60,
      y: window.innerHeight / 2 - 30,
      width: 120,
      height: 60,
      rounded: what.rounded !== false,
      flash: what.flash || false,
      padding: what.padding || 8
    }
  }

  // Scroll into view if needed
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })

  const rect = el.getBoundingClientRect()
  const padding = what.padding || 8

  return {
    x: rect.left - padding,
    y: rect.top - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
    rounded: what.rounded !== false,
    flash: what.flash || false,
    padding
  }
})

// Position the message bubble below the spotlight
const messagePosition = computed(() => {
  const sc = spotlightConfig.value
  if (!sc) {
    // No spotlight — center the message
    return {
      x: Math.max(20, window.innerWidth / 2 - 160),
      y: Math.max(20, window.innerHeight / 2 - 40)
    }
  }

  let x = sc.x
  let y = sc.y + sc.height + 16

  // Keep message within viewport
  const maxWidth = 320
  if (x + maxWidth > window.innerWidth - 20) {
    x = window.innerWidth - maxWidth - 20
  }
  if (x < 20) x = 20
  if (y + 120 > window.innerHeight - 20) {
    // Place above the spotlight if below doesn't fit
    y = sc.y - 120
  }
  if (y < 20) y = 20

  return { x, y }
})

function advanceMessage() {
  const msgs = tutorial.value?.messages || []
  if (messageIndex.value < msgs.length - 1) {
    messageIndex.value++
  }
  // When all messages are shown, the user must perform the action
  // (the step auto-advances via event-driven reportEvent)
}

function handleOverlayClick() {
  if (!darkeningDismissed.value) {
    darkeningDismissed.value = true
  } else {
    advanceMessage()
  }
}

// Enforce navigation context by emitting events for App.vue to handle
async function enforceWhere(where) {
  console.log('[TutorialOverlay] enforceWhere', where)
  if (!where) return

  // Emit navigate event so App.vue can change currentPage/activeTab
  if (where.page) {
    console.log('[TutorialOverlay] emitting navigate', { page: where.page, tab: where.tab || null })
    emit('navigate', { page: where.page, tab: where.tab || null })
    await nextTick()
    await delay(200)
  }

  // Synthetic clicks for deeper navigation (hero selection, modal open, etc.)
  if (where.heroId) {
    await clickTarget(`hero_card_${where.heroId}`)
  }
  if (where.modal) {
    await clickTarget(`hero_action_${where.modal}`)
  }
  if (where.regionId) {
    await clickTarget(`region_card_${where.regionId}`)
  }
  if (where.expeditionId) {
    await clickTarget(`expedition_node_${where.expeditionId}`)
  }
  if (where.buildingId) {
    await clickTarget(`building_${where.buildingId}`)
  }
}

async function clickTarget(targetId, maxRetries = 5) {
  for (let i = 0; i < maxRetries; i++) {
    const el = document.querySelector(`[data-tutorial-target="${targetId}"]`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      await delay(100)
      el.click()
      await nextTick()
      await delay(50)
      return true
    }
    await delay(100 + i * 50)
    await nextTick()
  }
  console.warn(`Tutorial target not found: ${targetId}`)
  return false
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
</script>

<style scoped>
.tutorial-overlay {
  position: fixed;
  inset: 0;
  z-index: 9997;
  pointer-events: none;
}

/* When darkening is active, the capture layer blocks interaction */
.click-capture {
  position: fixed;
  inset: 0;
  z-index: 9996;
  pointer-events: auto;
  cursor: default;
}

/* After darkening is dismissed, remove the capture layer so the user
   can interact with the highlighted element. The spotlight remains
   visible with pointer-events: none so clicks pass through. */
.tutorial-overlay.darkening-dismissed .click-capture {
  display: none;
}
</style>
