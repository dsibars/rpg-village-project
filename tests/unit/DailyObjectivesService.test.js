globalThis.localStorage = {
    getItem() { return null; },
    setItem() {},
    removeItem() {},
    clear() {}
};

import test from 'node:test';
import assert from 'node:assert';
import { DailyObjectivesService } from '../../js/engine/daily/services/DailyObjectivesService.js';
import { InventoryService } from '../../js/engine/shared/inventory/services/InventoryService.js';

test('DailyObjectivesService: generateForDay creates 4 pending choices', () => {
    const inventory = new InventoryService();
    const service = new DailyObjectivesService(inventory);

    service.generateForDay(1);
    const state = service.getState();

    assert.strictEqual(state.pendingChoices.length, 4);
    assert.strictEqual(state.objectives.length, 0);
    assert.strictEqual(state.status, 'choosing');
    state.pendingChoices.forEach(obj => {
        assert.ok(obj.id);
        assert.ok(obj.label);
        assert.ok(obj.target > 0);
        assert.strictEqual(obj.progress, 0);
        assert.strictEqual(obj.completed, false);
        assert.ok(obj.reward);
    });
});

test('DailyObjectivesService: generateForDay is idempotent for same day', () => {
    const inventory = new InventoryService();
    const service = new DailyObjectivesService(inventory);

    service.generateForDay(1);
    const first = service.getState().pendingChoices.map(o => o.id);

    service.generateForDay(1);
    const second = service.getState().pendingChoices.map(o => o.id);

    assert.deepStrictEqual(first, second);
});

test('DailyObjectivesService: generateForDay regenerates for new day', () => {
    const inventory = new InventoryService();
    const service = new DailyObjectivesService(inventory);

    service.generateForDay(1);
    const first = service.getState().pendingChoices.map(o => o.id);

    service.generateForDay(2);
    const second = service.getState().pendingChoices.map(o => o.id);

    // Not guaranteed to be different, but day and state should update
    assert.strictEqual(service.getState().day, 2);
});

test('DailyObjectivesService: pickObjectives selects 2 from 4', () => {
    const inventory = new InventoryService();
    const service = new DailyObjectivesService(inventory);
    service.generateForDay(1);

    const choices = service.getState().pendingChoices;
    const result = service.pickObjectives([choices[0].id, choices[1].id]);
    assert.strictEqual(result.success, true);
    assert.strictEqual(service.getState().objectives.length, 2);
    assert.strictEqual(service.getState().pendingChoices.length, 0);
    assert.strictEqual(service.getState().status, 'active');
});

test('DailyObjectivesService: pickObjectives fails with wrong count', () => {
    const inventory = new InventoryService();
    const service = new DailyObjectivesService(inventory);
    service.generateForDay(1);

    const choices = service.getState().pendingChoices;
    const result = service.pickObjectives([choices[0].id]);
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'daily_error_selection_count_invalid');
});

test('DailyObjectivesService: pickObjectives fails with invalid ids', () => {
    const inventory = new InventoryService();
    const service = new DailyObjectivesService(inventory);
    service.generateForDay(1);

    const result = service.pickObjectives(['fake_id_1', 'fake_id_2']);
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'daily_error_objective_selection_invalid');
});

test('DailyObjectivesService: track increments progress', () => {
    const inventory = new InventoryService();
    const service = new DailyObjectivesService(inventory);
    service.generateForDay(1);

    const choices = service.getState().pendingChoices;
    service.pickObjectives([choices[0].id, choices[1].id]);

    // Find an objective we can track
    const objectives = service.getObjectives();
    const targetObj = objectives.find(o => o.id === 'defeat_enemies') || objectives[0];

    const before = targetObj.progress;
    service.track(targetObj.id, 1);
    assert.strictEqual(targetObj.progress, before + 1);
});

test('DailyObjectivesService: track caps at target', () => {
    const inventory = new InventoryService();
    const service = new DailyObjectivesService(inventory);
    service.generateForDay(1);

    const choices = service.getState().pendingChoices;
    service.pickObjectives([choices[0].id, choices[1].id]);

    const objectives = service.getObjectives();
    const targetObj = objectives[0];

    service.track(targetObj.id, 999);
    assert.strictEqual(targetObj.progress, targetObj.target);
    assert.strictEqual(targetObj.completed, true);
});

