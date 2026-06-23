<template>
  <div class="village-canvas">
    <button
      v-for="tile in tiles"
      :key="tile.id"
      class="village-tile"
      :data-tutorial-target="'building_' + tile.id"
      :class="{ active: tile.active, locked: !tile.active }"
      @click="tile.active && $emit('navigate', tile.id)"
    >
      <span class="tile-icon">{{ tile.active ? tile.icon : '🔒' }}</span>
      <span class="tile-name">{{ tile.name }}</span>
      <span class="tile-level">
        {{ tile.active ? `${t('shared_uxelm_level')} ${tile.lvl}` : t('shared_uxelm_locked') }}
      </span>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'

const props = defineProps({
  infrastructure: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['navigate'])

const { t } = useI18n()

const tiles = computed(() => {
  const infra = props.infrastructure || {}
  return [
    { id: 'townhall', name: t('village_info_building_townhall'), icon: '🏛', lvl: 1, active: true },
    { id: 'housing', name: t('village_info_building_housing'), icon: '🏠', lvl: infra.housing || 0, active: (infra.housing || 0) > 0 },
    { id: 'farm', name: t('village_info_building_farm'), icon: '🌾', lvl: infra.farm || 0, active: (infra.farm || 0) > 0 },
    { id: 'warehouse', name: t('village_info_building_warehouse'), icon: '📦', lvl: infra.warehouse || 0, active: (infra.warehouse || 0) > 0 },
    { id: 'blacksmith', name: t('village_info_building_blacksmith'), icon: '⚒', lvl: infra.blacksmith || 0, active: (infra.blacksmith || 0) > 0 },
    { id: 'training_grounds', name: t('village_info_building_training_grounds'), icon: '💪', lvl: infra.training_grounds || 0, active: (infra.training_grounds || 0) > 0 },
    { id: 'explorer_guild', name: t('village_info_building_explorer_guild'), icon: '🧭', lvl: infra.explorer_guild || 0, active: (infra.explorer_guild || 0) > 0 },
    { id: 'witchs_hut', name: t('village_info_building_witchs_hut'), icon: '🔮', lvl: infra.witchs_hut || 0, active: (infra.witchs_hut || 0) > 0 },
    { id: 'arcane_sanctum', name: t('village_info_building_arcane_sanctum'), icon: '✨', lvl: infra.arcane_sanctum || 0, active: (infra.arcane_sanctum || 0) > 0 },
    { id: 'infirmary', name: t('village_info_building_infirmary'), icon: '🏥', lvl: infra.infirmary || 0, active: (infra.infirmary || 0) > 0 },
    { id: 'mission_board', name: t('village_info_building_mission_board'), icon: '📋', lvl: infra.mission_board || 0, active: (infra.mission_board || 0) > 0 },
    { id: 'tavern', name: t('village_info_building_tavern'), icon: '🍺', lvl: infra.tavern || 0, active: (infra.tavern || 0) > 0 }
  ]
})
</script>

<style scoped>
.village-canvas {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(4, 1fr);
  gap: var(--spacing-sm);
  height: 100%;
}

@media (max-width: 575px) {
  .village-canvas {
    grid-template-columns: repeat(2, 1fr);
  }
}

.village-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: var(--spacing-sm);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-family: var(--font-body);
  color: var(--text-primary);
  transition: all 0.15s ease;
}

.village-tile:hover:not(.locked) {
  border-color: var(--color-primary-light);
  background: rgba(74, 222, 128, 0.08);
}

.village-tile.locked {
  opacity: 0.5;
  cursor: not-allowed;
}

.tile-icon {
  font-size: 1.5rem;
}

.tile-name {
  font-size: 0.7rem;
  text-align: center;
  color: var(--text-secondary);
  text-transform: uppercase;
}

.tile-level {
  font-size: 0.65rem;
  font-weight: 600;
  color: white;
  padding: 2px 8px;
  background: var(--color-primary);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-sm);
}

.village-tile.locked .tile-level {
  background: var(--text-muted);
  border-color: var(--text-muted);
  color: var(--bg-card);
}
</style>
