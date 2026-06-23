# Story Image Generation — Image Agent Task

> **Context:** Generate images based on the RPG Village game lore. All images are illustrations for "The Book" — a chronicle written by a village scribe who witnesses the settlement grow from a refugee camp into a thriving town. These images appear in narrative presentations (story slides) and the village chronicle.
>
> **Art Style (STRICT — apply to ALL images):**
> - Manual hand-drawn illustration
> - Transparent background (PNG with alpha, then convert to WebP)
> - Black ink strokes only — no color, no shading gradients
> - Style of a medieval manuscript artist or village scribe with basic artistic skill
> - Slightly rough, sketchy linework — not polished, not digital-smooth
> - Occasional cross-hatching for depth, ink splatters acceptable
> - As if drawn with a quill or charcoal on parchment
> - Characters should be small, illustrative, not portrait-focused
> - Scenes should feel "witnessed from afar" — the scribe draws what they see from their window or the ridge
>
> **Technical Requirements:**
> - Output format: PNG with transparency → convert to WebP
> - Resolution: approximately 800x600 or 16:9 ratio
> - File location: `public/assets/story/` (relative to repo root)
> - When replacing: overwrite the existing placeholder file, keep the same filename
>
> **Workflow for the Agent:**
> 1. Read this file to find the next "pending" image
> 2. Generate the image using the prompt below
> 3. Save as PNG with transparency, convert to WebP
> 4. Overwrite the placeholder file in `public/assets/story/`
> 5. Update this file: change Status from `pending` to `generated`
> 6. Commit the change: `git add public/assets/story/<filename> docs/IMAGE_GENERATION_TASK.md && git commit -m "assets(story): generate <filename>"`
> 7. Continue to the next pending image
> 8. If all images are generated, update the final status line at the bottom
>
> **Game Lore Summary:**
> The game follows refugees led by Arthur who flee a destroyed kingdom and found a village in a remote valley. They build farms, a tavern, training grounds, an arcane sanctum, and explore surrounding regions. Key characters: Arthur (leader, warrior), Elara (arcane initiate who discovers glyphs), Valen (defender who shields the village), and a mysterious Witch who appears later. The story is told through "The Book" — a chronicle written by an unnamed village scribe who eventually reveals themselves.

---

## Image 1: `assets/story/prologue_valley_dawn.webp`
**Scene:** The refugees' first morning in the valley. A wide misty mountain valley with a winding river, jagged peaks in the background, and small tents or figures in the foreground. The scribe stands on a ridge and draws this view.
**Prompt:** A wide misty mountain valley at dawn, river winding through the center, jagged peaks in background, tiny tents and figures in foreground, viewed from a ridge above. Medieval manuscript ink drawing, black strokes only, transparent background, sketchy rough linework, small human figures, witnessed from afar, village scribe style.
**Status:** generated

---

## Image 2: `assets/story/prologue_arthur_trail.webp`
**Scene:** Arthur leading the group through a narrow rocky mountain trail. He is at the front, looking back to check on the exhausted refugees behind him. The path is dangerous and steep.
**Prompt:** A group of small figures walking through a narrow rocky mountain trail, one leader figure at front looking back, others exhausted behind, steep dangerous path, cliffs on one side. Medieval manuscript ink drawing, black strokes only, transparent background, sketchy rough linework, small human figures, witnessed from afar, village scribe style.
**Status:** generated

---

## Image 3: `assets/story/prologue_first_stake.webp`
**Scene:** The founding moment — hands driving a wooden stake into fertile soil. Close-up, intimate. Morning light suggested by simple lines. This is the first permanent mark in the valley.
**Prompt:** Close-up of hands driving a wooden stake into soil, wooden mallet, morning light suggested by simple radiating lines, intimate founding moment. Medieval manuscript ink drawing, black strokes only, transparent background, sketchy rough linework, village scribe style.
**Status:** generated

---

