# Tutorial System — Day 1 Guided Flow

## Overview

A **declarative, state-machine-driven tutorial engine** that teaches new players through the first day of gameplay. The system uses **spotlight overlays** (darken everything except a target element), **forced navigation**, and **modal locking** to guide the user through critical actions. The tutorial state is **persistent per save slot** — reloading mid-tutorial restores exactly where the player left off. The architecture is **extensible** so future feature unlocks (shop, tavern, magic circle, etc.) can trigger additional tutorials with zero engine changes.

---

## Goals

1. **Teach core mechanics** on Day 1: hero skills, stat assignment, expedition exploration, day advancement.
2. **Be persistent** — save slot stores tutorial state; reload resumes at exact step.
3. **Be non-intrusive when done** — completed tutorials never reappear.
4. **Be extensible** — new tutorials are declarative definitions, no engine changes needed.
5. **Be testable** — screenshot scripts can assert tutorial overlays, forced navigation, and step progression.

---

## 1. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │ Tutorial    │  │ Spotlight   │  │ ForcedNav   │  │ Tutorial    │    │
│  │ Overlay     │──│ Effect      │──│ Guard       │──│ Message     │    │
│  │ (Vue comp)  │  │ (CSS/JS)    │  │ (composable)│  │ (i18n key)  │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
│         │              │              │              │                    │
│         └──────────────┴──────────────┴──────────────┘                    │
│                         │                                                │
│                    ┌────┴────┐                                           │
│                    │ useGame   │                                           │
│                    │ State()   │── reactive gameState.tutorial            │
│                    └────┬────┘                                           │
└─────────────────────────┼───────────────────────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────────────────────┐
│                         │          ENGINE LAYER                          │
│                    ┌────┴────┐                                           │
│                    │ Tutorial│                                           │
│                    │ Service │                                           │
│                    │ (state) │                                           │
│                    └────┬────┘                                           │
│                         │                                                │
│    ┌────────────────────┼────────────────────┐                            │
│    │                    │                    │                            │
│ ┌──┴───┐           ┌────┴────┐        ┌────┴────┐                      │
│ │ Tutorial│           │ Tutorial│        │ Tutorial│                      │
│ │ Registry│           │ Step    │        │ Validator│                     │
│ │ (defs)  │           │ Runner  │        │ (checks) │                     │
│ └─────────┘           └─────────┘        └─────────┘                     │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────┐        │
│  │                      PERSISTENCE                             │        │
│  │  localStorage: `rpg_village_v1_slot{N}_tutorial_state`    │        │
│  └─────────────────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Files to Create

| File | Purpose |
|------|---------|
| `js/engine/tutorial/TutorialService.js` | Core engine service: state machine, step progression, persistence |
| `js/engine/tutorial/TutorialRegistry.js` | Declarative tutorial definitions (Day 1 flow + extensible slots) |
| `js/engine/tutorial/TutorialValidator.js` | Step completion validators (checks if user performed required action) |
| `js/engine/tutorial/TutorialTypes.js` | JSDoc types for tutorial definitions (zero runtime cost) |
| `ux/core/composables/useTutorial.js` | Vue composable: reactive tutorial state, spotlight helpers, navigation guards |
| `ux/core/components/TutorialOverlay.vue` | Root overlay component: darkens screen, renders spotlight, shows messages |
| `ux/core/components/TutorialSpotlight.vue` | Spotlight effect: computes target element bounds, clips the light hole |
| `js/engine/shared/core/i18n/translations/tutorial_*.js` | i18n keys for all tutorial text (4 languages) |
| `.dev_workflow/implementation_plans/4_tutorial.md` | This document |

---

## 3. Files to Modify

