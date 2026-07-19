<template>
  <div class="buildings-tab">
    <h2 class="page-title">{{ t('village_uxelm_buildings') }}</h2>
    <div class="buildings-layout">
      <!-- Building List -->
      <div class="building-list">
        <h3 class="list-header">{{ t('village_uxelm_building_available') }}</h3>
        <div
          v-for="building in visibleBuildings"
          :key="building.id"
          class="building-card"
          :data-tutorial-target="'building_' + building.id"
          :class="{ active: selectedId === building.id, locked: !building.active }"
          @click="selectBuilding(building.id)"
        >
          <div class="building-card-left">
            <span class="building-icon">{{ building.active ? building.icon : '🔒' }}</span>
            <span class="building-name">{{ building.name }}</span>
          </div>
          <span class="level-badge" :class="{ built: building.active }">
            {{ building.active ? t('shared_uxelm_level') + ' ' + building.lvl : t('village_uxelm_not_built') }}
          </span>
        </div>
      </div>

      <!-- Detail Pane -->
      <div v-if="selectedBuilding" class="detail-pane">
        <div class="detail-header">
          <div class="detail-header-left">
            <span class="detail-badge">{{ t('village_uxelm_infrastructure') }}</span>
            <h3>{{ selectedBuilding.name }}</h3>
          </div>
          <span class="detail-level">{{ t('village_uxelm_level_current') }} {{ selectedBuilding.lvl }}</span>
        </div>

        <div class="building-detail-grid">
          <div class="building-visual">
            <div class="building-icon-large">{{ buildingIconLarge }}</div>
          </div>
          <div class="building-info-column">
            <p class="building-desc">{{ buildingDescription }}</p>

            <div class="stats-comparison">
              <h4>{{ t('village_uxelm_building_effect') }}</h4>
              <div class="stat-comparison-row">
                <span class="stat-label">{{ effectLabel }}</span>
                <span class="stat-values">
                  <span class="stat-current">{{ currentEffectValue }}</span>
                  <span class="stat-arrow"> ➡️ </span>
                  <span class="stat-next">{{ nextEffectValue }}</span>
                </span>
              </div>
            </div>

            <div v-if="upgradeCost && !activeProject" class="upgrade-section">
              <h4>{{ t('village_uxelm_upgrade_next').replace('{level}', (selectedBuilding.lvl || 0) + 1) }}</h4>
              <div class="cost-grid">
                <div class="cost-item" :class="{ insufficient: !hasGold }">
                  <span class="cost-label">{{ t('village_info_gold') }}</span>
                  <span class="cost-value">💰 {{ upgradeCost.gold }}</span>
                </div>
                <div
                  v-for="[matId, amount] in costMaterials"
                  :key="matId"
                  class="cost-item"
                  :class="{ insufficient: !hasMaterial(matId, amount) }"
                >
                  <span class="cost-label">{{ t(matId) }}</span>
                  <span class="cost-value">{{ materialIcon(matId) }} {{ amount }}</span>
                </div>
                <div class="cost-item">
                  <span class="cost-label">{{ t('shared_uxelm_time') }}</span>
                  <span class="cost-value">⏳ {{ upgradeCost.duration }} {{ t('shared_uxelm_days') }}</span>
                </div>
              </div>
            </div>

            <div v-if="activeProject" class="action-footer">
              <Button variant="secondary" disabled>
                ⏳ {{ t('village_uxelm_construction_active') }} ({{ activeProject.daysRemaining }}d)
              </Button>
            </div>
            <div v-else class="action-footer">
              <Button
                variant="primary"
                class="confirm-btn"
                :disabled="!canUpgrade"
                @click="startUpgrade"
              >
                <span class="btn-icon">⚒️</span>
                {{ selectedBuilding.lvl > 0 ? t('buildings_uxelm_upgrade') : t('buildings_uxelm_build') }}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <EmptyState v-else icon="🏘" :title="t('buildings_uxelm_select')" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import { useGameState } from '@/core/composables/useGameState.js'
