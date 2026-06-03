# Idea 12: Game Designer Backend — Configuration-Driven Lore & History Management

> **Status:** Design Proposal  
> **Scope:** Developer tooling and content pipeline — no player-facing mechanics. Separates world data from source code.  
> **Goal:** Enable non-coders to create, edit, and validate game content (chapters, presentations, translations, regions, expeditions, buildings) through a web-based designer UI, without touching JavaScript source files.

---

## The Problem

The game has a strong engine but a **rigid content pipeline**. To add a new chapter presentation, a designer must:

1. Edit `js/engine/shared/data/PresentationCatalog.js` — add JS objects, obey export syntax, avoid trailing commas.
2. Edit `js/engine/shared/core/i18n/translations/en.js` — add 26+ translation keys with strict naming conventions.
3. Repeat step 2 for `es.js`, `ca.js`, `eu.js`, `gl.js` (or leave `// TODO: translate` markers).
4. Edit `docs/shared/core/unlock_narratives.md` — update documentation.
5. Rebuild and test.

This is acceptable for a solo developer. It is a bottleneck for a team with writers, translators, or designers who do not write JavaScript. More importantly, it couples **content** (what the story says) to **code** (how the engine works). A typo in a translation file can break the build. A missing comma in the catalog can crash the game.

The same problem exists for regions, expeditions, buildings, enemies, equipment, and consumables — all currently hardcoded in JS modules.

---

## The Insight: Content Is Data, Not Code

The game's world — its chapters, presentations, region parameters, building costs, and narrative text — is **declarative data**. It has no logic, no branches, no algorithms. It describes *what exists*, not *how it behaves*.

If we treat this data as **configuration** (JSON files edited by a UI) and the engine as a **consumer** (JS modules that load the generated config), we get:

- **Parallel workflows**: A writer edits `presentations.json` while a developer refactors `PresentationService.js`.
- **Validation at edit time**: JSON Schema prevents broken game states before they reach the engine.
- **Non-coder accessibility**: A web UI is friendlier than VS Code + ESLint.
- **Version control clarity**: A diff in `config/presentations.json` is readable. A diff in `PresentationCatalog.js` mixes content changes with code formatting.
- **Future automation**: Auto-translation APIs, procedural content generators, and modding all assume data lives outside the source tree.

---

## Core Principle: Single Source of Truth

The JSON files in `config/` are the **only** editable source. The JavaScript modules in `js/engine/` are **generated artifacts** — rebuilt automatically from JSON, never edited by hand.

```
Designer edits ──► config/presentations.json
                         │
                         ▼
              scripts/ingest-configs.js
                         │
                         ▼
     js/engine/shared/data/_generated/PresentationCatalog.js
                         │
                         ▼
                    Vite bundles
                         │
                         ▼
                   Player sees
```

The designer tool and the player game share the same `config/` directory. They read and write the same files. There is no sync step, no export wizard, no "save to project" button — the file **is** the project.

---

## Architecture Decisions

### 1. Config Format: JSON + JSON Schema

**Decision:** Use JSON for all config files, validated by JSON Schema.

**Why not YAML?** YAML adds a parser dependency and is less familiar to non-technical designers. JSON is native to JavaScript, readable enough, and every text editor supports it.

**Why not a custom format?** Overkill. We need structure, not a domain-specific language.

**Schema benefits:**
- Catches typos (`"triger"` instead of `"trigger"`) immediately.
- Enforces referential integrity (a `textKey` in `presentations.json` must exist in `i18n/en.json`).
- Documents the data model for designers who never read the engine code.
- Enables IDE autocomplete in editors like VS Code.

### 2. Build-Time vs Runtime Loading

**Decision:** Configs are **ingested at build time** into JS modules. The player game does not fetch JSON at runtime.

**Trade-offs considered:**

| Approach | Pros | Cons |
|----------|------|------|
| Runtime `fetch()` from `public/` | No build step needed; configs can be hot-swapped | Breaks `vite-plugin-singlefile`; adds HTTP latency; requires async init in engine |
| Build-time `import` (chosen) | Zero runtime overhead; works with single-file builds; engine init stays synchronous; configs are tree-shakeable | Requires a build step after config changes |

