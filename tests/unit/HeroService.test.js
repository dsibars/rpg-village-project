globalThis.localStorage = {
    getItem() { return null; },
    setItem() {},
    removeItem() {},
    clear() {}
};

import test from 'node:test';
import assert from 'node:assert';
import { HeroService } from '../../js/engine/heroes/services/HeroService.js';
import { InventoryService } from '../../js/engine/shared/inventory/services/InventoryService.js';

test('HeroService: add and list heroes', () => {
    const inventory = new InventoryService();
    const service = new HeroService(inventory);

    const result = service.add({ name: 'TestHero', origin: 'origin_warrior', level: 1, statPoints: 5 });
    assert.strictEqual(result.success, true);
    assert.ok(result.data);
    assert.strictEqual(result.data.name, 'TestHero');

    const heroes = service.list();
    assert.strictEqual(heroes.length, 1);
    assert.strictEqual(heroes[0].name, 'TestHero');
});

test('HeroService: get hero by id', () => {
    const inventory = new InventoryService();
    const service = new HeroService(inventory);
    const added = service.add({ name: 'TestHero', origin: 'origin_warrior', level: 1, statPoints: 5 });

    const hero = service.get(added.data.id);
    assert.ok(hero);
    assert.strictEqual(hero.name, 'TestHero');

    const missing = service.get('nonexistent');
    assert.strictEqual(missing, null);
});

test('HeroService: remove hero', () => {
    const inventory = new InventoryService();
    const service = new HeroService(inventory);
    const added = service.add({ name: 'TestHero', origin: 'origin_warrior', level: 1, statPoints: 5 });

    const result = service.remove(added.data.id);
    assert.strictEqual(result.success, true);
    assert.strictEqual(service.list().length, 0);

    const missing = service.remove('nonexistent');
    assert.strictEqual(missing.success, false);
    assert.strictEqual(missing.error, 'heroes_error_hero_not_found');
});

test('HeroService: increase stat success', () => {
    const inventory = new InventoryService();
    const service = new HeroService(inventory);
    const added = service.add({ name: 'TestHero', origin: 'origin_warrior', level: 1, statPoints: 5 });
    const id = added.data.id;
    const initialBaseHp = added.data.baseMaxHp;

    const result = service.increaseHeroStat(id, 'baseMaxHp');
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.data, initialBaseHp + 3);

    const hero = service.get(id);
    assert.strictEqual(hero.statPoints, 4);
});

test('HeroService: increase stat fails without points', () => {
    const inventory = new InventoryService();
    const service = new HeroService(inventory);
    const added = service.add({ name: 'TestHero', origin: 'origin_warrior', level: 1, statPoints: 0 });

    const result = service.increaseHeroStat(added.data.id, 'baseMaxHp');
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'heroes_error_stat_point_none');
});

test('HeroService: increase stat fails for unknown hero', () => {
    const inventory = new InventoryService();
    const service = new HeroService(inventory);

    const result = service.increaseHeroStat('nonexistent', 'baseMaxHp');
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'heroes_error_hero_not_found');
});

test('HeroService: equip and unequip item', () => {
    const inventory = new InventoryService();
    const service = new HeroService(inventory);
    const added = service.add({ name: 'TestHero', origin: 'origin_warrior', level: 1, statPoints: 5 });
    const heroId = added.data.id;

    // Add a weapon to inventory
    const weapon = {
        id: 'weapon_001',
        name: 'Iron Sword',
        type: 'weapon',
        family: 'broadsword',
        material: 'iron',
        slot: 'leftHand',
        level: 0,
        stats: { strength: 5 }
    };
    inventory.addEquipment(weapon);

    // Equip
    const equipResult = service.equipItem(heroId, 'leftHand', 'weapon_001');
    assert.strictEqual(equipResult.success, true);
    assert.ok(service.get(heroId).equipment.leftHand);

    // Unequip
    const unequipResult = service.unequipItem(heroId, 'leftHand');
    assert.strictEqual(unequipResult.success, true);
    assert.strictEqual(service.get(heroId).equipment.leftHand, null);
});