import { useAdapter } from '@/core/composables/useAdapter.js'
import { getBuildingCost } from '@/core/data'
import Button from '@/components/Button.vue'
import EmptyState from '@/components/EmptyState.vue'

const props = defineProps({
  initialBuildingId: { type: String, default: null }
})

const { t } = useI18n()
const { gameState } = useGameState()
const { dispatch } = useAdapter()

const selectedId = ref(null)

const village = computed(() => gameState.value.village || {})
const infrastructure = computed(() => village.value.infrastructure || {})
const constructionQueue = computed(() => village.value.constructionQueue || [])
const gold = computed(() => village.value.gold || 0)
const inventory = computed(() => gameState.value.inventory || {})

const buildingDefs = [
  { id: 'housing', name: t('village_info_building_housing'), icon: '🏠' },
  { id: 'farm', name: t('village_info_building_farm'), icon: '🌾' },
  { id: 'warehouse', name: t('village_info_building_warehouse'), icon: '📦' },
  { id: 'blacksmith', name: t('village_info_building_blacksmith'), icon: '⚒' },
  { id: 'training_grounds', name: t('village_info_building_training_grounds'), icon: '💪' },
  { id: 'explorer_guild', name: t('village_info_building_explorer_guild'), icon: '🧭' },
  { id: 'witchs_hut', name: t('village_info_building_witchs_hut'), icon: '🔮' },
  { id: 'arcane_sanctum', name: t('village_info_building_arcane_sanctum'), icon: '✨' },
  { id: 'infirmary', name: t('village_info_building_infirmary'), icon: '🏥' },
  { id: 'mission_board', name: t('village_info_building_mission_board'), icon: '📋' },
  { id: 'tavern', name: t('village_info_building_tavern'), icon: '🍺' }
]

const buildings = computed(() => {
  return buildingDefs.map((b) => ({
    ...b,
    lvl: infrastructure.value[b.id] || 0,
    active: (infrastructure.value[b.id] || 0) > 0
  }))
})

// Auto-select first building (Town Hall / housing) on mount — MOVED AFTER `buildings` declaration
watch(() => buildings.value, (buildingsList) => {
  if (!selectedId.value && buildingsList.length > 0) {
    // Prefer the first built building, or fallback to first in list
    const firstBuilt = buildingsList.find(b => b.active)
    selectedId.value = firstBuilt ? firstBuilt.id : buildingsList[0].id
  }
}, { immediate: true })

const visibleBuildings = computed(() => {
  const tavernLevel = infrastructure.value.tavern || 0
  return buildings.value.filter(b => {
    if (b.id === 'mission_board') return tavernLevel >= 1
    return true
  })
})

// Select a building requested by an external navigation (e.g. locked village tile)
watch(() => props.initialBuildingId, (id) => {
  if (id && visibleBuildings.value.some(b => b.id === id)) {
    selectedId.value = id
  }
}, { immediate: true })

const selectedBuilding = computed(() =>
  buildings.value.find((b) => b.id === selectedId.value)
)

// Costs come from engine data (js/engine/village/data/BuildingsData.js, the
// authoritative source the engine itself charges) via the ux/core/data facade.
function getUpgradeCost(buildingId, nextLevel) {
  return getBuildingCost(buildingId, nextLevel)
}

const MATERIAL_ICONS = { material_wood: '🪵', material_stone: '🪨' }
function materialIcon(matId) {
  return MATERIAL_ICONS[matId] || '⛓️'
}

const costMaterials = computed(() => Object.entries(upgradeCost.value?.materials || {}))

const buildingDescription = computed(() => {
  return t('village_info_building_' + selectedId.value + '_desc')
})

