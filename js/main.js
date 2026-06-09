import { createVueApp } from '../ux/main.js';
import { GameEngine } from './engine/GameEngine.js';
import { SaveSlotManager } from './engine/shared/core/SaveSlotManager.js';
import { persistence } from './engine/shared/core/Persistence.js';

const engine = new GameEngine();
const saveSlotManager = new SaveSlotManager();

createVueApp({
  engine,
  persistence,
  saveSlotManager,
  container: document.getElementById('app')
});
