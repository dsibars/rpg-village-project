<template>
  <div class="chronicle-tab">
    <h2 class="page-title">{{ t('chronicle_page_title') }}</h2>

    <!-- Recently Unlocked (Horizontal scroll cards) -->
    <div v-if="recentUnlocks.length > 0" class="recent-section">
      <h3>{{ t('chronicle_recently_unlocked') }}</h3>
      <div class="recent-list">
        <div
          v-for="item in recentUnlocks"
          :key="item.id"
          class="recent-milestone-card"
        >
          <div class="recent-info">
            <span class="recent-title">{{ item.title }}</span>
            <span class="recent-day">{{ t('chronicle_day_prefix') }} {{ item.dayUnlocked }}</span>
          </div>
          <button class="btn-replay-icon" :title="t('chronicle_open_in_book')" @click="openInBook(item.bookLink)">
            <span>📖</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Two-pane layout -->
    <div class="chronicle-two-pane">
      <!-- Main/Left Pane: Chronicle Catalog -->
      <div class="chronicle-main-pane">
        <div class="catalog-header">
          <h3>{{ t('chronicle_catalog_title') }}</h3>
          <span class="catalog-count">{{ unlockedEntries.length }} / {{ totalEntries }}</span>
        </div>

        <div v-if="unlockedEntries.length === 0" class="catalog-empty">
          {{ t('chronicle_catalog_empty') }}
        </div>

        <div class="catalog-list">
          <div
            v-for="entry in unlockedEntries"
            :key="entry.id"
            class="catalog-row"
            @click="openInBook(entry.bookLink)"
          >
            <div class="catalog-main-info">
              <div class="catalog-header-line">
                <span class="catalog-title">{{ entry.label }}</span>
                <span class="catalog-badge badge-unlocked">{{ t('chronicle_unlocked') }}</span>
              </div>
              <div class="catalog-meta">
                <span class="catalog-day">{{ t('chronicle_day_prefix') }} {{ entry.dayUnlocked }}</span>
                <span v-if="entry.bookLink" class="catalog-book-ref">
                  {{ t('chronicle_chapter') }} {{ entry.bookLink.chapterNumber }} · {{ t('chronicle_page') }} {{ entry.bookLink.pageNumber }}
                </span>
              </div>
            </div>
            <div class="catalog-actions">
              <button class="btn-book-icon" :title="t('chronicle_open_in_book')">
                <span>📖</span>
              </button>
            </div>
          </div>

          <!-- Locked entries (requirement hints) -->
          <div
            v-for="entry in lockedEntries"
            :key="entry.id"
            class="catalog-row catalog-locked"
          >
            <div class="catalog-main-info">
              <div class="catalog-header-line">
                <span class="catalog-title catalog-title-locked">{{ entry.label }}</span>
                <span class="catalog-badge badge-locked">{{ t('chronicle_hint_event') }}</span>
              </div>
              <div class="catalog-meta">
                <span class="catalog-req">{{ entry.requirement }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Pane: Discovery Log -->
      <div class="chronicle-discovery-pane">
        <div class="discovery-header">
          <h3>{{ t('chronicle_discovery_title') }}</h3>
          <span class="discovery-count">{{ discoveryLog.length }} / {{ totalNarratives }}</span>
        </div>
        <div class="discovery-list">
          <div
            v-for="entry in displayedDiscoveryLog"
            :key="entry.id"
            class="discovery-row"
            @click="openDiscoveryDetail(entry)"
          >
            <span class="discovery-title">{{ entry.title }}</span>
            <span v-if="entry.daySeen !== null" class="discovery-day">
              {{ t('chronicle_day_prefix') }} {{ entry.daySeen }}
            </span>
          </div>
          <div v-if="discoveryLog.length === 0" class="discovery-empty">
            {{ t('chronicle_discovery_empty') }}
          </div>
          <button
            v-if="hasMoreDiscovery"
            class="discovery-toggle-btn"
            @click="showAllDiscovery = !showAllDiscovery"
          >
            {{ showAllDiscovery ? t('chronicle_show_less') : t('chronicle_show_more', { count: discoveryLog.length - DISCOVERY_DISPLAY_LIMIT }) }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import { useGameState } from '@/core/composables/useGameState.js'
import { UNLOCK_NARRATIVES } from '@/core/data/index.js'
import { queueNarrative } from '@/core/toast.js'

const { t } = useI18n()
const { gameState } = useGameState()
const engine = inject('engine')
const emit = defineEmits(['navigate'])

const unlockService = computed(() => {
  gameState.value
  return engine?.unlockService
})

const chronicleService = computed(() => {
  gameState.value
  return engine?.chronicleService
})

// Parse auto-generated chronicle IDs into human-readable labels
function formatChronicleLabel(id) {
  if (!id) return id

  // building_{id}_{level}
  const buildingMatch = id.match(/^building_(.+)_(\d+)$/)
  if (buildingMatch) {
    const [, buildingId, level] = buildingMatch
    const buildingName = t('village_info_building_' + buildingId)
    return `${buildingName} ${t('village_info_building_level')} ${level}`
  }

  // expedition_{expId}
  const expMatch = id.match(/^expedition_(.+)$/)
  if (expMatch) {
    const expId = expMatch[1]
    const expName = t('expedition_name_' + expId)
    return expName !== 'expedition_name_' + expId ? expName : `Expedition: ${expId}`
  }

  // event_{eventId}
  const eventMatch = id.match(/^event_(.+)$/)
  if (eventMatch) {
    return `Event: ${eventMatch[1]}`
  }

  return id
}

function formatChronicleRequirement(id) {
  if (!id) return t('chronicle_hint_event')

  const buildingMatch = id.match(/^building_(.+)_(\d+)$/)
  if (buildingMatch) {
    const [, buildingId, level] = buildingMatch
    const buildingName = t('village_info_building_' + buildingId)
    return t('chronicle_hint_building', { building: buildingName, level })
  }

  const expMatch = id.match(/^expedition_(.+)$/)
  if (expMatch) {
    return t('chronicle_hint_mission', { mission: expMatch[1] })
  }

  const eventMatch = id.match(/^event_(.+)$/)
  if (eventMatch) {
    return t('chronicle_hint_event')
  }

  return t('chronicle_hint_event')
}

// ── Chronicle Catalog ──

const totalEntries = computed(() => {
  return chronicleService.value?.getEntries()?.length || 0
})

const unlockedEntries = computed(() => {
  const cs = chronicleService.value
  if (!cs) return []

  const entries = cs.getEntries({ status: 'unlocked' })
  return entries
    .sort((a, b) => (b.dayUnlocked || 0) - (a.dayUnlocked || 0))
    .map(entry => {
      const label = entry.labelKey ? t(entry.labelKey) : null
      const hasValidLabel = label && label !== entry.labelKey
      return {
        id: entry.id,
        label: hasValidLabel ? label : formatChronicleLabel(entry.id),
        dayUnlocked: entry.dayUnlocked,
        bookLink: entry.bookLink
      }
    })
})

const lockedEntries = computed(() => {
  const cs = chronicleService.value
  if (!cs) return []

  const entries = cs.getEntries({ status: 'locked' })
  return entries
    .map(entry => {
      const label = entry.labelKey ? t(entry.labelKey) : null
      const req = entry.requirementKey ? t(entry.requirementKey) : null
      const hasValidLabel = label && label !== entry.labelKey
      const hasValidReq = req && req !== entry.requirementKey
      return {
        id: entry.id,
        label: hasValidLabel ? label : formatChronicleLabel(entry.id),
        requirement: hasValidReq ? req : formatChronicleRequirement(entry.id)
      }
    })
})

const recentUnlocks = computed(() => {
  return unlockedEntries.value.slice(0, 3)
})

function openInBook(bookLink) {
  if (!bookLink) return
  const pageNumber = bookLink.pageNumber || 1
  emit('navigate', { page: 'book', tab: String(pageNumber) })
}

// ── Discovery Log ──

const showAllDiscovery = ref(false)
const DISCOVERY_DISPLAY_LIMIT = 20

const discoveryLog = computed(() => {
  if (!unlockService.value) return []
  const shown = unlockService.value.getShownNarratives() || []

  return [...shown]
    .sort((a, b) => {
      if (a.daySeen === null && b.daySeen === null) return 0
      if (a.daySeen === null) return 1
      if (b.daySeen === null) return -1
      return b.daySeen - a.daySeen
    })
    .map(entry => {
      const narrative = UNLOCK_NARRATIVES.find(n => n.id === entry.id)
      return {
        id: entry.id,
        title: narrative ? t(narrative.titleKey) : entry.id,
        lore: narrative ? t(narrative.loreKey) : '',
        daySeen: entry.daySeen
      }
    })
})

const displayedDiscoveryLog = computed(() => {
  if (showAllDiscovery.value) return discoveryLog.value
  return discoveryLog.value.slice(0, DISCOVERY_DISPLAY_LIMIT)
})

const hasMoreDiscovery = computed(() => discoveryLog.value.length > DISCOVERY_DISPLAY_LIMIT)

const totalNarratives = computed(() => UNLOCK_NARRATIVES.length)

function openDiscoveryDetail(entry) {
  const narrative = UNLOCK_NARRATIVES.find(n => n.id === entry.id)
  if (narrative) {
    queueNarrative(narrative)
  }
}
</script>

<style scoped>
.chronicle-tab {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
  height: 100%;
}

/* Recently Unlocked */
.recent-section h3 {
  margin: 0 0 var(--spacing-sm);
  font-size: 0.9rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.recent-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.recent-milestone-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  min-width: 200px;
  max-width: 300px;
  flex: 1;
}

.recent-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.recent-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
}

.recent-day {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.btn-replay-icon {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--glass-border);
  color: var(--text-primary);
  border-radius: var(--radius-sm);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-replay-icon:hover {
  background: rgba(74, 222, 128, 0.1);
  border-color: var(--color-primary-light);
}

/* Two-pane layout */
.chronicle-two-pane {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: var(--spacing-lg);
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .chronicle-two-pane {
    grid-template-columns: 1fr;
  }
}

/* Main Pane: Catalog */
.chronicle-main-pane {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
}

.catalog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-bottom: var(--spacing-sm);
}

.catalog-header h3 {
  margin: 0;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-primary-light);
  font-family: var(--font-heading);
}

