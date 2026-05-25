# Gambit System v1.0 Specification

> **Status:** Final — v1.0 Locked  
> **Authors:** Kimi (technical base & PM review), Gemini / Antigravity (flavor & UX layer)  
> **Sources:** [gambit_system.md](../shared/combat/gambit_system.md), [origins_data.md](../../heroes/origins_data.md), [battle_system.md](../shared/combat/battle_system.md), [expeditions_data.md](../../explore/expeditions_data.md), [enemies_data.md](../shared/combat/enemies_data.md)

---

## 1. Design Principles (v1.0 Lock)

1. **No new buildings.** Test Mode is a UI button, not a structure.
2. **Reuse existing data.** Presets derive from hero build state; Scenario Tests use unlocked region enemy pools.
3. **Zero side-effects.** The simulator deep-clones state — no real items consumed, no XP awarded.
4. **Schema-forward.** AND/OR logic is stubbed in the rule model but has no UI or parser in v1.0.

---

## 2. Locked Feature List

| # | Feature | Owner | Complexity |
|---|---------|-------|------------|
| 1 | 12-slot layout (6 visible + 6 Advanced) | Base spec | Low |
| 2 | Build-Based Presets | Base spec | Low |
| 3 | Configurable Fallback (Slot 0) | Base spec | Low |
| 4 | Flee Conditional (party-wide, 50 %) | Base spec | Medium |
| 5 | Test Mode + Expedition Scenario selection | Base spec | Medium |
| 6 | Live Combat Log (rule-index annotations) | Base spec | Low |
| 7 | Gambit Health Score (0-100) | Base spec | Low |
| 8 | AND/OR schema stub | Base spec | Low |

---

## 3. Data Model Changes

### 3.1 Hero Gambit Container

```javascript
{
  // Existing
  gambits: GambitRule[12],

  // NEW v1.0
  fallbackAction: 'basic_attack' | 'defend',   // Slot 0
  presetId: string | null,                     // Last applied preset
}
```

### 3.2 Gambit Rule Schema (AND/OR Stub)

```javascript
{
  priority: number,          // 1-12, unique per hero
  conditions: [              // v1.0: always length 1, op: 'SINGLE'
    {
      op: 'SINGLE',          // v1.1: 'AND' | 'OR'
      left: Condition,       // v1.0: the only condition
      right: null            // v1.1: second operand
    }
  ],
  action: Action,
  target: Target | null
}
```

> **Migration note:** Existing flat `condition` string migrates to `conditions[0].left`. *Verify current code structure before applying — the existing implementation may already use an object shape.*

### 3.3 Condition Object

```javascript
{
  type: 'enemy_count' | 'enemy_hp' | 'enemy_element' | 'enemy_type' | 'enemy_status'
      | 'ally_hp' | 'ally_mp' | 'self_hp' | 'self_mp'
      | 'ally_status' | 'turn_count' | 'battle_phase' | 'always',
  operator?: '>' | '<' | '=' | '>=',   // only for numeric types
  value: number | string | boolean
}
```

### 3.4 Action Object

```javascript
{
  type: 'skill' | 'spell' | 'item' | 'defend' | 'flee',
  payload: string   // skillId | spellName | itemId | null
}
```

> **Target Resolution:** When the player selects an Action payload (e.g., a specific spell), the UI looks up that payload's innate `targetType` from the skill/spell/item database. This `targetType` determines which `Target` options (§3.5) are available in the dropdown.

### 3.5 Target Object

```javascript
{
  type: 'self' | 'lowest_hp_ally' | 'highest_hp_ally' | 'weakest_ally' | 'strongest_ally'
      | 'lowest_hp_enemy' | 'highest_hp_enemy' | 'weakest_enemy' | 'strongest_enemy'
      | 'all_enemies' | 'all_allies' | 'random_enemy' | 'random_ally'
}
```

> **Note:** `weakest` and `strongest` are defined by the ratio `Attack / Defense` (the same ratio used by the `CombatCalculator`). This allows targeting the most threatening enemy or the most vulnerable ally.

