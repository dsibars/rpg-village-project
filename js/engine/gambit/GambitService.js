import { SKILLS_DATA } from '../shared/data/CombatData.js';
import { CONSUMABLES_DATA } from '../shared/data/InventoryData.js';
import { Result } from '../shared/core/Result.js';

export class GambitService {
    static CONDITION_TYPES = [
        'enemy_count', 'enemy_hp', 'enemy_element', 'enemy_type', 'enemy_status',
        'ally_hp', 'ally_mp', 'self_hp', 'self_mp',
        'ally_status', 'turn_count', 'battle_phase', 'always'
    ];

    static TARGET_TYPES = [
        'self', 'lowest_hp_ally', 'highest_hp_ally', 'weakest_ally', 'strongest_ally',
        'lowest_hp_enemy', 'highest_hp_enemy', 'weakest_enemy', 'strongest_enemy',
        'all_enemies', 'all_allies', 'random_enemy', 'random_ally'
    ];

    static ACTION_TYPES = ['skill', 'spell', 'item', 'defend', 'flee'];

    /**
     * Evaluate a hero's gambits against combat context and return the first matching action.
     * @param {Object} hero - the actor
     * @param {Array} allies - all allies
     * @param {Array} enemies - all enemies
     * @param {Object} battleState - optional battle state for turn_count, battle_phase
     * @returns {Object|null} action descriptor or null if no gambit matches
     */
    static evaluate(hero, allies, enemies, battleState = {}) {
        const gambits = hero.gambits || [];
        const activeGambits = gambits.filter(g => g.enabled !== false);

        for (const gambit of activeGambits) {
            const match = this._checkConditions(gambit.conditions, hero, allies, enemies, battleState);
            if (!match) continue;

            const action = this._resolveAction(gambit, hero, allies, enemies);
            if (action) return action;
        }

        return null;
    }

    /**
     * Returns the Slot 0 fallback action for a hero.
     * @param {Object} hero
     * @param {Array} allies
     * @returns {Object}
     */
    static getFallbackAction(hero, allies) {
        const fallback = hero.fallbackAction || 'basic_attack';
        if (fallback === 'defend') {
            return { defend: true, targetIndex: allies.findIndex(a => a.id === hero.id) };
        }
        // Default: basic attack on lowest HP enemy
        const aliveEnemies = enemies => enemies.map((e, idx) => ({ e, idx })).filter(item => item.e.hp > 0);
        const targets = aliveEnemies([]); // empty array fallback
        const targetIndex = targets.length > 0 ? targets[0].idx : 0;
        return { skillId: 'single_strike', targetIndex };
    }

    static _checkConditions(conditions, hero, allies, enemies, battleState) {
        if (!conditions || conditions.length === 0) return false;

        for (const cond of conditions) {
            if (cond.op === 'SINGLE') {
                return this._checkCondition(cond.left, hero, allies, enemies, battleState);
            }
            // v1.1: AND/OR support stub
            if (cond.op === 'AND') {
                return this._checkCondition(cond.left, hero, allies, enemies, battleState) &&
                       this._checkCondition(cond.right, hero, allies, enemies, battleState);
            }
            if (cond.op === 'OR') {
                return this._checkCondition(cond.left, hero, allies, enemies, battleState) ||
                       this._checkCondition(cond.right, hero, allies, enemies, battleState);
            }
        }
        return false;
    }

    static _checkCondition(condition, hero, allies, enemies, battleState) {
        if (!condition || !condition.type) return false;

        const { type, operator, value } = condition;
        const aliveAllies = allies.filter(a => a.hp > 0);
        const aliveEnemies = enemies.filter(e => e.hp > 0);

        switch (type) {
            case 'self_hp': {
                const ratio = hero.hp / hero.maxHp;
                return this._compare(ratio, operator, value);
            }
            case 'ally_hp': {
                const injured = aliveAllies.filter(a => a.id !== hero.id && this._compare(a.hp / a.maxHp, operator, value));
                return injured.length > 0;
            }
            case 'self_mp': {
                const ratio = hero.mp / hero.maxMp;
                return this._compare(ratio, operator, value);
            }
            case 'self_sta': {
                const ratio = (hero.stamina || 0) / (hero.maxStamina || 1);
                return this._compare(ratio, operator, value);
            }
            case 'enemy_count': {
                return this._compare(aliveEnemies.length, operator, value);
            }
            case 'enemy_hp': {
                return aliveEnemies.some(e => this._compare(e.hp / e.maxHp, operator, value));
            }
            case 'enemy_status': {
                return aliveEnemies.some(e => e.statusEffects && e.statusEffects.some(s => s.type === value));
            }
            case 'turn_count': {
                return this._compare(battleState.turnCount || 0, operator, value);
            }
            case 'battle_phase': {
                return battleState.phase === value;
            }
            case 'always':
                return true;
            default:
                return false;
        }
    }

