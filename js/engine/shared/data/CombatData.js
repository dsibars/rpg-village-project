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
