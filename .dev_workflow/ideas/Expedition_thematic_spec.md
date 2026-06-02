# Product Specification: Expedition Areas Thematic Refinement & Narrative System

This specification defines the functional, thematic, mechanical, and narrative design for all expedition regions, story-driven progression paths, hero unlocks, and the daily storyboard resolution system. 

---

## 1. Core Product & Gameplay Philosophy

To transition the exploration module from a progression of generic combat nodes into a rich, strategic journey:
1.  **Distinct Tactical Identity**: Every region demands a specific tactical counter-strategy from the player. Players cannot succeed by using the same party setup, equipment set, and gambit configurations across all regions.
2.  **Resource & Progression Gating**: Resource drops are strictly aligned with regional difficulty. Advanced zones are gated behind hard progression checks, requiring players to construct specific village infrastructure, forge higher-tier gear, and compose complex spell matrices to advance.
3.  **Cinematic Storytelling**: Story milestones are elevated through rich narrative logs and visual, multi-panel storyboards that highlight the consequences of the player's achievements.

---

## 2. Master Region Registry & Thematic Definitions

### 2.1 Implemented Regions (Tiers 1–5)

#### Region 1: Greenfields (`reg_greenfields`)
*   **Theme**: "The Sunlit Meadows" — Calm, lush pastures surrounding the starting village.
*   **Mechanical Challenge & Scaling**: Low-scaling safe zone. The difficulty increments at a significantly lower rate compared to all other regions (e.g. `Enemy Level = 1 + floor(Region.Clears / 8)` and enemy stats scale by `1.04^(Level - 1)`, compared to standard `/3` clears and `1.1` multiplier). Designed as a persistent, low-risk farming zone where players can send heroes to earn stable (though smaller) XP and gather basic materials safely until they feel ready to tackle higher-difficulty regions.
*   **Unique Enemy Lineup**:
    *   *Green Slime*: High accuracy, slow speed, standard physical strikes.
    *   *Wild Boar*: High physical damage but poor accuracy.
*   **Loot Profile**: High yield of basic food grains (`food_raw_grain`) and basic wood (`material_wood`).
*   **Glyph Drop Table**: `None` (All magic/glyph features are locked to designated magic regions).
*   **Unlock Condition**: Available by default at game start.

#### Region 2: Tiny Cave (`reg_tiny_cave`)
*   **Theme**: "The Whispering Burrow" — Damp, claustrophobic caverns filled with echoey chambers.
*   **Mechanical Challenge**: Introduction to status effects. Enemies utilize physical poison and blinding web attacks, requiring the player to prioritize speed or deploy quick healers. Normal scaling.
*   **Unique Enemy Lineup**:
    *   `bat_small` (Small Bat): Fast, evasive, drains small amounts of HP.
    *   `spider_minor` (Minor Spider): Applies minor poison damage over time and reduces hero accuracy.
*   **Loot Profile**: Basic stone (`material_stone`), basic wood (`material_wood`), and Gold.
*   **Glyph Drop Table**: `None` (All magic/glyph features are locked to designated magic regions).
*   **Unlock Condition**: Complete `exp_tutorial_cave` Story Mission.

#### Region 3: Calmed Beach (`reg_calmed_beach`)
*   **Theme**: "The Shimmering Coast" — Sandy shorelines with high tides and glowing sea caves.
*   **Mechanical Challenge**: Physical block and healing. Crabs block physical attacks with high physical defense shields, while water spirits heal their allies.
*   **Unique Enemy Lineup**:
    *   `crab_shell` (Shell Crab): High defense; uses a shield stance that increases physical damage resistance.
    *   `water_spirit_minor` (Minor Water Spirit): Casts minor water spells and regenerates HP of low-health allies.
    *   `murloc_shore` (Shore Murloc): Fast strikes that target the weakest hero.
    *   `slime_earth` (Earth Slime): Slow, high defense.
*   **Loot Profile**: Raw food grain (`food_raw_grain`) and Gold.
*   **Glyph Drop Table**: `None` (All magic/glyph features are locked to designated magic regions).
*   **Unlock Condition**: 3 Greenfields clears OR Explorer Guild Level 1.

#### Region 4: Dark Forest (`reg_dark_forest`)
*   **Theme**: "The Goblin Woods" — Gloomy, dense forest paths overgrown with thorned briars.
*   **Mechanical Challenge**: Guerilla tactics and physical speed gates. Forest wolves and goblin scouts strike quickly, bypass turn priority, and attempt to overwhelm the party with frequent attacks.
*   **Unique Enemy Lineup**:
    *   `goblin_scout` (Goblin Scout): High speed, targets low-HP heroes with piercing arrows.
    *   `goblin_grunt` (Goblin Grunt): Moderate defense, attacks with rusted daggers.
    *   `wild_boar` (Wild Boar): Heavy ramming attacks that can temporarily stun heroes.
*   **Loot Profile**: Standard wood (`material_wood`) and basic stone (`material_stone`).
*   **Glyph Drop Table**: `None` (All magic/glyph features are locked to designated magic regions).
*   **Unlock Condition**: 2 Tiny Cave clears.

#### Region 5: Goblin Camp (`reg_goblin_camp`)
*   **Theme**: "The War Camp" — A heavily fortified goblin settlement surrounded by wooden palisades.
*   **Mechanical Challenge**: High-density squads and combat synchronization. Goblin brutes tank damage while goblin slingers debuff the party and shamans cast element-amplified spells.
*   **Unique Enemy Lineup**:
    *   `goblin_brute` (Goblin Brute): Extremely high HP and physical defense; taunts heroes to focus attacks on them.
    *   `goblin_shaman` (Goblin Shaman): Casts fire spells and buffs the physical damage of the brutes.
    *   `goblin_slinger` (Goblin Slinger): Drops stones that reduce hero speed and accuracy.
    *   `goblin_king` (Goblin King - Boss): Launches high physical AoE swings.
*   **Loot Profile**: Iron ore (`material_iron_ore`), standard wood (`material_wood`), and Gold.
*   **Glyph Drop Table**: `None` (All magic/glyph features are locked to designated magic regions).
*   **Unlock Condition**: 3 Dark Forest clears OR Explorer Guild Level 2.

#### Region 6: Mystic Ruins (`reg_mystic_ruins`)
*   **Theme**: "The Leyline Sanctum" — Crumbling marble chambers floating over leyline cracks.
*   **Mechanical Challenge**: Spellcasting and magic barriers. Skeletons resist physical attacks, and spectral wisps cast magic spells that pierce physical defense.
*   **Unique Enemy Lineup**:
    *   `skeleton_warrior` (Skeleton Warrior): Highly resistant to physical slashing; vulnerable to magic.
    *   `ghost_wisp` (Ghost Wisp): Ethereal (physical attacks have a high miss rate); casts magic spells that drain MP.
    *   `water_spirit_minor` (Minor Water Spirit): Casts water spells that apply speed-reducing status effects.
*   **Loot Profile**: Basic stone (`material_stone`) and Gold.
*   **Glyph Drop Table**: Basic Spells Kit:
    *   *Core Elements*: `glyph_fire`, `glyph_water`, `glyph_earth`, `glyph_wind`, `glyph_light`.
    *   *Power*: `glyph_potentiate`, `glyph_extend`.
    *   *Effect*: `glyph_aegis` (ally inversion).
    *   *Efficiency*: `glyph_streamline` (cost reduction).
*   **Unlock Condition**: Rescuing Eldrin (Mage) from `exp_rescue_apprentice` Story Mission.

