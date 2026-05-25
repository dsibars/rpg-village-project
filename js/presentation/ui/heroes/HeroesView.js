import { BaseView } from '../BaseView.js';
import { getEquipmentName, getEquipmentStats } from '../shared/EquipmentHelper.js';
import { SKILLS_DATA, TECHNIQUE_FAMILIES, GLYPH_DATA, computeGlyphEffect, computeGlyphCostMult } from '../../../engine/shared/data/GameConstants.js';
import { Hero } from '../../../engine/heroes/models/Hero.js';
import { HeroEquipmentModal } from './components/HeroEquipmentModal.js';
import { TrainerModal, WitchModal, AcademyModal, HallOfFameModal } from './components/HeroTrainingModals.js';
import { HeroInscriptionModal } from './components/HeroInscriptionModal.js';
import { HeroGambitModal } from './components/HeroGambitModal.js';

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
                
                const backBtn = e.target.closest('.btn-mobile-back');
                if (backBtn) {
                    this.selectedHeroId = null;
                    this.ui.update(this.lastRawState);
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
        const layout = this.root.querySelector('.master-detail-layout');
        if (layout) {
            if (this.selectedHeroId) {
                layout.classList.add('detail-active');
            } else {
                layout.classList.remove('detail-active');
            }
        }
        
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
            
            // If usesInTier is 0 and tier > 1, it might have just tiered up.
            const isJustLeveled = (usesInTier === 0 && tier > 1);
            const flashClass = isJustLeveled ? 'tier-up-flash' : '';

            const progressBar = `
                <div class="skill-tier-progress-container" style="margin-top:6px; font-size: 0.75rem; color: var(--text-secondary);">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                        <span>${this.t('ui_tier_progress') || 'Tier Progress'}</span>
                    </div>
                    <div class="skill-tier-bar ${flashClass}" style="height:6px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden; position:relative;">
                        <div style="width:${tierProgress}%;height:100%;background:var(--accent-color);border-radius:3px;transition:width 0.3s ease;"></div>
                    </div>
                </div>
            `;

            const effectLabel = this._getFamilyEffectLabel(family, tier);
            return `
                <div class="skill-item skill-learned ${isBodyInscribed ? 'skill-inscribed' : ''}">
                    <div class="skill-info" style="flex: 1; padding-right: 15px;">
                        <span class="skill-name">${this.t('family_' + familyId)}${isBodyInscribed ? ' · ✦' : ''}</span>
                        <span class="skill-meta">${effectLabel ? effectLabel + ' · ' : ''}${staCost} STA</span>
                        ${progressBar}
                    </div>
                    <div class="skill-actions" style="display: flex; align-items: center;">
                        <span class="skill-tier-badge ${flashClass}">Tier ${tier}</span>
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
            <div class="mobile-only-header btn-mobile-back">
                ← ${this.t('ui_back') || 'Back to Roster'}
            </div>
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
        HeroEquipmentModal.show(hero, slot, this.inventoryEquipment, this.t.bind(this), this.emit.bind(this));
    }

    _openTrainerModal() {
        const hero = this.lastRawState?.heroes?.find(h => h.id === this.selectedHeroId);
        TrainerModal.show(hero, this.ui?.i18n, this.t.bind(this));
    }

    _openWitchModal() {
        const heroes = this.lastRawState?.heroes || [];
        WitchModal.show(heroes, this.selectedHeroId, this.ui?.i18n, this.t.bind(this), this.lastRawState, this.emit.bind(this));
    }

    _openAcademyModal() {
        const hero = this.lastRawState?.heroes?.find(h => h.id === this.selectedHeroId);
        const designs = this.ui?.adapter?.engine?.getSpellDesigns() || [];
        AcademyModal.show(hero, designs, this.t.bind(this));
    }

    _openHallOfFameModal() {
        const hero = this.lastRawState?.heroes?.find(h => h.id === this.selectedHeroId);
        HallOfFameModal.show(hero, this.t.bind(this));
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
        HeroInscriptionModal.show(hero, this.t.bind(this), this.emit.bind(this));
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
        HeroGambitModal.show(hero, this.inventoryEquipment, this.t.bind(this), this.emit.bind(this));
    }

    _formatGambitRule(gambit) {
        return HeroGambitModal.formatGambitRule(gambit, this.t.bind(this));
    }

    showGambitTestResults(result, healthScore, rating) {
        HeroGambitModal.showTestResults(result, healthScore, rating, this.t.bind(this));
    }
}

