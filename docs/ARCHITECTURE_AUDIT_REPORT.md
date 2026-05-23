# RPG Village — Architecture & Code Audit Report

> **Role:** Product Manager + Software Architect  
> **Date:** 2026-05-23  
> **Scope:** All 44 docs, 30 engine files, 14 presentation files, 24 test files  
> **Methodology:** Doc-to-code traceability analysis, architectural pattern review, balance/math verification

---

## Part 1: Product Vision — What This Game Wants To Be

### The Elevator Pitch
**RPG Village** is a *village management + hero progression idle RPG*. The fantasy is **"Civilization with Heroes"**: you start as Arthur alone in the wilderness, build a settlement, recruit a roster of 20-30 heroes, and manage them across expeditions, academy training, village defense, and magic rituals. By Day 100, you are a general managing 4 concurrent expeditions of 4 heroes each.

### The Core Loop (Well-Defined in Docs)
1. **Morning (Player Turn):** Review returned expeditions, reassign heroes, equip gear, compose spells, check skill tier-ups.
2. **Click NEXT DAY.**
3. **Evening (Resolution):** Expeditions fight battles (manual or auto), village defends against raids, construction advances, tavern generates recruits, meal buffs tick down.

### The Three Archetypes (Brilliantly Designed)
| Archetype | Resource | Sustain | Burst | Best For |
|---|---|---|---|---|
| **Warrior** | Stamina (regens 8%/turn) | ♾️ Infinite | Medium | Long fights, marathons |
| **Mage** | MP (limited pool) | ⚠️ Limited | High | Short fights, AoE delete |
| **Hybrid** | Stamina + MP | 🔥 Brief | Extreme | Burst windows (2-4 turns) |

### Hero Scarcity Is The Game
The design intentionally ensures you **never have enough heroes**. At Day 100: 20 heroes, 16 deployed on expeditions, 4 on defense, 2-3 in Academy = almost zero bench. Every decision is "who do I NOT send?"

---

## Part 2: Architecture Assessment

### What Works Well ✅

| Aspect | Assessment |
|---|---|
| **Domain Separation** | `engine/` (pure logic) vs `presentation/` (DOM) is clean and follows DDD principles. |
| **Service Pattern** | Each domain has a service (`HeroService`, `BattleService`, `VillageService`) with clear responsibilities. |
| **Persistence** | Simple `localStorage` prefix system with migration fallbacks for old saves. |
| **Result Pattern** | `Result.ok()` / `Result.fail()` is used consistently for error handling. |
| **I18n** | Modular translation files (EN/ES/CA/EU/GL) with fallback to English. |
| **Test Coverage** | 24 test files covering CombatCalculator, BattleService, HeroService, Gambits, Magic Circle, etc. |
| **Combat Math** | Damage multiplier table, elemental efficiency, evasion formula all match specs exactly. |
| **Equipment System** | Dynamic stat computation from family + material + level + affixes is elegant. |
| **Set Bonuses** | Wooden→Mythril set bonuses are implemented and tested. |
| **Day Cycle** | Consumption → Production → Construction → Growth → Recovery phases are all present. |

### Architectural Debt 🟡

| Issue | Impact |
|---|---|
| **Dual Skill System** | The codebase has TWO competing skill systems coexisting. This is the single biggest architectural risk. |
| **SKILLS_DATA Monolith** | 30+ skills from 4 different systems (physical, magic, support, tricker) crammed into one registry. |
| **Body Inscription Mismatch** | Docs describe a Glyph-based 7-slot Circle. Code implements a simple `skillId` string array. |
| **Missing Stamina Cost Math** | Docs specify `Base + (Tier × N)` formulas. Code uses hardcoded `staminaCost` values from `SKILLS_DATA`. |
| **Gambit System Underbuilt** | Only 5 simple conditions implemented vs 15+ specified. Actions limited to `use_skill`. |

---

## Part 3: Critical Issues (Will Break the Game)

### 🔴 C1: The Dual Skill System Crisis

**The Problem:** Heroes have `hero.skills` (old flat system: `{double_attack: 0, whirlwind: 0}`) AND `hero.techniqueTiers` (new family system: `{multiple_attack: 4, power_strike: 2}`). **Both exist. Both are used. They contradict each other.**

