# Content Expansion: Enemies & Expeditions

> **Status:** Draft — v1.0 Pending Review  
> **Phase 4 Added:** Tree Visualization & Infinite Paths  
> **Authors:** Kimi (PM & Architect)  
> **Sources:** [enemies_data.md](../shared/combat/enemies_data.md), [regions_data.md](../../explore/regions_data.md), [expeditions.md](../../explore/expeditions.md), [bestiary.md](../shared/combat/bestiary.md), [combat_balance_philosophy.md](../shared/combat/combat_balance_philosophy.md)  
> **Feature Tag:** `content_xp`  
> **Agent Memory Tag:** Use `content_xp` in ALL memory.sh entries related to this feature.  

---

## 0. Agent Collaboration Protocol (CRITICAL)

This spec spans **multiple sessions**. Every agent (Kimi, Gemini, or other) working on this feature MUST follow this protocol.

### 0.1 Shared Memory Discipline

Before starting work, run:
```bash
./.agents_shared_memory/memory.sh search "content_xp" 20 $(cat .agents_shared_memory/docs_hash)
```

After completing ANY sub-task, milestone, or discovery, run:
```bash
./.agents_shared_memory/memory.sh add <topic> "content_xp,<other_tags>" "<summary>" "<details>" "<files>" "<assumptions>"
```

**Topic naming convention:**
- `content_xp_enemies_added` — when new enemy templates are added
- `content_xp_branching_impl` — when branching factor is wired in code
- `content_xp_encounter_packs` — when pack composition logic is implemented
- `content_xp_review_<file>` — when a file is reviewed and found correct/incorrect
- `content_xp_todo_<item>` — when a TODO is created or resolved
- `content_xp_thought_<insight>` — when an architectural insight or warning is discovered

**What to log:**
- Every file modified and WHY
- Every doc-code alignment check (pass or fail)
- Every edge case discovered (e.g., "Elite prefix breaks name sorting in Bestiary")
- Every save-compatibility concern
- Tips for future agents (e.g., "Remember to update CalendarService too when adding enemies")

### 0.2 Session Handoff Pattern

If you are stopping work, add a memory with topic `content_xp_handoff` summarizing:
- What was completed
- What is in progress
- What the next agent should do
- Any blockers or open questions

---

## 1. Problem Statement

The game suffers from **content repetition** in the first 30 days. The root causes are:

| Symptom | Root Cause | Evidence in Code |
|---------|-----------|------------------|
| Only 16 enemy types | Templates hardcoded; 2 missing from docs | `ExpeditionService.getEnemyTemplates()` has 16 entries; docs list 18 |
| Repetitive encounters | Pure random selection, no encounter design | `Math.floor(Math.random() * rData.enemies.length)` per enemy slot |
| Expeditions finish in 1 day | Stage caps too low, inflation too slow | Greenfields `maxStages=2`, inflation `+1 per 5 clears` |
| No sense of discovery | Branching field is **never read** | `_generateNextNodes()` ignores `branching`; all regions = 2 flat nodes |
| Boss always solo | Hardcoded `isBoss ? 1` | Final stage always exactly 1 enemy |
| Calendar raids out of sync | Enemy data duplicated, stale | `CalendarService.js` has 13 templates; missing 3 from ExpeditionService |

> **PM Judgment:** This is the single largest "doc vs code" gap in the project. The docs describe a Dynamic Region Discovery System. The code implements a flat vending machine.

---

## 2. Design Principles

1. **Doc-First Alignment.** The code must match `regions_data.md` and `expeditions.md`. The `branching` field must actually do something.
2. **Minimal Architectural Change.** No new systems. We inject content into existing generation logic.
3. **Save Compatibility.** Old saves must load seamlessly. New fields need defaults.
4. **Tier-Appropriate Variety.** Early regions get more templates but stay easy. Late regions get composition depth.
5. **Visible Progression.** The player must FEEL that expeditions get longer and enemies get more diverse as they play.

---

## 3. Feature List & Phases

