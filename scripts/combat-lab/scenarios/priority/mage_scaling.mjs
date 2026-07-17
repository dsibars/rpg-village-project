/**
 * Combat Balance Lab — Priority Scenario: Mage Scaling
 *
 * Locks in the current magic design (see docs/shared/combat/magic_circle_system.md):
 * spell damage comes ENTIRELY from Magic Circle glyph composition.
 * The hero's magicPower stat does NOT multiply spell damage — it provides
 * caster sustain (max MP, MP regeneration, magicDefense).
 *
 * This pair of scenarios runs the same single-glyph spell at two extremes
 * of magicPower and asserts the SAME damage band for both. If spell damage
 * ever scales with magicPower again, mage_scaling_high_mag will exceed the
 * band and fail loudly.
 */

const baseMage = {
  origin: 'origin_arcane_initiate',
  level: 5,
  name: 'Mage Test',
  stats: {
    baseMaxHp: 60,
    baseMaxMp: 100,
    baseStrength: 5,
    baseSpeed: 6,
    baseDefense: 4
  },
  magicTier: 3,
  glyphs: ['glyph_fire'],
  spells: [
    { glyphs: ['glyph_fire'] }  // Simple fire spark
  ],
  gambits: [
    {
      id: 'gambit_always_fire_spark',
      conditions: [{ op: 'SINGLE', left: { type: 'always', value: true }, right: null }],
      action: { type: 'spell', payload: 'Lesser Fire Spark' },
      target: 'lowest_hp_enemy',
      enabled: true
    }
  ]
};

const encounter = {
  enemies: [
    { id: 'goblin_grunt', count: 1, level: 1 }
  ]
};

// Same glyph spell, so both mages must land in this band regardless of magicPower.
// Spell damage is deterministic (no variance roll); single-glyph spark currently
// lands at 30 vs goblin_grunt. The regression signal is the HIGH-MAG mage
// escaping the band upward (old formula 1+MAG/20 would deal 120 at 60 MAG).
const SPELL_DAMAGE_BAND = { expectedMin: 24, expectedMax: 36 };

const lowMagScenario = {
  id: 'mage_scaling',
  description: 'Spell damage is glyph-driven: low-magicPower mage still deals full spell damage',
  tags: ['magic', 'scaling', 'regression', 'priority'],
  iterations: 50,

  party: [{ ...baseMage, stats: { ...baseMage.stats, baseMagicPower: 5 } }],
  encounter,

  assertions: [
    { metric: 'damage.spell."Lesser Fire Spark".avgPerHit', ...SPELL_DAMAGE_BAND },
    { metric: 'winRate', expectedMin: 0.80 }
  ]
};

const highMagScenario = {
  id: 'mage_scaling_high_mag',
  description: 'Spell damage is glyph-driven: high magicPower must NOT increase spell damage',
  tags: ['magic', 'scaling', 'regression', 'priority'],
  iterations: 50,

  party: [{ ...baseMage, stats: { ...baseMage.stats, baseMagicPower: 60 } }],
  encounter,

  assertions: [
    { metric: 'damage.spell."Lesser Fire Spark".avgPerHit', ...SPELL_DAMAGE_BAND },
    { metric: 'winRate', expectedMin: 0.80 }
  ]
};

export default [lowMagScenario, highMagScenario];
