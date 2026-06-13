<template>
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
</template>

<script setup>
import LoadingSpinner from './LoadingSpinner.vue'

defineProps({
  variant: { type: String, default: 'primary', validator: v => ['primary', 'secondary', 'danger', 'ghost'].includes(v) },
  size: { type: String, default: 'md', validator: v => ['sm', 'md', 'lg'].includes(v) },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  type: { type: String, default: 'button', validator: v => ['button', 'submit'].includes(v) }
})

defineEmits(['click'])
</script>

<style scoped>
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
  transition: background 0.15s, opacity 0.15s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
}
.btn--primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  box-shadow: 0 4px 12px rgba(217, 119, 6, 0.5);
}

.btn--secondary {
  background: var(--bg-card);
  color: var(--text-primary);
  border: 1px solid var(--glass-border);
}
.btn--secondary:hover:not(:disabled) {
  background: var(--glass-border);
}

.btn--danger {
  background: var(--color-danger);
  color: white;
}
.btn--danger:hover:not(:disabled) {
  opacity: 0.9;
}

.btn--ghost {
  background: transparent;
  color: var(--text-secondary);
}
.btn--ghost:hover:not(:disabled) {
  background: var(--bg-card);
  color: var(--text-primary);
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
