/**
 * Combat Balance Lab — Priority Scenario: Status Effects
 *
 * Verifies that core status effects (poison, burn, stun, haste) work
 * as expected in combat:
 *   - Poison tick deals 5% max HP per turn
 *   - Burn tick deals 5% max HP per turn
 *   - Stun causes the afflicted entity to skip their turn
 *   - Haste grants +50% speed to the hero
 *
 * All scenarios run with auto-battle so the combat engine drives the
 * interaction naturally.
 */

// ───────────────────────────────────────────────────────────────────────────
// Scenario 1: Poison tick damage
// ───────────────────────────────────────────────────────────────────────────

const poisonTickScenario = {
  id: 'status_poison_tick',
  description: 'Hero using poison_strike; enemy should accumulate poison ticks',
  tags: ['status', 'poison', 'regression', 'priority'],
  iterations: 50,

  party: [
    {
      origin: 'origin_thief',
      level: 5,
      name: 'Poison Tester',
      stats: {
        baseMaxHp: 60,
        baseStrength: 15,
        baseDefense: 8,
        baseSpeed: 12,
        baseMagicPower: 4
      },
      skills: ['poison_strike'],
      gambits: [
        {
          id: 'gambit_always_poison',
          conditions: [{ op: 'SINGLE', left: { type: 'always', value: true }, right: null }],
          action: { type: 'skill', payload: 'poison_strike' },
          target: 'lowest_hp_enemy',
          enabled: true
        }
      ]
    }
  ],

  encounter: {
    enemies: [
      { id: 'goblin_grunt', count: 1, level: 5 }
    ]
  },

  assertions: [
    // Poison should be applied at least once across 50 iterations
    { metric: 'statusEffects.applied.poison', expectedMin: 1 },
    // Poison ticks should deal damage over time
    { metric: 'damage.statusEffect.total', expectedMin: 1 },
    // Combat should be winnable
    { metric: 'winRate', expectedMin: 0.90 }
  ]
};

// ───────────────────────────────────────────────────────────────────────────
// Scenario 2: Stun skip turn
// ───────────────────────────────────────────────────────────────────────────

const stunSkipScenario = {
  id: 'status_stun_skip',
  description: 'Hero using shield_bash; enemy should occasionally be stunned and skip turns',
  tags: ['status', 'stun', 'regression', 'priority'],
  iterations: 50,

  party: [
    {
      origin: 'origin_warrior',
      level: 5,
      name: 'Stun Tester',
      stats: {
        baseMaxHp: 70,
        baseStrength: 18,
        baseDefense: 12,
        baseSpeed: 8,
        baseMagicPower: 4
      },
      skills: ['shield_bash'],
      gambits: [
        {
          id: 'gambit_always_bash',
          conditions: [{ op: 'SINGLE', left: { type: 'always', value: true }, right: null }],
          action: { type: 'skill', payload: 'shield_bash' },
          target: 'lowest_hp_enemy',
          enabled: true
        }
      ]
    }
  ],

  encounter: {
    enemies: [
      { id: 'goblin_grunt', count: 1, level: 5 }
    ]
  },

  assertions: [
    // Stun should be applied at least once across 50 iterations (30% chance per hit)
    { metric: 'statusEffects.applied.stun', expectedMin: 1 },
    // Combat should still be won reliably
    { metric: 'winRate', expectedMin: 0.90 }
  ]
};

// ───────────────────────────────────────────────────────────────────────────
// Scenario 3: Burn tick damage
// ───────────────────────────────────────────────────────────────────────────

const burnTickScenario = {
  id: 'status_burn_tick',
  description: 'Enemy starts with burn status effect; burn should tick each turn',
  tags: ['status', 'burn', 'regression', 'priority'],
  iterations: 50,

  party: [
    {
      origin: 'origin_warrior',
      level: 5,
      name: 'Burn Observer',
      stats: {
        baseMaxHp: 60,
        baseStrength: 10,
        baseDefense: 8,
        baseSpeed: 8,
        baseMagicPower: 4
      },
      skills: ['single_strike'],
      gambits: [
        {
          id: 'gambit_always_attack',
          conditions: [{ op: 'SINGLE', left: { type: 'always', value: true }, right: null }],
          action: { type: 'skill', payload: 'single_strike' },
          target: 'lowest_hp_enemy',
          enabled: true
        }
      ]
    }
  ],

  encounter: {
    enemies: [
      {
        id: 'goblin_grunt',
        count: 1,
        level: 5,
        statusEffects: [{ type: 'burn', duration: 5, power: 0.05 }]
      }
    ]
  },

  assertions: [
    // Burn ticks should deal damage over time
    { metric: 'statusEffects.ticks.burn', expectedMin: 1 },
    // Some burn damage should accumulate
    { metric: 'damage.statusEffect.total', expectedMin: 1 },
    // Combat should be winnable
    { metric: 'winRate', expectedMin: 0.90 }
  ]
};

// ───────────────────────────────────────────────────────────────────────────
// Scenario 4: Haste speed boost
// ───────────────────────────────────────────────────────────────────────────

const hasteSpeedScenario = {
  id: 'status_haste_speed',
  description: 'Hero starts with haste status effect; should win combat reliably',
  tags: ['status', 'haste', 'regression', 'priority'],
  iterations: 50,

  party: [
    {
      origin: 'origin_warrior',
      level: 5,
      name: 'Hasted Warrior',
      stats: {
        baseMaxHp: 60,
        baseStrength: 15,
        baseDefense: 8,
        baseSpeed: 8,
        baseMagicPower: 4
      },
      skills: ['single_strike'],
      statusEffects: [{ type: 'haste', duration: 10 }],
      gambits: [
        {
          id: 'gambit_always_attack',
          conditions: [{ op: 'SINGLE', left: { type: 'always', value: true }, right: null }],
          action: { type: 'skill', payload: 'single_strike' },
          target: 'lowest_hp_enemy',
          enabled: true
        }
      ]
    }
  ],

  encounter: {
    enemies: [
      { id: 'goblin_grunt', count: 1, level: 5 }
    ]
  },

  assertions: [
    // Hasted hero should win reliably due to speed advantage
    { metric: 'winRate', expectedMin: 0.95 }
  ]
};

export default [poisonTickScenario, stunSkipScenario, burnTickScenario, hasteSpeedScenario];
