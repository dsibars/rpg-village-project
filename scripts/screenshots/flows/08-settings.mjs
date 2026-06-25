/**
 * Settings flow: main settings, magic circle simulator.
 */

import { waitForVisible, clickNav, clickSubNav } from '../utils/nav.mjs'
import { startNewGame } from '../utils/setup.mjs'
import { refreshUI } from '../utils/state-injector.mjs'
import { selectors } from '../selectors/selectors.mjs'


async function dismissAnyModal(page) {
  const closeBtn = await page.$('.modal-overlay .btn-close, .modal-frame .btn-close, .modal-close, button[aria-label="close"]')
  if (closeBtn) {
    await closeBtn.click().catch(() => {})
    await page.waitForTimeout(400)
  } else {
    const overlay = await page.$('.modal-overlay')
    if (overlay) {
      await overlay.click({ position: { x: 10, y: 10 } }).catch(() => {})
      await page.waitForTimeout(400)
    } else {
      await page.keyboard.press('Escape')
      await page.waitForTimeout(300)
    }
  }
  try {
    await page.waitForSelector('.modal-overlay', { state: 'hidden', timeout: 2000 })
  } catch { /* ignore */ }
}

export async function run({ page, snap, reset = true }) {

  await startNewGame(page, selectors, reset)

  // Build arcane_sanctum if not built
  await page.evaluate(() => {
    const e = window.__ENGINE__
    if (e?.villageService?.state?.infrastructure) {
      e.villageService.state.infrastructure.arcane_sanctum = 1
      e.villageService.save()
    }
  })
  await refreshUI(page)

  await clickNav(page, selectors.navSettings)
  await waitForVisible(page, selectors.settingsPanel, 3000)

  // --- settings_main ---
  await snap({ flow: 'settings', state: 'settings_main' })

  // --- settings_simulator ---
  await dismissAnyModal(page)
  const simBtn = await page.$(selectors.openMagicCircleBtn)
  if (simBtn) {
    await simBtn.click()
    await waitForVisible(page, selectors.magicCircleOverlay, 3000)
    await snap({ flow: 'settings', state: 'settings_simulator' })
  }
}
