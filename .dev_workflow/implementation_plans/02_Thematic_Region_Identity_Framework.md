# Implementation Plan: Thematic Region Identity Framework

## Goal
Make regions mechanically distinct by expanding the region data model with first-class domain properties (`scaling`, `lootProfile`, `narrative`). Replace the hardcoded loot `if/else` chain and global scaling formulas with data-driven configuration defined in each region file. All existing regions are updated to use the new schema — no legacy fallbacks, no migration code.

> **Project context:** Alpha stage, single player. When the data model changes, the save is wiped. Clean code over backward compatibility.

---

## Phase 1 — Documentation Update

**File:** `docs/explore/regions_data.md`

Update Section 6 (Region Data Schema) to document the new fields as **required**:

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique region identifier. |
| `name` | `string` | Display name. |
| `branching` | `'low' \| 'medium' \| 'high'` | Controls procedural path spawning. |
| `minStages` | `number` | Minimum stages for procedural nodes. |
| `maxStages` | `number` | Maximum stages for procedural nodes. |
| `enemies` | `string[]` | Enemy template IDs available. |
| `baseLevel` | `number` | Base enemy level. |
| `bossPool` | `string[]` | Boss candidates for final stages. |
| `unlockRequirements` | `object \| null` | Unlock conditions. |
| `storyMissions` | `object[]` | Hand-crafted missions. |
| `scaling` | `{ levelPerClears, statMultiplier, maxLevelCap }` | Difficulty curve for this region. |
| `lootProfile` | `{ materials[], goldBase, goldPerClear }` | Declarative material and gold drops. |
| `narrative` | `{ firstClear: { titleKey, loreKey, era } } \| null` | First-clear narrative trigger. |
| `glyphDropTable` | `any` | **Reserved** for Idea 05. |

Add a note: `scaling` and `lootProfile` are required. Every region must declare its own identity.

---

## Phase 2 — Engine Changes

### 2.1 Add Region Data Validator

**New File:** `js/engine/explore/services/RegionValidator.js`

Simple validator that enforces the new schema. Unknown fields warn (catches typos). Missing required fields error.

```js
const REQUIRED = ['id', 'name', 'branching', 'minStages', 'maxStages', 'enemies', 'baseLevel', 'bossPool', 'scaling', 'lootProfile'];
const KNOWN = new Set([...REQUIRED, 'unlockRequirements', 'storyMissions', 'narrative', 'glyphDropTable']);

export class RegionValidator {
    static validate(region) {
        const errors = [];
        const warnings = [];

        for (const field of REQUIRED) {
            if (region[field] === undefined) errors.push(`Missing required field: ${field}`);
        }
        for (const key of Object.keys(region)) {
            if (!KNOWN.has(key)) warnings.push(`Unknown field: ${key}`);
        }
        if (region.scaling) {
            const s = region.scaling;
            if (typeof s.levelPerClears !== 'number' || s.levelPerClears < 1) errors.push('scaling.levelPerClears must be >= 1');
            if (typeof s.statMultiplier !== 'number' || s.statMultiplier < 1) errors.push('scaling.statMultiplier must be >= 1');
        }
        if (region.lootProfile) {
            if (!Array.isArray(region.lootProfile.materials)) errors.push('lootProfile.materials must be an array');
            for (const m of region.lootProfile.materials || []) {
                if (!m.id || typeof m.min !== 'number' || typeof m.max !== 'number' || typeof m.chance !== 'number') {
                    errors.push(`Invalid material entry: ${JSON.stringify(m)}`);
                }
            }
            if (typeof region.lootProfile.goldBase !== 'number') errors.push('lootProfile.goldBase must be a number');
            if (typeof region.lootProfile.goldPerClear !== 'number') errors.push('lootProfile.goldPerClear must be a number');
        }
        if (region.narrative?.firstClear) {
            const nc = region.narrative.firstClear;
            if (!nc.titleKey || !nc.loreKey) errors.push('narrative.firstClear requires titleKey and loreKey');
        }
        return { valid: errors.length === 0, errors, warnings };
    }
}
```

**File:** `js/engine/explore/data/regions/index.js`

Wire validator on module load:
```js
import { RegionValidator } from '../../services/RegionValidator.js';
for (const [id, region] of Object.entries(REGION_REGISTRY)) {
    const result = RegionValidator.validate(region);
    if (!result.valid) console.error(`[RegionValidator] ${id} errors:`, result.errors);
    if (result.warnings.length) console.warn(`[RegionValidator] ${id} warnings:`, result.warnings);
}
```

