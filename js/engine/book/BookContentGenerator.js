/**
 * BookContentGenerator — Analyzes combat state and generates unique,
 * contextual observations for the Book. The chronicler notices what is
 * special about *this* battle.
 */
export class BookContentGenerator {
    /**
     * Generate a combat Book entry based on combat patterns.
     * @param {Object} combatLog — The combat log from ExpeditionService.resolveBattle()
     * @param {Array} heroes — Hero objects from heroService (after battle)
     * @param {Object} presentationService — The presentation service for checking first-time events
     * @returns {{ textKey: string, values: Object }}
     */
    generateCombatEntry(combatLog, heroes, presentationService) {
        if (!combatLog) {
            return { textKey: 'book_history_combat_victory', values: {} };
        }

        const { isVictory, enemies, enemyDetails } = combatLog;
        const heroCount = heroes.length;
        const enemyCount = enemyDetails?.length || 0;

        const values = this._buildValues(heroes, enemies);

        if (isVictory) {
            return this._generateVictoryEntry(combatLog, heroes, presentationService, enemyDetails, heroCount, enemyCount, values);
        }

        return this._generateDefeatEntry(combatLog, heroes, presentationService, enemyCount, values);
    }

    _generateVictoryEntry(combatLog, heroes, presentationService, enemyDetails, heroCount, enemyCount, values) {
        // 1. First victory ever (most special)
        if (presentationService && !presentationService.isSeen('pres_first_victory')) {
            return { textKey: 'book_history_combat_victory_first', values };
        }

        // 2. Boss defeated
        if (enemyDetails.some(e => e.isBoss)) {
            return { textKey: 'book_history_combat_victory_boss', values };
        }

        // 3. Elite hunt (elite but no boss)
        if (enemyDetails.some(e => e.isElite)) {
            return { textKey: 'book_history_combat_victory_elite', values };
        }

        // 4. Flawless victory — no hero took damage
        const allFlawless = heroes.every(h => {
            const summary = combatLog.summary?.find(s => s.heroId === h.id);
            return summary && summary.hpLost === 0;
        });
        if (allFlawless) {
            return { textKey: 'book_history_combat_victory_flawless', values };
        }

        // 5. Overwhelming victory — 2x+ enemies vs heroes
        if (enemyCount >= heroCount * 2) {
            return { textKey: 'book_history_combat_victory_overwhelming', values };
        }

        // 6. Close call — any hero ended below 25% HP
        const anyCloseCall = heroes.some(h => h.maxHp > 0 && h.hp / h.maxHp < 0.25);
        if (anyCloseCall) {
            return { textKey: 'book_history_combat_victory_close', values };
        }

        // Default generic victory
        return { textKey: 'book_history_combat_victory', values };
    }

    _generateDefeatEntry(combatLog, heroes, presentationService, enemyCount, values) {
        // 1. First defeat ever
        if (presentationService && !presentationService.isSeen('pres_first_defeat')) {
            return { textKey: 'book_history_combat_defeat_first', values };
        }

        // 2. Total wipe — all heroes fell
        const allFallen = heroes.every(h => h.hp <= 0);
        if (allFallen) {
            return { textKey: 'book_history_combat_defeat_wipe', values };
        }

        // 3. Narrow escape — exactly one hero barely survived (hp > 0 but < 25%)
        const barelySurvived = heroes.filter(h => h.hp > 0 && h.maxHp > 0 && h.hp / h.maxHp < 0.25);
        if (barelySurvived.length === 1) {
            return { textKey: 'book_history_combat_defeat_escape', values };
        }

        // 4. Close call — all heroes survived (retreated) but lost
        const allSurvived = heroes.every(h => h.hp > 0);
        if (allSurvived) {
            return { textKey: 'book_history_combat_defeat_close', values };
        }

        // Default generic defeat
        return { textKey: 'book_history_combat_defeat', values };
    }

    _buildValues(heroes, enemies) {
        const heroNames = heroes.map(h => h.name).join(', ');
        const enemyNames = enemies?.map(e => typeof e === 'string' ? e : e.name).join(', ') || 'enemies';
        const enemyCount = enemies?.length || 0;

        return {
            heroes: heroNames,
            enemyCount,
            enemies: enemyNames
        };
    }
}