### 3.6 Preset Template Schema

```javascript
{
  id: string,
  name: string,              // Display name (e.g., "The Vanguard's Code")
  description: string,       // Tooltip text (e.g., "Prioritizes survival and heavy strikes.")
  requiredBuild: {
    minFamilies?: number,
    minGlyphs?: number,
    mustHaveHeal?: boolean,
    mustHaveAoE?: boolean
  },
  rules: GambitRule[],       // Partial rules; missing fields left blank for player
  fallbackAction: 'basic_attack' | 'defend'
}
```

**Build-Based Preset Mapping (v1.0)**

| Build State | Preset ID | Name |
|-------------|-----------|------|
| `knownGlyphs.length > 0 && knownFamilies.length === 0` | `preset_disciples_code` | Disciple's Code |
| `knownFamilies.length > 0 && knownGlyphs.length === 0` | `preset_vanguards_code` | Vanguard's Code |
| `knownGlyphs.length > 0 && knownFamilies.length > 0` | `preset_spellblades_code` | Spellblade's Code |

**Disciple's Code (Mage)** — `preset_disciples_code`
- **P1:** `Ally HP < 40%` → **Spell** (player selects heal spell) → **Lowest HP Ally**
- **P2:** `Self MP < 20%` → **Item** (player selects MP potion) → **Self**
- **P3:** `Always` → **Spell** (player selects damage spell) → **Weakest Enemy**

**Vanguard's Code (Warrior)** — `preset_vanguards_code`
- **P1:** `Enemy HP > 70%` → **Skill** (player selects heavy skill) → **Highest HP Enemy**
- **P2:** `Always` → **Skill** (player selects sustainable skill) → **Highest HP Enemy**

**Spellblade's Code (Hybrid)** — `preset_spellblades_code`
- **P1:** `Ally HP < 30%` → **Spell** (player selects heal spell) → **Lowest HP Ally**
- **P2:** `Self MP < 20%` → **Item** (player selects MP potion) → **Self**
- **P3:** `Enemies > 2` → **Skill** (player selects AoE skill) → **All Enemies**
- **P4:** `Always` → **Skill** (player selects damage skill) → **Highest HP Enemy**

> **Note:** `preset_instincts` (Always → Basic Attack) is removed for v1.0. Slot 0 Fallback already provides a default action when no rules match.

### 3.7 Test Mode Result Schema

```javascript
{
  scenarioId: string,        // region ID used (e.g., reg_greenfields)
  runs: number,              // 10
  victories: number,
  defeats: number,
  avgHpRemaining: number,    // % of total party HP
  avgMpRemaining: number,    // % of total party MP
  avgItemsConsumed: { itemId: count },
  healthScore: number,       // 0-100, see §7
  log: CombatLogEntry[],     // annotated with ruleIndex
  timestamp: ISOString
}
```

---

## 4. Feature Specifications

### 4.0 Gambit vs CombatAI Priority

When **Auto-Combat** is enabled, the hero's turn is resolved exclusively by their Gambits:

1. Evaluate Rule 1 → 12 in priority order.
2. If a rule's **condition is met** but its **action cannot execute** (e.g., insufficient MP, item not in inventory), the hero performs their **Slot 0 Fallback** action.
3. If **no rule matches**, the hero performs their **Slot 0 Fallback** action.
4. **CombatAI is never invoked** when Gambits are enabled. This prevents invisible AI overrides that would confuse players who explicitly programmed their rules.
5. **Defeated targets are excluded.** All targeting conditions (Ally HP, Lowest HP Ally, Weakest Enemy, etc.) implicitly filter out entities with HP <= 0. A dead hero or enemy cannot be selected as a target. This prevents corpse-healing deadlocks.

> **Exception:** If the hero has **zero gambit rules** (fresh recruit), CombatAI takes over as a safety net.

### 4.1 Slot Layout (12 Slots)

