import { el } from '../../shared/utils/DOMUtils.js';

/**
 * LaborPool - Surgically manages role controls and count updates.
 */
export class LaborPool {
    constructor({ t }) {
        this.t = t;
        this.root = el('div', { class: 'role-controls-list' });
        this.rows = new Map(); // role -> { countEl, decBtn, incBtn }
    }

    update(population) {
        const roles = population.roles || { builder: population.builders || 0, farmer: 0, miner: 0, scout: 0 };
        const total = population.total || 0;
        const used = Object.values(roles).reduce((a, b) => a + b, 0);
        const available = total - used;

        const ROLE_ICONS = {
            builder: '🔨',
            farmer: '🌾',
            miner: '⛏️',
            scout: '👁️'
        };

        const ROLE_EFFECTS = {
            builder: this.t('ui_role_builder') || 'Construction',
            farmer: this.t('ui_role_farmer') || '+10% food per farmer',
            miner: this.t('ui_role_miner') || '20% chance for mats',
            scout: this.t('ui_role_scout') || '-1 stage per 2 scouts'
        };

        Object.entries(roles).forEach(([role, count]) => {
            const canInc = available > 0;
            const canDec = count > 0;

            let cached = this.rows.get(role);
            if (!cached) {
                const countEl = el('span', { class: 'role-count' }, [String(count)]);
                const decBtn = el('button', {
                    class: 'btn-role',
                    dataRole: role,
                    dataRoleAction: 'dec',
                    disabled: !canDec
                }, ['−']);
                const incBtn = el('button', {
                    class: 'btn-role',
                    dataRole: role,
                    dataRoleAction: 'inc',
                    disabled: !canInc
                }, ['+']);

                const roleNameEl = el('span', { class: 'role-name' }, [
                    `${ROLE_ICONS[role]} ${this.t('role_' + role) || role} `,
                    el('span', { style: 'font-size:0.75rem; color:var(--text-muted);' }, [`(${ROLE_EFFECTS[role]})`])
                ]);

                const rowEl = el('div', { class: 'role-row' }, [
                    roleNameEl,
                    el('div', { style: 'display:flex; align-items:center; gap:6px;' }, [
                        decBtn,
                        countEl,
                        incBtn
                    ])
                ]);

                this.root.appendChild(rowEl);
                cached = { countEl, decBtn, incBtn };
                this.rows.set(role, cached);
            } else {
                if (cached.countEl.textContent !== String(count)) {
                    cached.countEl.textContent = String(count);
                }
                cached.decBtn.disabled = !canDec;
                cached.incBtn.disabled = !canInc;
            }
        });

        return { available, total };
    }
}
