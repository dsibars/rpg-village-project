<template>
  <div class="hero-stats-grid">
    <div
      v-for="stat in stats"
      :key="stat.id"
      class="stat-row"
      :class="{ highlight: stat.hasBonus }"
    >
      <span class="stat-label">{{ stat.label }}</span>
      <span class="stat-value">{{ stat.value }}</span>
      <Button
        v-if="canAllocate && stat.key"
        variant="primary"
        size="sm"
        class="stat-add-btn"
        :aria-label="`${t('heroes_uxelm_skill_learn')} ${stat.label}`"
        @click="$emit('allocate', stat.key)"
      >
        +
      </Button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import Button from '@/components/Button.vue'

const props = defineProps({
  hero: { type: Object, required: true }
})

defineEmits(['allocate'])

const { t } = useI18n()

const canAllocate = computed(() => {
  const points = props.hero.statPoints || 0
  const idle = props.hero.activity === 'idle'
  return points > 0 && idle
})

const stats = computed(() => {
  const h = props.hero
  const maxHp = h.maxHp ?? h.hp ?? 0
  const maxMp = h.maxMp ?? h.mp ?? 0
  const maxStamina = h.maxStamina ?? h.stamina ?? 0

  return [
    { id: 'hp', key: 'baseMaxHp', label: t('heroes_info_stat_hp'), value: `${h.hp ?? 0} / ${maxHp}`, hasBonus: false },
    { id: 'mp', key: 'baseMaxMp', label: t('heroes_info_stat_mp'), value: `${h.mp ?? 0} / ${maxMp}`, hasBonus: false },
    { id: 'stamina', key: null, label: t('heroes_info_stat_stamina'), value: `${h.stamina ?? 0} / ${maxStamina}`, hasBonus: false },
    { id: 'strength', key: 'baseStrength', label: t('heroes_info_stat_strength'), value: h.strength ?? 0, hasBonus: false },
    { id: 'speed', key: 'baseSpeed', label: t('heroes_info_stat_speed'), value: h.speed ?? 0, hasBonus: false },
    { id: 'defense', key: 'baseDefense', label: t('heroes_info_stat_defense'), value: h.defense ?? 0, hasBonus: false },
    { id: 'magicPower', key: 'baseMagicPower', label: t('heroes_info_stat_magic_power'), value: h.magicPower ?? 0, hasBonus: false }
  ]
})
</script>

<style scoped>
.hero-stats-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-sm);
}

.stat-row {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
}

.stat-label {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.stat-value {
  color: var(--text-primary);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.stat-add-btn {
  min-width: 32px;
  padding: var(--spacing-xs) var(--spacing-sm);
  font-weight: 700;
}
</style>
