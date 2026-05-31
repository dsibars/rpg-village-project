# Idea 01: Expedition Service Refactor — Extract RegionService

## Goal
Split the `ExpeditionService` god-class into two focused services with clean boundaries and **explicit data contracts**, **without adding any new features or changing any observable behavior**. Create a stable architectural foundation so that subsequent ideas can be built on proper domain boundaries instead of a 1,170-line monolith.

## Current State (as per code)
`js/engine/explore/services/ExpeditionService.js` (~1,170 lines) owns:
- **Persistence**: loads/saves expedition state including region state
- **Region lifecycle**: unlock evaluation, seeding, stats tracking
- **Story mission injection**: evaluating requirements, injecting nodes into `availableNodes`
- **Expedition generation factory**: `_createProceduralNode`, pack rolling, boss selection, path branching
- **Expedition lifecycle**: assign, unassign, retire heroes to active expeditions
- **Combat orchestration**: `processDay`, battle resume, resolution
- **Reward distribution**: gold, items, loot, consumables, special rewards
- **Bestiary & enemy creation**: templates, elite rolling, instantiation

**CRITICAL: `ExpeditionService.state` is publicly accessed by external consumers:**
- `GameEngine.js` reads `expeditionService.state.activeCombatExpeditionId`, `state.activeExpeditions`, `state.completedIds`, and `state.regions` in **8 separate locations**
- `GameEngine.activateDeveloperCheat()` **mutates** `expeditionService.state.regions` and `state.completedIds` directly
- `CalendarService._generateRaid()` reads `this.villageService.state.regions` — this is **dead code** (village state has never had a `regions` property)
- `GameEngine._buildUnlockState()` passes `expeditionService.state.regions` to `UnlockNarratives` predicates
- `GameEngine.getState()` returns `expeditionRegions: expeditionService.state.regions` to the presentation layer
- `tests/unit/ExpeditionService.test.js` directly manipulates `expeditionService.state.regions` **15+ times** and calls private methods (`_finishExpedition`, `_createProceduralNode`, `_getRegionData`)

These encapsulation violations mean the refactor is not just "move methods" — it requires fixing all consumers.

## The Data Contracts

### Region Contract
```js
// Static definition (from data file)
RegionDefinition {
  id, name,
  branching, minStages, maxStages,
  enemies, baseLevel, bossPool,
  unlockRequirements,
  storyMissions: [StoryMissionDefinition]
}

// Runtime state (persisted by RegionService)
RegionState {
  clears, unlocked, firstClearBonusGiven,
  availableNodes: [ExpeditionDefinition | StoryMissionDefinition],
  stats: { clears, fails, retreats, totalGoldEarned, deepestDepth }
}
```

### Expedition Base Contract (definition, stored in `availableNodes`)
```js
ExpeditionDefinition {
  id, name, regionId,
  isStory: false,
  status: 'available' | 'completed' | 'closed',
  parentId: string | null,
  reward: { gold, items },
  stages: [{ type, enemies, isBoss?, enemyLevel?, depth? }]
}
```

### StoryMission Contract (extends Expedition, also stored in `availableNodes`)
```js
StoryMissionDefinition extends ExpeditionDefinition {
  isStory: true,
  requirements: {
    completedMissions?: string[],
    minRegionClears?: { [regionId]: number },
    minBuildingLevel?: { building: string, level: number }
  },
  reward: {
    gold, items,
    special?: { type, value }        // legacy backward compat
  }
}
```
Story missions are **definitions** that live in `availableNodes` until completed. They are injected by `RegionService` when requirements are met.

### Active Expedition Instance (runtime state, persisted by ExpeditionService)
```js
ActiveExpedition {
  id,                    // references the definition in availableNodes
  currentStage: number,
  heroIds: string[],
  status: 'assigned' | 'combat',
  battleContext?: { enemies, initialHp, expPerHero, stageNum, stageTotal, expName }
}
```

## The New Service Boundaries

### RegionService — The Region Domain & Expedition Factory
**Owns persistence key:** `region_state`

