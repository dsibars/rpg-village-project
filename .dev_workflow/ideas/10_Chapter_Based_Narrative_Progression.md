# Idea: Chapter-Based Narrative Progression

> **Status:** Design Proposal  
> **Scope:** Narrative framing layer — no new mechanics, repackages existing systems into narrative arcs.  
> **Goal:** Transform the "endless grind" feeling into a journey with continuity, context, and memorable phases.

---

## The Problem

The core loop is robust — combat, magic, village, expeditions, gambits — but it lacks **narrative context**. The player does things because they are optimal, not because they are meaningful. There is no sense of "I just finished the first arc of my story." The game risks feeling like an incremental spreadsheet with combat vignettes.

The existing systems already create natural phases:
- Days 1–12: physical survival, founding, first heroes
- Days 12–40: magic discovery, deeper exploration, spellcrafting

But these phases are invisible to the player. They are not celebrated, named, or given emotional weight.

---

## The Idea: Two Chapters

Instead of an endless day counter, the player's journey is framed as **Chapters** — narrative arcs that give meaning to mechanical milestones. Each chapter has a theme, a set of milestones, and a transition moment.

> **Critical design principle:** Chapters are **narrative framing**, not progression gates. A player who ignores magic is not blocked. The game gently nudges through narrative toasts, not hard requirements.

---

## Chapter 1: "The Spark"

> *"In a world consumed by war, a small group of survivors fled to a hidden valley. They did not know if the valley would save them — or bury them."*

### Theme
Survival, steel, and the first fire. The village is fragile. Every building matters. Heroes are few. Combat is physical, brutal, and intimate.

### Core Mechanics in Play
- Physical skills and Basic Attack
- Gambits (unlocked at Lv5)
- Village construction (Farm, Tavern, Blacksmith, Infirmary)
- 2-hero parties
- Defense against early raids
- Daily objectives

### Narrative Beats (Existing + Proposed)

| Day | Beat | Existing System |
|-----|------|-----------------|
| 1 | **The Landing** — Prologue, Tutorial Cave | `initialization.md` + `exp_tutorial_cave` |
| 3–5 | **A Shield in the Dark** — Rescue Sir Valen | `exp_rescue_mission` + `nar_sir_valen_joins` |
| ~5 | **Awakening** — First gambit slot unlocks | `nar_first_skill_slot` |
| ~7 | **The Hammer at the Gate** — First raid event | `nar_defense_first_raid` |
| ~10 | **A Warm Fire** — Tavern built, heroes begin arriving | `nar_tavern_built` |
| ~12 | **The First Spark** — Elara arrives, speaks of magic | `nar_elara_arrives` |

### Chapter 1 Milestones (Soft Completion)
The chapter "completes" when the player achieves **any 3 of these 4**:

1. ✅ Built the **Tavern** (proves the village is a permanent settlement)
2. ✅ Recruited **at least 3 heroes** total (Arthur + Valen + one from Tavern)
3. ✅ Completed **at least 2 expeditions** with a party of 2+ heroes
4. ✅ Survived **at least 1 raid** with 1+ defenders assigned

When 3/4 are met, a **chapter transition narrative** fires:

> *"The village has survived its first trials. Fires burn in hearths. Steel rings in the forge. But the valley is older than the village — and it has been waiting."*

This is **not a gate**. The player can continue building, fighting, and exploring exactly as before. The toast simply says: *"You have grown. Something new awaits when you are ready."*

---

## Chapter 2: "The Flood"

> *"Magic is not myth. It is the language of the valley itself. And the valley has begun to speak."*

### Theme
The valley reveals its true nature. Magic is real, hungry, and beautiful. The village shifts from surviving to **understanding**.

### Core Mechanics in Play
- Magic Circle and spell composition
- Glyphs and Glyph mastery
- Witch's Hut (hidden progress divination)
- Glyph Academy (teaching and design library)
- Elemental combat efficiency
- 3-4 hero parties
- Concurrent expeditions (Explorer Guild L2)
- Dark Forest, Mystic Ruins, Frozen Peaks

### Narrative Beats (Existing + Proposed)

| Day | Beat | Existing System |
|-----|------|-----------------|
| ~15 | **The Language of the World** — Arcane Sanctum built, Magic Circle unlocks | `nar_magic_circle_unlocked` |
| ~15–20 | **A Name in Flame** — First spell composed and cast | `nar_first_spell_composed` |
| ~18 | **The Veil Thins** — Witch's Hut built | `nar_witch_hut_built` |
| ~20 | **The World Opens** — Explorer Guild built, advanced expeditions | `nar_explorer_guild_built` |
| ~25–30 | **The Exchange of Flame** — Academy L1 (Arcane Sanctum L2) | `nar_academy_unlocked` |
| ~35 | **Echoes of the Magi** — Mystic Ruins unlocked | `nar_mystic_ruins_found` |

### Chapter 2 Milestones (Soft Completion)
The chapter "completes" when the player achieves **any 3 of these 5**:

1. ✅ Built **Arcane Sanctum L2** (Academy — proves magical investment)
2. ✅ Composed **at least 3 unique spells** across the roster
3. ✅ Explored **at least 5 unique regions**
4. ✅ A hero has reached **Magic Tier 4+** (Core + 3 complementary slots)
5. ✅ Defeated **at least 1 boss** in combat

When 3/5 are met, a **chapter transition narrative** fires:

> *"The circle is no longer a toy. It is a weapon. And weapons attract attention. The valley has shown you its language — now it wants to know if you are worthy to speak it."*