## Image 4: `assets/story/village_farm_dawn.webp`
**Scene:** The first farm at dawn. Simple rows of crops, a wooden fence, a small figure working in the field. Peaceful, hopeful, the first food source.
**Prompt:** A small farm with rows of young crops, simple wooden fence, one tiny figure working with a hoe, peaceful morning atmosphere. Medieval manuscript ink drawing, black strokes only, transparent background, sketchy rough linework, small human figures, village scribe style.
**Status:** generated

---

## Image 5: `assets/story/village_tavern_dusk.webp`
**Scene:** The tavern exterior at dusk. A simple wooden building with warm light spilling from windows, smoke from chimney, small figures in the doorway. Inviting and communal.
**Prompt:** A simple wooden tavern building at dusk, warm light rectangles for windows, smoke lines from chimney, tiny figures in doorway, inviting atmosphere. Medieval manuscript ink drawing, black strokes only, transparent background, sketchy rough linework, small human figures, village scribe style.
**Status:** generated

---

## Image 6: `assets/story/village_tavern_inside.webp`
**Scene:** Inside the tavern. A hearth with simple flame lines, villagers sitting on benches, rough tables with tankard shapes, someone playing a string instrument in the corner. Warm and communal.
**Prompt:** Interior of a village tavern, hearth with simple flame lines, figures sitting on benches at rough tables, tankard shapes on tables, one figure with a lute in corner. Medieval manuscript ink drawing, black strokes only, transparent background, sketchy rough linework, small human figures, village scribe style.
**Status:** generated

---

## Image 7: `assets/story/village_training_grounds.webp`
**Scene:** Training grounds at midday. Two figures sparring with wooden swords, a training dummy with simple crossed lines, an open dirt area. Dynamic but simple.
**Prompt:** Outdoor training grounds, two small figures sparring with wooden swords, simple training dummy made of crossed wood beams, open dirt area. Medieval manuscript ink drawing, black strokes only, transparent background, sketchy rough linework, small human figures, dynamic poses, village scribe style.
**Status:** generated

---

## Image 8: `assets/story/village_village_above.webp`
**Scene:** The village seen from the ridge above. Multiple simple buildings, smoke from chimneys, a wall or fence, the valley spreading below. The scribe's pride — showing growth.
**Prompt:** A village seen from a ridge above, multiple simple buildings with triangular roofs, smoke lines from chimneys, a wooden fence or wall, green valley below. Medieval manuscript ink drawing, black strokes only, transparent background, sketchy rough linework, small buildings, village scribe style.
**Status:** generated

---

## Image 9: `assets/story/village_village_stake.webp`
**Scene:** The original founding spot, now marked with a simple wooden monument. Flowers or grass growing around it. Nostalgic, showing how far the village has come.
**Prompt:** A simple wooden marker stake in the ground with a small pile of stones around it, grass and wildflowers growing nearby, nostalgic atmosphere. Medieval manuscript ink drawing, black strokes only, transparent background, sketchy rough linework, village scribe style.
**Status:** generated

---

## Image 10: `assets/story/char_arthur_portrait.webp`
**Scene:** Arthur, the village leader. Strong build, simple tunic, a sword at his side. Not a close portrait — small figure showing his stance and presence. He looks forward with quiet determination.
**Prompt:** A standing warrior figure in simple tunic, sword at side, strong build, looking forward with quiet determination, small illustrative figure not portrait. Medieval manuscript ink drawing, black strokes only, transparent background, sketchy rough linework, village scribe style.
**Status:** generated

---

## Image 11: `assets/story/char_elara_twilight.webp`
**Scene:** Elara, the arcane initiate. She stands with a faintly glowing glyph hovering above her outstretched hand. She looks at it with wonder and fear. Simple robes, slender build.
**Prompt:** A slender figure in simple robes, one hand outstretched with a small floating geometric glyph shape above it, wonder and fear in posture, twilight atmosphere suggested by simple lines. Medieval manuscript ink drawing, black strokes only, transparent background, sketchy rough linework, small illustrative figure, village scribe style.
**Status:** generated

---

