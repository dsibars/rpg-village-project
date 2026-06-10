const { GameEngine } = require('./js/engine/GameEngine.js');
const { Persistence } = require('./js/engine/shared/core/Persistence.js');

// Test 1: Fresh game, build farm, check milestone
const engine1 = new GameEngine();
engine1.initialize();

engine1.villageService.state.gold = 1000;
engine1.inventoryService.addItem('material_wood', 100);
engine1.inventoryService.addItem('material_stone', 100);
engine1.villageService.startProject('farm', 1, 50, { material_wood: 10, material_stone: 10 }, 1);

const report1 = engine1.nextDay();
console.log('Test 1 - Fresh game:');
console.log('  Completed:', report1.completed);
console.log('  Pending:', engine1.presentationService.state.pendingPresentations);
console.log('  Seen:', engine1.presentationService.state.seenPresentations);

// Test 2: Simulate reload with slot
// First, save the state
engine1._persistPresentationState();
engine1.villageService.save();
engine1.heroService.saveAll();
engine1.inventoryService.save();

// Now simulate reloading with a slot
const engine2 = new GameEngine();
// In the browser, App.vue calls persistence.setSlot(index) then engine.initialize()
// We simulate this by calling initialize() directly
// The persistence module uses localStorage, which doesn't work in Node.js
// So we need to check if the engine2.presentationService has the state from engine1

// Since persistence doesn't work in Node.js, we test the logic differently:
// We check that initialize() reloads the presentationService from persistence
// In Node.js, persistence.load('presentation_state') returns null
// So we check that a new engine with default state has empty pending/seen
console.log('\nTest 2 - New engine (simulate reload):');
console.log('  Pending before init:', engine2.presentationService.state.pendingPresentations);
console.log('  Seen before init:', engine2.presentationService.state.seenPresentations);

engine2.initialize();
console.log('  Pending after init:', engine2.presentationService.state.pendingPresentations);
console.log('  Seen after init:', engine2.presentationService.state.seenPresentations);

// Test 3: Verify that building farm again triggers milestone
engine2.villageService.state.gold = 1000;
engine2.inventoryService.addItem('material_wood', 100);
engine2.inventoryService.addItem('material_stone', 100);
engine2.villageService.startProject('farm', 1, 50, { material_wood: 10, material_stone: 10 }, 1);

const report2 = engine2.nextDay();
console.log('\nTest 3 - Build farm after reload:');
console.log('  Completed:', report2.completed);
console.log('  Pending:', engine2.presentationService.state.pendingPresentations);
console.log('  Seen:', engine2.presentationService.state.seenPresentations);