### 2.2 Refactor RegionService

**File:** `js/engine/explore/services/RegionService.js`

#### 2.2.1 Remove hardcoded loot block

Delete lines ~521-549 (the entire `if/else` chain). Replace with a generic consumer:

```js
const rewardItems = {};
for (const mat of rData.lootProfile.materials) {
    if (Math.random() < mat.chance) {
        const qty = Math.floor(Math.random() * (mat.max - mat.min + 1)) + mat.min;
        if (qty > 0) rewardItems[mat.id] = (rewardItems[mat.id] || 0) + qty;
    }
}

const tierMult = rData.baseLevel || 1;
const baseGold = (rData.lootProfile.goldBase * tierMult) + (clears * rData.lootProfile.goldPerClear * tierMult);
const gold = Math.floor(baseGold * (0.8 + Math.random() * 0.4));
```

#### 2.2.2 Use per-region scaling

**Current (lines ~434-435):**
```js
const depth = 1 + Math.floor(clears / 2) + Math.floor(Math.random() * 2);
const enemyLevel = (rData.baseLevel || 1) + Math.floor(clears / 3) + Math.floor(depth / 3);
```

**New:**
```js
const scaling = rData.scaling;
const depth = 1 + Math.floor(clears / 2) + Math.floor(Math.random() * 2);
let enemyLevel = (rData.baseLevel || 1)
    + Math.floor(clears / scaling.levelPerClears)
    + Math.floor(depth / scaling.levelPerClears);
if (scaling.maxLevelCap !== null && enemyLevel > scaling.maxLevelCap) {
    enemyLevel = scaling.maxLevelCap;
}
```

#### 2.2.3 Pass `statMultiplier` through the node

Add to the return object of `_createProceduralNode`:
```js
return {
    // ... existing fields ...
    scaling: {
        statMultiplier: rData.scaling.statMultiplier
    }
};
```

#### 2.2.4 First-clear narrative marker

In `completeExpedition`, after detecting `wasFirstClear`, add:

```js
if (wasFirstClear && rData.narrative?.firstClear) {
    region.pendingNarrative = { ...rData.narrative.firstClear, consumed: false };
}
```

Add to `_getDefaultState` migration (this is **not** backward-compatibility — it is initializing a new field for the current alpha save):
```js
if (!region.pendingNarrative) region.pendingNarrative = null;
```

Add public methods:
```js
getPendingNarratives() {
    const pending = [];
    for (const [regionId, region] of Object.entries(this.state.regions)) {
        if (region.pendingNarrative && !region.pendingNarrative.consumed) {
            pending.push({ regionId, ...region.pendingNarrative });
        }
    }
    return pending;
}

consumePendingNarratives() {
    for (const region of Object.values(this.state.regions)) {
        if (region.pendingNarrative && !region.pendingNarrative.consumed) {
            region.pendingNarrative.consumed = true;
        }
    }
    this.save();
}
```

### 2.3 Update ExpeditionService for per-region stat multiplier

**File:** `js/engine/explore/services/ExpeditionService.js`

#### 2.3.1 Pass multiplier to `_createEnemy`

In `processDay`, when creating enemies:
```js
const statMultiplier = stage.statMultiplier || 1.1;  // defensive fallback for manually injected nodes
const enemy = this._createEnemy(e.id, stage.isBoss, enemyLevel, e.isElite || false, e.eliteTier || 0, statMultiplier);
```

#### 2.3.2 Update `_createEnemy` signature and logic

```js
_createEnemy(templateId, isBoss, level = 1, isElite = false, eliteTier = 0, statMultiplier = 1.1) {
    // ...
    const levelMult = Math.pow(statMultiplier, level - 1);
    // ...
}
```

### 2.4 Wire region narratives into GameEngine

**File:** `js/engine/GameEngine.js`

In `nextDay()`, before `unlockService.checkAllUnlocks()`:

```js
const regionNarratives = this.regionService.getPendingNarratives();
for (const rn of regionNarratives) {
    dailyReport.newNarratives.push({
        id: `nar_${rn.regionId}_first_clear`,
        titleKey: rn.titleKey,
        loreKey: rn.loreKey,
        era: rn.era || 1
    });
}
if (regionNarratives.length > 0) {
    this.regionService.consumePendingNarratives();
}
```

---

## Phase 3 — Update All Region Data Files

**Files:** `js/engine/explore/data/regions/reg_*.js` (all 12 existing files)