function getBuildingEffectParts(id, level) {
  // Returns { label, value } for the effect at given level
  if (id === 'farm') {
    return { label: t('village_info_building_farm_effect_grain'), value: `+${4 * level}` }
  }
  if (id === 'housing') {
    const calcPop = (lvl) => {
      if (lvl <= 0) return 0
      if (lvl === 1) return 3
      if (lvl === 2) return 10
      return 20 + (lvl - 3) * 10
    }
    return { label: t('village_info_building_housing_effect_population'), value: `${calcPop(level)}` }
  }
  if (id === 'warehouse') {
    const calcStorage = (lvl) => {
      if (lvl <= 0) return 100
      if (lvl === 1) return 200
      if (lvl === 2) return 500
      return 500 + (lvl - 2) * 500
    }
    return { label: t('village_info_building_warehouse_effect_storage'), value: `${calcStorage(level)} 🪵/🪨` }
  }
  if (id === 'blacksmith') {
    return { label: t('village_info_building_blacksmith_effect_forge'), value: level >= 1 ? t('village_info_building_blacksmith_effect_iron_gear') : t('shared_uxelm_locked') }
  }
  if (id === 'infirmary') {
    return { label: t('village_info_building_infirmary_effect_healing'), value: `+${level * 10}%` }
  }
  if (id === 'tavern') {
    return { label: t('village_info_building_tavern_effect_recruitment'), value: level >= 1 ? t('shared_uxelm_unlocked') : t('shared_uxelm_locked') }
  }
  if (id === 'witchs_hut') {
    return { label: t('village_info_building_witchs_hut_effect_magic_readings'), value: level >= 1 ? t('shared_uxelm_unlocked') : t('shared_uxelm_locked') }
  }
  if (id === 'arcane_sanctum') {
    return { label: t('village_info_building_arcane_sanctum_effect_academy'), value: level >= 1 ? `${t('village_info_building_arcane_sanctum_effect_slots')}: ${level}` : t('shared_uxelm_locked') }
  }
  if (id === 'explorer_guild') {
    return { label: t('village_info_building_explorer_guild_effect_expeditions'), value: level >= 1 ? t('shared_uxelm_unlocked') : t('shared_uxelm_locked') }
  }
  if (id === 'training_grounds') {
    return { label: t('village_info_building_training_grounds_effect_passive_experience'), value: level >= 1 ? `+${level * 5}%` : t('shared_uxelm_locked') }
  }
  if (id === 'mission_board') {
    return { label: t('village_info_building_mission_board_effect_mission_slots'), value: level >= 1 ? `${level}` : t('shared_uxelm_locked') }
  }
  return { label: '', value: '' }
}

function getBuildingEffectText(id, level) {
  const parts = getBuildingEffectParts(id, level)
  return parts.label ? `${parts.label}: ${parts.value}` : ''
}

const nextEffectValue = computed(() => {
  if (!selectedBuilding.value) return ''
  const next = selectedBuilding.value.lvl + 1
  return getBuildingEffectParts(selectedId.value, next).value
})

const buildingIconLarge = computed(() => {
  if (!selectedBuilding.value) return '🏗️'
  return selectedBuilding.value.active ? selectedBuilding.value.icon : '🔒'
})

const effectLabel = computed(() => {
  if (!selectedBuilding.value) return ''
  return getBuildingEffectParts(selectedId.value, selectedBuilding.value.lvl).label
})

const currentEffectValue = computed(() => {
  if (!selectedBuilding.value) return ''
  return getBuildingEffectParts(selectedId.value, selectedBuilding.value.lvl).value
})

const hasGold = computed(() => {
  if (!upgradeCost.value) return true
  return gold.value >= (upgradeCost.value.gold || 0)
})

function materialCount(matId) {
  const materials = inventory.value.materials || {}
  const count = materials[matId]
  return typeof count === 'number' ? count : 0
}

function hasMaterial(matId, amount) {
  return materialCount(matId) >= amount
}

const activeProject = computed(() => {
  if (!selectedBuilding.value || !constructionQueue.value.length) return null
  return constructionQueue.value.find(p => p.buildingId === selectedId.value) || null
})

const upgradeCost = computed(() => {
  if (!selectedBuilding.value) return null
  const nextLevel = (selectedBuilding.value.lvl || 0) + 1
  return getUpgradeCost(selectedId.value, nextLevel)
})

