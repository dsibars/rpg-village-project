# Implementation Plan: Gambit Missing Condition Evaluators

## Goal
Complete the Gambit condition system by implementing evaluation logic for the 4 missing condition types: `enemy_element`, `enemy_type`, `ally_mp`, and `ally_status`. These are declared in `docs/shared/combat/gambit_system.md` but lack code implementation, causing rules that use them to silently fall through to the fallback (basic attack).

> **Scope:** 4 evaluator functions + tests. No UI changes. No changes to existing working conditions.

---

## Phase 1 — Documentation Update

No doc changes needed. `docs/shared/combat/gambit_system.md` already specifies these conditions in detail.

Verify the condition table is complete (it is):
- `enemy_element`: Fire/Ice/etc. — "Enemy is weak to Fire"
- `enemy_type`: Beast/Undead/etc. — "Enemy is Undead"
- `ally_mp`: `%` threshold — "Ally MP < 20%"
- `ally_status`: Poison/Stun/etc. — "Ally is Poisoned"

---

## Phase 2 — Engine Changes

**File:** `js/engine/shared/combat/services/GambitEvaluator.js` (or equivalent gambit condition evaluator)

Locate the existing condition evaluation switch/if-chain. The following 9 conditions should already be implemented:
- `enemy_count`, `enemy_hp`, `enemy_status`, `ally_hp`, `self_hp`, `self_mp`, `self_sta`, `turn_count`, `battle_phase`, `always`

Add the 4 missing evaluators following the same patterns.

### 2.1 `enemy_element`

```js
case 'enemy_element': {
    // condition.param: element string, e.g. 'fire', 'water', 'wind', 'storm', 'earth', 'neutral'
    // condition.operator: not used (presence check)
    const targetElement = condition.param;
    const enemies = battleState.enemies.filter(e => e.hp > 0);
    const matchExists = enemies.some(e => e.element === targetElement);
    return matchExists;
}
```

### 2.2 `enemy_type`

```js
case 'enemy_type': {
    // condition.param: type string, e.g. 'beast', 'humanoid', 'undead', 'elemental', 'dragon'
    const targetType = condition.param;
    const enemies = battleState.enemies.filter(e => e.hp > 0);
    const matchExists = enemies.some(e => e.type === targetType);
    return matchExists;
}
```

### 2.3 `ally_mp`

```js
case 'ally_mp': {
    // condition.param: percentage threshold, e.g. 20, 30, 50
    // condition.operator: '<', '>', '=' (same pattern as ally_hp)
    const threshold = parseInt(condition.param, 10);
    const operator = condition.operator || '<';
    const allies = battleState.heroes.filter(h => h.hp > 0 && h.id !== hero.id);
    return allies.some(ally => {
        const pct = (ally.mp / ally.maxMp) * 100;
        switch (operator) {
            case '<': return pct < threshold;
            case '>': return pct > threshold;
            case '=': return Math.abs(pct - threshold) < 1;
            default: return false;
        }
    });
}
```

### 2.4 `ally_status`

```js
case 'ally_status': {
    // condition.param: status string, e.g. 'poison', 'burn', 'stun', 'sleep', 'haste'
    const targetStatus = condition.param;
    const allies = battleState.heroes.filter(h => h.hp > 0 && h.id !== hero.id);
    return allies.some(ally =>
        ally.statusEffects?.some(se => se.type === targetStatus)
    );
}
```

> **Note:** If the status effect model uses `ally.activeStatuses` or a different property name, adjust accordingly. The key is to check if any ally has the specified status effect active.

### 2.5 Defensive Fallback

If the evaluator has a default case, ensure it logs a warning for truly unknown conditions:
```js
default:
    console.warn(`[GambitEvaluator] Unknown condition type: ${condition.type}`);
    return false;
```

---

## Phase 3 — Presentation Changes

None. These are pure engine logic changes. The Gambit UI already allows selecting these conditions — they just never evaluated to true before.

---

## Phase 4 — i18n

No new keys needed. The condition labels and descriptions already exist in the Gambit UI.

Verify these keys exist (they should):
```js
gambit_condition_enemy_element: 'Enemy Element',
gambit_condition_enemy_type: 'Enemy Type',
gambit_condition_ally_mp: 'Ally MP',
gambit_condition_ally_status: 'Ally Status',
```

If any are missing, add them to all 5 language files.

---

## Phase 5 — Tests

**File:** `tests/unit/GambitEvaluator.test.js` (or create if missing)

