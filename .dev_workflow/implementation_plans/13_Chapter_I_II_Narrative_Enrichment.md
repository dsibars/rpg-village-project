# Implementation Plan 13: Chapter I & II Narrative Enrichment — Unified Chronicle

> **Status:** Design Proposal — Unified Chronicle with Flat Discovery Log
> **Scope:** Chapter 1 — The Spark + Chapter 2 — The Circle
> **Goal:** Eliminate duplication between cinematic presentations and ambient toasts. Enrich both chapters with new milestone narratives. Unify everything into a single Chronicle with a two-pane layout: left = chapter-bound main milestones, right = flat discovery log of all secondary lore.

---

## Guiding Architecture

### One Chronicle, Two Panes

The Chronicle is the player's **living history** and **achievement system disguised as lore**. It has two distinct visual zones:

| Pane | Content | Count (Ch I & II) | Visual Weight |
|---|---|---|---|
| **Left — Main Milestones** (70%) | `PresentationCatalog` entries, grouped by chapter | 18 (9 per chapter) | Bold, colorful, image-backed, replayable |
| **Right — Discovery Log** (30%) | `UnlockNarratives` entries, **one flat list** | ~21 | Muted, compact, sorted by day seen |

**Key decision:** Secondary lore is **not bound to chapters**. It is ambient, episodic, and non-linear. The right pane treats it as a **journal** — a flat collection of "things that happened" sorted by when they occurred.

### Three Tiers of Narrative

| Tier | System | Tracked | Format | Purpose |
|---|---|---|---|---|
| **Cinematic** | `PresentationCatalog` | Left pane, chapter-bound | Multi-page, unique art, manual advance | Emotional story beats |
| **Milestone** | `PresentationCatalog` | Left pane, chapter-bound | 1-page, reused asset, manual advance | Critical mechanic tutorials dressed as lore |
| **Ambient** | `UnlockNarratives` | Right pane, flat log | Toast (auto-dismiss), replayable as simple modal | Atmospheric flavor + soft hints |

---

## Phase 0 — Complete Content Matrix

### 0.1 Left Pane — Main Milestones (PresentationCatalog)

**Existing Cinematic Presentations (12):** Text and triggers preserved. Only image paths updated.

**New Milestone Presentations (5):** 1 page each, reuse existing game assets.

| ID | Chapter | Trigger | Pages | Image | Text Key | Why Main Milestone |
|---|---|---|---|---|---|---|
| `pres_prologue` | 1 | `new_game` | 3 | `story/valley_dawn.webp` | `pres_prologue_p1–p3` | Emotional anchor |
| `pres_first_harvest` | 1 | `building_complete` farm L1 | 1 | `story/farm_dawn.webp` | `pres_first_harvest_p1` | First building reward |
| `pres_shield_dark` | 1 | `mission_complete` rescue | 2 | `story/valen_rubble.webp` | `pres_shield_dark_p1–p2` | First hero rescue |
| `pres_warm_fire` | 1 | `building_complete` tavern L1 | 2 | `story/tavern_dusk.webp` | `pres_warm_fire_p1–p2` | Community begins |
| `pres_discipline` | 1 | `first_event` hero Lv5 | 2 | `story/training_clarity.webp` | `pres_discipline_p1–p2` | Gambits unlocked |
| `pres_first_spark` | 1 | `hero_recruited` arcane_initiate | 3 | `story/elara_twilight.webp` | `pres_first_spark_p1–p3` | Magic enters world |
| **`pres_first_victory`** | **1** | **First non-tutorial expedition win** | **1** | **`assets/heroes/arthur.webp`** | **`pres_first_victory_p1`** | **Teaches: core reward loop** |
| **`pres_first_defeat`** | **1** | **First expedition retreat** | **1** | **`assets/heroes/arthur.webp`** | **`pres_first_defeat_p1`** | **Teaches: failure = learning** |
| `pres_chapter1_finale` | 1 | `chapter_milestones` 3/4 | 2 | `story/village_above.webp` | `pres_chapter1_finale_p1–p2` | Chapter resolution |
| `pres_language_world` | 2 | `building_complete` sanctum L1 | 3 | `story/sanctum_hum.webp` | `pres_language_world_p1–p3` | Magic system live |
| `pres_name_flame` | 2 | `first_event` spell inscribed | 2 | `story/circle_flare.webp` | `pres_name_flame_p1–p2` | First custom spell |
| `pres_veil_thins` | 2 | `building_complete` witch_hut L1 | 2 | `story/witch_appears.webp` | `pres_veil_thins_p1–p2` | Progress oracle |
| `pres_world_opens` | 2 | `building_complete` explorer_guild L1 | 2 | `story/guild_maps.webp` | `pres_world_opens_p1–p2` | World expands |
| **`pres_first_spell_cast`** | **2** | **First spell used in combat** | **1** | **`assets/heroes/elara.webp`** | **`pres_first_spell_cast_p1`** | **Teaches: MP management** |
| **`pres_first_boss_defeated`** | **2** | **First boss enemy defeated** | **1** | **`assets/enemies/goblin_king.webp`** | **`pres_first_boss_defeated_p1`** | **Teaches: boss loot + gambits** |
| `pres_chapter2_finale` | 2 | `chapter_milestones` 3/5 | 2 | `story/village_night_colors.webp` | `pres_chapter2_finale_p1–p2` | Chapter resolution |