#### Region 7: Frozen Peaks (`reg_frozen_peaks`)
*   **Theme**: "The Shivering Summit" — Glacial peaks and frozen caves whipped by perpetual blizzards.
*   **Mechanical Challenge**: Severe status effects. Ice elementals apply freezing status effects that slow down turns, while frost wolves attack in fast packs.
*   **Unique Enemy Lineup**:
    *   `ice_elemental` (Ice Elemental): Slow but casts freezing shards that reduce hero Speed by 50% for 2 turns.
    *   `frost_wolf` (Frost Wolf): Fast, attacks in groups; gains a damage boost against targets with reduced Speed.
    *   `stone_golem` (Stone Golem): High defense, immune to all physical status effects.
*   **Loot Profile**: Basic stone (`material_stone`) and iron ore (`material_iron_ore`).
*   **Glyph Drop Table**: `None` (All magic/glyph features are locked to designated magic regions).
*   **Unlock Condition**: Explorer Guild Level 2 OR 8 total clears.

#### Region 8: Whispering Forest (`reg_whispering_forest`)
*   **Theme**: "The Eldertree Grove" — A dense wood glowing with emerald fireflies.
*   **Mechanical Challenge**: Sustainability and healing. Beasts regenerate health rapidly, and toxic plants apply poison status effects.
*   **Unique Enemy Lineup**:
    *   `rabbit_horned` (Horned Rabbit): Fast, regenerates HP slightly every turn.
    *   `wolf_alpha` (Alpha Wolf): Gains attack power as its health decreases.
    *   `slime_earth` (Earth Slime): Splits into minor slimes upon taking heavy physical damage.
*   **Loot Profile**: Standard wood (`material_wood`) and raw food grain (`food_raw_grain`).
*   **Glyph Drop Table**: `None` (All magic/glyph features are locked to designated magic regions).
*   **Unlock Condition**: 5 Greenfields clears OR Explorer Guild Level 1.

#### Region 9: Murky Swamp (`reg_murky_swamp`)
*   **Theme**: "The Poisoned Fen" — Stagnant waters under a canopy of weeping willows.
*   **Mechanical Challenge**: Debuffs and poison damage over time. Goblins use blowpipes to poison heroes, and swamp zombies absorb physical damage.
*   **Unique Enemy Lineup**:
    *   `zombie_rotter` (Rotting Zombie): Absorbs physical damage; explodes in a cloud of poison upon death.
    *   `murloc_shore` (Shore Murloc): Strikes with mud attacks that reduce accuracy and crit chance.
    *   `goblin_shaman` (Goblin Shaman): Casts a chain poison spell that targets the entire party.
*   **Loot Profile**: Standard wood (`material_wood`) and basic stone (`material_stone`).
*   **Glyph Drop Table**: `None` (All magic/glyph features are locked to designated magic regions).
*   **Unlock Condition**: 4 Dark Forest clears.

#### Region 10: Forgotten Ruins (`reg_forgotten_ruins`)
*   **Theme**: "The Shadowed Halls" — A deep dungeon of obsidian pillars and forgotten tombs.
*   **Mechanical Challenge**: Dark magic and debuffs. Liches cast draining spells that siphon HP and MP, while cultists shield their masters.
*   **Unique Enemy Lineup**:
    *   `skeleton_warrior` (Skeleton Warrior): Defends with iron shields.
    *   `ghost_wisp` (Ghost Wisp): Drains hero MP on contact.
    *   `cultist_acolyte` (Cultist Acolyte): Channels defensive barriers on bosses.
    *   `lich_apprentice` (Lich Apprentice - Boss): Casts dark magic that hits the entire party and reduces magic defense.
*   **Loot Profile**: Gold and iron ore (`material_iron_ore`).
*   **Glyph Drop Table**: Advanced Spells Kit:
    *   *Core Elements*: `glyph_dark`.
    *   *Effect*: `glyph_multi` (AoE targeting), `glyph_pierce` (ignore defense), `glyph_venom` (poison stacks), `glyph_slumber` (sleep chance).
*   **Unlock Condition**: 6 Mystic Ruins clears OR Explorer Guild Level 2.

---

### 2.2 Planned Regions (Tiers 6–10)

#### Region 11: Stony Foothills (`reg_stony_foothills`)
*   **Theme**: "The Jagged Paths" — Dry valleys with rocky debris.
*   **Mechanical Challenge**: Armor and physical resistance. Stone beasts absorb blunt attacks, requiring slashing damage or magic to crack.
*   **Unique Enemy Lineup**:
    *   `slime_earth` (Earth Slime): High defense, slow movements.
    *   `stone_golem` (Stone Golem): High armor and blunt strike resistance.
    *   `wild_boar` (Wild Boar): Heavy physical charges.
    *   `goblin_grunt` (Goblin Grunt): Normal physical attacks.
*   **Loot Profile**: Basic stone (`material_stone`) and iron ore (`material_iron_ore`).
*   **Glyph Drop Table**: `None`
*   **Unlock Condition**: Blacksmith Level 1 AND 10 total clears.

#### Region 12: Iron Peaks (`reg_iron_peaks`)
*   **Theme**: "The Crags of Iron" — High mountain passes with exposed iron veins and stormy skies.
*   **Mechanical Challenge**: High-impact physical attacks and stuns. Mountain trolls and armored orcs deal massive physical damage that can break through standard defenses.
*   **Unique Enemy Lineup**:
    *   `goblin_brute` (Goblin Brute): Heavy physical hits; taunts heroes.
    *   `goblin_shaman` (Goblin Shaman): Casts storm spells that chain-damage the party.
    *   `stone_golem` (Stone Golem): Massive armor and defense.
    *   `ghost_wisp` (Ghost Wisp): Evades physical attacks; drains hero MP.
    *   `mountain_troll` (Mountain Troll - Boss): Regenerates HP; delivers massive crushing strikes.
*   **Loot Profile**: Iron ore (`material_iron_ore`) and steel ingots (`material_steel_ingot`).
*   **Glyph Drop Table**: `None`
*   **Unlock Condition**: Blacksmith Level 1 AND 12 total clears.

#### Region 13: Crystal Hollow (`reg_crystal_hollow`)
*   **Theme**: "The Prism Caverns" — A dazzling cavern of giant, glowing multi-colored crystals.
*   **Mechanical Challenge**: Spell absorption and reflection. Crystal elementals absorb spells of matching elements and reflect a portion of physical damage taken.
*   **Unique Enemy Lineup**:
    *   `ghost_wisp` (Ghost Wisp): High evasion; deals neutral magic damage.
    *   `ice_elemental` (Ice Elemental): Absorbs elemental water/frost damage and reflects minor damage.
    *   `water_spirit_minor` (Minor Water Spirit): Casts minor support spells.
    *   `stone_golem` (Stone Golem): Heavy sentinel.
    *   `lich_apprentice` (Lich Apprentice - Boss): Casts powerful elemental magic.
*   **Loot Profile**: Gold and steel ingots (`material_steel_ingot`).
*   **Glyph Drop Table**: Intermediate Magic Kit:
    *   *Core Elements*: `glyph_storm`.
    *   *Power*: `glyph_focus`.
    *   *Effect*: `glyph_celerity` (speed buff), `glyph_leech` (lifesteal), `glyph_reflect` (reflect barrier).
*   **Unlock Condition**: Magic Circle system unlocked AND 15 total clears.

