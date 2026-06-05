<template>
  <div class="mandala-wrapper">
    <div class="mandala-ring ring-1"></div>
    <div class="mandala-ring ring-2"></div>
    <div class="mandala-ring ring-3"></div>
    <div class="mandala-ring ring-4"></div>

    <svg class="mandala-connections" viewBox="0 0 100 100">
      <line
        v-for="(conn, idx) in connections"
        :key="idx"
        :x1="conn.x1"
        :y1="conn.y1"
        :x2="conn.x2"
        :y2="conn.y2"
        class="connection-line"
      />
    </svg>

    <div class="mandala-slots">
      <button
        v-for="i in 25"
        :key="i - 1"
        class="mandala-slot"
        :class="{
          'core-slot': i - 1 === 0,
          'locked': i - 1 >= maxSlots,
          'focused': focusedSlotIndex === i - 1,
          'filled': getSlotGlyph(i - 1)
        }"
        :style="getSlotStyle(i - 1)"
        :disabled="i - 1 >= maxSlots"
        :title="i - 1 >= maxSlots ? t('magic_circle_uxelm_slot_locked', { tier: i }) : ''"
        @click="$emit('focus', i - 1)"
      >
        <template v-if="i - 1 >= maxSlots">
          <span class="slot-lock">\u{1F512}</span>
        </template>
        <template v-else>
          <span class="slot-icon">{{ getSlotIcon(i - 1) }}</span>
          <span class="slot-abb">{{ getSlotAbb(i - 1) }}</span>
          <span v-if="getSlotGlyph(i - 1)" class="slot-tier">
            {{ getSlotTier(i - 1) }}
          </span>
        </template>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import { getSlotCoords, isAdjacent, getGlyphIcon, getGlyphAbbreviation } from '../composables/useMagicCircle.js'
import { GLYPH_DATA } from '../../../../js/engine/shared/data/MagicCircleData.js'

const props = defineProps({
  maxSlots: { type: Number, default: 25 },
  focusedSlotIndex: { type: Number, default: null},
  composition: { type: Array, default: () => [] }
})

const emit = defineEmits(['focus'])

const { t } = useI18n()

function getSlotStyle(i) {
  const coords = getSlotCoords(i)
  return {
    left: `${coords.x}%`,
    top: `${coords.y}%`
  }
}

function getSlotGlyph(i) {
  return props.composition.find((c) => c.slotIndex === i)
}

function getSlotIcon(i) {
  const comp = getSlotGlyph(i)
  if (!comp) return ''
  const glyph = GLYPH_DATA[comp.glyphId]
  return getGlyphIcon(glyph)
}

function getSlotAbb(i) {
  const comp = getSlotGlyph(i)
  if (!comp) return ''
  const glyph = GLYPH_DATA[comp.glyphId]
  return getGlyphAbbreviation(glyph)
}

function getSlotTier(i) {
  const comp = getSlotGlyph(i)
  if (!comp) return ''
  return '+'
}

const connections = computed(() => {
  const conns = []
  for (let i = 0; i < 25; i++) {
    for (let j = i + 1; j < 25; j++) {
      if (!isAdjacent(i, j)) continue
      const hasI = getSlotGlyph(i)
      const hasJ = getSlotGlyph(j)
      if (!hasI || !hasJ) continue
      const c1 = getSlotCoords(i)
      const c2 = getSlotCoords(j)
      conns.push({ x1: c1.x, y1: c1.y, x2: c2.x, y2: c2.y })
    }
  }
  return conns
})
</script>

<style scoped>
.mandala-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  max-width: 520px;
  margin: 0 auto;
}

.mandala-ring {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.ring-1 { width: 25%; height: 25%; }
.ring-2 { width: 50%; height: 50%; }
.ring-3 { width: 75%; height: 75%; }
.ring-4 { width: 100%; height: 100%; }

@keyframes rotate-cw { from { transform: translate(-50%, -50%) rotate(0deg); } to { transform: translate(-50%, -50%) rotate(360deg); } }
@keyframes rotate-ccw { from { transform: translate(-50%, -50%) rotate(360deg); } to { transform: translate(-50%, -50%) rotate(0deg); } }

.ring-1 { animation: rotate-cw 60s linear infinite; }
.ring-2 { animation: rotate-ccw 80s linear infinite; }
.ring-3 { animation: rotate-cw 100s linear infinite; }
.ring-4 { animation: rotate-ccw 120s linear infinite; }

.mandala-connections {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.connection-line {
  stroke: rgba(99, 102, 241, 0.4);
  stroke-width: 0.4;
}

.mandala-slots {
  position: absolute;
  inset: 0;
  z-index: 2;
}

.mandala-slot {
  position: absolute;
  width: 36px;
  height: 36px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  border: 1px solid var(--glass-border);
  background: var(--bg-card);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  font-family: var(--font-body);
  transition: all 0.2s ease;
}

.mandala-slot:hover:not(:disabled) {
  border-color: var(--color-primary-light);
  box-shadow: 0 0 8px rgba(99, 102, 241, 0.3);
}

.mandala-slot.core-slot {
  width: 48px;
  height: 48px;
  border-color: rgba(234, 179, 8, 0.4);
  background: rgba(234, 179, 8, 0.08);
}

.mandala-slot.locked {
  opacity: 0.4;
  cursor: not-allowed;
  background: rgba(0, 0, 0, 0.3);
}

.mandala-slot.focused {
  border-color: var(--color-primary);
  box-shadow: 0 0 12px rgba(99, 102, 241, 0.5);
}

.mandala-slot.filled {
  background: rgba(99, 102, 241, 0.15);
}

.slot-icon {
  font-size: 0.9rem;
  line-height: 1;
}

.slot-abb {
  font-size: 0.5rem;
  color: var(--text-muted);
  font-weight: 700;
  line-height: 1;
}

.slot-tier {
  position: absolute;
  bottom: -2px;
  right: -2px;
  font-size: 0.55rem;
  color: var(--color-primary-light);
  background: var(--bg-base);
  border-radius: 50%;
  width: 12px;
  height: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.slot-lock {
  font-size: 0.7rem;
}
</style>
