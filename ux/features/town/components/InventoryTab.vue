<template>
  <div class="inventory-tab">
    <!-- Storage bar -->
    <div class="storage-bar">
      <span class="storage-label">{{ t('shared_uxelm_storage') }}</span>
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
      <!-- Item Grid (Master) -->
      <div class="item-grid">
        <div
          v-for="item in filteredItems"
          :key="item.id"
          class="grid-item"
          :class="{ selected: selectedId === item.id }"
          @click="selectedId = item.id"
        >
          <span v-if="(item.qty || 1) > 1" class="item-badge">{{ item.qty }}</span>
          <span class="item-icon">{{ item.icon || '📦' }}</span>
          <span class="item-name">{{ item.name }}</span>
        </div>
  <div v-if="filteredItems.length === 0" class="grid-empty">
          <div class="empty-icon">📭</div>
          <p>{{ t('inventory_uxelm_no_items') }}</p>
        </div>
      </div>

      <!-- Detail Pane -->
      <div class="detail-pane">
        <template v-if="!selectedItem">
          <div class="empty-detail">
            <div class="detail-icon-bg">🎒</div>
            <p>{{ t('inventory_uxelm_select_item') }}</p>
          </div>
        </template>

        <template v-else>
          <div class="item-inspector">
            <!-- Header -->
            <div class="item-inspector-header">
              <div class="item-inspector-visual">
                <span class="item-inspector-icon">{{ selectedItem.icon || '📦' }}</span>
              </div>
              <div class="item-inspector-title-group">
                <span class="item-inspector-badge">{{ detailCategory }}</span>
                <h2>{{ selectedItem.name }}</h2>
                <div class="item-inspector-qty">
                  {{ t('inventory_uxelm_owned') }}: <strong>{{ selectedItem.qty || 1 }}</strong>
                </div>
              </div>
            </div>

            <!-- Body -->
            <div class="item-inspector-body">
              <p class="item-inspector-description">{{ detailDescription }}</p>

              <!-- Equipment Stats -->
              <div v-if="selectedItem.type === 'equipment' && selectedItem.rawEquipment" class="item-inspector-stats">
                <h4>{{ t('inventory_uxelm_equipment_stats') }}</h4>
                <div class="inspector-stat-row">
                  <span class="inspector-stat-label">{{ t('inventory_uxelm_slot') }}</span>
                  <span class="inspector-stat-value" style="text-transform: capitalize;">
                    {{ selectedItem.rawEquipment.type }}
                    <template v-if="selectedItem.rawEquipment.slot">({{ selectedItem.rawEquipment.slot }})</template>
                  </span>
                </div>
                <div class="inspector-stat-row">
                  <span class="inspector-stat-label">{{ t('shared_uxelm_tier') }}</span>
                  <span class="inspector-stat-value">{{ selectedItem.rawEquipment.tier || 1 }}</span>
                </div>
                <div class="inspector-stat-row">
                  <span class="inspector-stat-label">{{ t('shared_uxelm_level') }}</span>
                  <span class="inspector-stat-value">+{{ selectedItem.rawEquipment.level || 0 }}</span>
                </div>
                <div class="inspector-stat-row">
                  <span class="inspector-stat-label">{{ t('inventory_uxelm_properties') }}</span>
                  <span class="inspector-stat-value" style="color: var(--color-success);">{{ equipmentStats }}</span>
                </div>
              </div>

              <!-- Grain Recipes -->
              <div v-if="selectedItem.id === 'food_raw_grain'" class="item-inspector-stats">
                <h4>{{ t('inventory_uxelm_recipes') }}</h4>
                <div
                  v-for="recipe in recipesList"
                  :key="recipe.id"
                  class="recipe-row"
                >
                  <div class="recipe-info">
                    <div class="recipe-name">{{ recipe.icon }} {{ t(recipe.name) }}</div>
                    <div class="recipe-ingredients">
                      <span
                        v-for="(ing, idx) in recipe.ingredientList"
                        :key="ing.id"
                        :style="{ color: ing.have >= ing.need ? 'var(--color-success)' : 'var(--color-danger)' }"
                      >
                        {{ ing.need }} {{ t(ing.id) }}<template v-if="idx < recipe.ingredientList.length - 1">, </template>
                      </span>
                    </div>
                    <div class="recipe-buff">{{ recipe.buffDesc }} · {{ recipe.battles }} {{ t('inventory_uxelm_battles') }}</div>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    :disabled="!recipe.canCook"
                    @click="cookMeal(recipe.id)"
                  >
                    {{ t('inventory_uxelm_cook') }}
                  </Button>
                </div>
              </div>

              <!-- Meal Effects -->
              <div v-else-if="selectedItem.id && selectedItem.id.startsWith('meal_')" class="item-inspector-stats">
                <h4>{{ t('inventory_uxelm_effect') }}</h4>
                <div class="meal-effect">{{ mealEffectDesc }}</div>
                <Button variant="primary" @click="consumeMeal">
                  {{ t('inventory_uxelm_feed_heroes') }}
                </Button>
              </div>

              <!-- Glyph Tablet -->
              <div v-else-if="selectedItem.id && selectedItem.id.startsWith('tablet_glyph_')" class="item-inspector-stats">
                <h4>{{ t('inventory_uxelm_effect') }}</h4>
                <div class="meal-effect">{{ glyphDesc }}</div>
                <Button variant="primary" @click="showTeachModal = true">
                  {{ t('inventory_uxelm_use_tablet') }}
                </Button>
              </div>

              <!-- Generic actions -->
              <div v-else class="detail-actions">
                <Button
                  v-if="selectedItem.type === 'meal'"
                  variant="primary"
                  @click="consumeMeal"
                >
                  {{ t('inventory_uxelm_consume') }}
                </Button>
                <Button
                  v-if="selectedItem.type === 'recipe'"
                  variant="primary"
                  @click="cookMeal(selectedItem.id)"
                >
                  {{ t('inventory_uxelm_cook') }}
                </Button>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Teach Glyph Modal -->
    <ModalFrame
      v-if="showTeachModal && selectedItem?.id?.startsWith('tablet_glyph_')"
      :title="t('inventory_uxelm_teach_glyph')"
      @close="showTeachModal = false"
    >
      <div class="teach-modal">
        <p>{{ t('inventory_uxelm_select_hero') }}</p>
        <div class="hero-list">
          <Button
            v-for="hero in heroes"
            :key="hero.id"
            :variant="heroKnowsGlyph(hero) ? 'secondary' : 'primary'"
            size="sm"
            :disabled="heroKnowsGlyph(hero)"
            @click="teachGlyph(hero.id)"
          >
            {{ hero.name }} (Lv.{{ hero.level }})
            <template v-if="heroKnowsGlyph(hero)"> — {{ t('heroes_uxelm_inscription_selected') }}</template>
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
import ModalFrame from '@/components/ModalFrame.vue'
import { getEquipmentName, getFormattedStats } from '@/core/helpers/EquipmentHelper.js'
import { MEAL_RECIPES, GLYPH_TABLET_DATA } from '@/core/data/index.js'

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

