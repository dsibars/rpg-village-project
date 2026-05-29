globalThis.localStorage = {
    getItem() { return null; },
    setItem() {},
    removeItem() {},
    clear() {}
};

import test from 'node:test';
import assert from 'node:assert';
import { GameEngine } from '../../js/engine/GameEngine.js';

test('Auto Battle: Hero Executes Configured Gambits in Real Combat', () => {
    const engine = new GameEngine();
    engine.initialize();
    let state = engine.update();

    // 1. Setup Hero and Expedition
    const arthur = state.heroes[0];
    const cave = state.expeditions.find(e => e.id === 'exp_tutorial_cave');
    assert.ok(arthur, 'Arthur should exist');
    assert.ok(cave, 'Tutorial Cave should exist');

    // Make sure Arthur has power_strike and has full stamina
    const realArthur = engine.heroService.get(arthur.id);
    realArthur.knownFamilies.push('power_strike');
    realArthur.techniqueTiers['power_strike'] = 2; // Tier 2
    realArthur.stamina = realArthur.maxStamina;

    // Add a gambit: Always -> power_strike (Tier 2) on lowest_hp_enemy
    const gambit = {
        id: 'g_power_strike',
        conditions: [{ op: 'SINGLE', left: { type: 'always', value: true }, right: null }],
        action: { type: 'skill', payload: 'power_strike', tier: 2 },
        target: 'lowest_hp_enemy',
        enabled: true
    };
    const addRes = realArthur.addGambit(gambit);
    assert.strictEqual(addRes.success, true, 'Should successfully add gambit');

    // Assign Hero
    const assignRes = engine.assignExpedition(cave.id, [arthur.id]);
    assert.strictEqual(assignRes.success, true);

    // Advance day to trigger battle stage
    const dayReport = engine.nextDay();
    assert.strictEqual(dayReport.expedition.status, 'battle_started');
    
    state = engine.update();
    assert.ok(state.activeBattle, 'Active battle context should be active');

    // Turn on autoBattle
    engine.battleService.autoBattle = true;

    // Step Combat turn (Arthur's turn)
    const turnRes = engine.nextBattleTurn();
    assert.strictEqual(turnRes.success, true, 'Turn execution should succeed');

    state = engine.update();
    const logs = state.activeBattle.log;
    console.log('Battle logs during auto-battle:', logs);

    // Find Arthur's action log
    const arthurLog = logs.find(l => l.actorId === arthur.id && l.type === 'DAMAGE');
    assert.ok(arthurLog, 'Should have a DAMAGE log for Arthur');
    assert.strictEqual(arthurLog.skillId, 'power_strike', 'Should have used power_strike');
    assert.strictEqual(arthurLog.effectiveTier, 2, 'Should have used Tier 2');
});