    static _compare(left, operator, right) {
        switch (operator) {
            case '<': return left < right;
            case '>': return left > right;
            case '=': return left === right;
            case '<=': return left <= right;
            case '>=': return left >= right;
            default: return false;
        }
    }

    static _resolveAction(gambit, hero, allies, enemies) {
        const action = gambit.action;
        if (!action || !action.type) return null;

        switch (action.type) {
            case 'skill':
                return this._resolveSkillAction(action.payload, hero, allies, enemies, gambit.target, action.tier);
            case 'spell':
                return this._resolveSpellAction(action.payload, hero, allies, enemies, gambit.target);
            case 'item':
                return this._resolveItemAction(action.payload, hero, allies, enemies, gambit.target);
            case 'defend':
                return { defend: true, targetIndex: allies.findIndex(a => a.id === hero.id) };
            case 'flee':
                return { flee: true };
            default:
                return null;
        }
    }

    static _resolveSkillAction(skillId, hero, allies, enemies, target, forcedTier = undefined) {
        const skillData = SKILLS_DATA[skillId];
        if (!skillData) return null;

        const knownFamilies = hero.knownFamilies || [];
        if (!knownFamilies.includes(skillId)) return null;

        // Resource check
        if (skillData.category === 'physical') {
            const tier = forcedTier !== undefined ? forcedTier : (hero.techniqueTiers && hero.techniqueTiers[skillId] || 1);
            const staCost = skillData.staminaCostBase + skillData.staminaCostPerTier * (tier - 1);
            if ((hero.stamina || 0) < staCost) return null;
        } else {
            if (hero.mp < (skillData.mpCost || 0)) return null;
        }

        const targetIndex = this._pickTarget(skillData.targetType, target, hero, allies, enemies);
        if (targetIndex === null && skillData.targetType !== 'all_enemies' && skillData.targetType !== 'all_allies') {
            return null; // No valid target
        }
        return { skillId, targetIndex, tier: forcedTier };
    }

    static _resolveSpellAction(spellName, hero, allies, enemies, target) {
        const spellIndex = hero.spellCodex?.findIndex(s => s.name === spellName);
        if (spellIndex === -1 || spellIndex === undefined) return null;
        const spell = hero.spellCodex[spellIndex];
        if (!spell) return null;

        if (hero.mp < (spell.mpCost || 0)) return null;

        const targetIndex = this._pickTarget(spell.targetType, target, hero, allies, enemies);
        if (targetIndex === null && spell.targetType !== 'all_enemies' && spell.targetType !== 'all_allies') {
            return null;
        }
        return { spellIndex, targetIndex };
    }

    static _resolveItemAction(itemId, hero, allies, enemies, target) {
        const itemData = CONSUMABLES_DATA[itemId];
        if (!itemData) return null;

        // For v1.0, assume items are always available (inventory check happens at use time)
        const targetIndex = this._pickTarget(itemData.targetType || 'self', target, hero, allies, enemies);
        return { itemId, targetIndex };
    }

