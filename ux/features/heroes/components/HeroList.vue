<template>
  <div class="hero-list" role="listbox" :aria-label="t('heroes_uxelm_list_title')">
    <HeroListItem
      v-for="hero in heroes"
      :key="hero.id"
      :hero="hero"
      :selected="hero.id === selectedId"
      @select="$emit('select', $event)"
    />
  </div>
</template>

<script setup>
import { useI18n } from '@/core/composables/useI18n.js'
import HeroListItem from './HeroListItem.vue'

defineProps({
  heroes: { type: Array, required: true },
  selectedId: { type: String, default: null }
})

defineEmits(['select'])

const { t } = useI18n()
</script>

<style scoped>
.hero-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  overflow-y: auto;
  padding-right: var(--spacing-xs);
  max-height: 100%;
}
</style>
