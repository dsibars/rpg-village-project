<template>
  <ModalFrame
    v-if="open"
    :title="t('village_uxelm_report_title', { day: (report?.day || 1) - 1 })"
    @close="$emit('close')"
  >
    <div class="daily-report">
      <div v-if="!report" class="empty-state">
        {{ t('daily_report_uxelm_none') }}
      </div>

      <template v-else>
        <!-- Food -->
        <div class="report-section" :class="{ danger: report.starvation }">
          <span class="report-icon">🍞</span>
          <span>{{ foodText }}</span>
        </div>

        <!-- Growth -->
        <div v-if="report.growth > 0" class="report-section">
          <span class="report-icon">👶</span>
          <span>{{ t('village_msg_report_growth', { amount: report.growth }) }}</span>
        </div>

        <!-- Miner Yield -->
        <div v-if="hasMinerYield" class="report-section success">
          <span class="report-icon">⛏️</span>
          <span>{{ t('village_msg_report_miner', { yield: minerYieldText }) }}</span>
        </div>

        <!-- Construction Completed -->
        <div v-if="report.completed?.length > 0" class="report-section">
          <span class="report-icon">🔨</span>
          <span>{{ t('village_msg_report_built') }} {{ completedBuildings }}</span>
        </div>

        <!-- Recovery -->
        <div v-if="report.recovery?.length > 0" class="report-section success">
          <span class="report-icon">💖</span>
          <span>{{ t('village_msg_report_recovery', { healed: recoveryText }) }}</span>
        </div>

        <!-- Training -->
        <div v-if="report.training?.length > 0" class="report-section" :class="{ success: hasLeveledUp }">
          <span class="report-icon">💪</span>
          <span>{{ trainingText }}</span>
        </div>

        <!-- Expedition -->
        <div v-if="report.expedition" class="report-section" :class="expeditionClass">
          <span class="report-icon">{{ expeditionIcon }}</span>
          <span>{{ expeditionText }}</span>
        </div>

        <!-- Tavern Recruit -->
        <div v-if="report.tavernRecruit" class="report-section success">
          <span class="report-icon">🍺</span>
          <span>{{ tavernText }}</span>
        </div>

        <!-- Raid -->
        <div v-if="report.raid" class="report-section" :class="{ success: report.raid.isVictory, danger: !report.raid.isVictory }">
          <span class="report-icon">{{ report.raid.isVictory ? '🛡️' : '⚠️' }}</span>
          <span>{{ raidText }}</span>
        </div>
      </template>
    </div>

    <template #footer>
      <Button variant="primary" size="sm" class="shine-effect" @click="$emit('close')">
        {{ t('shared_uxelm_acknowledge') }}
      </Button>
    </template>
  </ModalFrame>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import ModalFrame from '@/components/ModalFrame.vue'
import Button from '@/components/Button.vue'

const props = defineProps({
  report: { type: Object, default: null },
  open: { type: Boolean, default: false }
})

const emit = defineEmits(['close'])
const { t } = useI18n()

const foodText = computed(() => {
  if (!props.report) return ''
  if (props.report.starvation) return t('village_msg_report_starvation')
  return t('village_msg_report_food', { amount: props.report.consumed || 0 })
})

const hasMinerYield = computed(() => {
  const my = props.report?.minerYield
  return my && (my.wood > 0 || my.stone > 0)
})

const minerYieldText = computed(() => {
  const my = props.report?.minerYield
  if (!my) return ''
  const parts = []
  if (my.wood > 0) parts.push(`${my.wood} ${t('inventory_info_mat_wood')}`)
  if (my.stone > 0) parts.push(`${my.stone} ${t('inventory_info_mat_stone')}`)
  return parts.join(', ')
})

const completedBuildings = computed(() => {
  const completed = props.report?.completed
  if (!completed?.length) return ''
  return completed.map(id => t('village_info_building_' + id)).join(', ')
})

const recoveryText = computed(() => {
  const rec = props.report?.recovery
  if (!rec?.length) return ''
  return rec.map(h => `${h.heroName} (+${h.amount} HP)`).join(', ')
})

const hasLeveledUp = computed(() => {
  const training = props.report?.training
  if (!training?.length) return false
  return training.some(t => t.leveledUp)
})

