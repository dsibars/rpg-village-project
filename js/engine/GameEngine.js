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
import { persistence, globalPersistence } from './shared/core/Persistence.js';
const DEBUG = false;

import { i18n } from './shared/core/i18n/I18nService.js';
import { Result } from './shared/core/Result.js';
import { getRefineCost, MEAL_RECIPES, SKILLS_DATA } from './shared/data/GameConstants.js';
import { MagicCircleService } from './magic_circle/MagicCircleService.js';
import { TrainerService } from './trainer/TrainerService.js';
import { WitchService } from './witch/WitchService.js';
import { getEquipmentStats } from './shared/inventory/EquipmentService.js';
import { getWeaponBaseCost, getArmorBaseCost } from './shared/data/ShopCatalog.js';

export class GameEngine {
    constructor() {
        this.STORAGE_KEY = 'village_state';

        // Initialize Services (wire only, no data loading)
        this.inventoryService = new InventoryService({ deferLoad: true });
        this.villageService = new VillageService(this.inventoryService, { deferLoad: true });
        this.heroService = new HeroService(this.inventoryService, { deferLoad: true });
        this.battleService = new BattleService(this.inventoryService, { deferLoad: true });
        this.expeditionService = new ExpeditionService(
            this.battleService, 
            this.heroService, 
            this.villageService, 
            this.inventoryService,
            { deferLoad: true }
        );
        this.dailyObjectivesService = new DailyObjectivesService(this.inventoryService, { deferLoad: true });
        this.calendarService = new CalendarService(this.villageService, this.heroService, { deferLoad: true });
        this.academyService = new AcademyService(this.heroService, this.villageService, { deferLoad: true });
        this.unlockService = new UnlockService({ deferLoad: true });
        this.i18n = i18n;
        this.isNewGame = true;
    }

