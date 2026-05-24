# Magic Circle UI Refactor — Design Spec (v2)

## Status: Draft — Ready for UX Implementation

> **⚠️ FOR THE UX IMPLEMENTER:** Before touching any code, read [`docs/shared/combat/magic_circle_system.md`](../shared/combat/magic_circle_system.md). This document explains what the Magic Circle *represents* — Glyphs as learned drawings, tiers as drawing mastery, the mandala as a living ritual. Understanding the soul of the system will lead to better UX decisions than copying mechanics blindly.

---

## 0. What the Magic Circle Actually Is

This section exists because the UI is not a spreadsheet — it is a **magical ritual interface**. Every visual decision should be grounded in this fiction.

### Glyphs Are Drawings, Not Resources

A Glyph is **knowledge of a magical drawing**. Once a hero learns "how to draw the Fire Core," they know it forever. Placing a glyph on the mandala does not "consume" it — the hero simply draws that symbol in that slot. You can draw the same symbol multiple times in different slots (if you have the slots).

> **UX implication:** Glyph cards should feel like *knowledge cards* or *sketchbook pages*, not inventory items. No "quantity" indicator. No "used up" state. Just "known / not known."

### Tiers Are Drawing Mastery

When a hero first learns a glyph, they draw it simply — Tier 1 (`+`). Through repeated casting, their hand becomes more confident. They learn to add flourishes, depth, and power. Eventually they can draw the same symbol at Tier 7 (`✶`) — the same *drawing*, but executed with masterful precision.

**Crucially:** A hero who has reached Tier 5 with a glyph can **choose** to draw it at Tier 1, Tier 2, Tier 3, Tier 4, or Tier 5 in any given composition. They are not forced to use max power. A Tier 5 Potentiate costs more MP than Tier 1 — the hero might *want* the cheaper version.

> **UX implication:** Tier selection is not a "level" — it is a **tuning dial**. The hero is adjusting how masterfully they execute this drawing. The UI should feel like tuning, not leveling up.

### The Mandala Is a Living Ritual

The mandala is not a grid. It is a set of **concentric rings** that expand as the hero's Magic Tier grows. New slots don't appear all at once — they "light up" one by one, like ripples. The visual should feel organic, not mechanical.

> **UX implication:** Rings should rotate slowly. Slots should glow when filled. Connection lines should draw themselves between adjacent glyphs. The entire thing should feel alive.

### Static Glyphs Have No Growth — But Still Have Mastery

Some glyphs (Multi, Aegis) are **static** — their effect does not improve with higher tiers. Their `perTier: 0` in the data. But the hero still "masters" them through use; they just cap at Tier 1. The selector shows only `+ (T1)`.

> **UX implication:** Static glyphs should be marked with a small 🔒 or similar indicator, communicating "this drawing is complete — no further mastery needed." Not a bug. A feature.

### Support Spells Invert the Mandala's Polarity

By adding the Aegis glyph, the spell switches from harming enemies to benefiting allies. Every core element produces a different beneficial effect:
- Fire → ATK buff, Water → MP restore, Wind → SPD buff, Storm → Crit buff
- Light → HP heal, Dark → Stamina restore, Earth → DEF buff

> **UX implication:** When Aegis is present, the entire mandala should *feel* different — cooler colors, ally-focused language, heal amounts instead of damage numbers. The polarity shift should be visceral.

---

## 1. Design Philosophy

The magic circle is not a form to fill out. It is a **ritual**. The player is a mage inscribing glyphs onto a living mandala. The UI should feel like that.

**Core principles:**
1. **The mandala dominates the screen.** Everything else is marginal — literally at the margins.
2. **Contextual staging.** Don't show everything at once. Reveal tools only when the player needs them.
3. **Analog, not digital.** Tier tuning is a dial, not a dropdown. Glyph selection is a focused palette, not an overwhelming grid.
4. **Instant readability.** At a glance, the player knows: who am I hurting? How many? How hard? How much does it cost?

---

## 2. Screen States (Staged Flow)

### Stage 0: Overview (Default)

The full mandala fills almost the entire screen. Four thin margins frame it.

