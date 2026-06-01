/**
 * RegionValidator — Validates region data objects on module load.
 * Unknown fields warn (catches typos). Missing required fields error.
 */
export class RegionValidator {
    static REQUIRED_FIELDS = ['id', 'name', 'branching', 'minStages', 'maxStages', 'enemies', 'baseLevel', 'bossPool', 'scaling', 'lootProfile'];
    static KNOWN_FIELDS = new Set([
        'id', 'name', 'branching', 'minStages', 'maxStages', 'enemies', 'baseLevel',
        'bossPool', 'unlockRequirements', 'storyMissions',
        'scaling', 'lootProfile', 'narrative', 'glyphDropTable'
    ]);

    static validate(region) {
        const errors = [];
        const warnings = [];

        for (const field of this.REQUIRED_FIELDS) {
            if (region[field] === undefined) {
                errors.push(`Missing required field: ${field}`);
            }
        }

        for (const key of Object.keys(region)) {
            if (!this.KNOWN_FIELDS.has(key)) {
                warnings.push(`Unknown field: ${key}`);
            }
        }

        if (region.scaling) {
            const s = region.scaling;
            if (typeof s.levelPerClears !== 'number' || s.levelPerClears < 1) {
                errors.push('scaling.levelPerClears must be a positive number >= 1');
            }
            if (typeof s.statMultiplier !== 'number' || s.statMultiplier < 1) {
                errors.push('scaling.statMultiplier must be >= 1');
            }
        }

        if (region.lootProfile) {
            const lp = region.lootProfile;
            if (!Array.isArray(lp.materials)) {
                errors.push('lootProfile.materials must be an array');
            }
            for (const m of lp.materials || []) {
                if (!m.id || typeof m.min !== 'number' || typeof m.max !== 'number' || typeof m.chance !== 'number') {
                    errors.push(`Invalid material entry: ${JSON.stringify(m)}`);
                }
            }
            if (typeof lp.goldBase !== 'number') {
                errors.push('lootProfile.goldBase must be a number');
            }
            if (typeof lp.goldPerClear !== 'number') {
                errors.push('lootProfile.goldPerClear must be a number');
            }
        }

        if (region.narrative?.firstClear) {
            const nc = region.narrative.firstClear;
            if (!nc.titleKey || !nc.loreKey) {
                errors.push('narrative.firstClear requires titleKey and loreKey');
            }
        }

        return { valid: errors.length === 0, errors, warnings };
    }
}
