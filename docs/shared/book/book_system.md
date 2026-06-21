# Book System

> **Status:** Specification  
> **Domain:** Shared Core / Narrative  
> **Scope:** In-fiction journal that records every notable event as readable, localizable pages.

---

## 1. Overview

The **Book** is the village's living journal. It replaces the fragmented post-day popup sequence with a single persistent reading surface that grows as the village grows.

Every notable event — a hero recruitment, a completed building, a raid, a combat victory, a milestone — is pushed to the Book as a structured, localizable section. The Book Service splits these sections into **PageContentSections**, lays them out into pages and spreads, and tracks chapter boundaries.

### 1.1 Design Principles

1. **One reading surface.** Every notable event becomes content inside the Book.
2. **Player agency.** The Book signals new content rather than forcing itself every day. Routine days only light up the Book button; important events auto-open the Book.
3. **Localization-first.** The Book never stores rendered text, only structured i18n data, so any page can be rendered in any language at any time.
4. **Emergent chapters.** Chapters belong to the Book. A new chapter begins when the Book receives a section with category `chapter_history_event`. Which events are marked as chapter events depends on player choices, so chapters adapt to each playthrough.
5. **Chronicle synergy.** The Chronicle remains the index and progress tracker. Clicking a Chronicle entry opens the Book at the exact page where the event was recorded.
6. **Deterministic history.** Page numbers are stable. A Chronicle link to "Chapter 1, Page 12" always points to the same content, regardless of screen size or future UI changes.

### 1.2 Book vs. Chronicle

| Book | Chronicle |
|------|-----------|
| Readable narrative log | Index / achievement catalog |
| Owns the full page layout | Owns labels, requirements, and unlock status |
| Answers *"What happened, in narrative form?"* | Answers *"What have I unlocked and where can I read about it?"* |
| Chapters live here | Links to Book pages |

---

## 2. Core Concepts

### 2.1 Engine Section

The engine pushes content to the Book through a single entry point: `BookService.addSection(section)`.

An engine section has:

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique identifier for this event instance |
| `category` | `BookSectionCategory` | One of `history_event`, `chapter_history_event`, `milestone`, `village_updates` |
| `day` | `number` | In-game day when the section was pushed |
| `entries` | `SectionEntry[]` | Localizable content items (for `village_updates`) |
| `blocks` | `SectionBlock[]` | Narrative blocks (for `history_event` / `chapter_history_event`) |
| `metadata` | `object` | Optional data such as `titleKey`, `presentationId`, `chronicleId`, `heroId`, `origin` |

```typescript
interface BookSection {
  id: string;
  category: 'history_event' | 'chapter_history_event' | 'milestone' | 'village_updates';
  day: number;
  entries?: SectionEntry[];
  blocks?: SectionBlock[];
  metadata?: {
    titleKey?: string;
    presentationId?: string;
    chronicleId?: string;
    heroId?: string;
    origin?: string;
  };
}

interface SectionEntry {
  key: string;
  values: Record<string, string | number>;
  weight?: number;
}

interface SectionBlock {
  textKey: string;
  values: Record<string, string | number>;
  weight?: number;
  image?: string;
}
```

### 2.2 PageContentSection (PCS)

A **PageContentSection** is the atomic renderable unit. The BookService splits each engine section into one or more PCSs, then places them on pages.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique generated id |
| `category` | `BookSectionCategory` | Inherited from engine section |
| `type` | `PCSType` | Rendering type |
| `textKey` | `string` | i18n key |
| `values` | `Record<string, string \| number>` | Interpolation values |
| `weight` | `number` | Visual budget cost |
| `pageSectionId` | `string` | Links back to parent PageSection |
| `image` | `string?` | Optional image path |

### 2.3 Page, Spread, and Chapter

- A **page** is one side of the book, numbered continuously from 1.
- A **spread** is two facing pages shown together: pages 1–2, 3–4, 5–6, etc.
- A **chapter** begins whenever the Book receives a `chapter_history_event` section. Chapters are story-driven, not time-driven.

```typescript
interface Page {
  pageNumber: number;
  chapterNumber: number;
  pageContentSections: PageContentSection[];
}

interface Chapter {
  chapterNumber: number;
  startPageNumber: number;
  titleKey?: string;
}
```

