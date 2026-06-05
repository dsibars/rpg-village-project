# Migration Sequencing Roadmap — Vue 3 Presentation Layer

> **Companion Document:** [Core Initiative: Component-Based UI Architecture with Vue 3](./core_initiative_component_based_ui.md)
>
> **Purpose:** This is the canonical work plan. It is updated after every migration session. A fresh agent session can read this file, find the first unchecked step, and continue without asking questions.

---

## 📋 How to Resume Migration (READ THIS FIRST ON EVERY SESSION)

1. **Read this file** completely. It contains the ground truth of what is done vs. remaining.
2. **Check current state:** Run `git status` and `git diff --stat` to see what files are modified/uncommitted from the last session.
3. **Find the next step:** Scroll to the "Remaining Steps" section. The first unchecked box is your target.
4. **Read legacy source files:** Every step lists the exact legacy files to study before writing Vue equivalents.
5. **Read existing Vue files:** Every step lists related `ux/` files that already exist and may need modification.
6. **Implement the step.** Follow the contract defined in the core initiative (§4, §10).
7. **Verify:** Run `npm run build` and the test commands listed in the step.
8. **Update this file:** Check off the completed step. If work was partially done, add a note in the step's "Status" field.
9. **Commit:** `git add -A && git commit -m "migration: <step-name>"`

**Critical rules while migrating:**
- The legacy presentation layer (`js/presentation/`, `pages/`, `css/views/`) is **FROZEN** — never edit it.
- Every new component is a `.vue` SFC with `<template>`, `<script setup>`, `<style scoped>`.
- Feature components use composables (`useI18n()`, `useGameState()`, `useAdapter()`). Primitives do not.
- Do not rename translation keys. Use `useI18n()` — never pass `t` as a prop.
- The engine (`js/engine/`) is untouched. All engine access goes through `ux/adapters/EngineAdapter.js`.
- If you discover a missing engine action in the adapter, add it to `ACTION_MAP` in `ux/adapters/EngineAdapter.js`.

---

## ✅ State Tracker

Update this section after every session. A checked box means **fully implemented, tested, and wired**.

### Phase 0 — Setup (COMPLETE)
- [x] Vue 3 + Vite plugin configured (`vite.config.js`, `package.json`)
- [x] `ux/` directory skeleton created
- [x] Build pipeline verified (`npm run build` succeeds)
- [x] Path alias `@/` → `ux/` works

### Phase 1 — Proof of Concept (COMPLETE)
- [x] GambitEditor.vue + 6 sub-components (`ux/features/gambit/`)
- [x] All gambit components render with real engine data
- [x] Gambit test mode UI exists (but still returns **mock** results — see Step 3.7.5)

### Phase 2 — Shared Infrastructure (COMPLETE)
- [x] Design tokens (`ux/core/theme.css`)
- [x] Composables: `useI18n.js`, `useGameState.js`, `useAdapter.js`
- [x] UI primitives: `Button.vue`, `ModalFrame.vue`, `FullViewOverlay.vue`, `TabNav.vue`, `ResourceBar.vue`, `ToastContainer.vue`, `TopBar.vue`, `FooterNav.vue`, `EmptyState.vue`, `LoadingSpinner.vue`, `Icon.vue`, `CloseButton.vue`
- [x] New EngineAdapter.js with generic `dispatch()` and comprehensive `ACTION_MAP`
- [x] Toast system (`ux/core/toast.js`)

### Phase 3 — Domain Refactors (IN PROGRESS)

#### 3.1 Heroes Domain (PARTIALLY COMPLETE)
- [x] HeroesPage.vue shell (master-detail layout, recruit button)
- [x] HeroList.vue, HeroListItem.vue, HeroEmptyState.vue
- [x] HeroProfile.vue, HeroStatsGrid.vue, HeroActionBar.vue
- [x] HeroSkillsModal.vue
- [x] HeroConsumablesModal.vue
- [x] HeroEquipmentModal.vue
- [x] HeroInscriptionModal.vue
- [x] TrainerModal.vue
- [x] WitchModal.vue
- [x] AcademyModal.vue
- [x] HallOfFameModal.vue
- [x] MagicCircleEditor.vue (global overlay)
- [x] Wire GambitEditor into HeroesPage
- [x] Wire all remaining hero actions into HeroesPage action bar
- [x] Heroes domain integration polish

#### 3.2 Combat Domain (COMPLETE)
- [x] CombatHeader.vue + CombatActorGrid.vue
- [x] CombatActionPanel.vue + targeting system (full menu states: main/skills/family_tiers/magic/items/targeting)
- [x] CombatLogConsole.vue (basic implementation)
- [x] CombatResolutionPane.vue (full implementation with rewards)
- [x] Wire CombatOverlay.vue in App.vue with real battle state

#### 3.3 Village Domain (COMPLETE)
- [x] VillageCanvas.vue (visual building map)
- [x] LaborPool.vue (worker role assignment)
- [x] ConstructionQueue.vue
- [x] DailyObjectives.vue
- [x] VillageCalendar.vue
- [x] VillageDefense.vue
- [x] VillagePage.vue composer

#### 3.4 Adventure Domain (COMPLETE)
- [x] ExploreTab.vue (expedition list, region map, hero assignment, tree/list toggle)
- [x] BestiaryTab.vue
- [x] CodexTab.vue
- [x] ChronicleTab.vue

#### 3.5 Town Domain (COMPLETE)
- [x] BuildingsTab.vue
- [x] ShopTab.vue
- [x] ForgeTab.vue
- [x] InventoryTab.vue