Every region gets `scaling` and `lootProfile`. No fallbacks, no legacy profiles. Each region declares its own identity.

### Example: `reg_greenfields.js` (safe tutorial zone)
```js
export const reg_greenfields = {
    id: 'reg_greenfields',
    name: 'Greenfields',
    branching: 'low',
    minStages: 1,
    maxStages: 3,
    enemies: ['slime_green', 'wild_boar', 'rabbit_horned', 'slime_earth'],
    baseLevel: 1,
    bossPool: ['slime_fire'],
    scaling: {
        levelPerClears: 5,      // +1 level every 5 clears (slower)
        statMultiplier: 1.08,   // softer stat curve
        maxLevelCap: 10
    },
    lootProfile: {
        materials: [
            { id: 'material_wood', min: 4, max: 7, chance: 1.0 },
            { id: 'material_herb', min: 1, max: 3, chance: 0.6 },
            { id: 'material_stone', min: 1, max: 2, chance: 0.3 }
        ],
        goldBase: 35,
        goldPerClear: 5
    },
    narrative: {
        firstClear: {
            titleKey: 'nar_greenfields_first_clear_title',
            loreKey: 'nar_greenfields_first_clear_lore',
            era: 1
        }
    },
    glyphDropTable: null,  // reserved for Idea 05
    storyMissions: [ /* ... existing ... */ ]
};
```

### Example: `reg_frozen_peaks.js` (preparation check)
```js
export const reg_frozen_peaks = {
    // ... existing fields ...
    scaling: {
        levelPerClears: 2,      // +1 level every 2 clears (steeper)
        statMultiplier: 1.12,
        maxLevelCap: 25
    },
    lootProfile: {
        materials: [
            { id: 'material_steel_ingot', min: 1, max: 3, chance: 1.0 },
            { id: 'material_iron_ore', min: 1, max: 3, chance: 0.4 },
            { id: 'material_mythril', min: 1, max: 1, chance: 0.1 }
        ],
        goldBase: 60,
        goldPerClear: 12
    },
    narrative: {
        firstClear: {
            titleKey: 'nar_frozen_peaks_first_clear_title',
            loreKey: 'nar_frozen_peaks_first_clear_lore',
            era: 3
        }
    },
    glyphDropTable: null,
    // ...
};
```

### Porting the existing loot tables

The current hardcoded `if/else` block defines loot per region. Extract each region's table into its `lootProfile.materials` array:

| Region | Materials to port |
|--------|-------------------|
| `reg_greenfields` | wood (3-6), stone (1-2 @ 50%), iron_ore (1 @ 20%) |
| `reg_tiny_cave` | stone (3-6), iron_ore (1-2 @ 40%), steel_ingot (1 @ 15%) |
| `reg_calmed_beach` | stone (3-5), wood (3-5), iron_ore (1 @ 20%) |
| `reg_dark_forest` | wood (4-7), iron_ore (2-3 @ 50%), steel_ingot (1 @ 15%) |
| `reg_goblin_camp` | iron_ore (3-6), stone (2-4 @ 40%), steel_ingot (1 @ 15%) |
| `reg_mystic_ruins` | iron_ore (2-4), stone (2-4 @ 40%), mythril (1 @ 15%) |
| `reg_frozen_peaks` | steel_ingot (1-3), iron_ore (1-3 @ 40%), mythril (1 @ 10%) |
| `reg_whispering_forest` | *(use forest-themed defaults)* |
| `reg_murky_swamp` | *(use swamp-themed defaults)* |
| `reg_forgotten_ruins` | *(use ruin-themed defaults)* |
| `reg_iron_peaks` | *(unimplemented — placeholder profile)* |
| `reg_ancient_library` | *(unimplemented — placeholder profile)* |

For unimplemented regions (`reg_iron_peaks`, `reg_ancient_library`), add a minimal valid profile:
```js
scaling: { levelPerClears: 3, statMultiplier: 1.1, maxLevelCap: null },
lootProfile: { materials: [], goldBase: 40, goldPerClear: 8 },
narrative: null,
glyphDropTable: null
```

---

## Phase 4 — i18n

**Files:** All 5 language files under `js/engine/shared/core/i18n/translations/`

Add first-clear narrative keys for regions that have `narrative.firstClear`:

