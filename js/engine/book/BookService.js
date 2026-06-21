import { persistence } from '../shared/core/Persistence.js';
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
    generatePcsId,
    generatePageSectionId,
} from './BookSectionCatalog.js';

/**
 * BookService — Owns the readable narrative.
 * Receives sections via addSection(), splits them into PageContentSections,
 * runs layout to produce pages and spreads, owns chapter boundaries,
 * and persists the complete layout (chapters, pages, pageSections).
 */
export class BookService {
    constructor() {
        this.STORAGE_KEY = 'book_state';
        this.state = this._loadState();
        this._pcsIdCounter = 0;
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
        return this._createDefaultState();
    }

    _createDefaultState() {
        return {
            chapters: [
                {
                    chapterNumber: 1,
                    startPageNumber: 1,
                    titleKey: 'book_chapter_1_title',
                },
            ],
            pages: [
                {
                    pageNumber: 1,
                    chapterNumber: 1,
                    pageContentSections: [],
                    remainingBudget: DEFAULT_PAGE_BUDGET,
                },
            ],
            pageSections: [],
            lastReadSpread: 1,
        };
    }

    getState() {
        return this.state;
    }

    setState(state) {
        this.state = state;
    }

    /**
     * Generate a unique PCS id.
     */
    _generatePcsId() {
        return `pcs_${Date.now()}_${++this._pcsIdCounter}`;
    }

    /**
     * Add a section from the engine. This is the single public entry point.
     * @param {Object} section — The engine-pushed section.
     * @returns {Object|null} — { pageSectionId, pages, chapterNumber } or null if skipped.
     */
    addSection(section) {
        if (!section || !section.id || !section.category) {
            return null;
        }

        // Guard: empty history_event or chapter_history_event with no blocks
        if (
            (section.category === BOOK_SECTION_CATEGORIES.HISTORY_EVENT ||
                section.category === BOOK_SECTION_CATEGORIES.CHAPTER_HISTORY_EVENT) &&
            (!section.blocks || section.blocks.length === 0)
        ) {
            return null;
        }

        // Step 1: Split the engine section into PageContentSections
        const pcsList = this._splitSectionIntoPcs(section);
        if (pcsList.length === 0) {
            return null;
        }

        // Step 2: Create a PageSection (use original engine section id)
        const pageSection = {
            id: section.id,
            category: section.category,
            day: section.day || 0,
            pages: [],
            pageContentSectionIds: [],
            metadata: section.metadata || {},
        };

        // Step 3: Place each PCS in order
        let currentPage = this._getLastPage();
        let currentChapter = this._getCurrentChapter();

        for (const pcs of pcsList) {
            // Link PCS back to its parent PageSection
            pcs.pageSectionId = pageSection.id;
            // If this is a chapter title, close current chapter and start new one
            if (pcs.type === PCS_TYPES.CHAPTER_TITLE) {
                currentChapter = this._createNewChapter(pcs.textKey);
                currentPage = this._createNewPage(currentChapter.chapterNumber);
            }

            // Guard: if a single PCS exceeds the page budget, allow overflow
            if (pcs.weight > DEFAULT_PAGE_BUDGET) {
                if (currentPage.pageContentSections.length > 0) {
                    currentPage = this._createNewPage(currentChapter.chapterNumber);
                }
                currentPage.pageContentSections.push(pcs);
                // Do not deduct weight for overflowed PCS
            } else if (currentPage.remainingBudget >= pcs.weight) {
                currentPage.pageContentSections.push(pcs);
                currentPage.remainingBudget -= pcs.weight;
            } else {
                // Start a new page
                currentPage = this._createNewPage(currentChapter.chapterNumber);
                currentPage.pageContentSections.push(pcs);
                currentPage.remainingBudget -= pcs.weight;
            }

            // Record in PageSection
            if (!pageSection.pages.includes(currentPage.pageNumber)) {
                pageSection.pages.push(currentPage.pageNumber);
            }
            pageSection.pageContentSectionIds.push(pcs.id);
        }

        // Step 4: Persist
        this.state.pageSections.push(pageSection);
        this.save();

        return {
            pageSectionId: pageSection.id,
            pages: pageSection.pages,
            chapterNumber: currentChapter.chapterNumber,
        };
    }

