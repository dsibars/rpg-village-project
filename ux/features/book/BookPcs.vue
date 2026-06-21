<template>
  <div class="book-pcs" :class="`pcs-type-${normalizedType}`">
    <!-- Chapter Title -->
    <template v-if="normalizedType === 'chapter_title'">
      <div class="chapter-header">
        <div class="chapter-number">{{ chapterNumber }}</div>
        <h3 class="chapter-title">{{ text }}</h3>
      </div>
    </template>

    <!-- History Block -->
    <template v-else-if="normalizedType === 'history_block'">
      <div class="history-block">
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
        <div class="milestone-icon">🏆</div>
        <div class="milestone-content">
          <span class="milestone-label">{{ t('book_uxelm_milestone') }}</span>
          <span class="milestone-text">{{ text }}</span>
        </div>
      </div>
    </template>

    <!-- Village Update Title -->
    <template v-else-if="normalizedType === 'village_update_title'">
      <div class="update-title">
        <span class="update-icon">📅</span>
        <h4>{{ text }}</h4>
      </div>
    </template>

    <!-- Village Update Bullet -->
    <template v-else-if="normalizedType === 'village_update_bullet'">
      <div class="update-bullet">
        <span class="bullet-marker">•</span>
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

const chapterNumber = computed(() => {
  const values = props.pcs?.values || {}
  return values.chapter || '?'
})

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
  padding: var(--spacing-lg) 0;
  border-bottom: 2px solid var(--glass-border);
  margin-bottom: var(--spacing-md);
}

.chapter-number {
  font-family: var(--font-heading);
  font-size: 0.8rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 2px;
}

.chapter-title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 1.3rem;
  color: var(--color-primary-light);
  text-align: center;
  line-height: 1.3;
}

/* ── History Block ── */
.history-block {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: rgba(255, 255, 255, 0.03);
  border-left: 3px solid var(--color-primary);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

.block-image {
  width: 100%;
  max-height: 120px;
  overflow: hidden;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.2);
}

.block-image img {
  max-width: 100%;
  max-height: 120px;
  object-fit: cover;
}

.block-text p {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--text-primary);
  font-style: italic;
}

/* ── Milestone ── */
.milestone-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: var(--radius-md);
}

.milestone-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.milestone-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.milestone-label {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--color-warning);
}

.milestone-text {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
}

/* ── Village Update Title ── */
.update-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--glass-border);
  margin-bottom: var(--spacing-xs);
}

.update-icon {
  font-size: 1rem;
}

.update-title h4 {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 0.95rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* ── Village Update Bullet ── */
.update-bullet {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) 0;
  padding-left: var(--spacing-md);
}

.bullet-marker {
  color: var(--color-primary-light);
  font-size: 0.8rem;
  line-height: 1.4;
  flex-shrink: 0;
}

.bullet-text {
  font-size: 0.85rem;
  color: var(--text-primary);
  line-height: 1.4;
}

/* ── Unknown PCS ── */
.unknown-pcs {
  padding: var(--spacing-sm);
  background: rgba(239, 68, 68, 0.05);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-size: 0.8rem;
}
</style>