    static _pickTarget(innateTargetType, explicitTarget, hero, allies, enemies) {
        // If gambit has an explicit target, use it (with validation against innate type)
        // Otherwise, derive from innate targetType
        const targetType = explicitTarget || this._deriveDefaultTarget(innateTargetType);

        // Rule #5: Defeated targets are excluded
        // Map first to preserve original indices, then filter
        const aliveAllies = allies.map((a, idx) => ({ a, idx })).filter(item => item.a.hp > 0);
        const aliveEnemies = enemies.map((e, idx) => ({ e, idx })).filter(item => item.e.hp > 0);

        switch (targetType) {
            case 'self':
                return allies.findIndex(a => a.id === hero.id);
            case 'lowest_hp_ally': {
                const sorted = [...aliveAllies].sort((a, b) => (a.a.hp / a.a.maxHp) - (b.a.hp / b.a.maxHp));
                return sorted.length > 0 ? sorted[0].idx : null;
            }
            case 'highest_hp_ally': {
                const sorted = [...aliveAllies].sort((a, b) => (b.a.hp / b.a.maxHp) - (a.a.hp / a.a.maxHp));
                return sorted.length > 0 ? sorted[0].idx : null;
            }
            case 'weakest_ally': {
                const sorted = [...aliveAllies].sort((a, b) => this._threatRatio(a.a) - this._threatRatio(b.a));
                return sorted.length > 0 ? sorted[0].idx : null;
            }
            case 'strongest_ally': {
                const sorted = [...aliveAllies].sort((a, b) => this._threatRatio(b.a) - this._threatRatio(a.a));
                return sorted.length > 0 ? sorted[0].idx : null;
            }
            case 'lowest_hp_enemy': {
                const sorted = [...aliveEnemies].sort((a, b) => a.e.hp - b.e.hp);
                return sorted.length > 0 ? sorted[0].idx : null;
            }
            case 'highest_hp_enemy': {
                const sorted = [...aliveEnemies].sort((a, b) => b.e.hp - a.e.hp);
                return sorted.length > 0 ? sorted[0].idx : null;
            }
            case 'weakest_enemy': {
                const sorted = [...aliveEnemies].sort((a, b) => this._threatRatio(a.e) - this._threatRatio(b.e));
                return sorted.length > 0 ? sorted[0].idx : null;
            }
            case 'strongest_enemy': {
                const sorted = [...aliveEnemies].sort((a, b) => this._threatRatio(b.e) - this._threatRatio(a.e));
                return sorted.length > 0 ? sorted[0].idx : null;
            }
            case 'all_enemies':
            case 'all_allies':
                return null;
            case 'random_enemy': {
                if (aliveEnemies.length === 0) return null;
                const r = Math.floor(Math.random() * aliveEnemies.length);
                return aliveEnemies[r].idx;
            }
            case 'random_ally': {
                if (aliveAllies.length === 0) return null;
                const r = Math.floor(Math.random() * aliveAllies.length);
                return aliveAllies[r].idx;
            }
            default:
                return null;
        }
    }

    static _deriveDefaultTarget(innateTargetType) {
        switch (innateTargetType) {
            case 'single_enemy':
            case 'enemy_splash':
                return 'lowest_hp_enemy';
            case 'single_ally':
                return 'lowest_hp_ally';
            case 'self':
                return 'self';
            case 'all_enemies':
                return 'all_enemies';
            case 'all_allies':
                return 'all_allies';
            default:
                return 'lowest_hp_enemy';
        }
    }

    static _threatRatio(entity) {
        const atk = entity.strength || entity.attack || 1;
        const def = entity.defense || 1;
        return atk / def;
    }

    static validateGambit(gambit) {
        if (!gambit) return { valid: false, error: 'gambit_error_gambit_invalid' };
        if (!gambit.id) return { valid: false, error: 'gambit_error_gambit_invalid' };
        if (!gambit.conditions || !Array.isArray(gambit.conditions) || gambit.conditions.length === 0) {
            return { valid: false, error: 'gambit_error_condition_invalid' };
        }
        for (const cond of gambit.conditions) {
            if (!cond.left || !cond.left.type) {
                return { valid: false, error: 'gambit_error_condition_invalid' };
            }
            if (!this.CONDITION_TYPES.includes(cond.left.type)) {
                return { valid: false, error: 'gambit_error_condition_invalid' };
            }
        }
        if (!gambit.action || !gambit.action.type) {
            return { valid: false, error: 'gambit_error_action_invalid' };
        }
        if (!this.ACTION_TYPES.includes(gambit.action.type)) {
            return { valid: false, error: 'gambit_error_action_invalid' };
        }
        if (gambit.action.type === 'skill' && !gambit.action.payload) {
            return { valid: false, error: 'gambit_error_skill_invalid' };
        }
        if (gambit.target && !this.TARGET_TYPES.includes(gambit.target)) {
            return { valid: false, error: 'gambit_error_target_invalid' };
        }
        return { valid: true };
    }

    // --- Presets ---

