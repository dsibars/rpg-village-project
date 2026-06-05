<template>
  <span class="icon" :class="`icon--${size}`" :style="colorStyle">{{ name }}</span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: { type: String, required: true },
  size: { type: String, default: 'md', validator: v => ['sm', 'md', 'lg'].includes(v) },
  color: { type: String, default: null }
})

const colorStyle = computed(() => props.color ? { color: props.color } : {})
</script>

<style scoped>
.icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.icon--sm { font-size: 0.875rem; }
.icon--md { font-size: 1.25rem; }
.icon--lg { font-size: 1.75rem; }
</style>