    /**
     * Split an engine section into PageContentSections.
     * @param {Object} section — The engine-pushed section.
     * @returns {Array} — Array of PageContentSections.
     */
    _splitSectionIntoPcs(section) {
        const pcsList = [];

        switch (section.category) {
            case BOOK_SECTION_CATEGORIES.CHAPTER_HISTORY_EVENT: {
                // Chapter title
                pcsList.push({
                    id: this._generatePcsId(),
                    category: section.category,
                    type: PCS_TYPES.CHAPTER_TITLE,
                    image: null,
                    textKey: section.metadata?.titleKey || 'book_chapter_default_title',
                    values: { chapter: this.state.chapters.length + 1 },
                    weight: getPcsDefaultWeight(PCS_TYPES.CHAPTER_TITLE),
                });
                // History blocks
                if (section.blocks) {
                    for (const block of section.blocks) {
                        pcsList.push({
                            id: this._generatePcsId(),
                            category: section.category,
                            type: PCS_TYPES.HISTORY_BLOCK,
                            image: block.image || null,
                            textKey: block.textKey,
                            values: block.values || {},
                            weight: clampWeight(
                                getPcsDefaultWeight(PCS_TYPES.HISTORY_BLOCK),
                                block.weight
                            ),
                        });
                    }
                }
                break;
            }
            case BOOK_SECTION_CATEGORIES.HISTORY_EVENT: {
                if (section.blocks) {
                    for (const block of section.blocks) {
                        pcsList.push({
                            id: this._generatePcsId(),
                            category: section.category,
                            type: PCS_TYPES.HISTORY_BLOCK,
                            image: block.image || null,
                            textKey: block.textKey,
                            values: block.values || {},
                            weight: clampWeight(
                                getPcsDefaultWeight(PCS_TYPES.HISTORY_BLOCK),
                                block.weight
                            ),
                        });
                    }
                }
                break;
            }
            case BOOK_SECTION_CATEGORIES.MILESTONE: {
                if (section.entry) {
                    pcsList.push({
                        id: this._generatePcsId(),
                        category: section.category,
                        type: PCS_TYPES.MILESTONE,
                        image: section.metadata?.image || null,
                        textKey: section.entry.key,
                        values: section.entry.values || {},
                        weight: clampWeight(
                            getPcsDefaultWeight(PCS_TYPES.MILESTONE),
                            section.entry.weight
                        ),
                    });
                }
                break;
            }
            case BOOK_SECTION_CATEGORIES.VILLAGE_UPDATES: {
                // Title
                pcsList.push({
                    id: this._generatePcsId(),
                    category: section.category,
                    type: PCS_TYPES.VILLAGE_UPDATE_TITLE,
                    image: null,
                    textKey: 'book_village_updates_title',
                    values: { day: section.day || 0 },
                    weight: getPcsDefaultWeight(PCS_TYPES.VILLAGE_UPDATE_TITLE),
                });
                // Bullets
                if (section.entries) {
                    for (const entry of section.entries) {
                        pcsList.push({
                            id: this._generatePcsId(),
                            category: section.category,
                            type: PCS_TYPES.VILLAGE_UPDATE_BULLET,
                            image: null,
                            textKey: entry.key,
                            values: entry.values || {},
                            weight: clampWeight(
                                getPcsDefaultWeight(PCS_TYPES.VILLAGE_UPDATE_BULLET),
                                entry.weight
                            ),
                        });
                    }
                }
                break;
            }
            default:
                break;
        }

        return pcsList;
    }

    /**
     * Get the last page, or create a new one if none exist.
     */
    _getLastPage() {
        if (this.state.pages.length === 0) {
            return this._createNewPage(1);
        }
        return this.state.pages[this.state.pages.length - 1];
    }

    /**
     * Create a new page.
     * @param {number} chapterNumber — The chapter this page belongs to.
     * @returns {Object} — The new page.
     */
    _createNewPage(chapterNumber) {
        const pageNumber = this.state.pages.length + 1;
        const page = {
            pageNumber,
            chapterNumber,
            pageContentSections: [],
            remainingBudget: DEFAULT_PAGE_BUDGET,
        };
        this.state.pages.push(page);
        return page;
    }

    /**
     * Get the current chapter.
     */
    _getCurrentChapter() {
        if (this.state.chapters.length === 0) {
            return this._createNewChapter('book_chapter_1_title');
        }
        return this.state.chapters[this.state.chapters.length - 1];
    }

