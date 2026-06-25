# Combat Balance Lab

> **Developer tool for automated combat simulation and regression testing.**

The Combat Balance Lab turns combat tuning from manual playtest iteration into a data-driven, reproducible process. It runs hundreds of combats across defined scenarios, asserts expected behaviors, and produces a human-readable report.

---

## Table of Contents

- [Philosophy](#philosophy)
- [Quick Start](#quick-start)
- [CLI Reference](#cli-reference)
- [Architecture](#architecture)
- [Adding a Scenario](#adding-a-scenario)
- [Adding a Generator](#adding-a-generator)
- [Reading the Report](#reading-the-report)
- [Calibration System](#calibration-system)
- [CI Integration](#ci-integration)
- [Test Matrix](#test-matrix)

---

## Philosophy

1. **Measure first, fix second.** The lab only reports; it does not change combat numbers.
2. **Deterministic where possible.** Scenarios can specify an RNG seed so flaky failures are reproducible.
3. **Generated, not hand-written.** High-dimensional systems (magic, equipment, skills) are covered by parametric generators, not 500 manual files.
4. **Fast by default, exhaustive on demand.** Priority scenarios run in seconds; full matrix runs only when requested.
5. **Self-documenting failures.** A failed assertion includes the exact combat log that produced it.
6. **Spec-as-test.** The test matrix in Section 10 is a living specification. If a cell has no passing scenario, the subsystem is untrusted.

---

## Quick Start

```bash
# Run priority scenarios (fast, ~0.2s)
npm run combat:lab

# Run with full generated matrix (~2s, ~380 scenarios)
npm run combat:lab:full

# Run a single scenario
node scripts/combat-lab/runner.mjs --scenario mage_scaling

# Run all magic scenarios with 100 iterations each
node scripts/combat-lab/runner.mjs --tag magic --iterations 100
```

---

## CLI Reference

```
Usage: node scripts/combat-lab/runner.mjs [options]

Options:
  --scenario <id>      Run a single scenario by ID
  --tag <tag>          Run all scenarios with the given tag
  --full               Run all scenarios including generated matrices
  --iterations <n>     Override iteration count for all scenarios
  --seed <n>           Set RNG seed (deterministic mode)
  --concurrency <n>    Max parallel scenarios (default: 4)
  --calibrate          Regenerate golden-master baseline metrics
  --tolerance <pct>    Allowable deviation from baseline (default: 15)
  --help, -h           Show this help
```

### Examples

```bash
# Debug a specific failing scenario
node scripts/combat-lab/runner.mjs --scenario mage_scaling --iterations 10

# Run everything with 8 parallel workers
node scripts/combat-lab/runner.mjs --full --concurrency 8

# Recalibrate baselines after a balance change
node scripts/combat-lab/runner.mjs --calibrate --full

# Allow wider tolerance for experimental changes
node scripts/combat-lab/runner.mjs --tolerance 25 --full
```

---

## Architecture

```
scripts/combat-lab/
  runner.mjs          # Orchestrates loading, execution, reporting
  metrics.mjs         # Parses combatLog → per-combat statistics
  assertions.mjs      # Range-based checks (min/max/exact/tolerance)
  report.mjs          # Markdown report generator
  calibration.mjs     # Golden-master baseline system
  scenarios/
    builder.mjs       # Hero/Enemy/Encounter construction helpers
    priority/         # Hand-written regression scenarios
    generators/       # Parametric matrix generators
  output/
    report.md         # Human-readable report
    logs/             # Per-scenario JSONL combat logs
    calibration.json  # Baseline metrics database
```

### Component Responsibilities

| Component | Responsibility |
|-----------|----------------|
| **Scenario Builder** (`scenarios/builder.mjs`) | Constructs `Hero` and `Enemy` instances from scenario definitions without running the full game loop. |
| **Matrix Generators** (`scenarios/generators/*.mjs`) | Produce many scenarios from compact definitions (e.g., every element × target type × magic tier). |
| **Combat Runner** (`runner.mjs`) | Orchestrates N iterations, collects metrics, applies assertions, writes reports. |
| **Metrics Parser** (`metrics.mjs`) | Reads combat logs and computes statistics: damage by source, win rate, turns, healing, status uptime. |
| **Assertion Engine** (`assertions.mjs`) | Compares metrics against expected ranges; supports min/max/exact/win-rate/turn-count assertions. |
| **Report Generator** (`report.mjs`) | Produces Markdown with summary tables, per-scenario details, and links to logs. |
| **Calibration** (`calibration.mjs`) | Captures golden-master baselines and auto-generates assertions from measured data. |

---

## Adding a Scenario

Priority scenarios live in `scripts/combat-lab/scenarios/priority/`.

### Minimal Example

```javascript
// scripts/combat-lab/scenarios/priority/my_scenario.mjs
export default {
  id: 'my_scenario',
  description: 'What this scenario tests',
  tags: ['regression', 'priority'],
  iterations: 50,

  party: [
    {
      origin: 'origin_warrior',
      level: 5,
      stats: {
        baseMaxHp: 60,
        baseStrength: 12,
        baseSpeed: 5
      },
      equipment: ['weapon:iron:broadsword']
    }
  ],

  encounter: {
    enemies: [
      { id: 'goblin_grunt', count: 1, level: 3 }
    ]
  },

  assertions: [
    { metric: 'winRate', expectedMin: 0.95 },
    { metric: 'damage.autoAttack.avgPerHit', expectedMin: 10 }
  ]
};
```

### Scenario Schema

```typescript
interface CombatScenario {
  id: string;                    // Unique identifier
  description?: string;          // Human-readable purpose
  tags?: string[];               // Filter tags (e.g., ['magic', 'regression'])
  iterations: number;            // How many combats to run
  seed?: number;                 // RNG seed for determinism
  skip?: boolean;                // Skip unimplemented systems
  knownFailure?: boolean;        // Expected to fail until bug fixed
  knownFailureReason?: string;   // Why it fails + where to fix
  party: ScenarioHero[];
  encounter: ScenarioEncounter;
  assertions: CombatAssertion[];
}
```

### Assertion Types

```typescript
// Range assertion
{ metric: 'winRate', expectedMin: 0.75, expectedMax: 1.0 }

// Exact value with tolerance
{ metric: 'avgTurns', expected: 10, tolerance: 2 }

// Min only (open upper bound)
{ metric: 'damage.spell."Fireball".avgPerHit', expectedMin: 25 }

// Calibrated assertions are auto-generated from baselines
{ metric: 'winRate', expectedMin: 0.72, expectedMax: 0.98, _calibrated: true }
```

### Known Failures

Mark a scenario as `knownFailure: true` when it documents a bug that hasn't been fixed yet. Known failures are reported separately and do not cause CI to fail:

```javascript
{
  id: 'mage_scaling',
  knownFailure: true,
  knownFailureReason: 'Spell damage does not apply magicPower multiplier (see BattleService._castOffensiveSpell).',
  // ... assertions that would pass if the bug were fixed
}
```

---

## Adding a Generator

Generators live in `scripts/combat-lab/scenarios/generators/` and produce parametric scenario matrices.

### Generator Pattern

```javascript
// scripts/combat-lab/scenarios/generators/my_system.generator.mjs
export function generate() {
  const scenarios = [];

  for (const variant of ['A', 'B', 'C']) {
    for (const tier of [1, 5, 10]) {
      scenarios.push({
        id: `my_system_${variant}_tier${tier}`,
        tags: ['my_system', 'generated'],
        iterations: 20,
        party: [/* ... */],
        encounter: { /* ... */ },
        assertions: [/* ... */]
      });
    }
  }

  return scenarios;
}

export default generate;
```

### Generator Requirements

1. Export a `generate()` function that returns an array of scenario objects.
2. Each scenario must have a globally unique `id`.
3. Use `tags: ['generated', ...]` so `--tag generated` can target them.
4. Generated scenarios are only loaded when `--full` or `--tag` is passed.

### Existing Generators

| Generator | Dimensions | Scenarios |
|-----------|-----------|-----------|
| `magicCircle.generator.mjs` | element × target × tier × magicPower | ~228 |
| `equipment.generator.mjs` | weapon × material × armor | ~19 |
| `physicalSkill.generator.mjs` | family × tier | ~24 |
| `enemyScaling.generator.mjs` | enemy × level × encounter size | ~295 |
| `partyComposition.generator.mjs` | origin combos × size | ~26 |
| `consumable.generator.mjs` | item × level × wound state | ~12 |
| `statusEffect.generator.mjs` | effect × duration × resistance | ~30 |
| `gambit.generator.mjs` | condition × action × priority | ~22 |

---

## Reading the Report

The report is written to `scripts/combat-lab/output/report.md` after every run.

### Sections

1. **Executive Summary** — Total scenarios, pass/fail counts, runtime. Shows `✅ ALL CLEAR` when there are zero unexpected failures.

2. **Scenario Catalog** — Quick-reference table of every scenario with status, win rate, and assertion counts.

3. **Known Failures** — Scenarios marked `knownFailure: true` with their documented reasons. These are expected and tracked, not surprises.

4. **Per-Scenario Details** — Full metrics and assertion results for each scenario, including:
   - Win rate, turn counts, damage breakdowns
   - Per-assertion expected vs. actual values
   - Links to JSONL logs in `output/logs/`

### Sample Log Format

Each scenario's combat log is written as newline-delimited JSON (`*.jsonl`):

```jsonl
{"type":"battleStart","turn":0,"party":["Hero"],"enemies":["Goblin"]}
{"type":"turnStart","turn":1,"actor":"Hero"}
{"type":"action","actor":"Hero","action":"spell","target":"Goblin","damage":25}
{"type":"turnEnd","turn":1}
...
```

---

## Calibration System

Calibration captures "golden master" baseline metrics so generated scenarios don't need hand-crafted expected values.

### Workflow

```bash
# 1. Run calibration to capture baselines (uses 50 iterations per scenario)
node scripts/combat-lab/runner.mjs --calibrate --full

# 2. Subsequent runs use baselines with ±15% tolerance
npm run combat:lab:full

# 3. After a balance change, recalibrate
node scripts/combat-lab/runner.mjs --calibrate --full
```

### How It Works

1. Calibration stores metrics for each scenario in `output/calibration.json`.
2. On normal runs, calibrated assertions are auto-injected into scenarios that lack explicit assertions.
3. Priority scenarios with hand-written assertions are left untouched.
4. Use `--tolerance 20` to allow ±20% deviation when testing experimental changes.

### Calibration Data Format

```json
{
  "version": "1.0.0",
  "generatedAt": "2026-06-25T01:23:53Z",
  "iterations": 50,
  "tolerance": 0.15,
  "scenarios": {
    "mage_scaling": {
      "winRate": 1.0,
      "avgTurns": 1.0,
      "spells": { "Lesser Fire Spark": 85.0 }
    }
  }
}
```

---

## CI Integration

The lab runs as part of the test suite via `tests/behaviour/combat/combat_balance_lab.test.js`.

```bash
npm test
```

This test:
- Loads all 12 priority scenarios
- Runs 5 iterations each
- Asserts zero unexpected failures
- Known failures are expected and do not fail the build

### Behaviour Test Structure

```javascript
import { describe, it, expect } from 'vitest';
import priorityScenarios from '../../../scripts/combat-lab/scenarios/priority/';

// Runs priority scenarios with low iterations in CI
describe('Combat Balance Lab — Priority Regression', () => {
  // 6 pass, 6 known failures (expected)
});
```

---

## Test Matrix

The test matrix ensures every combat subsystem is covered. Each cell becomes one or more scenarios.

| Category | Items | Coverage |
|----------|-------|----------|
| Hero fundamentals | 9 | Hand-written priority + stat sweep generator |
| Equipment | 6 | `equipment.generator.mjs` |
| Physical skills | 9 | `physicalSkill.generator.mjs` |
| Magic Circle / spells | 12 | `magicCircle.generator.mjs` |
| Status effects | 7 | `statusEffect.generator.mjs` |
| Gambits | 8 | `gambit.generator.mjs` |
| Enemies & encounters | 7 | `enemyScaling.generator.mjs` |
| Party composition | 4 | `partyComposition.generator.mjs` |
| Consumables | 5 | `consumable.generator.mjs` |
| Combat meta | 5 | Hand-written benchmark scenarios |
| Hybrid Body Inscription | 5 | Defined but skipped until implemented |
| **Total** | **~77** | Mix of priority and generated |

### Known Issues Currently Tracked

| Scenario | Issue | Location |
|----------|-------|----------|
| `mage_scaling` | Spell damage ignores `magicPower` | `BattleService._castOffensiveSpell` |
| `healing_potions_hp` | Flat heal (20) instead of 30% max HP | `CONSUMABLES_DATA` |
| `healing_potions_mp` | Flat restore (10) instead of 30% max MP | `CONSUMABLES_DATA` |
| `gambit_enemy_element` | Condition declared but not implemented | `GambitService._checkCondition` |
| `gambit_enemy_type` | Condition declared but not implemented | `GambitService._checkCondition` |
| `gambit_battle_phase` | `battleState` not passed to evaluator | `BattleService.performAutoAction` |

---

## Tips

- **Start small:** Add a single priority scenario before writing a generator.
- **Use tags:** Tags make it easy to run subsets (`--tag magic`, `--tag regression`).
- **Iterate on iterations:** 20 iterations is usually enough for stable averages; use 50+ for calibration.
- **Check logs:** When a scenario fails, read the JSONL log in `output/logs/<scenarioId>.jsonl` to trace the exact action sequence.
- **Keep known failures honest:** Update `knownFailureReason` when you learn more about a bug.