### 0.2 Right Pane — Discovery Log (UnlockNarratives)

**Rewritten (8):** Removed duplication with presentations. Now serve as soft hints or alternate POV.

| ID | Era | Trigger | Title | Lore (Toast) | Hint |
|---|---|---|---|---|---|
| `nar_sir_valen_joins` | 1 | Hero `Sir Valen` exists | A Shield in the Dark | "Sir Valen has taken his post at the gate. His Guard origin steadies the whole party — they now take 10% less physical damage. Place him in the front line and let him hold." | Guard trait + positioning |
| `nar_first_skill_slot` | 1 | Any hero reaches Lv 5 | Awakening | "A hero has grown strong enough to learn a new technique family. Visit the Training Grounds to spend their Skill Point. Choose carefully — retraining costs gold and locks the hero for 3 days." | Skill system + retraining |
| `nar_tavern_built` | 1 | Tavern L1 | A Warm Fire | "The Tavern doors are open. Heroes arrive automatically every 5–7 days. Manual recruitment is also available — but each new hero makes the next one more expensive." | Auto-recruit + scaling costs |
| `nar_elara_arrives` | 2 | `origin_arcane_initiate` recruited | The First Spark | "A mage has joined the roster. Arcane Initiates wield devastating magic, but their bodies are frail. Keep her behind your warriors. To unlock her circle, build an Arcane Sanctum." | Mage positioning + building gate |
| `nar_magic_circle_unlocked` | 2 | Arcane Sanctum L1 | The Language of the World | "The Sanctum is complete. Compose spells by placing a Core Glyph — Fire, Water, Wind, or Storm — in the center. The circle grows as Magic Tier rises. One slot now. Many later." | Magic circle basics |
| `nar_witch_hut_built` | 2 | Witch's Hut L1 | The Veil Thins | "The Witch offers one reading per hero per day. She speaks in riddles, but her words reveal how close a hero is to their next Magic Tier and which Glyphs are nearing mastery." | Witch mechanic |
| `nar_first_spell_composed` | 2 | First spell saved to codex | A Name in Flame | "A spell has been inscribed to the Codex. Spells cost MP but ignore enemy defense. Balance your party — warriors for sustained stamina damage, mages for magical burst." | Combat roles: STA vs MP |
| `nar_explorer_guild_built` | 2 | Explorer Guild L1 | The World Opens | "New regions await. The Guild reduces expedition stages and unlocks advanced maps. Assign Scout villagers to shorten journeys — every two scouts remove one stage." | Scout villager effect |

**Kept Unchanged (6):** Already unique, no duplication.

| ID | Era | Trigger | Why Kept |
|---|---|---|---|
| `nar_first_expedition` | 1 | Tutorial cave complete | Unique atmospheric text, no presentation overlap |
| `nar_tiny_cave_found` | 1 | Region `reg_tiny_cave` unlocked | Unique atmospheric text |
| `nar_shop_unlocked` | 1 | Shop unlocks | Unique text, different moment from any presentation |
| `nar_dark_forest_found` | 2 | Region `reg_dark_forest` unlocked | Unique atmospheric text |
| `nar_defense_first_raid` | 2 | First raid resolved | Unique text, no presentation overlap |
| `nar_undefended_raid` | 2 | Raid lost with 0 defenders | Unique text, failure-state flavor |

**New Additions (8):** Fill gaps in the player journey.

