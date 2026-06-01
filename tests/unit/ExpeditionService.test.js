globalThis.localStorage = {
    getItem() { return null; },
    setItem() {},
    removeItem() {},
    clear() {}
};

import test from 'node:test';
import assert from 'node:assert';
import { ExpeditionService } from '../../js/engine/explore/services/ExpeditionService.js';
import { RegionService } from '../../js/engine/explore/services/RegionService.js';
import { BattleService } from '../../js/engine/shared/combat/services/BattleService.js';
import { HeroService } from '../../js/engine/heroes/services/HeroService.js';
import { VillageService } from '../../js/engine/village/services/VillageService.js';
import { InventoryService } from '../../js/engine/shared/inventory/services/InventoryService.js';

function createServices() {
    const inventoryService = new InventoryService();
    const villageService = new VillageService(inventoryService);
    const heroService = new HeroService(inventoryService);
    const battleService = new BattleService(inventoryService);
    const regionService = new RegionService(villageService, { deferLoad: true });
    const expeditionService = new ExpeditionService(
        battleService, heroService, villageService, inventoryService, regionService, { deferLoad: true }
    );
    // Reset state to known defaults
    expeditionService.state.completedIds = [];
    expeditionService.state.activeExpeditions = [];
    expeditionService.state.expeditionTurnIndex = 0;
    expeditionService.state.activeCombatExpeditionId = null;
    expeditionService.save();
    regionService.save();
    return { regionService, expeditionService, heroService, villageService };
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
    const { expeditionService, heroService, villageService, regionService } = createServices();
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
    const { expeditionService, heroService, villageService, regionService } = createServices();
    villageService.state.infrastructure.explorer_guild = 1;
    villageService.save();

    const hero1 = heroService.add({ name: 'Hero 1', origin: 'origin_warrior', level: 1 }).data;
    const hero2 = heroService.add({ name: 'Hero 2', origin: 'origin_warrior', level: 1 }).data;
    const exps = expeditionService.getExpeditions();

    // Need a second available expedition node — generateExpedition auto-adds to availableNodes
    regionService.generateExpedition('reg_greenfields', 0);

    const r1 = expeditionService.assignExpedition(exps[0].id, [hero1.id]);
    assert.strictEqual(r1.success, true);

    // Get fresh list after generating the second expedition
    const updatedExps = expeditionService.getExpeditions();
    const secondExp = updatedExps.find(e => e.id !== exps[0].id);

    const r2 = expeditionService.assignExpedition(secondExp.id, [hero2.id]);
    assert.strictEqual(r2.success, true);
    assert.strictEqual(expeditionService.state.activeExpeditions.length, 2);
});

test('ExpeditionService: Hero cannot be on two expeditions', () => {
    const { expeditionService, heroService, villageService, regionService } = createServices();
    villageService.state.infrastructure.explorer_guild = 1;
    villageService.save();

    const hero = heroService.add({ name: 'Hero 1', origin: 'origin_warrior', level: 1 }).data;
    // generateExpedition auto-adds to availableNodes
    const secondNode = regionService.generateExpedition('reg_greenfields', 0);

    const r1 = expeditionService.assignExpedition('exp_tutorial_cave', [hero.id]);
    assert.strictEqual(r1.success, true);

    const r2 = expeditionService.assignExpedition(secondNode.id, [hero.id]);
    assert.strictEqual(r2.success, false);
    assert.strictEqual(r2.error, 'explore_error_hero_busy_expedition');
});

