<template>
  <div class="village-page">
    <!-- Storage bar -->
    <div class="storage-bar">
      <div class="storage-track">
        <div
          class="storage-fill"
          :class="{ warning: storagePercent > 75, danger: storagePercent > 90 }"
          :style="{ width: `${storagePercent}%` }"
        />
      </div>
      <span class="storage-text">{{ inventoryUsed }} / {{ maxStorage }} {{ t('shared_uxelm_storage') }}</span>
    </div>

    <!-- Top Row: Canvas + Calendar + Defense -->
    <div class="dashboard-row">
      <div class="dashboard-card">
        <div class="card-header">
          <h3>
            {{ t('village_info_building_townhall') }}
            <span class="level-badge">Lv.{{ townhallLevel }}</span>
          </h3>
        </div>
        <VillageCanvas
          :infrastructure="infrastructure"
          @navigate="navigateToBuildings"
        />
      </div>

      <div class="dashboard-card">
        <VillageCalendar :calendar="calendar" />
      </div>

      <div class="dashboard-card">
        <VillageDefense
          :assigned="defenseAssigned"
          :heroes="heroes"
          @assign="assignDefense"
          @unassign="unassignDefense"
        />
      </div>
    </div>

    <!-- Middle Row: Labor Pool + Construction Queue -->
    <div class="dashboard-row">
      <div class="dashboard-card">
        <LaborPool
          :population="population"
          @change-role="changeWorkerRole"
        />
      </div>

      <div class="dashboard-card">
        <ConstructionQueue
          :queue="constructionQueue"
          @navigate="navigateToBuildings"
        />
      </div>
    </div>

    <!-- Bottom Row: Daily Objectives -->
    <div class="dashboard-row">
      <div class="dashboard-card full-width">
        <DailyObjectives :daily-objectives="dailyObjectives" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import { useGameState } from '@/core/composables/useGameState.js'
import { useAdapter } from '@/core/composables/useAdapter.js'
import VillageCanvas from './components/VillageCanvas.vue'
import LaborPool from './components/LaborPool.vue'
import ConstructionQueue from './components/ConstructionQueue.vue'
import DailyObjectives from './components/DailyObjectives.vue'
import VillageCalendar from './components/VillageCalendar.vue'
import VillageDefense from './components/VillageDefense.vue'

const { t } = useI18n()
const { gameState, heroes } = useGameState()
const { dispatch } = useAdapter()

const village = computed(() => gameState.value.village || {})
const infrastructure = computed(() => village.value.infrastructure || {})
const population = computed(() => village.value.population || {})
const constructionQueue = computed(() => village.value.constructionQueue || [])
const dailyObjectives = computed(() => gameState.value.dailyObjectives || null)
const calendar = computed(() => gameState.value.calendar || null)
const inventory = computed(() => gameState.value.inventory || {})

const townhallLevel = computed(() => infrastructure.value.townhall || 1)
const inventoryUsed = computed(() => inventory.value.totalUsed || 0)
const maxStorage = computed(() => village.value.maxStorage || 100)
const storagePercent = computed(() => Math.min(100, (inventoryUsed.value / maxStorage.value) * 100))

const defenseAssigned = computed(() => calendar.value?.defenseAssigned || [])

function changeWorkerRole({ role, delta }) {
  dispatch('village', 'setWorkerRole', { role, delta })
}

function assignDefense(heroId) {
  dispatch('village', 'assignDefense', { heroId })
}

function unassignDefense(heroId) {
  dispatch('village', 'unassignDefense', { heroId })
}

function navigateToBuildings(buildingId) {
  // Emit to parent App.vue to switch to town/buildings tab
  // For now, just log — full navigation requires App.vue cooperation
  console.log('Navigate to building:', buildingId)
}
</script>

<style scoped>
.village-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
  color: var(--text-primary);
}

.storage-bar {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
}

.storage-track {
  flex: 1;
  height: 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  overflow: hidden;
}

.storage-fill {
  height: 100%;
  background: #22c55e;
  border-radius: 4px;
  transition: width 0.3s ease, background 0.3s ease;
}

.storage-fill.warning {
  background: #f59e0b;
}

.storage-fill.danger {
  background: #ef4444;
}

.storage-text {
  font-size: 0.8rem;
  color: var(--text-muted);
  white-space: nowrap;
}

.dashboard-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-lg);
}

.dashboard-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
}

.dashboard-card.full-width {
  grid-column: 1 / -1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 1rem;
  color: var(--text-primary);
}

.level-badge {
  font-size: 0.8rem;
  color: var(--text-muted);
  font-weight: 400;
}

@media (max-width: 768px) {
  .dashboard-row {
    grid-template-columns: 1fr;
  }
}
</style>
