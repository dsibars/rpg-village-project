# Idea: Chapter Presentation System (Multi-Page Story Moments)

> **Status:** Design Proposal — Evolution of Idea 10  
> **Scope:** Presentation layer — multi-page narrative sequences triggered by gameplay milestones.  
> **Goal:** Transform key moments into memorable, illustrated story beats rather than single-sentence toasts.

---

## The Insight

The existing [Unlock Narratives](../docs/shared/core/unlock_narratives.md) are beautiful single-sentence toasts. But for the **most important moments** — the prologue, meeting Elara, finishing a chapter — a single sentence is not enough. The player needs:

- **Space to breathe** — a pause from the management loop
- **An image to anchor the emotion** — a face, a place, a symbol
- **A few paragraphs of text** — enough to feel like literature, not a tooltip

The game's existing **prologue/intro** already does this: a multi-page modal with text and imagery. The Chapter Presentation System generalizes that pattern into a reusable engine for the entire journey.

---

## The System

A **Presentation** is a multi-page narrative sequence. Each page has:
- An **image** (hero portrait, building illustration, landscape, or symbolic art)
- A **block of text** (2–5 sentences — enough to be literary, short enough to not be a book)
- A **page indicator** (dots or "1 / 3")

The player advances pages manually (tap/click). A **Skip** button is always available. Once finished, the presentation is marked as `seen` and never shown again.

### How It Differs from Unlock Narratives

| | Unlock Narratives | Chapter Presentations |
|---|-------------------|----------------------|
| **Length** | 1 sentence | 2–5 sentences per page, 1–4 pages |
| **Visual** | Text-only toast | Image + text per page |
| **Advance** | Auto-dismiss (8s) | Manual tap/click |
| **Trigger** | Any unlock predicate | Major milestones only |
| **Purpose** | "You discovered X" | "You lived through a moment" |

They coexist. Unlock Narratives handle ambient discovery. Presentations handle **story beats**.

---

## Design Philosophy: Chapters Are Collections, Not Gates

> **Critical:** The `chapter` field on a presentation is a **collection tag**, not a **progression lock**.

Players roleplay at their own pace. One player might rush combat and unlock gambits before building the farm. Another might recruit Elara and build the Arcane Sanctum before ever constructing a Tavern. The narrative must **adapt** to the player's choices, not force them into a prescribed order.

**What this means:**
- **Non-finale presentations fire purely on their trigger condition**, regardless of what "chapter" the player is "in."
- A player in Chapter 2 who finally builds the Farm will still see *The First Harvest* (Chapter 1). The presentation plays as a "flashback" — a moment they earned, just later than expected.
- Chapter labels are for the **player's understanding** ("this is part of Chapter 1's story arc") and for the **finale milestone counter**.

**The only exception:** **Finale presentations** (`pres_chapter1_finale`, `pres_chapter2_finale`) are gated by milestone thresholds. These are the only presentations that check "has enough of this chapter's content been experienced?"

**In short:** The game does not say *"You cannot see this until you finish Chapter 1."* It says *"When you do this thing, you earn this moment."*

---

## Presentation Catalog: Chapter 1 — "The Spark"

### 1.1 The Landing (Prologue)
- **Trigger:** New game start
- **Pages:** 3
- **Image 1:** The valley at dawn — mist, mountains, a small group of figures
- **Text 1:** *"In a world consumed by the flames of eternal war, a small group of survivors has fled the chaos. Led by a brave hero, they seek a remote valley to build a sanctuary of peace. The journey has been long, and resources are scarce, but hope remains."*
- **Image 2:** Arthur, standing with sword drawn, looking back at a trail of smoke
- **Text 2:** *"Arthur did not choose to lead. He chose to protect. When the walls of the old kingdom fell, he gathered who he could — two villagers, a handful of grain, and the memory of a valley his grandmother once spoke of."*
- **Image 3:** The valley clearing — a waterfall, green grass, the first stake in the ground
- **Text 3:** *"They found it at dawn. The valley was not on any map. It was not supposed to exist. But here it was — green, hidden, and waiting. Arthur drove the first stake into the earth. The village began with that sound."*

> **Note:** This prologue already exists. It becomes Presentation `pres_prologue`.

---

### 1.2 The First Harvest
- **Trigger:** Farm L1 construction completes
- **Pages:** 1
- **Image:** The Farm building — a simple wooden structure, grain swaying in the wind
- **Text:** *"The first seeds were planted before the walls were up. Hunger does not wait for architecture. Now, with the farm complete, the villagers no longer measure their days by the shrinking grain sack. There is bread on the horizon — but bread attracts mouths, and mouths require more bread. The cycle has begun."*

