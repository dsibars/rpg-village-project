import { BaseView } from '../BaseView.js';
import { getWeaponBaseCost, getArmorBaseCost, CONSUMABLES_CATALOG, WEAPONS_CATALOG, ARMOR_CATALOG } from '../../../engine/shared/data/ShopCatalog.js';
import { initShopTabs } from './components/ShopTabs.js';
import { createShopCatalogList } from './components/ShopCatalogList.js';
import { createShopDetailPane } from './components/ShopDetailPane.js';
import { el } from '../shared/utils/DOMUtils.js';
import { getItemKey, getOwnedBreakdown } from './utils/ShopUtils.js';

export class ShopView extends BaseView {
    constructor() {
        super('shop');
        this.currentTab = 'buy';
        this.selectedItemKey = null;
        this.selectedSellItemKey = null;
        this.selectedResourceId = null;
        this.justBoughtKey = null;
        this.justBoughtTime = 0;
        this.justBoughtTimeout = null;
        this.justSoldKey = null;
        this.justSoldTime = 0;
        this.justSoldTimeout = null;

        // Catalog references (single source of truth in ShopCatalog.js)
        this.consumables = CONSUMABLES_CATALOG;
        this.weapons = WEAPONS_CATALOG;
        this.armor = ARMOR_CATALOG;
    }

    onMount() {
        this.elements = {
            lockOverlay: this.$('#shop-lock-overlay'),
            catalog: this.$('#shop-catalog-container'),
            detailContent: this.$('#shop-detail-content')
        };

        this.root.addEventListener('click', (e) => {
            const subviewBtn = e.target.closest('[data-subview]');
            if (subviewBtn) {
                this.ui.switchView(subviewBtn.dataset.subview);
                return;
            }
        });

        // Initialize warning banner and empty catalog warning elements
        this.warningEl = el('div', {
            class: 'alert alert-warning',
            style: {
                display: 'none',
                marginBottom: '15px',
                padding: '10px',
                borderRadius: 'var(--radius-md)',
                fontWeight: '600'
            }
        });

        this.emptyCatalogEl = el('div', {
            class: 'empty-detail',
            style: {
                display: 'none',
                padding: 'var(--spacing-lg)'
            }
        }, [
            el('p', { style: { color: 'var(--text-muted)' } }, [this.t('ui_no_items_to_sell') || 'No items to sell.'])
        ]);

        // Initialize ShopTabs Component
        const tabsContainer = this.$('.shop-tabs');
        this.shopTabs = initShopTabs(tabsContainer, this.currentTab, (mode) => {
            if (mode !== this.currentTab) {
                this.currentTab = mode;
                this.shopTabs.update(mode);
                this.ui.forceUpdate();
            }
        });

        // Initialize Catalog list
        this.catalogList = createShopCatalogList({
            onSelect: (key) => {
                if (this.currentTab === 'buy') {
                    this.selectedItemKey = key;
                } else if (this.currentTab === 'sell') {
                    this.selectedSellItemKey = key;
                } else {
                    this.selectedResourceId = key;
                }
                this.ui.forceUpdate();
            },
            t: this.t.bind(this)
        });

        if (this.elements.catalog) {
            this.elements.catalog.innerHTML = '';
            this.elements.catalog.appendChild(this.warningEl);
            this.elements.catalog.appendChild(this.emptyCatalogEl);
            this.elements.catalog.appendChild(this.catalogList.root);
        }

        // Initialize Detail Pane Component
        this.detailPane = createShopDetailPane({
            onBuy: (item) => {
                const itemKey = item.id || `${item.type}_${item.material}_${item.family || item.archetype}_${item.slot || ''}`;
                this.justBoughtKey = itemKey;
                this.justBoughtTime = Date.now();

                if (this.justBoughtTimeout) clearTimeout(this.justBoughtTimeout);
                this.justBoughtTimeout = setTimeout(() => {
                    this.justBoughtKey = null;
                    this.ui.forceUpdate();
                }, 600);

                this.emit('buyItem', { itemData: item, costGold: item.cost });
            },
            onSell: (item) => {
                this.justSoldKey = item.id;
                this.justSoldTime = Date.now();

                if (this.justSoldTimeout) clearTimeout(this.justSoldTimeout);
                this.justSoldTimeout = setTimeout(() => {
                    this.justSoldKey = null;
                    this.ui.forceUpdate();
                }, 600);

                this.emit('sellItem', { itemId: item.id, itemType: item.type, sellPrice: item.sellPrice });
            },
            onSellResource: (resourceId, qty, price) => {
                this.emit('sellResource', { resourceId, quantity: qty, pricePerUnit: price });
            },
            t: this.t.bind(this)
        });

        if (this.elements.detailContent) {
            this.elements.detailContent.innerHTML = '';
            this.elements.detailContent.appendChild(this.detailPane.root);
        }
    }

