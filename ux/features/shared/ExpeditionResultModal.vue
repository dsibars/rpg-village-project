<template>
  <ModalFrame
    :title="titleText"
    @close="$emit('close')"
  >
    <div class="expedition-result-content">
      <div class="expedition-result-header">
        <span class="expedition-result-icon">{{ icon }}</span>
      </div>
      <div class="expedition-result-body" :class="sectionClass">
        <p v-if="hasRewards">{{ bodyText }}</p>
        <p v-else class="no-rewards-text">{{ bodyText }}</p>
      </div>
    </div>
    <template #footer>
      <Button variant="primary" @click="$emit('close')">
        {{ t('shared_uxelm_continue') }}
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
  expedition: { type: Object, required: true }
})

defineEmits(['close'])

const { t } = useI18n()

const expName = computed(() => {
  const exp = props.expedition
  if (!exp) return ''
  const expId = exp.expId || exp.id
  return t(expId) !== expId ? t(expId) : (exp.expName || expId)
})

const icon = computed(() => {
  const status = props.expedition?.status
  if (status === 'completed') return '✨'
  if (status === 'failed') return '💀'
  return '🗺️'
})

const sectionClass = computed(() => {
  const status = props.expedition?.status
  if (status === 'completed') return 'success'
  if (status === 'failed') return 'danger'
  return 'progress'
})

const titleText = computed(() => {
  const status = props.expedition?.status
  const name = expName.value
  if (status === 'completed') {
    return t('village_msg_report_exp_completed_title').replace('{name}', name)
  }
  if (status === 'failed') {
    return t('village_msg_report_exp_failed_title').replace('{name}', name)
  }
  return t('village_msg_report_exp_progress_title').replace('{name}', name)
})

const hasRewards = computed(() => {
  const exp = props.expedition
  if (!exp || exp.status !== 'completed') return false
  const hasReward = exp.reward && (exp.reward.gold || exp.reward.items)
  const hasDrops = exp.drops && (exp.drops.loot || (exp.drops.consumables?.length > 0) || (exp.drops.glyphs?.length > 0))
  return hasReward || hasDrops
})

const bodyText = computed(() => {
  const exp = props.expedition
  if (!exp) return ''
  
  if (exp.status === 'failed') {
    return t('village_msg_report_exp_failed_body')
  }
  if (exp.status === 'progress') {
    return t('village_msg_report_exp_progress_body')
  }
  
  // Completed - format rewards
  const rewards = []
  
  if (exp.reward) {
    if (exp.reward.gold) {
      rewards.push(`${exp.reward.gold} ${t('village_info_gold')}`)
    }
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
    if (exp.drops.consumables && exp.drops.consumables.length > 0) {
      exp.drops.consumables.forEach(({ id, qty }) => {
        rewards.push(`${qty} ${t('item_' + id)}`)
      })
    }
    if (exp.drops.glyphs && exp.drops.glyphs.length > 0) {
      exp.drops.glyphs.forEach(({ tabletId }) => {
        rewards.push(`1 ${t('item_' + tabletId)}`)
      })
    }
  }
  
  return rewards.length > 0
    ? t('village_msg_report_exp_completed_rewards').replace('{rewards}', rewards.join(', '))
    : t('village_msg_report_exp_completed_norewards')
})
</script>

<style scoped>
.expedition-result-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) 0;
}

.expedition-result-header {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.expedition-result-icon {
  font-size: 3rem;
  margin-bottom: var(--spacing-xs);
}

.expedition-result-body {
  font-size: 1rem;
  line-height: 1.5;
  color: var(--text-primary);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  width: 100%;
}

.expedition-result-body.success {
  background: rgba(16, 185, 129, 0.08);
  border: 1px dashed rgba(16, 185, 129, 0.3);
}

.expedition-result-body.danger {
  background: rgba(239, 68, 68, 0.08);
  border: 1px dashed rgba(239, 68, 68, 0.3);
}

.expedition-result-body.progress {
  background: rgba(245, 158, 11, 0.08);
  border: 1px dashed rgba(245, 158, 11, 0.3);
}
</style>
