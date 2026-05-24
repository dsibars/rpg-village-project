# Unlock Narratives System Specification

The **Unlock Narratives System** provides lore-rich "discovery moments" when the player unlocks new gameplay systems, regions, or buildings. These are lightweight, auto-dismiss toasts that reinforce the game's narrative and guide the player through the 4-era progression.

---

## 1. System Architecture

### Separation of Concerns

- **Data Model (`js/engine/shared/data/UnlockNarratives.js`)**: Pure static catalog. Maps `unlockId` → narrative data and gameplay predicate.
- **Service (`js/engine/shared/services/UnlockService.js`)**: Business logic. Evaluates predicates against state, tracks shown narratives, persists progress.
- **Presentation (`js/presentation/ui/unlocks/UnlockNarrativeView.js`)**: Pure rendering. Reads engine output and displays toasts. No logic, no state mutation.

---

## 2. Data Registry Schema

Each narrative entry in the catalog:

```javascript
{
    id: string,               // Unique identifier (e.g. 'nar_first_expedition')
    titleKey: string,         // Translation key for the narrative title
    loreKey: string,          // Translation key for the narrative body text
    era: number,              // 1 | 2 | 3 | 4 — for organizational grouping
    checkPredicate: (state) => boolean  // Pure function; returns true when trigger is met
}
```

---

## 3. Narrative Events Catalog

### Era I: The Spark

| Unlock ID | Trigger | Title | Lore Snippet |
|---|---|---|---|
| `nar_first_expedition` | Complete `exp_tutorial_cave` | "The First Step" | *"Arthur returned from the cave bloodied but unbroken. The valley was not as empty as it seemed. Somewhere beyond the mist, others waited — some to be saved, some to be fought."* |
| `nar_tiny_cave_found` | Unlock `reg_tiny_cave` | "Whispers from Below" | *"A scout reported a narrow crevice in the hills — too deep to measure, too dark to map. But Arthur heard something from within: the clatter of steel, the groan of stone. There was more down there."* |
| `nar_sir_valen_joins` | Rescue Sir Valen | "A Shield in the Dark" | *"The guard was half-buried under rubble, his armor cracked, his sword still clutched in both hands. He did not speak of gratitude — only duty. 'I will hold the line,' he said. And he has."* |
| `nar_first_skill_slot` | Any hero reaches Lv 5 | "Awakening" | *"It happened during sparring — a sudden clarity, a shift in weight. Arthur's strikes were no longer mere swings; they were techniques. The Training Grounds suddenly made sense."* |
| `nar_shop_unlocked` | Shop unlocks | "The Merchant's Return" | *"A cart appeared at dawn, drawn by a mule older than its driver. The merchant tipped his hat. 'Heard there was coin to be made where the brave bleed.' He set up his stall by the warehouse."* |
| `nar_tavern_built` | Tavern L1 complete | "A Warm Fire" | *"The first keg was tapped before the roof was finished. Word travels fast in desperate lands — a village with a tavern is a village that plans to stay. Heroes began to arrive."* |

### Era II: The Flood