---

### 1.3 A Shield in the Dark
- **Trigger:** `exp_rescue_mission` completes (Sir Valen rescued)
- **Pages:** 2
- **Image 1:** Sir Valen, half-buried in rubble, sword still in hand
- **Text 1:** *"The guard was half-buried under rubble, his armor cracked, his sword still clutched in both hands. He did not speak of gratitude — only duty. 'I will hold the line,' he said. And he has."*
- **Image 2:** Arthur and Valen standing back-to-back at the village edge
- **Text 2:** *"Two swords are not an army. But they are a beginning. Valen speaks little of where he came from, and Arthur does not ask. In wartime, a man's past is his own. What matters is that he stands when the enemy comes."*

---

### 1.4 The Warm Fire
- **Trigger:** Tavern L1 construction completes
- **Pages:** 2
- **Image 1:** The Tavern at dusk — light spilling from windows, a sign swinging
- **Text 1:** *"The first keg was tapped before the roof was finished. Word travels fast in desperate lands — a village with a tavern is a village that plans to stay. Heroes began to arrive. Some seeking coin. Some seeking purpose. Some seeking only a place where the war had not yet reached."*
- **Image 2:** Inside the tavern — a fire, mugs, silhouettes of strangers
- **Text 2:** *"A tavern is not just a building. It is a promise. To the road-weary, it says: rest here. To the hopeful, it says: build here. To the village, it says: you are no longer alone. The first stranger walked through the door on the third night. He asked for work. Arthur gave him a chair."*

---

### 1.5 The Discipline
- **Trigger:** First hero reaches Level 5 (gambit slot 2 unlocks)
- **Pages:** 2
- **Image 1:** A hero in training — sweat, practice sword, a moment of clarity
- **Text 1:** *"The hero did not notice it at first. A feint that would have worked yesterday failed today. A blow that should have landed was dodged. Something had changed — not in their muscles, but in their eyes. They were seeing the fight before it happened."*
- **Image 2:** Arthur watching the hero spar, arms crossed, a rare smile
- **Text 2:** *"'You are not swinging harder,' Arthur said. 'You are swinging smarter.' The hero had developed what the old texts call *gambits* — premeditated responses to the chaos of battle. One rule was instinct. Two rules was discipline. The village now had a fighter who could think."*

> **This is the mechanical tutorial moment.** The player is explicitly told that gambits exist and that they should configure them. It transforms a passive unlock into a story beat.

---

### 1.6 The First Spark
- **Trigger:** Elara recruited (first `origin_arcane_initiate` hero from Tavern)
- **Pages:** 3
- **Image 1:** Elara at twilight — singed robes, eyes reflecting something unseen
- **Text 1:** *"She arrived at twilight, her robes singed at the hem, her eyes still reflecting something no one else could see. She did not ask for a room. She asked for a circle. 'I can teach you,' she said to Arthur, 'if you build me a circle.'"*
- **Image 2:** Elara's hands tracing a symbol in the air — a faint glow
- **Text 2:** *"The word she used was not 'magic.' It was 'weave.' She spoke of threads beneath the world, of symbols that remember how to burn, of a language older than swords. Arthur did not understand. But he recognized the look in her eyes — it was the same look he had when he first saw the valley. The look of someone who has found something that cannot be lost."*
- **Image 3:** The village at night, one window glowing with an unnatural light
- **Text 3:** *"That night, the villagers whispered about the light in Elara's window. It was not candlelight. It moved. It breathed. It wrote shapes on the walls that no one could read — except Elara, who smiled for the first time since her arrival. 'Tomorrow,' she said to the dark, 'we begin.'"*

> **This is the bridge to Chapter 2.** It does not force the player to build the Arcane Sanctum. It simply tells them: *"There is another path now. When you are ready, it waits."*

---

### 1.7 Chapter 1 Finale
- **Trigger:** 3 of 4 Chapter 1 milestones achieved
- **Pages:** 2
- **Image 1:** The village from above — small but whole, smoke rising, walls standing
- **Text 1:** *"The village has survived its first trials. Fires burn in hearths. Steel rings in the forge. Strangers have become neighbors. The valley, once a hiding place, is becoming a home. But valleys do not exist in isolation — and this one has been waiting a very long time for someone to listen."*
- **Image 2:** Elara's window, that same glow, but now the village is visible around it
- **Text 2:** *"Elara's light no longer frightens the villagers. They have begun to leave offerings at her door — bread, herbs, questions she answers with riddles. She speaks of a sanctum. Of stones that hum. Of a language written in flame. The village has learned to survive. Now, it must learn to wonder."*

