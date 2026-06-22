import { persistence } from '../../shared/core/Persistence.js';
import { Result } from '../../shared/core/Result.js';
import { Enemy } from '../../shared/combat/models/Enemy.js';
import { LootService } from './LootService.js';

/**
 * ExpeditionService handles expedition lifecycle & combat orchestration.
 * Region logic is delegated to RegionService.
 * Supports concurrent expeditions (round-robin resolution).
 */
export class ExpeditionService {
    constructor(battleService, heroService, villageService, inventoryService, regionService, options = {}) {
        this.battleService = battleService;
        this.heroService = heroService;
        this.villageService = villageService;
        this.inventoryService = inventoryService;
        this.regionService = regionService;
        this.lootService = new LootService(regionService.getRegionData.bind(regionService));
        
        this.STORAGE_KEY = 'expedition_state';
        this.state = this._getDefaultState();
        if (!options.deferLoad) {
            this.load();
        }
    }

    load() {
        this.state = this._load();
    }

    _getDefaultState() {
        return {
            completedIds: [],
            activeExpeditions: [],
            expeditionTurnIndex: 0,
            activeCombatExpeditionId: null,
            bestiary: [],
            pendingNarratives: [],
            storyMissions: {}
        };
    }

    // ─── Getters / Proxies ──────────────────────────────────────────

    getCompletedIds() {
        return this.state.completedIds || [];
    }

    getActiveExpeditions() {
        return this.state.activeExpeditions;
    }

    getActiveCombatExpeditionId() {
        return this.state.activeCombatExpeditionId;
    }

    getPendingNarratives() {
        return this.state.pendingNarratives || [];
    }

    consumePendingNarratives() {
        this.state.pendingNarratives = [];
        this.save();
    }

    getStoryMissionStatus(missionId) {
        return this.state.storyMissions?.[missionId] || null;
    }

    getCompletedStoryMissions() {
        return Object.keys(this.state.storyMissions || {});
    }

    _enqueueNarrative(narrative) {
        // Deduplicate by titleKey
        const alreadyQueued = (this.state.pendingNarratives || []).some(
            n => n.titleKey === narrative.titleKey
        );
        if (!alreadyQueued) {
            if (!this.state.pendingNarratives) {
                this.state.pendingNarratives = [];
            }
            this.state.pendingNarratives.push(narrative);
            this.save();
        }
    }

    _load() {
        const defaultState = this._getDefaultState();
        const loaded = persistence.load(this.STORAGE_KEY, defaultState);

        if (!loaded.completedIds) loaded.completedIds = [];

        // Strip legacy regions field — now owned by RegionService
        if (loaded.regions) {
            delete loaded.regions;
        }

        // Migrate old singular activeExpedition to array
        if (loaded.activeExpedition && !loaded.activeExpeditions) {
            loaded.activeExpeditions = [loaded.activeExpedition];
            loaded.activeCombatExpeditionId = loaded.activeExpedition.id;
            delete loaded.activeExpedition;
        }
        if (!loaded.activeExpeditions) loaded.activeExpeditions = [];
        if (loaded.expeditionTurnIndex === undefined) loaded.expeditionTurnIndex = 0;
        if (!loaded.bestiary) loaded.bestiary = [];
        if (!loaded.pendingNarratives) loaded.pendingNarratives = [];
        if (!loaded.storyMissions) loaded.storyMissions = {};

        return loaded;
    }

    save() {
        persistence.save(this.STORAGE_KEY, this.state);
    }

    getMaxConcurrentExpeditions() {
        const explorerGuildLevel = this.villageService.getState().infrastructure.explorer_guild || 0;
        return 1 + explorerGuildLevel;
    }

    /**
     * Returns the list of all available expeditions (proxy to RegionService).
     */
    getExpeditions() {
        return this.regionService.getAvailableExpeditions();
    }

    getRegionTree(regionId) {
        return this.regionService.getRegionTree(regionId);
    }

    /**
     * Public method for GameEngine to call to check region unlocks.
     */
    checkRegionUnlocks() {
        const heroCount = this.heroService.getHeroes ? this.heroService.getHeroes().length : 0;
        this.regionService.checkRegionUnlocks(this.state.completedIds, heroCount);
    }

