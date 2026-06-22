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

## 2. Tutorial Data Model — The Four Properties

Every tutorial step has exactly four properties, mapping to your mental model:

```js
{
  id: 'learn_skill',                    // unique within the tutorial
  where: {                              // Navigation context
    page: 'heroes',                      // App.vue currentPage
    heroId: 'arthur',                    // HeroesPage selectedHeroId
    modal: 'skills'                      // HeroesPage activeModal
  },
  what: {                              // Spotlight target
    target: 'hero_action_learn_skill', // data-tutorial-target attribute value
    flash: true,                         // pulsing animation
    padding: 8,                          // spotlight padding around target
    rounded: true                        // rounded corners on spotlight hole
  },
  messages: [                            // Array of i18n keys
    'tutorial_hero_skills_msg_learn_skill_1',
    'tutorial_hero_skills_msg_learn_skill_2'
  ],
  until: (engine) => {                  // Exit condition lambda
    const arthur = engine.heroes.find(h => h.id === 'arthur');
    return arthur && arthur.skills.length > 0;
  },
  allowActions: ['learnHeroFamily']      // Optional: whitelist engine actions
}
```

| Property | Purpose | Resolves Via |
|---|---|---|
| `where` | **Navigation context** — where the user must be. The tutorial forces navigation here and prevents leaving. | `App.vue` `currentPage`, page-specific refs (`selectedHeroId`, `activeModal`, `currentTab`, `selectedRegion`) |
| `what` | **Spotlight target** — which DOM element to highlight. Darkens everything else. | `data-tutorial-target` HTML5 attribute + `document.querySelector()` |
| `messages` | **What to say** — array of i18n keys. Shown sequentially (click/tap to advance). | `TutorialOverlay` renders via `i18n.t()` |
| `until` | **Exit condition** — lambda receiving the full `engine` instance. Returns `true` when the step is complete. Evaluated on every `GameEngine.update()` cycle. | `TutorialService.checkStepCompletion(engine)` |

**`until` Lambda Examples:**

```js
// Wait until Arthur has learned any skill
until: (e) => e.heroes.find(h => h.id === 'arthur').skills.length > 0

// Wait until farm is built (level >= 1)
until: (e) => (e.village.infrastructure.farm || 0) >= 1

// Wait until player has >= 100 gold
until: (e) => e.village.resources.gold >= 100

// Wait until a specific expedition is active
until: (e) => e.expeditions.some(ex => ex.nodeId === 'exp_tutorial_cave' && ex.status === 'active')

// Wait until day advanced (day > 1)
until: (e) => e.village.day > 1

// Wait until user is on a specific tab
until: (e) => e.ui?.currentTab === 'heroes'
```

No new event types needed. No component wiring. The `TutorialService` evaluates `until(engine)` on every `update()` cycle. When it returns `true`, the step auto-advances.

---

## 3. HTML5 Data Attributes for Spotlight Targeting (`data-tutorial-target`)

The `what.target` value maps directly to a `data-tutorial-target` attribute on the DOM element. This is robust, works with `v-for` rendered content, and requires zero JavaScript ref drilling.

### Target Attribute Registry (Canonical Mapping)

| Target ID | Component | Attribute Location | Dynamic Value |
|---|---|---|---|
| `footer_nav_village` | `FooterNav.vue` | `<button>` | `:data-tutorial-target="'footer_nav_' + item.id"` |
| `footer_nav_heroes` | `FooterNav.vue` | `<button>` | `:data-tutorial-target="'footer_nav_' + item.id"` |
| `footer_nav_adventure` | `FooterNav.vue` | `<button>` | `:data-tutorial-target="'footer_nav_' + item.id"` |
| `footer_nav_town` | `FooterNav.vue` | `<button>` | `:data-tutorial-target="'footer_nav_' + item.id"` |
| `footer_nav_book` | `FooterNav.vue` | `<button>` | `:data-tutorial-target="'footer_nav_' + item.id"` |
| `hero_card_arthur` | `HeroListItem.vue` | `<button>` | `:data-tutorial-target="'hero_card_' + hero.id"` |
| `hero_action_skills` | `HeroActionBar.vue` | `<button>` | `:data-tutorial-target="'hero_action_' + action.id"` |
| `hero_action_trainer` | `HeroActionBar.vue` | `<button>` | `:data-tutorial-target="'hero_action_' + action.id"` |
| `hero_stats_grid` | `HeroStatsGrid.vue` | root `<div>` | `data-tutorial-target="hero_stats_grid"` |
| `hero_stat_assign_strength` | `HeroStatsGrid.vue` | `<button>` | `:data-tutorial-target="'hero_stat_assign_' + stat.key"` |
| `region_card_reg_greenfields` | `ExploreTab.vue` | `<div>` | `:data-tutorial-target="'region_card_' + regionId"` |
| `expedition_node_exp_tutorial_cave` | `ExploreTab.vue` | `<div>` | `:data-tutorial-target="'expedition_node_' + node.id"` |
| `day_advance_button` | `TopBar.vue` | `<button>` | `data-tutorial-target="day_advance_button"` |
| `tab_explore` | `TabNav.vue` | `<button>` | `:data-tutorial-target="'tab_' + tab.id"` |
| `tab_bestiary` | `TabNav.vue` | `<button>` | `:data-tutorial-target="'tab_' + tab.id"` |
| `building_farm` | `VillageCanvas.vue` | `<button>` | `:data-tutorial-target="'building_' + buildingId"` |

### Spotlight Resolution Algorithm

```js
// TutorialSpotlight.vue
function resolveTarget(targetId) {
  // 1. Direct data attribute match
  const el = document.querySelector(`[data-tutorial-target="${targetId}"]`);
  if (!el) return null;

  // 2. Scroll into view if needed
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });

  // 3. Measure bounds (after scroll + layout)
  const rect = el.getBoundingClientRect();
  return {
    x: rect.left - padding,
    y: rect.top - padding,
    width: rect.width + (padding * 2),
    height: rect.height + (padding * 2),
    rounded: step.what.rounded ?? true
  };
}
```

### Why This Approach

- **No ref drilling:** Components don't need to expose refs to the tutorial system
- **Works with v-for:** Dynamic lists (heroes, regions, nodes) automatically get correct targets
- **Declarative:** The tutorial config says `target: 'hero_card_arthur'` and the DOM says `data-tutorial-target="hero_card_arthur"`. No mapping table needed.
- **Testable:** Screenshot tests can assert `document.querySelector('[data-tutorial-target="..."]')` exists before the spotlight appears
- **Zero runtime cost when no tutorial:** The data attributes are harmless HTML; no JavaScript overhead