#### Region 14: Great Desert (`reg_great_desert`)
*   **Theme**: "The Whispering Dunes" — A vast desert of gold sand dunes and scorching winds.
*   **Mechanical Challenge**: Sandstorm exhaustion and accuracy debuffs. Sandstorms reduce party accuracy by 30%, and desert beasts inflict burn status effects that deplete stamina.
*   **Unique Enemy Lineup**:
    *   `goblin_scout` (Goblin Scout): Fast desert skirmisher.
    *   `goblin_slinger` (Goblin Slinger): Launches stones that blind and slow heroes.
    *   `slime_fire` (Fire Slime): Applies burning effects on physical contact.
    *   `wild_boar` (Wild Boar): Heavy physical charges.
    *   `goblin_king` (Goblin King - Boss): Swings massive scimitars that damage all heroes.
*   **Loot Profile**: Gold and gold ore (`material_gold_ore`).
*   **Glyph Drop Table**: `None`
*   **Unlock Condition**: Explorer Guild Level 2 AND 18 total clears.

#### Region 15: Obsidian Crater (`reg_obsidian_crater`)
*   **Theme**: "The Volcanic Mouth" — The active volcanic crater of dark glass and lava rivers.
*   **Mechanical Challenge**: Extreme burn damage and high defense. Lava elementals burn heroes on contact, and obsidian golems have extreme physical defense.
*   **Unique Enemy Lineup**:
    *   `slime_fire` (Fire Slime): High element damage; immune to fire.
    *   `young_drake` (Young Drake): High health; fires volcanic breath.
    *   `cultist_acolyte` (Cultist Acolyte): Shields elemental allies.
    *   `stone_golem` (Stone Golem): Immune to all standard debuffs.
*   **Loot Profile**: Gold ore (`material_gold_ore`) and steel ingots (`material_steel_ingot`).
*   **Glyph Drop Table**: `None`
*   **Unlock Condition**: Blacksmith Level 1 AND 20 total clears.

#### Region 16: Ancient Library (`reg_ancient_library`)
*   **Theme**: "The Silent Archives" — A massive subterranean archive of stone bookshelves and glowing leyline scrolls.
*   **Mechanical Challenge**: Spell cancellation and silence status effects. Holographic librarians silence mages, blocking spellcasting, and golems guard the corridors.
*   **Unique Enemy Lineup**:
    *   `skeleton_warrior` (Skeleton Warrior): Resists physical damage.
    *   `ghost_wisp` (Ghost Wisp): Silences spellcasters on turn resolution.
    *   `cultist_acolyte` (Cultist Acolyte): Channels magic barriers on front liners.
    *   `lich_apprentice` (Lich Apprentice): Casts powerful multi-target debuffs.
    *   `stone_golem` (Stone Golem - Boss): The grand archivist golem; highly resistant to magic.
*   **Loot Profile**: Gold and gold ore (`material_gold_ore`).
*   **Glyph Drop Table**: `None` (Progression of glyph tiers is purely usage-based. Instead, clears here grant ancient blueprints for advanced village buildings).
*   **Unlock Condition**: Arcane Sanctum Level 3 AND 22 total clears.

#### Region 17: Frostbite Tundra (`reg_frostbite_tundra`)
*   **Theme**: "The Glacial Plains" — A barren tundra swept by freezing winds.
*   **Mechanical Challenge**: Speed reduction and physical freeze. Enemies reduce hero speed and freeze targets, skipping their turns.
*   **Unique Enemy Lineup**:
    *   `frost_wolf` (Frost Wolf): Inflicts speed-slowing bites.
    *   `ice_elemental` (Ice Elemental): Applies frostbite that reduces target speed by 10% per stack.
    *   `stone_golem` (Stone Golem): High armor.
    *   `bat_small` (Small Bat): Fast, drains stamina.
    *   `mountain_troll` (Mountain Troll - Boss): Swings frozen clubs that freeze targets.
*   **Loot Profile**: Steel ingots (`material_steel_ingot`) and gold ore (`material_gold_ore`).
*   **Glyph Drop Table**: `None`
*   **Unlock Condition**: Explorer Guild Level 2 AND 25 total clears.

#### Region 18: Sky Fortress (`reg_sky_fortress`)
*   **Theme**: "The Floating Citadel" — A ruined sky fortress suspended by floating wind crystals.
*   **Mechanical Challenge**: Evasion and speed. Sky knights have high evasion, and wind spirits push back hero turns.
*   **Unique Enemy Lineup**:
    *   `ghost_wisp` (Ghost Wisp): High evasion; drains MP.
    *   `cultist_acolyte` (Cultist Acolyte): Casts wind barriers that increase evasion of allies.
    *   `frost_wolf` (Frost Wolf): Evasive cloud wolves.
    *   `goblin_slinger` (Goblin Slinger): Strikes fast from range.
    *   `lich_apprentice` (Lich Apprentice - Boss): Casts storm magic that slows down hero turn frequency.
*   **Loot Profile**: Gold ore (`material_gold_ore`) and mythril (`material_mythril`).
*   **Glyph Drop Table**: `None`
*   **Unlock Condition**: Explorer Guild Level 2 AND 28 total clears.

#### Region 19: Dragon's Maw (`reg_dragon_maw`)
*   **Theme**: "The Volcanic Peak" — A dark crag littered with bones and active lava vents, home to ancient dragons.
*   **Mechanical Challenge**: End-game hybrid bosses. Heavy physical claws combined with high-damage elemental fire breath.
*   **Unique Enemy Lineup**:
    *   `young_drake` (Young Drake): Spews fire breath dealing massive party-wide damage.
    *   `slime_fire` (Fire Slime): Explodes on defeat.
    *   `cultist_acolyte` (Cultist Acolyte): Boosts drake attack values.
    *   `stone_golem` (Stone Golem): Blocks physical strikes.
    *   `mountain_troll` (Mountain Troll - Boss): The dragon tamer.
*   **Loot Profile**: Mythril (`material_mythril`) and Gold.
*   **Glyph Drop Table**: `None`
*   **Unlock Condition**: Tavern Level 1 AND Explorer Guild Level 2 AND 30 total clears.

#### Region 20: Tower of Nightmares (`reg_nightmare_tower`)
*   **Theme**: "The Abyssal Spire" — A dark, towering structure pulsing with corrupting energy that stretches infinitely into the sky.
*   **Mechanical Challenge & Scaling**: **Hyper-Scaling Checkpoint**. While the first floor can be completed by Area 1 heroes, the difficulty scales aggressively at **250% to 300% per clear** (e.g., `Enemy Level = 1 + Region.Clears * 3`, with stat multipliers scaling exponentially by `2.5^Clears`). Completing a floor acts as a hard milestone check, forcing players to run dozens of expeditions in normal regions to level up, forge gear, and refine spell matrices before attempting the next floor.
*   **Unique Enemy Lineup**:
    *   `skeleton_warrior` (Skeleton Sentry): High physical defenses.
    *   `ghost_wisp` (Nightmare Wisp): High magic evasion; drains MP.
    *   `zombie_rotter` (Decaying Hulk): Heavy poison burst upon defeat.
    *   `lich_apprentice` (Torment Summoner - Boss): Casts spells that slow and weaken heroes.
*   **Loot Profile**: Scaled raw materials (`material_iron_ore` on Floor 1, `material_steel_ingot` on Floor 2, `material_gold_ore` on Floor 3, `material_mythril` on Floor 4+) and high Gold.
*   **Glyph Drop Table**: `None`
*   **Unlock Condition**: Unlocked via the Story Mission `exp_discover_nightmare_tower` after 5 total clears in Area 1.

---

## 3. Progression Path & Campaign Structure

To ensure a deep, engaging gameplay experience, the game features a long-form campaign divided into **Four Thematic Areas**. Each area contains a series of hand-crafted **Story Missions** injected into procedural maps at specific clearance milestones. Completing these missions progresses the narrative, rescues key villagers/heroes, and unlocks advanced infrastructure.

