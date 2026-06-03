import { ExpeditionResultModal } from './ExpeditionResultModal.js';

/**
 * PostDaySequencer - Manages the priority order of all post-day messages.
 *
 * Priority (highest to lowest):
 * 1. Chapter presentation messages (placeholder for future)
 * 2. Expedition result messages
 * 3. Daily report (always last)
 *
 * Each step blocks until the player dismisses it.
 */
export class PostDaySequencer {
    constructor(ui, engine) {
        this.ui = ui;
        this.engine = engine;
        this.expeditionModal = new ExpeditionResultModal({
            t: (key, params) => engine.i18n.t(key, params)
        });
    }

    /**
     * Runs the full post-day sequence.
     * @param {Object} report - The daily report from engine.nextDay()
     */
    run(report) {
        this.report = report;
        this._runStepChapterMessages();
    }

    // ─── Step 1: Chapter Presentation Messages ───
    // Drains the PresentationService's pending queue. Each presentation is
    // shown one at a time. When dismissed, the next one is shown. Only after
    // all presentations have been shown does it proceed to expedition messages.
    _runStepChapterMessages() {
        const presentationService = this.engine.presentationService;
        if (!presentationService || !presentationService.hasPendingPresentations()) {
            this._runStepExpeditionMessages();
            return;
        }

        this._showNextPresentation();
    }

    _showNextPresentation() {
        const presentationService = this.engine.presentationService;
        const nextId = presentationService.popNextPresentation();

        if (!nextId) {
            // No more pending — proceed to expedition messages
            this._runStepExpeditionMessages();
            return;
        }

        const currentDay = this.engine.villageService?.getState()?.day ?? null;

        this.ui.presentationModal.open(nextId, (completedId) => {
            // Mark as seen and persist
            presentationService.markAsSeen(completedId, currentDay);
            this.engine._persistPresentationState();

            // Check for more pending presentations
            if (presentationService.hasPendingPresentations()) {
                this._showNextPresentation();
            } else {
                this._runStepExpeditionMessages();
            }
        });
    }

    // ─── Step 2: Expedition Result Messages ───
    // Shows expedition completion/failure/progress as standalone messages
    // before the daily report. If multiple expeditions had events, they are
    // shown in the order they were processed.
    _runStepExpeditionMessages() {
        const expedition = this.report?.expedition;

        // Battle-related expeditions are handled by CombatView directly
        // and bypass this message step
        if (expedition && expedition.status !== 'battle_started' && !expedition.combatLog) {
            this.expeditionModal.show(expedition, () => {
                this._runStepUnlockNarratives();
            });
            return;
        }

        // No expedition message — skip to unlock narratives
        this._runStepUnlockNarratives();
    }

    // ─── Step 3: Unlock Narratives ───
    // Non-blocking toasts that play while the daily report is being prepared.
    // These are lowest priority because they are ambient discovery moments.
    _runStepUnlockNarratives() {
        const narratives = this.report?.newNarratives || [];
        if (narratives.length > 0) {
            this.ui.unlockNarrativeView.showNarratives(narratives);
        }

        // Always proceed to daily report
        this._runStepDailyReport();
    }

    // ─── Step 4: Daily Report ───
    // Always last. This is the summary of everything that happened today.
    _runStepDailyReport() {
        this.ui.forceUpdate();
    }
}
