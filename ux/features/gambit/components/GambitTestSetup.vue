<template>
  <ModalFrame :title="t('gambit_uxelm_test_setup_title')" @close="$emit('close')">
    <div class="test-setup">
      <div class="bestiary-section">
        <h4>{{ t('gambit_uxelm_bestiary_catalog') }}</h4>
        <div class="enemy-catalog">
          <button
            v-for="template in availableEnemies"
            :key="template.id"
            class="enemy-card"
            :class="{ selected: isSelected(template.id) }"
            @click="toggleEnemy(template)"
          >
            {{ template.name }}
          </button>
        </div>
      </div>

      <div v-if="selectedEnemies.length > 0" class="party-section">
        <h4>{{ t('gambit_uxelm_encounter_party') }}</h4>
        <div
          v-for="(enemy, index) in selectedEnemies"
          :key="index"
          class="selected-enemy"
        >
          <span>{{ enemy.name }}</span>
          <input
            v-model.number="enemy.level"
            type="number"
            min="1"
            :max="maxEnemyLevel"
            class="level-input"
          />
          <button class="btn-remove" @click="removeEnemy(index)">×</button>
        </div>
      </div>

      <div v-else class="empty-notice">
        {{ t('gambit_uxelm_enemy_none_selected') }}
      </div>

      <button
        class="btn-start"
        :disabled="selectedEnemies.length === 0"
        @click="handleStart"
      >{{ t('gambit_uxelm_simulation_start') }}</button>
    </div>
  </ModalFrame>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import ModalFrame from '@/components/ModalFrame.vue'

const { t } = useI18n()

const props = defineProps({
  bestiary: { type: Array, default: () => [] },
  enemyTemplates: { type: [Array, Object], default: () => [] }
})

const emit = defineEmits(['start', 'close'])

const selectedEnemies = ref([])
const maxEnemyLevel = 50

const availableEnemies = computed(() => {
  const templates = Array.isArray(props.enemyTemplates)
    ? props.enemyTemplates
    : Object.entries(props.enemyTemplates).map(([id, template]) => ({ id, ...template }))
  const availableIds = props.bestiary?.length ? props.bestiary : ['slime_green']
  return templates.filter(t => availableIds.includes(t.id))
})

function isSelected(templateId) {
  return selectedEnemies.value.some(e => e.templateId === templateId)
}

function toggleEnemy(template) {
  const index = selectedEnemies.value.findIndex(e => e.templateId === template.id)
  if (index >= 0) {
    selectedEnemies.value.splice(index, 1)
  } else if (selectedEnemies.value.length < 6) {
    selectedEnemies.value.push({
      templateId: template.id,
      name: template.name,
      level: 1
    })
  }
}

function removeEnemy(index) {
  selectedEnemies.value.splice(index, 1)
}

function handleStart() {
  emit('start', selectedEnemies.value.map(e => ({
    templateId: e.templateId,
    level: e.level
  })))
}
</script>

<style scoped>
.test-setup {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.bestiary-section h4,
.party-section h4 {
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--text-primary);
  font-family: var(--font-heading);
}

.enemy-catalog {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.enemy-card {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  cursor: pointer;
  font-family: var(--font-body);
}

.enemy-card.selected {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.selected-enemy {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: var(--bg-card);
  border-radius: var(--radius-sm);
  margin-bottom: var(--spacing-xs);
}

.level-input {
  width: 60px;
  padding: var(--spacing-xs);
  background: var(--bg-base);
  color: var(--text-primary);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
}

.empty-notice {
  color: var(--text-muted);
  text-align: center;
  padding: var(--spacing-lg);
}

.btn-start {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-success);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-family: var(--font-body);
}

.btn-start:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-start:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-remove {
  background: transparent;
  border: none;
  color: var(--color-danger);
  cursor: pointer;
  font-size: 1.2rem;
}
</style>
