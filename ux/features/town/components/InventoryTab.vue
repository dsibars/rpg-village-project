<template>
  <div class="inventory-tab">
    <!-- Storage bar -->
    <div class="storage-bar">
      <div class="storage-track">
        <div
          class="storage-fill"
          :class="{ warning: storagePercent > 75, danger: storagePercent > 90 }"
          :style="{ width: `${storagePercent}%` }"
        />
      </div>
      <span class="storage-text">{{ storageUsed }} / {{ storageMax }}</span>
    </div>

    <!-- Filters -->
    <div class="filter-tabs">
      <button
        v-for="filter in filters"
        :key="filter.id"
        class="filter-btn"
        :class="{ active: activeFilter === filter.id }"
        @click="activeFilter = filter.id"
      >
        {{ filter.label }}
      </button>
    </div>

    <div class="inventory-layout">
      <!-- Item Grid -->
      <div class="item-grid">
        <div
          v-for="item in filteredItems"
          :key="item.id"
          class="grid-item"
          :class="{ selected: selectedId === item.id }"
          @click="selectedId = item.id"
        >
          <span class="item-icon">{{ item.icon || '\u{1F4E6}' }}</span>
          <span class="item-count">x{{ item.count || 1 }}</span>
          <span class="item-name">{{ item.name }}</span>
        </div>
      </div>

      <!-- Detail Pane -->
      <div v-if="selectedItem" class="detail-pane">
        <h3>{{ selectedItem.name }}</h3>
        <p class="item-desc">{{ selectedItem.description || '' }}</p>
        <p class="item-count">{{ t('inventory_uxelm_count') }}: {{ selectedItem.count || 1 }}</p>

        <div class="detail-actions">
          <Button
            v-if="selectedItem.type === 'meal'"
            variant="primary"
            size="sm"
            @click="consumeMeal"
          >
            {{ t('inventory_uxelm_consume') }}
          </Button>
          <Button
            v-if="selectedItem.type === 'recipe'"
            variant="primary"
            size="sm"
            @click="cookMeal"
          >
            {{ t('inventory_uxelm_cook') }}
          </Button>
          <Button
            v-if="selectedItem.type === 'glyph_tablet'"
            variant="primary"
            size="sm"
            @click="showTeachModal = true"
          >
            {{ t('inventory_uxelm_teach') }}
          </Button>
        </div>
      </div>

      <EmptyState v-else icon="\u{1F392}" :title="t('inventory_uxelm_select_item')" />
    </div>

    <!-- Teach Glyph Modal -->
    <ModalFrame
      v-if="showTeachModal && selectedItem?.type === 'glyph_tablet'"
      :title="t('inventory_uxelm_teach_glyph')"
      @close="showTeachModal = false"
    >
      <div class="teach-modal">
        <p>{{ t('inventory_uxelm_select_hero') }}</p>
        <div class="hero-list">
          <Button
            v-for="hero in heroes"
            :key="hero.id"
            variant="secondary"
            size="sm"
            @click="teachGlyph(hero.id)"
          >
            {{ hero.name }} (Lv.{{ hero.level }})
          </Button>
        </div>
      </div>
    </ModalFrame>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import { useGameState } from '@/core/composables/useGameState.js'
import { useAdapter } from '@/core/composables/useAdapter.js'
import Button from '@/components/Button.vue'
import EmptyState from '@/components/EmptyState.vue'
import ModalFrame from '@/components/ModalFrame.vue'

const { t } = useI18n()
const { gameState, heroes } = useGameState()
const { dispatch } = useAdapter()

const activeFilter = ref('all')
const selectedId = ref(null)
const showTeachModal = ref(false)

const inventory = computed(() => gameState.value.inventory || {})
const storageUsed = computed(() => inventory.value.totalUsed || 0)
const storageMax = computed(() => gameState.value.village?.maxStorage || 100)
const storagePercent = computed(() => Math.min(100, (storageUsed.value / storageMax.value) * 100))

const filters = computed(() => [
  { id: 'all', label: t('inventory_filter_all') },
  { id: 'materials', label: t('inventory_filter_materials') },
  { id: 'food', label: t('inventory_filter_food') },
  { id: 'consumables', label: t('inventory_filter_consumables') },
  { id: 'equipment', label: t('inventory_filter_equipment') }
])

const allItems = computed(() => {
  const items = []
  if (activeFilter.value === 'all' || activeFilter.value === 'materials') {
    items.push(...(inventory.value.materials || []).map((m) => ({ ...m, type: 'material' })))
  }
  if (activeFilter.value === 'all' || activeFilter.value === 'food') {
    items.push(...(inventory.value.food || []).map((f) => ({ ...f, type: 'food' })))
    items.push(...(inventory.value.meals || []).map((m) => ({ ...m, type: 'meal' })))
  }
  if (activeFilter.value === 'all' || activeFilter.value === 'consumables') {
    items.push(...(inventory.value.consumables || []).map((c) => ({ ...c, type: 'consumable' })))
  }
  if (activeFilter.value === 'all' || activeFilter.value === 'equipment') {
    items.push(...(inventory.value.equipment || []).map((e) => ({ ...e, type: 'equipment' })))
  }
  // Recipes and glyph tablets
  if (activeFilter.value === 'all') {
    items.push(...(inventory.value.recipes || []).map((r) => ({ ...r, type: 'recipe' })))
    items.push(...(inventory.value.glyphTablets || []).map((g) => ({ ...g, type: 'glyph_tablet' })))
  }
  return items
})

const filteredItems = computed(() => allItems.value)

const selectedItem = computed(() =>
  filteredItems.value.find((i) => i.id === selectedId.value)
)

function consumeMeal() {
  if (!selectedItem.value) return
  dispatch('inventory', 'consumeMeal', { mealId: selectedItem.value.id })
}

function cookMeal() {
  if (!selectedItem.value) return
  dispatch('inventory', 'cookMeal', { recipeId: selectedItem.value.id })
}

function teachGlyph(heroId) {
  if (!selectedItem.value) return
  dispatch('inventory', 'useGlyphTablet', { heroId, tabletId: selectedItem.value.id })
  showTeachModal.value = false
}
</script>

<style scoped>
.inventory-tab {
  padding: var(--spacing-lg);
}

.storage-bar {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
}

.storage-track {
  flex: 1;
  height: 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  overflow: hidden;
}

.storage-fill {
  height: 100%;
  background: #22c55e;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.storage-fill.warning { background: #f59e0b; }
.storage-fill.danger { background: #ef4444; }

.storage-text {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.filter-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-md);
}

.filter-btn {
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  cursor: pointer;
  font-family: var(--font-body);
  font-size: 0.8rem;
}

.filter-btn.active {
  border-color: var(--color-primary);
  background: rgba(99, 102, 241, 0.1);
}

.inventory-layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: var(--spacing-lg);
}

.item-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: var(--spacing-xs);
  max-height: 60vh;
  overflow-y: auto;
}

.grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: var(--spacing-sm);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.15s ease;
}

.grid-item:hover, .grid-item.selected {
  border-color: var(--color-primary-light);
}

.item-icon {
  font-size: 1.5rem;
}

.item-count {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.item-name {
  font-size: 0.7rem;
  color: var(--text-secondary);
  text-align: center;
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

.detail-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  margin-top: auto;
}

.teach-modal {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.hero-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

@media (max-width: 768px) {
  .inventory-layout {
    grid-template-columns: 1fr;
  }
}
</style>