test('ExpeditionService: Round-robin day processing', () => {
    const { expeditionService, heroService, villageService, regionService } = createServices();
    villageService.state.infrastructure.explorer_guild = 1;
    villageService.save();

    const hero1 = heroService.add({ name: 'Hero 1', origin: 'origin_warrior', level: 1 }).data;
    const hero2 = heroService.add({ name: 'Hero 2', origin: 'origin_warrior', level: 1 }).data;

    // generateExpedition auto-adds — use a specific node shape for predictable stages
    const region = regionService.getRegion('reg_greenfields');
    region.availableNodes.push({
        id: 'exp_test_second',
        name: 'Test Node',
        regionId: 'reg_greenfields',
        isStory: false,
        status: 'available',
        parentId: null,
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
    const { expeditionService, heroService, regionService } = createServices();
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
    assert.strictEqual(regionService.getRegion(exp.regionId).firstClearBonusGiven, true);
});

test('ExpeditionService: second clear does not grant speed boost', () => {
    const { expeditionService, heroService, regionService } = createServices();
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

    // Second clear — use regionService.generateExpedition (auto-adds to availableNodes)
    const exp2 = regionService.generateExpedition(exp.regionId, 1);
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

test('ExpeditionService: narrative queue state initializes empty', () => {
    const { expeditionService } = createServices();
    assert.deepStrictEqual(expeditionService.getPendingNarratives(), []);
});

test('ExpeditionService: _enqueueNarrative adds to queue', () => {
    const { expeditionService } = createServices();
    expeditionService._enqueueNarrative({ id: 'nar_test', titleKey: 't', loreKey: 'l', era: 1 });
    assert.strictEqual(expeditionService.getPendingNarratives().length, 1);
    assert.strictEqual(expeditionService.getPendingNarratives()[0].titleKey, 't');
});

test('ExpeditionService: _enqueueNarrative deduplicates by titleKey', () => {
    const { expeditionService } = createServices();
    expeditionService._enqueueNarrative({ id: 'nar_a', titleKey: 't', loreKey: 'l', era: 1 });
    expeditionService._enqueueNarrative({ id: 'nar_b', titleKey: 't', loreKey: 'l', era: 1 });
    assert.strictEqual(expeditionService.getPendingNarratives().length, 1);
});

test('ExpeditionService: consumePendingNarratives clears queue', () => {
    const { expeditionService } = createServices();
    expeditionService._enqueueNarrative({ id: 'nar_test', titleKey: 't', loreKey: 'l', era: 1 });
    expeditionService.consumePendingNarratives();
    assert.deepStrictEqual(expeditionService.getPendingNarratives(), []);
});

test('ExpeditionService: resolving story mission effects', () => {
    const { expeditionService, villageService, heroService, regionService } = createServices();

    // Mock an expedition with all 5 types of effects
    const mockExp = {
        id: 'exp_test_story',
        name: 'Test Story',
        regionId: 'reg_greenfields',
        isStory: true,
        reward: {
            effects: [
                { type: 'hero', name: 'HeroTest', origin: 'origin_thief', level: 3, avatar: 'test.png' },
                { type: 'villagers', count: 4 },
                { type: 'building_blueprint', buildingId: 'blacksmith' },
                { type: 'region_unlock', regionId: 'reg_mystic_ruins' },
                { type: 'narrative', id: 'nar_test_story', titleKey: 't_key', loreKey: 'l_key', era: 2 }
            ]
        }
    };

    // Call finishExpedition or directly test effect resolution
    const mockHero = heroService.add({ name: 'Arthur', origin: 'origin_warrior', level: 1 }).data;

    // Before effects execution checks
    const initialHeroesCount = heroService.list().length;
    const initialVillagersCount = villageService.getState().population.total;
    assert.strictEqual(villageService.getState().infrastructure.blacksmith, undefined);
    assert.strictEqual(regionService.getRegion('reg_mystic_ruins'), null);
    assert.strictEqual(expeditionService.getPendingNarratives().length, 0);

    expeditionService.state.activeExpeditions = [mockExp];
    expeditionService.state.activeCombatExpeditionId = mockExp.id;

    // Simulate completion
    const result = expeditionService._finishExpedition(mockExp, { id: mockExp.id, heroIds: [mockHero.id] });
    assert.ok(result.success);

    // Assert story mission tracking
    assert.ok(expeditionService.getStoryMissionStatus('exp_test_story'));
    assert.deepStrictEqual(expeditionService.getCompletedStoryMissions(), ['exp_test_story']);

    // Assert Hero effect
    const newHeroes = heroService.list();
    assert.strictEqual(newHeroes.length, initialHeroesCount + 1);
    const addedHero = newHeroes.find(h => h.name === 'HeroTest');
    assert.ok(addedHero);
    assert.strictEqual(addedHero.origin, 'origin_thief');
    assert.strictEqual(addedHero.avatar, 'test.png');
    assert.strictEqual(addedHero.level, 3);
    assert.ok(addedHero.equipment.leftHand);
    assert.ok(addedHero.equipment.body);

    // Assert Villagers effect
    assert.strictEqual(villageService.getState().population.total, initialVillagersCount + 4);

    // Assert Blueprint effect
    assert.strictEqual(villageService.getState().infrastructure.blacksmith, 0);

    // Assert Region Unlock effect
    assert.ok(regionService.getRegion('reg_mystic_ruins'));

    // Assert Narrative effect
    const pending = expeditionService.getPendingNarratives();
    assert.strictEqual(pending.length, 1);
    assert.strictEqual(pending[0].titleKey, 't_key');
});
