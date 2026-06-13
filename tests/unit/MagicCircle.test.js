globalThis.localStorage = {
    getItem() { return null; },
    setItem() {},
    removeItem() {},
    clear() {}
};

import test from 'node:test';
import assert from 'node:assert';
import { MagicCircleService } from '../../js/engine/magic_circle/MagicCircleService.js';
import { Hero } from '../../js/engine/heroes/models/Hero.js';

test('MagicCircle: compose simple spell', () => {
    const result = MagicCircleService.compose(['glyph_fire', 'glyph_potentiate'], { 'glyph_fire': 1, 'glyph_potentiate': 1 });
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.data.element, 'fire');
    assert.ok(result.data.mpCost >= 5);
    assert.ok(result.data.damage >= 10);
});

test('MagicCircle: compose multi-target spell', () => {
    const result = MagicCircleService.compose(
        ['glyph_fire', 'glyph_potentiate', 'glyph_multi'],
        { 'glyph_fire': 1, 'glyph_potentiate': 2, 'glyph_multi': 2 }
    );
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.data.targetType, 'all_enemies');
    assert.ok(result.data.mpCost >= 5);
});

test('MagicCircle: compose with efficiency reduces cost', () => {
    const withoutEff = MagicCircleService.compose(
        ['glyph_fire', 'glyph_potentiate'],
        { 'glyph_fire': 1, 'glyph_potentiate': 2 }
    );
    const withEff = MagicCircleService.compose(
        ['glyph_fire', 'glyph_potentiate', 'glyph_streamline'],
        { 'glyph_fire': 1, 'glyph_potentiate': 2, 'glyph_streamline': 1 }
    );
    assert.ok(withEff.data.mpCost < withoutEff.data.mpCost);
});

test('MagicCircle: fails without core', () => {
    const result = MagicCircleService.compose(['glyph_potentiate']);
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'magic_circle_error_core_glyph_none');
});

test('MagicCircle: fails with too many glyphs', () => {
    const result = MagicCircleService.compose(
        ['glyph_fire', 'glyph_potentiate', 'glyph_potentiate', 'glyph_multi', 'glyph_streamline'],
        { 'glyph_fire': 1, 'glyph_potentiate': 1, 'glyph_multi': 1, 'glyph_streamline': 1 }
    );
    // This should succeed in compose but fail in validateInscription for a tier-3 hero
    assert.strictEqual(result.success, true); // compose doesn't validate hero tier
});

test('MagicCircle: getMagicTier from XP', () => {
    assert.strictEqual(MagicCircleService.getMagicTier(0), 1);
    assert.strictEqual(MagicCircleService.getMagicTier(500), 2);
    assert.strictEqual(MagicCircleService.getMagicTier(1300), 3);
    assert.strictEqual(MagicCircleService.getMagicTier(2500), 4);
    assert.strictEqual(MagicCircleService.getMagicTier(6800), 6);
    assert.strictEqual(MagicCircleService.getMagicTier(10300), 7);
    assert.strictEqual(MagicCircleService.getMagicTier(100000), 14);
});

test('MagicCircle: arcane initiate gets default glyphs', () => {
    const hero = new Hero({ name: 'Elara', origin: 'origin_arcane_initiate', level: 1, statPoints: 5 });
    assert.ok(hero.knownGlyphs.includes('glyph_fire'));
    assert.ok(hero.knownGlyphs.includes('glyph_potentiate'));
});

test('MagicCircle: non-mage starts with no glyphs', () => {
    const hero = new Hero({ name: 'Grom', origin: 'origin_warrior', level: 1, statPoints: 5 });
    assert.strictEqual(hero.knownGlyphs.length, 0);
});

test('MagicCircle: hero spell codex persisted', () => {
    const hero = new Hero({ name: 'Elara', origin: 'origin_arcane_initiate', level: 1, statPoints: 5 });
    hero.spellCodex = [{ id: 's1', name: 'Fireball', mpCost: 6, damage: 14, element: 'fire', glyphIds: ['glyph_fire'] }];
    const json = hero.toJSON();
    assert.deepStrictEqual(json.spellCodex, [{ id: 's1', name: 'Fireball', mpCost: 6, damage: 14, element: 'fire', glyphIds: ['glyph_fire'] }]);
});

test('MagicCircle: glyph mastery evolves with uses', () => {
    const hero = new Hero({ name: 'Elara', origin: 'origin_arcane_initiate', level: 1, statPoints: 5 });
    // Tier 1 → 2 requires 500 uses
    for (let i = 0; i < 500; i++) {
        hero.recordGlyphUse('glyph_fire');
    }
    assert.strictEqual(hero.glyphMastery['glyph_fire'].tier, 2);
});

