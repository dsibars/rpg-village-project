/**
 * Combat Balance Lab — Priority Scenario: Healing Potions
 *
 * Verifies that HP and MP potions restore a percentage of max HP/MP,
 * not a flat amount.
 *
 * KNOWN FAILURE: CONSUMABLES_DATA defines potions with flat amounts:
 *   - tiny_hp_potion: { type: 'HEAL_HP', amount: 20 }  (should be 30% of max HP)
 *   - tiny_mp_potion: { type: 'HEAL_MP', amount: 10 }  (should be 30% of max MP)
 *
 * Per design doc, potions should heal 30% of the respective max stat.
 */

// ───────────────────────────────────────────────────────────────────────────
// HP Potion Scenario
// ───────────────────────────────────────────────────────────────────────────

const hpScenario = {
  id: 'healing_potions_hp',
  description: 'HP potions should restore 30% of max HP, not a flat 20',
  tags: ['consumables', 'healing', 'regression', 'priority'],
  iterations: 50,
  knownFailure: true,
  knownFailureReason: 'tiny_hp_potion uses flat heal amount (20) instead of 30% of max HP. See CONSUMABLES_DATA in InventoryData.js.',

  party: [
    {
      origin: 'origin_warrior',
      level: 20,
      name: 'HP Potion Test',
      stats: {
        baseMaxHp: 125,   // ~131 max HP after origin multiplier (1.05)
        baseStrength: 20,
        baseSpeed: 8,
        baseDefense: 10,
        baseMagicPower: 4
      },
      hp: 10,             // Start wounded (~7.6% HP) so gambit triggers immediately
      gambits: [
        {
          id: 'gambit_hp_potion',
          conditions: [{ op: 'SINGLE', left: { type: 'self_hp', operator: '<', value: 0.20 }, right: null }],
          action: { type: 'item', payload: 'tiny_hp_potion' },
          target: 'self',
          enabled: true
        }
      ]
    }
  ],

  encounter: {
    enemies: [
      { id: 'slime_green', count: 1, level: 1 }
    ]
  },

  assertions: [
    // Potion should be used at least once per iteration (50 times across 50 runs)
    { metric: 'items.used.tiny_hp_potion', expectedMin: 50 },
    // With 30% of ~131 HP = ~39 per use, 50 uses should total ~1950+
    // Currently flat 20 × 50 = 1000, so this will fail
    { metric: 'healing.bySource.tiny_hp_potion_HEAL_HP.total', expectedMin: 1950 },
    // Should win reliably against a weak slime
    { metric: 'winRate', expectedMin: 0.95 }
  ]
};

// ───────────────────────────────────────────────────────────────────────────
// MP Potion Scenario
// ───────────────────────────────────────────────────────────────────────────

const mpScenario = {
  id: 'healing_potions_mp',
  description: 'MP potions should restore 30% of max MP, not a flat 10',
  tags: ['consumables', 'healing', 'regression', 'priority'],
  iterations: 50,
  knownFailure: true,
  knownFailureReason: 'tiny_mp_potion uses flat restore amount (10) instead of 30% of max MP. See CONSUMABLES_DATA in InventoryData.js.',

  party: [
    {
      origin: 'origin_arcane_initiate',
      level: 15,
      name: 'MP Potion Test',
      stats: {
        baseMaxHp: 80,
        baseMaxMp: 43,    // ~51 max MP after origin multiplier (1.20)
        baseStrength: 5,
        baseSpeed: 6,
        baseDefense: 6,
        baseMagicPower: 20
      },
      mp: 5,             // Start drained (~10% MP) so gambit triggers immediately
      gambits: [
        {
          id: 'gambit_mp_potion',
          conditions: [{ op: 'SINGLE', left: { type: 'self_mp', operator: '<', value: 0.20 }, right: null }],
          action: { type: 'item', payload: 'tiny_mp_potion' },
          target: 'self',
          enabled: true
        }
      ]
    }
  ],

  encounter: {
    enemies: [
      { id: 'slime_green', count: 1, level: 1 }
    ]
  },

  assertions: [
    // Potion should be used at least once per iteration
    { metric: 'items.used.tiny_mp_potion', expectedMin: 50 },
    // With 30% of ~51 MP = ~15 per use, 50 uses should total ~750+
    // Currently flat 10 × 50 = 500, so this will fail
    { metric: 'healing.bySource.tiny_mp_potion_HEAL_MP.total', expectedMin: 750 },
    // Should win reliably
    { metric: 'winRate', expectedMin: 0.95 }
  ]
};

export default [hpScenario, mpScenario];
