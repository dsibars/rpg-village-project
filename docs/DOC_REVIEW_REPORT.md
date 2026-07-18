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

*Earlier rounds: see `docs/feature_completeness_report.md` (June 2026 self-audit).*
