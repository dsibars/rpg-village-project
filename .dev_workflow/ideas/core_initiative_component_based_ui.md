# Core Initiative: Component-Based UI Architecture with Vue 3

> **Status:** Idea / Architectural Vision
>
> **Scope:** Presentation Layer (`ux/`, replacing `js/presentation/`, `pages/`, `css/`)
>
> **Goal:** Replace the current imperative view-layer with a declarative Vue 3 component system, enabling maintainability, portability, and a human-first developer experience.
>
> **Companion Document:** [Migration Sequencing Roadmap](./migration_sequencing_roadmap.md)

---

## 1. Context & Motivation

The RPG Village engine layer (`js/engine/`) follows clean Domain-Driven Design. The presentation layer does not. It suffers from:

- **God Views**: `CombatView.js` (1,094 lines), `GambitView.js` (962 lines)
- **Scattered Features**: "Training Grounds" logic is distributed across 4+ files
- **Imperative DOM**: HTML structure is buried in `el()` calls inside JavaScript
- **Custom State Bugs**: Hand-rolled diffing (`lastRenderedState` JSON comparison, `diffList`) causes re-render loops and missed updates
- **No Visual Correlation**: A developer cannot open a file and see "this is what renders on screen"

This initiative defines the target architecture. It does **not** contain a migration roadmap — see the companion document for sequencing.

---

## 2. The Developer Experience We Want

> "I see something on screen → I find one folder → I open the HTML → I see exactly what I'm looking at → if I need behavior, I jump to JS → if I need visuals, I jump to CSS → if I need a new feature, I copy the folder, rename it, and start from there."

This is the mental model of a backend developer. It is deterministic, predictable, and correct. Vue 3 was chosen not because it is trendy, but because it is the only proven tool that enforces this mental model at scale.

---

## 3. Why Vue 3

### 3.1 What We Tried Before

The codebase uses `el()` (hyperscript) and `diffList()` (keyed DOM reconciliation). These are **imperative** tools: JavaScript creates DOM nodes, compares them, and swaps them. This is the opposite of "HTML is the source of truth."

We already experienced the cost:
- Re-render loops from the 100ms game loop
- State that does not propagate correctly
- Bugs that require tracing through 1,000-line view files
- No way to test a component without instantiating the entire engine

### 3.2 What Vue 3 Provides

| Requirement | Current (`el()`/`diffList()`) | Vue 3 |
|------------|------------------------------|-------|
| **HTML is the entry point** | ❌ Structure buried in JS | ✅ `<template>` section is pure HTML |
| **No magic DOM from JS** | ❌ `el('div', ...)` everywhere | ✅ `v-if`, `v-for`, `v-show` in templates |
| **One folder per visual piece** | ❌ Features scattered | ✅ `features/<domain>/ComponentName/` |
| **Reactivity without bugs** | ❌ Hand-rolled diffing | ✅ Proven virtual DOM + reactivity |
| **Scoped styles** | ❌ Global CSS, naming collisions | ✅ `<style scoped>` |
| **Component isolation** | ❌ God views import each other | ✅ Props down, emits up, no cross-imports |
| **AI-friendly** | ❌ Custom conventions | ✅ Well-documented, standard patterns |
| **Backend-dev friendly** | ❌ Event emitter classes | ✅ `<script setup>`: variables and functions |

Vue 3 is ~22KB gzipped. For an Electron game, this is negligible. The dependency is stable, well-documented, and maintained by a core team.

### 3.3 What Vue 3 Is NOT

- It is not a rewrite of the game logic. The `js/engine/` layer is untouched.
- It is not a framework lock-in. Vue components are standard JavaScript modules that compile to DOM operations.

### 3.4 Build Integration

Vite has first-class Vue support via `@vitejs/plugin-vue` — a single plugin addition. The existing build chain requires no structural changes:

| Concern | Current | With Vue |
|---------|---------|----------|
| Vite config | `htmlPartials()` + `viteSingleFile()` | Add `vue()` plugin before `viteSingleFile()` |
| `.vue` compilation | N/A | `@vitejs/plugin-vue` compiles SFCs to JS + scoped CSS |
| `vite-plugin-singlefile` | Inlines all JS/CSS into `dist/index.html` | Works unchanged — Vue-compiled assets are standard JS/CSS |
| Electron load | `win.loadFile('../../dist/index.html')` | Unchanged — Electron loads the inlined build output |
| CSP | None currently required | Vue's scoped CSS compiles to attribute selectors — no inline style CSP issues |

**Plugin order matters:** `vue()` must run before `viteSingleFile()` so Vue SFCs are compiled into standard JS/CSS before inlining.

**No router is needed.** Navigation is in-memory only (`ref('village')` → `computed(() => pages[current])`). There are no URLs, no browser history, no deep-linking. This is intentional — RPG Village is an Electron game, not a web app.

---

## 4. The Component Contract (Vue Edition)

Every component is a self-contained `.vue` file (or a folder with a `.vue` entry point) that satisfies:

```
Component.vue:
  <template>   ← "What I see" — pure HTML, no logic
  <script setup> ← "How it works" — props, computed, functions, emits
  <style scoped> ← "How it looks" — scoped to this component only
```

### 4.1 `<template>`: The View Is the Entry Point

The `<template>` section is the **first thing a developer sees** when opening a component. It contains only HTML structure and Vue directives (`v-if`, `v-for`, `v-show`, `@click`). No JavaScript expressions beyond simple property access.

```vue
<template>
  <div class="gambit-row" :class="{ 'gambit-row--disabled': !gambit.enabled }">
    <div class="gambit-idx">{{ index + 1 }}</div>
    <div class="gambit-content">
      <GambitRuleText :gambit="gambit" />
    </div>
    <div class="gambit-actions">
      <button 
        class="btn btn-move-up" 
        :disabled="index === 0"
        @click="emit('move', gambit.id, -1)"
      >▲</button>
      <button 
        class="btn btn-move-down" 
        :disabled="index === totalCount - 1"
        @click="emit('move', gambit.id, 1)"
      >▼</button>
      <button class="btn btn-toggle" @click="emit('toggle', gambit.id)">
        {{ gambit.enabled ? t('gambit_uxelm_disable') : t('gambit_uxelm_enable') }}
      </button>
      <button class="btn btn-remove" @click="emit('remove', gambit.id)">×</button>
    </div>
  </div>
</template>
```

