# Save Slots System

> **Status:** Specification  
> **Domain:** Shared Core  
> **Scope:** Meta-progression — how players create, manage, and resume gameplay sessions.

---

## 1. Overview

The game supports up to **10 independent save slots**. On launching the application, the player is presented with a Save Slot screen before entering the village. Each slot represents a completely isolated gameplay session — heroes, village progress, inventory, and unlocked content are per-slot. Global preferences (language, volume, accessibility) are shared across all slots.

---

## 2. Player Experience

### 2.1 First Boot (New Player)

When a player opens the game for the first time, they see the Save Slot screen with **10 empty slots**. They select any slot and begin a new game. The tutorial intro plays, and Day 1 begins.

### 2.2 Returning Player

When a returning player opens the game, they see the Save Slot screen with their existing saves visible. Each occupied slot displays identifying information so the player can recognize which game they want to continue. They select a slot and resume exactly where they left off — same day, same heroes, same village state.

### 2.3 Starting a Parallel Game

A player may intentionally start a second (or third) game in an empty slot. This is useful for trying different strategies, testing builds, or sharing the device with another person. Each slot is fully independent.

### 2.4 Deleting a Save

A player may permanently delete any save slot. This requires an explicit confirmation. Deleted slots become empty and available for new games.

---

## 3. Save Slot Screen

### 3.1 Layout

The screen presents a **grid of 10 slot cards**, ordered Slot 1 through Slot 10. The layout adapts to screen size:

- **Desktop**: 5 columns × 2 rows
- **Mobile**: 2 columns × 5 rows

### 3.2 Empty Slot Card

An empty slot displays:
- **Slot number** (e.g., "Slot 3")
- **Status**: "Empty" or "New Game"
- **Action**: A single button — "Start New Game"

### 3.3 Occupied Slot Card

An occupied slot displays **recognition information** — just enough for the player to identify which game this is, without overwhelming detail:

| Information | Rationale |
|-------------|-----------|
| **Slot number** | Always visible for reference |
| **Day reached** | The primary progression metric. "Day 34" immediately tells the player how far into the loop they are. |
| **Heroes recruited** | Shows village growth and roster size. "4 Heroes" means early game; "18 Heroes" means deep into the management phase. |
| **Highest hero level** | Indicates power progression and how much time has been invested in leveling. |
| **Regions unlocked** | Shows exploration progress and story advancement. |
| **Last played** | Human-readable timestamp: "Today", "Yesterday", "3 days ago", or a calendar date. Helps the player identify their most recent session. |
| **Actions**: "Continue" and "Delete" | Two distinct buttons. Delete requires a second step (see §3.4). |

**What is intentionally NOT shown:**
- **Gold** — Too volatile. A player might remember "I had 5,000 gold" but after a spending spree it's 200. This creates false recognition.
- **Population** — Correlates strongly with hero count; redundant.
- **Buildings** — Too much detail for a summary card; visible in-game.
- **Active expeditions** — Temporary state, misleading if the player returns after several days.

### 3.4 Delete Flow

1. Player taps "Delete" on an occupied slot.
2. A **confirmation modal** appears with the text: "Permanently delete this save? All progress in this slot will be lost. This cannot be undone."
3. Player must confirm to proceed. The slot card immediately reverts to the empty state.

There is no "undo" or "trash" state. Deletion is immediate and permanent.

### 3.5 New Game Flow

1. Player taps "Start New Game" on an empty slot.
2. The slot is initialized.
3. The game transitions to the village view.
4. If this is the player's very first game (across all slots), the **tutorial intro** plays.
5. If the player has played before, the intro is skipped and Day 1 begins immediately.

---

## 4. In-Game Slot Awareness

### 4.1 Current Slot Indicator

While playing, the player should be subtly reminded which slot they are in. The **Settings page** displays the current slot number (e.g., "Current Save: Slot 3"). This helps players who manage multiple parallel games avoid confusion.

### 4.2 Returning to the Slot Screen

From the Settings page, the player may select **"Return to Save Slots"**. This soft-exits the current game and returns to the Save Slot screen **without deleting any progress**. The player can then select the same slot again (resuming where they left off) or a different slot.

