<template>
<span :title="title || undefined" class="btn-wrapper">
    <button
      :type="type"
      class="btn"
      :class="[`btn--${variant}`, `btn--${size}`, { 'btn--loading': loading }]"
      :disabled="disabled || loading"
      @click="$emit('click', $event)"
    >
      <LoadingSpinner v-if="loading" size="sm" class="btn-spinner" />
      <span :class="{ 'btn-label--hidden': loading }">
        <slot />
      </span>
    </button>
  </span>
</template>

<script setup>
import LoadingSpinner from './LoadingSpinner.vue'

defineProps({
  variant: { type: String, default: 'primary', validator: v => ['primary', 'secondary', 'danger', 'ghost'].includes(v) },
  size: { type: String, default: 'md', validator: v => ['sm', 'md', 'lg'].includes(v) },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  title: { type: String, default: null },
  type: { type: String, default: 'button', validator: v => ['button', 'submit'].includes(v) }
})

defineEmits(['click'])
</script>

<style scoped>
.btn-wrapper {
  display: inline-flex;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-family: var(--font-body);
  font-weight: 500;
  transition: background 0.15s, opacity 0.15s, transform 0.08s, box-shadow 0.08s;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn:active:not(:disabled) {
  transform: scale(0.96);
}

/* Sizes */
.btn--sm { padding: 4px 12px; font-size: 0.75rem; }
.btn--md { padding: 8px 16px; font-size: 0.875rem; }
.btn--lg { padding: 12px 24px; font-size: 1rem; }

/* Variants */
.btn--primary {
  background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
  color: white;
  border: 1px solid rgba(251, 191, 36, 0.35);
  box-shadow: 0 2px 8px rgba(217, 119, 6, 0.3);
  transition: background 0.15s, opacity 0.15s, transform 0.08s, box-shadow 0.08s;
}
.btn--primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  box-shadow: 0 4px 12px rgba(217, 119, 6, 0.5);
}
.btn--primary:active:not(:disabled) {
  transform: scale(0.96);
  box-shadow: 0 1px 4px rgba(217, 119, 6, 0.3);
}

.btn--secondary {
  background: var(--bg-card);
  color: var(--text-primary);
  border: 1px solid var(--glass-border);
  transition: background 0.15s, opacity 0.15s, transform 0.08s, box-shadow 0.08s;
}
.btn--secondary:hover:not(:disabled) {
  background: var(--glass-border);
}
.btn--secondary:active:not(:disabled) {
  transform: scale(0.96);
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
}

.btn--danger {
  background: var(--color-danger);
  color: white;
  transition: background 0.15s, opacity 0.15s, transform 0.08s, box-shadow 0.08s;
}
.btn--danger:hover:not(:disabled) {
  opacity: 0.9;
}
.btn--danger:active:not(:disabled) {
  transform: scale(0.96);
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
}

.btn--ghost {
  background: transparent;
  color: var(--text-secondary);
  transition: background 0.15s, opacity 0.15s, transform 0.08s, box-shadow 0.08s;
}
.btn--ghost:hover:not(:disabled) {
  background: var(--bg-card);
  color: var(--text-primary);
}
.btn--ghost:active:not(:disabled) {
  transform: scale(0.96);
}

/* Loading */
.btn--loading {
  position: relative;
}

.btn-label--hidden {
  opacity: 0;
}

.btn-spinner {
  position: absolute;
}
</style>
