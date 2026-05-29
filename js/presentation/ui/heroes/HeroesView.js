import { BaseView } from '../BaseView.js';
import { TECHNIQUE_FAMILIES } from '../../../engine/shared/data/GameConstants.js';

import { HeroSkillsModal } from './components/HeroSkillsModal.js';
import { TrainerModal, WitchModal, AcademyModal, HallOfFameModal } from './components/HeroTrainingModals.js';
import { HeroInscriptionModal } from './components/HeroInscriptionModal.js';
import { GambitView } from '../gambit/GambitView.js';
import { createHeroMiniCard } from '../shared/components/HeroMiniCard.js';
import { createHeroProfilePane } from './components/HeroProfilePane.js';
import { diffList } from '../shared/utils/DOMUtils.js';

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
            recruitBtn: this.$('#btn-recruit-hero')
        };

        if (this.elements.recruitBtn) {
            this.elements.recruitBtn.addEventListener('click', () => {
                this.emit('recruitHero');
            });
        }

        // Initialize HeroProfilePane Component
        this.profilePane = createHeroProfilePane({
            onAllocateStat: (statId) => {
                this.emit('increaseStat', { heroId: this.selectedHeroId, statId });
            },
            onOpenEquip: (slot) => {
                this._openEquipModal(slot);
            },
            onLearnFamily: (familyId) => {
                this.emit('learnFamily', { heroId: this.selectedHeroId, familyId });
            },
            onOpenTrainer: () => {
                this._openTrainerModal();
            },
            onOpenMagicCircle: () => {
                this._openMagicCircleModal();
            },
            onOpenWitch: () => {
                this._openWitchModal();
            },
            onOpenAcademy: () => {
                this._openAcademyModal();
            },
            onOpenHall: () => {
                this._openHallOfFameModal();
            },
            onOpenInscribe: () => {
                this._openBodyInscriptionModal();
            },
            onOpenGambits: () => {
                this._openGambitModal();
            },
            onOpenEquipment: () => {
                this._openEquipmentModal();
            },
            onOpenSkills: () => {
                this._openSkillsModal();
            },
            onBack: () => {
                this.selectedHeroId = null;
                this.ui.update(this.lastRawState);
            },
            t: this.t.bind(this)
        });

        if (this.elements.detail) {
            this.elements.detail.innerHTML = '';
            this.elements.detail.appendChild(this.profilePane.root);
        }
    }

    update(state) {
        this.lastRawState = state;
        const heroes = state.heroes;
        if (!heroes) return;

        this.inventoryEquipment = state.inventory.equipment || [];

        const activeHero = heroes.find(h => h.id === this.selectedHeroId);
        if (this.ui?.equipmentView?.isOpen && activeHero) {
            this.ui.equipmentView.update({
                hero: activeHero,
                inventoryEquipment: this.inventoryEquipment
            });
        }
        if (HeroSkillsModal.isOpen() && activeHero) {
            HeroSkillsModal.update(activeHero);
        }
        if (this.ui?.gambitView && activeHero) {
            this.ui.gambitView.update(activeHero);
        }
        const infra = state.village?.infrastructure || {};
        const anyHeroLevel5 = heroes.some(h => h.level >= 5);
        const stateString = JSON.stringify({
            heroes: heroes.map(h => ({ id: h.id, level: h.level, activity: h.activity })),
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
        if (!this.elements.list) return;

        const newCards = heroes.map(hero => {
            const isSelected = hero.id === this.selectedHeroId;
            return createHeroMiniCard({
                hero,
                variant: 'list',
                selected: isSelected,
                onClick: (heroId) => {
                    this.selectedHeroId = heroId;
                    this.ui.update(this.lastRawState);
                },
                t: this.t.bind(this)
            }).root;
        });

        diffList(this.elements.list, newCards, 'data-id');
    }

    renderHeroDetail(state) {
        const hero = state.heroes.find(h => h.id === this.selectedHeroId);
        this.profilePane.update({ hero, state });
    }

    _openEquipModal(slot) {
        const hero = this.lastRawState.heroes.find(h => h.id === this.selectedHeroId);
        if (!hero) return;
        this.ui.openEquipmentOverlay({
            hero,
            inventoryEquipment: this.inventoryEquipment,
            t: this.t.bind(this),
            emit: this.emit.bind(this),
            initialSlot: slot
        });
    }

    _openEquipmentModal() {
        const hero = this.lastRawState?.heroes?.find(h => h.id === this.selectedHeroId);
        if (!hero) return;
        this.ui.openEquipmentOverlay({
            hero,
            inventoryEquipment: this.inventoryEquipment,
            t: this.t.bind(this),
            emit: this.emit.bind(this)
        });
    }

    _openSkillsModal() {
        const hero = this.lastRawState?.heroes?.find(h => h.id === this.selectedHeroId);
        HeroSkillsModal.show(hero, this.t.bind(this), (familyId) => {
            this.emit('learnFamily', { heroId: this.selectedHeroId, familyId });
        });
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

    _openGambitModal() {
        const hero = this.lastRawState?.heroes?.find(h => h.id === this.selectedHeroId);
        if (!hero) return;
        this.ui.openGambitOverlay({
            hero,
            inventoryEquipment: this.inventoryEquipment,
            t: this.t.bind(this),
            emit: this.emit.bind(this)
        });
    }

    _formatGambitRule(gambit) {
        return GambitView.formatGambitRule(gambit, this.t.bind(this));
    }

    showGambitTestResults(result, healthScore, rating) {
        GambitView.showTestResults(result, healthScore, rating, this.t.bind(this));
    }
}
