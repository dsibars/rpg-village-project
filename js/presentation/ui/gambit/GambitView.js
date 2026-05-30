import { SKILLS_DATA, TECHNIQUE_FAMILIES } from '../../../engine/shared/data/GameConstants.js';
import { BaseModal } from '../components/modal/BaseModal.js';
import { el, diffList } from '../shared/utils/DOMUtils.js';

export class GambitView {
    constructor({ i18n, ui }) {
        this.i18n = i18n;
        this.ui = ui;
        this.overlay = null;
    }

    t(key) {
        return this.ui ? this.ui.t(key) : (this.i18n ? this.i18n.t(key) : key);
    }

    static formatGambitRule(gambit, t) {
        let condText = 'Always';
        if (gambit.conditions && gambit.conditions.length > 0) {
            condText = gambit.conditions.map(c => {
                const left = c.left || c;
                if (left.type === 'always') return 'Always';
                const opMap = { '<': '<', '>': '>', '=': '=', '<=': '<=', '>=': '>=' };
                const op = opMap[left.operator] || left.operator || '';
                const val = left.value !== undefined ? left.value : '';
                return `${left.type} ${op} ${val}`;
            }).join(' AND ');
        } else if (gambit.condition) {
            condText = gambit.condition;
        }

        let actionText = '';
        if (gambit.action && typeof gambit.action === 'object') {
            actionText = gambit.action.payload || gambit.action.id || '';
        } else {
            actionText = gambit.skillId || gambit.action || '';
        }

        const targetText = gambit.target || 'Auto';
        
        const translatedCond = t(condText) || condText;
        let translatedAction = t('family_' + actionText) || t(actionText) || actionText;
        if (gambit.action && gambit.action.type === 'skill' && gambit.action.tier) {
            translatedAction += ` (Tier ${gambit.action.tier})`;
        }
        const translatedTarget = t('gambit_target_' + targetText) || targetText;

        return el('span', {}, [
            el('span', { style: { color: 'var(--text-primary)', fontWeight: '500' } }, translatedCond),
            ' → ',
            el('span', { style: { color: 'var(--accent-color)' } }, translatedAction),
            ' ON ',
            el('span', { style: { color: '#10ac84' } }, translatedTarget)
        ]);
    }

