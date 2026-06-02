# Regions Data (The World Map)

Instead of a static list of missions, `rpg-village` uses a **Dynamic Region Discovery System**. Each Region acts as an "Expedition Factory" that populates a persistent branching tree of missions for the player to explore.

## 1. The Discovery System
When a Region is unlocked, it initializes with a "Starting Expedition". Completing missions within a region triggers the **Discovery Logic**.

### Discovery Logic (Ramifications)
Every time an expedition is completed, the Region evaluates if new paths should be discovered:
- **Linear Path**: Completing Exp A unlocks Exp B.
- **Branching Path**: Completing Exp A unlocks Exp B and Exp C.
- **Hidden Paths**: Some expeditions only appear if certain conditions are met (e.g., "Found a map in Exp A").

### Persistence
Once an expedition is generated (instantiated), it is **persistent**:
- It has a unique `id` and `dependencyId`.
- Its enemies, levels, and rewards are **fixed** based on the region's current scaling at the moment of generation.
- The history of all completed expeditions in a region is tracked.

## 2. Progression & Scaling
The difficulty of newly generated expeditions is governed by the Region's `Clears Count`.

- **Enemy Level**: `Base_Tier_Level + floor(Region.Clears / 3)`.
- **Stat Scaling**: Enemies scale by `Base_Stat * 1.1^(Level - 1)`. Speed remains flat to preserve turn-order feel.
- **Complexity Inflation**: As `Clears` increase, the generator favors more stages and higher boss frequency.
- **Explorer Guild Bonus**: Reduces stage count by 10% per Explorer Guild level (minimum 1 stage).
- **Scout Bonus**: Every 2 assigned Scout villagers reduces stage count by 1 (minimum 1 stage).

---

## 3. Implemented Region Registry

| ID | Name | Tier | Branching | Min Stages | Max Stages | Base Level | Enemies | Unlock Condition |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `reg_greenfields` | Greenfields | 1 | Low | 1 | 2 | 1 | `slime_green`, `wild_boar` | Start |
| `reg_tiny_cave` | Tiny Cave | 1 | Medium | 2 | 3 | 2 | `bat_small`, `spider_minor` | Complete `exp_tutorial_cave` |
| `reg_calmed_beach` | Calmed Beach | 1 | Low | 2 | 3 | 2 | `crab_shell`, `water_spirit_minor` | 3 Greenfields clears OR Explorer Guild L1 |
| `reg_dark_forest` | Dark Forest | 2 | Medium | 2 | 4 | 3 | `goblin_scout`, `goblin_grunt`, `wild_boar` | 2 Tiny Cave clears |
| `reg_goblin_camp` | Goblin Camp | 3 | High | 3 | 5 | 4 | `goblin_scout`, `goblin_grunt`, `goblin_brute` | 3 Dark Forest clears OR Explorer Guild L2 |
| `reg_mystic_ruins` | Mystic Ruins | 3 | Low | 2 | 4 | 4 | `skeleton_warrior`, `ghost_wisp`, `water_spirit_minor` | Explorer Guild L2 OR 5 total clears |
| `reg_frozen_peaks` | Frozen Peaks | 4 | Medium | 3 | 6 | 5 | `ice_elemental`, `young_drake`, `goblin_brute`, `frost_wolf`, `stone_golem` | Explorer Guild L3 OR 8 total clears |
| `reg_whispering_forest` | Whispering Forest | 2 | Medium | 2 | 4 | 2 | `rabbit_horned`, `wolf_alpha`, `slime_earth`, `goblin_scout` | 5 Greenfields clears OR Explorer Guild L1 |
| `reg_murky_swamp` | Murky Swamp | 3 | High | 3 | 5 | 3 | `zombie_rotter`, `slime_earth`, `murloc_shore`, `goblin_shaman` | 4 Dark Forest clears |
| `reg_forgotten_ruins` | Forgotten Ruins | 4 | Low | 3 | 6 | 5 | `skeleton_warrior`, `ghost_wisp`, `cultist_acolyte`, `stone_golem`, `lich_apprentice` | 6 Mystic Ruins clears OR Explorer Guild L3 |

## 4. Region Generation Patterns

### `reg_greenfields` (Tutorial Region)
- **Pattern**: Simple linear progression.
- **Enemies**: `slime_green`, `wild_boar`, `rabbit_horned`, `slime_earth`.

### `reg_tiny_cave` (The Burrow)
- **Pattern**: Short, branching paths.
- **Enemies**: `bat_small`, `spider_minor`, `slime_green`, `goblin_scout`.

### `reg_calmed_beach` (Coastal Path)
- **Pattern**: Linear exploration of the coastline.
- **Enemies**: `crab_shell`, `water_spirit_minor`, `murloc_shore`, `slime_earth`.

### `reg_dark_forest` (The Goblin Woods)
- **Pattern**: Medium branching with goblin encounters.
- **Enemies**: `goblin_scout`, `goblin_grunt`, `wild_boar`, `wolf_alpha`, `goblin_slinger`.

### `reg_goblin_camp` (The War Camp)
- **Pattern**: High branching, deep progression.
- **Enemies**: `goblin_scout`, `goblin_grunt`, `goblin_brute`, `goblin_shaman`, `goblin_slinger`, `goblin_king`.

### `reg_mystic_ruins` (The Dead Halls)
- **Pattern**: Low branching, undead and elemental focus.
- **Enemies**: `skeleton_warrior`, `ghost_wisp`, `water_spirit_minor`, `zombie_rotter`, `cultist_acolyte`.