const canUpgrade = computed(() => {
  if (!selectedBuilding.value || !upgradeCost.value) return false
  if (gold.value < (upgradeCost.value.gold || 0)) return false
  if (constructionQueue.value.length > 0) return false
  // Check materials — v1 stores materials as object { material_wood: count }
  for (const [matId, amount] of Object.entries(upgradeCost.value.materials || {})) {
    if (!hasMaterial(matId, amount)) return false
  }
  return true
})

function selectBuilding(id) {
  selectedId.value = id
}

function startUpgrade() {
  if (!selectedBuilding.value || !upgradeCost.value) return
  // Engine derives costs authoritatively from BuildingsData
  dispatch('buildings', 'startProject', {
    buildingId: selectedId.value,
    targetLevel: (selectedBuilding.value.lvl || 0) + 1
  })
}
</script>

<style scoped>
.buildings-tab {
  padding: var(--spacing-lg);
}

.page-title {
  margin: 0 0 var(--spacing-lg);
  font-size: 1.5rem;
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

.list-header {
  margin: 0 0 var(--spacing-xs);
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-primary-light);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.building-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.15s ease;
}

.building-card:hover {
  border-color: var(--color-primary-light);
  background: rgba(74, 222, 128, 0.06);
}

.building-card.active {
  border-color: var(--color-primary-light);
  background: rgba(74, 222, 128, 0.12);
  box-shadow: 0 0 0 1px var(--color-primary-light);
}

.building-card.active.locked {
  border-color: var(--glass-border);
  background: rgba(255, 255, 255, 0.04);
  box-shadow: none;
  opacity: 0.5;
  cursor: not-allowed;
}

.building-card.locked {
  opacity: 0.5;
}

.building-card-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.building-icon {
  font-size: 1.1rem;
  width: 1.5rem;
  text-align: center;
}

.building-name {
  font-weight: 600;
  font-size: 0.9rem;
}

.level-badge {
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-muted);
  white-space: nowrap;
}

.level-badge.built {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
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

.detail-badge {
  display: inline-block;
  background: var(--color-primary);
  color: white;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-sm);
}

.detail-header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.detail-pane h3 {
  margin: 0;
  font-size: 1.25rem;
}

.detail-level {
  font-size: 0.9rem;
  color: var(--text-secondary);
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

.building-detail-grid {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: var(--spacing-lg);
  align-items: start;
}

.building-visual {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  background: var(--bg-base);
  border-radius: var(--radius-lg);
  border: 1px solid var(--glass-border);
}

.building-icon-large {
  font-size: 3rem;
}

.building-info-column {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.stats-comparison {
  padding: var(--spacing-sm);
  background: var(--bg-base);
  border-radius: var(--radius-md);
}

.stats-comparison h4 {
  margin: 0 0 var(--spacing-xs);
  font-size: 0.85rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-comparison-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
}

.stat-label {
  font-weight: 500;
}

.stat-values {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.stat-current {
  color: var(--text-secondary);
}

.stat-arrow {
  color: var(--color-primary-light);
}

.stat-next {
  color: var(--color-primary);
  font-weight: 600;
}

.upgrade-section h4 {
  margin: 0 0 var(--spacing-xs);
  font-size: 0.85rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.cost-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-xs);
}

.cost-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  transition: all 0.15s ease;
}

.cost-item:hover {
  border-color: var(--glass-border);
  background: rgba(255, 255, 255, 0.04);
}

.cost-item.insufficient {
  border-color: rgba(239, 68, 68, 0.6);
  background: rgba(239, 68, 68, 0.12);
  color: var(--color-danger);
}

.cost-item.insufficient .cost-value {
  color: var(--color-danger);
}

.cost-label {
  color: var(--text-muted);
}

.cost-value {
  font-weight: 600;
}

.action-footer {
  margin-top: var(--spacing-sm);
  display: flex;
  justify-content: flex-end;
}

.confirm-btn {
  width: auto;
  min-width: 120px;
}

.btn-icon {
  margin-right: var(--spacing-xs);
}

@media (max-width: 768px) {
  .buildings-layout {
    grid-template-columns: 1fr;
  }
}
</style>
