/**
 * Combat Balance Lab — Empirical Calibration
 *
 * Captures "golden master" baseline metrics from scenario runs and applies
 * them as calibrated assertions. This replaces hand-crafted expected-value
 * formulas in generators with real measured data.
 *
 * Usage:
 *   node scripts/combat-lab/runner.mjs --calibrate          # regenerate baselines
 *   node scripts/combat-lab/runner.mjs --tolerance 20       # allow ±20% deviation
 *
 * Design notes
 * ─────────────
 * • Calibration data is stored as JSON in output/calibration.json.
 * • Each scenario gets a record of its key metrics (winRate, avgTurns, damage
 *   buckets, etc.) captured at calibration time.
 * • When assertions use calibrated baselines, both expectedMin and expectedMax
 *   are set to baseline ± tolerance%.
 * • Priority scenarios with explicit assertions are left untouched; calibration
 *   augments generated scenarios that only have loose or no assertions.
 * • Calibration runs use a higher default iteration count (50) for stability.
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CALIBRATION_PATH = join(__dirname, 'output', 'calibration.json');
const CALIBRATION_VERSION = '1.0.0';
const DEFAULT_TOLERANCE = 0.15; // 15%
const DEFAULT_CALIBRATION_ITERATIONS = 50;

// ───────────────────────────────────────────────────────────────────────────
// Calibration data model
// ───────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} CalibrationEntry
 * @property {number} winRate
 * @property {number} avgTurns
 * @property {number} [minTurns]
 * @property {number} [maxTurns]
 * @property {Object.<string, number>} [spells]  — spellName → avgPerHit
 * @property {Object.<string, number>} [skills]  — skillId → avgPerHit
 * @property {number} [autoAttackAvgPerHit]
 * @property {number} [healingTotal]
 * @property {number} [statusPoisonTicks]
 * @property {number} [statusStunApplied]
 */

// Metrics we extract from aggregated results for calibration
const CALIBRATED_METRICS = [
  'winRate',
  'avgTurns',
  'minTurns',
  'maxTurns',
  'damage.autoAttack.avgPerHit',
  'damage.autoAttack.hits',
  'damage.statusEffect.total',
  'healing.total',
  'healing.ticks'
];

// ───────────────────────────────────────────────────────────────────────────
// Save / Load
// ───────────────────────────────────────────────────────────────────────────

export async function saveCalibration(data) {
  await mkdir(dirname(CALIBRATION_PATH), { recursive: true });
  await writeFile(CALIBRATION_PATH, JSON.stringify(data, null, 2), 'utf8');
}

export async function loadCalibration() {
  if (!existsSync(CALIBRATION_PATH)) {
    return null;
  }
  const raw = await readFile(CALIBRATION_PATH, 'utf8');
  return JSON.parse(raw);
}

// ───────────────────────────────────────────────────────────────────────────
// Build calibration data from a run
// ───────────────────────────────────────────────────────────────────────────

/**
 * Extract calibration entry from aggregated metrics.
 *
 * @param {Object} metrics — aggregated metrics from aggregateMetrics()
 * @returns {CalibrationEntry}
 */
export function extractCalibrationEntry(metrics) {
  const entry = {
    winRate: metrics.winRate ?? 0,
    avgTurns: metrics.avgTurns ?? 0,
    minTurns: metrics.minTurns ?? 0,
    maxTurns: metrics.maxTurns ?? 0
  };

  if (metrics.damage?.autoAttack?.avgPerHit > 0) {
    entry.autoAttackAvgPerHit = metrics.damage.autoAttack.avgPerHit;
    entry.autoAttackHits = metrics.damage.autoAttack.hits;
  }

  // Spell damage — capture all spells that dealt damage
  if (metrics.damage?.spell) {
    entry.spells = {};
    for (const [name, bucket] of Object.entries(metrics.damage.spell)) {
      if (bucket.hits > 0) {
        entry.spells[name] = bucket.avgPerHit;
      }
    }
  }

  // Skill damage
  if (metrics.damage?.skill) {
    entry.skills = {};
    for (const [id, bucket] of Object.entries(metrics.damage.skill)) {
      if (bucket.hits > 0) {
        entry.skills[id] = bucket.avgPerHit;
      }
    }
  }

  // Status effects
  if (metrics.statusEffects?.applied) {
    entry.statusApplied = {};
    for (const [k, v] of Object.entries(metrics.statusEffects.applied)) {
      entry.statusApplied[k] = v;
    }
  }
  if (metrics.statusEffects?.ticks) {
    entry.statusTicks = {};
    for (const [k, v] of Object.entries(metrics.statusEffects.ticks)) {
      entry.statusTicks[k] = v;
    }
  }

  if (metrics.healing?.total > 0) {
    entry.healingTotal = metrics.healing.total;
    entry.healingTicks = metrics.healing.ticks;
  }

  return entry;
}

/**
 * Build full calibration data from an array of {scenarioId, metrics} pairs.
 *
 * @param {Array<{scenarioId:string, metrics:Object}>} runs
 * @param {Object} [options]
 * @returns {Object}
 */
