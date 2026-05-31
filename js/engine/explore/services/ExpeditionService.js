import { persistence } from '../../shared/core/Persistence.js';
import { Result } from '../../shared/core/Result.js';
import { Enemy } from '../../shared/combat/models/Enemy.js';
import { LootService } from './LootService.js';
import { REGION_REGISTRY } from '../data/regions/index.js';

/**
 * ExpeditionService handles manual combat challenges, stage progression,
 * and quest-chain unlocking logic.
 * Supports concurrent expeditions (round-robin resolution).
 */
export class ExpeditionService {
    constructor(battleService, heroService, villageService, inventoryService, options = {}) {
        this.battleService = battleService;
        this.heroService = heroService;
        this.villageService = villageService;
        this.inventoryService = inventoryService;
        this.lootService = new LootService(this._getRegionData.bind(this));
        
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
        const tutorialCave = REGION_REGISTRY.reg_greenfields.storyMissions
            .find(m => m.id === 'exp_tutorial_cave');
        return {
            completedIds: [],
            activeExpeditions: [],
            expeditionTurnIndex: 0,
            activeCombatExpeditionId: null,
            bestiary: [],
            regions: {
                reg_greenfields: {
                    clears: 0,
                    unlocked: true,
                    firstClearBonusGiven: false,
                    availableNodes: tutorialCave ? [{ ...tutorialCave }] : [],
                    stats: this._getDefaultRegionStats()
                }
            }
        };
    }

    _getDefaultRegionStats() {
        return {
            clears: 0,
            fails: 0,
            retreats: 0,
            totalGoldEarned: 0,
            deepestDepth: 0
        };
    }

