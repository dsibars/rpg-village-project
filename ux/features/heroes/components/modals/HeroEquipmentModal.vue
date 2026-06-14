<template>
  <ModalFrame
    v-if="open"
    :title="`${t('inventory_uxelm_equipment')} — ${hero.name}`"
    @close="$emit('close')"
  >
    <div class="equipment-modal">
      <p class="modal-subtitle">{{ t('inventory_uxelm_equipment_desc') }}</p>

      <div class="equipment-layout">
        <div class="slots-column">
          <div
            v-for="slot in slots"
            :key="slot"
            class="slot-row"
            :class="{ selected: selectedSlot === slot, empty: !hero.equipment?.[slot] }"
            @click="selectedSlot = slot"
          >
            <span class="slot-icon">{{ slotIcons[slot] }}</span>
            <div class="slot-info">
              <span class="slot-label">{{ t('inventory_info_slot_' + slot) }}</span>
              <span class="slot-item">{{ equippedName(slot) }}</span>
            </div>
            <Button
              v-if="hero.equipment?.[slot]"
              variant="secondary"
              size="sm"
              @click.stop="$emit('unequip', slot)"
            >
              {{ t('inventory_uxelm_unequip') }}
            </Button>
          </div>
        </div>

        <div class="gear-column">
          <div v-if="!selectedSlot" class="gear-placeholder">
            {{ t('inventory_uxelm_select_slot_prompt') }}
          </div>
          <div v-else-if="availableGear.length === 0" class="gear-placeholder">
            {{ t('inventory_uxelm_no_items') }}
          </div>
          <div v-else class="gear-list">
            <div
              v-for="item in availableGear"
              :key="item.id"
              class="gear-row"
            >
              <div class="gear-info">
                <span class="gear-name">{{ itemName(item) }}</span>
                <span class="gear-stats">{{ itemStats(item) }}</span>
              </div>
              <Button
                variant="primary"
                size="sm"
                @click="$emit('equip', { slot: selectedSlot, equipmentId: item.id })"
              >
                {{ t('inventory_uxelm_equip') }}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </ModalFrame>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import ModalFrame from '@/components/ModalFrame.vue'
import Button from '@/components/Button.vue'

const props = defineProps({
  hero: { type: Object, required: true },
  inventoryEquipment: { type: Array, default: () => [] },
  open: { type: Boolean, default: false }
})

defineEmits(['close', 'equip', 'unequip'])

const { t } = useI18n()

const slots = ['head', 'body', 'legs', 'leftHand', 'rightHand', 'accessory']
const slotIcons = {
  head: '🪖',
  body: '🦺',
  legs: '🥾',
  leftHand: '⚔',
  rightHand: '🛡',
  accessory: '💍'
}

const selectedSlot = ref(null)

const availableGear = computed(() => {
  if (!selectedSlot.value) return []
  return props.inventoryEquipment.filter((item) => {
    if (item.type === 'weapon') {
      return selectedSlot.value === 'leftHand' || selectedSlot.value === 'rightHand'
    }
    return item.slot === selectedSlot.value
  })
})

function equippedName(slot) {
  const item = props.hero.equipment?.[slot]
  return item ? itemName(item) : t('inventory_uxelm_empty_slot')
}

function itemName(item) {
  const tier = t('inventory_info_tier_' + item.material)
  if (item.type === 'weapon') {
    return `${tier} ${t('inventory_info_family_' + item.family)} +${item.level || 0}`
  }
  return `${tier} ${t('inventory_info_archetype_' + item.archetype)} ${t('inventory_info_slot_' + item.slot)} +${item.level || 0}`
}

function itemStats(item) {
  const stats = []
  const tier = t('inventory_info_tier_' + item.material)
  if (item.type === 'weapon') {
    const family = t('inventory_info_family_' + item.family)
    stats.push(`${family} +${item.level || 0}`)
    stats.push(t('inventory_info_tier_' + item.material))
  } else {
    stats.push(`${t('inventory_info_archetype_' + item.archetype)} +${item.level || 0}`)
    stats.push(t('inventory_info_tier_' + item.material))
    if (item.archetype === 'plate') stats.push('+DEF +HP -SPD')
    if (item.archetype === 'leather') stats.push('+EVA')
    if (item.archetype === 'robes') stats.push('+MP +MAG')
  }
  return stats.join(' · ') || t('inventory_uxelm_equipment_stats')
}
</script>

<style scoped>
.equipment-modal { display: flex; flex-direction: column; gap: var(--spacing-md); min-height: 320px; }
.modal-subtitle { margin: 0; font-size: 0.875rem; color: var(--text-secondary); }
.equipment-layout { display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md); flex: 1; min-height: 0; }
.slots-column { display: flex; flex-direction: column; gap: var(--spacing-xs); overflow-y: auto; }
.slot-row { display: flex; align-items: center; gap: var(--spacing-sm); padding: var(--spacing-sm) var(--spacing-md); background: var(--bg-card); border: 1px solid var(--glass-border); border-radius: var(--radius-md); cursor: pointer; }
.slot-row:hover { border-color: var(--color-primary-light); }
.slot-row.selected { border-color: var(--color-primary); background: rgba(74, 222, 128, 0.12); }
.slot-row.empty { opacity: 0.75; border-style: dashed; border-color: var(--text-muted); }
.slot-row.empty:hover { border-style: solid; border-color: var(--color-primary-light); }
.slot-icon { font-size: 1.25rem; }
.slot-info { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.slot-label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; }
.slot-item { font-weight: 500; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.slot-row.empty .slot-item { color: var(--text-muted); font-style: italic; }
.slot-row.empty .slot-label { color: var(--text-muted); opacity: 0.7; }
.gear-column { display: flex; flex-direction: column; min-height: 0; overflow-y: auto; background: var(--bg-card); border: 1px solid var(--glass-border); border-radius: var(--radius-md); padding: var(--spacing-sm); }
.gear-placeholder { display: flex; align-items: center; justify-content: center; text-align: center; color: var(--text-muted); font-size: 0.875rem; height: 100%; }
.gear-list { display: flex; flex-direction: column; gap: var(--spacing-xs); }
.gear-row { display: flex; justify-content: space-between; align-items: center; gap: var(--spacing-sm); padding: var(--spacing-sm); background: var(--bg-base); border: 1px solid var(--glass-border); border-radius: var(--radius-md); }
.gear-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.gear-name { font-weight: 500; color: var(--text-primary); word-break: break-word; }
.gear-stats { font-size: 0.75rem; color: var(--text-muted); }
@media (max-width: 640px) { .equipment-layout { grid-template-columns: 1fr; } }
</style>
