import { el, diffList } from '../shared/utils/DOMUtils.js';
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
 * MagicCircleView — Full-screen Magic Circle composition UI.
 */
export class MagicCircleView {
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
        this.activeDrawerGlyphId = null;

        this.maxSlots = MagicCircleService.getSlotCount(magicTier);

        // ─── Define close handler early so overlay can reference it ───
        const close = () => {
            window.removeEventListener('keydown', keyHandler);
            if (this.overlay) {
                this.overlay.remove();
                this.overlay = null;
            }
            if (onClose) onClose();
        };

        // ─── Build Overlay Static Structure with el() ───
        this.els = {};

        // Top Margin refs
        this.els.titleText = el('span', { className: 'mc-title-text' });
        this.els.heroBadge = el('span', { className: 'mc-hero-badge' });
        this.els.powerStat = el('span', { className: 'mc-power-stat' });
        this.els.mpCost = el('span', { className: 'mc-mp-cost' });
        this.els.budgetFill = el('div', { className: 'mc-budget-fill' });
        this.els.budgetLabel = el('div', { className: 'mc-budget-label' });

        const topMargin = el('div', { className: ['mc-top-margin', 'mc-margin-bar'] }, [
            el('div', { className: 'mc-top-left' }, [
                el('h2', {}, ['🔮 ', this.els.titleText]),
                this.els.heroBadge
            ]),
            el('div', { className: 'mc-top-right' }, [
                this.els.powerStat,
                this.els.mpCost,
                el('div', { className: 'mc-budget-container' }, [
                    el('div', { className: 'mc-budget-track' }, [this.els.budgetFill]),
                    this.els.budgetLabel
                ])
            ])
        ]);

        // Left Margin refs
        this.els.polarityIcon = el('span', { className: 'mc-polarity-icon' });
        this.els.polarityText = el('span', { className: 'mc-polarity-text' });
        const leftMargin = el('div', { className: ['mc-left-margin', 'mc-margin-bar'] }, [
            el('div', { className: 'mc-polarity-indicator' }, [
                this.els.polarityIcon,
                this.els.polarityText
            ])
        ]);

        // Right Margin refs
        this.els.countIcon = el('span', { className: 'mc-count-icon' });
        this.els.countText = el('span', { className: 'mc-count-text' });
        const rightMargin = el('div', { className: ['mc-right-margin', 'mc-margin-bar'] }, [
            el('div', { className: 'mc-count-indicator' }, [
                this.els.countIcon,
                this.els.countText
            ])
        ]);

        // Center Mandala refs
        this.els.svg = el('svg', { className: 'mandala-connections-svg' });
        this.els.slotsContainer = el('div', { className: 'mandala-slots-container' });
        this.els.centerContainer = el('div', { className: 'mc-center-container' }, [
            el('div', { className: 'mc-mandala-wrapper' }, [
                el('div', { className: ['mandala-ring', 'ring-1', 'rotate-cw'] }),
                el('div', { className: ['mandala-ring', 'ring-2', 'rotate-ccw'] }),
                el('div', { className: ['mandala-ring', 'ring-3', 'rotate-cw'] }),
                el('div', { className: ['mandala-ring', 'ring-4', 'rotate-ccw'] }),
                this.els.svg,
                this.els.slotsContainer
            ])
        ]);

        // Drawer refs
        this.els.drawerTitle = el('h3', { className: 'mc-drawer-title' });
        this.els.paletteTitle = el('div', { className: 'mc-palette-title' });
        this.els.paletteGrid = el('div', { className: 'mc-palette-grid' });
        this.els.infoTitle = el('span', { className: 'mc-info-title' });
        this.els.infoType = el('span', { className: 'mc-info-type' });
        this.els.infoDescription = el('div', { className: 'mc-info-description' });
        this.els.tuningValue = el('span', { className: 'mc-tuning-value' });

        // Tier dial ticks (persistent, updated surgically)
        this.els.dialTicksContainer = el('div', { className: 'mc-dial-ticks' });
        this.dialTickEls = [];
        for (let t = 1; t <= 7; t++) {
            const tick = el('button', {
                className: 'mc-dial-tick',
                dataTier: t,
                onClick: () => {
                    if (this.activeDrawerGlyphId) {
                        this.selectedTiers[this.activeDrawerGlyphId] = t;
                        render();
                    }
                }
            });
            this.dialTickEls.push(tick);
            this.els.dialTicksContainer.appendChild(tick);
        }

