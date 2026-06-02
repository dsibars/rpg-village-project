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

    formatDescription(text) {
        if (!text) return '';
        const cleanedText = text.replace(/\\n/g, '\n');
        const blocks = cleanedText.split('\n\n');

        return blocks.map(block => {
            block = block.trim();
            if (!block) return '';

            // Check if it starts with tip: or similar
            const lowerBlock = block.toLowerCase();
            const isTip = lowerBlock.startsWith('tip:') || 
                          lowerBlock.startsWith('consejo:') || 
                          lowerBlock.startsWith('consello:') || 
                          lowerBlock.startsWith('oharra:') || 
                          lowerBlock.startsWith('consejo estratégico:') || 
                          lowerBlock.startsWith('strategic tip:');
            
            if (isTip) {
                const colonIndex = block.indexOf(':');
                const label = block.substring(0, colonIndex + 1).trim();
                const content = block.substring(colonIndex + 1).trim();
                return `
                    <div class="codex-tip-card">
                        <span class="tip-icon">💡</span>
                        <div class="tip-content">
                            <strong>${label}</strong> ${content}
                        </div>
                    </div>
                `;
            }

            // Check if it's a list block
            if (block.startsWith('- ') || block.includes('\n- ')) {
                const lines = block.split('\n');
                let headerHtml = '';

                // If the first line doesn't start with a bullet point, it's a section header for this list block!
                if (lines[0] && !lines[0].trim().startsWith('-')) {
                    const headerText = lines.shift().trim();
                    const cleanHeader = headerText.endsWith(':') ? headerText.slice(0, -1).trim() : headerText;
                    if (headerText.endsWith(':') && headerText.length < 50) {
                        headerHtml = `<h3 class="codex-section-subtitle">${cleanHeader}</h3>`;
                    } else {
                        headerHtml = `<p class="codex-paragraph" style="margin-bottom: 8px;">${cleanHeader}</p>`;
                    }
                }

                const listItems = lines.map(line => {
                    const cleanLine = line.replace(/^-\s*/, '').trim();
                    if (!cleanLine) return '';

                    const colonIndex = cleanLine.indexOf(':');
                    if (colonIndex > 0) {
                        const title = cleanLine.substring(0, colonIndex).trim();
                        const desc = cleanLine.substring(colonIndex + 1).trim();
                        return `
                            <li class="codex-list-item">
                                <div class="list-item-title-wrapper">
                                    <span class="list-item-bullet">✦</span>
                                    <strong class="list-item-title">${title}</strong>
                                </div>
                                <span class="list-item-desc">${desc}</span>
                            </li>
                        `;
                    }
                    return `
                        <li class="codex-list-item">
                            <div class="list-item-title-wrapper">
                                <span class="list-item-bullet">✦</span>
                                <span class="list-item-desc" style="padding-left: 0;">${cleanLine}</span>
                            </div>
                        </li>
                    `;
                }).filter(Boolean).join('');

                return `${headerHtml}<ul class="codex-styled-list">${listItems}</ul>`;
            }

            // Check if this block is a section subtitle (ends with :)
            if (block.endsWith(':')) {
                const titleText = block.substring(0, block.length - 1).trim();
                return `<h3 class="codex-section-subtitle">${titleText}</h3>`;
            }

            // Normal paragraph
            return `<p class="codex-paragraph">${block}</p>`;
        }).filter(Boolean).join('\n');
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
                    <div class="codex-explanation-content" style="opacity: 0.5; font-style: italic;">
                        ${this.formatDescription(this.t('codex_locked_placeholder'))}
                    </div>
                </div>
            `;
        } else {
            detailsHtml += `
                <div class="codex-explanation-section">
                    <h4>${this.t('nav_codex')}</h4>
                    <div class="codex-explanation-content">
                        ${this.formatDescription(this.t(feature.descKey))}
                    </div>
                </div>
            `;
        }

        detailsHtml += `</div>`;
        container.innerHTML = detailsHtml;
    }
}
