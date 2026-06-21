# Chronicle System

> **Status:** Specification  
> **Domain:** Shared Core / Narrative  
> **Scope:** Achievement and index catalog that tracks major story events, milestones, and unlocks, with links to the Book.

---

## 1. Overview

The **Chronicle** is the player's record of meaningful accomplishments and story beats. It does **not** store readable narrative text; that role belongs to the [Book](../book/book_system.md). Instead, the Chronicle stores:

- A **catalog of entries** representing achievements, milestones, and story events.
- A **label** and **unlock requirement** for each entry (both i18n keys).
- The **unlock status** of each entry: `locked`, `pending`, or `unlocked`.
- A **Book link** for every unlocked entry, pointing to the exact page and chapter where the event is narrated.

The player opens the Chronicle from the **Explore** page. It displays unlocked entries with their chapter/page reference and locked entries with a requirement hint. Clicking an unlocked entry opens the Book at the linked page.

### 1.1 Chronicle vs. Book

| Chronicle | Book |
|-----------|------|
| Achievement / index view | Readable narrative log |
| Owns labels, requirements, unlock status | Owns the full page layout |
| Shows what is unlocked and what can still be unlocked | Narrates how and when things happened |
| Links to Book pages | Displays the page with context |

### 1.2 Transition from Log to Index

Earlier versions of the Chronicle stored plain-text daily event entries. The current system refactors the Chronicle into a catalog and moves all readable narrative content into the Book. Old plain-text entries are discarded on first load after the refactor.

---

## 2. Data Model

### 2.1 Chronicle Entry

```typescript
interface ChronicleEntry {
  id: string;                    // unique identifier
  labelKey: string;              // i18n key for the entry name
  requirementKey: string;        // i18n key for the unlock requirement hint
  category: ChronicleCategory;   // 'milestone' | 'unlock' | 'event' | 'hero' | 'combat' | 'village'
  status: 'locked' | 'pending' | 'unlocked';
  dayUnlocked: number | null;
  bookLink: {
    pageSectionId: string;
    pageNumber: number;
    chapterNumber: number;
  } | null;
}
```

### 2.2 Chronicle State

```typescript
interface ChronicleState {
  catalog: ChronicleEntry[];
  milestones: Set<string>;       // ids of recorded milestones (deduplication)
}
```

The state is persisted per save slot under the key `chronicle_state`.

### 2.3 Milestones

Milestones are lightweight boolean flags used to prevent duplicate triggers or to check whether a particular game-wide event has occurred. They are stored separately from the catalog because a milestone may not have a corresponding Chronicle entry.

---

## 3. Catalog Sources

Entries can be registered from three sources:

1. **Hard-coded catalog registration** in `GameEngine._registerChronicleCatalog()` for core milestones such as:
   - `hero_recruited`
   - `combat_victory`
   - `combat_defeat`

2. **Auto-registration** via `ChronicleService.unlockEntry()`. If an unknown id is unlocked, the service creates an entry on the fly with fallback keys:
   - `labelKey`: `chronicle_{id}`
   - `requirementKey`: `chronicle_req_{id}`
   - `category`: `unlock`

3. **Future sources** (not yet wired): `PresentationCatalog` and `UnlockNarratives` may register entries for cinematic milestones and narrative unlocks.

---

## 4. API

### 4.1 Registration

- `registerEntry(entry)` — idempotent registration of a catalog entry.
- `registerEntriesFromCatalog(catalog)` — bulk registration.

### 4.2 Unlocking

- `unlockEntry(chronicleId, day, bookLink?)` — unlocks an entry and records its Book link. Auto-registers unknown ids with fallback keys.
- `setPending(chronicleId)` — marks an entry as pending (requirements met but not yet viewed).

### 4.3 Queries

- `getEntry(chronicleId)` — single entry lookup.
- `getEntries(options)` — filtered list. Supports `category`, `status`, `dayMin`, `dayMax`, and `limit`.
- `getStats()` — summary counts by category and status, plus milestone list.

### 4.4 Milestones

- `recordMilestone(id)` — records a milestone flag (deduplicated).
- `hasMilestone(id)` — checks whether a milestone was recorded.

### 4.5 Book Link Updates

- `updateBookLink(chronicleId, bookLink)` — updates the Book link for an already-unlocked entry.

---

## 5. UI: ChronicleTab

The Chronicle is rendered inside the Explore page by `ChronicleTab.vue`.