### 2.4 PageSection

A **PageSection** is metadata that tracks a single engine-pushed section across the Book. The Chronicle uses this to link to the correct page.

```typescript
interface PageSection {
  id: string;                    // original engine section id
  category: BookSectionCategory;
  day: number;
  pages: number[];               // page numbers where this section appears
  pageContentSectionIds: string[];
  metadata?: object;
}
```

---

## 3. Section Categories and PCS Types

Only four section categories exist, but they split into five rendering types.

| Category | PCS Type | Purpose | Default Weight | Auto-Open |
|----------|----------|---------|----------------|-----------|
| `chapter_history_event` | `chapter_title` | Chapter heading ("CHAPTER X") | 2 | — |
| `chapter_history_event` | `history_block` | Narrative block from the event | 6 | yes |
| `history_event` | `history_block` | Narrative block from the event | 6 | yes |
| `milestone` | `milestone` | Chronicle milestone | 4 | yes |
| `village_updates` | `village_update_title` | Section heading (e.g., "Day 5") | 2 | no |
| `village_updates` | `village_update_bullet` | Individual update bullet | 1 | no |

**Page budget:** 10 units per page.

**Splittable units:** `history_block` and `village_update_bullet` can be split across pages. `chapter_title`, `milestone`, and `village_update_title` are atomic.

### 3.1 Weight Overrides

Individual entries and blocks may override their default weight. Overrides are clamped to 0.5×–2× of the default to prevent layout breakage. A single PCS that exceeds the page budget is placed on its own page and allowed to overflow rather than being dropped.

---

## 4. Layout Algorithm

When `BookService.addSection(engineSection)` is called:

1. **Guard: reject empty sections.** If a `history_event` or `chapter_history_event` has no `blocks`, the section is skipped entirely.
2. **Split** the engine section into PageContentSections based on its category.
3. **Create a PageSection** with the engine section's id, category, day, and metadata.
4. **Place each PCS** in order:
   - If the PCS is a `chapter_title`, close the current chapter and start a new chapter on a new page.
   - If the current page has enough remaining budget, append the PCS.
   - Otherwise, start a new page and append the PCS.
   - If a single PCS exceeds the page budget, place it on its own page and allow overflow.
5. **Update the PageSection** with the pages and PCS ids used.
6. **Persist** the updated Book state.

This makes page numbers deterministic and stable across languages. Layout depends only on the ordered list of PCSs and their weights, never on viewport or rendered text length.

---

## 5. Growth and Opening Behavior

### 5.1 How the Book Grows

The engine pushes sections to the Book through `addSection()`. The BookService produces PageContentSections, decides where they land, and tracks everything via PageSection metadata.

- Sections are never reordered; only page boundaries are decided by the Book.
- If no section is pushed on a given day, the Book does not record anything for that day and the Book button does not glow.

### 5.2 Quiet Days

When nothing notable happens, `GameEngine.nextDay()` still pushes a single `village_updates` section with a quiet-day bullet. The Book records it, but the Book button does not glow. The player can open the Book at any time and see the entry.

### 5.3 Auto-Open and Glow

| Category | Behavior |
|----------|----------|
| `history_event` / `chapter_history_event` | **Auto-open** the Book to the first new spread after the post-day sequence completes. |
| `milestone` | **Auto-open** the Book to the milestone page. |
| `village_updates` only | **Glow** the Book button; do not auto-open. |

The Book button in the top bar shows:
- **Glow / badge** when unread content exists.
- A stronger indicator when auto-open content is present.

### 5.4 Post-Day Sequence

1. Resolve expeditions, combat, and raids.
2. Push all resulting sections to the Book.
3. If any section has auto-open content, open the Book at the first new spread.
4. Otherwise, glow the Book button.

The old Daily Report Modal is removed from this flow; its content is now a `village_updates` section.

---

## 6. Engine Integration Points

The Book receives sections from several engine systems:

