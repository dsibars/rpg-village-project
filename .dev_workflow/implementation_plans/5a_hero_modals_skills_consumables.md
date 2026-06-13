# Implementation Plan 5A: Hero Modals — Skills & Consumables

> **Phase:** 3.1 — Domain Refactors (Heroes, continued)
>
> **Objective:** Wire up the first two hero modals: Skills (learn/upgrade technique families) and Consumables (use items on a hero). Makes the HeroesPage action bar fully functional for the highest-frequency hero interactions.
>
> **Estimated Effort:** 1 session
>
> **Risk:** Low-Medium — modal wiring touches the live shell; establishes the modal-open pattern for future hero/domain modals
>
> **Dependencies:** Plan 4 (Heroes Domain — List & Profile Shell) — `HeroesPage.vue`, `HeroProfile.vue`, `HeroActionBar.vue`, `HeroStatsGrid.vue`, `useAdapter()`, `ModalFrame` must exist.

---

## 1. Scope

### In Scope
- Create `HeroSkillsModal.vue` with:
  - Known technique families list with tier progress bars
  - Locked technique families section with Learn button
  - Skill points alert (available / next milestone / maxed / busy)
  - Dispatch `hero.learnFamily` when Learn is clicked
- Create `HeroConsumablesModal.vue` with:
  - List of usable consumables from inventory
  - Per-item effect preview (HP/MP heal amount)
  - Disable Use when target resource is full
  - Dispatch `hero.useConsumable` when Use is clicked
- Update `HeroesPage.vue` to show/hide modals when action bar emits `skills` / `consumables`
- Update `HeroProfile.vue` if needed to thread modal open events cleanly
- Create corresponding `.spec.js` tests
- Use existing i18n keys only — no changes to `js/engine/shared/core/i18n/translations/`
- No changes to `js/presentation/`, `js/engine/` logic, `pages/`, `css/`, or `infrastructure/electron/`

### Out of Scope
- Equipment modal (larger, needs inventory gear integration)
- Body Inscription modal (complex glyph/tier logic)
- Trainer / Witch / Academy / Hall of Fame / Magic Circle modals (those are Town/Buildings interactions, not core hero modals)
- Gambit editor (already built in Plan 1, wiring to hero profile button comes later)

---

## 2. Research Summary

### 2.1 Engine Data

**TECHNIQUE_FAMILIES** (from `js/engine/shared/data/CombatData.js`):

```js
{
  single_strike: { id, baseMult, growth, hits, hitDecay, staminaCostBase, staminaCostPerTier, targetType },
  multiple_attack: { ... },
  power_strike: { ... },
  cleave: { ... },
  shield_bash: { ... },
  poison_strike: { ... },
  plunder: { ... }
}
```

**CONSUMABLES_DATA** (from `js/engine/shared/data/InventoryData.js`):

```js
{
  tiny_hp_potion: { type: 'HEAL_HP', amount: 0.3, ... },
  tiny_mp_potion: { type: 'HEAL_MP', amount: 0.2, ... },
  // type 'ESCAPE' is filtered out
}
```

### 2.2 Adapter Actions Already Mapped

From `ux/adapters/EngineAdapter.js`:
- `adapter.dispatch('hero', 'learnFamily', { heroId, familyId })` → `engine.learnHeroFamily(heroId, familyId)`
- `adapter.dispatch('hero', 'useConsumable', { heroId, consumableId })` → `engine.useHeroConsumable(heroId, consumableId)`

### 2.3 Existing i18n Keys

**Skills:**
| Key | English |
|---|---|
| `heroes_uxelm_skill_title` | "{name}'s Skills" |
| `heroes_uxelm_skill_point` | "Skill Points: {amount}" |
| `heroes_uxelm_skill_spend_hint` | "Spend a skill point to unlock a new technique" |
| `heroes_uxelm_skill_next_milestone` | "Next skill point at level {level}" |
| `heroes_uxelm_skill_max_families` | "All techniques unlocked" |
| `heroes_uxelm_skill_busy` | "Busy" |
| `heroes_uxelm_skill_locked_section` | "Locked Techniques" |
| `heroes_uxelm_skill_learn` | "Learn" |
| `heroes_uxelm_skill_tier_progress` | "Tier Progress" |
| `heroes_info_family_{id}` | Family names |
| `heroes_info_effect_*` | Effect labels |
| `shared_uxelm_locked` | "Locked" |

**Consumables:**
| Key | English |
|---|---|
| `heroes_uxelm_consumables_title` | "Use Item on {name}" |
| `heroes_uxelm_consumable_empty` | "No usable consumables in inventory." |
| `heroes_uxelm_consumable_full_hp` | "HP is already full" |
| `heroes_uxelm_consumable_full_mp` | "MP is already full" |
| `heroes_uxelm_use` | "Use" |
| `item_{id}` | Item names |

### 2.4 Hero State Relevant to Skills

```js
hero.knownFamilies = ['single_strike', 'power_strike', ...]
hero.skillPoints = 2
hero.techniqueTiers = { single_strike: 2, power_strike: 1 }
hero.techniqueUses = { single_strike: 150, power_strike: 45 }
hero.skillPointMilestones = [1, 5, 10, 15, 20, 25]
hero.bodyInscription = { glyphIds: [...], ... } // marks inscribed families
```

### 2.5 Hero State Relevant to Consumables

