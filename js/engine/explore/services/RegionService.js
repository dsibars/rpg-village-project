import { persistence } from '../../shared/core/Persistence.js';
import { REGION_REGISTRY } from '../data/regions/index.js';

/**
 * RegionService — The Region Domain & Expedition Factory
 * Owns persistence key: region_state
 * Manages region lifecycle: unlocks, seeding, stats, story missions, expedition generation.
 */
export class RegionService {
    constructor(villageService, options = {}) {
        this.villageService = villageService;

        this.STORAGE_KEY = 'region_state';
        this.state = this._getDefaultState();
        if (!options.deferLoad) {
            this.load();
        }
    }

    load() {
        this.state = this._load();
    }

    save() {
        persistence.save(this.STORAGE_KEY, this.state);
    }

    // ─── Default State ────────────────────────────────────────────────

    _getDefaultState() {
        const tutorialCave = REGION_REGISTRY.reg_greenfields.storyMissions
            .find(m => m.id === 'exp_tutorial_cave');
        return {
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

    // ─── Load / Migration ─────────────────────────────────────────────

    _load() {
        const defaultState = this._getDefaultState();
        let loaded = persistence.load(this.STORAGE_KEY, null);

        if (!loaded) {
            loaded = defaultState;
        }

        if (!loaded.regions) loaded.regions = defaultState.regions;

        for (const region of Object.values(loaded.regions)) {
            if (region.firstClearBonusGiven === undefined) {
                region.firstClearBonusGiven = false;
            }
            if (region.availableNodes) {
                for (const node of region.availableNodes) {
                    if (!node.status) node.status = 'available';
                    if (node.parentId === undefined) node.parentId = null;
                }
            }
            if (!region.stats) {
                region.stats = this._getDefaultRegionStats();
            }
        }

        return loaded;
    }

    // ─── Public Getters ───────────────────────────────────────────────

    /** Returns all regions keyed by regionId. */
    getRegions() {
        return this.state.regions;
    }

    /** Returns a single region's state. */
    getRegion(regionId) {
        return this.state.regions[regionId] || null;
    }

    /**
     * Returns all available expedition nodes across all unlocked regions.
     * Returns shallow copies to prevent accidental mutation of persisted state.
     */
    getAvailableExpeditions() {
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

    /** Returns a single expedition definition from availableNodes, or null. */
    getExpeditionDefinition(expId) {
        for (const region of Object.values(this.state.regions)) {
            const node = region.availableNodes?.find(n => n.id === expId);
            if (node) return node;
        }
        return null;
    }

    /** Returns tree data for a region (for UI visualization). */
    getRegionTree(regionId) {
        const region = this.state.regions[regionId];
        if (!region || !region.unlocked) return null;
        return {
            regionId,
            name: this.getRegionData(regionId).name,
            clears: region.clears,
            nodes: region.availableNodes || []
        };
    }

    /** Get region definition data from the external registry. */
    getRegionData(regionId) {
        return REGION_REGISTRY[regionId] || REGION_REGISTRY['reg_greenfields'];
    }

    /** Sum of clears across all regions. */
    getTotalClears() {
        return Object.values(this.state.regions).reduce((sum, r) => sum + (r.clears || 0), 0);
    }

    // ─── Region Unlock ────────────────────────────────────────────────

    /**
     * Evaluates unlock requirements for all regions.
     * @param {string[]} completedIds - List of completed expedition IDs
     */
    checkRegionUnlocks(completedIds, heroCount = 0) {
        for (const [regionId, regionData] of Object.entries(REGION_REGISTRY)) {
            // Skip already-unlocked regions
            if (this.state.regions[regionId]?.unlocked) continue;
            // Skip regions with no unlock requirements
            if (!regionData.unlockRequirements) continue;

            if (this._checkUnlockRequirements(regionData.unlockRequirements, completedIds, heroCount)) {
                this._seedRegion(regionId);
            }
        }
    }

    /**
     * Generic unlock requirement evaluator.
     * Supports: any (OR), all (AND), completedMissions, minRegionClears,
     * minTotalClears, minBuildingLevel, minHeroes.
     * @param {number} heroCount - Current number of heroes in party
     */
    _checkUnlockRequirements(reqs, completedIds, heroCount = 0) {
        // OR wrapper
        if (reqs.any) {
            return reqs.any.some(r => this._checkUnlockRequirements(r, completedIds, heroCount));
        }

        // AND wrapper
        if (reqs.all) {
            return reqs.all.every(r => this._checkUnlockRequirements(r, completedIds, heroCount));
        }

        if (reqs.completedMissions) {
            for (const id of reqs.completedMissions) {
                if (!completedIds.includes(id)) return false;
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

        if (reqs.minHeroes) {
            if (heroCount < reqs.minHeroes) return false;
        }

        return true;
    }

    _seedRegion(regionId) {
        const rData = this.getRegionData(regionId);
        this.state.regions[regionId] = {
            clears: 0,
            unlocked: true,
            firstClearBonusGiven: false,
            availableNodes: [this._createProceduralNode(regionId, rData, 0)],
            stats: this._getDefaultRegionStats()
        };
        this.save();
    }

    // ─── Expedition Completion ────────────────────────────────────────

    /**
     * Marks an expedition node as completed, updates region stats,
     * injects story missions, and spawns children.
     * @returns {{ wasFirstClear: boolean, spawnedNodes: Array, injectedMissions: Array }}
     */
    completeExpedition(expId, heroIds, heroNames, completedIds) {
        let wasFirstClear = false;
        const spawnedNodes = [];
        const injectedMissions = [];

        // Find region containing this expedition
        let region = null;
        let regionId = null;
        for (const [rid, r] of Object.entries(this.state.regions)) {
            const node = r.availableNodes?.find(n => n.id === expId);
            if (node) {
                region = r;
                regionId = rid;
                break;
            }
        }

        if (!region) return { wasFirstClear, spawnedNodes, injectedMissions };

        const exp = region.availableNodes.find(n => n.id === expId);

        wasFirstClear = region.clears === 0;
        region.clears++;

        let firstClearNarrative = null;
        if (wasFirstClear) {
            const rData = this.getRegionData(regionId);
            if (rData.narrative?.firstClear) {
                firstClearNarrative = rData.narrative.firstClear;
            }
        }

        // Update region stats
        if (region.stats) {
            region.stats.clears++;
            region.stats.totalGoldEarned += (exp.reward?.gold || 0);
            const nodeDepth = exp.depth || 1;
            if (nodeDepth > region.stats.deepestDepth) {
                region.stats.deepestDepth = nodeDepth;
            }
        }

        // Mark completed node
        if (exp) {
            exp.status = 'completed';
            exp.completionMeta = {
                dayCompleted: this.villageService.getState().day || 1,
                heroIds: heroIds,
                heroNames: heroNames,
                rewardReceived: exp.reward
            };
        }

        // Inject story missions BEFORE counting active paths and spawning children
        this._injectStoryMissions(regionId, completedIds, this.villageService.getState());

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
            const child = this._createProceduralNode(regionId, this.getRegionData(regionId), region.clears, expId);
            region.availableNodes.push(child);
            spawnedNodes.push(child);
        }

        // If no children spawned, mark as closed with bonus
        if (childrenToSpawn === 0 && exp) {
            exp.status = 'closed';
            if (exp.reward) {
                const regionData = this.getRegionData(regionId);
                const lp = regionData.lootProfile;
                const closureItems = {};
                if (lp && lp.materials) {
                    for (const mat of lp.materials) {
                        if (mat.chance >= 0.5) {
                            const qty = Math.floor(mat.max * 2);
                            if (qty > 0) {
                                closureItems[mat.id] = qty;
                            }
                        }
                    }
                }
                exp.reward.closureBonus = {
                    gold: Math.floor((exp.reward.gold || 0) * 1.5),
                    items: closureItems,
                    message: 'Path Sealed'
                };
            }
        }

        return { wasFirstClear, spawnedNodes, injectedMissions, firstClearNarrative };
    }

    // ─── Story Missions ───────────────────────────────────────────────

    /**
     * Injects missing story missions across all regions (public entry for retroactive fix).
     */
    injectMissingStoryMissions(completedIds, villageState) {
        for (const regionId of Object.keys(this.state.regions)) {
            this._injectStoryMissions(regionId, completedIds, villageState);
        }
        this.save();
    }

    /**
     * Injects story missions into a region based on completion state.
     */
    _injectStoryMissions(regionId, completedIds, villageState) {
        const region = this.state.regions[regionId];
        if (!region) return;

        const regionData = this.getRegionData(regionId);
        if (!regionData.storyMissions || regionData.storyMissions.length === 0) return;

        for (const mission of regionData.storyMissions) {
            // Skip if already injected
            if (region.availableNodes.some(n => n.id === mission.id)) continue;
            // Skip if already completed
            if (completedIds.includes(mission.id)) continue;
            // Check requirements
            if (mission.requirements && !this._checkMissionRequirements(mission.requirements, completedIds, villageState)) continue;

            // Inject the mission
            region.availableNodes.push({ ...mission });
        }
    }

    /**
     * Evaluates story mission requirements.
     * Supports: completedMissions, minRegionClears, minBuildingLevel.
     */
    _checkMissionRequirements(reqs, completedIds, villageState) {
        if (reqs.completedMissions) {
            for (const id of reqs.completedMissions) {
                if (!completedIds.includes(id)) return false;
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
            const infra = villageState.infrastructure || {};
            if ((infra[building] || 0) < level) return false;
        }
        return true;
    }

    // ─── Expedition Generation ────────────────────────────────────────

    /**
     * Generates a procedural expedition node and auto-adds it to the region's availableNodes.
     * @param {string} regionId
     * @param {number|null} clears - Falls back to region.clears if omitted
     * @param {string|null} parentId
     * @returns {Object} The created expedition definition
     */
    generateExpedition(regionId, clears = null, parentId = null) {
        const region = this.state.regions[regionId];
        const rData = this.getRegionData(regionId);
        const effectiveClears = clears !== null ? clears : (region ? region.clears : 0);

        const node = this._createProceduralNode(regionId, rData, effectiveClears, parentId);
        if (region) {
            region.availableNodes.push(node);
        }
        return node;
    }

    /**
     * For developer cheat: removes a node from availableNodes, increments clears and stats.clears.
     */
    forceRemoveNodeAndIncrementClears(regionId, nodeId) {
        const region = this.state.regions[regionId];
        if (!region) return;

        region.availableNodes = region.availableNodes.filter(n => n.id !== nodeId);
        region.clears = (region.clears || 0) + 1;
        if (region.stats) {
            region.stats.clears++;
        }
        this.save();
    }

    /** Increment a specific stat for a region. */
    incrementRegionStat(regionId, statName) {
        const region = this.state.regions[regionId];
        if (region && region.stats) {
            region.stats[statName]++;
        }
    }

    // ─── Expedition Factory (Private) ─────────────────────────────────

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
        const scaling = rData.scaling;
        const depth = 1 + Math.floor(clears / 2) + Math.floor(Math.random() * 2);
        let enemyLevel = (rData.baseLevel || 1)
            + Math.floor(clears / scaling.levelPerClears)
            + Math.floor(depth / scaling.levelPerClears);
        if (scaling.maxLevelCap !== null && enemyLevel > scaling.maxLevelCap) {
            enemyLevel = scaling.maxLevelCap;
        }
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
        const lp = rData.lootProfile;
        const baseGold = (lp.goldBase * tierMult) + (clears * lp.goldPerClear * tierMult);
        const gold = Math.floor(baseGold * (0.8 + Math.random() * 0.4));

        // Region-specific material items
        const rewardItems = {};
        for (const mat of lp.materials) {
            if (Math.random() < mat.chance) {
                const qty = Math.floor(Math.random() * (mat.max - mat.min + 1)) + mat.min;
                if (qty > 0) {
                    rewardItems[mat.id] = (rewardItems[mat.id] || 0) + qty;
                }
            }
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
            stages,
            scaling: {
                statMultiplier: rData.scaling.statMultiplier
            }
        };
    }

    _getBossPoolForRegion(regionId) {
        const rData = this.getRegionData(regionId);
        return rData.bossPool || ['slime_fire'];
    }


    _rollPackType() {
        const roll = Math.random() * 100;
        if (roll < 25) return { id: 'swarm', minCount: 3, maxCount: 4, eliteChance: 0 };
        if (roll < 60) return { id: 'mixed', minCount: 2, maxCount: 3, eliteChance: 0 };
        if (roll < 85) return { id: 'elite', minCount: 1, maxCount: 2, eliteChance: 0.3 };
        return { id: 'duo', minCount: 2, maxCount: 2, eliteChance: 0.2 };
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
}
