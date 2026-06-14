<template>
  <div class="village-page">
    <!-- Header bar matching v1 -->
    <div class="village-header-bar">
      <h2 class="village-title">{{ t('shared_uxelm_nav_village') }}</h2>
      <div class="header-badges">
        <span class="badge townhall-badge">
          🏛️ {{ t('village_info_building_townhall') }} Lv{{ townhallLevel }}
        </span>
        <div class="storage-badge">
          <span class="storage-label">📦 {{ inventoryUsed }} / {{ maxStorage }}</span>
          <div class="storage-track">
            <div
              class="storage-fill"
              :class="{ warning: storagePercent > 75, danger: storagePercent > 90 }"
              :style="{ width: `${storagePercent}%` }"
            />
          </div>
        </div>
      </div>
      <button
        v-if="hasDailyReport"
        class="btn-recall-report"
        @click="$emit('recallDailyReport')"
      >
        📜 {{ t('village_uxelm_report_view') }}
      </button>
    </div>

    <!-- v1 3-column grid layout -->
    <div class="village-dashboard">
      <!-- Left Column: Village Canvas (full height) -->
      <div class="dashboard-col col-canvas">
        <div class="dashboard-card card-full">
          <VillageCanvas
            :infrastructure="infrastructure"
            @navigate="navigateToBuildings"
          />
        </div>
      </div>

      <!-- Middle Column: Labor Pool + Construction Queue -->
      <div class="dashboard-col col-middle">
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

      <!-- Right Column: Calendar+Defense Hub + Daily Objectives -->
      <div class="dashboard-col col-right">
        <div class="dashboard-card card-hub">
          <h3 class="hub-title">{{ t('village_uxelm_threat_defense_hub') }}</h3>
          <p class="hub-hint">{{ t('village_uxelm_threat_defense_hint') }}</p>
          <div class="hub-body">
            <VillageCalendar :calendar="calendar" />
            <div class="hub-divider" />
            <VillageDefense
              :assigned="defenseAssigned"
              :heroes="heroes"
              :show-header="false"
              @assign="assignDefense"
              @unassign="unassignDefense"
            />
          </div>
        </div>

        <div class="dashboard-card">
          <DailyObjectives :daily-objectives="dailyObjectives" />
        </div>
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

const emit = defineEmits(['navigate', 'recallDailyReport'])

const village = computed(() => gameState.value.village || {})
const infrastructure = computed(() => village.value.infrastructure || {})
const population = computed(() => village.value.population || {})
const constructionQueue = computed(() => village.value.constructionQueue || [])
const dailyObjectives = computed(() => gameState.value.dailyObjectives || null)
const dailyReport = computed(() => gameState.value.village?.lastDailyReport || null)
const hasDailyReport = computed(() => !!dailyReport.value && !!dailyReport.value.day)
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
  emit('navigate', { page: 'town', tab: 'buildings' })
}
</script>

<style scoped>
.village-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  padding: var(--spacing-md);
  gap: var(--spacing-md);
  color: var(--text-primary);
}

.village-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  gap: var(--spacing-md);
  flex-shrink: 0;
}

.village-title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 1.1rem;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 1px;
  white-space: nowrap;
}

.header-badges {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex: 1;
  justify-content: center;
}

.badge {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
}

.storage-badge {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.storage-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-secondary);
  white-space: nowrap;
}

.storage-track {
  width: 120px;
  height: 6px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 3px;
  overflow: hidden;
}

.storage-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-primary-light));
  border-radius: 3px;
  transition: width 0.3s ease, background 0.3s ease;
}

.storage-fill.warning {
  background: linear-gradient(90deg, var(--color-warning), #fbbf24);
}

.storage-fill.danger {
  background: linear-gradient(90deg, var(--color-danger), #ef4444);
  animation: pulseDanger 1.5s ease-in-out infinite;
}

@keyframes pulseDanger {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.btn-recall-report {
  padding: var(--spacing-xs) var(--spacing-sm);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  font-family: var(--font-body);
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
  transition: all 0.15s ease;
}

.btn-recall-report:hover {
  background: rgba(255, 255, 255, 0.14);
  color: var(--text-primary);
  border-color: var(--color-primary-light);
}

/* ── v1 3-Column Grid Layout ── */
.village-dashboard {
  display: grid;
  grid-template-columns: 4.5fr 3.25fr 3.25fr;
  gap: var(--spacing-md);
  min-height: 0;
}

.dashboard-col {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  min-height: 0;
  overflow: hidden;
}



.dashboard-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  min-height: 0;
  overflow: hidden;
}

.col-canvas .dashboard-card {
  flex: 1;
  min-height: 0;
}

.card-hub {
  gap: 0;
  padding: 0;
}

.hub-title {
  margin: 0;
  padding: var(--spacing-md) var(--spacing-md) var(--spacing-xs);
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-primary-light);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.hub-hint {
  margin: 0;
  padding: 0 var(--spacing-md) var(--spacing-xs);
  font-size: 0.75rem;
  color: var(--text-muted);
  font-style: italic;
  line-height: 1.4;
  overflow-wrap: break-word;
  word-break: normal;
}

.hub-body {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: var(--spacing-xs) var(--spacing-md) var(--spacing-md);
}

.hub-body > * {
  padding: var(--spacing-xs) 0;
}

.hub-body > .village-defense {
  padding-top: var(--spacing-sm);
}

.hub-divider {
  height: 1px;
  background: var(--glass-border);
  margin: 0;
  opacity: 0.6;
}

/* Scrollable content within cards when needed */
.dashboard-card > :deep(.village-canvas) {
  flex: 1;
  overflow-y: auto;
}

.dashboard-card > :deep(.labor-pool),
.dashboard-card > :deep(.construction-queue),
.dashboard-card > :deep(.daily-objectives) {
  overflow-y: auto;
}

@media (max-width: 1024px) {
  .village-dashboard {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto;
    overflow-y: auto;
  }

  .col-canvas {
    grid-column: 1 / -1;
  }

  .col-canvas .card-full {
    max-height: 320px;
  }
}

@media (max-width: 768px) {
  .village-dashboard {
    grid-template-columns: 1fr;
    overflow-y: auto;
  }

  .col-canvas {
    grid-column: auto;
  }
}
</style>
