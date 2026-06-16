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
          <div class="consumable-icon" :class="item.typeClass">
            {{ item.icon }}
          </div>
          <div class="consumable-info">
            <span class="consumable-name">
              {{ itemName(item.id) }}
              <span class="consumable-count">× {{ item.count }}</span>
            </span>
            <span class="consumable-effect" :class="{ 'effect-muted': item.disabled }">
              <template v-if="item.disabled">
                <span class="effect-reason">{{ item.disabledReason }}</span>
              </template>
              <template v-else>
                {{ item.effect }}
              </template>
            </span>
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
      let typeClass = ''
      let icon = ''

      if (data.type === 'HEAL_HP') {
        const missing = (props.hero.maxHp || 0) - props.hero.hp
        const amount = Math.min(data.amount, missing)
        effect = `+${amount} HP`
        typeClass = 'type-hp'
        icon = '❤️'
        if (props.hero.hp >= props.hero.maxHp) {
          disabled = true
          disabledReason = t('heroes_uxelm_consumable_full_hp')
        }
      } else if (data.type === 'HEAL_MP') {
        const missing = (props.hero.maxMp || 0) - props.hero.mp
        const amount = Math.min(data.amount, missing)
        effect = `+${amount} MP`
        typeClass = 'type-mp'
        icon = '💧'
        if (props.hero.mp >= props.hero.maxMp) {
          disabled = true
          disabledReason = t('heroes_uxelm_consumable_full_mp')
        }
      }

      return { id, count, effect, disabled, disabledReason, typeClass, icon }
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
.consumable-row { display: flex; align-items: center; gap: var(--spacing-sm); padding: var(--spacing-sm) var(--spacing-md); border-radius: var(--radius-md); border: 1px solid transparent; transition: background 0.15s ease; }
.consumable-row:hover:not(.disabled) { background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.05); }
.consumable-row.disabled { opacity: 0.55; background: rgba(0,0,0,0.15); border-color: rgba(255,255,255,0.03); }

.consumable-icon { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-sm); font-size: 1rem; flex-shrink: 0; }
.consumable-icon.type-hp { background: rgba(239, 68, 68, 0.15); }
.consumable-icon.type-mp { background: rgba(59, 130, 246, 0.15); }

.consumable-info { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
.consumable-name { font-weight: 600; color: var(--text-primary); display: flex; align-items: baseline; gap: 4px; }
.consumable-count { font-size: 0.8rem; color: var(--text-muted); font-weight: 500; }
.consumable-effect { font-size: 0.75rem; color: var(--text-muted); }
.consumable-effect.effect-muted { color: var(--text-muted); opacity: 0.7; }
.effect-reason { font-style: italic; }
.empty-state { text-align: center; padding: var(--spacing-xl) 0; color: var(--text-muted); }
</style>
