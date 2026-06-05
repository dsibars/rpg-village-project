<template>
  <div class="toast-container">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toastState.toasts"
        :key="toast.id"
        class="toast"
        :class="[`toast--${toast.type}`, { 'toast--narrative': toast.type === 'narrative' }]"
        @click="removeToast(toast.id)"
      >
        <!-- Narrative unlock toast -->
        <template v-if="toast.type === 'narrative' && toast.data?.narrative">
          <div class="narrative-era">Era {{ toast.data.narrative.era }}</div>
          <h4 class="narrative-title">{{ t(toast.data.narrative.titleKey) }}</h4>
          <p class="narrative-lore">{{ t(toast.data.narrative.loreKey) }}</p>
          <span class="narrative-hint">Click to dismiss</span>
        </template>
        <!-- Standard toast -->
        <template v-else>
          {{ toast.message }}
        </template>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { toastState, removeToast } from '../core/toast.js'
import { useI18n } from '../core/composables/useI18n.js'

const { t } = useI18n()
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: var(--spacing-lg);
  right: var(--spacing-lg);
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  pointer-events: none;
}

.toast {
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  color: white;
  font-size: 0.875rem;
  pointer-events: auto;
  cursor: pointer;
  max-width: 300px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.toast--info { background: var(--color-primary); }
.toast--success { background: var(--color-success); }
.toast--warning { background: var(--color-warning); }
.toast--error { background: var(--color-danger); }

/* Narrative unlock toasts */
.toast--narrative {
  max-width: 380px;
  padding: var(--spacing-lg);
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 1px solid rgba(200, 170, 110, 0.4);
  text-align: center;
}

.narrative-era {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: #c8aa6e;
  margin-bottom: var(--spacing-xs);
}

.narrative-title {
  margin: 0 0 var(--spacing-sm);
  font-family: var(--font-heading);
  font-size: 1.1rem;
  color: #f0e6d2;
}

.narrative-lore {
  margin: 0 0 var(--spacing-sm);
  font-size: 0.8rem;
  line-height: 1.5;
  color: #a09b8c;
}

.narrative-hint {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.4);
  font-style: italic;
}

/* Transition */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
