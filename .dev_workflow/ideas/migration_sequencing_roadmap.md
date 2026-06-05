# Migration Sequencing Roadmap

> **Status:** Idea / Strategic Reference
>
> **Companion Document:** [Core Initiative: Component-Based UI Architecture with Vue 3](./core_initiative_component_based_ui.md)
>
> **Purpose:** This document provides a high-level sequencing strategy for migrating the presentation layer to the Vue 3 component-based architecture defined in the core initiative. It does **not** contain implementation details, file-level edits, or test plans — those belong in per-phase implementation plans.

---

## 1. Guiding Principles for Sequencing

### 1.1 Parallel Build, Single Cutover

The new presentation layer (`ux/`) is built entirely in isolation. The old presentation layer (`js/presentation/`, `pages/`, `css/`) is **frozen** — no edits, no bug fixes, no new features during migration. When the new layer is complete, a single commit changes `js/main.js` to mount the Vue app instead of the old UI controller. The old code is then deleted.

This eliminates:
- Temporary compatibility code
- Dual-system maintenance
- Feature flags or runtime toggles
- Risk of breaking the running game

**Coexistence bridge for development:** During Phase 3, developers may need to compare Vue components against legacy views. A documented bridge pattern (see §6.4 in the core initiative) allows mounting legacy views inside Vue pages for side-by-side verification. This bridge is **not for production** — it is a development aid only.

### 1.2 Validate Before Scale

The component contract (Vue SFC with `<script setup>`) is new to this codebase. We must prove it works with a real, player-visible feature before applying it to all domains.

### 1.3 Infrastructure Before Features

Shared infrastructure (composables, common UI primitives, theme tokens, path aliases) must exist before domain components depend on it. Building `GambitRow` before `Button` and `ModalFrame` means `GambitRow` invents its own button patterns, creating debt.

### 1.4 Adapter Simplification Enables Domain Work

The current `EngineAdapter.js` uses a manual per-event switch statement (`if (domain === 'heroes') { view.on('increaseStat', ...) }`). The new adapter uses a generic dispatcher (`adapter.dispatch('hero', 'increaseStat', payload)`). Building the new adapter early ensures all domain components use the uniform interface from day one.

### 1.5 Player-Visible Features First

Domains that players interact with most (Heroes, Gambits, Combat) should be prioritized over background systems (Settings, Chronicle, Codex). This ensures the migration delivers user-facing value continuously.

---

## 2. Phase Overview

| Phase | Name | Goal | Approximate Scope |
|-------|------|------|-------------------|
| **0** | The Setup | Add Vue 3 to the project, configure Vite, create `ux/` directory, verify build pipeline | `package.json`, `vite.config.js`, `ux/` skeleton |
| **1** | Proof of Concept | Validate the Vue architecture with one self-contained, player-visible feature | `TrainingGrounds.vue`, `GambitEditor.vue` decomposition |
| **2** | Shared Infrastructure | Build common primitives and composables that all domains will use | `ux/components/`, `ux/core/composables/`, `ux/core/theme.css` |
| **3** | Domain Refactors | Componentize each domain page-by-page | `features/heroes/`, `features/combat/`, `features/village/`, etc. |
| **4** | The Switch & Cleanup | Change `main.js` to mount Vue app, delete old presentation code | `js/main.js`, `js/presentation/`, `pages/`, `css/` |

---

## 3. Phase Details

### Phase 0: The Setup

**Objective:** Add Vue 3 to the project, configure the build pipeline, create the `ux/` directory structure, and prove that Vue components compile correctly without touching the running game.

**Deliverables:**

1. **Dependencies**
   - `npm install vue`
   - `npm install -D @vitejs/plugin-vue`

2. **Vite Configuration**
   - Add `@vitejs/plugin-vue` to `vite.config.js`
   - Add path alias `@/` → `ux/` for clean imports
   - Verify `viteSingleFile()` still inlines Vue-compiled assets correctly

3. **`ux/` Directory Structure**
   ```
   ux/
   ├── main.js              # Vue app bootstrap (not yet wired to game)
   ├── App.vue              # Root shell placeholder
   ├── core/
   │   ├── composables/     # Empty, ready for shared logic
   │   └── theme.css        # Design tokens (empty or minimal)
   ├── components/          # Empty, ready for primitives
   ├── features/            # Empty, ready for domains
   └── adapters/
       └── EngineAdapter.js # New adapter placeholder
   ```