- **Slots 1-6:** Visible by default in the Gambit panel.
- **Slots 7-12:** Collapsed under an "Advanced" expandable section.
- **Unlock schedule:** Unchanged from base doc (Level 1, 5, 10, 15, 20, 25, 30+).
- **Party size alignment:** Targeting options (Ally HP, Lowest HP Ally, etc.) must iterate over the full combat party array (up to 4 heroes), aligning with engine support for 4-person parties.
- **UI note:** The Advanced section header shows a count of filled advanced slots, e.g. `Advanced (2/6)`.

> **UX Details (Expand/Collapse):** 
> - **Iconography:** A chevron `[▼]` that rotates 180° to `[▲]` when expanded.
> - **Animation:** A smooth CSS slide-down transition (`max-height` ease-in-out) with a slight fade-in for the advanced rows.
> - **Visual Cue:** The advanced section background has a subtle darker tint to differentiate it from the core 6 slots.

### 4.2 Build-Based Presets

**Trigger:** When a hero learns their first skill family (level 1 milestone) or their first glyph (Arcane Sanctum unlock), the Gambit panel shows a one-time toast:

> **Flavor Text:** "Arthur's power grows, but his tactics remain raw. Shall we establish a battle routine?"

**Flow:**
1. Evaluate hero against Preset Template `requiredBuild`.
2. If exactly one preset matches, show **"Apply [Preset Name]?"** with `[Preview]` and `[Dismiss]`.
3. If multiple match, show a carousel of matched presets.
4. Applying a preset fills empty slots; never overwrites existing rules.

### 4.3 Configurable Fallback (Slot 0)

- **Location:** Fixed row above Rule 1 in the UI.
- **Label:** "If no rule matches…"
- **Options:** `Basic Attack` (default), `Defend`.
- **Data model:** `hero.fallbackAction` enum.
- **Exclusion:** `Flee` is **not** an option here to avoid infinite escape loops (see §4.4).

> **UX Details (Slot 0):** 
> - **Visuals:** Pinned to the top with a slightly muted, slate-grey background. 
> - **Iconography:** A small padlock icon 🔒 next to the dropdown to indicate it cannot be deleted or reordered.
> - **Typography:** Italicized label *"If all else fails..."* to emphasize its role as the absolute fallback.

### 4.4 Flee Conditional

- **Availability:** Flee appears in the **Action** dropdown of any rule.
- **Success rate:** Flat 50 % for v1.0 (placeholder; tune in v1.1).
  - **Known Issue:** 50 % is intentionally punishing. Player feedback may require SPD-based scaling before v1.1.
- **Resolution:**
  - **Success:** Combat ends immediately with `winner = 'escape'`. Entire party retreats.
  - **Failure:** Hero's action phase ends. Combat log: `[Hero] attempted to flee but failed!`
- **Restriction:** Cannot be selected as Fallback (Slot 0).

> **Flavor Text (Flee Failures):** 
> - "The enemy cut off Arthur's escape!"
> - "Elara stumbled, halting the retreat!"
> - "There is nowhere to run..."

### 4.5 Test Mode + Scenario Selection

**Entry point:** "Test" button in the Gambit panel, next to "Auto-Combat" toggle.

**Availability:** The Test button is **disabled** if the hero is on an active expedition or village defense (Expedition State Lock per `hero.md`). Test Mode is only available when the hero is idle in the village.

**Scenario Selection Modal:**

```
┌─ Test Gambits ──────────────────────────┐
│ Select Scenario: [Greenfields     ▼]    │
│ Difficulty: Tier 1 (Enemy Lv 1-3)       │
│ Runs: 10                                │
│                                         │
│ [ Start Simulation ]                    │
└─────────────────────────────────────────┘
```

- **Dropdown options:** Unlocked **regions** only (e.g., `reg_greenfields`). Uses the region's procedural enemy pool (from `regions_data.md` or the expedition generator), not just story mission stages.
- **Difficulty display:** Derived from the selected region's base enemy level and tier.
- **Simulation:** Runs 10 fully headless battles using cloned hero state + cloned inventory.

