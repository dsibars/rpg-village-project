import { el } from '../../shared/utils/DOMUtils.js';

/**
 * CombatHeader - Manages battle title, stage labels, and auto/skip action buttons.
 */
export class CombatHeader {
    constructor({ t, onAutoToggle, onSkip }) {
        this.t = t;
        this.onAutoToggle = onAutoToggle;
        this.onSkip = onSkip;

        this.titleEl = el('h2', {}, ['...']);
        this.stageLabel = el('div', {
            style: 'font-size:0.9rem;color:var(--text-secondary);margin-top:4px;'
        }, ['...']);

        this.autoBtn = el('button', {
            class: 'btn btn-sm btn-secondary',
            onClick: () => this.onAutoToggle()
        }, ['...']);

        this.skipBtn = el('button', {
            class: 'btn btn-secondary btn-sm',
            onClick: () => this.onSkip()
        }, [this.t('btn_skip_combat')]);

        this.root = el('div', { class: 'combat-header' }, [
            el('div', {}, [this.titleEl, this.stageLabel]),
            el('div', { class: 'combat-header-controls' }, [
                this.autoBtn,
                this.skipBtn
            ])
        ]);
    }

    update(battle, activeExp) {
        if (!battle) return;

        const currentStageNum = activeExp ? activeExp.currentStage + 1 : 1;
        const stageText = `${this.t('exp_stage')} ${currentStageNum}`;
        const titleText = activeExp ? (this.t(activeExp.id) !== activeExp.id ? this.t(activeExp.id) : activeExp.name) : this.t('combat_battle_title');

        if (this.titleEl.textContent !== titleText) {
            this.titleEl.textContent = titleText;
        }
        if (this.stageLabel.textContent !== stageText) {
            this.stageLabel.textContent = stageText;
        }

        const isOver = battle.isOver;
        this.autoBtn.disabled = isOver;
        this.skipBtn.disabled = isOver;

        const autoText = `${this.t('btn_auto_combat')} ${battle.autoBattle ? '(ON)' : '(OFF)'}`;
        if (this.autoBtn.textContent !== autoText) {
            this.autoBtn.textContent = autoText;
        }

        const autoClass = `btn btn-sm ${battle.autoBattle ? 'btn-primary' : 'btn-secondary'}`;
        if (this.autoBtn.className !== autoClass) {
            this.autoBtn.className = autoClass;
        }
    }
}
