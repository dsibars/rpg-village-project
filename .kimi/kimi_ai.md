# Kimi AI — RPG Village Quick Start

> **Purpose**: Minimal session bootstrap. All game knowledge lives in `docs/`.  
> **Rule**: Read `AGENTS.md` first, then relevant `docs/` specs. This file only has project logistics.

## Project Structure

- **Entry**: `index.html` (root)
- **Built output**: `dist/index.html` (web), `out/` (Electron packaged app)
- **Web build**: `npm run build` or `make build-web`
- **Electron build**: `npm run electron:make` or `make build-app`
- **Dev server**: `npm run dev` or `make dev`
- **Run Electron**: `npm run electron:run` or `make run`
- **Test**: `npm test` or `make test`

## Key Conventions

- **Spec-first**: Read `docs/` before touching `js/engine/`. `AGENTS.md` has the master index.
- **Engine = pure logic**, no DOM. `js/presentation/ui/` handles all DOM.
- **Result pattern**: Engine methods return `{ success, data, error }`.
- **Electron**: Code isolated in `infrastructure/electron/`. `ELECTRON_RUN_AS_NODE=1` breaks Electron APIs — the `electron:run` script unsets it.

## Active Issues (see `docs/DOC_REVIEW_REPORT.md` for details)

| Issue | Status |
|-------|--------|
| `SKILLS_DATA` has magic/support skills mixed with physical | 🔴 Code still needs cleanup |
| Code has dual skill systems (`hero.skills` + `techniqueUses/Tiers`) | 🔴 UI still uses old flat system |
| Gambit max 6 in doc, 12 in code | 🟡 Needs alignment |

## Build Commands

```bash
make dev          # Vite dev server
make run          # Electron from dist/
make build-web    # Vite build → dist/
make build-app    # Vite build + Electron Forge package
make test         # Run all tests
make clean        # Remove dist/ and out/
```

*Last updated: 2026-05-22*
