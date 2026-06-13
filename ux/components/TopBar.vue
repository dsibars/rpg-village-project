<template>
  <header class="top-bar">
    <div class="top-bar-left">
      <div class="top-bar-brand">RPG Village</div>
      <div class="top-bar-day">{{ t('shared_uxelm_day') }} {{ day }}</div>
    </div>

    <div class="top-bar-center">
      <button class="btn-next-day" @click="$emit('nextDay')">
        ☀️ {{ t('shared_uxelm_next_day') }}
      </button>
      <button
        class="btn-quick btn-text"
        @click="$emit('navigate', { page: 'adventure', tab: 'codex' })"
      >
        📖 {{ t('shared_uxelm_nav_codex') }}
      </button>
      <button
        class="btn-quick btn-text"
        @click="$emit('navigate', { page: 'adventure', tab: 'chronicle' })"
      >
        📜 {{ t('nav_chronicle') }}
      </button>
    </div>

    <div class="top-bar-right">
      <span class="stat">💰 {{ gold }}</span>
      <span class="stat">👥 {{ populationDisplay }}</span>
      <span class="stat">🪵 {{ wood }}</span>
      <button class="btn-quick" :title="t('shared_uxelm_nav_settings')" @click="$emit('openSettings')">
        ⚙️
      </button>
    </div>
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

defineEmits(['nextDay', 'openSettings', 'navigate'])

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

.top-bar-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.top-bar-brand {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 1.25rem;
  color: var(--color-primary);
}

.top-bar-day {
  color: var(--text-secondary);
  text-transform: uppercase;
  font-weight: 600;
  font-size: 0.9rem;
  letter-spacing: 0.5px;
}

.top-bar-center {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.top-bar-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.stat {
  color: var(--text-primary);
  font-weight: 500;
  font-size: 0.95rem;
}

.btn-quick {
  padding: var(--spacing-xs);
  background: transparent;
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  transition: all 0.15s ease;
  color: var(--text-secondary);
}

.btn-quick:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: var(--color-primary-light);
  color: var(--text-primary);
}

.btn-quick.btn-text {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-family: var(--font-heading);
}

.btn-next-day {
  padding: var(--spacing-sm) var(--spacing-md);
  background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
  color: white;
  border: 1px solid rgba(251, 191, 36, 0.35);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-family: var(--font-body);
  text-transform: uppercase;
  font-weight: 700;
  font-size: 0.85rem;
  letter-spacing: 0.5px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(217, 119, 6, 0.3);
}

.btn-next-day:hover {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  box-shadow: 0 4px 12px rgba(217, 119, 6, 0.5);
}

@media (max-width: 768px) {
  .top-bar {
    flex-wrap: wrap;
    gap: var(--spacing-sm);
  }

  .top-bar-center {
    order: 3;
    width: 100%;
    justify-content: center;
  }
}
</style>
