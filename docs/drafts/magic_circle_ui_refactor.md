# Magic Circle UI Refactor — Design Spec (v2)

## Status: Draft — Ready for UX Implementation

> **⚠️ FOR THE UX IMPLEMENTER:**
> 1. **Read the concept doc first:** [`docs/shared/combat/magic_circle_system.md`](../shared/combat/magic_circle_system.md) — understand what the Magic Circle *represents*.
> 2. **Work on the V2 file:** `js/presentation/ui/magic_circle/MagicCircleViewV2.js` — **do NOT modify** `MagicCircleView.js` (the current live version).
> 3. **Existing translations are ready** in `js/engine/shared/core/i18n/translations/en.js` under the `mc_` prefix. Add more if needed.
> 4. **Test your work:** In Settings, click the simulator button — a `V1 / V2` toggle appears next to it. Toggle to V2 to test inside the real app.
> 5. **Backend logic is extracted** in `js/presentation/ui/magic_circle/MagicCircleHelper.js` — use it, don't reimplement.
> 6. **The mandala is yours.** Canvas, SVG, DOM, WebGL — whatever you think works best. The current shell only provides a full-screen overlay container and the data.

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
> 
> **You decide how to render this.** The current scaffold does NOT prescribe DOM structure, CSS positioning, or rendering technology. Build it however you want.

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

## 2. Screen States (Suggested Flow)

These are **suggestions**, not prescriptions. If you have a better interaction model, use it.

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

### Stage 1+: Focused Interaction

Clicking a slot should trigger some kind of focused view — zoom, popup, sidebar, whatever works. The key behaviors:

- **Core slot (center):** Only core glyphs can be placed (Fire, Water, Wind, Storm, Light, Dark, Earth)
- **Ring slots:** Only non-core glyphs (Power, Effect, Efficiency)
- **Glyph palette:** Show valid glyphs for the selected slot. Already-used glyphs should be indicated.
- **Tier tuning:** Once a glyph is selected, let the player tune its tier (1 up to their mastery). Static glyphs cap at T1.
- **Go back:** Some way to return to the overview.

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

## 4. Mandala Visual Design (Your Call)

**You decide all of this.** The suggestions below are just that — suggestions.

### Rings
- 4 concentric rings, rendered as thin SVG circles or CSS borders
- **Default color:** Muted silver (`rgba(255,255,255,0.15)`)
- **Active color:** When a core is selected, rings tint toward the element color
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
| `focused` | Some kind of highlight — border, scale, glow, whatever |

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

### State Variables

```js
let composition = [];        // { slotIndex, glyphId }
let selectedTiers = {};      // { glyphId: tier } — session overrides
let customName = '';
```

### Derived Data (computed each render)

```js
const spell = MagicCircleService.compose(glyphIds, glyphTiers, customName)?.data;
const isSupport = spell?.category === 'support';
const allyEffect = isSupport ? CORE_ALLY_EFFECTS[spell.element] : null;
const effectAmount = isSupport ? Math.floor(spell.damage * spell.allyFactor) : null;
```

### Key Rules

- Slot 0 is the **core** slot. Only `type === 'core'` glyphs can go there.
- Slots 1+ are **ring** slots. Only non-core glyphs can go there.
- A glyph can be placed in multiple slots (no uniqueness constraint).
- `MagicCircleService.getSlotCount(magicTier)` returns how many slots are unlocked (1 to 25).
- `GLYPH_DATA` has all glyph definitions.
- `glyphMastery[glyphId].tier` is the hero's mastered tier for that glyph.

---

## 7. Accessibility

- **Keyboard:** Tab through slots, Enter to select, Escape to cancel
- **Screen reader:** `aria-label` on interactive elements
- **Mobile:** Tap to select, ensure touch targets are ≥44px

---

## 8. Backend Prep (Already Done ✅)

| Item | Status |
|------|--------|
| `CORE_ALLY_EFFECTS` mapping | ✅ |
| `spell.category` ('offensive' \| 'support') | ✅ |
| `spell.allyFactor` | ✅ |
| `glyphHasGrowthPotential()` | ✅ |
| Static glyphs cap at Tier 1 | ✅ |
| Target types: `single_ally`, `all_allies` | ✅ |

### Translations (Already Added)

All these keys exist in `js/engine/shared/core/i18n/translations/en.js`:

```js
mc_title, mc_hero_tier, mc_budget_within, mc_budget_warning, mc_budget_over,
mc_foe, mc_ally, mc_one, mc_all, mc_slot_locked, mc_slot_empty,
mc_slot_select_prompt, mc_slot_remove_prompt, mc_glyph_static_label,
mc_glyph_static_tooltip, mc_dial_prompt, mc_dial_back, mc_effect_none,
mc_effect_no_harm, mc_effect_pierce, mc_effect_poison, mc_effect_sleep,
mc_effect_leech, mc_effect_speed, mc_effect_reflect, mc_effect_crit,
mc_effect_cost_reduce, mc_preview_damage, mc_preview_heal, mc_preview_buff_atk,
mc_preview_buff_def, mc_preview_buff_spd, mc_preview_buff_crit,
mc_preview_restore_mp, mc_preview_restore_stamina, mc_inscribe,
mc_inscribe_disabled, mc_clear, mc_close, mc_unsaved_title,
mc_unsaved_message, mc_unsaved_keep, mc_unsaved_discard
```

---

## 9. Files

| File | What to do |
|------|-----------|
| `js/presentation/ui/magic_circle/MagicCircleViewV2.js` | **Your canvas.** Replace the minimal shell with your implementation. |
| `css/magic-circle-scaffold.css` | Currently only has the overlay container. Add your styles here, or create a new CSS file and import it in `index.html`. |
| `js/presentation/ui/magic_circle/MagicCircleView.js` | **Do NOT touch.** This is the live V1. |

### Files to Reference (read-only)

| File | Why |
|------|-----|
| `js/presentation/ui/magic_circle/MagicCircleHelper.js` | Use `buildEffectChips()`, `getPowerDisplay()`, `resolveTarget()`, etc. |
| `js/engine/shared/data/GameConstants.js` | See `GLYPH_DATA`, `CORE_ALLY_EFFECTS`, `glyphHasGrowthPotential()` |
| `docs/shared/combat/magic_circle_system.md` | Understand the concept: glyphs as drawings, tiers as mastery |
