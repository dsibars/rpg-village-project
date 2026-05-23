# Meal Crafting Specification

## Overview
The meal crafting system allows players to cook meals from raw ingredients and feed them to idle heroes for temporary combat buffs.

## Architecture
- **Facade**: `GameEngine.cookMeal(recipeId)` and `GameEngine.consumeMeal(mealId)`
- **Data**: `MEAL_RECIPES` in `GameConstants.js`
- **Buff Storage**: `Hero.mealBuffs` array

## Cooking
1. `cookMeal(recipeId)` looks up the recipe in `MEAL_RECIPES`.
2. Validates that all ingredients are present in inventory.
3. Deducts ingredients and adds 1 meal item to food inventory.
4. Tracks `craft_items` objective.

## Recipes

> **Source of truth:** `MEAL_RECIPES` in `GameConstants.js`. The table below is a human-readable summary.

| Meal | Ingredients | Buff | Duration |
|------|------------|------|----------|
| `meal_bread` | 2× `food_raw_grain` | +5% Max HP | 1 battle |
| `meal_stew` | 3× `food_raw_grain` + 1× `material_wood` | +10% Max HP, +1 STR | 1 battle |
| `meal_pie` | 4× `food_raw_grain` + 1× `material_stone` | +10% Max HP, +1 DEF | 1 battle |
| `meal_feast` | 5× `food_raw_grain` + 2× `material_wood` + 1× `material_stone` | +15% Max HP, +2 STR, +2 DEF | 2 battles |

**Note:** There is no "Meat" material in the game. All recipes use only `food_raw_grain`, `material_wood`, and `material_stone`.

## Consumption
1. `consumeMeal(mealId)` validates the meal exists in inventory.
2. Deducts 1 meal from inventory.
3. Applies buffs to **all idle heroes** (heroes not on expedition).
4. Buffs of the same stat type replace existing buffs (no stacking).
5. Buffs are stored in `hero.mealBuffs` as `{ stat, value, battlesRemaining }`.
6. `Hero.recalculateStats()` is called to apply buffs to final stats.

## Buff Decay
- After each **combat resolution**, `HeroService.tickAllMealBuffs()` decrements `battlesRemaining` by 1 for all heroes.
- When `battlesRemaining` reaches 0, the buff is removed and stats are recalculated.
- The `nextDay()` cycle also triggers a buff tick as a safety catch-up for any combats that occurred between day advances.

## Code Locations
- `js/engine/GameEngine.js` — `cookMeal()`, `consumeMeal()`
- `js/engine/heroes/services/HeroService.js` — `tickAllMealBuffs()`
- `js/engine/heroes/models/Hero.js` — `recalculateStats()` (applies meal buffs)