**Evidence:**
- `Hero.learnSkill('double_attack')` adds to `this.skills` — the OLD system.
- `CombatCalculator.calculate()` uses `attacker.techniqueTiers[skillData.family]` — the NEW system.
- `CombatAI.decideAction()` filters `Object.keys(actor.skills)` — the OLD system.
- `Hero.inscribeSkill()` checks `this.skills[skillId]` — the OLD system.

**Why This Breaks Everything:**
1. A hero "learns" `double_attack` (old) but combat damage uses `techniqueTiers.multiple_attack` (new). These are not synchronized.
2. The UI lets players learn/upgrade individual skills from `SKILLS_DATA`, but the docs say heroes should unlock **families** at level milestones.
3. Save migration from old to new is documented in `roadmap.md` but **not implemented in code**.

**The Fix:** 
1. Remove `hero.skills` entirely. Replace with `knownFamilies: []` (max 6).
2. `SKILLS_DATA` should only contain the 6 physical families + basic_attack.
3. Magic spells must be composed via `MagicCircleService`, not learned as skills.
4. Support/healing must be magic-circle-based or removed.
5. Implement the save migration: convert old `skills` → families, refund `skillPoints` as gold, add stamina.

---

### 🔴 C2: SKILLS_DATA Contains Magic, Support, and Tricker Skills

**The Problem:** `GameConstants.js` `SKILLS_DATA` contains:
- Physical: `basic_attack`, `double_attack`, `triple_attack`, `whirlwind`, `blade_dance`, `power_strike`, `shield_bash`, `poison_strike`
- Magic: `small_fire_ball`, `medium_fire_ball`, `meteor`, `small_water_ball`, `blizzard`, `tsunami`, etc.
- Support: `small_heal`, `medium_heal`, `high_heal`, `haste`, `small_group_heal`, etc.
- Tricker: `poison_dart`, `steal`

**Docs Say:**
- `hero_skills_data.md`: "Magic spells have been moved to the Magic Circle System. They are no longer part of the hero skills registry."
- `physical_skill_system.md`: Only 6 physical families exist.

**Why This Breaks Things:**
- `CombatAI` sees heroes have `small_fire_ball` in `skills` and tries to cast it as a physical skill.
- Magic skills in `SKILLS_DATA` have `mpCost` but no `staminaCost`, causing the AI to think they're always affordable.
- The Magic Circle system (`MagicCircleService.compose()`) creates spells dynamically, but `BattleService.executeAction()` looks up `SKILLS_DATA[skillId]` — so Magic Circle spells aren't in `SKILLS_DATA` and will fail.

**The Fix:**
1. Strip `SKILLS_DATA` down to physical families ONLY.
2. Magic spells must be looked up from the hero's `spellCodex`, not `SKILLS_DATA`.
3. `BattleService.executeAction()` needs a dual lookup: `SKILLS_DATA` for physical, `spellCodex` for magic.

---

### 🔴 C3: Body Inscription Is Not What The Docs Describe

**Docs Say (`hybrid_body_inscription.md`):**
- A 7-slot Body Circle composed of Glyphs (Core + Ring 1).
- Every physical skill costs STA + MP.
- Effects: elemental infusion, multi-target, piercing, lifesteal, focus.
- Requires Magic Tier 7 + 12 Skill Tier Points.

**Code Does (`Hero.inscribeSkill()`):**
```javascript
this.bodyInscription.push(skillId); // Just a string array of old skill IDs!
```
- Checks `totalSkillPoints < 12` (but sums `Object.values(this.skills)` — old system).
- Checks `magicTier < 7`.
- `BattleService` checks `actor.bodyInscription.includes(skillId)` and adds 50% of the primary cost as the secondary cost.

**Why This Is Wrong:**
- Inscribing `power_strike` just makes it cost STA + MP. No elemental damage. No multi-target. No visual flair.
- The whole Glyph composition layer for Body Circle is missing.
- The 7-slot limit is enforced, but slots contain `skillId` strings, not Glyphs.

**The Fix:**
1. `bodyInscription` should be a Glyph array: `[{glyphId, slot}]` (7 slots).
2. `BattleService` should read the Body Circle composition to calculate:
   - Elemental bonus damage per hit
   - Multi-target transformation
   - Hybrid MP cost from Glyph potency
