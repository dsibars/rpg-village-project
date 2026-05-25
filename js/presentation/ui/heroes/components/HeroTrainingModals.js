import { BaseModal } from '../../components/modal/BaseModal.js';
import { TrainerService } from '../../../../engine/trainer/TrainerService.js';
import { WitchService } from '../../../../engine/witch/WitchService.js';

export class TrainerModal {
    static show(hero, i18n, t) {
        if (!hero) return;

        const dialogue = TrainerService.getDialogue(hero, i18n);

        const contentHtml = `
            <div class="trainer-dialogue-box">
                <div class="trainer-lines">
                    ${dialogue.lines.map(line => `<p class="trainer-line">"${line}"</p>`).join('')}
                </div>
                <div class="trainer-footer" style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px; border-top: 1px solid var(--glass-border); padding-top: 10px;">
                    <span class="trainer-category" style="font-size: 0.8rem; color: var(--text-muted);">${dialogue.category}</span>
                    <button class="btn btn-secondary btn-sm" id="btn-trainer-close">${t('ui_btn_close') || 'Close'}</button>
                </div>
            </div>
        `;

        const modal = BaseModal.show({
            title: t('trainer_title') || 'Training Grounds',
            contentHtml: contentHtml,
            icon: '💪',
            maxWidth: '480px'
        });

        modal.overlay.querySelector('#btn-trainer-close').addEventListener('click', modal.close);
    }
}

export class WitchModal {
    static show(heroes, selectedHeroId, i18n, t, state, emit) {
        let selectedHero = heroes.find(h => h.id === selectedHeroId) || heroes[0];
        if (!selectedHero) return;

        const currentDay = state.village?.day || 0;
        
        let modalRef = null;

        const renderWitch = () => {
            const dialogue = WitchService.getDialogue(selectedHero, i18n, currentDay);
            WitchService.recordVisit(selectedHero, currentDay);
            const elementIcons = { fire: '🔥', water: '💧', wind: '🌪️', storm: '⚡', light: '✨', dark: '🌑', earth: '🪨', neutral: '🔮' };
            const elementIcon = elementIcons[dialogue.element] || '🔮';

            const contentHtml = `
                <div class="trainer-dialogue-box witch-dialogue-box">
                    <div style="margin-bottom: 12px;">
                        <select id="witch-hero-select" class="gambit-select" style="width: 100%;">
                            ${heroes.map(h => `<option value="${h.id}" ${h.id === selectedHero.id ? 'selected' : ''}>${h.name} (Tier ${h.magicTier || 1})</option>`).join('')}
                        </select>
                    </div>
                    <div class="trainer-lines">
                        ${dialogue.lines.map(line => `<p class="trainer-line witch-line">${elementIcon} "${line}"</p>`).join('')}
                    </div>
                    ${dialogue.masteryHints.length > 0 ? `
                    <div style="margin-top: 8px; font-size: 0.8rem; color: var(--accent-color);">
                        ${t('witch_mastery_detected') || 'Glyph mastery whispers detected...'}
                    </div>
                    ` : ''}
                    <div class="trainer-footer" style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px; border-top: 1px solid var(--glass-border); padding-top: 10px;">
                        <span class="trainer-category witch-category" style="font-size: 0.8rem; color: var(--text-muted);">${dialogue.category} · ${dialogue.element}</span>
                        <button class="btn btn-secondary btn-sm" id="btn-witch-close">${t('ui_btn_close') || 'Close'}</button>
                    </div>
                </div>
            `;

            if (modalRef) {
                // Update existing modal
                modalRef.overlay.querySelector('.modal-content-area').innerHTML = contentHtml;
            } else {
                modalRef = BaseModal.show({
                    title: t('witch_title') || "Witch's Hut",
                    contentHtml: contentHtml,
                    icon: '🌙',
                    maxWidth: '520px',
                    onClose: () => {
                        WitchService.recordVisit(selectedHero);
                        emit('updateHero', { hero: selectedHero });
                    }
                });
            }

            modalRef.overlay.querySelector('#witch-hero-select').addEventListener('change', (e) => {
                selectedHero = heroes.find(h => h.id === e.target.value);
                renderWitch();
            });

            modalRef.overlay.querySelector('#btn-witch-close').addEventListener('click', modalRef.close);
        };

        renderWitch();
    }
}

export class AcademyModal {
    static show(hero, designs, t) {
        if (!hero) return;

        const contentHtml = `
            <div class="trainer-dialogue-box academy-dialogue-box">
                <div style="margin-bottom: 16px;">
                    <h4 style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 8px;">${t('ui_design_library') || 'Design Library'}</h4>
                    ${designs.length === 0 ? `<p style="color: var(--text-muted); font-size: 0.85rem;">No designs saved yet.</p>` :
                        designs.map(d => `<div class="academy-design-card"><strong>${d.name}</strong> — ${d.glyphIds.length} glyphs, ${d.mpCost} MP</div>`).join('')}
                </div>
                <div class="trainer-footer" style="display: flex; justify-content: flex-end; margin-top: 15px; border-top: 1px solid var(--glass-border); padding-top: 10px;">
                    <button class="btn btn-secondary btn-sm" id="btn-academy-close">${t('ui_btn_close') || 'Close'}</button>
                </div>
            </div>
        `;

        const modal = BaseModal.show({
            title: t('academy_title') || 'Glyph Academy',
            contentHtml: contentHtml,
            icon: '📚',
            maxWidth: '540px'
        });

        modal.overlay.querySelector('#btn-academy-close').addEventListener('click', modal.close);
    }
}

export class HallOfFameModal {
    static show(hero, t) {
        if (!hero) return;

        const stats = hero.lifetimeStats || {};
        const titles = hero.titles || [];

        const contentHtml = `
            <div class="trainer-dialogue-box hall-dialogue-box">
                <div style="margin-bottom: 16px;">
                    <div class="hall-stat-grid">
                        <div class="hall-stat"><span>${t('ui_stats_enemies_defeated') || 'Enemies'}</span><strong>${stats.enemiesDefeated || 0}</strong></div>
                        <div class="hall-stat"><span>${t('ui_stats_damage_dealt') || 'Damage'}</span><strong>${stats.damageDealt || 0}</strong></div>
                        <div class="hall-stat"><span>${t('ui_stats_expeditions') || 'Expeditions'}</span><strong>${stats.expeditionsCompleted || 0}</strong></div>
                        <div class="hall-stat"><span>${t('ui_stats_battles_won') || 'Wins'}</span><strong>${stats.battlesWon || 0}</strong></div>
                    </div>
                </div>
                <div style="margin-bottom: 16px;">
                    <h4 style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 8px;">Titles</h4>
                    <div class="hall-titles">
                        ${titles.length === 0 ? '<span style="color: var(--text-muted); font-size: 0.85rem;">No titles yet.</span>' :
                            titles.map(title => `<span class="hall-title-badge">${t(title) || title}</span>`).join('')}
                    </div>
                </div>
                <div class="trainer-footer" style="display: flex; justify-content: flex-end; margin-top: 15px; border-top: 1px solid var(--glass-border); padding-top: 10px;">
                    <button class="btn btn-secondary btn-sm" id="btn-hall-close">${t('ui_btn_close') || 'Close'}</button>
                </div>
            </div>
        `;

        const modal = BaseModal.show({
            title: t('hall_of_fame_title') || 'Hall of Fame',
            contentHtml: contentHtml,
            icon: '🏆',
            maxWidth: '480px'
        });

        modal.overlay.querySelector('#btn-hall-close').addEventListener('click', modal.close);
    }
}