```
┌─────────────────────────────────────────────────────────────┐
│  [🔮] Archmage Simulator          ⚔️ 48 DMG  ·  💧 18 MP   │  ← TOP MARGIN
├─────┬───────────────────────────────────────────────┬───────┤
│     │                                               │       │
│ 🔴  │              ◯───◯───◯                        │  👤   │
│     │             /  ╭───╮  \                       │       │
│ FOE │            ◯──│ 🔥 │──◯                       │  1    │
│     │             \  ╰───╯  /                       │       │  ← RIGHT
│     │              ◯───◯───◯                        │       │    MARGIN
│     │                                               │       │
│     │         [mandala fills ~90% of screen]        │       │
│     │                                               │       │
│     │                                               │       │
│     │                                               │       │
├─────┴───────────────────────────────────────────────┴───────┤
│  🔥 Fire  ·  ⚔️ Pierce 30%  ·  🧛 Leech 15%  ·  ████░░ 80%  │  ← BOTTOM
│  [🔮 Inscribe Spell]  [🗑️ Clear]  [❌ Close]               │     MARGIN
└─────────────────────────────────────────────────────────────┘
```

#### Margin Specifications

| Margin | Content | Visual Treatment |
|--------|---------|-----------------|
| **Top** (~60px) | Hero name + spell power + MP cost + budget bar | Semi-transparent dark bar, text left-aligned |
| **Left** (~80px) | Target **polarity** indicator | Vertical strip. 🔴 Red/Orange = **Enemies**. 🟢 Blue/Green = **Allies**. Icon + label rotate 90°. |
| **Right** (~80px) | Target **count** indicator | Vertical strip. 👤 = **Single**. 👥 = **All**. Icon + label rotate 90°. |
| **Bottom** (~80px) | Element + active effects + action buttons | Horizontal strip. Effects as small chips. Buttons anchored right. |

**Left margin detail:**
- Color bleeds subtly into the mandala background (red tint for enemies, blue tint for allies)
- Icon: crossed swords (⚔️) for enemies, heart/leaf (💚) for allies
- Text: "FOE" or "ALLY" rotated vertically

**Right margin detail:**
- Icon: single person (👤) or group (👥)
- Text: "ONE" or "ALL" rotated vertically
- When target is `all_enemies` or `all_allies`, the icon pulses subtly

**Top margin detail:**
- Left: "Magic Circle — {heroName}" with small tier badge
- Center-right: `{damage} DMG` or `{heal} HEAL` (switches based on category)
- Right: `{mpCost} MP` + thin budget bar (color: green/yellow/red)

**Bottom margin detail:**
- Left: Element emoji + name (e.g., "🔥 Fire")
- Center: Effect chips (only active effects, e.g., "⚔️ Pierce 30%", "🧛 Leech 15%")
- Right: `[Inscribe]` `[Clear]` `[Close]`

---

### Stage 1: Slot Focus (Zoom)

Clicking an unlocked slot zooms the mandala so the clicked slot is centered and enlarged. The rest of the mandala fades back (dimmed, ~30% opacity). Margins stay visible but dimmed.

```
┌─────────────────────────────────────────────────────────────┐
│  [🔮] Archmage Simulator          ⚔️ 48 DMG  ·  💧 18 MP   │
├─────┬───────────────────────────────────────────────┬───────┤
│     │                                               │       │
│     │           (faded mandala background)          │       │
│     │                                               │       │
│     │              ┌─────────────┐                  │       │
│     │              │             │                  │       │
│     │              │   ╭─────╮   │                  │       │
│     │              │   │ 🔥  │   │  ← focused slot  │       │
│     │              │   │  ✶  │   │    enlarged      │       │
│     │              │   ╰─────╯   │                  │       │
│     │              │             │                  │       │
│     │              └─────────────┘                  │       │
│     │                                               │       │
│     │           (faded mandala background)          │       │
│     │                                               │       │
├─────┴───────────────────────────────────────────────┴───────┤
│  🔥 Fire  ·  Click a glyph below to socket it here.        │
└─────────────────────────────────────────────────────────────┘
```

**Transition:** 400ms CSS transform scale + opacity fade.

**Bottom margin in Stage 1:** Shows instruction: "Select a glyph to socket in Slot {N}."

---

### Stage 2: Glyph Selection (Contextual Palette)

After zooming, a **curved glyph palette** appears around the focused slot — like a radial menu or constellation. Only glyphs valid for this slot type are shown:

- **Core slot (center):** Only core glyphs (Fire, Water, Wind, Storm, Light, Dark, Earth)
- **Ring slots:** Only non-core glyphs (Power, Effect, Efficiency)

```
                    ┌─────────────┐
                    │             │
         [🔥]       │   ╭─────╮   │       [💧]
          ↕         │   │     │   │        ↕
         [🌪️]      │   │  ?  │   │       [⚡]
                    │   ╰─────╯   │
         [✨]       │             │       [🌑]
          ↕         └─────────────┘        ↕
         [🪨]                             [💚]

    (core slot → radial menu of 7 core glyphs)
```

