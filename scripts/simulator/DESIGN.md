# Player Simulator Design Plan

## Goal
Create an automated headless player that simulates real gameplay for balance testing and regression testing. It should run many days, make decisions, and collect structured data.

## Reference Architecture
Built on top of the existing screenshot orchestrator pattern (`scripts/screenshots/orchestrator.mjs`).

## Core Approach: Hybrid Engine+UI Interaction
- **Fast path**: Use `page.evaluate()` + `window.__ENGINE__` for state queries and engine actions (nextDay, recruitHero, startProject, assignExpedition). This is fast, reliable, and bypasses UI animations.
- **UI path**: Use Playwright clicks for modal-heavy flows (combat, hero equipment, magic circle) to also exercise the UI layer.
- **Data collection**: Use `page.evaluate(() => window.__ENGINE__.update())` to snapshot full game state at each day.

## Simulator Structure

```
scripts/simulator/
  simulator.mjs          — Main entry point, CLI args, result output
  config.mjs             — Simulation parameters (days, priorities, seed)
  GameSession.mjs        — Manages one Playwright session + game lifecycle
  PlayerBrain.mjs          — Decision logic: what to do given current state
  StateLogger.mjs        — Extracts and logs structured game state
  strategies/
    default.mjs          — Default "balanced" strategy (build, recruit, explore)
    aggressive.mjs       — Prioritize combat and expeditions
    builder.mjs          — Prioritize village infrastructure
    minimal.mjs          — Do nothing but nextDay (baseline)
```

## Data Logged Per Day

```json
{
  "day": 5,
  "timestamp": "2026-06-10T05:40:00Z",
  "village": {
    "gold": 150,
    "population": { "total": 4, "builders": 2, "farmers": 1, "miners": 1 },
    "infrastructure": { "housing": 1, "farm": 0, "warehouse": 1 },
    "constructionQueue": []
  },
  "heroes": [
    { "name": "Arthur", "level": 2, "hp": 35, "status": "resting", "origin": "origin_warrior" }
  ],
  "inventory": { "material_wood": 12, "potion_small": 2 },
  "expeditions": { "active": [], "completed": ["exp_tutorial_cave"] },
  "events": ["recruited_hero", "building_complete_farm"],
  "dailyReport": { "goldChange": 10, "foodChange": -2, "woodChange": 4 }
}
```

## Decision Engine (PlayerBrain)

Per day, the brain evaluates priorities in order:

1. **Construction** — If gold >= cost and builders available, start most valuable project
2. **Recruitment** — If gold >= 50 and tavern exists and heroes < max, recruit
3. **Expeditions** — If heroes available (resting), assign to best available expedition
4. **Worker Assignment** — Rebalance population roles based on needs
5. **Next Day** — Always advance (core loop)

Strategy files override priority weights and thresholds.

## CLI Interface

```bash
# Run 30 days with default strategy, output to JSON
node scripts/simulator/simulator.mjs --days 30 --strategy default --output results.json

# Run 100 days, save full state log per day
node scripts/simulator/simulator.mjs --days 100 --strategy aggressive --output-dir ./sim-runs/

# Dry run (no browser, just log decisions)
node scripts/simulator/simulator.mjs --days 10 --dry-run

# Add to package.json
npm run simulate
npm run simulate:balance   # 50 days default
npm run simulate:stress    # 200 days aggressive
```

## Integration with Existing Code

- Reuses `scripts/screenshots/utils/nav.mjs`, `setup.mjs`, `state-injector.mjs`
- Reuses `selectors/selectors.mjs` for UI navigation
- Uses `dist/index.html` (file:// protocol) — no server needed for simulator
- Optionally starts local server if file:// causes CORS issues with localStorage

## Output & Artifacts

1. **JSON log** — One file per run, array of daily state snapshots
2. **Summary report** — Console output: days survived, gold trend, hero count, buildings built, expeditions completed, events triggered
3. **CSV export** — Flattened metrics for spreadsheet analysis (gold/day, population growth, etc.)
4. **Screenshots** — Optional: capture key moments (day 1, day N, first combat, first building)

## Future Extensions (out of scope for v1)

- Multi-run batch execution with different seeds
- Statistical analysis across runs
- Regression diff: compare two game versions
- Fuzz testing: random decisions to find edge cases

## Implementation Order

1. `GameSession` — Boot browser, load game, start new game, extract state
2. `StateLogger` — Structured JSON state extraction
3. `PlayerBrain` + `default.mjs` — Basic decision loop
4. `simulator.mjs` — CLI wiring, run loop, summary generation
5. `package.json` scripts + README
6. Test: run 10 days, verify output
