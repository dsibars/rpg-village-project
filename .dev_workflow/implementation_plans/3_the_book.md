# Implementation Plan 3: The Book — Unified Narrative System

> **Phase:** 3 — The Book
>
> **Objective:** Build the Book as the canonical narrative/content surface, refactor the existing `ChronicleService` into a lightweight page-reference index, and redirect existing event hooks to feed the Book.
>
> **Estimated Effort:** 3–4 sessions
>
> **Risk:** Medium — touches post-day flow, narrative systems, and the existing ChronicleService
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

- **The Book becomes the readable log.** It receives every day’s events as structured, localizable sections and renders them as pages.
- **The Chronicle becomes an unlock/index view.** It shows the player what major story events and tiny milestones have been unlocked, what is still locked, and where each unlocked entry is narrated in the Book. Clicking an entry opens the Book at the exact page.

The existing `ChronicleService` stores rendered English strings. This conflicts with the Book’s localization-first design. Instead of deleting it or building a competing system, we refactor it into an achievement/index catalog that stores labels, requirements, unlock status, and Book page references — but no narrative text.

---

## 2. Target Architecture

```
┌─────────────────────────────────────┐
│  UX Layer                           │
│  ┌──────────────┐  ┌──────────────┐ │
│  │ ChronicleTab │  │ TheBookModal │ │
│  │   (index)    │  │  (reader)    │ │
│  └──────┬───────┘  └──────┬───────┘ │
└─────────┼─────────────────┼─────────┘
          │                 │
          │ references      │ pages
          │                 │
┌─────────▼─────────────────┴─────────┐
│  Engine Layer                       │
│  ┌────────────────────────────────┐ │
│  │ ChronicleService               │ │
│  │  - chronicleId -> sectionId    │ │
│  │  - chapter/page references     │ │
│  │  - milestone deduplication     │ │
│  └────────────────────────────────┘ │
│              ▲                      │
│              │ records link         │
│  ┌───────────┴────────────────────┐ │
│  │ BookService                    │ │
│  │  - sections (i18n keys)        │ │
│  │  - pages and chapters          │ │
│  │  - persistence                 │ │
│  └────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Responsibilities

| Service | Responsibility |
|---------|----------------|
| **BookService** | Owns all narrative content. Stores sections with i18n keys, decides pages/chapters, renders history. |
| **ChronicleService** | Lightweight index. Maps Chronicle entry ids (milestones, unlocks, etc.) to Book section ids and page numbers. Provides deduplication for milestones. |
| **GameEngine** | Pushes sections to BookService during `nextDay()` and other event points. Tells ChronicleService to record a reference when a milestone has a Chronicle id. |

---

## 3. Scope

### In Scope

- Refactor `ChronicleService` to remove plain-text storage; keep only references.
- Create `BookService` as the canonical content store with sections, pages, and chapters.
- Create `BookSectionCatalog` for category behavior.
- Create Book UI components (`TheBookModal.vue`, `BookTopBarButton.vue`, `useBook.js`).
- Refactor existing `GameEngine.js` hooks to push Book sections instead of Chronicle entries.
- Refactor `DailyHeroActionsService` to return structured results (not English descriptions).
- Refactor `VillageEventsService` event definitions to use i18n keys.
- Remove `DailyReportModal` from the post-day flow; its content becomes Book sections.
- Update `ChronicleTab.vue` to read from `ChronicleService` references and link to Book pages.
- Add Book translation keys to all language files.
- Add unit tests for `BookService` and Vue tests for Book components.
- Create the game design doc in `docs/shared/book/book_system.md`.

### Out of Scope

- Removing `PresentationModal.vue`. It is reused for replaying first-run cinematics linked from the Book.
- Rewriting the Chronicle UI from scratch. Only refactor it to use the new reference model.
- Save-file migration from old `ChronicleService` plain-text entries (can be discarded or summarized later).

---

## 4. Data Model

### BookSection

```typescript
interface BookSection {
  id: string;
  category: SectionCategory;
  day: number;
  entries: SectionEntry[];
  metadata?: {
    image?: string;
    presentationId?: string;  // for cinematic replay
    chronicleId?: string;     // for Chronicle index linking
    sourceEvent?: string;
  };
}

