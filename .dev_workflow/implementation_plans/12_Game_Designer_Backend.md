# Implementation Plan 12: Game Designer Backend — Phase 1 (Lore & History Config Management)

## Goal

Convert the hardcoded `PresentationCatalog.js` and i18n translation modules into a **configuration-driven pipeline**: editable JSON files, a web-based designer UI, and a build-time ingestion script that regenerates the JS modules the engine consumes. No player-facing behavior changes. Zero breaking changes to save compatibility.

> **Prerequisite:** Read `ideas/12_Game_Designer_Backend.md` for architecture decisions and trade-off analysis. This plan is the technical execution of that design, limited to Phase 1 (presentations + i18n).

---

## Phase 1 — Config Infrastructure

### 1.1 Directory Setup

Create the following directories (add to `.gitignore` where noted):

```bash
mkdir -p config/schemas
mkdir -p config/i18n
mkdir -p scripts
mkdir -p designer/js/components designer/js/stores designer/css
mkdir -p js/engine/shared/data/_generated
mkdir -p js/engine/shared/core/i18n/translations/_generated
```

Add to `.gitignore`:
```gitignore
# Generated config modules — source of truth is config/*.json
js/engine/shared/data/_generated/
js/engine/shared/core/i18n/translations/_generated/
```

### 1.2 JSON Schema for Presentations

**New File:** `config/schemas/presentations.schema.json`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "presentations.schema.json",
  "title": "Presentation Catalog",
  "type": "object",
  "required": ["version", "presentations"],
  "properties": {
    "version": {
      "type": "string",
      "description": "Config format version. Ingestion script checks this."
    },
    "presentations": {
      "type": "array",
      "items": { "$ref": "#/definitions/presentation" }
    }
  },
  "definitions": {
    "presentation": {
      "type": "object",
      "required": ["id", "chapter", "pages", "trigger"],
      "properties": {
        "id": {
          "type": "string",
          "pattern": "^pres_[a-z0-9_]+$",
          "description": "Unique presentation identifier"
        },
        "chapter": {
          "type": "integer",
          "minimum": 1,
          "description": "Chapter number for collection/milestone tracking"
        },
        "pages": {
          "type": "array",
          "minItems": 1,
          "items": { "$ref": "#/definitions/page" }
        },
        "trigger": { "$ref": "#/definitions/trigger" }
      }
    },
    "page": {
      "type": "object",
      "required": ["image", "textKey"],
      "properties": {
        "image": {
          "type": "string",
          "description": "Path to image asset, relative to project root or public dir"
        },
        "textKey": {
          "type": "string",
          "pattern": "^[a-z][a-z0-9_]*$",
          "description": "i18n translation key for this page's narrative text"
        }
      }
    },
    "trigger": {
      "type": "object",
      "required": ["type"],
      "properties": {
        "type": {
          "type": "string",
          "enum": [
            "new_game",
            "building_complete",
            "mission_complete",
            "hero_recruited",
            "first_event",
            "chapter_milestones"
          ]
        }
      },
      "allOf": [
        {
          "if": { "properties": { "type": { "const": "building_complete" } } },
          "then": {
            "required": ["buildingId", "level"],
            "properties": {
              "buildingId": { "type": "string" },
              "level": { "type": "integer", "minimum": 1 }
            }
          }
        },
        {
          "if": { "properties": { "type": { "const": "mission_complete" } } },
          "then": {
            "required": ["missionId"],
            "properties": {
              "missionId": { "type": "string" }
            }
          }
        },
        {
          "if": { "properties": { "type": { "const": "hero_recruited" } } },
          "then": {
            "anyOf": [
              { "required": ["origin"] },
              { "required": ["heroName"] }
            ],
            "properties": {
              "origin": { "type": "string" },
              "heroName": { "type": "string" }
            }
          }
        },
        {
          "if": { "properties": { "type": { "const": "first_event" } } },
          "then": {
            "required": ["eventId"],
            "properties": {
              "eventId": { "type": "string" }
            }
          }
        },
        {
          "if": { "properties": { "type": { "const": "chapter_milestones" } } },
          "then": {
            "required": ["chapter", "required", "total"],
            "properties": {
              "chapter": { "type": "integer", "minimum": 1 },
              "required": { "type": "integer", "minimum": 1 },
              "total": { "type": "integer", "minimum": 1 }
            }
          }
        }
      ]
    }
  }
}
```

> **Note:** The `allOf` conditional schema enforces that `building_complete` triggers require `buildingId` and `level`, while `chapter_milestones` triggers require `chapter`, `required`, and `total`. This prevents a designer from saving a structurally valid but semantically broken trigger.

### 1.3 JSON Schema for i18n

**New File:** `config/schemas/i18n.schema.json`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "i18n.schema.json",
  "title": "Translation File",
  "type": "object",
  "patternProperties": {
    "^[a-z][a-z0-9_]*$": {
      "type": "string"
    }
  },
  "additionalProperties": false
}
```