**Simulation Contract (hard rules):**
1. Heroes, enemies, and inventory are **deep-cloned** before the first battle.
2. **Meal buffs** are cloned with their current `battlesRemaining` and tick down normally during simulation. This ensures the test reflects the hero's actual state.
3. **No consumables** are deducted from the real inventory.
4. **No XP** is awarded to real heroes.
5. **No loot** is generated or added to real inventory.
6. **No Hall of Fame stats** are updated.
7. **No Daily Objective progress** is incremented.
8. **Live Combat Log annotations** (rule-index prefixes) are generated for Test Mode only; they do not appear in real combat logs.
9. **Seeded RNG:** Test Mode uses a deterministic seed derived from `hero.uuid + scenarioId + stableHash(gambitRules)` so that identical rules against identical scenarios always produce identical results. Changing any rule or scenario changes the seed. This enables reliable debugging.
10. **Between-battle reset:** After each simulated battle, cloned heroes are fully healed, resurrected if dead, and meal buff counters are reset to their pre-simulation values. This isolates gambit logic from attrition and ensures all 10 runs are independent tests.
11. After the 10th battle, all clones are discarded.

> **UX Details (Simulation Loading):** 
> - **Visual Theme:** A tactical, "mind's eye" aesthetic. The screen dims with a deep indigo overlay. 
> - **Animation:** Ghostly silhouettes of the party flash rapidly against the enemy sprites. A progress bar fills with the text: *"Simulating outcomes... [4/10]"*. 
> - **Audio:** Subtle, sped-up sounds of clashing swords and casting magic.

### 4.6 Live Combat Log

During Test Mode, every log line that results from a gambit action is prefixed with the rule index:

```
[Rule 1] Elara casts "Mom's Hug" on Arthur. (Healed 12 HP)
[Rule 5] Arthur uses Multiple Attack ×4 on Goblin. (48 dmg)
[Fallback] Arthur uses Basic Attack on Goblin. (12 dmg)
```

- **Rule index:** `1-12` for normal rules, `[Fallback]` for Slot 0.
- **Failure annotation:** If a rule's condition was met but the action could not execute (e.g., insufficient MP), log:
  ```
  [Rule 2] CONDITION MET — but Elara lacks MP for "Meteor Strike". Skipped.
  ```

> **Flavor Text (Log Badges):** 
> - **Rule 1-3:** 🟢 `[Rule 1]` (Green badge: High priority execution)
> - **Rule 4-6:** 🟡 `[Rule 4]` (Yellow badge: Mid priority)
> - **Advanced (7-12):** 🟣 `[Rule 7]` (Purple badge: Advanced logic)
> - **Fallback:** 🔘 `[Fallback]` (Grey badge: Routine action)
> - **Skipped:** ❌ (Red 'X' with a strikethrough on the action text)

### 4.7 Gambit Health Score

Calculated client-side after Test Mode completes (or on-demand in the editor):

```javascript
let score = 0;
// Heal coverage (satisfied if rule exists OR hero cannot heal)
if (hasHealRule || !heroCanHeal) score += 20;
// AoE coverage (satisfied if rule exists OR hero cannot AoE)
if (hasAoERule || !heroCanAoE)   score += 20;
// Fallback must always be configured
if (fallbackIsSet)               score += 20;
// Item coverage (satisfied if rule exists OR inventory has zero consumables)
if (hasItemRule || inventory.consumables.length === 0) score += 20;
// Anti-redundancy
if (noIdenticalConditions)       score += 20;
```

> `heroCanHeal` = hero knows Light glyph, has heal spell in Codex, or carries healing consumables.  
> `heroCanAoE` = hero knows Multi glyph, has Cleave skill family, or has an AoE spell.

- **Display:** 0-100 meter in the Test Mode report and as a subtle badge on the Gambit tab.
- **Dual Mode:**
  - **Editor Score:** Calculated from rule coverage alone. Displayed before any Test Mode run.
  - **Tested Score:** Calculated after a Test Mode run; if the simulation had defeats, the score is capped at 79 (Yellow) regardless of coverage, to signal that theory != practice.
