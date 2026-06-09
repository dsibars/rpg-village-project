<template>
  <div class="resource-bar">
    <div class="resource">
      <Icon name="🪙" size="sm" />
      <span class="resource-value">{{ gold }}</span>
    </div>
    <div class="resource">
      <Icon name="🪵" size="sm" />
      <span class="resource-value">{{ wood }}</span>
    </div>
    <div class="resource">
      <Icon name="👥" size="sm" />
      <span class="resource-value">{{ population }} / {{ maxPopulation }}</span>
    </div>
  </div>
</template>

<script setup>
import Icon from './Icon.vue'

defineProps({
  gold: { type: Number, default: 0 },
  wood: { type: Number, default: 0 },
  population: { type: Number, default: 0 },
  maxPopulation: { type: Number, default: 0 }
})
</script>

<style scoped>
.resource-bar {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.resource {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--text-primary);
  font-size: 0.875rem;
}

.resource-value {
  font-weight: 500;
}
</style>