### 3.1 The Four Campaign Areas & Story Mission Flow

```
[AREA 1: The Frontier Plains & Caves] (Missions 1.1 - 1.8)
       │
       ▼ (Defeat the Beach Head Chieftain)
[AREA 2: The Whispering Woods & Goblin Wastes] (Missions 2.1 - 2.7)
       │
       ▼ (Defeat the Goblin King at the Fortress)
[AREA 3: The Leyline Sanctuary & Ruins] (Missions 3.1 - 3.6)
       │
       ▼ (Stabilize the Leyline Convergence)
[AREA 4: The Shattered Highlands & Dragon Peaks] (Missions 4.1 - 4.7)
```

---

### 3.2 Story Missions Specification

#### Area 1: The Frontier Plains & Caves (Missions 1.1 – 1.8)

##### Story Mission 1.1: The Captured Guard (`exp_rescue_mission`)
*   **Location**: `reg_greenfields` (Milestone: Clear 1 Greenfield)
*   **Requirements**: Default starting quest.
*   **Storyboard Panels**:
    *   *Panel 1: The Cage*: Arthur stands before a goblin war camp, spotting Sir Valen locked inside a crude wooden cage.
    *   *Panel 2: The Skirmish*: Arthur fights through goblin scouts, parrying strikes to cut a path to the cage.
    *   *Panel 3: Rescued*: Arthur smashes the lock; Sir Valen steps out, retrieves his shield, and salutes.
*   **Dialogue Completion Text**:
    *   *"A crucial ally has joined our sanctuary. Sir Valen, a veteran guard of the collapsed kingdom, was rescued from a goblin vanguard cage in the sunlit Greenfields. With his shield and military discipline, he pledges to train our settlers. To prepare for the threats gathering beyond the valley's gates, Sir Valen guides our builders to construct the Blacksmith, unlocking our ability to forge equipment and arm our defenders. Sir Valen suggests sending scouts to investigate the southern coastline, where other refugees may have fled the attack."*
*   **Reward Table**: Gold: `200`, Materials: `15 material_wood, 5 material_stone`, Special: **Hero Unlocked: Sir Valen (Guard, Lvl 1)**, Unlocks: `blacksmith` blueprint.

##### Story Mission 1.2: The Shoreline Scourge (`exp_shoreline_scourge`)
*   **Location**: `reg_calmed_beach` (Milestone: Clear 3 Greenfields)
*   **Requirements**: Complete `exp_rescue_mission`.
*   **Storyboard Panels**:
    *   *Panel 1: The Ruined Huts*: Ruined coastal fishing huts stand abandoned as minor water spirits and shell crabs swarm the sands.
    *   *Panel 2: Clearing the Tide*: The party coordinate strikes to shatter the shells of the crabs and disperse the spirits.
    *   *Panel 3: Restored Shore*: A group of fisher-refugees return to the shore, throwing their nets into the calm waters.
*   **Dialogue Completion Text**:
    *   *"We have reclaimed the southern coastline. By driving back the elemental creatures and crabs blockading the cove, our fisher-refugees can safely harvest the sea. Their expertise in cultivating coastal grains and drying seaweed allows our farmers to upgrade their crop rotation. This unlocks the Farm Level 2 upgrade, boosting our daily food production. The rescued fishermen mention seeing strange, glowing runic reflections flickering deep within the nearby caverns. We should send a team to explore the depths of the Tiny Cave."*
*   **Reward Table**: Gold: `300`, Materials: `20 food_raw_grain`, Unlocks: `farm` Level 2 upgrade option.

##### Story Mission 1.3: The Cage of Whispers (`exp_rescue_apprentice`)
*   **Location**: `reg_tiny_cave` (Milestone: Clear 2 Tiny Caves)
*   **Requirements**: Complete `exp_rescue_mission` and unlock `reg_tiny_cave`.
*   **Storyboard Panels**:
    *   *Panel 1: Runic Imprisonment*: In a deep cave chamber, a young apprentice is curled inside a cage of pulsing magical runes.
    *   *Panel 2: Bat Swarm*: A flock of small bats and a goblin brute emerge from the cavern's ceiling. Sir Valen blocks the strikes while Arthur attacks.
    *   *Panel 3: Magical Spark*: Eldrin is freed. He points to glowing lines of mana humming along the stone cavern walls.
*   **Dialogue Completion Text**:
    *   *"Deep within the damp caverns of the Tiny Cave, we broke a runic leyline cage to free Eldrin, a young initiate of the Arcane Academy. Eldrin immediately senses the convergence of raw magic veins pulsing underneath our valley. To focus this wild energy into stable spellcasting glyphs for our heroes, Eldrin establishes our first magical channel. This unlocks the blueprints for the Witch's Hut, introducing the Magic Circle system and opening the path to the Mystic Ruins where raw glyph energy flows. Eldrin warns that bandit scouts are blockading the main southern highway in the sunlit fields. We must clear this road before we can establish secure trade routes."*
*   **Reward Table**: Gold: `300`, Materials: `10 material_wood, 10 material_stone`, Special: **Hero Unlocked: Eldrin (Arcane Initiate, Lvl 1)**, Unlocks: `witchs_hut` blueprint, Unlocks Region: `reg_mystic_ruins`.

##### Story Mission 1.4: The Bandit Highway (`exp_bandit_highway`)
*   **Location**: `reg_greenfields` (Milestone: Clear 5 Greenfields)
*   **Requirements**: Complete `exp_rescue_apprentice`.
*   **Storyboard Panels**:
    *   *Panel 1: The Blockade*: A barricade of overturned carts and logs blocks the primary trade road leading into the valley.
    *   *Panel 2: Breaking the Wall*: The party charges the highwaymen, scattering their line and throwing their barricades aside.
    *   *Panel 3: Safe Passage*: A merchant wagon rolls safely through the cleared path, loaded with storage crates.
*   **Dialogue Completion Text**:
    *   *"The southern highway is safe once more. The bandits blockading our border have been routed, and their stolen storage blueprints have been recovered. With these architectural drafts, our builders can reinforce our logistics networks. This unlocks the Warehouse Level 2 upgrade, allowing us to double our maximum storage limits. Deciphered letters from the bandit leader speak of a dark stone monolith that has erupted on the northern plains. Once our survivors gain more combat experience across the valley, we should seek out this strange obelisk."*
*   **Reward Table**: Gold: `500`, Materials: `20 material_wood, 10 material_stone`, Unlocks: `warehouse` Level 2 upgrade option.

##### Story Mission 1.5: Discovery of the Spire (`exp_discover_nightmare_tower`)
*   **Location**: `reg_nightmare_tower` (Story Override Instance)
*   **Requirements**: 5 total clears across any Area 1 regions.
*   **Storyboard Panels**:
    *   *Panel 1: The Dark Monolith*: A dark stone spire erupts from the northern plains, surrounded by black mist.
    *   *Panel 2: Terrifying Aura*: The heroes approach the massive obsidian gate, feeling a chill that freezes their blood.
    *   *Panel 3: The Gateway*: The gate remains shut, but a glowing portal hums, waiting for brave souls to step inside.
*   **Dialogue Completion Text**:
    *   *"We discovered a very terrifying place... looks like every step inner that we could make there, will be so hard to handle... The intense chill radiating from the portal warns us that only prepared heroes can survive this ascent. Our scouts report that a lost tracker went missing inside the Tiny Cave tunnels; finding him may be key to optimizing our routes before we proceed."*
