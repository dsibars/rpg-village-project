import { persistence } from '../../shared/core/Persistence.js';

/**
 * DailyHeroActionsService - Each hero can perform ONE action per day.
 * Actions: Rest, Train, Scout, Craft, Socialize.
 * Actions are assigned before ending the day and resolve during nextDay().
 */
export class DailyHeroActionsService {
    constructor(heroService, expeditionService, villageService, inventoryService, regionService) {
        this.heroService = heroService;
        this.expeditionService = expeditionService;
        this.villageService = villageService;
        this.inventoryService = inventoryService;
        this.regionService = regionService;
        this.STORAGE_KEY = 'daily_hero_actions';
        this.state = this._loadState();
    }

    load() {
        this.state = this._loadState();
    }

    save() {
        persistence.save(this.STORAGE_KEY, this.state);
    }

    _loadState() {
        const saved = persistence.load(this.STORAGE_KEY);
        if (saved) return saved;
        return {
            assignments: {}, // heroId -> { action, target?, assignedDay }
            lastProcessedDay: 0
        };
    }

    /**
     * Assign an action to a hero for the current day.
     * Returns { success: true } or { success: false, error: '...' }
     */
    assignAction(heroId, action, target = null) {
        const hero = this.heroService.get(heroId);
        if (!hero) return { success: false, error: 'heroes_error_hero_not_found' };

        const activity = this.expeditionService.getHeroActivity(heroId);
        if (activity.type === 'expedition') {
            return { success: false, error: 'heroes_error_hero_on_expedition' };
        }

        const villageDay = this.villageService.getState().day || 1;

        // Validate action type
        const validActions = ['rest', 'train', 'scout', 'craft', 'socialize'];
        if (!validActions.includes(action)) {
            return { success: false, error: 'Invalid action type' };
        }

        // Check if hero already has an action assigned today
        const existing = this.state.assignments[heroId];
        if (existing && existing.assignedDay === villageDay) {
            return { success: false, error: 'Hero already has an action assigned today' };
        }

        this.state.assignments[heroId] = {
            action,
            target,
            assignedDay: villageDay
        };
        this.save();

        return { success: true };
    }

    /**
     * Clear a hero's assigned action.
     */
    clearAction(heroId) {
        delete this.state.assignments[heroId];
        this.save();
        return { success: true };
    }

    /**
     * Get all assignments for the current day.
     */
    getCurrentAssignments() {
        const villageDay = this.villageService.getState().day || 1;
        const result = {};
        for (const [heroId, assignment] of Object.entries(this.state.assignments)) {
            if (assignment.assignedDay === villageDay) {
                result[heroId] = assignment;
            }
        }
        return result;
    }

    /**
     * Get assignment for a specific hero.
     */
    getHeroAction(heroId) {
        const villageDay = this.villageService.getState().day || 1;
        const assignment = this.state.assignments[heroId];
        if (assignment && assignment.assignedDay === villageDay) {
            return assignment;
        }
        return null;
    }

    /**
     * Process all assigned actions during nextDay().
     * Returns a log of what happened.
     */
    processActions(villageDay) {
        if (villageDay <= this.state.lastProcessedDay) return [];
        this.state.lastProcessedDay = villageDay;

        const log = [];
        const processedHeroes = new Set();

        // Process actions assigned for the day that just ended (villageDay - 1)
        const targetDay = villageDay - 1;

        for (const [heroId, assignment] of Object.entries(this.state.assignments)) {
            if (assignment.assignedDay !== targetDay) continue;
            if (processedHeroes.has(heroId)) continue;

            const hero = this.heroService.get(heroId);
            if (!hero) continue;

            // Ensure hero is still idle (not sent on expedition after assigning)
            const activity = this.expeditionService.getHeroActivity(heroId);
            if (activity.type !== 'idle') {
                log.push({ heroId, heroName: hero.name, action: assignment.action, skipped: true, reason: 'Hero was busy' });
                continue;
            }

            const result = this._resolveAction(hero, assignment);
            log.push({ heroId, heroName: hero.name, action: assignment.action, ...result });
            processedHeroes.add(heroId);
        }

        // Clean up old assignments
        for (const heroId of Object.keys(this.state.assignments)) {
            if (this.state.assignments[heroId].assignedDay < targetDay) {
                delete this.state.assignments[heroId];
            }
        }

        this.save();
        return log;
    }