```js
function makeBattleState(overrides = {}) {
    return {
        heroes: [
            { id: 'h1', hp: 100, maxHp: 100, mp: 50, maxMp: 100, statusEffects: [] },
            { id: 'h2', hp: 80, maxHp: 100, mp: 20, maxMp: 100, statusEffects: [{ type: 'poison' }] }
        ],
        enemies: [
            { id: 'e1', hp: 50, element: 'fire', type: 'beast', statusEffects: [] },
            { id: 'e2', hp: 60, element: 'water', type: 'undead', statusEffects: [{ type: 'burn' }] }
        ],
        turnCount: 3,
        ...overrides
    };
}

// --- enemy_element ---

test('GambitEvaluator: enemy_element matches when enemy has element', () => {
    const battle = makeBattleState();
    const result = evaluateCondition({ type: 'enemy_element', param: 'fire' }, battle, battle.heroes[0]);
    assert.strictEqual(result, true);
});

test('GambitEvaluator: enemy_element fails when no enemy has element', () => {
    const battle = makeBattleState();
    const result = evaluateCondition({ type: 'enemy_element', param: 'storm' }, battle, battle.heroes[0]);
    assert.strictEqual(result, false);
});

// --- enemy_type ---

test('GambitEvaluator: enemy_type matches when enemy has type', () => {
    const battle = makeBattleState();
    const result = evaluateCondition({ type: 'enemy_type', param: 'undead' }, battle, battle.heroes[0]);
    assert.strictEqual(result, true);
});

test('GambitEvaluator: enemy_type fails when no enemy has type', () => {
    const battle = makeBattleState();
    const result = evaluateCondition({ type: 'enemy_type', param: 'dragon' }, battle, battle.heroes[0]);
    assert.strictEqual(result, false);
});

// --- ally_mp ---

test('GambitEvaluator: ally_mp < threshold matches low MP ally', () => {
    const battle = makeBattleState();
    const result = evaluateCondition({ type: 'ally_mp', param: '25', operator: '<' }, battle, battle.heroes[0]);
    assert.strictEqual(result, true); // h2 has 20/100 = 20% MP
});

test('GambitEvaluator: ally_mp < threshold fails when all allies above', () => {
    const battle = makeBattleState();
    const result = evaluateCondition({ type: 'ally_mp', param: '10', operator: '<' }, battle, battle.heroes[0]);
    assert.strictEqual(result, false);
});

test('GambitEvaluator: ally_mp > threshold matches high MP ally', () => {
    const battle = makeBattleState();
    const result = evaluateCondition({ type: 'ally_mp', param: '40', operator: '>' }, battle, battle.heroes[0]);
    assert.strictEqual(result, true); // h1 has 50/100 = 50% MP
});

// --- ally_status ---

test('GambitEvaluator: ally_status matches when ally has status', () => {
    const battle = makeBattleState();
    const result = evaluateCondition({ type: 'ally_status', param: 'poison' }, battle, battle.heroes[0]);
    assert.strictEqual(result, true); // h2 is poisoned
});

test('GambitEvaluator: ally_status fails when no ally has status', () => {
    const battle = makeBattleState();
    const result = evaluateCondition({ type: 'ally_status', param: 'stun' }, battle, battle.heroes[0]);
    assert.strictEqual(result, false);
});

// --- Integration: rule priority still works ---

test('GambitEvaluator: new conditions work in full rule evaluation', () => {
    const battle = makeBattleState();
    const hero = battle.heroes[0];
    const rules = [
        { priority: 1, condition: { type: 'ally_status', param: 'poison' }, action: 'heal', target: 'lowest_hp_ally' },
        { priority: 2, condition: { type: 'always' }, action: 'attack', target: 'random' }
    ];
    const matchedRule = evaluateGambits(rules, battle, hero);
    assert.strictEqual(matchedRule.priority, 1);
    assert.strictEqual(matchedRule.action, 'heal');
});
```

---

## Phase 6 — Verification Checklist

- [ ] `enemy_element` condition evaluates true when any living enemy has the specified element.
- [ ] `enemy_type` condition evaluates true when any living enemy has the specified type.
- [ ] `ally_mp` condition supports `<`, `>`, `=` operators against percentage thresholds.
- [ ] `ally_status` condition evaluates true when any living ally (not self) has the specified status effect.
- [ ] All 4 new conditions integrate into existing rule priority system.
- [ ] Unknown condition types log a warning instead of silently returning false.
- [ ] No existing gambit behavior is changed.
- [ ] All 12 new unit tests pass.
- [ ] Existing combat/gambit tests still pass.
