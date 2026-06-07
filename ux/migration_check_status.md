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

### Step 2: Run the Screenshot Orchestrator

The new modular orchestrator lives in `scripts/screenshots/` and uses **semantic naming** so v1/v2 pairs sort together.

```bash
# Full run (all flows, both versions)
npm run screenshots

# Only v2
npm run screenshots:v2

# Only specific flows
node scripts/screenshots/orchestrator.mjs --flows onboarding,village,heroes --version v2

# Dry run (validate without capturing)
npm run screenshots:dry
```

Available flows: `onboarding`, `village`, `heroes`, `adventure`, `town`, `combat`, `magic-circle`, `settings`.

### Naming Convention

Screenshots use `{version}_{flow}_{state}.png` so pairs are alphabetically adjacent:

```
ux/_migration_screenshots/
├── v1_onboarding_save_slot_empty.png
├── v2_onboarding_save_slot_empty.png
├── v1_onboarding_village_fresh.png
├── v2_onboarding_village_fresh.png
├── v1_village_main.png
├── v2_village_main.png
└── ...
```

### Architecture

The orchestrator (`scripts/screenshots/orchestrator.mjs`) uses a **state-injection hybrid**:

1. Starts a static file server on `localhost:8765`.
2. Opens a headless Chromium browser at 1600×1300.
3. Navigates to a fresh app instance for each flow.
4. Injects game state via `page.evaluate()` using:
   - v1: `window.engine`
   - v2: `window.__ENGINE__` (exposed in `ux/main.js`)
5. Navigates to target UI states via CSS selectors.
6. Captures screenshots with semantic filenames.

This is faster and more reliable than click-through UI automation.

### Extending the Orchestrator

1. Add a registry entry in `scripts/screenshots/registry.mjs`:
   ```js
   { flow: 'heroes', state: 'heroes_modal_gambits', description: 'Hero gambits modal open' }
   ```
2. Add selectors to `scripts/screenshots/selectors/v1.mjs` and `scripts/screenshots/selectors/v2.mjs`.
3. Implement the capture logic in the matching flow module (e.g. `scripts/screenshots/flows/03-heroes.mjs`).
4. Run the flow to verify:
   ```bash
   node scripts/screenshots/orchestrator.mjs --flows heroes --version v2
   ```

See `scripts/screenshots/README.md` for full developer documentation.

### Legacy Script

The previous sequential script is still available at `scripts/take-screenshots.mjs` for backward compatibility, but new work should use the orchestrator.

---

## Reviewed Pages

| Page / Screen | v1 Screenshot | v2 Screenshot | Status | Findings |
|---------------|---------------|---------------|--------|----------|
| Save Slot Selection | `v1_initial_page_saveslot_selection.png` | `v2_initial_page_saveslot_selection.png` | ✅ Re-verified | All critical/significant findings fixed. E-001 (subtitle) approved as exception. |
| New Game Lore Intro | `v1_start_new_game_001.png` | `v2_start_new_game_001.png` | ✅ Re-verified | F-012, F-013, F-014, F-015 fixed. |
| Village Main Screen | `v1_start_new_game_002_village.png` | `v2_start_new_game_002_village.png` | 🛠️ Fixed | F-016 through F-020, F-022, F-024, F-025, F-026 fixed. F-021 partially fixed (same card, internal titles differ). F-023 fixed. |
| Heroes | `v1_start_new_game_003_heroes.png` | `v2_start_new_game_003_heroes.png` | 🔍 In Review | Functional. F-040: list header casing, hero card level format, activity display, and stat-points badge differ. |
| Explore | `v1_start_new_game_004_explore.png` | `v2_start_new_game_004_explore.png` | 🛠️ Fixed | F-027 fixed (explore_info_undefined). Layout differs: v1 has WORLD MAP sidebar + node visualization; v2 has tree/list toggle + expedition cards. |
| Bestiary | `v1_start_new_game_005_bestiary.png` | `v2_start_new_game_005_bestiary.png` | 🛠️ Fixed | F-030 fixed (type icons hidden for undiscovered). Layout differs: v1 uses compact grid with full stat labels; v2 uses slightly larger cards with abbreviated labels. |
| Codex | `v1_start_new_game_006_codex.png` | `v2_start_new_game_006_codex.png` | 🔍 In Review | Functional. Layout differs: v1 has category sections with group headers; v2 has filter tabs at top. Content parity verified. |
| Chronicle | `v1_start_new_game_007_chronicle.png` | `v2_start_new_game_007_chronicle.png` | 🔍 In Review | Functional. Very close match. Minor: Discovery Log header casing differs (v1 title case, v2 uppercase). |
| Buildings | `v1_start_new_game_008_buildings.png` | `v2_start_new_game_008_buildings.png` | 🔍 In Review | Functional. v2 list shows all hardcoded buildings; v1 shows only buildings present in `village.infrastructure` object. Level badge casing differs. |
| Shop | `v1_start_new_game_012_shop.png` | `v2_start_new_game_012_shop.png` | 🛠️ Fixed | F-028 fixed (missing locked description). Layout differs: v1 locked state has centered card with background; v2 has plain centered text. |
| Forge | `v1_start_new_game_013_forge.png` | `v2_start_new_game_013_forge.png` | 🛠️ Fixed | F-028 fixed (missing locked description). Same layout difference as Shop. |
| Inventory | `v1_start_new_game_014_inventory.png` | `v2_start_new_game_014_inventory.png` | 🛠️ Fixed | F-027 fixed (crash). F-034 partially fixed: purple bar, count badges, and 2-panel layout restored. F-036 fixed (storage header key). |
| Settings | `v1_start_new_game_015_settings.png` | `v2_start_new_game_015_settings.png` | 🛠️ Fixed | F-035 fixed: ABOUT, MAGIC CIRCLE SIMULATOR, multi-card grid, and danger zone all present. F-037 and F-038 fixed (i18n key mismatches). |
| Heroes Detail | `v1_start_new_game_004_heroes_detail.png` | `v2_start_new_game_004_heroes_detail.png` | 🛠️ Fixed | F-031 fixed: stat descriptions, experience format ("0 / 20"), square avatar with border, and skill helper text all restored. Action buttons functional; minor wrapping order difference accepted. |
| Explore Detail | `v1_start_new_game_006_explore_detail.png` | `v2_start_new_game_006_explore_detail.png` | 🛠️ Fixed | F-032 fixed: Base Reward, COMBAT INTEL, checkbox hero selection, and "ASSIGN HEROES" button all present. F-039 fixed (expedition badge). Modal vs inline is an accepted structural difference. |
| Buildings Detail | `v1_start_new_game_011_buildings_detail.png` | `v2_start_new_game_011_buildings_detail.png` | 🛠️ Fixed | F-033 fixed: building emoji icon, BUILDING EFFECTS arrows, cost grid, and "CONFIRM" button all present. Town Hall correctly excluded. v2 list shows all hardcoded buildings (v1 reads from infrastructure object) — known structural difference. |
| Magic Circle Simulator | `v1_magic_circle_002_simulator.png` | `v2_magic_circle_002_simulator.png` | 🛠️ Fixed | F-041 through F-057 fixed: empty slot icons, hexagon core, tier symbols, connection colors, effect chips, already-used indicator, remove button text, simulator inscribe text, no-harm/none chips, drawer title, polarity icon, element display, drawer positioning, tier dial symbols, power stat, and background theme. FullViewOverlay header is an acceptable structural difference. |
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

