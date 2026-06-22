# RPG Village — Feature Completeness Report

**Branch:** `feat/improvements`  
**Date:** 2026-06-22  
**Scope:** Compare design documents (`docs/`) against engine implementation (`js/engine`) and UI (`ux/features`).

---

## Executive Summary

The project is a feature-rich, domain-driven vanilla-JS engine with a Vue 3 UI. Most major systems are **present and wired end-to-end**, but several are **partial or simplified** relative to the design docs. The biggest gaps are concentrated in:

1. **Doc/code numeric drift** — production constants, growth formulas, raid scaling, and academy formulas differ from specs.
2. **Unfinished wiring** — the mission board UI is in place but fed by the legacy daily-objective system; the new `MissionService`/`MissionSeedService` engine exists but is not connected to the board.
3. **Placeholder breadth** — Hall of Fame titles, advanced gambit conditions, shop unlock gating, and full body-inscription effects are minimal or missing.

Overall the game is **playable** and many subsystems are complete, but a final polish pass is needed to bring numbers, edge cases, and advanced features in line with `docs/`.

---

## Status Legend

| Status | Meaning |
|--------|---------|
| ✅ Complete | Doc and code align; UI/UX present; tests cover core paths. |
| 🟡 Partial | Core present, but drift, missing advanced options, or weak UI integration. |
| 🔴 Minimal | Stubbed, unimplemented, or only UI/engine partially present. |

---

## 1. Village & Buildings

**Docs:** `docs/village/village.md`, `docs/village/buildings_data.md`, `docs/village/initialization.md`

| Layer | Status | Notes |
|-------|--------|-------|
| Engine | 🟡 | `VillageService` handles gold/population/food/construction/roles. |
| UI | 🟡 | `VillagePage` + `BuildingsTab` fully interactive. |
| Tests | ✅ | Unit tests for `VillageService`. |

**Implemented:**
- Construction queue, worker roles, builder assignment, population caps from housing, storage caps from warehouse.
- `BuildingsTab` shows all 11 buildings, unlocks mission board after tavern, computes costs/effects locally.
- `GameEngine.nextDay()` advances village day, construction, tavern auto-recruit.

**Gaps & Evidence:**
- **Miner chance mismatch:** `VillageService.nextDay()` uses `Math.random() < 0.35` for miner ore discovery; docs specify **20%** (`docs/village/village.md`).
- **Farm production mismatch:** code uses `+4 food_raw_grain per farm level × farmer bonus`; doc describes a more nuanced food/season system but early values are roughly consistent. Still, storage of grain as `food_raw_grain` is used directly rather than a processed-food step.
- **Growth constants hardcoded:** early growth `1%`, later `10%`; doc leaves these open, but they are not configurable.
- **No seasonal production effects:** `CalendarService.getSeasonEffects()` exists but is **not consumed** by `VillageService`.
- **Building effect duplication:** `BuildingsTab.vue` hardcodes building effects that mirror engine logic; a single source of truth would reduce drift.
- **Iron costs ignored:** `BuildingsTab` comment notes iron costs are not modeled in UI cost structure.

---

## 2. Heroes, Stats & Profiles

**Docs:** `docs/heroes/hero.md`, `docs/heroes/origins_data.md`

| Layer | Status | Notes |
|-------|--------|-------|
| Engine | 🟡 | `Hero` model is rich; level-up, stat allocation, re-recruitment work. |
| UI | ✅ | `HeroesPage` master-detail with modals for all hero actions. |
| Tests | ✅ | Unit + Vue tests cover hero creation, leveling, equipment. |

**Implemented:**
- Stats (`strength`, `defense`, `maxHp`, `maxMp`, `magicPower`, `speed`, `evasion`), XP/level curve, skill points, origins, fatigue.
- Lifetime stats for expeditions, kills, damage dealt/healed.
- Recruitment cost scaling in UI and engine.

**Gaps & Evidence:**
- **Retrain/skill reset not wired:** no adapter action for `retrainHero` or similar; UI has no retrain button.
- **Origin balance not fully audited:** origins are loaded but doc-specific trait interactions are not verified against code.

---

## 3. Physical Skills & Techniques

**Docs:** `docs/shared/combat/physical_skill_system.md`, `docs/shared/combat/hero_skills.md`

| Layer | Status | Notes |
|-------|--------|-------|
| Engine | 🟡 | Families and technique tiers work; evolution via usage. |
| UI | ✅ | `HeroSkillsModal` lists families and allows learning. |
| Tests | ✅ | Tests for technique evolution. |

**Implemented:**
- `Hero.knownFamilies`, `techniqueTiers`, `techniqueUses`, skill-point cost scaling.
- `BattleService.executeAction()` applies tier, stamina cost, target selection, and effects (stun, poison, cleave, loot).
- Technique evolution on usage threshold.