| File | Change |
|------|--------|
| `js/engine/GameEngine.js` | Instantiate `TutorialService`, expose tutorial state in `update()`, add `advanceTutorial()` / `skipTutorial()` facade methods |
| `ux/App.vue` | Mount `TutorialOverlay` at root level; pass `tutorial` state from `gameState`; guard footer navigation when tutorial locks tabs |
| `ux/main.js` | Add `tutorial` to reactive game state; provide tutorial service via injection |
| `ux/adapters/EngineAdapter.js` | Map `advanceTutorial`, `skipTutorial` engine methods to adapter actions |
| `ux/features/heroes/HeroesPage.vue` | Wire `useTutorial` to force-select Arthur, lock tab switching, detect skill learned |
| `ux/features/heroes/components/HeroActionBar.vue` | Detect tutorial spotlight on "Learn Skill" button; emit `tutorial-action` when skill is learned |
| `ux/features/heroes/components/HeroStatsGrid.vue` | Detect tutorial spotlight on stat assignment; emit `tutorial-action` when stat point spent |
| `ux/features/adventure/components/ExploreTab.vue` | Wire `useTutorial` to force expedition selection, detect first expedition |
| `ux/features/adventure/components/ExpeditionNode.vue` | Detect tutorial spotlight on first node; emit when node clicked |
| `ux/features/book/BookPage.vue` | Emit `book-first-closed` event when book is closed on Day 1 — triggers tutorial start |
| `js/engine/shared/core/i18n/I18nService.js` | Register `tutorial_*.js` translation files |
| `js/engine/shared/core/SaveSlotManager.js` | Include tutorial state in `getSlotSummary` (optional: show "Tutorial Active" indicator) |
| `ux/components/FooterNav.vue` | Accept `lockedTabs` prop from `useTutorial`; disable locked tabs visually |
| `ux/components/ModalFrame.vue` | Accept `tutorialLocked` prop; suppress Escape/close when tutorial locks the modal |
| `js/engine/book/BookService.js` | Emit closure event with `isFirstClosure` flag on Day 1 |

---

## 4. Engine Changes

### 4.1 TutorialService.js — State Machine

```js
export class TutorialService {
  constructor({ persistence, slotIndex } = {}) {
    this.persistence = persistence || globalPersistence;
    this.slotIndex = slotIndex ?? null;
    this.state = this._load();
    this.registry = TutorialRegistry;
  }

  /**
   * State shape:
   * {
   *   activeTutorialId: string | null,   // e.g. 'tutorial_day1'
   *   currentStepIndex: number,            // 0-based within active tutorial
   *   completedTutorialIds: string[],      // tutorials fully completed
   *   stepData: Record<string, any>        // arbitrary per-step data
   * }
   */

  start(tutorialId, force = false) {
    if (this.state.completedTutorialIds.includes(tutorialId) && !force) return false;
    if (this.state.activeTutorialId) return false; // one at a time
    
    this.state = {
      ...this.state,
      activeTutorialId: tutorialId,
      currentStepIndex: 0,
      stepData: {}
    };
    this._save();
    return true;
  }

  advance(data = {}) {
    if (!this.state.activeTutorialId) return false;
    const tutorial = this.registry.get(this.state.activeTutorialId);
    const nextIndex = this.state.currentStepIndex + 1;
    
    if (nextIndex >= tutorial.steps.length) {
      this._complete();
      return true;
    }
    
    this.state = {
      ...this.state,
      currentStepIndex: nextIndex,
      stepData: { ...this.state.stepData, ...data }
    };
    this._save();
    return true;
  }

  skip() {
    if (!this.state.activeTutorialId) return false;
    this.state.completedTutorialIds.push(this.state.activeTutorialId);
    this.state.activeTutorialId = null;
    this.state.currentStepIndex = 0;
    this.state.stepData = {};
    this._save();
    return true;
  }

  getState() {
    if (!this.state.activeTutorialId) return null;
    const tutorial = this.registry.get(this.state.activeTutorialId);
    const step = tutorial.steps[this.state.currentStepIndex];
    return {
      tutorialId: this.state.activeTutorialId,
      stepIndex: this.state.currentStepIndex,
      totalSteps: tutorial.steps.length,
      stepId: step.id,
      spotlight: step.spotlight || null,
      message: step.message || null,
      forcedNav: step.forcedNav || null,
      modalLock: step.modalLock || null,
      preventNav: step.preventNav || [],
      allowActions: step.allowActions || [],
      completionEvent: step.completionEvent || null,
      stepData: this.state.stepData
    };
  }

  isCompleted(tutorialId) {
    return this.state.completedTutorialIds.includes(tutorialId);
  }

  _persistKey() {
    return this.slotIndex !== null
      ? `rpg_village_v1_slot${this.slotIndex}_tutorial_state`
      : 'rpg_village_v1_tutorial_state';
  }

  _load() {
    const raw = this.persistence.load(this._persistKey(), null);
    if (raw) return raw;
    return { activeTutorialId: null, currentStepIndex: 0, completedTutorialIds: [], stepData: {} };
  }

  _save() {
    this.persistence.save(this._persistKey(), this.state);
  }

  _complete() {
    if (this.state.activeTutorialId) {
      this.state.completedTutorialIds.push(this.state.activeTutorialId);
    }
    this.state.activeTutorialId = null;
    this.state.currentStepIndex = 0;
    this.state.stepData = {};
    this._save();
  }
}
```