---

## 4. Files to Create

| File | Purpose |
|------|---------|
| `js/engine/tutorial/TutorialService.js` | Core engine service: state machine, step progression, `until()` evaluation, persistence |
| `js/engine/tutorial/TutorialRegistry.js` | Declarative tutorial definitions. Day 1 chain (4 tutorials) + future feature-unlock templates |
| `js/engine/tutorial/TutorialValidator.js` | Validates `until()` lambdas don't throw, validates all `data-tutorial-target` IDs exist in DOM |
| `js/engine/tutorial/TutorialTypes.js` | JSDoc types for tutorial definitions (zero runtime cost) |
| `ux/core/composables/useTutorial.js` | Vue composable: reactive tutorial state, `where` navigation enforcement, spotlight targeting |
| `ux/core/components/TutorialOverlay.vue` | Root overlay: darkens screen, renders spotlight, shows messages sequentially |
| `ux/core/components/TutorialSpotlight.vue` | Spotlight effect: reads `data-tutorial-target`, computes bounds, clips the light hole |
| `ux/core/components/TutorialMessage.vue` | Message bubble: positions near spotlight, advances messages on click |
| `js/engine/shared/core/i18n/translations/tutorial_*.js` | i18n keys for all tutorial text (5 languages) |
| `.dev_workflow/implementation_plans/4_tutorial.md` | This document |

---

## 5. Files to Modify (Engine + Presentation)

### Engine Files

| File | Change |
|------|--------|
| `js/engine/GameEngine.js` | Instantiate `TutorialService`, expose `ui` state (current tab, selected hero, etc.), call `tutorialService.evaluate()` on every `update()`, add `skipTutorial()` facade |
| `js/engine/shared/core/i18n/I18nService.js` | Register `tutorial_*.js` translation files |
| `js/engine/shared/core/SaveSlotManager.js` | Include tutorial state in `getSlotSummary` |

### Presentation Files (Data Attributes + Tutorial Wiring)

| File | Change |
|------|--------|
| `ux/App.vue` | Mount `TutorialOverlay` at root level; pass `tutorial` state; expose `ui` state (currentPage, activeTab) to engine; guard footer navigation |
| `ux/main.js` | Add `tutorial` to reactive game state; provide tutorial service via injection |
| `ux/adapters/EngineAdapter.js` | Map `skipTutorial` engine method to adapter action |
| `ux/components/FooterNav.vue` | Add `:data-tutorial-target="'footer_nav_' + item.id"` to each nav button; accept `lockedTabs` prop |
| `ux/components/TabNav.vue` | Add `:data-tutorial-target="'tab_' + tab.id"` to each tab button |
| `ux/components/ModalFrame.vue` | Accept `tutorialLocked` prop; suppress Escape/close when locked |
| `ux/components/TopBar.vue` | Add `data-tutorial-target="day_advance_button"` to next-day button |
| `ux/features/heroes/HeroesPage.vue` | Wire `useTutorial` for `where.heroId` and `where.modal` enforcement; expose `selectedHeroId` and `activeModal` to `gameState.ui` |
| `ux/features/heroes/components/HeroListItem.vue` | Add `:data-tutorial-target="'hero_card_' + hero.id"` to root button |
| `ux/features/heroes/components/HeroActionBar.vue` | Add `:data-tutorial-target="'hero_action_' + action.id"` to each action button |
| `ux/features/heroes/components/HeroStatsGrid.vue` | Add `data-tutorial-target="hero_stats_grid"` to root div; add `:data-tutorial-target="'hero_stat_assign_' + stat.key"` to each `+` button |
| `ux/features/adventure/AdventurePage.vue` | Expose `currentTab` to `gameState.ui` for `where.tab` enforcement |
| `ux/features/adventure/components/ExploreTab.vue` | Add `:data-tutorial-target="'region_card_' + regionId"` to region items; add `:data-tutorial-target="'expedition_node_' + node.id"` to tree nodes; expose `selectedRegion` and `selectedExp` to `gameState.ui` |
| `ux/features/book/BookPage.vue` | Emit `book-first-closed` event on first closure during Day 1 |
| `ux/features/village/components/VillageCanvas.vue` | Add `:data-tutorial-target="'building_' + buildingId"` to building buttons |
| `js/engine/book/BookService.js` | Track first closure flag; emit closure event with `isFirstClosure` |