const CATEGORY_KEY_MAP = {
  materials: 'inventory_uxelm_category_materials',
  food: 'inventory_uxelm_category_food',
  consumables: 'inventory_uxelm_category_consumables',
  equipment: 'inventory_uxelm_category_equipment'
}

const BUFF_STAT_KEY_MAP = {
  strength: 'heroes_info_stat_strength',
  defense: 'heroes_info_stat_defense',
  maxHp: 'heroes_info_stat_hp',
  maxMp: 'heroes_info_stat_mp',
  magicPower: 'heroes_info_stat_magic_power',
  speed: 'heroes_info_stat_speed',
  evasion: 'heroes_info_stat_evasion',
  mpCostReduction: 'heroes_info_stat_mpCostReduction'
}

const filters = computed(() => [
  { id: 'all', label: t('inventory_uxelm_filter_all') },
  { id: 'materials', label: t('inventory_uxelm_filter_materials') },
  { id: 'food', label: t('inventory_uxelm_filter_food') },
  { id: 'consumables', label: t('inventory_uxelm_filter_consumables') },
  { id: 'equipment', label: t('inventory_uxelm_filter_equipment') }
])

function entriesToItems(obj, type, iconFn) {
  if (!obj) return []
  if (Array.isArray(obj)) return obj.map((item) => ({ ...item, type }))
  return Object.entries(obj)
    .filter(([, count]) => (typeof count === 'number' ? count > 0 : true))
    .map(([id, count]) => ({
      id,
      name: type === 'consumables' ? t('item_' + id) : t(id),
      qty: typeof count === 'number' ? count : 1,
      icon: iconFn ? iconFn(id) : undefined,
      type
    }))
}

