import { MagicCircleService } from '../../../../js/engine/magic_circle/MagicCircleService.js';

// ───────────────────────────────────────────────────────────────────────────
// Magic Circle Scenario Generator
//
// Generates a parametric matrix covering:
//   element × targetType × magicTier × magicPower
//
// Target types:
//   - single_enemy: 1 glyph (core only)
//   - all_enemies:  core + glyph_multi
//   - ally:         core + glyph_aegis (support on ally)
//   - self:         core + glyph_aegis (support on self)
//
// Offensive spells assert damage per hit. Support spells (light/water) assert
// healing / MP restore. All scenarios assert a baseline win rate.
// ───────────────────────────────────────────────────────────────────────────

const ELEMENTS = ['fire', 'water', 'wind', 'storm', 'earth', 'light'];
const TARGET_TYPES = ['single_enemy', 'all_enemies', 'ally', 'self'];

// Magic tiers per target type. Multi-target / support needs ≥ 2 slots.
const MAGIC_TIERS = {
  single_enemy: [1, 4, 7],
  all_enemies:  [4, 7, 10],
  ally:         [4, 7, 10],
  self:         [4, 7, 10]
};

const MAGIC_POWERS = [10, 30, 60];

const BASE_DAMAGE = {
  fire: 10, water: 8, wind: 9, storm: 11, light: 8, dark: 14, earth: 9
};

const CORE_EFFECT_MULT = [1.0, 1.2, 1.5, 2.0, 2.5, 3.0, 4.0];

const ALLY_FACTOR = {
  fire: 0.20, water: 0.25, wind: 0.22, storm: 0.18,
  light: 0.30, dark: 0.15, earth: 0.25
};

// ───────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────

function getSpellGlyphs(element, targetType) {
  const glyphs = [`glyph_${element}`];
  if (targetType === 'all_enemies') glyphs.push('glyph_multi');
  if (targetType === 'ally' || targetType === 'self') glyphs.push('glyph_aegis');
  return glyphs;
}

function getSpellName(element, targetType, tier) {
  const glyphs = getSpellGlyphs(element, targetType);
  const glyphTiers = {};
  glyphs.forEach(g => { glyphTiers[g] = Math.min(tier, 7); });

  const result = MagicCircleService.compose(glyphs, glyphTiers, null);
  if (!result.success) {
    throw new Error(`Failed to compose spell for ${element}/${targetType}/tier${tier}: ${result.error}`);
  }
  return result.data.name;
}

function computeExpectedMinSpellDamage(element, tier) {
  const base = BASE_DAMAGE[element] || 10;
  const mult = CORE_EFFECT_MULT[Math.min(tier, 7) - 1] || 1.0;
  const spellDamage = base * mult;

  // Vs goblin_grunt level 3 (~defense 4)
  const rawDamage = spellDamage;
  const enemyDefense = 4;
  const R = rawDamage / enemyDefense;
  let defMult;
  if (R >= 10) defMult = 3.0;
  else if (R >= 5) defMult = 2.0 + (R - 5) * 0.2;
  else if (R >= 2) defMult = 1.0 + (R - 2) * 0.33;
  else if (R >= 1) defMult = 0.5 + (R - 1) * 0.5;
  else if (R >= 0.5) defMult = R * 0.5;
  else defMult = 0.2;

  const expected = Math.max(1, Math.floor(rawDamage * defMult));
  // Loose floor: 30 % of expected to account for variance, enemy differences, misses
  return Math.max(1, Math.floor(expected * 0.3));
}

// ───────────────────────────────────────────────────────────────────────────
// Party builders
// ───────────────────────────────────────────────────────────────────────────