**Note:** Adding `data-tutorial-target` attributes is the only change required to existing components for spotlight targeting. No event emitters, no ref exposure, no tutorial logic in components.

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
   *   activeTutorialId: string | null,   // e.g. 'tutorial_hero_skills'
   *   currentStepIndex: number,            // 0-based within active tutorial
   *   completedTutorialIds: string[],      // tutorials fully completed
   *   stepData: Record<string, any>        // arbitrary per-step data
   * }
   */

  start(tutorialId, force = false, fromChain = false) {
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
    const completedId = this.state.activeTutorialId;
    this.state.completedTutorialIds.push(completedId);
    this.state.activeTutorialId = null;
    this.state.currentStepIndex = 0;
    this.state.stepData = {};
    this._save();
    // Chain: skip still triggers next tutorial if defined
    this._startNextTutorial(completedId);
    return true;
  }

  evaluateTriggers(gameState) {
    if (this.state.activeTutorialId) return false; // one at a time, queue instead
    
    for (const [id, tutorial] of this.registry.entries()) {
      if (this.state.completedTutorialIds.includes(id)) continue;
      if (this._checkTrigger(tutorial.trigger, gameState)) {
        return this.start(id, false, false);
      }
    }
    return false;
  }

  _checkTrigger(tutorial, gameState) {
    // Prerequisites must all be completed before this tutorial can trigger
    const prereqs = tutorial.prerequisites || [];
    const prereqsMet = prereqs.every(id => this.state.completedTutorialIds.includes(id));
    if (!prereqsMet) return false;

    const trigger = tutorial.trigger;
    switch (trigger.type) {
      case 'new_game':
        return gameState.isNewGame === true;
      case 'event':
        return gameState.lastEvent?.type === trigger.event &&
               (trigger.day === undefined || gameState.village?.day === trigger.day);
      case 'feature_unlocked':
        return gameState.unlockedFeatures?.includes(trigger.feature);
      case 'building_built':
        const level = gameState.village?.infrastructure?.[trigger.buildingId] || 0;
        return level >= (trigger.minLevel || 1);
      case 'hero_level':
        const hero = gameState.heroes?.find(h => h.id === trigger.heroId);
        return hero && hero.level >= (trigger.minLevel || 1);
      default:
        return false;
    }
  }

  _complete() {
    const completedId = this.state.activeTutorialId;
    if (completedId) {
      this.state.completedTutorialIds.push(completedId);
    }
    this.state.activeTutorialId = null;
    this.state.currentStepIndex = 0;
    this.state.stepData = {};
    this._save();
    // Chain: start next tutorial immediately
    this._startNextTutorial(completedId);
  }

  _startNextTutorial(completedId) {
    const tutorial = this.registry.get(completedId);
    if (tutorial?.nextTutorialId) {
      this.start(tutorial.nextTutorialId, false, true);
    }
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
  // ── Day 1 Chain ──
  ['tutorial_hero_skills', {
    id: 'tutorial_hero_skills',
    trigger: { type: 'new_game' },
    prerequisites: [],
    steps: [
      {
        id: 'navigate_heroes',
        message: 'tutorial_hero_skills_msg_navigate_heroes',
        spotlight: { target: 'footer_nav_tab', tabId: 'heroes', flash: true },
        forcedNav: { tab: 'heroes' },
        preventNav: ['village', 'adventure', 'town'],
        completionEvent: 'tab_changed_heroes'
      },
      {
        id: 'select_arthur',
        message: 'tutorial_hero_skills_msg_select_arthur',
        spotlight: { target: 'hero_card', heroId: 'arthur', flash: true },
        forcedNav: { tab: 'heroes', heroId: 'arthur' },
        preventNav: ['village', 'adventure', 'town'],
        completionEvent: 'hero_selected_arthur'
      },
      {
        id: 'learn_skill',
        message: 'tutorial_hero_skills_msg_learn_skill',
        spotlight: { target: 'hero_action_learn_skill', heroId: 'arthur', flash: true },
        forcedNav: { tab: 'heroes', heroId: 'arthur', modal: 'learn_skill' },
        preventNav: ['village', 'adventure', 'town'],
        modalLock: { modal: 'learn_skill', untilEvent: 'skill_learned' },
        allowActions: ['learnHeroFamily'],
        completionEvent: 'skill_learned_arthur'
      }
    ],
    nextTutorialId: 'tutorial_hero_stats'
  }],
  ['tutorial_hero_stats', {
    id: 'tutorial_hero_stats',
    trigger: { type: 'new_game' },
    prerequisites: ['tutorial_hero_skills'],
    steps: [
      {
        id: 'assign_stats',
        message: 'tutorial_hero_stats_msg_assign_stats',
        spotlight: { target: 'hero_stats_grid', heroId: 'arthur', flash: false },
        forcedNav: { tab: 'heroes', heroId: 'arthur' },
        preventNav: ['village', 'adventure', 'town'],
        allowActions: ['increaseHeroStat'],
        completionEvent: 'stat_point_spent_arthur'
      }
    ],
    nextTutorialId: 'tutorial_build_farm'
  }],
  ['tutorial_build_farm', {
    id: 'tutorial_build_farm',
    trigger: { type: 'new_game' },
    prerequisites: ['tutorial_hero_skills', 'tutorial_hero_stats'],
    steps: [
      {
        id: 'navigate_village',
        message: 'tutorial_build_farm_msg_navigate_village',
        spotlight: { target: 'footer_nav_tab', tabId: 'village', flash: true },
        forcedNav: { tab: 'village' },
        preventNav: ['heroes', 'adventure', 'town'],
        completionEvent: 'tab_changed_village'
      },
      {
        id: 'construct_farm',
        message: 'tutorial_build_farm_msg_construct_farm',
        spotlight: { target: 'building_farm', flash: true },
        forcedNav: { tab: 'village' },
        preventNav: ['heroes', 'adventure', 'town'],
        allowActions: ['build'],
        completionEvent: 'building_constructed_farm'
      }
    ],
    nextTutorialId: 'tutorial_expeditions'
  }],
  ['tutorial_expeditions', {
    id: 'tutorial_expeditions',
    trigger: { type: 'new_game' },
    prerequisites: ['tutorial_hero_skills', 'tutorial_hero_stats', 'tutorial_build_farm'],
    steps: [
      {
        id: 'navigate_explore',
        message: 'tutorial_expeditions_msg_navigate_explore',
        spotlight: { target: 'footer_nav_tab', tabId: 'adventure', flash: true },
        forcedNav: { tab: 'adventure', subTab: 'explore' },
        preventNav: ['village', 'heroes', 'town'],
        completionEvent: 'tab_changed_adventure_explore'
      },
      {
        id: 'select_region',
        message: 'tutorial_expeditions_msg_select_region',
        spotlight: { target: 'region_card', regionId: 'reg_greenfields', flash: true },
        forcedNav: { tab: 'adventure', subTab: 'explore', regionId: 'reg_greenfields' },
        preventNav: ['village', 'heroes', 'town'],
        completionEvent: 'region_selected_greenfields'
      },
      {
        id: 'select_expedition',
        message: 'tutorial_expeditions_msg_select_expedition',
        spotlight: { target: 'expedition_node', nodeId: 'exp_tutorial_cave', flash: true },
        forcedNav: { tab: 'adventure', subTab: 'explore', regionId: 'reg_greenfields', expeditionId: 'exp_tutorial_cave' },
        preventNav: ['village', 'heroes', 'town'],
        allowActions: ['startExpedition'],
        completionEvent: 'expedition_started_tutorial_cave'
      },
      {
        id: 'advance_day',
        message: 'tutorial_expeditions_msg_advance_day',
        spotlight: { target: 'day_advance_button', flash: true },
        allowActions: ['advanceDay'],
        completionEvent: 'day_advanced'
      }
    ],
    nextTutorialId: null
  }],

  // ── Future Tutorials ──
  ['tutorial_gambits', {
    id: 'tutorial_gambits',
    trigger: { type: 'feature_unlocked', feature: 'gambits' },
    prerequisites: [],
    steps: [ /* gambit UI walkthrough */ ],
    nextTutorialId: null
  }],
  ['tutorial_magic_circle', {
    id: 'tutorial_magic_circle',
    trigger: { type: 'feature_unlocked', feature: 'magic_circle' },
    prerequisites: [],
    steps: [ /* magic circle UI */ ],
    nextTutorialId: null
  }]
]);
```

**Trigger Conditions:**

| Type | Evaluates When | Example |
|---|---|---|
| `new_game` | `isNewGame === true` (typically after book closed on Day 1) | Day 1 chain |
| `event` | Specific engine event fires with matching payload | `{ type: 'event', event: 'book_first_closed', day: 1 }` |
| `tutorial_completed` | Another tutorial finishes (alternative to `nextTutorialId`) | `{ type: 'tutorial_completed', id: 'tutorial_hero_skills' }` |
| `feature_unlocked` | A feature flag becomes true in `unlockService` | `{ type: 'feature_unlocked', feature: 'gambits' }` |
| `building_built` | A building reaches a minimum level | `{ type: 'building_built', buildingId: 'farm', minLevel: 1 }` |
| `hero_level` | A specific hero reaches a minimum level | `{ type: 'hero_level', heroId: 'arthur', minLevel: 5 }` |

**Trigger Evaluation Rules:**
1. `TutorialService.evaluateTriggers(gameState)` checks all non-completed, non-active tutorials.
2. If trigger matches and no tutorial is active → start it.
3. If trigger matches but another tutorial is active → **queue** it (one at a time, no overlap).
4. When a tutorial completes via `advance()` reaching the final step → if `nextTutorialId` is set, start it immediately, bypassing trigger check.
5. `skip()` marks the tutorial complete and still fires `nextTutorialId` (chain is not broken by skip).

### 4.3 GameEngine.js Integration

**Constructor:** Add `this.tutorialService = new TutorialService({ persistence, slotIndex: this.slotIndex })` after other services. Note: `slotIndex` needs to be set on `GameEngine` — currently it lives on `Persistence.js` as a static. We should pass it explicitly or read it from `Persistence.getSlotIndex()`.

**`initialize()`:** After all services load, call `this.tutorialService.evaluateTriggers(this.update())` to check if any tutorial should auto-start (e.g. Day 1 chain on new game, or feature-unlock tutorials for existing saves). On reload (not new game), if tutorial state says `activeTutorialId` is set, it auto-resumes.

**`update()`:** After building the state object, call `this.tutorialService.evaluateTriggers(state)` to check if any trigger conditions have been met (e.g. a building was just completed, a hero leveled up, a feature was unlocked). Add `tutorial: this.tutorialService.getState()` to the returned state object.

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

**Book Closure Event:** `BookPage.vue` emits `book-first-closed` on Day 1. `App.vue` dispatches `recordEvent({ type: 'book_first_closed', day: 1 })` to the engine. The engine stores `lastEvent` on the state. `TutorialService.evaluateTriggers()` checks this event on the next `update()` and starts `tutorial_hero_skills` (the first in the Day 1 chain) because its trigger is `{ type: 'event', event: 'book_first_closed', day: 1 }`. This decouples the book from the tutorial system — the book just records an event; the trigger system decides what to do with it.

---

## 5. Presentation (Vue) Changes — Synthetic Click Architecture

### 5.1 Core Principle: Zero Page Refactoring

Pages like `HeroesPage` and `ExploreTab` keep selection state in **local refs** (`selectedHeroId`, `selectedRegion`, etc.). Instead of refactoring every page to accept tutorial control, the system uses **synthetic DOM clicks** on `data-tutorial-target` elements. This works because all target elements are already clickable buttons/cards with existing `@click` handlers.

### 5.2 `where` Resolution — `enforceWhere()` Algorithm

```js
async function enforceWhere(where) {
  // 1. Navigate to page (TutorialOverlay is mounted in App.vue, direct ref access)
  if (where.page && currentPage.value !== where.page) {
    currentPage.value = where.page;
    activeTab.value = where.tab || null;
    await nextTick();
    await delay(150); // Wait for page transition + render
  }
  
  // 2. Select tab (AdventurePage, TownPage, etc.)
  if (where.tab) {
    const tabBtn = document.querySelector(`[data-tutorial-target="tab_${where.tab}"]`);
    if (tabBtn && !tabBtn.classList.contains('active')) {
      tabBtn.click();
      await nextTick();
      await delay(100);
    }
  }
  
  // 3. Select hero — synthetic click on hero card
  if (where.heroId) {
    await clickTarget(`hero_card_${where.heroId}`);
  }
  
  // 4. Open modal — synthetic click on action button
  if (where.modal) {
    await clickTarget(`hero_action_${where.modal}`);
  }
  
  // 5. Select region
  if (where.regionId) {
    await clickTarget(`region_card_${where.regionId}`);
  }
  
  // 6. Select expedition node
  if (where.expeditionId) {
    await clickTarget(`expedition_node_${where.expeditionId}`);
  }
  
  // 7. Navigate to building
  if (where.buildingId) {
    await clickTarget(`building_${where.buildingId}`);
  }
}

