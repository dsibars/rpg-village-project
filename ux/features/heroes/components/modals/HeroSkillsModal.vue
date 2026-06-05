<template>
  <ModalFrame
    v-if="open"
    :title="t('heroes_uxelm_skill_title', { name: hero.name })"
    @close="$emit('close')"
  >
    <div class="skills-modal">
      <div class="skills-alert" :class="{ busy: !canManageSkills }">
        <strong>{{ alertText }}</strong>
      </div>

      <div class="skills-list">
        <div
          v-for="family in knownList"
          :key="family.id"
          class="skill-item known"
          :class="{ inscribed: isInscribed }"
        >
          <div class="skill-info">
            <span class="skill-name">
              {{ familyName(family.id) }}
              <span v-if="isInscribed" class="inscribed-mark">\u{2726}</span>
            </span>
            <span class="skill-meta">
              {{ effectLabel(family) }}{{ effectLabel(family) ? ' · ' : '' }}{{ staminaCost(family) }} {{ t('shared_uxelm_stat_sta') }}
            </span>
            <div class="tier-progress">
              <div class="tier-progress-header">
                <span>{{ t('heroes_uxelm_skill_tier_progress') }}</span>
                <span>{{ tierProgress(family) }}%</span>
              </div>
              <div class="tier-bar"><div class="tier-bar-fill" :style="{ width: `${tierProgress(family)}%` }" /></div>
            </div>
          </div>
          <span class="tier-badge">{{ t('shared_uxelm_tier') }} {{ familyTier(family) }}</span>
        </div>

        <div v-if="lockedList.length" class="locked-divider">{{ t('heroes_uxelm_skill_locked_section') }}</div>

        <div v-for="family in lockedList" :key="family.id" class="skill-item locked">
          <div class="skill-info">
            <span class="skill-name">\u{1F512} {{ familyName(family.id) }}</span>
            <span class="skill-meta">
              {{ effectLabel(family, 1) }}{{ effectLabel(family, 1) ? ' · ' : '' }}{{ family.staminaCostBase }} {{ t('shared_uxelm_stat_sta') }}
            </span>
          </div>
          <div class="skill-actions">
            <Button v-if="canLearnFamily" variant="primary" size="sm" @click="$emit('learn', family.id)">
              {{ t('heroes_uxelm_skill_learn') }}
            </Button>
            <span v-else class="locked-label">{{ t('shared_uxelm_locked') }}</span>
          </div>
        </div>
      </div>
    </div>
  </ModalFrame>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import { TECHNIQUE_FAMILIES } from '@/core/data/index.js'
import ModalFrame from '@/components/ModalFrame.vue'
import Button from '@/components/Button.vue'

const props = defineProps({
  hero: { type: Object, required: true },
  open: { type: Boolean, default: false }
})

defineEmits(['close', 'learn'])

const { t } = useI18n()

const knownIds = computed(() => new Set(props.hero.knownFamilies || ['single_strike']))
const allFamilies = Object.values(TECHNIQUE_FAMILIES)

const knownList = computed(() =>
  allFamilies
    .filter((f) => knownIds.value.has(f.id))
    .sort((a, b) => familyTier(b) - familyTier(a))
)

const lockedList = computed(() =>
  allFamilies.filter((f) => !knownIds.value.has(f.id) && f.id !== 'single_strike')
)

const canManageSkills = computed(() => props.hero.activity === 'idle')
const canLearnFamily = computed(() => {
  const known = props.hero.knownFamilies || ['single_strike']
  return canManageSkills.value && (props.hero.skillPoints || 0) > 0 && known.length < 6
})

const isInscribed = computed(() => {
  const bi = props.hero.bodyInscription
  return bi && Array.isArray(bi.glyphIds) && bi.glyphIds.length > 0
})

const milestones = computed(() => props.hero.skillPointMilestones || [1, 5, 10, 15, 20, 25])

