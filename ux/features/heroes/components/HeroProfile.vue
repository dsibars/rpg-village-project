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
          <span><strong>{{ t('heroes_uxelm_activity') }}:</strong></span>
          <span class="status-badge" :class="isIdle ? 'idle' : 'busy'" :title="activityTitle">
            {{ activityTitle }}
          </span>
        </div>

        <div class="hero-status-row">
          <span><strong>{{ t('heroes_uxelm_experience') }}:</strong></span>
          <span class="status-value">{{ hero.exp || 0 }} / {{ hero.expToNextLevel || '?' }}</span>
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
.skill-points-alert {
  margin-top: 6px;
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.3);
  padding: 6px 10px;
  border-radius: var(--radius-md);
  font-size: 0.9rem;
}
.skill-points-alert.locked {
  background: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.3);
  color: var(--warning, #f59e0b);
}
</style>

