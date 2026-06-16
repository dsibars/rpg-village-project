<template>
  <div class="daily-objectives">
    <!-- === MISSION BOARD UI (new system) === -->
    <template v-if="missionBoard">
      <!-- LOCKED: No mission board built -->
      <div v-if="missionBoard.level <= 0" class="mission-locked">
        <h4 class="mission-title">🔒 {{ t('mission_uxelm_locked_title') }}</h4>
        <p class="mission-hint">{{ t('mission_uxelm_locked_hint') }}</p>
        <p class="mission-requires">
          {{ t('mission_uxelm_locked_requires') }}
        </p>
      </div>

      <!-- ACTIVE: Mission board built -->
      <template v-else>
        <h4 class="mission-title">
          📋 {{ t('village_info_building_mission_board') }} (Lv{{ missionBoard.level }})
        </h4>

        <!-- Mission slots -->
        <div v-if="missionBoard.activeMissions && missionBoard.activeMissions.length > 0" class="missions-list">
          <div
            v-for="mission in missionBoard.activeMissions"
            :key="mission.id"
            class="mission-card"
            :class="{ completed: mission.completed }"
          >
            <div class="mission-header">
              <span class="mission-icon">{{ mission.icon || '📜' }}</span>
              <span class="mission-name">{{ formatMissionTitle(mission) }}</span>
              <span class="mission-count">{{ mission.progress || 0 }} / {{ mission.target }}</span>
            </div>

            <div class="progress-container">
              <div
                class="progress-bar"
                :class="{ success: mission.completed }"
                :style="{ width: `${Math.min(100, Math.floor(((mission.progress || 0) / mission.target) * 100))}%` }"
              />
            </div>

            <div class="mission-footer">
              <div class="mission-rewards">
                <span v-for="(amount, key) in mission.reward" :key="key" class="reward-tag">
                  {{ formatReward(key, amount) }}
                </span>
              </div>

              <div v-if="mission.completed && !mission.claimed" class="mission-actions">
                <Button
                  variant="success"
                  size="sm"
                  class="claim-btn"
                  @click="claimMission(mission.id)"
                >
                  {{ t('daily_uxelm_claim_reward') }}
                </Button>
              </div>

              <div v-else-if="!mission.completed" class="mission-actions">
                <Button
                  variant="secondary"
                  size="sm"
                  class="reroll-btn"
                  :disabled="!missionBoard.canReroll"
                  @click="rerollMission(mission.id)"
                >
                  {{ missionBoard.canReroll ? t('mission_uxelm_reroll') : t('mission_uxelm_reroll_cooldown') }}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty slots -->
        <div v-else class="mission-empty">
          {{ t('mission_uxelm_empty') }}
        </div>

        <!-- Upgrade hint -->
        <div v-if="missionBoard.level < 4" class="upgrade-hint">
          <span class="upgrade-arrow">⬆️</span>
          {{ t('mission_uxelm_upgrade_hint', { level: missionBoard.level + 1 }) }}
        </div>
      </template>
    </template>

    <!-- === LEGACY DAILY OBJECTIVES UI (fallback) === -->
    <template v-else>
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
    </template>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import { useAdapter } from '@/core/composables/useAdapter.js'
import Button from '@/components/Button.vue'

const props = defineProps({
  dailyObjectives: { type: Object, default: null },
  missionBoard: { type: Object, default: null }
})

const { t } = useI18n()
const { dispatch } = useAdapter()

// ─── Legacy daily objectives computed ───────────────────────────
const objectives = computed(() => props.dailyObjectives?.objectives || [])
const pendingChoices = computed(() => props.dailyObjectives?.pendingChoices || [])
const status = computed(() => props.dailyObjectives?.status || 'idle')
const allCompleted = computed(() => props.dailyObjectives?.allCompleted || false)

const selectedChoices = ref([])

// ─── Format helpers ──────────────────────────────────────────────
function formatLabel(obj) {
  return t(obj.label).replace('{target}', obj.target)
}

function formatMissionTitle(mission) {
  // New mission system uses titleKey
  if (mission.titleKey) {
    return t(mission.titleKey)
  }
  // Fallback: if label exists (legacy or hybrid)
  if (mission.label) {
    return t(mission.label).replace('{target}', mission.target)
  }
  return 'Mission'
}

function formatReward(key, amount) {
  if (key === 'gold') return `💰 ${amount}g`
  if (key === 'material_wood') return `🪵 ${amount}`
  if (key === 'material_stone') return `🪨 ${amount}`
  if (key === 'material_iron') return `⛓️ ${amount}`
  if (key === 'material_crystal') return `💎 ${amount}`
  if (key === 'material_gold_ore') return `🟡 ${amount}`
  return `${key}: ${amount}`
}

// ─── Legacy actions ──────────────────────────────────────────────
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

// ─── New mission board actions ───────────────────────────────────
function claimMission(missionId) {
  dispatch('mission', 'claimMission', { missionId })
}

function rerollMission(missionId) {
  dispatch('mission', 'rerollMission', { missionId })
}
</script>

<style scoped>
.daily-objectives {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.daily-objectives h4,
.mission-title {
  margin: 0;
  font-size: 0.95rem;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.empty-state,
.mission-empty {
  color: var(--text-muted);
  font-size: 0.85rem;
  font-style: italic;
}

/* ─── Mission Board: Locked State ─────────────────────────────── */
.mission-locked {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm);
  background: rgba(0, 0, 0, 0.15);
  border: 1px dashed var(--glass-border);
  border-radius: var(--radius-md);
}

.mission-hint {
  margin: 0;
  font-size: 0.8rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

.mission-requires {
  margin: 0;
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* ─── Mission Board: Active Missions ───────────────────────────── */
.missions-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.mission-card {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  transition: all 0.15s ease;
}

.mission-card.completed {
  opacity: 0.9;
  border-color: rgba(34, 197, 94, 0.3);
}

.mission-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin-bottom: 4px;
}

.mission-icon {
  font-size: 1rem;
}

.mission-name {
  flex: 1;
  font-size: 0.85rem;
  color: var(--text-primary);
}

.mission-count {
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
  margin-bottom: 4px;
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

.mission-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-xs);
  padding-top: var(--spacing-xs);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.mission-rewards {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.mission-actions {
  display: flex;
  gap: var(--spacing-xs);
}

.claim-btn,
.reroll-btn {
  min-width: auto;
  padding: 2px 10px;
  font-size: 0.75rem;
}

/* ─── Upgrade Hint ─────────────────────────────────────────────── */
.upgrade-hint {
  padding: var(--spacing-sm);
  text-align: center;
  font-size: 0.8rem;
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.03);
  border: 1px dashed var(--glass-border);
  border-radius: var(--radius-md);
}

.upgrade-arrow {
  margin-right: 4px;
}

/* ─── Legacy: Choices Panel ────────────────────────────────────── */
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

/* ─── Legacy: Objectives List ──────────────────────────────────── */
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

.claim-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-xs);
  padding-top: var(--spacing-xs);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
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
