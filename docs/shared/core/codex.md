# Codex System Specification

The **Codex System** is a persistent player guide, tutorial, and unlock-tracker for all major gameplay systems in RPG Village. It lists features, details how they work, and provides clear unlocking instructions.

## 1. System Architecture

The Codex is designed with a strict **Separation of Concerns**:
- **Data Model (`js/engine/shared/data/CodexFeatures.js`)**: Pure data definition catalog. Declares the list of systems, description keys, and dynamic unlocking predicates.
- **UI Controller & Router**: Handles navigation routing, header button shortcuts, and view state.
- **Presentation Component (`js/presentation/ui/codex/CodexView.js`)**: Renders the Codex in a Master-Detail layout, reflecting unlocked states in real time.

---

## 2. Data Registry Schema

Each entry in the Codex feature catalog has the following fields:

```javascript
{
    id: string,               // Unique identifier (e.g. 'feature_witch_hut')
    icon: string,             // Emoji representation (e.g. '🧙‍♀️')
    nameKey: string,          // Translation key for the feature name
    descKey: string,          // Translation key for the details/explanation
    unlockHintKey: string,    // Translation key for the unlocking requirements
    isUnlocked: (state) => boolean // Dynamic predicate checking state
}
```

---

## 3. Supported Features & Unlocking Rules

The Codex tracks the following features:

| Feature ID | Icon | Name | Unlock Predicate |
|---|---|---|---|
| `feature_gambits` | `📜` | Gambit System | Always unlocked (`() => true`) |
| `feature_shop` | `🛒` | Village Shop | Completed `exp_tutorial_cave` expedition |
| `feature_forge` | `⚒️` | Equipment Forge | Blacksmith building level $\ge$ 1 |
| `feature_skills` | `⚔️` | Physical Skills | Training Grounds building level $\ge$ 1 |
| `feature_magic_circle` | `🔮` | Magic Circle | Arcane Sanctum building level $\ge$ 1 |
| `feature_witch_hut` | `🧙‍♀️` | Witch's Hut | Witch's Hut building level $\ge$ 1 |
| `feature_hybrid` | `🧬` | Hybrid Inscription | Hero has Magic Tier $\ge$ 7 and physical skill tier points $\ge$ 12 |
| `feature_infirmary` | `🏥` | Infirmary | Infirmary building level $\ge$ 1 |
| `feature_tavern` | `🍻` | Tavern | Tavern building level $\ge$ 1 |
| `feature_explorer` | `🧭` | Explorer Guild | Explorer Guild building level $\ge$ 1 |

---

## 4. UI Design Standards

The Codex view follows the standard adaptive patterns:
- **Viewport Constraints**: Locked height (`height: calc(100vh - 150px); overflow: hidden;`) to prevent window scroll.
- **Master-Detail Layout**:
  - **Left Pane (Master list)**:
    - Locked items are greyed out, displaying a `🔒` badge.
    - Unlocked items show full colored icons.
    - Lists have styled scrollbars.
  - **Right Pane (Detail Inspector)**:
    - Displays full title, icon, and status badge (`UNLOCKED` in green or `LOCKED` in red).
    - If locked: shows requirements card.
    - If unlocked: shows full operational description and usage instructions.
- **Quick-Access Link**:
  - A persistent book icon (`📖`) in the global header bar that routes the user instantly to the Codex view.
