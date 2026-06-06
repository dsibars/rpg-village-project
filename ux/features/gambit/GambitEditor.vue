<template>
  <FullViewOverlay @close="$emit('close')">
    <template #icon>🎲</template>
    <template #title>{{ t('gambit_uxelm_title') }}</template>

    <div class="gambit-editor">
      <div class="editor-layout">
        <!-- Left panel: list + fallback -->
        <div class="editor-left">
          <GambitList
            :gambits="localGambits"
            :fallback-action="localFallback"
            :learned-families="hero.knownFamilies"
            @move="handleMove"
            @toggle="handleToggle"
            @remove="handleRemove"
            @update-fallback="handleUpdateFallback"
          />
        </div>

        <!-- Right panel: form + actions -->
        <div class="editor-right">
          <p class="editor-desc">{{ t('gambit_uxelm_desc') }}</p>

          <GambitForm
            :hero="hero"
            :disabled="localGambits.length >= 12"
            @add="handleAdd"
          />

          <div class="editor-actions">
            <button class="btn-preset" @click="handleSuggestPreset">
              💡 {{ t('gambit_uxelm_preset_suggest') }}
            </button>
            <button class="btn-test" @click="showTestSetup = true">
              🧪 {{ t('gambit_uxelm_test_mode') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <GambitTestSetup
      v-if="showTestSetup"
      :bestiary="bestiary"
      :enemy-templates="enemyTemplates"
      @close="showTestSetup = false"
      @start="handleTestStart"
    />

    <GambitTestResults
      v-if="showTestResults"
      :result="testResult"
      :health-score="testHealthScore"
      :rating="testRating"
      @close="showTestResults = false"
    />
  </FullViewOverlay>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import FullViewOverlay from '@/components/FullViewOverlay.vue'
import GambitList from './components/GambitList.vue'
import GambitForm from './components/GambitForm.vue'
import GambitTestSetup from './components/GambitTestSetup.vue'
import GambitTestResults from './components/GambitTestResults.vue'

const { t } = useI18n()

const props = defineProps({
  hero: { type: Object, required: true },
  bestiary: { type: Array, default: () => [] },
  enemyTemplates: { type: Array, default: () => [] }
})

const emit = defineEmits(['close', 'action'])

// Local mutable copies of gambit state
const localGambits = ref([...props.hero.gambits])
const localFallback = ref(props.hero.fallbackAction || 'single_strike')

// Modal visibility
const showTestSetup = ref(false)
const showTestResults = ref(false)
const testResult = ref({})
const testHealthScore = ref(0)
const testRating = ref('fragile')

// --- Event handlers ---

function handleMove(gambitId, direction) {
  const idx = localGambits.value.findIndex(g => g.id === gambitId)
  if (idx < 0) return
  const newIdx = idx + direction
  if (newIdx < 0 || newIdx >= localGambits.value.length) return

  const temp = localGambits.value[idx]
  localGambits.value[idx] = localGambits.value[newIdx]
  localGambits.value[newIdx] = temp

  emit('action', 'moveGambit', { heroId: props.hero.id, gambitId, direction })
}

function handleToggle(gambitId) {
  const gambit = localGambits.value.find(g => g.id === gambitId)
  if (gambit) gambit.enabled = !gambit.enabled
  emit('action', 'toggleGambit', { heroId: props.hero.id, gambitId })
}

function handleRemove(gambitId) {
  localGambits.value = localGambits.value.filter(g => g.id !== gambitId)
  emit('action', 'removeGambit', { heroId: props.hero.id, gambitId })
}

function handleUpdateFallback(action) {
  localFallback.value = action
  emit('action', 'updateFallbackAction', { heroId: props.hero.id, action })
}

function handleAdd({ conditionRaw, actionRaw, target, tier }) {
  const tempId = `temp_${Date.now()}`
  const actionType = actionRaw.startsWith('spell:') ? 'spell'
    : actionRaw.startsWith('tech:') ? 'skill'
    : actionRaw === 'defend' ? 'defend'
    : 'skill'
  const payload = actionRaw.startsWith('spell:') ? actionRaw.replace('spell:', '')
    : actionRaw.startsWith('tech:') ? actionRaw.replace('tech:', '')
    : actionRaw

  const conditionMap = {
    'ALLY_HP_LT_50': { type: 'ally_hp', operator: '<', value: 0.5 },
    'ALLY_HP_LT_25': { type: 'ally_hp', operator: '<', value: 0.25 },
    'SELF_HP_LT_50': { type: 'self_hp', operator: '<', value: 0.5 },
    'SELF_MP_LT_25': { type: 'self_mp', operator: '<', value: 0.25 },
    'ANY_ENEMY': { type: 'always', operator: '=', value: true },
    'ENEMY_COUNT_GT_2': { type: 'enemy_count', operator: '>', value: 2 }
  }

  localGambits.value.push({
    id: tempId,
    conditions: [{ op: 'SINGLE', left: conditionMap[conditionRaw], right: null }],
    action: { type: actionType, payload, tier },
    target,
    enabled: true
  })

  emit('action', 'addGambit', { heroId: props.hero.id, gambit: localGambits.value[localGambits.value.length - 1] })
}

function handleSuggestPreset() {
  emit('action', 'suggestPreset', { heroId: props.hero.id })
}

function handleTestStart(enemies) {
  showTestSetup.value = false
  emit('action', 'testGambits', {
    heroId: props.hero.id,
    enemies,
    onResult: (data) => {
      if (data) {
        const res = data.result || {}
        testResult.value = {
          runs: res.runs || 0,
          victories: res.victories || 0,
          defeats: res.defeats || 0,
          avgHpRemaining: res.avgHpRemaining || 0,
          avgMpRemaining: res.avgMpRemaining || 0,
          log: res.log || []
        }
        testHealthScore.value = data.healthScore || 0
        testRating.value = data.rating || 'fragile'
        showTestResults.value = true
      }
    }
  })
}
</script>

<style scoped>
.gambit-editor {
  height: 100%;
  padding: var(--spacing-lg);
}

.editor-layout {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: var(--spacing-lg);
  height: 100%;
}

.editor-left {
  overflow-y: auto;
}

.editor-right {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.editor-desc {
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin: 0;
}

.editor-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.btn-preset, .btn-test {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  cursor: pointer;
  font-family: var(--font-body);
}

.btn-preset:hover, .btn-test:hover {
  background: var(--glass-border);
}

@media (max-width: 768px) {
  .editor-layout {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto;
  }
}
</style>