test('HeroService: equip fails with wrong slot', () => {
    const inventory = new InventoryService();
    const service = new HeroService(inventory);
    const added = service.add({ name: 'TestHero', origin: 'origin_warrior', level: 1, statPoints: 5 });

    const weapon = {
        id: 'weapon_001',
        name: 'Iron Sword',
        type: 'weapon',
        family: 'broadsword',
        material: 'iron',
        slot: 'leftHand',
        level: 0,
        stats: { strength: 5 }
    };
    inventory.addEquipment(weapon);

    const result = service.equipItem(added.data.id, 'head', 'weapon_001');
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'heroes_error_slot_invalid');
});

test('HeroService: equip fails when item not found', () => {
    const inventory = new InventoryService();
    const service = new HeroService(inventory);
    const added = service.add({ name: 'TestHero', origin: 'origin_warrior', level: 1, statPoints: 5 });

    const result = service.equipItem(added.data.id, 'leftHand', 'nonexistent');
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'heroes_error_item_not_found');
});

test('HeroService: unequip fails when slot empty', () => {
    const inventory = new InventoryService();
    const service = new HeroService(inventory);
    const added = service.add({ name: 'TestHero', origin: 'origin_warrior', level: 1, statPoints: 5 });

    const result = service.unequipItem(added.data.id, 'leftHand');
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'heroes_error_slot_empty');
});

test('HeroService: auto-unequip when equipping to occupied slot', () => {
    const inventory = new InventoryService();
    const service = new HeroService(inventory);
    const added = service.add({ name: 'TestHero', origin: 'origin_warrior', level: 1, statPoints: 5 });
    const heroId = added.data.id;

    const weapon1 = { id: 'weapon_001', name: 'Sword A', type: 'weapon', family: 'broadsword', material: 'iron', slot: 'leftHand', level: 0, stats: { strength: 5 } };
    const weapon2 = { id: 'weapon_002', name: 'Sword B', type: 'weapon', family: 'broadsword', material: 'iron', slot: 'leftHand', level: 0, stats: { strength: 8 } };
    inventory.addEquipment(weapon1);
    inventory.addEquipment(weapon2);

    service.equipItem(heroId, 'leftHand', 'weapon_001');
    assert.strictEqual(service.get(heroId).equipment.leftHand.id, 'weapon_001');

    // Equipping second weapon should auto-unequip first
    service.equipItem(heroId, 'leftHand', 'weapon_002');
    assert.strictEqual(service.get(heroId).equipment.leftHand.id, 'weapon_002');
    assert.ok(inventory.getEquipment('weapon_001')); // First weapon back in inventory
});

test('HeroService: learn family', () => {
    const inventory = new InventoryService();
    const service = new HeroService(inventory);
    const added = service.add({ name: 'TestHero', origin: 'origin_warrior', level: 1, statPoints: 5 });
    const heroId = added.data.id;
    const hero = service.get(heroId);

    // Level 1 hero has 1 skill point and knows single_strike
    assert.deepStrictEqual(hero.knownFamilies, ['single_strike']);
    assert.strictEqual(hero.skillPoints, 1);

    const learnResult = service.learnHeroFamily(heroId, 'multiple_attack');
    assert.strictEqual(learnResult.success, true);
    assert.deepStrictEqual(hero.knownFamilies, ['single_strike', 'multiple_attack']);
    assert.strictEqual(hero.skillPoints, 0);
});

test('HeroService: learn family fails without skill points', () => {
    const inventory = new InventoryService();
    const service = new HeroService(inventory);
    const added = service.add({ name: 'TestHero', origin: 'origin_warrior', level: 1, statPoints: 5 });
    const hero = service.get(added.data.id);
    hero.skillPoints = 0;

    const result = service.learnHeroFamily(added.data.id, 'power_strike');
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'heroes_error_skill_point_none');
});

test('HeroService: learn family fails if already known', () => {
    const inventory = new InventoryService();
    const service = new HeroService(inventory);
    const added = service.add({ name: 'TestHero', origin: 'origin_warrior', level: 1, statPoints: 5 });
    const heroId = added.data.id;

    const result = service.learnHeroFamily(heroId, 'single_strike');
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'heroes_error_family_already_known');
});

test('HeroService: learn family fails at max families', () => {
    const inventory = new InventoryService();
    const service = new HeroService(inventory);
    const added = service.add({ name: 'TestHero', origin: 'origin_warrior', level: 25, statPoints: 5 });
    const hero = service.get(added.data.id);
    // Fill all 6 family slots
    hero.knownFamilies = ['single_strike', 'multiple_attack', 'power_strike', 'cleave', 'shield_bash', 'poison_strike'];
    hero.skillPoints = 1;

    const result = service.learnHeroFamily(added.data.id, 'plunder');
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'heroes_error_family_max_reached');
});