A backend developer opens this file and **immediately maps every tag to the screen**. No mental JavaScript execution required.

> **Navigation is in-memory only.** There is no Vue Router, no URL bar, no browser history. The `currentCategory` ref in `App.vue` drives page switches. This is correct for an Electron game.

### 4.2 `<script setup>`: Logic Is Just Variables and Functions

No classes. No `this.` No inheritance. Just props, computed values, and functions.

```vue
<script setup>
import { computed } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import GambitRuleText from './GambitRuleText.vue'

const { t } = useI18n()

const props = defineProps({
  gambit: { type: Object, required: true },
  index: { type: Number, required: true },
  totalCount: { type: Number, required: true }
})

const emit = defineEmits(['move', 'toggle', 'remove'])
</script>
```

This looks like a backend controller: receive data, emit events. `useI18n()` provides translations via Vue's dependency injection — no prop drilling required.

### 4.3 `<style scoped>`: Styles Cannot Leak

```vue
<style scoped>
.gambit-row {
  display: flex;
  align-items: center;
  padding: 10px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--glass-border);
  border-radius: 6px;
  margin-bottom: 8px;
}

.gambit-row--disabled {
  opacity: 0.5;
}

.gambit-idx {
  width: 30px;
  text-align: center;
  color: var(--text-muted);
  font-weight: bold;
}
</style>
```

Vue automatically scopes these styles to this component. A `.btn` class in `GambitRow.vue` will not conflict with a `.btn` in `Button.vue`.

### 4.4 Two-Tier Component Architecture

Not all components are equal. We distinguish between **primitives** (reusable UI elements) and **features** (domain-specific components).

| Tier | Location | Access Pattern | Example |
|------|----------|---------------|---------|
| **Primitives** | `components/` | Props + Emits only. No composables. | `Button.vue`, `ModalFrame.vue`, `ResourceBar.vue` |
| **Features** | `features/<domain>/` | Props + Emits + Composables | `GambitRow.vue`, `TrainingGrounds.vue`, `HeroDetail.vue` |

**Primitives** are pure. They know nothing about the game. A `Button.vue` receives a `label` and emits `@click`. It does not import `useI18n()` or `useEngine()`.

**Features** use composables for cross-cutting concerns. They receive presentation data via props and emit UI events to parents. They access the adapter and i18n through composables — not by importing the engine directly.

```vue
<!-- Parent (Page) -->
<template>
  <GambitRow
    v-for="(gambit, index) in gambits"
    :key="gambit.id"
    :gambit="gambit"
    :index="index"
    :total-count="gambits.length"
    @move="handleMove"
    @toggle="handleToggle"
    @remove="handleRemove"
  />
</template>
```

The child knows nothing about how `handleMove` works. The parent knows nothing about how `GambitRow` renders. The composable (`useI18n()`) provides translations without prop drilling. This is true separation of concerns.

### 4.5 Application Shell Architecture

The application has three layers: **Shell → Page → [Tab] → Component → Overlay**

#### Layer 1: App Shell (`App.vue`)

The shell is always visible. It contains:
- **`TopBar.vue`** — brand, day cycle, next-day button, codex/chronicle buttons, resource stats (gold, villagers, wood)
- **`MainContent`** — a `<component :is="currentPage">` that renders the active page
- **`FooterNav.vue`** — 4 category buttons: village, heroes, adventure, town

```vue
<!-- App.vue -->
<template>
  <div class="app-shell">
    <TopBar />
    
    <main class="main-content">
      <component :is="currentPage" />
    </main>
    
    <FooterNav 
      :current="currentCategory" 
      @navigate="navigateTo" 
    />
    
    <!-- Global overlays: combat survives page navigation -->
    <CombatOverlay v-if="combatActive" @close="combatActive = false" />
    
    <!-- Toast notifications -->
    <ToastContainer />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import TopBar from './components/TopBar.vue'
import FooterNav from './components/FooterNav.vue'
import VillagePage from './features/village/VillagePage.vue'
import HeroesPage from './features/heroes/HeroesPage.vue'
import AdventurePage from './features/adventure/AdventurePage.vue'
import TownPage from './features/town/TownPage.vue'
import CombatOverlay from './features/combat/CombatOverlay.vue'
import ToastContainer from './components/ToastContainer.vue'

const currentCategory = ref('village')
const combatActive = ref(false)

const pages = {
  village: VillagePage,
  heroes: HeroesPage,
  adventure: AdventurePage,
  town: TownPage
}

const currentPage = computed(() => pages[currentCategory.value])

function navigateTo(category) {
  currentCategory.value = category
}
</script>
```

#### Layer 2: Pages

Pages render into `MainContent`. Each page is a full-screen domain view.

| Nav Category | Page | File |
|-------------|------|------|
| village | VillagePage | `features/village/VillagePage.vue` |
| heroes | HeroesPage | `features/heroes/HeroesPage.vue` |
| adventure | AdventurePage | `features/adventure/AdventurePage.vue` |
| town | TownPage | `features/town/TownPage.vue` |

#### Layer 3: Tab Groups

Some pages contain **tabs** — sub-views that share the same nav category but display different content. Tabs are NOT separate pages; they are child components within a page.

**`TownPage.vue`** — aggregates town-related sub-pages:
```vue
<template>
  <div class="town-page">
    <TabNav 
      :tabs="[
        { id: 'buildings', label: t('shared_uxelm_nav_buildings'), icon: '🏗️' },
        { id: 'shop', label: t('shared_uxelm_nav_shop'), icon: '🏪' },
        { id: 'forge', label: t('shared_uxelm_nav_forge'), icon: '⚒️' },
        { id: 'inventory', label: t('shared_uxelm_nav_inventory'), icon: '🎒' }
      ]"
      v-model="currentTab"
    />
    <component :is="tabs[currentTab]" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import TabNav from '@/components/TabNav.vue'
import BuildingsTab from './components/BuildingsTab.vue'
import ShopTab from './components/ShopTab.vue'
import ForgeTab from './components/ForgeTab.vue'
import InventoryTab from './components/InventoryTab.vue'

const { t } = useI18n()
const currentTab = ref('buildings')

const tabs = {
  buildings: BuildingsTab,
  shop: ShopTab,
  forge: ForgeTab,
  inventory: InventoryTab
}
</script>
```