4. **Build Verification**
   - Create a minimal `HelloWorld.vue` in `ux/components/`
   - Create a minimal `App.vue` that renders it
   - Verify `npm run build` succeeds and outputs a valid `dist/index.html`
   - The old game still runs normally because `main.js` has not changed

**Exit Criteria:**
- `npm run build` succeeds with Vue plugin enabled
- A Vue component renders correctly in the build output
- The existing game (old presentation layer) is untouched and still playable

**Dependencies:** None. This phase is purely additive.

**Risk:** Very low. No player-facing changes. If the build breaks, revert `vite.config.js` and `package.json`.

**Implementation Plan:** See [Implementation Plan 0: The Setup](../implementation_plans/0_the_setup.md)

---

### Phase 1: Proof of Concept

**Objective:** Prove the Vue architecture works in a real, complex, player-visible feature. Choose features that are self-contained (minimal cross-domain dependencies) and clearly painful in the current architecture.

**Selected Features:**

1. **TrainingGrounds.vue**
   - Currently scattered across `HeroProfilePane.js`, `HeroesView.js`, `HeroTrainingModals.js`, and `EngineAdapter.js`
   - Target: A single `TrainingGrounds.vue` component that receives a hero and infrastructure, emits actions, and conditionally renders buttons
   - Validates: Props/emits pattern, conditional rendering (`v-if`), scoped styles, event forwarding

2. **GambitEditor.vue + Sub-components**
   - Currently a 962-line `GambitView.js` god class
   - Target: `GambitEditor.vue` composed of `GambitList.vue`, `GambitRow.vue`, `GambitForm.vue`, `GambitFallbackRow.vue`
   - Validates: List rendering (`v-for` with `:key`), form handling, two-way data flow, modal composition

**Deliverables:**
- `ux/features/heroes/components/TrainingGrounds.vue`
- `ux/features/gambit/GambitEditor.vue`
- `ux/features/gambit/components/GambitList.vue`
- `ux/features/gambit/components/GambitRow.vue`
- `ux/features/gambit/components/GambitForm.vue`
- `ux/features/gambit/components/GambitFallbackRow.vue`
- Corresponding scoped styles in each `.vue` file

**Exit Criteria:**
- Each `.vue` file is ≤ 250 lines (template + script + style)
- Components render correctly in isolation (mount in a test container with mock props)
- Code review confirms no imperative DOM creation (`document.createElement`, `innerHTML` for structure)
- Scoped styles work: a `.btn` in `GambitRow.vue` does not leak to `GambitForm.vue`

**Dependencies:** Phase 0 (Vue pipeline must work).

**Risk:** Low-Medium. These components are not yet wired to the game. They exist only in `ux/` and are tested in isolation. No player-facing impact.

---

### Phase 2: Shared Infrastructure

**Objective:** Build the common primitives and shared utilities that all domain components will depend on. This prevents each domain from inventing its own button, modal, or formatting logic.

**Deliverables:**

1. **Design Tokens (`ux/core/theme.css`)**
   - CSS custom properties for colors, fonts, spacing, borders, radii
   - Imported globally in `main.js` or `App.vue`

2. **Composables (`ux/core/composables/`)**
   - `useEngine.js` — provides reactive access to engine state
   - `useI18n.js` — provides the `t()` translation function reactively
   - `useAdapter.js` — provides the generic action dispatcher

3. **Common UI Primitives (`ux/components/`)**
   - `Button.vue` — variants: primary, secondary, danger, ghost; sizes: sm, md, lg; states: disabled, loading
   - `ModalFrame.vue` — header, close button, content slot, footer slot
   - `ResourceBar.vue` — gold, wood, population display
   - `Icon.vue` — standardized icon wrapper with size and color props
   - `EmptyState.vue` — reusable empty/placeholder view
   - `LoadingSpinner.vue` — standardized loading indicator

