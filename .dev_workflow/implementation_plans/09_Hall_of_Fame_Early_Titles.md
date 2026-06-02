# Implementation Plan: Hall of Fame — Add Early-Game Titles

## Goal
Add the two most critical early dopamine titles to the Hall of Fame system: **"the Recruit"** (Level 5) and **"the Slayer"** (100 enemies defeated). These are the first titles a player sees and are essential engagement hooks. The current code only has 8 generic titles; this plan adds the minimal viable title system for the early game.

> **Scope:** 2 titles + award logic + notification + i18n. Uses existing `enemiesDefeated` and `level` stats — no new tracking fields needed.

---

## Phase 1 — Documentation Update

No doc changes needed. `docs/shared/hall_of_fame.md` already specifies these titles. The doc is authoritative; the code is what lags.

---

## Phase 2 — Engine Changes

### 2.1 Add Title Criteria to TitleService

**File:** `js/engine/heroes/services/TitleService.js` (or equivalent)

Add a `TITLE_CATALOG` and award checks:

```js
const TITLE_CATALOG = [
    {
        id: 'the_recruit',
        category: 'level',
        check: (hero) => hero.level >= 5
    },
    {
        id: 'the_slayer',
        category: 'combat',
        check: (hero) => (hero.lifetimeStats?.enemiesDefeated || 0) >= 100
    }
];

export class TitleService {
    static checkAndAward(hero) {
        const newTitles = [];
        for (const title of TITLE_CATALOG) {
            if (!hero.titles.includes(title.id) && title.check(hero)) {
                hero.titles.push(title.id);
                newTitles.push(title.id);
            }
        }
        return newTitles; // array of newly awarded title IDs
    }
}
```

If `TitleService` already exists with a different structure, adapt the pattern — the key is:
1. A catalog of title IDs with predicate functions.
2. A `checkAndAward` method that returns newly awarded titles.
3. Titles are stored on the hero as `hero.titles: string[]`.

### 2.2 Ensure Hero Model Has `titles` Array

**File:** `js/engine/heroes/models/Hero.js`

Verify the constructor initializes:
```js
this.titles = data.titles || [];
```

If missing, add it.

### 2.3 Wire Title Checks Into Game Flow

**File:** `js/engine/heroes/services/HeroService.js` (or `BattleService.js` / `GameEngine.js`)

Add title checks at two trigger points:

#### After Level Up
In `Hero.levelUp()` or wherever level-up is finalized:
```js
const newTitles = TitleService.checkAndAward(this);
if (newTitles.length > 0) {
    this.pendingTitleNotifications = this.pendingTitleNotifications || [];
    this.pendingTitleNotifications.push(...newTitles);
}
```

#### After Battle Victory
In `BattleService._resolveBattle()` or `GameEngine` post-battle:
```js
for (const hero of victoriousHeroes) {
    const newTitles = TitleService.checkAndAward(hero);
    if (newTitles.length > 0) {
        hero.pendingTitleNotifications = hero.pendingTitleNotifications || [];
        hero.pendingTitleNotifications.push(...newTitles);
    }
}
```

> **Note:** `enemiesDefeated` is already incremented during battle resolution (verify this). If not, add the increment in the battle win path.

### 2.4 Expose Pending Notifications for UI Consumption

**File:** `js/engine/GameEngine.js`

In `nextDay()` or after battle resolution, collect pending title notifications into the daily report / battle report:

```js
const titleNotifications = [];
for (const hero of this.heroService.list()) {
    if (hero.pendingTitleNotifications?.length > 0) {
        for (const titleId of hero.pendingTitleNotifications) {
            titleNotifications.push({ heroId: hero.id, heroName: hero.name, titleId });
        }
        hero.pendingTitleNotifications = [];
    }
}
if (titleNotifications.length > 0) {
    dailyReport.titleNotifications = titleNotifications;
}
```

---

## Phase 3 — Presentation Changes

### 3.1 Display Title Next to Hero Name

**File:** `js/presentation/ui/heroes/components/HeroListItem.js` (or equivalent hero list component)

If `hero.titles.length > 0`, display the first (highest priority) title:
```js
const displayTitle = hero.titles[0]; // or use priority ordering
const titleText = displayTitle ? t(`title_${displayTitle}`) : '';
// Render: "Arthur the Recruit" or "Arthur — the Recruit"
```

**File:** `js/presentation/ui/heroes/components/HeroDetailPane.js` (or equivalent)

In the hero header, show all earned titles:
```js
el('div', { class: 'hero-titles' }, hero.titles.map(t =>
    el('span', { class: 'hero-title-badge' }, t(`title_${t}`))
))
```

