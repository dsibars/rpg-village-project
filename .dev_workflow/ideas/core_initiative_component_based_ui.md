# Core Initiative: Component-Based UI Architecture

> **Status:** Idea / Architectural Vision
>
> **Scope:** Presentation Layer (`js/presentation/`, `pages/`, `css/`)
>
> **Goal:** Replace the current "god-view" imperative pattern with a true component-composition model, enabling maintainability, portability, and developer clarity.

---

## 1. Context & Motivation

The RPG Village engine layer (`js/engine/`) follows a clean Domain-Driven Design with bounded contexts, services, and models. The presentation layer, however, has drifted into an architectural antipattern: **smart god-views with dumb helper fragments**.

This initiative defines the target architecture for the presentation layer. It does **not** contain a migration roadmap; those will be written as separate implementation plans per domain/feature.

---

## 2. Current State Analysis

### 2.1 Symptoms

| Symptom | Evidence | Impact |
|---------|----------|--------|
| **God Views** | `CombatView.js` (1,094 lines), `GambitView.js` (962 lines), `MagicCircleView.js` (712 lines) | A single feature change requires reading and editing a 1,000-line file. |
| **Ghost Components** | `HeroProfilePane` returns `{root, update}` but receives 14 callback props and owns zero state | Components are "render helpers," not self-contained units. |
| **Scattered Features** | The "Training Grounds" concept lives across `HeroProfilePane.js`, `HeroesView.js`, `HeroTrainingModals.js`, and `EngineAdapter.js` | No single file represents a feature. |
| **Global Singleton Overlays** | `UIController` instantiates `CombatView`, `GambitView`, `MagicCircleView`, `EquipmentView` globally | Overlays cannot be composed or instantiated multiple times. |
| **Template/JS Schism** | `pages/heroes.html` defines `<div id="hero-detail-content">`, but `HeroesView.js` immediately does `innerHTML = ''` and rebuilds the DOM via `el()` | Two sources of truth; the HTML is a lie. |
| **Manual Event Bus** | `EngineAdapter.js` wires events via `if (domain === 'heroes') { view.on('event', ...) }` | Adding a new UI action requires editing the adapter. |
| **State Coupling** | `BaseView.update(state)` pushes the entire global state to every view | Views must manually extract slices; every view knows the global state shape. |

### 2.2 Root Cause

The project has a **half-framework**: `el()` (hyperscript), `diffList()` (keyed reconciliation), and `BaseView` (lifecycle hooks) exist, but there is no **component contract** enforcing boundaries. Without a contract, agent sessions and manual edits alike optimize for "make it work" within the nearest file, leading to monolithic views and distributed logic.

---

## 3. Target Architecture: The Component Contract

### 3.1 Core Philosophy

> **A component is a self-contained unit that declares its inputs, emits its outputs, and owns its DOM fragment.**

This is directly analogous to Vue/React components, but implemented on top of our existing `el()`/`diffList()` primitives. We do not need to adopt a framework; we need to enforce a contract.

### 3.2 The Contract

Every component must satisfy the following:

```
Component({ props..., onEvent }) -> { root: HTMLElement, update(props...), destroy() }
```

#### 3.2.1 Input: Declared Props

A component receives **only** the data it needs. No global state.

```js
// ✅ GOOD: Declared dependencies
function GambitList({ gambits, maxSlots, t, onMove, onToggle, onRemove }) { ... }

// ❌ BAD: Coupled to global state shape
function GambitList({ state, ui, heroId }) { ... }
```

#### 3.2.2 Output: Event Emission

A component emits events via callbacks. It does not call engine methods directly.

```js
// ✅ GOOD: Component is agnostic of how the action is fulfilled
onMove(gambitId, direction);

// ❌ BAD: Component reaches through ui -> engine
this.ui.engine.moveHeroGambit(heroId, gambitId, direction);
```

#### 3.2.3 Lifecycle

Components have explicit lifecycle hooks:

```js
function MyComponent(props) {
    // 1. CONSTRUCT: Build the DOM tree
    const root = el('div', ...);

    // 2. UPDATE: Reconcile internal state against new props
    function update(newProps) { ... }

    // 3. DESTROY: Clean up listeners, intervals, etc.
    function destroy() { ... }

    return { root, update, destroy };
}
```

