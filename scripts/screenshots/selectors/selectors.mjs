/**
 * App CSS selectors for screenshot navigation.
 * These map to the actual DOM produced by the Vue components.
 */
export const selectors = {
  // === Global / Onboarding ===
  saveSlotScreen: '.save-slot-page, .slot-card',
  saveSlot: '.slot-card',
  emptySlot: '.slot-card.empty',
  emptySlotAction: '.slot-action-new, button',

  introOverlay: '.presentation-overlay',
  introSkip: '.presentation-skip',
  introNext: '.presentation-next',
  mainView: '.app-main',

  // === Navigation ===
  navVillage: '.footer-nav .nav-item:nth-child(1)',
  navHeroes: '.footer-nav .nav-item:nth-child(2)',
  navAdventure: '.footer-nav .nav-item:nth-child(3)',
  navTown: '.footer-nav .nav-item:nth-child(4)',
  navSettings: '.top-bar-right .btn-quick:last-child',

  // === Sub Navigation ===
  adventureExploreTab: '.adventure-page .tab-nav .tab-btn:nth-child(1)',
  adventureBestiaryTab: '.adventure-page .tab-nav .tab-btn:nth-child(2)',
  adventureCodexTab: '.adventure-page .tab-nav .tab-btn:nth-child(3)',
  adventureChronicleTab: '.adventure-page .tab-nav .tab-btn:nth-child(4)',

  townBuildingsTab: '.town-page .tab-nav .tab-btn:nth-child(1)',
  townShopTab: '.town-page .tab-nav .tab-btn:nth-child(2)',
  townForgeTab: '.town-page .tab-nav .tab-btn:nth-child(3)',
  townInventoryTab: '.town-page .tab-nav .tab-btn:nth-child(4)',

  settingsMagicCircleTab: '.settings-page .settings-section:first-child, .settings-page',

  // === Pages / Layout ===
  villagePage: '.village-page',
  adventureTab: '.adventure-page',
  townTab: '.town-page',
  heroesPage: '.heroes-page',
  settingsPanel: '.settings-page, .app-content',

  // === Heroes ===
  heroList: '.hero-list',
  heroCard: '.hero-list-item',
  heroDetail: '.heroes-detail-panel .hero-profile',
  heroDetailTab: '.hero-profile .tab-btn, .hero-profile .section-tab',

  // Hero action buttons are in .hero-quick-links; we find by text content in flow code
  heroSkillsBtn: '.hero-quick-links button',
  heroSkillsModal: '.modal-overlay',
  heroEquipmentBtn: '.hero-quick-links button',
  heroEquipmentModal: '.modal-overlay',
  heroConsumablesBtn: '.hero-quick-links button',
  heroConsumablesModal: '.modal-overlay',
  heroInscriptionBtn: '.hero-quick-links button',
  heroInscriptionModal: '.modal-overlay',
  heroGambitsBtn: '.hero-quick-links button',
  heroGambitsModal: '.modal-overlay',

  // === Adventure ===
  exploreTree: '.explore-tab .expedition-tree, .expedition-tree',
  exploreListToggle: '.explore-tab .view-toggle button:first-child',
  exploreList: '.explore-tab .expedition-list, .expedition-list',
  expeditionNodeAvailable: '.explore-tab .tree-node.available, .tree-node.available',
  expeditionDetail: '.modal-overlay .expedition-detail, .explore-tab .detail-pane',
  bestiaryList: '.bestiary-tab .bestiary-grid, .bestiary-grid, .bestiary-list',
  codexList: '.codex-tab .features-list, .codex-nav-pane, .codex-list',
  chronicleList: '.chronicle-tab .chronicle-two-pane, .recent-list, .chronicle-list',

  // === Town ===
  buildingsList: '.buildings-tab .building-list, .building-list',
  buildingCard: '.buildings-tab .building-card, .building-card',
  buildingDetail: '.buildings-tab .detail-pane, .detail-pane',
  shopLocked: '.shop-tab .lock-overlay, .lock-overlay',
  shopGrid: '.shop-tab .catalog-list, .catalog-list',
  forgeLocked: '.forge-tab .lock-overlay, .lock-overlay',
  forgeGrid: '.forge-tab .forge-layout, .forge-layout',
  inventoryGrid: '.inventory-tab .item-grid, .item-grid, .inventory-grid',

  // === Village ===
  dailyReportModal: '.modal-overlay, .daily-report-modal',

  // === Combat ===
  combatOverlay: '.fullview-overlay, .combat-overlay',
  combatActionMenu: '.combat-action-panel, .action-buttons',
  // Text-based matching for v2 combat buttons ( CombatActionPanel uses Button components )
  combatSkillsBtn: '.combat-action-panel button:has-text("Skills"), .combat-action-panel button:has-text("🔮")',
  combatSkillsMenu: '.combat-action-panel .sub-menu, .combat-action-panel .skills-list',
  combatBackBtn: '.combat-action-panel .back-btn',
  combatAttackBtn: '.combat-action-panel button:has-text("single_strike"), .combat-action-panel button:has-text("⚔")',
  combatTargetingCursor: '.combat-action-panel .targeting-msg, .targeting-mode',
  combatVictoryPanel: '.combat-action-panel .resolution-pane, .resolution-pane',
  combatDefeatPanel: '.combat-action-panel .resolution-pane, .resolution-pane',

  // === Magic Circle ===
  openMagicCircleBtn: 'button:has-text("Magic Circle Simulator")',
  magicCircleOverlay: '.modal-overlay, .magic-circle-editor',
  magicCircleCoreSlot: '.mandala-slot.core-slot, .slot-core',
  magicCircleDrawer: '.mc-focused-drawer, .glyph-drawer, .drawer-panel',
  magicCircleFireGlyph: '.mc-palette-card[data-glyph="glyph_fire"], .mc-palette-card:first-child',
  magicCircleRingSlot: '.mandala-slots .mandala-slot:not(.core-slot):not(.locked), .ring-slot:not(.locked)',
  magicCircleSpellComposed: '.mc-element-display, .spell-preview, .composed-spell',

  // === Building Modals ===
  trainerModal: '.modal-overlay, .trainer-modal',
  witchModal: '.modal-overlay, .witch-modal',
  academyModal: '.modal-overlay, .academy-modal',
  hallOfFameModal: '.modal-overlay, .hall-of-fame-modal',

  // === Post-Day ===
  expeditionResultModal: '.modal-overlay, .expedition-result',
  narrativeToast: '.toast--narrative, .toast-narrative, .narrative-toast, .unlock-narrative-toast',
  modalCloseBtn: '.modal-close, .btn-close, button[aria-label="close"]',
}
