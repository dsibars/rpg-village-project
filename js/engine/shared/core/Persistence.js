const DEBUG = false;

export class Persistence {
    constructor(basePrefix = 'rpg_village_v1_') {
        this.basePrefix = basePrefix;
        this.slotIndex = null;        // null = global mode (no slot prefix)
    }

    setSlot(index) {
        if (index !== null && (index < 0 || index > 9)) {
            throw new Error(`Invalid slot index: ${index}. Must be 0..9.`);
        }
        this.slotIndex = index;
    }

    clearSlot() {
        this.slotIndex = null;
    }

    _prefix() {
        if (this.slotIndex === null) return this.basePrefix;
        return `${this.basePrefix}slot${this.slotIndex}_`;
    }

    _key(key) {
        return `${this._prefix()}${key}`;
    }

    save(key, data) {
        try {
            const serialized = JSON.stringify(data);
            localStorage.setItem(this._key(key), serialized);
            return true;
        } catch (e) {
            if (DEBUG) console.error(`Engine Persistence: Failed to save ${key}`, e);
            return false;
        }
    }

    load(key, defaultValue = null) {
        try {
            const fullKey = this._key(key);
            const serialized = localStorage.getItem(fullKey);
            if (DEBUG) console.log(`Persistence: Loading ${fullKey}`, serialized ? 'FOUND' : 'NOT FOUND');
            if (serialized === null) return defaultValue;
            return JSON.parse(serialized);
        } catch (e) {
            if (DEBUG) console.error(`Engine Persistence: Failed to load ${key}`, e);
            return defaultValue;
        }
    }

    remove(key) {
        localStorage.removeItem(this._key(key));
    }

    clear() {
        const prefix = this._prefix();
        if (DEBUG) console.warn(`Persistence: CLEARING ALL DATA with prefix ${prefix}`);
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(prefix)) {
                if (DEBUG) console.log(`Persistence: Removing ${key}`);
                localStorage.removeItem(key);
            }
        });
    }

    clearAll() {
        if (DEBUG) console.warn(`Persistence: CLEARING ALL DATA with base prefix ${this.basePrefix}`);
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(this.basePrefix)) {
                if (DEBUG) console.log(`Persistence: Removing ${key}`);
                localStorage.removeItem(key);
            }
        });
        // Cleanup legacy raw keys that bypassed the prefix
        localStorage.removeItem('academy_designs');
    }
}

export const persistence = new Persistence();          // slot-aware (gameplay state)
export const globalPersistence = new Persistence();    // always global (settings, registry)