4. **New Engine Adapter (`ux/adapters/EngineAdapter.js`)**
   - Generic `dispatch(domain, action, payload)` method
   - Replaces the manual per-event switch in `js/presentation/adapters/EngineAdapter.js`
   - Thin: delegates to `engine.dispatchDomainAction()` or equivalent
   - Returns `{ success, error }` and triggers toast on failure

**Exit Criteria:**
- All primitives render correctly in a storybook-style test page
- `Button.vue` supports all required variants without leaking styles
- `ModalFrame.vue` traps focus and closes on Escape key
- Composables (`useI18n()`, `useGameState()`, `useAdapter()`) provide reactive data that updates when engine state changes
- Adapter correctly translates generic actions to engine calls (tested with mock engine)

**Dependencies:** Phase 0 (Vue pipeline), Phase 1 (PoC validates component patterns).

**Risk:** Low. Additive only. No player-facing changes.

---

### Phase 3: Domain Refactors

**Objective:** Apply the Vue component model to all remaining domain pages. Each domain becomes a folder in `ux/features/<domain>/` containing its page, sub-components, modals, and scoped styles.

**Recommended Order:**

| Order | Domain | Rationale |
|-------|--------|-----------|
| 3.1 | **Heroes** | Already partially decomposed in old code. Phase 1's `TrainingGrounds` is part of this domain. Low-hanging fruit. |
| 3.2 | **Combat** | High player visibility. `CombatView.js` is 1,094 lines — the biggest god view. Decomposing it proves Vue scales to the most complex UI. |
| 3.3 | **Village** | Contains multiple concerns (calendar, defense, labor pool, construction queue). Good test of composing many small components on one page. |
| 3.4 | **Explore** | Expedition list/detail/tree pattern. Similar complexity to Heroes. |
| 3.5 | **Buildings** | Simpler domain. Good for refining the pattern after learning from harder domains. |
| 3.6 | **Shop & Forge** | Both are catalog + detail patterns. Can share `CatalogGrid` and `DetailPane` components. |
| 3.7 | **Inventory** | Grid + detail pattern. Can share components with Shop/Forge. |
| 3.8 | **Bestiary, Codex, Chronicle, Settings** | Low player interaction frequency. Refactored quickly once the pattern is mature. |
| 3.9 | **Save Slots** | Pre-game screen. Currently vanilla. Migrate to Vue for consistency. |

**Deliverables per Domain:**
- `<Domain>Page.vue`: Thin composer page (replaces `<Domain>View.js`)
- `components/`: All UI sub-components extracted from the old view
- `components/modals/`: Any overlay content extracted from static methods
- Scoped styles in each `.vue` file

**Exit Criteria (per domain):**
- Old `<Domain>View.js` is deleted from `js/presentation/ui/` (it is already frozen; we simply stop porting its logic)
- All new `.vue` files satisfy the contract: props, emits, scoped styles, ≤250 lines
- Feature components use composables for cross-cutting concerns (i18n, adapter, state). Primitives remain pure props/emits.
- No cross-domain imports (shared code lives in `components/` or `core/`)
- No imperative DOM creation
- No inline styles except truly dynamic values

**Dependencies:** Phase 0 (Vue pipeline), Phase 1 (pattern validated), Phase 2 (primitives and adapter available).

**Risk:** Medium per domain, but mitigated by domain isolation. A bug in `Combat` does not affect `Shop`.

**Parallelization Potential:** Once Phase 2 is complete, domains 3.5–3.8 can be parallelized across sessions because they are independent. Domains 3.1–3.4 should be sequential because they establish patterns that downstream domains follow.

---

### Phase 4: The Switch & Cleanup

**Objective:** Connect the Vue app to the game engine, mount it in place of the old UI, and delete all legacy presentation code.

**The Switch (Bootstrap Rewrite):**

```js
// js/main.js — BEFORE (current)
import { UIController } from './presentation/ui/UIController.js'
import { EngineAdapter } from './presentation/adapters/EngineAdapter.js'

const ui = new UIController(i18n)
const adapter = new EngineAdapter(engine, ui)

// Register all domain views
ui.registerView('village', new VillageView())
ui.registerView('heroes', new HeroesView())
// ... 9 more views

adapter.init()
```

