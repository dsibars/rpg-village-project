# Implementation Plan: Expedition Narrative Queue Framework

## Goal
Add an **event-driven narrative queue** in `ExpeditionService` so that story mission completions and region first-clears can trigger lore messages on the next day. This sits alongside the existing predicate-based `UnlockNarratives` system — it does not replace it.

> **Builds on Idea 02:** The `narrative.firstClear` blocks we added to region data in Idea 02 will now feed into this queue instead of being read directly from region state.

---

## Phase 1 — Documentation Update

**File:** `docs/explore/expeditions.md`

Add a new section "Narrative Rewards":

> Story missions may declare an optional `reward.narrative: { titleKey, loreKey, era? }`. When the mission completes, the narrative is enqueued in `ExpeditionService.pendingNarratives` and appears during the next day transition. It is shown exactly once.

**File:** `docs/shared/hall_of_fame.md` (if it mentions narrative triggers)

No changes needed — this is purely additive.

---

## Phase 2 — Engine Changes

### 2.1 Add Narrative Queue to ExpeditionService

**File:** `js/engine/explore/services/ExpeditionService.js`

#### 2.1.1 Extend default state

```js
_getDefaultState() {
    return {
        completedIds: [],
        activeExpeditions: [],
        expeditionTurnIndex: 0,
        activeCombatExpeditionId: null,
        bestiary: [],
        pendingNarratives: []  // <-- NEW
    };
}
```

#### 2.1.2 Add migration in `_load`

```js
if (!loaded.pendingNarratives) loaded.pendingNarratives = [];
```

#### 2.1.3 Add public queue methods

```js
getPendingNarratives() {
    return this.state.pendingNarratives || [];
}

consumePendingNarratives() {
    this.state.pendingNarratives = [];
    this.save();
}

_enqueueNarrative(narrative) {
    // Deduplicate by id (titleKey is sufficient for uniqueness)
    const alreadyQueued = this.state.pendingNarratives.some(
        n => n.titleKey === narrative.titleKey
    );
    if (!alreadyQueued) {
        this.state.pendingNarratives.push(narrative);
        this.save();
    }
}
```

### 2.2 Refactor RegionService to return narrative data

**File:** `js/engine/explore/services/RegionService.js`

#### 2.2.1 Remove `pendingNarrative` from region state

In `completeExpedition`, change the first-clear block from:

```js
if (wasFirstClear) {
    const rData = this.getRegionData(regionId);
    if (rData.narrative?.firstClear) {
        region.pendingNarrative = { ...rData.narrative.firstClear, consumed: false };
    }
}
```

To:
```js
let firstClearNarrative = null;
if (wasFirstClear) {
    const rData = this.getRegionData(regionId);
    if (rData.narrative?.firstClear) {
        firstClearNarrative = rData.narrative.firstClear;
    }
}
```

And update the return statement:
```js
return { wasFirstClear, spawnedNodes, injectedMissions, firstClearNarrative };
```

#### 2.2.2 Remove `pendingNarrative` field entirely

- Remove `pendingNarrative` from `_getDefaultState` region init.
- Remove `pendingNarrative` migration from `_load`.
- Remove `getPendingNarratives()` and `consumePendingNarratives()` methods.
- Remove `pendingNarrative` from `_seedRegion`.

> **Rationale:** The queue now lives in `ExpeditionService`. RegionService should not manage presentation state.

### 2.3 Wire queue consumption in _finishExpedition

**File:** `js/engine/explore/services/ExpeditionService.js`

In `_finishExpedition`, update the region completion call:

```js
const { wasFirstClear, firstClearNarrative } = this.regionService.completeExpedition(
    exp.id,
    heroes.map(h => h.id),
    heroes.map(h => h.name),
    this.state.completedIds
);

// Enqueue region first-clear narrative
if (firstClearNarrative) {
    this._enqueueNarrative({
        id: `nar_${exp.regionId}_first_clear`,
        ...firstClearNarrative
    });
}

// Enqueue story mission narrative
if (exp.isStory && exp.reward?.narrative) {
    this._enqueueNarrative({
        id: exp.reward.narrative.id || `nar_${exp.id}_story`,
        ...exp.reward.narrative
    });
}
```

