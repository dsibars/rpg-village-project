# Implementation Plan: Training Grounds Passive EXP Mechanic

## Goal
Wire up the Training Grounds building so it actually provides gameplay value. Currently the building is constructible and a Trainer NPC exists, but the +5% passive EXP/day effect specified in `buildings_data.md` is not implemented. The Trainer just talks. This plan implements the passive EXP gain for idle heroes.

> **Scope:** Single engine hook + daily report line + i18n. No new UI components.

---

## Phase 1 — Documentation Update

**File:** `docs/village/village.md`

Update the Training Grounds mention to remove the "NOT implemented" note and reference the actual mechanic:

Replace:
```
Training Grounds (Day 5) unlocks Trainer NPC dialogue but actual training mechanics are NOT implemented — the Trainer just talks.
```

With:
```
Training Grounds (Day 5) unlocks the Trainer NPC and grants +5% passive EXP per day to all idle heroes (alive, not on expedition, not resting, not training). Each additional Training Grounds level increases the bonus by +5%.
```

**File:** `docs/village/buildings_data.md`

Clarify the bonus line:
```
| `training_grounds`| 1 | 300 | 150 Stone, 50 Iron | 5 | +5% passive EXP/day for idle heroes per level |
```

---

## Phase 2 — Engine Changes

### 2.1 Add Training Grounds EXP Tick

**File:** `js/engine/GameEngine.js`

In `nextDay()`, after the existing `Recovery Phase` and before `Meal Buff Tick`, add:

```js
// Training Grounds EXP Phase
const tgLevel = this.villageService.getBuildingLevel('training_grounds');
if (tgLevel > 0) {
    const expBonusPercent = tgLevel * 0.05; // 5% per level
    const idleHeroes = this.heroService.list().filter(h =>
        h.hp > 0 &&
        h.status === 'active' &&
        !this.expeditionService.isHeroOnExpedition(h.id)
    );
    for (const hero of idleHeroes) {
        const baseExp = hero.level * 2; // flat base per level
        const expGained = Math.max(1, Math.floor(baseExp * expBonusPercent));
        if (expGained > 0) {
            hero.gainExp(expGained);
            dailyReport.trainingGroundsExp = dailyReport.trainingGroundsExp || [];
            dailyReport.trainingGroundsExp.push({ heroId: hero.id, heroName: hero.name, amount: expGained });
        }
    }
}
```

> **Rationale for formula:** `hero.level * 2` gives a Lv1 hero 2 EXP base, Lv10 hero 20 EXP base. At Training Grounds L1 (+5%), that's 0.1 → 1 EXP for Lv1, 1 EXP for Lv2, 1 EXP for Lv3-4, etc. At Lv10 = 1 EXP. This is small but meaningful over time — an idle Lv10 hero gains ~1 level every 200 days at L1, or ~1 level every 40 days at L5. The bonus is intentionally minor so it does not trivialize expedition EXP.

### 2.2 Ensure `gainExp` triggers level-up

Verify `Hero.gainExp()` or `HeroService.addExp()` handles level-up when threshold is crossed. The XP required for level L is `L * 20`. If `gainExp` already handles this, no changes needed.

### 2.3 Expose `getBuildingLevel` if missing

**File:** `js/engine/village/services/VillageService.js`

Ensure this method exists:
```js
getBuildingLevel(buildingId) {
    return this.state.infrastructure[buildingId] || 0;
}
```

If it does not exist, add it.

---

## Phase 3 — Presentation Changes

**File:** `js/presentation/ui/village/components/DailyReport.js` (or equivalent)

Add a Training Grounds EXP section to the daily report when `trainingGroundsExp` is present:

```js
if (dailyReport.trainingGroundsExp?.length > 0) {
    const totalExp = dailyReport.trainingGroundsExp.reduce((sum, e) => sum + e.amount, 0);
    reportSections.push({
        icon: '⚔️',
        title: t('report_training_grounds_title'),
        lines: dailyReport.trainingGroundsExp.map(e =>
            t('report_training_grounds_line', { name: e.heroName, amount: e.amount })
        )
    });
}
```

No other UI changes needed. The Training Grounds building card and Trainer dialogue remain as-is.

---

## Phase 4 — i18n

**Files:** All 5 language files under `js/engine/shared/core/i18n/translations/`

Add:
```js
report_training_grounds_title: 'Training Grounds',
report_training_grounds_line: '{name} gained {amount} EXP from training.',
```

For non-English files, add translations or `// TODO: translate`.

Remove any stale keys that referenced a non-existent training mechanic (unlikely to exist, but verify).

---

## Phase 5 — Tests

**File:** `tests/unit/GameEngine.test.js` or `tests/unit/HeroService.test.js`

Add tests:

```js
test('nextDay: training grounds grants EXP to idle heroes', () => {
    const engine = createEngine();
    engine.villageService.state.infrastructure.training_grounds = 1;
    const hero = engine.heroService.list()[0];
    const beforeExp = hero.exp;
    
    engine.nextDay();
    
    assert.ok(hero.exp > beforeExp, 'Idle hero should gain EXP');
});

test('nextDay: training grounds does not grant EXP to deployed heroes', () => {
    const engine = createEngine();
    engine.villageService.state.infrastructure.training_grounds = 1;
    const hero = engine.heroService.list()[0];
    // Mock hero as being on expedition
    engine.expeditionService.state.activeExpeditions.push({ heroIds: [hero.id] });
    const beforeExp = hero.exp;
    
    engine.nextDay();
    
    assert.strictEqual(hero.exp, beforeExp, 'Deployed hero should not gain EXP');
});

test('nextDay: training grounds does not grant EXP to dead heroes', () => {
    const engine = createEngine();
    engine.villageService.state.infrastructure.training_grounds = 1;
    const hero = engine.heroService.list()[0];
    hero.hp = 0;
    const beforeExp = hero.exp;
    
    engine.nextDay();
    
    assert.strictEqual(hero.exp, beforeExp, 'Dead hero should not gain EXP');
});

test('nextDay: training grounds level scales bonus', () => {
    const engine = createEngine();
    engine.villageService.state.infrastructure.training_grounds = 2;
    const hero = engine.heroService.list()[0];
    const beforeExp = hero.exp;
    
    engine.nextDay();
    
    // L2 = 10% bonus, should grant more than L1 would
    const expAtL2 = hero.exp - beforeExp;
    hero.exp = beforeExp;
    engine.villageService.state.infrastructure.training_grounds = 1;
    engine.nextDay();
    const expAtL1 = hero.exp - beforeExp;
    
    assert.ok(expAtL2 >= expAtL1, 'L2 should grant >= EXP than L1');
});
```

---

## Phase 6 — Verification Checklist

- [ ] `docs/village/village.md` no longer says Training Grounds is unimplemented.
- [ ] `docs/village/buildings_data.md` clearly specifies +5% per level.
- [ ] `GameEngine.nextDay()` includes Training Grounds EXP phase.
- [ ] Idle heroes (alive, not on expedition, status === 'active') gain EXP.
- [ ] Deployed heroes, dead heroes, and resting heroes do NOT gain EXP.
- [ ] EXP amount scales with Training Grounds level (5% per level).
- [ ] EXP gain triggers normal level-up if threshold is crossed.
- [ ] Daily report includes Training Grounds section with hero names and amounts.
- [ ] i18n keys added to all 5 language files.
- [ ] All new tests pass.
- [ ] Existing `nextDay()` tests still pass.
