import { UIController } from './presentation/ui/UIController.js';
import { GameEngine } from './engine/GameEngine.js';
import { EngineAdapter } from './presentation/adapters/EngineAdapter.js';
import { SaveSlotManager } from './engine/shared/core/SaveSlotManager.js';
import { SaveSlotView } from './presentation/ui/SaveSlotView.js';
import { persistence } from './engine/shared/core/Persistence.js';
import { i18n } from './engine/shared/core/i18n/I18nService.js';

// Domain Views
import { VillageView } from './presentation/ui/village/VillageView.js';
import { BuildingsView } from './presentation/ui/buildings/BuildingsView.js';
import { HeroesView } from './presentation/ui/heroes/HeroesView.js';
import { InventoryView } from './presentation/ui/inventory/InventoryView.js';
import { ExploreView } from './presentation/ui/explore/ExploreView.js';
import { SettingsView } from './presentation/ui/settings/SettingsView.js';
import { ShopView } from './presentation/ui/shop/ShopView.js';
import { ForgeView } from './presentation/ui/forge/ForgeView.js';
import { BestiaryView } from './presentation/ui/bestiary/BestiaryView.js';
import { CodexView } from './presentation/ui/codex/CodexView.js';

const DEBUG = false;

document.addEventListener('DOMContentLoaded', () => {
    if (DEBUG) console.log('RPG Village Initializing...');

    const appContainer = document.getElementById('app-container');
    const mainContent = document.getElementById('main-content');

    // 1. Save Slot Selection (pre-game)
    const saveSlotManager = new SaveSlotManager();

    appContainer.classList.add('slot-screen-mode');

    const slotView = new SaveSlotView(saveSlotManager, i18n, {
        onSelectSlot: (index) => {
            if (DEBUG) console.log(`Slot ${index} selected. Booting game...`);

            // Mark slot and boot
            persistence.setSlot(index);
            const slotMeta = saveSlotManager.listSlots()[index];
            if (!slotMeta.exists) {
                saveSlotManager.createSlot(index);
            }
            saveSlotManager.touchSlot(index);

            bootGame(index);
        },
        onDeleteSlot: (index) => {
            if (DEBUG) console.log(`Slot ${index} deleted.`);
            saveSlotManager.deleteSlot(index);
            slotView.render(mainContent);
        }
    });

    slotView.render(mainContent);

    function bootGame(slotIndex) {
        // Remove slot screen mode
        appContainer.classList.remove('slot-screen-mode');

        // 2. Initialize Engine (The Logic)
        const engine = new GameEngine();
        engine.initialize(); // Hydrate services from persistence
        window.engine = engine; // Expose for debugging/subagent

        // 3. Initialize UI Controller (The Components)
        const ui = new UIController(engine.i18n);
        ui.engine = engine;
        window.ui = ui; // Expose for debugging/subagent

        // Register Domain Views
        ui.registerView('village', new VillageView());
        ui.registerView('buildings', new BuildingsView());
        ui.registerView('heroes', new HeroesView());
        ui.registerView('inventory', new InventoryView());
        ui.registerView('explore', new ExploreView());
        ui.registerView('settings', new SettingsView());
        ui.registerView('shop', new ShopView());
        ui.registerView('forge', new ForgeView());
        ui.registerView('bestiary', new BestiaryView());
        ui.registerView('codex', new CodexView());

        // Set initial view
        ui.switchView('village');

        // Show Intro if it's a new game
        if (engine.isNewGame) {
            ui.showIntroDialog();
        }

        // 4. Initialize Adapter (The Orchestrator)
        const adapter = new EngineAdapter(engine, ui);

        // Start the loop
        adapter.init();

        if (DEBUG) console.log('RPG Village Ready!');
    }
});
