import { WEAPONS_CATALOG, ARMOR_CATALOG, CONSUMABLES_CATALOG } from '../shared/data/ShopCatalog.js';
import { persistence } from '../shared/core/Persistence.js';

/**
 * MarketService - Weekly rotating shop stock.
 *
 * Stock refreshes every 7 days. Not all catalog items are available at once.
 * Higher-tier items appear less frequently. Consumables are always available.
 *
 * Stock is deterministic: same village day + same seed = same stock.
 * This means save/load preserves the exact weekly stock.
 */
export class MarketService {
    constructor(options = {}) {
        this.STORAGE_KEY = 'market_state';
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
            lastWeek: 0,
            weekSeed: Math.floor(Math.random() * 1000000),
            stock: null
        };
    }

    /**
     * Get current stock for the given village day and blacksmith level.
     * Automatically refreshes if a new week has started.
     */
    getStock(villageDay, blacksmithLevel = 0) {
        const currentWeek = Math.floor(villageDay / 7);

        // Refresh stock if week changed or no stock cached
        if (currentWeek !== this.state.lastWeek || !this.state.stock) {
            this.state.lastWeek = currentWeek;
            this.state.weekSeed = this._hashSeed(currentWeek, villageDay);
            this.state.stock = this._generateStock(blacksmithLevel, this.state.weekSeed);
            this.save();
        }

        return this.state.stock;
    }

    /**
     * Force a stock refresh (e.g., for a reroll mechanic).
     */
    rerollStock(villageDay, blacksmithLevel = 0) {
        const currentWeek = Math.floor(villageDay / 7);
        this.state.lastWeek = currentWeek;
        this.state.weekSeed = Math.floor(Math.random() * 1000000);
        this.state.stock = this._generateStock(blacksmithLevel, this.state.weekSeed);
        this.save();
        return this.state.stock;
    }

    /**
     * Deterministic hash from week number and base seed.
     */
    _hashSeed(week, villageDay) {
        let hash = week * 374761393 + villageDay * 668265263;
        hash = (hash ^ (hash >> 13)) * 1274126177;
        hash = hash ^ (hash >> 16);
        return Math.abs(hash) % 1000000;
    }

    /**
     * Seeded random generator.
     */
    _seededRandom(seed) {
        const x = Math.sin(seed * 9999) * 10000;
        return x - Math.floor(x);
    }

    _nextSeed(seed) {
        return (seed * 16807 + 0) % 2147483647;
    }

    /**
     * Generate stock for the week based on blacksmith level and seed.
     */
    _generateStock(blacksmithLevel, seed) {
        let s = seed;

        const maxTier = this._getMaxTier(blacksmithLevel);

        // Consumables: always available, but quantity varies
        const consumables = CONSUMABLES_CATALOG.map(item => {
            s = this._nextSeed(s);
            const maxQty = 3 + Math.floor(this._seededRandom(s) * 5); // 3-7
            return { ...item, maxQuantity: maxQty, availableQty: maxQty };
        });

        // Weapons: subset available, weighted by tier
        const availableWeapons = WEAPONS_CATALOG.filter(w => w.tier <= maxTier);
        const weaponCount = Math.max(2, Math.min(availableWeapons.length, 2 + Math.floor(maxTier * 1.5)));
        const weapons = this._pickItems(availableWeapons, weaponCount, s);
        s = weapons._nextSeed;

        // Armor: subset per slot
        const availableArmor = ARMOR_CATALOG.filter(a => a.tier <= maxTier);
        const armorPerSlot = Math.max(1, Math.min(3, Math.floor(maxTier / 2) + 1));

        const headArmor = this._pickItems(availableArmor.filter(a => a.slot === 'head'), armorPerSlot, s);
        s = headArmor._nextSeed;
        const bodyArmor = this._pickItems(availableArmor.filter(a => a.slot === 'body'), armorPerSlot, s);
        s = bodyArmor._nextSeed;
        const legsArmor = this._pickItems(availableArmor.filter(a => a.slot === 'legs'), armorPerSlot, s);
        s = legsArmor._nextSeed;
        const shieldArmor = this._pickItems(availableArmor.filter(a => a.slot === 'rightHand'), armorPerSlot, s);
        s = shieldArmor._nextSeed;

        // Specials: random discount on 1-2 items per week
        const allItems = [...consumables, ...weapons.items, ...headArmor.items, ...bodyArmor.items, ...legsArmor.items, ...shieldArmor.items];
        const specialCount = Math.floor(this._seededRandom(s) * 2) + 1;
        s = this._nextSeed(s);
        const specials = this._pickItems(allItems, specialCount, s).items.map(item => ({
            ...item,
            discount: 0.15 + Math.floor(this._seededRandom(s) * 3) * 0.10, // 15%, 25%, 35%
            isSpecial: true
        }));
        s = this._nextSeed(s);

        return {
            consumables,
            weapons: weapons.items,
            headArmor: headArmor.items,
            bodyArmor: bodyArmor.items,
            legsArmor: legsArmor.items,
            shieldArmor: shieldArmor.items,
            specials,
            week: this.state.lastWeek,
            refreshDay: (this.state.lastWeek + 1) * 7
        };
    }

    _getMaxTier(blacksmithLevel) {
        if (blacksmithLevel >= 7) return 5;
        if (blacksmithLevel >= 5) return 4;
        if (blacksmithLevel >= 3) return 3;
        if (blacksmithLevel >= 1) return 2;
        return 1;
    }

    _pickItems(pool, count, seed) {
        let s = seed;
        const items = [];
        const available = [...pool];

        for (let i = 0; i < count && available.length > 0; i++) {
            s = this._nextSeed(s);
            const idx = Math.floor(this._seededRandom(s) * available.length);
            items.push({ ...available[idx], availableQty: 1 });
            available.splice(idx, 1);
        }

        return { items, _nextSeed: s };
    }
}
