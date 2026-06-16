<template>
  <div class="tab-nav" role="tablist" aria-label="Section tabs">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      class="tab-btn"
      :class="{ active: modelValue === tab.id }"
      role="tab"
      :aria-selected="modelValue === tab.id ? 'true' : 'false'"
      @click="$emit('update:modelValue', tab.id)"
    >
      <span v-if="tab.icon" class="tab-icon" aria-hidden="true">{{ tab.icon }}</span>
      <span class="tab-label">{{ tab.label }}</span>
    </button>
  </div>
</template>

<script setup>
defineProps({
  tabs: { type: Array, required: true },
  modelValue: { type: String, required: true }
})

defineEmits(['update:modelValue'])
</script>

<style scoped>
.tab-nav {
  display: flex;
  gap: var(--spacing-xs);
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--glass-border);
  overflow-x: auto;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  color: var(--text-muted);
  cursor: pointer;
  font-family: var(--font-body);
  white-space: nowrap;
}

.tab-btn.active {
  background: var(--color-primary);
  color: white;
}

.tab-btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.tab-btn.active:focus-visible {
  outline-color: white;
}

.tab-btn:hover:not(.active) {
  background: var(--bg-card);
  color: var(--text-primary);
}

.tab-icon {
  font-size: 1rem;
}

.tab-label {
  font-size: 0.875rem;
}
</style>
