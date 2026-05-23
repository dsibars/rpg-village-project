globalThis.localStorage = {
    getItem() { return null; },
    setItem() {},
    removeItem() {},
    clear() {}
};

import test from 'node:test';
import assert from 'node:assert';
import { WitchService } from '../../js/engine/witch/WitchService.js';

const mockI18n = {
    t(key) {
        const map = {
            witch_generic_far: 'The threads are still weaving.',
            witch_generic_approach: 'The water stirs. Something is waking.',
            witch_generic_near: 'I read a VERY POWERFUL MANA inside you!',
            witch_generic_reached: 'Your effort had a recent reward.',
            witch_generic_max: 'The circle is complete.',
            witch_fire_far: 'The embers are faint. Tend them.',
            witch_fire_approach: 'The flames flicker with restless energy.',
            witch_fire_near: 'The inferno calls. It is almost within reach.',
            witch_mastery_near: 'Your {glyph}... it no longer feels like a stranger.',
            witch_mastery_mid: 'The {glyph} symbol you draw has changed.',
            witch_repeated_visit: 'Back so soon? The threads have not moved much.',
        };
        return map[key] || key;
    }
};

test('WitchService: far from next tier', () => {
    const hero = { origin: 'origin_warrior', knownGlyphs: [], spellCodex: [], magicXp: 0, magicTier: 1 };
    const result = WitchService.getDialogue(hero, mockI18n, 0);
    assert.strictEqual(result.category, 'far');
    assert.ok(result.lines.length >= 1);
});

test('WitchService: approaching next tier', () => {
    // Tier 2 threshold = 500, Tier 1 base = 0. At 300 XP, we're 60% of the way = 40% remaining = approaching
    const hero = { origin: 'origin_warrior', knownGlyphs: ['glyph_fire'], spellCodex: [], magicXp: 300, magicTier: 1 };
    const result = WitchService.getDialogue(hero, mockI18n, 0);
    assert.strictEqual(result.category, 'approaching');
});

test('WitchService: near next tier', () => {
    // At 480 XP, 96% of way to Tier 2 = 4% remaining = near
    const hero = { origin: 'origin_warrior', knownGlyphs: ['glyph_fire'], spellCodex: [], magicXp: 480, magicTier: 1 };
    const result = WitchService.getDialogue(hero, mockI18n, 0);
    assert.strictEqual(result.category, 'near');
});

test('WitchService: just reached tier', () => {
    const hero = { origin: 'origin_warrior', knownGlyphs: ['glyph_fire'], spellCodex: [{ element: 'fire' }], magicXp: 500, magicTier: 2 };
    const result = WitchService.getDialogue(hero, mockI18n, 0);
    assert.strictEqual(result.category, 'just_reached');
});

test('WitchService: detects dominant element', () => {
    const hero = { origin: 'origin_warrior', knownGlyphs: ['glyph_fire'], spellCodex: [{ element: 'fire' }, { element: 'fire' }, { element: 'water' }], magicXp: 0, magicTier: 1 };
    const result = WitchService.getDialogue(hero, mockI18n, 0);
    assert.strictEqual(result.element, 'fire');
});

test('WitchService: repeated visit with no progress', () => {
    const hero = { origin: 'origin_warrior', knownGlyphs: [], spellCodex: [], magicXp: 100, magicTier: 1, lastWitchVisit: { tier: 1, xp: 100 } };
    const result = WitchService.getDialogue(hero, mockI18n, 0);
    assert.ok(result.lines[0].includes('Back so soon'));
});

test('WitchService: records visit', () => {
    const hero = { origin: 'origin_warrior', knownGlyphs: [], spellCodex: [], magicXp: 100, magicTier: 1 };
    assert.strictEqual(hero.lastWitchVisit, undefined);
    WitchService.recordVisit(hero);
    assert.strictEqual(hero.lastWitchVisit.tier, 1);
    assert.strictEqual(hero.lastWitchVisit.xp, 100);
});

test('WitchService: mastery hints when glyph near threshold', () => {
    // Glyph at Tier 1, 450 uses (threshold is 500)
    const hero = {
        origin: 'origin_warrior',
        knownGlyphs: ['glyph_fire'],
        spellCodex: [],
        magicXp: 0,
        magicTier: 1,
        glyphMastery: { glyph_fire: { tier: 1, uses: 450 } }
    };
    const result = WitchService.getDialogue(hero, mockI18n, 0);
    assert.ok(result.masteryHints.length > 0);
    assert.strictEqual(result.masteryHints[0].glyphId, 'glyph_fire');
});
