const { GameEngine } = require('./js/engine/GameEngine.js');
const engine = new GameEngine();
engine.initialize();

console.log('Initial state:');
console.log('Farm level:', engine.villageService.getState().infrastructure.farm);
console.log('Presentation seen:', engine.presentationService.isSeen('pres_first_harvest'));
console.log('Pending presentations:', engine.presentationService.state.pendingPresentations);

// Add resources to build farm
engine.villageService.state.gold = 1000;
engine.inventoryService.addItem('material_wood', 100);
engine.inventoryService.addItem('material_stone', 100);

// Start farm construction
const result = engine.villageService.startProject('farm', 1, 50, { material_wood: 10, material_stone: 10 }, 1);
console.log('Start project result:', result);

console.log('Before nextDay:');
console.log('Construction queue:', engine.villageService.state.constructionQueue);
console.log('Farm level:', engine.villageService.getState().infrastructure.farm);

// Advance day
const report = engine.nextDay();
console.log('After nextDay:');
console.log('Daily report completed:', report.completed);
console.log('Farm level:', engine.villageService.getState().infrastructure.farm);
console.log('Pending presentations:', engine.presentationService.state.pendingPresentations);
console.log('Presentation seen:', engine.presentationService.isSeen('pres_first_harvest'));

// Check if pres_first_harvest is in pending
const isPending = engine.presentationService.state.pendingPresentations.includes('pres_first_harvest');
console.log('Is pres_first_harvest pending?', isPending);