    /**
     * Create a new chapter.
     * @param {string} titleKey — The i18n key for the chapter title.
     * @returns {Object} — The new chapter.
     */
    _createNewChapter(titleKey) {
        const chapterNumber = this.state.chapters.length + 1;
        const startPageNumber = this.state.pages.length + 1;
        const chapter = {
            chapterNumber,
            startPageNumber,
            titleKey,
        };
        this.state.chapters.push(chapter);
        return chapter;
    }

    // ─── Query API ────────────────────────────────────────────────────

    getPage(pageNumber) {
        if (pageNumber < 1) return null;
        return this.state.pages[pageNumber - 1] || null;
    }

    getSpread(firstPageNumber) {
        if (firstPageNumber < 1 || firstPageNumber % 2 !== 1) return null;
        const left = this.getPage(firstPageNumber);
        const right = this.getPage(firstPageNumber + 1);
        return { left, right };
    }

    getCurrentSpread() {
        return this.getSpread(this.state.lastReadSpread);
    }

    getNextNewSpread() {
        const totalPages = this.state.pages.length;
        if (totalPages === 0) return null;

        // Find the first spread that contains at least one unread PCS
        // Guard: ensure we start on an odd page
        let lastReadSpread = this.state.lastReadSpread;
        if (lastReadSpread % 2 === 0) {
            lastReadSpread = Math.max(1, lastReadSpread - 1);
        }

        for (let pageNum = lastReadSpread; pageNum <= totalPages; pageNum += 2) {
            const spread = this.getSpread(pageNum);
            if (!spread) continue;

            const hasUnread = this._spreadHasUnreadContent(spread);
            if (hasUnread) {
                return spread;
            }
        }

        return null;
    }

    hasUnreadContent() {
        const totalPages = this.state.pages.length;
        if (totalPages === 0) return false;

        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
            const page = this.getPage(pageNum);
            if (!page) continue;
            for (const pcs of page.pageContentSections) {
                if (!pcs.read) return true;
            }
        }
        return false;
    }

    hasAutoOpenContent() {
        const totalPages = this.state.pages.length;
        if (totalPages === 0) return false;

        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
            const page = this.getPage(pageNum);
            if (!page) continue;
            for (const pcs of page.pageContentSections) {
                if (!pcs.read && isPcsAutoOpen(pcs.type)) return true;
            }
        }
        return false;
    }

    markRead(spreadFirstPage) {
        if (spreadFirstPage < 1) return;
        this.state.lastReadSpread = spreadFirstPage;

        // Mark all PCSs on this spread and all previous spreads as read
        for (let pageNum = 1; pageNum <= spreadFirstPage + 1; pageNum++) {
            const page = this.getPage(pageNum);
            if (!page) continue;
            for (const pcs of page.pageContentSections) {
                pcs.read = true;
            }
        }

        this.save();
    }

    markAllRead() {
        for (const page of this.state.pages) {
            for (const pcs of page.pageContentSections) {
                pcs.read = true;
            }
        }
        // Ensure lastReadSpread is always odd (first page of a spread)
        const lastPage = this.state.pages.length;
        this.state.lastReadSpread = lastPage % 2 === 0 ? lastPage - 1 : lastPage;
        this.save();
    }

    getPageCount() {
        return this.state.pages.length;
    }

    getSpreadCount() {
        return Math.ceil(this.state.pages.length / 2);
    }

    getChapterCount() {
        return this.state.chapters.length;
    }

    getPageSectionPage(pageSectionId) {
        const pageSection = this.state.pageSections.find(ps => ps.id === pageSectionId);
        if (!pageSection || pageSection.pages.length === 0) return null;
        return pageSection.pages[0];
    }

    getPageSectionChapter(pageSectionId) {
        const pageSection = this.state.pageSections.find(ps => ps.id === pageSectionId);
        if (!pageSection || pageSection.pages.length === 0) return null;
        const page = this.getPage(pageSection.pages[0]);
        return page ? page.chapterNumber : null;
    }

    getPageSection(pageSectionId) {
        return this.state.pageSections.find(ps => ps.id === pageSectionId) || null;
    }

    // ─── Internal helpers ─────────────────────────────────────────────

    _spreadHasUnreadContent(spread) {
        const pages = [spread.left, spread.right];
        for (const page of pages) {
            if (!page) continue;
            for (const pcs of page.pageContentSections) {
                if (!pcs.read) return true;
            }
        }
        return false;
    }
}
