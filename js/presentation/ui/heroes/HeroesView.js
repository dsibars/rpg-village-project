import { BaseView } from '../BaseView.js';
import { getEquipmentName, getEquipmentStats } from '../shared/EquipmentHelper.js';
import { SKILLS_DATA, TECHNIQUE_FAMILIES, GLYPH_DATA, computeGlyphEffect, computeGlyphCostMult } from '../../../engine/shared/data/GameConstants.js';
import { Hero } from '../../../engine/heroes/models/Hero.js';
import { MagicCircleService } from '../../../engine/magic_circle/MagicCircleService.js';
import { TrainerService } from '../../../engine/trainer/TrainerService.js';
import { WitchService } from '../../../engine/witch/WitchService.js';

export class HeroesView extends BaseView {
    constructor() {
        super('heroes');
        this.selectedHeroId = null;
        this.inventoryEquipment = [];
    }

    onMount() {
        this.elements = {
            list: this.$('#heroes-list-container'),
            detail: this.$('#hero-detail-content'),
            cardTemplate: this.$('#tpl-hero-card'),
            recruitBtn: this.$('#btn-recruit-hero')
        };

        if (this.elements.recruitBtn) {
            this.elements.recruitBtn.addEventListener('click', () => {
                this.emit('recruitHero');
            });
        }

        if (this.elements.list) {
            this.elements.list.addEventListener('click', (e) => {
                const card = e.target.closest('.list-item');
                if (card) {
                    this.selectedHeroId = card.dataset.id;
                    this.ui.update(this.lastRawState); // Force re-render for selection change
                }
            });
        }

        if (this.elements.detail) {
            this.elements.detail.addEventListener('click', (e) => {
                const btn = e.target.closest('.btn-assign-stat');
                if (btn) {
                    const statId = btn.dataset.stat;
                    this.emit('increaseStat', { heroId: this.selectedHeroId, statId });
                    return;
                }

                const slotBtn = e.target.closest('.equip-slot.clickable');
                if (slotBtn) {
                    const slot = slotBtn.dataset.slot;
                    this._openEquipModal(slot);
                    return;
                }

                const learnFamilyBtn = e.target.closest('.btn-learn-family');
                if (learnFamilyBtn) {
                    this.emit('learnFamily', { heroId: this.selectedHeroId, familyId: learnFamilyBtn.dataset.family });
                    return;
                }

                const trainerBtn = e.target.closest('.btn-trainer');
                if (trainerBtn) {
                    this._openTrainerModal();
                    return;
                }

                const magicCircleBtn = e.target.closest('.btn-magic-circle');
                if (magicCircleBtn) {
                    this._openMagicCircleModal();
                    return;
                }

                const witchBtn = e.target.closest('.btn-witch');
                if (witchBtn) {
                    this._openWitchModal();
                    return;
                }

                const academyBtn = e.target.closest('.btn-academy');
                if (academyBtn) {
                    this._openAcademyModal();
                    return;
                }

                const hallBtn = e.target.closest('.btn-hall');
                if (hallBtn) {
                    this._openHallOfFameModal();
                    return;
                }

                const inscribeBtn = e.target.closest('.btn-inscribe');
                if (inscribeBtn) {
                    this._openBodyInscriptionModal();
                    return;
                }

                const gambitBtn = e.target.closest('.btn-gambit');
                if (gambitBtn) {
                    this._openGambitModal();
                    return;
                }
            });
        }
    }

    update(state) {
        this.lastRawState = state;
        const heroes = state.heroes;
        if (!heroes) return;

        this.inventoryEquipment = state.inventory.equipment || [];

        const activeHero = heroes.find(h => h.id === this.selectedHeroId);
        const infra = state.village?.infrastructure || {};
        const anyHeroLevel5 = heroes.some(h => h.level >= 5);
        const stateString = JSON.stringify({
            heroes: heroes.map(h => ({ id: h.id, level: h.level })),
            selection: this.selectedHeroId,
            activeHero: activeHero ? {
                statPoints: activeHero.statPoints,
                skillPoints: activeHero.skillPoints,
                knownFamilies: activeHero.knownFamilies,
                techniqueTiers: activeHero.techniqueTiers,
                techniqueUses: activeHero.techniqueUses,
                hp: activeHero.hp,
                maxHp: activeHero.maxHp,
                mp: activeHero.mp,
                maxMp: activeHero.maxMp,
                stamina: activeHero.stamina,
                maxStamina: activeHero.maxStamina,
                strength: activeHero.strength,
                speed: activeHero.speed,
                defense: activeHero.defense,
                magicPower: activeHero.magicPower,
                equipment: activeHero.equipment
            } : null,
            infrastructure: {
                arcane_sanctum: infra.arcane_sanctum || 0,
                witchs_hut: infra.witchs_hut || 0
            },
            anyHeroLevel5
        });

        if (this.lastRenderedState === stateString) return;

        this.onUpdate(state);
        this.lastRenderedState = stateString;
    }

    onUpdate(state) {
        this.renderHeroesList(state.heroes);
        this.renderRecruitButton(state);
        this.renderHeroDetail(state);
    }

    renderRecruitButton(state) {
        const btn = this.elements.recruitBtn;
        if (!btn) return;

        const tavernLevel = state.village?.infrastructure?.tavern || 0;
        if (tavernLevel < 1) {
            btn.style.display = 'none';
            return;
        }

        btn.style.display = '';
        const heroCount = state.heroes?.length || 0;
        const baseCost = 100;
        const cost = Math.floor(baseCost * Math.pow(1.2, heroCount));
        const canAfford = (state.village?.gold || 0) >= cost;

        btn.disabled = !canAfford;
        btn.textContent = `${this.t('ui_recruit') || 'Recruit'} (${cost}g)`;
        btn.title = canAfford
            ? `${this.t('ui_recruit') || 'Recruit'} ${this.t('ui_hero') || 'Hero'} (${cost}g)`
            : this.t('error_not_enough_gold');
    }

