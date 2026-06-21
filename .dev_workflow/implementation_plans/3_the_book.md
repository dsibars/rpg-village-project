# Implementation Plan 3: The Book — Unified Narrative System

> **Phase:** 3 — The Book
>
> **Objective:** Build the Book as the canonical narrative/content surface, refactor the existing `ChronicleService` into a lightweight page-reference index, and redirect existing event hooks to feed the Book.
>
> **Estimated Effort:** 4–5 sessions
>
> **Risk:** Medium-High — touches post-day flow, narrative systems, UI sequencing, and save state shape
>
> **Dependencies:** Shared infrastructure and Vue component system must be in place. The other agent's work (fatigue, hero actions, village events, market rotation, ChronicleService hooks) must be on the branch.

---

## 1. Current State

### What the other agent built

- `js/engine/shared/chronicle/ChronicleService.js` — persistent event log with plain-text `title` and `description`.
- `js/engine/heroes/services/DailyHeroActionsService.js` — daily hero actions with plain-text descriptions.
- `js/engine/village/VillageEventsService.js` — random village events with plain-text titles/descriptions.
- `js/engine/market/MarketService.js` — weekly rotating shop stock.
- `js/engine/GameEngine.js` hooks that record hero recruitment, building completion, village events, hero actions, combat, and expeditions into `ChronicleService`.

### The transition we are making

Currently, the Chronicle is treated as the readable log of what happened each day. This initiative changes that split:

- **The Book becomes the readable log.** It receives every day's events as structured, localizable sections, splits them into PageContentSections, lays them out into pages and spreads, and renders them as a real book.
- **The Chronicle becomes an unlock/index view.** It shows the player what major story events and tiny milestones have been unlocked, what is still locked, and where each unlocked entry is narrated in the Book. Clicking an entry opens the Book at the exact page.

The existing `ChronicleService` stores rendered English strings. This conflicts with the Book's localization-first design. Instead of deleting it or building a competing system, we refactor it into an achievement/index catalog that stores labels, requirements, unlock status, and Book page references — but no narrative text.

---

## 2. Target Architecture

```
┌────────────────────────────────────────────────────────────┐
│  UX Layer                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ ChronicleTab │  │ TheBookModal │  │ Discovery/Unlock│  │
│  │   (index)    │  │  (reader)    │  │    toasts       │  │
│  └──────┬───────┘  └──────┬───────┘  └─────────────────┘  │
└─────────┼─────────────────┼────────────────────────────────┘
          │                 │
          │ catalog + link  │ pages / spreads
          │                 │
┌─────────▼─────────────────┴────────────────────────────────┐
│  Engine Layer                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ChronicleService                                     │  │
│  │  - catalog of entries (labels, requirements, status) │  │
│  │  - milestone / unlock tracking                       │  │
│  │  - Book link (sectionId, page, chapter) per entry    │  │
│  └──────────────────────────────────────────────────────┘  │
│                         ▲                                  │
│                         │ records link when entry unlocks  │
│  ┌──────────────────────┴────────────────────────────────┐ │
│  │ BookService                                           │ │
│  │  - chapters (chapterNumber, startPage, titleKey)      │ │
│  │  - pages (pageNumber, chapterNumber, PCSs[])          │ │
│  │  - pageSections (metadata: id, category, day, pages)  │ │
│  │  - persistence                                        │ │
│  └───────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

### Responsibilities

| Service | Responsibility |
|---------|----------------|
| **BookService** | Owns the readable narrative. Receives sections via `addSection()`, splits them into PageContentSections, runs layout to produce pages and spreads, owns chapter boundaries, and persists the complete layout (chapters, pages, pageSections). |
| **ChronicleService** | Owns the achievement/index catalog. Each entry has a label, unlock requirement, status, and a Book page reference. It knows *what* the player has achieved; the Book knows *when and how it was narrated*. |
| **GameEngine** | Pushes sections to BookService during `nextDay()` and other event points. Does not decide chapter boundaries. Tells ChronicleService to record a reference when a milestone or unlock has a Chronicle id. |

---

## 3. Scope

### In Scope

- Refactor `ChronicleService` to remove plain-text storage; keep catalog + Book links.
- Create `BookService` as the canonical content store with chapters, pages, PageContentSections, and PageSections.
- Create `BookSectionCatalog` for the four section categories and PageContentSection type definitions.
- Create Book UI components (`TheBookModal.vue`, `BookTopBarButton.vue`, `useBook.js`).
- Refactor existing `GameEngine.js` hooks to push Book sections instead of Chronicle entries.
- Refactor `DailyHeroActionsService` to return structured results (not English descriptions).
- Refactor `VillageEventsService` event definitions to use i18n keys instead of plain text.
- Remove `DailyReportModal` from the post-day flow; its content becomes `village_updates` sections.
- Update `ChronicleTab.vue` to read from `ChronicleService` references and link to Book pages.
- Add Book translation keys to all language files.
- Add unit tests for `BookService` layout/chapters and Vue tests for Book components.
- Create the game design doc in `docs/shared/book/book_system.md`.

### Out of Scope

- Removing `PresentationModal.vue`. It is reused for replaying first-run cinematics linked from the Book.
- Rewriting the Chronicle UI from scratch. Only refactor it to use the new reference model.
- Save-file migration from old `ChronicleService` plain-text entries (can be discarded or summarized later).

---

## 4. Data Model

### Engine-Pushed Section (BookSection)

The input from the engine to `addSection()`.

```typescript
interface BookSection {
  id: string;
  category: BookSectionCategory; // 'history_event' | 'chapter_history_event' | 'milestone' | 'village_updates'
  day: number;
  blocks?: SectionBlock[];       // for history_event / chapter_history_event
  entry?: SectionEntry;          // for milestone
  entries?: SectionEntry[];      // for village_updates
  metadata?: {
    titleKey?: string;           // chapter title, if this section starts a chapter
    presentationId?: string;     // for cinematic replay
    chronicleId?: string;        // for Chronicle index linking
  };
}