**Public API:**
- `state` — public property containing `{ regions }` (maintained for minimal consumer disruption; prefer getters)
- `getRegions()` → `{ [regionId]: RegionState }`
- `getRegion(regionId)` → `RegionState`
- `getAvailableExpeditions()` → `[ExpeditionDefinition | StoryMissionDefinition]` (all available nodes across all unlocked regions)
- `getExpeditionDefinition(expId)` → single node from `availableNodes` or `null`
- `getRegionTree(regionId)` → `{ regionId, name, clears, nodes }`
- `getRegionData(regionId)` → `RegionDefinition` from `REGION_REGISTRY`
- `getTotalClears()` → `number` (sum of clears across all regions)
- `checkRegionUnlocks(completedIds)` → evaluates unlocks, seeds new regions
- `completeExpedition(expId, heroIds, heroNames)` → marks node completed, increments clears, spawns children, injects stories; returns `{ wasFirstClear, spawnedNodes, injectedMissions }`
- `generateExpedition(regionId, clears, parentId = null)` — creates `ExpeditionDefinition`, adds to `availableNodes`, returns the definition
- `forceRemoveNodeAndIncrementClears(regionId, nodeId)` — for developer cheat: removes node from `availableNodes`, increments `clears` and `stats.clears`
- `incrementRegionStat(regionId, statName)` — for retreat tracking

**Private responsibilities:**
- `_getDefaultState()` — initializes `regions` with Greenfields + tutorial cave
- `_load()` — loads `region_state`, migrates from legacy `expedition_state.regions`
- `_seedRegion(regionId)` — creates initial `availableNodes` when a region unlocks
- `_injectStoryMissions(regionId, completedIds, villageState)` — evaluates requirements, adds eligible story missions
- `_checkMissionRequirements(reqs, completedIds, villageState)` — pure requirement evaluator
- `_checkUnlockRequirements(reqs, completedIds, villageState)` — pure unlock evaluator
- `_createProceduralNode(regionId, rData, clears, parentId)` — expedition factory (called by `generateExpedition`)
- `_rollPackType()`, `_rollPathBranching(activePaths)` — generation helpers

### ExpeditionService — The Expedition Lifecycle & Combat Orchestrator
**Owns persistence key:** `expedition_state`

**Public API:**
- `state` — public property containing `{ completedIds, activeExpeditions, expeditionTurnIndex, activeCombatExpeditionId, bestiary }`
- `getCompletedIds()` → `string[]`
- `getActiveExpeditions()` → `ActiveExpedition[]`
- `getActiveCombatExpeditionId()` → `string | null`
- `getHeroActivity(heroId)` → `{ type: 'expedition' | 'idle', expeditionId? }`
- `getExpeditions()` → **proxy** to `regionService.getAvailableExpeditions()` (preserves UI contract)
- `getRegionTree(regionId)` → **proxy** to `regionService.getRegionTree(regionId)` (preserves UI contract)
- `getBestiary()` → `string[]`
- `getEnemyTemplates()` → `{ [enemyId]: EnemyTemplate }`
- `assignExpedition(expId, heroIds)` → assigns heroes, creates `ActiveExpedition`
- `unassignHero(heroId)` → removes hero from active expedition
- `retire(expId?)` → aborts expedition(s), tracks retreat via `regionService`
- `processDay()` → picks active expedition, starts battle
- `resumeActiveBattle()` → resumes combat
- `resolveBattle()` → resolves combat, calls `_finishExpedition()`, returns result
- `getBattleResolutionPreview()` → preview before resolution
- `markCompleted(expId)` — for developer cheat: adds to `completedIds`, saves
- `checkRegionUnlocks()` — **proxy** to `regionService.checkRegionUnlocks(this.state.completedIds)` (preserves GameEngine contract)
- `getMaxConcurrentExpeditions()` → `number`

**Private responsibilities:**
- `_getDefaultState()` — initializes expedition state (NO `regions`)
- `_load()` — loads `expedition_state`, removes legacy `regions` field, applies fallbacks
- `_finishExpedition(exp, activeExp)` — **coordination method**: calls `regionService.completeExpedition()`, distributes rewards, handles first-clear bonus, checks unlocks, saves both services. **KEPT for testability and backward compatibility.**
- `_distributeRewards(exp)` — gold, items, loot drops, consumables, special rewards (extracted from `_finishExpedition`)
- `_createEnemy(templateId, isBoss, level, isElite, eliteTier)` — enemy instantiation
- `_trackRetreat(expId)` — delegates to `regionService.incrementRegionStat()`