### `reg_frozen_peaks` (The Summit)
- **Pattern**: Medium branching, high-level elemental and dragon encounters.
- **Enemies**: `ice_elemental`, `young_drake`, `goblin_brute`, `frost_wolf`, `stone_golem`.

### `reg_whispering_forest` (The Eldertree Grove)
- **Pattern**: Medium branching, wood and herb gathering.
- **Enemies**: `rabbit_horned`, `wolf_alpha`, `slime_earth`, `goblin_scout`.

### `reg_murky_swamp` (The Fen)
- **Pattern**: High branching, poison and undead focus.
- **Enemies**: `zombie_rotter`, `slime_earth`, `murloc_shore`, `goblin_shaman`.

### `reg_forgotten_ruins` (The Lost Halls)
- **Pattern**: Low branching, deep dungeon with boss finales.
- **Enemies**: `skeleton_warrior`, `ghost_wisp`, `cultist_acolyte`, `stone_golem`, `lich_apprentice`.

---

## 5. Planned Region Registry (Future)

The following regions are planned for future expansion but not yet implemented:

| ID | Name | Tier | Theme |
| :--- | :--- | :--- | :--- |
| `reg_stony_foothills` | Stony Foothills | 2 | Stone, Iron |
| `reg_iron_peaks` | Iron Peaks | 3 | Iron, Steel |
| `reg_crystal_hollow` | Crystal Hollow | 3 | Magic Shards |
| `reg_great_desert` | Great Desert | 4 | Gold, Rare Gems |
| `reg_obsidian_crater` | Obsidian Crater | 4 | Steel, Obsidian |
| `reg_ancient_library` | Ancient Library | 4 | Blueprints |
| `reg_frostbite_tundra` | Frostbite Tundra | 5 | Fur, Mythril |
| `reg_sky_fortress` | Sky Fortress | 5 | Unique Gear |
| `reg_dragon_maw` | The Dragon's Maw | 5 | Dragon Scales |

---

## 6. Region Data Schema

Each region file exports an object with the following fields:

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique region identifier (e.g. `reg_greenfields`). |
| `name` | `string` | Display name. |
| `branching` | `'low' \| 'medium' \| 'high'` | Controls how many procedural paths spawn on clear. |
| `minStages` | `number` | Minimum stages for procedural nodes. |
| `maxStages` | `number` | Maximum stages for procedural nodes. |
| `enemies` | `string[]` | Enemy template IDs available in this region. |
| `baseLevel` | `number` | Base enemy level for the region. |
| `bossPool` | `string[]` | Boss candidates for final stages. |
| `unlockRequirements` | `object \| null` | Conditions to unlock the region. `null` = starting region or stub. |
| `storyMissions` | `object[]` | Hand-crafted missions injected at milestones. |
| `scaling` | `{ levelPerClears, statMultiplier, maxLevelCap }` | Difficulty curve for this region. |
| `lootProfile` | `{ materials[], goldBase, goldPerClear }` | Declarative material and gold drops. |
| `narrative` | `{ firstClear: { titleKey, loreKey, era } } \| null` | First-clear narrative trigger. |
| `glyphDropTable` | `any` | **Reserved** for Idea 05. |

> **Note:** `scaling` and `lootProfile` are required. Every region must declare its own identity. There are no global defaults or legacy fallbacks.

### `unlockRequirements` Schema

```js
// Simple: complete a specific mission
{ completedMissions: ['exp_tutorial_cave'] }

// Region clears requirement
{ minRegionClears: { reg_tiny_cave: 2 } }

// Total clears across all regions
{ minTotalClears: 5 }

// Building level requirement
{ minBuildingLevel: { building: 'explorer_guild', level: 2 } }

// OR conditions
{ any: [
    { minRegionClears: { reg_greenfields: 3 } },
    { minBuildingLevel: { building: 'explorer_guild', level: 1 } }
] }

// AND conditions (rarely needed)
{ all: [
    { completedMissions: ['exp_tutorial_cave'] },
    { minRegionClears: { reg_greenfields: 3 } }
] }
```

The evaluator is generic: `_checkRegionUnlocks()` iterates `REGION_REGISTRY` and calls `_checkUnlockRequirements()` for each region. Adding a new region only requires creating the file and importing it in `index.js` — no service changes needed.

## 7. Region Stats (History Tracking)

Each unlocked region maintains aggregate stats in its state:

| Stat | Description |
|------|-------------|
| `stats.clears` | Expeditions successfully completed. |
| `stats.fails` | Expeditions lost in combat. |
| `stats.retreats` | Expeditions manually retired. |
| `stats.totalGoldEarned` | Cumulative gold from this region. |
| `stats.deepestDepth` | Maximum `depth` reached in any completed expedition. |

These are initialized on region unlock and updated automatically by `ExpeditionService`.

## 8. Technical Spec: Generation Workflow

1. **Trigger**: Player completes Expedition `exp_01` in Region `R`.
2. **Evaluate**: 
   - Increment `R.clears` and `R.stats.clears`.
   - Roll for branching factor (based on `R.branching`).
3. **Instantiate**:
   - Create `exp_02` (and `exp_03` if branched).
   - Set `parentId = exp_01`.
   - **Roll Stages**: Determine stage count and enemy groups using `R.enemies`.
   - **Snap Levels**: Set enemy levels based on current `R.clears`.
   - **Bake Rewards**: Calculate gold and item rewards.
4. **Save**: The new expeditions are added to the region's `availableNodes` list.