    initialize() {
        // Hydrate all services from persistence (active slot prefix applies here)
        this.inventoryService.load();
        this.villageService.load();
        this.heroService.load();
        this.battleService.load();
        this.expeditionService.load();
        this.dailyObjectivesService.load();
        this.calendarService.load();
        this.academyService.load();
        this.unlockService.load();

        const hasHeroes = this.heroService.list().length > 0;
        const hasVillage = this.villageService.getState().day !== undefined;
        
        this.isNewGame = !hasHeroes || !hasVillage;
        if (DEBUG) console.log('Engine: checkNewGame?', this.isNewGame, { hasHeroes, hasVillage });
        
        if (this.isNewGame) {
            this.initNewGame();
        }

        this.i18n.setLanguage(globalPersistence.load('settings_lang', 'en'));

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

    testHeroGambits(heroId, enemiesOverride = null) {
        const hero = this.heroService.get(heroId);
        if (!hero) return Result.fail('error_hero_not_found');
        
        let enemies = [];
        const scenarioId = 'reg_greenfields';
        
        if (Array.isArray(enemiesOverride) && enemiesOverride.length > 0) {
            const enemyCounts = {};
            enemiesOverride.forEach(e => {
                enemyCounts[e.templateId] = (enemyCounts[e.templateId] || 0) + 1;
            });
            const enemyIndices = {};
            enemies = enemiesOverride.map((e, idx) => {
                const enemy = this.expeditionService._createEnemy(e.templateId, false, e.level);
                if (enemyCounts[e.templateId] > 1) {
                    enemyIndices[e.templateId] = (enemyIndices[e.templateId] || 0) + 1;
                    const suffix = String.fromCharCode(64 + enemyIndices[e.templateId]);
                    enemy.name = `${enemy.name} ${suffix}`;
                }
                enemy.id = `${e.templateId}_${idx}_${Date.now()}`;
                return enemy;
            });
        } else {
            // Get enemy pool for the scenario region
            const enemyPool = this.expeditionService?.getEnemyPoolForRegion?.(scenarioId) || [];
            if (enemyPool.length === 0) {
                // Fall back if pool is empty
                enemies = [this.expeditionService._createEnemy('slime_green', false, hero.level)];
            } else {
                // Build encounter: 1-3 enemies based on region difficulty
                const encounterCount = Math.min(3, Math.max(1, Math.floor(Math.random() * 3) + 1));
                for (let i = 0; i < encounterCount; i++) {
                    const template = enemyPool[Math.floor(Math.random() * enemyPool.length)];
                    enemies.push({ ...template, id: template.id + '_' + i });
                }
            }
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

    getEquipmentStats(item) {
        return getEquipmentStats(item);
    }

    getSellPrice(item) {
        if (!item) return 0;
        if (item.type === 'consumable') {
            return Math.floor((item.basePrice || 0) * 0.3);
        }
        if (item.type === 'equipment' || item.type === 'weapon' || item.type === 'armor') {
            let baseCost = 0;
            if (item.type === 'weapon') {
                baseCost = getWeaponBaseCost(item.material, item.family);
            } else {
                baseCost = getArmorBaseCost(item.material, item.archetype, item.slot);
            }
            const level = item.level || 0;
            return Math.floor(baseCost * 0.3 * Math.pow(1.1, level));
        }
        return 0;
    }

    getRecruitCost() {
        const heroCount = this.heroService.list().length;
        const baseCost = 100;
        return Math.floor(baseCost * Math.pow(1.2, heroCount));
    }

    canCastSpell(hero, spell) {
        if (!spell || !hero) return false;
        if ((hero.mp || 0) < spell.mpCost) return false;
        const maxSlots = Math.max(1, Math.min(25, hero.magicTier || 1));
        if ((spell.glyphIds || []).length > maxSlots) return false;
        return true;
    }

    getSkillCost(hero, familyId, tier) {
        const skillData = SKILLS_DATA[familyId];
        if (!skillData || !hero) return { staCost: 0, mpCost: 0 };
        const staCost = skillData.staminaCostBase + skillData.staminaCostPerTier * ((tier || 1) - 1);
        const mpCost = hero.hybridMpCost || 0;
        return { staCost, mpCost };
    }

    canAffordSkill(hero, familyId, tier) {
        const { staCost, mpCost } = this.getSkillCost(hero, familyId, tier);
        const canAffordSta = (hero.stamina || 0) >= staCost;
        const canAffordMp = mpCost <= 0 || (hero.mp || 0) >= mpCost;
        return canAffordSta && canAffordMp;
    }

    getSkillTargetType(familyId) {
        const skillData = SKILLS_DATA[familyId];
        return skillData ? skillData.targetType : 'single_enemy';
    }

    calculateHybridMpCost(glyphIds, glyphTiers, magicTier) {
        if (!glyphIds || glyphIds.length === 0) return 0;
        const hasCore = glyphIds.some(gid => gid.startsWith('glyph_core_'));
        if (!hasCore) return 0;
        let base = 8;
        for (const gid of glyphIds) {
            const tier = glyphTiers?.[gid] || 1;
            switch (gid) {
                case 'glyph_potentiate': base += 2 * tier; break;
                case 'glyph_multi': base += 5; break;
                case 'glyph_pierce': base += 3; break;
                case 'glyph_leech': base += 2; break;
                case 'glyph_focus': base += 2; break;
            }
        }
        return Math.floor(base * (1 + (magicTier || 1) / 20));
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

    getMagicCircleSlotCount(magicTier) {
        return MagicCircleService.getSlotCount(magicTier);
    }

    getGlyphSymbol(tier) {
        return MagicCircleService.getGlyphSymbol(tier);
    }

    composeSpell(glyphIds, glyphTiers, customName) {
        return MagicCircleService.compose(glyphIds, glyphTiers, customName);
    }

    buildGambit(conditionRaw, actionRaw, target, tier, spellCodex) {
        const [actionType, actionId] = actionRaw.split(':');

        const conditionMap = {
            'ALLY_HP_LT_50': { type: 'ally_hp', operator: '<', value: 0.5 },
            'ALLY_HP_LT_25': { type: 'ally_hp', operator: '<', value: 0.25 },
            'SELF_HP_LT_50': { type: 'self_hp', operator: '<', value: 0.5 },
            'SELF_MP_LT_25': { type: 'self_mp', operator: '<', value: 0.25 },
            'ANY_ENEMY': { type: 'always', value: true },
            'ENEMY_COUNT_GT_2': { type: 'enemy_count', operator: '>', value: 2 }
        };
        const condition = conditionMap[conditionRaw] || { type: 'always', value: true };

        let payload = actionId;
        let actionTier = undefined;
        if (actionType === 'tech') {
            actionTier = tier || 1;
        } else if (actionType === 'spell') {
            const spellIdx = parseInt(actionId, 10);
            const spell = spellCodex?.[spellIdx];
            payload = spell ? spell.name : actionId;
        }

        return {
            id: 'gambit_v1_' + Date.now(),
            conditions: [{ op: 'SINGLE', left: condition, right: null }],
            action: {
                type: actionType === 'tech' ? 'skill' : actionType,
                payload: payload,
                ...(actionTier !== undefined ? { tier: actionTier } : {})
            },
            target: target,
            enabled: true
        };
    }

    getTrainerDialogue(hero) {
        return TrainerService.getDialogue(hero, this.i18n);
    }

    getWitchDialogue(hero, currentDay) {
        return WitchService.getDialogue(hero, this.i18n, currentDay);
    }

    recordWitchVisit(hero, currentDay) {
        return WitchService.recordVisit(hero, currentDay);
    }

    getCompatibleTargets(innateTargetType) {
        const compatibility = {
            'single_enemy': ['weakest_enemy', 'strongest_enemy', 'lowest_hp_enemy', 'highest_hp_enemy', 'random_enemy'],
            'enemy_splash': ['weakest_enemy', 'strongest_enemy', 'lowest_hp_enemy', 'highest_hp_enemy', 'random_enemy'],
            'all_enemies': ['all_enemies'],
            'single_ally': ['weakest_ally', 'strongest_ally', 'lowest_hp_ally', 'highest_hp_ally', 'random_ally', 'self'],
            'all_allies': ['all_allies'],
            'self': ['self'],
            'none': []
        };
        return compatibility[innateTargetType] || [];
    }

    getCurrentSlotIndex() {
        return persistence.slotIndex !== null ? persistence.slotIndex : 0;
    }

    wipeCurrentSlot() {
        persistence.clear();
        return Result.ok();
    }

    wipeAllSlots() {
        persistence.clearAll();
        return Result.ok();
    }
}
