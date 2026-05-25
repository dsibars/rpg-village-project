# Hero Specification

## Overview
Heroes are the defenders of the village and the primary means of progressing the game. They venture out to fight, gather resources, and rescue new villagers.

## Data Model (`Hero`)

### Identity
- `id`: Unique UUID.
- `name`: String.
- `level`: Integer, current level.
- `exp`: Integer, current experience points.
- `status`: Enum (`active`, `resting`, `training`). Hero's idle status.
- `activity`: Implicit state. If a hero is on an expedition, they are considered busy.
- `origin`: The hero's background, which provides unique stat multipliers and party-wide traits.
  - See [origins_data.md](origins_data.md) for the full registry.

### Attributes
- `maxHp` / `maxMp`: Resource pools.
- `strength` / `defense`: Physical combat stats.
- `magicPower`: Magic damage and healing power.
- `speed`: Turn order and evasion frequency.

### Meal Buffs
- `mealBuffs`: Array of active food buffs. Each buff has `stat`, `value`, and `battlesRemaining`.
  - Buffs are applied in `recalculateStats()` and tick down after each combat.
  - When `battlesRemaining` reaches 0, the buff is removed.

### Equipment Set Bonuses
- `activeSetBonuses`: Array of currently active equipment set bonuses.
  - Each entry contains `setId`, `setName`, `pieces` (equipped count), `threshold` (met tier), and `bonus` (stat deltas).
  - Set bonuses are recalculated whenever equipment changes.

## Progression
- **Leveling**: Every level grants `statPoints` (2-3).
- **XP Formula**: XP required to reach level $L$ is `L * 20`.
- **Stat Gains on Level Up**: `+5 HP`, `+2 MP` per level (before meal buffs or equipment modifiers).
- **Starting Points**: All newly recruited heroes begin at Level 1 with **5 unassigned stat points** by default, allowing the player to customize their initial attributes before deployment.
- **Base Stats**: Level 1 heroes start with `HP: 30`, `MP: 15`, `STR: 8`, `DEF: 4`, `SPD: 4`, `MAG: 4`. These values ensure heroes feel competent from the first battle.
- **Permanent Bonuses**: Heroes can receive permanent stat bonuses outside of leveling. The primary source is the **Region First-Clear Speed Boost** — when a hero participates in the first-ever clear of a region, they gain **+2 base Speed** permanently.
- **Rescued Heroes**: Heroes obtained through story missions (e.g., Sir Valen) start at `max(1, average_party_level - 1)` and are equipped with a basic wooden weapon and leather armor so they can contribute immediately.
- **Attributes**: Base HP/MP increase automatically on level up.
- **Skills**: Heroes unlock new **physical skill families** using **Skill Points** earned at level milestones (1, 5, 10, 15, 20, 25). Max 6 families. See [../shared/combat/physical_skill_system.md](../shared/combat/physical_skill_system.md) for the full system.
  - See [../shared/combat/hero_skills_data.md](../shared/combat/hero_skills_data.md) for the family registry.

## Recruitment

Heroes can be obtained through two methods:

1. **Story Rescue**: Certain expeditions reward heroes upon completion (e.g., Sir Valen from "The Captured Guard").
2. **Tavern Recruitment**: Once the `tavern` building is constructed (Level 1), players can recruit random heroes for gold.
   - Base cost: 100g.
   - Cost scales by 20% per existing hero: `cost = floor(100 * 1.2^(hero_count))`.
   - Recruited heroes receive a random name and origin, start at Level 1 with 5 stat points.

## Equipment
Heroes have 6 equipment slots: `head`, `body`, `legs`, `leftHand`, `rightHand`, and `accessory`. 
- See [../shared/inventory/equipment.md](../shared/inventory/equipment.md) for details on gear and [../shared/inventory/equipment_data.md](../shared/inventory/equipment_data.md) for values.
- Equipment can be swapped or unequipped from the Hero Details panel in the Heroes screen. Clicking any equipment slot opens a modal displaying compatible items in the inventory.
- Equipping multiple items of the same material **set** grants set bonuses. See Equipment Specification for the full bonus table.

## Expedition State Lock
While a hero is deployed on an active expedition (their status or activity is not idle), their progression and equipment are locked. They cannot assign unassigned stat points, learn/upgrade skills, or swap/unequip equipment until they return to the village (either by completing the expedition or by retreating).
