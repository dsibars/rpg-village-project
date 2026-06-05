// ux/core/toast.js — simple event bus for toast notifications
import { reactive } from 'vue'

export const toastState = reactive({
  toasts: []
})

let toastId = 0

export function showToast(message, type = 'info', duration = 3000) {
  const id = ++toastId
  toastState.toasts.push({ id, message, type, duration })

  setTimeout(() => {
    const idx = toastState.toasts.findIndex(t => t.id === id)
    if (idx >= 0) toastState.toasts.splice(idx, 1)
  }, duration)
}

export function removeToast(id) {
  const idx = toastState.toasts.findIndex(t => t.id === id)
  if (idx >= 0) toastState.toasts.splice(idx, 1)
}
