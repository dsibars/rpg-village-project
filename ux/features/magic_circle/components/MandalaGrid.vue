<template>
  <div class="mandala-wrapper">
    <div class="mandala-ring ring-1 rotate-cw"></div>
    <div class="mandala-ring ring-2 rotate-ccw"></div>
    <div class="mandala-ring ring-3 rotate-cw"></div>
    <div class="mandala-ring ring-4 rotate-ccw"></div>

    <svg class="mandala-connections-svg" viewBox="0 0 100 100">
      <line
        v-for="(conn, idx) in connections"
        :key="idx"
        :x1="conn.x1"
        :y1="conn.y1"
        :x2="conn.x2"
        :y2="conn.y2"
        class="mandala-connection-line"
        :style="{ stroke: conn.color }"
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
          'focused-slot': focusedSlotIndex === i - 1,
          'filled': !!getSlotGlyph(i - 1),
          'empty': !getSlotGlyph(i - 1) && i - 1 < maxSlots,
          [`el-${getSlotElement(i - 1)}`]: !!getSlotGlyph(i - 1)
        }"
        :style="getSlotStyle(i - 1)"
        :disabled="i - 1 >= maxSlots"
        :title="i - 1 >= maxSlots ? t('magic_circle_uxelm_slot_locked', { tier: i }) : ''"
        @click="$emit('focus', i - 1)"
      >
        <template v-if="i - 1 >= maxSlots">
          <span class="slot-lock">🔒</span>
        </template>
        <template v-else-if="getSlotGlyph(i - 1)">
          <span class="slot-icon">{{ getSlotIcon(i - 1) }}</span>
          <span class="slot-abb">{{ getSlotAbb(i - 1) }}</span>
          <span class="slot-tier">{{ getSlotTier(i - 1) }}</span>
        </template>
        <template v-else>
          {{ i - 1 === 0 ? '⚡' : '＋' }}
        </template>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import { useAdapter } from '@/core/composables/useAdapter.js'
import { getSlotCoords, isAdjacent, getGlyphIcon, getGlyphAbbreviation, getElementColor } from '../composables/useMagicCircle.js'
import { GLYPH_DATA } from '@/core/data/index.js'

const props = defineProps({
  maxSlots: { type: Number, default: 25 },
  focusedSlotIndex: { type: Number, default: null },
  composition: { type: Array, default: () => [] },
  spellElement: { type: String, default: null },
  selectedTiers: { type: Object, default: () => ({}) },
  glyphMastery: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['focus'])

const { t } = useI18n()
const { dispatch } = useAdapter()

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

function getSlotElement(i) {
  const comp = getSlotGlyph(i)
  if (!comp) return ''
  const glyph = GLYPH_DATA[comp.glyphId]
  return glyph?.element || ''
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
  const glyph = GLYPH_DATA[comp.glyphId]
  if (!glyph) return ''
  const tier = props.selectedTiers[comp.glyphId] || props.glyphMastery[comp.glyphId]?.tier || 1
  const result = dispatch('magic', 'getGlyphSymbol', { tier })
  return result.success ? result.data : '+'
}

const connections = computed(() => {
  const conns = []
  const lineColor = props.spellElement
    ? getElementColor(props.spellElement)
    : 'rgba(255, 255, 255, 0.2)'

  for (let i = 0; i < 25; i++) {
    for (let j = i + 1; j < 25; j++) {
      if (!isAdjacent(i, j)) continue
      const hasI = getSlotGlyph(i)
      const hasJ = getSlotGlyph(j)
      if (!hasI || !hasJ) continue
      const c1 = getSlotCoords(i)
      const c2 = getSlotCoords(j)
      conns.push({
        x1: c1.x, y1: c1.y, x2: c2.x, y2: c2.y,
        color: lineColor
      })
    }
  }
  return conns
})
</script>

<style scoped>
.mandala-wrapper {
  position: relative;
  width: min(85vw, 68vh, 520px);
  height: min(85vw, 68vh, 520px);
  margin: 0 auto;
  display: flex;
  justify-content: center;
  align-items: center;
}

.mandala-ring {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  pointer-events: none;
  transition: all 0.4s ease;
}

.ring-1 { width: 24.0%; height: 24.0%; border: 1.5px solid rgba(245, 158, 11, 0.25); box-shadow: 0 0 10px rgba(245, 158, 11, 0.1); }
.ring-2 { width: 48.0%; height: 48.0%; border: 1.5px dashed rgba(74, 222, 128, 0.2); }
.ring-3 { width: 72.0%; height: 72.0%; border: 1.5px dashed rgba(245, 158, 11, 0.15); }
.ring-4 { width: 96.0%; height: 96.0%; border: 2px solid rgba(74, 222, 128, 0.25); box-shadow: 0 0 15px rgba(74, 222, 128, 0.12); }

@keyframes rotate-cw-anim {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to { transform: translate(-50%, -50%) rotate(360deg); }
}

@keyframes rotate-ccw-anim {
  from { transform: translate(-50%, -50%) rotate(360deg); }
  to { transform: translate(-50%, -50%) rotate(0deg); }
}

.rotate-cw { animation: rotate-cw-anim 100s linear infinite; }
.rotate-ccw { animation: rotate-ccw-anim 100s linear infinite; }

.mandala-connections-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 2;
}

.mandala-connection-line {
  stroke-width: 1.5;
  stroke-dasharray: 4 4;
  transition: stroke 0.4s ease;
  animation: line-dash-flow 4s linear infinite;
  opacity: 0.22;
}

