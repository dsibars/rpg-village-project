const { GameEngine } = require('./js/engine/GameEngine.js')
const engine = new GameEngine()
engine.initialize()

// Test: Check if allNodes includes story missions
const regions = engine.regionService.getRegions()
console.log('Regions:', Object.keys(regions))

const greenfields = regions.reg_greenfields
console.log('Greenfields story missions:', greenfields.storyMissions?.map(m => m.id))

const expeditions = engine.expeditionService.getExpeditions()
console.log('Expeditions:', expeditions.map(e => e.id))

const completed = engine.expeditionService.getCompletedIds()
console.log('Completed:', completed)

// Check if exp_rescue_mission is available
const tutorialCave = expeditions.find(e => e.id === 'exp_tutorial_cave')
console.log('Tutorial cave status:', tutorialCave?.status)

const rescueMission = expeditions.find(e => e.id === 'exp_rescue_mission')
console.log('Rescue mission status:', rescueMission?.status)
console.log('Rescue mission parentId:', rescueMission?.parentId)
