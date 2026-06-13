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
          :class="{ active: selectedId === building.id, locked: !building.active }"
          @click="selectBuilding(building.id)"
        >
          <span class="building-name">{{ building.name }}</span>
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
                <div v-if="upgradeCost.wood > 0" class="cost-item" :class="{ insufficient: !hasWood }">
                  <span class="cost-label">{{ t('inventory_info_mat_wood') }}</span>
                  <span class="cost-value">🪵 {{ upgradeCost.wood }}</span>
                </div>
                <div v-if="upgradeCost.stone > 0" class="cost-item" :class="{ insufficient: !hasStone }">
                  <span class="cost-label">{{ t('inventory_info_mat_stone') }}</span>
                  <span class="cost-value">🪨 {{ upgradeCost.stone }}</span>
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
                {{ t('shared_uxelm_confirm') }}
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

const visibleBuildings = computed(() => buildings.value)

const selectedBuilding = computed(() =>
  buildings.value.find((b) => b.id === selectedId.value)
)

function getUpgradeCost(buildingId, nextLevel) {
  const costs = {
    farm: { 1: { gold: 30, wood: 10, stone: 0, duration: 1 }, 2: { gold: 80, wood: 30, stone: 10, duration: 3 } },
    housing: { 2: { gold: 150, wood: 40, stone: 10, duration: 4 }, 3: { gold: 300, wood: 90, stone: 45, duration: 6 } },
    warehouse: { 2: { gold: 120, wood: 50, stone: 30, duration: 4 } },
    blacksmith: { 1: { gold: 150, wood: 50, stone: 30, duration: 3 } },
    infirmary: { 1: { gold: 150, wood: 100, stone: 0, duration: 3 }, 2: { gold: 400, wood: 200, stone: 100, duration: 5 }, 3: { gold: 800, wood: 300, stone: 200, duration: 7 } },
    tavern: { 1: { gold: 200, wood: 100, stone: 50, duration: 3 } },
    witchs_hut: { 1: { gold: 200, wood: 80, stone: 30, duration: 2 } },
    arcane_sanctum: { 1: { gold: 500, wood: 100, stone: 50, duration: 3 }, 2: { gold: 1500, wood: 200, stone: 100, duration: 5 }, 3: { gold: 3000, wood: 400, stone: 200, duration: 7 }, 4: { gold: 6000, wood: 800, stone: 400, duration: 10 } },
    explorer_guild: { 1: { gold: 300, wood: 200, stone: 100, duration: 4 }, 2: { gold: 800, wood: 400, stone: 200, duration: 7 } },
    // NOTE: Costs sourced from docs/village/buildings_data.md. Keep in sync.
    // Iron costs are not yet modeled in the UI cost structure.
    training_grounds: { 1: { gold: 300, wood: 0, stone: 150, duration: 5 } }
  }
  return costs[buildingId]?.[nextLevel] || { gold: nextLevel * 100, wood: nextLevel * 50, stone: nextLevel * 25, duration: nextLevel * 2 }
}

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
  return { label: '', value: '' }
}

function getBuildingEffectText(id, level) {
  const parts = getBuildingEffectParts(id, level)
  return parts.label ? `${parts.label}: ${parts.value}` : ''
}

const currentEffects = computed(() => {
  if (!selectedBuilding.value) return ''
  return getBuildingEffectText(selectedId.value, selectedBuilding.value.lvl)
})

const nextEffects = computed(() => {
  if (!selectedBuilding.value) return null
  const next = selectedBuilding.value.lvl + 1
  const effect = getBuildingEffectText(selectedId.value, next)
  return effect || null
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

const nextEffectValue = computed(() => {
  if (!selectedBuilding.value) return ''
  const next = selectedBuilding.value.lvl + 1
  return getBuildingEffectParts(selectedId.value, next).value
})

const hasGold = computed(() => {
  if (!upgradeCost.value) return true
  return gold.value >= (upgradeCost.value.gold || 0)
})

const hasWood = computed(() => {
  if (!upgradeCost.value || !(upgradeCost.value.wood > 0)) return true
  const materials = inventory.value.materials || {}
  const woodCount = typeof materials.material_wood === 'number' ? materials.material_wood : 0
  return woodCount >= upgradeCost.value.wood
})

const hasStone = computed(() => {
  if (!upgradeCost.value || !(upgradeCost.value.stone > 0)) return true
  const materials = inventory.value.materials || {}
  const stoneCount = typeof materials.material_stone === 'number' ? materials.material_stone : 0
  return stoneCount >= upgradeCost.value.stone
})

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
  const materials = inventory.value.materials || {}
  const woodCount = typeof materials.material_wood === 'number' ? materials.material_wood : 0
  const stoneCount = typeof materials.material_stone === 'number' ? materials.material_stone : 0
  if ((upgradeCost.value.wood || 0) > 0 && woodCount < upgradeCost.value.wood) return false
  if ((upgradeCost.value.stone || 0) > 0 && stoneCount < upgradeCost.value.stone) return false
  return true
})

function selectBuilding(id) {
  selectedId.value = id
}

function startUpgrade() {
  if (!selectedBuilding.value || !upgradeCost.value) return
  const cost = upgradeCost.value
  dispatch('buildings', 'startProject', {
    buildingId: selectedId.value,
    targetLevel: (selectedBuilding.value.lvl || 0) + 1,
    costGold: cost.gold || 0,
    costMaterials: {
      ...(cost.wood ? { material_wood: cost.wood } : {}),
      ...(cost.stone ? { material_stone: cost.stone } : {})
    },
    duration: cost.duration || 1
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

.building-card:hover, .building-card.active {
  border-color: var(--color-primary-light);
}

.building-card.locked {
  opacity: 0.5;
}

.building-name {
  font-weight: 600;
  font-size: 0.9rem;
}

.level-badge {
  padding: 2px 8px;
  background: var(--color-primary);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-sm);
  font-size: 0.7rem;
  font-weight: 600;
  color: white;
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
}

.cost-item.insufficient {
  border-color: rgba(239, 68, 68, 0.5);
  background: rgba(239, 68, 68, 0.08);
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