## Image 12: `assets/story/char_elara_glyph.webp`
**Scene:** Elara's hands forming a magic glyph. Close-up of hands with a glowing geometric pattern between them. Concentration, discovery.
**Prompt:** Close-up of two hands cupping a floating geometric glyph pattern, magic circle visible below, concentration in the finger positioning. Medieval manuscript ink drawing, black strokes only, transparent background, sketchy rough linework, village scribe style.
**Status:** generated

---

## Image 13: `assets/story/char_valen_rubble.webp`
**Scene:** Valen, the defender, standing amid rubble after a battle. His shield is large and dented, his stance is wide and defiant. He is breathing hard but unbroken.
**Prompt:** A warrior figure standing amid scattered rubble and broken stones, holding a large dented shield, wide defiant stance, breathing hard but standing firm. Medieval manuscript ink drawing, black strokes only, transparent background, sketchy rough linework, small illustrative figure, village scribe style.
**Status:** generated

---

## Image 14: `assets/story/char_valen_arthur_together.webp`
**Scene:** Arthur and Valen standing side by side, looking toward the village they built. Friends, partners. Their postures are relaxed, shoulders almost touching. Quiet pride.
**Prompt:** Two standing warrior figures side by side, looking toward distant buildings, relaxed postures, shoulders nearly touching, friendship and partnership. Medieval manuscript ink drawing, black strokes only, transparent background, sketchy rough linework, small illustrative figures, village scribe style.
**Status:** generated

---

## Image 15: `assets/story/combat_first_victory.webp`
**Scene:** The party's first victory. Enemies fleeing into the distance, heroes standing with weapons lowered (not raised in triumph — just relief). The scribe drew this from a hiding spot behind rocks.
**Prompt:** A small group of figures standing with weapons lowered, enemy figures fleeing into the distance, relief not triumph, viewed from behind rocks. Medieval manuscript ink drawing, black strokes only, transparent background, sketchy rough linework, small figures, village scribe style.
**Status:** generated

---

## Image 16: `assets/story/combat_first_defeat.webp`
**Scene:** The party retreating, carrying a wounded companion. Darker mood, rain suggested by diagonal lines, heads bowed. The scribe drew this with a shaking hand — the lines should feel slightly unsteady.
**Prompt:** A group of figures retreating, one being carried by two others, heads bowed, diagonal lines suggesting rain, darker somber mood, unsteady shaky linework. Medieval manuscript ink drawing, black strokes only, transparent background, rough shaky linework, small figures, village scribe style.
**Status:** generated

---

## Image 17: `assets/story/combat_boss_defeated.webp`
**Scene:** The goblin king defeated. A large hulking figure lying on the ground, three small hero figures catching their breath nearby. Perspective from ground level looking up slightly.
**Prompt:** A large defeated hulking creature lying on ground, three small figures catching breath nearby, ground-level perspective, epic but weary atmosphere. Medieval manuscript ink drawing, black strokes only, transparent background, sketchy rough linework, small figures, village scribe style.
**Status:** generated

---

## Image 18: `assets/story/combat_raid_defense.webp`
**Scene:** Village wall defense. Defenders on a wooden wall with bows and spears, raiders approaching through smoke below. Viewed from the bell tower above.
**Prompt:** A wooden wall with figures holding bows and spears, enemy figures approaching through smoke below, viewed from above. Medieval manuscript ink drawing, black strokes only, transparent background, sketchy rough linework, small figures, village scribe style.
**Status:** generated

---

## Image 19: `assets/story/magic_sanctum_hum.webp`
**Scene:** Inside the Arcane Sanctum. Stone walls with geometric glyphs carved into them, a low altar or table, a figure standing in the center. Mysterious, reverent, quiet power.
**Prompt:** Interior of a stone sanctum, geometric glyphs carved into walls, simple altar in center, one figure standing before it, mysterious atmosphere. Medieval manuscript ink drawing, black strokes only, transparent background, sketchy rough linework, small figure, village scribe style.
**Status:** generated

---

## Image 20: `assets/story/magic_circle_first.webp`
**Scene:** The first complete magic circle drawn on stone floor. Imperfect, slightly shaky lines, but complete. A historic moment captured simply.
**Prompt:** A circular geometric pattern drawn on flat stone surface, imperfect shaky lines but complete, chalk or charcoal marks, historic moment. Medieval manuscript ink drawing, black strokes only, transparent background, sketchy rough linework, village scribe style.
**Status:** generated

