import { el, diffList } from '../../shared/utils/DOMUtils.js';

/**
 * createConstructionItem - Creates a construction item DOM node.
 */
function createConstructionItem(project, t, onClick) {
    const pct = ((project.duration - project.daysRemaining) / project.duration) * 100;
    const daysLabel = t('shared_uxelm_days');
    const lvlLabel = t('shared_uxelm_level');
    
    return el('div', {
        class: 'list-item construction-item',
        dataId: project.buildingId,
        onClick: () => {
            if (onClick) {
                onClick(project.buildingId);
            }
        }
    }, [
        el('div', { class: 'list-item-header' }, [
            el('span', { class: 'list-item-title' }, [t('village_info_building_' + project.buildingId)]),
            el('span', { class: 'list-item-level' }, [`${lvlLabel} ${project.targetLevel}`])
        ]),
        el('div', { class: 'construction-status' }, [
            el('span', { class: 'days-remaining' }, [`⏳ ${project.daysRemaining} ${daysLabel}`])
        ]),
        el('div', { class: 'progress-container' }, [
            el('div', {
                class: 'progress-bar warning',
                style: { width: `${pct}%` }
            })
        ])
    ]);
}

/**
 * ConstructionQueue - Manages the list of active construction projects.
 */
export class ConstructionQueue {
    constructor({ t, container, onItemClick }) {
        this.t = t;
        this.container = container;
        this.onItemClick = onItemClick;
    }

    update(queue) {
        if (!queue || queue.length === 0) {
            this.container.innerHTML = '';
            this.container.appendChild(
                el('div', { class: 'empty-state', dataI18n: 'village_uxelm_project_none' }, [
                    this.t('village_uxelm_project_none')
                ])
            );
            return;
        }

        const newElements = queue.map(project => createConstructionItem(project, this.t, this.onItemClick));
        diffList(this.container, newElements, 'data-id');
    }
}
