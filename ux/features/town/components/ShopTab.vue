<template>
  <div class="shop-tab">
    <!-- Lock overlay -->
    <div v-if="!isUnlocked" class="lock-overlay">
      <EmptyState icon="🔒" :title="t('shop_uxelm_locked')" :message="t('shop_uxelm_locked_desc')" />
    </div>

    <template v-else>
      <!-- Shop Tabs -->
      <div class="shop-tabs">
        <button
          class="shop-tab"
          :class="{ active: currentTab === 'buy' }"
          @click="currentTab = 'buy'"
        >
          {{ t('shop_uxelm_tab_buy') }}
        </button>
        <button
          class="shop-tab"
          :class="{ active: currentTab === 'sell' }"
          @click="currentTab = 'sell'"
        >
          {{ t('shop_uxelm_tab_sell') }}
        </button>
        <button
          class="shop-tab"
          :class="{ active: currentTab === 'resources' }"
          @click="currentTab = 'resources'"
        >
          {{ t('shop_uxelm_tab_resources') }}
        </button>
      </div>

      <!-- Storage Warning -->
      <div
        v-if="storageWarning"
        class="storage-warning"
        :class="{ 'storage-full': storageFull }"
      >
        ⚠️ {{ storageWarningText }}
      </div>

      <!-- Catalog + Detail -->
      <div class="shop-layout">
        <!-- Catalog Pane -->
        <div class="catalog-list">
          <!-- Empty state for sell/buy tabs -->
          <div v-if="catalogGroups.length === 0" class="empty-detail">
            <div class="detail-icon-bg">📭</div>
            <p>{{ currentTab === 'sell' ? t('shop_uxelm_no_items_to_sell') : t('shop_uxelm_no_items') }}</p>
          </div>

          <!-- Flat list (resources tab) -->
          <div v-else-if="isFlat" class="shop-item-list">
            <div
              v-for="item in flatItems"
              :key="item.id"
              class="shop-item-row"
              :class="{ active: selectedKey === item.id }"
              @click="selectItem(item)"
            >
              <span class="list-item-title">{{ item.icon || '🌾' }} {{ t(item.id) }}</span>
              <div class="shop-item-meta">
                <span class="shop-item-owned-badge">{{ getOwnedCount(item) }}</span>
                <span class="shop-item-cost-badge">💰 {{ item.price || item.cost || 0 }}</span>
              </div>
            </div>
          </div>

          <!-- Categorized list (buy / sell tabs) -->
          <template v-else>
            <details
              v-for="group in catalogGroups"
              :key="group.id"
              class="shop-category-details"
              :open="groupHasSelection(group)"
            >
              <summary>
                <span>{{ group.icon }} {{ group.title }}</span>
                <span class="arrow">▼</span>
              </summary>
              <div class="shop-item-list">
                <div
                  v-for="item in group.items"
                  :key="getItemKey(item)"
                  class="shop-item-row"
                  :class="{
                    active: selectedKey === getItemKey(item),
                    'just-bought': justBoughtKey === getItemKey(item),
                    'just-sold': justSoldKey === getItemKey(item)
                  }"
                  @click="selectItem(item)"
                >
                  <span class="list-item-title">
                    {{ displayName(item) }}
                    <span v-if="item.count !== undefined && item.type === 'consumable'" class="count-badge"> ×{{ item.count }}</span>
                  </span>
                  <div class="shop-item-meta">
                    <span
                      v-if="!(item.type === 'consumable' && item.count !== undefined)"
                      class="shop-item-owned-badge"
                    >
                      {{ getOwnedCount(item) }}
                    </span>
                    <span
                      class="shop-item-cost-badge"
                      :class="{ insufficient: !canAffordItem(item) }"
                    >
                      💰 {{ item.cost || item.sellPrice || 0 }}
                    </span>
                  </div>
                </div>
              </div>
            </details>
          </template>
        </div>

        <!-- Detail Pane -->
        <div class="detail-pane">
          <template v-if="!selectedItem">
            <div class="empty-detail">
              <div class="detail-icon-bg">🛒</div>
              <p>{{ t('shop_uxelm_select_item') }}</p>
            </div>
          </template>

          <template v-else>
            <!-- Header -->
            <div class="shop-detail-header">
              <div class="shop-title-group">
                <h2>{{ detailName }}</h2>
                <span class="shop-category-text">{{ detailCategory }}</span>
              </div>
              <span v-if="detailTier" class="shop-tier-badge">{{ detailTier }}</span>
            </div>

            <!-- Body -->
            <div class="shop-detail-body">
              <!-- Preview Icon -->
              <div class="shop-preview-card">
                <span class="shop-preview-icon">{{ detailIcon }}</span>
              </div>

              <!-- Description -->
              <p v-if="detailDesc" class="shop-desc-text">{{ detailDesc }}</p>

              <!-- Stats -->
              <div v-if="showStats" class="shop-stats-card">
                <h4>{{ t('shop_uxelm_stats') }}</h4>
                <div
                  v-for="[stat, val] in detailStats"
                  :key="stat"
                  class="shop-stat-row"
                >
                  <span class="shop-stat-label">{{ statLabel(stat) }}</span>
                  <span class="shop-stat-value">{{ statValue(stat, val) }}</span>
                </div>
              </div>

              <!-- Owned Breakdown (buy tab) -->
              <div v-if="currentTab === 'buy' && ownedBreakdown.total > 0" class="shop-owned-breakdown">
                <span>{{ t('inventory_uxelm_owned') }}: {{ ownedBreakdown.total }}</span>
                <span class="owned-sub">
                  ({{ t('inventory_uxelm_inventory') }}: {{ ownedBreakdown.inventory }} | {{ t('inventory_uxelm_equipped') }}: {{ ownedBreakdown.equipped }})
                </span>
              </div>

              <!-- Owned Breakdown (resources tab) -->
              <div v-if="currentTab === 'resources'" class="shop-owned-breakdown">
                <span>{{ t('inventory_uxelm_owned') }}: {{ resourceOwnedCount }}</span>
              </div>

              <!-- Cost Section -->
              <div v-if="currentTab !== 'resources'" class="shop-cost-section">
                <h4>{{ costLabel }}</h4>
                <div class="shop-cost-item" :class="{ insufficient: !canAffordSelected }">
                  <span class="label">{{ t('shop_uxelm_cost_unit') }}</span>
                  <span class="value">💰 {{ selectedItem.cost || selectedItem.sellPrice || 0 }}</span>
                </div>
              </div>

              <!-- Resource Buy/Sell Cost Section -->
              <div v-if="currentTab === 'resources'" class="shop-cost-section">
                <h4>{{ t('shop_uxelm_cost') }}</h4>
                <div v-if="selectedItem.buyPrice" class="shop-cost-item" :class="{ insufficient: !canAffordBuy(1) }">
                  <span class="label">{{ t('shop_uxelm_buy') }}</span>
                  <span class="value">💰 {{ selectedItem.buyPrice }}</span>
                </div>
                <div class="shop-cost-item">
                  <span class="label">{{ t('shop_uxelm_sell') }}</span>
                  <span class="value">💰 {{ selectedItem.price || 0 }}</span>
                </div>
              </div>

              <!-- Action Buttons -->
              <!-- Buy / Sell standard button -->
              <div v-if="currentTab !== 'resources'" class="shop-action-footer">
                <Button
                  :variant="justAction ? 'success' : (canAffordSelected ? 'primary' : 'secondary')"
                  :disabled="actionDisabled"
                  class="btn-buy-action"
                  :class="{ bought: justAction }"
                  @click="doAction"
                >
                  {{ actionButtonText }}
                </Button>
              </div>

              <!-- Resource quantity buttons -->
              <div v-else class="shop-action-footer resource-buttons">
                <!-- Buy buttons (only for items with buyPrice) -->
                <template v-if="selectedItem.buyPrice">
                  <Button
                    v-for="qty in [1, 10, 100]"
                    :key="'buy-' + qty"
                    :variant="canAffordBuy(qty) ? 'primary' : 'secondary'"
                    :disabled="!canAffordBuy(qty)"
                    @click="buyResource(qty)"
                  >
                    {{ t('shop_uxelm_buy') }} {{ qty }} ({{ qty * selectedItem.buyPrice }}g)
                  </Button>
                </template>
                <!-- Sell buttons -->
                <Button
                  v-for="qty in [1, 10, 100]"
                  :key="'sell-' + qty"
                  :variant="resourceOwnedCount >= qty ? 'primary' : 'secondary'"
                  :disabled="resourceOwnedCount < qty"
                  @click="sellResource(qty)"
                >
                  {{ t('shop_uxelm_sell') }} {{ qty }} ({{ qty * (selectedItem.price || 0) }}g)
                </Button>
              </div>
            </div>
          </template>
        </div>
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
  getEquipmentName,
  getEquipmentStats,
  getFormattedStats
} from '@/core/helpers/EquipmentHelper.js'
import {
  getItemKey,
  getOwnedBreakdown
} from '@/core/helpers/ShopUtils.js'
import {
  CONSUMABLES_CATALOG,
  WEAPONS_CATALOG,
  ARMOR_CATALOG
} from '@/core/data/index.js'

