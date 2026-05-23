# Hero Skills Specification

## Overview

Heroes have **two completely separate combat systems**:

1. **Physical Skills** — Stamina-based techniques that scale infinitely via usage. See [Physical Skill System](physical_skill_system.md).
2. **Magic Spells** — MP-based spells composed from Glyphs on a Magic Circle. See [Magic Circle System](magic_circle_system.md).

A hero can specialize in either, or become a **Hybrid** through [Body Inscription](hybrid_body_inscription.md) (late game).

---

## Physical Skills

### How They Work

- All heroes start with **Basic Attack** (single_strike family) — free, 0 STA, always available.
- At **level 1**, the player chooses **one additional family** from the pool (Multiple Attack, Power Strike, Cleave, Shield Bash, Poison Strike, Plunder).
- Additional families unlock at level milestones (5, 10, 15, 20, 25) via **Skill Points**.
- Once a family is learned, it starts at **Tier 1 (×2)**.
- Using the family in combat builds a **hidden usage counter**.
- When the counter reaches the threshold, the family silently tiers up.
- **No maximum tier.** A level 300 warrior could have Multiple Attack ×13.

### Combat Integration

In combat, the hero's action bar shows:

```
[Basic] [Skills] [Magic] [Item] [Flee]
```

Tapping **Skills** shows known families. Tapping a family shows tiers:

```
[×13]  ← Most Powerful (highest tier)
[...]  ← Expand: all tiers
[×2]   ← Weakest (conserve STA)
```

Each tier displays its Stamina cost. Grayed out if insufficient stamina.

---

## Magic Spells

Magic is **not part of the skills system**. It lives in the Magic Circle:

- Heroes learn **Glyphs** (permanent knowledge).
- Glyphs are arranged on a **concentric circle** interface.
- Compositions are saved to the hero's **Spell Codex** (max 6 spells).
- Spells cost **MP**, not Stamina.
- Magic Tier unlocks more circle slots (1 slot per tier, up to 25).

See [Magic Circle System](magic_circle_system.md) for full details.

---

## Hybrid: Body Inscription

Late-game heroes who have mastered **both** systems can fuse them:

- Requires: Magic Tier 7 + 12 Skill Tier Points.
- A **Body Circle** (7 slots) is inscribed permanently on the hero.
- Physical skills now cost **Stamina + MP** and gain magic effects.
- Example: A Fire Body Circle adds fire damage to every physical hit.

See [Hybrid Body Inscription](hybrid_body_inscription.md) for full details.

---

## Data Model

### Hero Fields

```javascript
{
    // Physical skills
    techniqueTiers: { multiple_attack: 4, power_strike: 2 },  // family → tier
    techniqueUses: { multiple_attack: 1250, power_strike: 80 }, // family → uses
    skillPoints: 1,  // available points to spend on new families
    knownFamilies: ['single_strike', 'multiple_attack', 'power_strike'], // max 6

    // Magic
    magicXp: 0,
    magicTier: 1,
    knownGlyphs: ['core_fire', 'power_plus'],
    spellCodex: [...], // max 6 spells

    // Hybrid
    bodyInscription: null, // or [{glyphId, slot}, ...]
}
```

> **Note:** The old `hero.skills: { skillId: level }` format (individual skills with levels 0-5) is deprecated. It has been replaced by the family-based `techniqueTiers` system.

---

## Three Archetypes

| | Pure Warrior | Pure Mage | Hybrid |
|---|---|---|---|
| **Resource** | Stamina | MP | Stamina + MP |
| **Damage** | Sustained, spammable | Burst, limited | Extreme burst, doubly taxed |
| **Best for** | Long fights | Control, healing, AoE | Deleting waves |
| **Weakness** | No magic utility | Physically weak | Resource-hungry |