interface SectionEntry {
  key: string;
  values: Record<string, string | number>;
}
```

### BookState

```typescript
interface BookState {
  sections: BookSection[];
  chapters: BookChapter[];
  lastReadPage: number;
  lastReadSectionId: string | null;
}

interface BookChapter {
  startSectionIndex: number;
  startPageNumber: number;
  titleKey?: string;
}
```

### Chapter Trigger Rules

Chapters are **never** closed by the Book automatically. Only the engine can close a chapter, and only in response to a **key story event**.

**What closes a chapter:**
- A `story_event` section with `chapterBoundary: true` (e.g., a presentation firing for the first time).
- A major unlock that the design team has explicitly flagged as a chapter boundary (e.g., unlocking magic, building the first Arcane Sanctum, discovering Body Inscription).
- Manual engine call: `bookService.closeChapter(titleKey)`.

**What does NOT close a chapter:**
- Reaching a page limit.
- Calendar boundaries (day 30, day 60, etc.).
- Routine events: combat, construction, resource changes, hero actions, recruitment, market rotation.
- Milestones that are not story-critical (e.g., *"First hero reached level 5"* is a milestone, not a chapter boundary).

**Chapter title behavior:**
- When `closeChapter(titleKey)` is called, the Book records the title key and the closing day.
- The title is rendered as: `{chapter_title} — {book_closed_on_day} {day_number}` (e.g., *"Chapter 2: The Arcane Age — closed on Day 47"*).
- If no `titleKey` is provided, the Book uses a generic fallback (`book_chapter_end_fallback`).

**Engine responsibility:**
`GameEngine` (or `PresentationService` / `UnlockService`) decides when a chapter closes. The Book service only records the boundary. This keeps chapter logic centralized in the game-flow layer, not scattered in the UI layer.

---

### ChronicleService State (refactored)

```typescript
interface ChronicleState {
  entries: ChronicleEntry[];
  milestones: string[]; // ids of recorded milestones (deduplication)
}

interface ChronicleEntry {
  id: string;                        // e.g., presentation id, narrative id, event id
  labelKey: string;                  // i18n key shown in the Chronicle list
  requirementKey: string;            // i18n key for the locked-state hint
  category: ChronicleCategory;       // 'milestone' | 'unlock' | 'event' | 'hero' | 'village' | 'combat' | 'expedition'
  status: 'locked' | 'unlocked' | 'pending';
  dayUnlocked: number | null;
  bookLink: {
    sectionId: string;
    pageNumber: number;
    chapterNumber: number;
  } | null;
}

