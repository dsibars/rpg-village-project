import { getPresentationById } from '../../../../engine/shared/data/PresentationCatalog.js';

/**
 * PresentationModal — Generic multi-page narrative presentation viewer.
 *
 * Shows a full-screen overlay with image + text for each page, navigation
 * dots, skip button, and next/finish buttons. Driven by PresentationCatalog entries.
 *
 * Usage:
 *   modal.open(presentationId, (id) => { ... mark as seen ... });
 */
export class PresentationModal {
    constructor(i18n) {
        this.i18n = i18n;
        this.currentPresentation = null;
        this.currentPageIndex = 0;
        this.onComplete = null;
        this.overlay = null;
    }

    /**
     * Opens the presentation modal for a given presentation ID.
     * @param {string} presentationId - ID from PresentationCatalog
     * @param {Function} onComplete - Callback receiving (presentationId) when done
     * @param {boolean} [isReplay=false] - Whether this is a replay of an already seen presentation
     */
    open(presentationId, onComplete, isReplay = false) {
        this.onComplete = onComplete;
        this.isReplay = isReplay;
        const pres = getPresentationById(presentationId);
        if (!pres) {
            // If presentation not found, still call onComplete to avoid blocking
            onComplete?.(presentationId);
            return;
        }
        this.currentPresentation = pres;
        this.currentPageIndex = 0;
        this._render();
    }

    _render() {
        const page = this.currentPresentation.pages[this.currentPageIndex];
        const isLastPage = this.currentPageIndex >= this.currentPresentation.pages.length - 1;
        const isFirstPage = this.currentPageIndex === 0;
        const t = (key) => this.i18n?.t?.(key) ?? key;

        // Remove existing overlay if present
        if (this.overlay) {
            this.overlay.remove();
        }

        this.overlay = document.createElement('div');
        this.overlay.className = 'presentation-overlay';
        this.overlay.innerHTML = `
            <div class="presentation-modal">
                ${this.isReplay ? `<span class="presentation-replay-badge">${t('pres_ui_replay')}</span>` : ''}
                <button class="presentation-skip" id="pres-btn-skip">${t('pres_ui_skip')}</button>
                <div class="presentation-content">
                    <div class="presentation-image">
                        <img src="${page.image}" alt="" onerror="this.style.display='none'">
                    </div>
                    <div class="presentation-text">
                        <p>${t(page.textKey)}</p>
                    </div>
                </div>
                <div class="presentation-footer">
                    <button class="btn btn-secondary btn-sm presentation-back" id="pres-btn-back"
                        ${isFirstPage ? 'style="visibility: hidden;"' : ''}>
                        ${t('pres_ui_back')}
                    </button>
                    <div class="presentation-dots">
                        ${this.currentPresentation.pages.map((_, i) => `
                            <span class="presentation-dot ${i === this.currentPageIndex ? 'active' : ''}"></span>
                        `).join('')}
                    </div>
                    <button class="btn btn-primary btn-sm presentation-next" id="pres-btn-next">
                        ${isLastPage ? t('pres_ui_finish') : t('pres_ui_next')}
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(this.overlay);

        // Force reflow then add animation class
        requestAnimationFrame(() => {
            if (this.overlay) {
                this.overlay.classList.add('visible');
            }
        });

        this._bindEvents(isLastPage, isFirstPage);
    }

    _bindEvents(isLastPage, isFirstPage) {
        const nextBtn = this.overlay.querySelector('#pres-btn-next');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (isLastPage) {
                    this._finish();
                } else {
                    this.currentPageIndex++;
                    this._render();
                }
            });
        }

        const backBtn = this.overlay.querySelector('#pres-btn-back');
        if (backBtn && !isFirstPage) {
            backBtn.addEventListener('click', () => {
                this.currentPageIndex--;
                this._render();
            });
        }

        const skipBtn = this.overlay.querySelector('#pres-btn-skip');
        if (skipBtn) {
            skipBtn.addEventListener('click', () => {
                this._finish();
            });
        }
    }

    _finish() {
        const id = this.currentPresentation?.id;
        const cb = this.onComplete;
        this.close();
        if (cb) cb(id);
    }

    close() {
        const overlayToClose = this.overlay;
        if (overlayToClose) {
            overlayToClose.classList.add('closing');
            setTimeout(() => {
                overlayToClose.remove();
            }, 400);
            if (this.overlay === overlayToClose) {
                this.overlay = null;
            }
        }
        this.currentPresentation = null;
        this.onComplete = null;
    }
}
