<template>
  <ModalFrame
    v-if="open"
    :title="t('daily_report_uxelm_title', { day: report?.day || 0 })"
    @close="$emit('close')"
  >
    <div class="daily-report">
      <div v-if="!report" class="empty-state">
        {{ t('daily_report_uxelm_none') }}
      </div>

      <template v-else>
        <!-- Summary -->
        <div class="report-section">
          <h4>{{ t('daily_report_uxelm_summary') }}</h4>
          <div class="summary-grid">
            <div class="summary-item">
              <span class="summary-label">{{ t('daily_report_uxelm_income') }}</span>
              <span class="summary-value income">+{{ report.income || 0 }}g</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">{{ t('daily_report_uxelm_expenses') }}</span>
              <span class="summary-value expense">-{{ report.expenses || 0 }}g</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">{{ t('daily_report_uxelm_net') }}</span>
              <span class="summary-value" :class="netClass">{{ netGold }}g</span>
            </div>
          </div>
        </div>

        <!-- Events -->
        <div v-if="report.events?.length > 0" class="report-section">
          <h4>{{ t('daily_report_uxelm_events') }}</h4>
          <div class="event-list">
            <div
              v-for="(event, idx) in report.events"
              :key="idx"
              class="event-item"
            >
              <span class="event-icon">{{ eventIcon(event.type) }}</span>
              <span class="event-text">{{ event.message || event }}</span>
            </div>
          </div>
        </div>
      </template>
    </div>
  </ModalFrame>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import ModalFrame from '@/components/ModalFrame.vue'

const props = defineProps({
  report: { type: Object, default: null },
  open: { type: Boolean, default: false }
})

const emit = defineEmits(['close'])

const { t } = useI18n()

const netGold = computed(() => (props.report?.income || 0) - (props.report?.expenses || 0))

const netClass = computed(() => {
  if (netGold.value > 0) return 'income'
  if (netGold.value < 0) return 'expense'
  return ''
})

function eventIcon(type) {
  const map = {
    construction: '🏘',
    expedition: '🧭',
    hero: '⚔',
    combat: '💥',
    resource: '🌾'
  }
  return map[type] || '📌'
}
</script>

<style scoped>
.daily-report {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  min-width: 360px;
  max-width: 480px;
}

.empty-state {
  color: var(--text-muted);
  font-style: italic;
}

.report-section h4 {
  margin: 0 0 var(--spacing-sm);
  font-size: 0.9rem;
  color: var(--text-muted);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-sm);
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-sm);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
}

.summary-label {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.summary-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.summary-value.income {
  color: #22c55e;
}

.summary-value.expense {
  color: #ef4444;
}

.event-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.event-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
}

.event-icon {
  font-size: 1rem;
}

.event-text {
  color: var(--text-primary);
}
</style>
