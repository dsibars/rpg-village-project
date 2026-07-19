import test from 'node:test';
import assert from 'node:assert';
import { generateReportSync } from '../../../scripts/combat-lab/report.mjs';

test('generateReportSync: empty report', () => {
  const report = generateReportSync([], [], { total: 0, passed: 0, failed: 0, knownFailed: 0, skipped: 0, failures: [], knownFailures: [] });
  assert.ok(report.includes('# Combat Balance Lab Report'));
  assert.ok(report.includes('Total Scenarios'));
});

test('generateReportSync: single passing scenario', () => {
  const results = [{
    scenarioId: 'passing_test',
    overallPass: true,
    knownFailure: false,
    passes: 1,
    unexpectedFailures: 0,
    knownFailures: 0,
    assertionResults: [
      { metric: 'winRate', pass: true, actual: 0.82, expectedMin: 0.75 }
    ]
  }];
  const metrics = [{
    iterations: 10,
    wins: 8,
    losses: 2,
    winRate: 0.8,
    avgTurns: 7.5,
    minTurns: 5,
    maxTurns: 12,
    damage: { autoAttack: { total: 100, hits: 10, avgPerHit: 10, crits: 1, misses: 0 }, skill: {}, spell: {}, statusEffect: { total: 0, hits: 0, avgPerHit: 0, crits: 0, misses: 0 } },
    healing: { total: 0, ticks: 0 },
    statusEffects: {},
    items: {},
    resources: { staminaSpent: { total: 0, byHero: {} }, mpSpent: { total: 0, byHero: {} } }
  }];
  const summary = { total: 1, passed: 1, failed: 0, knownFailed: 0, skipped: 0, failures: [], knownFailures: [] };

  const report = generateReportSync(results, metrics, summary);
  assert.ok(report.includes('passing_test'));
  assert.ok(report.includes('✅'));
  assert.ok(report.includes('Win Rate'));
  assert.ok(report.includes('80.0%'));
});

test('generateReportSync: single failing scenario', () => {
  const results = [{
    scenarioId: 'failing_test',
    overallPass: false,
    knownFailure: false,
    passes: 0,
    unexpectedFailures: 1,
    knownFailures: 0,
    assertionResults: [
      { metric: 'winRate', pass: false, actual: 0.65, expectedMin: 0.75, message: 'Metric "winRate" expected ≥ 0.75, got 0.6500' }
    ]
  }];
  const metrics = [{
    iterations: 10,
    wins: 6,
    losses: 4,
    winRate: 0.6,
    avgTurns: 8,
    minTurns: 5,
    maxTurns: 15,
    damage: { autoAttack: { total: 80, hits: 8, avgPerHit: 10, crits: 0, misses: 2 }, skill: {}, spell: {}, statusEffect: { total: 0, hits: 0, avgPerHit: 0, crits: 0, misses: 0 } },
    healing: { total: 0, ticks: 0 },
    statusEffects: {},
    items: {},
    resources: { staminaSpent: { total: 0, byHero: {} }, mpSpent: { total: 0, byHero: {} } }
  }];
  const summary = { total: 1, passed: 0, failed: 1, knownFailed: 0, skipped: 0, failures: [results[0]], knownFailures: [] };

  const report = generateReportSync(results, metrics, summary);
  assert.ok(report.includes('failing_test'));
  assert.ok(report.includes('❌'));
  assert.ok(report.includes('UNEXPECTED FAILURE'));
  assert.ok(report.includes('winRate" expected ≥ 0.75'));
});

test('generateReportSync: known failure scenario', () => {
  const results = [{
    scenarioId: 'known_bug',
    overallPass: true,
    knownFailure: true,
    knownFailureReason: 'Bug #42: magicPower scaling not applied',
    passes: 0,
    unexpectedFailures: 0,
    knownFailures: 1,
    assertionResults: [
      { metric: 'damage.spell.Fireball.total', pass: false, actual: 30, expectedMin: 60, message: 'expected ≥ 60, got 30' }
    ]
  }];
  const metrics = [{
    iterations: 5,
    wins: 5,
    losses: 0,
    winRate: 1,
    avgTurns: 6,
    minTurns: 4,
    maxTurns: 8,
    damage: { autoAttack: { total: 0, hits: 0, avgPerHit: 0, crits: 0, misses: 0 }, skill: {}, spell: { Fireball: { total: 150, hits: 5, avgPerHit: 30, crits: 0, misses: 0 } }, statusEffect: { total: 0, hits: 0, avgPerHit: 0, crits: 0, misses: 0 } },
    healing: { total: 0, ticks: 0 },
    statusEffects: {},
    items: {},
    resources: { staminaSpent: { total: 0, byHero: {} }, mpSpent: { total: 0, byHero: {} } }
  }];
  const summary = { total: 1, passed: 0, failed: 0, knownFailed: 1, skipped: 0, failures: [], knownFailures: [results[0]] };

  const report = generateReportSync(results, metrics, summary);
  assert.ok(report.includes('known_bug'));
  assert.ok(report.includes('📝'));
  assert.ok(report.includes('Known Failures'));
  assert.ok(report.includes('Bug #42'));
  assert.ok(!report.includes('UNEXPECTED FAILURE'));
});

