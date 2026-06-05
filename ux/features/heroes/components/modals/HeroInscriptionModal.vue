<template>
  <ModalFrame
    v-if="open"
    :title="`${t('heroes_uxelm_inscription_title')} — ${hero.name}`"
    @close="$emit('close')"
  >
    <div class="inscription-modal">
      <p class="modal-subtitle">{{ t('heroes_uxelm_inscription_desc') }}</p>

      <div v-if="isInscribing" class="pending-banner">
        \u{23F3}
        {{ t('heroes_uxelm_inscription_pending') }}:
        {{ hero.bodyInscriptionDaysRemaining }}
        {{ t('heroes_uxelm_inscription_days_remaining') }}
      </div>

      <div class="selected-glyphs">
        <div class="section-header">
          <span>{{ t('heroes_uxelm_inscription_slots') }}: {{ selectedIds.length }} / 7</span>
          <Button
            v-if="selectedIds.length && !isInscribing"
            variant="ghost"
            size="sm"
            @click="selectedIds = []"
          >
            {{ t('shared_uxelm_clear') }}
          </Button>
        </div>
        <div v-if="selectedIds.length === 0" class="empty-glyphs">
          {{ t('heroes_uxelm_inscription_empty') }}
        </div>
        <div v-else class="glyph-chips">
          <span
            v-for="id in selectedIds"
            :key="id"
            class="glyph-chip"
            :class="glyphById(id)?.type"
            @click="removeGlyph(id)"
          >
            {{ glyphElementIcon(glyphById(id)?.element) }}
            {{ glyphName(id) }}
            <span class="tier">{{ glyphTierSymbol(id) }}</span>
            <span class="remove">\u{2715}</span>
          </span>
        </div>
      </div>

      <div v-if="!isInscribing" class="glyph-picker">
        <div class="section-header">Available Glyphs</div>
        <div v-if="knownGlyphsList.length === 0" class="empty-glyphs">
          {{ t('heroes_uxelm_inscription_not_learned') }}
        </div>
        <div v-else class="glyph-grid">
          <button
            v-for="glyph in knownGlyphsList"
            :key="glyph.id"
            class="glyph-option"
            :class="[glyph.type, { selected: selectedIds.includes(glyph.id), disabled: isFull && !selectedIds.includes(glyph.id) }]"
            :disabled="(isFull && !selectedIds.includes(glyph.id)) || hero.activity !== 'idle'"
            @click="toggleGlyph(glyph.id)"
          >
            <span class="glyph-icon">{{ glyphElementIcon(glyph.element) }}</span>
            <span class="glyph-name">{{ glyphName(glyph.id) }}</span>
            <span class="glyph-tier">{{ glyphTierSymbol(glyph.id) }}</span>
          </button>
        </div>
      </div>

      <div class="inscription-actions">
        <Button
          v-if="!isInscribing"
          variant="primary"
          :disabled="!canInscribe"
          @click="confirmInscribe"
        >
          {{ t('heroes_uxelm_inscription_learn') }}
        </Button>
      </div>
    </div>
  </ModalFrame>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import { GLYPH_DATA, GLYPH_TIER_QUALITY } from '@/core/data/index.js'
import ModalFrame from '@/components/ModalFrame.vue'
import Button from '@/components/Button.vue'

const props = defineProps({
  hero: { type: Object, required: true },
  open: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'inscribe'])

const { t } = useI18n()

const selectedIds = ref([])

const isInscribing = computed(() => (props.hero.bodyInscriptionDaysRemaining || 0) > 0)
const isFull = computed(() => selectedIds.value.length >= 7)
const canInscribe = computed(() =>
  selectedIds.value.length === 7 &&
  props.hero.activity === 'idle' &&
  !isInscribing.value
)

const knownGlyphsList = computed(() => {
  const known = new Set(props.hero.knownGlyphs || [])
  return Object.values(GLYPH_DATA).filter((g) => known.has(g.id))
})