    /**
     * For developer cheat: adds expId to completedIds and saves.
     */
    markCompleted(expId) {
        if (!this.state.completedIds.includes(expId)) {
            this.state.completedIds.push(expId);
        }
        this.save();
    }



    /**
     * Determines if a hero is currently on an expedition.
     */
    getHeroActivity(heroId) {
        for (const exp of this.state.activeExpeditions) {
            if (exp.heroIds.includes(heroId)) {
                return {
                    type: 'expedition',
                    expeditionId: exp.id
                };
            }
        }
        return { type: 'idle' };
    }

    /**
     * Assigns heroes to an expedition.
     * Can only add/modify if currentStage === 0.
     */
    assignExpedition(expId, heroIds) {
        const existing = this.state.activeExpeditions.find(e => e.id === expId);
        
        if (existing) {
            if (existing.currentStage > 0) {
                return Result.fail('explore_error_expedition_locked');
            }
        } else {
            // New expedition — check concurrency limit
            const max = this.getMaxConcurrentExpeditions();
            if (this.state.activeExpeditions.length >= max) {
                return Result.fail('explore_error_expeditions_max');
            }
            // Check for heroes already on other expeditions
            for (const other of this.state.activeExpeditions) {
                for (const hId of heroIds) {
                    if (other.heroIds.includes(hId)) {
                        return Result.fail('explore_error_hero_busy_expedition');
                    }
                }
            }
        }
        
        const exp = this.getExpeditions().find(e => e.id === expId);
        if (!exp || (exp.status && exp.status !== 'available')) return Result.fail('explore_error_expedition_unavailable');

        const heroes = heroIds.map(id => this.heroService.get(id)).filter(h => h);
        if (heroes.length === 0) {
            // If they assign 0 heroes, it's effectively retiring this expedition.
            this.state.activeExpeditions = this.state.activeExpeditions.filter(e => e.id !== expId);
            this.save();
            return Result.ok();
        }

        const hasDeadHero = heroes.some(h => h.hp <= 0);
        if (hasDeadHero) return Result.fail('explore_error_hero_dead');

        if (existing) {
            existing.heroIds = heroes.map(h => h.id);
        } else {
            this.state.activeExpeditions.push({
                id: expId,
                currentStage: 0,
                heroIds: heroes.map(h => h.id),
                status: 'assigned'
            });
        }

        this.save();
        return Result.ok(this.state.activeExpeditions.find(e => e.id === expId));
    }

    /**
     * Unassigns a single hero from any active expedition.
     * If the expedition becomes empty, it is removed.
     */
    unassignHero(heroId) {
        for (let i = 0; i < this.state.activeExpeditions.length; i++) {
            const exp = this.state.activeExpeditions[i];
            if (exp.heroIds.includes(heroId)) {
                exp.heroIds = exp.heroIds.filter(id => id !== heroId);
                if (exp.heroIds.length === 0) {
                    this.state.activeExpeditions.splice(i, 1);
                }
                this.save();
                return Result.ok();
            }
        }
        return Result.fail('explore_error_expedition_none');
    }

    /**
     * Retires a specific expedition. If no expId provided, retires all.
     */
    retire(expId) {
        if (expId) {
            const active = this.state.activeExpeditions.find(e => e.id === expId);
            if (active) {
                this._trackRetreat(active.id);
            }
            this.state.activeExpeditions = this.state.activeExpeditions.filter(e => e.id !== expId);
        } else {
            // Retire all — track each one
            for (const active of this.state.activeExpeditions) {
                this._trackRetreat(active.id);
            }
            this.state.activeExpeditions = [];
        }
        this.state.activeCombatExpeditionId = null;
        this.regionService.save();
        this.save();
        return Result.ok();
    }

    _trackRetreat(expId) {
        const expDef = this.regionService.getExpeditionDefinition(expId);
        if (expDef) {
            this.regionService.incrementRegionStat(expDef.regionId, 'retreats');
        }
    }



    _findActiveExpeditionById(expId) {
        return this.state.activeExpeditions.find(e => e.id === expId);
    }