#### 3.2.4 DOM Ownership

A component creates and manages exactly one root DOM fragment. It never appends to `document.body` directly. The **parent** decides where the component lives.

```js
// ✅ GOOD: Parent controls mount point
const gambitList = GambitList({ ... });
container.appendChild(gambitList.root);

// ❌ BAD: Component hijacks the global DOM
this.overlay = el('div', ...);
document.body.appendChild(this.overlay);
```

### 3.3 Page vs. Component Distinction

| Concept | Responsibility | Example |
|---------|---------------|---------|
| **Page** | Shell layout, route-level state wiring, composition of components | `HeroesPage` mounts `HeroList`, `HeroDetail`, `TrainingGrounds` |
| **Component** | Renders a specific UI concern, owns its DOM, knows nothing of routing | `HeroMiniCard`, `GambitRow`, `StatGrid` |
| **Overlay** | A component rendered in a portal/modal container | `GambitEditor` is a component; the modal frame is infrastructure |

Pages are thin. They compose components and wire events to the adapter/engine. They do not build DOM imperatively.

---

## 4. State Management Pattern

### 4.1 Problem with Current Approach

```js
// Current: UIController pushes global state
update(state) {
    this.combatView.update(state);
    this.activeView.update(state);
}
```

Every view receives the entire state tree. Views must diff internally to avoid re-rendering. This is backwards: the state manager should notify only the components whose props changed.

### 4.2 Target: Selective Propagation

The page/view layer acts as a **selector**. It subscribes to state changes, extracts the relevant slices, and passes them as props to components.

```js
// Target: HeroesPage wires state to components
function HeroesPage({ engine, i18n, container }) {
    const heroes = engine.heroService.getAll();
    const infra = engine.villageService.getInfrastructure();

    const heroList = HeroList({
        heroes,
        onSelect: (heroId) => { ... }
    });

    const heroDetail = HeroDetail({
        hero: heroes.find(h => h.id === selectedId),
        infra,
        onAction: (action, payload) => { ... }
    });

    container.append(heroList.root, heroDetail.root);

    // When state changes, only update the component that needs it
    function onStateChange(newState) {
        heroList.update({ heroes: newState.heroes });
        if (selectedHeroChanged) {
            heroDetail.update({ hero: newState.heroes.find(...) });
        }
    }
}
```

### 4.3 The Adapter's New Role

`EngineAdapter` should become a **thin event translator**, not a giant switch statement:

```js
// Target: Adapter translates component events to engine calls
function createHeroesAdapter(engine, ui) {
    return {
        onHeroAction: (action, payload) => {
            const result = engine.handleHeroAction(action, payload);
            if (!result.success) ui.showToast(result.error);
            return result;
        }
    };
}
```

Individual views/pages no longer emit 20 different event names (`increaseStat`, `equipItem`, `learnFamily`, etc.). They emit a generic action with a type and payload, and the adapter dispatches it.

---

## 5. Directory Structure

The current structure mixes concerns by domain. The target structure separates **infrastructure** from **features**:

```
js/presentation/
├── core/                          # Framework infrastructure
│   ├── Component.js               # Base component contract & factory
│   ├── Page.js                    # Page mount/unmount lifecycle
│   ├── StateRouter.js             # Selective state propagation
│   └── DOMUtils.js                # el(), diffList() (unchanged)
├── components/                    # Reusable UI components (domain-agnostic)
│   ├── ModalFrame.js
│   ├── Button.js
│   ├── ResourceBar.js
│   ├── HeroMiniCard.js
│   └── StatRow.js
├── features/                      # Domain-specific components
│   ├── heroes/
│   │   ├── HeroesPage.js          # Thin composition layer
│   │   ├── HeroList.js
│   │   ├── HeroDetail.js
│   │   ├── TrainingGrounds.js     # Self-contained: trainer, witch, academy buttons
│   │   ├── StatAllocationGrid.js
│   │   └── modals/
│   │       ├── TrainerModal.js
│   │       ├── WitchModal.js
│   │       └── EquipmentModal.js
│   ├── combat/
│   │   ├── CombatPage.js
│   │   ├── CombatHeader.js
│   │   ├── CombatActorGrid.js
│   │   ├── CombatActionPanel.js
│   │   ├── CombatLogConsole.js
│   │   └── CombatResolutionPane.js
│   ├── gambit/
│   │   ├── GambitEditor.js        # Was GambitView (962 lines -> ~100)
│   │   ├── GambitList.js
│   │   ├── GambitRow.js
│   │   ├── GambitForm.js          # Add-new-gambit form
│   │   └── GambitTestSetup.js     # Was static method inside GambitView
│   └── shared/
│       └── overlays/
│           ├── MagicCircleEditor.js
│           └── EquipmentOverlay.js
├── adapters/
│   └── EngineAdapter.js           # Thin, generic action dispatch
└── app.js                         # Bootstrap: create adapter, mount shell
```

