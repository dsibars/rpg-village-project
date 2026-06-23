/**
 * Combat Balance Lab — Priority Scenario: Gambit Conditions
 *
 * Verifies that gambit conditions `enemy_element`, `enemy_type`, and
 * `battle_phase` are evaluated correctly during combat.
 *
 * KNOWN FAILURE: These conditions are declared in GambitService.CONDITION_TYPES
 * but are not evaluated in `_checkCondition()`, OR the `battleState` object
 * is never passed by BattleService so the condition always receives `{}`.
 *
 * - `enemy_element` — missing from `_checkCondition` switch entirely.
 * - `enemy_type` — missing from `_checkCondition` switch entirely.
 * - `battle_phase` — logic exists (`battleState.phase === value`) but
 *   BattleService calls `evaluate(actor, allies, enemies)` with no
 *   `battleState`, so `phase` is always `undefined` and never matches.
 *
 * Test design: each sub-scenario gives the hero a HIGH-priority gambit
 * that should use `power_strike` if the condition matched.  A lower-priority
 * `always` gambit falls back to `single_strike` (basic attack).  If the
 * condition worked, `power_strike` would appear in the combat log.  Because
 * it doesn't, all hits go to `autoAttack` / `single_strike` and
 * `damage.skill.power_strike` stays at 0.
 */

// ───────────────────────────────────────────────────────────────────────────
// Shared hero template — warrior with both single_strike and power_strike
// ───────────────────────────────────────────────────────────────────────────

function makeWarrior(overrides = {}) {
  return {
    origin: 'origin_warrior',
    level: 5,
    name: 'Gambit Test Warrior',
    stats: {
      baseStrength: 18,
      baseDefense: 12,
      baseSpeed: 8,
      baseMagicPower: 4
    },
    skills: ['single_strike', 'power_strike'],
    ...overrides
  };
}

// ───────────────────────────────────────────────────────────────────────────
// Scenario 1: enemy_element
// ───────────────────────────────────────────────────────────────────────────

const enemyElementScenario = {
  id: 'gambit_enemy_element',
  description: 'Gambit enemy_element condition should trigger power_strike against water enemies',
  tags: ['gambits', 'regression', 'priority'],
  iterations: 50,
  knownFailure: true,
  knownFailureReason: 'enemy_element condition is declared in GambitService.CONDITION_TYPES but not implemented in _checkCondition(). The switch-case falls through to `default: return false`.',

  party: [
    makeWarrior({
      gambits: [
        {
          id: 'gambit_water_weakness',
          conditions: [{ op: 'SINGLE', left: { type: 'enemy_element', operator: '=', value: 'water' }, right: null }],
          action: { type: 'skill', payload: 'power_strike' },
          target: 'lowest_hp_enemy',
          enabled: true
        },
        {
          id: 'gambit_fallback',
          conditions: [{ op: 'SINGLE', left: { type: 'always', value: true }, right: null }],
          action: { type: 'skill', payload: 'single_strike' },
          target: 'lowest_hp_enemy',
          enabled: true
        }
      ]
    })
  ],

  encounter: {
    enemies: [
      { id: 'water_spirit_minor', count: 1, level: 1 }
    ]
  },

  assertions: [
    // If enemy_element worked, power_strike should be used heavily
    { metric: 'damage.skill.power_strike.hits', expectedMin: 1 },
    // Should win reliably against a weak enemy
    { metric: 'winRate', expectedMin: 0.95 }
  ]
};

// ───────────────────────────────────────────────────────────────────────────
// Scenario 2: enemy_type
// ───────────────────────────────────────────────────────────────────────────

const enemyTypeScenario = {
  id: 'gambit_enemy_type',
  description: 'Gambit enemy_type condition should trigger power_strike against beasts',
  tags: ['gambits', 'regression', 'priority'],
  iterations: 50,
  knownFailure: true,
  knownFailureReason: 'enemy_type condition is declared in GambitService.CONDITION_TYPES but not implemented in _checkCondition(). The switch-case falls through to `default: return false`.',

  party: [
    makeWarrior({
      gambits: [
        {
          id: 'gambit_beast_slayer',
          conditions: [{ op: 'SINGLE', left: { type: 'enemy_type', operator: '=', value: 'beast' }, right: null }],
          action: { type: 'skill', payload: 'power_strike' },
          target: 'lowest_hp_enemy',
          enabled: true
        },
        {
          id: 'gambit_fallback',
          conditions: [{ op: 'SINGLE', left: { type: 'always', value: true }, right: null }],
          action: { type: 'skill', payload: 'single_strike' },
          target: 'lowest_hp_enemy',
          enabled: true
        }
      ]
    })
  ],

  encounter: {
    enemies: [
      { id: 'slime_green', count: 1, level: 1 }
    ]
  },

  assertions: [
    // If enemy_type worked, power_strike should be used heavily
    { metric: 'damage.skill.power_strike.hits', expectedMin: 1 },
    // Should win reliably
    { metric: 'winRate', expectedMin: 0.95 }
  ]
};

// ───────────────────────────────────────────────────────────────────────────
// Scenario 3: battle_phase
// ───────────────────────────────────────────────────────────────────────────

const battlePhaseScenario = {
  id: 'gambit_battle_phase',
  description: 'Gambit battle_phase condition should be evaluated with real battle state',
  tags: ['gambits', 'regression', 'priority'],
  iterations: 50,
  knownFailure: true,
  knownFailureReason: 'battle_phase logic exists in GambitService._checkCondition (battleState.phase === value) but BattleService.performAutoAction calls evaluate(actor, allies, enemies) without passing battleState. Therefore phase is always undefined and the condition never matches.',

  party: [
    makeWarrior({
      gambits: [
        {
          id: 'gambit_early_phase',
          conditions: [{ op: 'SINGLE', left: { type: 'battle_phase', operator: '=', value: 'early' }, right: null }],
          action: { type: 'skill', payload: 'power_strike' },
          target: 'lowest_hp_enemy',
          enabled: true
        },
        {
          id: 'gambit_fallback',
          conditions: [{ op: 'SINGLE', left: { type: 'always', value: true }, right: null }],
          action: { type: 'skill', payload: 'single_strike' },
          target: 'lowest_hp_enemy',
          enabled: true
        }
      ]
    })
  ],

  encounter: {
    enemies: [
      { id: 'slime_green', count: 1, level: 1 }
    ]
  },

  assertions: [
    // If battle_phase worked, at least some power_strike hits should occur
    // (even if "early" is only turns 1-3, across 50 iterations that's 50+ early turns)
    { metric: 'damage.skill.power_strike.hits', expectedMin: 1 },
    // Should win reliably
    { metric: 'winRate', expectedMin: 0.95 }
  ]
};

export default [enemyElementScenario, enemyTypeScenario, battlePhaseScenario];