// Retry logic for v-for rendered dynamic content
async function clickTarget(targetId, maxRetries = 5) {
  for (let i = 0; i < maxRetries; i++) {
    const el = document.querySelector(`[data-tutorial-target="${targetId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await delay(100);
      el.click();
      await nextTick();
      await delay(50);
      return true;
    }
    await delay(100 + (i * 50));
    await nextTick();
  }
  console.warn(`Tutorial target not found: ${targetId}`);
  return false;
}
```

**Why synthetic clicks work:**
- `HeroListItem` emits `select(hero.id)` → `HeroesPage.selectedHeroId = heroId`
- `HeroActionBar` emits `action(action.id)` → `HeroesPage.activeModal = actionId`
- `ExploreTab` region items call `selectRegion(regionId)`
- `ExploreTab` tree nodes call `handleNodeClick(node)`
- `VillageCanvas` emits `navigate(tile.id)`
- All via existing click handlers — **zero page logic changes**

---

### 5.3 `data-tutorial-target` Attribute Registry

The `what.target` value maps 1:1 to a `data-tutorial-target` attribute. Each attribute added is **one line** in the component template.

| Target ID | Component | Attribute |
|---|---|---|
| `footer_nav_village` | `FooterNav.vue` | `:data-tutorial-target="'footer_nav_' + item.id"` |
| `footer_nav_heroes` | `FooterNav.vue` | `:data-tutorial-target="'footer_nav_' + item.id"` |
| `footer_nav_adventure` | `FooterNav.vue` | `:data-tutorial-target="'footer_nav_' + item.id"` |
| `footer_nav_town` | `FooterNav.vue` | `:data-tutorial-target="'footer_nav_' + item.id"` |
| `footer_nav_book` | `FooterNav.vue` | `:data-tutorial-target="'footer_nav_' + item.id"` |
| `tab_explore` | `TabNav.vue` | `:data-tutorial-target="'tab_' + tab.id"` |
| `tab_bestiary` | `TabNav.vue` | `:data-tutorial-target="'tab_' + tab.id"` |
| `tab_codex` | `TabNav.vue` | `:data-tutorial-target="'tab_' + tab.id"` |
| `tab_chronicle` | `TabNav.vue` | `:data-tutorial-target="'tab_' + tab.id"` |
| `hero_card_arthur` | `HeroListItem.vue` | `:data-tutorial-target="'hero_card_' + hero.id"` |
| `hero_action_skills` | `HeroActionBar.vue` | `:data-tutorial-target="'hero_action_' + action.id"` |
| `hero_action_trainer` | `HeroActionBar.vue` | `:data-tutorial-target="'hero_action_' + action.id"` |
| `hero_stats_grid` | `HeroStatsGrid.vue` | `data-tutorial-target="hero_stats_grid"` |
| `hero_stat_assign_baseStrength` | `HeroStatsGrid.vue` | `:data-tutorial-target="'hero_stat_assign_' + stat.key"` |
| `region_card_reg_greenfields` | `ExploreTab.vue` | `:data-tutorial-target="'region_card_' + regionId"` |
| `expedition_node_exp_tutorial_cave` | `ExploreTab.vue` | `:data-tutorial-target="'expedition_node_' + node.id"` |
| `building_farm` | `VillageCanvas.vue` | `:data-tutorial-target="'building_' + tile.id"` |
| `day_advance_button` | `TopBar.vue` | `data-tutorial-target="day_advance_button"` |

---

### 5.4 TutorialOverlay.vue — Root Component

```vue
<template>
  <Teleport to="body">
    <div v-if="active" class="tutorial-overlay">
      <!-- Spotlight hole — transparent with massive box-shadow -->
      <div
        v-if="spotlight && !darkeningDismissed"
        class="spotlight-hole"
        :style="spotlightStyle"
      />
      
      <!-- Message bubble -->
      <TutorialMessage
        :messages="currentMessages"
        :current-index="messageIndex"
        :position="messagePosition"
        @advance="advanceMessage"
      />
      
      <!-- Click capture layer -->
      <div class="click-capture" @click="handleOverlayClick" />
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { useGameState } from './composables/useGameState.js';
import TutorialMessage from './TutorialMessage.vue';

const { gameState } = useGameState();
const tutorial = computed(() => gameState.value?.tutorial || null);
const active = computed(() => !!tutorial.value);
const darkeningDismissed = ref(false);
const messageIndex = ref(0);

// Watch step changes → enforce navigation
watch(() => tutorial.value?.stepId, async (stepId) => {
  if (!stepId) return;
  messageIndex.value = 0;
  darkeningDismissed.value = false;
  if (tutorial.value?.where) {
    await enforceWhere(tutorial.value.where);
  }
}, { immediate: true });

const spotlight = computed(() => {
  if (!tutorial.value?.what?.target) return null;
  const el = document.querySelector(`[data-tutorial-target="${tutorial.value.what.target}"]`);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  const padding = tutorial.value.what.padding || 8;
  return {
    x: rect.left - padding,
    y: rect.top - padding,
    width: rect.width + (padding * 2),
    height: rect.height + (padding * 2),
    rounded: tutorial.value.what.rounded !== false,
    flash: tutorial.value.what.flash || false
  };
});

const spotlightStyle = computed(() => {
  if (!spotlight.value) return {};
  const s = spotlight.value;
  return {
    position: 'fixed',
    left: `${s.x}px`,
    top: `${s.y}px`,
    width: `${s.width}px`,
    height: `${s.height}px`,
    borderRadius: s.rounded ? 'var(--radius-md)' : '0',
    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75)',
    pointerEvents: 'none',
    animation: s.flash ? 'tutorial-flash 2s infinite alternate' : 'none',
    zIndex: 9998
  };
});

const currentMessages = computed(() => tutorial.value?.messages || []);

const messagePosition = computed(() => {
  if (!spotlight.value) return { x: 20, y: 20 };
  const s = spotlight.value;
  return { x: s.x, y: s.y + s.height + 16 };
});

function advanceMessage() {
  if (messageIndex.value < currentMessages.value.length - 1) {
    messageIndex.value++;
  }
  // If all messages shown, wait for until() to auto-advance
}

function handleOverlayClick() {
  if (!darkeningDismissed.value) {
    darkeningDismissed.value = true;
  } else {
    advanceMessage();
  }
}

// Clicking the spotlight target itself passes through (pointer-events: none on hole)
// Clicking outside the hole triggers handleOverlayClick
</script>

<style>
.tutorial-overlay {
  position: fixed;
  inset: 0;
  z-index: 9997;
  pointer-events: auto;
}

@keyframes tutorial-flash {
  0% { box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7); }
  100% { box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.85); }
}
</style>
```

---

### 5.5 Navigation Prevention

**FooterNav Tab Locking:**
```vue
<!-- App.vue -->
<FooterNav
  :current="currentPage"
  :items="navItems"
  :locked-tabs="tutorialLockedTabs"
  @navigate="handlePageChange"
/>
```

```vue
<!-- FooterNav.vue — add locked-tabs prop -->
<script setup>
const props = defineProps({
  current: { type: String, required: true },
  items: { type: Array, required: true },
  lockedTabs: { type: Array, default: () => [] }
})
</script>
```

**Modal Locking:**
```vue
<!-- ModalFrame.vue — add tutorialLocked prop -->
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

**Global Click Interception:**
The `TutorialOverlay` captures all clicks. The spotlight hole has `pointer-events: none`, so clicks on the target element pass through. Clicks outside the hole:
1. First click: dismiss darkening
2. Subsequent clicks: advance message (if messages remain)

---

### 5.6 useTutorial.js — Composable

```js
export function useTutorial() {
  const { gameState } = useGameState();
  const tutorial = computed(() => gameState.value?.tutorial || null);
  
  const isActive = computed(() => !!tutorial.value);
  const lockedTabs = computed(() => {
    if (!isActive.value) return [];
    const where = tutorial.value?.where;
    // Lock all tabs except the current page and allowed navigation targets
    const allTabs = ['village', 'heroes', 'adventure', 'town', 'book'];
    const allowed = [where?.page].filter(Boolean);
    return allTabs.filter(t => !allowed.includes(t));
  });
  
  const allowedActions = computed(() => tutorial.value?.allowActions || []);
  
  // Navigation guard
  function canNavigate(tabId) {
    if (!isActive.value) return true;
    return !lockedTabs.value.includes(tabId);
  }
  
  // Action guard — checked in EngineAdapter.dispatch()
  function canDispatch(actionKey) {
    if (!isActive.value) return true;
    if (allowedActions.value.length === 0) return true;
    return allowedActions.value.includes(actionKey);
  }
  
  return {
    isActive,
    lockedTabs,
    allowedActions,
    canNavigate,
    canDispatch
  };
}
```

**Note:** No `reportStepCompletion`, no `forcedNav`, no `TutorialBus`. Step advancement is handled entirely by `TutorialService.evaluate(engine)` — the `until()` lambda checks engine state on every update cycle.

---

## 6. Component-by-Component Wiring — `data-tutorial-target` Only

The only changes needed in existing components are **adding `data-tutorial-target` attributes**. No event emitters, no ref exposure, no tutorial logic.

### FooterNav.vue
```vue
<button
  v-for="item in items"
  :key="item.id"
  :data-tutorial-target="'footer_nav_' + item.id"
  ...
>
```

### TabNav.vue
```vue
<button
  v-for="tab in tabs"
  :key="tab.id"
  :data-tutorial-target="'tab_' + tab.id"
  ...
>
```

### HeroListItem.vue
```vue
<button
  class="hero-list-item"
  :data-tutorial-target="'hero_card_' + hero.id"
  ...
>
```

### HeroActionBar.vue
```vue
<button
  v-for="action in visibleActions"
  :key="action.id"
  :data-tutorial-target="'hero_action_' + action.id"
  ...
>
```

### HeroStatsGrid.vue
```vue
<div class="stats-grid" data-tutorial-target="hero_stats_grid">
  <div v-for="stat in stats" :key="stat.id" ...>
    ...
    <button
      v-if="canAllocate && stat.key"
      :data-tutorial-target="'hero_stat_assign_' + stat.key"
      ...
    >+</button>
  </div>
</div>
```

### ExploreTab.vue — Region List
```vue
<div
  v-for="[regionId, regionData] in regionEntries"
  :key="regionId"
  :data-tutorial-target="'region_card_' + regionId"
  ...
>
```

### ExploreTab.vue — Tree Nodes
```vue
<div
  v-for="node in levelNodes"
  :key="node.id"
  :data-id="node.id"
  :data-tutorial-target="'expedition_node_' + node.id"
  ...
>
```

### VillageCanvas.vue
```vue
<button
  v-for="tile in tiles"
  :key="tile.id"
  :data-tutorial-target="'building_' + tile.id"
  ...
>
```

### TopBar.vue
```vue
<button
  class="btn-next-day"
  data-tutorial-target="day_advance_button"
  @click="$emit('nextDay')"
>
```

### BookPage.vue
1. Track `hasBeenClosed` in component state.
2. On first close during Day 1, emit `book-first-closed` event.
3. `App.vue` catches this and dispatches `recordEvent({ type: 'book_first_closed', day: 1 })` to the engine.
4. `TutorialService.evaluateTriggers()` sees the event and starts `tutorial_hero_skills`.

---

## 7. i18n Design

### Translation Keys (4 Languages: EN, ES, CA, GL, EU)

```js
// tutorial_en.js (pattern: tutorial_{tutorialId}_{stepId}_{purpose})
export const tutorial_en = {
  tutorial_hero_skills_msg_navigate_heroes: 'Your heroes are the heart of the village. Tap here to see them.',
  tutorial_hero_skills_msg_select_arthur: 'This is Arthur, your first hero. Let\'s take a look at him.',
  tutorial_hero_skills_msg_learn_skill: 'Arthur can learn a new fighting technique. Tap this button to open his skills.',
  tutorial_hero_stats_msg_assign_stats: 'As heroes grow, they gain points to improve their strength, speed, and other stats.',
  tutorial_build_farm_msg_navigate_village: 'Let\'s build a farm to produce food for the village.',
  tutorial_build_farm_msg_construct_farm: 'Tap here to start construction. It will take some time.',
  tutorial_expeditions_msg_navigate_explore: 'The world beyond the village holds dangers and treasures. Let\'s explore!',
  tutorial_expeditions_msg_select_region: 'The Greenfields are the safest place to start your adventures.',
  tutorial_expeditions_msg_select_expedition: 'This cave is a good first challenge. Tap it to send Arthur inside.',
  tutorial_expeditions_msg_advance_day: 'When you\'re ready, advance to the next day to see what happens.',
};
```

**i18n Enforcement Rules (Zero Hardcoded Strings):**
- All tutorial messages MUST be declared as i18n keys in `TutorialRegistry.js`, never as literal strings.
- `TutorialOverlay.vue` and `TutorialMessage.vue` MUST resolve keys via the existing `i18n` service (injected from the engine), never embed English fallback text in the template.
- No `v-if` branches on language inside tutorial components; all translations live in the `tutorial_{lang}.js` files.
- **Validation gate:** Add a `validateTutorialKeys()` unit test that asserts every key referenced in `TutorialRegistry` exists in all 5 language files. This test runs in Phase 1, before any Vue component is written.
- **Ghost key prevention:** The acceptance criteria includes a check that no tutorial key is defined in translations but never referenced in the registry (unused keys bloat the bundle).

---

## 8. Test Plan

### 8.1 Screenshot Test Scripts — Tutorial Orchestrator Scenarios

The existing screenshot orchestrator (`scripts/screenshots/orchestrator.mjs`) must be extended to **drive the tutorial visually and assert overlays at each step**. This is not just "add a test" — the orchestrator itself needs new capabilities to detect tutorial state from the rendered DOM.

#### New Orchestrator Capabilities Required

| Capability | Purpose | Implementation |
|---|---|---|
| `assertTutorialOverlayVisible` | Confirms the darkening overlay is rendered and a `data-tutorial-active` attribute is present on `<body>` | DOM query for `.tutorial-overlay` or `document.body.dataset.tutorialActive` |
| `assertSpotlightTarget` | Confirms the spotlight hole is positioned over the expected element | Query `[data-tutorial-target="{id}"]`, read `getBoundingClientRect()`, compare with `.spotlight-hole` rect (within 10px tolerance) |
| `assertMessageText` | Confirms the i18n message is rendered in the correct language | Read `.tutorial-message` text, compare with expected translation from test fixture (do NOT rely on English default) |
| `assertModalLocked` | Confirms Escape key and overlay click do NOT close the modal | Send `Escape` key event, screenshot, assert modal still present; click overlay, assert modal still present |
| `assertTabLocked` | Confirms locked tabs are visually disabled and clicking them does nothing | Click locked tab, screenshot, assert page did not change |
| `assertTutorialStateAfterReload` | Saves the game mid-tutorial, reloads the page, asserts the tutorial resumes at the same step | Use `localStorage` snapshot → reload → wait for engine init → assert `tutorial` state in `gameState` |

#### New Screenshot Scenarios

Add these scenarios to the orchestrator's scenario list. Each step produces a named screenshot for visual regression. The Day 1 chain spans 4 tutorials with a total of 10 steps:

```js
{
  id: 'tutorial_day1_chain_full_flow',
  description: 'Complete Day 1 tutorial chain (hero_skills → hero_stats → build_farm → expeditions)',
  language: 'en',
  steps: [
    { action: 'start_new_game', assert: 'book_open' },
    { action: 'close_book', assert: 'tutorial_overlay_heroes_tab', screenshot: '01_tutorial_heroes_tab_overlay' },
    { action: 'click_anywhere', assert: 'darkening_dismissed_spotlight_remains', screenshot: '02_tutorial_heroes_tab_spotlight' },
    { action: 'navigate_tab', tab: 'heroes', assert: 'tutorial_overlay_arthur_card', screenshot: '03_tutorial_arthur_card' },
    { action: 'click_hero', heroId: 'arthur', assert: 'tutorial_overlay_learn_skill_button', screenshot: '04_tutorial_learn_skill_button' },
    { action: 'click_action', action: 'learn_skill', assert: 'modal_open_learn_skill', screenshot: '05_tutorial_learn_skill_modal_locked' },
    { action: 'assert_modal_locked', assert: 'escape_blocked_overlay_click_blocked', screenshot: '06_tutorial_modal_locked_proof' },
    { action: 'select_skill', familyId: 'power_strike', assert: 'tutorial_overlay_stat_grid', screenshot: '07_tutorial_stat_grid' },
    { action: 'assign_stat', statId: 'str', assert: 'tutorial_overlay_village_tab', screenshot: '08_tutorial_village_tab' },
    { action: 'construct_building', buildingId: 'farm', assert: 'tutorial_overlay_explore_tab', screenshot: '09_tutorial_explore_tab' },
    { action: 'navigate_tab', tab: 'adventure', assert: 'tutorial_overlay_region_greenfields', screenshot: '10_tutorial_region_greenfields' },
    { action: 'click_region', regionId: 'reg_greenfields', assert: 'tutorial_overlay_expedition_cave', screenshot: '11_tutorial_expedition_cave' },
    { action: 'start_expedition', assert: 'tutorial_overlay_advance_day', screenshot: '12_tutorial_advance_day' },
    { action: 'advance_day', assert: 'tutorial_complete_no_overlay', screenshot: '13_tutorial_complete' },
  ]
},
{
  id: 'tutorial_chain_reload_mid_step',
  description: 'Reload during tutorial_hero_skills step 3 (learn skill) and assert resume',
  steps: [
    { action: 'start_new_game' },
    { action: 'close_book' },
    { action: 'navigate_tab', tab: 'heroes' },
    { action: 'click_hero', heroId: 'arthur' },
    { action: 'click_action', action: 'learn_skill' },
    { action: 'snapshot_localstorage' },
    { action: 'reload_page' },
    { action: 'assert_tutorial_state', expectedTutorial: 'tutorial_hero_skills', expectedStep: 'learn_skill', screenshot: '14_tutorial_resume_after_reload' },
    { action: 'select_skill', familyId: 'power_strike' },
    { action: 'assert_tutorial_advance', expectedTutorial: 'tutorial_hero_stats', expectedStep: 'assign_stats', screenshot: '15_tutorial_resumed_advance' },
  ]
},
{
  id: 'tutorial_i18n_roundtrip',
  description: 'Run tutorial chain in Spanish and assert all messages are translated',
  language: 'es',
  steps: [
    { action: 'start_new_game', language: 'es' },
    { action: 'close_book', assert: 'tutorial_overlay_heroes_tab' },
    { action: 'assert_message_text', key: 'tutorial_hero_skills_msg_navigate_heroes', language: 'es', screenshot: '16_tutorial_es_heroes_tab' },
  ]
}
```

#### Screenshot Audit Pipeline Update

`scripts/screenshots/audit.mjs` must be updated to include a **tutorial overlay check** in its existing visual regression pass. Specifically:
1. After the `book` feature audit, add a `tutorial` audit pass that runs the `tutorial_day1_chain_full_flow` scenario.
2. If a screenshot is missing (e.g., `07_tutorial_stat_grid`), the audit fails with a clear message: `Tutorial step 'day1_assign_stats' did not produce expected spotlight overlay`.
3. The `audit.mjs` report should include a new section: `Tutorial Flow` with ✅/❌ for each of the 13 screenshots.

#### Audit.mjs Update Plan

| File | Change |
|---|---|
| `scripts/screenshots/orchestrator.mjs` | Add `tutorial_day1_chain_full_flow`, `tutorial_chain_reload_mid_step`, `tutorial_i18n_roundtrip` scenarios; add new action handlers: `assert_modal_locked`, `assert_tutorial_state`, `snapshot_localstorage`, `reload_page` |
| `scripts/screenshots/audit.mjs` | Add `tutorial` pass to the audit pipeline; import tutorial expected screenshots list; compare against `screenshots/tutorial/` directory |
| `scripts/screenshots/README.md` | Document new tutorial actions and how to run `npm run test:tutorial` or `npm run audit:tutorial` |

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
  "activeTutorialId": "tutorial_hero_skills",
  "currentStepIndex": 2,
  "completedTutorialIds": [],
  "stepData": { "selectedHeroId": "arthur", "learnedFamilyId": "power_strike" }
}
```

### Migration Path

Existing saves have no `tutorial_state`. On `GameEngine.initialize()` for existing saves:
1. If `day > 1`, mark all Day 1 tutorials as completed (the player already knows the game).
2. If `day === 1` and no tutorial state exists, the player may have started before this feature. Start the Day 1 chain (first tutorial: `tutorial_hero_skills`) only if they haven't completed the first expedition yet. Otherwise, mark all Day 1 tutorials as completed.

### Backfill Logic (in `GameEngine.initialize()`)

```js
const tutorialState = this.persistence.load(`rpg_village_v1_slot${slotIndex}_tutorial_state`, null);
if (!tutorialState && !this.isNewGame) {
  const completedExpeditions = this.expeditionService.getCompletedIds().length;
  if (completedExpeditions > 0 || (villageState.day || 1) > 1) {
    this.tutorialService.state.completedTutorialIds.push('tutorial_hero_skills');
    this.tutorialService.state.completedTutorialIds.push('tutorial_hero_stats');
    this.tutorialService.state.completedTutorialIds.push('tutorial_build_farm');
    this.tutorialService.state.completedTutorialIds.push('tutorial_expeditions');
    this.tutorialService._save();
  }
}
```

---

## 10. Documentation Updates

The tutorial system is documented in `docs/tutorial/` following the project's established pattern (`docs/{domain}/` for domain docs, concise system definitions).

### Files to Create

| File | Content |
|---|---|
| `docs/tutorial/tutorial_system.md` | **System definition.** How the tutorial engine works: state machine, persistence, spotlight mechanism, forced navigation, modal locking, and how to add a new tutorial to the registry. One concise architecture overview, no boilerplate. |
| `docs/tutorial/tutorial_points.md` | **All tutorial flows.** The Day 1 chain (10 steps across 4 tutorials) and placeholder entries for future tutorials (gambits, magic circle, shop unlock, tavern built, first spell, etc.). Each entry: trigger condition, prerequisites, step sequence, spotlight targets, completion events. This is the canonical registry reference. |

### What These Files Are NOT
- No player walkthroughs (the game UI itself teaches the player)
- no copy-paste templates (the registry code is self-documenting)
- no screenshot artifacts (those live in `scripts/screenshots/outputs/`)
- no translation guides (i18n conventions are in `docs/shared/core/i18n.md`)

### Files to Update (Minimal)

| File | Change |
|---|---|
| `docs/shared/core/i18n.md` | Add one line under the key naming convention: `tutorial_{id}_{step}_msg` |
| `docs/developer_workflow.md` | If it exists, add `docs/tutorial/` to the docs index list |

---

## 11. Implementation Order
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
2. Modify `App.vue` — catch `book-first-closed`, dispatch `recordEvent({ type: 'book_first_closed', day: 1 })` to trigger the tutorial chain via `evaluateTriggers()`
3. Modify `HeroesPage.vue` — force-select Arthur, lock tabs, detect skill/stat completion
4. Modify `HeroActionBar.vue` — emit `skill-learned` event
5. Modify `HeroStatsGrid.vue` — emit `stat-assigned` event
6. Modify `ExploreTab.vue` — force region/expedition selection
7. Modify `ExpeditionNode.vue` — emit `expedition-started` event
8. **Test:** Full screenshot flow `tutorial_day1_chain_full_flow`

### Phase 4: Documentation & Screenshot Integration
1. Update `scripts/screenshots/orchestrator.mjs` with tutorial actions (`assert_modal_locked`, `assert_tutorial_state`, `snapshot_localstorage`, `reload_page`)
2. Update `scripts/screenshots/audit.mjs` with tutorial pass and expected screenshot list
3. Run `tutorial_day1_chain_full_flow` scenario and capture all 13 screenshots
4. Create `docs/tutorial/tutorial_system.md` — concise system definition (state machine, persistence, spotlight, forced nav, modal lock, how to add a tutorial)
5. Create `docs/tutorial/tutorial_points.md` — all tutorial flows: Day 1 chain (10 steps across 4 tutorials) and future templates (gambits, magic circle, shop, tavern, etc.)
6. Update `docs/shared/core/i18n.md` — add `tutorial_{id}_{step}_msg` to the key naming convention
7. Run `validateTutorialKeys()` test across all 5 languages; fix any missing keys
8. Verify migration/backfill logic on old saves
9. Run full screenshot suite and fix any visual regressions

### Phase 5: Extensibility & Polish
1. Add `TutorialRegistry` entries for future tutorials (shop, tavern, etc.) — can be commented out as templates
2. Add skip gesture for testing (triple-click message)
3. Add subtle "shake" animation on locked tabs when user tries to click them
4. Final acceptance criteria sign-off

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

- [ ] Starting a new game shows the book. Closing it on Day 1 triggers the first tutorial (`tutorial_hero_skills`).
- [ ] `tutorial_hero_skills` darkens the screen and highlights the Heroes tab. Clicking anywhere dismisses the darkening but the tab is still highlighted.
- [ ] The user is forced to the Heroes tab. Arthur is auto-selected. The "Learn Skill" button is highlighted.
- [ ] Clicking "Learn Skill" opens the modal. The modal cannot be closed until a skill is selected.
- [ ] After learning a skill, `tutorial_hero_stats` auto-starts. The stat grid is highlighted.
- [ ] After spending a stat point, `tutorial_build_farm` auto-starts. The user is forced to the Village tab.
- [ ] After constructing the farm, `tutorial_expeditions` auto-starts. The user is forced to the Adventure tab.
- [ ] The Greenfields region is highlighted, then the Tutorial Cave node is highlighted.
- [ ] After starting the expedition, the tutorial advances to "advance day".
- [ ] Reloading the page at any step restores the tutorial exactly at that step, with the correct spotlight and message.
- [ ] Existing saves (Day > 1 or any expedition completed) never see the Day 1 tutorial chain.
- [ ] All tutorial text is translated in 5 languages. **Validation:** `validateTutorialKeys()` passes with zero missing keys and zero ghost keys.
- [ ] Screenshot tests cover all Day 1 tutorial steps across all 4 tutorials (including reload-resume and i18n roundtrip). **Validation:** `audit.mjs` tutorial pass reports all ✅.
- [ ] Future tutorials (e.g. `tutorial_gambits`) auto-start when their trigger condition is met (e.g. gambits feature unlocked) with zero engine changes.

---

**Plan written by:** Clawdio (Architect Mode)  
**Branch:** `dev_workflow` (`.dev_workflow/implementation_plans/4_tutorial.md`)  
**Date:** 2026-06-23  
**Status:** Ready for implementation
