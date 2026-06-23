/**
 * @fileoverview TutorialService.js — Core tutorial state machine.
 *
 * Manages tutorial lifecycle: start, advance, skip, persistence, and
 * event-driven step advancement. Consumes TutorialRegistry definitions
 * and drives the tutorial flow via events from the presentation layer.
 */

import { TutorialRegistry } from './TutorialRegistry.js';

/**
 * @typedef {import('./TutorialTypes.js').TutorialState} TutorialState
 * @typedef {import('./TutorialTypes.js').TutorialEventPayload} TutorialEventPayload
 */

export class TutorialService {
    /**
     * @param {Object} options
     * @param {Object} options.persistence — must have save(key, data) and load(key, defaultValue)
     * @param {number|null} [options.slotIndex] — save slot index, null for global
     */
    constructor({ persistence, slotIndex = null } = {}) {
        this.persistence = persistence;
        this.slotIndex = slotIndex;
        this.state = this._load();
    }

    /**
     * Load state from persistence (called by GameEngine.initialize).
     * Idempotent — safe to call multiple times.
     */
    load() {
        this.state = this._load();
    }

    /**
     * Start a tutorial by ID.
     * @param {string} tutorialId
     * @param {boolean} [force=false] — start even if already completed
     * @param {boolean} [fromChain=false] — started automatically from chain
     * @returns {boolean} — true if started successfully
     */
    start(tutorialId, force = false, fromChain = false) {
        if (this.state.completedTutorialIds.includes(tutorialId) && !force) {
            return false;
        }
        if (this.state.activeTutorialId) {
            return false; // one at a time
        }
        const tutorial = TutorialRegistry.get(tutorialId);
        if (!tutorial) {
            console.warn(`TutorialService: Unknown tutorial "${tutorialId}"`);
            return false;
        }

        this.state = {
            ...this.state,
            activeTutorialId: tutorialId,
            currentStepIndex: 0,
            stepData: {}
        };
        this._save();
        return true;
    }

    /**
     * Advance to the next step in the active tutorial.
     * @param {Object} [data] — optional data to merge into stepData
     * @returns {boolean} — true if advanced or completed
     */
    advance(data = {}) {
        if (!this.state.activeTutorialId) {
            return false;
        }
        const tutorial = TutorialRegistry.get(this.state.activeTutorialId);
        if (!tutorial) {
            this._clearActive();
            this._save();
            return false;
        }

        const nextIndex = this.state.currentStepIndex + 1;
        if (nextIndex >= tutorial.steps.length) {
            this._complete();
            return true;
        }

        this.state = {
            ...this.state,
            currentStepIndex: nextIndex,
            stepData: { ...this.state.stepData, ...data }
        };
        this._save();
        return true;
    }

    /**
     * Skip the currently active tutorial, marking it as completed.
     * @returns {boolean}
     */
    skip() {
        if (!this.state.activeTutorialId) {
            return false;
        }
        const completedId = this.state.activeTutorialId;

        this.state.completedTutorialIds.push(completedId);
        this.state.activeTutorialId = null;
        this.state.currentStepIndex = 0;
        this.state.stepData = {};
        this._save();

        // Chain: skip still triggers next tutorial if defined
        this._startNextTutorial(completedId);
        return true;
    }

    /**
     * Evaluate trigger conditions and auto-start any matching tutorial.
     * @param {Object} gameState — current engine state snapshot
     * @returns {boolean} — true if a tutorial was started
     */
    evaluateTriggers(gameState) {
        if (this.state.activeTutorialId) {
            return false; // one at a time
        }

        for (const [id, tutorial] of TutorialRegistry.entries()) {
            if (this.state.completedTutorialIds.includes(id)) {
                continue;
            }
            if (this._checkTrigger(tutorial, gameState)) {
                return this.start(id, false, false);
            }
        }
        return false;
    }

    /**
     * Report an event from the presentation layer to check if it advances
     * the current tutorial step.
     * @param {TutorialEventPayload} payload
     * @returns {boolean} — true if the event caused an advancement
     */
    reportEvent(payload) {
        if (!this.state.activeTutorialId) {
            return false;
        }

        const tutorial = TutorialRegistry.get(this.state.activeTutorialId);
        if (!tutorial) {
            return false;
        }

        const step = tutorial.steps[this.state.currentStepIndex];
        if (!step || !step.advanceOn) {
            return false;
        }

        const advanceOn = step.advanceOn;

        // Match event type
        if (advanceOn.event !== payload.event) {
            return false;
        }

        // Match optional filters
        if (advanceOn.heroId && advanceOn.heroId !== payload.heroId) {
            return false;
        }
        if (advanceOn.buildingId && advanceOn.buildingId !== payload.buildingId) {
            return false;
        }
        if (advanceOn.nodeId && advanceOn.nodeId !== payload.nodeId) {
            return false;
        }
        if (advanceOn.statId && advanceOn.statId !== payload.statId) {
            return false;
        }
        if (advanceOn.familyId && advanceOn.familyId !== payload.familyId) {
            return false;
        }
        if (advanceOn.page && advanceOn.page !== payload.page) {
            return false;
        }
        if (advanceOn.tab && advanceOn.tab !== payload.tab) {
            return false;
        }
        if (advanceOn.regionId && advanceOn.regionId !== payload.regionId) {
            return false;
        }

        // All conditions met → advance
        return this.advance(payload);
    }