    _resolveAction(hero, assignment) {
        switch (assignment.action) {
            case 'rest':
                return this._resolveRest(hero);
            case 'train':
                return this._resolveTrain(hero);
            case 'scout':
                return this._resolveScout(hero, assignment.target);
            case 'craft':
                return this._resolveCraft(hero, assignment.target);
            case 'socialize':
                return this._resolveSocialize(hero);
            default:
                return { success: false, error: 'Unknown action' };
        }
    }

    _resolveRest(hero) {
        // Extra fatigue recovery beyond the daily base
        const fatigueRecovered = hero.recoverFatigue(20);
        // Also heal some HP
        const hpRecovered = Math.min(hero.maxHp - hero.hp, Math.floor(hero.maxHp * 0.2));
        hero.hp += hpRecovered;

        return {
            success: true,
            fatigueRecovered,
            hpRecovered,
            description: `${hero.name} rested and recovered ${fatigueRecovered} fatigue and ${hpRecovered} HP.`
        };
    }

    _resolveTrain(hero) {
        const trainingGroundsLevel = this.villageService.getState().infrastructure.training_grounds || 0;
        const baseXp = 20 + (hero.level * 5);
        const multiplier = 1 + (trainingGroundsLevel * 0.2); // +20% per level
        const xpGained = Math.floor(baseXp * multiplier);
        const preLevel = hero.level;
        hero.addExperience(xpGained);

        return {
            success: true,
            xpGained,
            leveledUp: hero.level > preLevel,
            description: `${hero.name} trained and gained ${xpGained} XP.${hero.level > preLevel ? ' Level up!' : ''}`
        };
    }

    _resolveScout(hero, targetRegionId) {
        // Reveal a hidden node or increase clear count for a region
        const regions = this.regionService.getRegions();
        const region = targetRegionId ? regions[targetRegionId] : null;

        if (!region || region.unlocked) {
            // If no target or target already unlocked, reveal a random hidden node
            const hiddenNodes = Object.values(regions).filter(r => !r.unlocked && r.requires && r.requires.some(req => req.type === 'explorer_guild'));
            if (hiddenNodes.length > 0) {
                const target = hiddenNodes[Math.floor(Math.random() * hiddenNodes.length)];
                return {
                    success: true,
                    regionId: target.id,
                    description: `${hero.name} scouted and discovered a path to ${target.name || target.id}!`
                };
            }
            return {
                success: true,
                description: `${hero.name} scouted but found nothing new.`
            };
        }

        return {
            success: true,
            regionId: region.id,
            description: `${hero.name} scouted ${region.name || region.id} for resources.`
        };
    }

    _resolveCraft(hero, recipeId) {
        // Simple crafting: convert materials to gold or items
        // For now, convert 5 wood + 5 stone to a small gold reward
        const wood = this.inventoryService.getItemCount('material_wood');
        const stone = this.inventoryService.getItemCount('material_stone');

        if (wood >= 5 && stone >= 5) {
            this.inventoryService.useItem('material_wood', 5);
            this.inventoryService.useItem('material_stone', 5);
            const goldEarned = 15 + Math.floor(Math.random() * 10);
            this.villageService.addGold(goldEarned);

            return {
                success: true,
                goldEarned,
                description: `${hero.name} crafted goods from materials and earned ${goldEarned} gold.`
            };
        }

        return {
            success: false,
            description: `${hero.name} tried to craft but lacked sufficient materials (need 5 wood + 5 stone).`
        };
    }

    _resolveSocialize(hero) {
        // Relationships system placeholder - just give a small morale/fatigue benefit
        const fatigueRecovered = hero.recoverFatigue(5);
        return {
            success: true,
            fatigueRecovered,
            description: `${hero.name} socialized with villagers and felt refreshed. (-${fatigueRecovered} fatigue)`
        };
    }
}
