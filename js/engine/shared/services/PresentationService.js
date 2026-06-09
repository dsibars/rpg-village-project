import { PRESENTATION_CATALOG, getPresentationById } from '../data/PresentationCatalog.js';

/**
 * PresentationService — Manages multi-page narrative presentations.
 *
 * Responsibilities:
 * - Evaluate trigger events against the catalog
 * - Queue pending presentations for display
 * - Track which presentations have been seen (permanently)
 * - Provide replay access to previously-seen presentations
 *
 * State shape:
 *   {
 *     seenPresentations: { id: string, daySeen: number | null }[],
 *     pendingPresentations: string[]
 *   }
 */
export class PresentationService {
    constructor(state = null) {
        this.state = state || this._getDefaultState();
    }

    _getDefaultState() {
        return {
            seenPresentations: [],      // { id: string, daySeen: number }[]
            pendingPresentations: []     // string[]
        };
    }

    // --- Trigger Evaluation ---

    checkTriggers(triggerEvent) {
        const newlyTriggered = [];
        for (const pres of PRESENTATION_CATALOG) {
            if (this._isSeen(pres.id)) continue;
            if (this.state.pendingPresentations.includes(pres.id)) continue;
            if (this._evaluateTrigger(pres.trigger, triggerEvent)) {
                newlyTriggered.push(pres.id);
            }
        }
        if (newlyTriggered.length > 0) {
            this.state.pendingPresentations.push(...newlyTriggered);
        }
        return newlyTriggered;
    }

    _evaluateTrigger(trigger, event) {
        if (trigger.type !== event.type) return false;
        switch (trigger.type) {
            case 'new_game':
                return true;
            case 'building_complete':
                return event.buildingId === trigger.buildingId && event.level >= trigger.level;
            case 'mission_complete':
                return event.missionId === trigger.missionId;
            case 'hero_recruited':
                return event.origin === trigger.origin || event.heroName === trigger.heroName;
            case 'first_event':
                return event.eventId === trigger.eventId;
            case 'chapter_milestones':
                // Only finale presentations use chapter_milestones. This is the ONLY
                // trigger type that checks chapter alignment — all other triggers fire
                // regardless of what "chapter" the player is currently experiencing.
                return event.chapter === trigger.chapter && event.met >= trigger.required;
            default:
                return false;
        }
    }

    // --- Queue Management ---

    hasPendingPresentations() {
        return this.state.pendingPresentations.length > 0;
    }

    peekNextPresentation() {
        return this.state.pendingPresentations[0] || null;
    }

    popNextPresentation() {
        return this.state.pendingPresentations.shift() || null;
    }

    // --- State Tracking ---

    markAsSeen(presentationId, currentDay = null) {
        if (!this._isSeen(presentationId)) {
            this.state.seenPresentations.push({
                id: presentationId,
                daySeen: currentDay ?? null
            });
        }
        // Also remove from pending if somehow still there
        this.state.pendingPresentations = this.state.pendingPresentations.filter(
            id => id !== presentationId
        );
    }

    isSeen(presentationId) {
        return this._isSeen(presentationId);
    }

    _isSeen(presentationId) {
        return this.state.seenPresentations.some(entry => entry.id === presentationId);
    }

    getDaySeen(presentationId) {
        const entry = this.state.seenPresentations.find(e => e.id === presentationId);
        return entry?.daySeen ?? null;
    }

    // --- Replay ---

    replayPresentation(presentationId) {
        // Replay does not modify state. It simply returns the presentation
        // data so a UI view can open it for re-viewing.
        const pres = getPresentationById(presentationId);
        if (!pres) return false;
        return pres;
    }

    // --- Persistence ---

    getState() {
        return { ...this.state };
    }

    setState(state) {
        this.state = {
            seenPresentations: state?.seenPresentations || [],
            pendingPresentations: state?.pendingPresentations || []
        };
    }
}