function createMage(element, tier, magicPower, targetType) {
  const spellName = getSpellName(element, targetType, tier);
  const glyphs = getSpellGlyphs(element, targetType);

  const glyphTiers = {};
  glyphs.forEach(g => { glyphTiers[g] = Math.min(tier, 7); });

  const gambits = [
    {
      id: `gambit_always_${element}_${targetType}`,
      conditions: [{ op: 'SINGLE', left: { type: 'always', value: true }, right: null }],
      action: { type: 'spell', payload: spellName },
      target: targetType === 'self' ? 'self' : (targetType === 'ally' ? 'lowest_hp_ally' : 'lowest_hp_enemy'),
      enabled: true
    },
    // Fallback attack so the hero is never idle
    {
      id: 'gambit_fallback_attack',
      conditions: [{ op: 'SINGLE', left: { type: 'always', value: true }, right: null }],
      action: { type: 'skill', payload: 'single_strike' },
      target: 'lowest_hp_enemy',
      enabled: true
    }
  ];

  return {
    origin: 'origin_arcane_initiate',
    level: 5,
    name: `Mage ${element}`,
    stats: {
      baseMaxHp: 60,
      baseMaxMp: 100,
      baseMagicPower: magicPower,
      baseStrength: 5,
      baseSpeed: 6,
      baseDefense: 4
    },
    magicTier: tier,
    glyphs,
    spells: [{ glyphs, glyphTiers }],
    gambits
  };
}

function createWarrior() {
  return {
    origin: 'origin_warrior',
    level: 5,
    name: 'Warrior',
    stats: {
      baseMaxHp: 60,
      baseMaxMp: 20,
      baseMagicPower: 4,
      baseStrength: 12,
      baseSpeed: 5,
      baseDefense: 6
    },
    equipment: ['weapon:iron:broadsword']
  };
}

// ───────────────────────────────────────────────────────────────────────────
// Encounter builder
// ───────────────────────────────────────────────────────────────────────────

function getEncounter(targetType) {
  if (targetType === 'all_enemies') {
    return { enemies: [{ id: 'goblin_grunt', count: 2, level: 3 }] };
  }
  return { enemies: [{ id: 'goblin_grunt', count: 1, level: 3 }] };
}

// ───────────────────────────────────────────────────────────────────────────
// Assertion builder
// ───────────────────────────────────────────────────────────────────────────

function getAssertions(element, tier, targetType) {
  const assertions = [];

  if (targetType === 'single_enemy' || targetType === 'all_enemies') {
    const spellName = getSpellName(element, targetType, tier);
    const minDmg = computeExpectedMinSpellDamage(element, tier);
    assertions.push({
      metric: `damage.spell."${spellName}".avgPerHit`,
      expectedMin: minDmg
    });
  }

  if (targetType === 'ally' || targetType === 'self') {
    // light  → heal_hp
    if (element === 'light') {
      assertions.push({ metric: 'healing.total', expectedMin: 1 });
    }
    // water → restore_mp
    if (element === 'water') {
      assertions.push({ metric: 'healing.bySource.mp_restore.total', expectedMin: 1 });
    }
  }

  // Baseline win rate — loose because support-only parties rely on the warrior
  assertions.push({ metric: 'winRate', expectedMin: 0.1 });

  return assertions;
}

// ───────────────────────────────────────────────────────────────────────────
// Generator
// ───────────────────────────────────────────────────────────────────────────

export function generate() {
  const scenarios = [];

  for (const element of ELEMENTS) {
    for (const targetType of TARGET_TYPES) {
      for (const tier of MAGIC_TIERS[targetType]) {
        for (const magicPower of MAGIC_POWERS) {
          const party = [createMage(element, tier, magicPower, targetType)];
          if (targetType === 'ally' || targetType === 'self') {
            party.push(createWarrior());
          }

          const id = `magic_${element}_${targetType}_tier${tier}_mag${magicPower}`;

          scenarios.push({
            id,
            description: `Magic Circle: ${element} ${targetType} at tier ${tier} with magicPower ${magicPower}`,
            tags: ['magic', 'generated', targetType],
            iterations: 20,
            party,
            encounter: getEncounter(targetType),
            assertions: getAssertions(element, tier, targetType)
          });
        }
      }
    }
  }

  return scenarios;
}

export default generate;
