<template>
  <div class="app-root" role="application" :aria-label="t('shared_uxelm_nav_main')">
    <template v-if="!hasSlotSelected">
      <SaveSlotPage
        :slots="saveSlots"
        @selectSlot="onSelectSlot"
        @deleteSlot="onDeleteSlot"
      />
    </template>

    <template v-else>
      <TopBar
        :day="day"
        :gold="gold"
        :population="population"
        :max-population="maxPopulation"
        :wood="wood"
        :stone="stone"
        :iron="iron"
        :storage-used="storageUsed"
        :storage-max="storageMax"
        :has-book-glow="hasBookUnread"
        @nextDay="onNextDay"
        @openSettings="currentPage = 'settings'"
        @navigate="handleNavigate"
      />

      <main class="app-main" role="main" :aria-label="currentPageLabel">
        <div v-if="pageError" class="page-error" role="alert">
          <h2>{{ t('shared_uxelm_error_title') }}</h2>
          <p>{{ t('shared_uxelm_error_message') }}</p>
          <button class="btn-retry" @click="clearPageError">
            {{ t('shared_uxelm_close') }}
          </button>
        </div>

        <component
          :is="currentPageComponent"
          v-else
          :active-tab="activeTab"
          @openSettings="currentPage = 'settings'"
          @navigate="handleNavigate"
        />
      </main>

      <FooterNav
        :current="currentPage"
        :items="navItems"
        :locked-tabs="lockedTabs"
        @navigate="handlePageChange"
      />
    </template>

    <ToastContainer />

    <CombatOverlay
      v-if="showCombatOverlay"
      @close="showCombatOverlay = false"
    />

    <ExpeditionResultModal
      v-if="showExpeditionResult"
      :expedition="expeditionResultReport"
      @close="onCloseExpeditionResult"
    />

    <TutorialOverlay
      v-if="tutorialActive"
      :step="currentTutorialStep"
      @navigate="handleNavigate"
      @report="handleTutorialReport"
      @complete="completeTutorial"
      @skip="skipTutorial"
    />

    <PresentationModal
      v-if="showPresentation"
      :open="showPresentation"
      :presentation="currentPresentation"
      @complete="onPresentationComplete"
      @close="showPresentation = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, shallowRef, onErrorCaptured, watch } from 'vue'
import { useI18n } from './core/composables/useI18n.js'
import { useGameState } from './core/composables/useGameState.js'
import { useNarrativeToasts } from './core/composables/useNarrativeToasts.js'
import { useTutorial } from './core/composables/useTutorial.js'
import { showToast } from './core/toast.js'
import TopBar from './components/TopBar.vue'
import FooterNav from './components/FooterNav.vue'
import ToastContainer from './components/ToastContainer.vue'
import SaveSlotPage from './features/saveSlots/SaveSlotPage.vue'
import BookPage from './features/book/BookPage.vue'
import VillagePage from './features/village/VillagePage.vue'
import HeroesPage from './features/heroes/HeroesPage.vue'
import AdventurePage from './features/adventure/AdventurePage.vue'
import TownPage from './features/town/TownPage.vue'
import SettingsPage from './features/settings/SettingsPage.vue'
import CombatOverlay from './features/combat/CombatOverlay.vue'
import PresentationModal from './features/shared/PresentationModal.vue'
import ExpeditionResultModal from './features/shared/ExpeditionResultModal.vue'
import TutorialOverlay from './core/components/TutorialOverlay.vue'
import { useAdapter } from './core/composables/useAdapter.js'

const props = defineProps({
  engine: { type: Object, default: null },
  persistence: { type: Object, default: null },
  saveSlotManager: { type: Object, default: null }
})

const { t } = useI18n()
const { gameState, day, village, activeBattle } = useGameState()
const { dispatch } = useAdapter()
const { canNavigate, canDispatch, lockedTabs, isActive: tutorialActive, stepData: currentTutorialStep, reportEvent, skip: skipTutorialFn, complete: completeTutorialFn } = useTutorial()
useNarrativeToasts()

const currentPage = ref('village')
const activeTab = ref(null)
const showCombatOverlay = ref(false)
const pageError = shallowRef(null)
const saveSlots = ref([])
const slotIndex = ref(props.persistence?.slotIndex ?? null)
const bookFirstClosed = ref(false)

// Storage warning state (PF-012)
const storageWarningDismissed = ref(false)
const inventory = computed(() => gameState.value.inventory || {})
const maxStorage = computed(() => village.value.maxStorage || 100)
const storagePercent = computed(() => {
  const used = inventory.value.totalUsed || 0
  const max = maxStorage.value
  return max > 0 ? (used / max) * 100 : 0
})

watch(storagePercent, (pct) => {
  if (pct > 95 && !storageWarningDismissed.value) {
    showToast(t('shop_uxelm_storage_warning'), 'warning')
    storageWarningDismissed.value = true
  }
  if (pct < 80) {
    storageWarningDismissed.value = false
  }
})

