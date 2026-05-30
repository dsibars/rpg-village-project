import { BaseModal } from '../../components/modal/BaseModal.js';
import { GLYPH_DATA } from '../../../../engine/shared/data/MagicCircleData.js';
import { el } from '../../shared/utils/DOMUtils.js';

export class HeroInscriptionModal {
    static show(hero, t, emit, calculateHybridMpCost) {
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

            const hybridCost = calculateHybridMpCost
                ? calculateHybridMpCost(selectedGlyphIds, glyphTiers, hero.magicTier)
                : 0;

            const headerRow = el('div', {
                style: { margin: '12px 0', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }
            }, [
                el('span', {}, [`${t('ui_inscribed_slots') || 'Slots'}: ${slotsUsed} / ${maxSlots}`]),
                hybridCost > 0 ? el('span', { style: { color: 'var(--accent-color)' } }, [`Hybrid MP: ${hybridCost}`]) : null
            ].filter(Boolean));

            const pendingBanner = isInscribing
                ? el('div', {
                    style: {
                        background: 'rgba(255,193,7,0.15)',
                        border: '1px solid rgba(255,193,7,0.3)',
                        borderRadius: '6px',
                        padding: '8px',
                        marginBottom: '12px',
                        fontSize: '0.8rem',
                        color: '#ffc107'
                    }
                }, [`⏳ ${t('body_inscription_pending') || 'Inscription in progress'}: ${hero.bodyInscriptionDaysRemaining} ${t('ui_days_remaining') || 'days remaining'}`])
                : null;

            let selectedGlyphsContainer;
            if (selectedGlyphIds.length === 0) {
                selectedGlyphsContainer = el('span', {
                    style: { color: 'var(--text-muted)', fontSize: '0.8rem' }
                }, [t('body_circle_empty') || 'No glyphs inscribed']);
            } else {
                selectedGlyphsContainer = el('div', {
                    style: { display: 'flex', flexWrap: 'wrap', gap: '6px' }
                }, selectedGlyphIds.map(gid => {
                    const g = GLYPH_DATA[gid];
                    return el('div', {
                        style: {
                            background: 'rgba(255,255,255,0.1)',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }
                    }, [
                        el('span', {}, [getElementIcon(g.element)]),
                        el('span', {}, [t(g.nameKey) || g.id]),
                        el('span', { style: { color: 'var(--accent-color)' } }, [getGlyphSymbol(gid)]),
                        el('button', {
                            class: 'btn-glyph-remove',
                            style: { background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: '0.85rem' },
                            onClick: () => {
                                selectedGlyphIds = selectedGlyphIds.filter(id => id !== gid);
                                render();
                            }
                        }, ['×'])
                    ]);
                }));
            }

            const listContainer = el('div', {
                style: { maxHeight: '280px', overflowY: 'auto' }
            }, allGlyphs.map(g => {
                const isKnown = knownGlyphs.has(g.id);
                const isSelected = selectedGlyphIds.includes(g.id);
                const canSelect = isKnown && !isSelected && slotsLeft > 0;
                const typeColor = g.type === 'core' ? '#ff9f43' : g.type === 'power' ? '#5f27cd' : g.type === 'efficiency' ? '#10ac84' : '#00d2d3';

                let actionElement;
                if (isSelected) {
                    actionElement = el('span', { style: { fontSize: '0.75rem', color: 'var(--accent-color)' } }, [t('ui_selected') || 'Selected']);
                } else if (canSelect) {
                    actionElement = el('button', {
                        class: 'btn btn-primary btn-sm btn-glyph-select',
                        onClick: () => {
                            selectedGlyphIds.push(g.id);
                            render();
                        }
                    }, [t('ui_add') || 'Add']);
                } else {
                    actionElement = el('span', { class: 'inscribe-locked' }, [
                        !isKnown ? (t('ui_not_learned') || 'Not learned') : (slotsLeft <= 0 ? (t('ui_no_slots') || 'No slots') : '')
                    ]);
                }

                return el('div', {
                    class: `inscribe-skill-row ${isSelected ? 'inscribed' : ''} ${!isKnown ? 'not-learned' : ''}`,
                    style: { borderLeft: `3px solid ${typeColor}` }
                }, [
                    el('span', { class: 'inscribe-skill-name' }, [
                        `${getElementIcon(g.element)} `,
                        t(g.nameKey) || g.id,
                        el('small', { style: { color: 'var(--text-muted)', marginLeft: '4px' } }, [getGlyphSymbol(g.id)])
                    ]),
                    el('span', {
                        class: 'inscribe-skill-cost',
                        style: { fontSize: '0.75rem', textTransform: 'uppercase', color: typeColor }
                    }, [g.type]),
                    actionElement
                ]);
            }));

            const saveBtn = el('button', {
                class: 'btn btn-primary btn-sm',
                id: 'btn-inscribe-save',
                disabled: !hasCore || slotsUsed !== maxSlots,
                onClick: () => {
                    const glyphTierMap = {};
                    for (const gid of selectedGlyphIds) {
                        glyphTierMap[gid] = glyphTiers[gid]?.tier || 1;
                    }
                    emit('inscribeBodyCircle', { heroId: hero.id, glyphIds: selectedGlyphIds, glyphTiers: glyphTierMap });
                    modalRef.close();
                }
            }, [hero.bodyInscription ? (t('ui_overwrite') || 'Overwrite') : (t('ui_save') || 'Save')]);

            const closeBtn = el('button', {
                class: 'btn btn-secondary btn-sm',
                id: 'btn-inscribe-close',
                onClick: () => modalRef.close()
            }, [t('ui_btn_close') || 'Close']);

            const contentElement = el('div', { class: 'trainer-dialogue-box inscribe-dialogue-box' }, [
                el('p', { style: { fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' } }, [
                    t('body_inscription_desc') || 'Compose glyphs into your body circle. Requires 1 Core glyph. Inscribed heroes gain hybrid skill casting (STA + MP).'
                ]),
                headerRow,
                pendingBanner,
                el('div', {
                    style: { background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '10px', marginBottom: '12px', minHeight: '48px' }
                }, [selectedGlyphsContainer]),
                listContainer,
                el('div', {
                    class: 'trainer-footer',
                    style: { display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '15px', borderTop: '1px solid var(--glass-border)', paddingTop: '10px' }
                }, [saveBtn, closeBtn]),
                (!hasCore && slotsUsed > 0)
                    ? el('p', { style: { color: '#ff6b6b', fontSize: '0.8rem', marginTop: '8px' } }, [t('error_no_core_glyph') || 'At least one Core glyph is required.'])
                    : null,
                (slotsUsed > 0 && slotsUsed < maxSlots)
                    ? el('p', { style: { color: '#ff9f43', fontSize: '0.8rem', marginTop: '8px' } }, [t('error_body_circle_must_be_7') || 'Body circle must have exactly 7 glyphs.'])
                    : null
            ].filter(Boolean));

            if (modalRef) {
                const contentArea = modalRef.overlay.querySelector('.modal-content-area');
                contentArea.innerHTML = '';
                contentArea.appendChild(contentElement);
            } else {
                modalRef = BaseModal.show({
                    title: t('body_inscription_title') || 'Body Inscription',
                    contentElement: contentElement,
                    icon: '✦',
                    maxWidth: '560px'
                });
            }
        };

        render();
    }
}
