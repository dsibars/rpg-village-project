import { BaseView } from '../BaseView.js';
import { PRESENTATION_CATALOG } from '../../../engine/shared/data/PresentationCatalog.js';
import { UNLOCK_NARRATIVES } from '../../../engine/shared/data/UnlockNarratives.js';

export class ChronicleView extends BaseView {
    constructor(arg1, arg2, arg3, arg4) {
        super('chronicle');
        
        if (arg1 && (arg1.nodeType === 1 || typeof arg1.appendChild === 'function')) {
            // Signature A (Test context)
            this.container = arg1;
            this.root = arg1;
            this.engine = arg2;
            this.i18n = arg3;
            this.presentationModal = arg4;
        } else {
            // Signature B (Application context)
            this.engine = arg1;
            this.i18n = arg2;
            this.presentationModal = arg3;
        }

        this.chapterExpanded = {
            1: true,
            2: true
        };
    }

    mount(container, uiReference) {
        this.container = container;
        super.mount(container, uiReference);
    }

    onMount() {
        if (!this.i18n && this.ui && this.ui.i18n) {
            this.i18n = this.ui.i18n;
        }
        if (!this.presentationModal && this.ui && this.ui.presentationModal) {
            this.presentationModal = this.ui.presentationModal;
        }
        this.render();
    }

    update(state) {
        if (!state) return;
        
        const presentationState = this.engine.presentationService.getState();
        const stateString = JSON.stringify(presentationState);

        if (this.lastRenderedState === stateString) {
            return;
        }

        this.lastRenderedState = stateString;
        this.render();
    }

    t(key, params = {}) {
        if (this.i18n) {
            return this.i18n.t(key, params);
        }
        return key;
    }

    _getChapterProgress(chapterNum) {
        const milestones = PRESENTATION_CATALOG.filter(
            p => p.chapter === chapterNum && p.trigger.type !== 'chapter_milestones'
        );
        const seen = milestones.filter(p => this.engine.presentationService.isSeen(p.id)).length;
        return { seen, total: milestones.length };
    }

    _getMilestoneStatus(presentation) {
        if (this.engine.presentationService.isSeen(presentation.id)) {
            return 'seen';
        }
        const pending = this.engine.presentationService.state?.pendingPresentations || [];
        if (pending.includes(presentation.id)) {
            return 'pending';
        }
        return 'locked';
    }

    _getRecentlyUnlocked(limit = 3) {
        const seenList = this.engine.presentationService.state?.seenPresentations || [];
        return seenList
            .filter(entry => entry.daySeen !== null)
            .sort((a, b) => b.daySeen - a.daySeen)
            .slice(0, limit)
            .map(entry => {
                return {
                    id: entry.id,
                    title: this.t(entry.id),
                    daySeen: entry.daySeen
                };
            });
    }

