<template>
  <div class="book-page-wrapper">
    <BookView ref="bookView" :book-state="bookState" />
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue'
import { useGameState } from '@/core/composables/useGameState.js'
import BookView from './BookView.vue'

const bookView = ref(null)

const { gameState } = useGameState()

const bookState = computed(() => gameState.value?.book || null)

// When new auto-open content arrives, navigate to it
watch(() => bookState.value?.lastReadSpread, (newVal, oldVal) => {
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
