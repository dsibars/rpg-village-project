import { BaseView } from '../BaseView.js';
import { VillageCanvas } from './components/VillageCanvas.js';
import { LaborPool } from './components/LaborPool.js';
import { ConstructionQueue } from './components/ConstructionQueue.js';
import { DailyObjectives } from './components/DailyObjectives.js';
import { VillageCalendar } from './components/VillageCalendar.js';
import { VillageDefense } from './components/VillageDefense.js';
import { DailyReportModal } from './components/DailyReportModal.js';

/**
 * VillageView - Manages the main village dashboard.
 */
export class VillageView extends BaseView {
    constructor() {
        super('village');
        this.dismissedReportDay = null;
        this.lastReportState = null;
    }

    onMount() {
        this.elements = {
            storageText: this.$('#village-storage-text'),
            storageBar: this.$('#village-storage-bar'),
            constructionList: this.$('#construction-list'),
            objectivesList: this.$('#daily-objectives-list'),
            roleControls: this.$('#role-controls'),
            calendarSeasonIcon: this.$('#calendar-season-icon'),
            calendarSeasonLabel: this.$('#calendar-season-label'),
            calendarDayOfSeason: this.$('#calendar-day-of-season'),
            calendarEventsList: this.$('#calendar-events-list'),
            defenseCount: this.$('#defense-count'),
            defenseAssignmentsList: this.$('#defense-assignments-list'),
            
            // New UI Elements
            townhallLevel: this.$('#village-townhall-level'),
            laborPoolStatus: this.$('#labor-pool-status'),
            btnRecallReport: this.$('#btn-recall-report'),
            dailyReportContainer: this.$('#daily-report-container')
        };

        // Initialize subcomponents
        this.villageCanvas = new VillageCanvas({ t: this.t.bind(this) });
        const canvasContainer = this.$('#village-canvas-container');
        if (canvasContainer) {
            canvasContainer.innerHTML = '';
            canvasContainer.appendChild(this.villageCanvas.root);
        }

        this.laborPool = new LaborPool({ t: this.t.bind(this) });
        if (this.elements.roleControls) {
            this.elements.roleControls.innerHTML = '';
            this.elements.roleControls.appendChild(this.laborPool.root);
        }

        this.constructionQueue = new ConstructionQueue({
            t: this.t.bind(this),
            container: this.elements.constructionList
        });

        this.dailyObjectives = new DailyObjectives({
            t: this.t.bind(this),
            container: this.elements.objectivesList
        });

        this.villageCalendar = new VillageCalendar({
            t: this.t.bind(this),
            seasonIcon: this.elements.calendarSeasonIcon,
            seasonLabel: this.elements.calendarSeasonLabel,
            dayLabel: this.elements.calendarDayOfSeason,
            eventsContainer: this.elements.calendarEventsList
        });

        this.villageDefense = new VillageDefense({
            t: this.t.bind(this),
            countEl: this.elements.defenseCount,
            assignmentsContainer: this.elements.defenseAssignmentsList
        });

        this.dailyReportModal = new DailyReportModal({
            t: this.t.bind(this),
            container: this.elements.dailyReportContainer,
            onAcknowledge: () => {
                if (this.lastReportState) {
                    this.dismissedReportDay = this.lastReportState.day;
                    this.updateDailyReportVisibility(this.lastReportState);
                }
            }
        });

        // Sub-view navigation (Village / Buildings)
        this.root.addEventListener('click', (e) => {
            const subviewBtn = e.target.closest('[data-subview]');
            if (subviewBtn) {
                this.ui.switchView(subviewBtn.dataset.subview);
                return;
            }
        });

        const roleControls = this.$('#role-controls');
        if (roleControls) {
            roleControls.addEventListener('click', (e) => {
                const btn = e.target.closest('[data-role-action]');
                if (!btn) return;
                const role = btn.dataset.role;
                const action = btn.dataset.roleAction;
                if (action === 'inc') {
                    this.emit('setWorkerRole', { role, delta: 1 });
                } else if (action === 'dec') {
                    this.emit('setWorkerRole', { role, delta: -1 });
                }
            });
        }

        const defenseList = this.$('#defense-assignments-list');
        if (defenseList) {
            defenseList.addEventListener('click', (e) => {
                const btn = e.target.closest('[data-defense-action]');
                if (!btn) return;
                const action = btn.dataset.defenseAction;
                const heroId = btn.dataset.heroId;
                if (action === 'unassign') {
                    this.emit('unassignDefense', { heroId });
                } else if (action === 'assign') {
                    this.emit('assignDefense', { heroId });
                }
            });
        }

        // Listen for Daily Report dismiss and recall actions
        this.root.addEventListener('click', (e) => {
            const dismissBtn = e.target.closest('[data-action="dismiss-report"]');
            if (dismissBtn) {
                if (this.lastReportState) {
                    this.dismissedReportDay = this.lastReportState.day;
                    this.updateDailyReportVisibility(this.lastReportState);
                }
                return;
            }

            const recallBtn = e.target.closest('#btn-recall-report');
            if (recallBtn) {
                this.dismissedReportDay = null;
                if (this.lastReportState) {
                    this.updateDailyReportVisibility(this.lastReportState);
                }
                return;
            }
        });
    }

    onUpdate(state) {
        const { village, inventory } = state;
        if (!village) return;

        // Town Hall level update
        if (this.elements.townhallLevel && village.infrastructure) {
            this.elements.townhallLevel.textContent = village.infrastructure.townhall || 1;
        }

        // Storage Updates
        if (inventory && this.elements.storageText) {
            const used = inventory.totalUsed || 0;
            const max = village.maxStorage || 100;
            this.elements.storageText.textContent = `${used} / ${max}`;
            
            if (this.elements.storageBar) {
                const percent = Math.min(100, (used / max) * 100);
                this.elements.storageBar.style.width = `${percent}%`;
                this.elements.storageBar.classList.toggle('warning', percent > 75);
                this.elements.storageBar.classList.toggle('danger', percent > 90);
            }
        }

        // Store last report state for overlay actions
        this.lastReportState = village.lastDailyReport;

        // Render Canvas Visuals
        this.villageCanvas.update(village);

        // Worker Roles
        const { available, total } = this.laborPool.update(village.population);
        if (this.elements.laborPoolStatus) {
            this.elements.laborPoolStatus.textContent = ` (${available} ${this.t('ui_available') || 'Available'} / ${total} ${this.t('ui_total') || 'Total'})`;
        }

        // Construction Queue
        this.constructionQueue.update(village.constructionQueue);

        // Daily Objectives
        this.dailyObjectives.update(state.dailyObjectives);

        // Calendar & Defense
        this.villageCalendar.update(state.calendar);
        this.villageDefense.update(state.calendar, state.heroes);

        // Daily Report (Modal Overlay)
        this.updateDailyReportVisibility(village.lastDailyReport);
    }

    updateDailyReportVisibility(report) {
        const recallBtn = this.elements.btnRecallReport || this.$('#btn-recall-report');
        this.dailyReportModal.update(report, this.dismissedReportDay);

        if (report && this.dismissedReportDay === report.day) {
            if (recallBtn) recallBtn.style.display = 'inline-flex';
        } else {
            if (recallBtn) recallBtn.style.display = 'none';
        }
    }
}
