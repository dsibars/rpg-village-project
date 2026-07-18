# Doc Review Report

Living ledger of spec ↔ code drift reviews: what diverged, how each case was
decided, and what changed. Referenced from `AGENTS.md` §3.

**Decision rules applied to each discrepancy:**

1. **Stub → fix the code.** The code is a shortcut/TODO; the spec reflects intent.
2. **Tuned → update the spec.** The code reflects deliberate balance/design tuning; the spec is stale.
3. **Balance dispute → the Combat Balance Lab arbitrates** (see [combat_balance_lab.md](./shared/combat/combat_balance_lab.md)).

---

## Round 2026-07 — Spec ↔ Code Reconciliation

### Fixed in code (Rule 1 — spec wins)

| Drift | Resolution |
|-------|------------|
| Enemy templates duplicated in `ExpeditionService` + `CalendarService`; 5 templates missing (`orc_grunt`, `orc_shaman`, `rock_golem`, `harpy_scout`, `skeleton_archer`) with silent slime-stat fallback | New single source `js/engine/shared/data/EnemiesData.js`; both services consume it; `RegionValidator` now rejects unknown enemy IDs (enemies, bossPool, story stages); registry-wide regression test added |
| Raid scaling hardcoded `totalClears = 0` | `CalendarService` now wires `RegionService.getTotalClears()` per [calendar_defense.md](./village/calendar_defense.md); tests added |
| Season effects defined but never consumed | `GameEngine.nextDay()` passes season effects into `VillageService.nextDay()`; farm production and miner chance now apply season modifiers; tests added |
| Academy learning speed inverted (`speedMult` multiplied days, making higher sanctum levels *slower*) | Divides days instead, matching [buildings_data.md](./village/buildings_data.md) speed bonuses; test added |
| Building costs owned by `BuildingsTab.vue` and injected into the engine; iron costs from the spec dropped (explorer_guild L2, training_grounds L1) | New authoritative `js/engine/village/data/BuildingsData.js` incl. `material_iron_ore` costs; `GameEngine.startProject` derives costs itself; UI reads the same data for display |
| `reg_iron_peaks` / `reg_ancient_library` registered but unreachable (no `unlockRequirements`) | Unlock conditions added following the established progression curve (18 clears + guild L2 + 4 heroes; 22 clears + guild L3 + 5 heroes) |

### Updated specs (Rule 2 — code wins)

| Drift | Resolution |
|-------|------------|
| Miner gather chance: spec 20%, code 35% (deliberate rebalance f45961c) | [village.md](./village/village.md) updated to 35% |
| Region unlock table: spec said OR-conditions with old numbers; code uses AND-conditions from the pacing rebalance | [regions_data.md](./explore/regions_data.md) §3 table rewritten to match code; iron_peaks/ancient_library moved from "planned" to implemented |
| `mission_board` building costs existed only in the UI | Documented in [buildings_data.md](./village/buildings_data.md) |
| Spring season "growth" vague | Interpreted as +5% farm production; [calendar_defense.md](./village/calendar_defense.md) made explicit |
| Hall of Fame: ~20 titles spec'd, 8 early-game-calibrated ones live | [hall_of_fame.md](./shared/hall_of_fame.md) split into Implemented / Planned sections |
| [hybrid_body_inscription.md](./shared/combat/hybrid_body_inscription.md) said "not implemented" while core loop ships | Status line corrected (thresholds match spec; advanced interactions may be partial) |
| `mage_scaling` combat-lab scenario asserted the pre-rework magic design | Rewritten as a passing pair: identical glyph spell at magicPower 5 vs 60 must land in the same damage band (spell damage is glyph-driven; magicPower is sustain) |

### Broken references fixed

- `calendar_defense.md` Files section pointed at pre-Vue paths (`js/presentation/…`, `pages/…`) → now points at `ux/features/village/…`.
- `settings.md` page path `pages/settings.html` → `ux/features/settings/SettingsPage.vue`.
- `codex.md` linked nonexistent `roadmap.md` → now points at regions/buildings data docs.
- `combat_balance_lab.md` known-failure example and tracked-issues table updated (mage_scaling resolved; counts 8 pass / 5 known).

### Guards added this round

- `RegionValidator` enemy-reference validation + registry-wide test.
- `I18nParity.test.js` — all locales must match `en` key set (6 missing keys in es/ca/eu/gl were found and fixed).
- `make test` now runs the full node suite (incl. subdirectories) + the Vue suite via npm scripts.

### Known issues still open

- 3 gambit conditions unimplemented (`enemy_element`, `enemy_type`, `battle_phase`) — tracked as combat-lab known failures.
- Healing potions flat vs % max HP — combat-lab known failures.
- `magicDefense` stat is computed but not yet shown in hero/enemy UI.
- `MissionService`/`MissionSeedService` partially unwired (mission board UI maps legacy objectives).

---

## Round 2026-07 — Playtest-driven UX polish

Findings from interactive browser playtests (Playwright) and fixes applied:

