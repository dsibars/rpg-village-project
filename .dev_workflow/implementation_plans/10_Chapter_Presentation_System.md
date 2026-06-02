# Implementation Plan: Chapter Presentation System

## Goal
Build the technical infrastructure for multi-page narrative presentations triggered by gameplay milestones. This is the engine, UI framework, and wiring that makes the Chapter Presentation System (Idea 10b) possible. No presentation content is created here — only the framework that hosts it.

> **Prerequisite:** Read `ideas/10b_Chapter_Presentation_System.md` for the full creative vision. This plan builds the machinery; that document fills it with content.

---

## Phase 1 — Documentation Update

**File:** `docs/shared/core/unlock_narratives.md`

Add a new section at the end:

```
## Presentation System (Chapter Narratives)

Major story beats use the **Presentation System** — multi-page, image-backed narrative sequences with manual advancement. These are distinct from lightweight Unlock Narratives (single-sentence toasts).

Presentations are defined in `PresentationCatalog.js` and triggered by gameplay milestones (building completion, mission completion, hero recruitment, chapter milestones). Once viewed, a presentation is permanently marked as `seen` and never shown again.

See Implementation Plan 10 for technical details.
```

**File:** `docs/shared/core/save_slots.md`

Add `seenPresentations` to the per-slot data list:
```
- `seenPresentations`: Array of presentation IDs the player has already viewed.
- `pendingPresentations`: Array of presentation IDs queued for display.
```

---

## Phase 2 — Engine Changes

### 2.1 Create Presentation Catalog

**New File:** `js/engine/shared/data/PresentationCatalog.js`

```js
export const PRESENTATION_CATALOG = [
    {
        id: 'pres_prologue',
        chapter: 1,
        pages: [
            { image: 'assets/pres/valley_dawn.png', textKey: 'pres_prologue_p1' },
            { image: 'assets/pres/arthur_trail.png', textKey: 'pres_prologue_p2' },
            { image: 'assets/pres/valley_stake.png', textKey: 'pres_prologue_p3' }
        ],
        trigger: { type: 'new_game' }
    },
    {
        id: 'pres_first_harvest',
        chapter: 1,
        pages: [
            { image: 'assets/pres/farm_complete.png', textKey: 'pres_first_harvest_p1' }
        ],
        trigger: { type: 'building_complete', buildingId: 'farm', level: 1 }
    },
    {
        id: 'pres_shield_dark',
        chapter: 1,
        pages: [
            { image: 'assets/pres/valen_rubble.png', textKey: 'pres_shield_dark_p1' },
            { image: 'assets/pres/arthur_valen.png', textKey: 'pres_shield_dark_p2' }
        ],
        trigger: { type: 'mission_complete', missionId: 'exp_rescue_mission' }
    },
    {
        id: 'pres_warm_fire',
        chapter: 1,
        pages: [
            { image: 'assets/pres/tavern_dusk.png', textKey: 'pres_warm_fire_p1' },
            { image: 'assets/pres/tavern_inside.png', textKey: 'pres_warm_fire_p2' }
        ],
        trigger: { type: 'building_complete', buildingId: 'tavern', level: 1 }
    },
    {
        id: 'pres_first_spark',
        chapter: 1,
        pages: [
            { image: 'assets/pres/elara_twilight.png', textKey: 'pres_first_spark_p1' },
            { image: 'assets/pres/elara_glyph.png', textKey: 'pres_first_spark_p2' },
            { image: 'assets/pres/village_glow.png', textKey: 'pres_first_spark_p3' }
        ],
        trigger: { type: 'hero_recruited', origin: 'origin_arcane_initiate' }
    },
    {
        id: 'pres_chapter1_finale',
        chapter: 1,
        pages: [
            { image: 'assets/pres/village_above.png', textKey: 'pres_chapter1_finale_p1' },
            { image: 'assets/pres/elara_window.png', textKey: 'pres_chapter1_finale_p2' }
        ],
        trigger: { type: 'chapter_milestones', chapter: 1, required: 3, total: 4 }
    },
    {
        id: 'pres_language_world',
        chapter: 2,
        pages: [
            { image: 'assets/pres/sanctum_hum.png', textKey: 'pres_language_world_p1' },
            { image: 'assets/pres/arthur_glyph.png', textKey: 'pres_language_world_p2' },
            { image: 'assets/pres/circle_first.png', textKey: 'pres_language_world_p3' }
        ],
        trigger: { type: 'building_complete', buildingId: 'arcane_sanctum', level: 1 }
    },
    {
        id: 'pres_name_flame',
        chapter: 2,
        pages: [
            { image: 'assets/pres/circle_flare.png', textKey: 'pres_name_flame_p1' },
            { image: 'assets/pres/hero_awe.png', textKey: 'pres_name_flame_p2' }
        ],
        trigger: { type: 'first_event', eventId: 'first_spell_inscribed' }
    },
    {
        id: 'pres_veil_thins',
        chapter: 2,
        pages: [
            { image: 'assets/pres/witch_hut.png', textKey: 'pres_veil_thins_p1' },
            { image: 'assets/pres/witch_reading.png', textKey: 'pres_veil_thins_p2' }
        ],
        trigger: { type: 'building_complete', buildingId: 'witchs_hut', level: 1 }
    },
    {
        id: 'pres_world_opens',
        chapter: 2,
        pages: [
            { image: 'assets/pres/guild_maps.png', textKey: 'pres_world_opens_p1' },
            { image: 'assets/pres/map_table.png', textKey: 'pres_world_opens_p2' }
        ],
        trigger: { type: 'building_complete', buildingId: 'explorer_guild', level: 1 }
    },
    {
        id: 'pres_chapter2_finale',
        chapter: 2,
        pages: [
            { image: 'assets/pres/village_night_colors.png', textKey: 'pres_chapter2_finale_p1' },
            { image: 'assets/pres/sky_rift.png', textKey: 'pres_chapter2_finale_p2' }
        ],
        trigger: { type: 'chapter_milestones', chapter: 2, required: 3, total: 5 }
    }
];

export function getPresentationById(id) {
    return PRESENTATION_CATALOG.find(p => p.id === id);
}
```

