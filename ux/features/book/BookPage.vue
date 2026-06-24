<template>
  <div class="book-page-wrapper">
    <BookView ref="bookView" :book-state="bookState" @markRead="handleMarkRead" @close="handleClose" />
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick, onMounted } from 'vue'
import { useGameState } from '@/core/composables/useGameState.js'
import { useAdapter } from '@/core/composables/useAdapter.js'
import BookView from './BookView.vue'

const props = defineProps({
  activeTab: { type: [String, Number], default: null }
})

const bookView = ref(null)
const { dispatch } = useAdapter()

const { gameState } = useGameState()

const bookState = computed(() => gameState.value?.book || null)

function handleMarkRead(spreadFirstPage) {
  dispatch('book', 'markRead', { spreadFirstPage })
}

const emit = defineEmits(['close'])

function handleClose() {
  emit('close')
}

// Navigate to target page when activeTab changes (from Chronicle click-through)
watch(() => props.activeTab, (targetPage) => {
  if (targetPage && bookView.value) {
    const pageNum = Number(targetPage)
    if (!isNaN(pageNum) && pageNum > 0) {
      nextTick(() => bookView.value.goToPage?.(pageNum))
    }
  }
}, { immediate: true })

// When new content arrives (page count increases), navigate to first unread
watch(() => bookState.value?.pages?.length, (newVal, oldVal) => {
  if (newVal !== oldVal && bookView.value) {
    nextTick(() => bookView.value.goToFirstUnread?.())
  }
})
</script>

<style scoped>
.book-page-wrapper {
  height: 100%;
  overflow: hidden;
}
</style>
