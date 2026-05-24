export const TECHNIQUE_FAMILIES = {
    single_strike: {
        id: 'single_strike',
        baseMult: 1.0,
        growth: 0.0,
        hits: 1,
        hitDecay: 0,
        staminaCostBase: 0,
        staminaCostPerTier: 0,
        targetType: 'single_enemy'
    },
    multiple_attack: {
        id: 'multiple_attack',
        baseMult: 0.7,
        growth: 0.0,
        hits: 1,
        hitDecay: 0.05,
        staminaCostBase: 8,
        staminaCostPerTier: 3,
        targetType: 'single_enemy'
    },
    power_strike: {
        id: 'power_strike',
        baseMult: 1.5,
        growth: 0.3,
        hits: 1,
        hitDecay: 0,
        staminaCostBase: 8,
        staminaCostPerTier: 4,
        targetType: 'single_enemy'
    },
    cleave: {
        id: 'cleave',
        baseMult: 0.75,
        growth: 0.1,
        hits: 1,
        hitDecay: 0,
        staminaCostBase: 8,
        staminaCostPerTier: 4,
        targetType: 'single_enemy',
        cleave: true
    },
    shield_bash: {
        id: 'shield_bash',
        baseMult: 0.8,
        growth: 0.1,
        hits: 1,
        hitDecay: 0,
        effect: 'stun',
        staminaCostBase: 8,
        staminaCostPerTier: 3,
        targetType: 'single_enemy'
    },
    poison_strike: {
        id: 'poison_strike',
        baseMult: 0.6,
        growth: 0.05,
        hits: 1,
        hitDecay: 0,
        effect: 'poison',
        staminaCostBase: 8,
        staminaCostPerTier: 2,
        targetType: 'single_enemy'
    },
    plunder: {
        id: 'plunder',
        baseMult: 0.5,
        growth: 0.05,
        hits: 1,
        hitDecay: 0,
        effect: 'loot',
        staminaCostBase: 8,
        staminaCostPerTier: 2,
        targetType: 'single_enemy'
    }
};

/**
 * Physical skill families. Each entry represents a learnable combat technique.
 * In the family-based system, heroes learn FAMILIES (not individual skills).
 * Each family scales infinitely through hidden usage (techniqueTiers).
 * Magic spells have been moved to the Magic Circle System (spellCodex).
 */
export const SKILLS_DATA = {
    single_strike: {
        id: 'single_strike',
        family: 'single_strike',
        category: 'physical',
        stat: 'strength',
        baseMultiplier: 1.0,
        staminaCostBase: 0,
        staminaCostPerTier: 0,
        targetType: 'single_enemy'
    },
    multiple_attack: {
        id: 'multiple_attack',
        family: 'multiple_attack',
        category: 'physical',
        stat: 'strength',
        baseMultiplier: 0.7,
        staminaCostBase: 8,
        staminaCostPerTier: 3,
        targetType: 'single_enemy'
    },
    power_strike: {
        id: 'power_strike',
        family: 'power_strike',
        category: 'physical',
        stat: 'strength',
        baseMultiplier: 1.5,
        staminaCostBase: 8,
        staminaCostPerTier: 4,
        targetType: 'single_enemy'
    },
    cleave: {
        id: 'cleave',
        family: 'cleave',
        category: 'physical',
        stat: 'strength',
        baseMultiplier: 0.75,
        staminaCostBase: 8,
        staminaCostPerTier: 4,
        targetType: 'single_enemy',
        cleave: true
    },
    shield_bash: {
        id: 'shield_bash',
        family: 'shield_bash',
        category: 'physical',
        stat: 'strength',
        baseMultiplier: 0.8,
        staminaCostBase: 8,
        staminaCostPerTier: 3,
        targetType: 'single_enemy',
        effect: 'stun'
    },
    poison_strike: {
        id: 'poison_strike',
        family: 'poison_strike',
        category: 'physical',
        stat: 'strength',
        baseMultiplier: 0.6,
        staminaCostBase: 8,
        staminaCostPerTier: 2,
        targetType: 'single_enemy',
        effect: 'poison'
    },
    plunder: {
        id: 'plunder',
        family: 'plunder',
        category: 'physical',
        stat: 'strength',
        baseMultiplier: 0.5,
        staminaCostBase: 8,
        staminaCostPerTier: 2,
        targetType: 'single_enemy',
        effect: 'loot'
    }
};

