<template>
  <div class="save-slot-page">
    <h1>{{ t('shared_uxelm_save_slot_title') }}</h1>
    <p class="subtitle">Select a slot to continue, or choose an empty slot to start a new game.</p>

    <div class="slots-grid">
      <button
        v-for="slot in slots"
        :key="slot.index"
        class="slot-card"
        :class="{ empty: !slot.exists }"
        @click="$emit('selectSlot', slot.index)"
      >
        <div class="slot-number">{{ slot.index + 1 }}</div>
        <div class="slot-info">
          <div v-if="slot.exists" class="slot-meta">
            <span class="slot-day">{{ t('shared_uxelm_day') }} {{ slot.day || 0 }}</span>
            <span class="slot-date">{{ formatDate(slot.lastPlayedAt) }}</span>
          </div>
          <div v-else class="slot-empty-label">{{ t('shared_uxelm_save_slot_empty') }}</div>
        </div>
        <button
          v-if="slot.exists"
          class="btn-delete"
          @click.stop="$emit('deleteSlot', slot.index)"
        >{{ t('shared_uxelm_save_slot_delete') }}</button>
      </button>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from '@/core/composables/useI18n.js'

const { t } = useI18n()

defineProps({
  slots: {
    type: Array,
    default: () => Array.from({ length: 10 }, (_, i) => ({ index: i, exists: false }))
  }
})

defineEmits(['selectSlot', 'deleteSlot'])

function formatDate(isoString) {
  if (!isoString) return ''
  try {
    return new Date(isoString).toLocaleDateString()
  } catch {
    return isoString
  }
}
</script>

<style scoped>
.save-slot-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: var(--spacing-xl);
  color: var(--text-primary);
  background: var(--bg-base);
}

.save-slot-page h1 {
  font-family: var(--font-heading);
  color: var(--color-primary);
  margin: 0 0 var(--spacing-sm) 0;
}

.subtitle {
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xl);
}

.slots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--spacing-md);
  width: 100%;
  max-width: 800px;
}

.slot-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  color: var(--text-primary);
  cursor: pointer;
  text-align: left;
  font-family: var(--font-body);
}

.slot-card.empty {
  opacity: 0.6;
}

.slot-card:hover {
  border-color: var(--color-primary);
}

.slot-number {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary);
  color: white;
  border-radius: var(--radius-md);
  font-weight: bold;
  flex-shrink: 0;
}

.slot-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.slot-meta {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.slot-day {
  font-weight: 500;
}

.slot-date {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.slot-empty-label {
  color: var(--text-muted);
  font-style: italic;
}

.btn-delete {
  padding: var(--spacing-xs) var(--spacing-sm);
  background: transparent;
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-sm);
  color: var(--color-danger);
  cursor: pointer;
  font-size: 0.75rem;
}

.btn-delete:hover {
  background: var(--color-danger);
  color: white;
}
</style>
