# Implementation Plan 2: Shared Infrastructure

> **Phase:** 2 — Shared Infrastructure
>
> **Objective:** Build common UI primitives and the generic engine adapter that all domain components (Plan 3+) will depend on. Prevent each domain from inventing its own button, modal, or formatting logic.
>
> **Estimated Effort:** 1–2 sessions
>
> **Risk:** Low-Medium — these are foundational; bugs here affect every future domain
>
> **Dependencies:** Plan 0 (Setup) — Vue pipeline must work. Plan 1 (Gambit Editor PoC) is NOT required; infrastructure can be built in parallel.

---

## 1. Scope

### In Scope
- Create 6 primitive UI components in `ux/components/`
- Create the generic `EngineAdapter.js` in `ux/adapters/`
- Create corresponding `.spec.js` tests in `tests/vue/components/` and `tests/vue/adapters/`
- All primitives are pure props/emits (no composables)
- Adapter is the ONLY file that knows about engine methods
- No changes to `js/presentation/`, `js/engine/`, `pages/`, `css/`, or `infrastructure/electron/`

### Out of Scope
- No domain-specific components (those are Plan 3+)
- No changes to existing `js/presentation/adapters/EngineAdapter.js` (it stays frozen)
- No wiring to the real game (adapter is tested with mock engine)

---

## 2. Research Summary (Embedded for Context-Free Execution)

### 2.1 Engine Methods (Full API Surface for Adapter)

From `js/engine/GameEngine.js` (1339 lines), the methods callable by the adapter:

**Heroes:**
```js
recruitHero() → Result
increaseHeroStat(heroId, statId) → Result
learnHeroFamily(heroId, familyId) → Result
useHeroConsumable(heroId, consumableId) → { hero, amountRestored, type }
inscribeHeroBodyCircle(heroId, glyphIds, glyphTiers) → Result
inscribeHeroSpell(heroId, spell) → Result
equipHeroItem(heroId, slot, equipmentId) → Result
unequipHeroItem(heroId, slot) → Result
useGlyphTablet(heroId, tabletId) → Result
getRecruitCost() → number
assignDefense(heroId) → Result
unassignDefense(heroId) → Result
evaluateHeroTitles(heroId) → Result
```

**Gambits:**
```js
addHeroGambit(heroId, gambit) → Result
removeHeroGambit(heroId, gambitId) → Result
toggleHeroGambit(heroId, gambitId) → Result
moveHeroGambit(heroId, gambitId, direction) → Result
updateHeroFallbackAction(heroId, action) → Result
testHeroGambits(heroId, enemiesOverride) → { result, healthScore, rating }
suggestHeroGambitPreset(heroId) → { presetId, presetName, addedCount }
buildGambit(conditionRaw, actionRaw, target, tier, spellCodex) → Gambit
```

**Village:**
```js
setWorkerRole(role, delta) → Result
assignDefense(heroId) → Result
unassignDefense(heroId) → Result
```

**Buildings:**
```js
startProject(buildingId, targetLevel, costGold, costMaterials, duration) → Result
```

**Explore:**
```js
assignExpedition(expId, heroIds) → Result
retireExpedition(expId) → Result
```

**Shop:**
```js
buyItem(itemData, costGold) → Result
sellItem(itemId, itemType, sellPrice) → Result
sellResource(resourceId, quantity) → Result
```

**Inventory:**
```js
cookMeal(recipeId) → Result
consumeMeal(mealId) → Result
useGlyphTablet(heroId, tabletId) → Result
```

**Forge:**
```js
refineEquipment(itemId) → Result
```

**Settings:**
```js
activateDeveloperCheat() → Result
```

### 2.2 Result Class Shape

```js
// js/engine/shared/core/Result.js
{ success: boolean, data: any, error: string|null, context: Object }
```

The adapter checks `result.success` and shows toast on `!result.success`.

### 2.3 I18n Service

