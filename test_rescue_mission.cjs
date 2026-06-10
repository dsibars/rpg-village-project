const { GameEngine } = require('./js/engine/GameEngine.js');
const engine = new GameEngine();
engine.initialize();

console.log('=== Before completing tutorial cave ===');
const regions = engine.regionService.getRegions();
const greenfields = regions.reg_greenfields;
console.log('Available nodes:', greenfields.availableNodes.map(n => n.id));

// Simulate completing the tutorial cave
engine.expeditionService.state.completedIds.push('exp_tutorial_cave');
const result = engine.regionService.completeExpedition(
    'exp_tutorial_cave',
    ['hero1'],
    ['Arthur'],
    engine.expeditionService.state.completedIds
);

console.log('\n=== After completing tutorial cave ===');
console.log('Available nodes:', greenfields.availableNodes.map(n => ({ id: n.id, status: n.status, parentId: n.parentId })));
console.log('Injected missions:', result.injectedMissions);
console.log('Was first clear:', result.wasFirstClear);

// Check if exp_rescue_mission is available
const rescueMission = greenfields.availableNodes.find(n => n.id === 'exp_rescue_mission');
console.log('\nRescue mission found:', !!rescueMission);
if (rescueMission) {
    console.log('Rescue mission status:', rescueMission.status);
    console.log('Rescue mission parentId:', rescueMission.parentId);
}
