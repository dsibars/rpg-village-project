import { Hero } from '../../../js/engine/heroes/models/Hero.js';
import { Enemy } from '../../../js/engine/shared/combat/models/Enemy.js';
import { MagicCircleService } from '../../../js/engine/magic_circle/MagicCircleService.js';
import { WEAPON_FAMILIES, ARMOR_ARCHETYPES, MATERIAL_TIERS } from '../../../js/engine/shared/data/EquipmentData.js';
import { SKILLS_DATA } from '../../../js/engine/shared/data/CombatData.js';
import { CONSUMABLES_DATA } from '../../../js/engine/shared/data/InventoryData.js';
import { GLYPH_DATA, MAGIC_TIER_THRESHOLDS } from '../../../js/engine/shared/data/MagicCircleData.js';

// ───────────────────────────────────────────────────────────────────────────
// Enemy Templates — mirror of ExpeditionService.getEnemyTemplates()
// ───────────────────────────────────────────────────────────────────────────
const ENEMY_TEMPLATES = {
  // Tier 1 (Forest & Meadows)
  slime_green: { name: 'Green Slime', type: 'beast', maxHp: 20, strength: 3, defense: 2, speed: 2, element: 'neutral' },
  slime_fire: { name: 'Fire Slime', type: 'beast', maxHp: 30, strength: 5, defense: 3, speed: 3, element: 'fire' },
  slime_earth: { name: 'Earth Slime', type: 'beast', maxHp: 25, strength: 4, defense: 4, speed: 1, element: 'earth' },
  wild_boar: { name: 'Wild Boar', type: 'beast', maxHp: 40, strength: 6, defense: 4, speed: 4, element: 'neutral' },
  rabbit_horned: { name: 'Horned Rabbit', type: 'beast', maxHp: 15, strength: 3, defense: 1, speed: 5, element: 'neutral' },
  goblin_scout: { name: 'Goblin Scout', type: 'humanoid', maxHp: 25, strength: 4, defense: 2, speed: 6, element: 'neutral' },
  goblin_grunt: { name: 'Goblin Grunt', type: 'humanoid', maxHp: 35, strength: 5, defense: 4, speed: 2, element: 'neutral' },
  // Tier 2 (Caves & Coast)
  bat_small: { name: 'Small Bat', type: 'beast', maxHp: 22, strength: 4, defense: 2, speed: 7, element: 'neutral' },
  spider_minor: { name: 'Minor Spider', type: 'beast', maxHp: 28, strength: 5, defense: 3, speed: 4, element: 'neutral' },
  crab_shell: { name: 'Shell Crab', type: 'beast', maxHp: 35, strength: 5, defense: 5, speed: 2, element: 'neutral' },
  water_spirit_minor: { name: 'Minor Water Spirit', type: 'elemental', maxHp: 25, strength: 4, defense: 2, speed: 5, element: 'water' },
  murloc_shore: { name: 'Shore Murloc', type: 'humanoid', maxHp: 30, strength: 5, defense: 3, speed: 4, element: 'water' },
  // Tier 3 (Forest & Camps)
  goblin_brute: { name: 'Goblin Brute', type: 'humanoid', maxHp: 55, strength: 7, defense: 5, speed: 1, element: 'neutral' },
  goblin_shaman: { name: 'Goblin Shaman', type: 'humanoid', maxHp: 40, strength: 5, defense: 3, speed: 5, element: 'storm' },
  goblin_slinger: { name: 'Goblin Slinger', type: 'humanoid', maxHp: 28, strength: 5, defense: 2, speed: 5, element: 'neutral' },
  skeleton_warrior: { name: 'Skeleton Warrior', type: 'undead', maxHp: 35, strength: 5, defense: 3, speed: 3, element: 'neutral' },
  ghost_wisp: { name: 'Ghost Wisp', type: 'undead', maxHp: 20, strength: 3, defense: 1, speed: 8, element: 'wind' },
  wolf_alpha: { name: 'Alpha Wolf', type: 'beast', maxHp: 50, strength: 7, defense: 4, speed: 5, element: 'neutral' },
  zombie_rotter: { name: 'Rotting Zombie', type: 'undead', maxHp: 45, strength: 5, defense: 3, speed: 1, element: 'neutral' },
  // Tier 4 (Ruins & Peaks)
  ice_elemental: { name: 'Ice Elemental', type: 'elemental', maxHp: 45, strength: 6, defense: 5, speed: 2, element: 'water' },
  young_drake: { name: 'Young Drake', type: 'dragon', maxHp: 70, strength: 8, defense: 6, speed: 4, element: 'fire' },
  frost_wolf: { name: 'Frost Wolf', type: 'beast', maxHp: 55, strength: 8, defense: 5, speed: 6, element: 'water' },
  cultist_acolyte: { name: 'Cultist Acolyte', type: 'humanoid', maxHp: 35, strength: 4, defense: 3, speed: 4, element: 'fire' },
  stone_golem: { name: 'Stone Golem', type: 'elemental', maxHp: 90, strength: 9, defense: 10, speed: 1, element: 'earth' },
  // Bosses
  goblin_king: { name: 'Goblin King', type: 'humanoid', maxHp: 120, strength: 10, defense: 6, speed: 4, element: 'neutral', isBoss: true },
  lich_apprentice: { name: 'Lich Apprentice', type: 'undead', maxHp: 180, strength: 25, defense: 8, speed: 5, element: 'storm', isBoss: true },
  mountain_troll: { name: 'Mountain Troll', type: 'beast', maxHp: 400, strength: 30, defense: 15, speed: 2, element: 'neutral', isBoss: true }
};