```js
nar_greenfields_first_clear_title: 'The Valley Breathes',
nar_greenfields_first_clear_lore: 'The Greenfields were tamer than the stories suggested, but the earth itself seemed to sigh with relief. Somewhere, a rabbit watched from the treeline. The village had claimed its first ground.',

nar_frozen_peaks_first_clear_title: 'Ice Remembers',
nar_frozen_peaks_first_clear_lore: 'The summit did not yield easily. Frost clings to armor, and the wind carries voices that have no throats. Yet the path is open now — and it will not close unless the village forgets how to endure.',
```

For non-English files (`es.js`, `ca.js`, `eu.js`, `gl.js`), provide translations or mark with `// TODO: translate`.

---

## Phase 5 — Presentation Changes

**File:** `js/presentation/ui/explore/components/ExpeditionDetailPane.js` (or relevant region panel)

Add read-only identity badges using existing stat-row patterns:
- **Scaling label**: derived from `levelPerClears` and `statMultiplier` (e.g., "Gentle", "Standard", "Brutal").
- **Loot focus**: derived from `lootProfile.materials` (e.g., "Wood & Herbs", "Steel & Mythril").

No new UI components. Purely additive.

---

## Phase 6 — Tests

### 6.1 New Test File: `tests/unit/RegionService.test.js`

