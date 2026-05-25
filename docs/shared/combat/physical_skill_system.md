# Physical Skill System Specification

## Overview

Physical skills are **core combat techniques** that heroes unlock as they level up. Each skill belongs to a **family** that scales **infinitely** through hidden usage. No fancy names — just **×2, ×3, ×4...** A level 300 warrior's "Multiple Attack" might be **×13**. Simple. Brutal. Effective.

> **Status:** Active Design — Partially Implemented.  
> **Related Docs:** [Hero Skills Data](hero_skills_data.md), [Magic Circle System](magic_circle_system.md), [Hybrid Body Inscription](hybrid_body_inscription.md)

---

## Core Philosophy

### Physical Must Compete With Magic

A level 300 mage with 25 Glyph slots casts world-ending spells. A level 300 warrior with Tier 12 "Multiple Attack" hits **13 times in one turn**. Both should feel godlike.

| | Physical | Magic |
|---|---|---|
| **Resource** | **Stamina** (recovers fast) | **MP** (limited, slow regen) |
| **Scaling** | Infinite tiers via usage | 25 slots, Glyph mastery |
| **Style** | Sustained violence | Burst + utility |
| **Endgame** | ×13 attack, 0 cooldown | 25-slot apocalypse spell |

> **Neither is better.** Physical grinds forever. Magic explodes then rests. Both kill everything.

---

## Skill Families

A hero can know up to **6 families**. Each family is a **single concept** that scales infinitely. The name never changes. Only the multiplier grows.

| Family | Tier 1 Effect | Scaling Philosophy |
|--------|-------------|-------------------|
| **Basic Attack** | 1 hit, 1.0× STR | Always available. Costs 0 STA. Not a learnable family. |
| **Multiple Attack** | 2 hits, 0.70× STR each | **+1 hit per tier.** Damage/hit decreases slightly. Total damage grows slowly but efficiently. |
| **Power Strike** | 1 hit, 1.5× STR | **+0.3× STR per tier.** The warrior's "nuke." |
| **Cleave** | 1 hit, 0.75× STR, 2 adjacent | More targets at higher tiers. AoE efficiency. |
| **Shield Bash** | 1 hit, 0.8× STR + stun chance | Better stun chance, slightly more damage. Control focus. |
| **Poison Strike** | 1 hit, 0.6× STR + poison | Poison damage scales. DoT efficiency. |
| **Plunder** *(new)* | 1 hit, 0.5× STR + loot chance | Better loot chance (coins, potions, gear) at higher tiers. Less damage, more reward. |

> **Physical does NOT try to match magic burst.** A Tier 12 Multiple Attack does ~3.5× total STR. A 25-slot mage spell does ~15× MAG. But the warrior can attack 10× more often. **Efficiency wins the marathon.**

---

## Unlocking Families

### Level 1 — First Choice

Every hero starts with **Basic Attack** (single_strike family) unlocked for free.

At **level 1**, the player chooses **one additional family** from the pool:
- Multiple Attack
- Power Strike
- Cleave
- Shield Bash
- Poison Strike
- Plunder

The chosen family starts at **Tier 1 (×2)** immediately.

### Skill Points — More Families

As the hero levels up, they earn **Skill Points** at fixed milestones. Each Skill Point allows unlocking **one additional family**.

| Skill Point | Level Milestone |
|-------------|----------------|
| 1st | Level 1 (initial choice) |
| 2nd | Level 5 |
| 3rd | Level 10 |
| 4th | Level 15 |
| 5th | Level 20 |
| 6th | Level 25 |

> **Max 6 learnable families per hero.** Hard choices. Specialization matters.

### Unlocking Flow

1. Hero reaches a milestone level.
2. A notification appears: *"[Hero] has gained a Skill Point! Choose a new technique."*
3. Player opens the hero's skill panel.
4. Selects an available (locked) family.
5. Family is immediately learned at Tier 1.

> **No building required.** No trainer. No gold cost. Just level up and choose.

---