**Gaps & Evidence:**
- **Plunder loot stub:** `_rollPlunderLoot()` is present but minimal; no concrete loot table wired.
- **Cleave target selection:** code applies damage to all enemies but may not fully match doc multipliers.

---

## 4. Combat Core

**Docs:** `docs/shared/combat/battle_system.md`, `docs/shared/combat/combat_calculator.md`

| Layer | Status | Notes |
|-------|--------|-------|
| Engine | ✅ | Full turn-based loop with status effects, stamina, MP, consumables. |
| UI | ✅ | `CombatOverlay` with manual/auto controls. |
| Tests | ✅ | Behaviour + unit tests. |

**Implemented:**
- Turn order, status ticks (poison, regen, stun, sleep), stamina regen, party traits, hero/enemy separation.
- Physical skills, spell casting, consumables, defend, flee.
- Auto-battle loop in `main.js` game loop.

**Gaps & Evidence:**
- **Battle log localisation:** mostly numeric; some i18n keys may be missing.
- **Plunder family loot:** see above.

---

## 5. Gambits

**Docs:** `docs/shared/combat/gambit_system.md`, `docs/shared/combat/party_traits.md`

| Layer | Status | Notes |
|-------|--------|-------|
| Engine | 🟡 | Core evaluator works; advanced conditions declared but unimplemented. |
| UI | 🟡 | `GambitEditor` supports basic conditions; presets not exposed in editor. |
| Tests | ✅ | Behaviour tests for basic gambit flow. |

**Implemented:**
- `GambitService.evaluate()` picks first matching enabled gambit.
- Conditions: `self_hp`, `ally_hp`, `self_mp`, `enemy_count`, `enemy_hp`, `self_stamina`, `turn_count`, `always`.
- Target selection: lowest/highest HP, weakest/strongest, random, self, all.
- Presets: Disciple's, Vanguard's, Spellblade's Code exist in engine.

**Gaps & Evidence:**
- **Advanced condition types not evaluated:** `GambitService` declares `enemy_element`, `enemy_type`, and `battle_phase` condition types, but `_checkCondition()` **does not handle them**.
- **AND/OR composition stubbed:** condition composition only supports `SINGLE`; `AND`/`OR` logic is partially present but not robust.
- **Presets not surfaced:** `suggestPreset` adapter action exists, but the Gambit UI does not show preset buttons or apply them.
- **Editor condition set limited:** `GambitEditor` maps only 6 hardcoded condition templates (`ALLY_HP_LT_50`, `SELF_HP_LT_50`, etc.).

---

## 6. Magic Circle

**Docs:** `docs/shared/combat/magic_circle_system.md`, `docs/shared/combat/magic_circle_naming.md`

| Layer | Status | Notes |
|-------|--------|-------|
| Engine | ✅ | Composition, glyph mastery, insight, auto-naming. |
| UI | ✅ | `MagicCircleEditor` mandala + palette + simulator. |
| Tests | ✅ | Unit tests for composition and glyph mastery. |

**Implemented:**
- `MagicCircleService.compose()` computes MP cost, damage, target type, element, effects.
- Glyph mastery tiers (1–7), magic tier/slot count (1–25), insight formula.
- Full-screen editor with polarity, target count, budget bar, glyph drawer.
- Settings page includes a magic simulator with all glyphs unlocked.

**Gaps & Evidence:**
- **Visual ring expansion:** mandala shows slots but the doc’s tiered ring growth is cosmetic only.
- **Some advanced glyphs** may lack battlefield effect implementation in `BattleService.castSpell()`; needs spot-check.

---

## 7. Hybrid Body Inscription

**Docs:** `docs/shared/combat/hybrid_body_inscription.md` (marked “brainstorming / not yet implemented”)

| Layer | Status | Notes |
|-------|--------|-------|
| Engine | 🟡 | 7-slot circle, pending timer, hybrid MP cost exist. |
| UI | 🟡 | `HeroInscriptionModal` lets player place glyphs. |
| Tests | 🟡 | Limited coverage. |

**Implemented:**
- `Hero.inscribeBodyCircle()` validates skill-tier points ≥ 12 and magic tier ≥ 7, sets 5-day pending timer.
- `Hero.getHybridMpCost()` applies inscription tax to physical techniques.
- `BattleService.executeAction()` checks body inscription and reduces MP.

**Gaps & Evidence:**
- **Doc still says “not implemented”** while code implements it; doc/code mismatch on intended design.
- **Effect scope simplified:** only MP-cost tax is applied; other doc-specified hybrid benefits (resonance, passive auras) are absent.
- **No visual feedback in combat** for hybrid activation.

---

## 8. Expeditions & Regions

**Docs:** `docs/explore/expeditions.md`, `docs/explore/expeditions_data.md`, `docs/explore/regions_data.md`

