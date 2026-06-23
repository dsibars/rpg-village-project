globalThis.localStorage = {
    getItem() { return null; },
    setItem() {},
    removeItem() {},
    clear() {}
};

import test from 'node:test';
import assert from 'node:assert';
import { TutorialService } from '../../../js/engine/tutorial/TutorialService.js';

function createMockPersistence() {
    const store = {};
    return {
        save(key, data) {
            store[key] = JSON.parse(JSON.stringify(data));
        },
        load(key, defaultValue = null) {
            return store[key] !== undefined ? JSON.parse(JSON.stringify(store[key])) : defaultValue;
        },
        _store: store
    };
}

function createService(slotIndex = null) {
    const persistence = createMockPersistence();
    const service = new TutorialService({ persistence, slotIndex });
    return { service, persistence };
}

// ─── start() ───────────────────────────────────────────────────────────────

test('TutorialService: start() begins a tutorial', () => {
    const { service } = createService();
    const result = service.start('tutorial_hero_skills');
    assert.strictEqual(result, true);
    assert.strictEqual(service.getState().tutorialId, 'tutorial_hero_skills');
    assert.strictEqual(service.getState().stepIndex, 0);
});

test('TutorialService: start() returns false for unknown tutorial', () => {
    const { service } = createService();
    const result = service.start('tutorial_nonexistent');
    assert.strictEqual(result, false);
    assert.strictEqual(service.getState(), null);
});

test('TutorialService: start() prevents starting another while one is active', () => {
    const { service } = createService();
    service.start('tutorial_hero_skills');
    const result = service.start('tutorial_hero_stats');
    assert.strictEqual(result, false);
    assert.strictEqual(service.getState().tutorialId, 'tutorial_hero_skills');
});

test('TutorialService: start() returns false if already completed', () => {
    const { service } = createService();
    service.start('tutorial_hero_skills');
    service.skip();
    const result = service.start('tutorial_hero_skills');
    assert.strictEqual(result, false);
});

test('TutorialService: start() with force=true restarts completed tutorial', () => {
    const { service } = createService();
    service.start('tutorial_hero_skills');
    service.skip(); // chains to tutorial_hero_stats
    service.skip(); // chains to tutorial_build_farm
    service.skip(); // chains to tutorial_expeditions
    service.skip(); // no more chain
    // Now all Day 1 tutorials are completed and nothing is active
    const result = service.start('tutorial_hero_skills', true);
    assert.strictEqual(result, true);
    assert.strictEqual(service.getState().tutorialId, 'tutorial_hero_skills');
});

// ─── advance() ──────────────────────────────────────────────────────────────

test('TutorialService: advance() progresses through steps', () => {
    const { service } = createService();
    service.start('tutorial_hero_skills');
    assert.strictEqual(service.getState().stepId, 'navigate_heroes');

    service.advance();
    assert.strictEqual(service.getState().stepId, 'select_arthur');

    service.advance();
    assert.strictEqual(service.getState().stepId, 'learn_skill');
});

test('TutorialService: advance() completes tutorial at final step and chains to next', () => {
    const { service } = createService();
    service.start('tutorial_hero_skills');
    service.advance(); // step 1
    service.advance(); // step 2
    const result = service.advance(); // step 3 (final) → completes, chains to hero_stats

    assert.strictEqual(result, true);
    // Chains to tutorial_hero_stats
    assert.strictEqual(service.getState().tutorialId, 'tutorial_hero_stats');
    assert.strictEqual(service.isCompleted('tutorial_hero_skills'), true);
});

test('TutorialService: advance() merges data into stepData', () => {
    const { service } = createService();
    service.start('tutorial_hero_skills');
    service.advance({ heroId: 'arthur' });
    const state = service.getRawState();
    assert.deepStrictEqual(state.stepData, { heroId: 'arthur' });
});

// ─── skip() ─────────────────────────────────────────────────────────────────

test('TutorialService: skip() marks tutorial as completed and chains', () => {
    const { service } = createService();
    service.start('tutorial_hero_skills');
    service.skip();
    assert.strictEqual(service.isCompleted('tutorial_hero_skills'), true);
    // Chains to tutorial_hero_stats
    assert.strictEqual(service.getState().tutorialId, 'tutorial_hero_stats');
});

test('TutorialService: skip() triggers nextTutorialId chain', () => {
    const { service } = createService();
    service.start('tutorial_hero_skills');
    service.skip();
    // tutorial_hero_skills has nextTutorialId: tutorial_hero_stats
    assert.strictEqual(service.getState().tutorialId, 'tutorial_hero_stats');
});

