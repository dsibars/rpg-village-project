# Unified Narrative Book

> **Status:** Idea / Design Concept
>
> **Scope:** Cross-cutting narrative and feedback system (`js/engine/book/`, `ux/features/book/`)
>
> **Goal:** Replace the fragmented post-day popup sequence with a single persistent in-fiction journal: the Book.
>
> **Companion Document:** `../implementation_plans/3_the_book.md`

---

## 1. Context & Motivation

RPG Village currently delivers story and daily feedback through several disconnected surfaces:

- **Presentation modals** for cinematic milestones.
- **Narrative unlock toasts** for discoveries.
- **Daily report modal** for the utilitarian day summary.
- **Chronicle tab** as a milestone library and discovery log.

The result is a noisy end-of-day experience. The player clicks through multiple popups that feel separate from each other and from the game world. The Book unifies them into one coherent artifact that grows as the village grows.

### Transition: from Chronicle-as-log to Chronicle-as-index

The branch currently contains a `ChronicleService` that records plain-text event entries. It treats the Chronicle as the readable log of what happened each day.

This initiative changes that responsibility split:

- **The Book becomes the readable log.** It receives every day’s events as structured, localizable sections and renders them as pages.
- **The Chronicle becomes an unlock/index view.** It shows the player what major story events and tiny milestones have been unlocked, what is still locked, and where each unlocked entry is narrated in the Book. Clicking an entry opens the Book at the exact page.

In short: the Chronicle answers *“What have I unlocked and where can I read about it?”* The Book answers *“What happened, in narrative form?”*

> **i18n reminder:** Any player-facing description that mentions the Chronicle or the Book — including the Codex `feature_chronicle` entry — must be updated in all five supported languages: `en`, `es`, `ca`, `eu`, `gl`.

---

## 2. The Vision

The Book is the village’s living journal. It is not a settings screen or a Help page; it is part of the fiction.

### Core principles

1. **One reading surface.** Every notable event becomes content inside the Book.
2. **Player agency.** The Book signals new content rather than forcing itself every day. Routine days only light up the Book button; important events auto-open the Book.
3. **Localization-first.** The Book never stores rendered text, only structured i18n data, so any page can be rendered in any language at any time.
4. **Emergent chapters.** Chapters belong to the Book. A new chapter begins when the Book receives a section with category `chapter_history_event`. Which events are marked as chapter events depends on player choices, so chapters adapt to each playthrough.
5. **Chronicle synergy.** The Chronicle remains the index and progress tracker. Clicking a Chronicle entry opens the Book at the exact page where the event was recorded.
6. **Deterministic history.** Page numbers are stable. A Chronicle link to "Chapter 1, Page 12" always points to the same content, regardless of screen size or future UI changes.
7. **Book feel.** The Book is rendered as an opened book with two-page spreads, page-turn animations, and a parchment/dark-fantasy frame.

---

## 3. The Three Layers

The Book is organized in three nested layers:

```
Book
├── Chapter 1
│   ├── Spread 1 (Pages 1-2)
│   │   ├── Page 1
│   │   │   ├── PageSection A
│   │   │   └── PageSection B
│   │   └── Page 2
│   │       └── PageSection C
│   └── Spread 2 (Pages 3-4)
│       ├── Page 3
│       │   └── PageSection D
│       └── Page 4
│           └── PageSection E
├── Chapter 2
│   ...
```

### 3.1 Chapters

Chapters are **story-driven, not time-driven**. A new chapter begins only when the Book receives a section with category `chapter_history_event`.

**Chapter trigger rules:**
1. **Only `chapter_history_event` sections start a new chapter.** All other categories stay within the current chapter.
2. **The BookService decides when a new chapter begins.** The engine does not call any chapter-close method. It pushes sections through the single entry point `addSection(section)`. When the BookService receives a `chapter_history_event`, it closes the current chapter and starts the next one.
3. **The `chapter_history_event` is the first content of the new chapter.** The previous page is not reused. The Book jumps to a new page, renders "CHAPTER X" as a title at the top, and then appends the `chapter_history_event` content below it.
4. **No soft page limits.** A chapter can be 3 pages or 300 pages. Length is determined entirely by player-paced story progression.
5. **Dynamic per playthrough.** Because which events are marked as `chapter_history_event` can depend on player choices and authored design, the same chapter can contain wildly different content across saves. To add Chapter 3, 4, 5, etc., we only need to mark the appropriate history event as a `chapter_history_event`.

