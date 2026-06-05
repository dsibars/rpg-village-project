<template>
  <span class="spinner" :class="`spinner--${size}`" :style="{ borderColor: color }"></span>
</template>

<script setup>
defineProps({
  size: { type: String, default: 'md', validator: v => ['sm', 'md', 'lg'].includes(v) },
  color: { type: String, default: 'currentColor' }
})
</script>

<style scoped>
.spinner {
  display: inline-block;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner--sm { width: 12px; height: 12px; }
.spinner--md { width: 20px; height: 20px; }
.spinner--lg { width: 32px; height: 32px; }

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
