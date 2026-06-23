<template>
  <div class="book-pcs" :class="`pcs-type-${normalizedType}`">
    <!-- Chapter Title -->
    <template v-if="normalizedType === 'chapter_title'">
      <div class="chapter-header">
        <h3 class="chapter-title">{{ text }}</h3>
        <div class="chapter-flourish" aria-hidden="true">
          <span class="flourish-line"></span>
          <span class="flourish-ornament">&#10022;</span>
          <span class="flourish-line"></span>
        </div>
      </div>
    </template>

    <!-- History Block -->
    <template v-else-if="normalizedType === 'history_block'">
      <div class="history-block" :class="{ 'has-image': pcs.image }">
        <div v-if="pcs.image" class="block-image">
          <img :src="pcs.image" :alt="text" />
        </div>
        <div class="block-text">
          <p>{{ text }}</p>
        </div>
      </div>
    </template>

    <!-- Milestone -->
    <template v-else-if="normalizedType === 'milestone'">
      <div class="milestone-item">
        <div class="milestone-icon" aria-hidden="true">
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- Hand-drawn style trophy -->
            <path d="M12 8h24M14 8v4c0 8-4 12-6 14M34 8v4c0 8 4 12 6 14M8 22c3-2 5-6 6-10M40 22c-3-2-5-6-6-10" stroke="#8b4513" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            <path d="M16 36h16M20 36v4M28 36v4M18 40h12" stroke="#8b4513" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            <ellipse cx="24" cy="26" rx="8" ry="3" fill="rgba(139,69,19,0.08)" stroke="#8b4513" stroke-width="1.5"/>
            <path d="M24 14l2 4h4l-3 3 1 4-4-2-4 2 1-4-3-3h4z" fill="rgba(184,134,11,0.2)" stroke="#a0522d" stroke-width="1" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="milestone-content">
          <span class="milestone-label">{{ t('book_uxelm_milestone') }}</span>
          <span class="milestone-text">{{ text }}</span>
        </div>
      </div>
    </template>

    <!-- Village Update Title -->
    <template v-else-if="normalizedType === 'village_update_title'">
      <div class="update-title">
        <svg class="update-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="3" y="4" width="14" height="12" rx="1" stroke="#5a3a2a" stroke-width="1.2" fill="none"/>
          <line x1="3" y1="8" x2="17" y2="8" stroke="#5a3a2a" stroke-width="1"/>
          <line x1="6" y1="2" x2="6" y2="5" stroke="#5a3a2a" stroke-width="1.2" stroke-linecap="round"/>
          <line x1="14" y1="2" x2="14" y2="5" stroke="#5a3a2a" stroke-width="1.2" stroke-linecap="round"/>
          <circle cx="10" cy="12" r="1.5" fill="#5a3a2a" opacity="0.5"/>
        </svg>
        <h4>{{ text }}</h4>
      </div>
    </template>

    <!-- Village Update Bullet -->
    <template v-else-if="normalizedType === 'village_update_bullet'">
      <div class="update-bullet">
        <span class="bullet-marker">&#8212;</span>
        <span class="bullet-text">{{ text }}</span>
      </div>
    </template>

    <!-- Fallback -->
    <template v-else>
      <div class="unknown-pcs">
        <p>{{ text }}</p>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'

const { t } = useI18n()

const props = defineProps({
  pcs: { type: Object, required: true }
})

const normalizedType = computed(() => props.pcs?.type || 'unknown')

const text = computed(() => {
  const pcs = props.pcs
  if (!pcs) return ''

  const key = pcs.textKey || ''
  const values = pcs.values || {}

  // Use i18n composable for translation, with template replacement
  const translated = t(key, values)
  return translated
})
</script>

<style scoped>
.book-pcs {
  width: 100%;
}

/* ── Chapter Title ── */
.chapter-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-lg) 0 var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.chapter-title {
  margin: 0;
  font-family: 'Cinzel', serif;
  font-size: 1.6rem;
  font-weight: 700;
  color: #2c1810;
  text-align: center;
  line-height: 1.3;
  letter-spacing: 1px;
}

.chapter-flourish {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  width: 100%;
  max-width: 200px;
}

.flourish-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(44, 24, 16, 0.25) 30%,
    rgba(44, 24, 16, 0.25) 70%,
    transparent 100%
  );
}

.flourish-ornament {
  font-size: 0.7rem;
  color: rgba(139, 69, 19, 0.4);
  line-height: 1;
}

/* ── History Block ── */
.history-block {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-md) var(--spacing-md) calc(var(--spacing-md) + 8px);
  border-left: 2px solid rgba(44, 24, 16, 0.2);
  position: relative;
}

/* Side-by-side layout when image is present */
.history-block.has-image {
  flex-direction: row;
  align-items: flex-start;
  gap: var(--spacing-md);
}

