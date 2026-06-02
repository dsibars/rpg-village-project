import { el } from '../../shared/utils/DOMUtils.js';

/**
 * CombatResolutionPane - Renders victory/defeat results, earned EXP, level-ups, and loot rewards.
 */
export class CombatResolutionPane {
    constructor({ t, onResolve }) {
        this.t = t;
        this.onResolve = onResolve;

        this.root = el('div', {
            style: 'display: flex; flex-direction: column; align-items: center; width: 100%;'
        });
    }

    update(battle, engine) {
        if (!battle || !battle.isOver) return;

        this.root.innerHTML = '';

        const preview = engine && engine.getBattleResolutionPreview ? engine.getBattleResolutionPreview() : null;
        const isVictory = preview ? preview.isVictory : battle.winner === 'heroes';
        const resultColor = isVictory ? '#4caf50' : '#f44336';
        const resultText = isVictory ? this.t('shared_uxelm_victory') : this.t('shared_uxelm_defeat');

        let summaryHtml = '';
        if (preview && preview.summary) {
            summaryHtml = preview.summary.map(s => {
                let text = `<strong>${s.heroName}</strong>: `;
                if (s.hpLost > 0) text += `<span style="color:#f44336;font-size:0.9em;">-${s.hpLost} HP</span> | `;
                else if (s.hpLost < 0) text += `<span style="color:#4caf50;font-size:0.9em;">+${-s.hpLost} HP</span> | `;
                text += `<span style="color:#03a9f4;font-size:0.9em;">+${s.expEarned} EXP</span>`;
                if (s.leveledUp) text += ` <span style="color:#ffeb3b;font-weight:bold;font-size:0.9em;">(LEVEL UP!)</span>`;
                return `<div style="margin-bottom:5px;">${text}</div>`;
            }).join('');
        }

        let rewardsHtml = '';
        if (preview && preview.isLastStage && preview.rewards) {
            const rewards = [];
            if (preview.rewards.gold) rewards.push(`💰 ${preview.rewards.gold} Gold`);
            if (preview.rewards.items) {
                for (const [itemId, qty] of Object.entries(preview.rewards.items)) {
                    // inventory domain key — not yet migrated
                    rewards.push(`📦 ${qty}x ${this.t(itemId)}`);
                }
            }
            if (rewards.length > 0) {
                rewardsHtml = `
                    <div style="margin-top:15px;border-top:1px solid rgba(255,255,255,0.1);padding-top:10px;">
                        <h4 style="color:#ffeb3b;margin:0 0 5px 0;">${this.t('combat_uxelm_rewards')}</h4>
                        <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;font-size:0.95rem;">
                            ${rewards.map(r => `<span style="background:rgba(255,235,59,0.1);border:1px solid rgba(255,235,59,0.3);padding:4px 8px;border-radius:4px;">${r}</span>`).join('')}
                        </div>
                    </div>`;
            }
        }

        const detailsEl = el('div', {
            style: 'background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.1);padding:12px;border-radius:6px;text-align:left;max-height:240px;overflow-y:auto;display:block;width:100%;box-sizing:border-box;'
        });
        detailsEl.innerHTML = summaryHtml + rewardsHtml;

        const titleEl = el('h3', {
            style: `color:${resultColor};font-size:1.6rem;margin:0 0 10px 0;`
        }, [resultText]);

        const resolveBtn = el('button', {
            id: 'btn-resolve-battle',
            class: 'btn btn-primary',
            style: 'width:100%;',
            onClick: () => this.onResolve()
        }, [this.t('shared_uxelm_close')]);

        this.root.appendChild(
            el('div', { style: 'text-align:center;margin-bottom:15px;width:100%;' }, [
                titleEl,
                detailsEl
            ])
        );
        this.root.appendChild(resolveBtn);
    }
}
