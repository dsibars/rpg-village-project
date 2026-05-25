globalThis.localStorage = {
    getItem() { return null; },
    setItem() {},
    removeItem() {},
    clear() {}
};

import test from 'node:test';
import assert from 'node:assert';
import { GambitService } from '../../js/engine/gambit/GambitService.js';

function makeHero(overrides = {}) {
    return {
        id: 'h1',
        hp: 100,
        maxHp: 100,
        mp: 50,
        maxMp: 100,
        stamina: 50,
        maxStamina: 100,
        knownFamilies: ['single_strike'],
        techniqueTiers: { single_strike: 1 },
        spellCodex: [],
        fallbackAction: 'basic_attack',
        ...overrides
    };
}

function makeGambit(overrides = {}) {
    return {
        id: 'g1',
        conditions: [{ op: 'SINGLE', left: { type: 'always', value: true }, right: null }],
        action: { type: 'skill', payload: 'single_strike' },
        target: null,
        enabled: true,
        ...overrides
    };
}

test('GambitService: self_hp_below matches when HP is low', () => {
    const hero = makeHero({ hp: 30, gambits: [makeGambit({
        conditions: [{ op: 'SINGLE', left: { type: 'self_hp', operator: '<', value: 0.5 }, right: null }],
        action: { type: 'skill', payload: 'single_strike' }
    })] });
    const enemies = [{ id: 'e1', hp: 10, maxHp: 10 }];

    const result = GambitService.evaluate(hero, [hero], enemies);
    assert.ok(result);
    assert.strictEqual(result.skillId, 'single_strike');
});

test('GambitService: self_hp_below does not match when HP is high', () => {
    const hero = makeHero({ hp: 80, gambits: [makeGambit({
        conditions: [{ op: 'SINGLE', left: { type: 'self_hp', operator: '<', value: 0.5 }, right: null }],
        action: { type: 'skill', payload: 'single_strike' }
    })] });
    const enemies = [{ id: 'e1', hp: 10, maxHp: 10 }];

    const result = GambitService.evaluate(hero, [hero], enemies);
    assert.strictEqual(result, null);
});

test('GambitService: ally_hp_below matches when ally is injured', () => {
    const hero = makeHero({ gambits: [makeGambit({
        conditions: [{ op: 'SINGLE', left: { type: 'ally_hp', operator: '<', value: 0.5 }, right: null }],
        action: { type: 'skill', payload: 'single_strike' }
    })] });
    const ally = { id: 'h2', hp: 30, maxHp: 100 };
    const enemies = [{ id: 'e1', hp: 10, maxHp: 10 }];

    const result = GambitService.evaluate(hero, [hero, ally], enemies);
    assert.ok(result);
    assert.strictEqual(result.skillId, 'single_strike');
});

test('GambitService: always condition always matches', () => {
    const hero = makeHero({ gambits: [makeGambit()] });
    const enemies = [{ id: 'e1', hp: 10, maxHp: 10 }];

    const result = GambitService.evaluate(hero, [hero], enemies);
    assert.ok(result);
    assert.strictEqual(result.skillId, 'single_strike');
});

test('GambitService: disabled gambits are skipped', () => {
    const hero = makeHero({ hp: 30, gambits: [makeGambit({
        conditions: [{ op: 'SINGLE', left: { type: 'self_hp', operator: '<', value: 0.5 }, right: null }],
        action: { type: 'skill', payload: 'single_strike' },
        enabled: false
    })] });

    const result = GambitService.evaluate(hero, [hero], []);
    assert.strictEqual(result, null);
});

test('GambitService: first matching gambit wins', () => {
    const hero = makeHero({
        knownFamilies: ['single_strike', 'power_strike'],
        techniqueTiers: { single_strike: 1, power_strike: 1 },
        gambits: [
            makeGambit({ id: 'g1', action: { type: 'skill', payload: 'single_strike' } }),
            makeGambit({ id: 'g2', conditions: [{ op: 'SINGLE', left: { type: 'self_hp', operator: '<', value: 0.5 }, right: null }], action: { type: 'skill', payload: 'power_strike' } })
        ]
    });
    const enemies = [{ id: 'e1', hp: 10, maxHp: 10 }];

    const result = GambitService.evaluate(hero, [hero], enemies);
    assert.ok(result);
    assert.strictEqual(result.skillId, 'single_strike');
});

test('GambitService: skips gambit if not enough stamina', () => {
    const hero = makeHero({
        stamina: 5,
        knownFamilies: ['power_strike'],
        techniqueTiers: { power_strike: 1 },
        gambits: [makeGambit({ action: { type: 'skill', payload: 'power_strike' } })]
    });

    const result = GambitService.evaluate(hero, [hero], []);
    assert.strictEqual(result, null); // power_strike costs 8 STA
});