const { t } = useI18n()
const { gameState } = useGameState()
const { dispatch } = useAdapter()

const currentTab = ref('buy')
const selectedKey = ref(null)
const justBoughtKey = ref(null)
const justSoldKey = ref(null)

// ─── Basic State Selectors ──────────────────────────────────────────

const village = computed(() => gameState.value.village || {})
const inventory = computed(() => gameState.value.inventory || {})
const heroes = computed(() => gameState.value.heroes || [])
const gold = computed(() => village.value.gold || 0)
const blacksmithLevel = computed(() => village.value.infrastructure?.blacksmith || 0)
const isUnlocked = computed(() => {
  const completed = gameState.value.completedExpeditions || []
  return completed.includes('exp_tutorial_cave')
})

const storageUsed = computed(() => inventory.value.totalUsed || 0)
const storageMax = computed(() => village.value.maxStorage || 100)
const storageFull = computed(() => storageUsed.value >= storageMax.value)
const storageWarning = computed(() => storageFull.value || (storageUsed.value / storageMax.value >= 0.9))
const storageWarningText = computed(() => {
  if (storageFull.value) {
    return `${t('inventory_error_storage_full')} (${storageUsed.value} / ${storageMax.value})`
  }
  return `${t('shop_uxelm_storage_nearly_full')} (${storageUsed.value} / ${storageMax.value})`
})

