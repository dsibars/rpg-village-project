import { SKILLS_DATA } from '../../data/CombatData.js';
import { GambitService } from '../../../gambit/GambitService.js';
import { MagicCircleService } from '../../../magic_circle/MagicCircleService.js';

export class CombatAI {
    /**
     * Decides the best action for the actor based on the combat context.
     * @param {Object} context { actor: actor, allies: [], enemies: [], type: "smart"|"random" }
     * @returns {Object} { skillId, targetIndex } or { spellIndex, targetIndex }
     */
    static decideAction(context) {
        const { actor, allies, enemies, type } = context;

        // 0. Check hero gambits first (they override AI)
        if (actor.gambits && actor.gambits.length > 0) {
            const gambitAction = GambitService.evaluate(actor, allies, enemies);
            if (gambitAction) return gambitAction;
        }

        // Build list of possible actions with their estimated power
        const actions = [];

        // --- Physical Actions ---
        const knownFamilies = actor.knownFamilies || [];
        const aliveEnemyCount = enemies.filter(e => e.hp > 0).length;
        const hybridMpCost = actor.getHybridMpCost ? actor.getHybridMpCost() : 0;
        for (const familyId of knownFamilies) {
            const skillData = SKILLS_DATA[familyId];
            if (!skillData) continue;
            const tier = actor.techniqueTiers && actor.techniqueTiers[familyId] || 1;
            const staCost = skillData.staminaCostBase + skillData.staminaCostPerTier * (tier - 1);
            if ((actor.stamina || 0) < staCost) continue;
            // Body inscription adds MP cost to physical skills (not basic attack)
            if (familyId !== 'single_strike' && hybridMpCost > 0 && (actor.mp || 0) < hybridMpCost) continue;

            const aoe = skillData.targetType === 'all_enemies' || skillData.cleave;
            const targetCount = aoe ? aliveEnemyCount : 1;
            const power = (skillData.baseMultiplier || 1.0) * tier * targetCount;
            actions.push({
                type: 'skill',
                id: familyId,
                power,
                targetType: skillData.targetType || 'single_enemy',
                aoe,
                cleave: skillData.cleave,
                resource: 'stamina',
                cost: staCost
            });
        }

        // --- Magic Actions ---
        const codex = actor.spellCodex || [];
        for (let i = 0; i < codex.length; i++) {
            const spell = codex[i];
            if (!spell) continue;
            if (!MagicCircleService.canCast(spell, actor.magicTier || 1)) continue;
            if ((actor.mp || 0) < spell.mpCost) continue;

            const isSupport = spell.category === 'support' ||
                              spell.targetType === 'single_ally' ||
                              spell.targetType === 'all_allies';

            if (isSupport) {
                const allyCount = spell.targetType === 'all_allies' ? allies.filter(a => a.hp > 0).length : 1;
                const power = (spell.damage || 0) * (spell.allyFactor || 0.2) * allyCount;
                actions.push({
                    type: 'spell',
                    index: i,
                    power,
                    targetType: spell.targetType || 'single_ally',
                    aoe: spell.targetType === 'all_allies',
                    isSupport: true,
                    resource: 'mp',
                    cost: spell.mpCost
                });
            } else {
                const aoe = spell.targetType === 'all_enemies';
                // Estimate power: damage per target × number of targets
                const targetCount = aoe ? enemies.filter(e => e.hp > 0).length : 1;
                const power = (spell.damage || 0) * targetCount;

                actions.push({
                    type: 'spell',
                    index: i,
                    power,
                    targetType: spell.targetType || 'single_enemy',
                    aoe,
                    resource: 'mp',
                    cost: spell.mpCost
                });
            }
        }

        // Fallback: basic attack
        if (actions.length === 0) {
            return { skillId: 'single_strike', targetIndex: 0 };
        }

        // 1. Check for Healing needs (Smart only)
        const injuredAllies = allies.filter(a => a.hp > 0 && a.hp / a.maxHp <= 0.7);
        if (injuredAllies.length > 0 && type === 'smart') {
            const supportActions = actions.filter(a => a.isSupport).sort((a, b) => b.power - a.power);
            if (supportActions.length > 0) {
                const chosen = supportActions[0];
                const aliveAllies = allies.map((a, idx) => ({ a, idx })).filter(item => item.a.hp > 0);
                aliveAllies.sort((a, b) => (a.a.hp / a.a.maxHp) - (b.a.hp / b.a.maxHp));
                const allyTargetIndex = aliveAllies.length > 0 ? aliveAllies[0].idx : 0;
                return {
                    spellIndex: chosen.index,
                    targetIndex: chosen.targetType === 'single_ally' ? allyTargetIndex : null
                };
            }
        }

        // 2. Offensive logic — sort by power
        const aliveEnemies = enemies
            .map((e, idx) => ({ e, idx }))
            .filter(item => item.e.hp > 0);

        // Smart AI: prefer AoE when 2+ enemies, otherwise highest single-target
        if (type === 'smart' && aliveEnemies.length >= 2) {
            const aoeActions = actions.filter(a => a.aoe && !a.isSupport).sort((a, b) => b.power - a.power);
            if (aoeActions.length > 0) {
                const chosen = aoeActions[0];
                return this._formatAction(chosen, aliveEnemies);
            }
        }

        // Default: highest power action (excluding support unless no offense available)
        const offensiveActions = actions.filter(a => !a.isSupport);
        if (offensiveActions.length > 0) {
            offensiveActions.sort((a, b) => b.power - a.power);
            return this._formatAction(offensiveActions[0], aliveEnemies);
        }

        // If only support actions remain, use highest power support
        actions.sort((a, b) => b.power - a.power);
        const chosen = actions[0];
        return this._formatAction(chosen, aliveEnemies);
    }

    static _formatAction(action, aliveEnemies) {
        let targetIndex = 0;
        if (aliveEnemies.length > 0) {
            aliveEnemies.sort((a, b) => a.e.hp - b.e.hp);
            targetIndex = aliveEnemies[0].idx;
        }

        if (action.type === 'spell') {
            return {
                spellIndex: action.index,
                targetIndex: (action.targetType === 'single_enemy' || action.targetType === 'single_ally') ? targetIndex : null
            };
        }
        return {
            skillId: action.id,
            targetIndex: (action.cleave || action.targetType === 'single_enemy' || action.targetType === 'single_ally') ? targetIndex : null
        };
    }
}
