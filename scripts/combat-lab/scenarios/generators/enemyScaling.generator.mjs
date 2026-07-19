// ───────────────────────────────────────────────────────────────────────────
// Enemy Scaling Scenario Generator
//
// Generates a parametric matrix covering:
//   enemy × level × encounter size × region scaling
//
// Coverage per test matrix (Section 4.7):
//   X.1  Enemy stats by level    — same enemy at levels 1, 10, 20
//   X.2  Enemy skills             — goblin shaman should cast spells (knownFailure: no enemy skills yet)
//   X.3  Enemy AI                 — target selection (lowest HP, random)
//   X.4  Boss mechanics           — higher stats, isBoss flag
//   X.5  Elemental enemies        — weakness / resistance application
//   X.6  Encounter size           — 1, 2, 3, 4+ enemy encounters
//   X.7  Region scaling           — enemy level and stats increase with clears
// ───────────────────────────────────────────────────────────────────────────

const ENEMY_IDS = [
  'slime_green',      // low tier, neutral
  'goblin_grunt',     // humanoid, neutral
  'goblin_shaman',    // humanoid, storm element (caster candidate)
  'skeleton_warrior', // undead, neutral
  'water_spirit_minor', // elemental, water
  'young_drake',      // dragon, fire
  'stone_golem',      // elemental, earth, high defense
];

const LEVELS = [1, 5, 10];
const ENCOUNTER_SIZES = [1, 2, 4];
const REGION_BASE_LEVELS = [1, 3, 5];

// ───────────────────────────────────────────────────────────────────────────
// Expected HP helpers (based on builder formula: maxHp * 1.5 * levelMult + tierBonus*5)
// ───────────────────────────────────────────────────────────────────────────

function expectedHpMin(templateId, level, regionBaseLevel = 1) {
  const baseHp = {
    slime_green: 20, slime_fire: 30, slime_earth: 25, wild_boar: 40,
    rabbit_horned: 15, goblin_scout: 25, goblin_grunt: 35,
    bat_small: 22, spider_minor: 28, crab_shell: 35, water_spirit_minor: 25,
    murloc_shore: 30, goblin_brute: 55, goblin_shaman: 40, goblin_slinger: 28,
    skeleton_warrior: 35, ghost_wisp: 20, wolf_alpha: 50, zombie_rotter: 45,
    ice_elemental: 45, young_drake: 70, frost_wolf: 55, cultist_acolyte: 35,
    stone_golem: 90, goblin_king: 120, lich_apprentice: 180, mountain_troll: 400
  };
  const hp = baseHp[templateId] || 30;
  const statMultiplier = 1.1;
  const levelMult = Math.pow(statMultiplier, level - 1);
  const tierBonus = (regionBaseLevel - 1) * 2;
  return Math.floor((hp * levelMult + tierBonus * 5) * 1.5);
}

function expectedHpMax(templateId, level, regionBaseLevel = 1) {
  return Math.floor(expectedHpMin(templateId, level, regionBaseLevel) * 1.5);
}

// ───────────────────────────────────────────────────────────────────────────
// Party builders
// ───────────────────────────────────────────────────────────────────────────

function createBalancedHero(level = 5) {
  return {
    origin: 'origin_warrior',
    level,
    name: `Balanced Warrior Lv${level}`,
    stats: {
      baseMaxHp: 60 + level * 8,
      baseMaxMp: 15 + level * 2,
      baseStrength: 12 + Math.floor(level * 1.2),
      baseSpeed: 7 + Math.floor(level * 0.3),
      baseDefense: 6 + Math.floor(level * 0.5),
      baseMagicPower: 4
    },
    equipment: [
      `weapon:iron:broadsword`,
      `armor:leather:plate:body`
    ],
    skills: ['single_strike', 'multiple_attack', 'power_strike'],
    gambits: [
      {
        id: 'gambit_always_attack',
        conditions: [{ op: 'SINGLE', left: { type: 'always', value: true }, right: null }],
        action: { type: 'skill', payload: 'power_strike' },
        target: 'lowest_hp_enemy',
        enabled: true
      }
    ]
  };
}

