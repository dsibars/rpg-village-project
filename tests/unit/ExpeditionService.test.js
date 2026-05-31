globalThis.localStorage = {
    getItem() { return null; },
    setItem() {},
    removeItem() {},
    clear() {}
};

import test from 'node:test';
import assert from 'node:assert';
import { ExpeditionService } from '../../js/engine/explore/services/ExpeditionService.js';
import { BattleService } from '../../js/engine/shared/combat/services/BattleService.js';
import { HeroService } from '../../js/engine/heroes/services/HeroService.js';
import { VillageService } from '../../js/engine/village/services/VillageService.js';
import { InventoryService } from '../../js/engine/shared/inventory/services/InventoryService.js';

function createServices() {
    const inventoryService = new InventoryService();
    const villageService = new VillageService(inventoryService);
    const heroService = new HeroService(inventoryService);
    const battleService = new BattleService(inventoryService);
    const expeditionService = new ExpeditionService(
        battleService, heroService, villageService, inventoryService
    );
    // Reset state to known defaults
    expeditionService.state.completedIds = [];
    expeditionService.state.activeExpeditions = [];
    expeditionService.state.expeditionTurnIndex = 0;
    expeditionService.state.activeCombatExpeditionId = null;
    expeditionService.save();
    return { expeditionService, heroService, villageService };
}

test('ExpeditionService: Single expedition assignment', () => {
    const { expeditionService, heroService } = createServices();
    const hero = heroService.add({ name: 'Test Hero', origin: 'origin_warrior', level: 1 }).data;
    const exp = expeditionService.getExpeditions()[0];

    const result = expeditionService.assignExpedition(exp.id, [hero.id]);
    assert.strictEqual(result.success, true);
    assert.strictEqual(expeditionService.state.activeExpeditions.length, 1);
    assert.strictEqual(expeditionService.state.activeExpeditions[0].heroIds[0], hero.id);
});

test('ExpeditionService: Concurrent expedition limit', () => {
    const { expeditionService, heroService, villageService } = createServices();
    // No explorer guild, so max = 1
    villageService.state.infrastructure.explorer_guild = 0;
    villageService.save();

    const hero1 = heroService.add({ name: 'Hero 1', origin: 'origin_warrior', level: 1 }).data;
    const hero2 = heroService.add({ name: 'Hero 2', origin: 'origin_warrior', level: 1 }).data;
    const exps = expeditionService.getExpeditions();

    const r1 = expeditionService.assignExpedition(exps[0].id, [hero1.id]);
    assert.strictEqual(r1.success, true);

    const r2 = expeditionService.assignExpedition(exps[0].id, [hero2.id]);
    // Same expedition is allowed (updating assignment)
    assert.strictEqual(r2.success, true);

    // Different expedition should fail since max = 1
    const r3 = expeditionService.assignExpedition('some_other_exp', [hero2.id]);
    assert.strictEqual(r3.success, false);
    assert.strictEqual(r3.error, 'explore_error_expeditions_max');
});

test('ExpeditionService: Explorer guild increases limit', () => {
    const { expeditionService, heroService, villageService } = createServices();
    villageService.state.infrastructure.explorer_guild = 1;
    villageService.save();

    const hero1 = heroService.add({ name: 'Hero 1', origin: 'origin_warrior', level: 1 }).data;
    const hero2 = heroService.add({ name: 'Hero 2', origin: 'origin_warrior', level: 1 }).data;
    const exps = expeditionService.getExpeditions();

    // Need a second available expedition node
    expeditionService.state.regions.reg_greenfields.availableNodes.push({
        id: 'exp_test_second',
        name: 'Test Node',
        regionId: 'reg_greenfields',
        isStory: false,
        reward: { gold: 10 },
        stages: [{ type: 'battle', enemies: ['slime_green'] }]
    });

    const r1 = expeditionService.assignExpedition(exps[0].id, [hero1.id]);
    assert.strictEqual(r1.success, true);

    const r2 = expeditionService.assignExpedition('exp_test_second', [hero2.id]);
    assert.strictEqual(r2.success, true);
    assert.strictEqual(expeditionService.state.activeExpeditions.length, 2);
});

test('ExpeditionService: Hero cannot be on two expeditions', () => {
    const { expeditionService, heroService, villageService } = createServices();
    villageService.state.infrastructure.explorer_guild = 1;
    villageService.save();

    const hero = heroService.add({ name: 'Hero 1', origin: 'origin_warrior', level: 1 }).data;
    expeditionService.state.regions.reg_greenfields.availableNodes.push({
        id: 'exp_test_second',
        name: 'Test Node',
        regionId: 'reg_greenfields',
        isStory: false,
        reward: { gold: 10 },
        stages: [{ type: 'battle', enemies: ['slime_green'] }]
    });

    const r1 = expeditionService.assignExpedition('exp_tutorial_cave', [hero.id]);
    assert.strictEqual(r1.success, true);

    const r2 = expeditionService.assignExpedition('exp_test_second', [hero.id]);
    assert.strictEqual(r2.success, false);
    assert.strictEqual(r2.error, 'explore_error_hero_busy_expedition');
});

