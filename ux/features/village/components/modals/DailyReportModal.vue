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
        <div v-if="report.recovery?.length > 0" class="report-section success" style="flex-wrap: wrap;">
          <span class="report-icon">💖</span>
          <div class="report-body">
            <div class="report-line">{{ recoveryLabel }}</div>
            <div class="report-detail-list">
              <div v-for="(h, i) in recoveryList" :key="i" class="report-detail-item">
                <span class="detail-name">{{ h.heroName }}</span>
                <span class="detail-value hp">+{{ h.amount }} HP</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Training -->
        <div v-if="report.training?.length > 0" class="report-section" :class="{ success: hasLeveledUp }" style="flex-wrap: wrap;">
          <span class="report-icon">💪</span>
          <div class="report-body">
            <div class="report-line">{{ trainingSummary }}</div>
            <div class="report-detail-list">
              <div v-for="(t, i) in trainingList" :key="i" class="report-detail-item">
                <span class="detail-name">{{ t.heroName }}</span>
                <span v-if="t.leveledUp" class="detail-value level-up">🎉 Level Up!</span>
                <span v-else class="detail-value">Trained</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Expedition -->
        <div v-if="report.expedition" class="report-section" :class="expeditionClass" style="flex-wrap: wrap;">
          <span class="report-icon">{{ expeditionIcon }}</span>
          <div class="report-body">
            <div class="report-line">{{ expeditionTitle }}</div>
            <div v-if="expeditionRewards.length > 0" class="report-detail-list">
              <div v-for="(r, i) in expeditionRewards" :key="i" class="report-detail-item reward">
                <span class="reward-bullet">•</span>
                <span class="detail-value">{{ r }}</span>
              </div>
            </div>
          </div>
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

function safeT(key, fallback) {
  const translated = t(key)
  return translated === key ? (fallback || key) : translated
}

function humanizeId(id) {
  if (!id) return ''
  return id
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

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
  if (my.wood > 0) parts.push(`${my.wood} ${safeT('inventory_info_mat_wood', 'Wood')}`)
  if (my.stone > 0) parts.push(`${my.stone} ${safeT('inventory_info_mat_stone', 'Stone')}`)
  return parts.join(', ')
})

const completedBuildings = computed(() => {
  const completed = props.report?.completed
  if (!completed?.length) return ''
  return completed.map(id => safeT('village_info_building_' + id, humanizeId(id))).join(', ')
})

const recoveryLabel = computed(() => {
  return t('village_msg_report_recovery', { healed: '' }).replace(/:\s*$/, '').trim()
})

const recoveryList = computed(() => {
  const rec = props.report?.recovery
  if (!rec?.length) return []
  return rec
})

const hasLeveledUp = computed(() => {
  const training = props.report?.training
  if (!training?.length) return false
  return training.some(t => t.leveledUp)
})

const trainingSummary = computed(() => {
  const training = props.report?.training
  if (!training?.length) return ''
  const leveled = training.filter(t => t.leveledUp).map(t => t.heroName)
  if (leveled.length > 0) {
    return t('village_msg_report_training_level', { heroes: leveled.join(', ') })
  }
  return t('village_msg_report_training', { count: training.length })
})

const trainingList = computed(() => {
  const training = props.report?.training
  if (!training?.length) return []
  return training
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

const expeditionTitle = computed(() => {
  const exp = props.report?.expedition
  if (!exp) return ''
  const expName = safeT(exp.expId, exp.expName || exp.expId)
  if (exp.status === 'completed') {
    return t('village_msg_report_exp_completed', { name: expName, rewards: '' }).replace(/!\s*\w+:\s*$/, '!')
  }
  if (exp.status === 'failed') {
    return t('village_msg_report_exp_failed', { name: expName })
  }
  return t('village_msg_report_exp_progress', { name: expName })
})

const expeditionRewards = computed(() => {
  const exp = props.report?.expedition
  if (!exp || exp.status !== 'completed') return []
  const rewards = []
  if (exp.reward) {
    if (exp.reward.gold) rewards.push(`${exp.reward.gold} ${safeT('village_info_gold', 'Gold')}`)
    if (exp.reward.items) {
      for (const [id, qty] of Object.entries(exp.reward.items)) {
        const transKey = id.startsWith('material_') || id.startsWith('food_') || id.startsWith('meal_') ? id : 'item_' + id
        rewards.push(`${qty} ${safeT(transKey, humanizeId(id))}`)
      }
    }
  }
  if (exp.drops) {
    if (exp.drops.loot) {
      const loot = exp.drops.loot
      const matKey = 'inventory_info_tier_' + loot.material
      const typeKey = 'inventory_info_type_' + loot.type
      rewards.push(`${safeT(matKey, humanizeId(loot.material))} ${safeT(typeKey, humanizeId(loot.type))}`)
    }
    if (exp.drops.consumables?.length > 0) {
      exp.drops.consumables.forEach(({ id, qty }) => {
        rewards.push(`${qty} ${safeT('item_' + id, humanizeId(id))}`)
      })
    }
    if (exp.drops.glyphs?.length > 0) {
      exp.drops.glyphs.forEach(({ tabletId }) => {
        rewards.push(`1 ${safeT('item_' + tabletId, humanizeId(tabletId))}`)
      })
    }
  }
  return rewards
})

const tavernText = computed(() => {
  const hero = props.report?.tavernRecruit
  if (!hero) return ''
  const originKey = 'heroes_info_origin_' + (hero.origin || '').replace('origin_', '')
  return t('village_msg_report_tavern_recruit', {
    name: hero.name,
    origin: safeT(originKey, humanizeId(hero.origin || ''))
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
    ? t('village_msg_report_raid_damaged', { building: safeT('village_info_building_' + raid.damagedBuilding, humanizeId(raid.damagedBuilding)) })
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

.report-body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  flex: 1;
  min-width: 0;
}

.report-line {
  font-weight: 500;
}

.report-detail-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-left: var(--spacing-sm);
  margin-top: 2px;
}

.report-detail-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.report-detail-item .detail-name {
  font-weight: 500;
  color: var(--text-primary);
}

.report-detail-item .detail-value {
  margin-left: auto;
  font-weight: 500;
}

.report-detail-item .detail-value.hp {
  color: #22c55e;
}

.report-detail-item .detail-value.level-up {
  color: #f59e0b;
  font-size: 0.8rem;
}

.report-detail-item.reward .reward-bullet {
  color: var(--text-muted);
  font-size: 0.7rem;
}

.shine-effect {
  animation: shine 2s ease-in-out infinite;
}

@keyframes shine {
  0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
  50% { box-shadow: 0 0 12px 2px rgba(245, 158, 11, 0.2); }
}
</style>