*   **Reward Table**: Gold: `500`, Special: **Unlocked Region: `reg_nightmare_tower` (Tower of Nightmares)**.

##### Story Mission 1.6: The Lost Scout (`exp_lost_scout`)
*   **Location**: `reg_tiny_cave` (Milestone: Clear 4 Tiny Caves)
*   **Requirements**: Complete `exp_bandit_highway`.
*   **Storyboard Panels**:
    *   *Panel 1: Caught in the Web*: A village scout is wrapped in a thick, sticky cocoon of spider silk in a dark cavern corner.
    *   *Panel 2: Spider Nest*: A nest of minor spiders surges forward. Eldrin casts a fire burst, burning away the webs and holding them back.
    *   *Panel 3: Cut Free*: Arthur cuts the cocoon open, freeing the scout, who retrieves a crude compass and maps the tunnels.
*   **Dialogue Completion Text**:
    *   *"We have rescued our chief tracker from the spider nests of the Tiny Cave. Grateful for his rescue, he pledges to establish a scouting network at our Explorer's Guild. By assigning villagers to act as scouts, they can map out expeditions ahead of time, reducing the dangers and stage count of all future journeys. The rescued tracker points out that the coastal tides have washed up reinforced crates from a sunken vessel on the Calmed Beach, which could contain valuable resources for our builders."*
*   **Reward Table**: Gold: `400`, Materials: `15 material_wood`, Unlocks: **Feature: Scout Assignment** (allows assigning workers to scouts to reduce expedition stage counts).

##### Story Mission 1.7: The Sunken Cargo (`exp_sunken_cargo`)
*   **Location**: `reg_calmed_beach` (Milestone: Clear 4 Calmed Beach)
*   **Requirements**: Complete `exp_lost_scout`.
*   **Storyboard Panels**:
    *   *Panel 1: The Wreckage*: The mast of a cargo vessel sticks out of the shallow bay waters, surrounded by floating crates.
    *   *Panel 2: Deep Salvage*: The heroes wade through the tides, battling shore murlocs while drag-roping the heavy iron-reinforced chests to shore.
    *   *Panel 3: Secured Spoils*: The crates are opened, revealing preserved building plans and salvage tools.
*   **Dialogue Completion Text**:
    *   *"A treasure from the deep has been recovered. By clearing the murlocs guarding the bay wreckage, we salvaged high-grade building logs and salvage tools. These tools allow our builders to reclaim materials from discarded projects, boosting construction efficiency across the village. The ship's log indicates that the murloc tribes are gathering in force at the beach head. We must strike their encampment to secure the coast permanently."*
*   **Reward Table**: Gold: `600`, Materials: `30 material_wood, 15 material_stone`.

##### Story Mission 1.8: Area Climax - The Beach Head (`exp_beach_head`)
*   **Location**: `reg_calmed_beach` (Milestone: Clear 6 Calmed Beach)
*   **Requirements**: Complete `exp_sunken_cargo`.
*   **Storyboard Panels**:
    *   *Panel 1: The Murloc Tide*: A massive gathering of shore murlocs is led by a towering, trident-wielding chieftain standing on the beach.
    *   *Panel 2: The Clash*: The heroes engage the horde; Sir Valen absorbs the chieftain's water strikes while Arthur delivers a heavy counter-attack.
    *   *Panel 3: Path Forward*: The chieftain retreats into the ocean. The beach is secured, revealing trails leading north into the dark forests.
*   **Dialogue Completion Text**:
    *   *"The coastal threat is neutralized. By defeating the murloc chieftain at the beach head, we have secured our southern border permanently. The path leading north into the deep timberlands is now open, allowing us to venture into the Dark Forest and Whispering Forest to gather richer resources. With the coast secured, Sir Valen points to the northern timberlands. He advises venturing into the Dark Forest to collect timber, and warns that we will need to establish an Infirmary to heal our wounds as the fights grow fiercer."*
*   **Reward Table**: Gold: `800`, Materials: `20 material_wood, 20 material_stone`, Unlocks Regions: `reg_dark_forest`, `reg_whispering_forest`.

---

#### Area 2: The Whispering Woods & Goblin Wastes (Missions 2.1 – 2.7)

##### Story Mission 2.1: The Woods Ambush (`exp_woods_ambush`)
*   **Location**: `reg_dark_forest` (Milestone: Clear 1 Dark Forest)
*   **Requirements**: Area 2 unlocked.
*   **Storyboard Panels**:
    *   *Panel 1: The Timber Blockade*: Goblins have established a log barricade, blocking the flow of lumberjacks into the rich pine groves.
    *   *Panel 2: Clearing the Woods*: The party engages the goblin scouts, dodging arrows and using spell fire to break their wooden fort.
    *   *Panel 3: Safe Logging*: Lumberjacks return to the forest with their axes, bringing wagonloads of high-quality wood back to the village.
*   **Dialogue Completion Text**:
    *   *"The timber supply line is secure. By clearing the goblin raiders blockading the Dark Forest groves, we have established permanent logging routes. The constant flow of high-quality timber increases all future wood gathering yields by +20%."*
*   **Reward Table**: Gold: `500`, Materials: `40 material_wood`, Special: **Passive: +20% Wood Gathering Efficiency**.

##### Story Mission 2.2: The Herb Gatherer (`exp_herb_gatherer`)
*   **Location**: `reg_whispering_forest` (Milestone: Clear 2 Whispering Forest)
*   **Requirements**: Complete `exp_woods_ambush`.
*   **Storyboard Panels**:
    *   *Panel 1: Surrounded*: An elderly herbalist is trapped on a high boulder as horned rabbits and a wild boar circle below.
    *   *Panel 2: Rescue*: Arthur charges the boar while Eldrin uses magic to soothe the hyper-aggressive rabbits.
    *   *Panel 3: Healing Touch*: The herbalist is escorted back, carrying baskets of glowing herbs and medicinal moss.
*   **Dialogue Completion Text**:
    *   *"We have rescued the herbalist from the beasts of the Whispering Forest. With her vast knowledge of poultices and wound dressing, she pledges to help our sick and wounded. She guides our builders to construct the Infirmary, allowing us to heal resting heroes much faster."*
*   **Reward Table**: Gold: `600`, Materials: `20 material_wood`, Unlocks: `infirmary` Level 1 blueprint.

##### Story Mission 2.3: The Goblin Outpost (`exp_goblin_outpost`)
*   **Location**: `reg_goblin_camp` (Milestone: Clear 2 Goblin Camps)
*   **Requirements**: Complete `exp_herb_gatherer` and unlock `reg_goblin_camp`.
*   **Storyboard Panels**:
    *   *Panel 1: The Scout Tower*: Goblins stand watch on a wooden tower, preparing signals to coordinate raids on our village.
    *   *Panel 2: Burning the Signal*: The party infiltrates the camp. Eldrin ignites the tower, burning their signaling banners before they can alert the horde.
    *   *Panel 3: Broken Watch*: The outpost lies in ruins, delaying goblin raid preparations.
*   **Dialogue Completion Text**:
    *   *"The goblin signaling network is broken. By destroying their watchtower, we have severely disrupted their ability to coordinate raids. This gives our guards more time to prepare, reducing the difficulty and frequency of incoming border raids."*
*   **Reward Table**: Gold: `800`, Materials: `15 material_stone, 10 material_iron_ore`.