#### 3.6 Settings Domain (COMPLETE)
- [x] SettingsPage.vue (language, cheats, save management, magic simulator)

#### 3.7 Global / Cross-Cutting Features (COMPLETE)
- [x] DailyReportModal.vue
- [x] UnlockNarrative toast system (rich narrative toasts via ToastContainer with queue)
- [x] PostDaySequencer integration (presentation modal sequencing + daily report gating)
- [x] ConfirmDialog primitive (built into SettingsPage; can extract to shared component if needed)
- [x] Fix GambitEditor test mode to use real engine results
- [x] Add `test:vue` npm script + ensure all Vue tests pass

### Phase 4 — The Switch & Cleanup (NOT STARTED)
- [ ] Create `index-vue.html` entry point (or modify `index.html`)
- [ ] Rewrite `js/main.js` to bootstrap Vue app
- [ ] Delete legacy presentation layer (`js/presentation/`, `pages/`, `css/`)
- [ ] Final build verification & Electron packaging test

---

## 🔍 Remaining Steps (Atomic)

Each step below is designed to be completable in a single focused session. Steps are ordered by dependency: earlier steps must be done before later ones that import them.

---

### Step 3.1.1 — TrainerModal.vue

**Goal:** Migrate the trainer dialogue modal from legacy to Vue.

**Legacy source files to study:**
- `js/presentation/ui/heroes/components/HeroTrainingModals.js` (first ~80 lines — trainer modal)
- `js/presentation/ui/heroes/HeroesView.js` (search `_openTrainerModal`)

**New files to create:**
- `ux/features/heroes/components/modals/TrainerModal.vue`

**Files to modify:**
- `ux/features/heroes/HeroesPage.vue` — add modal import, wire `openAction('trainer')`
- `ux/features/heroes/components/HeroActionBar.vue` — add trainer button (gated by infrastructure)

**What to port:**
- Trainer greeting dialogue with hero name
- Stat training options (STR, SPD, DEF, MAG) with gold cost display
- Training confirmation and result toast
- Infrastructure gating (training grounds building level)

**Verification:**
- Modal renders inside `ModalFrame`
- Trainer button appears only when training grounds exist
- Training action dispatches correctly via adapter
- Run `npm run build` — zero errors

---

### Step 3.1.2 — WitchModal.vue

**Goal:** Migrate the witch visit/prophecy modal.

**Legacy source files to study:**
- `js/presentation/ui/heroes/components/HeroTrainingModals.js` (witch section)
- `js/presentation/ui/heroes/HeroesView.js` (search `_openWitchModal`)

**New files to create:**
- `ux/features/heroes/components/modals/WitchModal.vue`

**Files to modify:**
- `ux/features/heroes/HeroesPage.vue`
- `ux/features/heroes/components/HeroActionBar.vue`

