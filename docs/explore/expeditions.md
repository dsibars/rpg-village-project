# Explore Module (Regions & Discovery)

## Overview
Exploration is a **Discovery Process**. Instead of a flat list, players explore a branching tree of missions within themed **Regions**.

## Core Concepts

### 1. The Region (The Generator)
A Region is a persistent world area (e.g., "The Whispering Forest"). It acts as a template for generating expeditions and tracks the overall progression of discovery within its boundaries.

### 2. The Expedition Instance (The Node)
When a hero explores a region, they choose an **Expedition Instance**. 
- **Deterministic**: Once generated, an expedition's stages, enemies, and rewards are fixed.
- **Persistent**: Completed expeditions remain in the region's history.
- **Dependency**: Most expeditions are `locked` until their "Parent" expedition is completed.

## The Discovery Lifecycle

1. **Unlocking a Region**: When a region is first discovered, it contains a single `available` starting expedition.
2. **Clearing a Node**: When an expedition is completed:
   - The node's status changes to `completed`.
   - The Region's **Discovery Logic** triggers.
3. **Spawning Ramifications**: The Region generates 1 or more new "Child" expeditions.
   - **Linear**: One new path opens deeper into the region.
   - **Branching**: Multiple paths open (e.g., "The Forest Clearing" leads to "The Deep Woods" AND "The River Bank").
   - **Scaling**: Each new generation is slightly harder than the last, reflecting the team's venture deeper into dangerous territory.

## Discovery Mechanics

### Branching Factor
Each region has a `Branching` profile:
- **Low (Linear)**: Mostly a single path (Tutorial regions).
- **Medium**: Occasional choices between two paths.
- **High**: Multiple paths leading to different sub-areas and rewards.

### Story Nodes (Fixed Content)
Hand-crafted "Story Missions" are injected into the discovery tree at specific milestones. Unlike procedural nodes, these have unique requirements and rewards (e.g., "Rescue the Guard").
- **Discovery**: When a requirement is met (e.g., 10 clears in a region), the next discovery roll is guaranteed to spawn the Story Node as a branch.
- **Persistence**: If failed, the Story Node remains available. If completed, it is permanently removed from the "Available" pool.

## The Assignment & Execution Lifecycle

### 1. Assignment Phase
- **Combat Intel**: Before assigning heroes, the expedition node card reveals all unique enemy types that will be encountered. This pre-expedition intel allows players to optimally configure their party's Gambits and equipment for the specific threat profile.
- **Assigning Heroes**: Heroes can be assigned to an available expedition node.
- **Lock-in**: While an expedition is in its initial stage (Stage 0), you can assign or unassign heroes freely.
- **Mid-Expedition Restrictions**: Once an expedition has progressed past the first stage, **no new heroes can be assigned** to it.
- **Hero State Lock**: Deployed heroes are outside the village. While on an expedition, they cannot assign stat points, upgrade skills, or change/swap equipment.


### 2. Execution Phase (Day Advance)
- **Automatic Resolution**: Combat and exploration do not happen instantly upon clicking. They are executed automatically when the game advances to the next day (`GameEngine.nextDay()`).
- **1 Stage = 1 Day**: A single stage of an expedition is resolved each time a day passes. For example, a 3-stage expedition requires at least 3 days to complete.
- **Rewards**: Rewards are granted automatically when the final stage is successfully completed.
  - **Gold & Materials**: Defined by the expedition node.
  - **Equipment Loot**: 40% chance for a random weapon or armor drop scaled to region level.
  - **Consumable Drops**: Guaranteed `tiny_mp_potion` (1 base + 1 per region level above 1, capped at +2) with a 50% chance for an additional potion. Also a 30% chance for 1 `tiny_hp_potion`. These drops ensure mages can sustain 4–5 spell casts per expedition.