---

## Image 21: `assets/story/magic_circle_flare.webp`
**Scene:** A magic circle flaring to life. Radiant lines bursting outward from a central geometric pattern, energy suggested by sharp radiating strokes. The scribe had to squint — draw it energetically.
**Prompt:** A geometric circle pattern with sharp radiating lines bursting outward, energy and light suggested by explosive linework, dynamic and energetic. Medieval manuscript ink drawing, black strokes only, transparent background, rough energetic linework, village scribe style.
**Status:** generated

---

## Image 22: `assets/story/magic_hero_awe.webp`
**Scene:** A hero's face lit by magic. Pure awe and wonder, mouth slightly open, eyes wide. The magic light is suggested by simple radiating lines around the face. Small illustrative figure, not a portrait.
**Prompt:** A small figure's face with wide eyes and slightly open mouth, radiating lines around the head suggesting magical light, expression of pure awe. Medieval manuscript ink drawing, black strokes only, transparent background, sketchy rough linework, small illustrative figure, village scribe style.
**Status:** pending

---

## Image 23: `assets/story/witch_appears.webp`
**Scene:** The witch's first appearance. A cloaked figure standing at the edge of the village, mist around the feet, face hidden in shadow. Ominous but not clearly evil — ambiguous.
**Prompt:** A cloaked figure standing at the edge of a village, mist lines around the feet, face hidden deep in hood shadow, ambiguous ominous presence. Medieval manuscript ink drawing, black strokes only, transparent background, sketchy rough linework, small figure, village scribe style.
**Status:** pending

---

## Image 24: `assets/story/witch_reading.webp`
**Scene:** The witch in her hut, reading a scroll by candlelight. Old, wise, slightly amused expression. Books and herbs scattered around her. Candle flame suggested by simple lines.
**Prompt:** An old figure with wrinkles reading a scroll, candle flame suggested by simple lines, books and herb bundles scattered around, wise amused expression. Medieval manuscript ink drawing, black strokes only, transparent background, sketchy rough linework, small illustrative figure, village scribe style.
**Status:** pending

---

## Image 25: `assets/story/explore_guild_maps.webp`
**Scene:** The Explorer Guild interior. Maps pinned to walls, a large table with a world map spread on it, small figures pointing at locations. Adventure planning.
**Prompt:** Interior room with maps pinned to walls, large table with map spread on it, small figures pointing at locations on the map, adventure planning atmosphere. Medieval manuscript ink drawing, black strokes only, transparent background, sketchy rough linework, small figures, village scribe style.
**Status:** pending

---

## Image 26: `assets/story/explore_map_table.webp`
**Scene:** Close-up of hands on a map table. Fingers tracing routes, small wooden markers placed on destinations. Planning an expedition.
**Prompt:** Close-up of hands on a large map, fingers tracing lines, small wooden marker pieces placed on the map, expedition planning. Medieval manuscript ink drawing, black strokes only, transparent background, sketchy rough linework, village scribe style.
**Status:** pending

---

## Image 27: `assets/story/finale_chapter1_village_glow.webp`
**Scene:** The village at night, warm light from windows. A sense of safety and home. The scribe drew this from their window, feeling proud and protective.
**Prompt:** A village at night seen from nearby window, warm light rectangles in building windows, stars above, sense of safety and home. Medieval manuscript ink drawing, black strokes only, transparent background, sketchy rough linework, small buildings, village scribe style.
**Status:** pending

---

## Image 28: `assets/story/finale_chapter1_elara_window.webp`
**Scene:** Elara looking out a window at the village below. A small smile, her hand resting on the windowsill. She has found her place. Viewed from behind/inside.
**Prompt:** A figure seen from behind looking out a window at a village below, one hand on windowsill, small smile suggested by simple line, sense of belonging. Medieval manuscript ink drawing, black strokes only, transparent background, sketchy rough linework, small figure, village scribe style.
**Status:** pending

