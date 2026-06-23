# Screenshot suite as a continuous playthrough

## Problem
The screenshot flows currently boot a fresh app instance (and usually a fresh save slot) for every flow. On a fresh Day-1 game the tutorial overlay starts automatically, so non-tutorial flows such as `village` and `heroes` are blocked by the tutorial capture layer and fail.

The user wants the screenshot suite to simulate a real new-game playthrough: the tutorial should be played through, not skipped, and subsequent feature screenshots should continue from that same game state.

## Goal
Make the full screenshot suite runnable as one continuous playthrough that:
1. Starts a fresh game (book prologue).
2. Plays through the Day-1 tutorial chain interactively.
3. Continues into the village, heroes, adventure, town, combat, etc. sections.
4. Captures evidence (screenshots) at every relevant step.

## Proposed approaches

### Approach A — Orchestrator continuous mode (recommended)
Refactor the orchestrator so it can run flows in sequence while sharing the same browser page / `localStorage` state.

- Add a `reset` flag passed to every flow:
  - `true` → flow behaves as today (starts fresh, wipes localStorage if it wants).
  - `false` → flow assumes it is continuing from the previous flow and must NOT reload or wipe persistence.
- Modify `scripts/screenshots/orchestrator.mjs`:
  - Add a `--continuous` CLI flag / config option.
  - In continuous mode, only `page.goto(...)` once at the start; do NOT navigate between flows.
  - Pass `reset: false` to every flow after the first.
- Reorder the default flow list into a gameplay progression:
  1. `onboarding` (first, may reset to test save slots, but ends with a slot selected and the book dismissed).
  2. `tutorial-interactive` (plays the Day-1 chain).
  3. `village`, `heroes`, `hero-modals`, `adventure`, `town`, `building-modals`, `combat`, `magic-circle`, `missions`, `post-day`, `book`, `settings`.
- Update flow setup helpers (`startNewGame`, `resetSaveSlots`, etc.) and each flow's `run` function to respect `reset`:
  - Skip localStorage wipes, reloads, and slot selection when `reset === false`.
  - Flows that inject artificial state (e.g., combat, storage warning) can still do so via `window.__ENGINE__`.
- Update `scripts/screenshots/flows/index.mjs` if needed to pass the extra context.

**Pros:** matches the request exactly; one real playthrough; no tutorial skipping; existing isolated flows keep working when run individually.  
**Cons:** touches many flows; ordering and state assumptions become important; larger change.

### Approach B — Single dedicated playthrough flow
Keep the existing orchestrator and flows unchanged. Add a new `playthrough` flow (`scripts/screenshots/flows/16-playthrough.mjs`) that performs the entire journey in one function and captures screenshots for every section.

- Internally calls helpers or copies the needed steps from existing flows.
- Runs tutorial-interactive first, then visits each feature and captures states.
- Add registry entries under the `playthrough` flow.

**Pros:** minimal risk; does not modify existing flows; quick to implement.  
**Cons:** duplicates logic from existing flows; the existing "all screenshots" suite still fails on fresh games; does not make the default suite a playthrough.

## Recommendation
Approach A, because the user explicitly wants the screenshot tests themselves to feel like a continuous new-gameplay session and to generate all screenshots from that session. Approach B would only add a side quest.

## Implementation outline (Approach A)
1. **Orchestrator**
   - Parse `--continuous` flag in `config.mjs`.
   - In continuous mode: single `page.goto`, loop flows with `reset: false` after the first.
2. **Flow runner**
   - Pass `{ page, snap, reset }` to every `run` function.
3. **Setup helpers**
   - Add `startNewGame(page, selectors, { reset = true } = {})`.
   - Skip wipe/reload/slot-click when `reset === false`.
4. **Per-flow updates**
   - For each flow that currently calls `startNewGame`, `resetSaveSlots`, or `page.reload()`: guard with `if (reset) { ... }`.
   - The `tutorial-interactive` flow should always reset at the very beginning (fresh game), but after it completes the tutorial it leaves the game in a state the next flow can continue from.
5. **Ordering**
   - Update `getFlows()` in `registry.mjs` or the orchestrator's default order so continuous mode progresses logically.
6. **Validation**
   - Run `node scripts/screenshots/orchestrator.mjs --continuous` and verify all screenshots are captured without tutorial blockers.
   - Run existing unit/behaviour tests and the isolated tutorial flows to ensure no regressions.

## Open questions / decisions
- Should `--continuous` become the default, or remain an opt-in flag? If the user wants "all screenshots again" to be a playthrough, defaulting to continuous mode is reasonable.
- Should `onboarding` be part of the continuous run? It tests save-slot creation which wipes state. It might be better to run it first and let it end with a slot selected, or exclude it from continuous mode.
