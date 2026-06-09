# Time & Construction System

## Overview
`rpg-village` uses a turn-based day cycle. Time only advances when the player manually triggers the "Next Day" action. This system governs resource consumption, project completion, and population growth.

## The Day Cycle
When the player triggers a "Next Day" event, the following steps occur in order:

1.  **Daily Objectives Generation**:
    - If objectives for the current day do not exist, 2–3 random objectives are generated.
    - Objectives persist until completed or the day advances.

2.  **Consumption Phase**: 
    - The village consumes **1 Food** per **Villager** (Total Population).
    - If food is insufficient, growth stops and health/efficiency may drop.

3.  **Production Phase**:
    - The `farm` infrastructure produces food daily (+4 `food_raw_grain` per level) which is added to the inventory.
    - **Farmer Bonus**: If the `farmer` role is assigned, farm output is increased by 10%.

4.  **Miner Phase**:
    - If the `miner` role is assigned, there is a 20% chance to produce 1 Wood or Stone per day.

5.  **Construction Phase**: 
    - All active projects in the `constructionQueue` have their `daysRemaining` decremented by 1.
    - If `daysRemaining` reaches 0, the building is completed and its bonuses become active.


6.  **Growth Phase**:
    - If food is abundant and there is housing capacity, there is a chance for new villagers to join.

7.  **Recovery Phase**:
    - All idle heroes recover a base **2 HP** per day.
    - The `infirmary` adds percentage-based healing (+20% base + 10% per level) on top of the base 2 HP for a limited number of heroes (1 + floor(infirmaryLevel / 2)).

8.  **Meal Buff Tick**:
    - `HeroService.tickAllMealBuffs()` decrements `battlesRemaining` by 1 for all heroes.
    - This is called **immediately after each combat resolution** (primary trigger).
    - It is also called during `nextDay()` as a safety catch-up for any combats that may have occurred between day advances.
    - Buffs with 0 battles remaining are removed and stats are recalculated.

9.  **Calendar Update**:
    - The `day` counter is incremented.

## Construction Mechanic
Buildings are not instantaneous. They require a "Project" to be initiated.

### Requirements to Start a Project:
1.  **Materials**: The full cost in wood, stone, etc., must be available in the inventory.
2.  **Gold**: The upgrade cost must be paid upfront.
3.  **Labor**: Construction proceeds automatically once initiated; no individual villager needs to be assigned to the project.

### Project Data Model:
- `buildingId`: The ID of the building being upgraded/built.
- `targetLevel`: The level the building will reach upon completion.
- `daysRemaining`: Number of "Next Day" triggers required to finish.
- `assignedVillagerId`: (Deprecated) No longer used; construction does not track individual villagers.

## Implementation Details
- The state of all active projects is stored in `village.state.constructionQueue`.
- The `GameEngine.nextDay()` method is the central entry point for this logic.
- Worker roles (`population.roles`) affect Production, Miner, and Expedition phases.