    static PRESETS = {
        preset_disciples_code: {
            id: 'preset_disciples_code',
            name: "Disciple's Code",
            description: "Prioritizes magical support and controlled destruction.",
            requiredBuild: { minGlyphs: 1, minFamilies: 0 },
            rules: [
                { conditions: [{ op: 'SINGLE', left: { type: 'ally_hp', operator: '<', value: 0.4 } }], action: { type: 'spell', payload: null }, target: 'lowest_hp_ally' },
                { conditions: [{ op: 'SINGLE', left: { type: 'self_mp', operator: '<', value: 0.2 } }], action: { type: 'item', payload: 'tiny_mp_potion' }, target: 'self' },
                { conditions: [{ op: 'SINGLE', left: { type: 'always', value: true } }], action: { type: 'spell', payload: null }, target: 'weakest_enemy' }
            ],
            fallbackAction: 'basic_attack'
        },
        preset_vanguards_code: {
            id: 'preset_vanguards_code',
            name: "Vanguard's Code",
            description: "Prioritizes heavy strikes and sustained combat.",
            requiredBuild: { minFamilies: 1, minGlyphs: 0 },
            rules: [
                { conditions: [{ op: 'SINGLE', left: { type: 'enemy_hp', operator: '>', value: 0.7 } }], action: { type: 'skill', payload: null }, target: 'highest_hp_enemy' },
                { conditions: [{ op: 'SINGLE', left: { type: 'always', value: true } }], action: { type: 'skill', payload: null }, target: 'highest_hp_enemy' }
            ],
            fallbackAction: 'basic_attack'
        },
        preset_spellblades_code: {
            id: 'preset_spellblades_code',
            name: "Spellblade's Code",
            description: "Blends magical recovery with physical dominance.",
            requiredBuild: { minFamilies: 1, minGlyphs: 1 },
            rules: [
                { conditions: [{ op: 'SINGLE', left: { type: 'ally_hp', operator: '<', value: 0.3 } }], action: { type: 'spell', payload: null }, target: 'lowest_hp_ally' },
                { conditions: [{ op: 'SINGLE', left: { type: 'self_mp', operator: '<', value: 0.2 } }], action: { type: 'item', payload: 'tiny_mp_potion' }, target: 'self' },
                { conditions: [{ op: 'SINGLE', left: { type: 'enemy_count', operator: '>', value: 2 } }], action: { type: 'skill', payload: null }, target: 'all_enemies' },
                { conditions: [{ op: 'SINGLE', left: { type: 'always', value: true } }], action: { type: 'skill', payload: null }, target: 'highest_hp_enemy' }
            ],
            fallbackAction: 'basic_attack'
        }
    };

    static getPresetForHero(hero) {
        const hasGlyphs = hero.knownGlyphs && hero.knownGlyphs.length > 0;
        const hasFamilies = hero.knownFamilies && hero.knownFamilies.length > 1; // >1 because single_strike is always there

        if (hasGlyphs && !hasFamilies) return this.PRESETS.preset_disciples_code;
        if (!hasGlyphs && hasFamilies) return this.PRESETS.preset_vanguards_code;
        if (hasGlyphs && hasFamilies) return this.PRESETS.preset_spellblades_code;
        return null;
    }

    static applyPreset(hero, presetId) {
        const preset = this.PRESETS[presetId];
        if (!preset) return Result.fail('gambit_error_preset_invalid');

        // Verify build requirements
        const hasGlyphs = hero.knownGlyphs && hero.knownGlyphs.length > 0;
        const hasFamilies = hero.knownFamilies && hero.knownFamilies.length > 1;

        if (preset.requiredBuild.minGlyphs && !hasGlyphs) return Result.fail('gambit_error_preset_requirements_not_met');
        if (preset.requiredBuild.minFamilies && !hasFamilies) return Result.fail('gambit_error_preset_requirements_not_met');

        // Fill empty slots with preset rules
        const currentRules = hero.gambits || [];
        for (const rule of preset.rules) {
            if (currentRules.length >= 12) break;
            const newRule = {
                id: 'gambit_preset_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                conditions: JSON.parse(JSON.stringify(rule.conditions)),
                action: { ...rule.action },
                target: rule.target,
                enabled: true
            };
            // Auto-fill null payload with first available skill/spell
            if (newRule.action.type === 'skill' && !newRule.action.payload) {
                const availableSkill = (hero.knownFamilies || []).find(f => f && f !== 'single_strike' && SKILLS_DATA[f]);
                newRule.action.payload = availableSkill || 'single_strike';
            }
            if (newRule.action.type === 'spell' && !newRule.action.payload) {
                const availableSpell = (hero.spellCodex || []).find(s => s && s.name);
                newRule.action.payload = availableSpell ? availableSpell.name : null;
            }
            currentRules.push(newRule);
        }

        hero.gambits = currentRules;
        hero.presetId = presetId;
        if (preset.fallbackAction) hero.fallbackAction = preset.fallbackAction;

        return Result.ok(true);
    }
}