test('TutorialService: skip() returns false when no tutorial is active', () => {
    const { service } = createService();
    const result = service.skip();
    assert.strictEqual(result, false);
});

// ─── reportEvent() ──────────────────────────────────────────────────────────

test('TutorialService: reportEvent() advances on matching event', () => {
    const { service } = createService();
    service.start('tutorial_hero_skills');
    // Step 0: navigate_heroes, advanceOn: { event: 'tab_changed', page: 'heroes' }
    const result = service.reportEvent({ event: 'tab_changed', page: 'heroes' });
    assert.strictEqual(result, true);
    assert.strictEqual(service.getState().stepId, 'select_arthur');
});

test('TutorialService: reportEvent() ignores non-matching event type', () => {
    const { service } = createService();
    service.start('tutorial_hero_skills');
    const result = service.reportEvent({ event: 'skill_learned', heroId: 'arthur' });
    assert.strictEqual(result, false);
    assert.strictEqual(service.getState().stepId, 'navigate_heroes');
});

test('TutorialService: reportEvent() ignores event with mismatched filter', () => {
    const { service } = createService();
    service.start('tutorial_hero_skills');
    // Step 0 expects tab_changed with page: 'heroes', not 'village'
    const result = service.reportEvent({ event: 'tab_changed', page: 'village' });
    assert.strictEqual(result, false);
    assert.strictEqual(service.getState().stepId, 'navigate_heroes');
});

test('TutorialService: reportEvent() advances hero_stats tutorial on stat_assigned and chains', () => {
    const { service } = createService();
    service.start('tutorial_hero_stats');
    // Step 0: assign_stats, advanceOn: { event: 'stat_assigned', heroId: 'arthur' }
    const result = service.reportEvent({ event: 'stat_assigned', heroId: 'arthur', statId: 'baseStrength' });
    assert.strictEqual(result, true);
    // Completes tutorial_hero_stats and chains to tutorial_build_farm
    assert.strictEqual(service.getState().tutorialId, 'tutorial_build_farm');
    assert.strictEqual(service.isCompleted('tutorial_hero_stats'), true);
});

test('TutorialService: reportEvent() returns false when no tutorial active', () => {
    const { service } = createService();
    const result = service.reportEvent({ event: 'day_advanced' });
    assert.strictEqual(result, false);
});

// ─── evaluateTriggers() ─────────────────────────────────────────────────────

test('TutorialService: evaluateTriggers() starts new_game tutorial', () => {
    const { service } = createService();
    const gameState = { isNewGame: true };
    const result = service.evaluateTriggers(gameState);
    assert.strictEqual(result, true);
    assert.strictEqual(service.getState().tutorialId, 'tutorial_hero_skills');
});

test('TutorialService: evaluateTriggers() skips completed tutorials', () => {
    const { service } = createService();
    service.start('tutorial_hero_skills');
    service.skip();
    const result = service.evaluateTriggers({ isNewGame: true });
    // tutorial_hero_skills is completed, tutorial_hero_stats requires prerequisites
    assert.strictEqual(result, false);
});

test('TutorialService: evaluateTriggers() respects prerequisites', () => {
    const { service } = createService();
    // tutorial_hero_stats requires tutorial_hero_skills completed
    const result = service.evaluateTriggers({ isNewGame: true });
    // Only tutorial_hero_skills should start (it has no prerequisites)
    assert.strictEqual(result, true);
    assert.strictEqual(service.getState().tutorialId, 'tutorial_hero_skills');
});

test('TutorialService: evaluateTriggers() checks prerequisites for chained tutorial', () => {
    const { service } = createService();
    // Pre-complete the first 3 tutorials so tutorial_expeditions can trigger
    service.state.completedTutorialIds = ['tutorial_hero_skills', 'tutorial_hero_stats', 'tutorial_build_farm'];

    // tutorial_expeditions trigger is { type: 'new_game' }, not building_built
    const gameState = { isNewGame: true };
    const result = service.evaluateTriggers(gameState);
    assert.strictEqual(result, true);
    assert.strictEqual(service.getState().tutorialId, 'tutorial_expeditions');
});

test('TutorialService: evaluateTriggers() returns false when no triggers match', () => {
    const { service } = createService();
    const result = service.evaluateTriggers({ isNewGame: false });
    assert.strictEqual(result, false);
});

// ─── getState() ───────────────────────────────────────────────────────────────