> **Note:** Image paths are placeholders. Use existing assets initially (hero portraits, building icons, or generic backgrounds). The catalog can be updated with new art without code changes.

### 2.2 Create PresentationService

**New File:** `js/engine/shared/services/PresentationService.js`

```js
import { PRESENTATION_CATALOG } from '../data/PresentationCatalog.js';

export class PresentationService {
    constructor(state = null) {
        this.state = state || this._getDefaultState();
    }

    _getDefaultState() {
        return {
            seenPresentations: [],
            pendingPresentations: []
        };
    }

    // --- Trigger Evaluation ---

    checkTriggers(triggerEvent) {
        const newlyTriggered = [];
        for (const pres of PRESENTATION_CATALOG) {
            if (this.state.seenPresentations.includes(pres.id)) continue;
            if (this.state.pendingPresentations.includes(pres.id)) continue;
            if (this._evaluateTrigger(pres.trigger, triggerEvent)) {
                newlyTriggered.push(pres.id);
            }
        }
        if (newlyTriggered.length > 0) {
            this.state.pendingPresentations.push(...newlyTriggered);
        }
        return newlyTriggered;
    }

    _evaluateTrigger(trigger, event) {
        if (trigger.type !== event.type) return false;
        switch (trigger.type) {
            case 'new_game':
                return true;
            case 'building_complete':
                return event.buildingId === trigger.buildingId && event.level >= trigger.level;
            case 'mission_complete':
                return event.missionId === trigger.missionId;
            case 'hero_recruited':
                return event.origin === trigger.origin || event.heroName === trigger.heroName;
            case 'first_event':
                return event.eventId === trigger.eventId;
            case 'chapter_milestones':
                return event.chapter === trigger.chapter && event.met >= trigger.required;
            default:
                return false;
        }
    }

    // --- Queue Management ---

    hasPendingPresentations() {
        return this.state.pendingPresentations.length > 0;
    }

    peekNextPresentation() {
        return this.state.pendingPresentations[0] || null;
    }

    popNextPresentation() {
        return this.state.pendingPresentations.shift() || null;
    }

    // --- State Tracking ---

    markAsSeen(presentationId) {
        if (!this.state.seenPresentations.includes(presentationId)) {
            this.state.seenPresentations.push(presentationId);
        }
        // Also remove from pending if somehow still there
        this.state.pendingPresentations = this.state.pendingPresentations.filter(
            id => id !== presentationId
        );
    }

    isSeen(presentationId) {
        return this.state.seenPresentations.includes(presentationId);
    }

    // --- Persistence ---

    getState() {
        return { ...this.state };
    }

    setState(state) {
        this.state = {
            seenPresentations: state?.seenPresentations || [],
            pendingPresentations: state?.pendingPresentations || []
        };
    }
}
```