This foreshadows Chapter 3 (hybrid mastery, deeper regions, astral plane) without implementing it.

---

## How It Appears in the Game

### 1. Chapter Badge (Subtle, Persistent)
A small chapter indicator in the header bar:

```
[🏘️ Village]  [⚔️ Heroes]  ...          Chapter 1: The Spark  |  Day 12
```

On mobile, this collapses to just the chapter icon + number.

### 2. Milestone Hints (Narrative Nudges)
When the player is close to a chapter milestone, the **daily report** includes a poetic hint:

> *"The tavern fire burns bright. Travelers speak of this village in the valley. You are close to something... permanent."* (2/3 milestones met)

### 3. Chapter Transition Toast (Celebration)
When milestones are achieved, a special narrative overlay plays:
- Full-screen glassmorphism overlay
- Chapter title + lore text
- List of milestones achieved
- Fade out after 8 seconds or click to dismiss
- **Does not pause gameplay** — it is a toast, not a modal

### 4. Save Slot Summary Enhancement
Save slots currently show: Day, Heroes, Highest Level, Regions.

Add: **Current Chapter**
```
Slot 2  |  Chapter 2: The Flood  |  Day 34  |  6 Heroes  |  Lv 12
```

This immediately tells the player (and their future self) where they are in the journey.

### 5. Codex Integration
The Codex already has eras:
- Era I → maps to **Chapter 1**
- Era II → maps to **Chapter 2**
- Era III-IV → reserved for future chapters

Add a **Chapters** tab to the Codex that shows:
- Current chapter
- Milestones achieved / remaining
- Lore text for each chapter
- Unlocked in gray, locked milestones with hints

---

## Integration with Existing Systems

This idea uses **only existing systems**. No new mechanics are needed.

| Existing System | How Chapters Use It |
|-----------------|---------------------|
| **Unlock Narratives** | Chapter transitions are special unlock narratives (`nar_chapter_1_complete`, `nar_chapter_2_complete`) |
| **UnlockService** | Milestone checks piggyback on `UnlockService.checkAllUnlocks()` — chapter predicates are just another set of unlocks |
| **Codex** | Chapter tab added to existing Codex UI |
| **Daily Report** | Milestone hints and chapter transition narratives flow through the existing `newNarratives` array |
| **Save Slots** | Chapter string added to slot summary metadata |
| **Buildings** | Tavern and Arcane Sanctum are already chapter gatepost buildings |
| **Hero Recruitment** | Hero count is already tracked |
| **Expedition System** | Region clears and expedition completion are already tracked |

---

## What This Solves

| Problem | How Chapters Fix It |
|---------|---------------------|
| **"Endless grind" feeling** | Chapters create natural arcs with beginnings, middles, and ends. The player feels "I finished Chapter 1" instead of "I'm on Day 100 and nothing has changed." |
| **Day 15–30 retention cliff** (magic feels weak) | Chapter 2 framing tells the player: *"This is the discovery phase. Magic starts small and grows. That is the point."* The narrative gives context to the weakness. |
| **Optimal but meaningless decisions** | Building the Tavern is no longer just "optimal" — it is "completing the settlement arc." Building the Arcane Sanctum is "entering the mystical arc." |
| **Save slot ambiguity** | "Chapter 2, Day 34" tells a story. "Day 34" does not. |
| **Feature overwhelm** | New players see 10+ systems at once. Chapters suggest: "Focus on these 4 systems first. The rest comes in Chapter 2." |

---

## Why Only Two Chapters (For Now)

The existing docs already define Era III (The Web) and Era IV (The Infinite), which map naturally to Chapter 3 and Chapter 4. But:

- **Body Inscription** is not yet implemented
- **Astral Plane** is endgame content most players will never reach in a first playthrough
- Two chapters cover the first ~40 days, which is the critical retention window

Adding Chapter 3+ is trivial once the framework exists. The hard part is designing the **framework** (milestone predicates, transition narratives, UI badges). The content (milestones for Chapter 3, 4, 5...) is just data entry.

---

## Open Questions

1. **Should chapters be per-save or per-hero?** Per-save feels right — the village has the journey, not individual heroes.
2. **Can a player "regress" a chapter?** No. Chapters are one-way narrative markers. Even if the village burns (raid defeat), the story has been told.
3. **Should chapter transitions grant rewards?** Lean toward **no** — the reward is the narrative moment itself. Adding gold/loot cheapens it. However, a cosmetic reward (new header background color, chapter badge on heroes) could work.
4. **What if a player rushes Arcane Sanctum on Day 5?** The chapter transition still fires when milestones are met. Early magic just means Chapter 2 starts early. The system adapts to player pace.
5. **Should the prologue be "Chapter 0" or part of Chapter 1?** Part of Chapter 1. The prologue IS the landing — it is not separate from the arc.

---

## Future Expansion (Not Now)

- **Chapter 3: "The Web"** — Hybrid mastery, Body Inscription, concurrent expeditions, Forgotten Ruins. Theme: "Muscle and magic are not opposites. They are threads in the same weave."
- **Chapter 4: "The Infinite"** — Astral Plane, Tier 25 mages, legendary equipment, endgame roster management. Theme: "The valley was never the destination. It was the threshold."
- **Chapter-specific achievements** — "Finish Chapter 1 in under 10 days" (speedrun recognition)
- **New Game+** — Start a new save at Chapter 2 with knowledge from Chapter 1