    /**
     * Processes one stage of the next active expedition during the day advance (round-robin).
     */
    processDay() {
        const expeditions = this.state.activeExpeditions;
        if (expeditions.length === 0) {
            return Result.ok();
        }

        // Safety: if a battle is somehow still active, resume it instead
        if (this.state.activeCombatExpeditionId) {
            const combatExp = this._findActiveExpeditionById(this.state.activeCombatExpeditionId);
            if (combatExp && combatExp.status === 'combat') {
                const resumed = this.resumeActiveBattle();
                if (resumed) {
                    return Result.ok({
                        status: 'battle_started',
                        expId: combatExp.id,
                        expName: this.getExpeditions().find(e => e.id === combatExp.id)?.name || combatExp.id,
                        battleContext: combatExp.battleContext
                    });
                }
            }
        }

        // Pick expedition by round-robin index
        const idx = this.state.expeditionTurnIndex % expeditions.length;
        const activeExp = expeditions[idx];
        
        if (!activeExp || activeExp.heroIds.length === 0) {
            // Empty expedition — remove and skip
            this.state.activeExpeditions.splice(idx, 1);
            this.state.expeditionTurnIndex = this.state.activeExpeditions.length > 0
                ? idx % this.state.activeExpeditions.length
                : 0;
            this.save();
            return Result.ok();
        }

        const exp = this.getExpeditions().find(e => e.id === activeExp.id);
        if (!exp) {
            // Defensive: expedition definition no longer exists
            this.state.activeExpeditions.splice(idx, 1);
            this.state.expeditionTurnIndex = this.state.activeExpeditions.length > 0
                ? idx % this.state.activeExpeditions.length
                : 0;
            this.save();
            return Result.ok();
        }

        const stage = exp.stages[activeExp.currentStage];

        if (stage.type === 'battle') {
            const heroes = this.heroService.list().filter(h => activeExp.heroIds.includes(h.id));
            
            // Normalize enemy entries (handle both string IDs and {id, isElite, eliteTier} objects)
            const normalizedEnemies = stage.enemies.map(e => (typeof e === 'string' ? { id: e } : e));
            
            const enemyCounts = {};
            normalizedEnemies.forEach(e => {
                enemyCounts[e.id] = (enemyCounts[e.id] || 0) + 1;
            });
            const enemyIndices = {};
            const enemies = normalizedEnemies.map(e => {
                const enemyLevel = stage.enemyLevel || 1;
                const statMultiplier = stage.statMultiplier || 1.1;
                const rData = this.regionService.getRegionData(exp.regionId);
                const enemy = this._createEnemy(e.id, stage.isBoss, enemyLevel, e.isElite || false, e.eliteTier || 0, statMultiplier, rData.baseLevel || 1);
                if (enemyCounts[e.id] > 1) {
                    enemyIndices[e.id] = (enemyIndices[e.id] || 0) + 1;
                    const suffix = String.fromCharCode(64 + enemyIndices[e.id]); // A, B, C...
                    enemy.name = `${enemy.name} ${suffix}`;
                }
                return enemy;
            });

            // Track initial HP for the log
            const initialHp = {};
            heroes.forEach(h => initialHp[h.id] = h.hp);

            // Calculate potential EXP (elites grant +50% proportional bonus)
            const totalEnemyHp = enemies.reduce((sum, e) => sum + e.maxHp, 0);
            const eliteCount = enemies.filter(e => e.isElite).length;
            const expMultiplier = 1 + (eliteCount * 0.5 / Math.max(1, enemies.length));
            const expPerHero = Math.floor((totalEnemyHp / heroes.length) * expMultiplier);
            const stageNum = activeExp.currentStage + 1;
            const stageTotal = exp.stages.length;

            // Track encountered enemies for bestiary
            normalizedEnemies.forEach(e => this._trackBestiary(e.id));

            // Start battle (manual by default)
            this.battleService.startBattle(heroes, enemies, false);

            activeExp.status = 'combat';
            activeExp.battleContext = {
                enemies: enemies.map(e => e.toJSON()),
                initialHp,
                expPerHero,
                totalEnemyHp,
                stageNum,
                stageTotal,
                expName: exp.name
            };
            this.state.activeCombatExpeditionId = activeExp.id;
            
            // Advance turn index for next day (round-robin)
            this.state.expeditionTurnIndex = (idx + 1) % this.state.activeExpeditions.length;
            this.save();

            return Result.ok({
                status: 'battle_started',
                expId: exp.id,
                expName: exp.name,
                battleContext: activeExp.battleContext
            });
        }

        return Result.fail('explore_error_stage_type_unknown');
    }