**Key Design Decisions:**
- **One tutorial at a time** — prevents overlapping guides. Queuing can be added later if needed.
- **`stepData`** — allows steps to pass context forward (e.g. "which hero was selected").
- **`allowActions`** — whitelist of engine actions permitted during the step (e.g. only `learnHeroFamily` is allowed while skill modal is locked).
- **Slot-aware persistence** — reuses the same `Persistence.js` slot prefix pattern already established.

### 4.2 TutorialRegistry.js — Declarative Definitions

```js
export const TutorialRegistry = new Map([
  ['tutorial_day1', {
    id: 'tutorial_day1',
    trigger: { type: 'event', event: 'book_first_closed', day: 1 },
    steps: [
      {
        id: 'day1_navigate_heroes',
        message: 'tutorial_day1_msg_heroes_tab',
        spotlight: { target: 'footer_nav_tab', tabId: 'heroes', flash: true },
        forcedNav: { tab: 'heroes' },
        preventNav: ['village', 'adventure', 'town'],
        completionEvent: 'tab_changed_heroes'
      },
      {
        id: 'day1_select_arthur',
        message: 'tutorial_day1_msg_select_arthur',
        spotlight: { target: 'hero_card', heroId: 'arthur', flash: true },
        forcedNav: { tab: 'heroes', heroId: 'arthur' },
        preventNav: ['village', 'adventure', 'town'],
        completionEvent: 'hero_selected_arthur'
      },
      {
        id: 'day1_learn_skill',
        message: 'tutorial_day1_msg_learn_skill',
        spotlight: { target: 'hero_action_learn_skill', heroId: 'arthur', flash: true },
        forcedNav: { tab: 'heroes', heroId: 'arthur', modal: 'learn_skill' },
        preventNav: ['village', 'adventure', 'town'],
        modalLock: { modal: 'learn_skill', untilEvent: 'skill_learned' },
        allowActions: ['learnHeroFamily'],
        completionEvent: 'skill_learned_arthur'
      },
      {
        id: 'day1_assign_stats',
        message: 'tutorial_day1_msg_assign_stats',
        spotlight: { target: 'hero_stats_grid', heroId: 'arthur', flash: false },
        forcedNav: { tab: 'heroes', heroId: 'arthur' },
        preventNav: ['village', 'adventure', 'town'],
        allowActions: ['increaseHeroStat'],
        completionEvent: 'stat_point_spent_arthur'
      },
      {
        id: 'day1_navigate_explore',
        message: 'tutorial_day1_msg_explore_tab',
        spotlight: { target: 'footer_nav_tab', tabId: 'adventure', flash: true },
        forcedNav: { tab: 'adventure', subTab: 'explore' },
        preventNav: ['village', 'heroes', 'town'],
        completionEvent: 'tab_changed_adventure_explore'
      },
      {
        id: 'day1_select_region',
        message: 'tutorial_day1_msg_select_region',
        spotlight: { target: 'region_card', regionId: 'reg_greenfields', flash: true },
        forcedNav: { tab: 'adventure', subTab: 'explore', regionId: 'reg_greenfields' },
        preventNav: ['village', 'heroes', 'town'],
        completionEvent: 'region_selected_greenfields'
      },
      {
        id: 'day1_select_expedition',
        message: 'tutorial_day1_msg_select_expedition',
        spotlight: { target: 'expedition_node', nodeId: 'exp_tutorial_cave', flash: true },
        forcedNav: { tab: 'adventure', subTab: 'explore', regionId: 'reg_greenfields', expeditionId: 'exp_tutorial_cave' },
        preventNav: ['village', 'heroes', 'town'],
        allowActions: ['startExpedition'],
        completionEvent: 'expedition_started_tutorial_cave'
      },
      {
        id: 'day1_advance_day',
        message: 'tutorial_day1_msg_advance_day',
        spotlight: { target: 'day_advance_button', flash: true },
        allowActions: ['advanceDay'],
        completionEvent: 'day_advanced'
      }
    ]
  }]
]);
```