export const CONSUMABLES_DATA = {
    tiny_hp_potion: { id: 'tiny_hp_potion', type: 'HEAL_HP', amount: 0.3 },
    tiny_mp_potion: { id: 'tiny_mp_potion', type: 'HEAL_MP', amount: 0.3 },
    teleport_scroll: { id: 'teleport_scroll', type: 'ESCAPE', amount: 1.0 }
};

export const MEAL_RECIPES = {
    meal_bread: {
        id: 'meal_bread',
        name: 'meal_bread',
        ingredients: { food_raw_grain: 2 },
        buff: { maxHp: 0.05 },
        battles: 1,
        icon: '🍞'
    },
    meal_stew: {
        id: 'meal_stew',
        name: 'meal_stew',
        ingredients: { food_raw_grain: 3, material_wood: 1 },
        buff: { maxHp: 0.10, strength: 1 },
        battles: 1,
        icon: '🍲'
    },
    meal_pie: {
        id: 'meal_pie',
        name: 'meal_pie',
        ingredients: { food_raw_grain: 4, material_stone: 1 },
        buff: { maxHp: 0.10, defense: 1 },
        battles: 1,
        icon: '🥧'
    },
    meal_feast: {
        id: 'meal_feast',
        name: 'meal_feast',
        ingredients: { food_raw_grain: 5, material_wood: 2, material_stone: 1 },
        buff: { maxHp: 0.15, strength: 2, defense: 2 },
        battles: 2,
        icon: '🍖'
    }
};

export const WEAPON_FAMILIES = {
    dagger: { id: 'dagger', spdBonus: 2, evaBonus: 5, dmgMult: 0.8 },
    broadsword: { id: 'broadsword', spdBonus: 0, evaBonus: 0, dmgMult: 1.0 },
    battle_axe: { id: 'battle_axe', spdBonus: -2, evaBonus: 0, dmgMult: 1.5 },
    wand: { id: 'wand', spdBonus: 0, evaBonus: 0, dmgMult: 0.4, magBonus: 5, mpCostReduction: 0.1 }
};

export const MATERIAL_TIERS = {
    wooden: { id: 'wooden', levelReq: 1, mult: 1.0 },
    iron: { id: 'iron', levelReq: 2, mult: 1.5 },
    steel: { id: 'steel', levelReq: 3, mult: 2.2 },
    gold: { id: 'gold', levelReq: 4, mult: 3.5 },
    mythril: { id: 'mythril', levelReq: 5, mult: 5.0 }
};

export const ARMOR_ARCHETYPES = {
    plate: { id: 'plate', defMult: 2.0, hpMult: 1.2, spdPenalty: -3, evaPenalty: -10 },
    leather: { id: 'leather', defMult: 1.0, evaBonus: 10, spdPenalty: 0 },
    robes: { id: 'robes', defMult: 0.5, mpMult: 1.5, magMult: 1.2, spdPenalty: 0 }
};

/**
 * Calculate equipment refinement cost based on material and current level.
 * @param {Object} item - Equipment item with `material` and `level`.
 * @returns {{gold:number,materials:Object<string,number>}}
 */
export const EQUIPMENT_SET_BONUSES = {
    wooden: {
        name: 'set_wooden',
        thresholds: [2, 4, 6],
        bonuses: {
            2: { maxHp: 5 },
            4: { maxHp: 10, strength: 1 },
            6: { maxHp: 15, strength: 2, defense: 1 }
        }
    },
    iron: {
        name: 'set_iron',
        thresholds: [2, 4, 6],
        bonuses: {
            2: { maxHp: 10, strength: 1 },
            4: { maxHp: 20, strength: 2, defense: 1 },
            6: { maxHp: 30, strength: 3, defense: 2, speed: 1 }
        }
    },
    steel: {
        name: 'set_steel',
        thresholds: [2, 4, 6],
        bonuses: {
            2: { maxHp: 15, strength: 2, defense: 1 },
            4: { maxHp: 30, strength: 3, defense: 2, speed: 1 },
            6: { maxHp: 45, strength: 5, defense: 3, speed: 2, magicPower: 1 }
        }
    },
    gold: {
        name: 'set_gold',
        thresholds: [2, 4, 6],
        bonuses: {
            2: { maxHp: 20, strength: 3, defense: 2 },
            4: { maxHp: 40, strength: 5, defense: 3, speed: 2 },
            6: { maxHp: 60, strength: 7, defense: 5, speed: 3, magicPower: 3 }
        }
    },
    mythril: {
        name: 'set_mythril',
        thresholds: [2, 4, 6],
        bonuses: {
            2: { maxHp: 30, strength: 5, defense: 3, speed: 2 },
            4: { maxHp: 60, strength: 8, defense: 5, speed: 4, magicPower: 3 },
            6: { maxHp: 100, strength: 12, defense: 8, speed: 6, magicPower: 5 }
        }
    }
};

