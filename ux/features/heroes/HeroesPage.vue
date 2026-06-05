<template>
  <div class="heroes-page">
    <h1>{{ t('shared_uxelm_nav_heroes') }}</h1>
    <EmptyState
      icon="\u{2694}"
      :title="t('shared_uxelm_nav_heroes')"
      message="Hero roster and skill management will appear here."
    />
  </div>
</template>

<script setup>
import { onErrorCaptured } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import EmptyState from '@/components/EmptyState.vue'

const { t } = useI18n()

onErrorCaptured((err, instance, info) => {
  console.error('HeroesPage error:', err, info)
  return false
})
</script>

<style scoped>
.heroes-page {
  padding: var(--spacing-lg);
  color: var(--text-primary);
}

.heroes-page h1 {
  font-family: var(--font-heading);
  color: var(--color-primary);
  margin-top: 0;
}
</style>