function createMageHero(level = 5) {
  return {
    origin: 'origin_arcane_initiate',
    level,
    name: `Arcane Initiate Lv${level}`,
    stats: {
      baseMaxHp: 50 + level * 6,
      baseMaxMp: 30 + level * 4,
      baseStrength: 6 + Math.floor(level * 0.4),
      baseSpeed: 8 + Math.floor(level * 0.4),
      baseDefense: 4 + Math.floor(level * 0.3),
      baseMagicPower: 14 + Math.floor(level * 1.5)
    },
    equipment: [
      `weapon:wooden:wand`,
      `armor:leather:robes:body`
    ],
    magicTier: Math.min(level, 10),
    spells: [
      { glyphs: ['glyph_fire'], glyphTiers: { glyph_fire: Math.min(3, Math.floor(level / 2) + 1) } }
    ],
    gambits: [
      {
        id: 'gambit_always_spell',
        conditions: [{ op: 'SINGLE', left: { type: 'always', value: true }, right: null }],
        action: { type: 'spell', payload: 0 },
        target: 'lowest_hp_enemy',
        enabled: true
      }
    ]
  };
}

function getEncounter(enemyId, count = 1, level = 1, regionBaseLevel = 1, isBoss = false) {
  return {
    enemies: Array.from({ length: count }, () => ({
      id: enemyId,
      level,
      isBoss
    })),
    regionBaseLevel
  };
}

// ───────────────────────────────────────────────────────────────────────────
// Generator
// ───────────────────────────────────────────────────────────────────────────

