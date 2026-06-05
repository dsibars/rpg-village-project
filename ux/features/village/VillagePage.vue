<template>
  <div class="village-page">
    <h1>{{ t('shared_uxelm_nav_village') }}</h1>
    <EmptyState
      icon="\u{1F3D8}"
      :title="t('shared_uxelm_nav_village')"
      message="Village overview and daily management will appear here."
    />
  </div>
</template>

<script setup>
import { onErrorCaptured } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import EmptyState from '@/components/EmptyState.vue'

const { t } = useI18n()

onErrorCaptured((err, instance, info) => {
  console.error('VillagePage error:', err, info)
  return false
})
</script>

<style scoped>
.village-page {
  padding: var(--spacing-lg);
  color: var(--text-primary);
}

.village-page h1 {
  font-family: var(--font-heading);
  color: var(--color-primary);
  margin-top: 0;
}
</style>
