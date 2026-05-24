globalThis.localStorage = {
    getItem() { return null; },
    setItem() {},
    removeItem() {},
    clear() {}
};

import test from 'node:test';
import assert from 'node:assert';
import { BattleService } from '../../js/engine/shared/combat/services/BattleService.js';
import { InventoryService } from '../../js/engine/shared/inventory/services/InventoryService.js';

const mockHero = {
    id: 'h1',
    name: 'Hero 1',
    type: 'Hero',
    origin: 'origin_warrior',
    level: 1,
    hp: 100,
    maxHp: 100,
    mp: 10,
    maxMp: 10,
    strength: 10,
    defense: 5,
    speed: 10,
    avatar: '⚔️',
    knownFamilies: ['single_strike', 'multiple_attack'],
    techniqueTiers: { single_strike: 1, multiple_attack: 1 },
    techniqueUses: {},
    magicXp: 0,
    magicTier: 1,
    knownGlyphs: []
};

const mockEnemy = {
    id: 'e1',
    name: 'Enemy 1',
    type: 'Enemy',
    level: 1,
    hp: 50,
    maxHp: 50,
    mp: 5,
    maxMp: 5,
    strength: 5,
    defense: 2,
    speed: 5
};

test('BattleService: Start Battle and Turn Order', () => {
    const inventory = new InventoryService();
    const battle = new BattleService(inventory);
    battle.startBattle([mockHero], [mockEnemy]);

    assert.strictEqual(battle.turnOrder.length, 2);
    // Hero speed is 10, enemy is 5, so Hero goes first
    assert.strictEqual(battle.turnOrder[0].id, 'h1');
    assert.strictEqual(battle.turnOrder[1].id, 'e1');
    assert.strictEqual(battle.currentTurnIndex, 0);
    assert.strictEqual(battle.itemUsedThisTurn, false);
});

test('BattleService: Execute Basic Attack', () => {
    const inventory = new InventoryService();
    const battle = new BattleService(inventory);
    
    // Create copies so we don't mutate mock globals
    const hero = { ...mockHero };
    const enemy = { ...mockEnemy };
    battle.startBattle([hero], [enemy]);

    const initialEnemyHp = enemy.hp;
    const result = battle.executeAction(hero, 'single_strike', 0); // Target enemy at index 0

    assert.strictEqual(result.success, true);
    assert.ok(enemy.hp < initialEnemyHp);
    assert.strictEqual(battle.log.length, 1);
    assert.strictEqual(battle.log[0].type, 'DAMAGE');
});

test('BattleService: Potion Usage Rules', () => {
    const inventory = new InventoryService();
    inventory.addItem('tiny_hp_potion', 2);

    const battle = new BattleService(inventory);
    const hero = { ...mockHero, hp: 50 }; // Half HP
    const enemy = { ...mockEnemy };
    battle.startBattle([hero], [enemy]);

    // Use consumable potion on hero
    const result = battle.useConsumable(hero, 'tiny_hp_potion', 'h1');
    assert.strictEqual(result.success, true);
    assert.ok(hero.hp > 50);
    assert.strictEqual(battle.itemUsedThisTurn, true);
    assert.strictEqual(inventory.getItemCount('tiny_hp_potion'), 1);

    // Try using another item on the same turn (should be blocked)
    const secondResult = battle.useConsumable(hero, 'tiny_hp_potion', 'h1');
    assert.strictEqual(secondResult.success, false);
    assert.strictEqual(secondResult.error, 'error_item_already_used');
});