```js
globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {}, clear() {} };

import test from 'node:test';
import assert from 'node:assert';
import { RegionService } from '../../js/engine/explore/services/RegionService.js';
import { VillageService } from '../../js/engine/village/services/VillageService.js';
import { InventoryService } from '../../js/engine/shared/inventory/services/InventoryService.js';

function createServices() {
    const inventoryService = new InventoryService();
    const villageService = new VillageService(inventoryService);
    const regionService = new RegionService(villageService, { deferLoad: true });
    regionService.save();
    return { regionService, villageService };
}

// --- Data Model Tests ---

test('RegionService: greenfields has slower scaling', () => {
    const { regionService } = createServices();
    const rData = regionService.getRegionData('reg_greenfields');
    assert.strictEqual(rData.scaling.levelPerClears, 5);
    assert.strictEqual(rData.scaling.statMultiplier, 1.08);
    assert.strictEqual(rData.scaling.maxLevelCap, 10);
});

test('RegionService: frozen_peaks has steeper scaling', () => {
    const { regionService } = createServices();
    const rData = regionService.getRegionData('reg_frozen_peaks');
    assert.strictEqual(rData.scaling.levelPerClears, 2);
    assert.strictEqual(rData.scaling.statMultiplier, 1.12);
});

// --- Loot Generation Tests ---

test('RegionService: greenfields loot drops configured materials', () => {
    const { regionService } = createServices();
    const node = regionService.generateExpedition('reg_greenfields', 0);
    const items = node.reward.items;
    assert.ok(items.material_wood, 'Should drop wood');
    assert.ok(items.material_wood >= 4 && items.material_wood <= 7, 'Wood qty in configured range');
});

test('RegionService: loot respects goldBase and goldPerClear', () => {
    const { regionService } = createServices();
    const node1 = regionService.generateExpedition('reg_greenfields', 0);
    // greenfields: goldBase=35, goldPerClear=5, baseLevel=1
    assert.ok(node1.reward.gold >= 20 && node1.reward.gold <= 50, `Gold ${node1.reward.gold} in expected range`);

    const node10 = regionService.generateExpedition('reg_greenfields', 10);
    assert.ok(node10.reward.gold >= 35 && node10.reward.gold <= 80, `Gold ${node10.reward.gold} in expected range for clears=10`);
});

// --- Scaling Tests ---

test('RegionService: slower scaling produces lower enemy levels', () => {
    const { regionService } = createServices();
    const node = regionService.generateExpedition('reg_greenfields', 4);
    const stage = node.stages[0];
    // baseLevel=1 + floor(4/5)=0 -> level 1
    assert.strictEqual(stage.enemyLevel, 1);
});

test('RegionService: default scaling produces expected enemy levels', () => {
    const { regionService } = createServices();
    const node = regionService.generateExpedition('reg_dark_forest', 6);
    const stage = node.stages[0];
    // dark_forest levelPerClears=3 (or whatever is configured)
    // baseLevel=3 + floor(6/3)=2 -> >= 5
    assert.ok(stage.enemyLevel >= 5, `Expected >= 5, got ${stage.enemyLevel}`);
});

test('RegionService: maxLevelCap caps enemy level', () => {
    const { regionService } = createServices();
    const node = regionService.generateExpedition('reg_greenfields', 999);
    for (const stage of node.stages) {
        assert.ok(stage.enemyLevel <= 10, `Enemy level ${stage.enemyLevel} exceeds cap 10`);
    }
});

// --- Narrative Tests ---

test('RegionService: first clear enqueues narrative marker', () => {
    const { regionService } = createServices();
    const region = regionService.getRegion('reg_greenfields');
    region.clears = 0;
    region.availableNodes = [regionService.generateExpedition('reg_greenfields', 0)];
    const exp = region.availableNodes[0];

    regionService.completeExpedition(exp.id, [], [], []);

    assert.ok(region.pendingNarrative, 'Pending narrative should exist');
    assert.strictEqual(region.pendingNarrative.titleKey, 'nar_greenfields_first_clear_title');
    assert.strictEqual(region.pendingNarrative.consumed, false);
});

test('RegionService: second clear does not enqueue narrative', () => {
    const { regionService } = createServices();
    const region = regionService.getRegion('reg_greenfields');
    region.clears = 1;
    region.firstClearBonusGiven = true;
    region.availableNodes = [regionService.generateExpedition('reg_greenfields', 1)];
    const exp = region.availableNodes[0];

    regionService.completeExpedition(exp.id, [], [], []);

    assert.strictEqual(region.pendingNarrative, null);
});

test('RegionService: consumePendingNarratives marks consumed', () => {
    const { regionService } = createServices();
    const region = regionService.getRegion('reg_greenfields');
    region.pendingNarrative = { titleKey: 't', loreKey: 'l', consumed: false };

    regionService.consumePendingNarratives();

    assert.strictEqual(region.pendingNarrative.consumed, true);
});

// --- Validator Tests ---

test('RegionValidator: passes valid region', async () => {
    const { RegionValidator } = await import('../../js/engine/explore/services/RegionValidator.js');
    const result = RegionValidator.validate({
        id: 'reg_test', name: 'Test', branching: 'low',
        minStages: 1, maxStages: 2, enemies: ['a'], baseLevel: 1,
        bossPool: [], scaling: { levelPerClears: 3, statMultiplier: 1.1, maxLevelCap: null },
        lootProfile: { materials: [], goldBase: 40, goldPerClear: 8 }
    });
    assert.strictEqual(result.valid, true);
});

test('RegionValidator: fails missing scaling', async () => {
    const { RegionValidator } = await import('../../js/engine/explore/services/RegionValidator.js');
    const result = RegionValidator.validate({
        id: 'reg_test', name: 'Test', branching: 'low',
        minStages: 1, maxStages: 2, enemies: ['a'], baseLevel: 1,
        bossPool: [], lootProfile: { materials: [], goldBase: 40, goldPerClear: 8 }
    });
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('scaling')));
});

test('RegionValidator: warns on unknown field', async () => {
    const { RegionValidator } = await import('../../js/engine/explore/services/RegionValidator.js');
    const result = RegionValidator.validate({
        id: 'reg_test', name: 'Test', branching: 'low',
        minStages: 1, maxStages: 2, enemies: ['a'], baseLevel: 1,
        bossPool: [], scaling: { levelPerClears: 3, statMultiplier: 1.1, maxLevelCap: null },
        lootProfile: { materials: [], goldBase: 40, goldPerClear: 8 },
        unknownFutureField: true
    });
    assert.strictEqual(result.valid, true);
    assert.ok(result.warnings.some(w => w.includes('unknownFutureField')));
});
```

### 6.2 Run Existing Tests

```bash
node --test tests/unit/ExpeditionService.test.js
node --test tests/unit/RegionService.test.js
```

All tests must pass. The only observable change for existing regions is that their loot/stats now come from data instead of code — the values should match.

---

## Phase 7 — Verification Checklist

- [ ] `docs/explore/regions_data.md` updated with new required schema fields.
- [ ] `RegionValidator.js` created and wired into `regions/index.js`.
- [ ] `RegionService` hardcoded `if/else` loot block **entirely removed**.
- [ ] `RegionService._createProceduralNode` uses `rData.scaling` and `rData.lootProfile` directly.
- [ ] `ExpeditionService._createEnemy` accepts and uses `statMultiplier`.
- [ ] All 12 region files updated with `scaling`, `lootProfile`, `narrative`, and `glyphDropTable`.
- [ ] First-clear narrative markers work and are consumed in `GameEngine.nextDay()`.
- [ ] i18n narrative keys added to all 5 language files.
- [ ] `RegionService.test.js` passes with >= 12 tests.
- [ ] `ExpeditionService.test.js` still passes (16/16).
- [ ] No legacy fallback code, migration code, or `LEGACY_LOOT_PROFILES` catalog exists.
