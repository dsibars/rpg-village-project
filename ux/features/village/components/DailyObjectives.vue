<template>
  <div class="daily-objectives">
    <h4>{{ t('daily_uxelm_objectives_title') }}</h4>

    <div v-if="!objectives?.length" class="empty-state">
      {{ t('daily_uxelm_objective_none') }}
    </div>

    <div v-else class="objectives-list">
      <div
        v-for="obj in objectives"
        :key="obj.id || obj.label"
        class="objective-item"
        :class="{ completed: obj.completed }"
      >
        <div class="objective-header">
          <span class="objective-check">{{ obj.completed ? '✅' : '⬜' }}</span>
          <span class="objective-label">{{ formatLabel(obj) }}</span>
          <span class="objective-progress">{{ obj.progress }} / {{ obj.target }}</span>
        </div>
        <div class="progress-container">
          <div
            class="progress-bar"
            :class="{ success: obj.completed }"
            :style="{ width: `${Math.min(100, Math.floor((obj.progress / obj.target) * 100))}%` }"
          />
        </div>
      </div>

      <div v-if="allCompleted" class="all-completed">
        <span>🎉</span> {{ t('daily_uxelm_objective_all_done') }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'

const props = defineProps({
  dailyObjectives: { type: Object, default: null }
})

const { t } = useI18n()

const objectives = computed(() => props.dailyObjectives?.objectives || [])
const allCompleted = computed(() => props.dailyObjectives?.allCompleted || false)

function formatLabel(obj) {
  return t(obj.label).replace('{target}', obj.target)
}
</script>

<style scoped>
.daily-objectives {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.daily-objectives h4 {
  margin: 0;
  font-size: 0.95rem;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.empty-state {
  color: var(--text-muted);
  font-size: 0.85rem;
  font-style: italic;
}

.objectives-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.objective-item {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
}

.objective-item.completed {
  opacity: 0.7;
}

.objective-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin-bottom: 4px;
}

.objective-check {
  font-size: 0.9rem;
}

.objective-label {
  flex: 1;
  font-size: 0.85rem;
  color: var(--text-primary);
}

.objective-progress {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.progress-container {
  width: 100%;
  height: 6px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: var(--color-primary);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-bar.success {
  background: #22c55e;
}

.all-completed {
  padding: var(--spacing-sm);
  text-align: center;
  color: #22c55e;
  font-size: 0.9rem;
  font-weight: 600;
}
</style>
