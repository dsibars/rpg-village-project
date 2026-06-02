/**
 * EngineAdapter - Orchestrates the Engine and UI.
 * Connects events from UI to Engine and updates UI from Engine state.
 */
const DEBUG = false;

import { PostDaySequencer } from '../ui/shared/PostDaySequencer.js';

export class EngineAdapter {
    constructor(engine, ui) {
        this.engine = engine;
        this.ui = ui;
        this.rafId = null;
        this.lastUpdateTime = 0;
        this.UPDATE_INTERVAL = 100; // Update UI every 100ms (10 FPS is enough for state, animations are handled by CSS)
        this.postDaySequencer = new PostDaySequencer(ui, engine);
    }

    init() {
        this.ui.engine = this.engine;
        this.ui.adapter = this;
        this.ui.combatView.engine = this.engine;
        this.ui.combatView.adapter = this;
        // Setup Global UI Events
        const btnNextDay = document.getElementById('btn-global-next-day');
        if (btnNextDay) {
            btnNextDay.addEventListener('click', () => {
                // Add click effect
                btnNextDay.style.transform = 'scale(0.95)';
                setTimeout(() => btnNextDay.style.transform = '', 100);

                const report = this.engine.nextDay();
                if (report && report.expedition) {
                    if (report.expedition.status === 'battle_started') {
                        this.ui.openCombatOverlay(report.expedition, () => {
                            this.postDaySequencer.run(report);
                        });
                    } else if (report.expedition.combatLog) {
                        this.ui.playBattleLog(report.expedition.combatLog, () => {
                            this.postDaySequencer.run(report);
                        });
                    } else {
                        this.postDaySequencer.run(report);
                    }
                } else {
                    this.postDaySequencer.run(report);
                }
            });
        }

        // Wire up view events
        this.ui.views.forEach((view, domain) => {            if (domain === 'buildings') {
                view.on('startProject', (data) => {
                    const result = this.engine.startProject(
                        data.buildingId,
                        data.targetLevel,
                        data.costGold,
                        data.costMaterials,
                        data.duration
                    );
                    if (!result.success) {
                        this.ui.showToast(this.engine.i18n.t(result.error));
                    }
                    this.forceUpdate();
                });
            }
            
            if (domain === 'village') {
                view.on('setWorkerRole', (data) => {
                    const result = this.engine.setWorkerRole(data.role, data.delta);
                    if (!result.success) {
                        this.ui.showToast(this.engine.i18n.t(result.error));
                    }
                    this.forceUpdate();
                });
                view.on('assignDefense', (data) => {
                    const result = this.engine.assignDefense(data.heroId);
                    if (!result.success) {
                        this.ui.showToast(this.engine.i18n.t(result.error));
                    }
                    this.forceUpdate();
                });
                view.on('unassignDefense', (data) => {
                    const result = this.engine.unassignDefense(data.heroId);
                    if (!result.success) {
                        this.ui.showToast(this.engine.i18n.t(result.error));
                    }
                    this.forceUpdate();
                });
            }
            
            if (domain === 'explore') {
                view.on('assignExpedition', (data) => {
                    const result = this.engine.assignExpedition(data.expId, data.heroIds);
                    if (!result.success) {
                        this.ui.showToast(this.engine.i18n.t(result.error));
                    }
                    this.forceUpdate();
                });
                view.on('checkDefenseAdvisory', (data) => {
                    const advisory = this.engine.getDefenseAdvisory(data.expId, data.heroIds);
                    
                    if (advisory.hasWarning && advisory.warningKey) {
                        const i18n = this.engine.i18n;
                        let message = i18n.t(advisory.warningKey);
                        
                        // Replace placeholders if present
                        if (advisory.nextRaidDay !== null) {
                            const daysUntilRaid = advisory.nextRaidDay - (this.engine.villageService.getState().day || 1);
                            message = message
                                .replace('{raidDay}', advisory.nextRaidDay)
                                .replace('{returnDay}', advisory.expeditionReturnDay)
                                .replace('{daysUntilRaid}', daysUntilRaid);
                        }
                        
                        this.ui.showConfirmDialog({
                            title: 'shared_uxelm_advisory_title',
                            message: message,
                            onConfirm: () => {
                                const result = this.engine.assignExpedition(data.expId, data.heroIds);
                                if (!result.success) {
                                    this.ui.showToast(i18n.t(result.error));
                                }
                                this.forceUpdate();
                            }
                        });
                    } else {
                        // No warning — proceed directly
                        const result = this.engine.assignExpedition(data.expId, data.heroIds);
                        if (!result.success) {
                            this.ui.showToast(this.engine.i18n.t(result.error));
                        }
                        this.forceUpdate();
                    }
                });
                view.on('retireExpedition', (data) => {
                    this.engine.retireExpedition(data && data.expId ? data.expId : null);
                    this.forceUpdate();
                });
            }

            if (domain === 'heroes') {
                view.on('recruitHero', () => {
                    const result = this.engine.recruitHero();
                    if (result.success) {
                        this.ui.showToast(`${this.engine.i18n.t('heroes_uxelm_recruit_success')} ${result.data.hero.name}! (-${result.data.cost}g)`);
                    } else {
                        this.ui.showToast(this.engine.i18n.t(result.error));
                    }
                    this.forceUpdate();
                });
                view.on('increaseStat', (data) => {
                    const result = this.engine.increaseHeroStat(data.heroId, data.statId);
                    if (!result.success) {
                        this.ui.showToast(this.engine.i18n.t(result.error));
                    }
                    this.forceUpdate();
                });
                view.on('equipItem', (data) => {
                    const result = this.engine.equipHeroItem(data.heroId, data.slot, data.itemId);
                    if (!result.success) {
                        this.ui.showToast(this.engine.i18n.t(result.error));
                    }
                    this.forceUpdate();
                });
                view.on('unequipItem', (data) => {
                    const result = this.engine.unequipHeroItem(data.heroId, data.slot);
                    if (!result.success) {
                        this.ui.showToast(this.engine.i18n.t(result.error));
                    }
                    this.forceUpdate();
                });
                view.on('learnFamily', (data) => {
                    const result = this.engine.learnHeroFamily(data.heroId, data.familyId);
                    if (!result.success) {
                        this.ui.showToast(this.engine.i18n.t(result.error));
                    }
                    this.forceUpdate();
                });
                view.on('inscribeSpell', (data) => {
                    const result = this.engine.inscribeHeroSpell(data.heroId, data.spell);
                    if (!result.success) {
                        this.ui.showToast(this.engine.i18n.t(result.error));
                    }
                    this.forceUpdate();
                });
                view.on('inscribeBodyCircle', (data) => {
                    const result = this.engine.inscribeHeroBodyCircle(data.heroId, data.glyphIds, data.glyphTiers);
                    if (!result.success) {
                        this.ui.showToast(this.engine.i18n.t(result.error));
                    }
                    this.forceUpdate();
                });
                // Body inscription is overwrite-only; no erase event needed
                view.on('addGambit', (data) => {
                    const result = this.engine.addHeroGambit(data.heroId, data.gambit);
                    if (!result.success) {
                        this.ui.showToast(this.engine.i18n.t(result.error));
                    }
                    this.forceUpdate();
                });
                view.on('removeGambit', (data) => {
                    const result = this.engine.removeHeroGambit(data.heroId, data.gambitId);
                    if (!result.success) {
                        this.ui.showToast(this.engine.i18n.t(result.error));
                    }
                    this.forceUpdate();
                });
                view.on('toggleGambit', (data) => {
                    const result = this.engine.toggleHeroGambit(data.heroId, data.gambitId);
                    if (!result.success) {
                        this.ui.showToast(this.engine.i18n.t(result.error));
                    }
                    this.forceUpdate();
                });
                view.on('moveGambit', (data) => {
                    const result = this.engine.moveHeroGambit(data.heroId, data.gambitId, data.direction);
                    if (!result.success) {
                        this.ui.showToast(this.engine.i18n.t(result.error));
                    }
                    this.forceUpdate();
                });
                view.on('updateFallbackAction', (data) => {
                    const result = this.engine.updateHeroFallbackAction(data.heroId, data.action);
                    if (!result.success) {
                        this.ui.showToast(this.engine.i18n.t(result.error));
                    }
                    this.forceUpdate();
                });
                view.on('testGambits', (data) => {
                    const result = this.engine.testHeroGambits(data.heroId, data.enemies);
                    if (!result.success) {
                        this.ui.showToast(this.engine.i18n.t(result.error));
                    } else {
                        // Launch the test modal
                        this.ui.views.get('heroes').showGambitTestResults(
                            result.data.result, 
                            result.data.healthScore, 
                            result.data.rating
                        );
                    }
                    this.forceUpdate();
                });
                view.on('suggestPreset', (data) => {
                    const result = this.engine.suggestHeroGambitPreset(data.heroId);
                    if (!result.success) {
                        this.ui.showToast(this.engine.i18n.t(result.error));
                    } else {
                        const count = result.data.addedCount;
                        const presetName = this.engine.i18n.t(result.data.presetId);
                        this.ui.showToast(`Applied ${presetName} (+${count} gambits)`);
                    }
                    this.forceUpdate();
                });
            }

            if (domain === 'shop') {
                view.on('buyItem', (data) => {
                    const result = this.engine.buyItem(data.itemData, data.costGold);
                    if (!result.success) {
                        this.ui.showToast(this.engine.i18n.t(result.error));
                    }
                    this.forceUpdate();
                });
                view.on('sellItem', (data) => {
                    const result = this.engine.sellItem(data.itemId, data.itemType, data.sellPrice);
                    if (!result.success) {
                        this.ui.showToast(this.engine.i18n.t(result.error));
                    } else {
                        this.ui.showToast(`+${result.data.goldEarned}g`);
                    }
                    this.forceUpdate();
                });
                view.on('sellResource', (data) => {
                    const result = this.engine.sellResource(data.resourceId, data.quantity);
                    if (!result.success) {
                        this.ui.showToast(this.engine.i18n.t(result.error));
                    } else {
                        this.ui.showToast(`+${result.data.goldEarned}g (${result.data.sold} ${this.engine.i18n.t(data.resourceId)})`);
                    }
                    this.forceUpdate();
                });
            }

            if (domain === 'inventory') {
                view.on('cookMeal', (data) => {
                    const result = this.engine.cookMeal(data.recipeId);
                    if (result.success) {
                        this.ui.showToast(this.engine.i18n.t('inventory_uxelm_cooked') + ' ' + this.engine.i18n.t(data.recipeId));
                    } else {
                        this.ui.showToast(this.engine.i18n.t(result.error));
                    }
                    this.forceUpdate();
                });
                view.on('consumeMeal', (data) => {
                    const result = this.engine.consumeMeal(data.mealId);
                    if (result.success) {
                        this.ui.showToast(`${this.engine.i18n.t('inventory_uxelm_fed')} ${result.data.fedCount} ${this.engine.i18n.t('heroes_uxelm_heroes')}`);
                    } else {
                        this.ui.showToast(this.engine.i18n.t(result.error));
                    }
                    this.forceUpdate();
                });
                view.on('useGlyphTablet', (data) => {
                    const result = this.engine.useGlyphTablet(data.heroId, data.tabletId);
                    if (result.success) {
                        const glyphId = result.data.glyphId;
                        const hero = this.engine.heroService.get(data.heroId);
                        const transGlyph = this.engine.i18n.t('magic_circle_info_' + glyphId);
                        this.ui.showToast(`${hero.name} learned ${transGlyph}!`);
                    } else {
                        this.ui.showToast(this.engine.i18n.t(result.error));
                    }
                    this.forceUpdate();
                });
            }

            if (domain === 'forge') {
                view.on('refineItem', (data) => {
                    const result = this.engine.refineEquipment(data.itemId);
                    if (!result.success) {
                        this.ui.showToast(this.engine.i18n.t(result.error));
                    }
                    this.forceUpdate();
                });
            }

            if (domain === 'settings') {
                view.on('devCheatActivate', () => {
                    if (DEBUG) console.log('EngineAdapter: devCheatActivate received');
                    this.engine.activateDeveloperCheat();
                    this.forceUpdate();
                });
            }
        });

        // Handle UI actions (legacy)
        this.ui.onInitialize(() => {
            if (DEBUG) console.log('Village initialization requested via Adapter');
        });

        // Start the game loop
        this.startLoop();
    }

