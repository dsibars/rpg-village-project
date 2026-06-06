# Migration Check Status — Vanilla JS → Vue 3

> **Context:** This document tracks the ongoing review of the RPG Village UI migration from vanilla JS (`js/presentation/`) to Vue 3 (`ux/`).  
> See [core_initiative_component_based_ui.md](../.dev_workflow/ideas/core_initiative_component_based_ui.md) for architecture vision and rationale.

---

## Purpose & Collaborative Workflow

This file serves as a **shared agents log** for the migration review. It is designed to support iterative, multi-session collaborative work between humans and AI agents.

### How this file is used:

1. **Session start**: The reviewing agent reads this file first to understand what has been reviewed, what's pending, and what's currently being worked on.
2. **During review**: As the agent detects potential issues, they are **immediately** added to the [Potential Findings](#potential-findings) section — even before diagnosis is complete. This ensures nothing is lost if a session is interrupted.
3. **When a fix begins**: The finding is moved to [Working Actions](#working-actions) with a brief clue about the intended approach. This acts as a resumable TODO if the session ends before the fix is complete.
4. **When a fix is done**: The entry is removed from Working Actions. Optionally, a brief note is added to the [Completed Fixes](#completed-fixes) log.
5. **Session end**: The agent updates the [Review Progress](#review-progress) section to record what was covered.

> **Rule**: Never leave a detected issue unwritten. Add it to Potential Findings immediately. The cost of writing one line is zero; the cost of forgetting is starting over.

### What "Continue" Means

If you are told to **"continue the migration review"** (or similar), your goal is to move the project as close as possible to a **one-shot perfect migration** when the user tests it. This means:

1. **Check unreviewed parts** — Work through every 🔲 item in [Review Progress](#review-progress). Prioritize by functional risk (combat, save/load, progression gates) over polish.
2. **Discover missing parts** — As you review, determine if there are files, flows, or edge cases *not yet listed* in the Review Progress table. Add them immediately so they aren't lost.
3. **Recheck previously reviewed parts** — If a component has been modified since its last review date, or if a fix in one area could affect another, re-review it. Update the **Last Reviewed** date and append a note like `(rechecked 2026-06-06 — still valid after PF-XXX fix)`.
4. **Fix or file everything** — Do not let findings sit idle. Either:
   - Fix them immediately (move to [Working Actions](#working-actions), then [Completed Fixes](#completed-fixes)), or
   - Ensure they are fully diagnosed and documented in [Potential Findings](#potential-findings) with a fix hint.
5. **Aim for test-readiness** — The migration is "ready for test" when:
   - All P1 (Critical) findings are resolved or have a WA in progress.
   - All P2 (Significant) findings that block core loops are resolved.
   - No unreviewed component remains that could hide a P1/P2 issue.

> **Guiding principle**: Treat every session as if it is the last one before the user runs a full playtest. Leave no silent breakage behind.

---

## Review Progress

Tracks which areas have been reviewed and their status.

| Area | Status | Last Reviewed | Notes |
|------|--------|--------------|-------|
| `ux/main.js` | ✅ Reviewed | 2026-06-06 | Game loop, provider setup — looks correct |
| `ux/App.vue` | ✅ Reviewed | 2026-06-06 | Shell, routing, overlays, post-day sequencing |
| `ux/adapters/EngineAdapter.js` | ✅ Reviewed | 2026-06-06 | Action map vs legacy adapter |
| `ux/core/composables/` | ✅ Reviewed | 2026-06-06 | useGameState, useI18n, useAdapter, useNarrativeToasts |
| `ux/core/toast.js` | ✅ Reviewed | 2026-06-06 | Toast + narrative queue |
| `ux/components/TopBar.vue` | ✅ Reviewed | 2026-06-06 | Shell header |
| `ux/components/FooterNav.vue` | ✅ Reviewed | 2026-06-06 | Bottom nav |
| `ux/components/TabNav.vue` | ✅ Reviewed | 2026-06-06 | Tab component |
| `ux/features/village/VillagePage.vue` | ✅ Reviewed | 2026-06-06 | Dashboard layout |
| `ux/features/heroes/HeroesPage.vue` | ✅ Reviewed | 2026-06-06 | Master-detail, modals |
| `ux/features/adventure/AdventurePage.vue` | ✅ Reviewed | 2026-06-06 | Tab container |
| `ux/features/adventure/components/ExploreTab.vue` | ✅ Reviewed | 2026-06-06 | Major differences vs legacy tree |
| `ux/features/town/TownPage.vue` | ✅ Reviewed | 2026-06-06 | Tab container |
| `ux/features/combat/CombatOverlay.vue` | ✅ Reviewed | 2026-06-06 | Combat UI + auto-advance |
| `ux/features/settings/SettingsPage.vue` | ✅ Reviewed | 2026-06-06 | Settings + simulator |
| `ux/features/saveSlots/SaveSlotPage.vue` | 🔲 Not reviewed | — | — |
| `ux/features/town/components/BuildingsTab.vue` | ✅ Reviewed | 2026-06-06 | Hardcoded costs (PF-017) |
| `ux/features/town/components/ShopTab.vue` | ✅ Reviewed | 2026-06-06 | buyResource missing (PF-015), unlock gate (PF-016) |
| `ux/features/town/components/ForgeTab.vue` | ✅ Reviewed | 2026-06-06 | Unlock gate correct (blacksmith ≥ 1). PF-018 resolved as false alarm. |
| `ux/features/town/components/InventoryTab.vue` | ✅ Reviewed | 2026-06-06 | Looks correct, has teach modal |
| `ux/features/adventure/components/BestiaryTab.vue` | 🔲 Not reviewed | — | — |
| `ux/features/adventure/components/CodexTab.vue` | 🔲 Not reviewed | — | — |
| `ux/features/adventure/components/ChronicleTab.vue` | 🔲 Not reviewed | — | — |
| `ux/features/heroes/components/HeroProfile.vue` | ✅ Reviewed | 2026-06-06 | Looks correct |
| `ux/features/heroes/components/HeroActionBar.vue` | ✅ Reviewed | 2026-06-06 | Visibility gating looks correct |
| `ux/features/heroes/components/HeroStatsGrid.vue` | 🔲 Not reviewed | — | — |
| `ux/features/heroes/components/modals/*` | 🔲 Not reviewed | — | 8 modals |
| `ux/features/gambit/GambitEditor.vue` | 🔲 Not reviewed | — | — |
| `ux/features/gambit/components/*` | 🔲 Not reviewed | — | 6 sub-components |
| `ux/features/magic_circle/MagicCircleEditor.vue` | 🔲 Not reviewed | — | — |
| `ux/features/magic_circle/components/*` | 🔲 Not reviewed | — | 3 sub-components |
| `ux/features/village/components/*` | 🔲 Not reviewed | — | 6 sub-components |
| `ux/features/village/components/modals/*` | 🔲 Not reviewed | — | DailyReportModal |
| `ux/features/shared/*` | 🔲 Not reviewed | — | IntroDialog, PresentationModal, ExpeditionResultModal |
| `ux/features/combat/components/*` | 🔲 Not reviewed | — | 5 sub-components |

---

## Potential Findings

Issues detected during review that need further investigation or fixing.

### 🔴 P1 — Critical (broken functionality)

#### PF-001: Combat Auto-Advance Missing from Vue Game Loop
- **Where:** `ux/main.js` game loop vs `js/presentation/adapters/EngineAdapter.js` lines 367-393
- **What:** The legacy adapter's game loop includes **combat auto-advance logic** — when it's an enemy turn (or auto-battle is on), it calls `engine.nextBattleTurn()` every 500ms. The Vue `main.js` game loop (lines 46-52) only calls `engine.update()` — it never calls `engine.nextBattleTurn()`. This means **enemy turns and auto-battle will not advance** in the Vue build.
- **Impact:** Combat is completely broken for enemy turns and auto-battle mode. Players must manually advance every single turn.
- **Fix hint:** Add combat auto-advance logic to the Vue game loop in `main.js`, similar to the legacy adapter's pattern (check `activeBattle`, `turnOrder`, `currentTurnIndex`, and call `engine.nextBattleTurn()` at 500ms intervals).

#### PF-002: Explore Tree View is Flat List Instead of Branching Tree
- **Where:** `ux/features/adventure/components/ExploreTab.vue` tree mode (lines 54-65) vs `js/presentation/ui/explore/components/ExpeditionTree.js`
- **What:** The legacy tree renders a **bottom-up branching tree** with SVG connector lines between parent/child nodes, levels grouped by depth, and icons representing status (○ available, ◎ active, ✕ completed, ⬡ closed, △ locked). The Vue version renders a flat vertical list of `tree-node` divs with no parent-child hierarchy, no SVG connectors, no depth levels. It's just the same as the list view but with different styling.
- **Impact:** The tree view is a core visual differentiator of the explore page. Players lose the ability to see the expedition graph structure.
- **Fix hint:** Port the `ExpeditionTree.js` branching logic: build parent-child relationships via `node.parentId`, group by depth level, render level rows in reverse order, add SVG connector overlay. Consider extracting to a dedicated `ExpeditionTree.vue` component.

#### PF-003: Explore Tree Node Click Doesn't Open Detail Modal
- **Where:** `ux/features/adventure/components/ExploreTab.vue` function `selectExpedition` vs `js/presentation/ui/explore/ExploreView.js` function `handleTreeNodeClick`
- **What:** In the legacy, clicking a tree node opens a **modal dialog** with `ExpeditionDetailPane` inside (via `BaseModal.show`). In Vue, clicking a tree node just sets `selectedExp` to show an inline detail pane below. Additionally, the legacy shows a special **completed expedition modal** (with hero names, rewards, closure bonuses) for completed/closed nodes — the Vue version doesn't handle this at all.
- **Impact:** Completed/closed expeditions can't be reviewed. The UX interaction pattern is fundamentally different from what players know.

### 🟡 P2 — Significant (degraded experience)

#### PF-004: No Settings Tab Access from Footer Nav  
- **Where:** `ux/App.vue` line 37-41 (FooterNav) and `ux/components/FooterNav.vue`
- **What:** The legacy UI has settings accessible from the Town category's tab group. The Vue footer nav only has 4 categories (village, heroes, adventure, town). Settings is registered as a page in `App.vue` (line 169) but there's no navigation path to reach it from the footer. It's only accessible via `@openSettings` event, which is emitted from… nowhere in the current implementation. Check if any page component actually emits `openSettings`.
- **Impact:** Players cannot access the settings page (language, save management, dev cheats).
- **Fix hint:** Either add a settings button to TopBar or add it as a tab in TownPage, matching the legacy behavior.

#### PF-005: `useBestiary()` Composable Returns Object Inside Computed
- **Where:** `ux/core/composables/useGameState.js` lines 59-65
- **What:** `useBestiary()` returns a single computed that yields `{ bestiary, enemyTemplates }`. But in `HeroesPage.vue` line 159, it's destructured as `const { bestiary, enemyTemplates } = useBestiary()`, which means `bestiary` and `enemyTemplates` are plain (non-reactive) properties extracted once from the computed. They won't track reactivity correctly — they'll be the initial values and never update.
- **Impact:** Gambit test setup (which needs enemy templates) may show stale data. The bestiary tab could be affected.
- **Fix hint:** Either return separate computeds from `useBestiary()` or use `.value` in the consuming component to access the nested properties.

#### PF-006: Region Selection Doesn't Auto-Select First Region
- **Where:** `ux/features/adventure/components/ExploreTab.vue` — `selectedRegion` initialized to `null` (line 152)
- **What:** The legacy `ExploreView.js` auto-selects the first region if none is selected (line 250-252). The Vue version starts with `selectedRegion = null`, so on first visit the region list shows but no region is selected, meaning no expeditions are filtered/shown.
- **Impact:** Players see an empty expedition list on first visit until they manually click a region.

#### PF-007: ExploreTab `viewMode` Persistence Without Watch
- **Where:** `ux/features/adventure/components/ExploreTab.vue` line 151
- **What:** `viewMode` reads from `localStorage` on init, but never **writes** back when changed. In the legacy, `setViewMode()` calls `localStorage.setItem('explore_view_mode', mode)`. The Vue version only initializes from localStorage — toggling the view doesn't persist.
- **Impact:** View mode preference resets on page refresh.

#### PF-008: Navigate Event from VillagePage Not Handled
- **Where:** `ux/features/village/VillagePage.vue` emits `navigate` (line 116), received by `App.vue` `@navigate="handleNavigate"` (line 33) 
- **What:** `handleNavigate` in App.vue (line 291-294) only handles the `page` part of the navigation. The `tab` parameter is ignored. So when VillagePage emits `navigate { page: 'town', tab: 'buildings' }`, it switches to TownPage but doesn't set the tab to 'buildings'.
- **Impact:** Navigation from village canvas to buildings tab works but doesn't auto-select the buildings tab (it goes to whatever tab was last active in TownPage).

#### PF-009: Missing Codex/Chronicle Quick-Access Buttons
- **Where:** `ux/components/TopBar.vue` vs legacy `UIController.js` lines 103-115
- **What:** The legacy TopBar has `btn-global-codex` and `btn-global-chronicle` buttons that let players jump directly to the Codex and Chronicle tabs from any page. The Vue TopBar doesn't include these shortcuts.
- **Impact:** Players lose quick navigation to important reference/history pages.

### 🟢 P3 — Minor (polish, visual differences)

#### PF-010: TopBar Missing Wood Stat from Inventory State
- **Where:** `ux/App.vue` line 162 and `ux/components/TopBar.vue`
- **What:** In App.vue, `wood` is computed as `village.value.wood || 0`. But in the legacy `UIController.js` (line 242-244), wood is read from `state.inventory.materials.material_wood`. The state shape might differ — if `village.wood` isn't populated by the engine, the TopBar will always show 0.
- **Impact:** Wood resource could show as 0 even when the player has wood.

#### PF-011: HelloWorld.vue Still in Components Directory
- **Where:** `ux/components/HelloWorld.vue`
- **What:** This is a Vite scaffold artifact. It's 893 bytes and shouldn't be in the production build.
- **Impact:** Dead code, no functional impact but unprofessional.

#### PF-012: Storage Warning Toast Missing in Vue
- **Where:** Legacy `UIController.js` lines 248-258 vs Vue implementation
- **What:** The legacy UI proactively shows a toast when storage exceeds 95%, and clears the flag when it drops below 80%. The Vue implementation doesn't have this proactive storage warning anywhere.
- **Impact:** Players don't get warned about full storage.

#### PF-013: Legacy adapter shows success toasts for actions, Vue adapter does not
- **Where:** Vue `ux/adapters/EngineAdapter.js` vs Legacy `js/presentation/adapters/EngineAdapter.js`
- **What:** The legacy adapter shows success feedback like `"${hero.name} +${amountRestored} HP"` for consumables, `"+${goldEarned}g"` for selling items, etc. The Vue adapter only shows error toasts (line 111-112). Positive feedback is completely missing.
- **Impact:** Players don't get feedback for successful actions (recruit, sell, cook, etc.).

#### PF-014: ExploreTab Status Banner Missing
- **Where:** `ux/features/adventure/components/ExploreTab.vue` vs Legacy `ExploreView.js` `renderStatus()` method (lines 211-224)
- **What:** Legacy shows a status banner: "Active expeditions: X / Y". Vue has no such banner.
- **Impact:** Minor info loss about how many concurrent expeditions are active vs max.
#### PF-015: ShopTab `buyResource` Dispatches Non-Existent Adapter Action
- **Where:** `ux/features/town/components/ShopTab.vue` line 202 dispatches `dispatch('shop', 'buyResource', ...)` 
- **What:** The Vue adapter's `shop` domain (EngineAdapter.js) only has `buyItem`, `sellItem`, `sellResource`. There is no `buyResource` action. Calling it will log `"Unknown action: shop.buyResource"` and silently fail.
- **Impact:** Players cannot purchase wood/stone resources from the shop's Resources tab. The button does nothing.
- **Fix hint:** Either add `buyResource: (engine, p) => engine.buyResource(p.resourceId, p.quantity)` to the adapter, or remap to an existing method like `buyItem` with appropriate params.

#### PF-016: Shop Unlock Gate Always True
- **Where:** `ux/features/town/components/ShopTab.vue` line 127 — `isUnlocked = computed(() => true)`
- **What:** The legacy `UIController.updateNavLocks()` gates the shop on `completedExpeditions.includes('exp_tutorial_cave')`. The forge is gated on `blacksmith >= 1`. In the Vue ShopTab, the shop is always unlocked.
- **Impact:** Players can access the shop before completing the tutorial cave expedition, breaking progression gating.
- **Fix hint:** Check `gameState.value.completedExpeditions` for `'exp_tutorial_cave'`.

#### PF-017: Buildings Cost Data Hardcoded Instead of Using Engine Data
- **Where:** `ux/features/town/components/BuildingsTab.vue` lines 103-117 — `getUpgradeCost()` 
- **What:** The building upgrade costs are hardcoded in the Vue component. The legacy uses the engine's `startProject()` method which validates costs from the authoritative `buildings_data.md` spec. If the spec values change, the Vue component will show wrong costs and potentially allow invalid upgrades (the engine may reject them, but the UI shows stale data).
- **Impact:** Data drift risk. The UI costs can diverge from the engine's authoritative costs.
- **Fix hint:** The engine should expose cost calculations, or the adapter should provide building data. Check if `gameState` already includes building definitions with cost info.

#### PF-018: ~~Forge Unlock Gate Not Implemented~~ — **RESOLVED: False alarm**
- **Where:** `ux/features/town/components/ForgeTab.vue` line 74
- **What:** Forge correctly uses `isUnlocked = computed(() => blacksmithLevel.value >= 1)`. No issue.

---

## Working Actions

Active work items. Format: `WA-XXX: Brief description — approach hint`.

_(Empty — no fixes currently in progress)_

---

## Completed Fixes

Log of fixes applied during review sessions.

| Fix ID | Date | Description |
|--------|------|-------------|
| PF-001 | 2026-06-06 | Added combat auto-advance to Vue game loop (`ux/main.js`). Enemy turns and auto-battle now advance every 500ms, matching legacy behavior. |
| PF-006 | 2026-06-06 | Added `watch` on `expeditionRegions` to auto-select first region when regions load (`ExploreTab.vue`). |
| PF-007 | 2026-06-06 | Added `watch` on `viewMode` to persist to `localStorage` when changed (`ExploreTab.vue`). |
| PF-015 | 2026-06-06 | Fixed `buyResource` in ShopTab to dispatch `shop.buyItem` instead of non-existent `shop.buyResource`. |
| PF-016 | 2026-06-06 | Shop now gates on `completedExpeditions.includes('exp_tutorial_cave')` instead of being always unlocked. |

---

## Architecture Notes

Observations about the migration architecture that aren't bugs but may inform future work.

1. **State shape differences**: The Vue composable `useGameState()` exposes `gameState.value.expeditionRegions` as an array (per the composable's `regions` selector). The legacy `ExploreView.getRegions()` treats `state.expeditionRegions` as an **object** (using `Object.entries()`). Verify which shape the engine actually outputs — a mismatch here could cause the entire region list to be empty.

2. **`shallowRef` is correct**: The game state is replaced wholesale on each tick. `shallowRef` avoids deep proxying thousands of nested objects. This matches the architecture doc §6.2.

3. **Missing `eraseBodyCircle` and `useGlyphTablet` in hero adapter**: The Vue adapter has `eraseBodyCircle` and `useGlyphTablet` under `hero` domain (lines 14-15), plus `useGlyphTablet` also under `inventory` domain (line 49). The legacy adapter doesn't seem to have `eraseBodyCircle` wired. This might be intentional (overwrite-only, as noted in legacy adapter line 194), but verify the HeroInscriptionModal doesn't try to dispatch `eraseBodyCircle`.

4. **Tab navigation pass-through**: `TownPage` and `AdventurePage` don't accept props for the initial tab. So deep-linking from other pages (e.g., VillagePage → buildings tab) requires a different mechanism (emitting navigate events up to App.vue, which would need to pass tab info back down). Currently this chain is broken (see PF-008).