**Key rule:** A file in `features/<domain>/` represents **one UI concern**. If it exceeds 250 lines, it must be split into sub-components.

---

## 6. Code Samples: Before vs. After

### 6.1 Component: GambitRow

#### Before (inline inside GambitView, 58 lines, unreachable from outside)

```js
// Inside GambitView.js (line 56)
createGambitRow(g, idx, totalCount, t, onMove, onToggle, onRemove) {
    return el('div', {
        class: ['gambit-row-v1', g.enabled === false ? 'gambit-disabled' : ''],
        'data-id': g.id,
        style: { display: 'flex', alignItems: 'center', padding: '10px', ... }
    }, [
        el('div', { class: 'gambit-idx', style: { width: '30px', ... } }, String(idx + 1)),
        el('div', { class: 'gambit-content', style: { flex: '1' } }, [
            el('div', { class: 'gambit-rule-text' }, [
                GambitView.formatGambitRule(g, t)  // Static dependency on parent class!
            ])
        ]),
        el('div', { class: 'gambit-actions', style: { display: 'flex', gap: '6px' } }, [
            el('button', { onClick: (e) => { e.stopPropagation(); onMove(g.id, -1); } }, '▲'),
            el('button', { onClick: (e) => { e.stopPropagation(); onMove(g.id, 1); } }, '▼'),
            el('button', { onClick: (e) => { e.stopPropagation(); onToggle(g.id); } },
                g.enabled === false ? t('gambit_uxelm_enable') : t('gambit_uxelm_disable')),
            el('button', { onClick: (e) => { e.stopPropagation(); onRemove(g.id); } }, '×')
        ])
    ]);
}
```

**Problems:**
- Inaccessible outside `GambitView`
- Hardcoded styles mixed with logic
- Depends on `GambitView.formatGambitRule()` static method
- Receives `t` as a parameter rather than using a shared i18n context

#### After (self-contained component, reusable)

```js
// js/presentation/features/gambit/components/GambitRow.js
import { el } from '../../../core/DOMUtils.js';
import { formatGambitRule } from '../formatGambitRule.js';

export function GambitRow({ gambit, index, totalCount, t, onMove, onToggle, onRemove }) {
    const row = el('div', {
        class: ['gambit-row', gambit.enabled === false ? 'gambit-disabled' : ''],
        'data-id': gambit.id
    });

    const idxLabel = el('span', { class: 'gambit-idx' }, String(index + 1));
    const ruleText = el('div', { class: 'gambit-rule-text' });
    const actions = el('div', { class: 'gambit-actions' });

    row.append(idxLabel, ruleText, actions);

    function renderActions() {
        actions.innerHTML = '';
        actions.append(
            MoveButton({ direction: -1, disabled: index === 0, onClick: () => onMove(gambit.id, -1) }),
            MoveButton({ direction: 1, disabled: index === totalCount - 1, onClick: () => onMove(gambit.id, 1) }),
            ToggleButton({ enabled: gambit.enabled, t, onClick: () => onToggle(gambit.id) }),
            RemoveButton({ onClick: () => onRemove(gambit.id) })
        );
    }

    function update({ gambit: newGambit, index: newIndex, totalCount: newTotal }) {
        // Only re-render what changed
        if (newGambit.enabled !== gambit.enabled) {
            row.classList.toggle('gambit-disabled', newGambit.enabled === false);
        }
        ruleText.innerHTML = '';
        ruleText.appendChild(formatGambitRule(newGambit, t));
        renderActions();
    }

    ruleText.appendChild(formatGambitRule(gambit, t));
    renderActions();

    return { root: row, update };
}
```

