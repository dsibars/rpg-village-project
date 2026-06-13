<template>
  <ModalFrame
    v-if="open"
    :title="t('hall_of_fame_uxelm_title')"
    @close="$emit('close')"
  >
    <div class="hall-modal">
      <div class="stats-section">
        <div class="stat-grid">
          <div class="stat-item">
            <span class="stat-label">{{ t('hall_of_fame_info_stat_enemies') }}</span>
            <strong class="stat-value">{{ stats.enemiesDefeated || 0 }}</strong>
          </div>
          <div class="stat-item">
            <span class="stat-label">{{ t('hall_of_fame_info_stat_damage') }}</span>
            <strong class="stat-value">{{ stats.damageDealt || 0 }}</strong>
          </div>
          <div class="stat-item">
            <span class="stat-label">{{ t('hall_of_fame_info_stat_expeditions') }}</span>
            <strong class="stat-value">{{ stats.expeditionsCompleted || 0 }}</strong>
          </div>
          <div class="stat-item">
            <span class="stat-label">{{ t('hall_of_fame_info_stat_wins') }}</span>
            <strong class="stat-value">{{ stats.battlesWon || 0 }}</strong>
          </div>
        </div>
      </div>

      <div class="titles-section">
        <h4 class="section-title">{{ t('hall_of_fame_uxelm_titles') }}</h4>
        <div v-if="titles.length === 0" class="empty-state">
          {{ t('hall_of_fame_uxelm_no_titles') }}
        </div>
        <div v-else class="title-list">
          <span
            v-for="(title, index) in titles"
            :key="index"
            class="title-badge"
          >
            {{ t(title) }}
          </span>
        </div>
      </div>

      <div class="hall-footer">
        <Button variant="secondary" size="sm" @click="$emit('close')">
          {{ t('shared_uxelm_close') }}
        </Button>
      </div>
    </div>
  </ModalFrame>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import ModalFrame from '@/components/ModalFrame.vue'
import Button from '@/components/Button.vue'

const props = defineProps({
  hero: { type: Object, required: true },
  open: { type: Boolean, default: false }
})

const emit = defineEmits(['close'])

const { t } = useI18n()

const stats = computed(() => props.hero.lifetimeStats || {})
const titles = computed(() => props.hero.titles || [])
</script>

<style scoped>
.hall-modal {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  min-width: 360px;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-sm);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
}

.stat-label {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.stat-value {
  font-size: 1.25rem;
  color: var(--text-primary);
}

.section-title {
  margin: 0 0 var(--spacing-sm);
  font-size: 0.85rem;
  color: var(--text-muted);
}

.empty-state {
  color: var(--text-muted);
  font-size: 0.85rem;
  font-style: italic;
}

.title-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.title-badge {
  display: inline-block;
  padding: var(--spacing-xs) var(--spacing-sm);
  background: rgba(234, 179, 8, 0.12);
  border: 1px solid rgba(234, 179, 8, 0.3);
  border-radius: var(--radius-md);
  font-size: 0.8rem;
  color: #ffc107;
}

.hall-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--spacing-sm);
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--glass-border);
}
</style>