    createGambitRow(g, idx, totalCount, t, onMove, onToggle, onRemove) {
        return el('div', {
            class: ['gambit-row-v1', g.enabled === false ? 'gambit-disabled' : ''],
            'data-id': g.id,
            style: {
                display: 'flex',
                alignItems: 'center',
                padding: '10px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--glass-border)',
                borderRadius: '6px',
                marginBottom: '8px'
            }
        }, [
            el('div', { class: 'gambit-idx', style: { width: '30px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 'bold' } }, String(idx + 1)),
            el('div', { class: 'gambit-content', style: { flex: '1' } }, [
                el('div', { class: 'gambit-rule-text', style: { fontSize: '0.95rem' } }, [
                    GambitView.formatGambitRule(g, t)
                ])
            ]),
            el('div', { class: 'gambit-actions', style: { display: 'flex', gap: '6px' } }, [
                el('button', {
                    class: 'btn btn-sm btn-secondary btn-move-gambit',
                    'data-id': g.id,
                    'data-dir': '-1',
                    disabled: idx === 0,
                    onClick: (e) => {
                        e.stopPropagation();
                        onMove(g.id, -1);
                    }
                }, '▲'),
                el('button', {
                    class: 'btn btn-sm btn-secondary btn-move-gambit',
                    'data-id': g.id,
                    'data-dir': '1',
                    disabled: idx === totalCount - 1,
                    onClick: (e) => {
                        e.stopPropagation();
                        onMove(g.id, 1);
                    }
                }, '▼'),
                el('button', {
                    class: ['btn', 'btn-sm', 'btn-toggle-gambit', g.enabled === false ? 'btn-primary' : 'btn-secondary'],
                    'data-id': g.id,
                    onClick: (e) => {
                        e.stopPropagation();
                        onToggle(g.id);
                    }
                }, g.enabled === false ? t('ui_enable') : t('ui_disable')),
                el('button', {
                    class: 'btn btn-danger btn-sm btn-remove-gambit',
                    'data-id': g.id,
                    onClick: (e) => {
                        e.stopPropagation();
                        onRemove(g.id);
                    }
                }, '×')
            ])
        ]);
    }

    createEmptySlot(idx, t) {
        return el('div', {
            class: 'gambit-row-v1 empty-slot',
            'data-id': `empty-slot-${idx}`,
            style: {
                display: 'flex',
                alignItems: 'center',
                padding: '10px',
                opacity: '0.5',
                border: '1px dashed var(--glass-border)',
                borderRadius: '6px',
                marginBottom: '8px'
            }
        }, [
            el('div', { class: 'gambit-idx', style: { width: '30px', textAlign: 'center' } }, String(idx + 1)),
            el('div', { class: 'gambit-content', style: { color: 'var(--text-muted)', fontSize: '0.85rem' } }, t('ui_empty_slot') || 'Empty Slot')
        ]);
    }

    createFallbackRow(fallbackAction, learnedFamilies, t, onFallbackChange) {
        return el('div', {
            class: 'gambit-row-v1 fallback-row',
            style: {
                display: 'flex',
                alignItems: 'center',
                padding: '10px',
                background: 'rgba(255, 107, 107, 0.1)',
                border: '1px solid rgba(255, 107, 107, 0.3)',
                borderRadius: '6px',
                marginTop: '16px'
            }
        }, [
            el('div', { class: 'gambit-idx', style: { width: '30px', textAlign: 'center', color: '#ff6b6b', fontWeight: 'bold' } }, '0'),
            el('div', { class: 'gambit-content', style: { flex: '1' } }, [
                el('div', { class: 'gambit-rule-text', style: { color: '#ff6b6b', fontSize: '0.95rem' } }, [
                    el('strong', {}, t('ui_fallback') || 'FALLBACK: '),
                    (t('ui_always') || 'Always → '),
                    el('span', { id: 'fallback-display' }, t('family_' + fallbackAction) || fallbackAction)
                ])
            ]),
            el('div', { class: 'gambit-actions' }, [
                el('select', {
                    id: 'gambit-fallback-select',
                    class: 'gambit-select dark-select',
                    style: {
                        fontSize: '0.85rem',
                        padding: '6px',
                        borderRadius: '4px',
                        background: 'rgba(0,0,0,0.5)',
                        border: '1px solid var(--glass-border)',
                        color: 'var(--text-primary)',
                        outline: 'none'
                    },
                    onChange: (e) => onFallbackChange(e.target.value)
                }, [
                    ...learnedFamilies.map(f => el('option', { value: f.id, selected: fallbackAction === f.id }, t('family_' + f.id))),
                    el('option', { value: 'defend', selected: fallbackAction === 'defend' }, t('ui_defend') || 'Defend')
                ])
            ])
        ]);
    }

    open(options) {
        const {
            hero,
            inventoryEquipment,
            t,
            emit
        } = options;

        if (!hero) return;

        // Local state
        let gambits = [...(hero.gambits || [])];
        let fallbackAction = hero.fallbackAction || 'single_strike';
        const knownFamilyIds = new Set(hero.knownFamilies || ['single_strike']);
        const learnedFamilies = Object.values(TECHNIQUE_FAMILIES).filter(f => knownFamilyIds.has(f.id));
        const spellCodex = hero.spellCodex || [];

        this.currentHeroId = hero.id;
        this.refresh = (updatedHero) => {
            gambits = [...(updatedHero.gambits || [])];
            fallbackAction = updatedHero.fallbackAction || 'single_strike';
            updateUI();
        };

        const close = () => {
            this.currentHeroId = null;
            this.refresh = null;
            if (this.overlay) {
                this.overlay.style.opacity = '0';
                setTimeout(() => {
                    if (this.overlay) {
                        this.overlay.remove();
                        this.overlay = null;
                    }
                }, 300);
            }
        };

        // Static components elements setup
        const listContainer = el('div', { class: 'gambit-list-container' });
        const fallbackContainer = el('div', {});
        const countIndicator = el('span', {}, `${gambits.length} / 12`);

        // Header actions
        const presetBtn = el('button', {
            class: 'btn btn-secondary btn-sm',
            id: 'btn-gambit-preset',
            style: { marginRight: '8px' },
            onClick: () => {
                emit('suggestPreset', { heroId: hero.id });
            }
        }, [
            `💡 `,
            t('gambit_preset_btn') || 'Suggest Preset'
        ]);

        const testBtn = el('button', {
            class: 'btn btn-primary btn-sm',
            id: 'btn-gambit-test',
            style: { backgroundColor: 'var(--accent-color)' },
            onClick: () => {
                const bestiary = this.ui?.lastState?.bestiary || [];
                const enemyTemplates = this.ui?.lastState?.enemyTemplates || {};
                GambitView.showTestSetup(hero, bestiary, enemyTemplates, t, (configuredEnemies) => {
                    emit('testGambits', { heroId: hero.id, enemies: configuredEnemies });
                });
            }
        }, [
            `🧪 `,
            t('gambit_test_mode_btn') || 'Test Gambits'
        ]);

        const closeBtn = el('button', {
            class: 'btn btn-secondary btn-sm',
            id: 'btn-magic-header-close',
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
            onClick: close
        }, '✕');

        // Right panel form elements
        const conditionSelect = el('select', {
            id: 'new-gambit-condition',
            class: 'gambit-select dark-select',
            style: {
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)',
                outline: 'none'
            }
        }, [
            el('option', { value: 'ALLY_HP_LT_50' }, t('cond_ally_hp_lt_50') || 'Ally HP < 50%'),
            el('option', { value: 'ALLY_HP_LT_25' }, t('cond_ally_hp_lt_25') || 'Ally HP < 25%'),
            el('option', { value: 'SELF_HP_LT_50' }, t('cond_self_hp_lt_50') || 'Self HP < 50%'),
            el('option', { value: 'SELF_MP_LT_25' }, t('cond_self_mp_lt_25') || 'Self MP < 25%'),
            el('option', { value: 'ANY_ENEMY', selected: true }, t('cond_any_enemy') || 'Any Enemy'),
            el('option', { value: 'ENEMY_COUNT_GT_2' }, t('cond_enemies_gt_2') || 'Enemies > 2')
        ]);

        const actionSelect = el('select', {
            id: 'new-gambit-action',
            class: 'gambit-select dark-select',
            style: {
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)',
                outline: 'none'
            }
        }, [
            el('optgroup', { label: t('ui_techniques') || 'Techniques' }, 
                learnedFamilies.map(f => {
                    const skillData = SKILLS_DATA[f.id];
                    const targetType = skillData ? skillData.targetType : 'single_enemy';
                    return el('option', { value: `tech:${f.id}`, 'data-target-type': targetType }, t('family_' + f.id));
                })
            ),
            el('optgroup', { label: t('ui_spells') || 'Spells' }, 
                spellCodex.map((s, i) => el('option', { value: `spell:${i}`, 'data-target-type': s.targetType || 'single_enemy' }, s.name))
            )
        ]);

        const tierSelect = el('select', {
            id: 'new-gambit-tier',
            class: 'gambit-select dark-select',
            style: {
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)',
                outline: 'none'
            }
        });

        const tierContainer = el('div', {
            style: {
                display: 'none'
            }
        }, [
            el('label', {
                style: {
                    display: 'block',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    marginBottom: '6px',
                    fontWeight: '600',
                    letterSpacing: '0.05em'
                }
            }, t('ui_skill_tier') || 'Skill Tier'),
            tierSelect
        ]);

        const updateTierDropdown = () => {
            const actionRaw = actionSelect.value;
            const [actionType, actionId] = actionRaw.split(':');
            if (actionType === 'tech') {
                const maxTier = hero.techniqueTiers && hero.techniqueTiers[actionId] || 1;
                tierSelect.innerHTML = '';
                for (let tNum = 1; tNum <= maxTier; tNum++) {
                    const opt = el('option', { value: String(tNum) }, `${t('ui_tier') || 'Tier'} ${tNum}`);
                    tierSelect.appendChild(opt);
                }
                tierContainer.style.display = 'block';
            } else {
                tierContainer.style.display = 'none';
            }
        };

        const targetSelect = el('select', {
            id: 'new-gambit-target',
            class: 'gambit-select dark-select',
            style: {
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)',
                outline: 'none'
            }
        }, [
            el('option', { value: 'weakest_enemy' }, t('gambit_target_weakest_enemy') || 'Weakest Enemy'),
            el('option', { value: 'strongest_enemy' }, t('gambit_target_strongest_enemy') || 'Strongest Enemy'),
            el('option', { value: 'lowest_hp_enemy' }, t('gambit_target_lowest_hp_enemy') || 'Lowest HP Enemy'),
            el('option', { value: 'highest_hp_enemy' }, t('gambit_target_highest_hp_enemy') || 'Highest HP Enemy'),
            el('option', { value: 'random_enemy' }, t('gambit_target_random_enemy') || 'Random Enemy'),
            el('option', { value: 'all_enemies' }, t('gambit_target_all_enemies') || 'All Enemies'),
            el('option', { value: 'weakest_ally' }, t('gambit_target_weakest_ally') || 'Weakest Ally'),
            el('option', { value: 'strongest_ally' }, t('gambit_target_strongest_ally') || 'Strongest Ally'),
            el('option', { value: 'lowest_hp_ally' }, t('gambit_target_lowest_hp_ally') || 'Lowest HP Ally'),
            el('option', { value: 'highest_hp_ally' }, t('gambit_target_highest_hp_ally') || 'Highest HP Ally'),
            el('option', { value: 'random_ally' }, t('gambit_target_random_ally') || 'Random Ally'),
            el('option', { value: 'all_allies' }, t('gambit_target_all_allies') || 'All Allies'),
            el('option', { value: 'self' }, t('gambit_target_self') || 'Self')
        ]);

