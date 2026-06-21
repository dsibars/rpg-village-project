# Implementation Plan 3: The Book — Unified Narrative System

> **Phase:** 3 — The Book
>
> **Objective:** Build the Book as the canonical narrative/content surface, refactor the existing `ChronicleService` into a lightweight page-reference index, and redirect existing event hooks to feed the Book.
>
> **Estimated Effort:** 4–5 sessions
>
> **Risk:** Medium-High — touches post-day flow, narrative systems, UI sequencing, and save state shape
>
> **Dependencies:** Shared infrastructure and Vue component system must be in place. The other agent’s work (fatigue, hero actions, village events, market rotation, ChronicleService hooks) must be on the branch.

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

- **The Book becomes the readable log.** It receives every day’s events as structured, localizable sections, lays them out into pages and spreads, and renders them as a real book.
- **The Chronicle becomes an unlock/index view.** It shows the player what major story events and tiny milestones have been unlocked, what is still locked, and where each unlocked entry is narrated in the Book. Clicking an entry opens the Book at the exact page.

The existing `ChronicleService` stores rendered English strings. This conflicts with the Book’s localization-first design. Instead of deleting it or building a competing system, we refactor it into an achievement/index catalog that stores labels, requirements, unlock status, and Book page references — but no narrative text.

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
│  │  - sections (source of truth, i18n keys)              │ │
│  │  - page sections and pages (generated layout)         │ │
│  │  - chapters (owned here)                              │ │
│  │  - persistence                                        │ │
│  └───────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

### Responsibilities

| Service | Responsibility |
|---------|----------------|
| **BookService** | Owns the readable narrative. Receives sections via `addSection()`, runs layout to produce pages and spreads, owns chapter boundaries, and persists both source sections and generated layout. |
| **ChronicleService** | Owns the achievement/index catalog. Each entry has a label, unlock requirement, status, and a Book page reference. It knows *what* the player has achieved; the Book knows *when and how it was narrated*. |
| **GameEngine** | Pushes sections to BookService during `nextDay()` and other event points. Does not decide chapter boundaries. Tells ChronicleService to record a reference when a milestone or unlock has a Chronicle id. |

---

## 3. Scope

### In Scope

- Refactor `ChronicleService` to remove plain-text storage; keep catalog + Book links.
- Create `BookService` as the canonical content store with sections, page sections, pages, spreads, and chapters.
- Create `BookSectionCatalog` for the four category definitions and visual budget rules.
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

### BookSection

The source section pushed by the engine.

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
    image?: string;              // fallback/hero image for milestone
    presentationId?: string;     // for cinematic replay
    chronicleId?: string;        // for Chronicle index linking
    sourceEvent?: string;
  };
}

interface SectionBlock {
  image?: string;
  textKey: string;
  values: Record<string, string | number>;
}

interface SectionEntry {
  key: string;
  values: Record<string, string | number>;
}
```

### PageSection

A rendered piece of a section that fits on one page.

```typescript
interface PageSection {
  id: string;                    // unique page section id
  sectionId: string;             // parent section id
  partIndex: number;             // 0, 1, 2... if section was split
  category: BookSectionCategory;
  day: number;
  blocks?: SectionBlock[];       // subset of blocks, for split history events
  entry?: SectionEntry;          // for milestone
  entries?: SectionEntry[];      // subset of bullets, for split village_updates
  metadata?: BookSection['metadata'];
}
```

### BookPage

```typescript
interface BookPage {
  pageNumber: number;
  chapterNumber: number;
  sections: PageSection[];
  day: number;                   // day of the first section on the page
}
```

### BookState

```typescript
interface BookState {
  sections: BookSection[];       // source sections
  pages: BookPage[];             // generated layout
  lastReadSpread: number;        // 1, 3, 5... (first page of the last read spread)
}