### 3.2 Title Award Toast/Notification

**File:** `js/presentation/ui/shared/components/NotificationToast.js` (or daily report renderer)

When `dailyReport.titleNotifications` is present, render a celebratory toast for each:
```js
for (const notif of dailyReport.titleNotifications) {
    showToast({
        icon: '🏆',
        message: t('notification_title_earned', {
            name: notif.heroName,
            title: t(`title_${notif.titleId}`)
        }),
        type: 'success',
        duration: 4000
    });
}
```

---

## Phase 4 — i18n

**Files:** All 5 language files under `js/engine/shared/core/i18n/translations/`

Add:
```js
// Titles
title_the_recruit: 'the Recruit',
title_the_slayer: 'the Slayer',

// Notifications
notification_title_earned: '{name} has earned the title "{title}"!',
```

For non-English files, add translations or `// TODO: translate`.

Verify no stale title keys exist that reference the old 8-generic system in a way that conflicts.

---

## Phase 5 — Tests

**File:** `tests/unit/TitleService.test.js` (or create if missing)

```js
import test from 'node:test';
import assert from 'node:assert';
import { TitleService } from '../../js/engine/heroes/services/TitleService.js';

function makeHero(overrides = {}) {
    return {
        id: 'h1',
        name: 'Arthur',
        level: 1,
        lifetimeStats: { enemiesDefeated: 0 },
        titles: [],
        pendingTitleNotifications: [],
        ...overrides
    };
}

test('TitleService: awards the Recruit at Level 5', () => {
    const hero = makeHero({ level: 5 });
    const newTitles = TitleService.checkAndAward(hero);
    assert.deepStrictEqual(newTitles, ['the_recruit']);
    assert.ok(hero.titles.includes('the_recruit'));
});

test('TitleService: does not award the Recruit below Level 5', () => {
    const hero = makeHero({ level: 4 });
    const newTitles = TitleService.checkAndAward(hero);
    assert.deepStrictEqual(newTitles, []);
});

test('TitleService: does not duplicate titles', () => {
    const hero = makeHero({ level: 5, titles: ['the_recruit'] });
    const newTitles = TitleService.checkAndAward(hero);
    assert.deepStrictEqual(newTitles, []);
});

test('TitleService: awards the Slayer at 100 kills', () => {
    const hero = makeHero({ lifetimeStats: { enemiesDefeated: 100 } });
    const newTitles = TitleService.checkAndAward(hero);
    assert.deepStrictEqual(newTitles, ['the_slayer']);
});

test('TitleService: does not award the Slayer below 100 kills', () => {
    const hero = makeHero({ lifetimeStats: { enemiesDefeated: 99 } });
    const newTitles = TitleService.checkAndAward(hero);
    assert.deepStrictEqual(newTitles, []);
});

test('TitleService: awards multiple titles in one check', () => {
    const hero = makeHero({ level: 5, lifetimeStats: { enemiesDefeated: 100 } });
    const newTitles = TitleService.checkAndAward(hero);
    assert.strictEqual(newTitles.length, 2);
    assert.ok(newTitles.includes('the_recruit'));
    assert.ok(newTitles.includes('the_slayer'));
});
```

**File:** `tests/unit/GameEngine.test.js` or `tests/unit/BattleService.test.js`

Add integration test:
```js
test('Battle: victory increments enemiesDefeated and may award title', () => {
    const engine = createEngine();
    const hero = engine.heroService.list()[0];
    hero.lifetimeStats.enemiesDefeated = 99;
    
    // Simulate a battle where 2 enemies are defeated
    hero.lifetimeStats.enemiesDefeated += 2;
    const newTitles = TitleService.checkAndAward(hero);
    
    assert.ok(newTitles.includes('the_slayer'));
});
```

---

## Phase 6 — Verification Checklist

- [ ] `TitleService.checkAndAward()` exists and evaluates all titles in catalog.
- [ ] `the_recruit` is awarded when a hero reaches Level 5.
- [ ] `the_slayer` is awarded when a hero reaches 100 enemies defeated.
- [ ] Titles are not duplicated.
- [ ] Title checks run after level-up and after battle victory.
- [ ] `enemiesDefeated` is incremented during battle resolution.
- [ ] Hero model stores `titles: string[]`.
- [ ] Hero list shows the first/priority title next to the hero name.
- [ ] Hero detail shows all earned titles as badges.
- [ ] Title award triggers a toast notification with hero name and title.
- [ ] Title notifications are cleared after being shown.
- [ ] i18n keys added to all 5 language files.
- [ ] All TitleService unit tests pass (6 tests).
- [ ] Existing combat and hero tests still pass.
