import { createApp } from 'vue'
import App from './App.vue'
import './core/theme.css'

/**
 * Mounts the Vue application.
 * This function is called by js/main.js on switch day.
 * For now, it exists only to prove the pipeline works.
 *
 * On switch day, this will:
 * 1. Receive the engine instance
 * 2. Provide engine, adapter, and i18n via Vue's provide/inject
 * 3. Mount the Vue app
 */
export function createVueApp({ engine, container }) {
  const app = createApp(App, { engine })

  // On switch day, these provides enable composables:
  // const gameState = shallowRef(engine.update())
  // const currentLanguage = ref(engine.i18n.getCurrentLanguage?.() || 'en')
  // app.provide('engine', engine)
  // app.provide('gameState', gameState)
  // app.provide('adapter', createAdapter(engine, gameState))
  // app.provide('i18n', engine.i18n)
  // app.provide('currentLanguage', currentLanguage)
  // app.config.errorHandler = (err, instance, info) => { ... }

  app.mount(container)
  return app
}