test('BattleService: inscribed physical skill costs both STA and MP', () => {
    const inventory = new InventoryService();
    const battle = new BattleService(inventory);
    const hero = {
        id: 'h1', name: 'Hero 1', type: 'Hero', origin: 'origin_warrior', level: 1,
        hp: 100, maxHp: 100, mp: 20, maxMp: 20, stamina: 50, maxStamina: 50,
        strength: 10, defense: 5, speed: 10, avatar: '⚔️',
        knownFamilies: ['single_strike', 'power_strike'],
        techniqueTiers: { single_strike: 1, power_strike: 1 },
        techniqueUses: {},
        knownGlyphs: ['glyph_fire'],
        glyphMastery: {},
        magicTier: 7,
        bodyInscription: { glyphIds: ['glyph_fire'], glyphTiers: {} },
        getHybridMpCost() {
            return Math.floor(8 * (1 + (this.magicTier || 1) / 20));
        }
    };
    const enemy = { ...mockEnemy };
    battle.startBattle([hero], [enemy]);

    const initialSta = hero.stamina;
    const initialMp = hero.mp;
    const result = battle.executeAction(hero, 'power_strike', 0);

    const hybridCost = hero.getHybridMpCost();
    assert.strictEqual(result.success, true);
    assert.strictEqual(hero.stamina, initialSta - 8); // power_strike: base 8 + 0 at tier 1
    assert.strictEqual(hero.mp, initialMp - hybridCost);
});

test('BattleService: inscribed physical skill with higher tier costs more', () => {
    const inventory = new InventoryService();
    const battle = new BattleService(inventory);
    const hero = {
        id: 'h1', name: 'Hero 1', type: 'Hero', origin: 'origin_warrior', level: 1,
        hp: 100, maxHp: 100, mp: 20, maxMp: 20, stamina: 50, maxStamina: 50,
        strength: 10, defense: 5, speed: 10, avatar: '⚔️',
        knownFamilies: ['single_strike', 'power_strike'],
        techniqueTiers: { single_strike: 1, power_strike: 3 },
        techniqueUses: {},
        knownGlyphs: ['glyph_fire', 'glyph_potentiate'],
        glyphMastery: { glyph_potentiate: { tier: 3 } },
        magicTier: 7,
        bodyInscription: { glyphIds: ['glyph_fire', 'glyph_potentiate'], glyphTiers: { glyph_potentiate: 3 } },
        getHybridMpCost() {
            let base = 8;
            for (const gid of this.bodyInscription.glyphIds) {
                const tier = this.bodyInscription.glyphTiers[gid] || 1;
                if (gid === 'glyph_potentiate') base += 2 * tier;
            }
            return Math.floor(base * (1 + (this.magicTier || 1) / 20));
        }
    };
    const enemy = { ...mockEnemy };
    battle.startBattle([hero], [enemy]);

    const initialSta = hero.stamina;
    const initialMp = hero.mp;
    const result = battle.executeAction(hero, 'power_strike', 0);

    const hybridCost = hero.getHybridMpCost();
    assert.strictEqual(result.success, true);
    assert.strictEqual(hero.stamina, initialSta - 16); // power_strike: base 8 + 4*2 = 16 at tier 3
    assert.strictEqual(hero.mp, initialMp - hybridCost);
});

test('BattleService: non-inscribed skill costs only primary resource', () => {
    const inventory = new InventoryService();
    const battle = new BattleService(inventory);
    const hero = {
        id: 'h1', name: 'Hero 1', type: 'Hero', origin: 'origin_warrior', level: 1,
        hp: 100, maxHp: 100, mp: 20, maxMp: 20, stamina: 50, maxStamina: 50,
        strength: 10, defense: 5, speed: 10, avatar: '⚔️',
        knownFamilies: ['single_strike', 'power_strike'],
        techniqueTiers: { single_strike: 1, power_strike: 1 },
        techniqueUses: {},
        bodyInscription: { glyphIds: [], glyphTiers: {} }
    };
    const enemy = { ...mockEnemy };
    battle.startBattle([hero], [enemy]);

    const initialSta = hero.stamina;
    const initialMp = hero.mp;
    const result = battle.executeAction(hero, 'power_strike', 0);

    assert.strictEqual(result.success, true);
    assert.strictEqual(hero.stamina, initialSta - 8); // base 8 at tier 1
    assert.strictEqual(hero.mp, initialMp); // MP unchanged
});

