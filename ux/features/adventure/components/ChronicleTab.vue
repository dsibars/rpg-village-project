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
            <span class="recent-day">{{ t('chronicle_day_prefix') }} {{ item.daySeen }}</span>
          </div>
          <button class="btn-replay-icon" :title="t('chronicle_replay')" @click="replayPresentation(item.id)">
            <span>📖</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Two-pane layout -->
    <div class="chronicle-two-pane">
      <!-- Main/Left Pane: Chapters -->
      <div class="chronicle-main-pane">
        <div class="chapters-list">
          <div
            v-for="chapterId in [1, 2]"
            :key="chapterId"
            class="chronicle-chapter-group"
          >
            <button
              class="chapter-header"
              :class="{ collapsed: !expandedChapters[chapterId] }"
              @click="toggleChapter(chapterId)"
            >
              <div class="chapter-header-left">
                <span class="chapter-toggle-icon">▼</span>
                <span class="chapter-title-text">{{ t(`chronicle_chapter_${chapterId}_title`) }}</span>
              </div>
              <span class="chapter-progress-badge">
                {{ chapterProgress[chapterId].seen }} / {{ chapterProgress[chapterId].total }}
              </span>
            </button>

            <div v-if="expandedChapters[chapterId]" class="chapter-content">
              <div
                v-for="milestone in chapterMilestones[chapterId]"
                :key="milestone.id"
                class="milestone-row"
                :class="milestone.rowClass"
              >
                <div class="milestone-main-info">
                  <div class="milestone-header-line">
                    <span class="milestone-title">{{ milestone.title }}</span>
                    <span class="milestone-badge" :class="'badge-' + milestone.status">
                      {{ t('chronicle_' + milestone.status) }}
                    </span>
                    <span v-if="milestone.daySeen !== null" class="milestone-day">
                      {{ t('chronicle_day_prefix') }} {{ milestone.daySeen }}
                    </span>
                    <span v-else-if="milestone.status === 'pending'" class="milestone-day">
                      {{ t('chronicle_pending_hint') }}
                    </span>
                  </div>
                  
                  <div v-if="milestone.status === 'locked'" class="milestone-trigger-hint">
                    <span class="hint-label">{{ t('chronicle_hint_prefix') }}</span> {{ milestone.hint }}
                  </div>
                  <div v-else class="milestone-excerpt" :title="milestone.excerpt">
                    {{ milestone.excerpt }}
                  </div>
                </div>

                <div v-if="milestone.status !== 'locked'" class="milestone-actions">
                  <Button variant="secondary" size="sm" @click="replayPresentation(milestone.id)">
                    <span class="icon">📖</span> <span>{{ t('chronicle_replay') }}</span>
                  </Button>
                </div>
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
            v-for="entry in discoveryLog"
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
        </div>
      </div>
    </div>

    <!-- Custom Replay Modal (when playing from the chronicle view) -->
    <PresentationModal
      v-if="activeReplayPresentation"
      :open="true"
      :presentation="activeReplayPresentation"
      @close="activeReplayPresentation = null"
    />
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import { useGameState } from '@/core/composables/useGameState.js'
import { PRESENTATION_CATALOG } from '@/core/data/index.js'
import { UNLOCK_NARRATIVES } from '@/core/data/index.js'
import Button from '@/components/Button.vue'
import PresentationModal from '../../shared/PresentationModal.vue'
import { queueNarrative } from '@/core/toast.js'

const { t } = useI18n()
const { gameState } = useGameState()
const engine = inject('engine')

const expandedChapters = ref({
  1: true,
  2: true
})

const activeReplayPresentation = ref(null)

const presentationService = computed(() => engine?.presentationService)
const unlockService = computed(() => engine?.unlockService)

// Collapsible toggle
function toggleChapter(chapterId) {
  expandedChapters.value[chapterId] = !expandedChapters.value[chapterId]
}

// Replay a presentation
function replayPresentation(id) {
  if (presentationService.value) {
    const pres = presentationService.value.replayPresentation(id)
    if (pres) {
      activeReplayPresentation.value = pres
    }
  }
}

// Chapter progress computation
const chapterProgress = computed(() => {
  const ps = presentationService.value
  const getProgress = (chapterNum) => {
    const milestones = PRESENTATION_CATALOG.filter(
      p => p.chapter === chapterNum && p.trigger.type !== 'chapter_milestones'
    )
    const seen = ps ? milestones.filter(p => ps.isSeen(p.id)).length : 0
    return { seen, total: milestones.length }
  }
  return {
    1: getProgress(1),
    2: getProgress(2)
  }
})

