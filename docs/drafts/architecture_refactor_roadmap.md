# Architecture Refactor Roadmap

> **Status:** In Progress  
> **Branch:** `feature/arch_improvements_20260530`  
> **Memory Tag:** `arch_refactor`  
> **Started:** 2026-05-30

---

## Agent Protocol

Before every stage, search recent memories:
```bash
./.agents_shared_memory/memory.sh search "arch_refactor" 20 $(cat .agents_shared_memory/docs_hash)
```

After completing any sub-task, milestone, or discovery:
```bash
./.agents_shared_memory/memory.sh add <topic> "arch_refactor,<other_tags>" "<summary>" "<details>" "<files>" "<assumptions>"
```

**Topic naming convention:**
- `arch_stage_<N>_<name>` — stage completion
- `arch_commit_<hash>` — commit made
- `arch_thought_<insight>` — architectural insight or warning
- `arch_todo_<item>` — TODO created or resolved
- `arch_bug_<desc>` — bug found during refactor

---

## Stages

### Stage 0: Lock Baseline ✅
- Create branch from `develop`
- Commit any uncommitted changes
- Run tests to confirm green

**Commit:** Baseline locked on branch.

---

### Stage 1: Extract View-Specific CSS from `style.css`
**Goal:** `style.css` should only contain shared tokens, resets, layout shells, and global components. All view-specific CSS lives in `css/views/`.

**Extract to new files:**
- [ ] `css/views/combat.css` — all `.combat-*` rules (lines ~1090–1650 in style.css)
- [ ] `css/views/gambit.css` — all `.gambit-*` rules (lines ~2078–2160, 2541–2590)
- [ ] `css/views/magic-circle.css` — all `.magic-circle-*` rules (lines ~2180–2540), merge with `magic-circle-scaffold.css`
- [ ] `css/views/settings.css` — all `#settings-view`, `.settings-*` rules (lines ~474–545)

**Merge into existing files:**
- [ ] `css/views/heroes.css` — `.trainer-*`, `.witch-*`, `.academy-*`, `.hall-of-fame-*`, `.body-inscription-*`, `.equipment-*`, `.stat-assign-*`
- [ ] `css/views/village.css` — `.village-grid`, `.village-tile-*`, `.building-detail-*`, `.building-preview-*`, `.building-stats-*`

**Update:** `index.html` to add `<link>` tags for new CSS files.

**Test:** Visual regression — open every page, confirm no style breakage.

---

### Stage 2: HTML Template Audit
**Goal:** Ensure `pages/` are pure markup with zero logic and proper `data-i18n`.

- [ ] Verify no `<script>` tags in any `pages/*.html`
- [ ] Verify every user-visible text uses `data-i18n`
- [ ] Add missing `data-i18n` attributes where found

**Test:** DOM tests pass; manual inspection confirms no inline JS.

---

### Stage 3: Move Read-Only Calculations to Engine
**Goal:** Remove "display math" from presentation. Safe — no state mutation.

| # | Move From | Move To |
|---|-----------|---------|
| 3a | `EquipmentHelper.js:getEquipmentStats()` | `Engine: EquipmentService.getStats(item)` |
| 3b | `ShopView.js` sell price formula | `GameEngine.getSellPrice(item)` |
| 3c | `HeroesView.js` recruit cost formula | `GameEngine.getRecruitCost()` |
| 3d | `HeroProfilePane.js` inscription eligibility | `GameEngine.getHeroProfileDto(heroId)` |
| 3e | `HeroInscriptionModal.js` hybrid MP cost | `GameEngine.getHybridMpCost(heroId)` |
| 3f | `HeroSkillsModal.js` tier calculations | `Hero.getTechniqueDisplayData()` or `CombatCalculator` |

**Test:** New engine unit tests; DOM tests verify displayed values match.

---

### Stage 4: Move Write Operations & Validation to Engine
**Goal:** Remove state-mutating logic and combat validation from presentation.

| # | Move From | Move To |
|---|-----------|---------|
| 4a | `CombatView._canCastSpellInCombat()` | `BattleService.canCast(heroId, spellIdx)` |
| 4b | `CombatActionPanel.js` stamina/MP checks | `BattleService.canAffordAction(heroId, action)` |
| 4c | `CombatView.js` combat action execution | `GameEngine.executeBattleAction(actionDto)` |
| 4d | `MagicCircleView.js` spell composition | `GameEngine.composeSpell(glyphIds, tiers, name)` |
| 4e | `GambitView.js` gambit construction | `GambitService.buildGambit(rawDto)` |
| 4f | `SettingsView.js` persistence calls | `GameEngine.wipeSlot()` / `wipeAllSlots()` |

**Test:** New engine unit tests; DOM tests still pass.

