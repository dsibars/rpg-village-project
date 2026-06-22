# Implementation Plan 6: Combat Balance Lab

> **Phase:** 6 — Combat Balance Lab (Developer Tool)
>
> **Objective:** Build an engine-only combat simulation harness that can run hundreds of combats across defined scenarios, assert expected behaviors, and produce a human-readable report. This turns combat tuning from manual playtest iteration into a data-driven, reproducible process.
>
> **Estimated Effort:** 3–4 sessions (increased because of the comprehensive test matrix)
>
> **Risk:** Low-Medium — adds new scripts/tests, does not touch live game balance yet
>
> **Dependencies:** Existing combat engine (`BattleService`, `CombatCalculator`, `Hero`, `ExpeditionService`, `RegionService`, `LootService`) must be stable enough to invoke programmatically. No UI work required.

---

## 0. Design Principles

1. **Measure first, fix second.** The lab only reports; it does not change combat numbers.
2. **Deterministic where possible.** Scenarios can specify an RNG seed so flaky failures are reproducible.
3. **Generated, not hand-written.** High-dimensional systems (magic, equipment, skills) are covered by parametric generators, not 500 manual files.
4. **Fast by default, exhaustive on demand.** Priority scenarios run in seconds; full matrix runs only when requested.
5. **Self-documenting failures.** A failed assertion must include the exact combat log that produced it.
6. **Spec-as-test.** The test matrix in Section 4 is a living specification. If a cell has no passing scenario, the subsystem is untrusted.

---

## 1. Current State

### What exists

- A log-driven combat engine: `BattleService` produces a structured `combatLog` with every action, damage roll, skill use, spell cast, and status effect tick.
- Engine-only invocation: `GameEngine.resolveBattle(party, encounter)` and lower-level services can run without rendering.
- State injection: `GameEngine` and services allow constructing heroes, enemies, and encounters directly for tests and screenshots.
- Existing tests: `tests/unit/shared/combat/` and `tests/behaviour/combat/` cover some basic combat flows.

### The gap

Combat balance is currently validated by manual playtests. This is slow and misses regressions. Several suspected issues already exist:

- Spell damage does not scale with `magicPower`.
- Healing potions use flat amounts instead of percentages.
- Enemy stats scale faster than hero damage.
- Gambit conditions (`enemy_element`, `enemy_type`, `battle_phase`) are declared but not evaluated.
- Status effects, AoE targeting, enemy equipment, and party traits are hard to verify end-to-end.

There is no single place to define a combat scenario, run it N times, and assert *"an Arcane Initiate with 30 MagicPower should deal ~X damage with a tier-3 fire spell."*

---

## 2. Target Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  Input: Scenario Files (JSON/JS) + Generators                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ {                                                              │  │
│  │   id: "mage_scaling_tier3_fire",                               │  │
│  │   party: [{ origin, level, stats, equipment, spells }],       │  │
│  │   encounter: { region, enemyIds, level },                      │  │
│  │   iterations: 100,                                             │  │
│  │   seed: 12345,                                                 │  │
│  │   assertions: [                                                │  │
│  │     { metric: "damage.spell.Fireball.avgPerHit", expectedMin: 60, expectedMax: 90 }, │  │
│  │     { metric: "winRate", expectedMin: 0.75 }                   │  │
│  │   ]                                                            │  │
│  │ }                                                              │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Combat Balance Lab Runner                                          │
│  scripts/combat-lab/runner.mjs                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ 1. Load scenario or generate matrix                            │  │
│  │ 2. Build party (Hero instances)                                │  │
│  │ 3. Build encounter (Enemy instances)                           │  │
│  │ 4. Run BattleService N times                                   │  │
│  │ 5. Collect combatLog metrics                                   │  │
│  │ 6. Apply assertions                                            │  │
│  │ 7. Emit result (pass/fail + logs)                              │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Output: Report (Markdown)                                          │
│  scripts/combat-lab/output/report.md                                │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ - Summary: total scenarios, pass/fail counts                   │  │
│  │ - Per-scenario: win rate, avg turns, damage breakdown          │  │
│  │ - Failed assertions with expected vs actual                    │  │
│  │ - Links to full combat logs for debugging                      │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### Responsibilities

| Component | Responsibility |
|-----------|----------------|
| **Scenario Builder** (`scenarios/builder.mjs`) | Helper functions to create parties, enemies, and encounters from concise scenario definitions. |
| **Matrix Generators** (`scenarios/generators/*.mjs`) | Parametric generators that produce many scenarios from a compact definition (e.g., every element × target type × magic tier). |
| **Combat Runner** (`runner.mjs`) | Orchestrates N iterations, collects metrics, applies assertions. |
| **Metrics Parser** (`metrics.mjs`) | Reads combat logs and computes statistics: damage by source, win rate, turns, healing, status uptime, etc. |
| **Assertion Engine** (`assertions.mjs`) | Compares metrics against expected ranges; supports min/max/win-rate/turn-count assertions. |
| **Report Generator** (`report.mjs`) | Produces a Markdown report with tables and links to sample logs. |
| **Scenario Catalog** (`scenarios/*.mjs`) | Declarative and generated combat scenarios covering all combat dimensions. |

