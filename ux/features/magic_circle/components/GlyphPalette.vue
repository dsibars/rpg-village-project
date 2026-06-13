<template>
  <div class="glyph-palette">
    <div class="palette-header">
      <h3 class="palette-title">
        {{ drawerTitle }}
      </h3>
      <button class="close-btn" @click="$emit('unfocus')">
        ✕
      </button>
    </div>

    <div class="drawer-content">
      <div class="mc-palette-title">
        {{ t('magic_circle_uxelm_slot_select_prompt') }}
      </div>

      <div class="mc-palette-grid">
        <button
          v-for="glyph in filteredGlyphs"
          :key="glyph.id"
          class="mc-palette-card"
          :class="{
            selected: activeGlyphId === glyph.id,
            'already-used': isPlacedElsewhere(glyph.id)
          }"
          :data-glyph="glyph.id"
          :title="t('magic_circle_info_' + glyph.id)"
          @click="selectGlyph(glyph.id)"
        >
          <span class="mc-palette-icon">{{ getGlyphIcon(glyph) }}</span>
          <span class="mc-palette-abb">
            {{ getGlyphAbbreviation(glyph) || glyph.id.replace('glyph_', '').slice(0, 3).toUpperCase() }}
          </span>
        </button>
      </div>

      <template v-if="activeGlyph">
        <div class="mc-selected-glyph-info">
          <div class="mc-info-header">
            <span class="mc-info-title">
              {{ t('magic_circle_info_' + activeGlyph.id) }} {{ activeGlyphSymbol }}
            </span>
            <span class="mc-info-type" :class="activeGlyph.type">
              {{ activeGlyph.type }}
            </span>
          </div>
          <div class="mc-info-description">
            {{ getGlyphDescription(activeGlyph, activeTier) }}
          </div>

          <div class="mc-tuning-section">
            <div class="mc-tuning-label-container">
              <span class="mc-tuning-title">{{ t('magic_circle_uxelm_dial_prompt') }}</span>
              <span class="mc-tuning-value">
                T{{ activeTier }} ({{ activeGlyphSymbol }})
                <span v-if="isStaticGlyph(activeGlyph)" class="static-lock" :title="t('magic_circle_info_glyph_static_tooltip')">🔒</span>
              </span>
            </div>
            <div class="mc-tuning-dial">
              <div class="mc-dial-ticks">
                <button
                  v-for="t in maxTier"
                  :key="t"
                  class="mc-dial-tick"
                  :class="{ active: activeTier === t, locked: t > maxTier }"
                  :disabled="t > maxTier"
                  @click="setActiveTier(t)"
                >
                  {{ getTierSymbol(t) }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>

      <div v-else class="empty-state">
        {{ t('magic_circle_uxelm_slot_empty') }}
      </div>
    </div>

    <div class="mc-drawer-actions">
      <button
        v-if="activeGlyphId"
        class="mc-btn mc-btn-danger"
        @click="$emit('remove', focusedSlotIndex)"
      >
        {{ t('magic_circle_uxelm_slot_remove_prompt') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import { useAdapter } from '@/core/composables/useAdapter.js'
import {
  getGlyphIcon,
  getGlyphAbbreviation,
  isStaticGlyph,
  getMaxSelectableTier,
  getGlyphDescription
} from '../composables/useMagicCircle.js'
import { GLYPH_DATA } from '@/core/data/index.js'

const props = defineProps({
  focusedSlotIndex: { type: Number, default: null },
  availableGlyphs: { type: Array, default: () => [] },
  glyphMastery: { type: Object, default: () => ({}) },
  composition: { type: Array, default: () => [] },
  selectedTiers: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['select', 'remove', 'setTier', 'unfocus'])

const { t } = useI18n()
const { dispatch } = useAdapter()

const isCoreSlot = computed(() => props.focusedSlotIndex === 0)

const drawerTitle = computed(() => {
  if (props.focusedSlotIndex === null) return ''
  if (props.focusedSlotIndex === 0) {
    return t('magic_circle_uxelm_drawer_title_core')
  }
  return t('magic_circle_uxelm_drawer_title', { slot: props.focusedSlotIndex })
})

const filteredGlyphs = computed(() => {
  return props.availableGlyphs.filter((g) => {
    return isCoreSlot.value ? g.type === 'core' : g.type !== 'core'
  })
})

const activeSlotComp = computed(() => {
  if (props.focusedSlotIndex === null) return null
  return props.composition.find((c) => c.slotIndex === props.focusedSlotIndex)
})

const activeGlyphId = computed(() => {
  return activeSlotComp.value ? activeSlotComp.value.glyphId : null
})

const activeGlyph = computed(() => {
  if (!activeGlyphId.value) return null
  return GLYPH_DATA[activeGlyphId.value]
})

const activeTier = computed(() => {
  if (!activeGlyphId.value) return 1
  return props.selectedTiers[activeGlyphId.value] || props.glyphMastery[activeGlyphId.value]?.tier || 1
})

const maxTier = computed(() => {
  if (!activeGlyph.value) return 1
  const mastered = props.glyphMastery[activeGlyphId.value]?.tier || 1
  return getMaxSelectableTier(activeGlyph.value, mastered)
})

const activeGlyphSymbol = computed(() => {
  const result = dispatch('magic', 'getGlyphSymbol', { tier: activeTier.value })
  return result.success ? result.data : '+'
})

function isPlacedElsewhere(glyphId) {
  return props.composition.some((c) => c.glyphId === glyphId && c.slotIndex !== props.focusedSlotIndex)
}

function selectGlyph(glyphId) {
  emit('select', { slotIndex: props.focusedSlotIndex, glyphId })
}

function setActiveTier(tier) {
  if (!activeGlyphId.value) return
  emit('setTier', { glyphId: activeGlyphId.value, tier })
}

function getTierSymbol(tier) {
  const result = dispatch('magic', 'getGlyphSymbol', { tier })
  return result.success ? result.data : String(tier)
}
</script>

<style scoped>
.glyph-palette {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: rgba(13, 19, 14, 0.96);
}

.palette-header {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.palette-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #ffffff;
  letter-spacing: 0.01em;
}

.close-btn {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;
}

.close-btn:hover {
  color: #ffffff;
}

.drawer-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.drawer-content::-webkit-scrollbar {
  width: 6px;
}
.drawer-content::-webkit-scrollbar-track {
  background: transparent;
}
.drawer-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}
.drawer-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

.mc-palette-title {
  font-size: 0.7rem;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #64748b;
}

.mc-palette-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.mc-palette-card {
  aspect-ratio: 1;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  padding: 6px;
  color: #e2e8f0;
}

.mc-palette-card:hover {
  background: rgba(255, 255, 255, 0.07);
  border-color: rgba(255, 255, 255, 0.25);
  transform: translateY(-1px);
}

.mc-palette-card.selected {
  background: rgba(245, 158, 11, 0.15);
  border-color: #f59e0b;
  box-shadow: 0 0 10px rgba(245, 158, 11, 0.25);
}

.mc-palette-card.already-used::after {
  content: '✓';
  position: absolute;
  top: 2px;
  right: 4px;
  font-size: 0.6rem;
  font-weight: bold;
  color: #10b981;
}

.mc-palette-icon {
  font-size: 1.2rem;
  margin-bottom: 2px;
}

.mc-palette-abb {
  font-size: 0.55rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #94a3b8;
  text-align: center;
  line-height: 1.1;
}

.mc-palette-card.selected .mc-palette-abb {
  color: #fef08a;
}

.empty-state {
  text-align: center;
  padding: 24px;
  color: #64748b;
  font-style: italic;
  font-size: 0.85rem;
}

.mc-selected-glyph-info {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mc-info-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.mc-info-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #ffffff;
}

.mc-info-type {
  font-size: 0.65rem;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.05em;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.08);
  color: #94a3b8;
}

.mc-info-type.core { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
.mc-info-type.power { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
.mc-info-type.effect { background: rgba(16, 185, 129, 0.15); color: #34d399; }
.mc-info-type.efficiency { background: rgba(74, 222, 128, 0.15); color: #86efac; }

.mc-info-description {
  font-size: 0.78rem;
  line-height: 1.4;
  color: #94a3b8;
}

.mc-tuning-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 16px;
}

.mc-tuning-label-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mc-tuning-title {
  font-size: 0.72rem;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: #64748b;
}

.mc-tuning-value {
  font-size: 0.85rem;
  font-weight: 700;
  color: #fbbf24;
  display: flex;
  align-items: center;
  gap: 4px;
}

.static-lock {
  font-size: 0.75rem;
  color: #64748b;
}

.mc-tuning-dial {
  position: relative;
  height: 54px;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 27px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  overflow: hidden;
}

.mc-tuning-dial::after {
  content: '';
  position: absolute;
  left: 30px;
  right: 30px;
  height: 2px;
  background: rgba(255, 255, 255, 0.08);
  top: 50%;
  transform: translateY(-50%);
  z-index: 1;
}

.mc-dial-ticks {
  display: flex;
  width: 100%;
  justify-content: space-between;
  position: relative;
  z-index: 2;
}

.mc-dial-tick {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #0f0f13;
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  font-weight: 700;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  z-index: 3;
}

.mc-dial-tick:hover:not(.locked) {
  border-color: rgba(255, 255, 255, 0.3);
  color: #e2e8f0;
}

.mc-dial-tick.active {
  background: #fbbf24;
  border-color: #fbbf24;
  color: #07070a;
  box-shadow: 0 0 12px rgba(251, 191, 36, 0.5);
  transform: scale(1.15);
}

.mc-dial-tick.locked {
  opacity: 0.2;
  cursor: not-allowed;
}

.mc-drawer-actions {
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}

.mc-btn {
  padding: 9px 18px;
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  font-family: inherit;
}

.mc-btn-danger {
  background: rgba(239, 68, 68, 0.08);
  border-color: rgba(239, 68, 68, 0.2);
  color: #f87171;
  width: 100%;
}

.mc-btn-danger:hover {
  background: #ef4444;
  border-color: #ef4444;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
}
</style>
