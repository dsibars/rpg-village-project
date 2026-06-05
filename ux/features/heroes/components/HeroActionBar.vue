<template>
  <div class="hero-action-bar" role="group" :aria-label="t('heroes_uxelm_skills')">
    <Button
      v-for="action in actions"
      :key="action.id"
      variant="secondary"
      size="sm"
      class="action-btn"
      @click="$emit('action', action.id)"
    >
      <span class="action-icon">{{ action.icon }}</span>
      <span class="action-label">{{ action.label }}</span>
    </Button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import Button from '@/components/Button.vue'

const { t } = useI18n()

defineProps({
  hero: { type: Object, required: true }
})

defineEmits(['action'])

const actions = computed(() => [
  { id: 'skills', icon: '\u{2694}', label: t('heroes_uxelm_skills') },
  { id: 'equipment', icon: '\u{1F6E1}', label: t('inventory_uxelm_equipment') },
  { id: 'inscription', icon: '\u{2726}', label: t('heroes_uxelm_inscription_title') },
  { id: 'consumables', icon: '\u{1F9EA}', label: t('heroes_uxelm_consumables') }
])
</script>

<style scoped>
.hero-action-bar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.action-icon {
  font-size: 1rem;
}

.action-label {
  font-size: 0.75rem;
}
</style>
