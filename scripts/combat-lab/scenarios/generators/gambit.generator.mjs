// ───────────────────────────────────────────────────────────────────────────
// Gambit Scenario Generator
//
// Generates a parametric matrix covering:
//   condition × action × priority × target selection
//
// Coverage per test matrix (Section 4.6):
//   G.1  ally_hp condition      — heal when ally below threshold
//   G.2  enemy_hp condition     — execute when enemy below threshold
//   G.3  enemy_element condition — use correct element vs weakness (priority: knownFailure)
//   G.4  enemy_type condition    — different action vs beast/humanoid/etc (priority: knownFailure)
//   G.5  battle_phase condition  — different action early/late (priority: knownFailure)
//   G.6  Gambit priority order   — higher-priority overrides lower ones
//   G.7  MP/STA awareness        — selects action hero can afford
//   G.8  Target selection        — heal lowest ally, attack lowest enemy, etc.
//
// Note: G.3–G.5 are fully covered in priority/gambit_conditions.mjs as
// knownFailure scenarios. This generator focuses on G.1, G.2, G.6–G.8.
// ───────────────────────────────────────────────────────────────────────────

// ───────────────────────────────────────────────────────────────────────────
// Hero helpers
// ───────────────────────────────────────────────────────────────────────────

function createHero(origin, level = 5, overrides = {}) {
  const base = {
    origin,
    level,
    name: `${origin.replace('origin_', '')} Lv${level}`,
    equipment: ['weapon:iron:broadsword', 'armor:leather:plate:body'],
    skills: ['single_strike', 'power_strike'],
    gambits: [
      {
        id: 'gambit_always_attack',
        conditions: [{ op: 'SINGLE', left: { type: 'always', value: true }, right: null }],
        action: { type: 'skill', payload: 'single_strike' },
        target: 'lowest_hp_enemy',
        enabled: true
      }
    ]
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
      base.skills = ['single_strike'];
      break;
    case 'origin_thief':
      base.stats = {
        baseMaxHp: 65 + level * 7,
        baseMaxMp: 20 + level * 3,
        baseStrength: 12 + Math.floor(level * 1.0),
        baseSpeed: 10 + Math.floor(level * 0.8),
        baseDefense: 6 + Math.floor(level * 0.4),
        baseMagicPower: 6
      };
      break;
    case 'origin_monk':
      base.stats = {
        baseMaxHp: 70 + level * 8,
        baseMaxMp: 25 + level * 3,
        baseStrength: 11 + Math.floor(level * 1.1),
        baseSpeed: 9 + Math.floor(level * 0.6),
        baseDefense: 7 + Math.floor(level * 0.5),
        baseMagicPower: 8
      };
      break;
    case 'origin_guard':
      base.stats = {
        baseMaxHp: 90 + level * 12,
        baseMaxMp: 15 + level * 2,
        baseStrength: 12 + Math.floor(level * 1.2),
        baseSpeed: 5 + Math.floor(level * 0.3),
        baseDefense: 10 + Math.floor(level * 1.0),
        baseMagicPower: 3
      };
      break;
  }

  if (overrides.stats) {
    base.stats = { ...base.stats, ...overrides.stats };
  }
  if (overrides.skills) {
    base.skills = overrides.skills;
  }
  if (overrides.gambits) {
    base.gambits = overrides.gambits;
  }
  if (overrides.consumables) {
    base.consumables = overrides.consumables;
  }
  if (overrides.spells) {
    base.spells = overrides.spells;
  }
  if (overrides.hp !== undefined) {
    base.hp = overrides.hp;
  }
  if (overrides.mp !== undefined) {
    base.mp = overrides.mp;
  }
  if (overrides.stamina !== undefined) {
    base.stamina = overrides.stamina;
  }
  if (overrides.statusEffects) {
    base.statusEffects = overrides.statusEffects;
  }

  return base;
}

function getEnemy(id, level = 3, overrides = {}) {
  return {
    id,
    level,
    count: overrides.count || 1,
    statusEffects: overrides.statusEffects || []
  };
}

// ───────────────────────────────────────────────────────────────────────────
// Generator
// ───────────────────────────────────────────────────────────────────────────

