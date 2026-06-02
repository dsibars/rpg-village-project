import { el } from '../../shared/utils/DOMUtils.js';
import { getEquipmentName, getEquipmentStats, getFormattedStats } from '../../shared/EquipmentHelper.js';
import { getOwnedBreakdown } from '../utils/ShopUtils.js';

const STAT_LABEL_MAP = {
    strength:        'heroes_info_stat_strength',
    defense:         'heroes_info_stat_defense',
    maxHp:           'heroes_info_stat_hp',
    maxMp:           'heroes_info_stat_mp',
    magicPower:      'heroes_info_stat_magic_power',
    speed:           'heroes_info_stat_speed',
    evasion:         'heroes_info_stat_evasion',
    mpCostReduction: 'heroes_info_stat_mpCostReduction'
};

/**
 * Creates the item detail panel component.
 * @param {Object} props
 * @param {Function} props.onBuy - Buy callback
 * @param {Function} props.onSell - Sell callback
 * @param {Function} props.onSellResource - Sell raw material callback
 * @param {Function} props.t - Translation function
 * @returns {{root: HTMLElement, update: Function}}
 */
export function createShopDetailPane({ onBuy, onSell, onSellResource, t }) {
    // Persistent refs
    const nameRef = el('h2');
    const categoryRef = el('span', { style: { color: 'var(--text-muted)', fontSize: '0.9rem' } });
    const tierRef = el('span', { class: 'shop-tier-badge' });
    const iconRef = el('span', { class: 'shop-preview-icon' });
    const descRef = el('p', { class: 'shop-desc-text' });
    
    // Stats section
    const statsContainerRef = el('div', { class: 'shop-stats-card' });
    
    // Owned breakdown section
    const ownedBreakdownRef = el('div', { class: 'shop-owned-breakdown' });
    const ownedTextRef = el('span');
    const ownedBreakdownSubRef = el('span', { style: { color: 'var(--text-muted)' } });
    ownedBreakdownRef.append(ownedTextRef, ownedBreakdownSubRef);

    // Cost section
    const costSectionRef = el('div', { class: 'shop-cost-section' });
    const costLabelRef = el('h4');
    const costItemRef = el('div', { class: 'shop-cost-item' });
    const costValueRef = el('span', { class: 'value' });
    costItemRef.append(el('span', { class: 'label' }, ['GOLD']), costValueRef);
    costSectionRef.append(costLabelRef, costItemRef);

    // Standard Buy/Sell Action Button
    const actionBtnRef = el('button', { class: 'btn' });
    const actionContainerRef = el('div', { class: 'shop-action-footer' }, [actionBtnRef]);

    // Resource Quantities Action Footer
    const resourceContainerRef = el('div', { class: 'shop-action-footer', style: { flexWrap: 'wrap', gap: '8px' } });

    // Empty state element
    const emptyStateRef = el('div', { class: 'empty-detail' }, [
        el('div', { class: 'detail-icon-bg' }, ['🛒']),
        el('p', {}, [t('shop_uxelm_select_item')])
    ]);

    // Content wrapper holding details when item selected
    const detailContentRef = el('div', { style: { display: 'none' } }, [
        el('div', { class: 'shop-detail-header' }, [
            el('div', { class: 'shop-title-group' }, [nameRef, categoryRef]),
            tierRef
        ]),
        el('div', { class: 'shop-detail-body' }, [
            el('div', { class: 'shop-preview-card' }, [iconRef]),
            descRef,
            statsContainerRef,
            ownedBreakdownRef,
            costSectionRef,
            actionContainerRef,
            resourceContainerRef
        ])
    ]);

    const root = el('div', { style: { height: '100%' } }, [
        emptyStateRef,
        detailContentRef
    ]);

    let activeItem = null;
    let activeTab = null;

    actionBtnRef.addEventListener('click', () => {
        if (!activeItem) return;
        if (activeTab === 'buy') {
            onBuy(activeItem);
        } else if (activeTab === 'sell') {
            onSell(activeItem);
        }
    });

    function update({ item, tab, state, isJustAction }) {
        activeItem = item;
        activeTab = tab;

        if (!item) {
            emptyStateRef.style.display = 'flex';
            detailContentRef.style.display = 'none';
            return;
        }

        emptyStateRef.style.display = 'none';
        detailContentRef.style.display = 'block';

        // 1. Text & Basic Details
        let name = '';
        let desc = '';
        let icon = '🛡️';
        let categoryText = '';

        if (item.type === 'consumable') {
            name = t(item.i18n_name);
            desc = t(item.i18n_desc);
            icon = item.id.includes('potion') ? '🧪' : '📜';
            categoryText = t('inventory_uxelm_category_consumables');
            tierRef.style.display = 'none';
        } else if (tab === 'resources') {
            name = t(item.id);
            desc = t('desc_' + item.id);
            icon = item.icon || '🌾';
            categoryText = t('shop_uxelm_category_resources');
            tierRef.style.display = 'none';
        } else {
            name = getEquipmentName(item, t);
            desc = getFormattedStats(item, t);
            if (item.type === 'weapon') {
                icon = item.family === 'wand' ? '🪄' : '⚔️';
            } else {
                icon = item.slot === 'head' ? '🪖' : (item.slot === 'rightHand' ? '🛡️' : '🧥');
            }
            categoryText = t('inventory_info_slot_' + item.slot);
            if (item.tier) {
                tierRef.textContent = `Tier ${item.tier}`;
                tierRef.style.display = '';
            } else if (item.level !== undefined) {
                tierRef.textContent = `+${item.level}`;
                tierRef.style.display = '';
            } else {
                tierRef.style.display = 'none';
            }
        }

        nameRef.textContent = name;
        categoryRef.textContent = categoryText;
        iconRef.textContent = icon;
        descRef.textContent = desc;

        // 2. Stats Section
        if (item.type !== 'consumable' && tab !== 'resources') {
            const stats = getEquipmentStats(item);
            const statRows = Object.entries(stats).map(([stat, val]) => {
                if (!val) return null;
                const sign = val > 0 ? '+' : '';
                const label = t(STAT_LABEL_MAP[stat]);
                return el('div', { class: 'shop-stat-row' }, [
                    el('span', { class: 'shop-stat-label' }, [label]),
                    el('span', { class: 'shop-stat-value' }, [`${sign}${val}`])
                ]);
            }).filter(Boolean);

            if (statRows.length > 0) {
                statsContainerRef.innerHTML = '';
                statsContainerRef.append(el('h4', {}, [t('shop_uxelm_stats')]), ...statRows);
                statsContainerRef.style.display = 'block';
            } else {
                statsContainerRef.style.display = 'none';
            }
        } else {
            statsContainerRef.style.display = 'none';
        }

        // 3. Owned breakdown & Resource Quantities Footer
        if (tab === 'buy') {
            ownedBreakdownRef.style.display = 'flex';
            costSectionRef.style.display = 'block';
            actionContainerRef.style.display = 'flex';
            resourceContainerRef.style.display = 'none';

            costLabelRef.textContent = t('shop_uxelm_cost');

            // Get owned stats
            const owned = getOwnedBreakdown(item, state);
            ownedTextRef.textContent = `${t('inventory_uxelm_owned')}: ${owned.total}`;
            ownedBreakdownSubRef.textContent = `(${t('inventory_uxelm_inventory')}: ${owned.inventory} | ${t('inventory_uxelm_equipped')}: ${owned.equipped})`;

            const playerGold = state.village?.gold || 0;
            const canAfford = playerGold >= item.cost;
            const used = state.inventory?.totalUsed || 0;
            const maxStorage = state.village?.maxStorage || 100;
            const storageFull = used >= maxStorage;

            costValueRef.textContent = `💰 ${item.cost}`;
            costItemRef.classList.toggle('insufficient', !canAfford);

            // Button update
            actionBtnRef.disabled = isJustAction || !canAfford || storageFull;
            actionBtnRef.className = `btn ${isJustAction ? 'btn-success bought' : (canAfford && !storageFull ? 'btn-primary' : 'btn-secondary')} btn-buy-action`;
            actionBtnRef.textContent = isJustAction 
                ? t('shop_uxelm_purchased')
                : (storageFull ? t('inventory_error_storage_full') : t('shop_uxelm_buy'));

        } else if (tab === 'sell') {
            ownedBreakdownRef.style.display = 'none';
            costSectionRef.style.display = 'block';
            actionContainerRef.style.display = 'flex';
            resourceContainerRef.style.display = 'none';

            costLabelRef.textContent = t('shop_uxelm_sell_price');
            const sellPrice = item.sellPrice || 0;
            costValueRef.textContent = `💰 ${sellPrice}`;
            costItemRef.classList.remove('insufficient');

            // Button update
            actionBtnRef.disabled = isJustAction;
            actionBtnRef.className = `btn ${isJustAction ? 'btn-success bought' : 'btn-primary'} btn-sell-action`;
            actionBtnRef.textContent = isJustAction
                ? t('shop_uxelm_sold')
                : t('shop_uxelm_sell');

        } else {
            // resources tab
            ownedBreakdownRef.style.display = 'flex';
            costSectionRef.style.display = 'none';
            actionContainerRef.style.display = 'none';
            resourceContainerRef.style.display = 'flex';

            const inventory = state.inventory || {};
            const materials = inventory.materials || {};
            const food = inventory.food || {};
            const count = item.id.startsWith('food_') ? (food[item.id] || 0) : (materials[item.id] || 0);

            ownedTextRef.textContent = `${t('inventory_uxelm_owned')}: ${count}`;
            ownedBreakdownSubRef.textContent = '';

            // Render quantity buttons
            const quantities = [1, 10, 100];
            resourceContainerRef.innerHTML = '';
            quantities.forEach(qty => {
                const canSell = count >= qty;
                const total = qty * item.price;
                const btn = el('button', {
                    class: `btn ${canSell ? 'btn-primary' : 'btn-secondary'} btn-sell-resource`,
                    disabled: !canSell,
                    onClick: () => onSellResource(item.id, qty, item.price)
                }, [`${t('shop_uxelm_sell')} ${qty} (${total}g)`]);
                resourceContainerRef.appendChild(btn);
            });
        }
    }

    return {
        root,
        update
    };
}