- **Thresholds:**
> **Flavor Text (Health Score Thresholds):** 
> - **80-100: Ironclad.** Witch says: *"The threads of fate are woven tight. They will not easily fray."*
> - **50-79: Functional.** Witch says: *"A passable weave. But fate has a way of finding the loose ends..."*
> - **0-49: Fragile.** Witch says: *"Tattered and torn. Send them out like this, and they belong to the grave."*

### 4.8 AND/OR Schema Stub

- **Engine:** The `GambitRule.conditions` array accepts the schema defined in §3.2.
- **v1.0 constraint:** UI emits only `op: 'SINGLE'`. `right` is always `null`.
- **v1.1 unlock:** UI adds an "AND" / "OR" toggle between two condition rows. No migration needed because the schema already supports it.

### 4.9 Target Resolution Negotiation

When a player selects an Action in a Gambit rule, the UI must resolve the valid targets:

1. **Read innate targetType:** Look up the selected skill, spell, or item in the database to retrieve its `targetType` (e.g., `single_enemy`, `all_allies`, `self`).
2. **Filter Target dropdown:** Populate the `Target` dropdown (§3.5) with only compatible values:
   - `single_enemy` → `lowest_hp_enemy`, `highest_hp_enemy`, `weakest_enemy`, `strongest_enemy`, `random_enemy`
   - `enemy_splash` → same as `single_enemy` (splash is automatic on primary target)
   - `all_enemies` → locked to `all_enemies`
   - `single_ally` → `self`, `lowest_hp_ally`, `highest_hp_ally`, `weakest_ally`, `strongest_ally`, `random_ally`
   - `all_allies` → locked to `all_allies`
   - `self` → locked to `self`
   - `none` → Target field is hidden (for Flee)
3. **Lock fixed targets:** If the action has a fixed target (`all_enemies`, `all_allies`, `self`, `none`), the dropdown is disabled and shows a 🔒 lock icon.
4. **Invalidate on change:** If the player changes the Action and the current Target is no longer compatible, clear the Target and require reselection.
5. **Engine validation:** At runtime, if a gambit rule somehow has an incompatible Action-Target pair (e.g., data corruption), the engine treats it as a failed action and falls back to Slot 0.

---

## 5. UI Wireframes

### 5.1 Gambit Panel (Hero Detail)

```
┌─ Hero: Arthur ─────────────────────────┐
│ [Stats] [Equipment] [Skills] [Gambits]  │
│                                         │
│ Gambit Health: [██████░░░░] 62          │
│                                         │
│ Fallback: [Basic Attack ▼]              │
│                                         │
│ 1. [✓] IF Ally HP < 30%               │
│        THEN Spell: "Mom's Hug"          │
│        ON Lowest HP Ally                │
│        [▲] [▼] [✏️] [🗑️]               │
│ ...                                     │
│ 6. [✓] IF Always                      │
│        THEN Skill: Multiple Attack ×4   │
│        ON Highest HP Enemy              │
│                                         │
│ [+ Add Rule]  [Test Gambits] [Presets ▼]│
│                                         │
│ Advanced (1/6) [▼]                     │
│ 7. [✓] IF Self MP < 20%               │
│        THEN Item: MP Potion             │
│        ON Self 🔒                       │
└─────────────────────────────────────────┘

> **Target Lock Example:** Fixed-target actions (e.g., `Defend`, `Flee`, or AoE skills) automatically lock the Target field. The wireframe above shows `ON Self 🔒` for an item with `targetType: 'self'`. The player cannot override this.
```

### 5.2 Test Mode Report

```text
┌─ Test Results: Whispering Forest ──────┐
│                                         │
│  "The threads of fate are woven tight." │
│          — The Witch                    │
│                                         │
│ Runs: 10 | Victories: 8 | Defeats: 2   │
│ Health Score: 62 [██████░░░░] Functional │
│ Avg HP left: 45% | Avg MP left: 30%    │
│ Items used: MP Potion ×12              │
│                                         │
│ [View Live Log]  [Suggest Preset]      │
└─────────────────────────────────────────┘
```

