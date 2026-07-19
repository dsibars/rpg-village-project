globalThis.localStorage = {
  getItem() { return null; },
  setItem() {},
  removeItem() {},
  clear() {}
};

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { BattleService } from '../../../js/engine/shared/combat/services/BattleService.js';
import { buildParty, buildEnemies, validateScenario } from '../../../scripts/combat-lab/scenarios/builder.mjs';
import { parseCombatLog, aggregateMetrics } from '../../../scripts/combat-lab/metrics.mjs';
import { evaluateScenario } from '../../../scripts/combat-lab/assertions.mjs';
import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PRIORITY_DIR = join(__dirname, '..', '..', '..', 'scripts', 'combat-lab', 'scenarios', 'priority');
const CI_ITERATIONS = 5; // Low iterations for fast CI runs

/**
 * Minimal inventory stub for BattleService (combat-lab only).
 */
class LabInventoryStub {
  constructor() {
    this.data = { consumables: {} };
  }
  useConsumable(id) {
    return { success: true };
  }
  useItem(id, qty) {
    return { success: true };
  }
  getItemCount(id) {
    return 999;
  }
}

/**
 * Load all priority scenarios from the priority directory.
 */
async function loadPriorityScenarios() {
  const scenarios = [];
  const entries = await readdir(PRIORITY_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith('.mjs')) {
      const mod = await import(join(PRIORITY_DIR, entry.name));
      if (mod.default) {
        scenarios.push(...(Array.isArray(mod.default) ? mod.default : [mod.default]));
      }
      if (mod.scenarios) {
        scenarios.push(...(Array.isArray(mod.scenarios) ? mod.scenarios : [mod.scenarios]));
      }
    }
  }

  return scenarios;
}

/**
 * Run a single combat scenario N times and return aggregated metrics.
 */
function runScenario(scenario, inventory) {
  const perCombatMetrics = [];

  for (let i = 0; i < scenario.iterations; i++) {
    const battle = new BattleService(inventory);
    const party = buildParty(scenario.party);
    const enemies = buildEnemies(scenario.encounter);

    battle.startBattle(party, enemies, true); // autoBattle = true

    let safety = 0;
    const MAX_TURNS = 500;
    while (!battle.isOver && safety < MAX_TURNS) {
      battle.nextTurn();
      safety++;
    }

    const metrics = parseCombatLog(battle.log, battle.winner);
    perCombatMetrics.push(metrics);
  }

  const aggregated = aggregateMetrics(perCombatMetrics);
  aggregated.scenarioId = scenario.id;
  return aggregated;
}

describe('Combat Balance Lab — Priority Scenario Regression', () => {
  let scenarios = [];

  it('loads all priority scenarios', async () => {
    scenarios = await loadPriorityScenarios();
    assert.ok(scenarios.length >= 5, `Expected at least 5 priority scenarios, got ${scenarios.length}`);
    console.log(`Loaded ${scenarios.length} priority scenario(s)`);
  });

  it('runs all priority scenarios with no unexpected failures', async () => {
    if (scenarios.length === 0) {
      scenarios = await loadPriorityScenarios();
    }

    const inventory = new LabInventoryStub();
    const unexpectedFailures = [];
    const knownFailures = [];
    const passes = [];

    for (const scenario of scenarios) {
      if (scenario.skip) {
        console.log(`  [SKIP] ${scenario.id}`);
        continue;
      }

      validateScenario(scenario);

      // Override iterations for CI speed
      const ciScenario = { ...scenario, iterations: CI_ITERATIONS };
      const aggregated = runScenario(ciScenario, inventory);
      const result = evaluateScenario(aggregated, ciScenario);

      if (result.knownFailure) {
        knownFailures.push({
          id: scenario.id,
          reason: scenario.knownFailureReason,
          assertionFailures: result.unexpectedFailures + result.knownFailures
        });
      } else if (result.overallPass) {
        passes.push(scenario.id);
      } else {
        unexpectedFailures.push({
          id: scenario.id,
          failures: result.assertionResults.filter(r => !r.pass).map(r => ({
            metric: r.metric,
            expectedMin: r.expectedMin,
            expectedMax: r.expectedMax,
            expected: r.expected,
            actual: r.actual,
            message: r.message
          }))
        });
      }
    }

    console.log(`\nCombat Balance Lab Regression Results:`);
    console.log(`  Passed: ${passes.length}`);
    console.log(`  Known failures: ${knownFailures.length}`);
    console.log(`  Unexpected failures: ${unexpectedFailures.length}`);

    if (knownFailures.length > 0) {
      console.log(`\nKnown failures (expected):`);
      for (const kf of knownFailures) {
        console.log(`  📝 ${kf.id}: ${kf.reason}`);
      }
    }

    if (unexpectedFailures.length > 0) {
      console.log(`\nUnexpected failures (CI should fail):`);
      for (const uf of unexpectedFailures) {
        console.log(`  ❌ ${uf.id}:`);
        for (const f of uf.failures) {
          console.log(`      ${f.metric}: expected ${f.expectedMin ?? f.expectedMax ?? f.expected}, got ${f.actual}`);
        }
      }
    }

    assert.strictEqual(
      unexpectedFailures.length,
      0,
      `Found ${unexpectedFailures.length} unexpected failure(s) in priority scenarios: ${unexpectedFailures.map(u => u.id).join(', ')}`
    );
  });
});
