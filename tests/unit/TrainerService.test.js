globalThis.localStorage = {
    getItem() { return null; },
    setItem() {},
    removeItem() {},
    clear() {}
};

import test from 'node:test';
import assert from 'node:assert';
import { TrainerService } from '../../js/engine/trainer/TrainerService.js';

test('TrainerService: no family dialogue', () => {
    const hero = { techniqueUses: {}, techniqueTiers: {} };
    const result = TrainerService.getDialogue(hero);
    assert.strictEqual(result.category, 'no_family');
    assert.strictEqual(result.lines.length, 2);
    assert.strictEqual(result.lines[0].key, 'trainer_no_family_1');
});

test('TrainerService: far progress dialogue', () => {
    const hero = { techniqueUses: { multiple_attack: 10 }, techniqueTiers: { multiple_attack: 1 } };
    const result = TrainerService.getDialogue(hero);
    assert.strictEqual(result.category, 'far');
    assert.strictEqual(result.lines[0].params.family, 'family_multiple_attack');
});

test('TrainerService: approaching progress dialogue', () => {
    // Threshold for tier 2 is 100, 50 uses = 50% progress
    const hero = { techniqueUses: { multiple_attack: 50 }, techniqueTiers: { multiple_attack: 1 } };
    const result = TrainerService.getDialogue(hero);
    assert.strictEqual(result.category, 'approaching');
});

test('TrainerService: near progress dialogue', () => {
    // 80 uses = 80% progress
    const hero = { techniqueUses: { multiple_attack: 80 }, techniqueTiers: { multiple_attack: 1 } };
    const result = TrainerService.getDialogue(hero);
    assert.strictEqual(result.category, 'near');
});

test('TrainerService: high tier dialogue', () => {
    const hero = { techniqueUses: { power_strike: 5000 }, techniqueTiers: { power_strike: 5 } };
    const result = TrainerService.getDialogue(hero);
    assert.strictEqual(result.category, 'high_tier');
    assert.strictEqual(result.lines[0].params.tier, 5);
    assert.strictEqual(result.lines[0].params.family, 'family_power_strike');
});

test('TrainerService: picks best progress across families', () => {
    const hero = {
        techniqueUses: { multiple_attack: 10, power_strike: 80 },
        techniqueTiers: { multiple_attack: 1, power_strike: 1 }
    };
    const result = TrainerService.getDialogue(hero);
    // power_strike at 80/100 = 80% → near category
    assert.strictEqual(result.category, 'near');
    assert.strictEqual(result.lines[0].params.family, 'family_power_strike');
});
