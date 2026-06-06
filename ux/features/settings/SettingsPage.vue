<template>
  <div class="settings-page">
    <h1>{{ t('settings_uxelm_title') }}</h1>

    <div class="settings-grid">
      <!-- Left Column -->
      <div class="settings-column">
        <!-- Interface Language -->
        <div class="settings-card">
          <h3>{{ t('settings_uxelm_language') }}</h3>
          <p class="card-desc">{{ t('settings_uxelm_language_choose') }}</p>
          <select v-model="selectedLanguage" class="language-select" @change="changeLanguage">
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="ca">Català</option>
            <option value="eu">Euskara</option>
            <option value="gl">Galego</option>
          </select>
        </div>

        <!-- Choose Save Slot -->
        <div class="settings-card">
          <h3>{{ t('shared_uxelm_save_slot_title') }}</h3>
          <p class="slot-label">{{ t('settings_uxelm_current_slot', { index: currentSlotIndex + 1 }) }}</p>
          <Button variant="secondary" class="full-width-btn" @click="returnToSlots">
            <span class="btn-icon">💾</span>
            {{ t('settings_uxelm_return_slots') }}
          </Button>
        </div>

        <!-- Developer Options -->
        <div class="settings-card">
          <h3>{{ t('settings_uxelm_dev_options') }}</h3>
          <p class="card-desc">{{ t('settings_uxelm_dev_cheat_desc') }}</p>
          <div class="dev-actions">
            <Button
              variant="primary"
              class="full-width-btn cheat-btn"
              :disabled="cheatActivated"
              @click="activateDevCheat"
            >
              <span class="btn-icon">⚡</span>
              {{ cheatActivated ? '✅ Done!' : t('settings_uxelm_dev_cheat') }}
            </Button>
            <Button
              variant="secondary"
              class="full-width-btn"
              @click="openMagicSimulator"
            >
              <span class="btn-icon">🔮</span>
              {{ t('settings_uxelm_magic_simulator') }}
            </Button>
          </div>
          <p class="card-desc simulator-desc">{{ t('settings_uxelm_magic_simulator_desc') }}</p>
        </div>
      </div>

      <!-- Right Column -->
      <div class="settings-column">
        <!-- About -->
        <div class="settings-card about-card">
          <h3>{{ t('settings_uxelm_about') }}</h3>
          <div class="about-content">
            <p class="about-title">RPG Village</p>
            <p class="about-version">{{ t('settings_uxelm_version') }}: 1.0.0-beta</p>
            <p class="about-built">{{ t('settings_uxelm_built_with') }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Danger Zone -->
    <div class="settings-card danger-zone">
      <h3>{{ t('settings_uxelm_danger_zone') }}</h3>
      <p class="card-desc">{{ t('settings_uxelm_danger_desc') }}</p>
      <div class="danger-actions">
        <Button variant="danger" class="danger-btn" @click="confirmWipeSlot">
          {{ t('settings_uxelm_wipe_slot') }}
        </Button>
        <Button variant="danger" class="danger-btn" @click="confirmWipeAll">
          {{ t('settings_uxelm_wipe_all') }}
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
  padding: var(--spacing-lg);
  color: var(--text-primary);
}

.settings-page h1 {
  margin: 0 0 var(--spacing-lg);
  font-family: var(--font-heading);
  font-size: 1.5rem;
}

.settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.settings-column {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.settings-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
}

.settings-card h3 {
  margin: 0;
  font-size: 1rem;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.card-desc {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-secondary);
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

.full-width-btn {
  width: 100%;
  justify-content: center;
}

.btn-icon {
  margin-right: 6px;
}

.dev-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.cheat-btn {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  border: none;
}

.simulator-desc {
  font-size: 0.8rem;
  color: var(--text-muted);
  font-style: italic;
}

.about-card {
  height: fit-content;
}

.about-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.about-title {
  margin: 0;
  font-weight: 700;
  font-size: 1rem;
  color: var(--text-primary);
}

.about-version {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.about-built {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.danger-zone {
  border-color: rgba(239, 68, 68, 0.3);
}

.danger-zone h3 {
  color: var(--color-danger);
}

.danger-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.danger-btn {
  min-width: 160px;
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

@media (max-width: 768px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
}
</style>