function glyphById(id) {
  return GLYPH_DATA[id]
}

function glyphName(id) {
  return t('magic_circle_info_' + id)
}

function glyphTierSymbol(id) {
  const tier = props.hero.glyphMastery?.[id]?.tier || 1
  return GLYPH_TIER_QUALITY[Math.min(6, tier - 1)]?.symbol || '+'
}

function glyphElementIcon(element) {
  const map = {
    fire: '\u{1F525}',
    water: '\u{1F4A7}',
    wind: '\u{1F343}',
    storm: '\u{26A1}',
    light: '\u{2600}',
    dark: '\u{1F311}',
    earth: '\u{1FAA8}'
  }
  return map[element] || ''
}

function toggleGlyph(id) {
  const idx = selectedIds.value.indexOf(id)
  if (idx >= 0) {
    selectedIds.value.splice(idx, 1)
  } else if (!isFull.value) {
    selectedIds.value.push(id)
  }
}

function removeGlyph(id) {
  const idx = selectedIds.value.indexOf(id)
  if (idx >= 0) selectedIds.value.splice(idx, 1)
}

function confirmInscribe() {
  if (!canInscribe.value) return
  const glyphTiers = {}
  selectedIds.value.forEach((id) => {
    glyphTiers[id] = props.hero.glyphMastery?.[id]?.tier || 1
  })
  emit('inscribe', { glyphIds: [...selectedIds.value], glyphTiers })
  selectedIds.value = []
}
</script>

<style scoped>
.inscription-modal { display: flex; flex-direction: column; gap: var(--spacing-md); min-height: 320px; }
.modal-subtitle { margin: 0; font-size: 0.875rem; color: var(--text-secondary); }
.pending-banner { padding: var(--spacing-sm) var(--spacing-md); background: rgba(234,179,8,0.12); border: 1px solid rgba(234,179,8,0.3); border-radius: var(--radius-md); color: #ffc107; font-size: 0.875rem; }
.selected-glyphs { display: flex; flex-direction: column; gap: var(--spacing-sm); }
.section-header { display: flex; justify-content: space-between; align-items: center; font-weight: 600; color: var(--text-primary); }
.empty-glyphs { color: var(--text-muted); font-size: 0.875rem; font-style: italic; }
.glyph-chips { display: flex; flex-wrap: wrap; gap: var(--spacing-xs); }
.glyph-chip { display: inline-flex; align-items: center; gap: 4px; padding: var(--spacing-xs) var(--spacing-sm); background: var(--bg-card); border: 1px solid var(--glass-border); border-radius: var(--radius-md); font-size: 0.875rem; color: var(--text-primary); cursor: pointer; }
.glyph-chip:hover { border-color: var(--color-danger); }
.glyph-chip .tier { color: var(--color-primary-light); font-size: 0.75rem; }
.glyph-chip .remove { color: var(--text-muted); margin-left: 2px; }
.glyph-picker { display: flex; flex-direction: column; gap: var(--spacing-sm); }
.glyph-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: var(--spacing-xs); }
.glyph-option { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: var(--spacing-sm); background: var(--bg-card); border: 1px solid var(--glass-border); border-radius: var(--radius-md); color: var(--text-primary); cursor: pointer; font-family: var(--font-body); }
.glyph-option:hover:not(:disabled) { border-color: var(--color-primary-light); }
.glyph-option.selected { border-color: var(--color-primary); background: rgba(99,102,241,0.12); }
.glyph-option.disabled { opacity: 0.5; cursor: not-allowed; }
.glyph-option .glyph-icon { font-size: 1.1rem; }
.glyph-option .glyph-name { font-size: 0.75rem; }
.glyph-option .glyph-tier { font-size: 0.65rem; color: var(--text-muted); }
.inscription-actions { display: flex; justify-content: flex-end; margin-top: auto; }
</style>