// ─── Buy Tab ────────────────────────────────────────────────────────

const maxTier = computed(() => {
  const bl = blacksmithLevel.value
  if (bl >= 7) return 5
  if (bl >= 5) return 4
  if (bl >= 3) return 3
  if (bl >= 1) return 2
  return 1
})

const buyGroups = computed(() => {
  const groups = [
    {
      id: 'consumables',
      title: t('inventory_uxelm_category_consumables'),
      icon: '💊',
      items: CONSUMABLES_CATALOG.map(item => ({ ...item, _source: 'catalog' }))
    },
    {
      id: 'weapons',
      title: t('inventory_uxelm_category_equipment'),
      icon: '⚔️',
      items: WEAPONS_CATALOG.filter(w => w.tier <= maxTier.value).map(item => ({ ...item, _source: 'catalog' }))
    },
    {
      id: 'helmets',
      title: t('inventory_info_slot_head'),
      icon: '⛑️',
      items: ARMOR_CATALOG.filter(a => a.slot === 'head' && a.tier <= maxTier.value).map(item => ({ ...item, _source: 'catalog' }))
    },
    {
      id: 'armors',
      title: t('inventory_info_slot_body'),
      icon: '👕',
      items: ARMOR_CATALOG.filter(a => a.slot === 'body' && a.tier <= maxTier.value).map(item => ({ ...item, _source: 'catalog' }))
    },
    {
      id: 'legwear',
      title: t('inventory_info_slot_legs'),
      icon: '👖',
      items: ARMOR_CATALOG.filter(a => a.slot === 'legs' && a.tier <= maxTier.value).map(item => ({ ...item, _source: 'catalog' }))
    },
    {
      id: 'shields',
      title: t('inventory_info_slot_rightHand'),
      icon: '🛡️',
      items: ARMOR_CATALOG.filter(a => a.slot === 'rightHand' && a.tier <= maxTier.value).map(item => ({ ...item, _source: 'catalog' }))
    }
  ]
  return groups.filter(g => g.items.length > 0)
})