> **Note:** `additionalProperties: false` ensures no stray keys with typos slip in. The key pattern enforces the project's naming convention.

### 1.4 Migrate Existing Data to JSON

**New File:** `scripts/migrate-hardcoded.js` (one-time use)

This script reads the current `PRESENTATION_CATALOG` array and the 5 translation modules, then writes:
- `config/presentations.json`
- `config/i18n/en.json`, `es.json`, `ca.json`, `eu.json`, `gl.json`

```js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

// Load existing modules (we eval them since they're ES modules with exports)
// In practice, use a dynamic import or a simple regex extraction.
// Simpler: write the JSON by hand from the known catalog, then verify.
// The script below is a template; the actual implementation can parse
// the existing JS files or we can simply copy the known structure.

function writeJson(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 4) + '\n', 'utf8');
    console.log('Wrote', filePath);
}

// --- Presentations ---
// Because the existing catalog is a JS module, the simplest robust approach
// is to import it and serialize. Node can import ES modules.
const catalogModule = await import(
    path.resolve(root, 'js/engine/shared/data/PresentationCatalog.js')
);
const presentations = {
    version: '1.0.0',
    presentations: catalogModule.PRESENTATION_CATALOG
};
writeJson(path.resolve(root, 'config/presentations.json'), presentations);

// --- i18n ---
const langs = ['en', 'es', 'ca', 'eu', 'gl'];
for (const lang of langs) {
    const mod = await import(
        path.resolve(root, `js/engine/shared/core/i18n/translations/${lang}.js`)
    );
    const data = mod[lang];
    writeJson(path.resolve(root, `config/i18n/${lang}.json`), data);
}

console.log('Migration complete.');
```

**Run once:**
```bash
node scripts/migrate-hardcoded.js
```

After running, verify that `config/presentations.json` and `config/i18n/*.json` exist and contain the expected data. Commit these files. The original JS files remain untouched until Phase 4.

---

## Phase 2 — Build-Time Ingestion

### 2.1 Ingestion Script

**New File:** `scripts/ingest-configs.js`

This script reads JSON configs and generates JS modules that mirror the current hand-written exports. It runs before every `vite build` and `vite dev`.

```js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function writeGenerated(filePath, content) {
    ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, content, 'utf8');
}

// ─── Presentations ───
const presPath = path.resolve(root, 'config/presentations.json');
const presData = JSON.parse(fs.readFileSync(presPath, 'utf8'));

const presContent = `/**
 * GENERATED FILE — Do not edit by hand.
 * Source: config/presentations.json
 * Regenerate: node scripts/ingest-configs.js
 */
export const PRESENTATION_CATALOG = ${JSON.stringify(presData.presentations, null, 4)};

export function getPresentationById(id) {
    return PRESENTATION_CATALOG.find(p => p.id === id);
}
`;
writeGenerated(
    path.resolve(root, 'js/engine/shared/data/_generated/PresentationCatalog.js'),
    presContent
);
console.log('[ingest] Presentations ingested.');

// ─── i18n ───
const i18nDir = path.resolve(root, 'config/i18n');
const i18nOutDir = path.resolve(root, 'js/engine/shared/core/i18n/translations/_generated');
const langs = ['en', 'es', 'ca', 'eu', 'gl'];

for (const lang of langs) {
    const jsonPath = path.resolve(i18nDir, `${lang}.json`);
    const translations = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const jsContent = `/**
 * GENERATED FILE — Do not edit by hand.
 * Source: config/i18n/${lang}.json
 * Regenerate: node scripts/ingest-configs.js
 */
