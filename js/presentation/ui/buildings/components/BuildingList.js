import { el, diffList } from '../../shared/utils/DOMUtils.js';

export function createBuildingList({ onSelect, t }) {
    const root = el('div');

    function update({ buildings, selectedBuildingId, village }) {
        if (buildings.length === 0) {
            root.innerHTML = '';
            return;
        }

        const newElements = buildings.map(id => {
            const level = village.infrastructure[id];
            const isConstructing = village.constructionQueue.find(p => p.buildingId === id);
            const isActive = selectedBuildingId === id;

            const progressEl = isConstructing
                ? el('div', { class: 'progress-container' }, [
                    el('div', {
                        class: 'progress-bar warning',
                        style: { width: `${((isConstructing.duration - isConstructing.daysRemaining) / isConstructing.duration) * 100}%` }
                    })
                ])
                : null;

            return el('div', {
                class: ['list-item', 'building-card', isActive ? 'active' : ''],
                dataId: id,
                onClick: () => onSelect(id)
            }, [
                el('div', { class: 'list-item-header' }, [
                    el('span', { class: 'list-item-title' }, [t('village_info_building_' + id)]),
                    el('span', { class: 'list-item-level' }, [`${t('shared_uxelm_level')} ${level}`])
                ]),
                progressEl
            ]);
        });

        diffList(root, newElements, 'data-id');
    }

    return { root, update };
}