##### Story Mission 2.4: The Quarantined Fen (`exp_quarantined_fen`)
*   **Location**: `reg_murky_swamp` (Milestone: Clear 3 Murky Swamps)
*   **Requirements**: Complete `exp_goblin_outpost` and unlock `reg_murky_swamp`.
*   **Storyboard Panels**:
    *   *Panel 1: The Sickly Spring*: A bubbling swamp spring is surrounded by rotting zombies, oozing toxic slime that corrupts the water.
    *   *Panel 2: Purifying the Waters*: Eldrin channels a purification spell while Arthur and Sir Valen form a defensive circle against the undead.
    *   *Panel 3: Clear Waters*: The toxic slime is dissolved, and the spring flows with clean, mineral-rich water.
*   **Dialogue Completion Text**:
    *   *"The swamp spring has been purified. By neutralizing the toxic source, we have secured clean water and discovered rare medicinal muds. Our herbalists can use this to concoct advanced healing drafts. This unlocks the Infirmary Level 2 upgrade, boosting recovery rates."*
*   **Reward Table**: Gold: `1000`, Materials: `30 material_wood, 15 material_stone`, Unlocks: `infirmary` Level 2 upgrade option.

##### Story Mission 2.5: The Quarry Defense (`exp_quarry_defense`)
*   **Location**: `reg_stony_foothills` (Milestone: Clear 3 Stony Foothills)
*   **Requirements**: Complete `exp_quarantined_fen` and unlock `reg_stony_foothills`.
*   **Storyboard Panels**:
    *   *Panel 1: Stones Under Siege*: Earth slimes and stone golems have blockaded the quarry, trapping our miners inside.
    *   *Panel 2: Cracking the Golems*: The heroes smash through the stone golems, utilizing heavy strikes to shatter their cores.
    *   *Panel 3: Quarry Resumed*: The miners emerge safely, hauling carts of iron ore and heavy stones.
*   **Dialogue Completion Text**:
    *   *"The stone quarries are secured. By defeating the stone golems blockading the Jagged Paths, our miners can extract high-quality granite and iron veins. This unlocks permanent transport routes, increasing all future stone gathering yields by +20%."*
*   **Reward Table**: Gold: `1200`, Materials: `40 material_stone`, Special: **Passive: +20% Stone Gathering Efficiency**, Unlocks Region: `reg_iron_peaks`.

##### Story Mission 2.6: The War Drums (`exp_war_drums`)
*   **Location**: `reg_goblin_camp` (Milestone: Clear 5 Goblin Camps)
*   **Requirements**: Complete `exp_quarry_defense`.
*   **Storyboard Panels**:
    *   *Panel 1: The Drum Platform*: Giant leather drums are beaten by goblin slingers, whipping the goblin grunts into a battle frenzy.
    *   *Panel 2: Silencing the Beats*: The party strikes the drummers, parrying their slings and splitting the massive drums in half.
    *   *Panel 3: Dispersed Horde*: Without the drum beats, the goblins scatter in confusion and panic.
*   **Dialogue Completion Text**:
    *   *"The war drums are silent. By destroying the war drums in their camp, we have broken the goblins' morale and intercepted a large chest of iron ore intended for their weapons. This secures our northern perimeter for the final assault."*
*   **Reward Table**: Gold: `1500`, Materials: `30 material_iron_ore`.

##### Story Mission 2.7: Area Climax - The Goblin Fortress (`exp_goblin_fortress`)
*   **Location**: `reg_goblin_camp` (Milestone: Clear 7 Goblin Camps)
*   **Requirements**: Complete `exp_war_drums`.
*   **Storyboard Panels**:
    *   *Panel 1: The King's Court*: The massive Goblin King sits on a throne of bone and wood, swinging a heavy club as his guards surround him.
    *   *Panel 2: The King's Fall*: Sir Valen taunts the king, blocking his massive swings, while Arthur delivers the finishing strike.
    *   *Panel 3: Reclaimed Spoil*: The king falls, dropping a massive chest of iron and ancient artifacts pointing toward the ruins.
*   **Dialogue Completion Text**:
    *   *"The Goblin King is defeated. With his fall, the goblin horde has fractured and fled the valley, ending their reign of terror. In the ruins of his throne room, we discovered ancient stone tablets detailing the leyline grid leading to the Forgotten Ruins, opening the path to the ancient magical sectors."*
*   **Reward Table**: Gold: `2000`, Materials: `40 material_stone, 20 material_iron_ore`, Unlocks Regions: `reg_forgotten_ruins`, `reg_stony_foothills`.

---

#### Area 3: The Leyline Sanctuary & Ruins (Missions 3.1 – 3.6)

##### Story Mission 3.1: The Sealed Vault (`exp_sealed_vault`)
*   **Location**: `reg_mystic_ruins` (Milestone: Clear 2 Mystic Ruins)
*   **Requirements**: Area 3 unlocked.
*   **Storyboard Panels**:
    *   *Panel 1: The Vault Door*: A circular stone door carved with elemental ruins glows with a faint blue light.
    *   *Panel 2: Leyline Guardian*: A ghost wisp and a water spirit appear, attacking with magic beams. Eldrin counters with an energy shield.
    *   *Panel 3: The Seal Broken*: The door slides open, revealing a chamber containing glowing raw spell glyphs.
*   **Dialogue Completion Text**:
    *   *"We have breached the Sealed Vault of the ruins. By deactivating the magical guardians, we unlocked the chamber containing the core elemental glyphs. Eldrin can now transcribe these runes at the Arcane Sanctum, unlocking the basic damage glyphs: `glyph_fire` and `glyph_water`."*
*   **Reward Table**: Gold: `1000`, Materials: `30 material_stone`, Special: **Glyphs Unlocked: `glyph_fire`, `glyph_water`**.

##### Story Mission 3.2: The Whispering Pillars (`exp_whispering_pillars`)
*   **Location**: `reg_mystic_ruins` (Milestone: Clear 4 Mystic Ruins)
*   **Requirements**: Complete `exp_sealed_vault`.
*   **Storyboard Panels**:
    *   *Panel 1: Out of Attunement*: Three massive stone pillars hum out of tune, creating a localized magic storm that threatens the valley.
    *   *Panel 2: Attuning the Stone*: Eldrin channels mana into the pillars one by one, while Arthur protects him from attacking skeletons.
    *   *Panel 3: Clear Skies*: The pillars align, humming in harmony, and the magic storm dissipates into a gentle breeze.
*   **Dialogue Completion Text**:
    *   *"The Whispering Pillars are aligned. By stabilizing their resonance, we focused the ambient mana flow. This attunement allows Eldrin to craft modifier glyphs that adjust spell properties. This unlocks the utility glyphs: `glyph_extend` (range) and `glyph_streamline` (efficiency)."*
*   **Reward Table**: Gold: `1200`, Materials: `20 material_stone`, Special: **Glyphs Unlocked: `glyph_extend`, `glyph_streamline`**.

##### Story Mission 3.3: The Forgotten Tomb (`exp_forgotten_tomb`)
*   **Location**: `reg_forgotten_ruins` (Milestone: Clear 5 Forgotten Ruins)
*   **Requirements**: Complete `exp_whispering_pillars`.
*   **Storyboard Panels**:
    *   *Panel 1: The Crypt Door*: A heavy tomb door covered in ivy is surrounded by ghost wisps. Inside, a trapped woman clutching a lute stands her ground.
    *   *Panel 2: Undead Siege*: The party fights through undead skeletons and wisps. Eldrin's light spells pierce their spectral defenses.
    *   *Panel 3: Saved Song*: Lyra is freed. She strums her lute, playing a melody that restores the party's energy.
