# Implementation Plan 0: The Setup

> **Phase:** 0 — Pipeline & Infrastructure
>
> **Objective:** Add Vue 3 to the project, configure the Vite build pipeline, create the `ux/` directory structure, and verify that Vue Single File Components compile and run correctly without touching the existing game.
>
> **Estimated Effort:** 1 session
>
> **Risk:** Very Low (additive only, no player-facing changes)

---

## 1. Scope

### In Scope
- Install Vue 3 runtime and `@vitejs/plugin-vue` dev dependency
- Update `vite.config.js` to include Vue plugin and path alias `@/` → `ux/`
- Create `ux/` directory skeleton (`main.js`, `App.vue`, `core/`, `components/`, `features/`, `adapters/`)
- Create `ux/core/theme.css` with design tokens (minimal initial set)
- Create a minimal `HelloWorld.vue` test component
- Create a temporary `test-vue.html` entry point to verify Vue mounts and renders
- Verify `npm run build` succeeds with Vue plugin enabled
- Verify the existing game (`npm run dev` / `npm run build`) still works unchanged
- **Verify Electron compatibility:** confirm `vite-plugin-singlefile` correctly inlines Vue runtime into `dist/index.html` so Electron can load it unchanged

### Out of Scope
- No changes to `js/presentation/` or `pages/` or `css/` (old code is frozen)
- No changes to `js/main.js` (old game bootstrap remains untouched)
- No changes to `js/engine/`
- No changes to `infrastructure/electron/` (Electron needs zero changes for the Vue switch)
- No domain components (Heroes, Combat, etc.)
- No adapter logic
- No i18n integration in Vue yet

---

## 2. Files to Modify

| File | Change |
|------|--------|
| `package.json` | Add `vue` and `@vitejs/plugin-vue` dependencies |
| `vite.config.js` | Add `@vitejs/plugin-vue` plugin, add `@/` path alias |
| `.gitignore` | Ensure `ux/` is NOT ignored (it will contain source code) |

## 3. Files to Create

| File | Purpose |
|------|---------|
| `ux/main.js` | Vue app bootstrap placeholder |
| `ux/App.vue` | Root Vue component placeholder |
| `ux/core/theme.css` | Design tokens (CSS custom properties) |
| `ux/core/composables/useI18n.js` | Translation composable placeholder |
| `ux/core/composables/useGameState.js` | State access composable placeholder |
| `ux/core/composables/useAdapter.js` | Adapter access composable placeholder |
| `ux/components/CloseButton.vue` | Close button primitive (emits @close) |
| `ux/components/TopBar.vue` | Game header shell (brand, day, stats) |
| `ux/components/FooterNav.vue` | Bottom navigation (4 categories) |
| `ux/components/TabNav.vue` | Horizontal tab switcher |
| `ux/components/ModalFrame.vue` | Modal shell with CloseButton, header, slots |
| `ux/components/FullViewOverlay.vue` | Full-page overlay shell with CloseButton |
| `ux/components/.gitkeep` | Placeholder for remaining shared primitives |
| `ux/features/.gitkeep` | Placeholder for domain features |
| `ux/adapters/.gitkeep` | Placeholder for adapter |
| `vitest.config.js` | Vitest test runner configuration |
| `tests/vue/HelloWorld.spec.js` | Sample component test |
| `test-vue.html` | Temporary entry point for Vue build verification |

---

## 4. Step-by-Step Implementation

### Step 1: Install Vue 3 Dependencies

```bash
npm install vue
npm install -D @vitejs/plugin-vue vitest @vue/test-utils jsdom
```