**Glyph menu items:**
- Show glyph name + tier symbol (current default tier)
- Hover: tooltip with description
- Click: selects glyph, socket it into the slot
- Already-used glyphs are shown but dimmed with "USED" label

**Static glyph treatment:**
- Badge: small 🔒 icon next to name
- Tier always shown as `+` (T1)
- Tooltip: "Static glyph — no tier growth"

**Transition:** Glyph items fade in with stagger (50ms each), orbiting slightly into position.

---

### Stage 3: Tier Tuning (Analog Dial)

After selecting a glyph, the radial menu fades out. An **analog dial** appears as a ring around the slot. The player can "rotate" the dial to tune the tier.

```
                    ┌─────────────────────┐
                    │    T1      T2       │
                    │      ↖  ↗           │
                    │   T7 ←──●──→ T3     │
                    │      ↙  ↘           │
                    │    T6      T5  T4   │
                    │                     │
                    │   [🔥 Fire  +]      │
                    │                     │
                    └─────────────────────┘
```

**Dial behavior:**
- **Backend:** Tiers 1–7 (or 1–maxMastered)
- **UI:** Click/tap on a tier position OR drag to rotate
- **Visual feedback:**
  - Selected tier position glows
  - Glyph symbol updates live (+ → ++ → +++ → ✦ ...)
  - Mandala preview in margins updates live (damage, MP, effects)
  - For static glyphs: dial is locked at T1, position 1 glows solid, others are grayed with 🔒

**"Go Back" button:** Small ↩️ icon at the bottom of the dial. Click returns to Stage 0 (full mandala overview) with the new glyph placed.

**Transition:** Dial ring scales in from 0.8 → 1.0 with opacity 0 → 1. Selected tier position pulses once.

---

### Stage 4: Return to Overview

Mandala zooms back out to full view. The newly placed glyph is visible in its slot. All margins update with the new spell stats.

**Transition:** Reverse of Stage 1 zoom (400ms).

---

## 3. Margin Detail Specifications

### Top Margin

```
┌────────────────────────────────────────────────────────────────────────┐
│ 🔮 Magic Circle — Elara      Tier 12 · 12 slots     ⚔️ 48 DMG  💧 18 MP│
│                                                     [████████░░ 80%]   │
└────────────────────────────────────────────────────────────────────────┘
```

- **Left:** Title + hero name
- **Center-right:** Damage/Heal amount + MP cost
- **Far right:** Thin horizontal budget bar (green ≤75%, yellow 75-90%, red >90%)
- **Background:** `rgba(0,0,0,0.6)` with `backdrop-filter: blur(8px)`

### Left Margin (Target Polarity)

```
│
│  🔴
│  ─
│  F
│  O
│  E
│  ─
│
```

- **Enemy mode (default / no Aegis):**
  - Background: subtle red gradient bleeding into mandala
  - Icon: ⚔️ (crossed swords)
  - Text: "FOE" (rotated 90° counter-clockwise)
  - Text color: `#ef4444` (red-500)

- **Ally mode (Aegis present):**
  - Background: subtle teal/green gradient bleeding into mandala
  - Icon: 💚 (heart/leaf)
  - Text: "ALLY" (rotated 90° counter-clockwise)
  - Text color: `#10b981` (emerald-500)

- **Transition:** Color cross-fades over 300ms when Aegis is added/removed

### Right Margin (Target Count)

```
│
│  👤
│  ─
│  O
│  N
│  E
│  ─
│
```

- **Single target (no Multi):**
  - Icon: 👤 (single person)
  - Text: "ONE"
  - Static, no animation

- **All targets (Multi present):**
  - Icon: 👥 (group)
  - Text: "ALL"
  - Subtle pulse animation (1.5s cycle)

- **Transition:** Icon morphs with a 300ms fade when Multi is added/removed

### Bottom Margin

```
┌────────────────────────────────────────────────────────────────────────┐
│ 🔥 Fire    ⚔️ Pierce 30%    🧛 Leech 15%          [Inscribe] [Clear] ✕│
└────────────────────────────────────────────────────────────────────────┘
```

- **Left:** Element emoji + capitalized name
- **Center:** Active effect chips
  - Each chip: icon + short label
  - Only show if value > 0
  - Chips scroll horizontally if too many
- **Right:** Action buttons
  - `Inscribe Spell`: primary button, disabled if over budget or no core
  - `Clear`: secondary button, clears all slots
  - `✕`: close button

