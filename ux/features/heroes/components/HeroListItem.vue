<template>
  <button
    class="hero-list-item"
    :class="{ active: selected }"
    :aria-selected="selected"
    role="option"
    @click="$emit('select', hero.id)"
  >
    <div class="item-header">
      <span class="hero-name">{{ hero.name }}</span>
      <span class="hero-level">{{ t('shared_uxelm_level') }} {{ hero.level }}</span>
    </div>
    <div class="item-origin">
      <span class="origin-badge" :title="originDesc">{{ originName }}</span>
    </div>
    <div class="item-meta">
      <span class="badge activity-badge" :title="activityTitle">
        <span class="emoji">{{ activityEmoji }}</span>
      </span>
      <span class="badge hp-badge" :title="t('heroes_info_hp') + ': ' + hero.hp + '/' + hero.maxHp">
        ❤️ {{ hero.hp }}/{{ hero.maxHp }}
      </span>
      <span class="badge stamina-badge" :title="t('heroes_info_stamina') + ': ' + hero.stamina + '/' + hero.maxStamina">
        ⚡ {{ hero.stamina }}/{{ hero.maxStamina }}
      </span>
      <span
        v-if="hasMealBuff"
        class="badge meal-badge"
        :title="t('heroes_status_meal_buff')"
      >
        🍖
      </span>
      <span v-if="hasPoints" class="badge points-badge" :title="t('heroes_uxelm_stat_point_available', { amount: hero.statPoints })">
        +{{ hero.statPoints }}
      </span>
    </div>
  </button>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'

const props = defineProps({
  hero: { type: Object, required: true },
  selected: { type: Boolean, default: false }
})

defineEmits(['select'])

const { t } = useI18n()

const isIdle = computed(() => props.hero.activity === 'idle')
const activityEmoji = computed(() => (isIdle.value ? '💤' : '⚔'))
const activityTitle = computed(() =>
  isIdle.value ? t('heroes_status_activity_idle') : t('heroes_status_activity_expedition')
)
const hasMealBuff = computed(() => (props.hero.mealBuffs || []).length > 0)
const hasPoints = computed(() => (props.hero.statPoints || 0) > 0 || (props.hero.skillPoints || 0) > 0)

const originKey = computed(() => {
  const origin = props.hero.origin || ''
  return origin.replace(/^origin_/, '')
})
const originName = computed(() => t(`heroes_info_origin_${originKey.value}`) || originKey.value)
const originDesc = computed(() => t(`heroes_info_origin_${originKey.value}_desc`) || '')
</script>

<style scoped>
.hero-list-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  width: 100%;
  padding: var(--spacing-md);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  text-align: left;
  cursor: pointer;
  font-family: var(--font-body);
  transition: border-color 0.15s ease;
}

.hero-list-item:hover {
  border-color: var(--color-primary-light);
}

.hero-list-item.active {
  border-color: var(--color-primary);
  background: rgba(74, 222, 128, 0.08);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-sm);
}

.hero-name {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hero-level {
  font-size: 0.75rem;
  color: white;
  background: var(--color-primary);
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.item-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-xs);
}

.item-origin {
  margin-bottom: 2px;
}

.origin-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: rgba(74, 222, 128, 0.1);
  color: var(--color-primary-light);
  border: 1px solid rgba(74, 222, 128, 0.2);
  cursor: help;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
}

.activity-badge {
  background: var(--bg-base);
  color: var(--text-secondary);
}

.meal-badge {
  background: rgba(234, 179, 8, 0.12);
  color: var(--text-primary);
}

.points-badge {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
  font-weight: 600;
}

.hp-badge {
  background: rgba(239, 68, 68, 0.12);
  color: #ef4444;
  font-weight: 500;
}

.stamina-badge {
  background: rgba(245, 158, 11, 0.12);
  color: #f59e0b;
  font-weight: 500;
}
</style>
