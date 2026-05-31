import { BaseView } from '../BaseView.js';
import { BaseModal } from '../components/modal/BaseModal.js';
import { el } from '../shared/utils/DOMUtils.js';
import { createExpeditionList } from './components/ExpeditionList.js';
import { createExpeditionTree } from './components/ExpeditionTree.js';
import { createExpeditionDetailPane } from './components/ExpeditionDetailPane.js';

export class ExploreView extends BaseView {
    constructor() {
        super('explore');
        this.selectedExpId = null;
        this.selectedRegionId = null;
        this.viewMode = localStorage.getItem('explore_view_mode') || 'tree';
    }

    onMount() {
        this.elements = {
            regionsListContainer: this.$('#regions-list-container'),
            detailContent: this.$('#expedition-detail-content'),
            statusBanner: this.$('#explore-status-banner'),
            viewToggle: this.$('#explore-view-toggle')
        };

        this.root.addEventListener('click', (e) => {
            const subviewBtn = e.target.closest('[data-subview]');
            if (subviewBtn) {
                this.ui.switchView(subviewBtn.dataset.subview);
                return;
            }
            const viewBtn = e.target.closest('[data-view-mode]');
            if (viewBtn) {
                this.setViewMode(viewBtn.dataset.viewMode);
                return;
            }
            const regionItem = e.target.closest('[data-region-id]');
            if (regionItem) {
                this.selectRegion(regionItem.dataset.regionId);
                return;
            }
        });

        // Initialize Expedition List Component (List View fallback)
        this.expeditionList = createExpeditionList({
            onSelect: (expId) => {
                this.selectedExpId = expId;
                this.ui.update(this.lastRawState);
            },
            t: this.t.bind(this)
        });

        // Initialize Expedition Tree Component (Tree View)
        this.expeditionTree = createExpeditionTree({
            onNodeClick: (node) => {
                this.handleTreeNodeClick(node);
            },
            t: this.t.bind(this)
        });

        // Initialize Detail Pane Component (for list mode inline detail)
        this.detailPane = createExpeditionDetailPane({
            onStart: ({ expId, heroIds }) => {
                this.emit('checkDefenseAdvisory', { expId, heroIds });
            },
            onRecall: ({ expId }) => {
                this.emit('retireExpedition', { expId });
            },
            t: this.t.bind(this)
        });

        this.updateViewToggle();
    }

    setViewMode(mode) {
        if (this.viewMode === mode) return;
        this.viewMode = mode;
        localStorage.setItem('explore_view_mode', mode);
        this.updateViewToggle();
        if (this.lastRawState) {
            this.onUpdate(this.lastRawState);
        }
    }

    updateViewToggle() {
        if (!this.elements.viewToggle) return;
        const listBtn = this.elements.viewToggle.querySelector('[data-view-mode="list"]');
        const treeBtn = this.elements.viewToggle.querySelector('[data-view-mode="tree"]');
        if (listBtn) listBtn.classList.toggle('active', this.viewMode === 'list');
        if (treeBtn) treeBtn.classList.toggle('active', this.viewMode === 'tree');
    }

    selectRegion(regionId) {
        if (this.selectedRegionId === regionId) return;
        this.selectedRegionId = regionId;
        this.selectedExpId = null;
        if (this.lastRawState) {
            this.onUpdate(this.lastRawState);
        }
    }

    handleTreeNodeClick(node) {
        const status = node.status || 'available';
        if (status === 'completed' || status === 'closed') {
            this.showCompletedModal(node);
            return;
        }

        const state = this.lastRawState;
        const activeExpeditions = state.activeExpeditions || [];
        const activeExp = activeExpeditions.find(e => e.id === node.id);
        const isActiveNode = !!activeExp;
        const mode = isActiveNode ? 'active' : 'available';

        // Build modal content using ExpeditionDetailPane
        let modalClose = null;
        const pane = createExpeditionDetailPane({
            onStart: ({ expId, heroIds }) => {
                this.emit('checkDefenseAdvisory', { expId, heroIds });
                if (modalClose) modalClose();
            },
            onRecall: ({ expId }) => {
                this.emit('retireExpedition', { expId });
                if (modalClose) modalClose();
            },
            t: this.t.bind(this)
        });
        pane.update({ expedition: node, mode, state });

        const modal = BaseModal.show({
            title: node.name,
            contentElement: pane.root,
            maxWidth: '520px'
        });
        modalClose = modal.close;
    }

