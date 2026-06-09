<template>
  <div class="empty-state">
    <Icon v-if="icon" :name="icon" size="lg" class="empty-icon" />
    <h3 v-if="title" class="empty-title">{{ title }}</h3>
    <p v-if="message" class="empty-message">{{ message }}</p>
    <Button
      v-if="actionLabel"
      variant="secondary"
      @click="$emit('action')"
    >{{ actionLabel }}</Button>
  </div>
</template>

<script setup>
import Icon from './Icon.vue'
import Button from './Button.vue'

defineProps({
  icon: { type: String, default: null },
  title: { type: String, default: null },
  message: { type: String, default: null },
  actionLabel: { type: String, default: null }
})

defineEmits(['action'])
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  text-align: center;
  color: var(--text-muted);
}

.empty-icon {
  margin-bottom: var(--spacing-md);
  opacity: 0.6;
}

.empty-title {
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--text-secondary);
  font-family: var(--font-heading);
}

.empty-message {
  margin: 0 0 var(--spacing-md) 0;
  font-size: 0.875rem;
  max-width: 300px;
}
</style>