const allItems = computed(() => {
  const items = []
  if (activeFilter.value === 'all' || activeFilter.value === 'materials') {
    items.push(...entriesToItems(inventory.value.materials, 'materials', (id) =>
      id === 'material_wood' ? '🪵' : (id === 'material_stone' ? '🪨' : '⛓️')
    ))
  }
  if (activeFilter.value === 'all' || activeFilter.value === 'food') {
    items.push(...entriesToItems(inventory.value.food, 'food', (id) => {
      const recipes = { food_grain: '🌾' }
      return recipes[id] || '🌾'
    }))
    items.push(...entriesToItems(inventory.value.meals, 'meal', (id) => {
      const recipe = MEAL_RECIPES[id]
      return recipe ? recipe.icon : '🍽️'
    }))
  }
  if (activeFilter.value === 'all' || activeFilter.value === 'consumables') {
    items.push(...entriesToItems(inventory.value.consumables, 'consumables', (id) =>
      id.startsWith('tablet_glyph_') ? '🪧' : (id === 'teleport_scroll' ? '📜' : '🧪')
    ))
  }
  if (activeFilter.value === 'all' || activeFilter.value === 'equipment') {
    items.push(...(inventory.value.equipment || []).map((item, index) => {
      const eqId = item.id || `eq_${item.type}_${item.material}_${index}`
      const name = getEquipmentName(item, t)
      const icon = item.type === 'weapon'
        ? (item.family === 'wand' ? '🪄' : '🗡️')
        : (item.slot === 'head' ? '🪖' : (item.slot === 'body' ? '👕' : (item.slot === 'rightHand' ? '🛡️' : '🥾')))
      return {
        id: eqId,
        type: 'equipment',
        name: `${name}`,        qty: 1,
        icon,
        rawEquipment: item
      }
    }))
  }
  if (activeFilter.value === 'all') {
    items.push(...(inventory.value.recipes || []).map((r) => ({ ...r, type: 'recipe' })))
    items.push(...(inventory.value.glyphTablets || []).map((g) => ({ ...g, type: 'glyph_tablet' })))
  }
  return items
})

const filteredItems = computed(() => allItems.value)

const selectedItem = computed(() =>
  filteredItems.value.find((i) => i.id === selectedId.value) || null
)

// ─── Detail Pane Computed ───────────────────────────────────────────

const detailCategory = computed(() => {
  if (!selectedItem.value) return ''
  const item = selectedItem.value
  if (item.type === 'equipment' && item.rawEquipment) {
    return t('inventory_uxelm_category_equipment')
  }
  return t(CATEGORY_KEY_MAP[item.type] || item.type)
})

const detailDescription = computed(() => {
  if (!selectedItem.value) return ''
  const item = selectedItem.value
  if (item.type === 'materials') return t('desc_' + item.id)
  if (item.type === 'food') return t('desc_' + item.id)
  if (item.type === 'consumables') return t('item_' + item.id + '_desc')
  if (item.type === 'equipment' && item.rawEquipment) {
    const eq = item.rawEquipment
    const descKey = 'desc_' + eq.type + '_' + eq.material
    const descVal = t(descKey)
    return descVal !== descKey ? descVal : `${t('inventory_info_tier_' + eq.material)} ${t('inventory_info_type_' + eq.type)}.`
  }
  return ''
})

