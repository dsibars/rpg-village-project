import { BaseView } from '../BaseView.js';
import { createExpeditionList } from './components/ExpeditionList.js';
import { createExpeditionDetailPane } from './components/ExpeditionDetailPane.js';

export class ExploreView extends BaseView {
    constructor() {
        super('explore');
        this.selectedExpId = null;
    }

    onMount() {
        this.elements = {
            listContainer: this.$('#regions-list-container'),
            detailContent: this.$('#expedition-detail-content'),
            statusBanner: this.$('#explore-status-banner')
        };

        this.root.addEventListener('click', (e) => {
            const subviewBtn = e.target.closest('[data-subview]');
            if (subviewBtn) {
                this.ui.switchView(subviewBtn.dataset.subview);
                return;
            }
        });

        // Initialize Expedition List Component
        this.expeditionList = createExpeditionList({
            onSelect: (expId) => {
                this.selectedExpId = expId;
                this.ui.update(this.lastRawState);
            },
            t: this.t.bind(this)
        });

        if (this.elements.listContainer) {
            this.elements.listContainer.innerHTML = '';
            this.elements.listContainer.appendChild(this.expeditionList.root);
        }

        // Initialize Detail Pane Component
        this.detailPane = createExpeditionDetailPane({
            onStart: ({ expId, heroIds }) => {
                this.emit('checkDefenseAdvisory', { expId, heroIds });
            },
            onRecall: ({ expId }) => {
                this.emit('retireExpedition', { expId });
            },
            t: this.t.bind(this)
        });

        if (this.elements.detailContent) {
            this.elements.detailContent.innerHTML = '';
            this.elements.detailContent.appendChild(this.detailPane.root);
        }
    }

    update(state) {
        this.lastRawState = state;
        if (!state.expeditions) return;

        const stateString = JSON.stringify({
            expeditions: state.expeditions.map(e => ({ id: e.id, status: e.status, stages: e.stages.length })),
            activeExpeditions: state.activeExpeditions,
            maxConcurrentExpeditions: state.maxConcurrentExpeditions,
            selectedExpId: this.selectedExpId,
            idleHeroes: state.heroes?.filter(h => h.activity === 'idle').map(h => ({ id: h.id, hp: h.hp }))
        });

        if (this.lastRenderedState === stateString) return;

        this.onUpdate(state);
        this.lastRenderedState = stateString;
    }

    onUpdate(state) {
        this.renderStatus(state.activeExpeditions, state.maxConcurrentExpeditions);
        this.renderRegionsList(state.expeditions);
        this.renderExpeditionDetail(state);
    }

    renderStatus(activeExpeditions, maxConcurrentExpeditions) {
        if (!this.elements.statusBanner) return;
        const count = activeExpeditions ? activeExpeditions.length : 0;
        if (count > 0) {
            this.elements.statusBanner.className = 'status-banner';
            this.elements.statusBanner.innerHTML = '';
            this.elements.statusBanner.appendChild(
                document.createTextNode(`${this.t('ui_active_expeditions') || 'Active Expeditions'}: ${count} / ${maxConcurrentExpeditions}`)
            );
        } else {
            this.elements.statusBanner.className = 'status-banner none';
            this.elements.statusBanner.innerHTML = '';
        }
    }

    renderRegionsList(expeditions) {
        if (!this.expeditionList) return;
        this.expeditionList.update({ expeditions, selectedId: this.selectedExpId });
    }

    renderExpeditionDetail(state) {
        if (!this.detailPane) return;

        const exp = state.expeditions.find(e => e.id === this.selectedExpId);
        const activeExpeditions = state.activeExpeditions || [];
        const activeExp = activeExpeditions.find(e => e.id === this.selectedExpId);
        const isActiveNode = !!activeExp;

        if (!exp && activeExpeditions.length > 0) {
            this.selectedExpId = activeExpeditions[0].id;
            return this.update(this.lastRawState);
        }

        const mode = isActiveNode ? 'active' : 'available';

        this.detailPane.update({
            expedition: exp || null,
            mode,
            state
        });
    }
}
