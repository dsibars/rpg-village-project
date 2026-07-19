import { evaluateAssertion, evaluateScenario, evaluateAll, summariseResults } from '../../../scripts/combat-lab/assertions.mjs';
import test from 'node:test';
import assert from 'node:assert';

const sampleMetrics = {
    winRate: 0.82,
    avgTurns: 7.5,
    damage: {
        spell: {
            Fireball: {
                total: 500,
                hits: 10,
                avgPerHit: 50,
                crits: 2,
                misses: 0
            }
        }
    }
};

test('evaluateAssertion: passes on expectedMin', () => {
    const result = evaluateAssertion(sampleMetrics, { metric: 'winRate', expectedMin: 0.75 });
    assert.strictEqual(result.pass, true);
    assert.strictEqual(result.actual, 0.82);
});

test('evaluateAssertion: fails on expectedMin', () => {
    const result = evaluateAssertion(sampleMetrics, { metric: 'winRate', expectedMin: 0.85 });
    assert.strictEqual(result.pass, false);
    assert.ok(result.message.includes('expected ≥ 0.85'));
});

test('evaluateAssertion: passes on expectedMax', () => {
    const result = evaluateAssertion(sampleMetrics, { metric: 'avgTurns', expectedMax: 10 });
    assert.strictEqual(result.pass, true);
});

test('evaluateAssertion: fails on expectedMax', () => {
    const result = evaluateAssertion(sampleMetrics, { metric: 'avgTurns', expectedMax: 5 });
    assert.strictEqual(result.pass, false);
    assert.ok(result.message.includes('expected ≤ 5'));
});

test('evaluateAssertion: passes on exact expected', () => {
    const result = evaluateAssertion(sampleMetrics, { metric: 'winRate', expected: 0.82 });
    assert.strictEqual(result.pass, true);
});

test('evaluateAssertion: passes on exact expected with tolerance', () => {
    const result = evaluateAssertion(sampleMetrics, { metric: 'winRate', expected: 0.80, tolerance: 0.05 });
    assert.strictEqual(result.pass, true);
});

test('evaluateAssertion: fails on exact expected with tolerance', () => {
    const result = evaluateAssertion(sampleMetrics, { metric: 'winRate', expected: 0.70, tolerance: 0.05 });
    assert.strictEqual(result.pass, false);
    assert.ok(result.message.includes('expected 0.7 ±0.05'));
});

test('evaluateAssertion: passes on range (min+max)', () => {
    const result = evaluateAssertion(sampleMetrics, { metric: 'winRate', expectedMin: 0.75, expectedMax: 0.90 });
    assert.strictEqual(result.pass, true);
});

test('evaluateAssertion: fails on range (outside)', () => {
    const result = evaluateAssertion(sampleMetrics, { metric: 'winRate', expectedMin: 0.85, expectedMax: 0.95 });
    assert.strictEqual(result.pass, false);
});

test('evaluateAssertion: dotted path resolution', () => {
    const result = evaluateAssertion(sampleMetrics, { metric: 'damage.spell.Fireball.total', expected: 500 });
    assert.strictEqual(result.pass, true);
    assert.strictEqual(result.actual, 500);
});

test('evaluateAssertion: missing metric', () => {
    const result = evaluateAssertion(sampleMetrics, { metric: 'healing.total', expectedMin: 0 });
    assert.strictEqual(result.pass, false);
    assert.ok(result.message.includes('not found'));
});

test('evaluateAssertion: no constraint', () => {
    const result = evaluateAssertion(sampleMetrics, { metric: 'winRate' });
    assert.strictEqual(result.pass, false);
    assert.ok(result.message.includes('no expectedMin, expectedMax, or expected'));
});

test('evaluateAssertion: nested avgPerHit', () => {
    const result = evaluateAssertion(sampleMetrics, { metric: 'damage.spell.Fireball.avgPerHit', expectedMin: 40, expectedMax: 60 });
    assert.strictEqual(result.pass, true);
    assert.strictEqual(result.actual, 50);
});