### Phase 1: Foundation — Enemy & Template Expansion
| # | Feature | Files | Complexity | Memory Topic |
|---|---------|-------|------------|-------------|
| 1.1 | Add 8 new enemy templates | `ExpeditionService.js`, `enemies_data.md` | Low | `content_xp_enemies_added` |
| 1.2 | Add missing bosses (`lich_apprentice`, `mountain_troll`) | `ExpeditionService.js`, `enemies_data.md` | Low | `content_xp_bosses_added` |
| 1.3 | Expand per-region enemy pools to 4–6 | `ExpeditionService._getRegionData()` | Low | `content_xp_pools_expanded` |
| 1.4 | Sync `CalendarService` enemy templates | `CalendarService.js` | Low | `content_xp_calendar_sync` |
| 1.5 | Add enemy skills (1–2 per template) | `ExpeditionService.getEnemyTemplates()`, `CombatAI.js` | Medium | `content_xp_enemy_skills` |
| 1.6 | Update i18n keys for new enemies | `i18n/translations/*.js` | Low | `content_xp_i18n` |

### Phase 2: Expedition Generation Overhaul
| # | Feature | Files | Complexity | Memory Topic |
|---|---------|-------|------------|-------------|
| 2.1 | Implement branching factor logic | `ExpeditionService._generateNextNodes()` | Medium | `content_xp_branching_impl` |
| 2.2 | Increase stage counts & inflation | `ExpeditionService._createProceduralNode()` | Low | `content_xp_stages_boost` |
| 2.3 | Add encounter pack composition | `ExpeditionService._createProceduralNode()` | Medium | `content_xp_encounter_packs` |
| 2.4 | Multi-enemy boss stages (25% chance) | `ExpeditionService._createProceduralNode()` | Low | `content_xp_boss_group` |
| 2.5 | Improve reward scaling per region tier | `ExpeditionService._createProceduralNode()` | Low | `content_xp_rewards` |
| 2.6 | Add region `depth` tracking | `ExpeditionService.js` state | Medium | `content_xp_depth` |

### Phase 3: Polish & Depth
| # | Feature | Files | Complexity | Memory Topic |
|---|---------|-------|------------|-------------|
| 3.1 | Elite variant prefix system | `ExpeditionService._createEnemy()` | Medium | `content_xp_elites` |
| 3.2 | Region-specific combat mechanics | `BattleService.js` or `CombatAI.js` | High | `content_xp_region_mechanics` |
| 3.3 | New regions (Whispering Forest, Murky Swamp, Forgotten Ruins) | `ExpeditionService.js`, `regions_data.md` | Medium | `content_xp_new_regions` |
| 3.4 | Story node injection at milestones | `ExpeditionService._generateNextNodes()` | Medium | `content_xp_story_nodes` |

---

## 4. Phase 1: Detailed Design — Enemy Expansion

### 4.1 New Enemy Templates (8 + 2 bosses)

All values are **base stats at level 1**. Scaling follows existing formula: `Attribute = Base * 1.1^(Level - 1)`.

**Tier 1–2 (Forest / Meadows / Beach):**

| ID | Name | Type | Element | HP | Str | Def | Spd | Skills |
|----|------|------|---------|----|-----|-----|-----|--------|
| `slime_earth` | Earth Slime | beast | earth | 25 | 4 | 4 | 1 | `defend` (30% chance when HP < 50%) |
| `rabbit_horned` | Horned Rabbit | beast | neutral | 15 | 3 | 1 | 5 | `haste_self` (20% chance turn 1) |
| `murloc_shore` | Shore Murloc | humanoid | water | 30 | 5 | 3 | 4 | — |

**Tier 3 (Forest / Camp / Ruins):**

| ID | Name | Type | Element | HP | Str | Def | Spd | Skills |
|----|------|------|---------|----|-----|-----|-----|--------|
| `wolf_alpha` | Alpha Wolf | beast | neutral | 50 | 7 | 4 | 5 | `howl_buff` (buffs all allies +10% STR, once per battle) |
| `zombie_rotter` | Rotting Zombie | undead | neutral | 45 | 5 | 3 | 1 | `poison_touch` (basic attacks 30% poison) |
| `goblin_slinger` | Goblin Slinger | humanoid | neutral | 28 | 5 | 2 | 5 | — |

**Tier 4–5 (Peaks / Endgame):**

