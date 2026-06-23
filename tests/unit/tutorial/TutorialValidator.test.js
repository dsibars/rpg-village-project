globalThis.localStorage = {
    getItem() { return null; },
    setItem() {},
    removeItem() {},
    clear() {}
};

import test from 'node:test';
import assert from 'node:assert';
import { TutorialValidator, KNOWN_EVENT_TYPES, KNOWN_TARGETS } from '../../../js/engine/tutorial/TutorialValidator.js';
import { TutorialRegistry, hasTutorial } from '../../../js/engine/tutorial/TutorialRegistry.js';

// ─── Static Exports ────────────────────────────────────────────────────────

test('TutorialValidator: KNOWN_EVENT_TYPES contains expected events', () => {
    assert.strictEqual(KNOWN_EVENT_TYPES.has('skill_learned'), true);
    assert.strictEqual(KNOWN_EVENT_TYPES.has('stat_assigned'), true);
    assert.strictEqual(KNOWN_EVENT_TYPES.has('building_constructed'), true);
    assert.strictEqual(KNOWN_EVENT_TYPES.has('expedition_started'), true);
    assert.strictEqual(KNOWN_EVENT_TYPES.has('day_advanced'), true);
    assert.strictEqual(KNOWN_EVENT_TYPES.has('tab_changed'), true);
    assert.strictEqual(KNOWN_EVENT_TYPES.has('hero_selected'), true);
    assert.strictEqual(KNOWN_EVENT_TYPES.has('region_selected'), true);
});

test('TutorialValidator: KNOWN_TARGETS contains expected targets', () => {
    assert.strictEqual(KNOWN_TARGETS.has('footer_nav_heroes'), true);
    assert.strictEqual(KNOWN_TARGETS.has('hero_card_arthur'), true);
    assert.strictEqual(KNOWN_TARGETS.has('hero_action_skills'), true);
    assert.strictEqual(KNOWN_TARGETS.has('day_advance_button'), true);
    assert.strictEqual(KNOWN_TARGETS.has('building_farm'), true);
});

// ─── Registry Validation ───────────────────────────────────────────────────

test('TutorialValidator: validateRegistry() passes for current registry', () => {
    const result = TutorialValidator.validateRegistry();
    assert.strictEqual(result.valid, true, `Registry validation failed: ${result.errors.map(e => e.message).join(', ')}`);
    assert.strictEqual(result.errors.length, 0);
});

test('TutorialValidator: validateRegistry() detects unknown advanceOn event', () => {
    // Temporarily mutate registry
    const tutorial = TutorialRegistry.get('tutorial_hero_skills');
    const originalEvent = tutorial.steps[0].advanceOn.event;
    tutorial.steps[0].advanceOn.event = 'unknown_event_xyz';

    const result = TutorialValidator.validateRegistry();
    assert.strictEqual(result.valid, false);
    const eventErrors = result.errors.filter(e => e.type === 'event');
    assert.strictEqual(eventErrors.length, 1);
    assert.ok(eventErrors[0].message.includes('unknown_event_xyz'));

    // Restore
    tutorial.steps[0].advanceOn.event = originalEvent;
});

test('TutorialValidator: validateRegistry() detects unknown spotlight target', () => {
    const tutorial = TutorialRegistry.get('tutorial_hero_skills');
    const originalTarget = tutorial.steps[0].what.target;
    tutorial.steps[0].what.target = 'unknown_target_xyz';

    const result = TutorialValidator.validateRegistry();
    assert.strictEqual(result.valid, false);
    const targetErrors = result.errors.filter(e => e.type === 'target');
    assert.strictEqual(targetErrors.length, 1);
    assert.ok(targetErrors[0].message.includes('unknown_target_xyz'));

    // Restore
    tutorial.steps[0].what.target = originalTarget;
});