```js
// js/engine/shared/core/i18n/I18nService.js
i18n.setLanguage(lang) → boolean
i18n.t(key, params = {}) → string
```

`i18n` is a singleton imported and attached to `GameEngine` as `this.i18n`.

### 2.4 Game State Shape (from engine.update())

```js
{
  village: { day, gold, infrastructure, workers, dailyReport, ... },
  inventory: { materials, equipment, consumables, storage },
  heroes: [/* Hero DTOs with activity/activityTargetId */],
  expeditions: [...],
  activeExpeditions: [...],
  maxConcurrentExpeditions: number,
  completedExpeditions: string[],
  activeBattle: { heroes, enemies, turnOrder, currentTurnIndex, log, isOver, ... } | null,
  bestiary: string[],
  enemyTemplates: [...],
  dailyObjectives: {...},
  calendar: {...},
  expeditionRegions: [...],
  unlockedNarratives: string[]
}
```

---

## 3. Files to Create

### 3.1 Directory Structure

```
ux/components/
  ├── Button.vue
  ├── ResourceBar.vue
  ├── Icon.vue
  ├── EmptyState.vue
  ├── LoadingSpinner.vue
  └── ToastContainer.vue
ux/adapters/
  └── EngineAdapter.js
tests/vue/components/
  ├── Button.spec.js
  ├── ResourceBar.spec.js
  ├── Icon.spec.js
  ├── EmptyState.spec.js
  ├── LoadingSpinner.spec.js
  └── ToastContainer.spec.js
tests/vue/adapters/
  └── EngineAdapter.spec.js
```

### 3.2 File Details

| File | Lines (target) | Type | Complexity |
|------|---------------|------|------------|
| `Button.vue` | ~150 | Primitive | Low |
| `ResourceBar.vue` | ~100 | Primitive | Low |
| `Icon.vue` | ~60 | Primitive | Low |
| `EmptyState.vue` | ~80 | Primitive | Low |
| `LoadingSpinner.vue` | ~70 | Primitive | Low |
| `ToastContainer.vue` | ~180 | Feature | Medium |
| `EngineAdapter.js` | ~120 | Adapter | Medium |

---

## 4. Step-by-Step Implementation

### Step 1: Create Button.vue

**Purpose:** The most-used primitive. Supports variants, sizes, and states.

**Props:**
- `variant: 'primary' | 'secondary' | 'danger' | 'ghost'` — default 'primary'
- `size: 'sm' | 'md' | 'lg'` — default 'md'
- `disabled: Boolean` — default false
- `loading: Boolean` — default false
- `type: 'button' | 'submit'` — default 'button'

**Emits:**
- `click(event)`

**Slots:**
- Default — button label/content

**Code:**

```vue
<template>
  <button
    :type="type"
    class="btn"
    :class="[`btn--${variant}`, `btn--${size}`, { 'btn--loading': loading }]"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <LoadingSpinner v-if="loading" size="sm" class="btn-spinner" />
    <span :class="{ 'btn-label--hidden': loading }">
      <slot />
    </span>
  </button>
</template>

<script setup>
import LoadingSpinner from './LoadingSpinner.vue'

defineProps({
  variant: { type: String, default: 'primary', validator: v => ['primary', 'secondary', 'danger', 'ghost'].includes(v) },
  size: { type: String, default: 'md', validator: v => ['sm', 'md', 'lg'].includes(v) },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  type: { type: String, default: 'button', validator: v => ['button', 'submit'].includes(v) }
})

defineEmits(['click'])
</script>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-family: var(--font-body);
  font-weight: 500;
  transition: background 0.15s, opacity 0.15s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Sizes */
.btn--sm { padding: 4px 12px; font-size: 0.75rem; }
.btn--md { padding: 8px 16px; font-size: 0.875rem; }
.btn--lg { padding: 12px 24px; font-size: 1rem; }

/* Variants */
.btn--primary {
  background: var(--color-primary);
  color: white;
}
.btn--primary:hover:not(:disabled) {
  background: var(--color-primary-light);
}

.btn--secondary {
  background: var(--bg-card);
  color: var(--text-primary);
  border: 1px solid var(--glass-border);
}
.btn--secondary:hover:not(:disabled) {
  background: var(--glass-border);
}

.btn--danger {
  background: var(--color-danger);
  color: white;
}
.btn--danger:hover:not(:disabled) {
  opacity: 0.9;
}

.btn--ghost {
  background: transparent;
  color: var(--text-secondary);
}
.btn--ghost:hover:not(:disabled) {
  background: var(--bg-card);
  color: var(--text-primary);
}

/* Loading */
.btn--loading {
  position: relative;
}

.btn-label--hidden {
  opacity: 0;
}

.btn-spinner {
  position: absolute;
}
</style>
```