type ChronicleCategory = 'milestone' | 'unlock' | 'event' | 'hero' | 'village' | 'combat' | 'expedition';
```

Chronicle entries store their own catalog data: label, requirement hint, and unlock status. They do **not** store the day-to-day narrative text; that lives in Book sections. Each unlocked entry also stores a link to the Book page where it first appeared, so the Chronicle can jump to the exact page.

### Category configuration

```typescript
interface CategoryConfig {
  pageBreak: 'always' | 'when-full' | 'never';
  autoOpen: boolean;
  chapterBoundary: boolean;
  visualStyle: 'banner' | 'card' | 'compact' | 'list';
  maxSectionsPerPage?: number;
}
```

### Concrete category catalog

| Category | pageBreak | autoOpen | chapterBoundary | visualStyle | Source |
|----------|-----------|----------|-----------------|-------------|--------|
| `story_event` | `always` | true | true | `banner` | Presentations |
| `milestone` | `when-full` | true | false | `card` | First-time events |
| `village_event` | `when-full` | true | false | `card` | `VillageEventsService` |
| `hero_action` | `never` | false | false | `compact` | `DailyHeroActionsService` |
| `construction` | `when-full` | false | false | `card` | Building completion |
| `hero_progress` | `never` | false | false | `compact` | Level up, training, recovery |
| `expedition` | `when-full` | false | false | `card` | Expedition results |
| `combat` | `never` | false | false | `compact` | Combat summaries |
| `raid` | `always` on defeat, `when-full` otherwise | true on defeat | false | `card` | Raid results |
| `resource_change` | `never` | false | false | `compact` | Food, gold, wood, stone, iron |
| `supply` | `never` | false | false | `compact` | Expedition rations/food consumption |
| `recruitment` | `when-full` | false | false | `card` | Hero recruitment |
| `unlock` | `never` | false | false | `compact` | Narrative/codex discoveries |
| `market_rotation` | `when-full` | false | false | `card` | Weekly shop restock |
| `daily_summary` | `never` | false | false | `list` | Quiet day fallback |

Page budget:

- Default maximum sections per page: `4`.
- `always` starts a new page.
- `when-full` starts a new page if adding would exceed the budget.
- `never` fills the current page.

> **Chapter boundary note:** `chapterBoundary: true` on a category is a hint that sections of this type *can* close a chapter, but the Book **never** auto-closes. The engine must explicitly call `bookService.closeChapter(titleKey)` when pushing a section that should end a chapter. Only `story_event` categories should trigger this in practice; all other categories keep `chapterBoundary: false`.

Pagination is deterministic and depends only on section order and categories.

---

## 5. BookService API

```typescript
class BookService {
  constructor(persistence);

  load(slotIndex?: number): void;
  save(): void;
  getState(): BookState;
  setState(state: BookState): void;

  addSection(section: BookSection): { pageNumber: number; chapterNumber: number; sectionId: string };
  closeChapter(titleKey?: string): void;

  getPage(pageNumber: number): BookPage | null;
  getCurrentPage(): BookPage;
  getNextNewPage(): BookPage | null;
  hasUnreadContent(): boolean;
  hasAutoOpenContent(): boolean;

  markRead(pageNumber: number): void;
  markAllRead(): void;

  getPageCount(): number;
  getChapterCount(): number;
  getSectionPage(sectionId: string): number | null;
  getSectionChapter(sectionId: string): number | null;
}

interface BookPage {
  pageNumber: number;
  chapterNumber: number;
  sections: BookSection[];
  day: number;
}
```

### Edge cases

- Pages are 1-indexed; `getPage(0)` returns null.
- Out-of-range page numbers return null.
- Duplicate section ids are made unique by appending a suffix.
- `markRead` only advances the read cursor forward, never backward.

---

## 6. ChronicleService API (refactored)

```typescript
class ChronicleService {
  constructor(persistence);

  load(slotIndex?: number): void;
  save(): void;

  // Catalog initialization
  registerEntry(entry: ChronicleEntry): void;
  registerEntriesFromCatalog(catalog: Array<{ id, labelKey, requirementKey, category }>): void;

  // Unlock + Book link
  unlockEntry(chronicleId: string, day: number, bookLink: { sectionId, pageNumber, chapterNumber }): ChronicleEntry;
  setPending(chronicleId: string): void;

  // Milestone deduplication
  hasMilestone(milestoneId: string): boolean;
  recordMilestone(milestoneId: string): void;