export const ${lang} = ${JSON.stringify(translations, null, 4)};
`;
    writeGenerated(path.resolve(i18nOutDir, `${lang}.js`), jsContent);
    console.log(`[ingest] i18n/${lang} ingested.`);
}

console.log('[ingest] All configs ingested successfully.');
```

### 2.2 Wire Ingestion into Build & Dev

**File:** `package.json`

Add scripts:
```json
{
  "scripts": {
    "ingest": "node scripts/ingest-configs.js",
    "predev": "npm run ingest",
    "prebuild": "npm run ingest && npm run validate:config",
    "validate:config": "node scripts/validate-configs.js",
    "build:designer": "vite build",
    "designer": "npm run build:designer && electron infrastructure/electron/designer-main.js"
  }
}
```

> **Note:** `predev` and `prebuild` are npm lifecycle hooks. `npm run dev` automatically runs `npm run predev` first. Same for `prebuild`.

---

## Phase 3 — Validation

### 3.1 Validation Script

**New File:** `scripts/validate-configs.js`

```js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

let hasError = false;

function fail(msg) {
    console.error('  ✖', msg);
    hasError = true;
}

function ok(msg) {
    console.log('  ✔', msg);
}

// ─── Structural: JSON Schema ───
// We use a lightweight JSON Schema validator. No external dependency needed for basic checks;
// for full compliance we can import ajv if desired. For Phase 1, manual structural checks are sufficient.
// If ajv is added as a devDependency, replace this section with ajv.validate().

function validatePresentations() {
    console.log('\nValidating config/presentations.json ...');
    const data = JSON.parse(fs.readFileSync(path.resolve(root, 'config/presentations.json'), 'utf8'));

    if (!data.version) fail('Missing "version" field');
    else ok(`Version: ${data.version}`);

    if (!Array.isArray(data.presentations)) fail('Missing "presentations" array');
    else ok(`Presentations count: ${data.presentations.length}`);

    const ids = new Set();
    for (const p of data.presentations) {
        if (!p.id) { fail('Presentation missing "id"'); continue; }
        if (ids.has(p.id)) fail(`Duplicate presentation id: ${p.id}`);
        ids.add(p.id);

        if (!/^pres_[a-z0-9_]+$/.test(p.id)) fail(`Invalid id format: ${p.id}`);
        if (!Number.isInteger(p.chapter) || p.chapter < 1) fail(`${p.id}: chapter must be >= 1`);
        if (!Array.isArray(p.pages) || p.pages.length === 0) fail(`${p.id}: must have at least one page`);
        if (!p.trigger || !p.trigger.type) fail(`${p.id}: trigger.type is required`);

        // Trigger-specific validation
        const t = p.trigger;
        switch (t.type) {
            case 'building_complete':
                if (!t.buildingId) fail(`${p.id}: building_complete requires buildingId`);
                if (!Number.isInteger(t.level)) fail(`${p.id}: building_complete requires level`);
                break;
            case 'mission_complete':
                if (!t.missionId) fail(`${p.id}: mission_complete requires missionId`);
                break;
            case 'hero_recruited':
                if (!t.origin && !t.heroName) fail(`${p.id}: hero_recruited requires origin or heroName`);
                break;
            case 'first_event':
                if (!t.eventId) fail(`${p.id}: first_event requires eventId`);
                break;
            case 'chapter_milestones':
                if (!Number.isInteger(t.chapter)) fail(`${p.id}: chapter_milestones requires chapter`);
                if (!Number.isInteger(t.required)) fail(`${p.id}: chapter_milestones requires required`);
                if (!Number.isInteger(t.total)) fail(`${p.id}: chapter_milestones requires total`);
                if (t.required > t.total) fail(`${p.id}: required (${t.required}) > total (${t.total})`);
                break;
        }
    }

    // ─── Referential: textKeys exist in en.json ───
    const en = JSON.parse(fs.readFileSync(path.resolve(root, 'config/i18n/en.json'), 'utf8'));
    for (const p of data.presentations) {
        for (const page of p.pages) {
            if (!en[page.textKey]) {
                fail(`${p.id}: textKey "${page.textKey}" not found in config/i18n/en.json`);
            }
        }
    }
    ok('All textKeys resolved in en.json');
}

function validateI18n() {
    console.log('\nValidating config/i18n/*.json ...');
    const langs = ['en', 'es', 'ca', 'eu', 'gl'];
    const en = JSON.parse(fs.readFileSync(path.resolve(root, 'config/i18n/en.json'), 'utf8'));
    const enKeys = Object.keys(en).sort();

    for (const lang of langs) {
        const data = JSON.parse(fs.readFileSync(path.resolve(root, `config/i18n/${lang}.json`), 'utf8'));
        const keys = Object.keys(data).sort();
        const missing = enKeys.filter(k => !data[k]);
        const extra = keys.filter(k => !en[k]);

        if (missing.length > 0) {
            // Non-English languages are allowed to have missing keys (they fall back to raw key).
            // But we warn so translators know what's left.
            console.log(`  ⚠ ${lang}.json: ${missing.length} keys missing vs en.json`);
        }
        if (extra.length > 0) {
            fail(`${lang}.json: ${extra.length} extra keys not in en.json: ${extra.join(', ')}`);
        }
        ok(`${lang}.json: ${keys.length} keys`);
    }
}

validatePresentations();
validateI18n();

if (hasError) {
    console.error('\nValidation FAILED. Fix errors before building.\n');
    process.exit(1);
} else {
    console.log('\nValidation passed.\n');
    process.exit(0);
}
```

