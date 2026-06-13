<template>
  <ModalFrame
    v-if="open"
    :title="t('heroes_uxelm_consumables_title', { name: hero.name })"
    @close="$emit('close')"
  >
    <div class="consumables-modal">
      <div v-if="usableItems.length === 0" class="empty-state">
        {{ t('heroes_uxelm_consumable_empty') }}
      </div>

      <div v-else class="consumables-list">
        <div
          v-for="item in usableItems"
          :key="item.id"
          class="consumable-row"
          :class="{ disabled: item.disabled }"
        >
          <div class="consumable-info">
            <span class="consumable-name">{{ itemName(item.id) }} × {{ item.count }}</span>
            <span class="consumable-effect">{{ item.effect }}{{ item.disabledReason ? ' — ' + item.disabledReason : '' }}</span>
          </div>
          <Button
            variant="primary"
            size="sm"
            :disabled="item.disabled"
            @click="$emit('use', item.id)"
          >
            {{ t('heroes_uxelm_use') }}
          </Button>
        </div>
      </div>
    </div>
  </ModalFrame>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import { CONSUMABLES_DATA } from '@/core/data/index.js'
import ModalFrame from '@/components/ModalFrame.vue'
import Button from '@/components/Button.vue'

const props = defineProps({
  hero: { type: Object, required: true },
  consumables: { type: Object, default: () => ({}) },
  open: { type: Boolean, default: false }
})

defineEmits(['close', 'use'])

const { t } = useI18n()

const usableItems = computed(() => {
  return Object.entries(props.consumables || {})
    .map(([id, count]) => {
      const data = CONSUMABLES_DATA[id]
      if (!data || count <= 0 || data.type === 'ESCAPE') return null

      let effect = ''
      let disabled = false
      let disabledReason = ''

      if (data.type === 'HEAL_HP') {
        const amount = Math.min(data.amount, (props.hero.maxHp || 0) - props.hero.hp)
        effect = `+${amount} HP`
        if (props.hero.hp >= props.hero.maxHp) {
          disabled = true
          disabledReason = t('heroes_uxelm_consumable_full_hp')
        }
      } else if (data.type === 'HEAL_MP') {
        const amount = Math.min(data.amount, (props.hero.maxMp || 0) - props.hero.mp)
        effect = `+${amount} MP`
        if (props.hero.mp >= props.hero.maxMp) {
          disabled = true
          disabledReason = t('heroes_uxelm_consumable_full_mp')
        }
      }

      return { id, count, effect, disabled, disabledReason }
    })
    .filter(Boolean)
})

function itemName(id) {
  return t('item_' + id)
}
</script>

<style scoped>
.consumables-modal { min-height: 120px; }
.consumables-list { display: flex; flex-direction: column; gap: var(--spacing-sm); }
.consumable-row { display: flex; justify-content: space-between; align-items: center; gap: var(--spacing-md); padding: var(--spacing-sm) 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
.consumable-row.disabled { opacity: 0.5; }
.consumable-info { display: flex; flex-direction: column; gap: 2px; }
.consumable-name { font-weight: 600; color: var(--text-primary); }
.consumable-effect { font-size: 0.75rem; color: var(--text-muted); }
.empty-state { text-align: center; padding: var(--spacing-xl) 0; color: var(--text-muted); }
</style>