interface SectionBlock {
  image?: string;
  textKey: string;
  values: Record<string, string | number>;
  weight?: number;              // optional override for the block's visual budget
}

interface SectionEntry {
  key: string;
  values: Record<string, string | number>;
  weight?: number;              // optional override for the bullet's visual budget
}
```

### PageContentSection (Atomic Renderable Unit)

The output of the BookService's splitting process. Each PCS is a self-contained piece of content that fits on one page.

```typescript
interface PageContentSection {
  id: string;                    // unique PCS id (e.g., 'pcs_abc123')
  category: BookSectionCategory; // 'history_event' | 'chapter_history_event' | 'milestone' | 'village_updates'
  type: PCSType;                 // 'chapter_title' | 'history_block' | 'milestone' | 'village_update_title' | 'village_update_bullet'
  image?: string;                // optional image path
  textKey: string;               // i18n key for rendering
  values: Record<string, string | number>; // interpolation values
  weight: number;                // visual budget cost
  pageSectionId: string;         // links back to the parent PageSection
}
```

### Page

```typescript
interface Page {
  pageNumber: number;            // 1-indexed, continuous
  chapterNumber: number;         // which chapter this page belongs to
  pageContentSections: PageContentSection[];
}
```

### Chapter

```typescript
interface Chapter {
  chapterNumber: number;         // 1, 2, 3...
  startPageNumber: number;       // first page of this chapter
  titleKey?: string;             // i18n key for the chapter title (e.g., 'book_chapter_1_title')
}
```

### PageSection (Metadata)

Tracks a single engine-pushed section across the Book. Used by the Chronicle for linking.

```typescript
interface PageSection {
  id: string;                    // original section id from the engine
  category: BookSectionCategory;
  day: number;
  pages: number[];               // page numbers where this section appears (e.g., [5, 6])
  pageContentSectionIds: string[]; // IDs of all PCSs belonging to this section
}
```

### BookState

```typescript
interface BookState {
  chapters: Chapter[];
  pages: Page[];
  pageSections: PageSection[];
  lastReadSpread: number;        // 1, 3, 5... (first page of the last read spread)
}
```

### ChronicleService State (refactored)

```typescript
interface ChronicleState {
  entries: ChronicleEntry[];
  milestones: string[]; // ids of recorded milestones (deduplication)
}

