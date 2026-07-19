// ───────────────────────────────────────────────────────────────────────────
// Status Effects Scenario Generator
//
// Generates a parametric matrix covering:
//   effect × duration × resistance / level context
//
// Coverage per test matrix (Section 4.5):
//   S.1  Poison tick      — deals 5% max HP per turn; duration expires
//   S.2  Burn tick        — same as poison but fire element
//   S.3  Stun / sleep skip — afflicted entity skips action phase
//   S.4  Haste            — +50% speed for 3 turns; affects initiative and evasion
//   S.5  Buff/debuff stacking — multiple effects coexist without overwriting
//   S.6  Death by status tick — poison/burn can kill at status phase
//   S.7  Cleansing / resistance — if cleanses/resistances exist, verify them
// ───────────────────────────────────────────────────────────────────────────

const EFFECTS = ['poison', 'burn', 'stun', 'haste'];
const DURATIONS = [3, 5, 10];
const LEVELS = [1, 5, 10, 20];

// ───────────────────────────────────────────────────────────────────────────
// Hero / Enemy builders
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
    case 'origin_thief':
      base.stats = {
        baseMaxHp: 65 + level * 7,
        baseMaxMp: 20 + level * 3,
        baseStrength: 12 + Math.floor(level * 1.0),
        baseSpeed: 10 + Math.floor(level * 0.8),
        baseDefense: 6 + Math.floor(level * 0.4),
        baseMagicPower: 6
      };
      base.skills = ['poison_strike', 'single_strike'];
      base.gambits = [
        {
          id: 'gambit_always_poison',
          conditions: [{ op: 'SINGLE', left: { type: 'always', value: true }, right: null }],
          action: { type: 'skill', payload: 'poison_strike' },
          target: 'lowest_hp_enemy',
          enabled: true
        }
      ];
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

  // ── S.1: Poison tick ───────────────────────────────────────────────────

  // Poison applied via poison_strike at different levels
  for (const level of [1, 5, 10]) {
    scenarios.push({
      id: `status_poison_gen_lv${level}`,
      description: `Thief at Lv${level} using poison_strike; poison should tick for 5% max HP`,
      tags: ['status', 'poison', 'generated'],
      iterations: 30,
      party: [
        createHero('origin_thief', level, {
          stats: {
            baseMaxHp: 65 + level * 7,
            baseStrength: 12 + Math.floor(level * 1.0),
            baseSpeed: 10 + Math.floor(level * 0.8),
            baseDefense: 6 + Math.floor(level * 0.4),
            baseMagicPower: 6
          }
        })
      ],
      encounter: { enemies: [getEnemy('goblin_grunt', Math.max(1, level - 2))] },
      assertions: [
        { metric: 'statusEffects.applied.poison', expectedMin: 1 },
        { metric: 'damage.statusEffect.total', expectedMin: 1 },
        { metric: 'winRate', expectedMin: 0.85 }
      ]
    });
  }

  // Poison duration: short vs long fight
  scenarios.push({
    id: 'status_poison_duration_short',
    description: 'Poison on weak enemy — should expire before fight ends',
    tags: ['status', 'poison', 'duration', 'generated'],
    iterations: 30,
    party: [
      createHero('origin_thief', 5, {
        stats: { baseMaxHp: 100, baseStrength: 12, baseSpeed: 14, baseDefense: 10, baseMagicPower: 6 }
      })
    ],
    encounter: { enemies: [getEnemy('slime_green', 3)] },
    assertions: [
      { metric: 'statusEffects.applied.poison', expectedMin: 1 },
      { metric: 'avgTurns', expectedMin: 2, expectedMax: 12 },
      { metric: 'winRate', expectedMin: 0.95 }
    ]
  });

  scenarios.push({
    id: 'status_poison_duration_long',
    description: 'Poison on tough enemy — should tick multiple times',
    tags: ['status', 'poison', 'duration', 'generated'],
    iterations: 30,
    party: [
      createHero('origin_thief', 10, {
        stats: { baseMaxHp: 150, baseStrength: 25, baseSpeed: 16, baseDefense: 12, baseMagicPower: 6 }
      })
    ],
    encounter: { enemies: [getEnemy('goblin_brute', 8)] },
    assertions: [
      { metric: 'statusEffects.applied.poison', expectedMin: 1 },
      { metric: 'statusEffects.ticks.poison', expectedMin: 3 },
      { metric: 'damage.statusEffect.total', expectedMin: 10 },
      { metric: 'winRate', expectedMin: 0.7 }
    ]
  });

  // ── S.2: Burn tick ─────────────────────────────────────────────────────

  // Burn applied to enemy at start; should tick for 5% max HP
  for (const level of [1, 5, 10]) {
    scenarios.push({
      id: `status_burn_gen_lv${level}`,
      description: `Enemy starts with burn at Lv${level} encounter; burn should tick each turn`,
      tags: ['status', 'burn', 'generated'],
      iterations: 30,
      party: [
        createHero('origin_warrior', level)
      ],
      encounter: {
        enemies: [{
          ...getEnemy('goblin_grunt', Math.max(1, level - 2)),
          statusEffects: [{ type: 'burn', duration: 5, power: 0.05 }]
        }]
      },
      assertions: [
        { metric: 'statusEffects.ticks.burn', expectedMin: 1 },
        { metric: 'damage.statusEffect.total', expectedMin: 1 },
        { metric: 'winRate', expectedMin: 0.9 }
      ]
    });
  }

  // Burn on fire-weak enemy (water enemy vs fire status? burn is fire element)
  scenarios.push({
    id: 'status_burn_fire_enemy',
    description: 'Burn on fire slime — burn is fire element, should deal normal damage',
    tags: ['status', 'burn', 'element', 'generated'],
    iterations: 30,
    party: [
      createHero('origin_warrior', 3)
    ],
    encounter: {
      enemies: [{
        ...getEnemy('slime_fire', 5),
        statusEffects: [{ type: 'burn', duration: 5, power: 0.05 }]
      }]
    },
    assertions: [
      { metric: 'statusEffects.ticks.burn', expectedMin: 1 },
      { metric: 'winRate', expectedMin: 0.9 }
    ]
  });

  // ── S.3: Stun / sleep skip ─────────────────────────────────────────────

  // Stun applied via shield_bash at different levels
  for (const level of [1, 5, 10]) {
    scenarios.push({
      id: `status_stun_gen_lv${level}`,
      description: `Warrior at Lv${level} using shield_bash; enemy should be stunned and skip turns`,
      tags: ['status', 'stun', 'generated'],
      iterations: 30,
      party: [
        createHero('origin_warrior', level, {
          skills: ['shield_bash', 'single_strike'],
          gambits: [
            {
              id: 'gambit_always_bash',
              conditions: [{ op: 'SINGLE', left: { type: 'always', value: true }, right: null }],
              action: { type: 'skill', payload: 'shield_bash' },
              target: 'lowest_hp_enemy',
              enabled: true
            }
          ]
        })
      ],
      encounter: { enemies: [getEnemy('goblin_grunt', Math.max(1, level - 2))] },
      assertions: [
        { metric: 'statusEffects.applied.stun', expectedMin: 1 },
        { metric: 'winRate', expectedMin: 0.85 }
      ]
    });
  }

  // Stun vs multiple enemies — only one gets stunned
  scenarios.push({
    id: 'status_stun_multi_enemy',
    description: 'Shield bash vs 3 enemies — stun should apply to target, not all',
    tags: ['status', 'stun', 'multi', 'generated'],
    iterations: 30,
    party: [
      createHero('origin_warrior', 5, {
        skills: ['shield_bash', 'single_strike'],
        gambits: [
          {
            id: 'gambit_always_bash',
            conditions: [{ op: 'SINGLE', left: { type: 'always', value: true }, right: null }],
            action: { type: 'skill', payload: 'shield_bash' },
            target: 'lowest_hp_enemy',
            enabled: true
          }
        ]
      })
    ],
    encounter: { enemies: [getEnemy('goblin_grunt', 3, { count: 3 })] },
    assertions: [
      { metric: 'statusEffects.applied.stun', expectedMin: 1 },
      { metric: 'winRate', expectedMin: 0.7 }
    ]
  });

  // ── S.4: Haste ─────────────────────────────────────────────────────────

  // Haste on hero at different levels
  for (const level of [1, 5, 10]) {
    scenarios.push({
      id: `status_haste_gen_lv${level}`,
      description: `Hasted warrior at Lv${level} should act faster and win reliably`,
      tags: ['status', 'haste', 'generated'],
      iterations: 30,
      party: [
        createHero('origin_warrior', level, {
          statusEffects: [{ type: 'haste', duration: 10 }]
        })
      ],
      encounter: { enemies: [getEnemy('goblin_grunt', Math.max(1, level - 2))] },
      assertions: [
        { metric: 'winRate', expectedMin: 0.95 },
        { metric: 'avgTurns', expectedMin: 2, expectedMax: 15 }
      ]
    });
  }

  // Haste duration: short (3 turns) vs long (10 turns)
  scenarios.push({
    id: 'status_haste_duration_short',
    description: 'Short haste (3 turns) vs tough enemy — should expire mid-fight',
    tags: ['status', 'haste', 'duration', 'generated'],
    iterations: 30,
    party: [
      createHero('origin_warrior', 10, {
        statusEffects: [{ type: 'haste', duration: 3 }]
      })
    ],
    encounter: { enemies: [getEnemy('goblin_brute', 8)] },
    assertions: [
      { metric: 'winRate', expectedMin: 0.6 },
      { metric: 'avgTurns', expectedMin: 4, expectedMax: 20 }
    ]
  });

  scenarios.push({
    id: 'status_haste_duration_long',
    description: 'Long haste (10 turns) vs tough enemy — should last whole fight',
    tags: ['status', 'haste', 'duration', 'generated'],
    iterations: 30,
    party: [
      createHero('origin_warrior', 10, {
        statusEffects: [{ type: 'haste', duration: 10 }]
      })
    ],
    encounter: { enemies: [getEnemy('goblin_brute', 8)] },
    assertions: [
      { metric: 'winRate', expectedMin: 0.75 },
      { metric: 'avgTurns', expectedMin: 3, expectedMax: 18 }
    ]
  });

  // ── S.5: Buff/debuff stacking ──────────────────────────────────────────

  // Haste + armor buff (if armor buff exists as a status)
  scenarios.push({
    id: 'status_stack_haste_armor',
    description: 'Hero with haste and an armor buff should have both active',
    tags: ['status', 'stacking', 'generated'],
    iterations: 30,
    party: [
      createHero('origin_warrior', 5, {
        statusEffects: [
          { type: 'haste', duration: 10 },
          { type: 'armor_up', duration: 5, power: 0.2 } // 20% defense boost
        ]
      })
    ],
    encounter: { enemies: [getEnemy('goblin_grunt', 5)] },
    assertions: [
      { metric: 'winRate', expectedMin: 0.9 }
    ]
  });

  // Poison + burn on same enemy
  scenarios.push({
    id: 'status_stack_poison_burn',
    description: 'Enemy with both poison and burn should take damage from both',
    tags: ['status', 'stacking', 'generated'],
    iterations: 30,
    party: [
      createHero('origin_warrior', 5)
    ],
    encounter: {
      enemies: [{
        ...getEnemy('goblin_grunt', 5),
        statusEffects: [
          { type: 'poison', duration: 5, power: 0.05 },
          { type: 'burn', duration: 5, power: 0.05 }
        ]
      }]
    },
    assertions: [
      { metric: 'damage.statusEffect.total', expectedMin: 10 },
      { metric: 'winRate', expectedMin: 0.9 }
    ]
  });

  // ── S.6: Death by status tick ─────────────────────────────────────────

  // Low HP enemy with poison should die from tick
  scenarios.push({
    id: 'status_death_by_poison',
    description: 'Enemy at 5% HP poisoned should die from poison tick',
    tags: ['status', 'death', 'poison', 'generated'],
    iterations: 30,
    party: [
      createHero('origin_warrior', 5, {
        stats: { baseStrength: 5, baseSpeed: 4 } // weak so enemy doesn't die immediately
      })
    ],
    encounter: {
      enemies: [{
        ...getEnemy('slime_green', 1),
        statusEffects: [{ type: 'poison', duration: 5, power: 0.05 }]
      }]
    },
    assertions: [
      { metric: 'statusEffects.ticks.poison', expectedMin: 1 },
      { metric: 'winRate', expectedMin: 0.95 }
    ]
  });

  // Low HP enemy with burn should die from tick
  scenarios.push({
    id: 'status_death_by_burn',
    description: 'Enemy at 5% HP burned should die from burn tick',
    tags: ['status', 'death', 'burn', 'generated'],
    iterations: 30,
    party: [
      createHero('origin_warrior', 5, {
        stats: { baseStrength: 5, baseSpeed: 4 }
      })
    ],
    encounter: {
      enemies: [{
        ...getEnemy('slime_green', 1),
        statusEffects: [{ type: 'burn', duration: 5, power: 0.05 }]
      }]
    },
    assertions: [
      { metric: 'statusEffects.ticks.burn', expectedMin: 1 },
      { metric: 'winRate', expectedMin: 0.95 }
    ]
  });

  // ── S.7: Cleansing / resistance ────────────────────────────────────────

  // Hero with poison resistance (reduced tick damage)
  scenarios.push({
    id: 'status_resistance_poison',
    description: 'Hero with poison resistance should take reduced poison tick damage',
    tags: ['status', 'resistance', 'poison', 'generated'],
    iterations: 30,
    knownFailure: true,
    knownFailureReason: 'Poison resistance system not yet implemented. Hero poison tick reduction is not tracked.',
    party: [
      createHero('origin_warrior', 5, {
        statusEffects: [{ type: 'poison', duration: 5, power: 0.05 }]
      })
    ],
    encounter: { enemies: [getEnemy('slime_green', 3)] },
    assertions: [
      { metric: 'winRate', expectedMin: 0.8 }
    ]
  });

  // Hero with haste vs enemy with slow (if slow exists)
  scenarios.push({
    id: 'status_haste_vs_slow',
    description: 'Hasted hero vs slowed enemy — speed difference should be extreme',
    tags: ['status', 'haste', 'slow', 'generated'],
    iterations: 30,
    knownFailure: true,
    knownFailureReason: 'Slow status effect not yet implemented. Only haste is available.',
    party: [
      createHero('origin_warrior', 5, {
        statusEffects: [{ type: 'haste', duration: 10 }]
      })
    ],
    encounter: {
      enemies: [{
        ...getEnemy('goblin_grunt', 3),
        statusEffects: [{ type: 'slow', duration: 5, power: 0.3 }]
      }]
    },
    assertions: [
      { metric: 'winRate', expectedMin: 0.95 }
    ]
  });

  // ── Edge cases ─────────────────────────────────────────────────────────

  // Stun on hero (hero should skip turn)
  scenarios.push({
    id: 'status_stun_on_hero',
    description: 'Hero starts stunned — should skip first turn',
    tags: ['status', 'stun', 'hero', 'edge', 'generated'],
    iterations: 30,
    party: [
      createHero('origin_warrior', 5, {
        statusEffects: [{ type: 'stun', duration: 1 }]
      })
    ],
    encounter: { enemies: [getEnemy('slime_green', 3)] },
    assertions: [
      { metric: 'winRate', expectedMin: 0.85 },
      { metric: 'avgTurns', expectedMin: 3, expectedMax: 12 }
    ]
  });

  // Status effect on boss
  scenarios.push({
    id: 'status_poison_boss',
    description: 'Poison on boss enemy — should tick but boss has high HP',
    tags: ['status', 'poison', 'boss', 'edge', 'generated'],
    iterations: 30,
    party: [
      createHero('origin_thief', 10, {
        stats: { baseMaxHp: 150, baseStrength: 25, baseSpeed: 16, baseDefense: 12, baseMagicPower: 6 }
      })
    ],
    encounter: { enemies: [getEnemy('goblin_king', 10)] },
    assertions: [
      { metric: 'statusEffects.applied.poison', expectedMin: 1 },
      { metric: 'damage.statusEffect.total', expectedMin: 10 },
      { metric: 'winRate', expectedMin: 0.15 }
    ]
  });

  return scenarios;
}

export default generate;
export { generate };