> **Future enhancement:** Replace manual checks with `ajv` for strict JSON Schema compliance. Add as a devDependency if the team prefers it.

---

## Phase 4 — Engine Integration (Thin Re-Exports)

### 4.1 Replace Hand-Written Catalog with Generated Import

**File:** `js/engine/shared/data/PresentationCatalog.js`

Replace the entire file content with a thin re-export:

```js
/**
 * PresentationCatalog — Re-export of generated config.
 *
 * EDIT THE SOURCE: config/presentations.json
 * Do not edit this file directly — it is regenerated by `npm run ingest`.
 */
export { PRESENTATION_CATALOG, getPresentationById } from './_generated/PresentationCatalog.js';
```

> **Critical:** The export names (`PRESENTATION_CATALOG`, `getPresentationById`) and the data shape must remain **identical** to the current hand-written module. `PresentationService.js`, `ChronicleView.js`, and all tests import from this path. No importer needs to change.

### 4.2 Replace Hand-Written i18n Modules with Generated Imports

**File:** `js/engine/shared/core/i18n/translations/en.js` (and `es.js`, `ca.js`, `eu.js`, `gl.js`)

Replace each with:

```js
/**
 * English translations — Re-export of generated config.
 *
 * EDIT THE SOURCE: config/i18n/en.json
 * Do not edit this file directly — it is regenerated by `npm run ingest`.
 */
export { en } from './_generated/en.js';
```

> **Note:** `I18nService.js` imports `en` from this path. The generated `_generated/en.js` exports `en` as a named export, exactly as the current hand-written file does. No change to `I18nService`.

---

## Phase 5 — Designer UI

### 5.1 Vite Config Update

**File:** `vite.config.js`

Add the designer as a second build entry point. No dev-server middleware is needed — the designer is an Electron app with direct `fs` access.

```js
import fs from 'fs';
import path from 'path';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

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
        plugins: [htmlPartials()],
        build: {
            outDir: 'dist',
            emptyOutDir: true,
            minify: isDebug ? false : 'esbuild',
            cssMinify: isDebug ? false : 'esbuild',
            rollupOptions: {
                input: {
                    main: path.resolve(process.cwd(), 'index.html'),
                    designer: path.resolve(process.cwd(), 'designer/index.html')
                }
            }
        }
    };
});
```

