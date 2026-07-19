import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  buildHero,
  buildParty,
  buildEnemy,
  buildEnemies,
  buildSpellFromGlyphs,
  buildGambits,
  buildConsumableInventory,
  validateScenario
} from '../../scripts/combat-lab/scenarios/builder.mjs';

describe('combat-lab builder', () => {
  describe('buildHero', () => {
    it('creates a basic hero with origin and level', () => {
      const hero = buildHero({ origin: 'origin_warrior', level: 3 });
      assert.strictEqual(hero.origin, 'origin_warrior');
      assert.strictEqual(hero.level, 3);
      assert.ok(hero.maxHp > 0);
      assert.ok(hero.strength > 0);
    });

    it('applies custom name and id', () => {
      const hero = buildHero({ origin: 'origin_thief', level: 1, name: 'Test Thief', id: 'test_1' });
      assert.strictEqual(hero.name, 'Test Thief');
      assert.strictEqual(hero.id, 'test_1');
    });

    it('applies stat overrides', () => {
      const hero = buildHero({ origin: 'origin_warrior', level: 1, stats: { baseStrength: 20, baseMagicPower: 10 } });
      assert.strictEqual(hero.baseStrength, 20);
      assert.strictEqual(hero.baseMagicPower, 10);
    });

    it('equips items from shorthand strings', () => {
      const hero = buildHero({
        origin: 'origin_warrior',
        level: 1,
        equipment: ['weapon:iron:broadsword', 'armor:leather:leather:body']
      });
      assert.strictEqual(hero.equipment.leftHand?.type, 'weapon');
      assert.strictEqual(hero.equipment.leftHand?.material, 'iron');
      assert.strictEqual(hero.equipment.body?.type, 'armor');
    });

    it('equips items from full objects', () => {
      const hero = buildHero({
        origin: 'origin_warrior',
        level: 1,
        equipment: [
          { slot: 'leftHand', type: 'weapon', material: 'steel', family: 'battle_axe', level: 0 }
        ]
      });
      assert.strictEqual(hero.equipment.leftHand?.family, 'battle_axe');
    });

    it('learns skill families', () => {
      const hero = buildHero({
        origin: 'origin_warrior',
        level: 1,
        skills: ['single_strike', 'multiple_attack']
      });
      assert.ok(hero.knownFamilies.includes('multiple_attack'));
    });

    it('sets magic tier and known glyphs', () => {
      const hero = buildHero({
        origin: 'origin_arcane_initiate',
        level: 5,
        magicTier: 3,
        glyphs: ['glyph_fire', 'glyph_water']
      });
      assert.strictEqual(hero.magicTier, 3);
      assert.ok(hero.knownGlyphs.includes('glyph_fire'));
    });

    it('throws on missing origin', () => {
      assert.throws(() => buildHero({ level: 1 }), /origin is required/);
    });

    it('throws on missing level', () => {
      assert.throws(() => buildHero({ origin: 'origin_warrior' }), /level must be >= 1/);
    });
  });

  describe('buildParty', () => {
    it('builds multiple heroes', () => {
      const party = buildParty([
        { origin: 'origin_warrior', level: 2 },
        { origin: 'origin_thief', level: 2 }
      ]);
      assert.strictEqual(party.length, 2);
      assert.strictEqual(party[0].origin, 'origin_warrior');
      assert.strictEqual(party[1].origin, 'origin_thief');
    });

    it('assigns sequential ids', () => {
      const party = buildParty([
        { origin: 'origin_warrior', level: 1 },
        { origin: 'origin_thief', level: 1 }
      ]);
      assert.strictEqual(party[0].id, 'hero_0');
      assert.strictEqual(party[1].id, 'hero_1');
    });
  });

  describe('buildEnemy', () => {
    it('creates a basic slime', () => {
      const enemy = buildEnemy({ id: 'slime_green', level: 1 });
      assert.strictEqual(enemy.templateId, 'slime_green');
      assert.strictEqual(enemy.level, 1);
      assert.ok(enemy.maxHp > 0);
    });

    it('scales stats with level', () => {
      const e1 = buildEnemy({ id: 'slime_green', level: 1 });
      const e5 = buildEnemy({ id: 'slime_green', level: 5 });
      assert.ok(e5.maxHp > e1.maxHp, 'higher level should have more HP');
      assert.ok(e5.strength > e1.strength, 'higher level should have more strength');
    });

    it('applies elite scaling', () => {
      const elite = buildEnemy({ id: 'slime_green', level: 1, isElite: true, eliteTier: 1 });
      assert.strictEqual(elite.isElite, true);
      assert.strictEqual(elite.eliteTier, 1);
      assert.ok(elite.name.startsWith('Corrupted'));
    });

    it('falls back to slime_green for unknown template', () => {
      const enemy = buildEnemy({ id: 'nonexistent', level: 1 });
      assert.strictEqual(enemy.templateId, 'nonexistent');
      assert.ok(enemy.maxHp > 0); // Should still create with defaults
    });
  });

  describe('buildEnemies', () => {
    it('builds an encounter with multiple enemies', () => {
      const enemies = buildEnemies({
        enemies: [
          { id: 'slime_green', count: 2 },
          { id: 'goblin_scout', count: 1 }
        ]
      });
      assert.strictEqual(enemies.length, 3);
    });

    it('suffixes duplicate names', () => {
      const enemies = buildEnemies({
        enemies: [{ id: 'slime_green', count: 2 }]
      });
      assert.strictEqual(enemies[0].name, 'Green Slime');
      assert.strictEqual(enemies[1].name, 'Green Slime B');
    });
  });

  describe('buildConsumableInventory', () => {
    it('builds an inventory map', () => {
      const inv = buildConsumableInventory(['tiny_hp_potion', 'tiny_hp_potion', 'tiny_mp_potion']);
      assert.strictEqual(inv.tiny_hp_potion, 2);
      assert.strictEqual(inv.tiny_mp_potion, 1);
    });

    it('throws on unknown consumable', () => {
      assert.throws(() => buildConsumableInventory(['fake_item']), /unknown consumable/);
    });
  });

  describe('validateScenario', () => {
    it('accepts a valid scenario', () => {
      assert.doesNotThrow(() => validateScenario({
        id: 'test_scenario',
        party: [{ origin: 'origin_warrior', level: 1 }],
        encounter: { enemies: [{ id: 'slime_green', count: 1 }] },
        iterations: 10
      }));
    });

    it('throws on missing id', () => {
      assert.throws(() => validateScenario({
        party: [{ origin: 'origin_warrior', level: 1 }],
        encounter: { enemies: [{ id: 'slime_green' }] },
        iterations: 10
      }), /scenario.id is required/);
    });

    it('throws on missing party', () => {
      assert.throws(() => validateScenario({
        id: 'test',
        encounter: { enemies: [{ id: 'slime_green' }] },
        iterations: 10
      }), /scenario.party must be an array/);
    });

    it('throws on missing encounter', () => {
      assert.throws(() => validateScenario({
        id: 'test',
        party: [{ origin: 'origin_warrior', level: 1 }],
        iterations: 10
      }), /scenario.encounter.enemies is required/);
    });
  });
});
