<template>
  <div class="hero-profile">
    <div class="profile-left">
      <div class="portrait">
        <img
          :src="avatarSrc"
          :alt="hero.name"
          class="portrait-img"
          @error="$event.target.style.display='none'; $event.target.nextElementSibling.style.display='flex'"
        />
        <span class="portrait-fallback" style="display: none;">🦸</span>
      </div>

      <div class="profile-info">
        <div class="profile-title-group">
          <span class="origin-badge">{{ originName }}</span>
          <h2 class="hero-name">{{ hero.name }} <span class="hero-level-inline">({{ t('shared_uxelm_level') }} {{ hero.level }})</span></h2>
        </div>
        <p class="origin-desc"><em>{{ originDesc }}</em></p>

        <div class="status-row">
          <span class="status-label"><strong>{{ t('heroes_uxelm_activity') }}:</strong></span>
          <span class="status-badge" :class="isIdle ? 'idle' : 'busy'" :title="activityTitle">
            {{ activityTitle }}
          </span>
        </div>

        <div class="status-row">
          <span class="status-label"><strong>{{ t('heroes_uxelm_experience') }}:</strong></span>
          <span class="status-value">{{ hero.exp || 0 }} / {{ hero.expToNextLevel || '?' }}</span>
        </div>

        <div class="skill-points-info">
          <div v-if="(hero.skillPoints || 0) > 0 && isIdle" class="skill-alert">
            <strong>{{ t('heroes_uxelm_skill_point').replace('{amount}', hero.skillPoints) }}</strong>
            <span class="skill-hint"> · {{ t('heroes_uxelm_skill_spend_hint') }}</span>
          </div>
          <div v-else-if="(hero.skillPoints || 0) > 0 && !isIdle" class="skill-alert locked">
            <strong>{{ t('heroes_uxelm_skill_point').replace('{amount}', hero.skillPoints) }}</strong>
            <span class="skill-hint"> · {{ t('heroes_uxelm_skill_busy') }}</span>
          </div>
          <div v-else-if="nextMilestone" class="skill-alert muted">
            {{ t('heroes_uxelm_skill_next_milestone').replace('{level}', nextMilestone) }}
          </div>
          <div v-else class="skill-alert muted">
            {{ t('heroes_uxelm_skill_max_families') }}
          </div>
        </div>

        <div v-if="showStatAlert" class="alert" :class="{ busy: !isIdle }">
          <strong v-if="isIdle">
            {{ t('heroes_uxelm_stat_point_available').replace('{amount}', hero.statPoints) }}
          </strong>
          <strong v-else>
            {{ t('heroes_uxelm_stat_point_busy').replace('{amount}', hero.statPoints) }}
          </strong>
        </div>

        <HeroActionBar
          :hero="hero"
          :infrastructure="infrastructure"
          :heroes="heroes"
          @action="$emit('openAction', $event)"
        />
      </div>
    </div>

    <div class="profile-right">
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

const originName = computed(() => t(`heroes_info_origin_${originKey.value}`))
const originDesc = computed(() => t(`heroes_info_origin_${originKey.value}_desc`))

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
    origin_arcane_initiate: 'origin_arcane_initiate.webp'
  }
  const mapped = fallbackMap[props.hero.origin] || 'arthur.webp'
  return `assets/heroes/${mapped}`
})

const nextMilestone = computed(() => {
  const milestones = props.hero.skillPointMilestones || [1, 5, 10, 15, 20, 25]
  return milestones.find(m => m > props.hero.level)
})
</script>

<style scoped>
.hero-profile {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: var(--spacing-lg);
  height: 100%;
}

.profile-left {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.portrait {
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 4rem;
  background: var(--bg-card);
  border: 2px solid var(--glass-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.portrait-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.portrait-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.profile-title-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.origin-badge {
  display: inline-block;
  width: fit-content;
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--color-primary);
  color: white;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.hero-name {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 1.5rem;
  color: var(--text-primary);
}

.hero-level-inline {
  font-size: 0.875rem;
  color: var(--text-muted);
  font-weight: 400;
}

.hero-level {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.875rem;
}

.origin-desc {
  margin: var(--spacing-xs) 0;
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-style: italic;
}

.status-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 0.875rem;
}

.status-label {
  color: var(--text-secondary);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
}

.status-value {
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.alert {
  padding: var(--spacing-sm) var(--spacing-md);
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  color: var(--text-primary);
}

.alert.busy {
  background: rgba(234, 179, 8, 0.1);
  border-color: rgba(234, 179, 8, 0.3);
}

.skill-points-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.skill-alert {
  padding: var(--spacing-sm) var(--spacing-md);
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  color: var(--text-primary);
}

.skill-alert.locked {
  background: rgba(234, 179, 8, 0.1);
  border-color: rgba(234, 179, 8, 0.3);
}

.skill-alert.muted {
  background: transparent;
  border-color: var(--glass-border);
  color: var(--text-muted);
}

.skill-hint {
  color: var(--text-secondary);
  font-size: 0.8rem;
}

@media (max-width: 768px) {
  .hero-profile {
    grid-template-columns: 1fr;
  }
}
</style>
