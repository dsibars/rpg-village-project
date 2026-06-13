# Daily Objectives Specification

## Overview
Daily Objectives provide rotating short-term goals that encourage diverse gameplay. Each in-game day, **4 random objectives are generated** and the player **chooses 2** to pursue. Completing the chosen objectives grants rewards, and completing both chosen objectives for the day grants a bonus.

## Generation
- Objectives are generated at the start of each day (first `nextDay()` call of that day).
- If objectives already exist or pending choices are available for the current day, they are preserved.
- When the day counter advances, 4 new objective choices are generated.

## Choice Phase
Before objectives become active, the player must **pick 2 out of 4** randomly generated choices:
- The 4 choices are shown in the Village view with their labels, targets, and rewards.
- Once 2 are selected, they become the active objectives for the day.
- Until the player makes a choice, no objectives are active and no progress is tracked.
- The choice is final for that day; objectives cannot be swapped after locking in.

## Objective Types

| ID | Label | Target Range | Reward |
| :--- | :--- | :--- | :--- |
| `defeat_enemies` | Defeat {target} enemies | 3 / 5 / 8 | 50g, 10 Wood |
| `spend_gold` | Spend {target} gold | 100 / 200 / 500 | 30g, 5 Stone |
| `complete_expeditions` | Complete {target} expeditions | 1 / 2 / 3 | 80g, 3 Iron |
| `upgrade_building` | Upgrade a building | 1 | 40g, 15 Wood |
| `recruit_hero` | Recruit a hero | 1 | 60g, 10 Stone |
| `craft_items` | Craft {target} items | 1 / 2 / 3 | 35g, 5 Iron |

## Tracking
Objectives track automatically through gameplay:
- `defeat_enemies`: Counts enemies defeated in victorious combat resolutions.
- `spend_gold`: Tracks gold spent in shop purchases, building upgrades, recruitment, and forge refinement.
- `complete_expeditions`: Tracks expeditions that reach `completed` status.
- `upgrade_building`: Tracks when a building project is started.
- `recruit_hero`: Tracks tavern recruitment.
- `craft_items`: Tracks forge refinement and meal crafting.

## Rewards

### Individual Objective Reward
When an objective is completed, its defined reward is granted:
- Gold is added directly to the village treasury.
- Materials are added to the global inventory.

### All-Completed Bonus
When **all** objectives for the current day are completed:
- Bonus: 20 Wood + 10 Stone added to inventory.
- The bonus can only be granted once per day.

## UI
- Objectives are displayed in a dedicated widget on the Village view.
- Each objective shows: description, progress bar, completion checkmark.
- When all objectives are completed, a celebration banner appears.

## State Model

```javascript
{
    day: 1,
    status: 'choosing',      // 'choosing' | 'active' | 'idle'
    pendingChoices: [        // 4 generated objectives awaiting player selection
        { id: 'defeat_enemies', label: 'obj_defeat_enemies', target: 5, progress: 0, completed: false, reward: { gold: 50, material_wood: 10 } },
        { id: 'spend_gold', label: 'obj_spend_gold', target: 200, progress: 0, completed: false, reward: { gold: 30, material_stone: 5 } },
        { id: 'complete_expeditions', label: 'obj_complete_expeditions', target: 2, progress: 0, completed: false, reward: { gold: 80, material_iron: 3 } },
        { id: 'craft_items', label: 'obj_craft_items', target: 2, progress: 0, completed: false, reward: { gold: 35, material_iron: 5 } }
    ],
    objectives: [            // The 2 objectives the player actually selected
        {
            id: 'defeat_enemies',
            label: 'obj_defeat_enemies',
            target: 5,
            progress: 3,
            completed: false,
            claimed: false,
            reward: { gold: 50, material_wood: 10 }
        }
    ],
    allCompletedDay: null  // Tracks which day the all-completed bonus was granted
}
```

## Persistence
Daily objectives state is stored under `daily_objectives_state` in localStorage.