| Finding | Fix |
|---------|-----|
| Manual combat targeting dead — `.target-overlay` rendered under stat bars (`z-index: 2`) | `z-index: 3` on the overlay; whole enemy/ally card clickable (`CombatActorCard.vue`) |
| Tutorial required click-to-dismiss + click-on-target for every step | Click-capture now exists only for acknowledgement steps; target steps rely on adapter action-gating (`TutorialOverlay.vue`) |
| Tutorial step requirements invisible (e.g. "spend ALL stat points") | Messages show live progress ("(4 remaining)"); `assign_stats` text now says to spend all points |
| No escape from tutorial bubbles | Bubbles are dismissible (×) (`TutorialMessage.vue`) |
| Stale texts vs magic rework: `magicPower` desc sold spell damage; miner said 20% (code: 35%) | All 5 locales updated to the sustain design and 35% |
| Book: "1 enemies" grammar | Plural-aware fallback in victory narration |
| Book: dangling empty "Day N — Notes" headings | `BookService` skips empty village-update sections |
| Expedition-complete modal contradicted rewards screen | `en` wording aligned to "no additional rewards" (other locales already correct) |
| Defense hub printed "No defenders assigned" twice | Duplicate render removed (`VillageDefense.vue`) |
| Book page arrows tiny, top-left, undiscoverable | Large circular side arrows, vertically centered, pulsing only when enabled (`BookView.vue`) |
| Book font too small to read | Narrative/UI font sizes raised ~20% (`BookPcs.vue`) |
| Book opened at last page, skipping unseen ones | Mark-read moved from on-arrive to on-leave/on-close — opens at first *unseen* spread |
| Farm completion + first victory chapters collapsed into one day | Farm L1 duration 1 → 2 days (staggers milestone chapters) |

### Validation

- Engine + Vue suites green (551 + 140) after every change; production build clean.
- Full interactive replay on a fresh slot: tutorial fully single-click, combat targeting works, Book navigation/font/read-state verified visually.

---

## Round 2026-07 — Visual polish (from second playtest sweep)

| Finding | Fix |
|---------|-----|
| Footer Book lacked the unread indicator the top bar has | Amber pulsing badge dot on the footer item when the Book has unread content (`FooterNav.vue`) |
| Top-bar resources cryptic without hover | Micro-labels under each resource (GOLD/POP/WOOD/STONE/IRON, 5 locales) (`TopBar.vue`) |
| Bestiary "???" cards read as random emoji | Uniform dark-silhouette treatment via grayscale+brightness (`BestiaryTab.vue`) |
| Modal scrims flat and weak | `ModalFrame` overlay deepened + `backdrop-filter: blur(6px)` |
| Seasons invisible despite wired effects | Subtle per-season ambient tint on the village dashboard (`VillagePage.vue`) |
| Touch targets too small (stat +, log expander, tutorial ×) | Enlarged (28→38px stat +, padded toggle, bigger ×) |
| First-ever fight showed red DANGEROUS (level-gap-only formula) | Skip-risk now uses the defense-power formula (str+def+hp/10); tutorial fights read SAFE/RISKY (`CombatHeader.vue`) |

All validated live in-browser (fresh slot + continued save).

---

## Round 2026-07 — Step 3: structural de-risking

| Item | Change |
|------|--------|
| `t()` replaced only the first occurrence of each `{param}` | All occurrences replaced (`I18nService.js`) + first-ever test for the service |
| `BattleService.reset()` monkey-patched `log.push` per battle | Explicit `logEvent()` method with the same enrichment; 18 call sites converted |
| Two conflicting `:root` token systems (style.css green/12px/20px vs theme.css amber/6px/16px), winner decided by load order | `theme.css` is now the single token root; the 3 still-referenced legacy tokens moved there; `:root` deleted from `css/style.css` (keeps fonts/reset/background) |
| 334-line `GameEngine.nextDay()` god-method | Extracted verbatim to `js/engine/shared/services/DayResolutionService.js`; facade delegates via a hooks object. GameEngine drops 1981 → 1677 lines |
| Book narration "Heroes stood against 3 , ," | `combatLog.enemies` is a string array — joined directly instead of mapping `.name` on strings (`GameEngine.js`) |
| UI re-serialized the entire engine state 10×/sec into one `shallowRef` | Version-gated sync: `stateVersion` bumped in `Persistence.save()` and `BattleService.logEvent()`; the loop serializes only on change, with a 2s forced sync as safety net (`ux/main.js`) |

**Found during validation, not yet fixed:** several Book village-update entries silently never fire — the code checks `villageReport.foodConsumed` / `.newVillagers` / `.buildingCompleted`, but `VillageService.nextDay()`'s report object has `consumed`/`completed[]` (different field names). Product call needed on which entries the Book should show.

**Deferred:** dead legacy CSS classes in `style.css` (harmless; needs a dedicated cleanup pass).

### Validation

- Engine + Vue suites green (554 + 140); production build clean.
- Live replay: full day cycle via `DayResolutionService`, battle auto-combat animating under version-gated sync, Book narration fix confirmed for new battles.

---

*Earlier rounds: see `docs/feature_completeness_report.md` (June 2026 self-audit).*
