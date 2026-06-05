<template>
  <FullViewOverlay @close="onClose">
    <template #icon>\u{1F52E}</template>
    <template #title>{{ t('magic_circle_uxelm_title') }}</template>

    <div
      class="magic-circle-editor"
      :class="[
        isSupport ? 'mode-support' : '',
        spell?.element ? `el-active-${spell.element}` : ''
      ]"
    >
      <!-- Top Margin -->
      <div class="mc-top-margin mc-margin-bar">
        <div class="mc-top-left">
          <h2 class="mc-title">
            <span class="mc-title-icon">\u{1F52E}</span>
            <span>{{ t('magic_circle_uxelm_title') }}</span>
          </h2>
          <span class="mc-hero-badge">
            {{ hero.name }} · Tier {{ magicTier }} ({{ maxSlots }} slots)
          </span>
        </div>
        <div class="mc-top-right">
          <span class="mc-power-stat" :class="{ 'val-heal': isSupport }">
            {{ t(powerDisplay.labelKey, { value: powerDisplay.value }) }}
          </span>
          <span class="mc-mp-cost">
            {{ mpCost }} {{ t('shared_uxelm_mp') }}
          </span>
          <div class="mc-budget-container">
            <div class="mc-budget-track">
              <div
                class="mc-budget-fill"
                :style="{
                  width: `${Math.min(100, budget.ratio * 100)}%`,
                  backgroundColor: budget.color,
                  boxShadow: `0 0 8px ${budget.color}`
                }"
              />
            </div>
            <div class="mc-budget-label" :style="{ color: budget.color }">
              {{ t(budget.labelKey) }} ({{ mpCost }} / {{ maxMp }} {{ t('shared_uxelm_mp') }})
            </div>
          </div>
        </div>
      </div>

      <!-- Left Margin -->
      <div class="mc-left-margin mc-margin-bar">
        <div class="mc-polarity-indicator">
          <span class="mc-polarity-icon">{{ isSupport ? '\u{1F49A}' : '\u{2694}' }}</span>
          <span class="mc-polarity-text">
            {{ isSupport ? t('magic_circle_info_polarity_ally') : t('magic_circle_info_polarity_foe') }}
          </span>
        </div>
      </div>

      <!-- Right Margin -->
      <div class="mc-right-margin mc-margin-bar">
        <div class="mc-count-indicator" :class="{ 'all-active': targetInfo.count === 'all' }">
          <span class="mc-count-icon">{{ targetInfo.count === 'all' ? '\u{1F465}' : '\u{1F464}' }}</span>
          <span class="mc-count-text">
            {{ targetInfo.count === 'all' ? t('magic_circle_info_target_all') : t('magic_circle_info_target_one') }}
          </span>
        </div>
      </div>

      <!-- Center: Mandala -->
      <div class="mc-center-container">
        <MandalaGrid
          :max-slots="maxSlots"
          :focused-slot-index="focusedSlotIndex"
          :composition="composition"
          @focus="toggleFocus"
        />
      </div>

      <!-- Drawer: Glyph Palette -->
      <div
        v-if="focusedSlotIndex !== null"
        class="mc-focused-drawer"
      >
        <GlyphPalette
          :focused-slot-index="focusedSlotIndex"
          :available-glyphs="availableGlyphs"
          :glyph-mastery="glyphMastery"
          :composition="composition"
          :selected-tiers="selectedTiers"
          @select="handlePlaceGlyph"
          @remove="handleRemoveGlyph"
          @set-tier="handleSetTier"
          @unfocus="focusedSlotIndex = null"
        />
      </div>

      <McActionPanel
        :spell="spell"
        :effect-chips="effectChips"
        v-model:custom-name="customName"
        :can-inscribe="canInscribe"
        @inscribe="handleInscribe"
        @clear="clearComposition"
        @close="onClose"
      />
    </div>
  </FullViewOverlay>
</template>

<script setup>
import { computed, toRef } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import { inject } from 'vue'
import FullViewOverlay from '@/components/FullViewOverlay.vue'
import Button from '@/components/Button.vue'
import MandalaGrid from './components/MandalaGrid.vue'
import GlyphPalette from './components/GlyphPalette.vue'
import McActionPanel from './components/McActionPanel.vue'
import { useMagicCircle } from './composables/useMagicCircle.js'

const props = defineProps({
  hero: { type: Object, required: true },
  isSimulator: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'inscribe'])

const { t } = useI18n()
const engine = inject('engine')
const gameState = inject('gameState')

const heroRef = toRef(props, 'hero')

