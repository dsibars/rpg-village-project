# Implementation Plan: Fix Daily Objectives Spec Alignment

## Goal
Eliminate the contradiction between `docs/village/village.md` (says 2-3 random objectives) and `docs/village/daily_objectives.md` (says 4 generated, player chooses 2). The `daily_objectives.md` spec is newer, more detailed, and has a state model — it is the authority. Align the village doc and verify the code implements the choice mechanic.

> **Scope:** Doc fix + code verification. No new systems. If the choice mechanic is missing from code, implement it.

---

## Phase 1 — Documentation Update

**File:** `docs/village/village.md`

Replace the Daily Objectives section (currently says 2-3 random objectives) with a concise reference to `daily_objectives.md`:

```
## Daily Objectives

Each in-game day, **4 random objectives are generated** and the player **chooses 2** to pursue. Objectives track automatically through gameplay actions.

See [Daily Objectives Specification](daily_objectives.md) for full details on generation, choice mechanics, tracking, and rewards.
```

This removes the contradiction and establishes `daily_objectives.md` as the single source of truth.

---

## Phase 2 — Engine Verification & Fixes

**File:** `js/engine/village/services/DailyObjectivesService.js` (or equivalent)

Verify the service implements the following from `daily_objectives.md`:

### 2.1 Generation
- [ ] 4 objectives are generated at day start (first `nextDay()` of that day).
- [ ] If objectives already exist for the current day, they are preserved.
- [ ] When day counter advances, 4 new choices are generated.

### 2.2 Choice Mechanic
- [ ] Status field exists: `'choosing'` | `'active'` | `'idle'`.
- [ ] When status is `'choosing'`, 4 `pendingChoices` are exposed.
- [ ] Player selects exactly 2; selection is final for that day.
- [ ] Until 2 are selected, no objectives are active and no progress is tracked.
- [ ] Selected objectives move from `pendingChoices` to `objectives` array.

### 2.3 Tracking
Verify each objective type auto-tracks:
- `defeat_enemies`: counts enemies defeated in victorious combat.
- `spend_gold`: tracks gold spent in shop, buildings, recruitment, forge.
- `complete_expeditions`: tracks expeditions reaching `completed` status.
- `upgrade_building`: tracks when a building project is started.
- `recruit_hero`: tracks tavern recruitment.
- `craft_items`: tracks forge refinement and meal crafting.

### 2.4 Rewards
- [ ] Individual objective rewards are granted on completion.
- [ ] All-completed bonus (20 Wood + 10 Stone) is granted once per day when both chosen objectives are completed.
- [ ] `allCompletedDay` tracks which day the bonus was granted to prevent double-grant.

### 2.5 If Missing: Implement Choice Mechanic

If the code currently generates 2-3 random objectives with no choice phase, refactor to:

```js
// In generateObjectives() or equivalent:
const choices = this._generateFourChoices();
this.state = {
    day: currentDay,
    status: 'choosing',
    pendingChoices: choices,
    objectives: [],
    allCompletedDay: null
};
```

Add `chooseObjectives(choiceIndices)` method:
```js
chooseObjectives(indices) {
    if (this.state.status !== 'choosing') return Result.fail('error_objectives_already_chosen');
    if (indices.length !== 2) return Result.fail('error_must_choose_two');
    
    const chosen = indices.map(i => this.state.pendingChoices[i]).filter(Boolean);
    if (chosen.length !== 2) return Result.fail('error_invalid_choice');
    
    this.state.objectives = chosen.map(c => ({ ...c, progress: 0, completed: false, claimed: false }));
    this.state.status = 'active';
    this.save();
    return Result.ok(this.state.objectives);
}
```

---

## Phase 3 — Presentation Changes

**File:** `js/presentation/ui/village/components/DailyObjectivesWidget.js` (or equivalent)

