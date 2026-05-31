import { el, diffList } from '../../shared/utils/DOMUtils.js';
import { getEquipmentName } from '../../shared/EquipmentHelper.js';

export function createForgeItemList({ onSelect, t }) {
    const root = el('div');

    const emptyStateRef = el('div', {
        class: 'empty-state',
        dataI18n: 'forge_uxelm_no_items'
    }, [t('forge_uxelm_no_items')]);

    const listContainerRef = el('div', { class: 'forge-item-list' });

    root.appendChild(emptyStateRef);
    root.appendChild(listContainerRef);

    function update({ equipment, selectedId }) {
        if (equipment.length === 0) {
            emptyStateRef.style.display = 'block';
            listContainerRef.style.display = 'none';
            return;
        }

        emptyStateRef.style.display = 'none';
        listContainerRef.style.display = 'block';

        const newElements = equipment.map(item => {
            const isActive = selectedId === item.id;
            const equippedSuffix = item.equippedOn ? ` [${item.equippedOn}]` : '';
            return el('div', {
                class: ['list-item', 'forge-item-row', isActive ? 'active' : ''],
                dataId: item.id,
                onClick: () => onSelect(item.id)
            }, [
                el('div', { class: 'list-item-header' }, [
                    el('span', { class: 'list-item-title' }, [
                        `${getEquipmentName(item, t)}${equippedSuffix}`
                    ]),
                    el('span', { class: 'list-item-level' }, [`+${item.level || 0}`])
                ])
            ]);
        });

        diffList(listContainerRef, newElements, 'data-id');
    }

    return { root, update };
}
