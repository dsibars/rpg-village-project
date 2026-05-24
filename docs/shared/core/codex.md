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
    categoryId: string,       // 'basics' | 'combat' | 'village' | 'magic'
    icon: string,             // Emoji representation (e.g. '🧙‍♀️')
    nameKey: string,          // Translation key for the feature name
    descKey: string,          // Translation key for the details/explanation
    unlockHintKey: string,    // Translation key for the unlocking requirements
    isUnlocked: (state) => boolean // Dynamic predicate checking state
}
```

---

## 3. Supported Features & Unlocking Rules

The Codex tracks the following features across 4 categories:

### Category: `basics` (📖)

| Feature ID | Icon | Name | Unlock Predicate |
|---|---|---|---|
| `feature_day_cycle` | `☀️` | Day Cycle & Time | Always unlocked (`() => true`) |
| `feature_villagers` | `👤` | Villagers & Labor | Always unlocked (`() => true`) |
| `feature_hero_attributes` | `🦸` | Hero Attributes & Stats | Always unlocked (`() => true`) |

### Category: `combat` (⚔️)

| Feature ID | Icon | Name | Unlock Predicate |
|---|---|---|---|
| `feature_gambits` | `📜` | Gambit System | Any hero reaches Level 5 |
| `feature_stamina_skills` | `⚔️` | Physical Skills & Stamina | Any hero reaches Level 5 |
| `feature_threats_defense` | `🛡️` | Threats & Defense | First raid event is resolved |

### Category: `village` (🏘️)

| Feature ID | Icon | Name | Unlock Predicate |
|---|---|---|---|
| `feature_shop` | `🛒` | Village Shop | Completed `exp_tutorial_cave` expedition |
| `feature_forge` | `⚒️` | Equipment Forge | Blacksmith building level $\ge$ 1 |
| `feature_infirmary` | `🏥` | Infirmary | Infirmary building level $\ge$ 1 |
| `feature_tavern` | `🍻` | Tavern | Tavern building level $\ge$ 1 |
| `feature_explorer_guild` | `🧭` | Explorer Guild | Explorer Guild building level $\ge$ 1 |
| `feature_expeditions` | `🗺️` | Expeditions | Completed `exp_tutorial_cave` expedition |

### Category: `magic` (🔮)

| Feature ID | Icon | Name | Unlock Predicate |
|---|---|---|---|
| `feature_magic_circle` | `🔮` | Magic Circle | Arcane Sanctum building level $\ge$ 1 |
| `feature_witch_hut` | `🧙‍♀️` | Witch's Hut | Witch's Hut building level $\ge$ 1 |
| `feature_body_inscription` | `🧬` | Body Inscription | Hero has Magic Tier $\ge$ 7 and physical skill tier points $\ge$ 12 |
| `feature_spell_codex` | `📖` | Spell Codex | Any hero inscribes their first custom spell |
| `feature_glyph_academy` | `🏛️` | Glyph Academy | Arcane Sanctum building level $\ge$ 2 |

---

## 4. Progressive Unlock Philosophy

The Codex follows **gameplay-driven progression**. There are no day-based gates. Players control their own speed through village management priorities.

- **Prologue**: Core loop features (Day Cycle, Villagers, Hero Attributes) are always visible.
- **Era I**: Combat and expedition features unlock through natural early gameplay (first expedition, hero leveling, first raid).
- **Era II**: Magic features unlock through building construction (Arcane Sanctum, Witch's Hut).
- **Era III**: Advanced features unlock through deep investment (Arcane Sanctum L2, hero stat thresholds).
- **Era IV**: Endgame systems are already covered by existing entries.

The [Roadmap](../roadmap.md) defines approximate era timing, but these are **soft pacing guidelines, not hard gates**.

---

## 5. Translation Keys

The following translation keys must exist in the i18n system for the Codex to function:

### Category Names
- `codex_category_basics`
- `codex_category_combat`
- `codex_category_village`
- `codex_category_magic`

### Feature Names & Descriptions
For each `feature_*` ID listed above, the following keys must exist:
- `codex_feature_{id}` — Feature name
- `codex_feature_{id}_desc` — Full description (shown when unlocked)
- `codex_feature_{id}_unlock` — Unlock requirement hint (shown when locked)

### New Keys (Added in this iteration)
- `codex_feature_spell_codex`
- `codex_feature_spell_codex_desc`
- `codex_feature_spell_codex_unlock`
- `codex_feature_glyph_academy`
- `codex_feature_glyph_academy_desc`
- `codex_feature_glyph_academy_unlock`

### UI Labels
- `ui_unlocked`
- `ui_locked`
- `ui_requirements`
- `nav_codex`
- `codex_locked_placeholder`
- `ui_codex_intro`

---

## 6. UI Design Standards

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
