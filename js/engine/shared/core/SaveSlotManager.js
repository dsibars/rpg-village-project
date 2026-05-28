import { globalPersistence } from './Persistence.js';

export class SaveSlotManager {
    static REGISTRY_KEY = 'save_slots_metadata';
    static MAX_SLOTS = 10;

    constructor() {
        this.persistence = globalPersistence;
        this.registry = this._loadRegistry();
        this._migrateIfNeeded();
    }

    listSlots() {
        return this.registry.map(meta => ({ ...meta }));
    }

    createSlot(index) {
        this.registry[index] = {
            slotIndex: index,
            exists: true,
            createdAt: new Date().toISOString(),
            lastPlayedAt: new Date().toISOString()
        };
        this._saveRegistry();
    }

    touchSlot(index) {
        if (this.registry[index] && this.registry[index].exists) {
            this.registry[index].lastPlayedAt = new Date().toISOString();
            this._saveRegistry();
        }
    }

    deleteSlot(index) {
        const slotPrefix = `rpg_village_v1_slot${index}_`;
        Object.keys(localStorage)
            .filter(k => k.startsWith(slotPrefix))
            .forEach(k => localStorage.removeItem(k));

        this.registry[index] = {
            slotIndex: index,
            exists: false,
            createdAt: null,
            lastPlayedAt: null
        };
        this._saveRegistry();
    }

    getSlotSummary(index) {
        const prefix = `rpg_village_v1_slot${index}_`;

        let village = {};
        let heroes = [];
        let exp = {};

        try {
            const v = localStorage.getItem(prefix + 'village_state');
            if (v) village = JSON.parse(v);
        } catch (e) { /* corrupted */ }

        try {
            const h = localStorage.getItem(prefix + 'heroes_data');
            if (h) heroes = JSON.parse(h);
        } catch (e) { /* corrupted */ }

        try {
            const e = localStorage.getItem(prefix + 'expedition_state');
            if (e) exp = JSON.parse(e);
        } catch (e) { /* corrupted */ }

        // Validate: if no village day and no heroes, treat as empty
        if (!village.day && heroes.length === 0) return null;

        const heroLevels = heroes.map(h => h.level || 1);
        const highestLevel = heroLevels.length > 0 ? Math.max(...heroLevels) : 0;
        const averageLevel = heroLevels.length > 0
            ? Math.round(heroLevels.reduce((a, b) => a + b, 0) / heroLevels.length)
            : 0;

        return {
            day: village.day || 0,
            gold: village.gold || 0,
            heroes: {
                count: heroes.length,
                highestLevel,
                averageLevel
            },
            village: {
                population: village.population || 0,
                buildingsCompleted: village.infrastructure
                    ? Object.values(village.infrastructure).filter(l => l > 0).length
                    : 0
            },
            expeditions: {
                completed: exp.completedIds?.length || 0,
                regionsUnlocked: Object.values(exp.regions || {}).filter(r => r.unlocked).length,
                activeExpeditions: exp.activeExpeditions?.length || 0
            }
        };
    }

    formatLastPlayed(isoString) {
        if (!isoString) return '';
        const date = new Date(isoString);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
    }

    _loadRegistry() {
        const loaded = this.persistence.load(SaveSlotManager.REGISTRY_KEY, null);
        if (loaded && Array.isArray(loaded) && loaded.length === SaveSlotManager.MAX_SLOTS) {
            return loaded;
        }
        return Array.from({ length: SaveSlotManager.MAX_SLOTS }, (_, i) => ({
            slotIndex: i,
            exists: false,
            createdAt: null,
            lastPlayedAt: null
        }));
    }

    _saveRegistry() {
        this.persistence.save(SaveSlotManager.REGISTRY_KEY, this.registry);
    }

    _migrateIfNeeded() {
        const hasLegacy = localStorage.getItem('rpg_village_v1_village_state') !== null;
        const hasRegistry = this.persistence.load(SaveSlotManager.REGISTRY_KEY, null) !== null;

        if (hasLegacy && !hasRegistry) {
            const legacyPrefix = 'rpg_village_v1_';
            const slot0Prefix = 'rpg_village_v1_slot0_';

            // Migrate ALL keys under base prefix that aren't already slot-prefixed
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(legacyPrefix) && !key.includes('_slot')) {
                    const shortKey = key.slice(legacyPrefix.length);
                    localStorage.setItem(slot0Prefix + shortKey, localStorage.getItem(key));
                    localStorage.removeItem(key);
                }
            });

            this.registry[0] = {
                slotIndex: 0,
                exists: true,
                createdAt: new Date().toISOString(),
                lastPlayedAt: new Date().toISOString()
            };
            this._saveRegistry();
        }
    }
}