// Tutorial trigger: record book-first-closed event on Day 1
watch(currentPage, (newPage, oldPage) => {
  if (oldPage === 'book' && newPage !== 'book' && day.value === 1 && !bookFirstClosed.value) {
    bookFirstClosed.value = true
    props.engine?.recordEvent?.('book_first_closed', { day: 1 })
  }
})

// Presentation queue (PostDaySequencer Step 1)
const presentationQueue = ref([])
const currentPresentation = ref(null)
const showPresentation = ref(false)
const presentationsDone = ref(true)

// Post-day sequencing state
const pendingPostCombatReport = ref(null)
const expeditionResultReport = ref(null)
const showExpeditionResult = ref(false)

// Auto-show combat overlay when battle starts
watch(activeBattle, (battle) => {
  if (battle && !battle.isOver) {
    showCombatOverlay.value = true
  }
}, { immediate: true })

// Watch combat overlay closing to resume post-day sequences
watch(showCombatOverlay, (newVal, oldVal) => {
  if (!newVal && oldVal && pendingPostCombatReport.value) {
    const report = pendingPostCombatReport.value
    pendingPostCombatReport.value = null
    runPostDaySequence(report)
  }
})

// Daily report watcher — gated behind presentation completion
const hasSlotSelected = computed(() => slotIndex.value !== null)

const gold = computed(() => village.value.gold || 0)
const population = computed(() => village.value.population || 0)
const wood = computed(() => {
  const mats = gameState.value.inventory?.materials
  if (typeof mats === 'object' && mats !== null && !Array.isArray(mats)) {
    return mats.material_wood || village.value.wood || 0
  }
  return village.value.wood || 0
})
const stone = computed(() => {
  const mats = gameState.value.inventory?.materials
  if (typeof mats === 'object' && mats !== null && !Array.isArray(mats)) {
    return mats.material_stone || 0
  }
  return 0
})
const iron = computed(() => {
  const mats = gameState.value.inventory?.materials
  if (typeof mats === 'object' && mats !== null && !Array.isArray(mats)) {
    return mats.material_iron || 0
  }
  return 0
})
const maxPopulation = computed(() => village.value.maxPopulation || 0)
const storageUsed = computed(() => inventory.value.totalUsed || 0)
const storageMax = computed(() => maxStorage.value)

const hasBookUnread = computed(() => {
  const book = gameState.value?.book
  if (!book) return false
  const autoOpenTypes = ['history_block', 'milestone']
  for (const page of book.pages || []) {
    for (const pcs of page.pageContentSections || []) {
      if (!pcs.read && autoOpenTypes.includes(pcs.type)) return true
    }
  }
  return false
})

const pages = {
  village: VillagePage,
  heroes: HeroesPage,
  adventure: AdventurePage,
  town: TownPage,
  book: BookPage,
  settings: SettingsPage
}

const currentPageComponent = computed(() => pages[currentPage.value] || VillagePage)
const currentPageLabel = computed(() => {
  const labels = {
    village: 'shared_uxelm_nav_village',
    heroes: 'shared_uxelm_nav_heroes',
    adventure: 'shared_uxelm_nav_adventure',
    town: 'shared_uxelm_nav_town',
    book: 'book_uxelm_title',
    settings: 'shared_uxelm_nav_settings'
  }
  return t(labels[currentPage.value] || 'shared_uxelm_nav_main')
})

const navItems = computed(() => [
  { id: 'village', label: t('shared_uxelm_nav_main'), icon: '🏡' },
  { id: 'heroes', label: t('shared_uxelm_nav_heroes'), icon: '⚔' },
  { id: 'adventure', label: t('shared_uxelm_nav_adventure'), icon: '🗺' },
  { id: 'town', label: t('shared_uxelm_nav_town'), icon: '🏘' },
  { id: 'book', label: t('book_uxelm_title'), icon: '📖' }
])

function refreshSaveSlots() {
  if (!props.saveSlotManager) return
  const slots = props.saveSlotManager.listSlots() || []
  saveSlots.value = slots.map(slot => {
    const idx = slot.slotIndex !== undefined ? slot.slotIndex : slot.index
    let summary = null
    let lastPlayedFormatted = ''
    if (slot.exists) {
      try {
        summary = props.saveSlotManager.getSlotSummary(idx)
        lastPlayedFormatted = props.saveSlotManager.formatLastPlayed(slot.lastPlayedAt)
      } catch (e) {
        console.error('Failed to load summary for slot:', idx, e)
      }
    }
    return {
      ...slot,
      summary,
      lastPlayedFormatted
    }
  })
}