.catalog-count {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.catalog-empty {
  font-size: 0.85rem;
  color: var(--text-muted);
  font-style: italic;
  text-align: center;
  padding: var(--spacing-lg);
}

.catalog-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  overflow-y: auto;
}

.catalog-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s ease;
}

.catalog-row:hover {
  border-color: var(--color-primary-light);
  background: rgba(74, 222, 128, 0.05);
}

.catalog-main-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  flex: 1;
}

.catalog-header-line {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.catalog-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
}

.catalog-badge {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  padding: 1px 6px;
  border-radius: var(--radius-sm);
}

.catalog-badge.badge-unlocked {
  background: rgba(16, 185, 129, 0.2);
  color: #6ee7b7;
  text-shadow: 0 0 6px rgba(16, 185, 129, 0.4);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.catalog-badge.badge-locked {
  background: rgba(100, 100, 100, 0.15);
  color: var(--text-muted);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.catalog-row.catalog-locked {
  cursor: default;
  opacity: 0.6;
}

.catalog-row.catalog-locked:hover {
  border-color: var(--glass-border);
  background: rgba(255, 255, 255, 0.02);
}

.catalog-title-locked {
  color: var(--text-muted);
}

.catalog-req {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-style: italic;
}

.catalog-meta {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.catalog-day {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.catalog-book-ref {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-style: italic;
}

.catalog-actions {
  display: flex;
  align-items: center;
}

.btn-book-icon {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--glass-border);
  color: var(--text-primary);
  border-radius: var(--radius-sm);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-book-icon:hover {
  background: rgba(74, 222, 128, 0.1);
  border-color: var(--color-primary-light);
}

/* Discovery Log (same as before) */
.chronicle-discovery-pane {
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.discovery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-bottom: var(--spacing-sm);
}

.discovery-header h3 {
  margin: 0;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-primary-light);
  font-family: var(--font-heading);
}

.discovery-count {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.discovery-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  overflow-y: auto;
  max-height: 450px;
}

.discovery-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm);
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s ease;
}

.discovery-row:hover {
  border-color: var(--color-primary-light);
  background: rgba(74, 222, 128, 0.05);
}

.discovery-title {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-primary);
}

.discovery-day {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.discovery-empty {
  font-size: 0.8rem;
  color: var(--text-muted);
  font-style: italic;
  text-align: center;
  padding: var(--spacing-md);
}

.discovery-toggle-btn {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  margin-top: var(--spacing-sm);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: var(--font-body);
}

.discovery-toggle-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--color-primary-light);
  color: var(--text-primary);
}
</style>
