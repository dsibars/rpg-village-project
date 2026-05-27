# UX Architecture Proposal: Component-Based Vanilla JS

## 1. Problem Statement
The RPG Village presentation layer is suffering from the "Monolithic View" anti-pattern. Views like `HeroesView.js` (638 lines) and `GambitView.js` (424 lines) handle complex UI logic by generating massive HTML template strings and injecting them into the DOM via `innerHTML`. 

### The Symptoms
- **State & Focus Loss**: Completely overwriting `innerHTML` on every state change destroys the DOM tree. This causes active input fields to lose focus, scrollbars to jump back to the top, and makes CSS animations extremely difficult to trigger smoothly.
- **Event Delegation Spaghetti**: Because the DOM is constantly destroyed and recreated, event listeners cannot be safely bound to elements. This forces us to rely on massive, global event delegation blocks (e.g., `document.body.addEventListener('click', (e) => { if (e.target.closest(...)) })`), making the codebase hard to trace and maintain.
- **Syntax Vulnerabilities**: Complex string interpolations and nested template literals (e.g., trying to use backticks inside `${...}`) are brittle and prone to syntax errors that break the entire build.

## 2. Framework Evaluation (Why not React/Lit?)
While a modern frontend framework solves these issues, it introduces unacceptable trade-offs for this specific project:
- **React / Svelte**: Migrating to a full framework is a "stop the world" event. It would block game feature development for weeks just to reach parity, and requires bridging the Vanilla JS game engine into React contexts.
- **Lit (Web Components)**: Lit defaults to Shadow DOM, which explicitly blocks the global `style.css` custom properties. Since our entire "glassmorphism" aesthetic relies on shared CSS variables and a cohesive dark theme, Shadow DOM would fight our design system at every step.
- **Preact + HTM**: While lightweight, HTM still relies on tagged template literals (`` html`<div>...</div>` ``), meaning the syntax vulnerability and string-based authoring experience largely remain.

## 3. The Proposal: Option A (Refactor, Don't Rewrite)

The game engine is already beautifully decoupled into bounded contexts. We must apply the same philosophy to the presentation layer. We do not need a framework; we need **Component Functions** and **Surgical Updates**.

### Principle 1: Component Functions Return Nodes, Not Strings
Instead of a single `render()` method returning 100 lines of HTML, views should be decomposed into small, pure functions that return actual `HTMLElement` instances.

**Before (Monolith):**
```javascript
// BAD
this.container.innerHTML = `
    <div class="hero-card" data-id="${hero.id}">
        <h2>${hero.name}</h2>
        <button class="btn-train">Train</button>
    </div>
`;
```

**After (Decomposed):**
```javascript
// GOOD
function createHeroCard(hero, onTrain) {
    const el = document.createElement('div');
    el.className = 'hero-card';
    
    const title = document.createElement('h2');
    title.textContent = hero.name;
    
    const trainBtn = document.createElement('button');
    trainBtn.className = 'btn-train';
    trainBtn.textContent = 'Train';
    
    // Bind events locally! No global delegation needed.
    trainBtn.addEventListener('click', () => onTrain(hero.id));
    
    el.append(title, trainBtn);
    return el;
}
```
*(Note: A lightweight DOM-builder utility function like `el('div', { class: 'hero' }, [children])` can make this syntax incredibly terse and ergonomic.)*

### Principle 2: Surgical DOM Updates
When the game state updates, we should not wipe `this.container.innerHTML`. Instead, we update the data of the existing nodes, or surgically replace specific child nodes.

```javascript
// Instead of wiping the DOM:
const newCard = createHeroCard(updatedHero, this.handleTrain);
const oldCard = document.getElementById(`hero-${updatedHero.id}`);

// Surgically replace only what changed, preserving sibling scroll state
if (oldCard) {
    oldCard.replaceWith(newCard); 
}
```

## 4. Technical Specifications & Known Constraints

Before migrating views, we must establish the ground rules for the new architecture.

### The Complete `DOMUtils.js` Spec
The `el(tag, props, children)` helper must be fully featured to replace massive template strings:
1. **Event Binding**: Props starting with `on` (e.g., `onClick: () => ...`) attach event listeners.
2. **Conditional Classes**: Accepts arrays or objects for `class`/`className`.
3. **Data & ARIA Attributes**: Automatically converts `dataId: 'foo'` to `data-id="foo"`, and handles `ariaLabel`.
4. **Boolean Attributes**: Properly handles `disabled`, `checked`, `selected` via properties rather than string attributes.
5. **Inline Styles**: Converts object styles (`{ style: { marginTop: '4px' } }`) into proper CSS style declarations.
6. **Refs**: Supports a `ref: (node) => this.myNode = node` callback to allow parents to grab references to created nodes.
7. **Batching**: Uses `DocumentFragment` internally for arrays of children.