@keyframes line-dash-flow {
  to { stroke-dashoffset: -20; }
}

.mandala-slots {
  position: absolute;
  inset: 0;
  z-index: 5;
}

.mandala-slot {
  position: absolute;
  width: 48px;
  height: 48px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: rgba(18, 30, 22, 0.85); /* Translucent forest glass background */
  border: 1.5px solid rgba(74, 222, 128, 0.35); /* Glowing leaf-green border */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  font-family: var(--font-body);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-sizing: border-box;
  color: rgba(255, 255, 255, 0.45);
  font-size: 1rem;
  font-weight: 500;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.08);
}

.mandala-slot:hover:not(:disabled) {
  transform: translate(-50%, -50%) scale(1.15);
  border-color: var(--color-primary-light);
  box-shadow: 0 0 15px rgba(134, 239, 172, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.2);
  z-index: 6;
  color: #ffffff;
}

/* Core Slot: Hexagonal */
.mandala-slot.core-slot {
  width: 76px;
  height: 76px;
  border-radius: 0;
  background: rgba(245, 158, 11, 0.3);
  border: none;
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
}

.mandala-slot.core-slot::before {
  content: '';
  position: absolute;
  inset: 1.5px;
  background: #0f1a12;
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  z-index: -1;
  transition: background 0.3s ease;
}

.mandala-slot.core-slot:hover {
  transform: translate(-50%, -50%) scale(1.08);
  box-shadow: none;
  background: #fbbf24;
}

.mandala-slot.core-slot.filled::before {
  background: rgba(20, 32, 24, 0.9);
}

.mandala-slot.core-slot.empty {
  font-size: 1.4rem;
  color: #fbbf24;
}

.mandala-slot.core-slot.empty:hover {
  color: #ffffff;
}

.mandala-slot.focused-slot {
  border-color: #fbbf24;
  box-shadow: 0 0 20px rgba(251, 191, 36, 0.65), inset 0 0 8px rgba(251, 191, 36, 0.25);
  transform: translate(-50%, -50%) scale(1.15);
  z-index: 7;
}

.mandala-slot.core-slot.focused-slot {
  background: #fbbf24;
  transform: translate(-50%, -50%) scale(1.08);
}

.mandala-slot.empty {
  color: rgba(74, 222, 128, 0.4);
  background: rgba(15, 25, 18, 0.65);
  border: 1.5px dashed rgba(74, 222, 128, 0.3);
}

.mandala-slot.empty:hover {
  color: var(--color-primary-light);
  border-color: var(--color-primary-light);
  box-shadow: 0 0 12px rgba(134, 239, 172, 0.35);
  background: rgba(24, 40, 28, 0.8);
}

.mandala-slot.locked {
  opacity: 0.2;
  background: rgba(20, 30, 22, 0.4);
  border: 1px dashed rgba(74, 222, 128, 0.12);
  color: rgba(74, 222, 128, 0.18);
  cursor: not-allowed;
  pointer-events: none;
}

.mandala-slot.filled {
  background: rgba(18, 30, 22, 0.9);
  color: #fff;
}

.mandala-slot.filled:hover {
  transform: translate(-50%, -50%) scale(1.15);
}

/* Element specific filled slot glows */
.mandala-slot.filled.el-fire { border-color: #f87171; box-shadow: 0 0 12px rgba(239, 68, 68, 0.5); color: #fee2e2; text-shadow: 0 0 5px rgba(239, 68, 68, 0.8); }
.mandala-slot.filled.el-water { border-color: #60a5fa; box-shadow: 0 0 12px rgba(59, 130, 246, 0.5); color: #dbeafe; text-shadow: 0 0 5px rgba(59, 130, 246, 0.8); }
.mandala-slot.filled.el-wind { border-color: #34d399; box-shadow: 0 0 12px rgba(16, 185, 129, 0.5); color: #d1fae5; text-shadow: 0 0 5px rgba(16, 185, 129, 0.8); }
.mandala-slot.filled.el-storm { border-color: #fbbf24; box-shadow: 0 0 12px rgba(245, 158, 11, 0.5); color: #fef3c7; text-shadow: 0 0 5px rgba(245, 158, 11, 0.8); }
.mandala-slot.filled.el-light { border-color: #fde047; box-shadow: 0 0 12px rgba(251, 191, 36, 0.5); color: #fef9c3; text-shadow: 0 0 5px rgba(251, 191, 36, 0.8); }
.mandala-slot.filled.el-dark { border-color: #c084fc; box-shadow: 0 0 12px rgba(168, 85, 247, 0.5); color: #f3e8ff; text-shadow: 0 0 5px rgba(168, 85, 247, 0.8); }
.mandala-slot.filled.el-earth { border-color: #a3e635; box-shadow: 0 0 12px rgba(132, 204, 22, 0.5); color: #f0fdf4; text-shadow: 0 0 5px rgba(132, 204, 22, 0.8); }

.slot-icon {
  font-size: 1.1rem;
  line-height: 1;
  z-index: 1;
}

.mandala-slot.core-slot .slot-icon {
  font-size: 1.9rem;
}

.slot-abb {
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: #94a3b8;
  margin-top: 1px;
  z-index: 1;
}

.slot-tier {
  font-size: 0.55rem;
  font-weight: 600;
  color: #fbbf24;
  position: absolute;
  bottom: 4px;
  z-index: 1;
}

.mandala-slot.core-slot .slot-tier {
  bottom: 8px;
  font-size: 0.65rem;
}

.slot-lock {
  font-size: 0.7rem;
}
</style>