> **Note:** `viteSingleFile()` is intentionally **omitted** from the designer build. The designer is not shipped to players. In production player builds (`npm run build`), only `dist/index.html` is packaged. The designer entry point is excluded from Electron packaging via `forge.config.js`.

**File:** `forge.config.js`

Ensure the Electron packager excludes the designer build output from player releases:

```js
packagerConfig: {
    asar: true,
    icon: './assets/icon',
    ignore: [
        /^\/out($|\/)/,
        /^\/\.git($|\/)/,
        /^\/tests($|\/)/,
        /^\/\.github($|\/)/,
        /^\/rpg-village-windows\.zip$/,
        /^\/dist\/designer($|\/)/,        // Exclude designer build from player app
        /^\/config($|\/)/,                // Exclude raw configs (player uses generated modules)
        /^\/designer($|\/)/,              // Exclude designer source
        /^\/scripts($|\/)/,               // Exclude build scripts
    ],
},
```

### 5.2 Designer HTML Entry Point

**New File:** `designer/index.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RPG Village — Designer Backend</title>
    <link rel="stylesheet" href="./css/designer.css">
</head>
<body>
    <div id="app">
        <header class="designer-header">
            <h1>🎮 Game Designer Backend</h1>
            <nav class="designer-tabs">
                <button data-tab="lore" class="active">Lore & History</button>
                <button data-tab="texts">Text Manager</button>
            </nav>
            <div class="designer-actions">
                <span id="save-status" class="save-status">Ready</span>
                <button id="btn-save" class="btn-primary">Save Config</button>
                <button id="btn-validate" class="btn-secondary">Validate</button>
            </div>
        </header>
        <main id="tab-lore" class="tab-panel active">
            <div class="designer-layout">
                <aside id="chapter-list" class="chapter-sidebar"></aside>
                <section id="milestone-editor" class="milestone-main"></section>
            </div>
        </main>
        <main id="tab-texts" class="tab-panel">
            <div id="text-manager" class="text-manager"></div>
        </main>
    </div>
    <script type="module" src="./js/DesignerApp.js"></script>
</body>
</html>
```

### 5.3 Designer Electron Main Process & Preload

**New File:** `infrastructure/electron/designer-main.js`

```js
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const { app, BrowserWindow, Menu } = require('electron');

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function createWindow() {
    const win = new BrowserWindow({
        width: 1600,
        height: 1000,
        minWidth: 1200,
        minHeight: 800,
        title: 'RPG Village — Designer Backend',
        icon: path.join(__dirname, '../../assets/icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'designer-preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
        },
    });

    // Load the bundled designer output
    win.loadFile(path.join(__dirname, '../../dist/designer/index.html'));
}

app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
```

**New File:** `infrastructure/electron/designer-preload.js`

```js
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const { contextBridge } = require('electron');
const fs = require('fs');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');

function resolveConfigPath(relPath) {
    // Security: only allow reads/writes inside config/ and public/assets/
    const resolved = path.resolve(rootDir, relPath);
    const allowedRoots = [
        path.resolve(rootDir, 'config'),
        path.resolve(rootDir, 'public/assets'),
        path.resolve(rootDir, 'assets'),
    ];
    const isAllowed = allowedRoots.some(ar => resolved.startsWith(ar));
    if (!isAllowed) {
        throw new Error(`Access denied: ${relPath} is outside allowed directories.`);
    }
    return resolved;
}

contextBridge.exposeInMainWorld('designerAPI', {
    platform: process.platform,

    readConfig(relPath) {
        const filePath = resolveConfigPath(relPath);
        if (!fs.existsSync(filePath)) return null;
        return fs.readFileSync(filePath, 'utf8');
    },

    writeConfig(relPath, content) {
        const filePath = resolveConfigPath(relPath);
        // Validate JSON before writing
        JSON.parse(content);
        fs.writeFileSync(filePath, content, 'utf8');
        return { saved: true, path: relPath };
    },

    listAssets(dir) {
        const assetDir = resolveConfigPath(dir);
        if (!fs.existsSync(assetDir)) return [];
        return fs.readdirSync(assetDir).filter(f => 
            /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(f)
        );
    }
});
```

