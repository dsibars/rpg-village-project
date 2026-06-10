const { GameEngine } = require('./js/engine/GameEngine.js');
const engine = new GameEngine();
engine.initialize();

// Add resources and build farm
engine.villageService.state.gold = 1000;
engine.inventoryService.addItem('material_wood', 100);
engine.inventoryService.addItem('material_stone', 100);
engine.villageService.startProject('farm', 1, 50, { material_wood: 10, material_stone: 10 }, 1);

// Advance day
const report = engine.nextDay();

console.log('Pending presentations:', engine.presentationService.state.pendingPresentations);
console.log('Seen presentations:', engine.presentationService.state.seenPresentations);
console.log('Persisted state:', require('./js/engine/shared/core/Persistence.js').persistence.load('presentation_state'));