**Extensibility:** New tutorials are added as new entries in this Map. No changes to `TutorialService.js` required. Future tutorials could use triggers like:

```js
trigger: { type: 'unlock', feature: 'shop' }
trigger: { type: 'building', buildingId: 'tavern', level: 1 }
trigger: { type: 'event', event: 'first_spell_inscribed' }
```

### 4.3 GameEngine.js Integration

**Constructor:** Add `this.tutorialService = new TutorialService({ persistence, slotIndex: this.slotIndex })` after other services. Note: `slotIndex` needs to be set on `GameEngine` — currently it lives on `Persistence.js` as a static. We should pass it explicitly or read it from `Persistence.getSlotIndex()`.

**`initialize()`:** After `bookService.load()`, check if this is a new game and Day 1. If the book is about to be shown (first time), we don't start the tutorial yet — we wait for the `book_first_closed` event. On reload (not new game), if tutorial state says `activeTutorialId` is set, it auto-resumes.

**`update()`:** Add `tutorial: this.tutorialService.getState()` to the returned state object.

**New Facade Methods:**
```js
advanceTutorial(data) {
  return this.tutorialService.advance(data);
}

skipTutorial() {
  return this.tutorialService.skip();
}

startTutorial(tutorialId, force = false) {
  return this.tutorialService.start(tutorialId, force);
}
```

**Book Closure Hook:** In `initNewGame()` or via a BookService callback, when the book is closed on Day 1, fire `this.tutorialService.start('tutorial_day1')`. This should be done in the presentation layer (BookPage.vue emits → App.vue dispatches → engine), NOT in the engine, because the engine shouldn't know about UI events like "book closed."

---

## 5. Presentation (Vue) Changes

### 5.1 TutorialOverlay.vue — Root Component

```vue
<template>
  <Teleport to="body">
    <div v-if="active" class="tutorial-overlay" :class="{ 'no-interaction': locksInteraction }">
      <!-- Darkened backdrop with a clipped hole -->
      <TutorialSpotlight
        :target="spotlightTarget"
        :padding="spotlightPadding"
        :rounded="spotlightRounded"
      />
      
      <!-- Message bubble near the spotlight -->
      <TutorialMessage
        :text="messageText"
        :position="messagePosition"
        :actions="messageActions"
        @dismiss="onDismissMessage"
      />
      
      <!-- Click-capture layer: dismisses darkening but NOT the tutorial -->
      <div v-if="darkened" class="click-capture" @click="onDimissDarkening" />
    </div>
  </Teleport>
</template>
```

**Key behaviors:**
1. **Darkening dismissed by any click** — the overlay captures clicks globally, removes the darkening, but the tutorial step continues. The user can now see the full UI but is still constrained by `preventNav` and `modalLock`.
2. **Spotlight stays** — even after darkening is dismissed, the target element keeps a subtle pulsing border or glow so the user knows where to look.
3. **Message bubble** — positioned dynamically near the spotlight target. If the target is off-screen (e.g. scrolled), the overlay scrolls the page or repositions the bubble.
4. **No "skip" button by default** — the user must perform the action. A hidden skip gesture (e.g. triple-click the message) can be added for testing.