```js
// js/main.js — AFTER (switch day)
import { createVueApp } from '../ux/main.js'

// Vue app bootstraps itself, provides services, mounts into #app
const app = createVueApp({ 
  engine, 
  container: document.getElementById('app') 
})
```

**This is NOT one import change.** It is a full bootstrap rewrite. `js/main.js` goes from ~80 lines of view registration + adapter wiring to ~10 lines of Vue app creation.

**Save Slot Screen:**

`js/main.js` has a two-stage bootstrap:
1. **Pre-game:** Save slot selection (`SaveSlotView.js`) — runs BEFORE engine boots
2. **In-game:** Game UI — runs AFTER engine boots

Both are migrated to Vue. `SaveSlotView` becomes `features/saveSlots/SaveSlotPage.vue` in Phase 3.9. On switch day, `js/main.js` mounts the appropriate Vue page:

```js
// js/main.js (switch day)
import { createVueApp } from '../ux/main.js'

// Vue app handles both save slot screen and game UI internally
// based on whether a slot is selected
const app = createVueApp({ engine, container: document.getElementById('app') })
```

The Vue `App.vue` checks `persistence.hasSlotSelected()` and renders either `SaveSlotPage` or the game shell.

**Cleanup Deliverables:**

1. **Delete Old Presentation Code**
   - `js/presentation/` — entire directory
   - `pages/` — entire directory (if all templates are replaced by Vue components)
   - `css/` — entire directory (styles are now in `.vue` files and `ux/core/theme.css`)

2. **Verify Game Functionality**
   - All domains render correctly
   - All user interactions work (buttons, modals, forms, navigation)
   - Game loop runs at 10 FPS without re-render issues
   - Save/load compatibility preserved
   - i18n works in all supported languages
   - Mobile responsiveness maintained
   - **Save slot screen still works**
   - **Electron package builds correctly**

3. **Final Directory State**
   ```
   js/
   ├── engine/              ← untouched
   ├── main.js              ← mounts ux/main.js
   └── (presentation/ deleted)
   
   ux/                      ← new presentation layer
   ├── main.js
   ├── App.vue
   ├── core/
   ├── components/
   ├── features/
   └── adapters/
   ```

**Exit Criteria:**
- The game builds and runs identically to the pre-migration version
- All player-facing functionality is preserved
- No references to deleted files remain in imports
- `npm run build` succeeds with zero warnings

**Dependencies:** All Phase 3 domains complete.

**Risk:** Medium-High. This is the only moment where player-facing changes occur. Mitigation: thorough testing before merge. The switch is one commit — revertible with `git revert`.

---

## 4. Cross-Cutting Concerns

These concerns span all phases and must be addressed continuously.

### 4.1 i18n Preservation

- Do not rename, delete, or restructure translation keys during any phase unless explicitly required.
- **Never pass `t` as a prop.** This creates prop drilling through every component layer. Use the `useI18n()` composable in feature components instead.
- Primitives (`components/`) that display text receive translated strings via props (`:label="t('key')"` from the parent), or use slots.
- Vue's reactivity means `t()` calls update automatically when language changes.
- The `useI18n()` composable wraps the engine's existing `i18n` service. No new translation system is built.

### 4.2 Mobile Responsiveness

- The existing responsive patterns (master-detail layouts, adaptive grids) must be preserved.
- Components should not assume desktop-only layouts.
- Use CSS Grid and Flexbox with breakpoints defined in `theme.css`.

### 4.3 Accessibility (a11y)

- Buttons must remain `<button>` elements, not `<div>` click handlers.
- Modals must trap focus and support `Escape` key closing.
- Images must have `alt` text.
- Color contrast must meet existing standards.
- Vue's template syntax makes a11y easier: `@keydown.escape="close"` is declarative and readable.

### 4.4 Save/Load Compatibility

- The presentation layer must not change the shape of save data.
- Vue components emit the same action payloads that the old views emitted.
- The adapter translates these to the same engine calls.

### 4.5 CSS

- **There is no CSS migration.** Old `css/` is frozen and deleted in Phase 4.
- Each new component writes its own scoped CSS in its `.vue` file.
- Shared styles (like `.btn` base styles) live in `components/Button.vue`'s `<style scoped>` and are composed via CSS custom properties from `theme.css`.
- Cross-component shared layout patterns (e.g., master-detail grid) can use a shared CSS file in `features/<domain>/shared/` if multiple components need it.