// ───────────────────────────────────────────────────────────────────────────
// Equipment helpers
// ───────────────────────────────────────────────────────────────────────────

const VALID_WEAPON_FAMILIES = Object.keys(WEAPON_FAMILIES);
const VALID_ARMOR_ARCHETYPES = Object.keys(ARMOR_ARCHETYPES);
const VALID_MATERIALS = Object.keys(MATERIAL_TIERS);
const VALID_ARMOR_SLOTS = ['head', 'body', 'legs'];
const VALID_WEAPON_SLOTS = ['leftHand', 'rightHand'];

/**
 * Normalise an equipment descriptor into the object shape the Hero expects.
 *
 * Supported shorthand forms:
 *   - Full object: { slot, type, material, family, archetype, level, affixes }
 *   - String: "weapon:iron:broadsword" or "armor:leather:plate:body"
 *
 * @param {Object|string} desc
 * @returns {{slot:string, item:Object}|null}
 */
function normaliseEquipment(desc) {
  if (typeof desc === 'string') {
    const parts = desc.split(':');
    if (parts.length === 3 && parts[0] === 'weapon') {
      const [type, material, family] = parts;
      return { slot: 'leftHand', item: { type, material, family, level: 0 } };
    }
    if (parts.length === 4 && parts[0] === 'armor') {
      const [type, material, archetype, slot] = parts;
      return { slot, item: { type, material, archetype, slot, level: 0 } };
    }
    throw new Error(`Invalid equipment string shorthand: "${desc}"`);
  }

  if (!desc || typeof desc !== 'object') return null;

  const type = desc.type || 'weapon';
  const item = {
    type,
    material: desc.material || 'wooden',
    level: desc.level ?? 0
  };

  if (type === 'weapon') {
    item.family = desc.family || 'broadsword';
  } else if (type === 'armor') {
    item.archetype = desc.archetype || 'leather';
    item.slot = desc.slot || 'body';
  }

  if (desc.affixes) item.affixes = [...desc.affixes];
  if (desc.set) item.set = desc.set;

  const slot = desc.slot || (type === 'weapon' ? 'leftHand' : 'body');
  return { slot, item };
}

/**
 * Build an equipment map from a scenario definition.
 *
 * @param {Object|Array<Object|string>} equipDef
 * @returns {Object}
 */
function buildEquipmentMap(equipDef) {
  const map = { head: null, body: null, legs: null, leftHand: null, rightHand: null, accessory: null };

  if (!equipDef) return map;

  const entries = Array.isArray(equipDef) ? equipDef : Object.entries(equipDef).map(([slot, desc]) => ({ ...desc, slot }));

  for (const entry of entries) {
    const normalised = normaliseEquipment(entry);
    if (!normalised) continue;

    const { slot, item } = normalised;
    if (map[slot] === undefined) {
      throw new Error(`Invalid equipment slot: "${slot}"`);
    }
    map[slot] = item;
  }

  return map;
}

// ───────────────────────────────────────────────────────────────────────────
// Hero builder
// ───────────────────────────────────────────────────────────────────────────