**What each package does:**
- `vue` — Vue 3 runtime
- `@vitejs/plugin-vue` — Compiles `.vue` SFCs in Vite
- `vitest` — Test runner (Vite-native, replaces Node's test runner for Vue components)
- `@vue/test-utils` — Mounts Vue components in tests, simulates clicks, queries DOM
- `jsdom` — Browser environment for tests (DOM API without a real browser)

**Verification:** `package.json` and `package-lock.json` are updated. `node_modules/vue/` and `node_modules/vitest/` exist.

### Step 2: Update Vite Configuration

**File:** `vite.config.js`

**Changes:**
1. Import `@vitejs/plugin-vue`
2. Add it to the plugins array
3. Add `resolve.alias` for `@/` → `ux/`

**Expected `vite.config.js`:**

```js
import fs from 'fs';
import path from 'path';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import vue from '@vitejs/plugin-vue';

// Simple custom plugin to inject HTML partials natively at build-time
function htmlPartials() {
  return {
    name: 'html-partials',
    enforce: 'pre',
    transformIndexHtml(html) {
      return html.replace(/<include src="([^"]+)"\s*(?:\/>|><\/include>)/g, (match, filePath) => {
        const absolutePath = path.resolve(process.cwd(), filePath);
        if (fs.existsSync(absolutePath)) {
          return fs.readFileSync(absolutePath, 'utf8');
        }
        return `<!-- Missing partial: ${filePath} -->`;
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const isDebug = mode === 'debug';

  return {
    root: '.',
    plugins: [htmlPartials(), vue(), viteSingleFile()],
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), 'ux')
      }
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      minify: isDebug ? false : 'esbuild',
      cssMinify: isDebug ? false : 'esbuild',
      // rollupOptions.input defaults to index.html at project root
      // Do not hardcode — allows alternate entry points (e.g., test-vue.html)
    }
  };
});
```

**Key points:**
- `vue()` is placed before `viteSingleFile()` so Vue SFCs are compiled before inlining
- `resolve.alias` enables `import Something from '@/components/Something.vue'`
- `vite-plugin-singlefile` works unchanged with Vue — compiled SFCs are standard JS/CSS
- No Electron changes needed — it loads `dist/index.html` which remains self-contained
- No CSP changes needed — Vue's scoped CSS uses attribute selectors, not inline styles

**Verification:** `npm run build` still succeeds for the existing game. If it fails, check that `vue()` plugin is properly imported and called.

### Step 3: Create `ux/` Directory Structure

```bash
mkdir -p ux/core/composables
mkdir -p ux/components
mkdir -p ux/features
mkdir -p ux/adapters
touch ux/components/.gitkeep
touch ux/features/.gitkeep
touch ux/adapters/.gitkeep
```

### Step 4: Create Theme Tokens

**File:** `ux/core/theme.css`

```css
/* Design Tokens — CSS Custom Properties
 * These are the ONLY global styles in the new architecture.
 * Components use var(--token-name) for colors, spacing, fonts.
 */

:root {
  /* Colors */
  --color-primary: #6366f1;
  --color-primary-light: #818cf8;
  --color-danger: #ff6b6b;
  --color-success: #10ac84;
  --color-warning: #f59e0b;
  
  /* Text */
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  
  /* Backgrounds */
  --bg-base: #0f172a;
  --bg-card: rgba(30, 41, 59, 0.7);
  --bg-overlay: rgba(0, 0, 0, 0.85);
  
  /* Borders */
  --glass-border: rgba(255, 255, 255, 0.1);
  
  /* Typography */
  --font-heading: 'Outfit', sans-serif;
  --font-body: 'Inter', sans-serif;
  
  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  /* Radii */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 12px;
}
```

**Verification:** These tokens are a starting set. They will expand as components are built. The values mirror the existing design system's colors and spacing.

### Step 5: Create Vue App Bootstrap (Placeholder)

**File:** `ux/main.js`

```js
import { createApp } from 'vue'
import App from './App.vue'
import './core/theme.css'

/**
 * Mounts the Vue application.
 * This function is called by js/main.js on switch day.
 * For now, it exists only to prove the pipeline works.
 * 
 * On switch day, this will:
 * 1. Receive the engine instance
 * 2. Provide engine, adapter, and i18n via Vue's provide/inject
 * 3. Mount the Vue app
 */
export function createVueApp({ engine, container }) {
  const app = createApp(App, { engine })
  
  // On switch day, these provides enable composables:
  // const gameState = shallowRef(engine.update())
  // const currentLanguage = ref(engine.i18n.getCurrentLanguage?.() || 'en')
  // app.provide('engine', engine)
  // app.provide('gameState', gameState)
  // app.provide('adapter', createAdapter(engine, gameState))
  // app.provide('i18n', engine.i18n)
  // app.provide('currentLanguage', currentLanguage)
  // app.config.errorHandler = (err, instance, info) => { ... }
  
  app.mount(container)
  return app
}
```

**File:** `ux/App.vue`

```vue
<template>
  <div class="app-root">
    <h1>RPG Village — Vue App Placeholder</h1>
    <p>If you see this, Vue is compiling and mounting correctly.</p>
    <HelloWorld msg="Vue 3 is ready" />
  </div>
</template>

<script setup>
import HelloWorld from './components/HelloWorld.vue'

defineProps({
  engine: { type: Object, default: null }
})
</script>

<style scoped>
.app-root {
  font-family: var(--font-body);
  color: var(--text-primary);
  background: var(--bg-base);
  padding: var(--spacing-lg);
}

h1 {
  font-family: var(--font-heading);
  color: var(--color-primary);
}
</style>
```

### Step 5b: Create Composables (Placeholders)

**File:** `ux/core/composables/useGameState.js`

```js
import { inject } from 'vue'

export function useGameState() {
  const gameState = inject('gameState')
  if (!gameState) {
    // During Phase 0–1 testing, no engine is provided.
    // Return a no-op ref for isolated component tests.
    return { gameState: { value: {} } }
  }
  return { gameState }
}
```

**File:** `ux/core/composables/useI18n.js`

```js
import { inject } from 'vue'

export function useI18n() {
  const i18n = inject('i18n')
  const currentLanguage = inject('currentLanguage', null)
  
  if (!i18n) {
    // Fallback for isolated testing
    return {
      t: (key) => key,
      setLanguage: () => {},
      currentLanguage: { value: 'en' }
    }
  }
  
  return {
    t: (key, params) => {
      currentLanguage?.value // establish reactive dependency
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

**File:** `ux/core/composables/useAdapter.js`

```js
import { inject } from 'vue'

export function useAdapter() {
  const adapter = inject('adapter')
  if (!adapter) {
    return {
      dispatch: () => ({ success: false, error: 'adapter_not_provided' })
    }
  }
  return {
    dispatch: (domain, action, payload) => adapter.dispatch(domain, action, payload)
  }
}
```

**Why these exist in Phase 0:** They establish the composable pattern. Components in Phase 1 (PoC) can import them. When the engine is not provided (Phase 0–1), they return safe fallbacks.

### Step 5c: Create FullViewOverlay Primitive

**File:** `ux/components/FullViewOverlay.vue`

```vue
<template>
  <div class="fullview-overlay">
    <header class="fullview-header">
      <div class="fullview-title">
        <span v-if="$slots.icon" class="fullview-icon">
          <slot name="icon" />
        </span>
        <h2><slot name="title" /></h2>
      </div>
      <CloseButton @close="$emit('close')" />
    </header>
    <div class="fullview-body">
      <slot />
    </div>
  </div>
</template>

<script setup>
import CloseButton from './CloseButton.vue'

defineEmits(['close'])
</script>

<style scoped>
.fullview-overlay {
  position: fixed;
  inset: 0;
  background: var(--bg-base);
  display: flex;
  flex-direction: column;
  z-index: 1000;
}

.fullview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--glass-border);
  flex-shrink: 0;
}

