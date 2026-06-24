/**
 * Combat Balance Lab — Runner
 *
 * Orchestrates scenario loading, combat execution, metrics collection,
 * assertion evaluation, and report generation.
 *
 * Usage:
 *   node scripts/combat-lab/runner.mjs
 *   node scripts/combat-lab/runner.mjs --scenario mage_scaling
 *   node scripts/combat-lab/runner.mjs --tag magic
 *   node scripts/combat-lab/runner.mjs --full
 *   node scripts/combat-lab/runner.mjs --iterations 50 --seed 12345
 */

import { BattleService } from '../../js/engine/shared/combat/services/BattleService.js';
import { buildHero, buildParty, buildEnemies, validateScenario } from './scenarios/builder.mjs';
import { parseCombatLog, aggregateMetrics } from './metrics.mjs';
import { evaluateScenario, summariseResults } from './assertions.mjs';
import { generateReportSync } from './report.mjs';

import { readdir, readFile, mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ───────────────────────────────────────────────────────────────────────────
// Minimal Inventory Stub for BattleService (combat-lab only)
// ───────────────────────────────────────────────────────────────────────────
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

// ───────────────────────────────────────────────────────────────────────────
// Scenario Loading
// ───────────────────────────────────────────────────────────────────────────

async function loadScenariosFromDir(dir) {
  const scenarios = [];
  if (!existsSync(dir)) return scenarios;

  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith('.mjs')) {
      const mod = await import(join(dir, entry.name));
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

async function loadAllScenarios(options) {
  const scenarios = [];

  // Priority scenarios (always loaded)
  const priorityDir = join(__dirname, 'scenarios', 'priority');
  scenarios.push(...await loadScenariosFromDir(priorityDir));

  // Generated scenarios (only with --full or --tag)
  if (options.full || options.tag) {
    const generatorsDir = join(__dirname, 'scenarios', 'generators');
    if (existsSync(generatorsDir)) {
      const entries = await readdir(generatorsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.mjs')) {
          const mod = await import(join(generatorsDir, entry.name));
          const generator = mod.generate || mod.default;
          if (typeof generator === 'function') {
            const generated = generator();
            for (const s of generated) {
              scenarios.push(s);
            }
          }
        }
      }
    }
  }

  return scenarios;
}

// ───────────────────────────────────────────────────────────────────────────
// Combat Execution
// ───────────────────────────────────────────────────────────────────────────

function runSingleCombat(scenario, inventory) {
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

  return {
    winner: battle.winner,
    log: battle.log
  };
}

function runScenario(scenario, inventory) {
  const perCombatMetrics = [];
  const sampleLog = { winner: null, log: [] };

  for (let i = 0; i < scenario.iterations; i++) {
    const result = runSingleCombat(scenario, inventory);
    const metrics = parseCombatLog(result.log, result.winner);
    perCombatMetrics.push(metrics);

    if (i === 0) {
      sampleLog.winner = result.winner;
      sampleLog.log = result.log;
    }
  }

  const aggregated = aggregateMetrics(perCombatMetrics);
  aggregated.scenarioId = scenario.id;
  return { aggregated, sampleLog };
}

// ───────────────────────────────────────────────────────────────────────────
// Parallel Execution with Concurrency Control
// ───────────────────────────────────────────────────────────────────────────

const DEFAULT_CONCURRENCY = 4;

async function runScenarioAsync(scenario, inventory, logsDir) {
  validateScenario(scenario);

  const perCombatMetrics = [];
  const sampleLog = { winner: null, log: [] };

  for (let i = 0; i < scenario.iterations; i++) {
    const result = runSingleCombat(scenario, inventory);
    const metrics = parseCombatLog(result.log, result.winner);
    perCombatMetrics.push(metrics);

    if (i === 0) {
      sampleLog.winner = result.winner;
      sampleLog.log = result.log;
    }
  }

  const aggregated = aggregateMetrics(perCombatMetrics);
  aggregated.scenarioId = scenario.id;

  // Evaluate assertions
  const result = evaluateScenario(aggregated, scenario);

  // Write sample log
  const logPath = join(logsDir, `${scenario.id}.jsonl`);
  const logLines = sampleLog.log.map(e => JSON.stringify(e)).join('\n');
  await writeFile(logPath, logLines, 'utf8');

  return { aggregated, result };
}

async function runWithConcurrency(items, concurrencyLimit, fn) {
  const results = new Array(items.length);
  const executing = [];

  for (let i = 0; i < items.length; i++) {
    const promise = fn(items[i], i).then((result) => {
      results[i] = result;
      return result;
    });
    results[i] = promise;

    const e = promise.then(() => {
      executing.splice(executing.indexOf(e), 1);
    });
    executing.push(e);

    if (executing.length >= concurrencyLimit) {
      await Promise.race(executing);
    }
  }

  return Promise.all(results);
}

// ───────────────────────────────────────────────────────────────────────────
// CLI
// ───────────────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    scenario: null,
    tag: null,
    full: false,
    iterations: null,
    seed: null,
    concurrency: DEFAULT_CONCURRENCY,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--scenario':
        options.scenario = args[++i];
        break;
      case '--tag':
        options.tag = args[++i];
        break;
      case '--full':
        options.full = true;
        break;
      case '--iterations':
        options.iterations = parseInt(args[++i], 10);
        break;
      case '--seed':
        options.seed = parseInt(args[++i], 10);
        break;
      case '--concurrency':
        options.concurrency = parseInt(args[++i], 10);
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
    }
  }

  return options;
}