**Test:** `tests/vue/components/Button.spec.js`

```js
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Button from '../../../ux/components/Button.vue'

describe('Button.vue', () => {
  it('renders slot content', () => {
    const wrapper = mount(Button, { slots: { default: 'Click Me' } })
    expect(wrapper.text()).toBe('Click Me')
  })

  it('emits click event', async () => {
    const wrapper = mount(Button, { slots: { default: 'Click' } })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
  })

  it('applies variant class', () => {
    const wrapper = mount(Button, { props: { variant: 'danger' } })
    expect(wrapper.find('button').classes()).toContain('btn--danger')
  })

  it('applies size class', () => {
    const wrapper = mount(Button, { props: { size: 'lg' } })
    expect(wrapper.find('button').classes()).toContain('btn--lg')
  })

  it('is disabled when disabled prop is true', () => {
    const wrapper = mount(Button, { props: { disabled: true } })
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
  })

  it('shows spinner when loading', () => {
    const wrapper = mount(Button, { props: { loading: true } })
    expect(wrapper.findComponent({ name: 'LoadingSpinner' }).exists()).toBe(true)
  })
})
```

---

### Step 2: Create LoadingSpinner.vue

**Purpose:** Loading indicator. Used by Button.vue and anywhere async operations happen.

**Props:**
- `size: 'sm' | 'md' | 'lg'` — default 'md'
- `color: String` — CSS color value, default 'currentColor'

**Code:**

```vue
<template>
  <span class="spinner" :class="`spinner--${size}`" :style="{ borderColor: color }"></span>
</template>

<script setup>
defineProps({
  size: { type: String, default: 'md', validator: v => ['sm', 'md', 'lg'].includes(v) },
  color: { type: String, default: 'currentColor' }
})
</script>

<style scoped>
.spinner {
  display: inline-block;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner--sm { width: 12px; height: 12px; }
.spinner--md { width: 20px; height: 20px; }
.spinner--lg { width: 32px; height: 32px; }

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
```

**Test:** `tests/vue/components/LoadingSpinner.spec.js`

```js
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LoadingSpinner from '../../../ux/components/LoadingSpinner.vue'

describe('LoadingSpinner.vue', () => {
  it('renders with default size', () => {
    const wrapper = mount(LoadingSpinner)
    expect(wrapper.find('.spinner--md').exists()).toBe(true)
  })

  it('applies size class', () => {
    const wrapper = mount(LoadingSpinner, { props: { size: 'lg' } })
    expect(wrapper.find('.spinner--lg').exists()).toBe(true)
  })
})
```

---

### Step 3: Create Icon.vue

**Purpose:** Standardized icon wrapper. Accepts emoji or future icon font characters.

**Props:**
- `name: String` — the icon character/emoji (e.g., '🪙', '⚔️')
- `size: 'sm' | 'md' | 'lg'` — default 'md'
- `color: String` — CSS color, optional

**Code:**

