import { GLYPH_DATA, computeGlyphEffect, computeGlyphCostMult } from '../../../engine/shared/data/GameConstants.js';
import { MagicCircleService } from '../../../engine/magic_circle/MagicCircleService.js';

/**
 * MagicCircleView - Dedicated full-screen overlay for composing magic circles (spells).
 * Cleanly decoupled from hero views, entities, and state mutation.
 */
export class MagicCircleView {
    constructor({ i18n, ui }) {
        this.i18n = i18n;
        this.ui = ui;
        this.overlay = null;
    }

    /**
     * Helper for translations.
     */
    t(key) {
        return this.ui ? this.ui.t(key) : key;
    }

    /**
     * Generates a descriptive string for a glyph at a given tier level.
     * @param {Object} g - Glyph item from GLYPH_DATA
     * @param {number} tier - Selected/Mastered tier of the glyph
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

    /**
     * Opens the full-screen overlay.
     */
    open(options) {
        const {
            heroName = 'Archmage Simulator',
            magicTier = 1,
            maxMp = 100,
            knownGlyphs = [],
            glyphMastery = {},
            isSimulator = false,
            onConfirm = null,
            onClose = null
        } = options;

        // Local State
        let composition = []; // array of { slotIndex, glyphId }
        let customName = '';
        let selectedTiers = {};
        let focusedSlotIndex = null;
        let activeCategory = 'all';

        const maxSlots = MagicCircleService.getSlotCount(magicTier);

        // Create overlay element
        this.overlay = document.createElement('div');
        this.overlay.className = 'magic-circle-overlay';

        const close = () => {
            if (this.overlay) {
                this.overlay.style.opacity = '0';
                setTimeout(() => {
                    if (this.overlay) {
                        this.overlay.remove();
                        this.overlay = null;
                    }
                    if (onClose) onClose();
                }, 300);
            }
        };

        const render = () => {
            const glyphIds = composition.map(c => c.glyphId);
            const glyphTiers = {};
            for (const c of composition) {
                glyphTiers[c.glyphId] = selectedTiers[c.glyphId] || glyphMastery[c.glyphId]?.tier || 1;
            }

            const composeResult = composition.length > 0
                ? MagicCircleService.compose(glyphIds, glyphTiers, customName || null)
                : null;
            const spell = composeResult?.success ? composeResult.data : null;

            // Element determination for card styling
            const coreGlyph = composition.find(c => c.slotIndex === 0);
            const activeElement = coreGlyph ? GLYPH_DATA[coreGlyph.glyphId]?.element : null;
            let previewClass = 'spell-preview-card';
            if (activeElement) previewClass += ` el-${activeElement}`;

            // MP Budget Bar styling
            let budgetColor = '#6366f1';
            let budgetLabel = 'Within Budget';
            if (spell) {
                const ratio = spell.mpCost / Math.max(1, maxMp);
                if (ratio > 0.90) {
                    budgetColor = '#ef4444';
                    budgetLabel = 'Over Budget';
                } else if (ratio > 0.75) {
                    budgetColor = '#f59e0b';
                    budgetLabel = 'Warning';
                }
            }

            // Filter glyph palette content
            const filteredGlyphIds = knownGlyphs.filter(gid => {
                const g = GLYPH_DATA[gid];
                if (!g) return false;
                if (activeCategory === 'all') return true;
                return g.type === activeCategory;
            });

            // Group Tabs
            const tabs = ['all', 'core', 'power', 'effect', 'efficiency'];
            const tabLabels = {
                all: 'All',
                core: 'Core',
                power: 'Power',
                effect: 'Effect',
                efficiency: 'Efficiency'
            };

            const tabsHtml = tabs.map(t => `
                <button class="glyph-filter-tab ${activeCategory === t ? 'active' : ''}" data-category="${t}">
                    ${tabLabels[t]}
                </button>
            `).join('');

            // Glyph Palette Cards
            const glyphCardsHtml = filteredGlyphIds.map(gid => {
                const g = GLYPH_DATA[gid];
                const tier = selectedTiers[gid] || glyphMastery[gid]?.tier || 1;
                const symbol = MagicCircleService.getGlyphSymbol(tier);
                const isUsed = composition.some(c => c.glyphId === gid);
                const desc = this.getGlyphDescription(g, tier);

                let isSelected = false;
                if (focusedSlotIndex !== null) {
                    const focusedSlot = composition.find(c => c.slotIndex === focusedSlotIndex);
                    if (focusedSlot && focusedSlot.glyphId === gid) {
                        isSelected = true;
                    }
                }

                // Tier selector: hero can tune any glyph from Tier 1 up to their max mastered tier.
                // This represents how "masterfully" they draw the glyph in this composition.
                const maxMasteredTier = glyphMastery[gid]?.tier || 1;
                const currentTier = selectedTiers[gid] || maxMasteredTier;
                const tierSelectHtml = `
                    <select class="glyph-tier-select" data-glyph="${gid}" style="margin-left: 8px; font-size: 0.65rem; padding: 2px; border-radius: 4px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); color: #fff; flex-shrink: 0;">
                        ${Array.from({ length: maxMasteredTier }, (_, i) => {
                            const t = i + 1;
                            const sym = MagicCircleService.getGlyphSymbol(t);
                            return `<option value="${t}" ${t === currentTier ? 'selected' : ''}>${sym} (T${t})</option>`;
                        }).join('')}
                    </select>
                `;

                return `
                    <div class="glyph-card ${isUsed ? 'used' : ''} ${isSelected ? 'selected' : ''}" data-glyph="${gid}">
                        <div class="glyph-card-header">
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <span class="glyph-card-title">${this.t(gid) || gid} ${symbol}</span>
                            </div>
                            <span class="glyph-card-badge ${g.type}">${g.type}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                            <span class="glyph-card-desc">${desc}</span>
                            ${tierSelectHtml}
                        </div>
                    </div>
                `;
            }).join('');

            // Socket Slices layout mapping
            const slotHtml = [];
            for (let i = 0; i < 25; i++) {
                const isUnlocked = i < maxSlots;
                const isCore = i === 0;

                let left, top;
                if (isCore) {
                    left = 50;
                    top = 50;
                } else {
                    const ring = Math.floor((i - 1) / 6) + 1;
                    const slotInRing = (i - 1) % 6;
                    const radius = ring * 11.2; // percentage
                    const angle = slotInRing * (2 * Math.PI / 6) - Math.PI / 2; // top starts at -90deg
                    left = 50 + radius * Math.cos(angle);
                    top = 50 + radius * Math.sin(angle);
                }

                const slotComp = composition.find(c => c.slotIndex === i);
                const label = isCore ? 'CORE' : `R${i}`;

                let slotClass = 'mandala-slot';
                let content = '';
                let title = '';

                if (i === focusedSlotIndex) {
                    slotClass += ' focused-slot';
                }

                if (!isUnlocked) {
                    slotClass += ' locked';
                    content = '🔒';
                    title = `${label} (Locked - Magic Tier ${i + 1} required)`;
                } else if (slotComp) {
                    slotClass += ' filled';
                    const g = GLYPH_DATA[slotComp.glyphId];
                    const tier = selectedTiers[slotComp.glyphId] || glyphMastery[slotComp.glyphId]?.tier || 1;
                    const symbol = MagicCircleService.getGlyphSymbol(tier);
                    const emoji = g.type === 'core' ? (g.element === 'fire' ? '🔥' : g.element === 'water' ? '💧' : g.element === 'wind' ? '🌪️' : g.element === 'storm' ? '⚡' : g.element === 'light' ? '✨' : g.element === 'earth' ? '🪨' : '🌑') : '';
                    content = `<div class="slot-icon">${emoji || g.id.replace('glyph_', '').slice(0, 3).toUpperCase()}</div><span class="slot-tier">${symbol}</span>`;
                    title = `${label}: ${this.t(g.id) || g.id} ${symbol}`;
                } else {
                    slotClass += ' empty';
                    content = isCore ? '⚡' : '＋';
                    title = `${label} (Empty)`;
                }

                if (isCore) {
                    slotClass += ' core-slot';
                }

                slotHtml.push(`
                    <div class="${slotClass}" data-slot="${i}" title="${title}" style="position: absolute; left: ${left.toFixed(2)}%; top: ${top.toFixed(2)}%; transform: translate(-50%, -50%);">
                        ${content}
                    </div>
                `);
            }

            // Socket Status Bar Text
            let socketInfoText = 'Select any slot on the mandala to focus and insert a glyph.';
            if (focusedSlotIndex !== null) {
                const filledComp = composition.find(c => c.slotIndex === focusedSlotIndex);
                if (filledComp) {
                    const g = GLYPH_DATA[filledComp.glyphId];
                    const tier = selectedTiers[filledComp.glyphId] || glyphMastery[filledComp.glyphId]?.tier || 1;
                    const symbol = MagicCircleService.getGlyphSymbol(tier);
                    socketInfoText = `<strong>Slot ${focusedSlotIndex === 0 ? 'CORE (Center)' : focusedSlotIndex} focused</strong>: Contains <strong>${this.t(g.id) || g.id} ${symbol}</strong>. Click slot again to clear it, or click a glyph in the library to overwrite it.`;
                } else {
                    socketInfoText = `<strong>Slot ${focusedSlotIndex === 0 ? 'CORE (Center)' : focusedSlotIndex} focused (Empty)</strong>. Click a glyph in the library to socket it here.`;
                }
            }

            const previewHtml = spell ? `
                <div class="${previewClass}">
                    <div class="preview-stat" style="margin-bottom: 6px; font-size: 0.85rem;"><strong>${this.t('ui_damage') || 'Damage'}:</strong> <span style="font-size: 1rem; color: #4ade80; font-weight: bold;">${spell.damage}</span></div>
                    <div class="preview-stat" style="margin-bottom: 6px; font-size: 0.85rem;"><strong>${this.t('ui_mp_cost') || 'MP Cost'}:</strong> <span style="font-size: 1rem; color: #60a5fa; font-weight: bold;">${spell.mpCost}</span></div>
                    <div class="preview-stat" style="margin-bottom: 6px; font-size: 0.85rem;"><strong>${this.t('ui_element') || 'Element'}:</strong> <span style="text-transform: capitalize;">${spell.element}</span></div>
                    <div class="preview-stat" style="margin-bottom: 6px; font-size: 0.85rem;"><strong>${this.t('ui_target') || 'Target'}:</strong> ${
                        spell.targetType === 'all_enemies' ? 'All Enemies' :
                        spell.targetType === 'all_allies' ? 'All Allies' :
                        spell.targetType === 'single_ally' ? 'Single Ally' :
                        'Single Enemy'
                    }</div>
                    <div class="mp-budget-bar" style="margin-top:12px;height:8px;background:rgba(255,255,255,0.08);border-radius:4px;overflow:hidden;border: 1px solid rgba(255,255,255,0.05);">
                        <div style="width:${Math.min(100, (spell.mpCost / Math.max(1, maxMp)) * 100)}%;height:100%;background:${budgetColor};border-radius:4px;box-shadow: 0 0 8px ${budgetColor};"></div>
                    </div>
                    <div style="font-size:0.7rem;color:${budgetColor};margin-top:5px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">${budgetLabel} (${spell.mpCost} / ${maxMp} MP)</div>
                </div>
            ` : `<div class="spell-preview-card empty" style="color: var(--text-muted); font-style: italic; border: 1.5px dashed var(--glass-border); padding: 24px; text-align: center; border-radius: var(--radius-lg); background: transparent;">
                    ${this.t('body_circle_empty') || 'Select a Core glyph in the center to forge your spell.'}
                 </div>`;

            this.overlay.innerHTML = `
                <div class="magic-circle-container">
                    <div class="magic-circle-header">
                        <div style="display: flex; align-items: center; gap: 14px;">
                            <span style="font-size: 2rem; filter: drop-shadow(0 0 8px var(--accent-color));">🔮</span>
                            <div>
                                <h2>${this.t('magic_circle_title') || 'Magic Circle'} — ${heroName}</h2>
                                <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 2px;">
                                    Tier ${magicTier} · ${maxSlots} slots available
                                </div>
                            </div>
                        </div>
                        <button class="btn btn-secondary btn-sm" id="btn-magic-header-close" style="padding: 6px 12px; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 0.8rem;">✕</button>
                    </div>

                    <div class="magic-circle-grid">
                        <!-- Left: Glyph Palette -->
                        <div class="magic-circle-column">
                            <h4 style="font-size: 0.95rem; color: var(--text-primary); margin: 0 0 12px 0; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 6px; flex-shrink: 0; font-family: 'Outfit', sans-serif;">
                                Glyph Library
                            </h4>
                            <div class="glyph-filter-tabs">
                                ${tabsHtml}
                            </div>
                            <div style="flex: 1; overflow-y: auto; padding-right: 4px;" class="custom-scrollbar">
                                ${glyphCardsHtml || `<p style="font-size: 0.85rem; color: var(--text-muted); font-style: italic; text-align: center; margin-top: 20px;">No glyphs match this category.</p>`}
                            </div>
                        </div>

                        <!-- Center: Mandala Canvas -->
                        <div class="magic-circle-column magic-circle-center" style="background: radial-gradient(circle at center, rgba(30, 27, 75, 0.25) 0%, rgba(8, 9, 13, 0) 70%);">
                            <div class="mandala-canvas">
                                <div class="mandala-ring ring-1 rotate-cw"></div>
                                <div class="mandala-ring ring-2 rotate-ccw"></div>
                                <div class="mandala-ring ring-3 rotate-cw"></div>
                                <div class="mandala-ring ring-4 rotate-ccw"></div>
                                ${slotHtml.join('')}
                            </div>
                            <div class="socket-info-pane" style="width: 100%; max-width: 440px;">
                                <div style="display: flex; gap: 10px; align-items: flex-start;">
                                    <span style="font-size: 1.1rem; color: var(--accent-color);">ℹ️</span>
                                    <div style="color: var(--text-secondary); line-height: 1.4;">${socketInfoText}</div>
                                </div>
                            </div>
                        </div>

                        <!-- Right: Preview and Controls -->
                        <div class="magic-circle-column" style="justify-content: space-between;">
                            <div>
                                <h4 style="font-size: 0.95rem; color: var(--text-primary); margin: 0 0 16px 0; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px; font-family: 'Outfit', sans-serif;">
                                    Spell Preview
                                </h4>
                                ${previewHtml}
                            </div>

                            <div style="margin-top: 24px; display: flex; flex-direction: column; gap: 16px;">
                                <div>
                                    <label style="display: block; font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 6px; font-weight: 600; letter-spacing: 0.05em;">
                                        Spell Name
                                    </label>
                                    <input type="text" id="spell-name-input" placeholder="${this.t('ui_spell_name_placeholder') || 'Custom spell name...'}" value="${customName}" maxlength="30" style="width: 100%; padding: 10px; border-radius: var(--radius-md); border: 1px solid var(--glass-border); background: rgba(0,0,0,0.3); color: var(--text-primary); outline: none; transition: border-color 0.2s;" onfocus="this.style.borderColor='var(--accent-color)'" onblur="this.style.borderColor='var(--glass-border)'">
                                </div>

                                <div style="display: flex; flex-direction: column; gap: 8px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 16px;">
                                    <button class="btn btn-primary" id="btn-inscribe-spell" ${!spell ? 'disabled' : ''} style="width: 100%; padding: 10px; font-weight: bold; background: var(--accent-gradient); border: none; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);">
                                        ${this.t('ui_inscribe') || 'Inscribe Spell'}
                                    </button>
                                    <div style="display: flex; gap: 8px;">
                                        <button class="btn btn-secondary" id="btn-clear-circle" style="flex: 1; padding: 8px; font-size: 0.8rem; background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.08);">
                                            ${this.t('ui_clear') || 'Clear'}
                                        </button>
                                        <button class="btn btn-secondary" id="btn-magic-close" style="flex: 1; padding: 8px; font-size: 0.8rem; background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.08);">
                                            ${this.t('ui_btn_close') || 'Close'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Event Listeners
            // Mandala slot click listener
            this.overlay.querySelectorAll('.mandala-slot').forEach(slotEl => {
                slotEl.addEventListener('click', () => {
                    const slotIdx = parseInt(slotEl.dataset.slot);
                    if (slotIdx >= maxSlots) return; // Locked

                    const existingComp = composition.find(c => c.slotIndex === slotIdx);
                    if (focusedSlotIndex === slotIdx) {
                        // Clear if clicked twice
                        if (existingComp) {
                            composition = composition.filter(c => c.slotIndex !== slotIdx);
                        }
                        focusedSlotIndex = null;
                    } else {
                        focusedSlotIndex = slotIdx;
                    }
                    render();
                });
            });

            // Category filters click listener
            this.overlay.querySelectorAll('.glyph-filter-tab').forEach(tabBtn => {
                tabBtn.addEventListener('click', () => {
                    activeCategory = tabBtn.dataset.category;
                    render();
                });
            });

            // Glyph Card click listener
            this.overlay.querySelectorAll('.glyph-card').forEach(cardEl => {
                cardEl.addEventListener('click', (e) => {
                    if (e.target.tagName === 'SELECT' || e.target.tagName === 'OPTION') return;

                    const gid = cardEl.dataset.glyph;
                    const g = GLYPH_DATA[gid];
                    if (!g) return;

                    if (focusedSlotIndex !== null) {
                        if (focusedSlotIndex === 0 && g.type !== 'core') {
                            this.ui.showToast('The center CORE socket only accepts Core glyphs!', 'warning');
                            return;
                        }
                        if (focusedSlotIndex > 0 && g.type === 'core') {
                            this.ui.showToast('Core glyphs must be socketed in the center CORE socket!', 'warning');
                            return;
                        }

                        // Ensure uniqueness - remove this glyph if placed elsewhere
                        composition = composition.filter(c => c.glyphId !== gid || c.slotIndex === focusedSlotIndex);

                        // Socket it
                        composition = composition.filter(c => c.slotIndex !== focusedSlotIndex);
                        composition.push({ slotIndex: focusedSlotIndex, glyphId: gid });
                        composition.sort((a, b) => a.slotIndex - b.slotIndex);

                        // Advance focus index to next empty ring slot
                        const usedSlots = new Set(composition.map(c => c.slotIndex));
                        let nextFocus = null;
                        for (let k = 1; k < maxSlots; k++) {
                            if (!usedSlots.has(k)) {
                                nextFocus = k;
                                break;
                            }
                        }
                        focusedSlotIndex = nextFocus;
                    } else {
                        // Auto-populate fallback
                        if (g.type === 'core') {
                            composition = composition.filter(c => c.slotIndex !== 0);
                            composition.push({ slotIndex: 0, glyphId: gid });
                        } else {
                            if (composition.some(c => c.glyphId === gid)) {
                                this.ui.showToast('This glyph is already socketed in the circle!', 'warning');
                                return;
                            }
                            const usedSlots = new Set(composition.map(c => c.slotIndex));
                            let slotPlaced = false;
                            for (let i = 1; i < maxSlots; i++) {
                                if (!usedSlots.has(i)) {
                                    composition.push({ slotIndex: i, glyphId: gid });
                                    slotPlaced = true;
                                    break;
                                }
                            }
                            if (!slotPlaced) {
                                this.ui.showToast('All unlocked sockets are full!', 'warning');
                                return;
                            }
                        }
                        composition.sort((a, b) => a.slotIndex - b.slotIndex);
                    }
                    render();
                });
            });

            // Tier select listener
            this.overlay.querySelectorAll('.glyph-tier-select').forEach(select => {
                select.addEventListener('change', (e) => {
                    const gid = select.dataset.glyph;
                    const newTier = parseInt(e.target.value);
                    selectedTiers[gid] = newTier;
                    render();
                });
            });

            // Spell Name input listener
            const nameInput = this.overlay.querySelector('#spell-name-input');
            if (nameInput) {
                nameInput.addEventListener('input', (e) => {
                    customName = e.target.value;
                });
                nameInput.addEventListener('change', (e) => {
                    customName = e.target.value;
                    render();
                });
            }

            // Inscription handler
            const inscribeBtn = this.overlay.querySelector('#btn-inscribe-spell');
            if (inscribeBtn) {
                inscribeBtn.addEventListener('click', () => {
                    if (!spell) return;
                    if (isSimulator) {
                        this.ui.showToast(this.t('simulator_inscribe_disabled') || 'Spell composed! (Inscriptions disabled in simulator mode)', 'info');
                        close();
                        return;
                    }
                    if (onConfirm) onConfirm(spell);
                    close();
                });
            }

            this.overlay.querySelector('#btn-clear-circle').addEventListener('click', () => {
                composition = [];
                customName = '';
                focusedSlotIndex = null;
                render();
            });

            this.overlay.querySelector('#btn-magic-close').addEventListener('click', close);
            this.overlay.querySelector('#btn-magic-header-close').addEventListener('click', close);
        };

        document.body.appendChild(this.overlay);
        render();
    }
}
