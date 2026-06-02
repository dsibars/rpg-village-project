# Implementation Plan: Magic Glyph Drop Framework

## Goal

Connect the expedition system to the Magic Circle system by allowing regions to drop **glyph tablets** as expedition rewards. Make magic progression region-gated: players must venture into specific areas to obtain specific glyphs.

> **Builds on:** Idea 02 (Region Identity — `glyphDropTable` field already exists in all region files, currently `null`). Idea 04 (Story Mission Effects — `_finishExpedition` reward distribution is clean and extensible).

---

## Phase 1 — Documentation Update

### 1.1 Update `docs/explore/regions_data.md`

Add a new section "Glyph Drops":

> Regions may declare an optional `glyphDropTable` array and `glyphDropChance` scalar:
> ```js
> glyphDropChance: 0.40, // 40% base chance per expedition
> glyphDropTable: [
>   { glyphId: 'glyph_fire', weight: 10, tier: 1 },
>   { glyphId: 'glyph_water', weight: 10, tier: 1 },
>   { glyphId: 'glyph_earth', weight: 8,  tier: 1 },
>   { glyphId: 'glyph_wind',  weight: 8,  tier: 1 }
> ]
> ```
> `glyphDropChance` scales with region level: `finalChance = baseChance + (regionClears * 0.02)`.
> When a drop triggers, `LootService` rolls the weighted table and returns a glyph tablet item.

### 1.2 Update `docs/shared/combat/magic_circle_system.md`

In the "Learn Glyphs" section, add:

> **Glyph Tablets**: Found as expedition drops in magic-themed regions. Tablets are inventory items (`tablet_glyph_<type>_<tier>`). A hero can consume a tablet via `HeroService.useGlyphTablet(heroId, tabletId)` to learn the glyph. If the hero already knows the glyph, the tablet is returned (no consumption).

---

## Phase 2 — Engine Changes

### 2.1 Add Glyph Tablet Items to Inventory System

**File:** `js/engine/shared/data/InventoryData.js`

