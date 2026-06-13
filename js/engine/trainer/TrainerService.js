/**
 * TrainerService generates gruff dialogue hints based on hero technique progress.
 * Returns i18n keys and params — presentation layer handles translation.
 */
export class TrainerService {
    /**
     * Get trainer dialogue for a hero.
     * @param {Hero} hero
     * @returns {Object} { lines: [{key, params?}], category: string }
     */
    static getDialogue(hero) {
        const families = Object.keys(hero.techniqueUses || {});
        const tiers = hero.techniqueTiers || {};

        // Check for high-tier mastery first
        const highTierFamily = families.find(f => (tiers[f] || 1) >= 5);
        if (highTierFamily) {
            return {
                category: 'high_tier',
                lines: this._getLines('high_tier', { family: highTierFamily, tier: tiers[highTierFamily] })
            };
        }

        // Check progress toward next tier for each family
        let bestProgress = { family: null, progress: 0, threshold: 1 };
        for (const family of families) {
            const currentTier = tiers[family] || 1;
            const uses = hero.techniqueUses[family] || 0;
            const threshold = this._getTierThreshold(currentTier + 1);
            const progress = uses / threshold;
            if (progress > bestProgress.progress) {
                bestProgress = { family, progress, threshold, uses };
            }
        }

        // If no families used yet
        if (families.length === 0) {
            return {
                category: 'no_family',
                lines: this._getLines('no_family')
            };
        }

        // Determine category based on best progress
        let category = 'far';
        if (bestProgress.progress >= 0.75) category = 'near';
        else if (bestProgress.progress >= 0.25) category = 'approaching';

        return {
            category,
            lines: this._getLines(category, {
                family: bestProgress.family,
                uses: bestProgress.uses,
                threshold: bestProgress.threshold
            })
        };
    }

    static _getTierThreshold(tier) {
        if (tier <= 1) return 0;
        return Math.floor(100 * Math.pow(3, tier - 2));
    }

    static _getLines(category, ctx = {}) {
        const lines = [];
        const familyKey = ctx.family ? `family_${ctx.family}` : '';

        switch (category) {
            case 'no_family':
                lines.push({ key: 'trainer_no_family_1' });
                lines.push({ key: 'trainer_no_family_2' });
                break;
            case 'far':
                lines.push({ key: 'trainer_far_1', params: { family: familyKey } });
                lines.push({ key: 'trainer_far_2', params: { family: familyKey } });
                break;
            case 'approaching':
                lines.push({ key: 'trainer_approaching_1', params: { family: familyKey } });
                lines.push({ key: 'trainer_approaching_2', params: { family: familyKey } });
                break;
            case 'near':
                lines.push({ key: 'trainer_near_1', params: { family: familyKey } });
                lines.push({ key: 'trainer_near_2', params: { family: familyKey } });
                break;
            case 'high_tier':
                lines.push({ key: 'trainer_high_tier_1', params: { family: familyKey, tier: ctx.tier } });
                lines.push({ key: 'trainer_high_tier_2', params: { family: familyKey } });
                break;
        }

        return lines.filter(Boolean);
    }
}