### 2.3 Wire Triggers Into Game Lifecycle

**File:** `js/engine/GameEngine.js`

Add `PresentationService` as a dependency:

```js
import { PresentationService } from './shared/services/PresentationService.js';
```

In the constructor, initialize:
```js
this.presentationService = new PresentationService(
    this.persistence.load('presentation_state')
);
```

#### Trigger Point 1: New Game
In `initializeNewGame()` or `resetState()`, after state is set:
```js
this.presentationService = new PresentationService();
this.presentationService.checkTriggers({ type: 'new_game' });
this._persistPresentationState();
```

#### Trigger Point 2: Building Completion
In `nextDay()`, after the Construction Phase, when a building completes:
```js
for (const project of completedProjects) {
    this.presentationService.checkTriggers({
        type: 'building_complete',
        buildingId: project.buildingId,
        level: project.targetLevel
    });
}
```

#### Trigger Point 3: Mission/Expedition Completion
In `ExpeditionService._finishExpedition()` or via GameEngine callback:
```js
if (exp.isStory) {
    this.presentationService.checkTriggers({
        type: 'mission_complete',
        missionId: exp.id
    });
}
```

> **Note:** The presentation is only **queued** here. It is **displayed** by `PostDaySequencer` at the next `nextDay()` boundary (Step 1: Chapter Messages). Expedition result messages (Step 2) will show after all chapter presentations are complete.

#### Trigger Point 4: Hero Recruitment
In `HeroService.add()` or `GameEngine.recruitHero()`, when a hero is added:
```js
this.presentationService.checkTriggers({
    type: 'hero_recruited',
    origin: hero.origin,
    heroName: hero.name
});
```

#### Trigger Point 5: First Spell Inscribed
In the Magic Circle inscription flow, after a spell is saved to a hero's Codex:
```js
const hasInscribedBefore = this.presentationService.isSeen('pres_name_flame');
if (!hasInscribedBefore) {
    this.presentationService.checkTriggers({ type: 'first_event', eventId: 'first_spell_inscribed' });
}
```

#### Trigger Point 6: Chapter Milestones
In `nextDay()`, after all other resolution, evaluate chapter milestones:
```js
const chapter1Milestones = this._evaluateChapterMilestones(1);
if (chapter1Milestones.met >= 3) {
    this.presentationService.checkTriggers({
        type: 'chapter_milestones',
        chapter: 1,
        met: chapter1Milestones.met
    });
}

const chapter2Milestones = this._evaluateChapterMilestones(2);
if (chapter2Milestones.met >= 3) {
    this.presentationService.checkTriggers({
        type: 'chapter_milestones',
        chapter: 2,
        met: chapter2Milestones.met
    });
}
```