export function getRefineCost(item) {
    const L = item.level || 0;
    const nextLevel = L + 1;
    const mat = item.material;

    const cost = { gold: 0, materials: {} };

    if (mat === 'wooden') {
        cost.gold = 30 * nextLevel;
        cost.materials.material_wood = 10 * nextLevel;
    } else if (mat === 'iron') {
        cost.gold = 75 * nextLevel;
        cost.materials.material_wood = 5 * nextLevel;
        cost.materials.material_stone = 5 * nextLevel;
        cost.materials.material_iron_ore = 3 * nextLevel;
    } else if (mat === 'steel') {
        cost.gold = 150 * nextLevel;
        cost.materials.material_stone = 10 * nextLevel;
        cost.materials.material_steel_ingot = 3 * nextLevel;
    } else if (mat === 'gold') {
        cost.gold = 300 * nextLevel;
        cost.materials.material_stone = 15 * nextLevel;
    } else if (mat === 'mythril') {
        cost.gold = 500 * nextLevel;
        cost.materials.material_mythril = 2 * nextLevel;
    }

    return cost;
}


// --- Magic Circle System ---

/**
 * Glyph quality tiers — applied to ALL glyphs uniformly.
 * A glyph at tier N uses GLYPH_TIER_QUALITY[N-1].
 * Tier increases through hidden mastery (uses) or finding higher-tier tablets.
 */
export const GLYPH_TIER_QUALITY = [
    { symbol: '+',   effectMult: 1.0,  costMult: 1.0  }, // Tier 1
    { symbol: '++',  effectMult: 1.2,  costMult: 1.15 }, // Tier 2
    { symbol: '+++', effectMult: 1.5,  costMult: 1.30 }, // Tier 3
    { symbol: '✦',   effectMult: 2.0,  costMult: 1.50 }, // Tier 4
    { symbol: '✦✦',  effectMult: 2.5,  costMult: 1.75 }, // Tier 5
    { symbol: '✦✦✦', effectMult: 3.0,  costMult: 2.00 }, // Tier 6
    { symbol: '✶',   effectMult: 4.0,  costMult: 2.50 }, // Tier 7
];

/**
 * Glyph mastery thresholds (cumulative uses to reach next tier).
 * Tier N requires GLYPH_MASTERY_THRESHOLDS[N-2] uses from Tier N-1.
 * Formula: 500 × 4^(N-2)
 */
export const GLYPH_MASTERY_THRESHOLDS = [
    500,      // Tier 1 → 2
    2000,     // Tier 2 → 3
    10000,    // Tier 3 → 4
    50000,    // Tier 4 → 5
    200000,   // Tier 5 → 6
    1000000,  // Tier 6 → 7
];

/**
 * Checks whether a glyph has any growth potential across tiers.
 * A glyph has no growth if ALL effects have perTier === 0 AND costMult.perTier === 0.
 * Core glyphs always have growth (their baseDamage/baseCost scale with tier in compose).
 * Such glyphs effectively cap at Tier 1 — the selector still shows T1 only.
 * @param {Object} glyph - from GLYPH_DATA
 * @returns {boolean}
 */