.fullview-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.fullview-title h2 {
  margin: 0;
  font-family: var(--font-heading);
  color: var(--text-primary);
}

.fullview-icon {
  font-size: 1.5rem;
}

.fullview-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-lg);
}
</style>
```

### Step 6: Create CloseButton Primitive

**File:** `ux/components/CloseButton.vue`

```vue
<template>
  <button class="btn-close" @click="$emit('close')" aria-label="Close">✕</button>
</template>

<script setup>
defineEmits(['close'])
</script>

<style scoped>
.btn-close {
  background: transparent;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: var(--text-muted);
  padding: var(--spacing-xs);
  line-height: 1;
}

.btn-close:hover {
  color: var(--text-primary);
}
</style>
```

**Why this exists in Setup:** It establishes the primitive pattern. `CloseButton` emits `@close`. The parent decides what "close" means. No magic. No global state.

### Step 6b: Create ModalFrame Primitive

**File:** `ux/components/ModalFrame.vue`

```vue
<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-body">
      <header class="modal-header">
        <h3 v-if="title">{{ title }}</h3>
        <CloseButton @close="$emit('close')" />
      </header>
      <div class="modal-content">
        <slot />
      </div>
      <footer v-if="$slots.footer" class="modal-footer">
        <slot name="footer" />
      </footer>
    </div>
  </div>
</template>

<script setup>
import CloseButton from './CloseButton.vue'

defineProps({
  title: { type: String, default: '' }
})

defineEmits(['close'])
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: var(--bg-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-body {
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--glass-border);
}

.modal-header h3 {
  margin: 0;
  font-family: var(--font-heading);
  color: var(--text-primary);
}

.modal-content {
  padding: var(--spacing-md);
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: var(--spacing-md);
  border-top: 1px solid var(--glass-border);
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
}
</style>
```

### Step 7: Create Test Component

**File:** `ux/components/HelloWorld.vue`

```vue
<template>
  <div class="hello-world">
    <h2>{{ msg }}</h2>
    <p>Vue version: {{ vueVersion }}</p>
    <button class="btn" @click="count++">Clicked {{ count }} times</button>
  </div>
