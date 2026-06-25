/**
 * Registry of all screenshot states to capture.
 *
 * Each entry defines a named state that a flow should produce.
 * The orchestrator calls the matching flow function to generate each screenshot.
 */

export const screenshotRegistry = [
  // === Onboarding ===
  { flow: 'onboarding', state: 'save_slot_empty', description: 'Save slot screen with only empty slots' },
  { flow: 'onboarding', state: 'save_slot_occupied', description: 'Save slot screen with at least one occupied slot' },
  { flow: 'onboarding', state: 'book_prologue', description: 'Book auto-open showing prologue content on new game' },
  { flow: 'onboarding', state: 'village_fresh', description: 'Village main screen right after dismissing Book' },

  // === Village ===
  { flow: 'village', state: 'village_main', description: 'Village dashboard main view' },
  { flow: 'village', state: 'village_construction_active', description: 'Village with an active construction project' },
  { flow: 'village', state: 'village_daily_report', description: 'Daily report modal after next day' },
  { flow: 'village', state: 'village_storage_warning', description: 'Village with storage >90% full' },
  { flow: 'village', state: 'village_recall_report', description: 'Village with daily report recalled from header' },

  // === Heroes (list & detail) ===
  { flow: 'heroes', state: 'heroes_list_no_selection', description: 'Heroes list with no hero selected' },
  { flow: 'heroes', state: 'heroes_list_selected', description: 'Heroes list with first hero selected' },
  { flow: 'heroes', state: 'heroes_detail_stats', description: 'Hero detail showing stats' },

  // === Hero Modals ===
  { flow: 'hero-modals', state: 'heroes_modal_skills', description: 'Hero skills modal open' },
  { flow: 'hero-modals', state: 'heroes_modal_equipment', description: 'Hero equipment modal open' },
  { flow: 'hero-modals', state: 'heroes_modal_consumables', description: 'Hero consumables modal open' },
  { flow: 'hero-modals', state: 'heroes_modal_inscription', description: 'Hero body inscription modal open' },
  { flow: 'hero-modals', state: 'heroes_modal_gambits', description: 'Hero gambit editor modal open' },

  // === Adventure ===
  { flow: 'adventure', state: 'explore_tree_view', description: 'Explore tab in tree view' },
  { flow: 'adventure', state: 'explore_list_view', description: 'Explore tab in list view' },
  { flow: 'adventure', state: 'explore_available_detail', description: 'Available expedition detail pane' },
  { flow: 'adventure', state: 'bestiary_mixed', description: 'Bestiary with discovered and undiscovered enemies' },
  { flow: 'adventure', state: 'codex_unlocked', description: 'Codex with mix of unlocked/locked features' },
  { flow: 'adventure', state: 'chronicle_milestones', description: 'Chronicle milestones view' },
  { flow: 'adventure', state: 'chronicle_to_book', description: 'Chronicle entry click-through open in Book' },

  // === Town ===
  { flow: 'town', state: 'buildings_list', description: 'Buildings list view' },
  { flow: 'town', state: 'buildings_detail_construct', description: 'Building detail for constructable building' },
  { flow: 'town', state: 'shop_locked', description: 'Shop tab in locked state' },
  { flow: 'town', state: 'shop_unlocked', description: 'Shop tab unlocked with items' },
  { flow: 'town', state: 'forge_locked', description: 'Forge tab in locked state' },
  { flow: 'town', state: 'forge_unlocked', description: 'Forge tab unlocked' },
  { flow: 'town', state: 'inventory_with_items', description: 'Inventory with items' },

  // === Combat ===
  { flow: 'combat', state: 'combat_overlay_open', description: 'Combat overlay open at start' },
  { flow: 'combat', state: 'combat_main_menu', description: 'Combat main action menu' },
  { flow: 'combat', state: 'combat_skills_menu', description: 'Combat skills submenu' },
  { flow: 'combat', state: 'combat_targeting_enemy', description: 'Combat targeting enemy mode' },
  { flow: 'combat', state: 'combat_victory', description: 'Combat victory screen' },
  { flow: 'combat', state: 'combat_defeat', description: 'Combat defeat screen' },

  // === Magic Circle ===
  { flow: 'magic-circle', state: 'magic_circle_empty', description: 'Magic Circle simulator empty' },
  { flow: 'magic-circle', state: 'magic_circle_core_drawer', description: 'Magic Circle with core slot drawer open' },
  { flow: 'magic-circle', state: 'magic_circle_fire_selected', description: 'Magic Circle with Fire glyph in core' },
  { flow: 'magic-circle', state: 'magic_circle_ring_drawer', description: 'Magic Circle with ring slot drawer open' },
  { flow: 'magic-circle', state: 'magic_circle_spell_composed', description: 'Magic Circle with a complete spell' },

  // === Building Modals (Era I/II buildings) ===
  { flow: 'building-modals', state: 'trainer_modal', description: 'Training Grounds trainer modal' },
  { flow: 'building-modals', state: 'witch_modal', description: 'Witchs Hut modal' },
  { flow: 'building-modals', state: 'academy_modal', description: 'Arcane Sanctum Academy modal' },
  { flow: 'building-modals', state: 'hall_of_fame_modal', description: 'Hall of Fame modal' },

  // === Post-Day Sequence ===
  { flow: 'post-day', state: 'expedition_result', description: 'Expedition result modal after completion' },
  { flow: 'post-day', state: 'narrative_unlock_toast', description: 'Unlock narrative toast overlay' },

  // === Missions ===
  { flow: 'missions', state: 'mission_locked', description: 'Mission board in locked state (no building)' },
  { flow: 'missions', state: 'mission_active_1slot', description: 'Mission board with 1 active mission' },
  { flow: 'missions', state: 'mission_active_progress', description: 'Mission with partial progress bar' },
  { flow: 'missions', state: 'mission_completed', description: 'Mission completed with claim button visible' },
  { flow: 'missions', state: 'mission_reroll', description: 'Mission with reroll button available' },

  // === Book ===
  { flow: 'book', state: 'book_fresh_prologue', description: 'Book showing prologue content on fresh game' },
  { flow: 'book', state: 'book_spread_navigation', description: 'Book showing spread navigation buttons active' },
  { flow: 'book', state: 'book_village_update', description: 'Book showing village update after first day' },
  { flow: 'book', state: 'book_milestone', description: 'Book showing milestone entry (e.g., hero recruited)' },
  { flow: 'book', state: 'book_chapter_title', description: 'Book showing chapter title page' },

  // === Tutorial ===
  { flow: 'tutorial', state: 'tutorial_arthur_card', description: 'Tutorial overlay highlighting Arthur card' },
  { flow: 'tutorial', state: 'tutorial_learn_skill', description: 'Tutorial overlay highlighting Learn Skill button' },
  { flow: 'tutorial', state: 'tutorial_stat_grid', description: 'Tutorial overlay highlighting stat grid' },
  { flow: 'tutorial', state: 'tutorial_village_tab', description: 'Tutorial overlay highlighting Village tab' },
  { flow: 'tutorial', state: 'tutorial_build_farm', description: 'Tutorial overlay highlighting Farm building' },
  { flow: 'tutorial', state: 'tutorial_explore_tab', description: 'Tutorial overlay highlighting Adventure tab' },
  { flow: 'tutorial', state: 'tutorial_region_greenfields', description: 'Tutorial overlay highlighting Greenfields region' },
  { flow: 'tutorial', state: 'tutorial_expedition_cave', description: 'Tutorial overlay highlighting Tutorial Cave expedition' },
  { flow: 'tutorial', state: 'tutorial_advance_day', description: 'Tutorial overlay highlighting day advance button' },

  // === Tutorial Interactive (real playthrough) ===
  { flow: 'tutorial-interactive', state: 'book_prologue', description: 'Book auto-open on fresh game before tutorial starts' },
  { flow: 'tutorial-interactive', state: 'tutorial_arthur_card', description: 'Tutorial overlay highlighting Arthur card (interactive)' },
  { flow: 'tutorial-interactive', state: 'tutorial_skills_modal', description: 'Locked skills modal during tutorial (interactive)' },
  { flow: 'tutorial-interactive', state: 'tutorial_stat_grid', description: 'Tutorial overlay highlighting stat grid (interactive)' },
  { flow: 'tutorial-interactive', state: 'tutorial_village_tab', description: 'Tutorial overlay highlighting Village tab before farm (interactive)' },
  { flow: 'tutorial-interactive', state: 'tutorial_build_farm_tile', description: 'Tutorial overlay highlighting Farm tile in Village (interactive)' },
  { flow: 'tutorial-interactive', state: 'tutorial_build_farm_detail', description: 'Farm building detail in Town/Buildings (interactive)' },
  { flow: 'tutorial-interactive', state: 'tutorial_explore_tab', description: 'Tutorial overlay highlighting Adventure tab (interactive)' },
  { flow: 'tutorial-interactive', state: 'tutorial_region_greenfields', description: 'Tutorial overlay highlighting Greenfields region (interactive)' },
  { flow: 'tutorial-interactive', state: 'tutorial_expedition_cave', description: 'Tutorial overlay highlighting Tutorial Cave node (interactive)' },
  { flow: 'tutorial-interactive', state: 'tutorial_expedition_detail', description: 'Tutorial Cave expedition detail with hero selector (interactive)' },
  { flow: 'tutorial-interactive', state: 'tutorial_advance_day', description: 'Tutorial overlay highlighting day advance button (interactive)' },
  { flow: 'tutorial-interactive', state: 'tutorial_completed', description: 'Game state after Day 1 tutorial chain completes (interactive)' },

  // === Settings ===
  { flow: 'settings', state: 'settings_main', description: 'Settings page main view' },
  { flow: 'settings', state: 'settings_simulator', description: 'Magic Circle Simulator open from settings' },
]

export function getRegistry() {
  return screenshotRegistry
}

export function getFlows() {
  return [...new Set(screenshotRegistry.map((entry) => entry.flow))]
}

export function getStatesForFlow(flow) {
  return screenshotRegistry.filter((entry) => entry.flow === flow)
}
