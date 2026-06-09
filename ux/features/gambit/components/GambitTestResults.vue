<template>
  <ModalFrame :title="t('gambit_uxelm_test_results_title')" @close="$emit('close')">
    <div class="test-results">
      <div class="score-section">
        <div class="score-circle" :class="ratingClass">
          {{ healthScore }}
        </div>
        <div class="score-label">{{ t('gambit_uxelm_health_score') }}</div>
        <div class="rating-text">{{ t(`gambit_msg_score_${rating}`) }}</div>
      </div>

      <div class="stats-grid">
        <div class="stat">
          <div class="stat-value">{{ winRate }}</div>
          <div class="stat-label">{{ t('gambit_uxelm_win_rate') }}</div>
        </div>
        <div class="stat">
          <div class="stat-value">{{ result.avgHpRemaining }}</div>
          <div class="stat-label">{{ t('gambit_uxelm_avg_hp') }}</div>
        </div>
        <div class="stat">
          <div class="stat-value">{{ result.avgMpRemaining }}</div>
          <div class="stat-label">{{ t('gambit_uxelm_avg_mp') }}</div>
        </div>
      </div>

      <div v-if="result.log && result.log.length > 0" class="log-section">
        <h4>{{ t('gambit_uxelm_combat_log_sample') }}</h4>
        <pre class="combat-log">{{ result.log.slice(0, 20).join('\n') }}</pre>
      </div>
    </div>
  </ModalFrame>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import ModalFrame from '@/components/ModalFrame.vue'

const { t } = useI18n()

const props = defineProps({
  result: { type: Object, required: true },
  healthScore: { type: Number, required: true },
  rating: { type: String, required: true }
})

const emit = defineEmits(['close'])

const ratingClass = computed(() => `rating-${props.rating}`)

const winRate = computed(() => {
  const { victories = 0, runs = 1 } = props.result
  return `${Math.round((victories / runs) * 100)}% (${victories}/${runs})`
})
</script>

<style scoped>
.test-results {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.score-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
}

.score-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
}

.rating-fragile { background: var(--color-danger); }
.rating-functional { background: var(--color-warning); }
.rating-ironclad { background: var(--color-success); }

.score-label {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.rating-text {
  color: var(--text-primary);
  font-style: italic;
  text-align: center;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
}

.stat {
  text-align: center;
  padding: var(--spacing-md);
  background: var(--bg-card);
  border-radius: var(--radius-md);
}

.stat-value {
  font-size: 1.25rem;
  font-weight: bold;
  color: var(--text-primary);
}

.stat-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: var(--spacing-xs);
}

.log-section h4 {
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--text-primary);
  font-family: var(--font-heading);
}

.combat-log {
  background: var(--bg-base);
  padding: var(--spacing-md);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 0.75rem;
  max-height: 200px;
  overflow-y: auto;
  white-space: pre-wrap;
}
</style>