---

## 3. Scope

### In Scope

- Create `scripts/combat-lab/` directory with runner, metrics parser, assertion engine, report generator, and scenario generators.
- Define a scenario JSON/JS schema for declaring parties, encounters, iterations, and assertions.
- Build helper utilities to construct heroes and enemies from scenario definitions without going through the full game loop.
- Implement metrics extraction from `combatLog`.
- Implement assertion engine with range-based checks.
- Implement parametric scenario generators for high-dimensional systems (magic circle, equipment, skills).
- Create a comprehensive scenario catalog based on the test matrix in Section 4.
- Add `npm run combat:lab` script.
- Add regression behaviour tests for the highest-priority scenarios.
- Write a short developer doc in `docs/shared/combat/combat_balance_lab.md`.

### Out of Scope

- No changes to combat balance numbers yet. This tool only measures and reports.
- No UI for the lab. It is a command-line/developer tool.
- No integration with screenshot automation.
- **Hybrid Body Inscription** is design-phase only (`docs/shared/combat/hybrid_body_inscription.md` says "Not yet implemented"). Include placeholder scenarios in the matrix, but mark them as skipped/pending until implemented.
- No save-slot or persistence involvement.

---

## 4. Combat Test Matrix

This matrix is the core deliverable of the planning phase. It ensures no combat subsystem is accidentally skipped during implementation. Each cell becomes one or more scenarios.

### Matrix Coverage Summary

| Category | Items | Coverage Strategy |
|----------|-------|-------------------|
| Hero fundamentals | 9 | Hand-written priority scenarios + stat sweep generator. |
| Equipment | 6 | `equipment.generator.mjs` (weapon × material × armor). |
| Physical skills | 9 | `physicalSkill.generator.mjs` (family × tier × STR). |
| Magic Circle / spells | 12 | `magicCircle.generator.mjs` (element × target × tier × MAG). |
| Status effects | 7 | `statusEffect.generator.mjs` + priority scenarios for stun/poison. |
| Gambits | 8 | `gambit.generator.mjs` (condition × action). |
| Enemies & encounters | 7 | `enemyScaling.generator.mjs` (enemy × level × size). |
| Party composition | 4 | `partyComposition.generator.mjs`. |
| Consumables | 5 | `consumable.generator.mjs` + priority potion scenarios. |
| Combat meta | 5 | Hand-written benchmark scenarios. |
| Hybrid Body Inscription | 5 | Defined but skipped until implemented. |
| **Total** | **~77** | Mix of priority scenarios and generated matrices. |

### 4.1 Hero Fundamentals

| # | Area | What to Verify | Sample Scenarios |
|---|------|----------------|------------------|
| H.1 | **Level / base stats** | HP/MP/stamina grow as designed; low-level hero can kill a same-level enemy in reasonable turns. | Lv 1 warrior vs. Lv 1 goblin; Lv 10 vs. Lv 10; Lv 20 vs. Lv 20. |
| H.2 | **Origins** | Each origin grants its stated combat bonuses (HP, MP, STR, MAG, SPD, crit, evasion). | `origin_warrior`, `origin_arcane_initiate`, `origin_thief`, `origin_clown`, `origin_farmer`, `origin_monk`, `origin_cook`, `origin_guard`, `origin_poet` in identical gear. |
| H.3 | **Stat allocation** | Investing points in STR/DEF/MAG/SPD changes damage, mitigation, and turn order. | Same hero with 10 extra STR vs. 10 extra MAG vs. 10 extra SPD. |
| H.4 | **Stamina** | Max stamina and regen match formula; heroes can’t spam high-tier skills indefinitely. | Warrior using only Power Strike until empty; verify fallback to basic attack. |
| H.5 | **Fatigue** | Fatigue thresholds reduce stats as designed; recovery works between battles. | Hero at 0, 50, 75 fatigue in otherwise identical fight. |
| H.6 | **Death / defeat** | Hero at 0 HP is removed; party wipe ends combat; XP/loot handled correctly. | Single hero vs. impossible encounter; 4 heroes with one death. |
| H.7 | **Critical hits** | `critChanceBonus` affects crit rate; crits deal 150% damage. | High-crit `origin_clown` vs. low-crit `origin_warrior` against same enemy. |
| H.8 | **Evasion** | Speed ratio affects hit chance; very fast enemies can evade slow attackers. | Fast enemy vs. slow warrior; slow enemy vs. fast thief. |
| H.9 | **Turn order** | Initiative sorted by speed; haste changes order. | Two heroes with different speeds; haste application reordering. |

### 4.2 Equipment

