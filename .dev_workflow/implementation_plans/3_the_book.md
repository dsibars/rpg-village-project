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

## 8. Step-by-Step Implementation

### Step 1: Refactor ChronicleService into a catalog + link service

1. Replace the plain-text `entries` array with an `entries` catalog.
2. Each catalog entry has:
   - `id` (e.g., presentation id, narrative id, or generated event id)
   - `labelKey` (i18n key for the Chronicle list label)
   - `requirementKey` (i18n key for the unlock hint)
   - `category` (`milestone`, `unlock`, `event`, `hero`, `village`, `combat`, `expedition`)
   - `status` (`locked` | `unlocked` | `pending`)
   - `dayUnlocked` (number | null)
   - `bookLink` (`{ sectionId, pageNumber, chapterNumber }` | null)
3. Keep `milestones` as a Set for deduplication.
4. Provide methods:
   - `unlockEntry(id, day, bookLink)` — marks entry unlocked and stores Book link
   - `getEntry(id)`, `getEntries(options)`, `getStats()`
   - `hasMilestone(id)`, `recordMilestone(id)`
5. The catalog can be initialized from `PresentationCatalog` and `UnlockNarratives`, plus new entries for village events / hero actions if desired.
6. Update tests.

### Step 2: Build Book engine

1. Create `BookSectionCatalog.js` with the full category catalog.
2. Create `BookState.js` with default state.
3. Create `BookService.js` with full API and deterministic pagination.
4. Write unit tests for pagination, chapter boundaries, and read-state tracking.

### Step 3: Translation keys

1. Create `book-keys.js` registry.
2. Add keys to `en.js` for all categories and event types.
3. Mirror placeholders to `es.js`, `ca.js`, `eu.js`, `gl.js`.

### Step 4: Refactor event producers

1. `DailyHeroActionsService`:
   - Remove English `description` from return objects.
   - Return structured data: `{ heroId, heroName, action, success, fatigueRecovered?, hpRecovered?, xpGained?, leveledUp?, goldEarned?, regionId? }`.
2. `VillageEventsService`:
   - Replace `title` and `description` plain text in event definitions with `titleKey` and `descriptionKey`.
   - Return `titleKey`, `descriptionKey`, and `values` from `processDay`.

### Step 5: Redirect GameEngine hooks

Replace all `chronicleService.recordEntry(...)` calls with `bookService.addSection(...)`. When the section corresponds to a Chronicle-tracked entry (presentation, unlock narrative), also call `chronicleService.unlockEntry(...)` with the Book link.

Order of operations in `GameEngine.nextDay()`:

1. Mission board housekeeping.
2. Daily objectives generation.
3. Village tick.
4. Building completion → `bookService.addSection({ category: 'construction', ... })`.
5. Region unlocks.
6. Expedition processing.
7. Academy, body inscription.
8. Hero recovery and fatigue recovery → `bookService.addSection({ category: 'hero_progress', ... })`.
9. Training grounds → `bookService.addSection({ category: 'hero_progress', ... })`.
10. Village random events → `bookService.addSection({ category: 'village_event', ... })`.
11. Hero daily actions → `bookService.addSection({ category: 'hero_action', ... })` per action.
12. Tavern auto-recruit → `bookService.addSection({ category: 'recruitment', ... })`.
13. Presentation/chapter triggers → `bookService.addSection({ category: 'story_event'/'milestone', metadata: { chronicleId: presentationId }, ... })` + `chronicleService.unlockEntry(presentationId, day, bookLink)`.
14. Calendar/raid → `bookService.addSection({ category: 'raid', ... })`.
15. Unlock checks → `bookService.addSection({ category: 'unlock', metadata: { chronicleId: narrativeId }, ... })` + `chronicleService.unlockEntry(narrativeId, day, bookLink)`.
16. If no sections pushed, add `daily_summary`.
17. Persist Book and Chronicle states.

### Step 6: UI components

1. Create `TheBookModal.vue`:
   - Book frame, page renderer, navigation, keyboard/swipe support.
   - Accepts initial page number prop.
2. Create `BookTopBarButton.vue` with normal/glow/badge states.
3. Create `useBook.js` composable.
4. Create section renderer components.

### Step 7: ChronicleTab refactor

1. Remove chapter grouping from milestones.
2. Query `chronicleService.getEntries({ status: 'unlocked' })` for the main history list.
3. For each entry, render the translated label and chapter/page label from `entry.bookLink`.
4. Clicking an entry opens the Book at `entry.bookLink.pageNumber`.
5. Discovery log can also use Chronicle entries with `category: 'unlock'`.
6. Locked entries render `entry.requirementKey` as the unlock hint.

### Step 8: App wiring

1. Remove `DailyReportModal` from `App.vue`.
2. Add `BookTopBarButton` to `TopBar.vue`.
3. In `App.vue` after `nextDay()`:
   - If `bookService.hasAutoOpenContent()`, open `TheBookModal` at the first new page.
   - Else if `bookService.hasUnreadContent()`, glow the Book button.
4. Handle deferred combat flow: after combat closes, resume the Book check.

### Step 9: Tests and docs

1. Add Vue tests for Book components.
2. Update integration tests for post-day sequence.
3. Write `docs/shared/book/book_system.md`.

---

## 9. Sequencing

### Recommended: Single Pass

Build the Book engine, refactor ChronicleService, redirect all hooks, and update the UI in one pass. The daily report modal is removed immediately.

**Why:** The existing `ChronicleService` plain-text entries are not reusable for the Book. A partial migration would leave dead data and a confusing user experience.

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
4. Should chapters have generated titles, or just numbers?
5. Should the Book top-bar button jump to the latest page on click, or to the first unread page?