interface ChronicleEntry {
  id: string;
  labelKey: string;
  requirementKey: string;
  category: ChronicleCategory;
  status: 'locked' | 'unlocked' | 'pending';
  dayUnlocked: number | null;
  bookLink: {
    pageSectionId: string;
    pageNumber: number;
    chapterNumber: number;
  } | null;
}
```

---

## 5. PageContentSection Type Catalog

Only four section categories exist, but they split into five rendering types.

| Category | PCS Type | Purpose | Visual Treatment | Default Weight | Overridable? | Auto-open |
|----------|----------|---------|------------------|----------------|--------------|-----------|
| `chapter_history_event` | `chapter_title` | Chapter heading ("CHAPTER X") | Large banner title | 2 | No | — |
| `chapter_history_event` | `history_block` | Narrative block from the event | Illustrated narrative block (image + text) | 6 | Yes (per block) | true |
| `history_event` | `history_block` | Narrative block from the event | Illustrated narrative block (image + text) | 6 | Yes (per block) | true |
| `milestone` | `milestone` | Chronicle milestone | Highlighted card with icon | 4 | Yes | true |
| `village_updates` | `village_update_title` | Section heading (e.g., "Day 5") | Subheading | 2 | No | false |
| `village_updates` | `village_update_bullet` | Individual update bullet | Compact bullet | 1 | Yes (per entry) | false |

**Page budget:** 10 units per page.

**Splittable units:** `history_block` and `village_update_bullet` can be split across pages. `chapter_title`, `milestone`, and `village_update_title` are atomic.

---

## 6. Layout Algorithm

When `addSection(engineSection)` is called:

### 6.1 Split the Engine Section into PageContentSections

1. **Guard: reject empty sections.** If a `history_event` or `chapter_history_event` has no `blocks`, the BookService skips it entirely. No PageSection or PageContentSections are created. This prevents orphaned empty metadata.

2. **If `category === 'chapter_history_event'`:**
   - Create a `chapter_title` PCS with `weight: 2`, `textKey: engineSection.metadata.titleKey || 'book_chapter_default_title'`.
   - For each block in `engineSection.blocks`, create a `history_block` PCS with `weight: block.weight || 6`.

3. **If `category === 'history_event'`:**
   - For each block in `engineSection.blocks`, create a `history_block` PCS with `weight: block.weight || 6`.

4. **If `category === 'milestone'`:**
   - Create a single `milestone` PCS with `weight: engineSection.entry.weight || 4`.

5. **If `category === 'village_updates'`:**
   - Create a `village_update_title` PCS with `weight: 2`, `textKey: 'book_village_updates_title'` (interpolated with day).
   - For each entry in `engineSection.entries`, create a `village_update_bullet` PCS with `weight: entry.weight || 1`.

### 6.2 Create a PageSection

```typescript
const pageSection = {
  id: engineSection.id,
  category: engineSection.category,
  day: engineSection.day,
  pages: [],
  pageContentSectionIds: [],
};
```

### 6.3 Place Each PCS in Order

```
let currentPage = getLastPageOrCreateNew();
let currentChapter = getCurrentChapter();

for each pcs in pageContentSections:
  if (pcs.type === 'chapter_title'):
    // Close current chapter and start new one
    currentChapter = createNewChapter(pcs.textKey);
    // Start a new page for the chapter title
    currentPage = createNewPage(currentChapter.chapterNumber);
  
  // Guard: if a single PCS exceeds the page budget, allow overflow rather than looping
  if (pcs.weight > pageBudget):
    // Force the PCS onto its own page, even if it exceeds the budget
    if (currentPage.pageContentSections.length > 0):
      currentPage = createNewPage(currentChapter.chapterNumber);
    currentPage.pageContentSections.push(pcs);
    // Do not deduct weight; overflow is allowed for single oversized PCSs
  else if (currentPage.remainingBudget >= pcs.weight):
    currentPage.pageContentSections.push(pcs);
    currentPage.remainingBudget -= pcs.weight;
  else:
    // Start a new page
    currentPage = createNewPage(currentChapter.chapterNumber);
    currentPage.pageContentSections.push(pcs);
    currentPage.remainingBudget -= pcs.weight;
  
  // Record in PageSection
  if (!pageSection.pages.includes(currentPage.pageNumber)):
    pageSection.pages.push(currentPage.pageNumber);
  pageSection.pageContentSectionIds.push(pcs.id);
```

### 6.4 Persist

Store the updated `BookState` (chapters, pages, pageSections) via `persistence`.

---

## 7. BookService API

```typescript
class BookService {
  constructor(persistence);