| # | Area | What to Verify | Sample Scenarios |
|---|------|----------------|------------------|
| E.1 | **Weapon scaling** | Weapon family (dagger/broadsword/axe/wand) and material tier affect damage. | Wooden broadsword vs. iron broadsword vs. mythril broadsword. |
| E.2 | **Weapon speed trade-offs** | Dagger is weaker but faster; axe is stronger but slower. | Same STR hero with dagger/axe/broadsword. |
| E.3 | **Armor mitigation** | Plate reduces physical damage more than robes; robes boost MP/MAG. | Same enemy physical attack vs. plate/leather/robes wearer. |
| E.4 | **Equipment affixes** | Vampire (lifesteal) and phoenix (survive death) work in combat. | Vampire weapon vs. no affix; phoenix armor lethal blow. |
| E.5 | **Enemy equipment** | Enemies with equipment have stats adjusted correctly. | Same enemy template naked vs. equipped. |
| E.6 | **Level requirements** | Equipping above-level gear is prevented or penalized. | Hero level 1 with level-5 mythril weapon. |

### 4.3 Physical Skills

| # | Area | What to Verify | Sample Scenarios |
|---|------|----------------|------------------|
| P.1 | **Basic attack** | Always available, 0 stamina, 1.0× STR. | Warrior with 0 STA still fights. |
| P.2 | **Multiple Attack scaling** | Tier adds hits; total damage grows; per-hit decay applies. | Tier 1, 5, 10 Multiple Attack vs. same enemy. |
| P.3 | **Power Strike scaling** | Tier adds 0.3× STR multiplier. | Tier 1, 5, 10 Power Strike average damage. |
| P.4 | **Cleave / splash** | Cleave hits adjacent/all enemies; splash damage falloff applies. | 3-enemy encounter with cleave user. |
| P.5 | **Shield Bash stun** | Stun chance scales with tier; stunned enemy skips turn. | Many shield bash uses; measure stun uptime. |
| P.6 | **Poison Strike DoT** | Poison applied and ticks for % max HP. | Poison strike once then wait. |
| P.7 | **Plunder loot** | Reduced damage but loot events fire. | Plunder user vs. same enemy; count loot events. |
| P.8 | **Skill stamina costs** | Cost formula matches docs; tier 7 costs align with philosophy. | Each family at tiers 1/5/10; verify STA cost. |
| P.9 | **Skill usage → tier progress** | Using a family advances its hidden use counter. | Use Multiple Attack 100 times; verify tier-up. |

### 4.4 Magic Circle / Spells

| # | Area | What to Verify | Sample Scenarios |
|---|------|----------------|------------------|
| M.1 | **Core element damage** | Each element deals base damage; elemental weakness/strong applies (+50% / -50%). | Fire core vs. wind enemy (strong) and water enemy (weak). |
| M.2 | **magicPower scaling** | Spell damage scales with hero MAG / magicPower. | `origin_arcane_initiate` with 10 MAG vs. 30 MAG vs. 60 MAG casting same spell. |
| M.3 | **Glyph tier scaling** | Higher-tier glyphs increase effect and MP cost. | Same spell with Tier 1 vs. Tier 4 Potentiate. |
| M.4 | **Single-target spells** | Hit exactly one enemy. | 3-enemy encounter, single-target fire. |
| M.5 | **All-enemies spells** | Hit every living enemy; damage per target correct. | 3-enemy encounter, Multi glyph + fire core. |
| M.6 | **Ally-target spells** | Heal/haste target allies correctly, not enemies. | Wounded ally healed; ally gains haste. |
| M.7 | **Self-target spells** | Self-buffs/heals work. | `origin_arcane_initiate` casting self-haste or self-heal. |
| M.8 | **MP cost and drain** | MP cost formula correct; mage becomes drained after big spell. | 25-slot spell cost check; Arcane Initiate can’t cast without MP. |
| M.9 | **Magic Tier unlocks slots** | Tier 1 = 1 slot; Tier 7 = 7 slots; Tier 8 adds Ring 2. | Compose spells at different magic tiers. |
| M.10 | **Insight gain** | Casting spells grants hidden insight; tier-ups unlock slots. | Cast 500 spells; verify magic tier increase. |
| M.11 | **Elemental cycle** | Fire > Wind > Storm > Water > Fire cycle applies. Earth is neutral vs. all non-earth elements. | Fire vs. wind (strong), water vs. fire (strong), fire vs. water (weak), earth vs. any (neutral). |
| M.12 | **Support glyphs** | Aegis, Multi, Pierce, Lifesteal, Focus glyphs modify spells as designed. | Spell with and without each support glyph. |

### 4.5 Status Effects

| # | Area | What to Verify | Sample Scenarios |
|---|------|----------------|------------------|
| S.1 | **Poison tick** | Deals 5% max HP per turn; duration expires. | Apply poison; count ticks and total damage. |
| S.2 | **Burn tick** | Same as poison but fire element. | Apply burn; verify tick damage. |
| S.3 | **Stun / sleep skip** | Afflicted entity skips action phase. | Stunned enemy takes 0 actions next turn. |
| S.4 | **Haste** | +50% speed for 3 turns; affects initiative and evasion. | Hasted hero acts earlier and dodges more. |
| S.5 | **Buff/debuff stacking** | Multiple effects coexist without overwriting incorrectly. | Hero with haste + armor buff. |
| S.6 | **Death by status tick** | Poison/burn can kill at status phase. | Enemy with 5% HP poisoned. |
| S.7 | **Cleansing / resistance** | If cleanses/resistances exist, verify them. | Hero with poison resistance taking reduced tick. |

