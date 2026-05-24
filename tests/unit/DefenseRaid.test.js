globalThis.localStorage = {
    getItem() { return null; },
    setItem() {},
    removeItem() {},
    clear() {}
};

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { GameEngine } from '../../js/engine/GameEngine.js';

describe('Defense/Raid Mutual Exclusion', () => {

    it('cannot assign hero to defense while on expedition', () => {
        
        const engine = new GameEngine();
        
        // Arthur starts at level 1
        const heroes = engine.heroService.list();
        assert.strictEqual(heroes.length, 1);
        const arthur = heroes[0];
        
        // Assign Arthur to an expedition
        const expeditionId = 'exp_tutorial_cave';
        const assignResult = engine.assignExpedition(expeditionId, [arthur.id]);
        assert.ok(assignResult.success, 'Expedition assignment should succeed');
        
        // Try to assign Arthur to defense
        const defenseResult = engine.assignDefense(arthur.id);
        assert.ok(!defenseResult.success, 'Defense assignment should fail');
        assert.strictEqual(defenseResult.error, 'error_hero_on_expedition');
    });

    it('assigning expedition auto-removes hero from defense', () => {
        
        const engine = new GameEngine();
        
        // Need 2 heroes for this test - add a second hero manually
        engine.heroService.add({ name: 'TestHero', origin: 'origin_warrior', level: 1 });
        const heroes = engine.heroService.list();
        assert.strictEqual(heroes.length, 2);
        
        const arthur = heroes.find(h => h.name === 'Arthur');
        const testHero = heroes.find(h => h.name === 'TestHero');
        
        // Assign Arthur to defense
        const defenseResult = engine.assignDefense(arthur.id);
        assert.ok(defenseResult.success, 'Defense assignment should succeed');
        assert.ok(engine.calendarService.state.defenseAssigned.includes(arthur.id));
        
        // Now assign Arthur to expedition
        const expeditionId = 'exp_tutorial_cave';
        const assignResult = engine.assignExpedition(expeditionId, [arthur.id]);
        assert.ok(assignResult.success, 'Expedition assignment should succeed');
        
        // Arthur should be auto-removed from defense
        assert.ok(!engine.calendarService.state.defenseAssigned.includes(arthur.id));
    });

    it('first raid is delayed until 2+ heroes exist', () => {
        
        const engine = new GameEngine();
        
        // Only 1 hero at start
        assert.strictEqual(engine.heroService.list().length, 1);
        
        // Generate events up to day 30
        for (let day = 1; day <= 30; day++) {
            engine.calendarService.generateEvents(day);
        }
        
        // No raids should be generated with only 1 hero
        const raids = engine.calendarService.state.events.filter(e => e.type === 'raid');
        assert.strictEqual(raids.length, 0, 'No raids should spawn with only 1 hero');
        
        // Add a second hero
        engine.heroService.add({ name: 'TestHero', origin: 'origin_warrior', level: 1 });
        assert.strictEqual(engine.heroService.list().length, 2);
        
        // Now generate events again
        engine.calendarService.state.events = []; // clear old events
        for (let day = 1; day <= 30; day++) {
            engine.calendarService.generateEvents(day);
        }
        
        // Raids should now be possible
        const raidsAfter = engine.calendarService.state.events.filter(e => e.type === 'raid');
        assert.ok(raidsAfter.length > 0, 'Raids should spawn after 2+ heroes');
    });

    it('0-defender raid causes severe penalty', () => {
        
        const engine = new GameEngine();
        
        // Add gold and materials
        engine.villageService.state.gold = 500;
        engine.villageService.save();
        
        // Manually add some wood
        engine.inventoryService.data.materials['material_wood'] = 50;
        engine.inventoryService.save();
        
        // Create a raid event
        const raidDay = 10;
        engine.calendarService.state.events.push({
            day: raidDay,
            type: 'raid',
            resolved: false,
            data: { level: 1, enemies: ['slime_green'], enemyCount: 1 }
        });
        engine.calendarService.save();
        
        // Force defeat by mocking RNG (0-defender win chance is ~15% minimum)
        const origRandom = Math.random;
        Math.random = () => 0.99;
        
        // Resolve with 0 defenders
        const result = engine.calendarService.resolveRaid(raidDay);
        
        Math.random = origRandom;
        
        assert.ok(!result.isVictory, 'Should lose with 0 defenders');
        assert.strictEqual(engine.villageService.state.gold, 0, 'Should lose all gold');
        assert.ok(result.goldLost > 0, 'Should report gold lost');
        assert.ok(engine.calendarService.state.lastRaidHadZeroDefenders, 'Should track zero-defender raid');
    });

    it('advisory API warns when last heroes would leave village undefended', () => {
        
        const engine = new GameEngine();
        
        // Add a second hero
        engine.heroService.add({ name: 'TestHero', origin: 'origin_warrior', level: 1 });
        
        // Create an upcoming raid (day + 2 so expedition returns ON raid day, triggering warning)
        const currentDay = engine.villageService.getState().day || 1;
        engine.calendarService.state.events.push({
            day: currentDay + 2,
            type: 'raid',
            resolved: false,
            data: { level: 1, enemies: ['slime_green'], enemyCount: 1 }
        });
        engine.calendarService.save();
        
        // Get the tutorial cave expedition
        const exp = engine.expeditionService.getExpeditions().find(e => e.id === 'exp_tutorial_cave');
        assert.ok(exp, 'Tutorial cave should exist');
        
        // Get both heroes
        const heroes = engine.heroService.list();
        const heroIds = heroes.map(h => h.id);
        
        // Advisory for assigning ALL heroes
        const advisory = engine.getDefenseAdvisory(exp.id, heroIds);
        
        assert.ok(advisory.hasWarning, 'Should warn when all heroes are assigned');
        assert.strictEqual(advisory.idleHeroesAfterAssignment, 0);
        assert.ok(advisory.nextRaidDay !== null);
        assert.ok(advisory.warningKey !== null);
    });

    it('advisory API does not warn when heroes return before raid', () => {
        
        const engine = new GameEngine();
        
        // Add a second hero
        engine.heroService.add({ name: 'TestHero', origin: 'origin_warrior', level: 1 });
        
        // Create a raid far in the future
        const currentDay = engine.villageService.getState().day || 1;
        engine.calendarService.state.events.push({
            day: currentDay + 30,
            type: 'raid',
            resolved: false,
            data: { level: 1, enemies: ['slime_green'], enemyCount: 1 }
        });
        engine.calendarService.save();
        
        // Get the tutorial cave expedition (only 2 stages)
        const exp = engine.expeditionService.getExpeditions().find(e => e.id === 'exp_tutorial_cave');
        assert.ok(exp, 'Tutorial cave should exist');
        
        // Assign only 1 hero, leaving 1 idle
        const heroes = engine.heroService.list();
        const heroIds = [heroes[0].id];
        
        const advisory = engine.getDefenseAdvisory(exp.id, heroIds);
        
        assert.ok(!advisory.hasWarning, 'Should not warn when idle heroes remain');
    });
});
