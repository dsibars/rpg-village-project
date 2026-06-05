<template>
  <div class="hero-profile">
    <div class="profile-left">
      <div class="portrait">\u{1F9B8}</div>

      <div class="profile-info">
        <span class="origin-badge">{{ originName }}</span>
        <h2 class="hero-name">{{ hero.name }}</h2>
        <p class="hero-level">{{ t('shared_uxelm_level') }} {{ hero.level }}</p>
        <p class="origin-desc">{{ originDesc }}</p>

        <div class="status-row">
          <span class="status-label">{{ t('heroes_uxelm_activity') }}:</span>
          <span class="status-badge" :title="activityTitle">
            <span class="status-emoji">{{ activityEmoji }}</span>
            {{ activityTitle }}
          </span>
        </div>

        <div class="status-row">
          <span class="status-label">{{ t('heroes_uxelm_experience') }}:</span>
          <span class="status-value">{{ hero.exp || 0 }} XP</span>
        </div>

        <div v-if="(hero.skillPoints || 0) > 0" class="alert skill-alert">
          <strong>{{ t('heroes_uxelm_skill_point', { amount: hero.skillPoints }) }}</strong>
        </div>

        <div v-if="showStatAlert" class="alert" :class="{ busy: !isIdle }">
          <strong v-if="isIdle">
            {{ t('heroes_uxelm_stat_point_available', { amount: hero.statPoints }) }}
          </strong>
          <strong v-else>
            {{ t('heroes_uxelm_stat_point_busy', { amount: hero.statPoints }) }}
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

const activityEmoji = computed(() => (isIdle.value ? '\u{1F4A4}' : '\u{2694}'))
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
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
}

.profile-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
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
  font-size: 1.75rem;
  color: var(--text-primary);
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

.skill-alert {
  background: rgba(99, 102, 241, 0.1);
  border-color: rgba(99, 102, 241, 0.3);
}

@media (max-width: 768px) {
  .hero-profile {
    grid-template-columns: 1fr;
  }
}
</style>
