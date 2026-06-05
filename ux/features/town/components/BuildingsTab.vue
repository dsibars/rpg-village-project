<template>
  <div class="buildings-tab">
    <div class="buildings-layout">
      <!-- Building List -->
      <div class="building-list">
        <div
          v-for="building in buildings"
          :key="building.id"
          class="building-card"
          :class="{ active: selectedId === building.id, locked: !building.active }"
          @click="selectBuilding(building.id)"
        >
          <span class="building-icon">{{ building.active ? building.icon : '\u{1F512}' }}</span>
          <div class="building-info">
            <span class="building-name">{{ building.name }}</span>
            <span class="building-level">{{ t('shared_uxelm_level') }} {{ building.lvl }}</span>
          </div>
        </div>
      </div>

      <!-- Detail Pane -->
      <div v-if="selectedBuilding" class="detail-pane">
        <h3>{{ selectedBuilding.name }}</h3>
        <p class="building-desc">{{ buildingDescription }}</p>

        <div class="current-effects">
          <h4>{{ t('buildings_uxelm_current_effects') }}</h4>
          <p>{{ currentEffects }}</p>
        </div>

        <div v-if="nextEffects" class="next-effects">
          <h4>{{ t('buildings_uxelm_next_level') }}</h4>
          <p>{{ nextEffects }}</p>
        </div>

        <div v-if="upgradeCost" class="upgrade-cost">
          <h4>{{ t('buildings_uxelm_cost') }}</h4>
          <p>\u{1F4B0} {{ upgradeCost.gold }}g</p>
          <p v-for="(amount, mat) in upgradeCost.materials" :key="mat">
            {{ mat }}: {{ amount }}
          </p>
          <p>\u{23F3} {{ upgradeCost.duration }} {{ t('shared_uxelm_days') }}</p>
        </div>

        <Button
          variant="primary"
          :disabled="!canUpgrade"
          @click="startUpgrade"
        >
          {{ selectedBuilding.lvl === 0 ? t('buildings_uxelm_build') : t('buildings_uxelm_upgrade') }}
        </Button>
      </div>

      <EmptyState v-else icon="\u{1F3D8}" :title="t('buildings_uxelm_select')" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import { useGameState } from '@/core/composables/useGameState.js'
import { useAdapter } from '@/core/composables/useAdapter.js'
import Button from '@/components/Button.vue'
import EmptyState from '@/components/EmptyState.vue'

const { t } = useI18n()
const { gameState } = useGameState()
const { dispatch } = useAdapter()

const selectedId = ref(null)

const village = computed(() => gameState.value.village || {})
const infrastructure = computed(() => village.value.infrastructure || {})
const constructionQueue = computed(() => village.value.constructionQueue || [])
const gold = computed(() => village.value.gold || 0)

const buildings = computed(() => {
  const defs = [
    { id: 'townhall', name: t('village_info_building_townhall'), icon: '\u{1F3DB}' },
    { id: 'housing', name: t('village_info_building_housing'), icon: '\u{1F3E0}' },
    { id: 'farm', name: t('village_info_building_farm'), icon: '\u{1F33E}' },
    { id: 'warehouse', name: t('village_info_building_warehouse'), icon: '\u{1F4E6}' },
    { id: 'blacksmith', name: t('village_info_building_blacksmith'), icon: '\u{2692}' },
    { id: 'training_grounds', name: t('village_info_building_training_grounds'), icon: '\u{1F4AA}' },
    { id: 'explorer_guild', name: t('village_info_building_explorer_guild'), icon: '\u{1F9ED}' },
    { id: 'witchs_hut', name: t('village_info_building_witchs_hut'), icon: '\u{1F52E}' },
    { id: 'arcane_sanctum', name: t('village_info_building_arcane_sanctum'), icon: '\u{2728}' },
    { id: 'infirmary', name: t('village_info_building_infirmary'), icon: '\u{1F3E5}' },
    { id: 'tavern', name: t('village_info_building_tavern'), icon: '\u{1F37A}' }
  ]
  return defs.map((b) => ({
    ...b,
    lvl: infrastructure.value[b.id] || 0,
    active: (infrastructure.value[b.id] || 0) > 0
  }))
})

const selectedBuilding = computed(() =>
  buildings.value.find((b) => b.id === selectedId.value)
)

const buildingData = computed(() => {
  // Simplified — real data would come from engine/building definitions
  return gameState.value.buildingDefinitions?.[selectedId.value] || null
})

const buildingDescription = computed(() => {
  return t('village_info_building_' + selectedId.value + '_desc')
})

const currentEffects = computed(() => {
  if (!selectedBuilding.value) return ''
  return t('buildings_effect_' + selectedId.value, { level: selectedBuilding.value.lvl })
})

const nextEffects = computed(() => {
  if (!selectedBuilding.value || !buildingData.value) return null
  const next = selectedBuilding.value.lvl + 1
  return t('buildings_effect_' + selectedId.value, { level: next })
})

const upgradeCost = computed(() => {
  if (!buildingData.value) return null
  const nextLevel = (selectedBuilding.value?.lvl || 0) + 1
  return buildingData.value.levels?.[nextLevel]?.cost || null
})

const canUpgrade = computed(() => {
  if (!selectedBuilding.value || !upgradeCost.value) return false
  if (gold.value < (upgradeCost.value.gold || 0)) return false
  if (constructionQueue.value.length > 0) return false
  return true
})

function selectBuilding(id) {
  selectedId.value = id
}

function startUpgrade() {
  if (!selectedBuilding.value || !upgradeCost.value) return
  dispatch('buildings', 'startProject', {
    buildingId: selectedId.value,
    targetLevel: (selectedBuilding.value.lvl || 0) + 1,
    costGold: upgradeCost.value.gold || 0,
    costMaterials: upgradeCost.value.materials || {},
    duration: upgradeCost.value.duration || 1
  })
}
</script>

<style scoped>
.buildings-tab {
  padding: var(--spacing-lg);
}

.buildings-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: var(--spacing-lg);
}

.building-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  max-height: 70vh;
  overflow-y: auto;
}

.building-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.15s ease;
}

.building-card:hover, .building-card.active {
  border-color: var(--color-primary-light);
}

.building-card.locked {
  opacity: 0.5;
}

.building-icon {
  font-size: 1.5rem;
}

.building-info {
  display: flex;
  flex-direction: column;
}

.building-name {
  font-weight: 600;
  font-size: 0.9rem;
}

.building-level {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.detail-pane {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
}

.detail-pane h3 {
  margin: 0;
  font-size: 1.25rem;
}

.building-desc {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.current-effects, .next-effects, .upgrade-cost {
  padding: var(--spacing-sm);
  background: var(--bg-base);
  border-radius: var(--radius-md);
}

.current-effects h4, .next-effects h4, .upgrade-cost h4 {
  margin: 0 0 var(--spacing-xs);
  font-size: 0.85rem;
  color: var(--text-muted);
}

@media (max-width: 768px) {
  .buildings-layout {
    grid-template-columns: 1fr;
  }
}
</style>
