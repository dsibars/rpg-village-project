# Screenshot Orchestrator

Captures app screenshots for **visual regression testing** and **bug diagnosis**.

Two modes:
1. **Gameplay Life** (`--playthrough`) — Plays the game naturally, like a real user. Best for catching broken tutorials, missing translations, UI glitches.
2. **Thematic Flows** (default / `--continuous`) — Feature-specific screenshot suites. Best for targeted regression of individual systems.

---

## Quick Start

### Gameplay Life (recommended for bug hunting)

```bash
npm run screenshots:playthrough
# or
node scripts/screenshots/orchestrator.mjs --playthrough
```

This starts a fresh game, clicks through everything naturally, handles (or force-skips) the tutorial, explores heroes/adventure/town, advances days, and captures ~20 screenshots showing the real player experience.

**If the tutorial is broken**, the flow detects timeouts, screenshots the broken state (e.g. `tutorial_skills_modal_BROKEN.png`), force-skips the tutorial, and continues.

### Thematic Flows (targeted regression)

```bash
# Run all thematic flows in isolated browser sessions
npm run screenshots

# Run all flows in one continuous session (shares save state)
node scripts/screenshots/orchestrator.mjs --continuous

# Run specific flows only
node scripts/screenshots/orchestrator.mjs --flows onboarding,village,heroes

# Validate without capturing
npm run screenshots:dry
```

### Audit coverage

```bash
npm run screenshots:audit
```

Reports complete/missing screenshots and lists orphan files.

---

## Architecture

```
scripts/screenshots/
├── orchestrator.mjs       # Entry point: browser, server, flow dispatch
├── flows/
│   ├── 99-playthrough.mjs # ⭐ Gameplay Life — natural playthrough
│   ├── 01-onboarding.mjs  # Thematic: save slots, book prologue
│   ├── 02-village.mjs     # Thematic: village view, construction
│   ├── 03-heroes.mjs      # Thematic: hero list, detail, modals
│   ├── 04-adventure.mjs   # Thematic: explore, bestiary, codex
│   ├── 05-town.mjs        # Thematic: buildings, shop, forge
│   ├── 06-combat.mjs      # Thematic: battle overlay, victory
│   ├── 07-magic-circle.mjs
│   ├── 08-settings.mjs
│   ├── 09-hero-modals.mjs
│   ├── 10-post-day.mjs
│   ├── 11-building-modals.mjs
│   ├── 12-missions.mjs
│   ├── 13-book.mjs
│   ├── 14-tutorial.mjs        # Old: manual tutorial step injection
│   ├── 15-tutorial-interactive.mjs # Old: brittle step-by-step
│   └── index.mjs          # Flow registry
├── selectors/
│   └── selectors.mjs      # App CSS selectors
├── utils/
│   ├── server.mjs         # Static file server
│   ├── snapshot.mjs       # Semantic filename helper
│   ├── nav.mjs            # Click / wait helpers
│   ├── setup.mjs          # Fresh new-game helper
│   └── state-injector.mjs # window.__ENGINE__ wrappers (thematic flows)
├── audit.mjs              # Coverage report
├── registry.mjs           # Catalog of expected screenshots
└── config.mjs             # Paths, viewport, CLI args
```

---

## CLI Flags

| Flag | Description |
|------|-------------|
| `--playthrough` | Run the natural gameplay life flow (single flow, ~20 screenshots) |
| `--continuous` | Run thematic flows in one shared browser session |
| `--flows a,b,c` | Run only specific thematic flows |
| `--dry-run` | Validate flow structure without capturing screenshots |

---

## Gameplay Life Flow

`flows/99-playthrough.mjs` simulates a real user:

1. **Onboarding** — empty slot screen → occupied slot screen → picks a slot → book prologue
2. **Village** — first view of the village
3. **Tutorial** — attempts natural progression; screenshots each step; detects lockups and force-skips if broken
4. **Heroes** — navigates to heroes, clicks a hero, opens skills modal
5. **Adventure** — explore tree, clicks an expedition, views bestiary
6. **Town** — buildings tab, shop (locked or unlocked)
7. **Day Advance** — clicks next day, captures daily report
8. **Book** — views village updates in the book, navigates spreads
9. **Settings** — opens settings panel
10. **More Days** — advances again, checks for narrative toasts, revisits adventure with new unlocks

All screenshots are prefixed with `playthrough_`:

```
playthrough_save_slot_empty.png
playthrough_book_prologue.png
playthrough_village_fresh.png
playthrough_tutorial_heroes_tab.png
playthrough_tutorial_skills_modal_BROKEN.png   ← if tutorial locks up
playthrough_heroes_list.png
playthrough_adventure_explore.png
...
```

---

## Thematic Flows (Legacy Mode)

Each flow is self-contained and can inject state for deterministic screenshots:

```js
// In a thematic flow
await startNewGame(page, selectors)
await injectHero(page, { name: 'Aria', origin: 'origin_arcane_initiate', level: 10 })
await snap({ flow: 'heroes', state: 'heroes_list' })
```

**Adding a new thematic screenshot:**

1. Add an entry to `registry.mjs`:
   ```js
   { flow: 'heroes', state: 'heroes_modal_gambits', description: 'Hero gambits modal open' }
   ```

2. Add selectors to `selectors/selectors.mjs` if needed.

3. Implement the capture logic in the matching flow module.

4. Run to verify:
   ```bash
   node scripts/screenshots/orchestrator.mjs --flows heroes
   ```

---

## Output

Screenshots are written to `scripts/screenshots/output/`.

---

## Design Philosophy

**Gameplay Life** answers: *"What does the game actually look like when a human plays it?"*

**Thematic Flows** answer: *"Does this specific feature still render correctly?"*

Use `--playthrough` when you've made broad changes (tutorials, navigation, day flow) and want to see if anything broke. Use thematic flows when you've changed one system and need fast, targeted validation.
