import { getEquipmentName, getEquipmentStats } from '../../shared/EquipmentHelper.js';
import { el, diffList } from '../../shared/utils/DOMUtils.js';

const equipSlots = ['head', 'body', 'legs', 'leftHand', 'rightHand', 'accessory'];
const slotIcons = {
    head: '🪖',
    body: '🦺',
    legs: '👢',
    leftHand: '⚔️',
    rightHand: '🛡️',
    accessory: '💍'
};

export class EquipmentView {
    constructor({ i18n, ui }) {
        this.i18n = i18n;
        this.ui = ui;
        this.overlay = null;
        this.hero = null;
        this.inventoryEquipment = [];
        this.selectedSlot = null;
        this.emit = null;
        this._lastSignature = null;
    }

    get isOpen() {
        return !!this.overlay;
    }

    t(key) {
        return this.ui ? this.ui.t(key) : (this.i18n ? this.i18n.t(key) : key);
    }

    open(options) {
        const { hero, inventoryEquipment, t, emit, initialSlot = null } = options;
        this.hero = hero;
        this.inventoryEquipment = inventoryEquipment || [];
        this.selectedSlot = initialSlot;
        this.emit = emit;
        this._lastSignature = null;

        if (this.overlay) {
            this.overlay.remove();
        }

        // Create main layout elements
        this.statsPanel = el('div', { class: 'equipment-column' });
        this.diagramPanel = el('div', { class: 'equipment-column equipment-center', style: { justifyContent: 'center', alignItems: 'center' } });
        this.selectionPanel = el('div', { class: 'equipment-column' });

        const closeBtn = el('button', {
            class: 'btn btn-secondary btn-sm',
            id: 'btn-equip-close',
            style: {
                padding: '6px 12px',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem'
            },
            onClick: () => this.close()
        }, '✕');

        this.overlay = el('div', {
            class: 'magic-circle-overlay equipment-page-overlay'
        }, [
            el('div', { class: 'magic-circle-container', style: { display: 'flex', flexDirection: 'column' } }, [
                el('div', { class: 'magic-circle-header', style: { flexShrink: '0' } }, [
                    el('div', { style: { display: 'flex', alignItems: 'center', gap: '14px' } }, [
                        el('span', { style: { fontSize: '2rem', filter: 'drop-shadow(0 0 8px var(--accent-color))' } }, '🛡️'),
                        el('div', {}, [
                            el('h2', {}, `${this.t('ui_equipment') || 'Equipment'} — ${this.hero.name}`),
                            el('div', { style: { fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' } }, 
                                this.t('ui_equipment_desc') || 'Manage equipped gear and weapons to boost battle performance.'
                            )
                        ])
                    ]),
                    closeBtn
                ]),
                el('div', { class: 'equipment-layout-grid' }, [
                    this.statsPanel,
                    this.diagramPanel,
                    this.selectionPanel
                ])
            ])
        ]);

        document.body.appendChild(this.overlay);
        this.updateUI();
    }

    close() {
        this._lastSignature = null;
        if (this.overlay) {
            this.overlay.style.opacity = '0';
            setTimeout(() => {
                if (this.overlay) {
                    this.overlay.remove();
                    this.overlay = null;
                }
            }, 300);
        }
    }

    update(options) {
        if (!this.isOpen) return;
        if (options.hero) this.hero = options.hero;
        if (options.inventoryEquipment) this.inventoryEquipment = options.inventoryEquipment;
        this.updateUI();
    }

    updateUI() {
        if (!this.isOpen) return;

        const lang = this.ui && this.ui.i18n ? this.ui.i18n.currentLang : (this.i18n ? this.i18n.currentLang : 'en');
        const signatureObj = {
            lang,
            heroId: this.hero ? this.hero.id : null,
            heroName: this.hero ? this.hero.name : '',
            heroActivity: this.hero ? this.hero.activity : '',
            stats: this.hero ? {
                maxHp: this.hero.maxHp,
                maxMp: this.hero.maxMp,
                strength: this.hero.strength,
                speed: this.hero.speed,
                defense: this.hero.defense,
                magicPower: this.hero.magicPower
            } : null,
            equipment: this.hero ? equipSlots.map(s => {
                const item = this.hero.equipment[s];
                return item ? { id: item.id, name: item.name, refine: item.refine } : null;
            }) : [],
            activeSetBonuses: this.hero && this.hero.activeSetBonuses ? this.hero.activeSetBonuses.map(sb => ({
                setName: sb.setName,
                pieces: sb.pieces,
                threshold: sb.threshold
            })) : [],
            selectedSlot: this.selectedSlot,
            inventoryCount: this.inventoryEquipment.length,
            inventorySignature: this.inventoryEquipment.map(item => ({
                id: item.id,
                refine: item.refine,
                type: item.type,
                slot: item.slot
            }))
        };

        const signature = JSON.stringify(signatureObj);
        if (this._lastSignature === signature) {
            return;
        }
        this._lastSignature = signature;

        this.renderStatsPanel();
        this.renderDiagramPanel();
        this.renderSelectionPanel();
    }

    renderStatsPanel() {
        this.statsPanel.innerHTML = '';
        
        // Header
        const statsTitle = el('h4', {
            style: {
                fontSize: '1.1rem',
                color: 'var(--text-primary)',
                margin: '0 0 16px 0',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                paddingBottom: '8px',
                fontFamily: "'Outfit', sans-serif"
            }
        }, this.t('ui_stats') || 'Stats');

        // Render standard stats
        const statLabels = {
            maxHp: 'HP',
            maxMp: 'MP',
            strength: 'STR',
            speed: 'SPD',
            defense: 'DEF',
            magicPower: 'MAG'
        };

        const equipContribution = this.calculateEquipContribution(this.hero);

        const statsList = Object.entries(statLabels).map(([key, label]) => {
            const baseVal = this.hero[key] || 0;
            const contribVal = equipContribution[key] || 0;
            
            const nodes = [el('span', { style: { fontWeight: '700', color: 'var(--text-primary)' } }, String(baseVal))];
            
            if (contribVal > 0) {
                nodes.push(el('span', {
                    style: {
                        color: '#10b981', // emerald-500
                        fontWeight: '600',
                        marginLeft: '6px',
                        fontSize: '0.85rem'
                    }
                }, `(+${contribVal})`));
            } else if (contribVal < 0) {
                nodes.push(el('span', {
                    style: {
                        color: '#ef4444', // red-500
                        fontWeight: '600',
                        marginLeft: '6px',
                        fontSize: '0.85rem'
                    }
                }, `(${contribVal})`));
            }

            return el('div', {
                style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: '1px dashed rgba(255, 255, 255, 0.05)'
                }
            }, [
                el('span', { style: { color: 'var(--text-secondary)' } }, label),
                el('div', { style: { display: 'flex', alignItems: 'center' } }, nodes)
            ]);
        });

        // Set bonuses
        const setBonusesContainer = el('div', { class: 'set-bonuses-list', style: { marginTop: '20px' } });
        if (this.hero.activeSetBonuses && this.hero.activeSetBonuses.length > 0) {
            const setHeader = el('h4', {
                style: {
                    fontSize: '0.9rem',
                    color: 'var(--text-primary)',
                    margin: '0 0 10px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    paddingBottom: '4px'
                }
            }, this.t('ui_set_bonuses') || 'Set Bonuses');
            
            setBonusesContainer.appendChild(setHeader);

            this.hero.activeSetBonuses.forEach(sb => {
                const setName = this.t(sb.setName) || sb.setName;
                const bonusLines = Object.entries(sb.bonus).map(([stat, val]) => {
                    const sign = val > 0 ? '+' : '';
                    const label = this.t('ui_stats_' + stat) || stat.toUpperCase();
                    return `${sign}${val} ${label}`;
                }).join(', ');

                const setBlock = el('div', { class: 'set-bonus-block', style: { marginBottom: '8px' } }, [
                    el('div', { class: 'set-bonus-header' }, [
                        el('span', { class: 'set-bonus-name' }, [setName]),
                        el('span', { class: 'set-bonus-pieces' }, [`(${sb.pieces}/${sb.threshold})`])
                    ]),
                    el('div', { class: 'set-bonus-stats' }, [bonusLines])
                ]);
                setBonusesContainer.appendChild(setBlock);
            });
        }

        this.statsPanel.append(statsTitle, el('div', {}, statsList), setBonusesContainer);
    }

    renderDiagramPanel() {
        this.diagramPanel.innerHTML = '';

        const diagramSlots = equipSlots.map(s => {
            const hasItem = !!this.hero.equipment[s];
            const itemName = hasItem ? getEquipmentName(this.hero.equipment[s], this.t.bind(this)) : this.t('ui_empty_slot') || 'Empty';
            const isSelected = this.selectedSlot === s;

            return el('div', {
                class: `equipment-slot-card eq-card-slot-${s} ${hasItem ? 'has-item' : ''} ${isSelected ? 'selected-slot' : ''}`,
                'data-slot': s,
                onClick: () => {
                    this.selectedSlot = s;
                    this.updateUI();
                }
            }, [
                el('div', { class: 'eq-slot-icon' }, [slotIcons[s]]),
                el('div', { class: 'eq-slot-label' }, [this.t('slot_' + s) || s]),
                el('div', { class: 'eq-slot-item' }, [itemName])
            ]);
        });

        const silhouetteContainer = el('div', { class: 'equipment-silhouette-container' }, [
            el('img', {
                class: 'equipment-silhouette-img',
                src: 'assets/heroes/body_silhouette.png',
                alt: 'Body Silhouette'
            }),
            ...diagramSlots
        ]);

        this.diagramPanel.appendChild(silhouetteContainer);
    }

    renderSelectionPanel() {
        this.selectionPanel.innerHTML = '';

        const title = el('h4', {
            style: {
                fontSize: '1.1rem',
                color: 'var(--text-primary)',
                margin: '0 0 16px 0',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                paddingBottom: '8px',
                fontFamily: "'Outfit', sans-serif"
            }
        }, this.selectedSlot ? `${this.t('ui_equip')} - ${this.t('slot_' + this.selectedSlot) || this.selectedSlot}` : this.t('ui_available_gear') || 'Available Gear');

        if (!this.selectedSlot) {
            const emptyHint = el('div', {
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: 'var(--text-muted)',
                    textAlign: 'center',
                    padding: '20px',
                    fontSize: '0.95rem'
                }
            }, [
                el('span', { style: { fontSize: '2.5rem', marginBottom: '12px' } }, '👈'),
                el('p', {}, [this.t('ui_select_slot_prompt') || 'Select an equipment slot on the body to see available gear.'])
            ]);
            this.selectionPanel.append(title, emptyHint);
            return;
        }

        const slot = this.selectedSlot;
        const currentItem = this.hero.equipment[slot];
        const isIdle = this.hero.activity === 'idle';

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
                    el('div', { style: { fontSize: '0.8rem', color: 'var(--text-muted)' } }, [this.t('ui_equipped') || 'Equipped']),
                    el('div', { style: { fontWeight: '700', color: 'var(--danger)', marginTop: '2px' } }, [getEquipmentName(currentItem, this.t.bind(this))])
                ]),
                isIdle ? el('button', {
                    class: 'btn btn-danger btn-sm',
                    style: { padding: '6px 12px', fontSize: '0.8rem' },
                    onClick: () => {
                        this.emit('unequipItem', { heroId: this.hero.id, slot });
                    }
                }, [this.t('ui_unequip') || 'Unequip']) : null
            ].filter(Boolean));
        }

        // Filter eligible inventory items
        const eligibleItems = this.inventoryEquipment.filter(item => {
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

        let itemsListEl;
        if (eligibleItems.length === 0) {
            itemsListEl = el('div', {
                style: { textAlign: 'center', padding: '25px', color: 'var(--text-muted)', fontSize: '0.95rem' }
            }, [this.t('ui_no_items') || 'No items available']);
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

                pushStat('strength', this.t('ui_stats_power') || 'STR');
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
                    style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', marginBottom: '8px', marginRight: '8px', cursor: 'default' }
                }, [
                    el('div', { style: { flex: '1', textAlign: 'left', paddingRight: '10px' } }, [
                        el('div', { style: { fontWeight: '700', color: 'var(--text-primary)' } }, [getEquipmentName(item, this.t.bind(this))]),
                        el('div', { style: { fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' } }, [desc]),
                        deltaNodes.length > 0 ? el('div', { style: { fontSize: '0.75rem', marginTop: '2px' } }, deltaNodes) : null
                    ].filter(Boolean)),
                    isIdle ? el('button', {
                        class: 'btn btn-primary btn-sm btn-select-equip',
                        style: { minWidth: '70px' },
                        onClick: () => {
                            this.emit('equipItem', { heroId: this.hero.id, slot, itemId: item.id });
                        }
                    }, [this.t('ui_equip') || 'Equip']) : null
                ].filter(Boolean));
            });

            itemsListEl = el('div', { style: { flex: '1', overflowY: 'auto', overflowX: 'hidden', paddingRight: '4px' } }, listItems);
        }

        const cancelBtn = el('button', {
            class: 'btn btn-secondary btn-sm',
            style: { width: '100%' },
            onClick: () => {
                this.selectedSlot = null;
                this.updateUI();
            }
        }, [this.t('ui_back') || 'Deselect Slot']);

        this.selectionPanel.append(...[
            title,
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
            }, [this.t('ui_available_gear') || 'Available Gear']),
            itemsListEl,
            el('div', {
                style: { marginTop: '15px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }
            }, [cancelBtn])
        ].filter(Boolean));
    }

    calculateEquipContribution(hero) {
        const traitMults = {
            maxHp: 1.0,
            maxMp: 1.0,
            strength: 1.0,
            speed: 1.0,
            defense: 1.0,
            magicPower: 1.0
        };

        switch (hero.origin) {
            case 'origin_warrior':
                traitMults.defense *= 1.10;
                traitMults.maxHp *= 1.05;
                break;
            case 'origin_thief':
                traitMults.speed *= 1.10;
                break;
            case 'origin_farmer':
                traitMults.maxHp *= 1.15;
                break;
            case 'origin_monk':
                traitMults.maxMp *= 1.15;
                break;
            case 'origin_cook':
                traitMults.maxHp *= 1.05;
                break;
            case 'origin_guard':
                traitMults.defense *= 1.15;
                break;
            case 'origin_poet':
                traitMults.maxMp *= 1.10;
                traitMults.magicPower *= 1.10;
                break;
            case 'origin_arcane_initiate':
                traitMults.magicPower *= 1.25;
                traitMults.maxMp *= 1.20;
                traitMults.strength *= 0.85;
                traitMults.defense *= 0.90;
                break;
        }

        let hasteMult = 1.0;
        if (hero.statusEffects && hero.statusEffects.some(e => e.type === 'haste')) {
            hasteMult = 1.5;
        }

        const baseHp = Math.floor(hero.baseMaxHp * traitMults.maxHp);
        const baseMp = Math.floor(hero.baseMaxMp * traitMults.maxMp);
        const baseStr = Math.floor(hero.baseStrength * traitMults.strength);
        const baseSpd = Math.floor(hero.baseSpeed * traitMults.speed * hasteMult);
        const baseDef = Math.floor(hero.baseDefense * traitMults.defense);
        const baseMag = Math.floor(hero.baseMagicPower * traitMults.magicPower);

        return {
            maxHp: (hero.maxHp || 0) - baseHp,
            maxMp: (hero.maxMp || 0) - baseMp,
            strength: (hero.strength || 0) - baseStr,
            speed: (hero.speed || 0) - baseSpd,
            defense: (hero.defense || 0) - baseDef,
            magicPower: (hero.magicPower || 0) - baseMag
        };
    }
}