**`AdventurePage.vue`** — same pattern for explore/bestiary/codex/chronicle.

**Rules for tabs:**
- Tabs are child components within a page, not separate pages
- Each tab has its own `.vue` file in `features/<domain>/components/`
- Tab state (which tab is active) lives in the parent page, not the shell
- The footer nav does not know about tabs — it only knows the 4 categories

#### Layer 4: Components

Standard feature components that render inside pages or tabs. See §4.1-4.4.

#### Layer 5: Overlays

Overlays render **on top of the entire app shell**. There are two kinds:

| Kind | Location | Survives Page Switch? | Examples |
|------|----------|----------------------|----------|
| **Page-level overlays** | Inside the page component (`v-if`) | ❌ No | HeroSkillsModal, EquipmentModal, TrainerModal |
| **Global overlays** | Inside `App.vue` (`v-if`) | ✅ Yes | CombatOverlay, ToastContainer |

**Why the distinction?** Combat continues even if the player switches to the Village or Heroes tab. A combat overlay managed inside `ExplorePage.vue` would be destroyed on navigation. Global overlays live in `App.vue` and survive page switches.

Overlays are split into two concepts: **containers** (primitives) and **content** (feature components).

##### Overlay Containers (Primitives)

| Container | Scope | Purpose |
|-----------|-------|---------|
| **`ModalFrame.vue`** | Partial, centered (~600px max-width) | Shell for dialogs, confirmations, detail panes |
| **`FullViewOverlay.vue`** | Full-screen takeover | Shell for complex editors that need full focus |

These are empty shells. They provide the backdrop, header, close button, and scrollable content area. They know nothing about the game.

##### Overlay Content (Feature Components)

The actual UI inside the container lives in `features/<domain>/components/modals/`:

| Content Component | Container | Parent | Survives Switch | What It Does |
|-------------------|-----------|--------|----------------|--------------|
| `HeroSkillsModal.vue` | `ModalFrame` | `HeroesPage` | ❌ | Shows skill trees, allows learning families |
| `EquipmentModal.vue` | `ModalFrame` | `HeroesPage` | ❌ | Shows equipment slots, allows equipping/unequipping |
| `TrainerModal.vue` | `ModalFrame` | `HeroesPage` | ❌ | Shows trainer dialogue |
| `WitchModal.vue` | `ModalFrame` | `HeroesPage` | ❌ | Shows witch prophecy |
| `GambitEditor.vue` | `FullViewOverlay` | `HeroesPage` | ❌ | Full gambit rule editor |
| `MagicCircleEditor.vue` | `FullViewOverlay` | `HeroesPage` | ❌ | Full magic circle designer |
| `CombatOverlay.vue` | `FullViewOverlay` | **`App.vue`** | ✅ | Live combat display, action buttons, log |
| `CombatLogOverlay.vue` | `FullViewOverlay` | `ExplorePage` | ❌ | Post-combat replay / analysis |

**Rule:** The content component is a normal feature component. It receives props, emits events, uses composables. The only difference is that it renders inside a container.

**Global overlays in `App.vue`:**

```vue
<!-- App.vue — global overlays survive page navigation -->
<template>
  <div class="app-shell">
    <TopBar />
    <main class="main-content">
      <component :is="currentPage" />
    </main>
    <FooterNav ... />
    
    <!-- Combat is global: it continues when player switches tabs -->
    <CombatOverlay 
      v-if="combatActive" 
      :combat="gameState.combat"
      @close="combatActive = false" 
    />
  </div>
</template>
```

Alternatively, global overlays can use Vue's `<Teleport to="body">` to escape the page component tree and render at the document root, ensuring they are never unmounted by page switches. This is useful if the overlay is triggered deep inside a page component but must survive navigation:

```vue
<!-- Inside ExplorePage.vue — combat triggered here, but teleports to body -->
<template>
  <div class="explore-page">
    <!-- page content... -->
    <Teleport to="body">
      <CombatOverlay v-if="combatActive" ... />
    </Teleport>
  </div>
</template>
```

Both patterns are valid. `App.vue`-level is preferred for overlays that are logically global. `<Teleport>` is preferred when a page component owns the trigger state but the overlay must escape the page tree.

```vue
<!-- HeroSkillsModal.vue — Content component inside ModalFrame -->
<template>
  <ModalFrame title="Skills" @close="$emit('close')">
    <SkillTree :hero="hero" @learn="$emit('learn', $event)" />
    <FamilyList :families="availableFamilies" @select="$emit('learnFamily', $event)" />
  </ModalFrame>
</template>

<script setup>
import { useI18n } from '@/core/composables/useI18n.js'
import ModalFrame from '@/components/ModalFrame.vue'
import SkillTree from './SkillTree.vue'
import FamilyList from './FamilyList.vue'

const { t } = useI18n()
defineProps({ hero: Object })
defineEmits(['close', 'learn', 'learnFamily'])
</script>
```

```vue
<!-- HeroesPage.vue — Opens the modal -->
<template>
  <div class="heroes-page">
    <HeroDetail :hero="selectedHero">
      <button @click="showSkills = true">⚔️ {{ t('heroes_uxelm_skills') }}</button>
      <button @click="showGambits = true">🎲 {{ t('gambit_uxelm_title') }}</button>
    </HeroDetail>
    
    <!-- Modal content renders inside ModalFrame container -->
    <HeroSkillsModal 
      v-if="showSkills" 
      :hero="selectedHero"
      @close="showSkills = false"
      @learnFamily="handleLearnFamily"
    />
    
    <!-- Gambit editor renders inside FullViewOverlay container -->
    <GambitEditor 
      v-if="showGambits" 
      :hero="selectedHero"
      @close="showGambits = false"
    />
  </div>
</template>
```

