<template>
  <div class="gambit-row" :class="{ 'gambit-row--disabled': !gambit.enabled }">
    <div class="gambit-index">{{ index + 1 }}</div>
    <div class="gambit-rule">
      <slot name="rule">{{ formatRule(gambit) }}</slot>
    </div>
    <div class="gambit-actions">
      <button
        class="btn-move"
        :disabled="isFirst"
        @click="$emit('move', gambit.id, -1)"
        :aria-label="t('shared_aria_move_up')"
      >▲</button>
      <button
        class="btn-move"
        :disabled="isLast"
        @click="$emit('move', gambit.id, 1)"
        :aria-label="t('shared_aria_move_down')"
      >▼</button>
      <button
        class="btn-toggle"
        @click="$emit('toggle', gambit.id)"
      >{{ gambit.enabled ? t('gambit_uxelm_disable') : t('gambit_uxelm_enable') }}</button>
      <button
        class="btn-remove"
        @click="$emit('remove', gambit.id)"
        :aria-label="t('shared_aria_remove')"
      >×</button>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from '@/core/composables/useI18n.js'

const { t } = useI18n()

defineProps({
  gambit: { type: Object, required: true },
  index: { type: Number, required: true },
  isFirst: { type: Boolean, default: false },
  isLast: { type: Boolean, default: false }
})

defineEmits(['move', 'toggle', 'remove'])

function formatRule(gambit) {
  const cond = gambit.conditions?.[0]?.left
  const action = gambit.action
  const target = gambit.target

  // Map condition type to full translation key
  function getConditionKey(c) {
    if (!c) return 'gambit_uxelm_always'
    const { type, operator, value } = c
    if (type === 'always') return 'gambit_cond_any_enemy'
    if (type === 'ally_hp' && operator === '<' && value === 0.5) return 'gambit_cond_ally_hp_lt_50'
    if (type === 'ally_hp' && operator === '<' && value === 0.25) return 'gambit_cond_ally_hp_lt_25'
    if (type === 'self_hp' && operator === '<' && value === 0.5) return 'gambit_cond_self_hp_lt_50'
    if (type === 'self_mp' && operator === '<' && value === 0.25) return 'gambit_cond_self_mp_lt_25'
    if (type === 'enemy_count' && operator === '>' && value === 2) return 'gambit_cond_enemies_gt_2'
    return `gambit_cond_${type}`
  }

  const condText = cond ? t(getConditionKey(cond)) : t('gambit_uxelm_always')

  // Translate action text
  let actionText
  if (!action || action.type === 'defend') {
    actionText = t('gambit_uxelm_defend')
  } else if (action.type === 'skill' && action.payload) {
    const familyKey = `heroes_info_family_${action.payload}`
    const translated = t(familyKey)
    actionText = translated !== familyKey ? translated : action.payload
  } else if (action.type === 'spell' && action.payload !== undefined && action.payload !== null) {
    const payloadStr = String(action.payload)
    const spellKey = `spells_${payloadStr}`
    const translated = t(spellKey)
    if (translated !== spellKey) {
      actionText = translated
    } else if (/^\d+$/.test(payloadStr)) {
      actionText = `${t('gambit_uxelm_spells')} #${payloadStr}`
    } else {
      actionText = payloadStr
    }
  } else if (action.type === 'item' && action.payload) {
    const itemKey = `items_${action.payload}`
    const translated = t(itemKey)
    actionText = translated !== itemKey ? translated : action.payload
  } else {
    actionText = action.payload || t('gambit_uxelm_defend')
  }

  const targetText = target ? t(`gambit_target_${target}`) : ''
  const onText = targetText ? ` ${t('gambit_uxelm_on')} ` : ''

  return `${condText} \u2192 ${actionText}${onText}${targetText}`
}
</script>

<style scoped>
.gambit-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-xs);
}

.gambit-row--disabled {
  opacity: 0.5;
}

.gambit-index {
  width: 24px;
  text-align: center;
  font-weight: bold;
  color: var(--text-muted);
  flex-shrink: 0;
}

.gambit-rule {
  flex: 1;
  color: var(--text-primary);
  font-size: 0.875rem;
}

.gambit-actions {
  display: flex;
  gap: var(--spacing-xs);
  flex-shrink: 0;
}

.btn-move, .btn-toggle, .btn-remove {
  padding: var(--spacing-xs) var(--spacing-sm);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 0.75rem;
}

.btn-move:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.btn-remove {
  color: var(--color-danger);
}

.btn-move:hover:not(:disabled),
.btn-toggle:hover,
.btn-remove:hover {
  background: var(--bg-card);
  color: var(--text-primary);
}
</style>
