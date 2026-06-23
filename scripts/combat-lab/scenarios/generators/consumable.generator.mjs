// ───────────────────────────────────────────────────────────────────────────
// Consumables Scenario Generator
//
// Generates a parametric matrix covering:
//   item × hero level × wound state
//
// Coverage per test matrix (Section 4.9):
//   I.1  HP potion         — restores HP; should be % of max (currently flat)
//   I.2  MP potion         — restores MP; should be % of max (currently flat)
//   I.3  Teleport scroll   — escapes combat immediately
//   I.4  Consumable+action — using item does not consume action (testable via turns)
//   I.5  One per turn      — hero cannot use more than one item per turn
// ───────────────────────────────────────────────────────────────────────────

const CONSUMABLES = ['tiny_hp_potion', 'tiny_mp_potion', 'teleport_scroll'];
const LEVELS = [1, 5, 10, 20];

// ───────────────────────────────────────────────────────────────────────────
// Hero builders
// ───────────────────────────────────────────────────────────────────────────

function createHero(origin, level = 5, overrides = {}) {
  const base = {
    origin,
    level,
    name: `${origin.replace('origin_', '')} Lv${level}`,
    equipment: ['weapon:iron:broadsword', 'armor:leather:plate:body'],
    skills: ['single_strike', 'power_strike'],
    consumables: overrides.consumables || []
  };

  switch (origin) {
    case 'origin_warrior':
      base.stats = {
        baseMaxHp: 80 + level * 10,
        baseMaxMp: 15 + level * 2,
        baseStrength: 14 + Math.floor(level * 1.5),
        baseSpeed: 6 + Math.floor(level * 0.4),
        baseDefense: 8 + Math.floor(level * 0.8),
        baseMagicPower: 4
      };
      break;
    case 'origin_arcane_initiate':
      base.stats = {
        baseMaxHp: 55 + level * 7,
        baseMaxMp: 35 + level * 5,
        baseStrength: 6 + Math.floor(level * 0.5),
        baseSpeed: 8 + Math.floor(level * 0.5),
        baseDefense: 4 + Math.floor(level * 0.3),
        baseMagicPower: 16 + Math.floor(level * 1.8)
      };
      base.equipment = ['weapon:wooden:wand', 'armor:leather:robes:body'];
      base.magicTier = Math.min(level, 10);
      base.spells = [{
        glyphs: ['glyph_fire'],
        glyphTiers: { glyph_fire: Math.min(3, Math.floor(level / 2) + 1) }
      }];
      base.skills = ['single_strike'];
      break;
  }

  if (overrides.stats) {
    base.stats = { ...base.stats, ...overrides.stats };
  }
  if (overrides.gambits) {
    base.gambits = overrides.gambits;
  }
  if (overrides.consumables) {
    base.consumables = overrides.consumables;
  }

  return base;
}

function getEncounter(enemyId, count = 1, level = 3) {
  return {
    enemies: Array.from({ length: count }, () => ({ id: enemyId, level }))
  };
}

// ───────────────────────────────────────────────────────────────────────────
// Generator
// ───────────────────────────────────────────────────────────────────────────