**Effect chips:**
| Effect | Chip Display |
|--------|-------------|
| `pierce` | `⚔️ Pierce {X}%` |
| `poisonStacks` | `☠️ Poison {X}` |
| `sleepChance` | `💤 Sleep {X}%` |
| `lifesteal` | `🧛 Leech {X}%` |
| `speedBoost` | `💨 Speed +{X}%` |
| `reflectChance` | `🔄 Reflect {X}%` |
| `critBonus` | `🎯 Crit +{X}%` |
| `costReduction` | `💎 Save {X}% MP` |

**For support spells:**
- Skip harmful chips (poison, sleep, pierce, lifesteal)
- Show a muted chip: `💚 No harmful effects`

---

## 4. Mandala Visual Design

### Rings
- 4 concentric rings, rendered as thin SVG circles or CSS borders
- **Default color:** Muted silver (`rgba(255,255,255,0.15)`)
- **Active color:** When a core is selected, rings tint toward the element color (e.g., Fire → warm orange glow)
- **Animation:** Each ring rotates slowly (60s per full rotation, alternating directions)

### Slots
- **Total:** 25 positions (1 core + 24 ring slots)
- **Core slot:** Hexagonal shape, 2× size of ring slots, centered
- **Ring slots:** Small circles arranged in hexagonal symmetry (6 per ring)

**Slot states:**

| State | Visual |
|-------|--------|
| `locked` | 🔒 icon, opacity 0.3, no interaction |
| `empty` | Small `＋` icon, opacity 0.5, subtle pulse on hover |
| `filled` | Glyph icon + tier symbol, element-colored glow (for cores) |
| `focused` (Stage 0) | Thick accent border, scale 1.1 |
| `focused` (Stage 1+) | Enlarged, centered, with radial menu or dial around it |

### Connection Lines
- Faint SVG lines connecting adjacent filled slots
- Color: element color at 20% opacity (or silver if no core)
- Animate with `stroke-dashoffset` when a new glyph is placed (draw-on effect, 300ms)

### Background
- Radial gradient from center (darker) to edges
- Subtle noise texture or starfield for "magic" feel
- Element tint bleeds in when core is selected

---

## 5. Support Spell Visual Treatment

When `category === 'support'` (Aegis glyph present):

1. **Mandala background tint:** Cool blue/green instead of warm
2. **Left margin:** Switches from 🔴 FOE to 🟢 ALLY with cross-fade
3. **Top margin damage text:** Changes from `⚔️ 48 DMG` to `💚 14 HEAL` (or appropriate ally effect)
4. **Effect chips:** Harmful effects hidden, `💚 No harmful effects` shown
5. **Mandala ring glow:** Blue/teal instead of element color

The transition between offensive and support should feel dramatic — like the mandala is "inverting its polarity."

---

## 6. Data & State

### State Variables (same as current engine)

```js
let composition = [];        // { slotIndex, glyphId }
let selectedTiers = {};      // { glyphId: tier } — session overrides
let customName = '';
let focusedSlotIndex = null; // null = overview mode
let stage = 0;               // 0=overview, 1=slot-focus, 2=glyph-select, 3=tier-tune
```

### Derived Data (computed each render)

```js
const spell = MagicCircleService.compose(glyphIds, glyphTiers, customName)?.data;
const isSupport = spell?.category === 'support';
const allyEffect = isSupport ? CORE_ALLY_EFFECTS[spell.element] : null;
const effectAmount = isSupport ? Math.floor(spell.damage * spell.allyFactor) : null;
```

### Stage Transitions

| From | Action | To |
|------|--------|-----|
| Stage 0 | Click empty/filled slot | Stage 1 (zoom to slot) |
| Stage 1 | Click valid glyph in radial menu | Stage 2 (glyph placed, show dial) |
| Stage 2 | Select tier on dial | Stage 3 (tier set, show "go back") |
| Stage 3 | Click "go back" / ↩️ | Stage 0 (return to overview) |
| Any stage | Click outside focused area | Stage 0 (cancel, return to overview) |
| Stage 0 | Click "Clear" | Reset composition |

---

## 7. Accessibility

- **Keyboard:**
  - Tab: cycle through unlocked slots
  - Enter: select/focus slot
  - Arrow keys: navigate radial menu glyphs
  - Escape: return to overview
- **Screen reader:**
  - `aria-label` on slots: "Slot 3, empty, unlocked" / "Slot 3, Fire Core, Tier 7"
  - `aria-live="polite"` on margins for stat updates
- **Mobile:**
  - Tap = click
  - Pinch = zoom in/out (optional)
  - Swipe = rotate tier dial (Stage 3)

---

## 8. Animations Summary

