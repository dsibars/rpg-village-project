<template>
  <div class="combat-header">
    <div class="header-title">
      <h2>{{ title }}</h2>
      <div class="stage-label">{{ stageLabel }}</div>
    </div>
    <div class="header-controls">
      <Button
        size="sm"
        :variant="autoBattle ? 'primary' : 'secondary'"
        :disabled="isOver"
        @click="$emit('toggleAuto')"
      >
        {{ t('shared_uxelm_auto_combat') }} {{ autoBattle ? t('shared_uxelm_on') : t('shared_uxelm_off') }}
      </Button>
      <div class="skip-risk">
        <span class="risk-badge" :class="riskClass">{{ riskLabel }}</span>
        <Button
          variant="secondary"
          size="sm"
          :disabled="isOver"
          @click="$emit('skip')"
        >
          {{ t('shared_uxelm_skip_combat') }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import Button from '@/components/Button.vue'

const props = defineProps({
  battle: { type: Object, default: null },
  activeExpedition: { type: Object, default: null }
})

const emit = defineEmits(['toggleAuto', 'skip'])

const { t } = useI18n()

const isOver = computed(() => props.battle?.isOver || false)
const autoBattle = computed(() => props.battle?.autoBattle || false)

const riskData = computed(() => {
  const b = props.battle
  if (!b || !b.heroes || !b.enemies || b.heroes.length === 0 || b.enemies.length === 0) {
    return { level: 0, label: '', class: '' }
  }
  const heroLevels = b.heroes.map(h => h.level || 1)
  const enemyLevels = b.enemies.map(e => e.level || 1)
  const avgHero = heroLevels.reduce((a, b) => a + b, 0) / heroLevels.length
  const avgEnemy = enemyLevels.reduce((a, b) => a + b, 0) / enemyLevels.length
  const gap = avgHero - avgEnemy

  if (gap >= 4) return { level: 1, label: t('combat_uxelm_skip_safe'), class: 'safe' }
  if (gap >= 1) return { level: 2, label: t('combat_uxelm_skip_risky'), class: 'risky' }
  if (gap >= -1) return { level: 3, label: t('combat_uxelm_skip_dangerous'), class: 'dangerous' }
  return { level: 4, label: t('combat_uxelm_skip_suicide'), class: 'suicide' }
})

const riskLabel = computed(() => riskData.value.label)
const riskClass = computed(() => riskData.value.class)

const title = computed(() => {
  const exp = props.activeExpedition
  if (exp) {
    const translated = t(exp.id)
    return translated !== exp.id ? translated : exp.name
  }
  return t('combat_uxelm_battle_title')
})

const stageLabel = computed(() => {
  const exp = props.activeExpedition
  const stage = exp ? exp.currentStage + 1 : 1
  return `${t('shared_uxelm_stage')} ${stage}`
})
</script>

<style scoped>
.combat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--bg-card);
  border-bottom: 1px solid var(--glass-border);
}

.header-title h2 {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 1.25rem;
  color: var(--text-primary);
}

.stage-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

.header-controls {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
}

.skip-risk {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.risk-badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.risk-badge.safe {
  background: rgba(74, 222, 128, 0.15);
  color: #4ade80;
  border: 1px solid rgba(74, 222, 128, 0.3);
}

.risk-badge.risky {
  background: rgba(251, 191, 36, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(251, 191, 36, 0.3);
}

.risk-badge.dangerous {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.risk-badge.suicide {
  background: rgba(153, 27, 27, 0.2);
  color: #fca5a5;
  border: 1px solid rgba(153, 27, 27, 0.4);
}
</style>