**Chapter title behavior:**
- When a `chapter_history_event` begins, the Book jumps to a new page and renders "CHAPTER X" as a title.
- The `chapter_history_event` section is placed immediately after the chapter title on the same page.
- Chapter titles are translation keys (`book_chapter_1_title`, `book_chapter_2_title`, etc.) and can reference the triggering event.

---

### 3.2 Pages and Spreads

- A **page** is one side of the book.
- A **spread** is two facing pages shown together: pages 1–2, 3–4, 5–6, etc.
- The Book is always displayed as an opened spread, never a single page.
- Navigation turns one spread at a time (2 pages), with a page-turn animation.
- Page numbers are stable and persistent, used by the Chronicle for replay links.
- Pagination is deterministic: it depends on the ordered list of sections and their visual budget, never on viewport or CSS.

---

### 3.3 Page Sections

The atomic unit of content on a page. A section pushed by the engine can produce one or more page sections if it is split across pages.

Page sections come from four categories only:

| Category | Purpose | Visual treatment | Page break | Auto-open |
|----------|---------|------------------|------------|-----------|
| `history_event` | Narrative history event with optional images and multiple text blocks | Banner or illustrated narrative block | `always` | true |
| `chapter_history_event` | Same as `history_event`, but also starts a new chapter | Banner or illustrated narrative block | `always` | true |
| `milestone` | Chronicle milestone (first-time achievements) | Highlighted card with icon | `when-full` | true |
| `village_updates` | Daily enumerated list of small updates (level ups, resources, recruitments) | Compact bullet list | `when-full` | false |

### Section structure

#### `history_event` / `chapter_history_event`

```typescript
{
  id: 'sec_prologue',
  category: 'history_event', // or 'chapter_history_event'
  day: 1,
  blocks: [
    { image: 'assets/story/valley_dawn.webp', textKey: 'book_prologue_p1', values: {} },
    { image: 'assets/story/arthur_trail.webp', textKey: 'book_prologue_p2', values: {} },
    { image: 'assets/story/village_stake.webp', textKey: 'book_prologue_p3', values: {} }
  ],
  metadata: {
    titleKey: 'book_chapter_1_title',
    chronicleId: 'pres_prologue'
  }
}
```

A history event can have one or more blocks. Each block has an optional image and a text key. The BookService may split the event across pages based on visual budget.

#### `milestone`

```typescript
{
  id: 'sec_first_victory',
  category: 'milestone',
  day: 5,
  entry: { key: 'book_milestone_first_victory', values: {} },
  metadata: {
    image: 'assets/heroes/arthur.webp',
    chronicleId: 'pres_first_victory'
  }
}
```

#### `village_updates`

```typescript
{
  id: 'sec_day_2_updates',
  category: 'village_updates',
  day: 2,
  entries: [
    { key: 'book_update_food_consumed', values: { amount: 2 } },
    { key: 'book_update_villager_joined', values: { amount: 1 } },
    { key: 'book_update_hero_rested', values: { hero: 'Arthur', hp: 2 } }
  ]
}
```

The village updates section groups small daily events into one enumerated list. If the list is too long, the BookService may split it across pages.

---

## 4. Page Layout

The BookService runs a layout algorithm when sections are added:

1. Each section category has a **visual budget cost**.
2. Each page has a **maximum budget**.
3. The BookService fills the current page until adding the next section (or next block of a history event) would exceed the budget.
4. If a section does not fit, it starts on a new page.
5. History events can be split: individual blocks can land on different pages.
6. Village updates can be split: individual bullets can land on different pages.
7. Milestones are atomic: they do not split.

Example page budget:

| Content | Cost |
|---------|------|
| History event block (image + text) | 6 |
| Milestone | 4 |
| Village update bullet | 1 |
| Chapter title | 2 |

Page budget: 10 units.

This makes pagination deterministic and stable across languages.

---

## 5. Growth & Opening Behavior

### How the Book grows

The engine pushes sections to the Book. The Book decides where they land, which pages they occupy, and whether they start a new chapter.

- `addSection(section)` is the only public entry point.
- The BookService computes page sections and stores the final page assignment.
- Sections are never reordered; only page boundaries are decided by the Book.
- If no section is pushed on a given day, the Book does not record anything for that day. The Book button does not glow.

### Quiet days

