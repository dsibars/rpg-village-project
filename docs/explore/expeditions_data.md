# Special Story Missions

While regions generate infinite random expeditions, **Story Missions** are unique, hand-crafted challenges that provide major progression milestones.

## Story Mission Registry

### `exp_tutorial_cave` (Tutorial Cave)
- **Region**: `reg_greenfields`
- **Unlock**: Available by default.
- **Completion Reward**: 
  - `gold`: 100
  - `items`: 20 Wood, 10 Stone
  - `effects`: Unlock Blueprints for `blacksmith` and `explorer_guild`
- **Stages**:
  - Stage 1: 1x Green Slime (designed to defeat the hero on the first day if stats/gear are unallocated)
  - Stage 2: 1x Fire Slime (Boss)
- **Description**: A basic cave to teach the player how to fight and allocate stats/equip items.

### `exp_rescue_mission` (The Captured Guard)
- **Region**: `reg_greenfields` (Special Instance)
- **Unlock**: Complete 1 expedition in Greenfields (Tutorial Cave).
- **Completion Reward**: 
  - `gold`: 200
  - `items`: 15 Wood, 5 Stone
  - `effects`:
    - New Hero: "Sir Valen" (Guard, `origin_guard`, Level 1, `valen.webp`)
    - Unlock Blueprints for `tavern` and `infirmary`
    - Trigger Narrative: `nar_rescue_mission`
- **Stages**:
  - Stage 1: 2x Green Slime
  - Stage 2: 1x Fire Slime
- **Description**: A local guard is being held by a goblin warband. Unlocks the second hero and the area branching.

### `exp_forgotten_tomb` (The Forgotten Tomb)
- **Region**: `reg_forgotten_ruins`
- **Unlock**: Clear 5 expeditions in Whispering Forest.
- **Completion Reward**: 
  - `gold`: 800
  - `items`: 10 Iron Ore
  - `effects`:
    - New Hero: "Lyra" (Poet, `origin_poet`, Level 1, `lyra.png`)
    - Unlock Blueprints for `witchs_hut` and `training_grounds`
- **Description**: Explore the heart of the ruins to find the lost poet.

### `exp_orc_stronghold` (Orc Stronghold)
- **Region**: `reg_iron_peaks`
- **Unlock**: `explorer_guild` Level 2.
- **Completion Reward**: 
  - `gold`: 5000
  - `items`: 20 Steel Ingots
  - `effects`:
    - New Hero: "Brog" (Warrior, `origin_warrior`, Level 1, `brog.png`)
- **Description**: Defeat the orc warlord to secure the mountain pass.

### `exp_ancient_archives` (The Golem Chambers)
- **Region**: `reg_ancient_library`
- **Unlock**: `explorer_guild` Level 3.
- **Completion Reward**: 
  - `gold`: 7000
  - `effects`:
    - Unlock Blueprint: `arcane_sanctum`
- **Description**: Retrieve the ancient blueprints from the mountain's core.

---

## Technical Note
Story missions override the procedural generation logic for a single run. Once completed, they are registered in the `storyMissions` state key and removed from the available missions list, triggering their rewards via the `effects` system. The region then returns to generating standard expeditions.