test('TutorialValidator: validateRegistry() detects missing prerequisite', () => {
    const tutorial = TutorialRegistry.get('tutorial_hero_skills');
    const originalPrereqs = tutorial.prerequisites;
    tutorial.prerequisites = ['tutorial_nonexistent'];

    const result = TutorialValidator.validateRegistry();
    assert.strictEqual(result.valid, false);
    const refErrors = result.errors.filter(e => e.type === 'reference');
    assert.strictEqual(refErrors.length, 1);
    assert.ok(refErrors[0].message.includes('tutorial_nonexistent'));

    // Restore
    tutorial.prerequisites = originalPrereqs;
});

test('TutorialValidator: validateRegistry() detects unknown nextTutorialId', () => {
    const tutorial = TutorialRegistry.get('tutorial_expeditions');
    const originalNext = tutorial.nextTutorialId;
    tutorial.nextTutorialId = 'tutorial_nonexistent';

    const result = TutorialValidator.validateRegistry();
    assert.strictEqual(result.valid, false);
    const refErrors = result.errors.filter(e => e.type === 'reference' && e.message.includes('nextTutorialId'));
    assert.strictEqual(refErrors.length, 1);

    // Restore
    tutorial.nextTutorialId = originalNext;
});

test('TutorialValidator: validateRegistry() detects tutorial id mismatch', () => {
    const tutorial = TutorialRegistry.get('tutorial_hero_skills');
    const originalId = tutorial.id;
    tutorial.id = 'mismatched_id';

    const result = TutorialValidator.validateRegistry();
    assert.strictEqual(result.valid, false);
    const structErrors = result.errors.filter(e => e.type === 'structure' && e.message.includes('mismatch'));
    assert.strictEqual(structErrors.length, 1);

    // Restore
    tutorial.id = originalId;
});

// ─── i18n Validation ───────────────────────────────────────────────────────

test('TutorialValidator: _validateI18nKeys() detects missing translations', () => {
    const translations = {
        en: {
            tutorial_hero_skills_msg_navigate_heroes: 'Navigate to heroes',
            tutorial_hero_skills_msg_select_arthur: 'Select Arthur',
            tutorial_hero_stats_msg_assign_stats: 'Assign stats',
        },
        es: {
            tutorial_hero_skills_msg_navigate_heroes: 'Navegar a héroes',
            // Missing tutorial_hero_skills_msg_select_arthur and tutorial_hero_stats_msg_assign_stats
        }
    };

    // Directly test _validateI18nKeys with controlled inputs
    const controlledKeys = new Set([
        'tutorial_hero_skills_msg_navigate_heroes',
        'tutorial_hero_skills_msg_select_arthur',
        'tutorial_hero_stats_msg_assign_stats'
    ]);
    const errorsEn = TutorialValidator._validateI18nKeys(translations, ['en'], controlledKeys);
    assert.strictEqual(errorsEn.length, 0, 'en should have all keys');

    const errorsEs = TutorialValidator._validateI18nKeys(translations, ['es'], controlledKeys);
    assert.strictEqual(errorsEs.length, 2, 'es should be missing 2 keys');
    assert.ok(errorsEs.every(e => e.type === 'i18n'));
});

test('TutorialValidator: validateRegistry() validates i18n keys against real registry', () => {
    // Build complete translations from real registry keys
    const allKeys = new Set();
    for (const tutorial of TutorialRegistry.values()) {
        for (const step of tutorial.steps || []) {
            if (step.messages) {
                for (const key of step.messages) allKeys.add(key);
            }
        }
    }

    const translations = { en: {} };
    for (const key of allKeys) translations.en[key] = 'translated';

    const result = TutorialValidator.validateRegistry({
        translations,
        requiredLangs: ['en']
    });
    assert.strictEqual(result.valid, true, `Should pass with complete translations: ${result.errors.map(e => e.message).join(', ')}`);
});

