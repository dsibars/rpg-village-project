import { MagicCircleService } from '../../../engine/magic_circle/MagicCircleService.js';
import { GLYPH_DATA, computeGlyphEffect, computeGlyphCostMult } from '../../../engine/shared/data/GameConstants.js';
import {
    buildEffectChips,
    getPowerDisplay,
    resolveTarget,
    computeBudgetState,
    getElementEmoji,
    getElementColor,
    isStaticGlyph,
    getMaxSelectableTier,
    getGlyphAbbreviation,
    getGlyphIcon
} from './MagicCircleHelper.js';

/**
 * Helper to calculate concentric coordinates for 25 slots.
 * Slot 0 is core, slots 1-24 are arranged on 4 concentric rings (6 slots per ring).
 */
function getSlotCoords(i) {
    if (i === 0) return { x: 50, y: 50 };
    const ring = Math.floor((i - 1) / 6) + 1;
    const slotInRing = (i - 1) % 6;
    const radius = ring * 11.2; // percentage
    const angle = slotInRing * (2 * Math.PI / 6) - Math.PI / 2; // top starts at -90deg
    return {
        x: 50 + radius * Math.cos(angle),
        y: 50 + radius * Math.sin(angle)
    };
}

/**
 * Determine if slot i and slot j are adjacent in the mandala layout.
 */
function isAdjacent(i, j) {
    if (i === j) return false;
    if (i === 0) return j >= 1 && j <= 6;
    if (j === 0) return i >= 1 && i <= 6;

    const ringI = Math.floor((i - 1) / 6) + 1;
    const ringJ = Math.floor((j - 1) / 6) + 1;
    const posI = (i - 1) % 6;
    const posJ = (j - 1) % 6;

    // Same ring connection: adjacent in ring (wrapping around 0-5)
    if (ringI === ringJ) {
        return Math.abs(posI - posJ) === 1 || Math.abs(posI - posJ) === 5;
    }

    // Adjacent ring connection: same position on adjacent ring
    if (Math.abs(ringI - ringJ) === 1) {
        return posI === posJ;
    }

    return false;
}

/**
 * MagicCircleViewV2 — Full-screen Magic Circle composition UI.
 */
export class MagicCircleViewV2 {
    constructor({ i18n, ui }) {
        this.i18n = i18n;
        this.ui = ui;
        this.overlay = null;
    }

    t(key, params = {}) {
        return this.ui ? this.ui.t(key, params) : key;
    }

    /**
     * Generates a descriptive string for a glyph at a given tier level.
     */
    getGlyphDescription(g, tier) {
        if (!g) return '';
        const effects = computeGlyphEffect(g, tier);
        const costMult = computeGlyphCostMult(g, tier);
        const costPercent = Math.round((costMult - 1) * 100);

        if (g.type === 'core') {
            return `Element: ${g.element.toUpperCase()}. Base Damage: ${g.baseDamage}, Base MP Cost: ${g.baseCost}. Sets the elemental base parameters.`;
        }

        switch (g.id) {
            case 'glyph_potentiate':
                return `Amplifies damage multiplier by +${Math.round((effects.damageMult - 1) * 100)}%. (+${costPercent}% MP cost)`;
            case 'glyph_focus':
                return `Increases damage by +${Math.round((effects.damageMult - 1) * 100)}% and Critical Chance by +${Math.round(effects.critBonus * 100)}%. (+${costPercent}% MP cost)`;
            case 'glyph_extend':
                return `Increases duration of effects by +${effects.duration} turn${effects.duration > 1 ? 's' : ''}. (+${costPercent}% MP cost)`;
            case 'glyph_multi':
                return `Hits all possible targets. (+${costPercent}% MP cost)`;
            case 'glyph_pierce':
                return `Ignores ${Math.round(effects.pierce * 100)}% of target's Defense. (+${costPercent}% MP cost)`;
            case 'glyph_venom':
                return `Inflicts +${effects.poisonStacks} poison stack${effects.poisonStacks > 1 ? 's' : ''}. (+${costPercent}% MP cost)`;
            case 'glyph_slumber':
                return `Grants a ${Math.round(effects.sleepChance * 100)}% chance to induce Sleep. (+${costPercent}% MP cost)`;
            case 'glyph_aegis':
                return `Targets allies instead of enemies. (+${costPercent}% MP cost)`;
            case 'glyph_celerity':
                return `Increases Speed by +${Math.round(effects.speedBoost * 100)}% during combat. (+${costPercent}% MP cost)`;
            case 'glyph_reflect':
                return `Grants a ${Math.round(effects.reflectChance * 100)}% chance to reflect attacks. (+${costPercent}% MP cost)`;
            case 'glyph_leech':
                return `Heals caster for ${Math.round(effects.lifesteal * 100)}% of damage dealt. (+${costPercent}% MP cost)`;
            case 'glyph_streamline':
                return `Reduces total spell MP cost by ${Math.round(effects.costReduction * 100)}%.`;
            default:
                return `Custom spell enhancement.`;
        }
    }