## Infinite Tiers

### Exponential Cost

| To Reach Tier | Uses Required | What It Means |
|--------------|---------------|---------------|
| 2 (×3) | ~100 | A few battles |
| 3 (×4) | ~400 | Several expeditions |
| 5 (×6) | ~4,000 | Main skill for a chapter |
| 7 (×8) | ~36,000 | Mastery |
| 10 (×11) | ~1,000,000 | Mythic |
| 12 (×13) | ~9,000,000 | Level 300 life's work |
| 15 (×16) | ~243,000,000 | Probably unreachable |

> **Formula:** Tier N requires `100 × 3^(N-2)` uses. Tier 12 is months. Tier 20 is fiction.

### Tier Unlocks Automatically

### Tier Unlocks Automatically

- The player sees a **visible progress bar** (visual only, no exact numeric ratio).
- Why? Anticipation is a core engagement loop, but hiding the exact numbers prevents mindless grinding while still allowing players to strategically assign heroes to optimize tier-ups before difficult battles.
- Upon reaching the threshold, the skill upgrades silently in the background, but the UI provides a **"Tier Up!" flash animation** when the menu is opened.

---

## Stamina System

Physical skills cost **Stamina**, not MP.

| Aspect | Value |
|--------|-------|
| **Max Stamina** | `STR × 3 + DEF × 2 + Level × 2` |
| **Regen per turn** | `Max × 8%` |
| **Between battles** | Full restore |
| **At village** | Full restore |

### Stamina Cost Formula

```
Base Cost = 8
+ (Tier × 3) for Multiple Attack
+ (Tier × 4) for Power Strike
+ (Tier × 3) for Shield Bash
+ (Tier × 2) for Poison Strike
+ (Tier × 4) for Cleave
+ (Tier × 2) for Plunder
```

**Example:** Tier 6 Multiple Attack = 8 + (6 × 3) = **26 STA**.

> **Basic Attack costs 0 STA.** Always available as fallback.

---

## Combat UI: The Submenu System

### Hero Turn Flow

```
┌─ Hero Turn ───────────────────────────┐
│ [Attack] [Skills] [Magic] [Item] [Flee]│
└───────────────────────────────────────┘

→ Tap [Skills]

┌─ Skills Menu ─────────────────────────┐
│ [Multiple Attack] [Power Strike]       │
│ [Shield Bash]     [Cleave]            │
│ [Poison Strike]   [Plunder]           │
│ [— Empty —]       [— Empty —]         │
└───────────────────────────────────────┘

→ Tap [Multiple Attack]

┌─ Multiple Attack ─────────────────────┐
│ [×13]  ← Most Powerful (highest tier) │
│ [...]  ← Expand: all tiers in between │
│ [×2]   ← Weakest (base, conserve STA) │
└───────────────────────────────────────┘

→ Tap [...]

┌─ All Tiers ───────────────────────────┐
│ [×13] [×12] [×11] [×10] [×9]         │
│ [×8]  [×7]  [×6]  [×5]  [×4]         │
│ [×3]  [×2]                           │
└───────────────────────────────────────┘
```

### The Three Quick Slots (Alternative / Future)

Instead of submenus, dedicate **3 skill buttons** in combat:

| Slot | Default | Behavior |
|------|---------|----------|
| **Left** | Most Used tier | The tier this hero uses most often (auto-detected) |
| **Center** | Most Powerful | Highest unlocked tier |
| **Right** | Weakest | ×2, for conserving stamina |

> **Start with the submenu system.** The 3-slot shortcut is a quality-of-life upgrade for later.

### Stamina Display

Each tier shows its **Stamina cost**:

```
┌─ Multiple Attack ─────────────────────┐
│ [×13]        45 STA                  │
│ [...]                                │
│ [×2]          8 STA                  │
└───────────────────────────────────────┘
```

> Grayed out if insufficient stamina.

---

## Skill Tier Points (for Hybrid Unlock)

Used for [Body Inscription](hybrid_body_inscription.md).

