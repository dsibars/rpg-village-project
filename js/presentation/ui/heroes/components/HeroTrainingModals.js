import { BaseModal } from '../../components/modal/BaseModal.js';
import { el } from '../../shared/utils/DOMUtils.js';

export class TrainerModal {
    static show(hero, i18n, t, getTrainerDialogue) {
        if (!hero) return;

        const dialogue = getTrainerDialogue(hero);

        const contentElement = el('div', { class: 'trainer-dialogue-box' }, [
            el('div', { class: 'trainer-lines' },
                dialogue.lines.map(line => el('p', { class: 'trainer-line' }, ['"' + line + '"']))
            ),
            el('div', {
                class: 'trainer-footer',
                style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '15px',
                    borderTop: '1px solid var(--glass-border)',
                    paddingTop: '10px'
                }
            }, [
                el('span', { class: 'trainer-category', style: { fontSize: '0.8rem', color: 'var(--text-muted)' } }, [dialogue.category]),
                el('button', {
                    class: 'btn btn-secondary btn-sm',
                    onClick: () => modal.close()
                }, [t('ui_btn_close') || 'Close'])
            ])
        ]);

        const modal = BaseModal.show({
            title: t('trainer_title') || 'Training Grounds',
            contentElement,
            icon: '💪',
            maxWidth: '480px'
        });
    }
}

export class WitchModal {
    static show(heroes, selectedHeroId, i18n, t, state, emit, getWitchDialogue, recordWitchVisit) {
        let selectedHero = heroes.find(h => h.id === selectedHeroId) || heroes[0];
        if (!selectedHero) return;

        const currentDay = state.village?.day || 0;
        const elementIcons = { fire: '🔥', water: '💧', wind: '🌪️', storm: '⚡', light: '✨', dark: '🌑', earth: '🪨', neutral: '🔮' };

        let modalRef = null;

        const renderWitch = () => {
            const dialogue = getWitchDialogue(selectedHero, currentDay);
            recordWitchVisit(selectedHero, currentDay);
            const elementIcon = elementIcons[dialogue.element] || '🔮';

            const heroSelect = el('select', {
                id: 'witch-hero-select',
                class: 'gambit-select',
                style: { width: '100%' },
                onChange: (e) => {
                    selectedHero = heroes.find(h => h.id === e.target.value);
                    renderWitch();
                }
            }, heroes.map(h => el('option', {
                value: h.id,
                selected: h.id === selectedHero.id
            }, [`${h.name} (Tier ${h.magicTier || 1})`])));

            const masteryHintEl = dialogue.masteryHints.length > 0
                ? el('div', {
                    style: { marginTop: '8px', fontSize: '0.8rem', color: 'var(--accent-color)' }
                }, [t('witch_mastery_detected') || 'Glyph mastery whispers detected...'])
                : null;

            const contentElement = el('div', { class: 'trainer-dialogue-box witch-dialogue-box' }, [
                el('div', { style: { marginBottom: '12px' } }, [heroSelect]),
                el('div', { class: 'trainer-lines' },
                    dialogue.lines.map(line => el('p', { class: 'trainer-line witch-line' }, [`${elementIcon} "${line}"`]))
                ),
                masteryHintEl,
                el('div', {
                    class: 'trainer-footer',
                    style: {
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '15px',
                        borderTop: '1px solid var(--glass-border)',
                        paddingTop: '10px'
                    }
                }, [
                    el('span', {
                        class: 'trainer-category witch-category',
                        style: { fontSize: '0.8rem', color: 'var(--text-muted)' }
                    }, [`${dialogue.category} · ${dialogue.element}`]),
                    el('button', {
                        class: 'btn btn-secondary btn-sm',
                        onClick: () => {
                            recordWitchVisit(selectedHero, currentDay);
                            emit('updateHero', { hero: selectedHero });
                            modalRef.close();
                        }
                    }, [t('ui_btn_close') || 'Close'])
                ])
            ]);

            if (modalRef) {
                const contentArea = modalRef.overlay.querySelector('.modal-content-area');
                contentArea.innerHTML = '';
                contentArea.appendChild(contentElement);
            } else {
                modalRef = BaseModal.show({
                    title: t('witch_title') || "Witch's Hut",
                    contentElement,
                    icon: '🌙',
                    maxWidth: '520px',
                    onClose: () => {
                        recordWitchVisit(selectedHero, currentDay);
                        emit('updateHero', { hero: selectedHero });
                    }
                });
            }
        };

        renderWitch();
    }
}