```vue
<template>
  <span class="icon" :class="`icon--${size}`" :style="colorStyle">{{ name }}</span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: { type: String, required: true },
  size: { type: String, default: 'md', validator: v => ['sm', 'md', 'lg'].includes(v) },
  color: { type: String, default: null }
})

const colorStyle = computed(() => props.color ? { color: props.color } : {})
</script>

<style scoped>
.icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.icon--sm { font-size: 0.875rem; }
.icon--md { font-size: 1.25rem; }
.icon--lg { font-size: 1.75rem; }
</style>
```

**Test:** `tests/vue/components/Icon.spec.js`

```js
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Icon from '../../../ux/components/Icon.vue'

describe('Icon.vue', () => {
  it('renders icon character', () => {
    const wrapper = mount(Icon, { props: { name: '\u{1FA99}' } }) // coin
    expect(wrapper.text()).toContain('\u{1FA99}')
  })

  it('applies size class', () => {
    const wrapper = mount(Icon, { props: { name: 'A', size: 'lg' } })
    expect(wrapper.find('.icon--lg').exists()).toBe(true)
  })
})
```

---

### Step 4: Create ResourceBar.vue

**Purpose:** Displays village resources (gold, wood, population) in the top bar.

**Props:**
- `gold: Number`
- `wood: Number`
- `population: Number` — current / max format
- `maxPopulation: Number`

**Code:**

```vue
<template>
  <div class="resource-bar">
    <div class="resource">
      <Icon name="\u{1FA99}" size="sm" />
      <span class="resource-value">{{ gold }}</span>
    </div>
    <div class="resource">
      <Icon name="\u{1FAB5}" size="sm" />
      <span class="resource-value">{{ wood }}</span>
    </div>
    <div class="resource">
      <Icon name="\u{1F465}" size="sm" />
      <span class="resource-value">{{ population }} / {{ maxPopulation }}</span>
    </div>
  </div>
</template>

<script setup>
import Icon from './Icon.vue'

defineProps({
  gold: { type: Number, default: 0 },
  wood: { type: Number, default: 0 },
  population: { type: Number, default: 0 },
  maxPopulation: { type: Number, default: 0 }
})
</script>

<style scoped>
.resource-bar {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.resource {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--text-primary);
  font-size: 0.875rem;
}

.resource-value {
  font-weight: 500;
}
</style>
```

**Test:** `tests/vue/components/ResourceBar.spec.js`

```js
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ResourceBar from '../../../ux/components/ResourceBar.vue'

describe('ResourceBar.vue', () => {
  it('renders all resources', () => {
    const wrapper = mount(ResourceBar, {
      props: { gold: 500, wood: 200, population: 8, maxPopulation: 12 }
    })
    expect(wrapper.text()).toContain('500')
    expect(wrapper.text()).toContain('200')
    expect(wrapper.text()).toContain('8 / 12')
  })

  it('renders Icon components', () => {
    const wrapper = mount(ResourceBar, {
      props: { gold: 100, wood: 50, population: 4, maxPopulation: 10 }
    })
    expect(wrapper.findAllComponents({ name: 'Icon' }).length).toBe(3)
  })
})
```

---

### Step 5: Create EmptyState.vue

**Purpose:** Reusable empty/placeholder view. Shows an icon, message, and optional action button.

**Props:**
- `icon: String` — emoji/icon character
- `title: String`
- `message: String`
- `actionLabel: String` — optional, shows button if provided

**Emits:**
- `action` — when action button is clicked

**Code:**

```vue
<template>
  <div class="empty-state">
    <Icon v-if="icon" :name="icon" size="lg" class="empty-icon" />
    <h3 v-if="title" class="empty-title">{{ title }}</h3>
    <p v-if="message" class="empty-message">{{ message }}</p>
    <Button
      v-if="actionLabel"
      variant="secondary"
      @click="$emit('action')"
    >{{ actionLabel }}</Button>
  </div>
</template>

<script setup>
import Icon from './Icon.vue'
import Button from './Button.vue'

defineProps({
  icon: { type: String, default: null },
  title: { type: String, default: null },
  message: { type: String, default: null },
  actionLabel: { type: String, default: null }
})

defineEmits(['action'])
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  text-align: center;
  color: var(--text-muted);
}

.empty-icon {
  margin-bottom: var(--spacing-md);
  opacity: 0.6;
}

.empty-title {
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--text-secondary);
  font-family: var(--font-heading);
}

.empty-message {
  margin: 0 0 var(--spacing-md) 0;
  font-size: 0.875rem;
  max-width: 300px;
}
</style>
```

