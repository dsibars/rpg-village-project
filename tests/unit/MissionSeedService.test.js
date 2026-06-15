globalThis.localStorage = {
    getItem() { return null; },
    setItem() {},
    removeItem() {},
    clear() {}
};

import test from 'node:test';
import assert from 'node:assert';
import { MissionSeedService } from '../../js/engine/mission/services/MissionSeedService.js';
import { MISSION_SEEDS } from '../../js/engine/mission/data/MissionSeedData.js';

function createMockServices() {
    const inventoryService = {
        addItem(itemId, amount) {
            this.lastAdded = { itemId, amount };
        }
    };
    const villageService = {
        addGold(amount) {
            this.lastGold = amount;
        },
        getState() {
            return { gold: 1000 };
        }
    };
    return { inventoryService, villageService };
}

function createService() {
    const { inventoryService, villageService } = createMockServices();
    const service = new MissionSeedService(inventoryService, villageService);
    return { service, inventoryService, villageService };
}

test('MissionSeedService: initializes with default state', () => {
    const { service } = createService();
    const state = service.getState();
    assert.strictEqual(state.activeMissions.length, 0);
    assert.ok(state.seedStates);
    assert.strictEqual(state.canReroll, true);
});

test('MissionSeedService: seeds start locked', () => {
    const { service } = createService();
    const states = service.getAllSeedStates();
    for (const seedId of Object.keys(MISSION_SEEDS)) {
        assert.strictEqual(states[seedId].unlocked, false, `Seed ${seedId} should start locked`);
        assert.strictEqual(states[seedId].level, 1.0);
        assert.strictEqual(states[seedId].completions, 0);
    }
});

test('MissionSeedService: checkUnlocks with building_level condition', () => {
    const { service } = createService();
    const buildingLevels = { tavern: 1 };
    service.checkUnlocks(1, buildingLevels);

    const states = service.getAllSeedStates();
    assert.strictEqual(states.defeat_enemies.unlocked, true);
    assert.strictEqual(states.recruit_heroes.unlocked, true);
    assert.strictEqual(states.spend_gold.unlocked, true);
    assert.strictEqual(states.complete_expeditions.unlocked, true);
    assert.strictEqual(states.upgrade_buildings.unlocked, false); // needs town_hall
});

test('MissionSeedService: checkUnlocks with chapter condition', () => {
    const { service } = createService();
    service.checkUnlocks(1, {});
    const states = service.getAllSeedStates();
    assert.strictEqual(states.use_magic.unlocked, false);

    service.checkUnlocks(2, {});
    assert.strictEqual(states.use_magic.unlocked, true);
    assert.strictEqual(states.defeat_elite.unlocked, true);
});

test('MissionSeedService: generateMission creates valid mission', () => {
    const { service } = createService();
    service.checkUnlocks(1, { tavern: 1 });

    const mission = service.generateMission('defeat_enemies');
    assert.ok(mission.id);
    assert.strictEqual(mission.seedId, 'defeat_enemies');
    assert.strictEqual(mission.titleKey, 'mission_seed_defeat_enemies');
    assert.strictEqual(mission.progress, 0);
    assert.strictEqual(mission.target, 3); // baseCount at level 1.0
    assert.ok(mission.reward.gold >= 50);
    assert.strictEqual(mission.completed, false);
    assert.strictEqual(mission.claimed, false);
});

test('MissionSeedService: generateMission scales target with level', () => {
    const { service } = createService();
    service.setSeedLevel('defeat_enemies', 5.0);
    service.forceUnlock('defeat_enemies');

    const mission = service.generateMission('defeat_enemies');
    // N = 3 + round((5-1) * 3 * 0.3) = 3 + round(3.6) = 7
    assert.strictEqual(mission.target, 7);
    assert.ok(mission.reward.gold >= 50 + 4 * 10); // base + scaled
});

test('MissionSeedService: fillSlots creates missions up to board level', () => {
    const { service } = createService();
    service.checkUnlocks(1, { tavern: 1 });

    const newMissions = service.fillSlots(3);
    assert.strictEqual(newMissions.length, 3);
    assert.strictEqual(service.getActiveMissions().length, 3);

    // Each mission should have a unique ID
    const ids = newMissions.map(m => m.id);
    assert.strictEqual(new Set(ids).size, 3);
});

test('MissionSeedService: fillSlots respects max slots', () => {
    const { service } = createService();
    service.checkUnlocks(1, { tavern: 1 });
    service.fillSlots(2);
    const added = service.fillSlots(4);
    assert.strictEqual(added.length, 2);
    assert.strictEqual(service.getActiveMissions().length, 4);
});

test('MissionSeedService: trackProgress updates matching mission', () => {
    const { service } = createService();
    service.checkUnlocks(1, { tavern: 1 });
    service.fillSlots(1);

    const before = service.getActiveMissions()[0];
    assert.strictEqual(before.progress, 0);

    const completed = service.trackProgress('defeat', 'enemy', 2);
    assert.strictEqual(completed, false);

    const after = service.getActiveMissions()[0];
    if (after.seedId === 'defeat_enemies') {
        assert.strictEqual(after.progress, 2);
    }
});