const trainingText = computed(() => {
  const training = props.report?.training
  if (!training?.length) return ''
  const leveled = training.filter(t => t.leveledUp).map(t => t.heroName)
  if (leveled.length > 0) {
    return t('village_msg_report_training_level', { heroes: leveled.join(', ') })
  }
  return t('village_msg_report_training', { count: training.length })
})

const expeditionClass = computed(() => {
  const exp = props.report?.expedition
  if (!exp) return ''
  if (exp.status === 'completed') return 'success'
  if (exp.status === 'failed') return 'danger'
  return ''
})

const expeditionIcon = computed(() => {
  const exp = props.report?.expedition
  if (!exp) return ''
  if (exp.status === 'completed') return '✨'
  if (exp.status === 'failed') return '💀'
  return '⚔️'
})

const expeditionText = computed(() => {
  const exp = props.report?.expedition
  if (!exp) return ''
  const expName = t(exp.expId) !== exp.expId ? t(exp.expId) : (exp.expName || exp.expId)

  if (exp.status === 'completed') {
    const rewards = []
    if (exp.reward) {
      if (exp.reward.gold) rewards.push(`${exp.reward.gold} ${t('village_info_gold')}`)
      if (exp.reward.items) {
        for (const [id, qty] of Object.entries(exp.reward.items)) {
          const transKey = id.startsWith('material_') || id.startsWith('food_') || id.startsWith('meal_') ? id : 'item_' + id
          rewards.push(`${qty} ${t(transKey)}`)
        }
      }
    }
    if (exp.drops) {
      if (exp.drops.loot) {
        const loot = exp.drops.loot
        const matKey = 'inventory_info_tier_' + loot.material
        const typeKey = 'inventory_info_type_' + loot.type
        rewards.push(`${t(matKey)} ${t(typeKey)}`)
      }
      if (exp.drops.consumables?.length > 0) {
        exp.drops.consumables.forEach(({ id, qty }) => {
          rewards.push(`${qty} ${t('item_' + id)}`)
        })
      }
      if (exp.drops.glyphs?.length > 0) {
        exp.drops.glyphs.forEach(({ tabletId }) => {
          rewards.push(`1 ${t('item_' + tabletId)}`)
        })
      }
    }
    const rewardsStr = rewards.join(', ')
    return t('village_msg_report_exp_completed', { name: expName, rewards: rewardsStr })
  }

  if (exp.status === 'failed') {
    return t('village_msg_report_exp_failed', { name: expName })
  }

  return t('village_msg_report_exp_progress', { name: expName })
})

const tavernText = computed(() => {
  const hero = props.report?.tavernRecruit
  if (!hero) return ''
  const originKey = 'heroes_info_origin_' + (hero.origin || '').replace('origin_', '')
  return t('village_msg_report_tavern_recruit', {
    name: hero.name,
    origin: t(originKey)
  })
})

const raidText = computed(() => {
  const raid = props.report?.raid
  if (!raid) return ''
  if (raid.isVictory) {
    return t('village_msg_report_raid_victory', {
      defense: raid.defensePower,
      raid: raid.raidPower,
      gold: raid.goldReward || 0
    })
  }
  const damagedStr = raid.damagedBuilding
    ? t('village_msg_report_raid_damaged', { building: t('village_info_building_' + raid.damagedBuilding) })
    : ''
  return t('village_msg_report_raid_defeat', {
    defense: raid.defensePower,
    raid: raid.raidPower,
    wood: raid.woodLoss || 0,
    stone: raid.stoneLoss || 0,
    damaged: damagedStr
  })
})
</script>

<style scoped>
.daily-report {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  min-width: 360px;
  max-width: 480px;
}

.empty-state {
  color: var(--text-muted);
  font-style: italic;
  text-align: center;
  padding: var(--spacing-lg);
}

.report-section {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  color: var(--text-primary);
}

.report-section.danger {
  border-color: rgba(239, 68, 68, 0.4);
  background: rgba(239, 68, 68, 0.08);
}

.report-section.success {
  border-color: rgba(34, 197, 94, 0.4);
  background: rgba(34, 197, 94, 0.08);
}

.report-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
}

.shine-effect {
  animation: shine 2s ease-in-out infinite;
}

@keyframes shine {
  0%, 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
  50% { box-shadow: 0 0 12px 2px rgba(99, 102, 241, 0.2); }
}
</style>
