<template>
  <div class="fullview-overlay">
    <header class="fullview-header">
      <div class="fullview-title">
        <span v-if="$slots.icon" class="fullview-icon">
          <slot name="icon" />
        </span>
        <h2><slot name="title" /></h2>
      </div>
      <CloseButton @close="$emit('close')" />
    </header>
    <div class="fullview-body">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import CloseButton from './CloseButton.vue'

const emit = defineEmits(['close'])

function onKeydown(e) {
  if (e.key === 'Escape') {
    emit('close')
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.fullview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(18, 29, 21, 0.82); /* Translucent forest glass */
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  animation: overlayIn 0.3s cubic-bezier(0.25, 1, 0.5, 1) both;
}

@keyframes overlayIn {
  0% { opacity: 0; backdrop-filter: blur(0px); }
  100% { opacity: 1; backdrop-filter: blur(10px); }
}

.fullview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--glass-border);
  flex-shrink: 0;
}

.fullview-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.fullview-title h2 {
  margin: 0;
  font-family: var(--font-heading);
  color: var(--text-primary);
}

.fullview-icon {
  font-size: 1.5rem;
}

.fullview-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-lg);
}
</style>