  load(slotIndex?: number): void;
  save(): void;
  getState(): BookState;
  setState(state: BookState): void;

  // Single public entry point
  addSection(section: BookSection): { pageSectionId: string; pages: number[]; chapterNumber: number };

  getPage(pageNumber: number): Page | null;
  getSpread(firstPageNumber: number): { left: Page; right: Page } | null;
  getCurrentSpread(): { left: Page; right: Page } | null;
  getNextNewSpread(): { left: Page; right: Page } | null;
  hasUnreadContent(): boolean;
  hasAutoOpenContent(): boolean;

  markRead(spreadFirstPage: number): void;
  markAllRead(): void;

  getPageCount(): number;
  getSpreadCount(): number;
  getChapterCount(): number;
  getPageSectionPage(pageSectionId: string): number | null;
  getPageSectionChapter(pageSectionId: string): number | null;
  getPageSection(pageSectionId: string): PageSection | null;
}
```

### Edge cases

- Pages and spreads are 1-indexed; `getPage(0)` returns null.
- Out-of-range page numbers return null.
- Duplicate section ids are made unique by appending a suffix.
- `markRead` advances the read cursor forward only.
- `hasUnreadContent()` returns true if any PCS has been added since the last read spread.
- `hasAutoOpenContent()` returns true if any PCS with `autoOpen: true` category has been added since the last read spread.
- **Overflow guard:** If a single PCS has `weight > pageBudget`, the layout algorithm places it on its own page and allows it to overflow rather than looping or dropping it.
- **Empty section guard:** If a `history_event` or `chapter_history_event` has zero blocks, `addSection()` skips it entirely and returns `null` (no PageSection created).

---

## 8. ChronicleService API (refactored)

```typescript
class ChronicleService {
  constructor(persistence);

  load(slotIndex?: number): void;
  save(): void;

  registerEntry(entry: ChronicleEntry): void;
  registerEntriesFromCatalog(catalog: Array<{ id, labelKey, requirementKey, category }>): void;

  unlockEntry(chronicleId: string, day: number, bookLink: { pageSectionId, pageNumber, chapterNumber }): ChronicleEntry;
  setPending(chronicleId: string): void;

  hasMilestone(milestoneId: string): boolean;
  recordMilestone(milestoneId: string): void;

