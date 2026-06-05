<template>
  <nav class="footer-nav">
    <button
      v-for="item in items"
      :key="item.id"
      class="nav-btn"
      :class="{ active: current === item.id }"
      @click="$emit('navigate', item.id)"
    >
      <span class="nav-icon">{{ item.icon }}</span>
      <span class="nav-label">{{ item.label }}</span>
    </button>
  </nav>
</template>

<script setup>
const props = defineProps({
  current: { type: String, required: true },
  items: {
    type: Array,
    default: () => [
      { id: 'village', label: 'Village', icon: '\u{1F3D8}' },
      { id: 'heroes', label: 'Heroes', icon: '\u{2694}' },
      { id: 'adventure', label: 'Adventure', icon: '\u{1F5FA}' },
      { id: 'town', label: 'Town', icon: '\u{1F3EA}' }
    ]
  }
})

defineEmits(['navigate'])
</script>

<style scoped>
.footer-nav {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: var(--spacing-md);
  background: var(--bg-card);
  border-top: 1px solid var(--glass-border);
}

.nav-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: var(--spacing-sm);
  font-family: var(--font-body);
}

.nav-btn.active {
  color: var(--color-primary);
}

.nav-btn:hover {
  color: var(--text-primary);
}

.nav-icon {
  font-size: 1.25rem;
}

.nav-label {
  font-size: 0.75rem;
}
</style>