const equipmentStats = computed(() => {
  if (!selectedItem.value || !selectedItem.value.rawEquipment) return ''
  return getFormattedStats(selectedItem.value.rawEquipment, t)
})

const recipesList = computed(() => {
  if (!selectedItem.value || selectedItem.value.id !== 'food_raw_grain') return []
  const inv = inventory.value
  return Object.values(MEAL_RECIPES).map(recipe => {
    const ingredientList = Object.entries(recipe.ingredients).map(([ingId, qty]) => ({
      id: ingId,
      need: qty,
      have: inv.materials?.[ingId] || inv.food?.[ingId] || inv.consumables?.[ingId] || 0
    }))
    const canCook = ingredientList.every(ing => ing.have >= ing.need)
    const buffDesc = Object.entries(recipe.buff).map(([stat, val]) => {
      if (stat === 'maxHp') return `+${Math.round(val * 100)}% HP`
      return `+${val} ${t(BUFF_STAT_KEY_MAP[stat] || stat)}`
    }).join(', ')
    return { ...recipe, ingredientList, canCook, buffDesc }
  })
})

const mealEffectDesc = computed(() => {
  if (!selectedItem.value) return ''
  const recipe = MEAL_RECIPES[selectedItem.value.id]
  if (!recipe) return ''
  const buffDesc = Object.entries(recipe.buff).map(([stat, val]) => {
    if (stat === 'maxHp') return `+${Math.round(val * 100)}% HP`
    return `+${val} ${t(BUFF_STAT_KEY_MAP[stat] || stat)}`
  }).join(', ')
  return `${buffDesc} · ${recipe.battles} ${t('inventory_uxelm_battles')}`
})

const glyphDesc = computed(() => {
  if (!selectedItem.value || !selectedItem.value.id.startsWith('tablet_glyph_')) return ''
  return t('item_' + selectedItem.value.id + '_desc')
})

function heroKnowsGlyph(hero) {
  if (!selectedItem.value || !selectedItem.value.id.startsWith('tablet_glyph_')) return false
  const tabletInfo = GLYPH_TABLET_DATA[selectedItem.value.id]
  if (!tabletInfo) return false
  return hero.knownGlyphs && hero.knownGlyphs.includes(tabletInfo.glyphId)
}

// ─── Actions ────────────────────────────────────────────────────────

function consumeMeal() {
  if (!selectedItem.value) return
  dispatch('inventory', 'consumeMeal', { mealId: selectedItem.value.id })
}

function cookMeal(recipeId) {
  dispatch('inventory', 'cookMeal', { recipeId })
}

function teachGlyph(heroId) {
  if (!selectedItem.value) return
  dispatch('inventory', 'useGlyphTablet', { heroId, tabletId: selectedItem.value.id })
  showTeachModal.value = false
}
</script>

<style scoped>
.inventory-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: var(--spacing-lg);
  overflow: hidden;
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
  flex-shrink: 0;
}

.storage-label {
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-primary);
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
  background: linear-gradient(90deg, var(--color-primary), var(--color-primary-light));
  border-radius: 4px;
  transition: all 0.3s ease;
}

.storage-fill.warning { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
.storage-fill.danger { background: linear-gradient(90deg, #ef4444, #f87171); }

.storage-text {
  font-size: 0.8rem;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.filter-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-md);
  flex-shrink: 0;
}

.filter-btn {
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  color: var(--text-secondary);
  cursor: pointer;
  font-family: var(--font-body);
  font-size: 0.85rem;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.filter-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.filter-btn.active {
  background: var(--accent-color);
  border-color: var(--accent-color);
  color: white;
  font-weight: 700;
}

/* ═══ Layout: Master-Detail ════════════════════════════════════════ */
.inventory-layout {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: var(--spacing-lg);
  flex: 1;
  min-height: 0;
}

/* ═══ Item Grid (Master) ═══════════════════════════════════════════ */
.item-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
  padding: 5px;
  overflow-y: auto;
  align-content: start;
}

.grid-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 10px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 90px;
}

.grid-item:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.2);
}