test('HeroService: skill points increase at milestones', () => {
    const inventory = new InventoryService();
    const service = new HeroService(inventory);
    const added = service.add({ name: 'TestHero', origin: 'origin_warrior', level: 1, statPoints: 5 });
    const hero = service.get(added.data.id);

    assert.strictEqual(hero.skillPoints, 1);

    hero.levelUp(); // level 2
    assert.strictEqual(hero.skillPoints, 1); // no milestone

    hero.level = 4;
    hero.levelUp(); // level 5
    assert.strictEqual(hero.skillPoints, 2); // milestone at 5
});

test('HeroService: tick meal buffs', () => {
    const inventory = new InventoryService();
    const service = new HeroService(inventory);
    const added = service.add({ name: 'TestHero', origin: 'origin_warrior', level: 1, statPoints: 5 });
    const hero = service.get(added.data.id);

    hero.mealBuffs = [{ stat: 'strength', value: 5, battlesRemaining: 2 }];
    hero.recalculateStats();

    // First tick: 2→1, no buff expires yet
    const changed1 = service.tickAllMealBuffs();
    assert.strictEqual(changed1, false);
    assert.strictEqual(hero.mealBuffs.length, 1);
    assert.strictEqual(hero.mealBuffs[0].battlesRemaining, 1);

    // Second tick: 1→0, buff expires
    const changed2 = service.tickAllMealBuffs();
    assert.strictEqual(changed2, true);
    assert.strictEqual(hero.mealBuffs.length, 0);

    // Third tick: nothing to tick
    const changed3 = service.tickAllMealBuffs();
    assert.strictEqual(changed3, false);
});

test('HeroService: setStatus', () => {
    const inventory = new InventoryService();
    const service = new HeroService(inventory);
    const added = service.add({ name: 'TestHero', origin: 'origin_warrior', level: 1, statPoints: 5 });

    const result = service.setStatus(added.data.id, 'active');
    assert.strictEqual(result.success, true);
    assert.strictEqual(service.get(added.data.id).status, 'active');

    const missing = service.setStatus('nonexistent', 'resting');
    assert.strictEqual(missing.success, false);
});


test('HeroService: stamina initialized on creation', () => {
    const inventory = new InventoryService();
    const service = new HeroService(inventory);
    const added = service.add({ name: 'TestHero', origin: 'origin_warrior', level: 1, statPoints: 5 });
    const hero = service.get(added.data.id);

    assert.ok(hero.maxStamina > 0, 'maxStamina should be calculated');
    assert.strictEqual(hero.stamina, hero.maxStamina, 'stamina should start at max');
});

test('HeroService: stamina formula is correct', () => {
    const inventory = new InventoryService();
    const service = new HeroService(inventory);
    const added = service.add({ 
        name: 'TestHero', 
        origin: 'origin_warrior', 
        level: 1, 
        statPoints: 5,
        baseStrength: 10,
        baseDefense: 5
    });
    const hero = service.get(added.data.id);

    // maxStamina = (strength * 3) + (defense * 2) + (level * 2)
    const expected = (hero.strength * 3) + (hero.defense * 2) + (hero.level * 2);
    assert.strictEqual(hero.maxStamina, expected, `maxStamina should be ${expected}`);
});

test('HeroService: stamina restores on level up', () => {
    const inventory = new InventoryService();
    const service = new HeroService(inventory);
    const added = service.add({ name: 'TestHero', origin: 'origin_warrior', level: 1, statPoints: 5 });
    const hero = service.get(added.data.id);

    // Drain stamina
    hero.stamina = 5;
    const preLevelMax = hero.maxStamina;

    // Level up
    hero.levelUp();

    assert.strictEqual(hero.stamina, hero.maxStamina, 'stamina should restore to max on level up');
    assert.ok(hero.maxStamina > preLevelMax, 'maxStamina should increase with level');
});

test('HeroService: assigning STR increases maxStamina', () => {
    const inventory = new InventoryService();
    const service = new HeroService(inventory);
    const added = service.add({ name: 'TestHero', origin: 'origin_warrior', level: 1, statPoints: 5 });
    const hero = service.get(added.data.id);
    const preMaxStamina = hero.maxStamina;

    service.increaseHeroStat(added.data.id, 'baseStrength');

    assert.ok(hero.maxStamina > preMaxStamina, 'maxStamina should increase after STR allocation');
    assert.strictEqual(hero.maxStamina, preMaxStamina + 3, 'maxStamina should increase by 3 per STR point');
});

