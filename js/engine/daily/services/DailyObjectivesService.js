import { persistence } from '../../shared/core/Persistence.js';
import { Result } from '../../shared/core/Result.js';

const OBJECTIVE_TYPES = [
    { id: 'defeat_enemies', label: 'daily_uxelm_obj_defeat_enemies', target: [3, 5, 8], reward: { gold: 50, material_wood: 10 } },
    { id: 'spend_gold', label: 'daily_uxelm_obj_spend_gold', target: [100, 200, 500], reward: { gold: 30, material_stone: 5 } },
    { id: 'complete_expeditions', label: 'daily_uxelm_obj_complete_expeditions', target: [1, 2, 3], reward: { gold: 80, material_iron: 3 } },
    { id: 'upgrade_building', label: 'daily_uxelm_obj_upgrade_building', target: [1], reward: { gold: 40, material_wood: 15 } },
    { id: 'recruit_hero', label: 'daily_uxelm_obj_recruit_hero', target: [1], reward: { gold: 60, material_stone: 10 } },
    { id: 'craft_items', label: 'daily_uxelm_obj_craft_items', target: [1, 2, 3], reward: { gold: 35, material_iron: 5 } }
];

// Tutorial objectives for first-time players (days 1–7)
const TUTORIAL_OBJECTIVES = {
    1: [
        { id: 'build_farm', label: 'daily_uxelm_obj_build_farm', target: 1, reward: { gold: 50, material_wood: 20 }, description: 'daily_uxelm_obj_build_farm_desc' },
        { id: 'spend_gold', label: 'daily_uxelm_obj_spend_gold', target: 50, reward: { gold: 20, material_stone: 5 } },
    ],
    2: [
        { id: 'assign_worker', label: 'daily_uxelm_obj_assign_worker', target: 1, reward: { gold: 30, material_wood: 10 }, description: 'daily_uxelm_obj_assign_worker_desc' },
        { id: 'explore_region', label: 'daily_uxelm_obj_explore_region', target: 1, reward: { gold: 40, material_wood: 15 }, description: 'daily_uxelm_obj_explore_region_desc' },
    ],
    3: [
        { id: 'complete_expeditions', label: 'daily_uxelm_obj_complete_expeditions', target: 1, reward: { gold: 60, material_iron: 5 } },
        { id: 'defeat_enemies', label: 'daily_uxelm_obj_defeat_enemies', target: 2, reward: { gold: 40, material_wood: 10 } },
    ],
    4: [
        { id: 'build_explorer_guild', label: 'daily_uxelm_obj_build_explorer_guild', target: 1, reward: { gold: 80, material_stone: 20 }, description: 'daily_uxelm_obj_build_explorer_guild_desc' },
        { id: 'craft_items', label: 'daily_uxelm_obj_craft_items', target: 1, reward: { gold: 35, material_wood: 10 } },
    ],
    5: [
        { id: 'recruit_hero', label: 'daily_uxelm_obj_recruit_hero', target: 1, reward: { gold: 60, material_stone: 15 } },
        { id: 'upgrade_building', label: 'daily_uxelm_obj_upgrade_building', target: 1, reward: { gold: 50, material_wood: 20 } },
    ],
    6: [
        { id: 'complete_expeditions', label: 'daily_uxelm_obj_complete_expeditions', target: 2, reward: { gold: 80, material_iron: 10 } },
        { id: 'spend_gold', label: 'daily_uxelm_obj_spend_gold', target: 200, reward: { gold: 30, material_stone: 10 } },
    ],
    7: [
        { id: 'defeat_enemies', label: 'daily_uxelm_obj_defeat_enemies', target: 5, reward: { gold: 60, material_wood: 15 } },
        { id: 'craft_items', label: 'daily_uxelm_obj_craft_items', target: 2, reward: { gold: 40, material_iron: 8 } },
    ],
};

