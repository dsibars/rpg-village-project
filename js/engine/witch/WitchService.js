import { MAGIC_TIER_THRESHOLDS, GLYPH_MASTERY_THRESHOLDS } from '../shared/data/GameConstants.js';

/**
 * WitchService generates mystical dialogue hints about magic and glyphs.
 * The Witch is the ONLY source of progress information for hidden systems.
 */
export class WitchService {
    /**
     * Get a reading for a hero.
     * @param {Object} hero
     * @param {Object} i18n
     * @returns {Object} { category, lines, proximity, element }
     */
    static getDialogue(hero, i18n, currentDay = null) {
        const magicXp = hero.magicXp || 0;
        const magicTier = hero.magicTier || 1;
        const glyphMastery = hero.glyphMastery || {};
        const lastVisit = hero.lastWitchVisit || null;
        const lastVisitDay = hero.lastWitchVisitDay || null;

        // Daily cooldown check
        if (currentDay !== null && lastVisitDay !== null && currentDay === lastVisitDay) {
            return {
                category: 'cooldown',
                element: 'neutral',
                tier: magicTier,
                lines: [i18n ? i18n.t('witch_repeated_visit') : 'witch_repeated_visit'],
                masteryHints: []
            };
        }

        // Determine proximity to next tier
        const nextThreshold = MAGIC_TIER_THRESHOLDS[magicTier] || null;
        const prevThreshold = magicTier > 1 ? MAGIC_TIER_THRESHOLDS[magicTier - 1] : 0;
        let proximity = 'none';
        let progressRatio = 0;

        if (nextThreshold !== null) {
            const range = nextThreshold - prevThreshold;
            const progress = magicXp - prevThreshold;
            progressRatio = range > 0 ? progress / range : 0;
            const remaining = 1 - progressRatio;

            if (remaining > 0.50) proximity = 'far';
            else if (remaining > 0.20) proximity = 'approaching';
            else proximity = 'near';

            // Just reached tier (within simulated 48h = treat as very recent tier-up)
            if (progressRatio < 0.05 && magicTier > 1) {
                proximity = 'just_reached';
            }
        } else {
            // Max tier
            proximity = 'max';
        }

        // Most-used element from spell codex
        const elementCounts = {};
        for (const spell of (hero.spellCodex || [])) {
            if (spell.element) {
                elementCounts[spell.element] = (elementCounts[spell.element] || 0) + 1;
            }
        }
        const dominantElement = Object.entries(elementCounts)
            .sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';

        // Check for glyph mastery hints
        const masteryHints = [];
        for (const [gid, data] of Object.entries(glyphMastery)) {
            const tier = data.tier || 1;
            const uses = data.uses || 0;
            if (tier >= 7) continue;
            const threshold = GLYPH_MASTERY_THRESHOLDS[tier - 1];
            if (!threshold) continue;
            const ratio = uses / threshold;
            if (ratio >= 0.80 && ratio < 1.0) {
                masteryHints.push({ glyphId: gid, closeness: 'near' });
            } else if (ratio >= 0.50 && ratio < 0.80) {
                masteryHints.push({ glyphId: gid, closeness: 'mid' });
            }
        }

        // Determine if repeated visit (same hero, no tier progress since last)
        const isRepeatedVisit = lastVisit && lastVisit.tier === magicTier && lastVisit.xp === magicXp;

        const lines = this._generateLines(proximity, dominantElement, magicTier, masteryHints, isRepeatedVisit, i18n);

        return {
            category: proximity,
            element: dominantElement,
            tier: magicTier,
            lines,
            masteryHints
        };
    }

    static _generateLines(proximity, element, tier, masteryHints, isRepeatedVisit, i18n) {
        const t = (key) => i18n ? i18n.t(key) : key;
        const lines = [];

        // Repeated visit with no change
        if (isRepeatedVisit) {
            lines.push(t('witch_repeated_visit'));
            return lines;
        }

        // Proximity-based main line
        const elementMetaphors = {
            fire: { far: 'witch_fire_far', approaching: 'witch_fire_approach', near: 'witch_fire_near', just_reached: 'witch_fire_reached', max: 'witch_fire_max' },
            water: { far: 'witch_water_far', approaching: 'witch_water_approach', near: 'witch_water_near', just_reached: 'witch_water_reached', max: 'witch_water_max' },
            wind: { far: 'witch_wind_far', approaching: 'witch_wind_approach', near: 'witch_wind_near', just_reached: 'witch_wind_reached', max: 'witch_wind_max' },
            storm: { far: 'witch_storm_far', approaching: 'witch_storm_approach', near: 'witch_storm_near', just_reached: 'witch_storm_reached', max: 'witch_storm_max' },
            light: { far: 'witch_light_far', approaching: 'witch_light_approach', near: 'witch_light_near', just_reached: 'witch_light_reached', max: 'witch_light_max' },
            dark: { far: 'witch_dark_far', approaching: 'witch_dark_approach', near: 'witch_dark_near', just_reached: 'witch_dark_reached', max: 'witch_dark_max' },
            neutral: { far: 'witch_generic_far', approaching: 'witch_generic_approach', near: 'witch_generic_near', just_reached: 'witch_generic_reached', max: 'witch_generic_max' }
        };

        const metaphorKey = (elementMetaphors[element] || elementMetaphors.neutral)[proximity];
        if (metaphorKey) lines.push(t(metaphorKey));

        // Fallback generic lines if no i18n key found
        if (lines.length === 0) {
            switch (proximity) {
                case 'far':
                    lines.push(t('witch_generic_far'));
                    break;
                case 'approaching':
                    lines.push(t('witch_generic_approach'));
                    break;
                case 'near':
                    lines.push(t('witch_generic_near'));
                    break;
                case 'just_reached':
                    lines.push(t('witch_generic_reached'));
                    break;
                case 'max':
                    lines.push(t('witch_generic_max'));
                    break;
                default:
                    lines.push(t('witch_generic_far'));
            }
        }

        // Glyph mastery hints (max 1 per visit)
        if (masteryHints.length > 0) {
            const hint = masteryHints[0];
            const closenessKey = hint.closeness === 'near' ? 'witch_mastery_near' : 'witch_mastery_mid';
            lines.push(t(closenessKey).replace('{glyph}', t(hint.glyphId)));
        }

        return lines;
    }

    /**
     * Record a visit to the Witch's Hut.
     * Call this after generating dialogue.
     */
    static recordVisit(hero, day) {
        hero.lastWitchVisit = {
            tier: hero.magicTier || 1,
            xp: hero.magicXp || 0
        };
        if (day !== undefined && day !== null) {
            hero.lastWitchVisitDay = day;
        }
    }
}