Implement `_evaluateChapterMilestones(chapter)`:
```js
_evaluateChapterMilestones(chapter) {
    const milestones = [];
    if (chapter === 1) {
        milestones.push(this.villageService.getBuildingLevel('tavern') >= 1);
        milestones.push(this.heroService.list().length >= 3);
        milestones.push(this.expeditionService.getTotalCompletedExpeditions() >= 2);
        milestones.push(this.calendarService.getDefeatedRaidsCount() >= 1);
    } else if (chapter === 2) {
        milestones.push(this.villageService.getBuildingLevel('arcane_sanctum') >= 2);
        milestones.push(this._countUniqueSpells() >= 3);
        milestones.push(this.regionService.getUnlockedRegionCount() >= 5);
        milestones.push(this._getHighestMagicTier() >= 4);
        milestones.push(this._getDefeatedBossCount() >= 1);
    }
    return { met: milestones.filter(Boolean).length, total: milestones.length };
}
```

#### Persist Presentation State
Add a helper:
```js
_persistPresentationState() {
    this.persistence.save('presentation_state', this.presentationService.getState());
}
```

Call `_persistPresentationState()` after every trigger check and after `markAsSeen()`.

### 2.4 Expose Presentations to the PostDaySequencer

The `PostDaySequencer` reads directly from `engine.presentationService` — no report plumbing needed. However, you must ensure `presentationService` is accessible from the engine instance:

In `GameEngine.js`, the service is already initialized in the constructor (see 2.3). The sequencer accesses it via `this.engine.presentationService`.

No changes to `dailyReport` are required for presentation display. The daily report only contains gameplay data (resources, construction, expeditions). Presentation state lives in `PresentationService` and is consumed by the sequencer.

---

## Phase 3 — Presentation Changes

### 3.1 Refactor Intro Modal into Generic Presentation Modal

**File:** `js/presentation/ui/shared/components/PresentationModal.js` (new, or refactor existing intro modal)

The existing prologue modal becomes the generic presentation renderer. Extract the reusable parts:

```js
export class PresentationModal {
    constructor(container) {
        this.container = container;
        this.currentPresentation = null;
        this.currentPageIndex = 0;
    }

    open(presentationId) {
        const pres = getPresentationById(presentationId);
        if (!pres) return;
        this.currentPresentation = pres;
        this.currentPageIndex = 0;
        this._render();
    }

    _render() {
        const page = this.currentPresentation.pages[this.currentPageIndex];
        const isLastPage = this.currentPageIndex >= this.currentPresentation.pages.length - 1;

        this.container.innerHTML = `
            <div class="presentation-overlay">
                <div class="presentation-modal">
                    <button class="presentation-skip">${i18n.t('ui_skip')}</button>
                    <div class="presentation-content">
                        <div class="presentation-image">
                            <img src="${page.image}" alt="">
                        </div>
                        <div class="presentation-text">
                            <p>${i18n.t(page.textKey)}</p>
                        </div>
                    </div>
                    <div class="presentation-footer">
                        <div class="presentation-dots">
                            ${this.currentPresentation.pages.map((_, i) => `
                                <span class="dot ${i === this.currentPageIndex ? 'active' : ''}"></span>
                            `).join('')}
                        </div>
                        <button class="presentation-next">
                            ${isLastPage ? i18n.t('ui_finish') : i18n.t('ui_next')}
                        </button>
                    </div>
                </div>
            </div>
        `;

        this._bindEvents(isLastPage);
    }

    _bindEvents(isLastPage) {
        this.container.querySelector('.presentation-next').addEventListener('click', () => {
            if (isLastPage) {
                this._finish();
            } else {
                this.currentPageIndex++;
                this._render();
            }
        });

        this.container.querySelector('.presentation-skip').addEventListener('click', () => {
            this._finish();
        });
    }

    _finish() {
        // Notify engine that this presentation is complete
        this.onComplete?.(this.currentPresentation.id);
        this.close();
    }

    close() {
        this.container.innerHTML = '';
        this.currentPresentation = null;
    }
}
```

### 3.2 Responsive Layout

**File:** `css/style.css` (or dedicated `presentation.css`)