  // Queries
  getEntry(chronicleId: string): ChronicleEntry | null;
  getEntries(options?: { category?, status?, dayMin?, dayMax?, limit? }): ChronicleEntry[];
  getStats(): { totalEntries, byCategory, byStatus, milestones };
}
```

The ChronicleService keeps its own catalog with labels, requirements, and unlock status. It also records, for each unlocked entry, the Book section and page where it was narrated.

### Catalog sources

The Chronicle catalog is initialized from:

1. `PresentationCatalog` → `milestone` entries (label from presentation id, requirement from trigger hint).
2. `UnlockNarratives` → `unlock` entries (label from `titleKey`, requirement from predicate description or a dedicated hint key).
3. Optional new entries for major village events / hero actions if they should appear as tracked achievements.

`GameEngine` calls `unlockEntry(id, day, bookLink)` when a presentation is seen or a narrative is unlocked.

---

## 7. Files to Create / Modify

### Engine

| File | Action | Purpose |
|------|--------|---------|
| `js/engine/book/BookService.js` | Create | Canonical content store: sections, pages, chapters, persistence |
| `js/engine/book/BookSectionCatalog.js` | Create | Category definitions and rendering hints |
| `js/engine/book/BookState.js` | Create | Default state shape |
| `js/engine/book/index.js` | Create | Public exports |
| `js/engine/shared/chronicle/ChronicleService.js` | Refactor | Replace plain-text entries with a catalog of entries (labels, requirements, status) plus Book links |
| `js/engine/shared/core/i18n/book-keys.js` | Create | Translation key registry for Book sections |
| `js/engine/GameEngine.js` | Modify | Push Book sections; redirect existing Chronicle hooks; remove daily report modal trigger |
| `js/engine/heroes/services/DailyHeroActionsService.js` | Modify | Return structured results, not English descriptions |
| `js/engine/village/VillageEventsService.js` | Modify | Event definitions use i18n keys instead of plain text |
| `js/engine/shared/services/PresentationService.js` | Modify | Push Book section on trigger; record Chronicle link |
| `js/engine/shared/services/UnlockService.js` | Modify | Push Book section when narrative/codex shown; record Chronicle link |
| `js/engine/explore/services/ExpeditionService.js` | Modify | Push Book sections for expedition/combat events |

### UI

| File | Action | Purpose |
|------|--------|---------|
| `ux/features/book/TheBookModal.vue` | Create | Main Book reading UI |
| `ux/features/book/BookTopBarButton.vue` | Create | Top-bar button with glow/badge states |
| `ux/features/book/composables/useBook.js` | Create | Reactive access to Book state and navigation |
| `ux/features/book/components/BookSectionBanner.vue` | Create | Renderer for `banner` sections |
| `ux/features/book/components/BookSectionCard.vue` | Create | Renderer for `card` sections |
| `ux/features/book/components/BookSectionCompact.vue` | Create | Renderer for `compact` sections |
| `ux/features/book/components/BookSectionList.vue` | Create | Renderer for `list` sections |
| `ux/features/shared/PresentationModal.vue` | Modify | Replay mode driven by Book metadata |
| `ux/features/adventure/components/ChronicleTab.vue` | Refactor | Read Chronicle links; remove chapter grouping; link to Book pages |
| `ux/App.vue` | Modify | Add Book to post-day sequence and top bar; remove DailyReportModal |
| `ux/components/TopBar.vue` | Modify | Add Book button slot |

### Tests

| File | Action | Purpose |
|------|--------|---------|
| `tests/unit/book/BookService.test.js` | Create | Pagination, chapters, category behavior |
| `tests/unit/book/BookSectionCatalog.test.js` | Create | Category configuration |
| `tests/unit/shared/chronicle/ChronicleService.test.js` | Create | Reference links, deduplication |
| `tests/vue/book/TheBookModal.spec.js` | Create | Rendering and navigation |
| `tests/vue/book/BookTopBarButton.spec.js` | Create | Glow and badge states |
| `tests/unit/engine/GameEngine.nextDay.book.test.js` | Create | Book section generation |

### Docs

| File | Action | Purpose |
|------|--------|---------|
| `docs/shared/book/book_system.md` | Create | Game design spec |
| `docs/shared/hall_of_fame.md` | Review | Update if affected by narrative flow |

---

## 8. Staged Implementation Plan

> **Core principle:** Each stage is self-contained, commit-able, and does not break existing behavior. The Chronicle remains fully functional until the final stages. If any stage fails, we can roll back to the previous commit and still have a working game.

### Stage 1: Book Engine + Translations (No UI, No Chronicle Touch)

**Goal:** Build the Book engine in isolation. It lives alongside the existing systems but nothing uses it yet.

1. **Create `js/engine/book/` directory:**
   - `BookSectionCatalog.js` — Category definitions with deterministic pagination rules.
   - `BookState.js` — Default state shape (empty book, Chapter 1 started implicitly).
   - `BookService.js` — Full API: `addSection()`, `closeChapter()`, `getPage()`, pagination logic, persistence via `persistence`.
   - `index.js` — Public exports.

2. **Write unit tests:**
   - `tests/unit/book/BookService.test.js` — Pagination, chapter boundaries, read-state tracking.
   - `tests/unit/book/BookSectionCatalog.test.js` — Category configuration validation.

3. **Translation keys (book-unique only, reuse existing where possible):**
   - Create `js/engine/shared/core/i18n/book-keys.js` registry.
   - Add to `en.js`: category template keys (`book_section_story_event`, `book_section_milestone`, etc.), chapter title keys (`book_chapter_1_title`, etc.), daily summary fallback (`book_daily_summary`).
   - Mirror placeholders to `es.js`, `ca.js`, `eu.js`, `gl.js`.
   - Follow the Translation Reuse Guidelines in Step 3 above.

4. **Commit and push.**

**Verify:** BookService can be instantiated, sections added, pages retrieved. Chronicle untouched. UI unchanged.

---

### Stage 2: Engine Systems Inject to Book (Keep Chronicle As-Is)

**Goal:** All existing event producers now push sections to the Book **in addition** to their existing Chronicle calls. Chronicle remains fully functional. No behavior changes for the player.

1. **Modify `GameEngine.js`:**
   - Instantiate `BookService` alongside existing services.
   - After each existing `chronicleService.recordEntry(...)` call, add a `bookService.addSection(...)` call with the same event data.
   - **Add TODO comments** above each Chronicle call: `// TODO(Book): Replace Chronicle record with Book section once Chronicle refactor completes`.
   - Do NOT remove or modify Chronicle calls. Both systems run in parallel.