3. The inscription UI needs a composer (like Magic Circle but 7 slots, permanent).

---

### 🔴 C4: Skill Points / Family Unlock System Is Wrong

**Docs Say (`physical_skill_system.md`):**
- Max 6 families.
- Unlock at levels: 1, 5, 10, 15, 20, 25.
- At level 1, choose 1 family beyond Basic Attack.

**Code Does (`Hero.js`):**
```javascript
this.maxSkillSlots = Math.min(4 + Math.floor(this.level / 10), 8);
```
- At level 1: 4 slots.
- At level 10: 5 slots.
- At level 40: 8 slots.

**Why This Is Wrong:**
- 8 slots > 6 families. Players can learn more than the design allows.
- No level-gating. A level 1 hero can fill all 4 slots immediately if they have the points.
- The "Skill Point" concept from docs (1 point = 1 family unlock at milestones) is not implemented.

**The Fix:**
```javascript
// Hero.js
getAvailableSkillPoints() {
    const milestones = [1, 5, 10, 15, 20, 25];
    const earned = milestones.filter(m => this.level >= m).length;
    const spent = this.knownFamilies.length - 1; // minus basic_attack
    return Math.max(0, earned - spent);
}
```

---

### 🔴 C5: Gambit System Is a Skeleton

**Docs Say (`gambit_system.md`):**
- 15+ conditions: enemy count, enemy HP %, enemy element, ally status, turn count, boss present, etc.
- 5 actions: Skill (any tier), Spell, Item, Defend, Flee.
- 9 targets: Self, Lowest/Highest HP Ally, Lowest/Highest HP Enemy, Weakest Enemy, etc.
- Max 12 rules. Skip combat unlocks when all 4 heroes have 4+ rules.

**Code Does (`GambitService.js`):**
- 5 conditions: `self_hp_below`, `ally_hp_below`, `self_mp_below`, `self_stamina_below`, `always`.
- 1 action: `use_skill`.
- Basic targeting: lowest HP ally for support, lowest HP enemy for offense.
- No spell support, no item support, no defend, no flee.
- No skip-combat validation.

**Impact:** The gambit system — which the docs call "the endgame of combat strategy" — is barely functional. Auto-combat is essentially "use highest baseMultiplier skill on lowest HP enemy."

**The Fix:**
1. Expand `CONDITION_TYPES` to match docs.
2. Add action types: `use_spell`, `use_item`, `defend`, `flee`.
3. Implement target selection logic for all 9 target types.
4. Add skip-combat requirement check in `GameEngine.skipBattle()`.

---

### 🔴 C6: Magic Circle Missing Most Glyphs

**Docs Say (`magic_circle_system.md`):**
- 6 Core Glyphs: Fire, Water, Wind, Storm, Light, Dark
- 3 Power Glyphs: Potentiate, Focus, Extend
- 8 Effect Glyphs: Multi, Pierce, Venom, Slumber, Aegis, Celerity, Reflect, Leech
- 1 Efficiency Glyph: Streamline

**Code Does (`GameConstants.js` `GLYPH_DATA`):**
- 4 Core: Fire, Water, Wind, Storm (missing Light, Dark)
- 3 Power: `power_plus`, `power_plus2`, `power_plus3` (no Focus, no Extend)
- 2 Effect: `effect_multi`, `effect_repeat` (missing 6 others)
- 1 Efficiency: `efficiency_stream`

**Impact:** Mages have a tiny toolkit. No healing spells (requires Light core + Aegis). No buffs (requires Celerity). No DoT (requires Venom). The "puzzle" of spell composition barely exists.

---

### 🔴 C7: Hall of Fame Titles Are Generic

**Docs Say (`hall_of_fame.md`):** 20+ titles across Level, Combat, Skill, Expedition, and Hybrid categories.

**Code Does (`TitleService.js`):** 8 generic titles with simplified thresholds.

