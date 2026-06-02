# Implementation Plan 11: The Chronicle

## Goal
Build a lightweight, read-only companion page that lets players review their experienced chapter presentations, see what they've missed, and replay any seen milestone. No new engine state. No complex calculations.

> **Prerequisite:** Implementation Plan 10 (Core Chapter Presentation System) must be complete. The Chronicle is a pure UI layer over `PresentationCatalog`, `PresentationService.seenPresentations`, and `PresentationService.pendingPresentations`.

---

## Phase 1 — Navigation & Page Shell

### 1.1 Top Bar Button

**File:** `js/presentation/ui/shared/AppShell.js` (or wherever top navigation is rendered)

Add a Chronicle button immediately to the **right of the Codex button**:
- Icon: 📜
- Label key: `nav_chronicle`
- Visibility: **Always visible** — even new players see it
- Click: routes to `#chronicle`

### 1.2 Chronicle Page Shell

**New File:** `js/presentation/ui/chronicle/ChronicleView.js`

```js
export class ChronicleView {
    constructor(container, engine, i18n, presentationModal) {
        this.container = container;
        this.engine = engine;
        this.i18n = i18n;
        this.presentationModal = presentationModal; // shared instance from UIShell
    }

    render() {
        // Render full page into this.container
    }
}
```

The Chronicle page follows the same adaptive layout patterns as other full-page views (Codex, Heroes, etc.).

---

## Phase 2 — Milestone List

### 2.1 Chapter Sections

Group presentations by their `chapter` field:
- Collapsible sections: "Chapter 1 — The Spark", "Chapter 2 — The Flood"
- Default state: all chapters expanded
- Each chapter header shows a simple count: `X/Y` (seen / total non-finale presentations)

```js
_getChapterProgress(chapterNum) {
    const milestones = PRESENTATION_CATALOG.filter(p => p.chapter === chapterNum && p.trigger.type !== 'chapter_milestones');
    const seen = milestones.filter(p => this.engine.presentationService.isSeen(p.id)).length;
    return { seen, total: milestones.length };
}
```

### 2.2 Milestone Row

Each presentation renders as a row with one of three states:

**State: Seen**
```
✅ The First Harvest                              Day 4
   "The first seeds were planted before the walls were up..."
   [📖 See Again]
```
- Title is revealed
- Day completed is shown (from `PresentationService.getDaySeen(id)`)
- A short excerpt from the first page's text (first ~100 chars + "...")
- 📖 See Again button

