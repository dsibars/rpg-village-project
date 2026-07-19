<template>
  <div class="battle-backdrop" :class="theme" aria-hidden="true">
    <div class="backdrop-sky" />
    <div class="backdrop-ground" />
  </div>
</template>

<script setup>
import { computed } from 'vue'

/**
 * Area-themed battle backdrop. `area` is propagated from the battle trigger
 * (e.g. region data via ExpeditionService). These are placeholder gradient
 * scenes until real art lands — the plumbing is the point.
 */
const props = defineProps({
  area: { type: String, default: null }
})

const KNOWN_AREAS = ['greenfields', 'cave', 'coast', 'forest', 'peaks']

const theme = computed(() =>
  KNOWN_AREAS.includes(props.area) ? `area-${props.area}` : 'area-default'
)
</script>

<style scoped>
.battle-backdrop {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.backdrop-sky {
  position: absolute;
  inset: 0 0 38% 0;
  transition: background 0.4s ease;
}

.backdrop-ground {
  position: absolute;
  inset: 62% 0 0 0;
  transition: background 0.4s ease;
}

/* ── Greenfields ── */
.area-greenfields .backdrop-sky {
  background: linear-gradient(180deg, #2b4d3a 0%, #4a7a52 60%, #6b9a63 100%);
}
.area-greenfields .backdrop-ground {
  background: linear-gradient(180deg, #3d6b40 0%, #2a4a2c 55%, #1a2f1c 100%);
}

/* ── Cave ── */
.area-cave .backdrop-sky {
  background: linear-gradient(180deg, #120d16 0%, #241a2e 60%, #33243a 100%);
}
.area-cave .backdrop-ground {
  background: linear-gradient(180deg, #2c2033 0%, #1d1522 55%, #100b14 100%);
}

/* ── Coast ── */
.area-coast .backdrop-sky {
  background: linear-gradient(180deg, #1e3d5c 0%, #2f5f85 55%, #6a94ad 100%);
}
.area-coast .backdrop-ground {
  background: linear-gradient(180deg, #4a6b7d 0%, #8a7a58 45%, #57503c 100%);
}

/* ── Forest ── */
.area-forest .backdrop-sky {
  background: linear-gradient(180deg, #0f2416 0%, #1c3d24 55%, #2e5732 100%);
}
.area-forest .backdrop-ground {
  background: linear-gradient(180deg, #24452a 0%, #172e1b 55%, #0d1a10 100%);
}

/* ── Peaks ── */
.area-peaks .backdrop-sky {
  background: linear-gradient(180deg, #33455e 0%, #5d7a99 55%, #93a8bf 100%);
}
.area-peaks .backdrop-ground {
  background: linear-gradient(180deg, #7d8ea1 0%, #556575 55%, #323d47 100%);
}

/* ── Default (matches the previous neutral battle background) ── */
.area-default .backdrop-sky {
  background: linear-gradient(180deg, #14241a 0%, #1d3324 60%, #2a4a30 100%);
}
.area-default .backdrop-ground {
  background: linear-gradient(180deg, #223c2a 0%, #16241a 55%, #0f1811 100%);
}
</style>
