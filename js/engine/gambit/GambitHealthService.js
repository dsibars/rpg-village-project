export class GambitHealthService {
    /**
     * Calculates the Health Score (0-100) for a hero's gambit setup.
     * @param {Object} hero - The hero with their gambits and build state
     * @param {Object} simulationResult - Optional result from SimulationRunner
     * @returns {Object} { score, rating }
     */
    static calculateScore(hero, simulationResult = null) {
        let score = 0;
        const gambits = hero.gambits || [];

        // Determine hero capabilities
        const hasHealSpell = hero.spellCodex?.some(s => s.category === 'support' || s.allyFactor > 0);
        const hasHealGlyph = hero.knownGlyphs?.some(g => g === 'glyph_light' || g === 'glyph_aegis');
        const hasCleave = hero.knownFamilies?.includes('cleave');
        const hasMultiGlyph = hero.knownGlyphs?.some(g => g === 'glyph_multi');
        const hasConsumables = true; // Simplified — in real game, check inventory

        const heroCanHeal = hasHealSpell || hasHealGlyph;
        const heroCanAoE = hasCleave || hasMultiGlyph;

        // 1. Heal coverage (+20) — satisfied if rule exists OR hero cannot heal
        const hasHealRule = gambits.some(g => {
            if (g.action?.type === 'spell') {
                const spell = hero.spellCodex?.find(s => s.name === g.action.payload);
                return spell && (spell.category === 'support' || spell.allyFactor > 0);
            }
            if (g.action?.type === 'item') {
                const itemId = g.action.payload;
                return itemId && (itemId.includes('hp') || itemId.includes('heal'));
            }
            return false;
        });
        if (hasHealRule || !heroCanHeal) score += 20;

        // 2. AoE coverage (+20) — satisfied if rule exists OR hero cannot AoE
        const hasAoERule = gambits.some(g => {
            if (g.action?.type === 'skill') return g.action.payload === 'cleave';
            if (g.action?.type === 'spell') {
                const spell = hero.spellCodex?.find(s => s.name === g.action.payload);
                return spell && spell.targetType === 'all_enemies';
            }
            return false;
        });
        if (hasAoERule || !heroCanAoE) score += 20;

        // 3. Fallback must be configured (+20)
        const fallbackIsSet = hero.fallbackAction && hero.fallbackAction !== '';
        if (fallbackIsSet) score += 20;

        // 4. Item coverage (+20) — satisfied if rule exists OR no consumables
        const hasItemRule = gambits.some(g => g.action?.type === 'item');
        if (hasItemRule || !hasConsumables) score += 20;

        // 5. Anti-redundancy (+20)
        const conditionSignatures = gambits.map(g => {
            if (!g.conditions || g.conditions.length === 0) return '';
            const c = g.conditions[0].left;
            return `${c.type}-${c.operator}-${c.value}`;
        });
        const uniqueSignatures = new Set(conditionSignatures);
        const noIdenticalConditions = uniqueSignatures.size === conditionSignatures.length;
        if (noIdenticalConditions) score += 20;

        // Dual mode: Tested Score caps at 79 if defeats occurred
        if (simulationResult && simulationResult.defeats > 0) {
            score = Math.min(score, 79);
        }

        // Cap at 100
        score = Math.min(score, 100);

        let rating = 'fragile';
        if (score >= 80) rating = 'ironclad';
        else if (score >= 50) rating = 'functional';

        return { score, rating };
    }
}