---

## Presentation Catalog: Chapter 2 — "The Flood"

### 2.1 The Language of the World
- **Trigger:** Arcane Sanctum L1 construction completes
- **Pages:** 3
- **Image 1:** The Arcane Sanctum — stones humming, Elara at the center
- **Text 1:** *"The stones of the sanctum hummed when the final brick was laid. Not a sound the ears could hear — a sound the bones could feel. Elara traced a symbol in the air — fire, she called it — and for a moment, the air itself remembered how to burn. The village had built its first church. But the god it prayed to was grammar."*
- **Image 2:** A glyph glowing — the first symbol Arthur ever sees
- **Text 2:** *"'This is not magic,' Elara said, pressing Arthur's finger to the stone. 'This is memory. The world has already burned. We are merely reminding it.' The symbol left a mark on his skin — not a burn, but a warmth that did not fade for three days. He dreamed of fire that night. In the dream, the fire spoke his name."*
- **Image 3:** The first Magic Circle — one Core slot, glowing faintly
- **Text 3:** *"The circle was small. One slot. One symbol. One breath of power. But Elara looked at it as a smith looks at ore — not with reverence, but with anticipation. 'Every spell begins here,' she said. 'Every spell ends here. What happens between is your story. Write carefully. The world reads every word.'"*

---

### 2.2 A Name in Flame
- **Trigger:** First spell inscribed to a hero's Codex
- **Pages:** 2
- **Image 1:** The circle flaring — glyphs aligning, light spilling outward
- **Text 1:** *"The circle flared, the glyphs aligned, and for the first time, a spell existed that had never existed before. Elara smiled — rare for her. 'You have written your first word in the language of gods,' she said. 'It is a small word. A simple word. But it is yours, and no one can unwrite it.'"*
- **Image 2:** The hero's face — uncertain, awed, slightly afraid
- **Text 2:** *"The hero — it does not matter which one — stared at their hands for an hour afterward. They expected to feel different. Heavier. Older. Instead, they felt only a quiet certainty, like the moment after a door closes and before the lock clicks. Something had changed. Something was still changing. They slept with the Codex under their pillow."*

---

### 2.3 The Veil Thins
- **Trigger:** Witch's Hut L1 construction completes
- **Pages:** 2
- **Image 1:** The Witch — appearing in a half-finished hut, stirring a cauldron that wasn't there yesterday
- **Text 1:** *"The witch did not knock. She simply appeared one morning in the half-finished hut, stirring a cauldron that had not been there the night before. 'Your mages glow,' she said. 'I read glows.' She did not offer a name. She offered only readings — cryptic, poetic, and, to the frustration of the logical, always true."*
- **Image 2:** A hero's palm — lines of light beneath the skin, the Witch peering at it
- **Text 2:** *"'The threads are weaving,' she told one hero. 'The pattern is there, but faint. Cast more. Feel more. The circle will widen when it is ready.' The hero asked how much longer. The witch laughed — a sound like dry leaves. 'Longer is not the word,' she said. 'Sooner is not the word. Ready is the word. You are not ready. But you are becoming.'"*

---

### 2.4 The World Opens
- **Trigger:** Explorer Guild L1 construction completes
- **Pages:** 2
- **Image 1:** The Explorer Guild — maps unrolled, scouts commissioning, the horizon visible through a window
- **Text 1:** *"The guild charter was signed with mud instead of wax, but the meaning was the same: this village no longer hid. Maps were unrolled, scouts were commissioned, and the horizon became a destination. The valley had been a sanctuary. Now it was a base. The difference is subtle, but it changes everything."*
- **Image 2:** A map on a table — new regions sketched in, old ones crossed out
- **Text 2:** *"Arthur stared at the map for a long time. He had walked every inch of the valley, but the map showed paths he had never seen. 'The valley is larger than it looks,' the head scout said. 'Or perhaps we are smaller than we think.' Arthur did not answer. He placed a stone on the map — a marker, a promise, a warning. 'Here,' he said. 'We go here next.'"*

---