### 4.6 Gambits

| # | Area | What to Verify | Sample Scenarios |
|---|------|----------------|------------------|
| G.1 | **ally_hp condition** | Heal when ally below threshold. | Ally at 20% HP; healer gambit fires. |
| G.2 | **enemy_hp condition** | Execute when enemy below threshold. | Enemy at 10% HP; warrior gambit fires. |
| G.3 | **enemy_element condition** | Use correct element against enemy weakness. | Enemy is water; gambit casts fire. |
| G.4 | **enemy_type condition** | Different action vs. `beast`/`humanoid`/`undead`/`elemental`/`dragon` or `isBoss`. | Boss present; gambit switches to Power Strike. |
| G.5 | **battle_phase condition** | Different action early/late in combat. | First 3 turns vs. after turn 10. |
| G.6 | **Gambit priority order** | Higher-priority gambits override lower ones. | Two matching conditions; only top fires. |
| G.7 | **MP/STA awareness** | Gambit selects action hero can afford. | Mage out of MP falls back to basic attack or item. |
| G.8 | **Target selection** | Heal lowest ally, attack lowest enemy, etc. | Multiple wounded allies; lowest is healed. |

### 4.7 Enemies & Encounters

| # | Area | What to Verify | Sample Scenarios |
|---|------|----------------|------------------|
| X.1 | **Enemy stats by level** | HP/STR/DEF/SPD scale correctly. | Same enemy at levels 1, 10, 20. |
| X.2 | **Enemy skills** | Enemies use their configured skills. | Goblin shaman casts spell; brute uses power attack. |
| X.3 | **Enemy AI** | Enemies target logically (lowest HP, random, etc.). | Verify target selection distribution. |
| X.4 | **Boss mechanics** | Boss flag, higher stats, special abilities, rewards. | Boss encounter vs. normal encounter. |
| X.5 | **Elemental enemies** | Enemies with elements apply weakness/resistance. | Fire elemental vs. water spell (weak) and earth spell. |
| X.6 | **Encounter size** | 1, 2, 3, 4+ enemy encounters are balanced. | Single boss vs. 4 goblins vs. mixed group. |
| X.7 | **Region scaling** | Enemy level and stats increase with clears. | Greenfields at 0 clears vs. 10 clears. |

### 4.8 Party Composition

| # | Area | What to Verify | Sample Scenarios |
|---|------|----------------|------------------|
| C.1 | **Party traits** | Cook +5% HP regen, Guard +10% physical damage reduction, Poet +10% magic power boost, Thief +10% gold gain. | Party with each origin; verify trait effects. |
| C.2 | **Composition matrix** | Specific origin combos grant bonuses. | `origin_warrior` + `origin_arcane_initiate` combo vs. all-warrior party. |
| C.3 | **Front/back row** | If rows exist, verify positional effects. | Tank front, Arcane Initiate back damage distribution. |
| C.4 | **Party size** | 1, 2, 3, 4 hero parties perform as expected. | Solo warrior vs. 4-hero balanced party. |

### 4.9 Consumables & Items in Combat

| # | Area | What to Verify | Sample Scenarios |
|---|------|----------------|------------------|
| I.1 | **HP potion** | Restores 30% of max HP (per doc; currently flat). | Wounded Lv 1 and Lv 20 hero using tiny HP potion. |
| I.2 | **MP potion** | Restores 30% of max MP. | Arcane Initiate at 0 MP using tiny MP potion. |
| I.3 | **Teleport scroll** | Escapes combat immediately. | Scroll use ends battle with no deaths. |
| I.4 | **Consumable + action** | Using an item does not consume the action phase. | Hero uses potion then casts spell same turn. |
| I.5 | **One consumable per turn** | Hero cannot use more than one item per turn. | Try to use two potions in one turn. |

### 4.10 Combat Meta & Balance

| # | Area | What to Verify | Sample Scenarios |
|---|------|----------------|------------------|
| B.1 | **Win rate by archetype** | Pure warrior, pure Arcane Initiate, balanced party should all win same-level encounters at reasonable rates. | Same encounter vs. warrior-only, Arcane Initiate-only, balanced. |
| B.2 | **Turn count expectations** | Fights should not drag too long. | Average turns for level-appropriate encounters. |
| B.3 | **Physical vs. magic DPS** | At same investment, sustained physical and burst magic are competitive. | `origin_warrior` and `origin_arcane_initiate` vs. same enemy over 10 turns. |
| B.4 | **Difficulty spikes** | Tutorials are safe; bosses are dangerous but fair. | Tutorial cave vs. first chapter boss. |
| B.5 | **Flee / escape** | Flee chance works; fleeing grants no rewards. | Multiple flee attempts vs. weak enemy. |