| Layer | Status | Notes |
|-------|--------|-------|
| Engine | ✅ | Full lifecycle, procedural nodes, story injection, rewards. |
| UI | ✅ | `ExploreTab`, expedition assignment, result modal. |
| Tests | ✅ | Unit + behaviour tests. |

**Implemented:**
- `ExpeditionService.assignExpedition()`, `processDay()`, `resolveBattle()`, `_finishExpedition()`.
- `RegionService.checkRegionUnlocks()` generic evaluator, story mission injection, branching paths.
- Bestiary unlocks, first-clear speed bonus, narrative rewards.

**Gaps & Evidence:**
- **Expedition fatigue/reward balance** not audited against doc numbers.
- **Region unlock UI feedback** could be richer (currently mostly backend).

---

## 9. Market, Shop & Forge

**Docs:** `docs/village/shop_forge.md`, `docs/shared/inventory/equipment.md`, `docs/shared/inventory/consumables.md`

| Layer | Status | Notes |
|-------|--------|-------|
| Engine | 🟡 | `MarketService`, rotating stock, refine exist; buy/sell logic works. |
| UI | 🟡 | `ShopTab`/`ForgeTab` interactive but shop unlock gating is arbitrary. |
| Tests | 🟡 | Some coverage; sell UI path less tested. |

**Implemented:**
- `MarketService` generates weekly stock, specials, refresh timers.
- `ShopTab` supports buy/sell/resources with storage warnings.
- `ForgeTab` lists equipment and calls `refineEquipment`.

**Gaps & Evidence:**
- **Shop unlock gating arbitrary:** `ShopTab` unlocks when `completedExpeditions.includes('exp_tutorial_cave')`; doc specifies unlocking via **townhall or market building**, not a hidden expedition check.
- **Forge cost mismatch:** UI computes `gold: 50*(level+1)` and `material_ore: 2*(level+1)`; doc/forge spec may differ.
- **Resource buying not fully modeled:** only wood/stone/grain; iron/crystal buying absent.
- **Sell path depends on `getSellPrice` adapter call inside computed**; works but is architecturally awkward.

---

## 10. Daily Objectives & Mission Board

**Docs:** `docs/village/daily_objectives.md`

| Layer | Status | Notes |
|-------|--------|-------|
| Engine | 🟡 | `DailyObjectivesService` works; `MissionService`/`MissionSeedService` exist but are orphan. |
| UI | 🟡 | `DailyObjectives` shows both legacy objectives and new mission-board UI, but board is fed by legacy data. |
| Tests | ✅ | Tests for daily objective generation/claim. |

**Implemented:**
- Tutorial objectives days 1–7, then 4 random choices pick 2, tracking, claim rewards.
- `VillagePage.missionBoard` maps legacy objectives into mission cards for display.

**Gaps & Evidence:**
- **Mission board not wired to engine:** `missionBoard.activeMissions` is built from `dailyObjectives.objectives`, not from `engine.missionService`.
- **Reroll disabled:** `canReroll` is hardcoded to `false` with a TODO comment `// Will be wired in Subtask 5`.
- **`MissionService` exists in engine** but is not exposed through adapter or consumed by UI.

---

## 11. Calendar & Raids

**Docs:** `docs/village/calendar_defense.md`

| Layer | Status | Notes |
|-------|--------|-------|
| Engine | 🟡 | Seasons, deterministic raid schedule, defense assignment, resolution. |
| UI | ✅ | `VillageCalendar` + `VillageDefense` in village hub. |
| Tests | ✅ | Calendar tests. |

**Implemented:**
- 30-day seasons, raid generation every 7–14 days after ≥4 heroes.
- Defense assignment (max 4), auto-resolved raid combat, win/loss penalties.

**Gaps & Evidence:**
- **Raid level never scales:** `CalendarService._generateRaid()` passes `totalClears: 0` hardcoded, so `raidLevel` does not increase with region clears as doc specifies.
- **Season effects not applied:** `getSeasonEffects()` returns modifiers but they are not consumed by village production or combat.

---

## 12. Academy, Witch & Trainer

**Docs:** (Hero development / town buildings)

| Layer | Status | Notes |
|-------|--------|-------|
| Engine | 🟡 | Services exist and are called in `nextDay()`. |
| UI | 🟡 | Modals open from hero profile but effects are subtle. |
| Tests | 🟡 | Limited coverage. |

**Implemented:**
- `AcademyService`: teaching reduces skill learning time.
- `TrainerService`: dialogue + physical training bonuses.
- `WitchService`: dialogue + prophecy/fortune effects.
- `GameEngine.nextDay()` processes academy/inscription/training grounds.

