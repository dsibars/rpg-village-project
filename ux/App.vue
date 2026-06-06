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
        :wood="wood"
        @nextDay="onNextDay"
      />

      <main class="app-main" role="main" :aria-label="currentPageLabel">
        <div v-if="pageError" class="page-error" role="alert">
          <h2>{{ pageError.title }}</h2>
          <p>{{ pageError.message }}</p>
          <button class="btn-retry" @click="clearPageError">
            {{ t('shared_uxelm_close') }}
          </button>
        </div>

        <component
          :is="currentPageComponent"
          v-else
          @openSettings="currentPage = 'settings'"
          @navigate="handleNavigate"
        />
      </main>

      <FooterNav
        :current="currentPage"
        :items="navItems"
        @navigate="currentPage = $event"
      />
    </template>

    <ToastContainer />

    <CombatOverlay
      v-if="showCombatOverlay"
      @close="showCombatOverlay = false"
    />

    <IntroDialog
      v-if="showIntro"
      :open="true"
      @close="showIntro = false"
    />

    <DailyReportModal
      v-if="showDailyReport"
      :open="true"
      :report="dailyReport"
      @close="onCloseDailyReport"
    />

    <ExpeditionResultModal
      v-if="showExpeditionResult"
      :expedition="expeditionResultReport"
      @close="onCloseExpeditionResult"
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
import TopBar from './components/TopBar.vue'
import FooterNav from './components/FooterNav.vue'
import ToastContainer from './components/ToastContainer.vue'
import SaveSlotPage from './features/saveSlots/SaveSlotPage.vue'
import VillagePage from './features/village/VillagePage.vue'
import HeroesPage from './features/heroes/HeroesPage.vue'
import AdventurePage from './features/adventure/AdventurePage.vue'
import TownPage from './features/town/TownPage.vue'
import SettingsPage from './features/settings/SettingsPage.vue'
import CombatOverlay from './features/combat/CombatOverlay.vue'
import IntroDialog from './features/shared/IntroDialog.vue'
import DailyReportModal from './features/village/components/modals/DailyReportModal.vue'
import PresentationModal from './features/shared/PresentationModal.vue'
import ExpeditionResultModal from './features/shared/ExpeditionResultModal.vue'
import { useAdapter } from './core/composables/useAdapter.js'

const props = defineProps({
  engine: { type: Object, default: null },
  persistence: { type: Object, default: null },
  saveSlotManager: { type: Object, default: null }
})

const { t } = useI18n()
const { gameState, day, village, activeBattle } = useGameState()
const { dispatch } = useAdapter()
useNarrativeToasts()

const currentPage = ref('village')
const showCombatOverlay = ref(false)
const showIntro = ref(false)
const showDailyReport = ref(false)
const pageError = shallowRef(null)
const saveSlots = ref([])
const slotIndex = ref(props.persistence?.slotIndex ?? null)

// Presentation queue (PostDaySequencer Step 1)
const presentationQueue = ref([])
const currentPresentation = ref(null)
const showPresentation = ref(false)
const presentationsDone = ref(true)

// Post-day sequencing state
const pendingReport = ref(null)
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
const dailyReport = computed(() => gameState.value.village?.lastDailyReport || null)
const dismissedReportDay = ref(null)

watch(dailyReport, (report) => {
  if (report && report.day !== dismissedReportDay.value && presentationsDone.value && !showExpeditionResult.value) {
    showDailyReport.value = true
  }
})

const hasSlotSelected = computed(() => slotIndex.value !== null)

const gold = computed(() => village.value.gold || 0)
const population = computed(() => village.value.population || 0)
const wood = computed(() => village.value.wood || 0)

const pages = {
  village: VillagePage,
  heroes: HeroesPage,
  adventure: AdventurePage,
  town: TownPage,
  settings: SettingsPage
}

const currentPageComponent = computed(() => pages[currentPage.value] || VillagePage)
const currentPageLabel = computed(() => {
  const labels = {
    village: 'shared_uxelm_nav_village',
    heroes: 'shared_uxelm_nav_heroes',
    adventure: 'shared_uxelm_nav_adventure',
    town: 'shared_uxelm_nav_town',
    settings: 'shared_uxelm_nav_settings'
  }
  return t(labels[currentPage.value] || 'shared_uxelm_nav_main')
})

const navItems = computed(() => [
  { id: 'village', label: t('shared_uxelm_nav_village'), icon: '\u{1F3D8}' },
  { id: 'heroes', label: t('shared_uxelm_nav_heroes'), icon: '\u{2694}' },
  { id: 'adventure', label: t('shared_uxelm_nav_adventure'), icon: '\u{1F5FA}' },
  { id: 'town', label: t('shared_uxelm_nav_town'), icon: '\u{1F3EA}' }
])

function refreshSaveSlots() {
  if (!props.saveSlotManager) return
  saveSlots.value = props.saveSlotManager.listSlots()
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

  props.engine?.initialize?.()
  if (props.engine?.isNewGame) {
    showIntro.value = true
  }
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
    // Now allow daily report to show
    if (dailyReport.value && dailyReport.value.day !== dismissedReportDay.value) {
      showDailyReport.value = true
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

  // Run the day
  const report = props.engine.nextDay()
  presentationsDone.value = false

  // Check for expedition battle
  if (report?.expedition?.status === 'battle_started') {
    pendingPostCombatReport.value = report
    return
  }

  runPostDaySequence(report)
}

function runPostDaySequence(report) {
  pendingReport.value = report

  // Step 1: Expedition result modal
  if (report?.expedition && report.expedition.status !== 'battle_started') {
    expeditionResultReport.value = report.expedition
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

function onCloseDailyReport() {
  showDailyReport.value = false
  if (dailyReport.value) {
    dismissedReportDay.value = dailyReport.value.day
  }
}

function handleNavigate({ page, tab }) {
  if (page && pages[page]) {
    currentPage.value = page
  }
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
    if (pendingReport.value) {
      showDailyReport.value = true
    }
  }
}

function clearPageError() {
  pageError.value = null
}

onErrorCaptured((err, instance, info) => {
  console.error('App page error:', err, info)
  pageError.value = {
    title: 'Something went wrong',
    message: err?.message || 'An unexpected error occurred in this page.'
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
  min-height: 100vh;
  font-family: var(--font-body);
  color: var(--text-primary);
  background: var(--bg-base);
}

.app-main {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 80px; /* reserve space for footer nav */
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
</style>
