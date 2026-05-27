import { el } from '../../shared/utils/DOMUtils.js';

function getUpgradeCost(buildingId, nextLevel) {
    if (buildingId === 'farm') {
        if (nextLevel === 1) return { gold: 30, wood: 10, stone: 0, duration: 1 };
        if (nextLevel === 2) return { gold: 80, wood: 30, stone: 10, duration: 3 };
    }
    if (buildingId === 'housing') {
        if (nextLevel === 2) return { gold: 150, wood: 40, stone: 10, duration: 4 };
        if (nextLevel === 3) return { gold: 300, wood: 90, stone: 45, duration: 6 };
    }
    if (buildingId === 'warehouse') {
        if (nextLevel === 2) return { gold: 120, wood: 50, stone: 30, duration: 4 };
    }
    if (buildingId === 'blacksmith') {
        if (nextLevel === 1) return { gold: 150, wood: 50, stone: 30, duration: 3 };
    }
    if (buildingId === 'infirmary') {
        if (nextLevel === 1) return { gold: 150, wood: 100, stone: 0, duration: 3 };
        if (nextLevel === 2) return { gold: 400, wood: 200, stone: 100, duration: 5 };
        if (nextLevel === 3) return { gold: 800, wood: 300, stone: 200, duration: 7 };
    }
    if (buildingId === 'tavern') {
        if (nextLevel === 1) return { gold: 200, wood: 100, stone: 50, duration: 3 };
    }
    if (buildingId === 'witchs_hut') {
        if (nextLevel === 1) return { gold: 200, wood: 80, stone: 30, duration: 2 };
    }
    if (buildingId === 'arcane_sanctum') {
        if (nextLevel === 1) return { gold: 500, wood: 100, stone: 50, duration: 3 };
        if (nextLevel === 2) return { gold: 1500, wood: 200, stone: 100, duration: 5 };
        if (nextLevel === 3) return { gold: 3000, wood: 400, stone: 200, duration: 7 };
        if (nextLevel === 4) return { gold: 6000, wood: 800, stone: 400, duration: 10 };
    }
    if (buildingId === 'explorer_guild') {
        if (nextLevel === 1) return { gold: 300, wood: 200, stone: 100, duration: 4 };
        if (nextLevel === 2) return { gold: 800, wood: 400, stone: 200, duration: 7 };
    }
    if (buildingId === 'training_grounds') {
        if (nextLevel === 1) return { gold: 300, wood: 150, stone: 50, duration: 5 };
    }
    // Fallback default
    return {
        gold: nextLevel * 100,
        wood: nextLevel * 50,
        stone: nextLevel * 25,
        duration: nextLevel * 2
    };
}