> **Note:** The speed boost logic stays unchanged.

### 2.4 Update GameEngine.nextDay()

**File:** `js/engine/GameEngine.js`

Replace the current region-narrative block with queue consumption from `ExpeditionService`:

```js
// ─── Expedition narrative queue ───
const pendingNarratives = this.expeditionService.getPendingNarratives();
for (const n of pendingNarratives) {
    dailyReport.newNarratives = dailyReport.newNarratives || [];
    dailyReport.newNarratives.push(n);
}
if (pendingNarratives.length > 0) {
    this.expeditionService.consumePendingNarratives();
}
```

> This replaces the current `regionService.getPendingNarratives()` block entirely.

---

## Phase 3 — Content: Add Narrative to Story Mission

**File:** `js/engine/explore/data/regions/reg_greenfields.js`

Add `narrative` to the `exp_rescue_mission` reward:

```js
{
    id: 'exp_rescue_mission',
    name: 'The Captured Guard',
    // ... existing fields ...
    reward: {
        gold: 200,
        items: { material_wood: 15, material_stone: 5 },
        special: { type: 'hero', value: 'Sir Valen' },
        narrative: {
            id: 'nar_rescue_mission',
            titleKey: 'nar_rescue_mission_title',
            loreKey: 'nar_rescue_mission_lore',
            era: 1
        }
    },
    // ...
}
```

> The `id` field inside `narrative` is optional but recommended for deduplication. If omitted, `_finishExpedition` will generate one from the expedition id.

---

## Phase 4 — i18n

**Files:** All 5 language files

Add keys for the rescue mission narrative:

```js
nar_rescue_mission_title: 'A Shield in the Dark',
nar_rescue_mission_lore: 'The guard was half-buried under rubble, his armor cracked, his sword still clutched in both hands. He did not speak of gratitude — only duty. "I will hold the line," he said. And he has.',
```

> **Note:** The text is intentionally the same as `nar_sir_valen_joins` because this is the moment Sir Valen joins. However, we use a new key because this narrative triggers from the **mission completion** event, while `nar_sir_valen_joins` triggers from the predicate-based unlock system (hero exists in roster). Having both ensures the player sees the lore even if they somehow bypassed the predicate check.

For non-English files, add translations or `// TODO: translate` markers.

---

## Phase 5 — Tests

### 5.1 Update ExpeditionService tests

**File:** `tests/unit/ExpeditionService.test.js`

Add tests:

```js
test('ExpeditionService: narrative queue state initializes empty', () => {
    const { expeditionService } = createServices();
    assert.deepStrictEqual(expeditionService.getPendingNarratives(), []);
});

test('ExpeditionService: _enqueueNarrative adds to queue', () => {
    const { expeditionService } = createServices();
    expeditionService._enqueueNarrative({ id: 'nar_test', titleKey: 't', loreKey: 'l', era: 1 });
    assert.strictEqual(expeditionService.getPendingNarratives().length, 1);
    assert.strictEqual(expeditionService.getPendingNarratives()[0].titleKey, 't');
});

test('ExpeditionService: _enqueueNarrative deduplicates by titleKey', () => {
    const { expeditionService } = createServices();
    expeditionService._enqueueNarrative({ id: 'nar_a', titleKey: 't', loreKey: 'l', era: 1 });
    expeditionService._enqueueNarrative({ id: 'nar_b', titleKey: 't', loreKey: 'l', era: 1 });
    assert.strictEqual(expeditionService.getPendingNarratives().length, 1);
});

test('ExpeditionService: consumePendingNarratives clears queue', () => {
    const { expeditionService } = createServices();
    expeditionService._enqueueNarrative({ id: 'nar_test', titleKey: 't', loreKey: 'l', era: 1 });
    expeditionService.consumePendingNarratives();
    assert.deepStrictEqual(expeditionService.getPendingNarratives(), []);
});
```

