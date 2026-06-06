<template>
  <div class="shop-tab">
    <!-- Lock overlay -->
    <div v-if="!isUnlocked" class="lock-overlay">
      <EmptyState icon="\u{1F512}" :title="t('shop_uxelm_locked')" />
    </div>

    <template v-else>
      <!-- Shop Tabs -->
      <div class="shop-tabs">
        <Button
          variant="ghost"
          size="sm"
          :class="{ active: currentTab === 'buy' }"
          @click="currentTab = 'buy'"
        >
          {{ t('shop_uxelm_tab_buy') }}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          :class="{ active: currentTab === 'sell' }"
          @click="currentTab = 'sell'"
        >
          {{ t('shop_uxelm_tab_sell') }}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          :class="{ active: currentTab === 'resources' }"
          @click="currentTab = 'resources'"
        >
          {{ t('shop_uxelm_tab_resources') }}
        </Button>
      </div>

      <!-- Storage Warning -->
      <div v-if="storageWarning" class="storage-warning">
        {{ t('shop_uxelm_storage_warning') }}
      </div>

      <!-- Catalog -->
      <div class="shop-layout">
        <div class="catalog-list">
          <div v-if="catalogItems.length === 0" class="empty-state">
            {{ t('shop_uxelm_no_items') }}
          </div>
          <div
            v-for="item in catalogItems"
            :key="item.id"
            class="catalog-item"
            :class="{ selected: selectedItem?.id === item.id, 'just-bought': justBought === item.id }"
            @click="selectItem(item)"
          >
            <span class="item-icon">{{ item.icon || '\u{1F4E6}' }}</span>
            <div class="item-info">
              <span class="item-name">{{ item.name }}</span>
              <span class="item-price">{{ item.cost }}g</span>
            </div>
          </div>
        </div>

        <!-- Detail Pane -->
        <div v-if="selectedItem" class="detail-pane">
          <h3>{{ selectedItem.name }}</h3>
          <p class="item-desc">{{ selectedItem.description || '' }}</p>
          <p class="item-price">\u{1F4B0} {{ selectedItem.cost }}g</p>

          <div class="detail-actions">
            <Button
              v-if="currentTab === 'buy'"
              variant="primary"
              :disabled="!canAfford"
              @click="buyItem"
            >
              {{ t('shop_uxelm_buy') }}
            </Button>
            <Button
              v-else-if="currentTab === 'sell'"
              variant="primary"
              @click="sellItem"
            >
              {{ t('shop_uxelm_sell') }} ({{ selectedItem.sellPrice }}g)
            </Button>
            <Button
              v-else
              variant="primary"
              :disabled="!canAfford"
              @click="buyResource"
            >
              {{ t('shop_uxelm_buy') }}
            </Button>
          </div>
        </div>

        <EmptyState v-else icon="\u{1F6D2}" :title="t('shop_uxelm_select_item')" />
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
import {
  CONSUMABLES_CATALOG,
  WEAPONS_CATALOG,
  ARMOR_CATALOG
} from '../../../../js/engine/shared/data/ShopCatalog.js'

const { t } = useI18n()
const { gameState } = useGameState()
const { dispatch } = useAdapter()

const currentTab = ref('buy')
const selectedItem = ref(null)
const justBought = ref(null)

const village = computed(() => gameState.value.village || {})
const inventory = computed(() => gameState.value.inventory || {})
const gold = computed(() => village.value.gold || 0)
const blacksmithLevel = computed(() => village.value.infrastructure?.blacksmith || 0)
const isUnlocked = computed(() => true) // Shop always unlocked for now

const storageUsed = computed(() => inventory.value.totalUsed || 0)
const storageMax = computed(() => village.value.maxStorage || 100)
const storageWarning = computed(() => storageUsed.value / storageMax.value > 0.9)