**Mitigation:** The ingestion script (`scripts/ingest-configs.js`) runs in ~50ms. We wire it into `npm run build` and `npm run dev` so developers never think about it. The designer tool edits JSON directly and can trigger re-ingestion via a file watcher.

### 3. i18n: JSON Master Files

**Decision:** Move translations from `js/engine/shared/core/i18n/translations/*.js` to `config/i18n/*.json`. The designer tool edits JSON. The ingestion script generates the JS modules.

**Why:**
- The designer text editor reads/writes JSON natively — no JS parsing needed.
- JSON diffs are cleaner than JS module diffs.
- Auto-translation tools (Phase 2) emit JSON, not JS.
- The generated JS modules keep the exact same export shape, so `I18nService` needs no changes.

**Migration:** A one-time script converts the existing 5 `.js` files to `.json`.

### 4. Designer Tool Stack

**Decision:** An **Electron app** that loads the designer UI. The designer and the player game share the same Vite build system (CSS variables, component patterns, toolchain) but are separate entry points with separate Electron main processes.

**Why Electron?** Because the designer tool needs to **read and write JSON files on the local filesystem**. Electron gives us this natively via Node's `fs` module — no server, no middleware, no `fetch`, no CORS. A designer clicks "Save" and `fs.writeFileSync` runs immediately. This is the simplest, most robust approach for a desktop tool.

**Why not a Vite dev server with middleware?** It works, but it requires a running server, HTTP requests, and port management. Electron is zero-config for file I/O and matches the project's existing delivery target.

**Why not a route in the player SPA (`#designer`)?** We do not want designer code bundled into the player game. A separate entry point (`designer/index.html`) and a separate Electron main process keeps the bundles isolated. The designer is excluded from player builds via `forge.config.js`.

**File I/O via Electron preload:**

```
Designer UI (renderer) ──window.designerAPI.writeFile()──► Preload script
                                                               │
                                                               ▼
                                                        fs.writeFileSync()
                                                               │
                                                               ▼
                                                 config/presentations.json
```

The designer preload exposes a minimal, namespaced API:
- `designerAPI.readConfig(relPath)` → reads `config/*.json`
- `designerAPI.writeConfig(relPath, data)` → writes `config/*.json`
- `designerAPI.listAssets(dir)` → scans `public/assets/` for image autocomplete

The renderer has no direct Node access (`contextIsolation: true`, `nodeIntegration: false`). All filesystem operations go through the preload bridge, just like the existing `electronAPI`.

### 5. Validation Strategy

**Three layers:**

