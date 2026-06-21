/**
 * BookSectionCatalog — Defines the four section categories and five
 * PageContentSection (PCS) rendering types with their default weights.
 */

export const BOOK_SECTION_CATEGORIES = {
    HISTORY_EVENT: 'history_event',
    CHAPTER_HISTORY_EVENT: 'chapter_history_event',
    MILESTONE: 'milestone',
    VILLAGE_UPDATES: 'village_updates',
};

export const PCS_TYPES = {
    CHAPTER_TITLE: 'chapter_title',
    HISTORY_BLOCK: 'history_block',
    MILESTONE: 'milestone',
    VILLAGE_UPDATE_TITLE: 'village_update_title',
    VILLAGE_UPDATE_BULLET: 'village_update_bullet',
};

export const DEFAULT_PAGE_BUDGET = 10;

const PCS_TYPE_CONFIG = {
    [PCS_TYPES.CHAPTER_TITLE]: {
        defaultWeight: 2,
        splittable: false,
        autoOpen: false, // chapter title itself doesn't auto-open; the chapter event does
    },
    [PCS_TYPES.HISTORY_BLOCK]: {
        defaultWeight: 6,
        splittable: true,
        autoOpen: true,
    },
    [PCS_TYPES.MILESTONE]: {
        defaultWeight: 4,
        splittable: false,
        autoOpen: true,
    },
    [PCS_TYPES.VILLAGE_UPDATE_TITLE]: {
        defaultWeight: 2,
        splittable: false,
        autoOpen: false,
    },
    [PCS_TYPES.VILLAGE_UPDATE_BULLET]: {
        defaultWeight: 1,
        splittable: true,
        autoOpen: false,
    },
};

/**
 * Get the configuration for a PCS type.
 */
export function getPcsTypeConfig(type) {
    return PCS_TYPE_CONFIG[type] || null;
}

/**
 * Get the default weight for a PCS type.
 */
export function getPcsDefaultWeight(type) {
    const config = PCS_TYPE_CONFIG[type];
    return config ? config.defaultWeight : 0;
}

/**
 * Check if a PCS type is splittable across pages.
 */
export function isPcsSplittable(type) {
    const config = PCS_TYPE_CONFIG[type];
    return config ? config.splittable : false;
}

/**
 * Check if a PCS type triggers auto-open.
 */
export function isPcsAutoOpen(type) {
    const config = PCS_TYPE_CONFIG[type];
    return config ? config.autoOpen : false;
}

/**
 * Check if a category triggers auto-open (at least one of its PCS types does).
 */
export function isCategoryAutoOpen(category) {
    switch (category) {
        case BOOK_SECTION_CATEGORIES.HISTORY_EVENT:
        case BOOK_SECTION_CATEGORIES.CHAPTER_HISTORY_EVENT:
            return true; // history_block and chapter_title are both auto-open
        case BOOK_SECTION_CATEGORIES.MILESTONE:
            return true;
        case BOOK_SECTION_CATEGORIES.VILLAGE_UPDATES:
            return false;
        default:
            return false;
    }
}

/**
 * Validate a section category.
 */
export function isValidCategory(category) {
    return Object.values(BOOK_SECTION_CATEGORIES).includes(category);
}

/**
 * Validate a PCS type.
 */
export function isValidPcsType(type) {
    return Object.values(PCS_TYPES).includes(type);
}

/**
 * Get all PCS types for a given category.
 */
export function getPcsTypesForCategory(category) {
    switch (category) {
        case BOOK_SECTION_CATEGORIES.CHAPTER_HISTORY_EVENT:
            return [PCS_TYPES.CHAPTER_TITLE, PCS_TYPES.HISTORY_BLOCK];
        case BOOK_SECTION_CATEGORIES.HISTORY_EVENT:
            return [PCS_TYPES.HISTORY_BLOCK];
        case BOOK_SECTION_CATEGORIES.MILESTONE:
            return [PCS_TYPES.MILESTONE];
        case BOOK_SECTION_CATEGORIES.VILLAGE_UPDATES:
            return [PCS_TYPES.VILLAGE_UPDATE_TITLE, PCS_TYPES.VILLAGE_UPDATE_BULLET];
        default:
            return [];
    }
}

/**
 * Clamp a weight override to a reasonable range.
 * @param {number} defaultWeight - The default weight for the PCS type.
 * @param {number} override - The requested override weight.
 * @returns {number} - The clamped weight.
 */
export function clampWeight(defaultWeight, override) {
    if (override === undefined || override === null) return defaultWeight;
    const min = defaultWeight * 0.5;
    const max = defaultWeight * 2;
    return Math.max(min, Math.min(max, override));
}

/**
 * Generate a unique PCS id.
 */
let _pcsIdCounter = 0;
export function generatePcsId() {
    return `pcs_${Date.now()}_${++_pcsIdCounter}`;
}

/**
 * Generate a unique PageSection id.
 */
export function generatePageSectionId(engineSectionId) {
    return `${engineSectionId}_${Date.now()}`;
}