When nothing notable happens, `GameEngine.nextDay()` still pushes a single `village_updates` section (possibly with a quiet-day intro bullet). This guarantees the Book keeps growing.

### Opening behavior

- **Auto-open:** The Book opens automatically when at least one section with `autoOpen: true` was added since the player last closed it. It opens to the first new spread.
- **Passive signal:** When only `village_updates` sections are added, the Book button glows or pulses.
- **Player-initiated:** The player can open the Book at any time from the top bar, next to the Chronicle.

### Post-day sequence

With the Book in place:

1. Resolve expeditions, combat, and raids.
2. Push all resulting sections to the Book.
3. If any section has `autoOpen: true`, open the Book at the first new spread.
4. Otherwise, glow the Book button.

The daily report modal is removed. The Book is the only post-day reading surface.

---

## 6. Chronicle Synergy

> Note: The branch currently contains a `ChronicleService` that stores plain-text event entries. As part of this initiative, that service is refactored into an achievement/index catalog. The Book becomes the canonical owner of all readable narrative content.

The Chronicle and the Book are companions, not competitors.

| Chronicle | Book |
|-----------|------|
| Catalog of main story events, milestones, and unlocks | Full reading experience |
| Owns labels, requirements, and unlocked status | Stores the rendered history |
| Shows what is unlocked and what can still be unlocked | Narrates how and when things happened |
| Clicking an event jumps to the Book page | Displays the page with context |
| No chapters (chapters live in the Book) | Chapters are dynamic and owned here |

A Chronicle entry has its own label and unlock requirement, plus a link to the Book page where it was narrated. The player sees something like *“First boss defeated — Chapter 1, Page 12”* and clicks to open the Book there.

The existing `ChronicleService` is refactored to store this catalog. It no longer stores rendered narrative text; that lives in Book sections. Each unlocked entry records the Book section and page where it appeared.

---

## 7. Multi-Language Strategy

The Book is localizable by design:

- No rendered text is ever stored.
- Each block, entry, and bullet stores only an i18n key and interpolation variables.
- Switching the game language re-renders every page from the same stored page-section structure.
- Page numbers and chapter numbers are stable regardless of language.

### Translation Reuse Discipline

To prevent key explosion:

**Reuse without new keys:**
- Hero names, building names, region names, item names.
- Entity attribute labels.
- Action verbs from existing UI or codex entries.
- Combat result terms.

**New keys only for:**
- Narrative prose unique to the Book.
- Chapter titles.
- Category-specific templates.

**Naming convention:**
- `book_history_{id}` for history event text keys.
- `book_milestone_{id}` for milestone text keys.
- `book_update_{event}` for village update bullet keys.
- `book_chapter_{n}_title` for chapter titles.

When adding a new key, it must be added to all five language files.

---

## 8. Persistence

The Book state is saved per save slot. It stores:

- Original sections pushed by the engine (source of truth, i18n keys).
- Generated pages with page sections (final layout, stable for replay and linking).
- Last read page/spread.

Because sections are small structured objects, the save footprint stays reasonable. For very long games, old quiet days can be summarized.

---

## 9. UI Direction

- **Visual style:** dark-fantasy book frame using existing moss/amber tokens. Parchment inner pages.
- **Spread display:** always show two facing pages together (1–2, 3–4, etc.).
- **Navigation:** left/right arrows turn spreads, page counter, keyboard arrow keys, mobile swipe.
- **Animation:** subtle page-turn effect when moving between spreads.
- **Mobile:** full-screen book overlay; swipe to turn spreads.
- **Replay:** from the Chronicle, the Book opens at the requested page in replay mode.

---

## 10. Relationship to Existing Systems

- **PresentationService** keeps queuing first-run cinematics. When a presentation triggers, it pushes a `history_event` or `chapter_history_event` section to the Book. The Book stores the `presentationId` so the cinematic can be replayed.
- **UnlockService** keeps evaluating unlock predicates. When a narrative is first shown, it pushes a `history_event` or `milestone` section to the Book.
- **DailyReportModal** is removed. Its content becomes `village_updates` sections.
- **ChronicleTab** loses chapter grouping and gains page-number links.

---

## 11. Outcomes

After this initiative:

- The player has one place to read the story of their village as a real book.
- The end-of-day loop becomes less noisy while still delivering all feedback.
- The Chronicle becomes a richer index with direct links into the Book.
- All narrative content is automatically localizable and replayable.
- Chapters and pages feel emergent and tied to actual play history.
