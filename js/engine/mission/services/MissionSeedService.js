import { persistence } from '../../shared/core/Persistence.js';
import { Result } from '../../shared/core/Result.js';
import { MISSION_SEEDS, MISSION_SEED_IDS } from '../data/MissionSeedData.js';

const LEVEL_INCREMENT = 0.2;
const REROLL_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

function generateUUID() {
    return crypto.randomUUID();
}

function weightedRandom(items, weights) {
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;
    for (let i = 0; i < items.length; i++) {
        random -= weights[i];
        if (random <= 0) {
            return items[i];
        }
    }
    return items[items.length - 1];
}

export class MissionSeedService {
    constructor(inventoryService, villageService, options = {}) {
        this.inventoryService = inventoryService;
        this.villageService = villageService;
        this.STORAGE_KEY = 'mission_seed_state';
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
            missionSeeds: {},
            activeMissions: [],
            lastRerollTimestamp: null,
            dailyRerollUsed: false
        };
    }

    _load() {
        const defaultState = this._getDefaultState();
        const loaded = persistence.load(this.STORAGE_KEY, defaultState);

        if (!loaded.missionSeeds) loaded.missionSeeds = {};
        if (!loaded.activeMissions) loaded.activeMissions = [];

        // Initialize seed states for any seeds not yet persisted
        for (const seedId of MISSION_SEED_IDS) {
            if (!loaded.missionSeeds[seedId]) {
                loaded.missionSeeds[seedId] = {
                    level: 1.0,
                    completions: 0,
                    unlocked: false
                };
            }
        }

        return loaded;
    }

    save() {
        persistence.save(this.STORAGE_KEY, this.state);
    }

    getBoardSlots() {
        const buildingLevels = this.villageService.getState().infrastructure || {};
        return buildingLevels.mission_board || 0;
    }

    // ─── Unlock Logic ───────────────────────────────────────────────

    checkUnlocks(currentChapter, buildingLevels) {
        let anyChanged = false;
        for (const [seedId, seedDef] of Object.entries(MISSION_SEEDS)) {
            const seedState = this.state.missionSeeds[seedId];
            if (seedState.unlocked) continue;

            const condition = seedDef.unlockCondition;
            let shouldUnlock = false;

            if (condition.type === 'building_level') {
                const level = buildingLevels[condition.building] || 0;
                if (level >= condition.level) {
                    shouldUnlock = true;
                }
            } else if (condition.type === 'chapter') {
                if (currentChapter >= condition.chapter) {
                    shouldUnlock = true;
                }
            }

            if (shouldUnlock) {
                seedState.unlocked = true;
                anyChanged = true;
            }
        }
        if (anyChanged) {
            this.save();
        }
        return anyChanged;
    }

    getAvailableSeeds() {
        return MISSION_SEED_IDS.filter(id => this.state.missionSeeds[id]?.unlocked);
    }

    // ─── Mission Generation ─────────────────────────────────────────

    generateMission(seedId) {
        const seedDef = MISSION_SEEDS[seedId];
        if (!seedDef) return null;

        const seedState = this.state.missionSeeds[seedId];
        const level = seedState.level;

        // Calculate target count
        const N = Math.max(
            seedDef.action.baseCount,
            seedDef.action.baseCount + Math.round(
                (level - 1) * seedDef.action.baseCount * seedDef.action.countScaling
            )
        );

        // Roll rewards
        const reward = {};
        for (const entry of seedDef.rewards) {
            if (Math.random() > entry.probability) continue;
            const amount = entry.baseAmount + Math.round((level - 1) * entry.scaling);
            if (amount > 0) {
                reward[entry.type] = (reward[entry.type] || 0) + amount;
            }
        }

        return {
            id: generateUUID(),
            seedId: seedDef.id,
            titleKey: seedDef.nameKey,
            descriptionKey: seedDef.descriptionKey,
            icon: seedDef.icon,
            target: N,
            progress: 0,
            reward,
            generatedAt: Date.now(),
            rerolled: false,
            completed: false,
            claimed: false
        };
    }

    pickNewMission() {
        const available = this.getAvailableSeeds();
        if (available.length === 0) return null;

        // Category counts for weighting
        const categoryCounts = {};
        for (const m of this.state.activeMissions) {
            const cat = MISSION_SEEDS[m.seedId]?.category;
            if (cat) {
                categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
            }
        }

        const weights = available.map(seedId => {
            const seedDef = MISSION_SEEDS[seedId];
            let weight = 1.0;
            if (seedDef.difficulty === 'easy') weight = 1.5;
            else if (seedDef.difficulty === 'medium') weight = 1.0;
            else if (seedDef.difficulty === 'hard') weight = 0.6;
            else if (seedDef.difficulty === 'epic') weight = 0.3;

            const catCount = categoryCounts[seedDef.category] || 0;
            if (catCount === 0) weight *= 1.3;

            return weight;
        });

        const selectedSeedId = weightedRandom(available, weights);
        return this.generateMission(selectedSeedId);
    }

    fillSlots(missionBoardLevel) {
        const maxSlots = missionBoardLevel || 0;
        const currentCount = this.state.activeMissions.length;
        const needed = maxSlots - currentCount;

        if (needed <= 0) return [];

        const newMissions = [];
        for (let i = 0; i < needed; i++) {
            const mission = this.pickNewMission();
            if (mission) {
                this.state.activeMissions.push(mission);
                newMissions.push(mission);
            }
        }
        this.save();
        return newMissions;
    }

    // ─── Progress Tracking ──────────────────────────────────────────

    trackProgress(type, targetType, count = 1) {
        let anyCompleted = false;
        for (const mission of this.state.activeMissions) {
            if (mission.completed) continue;

            const seedDef = MISSION_SEEDS[mission.seedId];
            if (!seedDef) continue;

            // Match action type and targetType
            if (seedDef.action.type === type && seedDef.action.targetType === targetType) {
                mission.progress += count;
                if (mission.progress >= mission.target) {
                    mission.progress = mission.target;
                    mission.completed = true;
                    anyCompleted = true;
                }
            }
        }
        this.save();
        return anyCompleted;
    }

    // ─── Completion & Rewards ───────────────────────────────────────

    completeMission(missionId) {
        const mission = this.state.activeMissions.find(m => m.id === missionId);
        if (!mission || !mission.completed || mission.claimed) {
            return Result.fail('mission_error_claim_unavailable');
        }

        mission.claimed = true;

        // Grant rewards
        const seedDef = MISSION_SEEDS[mission.seedId];
        for (const [rewardType, amount] of Object.entries(mission.reward)) {
            if (rewardType === 'gold') {
                this.villageService.addGold(amount);
            } else {
                this.inventoryService.addItem(rewardType, amount);
            }
        }

        // Level up the seed
        const seedState = this.state.missionSeeds[mission.seedId];
        seedState.completions++;
        seedState.level = parseFloat((seedState.level + LEVEL_INCREMENT).toFixed(2));

        // Remove from active and regenerate
        this.state.activeMissions = this.state.activeMissions.filter(m => m.id !== missionId);
        const newMission = this.pickNewMission();
        if (newMission) {
            this.state.activeMissions.push(newMission);
        }

        this.save();
        return Result.ok({ mission, reward: mission.reward, newMission });
    }

    // ─── Reroll ─────────────────────────────────────────────────────

    canReroll() {
        if (!this.state.lastRerollTimestamp) return true;
        const now = Date.now();
        return (now - this.state.lastRerollTimestamp) >= REROLL_COOLDOWN_MS;
    }

    rerollMission(missionId) {
        if (!this.canReroll()) {
            return Result.fail('mission_error_reroll_cooldown');
        }

        const missionIndex = this.state.activeMissions.findIndex(m => m.id === missionId);
        if (missionIndex === -1) {
            return Result.fail('mission_error_not_found');
        }

        const oldMission = this.state.activeMissions[missionIndex];
        const newMission = this.generateMission(oldMission.seedId);
        if (!newMission) {
            return Result.fail('mission_error_reroll_failed');
        }

        newMission.rerolled = true;
        this.state.activeMissions[missionIndex] = newMission;
        this.state.lastRerollTimestamp = Date.now();
        this.save();

        return Result.ok({ oldMission, newMission });
    }

    resetRerollForNewDay() {
        this.state.lastRerollTimestamp = null;
        this.save();
    }

    // ─── Getters ────────────────────────────────────────────────────

    getActiveMissions() {
        return this.state.activeMissions.map(m => ({ ...m }));
    }

    getSeedState(seedId) {
        return this.state.missionSeeds[seedId] || null;
    }

    getAllSeedStates() {
        return { ...this.state.missionSeeds };
    }

    getState() {
        return {
            activeMissions: this.getActiveMissions(),
            availableSeedCount: this.getAvailableSeeds().length,
            canReroll: this.canReroll(),
            seedStates: this.getAllSeedStates()
        };
    }

    // ─── Force set (for dev/cheat) ──────────────────────────────────

    setSeedLevel(seedId, level) {
        if (this.state.missionSeeds[seedId]) {
            this.state.missionSeeds[seedId].level = parseFloat(level.toFixed(2));
            this.save();
        }
    }

    forceUnlock(seedId) {
        if (this.state.missionSeeds[seedId]) {
            this.state.missionSeeds[seedId].unlocked = true;
            this.save();
        }
    }
}