### 5.2 Update RegionService tests

**File:** `tests/unit/RegionService.test.js`

Update the narrative tests to reflect the new return value:

```js
test('RegionService: first clear returns narrative in result', () => {
    const { regionService } = createServices();
    const region = regionService.getRegion('reg_greenfields');
    region.clears = 0;
    region.availableNodes = [regionService.generateExpedition('reg_greenfields', 0)];
    const exp = region.availableNodes[0];

    const result = regionService.completeExpedition(exp.id, [], [], []);

    assert.ok(result.firstClearNarrative, 'firstClearNarrative should exist');
    assert.strictEqual(result.firstClearNarrative.titleKey, 'nar_greenfields_first_clear_title');
});

test('RegionService: second clear returns no narrative', () => {
    const { regionService } = createServices();
    const region = regionService.getRegion('reg_greenfields');
    region.clears = 1;
    region.firstClearBonusGiven = true;
    region.availableNodes = [regionService.generateExpedition('reg_greenfields', 1)];
    const exp = region.availableNodes[0];

    const result = regionService.completeExpedition(exp.id, [], [], []);

    assert.strictEqual(result.firstClearNarrative, null);
});

test('RegionService: region without narrative returns null', () => {
    const { regionService } = createServices();
    regionService._seedRegion('reg_dark_forest');
    const region = regionService.getRegion('reg_dark_forest');
    region.clears = 0;
    region.availableNodes = [regionService.generateExpedition('reg_dark_forest', 0)];
    const exp = region.availableNodes[0];

    const result = regionService.completeExpedition(exp.id, [], [], []);

    assert.strictEqual(result.firstClearNarrative, null);
});
```

Remove the old tests for `pendingNarrative`, `consumePendingNarratives`, and `getPendingNarratives` on `RegionService`.

### 5.3 Run all tests

```bash
node --test tests/unit/ExpeditionService.test.js
node --test tests/unit/RegionService.test.js
node --test tests/unit/*.test.js
```

---

## Phase 6 — Verification Checklist

- [ ] `ExpeditionService` state has `pendingNarratives: []` in default state and load migration.
- [ ] `ExpeditionService._enqueueNarrative()` deduplicates by `titleKey`.
- [ ] `RegionService.completeExpedition()` returns `firstClearNarrative` instead of mutating region state.
- [ ] `RegionService` no longer has `pendingNarrative`, `getPendingNarratives()`, or `consumePendingNarratives()`.
- [ ] `ExpeditionService._finishExpedition()` pushes both story-mission and region first-clear narratives to the queue.
- [ ] `GameEngine.nextDay()` consumes narratives from `expeditionService` and injects them into `dailyReport.newNarratives`.
- [ ] `exp_rescue_mission` has `reward.narrative` with `nar_rescue_mission_*` keys.
- [ ] i18n keys added to all 5 language files.
- [ ] All existing tests pass.
- [ ] No presentation-layer changes needed.

---

## Files Modified

| File | Change |
|------|--------|
| `js/engine/explore/services/ExpeditionService.js` | Add `pendingNarratives` state, `_enqueueNarrative`, `getPendingNarratives`, `consumePendingNarratives`. Wire in `_finishExpedition`. |
| `js/engine/explore/services/RegionService.js` | Return `firstClearNarrative` from `completeExpedition`. Remove `pendingNarrative` field and related methods. |
| `js/engine/GameEngine.js` | Consume expedition queue instead of region state. |
| `js/engine/explore/data/regions/reg_greenfields.js` | Add `reward.narrative` to `exp_rescue_mission`. |
| `js/engine/shared/core/i18n/translations/*.js` (x5) | Add `nar_rescue_mission_title` / `lore`. |
| `tests/unit/ExpeditionService.test.js` | Add queue tests. |
| `tests/unit/RegionService.test.js` | Update narrative tests to check return value. Remove old pendingNarrative tests. |
| `docs/explore/expeditions.md` | Document `reward.narrative`. |
