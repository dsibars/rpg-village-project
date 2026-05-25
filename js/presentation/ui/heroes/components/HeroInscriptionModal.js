import { BaseModal } from '../../components/modal/BaseModal.js';
import { GLYPH_DATA } from '../../../../engine/shared/data/GameConstants.js';

export class HeroInscriptionModal {
    static show(hero, t, emit) {
        if (!hero) return;

        const maxSlots = 7;
        const knownGlyphs = new Set(hero.knownGlyphs || []);
        const allGlyphs = Object.values(GLYPH_DATA);
        const glyphTiers = hero.glyphMastery || {};

        const current = hero.bodyInscription || { glyphIds: [], glyphTiers: {} };
        let selectedGlyphIds = [...(current.glyphIds || [])];
        const isInscribing = hero.bodyInscriptionDaysRemaining > 0;

        let modalRef = null;

        const getGlyphSymbol = (gid) => {
            const tier = glyphTiers[gid]?.tier || 1;
            const symbols = ['+', '++', '+++', '✦', '✦✦', '✦✦✦', '✶'];
            return symbols[Math.min(6, tier - 1)];
        };

        const getElementIcon = (element) => {
            const map = { fire: '🔥', water: '💧', wind: '🌬️', storm: '⚡', light: '☀️', dark: '🌑', earth: '🪨' };
            return map[element] || '';
        };

        const render = () => {
            const coreCount = selectedGlyphIds.filter(gid => {
                const g = GLYPH_DATA[gid];
                return g && g.type === 'core';
            }).length;
            const hasCore = coreCount >= 1;
            const slotsUsed = selectedGlyphIds.length;
            const slotsLeft = maxSlots - slotsUsed;

            let hybridCost = 0;
            if (hasCore) {
                let base = 8;
                for (const gid of selectedGlyphIds) {
                    const tier = glyphTiers[gid]?.tier || 1;
                    switch (gid) {
                        case 'glyph_potentiate': base += 2 * tier; break;
                        case 'glyph_multi': base += 5; break;
                        case 'glyph_pierce': base += 3; break;
                        case 'glyph_leech': base += 2; break;
                        case 'glyph_focus': base += 2; break;
                    }
                }
                hybridCost = Math.floor(base * (1 + (hero.magicTier || 1) / 20));
            }

            const contentHtml = `
                <div class="trainer-dialogue-box inscribe-dialogue-box">
                    <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 12px;">
                        ${t('body_inscription_desc') || 'Compose glyphs into your body circle. Requires 1 Core glyph. Inscribed heroes gain hybrid skill casting (STA + MP).'}
                    </p>
                    <div style="margin-bottom: 12px; display:flex; justify-content:space-between;">
                        <strong>${t('ui_inscribed_slots') || 'Slots'}:</strong> ${slotsUsed} / ${maxSlots}
                        ${hybridCost > 0 ? `<span style="color:var(--accent-color);">Hybrid MP: ${hybridCost}</span>` : ''}
                    </div>
                    ${isInscribing ? `<div style="background:rgba(255,193,7,0.15); border:1px solid rgba(255,193,7,0.3); border-radius:6px; padding:8px; margin-bottom:12px; font-size:0.8rem; color:#ffc107;">
                        ⏳ ${t('body_inscription_pending') || 'Inscription in progress'}: ${hero.bodyInscriptionDaysRemaining} ${t('ui_days_remaining') || 'days remaining'}
                    </div>` : ''}
                    <div style="background:rgba(255,255,255,0.05); border-radius:8px; padding:10px; margin-bottom:12px; min-height:48px;">
                        ${selectedGlyphIds.length === 0
                            ? `<span style="color:var(--text-muted); font-size:0.8rem;">${t('body_circle_empty') || 'No glyphs inscribed'}</span>`
                            : `<div style="display:flex; flex-wrap:wrap; gap:6px;">
                                ${selectedGlyphIds.map(gid => {
                                    const g = GLYPH_DATA[gid];
                                    return `<div style="background:rgba(255,255,255,0.1); padding:4px 8px; border-radius:4px; font-size:0.8rem; display:flex; align-items:center; gap:4px;">
                                        <span>${getElementIcon(g.element)}</span>
                                        <span>${t(g.nameKey) || g.id}</span>
                                        <span style="color:var(--accent-color);">${getGlyphSymbol(gid)}</span>
                                        <button class="btn-glyph-remove" data-gid="${gid}" style="background:none; border:none; color:#ff6b6b; cursor:pointer; font-size:0.85rem;">×</button>
                                    </div>`;
                                }).join('')}
                            </div>`}
                    </div>
                    <div style="max-height: 280px; overflow-y: auto;">
                        ${allGlyphs.map(g => {
                            const isKnown = knownGlyphs.has(g.id);
                            const isSelected = selectedGlyphIds.includes(g.id);
                            const canSelect = isKnown && !isSelected && slotsLeft > 0;
                            const typeColor = g.type === 'core' ? '#ff9f43' : g.type === 'power' ? '#5f27cd' : g.type === 'efficiency' ? '#10ac84' : '#00d2d3';
                            return `
                            <div class="inscribe-skill-row ${isSelected ? 'inscribed' : ''} ${!isKnown ? 'not-learned' : ''}" style="border-left:3px solid ${typeColor};">
                                <span class="inscribe-skill-name">${getElementIcon(g.element)} ${t(g.nameKey) || g.id} <small style="color:var(--text-muted);">${getGlyphSymbol(g.id)}</small></span>
                                <span class="inscribe-skill-cost" style="font-size:0.75rem; text-transform:uppercase; color:${typeColor};">${g.type}</span>
                                ${isSelected
                                    ? `<span style="font-size:0.75rem; color:var(--accent-color);">${t('ui_selected') || 'Selected'}</span>`
                                    : canSelect
                                        ? `<button class="btn btn-primary btn-sm btn-glyph-select" data-gid="${g.id}">${t('ui_add') || 'Add'}</button>`
                                        : `<span class="inscribe-locked">${!isKnown ? (t('ui_not_learned') || 'Not learned') : (slotsLeft <= 0 ? (t('ui_no_slots') || 'No slots') : '')}</span>`}
                            </div>
                            `;
                        }).join('')}
                    </div>
                    <div class="trainer-footer" style="display:flex; gap:8px; justify-content:flex-end; margin-top: 15px; border-top: 1px solid var(--glass-border); padding-top: 10px;">
                        <button class="btn btn-primary btn-sm" id="btn-inscribe-save" ${!hasCore || slotsUsed !== maxSlots ? 'disabled' : ''}>${hero.bodyInscription ? (t('ui_overwrite') || 'Overwrite') : (t('ui_save') || 'Save')}</button>
                        <button class="btn btn-secondary btn-sm" id="btn-inscribe-close">${t('ui_btn_close') || 'Close'}</button>
                    </div>
                    ${!hasCore && slotsUsed > 0 ? `<p style="color:#ff6b6b; font-size:0.8rem; margin-top:8px;">${t('error_no_core_glyph') || 'At least one Core glyph is required.'}</p>` : ''}
                    ${slotsUsed > 0 && slotsUsed < maxSlots ? `<p style="color:#ff9f43; font-size:0.8rem; margin-top:8px;">${t('error_body_circle_must_be_7') || 'Body circle must have exactly 7 glyphs.'}</p>` : ''}
                </div>
            `;

            if (modalRef) {
                modalRef.overlay.querySelector('.modal-content-area').innerHTML = contentHtml;
            } else {
                modalRef = BaseModal.show({
                    title: t('body_inscription_title') || 'Body Inscription',
                    contentHtml: contentHtml,
                    icon: '✦',
                    maxWidth: '560px'
                });
            }

            modalRef.overlay.querySelectorAll('.btn-glyph-select').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    selectedGlyphIds.push(e.target.dataset.gid);
                    render();
                });
            });

            modalRef.overlay.querySelectorAll('.btn-glyph-remove').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    selectedGlyphIds = selectedGlyphIds.filter(id => id !== e.target.dataset.gid);
                    render();
                });
            });

            modalRef.overlay.querySelector('#btn-inscribe-close').addEventListener('click', modalRef.close);

            const saveBtn = modalRef.overlay.querySelector('#btn-inscribe-save');
            if (saveBtn) {
                saveBtn.addEventListener('click', () => {
                    const glyphTierMap = {};
                    for (const gid of selectedGlyphIds) {
                        glyphTierMap[gid] = glyphTiers[gid]?.tier || 1;
                    }
                    emit('inscribeBodyCircle', { heroId: hero.id, glyphIds: selectedGlyphIds, glyphTiers: glyphTierMap });
                    modalRef.close();
                });
            }
        };

        render();
    }
}
