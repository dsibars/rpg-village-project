import { el } from '../../shared/utils/DOMUtils.js';

export function createExpeditionDetailPane({ onStart, onRecall, t }) {
    // Empty state
    const emptyStateRef = el('div', { class: 'empty-detail' }, [
        el('p', { dataI18n: 'explore_uxelm_select_expedition' }, [t('explore_uxelm_select_expedition')])
    ]);

    // Dashboard section (active or warning)
    const dashboardRef = el('div');

    // Profile refs
    const badgeRef = el('span', { class: 'profile-badge' });
    const nameRef = el('h2');
    const stagesRef = el('p');
    const rewardRef = el('p');
    const enemiesLabelRef = el('div', { style: { marginTop: '8px' } });

    // Hero selector refs
    const heroListRef = el('div');
    const startBtnRef = el('button', { class: ['btn', 'btn-primary', 'btn-start-exp'] });

    const contentRef = el('div', { style: { display: 'none' } }, [
        dashboardRef,
        el('div', { class: 'expedition-profile' }, [
            el('header', { class: 'building-profile-header' }, [
                el('div', { class: 'profile-title-group' }, [badgeRef, nameRef])
            ]),
            el('div', { class: 'exp-stats' }, [
                stagesRef,
                rewardRef,
                enemiesLabelRef
            ]),
            el('div', { class: 'hero-selector' }, [
                el('h3', {}, [t('explore_uxelm_select_heroes')]),
                heroListRef,
                startBtnRef
            ])
        ])
    ]);

    const root = el('div', { style: { height: '100%' } }, [emptyStateRef, contentRef]);

    let selectedHeroIds = new Set();
    let currentExpedition = null;
    let currentMode = null;

    startBtnRef.addEventListener('click', () => {
        if (currentMode !== 'active' && selectedHeroIds.size === 0) {
            alert(t('explore_uxelm_select_one_hero'));
            return;
        }
        onStart({ expId: currentExpedition.id, heroIds: Array.from(selectedHeroIds) });
    });

    function update({ expedition, mode, state }) {
        const activeExpeditions = state.activeExpeditions || [];
        const maxConcurrentExpeditions = state.maxConcurrentExpeditions || 1;
        const isAtMax = activeExpeditions.length >= maxConcurrentExpeditions;

        if (!expedition) {
            emptyStateRef.style.display = 'flex';
            contentRef.style.display = 'none';
            return;
        }

        // Reset selections when expedition changes
        if (currentExpedition?.id !== expedition.id) {
            selectedHeroIds = new Set();
        }
        currentExpedition = expedition;
        currentMode = mode;

        emptyStateRef.style.display = 'none';
        contentRef.style.display = 'block';

        const activeExp = activeExpeditions.find(e => e.id === expedition.id);
        const isActiveNode = !!activeExp;
        const isLocked = isActiveNode && activeExp.currentStage > 0;

        // Dashboard
        dashboardRef.innerHTML = '';
        if (isActiveNode) {
            const isStageZero = activeExp.currentStage === 0;
            const progressPct = (activeExp.currentStage / expedition.stages.length) * 100;
            const retireBtn = el('button', {
                class: ['btn', 'btn-secondary', 'btn-retire'],
                style: { width: '100%', marginTop: '10px' },
                onClick: () => onRecall({ expId: expedition.id })
            }, [t('explore_uxelm_unassign_retire')]);

            dashboardRef.appendChild(el('div', {
                class: 'active-expedition-dashboard',
                style: {
                    marginBottom: '20px',
                    padding: '15px',
                    border: '1px solid var(--border-color)',
                    background: 'rgba(0,0,0,0.2)'
                }
            }, [
                el('h3', { style: { marginTop: '0', color: 'var(--accent-color)' } }, [t('explore_uxelm_assigned_expedition')]),
                el('p', { class: 'description' }, [isStageZero ? t('explore_uxelm_waiting_combat') : t('explore_uxelm_progress_combat')]),
                el('div', { class: 'exp-progress' }, [
                    el('h4', {}, [`${t('explore_uxelm_stage')} ${activeExp.currentStage} / ${expedition.stages.length}`]),
                    el('div', {
                        class: 'progress-bar-container',
                        style: { background: 'rgba(255,255,255,0.1)', height: '10px', borderRadius: '5px', margin: '10px 0' }
                    }, [
                        el('div', {
                            class: 'progress-bar',
                            style: { background: 'var(--accent-color)', height: '100%', borderRadius: '5px', width: `${progressPct}%` }
                        })
                    ])
                ]),
                retireBtn
            ]));
        } else if (isAtMax) {
            dashboardRef.appendChild(el('div', {
                class: 'alert alert-warning',
                style: { marginBottom: '20px' }
            }, [t('explore_uxelm_max_expeditions_reached')]));
        }

        // Profile
        badgeRef.textContent = expedition.isStory ? t('explore_uxelm_story') : t('explore_uxelm_exploration');
        const displayName = t(expedition.id) !== expedition.id ? t(expedition.id) : expedition.name;
        nameRef.textContent = displayName;
        stagesRef.innerHTML = '';
        stagesRef.append(
            el('strong', {}, [`${t('explore_uxelm_stages')}: `]),
            `${expedition.stages.length}`
        );
        rewardRef.innerHTML = '';
        rewardRef.append(
            el('strong', {}, [`${t('explore_uxelm_base_reward')}: `]),
            `${expedition.reward?.gold || 0} ${t('village_uxelm_gold')}`
        );

        enemiesLabelRef.innerHTML = '';
        const uniqueEnemies = new Set();
        expedition.stages.forEach(s => {
            if (s.enemies) s.enemies.forEach(e => {
                const enemyId = typeof e === 'string' ? e : e.id;
                uniqueEnemies.add(enemyId);
            });
        });
        if (uniqueEnemies.size > 0) {
            enemiesLabelRef.appendChild(
                el('strong', { style: { fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)' } }, [
                    t('explore_uxelm_intel_enemies')
                ])
            );
            const badgesContainer = el('div', { style: { marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '6px' } });
            uniqueEnemies.forEach(e => {
                badgesContainer.appendChild(el('span', {
                    class: 'exp-enemy-badge',
                    style: {
                        background: 'rgba(255,59,48,0.1)',
                        color: '#ff3b30',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        border: '1px solid rgba(255,59,48,0.3)',
                        display: 'inline-block'
                    }
                }, [t('combat_info_' + e)]));
            });
            enemiesLabelRef.appendChild(badgesContainer);
        }

        // Hero selector
        heroListRef.innerHTML = '';
        const idleHeroes = state.heroes?.filter(h => h.activity === 'idle') || [];
        const assignedHeroes = isActiveNode ? state.heroes?.filter(h => activeExp.heroIds.includes(h.id)) || [] : [];

        const busyHeroIds = new Set();
        activeExpeditions.forEach(ae => {
            if (ae.id !== expedition.id) {
                ae.heroIds.forEach(id => busyHeroIds.add(id));
            }
        });

        let canStart = false;

        if (isLocked) {
            const lvlLabel = t('shared_uxelm_level');
            heroListRef.appendChild(el('p', {}, [t('explore_uxelm_roster_locked')]));
            const ul = el('ul');
            assignedHeroes.forEach(h => {
                ul.appendChild(el('li', {}, [`${h.name} (${lvlLabel} ${h.level})`]));
            });
            heroListRef.appendChild(ul);
            startBtnRef.style.display = 'none';
        } else {
            const availableHeroes = [...assignedHeroes, ...idleHeroes].filter(h => !busyHeroIds.has(h.id));

            if (availableHeroes.length === 0) {
                heroListRef.appendChild(el('p', {}, [t('explore_uxelm_no_idle_heroes')]));
                startBtnRef.style.display = 'none';
            } else {
                const checkboxList = el('div', { class: 'hero-checkbox-list' });
                availableHeroes.forEach(h => {
                    const isAssigned = isActiveNode && activeExp.heroIds.includes(h.id);
                    const isChecked = selectedHeroIds.has(h.id) || (isAssigned && selectedHeroIds.size === 0);
                    if (isChecked) selectedHeroIds.add(h.id);

                    const isWounded = h.hp <= 0;
                    const hpColor = isWounded ? '#ff3b30' : (h.hp < h.maxHp * 0.5 ? '#ff9500' : '#4cd964');
                    const hpText = isWounded
                        ? `💀 ${t('explore_uxelm_wounded')}`
                        : `HP: ${h.hp}/${h.maxHp}`;

                    const checkbox = el('input', {
                        type: 'checkbox',
                        value: h.id,
                        class: 'exp-hero-check',
                        checked: isChecked,
                        disabled: isWounded,
                        onChange: (e) => {
                            if (e.target.checked) {
                                selectedHeroIds.add(h.id);
                            } else {
                                selectedHeroIds.delete(h.id);
                            }
                            const hasSelection = selectedHeroIds.size > 0;
                            startBtnRef.disabled = !hasSelection && !isActiveNode;
                        }
                    });

                    checkboxList.appendChild(el('label', {
                        class: ['hero-checkbox-item', isWounded ? 'wounded' : '']
                    }, [
                        checkbox,
                        el('div', { class: 'hero-info', style: isWounded ? { opacity: '0.6' } : {} }, [
                            el('strong', {}, [h.name]),
                            ` (${t('shared_uxelm_level')} ${h.level})`,
                            el('br'),
                            el('small', { style: { color: hpColor, fontWeight: 'bold' } }, [hpText])
                        ])
                    ]));
                });
                heroListRef.appendChild(checkboxList);
                startBtnRef.style.display = '';
            }
        }

        canStart = !isLocked && (!isAtMax || isActiveNode) && (isActiveNode || selectedHeroIds.size > 0);
        startBtnRef.disabled = !canStart;
        startBtnRef.textContent = isActiveNode
            ? t('explore_uxelm_update_assignment')
            : t('explore_uxelm_assign_heroes');
    }

    return { root, update };
}
