import { BattleService } from '../shared/combat/services/BattleService.js';
import { Result } from '../shared/core/Result.js';
import { Hero } from '../heroes/models/Hero.js';
import { Enemy } from '../shared/combat/models/Enemy.js';
import { SKILLS_DATA } from '../shared/data/GameConstants.js';

export class SimulationRunner {
    /**
     * Executes headless simulations for Gambit testing.
     * @param {Object} hero - The hero to test (will be deep cloned)
     * @param {Array} enemies - The enemy encounter pool to test against
     * @param {Object} inventoryService - Mock or real inventory service for items
     * @param {string} scenarioId - The ID of the current test scenario
     * @param {number} runs - Number of simulations to run (default 10)
     * @returns {Object} Test Mode Result Schema
     */
    static runHeadless(hero, enemies, inventoryService, scenarioId, runs = 10) {
        let victories = 0;
        let defeats = 0;
        let totalHpLeft = 0;
        let totalMpLeft = 0;
        let totalItemsConsumed = {};
        const combinedLog = [];

        // v1.1 TODO: Implement deterministic seeding
        // const seed = `${hero.id}_${scenarioId}_${this._stableHash(hero.gambits || [])}`;

        for (let i = 0; i < runs; i++) {
            // Deep clone hero and enemies to avoid mutating real game state
            const clonedHero = this._cloneHero(hero);
            const clonedEnemies = enemies.map(e => new Enemy(JSON.parse(JSON.stringify(e))));

            // Mock inventory to track usage without real consumption
            const runItems = {};
            const mockInventory = {
                useConsumable: (id) => {
                    runItems[id] = (runItems[id] || 0) + 1;
                    totalItemsConsumed[id] = (totalItemsConsumed[id] || 0) + 1;
                    return Result.ok();
                }
            };

            const battleService = new BattleService(mockInventory);
            
            // Force autoBattle to true to rely entirely on Gambits
            battleService.startBattle([clonedHero], clonedEnemies, true);

            let safeExitCounter = 0;
            while (!battleService.isOver && safeExitCounter < 1000) {
                battleService.nextTurn();
                safeExitCounter++;
            }

            if (battleService.winner === 'heroes') {
                victories++;
            } else {
                defeats++;
            }

            totalHpLeft += (clonedHero.hp / clonedHero.maxHp);
            totalMpLeft += (clonedHero.mp / Math.max(1, clonedHero.maxMp));

            // Append run logs
            combinedLog.push(`--- RUN ${i + 1} ---`);
            battleService.log.forEach(entry => {
                const rulePrefix = entry.ruleIndex !== undefined ? `[Rule ${entry.ruleIndex + 1}] ` : '';
                let msg = '';
                switch (entry.type) {
                    case 'DAMAGE': {
                        const skillName = SKILLS_DATA[entry.skillId]?.name || entry.skillId || 'attack';
                        const tierStr = entry.effectiveTier ? ` (Tier ${entry.effectiveTier})` : '';
                        const critStr = entry.isCrit ? ' 💥CRIT!' : '';
                        const missStr = entry.isMiss ? ' (Missed)' : '';
                        const outcome = entry.isMiss ? '' : ` dealt ${entry.amount} damage to ${entry.targetName} [${entry.targetHp}/${entry.targetMaxHp} HP]${critStr}`;
                        msg = `${rulePrefix}${entry.actorName} used ${skillName}${tierStr}${missStr}${outcome}.`;
                        break;
                    }
                    case 'HEAL': {
                        const sourceStr = entry.source ? ` via ${entry.source}` : '';
                        const targetHpStr = (entry.targetHp !== undefined && entry.targetMaxHp !== undefined) ? ` [${entry.targetHp}/${entry.targetMaxHp} HP]` : '';
                        msg = `${rulePrefix}${entry.actorName} healed ${entry.targetName} for ${entry.amount} HP${sourceStr}${targetHpStr}.`;
                        break;
                    }
                    case 'SPELL_DAMAGE': {
                        const elementStr = entry.element ? ` [${entry.element.toUpperCase()}]` : '';
                        const critStr = entry.isCrit ? ' 💥CRIT!' : '';
                        const targetHpStr = (entry.targetHp !== undefined && entry.targetMaxHp !== undefined) ? ` [${entry.targetHp}/${entry.targetMaxHp} HP]` : '';
                        msg = `${rulePrefix}${entry.actorName} cast ${entry.spellName}${elementStr} on ${entry.targetName} dealing ${entry.amount} damage${critStr}${targetHpStr}.`;
                        break;
                    }
                    case 'MP_RESTORE': {
                        const targetHpStr = (entry.targetHp !== undefined && entry.targetMaxHp !== undefined) ? ` [${entry.targetHp}/${entry.targetMaxHp} HP]` : '';
                        msg = `${rulePrefix}${entry.actorName} restored ${entry.amount} MP to ${entry.targetName}${targetHpStr}.`;
                        break;
                    }
                    case 'STAMINA_RESTORE': {
                        msg = `${rulePrefix}${entry.actorName} restored ${entry.amount} Stamina to ${entry.targetName}.`;
                        break;
                    }
                    case 'STAMINA_REGEN': {
                        msg = `${entry.actorName || 'Actor'} recovered ${entry.amount} stamina.`;
                        break;
                    }
                    case 'TRAIT_REGEN': {
                        const targetHpStr = (entry.targetHp !== undefined && entry.targetMaxHp !== undefined) ? ` [${entry.targetHp}/${entry.targetMaxHp} HP]` : '';
                        msg = `${entry.targetName} recovered ${entry.amount} HP from party regen${targetHpStr}.`;
                        break;
                    }
                    case 'STATUS_TICK': {
                        const targetHpStr = (entry.targetHp !== undefined && entry.targetMaxHp !== undefined) ? ` [${entry.targetHp}/${entry.targetMaxHp} HP]` : '';
                        msg = `${entry.targetName} took ${entry.damage} ${entry.effectType} damage${targetHpStr}.`;
                        break;
                    }
                    case 'STATUS_EXPIRED': {
                        msg = `${entry.targetName}'s ${entry.effectType} expired.`;
                        break;
                    }
                    case 'USE_CONSUMABLE': {
                        const itemStr = entry.consumableId || 'item';
                        const targetHpStr = (entry.targetHp !== undefined && entry.targetMaxHp !== undefined) ? ` [${entry.targetHp}/${entry.targetMaxHp} HP]` : '';
                        msg = `${rulePrefix}${entry.actorName} used ${itemStr} on ${entry.targetName} healing ${entry.amount} HP${targetHpStr}.`;
                        break;
                    }
                    case 'STUN_SKIP': {
                        msg = `${entry.actorName} is stunned! Skipping turn.`;
                        break;
                    }
                    case 'SLEEP_SKIP': {
                        msg = `${entry.actorName} is asleep! Skipping turn.`;
                        break;
                    }
                    case 'defend': {
                        msg = `${rulePrefix}${entry.actorName} defended.`;
                        break;
                    }
                    case 'flee': {
                        msg = `${rulePrefix}${entry.actorName} attempted to flee (${entry.success ? 'Success' : 'Failed'}).`;
                        break;
                    }
                    case 'VAMP': {
                        const targetHpStr = (entry.targetHp !== undefined && entry.targetMaxHp !== undefined) ? ` [${entry.targetHp}/${entry.targetMaxHp} HP]` : '';
                        msg = `${entry.actorName} recovered ${entry.amount} HP from vampirism${targetHpStr}.`;
                        break;
                    }
                    case 'TECHNIQUE_EVOLVED': {
                        msg = `${entry.actorName}'s ${entry.family} evolved to Tier ${entry.tier}!`;
                        break;
                    }
                    default: {
                        const actorStr = entry.actorName || entry.targetName || 'Someone';
                        msg = `${rulePrefix}${entry.type}: ${actorStr} acted.`;
                        break;
                    }
                }
                combinedLog.push(msg);
            });
        }

        // Average items consumed per battle
        const avgItemsConsumed = {};
        for (const [itemId, total] of Object.entries(totalItemsConsumed)) {
            avgItemsConsumed[itemId] = Math.round((total / runs) * 10) / 10;
        }

        return {
            scenarioId,
            runs,
            victories,
            defeats,
            avgHpRemaining: Math.floor((totalHpLeft / runs) * 100),
            avgMpRemaining: Math.floor((totalMpLeft / runs) * 100),
            avgItemsConsumed,
            log: combinedLog,
            timestamp: new Date().toISOString()
        };
    }

    static _cloneHero(hero) {
        const cloned = new Hero(JSON.parse(JSON.stringify(hero)));
        cloned.recalculateStats({});
        return cloned;
    }

    static _stableHash(obj) {
        return JSON.stringify(obj); // Naive stable hash for v1.0
    }
}
