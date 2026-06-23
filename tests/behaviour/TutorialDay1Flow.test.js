globalThis.localStorage = {
    getItem() { return null; },
    setItem() {},
    removeItem() {},
    clear() {}
};

import test from 'node:test';
import assert from 'node:assert';
import { GameEngine } from '../../js/engine/GameEngine.js';

test('Day 1 tutorial starts after book_first_closed event and advances through hero steps', () => {
    const engine = new GameEngine();
    engine.initialize();
    let state = engine.update();

    // Arthur should have the stable tutorial id
    const arthur = state.heroes[0];
    assert.ok(arthur, 'Arthur should exist');
    assert.strictEqual(arthur.id, 'arthur', 'Starting hero should have stable id "arthur" for tutorial targeting');

    // No tutorial should be active before the book is closed
    assert.strictEqual(state.tutorial, null, 'No tutorial should be active before book_first_closed');

    // Simulate closing the book on Day 1
    engine.recordEvent('book_first_closed', { day: 1 });
    state = engine.update();

    // Hero skills tutorial should be active
    assert.ok(state.tutorial, 'Tutorial should be active after book_first_closed');
    assert.strictEqual(state.tutorial.tutorialId, 'tutorial_hero_skills');
    assert.strictEqual(state.tutorial.stepId, 'navigate_heroes');

    // Report navigation to heroes tab
    const navResult = engine.reportTutorialEvent({ event: 'tab_changed', page: 'heroes' });
    assert.strictEqual(navResult, true, 'tab_changed event should advance tutorial');
    state = engine.update();
    assert.strictEqual(state.tutorial.stepId, 'select_arthur');

    // Report selecting Arthur
    const selectResult = engine.reportTutorialEvent({ event: 'hero_selected', heroId: 'arthur' });
    assert.strictEqual(selectResult, true, 'hero_selected event should advance tutorial');
    state = engine.update();
    assert.strictEqual(state.tutorial.stepId, 'learn_skill');

    // Report learning a skill
    const skillResult = engine.reportTutorialEvent({ event: 'skill_learned', heroId: 'arthur', familyId: 'power_strike' });
    assert.strictEqual(skillResult, true, 'skill_learned event should advance tutorial');
    state = engine.update();
    assert.strictEqual(state.tutorial.tutorialId, 'tutorial_hero_stats');
});

test('GameEngine exposes getTutorialState() matching tutorialService.getState()', () => {
    const engine = new GameEngine();
    engine.initialize();

    assert.strictEqual(
        engine.getTutorialState(),
        engine.tutorialService.getState(),
        'getTutorialState() should delegate to tutorialService.getState()'
    );
});
