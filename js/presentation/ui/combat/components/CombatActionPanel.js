import { el } from '../../shared/utils/DOMUtils.js';
import { CombatResolutionPane } from './CombatResolutionPane.js';

/**
 * CombatActionPanel - Coordinates turn display, action menus, and the end-of-battle resolution pane.
 */
export class CombatActionPanel {
    constructor({ t, onMenuChange, onActionSelect, onResolve }) {
        this.t = t;
        this.onMenuChange = onMenuChange;
        this.onActionSelect = onActionSelect;
        
        this.resolutionPane = new CombatResolutionPane({
            t: this.t,
            onResolve
        });

        this.turnBanner = el('div', { class: 'combat-current-turn-banner' }, ['...']);
        this.controlPanel = el('div', { class: 'combat-control-panel', id: 'combat-control-panel' });
        this.root = el('div', { class: 'combat-action-column' }, [
            this.turnBanner,
            this.controlPanel
        ]);
    }

    update({ battle, engine, state, menuState, selectedAction, selectedFamily }) {
        const activeActor = battle.turnOrder[battle.currentTurnIndex];
        // enemy/bestiary domain key — not yet migrated
        const activeActorName = activeActor ? (this.t(activeActor.name)) : '...';
        const expectedBannerText = activeActor ? this.t('shared_uxelm_turn').replace('{name}', activeActorName) : '...';

        if (this.turnBanner.textContent !== expectedBannerText) {
            this.turnBanner.textContent = expectedBannerText;
        }

        this.controlPanel.innerHTML = '';

        if (battle.isOver) {
            this.resolutionPane.update(battle, engine);
            this.controlPanel.appendChild(this.resolutionPane.root);
            return;
        }

        const isHeroTurn = activeActor && activeActor.type === 'Hero';
        if (!isHeroTurn || battle.autoBattle) {
            const msg = battle.autoBattle 
                ? this.t('shared_uxelm_auto_combat_running') 
                : this.t('shared_uxelm_enemy_planning');
            this.controlPanel.replaceChildren(el('div', { class: 'combat-control-message' }, [msg]));
            return;
        }

        const currentHero = battle.heroes.find(h => h.id === activeActor.id);
        if (!currentHero) return;

        if (menuState === 'main') {
            const knownFamilies = currentHero.knownFamilies || ['single_strike'];
            const hasSkills = knownFamilies.length > 1;
            const codex = currentHero.spellCodex || [];
            const canCastSpells = codex.some((s, idx) => engine.canCastSpell(currentHero, s));

            const attackBtn = el('button', {
                id: 'btn-action-attack',
                class: 'btn btn-secondary',
                style: 'flex:1 1 120px;',
                onClick: () => {
                    this.onMenuChange('targeting', {
                        type: 'attack',
                        id: 'single_strike',
                        name: this.t('heroes_info_family_single_strike')
                    });
                }
            }, [`⚔️ ${this.t('heroes_info_family_single_strike')}`]);

            const skillsBtn = el('button', {
                id: 'btn-action-skills',
                class: 'btn btn-secondary',
                style: 'flex:1 1 120px;',
                disabled: !hasSkills,
                onClick: () => this.onMenuChange('skills')
            }, [`✨ ${this.t('shared_uxelm_skills')}`]);

            const magicBtn = el('button', {
                id: 'btn-action-magic',
                class: 'btn btn-secondary',
                style: 'flex:1 1 120px;',
                disabled: !canCastSpells,
                onClick: () => this.onMenuChange('magic')
            }, [`🔮 ${this.t('shared_uxelm_magic')}`]);

            const itemsBtn = el('button', {
                id: 'btn-action-items',
                class: 'btn btn-secondary',
                style: 'flex:1 1 120px;',
                disabled: battle.itemUsedThisTurn,
                onClick: () => this.onMenuChange('items')
            }, [
                `🎒 ${this.t('combat_uxelm_items')} `,
                battle.itemUsedThisTurn ? `(${this.t('shared_uxelm_once_per_turn')})` : ''
            ]);

            this.controlPanel.appendChild(
                el('div', { class: 'combat-control-buttons' }, [
                    attackBtn,
                    skillsBtn,
                    magicBtn,
                    itemsBtn
                ])
            );
        } else if (menuState === 'skills') {
            const knownFamilies = (currentHero.knownFamilies || []).filter(f => f !== 'single_strike');

            const familyButtons = knownFamilies.map(familyId => {
                const tier = currentHero.techniqueTiers && currentHero.techniqueTiers[familyId] || 1;
                const canAfford = engine.canAffordSkill(currentHero, familyId, tier);
                const { staCost, mpCost } = engine.getSkillCost(currentHero, familyId, tier);
                const familyName = this.t('heroes_info_family_' + familyId);
                const mpLabel = mpCost > 0 ? ` + ${mpCost} MP` : '';

                return el('button', {
                    class: 'btn btn-secondary',
                    style: 'flex:1 1 140px;',
                    disabled: !canAfford,
                    onClick: () => {
                        this.onMenuChange('family_tiers', null, familyId);
                    }
                }, [`${familyName} `, el('span', { style: 'font-size:0.8rem;opacity:0.8;' }, [`(Tier ${tier} · ${staCost} STA${mpLabel})`])]);
            }).filter(Boolean);

            const backBtn = el('button', {
                id: 'btn-skill-back',
                class: 'btn btn-secondary btn-sm',
                onClick: () => this.onMenuChange('main')
            }, [`◀ ${this.t('shared_uxelm_back')}`]);

            this.controlPanel.appendChild(
                el('div', {}, [
                    el('div', { class: 'combat-control-back' }, [backBtn]),
                    el('div', { class: 'combat-control-buttons' }, familyButtons.length > 0 ? familyButtons : [
                        el('div', { style: 'color:var(--text-muted);' }, [this.t('shared_uxelm_technique_none')])
                    ])
                ])
            );
        } else if (menuState === 'family_tiers') {
            const familyId = selectedFamily;
            const maxTier = currentHero.techniqueTiers && currentHero.techniqueTiers[familyId] || 1;
            const familyName = this.t('heroes_info_family_' + familyId);

            const tierButtons = [];
            for (let t = maxTier; t >= 1; t--) {
                const canAfford = engine.canAffordSkill(currentHero, familyId, t);
                const { staCost, mpCost } = engine.getSkillCost(currentHero, familyId, t);
                const label = t === maxTier ? '⚡ ' : t === 1 ? '💧 ' : '';
                const mpLabel = mpCost > 0 ? ` + ${mpCost} MP` : '';

                tierButtons.push(
                    el('button', {
                        class: 'btn btn-secondary',
                        style: 'flex:1 1 100px;',
                        disabled: !canAfford,
                        onClick: () => {
                            this.onMenuChange('targeting', {
                                type: 'skill',
                                id: familyId,
                                name: this.t('heroes_info_family_' + familyId),
                                tier: t
                            });
                        }
                    }, [`${label}Tier ${t} `, el('span', { style: 'font-size:0.8rem;opacity:0.8;' }, [`(${staCost} STA${mpLabel})`])])
                );
            }

            const backBtn = el('button', {
                id: 'btn-tier-back',
                class: 'btn btn-secondary btn-sm',
                onClick: () => this.onMenuChange('skills')
            }, [`◀ ${this.t('shared_uxelm_back')}`]);

            this.controlPanel.appendChild(
                el('div', {}, [
                    el('div', { class: 'combat-control-back' }, [backBtn]),
                    el('div', { class: 'combat-control-message', style: 'font-weight:700;' }, [familyName]),
                    el('div', { class: 'combat-control-buttons' }, tierButtons)
                ])
            );
        } else if (menuState === 'magic') {
            const codex = currentHero.spellCodex || [];
            const spellButtons = codex.map((spell, idx) => {
                const canCast = this._canCastSpell(currentHero, spell);
                const elementIcon = { fire: '🔥', water: '💧', wind: '🌪️', storm: '⚡', light: '✨', dark: '🌑', earth: '🪨' }[spell.element] || '🔮';

                return el('button', {
                    class: 'btn btn-secondary',
                    style: 'flex:1 1 140px;',
                    disabled: !canCast,
                    onClick: () => {
                        this.onMenuChange('targeting', {
                            type: 'spell',
                            index: idx,
                            name: spell.name
                        });
                    }
                }, [`${elementIcon} ${spell.name} `, el('span', { style: 'font-size:0.8rem;opacity:0.8;' }, [`(${spell.mpCost} MP)`])]);
            });

            const backBtn = el('button', {
                id: 'btn-magic-back',
                class: 'btn btn-secondary btn-sm',
                onClick: () => this.onMenuChange('main')
            }, [`◀ ${this.t('shared_uxelm_back')}`]);

            this.controlPanel.appendChild(
                el('div', {}, [
                    el('div', { class: 'combat-control-back' }, [backBtn]),
                    el('div', { class: 'combat-control-buttons' }, spellButtons.length > 0 ? spellButtons : [
                        el('div', { style: 'color:var(--text-muted);' }, [this.t('shared_uxelm_spell_none')])
                    ])
                ])
            );
        } else if (menuState === 'items') {
            const inventory = state.inventory || {};
            const consumables = inventory.consumables || {};

            const itemsButtons = Object.keys(consumables)
                .filter(itemId => consumables[itemId] > 0)
                .map(itemId => {
                    // inventory domain key — not yet migrated
                    const itemName = this.t(itemId);
                    return el('button', {
                        class: 'btn btn-secondary',
                        style: 'flex:1 1 140px;',
                        onClick: () => {
                            this.onMenuChange('targeting', {
                                type: 'item',
                                id: itemId,
                                name: itemName
                            });
                        }
                    }, [`${itemName} x${consumables[itemId]}`]);
                });

            const backBtn = el('button', {
                id: 'btn-item-back',
                class: 'btn btn-secondary btn-sm',
                onClick: () => this.onMenuChange('main')
            }, [`◀ ${this.t('shared_uxelm_back')}`]);

            this.controlPanel.appendChild(
                el('div', {}, [
                    el('div', { class: 'combat-control-back' }, [backBtn]),
                    el('div', { class: 'combat-control-buttons' }, itemsButtons.length > 0 ? itemsButtons : [
                        el('div', { style: 'color:var(--text-muted);' }, [this.t('shared_uxelm_consumable_none')])
                    ])
                ])
            );
        } else if (menuState === 'targeting') {
            const backBtn = el('button', {
                id: 'btn-target-back',
                class: 'btn btn-secondary btn-sm',
                onClick: () => {
                    if (selectedAction && selectedAction.type === 'skill') {
                        this.onMenuChange(selectedAction.tier !== undefined ? 'family_tiers' : 'skills', null, selectedAction.id);
                    } else if (selectedAction && selectedAction.type === 'spell') {
                        this.onMenuChange('magic');
                    } else if (selectedAction && selectedAction.type === 'item') {
                        this.onMenuChange('items');
                    } else {
                        this.onMenuChange('main');
                    }
                }
            }, [`◀ ${this.t('shared_uxelm_back')}`]);

            this.controlPanel.appendChild(
                el('div', {}, [
                    el('div', { class: 'combat-control-back' }, [backBtn]),
                    el('div', {
                        class: 'combat-control-message',
                        style: 'color:var(--success);font-weight:700;'
                    }, [`${this.t('shared_uxelm_choose_target')} — ${selectedAction ? selectedAction.name : ''}`])
                ])
            );
        }
    }


}