/**
 * Build a Hero instance from a scenario definition.
 *
 * @param {Object} def
 *   @param {string} def.origin          — e.g. 'origin_warrior'
 *   @param {number} def.level           — hero level (1–25)
 *   @param {string} [def.name]          — custom name
 *   @param {string} [def.id]            — custom id
 *   @param {Object} [def.stats]         — base stat overrides { baseStrength, baseMagicPower, ... }
 *   @param {number} [def.statPoints]    — unspent stat points
 *   @param {Object|Array} [def.equipment] — equipment descriptors
 *   @param {Array<string>|Array<{id:string,tier?:number}>} [def.skills] — known families
 *   @param {Array<string>} [def.glyphs] — known glyph IDs
 *   @param {Array<Object>} [def.spells] — spells to inscribe (see composeSpell)
 *   @param {Array<Object>} [def.gambits] — gambit objects to attach
 *   @param {number} [def.magicTier]     — override magic tier
 *   @param {number} [def.fatigue]       — starting fatigue (0–100)
 *   @param {number} [def.hp]            — override current HP
 *   @param {number} [def.mp]            — override current MP
 *   @param {number} [def.stamina]      — override current stamina
 *   @param {Array<string>} [def.consumables] — consumable item IDs for battle inventory
 * @returns {Hero}
 */
export function buildHero(def) {
  if (!def.origin) throw new Error('buildHero: origin is required');
  if (!def.level || def.level < 1) throw new Error('buildHero: level must be >= 1');

  const equipment = buildEquipmentMap(def.equipment);

  // Build knownFamilies from skills definition
  let knownFamilies = ['single_strike'];
  let techniqueTiers = {};
  if (def.skills) {
    for (const s of def.skills) {
      const familyId = typeof s === 'string' ? s : s.id;
      if (!SKILLS_DATA[familyId]) {
        throw new Error(`buildHero: unknown skill family "${familyId}"`);
      }
      if (!knownFamilies.includes(familyId)) {
        knownFamilies.push(familyId);
      }
      if (typeof s === 'object' && s.tier) {
        techniqueTiers[familyId] = s.tier;
      }
    }
  }

  // Compute base stats
  const baseStats = {
    baseMaxHp: 30,
    baseMaxMp: 15,
    baseStrength: 8,
    baseSpeed: 4,
    baseDefense: 4,
    baseMagicPower: 4
  };

  if (def.stats) {
    for (const [key, value] of Object.entries(def.stats)) {
      if (baseStats[key] !== undefined) {
        baseStats[key] = value;
      }
    }
  }

  // Compute magic tier / XP
  let magicXp = 0;
  if (def.magicTier && def.magicTier > 1) {
    const threshold = MAGIC_TIER_THRESHOLDS[def.magicTier - 2];
    if (threshold !== undefined) {
      magicXp = threshold;
    }
  }

  // Build hero data for constructor
  const heroData = {
    id: def.id || crypto.randomUUID(),
    name: def.name || `${def.origin.replace('origin_', '')} Test`,
    origin: def.origin,
    level: def.level,
    exp: 0,
    statPoints: def.statPoints ?? 0,
    avatar: def.avatar || null,
    ...baseStats,
    hp: def.hp ?? baseStats.baseMaxHp,
    mp: def.mp ?? baseStats.baseMaxMp,
    status: 'resting',
    knownFamilies,
    skillPoints: 0,
    techniqueUses: {},
    techniqueTiers,
    equipment,
    fatigue: def.fatigue ?? 0,
    magicXp: 0,
    magicTier: def.magicTier ?? 1,
    knownGlyphs: def.glyphs || [],
    spellCodex: [],
    gambits: [],
    fallbackAction: def.fallbackAction || 'basic_attack',
    consumables: def.consumables || []
  };

  const hero = new Hero(heroData);

  // Post-construction: apply stat points if requested
  if (def.statAllocations) {
    for (const [statId, count] of Object.entries(def.statAllocations)) {
      for (let i = 0; i < count; i++) {
        hero.increaseStat(statId);
      }
    }
  }

  // Post-construction: inscribe spells
  if (def.spells) {
    for (const spellDef of def.spells) {
      if (spellDef.id) {
        // Spell already exists — look it up in codex or compose from known data
        // For the lab, we require a composition definition
        throw new Error('buildHero: spell by id not supported in lab builder; use { glyphs: [...] }');
      }
      if (spellDef.glyphs) {
        const result = MagicCircleService.compose(
          spellDef.glyphs,
          spellDef.glyphTiers || {},
          spellDef.name || null
        );
        if (!result.success) {
          throw new Error(`buildHero: spell composition failed: ${result.error}`);
        }
        const inscribeResult = hero.inscribeSpell(result.data);
        if (!inscribeResult.success) {
          throw new Error(`buildHero: spell inscription failed: ${inscribeResult.error}`);
        }
      }
    }
  }

  // Post-construction: add gambits
  if (def.gambits) {
    for (const gambit of def.gambits) {
      const result = hero.addGambit(gambit);
      if (!result.success) {
        throw new Error(`buildHero: gambit add failed: ${result.error}`);
      }
    }
  }

  // Recalculate after all post-construction changes
  hero.recalculateStats({});

  // Ensure HP/MP are within bounds after recalculation
  hero.hp = Math.min(hero.maxHp, def.hp ?? hero.maxHp);
  hero.mp = Math.min(hero.maxMp, def.mp ?? hero.maxMp);
  hero.stamina = def.stamina ?? hero.maxStamina;

  return hero;
}