```css
.presentation-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.presentation-modal {
    background: var(--bg-card);
    border-radius: 12px;
    max-width: 800px;
    width: 90%;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    position: relative;
}

.presentation-skip {
    position: absolute;
    top: 12px;
    right: 12px;
    background: transparent;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 14px;
}

.presentation-content {
    display: flex;
    flex-direction: row;
    padding: 32px;
    gap: 24px;
    flex: 1;
    overflow: hidden;
}

.presentation-image {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
}

.presentation-image img {
    max-width: 100%;
    max-height: 400px;
    border-radius: 8px;
    object-fit: contain;
}

.presentation-text {
    flex: 1;
    display: flex;
    align-items: center;
    font-size: 18px;
    line-height: 1.7;
    color: var(--text-primary);
}

.presentation-footer {
    padding: 16px 32px;
    border-top: 1px solid var(--border-subtle);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.presentation-dots {
    display: flex;
    gap: 8px;
}

.dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--border-subtle);
}

.dot.active {
    background: var(--accent-primary);
}

/* Mobile: vertical stack */
@media (max-width: 767px) {
    .presentation-content {
        flex-direction: column;
        padding: 20px;
        overflow-y: auto;
    }
    .presentation-image img {
        max-height: 200px;
    }
    .presentation-text {
        font-size: 16px;
    }
}
```

### 3.3 Presentation Queue UI Integration (via PostDaySequencer)

The `PostDaySequencer` (already implemented in `js/presentation/ui/shared/PostDaySequencer.js`) owns the post-day presentation priority. Chapter presentations are **Step 1** (highest priority). You do NOT manually check for presentations in `AppShell` or `EngineAdapter` — the sequencer handles it.

**What to change in `PostDaySequencer.js`:**

Replace the placeholder `_runStepChapterMessages()`:

```js
// ─── Step 1: Chapter Presentation Messages ───
// Highest priority. Shows pending chapter presentations before anything else.
_runStepChapterMessages() {
    // If PresentationService is not yet wired into the engine, skip
    if (!this.engine.presentationService) {
        this._runStepExpeditionMessages();
        return;
    }

    const nextId = this.engine.presentationService.peekNextPresentation();
    if (nextId) {
        this.ui.presentationModal.open(nextId, (presentationId) => {
            // Mark as seen and persist
            this.engine.presentationService.markAsSeen(presentationId);
            this.engine._persistPresentationState?.();

            // Check for more pending presentations before moving on
            if (this.engine.presentationService.hasPendingPresentations()) {
                this._runStepChapterMessages(); // Recursive: show next chapter pres
            } else {
                this._runStepExpeditionMessages(); // All done, proceed
            }
        });
        return;
    }

    // No pending chapter presentations — skip to next step
    this._runStepExpeditionMessages();
}
```

**Requirements on `PresentationModal`:**

The modal must accept an `onComplete` callback that receives the presentation ID:

```js
export class PresentationModal {
    constructor(container, i18n) {
        this.container = container;
        this.i18n = i18n;
        this.currentPresentation = null;
        this.currentPageIndex = 0;
        this.onComplete = null;
    }

    open(presentationId, onComplete) {
        this.onComplete = onComplete;
        const pres = getPresentationById(presentationId);
        if (!pres) {
            onComplete?.(presentationId);
            return;
        }
        this.currentPresentation = pres;
        this.currentPageIndex = 0;
        this._render();
    }

    _finish() {
        const id = this.currentPresentation?.id;
        this.close();
        if (this.onComplete) this.onComplete(id);
    }

    close() {
        this.container.innerHTML = '';
        this.currentPresentation = null;
        this.onComplete = null;
    }
}
```

**Wiring in `UIShell` (or wherever UI components are instantiated):**

Ensure `presentationModal` is accessible from the UI root so `PostDaySequencer` can call `this.ui.presentationModal`:

```js
// In UIShell / AppShell constructor
this.presentationModal = new PresentationModal(
    document.getElementById('modal-root'),
    this.i18n
);
```

**Prologue migration:**

The existing prologue flow should be updated to use `PresentationModal`. The prologue becomes `pres_prologue` — just another catalog entry. On new game, `PresentationService.checkTriggers({ type: 'new_game' })` queues it. The first `nextDay()` (or a dedicated post-init hook) will trigger `PostDaySequencer`, which shows the prologue before anything else.

