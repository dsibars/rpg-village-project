/**
 * GameEngine - Central Facade
 * Wires together the bounded contexts (domains) and provides a clean API for the presentation layer.
 */
import { HeroService } from './heroes/services/HeroService.js';
import { BattleService } from './shared/combat/services/BattleService.js';
import { InventoryService } from './shared/inventory/services/InventoryService.js';
import { VillageService } from './village/services/VillageService.js';
import { ExpeditionService } from './explore/services/ExpeditionService.js';
import { DailyObjectivesService } from './daily/services/DailyObjectivesService.js';
import { CalendarService } from './calendar/services/CalendarService.js';
import { AcademyService } from './academy/AcademyService.js';
import { TitleService } from './hall_of_fame/TitleService.js';
import { UnlockService } from './shared/services/UnlockService.js';
import { SimulationRunner } from './gambit/SimulationRunner.js';
import { GambitHealthService } from './gambit/GambitHealthService.js';
import { persistence } from './shared/core/Persistence.js';
const DEBUG = false;

import { i18n } from './shared/core/i18n/I18nService.js';
import { Result } from './shared/core/Result.js';
import { getRefineCost, MEAL_RECIPES } from './shared/data/GameConstants.js';

export class GameEngine {
    constructor() {
        this.STORAGE_KEY = 'village_state';

        // Initialize Services
        this.inventoryService = new InventoryService();
        this.villageService = new VillageService(this.inventoryService);
        this.heroService = new HeroService(this.inventoryService);
        this.battleService = new BattleService(this.inventoryService);
        this.expeditionService = new ExpeditionService(
            this.battleService, 
            this.heroService, 
            this.villageService, 
            this.inventoryService
        );
        this.dailyObjectivesService = new DailyObjectivesService(this.inventoryService);
        this.calendarService = new CalendarService(this.villageService, this.heroService);
        this.academyService = new AcademyService(this.heroService, this.villageService);
        this.unlockService = new UnlockService();
        this.i18n = i18n;
        
        // New Game Experience
        const hasHeroes = persistence.load('heroes_data', null) !== null;
        const hasVillage = persistence.load('village_state', null) !== null;
        
        this.isNewGame = !hasHeroes || !hasVillage;
        if (DEBUG) console.log('Engine: checkNewGame?', this.isNewGame, { hasHeroes, hasVillage });
        
        if (this.isNewGame) {
            this.initNewGame();
        }

        this.i18n.setLanguage(persistence.load('settings_lang', 'en'));

        // Resume combat if active
        if (this.expeditionService.state.activeCombatExpeditionId) {
            if (DEBUG) console.log('Engine: Resuming active combat...');
            this.expeditionService.resumeActiveBattle();
        }
    }


    initNewGame() {
        if (DEBUG) console.log('Engine: Initializing New Game state...');
        
        // Add starting hero if not exists
        const currentHeroes = this.heroService.list();
        if (currentHeroes.length === 0) {
            this.heroService.add({
                name: "Arthur",
                origin: "origin_warrior",
                avatar: "arthur.webp",
                level: 1,
                statPoints: 5
            });
        }
    }

    activateDeveloperCheat() {
        if (DEBUG) console.warn('🚀 Engine: Developer Cheat Activated!');

        // 1. Add 10,000 gold
        this.villageService.addGold(10000);
        this.villageService.save();

        // 2. Add 10,000 wood and 10,000 stone (bypass storage limits)
        const inv = this.inventoryService;
        inv.data.materials['material_wood'] = (inv.data.materials['material_wood'] || 0) + 10000;
        inv.data.materials['material_stone'] = (inv.data.materials['material_stone'] || 0) + 10000;
        inv.save();

        // 3. Grant 5,000 XP to all heroes (causes level ups)
        this.heroService.heroes.forEach(hero => {
            hero.addExperience(5000);
        });
        this.heroService.saveAll();

        // 4. Unlock the shop by marking tutorial cave as completed (if not already)
        const expState = this.expeditionService.state;
        if (!expState.completedIds.includes('exp_tutorial_cave')) {
            expState.completedIds.push('exp_tutorial_cave');
            // Remove tutorial cave from available nodes so it isn't shown as available
            const region = expState.regions['reg_greenfields'];
            if (region) {
                region.availableNodes = region.availableNodes.filter(n => n.id !== 'exp_tutorial_cave');
                region.clears = (region.clears || 0) + 1;
                // Generate next story/procedural nodes
                this.expeditionService._generateNextNodes('reg_greenfields');
            }
            this.expeditionService.save();
        }

        return Result.ok();
    }

