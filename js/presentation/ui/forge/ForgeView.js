import { BaseView } from '../BaseView.js';
import { createForgeItemList } from './components/ForgeItemList.js';
import { createForgeDetailPane } from './components/ForgeDetailPane.js';

export class ForgeView extends BaseView {
    constructor() {
        super('forge');
        this.selectedItemId = null;
    }

    onMount() {
        this.elements = {
            lockOverlay: this.$('#forge-lock-overlay'),
            itemsList: this.$('#forge-items-list'),
            detailContent: this.$('#forge-detail-content')
        };

        this.root.addEventListener('click', (e) => {
            const subviewBtn = e.target.closest('[data-subview]');
            if (subviewBtn) {
                this.ui.switchView(subviewBtn.dataset.subview);
                return;
            }
        });

        // Initialize Item List Component
        this.itemList = createForgeItemList({
            onSelect: (itemId) => {
                this.selectedItemId = itemId;
                this.ui.forceUpdate();
            },
            t: this.t.bind(this)
        });

        if (this.elements.itemsList) {
            this.elements.itemsList.innerHTML = '';
            this.elements.itemsList.appendChild(this.itemList.root);
        }

        // Initialize Detail Pane Component
        this.detailPane = createForgeDetailPane({
            onUpgrade: ({ itemId }) => {
                this.emit('refineItem', { itemId });
            },
            t: this.t.bind(this)
        });

        if (this.elements.detailContent) {
            this.elements.detailContent.innerHTML = '';
            this.elements.detailContent.appendChild(this.detailPane.root);
        }
    }

    update(state) {
        if (!state) return;
        
        const blacksmithLevel = state.village?.infrastructure?.blacksmith || 0;
        const playerGold = state.village?.gold || 0;
        
        const stateString = JSON.stringify({
            blacksmithLevel,
            playerGold,
            equipmentCount: state.inventory?.equipment?.length || 0,
            heroesCount: state.heroes?.length || 0,
            selectedItemId: this.selectedItemId
        });

        if (this.lastRenderedState === stateString) {
            return;
        }

        this.onUpdate(state);
        this.lastRenderedState = stateString;
    }

    onUpdate(state) {
        const blacksmithLevel = state.village.infrastructure.blacksmith || 0;
        const isUnlocked = blacksmithLevel >= 1;

        if (!isUnlocked) {
            if (this.elements.lockOverlay) this.elements.lockOverlay.style.display = 'flex';
            return;
        }

        if (this.elements.lockOverlay) this.elements.lockOverlay.style.display = 'none';

        const equipment = [...(state.inventory.equipment || [])];

        // Merge equipped items from all heroes
        if (state.heroes) {
            state.heroes.forEach(h => {
                ['head', 'body', 'legs', 'leftHand', 'rightHand', 'accessory'].forEach(slot => {
                    const item = h.equipment[slot];
                    if (item) {
                        equipment.push({
                            ...item,
                            equippedOn: h.name
                        });
                    }
                });
            });
        }

        // Render Equipment List
        if (this.itemList) {
            this.itemList.update({ equipment, selectedId: this.selectedItemId });
        }

        // Render Detail Pane
        const selectedItem = equipment.find(e => e.id === this.selectedItemId) || null;
        if (this.detailPane) {
            this.detailPane.update({ item: selectedItem, state });
        }
    }
}
