# Idea 02: Thematic Region Identity Framework

## Goal
Make regions mechanically distinct by expanding the region data model with first-class domain properties: scaling curves, loot profiles, and narrative hooks. Transform regions from "enemy list + stage count" into data-driven identities where each area has a clear tactical and economic purpose.

## Current State (as per docs & code)
- `docs/explore/regions_data.md` defines regions as: `id, name, branching, minStages, maxStages, enemies, baseLevel, bossPool, unlockRequirements, storyMissions`
- `ExpeditionService._createProceduralNode` (now delegated to `RegionService`, see Idea 01) uses hardcoded `if/else` chains for loot and a **global** scaling formula for ALL regions.
- All regions feel mathematically identical. Greenfields (the "safe tutorial zone") scales at the same rate as Frozen Peaks.

## What This Enables
- Greenfields becomes a true "safe farming zone" with slower scaling and softer stat curves.
- Frozen Peaks / Forgotten Ruins become "preparation checks" with steeper scaling.
- Mystic Ruins can declare itself as the "magic area" through loot profile configuration.
- New regions can be added by content authors using only data files, without touching service code.

## In Scope
1. **Expanded region data contract** (first-class properties, NOT a catch-all "personality" bag):
   - `scaling`: `{ levelPerClears, statMultiplier, maxLevelCap }`
   - `lootProfile`: `{ materials: [{ id, min, max, chance }], goldBase, goldPerClear }`
   - `narrative`: `{ firstClear: { titleKey, loreKey, era } }`
   - `glyphDropTable`: reserved field for Idea 05
2. **Default values**: if a region omits these fields, sensible defaults apply (current behavior).
3. **Refactor `RegionService` generator**: replace the hardcoded `if/else` loot block with a generic `lootProfile` consumer.
4. **Refactor scaling logic**: `generateExpedition` reads `scaling` from region data instead of global constants.
5. **First-clear narrative trigger**: when a region is cleared for the first time, enqueue a narrative for the next day (consumes Idea 03's queue).

## Out of Scope
- New enemy types or enemy abilities (silence, freeze, reflect, etc.)
- New regions themselves (this framework enables them, but they are a separate content task)
- Changes to the combat engine
- Changes to unlock requirements schema
- Passive economy bonuses (+20% wood gathering, etc.)

## Boundaries & Constraints
- All existing regions must continue to work with **defaults** if no new fields are provided (backward compatibility).
- Translation keys for first-clear narratives must follow existing `nar_*` naming patterns.
- The refactor must not change the **observable** difficulty of existing regions unless we explicitly add the new fields to that region file.
- `RegionService` must validate region data on load: unknown fields warn, missing required fields error.

## Dependencies
- **Idea 01 (Expedition Service Refactor)** must be complete. `RegionService` must exist as the factory before we expand its data model.

## Success Criteria
- The hardcoded `if/else` loot block in `RegionService` (moved from `ExpeditionService` in Idea 01) is entirely removed.
- Adding a `scaling` block to `reg_greenfields` makes it scale slower, verified by tests.
- A new region can be authored with a unique scaling curve and loot profile without touching service code.
- All existing tests pass.
