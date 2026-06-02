# Implementation Plan: Story Mission Effects Framework

## Goal
Upgrade story missions from a hardcoded `reward.special` block into a generic `reward.effects[]` array. Effects can grant heroes, unlock building blueprints, unlock regions, trigger narratives, and add villagers. This makes story missions the backbone of campaign progression.

> **Builds on:** Idea 03 (narrative queue). The `narrative` effect type pushes into `ExpeditionService.pendingNarratives` via `_enqueueNarrative()`.

---

## Phase 1 — Documentation Update

**File:** `docs/explore/expeditions_data.md`

Add a new section "Story Mission Effects":

> Story missions declare an optional `effects` array:
> ```js
> effects: [
>   { type: 'hero', name: 'Sir Valen', origin: 'origin_guard', level: 1, avatar: 'valen.webp' },
>   { type: 'villagers', count: 2 },
>   { type: 'building_blueprint', buildingId: 'witchs_hut' },
>   { type: 'region_unlock', regionId: 'reg_mystic_ruins' },
>   { type: 'narrative', titleKey: 'nar_rescue_mission_title', loreKey: 'nar_rescue_mission_lore', era: 1 }
> ]
> ```
> Effects are resolved in order by `ExpeditionService._finishExpedition`. No code changes are needed to add a new story mission with effects.

---

## Phase 2 — Engine Changes

### 2.1 Add Effect Resolver to ExpeditionService

**File:** `js/engine/explore/services/ExpeditionService.js`

Replace the hardcoded `reward.special` handling in `_distributeRewards` with a generic `_resolveEffects` method. Keep `_distributeRewards` for gold, items, loot, and consumables only.

#### 2.1.1 Add `_resolveEffects` method

```js
_resolveEffects(exp, heroes) {
    if (!exp.reward?.effects) return;

    for (const effect of exp.reward.effects) {
        switch (effect.type) {
            case 'hero':
                this._effectGrantHero(effect, heroes);
                break;
            case 'villagers':
                this.villageService.addVillagers(effect.count);
                break;
            case 'building_blueprint':
                this.villageService.unlockBlueprint(effect.buildingId);
                break;
            case 'region_unlock':
                this.regionService._seedRegion(effect.regionId);
                break;
            case 'narrative':
                this._enqueueNarrative({
                    id: effect.id || `nar_${exp.id}_story`,
                    titleKey: effect.titleKey,
                    loreKey: effect.loreKey,
                    era: effect.era || 1
                });
                break;
            default:
                console.warn(`[EffectResolver] Unknown effect type: ${effect.type}`);
        }
    }
}

_effectGrantHero(effect, expeditionHeroes) {
    const avatar = effect.avatar || null;
    const origin = effect.origin || 'origin_warrior';
    const level = effect.level || 1;

    const result = this.heroService.add({
        name: effect.name,
        origin,
        avatar,
        level
    });

    if (result.success) {
        const newHero = result.data;
        for (let i = 1; i < level; i++) {
            newHero.levelUp();
        }
        // Default starting gear for recruited heroes
        if (!newHero.equipment.leftHand) {
            newHero.equipment.leftHand = { type: 'weapon', material: 'wooden', family: 'broadsword', level: 0 };
        }
        if (!newHero.equipment.body) {
            newHero.equipment.body = { type: 'armor', material: 'wooden', archetype: 'leather', slot: 'body', level: 0 };
        }
        newHero.recalculateStats({});
    }
}
```

#### 2.1.2 Wire `_resolveEffects` into `_finishExpedition`

In `_finishExpedition`, replace:
```js
// Distribute rewards
this._distributeRewards(exp);
```

With:
```js
// Distribute standard rewards (gold, items, loot, consumables)
this._distributeRewards(exp);

// Resolve story mission effects
this._resolveEffects(exp, heroes);
```

#### 2.1.3 Remove the old `reward.special` block from `_distributeRewards`