2. **Modify `DailyHeroActionsService.js`:**
   - Add a new method `getActionResults()` that returns structured data (heroId, action, xpGained, fatigueRecovered, etc.).
   - Keep existing `processActions()` behavior unchanged.
   - `GameEngine` calls `getActionResults()` and pushes to Book.

3. **Modify `VillageEventsService.js`:**
   - Add i18n keys to event definitions (`titleKey`, `descriptionKey`).
   - Keep existing `processDay()` return structure for Chronicle compatibility.
   - `GameEngine` reads the i18n keys and pushes to Book.

4. **Modify `ExpeditionService.js` (if needed):**
   - Ensure expedition/combat results are available in structured form for Book sections.

5. **Commit and push.**

**Verify:** Game still works exactly as before. Book state is saved but never read by UI. Chronicle entries still appear as before. Build passes, tests pass.

---

### Stage 3: Book UI + Top Bar Button

**Goal:** Player can now open the Book and read history. Book is the narrative log; Chronicle is still the index (unchanged).

1. **Create `ux/features/book/` directory:**
   - `TheBookModal.vue` — Book frame, page renderer, navigation (arrows, page counter, keyboard/swipe support).
   - `BookTopBarButton.vue` — Button in top bar, always visible.
   - `composables/useBook.js` — Reactive access to Book state.
   - `components/BookSectionBanner.vue` — `banner` visual style.
   - `components/BookSectionCard.vue` — `card` visual style.
   - `components/BookSectionCompact.vue` — `compact` visual style.
   - `components/BookSectionList.vue` — `list` visual style.

2. **Modify `ux/components/TopBar.vue`:**
   - Add `BookTopBarButton` slot.

