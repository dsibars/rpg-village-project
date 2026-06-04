import { el, diffList } from '../../shared/utils/DOMUtils.js';

/**
 * VillageDefense - Manages defense counts, defender chips, and assignable list.
 */
export class VillageDefense {
    constructor({ t, countEl, assignmentsContainer }) {
        this.t = t;
        this.countEl = countEl;
        this.assignmentsContainer = assignmentsContainer;
    }

    update(calendar, heroes) {
        if (!calendar) return;

        const assigned = calendar.defenseAssigned || [];
        if (this.countEl) {
            const expectedText = String(assigned.length);
            if (this.countEl.textContent !== expectedText) {
                this.countEl.textContent = expectedText;
            }
        }

        if (!this.assignmentsContainer) return;

        const maxDefenders = 4;
        const idleHeroes = (heroes || []).filter(h => h.activity === 'idle' && h.hp > 0);
        const canAssign = assigned.length < maxDefenders;

        if (assigned.length === 0 && idleHeroes.length === 0) {
            this.assignmentsContainer.innerHTML = '';
            this.assignmentsContainer.appendChild(
                el('div', { class: 'empty-state', dataI18n: 'village_uxelm_defender_none' }, [
                    this.t('village_uxelm_defender_none')
                ])
            );
            return;
        }

        // Clean up empty state if any
        const emptyState = this.assignmentsContainer.querySelector('.empty-state');
        if (emptyState) {
            emptyState.remove();
        }

        // defenders-row logic
        let defendersRow = this.assignmentsContainer.querySelector('.defenders-row');
        if (assigned.length > 0) {
            if (!defendersRow) {
                defendersRow = el('div', {
                    class: 'defenders-row',
                    style: 'display:flex; flex-wrap:wrap; gap:4px; margin-bottom:8px;'
                });
                this.assignmentsContainer.insertBefore(defendersRow, this.assignmentsContainer.firstChild);
            }
            
            const newChips = assigned.map(heroId => {
                const hero = (heroes || []).find(h => h.id === heroId);
                const heroName = hero ? hero.name : heroId;
                return el('span', {
                    class: 'defender-chip',
                    dataId: heroId,
                    dataDefenseAction: 'unassign',
                    dataHeroId: heroId,
                    title: this.t('shared_uxelm_remove'),
                    style: { cursor: 'pointer' }
                }, [
                    heroName,
                    el('span', { class: 'remove-btn' }, ['×'])
                ]);
            });
            diffList(defendersRow, newChips, 'data-id');
        } else {
            if (defendersRow) {
                defendersRow.remove();
            }
        }

        // defense-assign-section logic
        let assignSection = this.assignmentsContainer.querySelector('.defense-assign-section');
        const assignableHeroes = idleHeroes.filter(hero => !assigned.includes(hero.id));
        if (assignableHeroes.length > 0 && canAssign) {
            if (!assignSection) {
                const title = el('h4', {}, [this.t('village_uxelm_defender_assign')]);
                const btnList = el('div', { class: 'assign-buttons-list', style: 'display:flex; flex-wrap:wrap; gap:4px;' });
                assignSection = el('div', { class: 'defense-assign-section' }, [
                    title,
                    btnList
                ]);
                this.assignmentsContainer.appendChild(assignSection);
            }

            const btnList = assignSection.querySelector('.assign-buttons-list');
            const newBtns = assignableHeroes.map(hero => {
                return el('button', {
                    class: 'assign-btn',
                    dataHeroId: hero.id,
                    dataDefenseAction: 'assign'
                }, [`+ ${hero.name}`]);
            });
            diffList(btnList, newBtns, 'data-hero-id');
        } else {
            if (assignSection) {
                assignSection.remove();
            }
        }
    }
}