**Key distinction:**
- **Page switch** → footer nav changes, `currentCategory` updates
- **Tab switch** → page-internal state changes, footer nav unchanged
- **Modal open** → `ModalFrame` renders on top, footer nav unchanged, page unchanged
- **FullView open** → `FullViewOverlay` renders on top, footer nav unchanged, page unchanged

**Why separate container from content?**
- Reuse: 10 different modals all use `ModalFrame` — one shell, many contents
- Testability: Test `HeroSkillsModal` in isolation without mounting the full overlay shell
- Flexibility: A content component can change containers (e.g., move from `ModalFrame` to `FullViewOverlay` without rewriting the content)

#### Summary of All Visual Elements

| Element | Type | Renders Into | Controlled By |
|---------|------|-------------|---------------|
| TopBar | Shell component | Fixed at top | `App.vue` |
| FooterNav | Shell component | Fixed at bottom | `App.vue` |
| MainContent | Shell slot | Between top and footer | `App.vue` (via `currentPage`) |
| Page (Village/Heroes/Adventure/Town) | Feature page | MainContent | FooterNav → `currentCategory` |
| Tab (Buildings/Shop/Forge/Inventory) | Feature component | Inside TownPage | TabNav → `currentTab` |
| Component (HeroList, GambitRow) | Feature component | Inside pages/tabs | Parent page/tab |
| ModalFrame | Overlay primitive | Fixed, z-index above shell | Parent component state |
| FullViewOverlay | Overlay primitive | Fixed, z-index above shell | Parent component state |

### 4.6 Composables: The Boundary Layer

Composables are functions that wrap engine services and provide them to feature components via Vue's `provide/inject` system. They are the **only** layer that knows about the engine.

```js
// ux/core/composables/useI18n.js
import { inject } from 'vue'

export function useI18n() {
  const i18n = inject('i18n')
  const currentLanguage = inject('currentLanguage')
  
  if (!i18n) throw new Error('useI18n() called outside of app with i18n provider')
  
  return {
    // Access currentLanguage.value to establish reactive dependency.
    // When language changes, all templates calling t() re-render.
    t: (key, params) => {
      currentLanguage?.value // reactive dependency
      return i18n.t(key, params)
    },
    setLanguage: (lang) => {
      i18n.setLanguage(lang)
      if (currentLanguage) currentLanguage.value = lang
    },
    currentLanguage
  }
}
```

```js
// ux/core/composables/useGameState.js
import { inject } from 'vue'

export function useGameState() {
  const gameState = inject('gameState')
  if (!gameState) throw new Error('useGameState() called outside of app with gameState provider')
  
  return { gameState }
}

// Future evolution: common selectors to prevent repetition in components
// export function useHeroes() {
//   const { gameState } = useGameState()
//   return computed(() => gameState.value.heroes || [])
// }
// export function useVillage() {
//   const { gameState } = useGameState()
//   return computed(() => gameState.value.village || {})
// }
```

**Rules for composables:**
- They live in `core/composables/`
- They use `inject()` to access services provided at app level
- They expose only the methods/data that components need
- They do not expose the raw engine or adapter objects
- Primitives (`components/`) must NOT use composables
- Features (`features/`) MAY use composables

---

## 5. Directory Structure

```
ux/
├── main.js                  # Vue app bootstrap + engine wiring
├── App.vue                  # Root shell (nav, global overlays, router)
├── core/
│   ├── composables/         # Reusable Vue composables (useEngine, useI18n)
│   ├── theme.css            # Design tokens: colors, fonts, spacing variables
│   └── utilities.js         # Shared helpers (not component-specific)
├── components/              # Shared UI primitives (domain-agnostic)
│   ├── TopBar.vue              # Game header: brand, day, next-day, stats
│   ├── FooterNav.vue           # Bottom nav: 4 categories
│   ├── TabNav.vue              # Horizontal tabs for TownPage/AdventurePage
│   ├── Button.vue
│   ├── CloseButton.vue         # Emits @close. Parent decides what "close" means.
│   ├── ModalFrame.vue          # Partial overlay shell (trainer dialogue, skill details)
│   ├── FullViewOverlay.vue     # Full-page overlay shell (magic circle, gambit editor)
│   ├── ResourceBar.vue
│   └── Icon.vue
├── features/                # Domain-specific pages and components
│   ├── heroes/
│   │   ├── HeroesPage.vue         # Page composer: thin, mounts sub-components
│   │   └── components/
│   │       ├── HeroList.vue
│   │       ├── HeroDetail.vue
│   │       ├── HeroMiniCard.vue
│   │       ├── TrainingGrounds.vue
│   │       ├── StatGrid.vue
│   │       └── modals/
│   │           ├── TrainerModal.vue
│   │           ├── WitchModal.vue
│   │           ├── EquipmentModal.vue
│   │           └── HeroSkillsModal.vue
│   ├── combat/
│   │   ├── CombatPage.vue
│   │   └── components/
│   │       ├── CombatHeader.vue
│   │       ├── CombatActorGrid.vue
│   │       ├── CombatActionPanel.vue
│   │       ├── CombatLogConsole.vue
│   │       └── CombatResolutionPane.vue
│   ├── gambit/
│   │   ├── GambitEditor.vue       # Replaces GambitView.js (962 lines)
│   │   └── components/
│   │       ├── GambitList.vue
│   │       ├── GambitRow.vue
│   │       ├── GambitForm.vue
│   │       ├── GambitFallbackRow.vue
│   │       └── GambitTestSetup.vue
│   ├── village/
│   │   └── VillagePage.vue
│   ├── town/
│   │   ├── TownPage.vue
│   │   └── components/
│   │       ├── BuildingsTab.vue
│   │       ├── ShopTab.vue
│   │       ├── ForgeTab.vue
│   │       └── InventoryTab.vue
│   ├── adventure/
│   │   ├── AdventurePage.vue
│   │   └── components/
│   │       ├── ExploreTab.vue
│   │       ├── BestiaryTab.vue
│   │       ├── CodexTab.vue
│   │       └── ChronicleTab.vue
│   ├── saveSlots/
│   │   └── SaveSlotPage.vue
│   └── settings/
│       └── SettingsPage.vue
└── adapters/
    └── EngineAdapter.js     # Thin generic action dispatcher
```

