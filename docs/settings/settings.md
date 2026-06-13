# Settings Specification

## Overview
The Settings section allows the user to configure global application preferences and manage persistent data. It serves as a central hub for non-gameplay configurations.

## Features

### 1. Language Selection
- **Description**: Allows the user to switch the application's current language.
- **Implementation**: 
  - Interfaces with the `I18nService`.
  - Supported language codes: `en` (English), `es` (Spanish), `ca` (Catalan), `eu` (Basque), `gl` (Galician).
  - Changing the language should update all UI text immediately and persist the choice in `localStorage`.
- **References**: See [i18n.md](../shared/core/i18n.md).

### 2. Data Management (Wipe Save)
- **Description**: Provides ways to reset game progress. Since the introduction of Save Slots, data management operates at two scopes.
- **Actions**:
  1. **"Wipe Current Save"** — Deletes only the active save slot. Returns the player to the Save Slot selection screen.
  2. **"Wipe ALL Saves"** — Deletes all 10 slots plus global settings. Requires an additional confirmation step due to its destructive nature.
- **Implementation**:
  - Uses `persistence.clear()` scoped to the active slot prefix.
  - **Confirmation Dialog**: Mandatory modal for both actions. "Wipe ALL Saves" should display a second confirmation or a strongly emphasized warning.
  - **Post-Action**: Reload the application (`window.location.reload()`) or return to the Save Slot selection screen.
- **References**: See [Persistence.js](../../js/engine/shared/core/Persistence.js) and [Save Slots](../shared/core/save_slots.md).

## UI Requirements
- **Page**: `pages/settings.html`
- **Navigation**: Accessible via the main navigation bar (persistent UI shell).
- **Layout**:
  - **Preferences Group**: Language dropdown and any other visual settings.
  - **Danger Zone**: A visually distinct section (e.g., red border or background) containing the "Wipe Data" button to highlight its destructive nature.

## Data Model Impact
- **Settings Persistence**: The current language preference and any other settings should be saved using the `Persistence` service under a specific key (e.g., `app_settings`).
- **Settings Persistence**: Language and other app-level preferences are saved globally (prefix `rpg_village_v1_`) and persist across all save slots.
- **Slot Reset**: Wiping the current save only removes keys under the active slot prefix (e.g., `rpg_village_v1_slot3_`).
- **Global Reset**: "Wipe ALL Saves" removes all slot prefixes and the global settings registry, returning the application to a completely fresh state.
