import { Result } from '../../shared/core/Result.js';
import { Hero } from '../models/Hero.js';
import { persistence } from '../../shared/core/Persistence.js';
import { GLYPH_TABLET_DATA } from '../../shared/data/InventoryData.js';


export class HeroService {
    constructor(inventoryService, options = {}) {
        this.STORAGE_KEY = 'heroes_data';
        this.inventory = inventoryService;
        this.heroes = [];
        if (!options.deferLoad) {
            this.load();
        }
    }

    load() {
        const data = persistence.load(this.STORAGE_KEY, []);
        this.heroes = data.map(h => {
            const hero = new Hero(h);
            hero.recalculateStats({});
            return hero;
        });
    }

    saveAll() {
        persistence.save(this.STORAGE_KEY, this.heroes.map(h => h.toJSON()));
    }

    get(id) {
        return this.heroes.find(h => h.id === id) || null;
    }

    list(status = null) {
        if (status) {
            return this.heroes.filter(h => h.status === status);
        }
        return [...this.heroes];
    }

    static HERO_NAMES = ['Elena', 'Thorne', 'Mira', 'Gareth', 'Lila', 'Doran', 'Sera', 'Kael', 'Nora', 'Finn', 'Aria', 'Bran', 'Cora', 'Dante', 'Elara'];
    static HERO_ORIGINS = [
        'origin_warrior', 'origin_thief', 'origin_clown', 'origin_farmer',
        'origin_monk', 'origin_cook', 'origin_guard', 'origin_poet', 'origin_arcane_initiate'
    ];

    generateRandomHero() {
        const name = HeroService.HERO_NAMES[Math.floor(Math.random() * HeroService.HERO_NAMES.length)];
        const origin = HeroService.HERO_ORIGINS[Math.floor(Math.random() * HeroService.HERO_ORIGINS.length)];
        return this.add({ name, origin, level: 1, statPoints: 5 });
    }

    add(heroData) {
        const newHero = new Hero(heroData);
        // For MVP, we pass empty village upgrades
        newHero.recalculateStats({});
        this.heroes.push(newHero);
        this.saveAll();
        return Result.ok(newHero);
    }

    remove(id) {
        const index = this.heroes.findIndex(h => h.id === id);
        if (index !== -1) {
            const removed = this.heroes.splice(index, 1);
            this.saveAll();
            return Result.ok(removed[0]);
        }
        return Result.fail('heroes_error_hero_not_found');
    }

    setStatus(id, status) {
        const hero = this.get(id);
        if (!hero) return Result.fail('heroes_error_hero_not_found');

        hero.status = status;
        this.saveAll();
        return Result.ok(hero);
    }

    increaseHeroStat(heroId, statId) {
        const hero = this.get(heroId);
        if (!hero) return Result.fail('heroes_error_hero_not_found');

        const result = hero.increaseStat(statId);
        if (result.success) {
            hero.recalculateStats({});
            this.saveAll();
        }
        return result;
    }

    tickAllMealBuffs() {
        let anyChanged = false;
        this.heroes.forEach(hero => {
            if (hero.tickMealBuffs()) {
                anyChanged = true;
            }
        });
        if (anyChanged) {
            this.saveAll();
        }
        return anyChanged;
    }

    learnHeroFamily(heroId, familyId) {
        const hero = this.get(heroId);
        if (!hero) return Result.fail('heroes_error_hero_not_found');

        const result = hero.learnFamily(familyId);
        if (result.success) this.saveAll();
        return result;
    }

    inscribeHeroBodyCircle(heroId, glyphIds, glyphTiers) {
        const hero = this.get(heroId);
        if (!hero) return Result.fail('heroes_error_hero_not_found');

        const result = hero.inscribeBodyCircle(glyphIds, glyphTiers);
        if (result.success) this.saveAll();
        return result;
    }

    inscribeHeroSpell(heroId, spell) {
        const hero = this.get(heroId);
        if (!hero) return Result.fail('heroes_error_hero_not_found');

        const result = hero.inscribeSpell(spell);
        if (result.success) this.saveAll();
        return result;
    }

