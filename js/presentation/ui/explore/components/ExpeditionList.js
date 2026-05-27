import { el, diffList } from '../../shared/utils/DOMUtils.js';

export function createExpeditionList({ onSelect, t }) {
    const root = el('div');
    const regionMap = new Map();

    function update({ expeditions, selectedId }) {
        const byRegion = {};
        expeditions.forEach(exp => {
            if (!byRegion[exp.regionId]) byRegion[exp.regionId] = [];
            byRegion[exp.regionId].push(exp);
        });

        // Add/update regions
        for (const [regionId, exps] of Object.entries(byRegion)) {
            let region = regionMap.get(regionId);
            if (!region) {
                const nodesContainer = el('div', { class: 'region-nodes' });
                const titleEl = el('h4', { class: 'region-title' });
                const regionEl = el('div', { class: 'region-group' }, [titleEl, nodesContainer]);
                root.appendChild(regionEl);
                region = { el: regionEl, nodesContainer, titleEl };
                regionMap.set(regionId, region);
            }
            region.titleEl.textContent = t(regionId) || regionId;

            const labelStages = t('ui_exp_stages') || 'Stages';
            const newCards = exps.map(exp => {
                const isActive = selectedId === exp.id;
                const recLevel = Math.max(1, ...(exp.stages || []).map(s => s.enemyLevel || 1));
                return el('div', {
                    class: ['list-item', 'expedition-card', isActive ? 'active' : ''],
                    dataId: exp.id,
                    onClick: () => onSelect(exp.id)
                }, [
                    el('div', { class: 'list-item-header' }, [
                        el('span', { class: 'list-item-title' }, [exp.name]),
                        el('span', { class: 'list-item-badge' }, [`${exp.stages.length} ${labelStages} • Lv. ${recLevel}`])
                    ])
                ]);
            });

            diffList(region.nodesContainer, newCards, 'data-id');
        }

        // Reorder regions to match current expedition order
        const expectedOrder = Object.keys(byRegion);
        expectedOrder.forEach((regionId, index) => {
            const region = regionMap.get(regionId);
            if (region && root.children[index] !== region.el) {
                root.insertBefore(region.el, root.children[index] || null);
            }
        });

        // Remove regions that no longer exist
        for (const [regionId, region] of Array.from(regionMap.entries())) {
            if (!byRegion[regionId]) {
                region.el.remove();
                regionMap.delete(regionId);
            }
        }
    }

    return { root, update };
}