Delete the entire `if (exp.reward.special) { ... }` block (~20 lines) from `_distributeRewards`. The `hero` and `villagers` logic now lives in `_effectGrantHero` and `_resolveEffects`.

#### 2.1.4 Remove the old `reward.narrative` block from `_finishExpedition`

Delete:
```js
// Enqueue story mission narrative
if (exp.isStory && exp.reward?.narrative) {
    this._enqueueNarrative({...});
}
```

The narrative effect is now handled inside `_resolveEffects`.

> **Note:** Keep the region first-clear narrative block (lines ~632-638). That is not a story mission effect — it's generated from region data.

### 2.2 Add Blueprint Unlock System to VillageService

**File:** `js/engine/village/services/VillageService.js`

#### 2.2.1 Remove non-starting buildings from default state

Current default `infrastructure` includes ALL buildings at level 0. Change it to only include buildings the player starts with:

```js
infrastructure: {
    housing: 1,
    farm: 0,
    warehouse: 1
    // All others removed — they are added when blueprints are unlocked
},
```

#### 2.2.2 Add `unlockBlueprint` method

```js
unlockBlueprint(buildingId) {
    if (this.state.infrastructure[buildingId] === undefined) {
        this.state.infrastructure[buildingId] = 0;
        this.save();
    }
}
```

#### 2.2.3 Add getter for visible buildings

```js
getUnlockedBuildings() {
    return Object.keys(this.state.infrastructure);
}
```

> **Rationale:** The presentation layer already uses `Object.keys(village.infrastructure)` to populate the building list. By removing hidden buildings from the default state, the UI automatically hides them. When `unlockBlueprint` adds them, they appear in the list at level 0.

### 2.3 Add Story Mission Completion Registry

**File:** `js/engine/explore/services/ExpeditionService.js`

#### 2.3.1 Extend default state

```js
_getDefaultState() {
    return {
        // ... existing fields ...
        storyMissions: {}  // { '<missionId>': { dayCompleted, heroIds: [] } }
    };
}
```

#### 2.3.2 Add migration in `_load`

```js
if (!loaded.storyMissions) loaded.storyMissions = {};
```

#### 2.3.3 Register completion in `_finishExpedition`

In `_finishExpedition`, after validating it's a story mission:

```js
if (exp.isStory) {
    const villageState = this.villageService.getState();
    this.state.storyMissions[exp.id] = {
        dayCompleted: villageState.day || 1,
        heroIds: heroes.map(h => h.id)
    };
}
```

#### 2.3.4 Add public getter

```js
getStoryMissionStatus(missionId) {
    return this.state.storyMissions[missionId] || null;
}

getCompletedStoryMissions() {
    return Object.keys(this.state.storyMissions);
}
```

---

## Phase 3 — Migrate All Story Missions to Effects Format

**Files:** All region files with `storyMissions`

Migrate each story mission from `reward.special` to `reward.effects`.

### `reg_greenfields.js` — `exp_rescue_mission`

**From:**
```js
reward: {
    gold: 200,
    items: { material_wood: 15, material_stone: 5 },
    special: { type: 'hero', value: 'Sir Valen' },
    narrative: { id: 'nar_rescue_mission', titleKey: '...', loreKey: '...', era: 1 }
}
```

**To:**
```js
reward: {
    gold: 200,
    items: { material_wood: 15, material_stone: 5 },
    effects: [
        {
            type: 'hero',
            name: 'Sir Valen',
            origin: 'origin_guard',
            level: 1,
            avatar: 'valen.webp'
        },
        {
            type: 'narrative',
            id: 'nar_rescue_mission',
            titleKey: 'nar_rescue_mission_title',
            loreKey: 'nar_rescue_mission_lore',
            era: 1
        }
    ]
}
```

### `reg_forgotten_ruins.js` — `exp_forgotten_tomb`

**From:**
```js
special: { type: 'hero', value: 'Lyra' }
```

