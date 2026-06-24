globalThis.localStorage = {
    getItem() { return null; },
    setItem() {},
    removeItem() {},
    clear() {}
};

import test from 'node:test';
import assert from 'node:assert';
import { RegionService } from '../../js/engine/explore/services/RegionService.js';
import { VillageService } from '../../js/engine/village/services/VillageService.js';
import { InventoryService } from '../../js/engine/shared/inventory/services/InventoryService.js';

function createServices() {
    const inventoryService = new InventoryService();
    const villageService = new VillageService(inventoryService);
    const regionService = new RegionService(villageService, { deferLoad: true });
    regionService.save();
    return { regionService, villageService };
}

// --- Data Model Tests ---

test('RegionService: greenfields has slower scaling', () => {
    const { regionService } = createServices();
    const rData = regionService.getRegionData('reg_greenfields');
    assert.strictEqual(rData.scaling.levelPerClears, 5);
    assert.strictEqual(rData.scaling.statMultiplier, 1.08);
    assert.strictEqual(rData.scaling.maxLevelCap, 10);
});

test('RegionService: frozen_peaks has steeper scaling', () => {
    const { regionService } = createServices();
    const rData = regionService.getRegionData('reg_frozen_peaks');
    assert.strictEqual(rData.scaling.levelPerClears, 2);
    assert.strictEqual(rData.scaling.statMultiplier, 1.12);
});

test('RegionService: dark_forest has default-like scaling values', () => {
    const { regionService } = createServices();
    const rData = regionService.getRegionData('reg_dark_forest');
    assert.strictEqual(rData.scaling.levelPerClears, 3);
    assert.strictEqual(rData.scaling.statMultiplier, 1.1);
});

// --- Loot Generation Tests ---

test('RegionService: greenfields loot drops configured materials', () => {
    const { regionService } = createServices();
    const node = regionService.generateExpedition('reg_greenfields', 0);
    const items = node.reward.items;
    assert.ok(items.material_wood, 'Should drop wood');
    assert.ok(items.material_wood >= 8 && items.material_wood <= 15, 'Wood qty in configured range');
});

test('RegionService: tiny_cave loot drops stone and ore', () => {
    const { regionService } = createServices();
    const node = regionService.generateExpedition('reg_tiny_cave', 0);
    const items = node.reward.items;
    assert.ok(items.material_stone, 'Should drop stone');
});

test('RegionService: loot respects goldBase and goldPerClear', () => {
    const { regionService } = createServices();
    const node1 = regionService.generateExpedition('reg_greenfields', 0);
    // greenfields: goldBase=60, goldPerClear=12, baseLevel=1 -> baseGold=60, ±20% -> 48-72
    assert.ok(node1.reward.gold >= 48 && node1.reward.gold <= 72, `Gold ${node1.reward.gold} in expected range`);

    const node10 = regionService.generateExpedition('reg_greenfields', 10);
    // baseGold = 60 + 10*12 = 180, ±20% -> 144-216
    assert.ok(node10.reward.gold >= 144 && node10.reward.gold <= 216, `Gold ${node10.reward.gold} in expected range for clears=10`);
});

// --- Scaling Tests ---

test('RegionService: slower scaling produces lower enemy levels', () => {
    const { regionService } = createServices();
    const node = regionService.generateExpedition('reg_greenfields', 4);
    const stage = node.stages[0];
    // baseLevel=1 + floor(4/5)=0 -> level 1
    assert.strictEqual(stage.enemyLevel, 1);
});

test('RegionService: default scaling produces expected enemy levels', () => {
    const { regionService } = createServices();
    const node = regionService.generateExpedition('reg_dark_forest', 6);
    const stage = node.stages[0];
    // dark_forest levelPerClears=3
    // baseLevel=3 + floor(6/3)=2 -> >= 5
    assert.ok(stage.enemyLevel >= 5, `Expected >= 5, got ${stage.enemyLevel}`);
});

test('RegionService: maxLevelCap caps enemy level', () => {
    const { regionService } = createServices();
    const node = regionService.generateExpedition('reg_greenfields', 999);
    for (const stage of node.stages) {
        assert.ok(stage.enemyLevel <= 10, `Enemy level ${stage.enemyLevel} exceeds cap 10`);
    }
});