> **Security note:** The preload validates that all paths stay within `config/` and `assets/`. It also validates JSON before writing. The renderer cannot escape these directories.

### 5.4 Designer API Client

**New File:** `designer/js/api/ConfigApi.js`

```js
export const ConfigApi = {
    async loadConfig(relPath) {
        const raw = window.designerAPI.readConfig(relPath);
        if (raw === null) throw new Error(`Config not found: ${relPath}`);
        return JSON.parse(raw);
    },

    async saveConfig(relPath, data) {
        const content = JSON.stringify(data, null, 4) + '\n';
        return window.designerAPI.writeConfig(relPath, content);
    },

    listAssets(dir) {
        return window.designerAPI.listAssets(dir);
    }
};

export const PRESENTATIONS_CONFIG_PATH = 'config/presentations.json';
export const I18N_CONFIG_PATH = 'config/i18n/en.json';
```

> **Note:** `loadConfig` and `saveConfig` use the Electron preload bridge (`window.designerAPI`) instead of HTTP. No server, no ports, no CORS. The calls are synchronous from the UI's perspective but wrapped in async functions for consistency.

### 5.5 Designer Store

**New File:** `designer/js/stores/ConfigStore.js`

```js
import { ConfigApi, PRESENTATIONS_CONFIG_PATH, I18N_CONFIG_PATH } from '../api/ConfigApi.js';

export class ConfigStore {
    constructor() {
        this.presentations = { version: '1.0.0', presentations: [] };
        this.i18n = { en: {} };
        this.dirty = false;
        this.errors = [];
        this.warnings = [];
    }

    async load() {
        this.presentations = await ConfigApi.loadConfig(PRESENTATIONS_CONFIG_PATH);
        this.i18n.en = await ConfigApi.loadConfig(I18N_CONFIG_PATH);
        this.dirty = false;
    }

    async save() {
        await ConfigApi.saveConfig(PRESENTATIONS_CONFIG_PATH, this.presentations);
        await ConfigApi.saveConfig(I18N_CONFIG_PATH, this.i18n.en);
        this.dirty = false;
    }

    // --- Presentation CRUD ---

    getPresentation(id) {
        return this.presentations.presentations.find(p => p.id === id);
    }

    addPresentation(pres) {
        this.presentations.presentations.push(pres);
        this.dirty = true;
    }

    updatePresentation(id, updates) {
        const idx = this.presentations.presentations.findIndex(p => p.id === id);
        if (idx >= 0) {
            this.presentations.presentations[idx] = { ...this.presentations.presentations[idx], ...updates };
            this.dirty = true;
        }
    }

    removePresentation(id) {
        this.presentations.presentations = this.presentations.presentations.filter(p => p.id !== id);
        this.dirty = true;
    }

    movePresentation(id, newIndex) {
        const arr = this.presentations.presentations;
        const oldIndex = arr.findIndex(p => p.id === id);
        if (oldIndex < 0) return;
        const [item] = arr.splice(oldIndex, 1);
        arr.splice(newIndex, 0, item);
        this.dirty = true;
    }

    // --- Chapter grouping ---

    getChapters() {
        const map = new Map();
        for (const p of this.presentations.presentations) {
            if (!map.has(p.chapter)) map.set(p.chapter, []);
            map.get(p.chapter).push(p);
        }
        return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
    }
}
```

### 5.6 Designer Components (High-Level)

The designer UI follows vanilla JS patterns consistent with the existing presentation layer (`ChronicleView.js`, `PresentationModal.js`). No framework is introduced.

**New File:** `designer/js/components/ChapterList.js`

Renders the left sidebar: chapters as expandable sections, milestones as draggable rows. Shows status badges (✅ valid, ⚠️ warning, ❌ error).

**New File:** `designer/js/components/MilestoneEditor.js`

Renders the right panel when a milestone is selected:
- `id` (read-only text input for existing, editable for new)
- `chapter` (number input)
- `trigger` (dropdown for type, dynamic fields for parameters)
- `pages` (reorderable list; each page has image path input + textKey dropdown + preview)

**New File:** `designer/js/components/TriggerEditor.js`