| ID | Name | Type | Element | HP | Str | Def | Spd | Skills |
|----|------|------|---------|----|-----|-----|-----|--------|
| `frost_wolf` | Frost Wolf | beast | water | 55 | 8 | 5 | 6 | `howl_buff`, `ice_claw` (single strike, water dmg) |
| `cultist_acolyte` | Cultist Acolyte | humanoid | fire | 35 | 4 | 3 | 4 | `fire_bolt` (weak fire spell, costs MP) |
| `stone_golem` | Stone Golem | elemental | earth | 90 | 9 | 10 | 1 | `defend` (50% chance), `earthquake` (slow, AoE at low HP) |

**Missing Bosses (from docs):**

| ID | Name | Type | Element | HP | Str | Def | Spd | isBoss | Skills |
|----|------|------|---------|----|-----|-----|-----|--------|--------|
| `lich_apprentice` | Lich Apprentice | undead | storm | 180 | 25 | 8 | 5 | true | `dark_bolt`, `raise_dead` (summons skeleton once), `drain_life` |
| `mountain_troll` | Mountain Troll | beast | neutral | 400 | 30 | 15 | 2 | true | `crushing_blow` (high damage single target), `regeneration` (heals 5% HP per turn) |

> **Implementation Note:** The `skills` field in `getEnemyTemplates()` is currently unused by `Enemy.js`. Verify if `Enemy` accepts a `skills` property. If not, add it to the model. `CombatAI.js` checks `knownFamilies` on enemies — ensure skills are mapped to families or handled as special AI actions.

### 4.2 Expanded Region Enemy Pools

Replace the current 2–3 enemy arrays with cross-pollinated pools. Each pool should include:
- **2 core enemies** native to the region
- **1–2 adjacent-tier enemies** (slightly easier or harder)
- **1 thematic rare** (lower spawn rate, used for encounter packs)

```javascript
// In ExpeditionService._getRegionData()
const REGIONS = {
    reg_greenfields: { 
        name: 'Greenfields', 
        branching: 'low', 
        minStages: 1, 
        maxStages: 3,  // WAS 2
        enemies: ['slime_green', 'wild_boar', 'rabbit_horned', 'slime_earth'], 
        baseLevel: 1 
    },
    reg_tiny_cave: { 
        name: 'Tiny Cave', 
        branching: 'medium', 
        minStages: 2, 
        maxStages: 4,  // WAS 3
        enemies: ['bat_small', 'spider_minor', 'slime_green', 'goblin_scout'], 
        baseLevel: 2 
    },
    reg_calmed_beach: { 
        name: 'Calmed Beach', 
        branching: 'low', 
        minStages: 2, 
        maxStages: 4,  // WAS 3
        enemies: ['crab_shell', 'water_spirit_minor', 'murloc_shore', 'slime_earth'], 
        baseLevel: 2 
    },
    reg_dark_forest: { 
        name: 'Dark Forest', 
        branching: 'medium', 
        minStages: 2, 
        maxStages: 5,  // WAS 4
        enemies: ['goblin_scout', 'goblin_grunt', 'wild_boar', 'wolf_alpha', 'goblin_slinger'], 
        baseLevel: 3 
    },
    reg_goblin_camp: { 
        name: 'Goblin Camp', 
        branching: 'high', 
        minStages: 3, 
        maxStages: 6,  // WAS 5
        enemies: ['goblin_scout', 'goblin_grunt', 'goblin_brute', 'goblin_shaman', 'goblin_slinger', 'goblin_king'], 
        baseLevel: 4 
    },
    reg_mystic_ruins: { 
        name: 'Mystic Ruins', 
        branching: 'low', 
        minStages: 2, 
        maxStages: 5,  // WAS 4
        enemies: ['skeleton_warrior', 'ghost_wisp', 'water_spirit_minor', 'zombie_rotter', 'cultist_acolyte'], 
        baseLevel: 4 
    },
    reg_frozen_peaks: { 
        name: 'Frozen Peaks', 
        branching: 'medium', 
        minStages: 3, 
        maxStages: 6,  // WAS 5
        enemies: ['ice_elemental', 'young_drake', 'goblin_brute', 'frost_wolf', 'stone_golem'], 
        baseLevel: 5 
    }
};
```

> **PM Note:** The `goblin_king` is included in the Goblin Camp pool but should have a LOW spawn rate. Implement via weighted selection or treat it as a boss-only spawn. See Section 5.3 for boss spawn rules.