const alertText = computed(() => {
  const points = props.hero.skillPoints || 0
  const next = milestones.value.find((m) => m > props.hero.level)
  let text = points > 0 && canManageSkills.value
    ? `${t('heroes_uxelm_skill_point', { amount: points })} · ${t('heroes_uxelm_skill_spend_hint')}`
    : next
      ? t('heroes_uxelm_skill_next_milestone', { level: next })
      : t('heroes_uxelm_skill_max_families')
  if (!canManageSkills.value) text += ` (${t('heroes_uxelm_skill_busy')})`
  return text
})

function familyName(id) {
  return t('heroes_info_family_' + id)
}

function familyTier(family) {
  return (props.hero.techniqueTiers || {})[family.id] || 1
}

function familyUses(family) {
  return (props.hero.techniqueUses || {})[family.id] || 0
}

function staminaCost(family) {
  return family.staminaCostBase + family.staminaCostPerTier * (familyTier(family) - 1)
}

function tierProgress(family) {
  const tier = familyTier(family)
  const uses = familyUses(family)
  const cumulative = tier <= 1 ? 0 : 50 * (Math.pow(3, tier - 1) - 1)
  const threshold = Math.floor(100 * Math.pow(3, tier - 1))
  return Math.min(100, Math.floor((Math.max(0, uses - cumulative) / threshold) * 100))
}

function effectLabel(family, tierOverride) {
  const id = family.id
  const tier = tierOverride || familyTier(family)
  switch (id) {
    case 'single_strike': return t('heroes_info_effect_basic_attack')
    case 'multiple_attack': {
      const hits = Math.max(1, tier)
      const perHit = Math.max(0.4, family.baseMult - family.hitDecay * Math.max(0, tier - 2))
      return `${hits} ${t('heroes_info_effect_hits')} · ${(hits * perHit).toFixed(1)}×`
    }
    case 'power_strike': return `${(family.baseMult + family.growth * (tier - 1)).toFixed(1)}× ${t('heroes_info_effect_power')}`
    case 'cleave': return t('heroes_info_effect_cleave')
    case 'shield_bash': return t('heroes_info_effect_stun')
    case 'poison_strike': return t('heroes_info_effect_poison')
    case 'plunder': return t('heroes_info_effect_steal')
    default: return ''
  }
}
</script>

<style scoped>
.skills-modal { display: flex; flex-direction: column; gap: var(--spacing-md); }
.skills-alert { padding: var(--spacing-sm) var(--spacing-md); background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.3); border-radius: var(--radius-md); font-size: 0.875rem; color: var(--text-primary); }
.skills-alert.busy { background: rgba(234,179,8,0.1); border-color: rgba(234,179,8,0.3); }
.skills-list { display: flex; flex-direction: column; gap: var(--spacing-sm); }
.skill-item { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--spacing-md); padding: var(--spacing-md); background: var(--bg-card); border: 1px solid var(--glass-border); border-radius: var(--radius-md); }
.skill-item.known { background: rgba(99,102,241,0.06); }
.skill-item.locked { opacity: 0.85; }
.skill-info { display: flex; flex-direction: column; gap: var(--spacing-xs); flex: 1; min-width: 0; }
.skill-name { font-weight: 600; color: var(--text-primary); }
.inscribed-mark { color: var(--color-primary-light); margin-left: var(--spacing-xs); }
.skill-meta { font-size: 0.75rem; color: var(--text-muted); }
.tier-progress { margin-top: var(--spacing-xs); }
.tier-progress-header { display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 2px; }
.tier-bar { height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden; }
.tier-bar-fill { height: 100%; background: var(--color-primary); border-radius: 3px; transition: width 0.3s ease; }
.tier-badge { padding: var(--spacing-xs) var(--spacing-sm); background: var(--bg-base); border: 1px solid var(--glass-border); border-radius: var(--radius-sm); font-size: 0.75rem; color: var(--text-secondary); flex-shrink: 0; }
.locked-divider { margin: var(--spacing-sm) 0; padding-top: var(--spacing-sm); border-top: 1px dashed var(--glass-border); font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
.locked-label { font-size: 0.75rem; color: var(--text-muted); }
.skill-actions { flex-shrink: 0; }
</style>