test('GambitService: validateGambit accepts valid gambit', () => {
    const gambit = makeGambit();
    const result = GambitService.validateGambit(gambit);
    assert.strictEqual(result.valid, true);
});

test('GambitService: validateGambit rejects invalid condition', () => {
    const gambit = makeGambit({
        conditions: [{ op: 'SINGLE', left: { type: 'invalid_cond' }, right: null }]
    });
    const result = GambitService.validateGambit(gambit);
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.error, 'error_invalid_gambit_condition');
});

test('GambitService: validateGambit rejects missing skill payload', () => {
    const gambit = makeGambit({ action: { type: 'skill', payload: null } });
    const result = GambitService.validateGambit(gambit);
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.error, 'error_invalid_skill');
});

test('GambitService: self_mp_below matches when MP is low', () => {
    const hero = makeHero({ mp: 20, gambits: [makeGambit({
        conditions: [{ op: 'SINGLE', left: { type: 'self_mp', operator: '<', value: 0.3 }, right: null }],
        action: { type: 'skill', payload: 'single_strike' }
    })] });
    const enemies = [{ id: 'e1', hp: 10, maxHp: 10 }];

    const result = GambitService.evaluate(hero, [hero], enemies);
    assert.ok(result);
    assert.strictEqual(result.skillId, 'single_strike');
});

test('GambitService: self_sta_below matches when STA is low', () => {
    const hero = makeHero({ stamina: 20, gambits: [makeGambit({
        conditions: [{ op: 'SINGLE', left: { type: 'self_sta', operator: '<', value: 0.3 }, right: null }],
        action: { type: 'skill', payload: 'single_strike' }
    })] });
    const enemies = [{ id: 'e1', hp: 10, maxHp: 10 }];

    const result = GambitService.evaluate(hero, [hero], enemies);
    assert.ok(result);
    assert.strictEqual(result.skillId, 'single_strike');
});

test('GambitService: defeated targets are excluded (Rule 5)', () => {
    const hero = makeHero({ gambits: [makeGambit({
        conditions: [{ op: 'SINGLE', left: { type: 'ally_hp', operator: '<', value: 0.5 }, right: null }],
        action: { type: 'skill', payload: 'single_strike' },
        target: 'lowest_hp_ally'
    })] });
    const deadAlly = { id: 'h2', hp: 0, maxHp: 100 };
    const injuredAlly = { id: 'h3', hp: 30, maxHp: 100 };
    const enemies = [{ id: 'e1', hp: 10, maxHp: 10 }];

    // deadAlly has lowest HP (0) but is excluded per Rule 5
    // injuredAlly should be targeted as the lowest HP alive ally
    const result = GambitService.evaluate(hero, [hero, deadAlly, injuredAlly], enemies);
    assert.ok(result);
    assert.strictEqual(result.targetIndex, 2);
});

test('GambitService: enemy_count condition works', () => {
    const hero = makeHero({ gambits: [makeGambit({
        conditions: [{ op: 'SINGLE', left: { type: 'enemy_count', operator: '>', value: 2 }, right: null }],
        action: { type: 'skill', payload: 'single_strike' }
    })] });
    const enemies = [{ id: 'e1', hp: 10, maxHp: 10 }, { id: 'e2', hp: 10, maxHp: 10 }, { id: 'e3', hp: 10, maxHp: 10 }];

    const result = GambitService.evaluate(hero, [hero], enemies);
    assert.ok(result);
    assert.strictEqual(result.skillId, 'single_strike');
});

test('GambitService: getFallbackAction returns basic_attack by default', () => {
    const hero = makeHero();
    const allies = [hero];
    const result = GambitService.getFallbackAction(hero, allies);
    assert.ok(result.skillId);
});

test('GambitService: getFallbackAction returns defend when configured', () => {
    const hero = makeHero({ fallbackAction: 'defend' });
    const allies = [hero];
    const result = GambitService.getFallbackAction(hero, allies);
    assert.strictEqual(result.defend, true);
});

test('GambitService: getPresetForHero returns Disciple for mage', () => {
    const hero = makeHero({ knownGlyphs: ['glyph_fire'], knownFamilies: ['single_strike'] });
    const preset = GambitService.getPresetForHero(hero);
    assert.strictEqual(preset.id, 'preset_disciples_code');
});

test('GambitService: getPresetForHero returns Vanguard for warrior', () => {
    const hero = makeHero({ knownGlyphs: [], knownFamilies: ['single_strike', 'power_strike'] });
    const preset = GambitService.getPresetForHero(hero);
    assert.strictEqual(preset.id, 'preset_vanguards_code');
});

test('GambitService: getPresetForHero returns Spellblade for hybrid', () => {
    const hero = makeHero({ knownGlyphs: ['glyph_fire'], knownFamilies: ['single_strike', 'power_strike'] });
    const preset = GambitService.getPresetForHero(hero);
    assert.strictEqual(preset.id, 'preset_spellblades_code');
});