    update() {
        const now = Date.now();
        const activeExpeditions = this.expeditionService.state.activeExpeditions;
        const maxConcurrentExpeditions = this.expeditionService.getMaxConcurrentExpeditions();
        
        const heroesDto = this.heroService.list().map(hero => {
            const dto = hero.toJSON();
            const activityInfo = this.expeditionService.getHeroActivity(hero.id);
            dto.activity = activityInfo.type;
            if (activityInfo.type === 'expedition') {
                dto.activityTargetId = activityInfo.expeditionId;
            }
            return dto;
        });

        const activeBattle = (this.battleService.heroes && this.battleService.heroes.length > 0) ? {
            heroes: this.battleService.heroes.map(h => h.toJSON()),
            enemies: this.battleService.enemies.map(e => e.toJSON()),
            turnOrder: this.battleService.turnOrder.map(e => ({ id: e.id, name: e.name, type: (e.origin !== undefined || e.type === 'Hero') ? 'Hero' : 'Enemy' })),
            currentTurnIndex: this.battleService.currentTurnIndex,
            log: [...this.battleService.log],
            isOver: this.battleService.isOver,
            autoBattle: this.battleService.autoBattle,
            itemUsedThisTurn: this.battleService.itemUsedThisTurn
        } : null;

        const currentDay = this.villageService.getState().day || 1;
        return {
            village: this.villageService.getState(),
            inventory: this.inventoryService.getState(),
            heroes: heroesDto,
            expeditions: this.expeditionService.getExpeditions(),
            activeExpeditions,
            maxConcurrentExpeditions,
            completedExpeditions: this.expeditionService.state.completedIds || [],
            activeBattle,
            bestiary: this.expeditionService.getBestiary(),
            enemyTemplates: this.expeditionService.getEnemyTemplates(),
            dailyObjectives: this.dailyObjectivesService.getState(),
            calendar: this.calendarService.getState(currentDay),
            expeditionRegions: this.expeditionService.state.regions || {},
            unlockedNarratives: this.unlockService.getShownNarratives()
        };
    }

    // --- Hero Facade ---
    recruitHero() {
        const tavernLevel = this.villageService.getState().infrastructure.tavern || 0;
        if (tavernLevel < 1) {
            return Result.fail('error_tavern_required');
        }

        const heroCount = this.heroService.list().length;
        const baseCost = 100;
        const cost = Math.floor(baseCost * Math.pow(1.2, heroCount));

        if (this.villageService.state.gold < cost) {
            return Result.fail('error_not_enough_gold');
        }

        this.villageService.state.gold -= cost;
        this.villageService.save();

        const result = this.heroService.generateRandomHero();

        if (result.success) {
            this.dailyObjectivesService.track('recruit_hero', 1);
            this.dailyObjectivesService.track('spend_gold', cost);
            return Result.ok({ hero: result.data, cost });
        }
        return result;
    }

    _assertHeroAvailable(heroId) {
        const activityInfo = this.expeditionService.getHeroActivity(heroId);
        if (activityInfo && activityInfo.type === 'expedition') {
            return Result.fail('error_hero_busy');
        }
        const hero = this.heroService.get(heroId);
        if (hero && hero.isInscribing && hero.isInscribing()) {
            return Result.fail('error_hero_inscribing');
        }
        return Result.ok(true);
    }

    increaseHeroStat(heroId, statId) {
        const check = this._assertHeroAvailable(heroId);
        if (!check.success) return check;
        return this.heroService.increaseHeroStat(heroId, statId);
    }