    showCompletedModal(node) {
        const meta = node.completionMeta || {};
        const day = meta.dayCompleted || '?';
        const heroNames = meta.heroNames || [];
        const reward = meta.rewardReceived || {};
        const status = node.status === 'closed' ? 'Path Sealed' : 'Completed';
        const icon = node.status === 'closed' ? '⬡' : '✕';

        const content = `
            <div style="text-align: center; margin-bottom: 16px;">
                <div style="font-size: 2rem; margin-bottom: 8px;">${icon}</div>
                <div style="font-size: 1.2rem; font-weight: bold; color: var(--accent-color);">${node.name}</div>
                <div style="color: var(--text-muted); font-size: 0.9rem;">${status} — Day ${day}</div>
            </div>
            <div style="background: rgba(255,255,255,0.03); border-radius: var(--radius-md); padding: 12px; margin-bottom: 12px;">
                <div style="margin-bottom: 8px;"><strong>Heroes:</strong> ${heroNames.join(', ') || 'Unknown'}</div>
                <div><strong>Reward:</strong> ${reward.gold || 0} gold</div>
                ${reward.items ? `<div style="margin-top: 8px; font-size: 0.85rem; color: var(--text-muted);">${Object.entries(reward.items).map(([k, v]) => `${v} ${this.t(k)}`).join(', ')}</div>` : ''}
                ${reward.closureBonus ? `<div style="margin-top: 8px; color: #f39c12; font-weight: bold;">Closure Bonus: ${reward.closureBonus.gold}g</div>` : ''}
            </div>
            <div style="font-size: 0.8rem; color: var(--text-muted); text-align: center;">
                ${(node.stages || []).length} stages • Depth ${node.depth || 1}
            </div>
        `;

        BaseModal.show({
            title: node.name,
            contentHtml: content,
            icon,
            maxWidth: '400px'
        });
    }

    update(state) {
        this.lastRawState = state;
        if (!state.expeditions && !state.expeditionRegions) return;

        const stateString = JSON.stringify({
            expeditions: state.expeditions?.map(e => ({ id: e.id, status: e.status, stages: e.stages.length })),
            expeditionRegions: state.expeditionRegions,
            activeExpeditions: state.activeExpeditions,
            maxConcurrentExpeditions: state.maxConcurrentExpeditions,
            selectedExpId: this.selectedExpId,
            selectedRegionId: this.selectedRegionId,
            viewMode: this.viewMode,
            idleHeroes: state.heroes?.filter(h => h.activity === 'idle').map(h => ({ id: h.id, hp: h.hp }))
        });

        if (this.lastRenderedState === stateString) return;

        this.onUpdate(state);
        this.lastRenderedState = stateString;
    }

    onUpdate(state) {
        this.renderStatus(state.activeExpeditions, state.maxConcurrentExpeditions);
        this.renderRegionsList(state);
        this.renderDetailContent(state);
    }

    renderStatus(activeExpeditions, maxConcurrentExpeditions) {
        if (!this.elements.statusBanner) return;
        const count = activeExpeditions ? activeExpeditions.length : 0;
        if (count > 0) {
            this.elements.statusBanner.className = 'status-banner';
            this.elements.statusBanner.innerHTML = '';
            this.elements.statusBanner.appendChild(
                document.createTextNode(`${this.t('explore_uxelm_active_expeditions')}: ${count} / ${maxConcurrentExpeditions}`)
            );
        } else {
            this.elements.statusBanner.className = 'status-banner none';
            this.elements.statusBanner.innerHTML = '';
        }
    }

