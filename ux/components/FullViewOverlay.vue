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
import CloseButton from './CloseButton.vue'

defineEmits(['close'])
</script>

<style scoped>
.fullview-overlay {
  position: fixed;
  inset: 0;
  background: var(--bg-base);
  display: flex;
  flex-direction: column;
  z-index: 1000;
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