3. **Modify `ux/App.vue`:**
   - Import `TheBookModal` and `useBook`.
   - Wire top-bar button to open modal.
   - Book opens to last read page (or page 1 if never read).

4. **Commit and push.**

**Verify:** Player can click top-bar button, Book opens, pages render with correct content. Chronicle still works. No auto-open or glow yet.

---

### Stage 4: UX Polish — Glow, Auto-Open, Animations

**Goal:** Book feels alive. It signals when something important happened without being annoying.

1. **`BookTopBarButton.vue` states:**
   - **Normal:** Default appearance.
   - **Glow:** Unread content exists (sections added since last read). Subtle pulse animation.
   - **Badge:** Number of unread pages (optional, can be dot-only).

2. **Auto-open behavior:**
   - After `nextDay()` completes, check if any new section has `autoOpen: true`.
   - If yes, open `TheBookModal` at the first new page.
   - If no, trigger glow state on top-bar button.
   - Quiet days (`daily_summary` only) do NOT auto-open and do NOT glow.

3. **Page-turn animation:**
   - Subtle CSS transition when navigating pages.
   - Skippable (instant transition if user clicks rapidly).

4. **Chapter transition:**
   - When opening to a page that starts a new chapter, show chapter title card briefly before page content.

5. **Commit and push.**

**Verify:** Day advance triggers glow or auto-open correctly. Quiet days are silent. Animations smooth. Chronicle still works.

---

### Stage 5: Chronicle Engine Refactor (Catalog + Book Links)

**Goal:** Chronicle becomes the index. Book is already the narrative log. Now we connect them.

1. **Refactor `ChronicleService.js`:**
   - Replace plain-text `entries` array with catalog structure (id, labelKey, requirementKey, category, status, dayUnlocked, bookLink).
   - Remove `recordEntry()` method (or deprecate — it now creates a Book section + catalog entry).
   - New methods: `registerEntry()`, `unlockEntry(id, day, bookLink)`, `hasMilestone()`, `recordMilestone()`.
   - Milestones deduplicated via Set.

2. **Update `GameEngine.js` TODOs:**
   - Replace each `// TODO(Book)` Chronicle call with the new flow:
     - Push Book section → get `{ sectionId, pageNumber, chapterNumber }`.
     - Call `chronicleService.unlockEntry(id, day, bookLink)`.
   - Remove TODO comments.

3. **Persistence migration:**
   - On first load with new Chronicle state shape, old plain-text entries can be discarded or summarized into a single legacy entry.

4. **Commit and push.**

**Verify:** Chronicle catalog entries have Book links. Clicking Chronicle entry (in next stage) jumps to correct page.

---

### Stage 6: ChronicleTab Visual Refactor

**Goal:** Chronicle UI becomes the index view with Book page links.

1. **Refactor `ChronicleTab.vue`:**
   - Remove chapter grouping.
   - Query `chronicleService.getEntries({ status: 'unlocked' })`.
   - Render translated label + chapter/page reference (e.g., *"First boss defeated — Ch. 1, P. 12"*).
   - Clicking entry opens `TheBookModal` at linked page.
   - Locked entries show requirement hint.

2. **Commit and push.**

**Verify:** ChronicleTab shows catalog entries, links jump to Book pages. Both systems fully integrated.

---

### Stage 7: Cleanup — Remove DailyReportModal, Final Integration

**Goal:** Remove dead code, finalize integration, ensure no regressions.

1. **Remove `DailyReportModal`:**
   - Remove from `App.vue`.
   - Remove trigger from `GameEngine.js` post-day sequence.
   - Delete component file (or archive).

2. **Final integration tests:**
   - Full post-day sequence: expedition → combat → building → hero actions → village events → Book sections → Chronicle links.
   - Verify no duplicate entries.
   - Verify save/load preserves Book + Chronicle state.

3. **Update `docs/shared/book/book_system.md`**.

4. **Final commit and push.**

