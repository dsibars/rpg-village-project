<template>
  <div class="hero-quick-links" role="group" :aria-label="t('heroes_uxelm_skills')">
    <button
      v-for="action in visibleActions"
      :key="action.id"
      class="btn btn-secondary btn-sm"
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
  { id: 'consumables', icon: '🧪', label: t('heroes_uxelm_consumables') }
])

const visibleActions = computed(() =>
  allActions.value.filter((a) => a.visible !== false)
)
</script>

<style scoped>
/* No extra styles needed; uses global .hero-quick-links and .btn styles from heroes.css/style.css */
</style>