interface BookChapter {
  startPageNumber: number;
  titleKey?: string;
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
    sectionId: string;
    pageNumber: number;
    chapterNumber: number;
  } | null;
}
```

---

## 5. Category Catalog

Only four section categories exist.

| Category | Purpose | Visual treatment | Page break | Auto-open | Splits? |
|----------|---------|------------------|------------|-----------|---------|
| `history_event` | Narrative history event with optional images and multiple text blocks | Illustrated narrative block | `always` | true | Yes, blocks can split across pages |
| `chapter_history_event` | Same as `history_event`, but starts a new chapter. Always begins on a fresh page with "CHAPTER X" title above it. | Illustrated narrative block | `always` | true | Yes, blocks can split across pages |
| `milestone` | Chronicle milestone | Highlighted card with icon | `when-full` | true | No, atomic |
| `village_updates` | Daily enumerated list of small updates | Compact bullet list | `when-full` | false | Yes, bullets can split across pages |

### Visual budget

The BookService uses a deterministic visual budget to decide page breaks.

| Content | Budget cost |
|---------|-------------|
| Chapter title | 2 |
| History event block (image + text) | 6 |
| Milestone | 4 |
| Village update bullet | 1 |

Default page budget: **10 units**.

History event blocks and village update bullets are the splittable units. Milestones are atomic.

---

## 6. Layout Algorithm

When `addSection(section)` is called:

1. **If category is `chapter_history_event`:**
   - Close the current chapter and increment the chapter number.
   - **Start a new page.** Do not reuse the current page for the new chapter.
   - Add the chapter title ("CHAPTER X") to the new page. The title consumes visual budget.
   - Append the `chapter_history_event` blocks below the chapter title on the same page, respecting the remaining budget. If the event does not fit entirely, its blocks continue onto the next page(s).
2. **Convert the section into page section candidates:**
   - `history_event`: one candidate per block.
   - `chapter_history_event`: one candidate per block (title was already handled in step 1).
   - `milestone`: one candidate.
   - `village_updates`: one candidate per bullet.
3. **Fill the current page** with candidates in order until adding the next candidate would exceed the page budget.
4. **When the page is full, start a new page.**
5. **Never reorder candidates.**
6. **Persist** the generated `pages` array.

This makes page numbers stable across languages.

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
  addSection(section: BookSection): { pageNumber: number; chapterNumber: number; sectionId: string };

  getPage(pageNumber: number): BookPage | null;
  getSpread(firstPageNumber: number): { left: BookPage; right: BookPage } | null;
  getCurrentSpread(): { left: BookPage; right: BookPage } | null;
  getNextNewSpread(): { left: BookPage; right: BookPage } | null;
  hasUnreadContent(): boolean;
  hasAutoOpenContent(): boolean;

  markRead(spreadFirstPage: number): void;
  markAllRead(): void;

  getPageCount(): number;
  getSpreadCount(): number;
  getChapterCount(): number;
  getSectionPage(sectionId: string): number | null;
  getSectionChapter(sectionId: string): number | null;
}
```

### Edge cases

- Pages and spreads are 1-indexed; `getPage(0)` returns null.
- Out-of-range page numbers return null.
- Duplicate section ids are made unique by appending a suffix.
- `markRead` advances the read cursor forward only.

---

## 8. ChronicleService API (refactored)

```typescript
class ChronicleService {
  constructor(persistence);

  load(slotIndex?: number): void;
  save(): void;

  registerEntry(entry: ChronicleEntry): void;
  registerEntriesFromCatalog(catalog: Array<{ id, labelKey, requirementKey, category }>): void;

  unlockEntry(chronicleId: string, day: number, bookLink: { sectionId, pageNumber, chapterNumber }): ChronicleEntry;
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
| `js/engine/book/BookSectionCatalog.js` | Create | Four category definitions and visual budget |
| `js/engine/book/BookState.js` | Create | Default state shape |
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
| `ux/features/book/components/BookPage.vue` | Create | Renders one page of page sections |
| `ux/features/book/components/HistoryEventSection.vue` | Create | Renders `history_event` blocks |
| `ux/features/book/components/MilestoneSection.vue` | Create | Renders `milestone` card |
| `ux/features/book/components/VillageUpdatesSection.vue` | Create | Renders `village_updates` bullet list |
| `ux/features/shared/PresentationModal.vue` | Modify | Replay mode driven by Book metadata |
| `ux/features/adventure/components/ChronicleTab.vue` | Refactor | Read Chronicle links; remove chapter grouping; link to Book pages |
| `ux/App.vue` | Modify | Add Book to post-day sequence and top bar; remove DailyReportModal |
| `ux/components/TopBar.vue` | Modify | Add Book button slot |

### Tests

| File | Action | Purpose |
|------|--------|---------|
| `tests/unit/book/BookService.test.js` | Create | Layout, pagination, chapter boundaries, splitting |
| `tests/unit/book/BookSectionCatalog.test.js` | Create | Category configuration |
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

1. Create `js/engine/book/` with `BookSectionCatalog`, `BookState`, `BookService`, `index.js`.
2. Implement the four categories and visual budget.
3. Implement layout algorithm with section splitting.
4. Write unit tests for layout and chapters.
5. Create `book-keys.js` and add keys to all five language files.

### Stage 2: Engine Systems Inject to Book (Chronicle As-Is)

1. Instantiate `BookService` in `GameEngine`.
2. After each existing `chronicleService.recordEntry(...)` call, add `bookService.addSection(...)` with the appropriate category.
3. Add `// TODO(Book)` comments above Chronicle calls for later replacement.
4. Do not remove or modify Chronicle calls yet.

