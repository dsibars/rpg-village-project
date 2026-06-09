# Implementation Plan 4: Heroes Domain — List & Profile Shell

> **Phase:** 3.1 — Domain Refactors (Heroes first)
>
> **Objective:** Replace the placeholder `HeroesPage.vue` with a real master-detail hero browser: list on the left, profile on the right. Build the first player-visible domain feature inside the new Vue shell.
>
> **Estimated Effort:** 1–2 sessions
>
> **Risk:** Low-Medium — first domain wired into the live shell; establishes patterns for Village, Combat, and Explore
>
> **Dependencies:** Plan 3 (Core Shell & State Integration) — `App.vue`, `useGameState()`, `useAdapter()`, `useI18n()`, FooterNav/TopBar must exist.

---

## 1. Scope

### In Scope
- Replace `ux/features/heroes/HeroesPage.vue` placeholder with a real master-detail layout
- Create 6 new components in `ux/features/heroes/components/`
- Wire the page to the engine via `useAdapter()` for:
  - `hero.recruit` — recruit button (tavern required)
  - `hero.increaseStat` — stat point allocation
- Create corresponding `.spec.js` tests in `tests/vue/features/heroes/`
- Use existing i18n keys only — no changes to `js/engine/shared/core/i18n/translations/`
- No changes to `js/presentation/`, `js/engine/` logic, `pages/`, `css/`, or `infrastructure/electron/`

### Out of Scope
- Full modals (Skills, Equipment, Inscription, Consumables, Training, Witch, Academy, Hall of Fame, Magic Circle, Gambits) — those are Plan 5+ pieces
- Complex interactivity beyond stat allocation and recruiting
- Combat integration
- Portrait images / art assets (use emoji placeholders consistent with existing code)

---

## 2. Research Summary

### 2.1 Hero Data Model (from `docs/heroes/hero.md` + legacy `HeroesView.js`)

```js
{
  id: string,
  name: string,
  level: number,
  exp: number,
  origin: string,           // origin id, e.g. "village_guard"
  activity: "idle" | "expedition" | "training" | ...,
  status: "active" | "resting" | "training",
  statPoints: number,       // unassigned attribute points
  skillPoints: number,      // unassigned skill points
  hp: number, maxHp: number,
  mp: number, maxMp: number,
  stamina: number, maxStamina: number,
  strength: number,
  speed: number,
  defense: number,
  magicPower: number,
  mealBuffs: [{ stat, value, battlesRemaining }],
  equipment: { head, body, legs, leftHand, rightHand, accessory }
}
```

### 2.2 Existing i18n Keys We Will Use

| Key | English |
|---|---|
| `heroes_uxelm_list_title` | "Your Heroes" |
| `heroes_uxelm_recruit` | "Recruit" |
| `heroes_uxelm_select_prompt` | "Select a hero to view stats and equipment." |
| `heroes_uxelm_activity` | "Activity" |
| `heroes_uxelm_experience` | "Experience" |
| `heroes_uxelm_stat_point_available` | "Unassigned Stat Points: {amount}" |
| `heroes_uxelm_stat_point_busy` | "Unassigned Stat Points: {amount} (Cannot assign on expedition)" |
| `heroes_uxelm_skill_point` | "Skill Points: {amount}" |
| `heroes_uxelm_skills` | "Skills" |
| `heroes_uxelm_inscription_title` | "Body Inscription" |
| `heroes_uxelm_consumables` | "Use Item" |
| `heroes_status_activity_idle` | "Idle" |
| `heroes_status_activity_expedition` | "On Expedition" |
| `heroes_status_meal_buff` | "Meal buff active" |
| `heroes_info_stat_hp` / `_mp` / `_stamina` / `_strength` / `_speed` / `_defense` / `_magic_power` | Stat labels |
| `shared_uxelm_level` / `shared_uxelm_level_abbrev` | "Level" / "Lvl" |
| `shared_uxelm_back` | "Back" |
| `village_error_gold_not_enough` | Recruit tooltip when poor |

### 2.3 Engine Adapter Actions Already Mapped

From `ux/adapters/EngineAdapter.js`:
- `adapter.dispatch('hero', 'recruit')` → `engine.recruitHero()`
- `adapter.dispatch('hero', 'increaseStat', { heroId, statId })` → `engine.increaseHeroStat(heroId, statId)`

### 2.4 Recruitment Rule

- Button visible only when `village.infrastructure.tavern >= 1`
- Cost = `engine.getRecruitCost()` (or compute `floor(100 * 1.2^(heroCount))` as fallback)
- Disabled when `village.gold < cost`

---

## 3. File Plan

### 3.1 New Components

```
ux/features/heroes/
├── HeroesPage.vue                              # master-detail composer
└── components/
    ├── HeroList.vue                            # scrollable list container
    ├── HeroListItem.vue                        # individual hero card
    ├── HeroProfile.vue                         # split-pane profile shell
    ├── HeroStatsGrid.vue                       # 7 stat rows with allocate buttons
    ├── HeroActionBar.vue                       # row of quick-access buttons
    └── HeroEmptyState.vue                      # "Select a hero" placeholder
```

### 3.2 New Tests

```
tests/vue/features/heroes/
├── HeroesPage.spec.js
├── HeroList.spec.js
├── HeroListItem.spec.js
├── HeroProfile.spec.js
├── HeroStatsGrid.spec.js
├── HeroActionBar.spec.js
└── HeroEmptyState.spec.js
```