    resumeActiveBattle() {
        if (!this.state.activeCombatExpeditionId) return null;
        const activeExp = this._findActiveExpeditionById(this.state.activeCombatExpeditionId);
        if (!activeExp || activeExp.status !== 'combat') return null;
        
        const ctx = activeExp.battleContext;
        const heroes = this.heroService.list().filter(h => activeExp.heroIds.includes(h.id));
        const enemies = ctx.enemies.map(eData => new Enemy(eData));
        
        this.battleService.startBattle(heroes, enemies, false);
        return {
            expId: activeExp.id,
            expName: ctx.expName,
            battleContext: ctx
        };
    }

    getBattleResolutionPreview() {
        if (!this.state.activeCombatExpeditionId) return null;
        const activeExp = this._findActiveExpeditionById(this.state.activeCombatExpeditionId);
        if (!activeExp || activeExp.status !== 'combat') return null;
        if (!this.battleService.isOver) return null;

        const exp = this.getExpeditions().find(e => e.id === activeExp.id);
        if (!exp) return null;

        const ctx = activeExp.battleContext;
        const heroes = this.heroService.list().filter(h => activeExp.heroIds.includes(h.id));
        const enemies = this.battleService.enemies;
        
        const isVictory = this.battleService.winner === 'heroes';
        const totalDamageDone = enemies.reduce((sum, e) => sum + (e.maxHp - Math.max(0, e.hp)), 0);
        const depletionProportion = ctx.totalEnemyHp > 0 ? totalDamageDone / ctx.totalEnemyHp : 0;

        const summary = [];
        heroes.forEach(h => {
            let leveledUp = false;
            let expEarned = 0;

            // Track lifetime stats
            if (!h.lifetimeStats) h.lifetimeStats = { enemiesDefeated: 0, damageDealt: 0, damageTaken: 0, expeditionsCompleted: 0, battlesWon: 0, battlesLost: 0, highestDamageDealt: 0 };

            if (isVictory) {
                if (h.hp > 0) {
                    expEarned = ctx.expPerHero;
                }
            } else {
                const minimumExp = Math.floor(ctx.expPerHero * 0.25);
                const damageBasedExp = Math.floor(ctx.expPerHero * depletionProportion * 0.5);
                expEarned = Math.max(minimumExp, damageBasedExp);
            }

            if (expEarned > 0) {
                let currentExp = h.exp + expEarned;
                let currentLevel = h.level;
                while (true) {
                    const nextLevelExp = currentLevel * 20;
                    if (currentExp >= nextLevelExp) {
                        currentExp -= nextLevelExp;
                        currentLevel++;
                    } else {
                        break;
                    }
                }
                leveledUp = currentLevel > h.level;
            }

            const hpLost = (ctx.initialHp[h.id] !== undefined ? ctx.initialHp[h.id] : h.maxHp) - h.hp;

            summary.push({
                heroId: h.id,
                heroName: h.name,
                expEarned,
                leveledUp,
                hpLost
            });
        });

        let rewards = null;
        let isLastStage = false;
        if (isVictory) {
            const nextStage = activeExp.currentStage + 1;
            if (nextStage >= exp.stages.length) {
                isLastStage = true;
                rewards = exp.reward;
            }
        }

        return {
            isVictory,
            summary,
            isLastStage,
            rewards
        };
    }