| ID | Era | Trigger | Title | Lore (Toast) | Hint |
|---|---|---|---|---|---|
| `nar_first_building` | 1 | First building completes | The First Nail | "The hammer fell, and something new stood where nothing had stood before. The villagers watched in silence. They had not built a structure — they had built a future." | Emotional only |
| `nar_first_equip` | 1 | First item equipped on any hero | The First Edge | "The hero tested the weight, adjusted the grip, and nodded. Wearing multiple pieces of the same material grants set bonuses at 2, 4, and 6 pieces. Plan your loadouts." | Set bonus system |
| `nar_shop_first_purchase` | 1 | First shop purchase | The First Sale | "The merchant counted the coins twice. 'A village that buys is a village that sells,' he muttered. Sell him raw grain, wood, or stone — but know that crafting and expeditions yield far more gold." | Sell prices low; better income sources |
| `nar_blacksmith_built` | 1 | Blacksmith L1 | The Forge Roars | "The forge roared to life. The smith — a broad woman with soot for fingerprints — did not greet anyone. She only said: 'Bring me ore. I will bring you edges.' The Forge is now open." | Forge unlock + refining teaser |
| `nar_calmed_beach_found` | 2 | Region `reg_calmed_beach` unlocked | The Tidemark | "The beach was not empty. Shells arranged in spirals. Footprints that ended at the tide line. The sea here is calm, but it is not silent. It is listening." | Atmospheric |
| `nar_dark_forest_first_clear` | 2 | First Dark Forest expedition completed | The Trees Step Aside | "The forest respects those who return. Your heroes brought back stories the villagers will tell for years. Some regions grant a permanent +2 Speed bonus on first clear — to every hero who fought." | First-clear speed bonus |
| `nar_goblin_camp_found` | 2 | Region `reg_goblin_camp` unlocked | The Ridge Smokes | "Smoke rose from the ridge — thick and greasy. Goblins do not farm. They take. And now they know where the village is." | Atmospheric + danger foreshadow |
| `nar_academy_first_lesson` | 2 | First Glyph Academy session started | The First Exchange | "One teacher. One student. One Glyph. The Academy takes 3–5 days, and neither can expedition during that time. But the student will carry that knowledge into every battle thereafter." | Academy time cost + trade-off |

### 0.3 Keys to Remove from i18n

Orphaned keys with no catalog entry:
- `nar_rescue_mission_title` / `nar_rescue_mission_lore`
- `nar_greenfields_first_clear_title` / `nar_greenfields_first_clear_lore`
- `nar_frozen_peaks_first_clear_title` / `nar_frozen_peaks_first_clear_lore`

---

## Phase 1 — Engine Data Changes

### 1.1 `js/engine/shared/data/PresentationCatalog.js`

**A. Update image paths** for existing 12 presentations (mapping from Section 0.1).

**B. Add 6 new milestone presentations.** Example:

```js
{
    id: 'pres_first_victory',
    chapter: 1,
    pages: [
        { image: 'assets/heroes/arthur.webp', textKey: 'pres_first_victory_p1' }
    ],
    trigger: { type: 'first_event', eventId: 'first_expedition_victory' }
},
```

Trigger types for new entries:
- `pres_first_victory`: `first_event` with `eventId: 'first_expedition_victory'`
- `pres_first_defeat`: `first_event` with `eventId: 'first_expedition_defeat'`
- `pres_first_equip`: `first_event` with `eventId: 'first_item_equipped'`
- `pres_first_spell_cast`: `first_event` with `eventId: 'first_spell_cast_combat'`
- `pres_first_boss_defeated`: `first_event` with `eventId: 'first_boss_defeated'`
- `pres_first_raid_victory`: `first_event` with `eventId: 'first_raid_victory'`

> **Engine wiring note:** `GameEngine.js` must emit these `first_event` triggers when the conditions are met. Each trigger should only fire once. Add lightweight counters/flags to game state if they don't exist.

### 1.2 `js/engine/shared/data/UnlockNarratives.js`

**A. Rewrite 8 duplicate entries** with new `loreKey` references (Section 0.2). Predicates unchanged.

**B. Add 7 new entries** (Section 0.3). Predicates:

```js
// nar_first_building
(state) => {
    const infra = state.village?.infrastructure || {};
    return Object.values(infra).filter(lvl => lvl >= 1).length >= 1;
}

// nar_shop_first_purchase — PROXY PREDICATE
(state) => {
    // If exact purchase tracker does not exist:
    // Use: shop is unlocked AND player has fewer than max starting gold
    // OR add a lightweight `stats.shopPurchases > 0` to state.
    // RECOMMENDATION: Add `stats.shopPurchases` counter to ShopService.
}

// nar_blacksmith_built
(state) => (state.village?.infrastructure?.blacksmith || 0) >= 1

// nar_calmed_beach_found
(state) => !!state.expeditionRegions?.reg_calmed_beach

// nar_dark_forest_first_clear
(state) => /* check expedition history for a Dark Forest completion */

// nar_goblin_camp_found
(state) => !!state.expeditionRegions?.reg_goblin_camp

// nar_academy_first_lesson
(state) => /* check state.academy?.sessions?.length > 0 or equivalent */
```