  getEntry(chronicleId: string): ChronicleEntry | null;
  getEntries(options?: { category?, status?, dayMin?, dayMax?, limit? }): ChronicleEntry[];
  getStats(): { totalEntries, byCategory, byStatus, milestones };
}
```

### Catalog sources

The Chronicle catalog is initialized from:

1. `PresentationCatalog` → `milestone` entries.
2. `UnlockNarratives` → `unlock` entries.
3. Optional entries for major village events / hero actions if they should appear as tracked achievements.

---

## 9. Files to Create / Modify

### Engine

| File | Action | Purpose |
|------|--------|---------|
| `js/engine/book/BookService.js` | Create | Layout engine, pagination, chapters, persistence |
| `js/engine/book/BookSectionCatalog.js` | Create | Four section categories and five PCS type definitions |
| `js/engine/book/index.js` | Create | Public exports |
| `js/engine/shared/chronicle/ChronicleService.js` | Refactor | Catalog + Book links, no plain text |
| `js/engine/shared/core/i18n/book-keys.js` | Create | Translation key registry |
| `js/engine/GameEngine.js` | Modify | Push Book sections; redirect Chronicle hooks; remove daily report modal trigger |
| `js/engine/heroes/services/DailyHeroActionsService.js` | Modify | Return structured results, not English descriptions |
| `js/engine/village/VillageEventsService.js` | Modify | Event definitions use i18n keys |
| `js/engine/shared/services/PresentationService.js` | Modify | Push `history_event` / `chapter_history_event` / `milestone` sections; record Chronicle link |
| `js/engine/shared/services/UnlockService.js` | Modify | Push Book sections; record Chronicle link |
| `js/engine/explore/services/ExpeditionService.js` | Modify | Push Book sections for expedition/combat events |

### UI

| File | Action | Purpose |
|------|--------|---------|
| `ux/features/book/TheBookModal.vue` | Create | Book reading UI with two-page spreads |
| `ux/features/book/BookTopBarButton.vue` | Create | Top-bar button with glow/badge states |
| `ux/features/book/composables/useBook.js` | Create | Reactive access to Book state and navigation |
| `ux/features/book/components/BookSpread.vue` | Create | Renders left + right pages |
| `ux/features/book/components/BookPage.vue` | Create | Renders one page of PageContentSections |
| `ux/features/book/components/BookChapterTitle.vue` | Create | Renders `chapter_title` PCS |
| `ux/features/book/components/BookHistoryBlock.vue` | Create | Renders `history_block` PCS |
| `ux/features/book/components/BookMilestoneCard.vue` | Create | Renders `milestone` PCS |
| `ux/features/book/components/BookVillageUpdateTitle.vue` | Create | Renders `village_update_title` PCS |
| `ux/features/book/components/BookVillageUpdateBullet.vue` | Create | Renders `village_update_bullet` PCS |
| `ux/features/shared/PresentationModal.vue` | Modify | Replay mode driven by Book metadata |
| `ux/features/adventure/components/ChronicleTab.vue` | Refactor | Read Chronicle links; remove chapter grouping; link to Book pages |
| `ux/App.vue` | Modify | Add Book to post-day sequence and top bar; remove DailyReportModal |
| `ux/components/TopBar.vue` | Modify | Add Book button slot |

### Tests

| File | Action | Purpose |
|------|--------|---------|
| `tests/unit/book/BookService.test.js` | Create | Layout, pagination, chapter boundaries, PCS splitting |
| `tests/unit/book/BookSectionCatalog.test.js` | Create | Category and PCS type configuration |
| `tests/unit/shared/chronicle/ChronicleService.test.js` | Create | Catalog + Book links |
| `tests/vue/book/TheBookModal.spec.js` | Create | Rendering and navigation |
| `tests/vue/book/BookTopBarButton.spec.js` | Create | Glow and badge states |
| `tests/unit/engine/GameEngine.nextDay.book.test.js` | Create | Book section generation |

### Docs

| File | Action | Purpose |
|------|--------|---------|
| `docs/shared/book/book_system.md` | Create | Game design spec |

---

## 10. Staged Implementation Plan

### Stage 1: Book Engine + Translations

1. Create `js/engine/book/` with `BookSectionCatalog`, `BookService`, `index.js`.
2. Implement the four section categories and five PCS types with default weights.
3. Implement layout algorithm with PCS splitting, page filling, and chapter boundaries.
4. Write unit tests for layout, chapter boundaries, and PCS splitting.
5. Create `book-keys.js` and add keys to all five language files.

**Verify:** BookService can be instantiated, sections added, pages and PageSections retrieved. Chronicle untouched. UI unchanged.

---

### Stage 2: Engine Systems Inject to Book (Chronicle As-Is)

1. Instantiate `BookService` in `GameEngine`.
2. After each existing `chronicleService.recordEntry(...)` call, add `bookService.addSection(...)` with the appropriate category.
3. Add `// TODO(Book)` comments above Chronicle calls for later replacement.
4. Do not remove or modify Chronicle calls yet.

**Verify:** Game still works exactly as before. Book state is saved but never read by UI. Chronicle entries still appear as before. Build passes, tests pass.

---

### Stage 3: Book UI + Top Bar Button

1. Create `ux/features/book/` components.
2. Implement two-page spread rendering with PCS components (`BookChapterTitle`, `BookHistoryBlock`, `BookMilestoneCard`, `BookVillageUpdateTitle`, `BookVillageUpdateBullet`).
3. Add `BookTopBarButton` to `TopBar.vue`.
4. Wire `App.vue` to open the Book from the top bar.

**Verify:** Player can click top-bar button, Book opens, pages render with correct PCS content. Chronicle still works. No auto-open or glow yet.

---

### Stage 4: UX Polish — Glow, Auto-Open, Animations

1. Implement glow/badge states on `BookTopBarButton` based on `hasUnreadContent()` and `hasAutoOpenContent()`.
2. Implement auto-open after `nextDay()` for sections with auto-open categories (`history_event`, `chapter_history_event`, `milestone`).
3. Add page-turn animation between spreads.
4. Quiet days (`village_updates` only) do not auto-open or glow.

**Verify:** Day advance triggers glow or auto-open correctly. Quiet days are silent. Animations smooth. Chronicle still works.

---

### Stage 5: Chronicle Engine Refactor

