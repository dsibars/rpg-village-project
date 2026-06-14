<template>
  <div class="hero-profile">
    <div class="hero-profile-left">
      <div class="hero-portrait-container">
        <img
          :src="avatarSrc"
          :alt="hero.name"
          class="hero-portrait-img"
          @error="$event.target.style.display='none'; $event.target.nextElementSibling.style.display='flex'"
        />
        <span class="portrait-fallback" style="display: none;">🦸</span>
      </div>

      <div class="hero-detail-info">
        <div class="profile-title-group">
          <span class="profile-badge">{{ originName }}</span>
          <h2 class="hero-name">
            {{ hero.name }}
            <span class="hero-level-text">({{ t('shared_uxelm_level') }} {{ hero.level }})</span>
          </h2>
        </div>
        <p class="hero-origin-desc"><em>{{ originDesc }}</em></p>

        <div class="hero-status-row">
          <span class="status-col">
            <strong>{{ t('heroes_uxelm_activity') }}:</strong>
            <span class="status-badge" :class="isIdle ? 'idle' : 'busy'" :title="activityTitle">
              {{ activityTitle }}
            </span>
          </span>
          <span class="status-col">
            <strong>{{ t('heroes_uxelm_experience') }}:</strong>
            <span class="status-value">{{ hero.exp || 0 }} / {{ hero.expToNextLevel || '?' }}</span>
          </span>
        </div>

        <div class="skill-points-alert" :class="{ locked: !isIdle }">
          <strong>{{ skillAlertStrong }}</strong>{{ skillAlertSuffix }}
        </div>

        <HeroActionBar
          :hero="hero"
          :infrastructure="infrastructure"
          :heroes="heroes"
          @action="$emit('openAction', $event)"
        />
      </div>
    </div>

    <div class="hero-profile-right">
      <div v-if="showStatAlert" class="stat-points-alert" :class="{ locked: !isIdle }">
        <strong v-if="isIdle">
          {{ t('heroes_uxelm_stat_point_available').replace('{amount}', hero.statPoints) }}
        </strong>
        <strong v-else>
          {{ t('heroes_uxelm_stat_point_busy').replace('{amount}', hero.statPoints) }}
        </strong>
      </div>
      <HeroStatsGrid :hero="hero" @allocate="$emit('allocateStat', $event)" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import HeroActionBar from './HeroActionBar.vue'
import HeroStatsGrid from './HeroStatsGrid.vue'

const props = defineProps({
  hero: { type: Object, required: true },
  infrastructure: { type: Object, default: () => ({}) },
  heroes: { type: Array, default: () => [] }
})

defineEmits(['allocateStat', 'openAction'])

const { t } = useI18n()

const isIdle = computed(() => props.hero.activity === 'idle')

const activityTitle = computed(() =>
  isIdle.value ? t('heroes_status_activity_idle') : t('heroes_status_activity_expedition')
)

const originKey = computed(() => {
  const origin = props.hero.origin || ''
  const id = origin.replace(/^origin_/, '')
  return id || 'warrior'
})

const originName = computed(() => {
  const key = `heroes_info_origin_${originKey.value}`
  const translated = t(key)
  return translated === key ? key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : translated
})
const originDesc = computed(() => {
  const key = `heroes_info_origin_${originKey.value}_desc`
  const translated = t(key)
  return translated === key ? '' : translated
})

const showStatAlert = computed(() => (props.hero.statPoints || 0) > 0)

const avatarSrc = computed(() => {
  if (props.hero.avatar) {
    return `assets/heroes/${props.hero.avatar}`
  }
  const fallbackMap = {
    origin_warrior: 'origin_warrior.webp',
    origin_guard: 'origin_guard.webp',
    origin_thief: 'origin_thief.webp',
    origin_monk: 'origin_monk.webp',
    origin_clown: 'origin_clown.webp',
    origin_poet: 'origin_poet.webp',
    origin_farmer: 'origin_farmer.webp',
    origin_cook: 'origin_cook.webp',
    origin_arcane_initiate: 'origin_arcane_initiate.webp',
    origin_ranger: 'origin_warrior.webp'
  }
  const mapped = fallbackMap[props.hero.origin] || 'arthur.webp'
  return `assets/heroes/${mapped}`
})

const nextMilestone = computed(() => {
  const milestones = props.hero.skillPointMilestones || [1, 5, 10, 15, 20, 25]
  return milestones.find(m => m > props.hero.level)
})

const skillAlertStrong = computed(() => {
  if ((props.hero.skillPoints || 0) > 0 && isIdle.value) {
    return t('heroes_uxelm_skill_point').replace('{amount}', props.hero.skillPoints)
  } else if (nextMilestone.value) {
    return t('heroes_uxelm_skill_next_milestone').replace('{level}', nextMilestone.value)
  } else {
    return t('heroes_uxelm_skill_max_families')
  }
})

const skillAlertSuffix = computed(() => {
  let suffix = ''
  if ((props.hero.skillPoints || 0) > 0 && isIdle.value) {
    suffix = ' · ' + t('heroes_uxelm_skill_spend_hint')
  }
  if (!isIdle.value) {
    suffix += ' (' + t('heroes_uxelm_skill_busy') + ')'
  }
  return suffix
})
</script>

<style scoped>
.hero-profile {
  display: grid;
  grid-template-columns: 320px 1fr;
  grid-template-rows: 1fr;
  gap: var(--spacing-lg);
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.hero-profile-left,
.hero-profile-right {
  min-width: 0;
}

.hero-profile-left {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  min-height: 0;
  overflow-y: auto;
}

.hero-profile-right {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  min-height: 0;
  overflow-y: auto;
}

.hero-portrait-container {
  width: 100%;
  max-width: 280px;
  margin: 0 auto;
  aspect-ratio: 1;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--bg-card);
  border: 2px solid var(--glass-border);
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-portrait-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.portrait-fallback {
  font-size: 4rem;
}

.hero-detail-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.profile-title-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.profile-badge {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-primary);
  font-weight: 600;
}

.hero-name {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 1.5rem;
  color: var(--text-primary);
}

.hero-level-text {
  font-size: 0.9rem;
  color: var(--text-muted);
  font-weight: 400;
}

.hero-origin-desc {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.hero-status-row {
  display: flex;
  gap: var(--spacing-lg);
  flex-wrap: wrap;
}

.status-col {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.status-badge {
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-weight: 600;
}

.status-badge.idle {
  background: rgba(76, 175, 80, 0.15);
  color: #4caf50;
}

.status-badge.busy {
  background: rgba(244, 67, 54, 0.15);
  color: #f44336;
}

.skill-points-alert {
  margin-top: 6px;
  background: rgba(74, 222, 128, 0.1);
  border: 1px solid rgba(74, 222, 128, 0.3);
  padding: 6px 10px;
  border-radius: var(--radius-md);
  font-size: 0.9rem;
}
.skill-points-alert.locked {
  background: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.3);
  color: var(--warning, #f59e0b);
}

.stat-points-alert {
  background: rgba(76, 175, 80, 0.1);
  border: 1px solid rgba(76, 175, 80, 0.3);
  padding: 8px 12px;
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  margin-bottom: var(--spacing-sm);
}

.stat-points-alert.locked {
  background: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.3);
  color: var(--warning, #f59e0b);
}

@media (max-width: 900px) {
  .hero-profile {
    grid-template-columns: 260px 1fr;
    gap: var(--spacing-md);
  }
}

@media (max-width: 768px) {
  .hero-profile {
    grid-template-columns: 1fr;
  }
}
</style>

