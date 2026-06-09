<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-body">
      <header class="modal-header">
        <h3 v-if="title">{{ title }}</h3>
        <CloseButton @close="$emit('close')" />
      </header>
      <div class="modal-content">
        <slot />
      </div>
      <footer v-if="$slots.footer" class="modal-footer">
        <slot name="footer" />
      </footer>
    </div>
  </div>
</template>

<script setup>
import CloseButton from './CloseButton.vue'

defineProps({
  title: { type: String, default: '' }
})

defineEmits(['close'])
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: var(--bg-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-body {
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--glass-border);
}

.modal-header h3 {
  margin: 0;
  font-family: var(--font-heading);
  color: var(--text-primary);
}

.modal-content {
  padding: var(--spacing-md);
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: var(--spacing-md);
  border-top: 1px solid var(--glass-border);
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
}
</style>
