<template>
  <div class="book-page-wrapper">
    <BookView ref="bookView" :book-state="bookState" @markRead="handleMarkRead" />
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue'
import { useGameState } from '@/core/composables/useGameState.js'
import { useAdapter } from '@/core/composables/useAdapter.js'
import BookView from './BookView.vue'

const bookView = ref(null)
const { dispatch } = useAdapter()

const { gameState } = useGameState()

const bookState = computed(() => gameState.value?.book || null)

function handleMarkRead(spreadFirstPage) {
  dispatch('book', 'markRead', { spreadFirstPage })
}

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