</template>

<script setup>
import { ref, version } from 'vue'

const props = defineProps({
  msg: { type: String, required: true }
})

const vueVersion = version
const count = ref(0)
</script>

<style scoped>
.hello-world {
  padding: var(--spacing-md);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
}

h2 {
  margin-top: 0;
  color: var(--color-primary-light);
}

.btn {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-family: var(--font-body);
}

.btn:hover {
  background: var(--color-primary-light);
}
</style>
```

**Purpose:** This component tests:
- Props passing (`msg`)
- Reactive state (`count` ref)
- Event handling (`@click`)
- Scoped styles (`.btn` does not leak)
- Vue version display (confirms correct runtime)

### Step 8: Configure Vitest for Vue Testing

**File:** `vitest.config.js`

```js
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), 'ux')
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/vue/**/*.spec.js']
  }
})
```

**File:** `tests/vue/HelloWorld.spec.js`

```js
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import HelloWorld from '../../ux/components/HelloWorld.vue'

describe('HelloWorld.vue', () => {
  it('renders greeting message', () => {
    const wrapper = mount(HelloWorld, {
      props: { msg: 'Hello Vue' }
    })
    expect(wrapper.text()).toContain('Hello Vue')
    expect(wrapper.text()).toContain('Vue version: 3.')
  })

  it('increments count on click', async () => {
    const wrapper = mount(HelloWorld, {
      props: { msg: 'Test' }
    })
    
    expect(wrapper.text()).toContain('Clicked 0 times')
    
    await wrapper.find('button').trigger('click')
    
    expect(wrapper.text()).toContain('Clicked 1 times')
  })

  it('accepts msg prop', () => {
    const wrapper = mount(HelloWorld, {
      props: { msg: 'Custom Message' }
    })
    expect(wrapper.find('h2').text()).toBe('Custom Message')
  })
})
```

**Why this exists in Setup:**
- Establishes the testing pattern for all future components
- Proves that `.vue` SFCs can be mounted and tested in isolation
- Provides a template for component tests: `mount()` → assert render → interact → assert change

### Step 9: Create Temporary Test Entry Point

**File:** `test-vue.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RPG Village — Vue Test</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      background: #0f172a;
      min-height: 100vh;
    }
  </style>
</head>
<body>
  <div id="vue-app"></div>
  <script type="module">
    import { createApp } from 'vue'
    import App from './ux/App.vue'
    
    const app = createApp(App, { engine: null })
    app.mount('#vue-app')
  </script>
</body>
</html>
```

**Purpose:** A standalone HTML file that mounts the Vue app without touching `index.html` or `js/main.js`. Used only for verification.

---

## 5. Electron Compatibility

The Electron app loads `dist/index.html` directly:

```js
// infrastructure/electron/main.js (UNCHANGED)
win.loadFile(path.join(__dirname, '../../dist/index.html'));
```

Electron does **not** import `js/main.js` directly. It loads the **build output**. This means:

- **No Electron code changes are needed for the switch.**
- The switch happens entirely in the Vite build pipeline.
- `vite-plugin-singlefile` inlines all JS and CSS into `dist/index.html`, so Electron receives a single self-contained file.

Vue compiles `.vue` SFCs into JavaScript render functions and scoped CSS. These are standard JS/CSS assets that `vite-plugin-singlefile` inlines exactly like the current vanilla JS assets.

### Potential Concern: Vue Runtime Size

Vue 3 runtime adds ~22KB gzipped (~70KB ungzipped) to the bundle. The old `js/presentation/` code will be deleted in Phase 4, more than offsetting this increase.

### Phase 4 Switch for Electron

When the switch happens, the ONLY change is in `js/main.js`:

```js
// BEFORE (old UI)
import { UIController } from './presentation/ui/UIController.js'

// AFTER (Vue app)
import { createVueApp } from '../ux/main.js'
```

Then:
1. `npm run build` → produces `dist/index.html` with Vue app
2. `npm run electron:make` → packages the app with the new `dist/index.html`
3. Electron `main.js` loads it automatically

That's it. No `infrastructure/electron/` files are touched.

---

## 6. Verification & Testing

### Test 1: Build Succeeds

```bash
npm run build
```

**Expected:** Build completes with zero errors. `dist/index.html` is generated.

**If it fails:**
- Check that `@vitejs/plugin-vue` is installed in `node_modules/`
- Check that `vue()` is called (not just imported) in `vite.config.js`
- Check that `vite-plugin-singlefile` is still in the plugins array

### Test 2: Old Game Still Works

```bash
npm run dev
```

Open `http://localhost:5173` (or whichever port Vite uses).