---

## 4. Component Contracts

### `HeroesPage.vue`

**Responsibilities:**
- Read heroes list from `useGameState().heroes`
- Read village from `useGameState().village`
- Manage `selectedHeroId` ref
- Render master-detail layout:
  - Left: `HeroList` + recruit button
  - Right: `HeroProfile` (or `HeroEmptyState` when none selected)
- Dispatch `hero.recruit` on recruit click

**Props:** none (uses composables)

**Emits:** none

### `HeroList.vue`

**Props:**
```ts
heroes: Hero[]
selectedId: string | null
```

**Emits:**
```ts
select(heroId: string)
```

**Responsibilities:** render scrollable list of `HeroListItem`

### `HeroListItem.vue`

**Props:**
```ts
hero: Hero
selected: boolean
```

**Emits:**
```ts
select(heroId: string)
```

**Responsibilities:** compact card with name, level, activity emoji, meal-buff indicator

### `HeroProfile.vue`

**Props:**
```ts
hero: Hero
```

**Emits:**
```ts
allocateStat(statId: string)
openAction(action: 'skills' | 'equipment' | 'inscription' | 'consumables' | ...)
```

**Responsibilities:** split-pane layout: left column (portrait, name, origin, activity, action bar), right column (stats grid)

### `HeroStatsGrid.vue`

**Props:**
```ts
hero: Hero
```

**Emits:**
```ts
allocate(statId: string)
```

**Responsibilities:** render 7 stat rows. Show `+` button only when `statPoints > 0` and hero is idle. Use stat label i18n keys.

### `HeroActionBar.vue`

**Props:**
```ts
hero: Hero
```

**Emits:**
```ts
action(actionId: string)
```

**Responsibilities:** row of buttons for Skills, Equipment, Inscription, Consumables. For Plan 4 they are visual-only placeholders (emit events that HeroesPage does not yet handle). This gives us the shell; handlers come in Plan 5+.

### `HeroEmptyState.vue`

**Props:** none

**Emits:** none

**Responsibilities:** render `heroes_uxelm_select_prompt` with an icon

---

## 5. Key Behaviors

### 5.1 Master-Detail Mobile Behavior
- Desktop: list on left (280px), profile on right (flex-1)
- Mobile (`< 768px`): list is full-width; selecting a hero slides the profile in with a Back button
- Back button uses `shared_uxelm_back`

### 5.2 Recruit Button
- Hidden until tavern is built
- Label: `heroes_uxelm_recruit` + cost, e.g. "Recruit (120g)"
- Disabled when player cannot afford
- Tooltip/title: `village_error_gold_not_enough` when disabled

### 5.3 Stat Allocation
- Each stat row shows current value
- `+` button appears when `statPoints > 0` and `hero.activity === 'idle'`
- Click emits `allocateStat(statId)` → adapter dispatches `hero.increaseStat`
- Alert banner shows `heroes_uxelm_stat_point_available` or `heroes_uxelm_stat_point_busy`

### 5.4 Activity Display
- `idle` → 💤 + `heroes_status_activity_idle`
- non-idle → ⚔️ + `heroes_status_activity_expedition`
- 🍖 meal buff badge shown when `mealBuffs.length > 0`

---

## 6. Test Plan

| Component | Tests |
|---|---|
| `HeroesPage` | renders list + empty state; selects hero; shows recruit button when tavern built; disables recruit when poor; calls adapter on recruit; calls adapter on stat allocate |
| `HeroList` | renders correct number of items; emits select event |
| `HeroListItem` | shows hero name/level; shows activity emoji; applies selected class; emits select on click |
| `HeroProfile` | renders hero name; renders stats grid; renders action bar; emits allocateStat |
| `HeroStatsGrid` | renders 7 stats; shows + buttons when points available and idle; hides + when on expedition; emits allocate |
| `HeroActionBar` | renders all action buttons; emits action id on click |
| `HeroEmptyState` | renders select prompt |

**Target:** ~25 tests across 7 spec files.

---

## 7. i18n Strategy

- **No new translation keys** in this plan.
- All user-facing strings come from existing `en.js` keys listed in §2.2.
- Non-English languages already have these keys (verified in `es.js`, `ca.js`, `eu.js`, `gl.js`).
- Hardcoded English is allowed **only** in temporary placeholder contexts (e.g. button emojis, future modal labels).

---

## 8. Performance & Quality Constraints

- Every `.vue` file ≤ 250 lines (template + script + style).
- Pure props/emits for leaf components; only `HeroesPage` uses composables.
- Scoped styles only.
- No imperative DOM creation.
- Use `shallowRef`/`computed` patterns already established in Plan 3.

---

## 9. Exit Criteria

- `HeroesPage.vue` replaces the placeholder and renders real hero data from `gameState`
- All 7 spec files pass in Vitest
- `npm run build` succeeds
- `npm run electron:package` succeeds
- Legacy tests still pass
- No modifications to `js/presentation/`, `js/engine/`, `pages/`, `css/`, `infrastructure/electron/`

---

## 10. After This Plan

**Plan 5** options (to be decided next):
- **A. Hero Modals** — Skills, Equipment, Inscription, Consumables (high player value)
- **B. Combat Overlay** — wire `CombatOverlay` to `activeBattle` and build combat UI (highest complexity)
- **C. Village Dashboard** — calendar, defense assignment, construction queue (natural pairing with heroes)