*   **Dialogue Completion Text**:
    *   *"Amidst the ivy-choked crypts of the Forgotten Ruins, we rescued Lyra the poet from spectral guardians. Carrying the oral history of our lost homeland, Lyra's melodies bring warmth and solace to our war-weary survivors. She tells us that if we build a proper Tavern, her songs of our peaceful sanctuary will echo far beyond the valley, drawing wandering refugees, mercenaries, and new heroes to join our growing community."*
*   **Reward Table**: Gold: `1500`, Materials: `10 material_iron_ore`, Special: **Hero Unlocked: Lyra (Poet, Lvl 2)**, Unlocks: `tavern` blueprint.

##### Story Mission 3.4: The Prism Core (`exp_prism_core`)
*   **Location**: `reg_crystal_hollow` (Milestone: Clear 4 Crystal Hollow)
*   **Requirements**: Complete `exp_forgotten_tomb` and unlock `reg_crystal_hollow`.
*   **Storyboard Panels**:
    *   *Panel 1: The Darkened Crystal*: A giant prism crystal at the center of the caverns is covered in a dark, corrupting shadow.
    *   *Panel 2: Reflective Battle*: The party battles crystal golems that reflect physical attacks. The heroes use magic to shatter their structures.
    *   *Panel 3: Blinding Light*: The prism is purified, refracting a brilliant rainbow of magical energy across the cavern.
*   **Dialogue Completion Text**:
    *   *"The Prism Core has been purified. By cleansing the crystal matrix, we unlocked advanced magical channels. Eldrin can now transcribe these complex reflections to craft defense-focused glyphs. This unlocks intermediate magic glyphs: `glyph_storm` (AoE) and `glyph_reflect` (damage barrier)."*
*   **Reward Table**: Gold: `1800`, Materials: `10 material_steel_ingot`, Special: **Glyphs Unlocked: `glyph_storm`, `glyph_reflect`**.

##### Story Mission 3.5: The Lich's Wake (`exp_lich_wake`)
*   **Location**: `reg_forgotten_ruins` (Milestone: Clear 7 Forgotten Ruins)
*   **Requirements**: Complete `exp_prism_core`.
*   **Storyboard Panels**:
    *   *Panel 1: The Dark Altar*: A Lich Apprentice hovers over a dark altar, chanting a spell to raise a skeleton army.
    *   *Panel 2: Breaking the Chant*: The heroes charge. Sir Valen blocks the Lich's death magic while Arthur strikes the ritual stones.
    *   *Panel 3: Crumbled Bones*: The Lich dissolves into dust, and the skeleton army crumbles into harmless bones.
*   **Dialogue Completion Text**:
    *   *"The Lich Apprentice has been laid to rest. By disrupting his dark ritual, we halted the undead expansion and reclaimed a cache of steel ingots from the crypt vaults. This eliminates the shadow over the ruins, allowing us to venture into the high peaks."*
*   **Reward Table**: Gold: `2200`, Materials: `20 material_steel_ingot`.

##### Story Mission 3.6: Area Climax - The Leyline Convergence (`exp_leyline_convergence`)
*   **Location**: `reg_mystic_ruins` (Milestone: Clear 8 Mystic Ruins)
*   **Requirements**: Complete `exp_lich_wake`.
*   **Storyboard Panels**:
    *   *Panel 1: Magic Storm*: The central leyline node of the valley is fracturing, shooting arcs of wild mana into the sky.
    *   *Panel 2: Stabilizing the Node*: Eldrin anchors his staff in the node, channeling his full mana reserve to bind the arcs back into the ground.
    *   *Panel 3: Safe Nexus*: The node stabilizes, forming a quiet, glowing magic nexus.
*   **Dialogue Completion Text**:
    *   *"The Leyline Convergence is stabilized. By binding the wild magic veins of the valley, we have secured a permanent source of focused mana. This unlocks the Arcane Sanctum Level 2 upgrade, allowing Eldrin to teach multiple students simultaneously and increase their training speeds."*
*   **Reward Table**: Gold: `2500`, Materials: `30 material_stone`, Unlocks: `arcane_sanctum` Level 2 upgrade option. Unlocks Area 4 regions.

---

#### Area 4: The Shattered Highlands & Dragon Peaks (Missions 4.1 – 4.7)

##### Story Mission 4.1: The Mountain Pass (`exp_mountain_pass`)
*   **Location**: `reg_iron_peaks` (Milestone: Clear 2 Iron Peaks)
*   **Requirements**: Area 4 unlocked.
*   **Storyboard Panels**:
    *   *Panel 1: The Frozen Gate*: A high mountain pass is blocked by a massive rockslide and guarded by mountain trolls.
    *   *Panel 2: Troll Clash*: Arthur and Sir Valen engage the trolls, using quick strikes to dodge their heavy clubs.
    *   *Panel 3: Pass Cleared*: The trolls are defeated, and the boulders are cleared, revealing the path to the high fortresses.
*   **Dialogue Completion Text**:
    *   *"The mountain pass is secure. By driving the trolls from the frozen gate, we have opened the path to the high crags, allowing our miners to access rich iron and steel deposits safely."*
*   **Reward Table**: Gold: `3000`, Materials: `30 material_iron_ore`.

##### Story Mission 4.2: Orc Stronghold (`exp_orc_stronghold`)
*   **Location**: `reg_iron_peaks` (Milestone: Clear 4 Iron Peaks)
*   **Requirements**: Complete `exp_mountain_pass`.
*   **Storyboard Panels**:
    *   *Panel 1: The Mountain Fortress*: A massive fortress of dark iron blocks the pass. Brog is chained to a heavy stone pillar in the courtyard.
    *   *Panel 2: Crashing the Gates*: The party breaches the wooden gates, fighting armored brutes and a mountain troll.
    *   *Panel 3: Unchained Giant*: Arthur shatters Brog's chains. Brog grabs a heavy greataxe and joins the fight.
*   **Dialogue Completion Text**:
    *   *"By breaching the high gates of the Orc Stronghold in the stormy Iron Peaks, we shattered the heavy chains binding Brog, a warrior-smith of the mountain clans. Possessing ancient secrets of alloy refinement and high-temperature charcoal smelting, Brog upgrades our village forge. This unlocks the Steel Forge recipe at the Blacksmith, allowing us to process raw ore into refined steel weapons and armor to pierce the defenses of our toughest foes."*
*   **Reward Table**: Gold: `5000`, Materials: `20 material_steel_ingot`, Special: **Hero Unlocked: Brog (Warrior, Lvl 4)**, Unlocks: Steel Weapon Forging at Blacksmith.

##### Story Mission 4.3: The Desert Oasis (`exp_desert_oasis`)
*   **Location**: `reg_great_desert` (Milestone: Clear 4 Great Desert)
*   **Requirements**: Complete `exp_orc_stronghold` and unlock `reg_great_desert`.
*   **Storyboard Panels**:
    *   *Panel 1: The Scorched Spring*: A small oasis is surrounded by aggressive fire slimes, drying up the water.
    *   *Panel 2: Quenching the Flame*: The heroes battle the slimes, utilizing ice and water magic to extinguish their cores.
    *   *Panel 3: Lush Waters*: The oasis fills with cool water, and palms grow rapidly along the edges.
*   **Dialogue Completion Text**:
    *   *"The Desert Oasis has been secured. By driving the fire slimes from the water source, we established a pipeline to irrigate our village farms. This advanced irrigation system allows our crops to flourish. This unlocks the Farm Level 3 upgrade, maximizing food production."*
*   **Reward Table**: Gold: `4000`, Materials: `40 food_raw_grain`, Unlocks: `farm` Level 3 upgrade option.

