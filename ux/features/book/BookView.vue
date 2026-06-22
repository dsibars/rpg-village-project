<template>
  <div class="book-view" role="region" aria-label="Village Chronicle">
    <!-- Book Header — minimal, ink-styled -->
    <div class="book-header">
      <button
        class="btn-nav"
        :disabled="currentSpread <= 1"
        @click="prevSpread"
        aria-label="Previous spread"
      >
        <span class="nav-arrow">&#8592;</span>
      </button>
      <div class="book-title">
        <span class="spine-title">{{ t('book_uxelm_title') }}</span>
      </div>
      <button
        class="btn-nav"
        :disabled="currentSpread >= maxSpread"
        @click="nextSpread"
        aria-label="Next spread"
      >
        <span class="nav-arrow">&#8594;</span>
      </button>
    </div>

    <!-- Spread Display (two pages) -->
    <div class="book-spread" v-if="spread">
      <!-- Left Page -->
      <div
        class="book-page page-left"
        :class="{ 'page-empty': !spread.left, 'page-turning': isTurning }"
      >
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
          <span class="page-gutter-mark"></span>
        </div>
      </div>

      <!-- Spine / Gutter -->
      <div class="book-spine" aria-hidden="true">
        <div class="spine-leather">
          <div class="spine-threads">
            <div class="thread"></div>
            <div class="thread"></div>
            <div class="thread"></div>
          </div>
        </div>
      </div>

      <!-- Right Page -->
      <div
        class="book-page page-right"
        :class="{ 'page-empty': !spread.right, 'page-turning': isTurning }"
      >
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
          <span class="page-gutter-mark"></span>
        </div>
      </div>
    </div>

    <!-- Progress — minimal page indicator -->
    <div class="book-progress">
      <div class="progress-dots">
        <span
          v-for="n in maxSpread"
          :key="n"
          class="dot"
          :class="{ active: n === currentSpread }"
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
const isTurning = ref(false)

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

function animateTurn() {
  isTurning.value = true
  setTimeout(() => { isTurning.value = false }, 400)
}

function prevSpread() {
  if (currentSpread.value > 1) {
    animateTurn()
    currentSpread.value--
    const firstPage = (currentSpread.value - 1) * 2 + 1
    emit('markRead', firstPage)
  }
}

function nextSpread() {
  if (currentSpread.value < maxSpread.value) {
    animateTurn()
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
  goToFirstUnread()
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
      const spreadNum = Math.floor(i / 2) + 1
      currentSpread.value = spreadNum
      const firstPage = (spreadNum - 1) * 2 + 1
      emit('markRead', firstPage)
      return
    }
  }
}

// Expose for parent control
defineExpose({ goToFirstUnread, goToPage, prevSpread, nextSpread })

function goToPage(pageNumber) {
  if (!props.bookState?.pages || pageNumber < 1) return
  const maxPage = props.bookState.pages.length
  if (pageNumber > maxPage) pageNumber = maxPage
  const spreadNum = Math.floor((pageNumber - 1) / 2) + 1
  animateTurn()
  currentSpread.value = spreadNum
  // Mark the target spread as read so glow doesn't persist
  const spreadFirstPage = (spreadNum - 1) * 2 + 1
  emit('markRead', spreadFirstPage)
}
</script>

<style scoped>
/* ── Book View Container ── */
.book-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: var(--spacing-md);
  gap: var(--spacing-md);
  /* Dark wooden table background behind the book */
  background: linear-gradient(135deg, #2a1d14 0%, #1a120e 50%, #231813 100%);
  border-radius: var(--radius-lg);
}

/* ── Header ── */
.book-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm) var(--spacing-md);
  flex-shrink: 0;
}

.book-title {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
}

.spine-title {
  font-family: 'Cinzel', serif;
  font-size: 0.9rem;
  font-weight: 700;
  color: rgba(212, 180, 140, 0.7);
  text-transform: uppercase;
  letter-spacing: 3px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.btn-nav {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(44, 24, 16, 0.4);
  border: 1px solid rgba(139, 69, 19, 0.3);
  border-radius: 50%;
  color: rgba(212, 180, 140, 0.8);
  cursor: pointer;
  font-size: 1.1rem;
  transition: all 0.2s ease;
}

.btn-nav:hover:not(:disabled) {
  background: rgba(44, 24, 16, 0.6);
  border-color: rgba(139, 69, 19, 0.6);
  color: rgba(245, 222, 179, 0.95);
}

.btn-nav:disabled {
  opacity: 0.2;
  cursor: not-allowed;
}

.nav-arrow {
  font-family: 'Cinzel', serif;
  line-height: 1;
}

/* ── Spread Layout ── */
.book-spread {
  display: flex;
  flex: 1;
  gap: 0;
  min-height: 0;
  overflow: hidden;
  /* Shadow of the closed book on the table */
  filter: drop-shadow(0 8px 24px rgba(0, 0, 0, 0.5));
}

/* ── Pages ── */
.book-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  position: relative;
  /* Parchment texture */
  background:
    linear-gradient(135deg, #f4e4bc 0%, #e8d5a3 50%, #dbc494 100%),
    url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
  /* Ink-colored text */
  color: #2c1810;
  /* Subtle page edge darkening */
  box-shadow: inset 0 0 30px rgba(44, 24, 16, 0.08);
}

.page-left {
  border-radius: 4px 0 0 4px;
  /* Left edge slightly darker (page thickness) */
  border-left: 2px solid rgba(44, 24, 16, 0.12);
}

.page-right {
  border-radius: 0 4px 4px 0;
  /* Right edge slightly darker */
  border-right: 2px solid rgba(44, 24, 16, 0.12);
}

/* Page turn animation */
.page-turning {
  animation: pageTurn 0.4s ease;
}

@keyframes pageTurn {
  0% { opacity: 1; transform: translateX(0); }
  30% { opacity: 0.6; transform: translateX(-8px); }
  60% { opacity: 0.6; transform: translateX(8px); }
  100% { opacity: 1; transform: translateX(0); }
}

.page-empty {
  background:
    linear-gradient(135deg, #e0d0a8 0%, #d4c498 100%),
    url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
}

.page-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding: var(--spacing-lg) var(--spacing-xl);
  padding-bottom: calc(var(--spacing-lg) + 2rem);
  flex: 1;
  position: relative;
}

/* ── Page Number ── */
.page-number {
  position: absolute;
  bottom: var(--spacing-md);
  font-size: 0.7rem;
  color: rgba(44, 24, 16, 0.35);
  font-family: 'Crimson Text', serif;
  font-style: italic;
}

.page-left .page-number {
  left: var(--spacing-lg);
}

.page-right .page-number {
  right: var(--spacing-lg);
}

/* ── Page Placeholder ── */
.page-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
}