**To:**
```js
effects: [
    {
        type: 'hero',
        name: 'Lyra',
        origin: 'origin_arcane_initiate',  // or appropriate origin
        level: 1
    }
]
```

### `reg_iron_peaks.js` — `exp_orc_stronghold`

**From:**
```js
special: { type: 'hero', value: 'Brog' }
```

**To:**
```js
effects: [
    {
        type: 'hero',
        name: 'Brog',
        origin: 'origin_warrior',
        level: 1
    }
]
```

### `reg_ancient_library.js` — `exp_ancient_archives`

**From:**
```js
special: { type: 'unlock', value: 'advanced_logistics' }
```

**To:**
```js
effects: [
    {
        type: 'building_blueprint',
        buildingId: 'advanced_logistics'  // or whatever building this should unlock
    }
]
```

> **Note:** `exp_tutorial_cave` has no `special` reward, so no migration needed.

---

## Phase 4 — Presentation Changes

### 4.1 Buildings UI — Locked State

**File:** `js/presentation/ui/buildings/components/BuildingDetailPane.js`

Currently, when a building is at level 0, the UI shows the upgrade button with costs. For buildings that are newly unlocked (level 0, just added to infrastructure), this is correct — the player can immediately start construction.

No changes needed to `BuildingList.js` because it already iterates `Object.keys(village.infrastructure)`. Hidden buildings simply won't be in the list.

However, we should ensure that a level-0 building shows "Not Built" instead of "Level 0" in the list:

```js
// In BuildingList.js, around line 33:
el('span', { class: 'list-item-level' }, [
    level > 0 ? `${t('shared_uxelm_level')} ${level}` : t('village_uxelm_not_built')
]),
```

> Check if `village_uxelm_not_built` key exists in i18n. If not, add it to all 5 language files as `"Not Built"` (and translations).

---

## Phase 5 — i18n

### 5.1 Add missing keys

**Files:** All 5 language files

Add:
```js
village_uxelm_not_built: 'Not Built',
```

For non-English files, add translations or `// TODO: translate`.

### 5.2 Remove stale keys (if any)

Search for any translation keys that referenced the old `reward.special` system. There shouldn't be any — hero names and building names already have their own keys.

---

## Phase 6 — Tests

### 6.1 Update ExpeditionService tests

**File:** `tests/unit/ExpeditionService.test.js`

#### Remove old special-reward tests
The tests for consumable drops (`_generateConsumableDrops`, `_generateLootDrop`) should still work because those are separate from `_distributeRewards`. But any test that relies on `reward.special` needs updating.

Looking at the current test file, there are no tests for `reward.special` — the consumable tests call `_generateConsumableDrops` directly. So no test deletions needed.

#### Add effect resolver tests

