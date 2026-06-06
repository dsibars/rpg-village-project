<template>
  <div class="combat-resolution">
    <h3 :style="{ color: resultColor }">{{ resultText }}</h3>

    <div v-if="summary.length > 0" class="summary-box">
      <div v-for="(s, idx) in summary" :key="idx" class="summary-row">
        <strong>{{ s.heroName }}</strong>:
        <span v-if="s.hpLost > 0" class="hp-lost">-{{ s.hpLost }} HP</span>
        <span v-else-if="s.hpLost < 0" class="hp-gained">+{{-s.hpLost}} HP</span>
        <span v-if="s.hpLost !== 0"> | </span>
        <span class="exp-gained">+{{ s.expEarned }} EXP</span>
        <span v-if="s.leveledUp" class="level-up">({{ t('shared_uxelm_level_up') }})</span>
      </div>
    </div>

    <div v-if="rewards.length > 0" class="rewards-box">
      <h4>{{ t('combat_uxelm_rewards') }}</h4>
      <div class="rewards-list">
        <span v-for="(reward, idx) in rewards" :key="idx" class="reward-chip">{{ reward }}</span>
      </div>
    </div>

    <Button variant="primary" @click="resolve">
      {{ t('shared_uxelm_close') }}
    </Button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import Button from '@/components/Button.vue'

const props = defineProps({
  battle: { type: Object, default: null },
  engine: { type: Object, default: null }
})

const emit = defineEmits(['close'])

const { t } = useI18n()

const preview = computed(() => props.engine?.getBattleResolutionPreview?.() || null)

const isVictory = computed(() => {
  if (preview.value) return preview.value.isVictory
  return props.battle?.winner === 'heroes'
})

const resultColor = computed(() => isVictory.value ? '#4caf50' : '#f44336')
const resultText = computed(() => isVictory.value ? t('shared_uxelm_victory') : t('shared_uxelm_defeat'))

const summary = computed(() => preview.value?.summary || [])

const rewards = computed(() => {
  const list = []
  const rw = preview.value?.rewards
  if (!rw || !preview.value?.isLastStage) return list
  if (rw.gold) list.push(`🪙 ${rw.gold} ${t('village_info_gold')}`)
  if (rw.items) {
    for (const [itemId, qty] of Object.entries(rw.items)) {
      list.push(`὎6 ${qty}x ${t(itemId)}`)
    }
  }
  return list
})

function resolve() {
  props.engine?.resolveBattle?.()
  emit('close')
}
</script>

<style scoped>
.combat-resolution {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  text-align: center;
  width: 100%;
}

.combat-resolution h3 {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 1.6rem;
}

.summary-box {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  text-align: left;
  width: 100%;
  max-height: 240px;
  overflow-y: auto;
}

.summary-row {
  margin-bottom: 5px;
}

.hp-lost { color: #f44336; font-size: 0.9em; }
.hp-gained { color: #4caf50; font-size: 0.9em; }
.exp-gained { color: #03a9f4; font-size: 0.9em; }
.level-up { color: #ffeb3b; font-weight: bold; font-size: 0.9em; }

.rewards-box {
  margin-top: var(--spacing-sm);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: var(--spacing-sm);
  width: 100%;
}

.rewards-box h4 {
  color: #ffeb3b;
  margin: 0 0 var(--spacing-xs) 0;
}

.rewards-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  justify-content: center;
  font-size: 0.95rem;
}

.reward-chip {
  background: rgba(255, 235, 59, 0.1);
  border: 1px solid rgba(255, 235, 59, 0.3);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
}
</style>
