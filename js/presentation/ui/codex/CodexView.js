import { BaseView } from '../BaseView.js';
import { CODEX_FEATURES, CODEX_CATEGORIES } from '../../../engine/shared/data/CodexFeatures.js';

export class CodexView extends BaseView {
    constructor() {
        super('codex');
        this.selectedFeatureId = null;
        this.currentState = null;
    }

    onMount() {
        this.elements = {
            featuresContainer: this.$('#codex-features-container'),
            detailContent: this.$('#codex-detail-content')
        };

        // Delegate clicks on subview navigation and feature rows
        this.root.addEventListener('click', (e) => {
            const subnavTab = e.target.closest('.sub-nav-tab[data-subview]');
            if (subnavTab) {
                this.ui.switchView(subnavTab.dataset.subview);
                return;
            }

            const codexRow = e.target.closest('.codex-row');
            if (codexRow) {
                this.selectFeature(codexRow.dataset.id);
            }
        });
    }

    /**
     * Override BaseView.update to run custom smart diffing.
     * Codex features depend on several parts of global state (expeditions, infrastructure, hero stats).
     */
    update(state) {
        if (!state) return;

        // Custom diff key representation
        const stateString = JSON.stringify({
            completedExpeditions: state.completedExpeditions,
            villageInfrastructure: state.village?.infrastructure,
            heroes: state.heroes?.map(h => ({
                magicTier: h.magicTier,
                knownFamilies: h.knownFamilies,
                techniqueTiers: h.techniqueTiers
            }))
        });

        if (this.lastRenderedState === stateString) {
            return; // Skip re-rendering if inputs haven't changed
        }

        this.currentState = state;
        this.onUpdate(state);
        this.lastRenderedState = stateString;
    }

    onUpdate(state) {
        this.renderFeaturesList(state);
        this.renderDetails(state);
    }

    selectFeature(featureId) {
        this.selectedFeatureId = featureId;
        
        // Update active class on rows instantly
        const rows = this.$$('.codex-row');
        rows.forEach(row => {
            if (row.dataset.id === featureId) {
                row.classList.add('active');
            } else {
                row.classList.remove('active');
            }
        });

        if (this.currentState) {
            this.renderDetails(this.currentState);
        }
    }

    renderFeaturesList(state) {
        const container = this.elements.featuresContainer;
        if (!container) return;

        container.innerHTML = '';

        CODEX_CATEGORIES.forEach(category => {
            const categoryFeatures = CODEX_FEATURES.filter(f => f.categoryId === category.id);
            if (categoryFeatures.length === 0) return;

            // Render category header
            const header = document.createElement('div');
            header.className = 'codex-category-header';
            header.innerHTML = `<span class="codex-category-icon">${category.icon}</span><span class="codex-category-name">${this.t(category.nameKey)}</span>`;
            container.appendChild(header);

            // Render features in this category
            categoryFeatures.forEach(feature => {
                const unlocked = feature.isUnlocked(state);
                
                const row = document.createElement('div');
                row.className = `codex-row${unlocked ? '' : ' locked'}${this.selectedFeatureId === feature.id ? ' active' : ''}`;
                row.dataset.id = feature.id;

                const iconSpan = document.createElement('span');
                iconSpan.className = 'codex-icon';
                iconSpan.textContent = unlocked ? feature.icon : '❓';

                const nameSpan = document.createElement('span');
                nameSpan.className = 'codex-name';
                nameSpan.textContent = this.t(feature.nameKey);

                row.appendChild(iconSpan);
                row.appendChild(nameSpan);

                if (!unlocked) {
                    const lockSpan = document.createElement('span');
                    lockSpan.className = 'codex-lock';
                    lockSpan.innerHTML = '🔒';
                    row.appendChild(lockSpan);
                }

                container.appendChild(row);
            });
        });
    }

    renderDetails(state) {
        const container = this.elements.detailContent;
        if (!container) return;

        if (!this.selectedFeatureId) {
            // Render placeholder state
            container.innerHTML = `
                <div class="empty-detail">
                    <div class="detail-icon-bg">📖</div>
                    <p>${this.t('codex_uxelm_intro')}</p>
                </div>
            `;
            return;
        }

        const feature = CODEX_FEATURES.find(f => f.id === this.selectedFeatureId);
        if (!feature) return;

        const unlocked = feature.isUnlocked(state);

        let detailsHtml = `
            <div class="codex-detail-wrapper">
                <div class="codex-detail-header">
                    <div class="codex-detail-icon-bg">${unlocked ? feature.icon : '❓'}</div>
                    <div class="codex-detail-title-group">
                        <h2>${this.t(feature.nameKey)}</h2>
                        <span class="codex-status-badge ${unlocked ? 'unlocked' : 'locked'}">
                            ${unlocked ? this.t('shared_uxelm_unlocked') : this.t('shared_uxelm_locked')}
                        </span>
                    </div>
                </div>
        `;

        if (!unlocked) {
            detailsHtml += `
                <div class="codex-requirement-card">
                    <h4>${this.t('shared_uxelm_requirements')}</h4>
                    <p class="codex-requirement-text">${this.t(feature.unlockHintKey)}</p>
                </div>
                <div class="codex-explanation-section">
                    <h4>${this.t('nav_codex')}</h4>
                    <p class="codex-explanation-text" style="opacity: 0.5; font-style: italic;">${this.t('codex_locked_placeholder')}</p>
                </div>
            `;
        } else {
            detailsHtml += `
                <div class="codex-explanation-section">
                    <h4>${this.t('nav_codex')}</h4>
                    <p class="codex-explanation-text">${this.t(feature.descKey)}</p>
                </div>
            `;
        }

        detailsHtml += `</div>`;
        container.innerHTML = detailsHtml;
    }
}
