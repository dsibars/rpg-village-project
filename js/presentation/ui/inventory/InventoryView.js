import { BaseView } from '../BaseView.js';
import { getEquipmentName } from '../shared/EquipmentHelper.js';
import { MEAL_RECIPES, GLYPH_TABLET_DATA } from '../../../engine/shared/data/InventoryData.js';
import { createInventoryGrid } from './components/InventoryGrid.js';
import { createInventoryDetailPane } from './components/InventoryDetailPane.js';
import { BaseModal } from '../components/modal/BaseModal.js';
import { el } from '../shared/utils/DOMUtils.js';


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
            onTeachGlyph: (tabletId) => {
                this._openTeachHeroModal(tabletId);
            },
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
                        name: this.t('item_' + id),
                        qty: count,
                        icon: id.startsWith('tablet_glyph_') ? '🪧' : (id === 'teleport_scroll' ? '📜' : '🧪')
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

    _openTeachHeroModal(tabletId) {
        if (!this.lastState || !this.lastState.heroes) return;

        const tabletInfo = GLYPH_TABLET_DATA[tabletId];
        if (!tabletInfo) return;
        const glyphId = tabletInfo.glyphId;

        const list = el('div', { style: { maxHeight: '300px', overflowY: 'auto' } });

        const renderList = () => {
            list.innerHTML = '';
            this.lastState.heroes.forEach(hero => {
                const knows = hero.knownGlyphs && hero.knownGlyphs.includes(glyphId);
                const btn = knows
                    ? el('span', { style: { color: 'var(--text-muted)', fontSize: '0.85rem' } }, [this.t('heroes_uxelm_inscription_selected') || 'Learned'])
                    : el('button', {
                        class: 'btn btn-primary btn-sm',
                        onClick: () => {
                            this.emit('useGlyphTablet', { heroId: hero.id, tabletId });
                            modal.close();
                        }
                    }, [this.t('heroes_uxelm_inscription_learn') || 'Teach']);

                const row = el('div', {
                    style: {
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 0',
                        borderBottom: '1px solid rgba(255,255,255,0.05)'
                    }
                }, [
                    el('div', {}, [
                        el('div', { style: { fontWeight: '600' } }, [hero.name]),
                        el('div', { style: { fontSize: '0.75rem', color: 'var(--text-muted)' } }, [this.t('heroes_info_origin_' + hero.origin.replace('origin_', '')) || hero.origin])
                    ]),
                    btn
                ]);
                list.appendChild(row);
            });
        };

        renderList();

        const modal = BaseModal.show({
            title: this.t('inventory_uxelm_teach_glyph_title') || 'Teach Glyph',
            contentElement: list,
            icon: '📖',
            maxWidth: '400px'
        });
    }
}