const allBuyItems = computed(() => buyGroups.value.flatMap(g => g.items))

// ─── Sell Tab ───────────────────────────────────────────────────────

const sellGroups = computed(() => {
  const groups = []
  const consumablesObj = inventory.value.consumables || {}

  // Consumables
  const consumableItems = Object.entries(consumablesObj)
    .filter(([_, count]) => count > 0)
    .map(([id, count]) => {
      // Inventory/loot IDs (e.g. 'tiny_hp_potion') differ from shop catalog IDs ('item_tiny_hp_potion')
      let shopItem = CONSUMABLES_CATALOG.find(c => c.id === id)
      if (!shopItem && !id.startsWith('item_')) {
        shopItem = CONSUMABLES_CATALOG.find(c => c.id === `item_${id}`)
      }
      const basePrice = shopItem ? shopItem.cost : 0
      const result = dispatch('shop', 'getSellPrice', { item: { type: 'consumable', basePrice } })
      const sellPrice = result.success ? result.data : Math.floor(basePrice * 0.3)
      return {
        id,
        type: 'consumable',
        count,
        i18n_name: shopItem ? shopItem.i18n_name : id,
        i18n_desc: shopItem ? shopItem.i18n_desc : id,
        sellPrice
      }
    })

  if (consumableItems.length > 0) {
    groups.push({
      id: 'consumables',
      title: t('inventory_uxelm_category_consumables'),
      icon: '💊',
      items: consumableItems
    })
  }

  // Equipment
  const equipment = inventory.value.equipment || []
  const eqGroups = [
    { id: 'weapons', filter: eq => eq.type === 'weapon', icon: '⚔️' },
    { id: 'helmets', filter: eq => eq.type === 'armor' && eq.slot === 'head', icon: '⛑️' },
    { id: 'armors', filter: eq => eq.type === 'armor' && eq.slot === 'body', icon: '👕' },
    { id: 'legwear', filter: eq => eq.type === 'armor' && eq.slot === 'legs', icon: '👖' },
    { id: 'shields', filter: eq => eq.type === 'armor' && eq.slot === 'rightHand', icon: '🛡️' }
  ]

  eqGroups.forEach(g => {
    const items = equipment.filter(g.filter).map(eq => {
      const result = dispatch('shop', 'getSellPrice', { item: eq })
      const sellPrice = result.success ? result.data : Math.floor((eq.value || 10) * 0.5)
      return {
        ...eq,
        category: 'equipment',
        sellPrice
      }
    })
    if (items.length > 0) {
      groups.push({
        id: g.id,
        title: t(g.id === 'weapons' ? 'inventory_uxelm_category_equipment' : 'inventory_info_slot_' + (g.id === 'shields' ? 'rightHand' : g.id === 'helmets' ? 'head' : g.id === 'armors' ? 'body' : 'legs')),
        icon: g.icon,
        items
      })
    }
  })

  return groups
})

const allSellItems = computed(() => sellGroups.value.flatMap(g => g.items))

// ─── Resources Tab ──────────────────────────────────────────────────

const resourceItems = [
  { id: 'food_raw_grain', price: 1, icon: '🌾' },
  { id: 'material_wood', price: 2, buyPrice: 10, icon: '🪵' },
  { id: 'material_stone', price: 3, buyPrice: 15, icon: '🪨' }
]

// ─── Catalog Groups (active tab) ────────────────────────────────────

