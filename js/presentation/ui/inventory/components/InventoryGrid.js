import { el, diffList } from '../../shared/utils/DOMUtils.js';

export function createInventoryGrid({ onSelect, t }) {
    const root = el('div', { class: 'inventory-grid-list' });

    function update({ items, selectedItemId }) {
        if (items.length === 0) {
            root.innerHTML = '';
            root.appendChild(el('div', {
                class: 'empty-state',
                style: { gridColumn: '1 / -1' }
            }, [t('inventory_uxelm_no_items')]));
            return;
        }

        const newElements = items.map(item => {
            const isActive = selectedItemId === item.id;
            return el('div', {
                class: ['inventory-item-card', isActive ? 'active' : ''],
                dataId: item.id,
                onClick: () => onSelect(item.id)
            }, [
                item.qty > 1 ? el('span', { class: 'item-badge' }, [String(item.qty)]) : null,
                el('div', { class: 'item-icon' }, [item.icon]),
                el('div', { class: 'item-name' }, [item.name])
            ]);
        });

        diffList(root, newElements, 'data-id');
    }

    return { root, update };
}
