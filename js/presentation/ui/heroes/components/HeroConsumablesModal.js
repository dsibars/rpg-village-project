import { BaseModal } from '../../components/modal/BaseModal.js';
import { el } from '../../shared/utils/DOMUtils.js';
import { CONSUMABLES_DATA } from '../../../../engine/shared/data/InventoryData.js';

export class HeroConsumablesModal {
    static show(hero, consumables, t, onUse) {
        if (!hero) return;

        const list = el('div', { style: { maxHeight: '320px', overflowY: 'auto' } });

        const entries = Object.entries(consumables).filter(([id, count]) => {
            const data = CONSUMABLES_DATA[id];
            return count > 0 && data && data.type !== 'ESCAPE';
        });

        if (entries.length === 0) {
            list.appendChild(el('p', { style: { color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' } }, [t('heroes_uxelm_consumable_empty')]));
        } else {
            entries.forEach(([id, count]) => {
                const data = CONSUMABLES_DATA[id];
                const isHpFull = data.type === 'HEAL_HP' && hero.hp >= hero.maxHp;
                const isMpFull = data.type === 'HEAL_MP' && hero.mp >= hero.maxMp;
                const isDisabled = isHpFull || isMpFull;

                let effectText = '';
                if (data.type === 'HEAL_HP') {
                    const amount = Math.floor(hero.maxHp * data.amount);
                    effectText = `+${amount} HP`;
                } else if (data.type === 'HEAL_MP') {
                    const amount = Math.floor(hero.maxMp * data.amount);
                    effectText = `+${amount} MP`;
                }

                let disabledReason = '';
                if (isHpFull) disabledReason = t('heroes_uxelm_consumable_full_hp');
                if (isMpFull) disabledReason = t('heroes_uxelm_consumable_full_mp');

                const useBtn = el('button', {
                    class: 'btn btn-primary btn-sm'
                }, [t('heroes_uxelm_use')]);

                if (isDisabled) {
                    useBtn.disabled = true;
                }

                useBtn.addEventListener('click', () => {
                    onUse(id);
                    modal.close();
                });

                const row = el('div', {
                    style: {
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 0',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        opacity: isDisabled ? '0.5' : '1'
                    }
                }, [
                    el('div', {}, [
                        el('div', { style: { fontWeight: '600' } }, [`${t('item_' + id)} × ${count}`]),
                        el('div', { style: { fontSize: '0.75rem', color: 'var(--text-muted)' } }, [
                            effectText + (disabledReason ? ` — ${disabledReason}` : '')
                        ])
                    ]),
                    useBtn
                ]);
                list.appendChild(row);
            });
        }

        const modal = BaseModal.show({
            title: t('heroes_uxelm_consumables_title').replace('{name}', hero.name),
            contentElement: list,
            icon: '🧪',
            maxWidth: '420px'
        });
    }
}
