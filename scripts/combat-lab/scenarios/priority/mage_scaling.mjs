/**
 * Combat Balance Lab — Priority Scenario: Mage Scaling
 *
 * Verifies that spell damage scales with the hero's magicPower stat.
 * This is a KNOWN FAILURE: BattleService._castOffensiveSpell does not
 * apply a magicPower multiplier to spell damage.
 */

export default {
  id: 'mage_scaling',
  description: 'Arcane Initiate fire spell damage should scale with magicPower',
  tags: ['magic', 'scaling', 'regression', 'priority'],
  iterations: 50,
  knownFailure: true,
  knownFailureReason: 'Spell damage does not apply magicPower multiplier (see BattleService._castOffensiveSpell). Spell damage is raw base damage with no MAG scaling.',

  party: [
    {
      origin: 'origin_arcane_initiate',
      level: 5,
      name: 'Mage Test',
      stats: {
        baseMagicPower: 30,    // High magic power
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
          id: 'gambit_always_spell_0',
          condition: { type: 'always' },
          action: { type: 'spell', spellIndex: 0 },
          priority: 1
        }
      ]
    }
  ],

  encounter: {
    enemies: [
      { id: 'slime_green', count: 1, level: 3 }
    ]
  },

  assertions: [
    // With 30 MAG, even a basic fire spell should deal noticeable damage
    // Currently fails because spell damage ignores magicPower
    { metric: 'damage.spell.\"Fire Spark\".avgPerHit', expectedMin: 25 },
    // Should win reliably against a weak slime
    { metric: 'winRate', expectedMin: 0.80 }
  ]
};