1. **Schema validation** (structural): `ajv` validates JSON against schemas. Is `trigger.type` one of the allowed enums? Is `chapter` a positive integer?
2. **Referential integrity** (logical): A custom validator checks that every `textKey` in `presentations.json` exists in `i18n/en.json`. Every `buildingId` in a trigger exists in `buildings.json`. Every `missionId` exists in `expeditions.json`.
3. **Game-level sanity** (semantic): Does any presentation have zero pages? Are two presentations using the same `id`? Is a Chapter 2 presentation triggered by a building that unlocks in Chapter 1? (Warn, don't error — the designer may be experimenting.)

Validation runs:
- In the designer UI before every save (blocks save on structural errors, warns on logical/semantic issues).
- On CI via `npm run validate:config` (fails the build on any structural or logical error).
- On `npm run build` before ingestion (fails fast).

### 6. Migration Path: Zero Breaking Changes

**Goal:** Convert existing hardcoded data to config files without breaking existing save games.

**Strategy:**
1. The generated JS modules export **identical objects** to the current hand-written modules. `PresentationCatalog.js` will look the same to every importer.
2. Save games store `presentation_state` (seen/pending IDs), not catalog data. As long as presentation `id`s do not change, saves are compatible.
3. We migrate one domain at a time. Phase 1 only touches presentations and i18n. Regions, buildings, and expeditions stay hardcoded until their respective phases.
4. The migration script is idempotent: running it twice produces the same output.

---

## Phase 1 Scope — Lore & History Config Management

### What the Designer Can Do

- View all chapters and their milestones in a two-pane layout (chapters list left, milestone detail right).
- Edit milestone properties:
  - `id` (read-only after creation, to protect save compatibility)
  - `chapter` number
  - `trigger` type and parameters (building ID, level, mission ID, origin, event ID, etc.)
  - `pages` array: reorder, add, remove pages
  - Per page: `image` path (with autocomplete from `public/assets/`), `textKey` (with dropdown of available i18n keys)
- Add new milestones and chapters.
- Remove milestones (with confirmation if the ID exists in any save slot — checked via a simple scan of localStorage keys).
- Reorder milestones within a chapter via drag-and-drop.
- See validation status inline: green dot (valid), yellow dot (warning), red dot (error).
- Save writes to `config/presentations.json`. Ingestion runs automatically. The designer sees a "Configs ingested — player build ready" toast.

### What the Player Game Does Differently

Almost nothing. `PresentationCatalog.js` becomes a generated file. `PresentationService.js` and `ChronicleView.js` require zero changes. The only code change is replacing the hand-written catalog with an `import` from the generated module.

---

## Phase 2 Scope — Translation & Text Management

### What the Designer Can Do

- A "Text Manager" tab that loads `config/i18n/en.json`.
- Search and filter keys by prefix (e.g., `pres_*`, `combat_*`, `chronicle_*`).
- Edit English text in a friendly textarea. Live preview of param replacement (`{name}`, `{day}`).
- See which keys are referenced by `presentations.json` (highlighted as "narrative keys").
- Add new keys. The designer suggests a key name based on the presentation ID and page number.
- Export changes back to `config/i18n/en.json`.
- **Auto-translate button** (integration point): Calls an external agent/API with the English text, receives translations for `es`, `ca`, `eu`, `gl`, and writes all 5 files. Human review is encouraged but not enforced.

### Technical Changes

- `config/i18n/en.json`, `es.json`, `ca.json`, `eu.json`, `gl.json` become the editable sources.
- `js/engine/shared/core/i18n/translations/*.js` become generated files.
- `I18nService` continues to import from the generated JS modules — no runtime change.

---

## Phase 3+ Scope (Future)

### Region Configuration

- `config/regions.json` defines all region parameters: scaling curves, loot profiles, enemy pools, unlock conditions, first-clear narratives.
- Designer UI: a table of regions with expandable rows for loot tables and scaling graphs.
- Engine: `RegionService` loads from generated module instead of hardcoded objects.

### Expedition Configuration

- `config/expeditions.json` defines story missions, stage templates, reward tables, and narrative flags.
- Designer UI: a node-graph view of expedition trees (linear, branching, hidden paths).

### Building Configuration

- `config/buildings.json` defines costs, construction times, effects per level, and unlock requirements.
- Designer UI: a level-up table with cost calculators ("if Farm L3 costs 300g, what should L4 cost?").

---

## Directory Structure (Target State)

```
rpg-village-project/
│
├── config/                          <-- NEW: editable JSON configs (SSOT)
│   ├── presentations.json
│   ├── i18n/
│   │   ├── en.json
│   │   ├── es.json
│   │   ├── ca.json
│   │   ├── eu.json
│   │   └── gl.json
│   ├── regions.json                 (Phase 3)
│   ├── expeditions.json             (Phase 3)
│   └── buildings.json               (Phase 3)
│
├── config/schemas/                  <-- NEW: JSON Schema definitions
│   ├── presentations.schema.json
│   ├── i18n.schema.json
│   └── common.schema.json           (shared defs: id, textKey, trigger)
│
├── scripts/                         <-- NEW: build & dev tooling
│   ├── ingest-configs.js            # JSON → JS module generation
│   ├── validate-configs.js          # JSON Schema + referential integrity
│   └── migrate-hardcoded.js         # one-time migration (Phase 1)
│
├── designer/                        <-- NEW: designer tool source
│   ├── index.html                   # entry point
│   ├── css/
│   │   └── designer.css
│   └── js/
│       ├── DesignerApp.js
│       ├── api/                     # thin wrapper around window.designerAPI
│       │   └── ConfigApi.js
│       ├── components/
│       │   ├── ChapterList.js
│       │   ├── MilestoneEditor.js
│       │   ├── PageEditor.js
│       │   ├── TriggerEditor.js
│       │   └── ValidationPanel.js
│       └── stores/
│           └── ConfigStore.js       # in-memory state + dirty tracking
│
├── js/engine/shared/data/
│   ├── _generated/                  <-- NEW: generated JS modules (.gitignored)
│   │   ├── PresentationCatalog.js
│   │   └── ... (future domains)
│   └── PresentationCatalog.js       # thin re-export: import from _generated/
│
├── js/engine/shared/core/i18n/translations/
│   ├── _generated/                  <-- NEW: generated JS modules (.gitignored)
│   │   ├── en.js
│   │   └── ...
│   └── en.js                        # thin re-export
│
├── vite.config.js                   # modified: add designer/index.html entry point
│
├── infrastructure/electron/
│   ├── main.js                        # existing player app main process
│   ├── preload.js                     # existing player preload
│   ├── designer-main.js               # NEW: designer app main process
│   └── designer-preload.js            # NEW: designer preload (fs bridge)
└── package.json                     # modified: add designer, validate scripts
```

---

## Key Technical Questions — Answered

| Question | Answer |
|----------|--------|
| **What format?** | JSON + JSON Schema. Native, simple, validator-friendly. |
| **Build-time or runtime?** | Build-time ingestion into JS modules. Zero runtime cost, preserves single-file builds. |
| **i18n files?** | Move to `config/i18n/*.json`. Generate `.js` modules at build time. Designer edits JSON. |
| **Designer stack?** | Separate Electron app with preload bridge for direct `fs` access. Bundled by Vite as a second entry point. |
| **Validation?** | Three layers: JSON Schema (structural), referential integrity (logical), semantic sanity (warnings). |
| **Migration?** | Generated modules export identical shapes to hand-written ones. Save compatibility preserved. One script converts existing JS data to JSON. |

---

## Why This Works

1. **It respects the existing architecture.** The engine does not change. The presentation layer does not change. Only the *source* of the data changes — from hand-written JS to generated JS.

2. **It scales indefinitely.** New domains (regions, buildings, equipment) follow the same pattern: JSON config → schema → ingestion → generated module. The designer UI grows new tabs.

3. **It enables non-coders.** A writer can open `npm run designer`, add a new chapter presentation, write the text, and see it in the game after refresh — without learning JavaScript module syntax.

4. **It prevents breakage.** A designer cannot accidentally delete a comma or reference a non-existent `textKey`. The validator catches it before save.

5. **It preserves the single-file build.** `vite-plugin-singlefile` continues to work because the generated modules are still ES modules imported at build time.

6. **It opens the door to automation.** Once all data is JSON, CI can validate it, agents can auto-translate it, and modders can override it.

---

## Open Questions (To Resolve During Implementation)

1. **Should the designer tool support live reload?** When `presentations.json` is saved externally, should the designer page auto-refresh? Since the designer is an Electron app, we can use `fs.watch` in the main process and send IPC messages to the renderer to refresh specific components. (Nice-to-have for Phase 2.)

2. **How do we handle image assets?** The designer UI shows image previews. Should it scan `public/assets/` and `assets/` to populate an autocomplete dropdown? (Yes — the preload already exposes `designerAPI.listAssets(dir)` which uses `fs.readdirSync`.)

3. **Should we version configs?** Add a `"version": "1.0.0"` field to each JSON file so the ingestion script can detect outdated formats and warn. (Yes — minimal cost, high safety.)

4. **What about save-slot compatibility warnings?** If a designer changes a presentation `id`, existing saves referencing the old ID will break. Should the designer scan `localStorage` and warn? (Yes — a lightweight check in the designer UI before allowing `id` edits.)

5. **Should the ingestion script be a Vite plugin or a standalone Node script?** A standalone Node script is simpler and can run independently of Vite (e.g., in CI). We call it from `package.json` scripts. (Recommendation: standalone script.)