/**
 * Build a party (array of heroes) from scenario definitions.
 *
 * @param {Array<Object>} defs
 * @returns {Hero[]}
 */
export function buildParty(defs) {
  if (!Array.isArray(defs)) throw new Error('buildParty: expected array of hero definitions');
  return defs.map((def, idx) => buildHero({ ...def, id: def.id || `hero_${idx}` }));
}

// ───────────────────────────────────────────────────────────────────────────
// Enemy builder
// ───────────────────────────────────────────────────────────────────────────

/**
 * Build a single enemy from a template definition.
 *
 * @param {Object} def
 *   @param {string} def.id              — template ID (e.g. 'slime_green')
 *   @param {number} [def.level=1]       — enemy level
 *   @param {boolean} [def.isBoss=false] — boss flag
 *   @param {boolean} [def.isElite=false]— elite flag
 *   @param {number} [def.eliteTier=0]   — elite tier (0–3)
 *   @param {number} [def.statMultiplier=1.1] — stat scaling multiplier
 *   @param {number} [def.regionBaseLevel=1] — region tier for base bonuses
 * @returns {Enemy}
 */
export function buildEnemy(def) {
  const templateId = def.id || 'slime_green';
  const t = ENEMY_TEMPLATES[templateId] || ENEMY_TEMPLATES['slime_green'];
  const level = def.level || 1;
  const statMultiplier = def.statMultiplier || 1.1;
  const regionBaseLevel = def.regionBaseLevel || 1;
  const isBoss = def.isBoss || false;
  const isElite = def.isElite || false;
  const eliteTier = def.eliteTier || 0;

  // Level scaling
  const levelMult = Math.pow(statMultiplier, level - 1);
  const tierBonus = (regionBaseLevel - 1) * 2;
  const tierHpBonus = tierBonus * 5;
  const tierStrBonus = tierBonus;
  const tierDefBonus = Math.floor(tierBonus / 2);

  let scaled = {
    ...t,
    templateId,
    maxHp: Math.floor((t.maxHp * levelMult + tierHpBonus) * 1.5),
    strength: Math.floor(t.strength * levelMult + tierStrBonus),
    defense: Math.floor((t.defense || 1) * levelMult + tierDefBonus),
    speed: t.speed,
    level: level,
    id: `enemy_${templateId}_${crypto.randomUUID().slice(0, 8)}`
  };

  if (isElite) {
    const prefixes = [
      { name: 'Fierce', mult: 1.15 },
      { name: 'Corrupted', mult: 1.25 },
      { name: 'Ancient', mult: 1.35 },
      { name: 'Legendary', mult: 1.50 }
    ];
    const prefix = prefixes[eliteTier] || prefixes[0];
    scaled.maxHp = Math.floor(scaled.maxHp * prefix.mult);
    scaled.strength = Math.floor(scaled.strength * prefix.mult);
    scaled.defense = Math.floor(scaled.defense * prefix.mult);
    scaled.name = `${prefix.name} ${scaled.name}`;
    scaled.isElite = true;
    scaled.eliteTier = eliteTier;
  }

  return new Enemy({ ...scaled, isBoss });
}

/**
 * Build an encounter (array of enemies) from a scenario definition.
 *
 * @param {Object} encounter
 *   @param {Array<Object>} encounter.enemies — enemy descriptors { id, count?, level?, isElite?, eliteTier? }
 *   @param {number} [encounter.enemyLevel=1] — default level if not specified per enemy
 *   @param {number} [encounter.statMultiplier=1.1]
 *   @param {number} [encounter.regionBaseLevel=1]
 * @returns {Enemy[]}
 */