    learnHeroFamily(heroId, familyId) {
        const check = this._assertHeroAvailable(heroId);
        if (!check.success) return check;
        return this.heroService.learnHeroFamily(heroId, familyId);
    }

    inscribeHeroBodyCircle(heroId, glyphIds, glyphTiers) {
        const check = this._assertHeroAvailable(heroId);
        if (!check.success) return check;
        const hero = this.heroService.get(heroId);
        if (hero && hero.isInscribing && hero.isInscribing()) {
            return Result.fail('error_hero_already_inscribing');
        }
        return this.heroService.inscribeHeroBodyCircle(heroId, glyphIds, glyphTiers);
    }

    inscribeHeroSpell(heroId, spell) {
        const check = this._assertHeroAvailable(heroId);
        if (!check.success) return check;
        return this.heroService.inscribeHeroSpell(heroId, spell);
    }

    eraseHeroBodyCircle(heroId) {
        const check = this._assertHeroAvailable(heroId);
        if (!check.success) return check;
        return this.heroService.eraseHeroBodyCircle(heroId);
    }

    addHeroGambit(heroId, gambit) {
        const check = this._assertHeroAvailable(heroId);
        if (!check.success) return check;
        return this.heroService.addHeroGambit(heroId, gambit);
    }

    removeHeroGambit(heroId, gambitId) {
        const check = this._assertHeroAvailable(heroId);
        if (!check.success) return check;
        return this.heroService.removeHeroGambit(heroId, gambitId);
    }

    toggleHeroGambit(heroId, gambitId) {
        const check = this._assertHeroAvailable(heroId);
        if (!check.success) return check;
        return this.heroService.toggleHeroGambit(heroId, gambitId);
    }

    moveHeroGambit(heroId, gambitId, direction) {
        const check = this._assertHeroAvailable(heroId);
        if (!check.success) return check;
        return this.heroService.moveHeroGambit(heroId, gambitId, direction);
    }

    updateHeroFallbackAction(heroId, action) {
        const check = this._assertHeroAvailable(heroId);
        if (!check.success) return check;
        const hero = this.heroService.get(heroId);
        if (!hero) return Result.fail('error_hero_not_found');
        
        // This relies on Hero.js setFallbackAction which we need to make sure exists
        if (typeof hero.setFallbackAction === 'function') {
            const result = hero.setFallbackAction(action);
            if (result.success) this.heroService.saveAll();
            return result;
        } else {
            hero.fallbackAction = action;
            this.heroService.saveAll();
            return Result.ok(true);
        }
    }

    testHeroGambits(heroId, scenarioId = 'reg_greenfields') {
        const hero = this.heroService.get(heroId);
        if (!hero) return Result.fail('error_hero_not_found');
        
        // Get enemy pool for the scenario region
        const enemyPool = this.expeditionService?.getEnemyPoolForRegion?.(scenarioId) || [];
        if (enemyPool.length === 0) {
            return Result.fail('error_no_enemies_for_scenario');
        }
        
        // Build encounter: 1-3 enemies based on region difficulty
        const encounterCount = Math.min(3, Math.max(1, Math.floor(Math.random() * 3) + 1));
        const enemies = [];
        for (let i = 0; i < encounterCount; i++) {
            const template = enemyPool[Math.floor(Math.random() * enemyPool.length)];
            enemies.push({ ...template, id: template.id + '_' + i });
        }
        
        const result = SimulationRunner.runHeadless(hero, enemies, this.inventoryService, scenarioId, 10);
        const health = GambitHealthService.calculateScore(hero, result);
        
        return Result.ok({
            result,
            healthScore: health.score,
            rating: health.rating
        });
    }

