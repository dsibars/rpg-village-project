import { BaseModal } from '../../components/modal/BaseModal.js';
import { SKILLS_DATA, TECHNIQUE_FAMILIES } from '../../../../engine/shared/data/GameConstants.js';

export class HeroGambitModal {
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

    static show(hero, inventoryEquipment, t, emit) {
        if (!hero) return;

        const gambits = hero.gambits || [];
        const fallbackAction = hero.fallbackAction || 'single_strike';
        const knownFamilyIds = new Set(hero.knownFamilies || ['single_strike']);
        const learnedFamilies = Object.values(TECHNIQUE_FAMILIES).filter(f => knownFamilyIds.has(f.id));
        const spellCodex = hero.spellCodex || [];

        const contentHtml = `
            <div class="trainer-dialogue-box gambit-dialogue-box" style="display: flex; flex-direction: column; height: 75vh;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0;">
                        ${t('gambit_desc') || 'Set conditional battle behaviors. Evaluated top-to-bottom; first match wins.'}
                    </p>
                    <button class="btn btn-primary btn-sm" id="btn-gambit-test" style="background-color: var(--accent-color);">
                        🧪 ${t('gambit_test_mode_btn') || 'Test Gambits'}
                    </button>
                </div>
                
                <div style="display: flex; gap: 8px; margin-bottom: 12px; font-size: 0.85rem;">
                    <strong>${t('ui_gambit_count') || 'Gambits'}:</strong> ${gambits.length} / 12
                    <div style="flex: 1;"></div>
                    <button class="btn btn-secondary btn-sm" id="btn-gambit-preset">📋 ${t('gambit_preset_btn') || 'Suggest Preset'}</button>
                </div>

                <div class="gambit-list-v1" style="flex: 1; overflow-y: auto; padding-right: 8px; border: 1px solid var(--glass-border); border-radius: 4px; padding: 4px;">
                    ${Array.from({length: 12}).map((_, idx) => {
                        const g = gambits[idx];
                        if (g) {
                            return `
                            <div class="gambit-row-v1 ${g.enabled === false ? 'gambit-disabled' : ''}" data-id="${g.id}">
                                <div class="gambit-idx">${idx + 1}</div>
                                <div class="gambit-content">
                                    <div class="gambit-rule-text">${HeroGambitModal.formatGambitRule(g, t)}</div>
                                </div>
                                <div class="gambit-actions">
                                    <button class="btn btn-sm btn-move-gambit" data-id="${g.id}" data-dir="-1" ${idx === 0 ? 'disabled' : ''}>▲</button>
                                    <button class="btn btn-sm btn-move-gambit" data-id="${g.id}" data-dir="1" ${idx === gambits.length - 1 ? 'disabled' : ''}>▼</button>
                                    <button class="btn btn-sm btn-toggle-gambit ${g.enabled === false ? 'btn-primary' : 'btn-secondary'}" data-id="${g.id}">${g.enabled === false ? 'Enable' : 'Disable'}</button>
                                    <button class="btn btn-danger btn-sm btn-remove-gambit" data-id="${g.id}">×</button>
                                </div>
                            </div>`;
                        } else {
                            return `
                            <div class="gambit-row-v1 empty-slot" style="opacity: 0.5; border-style: dashed;">
                                <div class="gambit-idx">${idx + 1}</div>
                                <div class="gambit-content" style="color: var(--text-muted); font-size: 0.85rem;">Empty Slot</div>
                            </div>`;
                        }
                    }).join('')}
                    
                    <div class="gambit-row-v1 fallback-row" style="background: rgba(255, 107, 107, 0.1); border: 1px solid rgba(255, 107, 107, 0.3); margin-top: 8px;">
                        <div class="gambit-idx" style="color: #ff6b6b;">0</div>
                        <div class="gambit-content">
                            <div class="gambit-rule-text" style="color: #ff6b6b;"><strong>FALLBACK:</strong> Always → <span id="fallback-display">${t('family_' + fallbackAction) || fallbackAction}</span></div>
                        </div>
                        <div class="gambit-actions">
                            <select id="gambit-fallback-select" class="gambit-select" style="font-size: 0.8rem; padding: 2px;">
                                ${learnedFamilies.map(f => `<option value="${f.id}" ${fallbackAction === f.id ? 'selected' : ''}>${t('family_' + f.id)}</option>`).join('')}
                                <option value="defend" ${fallbackAction === 'defend' ? 'selected' : ''}>Defend</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="gambit-add-section-v1" style="margin-top: 12px; padding: 12px; background: rgba(0,0,0,0.2); border-radius: 6px;">
                    <h4 style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 8px;">${t('ui_add_gambit') || 'Add Gambit'}</h4>
                    <div class="gambit-form-v1" style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <select id="new-gambit-condition" class="gambit-select" style="flex: 1; min-width: 120px;">
                            <option value="ALLY_HP_LT_50">Ally HP < 50%</option>
                            <option value="ALLY_HP_LT_25">Ally HP < 25%</option>
                            <option value="SELF_HP_LT_50">Self HP < 50%</option>
                            <option value="SELF_MP_LT_25">Self MP < 25%</option>
                            <option value="ANY_ENEMY">Any Enemy</option>
                            <option value="ENEMY_COUNT_GT_2">Enemies > 2</option>
                        </select>
                        <select id="new-gambit-action" class="gambit-select" style="flex: 1; min-width: 120px;">
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
                        <select id="new-gambit-target" class="gambit-select" style="flex: 1; min-width: 120px;">
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
                        <button class="btn btn-primary btn-sm" id="btn-add-gambit-v1" ${gambits.length >= 12 ? 'disabled' : ''}>➕ Add</button>
                    </div>
                </div>

                <div class="trainer-footer" style="margin-top: 16px; border-top: 1px solid var(--glass-border); padding-top: 10px; display: flex; justify-content: flex-end;">
                    <button class="btn btn-secondary btn-sm" id="btn-gambit-close">${t('ui_btn_close') || 'Close'}</button>
                </div>
            </div>
        `;

        const modal = BaseModal.show({
            title: `${t('gambit_title') || 'Gambits'} - ${hero.name}`,
            contentHtml: contentHtml,
            icon: '🎲',
            className: 'gambit-v1-overlay',
            maxWidth: '650px'
        });

        const overlay = modal.overlay;

        overlay.querySelector('#btn-gambit-close').addEventListener('click', modal.close);

        overlay.querySelectorAll('.btn-remove-gambit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                emit('removeGambit', { heroId: hero.id, gambitId: e.target.dataset.id });
                modal.close();
            });
        });

        overlay.querySelectorAll('.btn-toggle-gambit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                emit('toggleGambit', { heroId: hero.id, gambitId: e.target.dataset.id });
                modal.close();
            });
        });

        overlay.querySelectorAll('.btn-move-gambit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                emit('moveGambit', { heroId: hero.id, gambitId: e.target.dataset.id, direction: parseInt(e.target.dataset.dir) });
                modal.close();
            });
        });

        const actionSelect = overlay.querySelector('#new-gambit-action');
        const targetSelect = overlay.querySelector('#new-gambit-target');

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

        const addBtn = overlay.querySelector('#btn-add-gambit-v1');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                const conditionRaw = overlay.querySelector('#new-gambit-condition').value;
                const actionRaw = overlay.querySelector('#new-gambit-action').value;
                const target = overlay.querySelector('#new-gambit-target').value;
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
                modal.close();
            });
        }

        const fallbackSelect = overlay.querySelector('#gambit-fallback-select');
        if (fallbackSelect) {
            fallbackSelect.addEventListener('change', (e) => {
                emit('updateFallbackAction', { heroId: hero.id, action: e.target.value });
            });
        }

        const testBtn = overlay.querySelector('#btn-gambit-test');
        if (testBtn) {
            testBtn.addEventListener('click', () => {
                emit('testGambits', { heroId: hero.id });
            });
        }
        
        const presetBtn = overlay.querySelector('#btn-gambit-preset');
        if (presetBtn) {
            presetBtn.addEventListener('click', () => {
                emit('suggestPreset', { heroId: hero.id });
                modal.close();
            });
        }
    }

    static showTestResults(result, healthScore, rating, t) {
        let witchDialogue = '';
        if (rating === 'ironclad') {
            witchDialogue = `"${t('gambit_witch_ironclad') || 'A flawless design. The threads of fate weave to your will.'}"`;
        } else if (rating === 'functional') {
            witchDialogue = `"${t('gambit_witch_functional') || 'It holds... for now. But chaos seeks the smallest crack.'}"`;
        } else {
            witchDialogue = `"${t('gambit_witch_fragile') || 'Brittle. The weave unravels at the slightest breeze.'}"`;
        }
        
        const winRate = Math.floor((result.victories / result.runs) * 100);

        const contentHtml = `
            <div class="gambit-test-dialogue">
                <div class="test-health-gauge">
                    <div class="health-score-circle ${rating}">${healthScore}</div>
                    <div style="flex: 1;">
                        <h4 style="margin: 0; color: var(--text-primary); font-size: 1.1rem;">${t('ui_health_score') || 'Health Score'}: <span style="text-transform: capitalize;">${rating}</span></h4>
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
