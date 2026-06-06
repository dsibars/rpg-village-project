# Migration Check Status — Vanilla JS → Vue 3

> **Goal:** This is a **technical migration only**. The same game, same texts, same layout, same UX — only the underlying framework changes from vanilla JS to Vue 3.
>
> **What we accept:** Tiny visual discrepancies that are an obvious consequence of switching frameworks (e.g., slightly different spacing from Vue's rendering pipeline, minor CSS cascade differences).
>
> **What we DO NOT accept:** Different texts, different layouts, added/removed features, or "improvements" that change how the page looks or behaves. If the vanilla page says "CHOOSE SAVE SLOT", the migrated page must say "CHOOSE SAVE SLOT". If the vanilla page has 2 columns, the migrated page must have 2 columns.
>
> **Rule:** We are not refactoring. We are not redesigning. We are migrating.

---

## Review Workflow: Screenshot-Driven Comparison

All review is done by comparing screenshots of the **vanilla** (v1) vs **migrated** (v2) UI.

### Screenshot Location
`ux/_migration_screenshots/`

### Naming Convention
| Prefix | Meaning |
|--------|---------|
| `v1_` | Vanilla JS (legacy `js/presentation/`) — the reference |
| `v2_` | Vue 3 (migrated `ux/`) — the target |

Both screenshots of the same page must share the same suffix. Example:
- `v1_initial_page_saveslot_selection.png`
- `v2_initial_page_saveslot_selection.png`

### Review Steps
1. **Place both screenshots side by side** (or toggle between them).
2. **Compare text content** — must be identical (casing, wording, labels).
3. **Compare layout** — columns, alignment, spacing, visible elements.
4. **Compare behavior** — hover states, click targets, modal triggers.
5. **Document findings** in [Findings](#findings) with the page name and screenshot filenames.
6. **Fix deltas only** — no improvements, no redesigns.

---

## Automated Screenshot Procedure

Any agent can generate screenshots automatically — no manual browser interaction required.

### Prerequisites

| Tool | Purpose | Install |
|------|---------|---------|
| Node.js + npm | Build & run | Already in project |
| Playwright | Browser automation | `npm install --save-dev playwright` |
| Chromium (via Playwright) | Headless browser | `npx playwright install chromium` |

### Step 1: Build Both Versions

Build **v1 first** (it clears `dist/`), then **v2** (it adds alongside without clearing):

```bash
npx vite build                              # v1 → dist/index.html
npx vite build --config vite.v2.config.js   # v2 → dist/index_v2.html
```

### Step 2: Run the Screenshot Script

```bash
node scripts/take-screenshots.mjs [v1|v2|both]
```

- `v1` — screenshots only the vanilla (reference) version
- `v2` — screenshots only the migrated (target) version
- `both` — screenshots both (default)

### What the Script Does

1. Starts a local static file server on `localhost:8765`
2. Opens a headless Chromium browser (1600×1300 viewport)
3. **Clears localStorage** to ensure a clean new-game state
4. Navigates to the app's save-slot screen
5. Clicks the first empty slot → starts new game
6. Waits for the intro dialog (`PresentationModal`) to appear
7. Takes **001 screenshot** (intro dialog)
8. Clicks **Skip** to dismiss the intro
9. Waits for the village main screen
10. Takes **002 screenshot** (village main screen)

### Output Location

Screenshots are saved to `ux/_migration_screenshots/`:

```
ux/_migration_screenshots/
├── v1_start_new_game_001.png   # v1 intro dialog
├── v1_start_new_game_002.png   # v1 village screen
├── v2_start_new_game_001.png   # v2 intro dialog
└── v2_start_new_game_002.png   # v2 village screen
```

### Extending the Script for New Flows

The script (`scripts/take-screenshots.mjs`) uses **CSS selectors** to find and interact with UI elements. To add a new flow (e.g., Heroes page, Shop page):

1. Add a new `async function` that navigates to the desired page
2. Use Playwright selectors (`page.$`, `page.click`, `page.waitForSelector`) to interact
3. Call `page.screenshot({ path: '...' })` at the right moment
4. Add the new screenshot filenames to the naming convention table above

Key selectors for v1 vs v2:

| Element | v1 Selector | v2 Selector |
|---------|-------------|-------------|
| Save slot screen | `.save-slots-screen` | `.save-slot-page` |
| Empty slot | `.save-slot-card.empty` | `.slot-card.empty` |
| Intro overlay | `.presentation-overlay` | `.presentation-overlay` |
| Skip button | `.presentation-skip` | `.presentation-skip` |
| Next button | `.presentation-next` | `.presentation-next` |
| Village page | `.village-dashboard-grid` | `.village-page` |

---

## Reviewed Pages

| Page / Screen | v1 Screenshot | v2 Screenshot | Status | Findings |
|---------------|---------------|---------------|--------|----------|
| Save Slot Selection | `v1_initial_page_saveslot_selection.png` | `v2_initial_page_saveslot_selection.png` | ✅ Re-verified | All critical/significant findings fixed. E-001 (subtitle) approved as exception. |
| New Game Lore Intro | `v1_start_new_game_001.png` | `v2_start_new_game_001.png` | ✅ Re-verified | F-012, F-013, F-014, F-015 fixed. |
| Village Main Screen | `v1_start_new_game_002.png` | `v2_start_new_game_002.png` | 🛠️ Fixed | F-016 through F-020, F-022, F-024, F-025 fixed. F-021, F-023 remain (structural layout differences). |
| _(next page TBD)_ | — | — | ⏳ Pending | — |

> **Legend:** ⏳ Pending → 🔍 In Review → ✅ Verified → ❌ Issues Found → 🛠️ Fixed → ✅ Re-verified

---

## Findings

Issues detected from screenshot comparison. Format: `F-XXX: Brief description — page name`.

### 🔴 Critical (broken functionality or text/layout mismatch)

#### F-001: SaveSlotPage — Population renders as raw JSON object instead of number
- **Page:** Save Slot Selection
- **What:** `slot.summary?.village?.population` renders the full population object as a JSON string. Vanilla has defensive fallback: `summary.village.population?.total || summary.village.population || 0`. Vue only does `?? 0`, missing the `.total` fallback for object-shaped legacy save data.
- **Fix:** Template should read `slot.summary?.village?.population?.total ?? slot.summary?.village?.population ?? 0`.
- **Status:** 🛠️ Fixed

#### F-002: SaveSlotPage — Language selector shows empty/blank value
- **Page:** Save Slot Selection
- **What:** Language dropdown appears blank instead of showing the current language.
- **Root Cause:** Template binds `:value="currentLanguage.value"`. In Vue template context, `currentLanguage` (a ref) is auto-unwrapped to the string value; accessing `.value` on the primitive string returns `undefined`.
- **Fix:** Change to `:value="currentLanguage"`.
- **Status:** 🛠️ Fixed

#### F-003: SaveSlotPage — Title changed from "CHOOSE SAVE SLOT" to "RPG VILLAGE"
- **Page:** Save Slot Selection
- **What:** Vanilla page shows a functional title "CHOOSE SAVE SLOT". Migrated page shows a branding title "RPG VILLAGE".
- **Fix:** Revert h1 text to `t('shared_uxelm_save_slot_title')` and apply vanilla heading styling (white, uppercase, smaller size).
- **Status:** 🛠️ Fixed

#### F-004: SaveSlotPage — "EMPTY" slot styling lost uppercase + gray color
- **Page:** Save Slot Selection
- **What:** Vanilla shows "EMPTY" in uppercase with gray/neutral styling (`var(--text-muted)`). Migrated shows "Empty" in title case with purple styling (`var(--color-primary-light)`).
- **Fix:** Add `.slot-card.empty .slot-number-title` CSS rule with `text-transform: uppercase`, `color: var(--text-muted)`, and matching font-size.
- **Status:** 🛠️ Fixed

#### F-005: SaveSlotPage — Grid changed from 2 columns to 3 columns
- **Page:** Save Slot Selection
- **What:** Vanilla uses a 2-column grid. Migrated uses 3 columns via `repeat(auto-fill, minmax(280px, 1fr))`, making slots cramped.
- **Fix:** Change grid to `repeat(2, 1fr)` to match vanilla.
- **Status:** 🛠️ Fixed

#### F-006: SaveSlotPage — "DAY X" lost uppercase/bold styling
- **Page:** Save Slot Selection
- **What:** Vanilla shows "DAY 2" in uppercase, small (0.7rem), and bold (600). Migrated shows "Day 2" in sentence case, large (1.1rem), and heavier (700).
- **Fix:** Add `.slot-card:not(.empty) .slot-number-title` rule with `text-transform: uppercase`, `font-size: 0.7rem`, `font-weight: 600`, and `letter-spacing: 0.5px`.
- **Status:** 🛠️ Fixed

#### F-007: SaveSlotPage — Delete button missing mobile visibility override
- **Page:** Save Slot Selection
- **What:** Both vanilla and Vue hide the delete button by default (`opacity: 0`) and show on hover. Vanilla adds a mobile breakpoint `@media (max-width: 640px) { opacity: 1 }` so touch users can see it. Vue is missing this override.
- **Fix:** Add the mobile breakpoint override to `.btn-delete`.
- **Status:** 🛠️ Fixed

### 🟡 Significant (degraded experience — not blocking but noticeable)

#### F-010: SaveSlotPage — Empty slot color inversion
- **Page:** Save Slot Selection
- **What:** Vanilla empty slots show "EMPTY" in gray and "Start New Game" in purple (`var(--accent-color)`). Vue shows "Empty" in purple and "Start New Game" in gray (`var(--text-muted)`). The accent/muted colors are swapped.
- **Fix:** Set `.slot-action-new` color to the accent color (purple) and empty slot title to muted (gray).
- **Status:** 🛠️ Fixed

#### F-011: SaveSlotPage — "Continue" lost bold weight and size
- **Page:** Save Slot Selection
- **What:** Vanilla `.slot-primary` is `font-weight: 700`, `font-size: 1.1rem`. Vue uses `font-weight: 500`, `font-size: 0.9rem`, making "Continue" appear noticeably lighter and smaller.
- **Fix:** Align `.slot-primary` to vanilla values.
- **Status:** 🛠️ Fixed

#### F-012: New Game Intro — v2 shows simplified welcome modal instead of 3-page lore carousel
- **Page:** New Game Lore Intro
- **What:** Vanilla shows the `PresentationModal` with `pres_prologue` (3 images, 3 lore texts, pagination dots, NEXT/FINISH/SKIP). Vue shows `IntroDialog.vue` — a single-page centered modal with title "Welcome to RPG Village", no images, no pagination, just a CONTINUE button. Completely different content, layout, and component.
- **Root Cause:** `IntroDialog.vue` was created as a shortcut, bypassing the existing `PresentationModal.vue` and the entire `PresentationCatalog` / `PresentationService` architecture.
- **Fix:** Remove `IntroDialog.vue`. Route new-game intro through `PresentationModal.vue` using `pres_prologue` catalog data. Call `markAsSeen` on completion via existing `onPresentationComplete` handler.
- **Status:** 🛠️ Fixed

#### F-013: PresentationModal.vue — missing skip button, replay badge, mobile adaptation, animations
- **Page:** New Game Lore Intro / Post-Day Presentations / Chronicle Replays
- **What:** The Vue `PresentationModal.vue` lacked several v1 features: skip button (top-right), replay badge (`isReplay=true`), mobile bottom-sheet `@media` styles, image/text `presFadeIn` animations, and `<img>` error fallback.
- **Fix:** Rewrote `PresentationModal.vue` as a standalone overlay (decoupled from `FullViewOverlay`). Ported all v1 CSS including blur backdrop, slide-up animation, mobile sheet adaptation, skip/replay UI, and fade animations. Added `isReplay` prop. Used `<img>` with `@error` handler.
- **Status:** 🛠️ Fixed

#### F-014: PresentationModal.vue — title header and background mismatch
- **Page:** New Game Lore Intro / Post-Day Presentations / Chronicle Replays
- **What:** The old Vue `PresentationModal.vue` extended `FullViewOverlay`, which forced a title header ("✨ Story") and a solid `var(--bg-base)` background. v1 has no title header and uses `rgba(0,0,0,0.92)` with `backdrop-filter: blur(12px)`.
- **Fix:** Decoupled from `FullViewOverlay`. The new standalone component has no header and uses the correct glassmorphism background treatment matching v1.
- **Status:** 🛠️ Fixed

#### F-015: Orphaned translation keys `intro_uxelm_*` and `shared_uxelm_story`
- **Page:** N/A (i18n cleanup)
- **What:** `IntroDialog.vue` introduced translation keys (`intro_uxelm_title`, `intro_uxelm_era`, `intro_uxelm_text`, `shared_uxelm_story`) that are not used by vanilla. After removing `IntroDialog.vue`, these keys were orphaned across all 5 language files.
- **Fix:** Removed orphaned keys from `en.js`, `es.js`, `ca.js`, `gl.js`, `eu.js`.
- **Status:** 🛠️ Fixed

#### F-016: Village Main — "Day {day} 1" template variable leaking to UI
- **Page:** Village Main Screen
- **What:** `VillageCalendar.vue` shows literal `Day {day} 1` because `calendar_info_day` is defined as `"Day {day}"` but the component concatenates the raw translation without substituting the placeholder.
- **Fix:** Replaced concatenation with `t('calendar_info_day').replace('{day}', dayOfSeason)`.
- **Status:** 🛠️ Fixed

#### F-017: Village Main — Storage bar color changed from purple gradient to solid green
- **Page:** Village Main Screen
- **What:** v1 uses a purple/indigo gradient for the storage bar. v2 uses flat `#22c55e` green. Warning and danger states also lost their gradients.
- **Fix:** Restored v1 gradient CSS in `VillagePage.vue`: `linear-gradient(90deg, var(--color-primary), var(--color-primary-light))` for default, amber gradient for warning, red gradient + pulse animation for danger.
- **Status:** 🛠️ Fixed

#### F-018: Village Main — Building grid changed from 3 columns to auto-fill
- **Page:** Village Main Screen
- **What:** v1 explicitly uses `repeat(3, 1fr)`. v2 uses `repeat(auto-fill, minmax(90px, 1fr))`, producing a 4-column layout at this viewport width.
- **Fix:** Changed `VillageCanvas.vue` grid to `repeat(3, 1fr)` with mobile override `repeat(2, 1fr)` below 575px.
- **Status:** 🛠️ Fixed

#### F-019: Village Main — Missing "VILLAGE" page title
- **Page:** Village Main Screen
- **What:** v1 has a prominent `VILLAGE` heading in the header bar. v2 has no page title — the town hall level label is inside the building card.
- **Fix:** Added `village-header-bar` to `VillagePage.vue` with `VILLAGE` title, town hall badge, storage bar, and recall button. Moved town hall level out of canvas card.
- **Status:** 🛠️ Fixed

#### F-020: Village Main — Daily Report Recall button missing
- **Page:** Village Main Screen
- **What:** v1 header bar has a button to re-open the previous day's report. v2 completely lacks this.
- **Fix:** Added recall button to `VillagePage.vue` header bar (conditional on `hasDailyReport`). Wired `@recallDailyReport` event through `App.vue` to set `showDailyReport = true`.
- **Status:** 🛠️ Fixed

#### F-022: Village Main — Text casing differences (uppercase headers lost)
- **Page:** Village Main Screen
- **What:** v1 uses `text-transform: uppercase` for many headers (tile names, "DAY 1", "NEXT DAY", "CODEX", "CHRONICLE", panel titles). v2 uses title/sentence case almost everywhere.
- **Fix:** Applied `text-transform: uppercase` to `TopBar.vue` (day display, next-day button, codex/chronicle buttons), `VillagePage.vue` header title, and all village panel headers (LaborPool, ConstructionQueue, VillageDefense, DailyObjectives, VillageCalendar).
- **Status:** 🛠️ Fixed

#### F-024: Village Main — Building tile names lost uppercase transform
- **Page:** Village Main Screen
- **What:** v1 CSS applies `text-transform: uppercase` to `.village-tile-name`. v2 has no such transform.
- **Fix:** Added `text-transform: uppercase` to `.tile-name` in `VillageCanvas.vue`.
- **Status:** 🛠️ Fixed

#### F-025: Village Main — Panel title i18n keys changed from v1 to v2-specific keys
- **Page:** Village Main Screen
- **What:** `LaborPool.vue` used `village_uxelm_workers` ("Labor Assignment"), `ConstructionQueue.vue` used `village_uxelm_projects` ("Active Projects"), `VillageDefense.vue` used `village_uxelm_defense` ("Village Defense"). v1 uses `village_uxelm_role` ("Specialization"), `village_uxelm_construction` ("Construction"), `village_uxelm_defender` ("Defenders").
- **Fix:** Reverted components to use v1 i18n keys. Removed orphaned v2-specific keys from all 5 language files.
- **Status:** 🛠️ Fixed

### 🟢 Minor (tiny visual discrepancies acceptable for technical migration)

_(None yet)_

---

## Fix Log

| Fix ID | Date | Page | Description |
|--------|------|------|-------------|
| F-001 | 2026-06-06 | Save Slot Selection | Population binding: added `.total` fallback for object-shaped legacy save data. |
| F-002 | 2026-06-06 | Save Slot Selection | Language selector: fixed ref unwrapping in template (`:value="currentLanguage"`). |
| F-003 | 2026-06-06 | Save Slot Selection | Title: reverted to `shared_uxelm_save_slot_title`; applied vanilla heading styling. |
| F-004 | 2026-06-06 | Save Slot Selection | Empty slot label: added uppercase transform and muted gray color. |
| F-005 | 2026-06-06 | Save Slot Selection | Grid: changed from `auto-fill` to fixed 2-column layout. |
| F-006 | 2026-06-06 | Save Slot Selection | Day label: restored uppercase, smaller font-size, and vanilla weight. |
| F-007 | 2026-06-06 | Save Slot Selection | Delete button: added mobile breakpoint override (`opacity: 1` below 640px). |
| F-010 | 2026-06-06 | Save Slot Selection | Empty slot colors: swapped accent/muted to match vanilla (EMPTY=gray, Start New Game=purple). |
| F-011 | 2026-06-06 | Save Slot Selection | Continue text: restored `font-weight: 700` and `font-size: 1.1rem`. |
| F-012 | 2026-06-06 | New Game Lore Intro | Replaced `IntroDialog.vue` with `PresentationModal.vue` + `pres_prologue` catalog data. |
| F-013 | 2026-06-06 | New Game Lore Intro | PresentationModal.vue: added skip button, `isReplay` prop/badge, mobile styles, fade animations, image error fallback. |
| F-014 | 2026-06-06 | New Game Lore Intro | Decoupled PresentationModal.vue from `FullViewOverlay`; restored glassmorphism background, removed title header. |
| F-015 | 2026-06-06 | i18n | Removed orphaned `intro_uxelm_*` and `shared_uxelm_story` keys from all translation files. |
| F-016 | 2026-06-06 | Village Main | VillageCalendar: fixed `Day {day}` template leak — now interpolates `dayOfSeason` correctly. |
| F-017 | 2026-06-06 | Village Main | Storage bar: restored purple/indigo gradient to match v1. |
| F-018 | 2026-06-06 | Village Main | Building grid: changed from `auto-fill` to fixed `repeat(3, 1fr)` with mobile `repeat(2, 1fr)`. |
| F-020 | 2026-06-06 | Village Main | Added missing Daily Report Recall button to village header. |
| F-019 | 2026-06-06 | Village Main | Added missing "VILLAGE" page title header. |
| F-022 | 2026-06-06 | Village Main | Restored uppercase text transforms for headers matching v1 (DAY, NEXT DAY, CODEX, CHRONICLE, panel titles). |
| F-024 | 2026-06-06 | Village Main | Building tile names: restored `text-transform: uppercase` CSS. |
| F-025 | 2026-06-06 | Village Main | Reverted panel titles to v1 i18n keys (Specialization, Construction, Defenders). Removed orphaned v2 keys. |

---

## Exceptions

Features or changes that are **intentionally different** from vanilla. Each must have a justification.

| Exception ID | Page | Description | Justification |
|--------------|------|-------------|---------------|
| E-001 | Save Slot Selection | Subtitle paragraph `shared_uxelm_save_slot_subtitle` added below the title. Vanilla only shows hardcoded "RPG Village" as the subtitle line. | User-approved improvement: adds functional context for the player without changing layout or behavior. |

---

## Architecture Notes

Observations about the migration architecture that are not bugs.

1. **`shallowRef` is correct**: The game state is replaced wholesale on each tick. `shallowRef` avoids deep proxying thousands of nested objects. This matches the architecture doc §6.2.
2. **State shape differences**: The Vue composable `useGameState()` exposes `gameState.value.expeditionRegions` as an array. The legacy `ExploreView.getRegions()` treats `state.expeditionRegions` as an **object** (using `Object.entries()`). Verify which shape the engine actually outputs.