**Verify:** Full playthrough test. No DailyReportModal. Book auto-opens on dramatic days. Chronicle links work. Save/load stable.

---

## 9. Sequencing

### Recommended: Staged Approach (7 Stages)

Follow the **Staged Implementation Plan** in Section 8. Each stage is commit-able, push-able, and reversible. The Chronicle remains untouched until Stage 5.

**Stage summary:**
1. Book engine + translations (standalone)
2. Engine systems inject to Book (Chronicle kept as-is + TODOs)
3. Book UI + top bar button
4. UX polish (glow, auto-open, animations)
5. Chronicle engine refactor (catalog + Book links)
6. ChronicleTab visual refactor (link to Book pages)
7. Cleanup (remove DailyReportModal, final integration)

**Why this order:**
- Stages 1–4 build the Book without touching Chronicle. If we need to ship or rollback, Chronicle is still fully functional.
- Stage 2's TODO comments make it trivial to find all Chronicle calls that need replacement later.
- Each stage has a clear "verify" step. If build or tests fail, you know exactly which stage introduced the issue.
- Stage 5 is the only risky refactor (Chronicle data shape change). By then, the Book is proven and UI is complete, so we only have one moving part.

---

## 10. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Existing `ChronicleService` plain-text entries become orphaned | Accept data loss for old entries; new entries use the Book. Optionally clear old `chronicle_state` on first load. |
| Save file bloat | Cap Book sections at 500; summarize quiet days beyond 90 days |
| Player annoyance from auto-open | Auto-open only for `autoOpen: true` categories; glow for routine content |
| i18n key explosion / outdated descriptions | Centralize keys in `book-keys.js`; reuse existing entity keys; update all five languages when changing player-facing descriptions |
| Post-day sequence bugs | Add integration tests covering combat-deferred flow |
| Page numbers drift after UI changes | Enforce deterministic pagination from data only |
| DailyHeroActionsService and VillageEventsService produce plain text | Refactor them in Step 4 before wiring to the Book |

---

## 11. Definition of Done

- [ ] `ChronicleService` stores a catalog of entries with labels, requirements, status, and Book links; no day-to-day narrative text.
- [ ] `BookService` is created, tested, and persisted per save slot.
- [ ] `BookSectionCatalog` defines all categories with deterministic behavior.
- [ ] `TheBookModal` renders pages and supports navigation, keyboard, and swipe.
- [ ] `BookTopBarButton` shows glow and badge states correctly.
- [ ] `GameEngine.nextDay()` pushes Book sections instead of Chronicle entries.
- [ ] `DailyHeroActionsService` and `VillageEventsService` return structured, localizable data.
- [ ] `PresentationService` and `UnlockService` push Book sections and record Chronicle links.
- [ ] `DailyReportModal` is no longer shown after day advance.
- [ ] `ChronicleTab` reads Chronicle links and opens the Book at linked pages.
- [ ] All required translation keys exist in every language file.
- [ ] Player-facing descriptions that reference the Chronicle or Book — including Codex `feature_chronicle` — are updated in all five languages.
- [ ] `docs/shared/book/book_system.md` is written as a game design spec.
- [ ] Unit and Vue tests pass.

---

## 12. Open Design Questions

1. Should old `chronicle_state` entries be cleared on first load, or left inert?
2. Should `story_event` sections embed the cinematic inline or only link to it?
3. What is the exact page budget: 4 sections per page, or variable by category?
4. ~~Should chapters have generated titles, or just numbers?~~ **Resolved:** Chapters use `titleKey` passed at close time (e.g., `book_chapter_2_title`). If none provided, fallback to `book_chapter_end_fallback`.
5. Should the Book top-bar button jump to the latest page on click, or to the first unread page?
6. Which specific presentations/unlocks are chapter boundaries? We need a definitive list (e.g., prologue end → Ch 2, magic unlock → Ch 3, body inscription → Ch 4).