**Gaps & Evidence:**
- **Academy formula mismatch:** `AcademyService` uses `Math.floor(magicPower/10) * 0.3` bonus; doc/commentary expects **−0.3 days per 10 MP**.
- **Trainer/witch UI mostly flavour:** dialogue is shown but concrete mechanical choices (which buff to take) are minimal.
- **Academy modal is not hero-specific:** `AcademyModal` opens without the selected hero context.

---

## 13. Hall of Fame / Titles

**Docs:** `docs/shared/hall_of_fame.md`

| Layer | Status | Notes |
|-------|--------|-------|
| Engine | 🔴 | Only 8 basic titles implemented. |
| UI | 🟡 | `HallOfFameModal` opens from hero profile. |
| Tests | 🔴 | Minimal. |

**Implemented:**
- `TitleService.evaluateTitles()` grants titles based on simple thresholds.
- `HallOfFameModal` displays earned titles.

**Gaps & Evidence:**
- **Title catalog incomplete:** docs list level/combat/skill/expedition/hybrid titles; code only has 8 basic titles.
- **No prestige/legacy mechanics** beyond title assignment.

---

## 14. Book & Chronicle

**Docs:** `docs/shared/book/book_system.md`, `docs/shared/chronicle/chronicle_system.md`

| Layer | Status | Notes |
|-------|--------|-------|
| Engine | ✅ | `BookService` layout, chapters, writer revelations; `ChronicleService` catalog. |
| UI | ✅ | `BookPage`, `ChronicleTab`, auto-open on new content. |
| Tests | ✅ | Unit tests for Book and Chronicle. |

**Implemented:**
- `BookService.addSection()` splits sections into page content sections, manages pages/chapters, read state, writer revelations at 10/12/14 history blocks.
- `ChronicleService` registers/unlocks entries with Book links.
- App auto-opens Book after presentations if unread history/milestone content exists.

**Gaps & Evidence:**
- **Book layout edge cases** on very long sections not exhaustively tested.

---

## 15. Settings & Save Slots

**Docs:** `docs/shared/core/save_slots.md`, `docs/settings/settings.md`

| Layer | Status | Notes |
|-------|--------|-------|
| Engine | ✅ | `Persistence`, `SaveSlotManager`, 10-slot registry, legacy migration. |
| UI | ✅ | `SaveSlotPage`, `SettingsPage`, language select, dev cheat, wipe. |
| Tests | ✅ | Unit tests for persistence/save slots. |

**Implemented:**
- Slot prefix isolation, slot summaries, create/delete, legacy migration to slot 0.
- Language switching (en/es/ca/eu/gl), dev cheat, magic simulator.

**Gaps & Evidence:**
- **Settings page duplicates tab:** also accessible from `TownPage` tabs; acceptable but redundant.

---

## Cross-Cutting Issues

| Issue | Severity | Evidence |
|-------|----------|----------|
| Doc/code numeric drift | High | miner chance, growth rates, raid scaling, academy formula. |
| Season/weather effects unused | Medium | `getSeasonEffects()` exists but no consumer. |
| Advanced gambit conditions unused | Medium | `enemy_element`, `enemy_type`, `battle_phase` declared but not evaluated. |
| Mission board orphan engine | Medium | `MissionService` exists, UI points to legacy objectives. |
| Title catalog minimal | Low-Medium | Only 8 titles vs. full doc catalog. |
| Shop unlock gating | Low | Expedition-based instead of building-based. |
| Hybrid body inscription doc mismatch | Low | Doc says not implemented; code implements simplified version. |

---

## Test Coverage Snapshot

- **Unit tests:** Most engine services (`Village`, `Hero`, `Battle`, `Expedition`, `Region`, `MagicCircle`, `Gambit`, `Book`, `Chronicle`, `Calendar`, `DailyObjectives`, `SaveSlotManager`).
- **Behaviour tests:** Gambit evaluation, combat flow, expedition lifecycle.
- **Vue tests:** `HeroesPage`, `VillagePage`, `BookPage`, modals, `CombatOverlay`.
- **Notable gaps:** Mission board engine/UI integration, Hall of Fame, advanced gambit conditions, hybrid inscription full effects.

No failing-test evidence was observed during exploration, but a full `npm test` run should be executed to confirm current state.

---

## Recommended Priority Order

1. **Fix numeric drift** (miner chance, raid scaling, academy formula, growth constants) to match docs.
2. **Wire Mission Board** to `MissionService` and enable reroll/claim engine paths.
3. **Complete Gambit conditions** (`enemy_element`, `enemy_type`, `battle_phase`, AND/OR) and expose presets in UI.
4. **Apply season effects** to village production and/or combat.
5. **Expand Hall of Fame** title catalog to match docs.
6. **Reconcile Hybrid Body Inscription** doc vs. code and add remaining resonance/passive effects.
7. **Audit shop unlock** and forge/refine costs against docs.
8. **Add missing behaviour tests** for the above.

---

*End of report.*