### 5.1 Layout

The tab is split into two panes:

1. **Left pane — Chronicle Catalog**
   - Header with title and unlocked count (`unlocked / total`).
   - Unlocked entries sorted by unlock day (newest first).
   - Each entry shows:
     - Translated label
     - `UNLOCKED` badge
     - Unlock day
     - Chapter and page reference (e.g., "Chapter 1 · Page 12")
     - A book icon button to open the entry in the Book
   - Locked entries appear below unlocked entries, faded, with a requirement hint.

2. **Right pane — Discovery Log**
   - Lists narrative unlocks that have been shown to the player.
   - Sorted by day seen (newest first).
   - Clicking an entry opens the narrative toast detail.

### 5.2 Navigation

Clicking an unlocked Chronicle entry emits a `navigate` event that switches the main page to the Book and passes the target page number. The Book opens at that page and marks the spread as read.

---

## 6. Engine Integration

The Chronicle is updated at the same moment the Book receives a matching section:

1. Engine pushes a Book section via `bookService.addSection(section)`.
2. If the section's `metadata.chronicleId` is set, the engine calls `chronicleService.unlockEntry(chronicleId, day, bookLink)`.
3. The Book link is built from the result of `addSection()`:
   - `pageSectionId` — the section's metadata id
   - `pageNumber` — first page where the section appears
   - `chapterNumber` — chapter of that page

Current integration points in `GameEngine`:

| Event | Chronicle ID | Book Section Category |
|-------|--------------|----------------------|
| Hero recruited | `hero_recruited` | `village_updates` |
| Combat victory | `combat_victory` | `history_event` / `milestone` |
| Combat defeat | `combat_defeat` | `history_event` |
| Building upgraded | `building_{id}_{level}` (auto-registered) | `village_updates` |
| Village event | `event_{id}` (auto-registered) | `village_updates` |
| Expedition finished | `expedition_{id}` (auto-registered) | `village_updates` |

---

## 7. Translation Strategy

The Chronicle stores only i18n keys, never rendered text.

### 7.1 Required Key Patterns

| Purpose | Pattern | Example |
|---------|---------|---------|
| Catalog title | `chronicle_catalog_title` | `Chronicle` |
| Empty state | `chronicle_catalog_empty` | `No chronicle entries unlocked yet.` |
| Unlocked badge | `chronicle_unlocked` | `Unlocked` |
| Open in Book | `chronicle_open_in_book` | `Open in Book` |
| Chapter / Page labels | `chronicle_chapter`, `chronicle_page` | `Chapter`, `Page` |
| Entry label | `chronicle_{id}` | `chronicle_hero_recruited` |
| Requirement hint | `chronicle_req_{id}` | `chronicle_req_recruit` |
| Locked badge | `chronicle_hint_event` | `Locked Event` |

### 7.2 Fallback Keys

Auto-registered entries use fallback keys based on their id. If those keys are missing from a translation file, the UI falls back to the raw id or a generic locked hint.

---

## 8. Persistence and Migration

- The Chronicle state is saved per save slot under `chronicle_state`.
- Old plain-text entries are **discarded** on first load. Only the new catalog format is kept.
- Milestones are stored as a `Set` and serialized through `persistence.save()`.

---

## 9. Edge Cases

| Scenario | Behavior |
|----------|----------|
| `unlockEntry` called with unknown id | Auto-registers the entry with fallback keys and unlocks it |
| `unlockEntry` called again for already-unlocked entry | Returns existing entry; dayUnlocked is not overwritten |
| `unlockEntry` called with null/empty id | Returns `null` |
| Entry registered twice | Registration is idempotent; first definition wins |
| Book link missing | Entry still unlocks; UI disables the "Open in Book" action |
| All entries locked | Catalog shows empty-state message |

---

## 10. Acceptance Criteria

- [x] Chronicle stores a catalog of entries with labels, requirements, status, and Book links; no day-to-day narrative text.
- [x] Entries can be registered, unlocked, filtered, and queried.
- [x] Unknown ids unlocked at runtime are auto-registered with fallback keys.
- [x] Milestones are recorded and deduplicated.
- [x] Old plain-text entries are discarded on load.
- [x] `ChronicleTab` shows unlocked entries with chapter/page references.
- [x] Locked entries show requirement hints.
- [x] Clicking an entry opens the Book at the linked page.
- [x] All required translation keys exist in every language file.