    getRegions(state) {
        if (state.expeditionRegions) {
            return Object.entries(state.expeditionRegions)
                .filter(([_, r]) => r.unlocked)
                .sort((a, b) => a[0].localeCompare(b[0]));
        }
        // Fallback: derive from expeditions (for backward compat / tests)
        const byRegion = {};
        (state.expeditions || []).forEach(exp => {
            if (!byRegion[exp.regionId]) {
                byRegion[exp.regionId] = { unlocked: true, clears: 0, availableNodes: [] };
            }
            byRegion[exp.regionId].availableNodes.push(exp);
        });
        return Object.entries(byRegion).sort((a, b) => a[0].localeCompare(b[0]));
    }

    renderRegionsList(state) {
        if (!this.elements.regionsListContainer) return;

        const regions = this.getRegions(state);
        const activeExpeditions = state.activeExpeditions || [];

        // Auto-select first region if none selected
        if (!this.selectedRegionId && regions.length > 0) {
            this.selectedRegionId = regions[0][0];
        }

        const container = this.elements.regionsListContainer;
        container.innerHTML = '';

        regions.forEach(([regionId, regionData]) => {
            const rName = this.t(regionId);
            const clears = regionData.clears || 0;
            const activeCount = activeExpeditions.filter(ae => {
                const node = (regionData.availableNodes || []).find(n => n.id === ae.id);
                return !!node;
            }).length;
            const availableCount = (regionData.availableNodes || []).filter(n => {
                const s = n.status || 'available';
                return s === 'available';
            }).length;

            const isSelected = this.selectedRegionId === regionId;
            const pathWord = availableCount === 1
                ? this.t('explore_uxelm_path_singular')
                : this.t('explore_uxelm_path_plural');

            const item = el('div', {
                class: ['region-list-item', isSelected ? 'selected' : ''],
                dataRegionId: regionId
            }, [
                el('div', { class: 'region-list-name' }, [rName]),
                el('div', { class: 'region-list-meta' }, [
                    `${clears} ${this.t('explore_uxelm_clears')} — ${availableCount} ${pathWord}`,
                    activeCount > 0 ? ` • ${activeCount} ${this.t('explore_uxelm_active')}` : ''
                ])
            ]);

            container.appendChild(item);
        });
    }

    renderDetailContent(state) {
        if (!this.elements.detailContent) return;
        const container = this.elements.detailContent;
        container.innerHTML = '';

        if (!this.selectedRegionId) {
            container.appendChild(el('div', { class: 'empty-detail' }, [
                el('div', { class: 'detail-icon-bg' }, ['🗺️']),
                el('p', {}, [this.t('explore_uxelm_select_region')])
            ]));
            return;
        }

        const regions = this.getRegions(state);
        const regionEntry = regions.find(([id]) => id === this.selectedRegionId);
        if (!regionEntry) {
            this.selectedRegionId = null;
            this.renderDetailContent(state);
            return;
        }

        const [regionId, regionData] = regionEntry;

        if (this.viewMode === 'tree') {
            // Tree mode: full tree in right panel
            this.expeditionTree.update({
                regionId,
                regionData,
                activeExpeditions: state.activeExpeditions,
                selectedId: this.selectedExpId
            });
            container.appendChild(this.expeditionTree.root);
        } else {
            // List mode: expedition cards + detail pane inline
            const regionExpeditions = (regionData.availableNodes || []).filter(n => {
                const s = n.status || 'available';
                return s === 'available' || s === 'active';
            });

            this.expeditionList.update({
                expeditions: regionExpeditions,
                selectedId: this.selectedExpId
            });
            container.appendChild(this.expeditionList.root);

            // Show detail pane below if expedition selected
            const exp = regionExpeditions.find(e => e.id === this.selectedExpId);
            if (exp) {
                const activeExpeditions = state.activeExpeditions || [];
                const activeExp = activeExpeditions.find(e => e.id === this.selectedExpId);
                const mode = activeExp ? 'active' : 'available';

                container.appendChild(this.detailPane.root);
                this.detailPane.update({
                    expedition: exp,
                    mode,
                    state
                });
            }
        }
    }
}