---

## Image 29: `assets/story/finale_chapter2_night_colors.webp`
**Scene:** The village under unusual magical lights in the night sky. Aurora-like patterns above the buildings. The scribe has never seen this before — draw it with wonder.
**Prompt:** A village at night with unusual wavy light patterns in the sky above, aurora-like magical lights, sense of wonder and mystery. Medieval manuscript ink drawing, black strokes only, transparent background, sketchy rough linework, small buildings, village scribe style.
**Status:** pending

---

## Image 30: `assets/story/finale_chapter2_sky_rift.webp`
**Scene:** A tear or rift in the sky above jagged mountains. Dark, ominous, sharp jagged edges. Far away but threatening. The scribe drew this quickly, afraid.
**Prompt:** Jagged mountains with a sharp tear-like rift in the sky above, dark ominous atmosphere, sharp jagged edges on the rift, threatening presence. Medieval manuscript ink drawing, black strokes only, transparent background, rough shaky linework, village scribe style.
**Status:** pending

---

## Image 31: `assets/story/milestone_first_building.webp`
**Scene:** Villagers raising a wooden building frame together. Ropes, teamwork, the first permanent structure. Hopeful, communal effort.
**Prompt:** Small figures working together to raise a wooden building frame, ropes and beams, teamwork and community effort, hopeful atmosphere. Medieval manuscript ink drawing, black strokes only, transparent background, sketchy rough linework, small figures, village scribe style.
**Status:** pending

---

## Image 32: `assets/story/milestone_first_recruit.webp`
**Scene:** A new hero arriving at the village gate. They stand cautiously, looking around, while a villager welcomes them with an outstretched hand. New beginnings.
**Prompt:** A figure standing at a village gate looking around cautiously, another figure welcoming them with outstretched hand, new beginning atmosphere. Medieval manuscript ink drawing, black strokes only, transparent background, sketchy rough linework, small figures, village scribe style.
**Status:** pending

---

## Image 33: `assets/story/milestone_quiet_day.webp`
**Scene:** An empty village square. No figures. Just a banner hanging from a pole, moving slightly in the wind. Peaceful, eerie, beautiful in its emptiness.
**Prompt:** An empty village square with no figures, a banner hanging from a pole moving in wind, peaceful eerie beautiful emptiness. Medieval manuscript ink drawing, black strokes only, transparent background, sketchy rough linework, village scribe style.
**Status:** pending

---

## Image 34: `assets/story/milestone_raid_aftermath.webp`
**Scene:** After a raid. A broken fence, scattered arrows on the ground, a single figure patching a wall with wood and nails. Resilience, not defeat.
**Prompt:** A broken wooden fence, scattered arrow shapes on ground, one figure patching a wall with wood planks, resilience and repair. Medieval manuscript ink drawing, black strokes only, transparent background, sketchy rough linework, small figure, village scribe style.
**Status:** pending

---

## Image 35: `assets/story/writer_journal_closeup.webp`
**Scene:** The chronicler's hands holding an open journal. Ink-stained fingers, a quill pen, a candle nearby. This is the writer revealing themselves — meta, intimate.
**Prompt:** Close-up of ink-stained hands holding an open book or journal, quill pen nearby, candle flame suggested by simple lines, intimate self-revelation. Medieval manuscript ink drawing, black strokes only, transparent background, sketchy rough linework, village scribe style.
**Status:** pending

---

## Overall Status

**Total Images:** 35
**Generated:** 21
**Pending:** 14
**Next to generate:** Image 22 (`magic_hero_awe.webp`)

---

## Commit Instructions for the Agent

When generating images, use this commit pattern:

```bash
git add public/assets/story/<filename>.webp docs/IMAGE_GENERATION_TASK.md
git commit -m "assets(story): generate <filename> — <short description>"
```

Example:
```bash
git add public/assets/story/prologue_valley_dawn.webp docs/IMAGE_GENERATION_TASK.md
git commit -m "assets(story): generate prologue_valley_dawn — misty valley at dawn"
```

**Branch:** `feat/improvements`