### 4.11 Hybrid Body Inscription (Pending Implementation)

| # | Area | What to Verify | Sample Scenarios |
|---|------|----------------|------------------|
| HY.1 | **Unlock threshold** | Requires Magic Tier 7 + 12 Skill Tier Points. | Hero at 6/12, 7/11, 7/12. |
| HY.2 | **Resource duality** | Physical skills cost STA + MP. | Inscribed warrior uses Multiple Attack; check both bars. |
| HY.3 | **Elemental infusion** | Core glyph adds elemental damage per hit. | Fire body circle + physical skill. |
| HY.4 | **Multi-target transformation** | Single-target skill hits all enemies with Multi glyph. | Multi body circle + Power Strike. |
| HY.5 | **Glyph modifiers** | Potentiate, Piercing, Lifesteal, Focus modify damage. | Each modifier in isolation. |

> **Note:** Hybrid scenarios are defined and skipped until the system is implemented. They act as a specification checklist.

---

## 5. Scenario Generation Strategy

Writing every cell manually would produce 100+ scenario files and invite duplication. Instead, use **parametric generators**.

### 5.1 Generator Pattern

A generator is a function that takes a compact matrix definition and returns an array of scenarios:

```javascript
// scenarios/generators/magicCircle.generator.mjs
export function* generateMagicCircleScenarios() {
  const elements = ['fire', 'water', 'wind', 'storm', 'earth'];
  const targetTypes = ['single_enemy', 'all_enemies', 'ally', 'self'];
  const magicTiers = [1, 4, 7, 10];
  const magicPowers = [10, 30, 60];

  for (const element of elements) {
    for (const target of targetTypes) {
      for (const tier of magicTiers) {
        for (const mag of magicPowers) {
          yield {
            id: `magic_${element}_${target}_tier${tier}_mag${mag}`,
            description: `...`,
            party: [buildMage({ mag, magicTier: tier, coreGlyph: element, targetGlyph: target })],
            encounter: buildEncounter('greenfields', ['goblin_grunt'], 3),
            iterations: 50,
            assertions: [
              { metric: `damage.spell.total`, expectedMin: expectedMin(element, target, tier, mag) },
              { metric: 'winRate', expectedMin: 0.9 }
            ]
          };
        }
      }
    }
  }
}
```

### 5.2 Generators to Build

| Generator | Dimensions | Estimated Scenarios |
|-----------|-----------|---------------------|
| `magicCircle.generator.mjs` | element × target × tier × magicPower | ~200–300 |
| `physicalSkill.generator.mjs` | family × tier × STR × weapon | ~100 |
| `equipment.generator.mjs` | weapon family × material × armor archetype | ~60 |
| `statusEffect.generator.mjs` | effect × duration × resistance | ~30 |
| `gambit.generator.mjs` | condition × action × priority | ~40 |
| `partyComposition.generator.mjs` | origin combos × size | ~30 |
| `enemyScaling.generator.mjs` | enemy × level × encounter size | ~50 |
| `consumable.generator.mjs` | item × hero level × wound state | ~20 |

**Total generated scenarios: ~500–600.**

At 100 iterations each, a full run is ~50,000–60,000 combats. This is acceptable for an overnight or pre-release run, but too slow for daily development. Use selective execution and sampling for daily use.

### 5.3 Selective Execution and Sampling

Not all 500+ scenarios need to run every time. The runner should support tags/filters:

```bash
npm run combat:lab                    # run priority scenarios only (~50)
npm run combat:lab -- --tag magic     # run all magic circle scenarios
npm run combat:lab -- --scenario mage_scaling_tier3_fire
npm run combat:lab -- --full          # run everything (~500+)
```

### 5.4 Expected-Value Helpers

For generated scenarios, expected values can be computed from formulas rather than hard-coded:

```javascript
function expectedSpellDamage({ mag, tier, elementMult, targetCount }) {
  const base = 15; // per glyph base
  const power = mag * (1 + tier * 0.1);
  return base * power * elementMult / Math.max(1, targetCount * 0.7);
}
```

This makes the lab self-tuning: when you rebalance the formula, the expected values update automatically.

### 5.5 Reporting Strategy

The report is the primary output. It should answer three questions:

1. **Is combat broken right now?** — Summary pass/fail count and a list of failing assertions.
2. **Where is it broken?** — Per-scenario tables with actual vs. expected values and links to sample logs.
3. **How did we get here?** — Sample combat logs for the first failure of each scenario, so a human can trace the exact action sequence.

Report sections:

- **Executive Summary**: total scenarios, pass/fail, runtime, known-failure count.
- **Regression Dashboard**: priority scenarios only, with trend indicators if historical reports are kept.
- **Failed Assertions**: scenario ID, assertion, actual value, expected range, and a link to the full log.
- **Per-Scenario Detail**: win rate, avg turns, damage breakdown by source, healing, status effect uptime.
- **Appendix**: full JSONL logs for every scenario.