    resolveBattle() {
        if (!this.state.activeCombatExpeditionId) {
            return Result.fail('combat_error_battle_none');
        }
        const activeExp = this._findActiveExpeditionById(this.state.activeCombatExpeditionId);
        if (!activeExp || activeExp.status !== 'combat') {
            return Result.fail('combat_error_battle_none');
        }
        if (!this.battleService.isOver) {
            return Result.fail('combat_error_battle_active');
        }

        const exp = this.getExpeditions().find(e => e.id === activeExp.id);
        if (!exp) return Result.fail('explore_error_expedition_not_found');

        const ctx = activeExp.battleContext;
        const heroes = this.heroService.list().filter(h => activeExp.heroIds.includes(h.id));
        const enemies = this.battleService.enemies;
        
        const isVictory = this.battleService.winner === 'heroes';
        const stageNum = ctx.stageNum;
        const stageTotal = ctx.stageTotal;

        const combatLog = {
            heroes: heroes.map(h => h.name),
            enemies: enemies.map(e => e.name),
            enemyDetails: enemies.map(e => ({ isElite: e.isElite, isBoss: e.isBoss })),
            events: [...this.battleService.log],
            summary: [],
            isVictory
        };

        const totalDamageDone = enemies.reduce((sum, e) => sum + (e.maxHp - Math.max(0, e.hp)), 0);
        const depletionProportion = ctx.totalEnemyHp > 0 ? totalDamageDone / ctx.totalEnemyHp : 0;

        heroes.forEach(h => {
            let leveledUp = false;
            let expEarned = 0;

            // Track lifetime stats
            if (!h.lifetimeStats) h.lifetimeStats = { enemiesDefeated: 0, damageDealt: 0, damageTaken: 0, expeditionsCompleted: 0, battlesWon: 0, battlesLost: 0, highestDamageDealt: 0 };
            if (isVictory) {
                h.lifetimeStats.battlesWon++;
            } else {
                h.lifetimeStats.battlesLost++;
            }

            if (isVictory) {
                if (h.hp > 0) {
                    const preLevel = h.level;
                    h.addExperience(ctx.expPerHero);
                    leveledUp = h.level > preLevel;
                    expEarned = ctx.expPerHero;
                }
            } else {
                const minimumExp = Math.floor(ctx.expPerHero * 0.25);
                const damageBasedExp = Math.floor(ctx.expPerHero * depletionProportion * 0.5);
                const partialExp = Math.max(minimumExp, damageBasedExp);
                if (partialExp > 0) {
                    const preLevel = h.level;
                    h.addExperience(partialExp);
                    leveledUp = h.level > preLevel;
                    expEarned = partialExp;
                }
            }

            const hpLost = (ctx.initialHp[h.id] !== undefined ? ctx.initialHp[h.id] : h.maxHp) - h.hp;

            // --- Fatigue gain from battle ---
            // Base 5 fatigue per battle, +2 per enemy, +10 for defeat
            const enemyCount = enemies.length;
            const isBossBattle = enemies.some(e => e.isBoss);
            const fatigueGain = isVictory
                ? 5 + (enemyCount * 2) + (isBossBattle ? 5 : 0)
                : 15 + (enemyCount * 3);
            h.addFatigue(fatigueGain);

            combatLog.summary.push({
                heroId: h.id,
                heroName: h.name,
                expName: exp.name,
                stageNum,
                stageTotal,
                expEarned,
                leveledUp,
                hpLost
            });
        });

        this.heroService.saveAll();

        let finalResult;
        if (isVictory) {
            activeExp.currentStage++;
            if (activeExp.currentStage >= exp.stages.length) {
                const result = this._finishExpedition(exp, activeExp);
                result.data.combatLog = combatLog;
                finalResult = result;
            } else {
                activeExp.status = 'assigned';
                delete activeExp.battleContext;
                this.state.activeCombatExpeditionId = null;
                this.save();
                finalResult = Result.ok({ status: 'progress', expId: exp.id, expName: exp.name, combatLog });
            }
        } else {
            // Defeat removes this expedition
            const expId = activeExp.id;
            const expName = exp.name;
            const idx = this.state.activeExpeditions.findIndex(e => e.id === expId);
            if (idx >= 0) {
                this.state.activeExpeditions.splice(idx, 1);
            }
            this.state.activeCombatExpeditionId = null;

            // Track region failure stats
            this.regionService.incrementRegionStat(exp.regionId, 'fails');

            this.regionService.save();
            this.save();
            finalResult = Result.ok({ status: 'failed', expId, expName, combatLog });
        }

        // Restore stamina for heroes between battles
        this.battleService.restoreStaminaForHeroes();

        // Reset battle service state
        this.battleService.reset();

        return finalResult;
    }