function generate() {
  const scenarios = [];

  // ═══════════════════════════════════════════════════════════════════════
  // G.1: ally_hp condition — heal when ally below threshold
  // ═══════════════════════════════════════════════════════════════════════

  // Simple: two warriors, one with a heal-item gambit on ally_hp < 0.4
  for (const level of [3, 7, 12]) {
    scenarios.push({
      id: `gambit_ally_hp_heal_lv${level}`,
      description: `Guard at Lv${level} uses tiny_hp_potion when ally drops below 40% HP`,
      tags: ['gambits', 'ally_hp', 'generated'],
      iterations: 30,
      party: [
        createHero('origin_warrior', level, {
          stats: { baseMaxHp: 80 + level * 10 }
        }),
        createHero('origin_guard', level, {
          stats: { baseMaxHp: 90 + level * 12, baseStrength: 12 + Math.floor(level * 1.2) },
          skills: ['single_strike'],
          gambits: [
            {
              id: 'gambit_heal_ally',
              conditions: [{ op: 'SINGLE', left: { type: 'ally_hp', operator: '<', value: 0.4 }, right: null }],
              action: { type: 'item', payload: 'tiny_hp_potion' },
              target: 'lowest_hp_ally',
              enabled: true
            },
            {
              id: 'gambit_fallback_attack',
              conditions: [{ op: 'SINGLE', left: { type: 'always', value: true }, right: null }],
              action: { type: 'skill', payload: 'single_strike' },
              target: 'lowest_hp_enemy',
              enabled: true
            }
          ],
          consumables: ['tiny_hp_potion']
        })
      ],
      encounter: { enemies: [getEnemy('goblin_brute', Math.max(1, level - 1))] },
      assertions: [
        { metric: 'winRate', expectedMin: 0.6 },
        { metric: 'avgTurns', expectedMin: 3, expectedMax: 25 }
      ]
    });
  }

  // ally_hp with spell healer (Arcane Initiate with light glyph)
  scenarios.push({
    id: 'gambit_ally_hp_spell_heal',
    description: 'Arcane Initiate heals wounded ally with light spell when ally HP < 30%',
    tags: ['gambits', 'ally_hp', 'spell', 'generated'],
    iterations: 30,
    party: [
      createHero('origin_warrior', 5, {
        stats: { baseMaxHp: 130, baseStrength: 22, baseSpeed: 10, baseDefense: 14 }
      }),
      createHero('origin_arcane_initiate', 5, {
        stats: { baseMaxHp: 90, baseMaxMp: 60, baseMagicPower: 24 },
        skills: ['single_strike'],
        gambits: [
          {
            id: 'gambit_heal_ally_spell',
            conditions: [{ op: 'SINGLE', left: { type: 'ally_hp', operator: '<', value: 0.3 }, right: null }],
            action: { type: 'spell', payload: 'Healing Light' },
            target: 'lowest_hp_ally',
            enabled: true
          },
          {
            id: 'gambit_fallback_attack',
            conditions: [{ op: 'SINGLE', left: { type: 'always', value: true }, right: null }],
            action: { type: 'skill', payload: 'single_strike' },
            target: 'lowest_hp_enemy',
            enabled: true
          }
        ],
        spells: [
          { glyphs: ['glyph_light'], name: 'Healing Light' }
        ]
      })
    ],
    encounter: { enemies: [getEnemy('goblin_brute', 5)] },
    assertions: [
      { metric: 'winRate', expectedMin: 0.7 },
      { metric: 'avgTurns', expectedMin: 3, expectedMax: 20 }
    ]
  });

  // ═══════════════════════════════════════════════════════════════════════
  // G.2: enemy_hp condition — execute when enemy below threshold
  // ═══════════════════════════════════════════════════════════════════════

  for (const level of [3, 7, 12]) {
    scenarios.push({
      id: `gambit_enemy_hp_execute_lv${level}`,
      description: `Warrior at Lv${level} uses power_strike when enemy HP < 30%`,
      tags: ['gambits', 'enemy_hp', 'generated'],
      iterations: 30,
      party: [
        createHero('origin_warrior', level, {
          skills: ['single_strike', 'power_strike'],
          gambits: [
            {
              id: 'gambit_execute',
              conditions: [{ op: 'SINGLE', left: { type: 'enemy_hp', operator: '<', value: 0.3 }, right: null }],
              action: { type: 'skill', payload: 'power_strike' },
              target: 'lowest_hp_enemy',
              enabled: true
            },
            {
              id: 'gambit_fallback',
              conditions: [{ op: 'SINGLE', left: { type: 'always', value: true }, right: null }],
              action: { type: 'skill', payload: 'single_strike' },
              target: 'lowest_hp_enemy',
              enabled: true
            }
          ]
        })
      ],
      encounter: { enemies: [getEnemy('goblin_grunt', Math.max(1, level - 2))] },
      assertions: [
        { metric: 'damage.skill.power_strike.hits', expectedMin: 1 },
        { metric: 'winRate', expectedMin: 0.9 }
      ]
    });
  }

  // enemy_hp with multiple enemies — should target the lowest HP enemy
  scenarios.push({
    id: 'gambit_enemy_hp_multi_target',
    description: 'enemy_hp gambit against 3 enemies — should power_strike the wounded one',
    tags: ['gambits', 'enemy_hp', 'multi', 'generated'],
    iterations: 30,
    party: [
      createHero('origin_warrior', 7, {
        stats: { baseStrength: 24, baseSpeed: 12, baseDefense: 14 },
        skills: ['single_strike', 'power_strike'],
        gambits: [
          {
            id: 'gambit_execute_wounded',
            conditions: [{ op: 'SINGLE', left: { type: 'enemy_hp', operator: '<', value: 0.5 }, right: null }],
            action: { type: 'skill', payload: 'power_strike' },
            target: 'lowest_hp_enemy',
            enabled: true
          },
          {
            id: 'gambit_fallback',
            conditions: [{ op: 'SINGLE', left: { type: 'always', value: true }, right: null }],
            action: { type: 'skill', payload: 'single_strike' },
            target: 'lowest_hp_enemy',
            enabled: true
          }
        ]
      })
    ],
    encounter: { enemies: [getEnemy('goblin_grunt', 5, { count: 3 })] },
    assertions: [
      { metric: 'damage.skill.power_strike.hits', expectedMin: 1 },
      { metric: 'winRate', expectedMin: 0.7 }
    ]
  });

  // ═══════════════════════════════════════════════════════════════════════
  // G.6: Gambit priority order — higher priority overrides lower
  // ═══════════════════════════════════════════════════════════════════════

  // Two gambits: ally_hp < 0.4 (heal) vs always (attack). Heal should fire when ally is low.
  scenarios.push({
    id: 'gambit_priority_heal_vs_attack',
    description: 'Priority: heal wounded ally should override always-attack',
    tags: ['gambits', 'priority', 'generated'],
    iterations: 30,
    party: [
      createHero('origin_warrior', 5, {
        stats: { baseMaxHp: 130, baseStrength: 22 },
        skills: ['single_strike']
      }),
      createHero('origin_guard', 5, {
        stats: { baseMaxHp: 150, baseStrength: 18, baseDefense: 20 },
        skills: ['single_strike'],
        gambits: [
          {
            id: 'gambit_priority_heal',
            conditions: [{ op: 'SINGLE', left: { type: 'ally_hp', operator: '<', value: 0.4 }, right: null }],
            action: { type: 'item', payload: 'tiny_hp_potion' },
            target: 'lowest_hp_ally',
            enabled: true
          },
          {
            id: 'gambit_priority_attack',
            conditions: [{ op: 'SINGLE', left: { type: 'always', value: true }, right: null }],
            action: { type: 'skill', payload: 'single_strike' },
            target: 'lowest_hp_enemy',
            enabled: true
          }
        ],
        consumables: ['tiny_hp_potion']
      })
    ],
    encounter: { enemies: [getEnemy('goblin_brute', 5)] },
    assertions: [
      { metric: 'winRate', expectedMin: 0.6 },
      { metric: 'avgTurns', expectedMin: 3, expectedMax: 20 }
    ]
  });

  // Reverse priority: always-attack first should mean heal never fires
  scenarios.push({
    id: 'gambit_priority_attack_first',
    description: 'Priority: always-attack before heal means heal never fires (verifies ordering)',
    tags: ['gambits', 'priority', 'generated'],
    iterations: 30,
    party: [
      createHero('origin_guard', 5, {
        stats: { baseMaxHp: 150, baseStrength: 18, baseDefense: 20 },
        skills: ['single_strike'],
        gambits: [
          {
            id: 'gambit_priority_attack_first',
            conditions: [{ op: 'SINGLE', left: { type: 'always', value: true }, right: null }],
            action: { type: 'skill', payload: 'single_strike' },
            target: 'lowest_hp_enemy',
            enabled: true
          },
          {
            id: 'gambit_priority_heal_second',
            conditions: [{ op: 'SINGLE', left: { type: 'ally_hp', operator: '<', value: 0.4 }, right: null }],
            action: { type: 'item', payload: 'tiny_hp_potion' },
            target: 'lowest_hp_ally',
            enabled: true
          }
        ],
        consumables: ['tiny_hp_potion']
      })
    ],
    encounter: { enemies: [getEnemy('slime_green', 3)] },
    assertions: [
      // If attack is always first, we should still win because enemy is weak
      { metric: 'winRate', expectedMin: 0.95 },
      { metric: 'damage.skill.single_strike.hits', expectedMin: 1 }
    ]
  });

  // Priority with three tiers: self_mp < 0.2 (item) → enemy_hp < 0.3 (execute) → always (attack)
  scenarios.push({
    id: 'gambit_priority_three_tiers',
    description: 'Priority: MP item → enemy execute → fallback attack',
    tags: ['gambits', 'priority', 'generated'],
    iterations: 30,
    party: [
      createHero('origin_arcane_initiate', 7, {
        stats: { baseMaxMp: 70, baseMagicPower: 28 },
        skills: ['single_strike', 'power_strike'],
        gambits: [
          {
            id: 'gambit_tier1_mp',
            conditions: [{ op: 'SINGLE', left: { type: 'self_mp', operator: '<', value: 0.2 }, right: null }],
            action: { type: 'item', payload: 'tiny_mp_potion' },
            target: 'self',
            enabled: true
          },
          {
            id: 'gambit_tier2_execute',
            conditions: [{ op: 'SINGLE', left: { type: 'enemy_hp', operator: '<', value: 0.3 }, right: null }],
            action: { type: 'skill', payload: 'power_strike' },
            target: 'lowest_hp_enemy',
            enabled: true
          },
          {
            id: 'gambit_tier3_fallback',
            conditions: [{ op: 'SINGLE', left: { type: 'always', value: true }, right: null }],
            action: { type: 'skill', payload: 'single_strike' },
            target: 'lowest_hp_enemy',
            enabled: true
          }
        ],
        consumables: ['tiny_mp_potion']
      })
    ],
    encounter: { enemies: [getEnemy('goblin_grunt', 5)] },
    assertions: [
      { metric: 'winRate', expectedMin: 0.85 },
      { metric: 'damage.skill.power_strike.hits', expectedMin: 1 }
    ]
  });

  // ═══════════════════════════════════════════════════════════════════════
  // G.7: MP/STA awareness — gambit selects action hero can afford
  // ═══════════════════════════════════════════════════════════════════════

  // MP awareness: mage with spell gambit but 0 MP should fallback to basic attack
  scenarios.push({
    id: 'gambit_mp_awareness_spell',
    description: 'Arcane Initiate with 0 MP cannot cast spell; gambit should fall back to attack',
    tags: ['gambits', 'mp', 'awareness', 'generated'],
    iterations: 30,
    party: [
      createHero('origin_arcane_initiate', 5, {
        stats: { baseMaxMp: 60, baseMagicPower: 24 },
        skills: ['single_strike'],
        mp: 0, // 0 MP at start
        gambits: [
          {
            id: 'gambit_cast_spell',
            conditions: [{ op: 'SINGLE', left: { type: 'always', value: true }, right: null }],
            action: { type: 'spell', payload: 'Fireball' },
            target: 'lowest_hp_enemy',
            enabled: true
          },
          {
            id: 'gambit_fallback_attack',
            conditions: [{ op: 'SINGLE', left: { type: 'always', value: true }, right: null }],
            action: { type: 'skill', payload: 'single_strike' },
            target: 'lowest_hp_enemy',
            enabled: true
          }
        ],
        spells: [
          { glyphs: ['glyph_fire'], name: 'Fireball' }
        ]
      })
    ],
    encounter: { enemies: [getEnemy('slime_green', 3)] },
    assertions: [
      // If MP awareness works, single_strike should be used (spell can't fire with 0 MP)
      { metric: 'damage.skill.single_strike.hits', expectedMin: 1 },
      { metric: 'winRate', expectedMin: 0.8 }
    ]
  });

  // STA awareness: warrior with only power_strike but 0 stamina should use basic attack
  scenarios.push({
    id: 'gambit_sta_awareness_skill',
    description: 'Warrior with 0 stamina cannot use power_strike; gambit should fall back to basic attack',
    tags: ['gambits', 'sta', 'awareness', 'generated'],
    iterations: 30,
    party: [
      createHero('origin_warrior', 5, {
        stats: { baseMaxHp: 130, baseStrength: 22 },
        skills: ['single_strike', 'power_strike'],
        stamina: 0, // 0 stamina at start
        gambits: [
          {
            id: 'gambit_use_power_strike',
            conditions: [{ op: 'SINGLE', left: { type: 'always', value: true }, right: null }],
            action: { type: 'skill', payload: 'power_strike' },
            target: 'lowest_hp_enemy',
            enabled: true
          },
          {
            id: 'gambit_fallback_attack',
            conditions: [{ op: 'SINGLE', left: { type: 'always', value: true }, right: null }],
            action: { type: 'skill', payload: 'single_strike' },
            target: 'lowest_hp_enemy',
            enabled: true
          }
        ]
      })
    ],
    encounter: { enemies: [getEnemy('slime_green', 3)] },
    assertions: [
      // If STA awareness works, single_strike should be used (power_strike can't fire with 0 STA)
      { metric: 'damage.skill.single_strike.hits', expectedMin: 1 },
      { metric: 'damage.skill.power_strike.hits', expectedMax: 0 },
      { metric: 'winRate', expectedMin: 0.8 }
    ]
  });

  // MP awareness: self_mp < 0.2 should trigger MP potion use
  scenarios.push({
    id: 'gambit_mp_self_restore',
    description: 'Arcane Initiate uses MP potion when self MP drops below 20%',
    tags: ['gambits', 'mp', 'awareness', 'item', 'generated'],
    iterations: 30,
    party: [
      createHero('origin_arcane_initiate', 7, {
        stats: { baseMaxMp: 70, baseMagicPower: 28 },
        skills: ['single_strike'],
        gambits: [
          {
            id: 'gambit_restore_mp',
            conditions: [{ op: 'SINGLE', left: { type: 'self_mp', operator: '<', value: 0.2 }, right: null }],
            action: { type: 'item', payload: 'tiny_mp_potion' },
            target: 'self',
            enabled: true
          },
          {
            id: 'gambit_fallback_attack',
            conditions: [{ op: 'SINGLE', left: { type: 'always', value: true }, right: null }],
            action: { type: 'skill', payload: 'single_strike' },
            target: 'lowest_hp_enemy',
            enabled: true
          }
        ],
        consumables: ['tiny_mp_potion']
      })
    ],
    encounter: { enemies: [getEnemy('goblin_grunt', 5)] },
    assertions: [
      { metric: 'winRate', expectedMin: 0.8 }
    ]
  });

  // ═══════════════════════════════════════════════════════════════════════
  // G.8: Target selection — heal lowest ally, attack lowest enemy, etc.
  // ═══════════════════════════════════════════════════════════════════════

  // lowest_hp_ally target selection
  scenarios.push({
    id: 'gambit_target_lowest_hp_ally',
    description: 'Healer with two wounded allies should target the one with lowest absolute HP',
    tags: ['gambits', 'target', 'ally', 'generated'],
    iterations: 30,
    party: [
      createHero('origin_warrior', 5, {
        stats: { baseMaxHp: 130, baseStrength: 22 },
        hp: 30 // heavily wounded (30/130)
      }),
      createHero('origin_thief', 5, {
        stats: { baseMaxHp: 100, baseStrength: 17 },
        hp: 20 // even more wounded proportionally (20/100)
      }),
      createHero('origin_guard', 5, {
        stats: { baseMaxHp: 150, baseStrength: 18, baseDefense: 20 },
        skills: ['single_strike'],
        gambits: [
          {
            id: 'gambit_heal_lowest_ally',
            conditions: [{ op: 'SINGLE', left: { type: 'ally_hp', operator: '<', value: 0.5 }, right: null }],
            action: { type: 'item', payload: 'tiny_hp_potion' },
            target: 'lowest_hp_ally',
            enabled: true
          },
          {
            id: 'gambit_fallback_attack',
            conditions: [{ op: 'SINGLE', left: { type: 'always', value: true }, right: null }],
            action: { type: 'skill', payload: 'single_strike' },
            target: 'lowest_hp_enemy',
            enabled: true
          }
        ],
        consumables: ['tiny_hp_potion']
      })
    ],
    encounter: { enemies: [getEnemy('slime_green', 3)] },
    assertions: [
      { metric: 'winRate', expectedMin: 0.95 },
      { metric: 'avgTurns', expectedMin: 2, expectedMax: 15 }
    ]
  });

  // highest_hp_enemy target selection
  scenarios.push({
    id: 'gambit_target_highest_hp_enemy',
    description: 'Warrior should target highest HP enemy with highest_hp_enemy selector',
    tags: ['gambits', 'target', 'enemy', 'generated'],
    iterations: 30,
    party: [
      createHero('origin_warrior', 7, {
        stats: { baseStrength: 24, baseSpeed: 12 },
        skills: ['single_strike', 'power_strike'],
        gambits: [
          {
            id: 'gambit_target_strongest',
            conditions: [{ op: 'SINGLE', left: { type: 'always', value: true }, right: null }],
            action: { type: 'skill', payload: 'power_strike' },
            target: 'highest_hp_enemy',
            enabled: true
          },
          {
            id: 'gambit_fallback',
            conditions: [{ op: 'SINGLE', left: { type: 'always', value: true }, right: null }],
            action: { type: 'skill', payload: 'single_strike' },
            target: 'lowest_hp_enemy',
            enabled: true
          }
        ]
      })
    ],
    encounter: { enemies: [getEnemy('goblin_grunt', 5, { count: 3 })] },
    assertions: [
      { metric: 'damage.skill.power_strike.hits', expectedMin: 1 },
      { metric: 'winRate', expectedMin: 0.7 }
    ]
  });

  // weakest_enemy target selection (threat ratio)
  scenarios.push({
    id: 'gambit_target_weakest_enemy',
    description: 'Warrior should target weakest enemy (lowest attack/defense ratio)',
    tags: ['gambits', 'target', 'enemy', 'generated'],
    iterations: 30,
    party: [
      createHero('origin_warrior', 5, {
        stats: { baseStrength: 22 },
        skills: ['single_strike'],
        gambits: [
          {
            id: 'gambit_target_weakest',
            conditions: [{ op: 'SINGLE', left: { type: 'always', value: true }, right: null }],
            action: { type: 'skill', payload: 'single_strike' },
            target: 'weakest_enemy',
            enabled: true
          }
        ]
      })
    ],
    encounter: {
      enemies: [
        getEnemy('goblin_king', 10), // strong (high threat)
        getEnemy('slime_green', 3)   // weak (low threat)
      ]
    },
    assertions: [
      { metric: 'winRate', expectedMin: 0.3 },
      { metric: 'avgTurns', expectedMin: 3, expectedMax: 25 }
    ]
  });

  // strongest_ally target selection (buff target)
  scenarios.push({
    id: 'gambit_target_strongest_ally',
    description: 'Item gambit should target strongest ally (highest threat ratio)',
    tags: ['gambits', 'target', 'ally', 'generated'],
    iterations: 30,
    party: [
      createHero('origin_warrior', 7, {
        stats: { baseMaxHp: 150, baseStrength: 24 },
        hp: 50
      }),
      createHero('origin_arcane_initiate', 7, {
        stats: { baseMaxHp: 90, baseMagicPower: 28 },
        hp: 45
      }),
      createHero('origin_guard', 7, {
        stats: { baseMaxHp: 170, baseStrength: 20, baseDefense: 24 },
        skills: ['single_strike'],
        gambits: [
          {
            id: 'gambit_buff_strongest',
            conditions: [{ op: 'SINGLE', left: { type: 'always', value: true }, right: null }],
            action: { type: 'item', payload: 'tiny_hp_potion' },
            target: 'strongest_ally',
            enabled: true
          },
          {
            id: 'gambit_fallback_attack',
            conditions: [{ op: 'SINGLE', left: { type: 'always', value: true }, right: null }],
            action: { type: 'skill', payload: 'single_strike' },
            target: 'lowest_hp_enemy',
            enabled: true
          }
        ],
        consumables: ['tiny_hp_potion']
      })
    ],
    encounter: { enemies: [getEnemy('slime_green', 3)] },
    assertions: [
      { metric: 'winRate', expectedMin: 0.95 }
    ]
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Bonus: enemy_count condition (AoE trigger)
  // ═══════════════════════════════════════════════════════════════════════

  scenarios.push({
    id: 'gambit_enemy_count_aoe',
    description: 'enemy_count > 2 should trigger cleave when facing 3+ enemies',
    tags: ['gambits', 'enemy_count', 'generated'],
    iterations: 30,
    party: [
      createHero('origin_warrior', 7, {
        stats: { baseStrength: 24, baseSpeed: 12 },
        skills: ['single_strike', 'cleave'],
        gambits: [
          {
            id: 'gambit_aoe_cleave',
            conditions: [{ op: 'SINGLE', left: { type: 'enemy_count', operator: '>', value: 2 }, right: null }],
            action: { type: 'skill', payload: 'cleave' },
            target: 'all_enemies',
            enabled: true
          },
          {
            id: 'gambit_fallback',
            conditions: [{ op: 'SINGLE', left: { type: 'always', value: true }, right: null }],
            action: { type: 'skill', payload: 'single_strike' },
            target: 'lowest_hp_enemy',
            enabled: true
          }
        ]
      })
    ],
    encounter: { enemies: [getEnemy('goblin_grunt', 5, { count: 3 })] },
    assertions: [
      { metric: 'damage.skill.cleave.hits', expectedMin: 1 },
      { metric: 'winRate', expectedMin: 0.6 }
    ]
  });

  scenarios.push({
    id: 'gambit_enemy_count_no_aoe',
    description: 'enemy_count > 2 should NOT trigger cleave when facing 1 enemy',
    tags: ['gambits', 'enemy_count', 'generated'],
    iterations: 30,
    party: [
      createHero('origin_warrior', 5, {
        stats: { baseStrength: 22 },
        skills: ['single_strike', 'cleave'],
        gambits: [
          {
            id: 'gambit_aoe_cleave',
            conditions: [{ op: 'SINGLE', left: { type: 'enemy_count', operator: '>', value: 2 }, right: null }],
            action: { type: 'skill', payload: 'cleave' },
            target: 'all_enemies',
            enabled: true
          },
          {
            id: 'gambit_fallback',
            conditions: [{ op: 'SINGLE', left: { type: 'always', value: true }, right: null }],
            action: { type: 'skill', payload: 'single_strike' },
            target: 'lowest_hp_enemy',
            enabled: true
          }
        ]
      })
    ],
    encounter: { enemies: [getEnemy('slime_green', 3)] },
    assertions: [
      // cleave should not fire (only 1 enemy)
      { metric: 'damage.skill.cleave.hits', expectedMax: 0 },
      { metric: 'damage.skill.single_strike.hits', expectedMin: 1 },
      { metric: 'winRate', expectedMin: 0.95 }
    ]
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Bonus: turn_count condition
  // ═══════════════════════════════════════════════════════════════════════

  scenarios.push({
    id: 'gambit_turn_count_early',
    description: 'turn_count <= 3 should trigger power_strike in early turns',
    tags: ['gambits', 'turn_count', 'generated'],
    iterations: 30,
    party: [
      createHero('origin_warrior', 5, {
        stats: { baseStrength: 22 },
        skills: ['single_strike', 'power_strike'],
        gambits: [
          {
            id: 'gambit_early_burst',
            conditions: [{ op: 'SINGLE', left: { type: 'turn_count', operator: '<=', value: 3 }, right: null }],
            action: { type: 'skill', payload: 'power_strike' },
            target: 'lowest_hp_enemy',
            enabled: true
          },
          {
            id: 'gambit_fallback',
            conditions: [{ op: 'SINGLE', left: { type: 'always', value: true }, right: null }],
            action: { type: 'skill', payload: 'single_strike' },
            target: 'lowest_hp_enemy',
            enabled: true
          }
        ]
      })
    ],
    encounter: { enemies: [getEnemy('goblin_grunt', 4)] },
    assertions: [
      { metric: 'damage.skill.power_strike.hits', expectedMin: 1 },
      { metric: 'winRate', expectedMin: 0.9 }
    ]
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Bonus: self_hp condition
  // ═══════════════════════════════════════════════════════════════════════

  scenarios.push({
    id: 'gambit_self_hp_defensive',
    description: 'self_hp < 0.3 should trigger defensive item use (HP potion)',
    tags: ['gambits', 'self_hp', 'generated'],
    iterations: 30,
    party: [
      createHero('origin_warrior', 5, {
        stats: { baseMaxHp: 130, baseStrength: 22 },
        hp: 30, // start at 30/130 (~23%) to trigger self_hp < 0.3 immediately
        skills: ['single_strike'],
        gambits: [
          {
            id: 'gambit_self_heal',
            conditions: [{ op: 'SINGLE', left: { type: 'self_hp', operator: '<', value: 0.3 }, right: null }],
            action: { type: 'item', payload: 'tiny_hp_potion' },
            target: 'self',
            enabled: true
          },
          {
            id: 'gambit_fallback',
            conditions: [{ op: 'SINGLE', left: { type: 'always', value: true }, right: null }],
            action: { type: 'skill', payload: 'single_strike' },
            target: 'lowest_hp_enemy',
            enabled: true
          }
        ],
        consumables: ['tiny_hp_potion']
      })
    ],
    encounter: { enemies: [getEnemy('slime_green', 3)] },
    assertions: [
      { metric: 'winRate', expectedMin: 0.9 },
      { metric: 'avgTurns', expectedMin: 2, expectedMax: 12 }
    ]
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Bonus: enemy_status condition
  // ═══════════════════════════════════════════════════════════════════════

  scenarios.push({
    id: 'gambit_enemy_status_poison',
    description: 'enemy_status poison should trigger follow-up single_strike against poisoned enemy',
    tags: ['gambits', 'enemy_status', 'generated'],
    iterations: 30,
    party: [
      createHero('origin_warrior', 5, {
        stats: { baseStrength: 22 },
        skills: ['single_strike'],
        gambits: [
          {
            id: 'gambit_target_poisoned',
            conditions: [{ op: 'SINGLE', left: { type: 'enemy_status', value: 'poison' }, right: null }],
            action: { type: 'skill', payload: 'single_strike' },
            target: 'lowest_hp_enemy',
            enabled: true
          },
          {
            id: 'gambit_fallback',
            conditions: [{ op: 'SINGLE', left: { type: 'always', value: true }, right: null }],
            action: { type: 'skill', payload: 'single_strike' },
            target: 'lowest_hp_enemy',
            enabled: true
          }
        ]
      })
    ],
    encounter: {
      enemies: [{
        ...getEnemy('goblin_grunt', 4),
        statusEffects: [{ type: 'poison', duration: 5, power: 0.05 }]
      }]
    },
    assertions: [
      { metric: 'winRate', expectedMin: 0.9 },
      { metric: 'avgTurns', expectedMin: 2, expectedMax: 10 }
    ]
  });

  return scenarios;
}

export default generate;
export { generate };