```js
inventory.consumables = { tiny_hp_potion: 5, tiny_mp_potion: 2 }
hero.hp / hero.maxHp
hero.mp / hero.maxMp
```

---

## 3. File Plan

### 3.1 New Components

```
ux/features/heroes/
├── components/
│   ├── modals/
│   │   ├── HeroSkillsModal.vue
│   │   └── HeroConsumablesModal.vue
│   └── HeroActionBar.vue           # update to emit action ids (already does)
├── HeroesPage.vue                  # update to host modals
```

### 3.2 New Tests

```
tests/vue/features/heroes/
└── components/
    └── modals/
        ├── HeroSkillsModal.spec.js
        └── HeroConsumablesModal.spec.js
```

---

## 4. Component Contracts

### `HeroSkillsModal.vue`

**Props:**
```ts
hero: Hero
open: boolean
```

**Emits:**
```ts
close: () => void
learn: (familyId: string) => void
```

**Responsibilities:**
- Read `TECHNIQUE_FAMILIES` constant
- Split families into known (sorted by tier desc) and locked
- Render tier progress bar per known family
- Render Learn button per locked family when:
  - `hero.skillPoints > 0`
  - `hero.knownFamilies.length < 6`
  - `hero.activity === 'idle'`
- Show alert text based on skill points / next milestone / busy state

### `HeroConsumablesModal.vue`

**Props:**
```ts
hero: Hero
consumables: Record<string, number>
open: boolean
```

**Emits:**
```ts
close: () => void
use: (consumableId: string) => void
```

**Responsibilities:**
- Read `CONSUMABLES_DATA` constant
- Filter out zero-count and `ESCAPE` type items
- Compute effect preview:
  - `HEAL_HP` → `+{floor(maxHp * amount)} HP`
  - `HEAL_MP` → `+{floor(maxMp * amount)} MP`
- Disable Use when:
  - `HEAL_HP` and `hp >= maxHp`
  - `HEAL_MP` and `mp >= maxMp`
- Show empty state when no usable consumables

### `HeroesPage.vue` Updates

**New state:**
```ts
const activeModal = ref(null) // 'skills' | 'consumables' | null
```

**Template changes:**
- Render `<HeroSkillsModal v-if="activeModal === 'skills'" ... />`
- Render `<HeroConsumablesModal v-if="activeModal === 'consumables'" ... />`
- Handle `@open-action` from `HeroProfile` to set `activeModal`

---

## 5. Key Behaviors

### 5.1 Modal Shell
- Both modals use existing `ModalFrame.vue`:
  - Header with icon + title
  - Close button (×) in header
  - Click outside or Escape to close
- Skills modal max-width: 560px
- Consumables modal max-width: 420px

### 5.2 Skills Tier Progress

```js
const cumulativeToCurrent = tier <= 1 ? 0 : 50 * (Math.pow(3, tier - 1) - 1)
const tierThreshold = Math.floor(100 * Math.pow(3, tier - 1))
const usesInTier = Math.max(0, (hero.techniqueUses[familyId] || 0) - cumulativeToCurrent)
const progress = Math.min(100, Math.floor((usesInTier / tierThreshold) * 100))
```

### 5.3 Family Effect Labels

Replicate existing `getFamilyEffectLabel` logic from `HeroSkillsModal.js`:
- `single_strike` → `heroes_info_effect_basic_attack`
- `multiple_attack` → `{hits} hits · {totalMult}×`
- `power_strike` → `{mult}× power`
- `cleave` → `heroes_info_effect_cleave`
- `shield_bash` → `heroes_info_effect_stun`
- `poison_strike` → `heroes_info_effect_poison`
- `plunder` → `heroes_info_effect_steal`

### 5.4 Known Families Sort

Sort known families by current tier descending so highest-tier techniques appear first.

---

## 6. Test Plan

| Component | Tests |
|---|---|
| `HeroSkillsModal` | renders known families; renders locked section; shows Learn buttons when points available; hides Learn when busy; emits learn with familyId; shows skill points alert; shows milestone alert when no points |
| `HeroConsumablesModal` | renders consumable list; computes HP heal preview; computes MP heal preview; disables Use when HP full; disables Use when MP full; shows empty state; emits use with consumableId |
| `HeroesPage` (updated) | opens skills modal when action bar clicked; opens consumables modal when action bar clicked; closes modal on close event |

**Target:** ~15–18 tests across 3 spec files.

---

## 7. i18n Strategy

- **No new translation keys** in this plan.
- All strings come from existing keys listed in §2.3.
- Family names use dynamic key construction: `t('heroes_info_family_' + familyId)` — this matches the existing pattern.

---

## 8. Performance & Quality Constraints

- Every `.vue` file ≤ 250 lines.
- Modals are pure props/emits; data constants imported directly.
- No deep watchers — derive everything from props + constants.
- Scoped styles only.

---

## 9. Exit Criteria

- Clicking Skills button in hero profile opens the skills modal
- Clicking Consumables button opens the consumables modal
- Both modals dispatch correct adapter actions
- All new and existing Vitest tests pass
- `npm run build` succeeds
- `npm run electron:package` succeeds
- Legacy tests still pass
- No modifications to frozen directories

---

## 10. After This Plan

Following the agreed order:
- **Plan 5B (awaiting your confirmation):** Equipment + Body Inscription hero modals
- **Plan 6:** Combat Overlay wiring
- **Plan 7:** Village Dashboard