| Animation | Duration | Easing |
|-----------|----------|--------|
| Zoom to slot (Stage 0→1) | 400ms | `cubic-bezier(0.4, 0, 0.2, 1)` |
| Radial menu appear (Stage 1→2) | 300ms + 50ms stagger | `ease-out` |
| Dial ring appear (Stage 2→3) | 300ms | `ease-out` |
| Zoom back to overview | 400ms | `cubic-bezier(0.4, 0, 0.2, 1)` |
| Connection line draw-on | 300ms | `ease-in-out` |
| Margin color transition (offensive↔support) | 300ms | `ease` |
| Slot glow pulse (focused) | 1.5s loop | `ease-in-out` |
| Budget bar fill | 200ms | `ease-out` |
| Glyph placed feedback | 150ms scale + glow | `ease-out` |

---

## 9. Backend Prep (Already Done ✅)

| Item | Status |
|------|--------|
| `CORE_ALLY_EFFECTS` mapping | ✅ |
| `spell.category` ('offensive' \| 'support') | ✅ |
| `spell.allyFactor` | ✅ |
| `glyphHasGrowthPotential()` | ✅ |
| Static glyphs cap at Tier 1 | ✅ |
| Target types: `single_ally`, `all_allies` | ✅ |

### New Translations Needed

Add to `js/engine/shared/core/i18n/translations/en.js`:

```js
// Magic Circle — Staged UI
mc_title: "Magic Circle",
mc_hero_tier: "Tier {tier} · {slots} slots",
mc_budget_within: "Within Budget",
mc_budget_warning: "Expensive",
mc_budget_over: "Over Budget",
mc_foe: "FOE",
mc_ally: "ALLY",
mc_one: "ONE",
mc_all: "ALL",
mc_slot_locked: "Unlocks at Tier {tier}",
mc_slot_empty: "Empty slot",
mc_slot_select_prompt: "Select a glyph to socket here.",
mc_slot_remove_prompt: "Click again to remove.",
mc_glyph_static_label: "Static",
mc_glyph_static_tooltip: "No tier growth — effect is constant.",
mc_dial_prompt: "Rotate to tune tier",
mc_dial_back: "Back to mandala",
mc_effect_none: "No additional effects",
mc_effect_no_harm: "No harmful effects on allies",
mc_effect_pierce: "⚔️ Pierce {value}%",
mc_effect_poison: "☠️ Poison {value}",
mc_effect_sleep: "💤 Sleep {value}%",
mc_effect_leech: "🧛 Leech {value}%",
mc_effect_speed: "💨 Speed +{value}%",
mc_effect_reflect: "🔄 Reflect {value}%",
mc_effect_crit: "🎯 Crit +{value}%",
mc_effect_cost_reduce: "💎 Save {value}% MP",
mc_preview_damage: "{value} DMG",
mc_preview_heal: "{value} HEAL",
mc_preview_buff_atk: "{value} ATK",
mc_preview_buff_def: "{value} DEF",
mc_preview_buff_spd: "{value} SPD",
mc_preview_buff_crit: "{value} CRIT",
mc_preview_restore_mp: "{value} MP",
mc_preview_restore_stamina: "{value} STA",
mc_inscribe: "Inscribe Spell",
mc_inscribe_disabled: "Inscribe (Simulator)",
mc_clear: "Clear",
mc_close: "Close",
mc_unsaved_title: "Unsaved Composition",
mc_unsaved_message: "Discard your current spell?",
mc_unsaved_keep: "Keep Editing",
mc_unsaved_discard: "Discard",
```

---

## 10. Files to Modify

| File | Change |
|------|--------|
| `js/presentation/ui/magic_circle/MagicCircleView.js` | Full rewrite — staged flow, zoom transitions, radial menu, analog dial |
| `css/style.css` or new `css/magic-circle.css` | All mandala, margin, dial, and animation styles |
| `js/engine/shared/core/i18n/translations/en.js` | Add all new keys above |
| `js/presentation/ui/magic_circle/MagicCircleHelper.js` *(new)* | Extract: effect chip formatting, margin label formatting, ally effect resolution |

---

## 11. Open Questions for UX Implementer

1. **Rendering tech:** Pure CSS + DOM for mandala, or SVG for rings/connection lines? SVG gives better connection lines but DOM is simpler for slots.
2. **Dial interaction:** Click-to-select tier position, or drag-to-rotate? Drag feels more analog but click is more precise.
3. **Mobile radial menu:** On small screens, a curved radial menu may not fit. Fallback to a small popup list below the slot?
4. **Element background tint:** Should the ENTIRE mandala background tint, or just the rings? Full tint is more dramatic but may reduce readability.
5. **Connection lines:** Draw lines between ALL adjacent filled slots, or only between slots in the same ring?