### 3.1 Choice Phase UI
When `status === 'choosing'`:
- Display 4 cards, each showing: objective label, target, reward preview.
- Each card has a selectable state (checkbox or toggle).
- A "Lock In" button is disabled until exactly 2 are selected.
- Clicking "Lock In" calls `EngineAdapter.chooseDailyObjectives(indices)`.

### 3.2 Active Phase UI
When `status === 'active'`:
- Display the 2 chosen objectives with progress bars and completion checkmarks.
- Show all-completed celebration banner when both are done.

### 3.3 Idle Phase UI
When `status === 'idle'` (all done for the day):
- Show "All objectives completed!" message.
- Display tomorrow's preview (or nothing until next day).

---

## Phase 4 — i18n

**Files:** All 5 language files under `js/engine/shared/core/i18n/translations/`

Add or verify these keys exist:
```js
// Choice phase
ui_choose_objectives: 'Choose 2 Objectives',
ui_lock_in: 'Lock In',
error_must_choose_two: 'You must choose exactly 2 objectives.',
error_objectives_already_chosen: 'Objectives have already been chosen for today.',

// Active phase
ui_objectives_progress: 'Objectives',
ui_objective_completed: 'Completed!',
ui_all_objectives_bonus: 'Daily Bonus Earned: +20 Wood, +10 Stone',

// Idle phase
ui_all_objectives_done: 'All objectives completed for today.'
```

For non-English files, add translations or `// TODO: translate`.

---

## Phase 5 — Tests

**File:** `tests/unit/DailyObjectivesService.test.js` (or create if missing)

```js
test('DailyObjectives: generates 4 choices at day start', () => {
    const service = createService();
    service.generateForDay(1);
    assert.strictEqual(service.state.pendingChoices.length, 4);
    assert.strictEqual(service.state.status, 'choosing');
});

test('DailyObjectives: player chooses 2, status becomes active', () => {
    const service = createService();
    service.generateForDay(1);
    const result = service.chooseObjectives([0, 2]);
    assert.ok(result.success);
    assert.strictEqual(service.state.status, 'active');
    assert.strictEqual(service.state.objectives.length, 2);
});

test('DailyObjectives: choosing invalid indices fails', () => {
    const service = createService();
    service.generateForDay(1);
    const result = service.chooseObjectives([0, 9]);
    assert.ok(!result.success);
});

test('DailyObjectives: progress tracks automatically', () => {
    const service = createService();
    service.generateForDay(1);
    service.chooseObjectives([0, 1]);
    // Simulate defeating enemies
    service.trackEvent('defeat_enemies', 5);
    const obj = service.state.objectives[0];
    assert.strictEqual(obj.progress, 5);
});

test('DailyObjectives: all-completed bonus granted once', () => {
    const service = createService();
    service.generateForDay(1);
    service.chooseObjectives([0, 1]);
    service.completeObjective(0);
    service.completeObjective(1);
    assert.ok(service.state.allCompletedDay === 1);
    // Completing again should not grant duplicate bonus
    const beforeWood = inventory.getCount('material_wood');
    service.completeObjective(0);
    assert.strictEqual(inventory.getCount('material_wood'), beforeWood);
});
```

---

## Phase 6 — Verification Checklist

- [ ] `docs/village/village.md` no longer contradicts `daily_objectives.md`.
- [ ] `docs/village/daily_objectives.md` is treated as the single source of truth.
- [ ] Code generates exactly 4 choices per day.
- [ ] Player must choose exactly 2; choice is final.
- [ ] `status: 'choosing'` exists and blocks progress tracking until 2 are chosen.
- [ ] All 6 objective types track automatically through gameplay.
- [ ] Individual rewards granted on completion.
- [ ] All-completed bonus (20 Wood + 10 Stone) granted once per day max.
- [ ] UI shows 4 cards in choice phase, 2 progress bars in active phase.
- [ ] i18n keys added to all 5 language files.
- [ ] All DailyObjectivesService tests pass.
- [ ] Existing `GameEngine.nextDay()` tests still pass.