    suggestHeroGambitPreset(heroId) {
        const check = this._assertHeroAvailable(heroId);
        if (!check.success) return check;
        const hero = this.heroService.get(heroId);
        if (!hero) return Result.fail('error_hero_not_found');

        const preset = GambitService.getPresetForHero(hero);
        if (!preset) return Result.fail('error_no_preset_matches');

        const result = GambitService.applyPreset(hero, preset.id);
        if (!result.success) return result;

        this.heroService.saveAll();

        // Count how many rules were actually added (non-empty slots before vs after)
        // applyPreset fills empty slots only, so we report the preset name
        return Result.ok({ presetId: preset.id, presetName: preset.name, addedCount: result.data || 0 });
    }

    equipHeroItem(heroId, slot, equipmentId) {
        const check = this._assertHeroAvailable(heroId);
        if (!check.success) return check;
        return this.heroService.equipItem(heroId, slot, equipmentId);
    }

    unequipHeroItem(heroId, slot) {
        const check = this._assertHeroAvailable(heroId);
        if (!check.success) return check;
        return this.heroService.unequipItem(heroId, slot);
    }

    // --- Shop & Forge Facade ---

    // Sell prices per unit (intentionally low)
    static SELL_PRICES = {
        'food_raw_grain':  1,
        'material_wood':   2,
        'material_stone':  3
    };

    buyItem(itemData, costGold) {
        if (this.villageService.state.gold < costGold) {
            return Result.fail('error_not_enough_gold');
        }

        const maxStorage = this.villageService.getMaxStorage();
        if (this.inventoryService.getTotalStorageUsed() + 1 > maxStorage) {
            return Result.fail('error_storage_full');
        }

        // Deduct Gold
        this.villageService.state.gold -= costGold;
        this.villageService.save();
        this.dailyObjectivesService.track('spend_gold', costGold);

        // Deliver item
        if (itemData.type === 'consumable') {
            this.inventoryService.addItem(itemData.id, 1);
        } else {
            this.inventoryService.addEquipment(itemData);
        }

        return Result.ok();
    }

    /**
     * Sell a raw resource (food, wood, stone) for gold.
     * @param {string} resourceId  - e.g. 'material_wood'
     * @param {number} quantity    - number of units to sell (1 / 10 / 100)
     */
    sellResource(resourceId, quantity) {
        const pricePerUnit = GameEngine.SELL_PRICES[resourceId];
        if (!pricePerUnit) {
            return Result.fail('error_item_not_found');
        }

        const available = this.inventoryService.getItemCount(resourceId);
        const toSell = Math.min(quantity, available);
        if (toSell <= 0) {
            return Result.fail('error_not_enough_items');
        }

        // Remove resources
        this.inventoryService.useItem(resourceId, toSell);

        // Grant gold
        const goldEarned = toSell * pricePerUnit;
        this.villageService.addGold(goldEarned);

        return Result.ok({ sold: toSell, goldEarned });
    }

    /**
     * Sell an inventory item (equipment or consumable) for gold.
     * @param {string} itemId    - Unique item ID or consumable ID
     * @param {string} itemType  - 'consumable' | 'equipment'
     * @param {number} sellPrice - Calculated sell price (gold)
     */
    sellItem(itemId, itemType, sellPrice) {
        if (itemType === 'consumable') {
            const result = this.inventoryService.useItem(itemId, 1);
            if (!result.success) return result;
        } else {
            const result = this.inventoryService.removeEquipment(itemId);
            if (!result.success) return result;
        }

        this.villageService.addGold(sellPrice);
        return Result.ok({ goldEarned: sellPrice });
    }

    getRefineCost(item) {
        return getRefineCost(item);
    }

