/**
 * v1 (vanilla JS) CSS selectors for screenshot navigation.
 */
export const v1Selectors = {
  // === Global / Onboarding ===
  saveSlotScreen: '.save-slots-screen',
  saveSlot: '.save-slot-card',
  emptySlot: '.save-slot-card.empty',
  emptySlotAction: '.slot-action',

  introOverlay: '.presentation-overlay',
  introSkip: '.presentation-skip',
  introNext: '.presentation-next',
  mainView: '#main-content',

  // === Navigation ===
  navVillage: '.main-nav .nav-item[data-category="village"]',
  navHeroes: '.main-nav .nav-item[data-category="heroes"]',
  navAdventure: '.main-nav .nav-item[data-category="adventure"]',
  navTown: '.main-nav .nav-item[data-category="town"]',

  // === Sub Navigation ===
  adventureExploreTab: '.sub-nav-tab[data-subview="explore"]',
  adventureBestiaryTab: '.sub-nav-tab[data-subview="bestiary"]',
  adventureCodexTab: '.sub-nav-tab[data-subview="codex"]',
  adventureChronicleTab: '.sub-nav-tab[data-subview="chronicle"]',

  townBuildingsTab: '.sub-nav-tab[data-subview="buildings"]',
  townShopTab: '.sub-nav-tab[data-subview="shop"]',
  townForgeTab: '.sub-nav-tab[data-subview="forge"]',
  townInventoryTab: '.sub-nav-tab[data-subview="inventory"]',
  townSettingsTab: '.sub-nav-tab[data-subview="settings"]',

  settingsMagicCircleTab: '.sub-nav-tab[data-subview="settings"]',

  // === Pages / Layout ===
  villagePage: '.village-dashboard-grid, #main-content',
  adventureTab: '#main-content',
  townTab: '#main-content',
  heroesPage: '#main-content',
  settingsPanel: '#main-content',

  // === Heroes ===
  heroList: '#heroes-list-container',
  heroCard: '#heroes-list-container .hero-card',
  heroDetail: '.hero-detail-panel',
  heroDetailTab: '.hero-detail-panel .tab-btn, .hero-detail-panel .detail-tab',
  heroSkillsBtn: '[data-action="skills"], .hero-action-skills',
  heroSkillsModal: '.modal-overlay, .hero-skills-modal',
  heroEquipmentBtn: '[data-action="equipment"], .hero-action-equipment',
  heroEquipmentModal: '.modal-overlay, .hero-equipment-modal',
  heroConsumablesBtn: '[data-action="consumables"], .hero-action-consumables',
  heroConsumablesModal: '.modal-overlay, .hero-consumables-modal',
  heroInscriptionBtn: '[data-action="inscription"], .hero-action-inscription',
  heroInscriptionModal: '.modal-overlay, .hero-inscription-modal',
  heroGambitsBtn: '[data-action="gambits"], .hero-action-gambits',
  heroGambitsModal: '.modal-overlay, .gambit-editor-modal',

  // === Adventure ===
  exploreTree: '.explore-tree, .tree-view',
  exploreListToggle: '.view-toggle button:last-child, .toggle-list, [data-view="list"]',
  exploreList: '.expedition-list, .list-view',
  expeditionNodeAvailable: '.tree-node:not(.locked):not(.completed), .expedition-card:not(.locked)',
  expeditionDetail: '.expedition-detail, .detail-panel',
  bestiaryList: '.bestiary-grid, .bestiary-list',
  codexList: '.codex-grid, .codex-list, .codex-categories',
  chronicleList: '.chronicle-list, .milestones-list',

  // === Town ===
  buildingsList: '.buildings-grid, .building-list',
  buildingCard: '.building-card',
  buildingDetail: '.building-detail, .building-modal, .modal-overlay',
  shopLocked: '.locked-message, .shop-locked, .locked-overlay',
  shopGrid: '.shop-grid, .shop-items',
  forgeLocked: '.locked-message, .forge-locked, .locked-overlay',
  forgeGrid: '.forge-grid, .forge-items',
  inventoryGrid: '.inventory-grid, .inventory-items',

  // === Village ===
  dailyReportModal: '.daily-report-modal, .modal-overlay, .report-modal',

  // === Combat ===
  combatOverlay: '.combat-overlay, #combat-view, .combat-screen',
  combatActionMenu: '.combat-actions, .action-menu',
  combatSkillsBtn: '.combat-actions button[data-action="skills"], .action-skills',
  combatSkillsMenu: '.skills-menu, .combat-skills-list',
  combatBackBtn: '.combat-actions button[data-action="back"], .action-back',
  combatAttackBtn: '.combat-actions button[data-action="attack"], .action-attack',
  combatTargetingCursor: '.targeting-mode, .target-cursor, .combat-targeting',
  combatVictoryPanel: '.victory-screen, .combat-victory, .modal-overlay.victory',
  combatDefeatPanel: '.defeat-screen, .combat-defeat, .modal-overlay.defeat',

  // === Magic Circle ===
  openMagicCircleBtn: '#btn-magic-simulator, .open-magic-simulator',
  magicCircleOverlay: '.magic-circle-overlay, .modal-overlay, #magic-circle-modal',
  magicCircleCoreSlot: '[data-slot="core"], [data-slot="0"], .core-slot',
  magicCircleDrawer: '.glyph-drawer, .drawer-panel, .magic-circle-drawer',
  magicCircleFireGlyph: '[data-glyph="glyph_fire"], .glyph-fire, [data-glyph-id="fire"]',
  magicCircleRingSlot: '[data-slot="ring"], [data-slot="1"], .ring-slot:not(.locked)',
  magicCircleSpellComposed: '.spell-composed, .composed-spell, .spell-preview',

  // === Building Modals ===
  trainerModal: '.trainer-modal, .modal-overlay.trainer',
  witchModal: '.witch-modal, .modal-overlay.witch',
  academyModal: '.academy-modal, .modal-overlay.academy',
  hallOfFameModal: '.hall-of-fame-modal, .modal-overlay.hall-of-fame',

  // === Post-Day ===
  expeditionResultModal: '.expedition-result-modal, .modal-overlay.expedition-result',
  narrativeToast: '.unlock-narrative-toast, .narrative-toast, .unlock-toast',
  modalCloseBtn: '.btn-close-modal, .modal-close, .btn-close',
}