function createBuildingStatsComparison(id, currentLevel, nextLevel, t) {
    let currentEffect = '';
    let nextEffect = '';
    let label = '';

    if (id === 'farm') {
        label = t('ui_effect_grain') || 'Daily Grain';
        currentEffect = `+${4 * currentLevel}`;
        nextEffect = `+${4 * nextLevel}`;
    } else if (id === 'housing') {
        label = t('ui_effect_pop') || 'Max Villagers';
        const calcPop = (lvl) => {
            if (lvl <= 0) return 0;
            if (lvl === 1) return 3;
            if (lvl === 2) return 10;
            return 20 + (lvl - 3) * 10;
        };
        currentEffect = `${calcPop(currentLevel)}`;
        nextEffect = `${calcPop(nextLevel)}`;
    } else if (id === 'warehouse') {
        label = t('ui_effect_storage') || 'Max Storage';
        const calcStorage = (lvl) => {
            if (lvl <= 0) return 100;
            if (lvl === 1) return 200;
            if (lvl === 2) return 500;
            return 500 + (lvl - 2) * 500;
        };
        currentEffect = `${calcStorage(currentLevel)} 🪵/🪨`;
        nextEffect = `${calcStorage(nextLevel)} 🪵/🪨`;
    } else if (id === 'blacksmith') {
        label = t('ui_effect_forge') || 'Forge Features';
        currentEffect = currentLevel >= 1 ? 'Iron Gear' : 'Locked';
        nextEffect = 'Iron Gear & Refining';
    } else if (id === 'infirmary') {
        label = t('ui_effect_heal') || 'Passive Healing';
        currentEffect = `+${currentLevel * 10}%`;
        nextEffect = `+${nextLevel * 10}%`;
    } else if (id === 'tavern') {
        label = t('ui_effect_tavern') || 'Recruitment';
        currentEffect = currentLevel >= 1 ? (t('ui_unlocked') || 'Unlocked') : (t('ui_locked') || 'Locked');
        nextEffect = currentLevel >= 1 ? (t('ui_cheaper_recruits') || 'Cheaper recruits') : (t('ui_unlocked') || 'Unlocked');
    } else if (id === 'witchs_hut') {
        label = t('ui_effect_witch') || 'Magic Readings';
        currentEffect = currentLevel >= 1 ? (t('ui_unlocked') || 'Unlocked') : (t('ui_locked') || 'Locked');
        nextEffect = currentLevel >= 1 ? (t('ui_more_insights') || 'More insights') : (t('ui_unlocked') || 'Unlocked');
    } else if (id === 'arcane_sanctum') {
        label = t('ui_effect_academy') || 'Glyph Academy';
        currentEffect = currentLevel >= 1 ? `${t('ui_slots') || 'Slots'}: ${currentLevel}` : (t('ui_locked') || 'Locked');
        nextEffect = `${t('ui_slots') || 'Slots'}: ${nextLevel}`;
    } else if (id === 'explorer_guild') {
        label = t('ui_effect_expeditions') || 'Expeditions';
        currentEffect = currentLevel >= 1 ? (t('ui_unlocked') || 'Unlocked') : (t('ui_locked') || 'Locked');
        nextEffect = currentLevel >= 1 ? (t('ui_tier3_maps') || 'Tier 3 maps') : (t('ui_unlocked') || 'Unlocked');
    } else if (id === 'training_grounds') {
        label = t('ui_effect_training') || 'Passive EXP';
        currentEffect = currentLevel >= 1 ? `+${currentLevel * 5}%` : (t('ui_locked') || 'Locked');
        nextEffect = `+${nextLevel * 5}%`;
    }

    return el('div', { class: 'building-stats-comparison' }, [
        el('h4', {}, [t('ui_building_effects') || 'Building Effects']),
        el('div', { class: 'building-stat-row' }, [
            el('span', { class: 'building-stat-label' }, [label]),
            el('span', { class: 'building-stat-values' }, [
                currentEffect,
                ' ➡️ ',
                el('span', { class: 'building-stat-next' }, [nextEffect])
            ])
        ])
    ]);
}

