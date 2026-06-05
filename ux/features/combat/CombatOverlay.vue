<template>
  <FullViewOverlay @close="$emit('close')">
    <template #icon>\u{2694}</template>
    <template #title>{{ t('combat_uxelm_battle_title') }}</template>

    <div class="combat-overlay">
      <EmptyState
        icon="\u{2694}"
        :title="t('combat_uxelm_battle_title')"
        message="Combat interface will appear here when a battle begins."
      />
    </div>
  </FullViewOverlay>
</template>

<script setup>
import { onErrorCaptured } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import FullViewOverlay from '@/components/FullViewOverlay.vue'
import EmptyState from '@/components/EmptyState.vue'

const { t } = useI18n()

defineEmits(['close'])

onErrorCaptured((err, instance, info) => {
  console.error('CombatOverlay error:', err, info)
  return false
})
</script>

<style scoped>
.combat-overlay {
  padding: var(--spacing-lg);
  color: var(--text-primary);
}
</style>