### 5.2 TutorialSpotlight.vue — CSS Clip-Path Effect

```vue
<template>
  <div class="spotlight-layer" :style="layerStyle">
    <div class="spotlight-hole" :style="holeStyle" />
  </div>
</template>
```

```css
.spotlight-layer {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  z-index: 2000;
  pointer-events: none; /* let clicks pass through to the capture layer */
}

.spotlight-hole {
  position: absolute;
  background: transparent;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.75);
  border-radius: var(--radius-md);
  animation: pulse-spotlight 2s infinite;
}

@keyframes pulse-spotlight {
  0%, 100% { box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.75), 0 0 20px rgba(245, 158, 11, 0.3); }
  50% { box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.75), 0 0 40px rgba(245, 158, 11, 0.6); }
}
```

**Target Resolution:** The `useTutorial` composable finds the target element via:
1. `data-tutorial-target="{id}"` attributes on DOM elements
2. If not found, via `document.querySelector` using a mapping table
3. If the target is inside a scrollable container, the composable calls `.scrollIntoView({ behavior: 'smooth', block: 'center' })` before measuring bounds

### 5.3 useTutorial.js — Composable

```js
export function useTutorial() {
  const gameState = inject('gameState');
  const adapter = inject('adapter');
  const tutorial = computed(() => gameState.value?.tutorial || null);
  
  const isActive = computed(() => !!tutorial.value);
  const spotlightTarget = computed(() => resolveTarget(tutorial.value?.spotlight));
  const lockedTabs = computed(() => tutorial.value?.preventNav || []);
  const lockedModal = computed(() => tutorial.value?.modalLock || null);
  const allowedActions = computed(() => tutorial.value?.allowActions || []);
  
  // Navigation guard: only allow navigation to forcedNav destinations
  function canNavigate(tabId) {
    if (!isActive.value) return true;
    if (tutorial.value?.forcedNav?.tab === tabId) return true;
    if (lockedTabs.value.includes(tabId)) return false;
    return true;
  }
  
  // Action guard: only allow whitelisted engine actions during tutorial
  function canDispatch(actionKey) {
    if (!isActive.value) return true;
    if (allowedActions.value.includes(actionKey)) return true;
    return false;
  }
  
  // Called by components when they perform the action the tutorial is waiting for
  function reportStepCompletion(eventId, data = {}) {
    if (!isActive.value) return;
    if (tutorial.value?.completionEvent === eventId) {
      adapter.dispatch('tutorial', 'advance', data);
    }
  }
  
  // Auto-navigate when step changes
  watch(() => tutorial.value?.stepId, (newStepId) => {
    if (!newStepId) return;
    const forced = tutorial.value?.forcedNav;
    if (forced?.tab) {
      // Emit navigation event that App.vue handles
      emitTutorialNav(forced);
    }
  }, { immediate: true });
  
  return {
    isActive, spotlightTarget, lockedTabs, lockedModal, allowedActions,
    canNavigate, canDispatch, reportStepCompletion
  };
}
```

### 5.4 App.vue Integration

```vue
<template>
  <div class="app-container">
    <TopBar ... />
    <main>
      <component :is="currentPage" ... />
    </main>
    <FooterNav
      :current="currentTab"
      :items="navItems"
      :locked-tabs="tutorialLockedTabs"
      @navigate="handleNav"
    />
    
    <!-- Tutorial Overlay mounted at root, outside the main layout -->
    <TutorialOverlay
      v-if="tutorialState"
      :state="tutorialState"
      @dismiss-darkening="tutorialDarkened = false"
    />
  </div>
</template>
```

```js
// In setup()
const { lockedTabs, canNavigate } = useTutorial();

function handleNav(tabId) {
  if (!canNavigate(tabId)) return; // silently ignore, or show a subtle shake animation
  currentTab.value = tabId;
}
```