    forceUpdate() {
        const newState = this.engine.update();
        this.ui.update(newState);
    }

    startLoop() {
        const loop = (timestamp) => {
            // Throttled update to prevent UI thrashing
            if (timestamp - this.lastUpdateTime >= this.UPDATE_INTERVAL) {
                const newState = this.engine.update();
                
                // Combat Auto-Advance Tick
                if (newState.activeBattle && !newState.activeBattle.isOver) {
                    const battle = newState.activeBattle;
                    const activeActor = battle.turnOrder[battle.currentTurnIndex];
                    const isHeroTurn = activeActor && activeActor.type === 'Hero';
                    
                    if (!isHeroTurn || battle.autoBattle) {
                        const now = Date.now();
                        if (!this.lastCombatAdvanceTime) {
                            this.lastCombatAdvanceTime = now;
                        }
                        
                        if (now - this.lastCombatAdvanceTime >= 500) {
                            this.engine.nextBattleTurn();
                            this.lastCombatAdvanceTime = now;
                        }
                    } else {
                        this.lastCombatAdvanceTime = null;
                    }
                } else {
                    this.lastCombatAdvanceTime = null;
                }

                this.ui.update(newState);
                this.lastUpdateTime = timestamp;
            }
            this.rafId = requestAnimationFrame(loop);
        };
        this.rafId = requestAnimationFrame(loop);
    }

    stopLoop() {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
        }
    }
}