### 4.6 Performance Budget

- The migration must not degrade the game's 10 FPS UI update loop.
- **Use `shallowRef()` for game state**, not `ref()`. Deep reactivity would create thousands of proxies per frame. `shallowRef()` replaces the top-level reference only — exactly what we need for immutable state snapshots.
- The game loop is throttled to 100ms (10 FPS). `engine.update()` is **not idempotent** — calling it faster would advance simulation incorrectly.
- Vue's reactivity is efficient, but we must avoid unnecessary re-renders:
  - Use `computed()` for derived state
  - Use `:key` on `v-for` lists
  - Avoid deep watchers
- The final build size must not increase significantly. Vue 3 is ~22KB gzipped. The old `js/presentation/` code will be deleted, offsetting much of this.

### 4.7 Error Boundaries

- Every page-level component uses `onErrorCaptured` to catch and handle child component errors.
- `app.config.errorHandler` is set in `ux/main.js` for global error reporting.
- Errors in one domain page must not crash the entire app.

### 4.8 AI-Agent Maintainability

- Vue is well-documented. Future AI sessions can reference official docs.
- The component contract is standard: `.vue` file with `<template>`, `<script setup>`, `<style scoped>`.
- No custom conventions to learn beyond the directory structure.

---

## 5. What This Roadmap Does NOT Cover

This document intentionally excludes:

- **Specific file renames and line-by-line edits** → Implementation plans
- **Test case specifications** → Implementation plans
- **Exact timelines or deadlines** → Sprint/iteration planning
- **Rollback procedures** → Risk management in implementation plans
- **Feature additions or game design changes** → This is a refactor; no new mechanics

---

## 6. Decision Log

| Decision | Rationale | Reversible? |
|----------|-----------|-------------|
| **Vue 3 with `<script setup>`** | Proven reactivity, scoped styles, backend-dev-friendly syntax, excellent docs. Eliminates custom diffing bugs. | No. Once adopted, components depend on Vue's reactivity. Reverting would require another full rewrite. |
| **Parallel build in `ux/` folder** | Old code stays untouched and playable. No compatibility code. Single cutover at the end. | Yes. If Vue fails, delete `ux/` and old code still works. |
| **Old code frozen during migration** | Prevents drift. Ensures the switch is a clean replacement, not a merge. | Yes, but unfreezing creates merge conflicts between old and new. |
| **Adapter simplified in Phase 2** | New components need generic dispatch from day one. Waiting until Phase 4 forces dual patterns. | Yes, can keep manual wiring if generic dispatch is problematic. |
| **Combat before Village in Phase 3** | Combat is the hardest domain. Doing it early surfaces architectural gaps while focus is strong. | Yes, order can be swapped. |
| **`.vue` SFC instead of separate HTML/JS/CSS files** | Vue SFC is the standard. `<template>` is at the top — satisfies "HTML is entry point." Scoped styles are automatic. | Partially. Vue supports `src` attributes for external files if needed later. |

---

## 7. Summary

The migration proceeds in five phases, all within the isolated `ux/` folder:

1. **The Setup** — Add Vue 3, configure Vite, create `ux/` skeleton, verify build
2. **Proof of Concept** — Build `TrainingGrounds.vue` and `GambitEditor.vue` to validate the pattern
3. **Shared Infrastructure** — Build common primitives (`Button.vue`, `ModalFrame.vue`), composables, and the generic adapter
4. **Domain Refactors** — Componentize every domain: Heroes, Combat, Village, Explore, Shop, Forge, Inventory, etc.
5. **The Switch & Cleanup** — Change `main.js` to mount Vue, delete old presentation code

Each phase keeps the game playable. The old presentation layer is frozen. The new layer is built in isolation. The switch is one commit.

---

*Document Version: 2.1 (Vue 3 — Reviewed)*
*Created: 2026-06-05*
*Reviewed: 2026-06-05*
*Status: Awaiting Review*
*Companion To: core_initiative_component_based_ui.md*
