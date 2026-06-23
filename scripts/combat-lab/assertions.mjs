/**
 * Combat Balance Lab — Assertion Engine
 *
 * Compares aggregated combat metrics against expected ranges.
 * Supports min/max bounds, exact values with tolerance, and
 * known-failure marking so regressions are not hidden.
 *
 * Design notes
 * ─────────────
 * • Each assertion is a plain object with a dotted metric path
 *   (e.g. "damage.spell.Fireball.total").
 * • The engine resolves the path via resolveMetric() imported from
 *   metrics.mjs, then checks against expectedMin / expectedMax / expected.
 * • A scenario can be marked "knownFailure: true" so that its assertion
 *   failures are reported as *expected* rather than *unexpected*.
 * • Failure messages include the exact metric path, expected range, and
 *   actual value so a human can debug without re-running.
 */

import { resolveMetric } from './metrics.mjs';

// ───────────────────────────────────────────────────────────────────────────
// Single assertion
// ───────────────────────────────────────────────────────────────────────────

/**
 * Evaluate one assertion against a metrics object.
 *
 * @param {Object} metrics        — aggregated metrics from aggregateMetrics()
 * @param {Object} assertion
 *   @param {string} assertion.metric      — dotted path (e.g. "winRate")
 *   @param {number} [assertion.expectedMin] — lower bound (inclusive)
 *   @param {number} [assertion.expectedMax] — upper bound (inclusive)
 *   @param {number} [assertion.expected]    — exact value
 *   @param {number} [assertion.tolerance]   — ± tolerance for exact check
 * @returns {{pass:boolean, message?:string, actual:number|undefined}}
 */
export function evaluateAssertion(metrics, assertion) {
  const value = resolveMetric(metrics, assertion.metric);
  const actual = typeof value === 'number' ? value : undefined;

  // ── Missing metric ───────────────────────────────────────────────────────
  if (actual === undefined) {
    return {
      pass: false,
      message: `Metric "${assertion.metric}" not found in metrics (undefined)`,
      actual: undefined
    };
  }

  // ── Exact match (with optional tolerance) ───────────────────────────────
  if (assertion.expected !== undefined) {
    const tolerance = assertion.tolerance ?? 0;
    const diff = Math.abs(actual - assertion.expected);
    if (diff <= tolerance) {
      return { pass: true, actual };
    }
    return {
      pass: false,
      message: `Metric "${assertion.metric}" expected ${assertion.expected} ±${tolerance}, got ${actual.toFixed(4)}`,
      actual
    };
  }

  // ── Range check (min / max) ────────────────────────────────────────────
  const hasMin = assertion.expectedMin !== undefined;
  const hasMax = assertion.expectedMax !== undefined;

  if (!hasMin && !hasMax) {
    return {
      pass: false,
      message: `Assertion for "${assertion.metric}" has no expectedMin, expectedMax, or expected value`,
      actual
    };
  }

  if (hasMin && actual < assertion.expectedMin) {
    return {
      pass: false,
      message: `Metric "${assertion.metric}" expected ≥ ${assertion.expectedMin}, got ${actual.toFixed(4)}`,
      actual
    };
  }

  if (hasMax && actual > assertion.expectedMax) {
    return {
      pass: false,
      message: `Metric "${assertion.metric}" expected ≤ ${assertion.expectedMax}, got ${actual.toFixed(4)}`,
      actual
    };
  }

  return { pass: true, actual };
}

// ───────────────────────────────────────────────────────────────────────────
// Scenario-level evaluation
// ───────────────────────────────────────────────────────────────────────────

/**
 * Evaluate every assertion in a scenario against aggregated metrics.
 *
 * @param {Object} metrics         — aggregated metrics
 * @param {Object} scenario
 *   @param {string} scenario.id
 *   @param {boolean} [scenario.knownFailure] — if true, failures are expected
 *   @param {string} [scenario.knownFailureReason]
 *   @param {Array<Object>} scenario.assertions
 * @returns {ScenarioResult}
 */
export function evaluateScenario(metrics, scenario) {
  const results = [];
  let unexpectedFailures = 0;
  let knownFailures = 0;
  let passes = 0;

  for (const assertion of scenario.assertions || []) {
    const result = evaluateAssertion(metrics, assertion);
    results.push({ ...assertion, ...result });

    if (result.pass) {
      passes++;
    } else if (scenario.knownFailure) {
      knownFailures++;
    } else {
      unexpectedFailures++;
    }
  }

  const overallPass = scenario.knownFailure
    ? unexpectedFailures === 0
    : (unexpectedFailures === 0 && passes > 0);

  return {
    scenarioId: scenario.id,
    overallPass,
    passes,
    unexpectedFailures,
    knownFailures,
    knownFailure: scenario.knownFailure || false,
    knownFailureReason: scenario.knownFailureReason || null,
    assertionResults: results
  };
}

/**
 * Evaluate a batch of scenarios.
 *
 * @param {Array<{metrics:Object, scenario:Object}>} runs
 * @returns {Array<ScenarioResult>}
 */
export function evaluateAll(runs) {
  return runs.map(({ metrics, scenario }) => evaluateScenario(metrics, scenario));
}

// ───────────────────────────────────────────────────────────────────────────
// Result shaping for reporting
// ───────────────────────────────────────────────────────────────────────────

/**
 * Summarise a list of scenario results.
 *
 * @param {Array<ScenarioResult>} results
 * @returns {Object}
 */
export function summariseResults(results) {
  let total = 0;
  let passed = 0;
  let failed = 0;
  let knownFailed = 0;
  let skipped = 0;

  const failures = [];
  const knownFailuresList = [];

  for (const r of results) {
    if (r.scenarioId === undefined) {
      skipped++;
      continue;
    }

    total++;

    if (r.knownFailure) {
      knownFailed++;
      knownFailuresList.push(r);
    } else if (r.overallPass) {
      passed++;
    } else {
      failed++;
      failures.push(r);
    }
  }

  return {
    total,
    passed,
    failed,
    knownFailed,
    skipped,
    failures,
    knownFailures: knownFailuresList
  };
}
