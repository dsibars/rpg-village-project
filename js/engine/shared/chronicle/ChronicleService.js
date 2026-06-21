import { persistence } from '../core/Persistence.js';

/**
 * ChronicleService — Achievement/index catalog with Book links.
 *
 * The Chronicle no longer stores narrative text. It tracks what major
 * events and milestones the player has unlocked, with references to
 * where each entry is narrated in the Book.
 */
export class ChronicleService {
    constructor() {
        this.STORAGE_KEY = 'chronicle_state';
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
        if (saved) {
            // Migration: old plain-text entries are discarded on first load.
            // Only the catalog format is kept.
            if (saved.catalog) return saved;
            // Old format: clear it
            return this._createEmptyState();
        }
        return this._createEmptyState();
    }

    _createEmptyState() {
        return {
            catalog: [],
            milestones: new Set()
        };
    }

    /**
     * Register a catalog entry (idempotent).
     * Used at init time to register all possible achievements.
     */
    registerEntry(entry) {
        const exists = this.state.catalog.find(e => e.id === entry.id);
        if (exists) return exists;

        const newEntry = {
            id: entry.id,
            labelKey: entry.labelKey,
            requirementKey: entry.requirementKey,
            category: entry.category, // 'milestone' | 'unlock' | 'event'
            status: 'locked',
            dayUnlocked: null,
            bookLink: null,
            ...entry
        };

        this.state.catalog.push(newEntry);
        this.save();
        return newEntry;
    }

    /**
     * Bulk-register entries from a catalog source (e.g., PresentationCatalog).
     */
    registerEntriesFromCatalog(catalog) {
        for (const item of catalog) {
            this.registerEntry(item);
        }
    }

    /**
     * Unlock an entry and record its Book link.
     */
    unlockEntry(chronicleId, day, bookLink = null) {
        const entry = this.state.catalog.find(e => e.id === chronicleId);
        if (!entry) return null;
        if (entry.status === 'unlocked') return entry;

        entry.status = 'unlocked';
        entry.dayUnlocked = day;
        if (bookLink) {
            entry.bookLink = bookLink;
        }

        this.save();
        return entry;
    }

    /**
     * Set an entry to pending (requirements met but not yet viewed).
     */
    setPending(chronicleId) {
        const entry = this.state.catalog.find(e => e.id === chronicleId);
        if (!entry || entry.status === 'unlocked') return null;

        entry.status = 'pending';
        this.save();
        return entry;
    }

    /**
     * Record a milestone (prevents duplicates).
     */
    recordMilestone(milestoneId) {
        if (this.state.milestones.has(milestoneId)) return false;
        this.state.milestones.add(milestoneId);
        this.save();
        return true;
    }

    /**
     * Check if a milestone was already recorded.
     */
    hasMilestone(milestoneId) {
        return this.state.milestones.has(milestoneId);
    }

    /**
     * Get a single entry by id.
     */
    getEntry(chronicleId) {
        return this.state.catalog.find(e => e.id === chronicleId) || null;
    }

    /**
     * Get entries, optionally filtered.
     */
    getEntries(options = {}) {
        let entries = [...this.state.catalog];

        if (options.category) {
            entries = entries.filter(e => e.category === options.category);
        }

        if (options.status) {
            entries = entries.filter(e => e.status === options.status);
        }

        if (options.dayMin !== undefined) {
            entries = entries.filter(e => (e.dayUnlocked || 0) >= options.dayMin);
        }

        if (options.dayMax !== undefined) {
            entries = entries.filter(e => (e.dayUnlocked || 0) <= options.dayMax);
        }

        if (options.limit) {
            entries = entries.slice(0, options.limit);
        }

        return entries;
    }

    /**
     * Get summary statistics.
     */
    getStats() {
        const byCategory = {};
        const byStatus = {};

        this.state.catalog.forEach(e => {
            byCategory[e.category] = (byCategory[e.category] || 0) + 1;
            byStatus[e.status] = (byStatus[e.status] || 0) + 1;
        });

        return {
            totalEntries: this.state.catalog.length,
            byCategory,
            byStatus,
            milestones: Array.from(this.state.milestones)
        };
    }

    /**
     * Update the Book link for an already-unlocked entry.
     */
    updateBookLink(chronicleId, bookLink) {
        const entry = this.state.catalog.find(e => e.id === chronicleId);
        if (!entry) return null;
        entry.bookLink = bookLink;
        this.save();
        return entry;
    }

    /**
     * Clear all entries (for debugging/testing).
     */
    clear() {
        this.state.catalog = [];
        this.state.milestones.clear();
        this.save();
    }
}