// Trigger hint resolver
function getTriggerHint(presentation) {
  const trigger = presentation.trigger
  if (!trigger) return ''
  
  let text = ''
  switch (trigger.type) {
    case 'new_game':
      text = t('chronicle_hint_newgame')
      break
    case 'building_complete': {
      const bldKey = `village_info_building_${trigger.buildingId}`
      const bldName = t(bldKey) !== bldKey ? t(bldKey) : 
                      trigger.buildingId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      text = t('chronicle_hint_building', { building: bldName, level: trigger.level })
      break
    }
    case 'mission_complete': {
      const cleanId = trigger.missionId.replace(/^exp_/, '')
      const possibleKey = `nar_${cleanId}_title`
      const missionName = t(possibleKey) !== possibleKey ? t(possibleKey) : 
                          (trigger.missionId === 'exp_rescue_mission' ? 'The Captured Guard' : 
                           trigger.missionId.replace(/^exp_/, '').split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '))
      text = t('chronicle_hint_mission', { mission: missionName })
      break
    }
    case 'hero_recruited': {
      const originKey = `heroes_info_origin_${trigger.origin.replace(/^origin_/, '')}`
      const originName = t(originKey) !== originKey ? t(originKey) : 
                         trigger.origin.replace(/^origin_/, '').split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      text = t('chronicle_hint_hero', { origin: originName })
      break
    }
    case 'first_event':
      text = t('chronicle_hint_event')
      break
    case 'chapter_milestones':
      text = t('chronicle_hint_finale', { chapter: trigger.chapter })
      break
    default:
      text = t('chronicle_hint_event')
  }
  return text
}

// Milestone state builder
const chapterMilestones = computed(() => {
  const ps = presentationService.value
  
  const getMilestones = (chapterId) => {
    const chapterMilestones = PRESENTATION_CATALOG.filter(p => p.chapter === chapterId)
    
    // Find the first non-seen milestone to highlight as "next"
    const firstUnseenIndex = chapterMilestones.findIndex(p => {
      if (!ps) return false
      const isSeen = ps.isSeen(p.id)
      const isPending = (ps.state?.pendingPresentations || []).includes(p.id)
      return !isSeen && !isPending
    })

    return chapterMilestones.map((pres, index) => {
      let status = 'locked'
      if (ps) {
        if (ps.isSeen(pres.id)) {
          status = 'seen'
        } else {
          const pending = ps.state?.pendingPresentations || []
          if (pending.includes(pres.id)) {
            status = 'pending'
          }
        }
      }

      let title = '???'
      let daySeen = null
      let excerpt = ''
      let hint = ''
      let rowClass = 'state-locked'
      const isNext = index === firstUnseenIndex

      if (status === 'seen') {
        title = t(pres.id)
        rowClass = 'state-seen'
        daySeen = ps ? ps.getDaySeen(pres.id) : null
        
        const firstPageKey = pres.pages?.[0]?.textKey
        excerpt = firstPageKey ? t(firstPageKey) : ''
      } else if (status === 'pending') {
        title = t(pres.id)
        rowClass = 'state-pending'
        excerpt = t('chronicle_pending_hint')
      } else {
        hint = getTriggerHint(pres)
        if (isNext) {
          rowClass = 'state-locked state-next'
        }
      }

      return {
        id: pres.id,
        status,
        title,
        daySeen,
        excerpt,
        hint,
        rowClass,
        isNext
      }
    })
  }

  return {
    1: getMilestones(1),
    2: getMilestones(2)
  }
})

// Recently unlocked presentations
const recentUnlocks = computed(() => {
  const ps = presentationService.value
  if (!ps) return []
  
  const seenList = ps.state?.seenPresentations || []
  return seenList
    .filter(entry => entry.daySeen !== null)
    .sort((a, b) => b.daySeen - a.daySeen)
    .slice(0, 3)
    .map(entry => ({
      id: entry.id,
      title: t(entry.id),
      daySeen: entry.daySeen
    }))
})

// Discovery Log
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
  background: rgba(99, 102, 241, 0.1);
  border-color: var(--color-primary-light);
}

.chronicle-two-pane {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: var(--spacing-lg);
  min-height: 400px;
}

@media (max-width: 768px) {
  .chronicle-two-pane {
    grid-template-columns: 1fr;
  }
}

.chronicle-main-pane {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.chapters-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.chronicle-chapter-group {
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.chapter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--spacing-md);
  background: none;
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  font-family: var(--font-body);
  transition: background-color 0.15s ease;
}

.chapter-header:hover {
  background: rgba(255, 255, 255, 0.02);
}

.chapter-header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.chapter-toggle-icon {
  font-size: 0.75rem;
  color: var(--text-muted);
  transition: transform 0.2s ease;
}

.chapter-header.collapsed .chapter-toggle-icon {
  transform: rotate(-90deg);
}

.chapter-title-text {
  font-size: 1rem;
  font-weight: 600;
  font-family: var(--font-heading);
}

.chapter-progress-badge {
  font-size: 0.8rem;
  background: rgba(255, 255, 255, 0.05);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
}

.chapter-content {
  display: flex;
  flex-direction: column;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(0, 0, 0, 0.1);
}

.milestone-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.milestone-row:last-child {
  border-bottom: none;
}

.milestone-row.state-locked {
  opacity: 0.45;
}

.milestone-row.state-next {
  opacity: 1;
  background: rgba(99, 102, 241, 0.08);
  border-left: 3px solid var(--color-primary);
}

.milestone-main-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  flex: 1;
}

.milestone-header-line {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.milestone-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
}

.milestone-badge {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  padding: 1px 6px;
  border-radius: var(--radius-sm);
}

.milestone-badge.badge-seen {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.milestone-badge.badge-pending {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.milestone-badge.badge-locked {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-muted);
}

.milestone-day {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.milestone-excerpt {
  font-size: 0.8rem;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 500px;
}

.milestone-trigger-hint {
  font-size: 0.8rem;
  color: var(--text-muted);
  font-style: italic;
}

.hint-label {
  font-weight: 600;
  color: #ef6c6c;
}

.milestone-actions {
  display: flex;
  align-items: center;
}

/* Discovery Log Styles */
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
  background: rgba(99, 102, 241, 0.05);
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

</style>