> **Note:** Do NOT add inline presentation checks in `EngineAdapter.btnNextDay`. The adapter already calls `this.postDaySequencer.run(report)` — that is the single entry point.

---

## Phase 4 — i18n

**Files:** All 5 language files under `js/engine/shared/core/i18n/translations/`

Add presentation text keys. This is a large content pass — for now, add English placeholders and mark others as `// TODO: translate`.

```js
// Presentation UI labels
ui_skip: 'Skip',
ui_next: 'Next',
ui_finish: 'Finish',

// Prologue
pres_prologue_p1: 'In a world consumed by the flames of eternal war, a small group of survivors has fled the chaos. Led by a brave hero, they seek a remote valley to build a sanctuary of peace. The journey has been long, and resources are scarce, but hope remains.',
pres_prologue_p2: 'Arthur did not choose to lead. He chose to protect. When the walls of the old kingdom fell, he gathered who he could — two villagers, a handful of grain, and the memory of a valley his grandmother once spoke of.',
pres_prologue_p3: 'They found it at dawn. The valley was not on any map. It was not supposed to exist. But here it was — green, hidden, and waiting. Arthur drove the first stake into the earth. The village began with that sound.',

// Chapter 1 presentations
pres_first_harvest_p1: 'The first seeds were planted before the walls were up. Hunger does not wait for architecture. Now, with the farm complete, the villagers no longer measure their days by the shrinking grain sack. There is bread on the horizon — but bread attracts mouths, and mouths require more bread. The cycle has begun.',

pres_shield_dark_p1: 'The guard was half-buried under rubble, his armor cracked, his sword still clutched in both hands. He did not speak of gratitude — only duty. "I will hold the line," he said. And he has.',
pres_shield_dark_p2: 'Two swords are not an army. But they are a beginning. Valen speaks little of where he came from, and Arthur does not ask. In wartime, a man\'s past is his own. What matters is that he stands when the enemy comes.',

pres_warm_fire_p1: 'The first keg was tapped before the roof was finished. Word travels fast in desperate lands — a village with a tavern is a village that plans to stay. Heroes began to arrive. Some seeking coin. Some seeking purpose. Some seeking only a place where the war had not yet reached.',
pres_warm_fire_p2: 'A tavern is not just a building. It is a promise. To the road-weary, it says: rest here. To the hopeful, it says: build here. To the village, it says: you are no longer alone. The first stranger walked through the door on the third night. He asked for work. Arthur gave him a chair.',

pres_first_spark_p1: 'She arrived at twilight, her robes singed at the hem, her eyes still reflecting something no one else could see. She did not ask for a room. She asked for a circle. "I can teach you," she said to Arthur, "if you build me a circle."',
pres_first_spark_p2: 'The word she used was not "magic." It was "weave." She spoke of threads beneath the world, of symbols that remember how to burn, of a language older than swords. Arthur did not understand. But he recognized the look in her eyes — it was the same look he had when he first saw the valley.',
pres_first_spark_p3: 'That night, the villagers whispered about the light in Elara\'s window. It was not candlelight. It moved. It breathed. It wrote shapes on the walls that no one could read — except Elara, who smiled for the first time since her arrival. "Tomorrow," she said to the dark, "we begin."',

pres_chapter1_finale_p1: 'The village has survived its first trials. Fires burn in hearths. Steel rings in the forge. Strangers have become neighbors. The valley, once a hiding place, is becoming a home. But valleys do not exist in isolation — and this one has been waiting a very long time for someone to listen.',
pres_chapter1_finale_p2: 'Elara\'s light no longer frightens the villagers. They have begun to leave offerings at her door — bread, herbs, questions she answers with riddles. She speaks of a sanctum. Of stones that hum. Of a language written in flame. The village has learned to survive. Now, it must learn to wonder.',

// Chapter 2 presentations
pres_language_world_p1: 'The stones of the sanctum hummed when the final brick was laid. Not a sound the ears could hear — a sound the bones could feel. Elara traced a symbol in the air — fire, she called it — and for a moment, the air itself remembered how to burn.',
pres_language_world_p2: '"This is not magic," Elara said, pressing Arthur\'s finger to the stone. "This is memory. The world has already burned. We are merely reminding it." The symbol left a mark on his skin — not a burn, but a warmth that did not fade for three days.',
pres_language_world_p3: 'The circle was small. One slot. One symbol. One breath of power. But Elara looked at it as a smith looks at ore — not with reverence, but with anticipation. "Every spell begins here," she said. "Every spell ends here. What happens between is your story."',

pres_name_flame_p1: 'The circle flared, the glyphs aligned, and for the first time, a spell existed that had never existed before. Elara smiled — rare for her. "You have written your first word in the language of gods," she said. "It is a small word. But it is yours, and no one can unwrite it."',
pres_name_flame_p2: 'The hero stared at their hands for an hour afterward. They expected to feel different. Heavier. Older. Instead, they felt only a quiet certainty, like the moment after a door closes and before the lock clicks. Something had changed. Something was still changing.',

pres_veil_thins_p1: 'The witch did not knock. She simply appeared one morning in the half-finished hut, stirring a cauldron that had not been there the night before. "Your mages glow," she said. "I read glows." She did not offer a name. She offered only readings — cryptic, poetic, and always true.',
pres_veil_thins_p2: '"The threads are weaving," she told one hero. "The pattern is there, but faint. Cast more. Feel more. The circle will widen when it is ready." The hero asked how much longer. The witch laughed — a sound like dry leaves. "Ready is the word. You are not ready. But you are becoming."',

pres_world_opens_p1: 'The guild charter was signed with mud instead of wax, but the meaning was the same: this village no longer hid. Maps were unrolled, scouts were commissioned, and the horizon became a destination. The valley had been a sanctuary. Now it was a base.',
pres_world_opens_p2: 'Arthur stared at the map for a long time. He had walked every inch of the valley, but the map showed paths he had never seen. "The valley is larger than it looks," the head scout said. Arthur placed a stone on the map — a marker, a promise, a warning. "Here," he said. "We go here next."',

pres_chapter2_finale_p1: 'The village no longer sleeps in darkness. Windows glow with colors that have no names in the old tongue. The smith and the mage argue at the tavern — not with anger, but with the joy of people who have finally found something worth disagreeing about.',
pres_chapter2_finale_p2: 'But the valley is not the only thing listening. On the night the third spell was inscribed, a scout reported a light in the high peaks — not starlight, not moonlight, something that moved when it should not move. "The circle is no longer a toy," Elara said. "It is a weapon. And weapons attract attention."'
```