export function createBuildingDetailPane({ onBuild, onUpgrade, t }) {
    // Empty state
    const emptyStateRef = el('div', { class: 'empty-detail' }, [
        el('div', { class: 'detail-icon-bg' }, ['🏢']),
        el('p', { dataI18n: 'ui_select_building' }, [t('ui_select_building')])
    ]);

    // Header
    const nameRef = el('h2');
    const badgeRef = el('span', { class: 'profile-badge' });
    const levelRef = el('span', { class: 'value' });

    const headerRef = el('header', { class: 'building-profile-header' }, [
        el('div', { class: 'profile-title-group' }, [
            badgeRef,
            nameRef
        ]),
        el('div', { class: 'profile-stat' }, [
            el('span', { class: 'label' }, [t('ui_current_level') || 'CURRENT LEVEL']),
            levelRef
        ])
    ]);

    // Icon
    const iconRef = el('div', { class: 'building-preview-icon' });

    // Description
    const descRef = el('p', { class: 'building-description' });

    // Stats comparison container
    const statsComparisonRef = el('div');

    // Upgrade section
    const nextUpgradeTitleRef = el('h3');
    const costGridRef = el('div', { class: 'cost-grid' });
    const actionFooterRef = el('div', { class: 'action-footer' });

    const upgradeSectionRef = el('div', { class: 'upgrade-section' }, [
        nextUpgradeTitleRef,
        costGridRef,
        actionFooterRef
    ]);

    const contentRef = el('div', { class: 'building-profile' }, [
        headerRef,
        el('div', { class: 'building-detail-grid' }, [
            el('div', { class: 'building-detail-visual-column' }, [
                el('div', { class: 'building-preview-card' }, [iconRef])
            ]),
            el('div', { class: 'building-detail-info-column' }, [
                descRef,
                statsComparisonRef,
                upgradeSectionRef
            ])
        ])
    ]);

    const root = el('div', { style: { height: '100%' } }, [emptyStateRef, contentRef]);

    const icons = {
        housing: '🏠',
        farm: '🌾',
        warehouse: '📦',
        blacksmith: '⚒️',
        infirmary: '🏥',
        witchs_hut: '🔮',
        arcane_sanctum: '✨',
        explorer_guild: '🧭',
        training_grounds: '💪',
        tavern: '🍺'
    };

    function update({ buildingId, village, state }) {
        if (!buildingId) {
            emptyStateRef.style.display = 'flex';
            contentRef.style.display = 'none';
            return;
        }

        emptyStateRef.style.display = 'none';
        contentRef.style.display = 'block';

        const currentLevel = village.infrastructure[buildingId];
        const nextLevel = currentLevel + 1;
        const cost = getUpgradeCost(buildingId, nextLevel);
        const activeProject = village.constructionQueue.find(p => p.buildingId === buildingId);

        const hasGold = village.gold >= cost.gold;
        const woodCount = state.inventory?.materials?.material_wood || 0;
        const hasWood = woodCount >= cost.wood;
        const stoneCount = state.inventory?.materials?.material_stone || 0;
        const hasStone = stoneCount >= cost.stone;

        // Header
        badgeRef.textContent = t('ui_infrastructure') || 'INFRASTRUCTURE';
        nameRef.textContent = t('village_' + buildingId);
        levelRef.textContent = String(currentLevel);

        // Icon
        iconRef.textContent = icons[buildingId] || '🏢';

        // Description
        descRef.textContent = t('desc_' + buildingId);

        // Stats comparison
        statsComparisonRef.innerHTML = '';
        statsComparisonRef.appendChild(createBuildingStatsComparison(buildingId, currentLevel, nextLevel, t));

        // Upgrade title
        nextUpgradeTitleRef.textContent = (t('ui_next_upgrade') || 'Next Upgrade: Level {level}').replace('{level}', nextLevel);

        // Cost grid
        costGridRef.innerHTML = '';
        costGridRef.appendChild(el('div', { class: ['cost-item', !hasGold ? 'insufficient' : ''] }, [
            el('span', { class: 'label' }, [t('village_gold') || 'GOLD']),
            el('span', { class: 'value' }, [`💰 ${cost.gold}`])
        ]));

        if (cost.wood > 0) {
            costGridRef.appendChild(el('div', { class: ['cost-item', !hasWood ? 'insufficient' : ''] }, [
                el('span', { class: 'label' }, [t('material_wood') || 'WOOD']),
                el('span', { class: 'value' }, [`🪵 ${cost.wood}`])
            ]));
        }

        if (cost.stone > 0) {
            costGridRef.appendChild(el('div', { class: ['cost-item', !hasStone ? 'insufficient' : ''] }, [
                el('span', { class: 'label' }, [t('material_stone') || 'STONE']),
                el('span', { class: 'value' }, [`🪨 ${cost.stone}`])
            ]));
        }

        costGridRef.appendChild(el('div', { class: 'cost-item' }, [
            el('span', { class: 'label' }, [t('ui_time') || 'TIME']),
            el('span', { class: 'value' }, [`⏳ ${cost.duration} ${t('ui_days') || 'Days'}`])
        ]));

        // Action footer
        actionFooterRef.innerHTML = '';
        if (activeProject) {
            actionFooterRef.appendChild(el('button', { class: ['btn', 'btn-secondary', 'btn-lg'], disabled: true }, [
                `⏳ ${t('ui_under_construction') || 'Under Construction'} (${activeProject.daysRemaining}d)`
            ]));
        } else {
            const canAfford = hasGold && hasWood && hasStone;
            actionFooterRef.appendChild(el('button', {
                class: ['btn', 'btn-primary', 'btn-lg', 'upgrade-btn'],
                disabled: !canAfford,
                onClick: () => {
                    const materials = {};
                    if (cost.wood > 0) materials.material_wood = cost.wood;
                    if (cost.stone > 0) materials.material_stone = cost.stone;
                    onUpgrade({
                        buildingId,
                        targetLevel: nextLevel,
                        costGold: cost.gold,
                        costMaterials: materials,
                        duration: cost.duration
                    });
                }
            }, [
                el('span', { class: 'icon' }, ['⚒️']),
                t('btn_confirm')
            ]));
        }
    }

    return { root, update };
}