Glyph tablets do **not** need entries in `CONSUMABLES_DATA` because they are not used in combat (BattleService's `useConsumable` only handles `HEAL_HP`/`HEAL_MP`/`ESCAPE`). They are pure inventory items that get consumed through a dedicated engine API.

However, we should add a registry so the system knows which tablet ID maps to which glyph:

```js
export const GLYPH_TABLET_DATA = {
    tablet_glyph_fire_1:   { glyphId: 'glyph_fire',   tier: 1 },
    tablet_glyph_water_1:  { glyphId: 'glyph_water',  tier: 1 },
    tablet_glyph_earth_1:  { glyphId: 'glyph_earth',  tier: 1 },
    tablet_glyph_wind_1:   { glyphId: 'glyph_wind',   tier: 1 },
    tablet_glyph_pierce_1: { glyphId: 'glyph_pierce', tier: 1 },
    tablet_glyph_multi_1:  { glyphId: 'glyph_multi',  tier: 1 },
    tablet_glyph_dark_1:   { glyphId: 'glyph_dark',   tier: 1 }
};
```

> **Rationale:** This is a lookup table, not a consumable effect definition. The tablet-to-glyph mapping lives here because it's item data. The `InventoryService` will route `tablet_*` IDs into the `consumables` bucket automatically (anything not starting with `material_` or `food_` goes there).

### 2.2 Add `generateGlyphDrop` to LootService

**File:** `js/engine/explore/services/LootService.js`

#### 2.2.1 Add the method

```js
generateGlyphDrop(regionId) {
    const region = this.regionService.getRegion(regionId);
    if (!region || !region.glyphDropTable || region.glyphDropTable.length === 0) {
        return null;
    }

    // Base chance + scaling per region clear
    const clears = region.clears || 0;
    const baseChance = region.glyphDropChance || 0;
    const dropChance = Math.min(1.0, baseChance + (clears * 0.02));

    if (Math.random() >= dropChance) {
        return null;
    }

    // Weighted roll
    const totalWeight = region.glyphDropTable.reduce((sum, entry) => sum + (entry.weight || 1), 0);
    let roll = Math.random() * totalWeight;

    for (const entry of region.glyphDropTable) {
        roll -= (entry.weight || 1);
        if (roll <= 0) {
            const tier = entry.tier || 1;
            const type = entry.glyphId.replace('glyph_', '');
            const tabletId = `tablet_glyph_${type}_${tier}`;
            return { tabletId, glyphId: entry.glyphId, tier };
        }
    }

    return null; // Fallback
}
```

#### 2.2.2 Ensure LootService has access to region data

`LootService` already receives `regionService` in its constructor (verify this). If not, inject it.

### 2.3 Populate `glyphDropTable` in Region Data

**Files:** `js/engine/explore/data/regions/reg_mystic_ruins.js`, `reg_forgotten_ruins.js`

#### `reg_mystic_ruins.js` — The Magic Area

```js
glyphDropChance: 0.40,
glyphDropTable: [
    { glyphId: 'glyph_fire',  weight: 10, tier: 1 },
    { glyphId: 'glyph_water', weight: 10, tier: 1 },
    { glyphId: 'glyph_earth', weight: 8,  tier: 1 },
    { glyphId: 'glyph_wind',  weight: 8,  tier: 1 }
]
```

#### `reg_forgotten_ruins.js` — Advanced Effects

```js
glyphDropChance: 0.25,
glyphDropTable: [
    { glyphId: 'glyph_pierce', weight: 10, tier: 1 },
    { glyphId: 'glyph_multi',  weight: 8,  tier: 1 },
    { glyphId: 'glyph_dark',   weight: 6,  tier: 1 }
]
```

> **Note:** Other regions keep `glyphDropTable: null` (or omit the field). The LootService handles both gracefully.

### 2.4 Wire Glyph Drops into Expedition Completion

**File:** `js/engine/explore/services/ExpeditionService.js`

#### 2.4.1 Modify `_distributeRewards` to return drops

Current `_distributeRewards` is side-effect only. Change it to collect and return all drops:

```js
_distributeRewards(exp) {
    const drops = { items: {}, loot: null, consumables: [], glyphs: [] };

    if (exp.reward.gold) {
        this.villageService.addGold(exp.reward.gold);
    }

    if (exp.reward.items) {
        Object.entries(exp.reward.items).forEach(([id, qty]) => {
            this.villageService.addItemToInventory(id, qty);
            drops.items[id] = qty;
        });
    }

    const loot = this.lootService.generateLootDrop(exp.regionId);
    if (loot) {
        this.inventoryService.addEquipment(loot);
        drops.loot = loot;
    }

    const consumables = this.lootService.generateConsumableDrops(exp.regionId);
    consumables.forEach(({ id, qty }) => {
        this.villageService.addItemToInventory(id, qty);
        drops.consumables.push({ id, qty });
    });

    // NEW: Glyph tablet drops
    const glyphDrop = this.lootService.generateGlyphDrop(exp.regionId);
    if (glyphDrop) {
        this.villageService.addItemToInventory(glyphDrop.tabletId, 1);
        drops.glyphs.push(glyphDrop);
    }

    return drops;
}
```

#### 2.4.2 Include drops in `_finishExpedition` return value

```js
const drops = this._distributeRewards(exp);

// ... existing _finishExpedition code ...

return Result.ok({
    status: 'completed',
    expId: exp.id,
    expName: exp.name,
    reward: exp.reward,
    drops
});
```

> **Note:** The `drops` field now contains `{ items, loot, consumables, glyphs }`. The UI can display whatever it needs. Existing code that only reads `reward` is unaffected.

### 2.5 Add Glyph Tablet Consumption to HeroService

**File:** `js/engine/heroes/services/HeroService.js`

Add a public method that validates inventory, consumes the tablet, and teaches the glyph:

```js
useGlyphTablet(heroId, tabletId) {
    const hero = this.get(heroId);
    if (!hero) return Result.fail('heroes_error_not_found');

    const tabletData = GLYPH_TABLET_DATA[tabletId];
    if (!tabletData) return Result.fail('heroes_error_item_type_invalid');

    // Check hero already knows glyph
    if (hero.knownGlyphs.includes(tabletData.glyphId)) {
        return Result.fail('heroes_error_glyph_already_known');
    }

    // Check inventory has tablet
    const hasTablet = this.inventoryService.getItemCount(tabletId) > 0;
    if (!hasTablet) return Result.fail('inventory_error_item_not_enough');

    // Consume tablet
    const useResult = this.inventoryService.useItem(tabletId, 1);
    if (!useResult.success) return useResult;

    // Learn glyph
    const learnResult = hero.learnGlyph(tabletData.glyphId);
    if (!learnResult.success) {
        // Refund tablet on learn failure
        this.inventoryService.addItem(tabletId, 1);
        return learnResult;
    }

    this.saveAll();
    return Result.ok({ heroId, glyphId: tabletData.glyphId, tier: tabletData.tier });
}
```

> **Dependencies:** `HeroService` needs access to `inventoryService`. Check if it already has it; if not, inject it via constructor.

### 2.6 Update RegionValidator

**File:** `js/engine/explore/services/RegionValidator.js`

If `glyphDropChance` is added as a new top-level field, add it to `KNOWN_FIELDS`. If we reuse the existing schema without adding `glyphDropChance` (deriving it from `baseLevel` instead), no validator change is needed.

> **Decision:** Add `glyphDropChance` to `KNOWN_FIELDS` for explicitness:
> ```js
> const KNOWN_FIELDS = [
>     'id', 'name', 'branching', 'minStages', 'maxStages', 'enemies',
>     'baseLevel', 'bossPool', 'scaling', 'lootProfile', 'narrative',
>     'glyphDropTable', 'glyphDropChance', 'unlockRequirements', 'storyMissions'
> ];
> ```

---

## Phase 3 — Presentation Changes

### 3.1 Daily Report — Show Glyph Drops

**File:** `js/presentation/ui/village/components/DailyReportModal.js`

Extend the expedition completed section to include glyph drops:

```js
if (exp.status === 'completed') {
    let rewardsStr = '';
    if (exp.reward) {
        const rewards = [];
        if (exp.reward.gold) rewards.push(`${exp.reward.gold} ${this.t('village_info_gold')}`);
        if (exp.reward.items) {
            for (const [id, qty] of Object.entries(exp.reward.items)) {
                const transKey = id.startsWith('material_') || id.startsWith('food_') || id.startsWith('meal_') ? id : 'item_' + id;
                rewards.push(`${qty} ${this.t(transKey)}`);
            }
        }
        // NEW: Glyph drops
        if (exp.drops?.glyphs?.length > 0) {
            for (const drop of exp.drops.glyphs) {
                rewards.push(`${this.t('item_' + drop.tabletId)}`);
            }
        }
        rewardsStr = rewards.join(', ');
    }
    // ... rest unchanged
}
```

### 3.2 Inventory UI — Glyph Tablets Already Visible

No changes needed. Glyph tablets route to the `consumables` bucket and appear in the inventory grid automatically. The detail pane shows their description via `item_<id>_desc` i18n key.

### 3.3 Magic Circle UI — Consume Tablet Button (Minimal)

**File:** `js/presentation/ui/magic_circle/MagicCircleView.js` (or wherever the glyph list is shown)

Add a minimal "Learn from Tablet" button next to unknown glyphs. This is a thin UI wrapper around `HeroService.useGlyphTablet`:

```js
// In the glyph list renderer, for each glyph the hero does NOT know:
const tabletId = `tablet_glyph_${glyphType}_1`;
const hasTablet = state.inventory?.consumables?.[tabletId] > 0;
if (hasTablet) {
    // Render a small button: "Learn from Tablet"
    // On click: this.adapter.engine.heroService.useGlyphTablet(heroId, tabletId)
    // Then refresh the view
}
```

> **Out of Scope Note:** If this UI change is considered too large for Idea 05, the plan can skip it. The engine API (`useGlyphTablet`) will exist and can be wired later. The success criterion "A hero who receives a glyph_fire tablet can consume it to learn the glyph" is satisfied by the engine API alone; UI wiring is presentation-layer convenience.

---

## Phase 4 — i18n

### 4.1 Add Item Translation Keys

**Files:** All 5 language files (`js/engine/shared/core/i18n/translations/{en,es,ca,eu,gl}.js`)

Add after the existing item keys:

```js
item_tablet_glyph_fire_1:   "Fire Glyph Tablet",
item_tablet_glyph_fire_1_desc:   "Teaches the Fire Core glyph to a hero.",
item_tablet_glyph_water_1:  "Water Glyph Tablet",
item_tablet_glyph_water_1_desc:  "Teaches the Water Core glyph to a hero.",
item_tablet_glyph_earth_1:  "Earth Glyph Tablet",
item_tablet_glyph_earth_1_desc:  "Teaches the Earth Core glyph to a hero.",
item_tablet_glyph_wind_1:   "Wind Glyph Tablet",
item_tablet_glyph_wind_1_desc:   "Teaches the Wind Core glyph to a hero.",
item_tablet_glyph_pierce_1: "Pierce Glyph Tablet",
item_tablet_glyph_pierce_1_desc: "Teaches the Pierce glyph to a hero.",
item_tablet_glyph_multi_1:  "Multi-Target Glyph Tablet",
item_tablet_glyph_multi_1_desc:  "Teaches the Multi-Target glyph to a hero.",
item_tablet_glyph_dark_1:   "Dark Glyph Tablet",
item_tablet_glyph_dark_1_desc:   "Teaches the Dark Core glyph to a hero."
```

For non-English files, add translations or `// TODO: translate` placeholders.

### 4.2 Add Error Key (if new)

If `heroes_error_glyph_already_known` is already used by `learnGlyph`, no new error key is needed for `useGlyphTablet`.

---

## Phase 5 — Tests

### 5.1 LootService Tests

**File:** `tests/unit/LootService.test.js` (create if missing)

```js
test('LootService: generateGlyphDrop returns null for region without table', () => {
    const { lootService } = createServices();
    const drop = lootService.generateGlyphDrop('reg_greenfields');
    assert.strictEqual(drop, null);
});

test('LootService: generateGlyphDrop respects drop chance', () => {
    const { lootService, regionService } = createServices();
    // Mock Math.random to force a drop
    const originalRandom = Math.random;
    Math.random = () => 0.1; // Below 0.40 chance

    const drop = lootService.generateGlyphDrop('reg_mystic_ruins');
    assert.ok(drop);
    assert.ok(drop.tabletId.startsWith('tablet_glyph_'));
    assert.ok(drop.glyphId.startsWith('glyph_'));

    Math.random = originalRandom;
});

test('LootService: generateGlyphDrop returns null when roll fails', () => {
    const { lootService } = createServices();
    const originalRandom = Math.random;
    Math.random = () => 0.99; // Above drop chance

    const drop = lootService.generateGlyphDrop('reg_mystic_ruins');
    assert.strictEqual(drop, null);

    Math.random = originalRandom;
});

test('LootService: generateGlyphDrop scales chance with clears', () => {
    const { lootService, regionService } = createServices();
    regionService.getRegion('reg_mystic_ruins').clears = 10;
    // 0.40 + (10 * 0.02) = 0.60
    const originalRandom = Math.random;
    Math.random = () => 0.55; // Would fail at 0.40, passes at 0.60

    const drop = lootService.generateGlyphDrop('reg_mystic_ruins');
    assert.ok(drop);

    Math.random = originalRandom;
});
```

### 5.2 ExpeditionService Tests

**File:** `tests/unit/ExpeditionService.test.js`

```js
test('ExpeditionService: _distributeRewards includes glyph drops', () => {
    const { expeditionService } = createServices();
    const exp = {
        id: 'exp_test',
        regionId: 'reg_mystic_ruins',
        reward: { gold: 100 }
    };

    // Force a glyph drop by mocking LootService
    const originalGlyphDrop = expeditionService.lootService.generateGlyphDrop;
    expeditionService.lootService.generateGlyphDrop = () => ({
        tabletId: 'tablet_glyph_fire_1',
        glyphId: 'glyph_fire',
        tier: 1
    });

    const drops = expeditionService._distributeRewards(exp);
    assert.ok(drops.glyphs);
    assert.strictEqual(drops.glyphs.length, 1);
    assert.strictEqual(drops.glyphs[0].tabletId, 'tablet_glyph_fire_1');

    expeditionService.lootService.generateGlyphDrop = originalGlyphDrop;
});

test('ExpeditionService: _finishExpedition returns drops in result', () => {
    const { expeditionService } = createServices();
    // ... setup mock expedition ...
    // Assert that result.data.drops exists and contains glyphs array
});
```

### 5.3 HeroService Tests

**File:** `tests/unit/HeroService.test.js`

```js
test('HeroService: useGlyphTablet teaches glyph and consumes item', () => {
    const { heroService, inventoryService } = createServices();
    const hero = heroService.list()[0];
    inventoryService.addItem('tablet_glyph_fire_1', 1);

    assert.ok(!hero.knownGlyphs.includes('glyph_fire'));

    const result = heroService.useGlyphTablet(hero.id, 'tablet_glyph_fire_1');
    assert.ok(result.success);
    assert.ok(hero.knownGlyphs.includes('glyph_fire'));
    assert.strictEqual(inventoryService.getItemCount('tablet_glyph_fire_1'), 0);
});

test('HeroService: useGlyphTablet fails if hero already knows glyph', () => {
    const { heroService, inventoryService } = createServices();
    const hero = heroService.list()[0];
    hero.learnGlyph('glyph_fire');
    inventoryService.addItem('tablet_glyph_fire_1', 1);

    const result = heroService.useGlyphTablet(hero.id, 'tablet_glyph_fire_1');
    assert.ok(!result.success);
    assert.strictEqual(inventoryService.getItemCount('tablet_glyph_fire_1'), 1); // Not consumed
});

test('HeroService: useGlyphTablet fails without inventory', () => {
    const { heroService } = createServices();
    const hero = heroService.list()[0];

    const result = heroService.useGlyphTablet(hero.id, 'tablet_glyph_fire_1');
    assert.ok(!result.success);
});
```

### 5.4 Run All Tests

```bash
npm test
```

---

## Phase 6 — Verification Checklist

- [ ] `LootService.generateGlyphDrop(regionId)` exists and returns `{ tabletId, glyphId, tier }` or `null`.
- [ ] Drop chance is data-driven per region (`glyphDropChance`) and scales with clears.
- [ ] `glyphDropTable` is populated for `reg_mystic_ruins` (4 elemental glyphs) and `reg_forgotten_ruins` (3 effect glyphs).
- [ ] `GLYPH_TABLET_DATA` registry maps all tablet IDs to glyph IDs.
- [ ] `_distributeRewards` returns a `drops` object containing `{ items, loot, consumables, glyphs }`.
- [ ] `_finishExpedition` includes `drops` in its returned `Result`.
- [ ] Glyph tablets are added to inventory as consumable items.
- [ ] `HeroService.useGlyphTablet(heroId, tabletId)` validates inventory, consumes tablet, teaches glyph.
- [ ] If hero already knows the glyph, tablet is not consumed.
- [ ] Daily report modal displays glyph drops alongside gold and materials.
- [ ] All 7 glyph tablet types have i18n keys in all 5 languages.
- [ ] `RegionValidator` recognizes `glyphDropChance` without warnings.
- [ ] All existing tests pass.

---

## Open Decisions

1. **Should glyph tablets be sellable?**
   - **Decision:** No ShopCatalog entries for now. Tablets are drop-only. Can be added later if economy design demands it.

2. **Should the Magic Circle UI show a "Learn from Tablet" button?**
   - **Decision:** Include a minimal button in the plan (Phase 3.3), but it's optional. The engine API satisfies the core success criterion. If time is short, skip the UI button and wire it in a future polish pass.

3. **What about tier 2+ tablets?**
   - **Decision:** All initial drops are tier 1. The framework supports `tier` in `glyphDropTable`, so higher-tier tablets can be added to late-game regions later without code changes.

4. **Should tablets auto-teach on drop (e.g., to the expedition leader)?**
   - **Decision:** No. Tablets go to shared inventory. The player decides which hero learns which glyph. This preserves strategic choice and matches the inventory-driven design.