test('evaluateScenario: all pass', () => {
    const scenario = {
        id: 'passing_test',
        assertions: [
            { metric: 'winRate', expectedMin: 0.75 },
            { metric: 'avgTurns', expectedMax: 10 }
        ]
    };
    const result = evaluateScenario(sampleMetrics, scenario);
    assert.strictEqual(result.overallPass, true);
    assert.strictEqual(result.passes, 2);
    assert.strictEqual(result.unexpectedFailures, 0);
});

test('evaluateScenario: unexpected failure', () => {
    const scenario = {
        id: 'failing_test',
        assertions: [
            { metric: 'winRate', expectedMin: 0.85 }
        ]
    };
    const result = evaluateScenario(sampleMetrics, scenario);
    assert.strictEqual(result.overallPass, false);
    assert.strictEqual(result.unexpectedFailures, 1);
    assert.strictEqual(result.knownFailure, false);
});

test('evaluateScenario: knownFailure masks failures', () => {
    const scenario = {
        id: 'known_failing_test',
        knownFailure: true,
        knownFailureReason: 'Bug #42: magicPower scaling not applied',
        assertions: [
            { metric: 'winRate', expectedMin: 0.85 }
        ]
    };
    const result = evaluateScenario(sampleMetrics, scenario);
    assert.strictEqual(result.overallPass, true);
    assert.strictEqual(result.knownFailures, 1);
    assert.strictEqual(result.unexpectedFailures, 0);
});

test('evaluateScenario: knownFailure still counts passes', () => {
    const scenario = {
        id: 'mixed_known',
        knownFailure: true,
        assertions: [
            { metric: 'winRate', expectedMin: 0.75 },
            { metric: 'winRate', expectedMin: 0.85 }
        ]
    };
    const result = evaluateScenario(sampleMetrics, scenario);
    assert.strictEqual(result.passes, 1);
    assert.strictEqual(result.knownFailures, 1);
    assert.strictEqual(result.overallPass, true);
});

test('evaluateScenario: no assertions', () => {
    const scenario = { id: 'empty_assertions', assertions: [] };
    const result = evaluateScenario(sampleMetrics, scenario);
    assert.strictEqual(result.overallPass, false);
    assert.strictEqual(result.passes, 0);
});

test('evaluateAll: multiple scenarios', () => {
    const runs = [
        {
            metrics: sampleMetrics,
            scenario: { id: 's1', assertions: [{ metric: 'winRate', expectedMin: 0.75 }] }
        },
        {
            metrics: sampleMetrics,
            scenario: { id: 's2', knownFailure: true, assertions: [{ metric: 'winRate', expectedMin: 0.85 }] }
        }
    ];
    const results = evaluateAll(runs);
    assert.strictEqual(results.length, 2);
    assert.strictEqual(results[0].overallPass, true);
    assert.strictEqual(results[1].overallPass, true);
    assert.strictEqual(results[1].knownFailure, true);
});

test('summariseResults: mixed outcomes', () => {
    const results = [
        { scenarioId: 'pass', overallPass: true, knownFailure: false },
        { scenarioId: 'fail', overallPass: false, knownFailure: false },
        { scenarioId: 'known', overallPass: true, knownFailure: true },
        { scenarioId: undefined, overallPass: false, knownFailure: false }
    ];
    const summary = summariseResults(results);
    assert.strictEqual(summary.total, 3);
    assert.strictEqual(summary.passed, 1);
    assert.strictEqual(summary.failed, 1);
    assert.strictEqual(summary.knownFailed, 1);
    assert.strictEqual(summary.skipped, 1);
    assert.strictEqual(summary.failures.length, 1);
    assert.strictEqual(summary.knownFailures.length, 1);
});

test('summariseResults: all pass', () => {
    const results = [
        { scenarioId: 'a', overallPass: true, knownFailure: false },
        { scenarioId: 'b', overallPass: true, knownFailure: false }
    ];
    const summary = summariseResults(results);
    assert.strictEqual(summary.total, 2);
    assert.strictEqual(summary.passed, 2);
    assert.strictEqual(summary.failed, 0);
    assert.strictEqual(summary.knownFailed, 0);
});

test('summariseResults: empty', () => {
    const summary = summariseResults([]);
    assert.strictEqual(summary.total, 0);
    assert.strictEqual(summary.passed, 0);
});
