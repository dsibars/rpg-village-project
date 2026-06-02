# Idea 04: Story Mission Effects Framework

## Goal
Upgrade story missions from "gold + items + maybe one hero" into **progression milestones** that can unlock buildings, open regions, grant heroes with specific origins, and trigger narrative moments. Make the story mission system the backbone of campaign progression.

## Current State (as per docs & code)
- `docs/explore/expeditions_data.md` defines story missions as unique challenges with fixed stages and rewards.
- Current `special` reward only supports `{ type: 'hero', value: 'Name' }` and `{ type: 'villagers', value: N }`.
- `docs/village/buildings_data.md` defines buildings as constructed via gold/materials. There is no "blueprint unlock" concept.
- Region unlocks are evaluated generically by `_checkRegionUnlocks()` based on `unlockRequirements` in region data.
- Story missions have a `requirements` object for injection, but no completion registry exists beyond `completedIds`.

## What This Enables
- Rescue Eldrin → unlock `witchs_hut` blueprint + unlock `reg_mystic_ruins` + show narrative (the user's exact draft idea).
- Rescue Lyra → unlock `tavern` blueprint.
- Destroy goblin outpost → reduce raid frequency (passive effect).
- Content authors design progression arcs by chaining story missions with effects, not by hardcoding in `GameEngine`.

## In Scope
1. **Effect registry**: A small, extensible list of effect types:
   - `hero`: grant a named hero with optional `origin`, `level`, `avatar`
   - `building_blueprint`: unlock a building so it becomes constructable
   - `region_unlock`: immediately unlock a region (bypasses normal requirements)
   - `narrative`: trigger a narrative queue entry (ties into Idea 03)
   - `villagers`: existing behavior, preserved
2. **Story Mission Completion Registry**: `state.storyMissions = { '<missionId>': { dayCompleted, heroIds[] } }` — separate from generic `completedIds`.
3. **`ExpeditionService._finishExpedition` effect resolver**: interpret `reward.effects[]` generically.
4. **Building availability gating**: `VillageService` checks if a building has its blueprint unlocked before allowing construction.

## Out of Scope
- Passive economy bonuses (+20% wood gathering, +50% warehouse capacity) — these require an economy rebalance and are too risky for this framework.
- New buildings themselves.
- Conditional story branching ("if you chose X, get Y").
- Changes to the combat stage system.

## Boundaries & Constraints
- All existing story missions (`exp_tutorial_cave`, `exp_rescue_mission`, `exp_forgotten_tomb`, `exp_orc_stronghold`, `exp_ancient_archives`) must continue to work with the old `special` format OR be migrated to the new `effects` format.
- Building blueprint unlocks must not bypass construction costs or build times — they only make the building **available** in the construction menu.
- Region unlocks via `region_unlock` effect should still call `_seedRegion()` properly (via `RegionService`).
- i18n: new translation keys only for narrative effects; hero names and building names already have keys.

## Dependencies
- **Idea 01 (Expedition Service Refactor)** must be complete. Effect resolution happens in `ExpeditionService._finishExpedition`, and `region_unlock` effects delegate to `RegionService`.
- **Idea 03 (Narrative Queue)** for the `narrative` effect type. If Idea 03 is not yet built, the `narrative` effect can be stubbed or deferred.

## Success Criteria
- A new story mission can be authored in a region data file that: grants a hero, unlocks a building, unlocks a region, and shows lore — all without code changes.
- The existing `exp_rescue_mission` (Sir Valen) can be migrated to the new `effects` format as a proof of concept.
- The Buildings UI correctly hides locked buildings and shows them after their blueprint is earned.
- All existing tests pass.