---

### Stage 5: Enforce the Facade (Remove Deep Imports)
**Goal:** Presentation talks to `GameEngine` / `EngineAdapter` only.

- [ ] Replace `this.engine.battleService.*` with `this.adapter.*`
- [ ] Replace direct `GameConstants.js` imports with adapter catalog methods
- [ ] Replace `Hero` model import in `HeroProfilePane.js` with DTO properties
- [ ] Replace `persistence` import in `SettingsView.js` with adapter methods
- [ ] Replace `MagicCircleService` direct calls with `engine.composeSpell()` / `engine.getGlyphPreview()`

**Test:** Grep confirms zero deep engine imports in presentation (except adapter).

---

### Stage 6: Presentation i18n Audit
**Goal:** Every user-facing string in the UI goes through translation.

- [ ] Scan `pages/*.html` for missing `data-i18n`
- [ ] Scan `js/presentation/ui/**/*.js` for hardcoded strings
- [ ] Add missing keys to translation files

**Test:** No hardcoded strings in presentation; language switch works.

---

### Stage 7: Engine i18n Cleanup
**Goal:** Engine never emits translated text.

- [ ] Replace hardcoded battle log strings in `BattleService.js` with keys
- [ ] Refactor `WitchService` / `TrainerService` to return `{ key, params }`
- [ ] Replace hardcoded enemy/region names with `i18n_name` references
- [ ] Move or restructure `CombatLogFormatter`

**Test:** Engine returns keys; adapter translates before display.

---

### Stage 8: Remove Dead Translation Keys
**Goal:** Clean translation files now that keys are stable.

- [ ] Identify unused keys in translation files
- [ ] Remove confirmed dead keys
- [ ] Add any missing keys discovered in Stage 7

**Test:** No missing translations; file sizes reduced.

---

### Stage 9: Split Translation Files by Domain
**Goal:** Match translation structure to docs/engine domains.

```
js/engine/shared/core/i18n/translations/
├── en/
│   ├── shared.js
│   ├── heroes.js
│   ├── village.js
│   ├── explore.js
│   └── settings.js
```

**Test:** Language switching works; all strings load.

---

### Stage 10: Engine Structural Standardization
**Goal:** Enforce `core/`, `models/`, `services/` inside every engine domain.

- [ ] `village/` → `village/core/`, `village/models/`, `village/services/`
- [ ] `explore/` → `explore/core/`, `explore/models/`, `explore/services/`
- [ ] Same for `calendar/`, `daily/`, `gambit/`, `magic_circle/`, `hall_of_fame/`, `academy/`

**Test:** All engine unit tests pass.

---

### Stage 11: Engine Internal Polish
**Goal:** Fix remaining engine-level debt.

| # | Task | Files |
|---|------|-------|
| 11a | Split `GameConstants.js` into domain data files | `js/engine/shared/data/*.js` |
| 11b | Deduplicate enemy templates (`ExpeditionService` vs `CalendarService`) | `js/engine/explore/`, `js/engine/calendar/` |
| 11c | Extract `localStorage` behind `StoragePort` (optional) | `js/engine/shared/core/Persistence.js` |
| 11d | Standardize `CombatLogFormatter` location | `js/presentation/` or `js/engine/` |

**Test:** Full test suite green.

---

### Stage 12: Contract Alignment & Integration
**Goal:** Ensure engine changes didn't break presentation contracts.

- [ ] Walk every view; confirm adapter method usage
- [ ] Verify no stale DTO property access
- [ ] Run behaviour tests

**Test:** Full test suite green; manual smoke test.

---

### Stage 13: Final Regression & Tag
**Goal:** Ship the clean architecture.

- [ ] Full manual QA pass
- [ ] Performance check
- [ ] `git tag post-arch-refactor-v1`

---

## Progress Log

| Stage | Status | Commit | Notes |
|-------|--------|--------|-------|
| 0 | ✅ Done | Baseline | Branch created from develop |
| 1 | ⬜ Pending | — | CSS extraction |
| 2 | ⬜ Pending | — | HTML audit |
| 3 | ⬜ Pending | — | Read-only calc → engine |
| 4 | ⬜ Pending | — | Write ops → engine |
| 5 | ⬜ Pending | — | Facade enforcement |
| 6 | ⬜ Pending | — | Pres i18n audit |
| 7 | ⬜ Pending | — | Engine i18n cleanup |
| 8 | ⬜ Pending | — | Dead key removal |
| 9 | ⬜ Pending | — | Translation split |
| 10 | ⬜ Pending | — | Engine structure |
| 11 | ⬜ Pending | — | Engine polish |
| 12 | ⬜ Pending | — | Integration |
| 13 | ⬜ Pending | — | Ship |
