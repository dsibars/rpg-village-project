# Screenshot Orchestrator

Captures pairs of v1/v2 screenshots for the RPG Village migration audit using a **state-injection hybrid** approach.

## Architecture

```
scripts/screenshots/
├── orchestrator.mjs       # Entry point: browser, server, loop over flows
├── audit.mjs              # Pair coverage / missing screenshots report
├── registry.mjs           # Catalog of screenshot pairs (flow + state)
├── config.mjs             # Paths, viewport, CLI args
├── flows/                 # One module per domain flow
│   ├── 01-onboarding.mjs
│   ├── 02-village.mjs
│   ├── 03-heroes.mjs
│   ├── 04-adventure.mjs
│   ├── 05-town.mjs
│   ├── 06-combat.mjs
│   ├── 07-magic-circle.mjs
│   └── 08-settings.mjs
├── selectors/
│   ├── v1.mjs             # v1 (vanilla JS) CSS selectors
│   └── v2.mjs             # v2 (Vue 3) CSS selectors
└── utils/
    ├── server.mjs         # Static file server
    ├── browser.mjs        # Playwright helpers
    ├── snapshot.mjs       # Semantic filename helper
    ├── nav.mjs            # Click / wait helpers
    ├── setup.mjs          # Fresh new-game helper
    └── state-injector.mjs # window.engine / window.__ENGINE__ wrappers
```

## Naming Convention

Screenshots use semantic names so v1 and v2 pairs sort together:

```
{v1,v2}_{flow}_{state}.png
```

Examples:

```
v1_heroes_list_selected.png
v2_heroes_list_selected.png
v1_magic_circle_fire_selected.png
v2_magic_circle_fire_selected.png
```

## Usage

### Full run

```bash
npm run screenshots
# or
node scripts/screenshots/orchestrator.mjs
```

### Only v2

```bash
npm run screenshots:v2
```

### Only specific flows

```bash
node scripts/screenshots/orchestrator.mjs --flows onboarding,village,heroes
```

### Dry run (validate selectors without capturing)

```bash
npm run screenshots:dry
```

### Audit pairs

```bash
npm run screenshots:audit
```

Reports complete/partial/missing v1↔v2 pairs and lists orphan files.

## Adding a New Screenshot

1. Add an entry to `registry.mjs`:

```js
{ flow: 'heroes', state: 'heroes_modal_gambits', description: 'Hero gambits modal open' }
```

2. Add selectors to `selectors/v1.mjs` and `selectors/v2.mjs`.

3. Implement the capture logic inside the matching flow module (e.g. `flows/03-heroes.mjs`):

```js
const gambitsBtn = await page.$(selectors.heroGambitsBtn)
if (gambitsBtn) {
  await gambitsBtn.click()
  await waitForVisible(page, selectors.heroGambitsModal, 2000)
  await snap({ flow: 'heroes', state: 'heroes_modal_gambits' })
}
```

4. Run the flow to verify:

```bash
node scripts/screenshots/orchestrator.mjs --flows heroes --version v2
```

## State Injection

Both versions expose the engine globally so the orchestrator can inject state via `page.evaluate()`:

- v1: `window.engine`
- v2: `window.__ENGINE__` (exposed in `ux/main.js`)

This makes screenshots fast and deterministic compared to clicking through the full UI flow.

Helpers in `utils/state-injector.mjs`:

- `injectHero(page, version, options)`
- `injectBattle(page, version, options)`
- `addInventoryItem(page, version, item)`
- `triggerNextDay(page, version)`
- `setStorageFull(page, version, ratio)`
- `refreshUI(page, version)`

## Output

Screenshots are written to `ux/_migration_screenshots/`.
