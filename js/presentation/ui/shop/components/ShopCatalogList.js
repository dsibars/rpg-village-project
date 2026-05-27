import { el, diffList } from '../../shared/utils/DOMUtils.js';
import { getEquipmentName } from '../../shared/EquipmentHelper.js';
import { getItemKey } from '../utils/ShopUtils.js';

/**
 * Creates a catalog list component with persistent accordion containers and flat list support.
 * @param {Object} props
 * @param {Function} props.onSelect - Callback on item row click
 * @param {Function} props.t - Translation function
 * @returns {{root: HTMLElement, update: Function}}
 */
export function createShopCatalogList({ onSelect, t }) {
    const categoryMap = new Map();
    const root = el('div', { class: 'shop-catalog-list-wrapper' });

    // Initialize the static category accordion containers once
    const categories = [
        { id: 'consumables', title: t('ui_consumables') || 'Consumables', icon: '🧪' },
        { id: 'weapons', title: t('ui_equipment') || 'Weapons', icon: '⚔️' },
        { id: 'helmets', title: t('slot_name_head') || 'Helmets', icon: '🪖' },
        { id: 'armors', title: t('slot_name_body') || 'Armors', icon: '🧥' },
        { id: 'legwear', title: t('slot_name_legs') || 'Legwear', icon: '👖' },
        { id: 'shields', title: t('slot_name_rightHand') || 'Shields', icon: '🛡️' }
    ];

    categories.forEach(group => {
        const listContainer = el('div', { class: 'shop-item-list' });
        const arrowEl = el('span', { class: 'arrow' }, ['▼']);
        const accordion = el('details', {
            class: 'shop-category-details',
            'data-id': group.id
        }, [
            el('summary', {}, [
                el('span', {}, [`${group.icon} ${group.title}`]),
                arrowEl
            ]),
            listContainer
        ]);
        
        root.appendChild(accordion);
        categoryMap.set(group.id, { accordion, listContainer });
    });

    // Flat container for resources tab
    const flatContainer = el('div', { class: 'shop-item-list', style: { display: 'none' } });
    root.appendChild(flatContainer);

    function update({ groups, selectedKey, playerGold, getOwnedCount, isFlat = false }) {
        if (isFlat) {
            // Hide all accordions
            categoryMap.forEach(cat => {
                cat.accordion.style.display = 'none';
            });
            flatContainer.style.display = 'flex';

            // Flat mapping
            const flatItems = groups.flatMap(g => g.items);
            const newRows = flatItems.map(item => {
                const itemKey = item.id;
                const activeClass = selectedKey === itemKey ? 'active' : '';
                const ownedCount = getOwnedCount(item);
                const cost = item.cost || item.sellPrice || item.price || 0;
                const costBadgeClass = 'shop-item-cost-badge';
                const displayName = t(item.id) || item.id;

                return el('div', {
                    class: `shop-item-row ${activeClass}`,
                    'data-id': itemKey,
                    onClick: () => onSelect(itemKey)
                }, [
                    el('span', { class: 'list-item-title' }, [`${item.icon || '🌾'} ${displayName}`]),
                    el('div', { class: 'shop-item-meta' }, [
                        el('span', { class: 'shop-item-owned-badge' }, [`${ownedCount}`]),
                        el('span', { class: costBadgeClass }, [`💰 ${cost}`])
                    ])
                ]);
            });

            diffList(flatContainer, newRows, 'data-id');
        } else {
            flatContainer.style.display = 'none';

            groups.forEach(group => {
                const cat = categoryMap.get(group.id);
                if (!cat) return;

                if (group.items.length === 0) {
                    cat.accordion.style.display = 'none';
                    return;
                }

                cat.accordion.style.display = '';

                // Auto-open if it contains the selected item and isn't open yet
                const containsSelected = group.items.some(item => getItemKey(item) === selectedKey);

                if (containsSelected && !cat.accordion.open) {
                    cat.accordion.open = true;
                }

                // Reconcile item list inside this category
                const newRows = group.items.map(item => {
                    const itemKey = getItemKey(item);
                    const activeClass = selectedKey === itemKey ? 'active' : '';
                    const ownedCount = getOwnedCount(item);
                    const cost = item.cost || item.sellPrice || 0;
                    const canAfford = playerGold >= cost;
                    const costBadgeClass = canAfford ? 'shop-item-cost-badge' : 'shop-item-cost-badge insufficient';

                    let displayName = '';
                    if (item.type === 'consumable') {
                        displayName = t(item.i18n_name);
                    } else {
                        displayName = getEquipmentName(item, t);
                    }

                    const countBadge = item.count !== undefined && item.type === 'consumable' ? ` ×${item.count}` : '';
                    const ownedBadge = item.type === 'consumable' && item.count !== undefined 
                        ? null 
                        : el('span', { class: 'shop-item-owned-badge' }, [`${ownedCount}`]);

                    return el('div', {
                        class: `shop-item-row ${activeClass}`,
                        'data-id': itemKey,
                        onClick: () => onSelect(itemKey)
                    }, [
                        el('span', { class: 'list-item-title' }, [`${displayName}${countBadge}`]),
                        el('div', { class: 'shop-item-meta' }, [
                            ownedBadge,
                            el('span', { class: costBadgeClass }, [`💰 ${cost}`])
                        ].filter(Boolean))
                    ]);
                });

                diffList(cat.listContainer, newRows, 'data-id');
            });
        }
    }

    return {
        root,
        update
    };
}
