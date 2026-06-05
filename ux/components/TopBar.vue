<template>
  <header class="top-bar">
    <div class="top-bar-brand">RPG Village</div>
    <div class="top-bar-day">{{ t('shared_uxelm_day') }} {{ day }}</div>
    <div class="top-bar-stats">
      <span class="stat">🪙 {{ gold }}</span>
      <span class="stat">👥 {{ populationDisplay }}</span>
      <span class="stat">🪵 {{ wood }}</span>
    </div>
    <button class="btn-next-day" @click="$emit('nextDay')">
      ☀️ {{ t('shared_uxelm_next_day') }}
    </button>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from '../core/composables/useI18n.js'

const props = defineProps({
  day: { type: Number, default: 1 },
  gold: { type: Number, default: 0 },
  population: { type: [Number, Object], default: 0 },
  wood: { type: Number, default: 0 }
})

defineEmits(['nextDay'])

const { t } = useI18n()

const populationDisplay = computed(() => {
  if (typeof props.population === 'object' && props.population !== null) {
    return props.population.total || 0
  }
  return props.population
})
</script>

<style scoped>
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--bg-card);
  border-bottom: 1px solid var(--glass-border);
  font-family: var(--font-body);
}

.top-bar-brand {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 1.25rem;
  color: var(--color-primary);
}

.top-bar-day {
  color: var(--text-secondary);
}

.top-bar-stats {
  display: flex;
  gap: var(--spacing-md);
}

.stat {
  color: var(--text-primary);
}

.btn-next-day {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-family: var(--font-body);
}

.btn-next-day:hover {
  background: var(--color-primary-light);
}
</style>
