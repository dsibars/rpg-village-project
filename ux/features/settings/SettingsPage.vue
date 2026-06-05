<template>
  <div class="settings-page">
    <h1>{{ t('settings_uxelm_title') }}</h1>
    <EmptyState
      icon="\u{2699}"
      :title="t('settings_uxelm_title')"
      :message="t('settings_uxelm_desc')"
    />
  </div>
</template>

<script setup>
import { onErrorCaptured } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import EmptyState from '@/components/EmptyState.vue'

const { t } = useI18n()

onErrorCaptured((err, instance, info) => {
  console.error('SettingsPage error:', err, info)
  return false
})
</script>

<style scoped>
.settings-page {
  padding: var(--spacing-lg);
  color: var(--text-primary);
}

.settings-page h1 {
  font-family: var(--font-heading);
  color: var(--color-primary);
  margin-top: 0;
}
</style>
