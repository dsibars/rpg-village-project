<template>
  <div class="fallback-row">
    <span class="fallback-label">{{ t('gambit_uxelm_fallback') }}</span>
    <select :value="fallbackAction" @change="$emit('update', $event.target.value)">
      <option value="defend">{{ t('gambit_uxelm_defend') }}</option>
      <option
        v-for="family in learnedFamilies"
        :key="family"
        :value="family"
      >{{ family }}</option>
    </select>
  </div>
</template>

<script setup>
import { useI18n } from '@/core/composables/useI18n.js'

const { t } = useI18n()

defineProps({
  fallbackAction: { type: String, default: 'single_strike' },
  learnedFamilies: { type: Array, default: () => [] }
})

defineEmits(['update'])
</script>

<style scoped>
.fallback-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-md);
  margin-top: var(--spacing-sm);
}

.fallback-label {
  color: var(--color-danger);
  font-weight: bold;
  font-size: 0.875rem;
}

select {
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--bg-base);
  color: var(--text-primary);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  font-family: var(--font-body);
}
</style>
