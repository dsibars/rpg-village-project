<template>
  <div class="gambit-list">
    <div class="gambit-count">{{ t('gambit_uxelm_count') }}: {{ gambits.length }} / 12</div>

    <div class="gambit-slots">
      <GambitRow
        v-for="(gambit, index) in gambits"
        :key="gambit.id"
        :gambit="gambit"
        :index="index"
        :is-first="index === 0"
        :is-last="index === gambits.length - 1"
        @move="(id, dir) => $emit('move', id, dir)"
        @toggle="$emit('toggle', $event)"
        @remove="$emit('remove', $event)"
      />

      <div
        v-for="slotIndex in emptySlots"
        :key="`empty-${slotIndex}`"
        class="gambit-slot-empty"
      >
        <span class="slot-index">{{ slotIndex }}</span>
        <span class="slot-label">{{ t('gambit_uxelm_slot_empty') }}</span>
      </div>
    </div>

    <GambitFallbackRow
      :fallback-action="fallbackAction"
      :learned-families="learnedFamilies"
      @update="$emit('updateFallback', $event)"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import GambitRow from './GambitRow.vue'
import GambitFallbackRow from './GambitFallbackRow.vue'

const { t } = useI18n()

const props = defineProps({
  gambits: { type: Array, default: () => [] },
  fallbackAction: { type: String, default: 'single_strike' },
  learnedFamilies: { type: Array, default: () => [] }
})

const emit = defineEmits(['move', 'toggle', 'remove', 'updateFallback'])

const emptySlots = computed(() => {
  const empties = []
  for (let i = props.gambits.length + 1; i <= 12; i++) {
    empties.push(i)
  }
  return empties
})
</script>

<style scoped>
.gambit-list {
  display: flex;
  flex-direction: column;
}

.gambit-count {
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin-bottom: var(--spacing-sm);
}

.gambit-slots {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.gambit-slot-empty {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px dashed var(--glass-border);
  border-radius: var(--radius-md);
  opacity: 0.5;
}

.slot-index {
  width: 24px;
  text-align: center;
  color: var(--text-muted);
  flex-shrink: 0;
}

.slot-label {
  color: var(--text-muted);
  font-size: 0.875rem;
}
</style>