### 5.6 Handling Known Failures

When the lab first runs, some scenarios will fail because combat is not yet balanced. These should be **explicitly marked as known failures**, not hidden:

```javascript
{
  id: 'mage_magic_power_scaling',
  knownFailure: true,
  issue: 'Spell damage does not apply magicPower multiplier (see BattleService._castOffensiveSpell)',
  assertions: [...]
}
```

Known failures are reported separately. They turn into regression tests once the underlying bug is fixed.

---

## 6. Data Model

### 6.1 Scenario Definition

```typescript
interface CombatScenario {
  id: string;
  description?: string;
  tags?: string[];              // e.g. ['magic', 'scaling', 'regression']
  iterations: number;
  seed?: number;                // deterministic RNG; omit for random
  skip?: boolean;               // skip unimplemented systems (e.g. hybrid)
  knownFailure?: boolean;       // expected to fail until a bug is fixed
  knownFailureReason?: string;
  party: ScenarioHero[];
  encounter: ScenarioEncounter;
  gambits?: GambitConfig[];
  assertions: CombatAssertion[];
}

interface ScenarioHero {
  id?: string;
  name?: string;
  origin: string;               // e.g. 'origin_warrior'
  level: number;
  magicTier?: number;           // 1–25, affects Magic Circle slots
  stats?: Partial<HeroStats>;   // manual overrides for STR, DEF, MAG, SPD, etc.
  equipment?: string[];         // item IDs to equip
  skills?: { id: string; tier?: number }[];
  // Spells can be declared by name (must exist in hero codex) or composed from glyphs
  spells?: (
    | { id: string }                              // existing spell in codex
    | { name: string; glyphs: string[] }          // compose new spell
  )[];
  consumables?: string[];       // item IDs in battle inventory
  bodyCircle?: BodyCircleConfig; // pending hybrid implementation
}

interface ScenarioEncounter {
  region?: string;
  enemies: ScenarioEnemy[];
}

interface ScenarioEnemy {
  id: string;
  level?: number;
  count?: number;
  equipment?: string[];
}

interface CombatAssertion {
  metric: string;               // dotted path, e.g. "damage.spell.Fireball.avgPerHit"
  expectedMin?: number;
  expectedMax?: number;
  expected?: number;            // exact value
  tolerance?: number;           // for exact comparisons
}
```

### 6.2 Metrics Output

```typescript
interface CombatMetrics {
  scenarioId: string;
  iterations: number;
  wins: number;
  losses: number;
  winRate: number;
  avgTurns: number;
  minTurns: number;
  maxTurns: number;
  damage: {
    autoAttack: DamageBucket;
    skill: Record<skillId, DamageBucket>;
    spell: Record<spellName, DamageBucket & { avgTargets: number }>;
    statusEffect: DamageBucket;
  };
  healing: { total: number; ticks: number };
  statusEffects: Record<statusId, { applied: number; ticks: number }>;
  gambits: Record<gambitId, { triggered: number }>;
  items: Record<itemId, { used: number }>;
  resources: {
    staminaSpent: { total: number; byHero: Record<heroId, number> };
    mpSpent: { total: number; byHero: Record<heroId, number> };
  };
}

interface DamageBucket {
  total: number;
  avgPerHit: number;
  hits: number;
  crits: number;
  misses: number;
}
```

---

## 7. Implementation Steps

### Step 0: Bootstrap the lab directory

Create `scripts/combat-lab/` structure:

```
scripts/combat-lab/
  runner.mjs
  metrics.mjs
  assertions.mjs
  report.mjs
  scenarios/
    builder.mjs
    priority/
    generators/
  output/
    .gitignore   # ignore generated logs and reports
    logs/
    report.md
```

Add `output/` to `.gitignore` so generated reports are not committed.

### Step 1: Scenario builder utilities

Create `scripts/combat-lab/scenarios/builder.mjs`:

- `buildHero(scenarioHero)` → `Hero` instance with requested origin, level, stats, equipment, skills, spells, and consumables.
- `buildEnemies(scenarioEncounter)` → enemy array using `RegionService`/`ExpeditionService` templates.
- `buildGambits(party, gambitConfigs)` → attach AI rules to party members.
- `buildSpellFromGlyphs(glyphs)` → compose a spell and add it to the hero’s Codex.

**Acceptance:** A hand-written priority scenario can be converted into a runnable combat in one function call.

### Step 2: Metrics parser

Create `scripts/combat-lab/metrics.mjs`:

- Parse a single `combatLog` into per-combat metrics.
- `aggregateMetrics(combatLogs[])` for multi-iteration statistics.

**Acceptance:** Given a synthetic combat log with one fire spell hit for 50 damage, `damage.spell.Fireball.total` equals 50 and `damage.spell.Fireball.hits` equals 1.

### Step 3: Assertion engine

Create `scripts/combat-lab/assertions.mjs`:

