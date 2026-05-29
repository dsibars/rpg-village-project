import { BattleService } from '../shared/combat/services/BattleService.js';
import { Result } from '../shared/core/Result.js';
import { Hero } from '../heroes/models/Hero.js';
import { Enemy } from '../shared/combat/models/Enemy.js';

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
                const rulePrefix = entry.ruleIndex !== undefined ? `[Rule ${entry.ruleIndex}] ` : '';
                combinedLog.push(`${rulePrefix}${entry.type}: ${entry.actorName} acted.`);
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
