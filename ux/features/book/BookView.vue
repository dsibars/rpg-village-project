<template>
  <div class="book-view" role="region" aria-label="Village Chronicle">
    <!-- Book Header -->
    <div class="book-header">
      <button
        class="btn-nav"
        :disabled="currentSpread <= 1"
        @click="prevSpread"
      >
        ◀ {{ t('book_uxelm_prev') }}
      </button>
      <div class="book-title">
        <span class="book-icon">📖</span>
        <span>{{ t('book_uxelm_title') }}</span>
      </div>
      <button
        class="btn-nav"
        :disabled="currentSpread >= maxSpread"
        @click="nextSpread"
      >
        {{ t('book_uxelm_next') }} ▶
      </button>
    </div>

    <!-- Spread Display (two pages) -->
    <div class="book-spread" v-if="spread">
      <!-- Left Page -->
      <div class="book-page page-left" :class="{ 'page-empty': !spread.left }">
        <div v-if="spread.left" class="page-content">
          <div class="page-number">{{ spread.left.pageNumber }}</div>
          <div
            v-for="pcs in spread.left.pageContentSections"
            :key="pcs.id"
            class="pcs-item"
            :class="`pcs-${pcs.type}`"
          >
            <BookPcs :pcs="pcs" />
          </div>
        </div>
        <div v-else class="page-placeholder">
          <span class="page-gutter-mark">|</span>
        </div>
      </div>

      <!-- Spine / Gutter -->
      <div class="book-spine" aria-hidden="true">
        <div class="spine-line"></div>
      </div>

      <!-- Right Page -->
      <div class="book-page page-right" :class="{ 'page-empty': !spread.right }">
        <div v-if="spread.right" class="page-content">
          <div class="page-number">{{ spread.right.pageNumber }}</div>
          <div
            v-for="pcs in spread.right.pageContentSections"
            :key="pcs.id"
            class="pcs-item"
            :class="`pcs-${pcs.type}`"
          >
            <BookPcs :pcs="pcs" />
          </div>
        </div>
        <div v-else class="page-placeholder">
          <span class="page-gutter-mark">|</span>
        </div>
      </div>
    </div>

    <!-- Progress Bar -->
    <div class="book-progress">
      <div class="progress-track">
        <div
          class="progress-fill"
          :style="{ width: `${progressPercent}%` }"
        />
      </div>
      <span class="progress-label">
        {{ t('book_uxelm_spread', { current: currentSpread, total: maxSpread }) }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import BookPcs from './BookPcs.vue'

const { t } = useI18n()

const emit = defineEmits(['markRead'])

const props = defineProps({
  bookState: { type: Object, required: true }
})

const currentSpread = ref(1)

const pages = computed(() => props.bookState?.pages || [])
const chapters = computed(() => props.bookState?.chapters || [])

const maxSpread = computed(() => {
  return Math.max(1, Math.ceil(pages.value.length / 2))
})

const spread = computed(() => {
  const firstPage = (currentSpread.value - 1) * 2 + 1
  const left = pages.value[firstPage - 1] || null
  const right = pages.value[firstPage] || null

  // Enrich pages with chapter info
  const enrichPage = (page) => {
    if (!page) return null
    const chapter = chapters.value.find(c => c.chapterNumber === page.chapterNumber)
    return { ...page, chapter }
  }

  return {
    left: enrichPage(left),
    right: enrichPage(right)
  }
})

const progressPercent = computed(() => {
  if (maxSpread.value <= 1) return 100
  return ((currentSpread.value - 1) / (maxSpread.value - 1)) * 100
})

function prevSpread() {
  if (currentSpread.value > 1) {
    currentSpread.value--
    const firstPage = (currentSpread.value - 1) * 2 + 1
    emit('markRead', firstPage)
  }
}

function nextSpread() {
  if (currentSpread.value < maxSpread.value) {
    currentSpread.value++
    const firstPage = (currentSpread.value - 1) * 2 + 1
    emit('markRead', firstPage)
  }
}

// Keyboard navigation
function onKeyDown(e) {
  if (e.key === 'ArrowLeft') prevSpread()
  if (e.key === 'ArrowRight') nextSpread()
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
})

// Auto-navigate to first unread spread on mount
function goToFirstUnread() {
  if (!props.bookState?.pages) return

  for (let i = 0; i < pages.value.length; i++) {
    const page = pages.value[i]
    if (!page?.pageContentSections) continue

    const hasUnread = page.pageContentSections.some(pcs => !pcs.read)
    if (hasUnread) {
      currentSpread.value = Math.floor(i / 2) + 1
      return
    }
  }
}

// Expose for parent control
defineExpose({ goToFirstUnread, prevSpread, nextSpread })
</script>

<style scoped>
.book-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: var(--spacing-md);
  gap: var(--spacing-md);
  color: var(--text-primary);
}

.book-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.book-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-family: var(--font-heading);
  font-size: 1.1rem;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.book-icon {
  font-size: 1.3rem;
}

.btn-nav {
  padding: var(--spacing-xs) var(--spacing-md);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  font-family: var(--font-body);
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.15s ease;
}

.btn-nav:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.14);
  color: var(--text-primary);
  border-color: var(--color-primary-light);
}

.btn-nav:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* ── Spread Layout ── */
.book-spread {
  display: flex;
  flex: 1;
  gap: 0;
  min-height: 0;
  overflow: hidden;
}

.book-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  overflow-y: auto;
  position: relative;
}

.page-left {
  border-radius: var(--radius-lg) 0 0 var(--radius-lg);
  border-right: none;
}

.page-right {
  border-radius: 0 var(--radius-lg) var(--radius-lg) 0;
  border-left: none;
}

.page-empty {
  background: rgba(0, 0, 0, 0.15);
}

.page-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  flex: 1;
}

.page-number {
  position: absolute;
  bottom: var(--spacing-md);
  font-size: 0.75rem;
  color: var(--text-muted);
  font-family: var(--font-heading);
  opacity: 0.5;
}

.page-left .page-number {
  left: var(--spacing-md);
}

.page-right .page-number {
  right: var(--spacing-md);
}

.page-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
}

.page-gutter-mark {
  font-size: 2rem;
  color: var(--text-muted);
  opacity: 0.15;
}

/* ── Spine ── */
.book-spine {
  width: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.spine-line {
  width: 2px;
  height: 100%;
  background: linear-gradient(
    180deg,
    transparent 0%,
    var(--glass-border) 10%,
    var(--glass-border) 90%,
    transparent 100%
  );
  opacity: 0.6;
}

/* ── PCS Items ── */
.pcs-item {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ── Progress Bar ── */
.book-progress {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.progress-track {
  flex: 1;
  height: 4px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-primary-light));
  border-radius: 2px;
  transition: width 0.3s ease;
}

.progress-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  white-space: nowrap;
  font-family: var(--font-heading);
}

@media (max-width: 768px) {
  .book-spread {
    flex-direction: column;
  }

  .book-spine {
    display: none;
  }

  .page-left {
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    border-right: 1px solid var(--glass-border);
    border-bottom: none;
  }

  .page-right {
    border-radius: 0 0 var(--radius-lg) var(--radius-lg);
    border-left: 1px solid var(--glass-border);
    border-top: none;
  }

  .page-number {
    position: relative;
    bottom: auto;
    left: auto !important;
    right: auto !important;
    text-align: center;
    padding-top: var(--spacing-sm);
  }
}
</style>
