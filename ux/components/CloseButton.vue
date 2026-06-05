<template>
  <button class="btn-close" @click="$emit('close')" aria-label="Close">✕</button>
</template>

<script setup>
defineEmits(['close'])
</script>

<style scoped>
.btn-close {
  background: transparent;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: var(--text-muted);
  padding: var(--spacing-xs);
  line-height: 1;
}

.btn-close:hover {
  color: var(--text-primary);
}
</style>