export class DailyObjectivesService {
    constructor(inventoryService, options = {}) {
        this.inventoryService = inventoryService;
        this.STORAGE_KEY = 'daily_objectives_state';
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
            day: 1,
            objectives: [],
            pendingChoices: [],
            allCompletedDay: null
        };
    }

    _load() {
        const defaultState = this._getDefaultState();
        const loaded = persistence.load(this.STORAGE_KEY, defaultState);
        if (!loaded.pendingChoices) loaded.pendingChoices = [];
        return loaded;
    }

    save() {
        persistence.save(this.STORAGE_KEY, this.state);
    }

    generateForDay(day) {
        if (this.state.day === day && (this.state.objectives.length > 0 || this.state.pendingChoices.length > 0)) {
            return;
        }

        this.state.day = day;
        this.state.allCompletedDay = null;
        this.state.objectives = [];

        // Days 1–7: use tutorial objectives for new players (detected by no prior objectives)
        const isNewPlayer = this.state.objectives.length === 0 && this.state.pendingChoices.length === 0;
        if (day >= 1 && day <= 7 && isNewPlayer && TUTORIAL_OBJECTIVES[day]) {
            this.state.pendingChoices = TUTORIAL_OBJECTIVES[day].map(obj => ({
                ...obj,
                progress: 0,
                completed: false,
                claimed: false
            }));
            this.save();
            return;
        }

        // Generate 4 objective choices; player picks 2
        const shuffled = [...OBJECTIVE_TYPES].sort(() => Math.random() - 0.5);
        const picked = shuffled.slice(0, 4);

        this.state.pendingChoices = picked.map(type => {
            const target = type.target[Math.floor(Math.random() * type.target.length)];
            return {
                id: type.id,
                label: type.label,
                target,
                progress: 0,
                completed: false,
                reward: { ...type.reward }
            };
        });

        this.save();
    }

    track(type, amount = 1) {
        let anyCompleted = false;
        this.state.objectives.forEach(obj => {
            if (obj.completed || obj.id !== type) return;
            obj.progress = Math.min(obj.target, obj.progress + amount);
            if (obj.progress >= obj.target) {
                obj.completed = true;
                anyCompleted = true;
            }
        });

        if (anyCompleted) {
            this._checkAllCompleted();
        }

        this.save();
        return anyCompleted;
    }

    _checkAllCompleted() {
        const allDone = this.state.objectives.every(o => o.completed);
        if (allDone && this.state.allCompletedDay === null) {
            this.state.allCompletedDay = this.state.day;
            // Grant bonus reward for completing all objectives
            this.inventoryService.addItem('material_wood', 20);
            this.inventoryService.addItem('material_stone', 10);
        }
    }

    getObjectives() {
        return this.state.objectives;
    }

    getState() {
        const status = this.state.pendingChoices.length > 0 ? 'choosing'
            : this.state.objectives.length > 0 ? 'active'
            : 'idle';
        return {
            day: this.state.day,
            objectives: this.state.objectives,
            pendingChoices: this.state.pendingChoices,
            status,
            allCompleted: this.state.allCompletedDay === this.state.day
        };
    }

    pickObjectives(objectiveIds) {
        if (!Array.isArray(objectiveIds) || objectiveIds.length !== 2) {
            return Result.fail('daily_error_selection_count_invalid');
        }
        if (this.state.pendingChoices.length === 0) {
            return Result.fail('daily_error_choice_none_pending');
        }
        const pendingIds = this.state.pendingChoices.map(o => o.id);
        const allValid = objectiveIds.every(id => pendingIds.includes(id));
        if (!allValid) {
            return Result.fail('daily_error_objective_selection_invalid');
        }

        this.state.objectives = this.state.pendingChoices.filter(o => objectiveIds.includes(o.id));
        this.state.pendingChoices = [];
        this.save();
        return Result.ok({ objectives: this.state.objectives });
    }

    claimReward(objectiveId) {
        const obj = this.state.objectives.find(o => o.id === objectiveId);
        if (!obj || !obj.completed || obj.claimed) {
            return Result.fail('daily_error_reward_not_available');
        }

        obj.claimed = true;

        if (obj.reward.gold) {
            // Gold is handled by caller adding to village
        }
        if (obj.reward.material_wood) {
            this.inventoryService.addItem('material_wood', obj.reward.material_wood);
        }
        if (obj.reward.material_stone) {
            this.inventoryService.addItem('material_stone', obj.reward.material_stone);
        }
        if (obj.reward.material_iron) {
            this.inventoryService.addItem('material_iron', obj.reward.material_iron);
        }

        this.save();
        return Result.ok({ reward: obj.reward });
    }
}