    _finishExpedition(exp, activeExp) {
        this.state.completedIds.push(exp.id);

        // Track expedition completion for heroes
        const heroes = this.heroService.list().filter(h => activeExp.heroIds.includes(h.id));
        heroes.forEach(h => {
            if (!h.lifetimeStats) h.lifetimeStats = { enemiesDefeated: 0, damageDealt: 0, damageTaken: 0, expeditionsCompleted: 0, battlesWon: 0, battlesLost: 0, highestDamageDealt: 0 };
            h.lifetimeStats.expeditionsCompleted++;
        });
        
        // Remove from active expeditions
        const idx = this.state.activeExpeditions.findIndex(e => e.id === activeExp.id);
        if (idx >= 0) {
            this.state.activeExpeditions.splice(idx, 1);
        }
        this.state.activeCombatExpeditionId = null;

        // Delegate region completion to RegionService
        const { wasFirstClear, firstClearNarrative } = this.regionService.completeExpedition(
            exp.id,
            heroes.map(h => h.id),
            heroes.map(h => h.name),
            this.state.completedIds
        );

        // Enqueue region first-clear narrative
        if (firstClearNarrative) {
            this._enqueueNarrative({
                id: `nar_${exp.regionId}_first_clear`,
                ...firstClearNarrative
            });
        }

        // First-clear permanent speed boost
        if (wasFirstClear) {
            const region = this.regionService.getRegion(exp.regionId);
            if (region && !region.firstClearBonusGiven) {
                region.firstClearBonusGiven = true;
                heroes.forEach(h => {
                     h.addPermanentSpeedBonus(2);
                });
            }
        }

        // Register story mission completion
        if (exp.isStory) {
            const villageState = this.villageService.getState();
            this.state.storyMissions[exp.id] = {
                dayCompleted: villageState.day || 1,
                heroIds: heroes.map(h => h.id)
            };
        }

        // Distribute standard rewards (gold, items, loot, consumables)
        const drops = this._distributeRewards(exp);

        // Resolve story mission effects
        this._resolveEffects(exp, heroes);

        // Check if any new regions should unlock
        const heroCount = this.heroService.getHeroes ? this.heroService.getHeroes().length : 0;
        this.regionService.checkRegionUnlocks(this.state.completedIds, heroCount);
        
        // Save each involved service exactly once
        this.heroService.saveAll();
        this.regionService.save();
        this.save();
        
        return Result.ok({ status: 'completed', expId: exp.id, expName: exp.name, reward: exp.reward, drops });
    }

    /**
     * Distributes rewards from a completed expedition.
     */
    _distributeRewards(exp) {
        const drops = { items: {}, loot: null, consumables: [], glyphs: [] };

        // Grant gold and items
        if (exp.reward.gold) this.villageService.addGold(exp.reward.gold);
        if (exp.reward.items) {
            Object.entries(exp.reward.items).forEach(([id, qty]) => {
                this.villageService.addItemToInventory(id, qty);
                drops.items[id] = qty;
            });
        }

        // Closure bonus (path sealed)
        if (exp.reward.closureBonus) {
            if (exp.reward.closureBonus.gold) {
                this.villageService.addGold(exp.reward.closureBonus.gold);
                drops.closureGold = exp.reward.closureBonus.gold;
            }
            if (exp.reward.closureBonus.items) {
                Object.entries(exp.reward.closureBonus.items).forEach(([id, qty]) => {
                    this.villageService.addItemToInventory(id, qty);
                    drops.items[id] = (drops.items[id] || 0) + qty;
                });
            }
        }

        // Loot drop (equipment)
        const loot = this.lootService.generateLootDrop(exp.regionId);
        if (loot) {
            this.inventoryService.addEquipment(loot);
            drops.loot = loot;
        }

        // Consumable drops
        const consumables = this.lootService.generateConsumableDrops(exp.regionId);
        consumables.forEach(({ id, qty }) => {
            this.villageService.addItemToInventory(id, qty);
            drops.consumables.push({ id, qty });
        });

        // Glyph tablet drop
        const region = this.regionService.getRegion(exp.regionId);
        const clears = region ? region.clears : 0;
        const glyphDrop = this.lootService.generateGlyphDrop(exp.regionId, clears);
        if (glyphDrop) {
            this.villageService.addItemToInventory(glyphDrop.tabletId, 1);
            drops.glyphs.push(glyphDrop);
        }

        return drops;
    }

    _resolveEffects(exp, heroes) {
        if (!exp.reward?.effects) return;

        for (const effect of exp.reward.effects) {
            switch (effect.type) {
                case 'hero':
                    this._effectGrantHero(effect, heroes);
                    break;
                case 'villagers':
                    this.villageService.addVillagers(effect.count);
                    break;
                case 'building_blueprint':
                    this.villageService.unlockBlueprint(effect.buildingId);
                    break;
                case 'region_unlock':
                    this.regionService._seedRegion(effect.regionId);
                    break;
                case 'narrative':
                    this._enqueueNarrative({
                        id: effect.id || `nar_${exp.id}_story`,
                        titleKey: effect.titleKey,
                        loreKey: effect.loreKey,
                        era: effect.era || 1
                    });
                    break;
                default:
                    console.warn(`[EffectResolver] Unknown effect type: ${effect.type}`);
            }
        }
    }