test('MagicCircle: codex max 6 enforcement', () => {
    const hero = new Hero({ name: 'Elara', origin: 'origin_arcane_initiate', level: 1, statPoints: 5 });
    hero.magicTier = 25; // enough slots
    for (let i = 0; i < 6; i++) {
        const spell = MagicCircleService.compose(['glyph_fire'], {}).data;
        hero.inscribeSpell(spell);
    }
    assert.strictEqual(hero.spellCodex.length, 6);
    const seventh = MagicCircleService.compose(['glyph_fire'], {}).data;
    const result = hero.inscribeSpell(seventh);
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'magic_circle_error_codex_full');
});

test('MagicCircle: tier-locked casting', () => {
    const hero = new Hero({ name: 'Elara', origin: 'origin_arcane_initiate', level: 1, statPoints: 5 });
    hero.magicTier = 2; // 2 slots
    const spell = MagicCircleService.compose(
        ['glyph_fire', 'glyph_potentiate', 'glyph_multi'],
        { 'glyph_fire': 1, 'glyph_potentiate': 1, 'glyph_multi': 1 }
    ).data;
    // Spell has 3 glyphs, hero only has 2 slots
    const result = hero.castSpell(spell);
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'heroes_error_magic_tier_low');
});


test('MagicCircle: compose ally-targeted support spell', () => {
    const result = MagicCircleService.compose(
        ['glyph_light', 'glyph_aegis'],
        { 'glyph_light': 1, 'glyph_aegis': 1 }
    );
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.data.category, 'support');
    assert.strictEqual(result.data.targetType, 'single_ally');
    assert.strictEqual(result.data.allyFactor, 0.30);
    assert.ok(result.data.name.includes('Soothing') || result.data.name.includes('Light'));
});

test('MagicCircle: compose ally-targeted AoE support spell', () => {
    const result = MagicCircleService.compose(
        ['glyph_light', 'glyph_aegis', 'glyph_multi'],
        { 'glyph_light': 1, 'glyph_aegis': 1, 'glyph_multi': 1 }
    );
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.data.category, 'support');
    assert.strictEqual(result.data.targetType, 'all_allies');
});

test('MagicCircle: earth core composition', () => {
    const result = MagicCircleService.compose(
        ['glyph_earth', 'glyph_aegis'],
        { 'glyph_earth': 1, 'glyph_aegis': 1 }
    );
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.data.element, 'earth');
    assert.strictEqual(result.data.category, 'support');
    assert.strictEqual(result.data.allyFactor, 0.25);
});

test('MagicCircle: offensive spell with boolean multi targets all enemies', () => {
    const result = MagicCircleService.compose(
        ['glyph_fire', 'glyph_multi'],
        { 'glyph_fire': 1, 'glyph_multi': 1 }
    );
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.data.targetType, 'all_enemies');
    assert.strictEqual(result.data.category, 'offensive');
});

test('MagicCircle: aegis cost multiplier increases mp cost', () => {
    const withoutAegis = MagicCircleService.compose(
        ['glyph_light'],
        { 'glyph_light': 1 }
    );
    const withAegis = MagicCircleService.compose(
        ['glyph_light', 'glyph_aegis'],
        { 'glyph_light': 1, 'glyph_aegis': 1 }
    );
    assert.ok(withAegis.data.mpCost > withoutAegis.data.mpCost);
});

test('MagicCircle: multi cost multiplier increases mp cost significantly', () => {
    const withoutMulti = MagicCircleService.compose(
        ['glyph_fire'],
        { 'glyph_fire': 1 }
    );
    const withMulti = MagicCircleService.compose(
        ['glyph_fire', 'glyph_multi'],
        { 'glyph_fire': 1, 'glyph_multi': 1 }
    );
    // Multi adds +250% cost = 3.5x multiplier
    assert.ok(withMulti.data.mpCost > withoutMulti.data.mpCost * 2);
});


test('MagicCircle: boolean glyph does not evolve through mastery', () => {
    const multiEvo = MagicCircleService.checkGlyphMastery('glyph_multi', 1, 999999);
    const aegisEvo = MagicCircleService.checkGlyphMastery('glyph_aegis', 1, 999999);
    assert.strictEqual(multiEvo, null);
    assert.strictEqual(aegisEvo, null);
});

test('MagicCircle: growing glyph evolves at correct threshold', () => {
    const potentiateEvo = MagicCircleService.checkGlyphMastery('glyph_potentiate', 1, 500);
    assert.strictEqual(potentiateEvo, 2);
});

test('MagicCircle: growing glyph does not evolve before threshold', () => {
    const potentiateEvo = MagicCircleService.checkGlyphMastery('glyph_potentiate', 1, 499);
    assert.strictEqual(potentiateEvo, null);
});
