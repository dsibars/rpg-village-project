/**
 * Registry of all screenshot pairs to capture.
 *
 * Each entry defines a named state that both v1 and v2 should produce.
 * The orchestrator calls the matching flow function to generate each pair.
 */

export const screenshotRegistry = [
  // === Onboarding ===
  { flow: 'onboarding', state: 'save_slot_empty', description: 'Save slot screen with only empty slots' },
  { flow: 'onboarding', state: 'save_slot_occupied', description: 'Save slot screen with at least one occupied slot' },
  { flow: 'onboarding', state: 'intro_prologue', description: 'New game intro presentation overlay' },
  { flow: 'onboarding', state: 'intro_skip_visible', description: 'Intro overlay with skip button visible' },
  { flow: 'onboarding', state: 'village_fresh', description: 'Village main screen right after dismissing intro' },

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
