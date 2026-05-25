import { BaseModal } from '../../components/modal/BaseModal.js';
import { getEquipmentName, getEquipmentStats } from '../../shared/EquipmentHelper.js';

export class HeroEquipmentModal {
    static show(hero, slot, inventoryEquipment, t, emit) {
        if (!hero || hero.activity !== 'idle') return;

        const currentItem = hero.equipment[slot];

        // Filter eligible items in inventory
        const eligibleItems = inventoryEquipment.filter(item => {
            if (slot === 'leftHand' || slot === 'rightHand') {
                return item.type === 'weapon' || (item.type === 'armor' && item.slot === slot);
            } else {
                return item.type === 'armor' && item.slot === slot;
            }
        });

        const currentStats = currentItem ? getEquipmentStats(currentItem) : {};

        const formatDelta = (val, label) => {
            if (val === 0) return '';
            const color = val > 0 ? 'var(--success)' : 'var(--danger)';
            const sign = val > 0 ? '+' : '';
            return `<span style="color:${color}; font-weight:700;">${sign}${val} ${label}</span>`;
        };

        let itemsHtml = '';
        if (eligibleItems.length === 0) {
            itemsHtml = `<div style="text-align:center; padding: 25px; color: var(--text-muted); font-size: 0.95rem;">${t('ui_no_items')}</div>`;
        } else {
            itemsHtml = eligibleItems.map(item => {
                const statsObj = getEquipmentStats(item);
                const statLines = [];
                const deltaLines = [];

                const pushStat = (key, label) => {
                    const val = statsObj[key] || 0;
                    const cur = currentStats[key] || 0;
                    if (val || cur) {
                        statLines.push(`${val > 0 ? '+' : ''}${val} ${label}`);
                        const delta = val - cur;
                        if (delta !== 0) deltaLines.push(formatDelta(delta, label));
                    }
                };

                pushStat('strength', t('ui_stats_power') || 'STR');
                pushStat('defense', 'DEF');
                pushStat('maxHp', 'HP');
                pushStat('maxMp', 'MP');
                pushStat('magicPower', 'MAG');
                pushStat('speed', 'SPD');
                if (statsObj.evasion || currentStats.evasion) {
                    const eva = statsObj.evasion || 0;
                    const curEva = currentStats.evasion || 0;
                    statLines.push(`${eva > 0 ? '+' : ''}${eva}% EVA`);
                    const delta = eva - curEva;
                    if (delta !== 0) deltaLines.push(formatDelta(delta, '% EVA'));
                }

                const desc = statLines.join(', ');
                const deltas = deltaLines.join(' ');

                return `
                    <div class="list-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; margin-bottom: 8px; cursor: default;">
                        <div style="flex: 1; text-align: left; padding-right: 10px;">
                            <div style="font-weight:700; color: var(--text-primary);">${getEquipmentName(item, t)}</div>
                            <div style="font-size:0.8rem; color:var(--text-secondary); margin-top: 2px;">${desc}</div>
                            ${deltas ? `<div style="font-size:0.75rem; margin-top: 2px;">${deltas}</div>` : ''}
                        </div>
                        <button class="btn btn-primary btn-sm btn-select-equip" data-id="${item.id}" style="min-width: 70px;">
                            ${t('ui_equip') || 'Equip'}
                        </button>
                    </div>
                `;
            }).join('');
        }

        let contentHtml = `
            ${currentItem ? `
                <div style="background: rgba(239, 68, 68, 0.05); border: 1px dashed var(--danger); padding: 12px; border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <div style="text-align: left;">
                        <div style="font-size: 0.8rem; color: var(--text-muted);">${t('ui_equipped') || 'Equipped'}:</div>
                        <div style="font-weight: 700; color: var(--danger); margin-top: 2px;">${getEquipmentName(currentItem, t)}</div>
                    </div>
                    <button class="btn btn-danger btn-sm" id="btn-unequip-slot" style="padding: 6px 12px; font-size: 0.8rem;">
                        ${t('ui_unequip') || 'Unequip'}
                    </button>
                </div>
            ` : ''}
            
            <div style="font-weight: 700; font-size: 0.85rem; margin-bottom: 10px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; text-align: left;">
                ${t('ui_available_gear') || 'Available Gear'}
            </div>
            ${itemsHtml}
            
            <div class="modal-actions" style="border-top: 1px solid var(--glass-border); padding-top: 12px; display: flex; justify-content: flex-end; margin-top: auto;">
                <button class="btn btn-secondary btn-sm" id="btn-cancel-equip-modal">${t('btn_cancel')}</button>
            </div>
        `;

        const title = `${t('ui_equip')} - ${t('slot_' + slot)}`;
        
        const modal = BaseModal.show({
            title: title,
            contentHtml: contentHtml,
            maxWidth: '480px'
        });

        const overlay = modal.overlay;

        overlay.querySelector('#btn-cancel-equip-modal').addEventListener('click', modal.close);

        if (currentItem) {
            overlay.querySelector('#btn-unequip-slot').addEventListener('click', () => {
                emit('unequipItem', { heroId: hero.id, slot });
                modal.close();
            });
        }

        overlay.querySelectorAll('.btn-select-equip').forEach(btn => {
            btn.addEventListener('click', () => {
                const itemId = btn.dataset.id;
                emit('equipItem', { heroId: hero.id, slot, itemId });
                modal.close();
            });
        });
    }
}