    _effectGrantHero(effect, expeditionHeroes) {
        const avatar = effect.avatar || null;
        const origin = effect.origin || 'origin_warrior';
        
        let level = effect.level;
        if (!level) {
            const existingHeroes = this.heroService.list();
            const avgLevel = existingHeroes.length > 0
                ? Math.floor(existingHeroes.reduce((sum, h) => sum + h.level, 0) / existingHeroes.length)
                : 1;
            level = Math.max(1, avgLevel - 1);
        }

        const result = this.heroService.add({
            name: effect.name,
            origin,
            avatar,
            level: 1
        });

        if (result.success) {
            const newHero = result.data;
            for (let i = 1; i < level; i++) {
                newHero.levelUp();
            }
            // Default starting gear for recruited heroes
            if (!newHero.equipment.leftHand) {
                newHero.equipment.leftHand = { type: 'weapon', material: 'wooden', family: 'broadsword', level: 0 };
            }
            if (!newHero.equipment.body) {
                newHero.equipment.body = { type: 'armor', material: 'wooden', archetype: 'leather', slot: 'body', level: 0 };
            }
            newHero.recalculateStats({});
        }
    }



    // Backward-compat wrappers delegating to LootService
    _generateLootDrop(regionId) {
        return this.lootService.generateLootDrop(regionId);
    }

    _generateConsumableDrops(regionId) {
        return this.lootService.generateConsumableDrops(regionId);
    }

    _trackBestiary(templateId) {
        if (!this.state.bestiary.includes(templateId)) {
            this.state.bestiary.push(templateId);
            this.save();
        }
    }

    getBestiary() {
        return this.state.bestiary || [];
    }

