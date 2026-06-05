<template>
  <FullViewOverlay
    v-if="open && presentation"
    :show-close="false"
    @close="$emit('close')"
  >
    <template #icon>✨</template>
    <template #title>{{ t('shared_uxelm_story') }}</template>

    <div class="presentation-viewer">
      <div class="presentation-page">
        <div
          v-if="currentPage?.image"
          class="page-image"
          :style="{ backgroundImage: `url(${currentPage.image})` }"
        />
        <div class="page-text">
          <p>{{ t(currentPage?.textKey || '') }}</p>
        </div>
      </div>

      <div class="page-indicator">
        <span
          v-for="(_, idx) in presentation.pages"
          :key="idx"
          class="dot"
          :class="{ active: idx === currentPageIndex }"
        />
      </div>

      <div class="page-nav">
        <Button
          v-if="currentPageIndex > 0"
          variant="secondary"
          size="sm"
          @click="currentPageIndex--"
        >
          {{ t('shared_uxelm_back') }}
        </Button>
        <Button
          variant="primary"
          size="sm"
          @click="onNext"
        >
          {{ isLastPage ? t('shared_uxelm_continue') : t('shared_uxelm_next') }}
        </Button>
      </div>
    </div>
  </FullViewOverlay>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import FullViewOverlay from '@/components/FullViewOverlay.vue'
import Button from '@/components/Button.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  presentation: { type: Object, default: null }
})

const emit = defineEmits(['close', 'complete'])

const { t } = useI18n()
const currentPageIndex = ref(0)

const currentPage = computed(() => props.presentation?.pages?.[currentPageIndex.value] || null)
const isLastPage = computed(() => currentPageIndex.value >= (props.presentation?.pages?.length || 1) - 1)

watch(() => props.open, (isOpen) => {
  if (isOpen) currentPageIndex.value = 0
})

function onNext() {
  if (isLastPage.value) {
    emit('complete')
  } else {
    currentPageIndex.value++
  }
}
</script>

<style scoped>
.presentation-viewer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
  max-width: 600px;
  margin: 0 auto;
}

.presentation-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
  width: 100%;
}

.page-image {
  width: 100%;
  max-width: 480px;
  aspect-ratio: 16 / 9;
  background-size: cover;
  background-position: center;
  border-radius: var(--radius-lg);
  border: 1px solid var(--glass-border);
}

.page-text {
  text-align: center;
  font-size: 1rem;
  line-height: 1.6;
  color: var(--text-secondary);
  max-width: 480px;
}

.page-text p {
  margin: 0;
}

.page-indicator {
  display: flex;
  gap: var(--spacing-xs);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-muted);
  opacity: 0.4;
  transition: opacity 0.2s;
}

.dot.active {
  opacity: 1;
  background: var(--color-primary);
}

.page-nav {
  display: flex;
  gap: var(--spacing-md);
}
</style>