    open(options) {
        const {
            heroName = 'Hero',
            magicTier = 1,
            maxMp = 100,
            knownGlyphs = [],
            glyphMastery = {},
            isSimulator = false,
            onConfirm = null,
            onClose = null
        } = options;

        // Reset state properties on this instance
        this.heroName = heroName;
        this.magicTier = magicTier;
        this.maxMp = maxMp;
        this.knownGlyphs = knownGlyphs;
        this.glyphMastery = glyphMastery;
        this.isSimulator = isSimulator;
        this.onConfirm = onConfirm;
        this.onClose = onClose;

        this.composition = [];      // { slotIndex, glyphId }
        this.selectedTiers = {};    // { glyphId: tier }
        this.customName = '';
        this.focusedSlotIndex = null;

        this.maxSlots = MagicCircleService.getSlotCount(magicTier);

        // ─── Setup Overlay Static Container Structure ───
        this.overlay = document.createElement('div');
        this.overlay.className = 'magic-circle-overlay';

        this.overlay.innerHTML = `
            <!-- Top Margin -->
            <div class="mc-top-margin mc-margin-bar">
                <div class="mc-top-left">
                    <h2>🔮 <span class="mc-title-text">Magic Circle</span></h2>
                    <span class="mc-hero-badge"></span>
                </div>
                <div class="mc-top-right">
                    <span class="mc-power-stat"></span>
                    <span class="mc-mp-cost"></span>
                    <div class="mc-budget-container">
                        <div class="mc-budget-track">
                            <div class="mc-budget-fill"></div>
                        </div>
                        <div class="mc-budget-label"></div>
                    </div>
                </div>
            </div>

            <!-- Left Margin -->
            <div class="mc-left-margin mc-margin-bar">
                <div class="mc-polarity-indicator">
                    <span class="mc-polarity-icon">⚔️</span>
                    <span class="mc-polarity-text">FOE</span>
                </div>
            </div>

            <!-- Right Margin -->
            <div class="mc-right-margin mc-margin-bar">
                <div class="mc-count-indicator">
                    <span class="mc-count-icon">👤</span>
                    <span class="mc-count-text">ONE</span>
                </div>
            </div>

            <!-- Center Mandala Container -->
            <div class="mc-center-container">
                <div class="mc-mandala-wrapper">
                    <div class="mandala-ring ring-1 rotate-cw"></div>
                    <div class="mandala-ring ring-2 rotate-ccw"></div>
                    <div class="mandala-ring ring-3 rotate-cw"></div>
                    <div class="mandala-ring ring-4 rotate-ccw"></div>
                    <svg class="mandala-connections-svg"></svg>
                    <div class="mandala-slots-container"></div>
                </div>
            </div>

            <!-- Focused Configuration Drawer -->
            <div class="mc-focused-drawer">
                <div class="mc-drawer-header">
                    <h3 class="mc-drawer-title">Slot Configuration</h3>
                    <button class="mc-drawer-close">✕</button>
                </div>
                <div class="mc-drawer-content"></div>
                <div class="mc-drawer-actions"></div>
            </div>

            <!-- Bottom Margin -->
            <div class="mc-bottom-margin mc-margin-bar">
                <div class="mc-bottom-left">
                    <div class="mc-element-display">🔮 Element</div>
                    <div class="mc-chips-container"></div>
                </div>
                <div class="mc-bottom-right">
                    <div class="mc-name-input-wrapper">
                        <input type="text" class="mc-name-input" maxlength="30">
                    </div>
                    <button class="mc-btn mc-btn-primary mc-btn-inscribe"></button>
                    <button class="mc-btn mc-btn-secondary mc-btn-clear"></button>
                    <button class="mc-btn mc-btn-secondary mc-btn-close"></button>
                </div>
            </div>
        `;

        const close = () => {
            window.removeEventListener('keydown', keyHandler);
            if (this.overlay) {
                this.overlay.remove();
                this.overlay = null;
            }
            if (onClose) onClose();
        };

        const keyHandler = (e) => {
            if (e.key === 'Escape') {
                if (this.focusedSlotIndex !== null) {
                    this.focusedSlotIndex = null;
                    render();
                } else {
                    close();
                }
            }
        };
        window.addEventListener('keydown', keyHandler);

        // Populate slot elements once inside the container to avoid reconstruction during recomposes
        const slotsContainer = this.overlay.querySelector('.mandala-slots-container');
        for (let i = 0; i < 25; i++) {
            const coords = getSlotCoords(i);
            const slotEl = document.createElement('div');
            slotEl.className = 'mandala-slot' + (i === 0 ? ' core-slot' : '');
            slotEl.dataset.slot = i;
            slotEl.style.left = `${coords.x}%`;
            slotEl.style.top = `${coords.y}%`;

            slotEl.addEventListener('click', () => {
                if (i >= this.maxSlots) return; // Locked slots have no interaction
                
                if (this.focusedSlotIndex === i) {
                    this.focusedSlotIndex = null; // Toggle off if clicked twice
                } else {
                    this.focusedSlotIndex = i;
                }
                render();
            });
            slotsContainer.appendChild(slotEl);
        }

        // Static action wiring
        const nameInput = this.overlay.querySelector('.mc-name-input');
        nameInput.placeholder = this.t('ui_spell_name_placeholder') || 'Custom spell name...';
        nameInput.addEventListener('input', (e) => {
            this.customName = e.target.value;
            render();
        });

        this.overlay.querySelector('.mc-drawer-close').addEventListener('click', () => {
            this.focusedSlotIndex = null;
            render();
        });

        const inscribeBtn = this.overlay.querySelector('.mc-btn-inscribe');
        inscribeBtn.addEventListener('click', () => {
            const glyphIds = this.composition.map(c => c.glyphId);
            const glyphTiers = {};
            for (const c of this.composition) {
                glyphTiers[c.glyphId] = this.selectedTiers[c.glyphId] || this.glyphMastery[c.glyphId]?.tier || 1;
            }
            const composeResult = this.composition.length > 0
                ? MagicCircleService.compose(glyphIds, glyphTiers, this.customName || null)
                : null;
            const spell = composeResult?.success ? composeResult.data : null;

            if (!spell) return;

            if (this.isSimulator) {
                if (this.ui && this.ui.showToast) {
                    this.ui.showToast(this.t('simulator_inscribe_disabled') || 'Spell composed! (Inscriptions disabled in simulator mode)', 'info');
                }
                close();
                return;
            }

            if (onConfirm) onConfirm(spell);
            close();
        });

        this.overlay.querySelector('.mc-btn-clear').addEventListener('click', () => {
            this.composition = [];
            this.selectedTiers = {};
            this.focusedSlotIndex = null;
            this.customName = '';
            nameInput.value = '';
            render();
        });

        this.overlay.querySelector('.mc-btn-close').addEventListener('click', close);

        // ─── Render Update Hook ───
        const render = () => {
            const glyphIds = this.composition.map(c => c.glyphId);
            const glyphTiers = {};
            for (const c of this.composition) {
                glyphTiers[c.glyphId] = this.selectedTiers[c.glyphId] || this.glyphMastery[c.glyphId]?.tier || 1;
            }

            const composeResult = this.composition.length > 0
                ? MagicCircleService.compose(glyphIds, glyphTiers, this.customName || null)
                : null;
            const spell = composeResult?.success ? composeResult.data : null;

            const { polarity, count } = resolveTarget(spell);
            const isSupport = spell?.category === 'support';

            // 1. Theme Color Bleed Classes
            this.overlay.className = 'magic-circle-overlay';
            if (isSupport) {
                this.overlay.classList.add('mode-support');
            }
            if (spell && spell.element) {
                this.overlay.classList.add(`el-active-${spell.element}`);
            }

            // 2. Top Margin
            this.overlay.querySelector('.mc-title-text').textContent = this.t('magic_circle_title') || 'Magic Circle';
            this.overlay.querySelector('.mc-hero-badge').textContent = `${this.heroName} · Tier ${this.magicTier} (${this.maxSlots} slots)`;

            const power = getPowerDisplay(spell);
            const powerEl = this.overlay.querySelector('.mc-power-stat');
            powerEl.textContent = this.t(power.labelKey, { value: power.value }) || '';
            if (isSupport) {
                powerEl.className = 'mc-power-stat val-heal';
            } else {
                powerEl.className = 'mc-power-stat';
            }

            this.overlay.querySelector('.mc-mp-cost').textContent = `${spell ? spell.mpCost : 0} ${this.t('ui_mp') || 'MP'}`;

            const budget = computeBudgetState(spell ? spell.mpCost : 0, this.maxMp);
            const budgetFill = this.overlay.querySelector('.mc-budget-fill');
            budgetFill.style.width = `${Math.min(100, budget.ratio * 100)}%`;
            budgetFill.style.backgroundColor = budget.color;
            budgetFill.style.boxShadow = `0 0 8px ${budget.color}`;

            const budgetLabel = this.overlay.querySelector('.mc-budget-label');
            budgetLabel.textContent = `${this.t(budget.labelKey) || ''} (${spell ? spell.mpCost : 0} / ${this.maxMp} ${this.t('ui_mp') || 'MP'})`;
            budgetLabel.style.color = budget.color;

            // 3. Left Margin (Polarity)
            const polarityIndicator = this.overlay.querySelector('.mc-polarity-indicator');
            const polarityIcon = polarityIndicator.querySelector('.mc-polarity-icon');
            const polarityText = polarityIndicator.querySelector('.mc-polarity-text');
            polarityIcon.textContent = isSupport ? '💚' : '⚔️';
            polarityText.textContent = isSupport ? (this.t('mc_ally') || 'ALLY') : (this.t('mc_foe') || 'FOE');

            // 4. Right Margin (Count)
            const countIndicator = this.overlay.querySelector('.mc-count-indicator');
            const countIcon = countIndicator.querySelector('.mc-count-icon');
            const countText = countIndicator.querySelector('.mc-count-text');
            countIcon.textContent = count === 'all' ? '👥' : '👤';
            countText.textContent = count === 'all' ? (this.t('mc_all') || 'ALL') : (this.t('mc_one') || 'ONE');
            if (count === 'all') {
                countIndicator.className = 'mc-count-indicator all-active';
            } else {
                countIndicator.className = 'mc-count-indicator';
            }

            // 5. Update slots state selectively
            const slotElements = this.overlay.querySelectorAll('.mandala-slot');
            slotElements.forEach(slotEl => {
                const i = parseInt(slotEl.dataset.slot);
                
                // Clear classes
                slotEl.className = 'mandala-slot';
                if (i === 0) slotEl.classList.add('core-slot');
                
                slotEl.innerHTML = '';
                slotEl.title = '';

                if (i >= this.maxSlots) {
                    slotEl.classList.add('locked');
                    slotEl.innerHTML = '🔒';
                    slotEl.title = this.t('mc_slot_locked', { tier: i + 1 }) || `Locked (Magic Tier ${i + 1} required)`;
                } else {
                    if (i === this.focusedSlotIndex) {
                        slotEl.classList.add('focused-slot');
                    }
                    const slotComp = this.composition.find(c => c.slotIndex === i);
                    if (slotComp) {
                        slotEl.classList.add('filled');
                        const g = GLYPH_DATA[slotComp.glyphId];
                        const tier = glyphTiers[slotComp.glyphId] || 1;
                        const symbol = MagicCircleService.getGlyphSymbol(tier);
                        
                        if (i === 0) {
                            slotEl.classList.add(`el-${g.element}`);
                            const emoji = getElementEmoji(g.element);
                            slotEl.innerHTML = `<div class="slot-icon">${emoji}</div><span class="slot-tier">${symbol}</span>`;
                        } else {
                            const abb = getGlyphAbbreviation(g);
                            slotEl.innerHTML = `<div class="slot-icon">${getGlyphIcon(g)}</div><div class="slot-abb">${abb}</div><span class="slot-tier">${symbol}</span>`;
                        }
                        slotEl.title = `${i === 0 ? 'CORE' : 'Slot ' + i}: ${this.t(g.id) || g.id} ${symbol}`;
                    } else {
                        slotEl.classList.add('empty');
                        slotEl.innerHTML = i === 0 ? '⚡' : '＋';
                        slotEl.title = `${i === 0 ? 'CORE' : 'Slot ' + i} (${this.t('mc_slot_empty') || 'Empty'})`;
                    }
                }
            });

            // 6. Draw connecting lines in SVG between filled adjacent slots
            const svg = this.overlay.querySelector('.mandala-connections-svg');
            svg.innerHTML = '';
            const filledSlots = this.composition.filter(c => c.slotIndex < this.maxSlots);
            const lineColor = spell ? getElementColor(spell.element) : 'rgba(255, 255, 255, 0.2)';

            for (let a = 0; a < filledSlots.length; a++) {
                for (let b = a + 1; b < filledSlots.length; b++) {
                    const u = filledSlots[a].slotIndex;
                    const v = filledSlots[b].slotIndex;
                    if (isAdjacent(u, v)) {
                        const coordsU = getSlotCoords(u);
                        const coordsV = getSlotCoords(v);
                        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                        line.setAttribute('x1', `${coordsU.x}%`);
                        line.setAttribute('y1', `${coordsU.y}%`);
                        line.setAttribute('x2', `${coordsV.x}%`);
                        line.setAttribute('y2', `${coordsV.y}%`);
                        line.setAttribute('stroke', lineColor);
                        line.setAttribute('class', 'mandala-connection-line');
                        line.style.stroke = lineColor;
                        line.style.opacity = '0.22';
                        svg.appendChild(line);
                    }
                }
            }

            // 7. Bottom Margin (Element, Chips, Actions)
            const elementDisplay = this.overlay.querySelector('.mc-element-display');
            if (spell) {
                const elemEmoji = getElementEmoji(spell.element);
                elementDisplay.textContent = `${elemEmoji} ${spell.element.charAt(0).toUpperCase() + spell.element.slice(1)}`;
            } else {
                elementDisplay.textContent = `🔮 ${this.t('mc_effect_none') || 'None'}`;
            }

            const chipsContainer = this.overlay.querySelector('.mc-chips-container');
            chipsContainer.innerHTML = '';
            if (spell) {
                const chips = buildEffectChips(spell.effects, isSupport);
                if (isSupport && chips.length === 0) {
                    chipsContainer.innerHTML = `<span class="mc-effect-chip no-harm">💚 ${this.t('mc_effect_no_harm') || 'No harmful effects'}</span>`;
                } else if (chips.length > 0) {
                    chips.forEach(c => {
                        const chipEl = document.createElement('span');
                        chipEl.className = 'mc-effect-chip';
                        const isPercent = c.labelKey !== 'mc_effect_poison';
                        const suffix = isPercent ? '%' : '';
                        chipEl.innerHTML = `${c.icon} ${this.t(c.labelKey) || ''} ${c.value}${suffix}`;
                        chipsContainer.appendChild(chipEl);
                    });
                } else {
                    chipsContainer.innerHTML = `<span class="mc-effect-chip">${this.t('mc_effect_none') || 'No effects'}</span>`;
                }
            } else {
                chipsContainer.innerHTML = `<span class="mc-effect-chip">${this.t('mc_effect_none') || 'No effects'}</span>`;
            }

            // Inscribe Button text & state
            const isCoreSlotted = this.composition.some(c => c.slotIndex === 0);
            const canInscribe = spell && isCoreSlotted && !budget.isOverBudget;
            inscribeBtn.disabled = !canInscribe;

            if (this.isSimulator) {
                inscribeBtn.textContent = this.t('mc_inscribe_disabled') || 'Simulator';
            } else {
                inscribeBtn.textContent = this.t('mc_inscribe') || 'Inscribe Spell';
            }

            const clearBtn = this.overlay.querySelector('.mc-btn-clear');
            clearBtn.textContent = this.t('ui_clear') || 'Clear';

            const closeBtn = this.overlay.querySelector('.mc-btn-close');
            closeBtn.textContent = this.t('ui_btn_close') || 'Close';

            // 8. Drawer Configuration Update
            const drawer = this.overlay.querySelector('.mc-focused-drawer');
            const centerContainer = this.overlay.querySelector('.mc-center-container');

            if (this.focusedSlotIndex !== null) {
                drawer.classList.add('open');
                centerContainer.classList.add('drawer-open');

                const titleEl = drawer.querySelector('.mc-drawer-title');
                titleEl.textContent = this.focusedSlotIndex === 0
                    ? (this.t('mc_drawer_title_core') || 'CORE (Center) Configuration')
                    : (this.t('mc_drawer_title', { slot: this.focusedSlotIndex }) || `Slot ${this.focusedSlotIndex} Configuration`);

                const drawerContent = drawer.querySelector('.mc-drawer-content');
                const drawerActions = drawer.querySelector('.mc-drawer-actions');

                const isCoreSlot = this.focusedSlotIndex === 0;
                const filteredKnown = this.knownGlyphs.filter(gid => {
                    const g = GLYPH_DATA[gid];
                    return g && (isCoreSlot ? g.type === 'core' : g.type !== 'core');
                });

                const activeSlotComp = this.composition.find(c => c.slotIndex === this.focusedSlotIndex);
                const activeGlyphId = activeSlotComp ? activeSlotComp.glyphId : null;

                let paletteHtml = `
                    <div class="mc-palette-title">${this.t('mc_slot_select_prompt') || 'Select Glyph'}</div>
                    <div class="mc-palette-grid">
                `;

                filteredKnown.forEach(gid => {
                    const g = GLYPH_DATA[gid];
                    const isSelected = activeGlyphId === gid;
                    const isPlacedElsewhere = this.composition.some(c => c.glyphId === gid && c.slotIndex !== this.focusedSlotIndex);
                    const abbreviation = getGlyphAbbreviation(g);
                    const emoji = getGlyphIcon(g);

                    paletteHtml += `
                        <div class="mc-palette-card ${isSelected ? 'selected' : ''} ${isPlacedElsewhere ? 'already-used' : ''}" 
                             data-glyph="${gid}" title="${this.t(g.id) || g.id}">
                            <span class="mc-palette-icon">${emoji}</span>
                            <span class="mc-palette-abb">${abbreviation || g.id.replace('glyph_', '').slice(0,3).toUpperCase()}</span>
                        </div>
                    `;
                });
                paletteHtml += '</div>';

                if (activeGlyphId) {
                    const activeGlyph = GLYPH_DATA[activeGlyphId];
                    const currentTier = this.selectedTiers[activeGlyphId] || this.glyphMastery[activeGlyphId]?.tier || 1;
                    const desc = this.getGlyphDescription(activeGlyph, currentTier);
                    const symbol = MagicCircleService.getGlyphSymbol(currentTier);

                    const maxSelectable = getMaxSelectableTier(activeGlyph, this.glyphMastery[activeGlyphId]?.tier || 1);
                    const isStatic = isStaticGlyph(activeGlyph);

                    let dialTicksHtml = '';
                    for (let t = 1; t <= 7; t++) {
                        const isUnlocked = t <= maxSelectable;
                        const isActive = t === currentTier;
                        const sym = MagicCircleService.getGlyphSymbol(t);
                        dialTicksHtml += `
                            <button class="mc-dial-tick ${isActive ? 'active' : ''} ${!isUnlocked ? 'locked' : ''}" 
                                    data-tier="${t}" 
                                    ${!isUnlocked ? 'disabled title="Requires higher mastery"' : ''}>
                                ${sym}
                            </button>
                        `;
                    }

                    paletteHtml += `
                        <div class="mc-selected-glyph-info">
                            <div class="mc-info-header">
                                <span class="mc-info-title">${this.t(activeGlyph.id) || activeGlyph.id} ${symbol}</span>
                                <span class="mc-info-type ${activeGlyph.type}">${activeGlyph.type}</span>
                            </div>
                            <div class="mc-info-description">${desc}</div>
                            
                            <div class="mc-tuning-section">
                                <div class="mc-tuning-label-container">
                                    <span class="mc-tuning-title">${this.t('mc_dial_prompt') || 'Tier Tuning'}</span>
                                    <span class="mc-tuning-value">
                                        T${currentTier} (${symbol})
                                        ${isStatic ? `<span class="static-lock" title="${this.t('mc_glyph_static_tooltip') || 'This glyph has no growth potential'}">🔒</span>` : ''}
                                    </span>
                                </div>
                                <div class="mc-tuning-dial">
                                    <div class="mc-dial-ticks">
                                        ${dialTicksHtml}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;

                    drawerActions.innerHTML = `
                        <button class="mc-btn mc-btn-danger mc-btn-remove">${this.t('mc_slot_remove_prompt') || 'Remove Glyph'}</button>
                    `;
                } else {
                    paletteHtml += `
                        <div style="text-align: center; padding: 24px; color: #64748b; font-style: italic; font-size: 0.85rem;">
                            ${this.t('mc_slot_empty') || 'Select a glyph from the palette above to socket it.'}
                        </div>
                    `;
                    drawerActions.innerHTML = '';
                }

                drawerContent.innerHTML = paletteHtml;

                // Re-bind actions inside drawer content
                drawerContent.querySelectorAll('.mc-palette-card').forEach(card => {
                    card.addEventListener('click', () => {
                        const gid = card.dataset.glyph;
                        const existing = this.composition.find(c => c.slotIndex === this.focusedSlotIndex);
                        if (existing) {
                            existing.glyphId = gid;
                        } else {
                            this.composition.push({ slotIndex: this.focusedSlotIndex, glyphId: gid });
                        }
                        this.composition.sort((a, b) => a.slotIndex - b.slotIndex);
                        render();
                    });
                });

                drawerContent.querySelectorAll('.mc-dial-tick:not(.locked)').forEach(tick => {
                    tick.addEventListener('click', () => {
                        const newTier = parseInt(tick.dataset.tier);
                        this.selectedTiers[activeGlyphId] = newTier;
                        render();
                    });
                });

                const removeBtn = drawerActions.querySelector('.mc-btn-remove');
                if (removeBtn) {
                    removeBtn.addEventListener('click', () => {
                        this.composition = this.composition.filter(c => c.slotIndex !== this.focusedSlotIndex);
                        this.focusedSlotIndex = null;
                        render();
                    });
                }
            } else {
                drawer.classList.remove('open');
                centerContainer.classList.remove('drawer-open');
            }
        };

        // Inject overlay and perform initial render
        document.body.appendChild(this.overlay);
        render();
    }
}