test('BattleService: inscribed physical skill fails if not enough MP', () => {
    const inventory = new InventoryService();
    const battle = new BattleService(inventory);
    const hero = {
        id: 'h1', name: 'Hero 1', type: 'Hero', origin: 'origin_warrior', level: 1,
        hp: 100, maxHp: 100, mp: 3, maxMp: 3, stamina: 50, maxStamina: 50,
        strength: 10, defense: 5, speed: 10, avatar: '⚔️',
        knownFamilies: ['single_strike', 'power_strike'],
        techniqueTiers: { single_strike: 1, power_strike: 1 },
        techniqueUses: {},
        knownGlyphs: ['glyph_fire'],
        glyphMastery: {},
        magicTier: 7,
        bodyInscription: { glyphIds: ['glyph_fire'], glyphTiers: {} },
        getHybridMpCost() {
            return Math.floor(8 * (1 + (this.magicTier || 1) / 20));
        }
    };
    const enemy = { ...mockEnemy };
    battle.startBattle([hero], [enemy]);

    const result = battle.executeAction(hero, 'power_strike', 0);
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'error_not_enough_mp');
});


test('BattleService: cast offensive spell deals damage', () => {
    const inventory = new InventoryService();
    const battle = new BattleService(inventory);
    const hero = {
        ...mockHero, mp: 50, maxMp: 50, magicTier: 5,
        knownGlyphs: ['glyph_fire'], glyphMastery: {}
    };
    const enemy = { ...mockEnemy };
    battle.startBattle([hero], [enemy]);

    const offensiveSpell = {
        id: 's1', name: 'Fireball', mpCost: 5, damage: 20,
        element: 'fire', targetType: 'single_enemy',
        category: 'offensive', allyFactor: 0.20,
        effects: {}, glyphIds: ['glyph_fire'], glyphTiers: { 'glyph_fire': 1 }
    };

    const initialEnemyHp = enemy.hp;
    const result = battle.castSpell(hero, offensiveSpell, 0);

    assert.strictEqual(result.success, true);
    assert.ok(enemy.hp < initialEnemyHp);
    assert.strictEqual(battle.log.filter(e => e.type === 'SPELL_DAMAGE').length, 1);
});

test('BattleService: cast support spell heals ally', () => {
    const inventory = new InventoryService();
    const battle = new BattleService(inventory);
    const hero = {
        ...mockHero, hp: 50, mp: 50, maxMp: 50, magicTier: 5,
        knownGlyphs: ['glyph_light', 'glyph_aegis'], glyphMastery: {}
    };
    const ally = {
        id: 'h2', name: 'Ally', type: 'Hero', hp: 40, maxHp: 100,
        mp: 10, maxMp: 10, strength: 8, defense: 4, speed: 8
    };
    const enemy = { ...mockEnemy };
    battle.startBattle([hero, ally], [enemy]);

    const healSpell = {
        id: 's2', name: 'Soothing Light', mpCost: 8, damage: 20,
        element: 'light', targetType: 'single_ally',
        category: 'support', allyFactor: 0.30,
        effects: {}, glyphIds: ['glyph_light', 'glyph_aegis'], glyphTiers: {}
    };

    const initialAllyHp = ally.hp;
    const result = battle.castSpell(hero, healSpell, 1); // target ally at index 1

    assert.strictEqual(result.success, true);
    assert.ok(ally.hp > initialAllyHp);
    assert.strictEqual(battle.log.filter(e => e.type === 'HEAL').length, 1);
});

