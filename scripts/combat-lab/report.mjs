/**
 * Combat Balance Lab — Report Generator
 *
 * Produces a human-readable Markdown report from scenario results
 * and aggregated combat metrics.
 *
 * Design notes
 * ─────────────
 * • Report is the primary output of the lab. It answers three questions:
 *   1. Is combat broken right now?   → Summary pass/fail count
 *   2. Where is it broken?           → Per-scenario tables + failures
 *   3. How did we get here?          → Sample combat log links
 * • Each scenario gets a section with its metrics table and assertion results.
 * • Known failures are reported separately so they are not hidden.
 * • The report is written as a single Markdown string for flexibility;
 *   the caller decides whether to write to file or stdout.
 */

import { resolveMetric } from './metrics.mjs';

// ───────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────

function fmtNum(n, digits = 2) {
  if (n === undefined || n === null) return '—';
  return typeof n === 'number' ? n.toFixed(digits) : String(n);
}

function fmtPct(n, digits = 1) {
  if (n === undefined || n === null) return '—';
  return `${(n * 100).toFixed(digits)}%`;
}

function passFailIcon(pass) {
  return pass ? '✅' : '❌';
}

function indent(lines, spaces = 2) {
  const pad = ' '.repeat(spaces);
  return lines.split('\n').map(l => (l.trim() === '' ? '' : pad + l)).join('\n');
}

// ───────────────────────────────────────────────────────────────────────────
// Sections
// ───────────────────────────────────────────────────────────────────────────

function generateHeader(summary) {
  const now = new Date().toISOString();
  return `# Combat Balance Lab Report

Generated: ${now}

`;
}

function generateExecutiveSummary(summary) {
  const { total, passed, failed, knownFailed, skipped } = summary;
  const unexpected = failed;
  const status = unexpected === 0 ? '✅ ALL CLEAR' : `❌ ${unexpected} UNEXPECTED FAILURE${unexpected === 1 ? '' : 'S'}`;

  let md = `## Executive Summary

${status}

| Metric | Count |
|--------|-------|
| Total Scenarios | ${total} |
| Passed | ${passed} |
| Unexpected Failures | ${failed} |
| Known Failures | ${knownFailed} |
| Skipped | ${skipped} |

`;

  if (unexpected === 0 && failed === 0 && knownFailed === 0) {
    md += `All ${total} scenario(s) passed. Combat balance is within expected parameters.\n\n`;
  } else if (unexpected === 0 && knownFailed > 0) {
    md += `No unexpected failures. ${knownFailed} known failure(s) are tracked and expected.\n\n`;
  } else if (unexpected > 0) {
    md += `**${unexpected} unexpected failure(s) detected.** Review the Failed Assertions section below.\n\n`;
  }

  return md;
}