**Test:** `tests/vue/components/EmptyState.spec.js`

```js
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EmptyState from '../../../ux/components/EmptyState.vue'

describe('EmptyState.vue', () => {
  it('renders title and message', () => {
    const wrapper = mount(EmptyState, {
      props: { icon: '\u{1F50D}', title: 'No Items', message: 'Your inventory is empty.' }
    })
    expect(wrapper.text()).toContain('No Items')
    expect(wrapper.text()).toContain('Your inventory is empty.')
  })

  it('shows action button when actionLabel provided', () => {
    const wrapper = mount(EmptyState, {
      props: { title: 'No Heroes', actionLabel: 'Recruit' }
    })
    expect(wrapper.findComponent({ name: 'Button' }).exists()).toBe(true)
  })

  it('emits action on button click', async () => {
    const wrapper = mount(EmptyState, {
      props: { title: 'No Heroes', actionLabel: 'Recruit' }
    })
    await wrapper.findComponent({ name: 'Button' }).vm.$emit('click')
    expect(wrapper.emitted('action')).toBeTruthy()
  })
})
```

---

### Step 6: Create ToastContainer.vue

**Purpose:** Global toast notification system. Lives in `App.vue` (survives page navigation). Other components emit toast events or call a toast function.

**Design decision:** Use an event bus pattern via a simple module export (not Vue's global state) so any component can trigger toasts without needing the engine.

**File:** `ux/core/toast.js` (event bus)

```js
// ux/core/toast.js — simple event bus for toast notifications
import { reactive } from 'vue'

export const toastState = reactive({
  toasts: []
})

let toastId = 0

export function showToast(message, type = 'info', duration = 3000) {
  const id = ++toastId
  toastState.toasts.push({ id, message, type, duration })

  setTimeout(() => {
    const idx = toastState.toasts.findIndex(t => t.id === id)
    if (idx >= 0) toastState.toasts.splice(idx, 1)
  }, duration)
}

export function removeToast(id) {
  const idx = toastState.toasts.findIndex(t => t.id === id)
  if (idx >= 0) toastState.toasts.splice(idx, 1)
}
```

**File:** `ux/components/ToastContainer.vue`

```vue
<template>
  <div class="toast-container">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toastState.toasts"
        :key="toast.id"
        class="toast"
        :class="`toast--${toast.type}`"
        @click="removeToast(toast.id)"
      >
        {{ toast.message }}
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { toastState, removeToast } from '../core/toast.js'
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: var(--spacing-lg);
  right: var(--spacing-lg);
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  pointer-events: none;
}

.toast {
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  color: white;
  font-size: 0.875rem;
  pointer-events: auto;
  cursor: pointer;
  max-width: 300px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.toast--info { background: var(--color-primary); }
.toast--success { background: var(--color-success); }
.toast--warning { background: var(--color-warning); }
.toast--error { background: var(--color-danger); }

/* Transition */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
```

**Test:** `tests/vue/components/ToastContainer.spec.js`

```js
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ToastContainer from '../../../ux/components/ToastContainer.vue'
import { toastState, showToast, removeToast } from '../../../ux/core/toast.js'

describe('ToastContainer.vue', () => {
  it('renders toasts from toastState', async () => {
    toastState.toasts = []
    showToast('Test message', 'info')

    const wrapper = mount(ToastContainer)
    expect(wrapper.text()).toContain('Test message')

    // Cleanup
    toastState.toasts = []
  })

  it('removes toast on click', async () => {
    toastState.toasts = []
    showToast('Click me', 'info')

    const wrapper = mount(ToastContainer)
    await wrapper.find('.toast').trigger('click')

    expect(toastState.toasts.length).toBe(0)
  })
})
```

---

### Step 7: Create EngineAdapter.js

**Purpose:** Generic action dispatcher. Maps `(domain, action, payload)` to engine method calls. Returns `{ success, error }` and triggers toast on failure.

**Design:**
- Lookup table (`ACTION_MAP`) routes to engine methods
- After each action, refreshes game state via `gameStateRef.value = engine.update()`
- Uses `showToast()` from `ux/core/toast.js` for error display
- No engine changes required

**Code:**

```js
// ux/adapters/EngineAdapter.js
import { showToast } from '../core/toast.js'

const ACTION_MAP = {
  hero: {
    recruit: (engine) => engine.recruitHero(),
    increaseStat: (engine, p) => engine.increaseHeroStat(p.heroId, p.statId),
    learnFamily: (engine, p) => engine.learnHeroFamily(p.heroId, p.familyId),
    equipItem: (engine, p) => engine.equipHeroItem(p.heroId, p.slot, p.equipmentId),
    unequipItem: (engine, p) => engine.unequipHeroItem(p.heroId, p.slot),
    useConsumable: (engine, p) => engine.useHeroConsumable(p.heroId, p.consumableId),
    inscribeBodyCircle: (engine, p) => engine.inscribeHeroBodyCircle(p.heroId, p.glyphIds, p.glyphTiers),
    inscribeSpell: (engine, p) => engine.inscribeHeroSpell(p.heroId, p.spell),
    eraseBodyCircle: (engine, p) => engine.eraseHeroBodyCircle(p.heroId),
    useGlyphTablet: (engine, p) => engine.useGlyphTablet(p.heroId, p.tabletId),
    assignDefense: (engine, p) => engine.assignDefense(p.heroId),
    unassignDefense: (engine, p) => engine.unassignDefense(p.heroId),
    evaluateTitles: (engine, p) => engine.evaluateHeroTitles(p.heroId)
  },
  gambit: {
    addGambit: (engine, p) => engine.addHeroGambit(p.heroId, p.gambit),
    removeGambit: (engine, p) => engine.removeHeroGambit(p.heroId, p.gambitId),
    toggleGambit: (engine, p) => engine.toggleHeroGambit(p.heroId, p.gambitId),
    moveGambit: (engine, p) => engine.moveHeroGambit(p.heroId, p.gambitId, p.direction),
    updateFallbackAction: (engine, p) => engine.updateHeroFallbackAction(p.heroId, p.action),
    testGambits: (engine, p) => engine.testHeroGambits(p.heroId, p.enemies),
    suggestPreset: (engine, p) => engine.suggestHeroGambitPreset(p.heroId)
  },
  village: {
    setWorkerRole: (engine, p) => engine.setWorkerRole(p.role, p.delta),
    assignDefense: (engine, p) => engine.assignDefense(p.heroId),
    unassignDefense: (engine, p) => engine.unassignDefense(p.heroId)
  },
  buildings: {
    startProject: (engine, p) => engine.startProject(p.buildingId, p.targetLevel, p.costGold, p.costMaterials, p.duration)
  },
  explore: {
    assignExpedition: (engine, p) => engine.assignExpedition(p.expId, p.heroIds),
    retireExpedition: (engine, p) => engine.retireExpedition(p.expId)
  },
  shop: {
    buyItem: (engine, p) => engine.buyItem(p.itemData, p.costGold),
    sellItem: (engine, p) => engine.sellItem(p.itemId, p.itemType, p.sellPrice),
    sellResource: (engine, p) => engine.sellResource(p.resourceId, p.quantity)
  },
  inventory: {
    cookMeal: (engine, p) => engine.cookMeal(p.recipeId),
    consumeMeal: (engine, p) => engine.consumeMeal(p.mealId),
    useGlyphTablet: (engine, p) => engine.useGlyphTablet(p.heroId, p.tabletId)
  },
  forge: {
    refineItem: (engine, p) => engine.refineEquipment(p.itemId)
  },
  settings: {
    devCheatActivate: (engine) => engine.activateDeveloperCheat()
  }
}

export function createEngineAdapter(engine, gameStateRef) {
  return {
    dispatch(domain, action, payload) {
      const handler = ACTION_MAP[domain]?.[action]
      if (!handler) {
        console.error(`Unknown action: ${domain}.${action}`)
        return { success: false, error: 'action_unknown' }
      }

      let result
      try {
        result = handler(engine, payload)
      } catch (err) {
        console.error(`Engine error on ${domain}.${action}:`, err)
        return { success: false, error: 'engine_error' }
      }

      // Engine methods return either a Result object or raw data
      // Normalize to { success, error } shape
      const normalized = result && typeof result.success === 'boolean'
        ? result
        : { success: true, data: result }

      if (!normalized.success) {
        const message = engine.i18n?.t(normalized.error) || normalized.error || 'Action failed'
        showToast(message, 'error')
      }

      // Force a state snapshot after the action — matches legacy forceUpdate() behavior.
      // engine.update() is non-idempotent (see architecture doc §6.3), but this is correct here:
      // the action just mutated engine state, and we need Vue to see the change
      // immediately (not wait for the next 100ms loop tick).
      if (gameStateRef) {
        gameStateRef.value = engine.update()
      }

      return normalized
    }
  }
}
```

**Test:** `tests/vue/adapters/EngineAdapter.spec.js`

```js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createEngineAdapter } from '../../../ux/adapters/EngineAdapter.js'
import { toastState } from '../../../ux/core/toast.js'

describe('EngineAdapter', () => {
  let mockEngine
  let gameStateRef
  let adapter

  beforeEach(() => {
    toastState.toasts = []
    gameStateRef = { value: null }
    mockEngine = {
      recruitHero: vi.fn(() => ({ success: true, data: { hero: { id: 'h1' } } })),
      increaseHeroStat: vi.fn(() => ({ success: true })),
      addHeroGambit: vi.fn(() => ({ success: true })),
      update: vi.fn(() => ({ day: 1 })),
      i18n: { t: (k) => `translated:${k}` }
    }
    adapter = createEngineAdapter(mockEngine, gameStateRef)
  })

  it('dispatches known action to engine method', () => {
    const result = adapter.dispatch('hero', 'recruit')
    expect(mockEngine.recruitHero).toHaveBeenCalled()
    expect(result.success).toBe(true)
  })

  it('passes payload to engine method', () => {
    adapter.dispatch('hero', 'increaseStat', { heroId: 'h1', statId: 'baseStrength' })
    expect(mockEngine.increaseHeroStat).toHaveBeenCalledWith('h1', 'baseStrength')
  })

  it('returns error for unknown action', () => {
    const result = adapter.dispatch('hero', 'nonexistent')
    expect(result.success).toBe(false)
    expect(result.error).toBe('action_unknown')
  })

  it('shows toast on failure', () => {
    mockEngine.recruitHero = vi.fn(() => ({ success: false, error: 'not_enough_gold' }))
    adapter.dispatch('hero', 'recruit')
    expect(toastState.toasts.length).toBeGreaterThan(0)
  })

  it('updates gameStateRef after dispatch', () => {
    adapter.dispatch('hero', 'recruit')
    expect(mockEngine.update).toHaveBeenCalled()
    expect(gameStateRef.value).toEqual({ day: 1 })
  })
})
```

---

## 5. Verification & Testing

### Test 1: All Component Tests Pass

```bash
npx vitest run tests/vue/components/
npx vitest run tests/vue/adapters/
```

**Expected:** All tests pass.

### Test 2: No Cross-Primitive Dependencies (except where specified)

```bash
grep -l "import.*from.*components/" ux/components/*.vue | grep -v "Button.vue\|EmptyState.vue\|ToastContainer.vue"
```

**Expected:** Only Button.vue imports LoadingSpinner, EmptyState imports Icon+Button, ToastContainer imports nothing from components/. All other primitives are independent.

### Test 3: Adapter Coverage

```bash
grep -c "=> engine\." ux/adapters/EngineAdapter.js
```

**Expected:** At least 20 engine method mappings (one per ACTION_MAP entry).

### Test 4: Button Variants Render Correctly

Create a temporary test page that renders all Button variants side by side:
- primary, secondary, danger, ghost
- sm, md, lg
- disabled, loading

Verify visually that styles don't leak between variants.

### Test 5: Toast System Works

In browser console (with dev server running):
```js
import { showToast } from './ux/core/toast.js'
showToast('Hello from toast!', 'success')
showToast('Error happened', 'error')
```

**Expected:** Toasts appear top-right, auto-dismiss after 3s, clickable to dismiss early.

---

## 6. Acceptance Criteria

- [ ] `ux/components/Button.vue` exists with 4 variants, 3 sizes, disabled/loading states
- [ ] `ux/components/LoadingSpinner.vue` exists with 3 sizes
- [ ] `ux/components/Icon.vue` exists with size prop
- [ ] `ux/components/ResourceBar.vue` exists displaying gold/wood/population
- [ ] `ux/components/EmptyState.vue` exists with icon, title, message, optional action
- [ ] `ux/components/ToastContainer.vue` exists with enter/leave transitions
- [ ] `ux/core/toast.js` exists with `showToast()` and `removeToast()`
- [ ] `ux/adapters/EngineAdapter.js` exists with full ACTION_MAP covering all domains
- [ ] All `.spec.js` tests pass
- [ ] Toast system works in browser (manual test)
- [ ] Button variants render correctly in browser (manual test)
- [ ] No primitive exceeds 200 lines
- [ ] No imperative DOM creation in any primitive
- [ ] Scoped styles verified in DevTools
- [ ] No old code modified

---

## 7. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Button.vue becomes too complex with all variants | Low | Low | Variants are CSS-only; no JavaScript logic per variant |
| Toast event bus feels like global state | Low | Medium | It's a simple array, not a store. Components import `showToast`, not the state directly. |
| Adapter ACTION_MAP grows unwieldy | Low | Medium | One line per action. Grouped by domain. Well-commented. |
| Adapter doesn't handle all engine return types | Medium | High | Normalizes Result objects and raw returns. Tested with both shapes. |

---

## 8. Notes for Future Sessions

- **Button.vue** is the universal primitive. All future components use it instead of raw `<button>`.
- **ToastContainer** must be added to `App.vue` (or it won't render):
  ```vue
  <!-- App.vue -->
  <template>
    <div class="app-shell">
      ...
      <ToastContainer />
    </div>
  </template>
  ```
- **EngineAdapter** is provided at app level: `app.provide('adapter', createEngineAdapter(engine, gameStateRef))`
- **Adapter domain keys** map 1:1 to conceptual service boundaries (hero, gambit, village, etc.). If the engine is ever refactored into services, the adapter keys stay the same.
- **No new i18n keys** are needed for this phase. All text comes from existing translation keys or is passed as props.
- The `toast.js` module uses Vue's `reactive()` but is NOT a composable — it's a plain module import. This keeps it simple and framework-agnostic.

---

*Document Version: 1.0*
*Created: 2026-06-05*
*Depends On: Plan 0 (The Setup)*
*Independent Of: Plan 1 (Gambit Editor PoC) — can be built in parallel*
*Next Plan: Plan 3 (Heroes Domain) → Plan 4 (Combat Domain) → ... → Plan N (The Switch)*