### 5.5 Modal Locking

`ModalFrame.vue` modifications:
```vue
<script setup>
const props = defineProps({
  title: { type: String, default: '' },
  tutorialLocked: { type: Boolean, default: false }
});

function onKeydown(e) {
  if (e.key === 'Escape' && !props.tutorialLocked) {
    emit('close');
  }
}
</script>
```

`HeroesPage.vue` when opening the Learn Skill modal:
```js
const { lockedModal } = useTutorial();
const isModalLocked = computed(() => 
  lockedModal.value?.modal === 'learn_skill' && 
  lockedModal.value?.untilEvent === 'skill_learned'
);
```

---

## 6. Component-by-Component Wiring

### HeroesPage.vue

1. **Tutorial forces Arthur selection:** When `forcedNav.heroId === 'arthur'`, programmatically call `selectHeroById('arthur')` even if user is on a different hero.
2. **Tab switching blocked:** `useTutorial.canNavigate('village')` returns `false` during steps 1-4, so FooterNav disables those tabs.
3. **Skill learned detection:** `HeroActionBar.vue` emits `skill-learned` with `{ heroId, familyId }`. HeroesPage catches this and calls `reportStepCompletion('skill_learned_arthur', { familyId })`.
4. **Stat point spent detection:** `HeroStatsGrid.vue` emits `stat-assigned` with `{ heroId, statId }`. HeroesPage catches this and calls `reportStepCompletion('stat_point_spent_arthur', { statId })`.

### ExploreTab.vue / ExpeditionNode.vue

1. **Region forced:** When `forcedNav.regionId` is set, call `selectRegion(regionId)` programmatically.
2. **Expedition forced:** When `forcedNav.expeditionId` is set, scroll the node into view and pulse it.
3. **Expedition started detection:** `ExpeditionNode.vue` emits `expedition-started`. ExploreTab calls `reportStepCompletion('expedition_started_tutorial_cave')`.

### BookPage.vue

1. **First closure detection:** Track `hasBeenClosed` in component state. On first close during Day 1, emit `book-first-closed`.
2. **App.vue** catches this and dispatches `startTutorial('tutorial_day1')` to the engine.

---

## 7. i18n Design

### Translation Keys (4 Languages: EN, ES, CA, GL, EU)

```js
// tutorial_en.js (pattern: tutorial_{tutorialId}_{stepId}_{purpose})
export const tutorial_en = {
  tutorial_day1_msg_heroes_tab: 'Your heroes are the heart of the village. Tap here to see them.',
  tutorial_day1_msg_select_arthur: 'This is Arthur, your first hero. Let\'s take a look at him.',
  tutorial_day1_msg_learn_skill: 'Arthur can learn a new fighting technique. Tap this button to open his skills.',
  tutorial_day1_msg_assign_stats: 'As heroes grow, they gain points to improve their strength, speed, and other stats.',
  tutorial_day1_msg_explore_tab: 'The world beyond the village holds dangers and treasures. Let\'s explore!',
  tutorial_day1_msg_select_region: 'The Greenfields are the safest place to start your adventures.',
  tutorial_day1_msg_select_expedition: 'This cave is a good first challenge. Tap it to send Arthur inside.',
  tutorial_day1_msg_advance_day: 'When you\'re ready, advance to the next day to see what happens.',
};
```

**Naming convention:** `tutorial_{tutorialId}_{stepId}_{purpose}` where `purpose` is either `msg` (message) or `title` (title). This keeps keys organized and searchable.

---

## 8. Test Plan

### 8.1 Screenshot Test Scripts (Adapted from Existing Scripts)

Add new screenshot scenarios to `scripts/screenshots/orchestrator.mjs`:

