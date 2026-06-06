<template>
  <div class="hero-action-bar" role="group" :aria-label="t('heroes_uxelm_skills')">
    <Button
      v-for="action in visibleActions"
      :key="action.id"
      variant="secondary"
      size="sm"
      class="action-btn"
      @click="$emit('action', action.id)"
    >
      <span class="action-icon">{{ action.icon }}</span>
      <span class="action-label">{{ action.label }}</span>
    </Button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import Button from '@/components/Button.vue'

const { t } = useI18n()

const props = defineProps({
  hero: { type: Object, required: true },
  infrastructure: { type: Object, default: () => ({}) },
  heroes: { type: Array, default: () => [] }
})

const emit = defineEmits(['action'])

const allActions = computed(() => [
  { id: 'skills', icon: '⚔', label: t('heroes_uxelm_skills') },
  { id: 'equipment', icon: '🛡', label: t('inventory_uxelm_equipment') },
  { id: 'inscription', icon: '✦', label: t('heroes_uxelm_inscription_title'), visible: !!props.hero.isInscriptionEligible },
  { id: 'consumables', icon: '🧪', label: t('heroes_uxelm_consumables') },
  { id: 'trainer', icon: '💪', label: t('trainer_uxelm_title') },
  { id: 'magicCircle', icon: '🔮', label: t('magic_circle_uxelm_title'), visible: (props.infrastructure.arcane_sanctum || 0) >= 1 },
  { id: 'witch', icon: '🌙', label: t('witch_uxelm_title'), visible: (props.infrastructure.witchs_hut || 0) >= 1 },
  { id: 'academy', icon: '📚', label: t('academy_uxelm_title'), visible: (props.infrastructure.arcane_sanctum || 0) >= 2 },
  { id: 'hallOfFame', icon: '🏆', label: t('hall_of_fame_uxelm_title') },
  { id: 'gambits', icon: '🎲', label: t('gambit_uxelm_title'), visible: props.heroes.some((h) => h.level >= 5) }
])

const visibleActions = computed(() =>
  allActions.value.filter((a) => a.visible !== false)
)
</script>

<style scoped>
.hero-action-bar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.action-icon {
  font-size: 1rem;
}

.action-label {
  font-size: 0.75rem;
}
</style>