### The Hard Problem: Keyed List Diffing
Surgical updates fail when lists reorder, delete, or insert items. Caching `this.lastHeroes = [...heroes]` and shallow-comparing is insufficient. 
- **Requirement**: `DOMUtils.js` must implement `diffList(container, newElements, keyAttr)` (similar to React's reconciliation). It will compute the minimal `insertBefore`, `removeChild`, and `replaceChild` operations needed. Without this, views dominated by lists (Shop, Heroes) will introduce catastrophic bugs.

### The Template System Decision (Option A)
Currently, `UIController` clones `<template>` tags from `pages/*.html` (2,780 lines). 
- We will adopt **Option A: Templates Stay**. `UIController` will continue cloning the static HTML skeleton for layout structure. The new component functions will mount into specific `#containers` within those cloned templates. This prevents us from having to rewrite thousands of lines of static HTML into JS layout code.

### The BaseView & BaseModal Migration Contract
- **New Pattern Views**: Must override `BaseView.update(state)` to bypass JSON stringify diffing. They will surgically update their DOM mount points.
- **Old Pattern Views**: Will continue using the inherited global stringify diffing.
- **BaseModal.js**: Will be refactored in Phase 0 to expose a component-friendly mounting API alongside its legacy `innerHTML` support, ensuring we don't break old modals while migrating.

### Shared Component Extraction
As soon as two views require the same UI element (e.g., ResourceBar, ItemCard, HeroMiniCard), that element must be extracted to `js/presentation/ui/shared/components/` as a pure component factory. Presentation helpers like `EquipmentHelper.js` will be dissolved into these factories.

### DOM Testing Strategy (jsdom)
We cannot safely refactor views without testing DOM outputs. We will configure `jsdom` in our Node test suite to polyfill `global.document`. Every Phase will include DOM-level unit tests.

### Known Constraints & Edge Cases
1. **i18n Language Switching**: Text nodes set via `el()` will not automatically update mid-game on language switch. We accept this constraint.
2. **Memory Leaks**: We must be cautious of closure retention in high-frequency views (`CombatView`).
3. **CSS Animations**: Replacing a node resets its CSS animations. Must manage animations on persistent parent containers.

## 5. Execution Strategy & Incremental Roadmap

We do not halt feature development. We establish the tools in Phase 0, prove them in Phase 1, then systematically slay the monoliths and their supporting cast.

### Phase 0: Infrastructure & Tooling (BLOCKER)
- [x] **Configure `jsdom` Test Harness**: Set up `tests/dom/setup.js`.
- [x] **Create `DOMUtils.js`**: Implement the complete `el()` spec (data attrs, ARIA, styles, refs).
- [x] **Implement Keyed List Diffing**: Build and test `diffList(container, newElements, keyAttr)`.
- [x] **Formalize BaseView & BaseModal Contract**: Ensure both support the new component mounting paradigm alongside legacy support.
- [x] **Audit Remaining Helpers**: Map how `MagicCircleHelper.js` transitions into pure component factories.

### Phase 1: The Proving Ground
- [x] **Refactor `GambitView.js` (424 lines)**: Use the new `el()` and `diffList()` tools.
- [x] **Extract Shared Components**: Build the first shared components (e.g., HeroMiniCard, ResourceBar) as they are needed.

### Phase 2: Slaying the Monoliths & Their Modals
These are the most unwieldy views where focus loss causes the most bugs.
- [ ] **Refactor `ShopView.js` (844 lines)**: Break into `renderBuyTab()`, `renderSellTab()`, and `renderItemCard()`. 
- [ ] **Refactor `HeroesView.js` (638 lines) AND Hero Modals**: Decompose roster lists. Refactor `HeroEquipmentModal.js` (129L), `HeroInscriptionModal.js` (152L), and `HeroTrainingModals.js` (166L) simultaneously, since they are intrinsically tied to the Hero domain.

### Phase 3: The High-Risk & Overlay Views
- [ ] **Refactor `CombatView.js` (832 lines)**: High performance sensitivity.
- [ ] **Refactor `VillageView.js` (588 lines)**: Refactor dashboard blocks and sub-view routing.
- [ ] **Refactor `MagicCircleView.js` (532 lines)**
- [ ] **Refactor `MagicCircleViewV2.js` (654 lines)**: Crucial V2 overlay logic.

### Phase 4: The Strangler Fig (Tail End)
**CRITICAL RULE:** All new features added to these views MUST use the new component pattern.
- [ ] **Refactor `InventoryView.js` (363 lines)**
- [ ] **Refactor `BuildingsView.js` (355 lines)**
- [ ] **Refactor `ExploreView.js` & `ForgeView.js` (~270 lines each)**
- [ ] **Refactor `UnlockNarrativeView.js` (123 lines)**
- [ ] **Refactor Codex, Settings, and Bestiary (<200 lines)**