```js
{
  id: 'tutorial_day1_flow',
  description: 'Full Day 1 tutorial flow with spotlight overlays',
  steps: [
    { action: 'start_new_game' },
    { action: 'close_book', assert: 'book_closed' },
    { action: 'screenshot', target: 'tutorial_overlay_heroes_tab' },
    { action: 'navigate_tab', tab: 'heroes', assert: 'tutorial_overlay_arthur_card' },
    { action: 'click_hero', heroId: 'arthur', assert: 'tutorial_overlay_learn_skill' },
    { action: 'click_action', action: 'learn_skill', assert: 'modal_open_learn_skill' },
    { action: 'screenshot', target: 'tutorial_modal_learn_skill_locked' },
    { action: 'select_skill', familyId: 'power_strike', assert: 'skill_learned' },
    { action: 'screenshot', target: 'tutorial_overlay_stat_grid' },
    { action: 'assign_stat', statId: 'str', assert: 'stat_spent' },
    { action: 'navigate_tab', tab: 'adventure', assert: 'tutorial_overlay_explore_tab' },
    { action: 'click_region', regionId: 'reg_greenfields', assert: 'tutorial_overlay_region' },
    { action: 'click_expedition', expeditionId: 'exp_tutorial_cave', assert: 'tutorial_overlay_node' },
    { action: 'start_expedition', assert: 'tutorial_complete' },
    { action: 'navigate_tab', tab: 'village', assert: 'tutorial_overlay_advance_day' },
    { action: 'advance_day', assert: 'day_advanced' },
  ]
}
```

### 8.2 Unit Tests (Engine)

- `TutorialService.start()` — starts only if not completed, only one at a time
- `TutorialService.advance()` — progresses through steps, completes at end
- `TutorialService.skip()` — marks as completed, clears active
- `TutorialService.getState()` — returns correct spotlight/forcedNav for current step
- Persistence round-trip: save → reload → state restored exactly

### 8.3 Unit Tests (Vue)

- `useTutorial.canNavigate()` — allows forced nav, blocks locked tabs
- `useTutorial.canDispatch()` — allows whitelisted actions, blocks others
- `TutorialSpotlight.vue` — computes correct bounds for target elements
- `TutorialOverlay.vue` — dismisses darkening on click but keeps tutorial active

---

## 9. Persistence & Migration

### New Save Key

```
rpg_village_v1_slot{N}_tutorial_state
```

Example value:
```json
{
  "activeTutorialId": "tutorial_day1",
  "currentStepIndex": 2,
  "completedTutorialIds": [],
  "stepData": { "selectedHeroId": "arthur", "learnedFamilyId": "power_strike" }
}
```

### Migration Path

Existing saves have no `tutorial_state`. On `GameEngine.initialize()` for existing saves:
1. If `day > 1`, mark `tutorial_day1` as completed (the player already knows the game).
2. If `day === 1` and no tutorial state exists, the player may have started before this feature. Start `tutorial_day1` only if they haven't completed the first expedition yet (`completedIds.length === 0`). Otherwise, mark it completed.

### Backfill Logic (in `GameEngine.initialize()`)

```js
const tutorialState = this.persistence.load(`rpg_village_v1_slot${slotIndex}_tutorial_state`, null);
if (!tutorialState && !this.isNewGame) {
  const completedExpeditions = this.expeditionService.getCompletedIds().length;
  if (completedExpeditions > 0 || (villageState.day || 1) > 1) {
    this.tutorialService.state.completedTutorialIds.push('tutorial_day1');
    this.tutorialService._save();
  }
}
```

---

## 10. Implementation Order

### Phase 1: Engine Foundation (No Vue Changes)
1. Create `TutorialTypes.js`
2. Create `TutorialRegistry.js` with Day 1 definition
3. Create `TutorialService.js` with state machine + persistence
4. Create `TutorialValidator.js` (can be stubbed for now — validators run in presentation layer)
5. Modify `GameEngine.js`: instantiate service, expose in `update()`, add facade methods
6. Add i18n keys for all 5 languages
7. **Test:** Unit tests for `TutorialService` — start, advance, skip, persistence round-trip