1. Refactor `ChronicleService.js` to catalog + Book links.
2. Replace `recordEntry()` with `registerEntry()` / `unlockEntry()`.
3. Replace all `// TODO(Book)` Chronicle calls with the new flow: push Book section, get `pageSectionId` and `pages`, then `chronicleService.unlockEntry(id, day, { pageSectionId, pageNumber, chapterNumber })`.
4. Migrate or discard old plain-text entries.

**Verify:** Chronicle catalog entries have Book links. Clicking Chronicle entry (in next stage) jumps to correct page.

---

### Stage 6: ChronicleTab Visual Refactor

1. Remove chapter grouping from milestones.
2. Query `chronicleService.getEntries({ status: 'unlocked' })`.
3. Render label + chapter/page reference (e.g., *"First boss defeated — Ch. 1, P. 12"*).
4. Clicking an entry opens `TheBookModal` at linked page using `bookService.getPageSectionPage(pageSectionId)`.
5. Locked entries show requirement hints.

**Verify:** ChronicleTab shows catalog entries, links jump to Book pages. Both systems fully integrated.

---

### Stage 7: Cleanup

1. Remove `DailyReportModal` from `App.vue` and `GameEngine.js`.
2. Add final integration tests.
3. Write `docs/shared/book/book_system.md`.

**Verify:** Full playthrough test. No DailyReportModal. Book auto-opens on dramatic days. Chronicle links work. Save/load stable.

---

## 11. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Existing `ChronicleService` plain-text entries become orphaned | Discard or summarize old entries on first load |
| Save file bloat | Cap total PCSs at 2000; summarize quiet days beyond 90 days |
| Player annoyance from auto-open | Auto-open only for `history_event` and `chapter_history_event`; glow for `milestone`; silent for `village_updates` |
| i18n key explosion / outdated descriptions | Reuse existing keys; update all five languages |
| Layout breaks on language change | Use deterministic visual budget; UI handles minor overflow gracefully |
| Post-day sequence bugs | Add integration tests covering combat-deferred flow |
| Page numbers drift | Visual budget depends only on section data, not rendering |
| PCS weight overrides break layout | Clamp overrides to a reasonable range (e.g., 0.5x to 2x default). Allow overflow for single PCSs that exceed page budget. |
| Single PCS exceeds page budget | Layout algorithm places it on its own page and allows overflow rather than looping or dropping it. |
| Empty history_event with no blocks | `addSection()` skips the section entirely and returns `null`. No orphaned metadata created. |

---

## 12. Definition of Done

- [ ] `ChronicleService` stores a catalog of entries with labels, requirements, status, and Book links; no day-to-day narrative text.
- [ ] `BookService` is created, tested, and persisted per save slot.
- [ ] Only four section categories exist: `history_event`, `chapter_history_event`, `milestone`, `village_updates`.
- [ ] Layout algorithm splits engine sections into PageContentSections, places them on pages using weight-based budget, and handles overflow for single PCSs that exceed the page budget.
- [ ] Empty sections (e.g., `history_event` with no blocks) are skipped without creating orphaned metadata.
- [ ] `TheBookModal` renders two-page spreads with page-turn animation.
- [ ] `BookTopBarButton` shows glow and badge states correctly.
- [ ] `GameEngine.nextDay()` pushes Book sections instead of Chronicle entries.
- [ ] `DailyHeroActionsService` and `VillageEventsService` return structured, localizable data.
- [ ] `PresentationService` and `UnlockService` push Book sections and record Chronicle links.
- [ ] `DailyReportModal` is no longer shown after day advance.
- [ ] `ChronicleTab` reads Chronicle links and opens the Book at linked pages via `pageSectionId`.
- [ ] All required translation keys exist in every language file.
- [ ] Player-facing descriptions that reference the Chronicle or Book are updated in all five languages.
- [ ] `docs/shared/book/book_system.md` is written as a game design spec.
- [ ] Unit and Vue tests pass.

---

## 13. Open Design Questions

1. Should old `chronicle_state` entries be cleared on first load, or left inert?
2. Should `history_event` sections embed the cinematic inline or only link to it?
3. What is the exact page budget? (Proposed: 10 units.)
4. Which specific events are `chapter_history_event`? We need a definitive list.
5. Should the Book top-bar button jump to the latest spread, the first unread spread, or the last read spread?
6. Should village update bullet weights be exposed to the engine, or always use the default?
