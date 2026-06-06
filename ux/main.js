import { createApp, shallowRef, ref } from 'vue'
import App from './App.vue'
import { createEngineAdapter } from './adapters/EngineAdapter.js'
import './core/theme.css'

/**
 * Creates and mounts the Vue application shell.
 *
 * This function is the bridge between the legacy engine and the new Vue UI.
 * It receives the engine instance and persistence managers from js/main.js
 * on switch day, wires up reactive state, starts the throttled game loop,
 * and returns the mounted app instance.
 *
 * @param {Object} options
 * @param {Object} options.engine - Legacy game engine instance
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

  // Throttled game loop: update reactive gameState at 10 FPS.
  // Also handles combat auto-advance (enemy turns + auto-battle).
  let lastUpdate = 0
  let lastCombatAdvanceTime = null
  const GAME_LOOP_INTERVAL = 100
  const COMBAT_ADVANCE_INTERVAL = 500
  let frameId = null

  function gameLoop(timestamp) {
    if (timestamp - lastUpdate >= GAME_LOOP_INTERVAL) {
      const newState = engine?.update() || {}

      // Combat Auto-Advance: when it's an enemy turn or auto-battle is on,
      // advance the battle every 500ms (matches legacy adapter behavior).
      if (newState.activeBattle && !newState.activeBattle.isOver) {
        const battle = newState.activeBattle
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

      gameState.value = newState
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
