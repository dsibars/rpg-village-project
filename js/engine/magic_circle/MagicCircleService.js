import {
    GLYPH_DATA,
    CORE_ALLY_EFFECTS,
    MAGIC_TIER_THRESHOLDS,
    GLYPH_TIER_QUALITY,
    GLYPH_MASTERY_THRESHOLDS,
    computeGlyphEffect,
    computeGlyphCostMult,
    glyphHasGrowthPotential
} from '../shared/data/GameConstants.js';
import { Result } from '../shared/core/Result.js';

/**
 * MagicCircleService handles spell composition, cost calculation,
 * glyph mastery, and Magic Insight progression.
 */
export class MagicCircleService {
    /**
     * Get the number of circle slots for a given magic tier.
     * Tier = slot count (Tier 1 = 1 slot, Tier 25 = 25 slots).
     */
    static getSlotCount(magicTier) {
        return Math.max(1, Math.min(25, magicTier || 1));
    }

    /**
     * Calculate magic tier from cumulative Magic Insight XP.
     * @param {number} magicXp
     * @returns {number} Current magic tier (1-25)
     */
    static getMagicTier(magicXp) {
        let tier = 1;
        for (let i = 1; i < MAGIC_TIER_THRESHOLDS.length; i++) {
            if (magicXp >= MAGIC_TIER_THRESHOLDS[i]) {
                tier = i + 1;
            } else {
                break;
            }
        }
        return Math.min(25, tier);
    }

    /**
     * Get the quality symbol for a glyph tier.
     * @param {number} tier
     * @returns {string}
     */
    static getGlyphSymbol(tier) {
        const t = Math.max(1, Math.min(7, tier));
        return GLYPH_TIER_QUALITY[t - 1]?.symbol || '+';
    }

