<template>
  <button
    class="btn-close"
    :disabled="disabled"
    :aria-label="t('shared_uxelm_close')"
    @click="onClick"
  >✕</button>
</template>

<script setup>
import { useI18n } from '@/core/composables/useI18n.js'

const { t } = useI18n()

const props = defineProps({
  disabled: { type: Boolean, default: false }
})

const emit = defineEmits(['close'])

function onClick() {
  if (props.disabled) return
  emit('close')
}
</script>

<style scoped>
.btn-close {
  background: transparent;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: var(--text-muted);
  padding: var(--spacing-xs);
  line-height: 1;
}

.btn-close:hover:not(:disabled) {
  color: var(--text-primary);
}

.btn-close:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
</style>