Dynamic form that changes based on `trigger.type`:
- `new_game` → no extra fields
- `building_complete` → buildingId text input, level number input
- `mission_complete` → missionId text input
- `hero_recruited` → origin text input OR heroName text input
- `first_event` → eventId text input
- `chapter_milestones` → chapter number, required number, total number

**New File:** `designer/js/components/ValidationPanel.js`

Floating or inline panel that runs structural and referential checks on the current in-memory state and displays errors/warnings before save.

**New File:** `designer/js/DesignerApp.js`

Orchestrates the designer:
```js
import { ConfigStore } from './stores/ConfigStore.js';
import { ChapterList } from './components/ChapterList.js';
import { MilestoneEditor } from './components/MilestoneEditor.js';
import { ValidationPanel } from './components/ValidationPanel.js';

class DesignerApp {
    constructor() {
        this.store = new ConfigStore();
        this.chapterList = new ChapterList(document.getElementById('chapter-list'), this.store);
        this.milestoneEditor = new MilestoneEditor(document.getElementById('milestone-editor'), this.store);
        this.validationPanel = new ValidationPanel(document.getElementById('save-status'), this.store);
        this._bindEvents();
    }

    async init() {
        await this.store.load();
        this.chapterList.render();
        this.validationPanel.run();
    }

    _bindEvents() {
        document.getElementById('btn-save').addEventListener('click', async () => {
            const errors = this.validationPanel.run();
            if (errors.length > 0) {
                alert('Fix validation errors before saving.');
                return;
            }
            try {
                await this.store.save();
                this.validationPanel.setStatus('Saved. Run `npm run ingest` to update player build.', 'success');
            } catch (e) {
                this.validationPanel.setStatus(`Save failed: ${e.message}`, 'error');
            }
        });

        document.getElementById('btn-validate').addEventListener('click', () => {
            this.validationPanel.run();
        });

        // Tab switching
        document.querySelectorAll('.designer-tabs button').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                document.querySelectorAll('.designer-tabs button').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById(`tab-${tab}`).classList.add('active');
            });
        });
    }
}

const app = new DesignerApp();
app.init();
```

> **Note:** The designer CSS (`designer/css/designer.css`) uses the same CSS custom properties (variables) as the player game where possible, but is allowed to have its own layout optimized for desktop editing (wider screens, denser information).

---

## Phase 6 — Tests

### 6.1 Ingestion Script Test

**New File:** `tests/unit/ingest-configs.test.js`

```js
import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');

test('ingest-configs: generates PresentationCatalog.js', () => {
    const generatedPath = path.resolve(root, 'js/engine/shared/data/_generated/PresentationCatalog.js');
    assert.ok(fs.existsSync(generatedPath), 'Generated file should exist after ingest');
    const content = fs.readFileSync(generatedPath, 'utf8');
    assert.ok(content.includes('export const PRESENTATION_CATALOG'), 'Should export PRESENTATION_CATALOG');
    assert.ok(content.includes('export function getPresentationById'), 'Should export getPresentationById');
});

test('ingest-configs: generated catalog matches JSON source', () => {
    const jsonPath = path.resolve(root, 'config/presentations.json');
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    const generatedPath = path.resolve(root, 'js/engine/shared/data/_generated/PresentationCatalog.js');
    const content = fs.readFileSync(generatedPath, 'utf8');

    // All presentation IDs from JSON must appear in generated JS
    for (const p of jsonData.presentations) {
        assert.ok(content.includes(`"${p.id}"`), `Generated file should contain id "${p.id}"`);
    }
});

test('ingest-configs: generates all i18n modules', () => {
    const langs = ['en', 'es', 'ca', 'eu', 'gl'];
    for (const lang of langs) {
        const generatedPath = path.resolve(root, `js/engine/shared/core/i18n/translations/_generated/${lang}.js`);
        assert.ok(fs.existsSync(generatedPath), `Generated i18n ${lang}.js should exist`);
    }
});
```

### 6.2 Validation Script Test

**New File:** `tests/unit/validate-configs.test.js`