export function buildCalibrationData(runs, options = {}) {
  const scenarios = {};
  for (const { scenarioId, metrics } of runs) {
    scenarios[scenarioId] = extractCalibrationEntry(metrics);
  }

  return {
    version: CALIBRATION_VERSION,
    generatedAt: new Date().toISOString(),
    iterations: options.iterations ?? DEFAULT_CALIBRATION_ITERATIONS,
    tolerance: options.tolerance ?? DEFAULT_TOLERANCE,
    scenarios
  };
}

// ───────────────────────────────────────────────────────────────────────────
// Apply calibrated assertions to scenarios
// ───────────────────────────────────────────────────────────────────────────

/**
 * Create an assertion from a calibrated baseline value with tolerance.
 *
 * @param {string} metric — dotted metric path
 * @param {number} baseline — the calibrated value
 * @param {number} tolerance — fractional tolerance (e.g. 0.15 = ±15%)
 * @returns {Object} assertion object
 */
function makeCalibratedAssertion(metric, baseline, tolerance) {
  const min = baseline * (1 - tolerance);
  const max = baseline * (1 + tolerance);
  return {
    metric,
    expectedMin: min,
    expectedMax: max,
    _calibrated: true,
    _baseline: baseline,
    _tolerance: tolerance
  };
}

/**
 * Check whether a scenario already has an explicit assertion for a metric.
 *
 * @param {Object} scenario
 * @param {string} metric
 * @returns {boolean}
 */
function hasExplicitAssertion(scenario, metric) {
  return (scenario.assertions || []).some(a => a.metric === metric && !a._calibrated);
}

/**
 * Apply calibrated assertions to a single scenario.
 *
 * @param {Object} scenario
 * @param {CalibrationEntry} entry
 * @param {number} tolerance
 * @returns {Object} modified scenario (mutates in place)
 */
export function applyCalibrationToScenario(scenario, entry, tolerance) {
  if (!entry) return scenario;
  if (!scenario.assertions) scenario.assertions = [];

  // Win rate — always calibrate if not explicitly asserted
  if (entry.winRate !== undefined && !hasExplicitAssertion(scenario, 'winRate')) {
    scenario.assertions.push(makeCalibratedAssertion('winRate', entry.winRate, tolerance));
  }

  // Turn count
  if (entry.avgTurns !== undefined && !hasExplicitAssertion(scenario, 'avgTurns')) {
    scenario.assertions.push(makeCalibratedAssertion('avgTurns', entry.avgTurns, tolerance));
  }

  // Auto-attack damage
  if (entry.autoAttackAvgPerHit !== undefined && !hasExplicitAssertion(scenario, 'damage.autoAttack.avgPerHit')) {
    scenario.assertions.push(makeCalibratedAssertion('damage.autoAttack.avgPerHit', entry.autoAttackAvgPerHit, tolerance));
  }

  // Spell damage
  if (entry.spells) {
    for (const [spellName, avgPerHit] of Object.entries(entry.spells)) {
      const metric = `damage.spell."${spellName}".avgPerHit`;
      if (!hasExplicitAssertion(scenario, metric)) {
        scenario.assertions.push(makeCalibratedAssertion(metric, avgPerHit, tolerance));
      }
    }
  }

  // Skill damage
  if (entry.skills) {
    for (const [skillId, avgPerHit] of Object.entries(entry.skills)) {
      const metric = `damage.skill.${skillId}.avgPerHit`;
      if (!hasExplicitAssertion(scenario, metric)) {
        scenario.assertions.push(makeCalibratedAssertion(metric, avgPerHit, tolerance));
      }
    }
  }

  // Status effects
  if (entry.statusApplied) {
    for (const [effect, count] of Object.entries(entry.statusApplied)) {
      const metric = `statusEffects.applied.${effect}`;
      if (!hasExplicitAssertion(scenario, metric)) {
        scenario.assertions.push(makeCalibratedAssertion(metric, count, tolerance));
      }
    }
  }

  // Healing
  if (entry.healingTotal !== undefined && !hasExplicitAssertion(scenario, 'healing.total')) {
    scenario.assertions.push(makeCalibratedAssertion('healing.total', entry.healingTotal, tolerance));
  }

  return scenario;
}

/**
 * Apply calibration data to an array of scenarios.
 *
 * @param {Array<Object>} scenarios
 * @param {Object} calibrationData
 * @param {number} [tolerance]
 * @returns {Array<Object>} scenarios with calibrated assertions merged in
 */
export function applyCalibration(scenarios, calibrationData, tolerance = DEFAULT_TOLERANCE) {
  if (!calibrationData || !calibrationData.scenarios) {
    return scenarios;
  }

  return scenarios.map(scenario => {
    const entry = calibrationData.scenarios[scenario.id];
    if (!entry) return scenario;

    // Clone so we don't mutate the original generator output
    const cloned = JSON.parse(JSON.stringify(scenario));
    return applyCalibrationToScenario(cloned, entry, tolerance);
  });
}

/**
 * Get the recommended iteration count for calibration mode.
 *
 * @returns {number}
 */
export function getCalibrationIterations() {
  return DEFAULT_CALIBRATION_ITERATIONS;
}
