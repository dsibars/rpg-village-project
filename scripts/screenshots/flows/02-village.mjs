/**
 * Village flow: main view, construction, daily report, storage warning, recall report.
 */

import { waitForVisible, clickElement } from '../utils/nav.mjs'
import { startNewGame } from '../utils/setup.mjs'
import { triggerNextDay, setStorageFull, refreshUI } from '../utils/state-injector.mjs'
import { v1Selectors as s1 } from '../selectors/v1.mjs'
import { v2Selectors as s2 } from '../selectors/v2.mjs'

function getSelectors(version) {
  return version === 'v1' ? s1 : s2
}

export async function run({ page, version, snap }) {
  const selectors = getSelectors(version)

  await startNewGame(page, version, selectors)

  // --- village_main ---
  await snap({ flow: 'village', state: 'village_main' })

  // --- village_construction_active ---
  const engineExpr = version === 'v1' ? 'window.engine' : 'window.__ENGINE__'
  await page.evaluate(({ engineExpr }) => {
    const getEngine = new Function(`return ${engineExpr}`)
    const e = getEngine()
    if (!e?.villageService) return
    // Ensure we have enough wood for the farm project
    if (e.inventoryService?.addItem) {
      e.inventoryService.addItem('material_wood', 20, Infinity)
    }
    // Start a farm construction project (cost: 30 gold, 10 wood, 1 day)
    if (e.startProject) {
      e.startProject('farm', 1, 30, { material_wood: 10 }, 1)
    } else if (e.villageService?.startProject) {
      e.villageService.startProject('farm', 1, 30, { material_wood: 10 }, 1)
    }
  }, { engineExpr })
  await refreshUI(page, version)
  await snap({ flow: 'village', state: 'village_construction_active' })

  // --- village_storage_warning ---
  await setStorageFull(page, version, 0.95)
  await refreshUI(page, version)
  await snap({ flow: 'village', state: 'village_storage_warning' })

  // --- village_daily_report ---
  await triggerNextDay(page, version)
  // Wait for daily report modal to appear (Vue async + transition)
  await page.waitForTimeout(800)
  const reportVisible = await page.$(selectors.dailyReportModal)
  if (reportVisible) {
    await snap({ flow: 'village', state: 'village_daily_report' })
    const closeBtn = await page.$(selectors.modalCloseBtn)
    if (closeBtn) await closeBtn.click()
    await page.waitForTimeout(400)
  }

  // --- village_recall_report ---
  const recalled = await clickElement(page, '.btn-recall-report, .recall-report', { optional: true })
  if (recalled) {
    await page.waitForTimeout(400)
    const reportShown = await page.$(selectors.dailyReportModal)
    if (reportShown) {
      await snap({ flow: 'village', state: 'village_recall_report' })
    }
  }
}
