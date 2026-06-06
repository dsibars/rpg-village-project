<template>
  <div class="heroes-page">
    <div v-if="pageError" class="page-error-banner" role="alert">
      <p>{{ pageError }}</p>
      <Button size="sm" variant="secondary" @click="pageError = null">
        {{ t('shared_uxelm_dismiss') }}
      </Button>
    </div>

    <div class="heroes-layout" :class="{ 'detail-active': selectedHeroId }">
      <aside class="heroes-list-panel">
        <header class="list-header">
          <h1>{{ t('heroes_uxelm_list_title') }}</h1>
          <Button
            v-if="canRecruit"
            variant="primary"
            size="sm"
            :disabled="!canAffordRecruit"
            :title="recruitTitle"
            @click="recruitHero"
          >
            {{ t('heroes_uxelm_recruit') }} ({{ recruitCost }}g)
          </Button>
        </header>

        <HeroList
          :heroes="heroes"
          :selected-id="selectedHeroId"
          @select="selectedHeroId = $event"
        />
      </aside>

      <section class="heroes-detail-panel">
        <Button
          v-if="selectedHeroId"
          variant="ghost"
          size="sm"
          class="mobile-back"
          @click="selectedHeroId = null"
        >
          \u{2190} {{ t('shared_uxelm_back') }}
        </Button>

        <HeroProfile
          v-if="selectedHero"
          :hero="selectedHero"
          :infrastructure="village.infrastructure || {}"
          :heroes="heroes"
          @allocate-stat="allocateStat"
          @open-action="openAction"
        />
        <HeroEmptyState v-else />
      </section>
    </div>

    <HeroSkillsModal
      v-if="selectedHero && activeModal === 'skills'"
      :hero="selectedHero"
      :open="true"
      @close="activeModal = null"
      @learn="learnFamily"
    />

    <HeroConsumablesModal
      v-if="selectedHero && activeModal === 'consumables'"
      :hero="selectedHero"
      :consumables="inventory.consumables"
      :open="true"
      @close="activeModal = null"
      @use="useConsumable"
    />

    <HeroEquipmentModal
      v-if="selectedHero && activeModal === 'equipment'"
      :hero="selectedHero"
      :inventory-equipment="inventory.equipment || []"
      :open="true"
      @close="activeModal = null"
      @equip="equipItem"
      @unequip="unequipItem"
    />

    <HeroInscriptionModal
      v-if="selectedHero && activeModal === 'inscription'"
      :hero="selectedHero"
      :open="true"
      @close="activeModal = null"
      @inscribe="inscribeBodyCircle"
    />

    <TrainerModal
      v-if="selectedHero && activeModal === 'trainer'"
      :hero="selectedHero"
      :open="true"
      @close="activeModal = null"
    />

    <WitchModal
      v-if="selectedHero && activeModal === 'witch'"
      :heroes="heroes"
      :selected-hero="selectedHero"
      :open="true"
      @close="activeModal = null"
    />

    <AcademyModal
      v-if="selectedHero && activeModal === 'academy'"
      :open="true"
      @close="activeModal = null"
    />

    <HallOfFameModal
      v-if="selectedHero && activeModal === 'hallOfFame'"
      :hero="selectedHero"
      :open="true"
      @close="activeModal = null"
    />

    <GambitEditor
      v-if="selectedHero && activeModal === 'gambits'"
      :hero="selectedHero"
      :bestiary="bestiary"
      :enemy-templates="enemyTemplates"
      @action="handleGambitAction"
      @close="activeModal = null"
    />

    <MagicCircleEditor
      v-if="selectedHero && activeModal === 'magicCircle'"
      :hero="selectedHero"
      @close="activeModal = null"
      @inscribe="handleInscribeSpell"
    />
  </div>
</template>

<script setup>
import { ref, computed, onErrorCaptured } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import { useGameState, useBestiary } from '@/core/composables/useGameState.js'
import { useAdapter } from '@/core/composables/useAdapter.js'
import Button from '@/components/Button.vue'
import HeroList from './components/HeroList.vue'
import HeroProfile from './components/HeroProfile.vue'
import HeroEmptyState from './components/HeroEmptyState.vue'
import HeroSkillsModal from './components/modals/HeroSkillsModal.vue'
import HeroConsumablesModal from './components/modals/HeroConsumablesModal.vue'
import HeroEquipmentModal from './components/modals/HeroEquipmentModal.vue'
import HeroInscriptionModal from './components/modals/HeroInscriptionModal.vue'
import TrainerModal from './components/modals/TrainerModal.vue'
import WitchModal from './components/modals/WitchModal.vue'
import AcademyModal from './components/modals/AcademyModal.vue'
import HallOfFameModal from './components/modals/HallOfFameModal.vue'
import GambitEditor from '../gambit/GambitEditor.vue'
import MagicCircleEditor from '../magic_circle/MagicCircleEditor.vue'