test('DailyObjectivesService: track only affects matching objectives', () => {
    const inventory = new InventoryService();
    const service = new DailyObjectivesService(inventory);
    service.generateForDay(1);

    const choices = service.getState().pendingChoices;
    service.pickObjectives([choices[0].id, choices[1].id]);

    const objectives = service.getObjectives();
    const objA = objectives[0];
    const objB = objectives[1] || objectives[0];

    const beforeB = objB.progress;
    service.track(objA.id, 1);

    if (objA.id !== objB.id) {
        assert.strictEqual(objB.progress, beforeB);
    }
});

test('DailyObjectivesService: all-completed bonus grants materials', () => {
    const inventory = new InventoryService();
    const service = new DailyObjectivesService(inventory);
    service.generateForDay(1);

    const choices = service.getState().pendingChoices;
    service.pickObjectives([choices[0].id, choices[1].id]);

    const objectives = service.getObjectives();
    objectives.forEach(obj => {
        service.track(obj.id, obj.target);
    });

    const state = service.getState();
    assert.strictEqual(state.allCompleted, true);
    assert.ok(inventory.getItemCount('material_wood') >= 20);
    assert.ok(inventory.getItemCount('material_stone') >= 10);
});

test('DailyObjectivesService: all-completed bonus fires only once per day', () => {
    const inventory = new InventoryService();
    const service = new DailyObjectivesService(inventory);
    service.generateForDay(1);

    const choices = service.getState().pendingChoices;
    service.pickObjectives([choices[0].id, choices[1].id]);

    const objectives = service.getObjectives();
    objectives.forEach(obj => service.track(obj.id, obj.target));

    const woodAfterFirst = inventory.getItemCount('material_wood');

    // Track again — should not grant more
    objectives.forEach(obj => service.track(obj.id, 1));
    const woodAfterSecond = inventory.getItemCount('material_wood');

    assert.strictEqual(woodAfterFirst, woodAfterSecond);
});

test('DailyObjectivesService: claimReward success', () => {
    const inventory = new InventoryService();
    const service = new DailyObjectivesService(inventory);
    service.generateForDay(1);

    const choices = service.getState().pendingChoices;
    service.pickObjectives([choices[0].id, choices[1].id]);

    const obj = service.getObjectives()[0];
    service.track(obj.id, obj.target);

    const result = service.claimReward(obj.id);
    assert.strictEqual(result.success, true);
    assert.ok(result.data.reward);
});

test('DailyObjectivesService: claimReward fails if not completed', () => {
    const inventory = new InventoryService();
    const service = new DailyObjectivesService(inventory);
    service.generateForDay(1);

    const choices = service.getState().pendingChoices;
    service.pickObjectives([choices[0].id, choices[1].id]);

    const obj = service.getObjectives()[0];
    const result = service.claimReward(obj.id);
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'daily_error_reward_not_available');
});

test('DailyObjectivesService: claimReward fails if already claimed', () => {
    const inventory = new InventoryService();
    const service = new DailyObjectivesService(inventory);
    service.generateForDay(1);

    const choices = service.getState().pendingChoices;
    service.pickObjectives([choices[0].id, choices[1].id]);

    const obj = service.getObjectives()[0];
    service.track(obj.id, obj.target);
    service.claimReward(obj.id);

    const result = service.claimReward(obj.id);
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'daily_error_reward_not_available');
});

test('DailyObjectivesService: getState reflects completion', () => {
    const inventory = new InventoryService();
    const service = new DailyObjectivesService(inventory);
    service.generateForDay(1);

    let state = service.getState();
    assert.strictEqual(state.allCompleted, false);
    assert.strictEqual(state.status, 'choosing');

    const choices = service.getState().pendingChoices;
    service.pickObjectives([choices[0].id, choices[1].id]);

    service.getObjectives().forEach(obj => service.track(obj.id, obj.target));
    state = service.getState();
    assert.strictEqual(state.allCompleted, true);
    assert.strictEqual(state.status, 'active');
});