test('MissionSeedService: trackProgress completes mission when target reached', () => {
    const { service } = createService();
    service.checkUnlocks(1, { tavern: 1 });
    service.fillSlots(1);

    // Force a specific seed
    const mission = service.generateMission('defeat_enemies');
    service.state.activeMissions = [mission];
    service.save();

    const completed = service.trackProgress('defeat', 'enemy', 5);
    assert.strictEqual(completed, true);
    assert.strictEqual(service.getActiveMissions()[0].completed, true);
    assert.strictEqual(service.getActiveMissions()[0].progress, 3); // capped at target
});

test('MissionSeedService: completeMission grants rewards and levels up seed', () => {
    const { service, inventoryService, villageService } = createService();
    service.checkUnlocks(1, { tavern: 1 });

    const mission = service.generateMission('defeat_enemies');
    mission.progress = mission.target;
    mission.completed = true;
    service.state.activeMissions = [mission];
    service.save();

    const result = service.completeMission(mission.id);
    assert.strictEqual(result.success, true);
    assert.ok(result.data.reward.gold > 0);
    assert.ok(villageService.lastGold > 0);

    const seedState = service.getSeedState('defeat_enemies');
    assert.strictEqual(seedState.completions, 1);
    assert.strictEqual(seedState.level, 1.2); // 1.0 + 0.2
});

test('MissionSeedService: completeMission regenerates a new mission', () => {
    const { service } = createService();
    service.checkUnlocks(1, { tavern: 1 });

    const mission = service.generateMission('defeat_enemies');
    mission.progress = mission.target;
    mission.completed = true;
    service.state.activeMissions = [mission];
    service.save();

    const beforeCount = service.getActiveMissions().length;
    service.completeMission(mission.id);
    const afterCount = service.getActiveMissions().length;
    assert.strictEqual(afterCount, beforeCount); // should regenerate
});

test('MissionSeedService: cannot claim uncompleted mission', () => {
    const { service } = createService();
    service.checkUnlocks(1, { tavern: 1 });

    const mission = service.generateMission('defeat_enemies');
    service.state.activeMissions = [mission];
    service.save();

    const result = service.completeMission(mission.id);
    assert.strictEqual(result.success, false);
});

test('MissionSeedService: reroll replaces mission', () => {
    const { service } = createService();
    service.checkUnlocks(1, { tavern: 1 });

    const mission = service.generateMission('defeat_enemies');
    service.state.activeMissions = [mission];
    service.save();

    const result = service.rerollMission(mission.id);
    assert.strictEqual(result.success, true);
    assert.notStrictEqual(result.data.newMission.id, mission.id);
    assert.strictEqual(result.data.newMission.rerolled, true);
});

test('MissionSeedService: reroll has cooldown', () => {
    const { service } = createService();
    service.checkUnlocks(1, { tavern: 1 });

    const mission = service.generateMission('defeat_enemies');
    service.state.activeMissions = [mission];
    service.save();

    service.rerollMission(mission.id);
    const result = service.rerollMission(service.getActiveMissions()[0].id);
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'mission_error_reroll_cooldown');
});

test('MissionSeedService: resetRerollForNewDay clears cooldown', () => {
    const { service } = createService();
    service.checkUnlocks(1, { tavern: 1 });

    const mission = service.generateMission('defeat_enemies');
    service.state.activeMissions = [mission];
    service.save();

    service.rerollMission(mission.id);
    assert.strictEqual(service.canReroll(), false);

    service.resetRerollForNewDay();
    assert.strictEqual(service.canReroll(), true);
});

test('MissionSeedService: category weighting picks underrepresented', () => {
    const { service } = createService();
    service.checkUnlocks(1, { tavern: 1 });
    service.checkUnlocks(2, {}); // unlock use_magic, defeat_elite

    // Force all combat seeds to be active
    service.state.activeMissions = [
        service.generateMission('defeat_enemies'),
        service.generateMission('use_magic'),
        service.generateMission('defeat_elite')
    ];
    service.save();

    // Economy and progression should be preferred
    const available = service.getAvailableSeeds();
    const categories = available.map(id => MISSION_SEEDS[id].category);
    assert.ok(categories.includes('economy'));
    assert.ok(categories.includes('progression'));
});

test('MissionSeedService: spend_gold accumulates progress', () => {
    const { service } = createService();
    service.checkUnlocks(1, { tavern: 1 });

    const mission = service.generateMission('spend_gold');
    mission.target = 200;
    service.state.activeMissions = [mission];
    service.save();

    service.trackProgress('spend', 'gold', 50);
    service.trackProgress('spend', 'gold', 100);
    service.trackProgress('spend', 'gold', 60);

    const updated = service.getActiveMissions()[0];
    assert.strictEqual(updated.progress, 200); // capped at target
    assert.strictEqual(updated.completed, true);
});

test('MissionSeedService: getState returns full snapshot', () => {
    const { service } = createService();
    service.checkUnlocks(1, { tavern: 1 });
    service.fillSlots(2);

    const state = service.getState();
    assert.strictEqual(state.activeMissions.length, 2);
    assert.strictEqual(state.availableSeedCount, 4); // tavern unlocks 4 seeds
    assert.strictEqual(state.canReroll, true);
    assert.ok(Object.keys(state.seedStates).length > 0);
});

test('MissionSeedService: no available seeds returns empty', () => {
    const { service } = createService();
    // Nothing unlocked
    const mission = service.pickNewMission();
    assert.strictEqual(mission, null);
});