### Stage 3: Book UI + Top Bar Button

1. Create `ux/features/book/` components.
2. Implement two-page spread rendering.
3. Add `BookTopBarButton` to `TopBar.vue`.
4. Wire `App.vue` to open the Book from the top bar.

### Stage 4: UX Polish — Glow, Auto-Open, Animations

1. Implement glow/badge states on `BookTopBarButton`.
2. Implement auto-open after `nextDay()` for sections with `autoOpen: true`.
3. Add page-turn animation between spreads.
4. Quiet days do not auto-open or glow.

### Stage 5: Chronicle Engine Refactor

1. Refactor `ChronicleService.js` to catalog + Book links.
2. Replace `recordEntry()` with `registerEntry()` / `unlockEntry()`.
3. Replace all `// TODO(Book)` Chronicle calls with the new flow: push Book section, then `chronicleService.unlockEntry(...)`.
4. Migrate or discard old plain-text entries.

### Stage 6: ChronicleTab Visual Refactor

1. Remove chapter grouping from milestones.
2. Query `chronicleService.getEntries({ status: 'unlocked' })`.
3. Render label + chapter/page reference.
4. Clicking an entry opens the Book at the linked page.
5. Locked entries show requirement hints.

### Stage 7: Cleanup

1. Remove `DailyReportModal` from `App.vue` and `GameEngine.js`.
2. Add final integration tests.
3. Write `docs/shared/book/book_system.md`.

---

## 11. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Existing `ChronicleService` plain-text entries become orphaned | Discard or summarize old entries on first load |
| Save file bloat | Cap source sections at 500; summarize quiet days beyond 90 days |
| Player annoyance from auto-open | Auto-open only for `history_event` and `chapter_history_event`; glow for `milestone`; silent for `village_updates` |
| i18n key explosion / outdated descriptions | Reuse existing keys; update all five languages |
| Layout breaks on language change | Use deterministic visual budget; UI handles minor overflow gracefully |
| Post-day sequence bugs | Add integration tests covering combat-deferred flow |
| Page numbers drift | Visual budget depends only on section data, not rendering |

---

## 12. Definition of Done

- [ ] `ChronicleService` stores a catalog of entries with labels, requirements, status, and Book links; no day-to-day narrative text.
- [ ] `BookService` is created, tested, and persisted per save slot.
- [ ] Only four section categories exist: `history_event`, `chapter_history_event`, `milestone`, `village_updates`.
- [ ] Layout algorithm splits history events and village updates across pages when needed.
- [ ] `TheBookModal` renders two-page spreads with page-turn animation.
- [ ] `BookTopBarButton` shows glow and badge states correctly.
- [ ] `GameEngine.nextDay()` pushes Book sections instead of Chronicle entries.
- [ ] `DailyHeroActionsService` and `VillageEventsService` return structured, localizable data.
- [ ] `PresentationService` and `UnlockService` push Book sections and record Chronicle links.
- [ ] `DailyReportModal` is no longer shown after day advance.
- [ ] `ChronicleTab` reads Chronicle links and opens the Book at linked pages.
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
