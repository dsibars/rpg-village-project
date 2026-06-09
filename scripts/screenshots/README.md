# Screenshot Orchestrator

Captures app screenshots for visual regression testing and agent debugging using a **state-injection hybrid** approach.

## Architecture

```
scripts/screenshots/
├── orchestrator.mjs       # Entry point: browser, server, loop over flows
├── audit.mjs              # Coverage / missing screenshots report
├── registry.mjs           # Catalog of screenshot states (flow + state)
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
│   └── selectors.mjs      # App CSS selectors
└── utils/
    ├── server.mjs         # Static file server
    ├── browser.mjs        # Playwright helpers
    ├── snapshot.mjs       # Semantic filename helper
    ├── nav.mjs            # Click / wait helpers
    ├── setup.mjs          # Fresh new-game helper
    └── state-injector.mjs # window.__ENGINE__ wrappers
```

## Naming Convention

Screenshots use semantic names:

```
{flow}_{state}.png
```

Examples:

```
heroes_list_selected.png
magic_circle_fire_selected.png
```

## Usage

### Full run

```bash
npm run screenshots
# or
node scripts/screenshots/orchestrator.mjs
```

### Only specific flows

```bash
node scripts/screenshots/orchestrator.mjs --flows onboarding,village,heroes
```

### Dry run (validate without capturing)

```bash
npm run screenshots:dry
```

### Audit coverage

```bash
npm run screenshots:audit
```

Reports complete/missing screenshots and lists orphan files.

## Adding a New Screenshot

1. Add an entry to `registry.mjs`:

```js
{ flow: 'heroes', state: 'heroes_modal_gambits', description: 'Hero gambits modal open' }
```

2. Add selectors to `selectors/selectors.mjs` if needed.

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
node scripts/screenshots/orchestrator.mjs --flows heroes
```

## State Injection

The app exposes the engine globally so the orchestrator can inject state via `page.evaluate()`:

```js
window.__ENGINE__
```

This makes screenshots fast and deterministic compared to clicking through the full UI flow.

Helpers in `utils/state-injector.mjs`:

- `injectHero(page, options)`
- `injectBattle(page, options)`
- `addInventoryItem(page, item)`
- `triggerNextDay(page)`
- `setStorageFull(page, ratio)`
- `refreshUI(page)`

## Output

Screenshots are written to `scripts/screenshots/output/`.