> **Proxy policy:** For `nar_shop_first_purchase`, `nar_dark_forest_first_clear`, and `nar_academy_first_lesson`: if the exact state tracker does not exist, add a minimal counter/flag to the relevant service. These are low-risk, high-value additions.

**C. Add a comment** at the top of the file:
```js
/**
 * UnlockNarratives — Pure static data catalog for ambient discovery toasts.
 *
 * The `era` field is for developer organization only. Unlock narratives are
 * NOT grouped by chapter in the UI. They appear in the Chronicle's Discovery
 * Log as a single flat list sorted by day seen.
 */
```

### 1.3 `js/engine/shared/services/UnlockService.js`

**A. Extend state shape** to track `daySeen`:

```js
// BEFORE
_getDefaultState() {
    return {
        unlockedNarratives: [],      // string[]
        unlockedCodexFeatures: []
    };
}

// AFTER
_getDefaultState() {
    return {
        unlockedNarratives: [],      // { id: string, daySeen: number }[]
        unlockedCodexFeatures: []
    };
}
```

**B. Add migration** in `_load()`:
```js
_load() {
    const raw = persistence.load(STORAGE_KEY, this._getDefaultState());
    // Migrate old string[] to new object[]
    if (raw.unlockedNarratives && raw.unlockedNarratives.length > 0 && typeof raw.unlockedNarratives[0] === 'string') {
        raw.unlockedNarratives = raw.unlockedNarratives.map(id => ({ id, daySeen: null }));
    }
    return raw;
}
```

**C. Update `markAsShown`** to accept optional `day`:
```js
markAsShown(id, day = null) {
    const exists = this.state.unlockedNarratives.some(entry => entry.id === id);
    if (!exists) {
        this.state.unlockedNarratives.push({ id, daySeen: day });
        this.save();
    }
}
```

**D. Add helper methods** for Chronicle consumption:
```js
getShownNarratives() {
    return [...this.state.unlockedNarratives]; // returns {id, daySeen}[]
}

isShown(id) {
    return this.state.unlockedNarratives.some(entry => entry.id === id);
}
```

**E. Update `markAllAsShown`** to use the new shape.

**F. Engine integration:** In `GameEngine.nextDay()`, after `UnlockService.checkAllUnlocks()` returns new IDs, call `markAsShown(id, currentDay)` for each so `daySeen` is recorded.

---

## Phase 2 — Presentation Layer Changes

### 2.1 `js/presentation/ui/chronicle/ChronicleView.js`

**A. Import `UNLOCK_NARRATIVES`**:
```js
import { UNLOCK_NARRATIVES } from '../../../engine/shared/data/UnlockNarratives.js';
```

**B. Refactor `render()` to two-pane layout:**

```js
render() {
    // ... existing sub-nav and header ...
    
    const html = `
        <div class="chronicle-two-pane">
            <div class="chronicle-main-pane">
                ${this._renderChapterSections()}
            </div>
            <div class="chronicle-discovery-pane">
                ${this._renderDiscoveryLog()}
            </div>
        </div>
    `;
    // ...
}
```

**C. Left pane — `_renderChapterSections()`**: Existing logic, largely preserved. Renders `PRESENTATION_CATALOG` entries grouped by `chapter`. Shows seen/locked/pending states with trigger hints. Replay button opens `PresentationModal`.

**D. Right pane — `_renderDiscoveryLog()`**: New method.

```js
_renderDiscoveryLog() {
    const shown = this.engine.unlockService?.getShownNarratives() || [];
    const pending = this.engine.unlockService?.state?.pendingNarratives || []; // if exists
    
    // Sort by daySeen desc (most recent first). Null daySeen sorts to bottom.
    const sorted = [...shown].sort((a, b) => {
        if (a.daySeen === null && b.daySeen === null) return 0;
        if (a.daySeen === null) return 1;
        if (b.daySeen === null) return -1;
        return b.daySeen - a.daySeen;
    });
    
    const totalNarratives = UNLOCK_NARRATIVES.length;
    const foundCount = shown.length;
    
    const rows = sorted.map(entry => {
        const narrative = UNLOCK_NARRATIVES.find(n => n.id === entry.id);
        if (!narrative) return '';
        const title = this.t(narrative.titleKey);
        const day = entry.daySeen !== null ? `${this.t('chronicle_day_prefix')} ${entry.daySeen}` : '';
        return `
            <div class="discovery-row" data-narrative-id="${entry.id}">
                <span class="discovery-title">${title}</span>
                <span class="discovery-day">${day}</span>
            </div>
        `;
    }).join('');
    
    return `
        <div class="discovery-header">
            <h3>${this.t('chronicle_discovery_title')}</h3>
            <span class="discovery-count">${foundCount} / ${totalNarratives}</span>
        </div>
        <div class="discovery-list">
            ${rows}
        </div>
    `;
}
```

