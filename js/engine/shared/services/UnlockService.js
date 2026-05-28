/**
 * UnlockService - Business logic for narrative unlock moments.
 * Pure service: evaluates predicates, tracks shown narratives, persists progress.
 * No DOM, no i18n, no UI concepts.
 */

import { UNLOCK_NARRATIVES } from '../data/UnlockNarratives.js';
import { CODEX_FEATURES } from '../data/CodexFeatures.js';
import { persistence } from '../core/Persistence.js';

const STORAGE_KEY = 'unlock_state';

export class UnlockService {
    constructor(options = {}) {
        this.state = this._getDefaultState();
        if (!options.deferLoad) {
            this.load();
        }
    }

    load() {
        this.state = this._load();
    }

    _getDefaultState() {
        return {
            unlockedNarratives: [],
            unlockedCodexFeatures: []
        };
    }

    _load() {
        return persistence.load(STORAGE_KEY, this._getDefaultState());
    }

    save() {
        persistence.save(STORAGE_KEY, this.state);
    }

    /**
     * Evaluates all narrative predicates against the current state.
     * Returns only narratives that have NEVER been shown before.
     *
     * @param {Object} state — full game state
     * @returns {string[]} — array of newly triggered narrative IDs
     */
    checkAllUnlocks(state) {
        const shown = new Set(this.state.unlockedNarratives);
        const newlyTriggered = [];

        for (const narrative of UNLOCK_NARRATIVES) {
            if (shown.has(narrative.id)) continue;
            if (narrative.checkPredicate(state)) {
                newlyTriggered.push(narrative.id);
            }
        }

        return newlyTriggered;
    }

    /**
     * Checks which codex features have newly transitioned from locked to unlocked.
     * Returns only features that were NOT previously unlocked.
     *
     * @param {Object} state — full game state
     * @returns {string[]} — array of newly unlocked codex feature IDs
     */
    checkNewCodexFeatures(state) {
        const currentlyUnlocked = CODEX_FEATURES
            .filter(f => f.isUnlocked(state))
            .map(f => f.id);

        const previouslyUnlocked = new Set(this.state.unlockedCodexFeatures || []);
        const newlyUnlocked = currentlyUnlocked.filter(id => !previouslyUnlocked.has(id));

        if (newlyUnlocked.length > 0) {
            this.state.unlockedCodexFeatures = currentlyUnlocked;
            this.save();
        }

        return newlyUnlocked;
    }

    /**
     * Marks a single narrative as shown so it never triggers again.
     *
     * @param {string} id — narrative ID to mark
     */
    markAsShown(id) {
        if (!this.state.unlockedNarratives.includes(id)) {
            this.state.unlockedNarratives.push(id);
            this.save();
        }
    }

    /**
     * Marks multiple narratives as shown.
     *
     * @param {string[]} ids — array of narrative IDs
     */
    markAllAsShown(ids) {
        let changed = false;
        for (const id of ids) {
            if (!this.state.unlockedNarratives.includes(id)) {
                this.state.unlockedNarratives.push(id);
                changed = true;
            }
        }
        if (changed) {
            this.save();
        }
    }

    /**
     * Returns the list of already-shown narrative IDs.
     * @returns {string[]}
     */
    getShownNarratives() {
        return [...this.state.unlockedNarratives];
    }
}