export class AcademyModal {
    static show(hero, designs, t) {
        if (!hero) return;

        const designList = designs.length === 0
            ? el('p', { style: { color: 'var(--text-muted)', fontSize: '0.85rem' } }, ['No designs saved yet.'])
            : el('div', {}, designs.map(d =>
                el('div', { class: 'academy-design-card' }, [
                    el('strong', {}, [d.name]),
                    ` — ${d.glyphIds.length} glyphs, ${d.mpCost} MP`
                ])
            ));

        const contentElement = el('div', { class: 'trainer-dialogue-box academy-dialogue-box' }, [
            el('div', { style: { marginBottom: '16px' } }, [
                el('h4', { style: { fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' } }, [
                    t('ui_design_library') || 'Design Library'
                ]),
                designList
            ]),
            el('div', {
                class: 'trainer-footer',
                style: {
                    display: 'flex',
                    justifyContent: 'flex-end',
                    marginTop: '15px',
                    borderTop: '1px solid var(--glass-border)',
                    paddingTop: '10px'
                }
            }, [
                el('button', {
                    class: 'btn btn-secondary btn-sm',
                    onClick: () => modal.close()
                }, [t('ui_btn_close') || 'Close'])
            ])
        ]);

        const modal = BaseModal.show({
            title: t('academy_title') || 'Glyph Academy',
            contentElement,
            icon: '📚',
            maxWidth: '540px'
        });
    }
}

export class HallOfFameModal {
    static show(hero, t) {
        if (!hero) return;

        const stats = hero.lifetimeStats || {};
        const titles = hero.titles || [];

        const statGrid = el('div', { class: 'hall-stat-grid' }, [
            el('div', { class: 'hall-stat' }, [
                el('span', {}, [t('ui_stats_enemies_defeated') || 'Enemies']),
                el('strong', {}, [String(stats.enemiesDefeated || 0)])
            ]),
            el('div', { class: 'hall-stat' }, [
                el('span', {}, [t('ui_stats_damage_dealt') || 'Damage']),
                el('strong', {}, [String(stats.damageDealt || 0)])
            ]),
            el('div', { class: 'hall-stat' }, [
                el('span', {}, [t('ui_stats_expeditions') || 'Expeditions']),
                el('strong', {}, [String(stats.expeditionsCompleted || 0)])
            ]),
            el('div', { class: 'hall-stat' }, [
                el('span', {}, [t('ui_stats_battles_won') || 'Wins']),
                el('strong', {}, [String(stats.battlesWon || 0)])
            ])
        ]);

        const titlesEl = titles.length === 0
            ? el('span', { style: { color: 'var(--text-muted)', fontSize: '0.85rem' } }, ['No titles yet.'])
            : el('div', { class: 'hall-titles' }, titles.map(title =>
                el('span', { class: 'hall-title-badge' }, [t(title) || title])
            ));

        const contentElement = el('div', { class: 'trainer-dialogue-box hall-dialogue-box' }, [
            el('div', { style: { marginBottom: '16px' } }, [statGrid]),
            el('div', { style: { marginBottom: '16px' } }, [
                el('h4', { style: { fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' } }, ['Titles']),
                titlesEl
            ]),
            el('div', {
                class: 'trainer-footer',
                style: {
                    display: 'flex',
                    justifyContent: 'flex-end',
                    marginTop: '15px',
                    borderTop: '1px solid var(--glass-border)',
                    paddingTop: '10px'
                }
            }, [
                el('button', {
                    class: 'btn btn-secondary btn-sm',
                    onClick: () => modal.close()
                }, [t('ui_btn_close') || 'Close'])
            ])
        ]);

        const modal = BaseModal.show({
            title: t('hall_of_fame_title') || 'Hall of Fame',
            contentElement,
            icon: '🏆',
            maxWidth: '480px'
        });
    }
}