function generateScenarioDetail(result, metrics) {
  const { scenarioId, overallPass, knownFailure, knownFailureReason, assertionResults } = result;
  const icon = knownFailure ? '📝' : passFailIcon(overallPass);
  const tag = knownFailure ? ' [KNOWN FAILURE]' : '';

  let md = `### ${icon} ${scenarioId}${tag}\n\n`;

  if (knownFailure && knownFailureReason) {
    md += `> **Known failure reason:** ${knownFailureReason}\n\n`;
  }

  // Metrics table
  md += `#### Metrics\n\n`;
  md += `| Metric | Value |\n`;
  md += `|--------|-------|\n`;
  md += `| Iterations | ${metrics?.iterations ?? '—'} |\n`;
  md += `| Win Rate | ${fmtPct(metrics?.winRate)} |\n`;
  md += `| Avg Turns | ${fmtNum(metrics?.avgTurns, 1)} |\n`;
  md += `| Min Turns | ${metrics?.minTurns ?? '—'} |\n`;
  md += `| Max Turns | ${metrics?.maxTurns ?? '—'} |\n`;

  if (metrics?.damage?.autoAttack?.total > 0) {
    md += `| Auto-Attack Dmg | ${fmtNum(metrics.damage.autoAttack.total)} (${metrics.damage.autoAttack.hits} hits) |\n`;
  }

  const spellNames = metrics?.damage?.spell ? Object.keys(metrics.damage.spell) : [];
  if (spellNames.length > 0) {
    for (const name of spellNames) {
      const b = metrics.damage.spell[name];
      md += `| Spell "${name}" | ${fmtNum(b.total)} (${b.hits} hits, avg ${fmtNum(b.avgPerHit)}/hit) |\n`;
    }
  }

  const skillNames = metrics?.damage?.skill ? Object.keys(metrics.damage.skill) : [];
  if (skillNames.length > 0) {
    for (const name of skillNames) {
      const b = metrics.damage.skill[name];
      md += `| Skill "${name}" | ${fmtNum(b.total)} (${b.hits} hits) |\n`;
    }
  }

  if (metrics?.damage?.statusEffect?.total > 0) {
    md += `| Status Effect Dmg | ${fmtNum(metrics.damage.statusEffect.total)} (${metrics.damage.statusEffect.hits} ticks) |\n`;
  }

  if (metrics?.healing?.total > 0) {
    md += `| Healing | ${fmtNum(metrics.healing.total)} (${metrics.healing.ticks} ticks) |\n`;
  }

  md += `\n`;

  // Assertions table
  md += `#### Assertions\n\n`;
  md += `| # | Metric | Expected | Actual | Result |\n`;
  md += `|---|--------|----------|--------|--------|\n`;

  for (let i = 0; i < assertionResults.length; i++) {
    const ar = assertionResults[i];
    const expected = ar.expected !== undefined
      ? `${ar.expected} ±${ar.tolerance ?? 0}`
      : ar.expectedMin !== undefined && ar.expectedMax !== undefined
        ? `[${ar.expectedMin}, ${ar.expectedMax}]`
        : ar.expectedMin !== undefined
          ? `≥ ${ar.expectedMin}`
          : ar.expectedMax !== undefined
            ? `≤ ${ar.expectedMax}`
            : '—';
    md += `| ${i + 1} | ${ar.metric} | ${expected} | ${fmtNum(ar.actual)} | ${passFailIcon(ar.pass)} |\n`;
  }

  md += `\n`;

  // Failure details
  const failures = assertionResults.filter(ar => !ar.pass);
  if (failures.length > 0) {
    md += `#### Failure Details\n\n`;
    for (const f of failures) {
      md += `- **${f.metric}**: ${f.message}\n`;
    }
    md += `\n`;
  }

  return md;
}

function generateFailedAssertionsSection(results, allMetrics) {
  const unexpectedFailures = [];

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.knownFailure) continue;
    const fails = r.assertionResults?.filter(ar => !ar.pass) || [];
    if (fails.length > 0) {
      unexpectedFailures.push({ result: r, metrics: allMetrics[i], fails });
    }
  }

  if (unexpectedFailures.length === 0) return '';

  let md = `## Unexpected Failures\n\n`;
  for (const { result, metrics, fails } of unexpectedFailures) {
    md += `### ❌ ${result.scenarioId}\n\n`;
    if (metrics) {
      md += `- Win Rate: ${fmtPct(metrics.winRate)} | Avg Turns: ${fmtNum(metrics.avgTurns, 1)} | Iterations: ${metrics.iterations}\n`;
    }
    for (const f of fails) {
      md += `- **${f.metric}**: ${f.message}\n`;
    }
    md += `\n`;
  }

  return md;
}

