const DEBUG = false;

/**
 * SaveSlotView - Pre-game slot selection screen.
 * Does NOT extend BaseView because it runs before the engine exists.
 */
export class SaveSlotView {
    constructor(saveSlotManager, i18n, callbacks) {
        this.manager = saveSlotManager;
        this.i18n = i18n;
        this.onSelectSlot = callbacks.onSelectSlot;
        this.onDeleteSlot = callbacks.onDeleteSlot;
    }

    t(key, params = {}) {
        return this.i18n ? this.i18n.t(key, params) : key;
    }

    render(container) {
        this.container = container;
        const slots = this.manager.listSlots();

        container.innerHTML = `
            <div class="save-slots-screen">
                <div class="save-slots-header">
                    <h1 data-i18n="ui_save_slot_title">${this.t('ui_save_slot_title')}</h1>
                    <p>RPG Village</p>
                </div>
                <div class="save-slots-grid" id="save-slots-grid">
                    ${slots.map((meta, index) => this._renderSlotCard(meta, index)).join('')}
                </div>
            </div>
        `;

        this._bindEvents();
    }

    _renderSlotCard(meta, index) {
        const summary = meta.exists ? this.manager.getSlotSummary(index) : null;
        const lastPlayed = this.manager.formatLastPlayed(meta.lastPlayedAt);

        if (!summary) {
            return `
                <div class="save-slot-card empty" data-slot-index="${index}" data-action="select">
                    <div class="slot-number">${this.t('ui_save_slot_empty')}</div>
                    <div class="slot-action">${this.t('ui_save_slot_new_game')}</div>
                </div>
            `;
        }

        return `
            <div class="save-slot-card occupied" data-slot-index="${index}" data-action="select">
                <button class="slot-delete-btn" data-slot-index="${index}" data-action="delete" title="${this.t('ui_save_slot_delete')}">🗑️</button>
                <div class="slot-header">
                    <span class="slot-number">${this.t('ui_save_slot_day', { day: summary.day })}</span>
                    <span class="slot-last-played">${lastPlayed}</span>
                </div>
                <div class="slot-summary">
                    <div class="slot-primary">${this.t('ui_save_slot_continue')}</div>
                    <div class="slot-details">
                        <span class="slot-detail"><span class="detail-icon">💰</span>${Math.floor(summary.gold || 0)}</span>
                        <span class="slot-detail"><span class="detail-icon">⚔️</span>${this.t('ui_save_slot_heroes', { count: summary.heroes.count })}</span>
                        <span class="slot-detail"><span class="detail-icon">⭐</span>${this.t('ui_save_slot_highest_level', { level: summary.heroes.highestLevel })}</span>
                        <span class="slot-detail"><span class="detail-icon">🏡</span>${summary.village.population?.total || summary.village.population || 0}</span>
                        <span class="slot-detail"><span class="detail-icon">🗺️</span>${this.t('ui_save_slot_regions', { count: summary.expeditions.regionsUnlocked })}</span>
                    </div>
                </div>
            </div>
        `;
    }

    _bindEvents() {
        const grid = this.container.querySelector('#save-slots-grid');
        if (!grid) return;

        grid.addEventListener('click', (e) => {
            const card = e.target.closest('.save-slot-card');
            if (!card) return;

            const index = parseInt(card.dataset.slotIndex, 10);

            // Check if delete button was clicked
            const deleteBtn = e.target.closest('.slot-delete-btn');
            if (deleteBtn) {
                e.stopPropagation();
                this._confirmDelete(index);
                return;
            }

            // Select slot
            if (this.onSelectSlot) {
                if (DEBUG) console.log(`SaveSlotView: Selected slot ${index}`);
                this.onSelectSlot(index);
            }
        });
    }

    _confirmDelete(index) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal-body">
                <div class="modal-header">
                    <h3>${this.t('ui_save_slot_delete')}</h3>
                </div>
                <div class="modal-text">
                    <p>${this.t('ui_save_slot_delete_confirm')}</p>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-secondary" id="modal-btn-cancel">
                        <span>${this.t('ui_btn_cancel')}</span>
                    </button>
                    <button class="btn btn-danger" id="modal-btn-confirm">
                        <span>${this.t('ui_btn_confirm')}</span>
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        const close = () => {
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.3s ease';
            setTimeout(() => overlay.remove(), 300);
        };

        overlay.querySelector('#modal-btn-cancel').addEventListener('click', close);
        overlay.querySelector('#modal-btn-confirm').addEventListener('click', () => {
            close();
            if (this.onDeleteSlot) {
                this.onDeleteSlot(index);
            }
        });
    }
}