test('generateReportSync: mixed scenarios', () => {
  const results = [
    {
      scenarioId: 'pass_a',
      overallPass: true,
      knownFailure: false,
      passes: 1,
      unexpectedFailures: 0,
      knownFailures: 0,
      assertionResults: [{ metric: 'winRate', pass: true, actual: 1, expectedMin: 0.9 }]
    },
    {
      scenarioId: 'fail_b',
      overallPass: false,
      knownFailure: false,
      passes: 0,
      unexpectedFailures: 1,
      knownFailures: 0,
      assertionResults: [{ metric: 'avgTurns', pass: false, actual: 25, expectedMax: 15, message: 'expected ≤ 15, got 25' }]
    },
    {
      scenarioId: 'known_c',
      overallPass: true,
      knownFailure: true,
      knownFailureReason: 'Not yet implemented',
      passes: 0,
      unexpectedFailures: 0,
      knownFailures: 1,
      assertionResults: [{ metric: 'winRate', pass: false, actual: 0, expectedMin: 0.5, message: 'expected ≥ 0.5, got 0' }]
    }
  ];
  const metrics = [
    { iterations: 10, wins: 10, losses: 0, winRate: 1, avgTurns: 5, minTurns: 3, maxTurns: 8, damage: { autoAttack: { total: 100, hits: 10, avgPerHit: 10, crits: 0, misses: 0 }, skill: {}, spell: {}, statusEffect: { total: 0, hits: 0, avgPerHit: 0, crits: 0, misses: 0 } }, healing: { total: 0, ticks: 0 }, statusEffects: {}, items: {}, resources: { staminaSpent: { total: 0, byHero: {} }, mpSpent: { total: 0, byHero: {} } } },
    { iterations: 10, wins: 0, losses: 10, winRate: 0, avgTurns: 25, minTurns: 20, maxTurns: 30, damage: { autoAttack: { total: 50, hits: 5, avgPerHit: 10, crits: 0, misses: 5 }, skill: {}, spell: {}, statusEffect: { total: 0, hits: 0, avgPerHit: 0, crits: 0, misses: 0 } }, healing: { total: 0, ticks: 0 }, statusEffects: {}, items: {}, resources: { staminaSpent: { total: 0, byHero: {} }, mpSpent: { total: 0, byHero: {} } } },
    { iterations: 5, wins: 0, losses: 5, winRate: 0, avgTurns: 10, minTurns: 8, maxTurns: 12, damage: { autoAttack: { total: 0, hits: 0, avgPerHit: 0, crits: 0, misses: 0 }, skill: {}, spell: {}, statusEffect: { total: 0, hits: 0, avgPerHit: 0, crits: 0, misses: 0 } }, healing: { total: 0, ticks: 0 }, statusEffects: {}, items: {}, resources: { staminaSpent: { total: 0, byHero: {} }, mpSpent: { total: 0, byHero: {} } } }
  ];
  const summary = { total: 3, passed: 1, failed: 1, knownFailed: 1, skipped: 0, failures: [results[1]], knownFailures: [results[2]] };

  const report = generateReportSync(results, metrics, summary);
  assert.ok(report.includes('pass_a'));
  assert.ok(report.includes('fail_b'));
  assert.ok(report.includes('known_c'));
  assert.ok(report.includes('Scenario Catalog'));
  assert.ok(report.includes('Unexpected Failures'));
  assert.ok(report.includes('Known Failures'));
});

test('generateReportSync: spell and skill damage in tables', () => {
  const results = [{
    scenarioId: 'spell_test',
    overallPass: true,
    knownFailure: false,
    passes: 1,
    unexpectedFailures: 0,
    knownFailures: 0,
    assertionResults: [{ metric: 'damage.spell.Fireball.total', pass: true, actual: 150, expectedMin: 100 }]
  }];
  const metrics = [{
    iterations: 5,
    wins: 5,
    losses: 0,
    winRate: 1,
    avgTurns: 4,
    minTurns: 3,
    maxTurns: 5,
    damage: {
      autoAttack: { total: 20, hits: 2, avgPerHit: 10, crits: 0, misses: 0 },
      skill: { power_strike: { total: 45, hits: 3, avgPerHit: 15, crits: 1, misses: 0 } },
      spell: { Fireball: { total: 150, hits: 5, avgPerHit: 30, crits: 0, misses: 0 } },
      statusEffect: { total: 0, hits: 0, avgPerHit: 0, crits: 0, misses: 0 }
    },
    healing: { total: 0, ticks: 0 },
    statusEffects: {},
    items: {},
    resources: { staminaSpent: { total: 0, byHero: {} }, mpSpent: { total: 0, byHero: {} } }
  }];
  const summary = { total: 1, passed: 1, failed: 0, knownFailed: 0, skipped: 0, failures: [], knownFailures: [] };

  const report = generateReportSync(results, metrics, summary);
  assert.ok(report.includes('Spell "Fireball"'));
  assert.ok(report.includes('Skill "power_strike"'));
  assert.ok(report.includes('Auto-Attack Dmg'));
});

test('generateReportSync: validates array length mismatch', () => {
  assert.throws(() => {
    generateReportSync([{ scenarioId: 'a' }], [], { total: 0, passed: 0, failed: 0, knownFailed: 0, skipped: 0, failures: [], knownFailures: [] });
  }, /same length/);
});