        const addBtn = el('button', {
            class: 'btn btn-primary',
            id: 'btn-add-gambit-v1',
            disabled: gambits.length >= 12,
            style: {
                marginTop: 'auto',
                padding: '12px',
                fontWeight: 'bold',
                background: 'var(--accent-gradient)',
                border: 'none',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)'
            },
            onClick: () => handleAddGambit()
        }, [
            `➕ `,
            t('ui_add_gambit') || 'Add Gambit'
        ]);

        // Action handlers
        const handleRemove = (gambitId) => {
            emit('removeGambit', { heroId: hero.id, gambitId });
            gambits = gambits.filter(g => g.id !== gambitId);
            updateUI();
        };

        const handleToggle = (gambitId) => {
            emit('toggleGambit', { heroId: hero.id, gambitId });
            const g = gambits.find(g => g.id === gambitId);
            if (g) g.enabled = g.enabled === false ? true : false;
            updateUI();
        };

        const handleMove = (gambitId, dir) => {
            emit('moveGambit', { heroId: hero.id, gambitId, direction: dir });
            const idx = gambits.findIndex(g => g.id === gambitId);
            if (idx >= 0 && idx + dir >= 0 && idx + dir < gambits.length) {
                const temp = gambits[idx];
                gambits[idx] = gambits[idx + dir];
                gambits[idx + dir] = temp;
            }
            updateUI();
        };

        const handleAddGambit = () => {
            const conditionRaw = conditionSelect.value;
            const actionRaw = actionSelect.value;
            const target = targetSelect.value;
            const tier = parseInt(tierSelect.value, 10) || 1;

            const gambit = this.ui.engine.buildGambit(conditionRaw, actionRaw, target, tier, spellCodex);
            
            emit('addGambit', { heroId: hero.id, gambit });
            gambits.push(gambit);
            updateUI();
        };

        // Target filtering logic
        const filterTargets = () => {
            const selectedOption = actionSelect.options[actionSelect.selectedIndex];
            if (!selectedOption) return;
            const innateTargetType = selectedOption.dataset.targetType || 'single_enemy';

            const allowed = this.ui.engine.getCompatibleTargets(innateTargetType);
            let firstAllowed = null;
            Array.from(targetSelect.options).forEach(opt => {
                const isAllowed = allowed.includes(opt.value);
                opt.style.display = isAllowed ? '' : 'none';
                opt.disabled = !isAllowed;
                if (isAllowed && !firstAllowed) firstAllowed = opt.value;
            });

            if (['all_enemies', 'all_allies', 'self'].includes(innateTargetType)) {
                targetSelect.value = innateTargetType === 'self' ? 'self' : innateTargetType;
                targetSelect.disabled = true;
            } else if (allowed.length === 0) {
                targetSelect.disabled = true;
            } else {
                targetSelect.disabled = false;
                if (!allowed.includes(targetSelect.value)) {
                    targetSelect.value = firstAllowed;
                }
            }
        };

        actionSelect.addEventListener('change', () => {
            filterTargets();
            updateTierDropdown();
        });

        // Dynamic update routines
        const updateRows = () => {
            const newRows = Array.from({ length: 12 }).map((_, idx) => {
                const g = gambits[idx];
                if (g) {
                    return this.createGambitRow(g, idx, gambits.length, t, handleMove, handleToggle, handleRemove);
                } else {
                    return this.createEmptySlot(idx, t);
                }
            });
            diffList(listContainer, newRows, 'data-id');
        };

        const updateFallbackRow = () => {
            fallbackContainer.innerHTML = '';
            fallbackContainer.appendChild(
                this.createFallbackRow(fallbackAction, learnedFamilies, t, (val) => {
                    fallbackAction = val;
                    emit('updateFallbackAction', { heroId: hero.id, action: fallbackAction });
                    updateUI();
                })
            );
        };

        const updateUI = () => {
            updateRows();
            updateFallbackRow();
            countIndicator.textContent = `${gambits.length} / 12`;
            addBtn.disabled = gambits.length >= 12;
        };

        // Construct the full Overlay DOM
        this.overlay = el('div', {
            class: 'magic-circle-overlay gambit-page-overlay'
        }, [
            el('div', { class: 'magic-circle-container', style: { display: 'flex', flexDirection: 'column' } }, [
                el('div', { class: 'magic-circle-header', style: { flexShrink: '0' } }, [
                    el('div', { style: { display: 'flex', alignItems: 'center', gap: '14px' } }, [
                        el('span', { style: { fontSize: '2rem', filter: 'drop-shadow(0 0 8px var(--accent-color))' } }, '🎲'),
                        el('div', {}, [
                            el('h2', {}, `${t('gambit_title') || 'Gambits'} — ${hero.name}`),
                            el('div', { style: { fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' } }, 
                                t('gambit_desc') || 'Set conditional battle behaviors. Evaluated top-to-bottom; first match wins.'
                            )
                        ])
                    ]),
                    el('div', { style: { display: 'flex', gap: '8px', alignItems: 'center' } }, [
                        presetBtn,
                        testBtn,
                        closeBtn
                    ])
                ]),
                el('div', {
                    class: 'magic-circle-grid',
                    style: {
                        flex: '1',
                        display: 'grid',
                        gridTemplateColumns: '1fr 350px',
                        gap: '20px',
                        overflow: 'hidden',
                        marginTop: '20px'
                    }
                }, [
                    // Left Column: Gambit List
                    el('div', { class: 'magic-circle-column', style: { overflowY: 'auto', paddingRight: '8px', flex: '1' } }, [
                        el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', fontSize: '0.85rem', color: 'var(--text-muted)' } }, [
                            el('span', {}, [
                                el('strong', {}, (t('ui_gambit_count') || 'Gambits') + ': '),
                                countIndicator
                            ])
                        ]),
                        listContainer,
                        fallbackContainer
                    ]),
                    // Right Column: Add Gambit
                    el('div', {
                        class: 'magic-circle-column',
                        style: {
                            background: 'rgba(0,0,0,0.2)',
                            borderRadius: '12px',
                            padding: '20px',
                            border: '1px solid var(--glass-border)'
                        }
                    }, [
                        el('h4', {
                            style: {
                                fontSize: '1.1rem',
                                color: 'var(--text-primary)',
                                margin: '0 0 16px 0',
                                borderBottom: '1px solid rgba(255,255,255,0.08)',
                                paddingBottom: '8px',
                                fontFamily: "'Outfit', sans-serif"
                            }
                        }, t('ui_add_gambit') || 'Add Gambit'),
                        el('div', { class: 'gambit-form-v1', style: { display: 'flex', flexDirection: 'column', gap: '16px' } }, [
                            el('div', {}, [
                                el('label', {
                                    style: {
                                        display: 'block',
                                        fontSize: '0.75rem',
                                        color: 'var(--text-muted)',
                                        textTransform: 'uppercase',
                                        marginBottom: '6px',
                                        fontWeight: '600',
                                        letterSpacing: '0.05em'
                                    }
                                }, t('ui_condition') || 'Condition'),
                                conditionSelect
                            ]),
                            el('div', {}, [
                                el('label', {
                                    style: {
                                        display: 'block',
                                        fontSize: '0.75rem',
                                        color: 'var(--text-muted)',
                                        textTransform: 'uppercase',
                                        marginBottom: '6px',
                                        fontWeight: '600',
                                        letterSpacing: '0.05em'
                                    }
                                }, t('ui_action') || 'Action'),
                                actionSelect
                            ]),
                            tierContainer,
                            el('div', {}, [
                                el('label', {
                                    style: {
                                        display: 'block',
                                        fontSize: '0.75rem',
                                        color: 'var(--text-muted)',
                                        textTransform: 'uppercase',
                                        marginBottom: '6px',
                                        fontWeight: '600',
                                        letterSpacing: '0.05em'
                                    }
                                }, t('ui_target') || 'Target'),
                                targetSelect
                            ]),
                            addBtn
                        ])
                    ])
                ])
            ])
        ]);

        document.body.appendChild(this.overlay);
        
        // Initial setup and filter
        filterTargets();
        updateTierDropdown();
        updateUI();
    }

    update(hero) {
        if (this.refresh && this.currentHeroId === hero.id) {
            this.refresh(hero);
        }
    }

    static showTestResults(result, healthScore, rating, t) {
        const witchDialogue = rating === 'ironclad'
            ? `"${t('gambit_witch_score_ironclad') || 'A flawless design. The threads of fate weave to your will.'}"`
            : rating === 'functional'
            ? `"${t('gambit_witch_score_functional') || 'It holds... for now. But chaos seeks the smallest crack.'}"`
            : `"${t('gambit_witch_score_fragile') || 'Brittle. The weave unravels at the slightest breeze.'}"`;
            
        const winRate = Math.floor((result.victories / result.runs) * 100);

        const contentElement = el('div', { class: 'gambit-test-dialogue' }, [
            el('div', { class: 'test-health-gauge' }, [
                el('div', { class: `health-score-circle ${rating}` }, String(healthScore)),
                el('div', { style: { flex: '1' } }, [
                    el('h4', { style: { margin: '0', color: 'var(--text-primary)', fontSize: '1.1rem' } }, [
                        (t('gambit_health_score') || 'Health Score') + ': ',
                        el('span', { style: { textTransform: 'capitalize' } }, rating)
                    ]),
                    el('div', { style: { marginTop: '4px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' } }, [
                        el('div', {}, [
                            el('strong', {}, (t('ui_win_rate') || 'Win Rate') + ': '),
                            `${winRate}% (${result.victories}/${result.runs})`
                        ]),
                        el('div', {}, [
                            el('strong', {}, (t('ui_avg_hp') || 'Avg HP') + ': '),
                            `${result.avgHpRemaining}%`
                        ]),
                        el('div', {}, [
                            el('strong', {}, (t('ui_avg_mp') || 'Avg MP') + ': '),
                            `${result.avgMpRemaining}%`
                        ])
                    ])
                ])
            ]),
            el('div', { style: { marginBottom: '16px', padding: '12px', background: 'rgba(156, 39, 176, 0.1)', borderLeft: '3px solid #9c27b0', borderRadius: '4px' } }, [
                el('span', { style: { fontSize: '1.2rem', marginRight: '8px' } }, '🌙'),
                el('span', { style: { fontStyle: 'italic', color: '#e1bee7', fontSize: '0.9rem' } }, witchDialogue)
            ]),
            el('h4', { style: { fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' } }, t('ui_combat_log') || 'Combat Log (Sample)'),
            el('div', { class: 'test-combat-log' }, 
                result.log.map(line => {
                    const isHeader = line.startsWith('---');
                    const isRule = line.includes('[Rule');
                    return el('div', { 
                        class: `test-combat-log-line${isHeader ? ' run-header' : ''}${isRule ? ' rule-match' : ''}` 
                    }, line);
                })
            ),
            el('div', { class: 'trainer-footer', style: { marginTop: '16px', justifyContent: 'flex-end', borderTop: '1px solid var(--glass-border)', paddingTop: '10px' } }, [
                el('button', { class: 'btn btn-secondary btn-sm', id: 'btn-close-test' }, t('ui_btn_close') || 'Close')
            ])
        ]);

        const modal = BaseModal.show({
            title: t('gambit_test_mode_title') || 'Gambit Simulation Results',
            contentElement: contentElement,
            icon: '🧪',
            className: 'gambit-test-overlay',
            maxWidth: '520px'
        });

        contentElement.querySelector('#btn-close-test').addEventListener('click', modal.close);
    }

    static showTestSetup(hero, bestiary, enemyTemplates, t, onStartSimulation) {
        const configuredEnemies = [];
        const maxEnemies = 6;
        const maxLevel = hero.level + 10;

        const contentElement = el('div', {
            style: {
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                height: '100%',
                maxHeight: '80vh',
                color: 'var(--text-primary)'
            }
        });

        const listContainer = el('div', {
            style: {
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                maxHeight: '220px',
                overflowY: 'auto',
                paddingRight: '4px'
            }
        });

        const bestiaryContainer = el('div', {
            style: {
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: '8px',
                maxHeight: '180px',
                overflowY: 'auto',
                padding: '8px',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '8px',
                border: '1px solid var(--glass-border)'
            }
        });

        const startBtn = el('button', {
            class: 'btn btn-primary',
            style: {
                width: '100%',
                padding: '12px',
                fontWeight: 'bold',
                background: 'var(--accent-gradient)',
                border: 'none',
                marginTop: '8px'
            },
            disabled: true,
            onClick: () => {
                modal.close();
                onStartSimulation(configuredEnemies.map(e => ({ templateId: e.templateId, level: e.level })));
            }
        }, [t('ui_start_simulation') || 'Start Simulation ⚔️']);

        const updateSelectedUI = () => {
            listContainer.innerHTML = '';
            startBtn.disabled = configuredEnemies.length === 0;

            if (configuredEnemies.length === 0) {
                listContainer.appendChild(el('div', {
                    style: {
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                        padding: '24px 0',
                        fontSize: '0.9rem',
                        border: '1px dashed var(--glass-border)',
                        borderRadius: '8px'
                    }
                }, [t('ui_no_enemies_selected') || 'No enemies selected. Add some from the catalog!']));
                return;
            }

            configuredEnemies.forEach((item, idx) => {
                const name = t(item.templateId) || enemyTemplates[item.templateId]?.name || item.templateId;

                const minusBtn = el('button', {
                    style: {
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        border: '1px solid var(--glass-border)',
                        background: 'rgba(255,255,255,0.06)',
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        transition: 'all 0.2s',
                        userSelect: 'none'
                    },
                    onMouseEnter: (e) => {
                        e.target.style.background = 'var(--accent-color)';
                        e.target.style.borderColor = 'var(--accent-color)';
                    },
                    onMouseLeave: (e) => {
                        e.target.style.background = 'rgba(255,255,255,0.06)';
                        e.target.style.borderColor = 'var(--glass-border)';
                    },
                    onClick: () => {
                        if (item.level > 1) {
                            item.level--;
                            lvlVal.textContent = item.level;
                        }
                    }
                }, '-');

                const plusBtn = el('button', {
                    style: {
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        border: '1px solid var(--glass-border)',
                        background: 'rgba(255,255,255,0.06)',
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        transition: 'all 0.2s',
                        userSelect: 'none'
                    },
                    onMouseEnter: (e) => {
                        e.target.style.background = 'var(--accent-color)';
                        e.target.style.borderColor = 'var(--accent-color)';
                    },
                    onMouseLeave: (e) => {
                        e.target.style.background = 'rgba(255,255,255,0.06)';
                        e.target.style.borderColor = 'var(--glass-border)';
                    },
                    onClick: () => {
                        if (item.level < maxLevel) {
                            item.level++;
                            lvlVal.textContent = item.level;
                        }
                    }
                }, '+');

                const lvlVal = el('span', {
                    style: {
                        minWidth: '24px',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                        color: 'var(--accent-color)'
                    }
                }, String(item.level));

                const lvlInput = el('div', {
                    style: {
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'rgba(0,0,0,0.2)',
                        padding: '2px 6px',
                        borderRadius: '16px',
                        border: '1px solid rgba(255,255,255,0.05)'
                    }
                }, [minusBtn, lvlVal, plusBtn]);

                const row = el('div', {
                    style: {
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '6px'
                    }
                }, [
                    el('div', { style: { display: 'flex', flexDirection: 'column' } }, [
                        el('span', { style: { fontWeight: '500', fontSize: '0.9rem' } }, name),
                        el('span', { style: { fontSize: '0.75rem', color: 'var(--text-muted)' } }, `${t('ui_position') || 'Position'} ${idx + 1}`)
                    ]),
                    el('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } }, [
                        el('span', { style: { fontSize: '0.8rem', color: 'var(--text-muted)' } }, t('ui_level') || 'Lvl:'),
                        lvlInput,
                        el('button', {
                            class: 'btn btn-danger btn-sm',
                            style: { padding: '4px 8px', fontSize: '0.8rem' },
                            onClick: () => {
                                configuredEnemies.splice(idx, 1);
                                updateSelectedUI();
                            }
                        }, '✕')
                    ])
                ]);
                listContainer.appendChild(row);
            });
        };

        // Populate available bestiary
        const availableEnemyIds = bestiary.length > 0 ? bestiary : ['slime_green'];
        availableEnemyIds.forEach(eid => {
            const name = t(eid) || enemyTemplates[eid]?.name || eid;
            const template = enemyTemplates[eid] || { element: 'neutral' };
            const elemIcon = template.element === 'fire' ? '🔥' : template.element === 'water' ? '💧' : template.element === 'storm' ? '⚡' : '🍃';

            const card = el('div', {
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '8px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '6px',
                    textAlign: 'center',
                    cursor: 'pointer'
                },
                onClick: () => {
                    if (configuredEnemies.length >= maxEnemies) {
                        return;
                    }
                    configuredEnemies.push({
                        id: 'enemy_' + Date.now() + '_' + Math.random(),
                        templateId: eid,
                        level: hero.level
                    });
                    updateSelectedUI();
                }
            }, [
                el('span', { style: { fontSize: '1.2rem', marginBottom: '4px' } }, elemIcon),
                el('span', { style: { fontSize: '0.8rem', fontWeight: '500', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' } }, name),
                el('span', { style: { fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' } }, `+ Add`)
            ]);

            bestiaryContainer.appendChild(card);
        });

        contentElement.appendChild(el('div', {}, [
            el('h4', { style: { fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' } }, [
                t('ui_selected_enemies') || 'Encounter Party',
                el('span', { style: { float: 'right', fontSize: '0.8rem', color: 'var(--accent-color)' } }, `Limit: ${maxEnemies}`)
            ]),
            listContainer
        ]));

        contentElement.appendChild(el('div', {}, [
            el('h4', { style: { fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' } }, t('ui_discovered_bestiary') || 'Bestiary Catalog'),
            bestiaryContainer
        ]));

        contentElement.appendChild(startBtn);

        updateSelectedUI();

        const modal = BaseModal.show({
            title: t('ui_gambit_test_setup_title') || 'Gambit Simulation Setup',
            contentElement,
            icon: '⚔️',
            maxWidth: '480px'
        });
    }
}