function generateKnownFailuresSection(results, allMetrics) {
  const known = [];

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (!r.knownFailure) continue;
    const fails = r.assertionResults?.filter(ar => !ar.pass) || [];
    known.push({ result: r, metrics: allMetrics[i], fails });
  }

  if (known.length === 0) return '';

  let md = `## Known Failures\n\n`;
  md += `These scenarios are expected to fail until the underlying issues are resolved.\n\n`;

  for (const { result, metrics, fails } of known) {
    md += `### 📝 ${result.scenarioId}\n\n`;
    if (result.knownFailureReason) {
      md += `> ${result.knownFailureReason}\n\n`;
    }
    if (metrics) {
      md += `- Win Rate: ${fmtPct(metrics.winRate)} | Avg Turns: ${fmtNum(metrics.avgTurns, 1)} | Iterations: ${metrics.iterations}\n`;
    }
    for (const f of fails) {
      md += `- **${f.metric}**: ${f.message}\n`;
    }
    md += `\n`;
  }

  return md;
}

function generateScenarioCatalog(results, allMetrics) {
  let md = `## Scenario Catalog\n\n`;
  md += `| Scenario | Status | Win Rate | Avg Turns | Assertions |\n`;
  md += `|----------|--------|----------|-----------|------------|\n`;

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const m = allMetrics[i];
    const status = r.knownFailure ? '📝 Known' : r.overallPass ? '✅ Pass' : '❌ Fail';
    const winRate = fmtPct(m?.winRate);
    const avgTurns = fmtNum(m?.avgTurns, 1);
    const assertions = `${r.passes}/${r.assertionResults?.length ?? 0}`;
    md += `| ${r.scenarioId} | ${status} | ${winRate} | ${avgTurns} | ${assertions} |\n`;
  }

  md += `\n`;
  return md;
}

function generatePerScenarioDetails(results, allMetrics) {
  let md = `## Per-Scenario Details\n\n`;

  for (let i = 0; i < results.length; i++) {
    md += generateScenarioDetail(results[i], allMetrics[i]);
  }

  return md;
}

// ───────────────────────────────────────────────────────────────────────────
// Public API
// ───────────────────────────────────────────────────────────────────────────

/**
 * Generate a full Markdown report from scenario results and their metrics.
 *
 * @param {Array<Object>} results   — scenario results from evaluateScenario()
 * @param {Array<Object>} metrics   — parallel array of aggregated metrics
 * @param {Object} [options]
 *   @param {string} [options.logDir] — relative path to log directory for links
 * @returns {string} Markdown report
 */
export async function generateReport(results, metrics, options = {}) {
  if (!Array.isArray(results)) throw new Error('generateReport: results must be an array');
  if (!Array.isArray(metrics)) throw new Error('generateReport: metrics must be an array');
  if (results.length !== metrics.length) {
    throw new Error('generateReport: results and metrics arrays must have the same length');
  }

  const { summariseResults } = await import('./assertions.mjs');
  const summary = summariseResults(results);

  let report = '';
  report += generateHeader(summary);
  report += generateExecutiveSummary(summary);
  report += generateScenarioCatalog(results, metrics);
  report += generateFailedAssertionsSection(results, metrics);
  report += generateKnownFailuresSection(results, metrics);
  report += generatePerScenarioDetails(results, metrics);

  return report;
}

/**
 * Synchronous version of generateReport.
 * Use this when you already have the summary and don't need dynamic import.
 *
 * @param {Array<Object>} results
 * @param {Array<Object>} metrics
 * @param {Object} [summary] — pre-computed summary from summariseResults()
 * @returns {string}
 */
export function generateReportSync(results, metrics, summary) {
  if (!Array.isArray(results)) throw new Error('generateReportSync: results must be an array');
  if (!Array.isArray(metrics)) throw new Error('generateReportSync: metrics must be an array');
  if (results.length !== metrics.length) {
    throw new Error('generateReportSync: results and metrics arrays must have the same length');
  }

  let report = '';
  report += generateHeader(summary);
  report += generateExecutiveSummary(summary);
  report += generateScenarioCatalog(results, metrics);
  report += generateFailedAssertionsSection(results, metrics);
  report += generateKnownFailuresSection(results, metrics);
  report += generatePerScenarioDetails(results, metrics);

  return report;
}