    getEnemyTemplates() {
        return {
            // Tier 1 (Forest & Meadows)
            slime_green: { name: 'Green Slime', type: 'beast', maxHp: 20, strength: 3, defense: 2, speed: 2, element: 'neutral' },
            slime_fire: { name: 'Fire Slime', type: 'beast', maxHp: 30, strength: 5, defense: 3, speed: 3, element: 'fire' },
            slime_earth: { name: 'Earth Slime', type: 'beast', maxHp: 25, strength: 4, defense: 4, speed: 1, element: 'earth' },
            wild_boar: { name: 'Wild Boar', type: 'beast', maxHp: 40, strength: 6, defense: 4, speed: 4, element: 'neutral' },
            rabbit_horned: { name: 'Horned Rabbit', type: 'beast', maxHp: 15, strength: 3, defense: 1, speed: 5, element: 'neutral' },
            goblin_scout: { name: 'Goblin Scout', type: 'humanoid', maxHp: 25, strength: 4, defense: 2, speed: 6, element: 'neutral' },
            goblin_grunt: { name: 'Goblin Grunt', type: 'humanoid', maxHp: 35, strength: 5, defense: 4, speed: 2, element: 'neutral' },
            // Tier 2 (Caves & Coast)
            bat_small: { name: 'Small Bat', type: 'beast', maxHp: 22, strength: 4, defense: 2, speed: 7, element: 'neutral' },
            spider_minor: { name: 'Minor Spider', type: 'beast', maxHp: 28, strength: 5, defense: 3, speed: 4, element: 'neutral' },
            crab_shell: { name: 'Shell Crab', type: 'beast', maxHp: 35, strength: 5, defense: 5, speed: 2, element: 'neutral' },
            water_spirit_minor: { name: 'Minor Water Spirit', type: 'elemental', maxHp: 25, strength: 4, defense: 2, speed: 5, element: 'water' },
            murloc_shore: { name: 'Shore Murloc', type: 'humanoid', maxHp: 30, strength: 5, defense: 3, speed: 4, element: 'water' },
            // Tier 3 (Forest & Camps)
            goblin_brute: { name: 'Goblin Brute', type: 'humanoid', maxHp: 55, strength: 7, defense: 5, speed: 1, element: 'neutral' },
            goblin_shaman: { name: 'Goblin Shaman', type: 'humanoid', maxHp: 40, strength: 5, defense: 3, speed: 5, element: 'storm' },
            goblin_slinger: { name: 'Goblin Slinger', type: 'humanoid', maxHp: 28, strength: 5, defense: 2, speed: 5, element: 'neutral' },
            skeleton_warrior: { name: 'Skeleton Warrior', type: 'undead', maxHp: 35, strength: 5, defense: 3, speed: 3, element: 'neutral' },
            ghost_wisp: { name: 'Ghost Wisp', type: 'undead', maxHp: 20, strength: 3, defense: 1, speed: 8, element: 'wind' },
            wolf_alpha: { name: 'Alpha Wolf', type: 'beast', maxHp: 50, strength: 7, defense: 4, speed: 5, element: 'neutral' },
            zombie_rotter: { name: 'Rotting Zombie', type: 'undead', maxHp: 45, strength: 5, defense: 3, speed: 1, element: 'neutral' },
            // Tier 4 (Ruins & Peaks)
            ice_elemental: { name: 'Ice Elemental', type: 'elemental', maxHp: 45, strength: 6, defense: 5, speed: 2, element: 'water' },
            young_drake: { name: 'Young Drake', type: 'dragon', maxHp: 70, strength: 8, defense: 6, speed: 4, element: 'fire' },
            frost_wolf: { name: 'Frost Wolf', type: 'beast', maxHp: 55, strength: 8, defense: 5, speed: 6, element: 'water' },
            cultist_acolyte: { name: 'Cultist Acolyte', type: 'humanoid', maxHp: 35, strength: 4, defense: 3, speed: 4, element: 'fire' },
            stone_golem: { name: 'Stone Golem', type: 'elemental', maxHp: 90, strength: 9, defense: 10, speed: 1, element: 'earth' },
            // Bosses
            goblin_king: { name: 'Goblin King', type: 'humanoid', maxHp: 120, strength: 10, defense: 6, speed: 4, element: 'neutral', isBoss: true },
            lich_apprentice: { name: 'Lich Apprentice', type: 'undead', maxHp: 180, strength: 25, defense: 8, speed: 5, element: 'storm', isBoss: true },
            mountain_troll: { name: 'Mountain Troll', type: 'beast', maxHp: 400, strength: 30, defense: 15, speed: 2, element: 'neutral', isBoss: true }
        };
    }



    _createEnemy(templateId, isBoss, level = 1, isElite = false, eliteTier = 0, statMultiplier = 1.1, regionBaseLevel = 1) {
        const templates = this.getEnemyTemplates();
        const t = templates[templateId] || templates['slime_green'];
        
        // Apply level scaling: Base * statMultiplier^(level - 1)
        const levelMult = Math.pow(statMultiplier, level - 1);
        
        // Region-tier inherent bonuses (higher tier = stronger base stats)
        const tierBonus = (regionBaseLevel - 1) * 2;
        const tierHpBonus = tierBonus * 5;
        const tierStrBonus = tierBonus;
        const tierDefBonus = Math.floor(tierBonus / 2);
        
        const scaled = {
            ...t,
            templateId: templateId || 'slime_green',
            maxHp: Math.floor((t.maxHp * levelMult + tierHpBonus) * 1.5),
            strength: Math.floor(t.strength * levelMult + tierStrBonus),
            defense: Math.floor((t.defense || 1) * levelMult + tierDefBonus),
            speed: t.speed, // Speed stays flat to preserve turn-order feel
            level: level
        };
        
        if (isElite) {
            const prefixes = [
                { name: 'Fierce', mult: 1.15 },
                { name: 'Corrupted', mult: 1.25 },
                { name: 'Ancient', mult: 1.35 },
                { name: 'Legendary', mult: 1.50 }
            ];
            const prefix = prefixes[eliteTier] || prefixes[0];
            scaled.maxHp = Math.floor(scaled.maxHp * prefix.mult);
            scaled.strength = Math.floor(scaled.strength * prefix.mult);
            scaled.defense = Math.floor(scaled.defense * prefix.mult);
            scaled.name = `${prefix.name} ${scaled.name}`;
            scaled.isElite = true;
            scaled.eliteTier = eliteTier;
        }
        
        return new Enemy({ ...scaled, id: crypto.randomUUID(), isBoss });
    }
}
