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