### 4.3 CalendarService Sync

`CalendarService.js` lines 212–226 must be updated to include ALL enemy templates, including the new ones. The two sources of truth MUST match.

**Verification checklist:**
- [ ] All 24 templates exist in both files
- [ ] Stat values are identical
- [ ] `element` and `type` fields are present in CalendarService (currently missing)

---

## 5. Phase 2: Detailed Design — Expedition Generation Overhaul

### 5.1 Branching Factor Implementation

The `branching` field in `_getRegionData()` must actually control how many new procedural nodes spawn when an expedition is completed.

```javascript
// In _generateNextNodes(regionId)
const rData = this._getRegionData(regionId);
const procCount = region.availableNodes.filter(n => !n.isStory).length;

// Determine target node count based on branching profile
let targetCount;
switch (rData.branching) {
    case 'low':    targetCount = 1 + Math.floor(region.clears / 5); break; // 1, then 2 after 5 clears
    case 'medium': targetCount = 2 + Math.floor(region.clears / 4); break; // 2-4
    case 'high':   targetCount = 3 + Math.floor(region.clears / 3); break; // 3-5+
    default:       targetCount = 2;
}
targetCount = Math.min(targetCount, 5); // Hard cap at 5 available nodes

while (procCount < targetCount) {
    region.availableNodes.push(this._createProceduralNode(regionId, rData, region.clears));
}
```

**Greenfields special case remains** for story mission sequencing, but after the rescue mission, it follows normal branching rules.

> **Save compatibility note:** Old saves have `availableNodes` arrays. Adding more nodes is safe. Removing the hardcoded `3` for post-rescue Greenfields is a behavior change, not a schema change.

### 5.2 Stage Count & Inflation

Change the inflation curve from `+1 per 5 clears` to `+1 per 3 clears`. Also add a "depth" component.

```javascript
// In _createProceduralNode()
let stagesCount = Math.max(rData.minStages, Math.min(rData.maxStages, rData.minStages + Math.floor(clears / 3)));

// Depth bonus: every 2 clears beyond 6 adds a chance for +1 stage (capped at maxStages)
if (clears > 6 && Math.random() < 0.3) {
    stagesCount = Math.min(rData.maxStages, stagesCount + 1);
}
```

**Explorer Guild and Scout reductions remain unchanged** (10% per level, -1 per 2 scouts).

### 5.3 Encounter Pack Composition

Replace pure random enemy selection with **pack types**. Each non-boss stage rolls a pack type. Boss stages have a special rule.

```javascript
const packTypes = {
    swarm:      { weight: 25, count: [3, 4], eliteChance: 0,   description: 'Many weak enemies' },
    mixed:      { weight: 35, count: [2, 3], eliteChance: 0,   description: 'Varied enemy types' },
    elite:      { weight: 25, count: [1, 2], eliteChance: 0.3, description: 'Strong enemy + support' },
    duo:        { weight: 15, count: [2, 2], eliteChance: 0.2, description: 'Two tough enemies' }
};
```

**Selection algorithm:**
1. Roll pack type by weight.
2. Determine enemy count from pack's `count` range.
3. For each slot:
   - 70% chance: pick from region's core enemies (first 2 in array).
   - 30% chance: pick from region's full pool.
4. If `eliteChance` hits, upgrade one random enemy to an elite variant (see Section 6.1).
5. Ensure at least 2 different enemy IDs in `mixed` and `duo` packs.

**Boss stage rule:**
- 75% chance: single boss (current behavior).
- 25% chance: **Boss Group** — 1 boss + 1–2 minions from the region pool. Minions are NOT elites.
- The boss enemy is selected from a boss pool per region (see below).

**Regional Boss Pools:**

| Region | Boss Pool |
|--------|-----------|
| reg_greenfields | `slime_fire` |
| reg_tiny_cave | `goblin_brute` |
| reg_calmed_beach | `water_spirit_minor` |
| reg_dark_forest | `goblin_king` |
| reg_goblin_camp | `goblin_king`, `goblin_shaman` |
| reg_mystic_ruins | `lich_apprentice` |
| reg_frozen_peaks | `young_drake`, `mountain_troll` |

### 5.4 Region Depth Tracking

