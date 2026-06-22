import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { BookService } from '../../../js/engine/book/BookService.js';
import { BOOK_SECTION_CATEGORIES, PCS_TYPES } from '../../../js/engine/book/BookSectionCatalog.js';

describe('BookService', () => {
    let book;

    beforeEach(() => {
        // Clear localStorage before each test
        global.localStorage = {
            data: {},
            getItem(key) { return this.data[key] || null; },
            setItem(key, value) { this.data[key] = value; },
            removeItem(key) { delete this.data[key]; },
            clear() { this.data = {}; },
        };
        book = new BookService();
        book.load();
    });

    describe('Initial State', () => {
        test('starts with Chapter 1 and one empty page', () => {
            const state = book.getState();
            assert.strictEqual(state.chapters.length, 1);
            assert.strictEqual(state.chapters[0].chapterNumber, 1);
            assert.strictEqual(state.chapters[0].startPageNumber, 1);
            assert.strictEqual(state.pages.length, 1);
            assert.strictEqual(state.pages[0].pageNumber, 1);
            assert.strictEqual(state.pages[0].chapterNumber, 1);
            assert.strictEqual(state.pages[0].remainingBudget, 10);
            assert.strictEqual(state.pages[0].pageContentSections.length, 0);
        });
    });

    describe('addSection - History Events', () => {
        test('adds a single history block to the current page', () => {
            const result = book.addSection({
                id: 'test_history_1',
                category: BOOK_SECTION_CATEGORIES.HISTORY_EVENT,
                day: 5,
                blocks: [
                    { textKey: 'nar_first_expedition_title', values: {}, weight: 6 },
                ],
            });

            assert.notStrictEqual(result, null);
            assert.strictEqual(book.getPageCount(), 1);
            const page = book.getPage(1);
            assert.strictEqual(page.pageContentSections.length, 1);
            assert.strictEqual(page.remainingBudget, 4); // 10 - 6
            assert.strictEqual(page.pageContentSections[0].type, PCS_TYPES.HISTORY_BLOCK);
        });

        test('adds multiple history blocks across pages when budget overflows', () => {
            const result = book.addSection({
                id: 'test_history_multi',
                category: BOOK_SECTION_CATEGORIES.HISTORY_EVENT,
                day: 10,
                blocks: [
                    { textKey: 'block_1', values: {}, weight: 6 },
                    { textKey: 'block_2', values: {}, weight: 6 },
                ],
            });

            assert.notStrictEqual(result, null);
            assert.strictEqual(book.getPageCount(), 2);

            const page1 = book.getPage(1);
            const page2 = book.getPage(2);

            assert.strictEqual(page1.pageContentSections.length, 1);
            assert.strictEqual(page1.remainingBudget, 4);
            assert.strictEqual(page2.pageContentSections.length, 1);
            assert.strictEqual(page2.remainingBudget, 4);
        });

        test('adds multiple history blocks that fit on one page', () => {
            const result = book.addSection({
                id: 'test_history_fit',
                category: BOOK_SECTION_CATEGORIES.HISTORY_EVENT,
                day: 10,
                blocks: [
                    { textKey: 'block_1', values: {}, weight: 4 },
                    { textKey: 'block_2', values: {}, weight: 4 },
                ],
            });

            assert.notStrictEqual(result, null);
            assert.strictEqual(book.getPageCount(), 1);
            const page = book.getPage(1);
            assert.strictEqual(page.pageContentSections.length, 2);
            assert.strictEqual(page.remainingBudget, 2); // 10 - 4 - 4
        });

        test('skips empty history events', () => {
            const result = book.addSection({
                id: 'test_empty',
                category: BOOK_SECTION_CATEGORIES.HISTORY_EVENT,
                day: 5,
                blocks: [],
            });

            assert.strictEqual(result, null);
            assert.strictEqual(book.getPageCount(), 1);
            assert.strictEqual(book.getPage(1).pageContentSections.length, 0);
        });

        test('skips history events with no blocks property', () => {
            const result = book.addSection({
                id: 'test_no_blocks',
                category: BOOK_SECTION_CATEGORIES.HISTORY_EVENT,
                day: 5,
            });

            assert.strictEqual(result, null);
            assert.strictEqual(book.getPageCount(), 1);
        });
    });

    describe('addSection - Chapter History Events', () => {
        test('creates a new chapter and starts on new page', () => {
            // Fill page 1 with something
            book.addSection({
                id: 'fill_page',
                category: BOOK_SECTION_CATEGORIES.HISTORY_EVENT,
                day: 5,
                blocks: [
                    { textKey: 'fill', values: {}, weight: 10 },
                ],
            });

            const result = book.addSection({
                id: 'chapter_2',
                category: BOOK_SECTION_CATEGORIES.CHAPTER_HISTORY_EVENT,
                day: 20,
                blocks: [
                    { textKey: 'nar_dark_forest_found_title', values: {}, weight: 6 },
                ],
                metadata: { titleKey: 'book_chapter_2_title' },
            });

            assert.notStrictEqual(result, null);
            assert.strictEqual(book.getChapterCount(), 2);
            // Page 1 (full) + page 2 (chapter title + block) = 2 pages
            assert.strictEqual(book.getPageCount(), 2);

            const chapter2 = book.getState().chapters[1];
            assert.strictEqual(chapter2.chapterNumber, 2);
            assert.strictEqual(chapter2.titleKey, 'book_chapter_2_title');

            // Check that chapter title PCS is on page 2
            const page2 = book.getPage(2);
            assert.strictEqual(page2.pageContentSections[0].type, PCS_TYPES.CHAPTER_TITLE);
            assert.strictEqual(page2.chapterNumber, 2);
            // Chapter title (2) + history block (6) = 8, remaining budget 2
            assert.strictEqual(page2.remainingBudget, 2);
        });

        test('skips empty chapter history events', () => {
            const result = book.addSection({
                id: 'empty_chapter',
                category: BOOK_SECTION_CATEGORIES.CHAPTER_HISTORY_EVENT,
                day: 20,
                blocks: [],
                metadata: { titleKey: 'book_chapter_2_title' },
            });

            assert.strictEqual(result, null);
            assert.strictEqual(book.getChapterCount(), 1); // Still only chapter 1
        });

        test('first chapter history event reuses empty Chapter 1 instead of creating Chapter 2', () => {
            const result = book.addSection({
                id: 'prologue',
                category: BOOK_SECTION_CATEGORIES.CHAPTER_HISTORY_EVENT,
                day: 1,
                blocks: [
                    { textKey: 'prologue_block_1', values: {}, weight: 1 },
                    { textKey: 'prologue_block_2', values: {}, weight: 1 },
                ],
                metadata: { titleKey: 'book_chapter_1_title' },
            });

            assert.notStrictEqual(result, null);
            assert.strictEqual(book.getChapterCount(), 1);

            const chapter1 = book.getState().chapters[0];
            assert.strictEqual(chapter1.chapterNumber, 1);
            assert.strictEqual(chapter1.titleKey, 'book_chapter_1_title');

            const page1 = book.getPage(1);
            assert.strictEqual(page1.chapterNumber, 1);
            assert.strictEqual(page1.pageContentSections[0].type, PCS_TYPES.CHAPTER_TITLE);
            assert.strictEqual(page1.pageContentSections[0].values.chapter, 1);
            assert.strictEqual(page1.pageContentSections[0].textKey, 'book_chapter_1_title');
        });
    });

    describe('addSection - Milestones', () => {
        test('adds a milestone to current page', () => {
            const result = book.addSection({
                id: 'milestone_1',
                category: BOOK_SECTION_CATEGORIES.MILESTONE,
                day: 15,
                entry: { key: 'book_milestone_first_victory', values: {}, weight: 4 },
            });

            assert.notStrictEqual(result, null);
            assert.strictEqual(book.getPageCount(), 1);
            const page = book.getPage(1);
            assert.strictEqual(page.pageContentSections.length, 1);
            assert.strictEqual(page.pageContentSections[0].type, PCS_TYPES.MILESTONE);
            assert.strictEqual(page.remainingBudget, 6);
        });

        test('milestones with no entry are skipped', () => {
            const result = book.addSection({
                id: 'empty_milestone',
                category: BOOK_SECTION_CATEGORIES.MILESTONE,
                day: 15,
            });

            assert.strictEqual(result, null);
            assert.strictEqual(book.getPageCount(), 1);
            assert.strictEqual(book.getPage(1).pageContentSections.length, 0);
        });
    });

    describe('addSection - Village Updates', () => {
        test('adds title and bullets to current page', () => {
            const result = book.addSection({
                id: 'village_day_5',
                category: BOOK_SECTION_CATEGORIES.VILLAGE_UPDATES,
                day: 5,
                entries: [
                    { key: 'book_update_food_consumed', values: { amount: 12 }, weight: 1 },
                    { key: 'book_update_hero_rested', values: { hero: 'Arthur', hp: 20 }, weight: 1 },
                ],
            });

            assert.notStrictEqual(result, null);
            assert.strictEqual(book.getPageCount(), 1);
            const page = book.getPage(1);
            // Title (2) + bullet 1 (1) + bullet 2 (1) = 4 units, remaining 6
            assert.strictEqual(page.pageContentSections.length, 3);
            assert.strictEqual(page.pageContentSections[0].type, PCS_TYPES.VILLAGE_UPDATE_TITLE);
            assert.strictEqual(page.pageContentSections[1].type, PCS_TYPES.VILLAGE_UPDATE_BULLET);
            assert.strictEqual(page.pageContentSections[2].type, PCS_TYPES.VILLAGE_UPDATE_BULLET);
            assert.strictEqual(page.remainingBudget, 6);
        });

        test('spills bullets to next page when budget overflows', () => {
            const result = book.addSection({
                id: 'village_day_10',
                category: BOOK_SECTION_CATEGORIES.VILLAGE_UPDATES,
                day: 10,
                entries: [
                    { key: 'book_update_food_consumed', values: { amount: 12 }, weight: 1 },
                    { key: 'book_update_hero_rested', values: { hero: 'Arthur', hp: 20 }, weight: 1 },
                    { key: 'book_update_hero_trained', values: { hero: 'Arthur', xp: 50 }, weight: 1 },
                    { key: 'book_update_building_completed', values: { building: 'Tavern' }, weight: 1 },
                    { key: 'book_update_hero_recruited', values: { hero: 'Elara' }, weight: 1 },
                    { key: 'book_update_combat_victory', values: { enemies: 'Goblins' }, weight: 1 },
                    { key: 'book_update_region_unlocked', values: { region: 'Dark Forest' }, weight: 1 },
                    { key: 'book_update_market_rotation', values: {}, weight: 1 },
                    { key: 'book_update_quiet_day', values: {}, weight: 1 },
                ],
            });

            assert.notStrictEqual(result, null);
            // Title (2) + 9 bullets (1 each) = 11 units
            // Page 1: title (2) + 8 bullets (8) = 10, remaining 0
            // Page 2: 1 bullet (1), remaining 9
            assert.strictEqual(book.getPageCount(), 2);

            const page1 = book.getPage(1);
            const page2 = book.getPage(2);

            assert.strictEqual(page1.pageContentSections.length, 9); // title + 8 bullets
            assert.strictEqual(page1.remainingBudget, 0);
            assert.strictEqual(page2.pageContentSections.length, 1); // 1 bullet
            assert.strictEqual(page2.remainingBudget, 9);
        });

        test('village updates with no entries produce only title', () => {
            const result = book.addSection({
                id: 'empty_village',
                category: BOOK_SECTION_CATEGORIES.VILLAGE_UPDATES,
                day: 5,
                entries: [],
            });

            assert.notStrictEqual(result, null);
            assert.strictEqual(book.getPageCount(), 1);
            const page = book.getPage(1);
            assert.strictEqual(page.pageContentSections.length, 1);
            assert.strictEqual(page.pageContentSections[0].type, PCS_TYPES.VILLAGE_UPDATE_TITLE);
            assert.strictEqual(page.remainingBudget, 8);
        });
    });

    describe('Overflow Guard', () => {
        test('allows single PCS to overflow page budget', () => {
            const result = book.addSection({
                id: 'overflow_test',
                category: BOOK_SECTION_CATEGORIES.HISTORY_EVENT,
                day: 10,
                blocks: [
                    { textKey: 'overflow_block', values: {}, weight: 15 },
                ],
            });

            assert.notStrictEqual(result, null);
            assert.strictEqual(book.getPageCount(), 1);
            const page = book.getPage(1);
            assert.strictEqual(page.pageContentSections.length, 1);
            // The PCS overflows, so it doesn't deduct from remainingBudget
            assert.strictEqual(page.remainingBudget, 10);
        });

        test('overflow PCS gets its own page if current page has content', () => {
            // First, put something on page 1
            book.addSection({
                id: 'fill_page',
                category: BOOK_SECTION_CATEGORIES.HISTORY_EVENT,
                day: 5,
                blocks: [
                    { textKey: 'fill', values: {}, weight: 6 },
                ],
            });

            // Now add an overflow block
            const result = book.addSection({
                id: 'overflow_test',
                category: BOOK_SECTION_CATEGORIES.HISTORY_EVENT,
                day: 10,
                blocks: [
                    { textKey: 'overflow_block', values: {}, weight: 15 },
                ],
            });

            assert.notStrictEqual(result, null);
            assert.strictEqual(book.getPageCount(), 2);
            // Page 1 should have the fill block only
            const page1 = book.getPage(1);
            assert.strictEqual(page1.pageContentSections.length, 1);
            assert.strictEqual(page1.pageContentSections[0].textKey, 'fill');
            // Page 2 should have the overflow block
            const page2 = book.getPage(2);
            assert.strictEqual(page2.pageContentSections.length, 1);
            assert.strictEqual(page2.pageContentSections[0].textKey, 'overflow_block');
            assert.strictEqual(page2.remainingBudget, 10);
        });
    });

    describe('Query API', () => {
        test('getPage returns correct page', () => {
            book.addSection({
                id: 'test_history',
                category: BOOK_SECTION_CATEGORIES.HISTORY_EVENT,
                day: 5,
                blocks: [
                    { textKey: 'block_1', values: {}, weight: 6 },
                    { textKey: 'block_2', values: {}, weight: 6 },
                ],
            });

            assert.notStrictEqual(book.getPage(1), null);
            assert.notStrictEqual(book.getPage(2), null);
            assert.strictEqual(book.getPage(3), null);
            assert.strictEqual(book.getPage(0), null);
        });

        test('getSpread returns left and right pages', () => {
            book.addSection({
                id: 'test_history',
                category: BOOK_SECTION_CATEGORIES.HISTORY_EVENT,
                day: 5,
                blocks: [
                    { textKey: 'block_1', values: {}, weight: 6 },
                    { textKey: 'block_2', values: {}, weight: 6 },
                ],
            });

            const spread = book.getSpread(1);
            assert.notStrictEqual(spread, null);
            assert.notStrictEqual(spread.left, null);
            assert.notStrictEqual(spread.right, null);
            assert.strictEqual(spread.left.pageNumber, 1);
            assert.strictEqual(spread.right.pageNumber, 2);
        });

        test('getSpread returns null for even page numbers', () => {
            assert.strictEqual(book.getSpread(2), null);
        });

        test('getCurrentSpread returns initial spread', () => {
            const spread = book.getCurrentSpread();
            assert.notStrictEqual(spread, null);
            assert.strictEqual(spread.left.pageNumber, 1);
        });

        test('getPageCount and getSpreadCount', () => {
            book.addSection({
                id: 'test_history',
                category: BOOK_SECTION_CATEGORIES.HISTORY_EVENT,
                day: 5,
                blocks: [
                    { textKey: 'block_1', values: {}, weight: 6 },
                    { textKey: 'block_2', values: {}, weight: 6 },
                ],
            });

            assert.strictEqual(book.getPageCount(), 2);
            assert.strictEqual(book.getSpreadCount(), 1);
        });
    });

    describe('Read/Unread Tracking', () => {
        test('hasUnreadContent returns true for new content', () => {
            book.addSection({
                id: 'test_history',
                category: BOOK_SECTION_CATEGORIES.HISTORY_EVENT,
                day: 5,
                blocks: [
                    { textKey: 'block_1', values: {}, weight: 6 },
                ],
            });

            assert.strictEqual(book.hasUnreadContent(), true);
        });

        test('hasUnreadContent returns false after marking all read', () => {
            book.addSection({
                id: 'test_history',
                category: BOOK_SECTION_CATEGORIES.HISTORY_EVENT,
                day: 5,
                blocks: [
                    { textKey: 'block_1', values: {}, weight: 6 },
                ],
            });

            book.markAllRead();
            assert.strictEqual(book.hasUnreadContent(), false);
        });

        test('hasAutoOpenContent returns true for unread history events', () => {
            book.addSection({
                id: 'test_history',
                category: BOOK_SECTION_CATEGORIES.HISTORY_EVENT,
                day: 5,
                blocks: [
                    { textKey: 'block_1', values: {}, weight: 6 },
                ],
            });

            assert.strictEqual(book.hasAutoOpenContent(), true);
        });

        test('hasAutoOpenContent returns false for village updates only', () => {
            book.addSection({
                id: 'village_day_5',
                category: BOOK_SECTION_CATEGORIES.VILLAGE_UPDATES,
                day: 5,
                entries: [
                    { key: 'book_update_food_consumed', values: { amount: 12 }, weight: 1 },
                ],
            });

            assert.strictEqual(book.hasAutoOpenContent(), false);
        });

        test('markRead updates lastReadSpread and marks pages as read', () => {
            book.addSection({
                id: 'test_history',
                category: BOOK_SECTION_CATEGORIES.HISTORY_EVENT,
                day: 5,
                blocks: [
                    { textKey: 'block_1', values: {}, weight: 6 },
                    { textKey: 'block_2', values: {}, weight: 6 },
                ],
            });

            book.markRead(1);
            assert.strictEqual(book.getState().lastReadSpread, 1);

            const page1 = book.getPage(1);
            const page2 = book.getPage(2);
            assert.strictEqual(page1.pageContentSections[0].read, true);
            assert.strictEqual(page2.pageContentSections[0].read, true);
        });
    });

    describe('PageSection Tracking', () => {
        test('pageSection tracks pages and PCS IDs', () => {
            const result = book.addSection({
                id: 'test_history',
                category: BOOK_SECTION_CATEGORIES.HISTORY_EVENT,
                day: 5,
                blocks: [
                    { textKey: 'block_1', values: {}, weight: 6 },
                    { textKey: 'block_2', values: {}, weight: 6 },
                ],
            });

            const pageSection = book.getPageSection(result.pageSectionId);
            assert.notStrictEqual(pageSection, null);
            assert.strictEqual(pageSection.category, BOOK_SECTION_CATEGORIES.HISTORY_EVENT);
            assert.strictEqual(pageSection.day, 5);
            assert.strictEqual(pageSection.pages.length, 2);
            assert.strictEqual(pageSection.pageContentSectionIds.length, 2);
        });

        test('getPageSectionPage returns first page of section', () => {
            const result = book.addSection({
                id: 'test_history',
                category: BOOK_SECTION_CATEGORIES.HISTORY_EVENT,
                day: 5,
                blocks: [
                    { textKey: 'block_1', values: {}, weight: 6 },
                    { textKey: 'block_2', values: {}, weight: 6 },
                ],
            });

            assert.strictEqual(book.getPageSectionPage(result.pageSectionId), 1);
        });

        test('getPageSectionChapter returns chapter of first page', () => {
            const result = book.addSection({
                id: 'test_history',
                category: BOOK_SECTION_CATEGORIES.HISTORY_EVENT,
                day: 5,
                blocks: [
                    { textKey: 'block_1', values: {}, weight: 6 },
                ],
            });

            assert.strictEqual(book.getPageSectionChapter(result.pageSectionId), 1);
        });
    });

    describe('Bug Fixes', () => {
        test('markAllRead sets lastReadSpread to odd page number', () => {
            // Add a village update section with many entries to create multiple pages
            book.addSection({
                id: 'sec_village_1',
                category: BOOK_SECTION_CATEGORIES.VILLAGE_UPDATES,
                day: 1,
                entries: [
                    { key: 'book_update_food_consumed', values: { amount: 10 }, weight: 1 },
                    { key: 'book_update_villager_joined', values: { amount: 1 }, weight: 1 },
                    { key: 'book_update_building_completed', values: { building: 'Tavern' }, weight: 1 },
                    { key: 'book_update_hero_rested', values: { hero: 'Arthur', hp: 20 }, weight: 1 },
                    { key: 'book_update_hero_trained', values: { hero: 'Arthur', xp: 50 }, weight: 1 },
                    { key: 'book_update_hero_scouted', values: { hero: 'Elara', region: 'Forest' }, weight: 1 },
                    { key: 'book_update_hero_crafted', values: { hero: 'Mira', item: 'Potion' }, weight: 1 },
                    { key: 'book_update_hero_socialized', values: { hero: 'Gwen' }, weight: 1 },
                    { key: 'book_update_expedition_completed', values: { region: 'Greenfields' }, weight: 1 },
                ],
            });
            // Title (2) + 9 bullets (9) = 11, needs at least 2 pages
            // If more pages are created by other logic, ensure at least 3
            while (book.getPageCount() < 3) {
                // Add more entries to force page creation
                book.addSection({
                    id: `sec_fill_${book.getPageCount()}`,
                    category: BOOK_SECTION_CATEGORIES.VILLAGE_UPDATES,
                    day: 1,
                    entries: [
                        { key: 'book_update_quiet_day', values: {}, weight: 1 },
                        { key: 'book_update_quiet_day', values: {}, weight: 1 },
                        { key: 'book_update_quiet_day', values: {}, weight: 1 },
                        { key: 'book_update_quiet_day', values: {}, weight: 1 },
                        { key: 'book_update_quiet_day', values: {}, weight: 1 },
                        { key: 'book_update_quiet_day', values: {}, weight: 1 },
                        { key: 'book_update_quiet_day', values: {}, weight: 1 },
                        { key: 'book_update_quiet_day', values: {}, weight: 1 },
                    ],
                });
            }
            assert.ok(book.getPageCount() >= 3, `Expected >= 3 pages, got ${book.getPageCount()}`);
            book.markAllRead();
            const lastRead = book.getState().lastReadSpread;
            assert.strictEqual(lastRead % 2, 1, `lastReadSpread should be odd, got ${lastRead}`);
        });

        test('markAllRead with even number of pages sets lastReadSpread to odd', () => {
            // Add a milestone which creates an even page count
            book.addSection({
                id: 'sec_milestone_1',
                category: BOOK_SECTION_CATEGORIES.MILESTONE,
                day: 1,
                entry: { key: 'book_milestone_hero_recruited', values: { hero: 'Arthur' }, weight: 4 },
            });
            book.markAllRead();
            const lastRead = book.getState().lastReadSpread;
            assert.strictEqual(lastRead % 2, 1, `lastReadSpread should be odd, got ${lastRead}`);
        });

        test('PCS has pageSectionId linking to parent PageSection', () => {
            const result = book.addSection({
                id: 'sec_village_2',
                category: BOOK_SECTION_CATEGORIES.VILLAGE_UPDATES,
                day: 2,
                entries: [
                    { key: 'book_update_quiet_day', values: {}, weight: 1 },
                ],
            });
            assert.ok(result, 'addSection should return result');
            assert.strictEqual(result.pageSectionId, 'sec_village_2', 'pageSectionId should match original engine section id');

            const state = book.getState();
            const page = state.pages[1]; // page 2 (or wherever it landed)
            if (page && page.pageContentSections.length > 0) {
                const pcs = page.pageContentSections[0];
                assert.strictEqual(pcs.pageSectionId, 'sec_village_2', 'PCS should have pageSectionId linking to original section id');
            }
        });

        test('PageSection.id uses original engine section id', () => {
            const result = book.addSection({
                id: 'my_custom_section_id',
                category: BOOK_SECTION_CATEGORIES.MILESTONE,
                day: 3,
                entry: { key: 'book_milestone_first_victory', values: {}, weight: 4 },
            });
            assert.ok(result, 'addSection should return result');
            assert.strictEqual(result.pageSectionId, 'my_custom_section_id', 'pageSectionId should be original engine section id');

            const state = book.getState();
            const pageSection = state.pageSections.find(ps => ps.id === 'my_custom_section_id');
            assert.ok(pageSection, 'PageSection should exist with original id');
        });

        test('getNextNewSpread handles even lastReadSpread gracefully', () => {
            // Force an even lastReadSpread
            book.getState().lastReadSpread = 2;
            // With no unread content, should return null, not crash
            const nextSpread = book.getNextNewSpread();
            // If everything is read, it should return null
            // But we need to check it doesn't crash
            assert.ok(nextSpread === null || nextSpread.left || nextSpread.right, 'Should not crash on even lastReadSpread');
        });
    });

    describe('Writer Revelation Milestones', () => {
        test('injects first writer revelation at 10 history blocks', () => {
            for (let i = 0; i < 10; i++) {
                const result = book.addSection({
                    id: `hist_${i}`,
                    category: BOOK_SECTION_CATEGORIES.HISTORY_EVENT,
                    day: i + 1,
                    blocks: [{ textKey: 'block', values: {}, weight: 1 }],
                });
                if (i === 9) {
                    assert.ok(result, 'addSection should return result');
                    assert.strictEqual(result.writerRevelations.length, 1, 'Should inject one revelation');
                    assert.strictEqual(result.writerRevelations[0].id, 'writer_milestone_10');
                }
            }

            const state = book.getState();
            assert.strictEqual(state._totalHistoryBlocks, 10);
            const writerSection = state.pageSections.find(ps => ps.id === 'writer_milestone_10');
            assert.ok(writerSection, 'Writer milestone section should exist');
            assert.strictEqual(writerSection.metadata.writerMilestone, 10);

            const pcsIds = writerSection.pageContentSectionIds;
            const pcsList = state.pages.flatMap(p => p.pageContentSections).filter(pcs => pcsIds.includes(pcs.id));
            assert.strictEqual(pcsList.length, 2);
            assert.strictEqual(pcsList[0].type, PCS_TYPES.MILESTONE);
            assert.strictEqual(pcsList[0].textKey, 'book_milestone_writer_revelation');
            assert.strictEqual(pcsList[1].type, PCS_TYPES.HISTORY_BLOCK);
            assert.strictEqual(pcsList[1].textKey, 'book_milestone_writer_revelation_text');
        });

        test('injects all three writer revelations at 10, 12 and 14 history blocks', () => {
            for (let i = 0; i < 14; i++) {
                book.addSection({
                    id: `hist_${i}`,
                    category: BOOK_SECTION_CATEGORIES.HISTORY_EVENT,
                    day: i + 1,
                    blocks: [{ textKey: 'block', values: {}, weight: 1 }],
                });
            }

            const state = book.getState();
            assert.strictEqual(state._totalHistoryBlocks, 14);
            const thresholds = [10, 12, 14];
            for (const threshold of thresholds) {
                const writerSection = state.pageSections.find(ps => ps.metadata?.writerMilestone === threshold);
                assert.ok(writerSection, `Writer milestone ${threshold} should exist`);
            }
        });

        test('writer revelation is idempotent and does not duplicate', () => {
            for (let i = 0; i < 11; i++) {
                book.addSection({
                    id: `hist_${i}`,
                    category: BOOK_SECTION_CATEGORIES.HISTORY_EVENT,
                    day: i + 1,
                    blocks: [{ textKey: 'block', values: {}, weight: 1 }],
                });
            }

            const state = book.getState();
            const writerSections = state.pageSections.filter(ps => ps.id.startsWith('writer_milestone'));
            assert.strictEqual(writerSections.length, 1, 'Only one writer milestone should exist');
        });

        test('chapter history events also count toward writer revelation', () => {
            for (let i = 0; i < 9; i++) {
                book.addSection({
                    id: `hist_${i}`,
                    category: BOOK_SECTION_CATEGORIES.HISTORY_EVENT,
                    day: i + 1,
                    blocks: [{ textKey: 'block', values: {}, weight: 1 }],
                });
            }

            const result = book.addSection({
                id: 'chapter_event',
                category: BOOK_SECTION_CATEGORIES.CHAPTER_HISTORY_EVENT,
                day: 10,
                blocks: [{ textKey: 'block', values: {}, weight: 1 }],
                metadata: { titleKey: 'book_chapter_2_title' },
            });

            assert.ok(result.writerRevelations.length > 0, 'Chapter history event should trigger revelation');
            const state = book.getState();
            assert.strictEqual(state._totalHistoryBlocks, 10);
        });
    });

    describe('Persistence', () => {
        test('saves and loads state', () => {
            book.addSection({
                id: 'test_history',
                category: BOOK_SECTION_CATEGORIES.HISTORY_EVENT,
                day: 5,
                blocks: [
                    { textKey: 'block_1', values: {}, weight: 6 },
                ],
            });

            book.save();

            const book2 = new BookService();
            book2.load();

            assert.strictEqual(book2.getPageCount(), 1);
            assert.strictEqual(book2.getPage(1).pageContentSections.length, 1);
            assert.strictEqual(book2.getPage(1).pageContentSections[0].textKey, 'block_1');
        });
    });
});