**Rules:**
- A `.vue` file represents **one UI concern**. If it exceeds 250 lines of `<script setup>` + `<template>` combined, split it into sub-components.
- Pages live at `features/<domain>/<Domain>Page.vue`. They are thin composers. They do not contain business logic.
- Modals are components in `features/<domain>/components/modals/`. They are not global singletons.

---

## 6. State Management Pattern

### 6.1 The Old Pattern (Broken)

```js
// Current: UIController pushes entire global state
update(state) {
    this.combatView.update(state);      // CombatView extracts what it needs
    this.activeView.update(state);       // Every view receives everything
}
```

Every view knows the shape of global state. Every view must diff internally. Every view re-renders on every tick.

### 6.2 The New Pattern (Vue Reactivity)

The Vue app holds reactive state. Components subscribe to slices via props or composables. Vue's reactivity system handles diffing automatically.

**Critical decision: `shallowRef()` over `ref()`**

```js
// ux/main.js — app bootstrap
import { createApp, shallowRef, ref } from 'vue'
import App from './App.vue'
import { createEngineAdapter } from './adapters/EngineAdapter.js'

export function createVueApp({ engine, container }) {
  // shallowRef: only the top-level object is reactive. 
  // Nested properties are NOT proxied. This is correct because:
  // 1. We replace the entire object on each tick, not mutate nested props
  // 2. Deep reactivity would create thousands of proxies per frame
  // 3. Computed slices re-evaluate when the ref is replaced, which is what we want
  const gameState = shallowRef(engine.update())
  
  // Reactive language ref for i18n re-renders
  const currentLanguage = ref(engine.i18n.getCurrentLanguage?.() || 'en')
  
  // Adapter: engine mutations update reactive state
  const adapter = createEngineAdapter(engine, gameState)
  
  const app = createApp(App)
  
  // Provide services to all components via composables
  app.provide('engine', engine)
  app.provide('gameState', gameState)
  app.provide('adapter', adapter)
  app.provide('i18n', engine.i18n)
  app.provide('currentLanguage', currentLanguage)
  
  // Global error handler — catches uncaught errors in any component
  app.config.errorHandler = (err, instance, info) => {
    console.error('Global Vue error:', err, info)
    // Show toast notification via engine or dedicated toast system
  }
  
  app.mount(container)
  
  // Start throttled game loop (10 FPS, same as current UI)
  startGameLoop(engine, gameState)
  
  return app
}
```

```vue
<!-- HeroesPage.vue — subscribes to heroes slice -->
<script setup>
import { computed, ref } from 'vue'
import { useGameState } from '@/core/composables/useGameState.js'
import { useAdapter } from '@/core/composables/useAdapter.js'
import HeroList from './components/HeroList.vue'
import HeroDetail from './components/HeroDetail.vue'

const { gameState } = useGameState()
const { dispatch } = useAdapter()

const heroes = computed(() => gameState.value.heroes || [])
const infrastructure = computed(() => gameState.value.village?.infrastructure || {})
const selectedHeroId = ref(null)

const selectedHero = computed(() => 
  heroes.value.find(h => h.id === selectedHeroId.value)
)

function handleHeroAction(action, payload) {
  dispatch('hero', action, payload)
}
</script>

<template>
  <div class="heroes-page">
    <aside class="heroes-page__sidebar">
      <HeroList 
        :heroes="heroes" 
        :selected-id="selectedHeroId"
        @select="selectedHeroId = $event"
      />
    </aside>
    <main class="heroes-page__detail">
      <HeroDetail 
        v-if="selectedHero"
        :hero="selectedHero"
        :infrastructure="infrastructure"
        @action="handleHeroAction"
      />
      <EmptyState v-else />
    </main>
  </div>
</template>
```

Vue's reactivity system means:
- `HeroList` re-renders only when `heroes` changes (which happens when `gameState` is replaced)
- `HeroDetail` re-renders only when `selectedHero` changes
- No manual diffing. No `lastRenderedState` JSON comparison. No `diffList`.
- Pages and features access state via composables, not through prop chains.

**Why `shallowRef()` not `ref()`?**

| Concern | `ref()` (deep) | `shallowRef()` |
|---------|---------------|----------------|
| Proxy creation | Thousands per frame (recursive) | One per frame |
| Memory pressure | High — retains proxies for nested objects | Low — only top-level reference |
| Computed re-evaluation | Same — both trigger on replacement | Same — both trigger on replacement |
| Nested mutation tracking | Unnecessary — state is immutable snapshots | Correct — we don't mutate nested props |

The game state is an **immutable snapshot** (replace the whole object, never mutate nested props). `shallowRef()` is the correct tool for this pattern.

**Dev mode guard:**

```js
// In development, freeze state snapshots to catch accidental mutations
const rawState = engine.update()
const gameState = shallowRef(
  process.env.NODE_ENV === 'development' ? Object.freeze(rawState) : rawState
)
```

If a component accidentally mutates `gameState.value.heroes[0].name = 'foo'`, the frozen object throws immediately in dev.

### 6.3 Game Loop Integration

The game loop must **not** call `engine.update()` at 60 FPS. The current UI updates at **10 FPS (100ms)** — this throttle exists precisely because `engine.update()` is not idempotent. It may advance internal timers, process queued events, or trigger side effects.

**Correct loop (throttled):**

```js
// ux/main.js — throttled game loop
const GAME_LOOP_INTERVAL = 100 // 10 FPS, matching current UI rate

function startGameLoop(engine, gameState) {
  let lastUpdate = 0
  
  function tick(timestamp) {
    if (timestamp - lastUpdate >= GAME_LOOP_INTERVAL) {
      gameState.value = engine.update()
      lastUpdate = timestamp
    }
    requestAnimationFrame(tick)
  }
  
  requestAnimationFrame(tick)
}

// Alternative: setInterval (simpler, slightly less precise)
// setInterval(() => { gameState.value = engine.update() }, GAME_LOOP_INTERVAL)
```

**Why throttled `requestAnimationFrame` over `setInterval`?**
- `requestAnimationFrame` pauses in background tabs (battery friendly)
- It syncs to the display refresh rate, avoiding unnecessary work
- The throttle ensures `engine.update()` is never called faster than 10 FPS

