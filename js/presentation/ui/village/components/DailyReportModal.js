import { el } from '../../shared/utils/DOMUtils.js';

/**
 * DailyReportModal - Surgically renders the daily report modal overlay.
 */
export class DailyReportModal {
    constructor({ t, container, onAcknowledge }) {
        this.t = t;
        this.container = container;
        this.onAcknowledge = onAcknowledge;
    }

    update(report, dismissedReportDay) {
        if (!report) {
            this.container.style.display = 'none';
            this.container.classList.remove('daily-report-overlay');
            return;
        }

        // If report has been dismissed for the day, hide the overlay modal
        if (dismissedReportDay === report.day) {
            this.container.style.display = 'none';
            this.container.classList.remove('daily-report-overlay');
            return;
        }

        // Show as active modal overlay
        this.container.style.display = 'flex';
        this.container.classList.add('daily-report-overlay');

        const sections = [];

        // Food Section
        const foodClass = report.starvation ? 'danger' : '';
        const foodText = report.starvation 
            ? this.t('village_msg_report_starvation') 
            : this.t('village_msg_report_food').replace('{amount}', report.consumed);
        sections.push(el('div', { class: `report-section ${foodClass}` }, [
            el('span', { class: 'report-icon' }, ['🍞']),
            el('span', {}, [foodText])
        ]));

        // Growth Section
        if (report.growth > 0) {
            sections.push(el('div', { class: 'report-section' }, [
                el('span', { class: 'report-icon' }, ['👶']),
                el('span', {}, [this.t('village_msg_report_growth').replace('{amount}', report.growth)])
            ]));
        }

        // Miner Yield Section
        if (report.minerYield && (report.minerYield.wood > 0 || report.minerYield.stone > 0)) {
            const yields = [];
            if (report.minerYield.wood > 0) yields.push(`${report.minerYield.wood} ${this.t('inventory_info_mat_wood')}`);
            if (report.minerYield.stone > 0) yields.push(`${report.minerYield.stone} ${this.t('inventory_info_mat_stone')}`);
            sections.push(el('div', { class: 'report-section success' }, [
                el('span', { class: 'report-icon' }, ['⛏️']),
                el('span', {}, [this.t('village_msg_report_miner').replace('{yield}', yields.join(', '))])
            ]));
        }

        // Construction Completed Section
        if (report.completed && report.completed.length > 0) {
            sections.push(el('div', { class: 'report-section' }, [
                el('span', { class: 'report-icon' }, ['🔨']),
                el('span', {}, [`${this.t('village_msg_report_built')} ${report.completed.map(id => this.t('village_info_building_' + id)).join(', ')}`])
            ]));
        }

        // Recovery Section
        if (report.recovery && report.recovery.length > 0) {
            const healedStr = report.recovery.map(h => `${h.heroName} (+${h.amount} HP)`).join(', ');
            sections.push(el('div', { class: 'report-section success' }, [
                el('span', { class: 'report-icon' }, ['💖']),
                el('span', {}, [this.t('village_msg_report_recovery').replace('{healed}', healedStr)])
            ]));
        }

        // Training Section
        if (report.training && report.training.length > 0) {
            const leveled = report.training.filter(t => t.leveledUp).map(t => t.heroName);
            const trainingText = leveled.length > 0
                ? this.t('village_msg_report_training_level').replace('{heroes}', leveled.join(', '))
                : this.t('village_msg_report_training').replace('{count}', report.training.length);
            sections.push(el('div', { class: `report-section ${leveled.length > 0 ? 'success' : ''}` }, [
                el('span', { class: 'report-icon' }, ['💪']),
                el('span', {}, [trainingText])
            ]));
        }

        // Expedition Section
        if (report.expedition) {
            const exp = report.expedition;
            const expName = this.t(exp.expId) !== exp.expId ? this.t(exp.expId) : (exp.expName || exp.expId);
            
            if (exp.status === 'completed') {
                let rewardsStr = '';
                if (exp.reward) {
                    const rewards = [];
                    if (exp.reward.gold) rewards.push(`${exp.reward.gold} ${this.t('village_info_gold')}`);
                    if (exp.reward.items) {
                        for (const [id, qty] of Object.entries(exp.reward.items)) {
                            const transKey = id.startsWith('material_') || id.startsWith('food_') || id.startsWith('meal_') ? id : 'item_' + id;
                            rewards.push(`${qty} ${this.t(transKey)}`);
                        }
                    }
                    rewardsStr = rewards.join(', ');
                }
                sections.push(el('div', { class: 'report-section success' }, [
                    el('span', { class: 'report-icon' }, ['✨']),
                    el('span', {}, [this.t('village_msg_report_exp_completed').replace('{name}', expName).replace('{rewards}', rewardsStr)])
                ]));
            } else if (exp.status === 'failed') {
                sections.push(el('div', { class: 'report-section danger' }, [
                    el('span', { class: 'report-icon' }, ['💀']),
                    el('span', {}, [this.t('village_msg_report_exp_failed').replace('{name}', expName)])
                ]));
            } else if (exp.status === 'progress') {
                sections.push(el('div', { class: 'report-section' }, [
                    el('span', { class: 'report-icon' }, ['⚔️']),
                    el('span', {}, [this.t('village_msg_report_exp_progress').replace('{name}', expName)])
                ]));
            }
        }

        // Tavern Recruit Section
        if (report.tavernRecruit) {
            const hero = report.tavernRecruit;
            const originKey = 'heroes_info_origin_' + hero.origin.replace('origin_', '');
            sections.push(el('div', { class: 'report-section success' }, [
                el('span', { class: 'report-icon' }, ['🍺']),
                el('span', {}, [this.t('village_msg_report_tavern_recruit').replace('{name}', hero.name).replace('{origin}', this.t(originKey))])
            ]));
        }

        // Raid Section
        if (report.raid) {
            const raid = report.raid;
            if (raid.isVictory) {
                sections.push(el('div', { class: 'report-section success' }, [
                    el('span', { class: 'report-icon' }, ['🛡️']),
                    el('span', {}, [this.t('village_msg_report_raid_victory')
                        .replace('{defense}', raid.defensePower)
                        .replace('{raid}', raid.raidPower)
                        .replace('{gold}', raid.goldReward || 0)])
                ]));
            } else {
                const damagedStr = raid.damagedBuilding
                    ? this.t('village_msg_report_raid_damaged').replace('{building}', this.t('village_info_building_' + raid.damagedBuilding))
                    : '';
                sections.push(el('div', { class: 'report-section danger' }, [
                    el('span', { class: 'report-icon' }, ['⚠️']),
                    el('span', {}, [this.t('village_msg_report_raid_defeat')
                        .replace('{defense}', raid.defensePower)
                        .replace('{raid}', raid.raidPower)
                        .replace('{wood}', raid.woodLoss || 0)
                        .replace('{stone}', raid.stoneLoss || 0)
                        .replace('{damaged}', damagedStr)])
                ]));
            }
        }

        this.container.innerHTML = '';
        
        const closeBtn = el('button', {
            class: 'btn-close-report',
            title: this.t('shared_uxelm_close'),
            onClick: this.onAcknowledge
        }, ['×']);
        closeBtn.setAttribute('data-action', 'dismiss-report');

        const headerEl = el('div', { class: 'daily-report-header' }, [
            el('h3', {}, [this.t('village_uxelm_report_title').replace('{day}', report.day - 1)]),
            closeBtn
        ]);

        const contentEl = el('div', { class: 'report-content' }, sections);

        const footerEl = el('div', {
            class: 'daily-report-footer',
            style: 'margin-top: 15px; text-align: center;'
        }, [
            el('button', {
                class: 'btn btn-primary btn-sm shine-effect',
                onClick: this.onAcknowledge
            }, [
                el('span', { dataI18n: 'shared_uxelm_acknowledge' }, [this.t('shared_uxelm_acknowledge')])
            ])
        ]);

        const modalContent = el('div', { class: 'card widget daily-report-modal-content' }, [
            headerEl,
            contentEl,
            footerEl
        ]);

        this.container.appendChild(modalContent);
    }
}
