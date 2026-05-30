import { BaseView } from '../BaseView.js';
import { getEquipmentName } from '../shared/EquipmentHelper.js';
import { MEAL_RECIPES } from '../../../engine/shared/data/InventoryData.js';
import { createInventoryGrid } from './components/InventoryGrid.js';
import { createInventoryDetailPane } from './components/InventoryDetailPane.js';

export class InventoryView extends BaseView {
    constructor() {
        super('inventory');
        this.activeFilter = 'all';
        this.selectedItemId = null;
        this.cachedItems = [];
        this.lastState = null;
    }

    onMount() {
        this.elements = {
            storageText: this.$('#inv-storage-text'),
            storageBar: this.$('#inv-storage-bar'),
            itemsContainer: this.$('#inventory-items-container'),
            detail: this.$('#inventory-detail-content')
        };

        this.root.addEventListener('click', (e) => {
            const subviewBtn = e.target.closest('[data-subview]');
            if (subviewBtn) {
                this.ui.switchView(subviewBtn.dataset.subview);
                return;
            }
        });

        // Bind filter tabs click events
        const filtersContainer = this.$('.inventory-filters');
        if (filtersContainer) {
            filtersContainer.addEventListener('click', (e) => {
                const btn = e.target.closest('.filter-btn');
                if (btn) {
                    filtersContainer.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.activeFilter = btn.getAttribute('data-filter') || 'all';
                    this.selectedItemId = null; // Reset selection on filter switch
                    if (this.lastState) {
                        this.onUpdate(this.lastState);
                    }
                }
            });
        }

        // Initialize Grid Component
        this.inventoryGrid = createInventoryGrid({
            onSelect: (itemId) => {
                this.selectedItemId = itemId;
                if (this.lastState) {
                    this.onUpdate(this.lastState);
                }
            },
            t: this.t.bind(this)
        });

        if (this.elements.itemsContainer) {
            this.elements.itemsContainer.innerHTML = '';
            this.elements.itemsContainer.appendChild(this.inventoryGrid.root);
        }

        // Initialize Detail Pane Component
        this.inventoryDetail = createInventoryDetailPane({
            onCook: (recipeId) => {
                this.emit('cookMeal', { recipeId });
            },
            onConsume: (mealId) => {
                this.emit('consumeMeal', { mealId });
            },
            onEquip: () => {},
            onUnequip: () => {},
            onDrop: () => {},
            t: this.t.bind(this)
        });

        if (this.elements.detail) {
            this.elements.detail.innerHTML = '';
            this.elements.detail.appendChild(this.inventoryDetail.root);
        }
    }

    update(state) {
        if (!state.inventory) return;

        // Custom diff checks including UI filter and selection states
        const stateString = JSON.stringify({
            inventory: state.inventory,
            activeFilter: this.activeFilter,
            selectedItemId: this.selectedItemId
        });

        if (this.lastRenderedState === stateString) {
            return;
        }

        this.lastState = state;
        this.onUpdate(state);
        this.lastRenderedState = stateString;
    }

    onUpdate(state) {
        const { inventory, village } = state;
        if (!inventory || !village) return;

        // Storage Summary
        const used = inventory.totalUsed || 0;
        const max = village.maxStorage || 100;
        if (this.elements.storageText) this.elements.storageText.textContent = `${used} / ${max}`;
        if (this.elements.storageBar) {
            const percent = Math.min(100, (used / max) * 100);
            this.elements.storageBar.style.width = `${percent}%`;
            this.elements.storageBar.classList.toggle('warning', percent > 70);
            this.elements.storageBar.classList.toggle('danger', percent > 90);
        }

        // Compile all items
        const items = [];

        // Materials
        if (inventory.materials) {
            Object.entries(inventory.materials).forEach(([id, count]) => {
                if (count > 0) {
                    items.push({
                        id,
                        type: 'materials',
                        name: this.t(id),
                        qty: count,
                        icon: id === 'material_wood' ? '🪵' : (id === 'material_stone' ? '🪨' : '⛓️')
                    });
                }
            });
        }

        // Food
        if (inventory.food) {
            Object.entries(inventory.food).forEach(([id, count]) => {
                if (count > 0) {
                    const mealRecipe = MEAL_RECIPES[id];
                    items.push({
                        id,
                        type: 'food',
                        name: this.t(id),
                        qty: count,
                        icon: mealRecipe ? mealRecipe.icon : '🌾'
                    });
                }
            });
        }

        // Consumables
        if (inventory.consumables) {
            Object.entries(inventory.consumables).forEach(([id, count]) => {
                if (count > 0) {
                    items.push({
                        id,
                        type: 'consumables',
                        name: this.t(id),
                        qty: count,
                        icon: id === 'item_teleport_scroll' ? '📜' : '🧪'
                    });
                }
            });
        }

        // Equipment
        if (inventory.equipment) {
            inventory.equipment.forEach((item, index) => {
                const eqId = `eq_${item.type}_${item.material}_${index}`;
                const name = getEquipmentName(item, this.t.bind(this));
                const icon = item.type === 'weapon' ? '🗡️' : (item.slot === 'head' ? '🪖' : (item.slot === 'body' ? '👕' : (item.slot === 'rightHand' ? '🛡️' : '🥾')));
                items.push({
                    id: eqId,
                    type: 'equipment',
                    name: `${name} +${item.level || 0}`,
                    qty: 1,
                    icon,
                    rawEquipment: item
                });
            });
        }

        this.cachedItems = items;

        // Filter items
        const filtered = items.filter(item => {
            if (this.activeFilter === 'all') return true;
            return item.type === this.activeFilter;
        });

        // Validate selection
        let selectedItem = this.cachedItems.find(i => i.id === this.selectedItemId) || null;
        if (!selectedItem) {
            this.selectedItemId = null;
        }

        // Render List
        if (this.inventoryGrid) {
            this.inventoryGrid.update({ items: filtered, selectedItemId: this.selectedItemId });
        }

        // Render Detail
        if (this.inventoryDetail) {
            this.inventoryDetail.update({ item: selectedItem, state });
        }
    }
}
