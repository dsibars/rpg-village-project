/**
 * HeroMigrationService handles all save-format migrations for Hero data.
 * Stateless — pure functions that transform old save data to current format.
 */

const OLD_SKILL_TO_FAMILY = {
    basic_attack: 'single_strike',
    double_attack: 'multiple_attack',
    triple_attack: 'multiple_attack',
    whirlwind: 'cleave',
    blade_dance: 'cleave',
    power_strike: 'power_strike',
    shield_bash: 'shield_bash',
    poison_strike: 'poison_strike'
};

const OLD_GLYPH_MAP = {
    core_fire: 'glyph_fire',
    core_water: 'glyph_water',
    core_wind: 'glyph_wind',
    core_storm: 'glyph_storm',
    core_light: 'glyph_light',
    core_dark: 'glyph_dark',
    power_plus: 'glyph_potentiate',
    power_plus2: 'glyph_potentiate',
    power_plus3: 'glyph_potentiate',
    effect_multi: 'glyph_multi',
    effect_repeat: 'glyph_multi',
    efficiency_stream: 'glyph_streamline'
};

export class HeroMigrationService {
    /**
     * Migrate from old flat skill system (skills: { skillId: level })
     * to new family-based system.
     */
    static migrateOldSkills(oldSkills, oldTiers, oldUses, skillPointsFromLevel) {
        const knownFamilies = new Set(['single_strike']);
        const techniqueTiers = {};
        const techniqueUses = { ...(oldUses || {}) };

        for (const [skillId, level] of Object.entries(oldSkills || {})) {
            const family = OLD_SKILL_TO_FAMILY[skillId];
            if (!family) continue;
            knownFamilies.add(family);

            // Convert old skill level (0-5) to tier (1-3) as a fair head-start
            const migratedTier = Math.max(1, Math.min(3, (level || 0) + 1));
            techniqueTiers[family] = Math.max(techniqueTiers[family] || 0, migratedTier);
        }

        // Also carry over any existing techniqueTiers
        for (const [family, tier] of Object.entries(oldTiers || {})) {
            techniqueTiers[family] = Math.max(techniqueTiers[family] || 0, tier);
        }

        const totalPoints = skillPointsFromLevel;
        const spentPoints = knownFamilies.size - 1; // minus single_strike
        const skillPoints = Math.max(0, totalPoints - spentPoints);

        return {
            knownFamilies: Array.from(knownFamilies),
            skillPoints,
            techniqueTiers,
            techniqueUses
        };
    }

    /**
     * Migrate old glyph IDs to canonical IDs.
     */
    static migrateKnownGlyphs(oldGlyphs, origin) {
        const migrated = new Set();
        for (const g of (oldGlyphs || [])) {
            const canonical = OLD_GLYPH_MAP[g] || g;
            migrated.add(canonical);
        }
        // Ensure arcane initiate starts with fire + potentiate if empty
        if (migrated.size === 0 && origin === 'origin_arcane_initiate') {
            migrated.add('glyph_fire');
            migrated.add('glyph_potentiate');
        }
        return Array.from(migrated);
    }

    /**
     * Build glyph mastery map from save data or initialize from knownGlyphs.
     */
    static migrateGlyphMastery(savedMastery, knownGlyphs) {
        if (savedMastery && typeof savedMastery === 'object') {
            const result = {};
            for (const [gid, data] of Object.entries(savedMastery)) {
                const canonical = OLD_GLYPH_MAP[gid] || gid;
                result[canonical] = { tier: data.tier || 1, uses: data.uses || 0 };
            }
            return result;
        }
        // Fresh: all known glyphs start at Tier 1
        const result = {};
        for (const gid of knownGlyphs) {
            result[gid] = { tier: 1, uses: 0 };
        }
        return result;
    }

    /**
     * Migrate body inscription data from old array format to new glyph-based format.
     */
    static migrateBodyInscription(oldData) {
        if (!oldData) return null;
        if (Array.isArray(oldData) && oldData.length > 0) {
            // Old format: array of skill/family IDs — can't meaningfully migrate to glyphs
            // Clear it so the player can re-inscribe using the new system
            return null;
        }
        if (oldData.glyphIds) {
            // New format
            return { glyphIds: [...oldData.glyphIds], glyphTiers: { ...(oldData.glyphTiers || {}) } };
        }
        return null;
    }

    /**
     * Migrate gambits from old flat condition string to new Condition Object format.
     */
    static migrateGambits(gambits) {
        if (!Array.isArray(gambits)) return [];
        return gambits.map(g => {
            // Already new format
            if (g.conditions && Array.isArray(g.conditions)) return g;
            if (!g.condition) return g;

            // Migrate old flat condition string to new Condition Object
            const threshold = g.threshold;
            let conditionType;
            let operator = '<';
            let value;

            switch (g.condition) {
                case 'self_hp_below':
                    conditionType = 'self_hp';
                    value = threshold ?? 0.5;
                    break;
                case 'ally_hp_below':
                    conditionType = 'ally_hp';
                    value = threshold ?? 0.5;
                    break;
                case 'self_mp_below':
                    conditionType = 'self_mp';
                    value = threshold ?? 0.3;
                    break;
                case 'self_stamina_below':
                    conditionType = 'self_sta';
                    value = threshold ?? 0.3;
                    break;
                case 'always':
                    conditionType = 'always';
                    operator = undefined;
                    value = true;
                    break;
                default:
                    conditionType = g.condition;
                    value = threshold;
            }

            const left = { type: conditionType };
            if (operator !== undefined) left.operator = operator;
            if (value !== undefined) left.value = value;

            return {
                id: g.id,
                conditions: [{ op: 'SINGLE', left, right: null }],
                action: { type: 'skill', payload: g.skillId || null },
                target: null,
                enabled: g.enabled !== false
            };
        });
    }
}
