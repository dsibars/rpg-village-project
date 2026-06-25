import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
    BOOK_SECTION_CATEGORIES,
    PCS_TYPES,
    DEFAULT_PAGE_BUDGET,
    getPcsDefaultWeight,
    isPcsSplittable,
    isPcsAutoOpen,
    isCategoryAutoOpen,
    getPcsTypesForCategory,
    clampWeight,
    isValidCategory,
    isValidPcsType,
} from '../../../js/engine/book/BookSectionCatalog.js';

describe('BookSectionCatalog', () => {
    describe('Category Definitions', () => {
        test('should define four categories', () => {
            const categories = Object.values(BOOK_SECTION_CATEGORIES);
            assert.strictEqual(categories.length, 4);
            assert(categories.includes('history_event'));
            assert(categories.includes('chapter_history_event'));
            assert(categories.includes('milestone'));
            assert(categories.includes('village_updates'));
        });

        test('should define five PCS types', () => {
            const types = Object.values(PCS_TYPES);
            assert.strictEqual(types.length, 5);
            assert(types.includes('chapter_title'));
            assert(types.includes('history_block'));
            assert(types.includes('milestone'));
            assert(types.includes('village_update_title'));
            assert(types.includes('village_update_bullet'));
        });
    });

    describe('Default Weights', () => {
        test('chapter_title default weight is 2', () => {
            assert.strictEqual(getPcsDefaultWeight(PCS_TYPES.CHAPTER_TITLE), 2);
        });

        test('history_block default weight is 6', () => {
            assert.strictEqual(getPcsDefaultWeight(PCS_TYPES.HISTORY_BLOCK), 6);
        });

        test('milestone default weight is 4', () => {
            assert.strictEqual(getPcsDefaultWeight(PCS_TYPES.MILESTONE), 4);
        });

        test('village_update_title default weight is 2', () => {
            assert.strictEqual(getPcsDefaultWeight(PCS_TYPES.VILLAGE_UPDATE_TITLE), 2);
        });

        test('village_update_bullet default weight is 1', () => {
            assert.strictEqual(getPcsDefaultWeight(PCS_TYPES.VILLAGE_UPDATE_BULLET), 1);
        });

        test('invalid type returns 0', () => {
            assert.strictEqual(getPcsDefaultWeight('invalid_type'), 0);
        });
    });

    describe('Splittable Types', () => {
        test('history_block is splittable', () => {
            assert.strictEqual(isPcsSplittable(PCS_TYPES.HISTORY_BLOCK), true);
        });

        test('village_update_bullet is splittable', () => {
            assert.strictEqual(isPcsSplittable(PCS_TYPES.VILLAGE_UPDATE_BULLET), true);
        });

        test('chapter_title is not splittable', () => {
            assert.strictEqual(isPcsSplittable(PCS_TYPES.CHAPTER_TITLE), false);
        });

        test('milestone is not splittable', () => {
            assert.strictEqual(isPcsSplittable(PCS_TYPES.MILESTONE), false);
        });

        test('village_update_title is not splittable', () => {
            assert.strictEqual(isPcsSplittable(PCS_TYPES.VILLAGE_UPDATE_TITLE), false);
        });
    });

    describe('Auto-Open Types', () => {
        test('history_block triggers auto-open', () => {
            assert.strictEqual(isPcsAutoOpen(PCS_TYPES.HISTORY_BLOCK), true);
        });

        test('milestone triggers auto-open', () => {
            assert.strictEqual(isPcsAutoOpen(PCS_TYPES.MILESTONE), true);
        });

        test('chapter_title does not trigger auto-open', () => {
            assert.strictEqual(isPcsAutoOpen(PCS_TYPES.CHAPTER_TITLE), false);
        });

        test('village_update_bullet does not trigger auto-open', () => {
            assert.strictEqual(isPcsAutoOpen(PCS_TYPES.VILLAGE_UPDATE_BULLET), false);
        });
    });

    describe('Category Auto-Open', () => {
        test('history_event category auto-opens', () => {
            assert.strictEqual(isCategoryAutoOpen(BOOK_SECTION_CATEGORIES.HISTORY_EVENT), true);
        });

        test('chapter_history_event category auto-opens', () => {
            assert.strictEqual(isCategoryAutoOpen(BOOK_SECTION_CATEGORIES.CHAPTER_HISTORY_EVENT), true);
        });

        test('milestone category auto-opens', () => {
            assert.strictEqual(isCategoryAutoOpen(BOOK_SECTION_CATEGORIES.MILESTONE), true);
        });

        test('village_updates category does not auto-open', () => {
            assert.strictEqual(isCategoryAutoOpen(BOOK_SECTION_CATEGORIES.VILLAGE_UPDATES), false);
        });
    });

    describe('PCS Types for Category', () => {
        test('chapter_history_event yields chapter_title and history_block', () => {
            const types = getPcsTypesForCategory(BOOK_SECTION_CATEGORIES.CHAPTER_HISTORY_EVENT);
            assert.strictEqual(types.length, 2);
            assert(types.includes(PCS_TYPES.CHAPTER_TITLE));
            assert(types.includes(PCS_TYPES.HISTORY_BLOCK));
        });

        test('history_event yields only history_block', () => {
            const types = getPcsTypesForCategory(BOOK_SECTION_CATEGORIES.HISTORY_EVENT);
            assert.strictEqual(types.length, 1);
            assert(types.includes(PCS_TYPES.HISTORY_BLOCK));
        });

        test('milestone yields only milestone', () => {
            const types = getPcsTypesForCategory(BOOK_SECTION_CATEGORIES.MILESTONE);
            assert.strictEqual(types.length, 1);
            assert(types.includes(PCS_TYPES.MILESTONE));
        });

        test('village_updates yields title and bullet', () => {
            const types = getPcsTypesForCategory(BOOK_SECTION_CATEGORIES.VILLAGE_UPDATES);
            assert.strictEqual(types.length, 2);
            assert(types.includes(PCS_TYPES.VILLAGE_UPDATE_TITLE));
            assert(types.includes(PCS_TYPES.VILLAGE_UPDATE_BULLET));
        });
    });

    describe('Weight Clamping', () => {
        test('returns default weight when no override', () => {
            assert.strictEqual(clampWeight(6, undefined), 6);
            assert.strictEqual(clampWeight(6, null), 6);
        });

        test('clamps to 50% minimum', () => {
            assert.strictEqual(clampWeight(6, 1), 3); // 6 * 0.5 = 3
        });

        test('clamps to 200% maximum', () => {
            assert.strictEqual(clampWeight(6, 20), 12); // 6 * 2 = 12
        });

        test('allows values within range', () => {
            assert.strictEqual(clampWeight(6, 5), 5);
            assert.strictEqual(clampWeight(6, 8), 8);
        });
    });

    describe('Validation', () => {
        test('valid categories pass', () => {
            assert.strictEqual(isValidCategory('history_event'), true);
            assert.strictEqual(isValidCategory('chapter_history_event'), true);
            assert.strictEqual(isValidCategory('milestone'), true);
            assert.strictEqual(isValidCategory('village_updates'), true);
        });

        test('invalid categories fail', () => {
            assert.strictEqual(isValidCategory('invalid'), false);
            assert.strictEqual(isValidCategory(''), false);
        });

        test('valid PCS types pass', () => {
            assert.strictEqual(isValidPcsType('chapter_title'), true);
            assert.strictEqual(isValidPcsType('history_block'), true);
            assert.strictEqual(isValidPcsType('milestone'), true);
            assert.strictEqual(isValidPcsType('village_update_title'), true);
            assert.strictEqual(isValidPcsType('village_update_bullet'), true);
        });

        test('invalid PCS types fail', () => {
            assert.strictEqual(isValidPcsType('invalid'), false);
            assert.strictEqual(isValidPcsType(''), false);
        });
    });
});