    _getTriggerHint(presentation) {
        const trigger = presentation.trigger;
        if (!trigger) return '';
        const prefix = this.t('chronicle_hint_prefix');
        
        let text = '';
        switch (trigger.type) {
            case 'new_game':
                text = this.t('chronicle_hint_newgame');
                break;
            case 'building_complete': {
                const bldKey = `village_info_building_${trigger.buildingId}`;
                const bldName = this.t(bldKey) !== bldKey ? this.t(bldKey) : 
                                trigger.buildingId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                text = this.t('chronicle_hint_building', { building: bldName, level: trigger.level });
                break;
            }
            case 'mission_complete': {
                const cleanId = trigger.missionId.replace(/^exp_/, '');
                const possibleKey = `nar_${cleanId}_title`;
                const missionName = this.t(possibleKey) !== possibleKey ? this.t(possibleKey) : 
                                    (trigger.missionId === 'exp_rescue_mission' ? 'The Captured Guard' : 
                                     trigger.missionId.replace(/^exp_/, '').split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
                text = this.t('chronicle_hint_mission', { mission: missionName });
                break;
            }
            case 'hero_recruited': {
                const originKey = `heroes_info_origin_${trigger.origin.replace(/^origin_/, '')}`;
                const originName = this.t(originKey) !== originKey ? this.t(originKey) : 
                                   trigger.origin.replace(/^origin_/, '').split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                text = this.t('chronicle_hint_hero', { origin: originName });
                break;
            }
            case 'first_event':
                text = this.t('chronicle_hint_event');
                break;
            case 'chapter_milestones':
                text = this.t('chronicle_hint_finale', { chapter: trigger.chapter });
                break;
            default:
                text = this.t('chronicle_hint_event');
        }
        return `${prefix} ${text}`;
    }

    render() {
        const target = this.container || this.root;
        if (!target) return;

        // Initialize template content if empty (helpful for unit tests)
        if (!target.querySelector('.chronicle-two-pane')) {
            target.innerHTML = `
                <div class="category-sub-nav">
                    <button class="sub-nav-tab" data-subview="explore" data-i18n="shared_uxelm_nav_explore">${this.t('shared_uxelm_nav_explore')}</button>
                    <button class="sub-nav-tab" data-subview="bestiary" data-i18n="shared_uxelm_nav_bestiary">${this.t('shared_uxelm_nav_bestiary')}</button>
                    <button class="sub-nav-tab" data-subview="codex" data-i18n="shared_uxelm_nav_codex">${this.t('shared_uxelm_nav_codex')}</button>
                    <button class="sub-nav-tab active" data-subview="chronicle" data-i18n="nav_chronicle">${this.t('nav_chronicle')}</button>
                </div>
                <div class="view-header">
                    <h2 data-i18n="chronicle_title">${this.t('chronicle_title')}</h2>
                </div>
                <div id="chronicle-recently-unlocked" class="recently-unlocked-section card" style="display: none; margin-bottom: 20px;">
                    <h3 data-i18n="chronicle_recently_unlocked">${this.t('chronicle_recently_unlocked')}</h3>
                    <div id="recently-unlocked-container" class="recently-unlocked-list"></div>
                </div>
                <div class="chronicle-two-pane">
                    <div class="chronicle-main-pane">
                        <div id="chronicle-list-container" class="chronicle-list-container"></div>
                    </div>
                    <div class="chronicle-discovery-pane">
                        <div id="discovery-log-container"></div>
                    </div>
                </div>
            `;
        }

        // Render Recently Unlocked
        const recentList = this._getRecentlyUnlocked(3);
        const recentSection = target.querySelector('#chronicle-recently-unlocked');
        const recentContainer = target.querySelector('#recently-unlocked-container');
        
        if (recentSection && recentContainer) {
            if (recentList.length > 0) {
                recentSection.style.display = 'block';
                recentContainer.innerHTML = recentList.map(item => `
                    <div class="recent-milestone-card">
                        <div class="recent-info">
                            <span class="recent-title">${item.title}</span>
                            <span class="recent-day">${this.t('chronicle_day_prefix')} ${item.daySeen}</span>
                        </div>
                        <button class="btn btn-secondary btn-sm btn-replay" data-presentation-id="${item.id}" title="${this.t('chronicle_replay')}">
                            <span class="icon">📖</span>
                        </button>
                    </div>
                `).join('');
            } else {
                recentSection.style.display = 'none';
                recentContainer.innerHTML = '';
            }
        }

        // Render left pane — chapter sections
        const listContainer = target.querySelector('#chronicle-list-container');
        if (listContainer) {
            listContainer.innerHTML = this._renderChapterSections();
        }

        // Render right pane — discovery log
        const discoveryContainer = target.querySelector('#discovery-log-container');
        if (discoveryContainer) {
            discoveryContainer.innerHTML = this._renderDiscoveryLog();
        }

        // Add event listeners for collapsibles
        const chapterHeaders = target.querySelectorAll('.chapter-header');
        chapterHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const chapterId = parseInt(header.getAttribute('data-chapter'), 10);
                this.chapterExpanded[chapterId] = !this.chapterExpanded[chapterId];
                
                header.classList.toggle('collapsed', !this.chapterExpanded[chapterId]);
                
                const content = header.nextElementSibling;
                if (content && content.classList.contains('chapter-content')) {
                    content.style.display = this.chapterExpanded[chapterId] ? 'flex' : 'none';
                }
            });
        });

        // Add event listeners for replay buttons
        const replayButtons = target.querySelectorAll('.btn-replay');
        replayButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const presId = btn.getAttribute('data-presentation-id');
                if (presId && this.presentationModal) {
                    this.presentationModal.open(presId, null, true);
                }
            });
        });

        // Add event listeners for discovery rows
        const discoveryRows = target.querySelectorAll('.discovery-row');
        discoveryRows.forEach(row => {
            row.addEventListener('click', () => {
                const id = row.getAttribute('data-narrative-id');
                this._openDiscoveryReplay(id);
            });
        });

        // Add event listeners for sub-nav tabs click (routing)
        const subNavTabs = target.querySelectorAll('.sub-nav-tab[data-subview]');
        subNavTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const subview = tab.getAttribute('data-subview');
                if (subview && this.ui) {
                    this.ui.switchView(subview);
                }
            });
        });
    }

    _renderChapterSections() {
        const chapters = [1, 2];
        return chapters.map(chapterId => {
            const progress = this._getChapterProgress(chapterId);
            const isCollapsed = !this.chapterExpanded[chapterId];
            
            // Get all milestones for this chapter
            const chapterMilestones = PRESENTATION_CATALOG.filter(p => p.chapter === chapterId);
            
            // Generate milestones HTML
            const milestonesHtml = chapterMilestones.map(pres => {
                const status = this._getMilestoneStatus(pres);
                const isSeen = status === 'seen';
                const isPending = status === 'pending';
                const isLocked = status === 'locked';
                
                let title = '???';
                let dayHtml = '';
                let detailsHtml = '';
                let actionsHtml = '';
                let rowClass = 'state-locked';
                let badgeHtml = `<span class="milestone-badge badge-locked">${this.t('chronicle_locked')}</span>`;

                if (isSeen) {
                    title = this.t(pres.id);
                    rowClass = 'state-seen';
                    badgeHtml = `<span class="milestone-badge badge-seen">${this.t('chronicle_seen')}</span>`;
                    
                    const day = this.engine.presentationService.getDaySeen(pres.id);
                    dayHtml = `<span class="milestone-day">${this.t('chronicle_day_prefix')} ${day !== null ? day : this.t('chronicle_day_unknown')}</span>`;
                    
                    const firstPageKey = pres.pages[0]?.textKey;
                    const excerpt = firstPageKey ? this.t(firstPageKey) : '';
                    detailsHtml = `<div class="milestone-excerpt" title="${excerpt}">${excerpt}</div>`;
                    
                    actionsHtml = `
                        <button class="btn btn-secondary btn-sm btn-replay" data-presentation-id="${pres.id}">
                            <span class="icon">📖</span> <span>${this.t('chronicle_replay')}</span>
                        </button>
                    `;
                } else if (isPending) {
                    title = this.t(pres.id);
                    rowClass = 'state-pending';
                    badgeHtml = `<span class="milestone-badge badge-pending">${this.t('chronicle_pending')}</span>`;
                    
                    dayHtml = `<span class="milestone-day">${this.t('chronicle_pending_hint')}</span>`;
                    detailsHtml = `<div class="milestone-excerpt">${this.t('chronicle_pending_hint')}</div>`;
                    
                    actionsHtml = `
                        <button class="btn btn-secondary btn-sm btn-replay" data-presentation-id="${pres.id}">
                            <span class="icon">📖</span> <span>${this.t('chronicle_replay')}</span>
                        </button>
                    `;
                } else {
                    // Locked
                    const hint = this._getTriggerHint(pres);
                    detailsHtml = `<div class="milestone-trigger-hint"><span class="hint-label">${this.t('chronicle_hint_prefix')}</span> ${hint.replace(this.t('chronicle_hint_prefix') + ' ', '')}</div>`;
                }

                return `
                    <div class="milestone-row ${rowClass}" data-presentation-id="${pres.id}">
                        <div class="milestone-main-info">
                            <div class="milestone-header-line">
                                <span class="milestone-title">${title}</span>
                                ${badgeHtml}
                                ${dayHtml}
                            </div>
                            ${detailsHtml}
                        </div>
                        <div class="milestone-actions">
                            ${actionsHtml}
                        </div>
                    </div>
                `;
            }).join('');

            const chapterTitle = this.t(`chronicle_chapter_${chapterId}_title`);

            return `
                <div class="chronicle-chapter-group" data-chapter="${chapterId}">
                    <div class="chapter-header ${isCollapsed ? 'collapsed' : ''}" data-chapter="${chapterId}">
                        <div class="chapter-header-left">
                            <span class="chapter-toggle-icon">▼</span>
                            <span class="chapter-title-text">${chapterTitle}</span>
                        </div>
                        <span class="chapter-progress-badge">${progress.seen} / ${progress.total}</span>
                    </div>
                    <div class="chapter-content" style="display: ${isCollapsed ? 'none' : 'flex'};">
                        ${milestonesHtml}
                    </div>
                </div>
            `;
        }).join('');
    }

    _renderDiscoveryLog() {
        const shown = this.engine.unlockService?.getShownNarratives() || [];
        
        // Sort by daySeen desc (most recent first). Null daySeen sorts to bottom.
        const sorted = [...shown].sort((a, b) => {
            if (a.daySeen === null && b.daySeen === null) return 0;
            if (a.daySeen === null) return 1;
            if (b.daySeen === null) return -1;
            return b.daySeen - a.daySeen;
        });
        
        const totalNarratives = UNLOCK_NARRATIVES.length;
        const foundCount = shown.length;
        
        const rows = sorted.map(entry => {
            const narrative = UNLOCK_NARRATIVES.find(n => n.id === entry.id);
            if (!narrative) return '';
            const title = this.t(narrative.titleKey);
            const day = entry.daySeen !== null ? `${this.t('chronicle_day_prefix')} ${entry.daySeen}` : '';
            return `
                <div class="discovery-row" data-narrative-id="${entry.id}">
                    <span class="discovery-title">${title}</span>
                    <span class="discovery-day">${day}</span>
                </div>
            `;
        }).join('');
        
        const emptyMessage = foundCount === 0
            ? `<div class="discovery-empty">${this.t('chronicle_discovery_empty')}</div>`
            : '';
        
        return `
            <div class="discovery-header">
                <h3>${this.t('chronicle_discovery_title')}</h3>
                <span class="discovery-count">${foundCount} / ${totalNarratives}</span>
            </div>
            <div class="discovery-list">
                ${rows}
                ${emptyMessage}
            </div>
        `;
    }

    _openDiscoveryReplay(narrativeId) {
        const narrative = UNLOCK_NARRATIVES.find(n => n.id === narrativeId);
        if (!narrative) return;

        const title = this.t(narrative.titleKey);
        const lore = this.t(narrative.loreKey);

        // Create or reuse a lightweight modal overlay
        let modal = document.getElementById('discovery-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'discovery-modal';
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content discovery-modal-content">
                    <div class="modal-header">
                        <h3 class="discovery-modal-title"></h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body discovery-modal-body">
                        <p class="discovery-modal-lore"></p>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            modal.querySelector('.modal-close').addEventListener('click', () => {
                modal.classList.remove('active');
            });
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.classList.remove('active');
            });
        }

        modal.querySelector('.discovery-modal-title').textContent = title;
        modal.querySelector('.discovery-modal-lore').textContent = lore;
        modal.classList.add('active');
    }
}
