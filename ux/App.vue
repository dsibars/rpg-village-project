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
  </div>
</template>

<script setup>
import { ref, computed, shallowRef, onErrorCaptured } from 'vue'
import { useI18n } from './core/composables/useI18n.js'
import { useGameState } from './core/composables/useGameState.js'
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

const props = defineProps({
  engine: { type: Object, default: null },
  persistence: { type: Object, default: null },
  saveSlotManager: { type: Object, default: null }
})

const { t } = useI18n()
const { day, village } = useGameState()

const currentPage = ref('village')
const showCombatOverlay = ref(false)
const pageError = shallowRef(null)
const saveSlots = ref([])

const hasSlotSelected = computed(() => props.persistence?.slotIndex !== null)

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
const currentPageLabel = computed(() => t('shared_uxelm_nav_main'))

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

  props.engine?.initialize?.()
  refreshSaveSlots()
}

function onDeleteSlot(index) {
  if (!props.saveSlotManager) return
  props.saveSlotManager.deleteSlot(index)
  refreshSaveSlots()
}

function onNextDay() {
  props.engine?.advanceDay?.()
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
