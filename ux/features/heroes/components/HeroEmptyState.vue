<template>
  <div class="hero-empty-state">
    <span class="empty-icon">🧍</span>
    <p class="empty-message">{{ t('heroes_uxelm_select_prompt') }}</p>
  </div>
</template>

<script setup>
import { useI18n } from '@/core/composables/useI18n.js'

const { t } = useI18n()
</script>

<style scoped>
.hero-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 240px;
  padding: var(--spacing-xl);
  text-align: center;
  color: var(--text-muted);
  gap: var(--spacing-md);
}

.empty-icon {
  font-size: 3rem;
  opacity: 0.5;
}

.empty-message {
  margin: 0;
  font-size: 1rem;
  max-width: 280px;
}
</style>
