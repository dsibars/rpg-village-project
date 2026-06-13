// ux/core/toast.js — simple event bus for toast notifications
import { reactive } from 'vue'

export const toastState = reactive({
  toasts: []
})

let toastId = 0

export function showToast(message, type = 'info', duration = 3000, data = null) {
  const id = ++toastId
  toastState.toasts.push({ id, message, type, duration, data })

  setTimeout(() => {
    const idx = toastState.toasts.findIndex(t => t.id === id)
    if (idx >= 0) toastState.toasts.splice(idx, 1)
  }, duration)
}

export function removeToast(id) {
  const idx = toastState.toasts.findIndex(t => t.id === id)
  if (idx >= 0) toastState.toasts.splice(idx, 1)
}

// Narrative unlock queue — ensures narratives don't overlap
const narrativeQueue = reactive({
  pending: [],
  isShowing: false
})

const NARRATIVE_DISMISS_MS = 8000

export function queueNarrative(narrative) {
  // narrative: { id, titleKey, loreKey, era }
  if (!narrative || narrativeQueue.pending.find(n => n.id === narrative.id)) return
  narrativeQueue.pending.push(narrative)
  if (!narrativeQueue.isShowing) {
    _showNextNarrative()
  }
}

function _showNextNarrative() {
  if (narrativeQueue.pending.length === 0) {
    narrativeQueue.isShowing = false
    return
  }
  narrativeQueue.isShowing = true
  const narrative = narrativeQueue.pending.shift()
  const id = ++toastId
  toastState.toasts.push({
    id,
    message: narrative.titleKey,
    type: 'narrative',
    duration: NARRATIVE_DISMISS_MS,
    data: { narrative }
  })

  setTimeout(() => {
    const idx = toastState.toasts.findIndex(t => t.id === id)
    if (idx >= 0) toastState.toasts.splice(idx, 1)
    // Show next after transition
    setTimeout(() => _showNextNarrative(), 350)
  }, NARRATIVE_DISMISS_MS)
}

export function clearNarrativeQueue() {
  narrativeQueue.pending = []
  narrativeQueue.isShowing = false
  // Remove any narrative toasts
  for (let i = toastState.toasts.length - 1; i >= 0; i--) {
    if (toastState.toasts[i].type === 'narrative') {
      toastState.toasts.splice(i, 1)
    }
  }
}