test('HeroService: assigning DEF increases maxStamina', () => {
    const inventory = new InventoryService();
    const service = new HeroService(inventory);
    const added = service.add({ name: 'TestHero', origin: 'origin_warrior', level: 1, statPoints: 5 });
    const hero = service.get(added.data.id);
    const preMaxStamina = hero.maxStamina;

    service.increaseHeroStat(added.data.id, 'baseDefense');

    assert.ok(hero.maxStamina > preMaxStamina, 'maxStamina should increase after DEF allocation');
    assert.strictEqual(hero.maxStamina, preMaxStamina + 2, 'maxStamina should increase by 2 per DEF point');
});


test('HeroService: body inscription requires 12 skill tier points and magic tier 7', () => {
    const inventory = new InventoryService();
    const service = new HeroService(inventory);
    const added = service.add({ name: 'TestHero', origin: 'origin_warrior', level: 1, statPoints: 0 });
    const hero = service.get(added.data.id);
    hero.knownFamilies = ['single_strike'];
    hero.techniqueTiers = {};
    hero.knownGlyphs = ['glyph_fire'];
    hero.magicTier = 0;

    const result = service.inscribeHeroBodyCircle(added.data.id, ['glyph_fire'], {});
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'heroes_error_inscription_skill_not_enough');
});

test('HeroService: body inscription requires magic tier 7', () => {
    const inventory = new InventoryService();
    const service = new HeroService(inventory);
    const added = service.add({ name: 'TestHero', origin: 'origin_warrior', level: 1, statPoints: 0 });
    const hero = service.get(added.data.id);
    hero.knownFamilies = ['single_strike', 'power_strike'];
    hero.techniqueTiers = { single_strike: 5, power_strike: 5 };
    hero.knownGlyphs = ['glyph_fire'];
    hero.magicTier = 6;

    const result = service.inscribeHeroBodyCircle(added.data.id, ['glyph_fire'], {});
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'heroes_error_inscription_magic_not_enough');
});

test('HeroService: body inscription succeeds when requirements met', () => {
    const inventory = new InventoryService();
    const service = new HeroService(inventory);
    const added = service.add({ name: 'TestHero', origin: 'origin_warrior', level: 1, statPoints: 0 });
    const hero = service.get(added.data.id);
    hero.knownFamilies = ['single_strike', 'power_strike'];
    hero.techniqueTiers = { single_strike: 5, power_strike: 5 };
    hero.knownGlyphs = ['glyph_fire', 'glyph_potentiate', 'glyph_focus', 'glyph_extend', 'glyph_multi', 'glyph_pierce', 'glyph_venom'];
    hero.magicTier = 7;

    const glyphIds = ['glyph_fire', 'glyph_potentiate', 'glyph_focus', 'glyph_extend', 'glyph_multi', 'glyph_pierce', 'glyph_venom'];
    const result = service.inscribeHeroBodyCircle(added.data.id, glyphIds, { glyph_potentiate: 1 });
    assert.strictEqual(result.success, true);
    assert.deepStrictEqual(hero.pendingBodyInscription.glyphIds, glyphIds);
    assert.strictEqual(hero.bodyInscriptionDaysRemaining, 5);
});

test('HeroService: body inscription rejects unknown glyphs', () => {
    const inventory = new InventoryService();
    const service = new HeroService(inventory);
    const added = service.add({ name: 'TestHero', origin: 'origin_warrior', level: 1, statPoints: 0 });
    const hero = service.get(added.data.id);
    hero.knownFamilies = ['single_strike', 'power_strike'];
    hero.techniqueTiers = { single_strike: 5, power_strike: 5 };
    hero.knownGlyphs = ['glyph_fire', 'glyph_potentiate', 'glyph_focus', 'glyph_extend', 'glyph_multi', 'glyph_pierce'];
    hero.magicTier = 7;

    const glyphIds = ['glyph_fire', 'glyph_potentiate', 'glyph_focus', 'glyph_extend', 'glyph_multi', 'glyph_pierce', 'glyph_slumber'];
    const result = service.inscribeHeroBodyCircle(added.data.id, glyphIds, {});
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'heroes_error_glyph_not_known');
});