function enrichShopItem(item) {
  const name = item.i18n_name ? t(item.i18n_name) : (item.family || item.archetype || item.id)
  const desc = item.i18n_desc ? t(item.i18n_desc) : ''
  return {
    ...item,
    name,
    description: desc,
    id: item.id || `${item.type}_${item.material}_${item.family || item.archetype}_${item.slot || 'any'}`
  }
}

const catalogItems = computed(() => {
  if (currentTab.value === 'buy') {
    const items = []
    // Consumables
    items.push(...CONSUMABLES_CATALOG.map(enrichShopItem))
    // Weapons (gated by blacksmith)
    const weaponTier = blacksmithLevel.value >= 2 ? 3 : blacksmithLevel.value >= 1 ? 2 : 1
    items.push(...WEAPONS_CATALOG.filter(w => w.tier <= weaponTier).map(enrichShopItem))
    // Armor (gated by blacksmith)
    const armorTier = blacksmithLevel.value >= 2 ? 2 : 1
    items.push(...ARMOR_CATALOG.filter(a => a.tier <= armorTier).map(enrichShopItem))
    return items
  } else if (currentTab.value === 'sell') {
    const items = []
    const consumables = inventory.value.consumables || []
    const equipment = inventory.value.equipment || []
    items.push(...consumables.map((c) => ({ ...c, sellPrice: Math.floor((c.cost || 10) * 0.5) })))
    items.push(...equipment.map((e) => ({ ...e, sellPrice: Math.floor((e.value || 10) * 0.5) })))
    return items
  } else {
    // Resources tab
    return [
      { id: 'material_wood', name: t('item_material_wood'), cost: 2, quantity: 1 },
      { id: 'material_stone', name: t('item_material_stone'), cost: 3, quantity: 1 }
    ]
  }
})

const canAfford = computed(() => {
  if (!selectedItem.value) return false
  return gold.value >= (selectedItem.value.cost || 0)
})

function selectItem(item) {
  selectedItem.value = item
}

function buyItem() {
  if (!selectedItem.value || !canAfford.value) return
  dispatch('shop', 'buyItem', {
    itemData: selectedItem.value,
    costGold: selectedItem.value.cost
  })
  justBought.value = selectedItem.value.id
  setTimeout(() => { justBought.value = null }, 1000)
}

function sellItem() {
  if (!selectedItem.value) return
  dispatch('shop', 'sellItem', {
    itemId: selectedItem.value.id,
    itemType: selectedItem.value.category || selectedItem.value.type,
    sellPrice: selectedItem.value.sellPrice
  })
}

function buyResource() {
  if (!selectedItem.value || !canAfford.value) return
  dispatch('shop', 'buyResource', {
    resourceId: selectedItem.value.id,
    quantity: selectedItem.value.quantity || 1
  })
}
</script>

<style scoped>
.shop-tab {
  padding: var(--spacing-lg);
}

.lock-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.shop-tabs {
  display: flex;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-md);
}

.shop-tabs button.active {
  background: rgba(99, 102, 241, 0.2);
  border-color: var(--color-primary);
}

.storage-warning {
  padding: var(--spacing-sm) var(--spacing-md);
  margin-bottom: var(--spacing-md);
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: var(--radius-md);
  color: #f59e0b;
  font-size: 0.85rem;
}

.shop-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: var(--spacing-lg);
}

.catalog-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  max-height: 60vh;
  overflow-y: auto;
}

.catalog-item {
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

.catalog-item:hover, .catalog-item.selected {
  border-color: var(--color-primary-light);
}

.catalog-item.just-bought {
  animation: flash 0.5s ease;
}

@keyframes flash {
  0% { background: rgba(34, 197, 94, 0.3); }
  100% { background: var(--bg-card); }
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

.item-price {
  font-size: 0.75rem;
  color: var(--color-primary-light);
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

.detail-pane h3 {
  margin: 0;
}

.item-desc {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.detail-actions {
  margin-top: auto;
}

@media (max-width: 768px) {
  .shop-layout {
    grid-template-columns: 1fr;
  }
}
</style>
