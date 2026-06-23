<template>
  <div class="modal-overlay" @click.self="!props.tutorialLocked && $emit('close')">
    <div class="modal-body">
      <header class="modal-header">
        <h3 v-if="title">{{ title }}</h3>
        <CloseButton :disabled="tutorialLocked" @close="$emit('close')" />
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
import { onMounted, onUnmounted } from 'vue'
import CloseButton from './CloseButton.vue'

const props = defineProps({
  title: { type: String, default: '' },
  tutorialLocked: { type: Boolean, default: false }
})

const emit = defineEmits(['close'])

function onKeydown(e) {
  if (e.key === 'Escape' && !props.tutorialLocked) {
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