| Source | Section Category | Notes |
|--------|------------------|-------|
| `GameEngine.nextDay()` | `village_updates` | Daily summary: food consumed, new villagers, building completion, raid result, hero actions, expeditions, tavern recruit, quiet day fallback |
| `GameEngine.recruitHero()` | `village_updates` | Hero recruited entry |
| `GameEngine.resolveBattle()` | `history_event` / `milestone` | Combat victory/defeat narrative; first-victory milestone |
| `GameEngine` building completion | `village_updates` | Building completed bullet |
| `GameEngine` raid resolution | `village_updates` | Raid defended / lost bullet |

When a section has `metadata.chronicleId`, the engine unlocks the corresponding Chronicle entry and records the Book link (`pageSectionId`, `pageNumber`, `chapterNumber`).

---

## 7. Persistence

The Book state is saved per save slot under the key `book_state`. It stores:

- `chapters`: chapter number, start page, title key
- `pages`: page number, chapter number, array of PageContentSections
- `pageSections`: metadata linking engine sections to pages and PCSs
- `lastReadSpread`: first page of the last read spread (1, 3, 5…)

No original engine sections are stored separately. The generated layout is canonical. Page numbers are written in stone once laid out.

For very long games, old quiet days may be summarized into a single PageSection with a single PageContentSection (future optimization).

---

## 8. Translation Strategy

The Book is localizable by design:

- No rendered text is ever stored.
- Each PageContentSection stores only an i18n key and interpolation variables.
- Switching the game language re-renders every page from the same stored PCS structure.
- Page numbers and chapter numbers are stable regardless of language.

### 8.1 Key Registry

All Book translation keys are declared in `js/engine/shared/core/i18n/book-keys.js` and must exist in every language file:

- `book_chapter_{n}_title` and `book_chapter_default_title` for chapter titles
- `book_village_updates_title` for the village update heading
- `book_update_{event}` for village update bullets
- `book_history_{event}` for history event blocks
- `book_milestone_{id}` for milestone cards

### 8.2 Reuse Discipline

- Reuse existing keys for hero names, building names, region names, item names, and common verbs.
- Add new keys only for narrative prose unique to the Book, chapter titles, and category-specific templates.

---

## 9. User Interface

The Book UI lives in `ux/features/book/`:

- `BookPage.vue`: wrapper that feeds `gameState.book` to `BookView` and handles adapter dispatch
- `BookView.vue`: renders a two-page spread, handles navigation and keyboard input
- `BookPcs.vue`: renders PageContentSections based on their `type`
- `ChronicleTab.vue`: catalog view that links into the Book

### 9.1 Navigation

- Left/right arrows turn one spread at a time.
- Keyboard left/right also turn spreads.
- The top-bar Book button opens the Book at the first unread spread.
- Chronicle entries link directly to a specific page.

### 9.2 Visual Treatment

- Two-page spread layout.
- Page-turn animation between spreads.
- Parchment / dark-fantasy frame consistent with the game theme.

---

## 10. Edge Cases and Limits

| Scenario | Behavior |
|----------|----------|
| Empty `history_event` with no blocks | Section is skipped entirely; no PageSection created |
| Single PCS exceeds page budget | Placed on its own page and allowed to overflow |
| Duplicate section id | Made unique by appending a suffix |
| No events on a day | A quiet-day `village_updates` section is pushed; Book button does not glow |
| Language change | Pages re-render from stored PCS structure; page numbers unchanged |
| Save slot change | Book state is loaded/saved per slot via `Persistence.js` |
| Very long games | Future: summarize quiet days older than 90 days |

---

## 11. Acceptance Criteria

- [x] Only four section categories exist: `history_event`, `chapter_history_event`, `milestone`, `village_updates`.
- [x] Layout algorithm splits engine sections into PageContentSections and places them on pages using a weight-based budget.
- [x] Empty sections are skipped without creating orphaned metadata.
- [x] The Book renders two-page spreads.
- [x] The Book button shows glow and badge states correctly.
- [x] `GameEngine.nextDay()` pushes Book sections instead of Chronicle entries.
- [x] The Daily Report Modal is no longer shown after day advance.
- [x] The Chronicle reads Book links and opens the Book at linked pages.
- [x] All required translation keys exist in every language file.
- [x] Book state persists per save slot.