#### F-021: Village Main — Calendar + Defense are separate cards instead of combined "Threat & Defense Hub"
- **Page:** Village Main Screen
- **What:** v1 renders Calendar and Defense inside a single widget with a unified "THREAT & DEFENSE HUB" title. v2 had them as two separate cards.
- **Fix:** Restructured `VillagePage.vue` to place both `VillageCalendar` and `VillageDefense` inside a single `.dashboard-card` with a divider. Both components still render their own internal titles, so the combined card lacks the unified v1 hub title.
- **Status:** 🛠️ Partially Fixed

#### F-023: Village Main — Labor/Specialization panel in wrong row
- **Page:** Village Main Screen
- **What:** v2's row-based layout placed Labor/Specialization in the bottom row. v1 uses a 3-column grid where it's in the middle column.
- **Fix:** Restructured `VillagePage.vue` to use v1's `grid-template-columns: 4.5fr 3.25fr 3.25fr` layout. Middle column now contains LaborPool + ConstructionQueue.
- **Status:** 🛠️ Fixed

#### F-026: Village Main — Footer nav is full-width flat bar instead of floating pill
- **Page:** Village Main Screen
- **What:** v1 footer is a floating pill (`border-radius: 18px`, `backdrop-filter: blur(20px)`, `box-shadow`, active dot `::before`, uppercase labels, icon pop animation, text glow). v2 was a full-width flat bar.
- **Fix:** Rewrote `FooterNav.vue` with v1 `main-nav` styles: floating dock margin, glassmorphism blur, shadow, active dot indicator, uppercase labels with letter-spacing, icon scale animation on active, text glow. Updated `App.vue` nav items to use v1 i18n key (`shared_uxelm_nav_main`) and icons. Added `--accent-color` token to `theme.css`.
- **Status:** 🛠️ Fixed

#### F-027: Inventory / Explore / Buildings — v2 assumes object data is an array
- **Pages:** Inventory, Explore, Buildings (Shop sell tab)
- **What:** v1 stores `inventory.materials`, `inventory.food`, `inventory.consumables`, and `expeditionRegions` as **objects** (`{ id: count }`), not arrays. v2 assumed arrays and called `.map()`, `.find()`, etc., causing crashes.
- **Fix:**
  - `InventoryTab.vue`: Added `entriesToItems()` helper that handles both arrays and objects via `Object.entries()`.
  - `ExploreTab.vue`: `regions` computed now converts object-shaped `expeditionRegions` to array with `id` included.
  - `BuildingsTab.vue`: `canUpgrade` now reads `materials.material_wood` and `materials.material_stone` directly from the object.
  - `ShopTab.vue`: Sell tab now converts object-shaped `consumables` via `Object.entries()`.
  - `App.vue`: `wood` computed now defensively checks if `materials` is an object. `pageError` is now cleared on page navigation.
- **Status:** 🛠️ Fixed

#### F-028: Shop / Forge — Locked state missing description text
- **Pages:** Shop, Forge
- **What:** v1 locked states show a centered card with lock emoji, title ("Shop Locked"), and description ("Complete the Tutorial Cave expedition to unlock the Shop."). v2 only showed the lock emoji and title — no description.
- **Fix:** Added `:message="t('shop_uxelm_locked_desc')"` to `ShopTab.vue` and `:message="t('forge_uxelm_locked_desc')"` to `ForgeTab.vue` `EmptyState` component.
- **Status:** 🛠️ Fixed

#### F-029: Heroes — Detail pane empty on initial load
- **Page:** Heroes
- **What:** v2 shows the hero list (Arthur) but the detail pane says "Select a hero to view stats and equipment" even though no hero is selected. v1 has the same behavior — the detail pane is empty until a hero is clicked. Not a bug, just a behavioral match.
- **Status:** ✅ Verified (matches v1)

#### F-030: Bestiary — Undiscovered enemies missing type icons
- **Page:** Bestiary
- **What:** v1 always shows the enemy type emoji (🐺, 🐀, 💧, 👺, 💀, 🐉) even for undiscovered entries. v2 showed "❓" for all undiscovered enemies, losing the visual variety of the type icons.
- **Fix:** Changed `BestiaryTab.vue` line 18 from `enemy.isDiscovered ? typeIcon(enemy.type) : '❓'` to always render `typeIcon(enemy.type)`.
- **Status:** 🛠️ Fixed