test('BattleService: cast support buff applies status effect', () => {
    const inventory = new InventoryService();
    const battle = new BattleService(inventory);
    const hero = {
        ...mockHero, mp: 50, maxMp: 50, magicTier: 5,
        knownGlyphs: ['glyph_earth', 'glyph_aegis'], glyphMastery: {}
    };
    const ally = {
        id: 'h2', name: 'Ally', type: 'Hero', hp: 80, maxHp: 100,
        mp: 10, maxMp: 10, strength: 8, defense: 4, speed: 8
    };
    const enemy = { ...mockEnemy };
    battle.startBattle([hero, ally], [enemy]);

    const buffSpell = {
        id: 's3', name: 'Fortifying Earth', mpCost: 7, damage: 15,
        element: 'earth', targetType: 'single_ally',
        category: 'support', allyFactor: 0.25,
        effects: {}, glyphIds: ['glyph_earth', 'glyph_aegis'], glyphTiers: {}
    };

    const result = battle.castSpell(hero, buffSpell, 1);

    assert.strictEqual(result.success, true);
    assert.ok(ally.statusEffects && ally.statusEffects.length > 0);
    const buff = ally.statusEffects.find(e => e.type === 'buff_def');
    assert.ok(buff);
    assert.strictEqual(buff.duration, 3);
    assert.ok(buff.value > 0);
});

test('BattleService: ally-targeted spell does not damage allies', () => {
    const inventory = new InventoryService();
    const battle = new BattleService(inventory);
    const hero = {
        ...mockHero, mp: 50, maxMp: 50, magicTier: 5,
        knownGlyphs: ['glyph_light', 'glyph_aegis'], glyphMastery: {}
    };
    const ally = {
        id: 'h2', name: 'Ally', type: 'Hero', hp: 80, maxHp: 100,
        mp: 10, maxMp: 10, strength: 8, defense: 4, speed: 8
    };
    const enemy = { ...mockEnemy };
    battle.startBattle([hero, ally], [enemy]);

    const supportSpell = {
        id: 's4', name: 'Soothing Light', mpCost: 8, damage: 20,
        element: 'light', targetType: 'single_ally',
        category: 'support', allyFactor: 0.30,
        effects: { poisonStacks: 2 }, // poison should be ignored on support
        glyphIds: ['glyph_light', 'glyph_aegis'], glyphTiers: {}
    };

    const initialAllyHp = ally.hp;
    battle.castSpell(hero, supportSpell, 1);

    // Ally should be healed, not damaged, and no poison applied
    assert.ok(ally.hp > initialAllyHp);
    assert.ok(!ally.statusEffects || ally.statusEffects.length === 0 || !ally.statusEffects.find(e => e.type === 'poison'));
});

test('BattleService: support AoE spell targets all allies', () => {
    const inventory = new InventoryService();
    const battle = new BattleService(inventory);
    const hero = {
        ...mockHero, mp: 50, maxMp: 50, magicTier: 5,
        knownGlyphs: ['glyph_light', 'glyph_aegis', 'glyph_multi'], glyphMastery: {}
    };
    const ally1 = {
        id: 'h2', name: 'Ally1', type: 'Hero', hp: 50, maxHp: 100,
        mp: 10, maxMp: 10, strength: 8, defense: 4, speed: 8
    };
    const ally2 = {
        id: 'h3', name: 'Ally2', type: 'Hero', hp: 60, maxHp: 100,
        mp: 10, maxMp: 10, strength: 8, defense: 4, speed: 8
    };
    const enemy = { ...mockEnemy };
    battle.startBattle([hero, ally1, ally2], [enemy]);

    const aoeHeal = {
        id: 's5', name: 'Soothing Light Chorus', mpCost: 20, damage: 20,
        element: 'light', targetType: 'all_allies',
        category: 'support', allyFactor: 0.30,
        effects: {}, glyphIds: ['glyph_light', 'glyph_aegis', 'glyph_multi'], glyphTiers: {}
    };

    const initialAlly1Hp = ally1.hp;
    const initialAlly2Hp = ally2.hp;
    const result = battle.castSpell(hero, aoeHeal);

    assert.strictEqual(result.success, true);
    assert.ok(ally1.hp > initialAlly1Hp);
    assert.ok(ally2.hp > initialAlly2Hp);
    // all_allies includes caster + all allies = 3 heal events
    const healEvents = battle.log.filter(e => e.type === 'HEAL');
    assert.strictEqual(healEvents.length, 3);
});