test('HeroService: body inscription requires a core glyph', () => {
    const inventory = new InventoryService();
    const service = new HeroService(inventory);
    const added = service.add({ name: 'TestHero', origin: 'origin_warrior', level: 1, statPoints: 0 });
    const hero = service.get(added.data.id);
    hero.knownFamilies = ['single_strike', 'power_strike'];
    hero.techniqueTiers = { single_strike: 5, power_strike: 5 };
    hero.knownGlyphs = ['glyph_potentiate', 'glyph_focus', 'glyph_extend', 'glyph_multi', 'glyph_pierce', 'glyph_venom', 'glyph_slumber'];
    hero.magicTier = 7;

    const glyphIds = ['glyph_potentiate', 'glyph_focus', 'glyph_extend', 'glyph_multi', 'glyph_pierce', 'glyph_venom', 'glyph_slumber'];
    const result = service.inscribeHeroBodyCircle(added.data.id, glyphIds, {});
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'heroes_error_glyph_core_none');
});

test('HeroService: body inscription rejects under-filled circle', () => {
    const inventory = new InventoryService();
    const service = new HeroService(inventory);
    const added = service.add({ name: 'TestHero', origin: 'origin_warrior', level: 1, statPoints: 0 });
    const hero = service.get(added.data.id);
    hero.knownFamilies = ['single_strike', 'power_strike'];
    hero.techniqueTiers = { single_strike: 5, power_strike: 5 };
    hero.knownGlyphs = ['glyph_fire', 'glyph_potentiate'];
    hero.magicTier = 7;

    const result = service.inscribeHeroBodyCircle(added.data.id, ['glyph_fire', 'glyph_potentiate'], {});
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'heroes_error_body_circle_size_invalid');
});

test('HeroService: body inscription rejects over-filled circle', () => {
    const inventory = new InventoryService();
    const service = new HeroService(inventory);
    const added = service.add({ name: 'TestHero', origin: 'origin_warrior', level: 1, statPoints: 0 });
    const hero = service.get(added.data.id);
    hero.knownFamilies = ['single_strike', 'power_strike'];
    hero.techniqueTiers = { single_strike: 5, power_strike: 5 };
    hero.knownGlyphs = ['glyph_fire', 'glyph_potentiate', 'glyph_focus', 'glyph_extend', 'glyph_multi', 'glyph_pierce', 'glyph_venom', 'glyph_slumber'];
    hero.magicTier = 7;

    const glyphIds = ['glyph_fire', 'glyph_potentiate', 'glyph_focus', 'glyph_extend', 'glyph_multi', 'glyph_pierce', 'glyph_venom', 'glyph_slumber'];
    const result = service.inscribeHeroBodyCircle(added.data.id, glyphIds, {});
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'heroes_error_body_circle_size_invalid');
});

test('HeroService: erase body circle clears inscription', () => {
    const inventory = new InventoryService();
    const service = new HeroService(inventory);
    const added = service.add({ name: 'TestHero', origin: 'origin_warrior', level: 1, statPoints: 0 });
    const hero = service.get(added.data.id);
    hero.knownFamilies = ['single_strike', 'power_strike'];
    hero.techniqueTiers = { single_strike: 5, power_strike: 5 };
    hero.knownGlyphs = ['glyph_fire'];
    hero.magicTier = 7;
    hero.bodyInscription = { glyphIds: ['glyph_fire'], glyphTiers: {} };

    const result = service.eraseHeroBodyCircle(added.data.id);
    assert.strictEqual(result.success, true);
    assert.strictEqual(hero.bodyInscription, null);
});

test('HeroService: erase body circle fails when nothing inscribed', () => {
    const inventory = new InventoryService();
    const service = new HeroService(inventory);
    const added = service.add({ name: 'TestHero', origin: 'origin_warrior', level: 1, statPoints: 0 });
    const hero = service.get(added.data.id);
    hero.knownFamilies = ['single_strike', 'power_strike'];
    hero.techniqueTiers = { single_strike: 5, power_strike: 5 };
    hero.magicTier = 7;
    hero.bodyInscription = null;

    const result = service.eraseHeroBodyCircle(added.data.id);
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'heroes_error_inscription_none');
});


