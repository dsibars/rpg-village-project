<template>
  <div class="stats-grid">
    <div
      v-for="stat in stats"
      :key="stat.id"
      class="stat-row"
      :class="{ highlight: stat.hasBonus }"
    >
      <div class="stat-info">
        <strong class="stat-name">{{ stat.label }}</strong>
        <span class="stat-desc">{{ stat.desc }}</span>
      </div>
      <div class="stat-value-group">
        <span class="stat-value">{{ stat.value }}</span>
        <button
          v-if="canAllocate && stat.key"
          class="btn-assign-stat"
          :aria-label="`${t('heroes_uxelm_skill_learn')} ${stat.label}`"
          @click="$emit('allocate', stat.key)"
        >
          +
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'

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
    { id: 'hp', key: 'baseMaxHp', label: t('heroes_info_stat_hp'), desc: t('heroes_info_stat_hp_desc'), value: `${h.hp ?? 0} / ${maxHp}`, hasBonus: false },
    { id: 'mp', key: 'baseMaxMp', label: t('heroes_info_stat_mp'), desc: t('heroes_info_stat_mp_desc'), value: `${h.mp ?? 0} / ${maxMp}`, hasBonus: false },
    { id: 'stamina', key: null, label: t('heroes_info_stat_stamina'), desc: t('heroes_info_stat_stamina_desc'), value: `${h.stamina ?? 0} / ${maxStamina}`, hasBonus: false },
    { id: 'strength', key: 'baseStrength', label: t('heroes_info_stat_strength'), desc: t('heroes_info_stat_strength_desc'), value: h.strength ?? 0, hasBonus: false },
    { id: 'speed', key: 'baseSpeed', label: t('heroes_info_stat_speed'), desc: t('heroes_info_stat_speed_desc'), value: h.speed ?? 0, hasBonus: false },
    { id: 'defense', key: 'baseDefense', label: t('heroes_info_stat_defense'), desc: t('heroes_info_stat_defense_desc'), value: h.defense ?? 0, hasBonus: false },
    { id: 'magicPower', key: 'baseMagicPower', label: t('heroes_info_stat_magic_power'), desc: t('heroes_info_stat_magic_power_desc'), value: h.magicPower ?? 0, hasBonus: false }
  ]
})
</script>

<style scoped>
.stats-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.stat-row {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  transition: border-color 0.15s ease;
}

.stat-row.highlight {
  border-color: var(--color-primary-light);
  background: rgba(99, 102, 241, 0.08);
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-name {
  font-size: 0.9rem;
  color: var(--text-primary);
}

.stat-desc {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.stat-value-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.stat-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.btn-assign-stat {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  border: none;
  background: var(--color-primary);
  color: white;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  line-height: 1;
}

.btn-assign-stat:hover {
  background: var(--color-primary-light);
}
</style>