### Phase 2: Presentation Overlay
1. Create `TutorialSpotlight.vue` — CSS hole effect
2. Create `TutorialOverlay.vue` — root component with Teleport
3. Create `useTutorial.js` composable — reactive state, navigation guards, action guards
4. Modify `App.vue` — mount `TutorialOverlay`, wire footer nav locking
5. Modify `FooterNav.vue` — accept `lockedTabs`, disable locked tabs
6. Modify `ModalFrame.vue` — accept `tutorialLocked`, suppress close
7. **Test:** Screenshot tests for each spotlight step

### Phase 3: Component Wiring (Day 1 Flow)
1. Modify `BookPage.vue` — emit `book-first-closed` on Day 1
2. Modify `App.vue` — catch `book-first-closed`, dispatch `startTutorial('tutorial_day1')`
3. Modify `HeroesPage.vue` — force-select Arthur, lock tabs, detect skill/stat completion
4. Modify `HeroActionBar.vue` — emit `skill-learned` event
5. Modify `HeroStatsGrid.vue` — emit `stat-assigned` event
6. Modify `ExploreTab.vue` — force region/expedition selection
7. Modify `ExpeditionNode.vue` — emit `expedition-started` event
8. **Test:** Full screenshot flow `tutorial_day1_flow`

### Phase 4: Extensibility & Polish
1. Add `TutorialRegistry` entries for future tutorials (shop, tavern, etc.) — can be commented out
2. Add skip gesture for testing (triple-click message)
3. Add subtle "shake" animation on locked tabs when user tries to click them
4. Verify migration/backfill logic on old saves
5. Run full screenshot suite and fix any visual regressions

---

## 11. Risk Assessment & Mitigations

| Risk | Mitigation |
|------|------------|
| **Target element not found** (DOM not ready) | `useTutorial` uses `nextTick` + `requestAnimationFrame` loop with timeout; if target not found after 5s, shows message centered on screen and logs error |
| **User reloads mid-step** | Persistence saves every step change; `GameEngine.initialize()` checks `tutorialService.getState()` and forces navigation immediately |
| **Modal opens but tutorial expects it** | Modal components read `tutorialLocked` prop; if locked, they don't emit `close` on Escape or overlay click |
| **Multiple tutorials triggered** | `TutorialService.start()` returns `false` if one is already active; triggers queue can be added later if needed |
| **Existing save on Day 1 without tutorial** | Backfill logic marks tutorial completed if any expedition has been completed |
| **Accessibility** | All tutorial messages are screen-reader friendly (`aria-live="polite"`); spotlight uses `aria-hidden` so it doesn't obscure content |
| **Mobile viewport** | Spotlight targets use `scrollIntoView` with `block: 'center'`; message bubble repositions to stay within viewport |

---

## 12. Acceptance Criteria

- [ ] Starting a new game shows the book. Closing it on Day 1 triggers the tutorial.
- [ ] The tutorial darkens the screen and highlights the Heroes tab. Clicking anywhere dismisses the darkening but the tab is still highlighted.
- [ ] The user is forced to the Heroes tab. Arthur is auto-selected. The "Learn Skill" button is highlighted.
- [ ] Clicking "Learn Skill" opens the modal. The modal cannot be closed until a skill is selected.
- [ ] After learning a skill, the tutorial advances to stat assignment. The stat grid is highlighted.
- [ ] After spending a stat point, the tutorial advances to the Adventure tab. The user is forced there.
- [ ] The Greenfields region is highlighted, then the Tutorial Cave node is highlighted.
- [ ] After starting the expedition, the tutorial advances to "advance day".
- [ ] Reloading the page at any step restores the tutorial exactly at that step, with the correct spotlight and message.
- [ ] Existing saves (Day > 1 or any expedition completed) never see the tutorial.
- [ ] All tutorial text is translated in 5 languages.
- [ ] Screenshot tests cover all 8 tutorial steps.

---

**Plan written by:** Clawdio (Architect Mode)  
**Branch:** `dev_workflow` (`.dev_workflow/implementation_plans/4_tutorial.md`)  
**Date:** 2026-06-23  
**Status:** Ready for implementation
