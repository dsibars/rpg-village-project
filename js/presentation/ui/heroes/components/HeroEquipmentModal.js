import { BaseModal } from '../../components/modal/BaseModal.js';
import { getEquipmentName, getEquipmentStats } from '../../shared/EquipmentHelper.js';
import { el } from '../../shared/utils/DOMUtils.js';

const equipSlots = ['head', 'body', 'legs', 'leftHand', 'rightHand', 'accessory'];
const slotIcons = {
    head: '🪖',
    body: '🦺',
    legs: '👢',
    leftHand: '⚔️',
    rightHand: '🛡️',
    accessory: '💍'
};

export class HeroEquipmentModal {
    static show(hero, slot, inventoryEquipment, t, emit) {
        if (!hero || hero.activity !== 'idle') return;

        if (!slot) {
            HeroEquipmentModal._showSummary(hero, inventoryEquipment, t, emit);
            return;
        }

        HeroEquipmentModal._showSlotPicker(hero, slot, inventoryEquipment, t, emit);
    }

    static _showSummary(hero, inventoryEquipment, t, emit) {
        const isIdle = hero.activity === 'idle';

        const diagramSlots = equipSlots.map(s => {
            const hasItem = !!hero.equipment[s];
            const itemName = hasItem ? getEquipmentName(hero.equipment[s], t) : t('ui_empty_slot') || 'Empty';
            const clickableClass = isIdle ? 'clickable' : 'locked';

            return el('div', {
                class: `equip-slot eq-slot-${s} ${clickableClass} ${hasItem ? 'has-item' : ''}`,
                'data-slot': s,
                onClick: () => {
                    if (!isIdle) return;
                    modal.close();
                    HeroEquipmentModal._showSlotPicker(hero, s, inventoryEquipment, t, emit);
                }
            }, [
                el('div', { class: 'eq-slot-icon' }, [slotIcons[s]]),
                el('div', { class: 'eq-slot-label' }, [t('slot_' + s) || s]),
                el('div', { class: 'eq-slot-item' }, [itemName])
            ]);
        });

        const equipmentDiagramRef = el('div', { class: 'equipment-diagram' }, [
            el('div', { class: 'eq-body-silhouette' }, [
                el('div', { class: 'silhouette-head' }),
                el('div', { class: 'silhouette-torso' }),
                el('div', { class: 'silhouette-legs' })
            ]),
            ...diagramSlots
        ]);

        const setBonusesContainerRef = el('div', { class: 'set-bonuses-list' });
        if (hero.activeSetBonuses && hero.activeSetBonuses.length > 0) {
            hero.activeSetBonuses.forEach(sb => {
                const setName = t(sb.setName) || sb.setName;
                const bonusLines = Object.entries(sb.bonus).map(([stat, val]) => {
                    const sign = val > 0 ? '+' : '';
                    const label = t('ui_stats_' + stat) || stat.toUpperCase();
                    return `${sign}${val} ${label}`;
                }).join(', ');

                const setBlock = el('div', { class: 'set-bonus-block' }, [
                    el('div', { class: 'set-bonus-header' }, [
                        el('span', { class: 'set-bonus-name' }, [setName]),
                        el('span', { class: 'set-bonus-pieces' }, [`(${sb.pieces}/${sb.threshold})`])
                    ]),
                    el('div', { class: 'set-bonus-stats' }, [bonusLines])
                ]);
                setBonusesContainerRef.appendChild(setBlock);
            });
        }

        const contentElement = el('div', { style: { display: 'flex', flexDirection: 'column', height: '100%' } }, [
            el('div', { class: 'equipment-list' }, [equipmentDiagramRef]),
            setBonusesContainerRef
        ]);

        const modal = BaseModal.show({
            title: t('ui_hero_equipment_title').replace('{name}', hero.name) || `${hero.name}'s Equipment`,
            contentElement,
            icon: '🛡️',
            maxWidth: '480px'
        });
    }

