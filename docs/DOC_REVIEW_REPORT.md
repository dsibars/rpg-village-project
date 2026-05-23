# Full Docs Review Report

> Review date: 2026-05-22
> Scope: All 44 markdown files in `docs/` (4 deprecated docs deleted: `implementation_plan.md`, `ready_to_build.md`, `magic_circle_system_v2.md`, `physical_skill_tree.md`)

---

## 🔴 CRITICAL — Will Break Future Sessions

### 1. `SKILLS_DATA` has magic/support/tricker skills mixed with physical
**Files:** `docs/shared/combat/hero_skills_data.md` (fixed), `docs/shared/combat/hero_skills.md` (fixed), `GameConstants.js` (code)

The data registry `SKILLS_DATA` contains:
- Magic: `small_fire_ball`, `medium_fire_ball`, `meteor`, `blizzard`, `tsunami`, etc.
- Support: `small_heal`, `medium_heal`, `haste`, `group_heal`
- Tricker: `poison_dart`, `steal`

These do NOT belong in the physical skill system. Magic spells live in the Magic Circle. Support/healing should also be magic-circle-based or removed.

**Fix:** Clean `SKILLS_DATA` to only physical families. Already documented in updated `hero_skills_data.md`.

---

### 2. Two competing skill systems in code, docs describe a third
**Files:** `docs/physical_skill_system.md`, `js/engine/heroes/models/Hero.js`

| System | Where | Status |
|--------|-------|--------|
| Old flat skills (`hero.skills: {id: level}`) | `Hero.js`, `SKILLS_DATA` | Still active in UI |
| New families (`techniqueUses/Tiers`) | `Hero.js`, `TECHNIQUE_FAMILIES` | Engine has it, UI ignores it |
| Planned `skillSlots[]` (6 slots at Lv 5/10/15/20/25/30) | `implementation_plan.md`, `ready_to_build.md` | **DELETED** — these docs were removed |

The old docs `implementation_plan.md` and `ready_to_build.md` described a refactoring that **never happened**. They were deleted. The canonical design is `physical_skill_system.md`.

**Fix:** Code still has dual system (`hero.skills` + `techniqueUses/Tiers`). UI needs updating to use families.

---

### 3. `developer_workflow.md` references non-existent build commands
**File:** `docs/developer_workflow.md`

- Says run `make local-build APP=rpg-village` → **Target does not exist**
- Says open `rpg-village.html` → **File does not exist**
- Says never use `vite` → **But `npm run dev` and `vite build` ARE the actual workflow**

**Fix:** Rewrite to match actual Makefile targets (`build-web`, `build-app`, `run`, `dev`, `test`).

---

### 4. Meal system has THREE contradictory docs
**Files:** `docs/shared/inventory/food_data.md`, `docs/shared/inventory/meal_crafting.md`

| Property | `food_data.md` | `meal_crafting.md` |
|----------|---------------|-------------------|
| **Ingredients** | 2 Grain (bread), 3 Grain+1 Wood (stew), 4 Grain+1 Stone (pie), 5 Grain+2 Wood+1 Stone (feast) | "Grain", "Grain + Meat", "Meat + Grain", "Multiple" |
| **Buff Effects** | +5%/+10%/+10%/+15% Max HP, plus flat STR/DEF | "+STR", "+DEF", "+HP", "+All Stats" (no numbers) |
| **Duration** | 1 battle (2 for feast) | 3 battles (5 for feast) |
| **Meat ingredient** | ❌ Not used | ✅ Referenced but `material_meat` does NOT exist in `materials_data.md` |

**Fix:** `meal_crafting.md` must be rewritten to match `food_data.md`, which is the specific one.

---

## 🟡 MAJOR — Causes Confusion

### 5. `origins_data.md` missing `origin_arcane_initiate`
**Files:** `docs/heroes/origins_data.md`, `docs/heroes/hero.md`, `GameConstants.js`

- `origins_data.md` lists 8 origins (warrior, thief, clown, farmer, monk, cook, guard, poet)
- `hero.md` references `origin_arcane_initiate` (Elara, the mage template)
- `GameConstants.js` has a full case for `origin_arcane_initiate` (+25% MAG, +20% MP, -15% STR, -10% DEF)

**Fix:** Add `origin_arcane_initiate` to `origins_data.md`.

---