    refineEquipment(itemId) {
        let item = this.inventoryService.getEquipment(itemId);
        let equippedHero = null;
        let equippedSlot = null;

        if (!item) {
            // Check all heroes
            for (const h of this.heroService.list()) {
                for (const slot of ['head', 'body', 'legs', 'leftHand', 'rightHand', 'accessory']) {
                    const eq = h.equipment[slot];
                    if (eq && eq.id === itemId) {
                        item = eq; // Plain object representation of the equipment
                        equippedHero = h;
                        equippedSlot = slot;
                        break;
                    }
                }
                if (item) break;
            }
        }

        if (!item) return Result.fail('error_item_not_found');
        if (item.level >= 10) return Result.fail('error_refine_max');

        const cost = this.getRefineCost(item);

        // Validate resources
        if (this.villageService.state.gold < cost.gold) {
            return Result.fail('error_not_enough_gold');
        }

        for (const [matId, qty] of Object.entries(cost.materials)) {
            if (this.inventoryService.getItemCount(matId) < qty) {
                return Result.fail('error_not_enough_materials');
            }
        }

        // Spend resources
        this.villageService.state.gold -= cost.gold;
        this.villageService.save();
        this.dailyObjectivesService.track('spend_gold', cost.gold);
        this.dailyObjectivesService.track('craft_items', 1);

        for (const [matId, qty] of Object.entries(cost.materials)) {
            this.inventoryService.useItem(matId, qty);
        }

        // Increase level
        if (equippedHero) {
            item.level = (item.level || 0) + 1;
            equippedHero.recalculateStats({});
            this.heroService.saveAll();
        } else {
            item.increaseLevel();
            this.inventoryService.save();
        }

        return Result.ok(item);
    }

    // --- Meal Crafting ---
    cookMeal(recipeId) {
        const recipe = MEAL_RECIPES[recipeId];
        if (!recipe) return Result.fail('error_recipe_not_found');

        // Check ingredients
        for (const [ingId, qty] of Object.entries(recipe.ingredients)) {
            if (this.inventoryService.getItemCount(ingId) < qty) {
                return Result.fail('error_not_enough_materials');
            }
        }

        // Deduct ingredients
        for (const [ingId, qty] of Object.entries(recipe.ingredients)) {
            this.inventoryService.useItem(ingId, qty);
        }

        // Add meal to food inventory
        this.inventoryService.addItem(recipeId, 1);
        this.dailyObjectivesService.track('craft_items', 1);

        return Result.ok({ recipeId, mealId: recipeId });
    }

    consumeMeal(mealId) {
        const recipe = MEAL_RECIPES[mealId];
        if (!recipe) return Result.fail('error_meal_not_found');

        const mealCount = this.inventoryService.getItemCount(mealId);
        if (mealCount < 1) return Result.fail('error_not_enough_items');

        this.inventoryService.useItem(mealId, 1);

        // Apply buffs to all idle heroes
        const buffs = Object.entries(recipe.buff).map(([stat, value]) => ({
            stat,
            value,
            battlesRemaining: recipe.battles
        }));

        let fedCount = 0;
        this.heroService.list().forEach(hero => {
            const activity = this.expeditionService.getHeroActivity(hero.id);
            if (activity.type === 'idle') {
                if (!hero.mealBuffs) hero.mealBuffs = [];
                // Remove existing buffs of same stat to prevent stacking
                hero.mealBuffs = hero.mealBuffs.filter(b => !recipe.buff.hasOwnProperty(b.stat));
                hero.mealBuffs.push(...buffs.map(b => ({ ...b })));
                hero.recalculateStats();
                fedCount++;
            }
        });

        this.heroService.saveAll();
        return Result.ok({ fedCount, buffs });
    }

    // --- Combat Facade ---
    nextBattleTurn() {
        return this.battleService.nextTurn();
    }

    executeBattleAction(skillId, targetIndex = null, tier = null) {
        const actor = this.battleService.turnOrder[this.battleService.currentTurnIndex];
        if (!actor) return Result.fail('error_no_active_actor');
        return this.battleService.executeAction(actor, skillId, targetIndex, [], tier);
    }

    executeBattleSpell(spellIndex, targetIndex = null) {
        const actor = this.battleService.turnOrder[this.battleService.currentTurnIndex];
        if (!actor) return Result.fail('error_no_active_actor');
        const spell = actor.spellCodex?.[spellIndex];
        if (!spell) return Result.fail('error_spell_not_found');
        return this.battleService.castSpell(actor, spell, targetIndex);
    }

    useBattleConsumable(consumableId, targetId = null) {
        const actor = this.battleService.turnOrder[this.battleService.currentTurnIndex];
        if (!actor) return Result.fail('error_no_active_actor');
        return this.battleService.useConsumable(actor, consumableId, targetId);
    }