**Is `engine.update()` idempotent?**

No. Calling `engine.update()` advances the game simulation. Calling it twice in quick succession may:
- Process the same event queue twice
- Advance timers by double the intended amount
- Trigger duplicate side effects

The throttle is not an optimization — it is a **correctness requirement**.

### 6.4 Legacy View Interop (Coexistence During Migration)

The migration roadmap specifies a **single cutover** in Phase 4. However, during Phase 3 development, developers need to verify Vue components against real engine behavior. A coexistence bridge enables this without committing to a partial switch.

**Pattern: Legacy View Mount Point**

A Vue page can host a legacy vanilla view in a dedicated mount point:

```vue
<!-- HybridPage.vue — Vue shell with legacy view inside -->
<template>
  <div class="hybrid-page">
    <h2>{{ t('heroes_uxelm_title') }}</h2>
    
    <!-- Vue components for the migrated parts -->
    <HeroList :heroes="heroes" @select="onSelect" />
    
    <!-- Legacy view mounts here during transition -->
    <div ref="legacyMount" class="legacy-mount"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import { useGameState } from '@/core/composables/useGameState.js'
import HeroList from './components/HeroList.vue'

const { t } = useI18n()
const { gameState } = useGameState()
const legacyMount = ref(null)
let legacyView = null

onMounted(() => {
  // Mount legacy view into the Vue-managed div
  // This is for development/verification only, not production
  legacyView = new LegacyHeroDetailView()
  legacyView.mount(legacyMount.value)
})

onUnmounted(() => {
  legacyView?.destroy()
})
</script>
```

**Event bridging:**

Legacy views that emit events through the old `EventEmitter` pattern can be bridged to Vue's `emit` system:

```js
// Bridge: legacy event → Vue emit
function bridgeLegacyEvents(legacyView, emit) {
  legacyView.on('action', (action, payload) => {
    emit('legacyAction', { action, payload })
  })
}
```

**Game loop ownership:**

- **Before switch (Phases 0–3):** The old `EngineAdapter.startLoop()` owns the loop. Vue components in `test-vue.html` receive mock/static state.
- **On switch day (Phase 4):** `ux/main.js` takes ownership. The old loop is stopped. Vue's throttled loop begins.
- **No dual loops.** Only one loop runs at a time. The transition is atomic.

**When to use the bridge:**
- During Phase 3, to compare Vue component behavior against the legacy view side-by-side
- For debugging: if a Vue component behaves differently, mount the legacy view next to it
- **Not for production.** The bridge is a development aid. Phase 4 removes all legacy views.

---

## 7. Event & Adapter Contract

### 7.1 Component → Adapter

Feature components emit semantic actions. The page composer forwards to the adapter:

```vue
<!-- TrainingGrounds.vue — uses composables internally -->
<script setup>
import { useI18n } from '@/core/composables/useI18n.js'

const { t } = useI18n()

defineProps({ hero: Object, infrastructure: Object })
defineEmits(['action'])
</script>

<template>
  <button @click="$emit('action', { type: 'openTrainer', heroId: hero.id })">
    💪 {{ t('trainer_uxelm_title') }}
  </button>
</template>
```

The parent page forwards to the adapter:

```vue
<!-- HeroesPage.vue -->
<script setup>
import { useAdapter } from '@/core/composables/useAdapter.js'

const { dispatch } = useAdapter()
</script>

<template>
  <TrainingGrounds 
    :hero="selectedHero"
    :infrastructure="infrastructure"
    @action="dispatch('hero', $event.type, $event)"
  />
</template>
```

### 7.2 Adapter → Engine

