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
}
</style>