const {
  composition,
  selectedTiers,
  focusedSlotIndex,
  customName,
  magicTier,
  maxMp,
  maxSlots,
  availableGlyphs,
  glyphMastery,
  spell,
  mpCost,
  budget,
  targetInfo,
  isSupport,
  powerDisplay,
  effectChips,
  placeGlyph,
  removeGlyph,
  clearComposition,
  setTier
} = useMagicCircle(heroRef, props.isSimulator)

const canInscribe = computed(() => {
  if (composition.value.length === 0) return false
  if (budget.value.isOverBudget) return false
  if (props.isSimulator) return false
  return true
})

function toggleFocus(slotIndex) {
  focusedSlotIndex.value = focusedSlotIndex.value === slotIndex ? null : slotIndex
}

function handlePlaceGlyph({ slotIndex, glyphId }) {
  placeGlyph(slotIndex, glyphId)
}

function handleRemoveGlyph(slotIndex) {
  removeGlyph(slotIndex)
  focusedSlotIndex.value = null
}

function handleSetTier({ glyphId, tier }) {
  setTier(glyphId, tier)
}

function handleInscribe() {
  if (!canInscribe.value) return
  const glyphIds = composition.value.map((c) => c.glyphId)
  const glyphTiers = {}
  for (const c of composition.value) {
    glyphTiers[c.glyphId] = selectedTiers.value[c.glyphId] || glyphMastery.value[c.glyphId]?.tier || 1
  }

  if (props.isSimulator) {
    // In simulator mode, just close without inscribing
    onClose()
    return
  }

  emit('inscribe', { glyphIds, glyphTiers, name: customName.value || null })
  onClose()
}

function onClose() {
  clearComposition()
  emit('close')
}
</script>

<style scoped>
.magic-circle-editor {
  display: grid;
  grid-template-columns: 60px 1fr 60px;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "top    top    top"
    "left   center right"
    "bottom bottom bottom";
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  height: 100%;
  box-sizing: border-box;
}

/* Element theme classes */
.magic-circle-editor.el-active-fire { --el-color: #ef4444; }
.magic-circle-editor.el-active-water { --el-color: #3b82f6; }
.magic-circle-editor.el-active-wind { --el-color: #10b981; }
.magic-circle-editor.el-active-storm { --el-color: #f59e0b; }
.magic-circle-editor.el-active-light { --el-color: #fbbf24; }
.magic-circle-editor.el-active-dark { --el-color: #a855f7; }
.magic-circle-editor.el-active-earth { --el-color: #84cc16; }

.mc-margin-bar {
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-sm) var(--spacing-md);
}

.mc-top-margin {
  grid-area: top;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mc-top-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mc-title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 1.25rem;
  color: var(--text-primary);
}

.mc-title-icon {
  margin-right: var(--spacing-xs);
}

.mc-hero-badge {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.mc-top-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.mc-power-stat {
  font-size: 0.9rem;
  color: var(--color-primary-light);
  font-weight: 600;
}

.mc-power-stat.val-heal {
  color: #22c55e;
}

.mc-mp-cost {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.mc-budget-container {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  min-width: 140px;
}

.mc-budget-track {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.mc-budget-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease, background-color 0.3s ease;
}

.mc-budget-label {
  font-size: 0.7rem;
  font-weight: 600;
}

.mc-left-margin {
  grid-area: left;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mc-polarity-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  writing-mode: vertical-rl;
  text-orientation: mixed;
}

.mc-polarity-icon {
  font-size: 1.2rem;
}

.mc-polarity-text {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.mc-right-margin {
  grid-area: right;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mc-count-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  writing-mode: vertical-rl;
  text-orientation: mixed;
}

.mc-count-indicator.all-active {
  color: var(--color-primary-light);
}

.mc-count-icon {
  font-size: 1.2rem;
}

.mc-count-text {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.mc-center-container {
  grid-area: center;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.mc-focused-drawer {
  position: absolute;
  right: var(--spacing-lg);
  top: 80px;
  bottom: 80px;
  z-index: 10;
  max-width: 320px;
}

@media (max-width: 768px) {
  .magic-circle-editor {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto 1fr auto auto;
    grid-template-areas:
      "top"
      "left"
      "center"
      "right"
      "bottom";
  }

  .mc-focused-drawer {
    position: static;
    max-width: 100%;
    margin-top: var(--spacing-md);
  }

  .mc-left-margin,
  .mc-right-margin {
    flex-direction: row;
    writing-mode: horizontal-tb;
  }

}
</style>