> **Design note:** The right pane shows **only seen** unlock narratives. Locked ones are hidden — no teasers, no hints. The unlock narratives are predicate-based; we cannot easily predict what will trigger, and showing `???` rows without hints would frustrate. The left pane (presentations) handles the "locked teaser" motivation.

**E. Add event listeners** for discovery row clicks:
```js
// Clicking a discovery row opens a simple modal with title + lore text
discoveryRows.forEach(row => {
    row.addEventListener('click', () => {
        const id = row.getAttribute('data-narrative-id');
        this._openDiscoveryReplay(id);
    });
});
```

**F. Discovery replay modal:** A lightweight overlay (reuse existing modal CSS classes) showing title + lore text. No images, no pagination. Single "Close" button.

### 2.2 CSS — `css/views/chronicle.css` (or add to existing CSS)

```css
.chronicle-two-pane {
    display: flex;
    gap: 20px;
    align-items: flex-start;
}

.chronicle-main-pane {
    flex: 7;              /* 70% */
    min-width: 0;
}

.chronicle-discovery-pane {
    flex: 3;              /* 30% */
    min-width: 0;
    background: var(--bg-card);
    border-radius: 8px;
    padding: 16px;
    opacity: 0.85;
    font-size: 0.9em;
    position: sticky;
    top: 20px;            /* sticks while scrolling left pane */
    max-height: calc(100vh - 120px);
    overflow-y: auto;
}

.discovery-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border-subtle);
}

.discovery-header h3 {
    margin: 0;
    font-size: 1em;
    color: var(--text-muted);
}

.discovery-count {
    font-size: 0.85em;
    color: var(--text-muted);
}

.discovery-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.discovery-row {
    padding: 6px 8px;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.2s;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.discovery-row:hover {
    background: var(--bg-hover);
}

.discovery-title {
    color: var(--text-secondary);
    font-weight: 500;
}

.discovery-day {
    color: var(--text-muted);
    font-size: 0.8em;
    white-space: nowrap;
}

/* Mobile: stack vertically, discovery log below */
@media (max-width: 767px) {
    .chronicle-two-pane {
        flex-direction: column;
    }
    .chronicle-discovery-pane {
        position: static;
        max-height: 400px;
        order: 2;
    }
    .chronicle-main-pane {
        order: 1;
    }
}
```

### 2.3 `PostDaySequencer.js`

No structural changes. Presentations still queue in Step 1. Unlock toasts still show in Step 3. The only change is that `UnlockService.markAsShown()` now receives `currentDay` so `daySeen` is recorded.

---

## Phase 3 — i18n Changes

### 3.1 `js/engine/shared/core/i18n/translations/en.js`

**Remove (6 keys):**
- `nar_rescue_mission_title`, `nar_rescue_mission_lore`
- `nar_greenfields_first_clear_title`, `nar_greenfields_first_clear_lore`
- `nar_frozen_peaks_first_clear_title`, `nar_frozen_peaks_first_clear_lore`

**Update lore text (8 keys, titles unchanged):**
- `nar_sir_valen_joins_lore`
- `nar_first_skill_slot_lore`
- `nar_tavern_built_lore`
- `nar_elara_arrives_lore`
- `nar_magic_circle_unlocked_lore`
- `nar_witch_hut_built_lore`
- `nar_first_spell_composed_lore`
- `nar_explorer_guild_built_lore`

**Add new presentation title keys (5):**
- `pres_first_victory`: "The First Return"
- `pres_first_defeat`: "The First Lesson"
- `pres_first_raid_victory`: "The Wall Holds"
- `pres_first_spell_cast`: "The World Answers"
- `pres_first_boss_defeated`: "The Greater Fall"

**Add new presentation page text keys (5):**
- `pres_first_victory_p1`
- `pres_first_defeat_p1`
- `pres_first_raid_victory_p1`
- `pres_first_spell_cast_p1`
- `pres_first_boss_defeated_p1`