**Improvements:**
- Importable anywhere
- Uses CSS classes for styling (styles move to CSS)
- No dependency on parent class
- Granular `update()` can be optimized further if needed

### 6.2 Page: HeroesPage

#### Before (HeroesView.js, 317 lines)

```js
export class HeroesView extends BaseView {
    constructor() { super('heroes'); this.selectedHeroId = null; }

    onMount() {
        // Query DOM from template
        this.elements = { list: this.$('#heroes-list-container'), detail: this.$('#hero-detail-content') };
        // Initialize profile pane with 14 callbacks
        this.profilePane = createHeroProfilePane({ onAllocateStat: ..., onOpenTrainer: ..., ... });
        this.elements.detail.innerHTML = '';
        this.elements.detail.appendChild(this.profilePane.root);
    }

    onUpdate(state) {
        this.renderHeroesList(state.heroes);
        this.renderHeroDetail(state);
    }

    renderHeroesList(heroes) {
        const newCards = heroes.map(hero => createHeroMiniCard({ ... }).root);
        diffList(this.elements.list, newCards, 'data-id');
    }

    _openTrainerModal() { TrainerModal.show(...); }
    _openWitchModal() { WitchModal.show(...); }
    // ... 8 more modal openers
}
```

**Problems:**
- Mixes list rendering, detail rendering, modal orchestration, and state diffing
- Instantiates `HeroProfilePane` with 14 callbacks — the pane is not self-contained
- Modals are static methods on classes, not components

#### After (thin composition)

```js
// js/presentation/features/heroes/HeroesPage.js
import { HeroList } from './components/HeroList.js';
import { HeroDetail } from './components/HeroDetail.js';
import { TrainingGrounds } from './components/TrainingGrounds.js';

export function HeroesPage({ container, state, adapter, i18n }) {
    let selectedHeroId = null;

    const heroList = HeroList({
        heroes: state.heroes,
        t: i18n.t,
        onSelect: (id) => {
            selectedHeroId = id;
            refresh();
        }
    });

    const heroDetail = HeroDetail({
        hero: null,
        infra: state.village?.infrastructure,
        t: i18n.t,
        onAction: (action, payload) => adapter.dispatch('hero', action, payload)
    });

    const trainingGrounds = TrainingGrounds({
        hero: null,
        infra: state.village?.infrastructure,
        heroes: state.heroes,
        t: i18n.t,
        onAction: (action, payload) => adapter.dispatch('hero', action, payload)
    });

    // Compose layout
    container.appendChild(heroList.root);
    container.appendChild(heroDetail.root);
    // TrainingGrounds can live inside HeroDetail or alongside it —
    // HeroDetail composes it internally if it wants to.

    function refresh() {
        const hero = state.heroes.find(h => h.id === selectedHeroId);
        heroDetail.update({ hero, infra: state.village?.infrastructure });
        trainingGrounds.update({ hero, heroes: state.heroes, infra: state.village?.infrastructure });
    }

    function update(newState) {
        state = newState;
        heroList.update({ heroes: newState.heroes });
        refresh();
    }

    function destroy() {
        heroList.destroy();
        heroDetail.destroy();
        trainingGrounds.destroy();
    }

    return { update, destroy };
}
```

**Improvements:**
- Page is ~40 lines of composition
- Each component is independently testable
- `TrainingGrounds` can be moved to another page by importing it
- No inline HTML string building

### 6.3 Component: TrainingGrounds (The "Ghost Feature" Made Real)