    update(state) {
        if (!state) return;
        
        const completed = state.completedExpeditions || [];
        const isUnlocked = completed.includes('exp_tutorial_cave');
        const blacksmithLevel = state.village?.infrastructure?.blacksmith || 0;
        const playerGold = state.village?.gold || 0;
        
        const invStr = state.inventory ? JSON.stringify({
            equipmentCount: state.inventory.equipment?.length || 0,
            gold: playerGold,
            blacksmithLevel,
            isUnlocked
        }) : '';

        const stateString = JSON.stringify({
            completed: completed.length,
            invStr,
            heroesCount: state.heroes?.length || 0,
            selectedItemKey: this.selectedItemKey,
            selectedSellItemKey: this.selectedSellItemKey,
            selectedResourceId: this.selectedResourceId,
            justBoughtKey: this.justBoughtKey,
            justSoldKey: this.justSoldKey,
            currentTab: this.currentTab
        });

        if (this.lastRenderedState === stateString) {
            return;
        }

        this.onUpdate(state);
        this.lastRenderedState = stateString;
    }

    onUpdate(state) {
        const completed = state.completedExpeditions || [];
        const isUnlocked = completed.includes('exp_tutorial_cave');

        if (!isUnlocked) {
            if (this.elements.lockOverlay) this.elements.lockOverlay.style.display = 'flex';
            return;
        }

        if (this.elements.lockOverlay) this.elements.lockOverlay.style.display = 'none';

        if (this.currentTab === 'buy') {
            this._renderBuyTab(state);
        } else if (this.currentTab === 'sell') {
            this._renderSellTab(state);
        } else {
            this._renderResourcesTab(state);
        }
    }

    _renderBuyTab(state) {
        const blacksmithLevel = state.village?.infrastructure?.blacksmith || 0;
        const maxTier = blacksmithLevel >= 7 ? 5 :
                        blacksmithLevel >= 5 ? 4 :
                        blacksmithLevel >= 3 ? 3 :
                        blacksmithLevel >= 1 ? 2 : 1;
        const playerGold = state.village?.gold || 0;
        const t = this.t.bind(this);
        const used = state.inventory?.totalUsed || 0;
        const maxStorage = state.village?.maxStorage || 100;
        const storageFull = used >= maxStorage;

        // Group items:
        const groups = [
            {
                id: 'consumables',
                items: this.consumables
            },
            {
                id: 'weapons',
                items: this.weapons.filter(w => w.tier <= maxTier)
            },
            {
                id: 'helmets',
                items: this.armor.filter(a => a.slot === 'head' && a.tier <= maxTier)
            },
            {
                id: 'armors',
                items: this.armor.filter(a => a.slot === 'body' && a.tier <= maxTier)
            },
            {
                id: 'legwear',
                items: this.armor.filter(a => a.slot === 'legs' && a.tier <= maxTier)
            },
            {
                id: 'shields',
                items: this.armor.filter(a => a.slot === 'rightHand' && a.tier <= maxTier)
            }
        ];

        // Find all available items to buy
        const allItems = [];
        groups.forEach(g => {
            g.items.forEach(item => {
                allItems.push(item);
            });
        });

        if (!this.selectedItemKey && allItems.length > 0) {
            this.selectedItemKey = getItemKey(allItems[0]);
        }

        const getOwnedCount = (item) => getOwnedBreakdown(item, state).total;

        // Hide Sell empty state
        this.emptyCatalogEl.style.display = 'none';
        this.catalogList.root.style.display = 'block';

        // Render storage warning banner surgically
        if (storageFull || (used / maxStorage >= 0.9)) {
            this.warningEl.style.display = 'block';
            if (storageFull) {
                this.warningEl.style.background = 'rgba(239, 68, 68, 0.1)';
                this.warningEl.style.border = '1px solid var(--danger)';
                this.warningEl.style.color = 'var(--danger)';
                this.warningEl.textContent = `⚠️ ${(t('error_storage_full') || 'Storage is full!')} (${used} / ${maxStorage})`;
            } else {
                this.warningEl.style.background = 'rgba(245, 158, 11, 0.1)';
                this.warningEl.style.border = '1px solid var(--warning)';
                this.warningEl.style.color = 'var(--warning)';
                this.warningEl.textContent = `⚠️ ${(t('inv_full') || 'Storage nearly full!')} (${used} / ${maxStorage})`;
            }
        } else {
            this.warningEl.style.display = 'none';
        }

        // Update catalog component
        this.catalogList.update({
            groups,
            selectedKey: this.selectedItemKey,
            playerGold,
            getOwnedCount,
            isFlat: false
        });

        // Find selected item object
        const selectedItem = allItems.find(item => getItemKey(item) === this.selectedItemKey);
        
        // Update detail pane
        const isJustBought = this.justBoughtKey === this.selectedItemKey && (Date.now() - this.justBoughtTime) < 600;
        this.detailPane.update({
            item: selectedItem,
            tab: 'buy',
            state,
            isJustAction: isJustBought
        });
    }