For `es.js`, `ca.js`, `eu.js`, `gl.js`: add all keys with `// TODO: translate` comments or provide translations if available.

---

## Phase 5 — Tests

**File:** `tests/unit/PresentationService.test.js` (new)

```js
globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {}, clear() {} };

import test from 'node:test';
import assert from 'node:assert';
import { PresentationService } from '../../js/engine/shared/services/PresentationService.js';

test('PresentationService: new_game trigger fires prologue', () => {
    const service = new PresentationService();
    const triggered = service.checkTriggers({ type: 'new_game' });
    assert.ok(triggered.includes('pres_prologue'));
});

test('PresentationService: building_complete trigger matches', () => {
    const service = new PresentationService();
    const triggered = service.checkTriggers({ type: 'building_complete', buildingId: 'farm', level: 1 });
    assert.ok(triggered.includes('pres_first_harvest'));
});

test('PresentationService: building_complete does not fire for wrong building', () => {
    const service = new PresentationService();
    const triggered = service.checkTriggers({ type: 'building_complete', buildingId: 'blacksmith', level: 1 });
    assert.ok(!triggered.includes('pres_first_harvest'));
});

test('PresentationService: already seen presentations do not retrigger', () => {
    const service = new PresentationService();
    service.markAsSeen('pres_first_harvest');
    const triggered = service.checkTriggers({ type: 'building_complete', buildingId: 'farm', level: 1 });
    assert.ok(!triggered.includes('pres_first_harvest'));
});

test('PresentationService: pending presentations do not duplicate', () => {
    const service = new PresentationService();
    service.checkTriggers({ type: 'building_complete', buildingId: 'farm', level: 1 });
    const triggeredAgain = service.checkTriggers({ type: 'building_complete', buildingId: 'farm', level: 1 });
    assert.strictEqual(triggeredAgain.length, 0);
});

test('PresentationService: queue management', () => {
    const service = new PresentationService();
    service.checkTriggers({ type: 'new_game' });
    assert.strictEqual(service.peekNextPresentation(), 'pres_prologue');
    const popped = service.popNextPresentation();
    assert.strictEqual(popped, 'pres_prologue');
    assert.strictEqual(service.peekNextPresentation(), null);
});

test('PresentationService: markAsSeen removes from pending', () => {
    const service = new PresentationService();
    service.checkTriggers({ type: 'new_game' });
    assert.ok(service.hasPendingPresentations());
    service.markAsSeen('pres_prologue');
    assert.ok(!service.hasPendingPresentations());
    assert.ok(service.isSeen('pres_prologue'));
});

test('PresentationService: state persistence roundtrip', () => {
    const service = new PresentationService();
    service.checkTriggers({ type: 'new_game' });
    service.markAsSeen('pres_prologue');
    const state = service.getState();
    const service2 = new PresentationService();
    service2.setState(state);
    assert.ok(service2.isSeen('pres_prologue'));
    assert.ok(!service2.hasPendingPresentations());
});

test('PresentationService: chapter_milestones trigger', () => {
    const service = new PresentationService();
    const triggered = service.checkTriggers({ type: 'chapter_milestones', chapter: 1, met: 3 });
    assert.ok(triggered.includes('pres_chapter1_finale'));
});

test('PresentationService: chapter_milestones does not fire below threshold', () => {
    const service = new PresentationService();
    const triggered = service.checkTriggers({ type: 'chapter_milestones', chapter: 1, met: 2 });
    assert.ok(!triggered.includes('pres_chapter1_finale'));
});
```