```js
test('ExpeditionService: effect hero grants a hero', () => {
    const { expeditionService, heroService } = createServices();
    const initialCount = heroService.list().length;

    expeditionService._effectGrantHero({ name: 'Test Hero', origin: 'origin_warrior', level: 1 }, []);

    assert.strictEqual(heroService.list().length, initialCount + 1);
    const newHero = heroService.list().find(h => h.name === 'Test Hero');
    assert.ok(newHero);
    assert.strictEqual(newHero.origin, 'origin_warrior');
});

test('ExpeditionService: effect villagers adds population', () => {
    const { expeditionService, villageService } = createServices();
    const initialPop = villageService.getState().population.total;

    expeditionService._resolveEffects({
        reward: { effects: [{ type: 'villagers', count: 3 }] }
    }, []);

    assert.strictEqual(villageService.getState().population.total, initialPop + 3);
});

test('ExpeditionService: effect narrative enqueues to pendingNarratives', () => {
    const { expeditionService } = createServices();
    expeditionService._resolveEffects({
        id: 'exp_test',
        isStory: true,
        reward: { effects: [{ type: 'narrative', titleKey: 't', loreKey: 'l', era: 2 }] }
    }, []);

    const pending = expeditionService.getPendingNarratives();
    assert.strictEqual(pending.length, 1);
    assert.strictEqual(pending[0].titleKey, 't');
    assert.strictEqual(pending[0].era, 2);
});

test('ExpeditionService: effect region_unlock seeds region', () => {
    const { expeditionService, regionService } = createServices();
    assert.ok(!regionService.getRegion('reg_dark_forest'));

    expeditionService._resolveEffects({
        reward: { effects: [{ type: 'region_unlock', regionId: 'reg_dark_forest' }] }
    }, []);

    assert.ok(regionService.getRegion('reg_dark_forest'));
});

test('ExpeditionService: story mission completion is registered', () => {
    const { expeditionService, villageService } = createServices();
    villageService.getState().day = 5;

    const exp = {
        id: 'exp_test_story',
        isStory: true,
        regionId: 'reg_greenfields',
        reward: { gold: 10 }
    };
    const activeExp = { id: 'exp_test_story', currentStage: 1, heroIds: ['hero_1'], status: 'assigned' };

    // Simulate completion by directly calling _finishExpedition internals
    // Or better: test getStoryMissionStatus after a mock completion
    expeditionService.state.completedIds.push(exp.id);
    expeditionService.state.storyMissions[exp.id] = {
        dayCompleted: villageService.getState().day,
        heroIds: ['hero_1']
    };
    expeditionService.save();

    const status = expeditionService.getStoryMissionStatus('exp_test_story');
    assert.ok(status);
    assert.strictEqual(status.dayCompleted, 5);
    assert.deepStrictEqual(status.heroIds, ['hero_1']);
});
```

### 6.2 Update VillageService tests (if any building tests exist)

Search for tests that assert on `infrastructure` shape. If any test checks that `blacksmith` or `tavern` exists in default state, update it.

### 6.3 Run all tests

```bash
node --test tests/unit/ExpeditionService.test.js
node --test tests/unit/VillageService.test.js
node --test tests/unit/RegionService.test.js
node --test tests/unit/*.test.js
```

---

## Phase 7 — Verification Checklist

- [ ] `_distributeRewards` no longer contains `reward.special` handling.
- [ ] `_finishExpedition` calls `_resolveEffects(exp, heroes)` after `_distributeRewards`.
- [ ] `_resolveEffects` handles all 5 effect types: `hero`, `villagers`, `building_blueprint`, `region_unlock`, `narrative`.
- [ ] `VillageService` default state only includes `housing`, `farm`, `warehouse`.
- [ ] `VillageService.unlockBlueprint(buildingId)` adds the building to `infrastructure` at level 0.
- [ ] All 5 story missions migrated from `reward.special` to `reward.effects`.
- [ ] `exp_rescue_mission` narrative moved from `reward.narrative` into `reward.effects`.
- [ ] Story mission completion registry tracks `dayCompleted` and `heroIds`.
- [ ] Building list shows newly unlocked buildings immediately.
- [ ] Level-0 buildings show "Not Built" label.
- [ ] i18n `village_uxelm_not_built` added to all 5 languages.
- [ ] All existing tests pass.

---

## Open Decisions

1. **Which buildings start unlocked?**
   - **Decision:** Only `housing`, `farm`, `warehouse` are in default `infrastructure`. All others require blueprint unlock.
   - The exact blueprint assignments for each story mission are content decisions, not framework decisions.

2. **Should `exp_tutorial_cave` have a narrative effect?**
   - **Decision:** Not in this iteration. It can be added later as a content pass.

3. **What about `advanced_logistics` from `exp_ancient_archives`?**
   - The old `special: { type: 'unlock', value: 'advanced_logistics' }` had no implementation. The new `building_blueprint` effect gives it one. If `advanced_logistics` is not a real building ID, change it to a real one (e.g., `warehouse` upgrade or a new building).
