<template>
  <div class="hero-quick-links" role="group" :aria-label="t('heroes_uxelm_skills')">
    <button
      v-for="action in visibleActions"
      :key="action.id"
      class="btn btn-secondary btn-sm"
      :data-tutorial-target="'hero_action_' + action.id"
      @click="$emit('action', action.id)"
    >
      {{ action.icon }} {{ action.label }}
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'

const { t } = useI18n()

const props = defineProps({
  hero: { type: Object, required: true },
  infrastructure: { type: Object, default: () => ({}) },
  heroes: { type: Array, default: () => [] }
})

const emit = defineEmits(['action'])

const allActions = computed(() => [
  { id: 'trainer', icon: '💪', label: t('trainer_uxelm_title') },
  { id: 'magicCircle', icon: '🔮', label: t('magic_circle_uxelm_title'), visible: (props.infrastructure.arcane_sanctum || 0) >= 1 },
  { id: 'witch', icon: '🌙', label: t('witch_uxelm_title'), visible: (props.infrastructure.witchs_hut || 0) >= 1 },
  { id: 'academy', icon: '📚', label: t('academy_uxelm_title'), visible: (props.infrastructure.arcane_sanctum || 0) >= 2 },
  { id: 'hallOfFame', icon: '🏆', label: t('hall_of_fame_uxelm_title') },
  { id: 'inscription', icon: '✦', label: t('heroes_uxelm_inscription_title'), visible: !!props.hero.isInscriptionEligible },
  { id: 'gambits', icon: '🎲', label: t('gambit_uxelm_title'), visible: props.heroes.some((h) => h.level >= 5) },
  { id: 'equipment', icon: '🛡️', label: t('inventory_uxelm_equipment') },
  { id: 'skills', icon: '⚔️', label: t('heroes_uxelm_skills') },
  { id: 'consumables', icon: '💊', label: t('heroes_uxelm_consumables') }
])

const visibleActions = computed(() =>
  allActions.value.filter((a) => a.visible !== false)
)
</script>

<style scoped>
.hero-quick-links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-sm);
}

.btn-secondary {
  padding: 6px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--glass-border);
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.btn-secondary:hover {
  border-color: var(--color-primary-light);
  background: rgba(74, 222, 128, 0.1);
}
</style>

