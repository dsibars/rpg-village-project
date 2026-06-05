<template>
  <div class="glyph-palette">
    <div class="palette-header">
      <h3 class="palette-title">
        {{ focusedSlotIndex !== null ? t('magic_circle_uxelm_slot_title', { slot: focusedSlotIndex + 1 }) : t('magic_circle_uxelm_palette_title') }}
      </h3>
      <button v-if="focusedSlotIndex !== null" class="close-btn" @click="$emit('unfocus')">
        \u{2715}
      </button>
    </div>

    <div v-if="focusedSlotIndex === null" class="empty-state">
      {{ t('magic_circle_uxelm_slot_empty') }}
    </div>

    <template v-else>
      <div class="palette-grid">
        <button
          v-for="glyph in availableGlyphs"
          :key="glyph.id"
          class="palette-card"
          :class="{ selected: selectedGlyphId === glyph.id, core: glyph.type === 'core' }"
          @click="selectGlyph(glyph.id)"
        >
          <span class="card-icon">{{ getGlyphIcon(glyph) }}</span>
          <span class="card-name">{{ glyphName(glyph.id) }}</span>
          <span v-if="glyph.type === 'core'" class="card-element">{{ glyph.element }}</span>
        </button>
      </div>

      <div v-if="selectedGlyph" class="glyph-info">
        <div class="info-header">
          <span class="info-title">{{ glyphName(selectedGlyph.id) }}</span>
          <span class="info-type">{{ selectedGlyph.type }}</span>
        </div>
        <p class="info-desc">{{ getGlyphDescription(selectedGlyph, activeTier) }}</p>

        <div v-if="!isStaticGlyph(selectedGlyph)" class="tier-section">
          <div class="tier-label">
            <span>{{ t('magic_circle_uxelm_dial_prompt') }}</span>
            <span class="tier-value">{{ activeTier }}</span>
          </div>
          <div class="tier-dial">
            <button
              v-for="t in maxTierForSelected"
              :key="t"
              class="tier-tick"
              :class="{ active: activeTier === t }"
              @click="setActiveTier(t)"
            >
              {{ t }}
            </button>
          </div>
        </div>
      </div>

      <div class="palette-actions">
        <Button
          v-if="hasGlyphInFocusedSlot"
          variant="danger"
          size="sm"
          @click="$emit('remove', focusedSlotIndex)"
        >
          {{ t('shared_uxelm_remove') }}
        </Button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import Button from '@/components/Button.vue'
import {
  getGlyphIcon,
  isStaticGlyph,
  getMaxSelectableTier,
  getGlyphDescription
} from '../composables/useMagicCircle.js'
import { GLYPH_DATA } from '../../../../js/engine/shared/data/MagicCircleData.js'

const props = defineProps({
  focusedSlotIndex: { type: Number, default: null },
  availableGlyphs: { type: Array, default: () => [] },
  glyphMastery: { type: Object, default: () => ({}) },
  composition: { type: Array, default: () => [] },
  selectedTiers: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['select', 'remove', 'setTier', 'unfocus'])

const { t } = useI18n()

const selectedGlyphId = ref(null)

watch(
  () => props.focusedSlotIndex,
  () => {
    selectedGlyphId.value = null
  }
)

const hasGlyphInFocusedSlot = computed(() =>
  props.composition.some((c) => c.slotIndex === props.focusedSlotIndex)
)

const selectedGlyph = computed(() => {
  if (!selectedGlyphId.value) return null
  return GLYPH_DATA[selectedGlyphId.value]
})

const activeTier = computed(() => {
  if (!selectedGlyphId.value) return 1
  return props.selectedTiers[selectedGlyphId.value] || props.glyphMastery[selectedGlyphId.value]?.tier || 1
})

const maxTierForSelected = computed(() => {
  if (!selectedGlyph.value) return 1
  const mastered = props.glyphMastery[selectedGlyphId.value]?.tier || 1
  return getMaxSelectableTier(selectedGlyph.value, mastered)
})

function glyphName(id) {
  return t('magic_circle_info_' + id)
}

function selectGlyph(glyphId) {
  selectedGlyphId.value = glyphId
  emit('select', { slotIndex: props.focusedSlotIndex, glyphId })
}

function setActiveTier(tier) {
  if (!selectedGlyphId.value) return
  emit('setTier', { glyphId: selectedGlyphId.value, tier })
}
</script>

<style scoped>
.glyph-palette {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  min-width: 280px;
  max-height: 100%;
  overflow-y: auto;
}

.palette-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.palette-title {
  margin: 0;
  font-size: 1rem;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 1rem;
  padding: 4px;
}

.close-btn:hover {
  color: var(--text-primary);
}

.empty-state {
  text-align: center;
  padding: var(--spacing-lg);
  color: var(--text-muted);
  font-style: italic;
  font-size: 0.85rem;
}

.palette-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
  gap: var(--spacing-xs);
}

.palette-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: var(--spacing-sm);
  background: var(--bg-base);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-family: var(--font-body);
  color: var(--text-primary);
  transition: all 0.15s ease;
}

.palette-card:hover {
  border-color: var(--color-primary-light);
}

.palette-card.selected {
  border-color: var(--color-primary);
  background: rgba(99, 102, 241, 0.12);
}

.palette-card.core {
  border-color: rgba(234, 179, 8, 0.3);
}

.palette-card.core.selected {
  border-color: #fbbf24;
  background: rgba(251, 191, 36, 0.12);
}

.card-icon {
  font-size: 1.1rem;
}

.card-name {
  font-size: 0.65rem;
  color: var(--text-secondary);
  text-align: center;
}

.card-element {
  font-size: 0.6rem;
  color: var(--text-muted);
  text-transform: capitalize;
}

.glyph-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: var(--bg-base);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-title {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.info-type {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: capitalize;
}

.info-desc {
  margin: 0;
  font-size: 0.8rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

.tier-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.tier-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: var(--text-primary);
}

.tier-value {
  font-weight: 700;
  color: var(--color-primary-light);
}

.tier-dial {
  display: flex;
  gap: 4px;
}

.tier-tick {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid var(--glass-border);
  background: var(--bg-card);
  color: var(--text-secondary);
  cursor: pointer;
  font-family: var(--font-body);
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tier-tick:hover {
  border-color: var(--color-primary-light);
  color: var(--text-primary);
}

.tier-tick.active {
  border-color: var(--color-primary);
  background: rgba(99, 102, 241, 0.2);
  color: var(--color-primary-light);
}

.palette-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: auto;
}
</style>