test('TutorialService: getState() returns correct step view', () => {
    const { service } = createService();
    service.start('tutorial_hero_skills');
    const state = service.getState();
    assert.strictEqual(state.tutorialId, 'tutorial_hero_skills');
    assert.strictEqual(state.stepIndex, 0);
    assert.strictEqual(state.totalSteps, 3);
    assert.strictEqual(state.stepId, 'navigate_heroes');
    assert.deepStrictEqual(state.messages, ['tutorial_hero_skills_msg_navigate_heroes']);
    assert.deepStrictEqual(state.allowActions, []);
    assert.strictEqual(state.where.page, 'heroes');
    assert.strictEqual(state.what.target, 'footer_nav_heroes');
});

test('TutorialService: getState() returns null when no tutorial active', () => {
    const { service } = createService();
    assert.strictEqual(service.getState(), null);
});

// ─── Persistence ────────────────────────────────────────────────────────────

test('TutorialService: persistence round-trip', () => {
    const persistence = createMockPersistence();
    const service1 = new TutorialService({ persistence, slotIndex: 0 });
    service1.start('tutorial_hero_skills');
    service1.advance({ heroId: 'arthur' });

    // Simulate reload: create new service with same persistence
    const service2 = new TutorialService({ persistence, slotIndex: 0 });
    const state = service2.getState();
    assert.strictEqual(state.tutorialId, 'tutorial_hero_skills');
    assert.strictEqual(state.stepIndex, 1);
    assert.strictEqual(state.stepId, 'select_arthur');
    assert.deepStrictEqual(state.stepData, { heroId: 'arthur' });
});

test('TutorialService: slot-aware persistence keys', () => {
    const persistence = createMockPersistence();
    const service0 = new TutorialService({ persistence, slotIndex: 0 });
    const service1 = new TutorialService({ persistence, slotIndex: 1 });

    service0.start('tutorial_hero_skills');
    service1.start('tutorial_hero_stats');

    assert.strictEqual(service0.getState().tutorialId, 'tutorial_hero_skills');
    assert.strictEqual(service1.getState().tutorialId, 'tutorial_hero_stats');
});

test('TutorialService: loads default state when no persisted data', () => {
    const { service } = createService();
    const raw = service.getRawState();
    assert.strictEqual(raw.activeTutorialId, null);
    assert.strictEqual(raw.currentStepIndex, 0);
    assert.deepStrictEqual(raw.completedTutorialIds, []);
    assert.deepStrictEqual(raw.stepData, {});
});

// ─── Chain completion ─────────────────────────────────────────────────────────

test('TutorialService: completing tutorial_hero_skills chains to tutorial_hero_stats', () => {
    const { service } = createService();
    service.start('tutorial_hero_skills');
    service.advance(); // step 1
    service.advance(); // step 2
    service.advance(); // step 3 → completes, should chain to tutorial_hero_stats
    assert.strictEqual(service.getState().tutorialId, 'tutorial_hero_stats');
});

test('TutorialService: completing last tutorial in chain stops', () => {
    const { service } = createService();
    // Manually mark all prerequisites as complete
    service.state.completedTutorialIds = ['tutorial_hero_skills', 'tutorial_hero_stats', 'tutorial_build_farm'];
    service.start('tutorial_expeditions');
    service.advance(); // step 1
    service.advance(); // step 2
    service.advance(); // step 3
    service.advance(); // step 4 → completes, no nextTutorialId
    assert.strictEqual(service.getState(), null);
    assert.strictEqual(service.isCompleted('tutorial_expeditions'), true);
});

// ─── Edge cases ─────────────────────────────────────────────────────────────

test('TutorialService: getCompletedIds returns copy', () => {
    const { service } = createService();
    service.start('tutorial_hero_skills');
    service.skip();
    const ids = service.getCompletedIds();
    ids.push('tampered');
    assert.strictEqual(service.isCompleted('tampered'), false);
});

test('TutorialService: corrupted persistence data falls back to default', () => {
    const persistence = createMockPersistence();
    persistence.save('rpg_village_v1_tutorial_state', { invalid: 'data' });
    const service = new TutorialService({ persistence });
    const raw = service.getRawState();
    assert.strictEqual(raw.activeTutorialId, null);
    assert.deepStrictEqual(raw.completedTutorialIds, []);
});

test('TutorialService: advance() on missing tutorial clears state gracefully', () => {
    const { service } = createService();
    // Manually corrupt activeTutorialId to a non-existent one
    service.state.activeTutorialId = 'tutorial_nonexistent';
    const result = service.advance();
    assert.strictEqual(result, false);
    assert.strictEqual(service.getState(), null);
});
