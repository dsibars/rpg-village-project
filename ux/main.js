import { createApp, shallowRef, ref } from 'vue'
import App from './App.vue'
import { createEngineAdapter } from './adapters/EngineAdapter.js'
import { stateVersion } from '../js/engine/shared/core/Persistence.js'
import './core/theme.css'

/**
 * Creates and mounts the Vue application shell.
 *
 * It receives the engine instance and persistence managers from js/main.js,
 * wires up reactive state, starts the throttled game loop,
 * and returns the mounted app instance.
 *
 * @param {Object} options
 * @param {Object} options.engine - Game engine instance
 * @param {Object} options.persistence - Slot-aware Persistence instance
 * @param {Object} options.saveSlotManager - SaveSlotManager instance
 * @param {Element} options.container - DOM element to mount the app into
 * @returns {import('vue').App}
 */
export function createVueApp({ engine, persistence, saveSlotManager, container }) {
  const gameState = shallowRef(engine?.update() || {})
  const currentLanguage = ref(engine?.i18n?.getCurrentLanguage?.() || 'en')
  const adapter = createEngineAdapter(engine, gameState)

  const app = createApp(App, { engine, persistence, saveSlotManager })

  app.provide('engine', engine)
  app.provide('gameState', gameState)
  app.provide('adapter', adapter)
  app.provide('i18n', engine?.i18n)
  app.provide('currentLanguage', currentLanguage)

  app.config.errorHandler = (err, instance, info) => {
    console.error('Global Vue error:', err, info)
  }

  app.mount(container)

  // Expose engine and a manual UI refresh helper for screenshot automation and debugging.
  // This is safe: it's only used by test/audit tooling and does not affect gameplay.
  if (typeof window !== 'undefined') {
    window.__ENGINE__ = engine
    window.__REFRESH_UI__ = () => {
      gameState.value = engine?.update() || {}
    }
    // Restore screenshot-automation flags that survive page reloads.
    if (sessionStorage.getItem('__TUTORIAL_DISABLE_ENFORCE__') === '1') {
      window.__TUTORIAL_DISABLE_ENFORCE__ = true
    }
  }

  // Throttled game loop: sync reactive gameState at 10 FPS — but only when
  // the engine actually mutated (stateVersion), avoiding 10 full-state
  // serializations per second while idle. A 2s forced sync bounds the cost
  // of any mutation path that might bypass the version bump.
  // Also handles combat auto-advance (enemy turns + auto-battle).
  let lastUpdate = 0
  let lastCombatAdvanceTime = null
  let lastSyncedVersion = -1
  let lastForceSync = 0
  const GAME_LOOP_INTERVAL = 100
  const COMBAT_ADVANCE_INTERVAL = 500
  const FORCE_SYNC_INTERVAL = 2000
  let frameId = null

  function gameLoop(timestamp) {
    if (timestamp - lastUpdate >= GAME_LOOP_INTERVAL) {
      // Combat Auto-Advance: when it's an enemy turn or auto-battle is on,
      // advance the battle every 500ms. Each advanced turn logs events, which
      // bumps stateVersion and triggers a resync below.
      const battle = gameState.value?.activeBattle
      if (battle && !battle.isOver) {
        const activeActor = battle.turnOrder?.[battle.currentTurnIndex]
        const isHeroTurn = activeActor && activeActor.type === 'Hero'

        if (!isHeroTurn || battle.autoBattle) {
          const now = Date.now()
          if (!lastCombatAdvanceTime) {
            lastCombatAdvanceTime = now
          }
          if (now - lastCombatAdvanceTime >= COMBAT_ADVANCE_INTERVAL) {
            engine.nextBattleTurn?.()
            lastCombatAdvanceTime = now
          }
        } else {
          lastCombatAdvanceTime = null
        }
      } else {
        lastCombatAdvanceTime = null
      }

      // Resync only on mutation (or the safety-net interval)
      const forceDue = timestamp - lastForceSync >= FORCE_SYNC_INTERVAL
      if (stateVersion.value !== lastSyncedVersion || forceDue) {
        gameState.value = engine?.update() || {}
        lastSyncedVersion = stateVersion.value
        lastForceSync = timestamp
      }

      lastUpdate = timestamp
    }
    frameId = requestAnimationFrame(gameLoop)
  }

  if (engine) {
    frameId = requestAnimationFrame(gameLoop)
  }

  // Expose a clean unmount path for tests and hot-reload scenarios.
  app._rpgvillageUnmount = () => {
    if (frameId) cancelAnimationFrame(frameId)
    app.unmount()
  }

  return app
}