- Resolve dotted metric paths.
- Apply min/max/exact assertions with optional tolerance.

**Acceptance:** `assertMetrics({ winRate: 0.8 }, [{ metric: 'winRate', expectedMin: 0.75 }])` passes; `{ expectedMin: 0.85 }` fails with a clear message.

### Step 4: Report generator

Create `scripts/combat-lab/report.mjs`:

- Markdown report with summary, per-scenario tables, failures, and log links.

**Acceptance:** Running the report generator on a single passing and single failing scenario produces a Markdown file that clearly distinguishes them.

### Step 5: Generators

Create `scripts/combat-lab/scenarios/generators/*.mjs` for the matrices in Section 5.

**Acceptance:** Each generator yields at least one scenario for every matrix cell in its domain.

### Step 6: Priority scenario catalog

Create `scripts/combat-lab/scenarios/priority/` with hand-written regression scenarios for the most critical known issues:

- `mage_scaling.mjs` — `knownFailure: true` until magicPower scaling is fixed.
- `physical_skill_scaling.mjs`
- `healing_potions.mjs` — `knownFailure: true` until potions become percentage-based.
- `status_effects.mjs`
- `gambit_conditions.mjs` — `knownFailure: true` for unimplemented conditions.
- `enemy_scaling.mjs`
- `party_traits.mjs`
- `consumables.mjs`

**Acceptance:** `npm run combat:lab` runs all priority scenarios and reports known failures separately from unexpected failures.

### Step 7: Runner with filtering

Create `scripts/combat-lab/runner.mjs`:

- Load priority scenarios by default.
- Load generated scenarios only when `--tag` or `--full` is passed.
- Support `--scenario <id>`, `--tag <tag>`, `--full`, `--iterations <n>`, `--seed <n>` CLI flags.
- Write logs to `scripts/combat-lab/output/logs/<scenarioId>.jsonl`.
- Write report to `scripts/combat-lab/output/report.md`.
- Exit with non-zero code if any *unexpected* assertion fails.

**Acceptance:** `npm run combat:lab -- --scenario mage_scaling` runs exactly one scenario and produces a report.

### Step 8: npm script

```json
"combat:lab": "node scripts/combat-lab/runner.mjs",
"combat:lab:full": "node scripts/combat-lab/runner.mjs --full"
```

### Step 9: Regression tests

Add `tests/behaviour/combat/combat_balance_lab.test.js`:

- Imports priority scenarios.
- Runs low-iteration versions in CI.
- Fails the build if critical assertions fail.

### Step 10: Documentation

Create `docs/shared/combat/combat_balance_lab.md`:

- Why the lab exists.
- How to run it.
- How to add a scenario or generator.
- How to read the report.
- Link to test matrix.

---

## 8. Tests

- Unit tests for `metrics.mjs` using synthetic combat logs.
- Unit tests for `assertions.mjs` with fake metrics.
- Unit tests for `builder.mjs` helpers.
- Behaviour test running the full priority catalog with low iterations.
- Regression tests for each critical scenario once expected values are established.

---

## 9. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Scenario builder drifts from Hero/Enemy constructors. | Use engine constructors directly; avoid duplicating logic. |
| Combat log shape changes, breaking parser. | Add a log-schema version check; update parser atomically with log changes. |
| 500+ scenarios are slow. | Default to priority subset; full run only on demand; allow `--iterations` override. |
| RNG makes assertions flaky. | Use seeds where possible; assert ranges, not exact values; run enough iterations. |
| Expected values for generated scenarios drift. | Derive expected values from formulas, not magic numbers, where feasible. |
| Hybrid body inscription not implemented. | Define scenarios but skip them; do not block lab on unimplemented features. |

---

## 10. Success Criteria / Definition of Done

- [ ] `scripts/combat-lab/` directory exists with all components from Section 2.
- [ ] `npm run combat:lab` completes in under 30 seconds and produces `scripts/combat-lab/output/report.md`.
- [ ] The report identifies at least the currently known issues (magic scaling, flat potions, broken gambit conditions) as **known failures**.
- [ ] Every cell in the Section 4 matrix is covered by either a priority scenario or a generator.
- [ ] Priority scenarios run as part of `npm test` via `tests/behaviour/combat/combat_balance_lab.test.js`.
- [ ] Adding a new scenario requires only a small file or a generator tweak.
- [ ] Developer doc `docs/shared/combat/combat_balance_lab.md` is written and linked from `AGENTS.md`.
- [ ] CI passes: no unexpected combat lab assertion failures.

---

---

## 12. Pickable Implementation Steps

Each step is a **single commit**, independently reviewable, and produces a working increment. Stop after any step and the codebase is better than before.