| Formula | Points |
|---------|--------|
| **Skill at Tier N = (N + 1) points** | — |

| Example | Tier | Points |
|---------|------|--------|
| Multiple Attack | Tier 4 | **5** (4 + 1) |
| Power Strike | Tier 2 | **3** (2 + 1) |
| Shield Bash | Tier 12 | **13** (12 + 1) |

**Hybrid threshold: 12 points.**

---

## Technique Codex

Max 6 families. Unlimited tiers per family.

- **Retrain:** Replace a family. Resets tier to 1.
- **Cost:** Gold + 3 days locked.

---

## Hero Detail Panel: Skills Section

```
┌─ Skills (3 / 6) ──────────────────────┐
│                                       │
│  ✦ Multiple Attack  ×4   18 STA      │
│     [========░░░░░░] Tier 4           │
│                                       │
│  ✦ Power Strike     ×2   16 STA      │
│     [====░░░░░░░░░░] Tier 2           │
│                                       │
│  ✦ Basic Attack     ×1    0 STA      │
│     (always available)                │
│                                       │
│  ── Locked ─────────────────────────  │
│  🔒 Cleave         (Lv 5 to unlock)  │
│  🔒 Shield Bash    (Lv 5 to unlock)  │
│  🔒 Poison Strike  (Lv 5 to unlock)  │
│  🔒 Plunder        (Lv 5 to unlock)  │
│                                       │
│  Skill Points: 0                      │
│  Next at: Level 5                     │
└───────────────────────────────────────┘
```

### Layout Rules

- **Unlocked families** first, sorted by tier (highest first).
- Show **×N tier badge**, **STA cost**, and a **visual progress bar** (no exact ratio) to encourage optimization through anticipation.
- **Locked families** below, grayed out, with level requirement.
- **Skill Points** display if > 0, with a "Spend" prompt.
- **No "Equip/Unequip".** Families are permanent once learned.

---

## Damage Scaling Table (Multiple Attack)

| Tier | Hits | Dmg/Hit | Total Multiplier | STA Cost | Dmg/STA |
|------|------|---------|-----------------|----------|---------|
| 1 (×2) | 2 | 0.70× STR | 1.40× | 10 | 0.140× |
| 3 (×4) | 4 | 0.55× STR | 2.20× | 18 | 0.122× |
| 7 (×8) | 8 | 0.38× STR | 3.04× | 34 | 0.089× |
| 12 (×13) | 13 | 0.27× STR | 3.51× | 54 | 0.065× |

> **The warrior chooses each turn:** "×13 (big, expensive) or ×4 (small, cheap)?" Both are valid. Efficiency vs. burst — within the same skill.

---

## Comparison: Physical vs. Magic (Endgame)

| | Level 300 Warrior | Level 300 Mage |
|---|---|---|
| **Signature** | Multiple Attack ×13 (13 hits) | 25-slot annihilation spell |
| **Resource** | Stamina (spammable) | MP (limited) |
| **Sustain** | ♾️ Infinite turns | ⚠️ 3-4 big spells |
| **Burst** | 13 × 0.4× STR = 5.2× STR total | 15× MAG in one nuke |
| **Feel** | *"I am the storm."* | *"I am the apocalypse."* |

> **Both kill everything.** The warrior grinds. The mage explodes. Pick your god.

---

## Design Decisions (Locked)

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Basic Attack costs 0 STA** | Already canon. Always-available fallback. |
| 2 | **All tiers shown in submenu** | No pagination. A Tier 12 hero sees 12 buttons. Manageable. |
| 3 | **Damage per hit uses diminishing returns** | Total damage grows, but efficiency (dmg/STA) slowly decreases. High tiers feel powerful without being strictly better in all situations. See damage scaling table. |

## Future Considerations

- **Stamina potions:** Consumables that restore STA mid-combat. Not yet designed.
- **Three quick slots:** Alternative combat UI with 3 preset tier buttons (most used, most powerful, weakest). QoL upgrade for later.
