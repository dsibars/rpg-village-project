# Idea 03: Expedition Narrative Queue Framework

## Goal
Allow story expeditions (and other game events) to trigger **lore messages that appear on the next day transition**, similar to how the intro sequence shows narrative panels. Give the adventure a sense of progression beyond "gold + items gained."

## Current State (as per docs & code)
- `js/engine/shared/data/UnlockNarratives.js` already has a predicate-based narrative system: it checks `(state) => boolean` and delivers `{ titleKey, loreKey, era }` on `nextDay()`.
- `GameEngine.nextDay()` evaluates `unlockService.checkAllUnlocks()` and puts results into `dailyReport.newNarratives`.
- **However**, story expedition completions cannot directly enqueue a narrative. The reward system only handles `gold`, `items`, and `special: { type: 'hero' | 'villagers' }`.
- The UI already knows how to render `newNarratives`.

## What This Enables
- When Sir Valen is rescued, the next morning shows a narrative moment: *"A Shield in the Darkness"*.
- When a region is cleared for the first time, a lore entry appears describing the discovery.
- Content authors can add lore to any story mission by adding two translation keys — no code changes.
- The existing `UnlockNarratives` system stays intact; this adds an **event-driven** path alongside the predicate-driven path.

## In Scope
1. **Narrative Queue state** in `ExpeditionService`: `pendingNarratives[]` that persists to save.
2. **Story mission reward extension**: `reward.narrative: { titleKey, loreKey, era? }` (optional, shown once)
3. **`_finishExpedition` hook**: when a story mission completes and has a `narrative` reward, push it to `pendingNarratives`.
4. **`GameEngine.nextDay()` integration**: before evaluating `unlockService.checkAllUnlocks()`, consume `pendingNarratives` and inject them into `dailyReport.newNarratives`.
5. **"Shown once" guarantee**: narratives pushed from the queue are marked as consumed immediately; they never repeat.
6. **Region first-clear narratives**: when `RegionService` detects a first clear (via Idea 02's `narrative.firstClear`), it pushes to the same queue.

## Out of Scope
- 3-panel storyboard UI. We reuse the existing narrative display.
- New narrative art or illustrations.
- Triggering narratives from non-expedition sources (buildings, calendar events) — though the framework should be extensible enough to allow this later.

## Boundaries & Constraints
- Must use the **existing** narrative rendering path in the presentation layer. No new UI components.
- Must follow existing i18n key patterns: `nar_<event_id>_title` and `nar_<event_id>_lore`.
- Must be translatable into all 5 supported languages (en, es, ca, eu, gl).
- Backward compatible: story missions without a `narrative` field behave exactly as before.

## Dependencies
- **Idea 01 (Expedition Service Refactor)** must be complete. The queue lives in `ExpeditionService` state, and region first-clear detection lives in `RegionService`.
- **Idea 02 (Region Identity)** is not strictly required, but first-clear narratives naturally use the region's `narrative.firstClear` property. It is acceptable to build the queue first and wire first-clear triggers as part of Idea 02.

## Success Criteria
- Completing `exp_rescue_mission` with a `narrative` reward shows the lore text on the next day.
- The narrative appears exactly once per save.
- No changes to the presentation layer's narrative rendering code are needed.
- All existing tests pass.