function printHelp() {
  console.log(`
Combat Balance Lab Runner

Usage: node scripts/combat-lab/runner.mjs [options]

Options:
  --scenario <id>      Run a single scenario by ID
  --tag <tag>          Run all scenarios with the given tag
  --full               Run all scenarios including generated matrices
  --iterations <n>     Override iteration count for all scenarios
  --seed <n>           Set RNG seed (deterministic mode)
  --concurrency <n>    Max parallel scenarios (default: ${DEFAULT_CONCURRENCY})
  --help, -h           Show this help

Examples:
  node scripts/combat-lab/runner.mjs
  node scripts/combat-lab/runner.mjs --scenario mage_scaling
  node scripts/combat-lab/runner.mjs --tag magic --iterations 100 --concurrency 8
`);
}

// ───────────────────────────────────────────────────────────────────────────
// Main
// ───────────────────────────────────────────────────────────────────────────

async function main() {
  const options = parseArgs();

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  // Ensure output directories exist
  const outputDir = join(__dirname, 'output');
  const logsDir = join(outputDir, 'logs');
  await mkdir(logsDir, { recursive: true });

  // Load scenarios
  const allScenarios = await loadAllScenarios(options);

  // Filter by ID or tag
  let toRun = allScenarios;
  if (options.scenario) {
    toRun = allScenarios.filter(s => s.id === options.scenario);
    if (toRun.length === 0) {
      console.error(`Scenario "${options.scenario}" not found.`);
      process.exit(1);
    }
  } else if (options.tag) {
    toRun = allScenarios.filter(s => s.tags && s.tags.includes(options.tag));
  }

  // Skip scenarios marked skip=true
  toRun = toRun.filter(s => !s.skip);

  // Override iterations if requested
  if (options.iterations) {
    toRun = toRun.map(s => ({ ...s, iterations: options.iterations }));
  }

  console.log(`Combat Balance Lab — ${toRun.length} scenario(s) to run (concurrency: ${options.concurrency})\n`);

  const inventory = new LabInventoryStub();

  // Run scenarios in parallel with concurrency limit
  const startTime = Date.now();
  const runResults = await runWithConcurrency(
    toRun,
    options.concurrency,
    (scenario) => runScenarioAsync(scenario, inventory, logsDir)
  );
  const elapsedMs = Date.now() - startTime;

  const results = [];
  const allMetrics = [];

  for (const { aggregated, result } of runResults) {
    results.push(result);
    allMetrics.push(aggregated);

    const status = result.knownFailure
      ? '📝 known'
      : result.overallPass
        ? '✅ pass'
        : '❌ FAIL';
    console.log(`  ${aggregated.scenarioId} ... ${status}  (wr: ${(aggregated.winRate * 100).toFixed(0)}%, turns: ${aggregated.avgTurns.toFixed(1)})`);
  }

  // Generate report
  const summary = summariseResults(results);
  const report = generateReportSync(results, allMetrics, summary);

  const reportPath = join(outputDir, 'report.md');
  await writeFile(reportPath, report, 'utf8');

  console.log(`\nReport written to: ${reportPath}`);
  console.log(`Logs written to:   ${logsDir}/`);
  console.log(`Runtime:           ${(elapsedMs / 1000).toFixed(2)}s`);
  console.log(`\nSummary: ${summary.passed}/${summary.total} passed, ${summary.failed} unexpected failure(s), ${summary.knownFailed} known failure(s)`);

  // Exit with non-zero if unexpected failures
  if (summary.failed > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