export function glyphHasGrowthPotential(glyph) {
    if (!glyph) return false;
    // Core glyphs always have tier-based scaling (baseDamage × coreEffectMult, baseCost × coreCostMult)
    if (glyph.type === 'core') return true;
    // Check cost multiplier growth
    if (glyph.costMult && glyph.costMult.perTier > 0) return true;
    // Check effect growth
    if (glyph.effect) {
        for (const formula of Object.values(glyph.effect)) {
            if (formula.perTier > 0) return true;
        }
    }
    return false;
}

/**
 * Canonical Glyph Catalog — 19 glyphs across 4 categories.
 * Each glyph defines base effects that are multiplied by GLYPH_TIER_QUALITY.
 * Cost modifiers are per-glyph linear formulas.
 */
export const GLYPH_DATA = {
    // ─── Core Glyphs (element + base power) ───
    glyph_fire: {
        id: 'glyph_fire', type: 'core', element: 'fire',
        baseDamage: 10, baseCost: 5, allyFactor: 0.20
    },
    glyph_water: {
        id: 'glyph_water', type: 'core', element: 'water',
        baseDamage: 8, baseCost: 4, allyFactor: 0.25
    },
    glyph_wind: {
        id: 'glyph_wind', type: 'core', element: 'wind',
        baseDamage: 9, baseCost: 4, allyFactor: 0.22
    },
    glyph_storm: {
        id: 'glyph_storm', type: 'core', element: 'storm',
        baseDamage: 11, baseCost: 6, allyFactor: 0.18
    },
    glyph_light: {
        id: 'glyph_light', type: 'core', element: 'light',
        baseDamage: 8, baseCost: 6, allyFactor: 0.30
    },
    glyph_dark: {
        id: 'glyph_dark', type: 'core', element: 'dark',
        baseDamage: 14, baseCost: 10, allyFactor: 0.15
    },
    glyph_earth: {
        id: 'glyph_earth', type: 'core', element: 'earth',
        baseDamage: 9, baseCost: 5, allyFactor: 0.25
    },

    // ─── Power Glyphs (amplify) ───
    glyph_potentiate: {
        id: 'glyph_potentiate', type: 'power',
        effect: { damageMult: { base: 1.20, perTier: 0.20 } },
        costMult: { base: 1.15, perTier: 0.35 }
    },
    glyph_focus: {
        id: 'glyph_focus', type: 'power',
        effect: { damageMult: { base: 1.15, perTier: 0.15 }, critBonus: { base: 0.05, perTier: 0.05 } },
        costMult: { base: 1.15, perTier: 0.35 }
    },
    glyph_extend: {
        id: 'glyph_extend', type: 'power',
        effect: { duration: { base: 1, perTier: 1 } },
        costMult: { base: 1.10, perTier: 0.20 }
    },

    // ─── Effect Glyphs (behaviours) ───
    glyph_multi: {
        id: 'glyph_multi', type: 'effect',
        effect: { allTargets: { base: 1, perTier: 0 } }, // boolean: all possible targets
        costMult: { base: 3.5, perTier: 0 } // +250% MP cost
    },
    glyph_pierce: {
        id: 'glyph_pierce', type: 'effect',
        effect: { pierce: { base: 0.15, perTier: 0.10 } },
        costMult: { base: 1.20, perTier: 0.20 }
    },
    glyph_venom: {
        id: 'glyph_venom', type: 'effect',
        effect: { poisonStacks: { base: 1, perTier: 0.5 } }, // +1 per 2 tiers
        costMult: { base: 1.25, perTier: 0.25 }
    },
    glyph_slumber: {
        id: 'glyph_slumber', type: 'effect',
        effect: { sleepChance: { base: 0.20, perTier: 0.10 } },
        costMult: { base: 1.20, perTier: 0.20 }
    },
    glyph_aegis: {
        id: 'glyph_aegis', type: 'effect',
        effect: { targetAllies: { base: 1, perTier: 0 } }, // boolean: invert to ally targeting
        costMult: { base: 1.5, perTier: 0 } // +50% MP cost
    },
    glyph_celerity: {
        id: 'glyph_celerity', type: 'effect',
        effect: { speedBoost: { base: 0.20, perTier: 0.10 } },
        costMult: { base: 1.20, perTier: 0.20 }
    },
    glyph_reflect: {
        id: 'glyph_reflect', type: 'effect',
        effect: { reflectChance: { base: 0.30, perTier: 0.10 } },
        costMult: { base: 1.20, perTier: 0.20 }
    },
    glyph_leech: {
        id: 'glyph_leech', type: 'effect',
        effect: { lifesteal: { base: 0.10, perTier: 0.05 } },
        costMult: { base: 1.20, perTier: 0.20 }
    },

    // ─── Efficiency Glyphs (reduce cost) ───
    glyph_streamline: {
        id: 'glyph_streamline', type: 'efficiency',
        effect: { costReduction: { base: 0.15, perTier: 0.10 } },
        costMult: { base: 1.0, perTier: 0 } // Streamline doesn't add cost
    }
};