const catalogGroups = computed(() => {
  if (currentTab.value === 'buy') return buyGroups.value
  if (currentTab.value === 'sell') return sellGroups.value
  return [{ id: 'resources', items: resourceItems }]
})

const isFlat = computed(() => currentTab.value === 'resources')
const flatItems = computed(() => catalogGroups.value.flatMap(g => g.items))

// ─── Selected Item ──────────────────────────────────────────────────

function ensureSelection() {
  const items = currentTab.value === 'buy' ? allBuyItems.value : currentTab.value === 'sell' ? allSellItems.value : resourceItems
  if (items.length === 0) {
    selectedKey.value = null
    return
  }
  const isValid = currentTab.value === 'buy'
    ? items.some(item => getItemKey(item) === selectedKey.value)
    : items.some(item => item.id === selectedKey.value)
  if (!selectedKey.value || !isValid) {
    selectedKey.value = currentTab.value === 'buy' ? getItemKey(items[0]) : items[0].id
  }
}

const selectedItem = computed(() => {
  ensureSelection()
  if (currentTab.value === 'buy') {
    return allBuyItems.value.find(item => getItemKey(item) === selectedKey.value) || null
  } else if (currentTab.value === 'sell') {
    return allSellItems.value.find(item => item.id === selectedKey.value) || null
  } else {
    return resourceItems.find(item => item.id === selectedKey.value) || null
  }
})

function selectItem(item) {
  if (currentTab.value === 'buy') {
    selectedKey.value = getItemKey(item)
  } else {
    selectedKey.value = item.id
  }
}

function groupHasSelection(group) {
  if (currentTab.value === 'buy') {
    return group.items.some(item => getItemKey(item) === selectedKey.value)
  }
  return group.items.some(item => item.id === selectedKey.value)
}

// ─── Display Helpers ────────────────────────────────────────────────

function displayName(item) {
  if (item.type === 'consumable') {
    return t(item.i18n_name)
  }
  if (item.type === 'equipment' || item.type === 'weapon' || item.type === 'armor') {
    return getEquipmentName(item, t)
  }
  return item.id
}

function getOwnedCount(item) {
  if (currentTab.value === 'sell') {
    return item.count || 1
  }
  if (currentTab.value === 'resources') {
    const materials = inventory.value.materials || {}
    const food = inventory.value.food || {}
    return item.id.startsWith('food_') ? (food[item.id] || 0) : (materials[item.id] || 0)
  }
  return getOwnedBreakdown(item, gameState.value).total
}

function canAffordItem(item) {
  const cost = item.cost || 0
  return gold.value >= cost
}

function canAffordBuy(qty) {
  if (!selectedItem.value || !selectedItem.value.buyPrice) return false
  return gold.value >= (qty * selectedItem.value.buyPrice)
}

const canAffordSelected = computed(() => {
  if (!selectedItem.value) return false
  if (currentTab.value === 'sell' || currentTab.value === 'resources') return true
  return canAffordItem(selectedItem.value)
})

// ─── Detail Pane Computed ───────────────────────────────────────────

const detailName = computed(() => {
  if (!selectedItem.value) return ''
  const item = selectedItem.value
  if (currentTab.value === 'resources') return t(item.id)
  if (item.type === 'consumable') return t(item.i18n_name)
  return getEquipmentName(item, t)
})

const detailCategory = computed(() => {
  if (!selectedItem.value) return ''
  const item = selectedItem.value
  if (currentTab.value === 'resources') return t('shop_uxelm_category_resources')
  if (item.type === 'consumable') return t('inventory_uxelm_category_consumables')
  if (item.type === 'weapon') return t('inventory_info_type_weapon')
  return t('inventory_info_slot_' + item.slot)
})

const detailTier = computed(() => {
  if (!selectedItem.value || currentTab.value === 'resources') return ''
  const item = selectedItem.value
  if (item.type === 'consumable') return ''
  if (item.tier) return `Tier ${item.tier}`
  if (item.level !== undefined) return `+${item.level}`
  return ''
})