    _load() {
        const defaultState = this._getDefaultState();
        const loaded = persistence.load(this.STORAGE_KEY, defaultState);

        // Fallback for fields missing in old saves
        if (!loaded.regions) loaded.regions = defaultState.regions;
        if (!loaded.completedIds) loaded.completedIds = [];

        // Migrate regions missing firstClearBonusGiven
        for (const region of Object.values(loaded.regions)) {
            if (region.firstClearBonusGiven === undefined) {
                region.firstClearBonusGiven = false;
            }
            // Migrate nodes missing status and parentId (tree visualization Phase 4)
            if (region.availableNodes) {
                for (const node of region.availableNodes) {
                    if (!node.status) node.status = 'available';
                    if (node.parentId === undefined) node.parentId = null;
                }
            }
            // Migrate missing region.stats (history tracking)
            if (!region.stats) {
                region.stats = this._getDefaultRegionStats();
            }
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
     * Returns the list of all expeditions across all unlocked regions.
     */
    getExpeditions() {
        const all = [];
        for (const [regionId, regionState] of Object.entries(this.state.regions)) {
            if (regionState.unlocked) {
                regionState.availableNodes.forEach(node => {
                    if (!node.status || node.status === 'available') {
                        all.push({ ...node });
                    }
                });
            }
        }
        return all;
    }

    getRegionTree(regionId) {
        const region = this.state.regions[regionId];
        if (!region || !region.unlocked) return null;
        return {
            regionId,
            name: this._getRegionData(regionId).name,
            clears: region.clears,
            nodes: region.availableNodes || []
        };
    }

    /**
     * Get Region definition data from the external registry.
     */
    _getRegionData(regionId) {
        return REGION_REGISTRY[regionId] || REGION_REGISTRY['reg_greenfields'];
    }

    /**
     * Injects story missions into a region based on completion state.
     * Called from _finishExpedition to ensure story nodes appear.
     */
    _injectStoryMissions(regionId) {
        const region = this.state.regions[regionId];
        if (!region) return;

        const regionData = this._getRegionData(regionId);
        if (!regionData.storyMissions || regionData.storyMissions.length === 0) return;

        for (const mission of regionData.storyMissions) {
            // Skip if already injected
            if (region.availableNodes.some(n => n.id === mission.id)) continue;
            // Skip if already completed
            if (this.state.completedIds.includes(mission.id)) continue;
            // Check requirements
            if (mission.requirements && !this._checkMissionRequirements(mission.requirements)) continue;

            // Inject the mission
            region.availableNodes.push({ ...mission });
        }
    }

    /**
     * Evaluates story mission requirements.
     * Supports: completedMissions, minRegionClears, minBuildingLevel.
     */
    _checkMissionRequirements(reqs) {
        if (reqs.completedMissions) {
            for (const id of reqs.completedMissions) {
                if (!this.state.completedIds.includes(id)) return false;
            }
        }
        if (reqs.minRegionClears) {
            for (const [rid, min] of Object.entries(reqs.minRegionClears)) {
                const r = this.state.regions[rid];
                if (!r || (r.clears || 0) < min) return false;
            }
        }
        if (reqs.minBuildingLevel) {
            const { building, level } = reqs.minBuildingLevel;
            const infra = this.villageService.getState().infrastructure || {};
            if ((infra[building] || 0) < level) return false;
        }
        return true;
    }

    _getBossPoolForRegion(regionId) {
        const rData = this._getRegionData(regionId);
        return rData.bossPool || ['slime_fire'];
    }

    _rollPackType() {
        const roll = Math.random() * 100;
        if (roll < 25) return { id: 'swarm', minCount: 3, maxCount: 4, eliteChance: 0 };
        if (roll < 60) return { id: 'mixed', minCount: 2, maxCount: 3, eliteChance: 0 };
        if (roll < 85) return { id: 'elite', minCount: 1, maxCount: 2, eliteChance: 0.3 };
        return { id: 'duo', minCount: 2, maxCount: 2, eliteChance: 0.2 };
    }

    _createProceduralNode(regionId, rData, clears, parentId = null) {
        const id = 'proc_' + crypto.randomUUID().split('-')[0];
        
        // Stage count complexity
        let stagesCount = Math.max(rData.minStages, Math.min(rData.maxStages, rData.minStages + Math.floor(clears / 3)));
        
        // Explorer Guild reduces stage count by 10% per level (min 1 stage)
        const explorerGuildLevel = this.villageService.getState().infrastructure.explorer_guild || 0;
        if (explorerGuildLevel > 0) {
            stagesCount = Math.max(1, Math.ceil(stagesCount * (1 - (explorerGuildLevel * 0.10))));
        }

        // Scouts reduce stage count by 1 per 2 scouts (min 1 stage)
        const villageState = this.villageService.getState();
        const scoutCount = villageState.population?.roles?.scout || 0;
        if (scoutCount > 0) {
            const scoutReduction = Math.floor(scoutCount / 2);
            stagesCount = Math.max(1, stagesCount - scoutReduction);
        }
        
        // Enemy level based on region base level + clears
        // Depth tracking: how far into the region this expedition ventures
        const depth = 1 + Math.floor(clears / 2) + Math.floor(Math.random() * 2);
        const enemyLevel = (rData.baseLevel || 1) + Math.floor(clears / 3) + Math.floor(depth / 3);
        const guaranteeElite = depth >= 8;
        let eliteSpawned = false;
        
        const stages = [];
        const coreEnemies = rData.enemies.slice(0, 2);
        const bossPool = this._getBossPoolForRegion(regionId);
        let dominantPack = 'mixed';
        
        for (let i = 0; i < stagesCount; i++) {
            const isBoss = (i === stagesCount - 1);
            const encounter = [];
            
            if (isBoss) {
                // 75% single boss, 25% boss group
                const isBossGroup = Math.random() < 0.25;
                const bossId = bossPool[Math.floor(Math.random() * bossPool.length)];
                if (isBossGroup) {
                    encounter.push(bossId);
                    const minionCount = Math.floor(Math.random() * 2) + 1; // 1-2 minions
                    for (let m = 0; m < minionCount; m++) {
                        const pool = Math.random() < 0.7 ? coreEnemies : rData.enemies;
                        encounter.push(pool[Math.floor(Math.random() * pool.length)]);
                    }
                } else {
                    encounter.push(bossId);
                }
            } else {
                const pack = this._rollPackType();
                if (i === 0) dominantPack = pack.id;
                const enemyCount = Math.floor(Math.random() * (pack.maxCount - pack.minCount + 1)) + pack.minCount;
                for (let e = 0; e < enemyCount; e++) {
                    const pool = Math.random() < 0.7 ? coreEnemies : rData.enemies;
                    const enemyId = pool[Math.floor(Math.random() * pool.length)];
                    
                    // Elite roll: depth bonus + pack elite chance
                    const depthBonus = depth >= 5 ? 0.1 : 0;
                    const rollElite = (!eliteSpawned && guaranteeElite && e === enemyCount - 1)
                        ? true
                        : Math.random() < (pack.eliteChance + depthBonus);
                    
                    if (rollElite) {
                        eliteSpawned = true;
                        const eliteTier = this._rollEliteTier();
                        encounter.push({ id: enemyId, isElite: true, eliteTier });
                    } else {
                        encounter.push(enemyId);
                    }
                }
                // Ensure variety for mixed and duo packs
                if ((pack.id === 'mixed' || pack.id === 'duo') && encounter.length >= 2) {
                    const ids = encounter.map(e => typeof e === 'string' ? e : e.id);
                    const allSame = ids.every(id => id === ids[0]);
                    if (allSame && rData.enemies.length > 1) {
                        const newId = rData.enemies.find(id => id !== ids[0]) || rData.enemies[0];
                        const last = encounter[encounter.length - 1];
                        if (typeof last === 'string') {
                            encounter[encounter.length - 1] = newId;
                        } else {
                            encounter[encounter.length - 1] = { ...last, id: newId };
                        }
                    }
                }
            }
            stages.push({ type: 'battle', enemies: encounter, isBoss, enemyLevel, depth });
        }

        // Generate a descriptive name based on the dominant pack type
        const packLabels = {
            swarm: 'Swarm',
            mixed: 'Skirmish',
            elite: 'Vanguard',
            duo: 'Duo'
        };
        const packLabel = packLabels[dominantPack] || 'Path';
        const suffixes = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Echo', 'Shadow', 'Dawn', 'Dusk', 'North', 'South', 'East', 'West'];
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        const name = `${rData.name} ${packLabel} ${suffix}`;

        // Reward scaling by region tier with per-node variation (±20%)
        const tierMult = rData.baseLevel || 1;
        const baseGold = (40 * tierMult) + (clears * 8 * tierMult);
        const gold = Math.floor(baseGold * (0.8 + Math.random() * 0.4));

        // Region-specific material items
        const rewardItems = {};
        if (regionId === 'reg_greenfields') {
            rewardItems.material_wood = Math.floor(Math.random() * 4) + 3; // 3 to 6 Wood
            if (Math.random() < 0.5) rewardItems.material_stone = Math.floor(Math.random() * 2) + 1;
            if (Math.random() < 0.2) rewardItems.material_iron_ore = 1;
        } else if (regionId === 'reg_tiny_cave') {
            rewardItems.material_stone = Math.floor(Math.random() * 4) + 3; // 3 to 6 Stone
            if (Math.random() < 0.4) rewardItems.material_iron_ore = Math.floor(Math.random() * 2) + 1;
            if (Math.random() < 0.15) rewardItems.material_steel_ingot = 1;
        } else if (regionId === 'reg_calmed_beach') {
            rewardItems.material_stone = Math.floor(Math.random() * 3) + 3;
            rewardItems.material_wood = Math.floor(Math.random() * 3) + 3;
            if (Math.random() < 0.2) rewardItems.material_iron_ore = 1;
        } else if (regionId === 'reg_dark_forest') {
            rewardItems.material_wood = Math.floor(Math.random() * 4) + 4;
            if (Math.random() < 0.5) rewardItems.material_iron_ore = Math.floor(Math.random() * 2) + 2;
            if (Math.random() < 0.15) rewardItems.material_steel_ingot = 1;
        } else if (regionId === 'reg_goblin_camp') {
            rewardItems.material_iron_ore = Math.floor(Math.random() * 4) + 3;
            if (Math.random() < 0.4) rewardItems.material_stone = Math.floor(Math.random() * 3) + 2;
            if (Math.random() < 0.15) rewardItems.material_steel_ingot = 1;
        } else if (regionId === 'reg_mystic_ruins') {
            rewardItems.material_iron_ore = Math.floor(Math.random() * 3) + 2;
            if (Math.random() < 0.4) rewardItems.material_stone = Math.floor(Math.random() * 3) + 2;
            if (Math.random() < 0.15) rewardItems.material_mythril = 1;
        } else if (regionId === 'reg_frozen_peaks') {
            rewardItems.material_steel_ingot = Math.floor(Math.random() * 3) + 1;
            if (Math.random() < 0.4) rewardItems.material_iron_ore = Math.floor(Math.random() * 3) + 1;
            if (Math.random() < 0.1) rewardItems.material_mythril = 1;
        }

        return {
            id,
            name,
            regionId,
            isStory: false,
            status: 'available',
            parentId,
            reward: { 
                gold,
                items: rewardItems
            },
            stages
        };
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
        this.save();
        return Result.ok();
    }

    _trackRetreat(expId) {
        const expDef = this._findExpeditionDefinition(expId);
        if (expDef) {
            const region = this.state.regions[expDef.regionId];
            if (region && region.stats) {
                region.stats.retreats++;
            }
        }
    }

    _findExpeditionDefinition(expId) {
        for (const region of Object.values(this.state.regions)) {
            const node = region.availableNodes?.find(n => n.id === expId);
            if (node) return node;
        }
        return null;
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
                const enemy = this._createEnemy(e.id, stage.isBoss, enemyLevel, e.isElite || false, e.eliteTier || 0);
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
            const region = this.state.regions[exp.regionId];
            if (region && region.stats) {
                region.stats.fails++;
            }

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

        // Update Region Discovery
        const region = this.state.regions[exp.regionId];
        if (region) {
            const wasFirstClear = region.clears === 0;
            region.clears++;

            // Update region stats
            if (region.stats) {
                region.stats.clears++;
                region.stats.totalGoldEarned += (exp.reward?.gold || 0);
                const nodeDepth = exp.depth || 1;
                if (nodeDepth > region.stats.deepestDepth) {
                    region.stats.deepestDepth = nodeDepth;
                }
            }

            // Mark completed node instead of removing it
            const completedNode = region.availableNodes.find(n => n.id === exp.id);
            if (completedNode) {
                completedNode.status = 'completed';
                completedNode.completionMeta = {
                    dayCompleted: this.villageService.getState().day || 1,
                    heroIds: heroes.map(h => h.id),
                    heroNames: heroes.map(h => h.name),
                    rewardReceived: exp.reward
                };
            }

            // Inject story missions before spawning procedural children
            this._injectStoryMissions(exp.regionId);

            // Path lifecycle: decide how many children to spawn based on active path count
            const activePaths = region.availableNodes.filter(n => n.status === 'available' && !n.isStory).length;
            let childrenToSpawn = this._rollPathBranching(activePaths);

            // Apply convergence / narrowing events
            const convergenceRoll = Math.random();
            if (region.clears % 10 === 0 && convergenceRoll < 0.3) {
                childrenToSpawn = Math.max(0, childrenToSpawn - 1);
            }

            // Spawn children
            for (let i = 0; i < childrenToSpawn; i++) {
                const child = this._createProceduralNode(exp.regionId, this._getRegionData(exp.regionId), region.clears, exp.id);
                region.availableNodes.push(child);
            }

            // If no children spawned, mark as closed with bonus
            if (childrenToSpawn === 0 && completedNode) {
                completedNode.status = 'closed';
                if (completedNode.reward) {
                    completedNode.reward.closureBonus = {
                        gold: Math.floor((completedNode.reward.gold || 0) * 1.5),
                        message: 'Path Sealed'
                    };
                }
            }

            // First-clear permanent speed boost
            if (wasFirstClear && !region.firstClearBonusGiven) {
                region.firstClearBonusGiven = true;
                heroes.forEach(h => {
                    h.addPermanentSpeedBonus(2);
                });
                this.heroService.saveAll();
            }

            this.save();
        }

        // Grant rewards
        if (exp.reward.gold) this.villageService.addGold(exp.reward.gold);
        if (exp.reward.items) {
            Object.entries(exp.reward.items).forEach(([id, qty]) => {
                this.villageService.addItemToInventory(id, qty);
            });
        }

        // Loot drop (equipment)
        const loot = this.lootService.generateLootDrop(exp.regionId);
        if (loot) {
            this.inventoryService.addEquipment(loot);
        }

        // Consumable drops (MP potions for mage balance)
        const consumables = this.lootService.generateConsumableDrops(exp.regionId);
        consumables.forEach(({ id, qty }) => {
            this.villageService.addItemToInventory(id, qty);
        });

        if (exp.reward.special) {
            const s = exp.reward.special;
            if (s.type === 'hero') {
                const avatar = s.value === 'Sir Valen' ? 'valen.webp' : null;
                const existingHeroes = this.heroService.list();
                const avgLevel = existingHeroes.length > 0
                    ? Math.floor(existingHeroes.reduce((sum, h) => sum + h.level, 0) / existingHeroes.length)
                    : 1;
                const startLevel = Math.max(1, avgLevel - 1);

                const result = this.heroService.add({ name: s.value, origin: 'origin_guard', avatar, level: startLevel });
                if (result.success) {
                    const newHero = result.data;
                    for (let i = 1; i < startLevel; i++) {
                        newHero.levelUp();
                    }
                    newHero.equipment.leftHand = { type: 'weapon', material: 'wooden', family: 'broadsword', level: 0 };
                    newHero.equipment.body = { type: 'armor', material: 'wooden', archetype: 'leather', slot: 'body', level: 0 };
                    newHero.recalculateStats({});
                    this.heroService.saveAll();
                }
            } else if (s.type === 'villagers') {
                this.villageService.addVillagers(s.value);
            }
        }

        this.save();
        
        // Check if any new regions should unlock
        this._checkRegionUnlocks();
        
        return Result.ok({ status: 'completed', expId: exp.id, expName: exp.name, reward: exp.reward });
    }

    /**
     * Public method for GameEngine to call during nextDay()
     * to check building-based unlocks (e.g., Explorer Guild).
     */
    checkRegionUnlocks() {
        this._checkRegionUnlocks();
    }

    _checkRegionUnlocks() {
        for (const [regionId, regionData] of Object.entries(REGION_REGISTRY)) {
            // Skip already-unlocked regions
            if (this.state.regions[regionId]?.unlocked) continue;

            // Skip regions with no unlock requirements (e.g. stubs, starting regions)
            if (!regionData.unlockRequirements) continue;

            if (this._checkUnlockRequirements(regionData.unlockRequirements)) {
                this._seedRegion(regionId);
            }
        }
    }

    /**
     * Generic unlock requirement evaluator.
     * Supports: any (OR), all (AND), completedMissions, minRegionClears,
     * minTotalClears, minBuildingLevel.
     */
    _checkUnlockRequirements(reqs) {
        // OR wrapper
        if (reqs.any) {
            return reqs.any.some(r => this._checkUnlockRequirements(r));
        }

        // AND wrapper
        if (reqs.all) {
            return reqs.all.every(r => this._checkUnlockRequirements(r));
        }

        if (reqs.completedMissions) {
            for (const id of reqs.completedMissions) {
                if (!this.state.completedIds.includes(id)) return false;
            }
        }

        if (reqs.minRegionClears) {
            for (const [rid, min] of Object.entries(reqs.minRegionClears)) {
                const r = this.state.regions[rid];
                if (!r || (r.clears || 0) < min) return false;
            }
        }

        if (reqs.minTotalClears) {
            const totalClears = Object.values(this.state.regions).reduce((sum, r) => sum + (r.clears || 0), 0);
            if (totalClears < reqs.minTotalClears) return false;
        }

        if (reqs.minBuildingLevel) {
            const { building, level } = reqs.minBuildingLevel;
            const infra = this.villageService.getState().infrastructure || {};
            if ((infra[building] || 0) < level) return false;
        }

        return true;
    }

    _seedRegion(regionId) {
        const rData = this._getRegionData(regionId);
        this.state.regions[regionId] = {
            clears: 0,
            unlocked: true,
            firstClearBonusGiven: false,
            availableNodes: [this._createProceduralNode(regionId, rData, 0)],
            stats: this._getDefaultRegionStats()
        };
        this.save();
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

    _rollPathBranching(activePaths) {
        // Returns number of children (0 = path closes)
        if (activePaths >= 5) return 0; // Forced narrow at cap
        const roll = Math.random();
        if (activePaths === 4) return roll < 0.5 ? 0 : 1;
        if (activePaths === 3) {
            if (roll < 0.25) return 0;
            if (roll < 0.75) return 1;
            return 2;
        }
        if (activePaths === 2) {
            if (roll < 0.10) return 0;
            if (roll < 0.50) return 1;
            if (roll < 0.90) return 2;
            return 3;
        }
        // activePaths <= 1
        if (roll < 0.30) return 1;
        if (roll < 0.80) return 2;
        return 3;
    }

    _rollEliteTier() {
        const roll = Math.random();
        if (roll < 0.60) return 0; // Fierce
        if (roll < 0.90) return 1; // Corrupted
        if (roll < 0.99) return 2; // Ancient
        return 3; // Legendary
    }

    _createEnemy(templateId, isBoss, level = 1, isElite = false, eliteTier = 0) {
        const templates = this.getEnemyTemplates();
        const t = templates[templateId] || templates['slime_green'];
        
        // Apply level scaling: Base * 1.1^(level - 1)
        const levelMult = Math.pow(1.1, level - 1);
        const scaled = {
            ...t,
            templateId: templateId || 'slime_green',
            maxHp: Math.floor(t.maxHp * levelMult),
            strength: Math.floor(t.strength * levelMult),
            defense: Math.floor((t.defense || 1) * levelMult),
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