        this.els.selectedGlyphInfo = el('div', { className: 'mc-selected-glyph-info' }, [
            el('div', { className: 'mc-info-header' }, [
                this.els.infoTitle,
                this.els.infoType
            ]),
            this.els.infoDescription,
            el('div', { className: 'mc-tuning-section' }, [
                el('div', { className: 'mc-tuning-label-container' }, [
                    el('span', { className: 'mc-tuning-title' }, this.t('mc_dial_prompt') || 'Tier Tuning'),
                    this.els.tuningValue
                ]),
                el('div', { className: 'mc-tuning-dial' }, [
                    this.els.dialTicksContainer
                ])
            ])
        ]);

        this.els.emptyState = el('div', {
            style: { textAlign: 'center', padding: '24px', color: '#64748b', fontStyle: 'italic', fontSize: '0.85rem' }
        }, this.t('mc_slot_empty') || 'Select a glyph from the palette above to socket it.');

        this.els.drawerContent = el('div', { className: 'mc-drawer-content' }, [
            this.els.paletteTitle,
            this.els.paletteGrid,
            this.els.selectedGlyphInfo,
            this.els.emptyState
        ]);

        // Remove button (persistent, visibility toggled)
        this.els.removeBtn = el('button', {
            className: ['mc-btn', 'mc-btn-danger', 'mc-btn-remove'],
            onClick: () => {
                this.composition = this.composition.filter(c => c.slotIndex !== this.focusedSlotIndex);
                this.focusedSlotIndex = null;
                render();
            }
        });
        this.els.drawerActions = el('div', { className: 'mc-drawer-actions' }, [this.els.removeBtn]);

        this.els.drawer = el('div', { className: 'mc-focused-drawer' }, [
            el('div', { className: 'mc-drawer-header' }, [
                this.els.drawerTitle,
                el('button', {
                    className: 'mc-drawer-close',
                    onClick: () => {
                        this.focusedSlotIndex = null;
                        render();
                    }
                }, '✕')
            ]),
            this.els.drawerContent,
            this.els.drawerActions
        ]);

        // Bottom Margin refs
        this.els.elementDisplay = el('div', { className: 'mc-element-display' });
        this.els.chipsContainer = el('div', { className: 'mc-chips-container' });
        this.els.nameInput = el('input', { className: 'mc-name-input', type: 'text', maxlength: 30 });
        this.els.inscribeBtn = el('button', {
            className: ['mc-btn', 'mc-btn-primary', 'mc-btn-inscribe'],
            onClick: () => {
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
            }
        });
        this.els.clearBtn = el('button', {
            className: ['mc-btn', 'mc-btn-secondary', 'mc-btn-clear'],
            onClick: () => {
                this.composition = [];
                this.selectedTiers = {};
                this.focusedSlotIndex = null;
                this.customName = '';
                this.els.nameInput.value = '';
                render();
            }
        });
        this.els.closeBtn = el('button', {
            className: ['mc-btn', 'mc-btn-secondary', 'mc-btn-close'],
            onClick: close
        });

        const bottomMargin = el('div', { className: ['mc-bottom-margin', 'mc-margin-bar'] }, [
            el('div', { className: 'mc-bottom-left' }, [
                this.els.elementDisplay,
                this.els.chipsContainer
            ]),
            el('div', { className: 'mc-bottom-right' }, [
                el('div', { className: 'mc-name-input-wrapper' }, [this.els.nameInput]),
                this.els.inscribeBtn,
                this.els.clearBtn,
                this.els.closeBtn
            ])
        ]);

        this.overlay = el('div', { className: 'magic-circle-overlay' }, [
            topMargin,
            leftMargin,
            rightMargin,
            this.els.centerContainer,
            this.els.drawer,
            bottomMargin
        ]);

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