    renderHeroesList(heroes) {
        if (!this.elements.list || !this.elements.cardTemplate) return;

        this.elements.list.innerHTML = '';
        heroes.forEach(hero => {
            const card = this.elements.cardTemplate.content.cloneNode(true).querySelector('.list-item');
            card.dataset.id = hero.id;
            card.querySelector('.list-item-title').textContent = hero.name;
            card.querySelector('.list-item-level').textContent = `${this.t('ui_level') || 'Level'} ${hero.level}`;

            const activityBadge = document.createElement('span');
            activityBadge.className = 'hero-activity-badge';
            activityBadge.textContent = hero.activity === 'idle' ? '💤' : '⚔️';
            activityBadge.title = hero.activity === 'idle'
                ? (this.t('ui_activity_idle') || 'Idle')
                : (this.t('ui_activity_expedition') || 'On Expedition');
            card.querySelector('.list-item-header').appendChild(activityBadge);

            if (hero.mealBuffs && hero.mealBuffs.length > 0) {
                const mealBadge = document.createElement('span');
                mealBadge.className = 'hero-activity-badge';
                mealBadge.textContent = '🍖';
                mealBadge.title = this.t('ui_has_meal_buff') || 'Meal buff active';
                mealBadge.style.marginLeft = '4px';
                card.querySelector('.list-item-header').appendChild(mealBadge);
            }

            if (hero.id === this.selectedHeroId) {
                card.classList.add('active');
            }

            this.elements.list.appendChild(card);
        });
    }

