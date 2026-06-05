<template>
  <div class="hello-world">
    <h2>{{ msg }}</h2>
    <p>Vue version: {{ vueVersion }}</p>
    <button class="btn" @click="count++">Clicked {{ count }} times</button>
  </div>
</template>

<script setup>
import { ref, version } from 'vue'

const props = defineProps({
  msg: { type: String, required: true }
})

const vueVersion = version
const count = ref(0)
</script>

<style scoped>
.hello-world {
  padding: var(--spacing-md);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
}

h2 {
  margin-top: 0;
  color: var(--color-primary-light);
}

.btn {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-family: var(--font-body);
}

.btn:hover {
  background: var(--color-primary-light);
}
</style>