test('ExpeditionService: Round-robin day processing', () => {
    const { expeditionService, heroService, villageService } = createServices();
    villageService.state.infrastructure.explorer_guild = 1;
    villageService.save();

    const hero1 = heroService.add({ name: 'Hero 1', origin: 'origin_warrior', level: 1 }).data;
    const hero2 = heroService.add({ name: 'Hero 2', origin: 'origin_warrior', level: 1 }).data;

    expeditionService.state.regions.reg_greenfields.availableNodes.push({
        id: 'exp_test_second',
        name: 'Test Node',
        regionId: 'reg_greenfields',
        isStory: false,
        reward: { gold: 10 },
        stages: [
            { type: 'battle', enemies: ['slime_green'] },
            { type: 'battle', enemies: ['slime_green'] }
        ]
    });

    expeditionService.assignExpedition('exp_tutorial_cave', [hero1.id]);
    expeditionService.assignExpedition('exp_test_second', [hero2.id]);

    // First day: should process expedition at index 0
    const day1 = expeditionService.processDay();
    assert.strictEqual(day1.data.expId, 'exp_tutorial_cave');
    assert.strictEqual(expeditionService.state.expeditionTurnIndex, 1);

    // Resolve the battle quickly by auto-playing
    expeditionService.battleService.autoBattle = true;
    while (!expeditionService.battleService.isOver) {
        expeditionService.battleService.nextTurn();
    }
    expeditionService.resolveBattle();

    // Second day: should process expedition at index 1
    const day2 = expeditionService.processDay();
    assert.strictEqual(day2.data.expId, 'exp_test_second');
    assert.strictEqual(expeditionService.state.expeditionTurnIndex, 0);
});

test('ExpeditionService: Retire specific expedition', () => {
    const { expeditionService, heroService } = createServices();
    const hero = heroService.add({ name: 'Hero 1', origin: 'origin_warrior', level: 1 }).data;
    expeditionService.assignExpedition('exp_tutorial_cave', [hero.id]);
    assert.strictEqual(expeditionService.state.activeExpeditions.length, 1);

    expeditionService.retire('exp_tutorial_cave');
    assert.strictEqual(expeditionService.state.activeExpeditions.length, 0);
});

test('ExpeditionService: first clear grants permanent speed boost', () => {
    const { expeditionService, heroService } = createServices();
    const hero = heroService.add({ name: 'Test Hero', origin: 'origin_warrior', level: 1 }).data;
    const initialSpeed = hero.baseSpeed;

    const exp = expeditionService.getExpeditions()[0];
    const activeExp = {
        id: exp.id,
        currentStage: exp.stages.length,
        heroIds: [hero.id],
        status: 'assigned'
    };
    expeditionService.state.activeExpeditions.push(activeExp);
    expeditionService._finishExpedition(exp, activeExp);

    assert.strictEqual(hero.baseSpeed, initialSpeed + 2);
    assert.strictEqual(expeditionService.state.regions[exp.regionId].firstClearBonusGiven, true);
});

test('ExpeditionService: second clear does not grant speed boost', () => {
    const { expeditionService, heroService } = createServices();
    const hero = heroService.add({ name: 'Test Hero', origin: 'origin_warrior', level: 1 }).data;

    // First clear
    const exp = expeditionService.getExpeditions()[0];
    const activeExp1 = {
        id: exp.id,
        currentStage: exp.stages.length,
        heroIds: [hero.id],
        status: 'assigned'
    };
    expeditionService.state.activeExpeditions.push(activeExp1);
    expeditionService._finishExpedition(exp, activeExp1);
    const speedAfterFirst = hero.baseSpeed;

    // Second clear
    const exp2 = expeditionService._createProceduralNode(exp.regionId, expeditionService._getRegionData(exp.regionId), 1);
    expeditionService.state.regions[exp.regionId].availableNodes.push(exp2);
    const activeExp2 = {
        id: exp2.id,
        currentStage: exp2.stages.length,
        heroIds: [hero.id],
        status: 'assigned'
    };
    expeditionService.state.activeExpeditions.push(activeExp2);
    expeditionService._finishExpedition(exp2, activeExp2);

    assert.strictEqual(hero.baseSpeed, speedAfterFirst);
});

test('ExpeditionService: consumable drops include MP potions', () => {
    const { expeditionService } = createServices();
    const drops = expeditionService._generateConsumableDrops('reg_greenfields');

    const mpPotion = drops.find(d => d.id === 'tiny_mp_potion');
    assert.ok(mpPotion, 'Should drop tiny_mp_potion');
    assert.ok(mpPotion.qty >= 1 && mpPotion.qty <= 2, 'Should drop 1-2 MP potions for level 1 region');
});

test('ExpeditionService: higher level regions drop more MP potions', () => {
    const { expeditionService } = createServices();
    const drops = expeditionService._generateConsumableDrops('reg_frozen_peaks');

    const mpPotion = drops.find(d => d.id === 'tiny_mp_potion');
    assert.ok(mpPotion, 'Should drop tiny_mp_potion');
    assert.ok(mpPotion.qty >= 3 && mpPotion.qty <= 4, 'Should drop 3-4 MP potions for level 5 region');
});
