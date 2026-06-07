/**
 * Settings flow: main settings, magic circle simulator.
 */

import { waitForVisible, clickNav } from '../utils/nav.mjs'
import { startNewGame } from '../utils/setup.mjs'
import { refreshUI } from '../utils/state-injector.mjs'
import { v1Selectors as s1 } from '../selectors/v1.mjs'
import { v2Selectors as s2 } from '../selectors/v2.mjs'

function getSelectors(version) {
  return version === 'v1' ? s1 : s2
}

export async function run({ page, version, snap }) {
  const selectors = getSelectors(version)

  await startNewGame(page, version, selectors)

  // Build arcane_sanctum if not built
  const engineExpr = version === 'v1' ? 'window.engine' : 'window.__ENGINE__'
  await page.evaluate(({ engineExpr, buildingKey }) => {
    const getEngine = new Function(`return ${engineExpr}`)
    const e = getEngine()
    if (e?.villageService?.state?.infrastructure) {
      e.villageService.state.infrastructure[buildingKey] = 1
      e.villageService.save()
    }
  }, { engineExpr, buildingKey: 'arcane_sanctum' })
  await refreshUI(page, version)

  await clickNav(page, selectors.navSettings)
  await waitForVisible(page, selectors.settingsPanel, 3000)

  // --- settings_main ---
  await snap({ flow: 'settings', state: 'settings_main' })

  // --- settings_simulator ---
  const simBtn = await page.$(selectors.openMagicCircleBtn)
  if (simBtn) {
    await simBtn.click()
    await waitForVisible(page, selectors.magicCircleOverlay, 3000)
    await snap({ flow: 'settings', state: 'settings_simulator' })
  }
}