| Unlock ID | Trigger | Title | Lore Snippet |
|---|---|---|---|
| `nar_dark_forest_found` | Unlock `reg_dark_forest` | "The Trees Have Eyes" | *"The forest was not merely dark — it was aware. Leaves rustled in patterns too deliberate for wind. Expeditions returned speaking of wisp-lights and root-growth that moved overnight."* |
| `nar_elara_arrives` | Tavern recruits mage-origin hero | "The First Spark" | *"She arrived at twilight, her robes singed at the hem, her eyes still reflecting something no one else could see. 'I can teach you,' she said to Arthur, 'if you build me a circle.'"* |
| `nar_magic_circle_unlocked` | Arcane Sanctum L1 complete | "The Language of the World" | *"The stones of the sanctum hummed when the final brick was laid. Elara traced a symbol in the air — fire, she called it — and for a moment, the air itself remembered how to burn."* |
| `nar_witch_hut_built` | Witch's Hut L1 complete | "The Veil Thins" | *"The witch did not knock. She simply appeared one morning in the half-finished hut, stirring a cauldron that had not been there the night before. 'Your mages glow,' she said. 'I read glows.'"* |
| `nar_first_spell_composed` | Any hero saves first spell | "A Name in Flame" | *"The circle flared, the glyphs aligned, and for the first time, a spell existed that had never existed before. Elara smiled — rare for her. 'You have written your first word in the language of gods.'"* |
| `nar_defense_first_raid` | First raid event resolved | "The Hammer at the Gate" | *"They came at midnight — not raiders, but a warning. The village was no longer hidden. From this day forward, walls would need watchers, and watchers would need steel."* |
| `nar_undefended_raid` | Raid lost with 0 defenders | "The Cost of Neglect" | *"The raiders found the gates unmanned. By dawn, the warehouse was empty, the treasury stripped, and the fields scorched. The survivors whispered that the commander had been warned."* | II |
| `nar_explorer_guild_built` | Explorer Guild L1 complete | "The World Opens" | *"The guild charter was signed with mud instead of wax, but the meaning was the same: this village no longer hid. Maps were unrolled, scouts were commissioned, and the horizon became a destination."* |

### Era III: The Web

| Unlock ID | Trigger | Title | Lore Snippet |
|---|---|---|---|
| `nar_mystic_ruins_found` | Unlock `reg_mystic_ruins` | "Echoes of the Magi" | *"The ruins predated the old kingdom — that much was certain. The glyphs etched into its pillars were not the ones Elara taught. They were older. Purer. Hungry."* |
| `nar_academy_unlocked` | Arcane Sanctum L2 complete | "The Exchange of Flame" | *"Two chairs, one teacher, one student. The academy was humble, but the knowledge was not. For the first time, a warrior learned to speak in fire, and a mage learned why."* |
| `nar_body_inscription_unlocked` | First hero meets requirements | "The Living Spell" | *"The witch and the trainer argued for three hours before agreeing. The ritual would bind flesh and glyph together — irreversible, devastating, and beautiful. 'Few survive the threshold,' the witch warned. 'Fewer still regret it.'"* |
| `nar_frozen_peaks_found` | Unlock `reg_frozen_peaks` | "The Summit's Price" | *"The peaks did not care for fire. Ice laughed at steel. Only those who understood the balance between force and finesse would return from the white silence above."* |

### Era IV: The Infinite

| Unlock ID | Trigger | Title | Lore Snippet |
|---|---|---|---|
| `nar_astral_plane_found` | Unlock `reg_astral_plane` | "Beyond the Veil" | *"The Astral Plane was not discovered. It was earned. Only when a hero became both blade and spell could the rift be held open long enough to step through. What lay beyond was not meant for mortal eyes."* |

---

## 4. State Tracking

### Persistent State Shape

```javascript
state.unlockedNarratives = [
    'nar_first_expedition',
    'nar_shop_unlocked',
    // ... IDs of narratives already shown to the player
];
```

- Stored in the same persistence layer as the rest of the game state.
- Reset on new game (empty array).
- Never mutated directly by the UI layer.

### Daily Report Shape

The engine's `nextDay()` return object includes:

```javascript
{
    // ... existing fields
    newNarratives: ['nar_first_expedition'], // Array of newly triggered narrative IDs
    newCodexFeatures: ['feature_expeditions'] // Array of newly unlocked codex feature IDs
}
```

The UI reads these arrays and renders accordingly. The UI does NOT compute what is new.

---

## 5. Service API

### `UnlockService.checkAllUnlocks(state)`

```javascript
/**
 * Evaluates all narrative predicates against the current state.
 * Returns only narratives that have NEVER been shown before.
 * 
 * @param {Object} state — full game state
 * @returns {string[]} — array of newly triggered narrative IDs
 */
checkAllUnlocks(state)
```

- Iterates `UnlockNarratives` catalog.
- Skips any ID already in `state.unlockedNarratives`.
- Calls `checkPredicate(state)` for each remaining entry.
- Returns array of IDs where predicate returns `true`.
- **Pure function**: does not mutate state.