    renderHeroDetail(state) {
        if (!this.elements.detail) return;

        const hero = state.heroes.find(h => h.id === this.selectedHeroId);
        if (!hero) {
            this.elements.detail.innerHTML = `
                <div class="empty-detail">
                    <p data-i18n="ui_select_hero">${this.t('ui_select_hero')}</p>
                </div>`;
            return;
        }

        const isIdle = hero.activity === 'idle';
        const activityText = isIdle ? this.t('ui_activity_idle') : this.t('ui_activity_expedition');

        const equipSlots = ['head', 'body', 'legs', 'leftHand', 'rightHand', 'accessory'];
        const slotIcons = {
            head: '🪖',
            body: '🦺',
            legs: '👢',
            leftHand: '⚔️',
            rightHand: '🛡️',
            accessory: '💍'
        };
        let equipHtml = `
            <div class="equipment-diagram">
                <div class="eq-body-silhouette">
                    <div class="silhouette-head"></div>
                    <div class="silhouette-torso"></div>
                    <div class="silhouette-legs"></div>
                </div>
                ${equipSlots.map(slot => {
                    const hasItem = !!hero.equipment[slot];
                    const itemName = hasItem ? getEquipmentName(hero.equipment[slot], this.t.bind(this)) : this.t('ui_empty_slot');
                    const clickableClass = isIdle ? 'clickable' : 'locked';
                    const hasItemClass = hasItem ? 'has-item' : '';
                    return `
                        <div class="equip-slot eq-slot-${slot} ${clickableClass} ${hasItemClass}" data-slot="${slot}">
                            <div class="eq-slot-icon">${slotIcons[slot]}</div>
                            <div class="eq-slot-label">${this.t('slot_' + slot)}</div>
                            <div class="eq-slot-item" title="${itemName}">${itemName}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        const canManageSkills = isIdle;
        const knownFamilies = hero.knownFamilies || ['single_strike'];
        const allFamilies = Object.values(TECHNIQUE_FAMILIES);

        // Separate known and locked families
        const knownFamilyIds = new Set(knownFamilies);
        const knownList = allFamilies.filter(f => knownFamilyIds.has(f.id));
        const lockedList = allFamilies.filter(f => !knownFamilyIds.has(f.id) && f.id !== 'single_strike');

        // Sort known by tier (highest first)
        knownList.sort((a, b) => {
            const tierA = hero.techniqueTiers && hero.techniqueTiers[a.id] || 1;
            const tierB = hero.techniqueTiers && hero.techniqueTiers[b.id] || 1;
            return tierB - tierA;
        });

        const milestones = Hero.SKILL_POINT_MILESTONES || [1, 5, 10, 15, 20, 25];
        const nextMilestone = milestones.find(m => m > hero.level);

        let skillsHtml = knownList.map(family => {
            const familyId = family.id;
            const tier = hero.techniqueTiers && hero.techniqueTiers[familyId] || 1;
            const staCost = family.staminaCostBase + family.staminaCostPerTier * (tier - 1);
            const uses = hero.techniqueUses && hero.techniqueUses[familyId] || 0;
            const isBodyInscribed = hero.bodyInscription && hero.bodyInscription.glyphIds && hero.bodyInscription.glyphIds.length > 0;

            // Progress toward next tier: cumulative uses to reach current tier = 50 * (3^(tier-1) - 1)
            // Threshold for this tier = 100 * 3^(tier-1)
            const cumulativeToCurrent = tier <= 1 ? 0 : 50 * (Math.pow(3, tier - 1) - 1);
            const tierThreshold = Math.floor(100 * Math.pow(3, tier - 1));
            const usesInTier = Math.max(0, uses - cumulativeToCurrent);
            const tierProgress = Math.min(100, Math.floor((usesInTier / tierThreshold) * 100));
            const progressBar = `
                <div class="skill-tier-bar" style="margin-top:4px;height:4px;background:rgba(255,255,255,0.1);border-radius:2px;overflow:hidden;">
                    <div style="width:${tierProgress}%;height:100%;background:var(--accent-color);border-radius:2px;"></div>
                </div>
            `;

            const effectLabel = this._getFamilyEffectLabel(family, tier);
            return `
                <div class="skill-item skill-learned ${isBodyInscribed ? 'skill-inscribed' : ''}">
                    <div class="skill-info">
                        <span class="skill-name">${this.t('family_' + familyId)}${isBodyInscribed ? ' · ✦' : ''}</span>
                        <span class="skill-meta">${effectLabel ? effectLabel + ' · ' : ''}${staCost} STA · ${uses} uses</span>
                        ${progressBar}
                    </div>
                    <div class="skill-actions">
                        <span class="skill-tier-badge">Tier ${tier}</span>
                    </div>
                </div>
            `;
        }).join('');

        if (lockedList.length > 0) {
            skillsHtml += `
                <div class="skill-section-divider" style="margin: 12px 0; padding-top: 8px; border-top: 1px dashed var(--glass-border);">
                    <span style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">${this.t('ui_locked_families') || 'Locked'}</span>
                </div>
            `;
            skillsHtml += lockedList.map(family => {
                const familyId = family.id;
                const canLearn = canManageSkills && hero.skillPoints > 0 && knownFamilies.length < 6;
                const learnBtn = canLearn
                    ? `<button class="btn btn-primary btn-sm btn-learn-family" data-family="${familyId}">${this.t('ui_learn') || 'Learn'}</button>`
                    : `<span class="skill-locked-label">${this.t('ui_locked') || 'Locked'}</span>`;

                const lockedEffect = this._getFamilyEffectLabel(family, 1);
                return `
                    <div class="skill-item skill-locked">
                        <div class="skill-info">
                            <span class="skill-name">🔒 ${this.t('family_' + familyId)}</span>
                            <span class="skill-meta">${lockedEffect ? lockedEffect + ' · ' : ''}${family.staminaCostBase} STA</span>
                        </div>
                        <div class="skill-actions">
                            ${learnBtn}
                        </div>
                    </div>
                `;
            }).join('');
        }

        const hasStatPoints = hero.statPoints > 0;
        const canAllocate = hasStatPoints && isIdle;
        const statPointsText = canAllocate
            ? this.t('ui_stat_points').replace('{amount}', hero.statPoints)
            : this.t('ui_stat_points_busy').replace('{amount}', hero.statPoints);

        const skillPointsText = hero.skillPoints > 0 && canManageSkills
            ? `<strong>${this.t('ui_skill_points').replace('{amount}', hero.skillPoints)}</strong> · ${this.t('ui_spend_to_unlock') || 'Spend to unlock a new technique'}`
            : nextMilestone
                ? `<strong>${this.t('ui_next_skill_point').replace('{level}', nextMilestone)}</strong>`
                : `<strong>${this.t('ui_max_families') || 'All techniques unlocked'}</strong>`;

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

        this.elements.detail.innerHTML = `
            <div class="hero-profile">
                <div class="hero-detail-header-card">
                    <div class="hero-portrait-container">
                        <img class="hero-portrait-img" src="${avatarSrc}" alt="${hero.name}">
                    </div>
                    <div class="hero-detail-info">
                        <div class="profile-title-group">
                            <span class="profile-badge">${this.t(hero.origin)}</span>
                            <h2>${hero.name} <span class="hero-level-text">(${this.t('ui_level')} ${hero.level})</span></h2>
                        </div>
                        <p class="hero-origin-desc"><em>${this.t(hero.origin + '_desc')}</em></p>
                        <div class="hero-status-row">
                            <span><strong>${this.t('ui_activity')}:</strong> <span class="status-badge ${isIdle ? 'idle' : 'busy'}">${activityText}</span></span>
                            <span><strong>${this.t('ui_experience')}:</strong> ${hero.exp} / ${hero.expToNextLevel}</span>
                        </div>
                        ${hasStatPoints ? `
                        <div class="stat-points-alert ${canAllocate ? '' : 'locked'}">
                            <strong>${statPointsText}</strong>
                        </div>
                        ` : ''}
                        <div class="skill-points-alert ${canManageSkills ? '' : 'locked'}" style="margin-top: 6px; background: rgba(99, 102, 241, 0.1); border-color: rgba(99, 102, 241, 0.3); padding: 6px 10px; border-radius: var(--radius-md); font-size: 0.9rem;">
                            ${skillPointsText}${!canManageSkills ? ' (' + (this.t('ui_busy') || 'Busy') + ')' : ''}
                        </div>
                        <button class="btn btn-secondary btn-sm btn-trainer" data-action="open-trainer" style="margin-top: 8px;">
                            💪 ${this.t('trainer_title') || 'Training Grounds'}
                        </button>
                        ${(state.village?.infrastructure?.arcane_sanctum || 0) >= 1 ? `
                        <button class="btn btn-secondary btn-sm btn-magic-circle" data-action="open-magic-circle" style="margin-top: 8px; margin-left: 6px;">
                            🔮 ${this.t('magic_circle_title') || 'Magic Circle'}
                        </button>
                        ` : ''}
                        ${(state.village?.infrastructure?.witchs_hut || 0) >= 1 ? `
                        <button class="btn btn-secondary btn-sm btn-witch" data-action="open-witch" style="margin-top: 8px; margin-left: 6px;">
                            🌙 ${this.t('witch_title') || 'Witch\'s Hut'}
                        </button>
                        ` : ''}
                        ${(state.village?.infrastructure?.arcane_sanctum || 0) >= 2 ? `
                        <button class="btn btn-secondary btn-sm btn-academy" data-action="open-academy" style="margin-top: 8px; margin-left: 6px;">
                            📚 ${this.t('academy_title') || 'Glyph Academy'}
                        </button>
                        ` : ''}
                        <button class="btn btn-secondary btn-sm btn-hall" data-action="open-hall" style="margin-top: 8px; margin-left: 6px;">
                            🏆 ${this.t('hall_of_fame_title') || 'Hall of Fame'}
                        </button>
                        ${this._canBodyInscribe(hero) ? `
                        <button class="btn btn-secondary btn-sm btn-inscribe" data-action="open-inscribe" style="margin-top: 8px; margin-left: 6px;">
                            ✦ ${this.t('body_inscription_title') || 'Body Inscription'}
                        </button>
                        ` : ''}
                        ${(state.heroes || []).some(h => h.level >= 5) ? `
                        <button class="btn btn-secondary btn-sm btn-gambit" data-action="open-gambit" style="margin-top: 8px; margin-left: 6px;">
                            🎲 ${this.t('gambit_title') || 'Gambits'}
                        </button>
                        ` : ''}
                    </div>
                </div>
                <div class="stats-grid">
                    <div class="stat-row">
                        <span>${this.t('ui_stats_hp') || 'HP'}</span> 
                        <div class="stat-value-group">
                            <span>${hero.hp} / ${hero.maxHp}</span>
                            ${canAllocate ? `<button class="btn-assign-stat" data-stat="baseMaxHp">+</button>` : ''}
                        </div>
                    </div>
                    <div class="stat-row">
                        <span>${this.t('ui_stats_mp') || 'MP'}</span> 
                        <div class="stat-value-group">
                            <span>${hero.mp} / ${hero.maxMp}</span>
                            ${canAllocate ? `<button class="btn-assign-stat" data-stat="baseMaxMp">+</button>` : ''}
                        </div>
                    </div>
                    <div class="stat-row stamina-row">
                        <span>${this.t('ui_stats_stamina') || 'STA'}</span> 
                        <div class="stat-value-group">
                            <span>${hero.stamina} / ${hero.maxStamina}</span>
                        </div>
                    </div>
                    <div class="stat-row">
                        <span>${this.t('ui_stats_power') || 'STR'}</span> 
                        <div class="stat-value-group">
                            <span>${hero.strength}</span>
                            ${canAllocate ? `<button class="btn-assign-stat" data-stat="baseStrength">+</button>` : ''}
                        </div>
                    </div>
                    <div class="stat-row">
                        <span>${this.t('ui_stats_speed') || 'SPD'}</span> 
                        <div class="stat-value-group">
                            <span>${hero.speed}</span>
                            ${canAllocate ? `<button class="btn-assign-stat" data-stat="baseSpeed">+</button>` : ''}
                        </div>
                    </div>
                    <div class="stat-row">
                        <span>${this.t('ui_stats_defense') || 'DEF'}</span> 
                        <div class="stat-value-group">
                            <span>${hero.defense}</span>
                            ${canAllocate ? `<button class="btn-assign-stat" data-stat="baseDefense">+</button>` : ''}
                        </div>
                    </div>
                    <div class="stat-row">
                        <span>${this.t('ui_stats_magic') || 'MAG'}</span> 
                        <div class="stat-value-group">
                            <span>${hero.magicPower}</span>
                            ${canAllocate ? `<button class="btn-assign-stat" data-stat="baseMagicPower">+</button>` : ''}
                        </div>
                    </div>
                </div>
                <div class="hero-sections-grid">
                    <div class="hero-section">
                        <h3>${this.t('ui_equipment')}</h3>
                        <div class="equipment-list">
                            ${equipHtml}
                        </div>
                        ${this._renderSetBonuses(hero.activeSetBonuses)}
                    </div>
                    <div class="hero-section">
                        <h3>${this.t('ui_skills')}</h3>
                        <div class="skills-list">
                            ${skillsHtml}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    _renderSetBonuses(activeSetBonuses) {
        if (!activeSetBonuses || activeSetBonuses.length === 0) return '';

        return activeSetBonuses.map(sb => {
            const setName = this.t(sb.setName) || sb.setName;
            const bonusLines = Object.entries(sb.bonus).map(([stat, val]) => {
                const sign = val > 0 ? '+' : '';
                const label = this.t('ui_stats_' + stat) || stat.toUpperCase();
                return `${sign}${val} ${label}`;
            }).join(', ');

            return `
                <div class="set-bonus-block">
                    <div class="set-bonus-header">
                        <span class="set-bonus-name">${setName}</span>
                        <span class="set-bonus-pieces">(${sb.pieces}/${sb.threshold})</span>
                    </div>
                    <div class="set-bonus-stats">${bonusLines}</div>
                </div>
            `;
        }).join('');
    }

    _openEquipModal(slot) {
        const hero = this.lastRawState.heroes.find(h => h.id === this.selectedHeroId);
        if (!hero || hero.activity !== 'idle') return;

        const currentItem = hero.equipment[slot];

        // Filter eligible items in inventory
        const eligibleItems = this.inventoryEquipment.filter(item => {
            if (slot === 'leftHand' || slot === 'rightHand') {
                return item.type === 'weapon' || (item.type === 'armor' && item.slot === slot);
            } else {
                return item.type === 'armor' && item.slot === slot;
            }
        });

        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        modalOverlay.style.zIndex = '2000';

        const t = this.t.bind(this);

        const currentStats = currentItem ? getEquipmentStats(currentItem) : {};

        const formatDelta = (val, label) => {
            if (val === 0) return '';
            const color = val > 0 ? 'var(--success)' : 'var(--danger)';
            const sign = val > 0 ? '+' : '';
            return `<span style="color:${color}; font-weight:700;">${sign}${val} ${label}</span>`;
        };

        let itemsHtml = '';
        if (eligibleItems.length === 0) {
            itemsHtml = `<div style="text-align:center; padding: 25px; color: var(--text-muted); font-size: 0.95rem;">${t('ui_no_items')}</div>`;
        } else {
            itemsHtml = eligibleItems.map(item => {
                const statsObj = getEquipmentStats(item);
                const statLines = [];
                const deltaLines = [];

                const pushStat = (key, label) => {
                    const val = statsObj[key] || 0;
                    const cur = currentStats[key] || 0;
                    if (val || cur) {
                        statLines.push(`${val > 0 ? '+' : ''}${val} ${label}`);
                        const delta = val - cur;
                        if (delta !== 0) deltaLines.push(formatDelta(delta, label));
                    }
                };

                pushStat('strength', t('ui_stats_power') || 'STR');
                pushStat('defense', 'DEF');
                pushStat('maxHp', 'HP');
                pushStat('maxMp', 'MP');
                pushStat('magicPower', 'MAG');
                pushStat('speed', 'SPD');
                if (statsObj.evasion || currentStats.evasion) {
                    const eva = statsObj.evasion || 0;
                    const curEva = currentStats.evasion || 0;
                    statLines.push(`${eva > 0 ? '+' : ''}${eva}% EVA`);
                    const delta = eva - curEva;
                    if (delta !== 0) deltaLines.push(formatDelta(delta, '% EVA'));
                }

                const desc = statLines.join(', ');
                const deltas = deltaLines.join(' ');

                return `
                    <div class="list-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; margin-bottom: 8px; cursor: default;">
                        <div style="flex: 1; text-align: left; padding-right: 10px;">
                            <div style="font-weight:700; color: var(--text-primary);">${getEquipmentName(item, t)}</div>
                            <div style="font-size:0.8rem; color:var(--text-secondary); margin-top: 2px;">${desc}</div>
                            ${deltas ? `<div style="font-size:0.75rem; margin-top: 2px;">${deltas}</div>` : ''}
                        </div>
                        <button class="btn btn-primary btn-sm btn-select-equip" data-id="${item.id}" style="min-width: 70px;">
                            ${t('ui_equip') || 'Equip'}
                        </button>
                    </div>
                `;
            }).join('');
        }

        modalOverlay.innerHTML = `
            <div class="modal-body" style="max-width: 480px; max-height: 80vh; display: flex; flex-direction: column;">
                <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid var(--glass-border); padding-bottom: 10px;">
                    <h3 style="margin: 0; font-size:1.1rem; color: var(--accent-color);">${t('ui_equip')} - ${t('slot_' + slot)}</h3>
                    <button class="btn btn-secondary btn-sm" id="btn-close-equip-modal" style="padding: 4px 8px; font-size: 0.8rem;">❌</button>
                </div>
                
                <div style="flex: 1; overflow-y: auto; margin-bottom: 15px; padding-right: 5px;">
                    ${currentItem ? `
                        <div style="background: rgba(239, 68, 68, 0.05); border: 1px dashed var(--danger); padding: 12px; border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <div style="text-align: left;">
                                <div style="font-size: 0.8rem; color: var(--text-muted);">${t('ui_equipped') || 'Equipped'}:</div>
                                <div style="font-weight: 700; color: var(--danger); margin-top: 2px;">${getEquipmentName(currentItem, t)}</div>
                            </div>
                            <button class="btn btn-danger btn-sm" id="btn-unequip-slot" style="padding: 6px 12px; font-size: 0.8rem;">
                                ${t('ui_unequip') || 'Unequip'}
                            </button>
                        </div>
                    ` : ''}
                    
                    <div style="font-weight: 700; font-size: 0.85rem; margin-bottom: 10px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; text-align: left;">
                        ${t('ui_available_gear') || 'Available Gear'}
                    </div>
                    ${itemsHtml}
                </div>
                
                <div class="modal-actions" style="border-top: 1px solid var(--glass-border); padding-top: 12px; display: flex; justify-content: flex-end;">
                    <button class="btn btn-secondary btn-sm" id="btn-cancel-equip-modal">${t('btn_cancel')}</button>
                </div>
            </div>
        `;

        document.body.appendChild(modalOverlay);

        const closeModal = () => {
            document.body.removeChild(modalOverlay);
        };

        modalOverlay.querySelector('#btn-close-equip-modal').addEventListener('click', closeModal);
        modalOverlay.querySelector('#btn-cancel-equip-modal').addEventListener('click', closeModal);

        if (currentItem) {
            modalOverlay.querySelector('#btn-unequip-slot').addEventListener('click', () => {
                this.emit('unequipItem', { heroId: this.selectedHeroId, slot });
                closeModal();
            });
        }

        modalOverlay.querySelectorAll('.btn-select-equip').forEach(btn => {
            btn.addEventListener('click', () => {
                const itemId = btn.dataset.id;
                this.emit('equipItem', { heroId: this.selectedHeroId, slot, itemId });
                closeModal();
            });
        });
    }

    _openTrainerModal() {
        const hero = this.lastRawState?.heroes?.find(h => h.id === this.selectedHeroId);
        if (!hero) return;

        const dialogue = TrainerService.getDialogue(hero, this.ui?.i18n);

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay trainer-modal-overlay';
        overlay.innerHTML = `
            <div class="trainer-dialogue-box">
                <div class="trainer-header">
                    <span class="trainer-icon">💪</span>
                    <h3>${this.t('trainer_title') || 'Training Grounds'}</h3>
                </div>
                <div class="trainer-lines">
                    ${dialogue.lines.map(line => `<p class="trainer-line">"${line}"</p>`).join('')}
                </div>
                <div class="trainer-footer">
                    <span class="trainer-category">${dialogue.category}</span>
                    <button class="btn btn-secondary btn-sm" id="btn-trainer-close">${this.t('ui_btn_close') || 'Close'}</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const close = () => {
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.3s ease';
            setTimeout(() => overlay.remove(), 300);
        };

        overlay.querySelector('#btn-trainer-close').addEventListener('click', close);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });
    }

    _openWitchModal() {
        const heroes = this.lastRawState?.heroes || [];
        let selectedHero = heroes.find(h => h.id === this.selectedHeroId) || heroes[0];
        if (!selectedHero) return;

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay trainer-modal-overlay';

        const renderWitch = () => {
            const currentDay = this.lastRawState?.village?.day || 0;
            const dialogue = WitchService.getDialogue(selectedHero, this.ui?.i18n, currentDay);
            WitchService.recordVisit(selectedHero, currentDay);
            const elementIcons = { fire: '🔥', water: '💧', wind: '🌪️', storm: '⚡', light: '✨', dark: '🌑', neutral: '🔮' };
            const elementIcon = elementIcons[dialogue.element] || '🔮';

            overlay.innerHTML = `
                <div class="trainer-dialogue-box witch-dialogue-box" style="max-width: 520px;">
                    <div class="trainer-header">
                        <span class="trainer-icon">🌙</span>
                        <h3>${this.t('witch_title') || 'Witch\'s Hut'}</h3>
                    </div>
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
                        ${this.t('witch_mastery_detected') || 'Glyph mastery whispers detected...'}
                    </div>
                    ` : ''}
                    <div class="trainer-footer">
                        <span class="trainer-category witch-category">${dialogue.category} · ${dialogue.element}</span>
                        <button class="btn btn-secondary btn-sm" id="btn-witch-close">${this.t('ui_btn_close') || 'Close'}</button>
                    </div>
                </div>
            `;

            overlay.querySelector('#witch-hero-select').addEventListener('change', (e) => {
                selectedHero = heroes.find(h => h.id === e.target.value);
                renderWitch();
            });

            overlay.querySelector('#btn-witch-close').addEventListener('click', () => {
                WitchService.recordVisit(selectedHero);
                this.emit('updateHero', { hero: selectedHero });
                close();
            });
        };

        document.body.appendChild(overlay);
        renderWitch();

        const close = () => {
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.3s ease';
            setTimeout(() => overlay.remove(), 300);
        };

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });
    }

    _openAcademyModal() {
        const hero = this.lastRawState?.heroes?.find(h => h.id === this.selectedHeroId);
        if (!hero) return;

        const designs = this.ui?.adapter?.engine?.getSpellDesigns() || [];
        const allHeroes = this.lastRawState?.heroes || [];
        const otherHeroes = allHeroes.filter(h => h.id !== hero.id);

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay trainer-modal-overlay';
        overlay.innerHTML = `
            <div class="trainer-dialogue-box academy-dialogue-box" style="max-width: 540px;">
                <div class="trainer-header">
                    <span class="trainer-icon">📚</span>
                    <h3>${this.t('academy_title') || 'Glyph Academy'}</h3>
                </div>
                <div style="margin-bottom: 16px;">
                    <h4 style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 8px;">${this.t('ui_design_library') || 'Design Library'}</h4>
                    ${designs.length === 0 ? `<p style="color: var(--text-muted); font-size: 0.85rem;">No designs saved yet.</p>` :
                        designs.map(d => `<div class="academy-design-card"><strong>${d.name}</strong> — ${d.glyphIds.length} glyphs, ${d.mpCost} MP</div>`).join('')}
                </div>
                <div class="trainer-footer">
                    <button class="btn btn-secondary btn-sm" id="btn-academy-close">${this.t('ui_btn_close') || 'Close'}</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const close = () => {
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.3s ease';
            setTimeout(() => overlay.remove(), 300);
        };

        overlay.querySelector('#btn-academy-close').addEventListener('click', close);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });
    }

    _openHallOfFameModal() {
        const hero = this.lastRawState?.heroes?.find(h => h.id === this.selectedHeroId);
        if (!hero) return;

        const stats = hero.lifetimeStats || {};
        const titles = hero.titles || [];

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay trainer-modal-overlay';
        overlay.innerHTML = `
            <div class="trainer-dialogue-box hall-dialogue-box" style="max-width: 480px;">
                <div class="trainer-header">
                    <span class="trainer-icon">🏆</span>
                    <h3>${this.t('hall_of_fame_title') || 'Hall of Fame'}</h3>
                </div>
                <div style="margin-bottom: 16px;">
                    <div class="hall-stat-grid">
                        <div class="hall-stat"><span>${this.t('ui_stats_enemies_defeated') || 'Enemies'}</span><strong>${stats.enemiesDefeated || 0}</strong></div>
                        <div class="hall-stat"><span>${this.t('ui_stats_damage_dealt') || 'Damage'}</span><strong>${stats.damageDealt || 0}</strong></div>
                        <div class="hall-stat"><span>${this.t('ui_stats_expeditions') || 'Expeditions'}</span><strong>${stats.expeditionsCompleted || 0}</strong></div>
                        <div class="hall-stat"><span>${this.t('ui_stats_battles_won') || 'Wins'}</span><strong>${stats.battlesWon || 0}</strong></div>
                    </div>
                </div>
                <div style="margin-bottom: 16px;">
                    <h4 style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 8px;">Titles</h4>
                    <div class="hall-titles">
                        ${titles.length === 0 ? '<span style="color: var(--text-muted); font-size: 0.85rem;">No titles yet.</span>' :
                            titles.map(t => `<span class="hall-title-badge">${this.t(t) || t}</span>`).join('')}
                    </div>
                </div>
                <div class="trainer-footer">
                    <button class="btn btn-secondary btn-sm" id="btn-hall-close">${this.t('ui_btn_close') || 'Close'}</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const close = () => {
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.3s ease';
            setTimeout(() => overlay.remove(), 300);
        };

        overlay.querySelector('#btn-hall-close').addEventListener('click', close);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });
    }

    _canBodyInscribe(hero) {
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

    _openMagicCircleModal(overrideHero = null) {
        const hero = overrideHero || this.lastRawState?.heroes?.find(h => h.id === this.selectedHeroId);
        if (!hero) return;

        this.ui.openMagicCircleOverlay({
            heroName: hero.name,
            magicTier: hero.magicTier || 1,
            maxMp: hero.maxMp || 100,
            knownGlyphs: hero.knownGlyphs || [],
            glyphMastery: hero.glyphMastery || {},
            isSimulator: hero.id === 'simulator_fake_hero',
            onConfirm: (spell) => {
                this.emit('inscribeSpell', { heroId: hero.id, spell });
            }
        });
    }

    _openBodyInscriptionModal() {
        const hero = this.lastRawState?.heroes?.find(h => h.id === this.selectedHeroId);
        if (!hero) return;

        const maxSlots = 7;
        const knownGlyphs = new Set(hero.knownGlyphs || []);
        const allGlyphs = Object.values(GLYPH_DATA);
        const glyphTiers = hero.glyphMastery || {};

        // Current body circle (or pending)
        const current = hero.bodyInscription || { glyphIds: [], glyphTiers: {} };
        let selectedGlyphIds = [...(current.glyphIds || [])];
        const isInscribing = hero.bodyInscriptionDaysRemaining > 0;
        const pending = hero.pendingBodyInscription;

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay trainer-modal-overlay';

        const getGlyphSymbol = (gid) => {
            const tier = glyphTiers[gid]?.tier || 1;
            const symbols = ['+', '++', '+++', '✦', '✦✦', '✦✦✦', '✶'];
            return symbols[Math.min(6, tier - 1)];
        };

        const getElementIcon = (element) => {
            const map = { fire: '🔥', water: '💧', wind: '🌬️', storm: '⚡', light: '☀️', dark: '🌑' };
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

            // Compute preview hybrid cost (client-side estimate)
            let hybridCost = 0;
            if (hasCore) {
                let base = 8;
                for (const gid of selectedGlyphIds) {
                    const g = GLYPH_DATA[gid];
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

            overlay.innerHTML = `
                <div class="trainer-dialogue-box inscribe-dialogue-box" style="max-width: 560px;">
                    <div class="trainer-header">
                        <span class="trainer-icon">✦</span>
                        <h3>${this.t('body_inscription_title') || 'Body Inscription'}</h3>
                    </div>
                    <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 12px;">
                        ${this.t('body_inscription_desc') || 'Compose glyphs into your body circle. Requires 1 Core glyph. Inscribed heroes gain hybrid skill casting (STA + MP).'}
                    </p>
                    <div style="margin-bottom: 12px; display:flex; justify-content:space-between;">
                        <strong>${this.t('ui_inscribed_slots') || 'Slots'}:</strong> ${slotsUsed} / ${maxSlots}
                        ${hybridCost > 0 ? `<span style="color:var(--accent-color);">Hybrid MP: ${hybridCost}</span>` : ''}
                    </div>
                    ${isInscribing ? `<div style="background:rgba(255,193,7,0.15); border:1px solid rgba(255,193,7,0.3); border-radius:6px; padding:8px; margin-bottom:12px; font-size:0.8rem; color:#ffc107;">
                        ⏳ ${this.t('body_inscription_pending') || 'Inscription in progress'}: ${hero.bodyInscriptionDaysRemaining} ${this.t('ui_days_remaining') || 'days remaining'}
                    </div>` : ''}
                    <div style="background:rgba(255,255,255,0.05); border-radius:8px; padding:10px; margin-bottom:12px; min-height:48px;">
                        ${selectedGlyphIds.length === 0
                            ? `<span style="color:var(--text-muted); font-size:0.8rem;">${this.t('body_circle_empty') || 'No glyphs inscribed'}</span>`
                            : `<div style="display:flex; flex-wrap:wrap; gap:6px;">
                                ${selectedGlyphIds.map(gid => {
                                    const g = GLYPH_DATA[gid];
                                    return `<div style="background:rgba(255,255,255,0.1); padding:4px 8px; border-radius:4px; font-size:0.8rem; display:flex; align-items:center; gap:4px;">
                                        <span>${getElementIcon(g.element)}</span>
                                        <span>${this.t(g.nameKey) || g.id}</span>
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
                            const tier = glyphTiers[g.id]?.tier || 1;
                            const typeColor = g.type === 'core' ? '#ff9f43' : g.type === 'power' ? '#5f27cd' : g.type === 'efficiency' ? '#10ac84' : '#00d2d3';
                            return `
                            <div class="inscribe-skill-row ${isSelected ? 'inscribed' : ''} ${!isKnown ? 'not-learned' : ''}" style="border-left:3px solid ${typeColor};">
                                <span class="inscribe-skill-name">${getElementIcon(g.element)} ${this.t(g.nameKey) || g.id} <small style="color:var(--text-muted);">${getGlyphSymbol(g.id)}</small></span>
                                <span class="inscribe-skill-cost" style="font-size:0.75rem; text-transform:uppercase; color:${typeColor};">${g.type}</span>
                                ${isSelected
                                    ? `<span style="font-size:0.75rem; color:var(--accent-color);">${this.t('ui_selected') || 'Selected'}</span>`
                                    : canSelect
                                        ? `<button class="btn btn-primary btn-sm btn-glyph-select" data-gid="${g.id}">${this.t('ui_add') || 'Add'}</button>`
                                        : `<span class="inscribe-locked">${!isKnown ? (this.t('ui_not_learned') || 'Not learned') : (slotsLeft <= 0 ? (this.t('ui_no_slots') || 'No slots') : '')}</span>`}
                            </div>
                            `;
                        }).join('')}
                    </div>
                    <div class="trainer-footer" style="display:flex; gap:8px; justify-content:flex-end;">
                        <button class="btn btn-primary btn-sm" id="btn-inscribe-save" ${!hasCore || slotsUsed !== maxSlots ? 'disabled' : ''}>${hero.bodyInscription ? (this.t('ui_overwrite') || 'Overwrite') : (this.t('ui_save') || 'Save')}</button>
                        <button class="btn btn-secondary btn-sm" id="btn-inscribe-close">${this.t('ui_btn_close') || 'Close'}</button>
                    </div>
                    ${!hasCore && slotsUsed > 0 ? `<p style="color:#ff6b6b; font-size:0.8rem; margin-top:8px;">${this.t('error_no_core_glyph') || 'At least one Core glyph is required.'}</p>` : ''}
                    ${slotsUsed > 0 && slotsUsed < maxSlots ? `<p style="color:#ff9f43; font-size:0.8rem; margin-top:8px;">${this.t('error_body_circle_must_be_7') || 'Body circle must have exactly 7 glyphs.'}</p>` : ''}
                </div>
            `;

            // Bind events
            overlay.querySelectorAll('.btn-glyph-select').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    selectedGlyphIds.push(e.target.dataset.gid);
                    render();
                });
            });

            overlay.querySelectorAll('.btn-glyph-remove').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    selectedGlyphIds = selectedGlyphIds.filter(id => id !== e.target.dataset.gid);
                    render();
                });
            });

            overlay.querySelector('#btn-inscribe-close').addEventListener('click', close);

            const saveBtn = overlay.querySelector('#btn-inscribe-save');
            if (saveBtn) {
                saveBtn.addEventListener('click', () => {
                    const glyphTierMap = {};
                    for (const gid of selectedGlyphIds) {
                        glyphTierMap[gid] = glyphTiers[gid]?.tier || 1;
                    }
                    this.emit('inscribeBodyCircle', { heroId: this.selectedHeroId, glyphIds: selectedGlyphIds, glyphTiers: glyphTierMap });
                    close();
                });
            }

        };

        document.body.appendChild(overlay);

        const close = () => {
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.3s ease';
            setTimeout(() => overlay.remove(), 300);
        };

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });

        render();
    }

    /**
     * Generate a human-readable effect label for a technique family.
     */
    _getFamilyEffectLabel(family, tier = 1) {
        const t = this.t.bind(this);
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

    _openGambitModal() {
        const hero = this.lastRawState?.heroes?.find(h => h.id === this.selectedHeroId);
        if (!hero) return;

        const gambits = hero.gambits || [];
        const knownFamilyIds = new Set(hero.knownFamilies || ['single_strike']);
        const learnedFamilies = Object.values(TECHNIQUE_FAMILIES).filter(f => knownFamilyIds.has(f.id));

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay trainer-modal-overlay';
        overlay.innerHTML = `
            <div class="trainer-dialogue-box gambit-dialogue-box" style="max-width: 560px;">
                <div class="trainer-header">
                    <span class="trainer-icon">🎲</span>
                    <h3>${this.t('gambit_title') || 'Gambits'}</h3>
                </div>
                <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 12px;">
                    ${this.t('gambit_desc') || 'Set conditional battle behaviors. Gambits are evaluated top-to-bottom; the first matching rule wins.'}
                </p>
                <div style="margin-bottom: 12px;">
                    <strong>${this.t('ui_gambit_count') || 'Gambits'}:</strong> ${gambits.length} / 12
                </div>
                <div class="gambit-list">
                    ${gambits.map((g, idx) => `
                        <div class="gambit-row ${g.enabled === false ? 'gambit-disabled' : ''}">
                            <div class="gambit-info">
                                <span class="gambit-priority">${idx + 1}.</span>
                                <span class="gambit-rule">${this._formatGambitRule(g)}</span>
                            </div>
                            <div class="gambit-actions">
                                <button class="btn btn-sm btn-move-gambit" data-id="${g.id}" data-dir="-1" ${idx === 0 ? 'disabled' : ''}>▲</button>
                                <button class="btn btn-sm btn-move-gambit" data-id="${g.id}" data-dir="1" ${idx === gambits.length - 1 ? 'disabled' : ''}>▼</button>
                                <button class="btn btn-sm btn-toggle-gambit ${g.enabled === false ? 'btn-primary' : 'btn-secondary'}" data-id="${g.id}">${g.enabled === false ? (this.t('ui_enable') || 'Enable') : (this.t('ui_disable') || 'Disable')}</button>
                                <button class="btn btn-danger btn-sm btn-remove-gambit" data-id="${g.id}">${this.t('ui_remove') || 'Remove'}</button>
                            </div>
                        </div>
                    `).join('')}
                    ${gambits.length === 0 ? `<p style="color: var(--text-muted); font-size: 0.85rem;">${this.t('ui_no_gambits') || 'No gambits set.'}</p>` : ''}
                </div>
                <div class="gambit-add-section" style="margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--glass-border);">
                    <h4 style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 10px;">${this.t('ui_add_gambit') || 'Add Gambit'}</h4>
                    <div class="gambit-form">
                        <select id="gambit-condition" class="gambit-select">
                            <option value="self_hp_below">${this.t('gambit_self_hp_below') || 'Self HP below'} 50%</option>
                            <option value="ally_hp_below">${this.t('gambit_ally_hp_below') || 'Ally HP below'} 50%</option>
                            <option value="self_mp_below">${this.t('gambit_self_mp_below') || 'Self MP below'} 30%</option>
                            <option value="self_stamina_below">${this.t('gambit_self_stamina_below') || 'Self STA below'} 30%</option>
                            <option value="always">${this.t('gambit_always') || 'Always'}</option>
                        </select>
                        <select id="gambit-skill" class="gambit-select">
                            ${learnedFamilies.map(f => `<option value="${f.id}">${this.t('family_' + f.id)}</option>`).join('')}
                        </select>
                        <button class="btn btn-primary btn-sm" id="btn-add-gambit">${this.t('ui_add') || 'Add'}</button>
                    </div>
                </div>
                <div class="trainer-footer">
                    <button class="btn btn-secondary btn-sm" id="btn-gambit-close">${this.t('ui_btn_close') || 'Close'}</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const close = () => {
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.3s ease';
            setTimeout(() => overlay.remove(), 300);
        };

        overlay.querySelector('#btn-gambit-close').addEventListener('click', close);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });

        overlay.querySelectorAll('.btn-remove-gambit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.emit('removeGambit', { heroId: this.selectedHeroId, gambitId: e.target.dataset.id });
                close();
            });
        });

        overlay.querySelectorAll('.btn-toggle-gambit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.emit('toggleGambit', { heroId: this.selectedHeroId, gambitId: e.target.dataset.id });
                close();
            });
        });

        overlay.querySelectorAll('.btn-move-gambit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.emit('moveGambit', { heroId: this.selectedHeroId, gambitId: e.target.dataset.id, direction: parseInt(e.target.dataset.dir) });
                close();
            });
        });

        const addBtn = overlay.querySelector('#btn-add-gambit');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                const condition = overlay.querySelector('#gambit-condition').value;
                const skillId = overlay.querySelector('#gambit-skill').value;
                if (!skillId) return;
                const gambit = {
                    id: 'gambit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                    condition,
                    threshold: condition === 'self_hp_below' || condition === 'ally_hp_below' ? 0.5 :
                               condition === 'self_mp_below' || condition === 'self_stamina_below' ? 0.3 : undefined,
                    action: 'use_skill',
                    skillId,
                    enabled: true
                };
                this.emit('addGambit', { heroId: this.selectedHeroId, gambit });
                close();
            });
        }
    }

    _formatGambitRule(gambit) {
        const conditionLabels = {
            self_hp_below: 'HP < 50%',
            ally_hp_below: 'Ally HP < 50%',
            self_mp_below: 'MP < 30%',
            self_stamina_below: 'STA < 30%',
            always: 'Always'
        };
        const cond = conditionLabels[gambit.condition] || gambit.condition;
        const skillName = this.t(gambit.skillId) || gambit.skillId;
        return `${cond} → ${skillName}`;
    }
}

