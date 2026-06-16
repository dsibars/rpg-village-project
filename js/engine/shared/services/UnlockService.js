/**
 * UnlockService - Business logic for narrative unlock moments.
 * Pure service: evaluates predicates, tracks shown narratives, persists progress.
 * No DOM, no i18n, no UI concepts.
 */

import { UNLOCK_NARRATIVES } from '../data/UnlockNarratives.js';
import { CODEX_FEATURES } from '../data/CodexFeatures.js';
import { persistence } from '../core/Persistence.js';

const STORAGE_KEY = 'unlock_state';

const MAX_STORED_NARRATIVES = 100;

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

    setState(state) {
        this.state = state;
        this.save();
    }

    _getDefaultState() {
        return {
            unlockedNarratives: [],      // { id: string, daySeen: number | null }[]
            unlockedCodexFeatures: []
        };
    }

    _load() {
        const raw = persistence.load(STORAGE_KEY, this._getDefaultState());
        // Migrate old string[] to new object[]
        if (raw.unlockedNarratives && raw.unlockedNarratives.length > 0 && typeof raw.unlockedNarratives[0] === 'string') {
            raw.unlockedNarratives = raw.unlockedNarratives.map(id => ({ id, daySeen: null }));
        }
        return raw;
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
        const shown = new Set(this.state.unlockedNarratives.map(e => e.id));
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
     * Trims the unlockedNarratives array to a maximum size, keeping the most recent entries.
     * @private
     */
    _trimNarratives() {
        if (this.state.unlockedNarratives.length > MAX_STORED_NARRATIVES) {
            this.state.unlockedNarratives = this.state.unlockedNarratives.slice(-MAX_STORED_NARRATIVES);
        }
    }

    /**
     * Marks a single narrative as shown so it never triggers again.
     *
     * @param {string} id — narrative ID to mark
     * @param {number|null} day — day the narrative was seen (optional)
     */
    markAsShown(id, day = null) {
        const exists = this.state.unlockedNarratives.some(entry => entry.id === id);
        if (!exists) {
            this.state.unlockedNarratives.push({ id, daySeen: day });
            this._trimNarratives();
            this.save();
        }
    }

    /**
     * Marks multiple narratives as shown.
     *
     * @param {string[]} ids — array of narrative IDs
     * @param {number|null} day — day the narratives were seen (optional)
     */
    markAllAsShown(ids, day = null) {
        let changed = false;
        for (const id of ids) {
            const exists = this.state.unlockedNarratives.some(entry => entry.id === id);
            if (!exists) {
                this.state.unlockedNarratives.push({ id, daySeen: day });
                changed = true;
            }
        }
        if (changed) {
            this._trimNarratives();
            this.save();
        }
    }

    /**
     * Returns whether a narrative has already been shown.
     * @param {string} id — narrative ID
     * @returns {boolean}
     */
    isShown(id) {
        return this.state.unlockedNarratives.some(entry => entry.id === id);
    }

    /**
     * Returns the list of already-shown narratives.
     * @returns {{id: string, daySeen: number|null}[]}
     */
    getShownNarratives() {
        return [...this.state.unlockedNarratives];
    }
}
