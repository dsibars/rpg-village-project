globalThis.localStorage = {
    getItem() { return null; },
    setItem() {},
    removeItem() {},
    clear() {}
};

import test from 'node:test';
import assert from 'node:assert';
import { CombatAI } from '../../js/engine/shared/combat/core/CombatAI.js';

const mockActor = {
    id: 'hero1',
    name: 'Arthur',
    hp: 100,
    maxHp: 100,
    mp: 50,
    stamina: 50,
    maxStamina: 50,
    knownFamilies: ['single_strike', 'multiple_attack', 'cleave', 'shield_bash'],
    techniqueTiers: { single_strike: 1, multiple_attack: 1, cleave: 1, shield_bash: 1 },
    techniqueUses: {}
};

const mockAllies = [
    { id: 'hero1', name: 'Arthur', hp: 100, maxHp: 100 },
    { id: 'hero2', name: 'Mira', hp: 100, maxHp: 100 }
];

const mockEnemies = [
    { id: 'e1', name: 'Goblin', hp: 50, maxHp: 50 },
    { id: 'e2', name: 'Orc', hp: 80, maxHp: 80 }
];

test('CombatAI: smart mode targets lowest HP enemy', () => {
    const result = CombatAI.decideAction({
        actor: mockActor,
        allies: mockAllies,
        enemies: mockEnemies,
        type: 'smart'
    });

    assert.strictEqual(result.skillId, 'cleave'); // AoE preferred with 2+ enemies
    assert.strictEqual(result.targetIndex, 0); // lowest HP enemy as primary target
});

test('CombatAI: random mode picks an action', () => {
    const result = CombatAI.decideAction({
        actor: mockActor,
        allies: mockAllies,
        enemies: mockEnemies,
        type: 'random'
    });

    assert.ok(result.skillId || result.spellIndex !== undefined);
    // Cleave returns a primary target index; single-target return an index
    if (result.skillId === 'cleave') {
        assert.strictEqual(result.targetIndex, 0);
    } else {
        assert.ok(result.targetIndex === 0 || result.targetIndex === 1 || result.targetIndex === null);
    }
});

test('CombatAI: smart mode prefers AoE when multiple enemies alive', () => {
    const actorWithCleave = {
        ...mockActor,
        knownFamilies: ['single_strike', 'cleave'],
        techniqueTiers: { single_strike: 1, cleave: 1 }
    };

    const result = CombatAI.decideAction({
        actor: actorWithCleave,
        allies: mockAllies,
        enemies: mockEnemies,
        type: 'smart'
    });

    assert.strictEqual(result.skillId, 'cleave');
    assert.strictEqual(result.targetIndex, 0); // primary target for cleave
});

test('CombatAI: falls back to single_strike when no skills affordable', () => {
    const lowStaminaActor = {
        ...mockActor,
        stamina: 0,
        knownFamilies: ['single_strike', 'multiple_attack', 'cleave'],
        techniqueTiers: { single_strike: 1, multiple_attack: 1, cleave: 1 }
    };

    const result = CombatAI.decideAction({
        actor: lowStaminaActor,
        allies: mockAllies,
        enemies: mockEnemies,
        type: 'smart'
    });

    assert.strictEqual(result.skillId, 'single_strike');
});

test('CombatAI: skill availability filter excludes unaffordable stamina costs', () => {
    const lowStaminaActor = {
        ...mockActor,
        stamina: 5,
        knownFamilies: ['single_strike', 'multiple_attack'],
        techniqueTiers: { single_strike: 1, multiple_attack: 1 }
    };

    const result = CombatAI.decideAction({
        actor: lowStaminaActor,
        allies: mockAllies,
        enemies: mockEnemies,
        type: 'smart'
    });

    assert.strictEqual(result.skillId, 'single_strike'); // multiple_attack costs 8 STA
});

test('CombatAI: target index set for cleave skills', () => {
    const actor = {
        ...mockActor,
        knownFamilies: ['cleave'],
        techniqueTiers: { cleave: 1 }
    };

    const result = CombatAI.decideAction({
        actor,
        allies: mockAllies,
        enemies: mockEnemies,
        type: 'smart'
    });

    assert.strictEqual(result.skillId, 'cleave');
    assert.strictEqual(result.targetIndex, 0); // lowest HP enemy as primary cleave target
});

test('CombatAI: no crash when no alive enemies', () => {
    const deadEnemies = [
        { id: 'e1', name: 'Goblin', hp: 0, maxHp: 50 },
        { id: 'e2', name: 'Orc', hp: 0, maxHp: 80 }
    ];

    const result = CombatAI.decideAction({
        actor: mockActor,
        allies: mockAllies,
        enemies: deadEnemies,
        type: 'smart'
    });

    assert.ok(result.skillId);
});
