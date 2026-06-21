# Unified Narrative Book

> **Status:** Idea / Design Concept
>
> **Scope:** Cross-cutting narrative and feedback system (`js/engine/book/`, `ux/features/book/`)
>
> **Goal:** Replace the fragmented post-day popup sequence (presentation modals, narrative toasts, daily report) with a single persistent in-fiction journal: the Book.
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
4. **Emergent chapters.** Chapters belong to the Book and are created dynamically from the story, not hardcoded into the game flow.
5. **Chronicle synergy.** The Chronicle remains the index and progress tracker. Clicking a Chronicle entry opens the Book at the exact page where the event was recorded.
6. **Deterministic history.** Page numbers are stable. A Chronicle link to "Chapter 1, Page 12" always points to the same content, regardless of screen size or future UI changes.

---

## 3. The Three Layers

The Book is organized in three nested layers:

```
Book
├── Chapter 1
│   ├── Page 1
│   │   ├── Section A
│   │   └── Section B
│   └── Page 2
│       └── Section C
├── Chapter 2
│   ├── Page 3
│   │   └── Section D
│   ...
```

### 3.1 Chapters

- Chapters belong to the Book, not the Chronicle.
- They are dynamic: the Book closes a chapter when a major story event happens or when a soft page limit is reached.
- The engine can explicitly request a chapter close, but it does not define chapter contents.
- Chapter boundaries are based on content, not calendar.

### 3.2 Pages

- A page is one spread shown to the player at a time.
- The Book decides pagination based on section categories and a fixed section-per-page budget.
- Page numbers are stable and persistent, used by the Chronicle for replay links.
- Pagination is deterministic: it depends only on the ordered list of sections and their categories, never on viewport or CSS.

### 3.3 Page Sections

The atomic unit of Book content. A section is structured data, not plain text:

- A **category** that defines visual treatment and page-break behavior.
- A list of **entries**, each with an i18n key and interpolation variables.

This structure makes the Book fully renderable in any language without storing translated strings.

---

## 4. Section Categories

Categories are the Book’s vocabulary. They determine how a section looks, whether it starts a new page, and whether the Book should auto-open.

Core categories include:

| Category | Purpose | Example |
|----------|---------|---------|
| `story_event` | Major narrative beats | Chapter finale, prologue, first boss defeat |
| `milestone` | First-time player achievements | First hero reaches level 5, first building completed |
| `construction` | Building completion or upgrade | Farm upgraded to level 2 |
| `hero_progress` | Hero level up, skill, or recovery | Arthur reached level 6 |
| `expedition` | Expedition result | Expedition to Dark Forest completed |
| `combat` | Combat summary | Boss defeated, party retreated |
| `raid` | Raid defense result | Raid victory, building damaged |
| `resource_change` | Resource production or consumption | Villagers consumed 20 food, miners gathered 12 stone |
| `recruitment` | New hero joined | Tavern recruited a Ranger |
| `unlock` | Narrative or codex discovery | Region unlocked, feature discovered |
| `daily_summary` | Quiet day fallback | Day 15 — a peaceful day in the village |

### Category behavior

Each category declares:

- `pageBreak`: `'always' | 'when-full' | 'never'`
- `autoOpen`: whether the Book should open automatically when this section is added
- `chapterBoundary`: whether this section closes the current chapter
- `visualStyle`: how the section is rendered

For example:

| Category | pageBreak | autoOpen | chapterBoundary | visualStyle |
|----------|-----------|----------|-----------------|-------------|
| `story_event` | `always` | true | true | `banner` |
| `milestone` | `when-full` | true | false | `card` |
| `raid` | `always` on defeat, `when-full` otherwise | true on defeat | false | `card` |
| `daily_summary` | `never` | false | false | `list` |

---

## 5. Growth & Opening Behavior

### How the Book grows

The engine pushes sections to the Book. The Book decides where they land.

- `addSection(section)` returns the page number where the section was placed.
- Sections are never reordered; only page and chapter boundaries are decided by the Book.
- A section can request a new page or a chapter close through its category.
- If no section is pushed on a given day, the Book does not record anything for that day. The Book button does not glow.

### Quiet days

When nothing notable happens, `GameEngine.nextDay()` still pushes a single `daily_summary` section. This guarantees that the Book continues to grow and that the player can always read what happened, even if it was uneventful.

### Opening behavior

- **Auto-open:** The Book opens automatically when at least one section with `autoOpen: true` was added since the player last closed it. It opens to the first new page.
- **Passive signal:** When only routine sections are added, the Book button glows or pulses in the top bar to indicate unread content.
- **Player-initiated:** The player can open the Book at any time from the top bar, next to the Chronicle.

This removes the daily forced popup while keeping the player aware that history is being written.

### Post-day sequence

With the Book in place, the post-day flow becomes:

1. Resolve expeditions, combat, and raids.
2. Push all resulting sections to the Book.
3. If any section has `autoOpen: true`, open the Book at the first new page.
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
- Each section entry stores only an i18n key and interpolation variables.
- Switching the game language re-renders every page from the same data.
- Dynamic values such as building or hero names are either passed as raw values or as translation keys when needed.

This makes the Book portable across all supported languages without migration work.

---

## 8. Persistence

The Book state is saved per save slot. Because it stores structured data rather than text, the footprint stays small. For very long games, old quiet days can be summarized into a single retrospective section to control save size.

---

## 9. UI Direction

- **Visual style:** dark-fantasy book frame using the existing moss/amber design tokens. Parchment-like inner page with readable typography.
- **Navigation:** left/right arrows, page counter, keyboard support, mobile swipe.
- **Animation:** subtle page-turn effect, skippable and not intrusive for repeated use.
- **Mobile:** follow the existing adaptive modal pattern.

---

## 10. Relationship to Existing Systems

- **PresentationService** keeps queuing first-run cinematics. When a presentation triggers, it also pushes a `story_event` or `milestone` section to the Book. The Book stores the `presentationId` so the cinematic can be replayed from the Chronicle or the Book.
- **UnlockService** keeps evaluating unlock predicates. When a narrative is first shown, it pushes an `unlock` section to the Book.
- **DailyReportModal** is removed. Its content is split into Book categories.
- **ChronicleTab** loses chapter grouping and gains page-number links.

---

## 11. Outcomes

After this initiative:

- The player has one place to read the story of their village.
- The end-of-day loop becomes less noisy while still delivering all feedback.
- The Chronicle becomes a richer index with direct links into the Book.
- All narrative content is automatically localizable and replayable.
- Chapters and pages feel emergent and tied to actual play history.