const detailIcon = computed(() => {
  if (!selectedItem.value) return ''
  const item = selectedItem.value
  if (currentTab.value === 'resources') return item.icon || '🌾'
  if (item.type === 'consumable') return item.id.includes('potion') ? '💊' : '📜'
  if (item.type === 'weapon') return item.family === 'wand' ? '🔮' : '⚔️'
  if (item.slot === 'head') return '⛑️'
  if (item.slot === 'rightHand') return '🛡️'
  return '👕'
})

const detailDesc = computed(() => {
  if (!selectedItem.value) return ''
  const item = selectedItem.value
  if (currentTab.value === 'resources') return t('desc_' + item.id)
  if (item.type === 'consumable') return t(item.i18n_desc)
  // For equipment, show stats as description only if no structured stats card is shown
  const stats = getEquipmentStats(item)
  const hasStats = Object.values(stats).some(v => v)
  if (!hasStats) return t('inventory_info_no_stats')
  return '' // Stats card handles structured display for equipment with stats
})

const showStats = computed(() => {
  if (!selectedItem.value || currentTab.value === 'resources') return false
  const item = selectedItem.value
  if (item.type === 'consumable') return false
  const stats = getEquipmentStats(item)
  return Object.values(stats).some(v => v)
})

const detailStats = computed(() => {
  if (!selectedItem.value) return []
  const stats = getEquipmentStats(selectedItem.value)
  return Object.entries(stats).filter(([_, val]) => val)
})

const STAT_LABEL_MAP = {
  strength: 'heroes_info_stat_strength',
  defense: 'heroes_info_stat_defense',
  maxHp: 'heroes_info_stat_hp',
  maxMp: 'heroes_info_stat_mp',
  magicPower: 'heroes_info_stat_magic_power',
  speed: 'heroes_info_stat_speed',
  evasion: 'heroes_info_stat_evasion',
  mpCostReduction: 'heroes_info_stat_mpCostReduction'
}

function statLabel(stat) {
  return t(STAT_LABEL_MAP[stat] || stat)
}

function statValue(stat, val) {
  if (stat === 'evasion') {
    const sign = val > 0 ? '+' : ''
    return `${sign}${val}%`
  }
  if (stat === 'mpCostReduction') {
    return `-${val}%`
  }
  if (stat === 'speed') {
    const sign = val > 0 ? '+' : ''
    return `${sign}${val}`
  }
  return `+${val}`
}

const ownedBreakdown = computed(() => {
  if (!selectedItem.value || currentTab.value !== 'buy') return { total: 0, inventory: 0, equipped: 0 }
  return getOwnedBreakdown(selectedItem.value, gameState.value)
})

const resourceOwnedCount = computed(() => {
  if (!selectedItem.value || currentTab.value !== 'resources') return 0
  const item = selectedItem.value
  const materials = inventory.value.materials || {}
  const food = inventory.value.food || {}
  return item.id.startsWith('food_') ? (food[item.id] || 0) : (materials[item.id] || 0)
})

const costLabel = computed(() => {
  if (currentTab.value === 'sell') return t('shop_uxelm_sell_price')
  return t('shop_uxelm_cost')
})

// ─── Actions ────────────────────────────────────────────────────────

const justAction = computed(() => {
  if (!selectedItem.value) return false
  const key = currentTab.value === 'buy' ? getItemKey(selectedItem.value) : selectedItem.value.id
  if (currentTab.value === 'buy') return justBoughtKey.value === key
  if (currentTab.value === 'sell') return justSoldKey.value === key
  return false
})

const actionDisabled = computed(() => {
  if (!selectedItem.value) return true
  if (justAction.value) return true
  if (currentTab.value === 'buy' && (!canAffordSelected.value || storageFull.value)) return true
  return false
})

const actionButtonText = computed(() => {
  if (justAction.value) {
    return currentTab.value === 'buy' ? t('shop_uxelm_purchased') : t('shop_uxelm_sold')
  }
  if (currentTab.value === 'buy' && storageFull.value) return t('inventory_error_storage_full')
  if (currentTab.value === 'buy') return t('shop_uxelm_buy')
  return t('shop_uxelm_sell')
})