test('TutorialValidator: findGhostKeys() finds unreferenced tutorial keys', () => {
    const translations = {
        en: {
            tutorial_hero_skills_msg_navigate_heroes: 'Navigate to heroes',
            tutorial_ghost_key_1: 'This is not referenced',
            tutorial_ghost_key_2: 'Neither is this',
            some_other_key: 'Not a tutorial key'
        }
    };

    const ghosts = TutorialValidator.findGhostKeys(translations, 'en');
    assert.deepStrictEqual(ghosts.sort(), ['tutorial_ghost_key_1', 'tutorial_ghost_key_2']);
});

// ─── Event Matching ────────────────────────────────────────────────────────

test('TutorialValidator: matchesEvent() returns true for exact match', () => {
    const advanceOn = { event: 'skill_learned', heroId: 'arthur' };
    const payload = { event: 'skill_learned', heroId: 'arthur', familyId: 'power_strike' };
    assert.strictEqual(TutorialValidator.matchesEvent(advanceOn, payload), true);
});

test('TutorialValidator: matchesEvent() returns false for mismatched event', () => {
    const advanceOn = { event: 'skill_learned' };
    const payload = { event: 'stat_assigned' };
    assert.strictEqual(TutorialValidator.matchesEvent(advanceOn, payload), false);
});

test('TutorialValidator: matchesEvent() returns false for mismatched filter', () => {
    const advanceOn = { event: 'skill_learned', heroId: 'arthur' };
    const payload = { event: 'skill_learned', heroId: 'merlin' };
    assert.strictEqual(TutorialValidator.matchesEvent(advanceOn, payload), false);
});

test('TutorialValidator: matchesEvent() returns true when no filters', () => {
    const advanceOn = { event: 'day_advanced' };
    const payload = { event: 'day_advanced', fromDay: 1, toDay: 2 };
    assert.strictEqual(TutorialValidator.matchesEvent(advanceOn, payload), true);
});

test('TutorialValidator: matchesEvent() returns false for null inputs', () => {
    assert.strictEqual(TutorialValidator.matchesEvent(null, { event: 'x' }), false);
    assert.strictEqual(TutorialValidator.matchesEvent({ event: 'x' }, null), false);
});

// ─── assertValid() ─────────────────────────────────────────────────────────

test('TutorialValidator: assertValid() throws on invalid registry', () => {
    const tutorial = TutorialRegistry.get('tutorial_hero_skills');
    const originalEvent = tutorial.steps[0].advanceOn.event;
    tutorial.steps[0].advanceOn.event = 'bad_event';

    assert.throws(() => {
        TutorialValidator.assertValid();
    }, /validation failed/);

    // Restore
    tutorial.steps[0].advanceOn.event = originalEvent;
});

test('TutorialValidator: assertValid() passes for valid registry', () => {
    // Should not throw
    TutorialValidator.assertValid();
});

// ─── Structure Validation ──────────────────────────────────────────────────

test('TutorialValidator: detects missing step id', () => {
    const badStep = {
        messages: ['test_msg'],
        advanceOn: { event: 'day_advanced' }
    };
    const errors = TutorialValidator._validateStep('test_tutorial', badStep, new Set());
    const structErrors = errors.filter(e => e.type === 'structure');
    assert.ok(structErrors.some(e => e.message.includes('missing id')));
});

test('TutorialValidator: detects non-array messages', () => {
    const badStep = {
        id: 'test_step',
        messages: 'not_an_array',
        advanceOn: { event: 'day_advanced' }
    };
    const errors = TutorialValidator._validateStep('test_tutorial', badStep, new Set());
    assert.ok(errors.some(e => e.message.includes('messages must be an array')));
});

test('TutorialValidator: detects missing trigger type', () => {
    const badTutorial = {
        id: 'bad_tutorial',
        trigger: { type: 'unknown_trigger' },
        steps: [{ id: 's1', advanceOn: { event: 'day_advanced' } }]
    };
    const errors = TutorialValidator._validateTutorial('bad_tutorial', badTutorial, new Set(['bad_tutorial']));
    assert.ok(errors.some(e => e.message.includes('Unknown trigger type')));
});
