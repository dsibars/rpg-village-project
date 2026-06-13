<template>
  <div
    v-if="open && presentation"
    class="presentation-overlay"
    :class="{ visible: isVisible, closing: isClosing }"
    @click.self="onSkip"
  >
    <div class="presentation-modal">
      <span v-if="isReplay" class="presentation-replay-badge">
        {{ t('pres_ui_replay') }}
      </span>
      <button class="presentation-skip" @click="onSkip">
        {{ t('pres_ui_skip') }}
      </button>

      <div class="presentation-content">
        <div class="presentation-image">
          <img
            v-if="currentPage?.image"
            :src="currentPage.image"
            alt=""
            @error="$event.target.style.display = 'none'"
          />
        </div>
        <div class="presentation-text">
          <p>{{ t(currentPage?.textKey || '') }}</p>
        </div>
      </div>

      <div class="presentation-footer">
        <button
          class="btn btn-secondary btn-sm presentation-back"
          :style="isFirstPage ? 'visibility: hidden;' : ''"
          @click="currentPageIndex--"
        >
          {{ t('pres_ui_back') }}
        </button>
        <div class="presentation-dots">
          <span
            v-for="(_, idx) in presentation.pages"
            :key="idx"
            class="presentation-dot"
            :class="{ active: idx === currentPageIndex }"
          />
        </div>
        <button class="btn btn-primary btn-sm presentation-next" @click="onNext">
          {{ isLastPage ? t('pres_ui_finish') : t('pres_ui_next') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'

const props = defineProps({
  open: { type: Boolean, default: false },
  presentation: { type: Object, default: null },
  isReplay: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'complete'])

const { t } = useI18n()
const currentPageIndex = ref(0)
const isVisible = ref(false)
const isClosing = ref(false)

const currentPage = computed(() => props.presentation?.pages?.[currentPageIndex.value] || null)
const isLastPage = computed(() => currentPageIndex.value >= (props.presentation?.pages?.length || 1) - 1)
const isFirstPage = computed(() => currentPageIndex.value === 0)

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    currentPageIndex.value = 0
    isClosing.value = false
    // Trigger enter animation on next frame
    requestAnimationFrame(() => {
      isVisible.value = true
    })
  } else {
    isVisible.value = false
  }
}, { immediate: true })

function onNext() {
  if (isLastPage.value) {
    finish()
  } else {
    currentPageIndex.value++
  }
}

function onSkip() {
  finish()
}

function finish() {
  isClosing.value = true
  isVisible.value = false
  setTimeout(() => {
    emit('complete')
    emit('close')
  }, 400)
}
</script>

<style scoped>
/* ═══════════════════════════════════════════════════════════════════════
   Presentation Modal — Full-screen narrative overlay
   ═══════════════════════════════════════════════════════════════════════ */

.presentation-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.92);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  opacity: 0;
  transition: opacity 0.4s ease;
}

.presentation-overlay.visible {
  opacity: 1;
}

.presentation-overlay.closing {
  opacity: 0;
  transition: opacity 0.4s ease;
}

.presentation-modal {
  position: relative;
  max-width: 680px;
  width: 92%;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--glass-border);
  box-shadow:
    0 24px 80px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(255, 255, 255, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  overflow: hidden;
  animation: presSlideUp 0.5s cubic-bezier(0.23, 1, 0.32, 1);
}

@keyframes presSlideUp {
  from {
    opacity: 0;
    transform: translateY(40px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Skip button — top-right corner */
.presentation-skip {
  position: absolute;
  top: 12px;
  right: 14px;
  z-index: 10;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: var(--text-muted);
  font-family: 'Outfit', sans-serif;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 5px 14px;
  border-radius: 16px;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  transition: all 0.2s ease;
}

.presentation-skip:hover {
  background: rgba(255, 255, 255, 0.14);
  color: var(--text-primary);
}

/* Replay badge — top-left corner */
.presentation-replay-badge {
  position: absolute;
  top: 12px;
  left: 14px;
  z-index: 10;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: var(--text-muted);
  font-family: 'Outfit', sans-serif;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 5px 14px;
  border-radius: 16px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

/* Content area — image + text */
.presentation-content {
  display: flex;
  flex-direction: column;
}

.presentation-image {
  width: 100%;
  height: 280px;
  overflow: hidden;
  position: relative;
  background: linear-gradient(135deg, rgba(74, 222, 128, 0.08), rgba(245, 158, 11, 0.06));
}

.presentation-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  animation: presFadeIn 0.6s ease;
}

@keyframes presFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.presentation-image::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: linear-gradient(to top, var(--bg-secondary), transparent);
  pointer-events: none;
}

.presentation-text {
  padding: var(--spacing-lg) var(--spacing-xl);
  min-height: 100px;
}

.presentation-text p {
  font-size: 1rem;
  line-height: 1.75;
  color: var(--text-secondary);
  margin: 0;
  animation: presFadeIn 0.5s ease;
}

/* Footer — back, dots, next */
.presentation-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-xl) var(--spacing-lg);
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid var(--glass-border);
}

.presentation-dots {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.presentation-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.presentation-dot.active {
  background: var(--color-primary);
  box-shadow: 0 0 8px var(--color-primary-light);
  transform: scale(1.3);
}

.presentation-back,
.presentation-next {
  min-width: 80px;
}

/* Button base styles (scoped fallback) */
.btn {
  font-family: 'Outfit', sans-serif;
  font-weight: 600;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-sm {
  padding: 8px 16px;
  font-size: 0.85rem;
}

.btn-primary {
  background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
  color: white;
  border: 1px solid rgba(251, 191, 36, 0.35);
  box-shadow: 0 2px 8px rgba(217, 119, 6, 0.3);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  box-shadow: 0 4px 12px rgba(217, 119, 6, 0.5);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-secondary);
  border: 1px solid var(--glass-border);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.14);
  color: var(--text-primary);
}

/* ═══ Mobile Bottom-Sheet Adaptation ════════════════════════════════════ */
@media (max-width: 600px) {
  .presentation-overlay {
    align-items: flex-end;
  }

  .presentation-modal {
    width: 100%;
    max-width: 100%;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    animation: presSlideUpSheet 0.5s cubic-bezier(0.23, 1, 0.32, 1);
  }

  @keyframes presSlideUpSheet {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }

  .presentation-image {
    height: 200px;
  }

  .presentation-text {
    padding: var(--spacing-md);
  }

  .presentation-text p {
    font-size: 0.92rem;
  }

  .presentation-footer {
    padding: var(--spacing-sm) var(--spacing-md) var(--spacing-md);
  }
}
</style>