        // ─── Create 25 slot elements once ───
        this.slotRefs = [];
        for (let i = 0; i < 25; i++) {
            const coords = getSlotCoords(i);
            const icon = el('div', { className: 'slot-icon' });
            const abb = el('div', { className: 'slot-abb' });
            const tier = el('span', { className: 'slot-tier' });

            const slotEl = el('div', {
                className: ['mandala-slot', i === 0 && 'core-slot'],
                dataSlot: i,
                style: { left: `${coords.x}%`, top: `${coords.y}%` },
                onClick: () => {
                    if (i >= this.maxSlots) return;
                    this.focusedSlotIndex = this.focusedSlotIndex === i ? null : i;
                    render();
                }
            });

            this.els.slotsContainer.appendChild(slotEl);
            this.slotRefs.push({ el: slotEl, icon, abb, tier });
        }

        // ─── Static action wiring ───
        this.els.nameInput.placeholder = this.t('ui_spell_name_placeholder') || 'Custom spell name...';
        this.els.nameInput.addEventListener('input', (e) => {
            this.customName = e.target.value;
            render();
        });

        // Palette card click delegation (bound once)
        this.els.paletteGrid.addEventListener('click', (e) => {
            const card = e.target.closest('.mc-palette-card');
            if (!card) return;
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
            this.els.titleText.textContent = this.t('magic_circle_title') || 'Magic Circle';
            this.els.heroBadge.textContent = `${this.heroName} · Tier ${this.magicTier} (${this.maxSlots} slots)`;

            const power = getPowerDisplay(spell);
            this.els.powerStat.textContent = this.t(power.labelKey, { value: power.value }) || '';
            if (isSupport) {
                this.els.powerStat.className = 'mc-power-stat val-heal';
            } else {
                this.els.powerStat.className = 'mc-power-stat';
            }

            this.els.mpCost.textContent = `${spell ? spell.mpCost : 0} ${this.t('ui_mp') || 'MP'}`;

            const budget = computeBudgetState(spell ? spell.mpCost : 0, this.maxMp);
            this.els.budgetFill.style.width = `${Math.min(100, budget.ratio * 100)}%`;
            this.els.budgetFill.style.backgroundColor = budget.color;
            this.els.budgetFill.style.boxShadow = `0 0 8px ${budget.color}`;

            this.els.budgetLabel.textContent = `${this.t(budget.labelKey) || ''} (${spell ? spell.mpCost : 0} / ${this.maxMp} ${this.t('ui_mp') || 'MP'})`;
            this.els.budgetLabel.style.color = budget.color;

            // 3. Left Margin (Polarity)
            this.els.polarityIcon.textContent = isSupport ? '💚' : '⚔️';
            this.els.polarityText.textContent = isSupport ? (this.t('mc_ally') || 'ALLY') : (this.t('mc_foe') || 'FOE');

            // 4. Right Margin (Count)
            this.els.countIcon.textContent = count === 'all' ? '👥' : '👤';
            this.els.countText.textContent = count === 'all' ? (this.t('mc_all') || 'ALL') : (this.t('mc_one') || 'ONE');
            const countIndicator = this.els.countIcon.parentElement;
            if (count === 'all') {
                countIndicator.className = 'mc-count-indicator all-active';
            } else {
                countIndicator.className = 'mc-count-indicator';
            }

            // 5. Update slots state selectively
            this.slotRefs.forEach(slot => {
                const i = parseInt(slot.el.dataset.slot);

                slot.el.className = 'mandala-slot';
                if (i === 0) slot.el.classList.add('core-slot');
                slot.el.title = '';

                if (i >= this.maxSlots) {
                    slot.el.classList.add('locked');
                    slot.el.textContent = '🔒';
                    slot.el.title = this.t('mc_slot_locked', { tier: i + 1 }) || `Locked (Magic Tier ${i + 1} required)`;
                } else {
                    if (i === this.focusedSlotIndex) {
                        slot.el.classList.add('focused-slot');
                    }
                    const slotComp = this.composition.find(c => c.slotIndex === i);
                    if (slotComp) {
                        slot.el.classList.add('filled');
                        const g = GLYPH_DATA[slotComp.glyphId];
                        const tier = glyphTiers[slotComp.glyphId] || 1;
                        const symbol = MagicCircleService.getGlyphSymbol(tier);

                        slot.el.textContent = '';

                        if (i === 0) {
                            slot.el.classList.add(`el-${g.element}`);
                            slot.icon.textContent = getElementEmoji(g.element);
                            slot.tier.textContent = symbol;
                            slot.el.appendChild(slot.icon);
                            slot.el.appendChild(slot.tier);
                        } else {
                            slot.icon.textContent = getGlyphIcon(g);
                            slot.abb.textContent = getGlyphAbbreviation(g);
                            slot.tier.textContent = symbol;
                            slot.el.appendChild(slot.icon);
                            slot.el.appendChild(slot.abb);
                            slot.el.appendChild(slot.tier);
                        }
                        slot.el.title = `${i === 0 ? 'CORE' : 'Slot ' + i}: ${this.t(g.id) || g.id} ${symbol}`;
                    } else {
                        slot.el.classList.add('empty');
                        slot.el.textContent = i === 0 ? '⚡' : '＋';
                        slot.el.title = `${i === 0 ? 'CORE' : 'Slot ' + i} (${this.t('mc_slot_empty') || 'Empty'})`;
                    }
                }
            });

            // 6. Draw connecting lines in SVG between filled adjacent slots
            this.els.svg.replaceChildren();
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
                        this.els.svg.appendChild(line);
                    }
                }
            }

            // 7. Bottom Margin (Element, Chips, Actions)
            if (spell) {
                const elemEmoji = getElementEmoji(spell.element);
                this.els.elementDisplay.textContent = `${elemEmoji} ${spell.element.charAt(0).toUpperCase() + spell.element.slice(1)}`;
            } else {
                this.els.elementDisplay.textContent = `🔮 ${this.t('mc_effect_none') || 'None'}`;
            }

            this.els.chipsContainer.replaceChildren();
            if (spell) {
                const chips = buildEffectChips(spell.effects, isSupport);
                if (isSupport && chips.length === 0) {
                    this.els.chipsContainer.appendChild(
                        el('span', { className: ['mc-effect-chip', 'no-harm'] }, `💚 ${this.t('mc_effect_no_harm') || 'No harmful effects'}`)
                    );
                } else if (chips.length > 0) {
                    chips.forEach(c => {
                        const isPercent = c.labelKey !== 'mc_effect_poison';
                        const suffix = isPercent ? '%' : '';
                        this.els.chipsContainer.appendChild(
                            el('span', { className: 'mc-effect-chip' }, `${c.icon} ${this.t(c.labelKey) || ''} ${c.value}${suffix}`)
                        );
                    });
                } else {
                    this.els.chipsContainer.appendChild(
                        el('span', { className: 'mc-effect-chip' }, this.t('mc_effect_none') || 'No effects')
                    );
                }
            } else {
                this.els.chipsContainer.appendChild(
                    el('span', { className: 'mc-effect-chip' }, this.t('mc_effect_none') || 'No effects')
                );
            }

            // Inscribe Button text & state
            const isCoreSlotted = this.composition.some(c => c.slotIndex === 0);
            const canInscribe = spell && isCoreSlotted && !budget.isOverBudget;
            this.els.inscribeBtn.disabled = !canInscribe;

            if (this.isSimulator) {
                this.els.inscribeBtn.textContent = this.t('mc_inscribe_disabled') || 'Simulator';
            } else {
                this.els.inscribeBtn.textContent = this.t('mc_inscribe') || 'Inscribe Spell';
            }

            this.els.clearBtn.textContent = this.t('ui_clear') || 'Clear';
            this.els.closeBtn.textContent = this.t('ui_btn_close') || 'Close';

            // 8. Drawer Configuration Update
            if (this.focusedSlotIndex !== null) {
                this.els.drawer.classList.add('open');
                this.els.centerContainer.classList.add('drawer-open');

                this.els.drawerTitle.textContent = this.focusedSlotIndex === 0
                    ? (this.t('mc_drawer_title_core') || 'CORE (Center) Configuration')
                    : (this.t('mc_drawer_title', { slot: this.focusedSlotIndex }) || `Slot ${this.focusedSlotIndex} Configuration`);

                const isCoreSlot = this.focusedSlotIndex === 0;
                const filteredKnown = this.knownGlyphs.filter(gid => {
                    const g = GLYPH_DATA[gid];
                    return g && (isCoreSlot ? g.type === 'core' : g.type !== 'core');
                });

                const activeSlotComp = this.composition.find(c => c.slotIndex === this.focusedSlotIndex);
                const activeGlyphId = activeSlotComp ? activeSlotComp.glyphId : null;
                this.activeDrawerGlyphId = activeGlyphId;

                this.els.paletteTitle.textContent = this.t('mc_slot_select_prompt') || 'Select Glyph';

                // Build palette cards and reconcile with diffList
                const paletteCards = filteredKnown.map(gid => {
                    const g = GLYPH_DATA[gid];
                    const isSelected = activeGlyphId === gid;
                    const isPlacedElsewhere = this.composition.some(c => c.glyphId === gid && c.slotIndex !== this.focusedSlotIndex);
                    const abbreviation = getGlyphAbbreviation(g);
                    const emoji = getGlyphIcon(g);

                    return el('div', {
                        className: [
                            'mc-palette-card',
                            isSelected && 'selected',
                            isPlacedElsewhere && 'already-used'
                        ],
                        dataGlyph: gid,
                        title: this.t(g.id) || g.id
                    }, [
                        el('span', { className: 'mc-palette-icon' }, emoji),
                        el('span', { className: 'mc-palette-abb' }, abbreviation || g.id.replace('glyph_', '').slice(0, 3).toUpperCase())
                    ]);
                });

                diffList(this.els.paletteGrid, paletteCards, 'data-glyph');

                if (activeGlyphId) {
                    const activeGlyph = GLYPH_DATA[activeGlyphId];
                    const currentTier = this.selectedTiers[activeGlyphId] || this.glyphMastery[activeGlyphId]?.tier || 1;
                    const desc = this.getGlyphDescription(activeGlyph, currentTier);
                    const symbol = MagicCircleService.getGlyphSymbol(currentTier);
                    const maxSelectable = getMaxSelectableTier(activeGlyph, this.glyphMastery[activeGlyphId]?.tier || 1);
                    const isStatic = isStaticGlyph(activeGlyph);

                    this.els.infoTitle.textContent = `${this.t(activeGlyph.id) || activeGlyph.id} ${symbol}`;
                    this.els.infoType.className = `mc-info-type ${activeGlyph.type}`;
                    this.els.infoType.textContent = activeGlyph.type;
                    this.els.infoDescription.textContent = desc;

                    this.els.tuningValue.textContent = `T${currentTier} (${symbol}) `;
                    if (isStatic) {
                        this.els.tuningValue.appendChild(
                            el('span', {
                                className: 'static-lock',
                                title: this.t('mc_glyph_static_tooltip') || 'This glyph has no growth potential'
                            }, '🔒')
                        );
                    }

                    // Update dial ticks surgically
                    this.dialTickEls.forEach((tick, idx) => {
                        const t = idx + 1;
                        const isUnlocked = t <= maxSelectable;
                        const isActive = t === currentTier;
                        tick.className = [
                            'mc-dial-tick',
                            isActive && 'active',
                            !isUnlocked && 'locked'
                        ];
                        tick.disabled = !isUnlocked;
                        if (!isUnlocked) {
                            tick.title = 'Requires higher mastery';
                        } else {
                            tick.removeAttribute('title');
                        }
                        tick.textContent = MagicCircleService.getGlyphSymbol(t);
                    });

                    this.els.selectedGlyphInfo.style.display = '';
                    this.els.emptyState.style.display = 'none';
                    this.els.removeBtn.style.display = '';
                    this.els.removeBtn.textContent = this.t('mc_slot_remove_prompt') || 'Remove Glyph';
                } else {
                    this.els.selectedGlyphInfo.style.display = 'none';
                    this.els.emptyState.style.display = '';
                    this.els.removeBtn.style.display = 'none';
                }
            } else {
                this.els.drawer.classList.remove('open');
                this.els.centerContainer.classList.remove('drawer-open');
                this.activeDrawerGlyphId = null;
            }
        };

        // Inject overlay and perform initial render
        document.body.appendChild(this.overlay);
        render();
    }
}
