import { el, diffList } from '../../shared/utils/DOMUtils.js';
import { getEquipmentName } from '../../shared/EquipmentHelper.js';
import { TECHNIQUE_FAMILIES } from '../../../../engine/shared/data/GameConstants.js';
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

function canBodyInscribe(hero) {
    let skillTierPoints = 0;
    if (hero.getSkillTierPoints) {
        skillTierPoints = hero.getSkillTierPoints();
    } else if (hero.knownFamilies) {
        skillTierPoints = hero.knownFamilies.reduce((sum, family) => {
            const tier = (hero.techniqueTiers && hero.techniqueTiers[family]) || 1;
            return sum + (tier + 1);
        }, 0);
    }
    return skillTierPoints >= 12 && (hero.magicTier || 0) >= 7;
}

/**
 * Generate a human-readable effect label for a technique family.
 */
function getFamilyEffectLabel(family, tier = 1, t) {
    switch (family.id) {
        case 'single_strike':
            return t('effect_basic_attack') || 'Basic attack';
        case 'multiple_attack': {
            const hits = Math.max(1, tier);
            const perHit = Math.max(0.4, family.baseMult - family.hitDecay * Math.max(0, tier - 2));
            return `${hits} ${t('effect_hits') || 'hits'} · ${(hits * perHit).toFixed(1)}×`;
        }
        case 'power_strike': {
            const mult = family.baseMult + family.growth * (tier - 1);
            return `${mult.toFixed(1)}× ${t('effect_power') || 'power'}`;
        }
        case 'cleave':
            return t('effect_cleave') || 'Cleave';
        case 'shield_bash':
            return t('effect_stun') || 'Stun';
        case 'poison_strike':
            return t('effect_poison') || 'Poison';
        case 'plunder':
            return t('effect_steal') || 'Steal';
        default:
            return '';
    }
}

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

    // Buttons
    const trainerBtn = el('button', { class: 'btn btn-secondary btn-sm', onClick: onOpenTrainer }, ['💪 ' + (t('trainer_title') || 'Training Grounds')]);
    const magicCircleBtn = el('button', { class: 'btn btn-secondary btn-sm', style: { marginLeft: '6px' }, onClick: onOpenMagicCircle }, ['🔮 ' + (t('magic_circle_title') || 'Magic Circle')]);
    const witchBtn = el('button', { class: 'btn btn-secondary btn-sm', style: { marginLeft: '6px' }, onClick: onOpenWitch }, ['🌙 ' + (t('witch_title') || 'Witch\'s Hut')]);
    const academyBtn = el('button', { class: 'btn btn-secondary btn-sm', style: { marginLeft: '6px' }, onClick: onOpenAcademy }, ['📚 ' + (t('academy_title') || 'Glyph Academy')]);
    const hallBtn = el('button', { class: 'btn btn-secondary btn-sm', style: { marginLeft: '6px' }, onClick: onOpenHall }, ['🏆 ' + (t('hall_of_fame_title') || 'Hall of Fame')]);
    const inscribeBtn = el('button', { class: 'btn btn-secondary btn-sm', style: { marginLeft: '6px' }, onClick: onOpenInscribe }, ['✦ ' + (t('body_inscription_title') || 'Body Inscription')]);
    const gambitBtn = el('button', { class: 'btn btn-secondary btn-sm', style: { marginLeft: '6px' }, onClick: onOpenGambits }, ['🎲 ' + (t('gambit_title') || 'Gambits')]);

    const buttonsContainer = el('div', { style: { marginTop: '8px' } }, [
        trainerBtn, magicCircleBtn, witchBtn, academyBtn, hallBtn, inscribeBtn, gambitBtn
    ]);

    // Stats Grid
    const statsGridRef = el('div', { class: 'stats-grid' });

    // Equipment Silhouette Diagram slots
    const equipSlots = ['head', 'body', 'legs', 'leftHand', 'rightHand', 'accessory'];
    const slotIcons = {
        head: '🪖',
        body: '🦺',
        legs: '👢',
        leftHand: '⚔️',
        rightHand: '🛡️',
        accessory: '💍'
    };

    const slotMap = new Map();
    const diagramSlots = equipSlots.map(slot => {
        const itemTextEl = el('div', { class: 'eq-slot-item' });
        const slotEl = el('div', {
            class: `equip-slot eq-slot-${slot}`,
            'data-slot': slot,
            onClick: () => onOpenEquip(slot)
        }, [
            el('div', { class: 'eq-slot-icon' }, [slotIcons[slot]]),
            el('div', { class: 'eq-slot-label' }, [t('slot_' + slot) || slot]),
            itemTextEl
        ]);

        slotMap.set(slot, { slotEl, itemTextEl });
        return slotEl;
    });

    const equipmentDiagramRef = el('div', { class: 'equipment-diagram' }, [
        el('div', { class: 'eq-body-silhouette' }, [
            el('div', { class: 'silhouette-head' }),
            el('div', { class: 'silhouette-torso' }),
            el('div', { class: 'silhouette-legs' })
        ]),
        ...diagramSlots
    ]);

    const setBonusesContainerRef = el('div', { class: 'set-bonuses-list' });
    const skillsListRef = el('div', { class: 'skills-list' });

    const emptyStateRef = el('div', { class: 'empty-detail' }, [
        el('p', { 'data-i18n': 'ui_select_hero' }, [t('ui_select_hero') || 'Select a hero to view stats.'])
    ]);

    const contentRef = el('div', { class: 'hero-profile' }, [
        el('div', { class: 'mobile-only-header btn-mobile-back', onClick: onBack }, [
            `← ${t('ui_back') || 'Back to Roster'}`
        ]),
        el('div', { class: 'hero-detail-header-card' }, [
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
        ]),
        statsGridRef,
        el('div', { class: 'hero-sections-grid' }, [
            el('div', { class: 'hero-section' }, [
                el('h3', {}, [t('ui_equipment') || 'Equipment']),
                el('div', { class: 'equipment-list' }, [equipmentDiagramRef]),
                setBonusesContainerRef
            ]),
            el('div', { class: 'hero-section' }, [
                el('h3', {}, [t('ui_skills') || 'Skills']),
                skillsListRef
            ])
        ])
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
        contentRef.style.display = 'block';

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
        inscribeBtn.style.display = canBodyInscribe(hero) ? '' : 'none';
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

        // 1. Stats Grid Allocation Rows
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

        // 2. Equipment Diagram
        equipSlots.forEach(slot => {
            const { slotEl, itemTextEl } = slotMap.get(slot);
            const hasItem = !!hero.equipment[slot];
            const itemName = hasItem ? getEquipmentName(hero.equipment[slot], t) : t('ui_empty_slot');
            const clickableClass = isIdle ? 'clickable' : 'locked';

            slotEl.className = `equip-slot eq-slot-${slot} ${clickableClass} ${hasItem ? 'has-item' : ''}`;
            itemTextEl.textContent = itemName;
            itemTextEl.title = itemName;
        });

        // 3. Set Bonuses
        setBonusesContainerRef.innerHTML = '';
        if (hero.activeSetBonuses && hero.activeSetBonuses.length > 0) {
            hero.activeSetBonuses.forEach(sb => {
                const setName = t(sb.setName) || sb.setName;
                const bonusLines = Object.entries(sb.bonus).map(([stat, val]) => {
                    const sign = val > 0 ? '+' : '';
                    const label = t('ui_stats_' + stat) || stat.toUpperCase();
                    return `${sign}${val} ${label}`;
                }).join(', ');

                const setBlock = el('div', { class: 'set-bonus-block' }, [
                    el('div', { class: 'set-bonus-header' }, [
                        el('span', { class: 'set-bonus-name' }, [setName]),
                        el('span', { class: 'set-bonus-pieces' }, [`(${sb.pieces}/${sb.threshold})`])
                    ]),
                    el('div', { class: 'set-bonus-stats' }, [bonusLines])
                ]);
                setBonusesContainerRef.appendChild(setBlock);
            });
        }

        // 4. Skills list (diff list reconciliation)
        const allFamilies = Object.values(TECHNIQUE_FAMILIES);
        const knownFamilyIds = new Set(knownFamilies);
        const knownList = allFamilies.filter(f => knownFamilyIds.has(f.id));
        const lockedList = allFamilies.filter(f => !knownFamilyIds.has(f.id) && f.id !== 'single_strike');

        // Sort known by tier (highest first)
        knownList.sort((a, b) => {
            const tierA = hero.techniqueTiers && hero.techniqueTiers[a.id] || 1;
            const tierB = hero.techniqueTiers && hero.techniqueTiers[b.id] || 1;
            return tierB - tierA;
        });

        const newSkillRows = [];

        // Add learned skills
        knownList.forEach(family => {
            const familyId = family.id;
            const tier = hero.techniqueTiers && hero.techniqueTiers[familyId] || 1;
            const staCost = family.staminaCostBase + family.staminaCostPerTier * (tier - 1);
            const uses = hero.techniqueUses && hero.techniqueUses[familyId] || 0;
            const isBodyInscribed = hero.bodyInscription && hero.bodyInscription.glyphIds && hero.bodyInscription.glyphIds.length > 0;

            const cumulativeToCurrent = tier <= 1 ? 0 : 50 * (Math.pow(3, tier - 1) - 1);
            const tierThreshold = Math.floor(100 * Math.pow(3, tier - 1));
            const usesInTier = Math.max(0, uses - cumulativeToCurrent);
            const tierProgress = Math.min(100, Math.floor((usesInTier / tierThreshold) * 100));

            const isJustLeveled = (usesInTier === 0 && tier > 1);
            const flashClass = isJustLeveled ? 'tier-up-flash' : '';
            const effectLabel = getFamilyEffectLabel(family, tier, t);

            const row = el('div', {
                class: `skill-item skill-learned ${isBodyInscribed ? 'skill-inscribed' : ''}`,
                'data-id': familyId
            }, [
                el('div', { class: 'skill-info', style: { flex: '1', paddingRight: '15px' } }, [
                    el('span', { class: 'skill-name' }, [`${t('family_' + familyId)}${isBodyInscribed ? ' · ✦' : ''}`]),
                    el('span', { class: 'skill-meta' }, [`${effectLabel ? effectLabel + ' · ' : ''}${staCost} STA`]),
                    el('div', { class: 'skill-tier-progress-container', style: { marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' } }, [
                        el('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '2px' } }, [
                            el('span', {}, [t('ui_tier_progress') || 'Tier Progress'])
                        ]),
                        el('div', { class: `skill-tier-bar ${flashClass}`, style: { height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden', position: 'relative' } }, [
                            el('div', { style: { width: `${tierProgress}%`, height: '100%', background: 'var(--accent-color)', borderRadius: '3px', transition: 'width 0.3s ease' } })
                        ])
                    ])
                ]),
                el('div', { class: 'skill-actions', style: { display: 'flex', alignItems: 'center' } }, [
                    el('span', { class: `skill-tier-badge ${flashClass}` }, [`Tier ${tier}`])
                ])
            ]);
            newSkillRows.push(row);
        });

        // Add divider if locked skills exist
        if (lockedList.length > 0) {
            newSkillRows.push(el('div', {
                class: 'skill-section-divider',
                'data-id': 'divider_locked',
                style: { margin: '12px 0', paddingTop: '8px', borderTop: '1px dashed var(--glass-border)' }
            }, [
                el('span', { style: { fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' } }, [t('ui_locked_families') || 'Locked'])
            ]));

            // Add locked skills
            lockedList.forEach(family => {
                const familyId = family.id;
                const canLearn = canManageSkills && hero.skillPoints > 0 && knownFamilies.length < 6;
                const actionNode = canLearn
                    ? el('button', { class: 'btn btn-primary btn-sm btn-learn-family', onClick: () => onLearnFamily(familyId) }, [t('ui_learn') || 'Learn'])
                    : el('span', { class: 'skill-locked-label' }, [t('ui_locked') || 'Locked']);

                const lockedEffect = getFamilyEffectLabel(family, 1, t);
                const row = el('div', {
                    class: 'skill-item skill-locked',
                    'data-id': familyId
                }, [
                    el('div', { class: 'skill-info' }, [
                        el('span', { class: 'skill-name' }, [`🔒 ${t('family_' + familyId)}`]),
                        el('span', { class: 'skill-meta' }, [`${lockedEffect ? lockedEffect + ' · ' : ''}${family.staminaCostBase} STA`])
                    ]),
                    el('div', { class: 'skill-actions' }, [actionNode])
                ]);
                newSkillRows.push(row);
            });
        }

        diffList(skillsListRef, newSkillRows, 'data-id');
    }

    return {
        root,
        update
    };
}