**Add new toast keys (16):**
- `nar_first_building_title`, `nar_first_building_lore`
- `nar_first_equip_title`, `nar_first_equip_lore`
- `nar_shop_first_purchase_title`, `nar_shop_first_purchase_lore`
- `nar_blacksmith_built_title`, `nar_blacksmith_built_lore`
- `nar_calmed_beach_found_title`, `nar_calmed_beach_found_lore`
- `nar_dark_forest_first_clear_title`, `nar_dark_forest_first_clear_lore`
- `nar_goblin_camp_found_title`, `nar_goblin_camp_found_lore`
- `nar_academy_first_lesson_title`, `nar_academy_first_lesson_lore`

**Add new UI keys:**
- `chronicle_discovery_title`: "Discovery Log"
- `chronicle_discovery_empty`: "No discoveries yet. Send heroes on expeditions and build your village to uncover the valley's secrets."

### 3.2 Other Language Files

For `es.js`, `ca.js`, `eu.js`, `gl.js`:
- Remove same 6 orphaned keys.
- Update 8 rewritten lores with `// TODO: translate`.
- Add all 31 new keys (5 titles + 5 texts + 16 toast keys + 2 UI keys) with `// TODO: translate`.

---

## Phase 4 — Tests

### 4.1 `tests/unit/UnlockService.test.js`

Add or extend:
```js
test('UnlockService: state migration from string[] to object[]', () => {
    // Simulate old state
    const oldState = { unlockedNarratives: ['nar_first_expedition'] };
    const service = new UnlockService({ deferLoad: true });
    service.setState(oldState);
    service.load(); // triggers migration
    const entry = service.getShownNarratives()[0];
    assert.strictEqual(entry.id, 'nar_first_expedition');
    assert.strictEqual(entry.daySeen, null);
});

test('UnlockService: markAsShown records daySeen', () => {
    const service = new UnlockService({ deferLoad: true });
    service.markAsShown('nar_test', 7);
    assert.strictEqual(service.getShownNarratives()[0].daySeen, 7);
});

test('UnlockNarratives: nar_first_building triggers on infrastructure', () => {
    const state = { village: { infrastructure: { farm: 1 } } };
    const service = new UnlockService({ deferLoad: true });
    const newly = service.checkAllUnlocks(state);
    assert.ok(newly.includes('nar_first_building'));
});
```

### 4.2 `tests/unit/PresentationService.test.js`

Verify existing triggers still fire. Add:
```js
test('PresentationService: first_event triggers new milestone presentations', () => {
    const service = new PresentationService();
    const triggered = service.checkTriggers({ type: 'first_event', eventId: 'first_expedition_victory' });
    assert.ok(triggered.includes('pres_first_victory'));
});
```

### 4.3 `tests/unit/ChronicleView.test.js`

Add:
```js
test('ChronicleView: renders discovery log with seen narratives', () => {
    const unlockService = new UnlockService({ deferLoad: true });
    unlockService.markAsShown('nar_first_building', 2);
    const engine = { presentationService: new PresentationService(), unlockService, i18n: { t: (k) => k } };
    const view = new ChronicleView(document.createElement('div'), engine, engine.i18n, null);
    view.render();
    assert.ok(view.container.innerHTML.includes('Discovery Log'));
    assert.ok(view.container.innerHTML.includes('nar_first_building_title'));
    assert.ok(view.container.innerHTML.includes('Day 2'));
});
```

### 4.4 i18n Completeness Validation

A lightweight script (can be a Node one-liner or a test) that validates:
1. Every `titleKey`/`loreKey` in `UnlockNarratives.js` exists in `en.js`.
2. Every `textKey` and title key in `PresentationCatalog.js` exists in `en.js`.
3. No orphaned keys in `en.js` are unreferenced by either catalog.

---

## Phase 5 — Verification Checklist

- [ ] `PresentationCatalog.js`: 12 existing presentations have unique story image paths.
- [ ] `PresentationCatalog.js`: 5 new milestone presentations added with valid triggers.
- [ ] `UnlockNarratives.js`: 8 duplicate narratives rewritten with new lore text.
- [ ] `UnlockNarratives.js`: 7 new narratives added with valid predicates.
- [ ] `UnlockService.js`: State shape migrated to `{id, daySeen}[]`.
- [ ] `UnlockService.js`: `markAsShown()` records `daySeen` from engine.
- [ ] `GameEngine.js`: Emits 6 new `first_event` triggers at correct lifecycle points.
- [ ] `ChronicleView.js`: Two-pane layout renders correctly (left = chapters, right = flat discovery log).
- [ ] `ChronicleView.js`: Discovery log sorts by `daySeen` descending.
- [ ] `ChronicleView.js`: Discovery log shows only seen narratives (no locked teasers).
- [ ] `ChronicleView.js`: Discovery row click opens simple replay modal.
- [ ] CSS: Desktop shows side-by-side panes. Mobile stacks vertically.
- [ ] `en.js`: 6 orphaned keys removed.
- [ ] `en.js`: 8 lores rewritten.
- [ ] `en.js`: 31 new keys added (presentations + toasts + UI).
- [ ] `es.js`, `ca.js`, `eu.js`, `gl.js`: synced with `// TODO: translate`.
- [ ] All unit tests pass.
- [ ] Existing prologue and presentation flows still work.