const { t } = useI18n()
const { heroes, village, inventory } = useGameState()
const { bestiary, enemyTemplates } = useBestiary()
const { dispatch } = useAdapter()

const selectedHeroId = ref(null)
const activeModal = ref(null)
const pageError = ref(null)

onErrorCaptured((err, instance, info) => {
  console.error('HeroesPage error:', err, info)
  pageError.value = err?.message || 'An error occurred in the Heroes page.'
  return false
})

const selectedHero = computed(() =>
  heroes.value.find((h) => h.id === selectedHeroId.value) || null
)

const tavernLevel = computed(() => village.value.infrastructure?.tavern || 0)
const canRecruit = computed(() => tavernLevel.value >= 1)

const heroCount = computed(() => heroes.value.length)
const recruitCost = computed(() => Math.floor(100 * Math.pow(1.2, heroCount.value)))

const canAffordRecruit = computed(() => (village.value.gold || 0) >= recruitCost.value)
const recruitTitle = computed(() =>
  canAffordRecruit.value
    ? `${t('heroes_uxelm_recruit')} (${recruitCost.value}g)`
    : t('village_error_gold_not_enough')
)

function recruitHero() {
  if (!canAffordRecruit.value) return
  dispatch('hero', 'recruit')
}

function allocateStat(statId) {
  if (!selectedHeroId.value) return
  dispatch('hero', 'increaseStat', { heroId: selectedHeroId.value, statId })
}

function openAction(actionId) {
  const knownModals = [
    'skills', 'consumables', 'equipment', 'inscription',
    'trainer', 'witch', 'academy', 'hallOfFame', 'gambits', 'magicCircle'
  ]
  if (knownModals.includes(actionId)) {
    activeModal.value = actionId
  }
}

function handleGambitAction(actionType, payload) {
  const result = dispatch('gambit', actionType, payload)
  if (actionType === 'testGambits' && payload?.onResult && result?.success) {
    payload.onResult(result.data)
  }
}

function handleInscribeSpell({ glyphIds, glyphTiers, name }) {
  if (!selectedHeroId.value) return
  dispatch('hero', 'inscribeSpell', {
    heroId: selectedHeroId.value,
    spell: { glyphIds, glyphTiers, name }
  })
}

function learnFamily(familyId) {
  if (!selectedHeroId.value) return
  dispatch('hero', 'learnFamily', { heroId: selectedHeroId.value, familyId })
}

function useConsumable(consumableId) {
  if (!selectedHeroId.value) return
  dispatch('hero', 'useConsumable', { heroId: selectedHeroId.value, consumableId })
}

function equipItem({ slot, equipmentId }) {
  if (!selectedHeroId.value) return
  dispatch('hero', 'equipItem', { heroId: selectedHeroId.value, slot, equipmentId })
}

function unequipItem(slot) {
  if (!selectedHeroId.value) return
  dispatch('hero', 'unequipItem', { heroId: selectedHeroId.value, slot })
}

function inscribeBodyCircle({ glyphIds, glyphTiers }) {
  if (!selectedHeroId.value) return
  dispatch('hero', 'inscribeBodyCircle', { heroId: selectedHeroId.value, glyphIds, glyphTiers })
}
</script>

<style scoped>
.heroes-page {
  padding: var(--spacing-lg);
  color: var(--text-primary);
  height: 100%;
  box-sizing: border-box;
}

.heroes-layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: var(--spacing-lg);
  height: 100%;
  min-height: 0;
}

.heroes-list-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  min-height: 0;
  overflow: hidden;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-sm);
}

.list-header h1 {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 1.25rem;
  color: var(--color-primary);
}

.heroes-detail-panel {
  position: relative;
  min-height: 0;
  overflow-y: auto;
}

.mobile-back {
  display: none;
  margin-bottom: var(--spacing-md);
}

.page-error-banner {
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-sm);
}

.page-error-banner p {
  margin: 0;
}

@media (max-width: 768px) {
  .heroes-layout {
    grid-template-columns: 1fr;
  }

  .heroes-list-panel {
    display: flex;
  }

  .heroes-layout.detail-active .heroes-list-panel {
    display: none;
  }

  .heroes-detail-panel {
    display: none;
  }

  .heroes-layout.detail-active .heroes-detail-panel {
    display: block;
  }

  .mobile-back {
    display: inline-flex;
  }
}
</style>