function doAction() {
  if (!selectedItem.value) return
  if (currentTab.value === 'buy') {
    dispatch('shop', 'buyItem', {
      itemData: selectedItem.value,
      costGold: selectedItem.value.cost
    })
    justBoughtKey.value = getItemKey(selectedItem.value)
    setTimeout(() => { justBoughtKey.value = null }, 600)
  } else if (currentTab.value === 'sell') {
    dispatch('shop', 'sellItem', {
      itemId: selectedItem.value.id,
      itemType: selectedItem.value.category || selectedItem.value.type,
      sellPrice: selectedItem.value.sellPrice
    })
    justSoldKey.value = selectedItem.value.id
    setTimeout(() => { justSoldKey.value = null }, 600)
  }
}

function sellResource(qty) {
  if (!selectedItem.value) return
  dispatch('shop', 'sellResource', {
    resourceId: selectedItem.value.id,
    quantity: qty,
    pricePerUnit: selectedItem.value.price
  })
}

function buyResource(qty) {
  if (!selectedItem.value) return
  dispatch('shop', 'buyResource', {
    resourceId: selectedItem.value.id,
    quantity: qty
  })
}
</script>

<style scoped>
.shop-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.lock-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
}

/* Tabs */
.shop-tabs {
  display: flex;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-md);
  border-bottom: 2px solid var(--glass-border);
  padding-bottom: 2px;
  flex-shrink: 0;
  padding-left: var(--spacing-lg);
  padding-right: var(--spacing-lg);
}

.shop-tab {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-family: var(--font-heading);
  font-size: 0.95rem;
  font-weight: 600;
  padding: 8px 20px;
  cursor: pointer;
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  transition: all 0.2s ease;
  position: relative;
}

.shop-tab:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.03);
}

.shop-tab.active {
  color: var(--accent-color);
  background: rgba(90, 105, 250, 0.08);
}

.shop-tab.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--accent-color);
  border-radius: 2px;
}

/* Storage Warning */
.storage-warning {
  padding: var(--spacing-sm) var(--spacing-md);
  margin: var(--spacing-md) var(--spacing-lg) 0;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: var(--radius-md);
  color: #f59e0b;
  font-size: 0.85rem;
  font-weight: 600;
  flex-shrink: 0;
}

.storage-warning.storage-full {
  background: rgba(239, 68, 68, 0.1);
  border-color: var(--danger);
  color: var(--danger);
}

/* Layout */
.shop-layout {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: var(--spacing-lg);
  flex: 1;
  min-height: 0;
  padding: var(--spacing-md) var(--spacing-lg) var(--spacing-lg);
}

.catalog-list {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  padding-right: 6px;
}

/* Accordion Categories */
.shop-category-details summary::-webkit-details-marker {
  display: none;
}

.shop-category-details summary {
  list-style: none;
  outline: none;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  background: rgba(255, 255, 255, 0.02);
  border-radius: var(--radius-md);
  border: 1px solid var(--glass-border);
  margin-bottom: var(--spacing-xs);
  font-weight: 700;
  transition: all 0.2s ease;
  user-select: none;
  color: var(--text-primary);
}

.shop-category-details summary:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(90, 105, 250, 0.3);
}

.shop-category-details[open] summary {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  margin-bottom: 0;
  border-color: rgba(90, 105, 250, 0.2);
}

.shop-category-details .shop-item-list {
  background: rgba(0, 0, 0, 0.15);
  border: 1px solid var(--glass-border);
  border-top: none;
  border-bottom-left-radius: var(--radius-md);
  border-bottom-right-radius: var(--radius-md);
  padding: var(--spacing-sm);
  margin-top: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-sm);
}

