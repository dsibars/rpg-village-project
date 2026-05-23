# Hero Skills Data

This is the master registry for **physical skill families** used by the Physical Skill System.

> **Note:** Magic spells (fire, water, wind, storm, heal, haste) have been moved to the [Magic Circle System](magic_circle_system.md). They are no longer part of the hero skills registry.

---

## Physical Skill Families

| Family ID | Display Name | Tier 1 Effect | Category | Stat |
| :--- | :--- | :--- | :--- | :--- |
| `single_strike` | Basic Attack | 1 hit, 1.0× STR | physical | strength |
| `multiple_attack` | Multiple Attack | 2 hits, 0.70× STR each | physical | strength |
| `power_strike` | Power Strike | 1 hit, 1.5× STR | physical | strength |
| `cleave` | Cleave | 1 hit, 0.75× STR, 2 adjacent | physical | strength |
| `shield_bash` | Shield Bash | 1 hit, 0.8× STR + stun chance | physical | strength |
| `poison_strike` | Poison Strike | 1 hit, 0.6× STR + poison | physical | strength |
| `steal` | Plunder | 1 hit, 0.5× STR + loot chance | physical | strength |

---

## Family Definitions

### single_strike — Basic Attack

The foundational technique every hero knows from birth. Costs nothing. Always available.

```javascript
{
    id: 'single_strike',
    baseMult: 1.0,
    growth: 0.0,
    hits: 1,
    hitDecay: 0,
    staminaCost: 0,
    targetType: 'single_enemy'
}
```

> **Not learnable.** All heroes have this from level 1. It does not consume a family slot.

---

### multiple_attack

The striker's bread and butter. Each tier adds one more hit. Total damage grows, but efficiency per STA slowly declines.

```javascript
{
    id: 'multiple_attack',
    baseMult: 0.7,
    growth: 0.0,
    hits: 1,        // Tier N = N+1 hits. Tier 1 = 2 hits.
    hitDecay: 0.05, // Each subsequent hit loses 5% damage
    staminaCostBase: 8,
    staminaCostPerTier: 3,
    targetType: 'single_enemy'
}
```

**Scaling:** Tier 1 = 2 hits. Tier 7 = 8 hits. Tier 12 = 13 hits.

---

### power_strike

The warrior's nuke. Pure single-target destruction. Each tier adds 0.3× STR.

```javascript
{
    id: 'power_strike',
    baseMult: 1.5,
    growth: 0.3,    // +0.3× STR per tier
    hits: 1,
    hitDecay: 0,
    staminaCostBase: 8,
    staminaCostPerTier: 4,
    targetType: 'single_enemy'
}
```

**Scaling:** Tier 1 = 1.5× STR. Tier 5 = 2.7× STR. Tier 10 = 4.2× STR.

---

### cleave

The crowd controller. Starts hitting 2 adjacent enemies. At higher tiers, hits more targets.

```javascript
{
    id: 'cleave',
    baseMult: 0.75,
    growth: 0.1,
    hits: 1,
    hitDecay: 0,
    staminaCostBase: 8,
    staminaCostPerTier: 4,
    targetType: 'all_enemies'  // Tier 1 = 2 adjacent, Tier 5+ = all enemies
}
```

---

### shield_bash

Control and disruption. Each tier improves stun chance and slightly increases damage.

```javascript
{
    id: 'shield_bash',
    baseMult: 0.8,
    growth: 0.1,
    hits: 1,
    hitDecay: 0,
    effect: 'stun',
    staminaCostBase: 8,
    staminaCostPerTier: 3,
    targetType: 'single_enemy'
}
```

---

### poison_strike

Damage over time. The poison damage scales with tier.

```javascript
{
    id: 'poison_strike',
    baseMult: 0.6,
    growth: 0.05,
    hits: 1,
    hitDecay: 0,
    effect: 'poison',
    staminaCostBase: 8,
    staminaCostPerTier: 2,
    targetType: 'single_enemy'
}
```

---

### steal (Plunder)

The rogue's gambit. Less damage, but every strike has a chance to yield loot.

```javascript
{
    id: 'steal',
    baseMult: 0.5,
    growth: 0.05,
    hits: 1,
    hitDecay: 0,
    effect: 'loot',
    staminaCostBase: 8,
    staminaCostPerTier: 2,
    targetType: 'single_enemy'
}
```

**Loot Table (by tier):**

| Tier | Loot Chance | Possible Drops |
|------|-------------|----------------|
| 1 | 15% | 5-15 gold |
| 3 | 25% | 10-30 gold, tiny HP potion |
| 5 | 35% | 20-50 gold, consumables |
| 8 | 50% | 30-80 gold, equipment (low tier) |
| 12 | 70% | 50-150 gold, equipment (mid tier), rare consumables |

> **The warrior trades damage for economy.** A party with a Plunder specialist funds itself.

---

## Stamina Cost Reference

| Family | Base | Per Tier | Example (Tier 6) |
|--------|------|----------|------------------|
| Basic Attack | 0 | 0 | 0 STA |
| Multiple Attack | 8 | +3 | 26 STA |
| Power Strike | 8 | +4 | 32 STA |
| Cleave | 8 | +4 | 32 STA |
| Shield Bash | 8 | +3 | 26 STA |
| Poison Strike | 8 | +2 | 20 STA |
| Plunder | 8 | +2 | 20 STA |

---

## Tier Threshold Formula

To reach **Tier N** from Tier 1:

```
usesRequired = 100 × 3^(N-2)
```

| Tier | Uses | Approx. Battles (20 uses/battle) |
|------|------|----------------------------------|
| 2 | 100 | ~5 |
| 3 | 300 | ~15 |
| 4 | 900 | ~45 |
| 5 | 2,700 | ~135 |
| 7 | 24,300 | ~1,215 |
| 10 | 656,100 | ~32,800 |
| 12 | 5,904,900 | ~295,000 |