    /**
     * Get the current tutorial state view for the presentation layer.
     * @returns {import('./TutorialTypes.js').TutorialStepView | null}
     */
    getState() {
        if (!this.state.activeTutorialId) {
            return null;
        }
        const tutorial = TutorialRegistry.get(this.state.activeTutorialId);
        if (!tutorial) {
            return null;
        }
        const step = tutorial.steps[this.state.currentStepIndex];
        if (!step) {
            return null;
        }
        return {
            tutorialId: this.state.activeTutorialId,
            stepIndex: this.state.currentStepIndex,
            totalSteps: tutorial.steps.length,
            stepId: step.id,
            where: step.where || null,
            what: step.what || null,
            messages: step.messages || [],
            advanceOn: step.advanceOn || null,
            allowActions: step.allowActions || [],
            stepData: this.state.stepData
        };
    }

    /**
     * Check if a tutorial has been completed.
     * @param {string} tutorialId
     * @returns {boolean}
     */
    isCompleted(tutorialId) {
        return this.state.completedTutorialIds.includes(tutorialId);
    }

    /**
     * Get all completed tutorial IDs.
     * @returns {string[]}
     */
    getCompletedIds() {
        return [...this.state.completedTutorialIds];
    }

    /**
     * Get the raw internal state (for testing/debugging).
     * @returns {TutorialState}
     */
    getRawState() {
        return { ...this.state };
    }

    // ─── Private ───────────────────────────────────────────────────────────

    /** @param {import('./TutorialTypes.js').TutorialDefinition} tutorial */
    _checkTrigger(tutorial, gameState) {
        // Prerequisites must all be completed
        const prereqs = tutorial.prerequisites || [];
        const prereqsMet = prereqs.every(id => this.state.completedTutorialIds.includes(id));
        if (!prereqsMet) {
            return false;
        }

        const trigger = tutorial.trigger;
        if (!trigger) {
            return false;
        }

        switch (trigger.type) {
            case 'new_game':
                return gameState?.isNewGame === true;
            case 'event':
                if (gameState?.lastEvent?.type !== trigger.event) {
                    return false;
                }
                if (trigger.day !== undefined && gameState?.village?.day !== trigger.day) {
                    return false;
                }
                return true;
            case 'feature_unlocked':
                return gameState?.unlockedFeatures?.includes(trigger.feature) || false;
            case 'building_built': {
                const level = gameState?.village?.infrastructure?.[trigger.buildingId] || 0;
                return level >= (trigger.minLevel || 1);
            }
            case 'hero_level': {
                const hero = gameState?.heroes?.find(h => h.id === trigger.heroId);
                return hero && hero.level >= (trigger.minLevel || 1);
            }
            case 'tutorial_completed':
                return this.state.completedTutorialIds.includes(trigger.id);
            default:
                return false;
        }
    }

    _complete() {
        const completedId = this.state.activeTutorialId;
        if (completedId) {
            this.state.completedTutorialIds.push(completedId);
        }
        this.state.activeTutorialId = null;
        this.state.currentStepIndex = 0;
        this.state.stepData = {};
        this._save();
        this._startNextTutorial(completedId);
    }

    _startNextTutorial(completedId) {
        if (!completedId) {
            return;
        }
        const tutorial = TutorialRegistry.get(completedId);
        if (tutorial?.nextTutorialId) {
            this.start(tutorial.nextTutorialId, false, true);
        }
    }

    _clearActive() {
        this.state.activeTutorialId = null;
        this.state.currentStepIndex = 0;
        this.state.stepData = {};
    }

    _persistKey() {
        return this.slotIndex !== null
            ? `rpg_village_v1_slot${this.slotIndex}_tutorial_state`
            : 'rpg_village_v1_tutorial_state';
    }

    _load() {
        const raw = this.persistence.load(this._persistKey(), null);
        if (raw) {
            // Validate shape — guard against corrupted data
            if (typeof raw === 'object' && Array.isArray(raw.completedTutorialIds)) {
                return {
                    activeTutorialId: raw.activeTutorialId ?? null,
                    currentStepIndex: raw.currentStepIndex ?? 0,
                    completedTutorialIds: [...raw.completedTutorialIds],
                    stepData: raw.stepData ? { ...raw.stepData } : {}
                };
            }
        }
        return {
            activeTutorialId: null,
            currentStepIndex: 0,
            completedTutorialIds: [],
            stepData: {}
        };
    }

    _save() {
        this.persistence.save(this._persistKey(), { ...this.state });
    }
}
