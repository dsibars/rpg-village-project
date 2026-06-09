<template>
  <FullViewOverlay @close="onClose">
    <template #icon>🔮</template>
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
            <span class="mc-title-icon">🔮</span>
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
          <span class="mc-polarity-icon">{{ isSupport ? '💚' : '⚔️' }}</span>
          <span class="mc-polarity-text">
            {{ isSupport ? t('magic_circle_info_polarity_ally') : t('magic_circle_info_polarity_foe') }}
          </span>
        </div>
      </div>

      <!-- Right Margin -->
      <div class="mc-right-margin mc-margin-bar">
        <div class="mc-count-indicator" :class="{ 'all-active': targetInfo.count === 'all' }">
          <span class="mc-count-icon">{{ targetInfo.count === 'all' ? '👥' : '👤' }}</span>
          <span class="mc-count-text">
            {{ targetInfo.count === 'all' ? t('magic_circle_info_target_all') : t('magic_circle_info_target_one') }}
          </span>
        </div>
      </div>

      <!-- Center: Mandala -->
      <div class="mc-center-container" :class="{ 'drawer-open': focusedSlotIndex !== null }">
        <MandalaGrid
          :max-slots="maxSlots"
          :focused-slot-index="focusedSlotIndex"
          :composition="composition"
          :spell-element="spell?.element || null"
          :selected-tiers="selectedTiers"
          :glyph-mastery="glyphMastery"
          @focus="toggleFocus"
        />
      </div>

      <!-- Drawer: Glyph Palette -->
      <div
        :class="['mc-focused-drawer', { open: focusedSlotIndex !== null }]"
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
        :is-support="isSupport"
        :is-simulator="isSimulator"
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
  grid-template-columns: 80px 1fr 80px;
  grid-template-rows: 60px 1fr 80px;
  grid-template-areas:
    "top    top    top"
    "left   center right"
    "bottom bottom bottom";
  gap: 0;
  height: 100%;
  box-sizing: border-box;
  position: relative;
  background: radial-gradient(circle at center, #0f0f18 0%, #050508 100%),
              linear-gradient(90deg, rgba(239, 68, 68, 0.05) 0%, transparent 40%);
  background-blend-mode: screen;
  color: #e2e8f0;
  overflow: hidden;
}

.magic-circle-editor.mode-support {
  background: radial-gradient(circle at center, #0a0e14 0%, #040609 100%),
              linear-gradient(90deg, rgba(16, 185, 129, 0.06) 0%, transparent 40%);
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
  background: rgba(10, 10, 15, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.mc-top-margin {
  grid-area: top;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  z-index: 10;
}

.mc-top-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mc-title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 1.15rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #ffffff;
}

.mc-title-icon {
  margin-right: var(--spacing-xs);
}

.mc-hero-badge {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  color: #cbd5e1;
}

.mc-top-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.mc-power-stat {
  font-size: 0.95rem;
  font-weight: 600;
  color: #ffffff;
}

.mc-power-stat.val-heal {
  color: #34d399;
}

.mc-mp-cost {
  font-size: 0.95rem;
  font-weight: 600;
  color: #60a5fa;
}

.mc-budget-container {
  display: flex;
  flex-direction: column;
  width: 140px;
  gap: 4px;
}

.mc-budget-track {
  height: 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 3px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.mc-budget-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease, background-color 0.3s ease;
}

.mc-budget-label {
  font-size: 0.65rem;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-align: right;
}

.mc-left-margin {
  grid-area: left;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  z-index: 10;
}

.mc-polarity-indicator {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16px;
  writing-mode: vertical-lr;
  transform: rotate(180deg);
  font-weight: 800;
  font-size: 1.25rem;
  letter-spacing: 0.25em;
  transition: color 0.3s ease;
  color: #ef4444;
}

.magic-circle-editor.mode-support .mc-polarity-indicator {
  color: #10b981;
}

.mc-polarity-icon {
  transform: rotate(90deg);
  font-size: 1.4rem;
}

.mc-polarity-text {
  font-size: 0.85rem;
}

.mc-right-margin {
  grid-area: right;
  display: flex;
  align-items: center;
  justify-content: center;
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  z-index: 10;
}

.mc-count-indicator {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16px;
  writing-mode: vertical-lr;
  font-weight: 800;
  font-size: 1.25rem;
  letter-spacing: 0.25em;
  color: #94a3b8;
  transition: color 0.3s ease;
}

.mc-count-indicator.all-active {
  color: #ffffff;
}

.mc-count-icon {
  font-size: 1.4rem;
}

.mc-count-text {
  font-size: 0.85rem;
}

.mc-center-container {
  grid-area: center;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  transition: right 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.mc-center-container.drawer-open {
  right: 360px;
}

.mc-focused-drawer {
  position: absolute;
  top: 60px;
  right: 0;
  bottom: 80px;
  width: 360px;
  background: rgba(7, 7, 10, 0.96);
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  z-index: 15;
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: -10px 0 30px rgba(0, 0, 0, 0.5);
}

.mc-focused-drawer.open {
  transform: translateX(0);
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
    width: 100%;
    top: auto;
    left: 0;
    right: 0;
    bottom: 0;
    height: 60vh;
    transform: translateY(100%);
  }

  .mc-focused-drawer.open {
    transform: translateY(0);
  }

  .mc-left-margin,
  .mc-right-margin {
    flex-direction: row;
    writing-mode: horizontal-tb;
  }

  .mc-polarity-indicator,
  .mc-count-indicator {
    writing-mode: horizontal-tb;
    transform: none;
  }
}
</style>