    /**
     * Compute spell stats from a composition.
     * @param {string[]} glyphIds - ordered glyph IDs (first = core)
     * @param {Object} glyphTiers - { glyphId: tier } map
     * @param {string} [customName] - player-given name
     * @returns {Result} { spell: { id, name, mpCost, damage, element, targetType, effects, glyphIds, glyphTiers } }
     */
    static compose(glyphIds, glyphTiers = {}, customName = null) {
        if (!glyphIds || glyphIds.length === 0) {
            return Result.fail('error_no_glyphs');
        }

        const glyphs = glyphIds.map(id => GLYPH_DATA[id]).filter(Boolean);
        if (glyphs.length === 0) {
            return Result.fail('error_invalid_glyphs');
        }

        const core = glyphs.find(g => g.type === 'core');
        if (!core) {
            return Result.fail('error_no_core_glyph');
        }

        const nonCore = glyphs.filter(g => g.type !== 'core');
        if (nonCore.length > 0 && nonCore.some(g => g.type === 'core')) {
            return Result.fail('error_multiple_cores');
        }

        let totalDamageMult = 1.0;
        let totalCostMult = 1.0;
        const effects = {
            pierce: 0,
            poisonStacks: 0,
            sleepChance: 0,
            speedBoost: 0,
            reflectChance: 0,
            lifesteal: 0,
            duration: 0,
            costReduction: 0,
            critBonus: 0
        };

        for (const glyph of glyphs) {
            const tier = glyphTiers[glyph.id] || 1;
            const costMult = computeGlyphCostMult(glyph, tier);
            totalCostMult *= costMult;

            const glyphEffects = computeGlyphEffect(glyph, tier);

            if (glyphEffects.damageMult) {
                totalDamageMult *= glyphEffects.damageMult;
            }
            if (glyphEffects.critBonus) {
                effects.critBonus += glyphEffects.critBonus;
            }
            if (glyphEffects.pierce) {
                effects.pierce += glyphEffects.pierce;
            }
            if (glyphEffects.poisonStacks) {
                effects.poisonStacks += glyphEffects.poisonStacks;
            }
            if (glyphEffects.sleepChance) {
                effects.sleepChance += glyphEffects.sleepChance;
            }
            if (glyphEffects.speedBoost) {
                effects.speedBoost += glyphEffects.speedBoost;
            }
            if (glyphEffects.reflectChance) {
                effects.reflectChance += glyphEffects.reflectChance;
            }
            if (glyphEffects.lifesteal) {
                effects.lifesteal += glyphEffects.lifesteal;
            }
            if (glyphEffects.duration) {
                effects.duration += glyphEffects.duration;
            }
            if (glyphEffects.costReduction) {
                effects.costReduction += glyphEffects.costReduction;
            }
        }

        // Apply efficiency reductions
        const efficiencyMult = Math.max(0.1, 1 - effects.costReduction);

        const coreTier = Math.max(1, Math.min(7, glyphTiers[core.id] || 1));
        const coreEffectMults = [1.0, 1.2, 1.5, 2.0, 2.5, 3.0, 4.0];
        const coreCostMults = [1.0, 1.15, 1.3, 1.5, 1.75, 2.0, 2.5];

        const coreEffectMult = coreEffectMults[coreTier - 1];
        const coreCostMult = coreCostMults[coreTier - 1];

        // Determine targeting based on boolean glyph presence
        const hasAegis = glyphIds.includes('glyph_aegis');
        const hasMulti = glyphIds.includes('glyph_multi');

        let targetType;
        if (hasAegis && hasMulti) {
            targetType = 'all_allies';
        } else if (hasAegis) {
            targetType = 'single_ally';
        } else if (hasMulti) {
            targetType = 'all_enemies';
        } else {
            targetType = 'single_enemy';
        }

        const baseMpCost = core.baseCost * coreCostMult;
        const mpCost = Math.max(1, Math.floor(baseMpCost * totalCostMult * efficiencyMult));
        const damage = Math.floor(core.baseDamage * coreEffectMult * totalDamageMult);

        const spell = {
            id: `spell_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            name: customName || this._generateSpellName(core.element, glyphs, effects, hasAegis),
            mpCost,
            damage,
            element: core.element,
            targetType,
            category: hasAegis ? 'support' : 'offensive',
            allyFactor: core.allyFactor || 0.2,
            effects,
            glyphIds: [...glyphIds],
            glyphTiers: { ...glyphTiers },
            createdAt: Date.now()
        };

        return Result.ok(spell);
    }

    /**
     * Validate whether a hero can inscribe a spell to their Codex.
     * @param {Object} spell
     * @param {number} heroMagicTier
     * @param {number} currentCodexSize
     * @returns {Result}
     */
    static validateInscription(spell, heroMagicTier, currentCodexSize) {
        if (!spell || !spell.glyphIds || spell.glyphIds.length === 0) {
            return Result.fail('error_invalid_spell');
        }
        const maxSlots = this.getSlotCount(heroMagicTier);
        if (spell.glyphIds.length > maxSlots) {
            return Result.fail('error_too_many_glyphs');
        }
        if (currentCodexSize >= 6) {
            return Result.fail('error_codex_full');
        }
        return Result.ok(true);
    }

    /**
     * Check if a hero can cast a given spell from their Codex.
     * Tier-locked: hero must have enough circle slots.
     * @param {Object} spell
     * @param {number} heroMagicTier
     * @returns {boolean}
     */
    static canCast(spell, heroMagicTier) {
        if (!spell || !spell.glyphIds) return false;
        const maxSlots = this.getSlotCount(heroMagicTier);
        return spell.glyphIds.length <= maxSlots;
    }

    /**
     * Calculate Magic Insight gained from casting a spell.
     * Insight = Spell MP Cost × 0.5 × (1 + Average Glyph Tier)
     * @param {Object} spell
     * @param {Object} glyphTiers
     * @returns {number}
     */
    static calculateInsight(spell, glyphTiers = {}) {
        if (!spell || !spell.mpCost) return 0;
        const avgTier = spell.glyphIds.reduce((sum, gid) => {
            return sum + (glyphTiers[gid] || 1);
        }, 0) / Math.max(1, spell.glyphIds.length);
        return Math.floor(spell.mpCost * 0.5 * (1 + avgTier));
    }

    /**
     * Check if any glyph has crossed a mastery threshold from usage.
     * @param {string} glyphId
     * @param {number} currentTier
     * @param {number} totalUses
     * @returns {number|null} new tier if evolved, null otherwise
     */
    static checkGlyphMastery(glyphId, currentTier, totalUses) {
        if (currentTier >= 7) return null;
        const glyph = GLYPH_DATA[glyphId];
        if (!glyphHasGrowthPotential(glyph)) return null;
        const threshold = GLYPH_MASTERY_THRESHOLDS[currentTier - 1];
        if (totalUses >= threshold) {
            return currentTier + 1;
        }
        return null;
    }

    /**
     * Auto-generate a spell name from composition.
     */
    static _generateSpellName(coreElement, glyphs, effects, isSupport = false) {
        const powerCount = glyphs.filter(g => g.type === 'power').length;
        const effectNames = glyphs.filter(g => g.type === 'effect').map(g => g.id.replace('glyph_', ''));

        const elementNames = {
            fire: 'Fire', water: 'Water', wind: 'Wind',
            storm: 'Storm', light: 'Light', dark: 'Dark', earth: 'Earth'
        };

        if (isSupport) {
            const supportPrefixes = {
                fire: 'Empowering', water: 'Restoring', wind: 'Swift',
                storm: 'Focusing', light: 'Soothing', dark: 'Invigorating', earth: 'Fortifying'
            };
            const prefix = supportPrefixes[coreElement] || 'Blessed';
            let name = `${prefix} ${elementNames[coreElement] || 'Mystic'}`;
            if (effectNames.includes('multi')) name += ' Chorus';
            if (effectNames.includes('leech')) name += ' of Hunger'; // rare on support
            return name.trim();
        }

        const prefixes = ['Lesser', 'Small', '', 'Greater', 'Grand', 'Legendary'];
        const prefix = prefixes[Math.min(5, powerCount)] || '';

        let name = `${prefix} ${elementNames[coreElement] || 'Mystic'}`;
        if (effectNames.includes('multi')) name += ' Wave';
        if (effects.lifesteal > 0) name += ' of Hunger';
        if (effects.sleepChance > 0) name += ' of Slumber';
        if (effectNames.includes('aegis')) name += ' Ward';
        if (effectNames.length === 0 && powerCount === 0) name += ' Spark';

        return name.trim();
    }

    /**
     * Get all glyph IDs grouped by category.
     * @returns {Object} { core: [], power: [], effect: [], efficiency: [] }
     */
    static getGlyphCatalog() {
        const catalog = { core: [], power: [], effect: [], efficiency: [] };
        for (const glyph of Object.values(GLYPH_DATA)) {
            if (catalog[glyph.type]) catalog[glyph.type].push(glyph);
        }
        return catalog;
    }
}