**Expected:** The existing RPG Village game loads and plays normally. No Vue components are visible because `index.html` still uses `js/main.js` which mounts the old UI.

**If it fails:**
- Check that `vite.config.js` changes did not break the existing rollup input
- Check that `htmlPartials()` plugin still works

### Test 3: Vue Component Renders (Development)

```bash
npx vite --open test-vue.html
```

Or open `http://localhost:5173/test-vue.html` manually.

**Expected:** A page displays:
- "RPG Village — Vue App Placeholder" heading
- "Vue 3 is ready" subheading
- "Vue version: 3.x.x"
- A button that increments a counter when clicked
- Styled with the design tokens (dark background, purple accents)

**Screenshot:** Take a screenshot and save it to `artifacts/ux-setup-verification.png` for the record.

**If it fails:**
- Check browser console for import errors (path alias `@/` may need adjustment)
- Check that `test-vue.html` uses the correct relative import path for `App.vue`
- Check that Vue runtime is included in the bundle

### Test 4: Vue Component Renders (Production Build)

```bash
npx vite build ./test-vue.html --outDir=dist-test
```

Open `dist-test/test-vue.html` in a browser.

**Expected:** Same visual result as Test 3, but from a production build.

**Cleanup:** Delete `dist-test/` after verification.

### Test 5: Scoped Styles Work

Inspect the "Clicked X times" button in browser DevTools.

**Expected:** The button has a scoped attribute like `[data-v-f3f3eg9]`. A `.btn` class in `HelloWorld.vue` does not affect any other `.btn` on the page.

### Test 7: Electron-Compatible Build Output

After `npm run build`, inspect `dist/index.html`:

```bash
grep -o '<script[^>]*>' dist/index.html | wc -l
grep -o '<link[^>]*rel="stylesheet"' dist/index.html | wc -l
```

**Expected:** `vite-plugin-singlefile` should have inlined all JS and CSS. The `dist/index.html` should contain zero external `<script src="...">` or `<link href="...">` references. Everything is inline.

**Why this matters:** Electron loads `dist/index.html` from the filesystem. External file references would break because relative paths resolve differently in Electron's ASAR archive. `vite-plugin-singlefile` ensures a single self-contained file.

### Test 8: Component Tests Run

```bash
npx vitest run
```

**Expected:** Vitest discovers and runs `tests/vue/HelloWorld.spec.js`. Output shows:
```
 ✓ tests/vue/HelloWorld.spec.js (3 tests)
   ✓ renders greeting message
   ✓ increments count on click
   ✓ accepts msg prop
```

**If it fails:**
- Check that `vitest.config.js` includes `@vitejs/plugin-vue`
- Check that `jsdom` is installed
- Check that `@vue/test-utils` `mount()` receives the correct props

### Test 9: Electron Package Verification (Optional but Recommended)

```bash
npm run build
npm run electron:package
```

Launch the packaged app from `out/rpg-village-<platform>/`.