Add a `depth` field to each generated procedural node. Depth represents how far into the region this expedition ventures.

```javascript
// In _createProceduralNode()
const depth = 1 + Math.floor(clears / 2) + Math.floor(Math.random() * 2);

const enemyLevel = (rData.baseLevel || 1) + Math.floor(clears / 3) + Math.floor(depth / 3);
```

**Depth effects:**
- Higher depth = higher enemy level (as shown above).
- Depth ≥ 5: +10% chance for elite enemies.
- Depth ≥ 8: guarantee at least 1 elite per expedition.
- Depth is displayed in the expedition card UI as "Depth: X" (future UI work).

### 5.5 Reward Scaling

Replace the flat `50 + clears*10` gold formula with region-tier scaling.

```javascript
const tierMult = rData.baseLevel || 1;
const gold = (40 * tierMult) + (clears * 8 * tierMult) + (depth * 5);
```

**Material rewards per region:**

| Region | Primary Material | Secondary Material | Rare Material (10% chance) |
|--------|-----------------|-------------------|---------------------------|
| reg_greenfields | material_wood (3-6) | material_stone (1-3) | material_herb (1) |
| reg_tiny_cave | material_stone (3-6) | material_iron_ore (1-3) | material_crystal (1) |
| reg_calmed_beach | material_stone (2-5) | material_wood (2-5) | material_pearl (1) |
| reg_dark_forest | material_wood (4-7) | material_herb (2-4) | material_iron_ore (2) |
| reg_goblin_camp | material_iron_ore (3-6) | material_stone (2-4) | material_steel_ingot (1) |
| reg_mystic_ruins | material_crystal (2-4) | material_stone (2-4) | material_gem (1) |
| reg_frozen_peaks | material_steel_ingot (1-3) | material_crystal (1-3) | material_mythril (1) |

> **Note:** Some material IDs may not exist in the inventory system yet. Verify against `materials_data.md` and `inventory.md`. If a material does not exist, substitute with the closest equivalent and log a `content_xp_thought_` memory about the gap.

---

## 6. Phase 3: Detailed Design — Polish & Depth

### 6.1 Elite Variant Prefix System

When an enemy is flagged as elite, apply a prefix and stat multiplier.

```javascript
const elitePrefixes = [
    { name: 'Fierce',    mult: 1.15, color: '#ff922b' },  // Orange
    { name: 'Corrupted', mult: 1.25, color: '#e03131' },  // Red
    { name: 'Ancient',   mult: 1.35, color: '#845ef7' },  // Purple
    { name: 'Legendary', mult: 1.50, color: '#ffd43b' }   // Gold (very rare)
];
```

**Rules:**
- Elite chance scales with region clears and depth.
- Prefix selection is weighted: Fierce (60%), Corrupted (30%), Ancient (9%), Legendary (1%).
- Name becomes `"Fierce Goblin Grunt"`.
- Stats are multiplied: `maxHp *= mult`, `strength *= mult`, `defense *= mult`.
- Speed is NOT multiplied (preserves turn order feel).
- Elite enemies grant +50% EXP.

**Implementation in `_createEnemy()`:**
```javascript
_createEnemy(templateId, isBoss, level = 1, isElite = false, eliteTier = 0) {
    // ... existing logic ...
    if (isElite && eliteTier < elitePrefixes.length) {
        const prefix = elitePrefixes[eliteTier];
        scaled.maxHp = Math.floor(scaled.maxHp * prefix.mult);
        scaled.strength = Math.floor(scaled.strength * prefix.mult);
        scaled.defense = Math.floor(scaled.defense * prefix.mult);
        scaled.name = `${prefix.name} ${scaled.name}`;
        scaled.isElite = true;
        scaled.eliteTier = eliteTier;
    }
    return new Enemy({ ...scaled, id: crypto.randomUUID(), isBoss });
}
```

### 6.2 Region-Specific Combat Mechanics (Future)

These require `BattleService` or `CombatAI` changes and are flagged as **high complexity**.