.page-gutter-mark {
  width: 1px;
  height: 60%;
  background: rgba(44, 24, 16, 0.08);
}

/* ── Spine ── */
.book-spine {
  width: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
}

.spine-leather {
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    #3d2418 0%,
    #5c3a2a 20%,
    #4a2e20 40%,
    #3d2418 50%,
    #2a1810 60%,
    #3d2418 80%,
    #2a1810 100%
  );
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  /* Leather texture effect */
  box-shadow:
    inset 2px 0 4px rgba(0, 0, 0, 0.4),
    inset -2px 0 4px rgba(0, 0, 0, 0.3);
}

/* Gold line down the spine center */
.spine-leather::after {
  content: '';
  position: absolute;
  top: 10%;
  bottom: 10%;
  left: 50%;
  transform: translateX(-50%);
  width: 1px;
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(184, 134, 11, 0.6) 15%,
    rgba(218, 165, 32, 0.8) 50%,
    rgba(184, 134, 11, 0.6) 85%,
    transparent 100%
  );
}

.spine-threads {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  z-index: 1;
}

.thread {
  width: 20px;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(139, 90, 43, 0.6) 30%,
    rgba(160, 120, 60, 0.5) 50%,
    rgba(139, 90, 43, 0.6) 70%,
    transparent 100%
  );
}

/* Shadow where pages meet spine */
.book-page.page-left {
  box-shadow:
    inset -8px 0 12px rgba(44, 24, 16, 0.06),
    inset 0 0 30px rgba(44, 24, 16, 0.08);
}

.book-page.page-right {
  box-shadow:
    inset 8px 0 12px rgba(44, 24, 16, 0.06),
    inset 0 0 30px rgba(44, 24, 16, 0.08);
}

/* ── PCS Items ── */
.pcs-item {
  animation: inkFadeIn 0.5s ease;
}

@keyframes inkFadeIn {
  from {
    opacity: 0;
    transform: translateY(3px);
    filter: blur(0.5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
}

/* ── Progress ── */
.book-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-md);
  flex-shrink: 0;
}

.progress-dots {
  display: flex;
  gap: 6px;
  align-items: center;
}

.dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(139, 69, 19, 0.25);
  transition: all 0.3s ease;
}

.dot.active {
  background: rgba(139, 69, 19, 0.7);
  transform: scale(1.3);
}

.progress-label {
  font-size: 0.65rem;
  color: rgba(212, 180, 140, 0.5);
  white-space: nowrap;
  font-family: 'Crimson Text', serif;
  font-style: italic;
  letter-spacing: 1px;
}

/* ── Custom Scrollbar for Parchment Pages ── */
.book-page::-webkit-scrollbar {
  width: 6px;
}

.book-page::-webkit-scrollbar-track {
  background: transparent;
}

.book-page::-webkit-scrollbar-thumb {
  background: rgba(44, 24, 16, 0.15);
  border-radius: 3px;
}

.book-page::-webkit-scrollbar-thumb:hover {
  background: rgba(44, 24, 16, 0.3);
}

/* ── Mobile ── */
@media (max-width: 768px) {
  .book-view {
    padding: var(--spacing-sm);
  }

  .book-spread {
    flex-direction: column;
    filter: none;
  }

  .book-spine {
    display: none;
  }

  .book-page.page-left,
  .book-page.page-right {
    border-radius: 4px;
    border: 1px solid rgba(44, 24, 16, 0.1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .book-page.page-left {
    border-bottom: none;
    border-radius: 4px 4px 0 0;
  }

  .book-page.page-right {
    border-top: none;
    border-radius: 0 0 4px 4px;
  }

  .page-content {
    padding: var(--spacing-md);
    padding-bottom: calc(var(--spacing-md) + 1.5rem);
  }

  .page-number {
    position: relative;
    bottom: auto;
    left: auto !important;
    right: auto !important;
    text-align: center;
    padding-top: var(--spacing-sm);
    display: block;
  }

  .page-left .page-number,
  .page-right .page-number {
    left: auto;
    right: auto;
  }

  .spine-title {
    font-size: 0.75rem;
    letter-spacing: 2px;
  }
}
</style>