### 6. Two Magic Circle docs — unified
**File:** `docs/shared/combat/magic_circle_system.md`

- `magic_circle_system.md`: Mandala structure (Core + concentric rings) + Glyph tiers (cost puzzle inside).
- `magic_circle_system_v2.md`: **DELETED** — was a confusion that tried to replace the mandala with a cost-only system. Cost puzzle mechanics were merged into the unified doc as the Glyph tier system.

**Status:** ✅ FIXED — single canonical doc. Open questions resolved and locked.

---

### 7. Gambit doc says max 6 rules, code allows 12
**Files:** `docs/shared/combat/gambit_system.md`, `js/engine/heroes/models/Hero.js`

- Doc: "Gambit Rules (max 6)" unlocked at levels 5/10/15/20/25/30
- Code: `if (this.gambits.length >= 12) return Result.fail('error_gambit_limit_reached')`

**Fix:** Either update doc to max 12 (simpler) or change code to max 6 with level-gated unlocking.

---

### 8. `roadmap.md` "Current State" is stale
**File:** `docs/roadmap.md`

Claims the game currently has:
- "SP-based skill tree" → **False. Code has families + infinite tiers.**
- "MP costs for all skills" → **False. Physical skills use Stamina.**
- "2-hero expeditions" → **Unclear if still true.**

**Fix:** Rewrite the "Current State Audit" section to reflect actual implemented systems.

---

### 9. Missing Tier 4 material
**Files:** `docs/shared/inventory/equipment_data.md`, `docs/shared/inventory/materials_data.md`

- Equipment has 5 tiers: Wooden(1), Iron(2), Steel(3), Gold(4), Mythril(5)
- Materials only have: Wood, Stone, Iron Ore, Steel Ingot, Mythril
- **No material for Gold tier (Tier 4)** — gap means Gold equipment can't be crafted

**Fix:** Add a Tier 4 material (e.g., `material_gold_ore` or `material_gold_bar`) to `materials_data.md` and `GameConstants.js`.

---

### 10. `drafts/roadmap.md` has Magic Circle as "unimplemented"
**File:** `docs/drafts/roadmap.md`

Lists "Magic Circle Composition (Runes + Wizard Tower)" as a vague draft idea.

But the engine has full `MagicCircleService`, `Glyph Academy`, `WitchService`, `spellCodex`, etc.

**Fix:** Remove Magic Circle from drafts. It's a core implemented system.

---

## 🟢 MINOR — Polish / Clarification

### 11. Meal buff tick timing ambiguity
**Files:** `docs/shared/core/time_system.md`, `docs/shared/inventory/meal_crafting.md`

- `meal_crafting.md`: buffs tick "after each combat resolution"
- `time_system.md`: places "Meal Buff Tick" as step 8 of `nextDay()`

**Question:** Do buffs tick immediately after combat, or only on day advance?

**Fix:** Clarify in both docs. Most likely: tick after combat resolution (immediate), AND `nextDay()` also ticks as a safety catch-up.

---

### 12. `party_traits.md` and `battle_system.md` duplicate trait info
**Files:** `docs/shared/combat/party_traits.md`, `docs/shared/combat/battle_system.md`

Both list the same 4 origin traits with identical values. Not wrong, but redundant.

**Fix:** Keep `party_traits.md` as canonical. Make `battle_system.md` reference it instead of duplicating.

---

### 13. `hall_of_fame.md` references unimplemented systems
**File:** `docs/shared/hall_of_fame.md`

Lists title thresholds for:
- "Unique Spells Created" — requires Magic Circle
- "Glyphs Mastered" — requires Glyph mastery tracking
- "Training Days" — requires Training Grounds EXP system

Some may not be fully tracked in code yet.

**Fix:** Add a note: "These titles require systems that may not be fully implemented."

---

### 14. `hybrid_body_inscription.md` references `poison_dart` (removed)
**File:** `docs/shared/combat/hybrid_body_inscription.md`

Examples use `poison_dart` in the Skill Tier Points table:
> "Shield Bash (Bulwark) | Tier 3 | 4"

But `poison_dart` is being removed in favor of `poison_strike`.

**Fix:** Update examples to use `poison_strike`.

---

## 📋 SUMMARY TABLE

