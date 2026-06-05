<template>
  <div class="settings-page">
    <h1>{{ t('settings_uxelm_title') }}</h1>

    <div class="settings-section">
      <h3>{{ t('settings_uxelm_language') }}</h3>
      <select v-model="selectedLanguage" class="language-select" @change="changeLanguage">
        <option value="en">English</option>
        <option value="es">Español</option>
        <option value="fr">Français</option>
      </select>
    </div>

    <div class="settings-section">
      <h3>{{ t('settings_uxelm_save_management') }}</h3>
      <p class="slot-label">{{ t('settings_uxelm_current_slot', { index: currentSlotIndex + 1 }) }}</p>

      <div class="setting-actions">
        <Button variant="secondary" @click="returnToSlots">
          {{ t('settings_uxelm_return_slots') }}
        </Button>
        <Button variant="danger" @click="confirmWipeSlot">
          {{ t('settings_uxelm_wipe_slot') }}
        </Button>
        <Button variant="danger" @click="confirmWipeAll">
          {{ t('settings_uxelm_wipe_all') }}
        </Button>
      </div>
    </div>

    <div class="settings-section">
      <h3>{{ t('settings_uxelm_dev_options') }}</h3>
      <div class="setting-actions">
        <Button
          variant="secondary"
          :disabled="cheatActivated"
          @click="activateDevCheat"
        >
          {{ cheatActivated ? '\u{2705} Done!' : t('settings_uxelm_dev_cheat') }}
        </Button>
        <Button
          v-if="hasArcaneSanctum"
          variant="secondary"
          @click="openMagicSimulator"
        >
          \u{1F52E} {{ t('settings_uxelm_magic_simulator') }}
        </Button>
      </div>
    </div>

    <!-- Confirm Dialog -->
    <ModalFrame
      v-if="confirmDialog.show"
      :title="t(confirmDialog.titleKey)"
      @close="confirmDialog.show = false"
    >
      <div class="confirm-dialog">
        <p>{{ t(confirmDialog.messageKey) }}</p>
        <div class="confirm-actions">
          <Button variant="danger" @click="executeConfirm">
            {{ t('shared_uxelm_confirm') }}
          </Button>
          <Button variant="secondary" @click="confirmDialog.show = false">
            {{ t('shared_uxelm_cancel') }}
          </Button>
        </div>
      </div>
    </ModalFrame>

    <!-- Magic Circle Simulator -->
    <MagicCircleEditor
      v-if="showSimulator"
      :hero="simulatorHero"
      :is-simulator="true"
      @close="showSimulator = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import { useGameState } from '@/core/composables/useGameState.js'
import { useAdapter } from '@/core/composables/useAdapter.js'
import Button from '@/components/Button.vue'
import ModalFrame from '@/components/ModalFrame.vue'
import MagicCircleEditor from '../magic_circle/MagicCircleEditor.vue'

const { t, setLanguage, currentLanguage } = useI18n()
const { gameState } = useGameState()
const { dispatch } = useAdapter()
const engine = inject('engine')

const selectedLanguage = ref(currentLanguage?.value || 'en')
const cheatActivated = ref(false)
const showSimulator = ref(false)

const village = computed(() => gameState.value.village || {})
const hasArcaneSanctum = computed(() => (village.value.infrastructure?.arcane_sanctum || 0) >= 1)
const currentSlotIndex = computed(() => engine?.getCurrentSlotIndex?.() || 0)

const confirmDialog = ref({
  show: false,
  titleKey: '',
  messageKey: '',
  onConfirm: null
})

const simulatorHero = {
  id: 'simulator_fake_hero',
  name: t('heroes_uxelm_simulator_name'),
  magicTier: 25,
  maxMp: 9999,
  knownGlyphs: [
    'glyph_fire', 'glyph_water', 'glyph_wind', 'glyph_storm', 'glyph_light', 'glyph_dark', 'glyph_earth',
    'glyph_potentiate', 'glyph_focus', 'glyph_extend',
    'glyph_multi', 'glyph_pierce', 'glyph_venom', 'glyph_slumber', 'glyph_aegis', 'glyph_celerity', 'glyph_reflect', 'glyph_leech',
    'glyph_streamline'
  ],
  glyphMastery: {
    glyph_fire: { tier: 7 }, glyph_water: { tier: 7 }, glyph_wind: { tier: 7 },
    glyph_storm: { tier: 7 }, glyph_light: { tier: 7 }, glyph_dark: { tier: 7 }, glyph_earth: { tier: 7 },
    glyph_potentiate: { tier: 7 }, glyph_focus: { tier: 7 }, glyph_extend: { tier: 7 },
    glyph_multi: { tier: 1 }, glyph_pierce: { tier: 7 }, glyph_venom: { tier: 7 },
    glyph_slumber: { tier: 7 }, glyph_aegis: { tier: 1 }, glyph_celerity: { tier: 7 },
    glyph_reflect: { tier: 7 }, glyph_leech: { tier: 7 }, glyph_streamline: { tier: 7 }
  }
}

function changeLanguage() {
  setLanguage(selectedLanguage.value)
}

function returnToSlots() {
  window.location.reload()
}

function confirmWipeSlot() {
  confirmDialog.value = {
    show: true,
    titleKey: 'settings_uxelm_wipe_slot',
    messageKey: 'settings_uxelm_wipe_slot_confirm',
    onConfirm: () => {
      engine?.wipeCurrentSlot?.()
      setTimeout(() => window.location.reload(), 100)
    }
  }
}

function confirmWipeAll() {
  confirmDialog.value = {
    show: true,
    titleKey: 'settings_uxelm_wipe_all',
    messageKey: 'settings_uxelm_wipe_all_confirm',
    onConfirm: () => {
      engine?.wipeAllSlots?.()
      setTimeout(() => window.location.reload(), 100)
    }
  }
}

function executeConfirm() {
  if (confirmDialog.value.onConfirm) {
    confirmDialog.value.onConfirm()
  }
  confirmDialog.value.show = false
}

function activateDevCheat() {
  dispatch('settings', 'devCheatActivate')
  cheatActivated.value = true
  setTimeout(() => { cheatActivated.value = false }, 1500)
}

function openMagicSimulator() {
  showSimulator.value = true
}
</script>

<style scoped>
.settings-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
  color: var(--text-primary);
  max-width: 600px;
  margin: 0 auto;
}

.settings-page h1 {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 1.5rem;
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
}

.settings-section h3 {
  margin: 0;
  font-size: 1rem;
  color: var(--text-primary);
}

.language-select {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-base);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: 0.9rem;
}

.slot-label {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.setting-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.confirm-dialog {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  max-width: 400px;
}

.confirm-dialog p {
  margin: 0;
  color: var(--text-primary);
}

.confirm-actions {
  display: flex;
  gap: var(--spacing-sm);
  justify-content: flex-end;
}
</style>
