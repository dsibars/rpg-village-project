<template>
  <div class="gambit-form">
    <h3>{{ t('gambit_uxelm_add') }}</h3>

    <div class="form-group">
      <label>{{ t('gambit_uxelm_condition') }}</label>
      <select v-model="form.condition">
        <option value="ANY_ENEMY">{{ t('gambit_cond_any_enemy') }}</option>
        <option value="SELF_HP_LT_50">{{ t('gambit_cond_self_hp_lt_50') }}</option>
        <option value="SELF_MP_LT_25">{{ t('gambit_cond_self_mp_lt_25') }}</option>
        <option value="ALLY_HP_LT_50">{{ t('gambit_cond_ally_hp_lt_50') }}</option>
        <option value="ALLY_HP_LT_25">{{ t('gambit_cond_ally_hp_lt_25') }}</option>
        <option value="ENEMY_COUNT_GT_2">{{ t('gambit_cond_enemies_gt_2') }}</option>
      </select>
    </div>

    <div class="form-group">
      <label>{{ t('gambit_uxelm_action') }}</label>
      <select v-model="form.action">
        <optgroup :label="t('gambit_uxelm_techniques')">
          <option v-for="family in hero.knownFamilies" :key="family" :value="`tech:${family}`">
            {{ family }}
          </option>
        </optgroup>
        <optgroup :label="t('gambit_uxelm_spells')">
          <option v-for="(spell, idx) in hero.spellCodex" :key="spell" :value="`spell:${idx}`">
            {{ spell }}
          </option>
        </optgroup>
        <option value="defend">{{ t('gambit_uxelm_defend') }}</option>
      </select>
    </div>

    <div v-if="showTierSelect" class="form-group">
      <label>{{ t('gambit_uxelm_skill_tier') }}</label>
      <select v-model="form.tier">
        <option v-for="tier in availableTiers" :key="tier" :value="tier">{{ t('shared_uxelm_tier') }} {{ tier }}</option>
      </select>
    </div>

    <div class="form-group">
      <label>{{ t('gambit_uxelm_target') }}</label>
      <select v-model="form.target">
        <option v-for="target in availableTargets" :key="target" :value="target">
          {{ t(`gambit_target_${target}`) }}
        </option>
      </select>
    </div>

    <button
      class="btn-add"
      :disabled="disabled"
      @click="handleAdd"
    >{{ t('gambit_uxelm_add') }}</button>
  </div>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'

const { t } = useI18n()

const props = defineProps({
  hero: { type: Object, required: true },
  disabled: { type: Boolean, default: false }
})

const emit = defineEmits(['add'])

const ALL_TARGETS = [
  'weakest_enemy', 'strongest_enemy', 'lowest_hp_enemy', 'highest_hp_enemy',
  'random_enemy', 'all_enemies', 'weakest_ally', 'strongest_ally',
  'lowest_hp_ally', 'highest_hp_ally', 'random_ally', 'all_allies', 'self'
]

const TARGET_COMPATIBILITY = {
  single_enemy: ['weakest_enemy', 'strongest_enemy', 'lowest_hp_enemy', 'highest_hp_enemy', 'random_enemy'],
  enemy_splash: ['weakest_enemy', 'strongest_enemy', 'lowest_hp_enemy', 'highest_hp_enemy', 'random_enemy'],
  all_enemies: ['all_enemies'],
  single_ally: ['weakest_ally', 'strongest_ally', 'lowest_hp_ally', 'highest_hp_ally', 'random_ally', 'self'],
  all_allies: ['all_allies'],
  self: ['self'],
  none: []
}

const form = reactive({
  condition: 'ANY_ENEMY',
  action: '',
  tier: 1,
  target: 'weakest_enemy'
})

const showTierSelect = computed(() => form.action.startsWith('tech:'))

const availableTiers = computed(() => {
  if (!form.action.startsWith('tech:')) return [1]
  const family = form.action.replace('tech:', '')
  const maxTier = props.hero.techniqueTiers?.[family] || 1
  return Array.from({ length: maxTier }, (_, i) => i + 1)
})

const actionTargetType = computed(() => {
  if (form.action === 'defend') return 'self'
  if (form.action.startsWith('tech:')) return 'single_enemy'
  if (form.action.startsWith('spell:')) return 'single_enemy'
  return 'single_enemy'
})

const availableTargets = computed(() => {
  return TARGET_COMPATIBILITY[actionTargetType.value] || ALL_TARGETS
})

watch(() => form.action, () => {
  const targets = availableTargets.value
  if (!targets.includes(form.target)) {
    form.target = targets[0] || 'weakest_enemy'
  }
  if (form.action.startsWith('tech:')) {
    const family = form.action.replace('tech:', '')
    form.tier = props.hero.techniqueTiers?.[family] || 1
  }
})

function handleAdd() {
  emit('add', {
    conditionRaw: form.condition,
    actionRaw: form.action,
    target: form.target,
    tier: showTierSelect.value ? form.tier : undefined
  })
}
</script>

<style scoped>
.gambit-form {
  padding: var(--spacing-md);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
}

.gambit-form h3 {
  margin-top: 0;
  color: var(--text-primary);
  font-family: var(--font-heading);
}

.form-group {
  margin-bottom: var(--spacing-md);
}

.form-group label {
  display: block;
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin-bottom: var(--spacing-xs);
}

.form-group select {
  width: 100%;
  padding: var(--spacing-sm);
  background: var(--bg-base);
  color: var(--text-primary);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  font-family: var(--font-body);
}

.btn-add {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-family: var(--font-body);
}

.btn-add:hover:not(:disabled) {
  background: var(--color-primary-light);
}

.btn-add:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