    _renderSellTab(state) {
        const t = this.t.bind(this);
        const inventory = state.inventory || {};
        const consumables = inventory.consumables || {};
        const equipment = inventory.equipment || [];

        // Build sell groups from inventory
        const groups = [];

        // Consumables
        const consumableItems = Object.entries(consumables)
            .filter(([_, count]) => count > 0)
            .map(([id, count]) => {
                const shopItem = this.consumables.find(c => c.id === id);
                const basePrice = shopItem ? shopItem.cost : 0;
                return {
                    id,
                    type: 'consumable',
                    count,
                    i18n_name: shopItem ? shopItem.i18n_name : id,
                    i18n_desc: shopItem ? shopItem.i18n_desc : id,
                    sellPrice: Math.floor(basePrice * 0.3)
                };
            });

        if (consumableItems.length > 0) {
            groups.push({
                id: 'consumables',
                items: consumableItems
            });
        }

        // Equipment helper
        const eqGroups = [
            { id: 'weapons', filter: eq => eq.type === 'weapon' },
            { id: 'helmets', filter: eq => eq.type === 'armor' && eq.slot === 'head' },
            { id: 'armors', filter: eq => eq.type === 'armor' && eq.slot === 'body' },
            { id: 'legwear', filter: eq => eq.type === 'armor' && eq.slot === 'legs' },
            { id: 'shields', filter: eq => eq.type === 'armor' && eq.slot === 'rightHand' }
        ];

        eqGroups.forEach(g => {
            const items = equipment.filter(g.filter).map(eq => ({
                ...eq,
                type: 'equipment',
                sellPrice: this._calculateEquipmentSellPrice(eq)
            }));
            if (items.length > 0) {
                groups.push({ id: g.id, items });
            }
        });

        // Hide warning banner
        this.warningEl.style.display = 'none';

        // Render catalog empty / active state
        if (groups.length === 0) {
            this.emptyCatalogEl.style.display = 'block';
            this.catalogList.root.style.display = 'none';
        } else {
            this.emptyCatalogEl.style.display = 'none';
            this.catalogList.root.style.display = 'block';
        }

        const allItems = [];
        groups.forEach(g => {
            g.items.forEach(item => {
                allItems.push(item);
            });
        });

        if (!this.selectedSellItemKey && allItems.length > 0) {
            this.selectedSellItemKey = allItems[0].id;
        }

        const getOwnedCount = (item) => item.count || 1;

        // Update catalog component
        this.catalogList.update({
            groups,
            selectedKey: this.selectedSellItemKey,
            playerGold: state.village?.gold || 0,
            getOwnedCount,
            isFlat: false
        });

        // Find selected item
        let selectedItem = null;
        for (const g of groups) {
            selectedItem = g.items.find(i => i.id === this.selectedSellItemKey);
            if (selectedItem) break;
        }

        const isJustSold = this.justSoldKey === this.selectedSellItemKey && (Date.now() - this.justSoldTime) < 600;

        // Update detail pane
        this.detailPane.update({
            item: selectedItem,
            tab: 'sell',
            state,
            isJustAction: isJustSold
        });
    }

    _renderResourcesTab(state) {
        const inventory = state.inventory || {};
        const materials = inventory.materials || {};
        const food = inventory.food || {};

        const resources = [
            { id: 'food_raw_grain', price: 1, icon: '🌾' },
            { id: 'material_wood', price: 2, icon: '🪵' },
            { id: 'material_stone', price: 3, icon: '🪨' }
        ];

        const groups = [
            {
                id: 'resources',
                items: resources
            }
        ];

        if (!this.selectedResourceId) {
            this.selectedResourceId = resources[0].id;
        }

        // Hide other messages
        this.warningEl.style.display = 'none';
        this.emptyCatalogEl.style.display = 'none';
        this.catalogList.root.style.display = 'block';

        const getOwnedCount = (item) => {
            return item.id.startsWith('food_') ? (food[item.id] || 0) : (materials[item.id] || 0);
        };

        // Update catalog (as a flat list)
        this.catalogList.update({
            groups,
            selectedKey: this.selectedResourceId,
            playerGold: state.village?.gold || 0,
            getOwnedCount,
            isFlat: true
        });

        // Find selected resource
        const selectedRes = resources.find(r => r.id === this.selectedResourceId);
        
        // Update detail pane
        this.detailPane.update({
            item: selectedRes,
            tab: 'resources',
            state,
            isJustAction: false
        });
    }

    _calculateEquipmentSellPrice(eq) {
        let baseCost = 0;
        if (eq.type === 'weapon') {
            baseCost = getWeaponBaseCost(eq.material, eq.family);
        } else if (eq.type === 'armor') {
            baseCost = getArmorBaseCost(eq.material, eq.archetype, eq.slot);
        }
        const level = eq.level || 0;
        return Math.floor(baseCost * 0.3 * Math.pow(1.1, level));
    }


}
