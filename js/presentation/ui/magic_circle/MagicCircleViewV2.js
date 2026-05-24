import { MagicCircleService } from '../../../engine/magic_circle/MagicCircleService.js';
import { GLYPH_DATA } from '../../../engine/shared/data/GameConstants.js';

/**
 * MagicCircleViewV2 — Full-screen Magic Circle composition UI.
 *
 * This file is intentionally left as a minimal working shell.
 * The mandala (the core visual) is completely free for the implementer
 * to build with Canvas, SVG, DOM elements, or any other technique.
 *
 * What IS provided:
 *   - The data contract (see `open(options)`)
 *   - A full-screen overlay container
 *   - A working close button
 *   - A re-render hook that recomposes the spell on every change
 *
 * What the implementer must build:
 *   - The mandala visual (however they want)
 *   - Glyph selection UI
 *   - Tier tuning UI
 *   - The four margin displays (top stats, left polarity, right count, bottom effects)
 *
 * Data available in `open(options)`:
 *   heroName, magicTier, maxMp, knownGlyphs, glyphMastery, isSimulator, onConfirm, onClose
 *
 * Use `MagicCircleHelper.js` for pure data formatting (effect chips, power display,
 * target resolution, element colors, etc.).
 */
export class MagicCircleViewV2 {
    constructor({ i18n, ui }) {
        this.i18n = i18n;
        this.ui = ui;
        this.overlay = null;
    }

    t(key) {
        return this.ui ? this.ui.t(key) : key;
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

        // ─── Local State ───
        let composition = [];      // { slotIndex, glyphId }
        let selectedTiers = {};    // { glyphId: tier }
        let customName = '';

        const maxSlots = MagicCircleService.getSlotCount(magicTier);

        // ─── Overlay ───
        this.overlay = document.createElement('div');
        this.overlay.className = 'magic-circle-overlay';

        const close = () => {
            if (this.overlay) {
                this.overlay.remove();
                this.overlay = null;
            }
            if (onClose) onClose();
        };

        // ─── Recompose & Render ───
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

            // ─── IMPLEMENTER: Build your UI here ───
            // `spell` contains the composed spell (or null if no core glyph yet).
            // `composition` has the currently placed glyphs.
            // `knownGlyphs` has all glyphs this hero knows.
            // `glyphMastery` has their mastered tiers.
            // `maxSlots` tells you how many slots are unlocked.

            this.overlay.innerHTML = `
                <div style="padding:24px;color:#fff;font-family:sans-serif;">
                    <h2>🔮 ${this.t('mc_title') || 'Magic Circle'} — ${heroName}</h2>
                    <p>Tier ${magicTier} · ${maxSlots} slots · ${maxMp} MP</p>
                    ${spell ? `
                        <div style="margin:16px 0;padding:16px;background:rgba(255,255,255,0.05);border-radius:8px;">
                            <strong>${spell.name}</strong><br>
                            Damage: ${spell.damage} · MP: ${spell.mpCost}<br>
                            Element: ${spell.element} · Target: ${spell.targetType}<br>
                            Category: ${spell.category}<br>
                            Effects: ${JSON.stringify(spell.effects)}
                        </div>
                    ` : '<p><em>Select a Core glyph to begin composing a spell.</em></p>'}
                    <div style="margin-top:16px;">
                        <strong>Known Glyphs (${knownGlyphs.length}):</strong>
                        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;">
                            ${knownGlyphs.map(gid => {
                                const g = GLYPH_DATA[gid];
                                const mastered = glyphMastery[gid]?.tier || 1;
                                const isPlaced = composition.some(c => c.glyphId === gid);
                                return `<button
                                    class="glyph-btn ${isPlaced ? 'placed' : ''}"
                                    data-glyph="${gid}"
                                    style="padding:6px 12px;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.05);color:#fff;border-radius:4px;cursor:pointer;${isPlaced ? 'opacity:0.4;' : ''}"
                                >${g?.id?.replace('glyph_', '') || gid} (T${mastered})</button>`;
                            }).join('')}
                        </div>
                    </div>
                    <div style="margin-top:24px;display:flex;gap:12px;">
                        ${spell && !isSimulator ? `<button id="mc-btn-inscribe" style="padding:8px 16px;background:#4f46e5;color:#fff;border:none;border-radius:4px;cursor:pointer;">${this.t('mc_inscribe') || 'Inscribe'}</button>` : ''}
                        ${spell && isSimulator ? `<button disabled style="padding:8px 16px;background:#555;color:#aaa;border:none;border-radius:4px;cursor:not-allowed;">${this.t('mc_inscribe_disabled') || 'Simulator'}</button>` : ''}
                        <button id="mc-btn-clear" style="padding:8px 16px;background:rgba(255,255,255,0.1);color:#fff;border:1px solid rgba(255,255,255,0.2);border-radius:4px;cursor:pointer;">${this.t('ui_clear') || 'Clear'}</button>
                        <button id="mc-btn-close" style="padding:8px 16px;background:rgba(255,255,255,0.1);color:#fff;border:1px solid rgba(255,255,255,0.2);border-radius:4px;cursor:pointer;">${this.t('ui_btn_close') || 'Close'}</button>
                    </div>
                </div>
            `;

            // ─── Event Wiring ───
            this.overlay.querySelectorAll('.glyph-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const gid = btn.dataset.glyph;
                    const g = GLYPH_DATA[gid];
                    if (!g) return;

                    // Simple toggle: click to place in next empty slot, click again to remove
                    const existing = composition.find(c => c.glyphId === gid);
                    if (existing) {
                        composition = composition.filter(c => c.glyphId !== gid);
                    } else {
                        // Find next slot: core (0) for core glyphs, next empty ring slot for others
                        let slotIdx;
                        if (g.type === 'core') {
                            const coreOccupied = composition.find(c => c.slotIndex === 0);
                            if (coreOccupied) {
                                composition = composition.filter(c => c.slotIndex !== 0);
                            }
                            slotIdx = 0;
                        } else {
                            const used = new Set(composition.map(c => c.slotIndex));
                            slotIdx = null;
                            for (let i = 1; i < maxSlots; i++) {
                                if (!used.has(i)) { slotIdx = i; break; }
                            }
                            if (slotIdx === null) return; // no empty slots
                        }
                        composition.push({ slotIndex: slotIdx, glyphId: gid });
                        composition.sort((a, b) => a.slotIndex - b.slotIndex);
                    }
                    render();
                });
            });

            const inscribeBtn = this.overlay.querySelector('#mc-btn-inscribe');
            if (inscribeBtn) {
                inscribeBtn.addEventListener('click', () => {
                    if (onConfirm && spell) onConfirm(spell);
                    close();
                });
            }

            const clearBtn = this.overlay.querySelector('#mc-btn-clear');
            if (clearBtn) {
                clearBtn.addEventListener('click', () => {
                    composition = [];
                    selectedTiers = {};
                    render();
                });
            }

            const closeBtn = this.overlay.querySelector('#mc-btn-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', close);
            }
        };

        document.body.appendChild(this.overlay);
        render();
    }
}
