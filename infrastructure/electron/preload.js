import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { contextBridge } = require('electron');

// Minimal, secure preload bridge.
// localStorage works natively in Electron, so no extra IPC is needed for game saves.
// This bridge is reserved for future native APIs (e.g. file system, notifications).
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
});