**State: Locked**
```
🔒 ???
   Requires: Build Farm Level 1
```
- Title is hidden (`???`)
- Trigger hint is shown (derived from the presentation's `trigger` field)

**State: Pending**
```
🆕 The First Spark
   Will play next day
   [📖 See Again]
```
- Title is revealed (trigger already met, just waiting for `nextDay()`)
- "Will play next day" indicator
- 📖 See Again is available (the player may have skipped the modal and wants to preview)

### 2.3 Data Binding

```js
_getMilestoneStatus(presentationId) {
    if (this.engine.presentationService.isSeen(presentationId)) return 'seen';
    if (this.engine.presentationService.pendingPresentations.includes(presentationId)) return 'pending';
    return 'locked';
}

_getTriggerHint(presentation) {
    const t = presentation.trigger;
    switch (t.type) {
        case 'new_game': return this.i18n.t('chronicle_hint_newgame');
        case 'building_complete': return this.i18n.t('chronicle_hint_building', { building: t.buildingId, level: t.level });
        case 'mission_complete': return this.i18n.t('chronicle_hint_mission', { mission: t.missionId });
        case 'hero_recruited': return this.i18n.t('chronicle_hint_hero', { origin: t.origin });
        case 'first_event': return this.i18n.t('chronicle_hint_event', { event: t.eventId });
        case 'chapter_milestones': return this.i18n.t('chronicle_hint_finale', { chapter: t.chapter });
        default: return '';
    }
}
```

---

## Phase 3 — Replay ("See Again")

### 3.1 Opening a Seen Presentation

When the player clicks 📖 See Again:

```js
_onSeeAgain(presentationId) {
    // Use the shared PresentationModal instance
    this.presentationModal.open(presentationId, (id) => {
        // Replay completion — just close the modal, no state changes
        this.presentationModal.close();
    });
}
```

### 3.2 Replay Badge

The `PresentationModal` should show a small **"Replay"** badge in its header when `isSeen(id)` is true before opening. This tells the player they're re-experiencing a moment they've already seen.

> **Note:** If `PresentationModal` does not yet support a replay indicator, this can be added as a one-line check in its `_render()` method.

---

## Phase 4 — Recently Unlocked

### 4.1 Section at Top

A small section above all chapter lists:

```
📜 Recently Unlocked
┌─────────────────────────────────────────┐
│ The First Harvest — Day 4      [📖]     │
│ A Shield in the Dark — Day 7   [📖]     │
│ The Warm Fire — Day 9          [📖]     │
└─────────────────────────────────────────┘
```

### 4.2 Logic

```js
_getRecentlyUnlocked(limit = 3) {
    return this.engine.presentationService.seenPresentations
        .filter(entry => entry.daySeen !== null)
        .sort((a, b) => b.daySeen - a.daySeen)
        .slice(0, limit)
        .map(entry => ({
            id: entry.id,
            title: this.i18n.t(PRESENTATION_CATALOG.find(p => p.id === entry.id)?.pages[0]?.textKey || entry.id),
            daySeen: entry.daySeen
        }));
}
```

- Shows up to 3 most recently seen milestones
- Sorted by `daySeen` descending
- Each entry has title + day + mini 📖 button
- If fewer than 3 seen, shows however many exist
- If zero seen, section is hidden entirely

---

## Phase 5 — i18n Keys

Add to all 5 language files (`en.js`, `es.js`, `ca.js`, `eu.js`, `gl.js`):

```js
// Navigation
nav_chronicle: 'Chronicle',

// Page title
chronicle_title: 'Village Chronicle',
chronicle_recently_unlocked: 'Recently Unlocked',

// Milestone states
chronicle_seen: 'Seen',
chronicle_locked: 'Locked',
chronicle_pending: 'Pending',
chronicle_pending_hint: 'Will play next day',

// Actions
chronicle_replay: 'See Again',
chronicle_replay_badge: 'Replay',

// Trigger hints
chronicle_hint_prefix: 'Requires:',
chronicle_hint_newgame: 'Unlocked at the start of a new game',
chronicle_hint_building: 'Build {building} to Level {level}',
chronicle_hint_mission: 'Complete mission: {mission}',
chronicle_hint_hero: 'Recruit a hero with origin: {origin}',
chronicle_hint_event: 'Reach this milestone in gameplay',
chronicle_hint_finale: 'Complete enough Chapter {chapter} milestones',

// Day label
chronicle_day_prefix: 'Day',
chronicle_day_unknown: '—',
```

For non-English files, add keys with `// TODO: translate`.

---

## Phase 6 — Tests

**New File:** `tests/unit/ChronicleView.test.js`

```js
globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {}, clear() {} };

import test from 'node:test';
import assert from 'node:assert';
import { ChronicleView } from '../../js/presentation/ui/chronicle/ChronicleView.js';
import { PresentationService } from '../../js/engine/shared/services/PresentationService.js';

test('ChronicleView: renders chapters from catalog', () => {
    const engine = { presentationService: new PresentationService(), i18n: { t: (k, p) => k } };
    const view = new ChronicleView(document.createElement('div'), engine, engine.i18n, null);
    view.render();
    assert.ok(view.container.innerHTML.includes('Chapter 1'));
});

test('ChronicleView: seen milestone shows day and See Again', () => {
    const service = new PresentationService();
    service.markAsSeen('pres_prologue', 1);
    const engine = { presentationService: service, i18n: { t: (k, p) => k } };
    const view = new ChronicleView(document.createElement('div'), engine, engine.i18n, null);
    view.render();
    assert.ok(view.container.innerHTML.includes('Day 1'));
    assert.ok(view.container.innerHTML.includes('See Again'));
});

test('ChronicleView: locked milestone hides title', () => {
    const engine = { presentationService: new PresentationService(), i18n: { t: (k, p) => k } };
    const view = new ChronicleView(document.createElement('div'), engine, engine.i18n, null);
    view.render();
    assert.ok(view.container.innerHTML.includes('???'));
});

test('ChronicleView: pending milestone shows Will play next day', () => {
    const service = new PresentationService();
    service.checkTriggers({ type: 'new_game' });
    const engine = { presentationService: service, i18n: { t: (k, p) => k } };
    const view = new ChronicleView(document.createElement('div'), engine, engine.i18n, null);
    view.render();
    assert.ok(view.container.innerHTML.includes('Will play next day'));
});

test('ChronicleView: Recently Unlocked shows last 3 seen', () => {
    const service = new PresentationService();
    service.markAsSeen('pres_prologue', 1);
    service.markAsSeen('pres_first_harvest', 4);
    service.markAsSeen('pres_shield_dark', 7);
    const engine = { presentationService: service, i18n: { t: (k, p) => k } };
    const view = new ChronicleView(document.createElement('div'), engine, engine.i18n, null);
    view.render();
    const html = view.container.innerHTML;
    assert.ok(html.includes('Recently Unlocked'));
});
```

---

## Phase 7 — Verification Checklist

- [ ] `ChronicleView.js` renders all chapters and milestones from `PresentationCatalog`.
- [ ] Nav button 📜 visible in top bar, immediately right of Codex, always visible.
- [ ] 3 milestone states render correctly (seen/locked/pending).
- [ ] Seen entries show `Day X` and 📖 See Again button.
- [ ] 📖 See Again opens `PresentationModal` with Replay badge.
- [ ] Replay does not modify `seenPresentations` or `daySeen`.
- [ ] Locked entries show `???` title + trigger hint.
- [ ] Pending entries show "Will play next day" indicator.
- [ ] Chapter headers show simple `X/Y` count.
- [ ] "Recently Unlocked" section shows up to 3 latest seen milestones.
- [ ] "Recently Unlocked" hidden when zero presentations seen.
- [ ] Responsive layout works on mobile.
- [ ] i18n keys added to all 5 language files.
- [ ] Unit tests pass (5 tests).
- [ ] Existing tests still pass.