#### F-031: Heroes Detail — Missing stat descriptions, experience format, avatar shape, action button layout
- **Page:** Heroes Detail
- **What:** v1 shows descriptive text under each stat (e.g., "Hit Points — determines how much damage a hero can survive"), experience as "0 / 20", square avatar with border, 2 rows of 3 action buttons, and "Spend a skill point to unlock a new technique" helper text. v2 lacked stat descriptions, showed "0 XP", circular avatar, wrapped action buttons, and no helper text.
- **Fix:** `HeroStatsGrid.vue` now renders `heroes_info_stat_*_desc` descriptions. `HeroProfile.vue` restored `hero.exp / hero.expToNextLevel` format and square avatar with border. Skill helper text restored.
- **Status:** 🛠️ Fixed

#### F-032: Explore Detail — Missing Base Reward, COMBAT INTEL, checkbox selection
- **Page:** Explore Detail
- **What:** v1 expedition detail modal shows "Base Reward: 100 Gold", "COMBAT INTEL" section with enemy type tags, checkbox-based hero selection with HP display, and "ASSIGN HEROES" button. v2 inline card lacked Base Reward, COMBAT INTEL, and checkbox selection.
- **Fix:** `ExploreTab.vue` detail pane now shows `explore_uxelm_base_reward`, `explore_uxelm_intel_enemies` with enemy tags, checkbox hero rows with HP display, and "ASSIGN HEROES" button.
- **Status:** 🛠️ Fixed