```js
import test from 'node:test';
import assert from 'node:assert';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');

test('validate-configs: passes on valid configs', () => {
    const result = execSync('node scripts/validate-configs.js', { cwd: root, encoding: 'utf8' });
    assert.ok(result.includes('Validation passed'), 'Should pass on current valid configs');
});
```

### 6.3 Engine Integration Test

**File:** `tests/unit/PresentationService.test.js` (existing)

No changes needed. The existing tests import `PresentationService`, which imports `PresentationCatalog.js`. As long as the generated module exports the same shape, these tests continue to pass.

Add one additional test to verify the generated catalog is loadable:

```js
test('PresentationCatalog: generated module is importable and non-empty', async () => {
    const { PRESENTATION_CATALOG } = await import('../../js/engine/shared/data/PresentationCatalog.js');
    assert.ok(Array.isArray(PRESENTATION_CATALOG), 'PRESENTATION_CATALOG should be an array');
    assert.ok(PRESENTATION_CATALOG.length > 0, 'PRESENTATION_CATALOG should not be empty');
    assert.ok(PRESENTATION_CATALOG.every(p => p.id && p.chapter && p.pages && p.trigger), 'All entries should have required fields');
});
```

---

## Phase 7 — Verification Checklist

### Config Infrastructure
- [ ] `config/presentations.json` exists and contains all 12 existing presentations.
- [ ] `config/i18n/en.json` (and `es`, `ca`, `eu`, `gl`) exist and contain all existing translation keys.
- [ ] `config/schemas/presentations.schema.json` defines the full schema with conditional trigger validation.
- [ ] `config/schemas/i18n.schema.json` enforces key naming conventions.
- [ ] `scripts/migrate-hardcoded.js` successfully converts existing JS data to JSON (run once).

### Build Pipeline
- [ ] `npm run ingest` generates `js/engine/shared/data/_generated/PresentationCatalog.js`.
- [ ] `npm run ingest` generates `js/engine/shared/core/i18n/translations/_generated/*.js` for all 5 languages.
- [ ] `npm run predev` (auto-runs on `npm run dev`) executes ingestion before Vite starts.
- [ ] `npm run prebuild` (auto-runs on `npm run build`) executes ingestion and validation before Vite builds.
- [ ] Generated files are `.gitignore`d and never committed.
- [ ] Thin re-export files (`PresentationCatalog.js`, `translations/*.js`) are committed and import from `_generated/`.

### Validation
- [ ] `npm run validate:config` passes on the migrated data.
- [ ] Adding a presentation with `trigger.type: "building_complete"` but no `buildingId` fails validation.
- [ ] Adding a `textKey` that does not exist in `en.json` fails validation.
- [ ] Adding two presentations with the same `id` fails validation.
- [ ] Validation errors produce clear messages with file path and line context.

### Designer UI
- [ ] `npm run designer` opens the designer UI in the browser.
- [ ] Designer loads `config/presentations.json` and displays all chapters and milestones.
- [ ] Clicking a milestone opens the editor with trigger fields and page list.
- [ ] Adding a page, editing an image path, and changing a textKey works.
- [ ] "Save Config" writes to `config/presentations.json` via Electron preload bridge.
- [ ] "Validate" shows inline errors without saving.
- [ ] The Text Manager tab loads `config/i18n/en.json` and allows editing narrative text.

### Engine Compatibility
- [ ] `PresentationService` unit tests pass without modification.
- [ ] `ChronicleView` unit tests pass without modification.
- [ ] `GameEngine` requires no changes.
- [ ] `PostDaySequencer` requires no changes.
- [ ] `PresentationModal` requires no changes.
- [ ] Existing save slots still load correctly (presentation IDs unchanged).
- [ ] Player game builds successfully (`npm run build`) and runs correctly.

### Code Quality
- [ ] No new runtime dependencies for the player game.
- [ ] Designer tool is developer-only and not bundled into the player build.
- [ ] All new files follow the project's directory conventions (`js/engine` for engine, `js/presentation` for UI).
- [ ] i18n keys in `config/i18n/*.json` preserve the existing `{domain}_{purpose}_{subject}_{condition}` naming convention.