### 3. Failing & Retiring (Unassigning)
An expedition is failed if all heroes are defeated during a daily combat resolution.
- **Retreat (Unassign)**: Players can "Retire" by unassigning all heroes from an active expedition. If unassigned mid-expedition (Stage 1 or higher), the expedition is aborted and its progress resets to Stage 0. The players keep any rewards gained from previous full expeditions, but this specific instance resets.
- **Defeat**: If defeated in battle, the expedition is immediately aborted and reset.
- **Partial Experience on Defeat**: Even if defeated, heroes earn partial experience. The game guarantees a minimum so that failed attempts still contribute to growth:
  - `Exp Earned = max( floor(Base Stage Exp * 0.25), floor(Base Stage Exp * (Total Damage Done / Total Enemy Max HP) * 0.5) )`
  - This guarantees at least 25% of victory EXP even on total defeat, and up to 50% for near-wins. Prevents the "death spiral" where underleveled heroes cannot catch up.
- **Retry**: Procedural nodes can be retried as long as they remain in the "Available" pool.

### 4. Discovery on Success
Failing an expedition **does not** trigger the Discovery Logic. New paths are only revealed when the final stage of an expedition is completed successfully.

### 5. First-Clear Speed Boost
When a region is cleared for the **first time** (transitioning from 0 to 1 clears), all participating heroes receive a **permanent +2 Speed** bonus. This is a one-time reward per region; subsequent clears do not grant additional speed. The boost is applied to `baseSpeed` and persists across saves.

## Region Unlock Conditions

Regions are unlocked dynamically as the player progresses. Unlock requirements are defined **in region data files** (`js/engine/explore/data/regions/reg_*.js`) and evaluated generically by `ExpeditionService` — no service code changes are needed when adding a new region.

| Region | Unlock Condition |
|--------|------------------|
| **Greenfields** | Available from game start (no requirement) |
| **Tiny Cave** | Complete `exp_tutorial_cave` |
| **Calmed Beach** | 3 Greenfields clears **OR** Explorer Guild L1 |
| **Dark Forest** | 2 Tiny Cave clears |
| **Goblin Camp** | 3 Dark Forest clears **OR** Explorer Guild L2 |
| **Mystic Ruins** | Explorer Guild L2 **OR** 5 total clears across all regions |
| **Frozen Peaks** | Explorer Guild L3 **OR** 8 total clears across all regions |
| **Whispering Forest** | 5 Greenfields clears **OR** Explorer Guild L1 |
| **Murky Swamp** | 4 Dark Forest clears |
| **Forgotten Ruins** | 6 Mystic Ruins clears **OR** Explorer Guild L3 |

> **⚠️ Intentional Design: The Discovery Delay**
>
> Region unlocks are evaluated once per day during `nextDay()`, **after** building construction but **before** expedition resolution. This creates a natural one-day delay for expedition-based unlocks:
>
> - **Building-based unlocks** (e.g., Explorer Guild L1 → Calmed Beach) appear **the same day** the building completes.
> - **Expedition-based unlocks** (e.g., completing Tutorial Cave → Tiny Cave) appear **the next day**.
>
> This is deliberate — it represents the time for scouts to return and report new discoveries. Do not "fix" this by calling `checkRegionUnlocks()` after `processDay()`.

See [Regions Data](regions_data.md) for the `unlockRequirements` schema and how to add new regions.

## Building Effects on Expeditions

### Explorer Guild
- **Level 1**: Unlocks Calmed Beach immediately (bypasses the 3-clears requirement)
- **Level 2+**: Reduces expedition stage count by **10% per level** (minimum 1 stage)
- **Level 2+**: Unlocks Goblin Camp and Mystic Ruins
- **Level 3+**: Unlocks Frozen Peaks

### Training Grounds
- **Level 1+**: Idle heroes gain **+5% passive EXP per day** per Training Grounds level
- Only heroes that are alive, idle, and not on expeditions receive this bonus

## Bestiary Integration

Enemy types encountered during expeditions are automatically tracked in the **Bestiary**. Each unique enemy template ID is recorded upon first combat encounter. The Bestiary displays encountered enemies with full stats, while undiscovered enemies remain hidden (shown as `???`).

See [Bestiary Specification](../shared/combat/bestiary.md) for details.

## Data Registries
- **[Regions Data](regions_data.md)**: Details on all implemented and planned regions.
- **[Special Missions](expeditions_data.md)**: Registry of unique story-driven milestones.
- **[Enemies Data](../shared/combat/enemies_data.md)**: Enemy templates used for generation.
