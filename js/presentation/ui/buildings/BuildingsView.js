import { BaseView } from '../BaseView.js';
import { createBuildingList } from './components/BuildingList.js';
import { createBuildingDetailPane } from './components/BuildingDetailPane.js';

export class BuildingsView extends BaseView {
    constructor() {
        super('village'); // Buildings data is part of the village domain state
        this.selectedBuildingId = null;
    }

    onMount() {
        this.elements = {
            list: this.$('#buildings-list-container'),
            detail: this.$('#building-detail-content')
        };

        // Sub-view navigation (Village / Buildings)
        this.root.addEventListener('click', (e) => {
            const subviewBtn = e.target.closest('[data-subview]');
            if (subviewBtn) {
                this.ui.switchView(subviewBtn.dataset.subview);
                return;
            }
        });

        // Initialize list component
        this.buildingList = createBuildingList({
            onSelect: (id) => {
                this.selectedBuildingId = id;
                // The selection change will be picked up by the next update() call's stateString check
            },
            t: this.t.bind(this)
        });

        if (this.elements.list) {
            this.elements.list.innerHTML = '';
            this.elements.list.appendChild(this.buildingList.root);
        }

        // Initialize detail pane component
        this.buildingDetail = createBuildingDetailPane({
            onBuild: () => {},
            onUpgrade: (details) => {
                this.emit('startProject', details);
            },
            t: this.t.bind(this)
        });

        if (this.elements.detail) {
            this.elements.detail.innerHTML = '';
            this.elements.detail.appendChild(this.buildingDetail.root);
        }
    }

    /**
     * Override update to include selection and inventory in the diff.
     */
    update(state) {
        const village = state.village;
        if (!village) return;

        // Include selectedBuildingId and wood count in the comparison key
        const stateString = JSON.stringify({ 
            infrastructure: village.infrastructure,
            constructionQueue: village.constructionQueue,
            wood: state.inventory?.materials?.material_wood,
            selection: this.selectedBuildingId
        });

        if (this.lastRenderedState === stateString) {
            return;
        }

        this.onUpdate(state);
        this.lastRenderedState = stateString;
    }

    onUpdate(state) {
        const { village } = state;
        if (!village) return;

        const buildings = Object.keys(village.infrastructure);

        if (this.buildingList) {
            this.buildingList.update({
                buildings,
                selectedBuildingId: this.selectedBuildingId,
                village
            });
        }

        if (this.buildingDetail) {
            this.buildingDetail.update({
                buildingId: this.selectedBuildingId,
                village,
                state
            });
        }
    }
}