| Step | Name | What to Do | Estimated Time | Files Created/Modified |
|------|------|-----------|----------------|----------------------|
| 1 | **Directory structure** | Create `scripts/combat-lab/`, subdirs, `.gitignore`, `README.md` placeholder | 5 min | `scripts/combat-lab/*` |
| 2 | **Hero builder** | `buildHero()` — construct `Hero` instances from scenario definitions without full `GameEngine` | 20 min | `scenarios/builder.mjs` |
| 3 | **Encounter builder** | `buildEnemies()` / `buildEncounter()` — create enemy arrays from templates | 15 min | `scenarios/builder.mjs` |
| 4 | **Metrics parser** | Parse `combatLog` → per-combat metrics (damage, healing, turns, etc.) | 25 min | `metrics.mjs` |
| 5 | **Assertion engine** | Range-based checks (`expectedMin`, `expectedMax`, `tolerance`) | 15 min | `assertions.mjs` |
| 6 | **Minimal report** | Markdown output with pass/fail summary and per-scenario tables | 20 min | `report.mjs` |
| 7 | **Basic runner** | Load scenarios → run N iterations → collect metrics → assert → write report. No CLI flags yet. | 25 min | `runner.mjs` |
| 8 | **Scenario: mage scaling** | `knownFailure: true` — Arcane Initiate spell damage should scale with `magicPower` | 15 min | `scenarios/priority/mage_scaling.mjs` |
| 9 | **Scenario: healing potions** | `knownFailure: true` — potions should restore % of max HP/MP, not flat | 15 min | `scenarios/priority/healing_potions.mjs` |
| 10 | **Scenario: gambit conditions** | `knownFailure: true` — `enemy_element`, `enemy_type`, `battle_phase` conditions not evaluated | 15 min | `scenarios/priority/gambit_conditions.mjs` |
| 11 | **Scenario: physical vs magic DPS** | Compare warrior vs. arcane initiate sustained damage over 10 turns | 15 min | `scenarios/priority/physical_vs_magic_dps.mjs` |
| 12 | **Scenario: status effects** | Verify poison tick, burn tick, stun skip, haste speed | 15 min | `scenarios/priority/status_effects.mjs` |
| 13 | **Runner CLI flags** | Add `--scenario`, `--tag`, `--full`, `--iterations`, `--seed`. Add `npm run combat:lab` script. | 20 min | `runner.mjs`, `package.json` |
| 14 | **Generator: magic circle** | Element × target × tier × magicPower matrix (~200 scenarios) | 30 min | `generators/magicCircle.generator.mjs` |
| 15 | **Generator: equipment** | Weapon family × material × armor archetype (~60 scenarios) | 25 min | `generators/equipment.generator.mjs` |
| 16 | **Generator: physical skills** | Family × tier × STR × weapon (~100 scenarios) | 25 min | `generators/physicalSkill.generator.mjs` |
| 17 | **Generator: enemy scaling** | Enemy × level × encounter size (~50 scenarios) | 20 min | `generators/enemyScaling.generator.mjs` |
| 18 | **Generator: party composition** | Origin combos × size (~30 scenarios) | 20 min | `generators/partyComposition.generator.mjs` |
| 19 | **Generator: consumables** | Item × hero level × wound state (~20 scenarios) | 20 min | `generators/consumable.generator.mjs` |
| 20 | **Generator: status effects** | Effect × duration × resistance (~30 scenarios) | 20 min | `generators/statusEffect.generator.mjs` |
| 21 | **Generator: gambits** | Condition × action × priority (~40 scenarios) | 20 min | `generators/gambit.generator.mjs` |
| 22 | **CI regression tests** | `tests/behaviour/combat/combat_balance_lab.test.js` — run priority scenarios with low iterations | 20 min | `tests/behaviour/combat/*` |
| 23 | **Parallel execution** | Run scenarios in parallel with `Promise.all` | 15 min | `runner.mjs` |
| 24 | **Empirical calibration** | Replace formula-based expectations with "golden master" baseline runs | 25 min | `assertions.mjs`, `calibration.mjs` |
| 25 | **Documentation** | `docs/shared/combat/combat_balance_lab.md` — how to run, add scenarios, read reports | 15 min | `docs/shared/combat/*` |

**Total:** ~25 steps, ~8–10 sessions of work (vs. 3–4 in original estimate)

### Step Dependency Graph

```
Steps 1–7 (framework):  1 → 2 → 3 → 4 → 5 → 6 → 7 (sequential)
Steps 8–12 (scenarios): 8, 9, 10, 11, 12 (parallel, each depends on 7)
Step 13 (CLI):          depends on 7
Steps 14–21 (generators): parallel, each depends on 7
Steps 22–25 (polish):   depend on 13 and generators
```

### Definition of Done per Step

Each step must:
1. **Compile** — no syntax errors
2. **Test** — at least one test passes (even if it's a `knownFailure`)
3. **Commit** — single commit with descriptive message
4. **Report** — if the step adds a scenario, it appears in the report

### Status Tracking

Create `tasks/active/combat-balance-lab/STATUS.md`:

```markdown
# Combat Balance Lab — Status

## Current Step
Step X: [Name]

## Completed
- Step 1: Directory structure ✅
- ...

## Blockers
None / [describe if any]
```

The cron agent reads this file, implements the current step, updates it, and moves to the next.