    skipBattle() {
        if (!this.battleService.isOver) {
            this.battleService.autoBattle = true;
            while (!this.battleService.isOver) {
                this.battleService.nextTurn();
            }
        }
        return Result.ok({ skipped: true });
    }

    // --- Time & Construction ---
    nextDay() {
        const villageState = this.villageService.getState();
        this.dailyObjectivesService.generateForDay(villageState.day);

        const villageReport = this.villageService.nextDay();
        
        // Check for region unlocks based on buildings (e.g., Explorer Guild)
        this.expeditionService.checkRegionUnlocks();
        
        const expeditionResult = this.expeditionService.processDay();
        
        // --- Academy Teaching Phase ---
        const academyCompleted = this.academyService.processDay();

        // --- Body Inscription Phase ---
        const inscriptionCompleted = [];
        this.heroService.list().forEach(hero => {
            if (hero.processBodyInscriptionDay && hero.processBodyInscriptionDay()) {
                inscriptionCompleted.push(hero.name);
            }
        });
        if (inscriptionCompleted.length > 0) {
            this.heroService.saveAll();
        }

        // --- Hero Recovery Phase ---
        const infirmaryLevel = this.villageService.getState().infrastructure.infirmary || 0;
        const healPercentage = 0.20 + (infirmaryLevel * 0.10);
        const maxHeroesHealed = 1 + Math.floor(infirmaryLevel / 2);

        const heroesNeedingHeal = this.heroService.list().filter(h => h.hp > 0 && h.hp < h.maxHp && this.expeditionService.getHeroActivity(h.id).type === 'idle');
        // Sort by lowest hp percentage first
        heroesNeedingHeal.sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp));

        const heroesToHeal = heroesNeedingHeal.slice(0, maxHeroesHealed);
        
        const healedLog = [];
        heroesToHeal.forEach(hero => {
            const amount = Math.floor(hero.maxHp * healPercentage);
            const actualHeal = Math.min(amount, hero.maxHp - hero.hp);
            hero.hp += actualHeal;
            healedLog.push({ heroName: hero.name, amount: actualHeal });
        });

        // Restore full stamina for all idle heroes at the village
        const idleHeroes = this.heroService.list().filter(h => h.hp > 0 && this.expeditionService.getHeroActivity(h.id).type === 'idle');
        idleHeroes.forEach(hero => {
            if (hero.maxStamina > 0) {
                hero.stamina = hero.maxStamina;
            }
        });

        // --- Training Grounds Passive XP ---
        const trainingGroundsLevel = this.villageService.getState().infrastructure.training_grounds || 0;
        const xpGainRate = 0.05 * trainingGroundsLevel; // +5% per level
        const xpLog = [];
        
        if (xpGainRate > 0) {
            const idleHeroes = this.heroService.list().filter(h => h.hp > 0 && this.expeditionService.getHeroActivity(h.id).type === 'idle');
            idleHeroes.forEach(hero => {
                const expNeeded = hero.getExpToNextLevel();
                const xpGain = Math.max(1, Math.floor(expNeeded * xpGainRate));
                const preLevel = hero.level;
                hero.addExperience(xpGain);
                if (hero.level > preLevel) {
                    xpLog.push({ heroName: hero.name, leveledUp: true, xpGain });
                } else {
                    xpLog.push({ heroName: hero.name, leveledUp: false, xpGain });
                }
            });
            if (idleHeroes.length > 0) {
                this.heroService.saveAll();
            }
        }

        // Track expedition completions and enemy defeats for daily objectives
        if (expeditionResult.success && expeditionResult.data) {
            const expData = expeditionResult.data;
            if (expData.status === 'completed') {
                this.dailyObjectivesService.track('complete_expeditions', 1);
            }
            if (expData.combatLog && expData.combatLog.isVictory && expData.combatLog.enemies) {
                this.dailyObjectivesService.track('defeat_enemies', expData.combatLog.enemies.length);
            }
        }

        // --- Tavern Auto-Recruit ---
        let tavernRecruitHero = null;
        if (villageReport.tavernRecruit && villageReport.tavernRecruit.ready) {
            const heroResult = this.heroService.generateRandomHero();
            if (heroResult.success) {
                tavernRecruitHero = heroResult.data;
                this.dailyObjectivesService.track('recruit_hero', 1);
            }
        }

        // Tick meal buffs after any combat
        this.heroService.tickAllMealBuffs();

        // --- Calendar & Defense Events ---
        this.calendarService.generateEvents(villageState.day);
        let raidResult = null;
        const todayEvent = this.calendarService.getUpcomingEvents(villageState.day)
            .find(e => e.day === villageState.day && e.type === 'raid');
        if (todayEvent) {
            raidResult = this.calendarService.resolveRaid(villageState.day);
        }

        const dailyReport = {
            ...villageReport,
            expedition: expeditionResult.success ? expeditionResult.data : null,
            recovery: healedLog,
            training: xpLog,
            raid: raidResult,
            tavernRecruit: tavernRecruitHero
        };
        
        // ─── Unlock Check: evaluate narrative and codex unlocks after all resolution ───
        const unlockState = this._buildUnlockState();
        const newNarratives = this.unlockService.checkAllUnlocks(unlockState);
        const newCodexFeatures = this.unlockService.checkNewCodexFeatures(unlockState);

        if (newNarratives.length > 0) {
            this.unlockService.markAllAsShown(newNarratives);
        }

        dailyReport.newNarratives = newNarratives;
        dailyReport.newCodexFeatures = newCodexFeatures;

        this.villageService.setDailyReport(dailyReport);
        return dailyReport;
    }

    setWorkerRole(role, delta) {
        return this.villageService.setWorkerRole(role, delta);
    }

    // --- Calendar & Defense Facade ---
    assignDefense(heroId) {
        // Mutual exclusion: cannot assign a hero to defense if they are on an expedition
        const activity = this.expeditionService.getHeroActivity(heroId);
        if (activity && activity.type === 'expedition') {
            return Result.fail('error_hero_on_expedition');
        }
        return this.calendarService.assignDefense(heroId);
    }

    unassignDefense(heroId) {
        return this.calendarService.unassignDefense(heroId);
    }

    startProject(buildingId, targetLevel, costGold, costMaterials, duration) {
        const result = this.villageService.startProject(buildingId, targetLevel, costGold, costMaterials, duration);
        if (result.success) {
            this.dailyObjectivesService.track('spend_gold', costGold);
            this.dailyObjectivesService.track('upgrade_building', 1);
        }
        return result;
    }

    getBattleResolutionPreview() {
        return this.expeditionService.getBattleResolutionPreview();
    }

    resolveBattle() {
        return this.expeditionService.resolveBattle();
    }

    // --- Explore Facade ---
    assignExpedition(expeditionId, heroIds) {
        const result = this.expeditionService.assignExpedition(expeditionId, heroIds);
        
        // Mutual exclusion: auto-remove assigned heroes from defense
        if (result.success && heroIds.length > 0) {
            let removed = false;
            for (const hId of heroIds) {
                const idx = this.calendarService.state.defenseAssigned.indexOf(hId);
                if (idx >= 0) {
                    this.calendarService.state.defenseAssigned.splice(idx, 1);
                    removed = true;
                }
            }
            if (removed) {
                this.calendarService.save();
            }
        }
        
        return result;
    }

    /**
     * Returns a defense advisory for the given expedition assignment.
     * Checks whether assigning these heroes would leave the village undefended at the next raid.
     *
     * @param {string} expId — expedition ID
     * @param {string[]} heroIds — hero IDs being assigned
     * @returns {Object} — advisory result
     */
    getDefenseAdvisory(expId, heroIds) {
        const currentDay = this.villageService.getState().day || 1;
        
        // Find the expedition and compute duration
        const exp = this.expeditionService.getExpeditions().find(e => e.id === expId);
        const activeExp = this.expeditionService.state.activeExpeditions.find(e => e.id === expId);
        
        let duration = 1;
        if (exp && exp.stages) {
            const totalStages = exp.stages.length;
            const currentStage = activeExp ? activeExp.currentStage : 0;
            duration = Math.max(1, totalStages - currentStage);
        }
        
        // Minimum return day (actual may be longer with concurrent expeditions)
        const expeditionReturnDay = currentDay + duration;
        
        // Find next unresolved raid
        const calendarState = this.calendarService.getState(currentDay);
        const nextRaid = calendarState.upcomingEvents.find(e => e.type === 'raid');
        const nextRaidDay = nextRaid ? nextRaid.day : null;
        
        // Count idle heroes after this assignment
        const idleHeroes = this.heroService.list().filter(h => {
            const activity = this.expeditionService.getHeroActivity(h.id);
            return activity.type === 'idle' && h.hp > 0;
        });
        const idleHeroesAfterAssignment = idleHeroes.filter(h => !heroIds.includes(h.id)).length;
        
        // Check if any other active expedition returns before the raid
        let otherExpeditionReturnsBeforeRaid = false;
        for (const otherExp of this.expeditionService.state.activeExpeditions) {
            if (otherExp.id === expId) continue;
            const otherNode = this.expeditionService.getExpeditions().find(e => e.id === otherExp.id);
            if (otherNode && otherNode.stages) {
                const remaining = Math.max(0, otherNode.stages.length - otherExp.currentStage);
                const returnDay = currentDay + remaining;
                if (returnDay < nextRaidDay) {
                    otherExpeditionReturnsBeforeRaid = true;
                    break;
                }
            }
        }
        
        // Determine if warning is needed
        const hasWarning = (
            idleHeroesAfterAssignment === 0 &&
            nextRaidDay !== null &&
            expeditionReturnDay >= nextRaidDay &&
            !otherExpeditionReturnsBeforeRaid
        );
        
        let warningKey = null;
        if (hasWarning) {
            const daysUntilRaid = nextRaidDay - currentDay;
            warningKey = daysUntilRaid <= 1 ? 'advisory_raid_tomorrow' : 'advisory_undefended';
        }
        
        return {
            hasWarning,
            nextRaidDay,
            expeditionReturnDay,
            idleHeroesAfterAssignment,
            warningKey
        };
    }
    unassignHero(heroId) {
        return this.expeditionService.unassignHero(heroId);
    }
    retireExpedition(expId) {
        return this.expeditionService.retire(expId);
    }

    // --- Academy Facade ---
    teachGlyph(teacherId, studentId, glyphId) {
        return this.academyService.teachGlyph(teacherId, studentId, glyphId);
    }

    saveSpellDesign(design) {
        return this.academyService.saveDesign(design);
    }

    getSpellDesigns() {
        return this.academyService.getDesigns();
    }

    copyDesignToHero(designId, heroId) {
        return this.academyService.copyDesignToHero(designId, heroId);
    }

    // --- Unlock Facade ---
    getUnlockState() {
        return {
            unlockedNarratives: this.unlockService.getShownNarratives()
        };
    }

    /**
     * Builds a unified state object for UnlockService evaluation.
     * Mirrors the shape expected by UnlockNarratives.checkPredicate and CodexFeatures.isUnlocked.
     */
    _buildUnlockState() {
        const currentDay = this.villageService.getState().day || 1;
        return {
            heroes: this.heroService.list().map(h => h.toJSON()),
            village: this.villageService.getState(),
            completedExpeditions: this.expeditionService.state.completedIds || [],
            expeditionRegions: this.expeditionService.state.regions || {},
            calendar: this.calendarService.getState(currentDay)
        };
    }

    // --- Hall of Fame Facade ---
    evaluateHeroTitles(heroId) {
        const hero = this.heroService.get(heroId);
        if (!hero) return [];
        return TitleService.evaluate(hero);
    }

    getAllTitles() {
        return TitleService.getAllTitles();
    }
}
