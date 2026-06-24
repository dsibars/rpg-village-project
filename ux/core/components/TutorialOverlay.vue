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
        :interactive="!darkeningDismissed"
        :placement="messagePosition.placement"
        :show-continue="isAckStep"
        :continue-label="t('shared_uxelm_continue')"
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

const emit = defineEmits(['navigate', 'tutorial:event'])

const tutorial = computed(() => gameState.value?.tutorial || null)
const active = computed(() => !!tutorial.value)

const darkeningDismissed = ref(false)
const messageIndex = ref(0)
const messageSize = ref({ width: 320, height: 100 })

function measureMessage() {
  const el = document.querySelector('.tutorial-message')
  if (el) {
    messageSize.value = {
      width: el.offsetWidth || 320,
      height: el.offsetHeight || 100
    }
  }
}

// Reset state when the tutorial step changes
watch(
  () => tutorial.value?.stepId,
  async (stepId) => {
    if (stepId) {
      messageIndex.value = 0
      darkeningDismissed.value = false
      // Reset to a safe estimate while the new message renders
      messageSize.value = { width: 320, height: 100 }
      await nextTick()
      measureMessage()
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

  // Scroll into view if needed (auto to avoid animation/jitter in screenshots)
  el.scrollIntoView({ behavior: 'auto', block: 'center' })

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

// Position the message bubble centered over the spotlight target.
// We measure the rendered message size so the arrow points at the highlighted
// element and the bubble stays within the viewport.
const messagePosition = computed(() => {
  const sc = spotlightConfig.value
  const bw = messageSize.value.width
  const bh = messageSize.value.height
  const margin = 16
  const arrowH = 10
  const padding = 20

  if (!sc) {
    // No spotlight — center the message
    return {
      x: Math.max(padding, window.innerWidth / 2 - bw / 2),
      y: Math.max(padding, window.innerHeight / 2 - bh / 2),
      placement: 'bottom'
    }
  }

  // Center horizontally over the spotlight
  let x = sc.x + sc.width / 2 - bw / 2
  const maxX = window.innerWidth - bw - padding
  if (x < padding) x = padding
  if (x > maxX) x = maxX

  // Prefer above the target so the down-arrow points at it
  let y = sc.y - bh - arrowH - margin
  let placement = 'top'
  if (y < padding) {
    y = sc.y + sc.height + margin
    placement = 'bottom'
  }

  return { x, y, placement }
})

const isAckStep = computed(() => tutorial.value?.advanceOn?.event === 'tutorial_ack')

function advanceMessage() {
  const msgs = tutorial.value?.messages || []
  if (messageIndex.value < msgs.length - 1) {
    messageIndex.value++
    return
  }

  if (isAckStep.value) {
    // Acknowledgement step: clicking the final message advances the tutorial
    // instead of dismissing the darkening layer.
    emit('tutorial:event', { event: 'tutorial_ack' })
    return
  }

  // On the last message, clicking the bubble dismisses the darkening so
  // the user can interact with the highlighted target underneath.
  darkeningDismissed.value = true
}

function handleOverlayClick() {
  if (isAckStep.value) {
    // Acknowledgement steps require an explicit click on the message/continue
    // button; clicks outside the bubble should not advance.
    return
  }
  if (!darkeningDismissed.value) {
    darkeningDismissed.value = true
  } else {
    advanceMessage()
  }
}

// Enforce navigation context by emitting events for App.vue to handle.
// This is skipped when the screenshot/test harness disables it so the flow
// can exercise user actions one at a time.
async function enforceWhere(where) {
  if (!where) return
  if (typeof window !== 'undefined' && window.__TUTORIAL_DISABLE_ENFORCE__) {
    return
  }

  // Only navigate to the required page/tab. We intentionally do NOT perform
  // synthetic clicks on tutorial targets here: clicking them automatically
  // (e.g. opening the Skills modal) leaves the UI in a state where the
  // tutorial spotlight points at a control that is now hidden or disabled.
  if (where.page) {
    emit('navigate', { page: where.page, tab: where.tab || null })
    await nextTick()
    await delay(200)
  }
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