**File:** `tests/unit/GameEngine.test.js` (add integration tests)

```js
test('GameEngine: nextDay queues building-completion presentations', () => {
    const engine = createEngine();
    // Simulate farm construction completing
    engine.villageService.state.constructionQueue = [{
        buildingId: 'farm', targetLevel: 1, daysRemaining: 1
    }];
    engine.nextDay();
    assert.ok(engine.presentationService.hasPendingPresentations());
    assert.ok(engine.presentationService.peekNextPresentation() === 'pres_first_harvest');
});
```

---

## Phase 6 — Verification Checklist

- [ ] `PresentationCatalog.js` created with all 11 presentations.
- [ ] `PresentationService.js` created with trigger evaluation, queue management, and state tracking.
- [ ] `GameEngine.js` wires trigger checks at: new game, building completion, mission completion, hero recruitment, first spell, chapter milestones.
- [ ] `PresentationModal.js` (or refactored intro modal) supports multi-page, image+text, dots, prev/next, skip.
- [ ] CSS supports desktop (side-by-side) and mobile (vertical stack) layouts.
- [ ] Presentations are shown by `PostDaySequencer` as Step 1 of the post-day flow — **before** expedition messages and daily report.
- [ ] `PostDaySequencer._runStepChapterMessages()` consumes `engine.presentationService` and chains presentations sequentially before proceeding to Step 2.
- [ ] `seenPresentations` and `pendingPresentations` are saved per-slot.
- [ ] A presentation marked `seen` never triggers again.
- [ ] If app closes mid-presentation, it restarts from page 1 on next launch (acceptable behavior).
- [ ] Skip button is always visible and functional.
- [ ] All 24+ i18n text keys added to `en.js`.
- [ ] Other language files have keys with `// TODO: translate`.
- [ ] `PresentationService` unit tests pass (10 tests).
- [ ] Existing prologue flow uses the new `PresentationModal`.
- [ ] Existing tests (intro, nextDay, expeditions) still pass.