> **UX Details (Report Presentation):**
> - The modal slides up from the bottom with a magical 'whoosh' sound.
> - The Health Score bar animates filling up from zero.
> - If the score is "Fragile" (< 50), the Witch's dialogue text shakes slightly and is tinted red.
> - The "[Suggest Preset]" button opens the Preset carousel with the best-match Build-Based Preset highlighted. It never overwrites existing rules; player must confirm.

---

## 6. Implementation Checklist

- [ ] **Model:** Add `fallbackAction` and `presetId` to Hero schema.
- [ ] **Model:** Migrate flat `condition` to `conditions: [{op:'SINGLE', left: ..., right: null}]`.
- [ ] **Engine:** Implement `GambitEvaluator` priority loop (reuse existing logic, refactor to read new schema).
- [ ] **Engine:** Implement `deepCloneForSimulation()` — heroes, enemies, inventory.
- [ ] **Engine:** Implement `SimulationRunner` (10 battles, aggregate stats).
- [ ] **Engine:** Implement `HealthScoreCalculator` (client-side or engine-side).
- [ ] **Engine:** Implement `PresetApplier` (match build state, fill empty slots).
- [ ] **Engine:** Implement `FleeAction` in `BattleService` (50 % roll, party-wide escape).
- [ ] **UI:** Add Slot 0 fallback selector.
- [ ] **UI:** Add "Test" button + Scenario modal.
- [ ] **UI:** Add Test Mode report modal with Live Log viewer.
- [ ] **UI:** Add Health Score badge to Gambit tab.
- [ ] **UI:** Add Preset toast/carousel on first skill/glyph unlock.
- [ ] **Docs:** Final PM review pass for consistency.

---

## 7. Open Questions / Flavor Layer Assignments

| ID | Question | Resolution (Antigravity/Gemini) |
|----|----------|---------------------------------|
| F1 | Preset display names & lore justification | Renamed to Disciple's, Vanguard's, and Spellblade's Code. |
| F2 | Toast / tutorial text when presets unlock | "Arthur's power grows, but his tactics remain raw. Shall we establish a battle routine?" |
| F3 | Visual theme of Test Mode | Indigo overlay, mind's eye aesthetic, fast-forward silhouettes. |
| F4 | Witch dialogue strings | Implemented with Ironclad/Functional/Fragile tiers. |
| F5 | Color-coding or emoji badges for Live Log | Added priority-based colored badges (Green/Yellow/Purple/Grey). |
| F6 | Failure log variants for Flee | Added "cut off escape", "stumbled", and "nowhere to run" variants. |
| F7 | "Apply Preset Fix" button text | **Rejected.** "Auto-Optimize" overwrites player rules — scope creep and trust destruction. Final: "[Suggest Preset]" opens carousel, never auto-applies. |
| F8 | Test Mode available during expeditions? | **NO.** Expedition State Lock (hero.md) prohibits editing gambits while deployed. Test Mode is idle-heroes only. Player tests with idle heroes to plan for next expedition. |

---

## 8. Changelog from Base Spec

| Change | Rationale |
|--------|-----------|
| Added `fallbackAction` (Slot 0) | Gives players control over the "no match" case without adding new rules. |
| Added `conditions` array with `op` stub | Forward-compatible for AND/OR v1.1; no migration needed later. |
| Added Build-Based Presets | Lowers barrier to entry; derives from existing hero state, not brittle origin mapping. |
| Added Flee as conditional action | Doc already listed it; now scoped with 50 % placeholder and party-wide resolution. |
| Added Test Mode + Scenario Selection | Reuses region enemy pools; no new buildings or enemies. |
| Added Live Combat Log | Reuses existing log system; annotates with rule index for debugging. |
| Added Gambit Health Score | Gives casual players instant feedback; pure client-side math. |
| Excluded Flee from Fallback | Prevents infinite escape loops until flee math is properly designed. |