### 2.5 Chapter 2 Finale
- **Trigger:** 3 of 5 Chapter 2 milestones achieved
- **Pages:** 2
- **Image 1:** The village at night — multiple windows glowing with different colored lights (fire, water, storm)
- **Text 1:** *"The village no longer sleeps in darkness. Windows glow with colors that have no names in the old tongue. The smith and the mage argue at the tavern — not with anger, but with the joy of people who have finally found something worth disagreeing about. The valley has taught them its language. They are beginning to answer back."*
- **Image 2:** A rift in the sky above the valley — faint, distant, watching
- **Text 2:** *"But the valley is not the only thing listening. On the night the third spell was inscribed, a scout reported a light in the high peaks — not starlight, not moonlight, something that moved when it should not move. Elara closed her eyes. 'The circle is no longer a toy,' she said. 'It is a weapon. And weapons attract attention.' The village had learned to wonder. Now it must learn to fight wonders."*

---

## The Chronicle — A Living History of Your Village

> **Companion Feature:** A dedicated page (like the Codex) that displays all chapter presentations as **milestones** — both seen and unseen. Accessible from the top navigation bar, right of the Codex button.

### Why It Exists

Without the Chronicle, a player who builds the Farm in Chapter 2 has no way to know:
- That a presentation was queued
- That it belongs to "Chapter 1's story"
- What other moments they might have missed

The Chronicle solves this by making the player's **unique narrative path visible**.

### What It Shows

- **Chapters as sections** — "Chapter 1 — The Spark", "Chapter 2 — The Flood"
- **Milestone rows** — each presentation is a row with a status:
  - ✅ **Seen** — title revealed, day completed shown, 📖 See Again button
  - 🔒 **Locked** — title hidden (`???`), trigger hint shown (*"Requires: Build Farm L1"*)
  - 🆕 **Pending** — title revealed, "Will play next day" indicator
- **Simple count per chapter** — `X/Y` (seen / total)
- **Recently Unlocked** — top section showing the 3 most recently seen milestones

### Replay — "See Again"

Every seen milestone has a **📖 See Again** button. Clicking it opens the **exact same multi-page presentation modal** the player saw when it first unlocked — images, text, dots, everything. A small **"Replay"** badge appears so the player knows they've experienced this before.

This is not a summary. It is the **full moment**, re-experienced.

### Design Philosophy

- **No shaming:** Locked milestones are shown with curiosity, not guilt.
- **Hints, not spoilers:** Locked entries show the trigger hint but not the title.
- **Always accessible:** Even a brand-new player can open the Chronicle. Nothing is hidden.
- **Your story, your pace:** The Chronicle adapts to the player's unique path.

> **Technical details:** See Implementation Plan 11.

---

## How It Works

### Core System

The technical machinery — data catalog, trigger evaluation, queue system, multi-page modal, state persistence, and i18n wiring — is fully specified in:

> **Implementation Plan 10:** `implementation_plans/10_Chapter_Presentation_System.md`

### Chronicle UI

The companion page — milestone list, replay, navigation — is specified in:

> **Implementation Plan 11:** `implementation_plans/11_The_Chronicle.md`

---

## At a Glance

| Mechanic | Behavior |
|----------|----------|
| **Trigger** | Building completion, mission completion, hero recruitment, first-time events, chapter milestones |
| **Queue** | Presentations queue up and play sequentially at safe moments (after day resolution, before daily report) |
| **Format** | 1–4 pages. Each page: one image + one block of text. Manual advance. Skip always available. |
| **Persistence** | `seenPresentations` (with `daySeen`) per save slot. Seen once, never shown again. |
| **Images** | Phase 1 uses existing assets (hero portraits, building icons, backgrounds). Phase 2 adds targeted art. |
| **Chronicle** | Optional companion page. See Implementation Plan 11. |

### Relationship to Unlock Narratives

Presentations and Unlock Narratives coexist:

- **Unlock Narratives** → lightweight toasts for ambient discovery (first expedition, first raid, region found)
- **Presentations** → heavyweight multi-page moments for story beats (prologue, meeting Elara, chapter finales)

No existing system is replaced. The prologue modal is simply refactored into the generic Presentation modal.

---

## Why This Works

1. **It respects the player's time.** Skip is always available. Presentations are for players who want lore; grinders can bypass them.

2. **It scales indefinitely.** New chapters = new presentations = new triggers. The framework does not change.

3. **It makes the game feel authored.** Not "a village management game with RPG elements" but **"a story about a village that happens to be managed."**

4. **It gives context to mechanics.** Building the Farm is not just +4 grain/day. It is "the first seeds were planted before the walls were up." The mechanic stays the same. The feeling changes.

5. **It solves the retention cliff.** The Day 15–30 "magic is weak" problem becomes a **story beat**: *"The circle was small. One slot. One symbol. One breath of power. But Elara looked at it as a smith looks at ore — not with reverence, but with anticipation."* The player endures the weak early magic because the narrative tells them **it is supposed to grow**.
