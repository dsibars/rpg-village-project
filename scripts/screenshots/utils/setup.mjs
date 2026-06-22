/**
 * Shared setup helper: start a fresh new game and dismiss the intro.
 */

import { waitForVisible, clickElement } from './nav.mjs'

export async function startNewGame(page, selectors) {
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

  // Book auto-opens on new game (prologue content is a history_block)
  await waitForVisible(page, selectors.bookView, 10000)
  await page.waitForTimeout(400)

  // Navigate to village to dismiss Book and continue with tests
  await clickElement(page, selectors.navVillage)
  await page.waitForTimeout(500)

  await waitForVisible(page, selectors.mainView, 10000)
}