    eraseHeroBodyCircle(heroId) {
        const hero = this.get(heroId);
        if (!hero) return Result.fail('heroes_error_hero_not_found');

        const result = hero.eraseBodyCircle();
        if (result.success) this.saveAll();
        return result;
    }

    addHeroGambit(heroId, gambit) {
        const hero = this.get(heroId);
        if (!hero) return Result.fail('heroes_error_hero_not_found');

        const result = hero.addGambit(gambit);
        if (result.success) this.saveAll();
        return result;
    }

    removeHeroGambit(heroId, gambitId) {
        const hero = this.get(heroId);
        if (!hero) return Result.fail('heroes_error_hero_not_found');

        const result = hero.removeGambit(gambitId);
        if (result.success) this.saveAll();
        return result;
    }

    toggleHeroGambit(heroId, gambitId) {
        const hero = this.get(heroId);
        if (!hero) return Result.fail('heroes_error_hero_not_found');

        const result = hero.toggleGambit(gambitId);
        if (result.success) this.saveAll();
        return result;
    }

    moveHeroGambit(heroId, gambitId, direction) {
        const hero = this.get(heroId);
        if (!hero) return Result.fail('heroes_error_hero_not_found');

        const result = hero.moveGambit(gambitId, direction);
        if (result.success) this.saveAll();
        return result;
    }

    // --- Equipment ---
    equipItem(heroId, slot, equipmentId) {
        const hero = this.get(heroId);
        if (!hero) return Result.fail('heroes_error_hero_not_found');

        if (!this.inventory) return Result.fail('heroes_error_inventory_not_linked');
        
        const item = this.inventory.getEquipment(equipmentId);
        if (!item) return Result.fail('heroes_error_item_not_found');

        // Validation
        if (item.type === 'weapon') {
            if (slot !== 'leftHand' && slot !== 'rightHand') return Result.fail('heroes_error_slot_invalid');
        } else if (item.type === 'armor') {
            if (slot !== item.slot) return Result.fail('heroes_error_slot_invalid');
        } else {
            return Result.fail('heroes_error_item_type_invalid');
        }

        // Unequip current if exists
        if (hero.equipment[slot]) {
            this.unequipItem(heroId, slot);
        }

        // Move item from inventory to hero
        hero.equipment[slot] = item.toJSON();
        this.inventory.removeEquipment(equipmentId);

        // Update stats
        hero.recalculateStats({});
        this.saveAll();
        return Result.ok(hero);
    }

    unequipItem(heroId, slot) {
        const hero = this.get(heroId);
        if (!hero) return Result.fail('heroes_error_hero_not_found');

        if (!this.inventory) return Result.fail('heroes_error_inventory_not_linked');

        const itemData = hero.equipment[slot];
        if (!itemData) return Result.fail('heroes_error_slot_empty');

        hero.equipment[slot] = null;
        this.inventory.addEquipment(itemData);

        hero.recalculateStats({});
        this.saveAll();
        return Result.ok(hero);
    }

    useGlyphTablet(heroId, tabletId) {
        const hero = this.get(heroId);
        if (!hero) return Result.fail('heroes_error_hero_not_found');

        const tabletData = GLYPH_TABLET_DATA[tabletId];
        if (!tabletData) return Result.fail('heroes_error_item_type_invalid');

        // Check hero already knows glyph
        if (hero.knownGlyphs && hero.knownGlyphs.includes(tabletData.glyphId)) {
            return Result.fail('heroes_error_glyph_already_known');
        }

        // Check inventory has tablet
        const hasTablet = this.inventory.getItemCount(tabletId) > 0;
        if (!hasTablet) return Result.fail('inventory_error_item_not_enough');

        // Consume tablet
        const useResult = this.inventory.useItem(tabletId, 1);
        if (!useResult.success) return useResult;

        // Learn glyph
        const learnResult = hero.learnGlyph(tabletData.glyphId);
        if (!learnResult.success) {
            // Refund tablet on learn failure
            this.inventory.addItem(tabletId, 1);
            return learnResult;
        }

        this.saveAll();
        return Result.ok({ heroId, glyphId: tabletData.glyphId, tier: tabletData.tier });
    }
}