## State Shapes After Refactor

### `region_state` (RegionService)
```js
{
  regions: {
    reg_greenfields: {
      clears: 0,
      unlocked: true,
      firstClearBonusGiven: false,
      availableNodes: [ /* ExpeditionDefinition | StoryMissionDefinition */ ],
      stats: { clears, fails, retreats, totalGoldEarned, deepestDepth }
    }
    // ... other regions
  }
}
```

### `expedition_state` (ExpeditionService)
```js
{
  completedIds: [],
  activeExpeditions: [ /* ActiveExpedition */ ],
  expeditionTurnIndex: 0,
  activeCombatExpeditionId: null,
  bestiary: []
  // LEGACY: regions field is REMOVED
}
```

## Coordination Flow: Expedition Completion

When `resolveBattle()` detects victory on the last stage:

1. `ExpeditionService` calls `_finishExpedition(exp, activeExp)`
2. `_finishExpedition` internally:
   - Gathers heroes from `heroService`
   - Updates hero `lifetimeStats.expeditionsCompleted++`
   - Calls `regionService.completeExpedition(exp.id, heroIds, heroNames)` which returns `{ wasFirstClear, spawnedNodes, injectedMissions }`
   - Grants first-clear speed bonus if `wasFirstClear`
   - Adds `expId` to `completedIds`
   - Removes `activeExp` from `activeExpeditions`
   - Calls `_distributeRewards(exp)` for gold, items, loot, consumables, special
   - Calls `regionService.checkRegionUnlocks(completedIds)`
   - Saves both services
   - Returns `Result.ok({ status: 'completed', ... })`
3. `resolveBattle()` returns the result from `_finishExpedition`

**Why `_finishExpedition` is kept:** It is called by `resolveBattle()` AND directly by tests. Keeping it as a coordination method avoids breaking all completion-related tests.

## Consumer Impact Audit

The following files **must be updated** as part of this refactor:

### `js/engine/GameEngine.js`
- **Constructor**: instantiate `RegionService` before `ExpeditionService`, inject `regionService` into `ExpeditionService`
- **Line 79**: `expeditionService.state.activeCombatExpeditionId` → `expeditionService.getActiveCombatExpeditionId()`
- **Line 122**: `const expState = this.expeditionService.state` in `activateDeveloperCheat()` → use `expeditionService.markCompleted()` and `regionService.forceRemoveNodeAndIncrementClears()`
- **Line 141**: `expeditionService.state.activeExpeditions` → `expeditionService.getActiveExpeditions()`
- **Lines 180, 1008**: `expeditionService.state.completedIds` → `expeditionService.getCompletedIds()`
- **Lines 186, 1009**: `expeditionService.state.regions` → `regionService.getRegions()`
- **Line 907**: `expeditionService.state.activeExpeditions.find(...)` → `expeditionService.getActiveExpeditions().find(...)`
- **Line 933**: `for (const otherExp of expeditionService.state.activeExpeditions)` → `for (const otherExp of expeditionService.getActiveExpeditions())`
- **`_buildUnlockState()`**: source `expeditionRegions` from `regionService.getRegions()` instead of `expeditionService.state.regions`
- **`getState()`**: source `expeditionRegions` from `regionService.getRegions()` — return shape stays identical

### `js/engine/calendar/services/CalendarService.js`
- **Line 126**: Remove dead code `Object.values(this.villageService.state.regions || {})`. Replace with `0` (the value it has always effectively returned) OR simply remove the clear-based scaling from raid level calculation since it has never executed.

### `js/engine/explore/services/ExpeditionService.js`
- Remove all region-related methods and state EXCEPT `_finishExpedition` (refactored as coordination method)
- Add `regionService` constructor parameter
- Add proxy methods and getters
- Update `_load()` to remove legacy `regions` field
- Extract `_distributeRewards(exp)` from the old `_finishExpedition` reward logic
- Replace `_findExpeditionDefinition(expId)` with delegation to `regionService.getExpeditionDefinition(expId)`