```js
// js/presentation/features/heroes/components/TrainingGrounds.js
import { el } from '../../../core/DOMUtils.js';
import { Button } from '../../../components/Button.js';

const BUILDING_REQUIREMENTS = {
    trainer: { building: null, minLevel: 0 },          // Always available
    magicCircle: { building: 'arcane_sanctum', minLevel: 1 },
    witch: { building: 'witchs_hut', minLevel: 1 },
    academy: { building: 'arcane_sanctum', minLevel: 2 },
    hallOfFame: { building: null, minLevel: 0 },
    bodyInscription: { building: null, minLevel: 0 },  // Gated by hero eligibility
    gambits: { building: null, minLevel: 0 }            // Gated by party level
};

export function TrainingGrounds({ hero, infra, heroes, t, onAction }) {
    const buttons = {};
    const container = el('div', { class: 'training-grounds' });

    function createButtons() {
        buttons.trainer = Button({
            label: `💪 ${t('trainer_uxelm_title')}`,
            variant: 'secondary',
            onClick: () => onAction('openTrainer', { heroId: hero?.id })
        });

        buttons.magicCircle = Button({
            label: `🔮 ${t('magic_circle_uxelm_title')}`,
            variant: 'secondary',
            onClick: () => onAction('openMagicCircle', { heroId: hero?.id })
        });

        buttons.witch = Button({
            label: `🌙 ${t('witch_uxelm_title')}`,
            variant: 'secondary',
            onClick: () => onAction('openWitch', { heroId: hero?.id })
        });

        buttons.academy = Button({
            label: `📚 ${t('academy_uxelm_title')}`,
            variant: 'secondary',
            onClick: () => onAction('openAcademy', { heroId: hero?.id })
        });

        buttons.hallOfFame = Button({
            label: `🏆 ${t('hall_of_fame_uxelm_title')}`,
            variant: 'secondary',
            onClick: () => onAction('openHallOfFame', { heroId: hero?.id })
        });

        buttons.bodyInscription = Button({
            label: `✦ ${t('heroes_uxelm_inscription_title')}`,
            variant: 'secondary',
            onClick: () => onAction('openBodyInscription', { heroId: hero?.id })
        });

        buttons.gambits = Button({
            label: `🎲 ${t('gambit_uxelm_title')}`,
            variant: 'secondary',
            onClick: () => onAction('openGambits', { heroId: hero?.id })
        });

        Object.values(buttons).forEach(btn => container.appendChild(btn.root));
    }

    function update({ hero: newHero, infra: newInfra, heroes: newHeroes }) {
        hero = newHero;
        infra = newInfra;
        heroes = newHeroes;

        if (!hero) {
            container.style.display = 'none';
            return;
        }
        container.style.display = '';

        const isIdle = hero.activity === 'idle';
        const anyHeroLevel5 = (heroes || []).some(h => h.level >= 5);

        // Visibility & state updates per button
        buttons.magicCircle.update({ visible: (infra?.arcane_sanctum || 0) >= 1 });
        buttons.witch.update({ visible: (infra?.witchs_hut || 0) >= 1 });
        buttons.academy.update({ visible: (infra?.arcane_sanctum || 0) >= 2 });
        buttons.bodyInscription.update({ visible: hero.isInscriptionEligible });
        buttons.gambits.update({ visible: anyHeroLevel5 });

        // Disable buttons if hero is busy (where applicable)
        Object.values(buttons).forEach(btn => {
            btn.update({ disabled: !isIdle && btn !== buttons.hallOfFame });
        });
    }

    function destroy() {
        Object.values(buttons).forEach(btn => btn.destroy());
    }

    createButtons();
    return { root: container, update, destroy };
}
```

**Key insight:** `TrainingGrounds` is now a real thing. It lives in one file. It declares exactly which infrastructure it cares about. It can be rendered inside `HeroDetail`, or on the `VillagePage` next to the building list, or in a modal. The consuming page does not need to know which buttons exist or what their visibility rules are.

---

## 7. CSS Co-location Strategy

Current problem: Styles for `gambit-row` are inline in `el()` calls across `GambitView.js`. This scatters visual design across logic files.

Target: Each feature folder owns its CSS.

```
css/
├── core/                          # Tokens, variables, base
│   ├── tokens.css
│   └── base.css
├── components/                    # Shared component styles
│   ├── Button.css
│   ├── Modal.css
│   └── HeroMiniCard.css
└── features/                      # Feature-specific styles
    ├── heroes/
    │   ├── HeroList.css
    │   ├── HeroDetail.css
    │   └── TrainingGrounds.css
    ├── gambit/
    │   ├── GambitEditor.css
    │   ├── GambitRow.css
    │   └── GambitForm.css
    └── combat/
        ├── CombatPage.css
        ├── CombatActorGrid.css
        └── CombatLogConsole.css
```

