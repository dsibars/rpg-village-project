/**
 * UnlockNarrativeView - Pure rendering component for narrative unlock toasts.
 * Reads engine state and displays auto-dismiss narrative overlays.
 * No business logic. No state mutation. Only rendering.
 */

import { UNLOCK_NARRATIVES } from '../../../engine/shared/data/UnlockNarratives.js';

const DISMISS_DELAY_MS = 8000;

export class UnlockNarrativeView {
    constructor(i18n) {
        this.i18n = i18n;
        this.queue = [];
        this.isShowing = false;
        this.currentOverlay = null;
        this.dismissTimer = null;
    }

    /**
     * Queues narrative IDs for display. Shows immediately if nothing is active.
     * @param {string[]} narrativeIds — array of narrative IDs from engine
     */
    showNarratives(narrativeIds) {
        if (!narrativeIds || narrativeIds.length === 0) return;

        for (const id of narrativeIds) {
            if (!this.queue.includes(id)) {
                this.queue.push(id);
            }
        }

        if (!this.isShowing) {
            this._showNext();
        }
    }

    _showNext() {
        if (this.queue.length === 0) {
            this.isShowing = false;
            return;
        }

        this.isShowing = true;
        const id = this.queue.shift();
        const narrative = UNLOCK_NARRATIVES.find(n => n.id === id);
        if (!narrative) {
            this._showNext();
            return;
        }

        this._render(narrative);
    }

    _render(narrative) {
        this._dismissCurrent();

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay unlock-narrative-overlay';
        overlay.style.zIndex = '10000';
        document.body.appendChild(overlay);
        this.currentOverlay = overlay;

        const title = this.i18n.t(narrative.titleKey);
        const lore = this.i18n.t(narrative.loreKey);

        overlay.innerHTML = `
            <div class="intro-modal unlock-narrative-modal">
                <div class="unlock-narrative-header">
                    <span class="unlock-narrative-era">Era ${narrative.era}</span>
                    <h2>${title}</h2>
                </div>
                <div class="unlock-narrative-body">
                    <p>${lore}</p>
                </div>
                <div class="unlock-narrative-footer">
                    <span class="unlock-narrative-hint">Click to dismiss</span>
                </div>
            </div>
        `;

        // Click to dismiss
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay || e.target.closest('.unlock-narrative-modal')) {
                this._dismissCurrent();
            }
        });

        // Auto-dismiss
        this.dismissTimer = setTimeout(() => {
            this._dismissCurrent();
        }, DISMISS_DELAY_MS);
    }

    _dismissCurrent() {
        if (this.dismissTimer) {
            clearTimeout(this.dismissTimer);
            this.dismissTimer = null;
        }

        if (this.currentOverlay) {
            const overlay = this.currentOverlay;
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.4s ease';
            setTimeout(() => {
                overlay.remove();
                if (this.currentOverlay === overlay) {
                    this.currentOverlay = null;
                }
                this._showNext();
            }, 400);
        }
    }

    /**
     * Clears any pending queue and dismisses the current toast.
     * Call this before view transitions to avoid orphaned overlays.
     */
    clear() {
        this.queue = [];
        this._dismissCurrent();
    }
}