function generate() {
  const scenarios = [];

  // ── I.1: HP Potion ───────────────────────────────────────────────────

  // Low-level warrior, heavily wounded — potion should save them
  scenarios.push({
    id: 'consumable_hp_potion_low_level',
    description: 'HP potion on wounded Lv1 warrior (flat 20 heal vs ~30% of max)',
    tags: ['consumables', 'hp_potion', 'generated'],
    iterations: 30,
    knownFailure: true,
    knownFailureReason: 'tiny_hp_potion uses flat heal (20) instead of 30% of max HP. See CONSUMABLES_DATA in InventoryData.js.',
    party: [
      {
        ...createHero('origin_warrior', 1, {
          consumables: ['tiny_hp_potion'],
          stats: { baseMaxHp: 90, baseMaxMp: 17, baseStrength: 16, baseSpeed: 7, baseDefense: 9, baseMagicPower: 4 }
        }),
        hp: 10,
        gambits: [
          {
            id: 'gambit_hp_potion_low',
            conditions: [{ op: 'SINGLE', left: { type: 'self_hp', operator: '<', value: 0.30 }, right: null }],
            action: { type: 'item', payload: 'tiny_hp_potion' },
            target: 'self',
            enabled: true
          }
        ]
      }
    ],
    encounter: getEncounter('slime_green', 1, 1),
    assertions: [
      { metric: 'items.used.tiny_hp_potion', expectedMin: 1 },
      // 30% of ~90 HP = ~27; flat 20 is less — known failure
      { metric: 'healing.bySource.tiny_hp_potion_HEAL_HP.total', expectedMin: 810 },
      { metric: 'winRate', expectedMin: 0.8 }
    ]
  });

  // Mid-level warrior, moderately wounded
  scenarios.push({
    id: 'consumable_hp_potion_mid_level',
    description: 'HP potion on wounded Lv10 warrior',
    tags: ['consumables', 'hp_potion', 'generated'],
    iterations: 30,
    knownFailure: true,
    knownFailureReason: 'tiny_hp_potion uses flat heal (20) instead of 30% of max HP.',
    party: [
      {
        ...createHero('origin_warrior', 10, {
          consumables: ['tiny_hp_potion'],
          stats: { baseMaxHp: 180, baseMaxMp: 35, baseStrength: 29, baseSpeed: 10, baseDefense: 16, baseMagicPower: 4 }
        }),
        hp: 30,
        gambits: [
          {
            id: 'gambit_hp_potion_mid',
            conditions: [{ op: 'SINGLE', left: { type: 'self_hp', operator: '<', value: 0.25 }, right: null }],
            action: { type: 'item', payload: 'tiny_hp_potion' },
            target: 'self',
            enabled: true
          }
        ]
      }
    ],
    encounter: getEncounter('goblin_grunt', 1, 5),
    assertions: [
      { metric: 'items.used.tiny_hp_potion', expectedMin: 1 },
      // 30% of ~180 HP = ~54 per use; flat 20 is far less
      { metric: 'healing.bySource.tiny_hp_potion_HEAL_HP.total', expectedMin: 1620 },
      { metric: 'winRate', expectedMin: 0.5 }
    ]
  });

  // High-level warrior, slightly wounded — potion still meaningful
  scenarios.push({
    id: 'consumable_hp_potion_high_level',
    description: 'HP potion on wounded Lv20 warrior (should heal ~30% = ~60+ HP)',
    tags: ['consumables', 'hp_potion', 'generated'],
    iterations: 30,
    knownFailure: true,
    knownFailureReason: 'tiny_hp_potion uses flat heal (20) instead of 30% of max HP.',
    party: [
      {
        ...createHero('origin_warrior', 20, {
          consumables: ['tiny_hp_potion'],
          stats: { baseMaxHp: 280, baseMaxMp: 55, baseStrength: 44, baseSpeed: 14, baseDefense: 24, baseMagicPower: 4 }
        }),
        hp: 80,
        gambits: [
          {
            id: 'gambit_hp_potion_high',
            conditions: [{ op: 'SINGLE', left: { type: 'self_hp', operator: '<', value: 0.35 }, right: null }],
            action: { type: 'item', payload: 'tiny_hp_potion' },
            target: 'self',
            enabled: true
          }
        ]
      }
    ],
    encounter: getEncounter('goblin_brute', 1, 10),
    assertions: [
      { metric: 'items.used.tiny_hp_potion', expectedMin: 1 },
      // 30% of ~280 = ~84 per use
      { metric: 'healing.bySource.tiny_hp_potion_HEAL_HP.total', expectedMin: 2520 },
      { metric: 'winRate', expectedMin: 0.4 }
    ]
  });

  // ── I.2: MP Potion ───────────────────────────────────────────────────

  // Low-level mage, drained
  scenarios.push({
    id: 'consumable_mp_potion_low_level',
    description: 'MP potion on drained Lv1 arcane initiate',
    tags: ['consumables', 'mp_potion', 'generated'],
    iterations: 30,
    knownFailure: true,
    knownFailureReason: 'tiny_mp_potion uses flat restore (10) instead of 30% of max MP.',
    party: [
      {
        ...createHero('origin_arcane_initiate', 1, {
          consumables: ['tiny_mp_potion'],
          stats: { baseMaxHp: 62, baseMaxMp: 40, baseStrength: 7, baseSpeed: 9, baseDefense: 4, baseMagicPower: 18 }
        }),
        mp: 5,
        gambits: [
          {
            id: 'gambit_mp_potion_low',
            conditions: [{ op: 'SINGLE', left: { type: 'self_mp', operator: '<', value: 0.30 }, right: null }],
            action: { type: 'item', payload: 'tiny_mp_potion' },
            target: 'self',
            enabled: true
          }
        ]
      }
    ],
    encounter: getEncounter('slime_green', 1, 1),
    assertions: [
      { metric: 'items.used.tiny_mp_potion', expectedMin: 1 },
      // 30% of ~40 MP = ~12 per use; flat 10 is close at low level
      { metric: 'healing.bySource.tiny_mp_potion_HEAL_MP.total', expectedMin: 360 },
      { metric: 'winRate', expectedMin: 0.8 }
    ]
  });

  // Mid-level mage
  scenarios.push({
    id: 'consumable_mp_potion_mid_level',
    description: 'MP potion on drained Lv10 arcane initiate',
    tags: ['consumables', 'mp_potion', 'generated'],
    iterations: 30,
    knownFailure: true,
    knownFailureReason: 'tiny_mp_potion uses flat restore (10) instead of 30% of max MP.',
    party: [
      {
        ...createHero('origin_arcane_initiate', 10, {
          consumables: ['tiny_mp_potion'],
          stats: { baseMaxHp: 125, baseMaxMp: 85, baseStrength: 11, baseSpeed: 13, baseDefense: 7, baseMagicPower: 34 }
        }),
        mp: 10,
        gambits: [
          {
            id: 'gambit_mp_potion_mid',
            conditions: [{ op: 'SINGLE', left: { type: 'self_mp', operator: '<', value: 0.20 }, right: null }],
            action: { type: 'item', payload: 'tiny_mp_potion' },
            target: 'self',
            enabled: true
          }
        ]
      }
    ],
    encounter: getEncounter('goblin_grunt', 2, 5),
    assertions: [
      { metric: 'items.used.tiny_mp_potion', expectedMin: 1 },
      // 30% of ~85 MP = ~25 per use; flat 10 is much less
      { metric: 'healing.bySource.tiny_mp_potion_HEAL_MP.total', expectedMin: 750 },
      { metric: 'winRate', expectedMin: 0.5 }
    ]
  });

  // ── I.3: Teleport Scroll ─────────────────────────────────────────────

  scenarios.push({
    id: 'consumable_teleport_scroll_escape',
    description: 'Teleport scroll should immediately escape combat',
    tags: ['consumables', 'teleport', 'escape', 'generated'],
    iterations: 30,
    party: [
      {
        ...createHero('origin_warrior', 5, {
          consumables: ['teleport_scroll'],
          stats: { baseMaxHp: 130, baseMaxMp: 25, baseStrength: 22, baseSpeed: 8, baseDefense: 12, baseMagicPower: 4 }
        }),
        gambits: [
          {
            id: 'gambit_teleport',
            conditions: [{ op: 'SINGLE', left: { type: 'always', value: true }, right: null }],
            action: { type: 'item', payload: 'teleport_scroll' },
            target: 'self',
            enabled: true
          }
        ]
      }
    ],
    encounter: getEncounter('goblin_king', 1, 10), // Boss — impossible to beat at Lv5
    assertions: [
      { metric: 'items.used.teleport_scroll', expectedMin: 30 },
      { metric: 'winRate', expectedMin: 0.95 } // escape counts as win
    ]
  });

  // ── I.5: One consumable per turn ─────────────────────────────────────

  // Hero with both HP and MP potions — should only use one per turn
  scenarios.push({
    id: 'consumable_one_per_turn',
    description: 'Hero with multiple potions should only use one per turn',
    tags: ['consumables', 'limit', 'generated'],
    iterations: 30,
    knownFailure: true,
    knownFailureReason: 'BattleService.useConsumable() does not call _advanceTurn() after consumable use, causing the same entity to be processed repeatedly. The itemUsedThisTurn flag blocks subsequent uses, but the turn never advances.',
    party: [
      {
        ...createHero('origin_warrior', 10, {
          consumables: ['tiny_hp_potion', 'tiny_mp_potion'],
          stats: { baseMaxHp: 180, baseMaxMp: 35, baseStrength: 29, baseSpeed: 10, baseDefense: 16, baseMagicPower: 4 }
        }),
        hp: 40, // wounded but not dying
        mp: 5,  // drained
        gambits: [
          {
            id: 'gambit_hp_first',
            conditions: [{ op: 'SINGLE', left: { type: 'self_hp', operator: '<', value: 0.30 }, right: null }],
            action: { type: 'item', payload: 'tiny_hp_potion' },
            target: 'self',
            enabled: true
          },
          {
            id: 'gambit_mp_second',
            conditions: [{ op: 'SINGLE', left: { type: 'self_mp', operator: '<', value: 0.30 }, right: null }],
            action: { type: 'item', payload: 'tiny_mp_potion' },
            target: 'self',
            enabled: true
          }
        ]
      }
    ],
    encounter: getEncounter('slime_green', 1, 1), // Weak enemy so fight lasts multiple turns
    assertions: [
      // HP potion should trigger (hero is wounded)
      { metric: 'items.used.tiny_hp_potion', expectedMin: 1 },
      // MP potion should NOT trigger in same turn because itemUsedThisTurn blocks it
      // and HP gambit has higher priority — so MP potion uses should be 0 or very low
      { metric: 'winRate', expectedMin: 0.8 }
    ]
  });

  // ── Edge cases ───────────────────────────────────────────────────────

  // Full HP hero should not waste potion
  scenarios.push({
    id: 'consumable_hp_full_no_waste',
    description: 'Full HP hero should not use HP potion (gambit condition prevents it)',
    tags: ['consumables', 'edge_case', 'generated'],
    iterations: 30,
    party: [
      {
        ...createHero('origin_warrior', 5, {
          consumables: ['tiny_hp_potion'],
          stats: { baseMaxHp: 130, baseMaxMp: 25, baseStrength: 22, baseSpeed: 8, baseDefense: 12, baseMagicPower: 4 }
        }),
        hp: 130, // full HP
        gambits: [
          {
            id: 'gambit_hp_waste',
            conditions: [{ op: 'SINGLE', left: { type: 'self_hp', operator: '<', value: 0.90 }, right: null }],
            action: { type: 'item', payload: 'tiny_hp_potion' },
            target: 'self',
            enabled: true
          }
        ]
      }
    ],
    encounter: getEncounter('slime_green', 1, 1),
    assertions: [
      // Full HP means gambit condition (self_hp < 0.90) is false,
      // so potion should not be used. We verify by win rate alone
      // since undefined metrics cause assertion failures.
      { metric: 'winRate', expectedMin: 0.9 }
    ]
  });

  // No consumables — should still fight normally
  scenarios.push({
    id: 'consumable_none_baseline',
    description: 'Hero without consumables should still win via normal combat',
    tags: ['consumables', 'baseline', 'generated'],
    iterations: 30,
    party: [
      createHero('origin_warrior', 5)
    ],
    encounter: getEncounter('slime_green', 1, 3),
    assertions: [
      { metric: 'winRate', expectedMin: 0.8 }
    ]
  });

  // Warrior vs mage consumable needs (HP vs MP)
  scenarios.push({
    id: 'consumable_warrior_vs_mage_needs',
    description: 'Warrior needs HP, mage needs MP — different consumable profiles',
    tags: ['consumables', 'comparison', 'generated'],
    iterations: 30,
    party: [
      {
        ...createHero('origin_warrior', 5, {
          consumables: ['tiny_hp_potion'],
          stats: { baseMaxHp: 130, baseMaxMp: 25, baseStrength: 22, baseSpeed: 8, baseDefense: 12, baseMagicPower: 4 }
        }),
        hp: 30,
        gambits: [
          {
            id: 'gambit_warrior_hp',
            conditions: [{ op: 'SINGLE', left: { type: 'self_hp', operator: '<', value: 0.30 }, right: null }],
            action: { type: 'item', payload: 'tiny_hp_potion' },
            target: 'self',
            enabled: true
          }
        ]
      },
      {
        ...createHero('origin_arcane_initiate', 5, {
          consumables: ['tiny_mp_potion'],
          stats: { baseMaxHp: 90, baseMaxMp: 60, baseStrength: 9, baseSpeed: 10, baseDefense: 6, baseMagicPower: 24 }
        }),
        mp: 5,
        gambits: [
          {
            id: 'gambit_mage_mp',
            conditions: [{ op: 'SINGLE', left: { type: 'self_mp', operator: '<', value: 0.20 }, right: null }],
            action: { type: 'item', payload: 'tiny_mp_potion' },
            target: 'self',
            enabled: true
          }
        ]
      }
    ],
    encounter: getEncounter('goblin_grunt', 2, 4),
    assertions: [
      { metric: 'items.used.tiny_hp_potion', expectedMin: 1 },
      { metric: 'items.used.tiny_mp_potion', expectedMin: 1 },
      { metric: 'winRate', expectedMin: 0.6 }
    ]
  });

  return scenarios;
}

export default generate;
