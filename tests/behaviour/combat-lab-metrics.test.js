globalThis.localStorage = {
  getItem() { return null; },
  setItem() {},
  removeItem() {},
  clear() {}
};

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parseCombatLog, aggregateMetrics, resolveMetric } from '../../scripts/combat-lab/metrics.mjs';

describe('combat-lab metrics', () => {
  describe('parseCombatLog', () => {
    it('parses a single spell damage event', () => {
      const log = [
        {
          type: 'SPELL_DAMAGE',
          actorId: 'h1',
          actorName: 'Mira',
          spellName: 'Fireball',
          amount: 50,
          targetId: 'e1',
          targetName: 'Goblin'
        }
      ];
      const metrics = parseCombatLog(log, 'heroes');
      assert.strictEqual(metrics.winner, 'heroes');
      assert.strictEqual(metrics.damage.spell.Fireball.total, 50);
      assert.strictEqual(metrics.damage.spell.Fireball.hits, 1);
      assert.strictEqual(metrics.damage.spell.Fireball.avgPerHit, 50);
    });

    it('parses multiple spell hits and computes averages', () => {
      const log = [
        { type: 'SPELL_DAMAGE', actorId: 'h1', spellName: 'Fireball', amount: 30, targetId: 'e1' },
        { type: 'SPELL_DAMAGE', actorId: 'h1', spellName: 'Fireball', amount: 70, targetId: 'e2' }
      ];
      const metrics = parseCombatLog(log);
      assert.strictEqual(metrics.damage.spell.Fireball.total, 100);
      assert.strictEqual(metrics.damage.spell.Fireball.hits, 2);
      assert.strictEqual(metrics.damage.spell.Fireball.avgPerHit, 50);
    });

    it('distinguishes autoAttack from skills', () => {
      const log = [
        { type: 'DAMAGE', actorId: 'h1', skillId: 'single_strike', amount: 10, hits: 1, isCrit: false, isMiss: false, targetId: 'e1' },
        { type: 'DAMAGE', actorId: 'h1', skillId: 'power_strike', amount: 25, hits: 1, isCrit: false, isMiss: false, targetId: 'e1' }
      ];
      const metrics = parseCombatLog(log);
      assert.strictEqual(metrics.damage.autoAttack.total, 10);
      assert.strictEqual(metrics.damage.skill.power_strike.total, 25);
    });

    it('tracks misses and crits', () => {
      const log = [
        { type: 'DAMAGE', actorId: 'h1', skillId: 'single_strike', amount: 0, hits: 1, isCrit: false, isMiss: true, targetId: 'e1' },
        { type: 'DAMAGE', actorId: 'h1', skillId: 'single_strike', amount: 30, hits: 1, isCrit: true, isMiss: false, targetId: 'e1' }
      ];
      const metrics = parseCombatLog(log);
      assert.strictEqual(metrics.damage.autoAttack.misses, 1);
      assert.strictEqual(metrics.damage.autoAttack.crits, 1);
      assert.strictEqual(metrics.damage.autoAttack.total, 30);
      assert.strictEqual(metrics.damage.autoAttack.hits, 1); // only the hit counts
    });

    it('handles multi-hit skills correctly', () => {
      const log = [
        { type: 'DAMAGE', actorId: 'h1', skillId: 'multiple_attack', amount: 42, hits: 3, isCrit: false, isMiss: false, targetId: 'e1' }
      ];
      const metrics = parseCombatLog(log);
      assert.strictEqual(metrics.damage.skill.multiple_attack.total, 42);
      assert.strictEqual(metrics.damage.skill.multiple_attack.hits, 3);
      assert.strictEqual(metrics.damage.skill.multiple_attack.avgPerHit, 14);
    });

    it('tracks status effect damage and ticks', () => {
      const log = [
        { type: 'STAMINA_REGEN', actorId: 'h1', amount: 5 },
        { type: 'STATUS_TICK', effectType: 'poison', damage: 5, targetId: 'h1', targetName: 'Hero' },
        { type: 'STATUS_TICK', effectType: 'poison', damage: 5, targetId: 'h1', targetName: 'Hero' },
        { type: 'STATUS_TICK', effectType: 'burn', damage: 4, targetId: 'e1', targetName: 'Goblin' }
      ];
      const metrics = parseCombatLog(log);
      assert.strictEqual(metrics.damage.statusEffect.total, 14);
      assert.strictEqual(metrics.damage.statusEffect.hits, 3);
      assert.strictEqual(metrics.statusEffects.ticks.poison, 2);
      assert.strictEqual(metrics.statusEffects.ticks.burn, 1);
    });

    it('tracks status applications attached to damage events', () => {
      const log = [
        { type: 'DAMAGE', actorId: 'h1', skillId: 'shield_bash', amount: 15, hits: 1, statusApplied: 'stun', targetId: 'e1' },
        { type: 'DAMAGE', actorId: 'h1', skillId: 'poison_strike', amount: 12, hits: 1, statusApplied: 'poison', targetId: 'e1' }
      ];
      const metrics = parseCombatLog(log);
      assert.strictEqual(metrics.statusEffects.applied.stun, 1);
      assert.strictEqual(metrics.statusEffects.applied.poison, 1);
    });

    it('tracks healing from multiple sources', () => {
      const log = [
        { type: 'HEAL', actorId: 'h1', targetId: 'h2', amount: 25, source: 'spell' },
        { type: 'VAMP', actorId: 'h1', targetId: 'h1', amount: 8 },
        { type: 'TRAIT_REGEN', targetId: 'h2', amount: 5, targetName: 'Hero 2' }
      ];
      const metrics = parseCombatLog(log);
      assert.strictEqual(metrics.healing.total, 38);
      assert.strictEqual(metrics.healing.ticks, 3);
      assert.strictEqual(metrics.healing.bySource.spell.total, 25);
      assert.strictEqual(metrics.healing.bySource.vampirism.total, 8);
      assert.strictEqual(metrics.healing.bySource.trait_regen.total, 5);
    });

    it('tracks consumable usage', () => {
      const log = [
        { type: 'USE_CONSUMABLE', actorId: 'h1', consumableId: 'tiny_hp_potion', amount: 20, targetId: 'h1' },
        { type: 'USE_CONSUMABLE', actorId: 'h1', consumableId: 'tiny_hp_potion', amount: 20, targetId: 'h1' }
      ];
      const metrics = parseCombatLog(log);
      assert.strictEqual(metrics.items.used.tiny_hp_potion, 2);
    });

    it('counts turns via actor change heuristic', () => {
      const log = [
        // Hero 1 turn
        { type: 'STAMINA_REGEN', actorId: 'h1', amount: 5 },
        { type: 'DAMAGE', actorId: 'h1', skillId: 'single_strike', amount: 10, hits: 1, targetId: 'e1' },
        // Enemy 1 turn
        { type: 'DAMAGE', actorId: 'e1', skillId: 'single_strike', amount: 5, hits: 1, targetId: 'h1' },
        // Hero 2 turn (stunned)
        { type: 'STAMINA_REGEN', actorId: 'h2', amount: 5 },
        { type: 'STUN_SKIP', actorId: 'h2' },
        // Hero 1 turn again
        { type: 'STAMINA_REGEN', actorId: 'h1', amount: 5 },
        { type: 'DAMAGE', actorId: 'h1', skillId: 'single_strike', amount: 10, hits: 1, targetId: 'e1' }
      ];
      const metrics = parseCombatLog(log);
      assert.strictEqual(metrics.turns, 4);
    });

    it('counts status ticks as part of the same turn', () => {
      const log = [
        { type: 'STAMINA_REGEN', actorId: 'h1', amount: 5 },
        { type: 'STATUS_TICK', effectType: 'poison', damage: 3, targetId: 'h1' },
        { type: 'TRAIT_REGEN', targetId: 'h1', amount: 2 },
        { type: 'DAMAGE', actorId: 'h1', skillId: 'single_strike', amount: 10, hits: 1, targetId: 'e1' }
      ];
      const metrics = parseCombatLog(log);
      assert.strictEqual(metrics.turns, 1);
      assert.strictEqual(metrics.damage.statusEffect.total, 3);
      assert.strictEqual(metrics.healing.bySource.trait_regen.total, 2);
    });

    it('handles a full simulated combat log', () => {
      const log = [
        // Round 1: h1 attacks, e1 counter-attacks
        { type: 'STAMINA_REGEN', actorId: 'h1', amount: 5 },
        { type: 'DAMAGE', actorId: 'h1', skillId: 'single_strike', amount: 15, hits: 1, isCrit: false, isMiss: false, targetId: 'e1' },
        { type: 'DAMAGE', actorId: 'e1', skillId: 'single_strike', amount: 5, hits: 1, isCrit: false, isMiss: false, targetId: 'h1' },
        // Round 2: h1 casts spell, e1 dies
        { type: 'STAMINA_REGEN', actorId: 'h1', amount: 5 },
        { type: 'SPELL_DAMAGE', actorId: 'h1', spellName: 'Fireball', amount: 50, targetId: 'e1', targetDefeated: true }
      ];
      const metrics = parseCombatLog(log, 'heroes');
      assert.strictEqual(metrics.turns, 3);
      assert.strictEqual(metrics.winner, 'heroes');
      assert.strictEqual(metrics.damage.autoAttack.total, 20);
      assert.strictEqual(metrics.damage.spell.Fireball.total, 50);
      assert.strictEqual(metrics.damage.autoAttack.hits, 2);
      assert.strictEqual(metrics.damage.spell.Fireball.hits, 1);
    });

    it('returns null winner when not provided', () => {
      const log = [{ type: 'DAMAGE', actorId: 'h1', skillId: 'single_strike', amount: 10, hits: 1, targetId: 'e1' }];
      const metrics = parseCombatLog(log);
      assert.strictEqual(metrics.winner, null);
    });
  });

  describe('aggregateMetrics', () => {
    it('aggregates multiple combat runs', () => {
      const m1 = parseCombatLog([
        { type: 'DAMAGE', actorId: 'h1', skillId: 'single_strike', amount: 10, hits: 1, targetId: 'e1' }
      ], 'heroes');
      const m2 = parseCombatLog([
        { type: 'DAMAGE', actorId: 'h1', skillId: 'single_strike', amount: 20, hits: 1, targetId: 'e1' }
      ], 'heroes');
      const m3 = parseCombatLog([
        { type: 'DAMAGE', actorId: 'e1', skillId: 'single_strike', amount: 15, hits: 1, targetId: 'h1' }
      ], 'enemies');

      const agg = aggregateMetrics([m1, m2, m3]);
      assert.strictEqual(agg.iterations, 3);
      assert.strictEqual(agg.wins, 2);
      assert.strictEqual(agg.losses, 1);
      assert.strictEqual(agg.winRate, 2 / 3);
      assert.strictEqual(agg.damage.autoAttack.total, 45);
      assert.strictEqual(agg.damage.autoAttack.hits, 3);
      assert.strictEqual(agg.avgTurns, 1);
    });

    it('returns empty aggregate for empty array', () => {
      const agg = aggregateMetrics([]);
      assert.strictEqual(agg.iterations, 0);
      assert.strictEqual(agg.winRate, 0);
      assert.strictEqual(agg.avgTurns, 0);
    });

    it('merges spell damage across combats', () => {
      const m1 = parseCombatLog([
        { type: 'SPELL_DAMAGE', actorId: 'h1', spellName: 'Fireball', amount: 30, targetId: 'e1' }
      ], 'heroes');
      const m2 = parseCombatLog([
        { type: 'SPELL_DAMAGE', actorId: 'h1', spellName: 'Fireball', amount: 50, targetId: 'e1' },
        { type: 'SPELL_DAMAGE', actorId: 'h1', spellName: 'Ice Shard', amount: 20, targetId: 'e1' }
      ], 'heroes');

      const agg = aggregateMetrics([m1, m2]);
      assert.strictEqual(agg.damage.spell.Fireball.total, 80);
      assert.strictEqual(agg.damage.spell.Fireball.hits, 2);
      assert.strictEqual(agg.damage.spell['Ice Shard'].total, 20);
      assert.strictEqual(agg.damage.spell['Ice Shard'].hits, 1);
    });
  });

  describe('resolveMetric', () => {
    it('resolves dotted paths on aggregated metrics', () => {
      const m1 = parseCombatLog([
        { type: 'SPELL_DAMAGE', actorId: 'h1', spellName: 'Fireball', amount: 50, targetId: 'e1' }
      ], 'heroes');
      const agg = aggregateMetrics([m1]);
      assert.strictEqual(resolveMetric(agg, 'damage.spell.Fireball.total'), 50);
      assert.strictEqual(resolveMetric(agg, 'damage.spell.Fireball.hits'), 1);
      assert.strictEqual(resolveMetric(agg, 'winRate'), 1);
      assert.strictEqual(resolveMetric(agg, 'avgTurns'), 1);
      assert.strictEqual(resolveMetric(agg, 'nonexistent.path'), undefined);
    });
  });
});