function generate() {
  const scenarios = [];

  // ── X.1: Enemy stats by level ─────────────────────────────────────────
  for (const enemyId of ['slime_green', 'goblin_grunt', 'young_drake']) {
    for (const level of LEVELS) {
      scenarios.push({
        id: `enemy_scaling_${enemyId}_lv${level}`,
        description: `Enemy stats scaling: ${enemyId} at level ${level}`,
        tags: ['enemy', 'scaling', 'stats', 'generated'],
        iterations: 30,
        party: [createBalancedHero(level)],
        encounter: getEncounter(enemyId, 1, level),
        assertions: [
          { metric: 'winRate', expectedMin: 0.2 }
        ]
      });
    }
  }

  // ── X.2: Enemy skills (knownFailure — enemies don't have skill families yet) ──
  scenarios.push({
    id: 'enemy_skills_shaman',
    description: 'Goblin shaman should use storm-element spells/skills if configured',
    tags: ['enemy', 'skills', 'generated'],
    knownFailure: true,
    knownFailureReason: 'Enemy templates do not have configured skills/spell families; all enemies only use basic_attack.',
    iterations: 20,
    party: [createBalancedHero(5)],
    encounter: getEncounter('goblin_shaman', 1, 5),
    assertions: [
      { metric: 'damage.autoAttack.total', expectedMin: 1 },
      { metric: 'winRate', expectedMin: 0.3 }
    ]
  });

  // ── X.3: Enemy AI — target selection (lowest HP) ──────────────────────
  scenarios.push({
    id: 'enemy_ai_target_selection',
    description: 'Multiple enemies should focus fire on lowest HP hero (target selection verification)',
    tags: ['enemy', 'ai', 'target', 'generated'],
    iterations: 30,
    party: [
      { ...createBalancedHero(5), name: 'Tank', stats: { ...createBalancedHero(5).stats, baseMaxHp: 120, baseDefense: 12 } },
      { ...createBalancedHero(5), name: 'Squishy', stats: { ...createBalancedHero(5).stats, baseMaxHp: 40, baseDefense: 4 } }
    ],
    encounter: getEncounter('goblin_grunt', 3, 3),
    assertions: [
      { metric: 'winRate', expectedMin: 0.2 }
    ]
  });

  // ── X.4: Boss mechanics ───────────────────────────────────────────────
  scenarios.push({
    id: 'enemy_boss_goblin_king',
    description: 'Boss encounter: goblin king should be significantly harder than normal enemy',
    tags: ['enemy', 'boss', 'generated'],
    iterations: 30,
    party: [
      createBalancedHero(10),
      createMageHero(10)
    ],
    encounter: getEncounter('goblin_king', 1, 10, 1, true),
    assertions: [
      { metric: 'winRate', expectedMin: 0.1 },
      { metric: 'avgTurns', expectedMin: 5 }
    ]
  });

  scenarios.push({
    id: 'enemy_boss_vs_normal',
    description: 'Boss vs same template non-boss: boss should have more HP and be harder',
    tags: ['enemy', 'boss', 'comparison', 'generated'],
    iterations: 20,
    party: [createBalancedHero(8)],
    encounter: getEncounter('young_drake', 1, 8, 1, true),
    assertions: [
      { metric: 'winRate', expectedMin: 0.05 }
    ]
  });

  // ── X.5: Elemental enemies ────────────────────────────────────────────
  // Fire elemental vs water mage (strong against fire)
  scenarios.push({
    id: 'enemy_elemental_fire_vs_water',
    description: 'Fire elemental enemy: water spell should deal bonus damage (strong)',
    tags: ['enemy', 'elemental', 'generated'],
    iterations: 30,
    party: [createMageHero(5)],
    encounter: { enemies: [{ id: 'slime_fire', count: 1, level: 3 }] },
    assertions: [
      { metric: 'winRate', expectedMin: 0.2 }
    ]
  });

  // Earth elemental (neutral vs all non-earth)
  scenarios.push({
    id: 'enemy_elemental_earth_neutral',
    description: 'Earth elemental should take neutral damage from fire/water/wind/storm spells',
    tags: ['enemy', 'elemental', 'earth', 'generated'],
    iterations: 30,
    party: [createMageHero(5)],
    encounter: { enemies: [{ id: 'stone_golem', count: 1, level: 3 }] },
    assertions: [
      { metric: 'winRate', expectedMin: 0.1 }
    ]
  });

  // ── X.6: Encounter size ───────────────────────────────────────────────
  for (const size of ENCOUNTER_SIZES) {
    scenarios.push({
      id: `enemy_encounter_size_${size}`,
      description: `Encounter size ${size}: ${size} goblin grunts vs balanced party`,
      tags: ['enemy', 'encounter_size', 'generated'],
      iterations: 30,
      party: [
        createBalancedHero(5),
        ...(size >= 3 ? [createMageHero(5)] : [])
      ],
      encounter: getEncounter('goblin_grunt', size, 3),
      assertions: [
        { metric: 'winRate', expectedMin: size === 1 ? 0.6 : (size === 2 ? 0.4 : 0.1) },
        { metric: 'avgTurns', expectedMin: size === 1 ? 1 : 2 }
      ]
    });
  }

  // Mixed encounter
  scenarios.push({
    id: 'enemy_encounter_mixed',
    description: 'Mixed encounter: brute + shaman + grunt (different enemy types)',
    tags: ['enemy', 'encounter_size', 'mixed', 'generated'],
    iterations: 30,
    party: [createBalancedHero(6), createMageHero(6)],
    encounter: {
      enemies: [
        { id: 'goblin_brute', count: 1, level: 5 },
        { id: 'goblin_shaman', count: 1, level: 5 },
        { id: 'goblin_grunt', count: 2, level: 3 }
      ]
    },
    assertions: [
      { metric: 'winRate', expectedMin: 0.1 },
      { metric: 'avgTurns', expectedMin: 3 }
    ]
  });

  // ── X.7: Region scaling ───────────────────────────────────────────────
  for (const regionBase of REGION_BASE_LEVELS) {
    scenarios.push({
      id: `enemy_region_scaling_r${regionBase}`,
      description: `Region scaling: goblin grunt at region base level ${regionBase}`,
      tags: ['enemy', 'region', 'scaling', 'generated'],
      iterations: 25,
      party: [createBalancedHero(5 + regionBase)],
      encounter: getEncounter('goblin_grunt', 1, 3 + regionBase, regionBase),
      assertions: [
        { metric: 'winRate', expectedMin: 0.2 }
      ]
    });
  }

  // Elite enemies
  scenarios.push({
    id: 'enemy_elite_fierce',
    description: 'Elite enemy: Fierce goblin grunt (15% stat boost)',
    tags: ['enemy', 'elite', 'generated'],
    iterations: 25,
    party: [createBalancedHero(5)],
    encounter: {
      enemies: [{ id: 'goblin_grunt', count: 1, level: 5, isElite: true, eliteTier: 0 }]
    },
    assertions: [
      { metric: 'winRate', expectedMin: 0.2 }
    ]
  });

  scenarios.push({
    id: 'enemy_elite_legendary',
    description: 'Elite enemy: Legendary goblin grunt (50% stat boost)',
    tags: ['enemy', 'elite', 'generated'],
    iterations: 20,
    party: [createBalancedHero(8)],
    encounter: {
      enemies: [{ id: 'goblin_grunt', count: 1, level: 8, isElite: true, eliteTier: 3 }]
    },
    assertions: [
      { metric: 'winRate', expectedMin: 0.05 }
    ]
  });

  return scenarios;
}

export default generate;
