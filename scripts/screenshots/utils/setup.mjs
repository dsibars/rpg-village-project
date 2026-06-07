/**
 * Shared setup helper: start a fresh new game and dismiss the intro.
 */

import { waitForVisible, clickElement } from './nav.mjs'

export async function startNewGame(page, version, selectors) {
  // Direct localStorage wipe: the save-slot registry and all slot data use this prefix.
  // We do this BEFORE reload so the page boots into a clean state.
  await page.evaluate(() => {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('rpg_village_v1_'))
      .forEach((k) => localStorage.removeItem(k))
  })
  await page.reload({ waitUntil: 'networkidle' })
  await waitForVisible(page, selectors.saveSlotScreen, 10000)

  // Click first empty slot
  const emptySlot = await page.$(selectors.emptySlot)
  const slotBtn = emptySlot || (await page.$$(selectors.saveSlot))[0]
  if (slotBtn) await slotBtn.click()

  // Wait for and dismiss intro
  await waitForVisible(page, selectors.introOverlay, 10000)
  await page.waitForTimeout(400)
  await clickElement(page, selectors.introSkip)

  // Wait for presentation overlay to fully leave the DOM (Vue transition takes ~400ms)
  await page.waitForSelector(selectors.introOverlay, { state: 'hidden', timeout: 5000 })
  await page.waitForTimeout(300)

  await waitForVisible(page, selectors.mainView, 10000)
}