| Doc Title | Requirement | Code Equivalent |
|---|---|---|
| "the Recruit" | Level 5 | ❌ Missing |
| "the Veteran" | Level 15 | ❌ Missing |
| "the Slayer" | 100 enemies | `title_veteran` at 50 |
| "the Reaper" | 1,000 enemies | ❌ Missing |
| "Death Incarnate" | 10,000 enemies | ❌ Missing |
| "the Destroyer" | 100,000 damage | `title_titan` at 1,000 |
| "the Cataclysm" | 1,000,000 damage | ❌ Missing |
| "the Untouchable" | 50 battles without KO | ❌ Missing (no tracking) |
| "the Precise" | 100 crits | ❌ Missing (no tracking) |
| "the Disciplined" | Skill Tier 5 | ❌ Missing |
| "the Master" | Skill Tier 10 | ❌ Missing |
| "the Spellweaver" | 10 spells created | ❌ Missing (no tracking) |
| "the Archmage" | 5 Glyphs at ✦ tier | ❌ Missing (no tracking) |
| "the Explorer" | 10 expeditions | `title_explorer` at 5 |
| "the Flawless" | 0 failed expeditions (min 20) | ❌ Missing |
| "the Inscribed" | Body Inscription unlocked | ❌ Missing |

**Impact:** The dopamine loop of title acquisition is broken. Early-game titles like "the Recruit" at Level 5 are critical for engagement.

---

### 🔴 C8: Missing Critical Lifetime Stats Tracking

The following stats are referenced by docs but **not tracked** in `Hero.lifetimeStats`:
- `criticalHits` — needed for "the Precise"
- `timesKOd` — needed for "the Untouchable" (inverse)
- `totalHealingDone` — needed for support mage identity
- `stagesCleared` — needed for "the Pioneer"
- `regionsExplored` — needed for "the Wanderer"
- `goldEarned` — needed for economy titles
- `skillCasts` — needed for "the Relentless"
- `spellCasts` — needed for "the Spellweaver"
- `trainingDays` — needed for training titles
- `defensesParticipated` — needed for defense titles
- `uniqueSpellsCreated` — needed for "the Spellweaver"
- `glyphsMastered` — needed for "the Archmage"

**Impact:** Titles can't be awarded. The Hall of Fame is just a stat dump, not a progression system.

---

## Part 4: Major Issues (Will Confuse Players)

### 🟡 M1: Season Effects Are Defined But Never Applied

`CalendarService` defines `SEASON_EFFECTS` (Spring +5% growth, Summer +10% farm, Autumn +10% miner, Winter -10% farm) but `VillageService.nextDay()` never calls `calendarService.getSeasonEffects()`. Farm and miner production are flat regardless of season.

---

### 🟡 M2: Stamina Doesn't Restore Between Battles or On New Day

Docs say stamina restores fully between battles and at the village. Code never restores stamina except on `levelUp()`. A warrior who uses 45 STA in a battle enters the next battle with 0 STA.

---

### 🟡 M3: Status Effects "Stun" and "Sleep" Are Not Implemented

`shield_bash` has `effect: 'stun'` and docs describe `sleep` status. But `BattleService._processStatusEffects()` only handles `poison` and `burn`. Stunned enemies still take turns.

---

### 🟡 M4: Phoenix Affix Doesn't Work

`phoenix` affix (once-per-battle survive lethal blow) is parsed in `Hero.recalculateStats()` but `BattleService.executeAction()` never checks `target.hasPhoenix` when `target.hp <= 0`.

---

### 🟡 M5: Academy Teaching Is Instant

Docs say Glyph Academy teaching takes `Base Days = Glyph Tier × 2` with teacher/student bonuses. `AcademyService.teachGlyph()` is instant — no time lock, no hero consumption.

---

### 🟡 M6: Spell Codex Has No Custom Naming

`MagicCircleService.compose()` generates name as `${core.element} Spell`. Docs say players can name spells (e.g., "Inferno's Kiss", "Mom's Hug") and the game auto-generates names from prefix + core + suffix.

---

### 🟡 M7: No Circle Registry (Sealed Names)

Docs say the first hero to create a spell combination "seals" the name globally. Other heroes who create the same composition see " invented by [Hero]". Not implemented.

---

### 🟡 M8: WitchService Is Too Basic

Docs specify 5 dialogue categories based on precise progress thresholds (>50%, 20-50%, <20%, just reached, glyph mastery). `WitchService` uses only 5 coarse categories (`novice`, `awakened`, `seeker`, `practitioner`, `master`) with no math behind them.

