import { SKILLS_DATA, TECHNIQUE_FAMILIES } from '../../../engine/shared/data/GameConstants.js';
import { BaseModal } from '../components/modal/BaseModal.js';

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
        const translatedAction = t('family_' + actionText) || t(actionText) || actionText;
        const translatedTarget = t('gambit_target_' + targetText) || targetText;

        return `<span style="color:var(--text-primary); font-weight: 500;">${translatedCond}</span> → <span style="color:var(--accent-color);">${translatedAction}</span> ON <span style="color:#10ac84;">${translatedTarget}</span>`;
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

        this.overlay = document.createElement('div');
        this.overlay.className = 'magic-circle-overlay gambit-page-overlay';

        const close = () => {
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

        const render = () => {
            const listHtml = Array.from({length: 12}).map((_, idx) => {
                const g = gambits[idx];
                if (g) {
                    return `
                    <div class="gambit-row-v1 ${g.enabled === false ? 'gambit-disabled' : ''}" data-id="${g.id}" style="display: flex; align-items: center; padding: 10px; background: rgba(0,0,0,0.3); border: 1px solid var(--glass-border); border-radius: 6px; margin-bottom: 8px;">
                        <div class="gambit-idx" style="width: 30px; text-align: center; color: var(--text-muted); font-weight: bold;">${idx + 1}</div>
                        <div class="gambit-content" style="flex: 1;">
                            <div class="gambit-rule-text" style="font-size: 0.95rem;">${GambitView.formatGambitRule(g, t)}</div>
                        </div>
                        <div class="gambit-actions" style="display: flex; gap: 6px;">
                            <button class="btn btn-sm btn-secondary btn-move-gambit" data-id="${g.id}" data-dir="-1" ${idx === 0 ? 'disabled' : ''}>▲</button>
                            <button class="btn btn-sm btn-secondary btn-move-gambit" data-id="${g.id}" data-dir="1" ${idx === gambits.length - 1 ? 'disabled' : ''}>▼</button>
                            <button class="btn btn-sm btn-toggle-gambit ${g.enabled === false ? 'btn-primary' : 'btn-secondary'}" data-id="${g.id}">${g.enabled === false ? 'Enable' : 'Disable'}</button>
                            <button class="btn btn-danger btn-sm btn-remove-gambit" data-id="${g.id}">×</button>
                        </div>
                    </div>`;
                } else {
                    return `
                    <div class="gambit-row-v1 empty-slot" style="display: flex; align-items: center; padding: 10px; opacity: 0.5; border: 1px dashed var(--glass-border); border-radius: 6px; margin-bottom: 8px;">
                        <div class="gambit-idx" style="width: 30px; text-align: center;">${idx + 1}</div>
                        <div class="gambit-content" style="color: var(--text-muted); font-size: 0.85rem;">${t('ui_empty_slot') || 'Empty Slot'}</div>
                    </div>`;
                }
            }).join('');

            this.overlay.innerHTML = `
                <div class="magic-circle-container" style="display: flex; flex-direction: column;">
                    <div class="magic-circle-header" style="flex-shrink: 0;">
                        <div style="display: flex; align-items: center; gap: 14px;">
                            <span style="font-size: 2rem; filter: drop-shadow(0 0 8px var(--accent-color));">🎲</span>
                            <div>
                                <h2>${t('gambit_title') || 'Gambits'} — ${hero.name}</h2>
                                <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 2px;">
                                    ${t('gambit_desc') || 'Set conditional battle behaviors. Evaluated top-to-bottom; first match wins.'}
                                </div>
                            </div>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button class="btn btn-primary btn-sm" id="btn-gambit-test" style="background-color: var(--accent-color);">
                                🧪 ${t('gambit_test_mode_btn') || 'Test Gambits'}
                            </button>
                            <button class="btn btn-secondary btn-sm" id="btn-magic-header-close" style="padding: 6px 12px; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 0.8rem;">✕</button>
                        </div>
                    </div>

                    <div class="magic-circle-grid" style="flex: 1; display: grid; grid-template-columns: 1fr 350px; gap: 20px; overflow: hidden; margin-top: 20px;">
                        <!-- Left: Gambit List -->
                        <div class="magic-circle-column" style="overflow-y: auto; padding-right: 8px; flex: 1;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 0.85rem; color: var(--text-muted);">
                                <strong>${t('ui_gambit_count') || 'Gambits'}:</strong> ${gambits.length} / 12
                                <button class="btn btn-secondary btn-sm" id="btn-gambit-preset">📋 ${t('gambit_preset_btn') || 'Suggest Preset'}</button>
                            </div>
                            
                            <div class="gambit-list-container">
                                ${listHtml}
                                
                                <div class="gambit-row-v1 fallback-row" style="display: flex; align-items: center; padding: 10px; background: rgba(255, 107, 107, 0.1); border: 1px solid rgba(255, 107, 107, 0.3); border-radius: 6px; margin-top: 16px;">
                                    <div class="gambit-idx" style="width: 30px; text-align: center; color: #ff6b6b; font-weight: bold;">0</div>
                                    <div class="gambit-content" style="flex: 1;">
                                        <div class="gambit-rule-text" style="color: #ff6b6b; font-size: 0.95rem;">
                                            <strong>FALLBACK:</strong> Always → <span id="fallback-display">${t('family_' + fallbackAction) || fallbackAction}</span>
                                        </div>
                                    </div>
                                    <div class="gambit-actions">
                                        <select id="gambit-fallback-select" class="gambit-select dark-select" style="font-size: 0.85rem; padding: 6px; border-radius: 4px; background: rgba(0,0,0,0.5); border: 1px solid var(--glass-border); color: var(--text-primary); outline: none;">
                                            ${learnedFamilies.map(f => `<option value="${f.id}" ${fallbackAction === f.id ? 'selected' : ''}>${t('family_' + f.id)}</option>`).join('')}
                                            <option value="defend" ${fallbackAction === 'defend' ? 'selected' : ''}>Defend</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Right: Add Gambit -->
                        <div class="magic-circle-column" style="background: rgba(0,0,0,0.2); border-radius: 12px; padding: 20px; border: 1px solid var(--glass-border);">
                            <h4 style="font-size: 1.1rem; color: var(--text-primary); margin: 0 0 16px 0; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px; font-family: 'Outfit', sans-serif;">
                                ${t('ui_add_gambit') || 'Add Gambit'}
                            </h4>
                            
                            <div class="gambit-form-v1" style="display: flex; flex-direction: column; gap: 16px;">
                                <div>
                                    <label style="display: block; font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 6px; font-weight: 600; letter-spacing: 0.05em;">Condition</label>
                                    <select id="new-gambit-condition" class="gambit-select dark-select" style="width: 100%; padding: 10px; border-radius: 6px; background: rgba(0,0,0,0.5); border: 1px solid var(--glass-border); color: var(--text-primary); outline: none;">
                                        <option value="ALLY_HP_LT_50">Ally HP < 50%</option>
                                        <option value="ALLY_HP_LT_25">Ally HP < 25%</option>
                                        <option value="SELF_HP_LT_50">Self HP < 50%</option>
                                        <option value="SELF_MP_LT_25">Self MP < 25%</option>
                                        <option value="ANY_ENEMY" selected>Any Enemy</option>
                                        <option value="ENEMY_COUNT_GT_2">Enemies > 2</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label style="display: block; font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 6px; font-weight: 600; letter-spacing: 0.05em;">Action</label>
                                    <select id="new-gambit-action" class="gambit-select dark-select" style="width: 100%; padding: 10px; border-radius: 6px; background: rgba(0,0,0,0.5); border: 1px solid var(--glass-border); color: var(--text-primary); outline: none;">
                                        <optgroup label="Techniques">
                                            ${learnedFamilies.map(f => {
                                                const skillData = SKILLS_DATA[f.id];
                                                const targetType = skillData ? skillData.targetType : 'single_enemy';
                                                return `<option value="tech:${f.id}" data-target-type="${targetType}">${t('family_' + f.id)}</option>`;
                                            }).join('')}
                                        </optgroup>
                                        <optgroup label="Spells">
                                            ${spellCodex.map((s, i) => `<option value="spell:${i}" data-target-type="${s.targetType || 'single_enemy'}">${s.name}</option>`).join('')}
                                        </optgroup>
                                    </select>
                                </div>
                                
                                <div>
                                    <label style="display: block; font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 6px; font-weight: 600; letter-spacing: 0.05em;">Target</label>
                                    <select id="new-gambit-target" class="gambit-select dark-select" style="width: 100%; padding: 10px; border-radius: 6px; background: rgba(0,0,0,0.5); border: 1px solid var(--glass-border); color: var(--text-primary); outline: none;">
                                        <option value="weakest_enemy">${t('gambit_target_weakest_enemy') || 'Weakest Enemy'}</option>
                                        <option value="strongest_enemy">${t('gambit_target_strongest_enemy') || 'Strongest Enemy'}</option>
                                        <option value="lowest_hp_enemy">${t('gambit_target_lowest_hp_enemy') || 'Lowest HP Enemy'}</option>
                                        <option value="highest_hp_enemy">${t('gambit_target_highest_hp_enemy') || 'Highest HP Enemy'}</option>
                                        <option value="random_enemy">${t('gambit_target_random_enemy') || 'Random Enemy'}</option>
                                        <option value="all_enemies">${t('gambit_target_all_enemies') || 'All Enemies'}</option>
                                        <option value="weakest_ally">${t('gambit_target_weakest_ally') || 'Weakest Ally'}</option>
                                        <option value="strongest_ally">${t('gambit_target_strongest_ally') || 'Strongest Ally'}</option>
                                        <option value="lowest_hp_ally">${t('gambit_target_lowest_hp_ally') || 'Lowest HP Ally'}</option>
                                        <option value="highest_hp_ally">${t('gambit_target_highest_hp_ally') || 'Highest HP Ally'}</option>
                                        <option value="random_ally">${t('gambit_target_random_ally') || 'Random Ally'}</option>
                                        <option value="all_allies">${t('gambit_target_all_allies') || 'All Allies'}</option>
                                        <option value="self">${t('gambit_target_self') || 'Self'}</option>
                                    </select>
                                </div>
                                
                                <button class="btn btn-primary" id="btn-add-gambit-v1" ${gambits.length >= 12 ? 'disabled' : ''} style="margin-top: auto; padding: 12px; font-weight: bold; background: var(--accent-gradient); border: none; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);">
                                    ➕ ${t('ui_add_gambit') || 'Add Gambit'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Event bindings
            this.overlay.querySelector('#btn-magic-header-close').addEventListener('click', close);

            const testBtn = this.overlay.querySelector('#btn-gambit-test');
            if (testBtn) {
                testBtn.addEventListener('click', () => {
                    emit('testGambits', { heroId: hero.id });
                });
            }

            const presetBtn = this.overlay.querySelector('#btn-gambit-preset');
            if (presetBtn) {
                presetBtn.addEventListener('click', () => {
                    emit('suggestPreset', { heroId: hero.id });
                    close(); // Close view so preset updates can propagate correctly
                });
            }

            const fallbackSelect = this.overlay.querySelector('#gambit-fallback-select');
            if (fallbackSelect) {
                fallbackSelect.addEventListener('change', (e) => {
                    fallbackAction = e.target.value;
                    emit('updateFallbackAction', { heroId: hero.id, action: fallbackAction });
                    render(); // Re-render to show updated text
                });
            }

            // Gambit row buttons
            this.overlay.querySelectorAll('.btn-remove-gambit').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const gambitId = e.target.dataset.id;
                    emit('removeGambit', { heroId: hero.id, gambitId });
                    gambits = gambits.filter(g => g.id !== gambitId);
                    render(); // Local update to avoid full view rebuild
                });
            });

            this.overlay.querySelectorAll('.btn-toggle-gambit').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const gambitId = e.target.dataset.id;
                    emit('toggleGambit', { heroId: hero.id, gambitId });
                    const g = gambits.find(g => g.id === gambitId);
                    if (g) g.enabled = g.enabled === false ? true : false;
                    render();
                });
            });

            this.overlay.querySelectorAll('.btn-move-gambit').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const gambitId = e.target.dataset.id;
                    const dir = parseInt(e.target.dataset.dir);
                    emit('moveGambit', { heroId: hero.id, gambitId, direction: dir });
                    
                    const idx = gambits.findIndex(g => g.id === gambitId);
                    if (idx >= 0 && idx + dir >= 0 && idx + dir < gambits.length) {
                        const temp = gambits[idx];
                        gambits[idx] = gambits[idx + dir];
                        gambits[idx + dir] = temp;
                    }
                    render();
                });
            });

            // Target filtering logic
            const actionSelect = this.overlay.querySelector('#new-gambit-action');
            const targetSelect = this.overlay.querySelector('#new-gambit-target');

            const _filterTargets = () => {
                const selectedOption = actionSelect.options[actionSelect.selectedIndex];
                if (!selectedOption) return;
                const innateTargetType = selectedOption.dataset.targetType || 'single_enemy';

                const compatibility = {
                    'single_enemy': ['weakest_enemy', 'strongest_enemy', 'lowest_hp_enemy', 'highest_hp_enemy', 'random_enemy'],
                    'enemy_splash': ['weakest_enemy', 'strongest_enemy', 'lowest_hp_enemy', 'highest_hp_enemy', 'random_enemy'],
                    'all_enemies': ['all_enemies'],
                    'single_ally': ['weakest_ally', 'strongest_ally', 'lowest_hp_ally', 'highest_hp_ally', 'random_ally', 'self'],
                    'all_allies': ['all_allies'],
                    'self': ['self'],
                    'none': []
                };

                const allowed = compatibility[innateTargetType] || [];
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

            if (actionSelect) {
                actionSelect.addEventListener('change', _filterTargets);
                _filterTargets();
            }

            const addBtn = this.overlay.querySelector('#btn-add-gambit-v1');
            if (addBtn) {
                addBtn.addEventListener('click', () => {
                    const conditionRaw = this.overlay.querySelector('#new-gambit-condition').value;
                    const actionRaw = this.overlay.querySelector('#new-gambit-action').value;
                    const target = this.overlay.querySelector('#new-gambit-target').value;
                    const [actionType, actionId] = actionRaw.split(':');

                    const conditionMap = {
                        'ALLY_HP_LT_50': { type: 'ally_hp', operator: '<', value: 0.5 },
                        'ALLY_HP_LT_25': { type: 'ally_hp', operator: '<', value: 0.25 },
                        'SELF_HP_LT_50': { type: 'self_hp', operator: '<', value: 0.5 },
                        'SELF_MP_LT_25': { type: 'self_mp', operator: '<', value: 0.25 },
                        'ANY_ENEMY': { type: 'always', value: true },
                        'ENEMY_COUNT_GT_2': { type: 'enemy_count', operator: '>', value: 2 }
                    };
                    const condition = conditionMap[conditionRaw] || { type: 'always', value: true };

                    let payload = actionId;
                    if (actionType === 'spell') {
                        const spellIdx = parseInt(actionId, 10);
                        const spell = spellCodex[spellIdx];
                        payload = spell ? spell.name : actionId;
                    }

                    const gambit = {
                        id: 'gambit_v1_' + Date.now(),
                        conditions: [{ op: 'SINGLE', left: condition, right: null }],
                        action: { type: actionType === 'tech' ? 'skill' : actionType, payload: payload },
                        target: target,
                        enabled: true
                    };
                    
                    emit('addGambit', { heroId: hero.id, gambit });
                    gambits.push(gambit);
                    render(); // Re-render local state so the view STAYS open
                });
            }
        };

        document.body.appendChild(this.overlay);
        render();
    }

    static showTestResults(result, healthScore, rating, t) {
        let witchDialogue = '';
        if (rating === 'ironclad') {
            witchDialogue = `"${t('gambit_witch_score_ironclad') || 'A flawless design. The threads of fate weave to your will.'}"`;
        } else if (rating === 'functional') {
            witchDialogue = `"${t('gambit_witch_score_functional') || 'It holds... for now. But chaos seeks the smallest crack.'}"`;
        } else {
            witchDialogue = `"${t('gambit_witch_score_fragile') || 'Brittle. The weave unravels at the slightest breeze.'}"`;
        }
        
        const winRate = Math.floor((result.victories / result.runs) * 100);

        const contentHtml = `
            <div class="gambit-test-dialogue">
                <div class="test-health-gauge">
                    <div class="health-score-circle ${rating}">${healthScore}</div>
                    <div style="flex: 1;">
                        <h4 style="margin: 0; color: var(--text-primary); font-size: 1.1rem;">${t('gambit_health_score') || 'Health Score'}: <span style="text-transform: capitalize;">${rating}</span></h4>
                        <div style="margin-top: 4px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.85rem; color: var(--text-muted);">
                            <div><strong>${t('ui_win_rate') || 'Win Rate'}:</strong> ${winRate}% (${result.victories}/${result.runs})</div>
                            <div><strong>${t('ui_avg_hp') || 'Avg HP'}:</strong> ${result.avgHpRemaining}%</div>
                            <div><strong>${t('ui_avg_mp') || 'Avg MP'}:</strong> ${result.avgMpRemaining}%</div>
                        </div>
                    </div>
                </div>
                
                <div style="margin-bottom: 16px; padding: 12px; background: rgba(156, 39, 176, 0.1); border-left: 3px solid #9c27b0; border-radius: 4px;">
                    <span style="font-size: 1.2rem; margin-right: 8px;">🌙</span>
                    <span style="font-style: italic; color: #e1bee7; font-size: 0.9rem;">${witchDialogue}</span>
                </div>
                
                <h4 style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 8px;">${t('ui_combat_log') || 'Combat Log (Sample)'}</h4>
                <div class="test-combat-log">
                    ${result.log.map(line => {
                        if (line.startsWith('---')) return `<div class="test-combat-log-line run-header">${line}</div>`;
                        if (line.includes('[Rule')) return `<div class="test-combat-log-line rule-match">${line}</div>`;
                        return `<div class="test-combat-log-line">${line}</div>`;
                    }).join('')}
                </div>
                
                <div class="trainer-footer" style="margin-top: 16px; justify-content: flex-end; border-top: 1px solid var(--glass-border); padding-top: 10px;">
                    <button class="btn btn-secondary btn-sm" id="btn-close-test">${t('ui_btn_close') || 'Close'}</button>
                </div>
            </div>
        `;

        const modal = BaseModal.show({
            title: t('gambit_test_mode_title') || 'Gambit Simulation Results',
            contentHtml: contentHtml,
            icon: '🧪',
            className: 'gambit-test-overlay',
            maxWidth: '520px'
        });

        modal.overlay.querySelector('#btn-close-test').addEventListener('click', modal.close);
    }
}