### `UnlockService.markAsShown(state, id)`

```javascript
/**
 * Marks a narrative as shown so it never triggers again.
 * 
 * @param {Object} state — full game state
 * @param {string} id — narrative ID to mark
 */
markAsShown(state, id)
```

- Pushes `id` into `state.unlockedNarratives`.
- Persists state.
- Called by the engine AFTER the UI has consumed `newNarratives`.

---

## 6. Engine Integration Points

### Trigger Locations

Narrative checks run at the following engine lifecycle points:

1. **`GameEngine.nextDay()`** — after all day-resolution logic completes (expeditions, village, calendar, etc.), call `UnlockService.checkAllUnlocks()` and append results to the daily report.
2. **Expedition completion** — inside `ExpeditionService._resolveCompletedExpedition()`, after state is updated and saved, call `UnlockService.checkAllUnlocks()`.

### Integration Order in `nextDay()`

```
1. Village resolution
2. Expedition resolution
3. Region unlock checks
4. Academy processing
5. Body inscription processing
6. Hero recovery
7. Training grounds XP
8. Tavern auto-recruit
9. Calendar & defense events
10. >>> UnlockService.checkAllUnlocks() <<<
11. Build daily report (include newNarratives, newCodexFeatures)
12. Return daily report
```

---

## 7. UI Behavior Specification

### Toast Design

- **Style**: Single-slide overlay reusing existing prologue modal CSS classes (`modal-overlay`, `intro-modal`).
- **Content**: Title (large, bold) + Lore text (body, italic).
- **Layout**: Centered, glassmorphism background, subtle animation (fade-in).
- **Dismissal**: Auto-dismiss after 8 seconds. Click to dismiss early.
- **Queueing**: If multiple narratives trigger simultaneously, show one at a time. Next appears after the previous is dismissed.

### State Contract

The UI receives:
- `state.newNarratives: string[]` — IDs to display
- `state.unlockedNarratives: string[]` — already shown (for reference, not display)

The UI does NOT:
- Evaluate predicates.
- Mutate `state.unlockedNarratives`.
- Hardcode any strings.

---

## 8. Translation Key Conventions

### Narrative Keys

For each `nar_*` ID in the catalog, the following keys must exist:

```
{unlockId}_title    // e.g. nar_first_expedition_title
{unlockId}_lore     // e.g. nar_first_expedition_lore
```

### Complete Key List

#### Era I
- `nar_first_expedition_title`
- `nar_first_expedition_lore`
- `nar_tiny_cave_found_title`
- `nar_tiny_cave_found_lore`
- `nar_sir_valen_joins_title`
- `nar_sir_valen_joins_lore`
- `nar_first_skill_slot_title`
- `nar_first_skill_slot_lore`
- `nar_shop_unlocked_title`
- `nar_shop_unlocked_lore`
- `nar_tavern_built_title`
- `nar_tavern_built_lore`

#### Era II
- `nar_dark_forest_found_title`
- `nar_dark_forest_found_lore`
- `nar_elara_arrives_title`
- `nar_elara_arrives_lore`
- `nar_magic_circle_unlocked_title`
- `nar_magic_circle_unlocked_lore`
- `nar_witch_hut_built_title`
- `nar_witch_hut_built_lore`
- `nar_first_spell_composed_title`
- `nar_first_spell_composed_lore`
- `nar_defense_first_raid_title`
- `nar_defense_first_raid_lore`
- `nar_undefended_raid_title`
- `nar_undefended_raid_lore`
- `nar_explorer_guild_built_title`
- `nar_explorer_guild_built_lore`

#### Era III
- `nar_mystic_ruins_found_title`
- `nar_mystic_ruins_found_lore`
- `nar_academy_unlocked_title`
- `nar_academy_unlocked_lore`
- `nar_body_inscription_unlocked_title`
- `nar_body_inscription_unlocked_lore`
- `nar_frozen_peaks_found_title`
- `nar_frozen_peaks_found_lore`

#### Era IV
- `nar_astral_plane_found_title`
- `nar_astral_plane_found_lore`
