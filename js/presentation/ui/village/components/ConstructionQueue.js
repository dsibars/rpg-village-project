import { el, diffList } from '../../shared/utils/DOMUtils.js';

/**
 * createConstructionItem - Creates a construction item DOM node.
 */
function createConstructionItem(project, t) {
    const pct = ((project.duration - project.daysRemaining) / project.duration) * 100;
    const daysLabel = t('ui_days') || 'Days';
    const lvlLabel = t('ui_level') || 'Level';
    
    return el('div', {
        class: 'list-item construction-item',
        dataId: project.buildingId
    }, [
        el('div', { class: 'list-item-header' }, [
            el('span', { class: 'list-item-title' }, [t('village_' + project.buildingId) || project.buildingId]),
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
    constructor({ t, container }) {
        this.t = t;
        this.container = container;
    }

    update(queue) {
        if (!queue || queue.length === 0) {
            this.container.innerHTML = '';
            this.container.appendChild(
                el('div', { class: 'empty-state', dataI18n: 'ui_no_projects' }, [
                    this.t('ui_no_projects') || 'No active projects'
                ])
            );
            return;
        }

        const newElements = queue.map(project => createConstructionItem(project, this.t));
        diffList(this.container, newElements, 'data-id');
    }
}