### 4.3 Wipe Behavior

The Settings page offers two distinct wipe actions in a clearly marked **Danger Zone**:

1. **"Wipe Current Save"** — Deletes ONLY the active slot. Returns the player to the Save Slot screen. Other slots are untouched.
2. **"Wipe ALL Saves"** — Deletes all 10 slots plus global preferences. Returns the application to a completely fresh state, as if never played before. Requires a **second confirmation** due to its destructive scope.

---

## 5. Save Recognition Design

The goal of the slot summary is **recognition, not completeness**. A player with 3 active games should glance at the screen and immediately know:

- "Slot 2 is my main game — Day 87, 16 heroes, level 22."
- "Slot 5 is the experiment I started last weekend — Day 12, 3 heroes, level 5."

The summary prioritizes **progression depth** (day, hero count, highest level) over **current snapshot** (gold, active missions). This matches how players mentally categorize their saves.

---

## 6. Data Scope

### Per-Slot Data (isolated per gameplay session)
- Village state (buildings, resources, population, day)
- All heroes (stats, equipment, skills, gambits, magic circles)
- Inventory (materials, food, consumables, equipment)
- Expedition progress (regions unlocked, completed nodes, active expeditions)
- Calendar and defense assignments
- Daily objectives state
- Academy designs and sessions
- Unlock state (narratives shown, codex features)

### Global Data (shared across all slots)
- Language preference
- Any future accessibility or audio settings
- Hall of Fame achievements (future consideration — may remain global to reflect player accomplishments across all playthroughs)

---

## 7. Migration & Legacy

Players who played before the Save Slots system existed have their progress preserved. On the first boot after this feature is added, the existing save data is automatically assigned to **Slot 1**. The player sees their old game in Slot 1 and nine empty slots. No action is required. No progress is lost.

---

## 8. Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| **Corrupted save data** | The slot is treated as empty. The player sees "Empty Slot" and can start a new game. A console warning is logged for debugging. |
| **All 10 slots full** | The player must delete an existing slot before starting a new game. The "Start New Game" buttons are disabled or hidden on all occupied slots. |
| **Player returns to slot screen mid-combat** | The combat state is preserved. If the player re-selects the same slot, they resume exactly at the combat screen. |
| **localStorage is full** | The most recent save attempt fails silently (logged to console). Gameplay continues. The player is not interrupted. The next successful mutation will persist normally. |

---

## 9. Acceptance Criteria

- [ ] On launch, the player sees 10 slot cards before any gameplay begins.
- [ ] Empty slots show "Start New Game" and no progression data.
- [ ] Occupied slots show: Day, Heroes recruited, Highest hero level, Regions unlocked, and Last played date.
- [ ] The player can continue any occupied slot from where they left off.
- [ ] The player can start a new game in any empty slot.
- [ ] The player can delete any occupied slot with a confirmation step.
- [ ] The Settings page shows the current active slot number.
- [ ] The Settings page offers "Return to Save Slots" without deleting progress.
- [ ] "Wipe Current Save" deletes only the active slot.
- [ ] "Wipe ALL Saves" deletes all slots and global settings, with a second confirmation.
- [ ] Existing pre-slot saves are automatically migrated to Slot 1 on first boot.
- [ ] All existing 312 tests continue to pass.
- [ ] New tests cover slot CRUD, summary accuracy, and legacy migration.

---

## 10. Implementation Notes (Non-Normative)

> This section provides technical guidance for the implementation phase. It is not part of the behavioral specification and may change based on technology choices.

- **Prefix Isolation**: Each slot stores data under a distinct key prefix (e.g., `slot3_`) to prevent cross-contamination.
- **Summary Computation**: Slot summaries are computed on demand by reading the persisted slot data directly. The full game engine does not need to be instantiated to render the slot screen.
- **Registry**: A small metadata registry tracks which slots exist and when they were last played. It does not store duplicated progression data.
- **Deferred Initialization**: The game engine should not auto-load save data during construction. Loading occurs only after the player has selected a slot.