The adapter uses a **lookup table** to route actions to specific engine methods. This avoids adding a generic `dispatch()` method to the engine (which doesn't exist) and keeps the engine untouched during migration.

```js
// ux/adapters/EngineAdapter.js
const ACTION_MAP = {
  hero: {
    recruitHero: (engine) => engine.recruitHero(),
    increaseStat: (engine, p) => engine.increaseHeroStat(p.heroId, p.statId),
    equipItem: (engine, p) => engine.equipHeroItem(p.heroId, p.slot, p.itemId),
    addGambit: (engine, p) => engine.addHeroGambit(p.heroId, p.gambit),
    moveGambit: (engine, p) => engine.moveHeroGambit(p.heroId, p.gambitId, p.direction),
    removeGambit: (engine, p) => engine.removeHeroGambit(p.heroId, p.gambitId),
    toggleGambit: (engine, p) => engine.toggleHeroGambit(p.heroId, p.gambitId),
    updateFallbackAction: (engine, p) => engine.updateHeroFallbackAction(p.heroId, p.action),
    testGambits: (engine, p) => engine.testHeroGambits(p.heroId, p.enemies),
    suggestPreset: (engine, p) => engine.suggestHeroGambitPreset(p.heroId),
    useConsumable: (engine, p) => engine.useHeroConsumable(p.heroId, p.consumableId),
    learnFamily: (engine, p) => engine.learnHeroFamily(p.heroId, p.familyId),
    inscribeSpell: (engine, p) => engine.inscribeHeroSpell(p.heroId, p.spell),
    inscribeBodyCircle: (engine, p) => engine.inscribeHeroBodyCircle(p.heroId, p.glyphIds, p.glyphTiers),
  },
  village: {
    setWorkerRole: (engine, p) => engine.setWorkerRole(p.role, p.delta),
    assignDefense: (engine, p) => engine.assignDefense(p.heroId),
    unassignDefense: (engine, p) => engine.unassignDefense(p.heroId),
  },
  buildings: {
    startProject: (engine, p) => engine.startProject(p.buildingId, p.targetLevel, p.costGold, p.costMaterials, p.duration),
  },
  explore: {
    assignExpedition: (engine, p) => engine.assignExpedition(p.expId, p.heroIds),
    retireExpedition: (engine, p) => engine.retireExpedition(p.expId),
  },
  shop: {
    buyItem: (engine, p) => engine.buyItem(p.itemData, p.costGold),
    sellItem: (engine, p) => engine.sellItem(p.itemId, p.itemType, p.sellPrice),
    sellResource: (engine, p) => engine.sellResource(p.resourceId, p.quantity),
  },
  inventory: {
    cookMeal: (engine, p) => engine.cookMeal(p.recipeId),
    consumeMeal: (engine, p) => engine.consumeMeal(p.mealId),
    useGlyphTablet: (engine, p) => engine.useGlyphTablet(p.heroId, p.tabletId),
  },
  forge: {
    refineItem: (engine, p) => engine.refineEquipment(p.itemId),
  },
  settings: {
    devCheatActivate: (engine) => engine.activateDeveloperCheat(),
  }
}

export function createEngineAdapter(engine, gameStateRef) {
  function showToast(message) {
    // Toast display logic
  }
  
  return {
    dispatch(domain, action, payload) {
      const handler = ACTION_MAP[domain]?.[action]
      if (!handler) {
        console.error(`Unknown action: ${domain}.${action}`)
        return { success: false, error: 'action_unknown' }
      }
      
      const result = handler(engine, payload)
      if (!result.success) {
        showToast(engine.i18n.t(result.error))
      }
      
      // Force a state snapshot after the action — matches legacy forceUpdate() behavior.
      // engine.update() is non-idempotent (see §6.3), but this is correct here:
      // the action just mutated engine state, and we need Vue to see the change
      // immediately (not wait for the next 100ms loop tick).
      gameStateRef.value = engine.update()
      
      return result
    }
  }
}
```

**Why a lookup table?**
- The engine does not have a generic `dispatchDomainAction()` method.
- The lookup table lives in the adapter, not the engine. Zero engine changes.
- Each mapping is a one-line delegation. Readable. Auditable.
- Adding a new action requires one line in this table.

**Known limitation: `GameEngine.js` is a 1,339-line façade.**

The adapter domain keys (`hero`, `village`, `shop`, etc.) are a pragmatic mapping to `GameEngine.js` methods. In the future, if the engine is refactored into service boundaries (e.g., `HeroService.js`, `VillageService.js`), the adapter domain keys should map 1:1 to those boundaries. Until then, the lookup table is the thinnest possible abstraction over the existing API surface.

**Rule:** Adapter domain keys must map 1:1 to conceptual service boundaries. Do not create overlapping domains (e.g., `heroTraining` and `heroStats` — both belong under `hero`).

### 7.3 Benefits

1. **Components are engine-agnostic.** Primitives are pure. Features use composables that abstract the engine.
2. **No prop drilling.** `useI18n()`, `useGameState()`, `useAdapter()` provide cross-cutting concerns via injection.
3. **The adapter is the single translation layer.** Change engine APIs → edit one file.
4. **New features require no adapter changes** if they use existing action types.

---

## 8. CSS Strategy

### 8.1 Scoped Styles by Default

Every `.vue` component uses `<style scoped>`. Class names do not need BEM prefixes because Vue scopes them automatically.

```vue
<style scoped>
.btn {
  padding: 8px 12px;
  border-radius: var(--radius-md);
}
</style>
```

Vue compiles this to `.btn[data-v-f3f3eg9]` — scoped to this component only. A `.btn` in `Button.vue` will not conflict with a `.btn` in `GambitRow.vue`.

**There is no CSS migration.** Old `css/` is frozen and deleted in Phase 4. Each new component writes its own scoped CSS from scratch in its `.vue` file. If a style is needed, it is written when the component is built.

### 8.2 Design Tokens (Global)

Only `theme.css` is global. It contains CSS custom properties (variables), not class rules:

```css
/* ux/core/theme.css */
:root {
  --color-primary: #6366f1;
  --color-danger: #ff6b6b;
  --color-success: #10ac84;
  --font-heading: 'Outfit', sans-serif;
  --font-body: 'Inter', sans-serif;
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --radius-md: 6px;
  --radius-lg: 12px;
  --glass-border: rgba(255, 255, 255, 0.1);
}
```

Components import these tokens via `var(--token-name)`. No component defines raw colors or fonts.

### 8.3 No Inline Styles

Vue templates should not use `:style` except for truly dynamic values (e.g., `:style="{ width: progress + '%' }"`). All static styling lives in `<style scoped>`.

---

## 9. Code Sample: Before vs. After

### Before: GambitRow (imperative, inside 962-line GambitView.js)

```js
createGambitRow(g, idx, totalCount, t, onMove, onToggle, onRemove) {
    return el('div', {
        class: ['gambit-row-v1', g.enabled === false ? 'gambit-disabled' : ''],
        style: { display: 'flex', alignItems: 'center', padding: '10px', ... }
    }, [
        el('div', { class: 'gambit-idx', style: { width: '30px', ... } }, String(idx + 1)),
        el('div', { class: 'gambit-content', style: { flex: '1' } }, [
            el('div', { class: 'gambit-rule-text' }, [
                GambitView.formatGambitRule(g, t)
            ])
        ]),
        el('div', { class: 'gambit-actions', style: { display: 'flex', gap: '6px' } }, [
            el('button', { 
                class: 'btn btn-sm btn-secondary btn-move-gambit',
                disabled: idx === 0,
                onClick: (e) => { e.stopPropagation(); onMove(g.id, -1); }
            }, '▲'),
            // ... 3 more buttons
        ])
    ]);
}
```

**Problems:**
- Inaccessible outside `GambitView`
- Structure buried in JavaScript
- Inline styles mixed with logic
- No visual correlation

### After: GambitRow.vue (declarative, standalone)

```vue
<template>
  <div class="gambit-row" :class="{ 'gambit-row--disabled': !gambit.enabled }">
    <div class="gambit-idx">{{ index + 1 }}</div>
    <div class="gambit-content">
      <GambitRuleText :gambit="gambit" />
    </div>
    <div class="gambit-actions">
      <button 
        class="btn btn-move-up" 
        :disabled="index === 0"
        @click="$emit('move', gambit.id, -1)"
      >▲</button>
      <button 
        class="btn btn-move-down" 
        :disabled="index === totalCount - 1"
        @click="$emit('move', gambit.id, 1)"
      >▼</button>
      <button class="btn btn-toggle" @click="$emit('toggle', gambit.id)">
        {{ gambit.enabled ? t('gambit_uxelm_disable') : t('gambit_uxelm_enable') }}
      </button>
      <button class="btn btn-remove" @click="$emit('remove', gambit.id)">×</button>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from '@/core/composables/useI18n.js'
import GambitRuleText from './GambitRuleText.vue'

const { t } = useI18n()

defineProps({
  gambit: { type: Object, required: true },
  index: { type: Number, required: true },
  totalCount: { type: Number, required: true }
})

defineEmits(['move', 'toggle', 'remove'])
</script>

<style scoped>
.gambit-row {
  display: flex;
  align-items: center;
  padding: 10px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--glass-border);
  border-radius: 6px;
  margin-bottom: 8px;
}

.gambit-row--disabled {
  opacity: 0.5;
}

.gambit-idx {
  width: 30px;
  text-align: center;
  color: var(--text-muted);
  font-weight: bold;
}

.gambit-actions {
  display: flex;
  gap: 6px;
}

.btn-move-up:disabled,
.btn-move-down:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
</style>
```

**Improvements:**
- Importable anywhere
- HTML is visible and mappable to the screen
- Scoped styles, no naming collisions
- Logic is just props and emits
- Testable in isolation

---

## 10. Principles for All Future Migrations

Any implementation plan derived from this initiative must follow these rules:

1. **One Concern Per File.** If a `.vue` file exceeds 250 lines (template + script + style combined), split it into sub-components. **Exception:** Templates may exceed 250 lines if they are pure layout with no logic — extract sub-components for logic, not for line count.

2. **No God Views.** Views over 400 lines are banned. Decompose into pages + components.

3. **Primitives: Props Only.** Components in `components/` receive data via `defineProps` and emit via `defineEmits`. They never use composables.

4. **Features: Props + Composables.** Components in `features/` receive presentation data via `defineProps` and emit UI events via `defineEmits`. They MAY use composables (`useI18n()`, `useAdapter()`, `useGameState()`) for cross-cutting concerns. They never import the raw engine.

   **Clarification on `useI18n()` in leaf components:** `GambitRow.vue` is a leaf component (no children) that uses `useI18n()` because it needs to translate button labels. This is correct — leaf components that display text need translations. A leaf component that displays only icons or colors does not. The rule is: **if a component displays text, it either receives translated strings via props OR uses `useI18n()`**. Prefer `useI18n()` to avoid prop drilling `t` through 5 layers.

5. **Scoped Styles by Default.** Every component uses `<style scoped>`. Global styles are forbidden except for design tokens in `theme.css`.

6. **No Inline Styles.** Dynamic `:style` is allowed only for values that change at runtime (progress bars, positioning). All static styling lives in `<style scoped>`.

7. **No Cross-Domain Imports.** A component in `features/heroes/` must not import a component from `features/combat/`. Shared primitives live in `components/`. Domain-shared sub-components live in `features/<domain>/components/`.

8. **Preserve i18n Keys.** Do not rename or delete translation keys during migration unless explicitly required. Use `useI18n()` composable — never pass `t` as a prop.

9. **Test Components in Isolation.** Every component must be testable with mock props and mocked emits. No component test should require instantiating the engine.

   **Testing pattern:** Use `@vue/test-utils` `mount()`. Mock composables by providing values at mount time:
   ```js
   const wrapper = mount(HeroList, {
     global: {
       provide: {
         gameState: shallowRef({ heroes: mockHeroes }),
         i18n: mockI18n
       }
     },
     props: { heroes: mockHeroes }
   })
   ```
   Test feature components with mock state objects. Test primitives with mock props and emitted events.

10. **Composables for Shared Logic.** If two components share logic (e.g., formatting a gambit rule), extract it to a composable in `core/composables/`, not a mixin or base class.

11. **Error Boundaries.** Every page-level component wraps its children in an `onErrorCaptured` boundary. `app.config.errorHandler` logs and shows a toast.
    ```vue
    <script setup>
    import { onErrorCaptured } from 'vue'
    
    onErrorCaptured((err, instance, info) => {
      console.error('Page error:', err, info)
      // Toast or fallback UI
      return false // prevent propagation to parent
    })
    </script>
    ```
    Global handler in `main.js`:
    ```js
    app.config.errorHandler = (err, instance, info) => {
      console.error('Global Vue error:', err, info)
      // Show toast notification
    }
    ```

12. **Accessibility (a11y).** All interactive elements must have accessible labels. Modal open/close must manage focus trapping. Use native `<button>` elements, not `<div>` click handlers. Support `Escape` key for closing overlays. Use `@keydown.escape="close"` in templates.

13. **No Router.** Navigation is in-memory only (`ref('village')`). There are no URLs, no browser history, no deep-linking. This is intentional — RPG Village is an Electron game.

---

## 11. What This Document Does NOT Cover

This is an **architectural vision**, not a work plan. The following are explicitly out of scope here and will be defined in separate implementation plans:

- **Migration order:** Which domain to componentize first
- **Phasing:** Whether to migrate incrementally or per domain
- **Specific file renames:** Exact source → destination mappings
- **Rollback procedures:** How to revert if a domain migration fails

**What IS covered here:** Testing strategy is defined in §10 (rules 9 and 11). See the companion [Migration Sequencing Roadmap](./migration_sequencing_roadmap.md) for high-level sequencing.

---

## 12. Summary

The presentation layer currently suffers from distributed monoliths: features scattered across files, views thousands of lines long, and HTML structure buried in imperative JavaScript.

The target architecture is **Vue 3 with `<script setup>` and `.vue` SFCs**: small, declarative, reusable components where HTML is the entry point, logic is plain variables and functions, and styles are scoped.

Pages are thin composers. The adapter is a thin translator. Vue's reactivity handles diffing. The developer experience is deterministic: open a folder, see the HTML, understand the screen.

This initiative mandates a **framework** not because frameworks are trendy, but because a long-term project deserves a proven foundation. Vue 3 is that foundation.

---

*Document Version: 2.1 (Vue 3 — Reviewed)*
*Created: 2026-06-05*
*Reviewed: 2026-06-05*
*Status: Ready for Implementation*