### `js/engine/explore/services/RegionService.js`
- **New file**: implement all region-related logic extracted from `ExpeditionService`
- Include save migration: extract `regions` from legacy `expedition_state` on first load
- Include field migrations: `firstClearBonusGiven`, `node.status`, `region.stats` fallbacks

### `tests/unit/ExpeditionService.test.js` — MAJOR RESTRUCTURING
- `createServices()` must create `RegionService` and pass it to `ExpeditionService`
- All `expeditionService.state.regions[...]` accesses become `regionService.getRegion(...)` or `regionService.state.regions[...]`
- All `expeditionService.state.regions[...].availableNodes.push(...)` become `regionService.generateExpedition(...)` (which auto-adds to availableNodes)
- `_finishExpedition` calls stay, but assertions on `state.regions[...]` change to `regionService.getRegion(...)`
- `_createProceduralNode(...)` calls become `regionService.generateExpedition(...)`
- `_getRegionData(...)` calls become `regionService.getRegionData(...)`
- `_generateConsumableDrops(...)` calls stay (backward-compat wrapper in ExpeditionService)
- Direct state resets (`state.completedIds = []`, etc.) stay — these target expedition state, not region state

### `tests/unit/DefenseRaid.test.js`
- **Zero changes expected** — uses `GameEngine` entry point and public methods only. Verify after GameEngine update.

## In Scope
1. Create `RegionService` class with its own `STORAGE_KEY = 'region_state'`, full public API, and save migration.
2. Refactor `ExpeditionService` to remove all region logic EXCEPT `_finishExpedition` (kept as coordination method), add `regionService` dependency, add getters/proxies, extract `_distributeRewards()`.
3. Update `GameEngine` to wire both services and replace all direct `state` access with getters.
4. Fix `CalendarService` dead code.
5. Ensure `GameEngine.getState()` return shape is preserved (presentation layer unchanged).
6. Ensure `GameEngine._buildUnlockState()` shape is preserved (`UnlockNarratives` unchanged).
7. Add `markCompleted()` and `forceRemoveNodeAndIncrementClears()` for `activateDeveloperCheat()`.
8. Update `tests/unit/ExpeditionService.test.js` to use both services.
9. All existing behavior tests (`DefenseRaid.test.js`) must pass without modification.

## Out of Scope
- **No new features.** No per-region scaling, no loot bias, no narrative hooks, no new story missions, no glyph drops.
- No changes to combat mechanics.
- No changes to the presentation layer (UI, adapters, HTML).
- No changes to translation files.
- No new behavior tests. Existing tests must pass; only test setup/instantiation may change.

## Boundaries & Constraints
- **Zero observable behavior change.** A player with an existing save should not notice any difference.
- All existing region data files remain untouched.
- All existing story missions continue to work identically.
- Save migration must handle old saves gracefully:
  - `RegionService` loads `region_state`; if missing, extracts `regions` from `expedition_state`
  - `ExpeditionService` loads `expedition_state`; if it contains `regions`, removes it and saves
- `RegionService` must not depend on `ExpeditionService` (unidirectional: ExpeditionService → RegionService).
- `GameEngine.getState()` must return the **exact same shape** so the presentation layer does not change.
- `_finishExpedition` must be kept as a private coordination method on `ExpeditionService` to preserve testability.
- `generateExpedition()` must add the created definition to `availableNodes` internally and return it (tests rely on this side effect).

## Dependencies
- None. This is the foundation for all other ideas.

## Success Criteria
- `ExpeditionService` line count drops significantly (target: under 700 lines).
- `RegionService` exists as a standalone service with clear responsibilities and its own persistence.
- `GameEngine` no longer accesses `expeditionService.state.regions` anywhere.
- `CalendarService` no longer references `villageService.state.regions`.
- `GameEngine.getState()` return shape is identical before/after.
- `GameEngine._buildUnlockState()` return shape is identical before/after.
- `activateDeveloperCheat()` uses service methods instead of direct state mutation.
- `tests/unit/ExpeditionService.test.js` passes with updated service setup.
- `tests/unit/DefenseRaid.test.js` passes without modification.
- Existing save games load correctly and behave identically after migration.
- No new i18n keys are added.
- No new UI components are created.
