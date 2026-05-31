import { el } from '../../shared/utils/DOMUtils.js';

const STAT_LABELS = {
    hp: 'heroes_info_stat_hp',
    mp: 'heroes_info_stat_mp',
    stamina: 'heroes_info_stat_stamina',
    strength: 'heroes_info_stat_strength',
    speed: 'heroes_info_stat_speed',
    defense: 'heroes_info_stat_defense',
    magicPower: 'heroes_info_stat_magic_power'
};

export function createHeroProfilePane({
    onAllocateStat,
    onOpenEquip,
    onLearnFamily,
    onOpenTrainer,
    onOpenMagicCircle,
    onOpenWitch,
    onOpenAcademy,
    onOpenHall,
    onOpenInscribe,
    onOpenGambits,
    onOpenEquipment,
    onOpenSkills,
    onBack,
    t
}) {
    // Refs for layout
    const portraitRef = el('img', { class: 'hero-portrait-img' });
    const nameRef = el('h2');
    const levelRef = el('span', { class: 'hero-level-text' });
    const originBadgeRef = el('span', { class: 'profile-badge' });
    const originDescRef = el('p', { class: 'hero-origin-desc' });
    const originDescEmRef = el('em');
    originDescRef.appendChild(originDescEmRef);

    // Status
    const statusBadgeRef = el('span', { class: 'status-badge' });
    const expTextRef = el('span');

    // Point Alerts
    const statAlertRef = el('div', { class: 'stat-points-alert' });
    const statAlertStrongRef = el('strong');
    statAlertRef.appendChild(statAlertStrongRef);
    const skillAlertRef = el('div', { class: 'skill-points-alert', style: { marginTop: '6px', background: 'rgba(99, 102, 241, 0.1)', borderColor: 'rgba(99, 102, 241, 0.3)', padding: '6px 10px', borderRadius: 'var(--radius-md)', fontSize: '0.9rem' } });
    const skillAlertStrongRef = el('strong');
    const skillAlertSuffixRef = el('span');
    skillAlertRef.append(skillAlertStrongRef, skillAlertSuffixRef);

    // Quick-access buttons
    const trainerBtn = el('button', { class: 'btn btn-secondary btn-sm', onClick: onOpenTrainer }, ['💪 ' + t('trainer_uxelm_title')]);
    const magicCircleBtn = el('button', { class: 'btn btn-secondary btn-sm', onClick: onOpenMagicCircle }, ['🔮 ' + t('magic_circle_uxelm_title')]);
    const witchBtn = el('button', { class: 'btn btn-secondary btn-sm', onClick: onOpenWitch }, ['🌙 ' + t('witch_uxelm_title')]);
    const academyBtn = el('button', { class: 'btn btn-secondary btn-sm', onClick: onOpenAcademy }, ['📚 ' + t('academy_uxelm_title')]);
    const hallBtn = el('button', { class: 'btn btn-secondary btn-sm', onClick: onOpenHall }, ['🏆 ' + t('hall_of_fame_uxelm_title')]);
    const inscribeBtn = el('button', { class: 'btn btn-secondary btn-sm', onClick: onOpenInscribe }, ['✦ ' + t('heroes_uxelm_inscription_title')]);
    const gambitBtn = el('button', { class: 'btn btn-secondary btn-sm', onClick: onOpenGambits }, ['🎲 ' + t('gambit_uxelm_title')]);
    const equipmentBtn = el('button', { class: 'btn btn-secondary btn-sm', onClick: onOpenEquipment }, ['🛡️ ' + t('inventory_uxelm_equipment')]);
    const skillsBtn = el('button', { class: 'btn btn-secondary btn-sm', onClick: onOpenSkills }, ['⚔️ ' + t('heroes_uxelm_skills')]);

    const buttonsContainer = el('div', { class: 'hero-quick-links' }, [
        trainerBtn, magicCircleBtn, witchBtn, academyBtn, hallBtn, inscribeBtn, gambitBtn, equipmentBtn, skillsBtn
    ]);

    // Stats Grid
    const statsGridRef = el('div', { class: 'stats-grid' });

    const emptyStateRef = el('div', { class: 'empty-detail' }, [
        el('p', { 'data-i18n': 'heroes_uxelm_select_prompt' }, [t('heroes_uxelm_select_prompt')])
    ]);

    const leftColumn = el('div', { class: 'hero-profile-left' }, [
        el('div', { class: 'hero-portrait-container' }, [portraitRef]),
        el('div', { class: 'hero-detail-info' }, [
            el('div', { class: 'profile-title-group' }, [
                originBadgeRef,
                el('h2', {}, [nameRef, levelRef])
            ]),
            originDescRef,
            el('div', { class: 'hero-status-row' }, [
                el('span', {}, [el('strong', {}, [`${t('heroes_uxelm_activity')}:`]), statusBadgeRef]),
                el('span', {}, [el('strong', {}, [`${t('heroes_uxelm_experience')}:`]), expTextRef])
            ]),
            skillAlertRef,
            buttonsContainer
        ])
    ]);

    const rightColumn = el('div', { class: 'hero-profile-right' }, [
        statAlertRef,
        statsGridRef
    ]);

    const contentRef = el('div', { class: 'hero-profile' }, [
        el('div', { class: 'mobile-only-header btn-mobile-back', onClick: onBack }, [
            `← ${t('shared_uxelm_back')}`
        ]),
        leftColumn,
        rightColumn
    ]);

    const root = el('div', { style: { height: '100%' } }, [
        emptyStateRef,
        contentRef
    ]);

    function update({ hero, state }) {
        if (!hero) {
            emptyStateRef.style.display = 'flex';
            contentRef.style.display = 'none';
            return;
        }

        emptyStateRef.style.display = 'none';
        contentRef.style.display = 'grid';

        const isIdle = hero.activity === 'idle';
        const activityText = isIdle ? t('heroes_status_activity_idle') : t('heroes_status_activity_expedition');

        // Avatar Image
        let avatarSrc = 'assets/heroes/arthur.webp';
        if (hero.avatar) {
            avatarSrc = `assets/heroes/${hero.avatar}`;
        } else {
            const fallbackMap = {
                origin_warrior: 'origin_warrior.webp',
                origin_guard: 'origin_guard.webp',
                origin_thief: 'origin_thief.webp',
                origin_monk: 'origin_monk.webp',
                origin_clown: 'origin_clown.webp',
                origin_poet: 'origin_poet.webp',
                origin_farmer: 'origin_farmer.webp',
                origin_cook: 'origin_cook.webp',
                origin_arcane_initiate: 'origin_arcane_initiate.webp'
            };
            const mapped = fallbackMap[hero.origin] || 'arthur.webp';
            avatarSrc = `assets/heroes/${mapped}`;
        }

        portraitRef.src = avatarSrc;
        portraitRef.alt = hero.name;

        const originKey = 'heroes_info_origin_' + hero.origin.replace('origin_', '');
        originBadgeRef.textContent = t(originKey);
        nameRef.textContent = `${hero.name} `;
        levelRef.textContent = `(${t('shared_uxelm_level')} ${hero.level})`;
        originDescEmRef.textContent = t(originKey + '_desc');

        statusBadgeRef.textContent = activityText;
        statusBadgeRef.className = `status-badge ${isIdle ? 'idle' : 'busy'}`;

        expTextRef.textContent = ` ${hero.exp} / ${hero.expToNextLevel}`;

        // Action Quick buttons visibility
        const infra = state?.village?.infrastructure || {};
        magicCircleBtn.style.display = (infra.arcane_sanctum || 0) >= 1 ? '' : 'none';
        witchBtn.style.display = (infra.witchs_hut || 0) >= 1 ? '' : 'none';
        academyBtn.style.display = (infra.arcane_sanctum || 0) >= 2 ? '' : 'none';

        inscribeBtn.style.display = hero.isInscriptionEligible ? '' : 'none';
        gambitBtn.style.display = (state?.heroes || []).some(h => h.level >= 5) ? '' : 'none';

        // Stat Point allocation alert
        const hasStatPoints = hero.statPoints > 0;
        const canAllocate = hasStatPoints && isIdle;
        if (hasStatPoints) {
            statAlertRef.style.display = 'block';
            statAlertRef.className = `stat-points-alert ${canAllocate ? '' : 'locked'}`;
            const labelPattern = canAllocate ? t('heroes_uxelm_stat_point_available') : t('heroes_uxelm_stat_point_busy');
            statAlertStrongRef.textContent = labelPattern.replace('{amount}', hero.statPoints);
        } else {
            statAlertRef.style.display = 'none';
        }

        // Skill points alert
        const canManageSkills = isIdle;
        const milestones = hero.skillPointMilestones || [1, 5, 10, 15, 20, 25];
        const nextMilestone = milestones.find(m => m > hero.level);

        skillAlertRef.className = `skill-points-alert ${canManageSkills ? '' : 'locked'}`;
        if (hero.skillPoints > 0 && canManageSkills) {
            skillAlertStrongRef.textContent = t('heroes_uxelm_skill_point').replace('{amount}', hero.skillPoints);
            skillAlertSuffixRef.textContent = ' · ' + t('heroes_uxelm_skill_spend_hint');
        } else if (nextMilestone) {
            skillAlertStrongRef.textContent = t('heroes_uxelm_skill_next_milestone').replace('{level}', nextMilestone);
            skillAlertSuffixRef.textContent = '';
        } else {
            skillAlertStrongRef.textContent = t('heroes_uxelm_skill_max_families');
            skillAlertSuffixRef.textContent = '';
        }
        if (!canManageSkills) {
            skillAlertSuffixRef.textContent += ' (' + t('heroes_uxelm_skill_busy') + ')';
        }

        // Stats Grid Allocation Rows
        statsGridRef.innerHTML = '';
        const statsToRender = [
            { id: 'hp', key: 'baseMaxHp', val: `${hero.hp} / ${hero.maxHp}` },
            { id: 'mp', key: 'baseMaxMp', val: `${hero.mp} / ${hero.maxMp}` },
            { id: 'stamina', key: null, val: `${hero.stamina} / ${hero.maxStamina}` },
            { id: 'strength', key: 'baseStrength', val: hero.strength },
            { id: 'speed', key: 'baseSpeed', val: hero.speed },
            { id: 'defense', key: 'baseDefense', val: hero.defense },
            { id: 'magicPower', key: 'baseMagicPower', val: hero.magicPower }
        ];

        statsToRender.forEach(stat => {
            const assignBtn = (canAllocate && stat.key)
                ? el('button', { class: 'btn-assign-stat', onClick: () => onAllocateStat(stat.key) }, ['+'])
                : null;
            const descKey = `${STAT_LABELS[stat.id]}_desc`;
            const row = el('div', { class: `stat-row ${stat.id === 'stamina' ? 'stamina-row' : ''}` }, [
                el('div', { class: 'stat-info' }, [
                    el('strong', { class: 'stat-name' }, [t(STAT_LABELS[stat.id])]),
                    el('span', { class: 'stat-desc', style: { fontStyle: 'italic', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' } }, [t(descKey)])
                ]),
                el('div', { class: 'stat-value-group', style: { display: 'flex', alignItems: 'center', gap: '10px' } }, [
                    el('span', { class: 'stat-val', style: { fontWeight: '600' } }, [String(stat.val)]),
                    assignBtn
                ].filter(Boolean))
            ]);
            statsGridRef.appendChild(row);
        });
    }

    return {
        root,
        update
    };
}