export function buildEnemies(encounter) {
  if (!encounter || !encounter.enemies) return [];

  const defaultLevel = encounter.enemyLevel || 1;
  const defaultStatMult = encounter.statMultiplier || 1.1;
  const defaultRegionBase = encounter.regionBaseLevel || 1;

  const enemies = [];
  const enemyCounts = {};

  for (const entry of encounter.enemies) {
    const templateId = typeof entry === 'string' ? entry : entry.id;
    const count = entry.count || 1;

    for (let i = 0; i < count; i++) {
      const enemy = buildEnemy({
        id: templateId,
        level: entry.level || defaultLevel,
        isBoss: entry.isBoss || false,
        isElite: entry.isElite || false,
        eliteTier: entry.eliteTier || 0,
        statMultiplier: entry.statMultiplier || defaultStatMult,
        regionBaseLevel: entry.regionBaseLevel || defaultRegionBase
      });

      // Suffix duplicate names (A, B, C...)
      enemyCounts[templateId] = (enemyCounts[templateId] || 0) + 1;
      if (enemyCounts[templateId] > 1) {
        enemy.name = `${enemy.name} ${String.fromCharCode(64 + enemyCounts[templateId])}`;
      }

      enemies.push(enemy);
    }
  }

  return enemies;
}

// ───────────────────────────────────────────────────────────────────────────
// Spell / Gambit helpers
// ───────────────────────────────────────────────────────────────────────────

/**
 * Compose a spell from glyphs and inscribe it to a hero's codex.
 *
 * @param {Hero} hero
 * @param {string[]} glyphIds
 * @param {Object} [glyphTiers]
 * @param {string} [customName]
 * @returns {Object} Result object from MagicCircleService.compose
 */
export function buildSpellFromGlyphs(hero, glyphIds, glyphTiers = {}, customName = null) {
  const result = MagicCircleService.compose(glyphIds, glyphTiers, customName);
  if (!result.success) {
    return result;
  }
  const inscribeResult = hero.inscribeSpell(result.data);
  if (!inscribeResult.success) {
    return inscribeResult;
  }
  return result;
}

/**
 * Attach gambits to a hero.
 *
 * @param {Hero} hero
 * @param {Array<Object>} gambitConfigs
 */
export function buildGambits(hero, gambitConfigs) {
  for (const gambit of gambitConfigs) {
    const result = hero.addGambit(gambit);
    if (!result.success) {
      throw new Error(`buildGambits: failed to add gambit: ${result.error}`);
    }
  }
}

/**
 * Build a consumable inventory map for a party.
 *
 * @param {Array<string>} consumableIds
 * @returns {Object} map of consumableId → quantity
 */
export function buildConsumableInventory(consumableIds) {
  const inventory = {};
  for (const id of consumableIds) {
    if (!CONSUMABLES_DATA[id]) {
      throw new Error(`buildConsumableInventory: unknown consumable "${id}"`);
    }
    inventory[id] = (inventory[id] || 0) + 1;
  }
  return inventory;
}

/**
 * Verify that a scenario definition is well-formed.
 *
 * @param {Object} scenario
 * @throws {Error} if invalid
 */
export function validateScenario(scenario) {
  if (!scenario.id) throw new Error('validateScenario: scenario.id is required');
  if (!scenario.party || !Array.isArray(scenario.party)) {
    throw new Error('validateScenario: scenario.party must be an array');
  }
  if (!scenario.encounter || !scenario.encounter.enemies) {
    throw new Error('validateScenario: scenario.encounter.enemies is required');
  }
  if (!scenario.iterations || scenario.iterations < 1) {
    throw new Error('validateScenario: scenario.iterations must be >= 1');
  }

  for (const heroDef of scenario.party) {
    if (!heroDef.origin) throw new Error('validateScenario: hero.origin is required');
    if (!heroDef.level) throw new Error('validateScenario: hero.level is required');
  }

  for (const enemyDef of scenario.encounter.enemies) {
    const id = typeof enemyDef === 'string' ? enemyDef : enemyDef.id;
    if (!id) throw new Error('validateScenario: enemy.id is required');
    if (!ENEMY_TEMPLATES[id] && !ENEMY_TEMPLATES['slime_green']) {
      throw new Error(`validateScenario: unknown enemy template "${id}"`);
    }
  }
}
