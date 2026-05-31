import { el, diffList } from '../../shared/utils/DOMUtils.js';

/**
 * createObjectiveItem - Creates objective DOM node.
 */
function createObjectiveItem(obj, t) {
    const pct = Math.min(100, Math.floor((obj.progress / obj.target) * 100));
    const isDone = obj.completed;
    const labelText = (t(obj.label)).replace('{target}', obj.target);

    return el('div', {
        class: `objective-item ${isDone ? 'completed' : ''}`,
        dataId: obj.id || obj.label
    }, [
        el('div', { class: 'objective-header' }, [
            el('span', { class: 'objective-check' }, [isDone ? '✅' : '⬜']),
            el('span', { class: 'objective-label' }, [labelText]),
            el('span', { class: 'objective-progress' }, [`${obj.progress} / ${obj.target}`])
        ]),
        el('div', { class: 'progress-container', style: 'margin-top: 6px;' }, [
            el('div', {
                class: `progress-bar ${isDone ? 'success' : ''}`,
                style: { width: `${pct}%` }
            })
        ])
    ]);
}

/**
 * DailyObjectives - Manages daily objectives list.
 */
export class DailyObjectives {
    constructor({ t, container }) {
        this.t = t;
        this.container = container;
        this.allCompletedEl = null;
    }

    update(dailyObj) {
        if (!dailyObj || !dailyObj.objectives || dailyObj.objectives.length === 0) {
            this.container.innerHTML = '';
            this.container.appendChild(
                el('div', { class: 'empty-state', dataI18n: 'daily_uxelm_objective_none' }, [
                    this.t('daily_uxelm_objective_none')
                ])
            );
            this.allCompletedEl = null;
            return;
        }

        // We want to differentiate between the list items and the "all completed" banner.
        // Let's keep a dedicated wrapper for objectives list.
        let listWrapper = this.container.querySelector('.objectives-list-wrapper');
        if (!listWrapper) {
            this.container.innerHTML = '';
            listWrapper = el('div', { class: 'objectives-list-wrapper' });
            this.container.appendChild(listWrapper);
        }

        const newElements = dailyObj.objectives.map(obj => createObjectiveItem(obj, this.t));
        diffList(listWrapper, newElements, 'data-id');

        const allDone = dailyObj.allCompleted;
        if (allDone) {
            if (!this.allCompletedEl || !this.allCompletedEl.parentNode) {
                this.allCompletedEl = el('div', { class: 'objective-all-completed' }, [
                    el('span', {}, ['🎉']),
                    ` ${this.t('daily_uxelm_objective_all_done')}`
                ]);
                this.container.appendChild(this.allCompletedEl);
            }
        } else {
            if (this.allCompletedEl) {
                this.allCompletedEl.remove();
                this.allCompletedEl = null;
            }
        }
    }
}
