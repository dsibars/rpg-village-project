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
          <span class="building-icon">{{ building.active ? building.icon : '🔒' }}</span>
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
          <p>💰 {{ upgradeCost.gold }}g</p>
          <p v-if="upgradeCost.wood">🪵 {{ upgradeCost.wood }} Wood</p>
          <p v-if="upgradeCost.stone">🪨 {{ upgradeCost.stone }} Stone</p>
          <p>⏳ {{ upgradeCost.duration }} {{ t('shared_uxelm_days') }}</p>
        </div>

        <Button
          variant="primary"
          :disabled="!canUpgrade"
          @click="startUpgrade"
        >
          {{ selectedBuilding.lvl === 0 ? t('buildings_uxelm_build') : t('buildings_uxelm_upgrade') }}
        </Button>
      </div>

      <EmptyState v-else icon="🏘" :title="t('buildings_uxelm_select')" />
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
const inventory = computed(() => gameState.value.inventory || {})

const buildings = computed(() => {
  const defs = [
    { id: 'townhall', name: t('village_info_building_townhall'), icon: '🏛' },
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
  return defs.map((b) => ({
    ...b,
    lvl: infrastructure.value[b.id] || 0,
    active: (infrastructure.value[b.id] || 0) > 0
  }))
})

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

function getBuildingEffectText(id, level) {
  // Match v1 BuildingDetailPane.js logic
  if (id === 'farm') {
    return `${t('village_info_building_farm_effect_grain')}: +${4 * level}`
  }
  if (id === 'housing') {
    const calcPop = (lvl) => {
      if (lvl <= 0) return 0
      if (lvl === 1) return 3
      if (lvl === 2) return 10
      return 20 + (lvl - 3) * 10
    }
    return `${t('village_info_building_housing_effect_population')}: ${calcPop(level)}`
  }
  if (id === 'warehouse') {
    const calcStorage = (lvl) => {
      if (lvl <= 0) return 100
      if (lvl === 1) return 200
      if (lvl === 2) return 500
      return 500 + (lvl - 2) * 500
    }
    return `${t('village_info_building_warehouse_effect_storage')}: ${calcStorage(level)} 🪵/🪨`
  }
  if (id === 'blacksmith') {
    return `${t('village_info_building_blacksmith_effect_forge')}: ${level >= 1 ? t('village_info_building_blacksmith_effect_iron_gear') : t('shared_uxelm_locked')}`
  }
  if (id === 'infirmary') {
    return `${t('village_info_building_infirmary_effect_healing')}: +${level * 10}%`
  }
  if (id === 'tavern') {
    return `${t('village_info_building_tavern_effect_recruitment')}: ${level >= 1 ? t('shared_uxelm_unlocked') : t('shared_uxelm_locked')}`
  }
  if (id === 'witchs_hut') {
    return `${t('village_info_building_witchs_hut_effect_magic_readings')}: ${level >= 1 ? t('shared_uxelm_unlocked') : t('shared_uxelm_locked')}`
  }
  if (id === 'arcane_sanctum') {
    return `${t('village_info_building_arcane_sanctum_effect_academy')}: ${level >= 1 ? `${t('village_info_building_arcane_sanctum_effect_slots')}: ${level}` : t('shared_uxelm_locked')}`
  }
  if (id === 'explorer_guild') {
    return `${t('village_info_building_explorer_guild_effect_expeditions')}: ${level >= 1 ? t('shared_uxelm_unlocked') : t('shared_uxelm_locked')}`
  }
  if (id === 'training_grounds') {
    return `${t('village_info_building_training_grounds_effect_passive_experience')}: ${level >= 1 ? `+${level * 5}%` : t('shared_uxelm_locked')}`
  }
  return ''
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