.shop-category-details .arrow {
  transition: transform 0.2s ease;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.shop-category-details[open] .arrow {
  transform: rotate(180deg);
}

/* Item Rows */
.shop-item-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.shop-item-row {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.shop-item-row:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(90, 105, 250, 0.3);
}

.shop-item-row.active {
  background: rgba(90, 105, 250, 0.15);
  border-color: var(--accent-color);
  box-shadow: 0 0 10px rgba(90, 105, 250, 0.1);
}

.shop-item-row.just-bought {
  animation: flash-success 0.5s ease;
}

.shop-item-row.just-sold {
  animation: flash-success 0.5s ease;
}

@keyframes flash-success {
  0% { background: rgba(34, 197, 94, 0.3); }
  100% { background: rgba(255, 255, 255, 0.02); }
}

.list-item-title {
  font-weight: 600;
  color: var(--text-primary);
}

.count-badge {
  color: var(--text-muted);
  font-weight: 400;
}

.shop-item-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.shop-item-owned-badge {
  font-size: 0.75rem;
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.05);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
}

.shop-item-cost-badge {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--warning);
}

.shop-item-cost-badge.insufficient {
  color: var(--danger);
}

/* Detail Pane */
.detail-pane {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
}

.empty-detail {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  text-align: center;
  color: var(--text-muted);
  gap: var(--spacing-md);
}

.detail-icon-bg {
  font-size: 3rem;
  opacity: 0.5;
}

/* Detail Header */
.shop-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--glass-border);
}

.shop-title-group h2 {
  font-family: var(--font-heading);
  font-size: 1.6rem;
  color: var(--text-primary);
  margin: 0 0 4px 0;
}

.shop-category-text {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.shop-tier-badge {
  background: var(--accent-color);
  color: white;
  padding: 4px 12px;
  border-radius: var(--radius-lg);
  font-size: 0.9rem;
  font-weight: 800;
}

/* Detail Body */
.shop-detail-body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.shop-preview-card {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 120px;
}

.shop-preview-icon {
  font-size: 4rem;
}

.shop-desc-text {
  line-height: 1.5;
  color: var(--text-secondary);
  font-size: 0.95rem;
  margin: 0;
}

/* Stats */
.shop-stats-card {
  background: rgba(0, 0, 0, 0.2);
  padding: 15px 20px;
  border-radius: var(--radius-md);
  border: 1px solid var(--glass-border);
}

.shop-stats-card h4 {
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--text-secondary);
  text-transform: uppercase;
  font-size: 0.85rem;
  letter-spacing: 0.5px;
}

.shop-stat-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.05);
}

.shop-stat-row:last-child {
  border-bottom: none;
}

.shop-stat-label {
  color: var(--text-secondary);
}

.shop-stat-value {
  font-weight: 700;
  color: var(--text-primary);
}

/* Owned Breakdown */
.shop-owned-breakdown {
  background: rgba(255, 255, 255, 0.01);
  padding: 10px 15px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--glass-border);
  font-size: 0.85rem;
  color: var(--text-secondary);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.owned-sub {
  color: var(--text-muted);
  font-size: 0.8rem;
}

/* Cost Section */
.shop-cost-section {
  background: rgba(0, 0, 0, 0.2);
  padding: 15px 20px;
  border-radius: var(--radius-md);
  border: 1px solid var(--glass-border);
}

.shop-cost-section h4 {
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--text-secondary);
  text-transform: uppercase;
  font-size: 0.85rem;
  letter-spacing: 0.5px;
}

.shop-cost-item {
  background: var(--bg-accent, #1e2230);
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--glass-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
}

.shop-cost-item.insufficient {
  border-color: var(--danger);
  color: var(--danger);
}

.shop-cost-item .value {
  font-weight: 700;
}

.shop-cost-item .label {
  color: var(--text-secondary);
}

/* Action Footer */
.shop-action-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: auto;
  padding-top: var(--spacing-md);
}

.shop-action-footer.resource-buttons {
  flex-wrap: wrap;
  gap: 8px;
}

.btn-buy-action.bought {
  animation: pop 0.4s ease;
}

@keyframes pop {
  0% { transform: scale(1); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
}

@keyframes flash-success {
  0% { background: rgba(34, 197, 94, 0.3); }
  100% { background: rgba(255, 255, 255, 0.02); }
}

/* Mobile */
@media (max-width: 768px) {
  .shop-layout {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 1fr;
  }
}
</style>