**Rule:** No inline `style: { ... }` in `el()` calls except for dynamic values (e.g., `width: ${progress}%`). All static styling lives in CSS files.

---

## 8. Event & Adapter Contract

### 8.1 Component → Adapter Communication

Components emit semantic actions, not direct engine calls:

```js
// Component emits
onAction('equipItem', { heroId: 'hero_1', slot: 'weapon', itemId: 'sword_001' });

// Adapter translates
adapter.dispatch('hero', 'equipItem', payload);
// -> engine.equipHeroItem(heroId, slot, itemId)
```

### 8.2 Adapter → Component Communication

The adapter notifies the page of state changes, and the page updates components:

```js
// Adapter (after engine mutation)
const newState = engine.getState();
page.update(newState);  // Page selectively updates components
```

### 8.3 Benefits

1. **Components are engine-agnostic.** They can be tested with mock `onAction` callbacks.
2. **The adapter is the single translation layer.** Changing engine APIs requires editing only the adapter.
3. **New features require no adapter changes** if they use existing action types.

---

## 9. Principles for All Future Migration Sessions

Any implementation plan derived from this initiative must follow these rules:

1. **One Concern Per File.** If a file exceeds 250 lines, split it. If a component handles list rendering AND detail rendering AND modal orchestration, split it.

2. **No God Views.** Views over 400 lines are banned. They must be decomposed into pages + components.

3. **Props, Not State.** Components receive data via props. They never import `EngineAdapter` or call `this.ui.engine.*`.

4. **Events Up, Data Down.** Components emit events upward. Pages/views receive events and call the adapter. Data flows down through props.

5. **Co-locate CSS.** No inline styles except for truly dynamic values. Feature CSS lives in `css/features/<domain>/`.

6. **Templates Are Optional.** HTML templates in `pages/` may be removed if they are fully replaced by component DOM. Prefer component-built DOM over template + querySelector hydration.

7. **Overlays Are Components.** `GambitEditor`, `MagicCircleEditor`, and `EquipmentOverlay` are components that receive a mount container from the page. They do not append to `document.body` internally.

8. **Static Methods on View Classes Are Banned.** `GambitView.showTestSetup()` becomes `GambitTestSetup` component. `GambitView.formatGambitRule()` becomes a pure utility function.

9. **Preserve i18n Keys.** Do not rename or delete translation keys during component migration unless explicitly part of the implementation plan. The component contract passes `t` (or `i18n`) as a prop.

10. **Test Components in Isolation.** Every component must be testable with mock props and mocked `onAction` callbacks. No component test should require instantiating the engine.

---

## 10. What This Document Does NOT Cover

This is an **architectural vision**, not a work plan. The following are explicitly out of scope here and will be defined in separate implementation plans:

- **Migration order:** Which domain to componentize first (Heroes? Combat? Gambit?)
- **Phasing:** Whether to migrate incrementally or rewrite domains wholesale
- **Tooling:** Whether to introduce build-step enhancements (CSS modules, JSX, etc.)
- **Backward compatibility:** How to keep the game playable during migration
- **Specific file renames:** Exact source → destination mappings
- **Testing strategy:** Which tests to write, which existing tests to update

These decisions require assessing risk, dependencies, and player-facing impact. They belong in per-domain implementation plans, not in this core initiative.

---

## 11. Summary

The presentation layer currently suffers from **distributed monoliths**: features are scattered across files, views are thousands of lines long, and components are helper functions rather than self-contained units.

The target architecture is **component composition**: small, declarative, reusable units that receive props, emit events, and own their DOM. Pages are thin composers. The adapter is a thin translator. CSS is co-located by feature.

This initiative does not mandate a framework. It mandates a **contract**. The existing `el()` and `diffList()` primitives are sufficient infrastructure. What is missing is discipline around boundaries.

---

*Document Version: 1.0*
*Created: 2026-06-05*
*Status: Awaiting Review*
