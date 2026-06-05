<template>
  <div class="forge-tab">
    <!-- Lock overlay -->
    <div v-if="!isUnlocked" class="lock-overlay">
      <EmptyState icon="\u{1F512}" :title="t('forge_uxelm_locked')" />
    </div>

    <template v-else>
      <div class="forge-layout">
        <!-- Item List -->
        <div class="item-list">
          <div
            v-for="item in allItems"
            :key="item.id"
            class="forge-item"
            :class="{ selected: selectedId === item.id, equipped: item.equippedOn }"
            @click="selectedId = item.id"
          >
            <span class="item-icon">\u{2699}</span>
            <div class="item-info">
              <span class="item-name">{{ item.name }}</span>
              <span v-if="item.equippedOn" class="equipped-label">{{ item.equippedOn }}</span>
            </div>
          </div>
        </div>

        <!-- Detail Pane -->
        <div v-if="selectedItem" class="detail-pane">
          <h3>{{ selectedItem.name }}</h3>
          <div class="item-stats">
            <p v-for="(val, key) in itemStats" :key="key">
              {{ key }}: {{ val }}
            </p>
          </div>
          <div v-if="refineCost" class="refine-cost">
            <h4>{{ t('forge_uxelm_refinement_cost') }}</h4>
            <p>\u{1F4B0} {{ refineCost.gold }}g</p>
            <p v-for="(amount, mat) in refineCost.materials" :key="mat">
              {{ mat }}: {{ amount }}
            </p>
          </div>
          <Button
            variant="primary"
            :disabled="!canRefine"
            @click="refineItem"
          >
            {{ t('forge_uxelm_refine') }}
          </Button>
        </div>

        <EmptyState v-else icon="\u{2699}" :title="t('forge_uxelm_select_item')" />
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import { useGameState } from '@/core/composables/useGameState.js'
import { useAdapter } from '@/core/composables/useAdapter.js'
import Button from '@/components/Button.vue'
import EmptyState from '@/components/EmptyState.vue'

const { t } = useI18n()
const { gameState, heroes } = useGameState()
const { dispatch } = useAdapter()

const selectedId = ref(null)

const village = computed(() => gameState.value.village || {})
const inventory = computed(() => gameState.value.inventory || {})
const blacksmithLevel = computed(() => village.value.infrastructure?.blacksmith || 0)
const isUnlocked = computed(() => blacksmithLevel.value >= 1)

const allItems = computed(() => {
  const items = [...(inventory.value.equipment || [])]
  // Merge equipped items from heroes
  heroes.value.forEach((h) => {
    const slots = ['head', 'body', 'legs', 'leftHand', 'rightHand', 'accessory']
    slots.forEach((slot) => {
      const item = h.equipment?.[slot]
      if (item) {
        items.push({ ...item, equippedOn: h.name })
      }
    })
  })
  return items
})

const selectedItem = computed(() =>
  allItems.value.find((i) => i.id === selectedId.value)
)

const itemStats = computed(() => {
  if (!selectedItem.value) return {}
  return selectedItem.value.stats || {}
})

const refineCost = computed(() => {
  if (!selectedItem.value) return null
  // Simplified cost formula
  const level = selectedItem.value.refineLevel || 0
  return {
    gold: 50 * (level + 1),
    materials: { material_ore: 2 * (level + 1) }
  }
})

const canRefine = computed(() => {
  if (!selectedItem.value || !refineCost.value) return false
  return true
})

function refineItem() {
  if (!selectedItem.value) return
  dispatch('forge', 'refineItem', { itemId: selectedItem.value.id })
}
</script>

<style scoped>
.forge-tab {
  padding: var(--spacing-lg);
}

.lock-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.forge-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: var(--spacing-lg);
}

.item-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  max-height: 60vh;
  overflow-y: auto;
}

.forge-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.15s ease;
}

.forge-item:hover, .forge-item.selected {
  border-color: var(--color-primary-light);
}

.forge-item.equipped {
  border-color: rgba(234, 179, 8, 0.3);
}

.item-icon {
  font-size: 1.25rem;
}

.item-info {
  display: flex;
  flex-direction: column;
}

.item-name {
  font-size: 0.85rem;
  color: var(--text-primary);
}

.equipped-label {
  font-size: 0.7rem;
  color: #fbbf24;
}

.detail-pane {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
}

.item-stats {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.refine-cost {
  padding: var(--spacing-sm);
  background: var(--bg-base);
  border-radius: var(--radius-md);
}

.refine-cost h4 {
  margin: 0 0 var(--spacing-xs);
  font-size: 0.85rem;
  color: var(--text-muted);
}

@media (max-width: 768px) {
  .forge-layout {
    grid-template-columns: 1fr;
  }
}
</style>
