<template>
  <div class="construction-queue">
    <h4>{{ t('village_uxelm_construction') }}</h4>

    <div v-if="queue.length === 0" class="empty-state">
      {{ t('village_uxelm_project_none') }}
    </div>

    <div v-else class="project-list">
      <div
        v-for="project in queue"
        :key="project.buildingId"
        class="project-card"
        @click="$emit('navigate', project.buildingId)"
      >
        <div class="project-header">
          <span class="project-name">{{ t('village_info_building_' + project.buildingId) }}</span>
          <span class="project-level">{{ t('shared_uxelm_level') }} {{ project.targetLevel }}</span>
        </div>
        <div class="project-status">
          <span>\u{23F3} {{ project.daysRemaining }} {{ t('shared_uxelm_days') }}</span>
        </div>
        <div class="progress-container">
          <div
            class="progress-bar"
            :style="{ width: `${progressPercent(project)}%` }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from '@/core/composables/useI18n.js'

const props = defineProps({
  queue: { type: Array, default: () => [] }
})

const emit = defineEmits(['navigate'])

const { t } = useI18n()

function progressPercent(project) {
  return ((project.duration - project.daysRemaining) / project.duration) * 100
}
</script>

<style scoped>
.construction-queue {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.construction-queue h4 {
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

.project-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.project-card {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.15s ease;
}

.project-card:hover {
  border-color: var(--color-primary-light);
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.project-name {
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--text-primary);
}

.project-level {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.project-status {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-bottom: 4px;
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
</style>