/**
 * Maps each core element to its ally-targeted support effect.
 * Used when a spell contains the Aegis (ally inversion) glyph.
 */
export const CORE_ALLY_EFFECTS = {
    fire:   { type: 'buff_atk',        duration: 3, stat: 'strength' },
    water:  { type: 'restore_mp',      duration: 0 },
    wind:   { type: 'buff_spd',        duration: 3, stat: 'speed' },
    storm:  { type: 'buff_crit',       duration: 3, stat: 'critChance' },
    light:  { type: 'heal_hp',         duration: 0 },
    dark:   { type: 'restore_stamina', duration: 0 },
    earth:  { type: 'buff_def',        duration: 3, stat: 'defense' }
};

/**
 * Compute a glyph's effect value at a given mastery tier.
 * @param {Object} glyph - from GLYPH_DATA
 * @param {number} tier - 1-7
 * @returns {Object} computed effects
 */
export function computeGlyphEffect(glyph, tier) {
    if (!glyph || !glyph.effect) return {};
    const t = Math.max(1, Math.min(7, tier));
    const q = GLYPH_TIER_QUALITY[t - 1];
    const result = {};
    for (const [key, formula] of Object.entries(glyph.effect)) {
        const raw = formula.base + formula.perTier * (t - 1);
        // Integer-only effects get floored; float effects keep precision
        const integerEffects = ['poisonStacks', 'duration'];
        const value = integerEffects.includes(key) ? Math.floor(raw) : raw;
        // Apply quality multiplier to multiplicative effects
        result[key] = key === 'damageMult' ? Math.max(1, value * q.effectMult) : value;
    }
    return result;
}

/**
 * Compute a glyph's cost multiplier at a given mastery tier.
 * @param {Object} glyph - from GLYPH_DATA
 * @param {number} tier - 1-7
 * @returns {number} cost multiplier (1.0 = no change)
 */
export function computeGlyphCostMult(glyph, tier) {
    if (!glyph || !glyph.costMult) return 1.0;
    const t = Math.max(1, Math.min(7, tier));
    const raw = glyph.costMult.base + glyph.costMult.perTier * (t - 1);
    // Efficiency glyphs reduce cost (raw < 1), others increase it
    return Math.max(0.1, raw);
}

/**
 * Magic Tier thresholds (cumulative Magic Insight XP).
 * Tier N requires MAGIC_TIER_THRESHOLDS[N] XP.
 * Tier = number of circle slots (1 slot at Tier 1, 25 slots at Tier 25).
 * Ring 1 fills at Tier 7, Ring 2 at Tier 13, Ring 3 at Tier 19, Ring 4 at Tier 25.
 */
export const MAGIC_TIER_THRESHOLDS = [
    0,      // Tier 1 (base)
    500,    // Tier 2
    1300,   // Tier 3
    2500,   // Tier 4
    4300,   // Tier 5
    6800,   // Tier 6
    10300,  // Tier 7  (Ring 1 complete)
    15300,  // Tier 8  (Ring 2 opens)
    21800,  // Tier 9
    30300,  // Tier 10
    41300,  // Tier 11
    55300,  // Tier 12
    73300,  // Tier 13 (Ring 2 complete)
    96300,  // Tier 14 (Ring 3 opens)
    126300, // Tier 15
    165300, // Tier 16
    215300, // Tier 17
    279300, // Tier 18
    361300, // Tier 19 (Ring 3 complete)
    466300, // Tier 20 (Ring 4 opens)
    601300, // Tier 21
    774300, // Tier 22
    996300, // Tier 23
    1281300,// Tier 24
    1646300 // Tier 25 (Ring 4 complete)
];