---

## Phase 6 — Lore Image Generation

The following **26 unique story images** should be generated and placed in `public/assets/story/`. All prompts assume a **dark fantasy watercolor illustration style**, consistent with the game's moody, literary tone. Dimensions: **1024×1024 or 512×512**, `.webp` format.

> **Fallback policy:** The `PresentationModal` already has `onerror="this.style.display='none'"` on `<img>` tags. Missing images gracefully degrade to text-only.

| Filename | Location | Prompt |
|---|---|---|
| `valley_dawn.webp` | `public/assets/story/` | Dark fantasy watercolor illustration of a hidden mountain valley at dawn, thick mist rolling between jagged peaks, a small group of tiny silhouetted figures descending a trail, soft golden light breaking through clouds, melancholic and hopeful atmosphere |
| `arthur_trail.webp` | `public/assets/story/` | Dark fantasy watercolor, a young male warrior in a worn cloak standing on a rocky mountain path, looking back over his shoulder at a distant plume of smoke on the horizon, sword sheathed, exhausted but determined, cold color palette with warm ember accents |
| `village_stake.webp` | `public/assets/story/` | Dark fantasy watercolor, a lush green valley clearing with a small waterfall, wild grass, and a single wooden stake driven into the earth in the foreground, untouched wilderness, sense of new beginning, soft morning light |
| `farm_dawn.webp` | `public/assets/story/` | Dark fantasy watercolor, a rustic wooden farm building at dawn, golden grain swaying in the wind, a few villagers working in the background, warm earth tones, humble but hopeful, slight mist |
| `valen_rubble.webp` | `public/assets/story/` | Dark fantasy watercolor, a knight in cracked armor half-buried under cave rubble and broken stone, still gripping his sword with both hands, dim torchlight, dust motes floating, dramatic chiaroscuro lighting, sense of endurance |
| `arthur_valen.webp` | `public/assets/story/` | Dark fantasy watercolor, two male warriors standing back-to-back at the edge of a small village at dusk, one in a simple cloak (Arthur) and one in battered guard armor (Valen), silhouetted against a darkening sky, first fires of the village behind them |
| `tavern_dusk.webp` | `public/assets/story/` | Dark fantasy watercolor, a rustic wooden tavern building at dusk, warm yellow light spilling from windows, a weathered sign swinging, smoke from the chimney, two or three shadowy figures approaching, cozy and inviting amid wilderness |
| `tavern_inside.webp` | `public/assets/story/` | Dark fantasy watercolor, interior of a modest tavern, a crackling fireplace, wooden mugs on a rough table, silhouettes of strangers sitting in conversation, warm amber and brown tones, smoke haze, intimate atmosphere |
| `training_clarity.webp` | `public/assets/story/` | Dark fantasy watercolor, a young hero in mid-training with a wooden practice sword, frozen in a moment of sudden clarity, eyes wide, sweat on brow, a faint golden glow around their head symbolizing insight, outdoor training grounds, dawn light |
| `arthur_sparring.webp` | `public/assets/story/` | Dark fantasy watercolor, Arthur watching a younger hero spar, arms crossed, a rare faint smile, standing in a simple training yard, morning mist, mentor and student dynamic, warm subdued palette |
| `elara_twilight.webp` | `public/assets/story/` | Dark fantasy watercolor, a young female mage standing at twilight, hems of her robes slightly singed, her eyes reflecting an unnatural violet light no one else sees, mysterious and intense, cool blue and purple palette with warm ember accents |
| `elara_glyph.webp` | `public/assets/story/` | Dark fantasy watercolor, close-up of a woman's hands tracing a glowing magical symbol in the air, faint orange and gold light, threads of energy visible, dark background, sense of ancient language being spoken |
| `village_glow.webp` | `public/assets/story/` | Dark fantasy watercolor, a small village at night seen from a distance, almost all windows dark except one glowing with an unnatural shifting golden light, stars above, mystery and wonder, cool night palette |
| `village_above.webp` | `public/assets/story/` | Dark fantasy watercolor, aerial view of a small walled village in a green valley, thin smoke rising from chimneys, tiny figures moving, defensive walls visible, late afternoon light, sense of fragile safety |
| `elara_window.webp` | `public/assets/story/` | Dark fantasy watercolor, view from outside a wooden hut window at dusk, a warm magical glow visible inside, silhouettes of villagers leaving small offerings (bread, herbs) on the windowsill, quiet devotion, soft purple twilight |
| `sanctum_hum.webp` | `public/assets/story/` | Dark fantasy watercolor, interior of a mystical stone tower — the Arcane Sanctum — with glyphs carved into the walls faintly glowing, a female mage at the center with arms raised, stones seeming to vibrate, cool blue and warm amber contrast |
| `arthur_glyph.webp` | `public/assets/story/` | Dark fantasy watercolor, a male warrior's finger touching a glowing magical symbol carved into stone, his face showing wonder and slight fear, the symbol leaving a faint warm mark on his skin, close-up, dramatic lighting |
| `circle_first.webp` | `public/assets/story/` | Dark fantasy watercolor, a simple magical circle diagram — one central glowing core symbol surrounded by empty slots, mandala-like, floating slightly above a stone floor, faint light, sense of vast potential in a small form |
| `circle_flare.webp` | `public/assets/story/` | Dark fantasy watercolor, a magical circle erupting with light, multiple glyphs aligning and glowing brightly, sparks of colored energy, a moment of creation and power, dynamic composition, warm and cool colors clashing |
| `hero_awe.webp` | `public/assets/story/` | Dark fantasy watercolor, close-up portrait of a young hero's face looking down at their own hands with an expression of awe and uncertainty, soft magical light reflecting on their skin, dark background, intimate and personal |
| `witch_appears.webp` | `public/assets/story/` | Dark fantasy watercolor, an elderly mysterious woman with wild gray hair suddenly standing inside a half-finished wooden hut, stirring a cauldron that emits greenish smoke, she was not there a moment ago, unsettling and magical, earthy tones |
| `witch_reading.webp` | `public/assets/story/` | Dark fantasy watercolor, the witch peering intently at a hero's open palm, faint lines of magical light visible beneath the hero's skin, the witch's face partially shadowed, cryptic and intense, muted green and gold palette |
| `guild_maps.webp` | `public/assets/story/` | Dark fantasy watercolor, interior of a wooden guildhall, large maps unrolled on a rough table, a scout pointing at a distant region, windows showing a green valley and distant mountains, sense of expansion and purpose, warm earthy tones |
| `map_table.webp` | `public/assets/story/` | Dark fantasy watercolor, close-up of an old map on a wooden table with new regions being sketched in charcoal, a small stone placed as a marker, ink stains, compass rose, sense of discovery and planning, warm browns and parchment tones |
| `village_night_colors.webp` | `public/assets/story/` | Dark fantasy watercolor, a village at night with multiple windows glowing in different magical colors — fire orange, water blue, storm purple — stars above, quiet beauty, the village alive with magic, rich saturated night palette |
| `sky_rift.webp` | `public/assets/story/` | Dark fantasy watercolor, a night sky above mountain peaks with a faint tear-like rift glowing with unnatural light, stars distorted around it, a sense of something watching from beyond, ominous and awe-inspiring, deep blues and sickly greens |

### Notes for the Image Generation Agent

1. **Style consistency** is critical. All images should feel like they belong to the same illustrated storybook. Use the exact prompt prefix: *"Dark fantasy watercolor illustration..."*
2. **Aspect ratio:** 1:1 (square) works best for the presentation modal layout.
3. **No text or UI elements** in the images. Pure illustration only.
4. **Mood:** Melancholic, hopeful, mysterious. Never cartoonish or brightly cheerful.
5. **Priority order** if generating in batches:
   - **Batch 1 (Prologue + Ch 1 core):** `valley_dawn`, `arthur_trail`, `village_stake`, `valen_rubble`, `elara_twilight`, `elara_glyph`
   - **Batch 2 (Ch 1 remaining):** `farm_dawn`, `arthur_valen`, `tavern_dusk`, `tavern_inside`, `training_clarity`, `arthur_sparring`, `village_above`, `elara_window`
   - **Batch 3 (Ch 2):** `sanctum_hum`, `circle_first`, `circle_flare`, `hero_awe`, `witch_appears`, `witch_reading`, `guild_maps`, `map_table`, `village_night_colors`, `sky_rift`