**What to port:**
- Witch visit status (active/inactive)
- Prophecy text display
- Buff/debuff indicators if applicable
- Infrastructure gating (witch's hut)

**Verification:**
- Modal renders correctly
- Witch button gated by witch's hut level

---

### Step 3.1.3 — AcademyModal.vue

**Goal:** Migrate the academy spell design modal.

**Legacy source files to study:**
- `js/presentation/ui/heroes/components/HeroTrainingModals.js` (academy section)
- `js/presentation/ui/heroes/HeroesView.js` (search `_openAcademyModal`)

**New files to create:**
- `ux/features/heroes/components/modals/AcademyModal.vue`

**Files to modify:**
- `ux/features/heroes/HeroesPage.vue`
- `ux/features/heroes/components/HeroActionBar.vue`

**What to port:**
- Spell design interface (if any)
- Available spell families/tiers
- Infrastructure gating (academy building)

---

### Step 3.1.4 — HallOfFameModal.vue

**Goal:** Migrate the Hall of Fame modal.

**Legacy source files to study:**
- `js/presentation/ui/heroes/HeroesView.js` (search `_openHallOfFameModal`)
- `docs/shared/hall_of_fame.md` for spec reference

**New files to create:**
- `ux/features/heroes/components/modals/HallOfFameModal.vue`

**Files to modify:**
- `ux/features/heroes/HeroesPage.vue`
- `ux/features/heroes/components/HeroActionBar.vue`

**What to port:**
- List of retired/fallen heroes
- Stats summary for each entry
- Infrastructure gating (hall of fame building)

---

### Step 3.1.5 — Wire GambitEditor into HeroesPage

**Goal:** Connect the existing GambitEditor.vue to the hero action bar.

**Existing files to use:**
- `ux/features/gambit/GambitEditor.vue` (already complete)
- `ux/features/heroes/HeroesPage.vue`

**Files to modify:**
- `ux/features/heroes/HeroesPage.vue` — import GambitEditor, add `v-if="activeModal === 'gambits'"` block
- `ux/features/heroes/components/HeroActionBar.vue` — add gambits button

**What to do:**
- HeroActionBar gets a "🎲 Gambits" button
- HeroesPage opens GambitEditor as a FullViewOverlay when clicked
- Pass the selected hero's gambits and fallback action as props
- Wire add/move/toggle/remove/preset/test events to adapter dispatch
- The editor already exists — this step is purely about **wiring**

**Verification:**
- Gambit button opens the full-screen editor
- All gambit mutations work and update state
- Close button returns to HeroesPage

---

### Step 3.1.6 — MagicCircleEditor.vue (Part A: Shell + Glyph Palette)

**Goal:** Begin migrating the 712-line MagicCircleView.js. Part A builds the container shell and glyph palette.

**Legacy source files to study:**
- `js/presentation/ui/magic_circle/MagicCircleView.js` (read fully — understand structure)
- `js/presentation/ui/magic_circle/MagicCircleHelper.js`
- `js/presentation/ui/heroes/HeroesView.js` (search `_openMagicCircleModal`)
- `js/engine/shared/data/MagicCircleData.js`

**New files to create:**
- `ux/features/magic_circle/MagicCircleEditor.vue` (shell + palette)
- `ux/features/magic_circle/components/GlyphPalette.vue`
- `ux/features/magic_circle/components/TierDial.vue`

**Files to modify:**
- `ux/App.vue` — add global overlay trigger (or keep as page-level for now)
- `ux/features/heroes/HeroesPage.vue` — wire magic circle button
- `ux/features/heroes/components/HeroActionBar.vue` — add magic circle button (gated by arcane sanctum)

**What to port (Part A only):**
- FullViewOverlay container with title "Magic Circle"
- Glyph palette drawer with all glyphs from `GLYPH_DATA`
- Tier dial (1–7 tiers)
- Close/Escape handling
- Simulator mode flag (when opened from Settings)

**Do NOT port yet (Part B):**
- SVG mandala grid
- Slot interactions
- Real-time spell composition

**Verification:**
- Overlay opens from hero action bar
- Glyph palette renders all glyphs with correct icons
- Tier dial changes selected tier
- Escape key closes overlay

---

### Step 3.1.7 — MagicCircleEditor.vue (Part B: Mandala Grid + Slot Interactions)

**Goal:** Build the 25-slot concentric mandala and slot interaction logic.

**Legacy source files to study:**
- `js/presentation/ui/magic_circle/MagicCircleView.js` (focus on `_createMandala`, slot click handlers)

**New files to create:**
- `ux/features/magic_circle/components/MandalaGrid.vue`
- `ux/features/magic_circle/components/MandalaSlot.vue`

**Files to modify:**
- `ux/features/magic_circle/MagicCircleEditor.vue` — integrate grid + slot components

**What to port:**
- 25 slots arranged in concentric rings (1 core + 24 ring)
- Slot click to focus + open palette
- Glyph placement with adjacency rules
- Keyboard support (Escape to unfocus)
- Visual feedback for filled/empty slots

**Verification:**
- Clicking a slot focuses it
- Selecting a glyph from palette places it in the focused slot
- Adjacency rules enforced (disable invalid placements)
- Escape unfocuses slot, then closes overlay

---

### Step 3.1.8 — MagicCircleEditor.vue (Part C: Spell Preview + Composition)

**Goal:** Wire real-time spell composition and preview panel.

**Legacy source files to study:**
- `js/presentation/ui/magic_circle/MagicCircleView.js` (spell preview, budget, composition)

**New files to create:**
- `ux/features/magic_circle/components/SpellPreview.vue`
- `ux/features/magic_circle/components/BudgetBar.vue`

**Files to modify:**
- `ux/features/magic_circle/MagicCircleEditor.vue`

**What to port:**
- `engine.composeSpell()` calls on every slot change
- Spell element, power, MP cost display
- Budget bar with color-coded MP usage
- Polarity display (element vs support)
- Target count
- Effect chips
- Custom spell name input
- Inscribe button (disabled in simulator mode)
- Theme color bleed based on element polarity

**Verification:**
- Placing glyphs updates spell preview in real time
- Budget bar reflects MP cost vs hero max MP
- Inscribe button dispatches `hero.inscribeSpell` via adapter
- Simulator mode disables inscription

---

### Step 3.1.9 — Heroes Domain Integration Polish

**Goal:** Ensure the HeroesPage is fully functional and all edge cases are handled.

**Files to modify:**
- `ux/features/heroes/HeroesPage.vue`
- `ux/features/heroes/components/HeroActionBar.vue`
- `ux/features/heroes/components/HeroProfile.vue`

**What to do:**
- Add infrastructure gating to ALL action bar buttons (check building levels)
- Handle hero portrait (currently hardcoded 🦸 — check if engine has per-hero portraits)
- Add conditional stat increment buttons based on `hero.statPoints > 0 && hero.activity === 'idle'`
- Ensure recruit button dynamically updates cost
- Test master-detail mobile responsiveness
- Add `onErrorCaptured` to HeroesPage

**Verification:**
- All 8–10 action buttons show/hide correctly based on buildings
- Mobile layout switches to single-column
- No console errors when rapidly switching heroes
- Run existing Vue hero tests: `npx vitest run tests/vue/features/heroes/`

---

### Step 3.2.1 — CombatHeader.vue + CombatActorGrid.vue

**Goal:** Migrate the top portion of combat: turn banner, hero cards, enemy cards.

**Legacy source files to study:**
- `js/presentation/ui/combat/CombatView.js` (first 400 lines — header, card creation)
- `js/presentation/ui/combat/components/CombatHeader.js`
- `js/presentation/ui/combat/components/CombatActorCard.js`

**New files to create:**
- `ux/features/combat/components/CombatHeader.vue`
- `ux/features/combat/components/CombatActorGrid.vue`
- `ux/features/combat/components/CombatActorCard.vue`

**Files to modify:**
- `ux/features/combat/CombatOverlay.vue` — replace stub with real components

**What to port:**
- Turn banner with current actor name
- Hero grid: HP/MP/Stamina bars, status effects (poison, burn, regen, haste, sleep, stun)
- Enemy grid: same stats + intent indicators
- Actor selection highlighting
- Death/knockout visual state

**Verification:**
- CombatOverlay renders actors from `useActiveBattle()`
- HP bars update as battle progresses
- Status effect icons appear with correct tooltips

---

### Step 3.2.2 — CombatActionPanel.vue + Targeting System

**Goal:** Migrate the combat control panel: action buttons, skill menus, targeting.

**Legacy source files to study:**
- `js/presentation/ui/combat/CombatView.js` (lines 400–800 — control panel, targeting)
- `js/presentation/ui/combat/components/CombatActionPanel.js`

**New files to create:**
- `ux/features/combat/components/CombatActionPanel.vue`
- `ux/features/combat/components/SkillMenu.vue`
- `ux/features/combat/components/SpellMenu.vue`
- `ux/features/combat/components/ItemMenu.vue`

**Files to modify:**
- `ux/features/combat/CombatOverlay.vue`

**What to port:**
- Main action buttons: Attack, Skills, Magic, Items, Defend, Flee
- Skills submenu with technique families and tiers
- Magic submenu with inscribed spells
- Items submenu with usable consumables
- Targeting mode: click on actor grid to select target
- Friendly vs enemy targeting based on skill target type
- Auto-combat toggle button
- Skip battle button (for non-interactive battles)

**Verification:**
- Each menu opens/closes correctly
- Targeting highlights valid targets
- Selecting a target dispatches `combat.action` via adapter
- Auto-combat toggle works

---

### Step 3.2.3 — CombatLogConsole.vue

**Goal:** Migrate the expandable combat log.

**Legacy source files to study:**
- `js/presentation/ui/combat/CombatView.js` (log rendering, animation)
- `js/presentation/ui/combat/components/CombatLogConsole.js`

**New files to create:**
- `ux/features/combat/components/CombatLogConsole.vue`

**Files to modify:**
- `ux/features/combat/CombatOverlay.vue`

**What to port:**
- Log entries with event formatting (damage, spell damage, heals, stun, sleep, technique evolution, status ticks, consumable use)
- Expandable/collapsible panel
- Scroll-to-bottom on new entries
- Animation for new log lines

**Verification:**
- Log displays battle events in real time
- Expand/collapse works
- Auto-scrolls to latest entry

---

### Step 3.2.4 — CombatResolutionPane.vue

**Goal:** Migrate the battle end screen.

**Legacy source files to study:**
- `js/presentation/ui/combat/CombatView.js` (resolution pane, rewards)
- `js/presentation/ui/combat/components/CombatResolutionPane.js`

**New files to create:**
- `ux/features/combat/components/CombatResolutionPane.vue`

**Files to modify:**
- `ux/features/combat/CombatOverlay.vue`

**What to port:**
- Victory/defeat banner
- Battle summary (turns taken, damage dealt)
- Rewards list (gold, items, XP)
- Hero level-up notifications
- Continue/return button

**Verification:**
- Resolution pane shows when battle ends
- Rewards displayed correctly
- Continue button closes overlay

---

### Step 3.2.5 — Wire CombatOverlay in App.vue

**Goal:** Connect the fully-built CombatOverlay to real battle state.

**Files to modify:**
- `ux/App.vue` — replace stub combat trigger with reactive `useActiveBattle()`
- `ux/features/combat/CombatOverlay.vue` — ensure it reads battle state and emits close

**What to do:**
- `App.vue` watches for active battle via `useActiveBattle()` composable
- When battle starts, `showCombatOverlay` becomes true
- When battle ends (victory/defeat), overlay stays open showing resolution
- Player manually closes overlay after resolution
- Test both interactive and non-interactive (auto-resolved) battles

**Verification:**
- Starting combat opens overlay automatically
- Battle progresses with real-time updates
- Overlay survives page navigation (it's global in App.vue)
- After victory, resolution pane shows; close button works

---

### Step 3.3.1 — VillageCanvas.vue + LaborPool.vue

**Goal:** Migrate the visual village map and worker assignment controls.

**Legacy source files to study:**
- `js/presentation/ui/village/VillageView.js`
- `js/presentation/ui/village/components/VillageCanvas.js`
- `js/presentation/ui/village/components/LaborPool.js`

**New files to create:**
- `ux/features/village/components/VillageCanvas.vue`
- `ux/features/village/components/LaborPool.vue`

**Files to modify:**
- `ux/features/village/VillagePage.vue` — replace stub with real components

**What to port:**
- VillageCanvas: building tiles with icons, click-to-navigate-to-buildings
- LaborPool: worker role assignment with +/- buttons (farmers, lumberjacks, miners, builders)
- Role counts with max limits based on population
- Visual feedback on role changes

**Verification:**
- Canvas renders all built buildings
- Clicking a building emits `navigate` event to Town/Buildings tab
- Labor pool +/- buttons dispatch `village.setWorkerRole`
- Worker counts respect population limits

---

### Step 3.3.2 — ConstructionQueue.vue + DailyObjectives.vue

**Goal:** Migrate construction queue and daily objectives display.

**Legacy source files to study:**
- `js/presentation/ui/village/components/ConstructionQueue.js`
- `js/presentation/ui/village/components/DailyObjectives.js`

**New files to create:**
- `ux/features/village/components/ConstructionQueue.vue`
- `ux/features/village/components/DailyObjectives.vue`

**Files to modify:**
- `ux/features/village/VillagePage.vue`

**What to port:**
- ConstructionQueue: list of active projects with progress bars, days remaining, click-to-navigate
- DailyObjectives: 3 daily goals with checkmarks, rewards preview

**Verification:**
- Queue shows active projects with accurate progress
- Objectives show completion state
- Both update when game state changes

---

### Step 3.3.3 — VillageCalendar.vue + VillageDefense.vue

**Goal:** Migrate calendar display and defense assignment.

**Legacy source files to study:**
- `js/presentation/ui/village/components/VillageCalendar.js`
- `js/presentation/ui/village/components/VillageDefense.js`

**New files to create:**
- `ux/features/village/components/VillageCalendar.vue`
- `ux/features/village/components/VillageDefense.vue`

**Files to modify:**
- `ux/features/village/VillagePage.vue`

**What to port:**
- Calendar: season, day, upcoming events
- Defense: assignment count, hero assignment/unassignment buttons
- Defense advisory warning

**Verification:**
- Calendar shows correct season and day
- Defense shows assigned heroes
- Assign/unassign dispatches correctly

---

### Step 3.3.4 — VillagePage.vue Composer + Daily Report

**Goal:** Assemble all village sub-components and wire daily report recall.

**Files to modify:**
- `ux/features/village/VillagePage.vue` — compose all sub-components into dashboard layout

**What to do:**
- Layout: Top row = Canvas + Calendar + Defense
- Middle row = Labor Pool + Construction Queue
- Bottom row = Daily Objectives
- Daily report recall button (dispatches to show report modal)
- Town Hall level display
- Storage usage bar
- Error boundary

**Verification:**
- Full village dashboard renders
- All sub-components receive correct props
- Mobile layout stacks vertically
- Daily report button works

---

### Step 3.4.1 — ExploreTab.vue

**Goal:** Migrate expedition list, region map, and hero assignment.

**Legacy source files to study:**
- `js/presentation/ui/explore/ExploreView.js`
- `js/presentation/ui/explore/components/ExpeditionList.js`
- `js/presentation/ui/explore/components/ExpeditionTree.js`
- `js/presentation/ui/explore/components/ExpeditionDetailPane.js`

**New files to create:**
- `ux/features/adventure/components/ExploreTab.vue`
- `ux/features/adventure/components/ExpeditionList.vue`
- `ux/features/adventure/components/ExpeditionTree.vue`
- `ux/features/adventure/components/ExpeditionDetailPane.vue`

**Files to modify:**
- `ux/features/adventure/AdventurePage.vue` — replace Explore stub

**What to port:**
- Active expedition status banner
- Region list with clear counts and active counts
- Tree view vs list view toggle (persist in localStorage)
- Expedition detail: description, rewards, hero assignment dropdown
- Retire expedition button
- Defense advisory confirmation before starting
- Completed expedition rewards modal

**Verification:**
- Expeditions list correctly
- Tree/list toggle persists
- Assigning heroes checks defense advisory
- Retire button works

---

### Step 3.4.2 — BestiaryTab.vue

**Goal:** Migrate enemy discovery grid.

**Legacy source files to study:**
- `js/presentation/ui/bestiary/BestiaryView.js`
- `pages/bestiary.html`

**New files to create:**
- `ux/features/adventure/components/BestiaryTab.vue`
- `ux/features/adventure/components/BestiaryCard.vue`

**Files to modify:**
- `ux/features/adventure/AdventurePage.vue`

**What to port:**
- Grid of enemy cards
- Discovered vs undiscovered states (silhouette for undiscovered)
- Type icons, element colors
- Stats: HP, STR, DEF, SPD
- Enemy name translation

**Verification:**
- Grid renders all enemies from `useBestiary()`
- Undiscovered enemies show placeholder
- Discovered enemies show full stats

---

### Step 3.4.3 — CodexTab.vue

**Goal:** Migrate game guide/encyclopedia.

**Legacy source files to study:**
- `js/presentation/ui/codex/CodexView.js`

**New files to create:**
- `ux/features/adventure/components/CodexTab.vue`
- `ux/features/adventure/components/CodexEntry.vue`

**Files to modify:**
- `ux/features/adventure/AdventurePage.vue`

**What to port:**
- Categorized feature list
- Lock/unlock states
- Feature detail with rich formatted descriptions
- Custom description formatter (tips 💡, bullet lists, subtitles)

**Verification:**
- Categories render
- Locked entries show lock icon
- Unlocked entries show full descriptions with formatting

---

### Step 3.4.4 — ChronicleTab.vue

**Goal:** Migrate story milestones and discovery log.

**Legacy source files to study:**
- `js/presentation/ui/chronicle/ChronicleView.js`

**New files to create:**
- `ux/features/adventure/components/ChronicleTab.vue`
- `ux/features/adventure/components/ChronicleChapter.vue`
- `ux/features/adventure/components/ChronicleMilestone.vue`

**Files to modify:**
- `ux/features/adventure/AdventurePage.vue`

**What to port:**
- Chapter-based milestone tracking (Ch. 1 & 2)
- Collapsible chapter headers with progress
- Milestone rows: seen/pending/locked states
- Replay buttons for narrative unlocks
- Discovery log section
- Sub-nav routing to explore/bestiary/codex

**Verification:**
- Chapters expand/collapse
- Milestones show correct state
- Replay button triggers narrative modal

---

### Step 3.5.1 — BuildingsTab.vue

**Goal:** Migrate building management.

**Legacy source files to study:**
- `js/presentation/ui/buildings/BuildingsView.js`
- `js/presentation/ui/buildings/components/BuildingList.js`
- `js/presentation/ui/buildings/components/BuildingDetailPane.js`

**New files to create:**
- `ux/features/town/components/BuildingsTab.vue`
- `ux/features/town/components/BuildingList.vue`
- `ux/features/town/components/BuildingDetailPane.vue`

**Files to modify:**
- `ux/features/town/TownPage.vue` — replace Buildings stub

**What to port:**
- Building list with icons and levels
- Building detail: description, current effects, next level effects
- Upgrade/build action with cost display (gold + materials)
- Construction time display
- Highlight animation when navigated from VillageCanvas

**Verification:**
- List shows all buildings
- Detail pane shows correct costs
- Upgrade button dispatches `buildings.startProject`
- Highlight works when selected externally

---

### Step 3.5.2 — ShopTab.vue

**Goal:** Migrate shop buy/sell/resources.

**Legacy source files to study:**
- `js/presentation/ui/shop/ShopView.js`
- `js/presentation/ui/shop/components/ShopTabs.js`
- `js/presentation/ui/shop/components/ShopCatalogList.js`
- `js/presentation/ui/shop/components/ShopDetailPane.js`
- `js/presentation/ui/shop/utils/ShopUtils.js`

**New files to create:**
- `ux/features/town/components/ShopTab.vue`
- `ux/features/town/components/ShopCatalog.vue`
- `ux/features/town/components/ShopDetailPane.vue`

**Files to modify:**
- `ux/features/town/TownPage.vue`

**What to port:**
- Buy tab: consumables, weapons, helmets, armors, legwear, shields
- Blacksmith tier gating for equipment
- Sell tab: inventory items with dynamic sell prices
- Resources tab: grain, wood, stone buying
- Storage nearly-full warnings
- Just-bought/sold visual feedback (flash animation)
- Shop lock overlay until tutorial cave completed

**Verification:**
- Buy catalog filters by category
- Equipment gated by blacksmith level
- Sell prices computed from engine
- Resource purchases work
- Storage warning appears when near capacity

---

### Step 3.5.3 — ForgeTab.vue

**Goal:** Migrate equipment refinement.

**Legacy source files to study:**
- `js/presentation/ui/forge/ForgeView.js`
- `js/presentation/ui/forge/components/ForgeItemList.js`
- `js/presentation/ui/forge/components/ForgeDetailPane.js`

**New files to create:**
- `ux/features/town/components/ForgeTab.vue`
- `ux/features/town/components/ForgeItemList.vue`
- `ux/features/town/components/ForgeDetailPane.vue`

**Files to modify:**
- `ux/features/town/TownPage.vue`

**What to port:**
- Forge lock overlay until blacksmith level ≥ 1
- Equipment list merging inventory + equipped items from all heroes
- `equippedOn` label for hero-worn items
- Refinement action with material cost and success chance
- Result feedback

**Verification:**
- List includes all forgeable items
- Equipped items show owner hero
- Refinement dispatches `forge.refineItem`
- Lock overlay shows when blacksmith < 1

---

### Step 3.5.4 — InventoryTab.vue

**Goal:** Migrate inventory grid and item management.

**Legacy source files to study:**
- `js/presentation/ui/inventory/InventoryView.js`
- `js/presentation/ui/inventory/components/InventoryGrid.js`
- `js/presentation/ui/inventory/components/InventoryDetailPane.js`

**New files to create:**
- `ux/features/town/components/InventoryTab.vue`
- `ux/features/town/components/InventoryGrid.vue`
- `ux/features/town/components/InventoryDetailPane.vue`
- `ux/features/town/components/TeachGlyphModal.vue` (for glyph tablet teaching)

**Files to modify:**
- `ux/features/town/TownPage.vue`

**What to port:**
- Storage bar
- Filter tabs: all, materials, food, consumables, equipment
- Item grid with icons and quantities
- Detail pane with actions: cook meal, consume meal, equip, teach glyph
- Teach glyph modal: hero selection list with teach/learned states
- Equipment name formatting via `getEquipmentName`

**Verification:**
- Grid filters correctly
- Detail pane shows correct actions per item type
- Cook meal dispatches `inventory.cookMeal`
- Teach glyph modal shows eligible heroes

---

### Step 3.6.1 — SettingsPage.vue

**Goal:** Migrate settings page with full functionality.

**Legacy source files to study:**
- `js/presentation/ui/settings/SettingsView.js`

**New files to create:**
- No new files — modify existing `ux/features/settings/SettingsPage.vue`
- Possibly: `ux/features/settings/components/LanguageSelector.vue`

**Files to modify:**
- `ux/features/settings/SettingsPage.vue` — replace stub

**What to port:**
- Language selector dropdown
- Current save slot label
- Return to save slots button
- Wipe current slot (with confirm)
- Wipe all slots (with confirm)
- Developer cheat activation
- Magic circle simulator button (opens MagicCircleEditor in simulator mode)
- Volume controls (if engine supports them)

**Verification:**
- Language change updates UI immediately
- Wipe actions show confirm dialog
- Dev cheat works
- Magic simulator opens editor without inscription

---

### Step 3.7.1 — DailyReportModal.vue

**Goal:** Migrate the post-day report modal.

**Legacy source files to study:**
- `js/presentation/ui/village/components/DailyReportModal.js`

**New files to create:**
- `ux/features/village/components/modals/DailyReportModal.vue`

**Files to modify:**
- `ux/App.vue` — add DailyReportModal as global overlay triggered after day advance
- `ux/features/village/VillagePage.vue` — add recall button

**What to port:**
- Day summary: income, expenses, resource changes
- Event list (construction completed, heroes returned, etc.)
- Dismiss button
- Auto-show after `engine.advanceDay()`

**Verification:**
- Modal auto-shows after next-day button
- Shows accurate day summary
- Dismiss button works
- Recall button reopens modal

---

### Step 3.7.2 — UnlockNarrative Toast System

**Goal:** Replace UnlockNarrativeView.js with Vue toast-based system.

**Legacy source files to study:**
- `js/presentation/ui/unlocks/UnlockNarrativeView.js`
- `js/presentation/ui/shared/PostDaySequencer.js`

**New files to create:**
- No new files — use existing `ToastContainer.vue`
- Possibly: `ux/core/composables/useUnlocks.js`

**Files to modify:**
- `ux/App.vue` — watch for unlock narratives and push to toast queue
- `ux/core/toast.js` — ensure toast system supports rich content (title + lore text)

**What to port:**
- Queue system for multiple unlocks
- Narrative display: era, title, lore text
- Auto-dismiss after 8 seconds
- Click to dismiss
- Post-day sequencer integration (trigger after daily report)

**Verification:**
- Unlocking a feature shows narrative toast
- Multiple unlocks queue correctly
- Toasts auto-dismiss

---

### Step 3.7.3 — ConfirmDialog Primitive + IntroDialog

**Goal:** Build reusable confirm dialog and intro/prologue dialog.

**Legacy source files to study:**
- `js/presentation/ui/UIController.js` (`showConfirmDialog`, `showIntroDialog`)
- `js/presentation/ui/shared/components/PresentationModal.js`

**New files to create:**
- `ux/components/ConfirmDialog.vue`
- `ux/features/shared/IntroDialog.vue`

**Files to modify:**
- `ux/App.vue` — integrate confirm dialog and intro dialog

**What to port:**
- ConfirmDialog: title, message, confirm/cancel buttons, callback on confirm
- IntroDialog: prologue text, era header, continue button
- Intro auto-shows on new game

**Verification:**
- Confirm dialog used by wipe actions in Settings
- Intro dialog shows on first launch
- Both trap focus and close on Escape

---

### Step 3.7.4 — Fix GambitEditor Test Mode

**Goal:** Replace mock test results with real engine simulation.

**Files to modify:**
- `ux/features/gambit/GambitEditor.vue`

**What to do:**
- Remove the hardcoded `setTimeout` mock in `handleTestStart()`
- Wire the real `testGambits` engine action result to `testResult`
- The adapter already has `testGambits` mapped — ensure it returns the correct shape
- Handle loading state during simulation

**Verification:**
- Test mode runs real simulation
- Results reflect actual gambit performance
- Loading spinner shows during test

---

### Step 3.7.5 — Add `test:vue` NPM Script

**Goal:** Make Vue tests runnable from package.json.

**Files to modify:**
- `package.json`

**What to do:**
- Add `"test:vue": "vitest run tests/vue/"` to scripts
- Add `"test:vue:watch": "vitest tests/vue/"` for development
- Verify all existing Vue tests pass: `npm run test:vue`
- Fix any failing tests (likely path/alias issues)

**Verification:**
- `npm run test:vue` passes with 0 failures
- All 35+ spec files execute

---

### Step 4.1 — Create `index-vue.html` Entry Point

**Goal:** Prepare an HTML entry point that boots the Vue app instead of the legacy UI.

**Files to create:**
- `index-vue.html` (copy of `index.html` but simplified)

**What to do:**
- Remove all `<include src="pages/...">` template tags
- Remove all legacy `id="tpl-..."` templates
- Keep only: `<div id="app"></div>` and the Vue app script
- Keep font/CSS links if needed, or rely on Vue-scoped styles
- Import `ux/main.js` instead of `js/main.js`

**Verification:**
- `npx vite build --outDir dist-vue` (or point rollup to `index-vue.html`) succeeds
- Output is a clean single-file HTML with inlined Vue app

---

### Step 4.2 — Rewrite `js/main.js` for Vue Bootstrap

**Goal:** Switch the production entry point to mount the Vue app.

**Files to modify:**
- `js/main.js`

**What to do:**
- Replace all legacy view imports and UIController bootstrap with:
  ```js
  import { createVueApp } from '../ux/main.js'
  // ... setup engine, persistence, saveSlotManager
  createVueApp({ engine, persistence, saveSlotManager, container: document.getElementById('app') })
  ```
- Handle two-stage bootstrap: save slot selection → game UI (Vue `App.vue` already handles this)
- Remove all legacy view instantiation
- Keep `window.engine = engine` for debugging

**Verification:**
- `npm run build` succeeds
- Game loads to save slot screen
- Selecting a slot loads the Vue game UI

---

### Step 4.3 — Delete Legacy Presentation Layer

**Goal:** Remove all old presentation code.

**Files/directories to delete:**
- `js/presentation/` (entire directory)
- `pages/` (entire directory)
- `css/` (entire directory — but verify no global styles are still needed)

**Files to modify:**
- `index.html` — replace with `index-vue.html` content, or keep `index-vue.html` as the canonical entry

**What to check before deleting:**
- Are there any CSS rules in `css/style.css` that are NOT view-specific? (e.g., font imports, global reset)
- If yes, port them to `ux/core/theme.css` or `ux/main.js` global import first.

**Verification:**
- `npm run build` succeeds with zero warnings
- No import errors
- Game looks correct

---

### Step 4.4 — Final Verification

**Goal:** Ensure the migrated game is fully functional.

**Checklist:**
- [ ] All 4 nav categories work: Village, Heroes, Adventure, Town
- [ ] All tabs within Adventure and Town work
- [ ] Heroes: list, profile, recruit, all modals (skills, equipment, consumables, inscription, trainer, witch, academy, hall of fame, gambits, magic circle)
- [ ] Combat: starts automatically, renders actors, actions work, log updates, resolution shows
- [ ] Village: canvas, labor pool, construction, objectives, calendar, defense
- [ ] Explore: expeditions, bestiary, codex, chronicle
- [ ] Town: buildings, shop, forge, inventory
- [ ] Settings: language, wipes, dev cheat, magic simulator
- [ ] Save/load works across sessions
- [ ] i18n works in all supported languages
- [ ] Mobile responsive layout works
- [ ] Electron package builds: `npm run electron:make`
- [ ] `npm run test:vue` passes
- [ ] `npm run build` produces valid `dist/index.html`

**If anything fails:** Create a bug-fix step, apply it, and re-verify.

---

## 📁 File Mapping Reference

Use this table to quickly find the legacy source for any domain.

| Domain | Legacy View(s) | Legacy Components | Target Vue Page |
|--------|---------------|-------------------|-----------------|
| Shell | `UIController.js` | — | `App.vue` |
| Adapter | `js/presentation/adapters/EngineAdapter.js` | — | `ux/adapters/EngineAdapter.js` |
| Save Slots | `SaveSlotView.js` | — | `features/saveSlots/SaveSlotPage.vue` |
| Village | `village/VillageView.js` | `VillageCanvas`, `LaborPool`, `ConstructionQueue`, `DailyObjectives`, `VillageCalendar`, `VillageDefense`, `DailyReportModal` | `features/village/VillagePage.vue` |
| Heroes | `heroes/HeroesView.js` | `HeroProfilePane`, `HeroMiniCard`, `HeroSkillsModal`, `HeroTrainingModals`, `HeroInscriptionModal`, `HeroConsumablesModal`, `EquipmentView` | `features/heroes/HeroesPage.vue` |
| Gambit | `gambit/GambitView.js` | — | `features/gambit/GambitEditor.vue` |
| Magic Circle | `magic_circle/MagicCircleView.js` | `MagicCircleHelper` | `features/magic_circle/MagicCircleEditor.vue` |
| Combat | `combat/CombatView.js` | `CombatHeader`, `CombatActorCard`, `CombatActionPanel`, `CombatLogConsole`, `CombatResolutionPane` | `features/combat/CombatOverlay.vue` |
| Explore | `explore/ExploreView.js` | `ExpeditionList`, `ExpeditionTree`, `ExpeditionDetailPane`, `BaseModal` | `features/adventure/components/ExploreTab.vue` |
| Bestiary | `bestiary/BestiaryView.js` | — | `features/adventure/components/BestiaryTab.vue` |
| Codex | `codex/CodexView.js` | — | `features/adventure/components/CodexTab.vue` |
| Chronicle | `chronicle/ChronicleView.js` | — | `features/adventure/components/ChronicleTab.vue` |
| Buildings | `buildings/BuildingsView.js` | `BuildingList`, `BuildingDetailPane` | `features/town/components/BuildingsTab.vue` |
| Shop | `shop/ShopView.js` | `ShopTabs`, `ShopCatalogList`, `ShopDetailPane` | `features/town/components/ShopTab.vue` |
| Forge | `forge/ForgeView.js` | `ForgeItemList`, `ForgeDetailPane` | `features/town/components/ForgeTab.vue` |
| Inventory | `inventory/InventoryView.js` | `InventoryGrid`, `InventoryDetailPane` | `features/town/components/InventoryTab.vue` |
| Settings | `settings/SettingsView.js` | — | `features/settings/SettingsPage.vue` |
| Shared Modals | — | `BaseModal`, `PresentationModal`, `ExpeditionResultModal` | `components/ModalFrame.vue`, `components/ConfirmDialog.vue` |
| Toasts | `unlocks/UnlockNarrativeView.js` | `PostDaySequencer` | `components/ToastContainer.vue` |

---

## 🧪 Test Strategy Per Step

Every step that creates or modifies Vue files should include tests:

1. **Component tests** in `tests/vue/` using `@vue/test-utils` + `jsdom`
2. **Mount with mocked provides** for composables:
   ```js
   mount(MyComponent, {
     global: { provide: { gameState: shallowRef(mockState), i18n: mockI18n, adapter: mockAdapter } }
   })
   ```
3. **Prop-driven primitive tests** — no mocked provides needed for `components/*.vue`
4. **Adapter action tests** — verify `ACTION_MAP` entries in `tests/vue/adapters/EngineAdapter.spec.js`

Run tests after each step: `npm run test:vue`

---

## 📝 Decision Log (Append-Only)

| Date | Decision | Reason |
|------|----------|--------|
| 2026-06-05 | MagicCircleEditor split into 3 parts (A/B/C) | 712-line legacy view is too large for one session; SVG geometry deserves focused attention |
| 2026-06-05 | Combat split into 4 parts + wiring | 1094-line legacy view is the largest; targeting system is complex |
| 2026-06-05 | Heroes modals done individually | Each modal is self-contained; parallelizable if multiple agents |
| 2026-06-05 | `index-vue.html` created before deleting legacy | Allows side-by-side comparison during final verification |
| 2026-06-05 | No CSS migration — each component writes scoped styles from scratch | Per core initiative §8.1; old CSS is frozen and deleted in Phase 4 |

---

*Document Version: 3.0 (Atomic Steps — Resume-Ready)*
*Last Updated: 2026-06-05*
*Status: Active — Being Executed*
*Companion To: core_initiative_component_based_ui.md*
