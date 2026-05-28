import { el } from '../../shared/utils/DOMUtils.js';
import { Hero } from '../../../../engine/heroes/models/Hero.js';

const STAT_LABELS = {
    hp: 'ui_stats_hp',
    mp: 'ui_stats_mp',
    stamina: 'ui_stats_stamina',
    strength: 'ui_stats_power',
    speed: 'ui_stats_speed',
    defense: 'ui_stats_defense',
    magicPower: 'ui_stats_magic'
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
    const trainerBtn = el('button', { class: 'btn btn-secondary btn-sm', onClick: onOpenTrainer }, ['💪 ' + (t('trainer_title') || 'Training Grounds')]);
    const magicCircleBtn = el('button', { class: 'btn btn-secondary btn-sm', onClick: onOpenMagicCircle }, ['🔮 ' + (t('magic_circle_title') || 'Magic Circle')]);
    const witchBtn = el('button', { class: 'btn btn-secondary btn-sm', onClick: onOpenWitch }, ['🌙 ' + (t('witch_title') || 'Witch\'s Hut')]);
    const academyBtn = el('button', { class: 'btn btn-secondary btn-sm', onClick: onOpenAcademy }, ['📚 ' + (t('academy_title') || 'Glyph Academy')]);
    const hallBtn = el('button', { class: 'btn btn-secondary btn-sm', onClick: onOpenHall }, ['🏆 ' + (t('hall_of_fame_title') || 'Hall of Fame')]);
    const inscribeBtn = el('button', { class: 'btn btn-secondary btn-sm', onClick: onOpenInscribe }, ['✦ ' + (t('body_inscription_title') || 'Body Inscription')]);
    const gambitBtn = el('button', { class: 'btn btn-secondary btn-sm', onClick: onOpenGambits }, ['🎲 ' + (t('gambit_title') || 'Gambits')]);
    const equipmentBtn = el('button', { class: 'btn btn-secondary btn-sm', onClick: onOpenEquipment }, ['🛡️ ' + (t('ui_equipment') || 'Equipment')]);
    const skillsBtn = el('button', { class: 'btn btn-secondary btn-sm', onClick: onOpenSkills }, ['⚔️ ' + (t('ui_skills') || 'Skills')]);

    const buttonsContainer = el('div', { class: 'hero-quick-links' }, [
        trainerBtn, magicCircleBtn, witchBtn, academyBtn, hallBtn, inscribeBtn, gambitBtn, equipmentBtn, skillsBtn
    ]);

    // Stats Grid
    const statsGridRef = el('div', { class: 'stats-grid' });

    const emptyStateRef = el('div', { class: 'empty-detail' }, [
        el('p', { 'data-i18n': 'ui_select_hero' }, [t('ui_select_hero') || 'Select a hero to view stats.'])
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
                el('span', {}, [el('strong', {}, [`${t('ui_activity') || 'Activity'}:`]), statusBadgeRef]),
                el('span', {}, [el('strong', {}, [`${t('ui_experience') || 'Experience'}:`]), expTextRef])
            ]),
            statAlertRef,
            skillAlertRef,
            buttonsContainer
        ])
    ]);

    const rightColumn = el('div', { class: 'hero-profile-right' }, [
        statsGridRef
    ]);

    const contentRef = el('div', { class: 'hero-profile' }, [
        el('div', { class: 'mobile-only-header btn-mobile-back', onClick: onBack }, [
            `← ${t('ui_back') || 'Back to Roster'}`
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
        const activityText = isIdle ? (t('ui_activity_idle') || 'Idle') : (t('ui_activity_expedition') || 'On Expedition');

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

        originBadgeRef.textContent = t(hero.origin) || hero.origin;
        nameRef.textContent = `${hero.name} `;
        levelRef.textContent = `(${t('ui_level') || 'Level'} ${hero.level})`;
        originDescEmRef.textContent = t(hero.origin + '_desc') || '';

        statusBadgeRef.textContent = activityText;
        statusBadgeRef.className = `status-badge ${isIdle ? 'idle' : 'busy'}`;

        expTextRef.textContent = ` ${hero.exp} / ${hero.expToNextLevel}`;

        // Action Quick buttons visibility
        const infra = state?.village?.infrastructure || {};
        magicCircleBtn.style.display = (infra.arcane_sanctum || 0) >= 1 ? '' : 'none';
        witchBtn.style.display = (infra.witchs_hut || 0) >= 1 ? '' : 'none';
        academyBtn.style.display = (infra.arcane_sanctum || 0) >= 2 ? '' : 'none';

        let skillTierPoints = 0;
        if (hero.getSkillTierPoints) {
            skillTierPoints = hero.getSkillTierPoints();
        } else if (hero.knownFamilies) {
            skillTierPoints = hero.knownFamilies.reduce((sum, family) => {
                const tier = (hero.techniqueTiers && hero.techniqueTiers[family]) || 1;
                return sum + (tier + 1);
            }, 0);
        }
        inscribeBtn.style.display = skillTierPoints >= 12 && (hero.magicTier || 0) >= 7 ? '' : 'none';
        gambitBtn.style.display = (state?.heroes || []).some(h => h.level >= 5) ? '' : 'none';

        // Stat Point allocation alert
        const hasStatPoints = hero.statPoints > 0;
        const canAllocate = hasStatPoints && isIdle;
        if (hasStatPoints) {
            statAlertRef.style.display = 'block';
            statAlertRef.className = `stat-points-alert ${canAllocate ? '' : 'locked'}`;
            const labelPattern = canAllocate ? (t('ui_stat_points') || 'Unallocated points: {amount}') : (t('ui_stat_points_busy') || 'Points: {amount} (Busy)');
            statAlertStrongRef.textContent = labelPattern.replace('{amount}', hero.statPoints);
        } else {
            statAlertRef.style.display = 'none';
        }

        // Skill points alert
        const canManageSkills = isIdle;
        const knownFamilies = hero.knownFamilies || ['single_strike'];
        const milestones = Hero.SKILL_POINT_MILESTONES || [1, 5, 10, 15, 20, 25];
        const nextMilestone = milestones.find(m => m > hero.level);

        skillAlertRef.className = `skill-points-alert ${canManageSkills ? '' : 'locked'}`;
        if (hero.skillPoints > 0 && canManageSkills) {
            skillAlertStrongRef.textContent = t('ui_skill_points').replace('{amount}', hero.skillPoints);
            skillAlertSuffixRef.textContent = ' · ' + (t('ui_spend_to_unlock') || 'Spend to unlock a new technique');
        } else if (nextMilestone) {
            skillAlertStrongRef.textContent = t('ui_next_skill_point').replace('{level}', nextMilestone);
            skillAlertSuffixRef.textContent = '';
        } else {
            skillAlertStrongRef.textContent = t('ui_max_families') || 'All techniques unlocked';
            skillAlertSuffixRef.textContent = '';
        }
        if (!canManageSkills) {
            skillAlertSuffixRef.textContent += ' (' + (t('ui_busy') || 'Busy') + ')';
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
            const row = el('div', { class: `stat-row ${stat.id === 'stamina' ? 'stamina-row' : ''}` }, [
                el('span', {}, [t(STAT_LABELS[stat.id]) || stat.id.toUpperCase()]),
                el('div', { class: 'stat-value-group' }, [
                    el('span', {}, [String(stat.val)]),
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