function onSelectSlot(index) {
  if (!props.persistence || !props.saveSlotManager) return

  const slots = props.saveSlotManager.listSlots()
  const slot = slots[index]

  if (slot?.exists) {
    props.persistence.setSlot(index)
  } else {
    props.saveSlotManager.createSlot(index)
    props.persistence.setSlot(index)
  }
  slotIndex.value = index
  bookFirstClosed.value = false

  props.engine?.initialize?.()
  // Force a reactive state update so Book auto-open detection works immediately
  const freshState = props.engine?.update?.() || {}
  gameState.value = freshState

  // Book auto-opens via proceedToPresentations if there are unread history_block/milestone entries
  proceedToPresentations()
  refreshSaveSlots()
}

function onDeleteSlot(index) {
  if (!props.saveSlotManager) return
  props.saveSlotManager.deleteSlot(index)
  refreshSaveSlots()
}

function showNextPresentation() {
  if (presentationQueue.value.length === 0) {
    currentPresentation.value = null
    showPresentation.value = false
    presentationsDone.value = true
    // Auto-open the Book if there's unread auto-open content
    if (hasBookUnread.value) {
      currentPage.value = 'book'
    }
    return
  }
  const pres = presentationQueue.value.shift()
  currentPresentation.value = pres
  showPresentation.value = true
}

function onPresentationComplete() {
  // Mark as seen
  if (currentPresentation.value?.id) {
    dispatch('presentation', 'markAsSeen', { presentationId: currentPresentation.value.id })
  }
  showPresentation.value = false
  // Small delay before next presentation
  setTimeout(showNextPresentation, 300)
}

function onNextDay() {
  if (!props.engine) return

  // Tutorial action guard
  if (!canDispatch('village.nextDay')) {
    showToast(t('tutorial_uxelm_action_blocked'), 'warning')
    return
  }

  // Prevent daily report from showing until post-day sequence is complete
  presentationsDone.value = false

  // Run the day
  const report = props.engine.nextDay()

  // Check for expedition battle
  if (report?.expedition?.status === 'battle_started') {
    pendingPostCombatReport.value = report
    return
  }

  runPostDaySequence(report)
}

function runPostDaySequence(report) {
  // Step 1: Expedition result modal
  let expData = report?.expedition
  // If the stale report says battle_started, check if combat actually resolved the expedition
  if (expData?.status === 'battle_started') {
    const es = props.engine?.expeditionService
    const completedIds = es?.state?.completedIds || []
    if (expData.expId && completedIds.includes(expData.expId)) {
      const exp = es?.getExpeditions?.()?.find(e => e.id === expData.expId)
      expData = {
        status: 'completed',
        expId: expData.expId,
        expName: expData.expName || exp?.name || expData.expId,
        rewards: exp?.reward,
        combatLog: { isVictory: true }
      }
    }
  }
  if (expData && expData.status !== 'battle_started') {
    expeditionResultReport.value = expData
    showExpeditionResult.value = true
    return
  }

  proceedToPresentations()
}

function onCloseExpeditionResult() {
  showExpeditionResult.value = false
  expeditionResultReport.value = null
  proceedToPresentations()
}

function handleNavigate({ page, tab }) {
  if (page && pages[page]) {
    currentPage.value = page
    activeTab.value = tab || null
    pageError.value = null
  }
}

function handlePageChange(page) {
  if (!canNavigate(page)) {
    showToast(t('tutorial_uxelm_nav_blocked'), 'warning')
    return
  }
  currentPage.value = page
  activeTab.value = null
  pageError.value = null
}

function handleTutorialReport(evt) {
  reportEvent(evt)
}

function completeTutorial() {
  completeTutorialFn()
}

function skipTutorial() {
  skipTutorialFn()
}

function proceedToPresentations() {
  const ps = props.engine?.presentationService
  const pendingIds = ps?.state?.pendingPresentations || []
  if (pendingIds.length > 0) {
    presentationQueue.value = pendingIds
      .map(id => ps?.replayPresentation?.(id))
      .filter(Boolean)
    showNextPresentation()
  } else {
    presentationsDone.value = true
    // Auto-open Book if there are unread history_block/milestone entries
    if (hasBookUnread.value) {
      currentPage.value = 'book'
    }
  }
}

function clearPageError() {
  pageError.value = null
}

onErrorCaptured((err, instance, info) => {
  console.error('App page error:', err, info)
  pageError.value = {
    title: t('shared_uxelm_error_title'),
    message: err?.message || t('shared_uxelm_error_message')
  }
  return false
})

// Initialise save-slot list when the app boots without a selected slot.
refreshSaveSlots()
</script>

<style scoped>
.app-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  font-family: var(--font-body);
  color: var(--text-primary);
  background: transparent;
}

.app-main {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.page-error {
  padding: var(--spacing-lg);
  text-align: center;
  color: var(--text-primary);
}

.page-error h2 {
  font-family: var(--font-heading);
  color: var(--color-danger);
}

.btn-retry {
  margin-top: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-family: var(--font-body);
}

.btn-retry:hover {
  background: var(--color-primary-light);
}

.btn-retry:focus-visible {
  outline: 2px solid var(--color-primary-light);
  outline-offset: 2px;
}
</style>