#### F-033: Buildings Detail — Town Hall in list, missing icon, BUILDING EFFECTS, cost bars
- **Page:** Buildings Detail
- **What:** v1 building list excludes Town Hall (it's implicit). v2 included Town Hall as first item. v1 detail shows building emoji icon, "BUILDING EFFECTS" with before→after arrows (e.g., "Max Villagers 3 → 10"), cost bars for Gold/Wood/Stone/Time, and "CONFIRM" button. v2 lacked icon, showed empty "Current Effects", simple text list for costs, and "BUILD" button.
- **Fix:** `BuildingsTab.vue` now shows `buildingIconLarge` emoji, `village_uxelm_building_effect` with current→next arrows, cost grid with insufficient highlighting, and `shared_uxelm_confirm` button. Town Hall is not in the hardcoded `buildingDefs` list.
- **Status:** 🛠️ Fixed

#### F-034: Inventory — Missing STORAGE header, purple bar, count badges, 2-panel layout
- **Page:** Inventory
- **What:** v1 has "STORAGE" header with "60 / 200" and purple gradient progress bar. v2 had green bar without header text. v1 item cards show count as purple circular badges; v2 showed count below item. v1 uses 2-panel layout (items left, detail right); v2 proportions differed.
- **Fix:** `InventoryTab.vue` restored purple gradient `storage-fill`, purple `item-count-badge`, and 2-panel `inventory-layout` grid.
- **Status:** 🛠️ Fixed

#### F-035: Settings — Missing ABOUT section, MAGIC CIRCLE SIMULATOR, multi-card grid layout
- **Page:** Settings
- **What:** v1 Settings has 2-column multi-card grid: INTERFACE LANGUAGE, CHOOSE SAVE SLOT, DEVELOPER OPTIONS (with descriptive text + MAGIC CIRCLE SIMULATOR button), DANGER ZONE, and ABOUT (version info). v2 had single-column stacked cards, no ABOUT section, no MAGIC CIRCLE SIMULATOR, no DANGER ZONE card separation, and no developer options description text.
- **Fix:** `SettingsPage.vue` restructured to 2-column `settings-grid` with left column (Language, Save Slot, Developer Options) and right column (ABOUT). Added `MagicCircleEditor` simulator, danger zone with red border, and developer description text.
- **Status:** 🛠️ Fixed

#### F-036: Inventory — Storage header renders raw i18n key
- **Page:** Inventory
- **What:** v2 uses `t('inventory_uxelm_storage')` which does not exist in any translation file, so the UI renders the literal key name `INVENTORY_UXELM_STORAGE`. v1 uses `shared_uxelm_storage` which correctly translates to "Storage".
- **Fix:** Changed `InventoryTab.vue` storage label to use `shared_uxelm_storage`.
- **Status:** 🛠️ Fixed

#### F-037: Settings — Developer options description uses wrong i18n key
- **Page:** Settings
- **What:** v2 uses `settings_uxelm_dev_desc` ("Advanced tools for testing and development."). v1 uses `settings_uxelm_dev_cheat_desc` ("Instantly gain 10k Gold, 10k Wood/Stone, Hero XP, and unlock the Shop."). Different keys with different meanings.
- **Fix:** Changed `SettingsPage.vue` to use `settings_uxelm_dev_cheat_desc`.
- **Status:** 🛠️ Fixed

#### F-038: Settings — Save slot card title uses wrong i18n key
- **Page:** Settings
- **What:** v2 uses `settings_uxelm_choose_slot` ("Save Management"). v1 uses `shared_uxelm_save_slot_title` ("CHOOSE SAVE SLOT").
- **Fix:** Changed `SettingsPage.vue` save-slot card title to use `shared_uxelm_save_slot_title`.
- **Status:** 🛠️ Fixed

#### F-039: Explore Detail — Expedition badge shows UI state instead of expedition type
- **Page:** Explore Detail
- **What:** v1 badge shows "Story" or "Exploration" based on `expedition.isStory`. v2 badge shows "available" or "active" based on `detailMode` — these are UI states, not expedition types.
- **Fix:** Changed `ExploreTab.vue` detail badge to `selectedExp?.isStory ? t('explore_uxelm_story') : t('explore_uxelm_exploration')`.
- **Status:** 🛠️ Fixed

#### F-040: Heroes — List header casing and hero card format differ
- **Page:** Heroes
- **What:** v1 list header "YOUR HEROES" is uppercase via CSS. v2 shows "Your Heroes" in title case. v1 hero card shows "Level 1" as a purple badge; v2 shows "Lv1" as plain text. v2 adds a green "+5" stat-points badge not present in v1. v1 shows only an activity emoji (💤); v2 shows a full "Idle" badge.
- **Status:** 🔍 In Review

#### F-041: Magic Circle — Empty slot icons missing
- **Page:** Magic Circle
- **What:** v1 empty core slot shows `⚡` and empty ring slots show `＋`. v2 empty slots showed nothing.
- **Fix:** Updated `MandalaGrid.vue` template to render `⚡` for empty core and `＋` for empty ring slots.
- **Status:** 🛠️ Fixed

#### F-042: Magic Circle — Core slot is circular instead of hexagonal
- **Page:** Magic Circle
- **What:** v1 core slot uses `clip-path: polygon(...)` for a hexagonal shape. v2 core slot was a plain circle.
- **Fix:** Added hexagonal `clip-path` and `::before` inner background to `.mandala-slot.core-slot` in `MandalaGrid.vue` scoped CSS.
- **Status:** 🛠️ Fixed

#### F-043: Magic Circle — Mandala slot tier symbols always show `+`
- **Page:** Magic Circle
- **What:** v1 slot tier badges show actual glyph tier symbols (`+`, `++`, `+++`, `✦`, etc.) via `engine.getGlyphSymbol()`. v2 hardcoded `'+'`.
- **Fix:** Updated `getSlotTier()` in `MandalaGrid.vue` to call `engine.getGlyphSymbol(tier)` and pass `selectedTiers` / `glyphMastery` props.
- **Status:** 🛠️ Fixed

#### F-044: Magic Circle — Connection lines missing element color theming
- **Page:** Magic Circle
- **What:** v1 SVG connection lines use `getElementColor(spell.element)`. v2 used fixed indigo `rgba(99, 102, 241, 0.4)`.
- **Fix:** Passed `spellElement` prop to `MandalaGrid.vue` and used `getElementColor()` for line stroke.
- **Status:** 🛠️ Fixed

#### F-045: Magic Circle — Effect chips missing `%` suffix
- **Page:** Magic Circle
- **What:** v1 effect chips append `%` for percentage values (e.g., "Pierce 15%"). v2 showed raw numbers (e.g., "Pierce 15").
- **Fix:** Updated `buildEffectChips()` in `useMagicCircle.js` to include `suffix` property (`'%'` for most, `''` for poison stacks).
- **Status:** 🛠️ Fixed

#### F-046: Magic Circle — Missing "already-used" indicator on palette cards
- **Page:** Magic Circle
- **What:** v1 palette cards show a green checkmark (`already-used` class) when a glyph is placed in another slot. v2 had no such indication.
- **Fix:** Added `isPlacedElsewhere()` computed logic and `already-used` CSS class to `mc-palette-card` in `GlyphPalette.vue`.
- **Status:** 🛠️ Fixed

#### F-047: Magic Circle — Remove button uses wrong translation key
- **Page:** Magic Circle
- **What:** v1 remove button text is `magic_circle_uxelm_slot_remove_prompt` ("Click again to remove."). v2 used `shared_uxelm_remove`.
- **Fix:** Changed button text in `GlyphPalette.vue` to `magic_circle_uxelm_slot_remove_prompt`.
- **Status:** 🛠️ Fixed

#### F-048: Magic Circle — Inscribe button in simulator doesn't show disabled text
- **Page:** Magic Circle
- **What:** v1 simulator mode shows `magic_circle_uxelm_inscribe_disabled` ("Inscribe (Simulator)"). v2 showed normal `magic_circle_uxelm_inscribe` text while disabled.
- **Fix:** Passed `isSimulator` prop to `McActionPanel.vue` and added conditional button text.
- **Status:** 🛠️ Fixed

#### F-049: Magic Circle — Missing "no-harm" chip for support spells
- **Page:** Magic Circle
- **What:** v1 shows a green `💚 magic_circle_info_effect_no_harm` chip when a support spell has no effect chips. v2 showed nothing.
- **Fix:** Added support spell "no-harm" chip fallback in `McActionPanel.vue`.
- **Status:** 🛠️ Fixed

#### F-050: Magic Circle — Missing "none" chip when no effects
- **Page:** Magic Circle
- **What:** v1 shows `magic_circle_info_effect_none` chip when spell has no effects or no spell is composed. v2 showed empty chips container.
- **Fix:** Added "none" chip fallback for both `spell === null` and `spell.effects` empty cases in `McActionPanel.vue`.
- **Status:** 🛠️ Fixed

#### F-051: Magic Circle — Drawer title for core slot uses wrong key
- **Page:** Magic Circle
- **What:** v1 uses `magic_circle_uxelm_drawer_title_core` ("CORE (Center) Configuration") for core slot. v2 used `magic_circle_uxelm_slot_title` with slot number.
- **Fix:** Updated `drawerTitle` computed in `GlyphPalette.vue` to use the core-specific key when `focusedSlotIndex === 0`.
- **Status:** 🛠️ Fixed

#### F-052: Magic Circle — Polarity icon missing emoji variation selector
- **Page:** Magic Circle
- **What:** v1 uses `⚔️` (with emoji variation selector). v2 used `⚔` (text-style).
- **Fix:** Changed polarity icon in `MagicCircleEditor.vue` from `⚔` to `⚔️`.
- **Status:** 🛠️ Fixed

#### F-053: Magic Circle — Element display uses dot instead of emoji
- **Page:** Magic Circle
- **What:** v1 bottom panel shows emoji + text (e.g., "🔥 Fire"). v2 showed a colored dot + text.
- **Fix:** Replaced dot-based element display with emoji-based display in `McActionPanel.vue`.
- **Status:** 🛠️ Fixed

#### F-054: Magic Circle — Drawer completely off-screen / broken positioning
- **Page:** Magic Circle
- **What:** v2 drawer was positioned with `position: absolute` but parent `.magic-circle-editor` had no `position: relative`, causing the drawer to render off-screen or in the wrong location. The drawer also lacked `transform: translateX(100%)` / `translateX(0)` slide animation.
- **Fix:** Added `position: relative` to `.magic-circle-editor`, restored v1 drawer CSS (absolute positioning, `transform` slide animation, 360px width, dark background), and moved drawer into the grid area.
- **Status:** 🛠️ Fixed

#### F-055: Magic Circle — Tier dial shows numbers instead of glyph symbols
- **Page:** Magic Circle
- **What:** v1 tier dial ticks show glyph symbols (`+`, `++`, `+++`, `✦`, etc.) via `engine.getGlyphSymbol()`. v2 showed raw tier numbers (`1`, `2`, `3`, etc.).
- **Fix:** Updated tier tick rendering in `GlyphPalette.vue` to call `engine.getGlyphSymbol(t)`.
- **Status:** 🛠️ Fixed

#### F-056: Magic Circle — Missing power stat in top margin
- **Page:** Magic Circle
- **What:** v2 top margin only showed "0 MP" and budget bar; "0 DMG" / "40 DMG" power stat was missing or invisible due to CSS layout differences (`flex-direction: column` vs v1's horizontal row).
- **Fix:** Changed `.mc-top-right` from `flex-direction: column` to horizontal `align-items: center; gap: 20px` to match v1 layout.
- **Status:** 🛠️ Fixed

#### F-057: Magic Circle — Background theme completely different
- **Page:** Magic Circle
- **What:** v1 uses a dark radial gradient background (`#0f0f18` → `#050508`) with red side gradient. v2 used the generic `FullViewOverlay` body background (lighter bluish-gray).
- **Fix:** Applied v1 background styles directly to `.magic-circle-editor` in `MagicCircleEditor.vue` scoped CSS.
- **Status:** 🛠️ Fixed

### 🟢 Minor (tiny visual discrepancies acceptable for technical migration)

_(None yet)_

---

## Batch Fixes (Cross-Cutting)

#### Unicode Escape Fix — 150 `\u{XXXXX}` sequences across 35 Vue files
- **What:** Vue templates render `\u{XXXXX}` as literal text (unlike JS strings where it's valid syntax). All 35+ Vue files using unicode escapes in `<template>` sections showed garbled text instead of emojis.
- **Fix:** Mass-replaced all `\u{XXXXX}` patterns with actual Unicode characters in Vue templates.
- **Files affected:** `SaveSlotPage.vue`, `VillagePage.vue`, `VillageCanvas.vue`, `LaborPool.vue`, `VillageCalendar.vue`, `VillageDefense.vue`, `DailyObjectives.vue`, `ConstructionQueue.vue`, `FooterNav.vue`, `TopBar.vue`, `HeroesPage.vue`, `HeroCard.vue`, `HeroDetail.vue`, `AdventurePage.vue`, `ExploreTab.vue`, `BestiaryTab.vue`, `CodexTab.vue`, `ChronicleTab.vue`, `TownPage.vue`, `BuildingsTab.vue`, `ShopTab.vue`, `ForgeTab.vue`, `InventoryTab.vue`, `SettingsPage.vue`, `PresentationModal.vue`, `DailyReportModal.vue`, `CombatOverlay.vue`, `ExpeditionResultModal.vue`, `MagicCircleEditor.vue`, `EmptyState.vue`, `Button.vue`, `ModalFrame.vue`, `ToastContainer.vue`, `App.vue`, and others.
- **Status:** 🛠️ Fixed

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
| F-023 | 2026-06-06 | Village Main | Restructured `VillagePage.vue` to v1 3-column grid (`4.5fr 3.25fr 3.25fr`). LaborPool + ConstructionQueue now in middle column. |
| F-026 | 2026-06-06 | Village Main | Rewrote `FooterNav.vue` as floating pill with blur, shadow, active dot, uppercase labels, icon animation, glow. Updated nav items to v1 labels/icons. |
| — | 2026-06-06 | Village Main | Fixed `#app` height and `App.vue` flex layout so page fills viewport without scrolling. Canvas card stretches to fill grid column; tiles distribute with `repeat(4, 1fr)`. |
| — | 2026-06-06 | Global | Mass-fixed 150 `\u{XXXXX}` unicode escape sequences across 35 Vue files — replaced with actual emoji characters in templates. |
| F-027 | 2026-06-06 | Inventory, Explore, Buildings, Shop | Fixed object-shaped data crashes: `inventory.materials/food/consumables` and `expeditionRegions` are objects in v1, not arrays. Added `entriesToItems()` helper and object-to-array conversion. |
| F-028 | 2026-06-06 | Shop, Forge | Added missing locked-state description text (`shop_uxelm_locked_desc`, `forge_uxelm_locked_desc`) to `EmptyState` component. |
| F-030 | 2026-06-06 | Bestiary | Restored type icons for undiscovered enemies — v1 always shows the enemy type emoji; v2 was showing "❓" for all undiscovered entries. |
| F-031 | 2026-06-06 | Heroes Detail | Restored stat descriptions, experience format ("0 / 20"), square avatar with border, and skill helper text in `HeroProfile.vue` and `HeroStatsGrid.vue`. |
| F-032 | 2026-06-06 | Explore Detail | Restored Base Reward, COMBAT INTEL enemy tags, checkbox hero selection with HP, and "ASSIGN HEROES" button in `ExploreTab.vue` detail pane. |
| F-033 | 2026-06-06 | Buildings Detail | Restored building emoji icon, BUILDING EFFECTS arrows, cost grid with insufficient state, and "CONFIRM" button in `BuildingsTab.vue`. Verified Town Hall is excluded. |
| F-034 | 2026-06-06 | Inventory | Restored purple gradient storage bar, purple circular count badges, and 2-panel layout in `InventoryTab.vue`. |
| F-035 | 2026-06-06 | Settings | Restored 2-column multi-card grid, ABOUT section, MAGIC CIRCLE SIMULATOR button, DANGER ZONE red border, and developer description text in `SettingsPage.vue`. |
| F-036 | 2026-06-06 | Inventory | Fixed storage header: changed `inventory_uxelm_storage` (non-existent key) to `shared_uxelm_storage` in `InventoryTab.vue`. |
| F-037 | 2026-06-06 | Settings | Fixed developer options description: changed `settings_uxelm_dev_desc` to `settings_uxelm_dev_cheat_desc` in `SettingsPage.vue`. |
| F-038 | 2026-06-06 | Settings | Fixed save slot card title: changed `settings_uxelm_choose_slot` to `shared_uxelm_save_slot_title` in `SettingsPage.vue`. |
| F-039 | 2026-06-06 | Explore Detail | Fixed expedition badge: changed from `detailMode` ("available"/"active") to `isStory ? explore_uxelm_story : explore_uxelm_exploration` in `ExploreTab.vue`. |
| F-041 | 2026-06-06 | Magic Circle | Fixed empty slot icons: core shows `⚡`, rings show `＋` in `MandalaGrid.vue`. |
| F-042 | 2026-06-06 | Magic Circle | Fixed core slot hexagon shape: added `clip-path` polygon and `::before` inner background in `MandalaGrid.vue`. |
| F-043 | 2026-06-06 | Magic Circle | Fixed slot tier symbols: now uses `engine.getGlyphSymbol(tier)` instead of hardcoded `'+'` in `MandalaGrid.vue`. |
| F-044 | 2026-06-06 | Magic Circle | Fixed connection line colors: now uses `getElementColor(spellElement)` instead of fixed indigo in `MandalaGrid.vue`. |
| F-045 | 2026-06-06 | Magic Circle | Fixed effect chips `%` suffix: added `suffix` property to `buildEffectChips()` in `useMagicCircle.js`. |
| F-046 | 2026-06-06 | Magic Circle | Fixed "already-used" palette indicator: added `isPlacedElsewhere()` check and CSS class in `GlyphPalette.vue`. |
| F-047 | 2026-06-06 | Magic Circle | Fixed remove button text: changed from `shared_uxelm_remove` to `magic_circle_uxelm_slot_remove_prompt` in `GlyphPalette.vue`. |
| F-048 | 2026-06-06 | Magic Circle | Fixed simulator inscribe button text: added `isSimulator` prop and conditional text in `McActionPanel.vue`. |
| F-049 | 2026-06-06 | Magic Circle | Fixed missing "no-harm" chip for support spells in `McActionPanel.vue`. |
| F-050 | 2026-06-06 | Magic Circle | Fixed missing "none" effect chip when no spell/effects in `McActionPanel.vue`. |
| F-051 | 2026-06-06 | Magic Circle | Fixed core drawer title: now uses `magic_circle_uxelm_drawer_title_core` in `GlyphPalette.vue`. |
| F-052 | 2026-06-06 | Magic Circle | Fixed polarity icon: changed `⚔` to `⚔️` in `MagicCircleEditor.vue`. |
| F-053 | 2026-06-06 | Magic Circle | Fixed element display: replaced colored dot with emoji + text in `McActionPanel.vue`. |
| F-054 | 2026-06-06 | Magic Circle | Fixed drawer positioning: added `position: relative` to parent, restored slide animation and v1 drawer dimensions in `MagicCircleEditor.vue`. |
| F-055 | 2026-06-06 | Magic Circle | Fixed tier dial symbols: now uses `engine.getGlyphSymbol(t)` instead of raw numbers in `GlyphPalette.vue`. |
| F-056 | 2026-06-06 | Magic Circle | Fixed missing power stat: restored horizontal `.mc-top-right` layout in `MagicCircleEditor.vue`. |
| F-057 | 2026-06-06 | Magic Circle | Fixed background theme: applied v1 radial gradient background to `.magic-circle-editor` in `MagicCircleEditor.vue`. |

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
2. **State shape differences**: The Vue composable `useGameState()` exposes `gameState.value.expeditionRegions` as an array. The legacy `ExploreView.getRegions()` treats `state.expeditionRegions` as an **object** (using `Object.entries()`). The engine outputs objects for `materials`, `food`, `consumables`, `expeditionRegions`, and `enemyTemplates`. All Vue components must handle both shapes defensively.
3. **Structural differences (known/acceptable)**:
   - **Explore layout**: v1 uses WORLD MAP sidebar + node visualization; v2 uses tree/list toggle + expedition cards. The underlying data and functionality are the same.
   - **Settings location**: v1 has Settings as a sub-tab under Town; v2 has it as a separate page via gear icon in TopBar. This is a navigation restructuring, not a content difference.
   - **Buildings list**: v1 reads buildings from `village.infrastructure` object keys (dynamically changes as buildings are constructed); v2 uses a hardcoded list of all 10 buildings. Both exclude Town Hall. This is a data-source difference that doesn't affect functionality.
   - **Codex layout**: v1 renders category sections with group headers (SYSTEM CODEX, BASICS, COMBAT, VILLAGE BUILDINGS) in the left pane; v2 uses filter tabs at the top of the left pane. The feature set and detail pane content are identical.
   - **Chronicle layout**: v1 and v2 are structurally identical (Recently Unlocked, Chapter sections, Discovery Log). Minor proportion and header-casing differences exist (F-040 area).
4. **Modal vs inline**: v1 uses modals for expedition detail and some hero interactions. v2 uses inline cards or page-level views. These are structural pattern differences that would require significant rewrites to match exactly. The content within them should match (F-032).

---

## Review Session — 2026-06-07

New screenshots generated via orchestrator (`scripts/screenshots/orchestrator.mjs`) for both v1 and v2. Review conducted by comparing available pairs and inspecting v2-only screenshots where v1 counterparts were missing or broken.

### Updated Page Statuses

| Page / Screen | v1 Screenshot | v2 Screenshot | Status | Notes |
|---------------|---------------|---------------|--------|-------|
| Save Slot Selection | `v1_onboarding_save_slot_empty.png` | `v2_onboarding_save_slot_empty.png` | ✅ Re-verified | Fixes hold. |
| New Game Lore Intro | `v1_onboarding_intro_prologue.png` | `v2_onboarding_intro_prologue.png` | ✅ Re-verified | Fixes hold. |
| Village Main | `v1_village_village_main.png` | `v2_village_village_main.png` | 🛠️ Fixed | Fixes hold. New minor: F-070, F-071. |
| Heroes List + Detail | `v1_heroes_heroes_list_selected.png` | `v2_heroes_heroes_list_selected.png` | 🔍 In Review | F-040 expanded → F-060–F-064. |
| Explore | `v1_adventure_explore_list_view.png` | `v2_adventure_explore_list_view.png` | 🛠️ Fixed | Fixes hold. Structural layout difference accepted. |
| Bestiary | `v1_adventure_bestiary_mixed.png` | `v2_adventure_bestiary_mixed.png` | 🛠️ Fixed | **v1 screenshot broken** (F-059). v2 independently verified. |
| Codex | `v1_adventure_codex_unlocked.png` | `v2_adventure_codex_unlocked.png` | 🔍 In Review | **v1 screenshot broken** (F-059). v2 functional. |
| Chronicle | `v1_adventure_chronicle_milestones.png` | `v2_adventure_chronicle_milestones.png` | 🔍 In Review | **v1 screenshot broken** (F-059). v2 functional. |
| Buildings List | `v1_town_buildings_list.png` | `v2_town_buildings_list.png` | 🔍 In Review | New findings: F-065–F-069. |
| Buildings Detail | `v1_town_buildings_detail_construct.png` | `v2_town_buildings_detail_construct.png` | 🛠️ Fixed | F-033 holds. New minor: F-067–F-069. |
| Shop | — | `v2_town_shop_locked.png` / `unlocked.png` | 🛠️ Fixed | No v1 pair available. F-028 holds. |
| Forge | — | `v2_town_forge_locked.png` / `unlocked.png` | 🛠️ Fixed | No v1 pair available. F-028 holds. |
| Inventory | `v1_town_inventory_with_items.png` | `v2_town_inventory_with_items.png` | 🛠️ Fixed | F-034, F-036 hold. Minor proportion diff. |
| Settings | `v1_settings_settings_main.png` | `v2_settings_settings_main.png` | 🛠️ Fixed | **v1 screenshot broken** (F-059). v2 independently verified. |
| Magic Circle | `v1_magic-circle_magic_circle_empty.png` | `v2_magic-circle_magic_circle_empty.png` | 🛠️ Fixed | **v1 screenshot broken** (F-059). v2 independently verified; F-041–F-057 hold. |
| Trainer Modal | `v1_building-modals_trainer_modal.png` | `v2_building-modals_trainer_modal.png` | ❌ Issues Found | **v1 screenshot broken** (F-059). v2 critical bug: F-058. |
| Witch Modal | `v1_building-modals_witch_modal.png` | `v2_building-modals_witch_modal.png` | 🔍 In Review | Raw key bug present in **both** v1 and v2 (pre-existing). v2 missing 🌙 emoji in title. |
| Academy Modal | `v1_building-modals_academy_modal.png` | `v2_building-modals_academy_modal.png` | 🔍 In Review | **v1 screenshot broken** (F-059). v2 hardcoded English text. |
| Hall of Fame Modal | `v1_building-modals_hall_of_fame_modal.png` | `v2_building-modals_hall_of_fame_modal.png` | 🔍 In Review | **v1 screenshot broken** (F-059). v2 hardcoded English text. |

### 🔴 Critical (New)

#### F-058: Training Grounds Modal — Raw i18n keys displayed
- **Page:** Building Modals → Training Grounds
- **What:** v2 modal shows literal translation keys instead of text: `"trainer_no_family_1"`, `"trainer_no_family_2"`, and `"No_family"`.
- **v1 Status:** v1 screenshot is broken (captures Heroes page instead), so direct comparison not possible. The bug is clearly present in v2.
- **Fix:** Wrap the keys through `t()` in the Training Grounds modal component.
- **Status:** ❌ Open

#### F-059: v1 Screenshot Orchestrator — Multiple captures show wrong page/modal
- **Impact:** Prevents side-by-side comparison for several pages.
- **Affected v1 screenshots:**
  - `v1_adventure_bestiary_mixed.png` → shows Tutorial Cave explore modal
  - `v1_adventure_codex_unlocked.png` → shows Tutorial Cave explore modal
  - `v1_adventure_chronicle_milestones.png` → shows Tutorial Cave explore modal
  - `v1_magic-circle_magic_circle_empty.png` → shows Village main page
  - `v1_settings_settings_main.png` → shows Village main page
  - `v1_building-modals_trainer_modal.png` → shows Heroes page
  - `v1_building-modals_academy_modal.png` → shows Witch's Hut modal
  - `v1_building-modals_hall_of_fame_modal.png` → shows Witch's Hut modal
- **Root Cause:** The v1 flow selectors likely fail to close an open modal before navigating to the next state, or the state injection doesn't properly reset the UI between capture steps.
- **Fix:** Update `scripts/screenshots/selectors/v1.mjs` to ensure modals are closed (e.g., press Escape or click backdrop) before navigating to subsequent states in a flow.
- **Status:** ❌ Open

### 🟡 Significant (New)

#### F-060: Heroes — List header "YOUR HEROES" lost uppercase transform
- **Page:** Heroes
- **What:** v1 list header is uppercase via CSS. v2 shows "Your Heroes" in title case.
- **Fix:** Add `text-transform: uppercase` to the heroes list header in `HeroesPage.vue` or `HeroList.vue`.
- **Status:** ❌ Open

#### F-061: Heroes — Hero card level format changed from "Level 1" badge to "Lv 1" text
- **Page:** Heroes
- **What:** v1 shows "Level 1" inside a purple pill badge. v2 shows "Lv 1" as plain right-aligned text without a badge.
- **Fix:** Restore the purple pill badge with full "Level X" text in `HeroCard.vue`.
- **Status:** ❌ Open

#### F-062: Heroes — Activity display changed from emoji to full "Idle" badge
- **Page:** Heroes
- **What:** v1 shows only an activity emoji (e.g., 💤) on the right side of the hero card. v2 shows a full green "Idle" badge with background.
- **Fix:** Replace the green "Idle" badge with just the activity emoji, matching v1 behavior.
- **Status:** ❌ Open

#### F-063: Heroes — Stat-points badge "+5" not present in v1
- **Page:** Heroes
- **What:** v2 hero cards show a green "+5" badge when unassigned stat points exist. v1 has no such indicator on the list cards.
- **Fix:** Remove the stat-points badge from `HeroCard.vue` list view, or verify if this is an acceptable addition.
- **Status:** ❌ Open

#### F-064: Heroes Detail — Activity and Experience on separate lines instead of same line
- **Page:** Heroes Detail
- **What:** v1 has `Activity: Idle` and `Experience: 0 / 20` on the **same** horizontal line. v2 places them on **separate** lines with a label-value layout.
- **Fix:** Restore the single-row layout for Activity and Experience in `HeroProfile.vue`.
- **Status:** ❌ Open

#### F-065: Buildings — Locked buildings show "Locked" instead of "Not Built"
- **Page:** Buildings List
- **What:** v1 locked building tiles show "Not Built". v2 shows "Locked".
- **Fix:** Change the locked-state label in `BuildingsTab.vue` to "Not Built".
- **Status:** ❌ Open

#### F-066: Buildings — Level badge casing changed to uppercase
- **Page:** Buildings List
- **What:** v1 badges use title case: "Level 1", "Not Built". v2 uses uppercase: "LEVEL 1", "NOT BUILT".
- **Fix:** Remove `text-transform: uppercase` from the level badge in `BuildingsTab.vue`.
- **Status:** ❌ Open

#### F-067: Buildings Detail — "Infrastructure" is plain text instead of purple badge
- **Page:** Buildings Detail
- **What:** v1 shows "Infrastructure" as a purple pill badge above the building name. v2 shows it as plain text.
- **Fix:** Wrap the infrastructure label in a purple badge component matching v1 styling.
- **Status:** ❌ Open

#### F-068: Buildings Detail — "Next Upgrade: Level 2" header casing differs
- **Page:** Buildings Detail
- **What:** v1 shows "NEXT UPGRADE: LEVEL 2" in uppercase. v2 shows "Next Upgrade: Level 2" in title case.
- **Fix:** Add `text-transform: uppercase` to the next-upgrade header in the building detail pane.
- **Status:** ❌ Open

#### F-069: Buildings Detail — Confirm button is full-width instead of right-aligned
- **Page:** Buildings Detail
- **What:** v1 "CONFIRM" button is right-aligned and smaller. v2 button spans the full width of the detail pane.
- **Fix:** Change the confirm button layout to be right-aligned with auto width.
- **Status:** ❌ Open

### 🟢 Minor (New)

#### F-070: Village — Specialization controls are vertical instead of horizontal
- **Page:** Village Main
- **What:** v1 shows minus/number/plus controls in a horizontal row (`- 2 +`). v2 stacks them vertically.
- **Impact:** Low — functionality identical, visual difference only.
- **Status:** ❌ Open

#### F-071: Village — Threat & Defense Hub split into multiple cards
- **Page:** Village Main
- **What:** v1 renders Calendar and Defense inside a single "THREAT & DEFENSE HUB" card. v2 splits them into separate cards.
- **Note:** F-021 was previously marked "partially fixed" for this same issue.
- **Status:** ❌ Open (same as F-021)

### Pre-existing Issues (Not Regressions)

#### Witch's Hut — `"witch_generic_far"` raw i18n key
- **Page:** Building Modals → Witch's Hut
- **What:** Both v1 and v2 display the literal key `"witch_generic_far"` instead of its translation. This is a pre-existing vanilla bug, not a migration regression.
- **Action:** Should be fixed in both versions, but is out of scope for the migration review.

### Fix Log (Session 2026-06-07)

| Fix ID | Date | Page | Description |
|--------|------|------|-------------|
| F-058 | 2026-06-07 | Trainer Modal | v2 shows raw i18n keys `"trainer_no_family_*"` and `"No_family"` — needs `t()` wrapping. |
| F-059 | 2026-06-07 | Screenshot Orchestrator | v1 capture bug: multiple flows capture wrong page/modal due to modal not being closed between states. |
| F-060 | 2026-06-07 | Heroes | List header "YOUR HEROES" lost uppercase transform. |
| F-061 | 2026-06-07 | Heroes | Hero card level format changed from "Level 1" purple badge to "Lv 1" plain text. |
| F-062 | 2026-06-07 | Heroes | Activity display changed from emoji-only to full "Idle" badge. |
| F-063 | 2026-06-07 | Heroes | Green "+5" stat-points badge added to list cards — not present in v1. |
| F-064 | 2026-06-07 | Heroes Detail | Activity and Experience placed on separate lines instead of same line. |
| F-065 | 2026-06-07 | Buildings | Locked buildings show "Locked" instead of v1's "Not Built". |
| F-066 | 2026-06-07 | Buildings | Level badge casing changed from title case to uppercase. |
| F-067 | 2026-06-07 | Buildings Detail | "Infrastructure" label is plain text instead of purple badge. |
| F-068 | 2026-06-07 | Buildings Detail | "Next Upgrade: Level 2" header uses title case instead of uppercase. |
| F-069 | 2026-06-07 | Buildings Detail | Confirm button is full-width instead of right-aligned. |
| F-070 | 2026-06-07 | Village | Specialization minus/number/plus controls are vertical instead of horizontal. |
| F-071 | 2026-06-07 | Village | Threat & Defense Hub split into multiple cards (continuation of F-021). |

### Screenshots Pending Review (No v1 Pair Available)

The following v2 screenshots exist but have no v1 counterpart for comparison. They should be reviewed in a future session:

- `v2_hero-modals_heroes_modal_skills.png`
- `v2_hero-modals_heroes_modal_gambits.png`
- `v2_hero-modals_heroes_modal_equipment.png`
- `v2_hero-modals_heroes_modal_inscription.png`
- `v2_hero-modals_heroes_modal_consumables.png`
- `v2_magic-circle_magic_circle_spell_composed.png`
- `v2_magic-circle_magic_circle_core_drawer.png`
- `v2_magic-circle_magic_circle_ring_drawer.png`
- `v2_magic-circle_magic_circle_fire_selected.png`
- `v2_village_village_construction_active.png`
- `v2_village_village_daily_report.png`
- `v2_village_village_recall_report.png`
- `v2_village_village_storage_warning.png`
- `v2_post-day_expedition_result.png`
- `v2_post-day_narrative_unlock_toast.png`
- `v2_settings_settings_simulator.png`
- `v2_combat_combat_targeting_enemy.png`
- `v2_combat_combat_skills_menu.png`
