/**
 * Combat Balance Lab — Priority Scenario: Physical vs Magic DPS
 *
 * Compares sustained damage output of a warrior (physical) versus an
 * arcane initiate (magic) against the same enemy type over multiple
 * combat iterations.
 *
 * This is a measurement scenario. Mage spell damage is glyph-driven by
 * design (magicPower provides sustain, not damage — see mage_scaling
 * scenario), so the physical/magic gap reflects Magic Circle investment.
 * The report will surface the exact gap.
 */

// ───────────────────────────────────────────────────────────────────────────
// Scenario 1: Warrior — sustained physical damage
// ───────────────────────────────────────────────────────────────────────────

const warriorScenario = {
  id: 'physical_dps_warrior',
  description: 'Warrior sustained physical DPS vs goblin_grunt (level 1)',
  tags: ['dps', 'physical', 'regression', 'priority'],
  iterations: 50,

  party: [
    {
      origin: 'origin_warrior',
      level: 5,
      name: 'Warrior DPS',
      stats: {
        baseMaxHp: 60,
        baseStrength: 18,
        baseDefense: 12,
        baseSpeed: 8,
        baseMagicPower: 4
      },
      skills: ['single_strike'],
      gambits: [
        {
          id: 'gambit_always_attack',
          conditions: [{ op: 'SINGLE', left: { type: 'always', value: true }, right: null }],
          action: { type: 'skill', payload: 'single_strike' },
          target: 'lowest_hp_enemy',
          enabled: true
        }
      ]
    }
  ],

  encounter: {
    enemies: [
      { id: 'goblin_grunt', count: 1, level: 1 }
    ]
  },

  assertions: [
    // Warrior should deal meaningful physical damage per hit
    { metric: 'damage.autoAttack.avgPerHit', expectedMin: 10 },
    // Should win reliably against a single goblin
    { metric: 'winRate', expectedMin: 0.95 }
  ]
};

// ───────────────────────────────────────────────────────────────────────────
// Scenario 2: Arcane Initiate — sustained magic damage
// ───────────────────────────────────────────────────────────────────────────

const mageScenario = {
  id: 'magic_dps_arcane_initiate',
  description: 'Arcane Initiate sustained magic DPS vs goblin_grunt (level 1)',
  tags: ['dps', 'magic', 'regression', 'priority'],
  iterations: 50,

  party: [
    {
      origin: 'origin_arcane_initiate',
      level: 5,
      name: 'Mage DPS',
      stats: {
        baseMaxHp: 60,
        baseMaxMp: 100,
        baseStrength: 5,
        baseDefense: 6,
        baseSpeed: 6,
        baseMagicPower: 30
      },
      magicTier: 3,
      glyphs: ['glyph_fire'],
      spells: [
        { glyphs: ['glyph_fire'] }
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
    }
  ],

  encounter: {
    enemies: [
      { id: 'goblin_grunt', count: 1, level: 1 }
    ]
  },

  assertions: [
    // Single-glyph spell: baseline damage. Higher spell damage comes from
    // richer glyph composition, not from magicPower (see mage_scaling)
    { metric: 'damage.spell."Lesser Fire Spark".avgPerHit', expectedMin: 3 },
    // Should win reliably
    { metric: 'winRate', expectedMin: 0.95 }
  ]
};

export default [warriorScenario, mageScenario];