##### Story Mission 4.4: The Volcanic Vault (`exp_volcanic_vault`)
*   **Location**: `reg_obsidian_crater` (Milestone: Clear 5 Obsidian Crater)
*   **Requirements**: Complete `exp_desert_oasis` and unlock `reg_obsidian_crater`.
*   **Storyboard Panels**:
    *   *Panel 1: Magma Vault*: An ancient chamber inside the crater is surrounded by active lava. Inside, gold veins glow in the rock.
    *   *Panel 2: Volcanic Defense*: The party battles drakes and lava slimes, dodging magma vents that shoot from the floor.
    *   *Panel 3: Miner's Claim*: Miners secure the chamber, using specialized tools to extract raw gold ore from the walls.
*   **Dialogue Completion Text**:
    *   *"The Volcanic Vault is claimed. By defeating the drakes guarding the crater chambers, we have established a mining outpost inside the volcano. This allows our miners to extract raw gold ore. This unlocks the Blacksmith Level 2 upgrade, letting us process gold equipment."*
*   **Reward Table**: Gold: `5000`, Materials: `15 material_gold_ore`, Unlocks: `blacksmith` Level 2 upgrade option.

##### Story Mission 4.5: The Golem Chambers (`exp_ancient_archives`)
*   **Location**: `reg_ancient_library` (Milestone: Clear 4 Ancient Library)
*   **Requirements**: Complete `exp_volcanic_vault` and unlock `reg_ancient_library`.
*   **Storyboard Panels**:
    *   *Panel 1: The Archive Chamber*: The heroes enter a massive room of stone bookshelves. A huge stone golem guards a locked archive chest.
    *   *Panel 2: Shattering the Golem*: The party coordinates their attacks, dodging the golem's heavy stomps to target its glowing power core.
    *   *Panel 3: The Blueprints*: The golem crumbles. Arthur retrieves a scroll containing logistics blueprints.
*   **Dialogue Completion Text**:
    *   *"Within the dusty, silent halls of the Ancient Library, we deactivated the Grand Archive Golem guarding the imperial vault. Inside, we recovered the lost logistics scrolls of the Old Empire's trade guild. Detailed with advanced spatial layout theories and transport route designs, these blueprints allow our laborers to double warehouse efficiency and optimize supply lines, permanently unlocking Advanced Logistics (+50% Warehouse capacity and +10% worker gathering rate) to sustain our thriving sanctuary."*
*   **Reward Table**: Gold: `7000`, Special: **Unlock: Advanced Logistics** (passive +50% Warehouse capacity and +10% worker gathering rate).

##### Story Mission 4.6: The Sky Citadel (`exp_sky_citadel`)
*   **Location**: `reg_sky_fortress` (Milestone: Clear 6 Sky Fortress)
*   **Requirements**: Complete `exp_ancient_archives` and unlock `reg_sky_fortress`.
*   **Storyboard Panels**:
    *   *Panel 1: Sky Sentinel*: A glowing wind sentinel hovers over the fortress altar, keeping the citadel afloat with its magic.
    *   *Panel 2: Sky Battle*: The party battles the sentinel, using ranged strikes and magic to pierce its high evasion.
    *   *Panel 3: Mythril Chest*: The sentinel dissolves, dropping a chest of raw mythril ore and advanced alloy designs.
*   **Dialogue Completion Text**:
    *   *"The Sky Citadel is conquered. By defeating the wind sentinel, we claimed the vault containing the rarest metal in the realm. Brog can now forge legendary mythril weapons at the village forge. This unlocks mythril processing at the Blacksmith."*
*   **Reward Table**: Gold: `8000`, Materials: `10 material_mythril`.

##### Story Mission 4.7: Campaign Climax - The Dragon's Nest (`exp_dragons_nest`)
*   **Location**: `reg_dragon_maw` (Milestone: Clear 7 Dragon's Maw)
*   **Requirements**: Complete `exp_sky_citadel` and unlock `reg_dragon_maw`.
*   **Storyboard Panels**:
    *   *Panel 1: The Dragon's Lair*: A massive ancient drake stands atop a mountain of bones and gold, breathing fire into the volcanic skies.
    *   *Panel 2: The Final Stand*: The entire party coordinates their skills. Sir Valen redirects the fire breath, Brog attacks its legs, Eldrin casts magic fields, and Arthur strikes its heart.
    *   *Panel 3: Sanctuary Secured*: The drake falls. The sun rises over the crag, casting a warm light over the valley below.
*   **Dialogue Completion Text**:
    *   *"The ancient dragon is defeated. By slaying the drake at the summit of the Maw, we have permanently secured our valley. No monsters remain to threaten our borders, and the story of our triumph will echo across the realm. Our survivors have finally built what they fled to find: a permanent sanctuary of peace."*
*   **Reward Table**: Gold: `10000`, Materials: `20 material_mythril`, Special: **Unlock: Hall of Fame Legend Status** (Arthur, Sir Valen, Eldrin, Lyra, and Brog are entered into the Hall of Fame as founders of the sanctuary).

---

## 4. Daily Storyboard Resolution UI Spec

To present story completions with a premium, narrative-driven aesthetic:

### 4.1 Interface Layout

```
+─────────────────────────────────────────────────────────────+
|                       A STORY UNFOLDS                       |
+─────────────────────────────────────────────────────────────+
|                                                             |
|  +───────────────+   +───────────────+   +───────────────+  |
|  |               |   |               |   |               |  |
|  |    Panel 1    |   |    Panel 2    |   |    Panel 3    |  |
|  |  (The Threat) |   | (The Conflict)|   |(The Discovery)|  |
|  |               |   |               |   |               |  |
|  +───────────────+   +───────────────+   +───────────────+  |
|                                                             |
|  +───────────────────────────────────────────────────────+  |
|  | Narrative Text:                                       |  |
|  | "Eldrin the apprentice has been freed... [Lore Text]" |  |
|  +───────────────────────────────────────────────────────+  |
|                                                             |
|  +───────────────────────────────────────────────────────+  |
|  | Rewards:                                              |  |
|  | [Hero Unlocked: Eldrin] [Witch's Hut Constructed]    |  |
|  +───────────────────────────────────────────────────────+  |
|                                                             |
|                     [ CONTINUE JOURNEY ]                    |
+─────────────────────────────────────────────────────────────+
```

### 4.2 Presentation & Interaction Rules

1.  **Trigger & Blocking**:
    *   When `GameEngine.nextDay()` runs, if a story expedition was completed, the regular "Day Transition Summary" screen is blocked.
    *   The game displays this full-screen **Storyboard Resolution Overlay** instead.
2.  **Adaptive Columns**:
    *   **Desktop (>= 768px)**: Displays a centered modal covering 85% of the screen. The three story panels are arranged horizontally in a row, with the narrative text and rewards listed below them.
    *   **Mobile (< 768px)**: Displays a full-screen vertical scrolling view. The three story panels are stacked vertically or displayed as a swipeable carousel, with the text and rewards underneath.
3.  **Visual Styling**:
    *   **Backdrop**: 60% darkened background blur (`backdrop-filter: blur(8px)`) to obscure the village screen.
    *   **Modal Frame**: Glassmorphism aesthetic (semi-transparent dark background, thin white borders, subtle glow).
    *   **Storyboard Panels**: Rendered as cards with rounded corners, dark outlines, and subtle interior shadows. They display stylized illustrations (or detailed descriptive text placeholders if illustrations are loading).
4.  **Interaction Flow**:
    *   Clicking **"Continue Journey"** closes the overlay, applies the rewards to the game state (adding the hero, constructing the building, etc.), and triggers a smooth transition back to the main Village view.

