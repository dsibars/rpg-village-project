<template>
  <div class="daily-objectives">
    <h4>{{ t('daily_uxelm_objectives_title') }}</h4>

    <!-- CHOOSING: Show 4 choices, pick 2 -->
    <div v-if="status === 'choosing' && pendingChoices.length > 0" class="choices-panel">
      <p class="choices-hint">{{ t('daily_uxelm_choose_two') }}</p>
      <div class="choices-list">
        <div
          v-for="choice in pendingChoices"
          :key="choice.id"
          class="choice-card"
          :class="{ selected: selectedChoices.includes(choice.id) }"
          @click="toggleChoice(choice.id)"
        >
          <div class="choice-header">
            <span class="choice-check">{{ selectedChoices.includes(choice.id) ? '☑️' : '⬜' }}</span>
            <span class="choice-label">{{ formatLabel(choice) }}</span>
          </div>
          <div class="choice-reward">
            <span v-for="(amount, key) in choice.reward" :key="key" class="reward-tag">
              {{ formatReward(key, amount) }}
            </span>
          </div>
        </div>
      </div>
      <Button
        variant="primary"
        size="sm"
        class="confirm-btn"
        :disabled="selectedChoices.length !== 2"
        @click="confirmPick"
      >
        {{ t('daily_uxelm_confirm_selection') }} ({{ selectedChoices.length }}/2)
      </Button>
    </div>

    <!-- ACTIVE: Show active objectives with progress -->
    <div v-else-if="objectives.length > 0" class="objectives-list">
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
        <div v-if="obj.completed && !obj.claimed" class="claim-row">
          <Button variant="success" size="sm" class="claim-btn" @click="claimReward(obj.id)">
            {{ t('daily_uxelm_claim_reward') }}
          </Button>
          <span class="reward-preview">
            <span v-for="(amount, key) in obj.reward" :key="key" class="reward-mini">
              {{ formatReward(key, amount) }}
            </span>
          </span>
        </div>
      </div>

      <div v-if="allCompleted" class="all-completed">
        <span>🎉</span> {{ t('daily_uxelm_objective_all_done') }}
      </div>
    </div>

    <!-- IDLE: No objectives available -->
    <div v-else class="empty-state">
      {{ t('daily_uxelm_objective_none') }}
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import { useAdapter } from '@/core/composables/useAdapter.js'
import Button from '@/components/Button.vue'

const props = defineProps({
  dailyObjectives: { type: Object, default: null }
})

const { t } = useI18n()
const { dispatch } = useAdapter()

const objectives = computed(() => props.dailyObjectives?.objectives || [])
const pendingChoices = computed(() => props.dailyObjectives?.pendingChoices || [])
const status = computed(() => props.dailyObjectives?.status || 'idle')
const allCompleted = computed(() => props.dailyObjectives?.allCompleted || false)

const selectedChoices = ref([])

function formatLabel(obj) {
  return t(obj.label).replace('{target}', obj.target)
}

function formatReward(key, amount) {
  if (key === 'gold') return `💰 ${amount}g`
  if (key === 'material_wood') return `🪵 ${amount}`
  if (key === 'material_stone') return `🪨 ${amount}`
  if (key === 'material_iron') return `⛓️ ${amount}`
  return `${key}: ${amount}`
}

function toggleChoice(id) {
  const idx = selectedChoices.value.indexOf(id)
  if (idx >= 0) {
    selectedChoices.value.splice(idx, 1)
  } else if (selectedChoices.value.length < 2) {
    selectedChoices.value.push(id)
  }
}

function confirmPick() {
  if (selectedChoices.value.length !== 2) return
  dispatch('daily', 'pickObjectives', { objectiveIds: [...selectedChoices.value] })
  selectedChoices.value = []
}

function claimReward(objectiveId) {
  dispatch('daily', 'claimReward', { objectiveId })
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

/* Choices Panel */
.choices-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.choices-hint {
  margin: 0;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.choices-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.choice-card {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.15s ease;
}

.choice-card:hover {
  border-color: var(--color-primary-light);
}

.choice-card.selected {
  border-color: var(--color-primary);
  background: rgba(74, 222, 128, 0.08);
}

.choice-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin-bottom: 4px;
}

.choice-check {
  font-size: 0.9rem;
}

.choice-label {
  flex: 1;
  font-size: 0.85rem;
  color: var(--text-primary);
}

.choice-reward {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
  margin-left: 1.5rem;
}

.reward-tag {
  font-size: 0.75rem;
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.04);
  padding: 1px 6px;
  border-radius: var(--radius-sm);
}

.confirm-btn {
  margin-top: var(--spacing-xs);
}

/* Objectives List */
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
  opacity: 0.9;
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

.claim-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-xs);
  padding-top: var(--spacing-xs);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.claim-btn {
  min-width: auto;
  padding: 2px 10px;
  font-size: 0.75rem;
}

.reward-preview {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.reward-mini {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.all-completed {
  padding: var(--spacing-sm);
  text-align: center;
  color: #22c55e;
  font-size: 0.9rem;
  font-weight: 600;
}
</style>