.grid-item.selected {
  background: rgba(245, 158, 11, 0.15);
  border-color: var(--accent-color);
  box-shadow: 0 0 10px rgba(245, 158, 11, 0.2);
}

.item-icon {
  font-size: 2rem;
  margin-bottom: var(--spacing-xs);
}

.item-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: var(--accent-color);
  color: white;
  font-size: 0.65rem;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 800;
}

.item-name {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-primary);
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  width: 100%;
}

.grid-empty {
  grid-column: 1 / -1;
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--text-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
}

.grid-empty .empty-icon {
  font-size: 3rem;
  opacity: 0.3;
}

.grid-empty p {
  margin: 0;
  font-style: italic;
}

/* ═══ Detail Pane ══════════════════════════════════════════════════ */
.detail-pane {
  display: flex;
  flex-direction: column;
  background: rgba(20, 31, 22, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-lg);
  overflow-y: auto;
  min-height: 0;
}

.empty-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: var(--text-muted);
  gap: var(--spacing-md);
}

.detail-icon-bg {
  font-size: 4rem;
  opacity: 0.1;
}

/* ═══ Item Inspector ═══════════════════════════════════════════════ */
.item-inspector {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: var(--spacing-lg);
}

.item-inspector-header {
  display: flex;
  gap: 20px;
  align-items: center;
  border-bottom: 1px solid var(--glass-border);
  padding-bottom: 15px;
}

.item-inspector-visual {
  background: linear-gradient(135deg, rgba(20, 31, 22, 0.5) 0%, rgba(13, 19, 14, 0.7) 100%);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  width: 90px;
  height: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.4);
  flex-shrink: 0;
}

.item-inspector-icon {
  font-size: 3.5rem;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3));
}

.item-inspector-title-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-inspector-title-group h2 {
  font-family: 'Outfit', sans-serif;
  font-size: 1.6rem;
  color: var(--text-primary);
  margin: 0;
}

.item-inspector-badge {
  background: var(--accent-color);
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  width: fit-content;
}

.item-inspector-qty {
  font-size: 0.9rem;
  color: var(--text-muted);
}

.item-inspector-body {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.item-inspector-description {
  color: var(--text-secondary);
  font-size: 0.95rem;
  line-height: 1.5;
  margin: 0;
}

/* ═══ Stats Box ════════════════════════════════════════════════════ */
.item-inspector-stats {
  background: rgba(0, 0, 0, 0.2);
  padding: 15px;
  border-radius: var(--radius-md);
  border: 1px solid var(--glass-border);
}

.item-inspector-stats h4 {
  margin: 0 0 10px 0;
  color: var(--text-secondary);
  text-transform: uppercase;
  font-size: 0.8rem;
  letter-spacing: 0.5px;
}

.inspector-stat-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.05);
  font-size: 0.9rem;
}

.inspector-stat-row:last-child {
  border-bottom: none;
}

.inspector-stat-label {
  color: var(--text-secondary);
}

.inspector-stat-value {
  font-weight: 700;
  color: var(--text-primary);
}

/* ═══ Recipe Row ═══════════════════════════════════════════════════ */
.recipe-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.05);
  gap: var(--spacing-sm);
}

.recipe-row:last-child {
  border-bottom: none;
}

.recipe-info {
  flex: 1;
  min-width: 0;
}

.recipe-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-primary);
}

.recipe-ingredients {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.recipe-buff {
  font-size: 0.75rem;
  color: var(--accent-color);
}

.meal-effect {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 10px;
}

/* ═══ Actions ══════════════════════════════════════════════════════ */
.detail-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

/* ═══ Teach Modal ══════════════════════════════════════════════════ */
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

/* ═══ Responsive ═══════════════════════════════════════════════════ */
@media (max-width: 768px) {
  .inventory-layout {
    grid-template-columns: 1fr;
  }
}
</style>
