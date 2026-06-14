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
      <div class="stat-group" :title="t('village_uxelm_tooltip_gold')">
        <span class="stat-icon stat-gold">💰</span>
        <span class="stat-value">{{ gold }}</span>
      </div>
      <div class="stat-group" :title="t('village_uxelm_tooltip_population')">
        <span class="stat-icon stat-pop">👥</span>
        <span class="stat-value">{{ populationDisplay }} / {{ maxPopulationDisplay }}</span>
      </div>
      <div class="stat-group" :title="t('village_uxelm_tooltip_wood')">
        <span class="stat-icon stat-wood">🪵</span>
        <span class="stat-value">{{ wood }}</span>
      </div>
      <div
        v-if="storageMax > 0"
        class="stat-group storage-group"
        :title="t('village_uxelm_tooltip_storage', { used: storageUsed, max: storageMax })"
        :class="{ 'storage-warning': storagePercent > 75, 'storage-danger': storagePercent > 90 }"
      >
        <span class="stat-icon">📦</span>
        <div class="storage-mini">
          <div class="storage-mini-track">
            <div
              class="storage-mini-fill"
              :style="{ width: `${storagePercent}%` }"
            />
          </div>
          <span class="storage-mini-text">{{ storageUsed }} / {{ storageMax }}</span>
        </div>
      </div>
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
  maxPopulation: { type: Number, default: 0 },
  wood: { type: Number, default: 0 },
  storageUsed: { type: Number, default: 0 },
  storageMax: { type: Number, default: 0 }
})

defineEmits(['nextDay', 'openSettings', 'navigate'])

const { t } = useI18n()

const populationDisplay = computed(() => {
  if (typeof props.population === 'object' && props.population !== null) {
    return props.population.total || 0
  }
  return props.population
})

const maxPopulationDisplay = computed(() => {
  if (typeof props.population === 'object' && props.population !== null) {
    return props.population.max || 0
  }
  return props.maxPopulation
})

const storagePercent = computed(() => {
  if (props.storageMax <= 0) return 0
  return Math.min(100, (props.storageUsed / props.storageMax) * 100)
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

.stat-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-md);
  transition: all 0.15s ease;
  cursor: default;
  user-select: none;
}

.stat-group:hover {
  background: rgba(255, 255, 255, 0.05);
}

.stat-icon {
  font-size: 1rem;
  line-height: 1;
}

.stat-gold {
  filter: drop-shadow(0 0 2px rgba(217, 119, 6, 0.4));
}

.stat-wood {
  filter: drop-shadow(0 0 2px rgba(120, 53, 15, 0.4));
}

.stat-pop {
  filter: drop-shadow(0 0 2px rgba(34, 197, 94, 0.3));
}

.stat-value {
  color: var(--text-primary);
  font-weight: 500;
  font-size: 0.95rem;
}

/* Storage mini indicator */
.storage-group {
  gap: var(--spacing-xs);
  min-width: 80px;
}

.storage-mini {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 60px;
}

.storage-mini-track {
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.storage-mini-fill {
  height: 100%;
  background: var(--color-success, #22c55e);
  border-radius: 2px;
  transition: width 0.3s ease, background 0.3s ease;
}

.storage-warning .storage-mini-fill {
  background: var(--color-warning, #f59e0b);
}

.storage-danger .storage-mini-fill {
  background: var(--color-danger, #ef4444);
}

.storage-mini-text {
  font-size: 0.65rem;
  color: var(--text-secondary);
  font-weight: 600;
  text-align: right;
  letter-spacing: 0.3px;
}

.storage-warning .storage-mini-text {
  color: var(--color-warning, #f59e0b);
}

.storage-danger .storage-mini-text {
  color: var(--color-danger, #ef4444);
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
  
  .storage-group {
    display: none;
  }
}

@media (max-width: 480px) {
  .top-bar-right {
    gap: var(--spacing-sm);
  }
  
  .stat-group {
    padding: var(--spacing-xs);
  }
  
  .stat-value {
    font-size: 0.85rem;
  }
}
</style>
