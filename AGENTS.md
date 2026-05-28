# Agent Guidelines for RPG Village

Welcome, Agent. This document defines the architectural principles, documentation standards, and UI patterns for the **RPG Village** project.

## 1. Project Philosophy & Methodology
- **Spec-First Development**: Always check the `docs/` folder before modifying the `js/engine`.
- **Single Source of Truth**: The `*_data.md` files define the game balance. The code should mirror these values exactly.
- **Validation**: Generated code must strictly adhere to the definitions found in `docs/`.
- **Domain-Driven Design (DDD)**: The `engine` is divided into bounded contexts (domains) that mirror the `docs/` specifications.
- **Separation of Concerns**: Keep the `engine` agnostic of the DOM. All DOM interactions must happen in `presentation/ui`.

## 2. 🎨 UI & Design Standards
**CRITICAL:** All UI implementations must follow the adaptive patterns defined in:
- **[Design System & Patterns](./docs/shared/ui/design_system.md)**
  - Use **Master-Detail** for lists and profiles.
  - Use **Dashboard** for the main village overview.
  - Ensure **Mobile-First** responsiveness with distinct adaptive behaviors.

## 3. 📖 Master Index of Specifications
### Shared (Core/Combat/Inventory)
- **Combat**: [Battle System](./docs/shared/combat/battle_system.md) | [Combat Calculator](./docs/shared/combat/combat_calculator.md) | [Enemies](./docs/shared/combat/enemies.md) | [Enemies Data](./docs/shared/combat/enemies_data.md)
- **Skills & Magic**: [Hero Skills Overview](./docs/shared/combat/hero_skills.md) | [Physical Skill System](./docs/shared/combat/physical_skill_system.md) | [Hero Skills Data](./docs/shared/combat/hero_skills_data.md) | [Magic Circle System](./docs/shared/combat/magic_circle_system.md) | [Magic Circle Naming](./docs/shared/combat/magic_circle_naming.md) | [Hybrid Body Inscription](./docs/shared/combat/hybrid_body_inscription.md)
- **Gambits & Party**: [Gambit System](./docs/shared/combat/gambit_system.md) | [Party Traits](./docs/shared/combat/party_traits.md) | [Party Composition Matrix](./docs/shared/combat/party_composition_matrix.md)
- **Bestiary & Balance**: [Bestiary](./docs/shared/combat/bestiary.md) | [Combat Balance Philosophy](./docs/shared/combat/combat_balance_philosophy.md)
- **Inventory**: [Inventory System](./docs/shared/inventory/inventory.md) | [Consumables](./docs/shared/inventory/consumables.md) | [Consumables Data](./docs/shared/inventory/consumables_data.md) | [Equipment](./docs/shared/inventory/equipment.md) | [Equipment Data](./docs/shared/inventory/equipment_data.md) | [Materials Data](./docs/shared/inventory/materials_data.md) | [Food Data](./docs/shared/inventory/food_data.md) | [Meal Crafting](./docs/shared/inventory/meal_crafting.md)
- **Core**: [Time & Construction](./docs/shared/core/time_system.md) | [I18n Architecture](./docs/shared/core/i18n.md) | [Design System](./docs/shared/ui/design_system.md) | [Save Slots](./docs/shared/core/save_slots.md)
- **Hall of Fame**: [Hall of Fame](./docs/shared/hall_of_fame.md)

### Heroes
- **Profiles**: [Hero Spec](./docs/heroes/hero.md)
- **Data**: [Origins & Traits](./docs/heroes/origins_data.md)

### Village
- **Infrastructure**: [Village Spec](./docs/village/village.md) | [Buildings Data](./docs/village/buildings_data.md) | [Initialization](./docs/village/initialization.md)
- **Systems**: [Calendar & Defense](./docs/village/calendar_defense.md) | [Daily Objectives](./docs/village/daily_objectives.md) | [Shop & Forge](./docs/village/shop_forge.md)

### Explore
- **Campaigns**: [Expeditions](./docs/explore/expeditions.md) | [Expedition Data](./docs/explore/expeditions_data.md) | [Regions Data](./docs/explore/regions_data.md)

### Settings & Meta
- **Settings**: [Settings](./docs/settings/settings.md)
- **Developer Workflow**: [Developer Workflow](./docs/developer_workflow.md)
- **App Description**: [App Description](./docs/app_description.md)
- **Doc Review**: [DOC_REVIEW_REPORT.md](./docs/DOC_REVIEW_REPORT.md) — lists known issues and fixes applied

### Roadmap & Drafts
- **Roadmap**: [Roadmap](./docs/roadmap.md)
- **Drafts**: [Drafts & Ideas](./docs/drafts/roadmap.md)

## 4. Directory Structure
- `/` (project root)
  - `docs/`: Master design and mechanics. Structured by domain.
  - `js/engine/`: Pure logic and state management (The "Back-end").
    - **CRITICAL RULE**: Subdirectories here MUST mirror domains in `docs/` (e.g., `shared/`, `heroes/`, `village/`).
    - Inside each domain folder:
      - `core/`: Central coordinators and state managers.
      - `models/`: Entities and data structures.
      - `services/`: Business logic and calculations.
  - `js/presentation/`:
    - `adapters/`: Orchestration layer (The "BFF").
    - `ui/`: DOM management and components (The "Front-end").
  - `pages/`: HTML partials representing UI sections.
  - `css/`: Styling system and tokens.
  - `tests/`: Unit and behaviour tests.
  - `infrastructure/electron/`: Electron main process, preload, and forge config.

## 5. Iteration Workflow
1. **Document Phase**: Update specifications in `docs/`.
2. **Implementation Phase**: Implement in `js/engine/<domain>/` then `js/presentation/`.
3. **Verify**: Ensure the code perfectly matches the doc.