| Region | Mechanic | Implementation Idea |
|--------|----------|---------------------|
| Frozen Peaks | `frostbite` — 10% chance per turn for heroes to lose 5% SPD | Add environmental effect hook in BattleService turn start |
| Mystic Ruins | `necrotic_aura` — undead enemies heal 5% HP when a hero uses MP | Hook into spell casting event |
| Goblin Camp | `war_cry` — goblin-type enemies gain +5% STR per goblin ally alive | Party trait-like buff on enemy side |
| Calmed Beach | `tide` — every 3 turns, all SPD stats swap (fastest becomes slowest) | Turn-order modifier |

> **Agent Note:** Do NOT implement Section 6.2 until Phases 1 and 2 are complete and tested. Log a `content_xp_thought_region_mechanics` memory with these ideas for future reference.

### 6.3 New Regions (Planned)

Promote 3 regions from `regions_data.md` "Planned" section to implemented.

**`reg_whispering_forest` (Tier 2):**
- Unlock: 5 Greenfields clears OR Explorer Guild L1
- Branching: Medium
- Min/Max Stages: 2/4
- Base Level: 2
- Enemies: `rabbit_horned`, `wolf_alpha`, `slime_earth`, `goblin_scout`
- Material: `material_wood`, `material_herb`

**`reg_murky_swamp` (Tier 3):**
- Unlock: 4 Dark Forest clears
- Branching: High
- Min/Max Stages: 3/5
- Base Level: 3
- Enemies: `zombie_rotter`, `slime_earth`, `murloc_shore`, `goblin_shaman`
- Material: `material_herb`, `material_poison_gland` (new? verify)
- Mechanic: All enemies have 20% poison on basic attacks.

**`reg_forgotten_ruins` (Tier 4):**
- Unlock: 6 Mystic Ruins clears OR Explorer Guild L3
- Branching: Low
- Min/Max Stages: 3/6
- Base Level: 5
- Enemies: `skeleton_warrior`, `ghost_wisp`, `cultist_acolyte`, `stone_golem`, `lich_apprentice` (boss)
- Material: `material_crystal`, `material_gem`, `material_ancient_scroll` (new? verify)

> **Agent Note:** Before implementing new regions, verify that `reg_whispering_forest` does not conflict with `reg_dark_forest` thematically. If it does, rename to `reg_ember_glade` or similar. Log the decision in memory.

---

## 7. Implementation Order (Session-by-Session)

### Session A: Enemy Templates & Pool Expansion
1. Add new enemy templates to `ExpeditionService.getEnemyTemplates()`.
2. Add missing bosses (`lich_apprentice`, `mountain_troll`).
3. Update `_getRegionData()` with expanded pools and increased maxStages.
4. Sync `CalendarService.js` enemy templates.
5. Update i18n translation files for new enemy names.
6. **Verify:** Run `make test` or manual bestiary check.

### Session B: Branching, Stages, Packs
1. Implement branching factor in `_generateNextNodes()`.
2. Update stage inflation formula (`clears/3`).
3. Implement encounter pack composition logic.
4. Implement multi-enemy boss groups (25% chance).
5. Update reward scaling per region tier.
6. **Verify:** Create a test save, clear expeditions, observe node counts and stage lengths.

### Session C: Depth, Elites, Enemy Skills
1. Add `depth` tracking to procedural nodes.
2. Implement elite prefix system in `_createEnemy()`.
3. Assign skills to enemy templates (verify `Enemy.js` model accepts skills).
4. Test elite enemies in combat.
5. **Verify:** Bestiary displays elite names correctly. Combat log shows prefixes.

### Session D: New Regions & Polish
1. Implement 3 new regions in `_getRegionData()` and `_checkRegionUnlocks()`.
2. Add story node injection logic (milestone checks).
3. Final integration test across all regions.
4. Update `regions_data.md` and `enemies_data.md` to match code.
5. **Final Verify:** Full playthrough Day 1–15.

---

## 8. Testing & Verification Checklist

