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

        // Local state
        let composition = []; // array of { slotIndex, glyphId }
        let customName = '';
        let selectedTiers = {};

        const maxSlots = MagicCircleService.getSlotCount(magicTier);

        // Create overlay
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

            // MP Budget Bar color
            let budgetColor = '#6366f1'; // premium indigo
            let budgetLabel = 'Within Budget';
            if (spell) {
                const ratio = spell.mpCost / Math.max(1, maxMp);
                if (ratio > 0.90) {
                    budgetColor = '#ef4444'; // red
                    budgetLabel = 'Over Budget';
                } else if (ratio > 0.75) {
                    budgetColor = '#f59e0b'; // amber
                    budgetLabel = 'Warning';
                }
            }

            // Group known glyphs by category
            const catalog = { core: [], power: [], effect: [], efficiency: [] };
            for (const gid of knownGlyphs) {
                const g = GLYPH_DATA[gid];
                if (g && catalog[g.type]) catalog[g.type].push(g);
            }

            const categoryLabels = {
                core: '🔥 Core',
                power: '⚡ Power',
                effect: '✨ Effect',
                efficiency: '💧 Efficiency'
            };

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
                    const radius = ring * 11.5; // percentage
                    const angle = slotInRing * (2 * Math.PI / 6) - Math.PI / 2; // top starts at -90deg
                    left = 50 + radius * Math.cos(angle);
                    top = 50 + radius * Math.sin(angle);
                }

                const slotComp = composition.find(c => c.slotIndex === i);
                const label = isCore ? 'CORE' : `R${i}`;

                let slotClass = 'mandala-slot';
                let content = '';
                let title = '';

                if (!isUnlocked) {
                    slotClass += ' locked';
                    content = '🔒';
                    title = `${label} (Locked - Magic Tier ${i + 1} required)`;
                } else if (slotComp) {
                    slotClass += ' filled';
                    const g = GLYPH_DATA[slotComp.glyphId];
                    const tier = selectedTiers[slotComp.glyphId] || glyphMastery[slotComp.glyphId]?.tier || 1;
                    const symbol = MagicCircleService.getGlyphSymbol(tier);
                    const emoji = g.type === 'core' ? (g.element === 'fire' ? '🔥' : g.element === 'water' ? '💧' : g.element === 'wind' ? '🌪️' : g.element === 'storm' ? '⚡' : g.element === 'light' ? '✨' : '🌑') : '';
                    content = `<div class="slot-icon">${emoji || g.id.replace('glyph_', '').slice(0, 3).toUpperCase()}</div><span class="slot-tier">${symbol}</span>`;
                    title = `${label}: ${this.t(g.id) || g.id} ${symbol} (Click to remove)`;
                } else {
                    slotClass += ' empty';
                    content = isCore ? '⚡' : '＋';
                    title = `${label} (Empty - Click a glyph in the palette to insert)`;
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

            const paletteHtml = Object.entries(catalog).map(([cat, glyphs]) => {
                if (glyphs.length === 0) return '';
                const glyphButtons = glyphs.map(g => {
                    const tier = selectedTiers[g.id] || glyphMastery[g.id]?.tier || 1;
                    const symbol = MagicCircleService.getGlyphSymbol(tier);
                    const isUsed = composition.some(c => c.glyphId === g.id);

                    let disabled = false;
                    if (g.type !== 'core') {
                        const ringSlotsFilled = composition.filter(c => c.slotIndex > 0).length;
                        const maxRingSlots = maxSlots - 1;
                        if (ringSlotsFilled >= maxRingSlots) {
                            disabled = true;
                        }
                    }

                    let tierSelectHtml = '';
                    if (isSimulator) {
                        tierSelectHtml = `
                            <select class="glyph-tier-select" data-glyph="${g.id}" style="margin-left: 6px;">
                                ${[1, 2, 3, 4, 5, 6, 7].map(t => {
                                    const sym = MagicCircleService.getGlyphSymbol(t);
                                    return `<option value="${t}" ${t === tier ? 'selected' : ''}>${sym} (T${t})</option>`;
                                }).join('')}
                            </select>
                        `;
                    }

                    return `
                        <div class="glyph-palette-item" style="display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; padding: 4px; margin-bottom: 6px;">
                            <button class="btn btn-sm glyph-btn ${isUsed ? 'used' : ''}" data-glyph="${g.id}" ${disabled ? 'disabled' : ''} style="flex: 1; text-align: left; background: transparent; border: none; padding: 4px 8px; font-size: 0.75rem;">
                                ${this.t(g.id) || g.id} ${symbol}
                            </button>
                            ${tierSelectHtml}
                        </div>
                    `;
                }).join('');

                return `
                    <div class="glyph-category" style="margin-bottom: 16px;">
                        <h5 style="margin: 0 0 6px 0; font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 4px;">
                            ${categoryLabels[cat]}
                        </h5>
                        <div class="glyph-buttons" style="display: flex; flex-direction: column;">
                            ${glyphButtons}
                        </div>
                    </div>
                `;
            }).join('');

            const previewHtml = spell ? `
                <div class="spell-preview" style="background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border); border-radius: var(--radius-md); padding: 12px;">
                    <div class="preview-stat" style="margin-bottom: 6px;"><strong>${this.t('ui_damage') || 'Damage'}:</strong> ${spell.damage}</div>
                    <div class="preview-stat" style="margin-bottom: 6px;"><strong>${this.t('ui_mp_cost') || 'MP Cost'}:</strong> ${spell.mpCost}</div>
                    <div class="preview-stat" style="margin-bottom: 6px;"><strong>${this.t('ui_element') || 'Element'}:</strong> ${spell.element}</div>
                    <div class="preview-stat" style="margin-bottom: 6px;"><strong>${this.t('ui_target') || 'Target'}:</strong> ${spell.targetType === 'all_enemies' ? 'All Enemies' : 'Single Enemy'}</div>
                    <div class="mp-budget-bar" style="margin-top:12px;height:8px;background:rgba(255,255,255,0.1);border-radius:4px;overflow:hidden;">
                        <div style="width:${Math.min(100, (spell.mpCost / Math.max(1, maxMp)) * 100)}%;height:100%;background:${budgetColor};border-radius:4px;"></div>
                    </div>
                    <div style="font-size:0.75rem;color:${budgetColor};margin-top:4px;font-weight:500;">${budgetLabel} (${spell.mpCost} / ${maxMp} MP)</div>
                </div>
            ` : `<div class="spell-preview empty" style="color: var(--text-muted); font-style: italic; border: 1px dashed var(--glass-border); padding: 16px; text-align: center; border-radius: var(--radius-md);">
                    ${this.t('body_circle_empty') || 'Select a Core glyph to begin composing.'}
                 </div>`;

            this.overlay.innerHTML = `
                <div class="magic-circle-container">
                    <div class="magic-circle-header">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <span style="font-size: 2rem;">🔮</span>
                            <div>
                                <h2>${this.t('magic_circle_title') || 'Magic Circle'} — ${heroName}</h2>
                                <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 2px;">
                                    Tier ${magicTier} · ${maxSlots} slots
                                </div>
                            </div>
                        </div>
                        <button class="btn btn-secondary btn-sm" id="btn-magic-header-close" style="padding: 6px 12px;">✕</button>
                    </div>

                    <div class="magic-circle-grid">
                        <!-- Left: Glyph Palette -->
                        <div class="magic-circle-column">
                            <h4 style="font-size: 0.95rem; color: var(--text-primary); margin: 0 0 16px 0; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px; flex-shrink: 0;">
                                Glyph Palette
                            </h4>
                            <div style="flex: 1; overflow-y: auto; padding-right: 4px;">
                                ${paletteHtml || `<p style="font-size: 0.85rem; color: var(--text-muted); font-style: italic;">No glyphs unlocked.</p>`}
                            </div>
                        </div>

                        <!-- Center: Mandala Circle -->
                        <div class="magic-circle-column magic-circle-center">
                            <div class="mandala-canvas">
                                <div class="mandala-ring ring-1"></div>
                                <div class="mandala-ring ring-2"></div>
                                <div class="mandala-ring ring-3"></div>
                                <div class="mandala-ring ring-4"></div>
                                ${slotHtml.join('')}
                            </div>
                        </div>

                        <!-- Right: Preview and Controls -->
                        <div class="magic-circle-column" style="justify-content: space-between;">
                            <div>
                                <h4 style="font-size: 0.95rem; color: var(--text-primary); margin: 0 0 16px 0; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px;">
                                    Spell Preview
                                </h4>
                                ${previewHtml}
                            </div>

                            <div style="margin-top: 24px; display: flex; flex-direction: column; gap: 16px;">
                                <div>
                                    <label style="display: block; font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 6px; font-weight: 600; letter-spacing: 0.05em;">
                                        Spell Name
                                    </label>
                                    <input type="text" id="spell-name-input" placeholder="${this.t('ui_spell_name_placeholder') || 'Custom spell name...'}" value="${customName}" maxlength="30" style="width: 100%; padding: 10px; border-radius: var(--radius-md); border: 1px solid var(--glass-border); background: rgba(0,0,0,0.2); color: var(--text-primary); outline: none;">
                                </div>

                                <div style="display: flex; flex-direction: column; gap: 8px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 16px;">
                                    <button class="btn btn-primary" id="btn-inscribe-spell" ${!spell ? 'disabled' : ''} style="width: 100%; padding: 10px;">
                                        ${this.t('ui_inscribe') || 'Inscribe to Codex'}
                                    </button>
                                    <div style="display: flex; gap: 8px;">
                                        <button class="btn btn-secondary" id="btn-clear-circle" style="flex: 1; padding: 8px;">
                                            ${this.t('ui_clear') || 'Clear'}
                                        </button>
                                        <button class="btn btn-secondary" id="btn-magic-close" style="flex: 1; padding: 8px;">
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
            this.overlay.querySelectorAll('.mandala-slot').forEach(slotEl => {
                slotEl.addEventListener('click', () => {
                    const slotIdx = parseInt(slotEl.dataset.slot);
                    if (slotIdx >= maxSlots) return; // Locked

                    const isFilled = composition.some(c => c.slotIndex === slotIdx);
                    if (isFilled) {
                        composition = composition.filter(c => c.slotIndex !== slotIdx);
                        render();
                    }
                });
            });

            this.overlay.querySelectorAll('.glyph-btn:not([disabled])').forEach(btn => {
                btn.addEventListener('click', () => {
                    const gid = btn.dataset.glyph;
                    const g = GLYPH_DATA[gid];
                    if (!g) return;

                    if (g.type === 'core') {
                        // Place in Slot 0, replacing existing Core if any
                        composition = composition.filter(c => c.slotIndex !== 0);
                        composition.push({ slotIndex: 0, glyphId: gid });
                    } else {
                        // Place in first empty Ring slot (1 to maxSlots - 1)
                        const usedSlots = new Set(composition.map(c => c.slotIndex));
                        for (let i = 1; i < maxSlots; i++) {
                            if (!usedSlots.has(i)) {
                                composition.push({ slotIndex: i, glyphId: gid });
                                break;
                            }
                        }
                    }
                    composition.sort((a, b) => a.slotIndex - b.slotIndex);
                    render();
                });
            });

            this.overlay.querySelectorAll('.glyph-tier-select').forEach(select => {
                select.addEventListener('change', (e) => {
                    const gid = select.dataset.glyph;
                    const newTier = parseInt(e.target.value);
                    selectedTiers[gid] = newTier;
                    render();
                });
            });

            const nameInput = this.overlay.querySelector('#spell-name-input');
            if (nameInput) {
                // Focus behavior
                nameInput.addEventListener('input', (e) => {
                    customName = e.target.value;
                });
                nameInput.addEventListener('change', (e) => {
                    customName = e.target.value;
                    render();
                });
            }

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
                render();
            });

            this.overlay.querySelector('#btn-magic-close').addEventListener('click', close);
            this.overlay.querySelector('#btn-magic-header-close').addEventListener('click', close);
        };

        document.body.appendChild(this.overlay);
        render();
    }
}