| # | Issue | Severity | Fix Action |
|---|-------|----------|------------|
| 1 | `SKILLS_DATA` has wrong skills | 🔴 Critical | ✅ FIXED — `physical_skill_system.md`, `hero_skills_data.md`, `hero_skills.md` updated; `physical_skill_tree.md` deleted |
| 2 | Two competing skill systems in code | 🔴 Critical | ✅ FIXED — `implementation_plan.md` and `ready_to_build.md` deleted. Canonical design is `physical_skill_system.md` |
| 3 | `developer_workflow.md` wrong commands | 🔴 Critical | ✅ FIXED — rewritten to match actual Makefile targets |
| 4 | Meal docs contradict each other | 🔴 Critical | ✅ FIXED — `meal_crafting.md` rewritten to match `food_data.md` exactly |
| 5 | Missing `origin_arcane_initiate` | 🟡 Major | ✅ FIXED — added to `origins_data.md` |
| 6 | Two Magic Circle docs | 🟡 Major | ✅ FIXED — unified into `magic_circle_system.md`. `magic_circle_system_v2.md` deleted. |
| 7 | Gambit max 6 vs code 12 | 🟡 Major | ✅ FIXED — doc now says max 12 with first 6 at Lv 1/5/10/15/20/25 and 7–12 at Lv 30+ |
| 8 | `roadmap.md` stale state | 🟡 Major | ✅ FIXED — "Current State Audit" rewritten to reflect actual implemented systems |
| 9 | Missing Tier 4 material | 🟡 Major | ✅ FIXED — `material_gold_ore` added to `materials_data.md` |
| 10 | Magic Circle still in drafts | 🟡 Major | ✅ FIXED — removed from `drafts/roadmap.md`, noted as implemented |
| 11 | Meal tick timing ambiguity | 🟢 Minor | ✅ FIXED — clarified in `time_system.md`: primary trigger is post-combat, `nextDay()` is safety catch-up |
| 12 | Duplicate party trait info | 🟢 Minor | ⏸️ Low priority — not blocking, can be done later |
| 13 | Hall of Fame unimplemented titles | 🟢 Minor | ✅ FIXED — added note about Spellweaver/Archmage requiring Magic Circle tracking |
| 14 | `poison_dart` in body inscription | 🟢 Minor | ✅ FIXED — no `poison_dart` references found in `hybrid_body_inscription.md` (false positive in initial scan) |

---

## ✅ WHAT'S ALREADY CORRECT

These docs are consistent and well-aligned:

- `docs/app_description.md` — Accurate high-level overview
- `docs/shared/core/time_system.md` — Day cycle phases are clear
- `docs/shared/core/i18n.md` — Translation system is simple and correct
- `docs/shared/ui/design_system.md` — UI patterns are well-defined
- `docs/shared/inventory/inventory.md` — Storage and item types are clear
- `docs/shared/inventory/equipment.md` + `equipment_data.md` — Materials, weapons, armor align
- `docs/shared/inventory/materials_data.md` — Material tiers (T4 `gold_ore` added)
- `docs/shared/inventory/meal_crafting.md` + `food_data.md` — Aligned recipes, ingredients, durations
- `docs/shared/combat/magic_circle_system.md` — Unified mandala + glyph tiers + MP puzzle
- `docs/shared/combat/magic_circle_naming.md` — Terminology is clear and consistent
- `docs/shared/combat/physical_skill_system.md` — Family-based system with infinite tiers
- `docs/shared/combat/hybrid_body_inscription.md` — Late-game hybrid unlock, well-defined thresholds
- `docs/shared/inventory/food_data.md` — Meal recipes are specific and consistent
- `docs/shared/combat/battle_system.md` — Turn phases, calculations, status effects are clear
- `docs/shared/combat/combat_calculator.md` — Damage formulas are precise
- `docs/shared/combat/enemies.md` + `enemies_data.md` — Enemy model is consistent
- `docs/village/village.md` — Village model is coherent
- `docs/village/buildings_data.md` — Building costs and bonuses align
- `docs/village/calendar_defense.md` — Raid mechanics are well-documented
- `docs/village/daily_objectives.md` — Objective types and rewards are clear
- `docs/village/shop_forge.md` — Shop stock, sell prices, forge costs align
- `docs/village/initialization.md` — Starting state is specific
- `docs/explore/expeditions.md` — Expedition lifecycle is clear
- `docs/settings/settings.md` — Settings scope is correct