test('HeroService: add gambit to hero', () => {
    const inventory = new InventoryService();
    const service = new HeroService(inventory);
    const added = service.add({ name: 'TestHero', origin: 'origin_warrior', level: 1, statPoints: 0 });
    const hero = service.get(added.data.id);

    const gambit = { id: 'g1', condition: 'always', action: 'use_skill', skillId: 'single_strike', enabled: true };
    const result = service.addHeroGambit(added.data.id, gambit);

    assert.strictEqual(result.success, true);
    assert.strictEqual(hero.gambits.length, 1);
    assert.strictEqual(hero.gambits[0].id, 'g1');
});

test('HeroService: gambit limit is 12', () => {
    const inventory = new InventoryService();
    const service = new HeroService(inventory);
    const added = service.add({ name: 'TestHero', origin: 'origin_warrior', level: 1, statPoints: 0 });
    const hero = service.get(added.data.id);
    hero.gambits = Array.from({ length: 12 }, (_, i) => ({ id: 'g' + i, condition: 'always', action: 'use_skill', skillId: 'basic_attack', enabled: true }));

    const result = service.addHeroGambit(added.data.id, { id: 'g13', condition: 'always', action: 'use_skill', skillId: 'basic_attack', enabled: true });
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'heroes_error_gambit_limit_reached');
});

test('HeroService: remove gambit from hero', () => {
    const inventory = new InventoryService();
    const service = new HeroService(inventory);
    const added = service.add({ name: 'TestHero', origin: 'origin_warrior', level: 1, statPoints: 0 });
    const hero = service.get(added.data.id);
    hero.gambits = [{ id: 'g1', condition: 'always', action: 'use_skill', skillId: 'basic_attack', enabled: true }];

    const result = service.removeHeroGambit(added.data.id, 'g1');
    assert.strictEqual(result.success, true);
    assert.strictEqual(hero.gambits.length, 0);
});

test('HeroService: toggle gambit enabled state', () => {
    const inventory = new InventoryService();
    const service = new HeroService(inventory);
    const added = service.add({ name: 'TestHero', origin: 'origin_warrior', level: 1, statPoints: 0 });
    const hero = service.get(added.data.id);
    hero.gambits = [{ id: 'g1', condition: 'always', action: 'use_skill', skillId: 'basic_attack', enabled: true }];

    const result = service.toggleHeroGambit(added.data.id, 'g1');
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.data, false);
    assert.strictEqual(hero.gambits[0].enabled, false);
});

test('HeroService: move gambit up and down', () => {
    const inventory = new InventoryService();
    const service = new HeroService(inventory);
    const added = service.add({ name: 'TestHero', origin: 'origin_warrior', level: 1, statPoints: 0 });
    const hero = service.get(added.data.id);
    hero.gambits = [
        { id: 'g1', condition: 'always', action: 'use_skill', skillId: 'basic_attack', enabled: true },
        { id: 'g2', condition: 'self_hp_below', threshold: 0.5, action: 'use_skill', skillId: 'basic_attack', enabled: true }
    ];

    const result = service.moveHeroGambit(added.data.id, 'g2', -1);
    assert.strictEqual(result.success, true);
    assert.strictEqual(hero.gambits[0].id, 'g2');
    assert.strictEqual(hero.gambits[1].id, 'g1');
});

test('HeroService: move gambit fails at boundaries', () => {
    const inventory = new InventoryService();
    const service = new HeroService(inventory);
    const added = service.add({ name: 'TestHero', origin: 'origin_warrior', level: 1, statPoints: 0 });
    const hero = service.get(added.data.id);
    hero.gambits = [{ id: 'g1', condition: 'always', action: 'use_skill', skillId: 'basic_attack', enabled: true }];

    const result = service.moveHeroGambit(added.data.id, 'g1', -1);
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'heroes_error_gambit_move_invalid');
});

test('HeroService: duplicate gambit id rejected', () => {
    const inventory = new InventoryService();
    const service = new HeroService(inventory);
    const added = service.add({ name: 'TestHero', origin: 'origin_warrior', level: 1, statPoints: 0 });
    const hero = service.get(added.data.id);
    hero.gambits = [{ id: 'g1', condition: 'always', action: 'use_skill', skillId: 'basic_attack', enabled: true }];

    const result = service.addHeroGambit(added.data.id, { id: 'g1', condition: 'always', action: 'use_skill', skillId: 'basic_attack', enabled: true });
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'heroes_error_gambit_id_duplicate');
});