---

### 🟡 M9: TrainerService Has No Actual Training

`TrainerService` only generates dialogue. There is no mechanism for heroes to spend time at Training Grounds to accelerate technique tier progression.

---

### 🟡 M10: Expedition Retreat Doesn't Reset Progress

Docs say retiring mid-expedition resets progress to Stage 0. `ExpeditionService.unassignHero()` removes the hero from the expedition but doesn't reset `currentStage`.

---

### 🟡 M11: ShopCatalog File Is Empty/Dummy

`js/engine/shared/data/ShopCatalog.js` exists but `GameEngine.js` doesn't import from it. Shop items are presumably hardcoded in UI or not fully implemented.

---

### 🟡 M12: Combat AI Doesn't Use Technique Tiers

`CombatAI.decideAction()` picks skills from `actor.skills` (old system) sorted by `baseMultiplier`. It never considers using a lower tier of a family to conserve stamina, or the highest tier for burst. The core stamina management puzzle is missing.

---

### 🟡 M13: Missing "Defend" Combat Action

Docs mention Defend (+50% DEF for 1 turn) as a basic action and gambit option. Not in code.

---

### 🟡 M14: Daily Objectives Missing Claim UI

`DailyObjectivesService.claimReward()` exists but is never wired to the UI. The all-completed bonus is auto-granted, but individual objective rewards might not be claimable by players.

---

### 🟡 M15: Missing Building — Arcane Sanctum

`buildings_data.md` defines `arcane_sanctum` (levels 1-4) which unlocks the Glyph Academy. `VillageService` default infrastructure doesn't include it. Players can't build it.

---

## Part 5: Minor Issues / Polish

### 🟢 P1-P10: Quick Wins
1. **No save migration** for old skill system → new families.
2. **Bestiary only tracks IDs**, not kill counts or first encounter dates.
3. **Combat log doesn't show technique tier-ups** — `evolutionResult` from `recordTechniqueUse()` is swallowed.
4. **Hero `status` field** (`resting`/`active`/`training`) is barely used.
5. **Escape consumable** sets `winner = 'escape'` but heroes still get EXP.
6. **Growth chance** is flat 1% (Day ≤100) / 10% (Day >100). Docs imply food surplus should boost it.
7. **Inventory storage limit** is passed as parameter rather than enforced internally.
8. **Equipment model** doesn't store computed stats in `toJSON()` — relies on recompute on load.
9. **Intro dialog** is a 3-slide prologue, not the single "A New Beginning" modal from spec.
10. **Village initialization** matches spec exactly (100g, 30 grain, 20 wood, 10 stone, 2 villagers, Arthur). ✅

---

## Part 6: The Roadmap Gap Analysis

The `roadmap.md` is ambitious and well-written. Here's what's actually implemented vs. planned:

| Feature | Doc Status | Code Status | Gap |
|---|---|---|---|
| Stamina stat | ✅ Defined | ✅ Implemented | — |
| Skill Slot system (6 slots at Lv 5/10/15/20/25/30) | ✅ Defined | 🟡 Partial (8 slots, wrong formula) | Fix formula |
| Family migration | ✅ Defined | ❌ Not implemented | Critical |
| Infinite tier engine | ✅ Defined | ✅ Implemented | — |
| Trainer NPC | ✅ Defined | 🟡 Dialogue only | Add training mechanic |
| Elara (mage hero) | ✅ Defined | 🟡 Random origin possible | Force mage template |
| Magic Circle core | ✅ Defined | 🟡 4 cores, 6 glyphs only | Add missing glyphs |
| Witch's Hut | ✅ Defined | 🟡 Basic dialogue | Add progress math |
| Spell Codex | ✅ Defined | 🟡 No custom naming | Add naming + registry |
| Party size 3/4 | ✅ Defined | ✅ Code supports it | UI may limit to 2 |
| Academy building | ✅ Defined | 🟡 Instant teach | Add time/lock mechanic |
| Village Defense | ✅ Defined | ✅ Implemented | — |
| Body Inscription | ✅ Defined | 🟡 Wrong implementation | Redesign as Glyph circle |
| Astral Plane | ✅ Defined | ❌ Not implemented | Future content |
| Hall of Fame titles | ✅ Defined | 🟡 8 generic titles | Expand to full list |