/* Subtle indent feel */
.history-block::before {
  content: '';
  position: absolute;
  left: 0;
  top: var(--spacing-md);
  bottom: var(--spacing-md);
  width: 2px;
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(44, 24, 16, 0.15) 20%,
    rgba(44, 24, 16, 0.25) 50%,
    rgba(44, 24, 16, 0.15) 80%,
    transparent 100%
  );
}

.block-image {
  width: 100%;
  max-height: 140px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  /* Hand-drawn sketchy border */
  border: 2px solid rgba(44, 24, 16, 0.2);
  border-radius: 2px;
  padding: 4px;
  background: rgba(255, 255, 255, 0.3);
  /* Slight rotation for natural feel */
  transform: rotate(-0.5deg);
  box-shadow: 0 2px 6px rgba(44, 24, 16, 0.08);
}

/* When side-by-side, image takes ~35% width */
.history-block.has-image .block-image {
  width: 35%;
  max-height: none;
  flex-shrink: 0;
  align-self: stretch;
}

.block-image img {
  max-width: 100%;
  max-height: 130px;
  object-fit: cover;
  border-radius: 1px;
  filter: sepia(0.15) contrast(0.95);
}

.history-block.has-image .block-image img {
  max-height: 100%;
  width: 100%;
  height: auto;
  object-fit: cover;
}

.block-text {
  flex: 1;
}

.block-text p {
  margin: 0;
  font-family: 'Crimson Text', serif;
  font-size: 0.95rem;
  line-height: 1.7;
  color: #2c1810;
  font-style: italic;
  letter-spacing: 0.2px;
}

/* ── Milestone ── */
.milestone-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  /* Watercolor wash effect */
  background: linear-gradient(
    135deg,
    rgba(184, 134, 11, 0.06) 0%,
    rgba(139, 69, 19, 0.04) 50%,
    rgba(160, 82, 45, 0.06) 100%
  );
  border: 1px solid rgba(139, 69, 19, 0.15);
  border-radius: 3px;
  position: relative;
  /* Slight excitement — not perfectly aligned */
  transform: rotate(0.3deg);
}

/* Subtle highlight behind text */
.milestone-item::before {
  content: '';
  position: absolute;
  inset: 4px;
  background: radial-gradient(
    ellipse at 30% 50%,
    rgba(255, 215, 0, 0.04) 0%,
    transparent 70%
  );
  pointer-events: none;
  border-radius: 2px;
}

.milestone-icon {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  margin-top: 2px;
}

.milestone-icon svg {
  width: 100%;
  height: 100%;
}

.milestone-content {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
}

.milestone-label {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: #8b4513;
  font-family: 'Cinzel', serif;
}

.milestone-text {
  font-size: 1rem;
  font-weight: 600;
  color: #2c1810;
  font-family: 'Crimson Text', serif;
  line-height: 1.4;
}

/* ── Village Update Title ── */
.update-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid rgba(44, 24, 16, 0.1);
  margin-bottom: var(--spacing-xs);
}

.update-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  opacity: 0.6;
}

.update-title h4 {
  margin: 0;
  font-family: 'Caveat', cursive;
  font-size: 1.1rem;
  font-weight: 700;
  color: #3d2418;
  letter-spacing: 0.3px;
}

/* ── Village Update Bullet ── */
.update-bullet {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) 0;
  padding-left: var(--spacing-sm);
}

.bullet-marker {
  color: rgba(44, 24, 16, 0.4);
  font-size: 0.8rem;
  line-height: 1.4;
  flex-shrink: 0;
  font-family: 'Crimson Text', serif;
  margin-top: 1px;
}

.bullet-text {
  font-size: 0.9rem;
  color: #2c1810;
  line-height: 1.45;
  font-family: 'Caveat', cursive;
}

/* ── Unknown PCS ── */
.unknown-pcs {
  padding: var(--spacing-sm);
  background: rgba(139, 69, 19, 0.04);
  border: 1px solid rgba(139, 69, 19, 0.12);
  border-radius: 2px;
  color: rgba(44, 24, 16, 0.5);
  font-size: 0.8rem;
  font-family: 'Crimson Text', serif;
}

/* ── Mobile adjustments ── */
@media (max-width: 768px) {
  .chapter-title {
    font-size: 1.3rem;
  }

  .block-text p {
    font-size: 0.9rem;
    line-height: 1.6;
  }

  .milestone-text {
    font-size: 0.9rem;
  }

  .update-title h4 {
    font-size: 1rem;
  }

  .bullet-text {
    font-size: 0.85rem;
  }

  .history-block {
    padding-left: var(--spacing-sm);
  }

  .history-block.has-image {
    flex-direction: column;
  }

  .history-block.has-image .block-image {
    width: 100%;
    max-height: 140px;
  }
}
</style>