**Expected:** The existing vanilla game loads and plays normally. No Vue components are visible (expected — we haven't switched yet). This confirms that adding the Vue plugin to Vite did not break the Electron packaging pipeline.

**Note:** This test takes longer (~1-2 minutes). It can be skipped if time-constrained, but it provides maximum confidence.

---

## 7. Rollback Procedure

If the build breaks and cannot be fixed quickly:

1. Revert `vite.config.js` to its original state (remove `vue` import, plugin, and alias)
2. Revert `package.json` (remove `vue` and `@vitejs/plugin-vue` from dependencies)
3. Run `npm install` to sync `node_modules`
4. Verify `npm run build` succeeds
5. Verify `npm run electron:package` succeeds (if Test 7 was run)
6. Delete `ux/` directory and `test-vue.html` (they were not referenced by the old code)

The old game is restored. No data is lost. Electron packaging is restored.

---

## 8. Acceptance Criteria

- [ ] `npm install vue @vitejs/plugin-vue` completes without errors
- [ ] `vite.config.js` includes `vue()` plugin and `@/` alias
- [ ] `npm run build` succeeds for the existing game (`dist/index.html` generated)
- [ ] `npm run dev` serves the old game normally
- [ ] `test-vue.html` renders the Vue app with `HelloWorld.vue` component
- [ ] The counter button in `HelloWorld.vue` increments when clicked
- [ ] Scoped styles are verified in DevTools
- [ ] `dist/index.html` is fully self-contained (no external script/link references)
- [ ] `npm run electron:package` succeeds (optional but recommended)
- [ ] `ux/` directory structure exists with all placeholder folders
- [ ] `ux/core/theme.css` exists with initial design tokens
- [ ] `ux/core/composables/useGameState.js` exists (uses `inject('gameState')`)
- [ ] `ux/core/composables/useI18n.js` exists (reactive language switching via `currentLanguage`)
- [ ] `ux/core/composables/useAdapter.js` exists (uses `inject('adapter')`)
- [ ] `ux/components/CloseButton.vue` exists and emits `@close`
- [ ] `ux/components/ModalFrame.vue` exists and includes CloseButton
- [ ] `ux/components/FullViewOverlay.vue` exists and includes CloseButton
- [ ] `vitest.config.js` exists with Vue plugin and `@/` alias
- [ ] `tests/vue/HelloWorld.spec.js` exists and passes (`npx vitest run`)
- [ ] No files in `js/presentation/`, `pages/`, `css/`, `js/engine/`, or `infrastructure/electron/` were modified
- [ ] Screenshot of working Vue test saved to `artifacts/`

---

## 9. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `vite-plugin-singlefile` conflicts with Vue SFC compilation | Low | High | Verify build output. If conflict occurs, adjust plugin order or consult `vite-plugin-singlefile` docs. Test 6 verifies self-contained output. |
| Path alias `@/` breaks existing imports | Low | Medium | Use a unique alias (`@/` is standard but ensure no existing code uses it). Test build before and after. |
| Vue runtime increases bundle size significantly | Low | Low | Vue 3 is ~22KB gzipped. Old `js/presentation/` code will be deleted later, offsetting size. |
| `htmlPartials()` plugin breaks with Vue plugin | Low | High | `htmlPartials` runs with `enforce: 'pre'` so it executes before Vue compilation. No conflict expected. |
| Build passes but Vue app doesn't mount | Medium | Medium | Use `test-vue.html` to verify runtime before proceeding to Phase 1. |
| Electron packaging breaks due to Vue plugin | Low | High | Test 7 (`electron:package`) verifies the full pipeline. Electron loads `dist/index.html` — it doesn't know about Vue. |

---

## 10. Notes for Future Sessions

- The `test-vue.html` file is temporary. It will be deleted in Phase 4 when the real switch happens.
- `ux/main.js` is a placeholder. In Phase 4, it will receive the real engine instance from `js/main.js` and uncomment the `app.provide()` calls.
- `ux/core/theme.css` is a minimal starting set. Tokens will be added as components require them.
- The `@/` alias is established now. All future imports in `ux/` should use it: `import Button from '@/components/Button.vue'`.
- **Composables prevent prop drilling.** Feature components use `useI18n()`, `useGameState()`, `useAdapter()` instead of receiving these through props. Primitives remain pure.
- **Game state uses `shallowRef()`**, not `ref()`. Deep reactivity is unnecessary and expensive for immutable state snapshots.
- **i18n is reactive.** `useI18n().t()` depends on `currentLanguage` ref. Language switches trigger automatic re-renders.
- **Electron is ready.** No `infrastructure/electron/` changes are needed in any future phase. The switch is automatic via `dist/index.html`.
- **Testing is ready.** `vitest` + `@vue/test-utils` + `jsdom` are configured. Mock composables via `global.provide`. Every future component must have a `.spec.js` test file in `tests/vue/<Domain>/`.

---

## 11. Summary

This plan establishes the Vue 3 build pipeline without touching the running game or the Electron packaging. It is the foundation on which all future component work depends.

**The Electron switch is pre-wired:** `infrastructure/electron/main.js` loads `dist/index.html`. When `js/main.js` eventually imports `ux/main.js` instead of the old UI controller, `vite build` will produce a Vue-powered `dist/index.html`, and Electron will serve it automatically. No Electron-side changes required in any phase.

Once this setup is verified, Phase 1 (Proof of Concept) can begin with confidence that Vue compiles, mounts, renders correctly, and packages correctly for Electron.

---

*Document Version: 1.2 (Reviewed)*
*Reviewed: 2026-06-05*
*Created: 2026-06-05*
*Phase: 0 — Pipeline & Infrastructure*
*Next Phase: 1 — Proof of Concept (TrainingGrounds.vue + GambitEditor.vue)*
