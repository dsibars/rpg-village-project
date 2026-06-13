# RPG Village - Assets Enrichment Plan

This document acts as the roadmap and status register for the assets enrichment of the RPG Village project. All images are generated with transparent backgrounds in a hand-drawn digital painting style. All sound effects are generated synthetically in `.wav` format with beautiful, organic-sounding digital FM synthesis.

---

## 1. Sound Effects (SFX)
All sound effects are synthetically generated using a custom Python synthesizer script `public/assets/generate_sfx.py`. The sounds are designed to feel clean, immersive, and magical (avoiding harsh 8-bit chiptune textures).

| ID / Filename | Type | Synthesis Goal & Characteristics | Status |
| :--- | :--- | :--- | :--- |
| `ui_click.wav` | UI | A soft, organic wood-like tap/click (extremely rapid sine decay with a high fundamental). | Completed |
| `battle_start.wav` | Combat | A dramatic, deep ambient swell rising in pitch and volume with FM-modulated harmonics. | Completed |
| `hit_physical.wav` | Combat | A heavy impact (low-pitch body thump mixed with a short burst of low-pass filtered noise). | Completed |
| `hit_magic.wav` | Combat | A bright, shimmering spell impact (combining high-pitch sine wave sweeps and ring-modulation). | Completed |
| `heal.wav` | Combat / Spell | A warm, rising magical sweep with multiple harmonic oscillators (major chord intervals) fading out slowly. | Completed |
| `level_up.wav` | Fanfare | A short, beautiful ascending musical arpeggio (C major / G major) with clean sine chime tones. | Completed |
| `defeat.wav` | Fanfare | A somber, low-pitch drone with detuned oscillators creating a slowly beating, dark descent. | Completed |
| `victory.wav` | Fanfare | A brief, triumphant fanfare (bright brassy chords played in sequence). | Completed |
| `forge_success.wav`| Economy | A high-pitched metallic hammer ring followed by a rising, bright magical sparkle sound. | Completed |
| `forge_fail.wav` | Economy | A metallic hammer ring followed by a brief, low-frequency buzzing hiss (steam/disappointment). | Completed |
| `build_complete.wav`| Village | Three rhythmic hammer-strike sounds followed by a soft, bright metallic chime indicating completion. | Completed |

---

## 2. Buildings (Visuals)
Style: Isometric digital painting, rich color palette, clean details, transparent background.

| ID / Filename | Target Path | Visual Description & Prompt Details | Status |
| :--- | :--- | :--- | :--- |
| `witchs_hut.png` | `public/assets/buildings/witchs_hut.png` | A cozy, mystical isometric witch's cottage with a crooked thatched roof, purple/green glow from windows, a boiling cauldron outside, and glowing potion bottles. | Completed |
| `arcane_sanctum.png` | `public/assets/buildings/arcane_sanctum.png` | A majestic, tall wizard's tower/arcane sanctum in isometric view, with levitating stone fragments, a large floating blue crystal at the top, and glowing magical runes carved into the walls. | Completed |

---

## 3. Hero Origins (Visuals)
Style: Digital character portraits, fantasy style, high detail, vibrant colors, transparent background.

| ID / Filename | Target Path | Visual Description & Prompt Details | Status |
| :--- | :--- | :--- | :--- |
| `origin_warrior.png` | `public/assets/heroes/origin_warrior.png` | A brave warrior portrait, steel plate armor with gold trim, heroic expression, shoulder guard, wielding a sword. | Completed |
| `origin_farmer.png` | `public/assets/heroes/origin_farmer.png` | A friendly farmer portrait, straw hat, denim overalls over a plaid shirt, holding a pitchfork, smiling warmly. | Completed |
| `origin_cook.png` | `public/assets/heroes/origin_cook.png` | A jolly cook portrait, white chef's hat, apron, holding a wooden ladle, friendly expression. | Completed |
| `origin_guard.png` | `public/assets/heroes/origin_guard.png` | A stern guard portrait, wearing a chainmail coif and iron helmet, holding a heavy shield, watchful expression. | Completed |
| `origin_arcane_initiate.png` | `public/assets/heroes/origin_arcane_initiate.png` | A young wizard/arcane initiate portrait, wearing simple blue robes, reading a glowing spellbook, soft magical lighting on their face. | Completed |

---

## 4. Story Heroes (Visuals)
Style: Digital character portraits, fantasy style, high detail, vibrant colors, transparent background.

| ID / Filename | Target Path | Visual Description & Prompt Details | Status |
| :--- | :--- | :--- | :--- |
| `lyra.png` | `public/assets/heroes/lyra.png` | Lyra the Poet hero portrait, female elf or human with flowing hair, wearing an elegant tunic, carrying a lute on her back, peaceful and artistic expression. | Completed |
| `brog.png` | `public/assets/heroes/brog.png` | Brog the Warrior hero portrait, large muscular orc warrior, battle scars, wearing leather-strapped steel pauldrons, serious battle-hardened expression. | Completed |

---

## 5. Enemies (Visuals)
Style: Fantasy creature combat sprites, dynamic pose, high detail, transparent background.

| ID / Filename | Target Path | Visual Description & Prompt Details | Status |
| :--- | :--- | :--- | :--- |
| `slime_green.png` | `public/assets/enemies/slime_green.png` | A cute but dangerous bouncing green slime creature, semi-transparent gelatinous body, glowing core inside, dynamic action pose. | Completed |
| `slime_fire.png` | `public/assets/enemies/slime_fire.png` | A fiery red/orange slime creature, semi-transparent fire body with sparks and internal flames rising from it, angry expression. | Completed |
| `wild_boar.png` | `public/assets/enemies/wild_boar.png` | An aggressive wild boar, thick dark fur, sharp tusks, charging stance, dust kicking up, glowing red eyes. | Completed |
| `skeleton_warrior.png`| `public/assets/enemies/skeleton_warrior.png` | A skeletal warrior, glowing blue light in eye sockets, wearing rusted iron helmet, holding a cracked shield and rusted broadsword. | Completed |
| `young_drake.png` | `public/assets/enemies/young_drake.png` | A small but fierce young red dragon (drake), fire breathing stance, scaled body, small wings, sharp claws. | Completed |
| `goblin_king.png` | `public/assets/enemies/goblin_king.png` | A large, fat goblin king sitting on a throne of crude wood and bones, wearing a crown made of scrap metal, wielding a heavy spiked club. | Completed |

---

## 6. Items & Materials (Visuals)
Style: Clean, stylized 2D fantasy item icons, rich details, transparent background.

| ID / Filename | Target Path | Visual Description & Prompt Details | Status |
| :--- | :--- | :--- | :--- |
| `tiny_hp_potion.png`| `public/assets/inventory/tiny_hp_potion.png` | A tiny glass vial containing a bubbling red healing liquid, cork stopper, golden trim, magical light. | Completed |
| `tiny_mp_potion.png`| `public/assets/inventory/tiny_mp_potion.png` | A tiny glass vial containing a glowing blue mana liquid, cork stopper, silver trim. | Pending |
| `material_wood.png` | `public/assets/inventory/material_wood.png` | A bundle of neatly cut oak logs tied with a hemp rope, rich wood texture. | Pending |
| `material_stone.png`| `public/assets/inventory/material_stone.png` | A pile of refined building stones/blocks, gray granite, clean chiselled edges. | Pending |
| `food_raw_grain.png`| `public/assets/inventory/food_raw_grain.png` | A bundle of harvested golden wheat stalks tied together, rich gold/straw colors. | Pending |