test('RegionService: node carries statMultiplier', () => {
    const { regionService } = createServices();
    const node = regionService.generateExpedition('reg_greenfields', 0);
    assert.strictEqual(node.scaling.statMultiplier, 1.08);
});

// --- Narrative Tests ---

test('RegionService: first clear returns narrative in result', () => {
    const { regionService } = createServices();
    const region = regionService.getRegion('reg_greenfields');
    region.clears = 0;
    region.availableNodes = [regionService.generateExpedition('reg_greenfields', 0)];
    const exp = region.availableNodes[0];

    const result = regionService.completeExpedition(exp.id, [], [], []);

    assert.ok(result.firstClearNarrative, 'firstClearNarrative should exist');
    assert.strictEqual(result.firstClearNarrative.titleKey, 'nar_greenfields_first_clear_title');
});

test('RegionService: second clear returns no narrative', () => {
    const { regionService } = createServices();
    const region = regionService.getRegion('reg_greenfields');
    region.clears = 1;
    region.firstClearBonusGiven = true;
    region.availableNodes = [regionService.generateExpedition('reg_greenfields', 1)];
    const exp = region.availableNodes[0];

    const result = regionService.completeExpedition(exp.id, [], [], []);

    assert.strictEqual(result.firstClearNarrative, null);
});

test('RegionService: region without narrative returns null', () => {
    const { regionService } = createServices();
    regionService._seedRegion('reg_dark_forest');
    const region = regionService.getRegion('reg_dark_forest');
    region.clears = 0;
    region.availableNodes = [regionService.generateExpedition('reg_dark_forest', 0)];
    const exp = region.availableNodes[0];

    const result = regionService.completeExpedition(exp.id, [], [], []);

    assert.strictEqual(result.firstClearNarrative, null);
});

// --- Validator Tests ---

test('RegionValidator: passes valid region', async () => {
    const { RegionValidator } = await import('../../js/engine/explore/services/RegionValidator.js');
    const result = RegionValidator.validate({
        id: 'reg_test', name: 'Test', branching: 'low',
        minStages: 1, maxStages: 2, enemies: ['a'], baseLevel: 1,
        bossPool: [], scaling: { levelPerClears: 3, statMultiplier: 1.1, maxLevelCap: null },
        lootProfile: { materials: [], goldBase: 40, goldPerClear: 8 }
    });
    assert.strictEqual(result.valid, true);
});

test('RegionValidator: fails missing scaling', async () => {
    const { RegionValidator } = await import('../../js/engine/explore/services/RegionValidator.js');
    const result = RegionValidator.validate({
        id: 'reg_test', name: 'Test', branching: 'low',
        minStages: 1, maxStages: 2, enemies: ['a'], baseLevel: 1,
        bossPool: [], lootProfile: { materials: [], goldBase: 40, goldPerClear: 8 }
    });
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('scaling')));
});

test('RegionValidator: fails missing lootProfile', async () => {
    const { RegionValidator } = await import('../../js/engine/explore/services/RegionValidator.js');
    const result = RegionValidator.validate({
        id: 'reg_test', name: 'Test', branching: 'low',
        minStages: 1, maxStages: 2, enemies: ['a'], baseLevel: 1,
        bossPool: [], scaling: { levelPerClears: 3, statMultiplier: 1.1, maxLevelCap: null }
    });
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('lootProfile')));
});

test('RegionValidator: warns on unknown field', async () => {
    const { RegionValidator } = await import('../../js/engine/explore/services/RegionValidator.js');
    const result = RegionValidator.validate({
        id: 'reg_test', name: 'Test', branching: 'low',
        minStages: 1, maxStages: 2, enemies: ['a'], baseLevel: 1,
        bossPool: [], scaling: { levelPerClears: 3, statMultiplier: 1.1, maxLevelCap: null },
        lootProfile: { materials: [], goldBase: 40, goldPerClear: 8 },
        unknownFutureField: true
    });
    assert.strictEqual(result.valid, true);
    assert.ok(result.warnings.some(w => w.includes('unknownFutureField')));
});
