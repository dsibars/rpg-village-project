<template>
  <div class="app-root">
    <h1>RPG Village — Vue App Placeholder</h1>
    <p>If you see this, Vue is compiling and mounting correctly.</p>
    <HelloWorld msg="Vue 3 is ready" />
  </div>
</template>

<script setup>
import HelloWorld from './components/HelloWorld.vue'

defineProps({
  engine: { type: Object, default: null }
})
</script>

<style scoped>
.app-root {
  font-family: var(--font-body);
  color: var(--text-primary);
  background: var(--bg-base);
  padding: var(--spacing-lg);
  min-height: 100vh;
}

h1 {
  font-family: var(--font-heading);
  color: var(--color-primary);
}
</style>
