import { el } from './utils/DOMUtils.js';

/**
 * ExpeditionResultModal - Shows expedition completion/failure/progress
 * as a standalone message before the daily report.
 */
export class ExpeditionResultModal {
    constructor({ t, container }) {
        this.t = t;
        this.container = container || document.getElementById('expedition-result-container');
        this.onDismiss = null;
    }

    show(expeditionData, onDismiss) {
        this.onDismiss = onDismiss;

        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'expedition-result-container';
            this.container.className = 'modal-overlay';
            this.container.style.zIndex = '9000';
            document.body.appendChild(this.container);
        }

        const exp = expeditionData;
        const expName = this.t(exp.expId) !== exp.expId ? this.t(exp.expId) : (exp.expName || exp.expId);

        let icon = '⚔️';
        let titleText = '';
        let bodyText = '';
        let sectionClass = '';

        if (exp.status === 'completed') {
            icon = '✨';
            sectionClass = 'success';
            titleText = this.t('village_msg_report_exp_completed_title').replace('{name}', expName);

            const rewards = [];
            if (exp.reward) {
                if (exp.reward.gold) rewards.push(`${exp.reward.gold} ${this.t('village_info_gold')}`);
                if (exp.reward.items) {
                    for (const [id, qty] of Object.entries(exp.reward.items)) {
                        const transKey = id.startsWith('material_') || id.startsWith('food_') || id.startsWith('meal_') ? id : 'item_' + id;
                        rewards.push(`${qty} ${this.t(transKey)}`);
                    }
                }
            }
            if (exp.drops) {
                if (exp.drops.loot) {
                    const loot = exp.drops.loot;
                    const matKey = 'inventory_info_tier_' + loot.material;
                    const typeKey = 'inventory_info_type_' + loot.type;
                    rewards.push(`${this.t(matKey)} ${this.t(typeKey)}`);
                }
                if (exp.drops.consumables && exp.drops.consumables.length > 0) {
                    exp.drops.consumables.forEach(({ id, qty }) => {
                        rewards.push(`${qty} ${this.t('item_' + id)}`);
                    });
                }
                if (exp.drops.glyphs && exp.drops.glyphs.length > 0) {
                    exp.drops.glyphs.forEach(({ tabletId }) => {
                        rewards.push(`1 ${this.t('item_' + tabletId)}`);
                    });
                }
            }
            bodyText = rewards.length > 0
                ? this.t('village_msg_report_exp_completed_rewards').replace('{rewards}', rewards.join(', '))
                : this.t('village_msg_report_exp_completed_norewards');
        } else if (exp.status === 'failed') {
            icon = '💀';
            sectionClass = 'danger';
            titleText = this.t('village_msg_report_exp_failed_title').replace('{name}', expName);
            bodyText = this.t('village_msg_report_exp_failed_body');
        } else if (exp.status === 'progress') {
            icon = '🗺️';
            titleText = this.t('village_msg_report_exp_progress_title').replace('{name}', expName);
            bodyText = this.t('village_msg_report_exp_progress_body');
        }

        this.container.innerHTML = '';
        this.container.style.display = 'flex';

        const content = el('div', { class: 'card widget expedition-result-content' }, [
            el('div', { class: 'expedition-result-header' }, [
                el('span', { class: 'expedition-result-icon' }, [icon]),
                el('h3', {}, [titleText])
            ]),
            el('div', { class: `expedition-result-body ${sectionClass}` }, [
                el('p', {}, [bodyText])
            ]),
            el('div', { class: 'expedition-result-footer' }, [
                el('button', {
                    class: 'btn btn-primary shine-effect',
                    onClick: () => this.dismiss()
                }, [this.t('shared_uxelm_continue')])
            ])
        ]);

        this.container.appendChild(content);
    }

    dismiss() {
        if (this.container) {
            this.container.style.display = 'none';
            this.container.innerHTML = '';
        }
        if (this.onDismiss) {
            this.onDismiss();
            this.onDismiss = null;
        }
    }
}