---

## Part 7: Recommendations — Priority Order

### Phase 0: Fix the Foundation (1-2 sessions)
1. **Resolve the Dual Skill System** — This is the root of most combat bugs.
   - Delete `hero.skills` (old).
   - Implement `knownFamilies: []` (max 6).
   - Clean `SKILLS_DATA` to physical families only.
   - Add save migration.
2. **Fix Skill Point Unlock Formula** — Match docs: 6 families at levels 1/5/10/15/20/25.
3. **Add Missing Stamina Cost Math** — `Base + (Tier × N)` per family.

### Phase 1: Combat Integrity (1 session)
4. **Fix Combat AI** — Use `techniqueTiers` to pick skill tier (conserve vs. burst).
5. **Implement Stun/Sleep** — Add to `_processStatusEffects()`.
6. **Fix Phoenix Affix** — Check `hasPhoenix` on lethal damage.
7. **Restore Stamina** — Full restore between battles and on `nextDay()` for idle heroes.

### Phase 2: Magic System (1-2 sessions)
8. **Add Missing Glyphs** — Light, Dark cores; Focus, Extend; 6 missing effect glyphs.
9. **Fix Magic Spell Lookup** — `BattleService` should read from `spellCodex`, not `SKILLS_DATA`.
10. **Add Spell Naming** — Custom + auto-generated names.
11. **Add Circle Registry** — Seal names on first creation.

### Phase 3: Hybrid & Endgame (1 session)
12. **Redesign Body Inscription** — 7-slot Glyph composer, elemental infusion, multi-target.
13. **Expand Gambits** — Add conditions, actions (spell/item/defend/flee), targets.
14. **Add Skip Combat Requirements** — All 4 heroes need 4+ gambits.

### Phase 4: Progression & Polish (1 session)
15. **Expand Hall of Fame** — Add all 20+ titles, track missing lifetime stats.
16. **Fix Witch/Trainer** — Progress-based dialogue, actual training mechanics.
17. **Add Arcane Sanctum Building** — Unlock Glyph Academy.
18. **Apply Season Effects** — Hook into `nextDay()` production.
19. **Fix Academy Time** — Teaching consumes heroes for multiple days.

---

## Appendix: Math Verification

| Formula | Doc Value | Code Value | Match? |
|---|---|---|---|
| Damage multiplier R≥5 | 1.0 | 1.0 | ✅ |
| Damage multiplier R<1 | R × 0.5 | R × 0.5 | ✅ |
| Elemental strong | 1.5× | 1.5× | ✅ |
| Elemental weak | 0.5× | 0.5× | ✅ |
| Evasion R≤1 | max(0, (R-0.5)×20) | Same | ✅ |
| Evasion R>1 | 10 + R×10 | Same | ✅ |
| Crit damage | 150% | 150% | ✅ |
| Equipment upgrade mult | 1.1^level | 1.1^level | ✅ |
| Farm production | +4 grain/level | 4 × level | ✅ |
| Miner chance | 20% | 0.20 | ✅ |
| Infirmary heal | +20% base, +10%/level | 0.20 + (level × 0.10) | ✅ |
| Training Grounds XP | +5%/level | 0.05 × level | ✅ |
| Tavern recruit interval | 5-7 days | 5 + random(0-2) | ✅ |
| Tavern cost | 100 × 1.2^n | 100 × 1.2^heroCount | ✅ |
| Housing max pop | L1=2, L2=5, L3=10 | L1=3, L2=10, L3=20 | ⚠️ Slight mismatch |
| XP to level | L × 20 | L × 20 | ✅ |
| Level up HP/MP | +5 HP, +2 MP | +5 HP, +2 MP | ✅ |
| Stat points per level | 2-3 | 2 (3 at multiples of 5) | ✅ |
| Technique tier threshold | 100 × 3^(N-2) | Same | ✅ |
| Magic tier thresholds | 500, 1300, 2500... | Same | ✅ |

**Math is solid where implemented.** The issues are architectural and feature-completeness, not formula errors.

---

*Report compiled by exhaustive doc-to-code traceability analysis. Every claim is verifiable by grepping the referenced files.*