    static _showSlotPicker(hero, slot, inventoryEquipment, t, emit) {
        const currentItem = hero.equipment[slot];

        const eligibleItems = inventoryEquipment.filter(item => {
            if (slot === 'leftHand' || slot === 'rightHand') {
                return item.type === 'weapon' || (item.type === 'armor' && item.slot === slot);
            } else {
                return item.type === 'armor' && item.slot === slot;
            }
        });

        const currentStats = currentItem ? getEquipmentStats(currentItem) : {};

        const formatDelta = (val, label) => {
            if (val === 0) return null;
            const color = val > 0 ? 'var(--success)' : 'var(--danger)';
            const sign = val > 0 ? '+' : '';
            return el('span', { style: { color, fontWeight: '700' } }, [`${sign}${val} ${label}`]);
        };

        let currentItemEl = null;
        if (currentItem) {
            currentItemEl = el('div', {
                style: {
                    background: 'rgba(239, 68, 68, 0.05)',
                    border: '1px dashed var(--danger)',
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '15px'
                }
            }, [
                el('div', { style: { textAlign: 'left' } }, [
                    el('div', { style: { fontSize: '0.8rem', color: 'var(--text-muted)' } }, [t('ui_equipped') || 'Equipped']),
                    el('div', { style: { fontWeight: '700', color: 'var(--danger)', marginTop: '2px' } }, [getEquipmentName(currentItem, t)])
                ]),
                el('button', {
                    class: 'btn btn-danger btn-sm',
                    style: { padding: '6px 12px', fontSize: '0.8rem' },
                    onClick: () => {
                        emit('unequipItem', { heroId: hero.id, slot });
                        modal.close();
                    }
                }, [t('ui_unequip') || 'Unequip'])
            ]);
        }

        let itemsEl;
        if (eligibleItems.length === 0) {
            itemsEl = el('div', {
                style: { textAlign: 'center', padding: '25px', color: 'var(--text-muted)', fontSize: '0.95rem' }
            }, [t('ui_no_items') || 'No items available']);
        } else {
            const listItems = eligibleItems.map(item => {
                const statsObj = getEquipmentStats(item);
                const statLines = [];
                const deltaNodes = [];

                const pushStat = (key, label) => {
                    const val = statsObj[key] || 0;
                    const cur = currentStats[key] || 0;
                    if (val || cur) {
                        statLines.push(`${val > 0 ? '+' : ''}${val} ${label}`);
                        const delta = val - cur;
                        const deltaNode = formatDelta(delta, label);
                        if (deltaNode) {
                            if (deltaNodes.length > 0) {
                                deltaNodes.push(' ');
                            }
                            deltaNodes.push(deltaNode);
                        }
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
                    const deltaNode = formatDelta(delta, '% EVA');
                    if (deltaNode) {
                        if (deltaNodes.length > 0) {
                            deltaNodes.push(' ');
                        }
                        deltaNodes.push(deltaNode);
                    }
                }

                const desc = statLines.join(', ');

                return el('div', {
                    class: 'list-item',
                    style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', marginBottom: '8px', cursor: 'default' }
                }, [
                    el('div', { style: { flex: '1', textAlign: 'left', paddingRight: '10px' } }, [
                        el('div', { style: { fontWeight: '700', color: 'var(--text-primary)' } }, [getEquipmentName(item, t)]),
                        el('div', { style: { fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' } }, [desc]),
                        deltaNodes.length > 0 ? el('div', { style: { fontSize: '0.75rem', marginTop: '2px' } }, deltaNodes) : null
                    ].filter(Boolean)),
                    el('button', {
                        class: 'btn btn-primary btn-sm btn-select-equip',
                        style: { minWidth: '70px' },
                        onClick: () => {
                            emit('equipItem', { heroId: hero.id, slot, itemId: item.id });
                            modal.close();
                        }
                    }, [t('ui_equip') || 'Equip'])
                ]);
            });

            itemsEl = el('div', {}, listItems);
        }

        const cancelBtn = el('button', {
            class: 'btn btn-secondary btn-sm',
            onClick: () => modal.close()
        }, [t('btn_cancel') || 'Cancel']);

        const contentElement = el('div', { style: { display: 'flex', flexDirection: 'column', height: '100%' } }, [
            currentItemEl,
            el('div', {
                style: {
                    fontWeight: '700',
                    fontSize: '0.85rem',
                    marginBottom: '10px',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    textAlign: 'left'
                }
            }, [t('ui_available_gear') || 'Available Gear']),
            itemsEl,
            el('div', {
                class: 'modal-actions',
                style: { borderTop: '1px solid var(--glass-border)', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end', marginTop: 'auto' }
            }, [cancelBtn])
        ].filter(Boolean));

        const title = `${t('ui_equip')} - ${t('slot_' + slot)}`;

        const modal = BaseModal.show({
            title: title,
            contentElement: contentElement,
            maxWidth: '480px'
        });
    }
}