### Per-Session Checks
- [ ] `make test` passes (or existing tests don't break).
- [ ] Old save loads without errors (save compatibility).
- [ ] New enemies appear in Bestiary after combat.
- [ ] i18n names display correctly in all 5 languages.
- [ ] Calendar raids use the synced enemy data.

### Final Integration Checks
- [ ] Greenfields post-rescue has 1–3 procedural nodes (branching: low).
- [ ] Goblin Camp has 3–5 procedural nodes (branching: high).
- [ ] Expeditions in cleared regions have 3+ stages.
- [ ] Boss groups appear ~25% of the time.
- [ ] Elite enemies appear in late-region expeditions.
- [ ] Rewards scale with region tier.
- [ ] No enemy template ID is missing from `CalendarService`.

---

## 4. Phase 4: Tree Visualization & Infinite Paths (Final Stage)

> **Prerequisite:** Phases 1–3 must be complete. This phase depends on `parentId`, `depth`, branching logic, and the expanded enemy system.
> **User mandate:** Easy to switch between List View and Tree View. The tree is the last and final stage of the content expansion.

### 4.1 The Vision

Instead of a flat list of expedition cards inside each region, the player sees a **bottom-up branching tree**:

```
      ○          ○        ← deepest / newest
    ✕   ✕      ✕   ◎
  ✕   ✕   ○   ○
✕   ✕   ✕   ✕   ✕
      [ROOT]              ← bottom / starting point
```

- **✕ = completed** — dimmed, crossed or grayscale. Clicking opens a history modal.
- **○ = available** — glowing, pulsing. Clicking opens the detail pane (assign heroes).
- **◎ = active / running** — spinning border or animated ring. Clicking shows current progress & retire option.
- **△ = locked** — muted, smaller. Tooltip: "Complete parent expedition to unlock."
- **⬡ = closed / dead-end** — gold border, trophy icon. A path that reached its finale.

**Key feeling:** The region is an **infinite tunnel**. You never "finish" a region. You keep venturing deeper, paths branch, some close with big rewards, and the tree grows upward forever.

### 4.2 Data Model Additions

These fields must exist on expedition nodes (added in Phase 2/3, verified here):

```javascript
{
  id: 'proc_abc123',
  parentId: 'proc_parent456',   // The expedition that unlocked this one
  depth: 3,                     // Generational depth from root (root = 0)
  status: 'available',          // 'available' | 'active' | 'completed' | 'locked' | 'closed'
  completionMeta: {             // Populated when status becomes 'completed'
    dayCompleted: 47,
    heroIds: ['hero_arthur', 'hero_valen'],
    rewardReceived: { gold: 120, items: {...} }
  }
}
```

**Completed node retention:** `_finishExpedition()` must NOT delete completed nodes. It sets `status='completed'`, fills `completionMeta`, and spawns children. The available pool is a filtered view of nodes where `status === 'available'`.

### 4.3 Path Lifecycle & Branching Intelligence

When a node is completed, the generator decides how many children to spawn based on **how many active paths currently exist** in the region.

```
Active paths = count of nodes with status 'available' or 'active'

IF active_paths >= 5    → FORCED NARROW: spawn 0 children (path closes)
IF active_paths == 4    → 50% 0 children, 50% 1 child
IF active_paths == 3    → 25% 0, 50% 1, 25% 2
IF active_paths == 2    → 10% 0, 40% 1, 40% 2, 10% 3
IF active_paths <= 1    → 0% 0, 30% 1, 50% 2, 20% 3
```

**Path closure bonus (0 children spawned):**
- Node becomes `status='closed'`.
- Grant **2× gold**, **rare material**, and **+20% equipment drop chance**.
- Visual: gold border ⬡, special "Path Sealed" message.

**Narrowing events:** Every 8–12 completions, a "convergence" triggers:
- 2–3 random available nodes are marked as `approachingClosure: true`.
- Their next completion gets +30% chance to spawn 0 children.
- This creates the rhythm: "tunnel widens → tunnel narrows → tunnel widens again."

**Hidden branches:** Every 3rd completion, 20% chance to spawn a **hidden expedition** from a random completed node. Hidden branches have `depth + 2`, better rewards, and a purple glow.

### 4.4 Tree Renderer Architecture

**New component:** `ExpeditionTree.js` (replaces `ExpeditionList.js` in Tree View mode).

**Layout: Bottom-Up Reversed Tree**
- Root at bottom. New rows appended above.
- CSS: `display: flex; flex-direction: column-reverse;` on container.
- Each depth level is a flex row. Nodes within a row spaced evenly.
- **SVG overlay** draws Bézier curves from child to parent.
- Container: `overflow: auto` for horizontal + vertical scroll.

**Node rendering:**
- Small circle (~28px) with state icon inside.
- Tooltip on hover: name, depth, stage count, status.
- Click behavior:
  - **✕ Completed** → `CompletedExpeditionModal` (day, heroes, rewards, combat summary).
  - **○ / ◎ Available or Active** → Detail pane (same as today: assign heroes, retire, combat intel).
  - **△ Locked** → Tooltip only.
  - **⬡ Closed** → Tooltip with closure bonus received.

**Region container:**
- Region title bar shows: name, total clears, active paths count.
- Tree is collapsible (accordion), same as today.
- Root is the first starting expedition (e.g., Tutorial Cave).

### 4.5 View Toggle: List ↔ Tree

The Explore page gets a **segmented button** in the header:
- **List View** — current flat cards in 320px master pane.
- **Tree View** — full-width branching visualization.

**Layout switching:**
- List View: `masterPane 320px | detailPane flex` (current).
- Tree View: `treePane flex | detailPane 380px`.
- Choice persisted in `localStorage`.

This makes the transition **safe and reversible**. Both views consume the same data. Only the renderer changes.

### 4.6 Full-Width Tree Layout Detail

- **Tree pane:** `flex: 1 1 auto`, min-width 400px. Contains region accordions with tree visualizations.
- **Detail pane:** `flex: 0 0 380px` (slightly wider than current 320px for richer info).
- SVG connectors redraw on `ResizeObserver`.
- Zoom/scale controls if tree becomes too wide (optional future enhancement).

### 4.7 Implementation Order (Phase 4 Sessions)

| Session | Tasks | Memory Topic |
|---------|-------|-------------|
| **D** | Modify `_finishExpedition()` to retain completed nodes. Implement path lifecycle algorithm (closures, bonuses, narrowing, hidden branches). Add `getRegionTree()` method. | `content_xp_tree_data` |
| **E** | Create `ExpeditionTree.js`. Row grouping, SVG connectors, node states, view toggle in `ExploreView.js`. | `content_xp_tree_renderer` |
| **F** | Create `CompletedExpeditionModal.js`. Store `completionMeta`. i18n keys. CSS animations. Full integration test. | `content_xp_tree_modal` |

### 4.8 Phase 4 Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Tree gets too wide (5 paths × deep depth) | Medium | Medium | Collapsible branches. Hard cap 5 active paths. SVG zoom if needed. |
| Completed node retention bloats save | Low | Medium | Minimal data per completed node (~200 bytes). 1000 nodes ≈ 200KB. |
| SVG connectors break on resize | Medium | Low | ResizeObserver redraws paths. |
| Bottom-up scroll feels odd | Low | Low | `column-reverse` makes new content auto-scroll into view naturally. |

---

## 9. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Enemy skills break CombatAI | Medium | High | Test each new skill in isolation. Stub skills if AI cannot handle them. |
| Save incompatibility from new node fields | Low | High | All new fields have defaults. `depth` defaults to 1. |
| i18n translations missing for new enemies | High | Low | Fallback to English ID. Add translations in same session. |
| Elite prefixes break name-based logic | Medium | Medium | Search for any code that matches enemy names (not IDs). Use IDs for logic. |
| Branching creates too many nodes, cluttering UI | Low | Medium | Hard cap at 5 nodes. UI already supports scrolling. |
| CalendarService sync missed | Medium | High | Explicit checklist item. Verify with grep. |

---

## 10. Memory Index (Auto-Generated on Completion)

As this spec is implemented, the following memory topics should exist in `.agents_shared_memory`:

```
content_xp_enemies_added
content_xp_bosses_added
content_xp_pools_expanded
content_xp_calendar_sync
content_xp_enemy_skills
content_xp_i18n
content_xp_branching_impl
content_xp_stages_boost
content_xp_encounter_packs
content_xp_boss_group
content_xp_rewards
content_xp_depth
content_xp_elites
content_xp_region_mechanics
content_xp_new_regions
content_xp_story_nodes
content_xp_handoff
content_xp_tree_data
content_xp_tree_renderer
content_xp_tree_modal
```

> **Final Agent Instruction:** When this spec is fully implemented, add a `content_xp_complete` memory and update this doc's status to `Implemented`. Then promote it from `docs/drafts/` to `docs/explore/content_expansion_spec.md`.
