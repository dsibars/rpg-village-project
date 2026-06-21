import { persistence } from '../core/Persistence.js';

/**
 * ChronicleService - Records important events in a persistent log.
 * The chronicle is a readable history of the village's journey.
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
        if (saved) return saved;
        return {
            entries: [],
            milestones: new Set()
        };
    }

    /**
     * Record a new chronicle entry.
     */
    recordEntry(day, category, title, description, metadata = {}) {
        const entry = {
            id: `chronicle_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            day,
            category, // 'expedition', 'village', 'combat', 'hero', 'event', 'milestone'
            title,
            description,
            timestamp: Date.now(),
            ...metadata
        };

        this.state.entries.push(entry);

        // Keep last 500 entries to prevent unbounded growth
        if (this.state.entries.length > 500) {
            this.state.entries = this.state.entries.slice(-500);
        }

        this.save();
        return entry;
    }

    /**
     * Get entries, optionally filtered by category or day range.
     */
    getEntries(options = {}) {
        let entries = [...this.state.entries].reverse();

        if (options.category) {
            entries = entries.filter(e => e.category === options.category);
        }

        if (options.dayMin !== undefined) {
            entries = entries.filter(e => e.day >= options.dayMin);
        }

        if (options.dayMax !== undefined) {
            entries = entries.filter(e => e.day <= options.dayMax);
        }

        if (options.limit) {
            entries = entries.slice(0, options.limit);
        }

        return entries;
    }

    /**
     * Record a milestone (prevents duplicates).
     */
    recordMilestone(day, milestoneId, title, description) {
        if (this.state.milestones.has(milestoneId)) return null;

        this.state.milestones.add(milestoneId);
        return this.recordEntry(day, 'milestone', title, description, { milestoneId });
    }

    /**
     * Check if a milestone was already recorded.
     */
    hasMilestone(milestoneId) {
        return this.state.milestones.has(milestoneId);
    }

    /**
     * Get summary statistics.
     */
    getStats() {
        const categories = {};
        this.state.entries.forEach(e => {
            categories[e.category] = (categories[e.category] || 0) + 1;
        });

        return {
            totalEntries: this.state.entries.length,
            categories,
            milestones: Array.from(this.state.milestones)
        };
    }

    /**
     * Clear all entries (for debugging/testing).
     */
    clear() {
        this.state.entries = [];
        this.state.milestones.clear();
        this.save();
    }
}
